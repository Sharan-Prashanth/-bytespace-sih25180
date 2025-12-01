import os
import io
import json
import re
import asyncio
import random
from datetime import datetime
from typing import Dict, Any, Optional

import httpx
from fastapi import APIRouter, FastAPI, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse, StreamingResponse
from dotenv import load_dotenv

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, black
from reportlab.lib.utils import ImageReader

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from supabase import create_client, Client
import google.generativeai as genai

# Import the template generator
try:
    from .template_generator import generate_html_template, generate_json_template_data
except ImportError:
    # If running standalone, try direct import
    try:
        from template_generator import generate_html_template, generate_json_template_data
    except ImportError:
        # Fallback - define minimal functions
        def generate_html_template(proposal_data=None, scores=None):
            return "<html><body><h1>Template generator not available</h1></body></html>"
        def generate_json_template_data(proposal_data=None):
            return {}


# ============================================================
# ================ LOAD ENVIRONMENT ===========================
# ============================================================
load_dotenv()

APP_BASE = os.getenv("APP_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY6")

HEADER_BUCKET = os.getenv("HEADER_BUCKET", "assets")
HEADER_FILENAME = os.getenv("HEADER_FILENAME", "coal_header.png")
REPORT_BUCKET = os.getenv("REPORT_BUCKET", "reports")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Set SUPABASE_URL and SUPABASE_KEY")

if not GEMINI_API_KEY:
    raise Exception("Set GEMINI_API_KEY")

# supabase + gemini init
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_API_KEY)

router = APIRouter()
app = FastAPI()
app.include_router(router)

# ============================================================
# ===================== TEXT CLEANER ==========================
# ============================================================
def sanitize_text(txt: Optional[str]) -> str:
    if not txt:
        return ""
    txt = re.sub(r"\*\*+", "", txt)
    txt = re.sub(r"`+", "", txt)
    txt = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", txt)
    lines = [ln.strip() for ln in txt.splitlines()]
    clean = "\n".join([ln for ln in lines if ln])
    clean = re.sub(r"[ \t]{2,}", " ", clean)
    return clean.strip()


# ============================================================
# ================ FETCH PROPOSAL DATA ======================
# ============================================================
async def fetch_proposal_data(proposal_id: str) -> Dict[str, Any]:
    """Fetch proposal data from the server API"""
    try:
        # Try different possible server URLs
        possible_bases = [
            APP_BASE.replace(':8000', ':3000'),
            "http://localhost:3000",
            "http://127.0.0.1:3000"
        ]
        
        for base_url in possible_bases:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    url = f"{base_url}/api/proposals/{proposal_id}"
                    print(f"Attempting to fetch proposal from: {url}")
                    response = await client.get(url)
                    if response.status_code == 200:
                        data = response.json()
                        print(f"Successfully fetched proposal data from: {url}")
                        return data.get('data', {})
                    else:
                        print(f"Failed to fetch from {url}, status: {response.status_code}")
            except Exception as e:
                print(f"Error with URL {base_url}: {e}")
                continue
        
        print("All proposal fetch attempts failed")
        return {}
    except Exception as e:
        print(f"Error fetching proposal data: {e}")
        return {}


# ============================================================
# ========== POST FILE TO MICROSERVICES IN PARALLEL ===========
# ============================================================
async def post_file_to_route(client, route, filename, file_bytes, timeout=120.0):
    url = APP_BASE + route
    files = {"file": (filename, file_bytes, "application/octet-stream")}
    try:
        r = await client.post(url, files=files, timeout=timeout)
        try:
            body = r.json()
        except:
            body = {"_raw_text": r.text}
        return {"ok": True, "route": route, "status": r.status_code, "json": body}
    except Exception as e:
        return {"ok": False, "route": route, "error": str(e)}


# ============================================================
# =================== SCORE COMPUTATION =======================
# ============================================================
def replace_non_numeric(s):
    return re.sub(r"[^\d\.]", "", str(s or ""))


