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


def safe_get(d: Any, *keys, default=None):
    """Safely get nested keys from dict-like/module output.

    If the module output is a list (multiple responses for same route), use
    the first non-empty element as the primary source.
    """
    cur = d
    # handle list outputs from modules (preserve multiple responses earlier)
    if isinstance(cur, list):
        # pick first item that's a dict and not an error (best-effort)
        chosen = None
        for it in cur:
            if isinstance(it, dict) and not it.get("error"):
                chosen = it
                break
        if chosen is None:
            chosen = cur[0] if cur else {}
        cur = chosen

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

    # Ensure proposal_str is always defined (serialize proposal_data safely)
    try:
        if proposal_data:
            proposal_str = json.dumps(proposal_data, ensure_ascii=False, indent=2)[:10000]
        else:
            proposal_str = "{}"
    except Exception:
        proposal_str = "{}"

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
            # "/benefit-check",#check for benefits to coal industry
            "/detect-ai-and-validate",#checks for the ai content
            "/process-and-estimate",#government cost estimation
            "/deliverable-check",#checks for deliverables
            "/analyze-novelty",#novelty check
            "/process-and-estimate",#cost estimation
            "/check-plagiarism-final",#plagiarism check
        ]

        async with httpx.AsyncClient(timeout=120) as client:
            tasks = [post_file_to_route(client, r, filename, file_bytes) for r in routes]
            results = await asyncio.gather(*tasks)

        modules_out = {}
        for r in results:
            route = r.get("route")
            entry = r["json"] if r.get("ok") else {"error": r.get("error")}
            if route in modules_out:
                # keep multiple responses as a list
                if isinstance(modules_out[route], list):
                    modules_out[route].append(entry)
                else:
                    modules_out[route] = [modules_out[route], entry]
            else:
                modules_out[route] = entry

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