def safe_get(d: Dict[str, Any], *keys, default=None):
    cur = d
    for k in keys:
        if isinstance(cur, dict) and k in cur:
            cur = cur[k]
        else:
            return default
    return cur


def compute_scores(mod_outputs: Dict[str, Any]) -> Dict[str, Any]:

    # plagiarism percent
    plag_pct = safe_get(mod_outputs.get("/check-plagiarism-final", {}), "plagiarism_percentage") \
        or safe_get(mod_outputs.get("/check-plagiarism-final", {}), "plagiarism")

    try:
        plag_pct = float(replace_non_numeric(plag_pct)) if plag_pct else None
    except:
        plag_pct = None

    # AI percent
    ai_pct = safe_get(mod_outputs.get("/detect-ai-and-validate", {}),
                "ai_sentences_percentage_by_gemini") \
        or safe_get(mod_outputs.get("/detect-ai-and-validate", {}), "ai_percentage")
    try:
        ai_pct = float(replace_non_numeric(ai_pct)) if ai_pct else None
    except:
        ai_pct = None

    # novelty
    novelty_pct = safe_get(mod_outputs.get("/novelty-checks", {}), "novelty_percentage")
    try:
        novelty_pct = float(replace_non_numeric(novelty_pct)) if novelty_pct else None
    except:
        novelty_pct = None

    # cost
    cost_value = safe_get(mod_outputs.get("/process-and-estimate", {}), "estimated_cost")
    try:
        cost_value = float(replace_non_numeric(cost_value)) if cost_value else None
    except:
        cost_value = None

    # timeline length
    timeline_list = safe_get(mod_outputs.get("/timeline", {}), "timeline", default=[])
    timeline_len = len(timeline_list) if isinstance(timeline_list, list) else None

    # subscores
    plag_sub = 100 if plag_pct is None else max(0, 100 - plag_pct)
    ai_sub = 100 if ai_pct is None else max(0, 100 - ai_pct)
    novelty_sub = 50 if novelty_pct is None else max(0, min(100, novelty_pct))

    if cost_value is None:
        cost_sub = 60
    else:
        c = cost_value
        if c <= 50_000:
            cost_sub = 90
        elif c <= 200_000:
            cost_sub = 70
        elif c <= 1_000_000:
            cost_sub = 40
        else:
            cost_sub = 10

    if timeline_len is None:
        timeline_sub = 60
    else:
        if timeline_len <= 4:
            timeline_sub = 90
        elif timeline_len <= 8:
            timeline_sub = 70
        else:
            timeline_sub = 40

    weights = {"plag": 0.28, "ai": 0.28, "nov": 0.22, "cost": 0.12, "time": 0.10}

    overall = (
        plag_sub * weights["plag"] +
        ai_sub * weights["ai"] +
        novelty_sub * weights["nov"] +
        cost_sub * weights["cost"] +
        timeline_sub * weights["time"]
    )
    overall = max(0, min(100, overall))

    return {
        "subscores": {
            "plagiarism_subscore": round(plag_sub, 1),
            "ai_subscore": round(ai_sub, 1),
            "novelty_subscore": round(novelty_sub, 1),
            "cost_subscore": round(cost_sub, 1),
            "timeline_subscore": round(timeline_sub, 1),
        },
        "overall_score": round(overall, 1),
        "raw_inputs": {
            "plag_pct": plag_pct,
            "ai_pct": ai_pct,
            "novelty_pct": novelty_pct,
            "cost_value": cost_value,
            "timeline_len": timeline_len
        }
    }


# ============================================================
# ================== PROCESS PROPOSAL DATA ===================
# ============================================================
def process_proposal_data(proposal_data: Dict[str, Any]) -> Dict[str, Any]:
    """Process and extract relevant data from proposal for PDF generation"""
    
    # Extract form I data if available
    form_i_data = proposal_data.get('forms', {}).get('formI', {})
    
    # If form_i_data is empty, try to get basic proposal data
    if not form_i_data:
        form_i_data = {
            "form_type": "FORM-I S&T Grant Proposal",
            "basic_information": {
                "project_title": proposal_data.get('title', 'Untitled Project'),
                "principal_implementing_agency": proposal_data.get('principalAgency'),
                "project_leader_name": proposal_data.get('projectLeader'),
                "sub_implementing_agency": ', '.join(proposal_data.get('subAgencies', [])),
                "co_investigator_name": proposal_data.get('projectCoordinator'),
                "submission_date": proposal_data.get('createdAt', ''),
                "project_duration": proposal_data.get('durationMonths')
            },
            "project_details": {
                "definition_of_issue": "",
                "objectives": "",
                "justification_subject_area": "",
                "project_benefits": "",
                "work_plan": "",
                "methodology": "",
                "organization_of_work": "",
                "time_schedule": "",
                "foreign_exchange_details": ""
            },
            "cost_breakdown": {
                "total_project_cost": {
                    "total": proposal_data.get('outlayLakhs'),
                }
            }
        }
    
    # Calculate total costs if available
    cost_breakdown = form_i_data.get('cost_breakdown', {})
    total_cost = 0
    
    # Sum up capital expenditure
    cap_exp = cost_breakdown.get('capital_expenditure', {})
    for item in ['land_building', 'equipment']:
        if item in cap_exp:
            for year in ['year1', 'year2', 'year3']:
                value = cap_exp[item].get(year)
                if value and str(value).replace('.', '').isdigit():
                    total_cost += float(value)
    
    # Sum up revenue expenditure
    rev_exp = cost_breakdown.get('revenue_expenditure', {})
    for item in ['salaries', 'consumables', 'travel', 'workshop_seminar']:
        if item in rev_exp:
            for year in ['year1', 'year2', 'year3']:
                value = rev_exp[item].get(year)
                if value and str(value).replace('.', '').isdigit():
                    total_cost += float(value)
    
    return {
        'form_data': form_i_data,
        'proposal_basic': proposal_data,
        'calculated_totals': {
            'total_cost': total_cost,
            'duration': form_i_data.get('basic_information', {}).get('project_duration') or proposal_data.get('durationMonths', 0)
        }
    }


# ============================================================
# ====================== GEMINI PROMPT ========================
# ============================================================
def build_gemini_scoring_prompt(all_module_json, computed_scores, proposal_data=None):

    modules_str = json.dumps(all_module_json, ensure_ascii=False, indent=2)[:10000]
    scores_str = json.dumps(computed_scores, ensure_ascii=False, indent=2)

    prompt = f"""
You are a Senior Research Project Auditor.

Your job is to validate computed scores and produce **detailed explanations** for all 6 pages of the report.

================= REQUIRED STRUCTURE =================

PAGE 1 — EXECUTIVE SUMMARY + FULL SCORE BREAKDOWN
- Show each sub-score clearly:
    • Plagiarism Score  
    • AI Score  
    • Novelty Score  
    • Cost Score  
    • Timeline Score  
    • Final Overall Score  

- Then include a section titled:
  **“WHY THESE SCORES?”**
  Give point-by-point detailed explanations:
    • Why plagiarism score is this value  
    • Why AI score is this value  
    • Why novelty score is this value  
    • Why cost score is this value  
    • Why timeline score is this value  
    • Why final overall score is this value  

PAGE 2 — AI DETECTION (DETAILED)
- Show AI score.
- List flagged sentences if they exist.
- Section titled **“WHY THIS AI SCORE?”**
- Bullet-point, multi-level, detailed reasoning.

PAGE 3 — PLAGIARISM (DETAILED)
- Show plagiarism score.
- Show suspicious lines, sources.
- Section **“WHY THIS PLAGIARISM SCORE?”**

PAGE 4 — NOVELTY (DETAILED)
- Novelty score + findings.
- Section **“WHY THIS NOVELTY SCORE?”**

PAGE 5 — COST (DETAILED)
- Estimated cost.
- Section **“WHY THIS COST SCORE?”**

PAGE 6 — TIMELINE (DETAILED)
- Timeline score.
- Section **“WHY THIS TIMELINE SCORE?”**

OUTPUT FORMAT:
Return ONLY valid JSON in this exact structure:

{{
 "validated_scores": {{
    "ai_score": 0,
    "plagiarism_score": 0,
    "novelty_score": 0,
    "cost_score": 0,
    "timeline_score": 0,
    "final_overall_score": 0,
    "justification": ""
 }},
 "pages": {{
   "page1": {{"title":"", "content":""}},
   "page2": {{"title":"", "content":""}},
   "page3": {{"title":"", "content":""}},
   "page4": {{"title":"", "content":""}},
   "page5": {{"title":"", "content":""}},
   "page6": {{"title":"", "content":""}}
 }},
 "short_recommendations": []
}}

===========================================================
MODULE OUTPUTS:
{modules_str}

INITIAL SCORES:
{scores_str}

PROPOSAL DATA:
{proposal_str}
===========================================================
"""
    return prompt