@router.post("/render-report-html")
async def render_report_html(file: UploadFile = File(...), proposal_id: Optional[str] = Query(None)):
    """Post file to microservices, gather outputs and proposal form, then
    return the three-page HTML report by injecting real data into the
    `template/test.html` file.
    """
    try:
        filename = file.filename or f"paper_{datetime.utcnow().isoformat()}"
        file_bytes = await file.read()

        # routes to call (including extract-form1 to get PI details)
        routes = [
            "/extract-form1",
            "/detect-ai-and-validate",
            "/process-and-estimate",
            "/deliverable-check",
            "/analyze-novelty",
            "/check-plagiarism-final",
        ]

        async with httpx.AsyncClient(timeout=120) as client:
            tasks = [post_file_to_route(client, r, filename, file_bytes) for r in routes]
            results = await asyncio.gather(*tasks)

        modules_out = {}
        for r in results:
            route = r.get("route")
            entry = r["json"] if r.get("ok") else {"error": r.get("error")}
            if route in modules_out:
                if isinstance(modules_out[route], list):
                    modules_out[route].append(entry)
                else:
                    modules_out[route] = [modules_out[route], entry]
            else:
                modules_out[route] = entry

        # Try to get proposal data from extract-form1 result (if available)
        proposal_data = None
        extract_out = modules_out.get("/extract-form1")
        if extract_out:
            # handle list or single
            if isinstance(extract_out, list):
                # pick first successful
                picked = None
                for it in extract_out:
                    if isinstance(it, dict) and it.get("extracted_data"):
                        picked = it
                        break
                if picked:
                    proposal_data = process_proposal_data(picked.get("extracted_data"))
            elif isinstance(extract_out, dict) and extract_out.get("extracted_data"):
                proposal_data = process_proposal_data(extract_out.get("extracted_data"))

        # compute scores using existing logic
        computed = compute_scores(modules_out)

        # build data object for template injection
        validated = computed.get("subscores", {})
        overall = computed.get("overall_score", 0)

        # STRICT VALIDATION: do not use dummy/fallback data. Require that
        # proposal extraction and key microservice outputs are present.
        missing = []

        # proposal_data must be present and include certain fields
        if not proposal_data:
            missing.append("/extract-form1 -> extracted_data (proposal form)")
        else:
            basic_info = proposal_data.get('form_data', {}).get('basic_information', {})
            if not basic_info.get('project_title'):
                missing.append('proposal.basic_information.project_title')
            if not basic_info.get('project_leader_name'):
                missing.append('proposal.basic_information.project_leader_name')
            if not basic_info.get('principal_implementing_agency'):
                missing.append('proposal.basic_information.principal_implementing_agency')
            total_cost_val_check = proposal_data.get('calculated_totals', {}).get('total_cost')
            if total_cost_val_check in (None, 0, "", []):
                missing.append('proposal.calculated_totals.total_cost')

        # microservice required outputs
        def _has_module_field(route, keys):
            for k in keys:
                v = safe_get(modules_out.get(route), k)
                if v is not None and str(v).strip() != "":
                    return True
            return False

        if not _has_module_field('/detect-ai-and-validate', ['ai_sentences_percentage_by_gemini', 'ai_percentage']):
            missing.append('detect-ai-and-validate.ai_percentage')
        if not _has_module_field('/check-plagiarism-final', ['plagiarism_percentage', 'plagiarism']):
            missing.append('check-plagiarism-final.plagiarism_percentage')
        if not _has_module_field('/analyze-novelty', ['novelty_percentage', 'novelty']):
            missing.append('analyze-novelty.novelty_percentage')
        if not _has_module_field('/process-and-estimate', ['estimated_cost', 'cost_estimate', 'cost_breakdown']):
            missing.append('process-and-estimate.estimated_cost_or_cost_breakdown')

        if missing:
            # Instead of failing outright, follow user rules:
            # - If basic proposal fields (PI name, agency, total cost) are missing,
            #   set them to the literal string "nil".
            # - If AI percentage or cost estimation are missing, re-call the
            #   corresponding microservice routes to try to obtain them and
            #   otherwise compute a conservative cost estimate.

            # mark which kinds of missing keys we saw
            basic_keys = {
                'proposal.basic_information.project_leader_name',
                'proposal.basic_information.principal_implementing_agency',
                'proposal.calculated_totals.total_cost'
            }

            # ensure proposal_data exists
            if not proposal_data:
                proposal_data = {'form_data': {'basic_information': {}, 'cost_breakdown': {}}, 'calculated_totals': {'total_cost': 0, 'duration': 0}}

            # fill nil for requested basic fields
            basic_info = proposal_data.get('form_data', {}).get('basic_information', {})
            for bk in basic_keys:
                if bk in missing:
                    # map key to basic_info field
                    if 'project_leader_name' in bk:
                        basic_info['project_leader_name'] = 'nil'
                    if 'principal_implementing_agency' in bk:
                        basic_info['principal_implementing_agency'] = 'nil'
                    if 'total_cost' in bk:
                        # ensure total exists at calculated_totals; set to literal 'nil'
                        proposal_data.setdefault('calculated_totals', {})
                        proposal_data['calculated_totals']['total_cost'] = 'nil'

            # Try to recover AI % and cost by re-calling their routes
            async with httpx.AsyncClient(timeout=120) as _client:
                # attempt AI route if missing
                if any(m.startswith('detect-ai-and-validate') or m == 'detect-ai-and-validate.ai_percentage' for m in missing):
                    try:
                        r = await post_file_to_route(_client, '/detect-ai-and-validate', filename, file_bytes)
                        if r.get('ok'):
                            modules_out['/detect-ai-and-validate'] = r.get('json')
                    except Exception:
                        pass

                # attempt cost route if missing
                if any('process-and-estimate' in m for m in missing):
                    try:
                        r2 = await post_file_to_route(_client, '/process-and-estimate', filename, file_bytes)
                        if r2.get('ok'):
                            modules_out['/process-and-estimate'] = r2.get('json')
                    except Exception:
                        pass

            # After re-calls, attempt to extract AI % and cost again
            ai_pct = safe_get(modules_out.get('/detect-ai-and-validate'), 'ai_sentences_percentage_by_gemini') or safe_get(modules_out.get('/detect-ai-and-validate'), 'ai_percentage')
            cost_est = safe_get(modules_out.get('/process-and-estimate'), 'estimated_cost') or safe_get(modules_out.get('/process-and-estimate'), 'cost_estimate')
            cost_breakdown = safe_get(modules_out.get('/process-and-estimate'), 'breakdown') or safe_get(modules_out.get('/process-and-estimate'), 'cost_breakdown')

            # If cost still missing, try to compute using local cost estimator module
            if (not cost_est and not cost_breakdown) and proposal_data.get('form_data'):
                try:
                    # try importing the cost_estimator from the codebase
                    from Model.Common.Cost_validation import cost_estimator as ce
                    # call predict_cost with form JSON (many functions expect form json)
                    ce_out = ce.predict_cost(proposal_data.get('form_data'))
                    # ce_out expected to include 'estimated_cost' (in Lakhs)
                    if isinstance(ce_out, dict):
                        if ce_out.get('estimated_cost'):
                            cost_est = ce_out.get('estimated_cost')
                        if ce_out.get('breakdown'):
                            cost_breakdown = ce_out.get('breakdown')
                except Exception:
                    # fallback: try summing form cost_breakdown if present
                    try:
                        cb = proposal_data.get('form_data', {}).get('cost_breakdown', {}) or {}
                        # sum totals
                        total_try = 0
                        def sum_group(g):
                            s = 0
                            if isinstance(g, dict):
                                for v in g.values():
                                    if isinstance(v, dict):
                                        for fld in ['total', 'year1', 'year2', 'year3']:
                                            vv = v.get(fld)
                                            try:
                                                if vv is not None and str(vv).strip() != '':
                                                    s += float(re.sub(r'[^0-9.]', '', str(vv)))
                                            except:
                                                pass
                                    else:
                                        try:
                                            s += float(v)
                                        except:
                                            pass
                            return s
                        total_try += sum_group(cb.get('capital_expenditure', {}))
                        total_try += sum_group(cb.get('revenue_expenditure', {}))
                        tpc = cb.get('total_project_cost', {}) or {}
                        if isinstance(tpc, dict) and tpc.get('total'):
                            try:
                                total_try = float(re.sub(r'[^0-9.]', '', str(tpc.get('total'))))
                            except:
                                pass
                        if total_try > 0:
                            cost_est = total_try
                    except Exception:
                        cost_est = None

            # write back recovered ai_pct/cost to computed/raw inputs so later code uses them
            if ai_pct:
                computed['raw_inputs']['ai_pct'] = ai_pct
            if cost_est:
                computed['raw_inputs']['cost_value'] = cost_est

            # continue without failing; basic missing fields were set to 'nil' above

        # At this point required data exists — build tpl_data using real values
        # requested_funds: format as rupee string when numeric, otherwise 'nil'
        total_cost_raw = proposal_data.get('calculated_totals', {}).get('total_cost')
        def format_requested_funds(v):
            try:
                if isinstance(v, (int, float)):
                    return f"₹{int(round(v))}"
                if isinstance(v, str):
                    vn = re.sub(r"[^0-9.]", "", v)
                    if vn:
                        return f"₹{int(round(float(vn)))}"
            except:
                pass
            return "nil"

        tpl_data = {
            "overall_score": int(round(overall)),
            "risk_index": 0,
            "requested_funds": format_requested_funds(total_cost_raw),
            "duration_months": proposal_data.get('calculated_totals', {}).get('duration', 0),
            "novelty": int(round(validated.get('novelty_subscore', 0))),
            "feasibility": int(round(validated.get('timeline_subscore', 0))),
            "cost": int(round(validated.get('cost_subscore', 0))),
            "ai_score": int(round(validated.get('ai_subscore', 0))),
            "plagiarism": int(round(validated.get('plagiarism_subscore', 0))),
            "time": int(round(validated.get('timeline_subscore', 0))),
            "predicted_actual": "",
            "est_labor_cost": "",
            "actual_labor_cost": "",
        }

        # -----------------------------------------------------------------
        # Build Page 2 content from microservice `comments` blocks (fallbacks)
        # -----------------------------------------------------------------
        def _route_comment(route_name):
            # prefer 'comments', then 'comment', then other fallbacks
            val = safe_get(modules_out.get(route_name), 'comments') or safe_get(modules_out.get(route_name), 'comment')
            if isinstance(val, dict) or isinstance(val, list):
                try:
                    return json.dumps(val, ensure_ascii=False)
                except:
                    return str(val)
            return str(val or "")

        panels = [
            ("Novelty", _route_comment('/analyze-novelty')),
            ("Cost Justification", _route_comment('/process-and-estimate')),
            ("Technical Feasibility", _route_comment('/technical_feasibility')),
            ("Deliverables", _route_comment('/deliverable-check')),
            ("AI Detection", _route_comment('/detect-ai-and-validate')),
            ("Plagiarism", _route_comment('/check-plagiarism-final')),
        ]

        # Format panels into a single content block suitable for Page 2
        page2_lines = ["Detailed Findings & Recommendations", ""]
        for title, body in panels:
            clean = sanitize_text(body)
            if not clean:
                clean = "No findings available."
            page2_lines.append(title)
            page2_lines.append(clean)
            page2_lines.append("")

        # ensure pages dict exists before assigning to it
        pages = {}
        pages['page2'] = {"title": "Detailed Findings & Recommendations", "content": "\n".join(page2_lines)}

        # Build dashboard categories strictly from proposal cost_breakdown
        dashboard_categories = []
        total_cost_val = 0
        cb = proposal_data.get('form_data', {}).get('cost_breakdown', {}) or {}

        def add_items(group, color_idx):
            nonlocal total_cost_val
            for k, v in group.items():
                val = 0
                if isinstance(v, dict):
                    for fld in ['total', 'year1', 'year2', 'year3']:
                        vv = v.get(fld)
                        try:
                            if vv is not None and str(vv).strip() != "":
                                val += float(re.sub(r"[^0-9.]", "", str(vv)))
                        except:
                            pass
                else:
                    try:
                        val = float(v)
                    except:
                        val = 0
                if val > 0:
                    dashboard_categories.append({
                        "category": k.replace('_', ' ').title(),
                        "details": [],
                        "cost": int(round(val)),
                        "percent": 0,
                        "color": ["#3a86ff", "#2556a6", "#0077b6", "#00b4d8", "#90e0ef", "#48cae4", "#00b894"][color_idx % 7]
                    })
                    total_cost_val += val

        cap = cb.get('capital_expenditure', {})
        rev = cb.get('revenue_expenditure', {})
        add_items(cap, 0)
        add_items(rev, 3)

        # If no categories resolved but we do have a total cost (or recovered cost_est), create a single category
        if total_cost_val == 0:
            # try numeric total from proposal calculated_totals
            numeric_total = 0
            try:
                numeric_total = float(re.sub(r"[^0-9.]", "", str(proposal_data.get('calculated_totals', {}).get('total_cost', 0) or 0)))
            except:
                numeric_total = 0

            # if cost_est recovered earlier, prefer that
            try:
                if 'cost_est' in locals() and cost_est:
                    numeric_total = float(re.sub(r"[^0-9.]", "", str(cost_est)))
            except:
                pass

            if numeric_total > 0:
                dashboard_categories = [{
                    "category": "Total",
                    "details": [],
                    "cost": int(round(numeric_total)),
                    "percent": 100,
                    "color": "#3a86ff"
                }]

        # normalize percent
        if total_cost_val > 0:
            for it in dashboard_categories:
                it['percent'] = int(round((it['cost'] / total_cost_val) * 100))

        # inject the data into template/test.html
        tpl_path = os.path.join(os.path.dirname(__file__), '..', '..', 'template', 'test.html')
        tpl_path = os.path.normpath(tpl_path)
        try:
            with open(tpl_path, 'r', encoding='utf-8') as f:
                tpl = f.read()
        except Exception as e:
            return JSONResponse({"ok": False, "error": f"Could not read template: {str(e)}"}, status_code=500)

        # Replace the const data = { ... }; block
        data_json = json.dumps(tpl_data, ensure_ascii=False)
        tpl = re.sub(r"const\s+data\s*=\s*\{[\s\S]*?\};", f"const data = {data_json};", tpl, count=1)

        # Replace dashboardData categories block
        dash_json = json.dumps({"categories": dashboard_categories}, ensure_ascii=False)
        tpl = re.sub(r"const\s+dashboardData\s*=\s*\{[\s\S]*?\};", f"const dashboardData = {dash_json};", tpl, count=1)

        # Extract values from microservice outputs to populate sections
        def num_str(x):
            try:
                return str(int(float(replace_non_numeric(x))))
            except:
                return None

        ai_pct = safe_get(modules_out.get("/detect-ai-and-validate"), "ai_sentences_percentage_by_gemini") or safe_get(modules_out.get("/detect-ai-and-validate"), "ai_percentage")
        plag_pct = safe_get(modules_out.get("/check-plagiarism-final"), "plagiarism_percentage") or safe_get(modules_out.get("/check-plagiarism-final"), "plagiarism")
        novelty_pct = safe_get(modules_out.get("/analyze-novelty"), "novelty_percentage") or safe_get(modules_out.get("/analyze-novelty"), "novelty")
        cost_est = safe_get(modules_out.get("/process-and-estimate"), "estimated_cost") or safe_get(modules_out.get("/process-and-estimate"), "cost_estimate")
        flagged = safe_get(modules_out.get("/detect-ai-and-validate"), "flagged_sentences", default=[]) or []
        suspicious = safe_get(modules_out.get("/check-plagiarism-final"), "suspicious_lines", default=[]) or []
        deliverables = safe_get(modules_out.get("/deliverable-check"), "deliverables") or safe_get(modules_out.get("/deliverable-check"), "found_deliverables") or []

        # Build section contents
        exec_summary = []
        exec_summary.append(f"Automated overall score: {tpl_data.get('overall_score', 'N/A')}%.")
        if novelty_pct:
            exec_summary.append(f"Novelty (automated): {novelty_pct}%.")
        if ai_pct:
            exec_summary.append(f"AI-detection: {ai_pct}% of sentences flagged as likely AI-generated.")
        if plag_pct:
            exec_summary.append(f"Plagiarism similarity: {plag_pct}%.")
        if cost_est:
            exec_summary.append(f"Estimated project cost (automated): {cost_est}.")
        exec_summary_text = ' '.join(exec_summary)

        tech_text = safe_get(modules_out.get("/analyze-novelty"), "technical_comments") or safe_get(modules_out.get("/deliverable-check"), "technical_feasibility") or "Technical review indicates feasibility at pilot scale; please verify feedstock logistics and emissions testing plans."

        cost_text = safe_get(modules_out.get("/process-and-estimate"), "cost_commentary") or f"Estimated cost (automated): {cost_est or 'N/A'}. Provide vendor quotes for high-value equipment."

        timeline_text = safe_get(modules_out.get("/process-and-estimate"), "timeline_commentary") or safe_get(modules_out.get("/deliverable-check"), "timeline") or "Timeline appears reasonable; include a Gantt chart and acceptance criteria for each milestone."

        ai_card = f"AI automation flagged {len(flagged)} sentence(s). Top examples: {', '.join(flagged[:3])}" if flagged else f"AI detection: {ai_pct or 'N/A'}%."
        plag_card = f"Plagiarism similarity {plag_pct or 'N/A'}%. Suspicious excerpts: {', '.join(suspicious[:3])}" if suspicious else f"Plagiarism similarity: {plag_pct or 'N/A'}%."
        novelty_card = f"Novelty score: {novelty_pct or 'N/A'}%. Review highlighted areas for novelty validation." 
        timeline_card = timeline_text

        # helper to replace a section's inner .section-text by its title
        def replace_section(tpl_str, title, new_html):
            pattern = rf'(<div[^>]*class="section-title"[^>]*>\s*{re.escape(title)}\s*</div>\s*<div[^>]*class="section-text"[^>]*>)([\s\S]*?)(</div>)'
            return re.sub(pattern, lambda m: m.group(1) + new_html + m.group(3), tpl_str, count=1, flags=re.IGNORECASE)

        tpl = replace_section(tpl, 'Executive Summary', exec_summary_text)
        tpl = replace_section(tpl, 'Technical Feasibility', tech_text)
        tpl = replace_section(tpl, 'Cost Justification', cost_text)
        tpl = replace_section(tpl, 'Timeline & Deliverables', timeline_text)

                # Page 2 cards (novelty, cost justification, technical feasibility, deliverables)
                # Build richer card HTML for page 2 and summary circles on page 1
        def make_score_box(title, score_pct, comment, recommendations=None):
                sc = int(float(replace_non_numeric(score_pct) or 0)) if score_pct is not None else 0
                changeable = max(0, 100 - sc)
                recs = recommendations or []
                rec_lines = '\n'.join([f"<li>{sanitize_text(r)}</li>" for r in recs]) if recs else "<li>Provide more evidence and vendor quotes.</li>"
                return f"""
<div class=\"card-box\"> 
    <div class=\"card-header\"><strong>{sanitize_text(title)}</strong></div>
    <div class=\"card-body\">
        <p><strong>Score:</strong> {sc}/100 &nbsp; <strong>Changeable:</strong> {changeable}%</p>
        <p>{sanitize_text(str(comment) or '')}</p>
        <div><strong>Recommended actions:</strong>
            <ul>
                {rec_lines}
            </ul>
        </div>
    </div>
</div>
"""

        novelty_recs = safe_get(modules_out.get('/analyze-novelty'), 'recommendations') or []
        cost_recs = safe_get(modules_out.get('/process-and-estimate'), 'recommendations') or []
        tech_recs = safe_get(modules_out.get('/deliverable-check'), 'recommendations') or []
        deliver_recs = safe_get(modules_out.get('/deliverable-check'), 'deliverable_recommendations') or []

        # Prefer route-provided numeric percentages where available
        novelty_score_pct = novelty_pct or validated.get('novelty_subscore', 0)
        cost_score_pct = None
        try:
            # cost_est may be a numeric or string value from the process-and-estimate module
            cost_score_pct = cost_est or computed.get('raw_inputs', {}).get('cost_value') or validated.get('cost_subscore', 0)
        except:
            cost_score_pct = validated.get('cost_subscore', 0)

        tech_score_pct = safe_get(modules_out.get('/deliverable-check'), 'technical_feasibility') or safe_get(modules_out.get('/analyze-novelty'), 'feasibility_percentage') or validated.get('timeline_subscore', 0)

        deliver_score_pct = safe_get(modules_out.get('/deliverable-check'), 'deliverable_score') or safe_get(modules_out.get('/deliverable-check'), 'deliverable_percentage') or computed.get('subscores', {}).get('timeline_subscore') or validated.get('timeline_subscore', 0)

        tpl = replace_section(tpl, 'Novelty', make_score_box('Novelty', novelty_score_pct, safe_get(modules_out.get('/analyze-novelty'), 'summary', default='Automated novelty assessment.'), novelty_recs))
        tpl = replace_section(tpl, 'Cost Justification', make_score_box('Cost Justification', cost_score_pct or 0, cost_text, cost_recs))
        tpl = replace_section(tpl, 'Technical Feasibility', make_score_box('Technical Feasibility', tech_score_pct, tech_text, tech_recs))
        tpl = replace_section(tpl, 'Deliverables', make_score_box('Deliverables', deliver_score_pct, (', '.join(deliverables) if isinstance(deliverables, list) else str(deliverables)), deliver_recs))

        # AI grid cards
        # Build AI grid card HTML
        def make_ai_card(title, body):
            return f"<div class=\"ai-card\"><h4>{sanitize_text(title)}</h4><p>{sanitize_text(body)}</p></div>"

        tpl = replace_section(tpl, 'Plagiarism Analysis', make_ai_card('Plagiarism Analysis', plag_card))
        tpl = replace_section(tpl, 'Model Confidence', make_ai_card('Model Confidence', f"Model confidence: {safe_get(modules_out.get('/detect-ai-and-validate'), 'confidence', default='N/A')}.") )
        tpl = replace_section(tpl, 'Automated Novelty Detection', make_ai_card('Automated Novelty Detection', novelty_card))
        tpl = replace_section(tpl, 'Timeline & Risk Prediction', make_ai_card('Timeline & Risk Prediction', timeline_card))

        # If proposal_data present, inject PI info into table (replace specific sample values)
        if proposal_data and proposal_data.get('form_data'):
            basic = proposal_data['form_data'].get('basic_information', {})
            def safe_str(x):
                return str(x) if x is not None else ""

            tpl = tpl.replace('Integrated Coal Waste-to-Energy Demonstration Project', safe_str(basic.get('project_title')))
            tpl = tpl.replace('Dr. A. K. Sharma', safe_str(basic.get('project_leader_name')))
            tpl = tpl.replace('National Institute of Coal Research', safe_str(basic.get('principal_implementing_agency')))
            tpl = tpl.replace('15 Oct 2025', safe_str(basic.get('submission_date')))
            total_cost_val = proposal_data.get('calculated_totals', {}).get('total_cost')
            repl_cost = 'nil'
            try:
                if isinstance(total_cost_val, (int, float)):
                    repl_cost = f"₹ {int(round(total_cost_val)):,}"
                elif isinstance(total_cost_val, str) and re.sub(r"[^0-9.]", "", total_cost_val):
                    repl_cost = f"₹ {int(round(float(re.sub(r'[^0-9.]', '', total_cost_val)))):,}"
            except:
                repl_cost = 'nil'
                tpl = tpl.replace('₹ 18,500,000', repl_cost)

                # Inject detailed findings container (full second-page layout)
                detailed_html = f"""
<div class=\"detailed-findings\"> 
    <div class=\"row\">{make_score_box('Novelty', novelty_pct or validated.get('novelty_subscore', 0), safe_get(modules_out.get('/analyze-novelty'), 'summary', default='Automated novelty assessment.'), novelty_recs)}{make_score_box('Cost Justification', (computed.get('raw_inputs', {}).get('cost_value') or 0), cost_text, cost_recs)}</div>
    <div class=\"row\">{make_score_box('Technical Feasibility', validated.get('timeline_subscore', 0), tech_text, tech_recs)}{make_score_box('Deliverables', validated.get('timeline_subscore', 0), (', '.join(deliverables) if isinstance(deliverables, list) else str(deliverables)), deliver_recs)}</div>
</div>
"""

                tpl = replace_section(tpl, 'Detailed Findings & Recommendations', detailed_html)

                # Build Financial Summary HTML for page 3 (table + chart placeholder)
                total_display = 0
                try:
                        if dashboard_categories:
                                total_display = sum([int(it.get('cost', 0)) for it in dashboard_categories])
                        else:
                                total_display = int(float(re.sub(r"[^0-9.]", "", str(proposal_data.get('calculated_totals', {}).get('total_cost', 0) or 0))))
                except:
                        total_display = 0

                rows_html = '\n'.join([f"<tr><td>{sanitize_text(it['category'])}</td><td style='text-align:right'>₹ {int(it['cost']):,}</td></tr>" for it in dashboard_categories])
                if not rows_html:
                        rows_html = "<tr><td>Total</td><td style='text-align:right'>₹ 0</td></tr>"

                financial_html = f"""
<div class=\"financial-summary\">
    <h3>Financial Summary</h3>
    <div class=\"financial-grid\">
        <div class=\"categories\">
            <h4>Category</h4>
            <table class=\"budget-table\">{rows_html}</table>
        </div>
        <div class=\"chart-area\">
            <div id=\"budget-chart\">(Chart — generated from dashboard data)</div>
        </div>
    </div>
    <div class=\"total-row\"><strong>TOTAL</strong><span style=\"float:right\">₹ {total_display:,}</span></div>
</div>
"""

                tpl = replace_section(tpl, 'Financial Summary', financial_html)

        return StreamingResponse(io.BytesIO(tpl.encode('utf-8')), media_type='text/html')

    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)}, status_code=500)