# ============================================================
# ======================= JSON PARSER ========================
# ============================================================
def safe_parse_json_from_text(txt: str):
    if not txt:
        return {}
    txt = txt.strip()
    try:
        return json.loads(txt)
    except:
        pass
    start = txt.find("{")
    end = txt.rfind("}")
    if start != -1 and end != -1:
        try:
            return json.loads(txt[start:end+1])
        except:
            return {}
    return {}


# ============================================================
# ======================= PDF BORDER =========================
# ============================================================
def draw_page_border(c, width, height, margin=15*mm):
    c.setLineWidth(1.5)
    c.setStrokeColor(HexColor("#000000"))
    c.rect(margin, margin, width - 2*margin, height - 2*margin)


# ============================================================
# =================== FETCH HEADER IMAGE =====================
# ============================================================
def fetch_header_bytes():
    try:
        data = supabase.storage.from_(HEADER_BUCKET).download(HEADER_FILENAME)
        if data:
            return data
    except:
        pass
    return None


# ============================================================
# ====================== PDF RENDERING =======================
# ============================================================
def draw_circular_seal(c, cx, cy, radius, score_text):
    c.setLineWidth(2)
    c.setStrokeColor(HexColor("#0b3d91"))
    c.circle(cx, cy, radius)
    c.circle(cx, cy, radius * 0.8)
    c.setFillColor(HexColor("#0b3d91"))
    c.setFont("Times-Bold", int(radius * 0.45))
    c.drawCentredString(cx, cy - (radius * 0.15), score_text)


def make_pdf_bytes(pages, overall_score, filename_short, header_bytes, proposal_data=None):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    margin = 15 * mm
    padding = 6 * mm
    
    # Extract proposal information
    project_title = "Unknown Project"
    principal_agency = "Unknown Agency"
    project_leader = "Unknown Leader"
    duration = "Unknown"
    total_cost = "Unknown"
    
    if proposal_data and 'form_data' in proposal_data:
        form_data = proposal_data['form_data']
        basic_info = form_data.get('basic_information', {})
        project_title = basic_info.get('project_title', project_title)
        principal_agency = basic_info.get('principal_implementing_agency', principal_agency)
        project_leader = basic_info.get('project_leader_name', project_leader)
        duration = str(basic_info.get('project_duration', duration)) + " months" if basic_info.get('project_duration') else duration
        total_cost = f"₹{proposal_data.get('calculated_totals', {}).get('total_cost', 0):.2f} lakhs"

    # compute header drawing parameters (so we can reserve space)
    header_height = 0
    header_draw_params = None
    if header_bytes:
        try:
            img = ImageReader(io.BytesIO(header_bytes))
            iw, ih = img.getSize()
            desired_w = width - 2 * margin - (padding * 2)
            scale = desired_w / iw if iw > 0 else 1.0
            h_draw = ih * scale
            header_height = min(h_draw, 40 * mm)  # cap header height
            header_draw_params = (img, desired_w, header_height)
        except:
            header_height = 0

    def draw_header_footer(page_num):
        # header
        if header_draw_params:
            try:
                img, desired_w, h_draw = header_draw_params
                x = margin + padding
                y = height - margin - h_draw
                c.drawImage(img, x, y, desired_w, h_draw, mask='auto')
            except:
                pass

        # footer
        c.setFont("Times-Roman", 10)
        c.setFillColor(HexColor("#444444"))
        c.drawCentredString(width / 2, margin / 2, f"Generated by Bytespace Evaluator — Page {page_num} of 6")

    def render_text_box(c, text_str, x, y_top, box_w, box_h, font_name="Times-Roman", start_font=12, min_font=8, leading_ratio=1.2):
        # Try to fit text by reducing font size; wrap using pdfmetrics widths
        text_str = text_str or ""
        paragraphs = [p.strip() for p in text_str.split("\n") if p.strip()]

        for font_size in range(start_font, min_font - 1, -1):
            lines = []
            for para in paragraphs:
                # wrap paragraph into lines that fit box_w
                cur = ""
                for word in para.split():
                    test = (cur + " " + word).strip()
                    w = pdfmetrics.stringWidth(test, font_name, font_size)
                    if w <= box_w - 2:
                        cur = test
                    else:
                        if cur:
                            lines.append(cur)
                        cur = word
                if cur:
                    lines.append(cur)
                lines.append("")

            line_height = font_size * leading_ratio
            needed_h = len(lines) * line_height
            if needed_h <= box_h:
                # render
                c.setFont(font_name, font_size)
                text_obj = c.beginText(x, y_top)
                text_obj.setLeading(line_height)
                for ln in lines:
                    text_obj.textLine(ln)
                c.drawText(text_obj)
                return True

        # couldn't fit even at min_font - truncate to fit box
        # approximate how many lines fit
        c.setFont(font_name, min_font)
        line_height = min_font * leading_ratio
        max_lines = max(1, int(box_h // line_height))
        out_lines = []
        for para in paragraphs:
            words = para.split()
            cur = ""
            for word in words:
                test = (cur + " " + word).strip()
                if pdfmetrics.stringWidth(test, font_name, min_font) <= box_w - 2:
                    cur = test
                else:
                    if cur:
                        out_lines.append(cur)
                    cur = word
                if len(out_lines) >= max_lines - 1:
                    break
            if cur and len(out_lines) < max_lines:
                out_lines.append(cur)
            if len(out_lines) >= max_lines:
                break

        # ensure last line ends with ellipsis
        if out_lines:
            if len(out_lines) >= max_lines:
                out_lines = out_lines[:max_lines]
                out_lines[-1] = out_lines[-1].rstrip() + " ..."

        # render truncated
        text_obj = c.beginText(x, y_top)
        text_obj.setLeading(line_height)
        c.setFont(font_name, min_font)
        for ln in out_lines:
            text_obj.textLine(ln)
        c.drawText(text_obj)
        return False

    # PAGE 1
    p1 = pages.get("page1", {})
    title1 = p1.get("title", "Executive Summary")
    content1 = sanitize_text(p1.get("content", ""))
    
    # Add proposal information to page 1 content if available
    if proposal_data and 'form_data' in proposal_data:
        form_data = proposal_data['form_data']
        basic_info = form_data.get('basic_information', {})
        project_details = form_data.get('project_details', {})
        
        proposal_info = f"""
        
PROJECT INFORMATION:
• Title: {project_title}
• Principal Agency: {principal_agency or 'Not specified'}
• Project Leader: {project_leader or 'Not specified'}
• Duration: {duration}
• Total Cost: {total_cost}

PROJECT OVERVIEW:
• Issue Definition: {project_details.get('definition_of_issue', 'Not provided')[:200]}...
• Objectives: {project_details.get('objectives', 'Not provided')[:200]}...
• Benefits: {project_details.get('project_benefits', 'Not provided')[:200]}...
        """
        content1 = content1 + proposal_info

    draw_header_footer(1)
    draw_page_border(c, width, height, margin)

    # circular seal (place inside right margin)
    seal_radius = 38 * mm
    seal_cx = width - margin - seal_radius - padding
    seal_cy = height - margin - (header_height / 2 if header_height else 95 * mm)
    draw_circular_seal(c, seal_cx, seal_cy, seal_radius, f"{int(round(overall_score))}%")

    # title
    title_x = margin + padding
    title_y = height - margin - (header_height + 6 * mm)
    c.setFont("Times-Bold", 18)
    c.drawString(title_x, title_y, title1)

    # content block box
    content_x = margin + padding
    content_w = width - 2 * margin - (padding * 2) - seal_radius * 2
    content_top = title_y - 12
    content_h = content_top - margin - 10 * mm

    if content_w < 50 * mm:
        content_w = width - 2 * margin - (padding * 2)

    render_text_box(c, content1, content_x, content_top, content_w, content_h, start_font=12)
    c.showPage()

    # PAGES 2-6
    for i in range(2, 7):
        page = pages.get(f"page{i}", {})
        title = page.get("title", f"Page {i}")
        content = sanitize_text(page.get("content", ""))

        draw_header_footer(i)
        draw_page_border(c, width, height, margin)

        title_x = margin + padding
        title_y = height - margin - (header_height + 4 * mm)
        c.setFont("Times-Bold", 16)
        c.drawString(title_x, title_y, title)

        content_x = margin + padding
        content_w = width - 2 * margin - (padding * 2)
        content_top = title_y - 12
        content_h = content_top - margin - 6 * mm

        render_text_box(c, content, content_x, content_top, content_w, content_h, start_font=12)
        c.showPage()

    c.save()
    buffer.seek(0)
    return buffer.read()


# ============================================================
# ======================== MAIN API ==========================
# ============================================================
@router.post("/report-gen")
async def authenticator_endpoint(file: UploadFile = File(...), proposal_id: Optional[str] = Query(None)):

    try:
        filename = file.filename or f"paper_{datetime.utcnow().isoformat()}"
        file_bytes = await file.read()
        
        # Fetch proposal data if proposal_id is provided
        proposal_data = None
        if proposal_id:
            proposal_raw = await fetch_proposal_data(proposal_id)
            if proposal_raw:
                proposal_data = process_proposal_data(proposal_raw)

        routes = [
            "/timeline",
            "/check-plagiarism-final",
            "/novelty-checks",
            "/process-and-estimate",
            "/detect-ai-and-validate"
        ]

        async with httpx.AsyncClient(timeout=120) as client:
            tasks = [post_file_to_route(client, r, filename, file_bytes) for r in routes]
            results = await asyncio.gather(*tasks)

        modules_out = {}
        for r in results:
            if r["ok"]:
                modules_out[r["route"]] = r["json"]
            else:
                modules_out[r["route"]] = {"error": r.get("error")}

        computed = compute_scores(modules_out)

        # gemini prompt + response (with retry on quota / 429)
        prompt = build_gemini_scoring_prompt(modules_out, computed, proposal_data)
        model = genai.GenerativeModel("gemini-2.5-flash-lite")

        # Automatic retry on quota exceeded / 429 responses
        max_retries = 3
        gem_out = {}

        for attempt in range(max_retries):
            try:
                resp = model.generate_content(prompt)
                gem_out = safe_parse_json_from_text(resp.text)
                break  # success
            except Exception as e:
                error_msg = str(e)

                # try to extract a suggested retry delay from the error text
                parsed_delay = None
                m = re.search(r"Please retry in ([\d\.]+)s", error_msg)
                if not m:
                    m = re.search(r"retry_delay\s*\{[^}]*seconds\s*:\s*(\d+)", error_msg)
                if m:
                    try:
                        parsed_delay = float(m.group(1))
                    except:
                        parsed_delay = None

                # choose sleep time: prefer provider suggestion but cap it
                if parsed_delay is not None:
                    sleep_seconds = min(parsed_delay, 20)
                else:
                    # exponential backoff: 2,4,8... capped
                    sleep_seconds = min(2 * (2 ** attempt), 20)

                # small jitter to avoid thundering herd
                sleep_seconds = sleep_seconds + random.uniform(0, 1)

                # if it's a quota/429-like error, retry up to max_retries
                if "quota" in error_msg.lower() or "429" in error_msg:
                    if attempt < max_retries - 1:
                        await asyncio.sleep(sleep_seconds)
                        continue
                    else:
                        # retries exhausted — fall back to computed scores
                        gem_out = {}
                else:
                    # non-rate-limit error — do not retry
                    gem_out = {}
                    break

        validated_scores = gem_out.get("validated_scores", {
            "ai_score": computed["subscores"]["ai_subscore"],
            "plagiarism_score": computed["subscores"]["plagiarism_subscore"],
            "novelty_score": computed["subscores"]["novelty_subscore"],
            "cost_score": computed["subscores"]["cost_subscore"],
            "timeline_score": computed["subscores"]["timeline_subscore"],
            "final_overall_score": computed["overall_score"],
            "justification": ""
        })

        pages = gem_out.get("pages", {})
        for i in range(1, 7):
            if f"page{i}" not in pages:
                pages[f"page{i}"] = {"title": f"Page {i}", "content": "No content generated."}

        short_recs = gem_out.get("short_recommendations", [])

        header_bytes = fetch_header_bytes()
        overall_score = validated_scores.get("final_overall_score", computed["overall_score"])

        pdf_bytes = make_pdf_bytes(
            pages,
            float(overall_score),
            filename.rsplit(".", 1)[0],
            header_bytes,
            proposal_data
        )

        # upload to supabase storage
        safe_name = re.sub(r"[<>:\"/\\|?*]+", "_", filename.rsplit(".", 1)[0]) + ".authenticator.pdf"

        try:
            supabase.storage.from_(REPORT_BUCKET).upload(safe_name, pdf_bytes, {"content-type": "application/pdf"})
            upload_ok = True
        except:
            upload_ok = False

        public_url = supabase.storage.from_(REPORT_BUCKET).get_public_url(safe_name)

        # Try to extract a plain URL if Supabase returned a dict
        public_url_value = None
        try:
            if isinstance(public_url, dict):
                public_url_value = public_url.get("publicURL") or public_url.get("publicUrl") or public_url.get("public_url")
            else:
                public_url_value = str(public_url)
        except:
            public_url_value = None

        # Return the PDF directly as a download. Include Supabase URL in headers if available.
        pdf_stream = io.BytesIO(pdf_bytes)
        headers = {}
        if public_url_value:
            headers["X-Report-URL"] = public_url_value

        disposition_name = safe_name
        return StreamingResponse(pdf_stream, media_type="application/pdf", headers={**headers, "Content-Disposition": f'attachment; filename="{disposition_name}"'})

    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)}, status_code=500)


@router.get("/test-proposal/{proposal_id}")
async def test_proposal_data(proposal_id: str):
    """Test endpoint to check proposal data fetching"""
    try:
        proposal_data = await fetch_proposal_data(proposal_id)
        if proposal_data:
            processed_data = process_proposal_data(proposal_data)
            return JSONResponse({
                "ok": True, 
                "proposal_id": proposal_id,
                "raw_data": proposal_data,
                "processed_data": processed_data,
                "template_data": generate_json_template_data(processed_data)
            })
        else:
            return JSONResponse({
                "ok": False, 
                "error": "No proposal data found",
                "proposal_id": proposal_id
            })
    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)}, status_code=500)


@router.get("/preview-template")
async def preview_template(proposal_id: Optional[str] = Query(None)):
    """Preview the HTML template with proposal data"""
    try:
        proposal_data = None
        scores = {
            "overall_score": 75,
            "subscores": {
                "novelty_subscore": 80,
                "ai_subscore": 85,
                "plagiarism_subscore": 90,
                "cost_subscore": 70,
                "timeline_subscore": 65
            }
        }
        
        if proposal_id:
            proposal_raw = await fetch_proposal_data(proposal_id)
            if proposal_raw:
                proposal_data = process_proposal_data(proposal_raw)
        
        html_content = generate_html_template(proposal_data, scores)
        return JSONResponse({
            "ok": True,
            "html": html_content,
            "has_proposal_data": proposal_data is not None
        })
    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)}, status_code=500)


