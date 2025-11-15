import os
import io
import json
import re
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional

import httpx
from fastapi import APIRouter, FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, black
from reportlab.lib.utils import ImageReader
from supabase import create_client, Client
import google.generativeai as genai

load_dotenv()

# ---------------- Config (ENV) ----------------
APP_BASE = os.getenv("APP_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
HEADER_BUCKET = os.getenv("HEADER_BUCKET", "assets")
HEADER_FILENAME = os.getenv("HEADER_FILENAME", "coal_header.png")
REPORT_BUCKET = os.getenv("REPORT_BUCKET", "reports")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Set SUPABASE_URL and SUPABASE_KEY in environment")

if not GEMINI_API_KEY:
    raise Exception("Set GEMINI_API_KEY in environment")

# supabase + gemini init
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_API_KEY)

router = APIRouter()
app = FastAPI()
app.include_router(router)

# ---------------- Helpers ----------------
def sanitize_text(txt: Optional[str]) -> str:
    if not txt:
        return ""
    # remove markdown-like bold/italic, control chars, repetitive whitespace
    txt = re.sub(r"\*\*+", "", txt)
    txt = re.sub(r"`+", "", txt)
    txt = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", txt)
    lines = [ln.strip() for ln in txt.splitlines()]
    clean = "\n".join([ln for ln in lines if ln])
    # collapse many spaces in-line
    clean = re.sub(r"[ \t]{2,}", " ", clean)
    return clean.strip()

async def post_file_to_route(client: httpx.AsyncClient, route: str, filename: str, file_bytes: bytes, timeout: float = 120.0) -> Dict[str, Any]:
    url = APP_BASE + route
    files = {"file": (filename, file_bytes, "application/octet-stream")}
    try:
        r = await client.post(url, files=files, timeout=timeout)
        try:
            body = r.json()
        except Exception:
            body = {"_raw_text": r.text}
        return {"ok": True, "route": route, "status": r.status_code, "json": body}
    except Exception as e:
        return {"ok": False, "route": route, "error": str(e)}

def replace_non_numeric(s):
    return re.sub(r"[^\d\.]", "", str(s or ""))

def safe_get(d: Dict[str,Any], *keys, default=None):
    cur = d
    for k in keys:
        if isinstance(cur, dict) and k in cur:
            cur = cur[k]
        else:
            return default
    return cur

def compute_scores(mod_outputs: Dict[str, Any]) -> Dict[str, Any]:
    """Heuristic mapping to convert module outputs into subscores and an overall score (0-100)."""
    # plagiarism percent -> lower better
    plag_pct = safe_get(mod_outputs.get("/check-plagiarism-final", {}), "plagiarism_percentage") or safe_get(mod_outputs.get("/check-plagiarism-final", {}), "plagiarism") or None
    try:
        if isinstance(plag_pct, str):
            plag_pct = float(replace_non_numeric(plag_pct))
    except Exception:
        plag_pct = None

    # ai detection percent (0-100)
    ai_pct = safe_get(mod_outputs.get("/detect-ai-and-validate", {}), "ai_sentences_percentage_by_gemini") or safe_get(mod_outputs.get("/detect-ai-and-validate", {}), "ai_sentences_percentage") or safe_get(mod_outputs.get("/detect-ai-and-validate", {}), "ai_percentage") or None
    try:
        if isinstance(ai_pct, str):
            ai_pct = float(replace_non_numeric(ai_pct))
    except Exception:
        ai_pct = None

    # novelty: higher better
    novelty_pct = safe_get(mod_outputs.get("/novelty-checks", {}), "novelty_percentage") or safe_get(mod_outputs.get("/novelty-checks", {}), "novelty") or None
    try:
        if isinstance(novelty_pct, str):
            novelty_pct = float(replace_non_numeric(novelty_pct))
    except Exception:
        novelty_pct = None

    # cost: estimated_cost INR (lower better)
    cost_value = safe_get(mod_outputs.get("/process-and-estimate", {}), "estimated_cost") or safe_get(mod_outputs.get("/process-and-estimate", {}), "result", "estimated_cost") or None
    try:
        if isinstance(cost_value, str):
            cost_value = float(replace_non_numeric(cost_value))
    except Exception:
        cost_value = None

    # timeline length
    timeline_list = safe_get(mod_outputs.get("/timeline", {}), "timeline") or safe_get(mod_outputs.get("/timeline", {}), "timeline", default=[])
    timeline_len = len(timeline_list) if isinstance(timeline_list, list) else None

    # compute normalized subscores (0-100)
    plag_sub = 100.0 if plag_pct is None else max(0.0, 100.0 - float(plag_pct))
    ai_sub = 100.0 if ai_pct is None else max(0.0, 100.0 - float(ai_pct))
    novelty_sub = 50.0 if novelty_pct is None else float(max(0.0, min(100.0, novelty_pct)))
    # cost mapping (tunable)
    if cost_value is None:
        cost_sub = 60.0
    else:
        c = float(cost_value)
        if c <= 50_000:
            cost_sub = 90.0
        elif c <= 200_000:
            cost_sub = 70.0
        elif c <= 1_000_000:
            cost_sub = 40.0
        else:
            cost_sub = 10.0
    # timeline mapping
    if timeline_len is None:
        timeline_sub = 60.0
    else:
        if timeline_len <= 4:
            timeline_sub = 90.0
        elif timeline_len <= 8:
            timeline_sub = 70.0
        else:
            timeline_sub = 40.0

    weights = {"plag": 0.28, "ai": 0.28, "novelty": 0.22, "cost": 0.12, "timeline": 0.10}
    overall = (
        plag_sub * weights["plag"] +
        ai_sub * weights["ai"] +
        novelty_sub * weights["novelty"] +
        cost_sub * weights["cost"] +
        timeline_sub * weights["timeline"]
    )
    overall = max(0.0, min(100.0, overall))

    return {
        "subscores": {
            "plagiarism_subscore": round(plag_sub, 1),
            "ai_subscore": round(ai_sub, 1),
            "novelty_subscore": round(novelty_sub, 1),
            "cost_subscore": round(cost_sub, 1),
            "timeline_subscore": round(timeline_sub, 1)
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

def build_gemini_scoring_prompt(all_module_json: Dict[str, Any], computed_scores: Dict[str, Any]) -> str:
    modules_str = json.dumps(all_module_json, ensure_ascii=False, indent=2)[:10000]  # trim for prompt size
    scores_str = json.dumps(computed_scores, ensure_ascii=False, indent=2)
    prompt = f"""
You are a Senior Research Project Auditor. You will validate the automatically computed subscores and overall score from structured module outputs, then produce content for a polished 6-page audit report.

INSTRUCTIONS (strict):
1) Validate or correct the numeric subscores (ai, plagiarism, novelty, cost, timeline) and produce a brief 1-line justification for each correction (if any).
2) Provide a final overall percentage (0-100).
3) For each of the 6 pages produce a concise, professional content string (clear paragraphs, bullet summaries) suitable for a government-style report.
   - Page1: Executive summary (overall score, 5-line summary, top 3 actions)
   - Page2: AI Detection (score, list sentences/paragraphs flagged, long explanation, they need to point for what are the sentence the score of the get increased)
   - Page3: Plagiarism (score, suspicious passages, matched sources line in brief and point wise explanation)
   - Page4: Novelty (score, novel contributions, weaknesses they need to brief and point wise explanation)
   - Page5: Cost (estimated cost, breakdown highlights, optimization suggestions benefit they need to brief and point wise explanation)
   - Page6: Timeline (recommended stages, adjustments needed, risk factors they need to brief and point wise explanation)

OUTPUT:
Return a single JSON ONLY with keys:
{{
 "validated_scores": {{
    "ai_score": 0,
    "plagiarism_score": 0,
    "novelty_score": 0,
    "cost_score": 0,
    "timeline_score": 0,
    "final_overall_score": 0,
    "justification": "one-line summary of corrections"
 }},
 "pages": {{
   "page1": {{"title":"", "content":""}},
   "page2": {{"title":"", "content":""}},
   "page3": {{"title":"", "content":""}},
   "page4": {{"title":"", "content":""}},
   "page5": {{"title":"", "content":""}},
   "page6": {{"title":"", "content":""}}
 }},
 "short_recommendations": ["one-line rec 1", "one-line rec 2"]
}}

MODULES_JSON:
{modules_str}

INITIAL_SCORES:
{scores_str}

Return ONLY valid JSON.
"""
    return prompt

def safe_parse_json_from_text(txt: str) -> Dict[str, Any]:
    if not txt:
        return {}
    txt = txt.strip()
    # try direct parse
    try:
        return json.loads(txt)
    except Exception:
        pass
    # attempt to extract last JSON object
    start = txt.find("{")
    end = txt.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(txt[start:end+1])
        except Exception:
            pass
    return {}

# ---------------- PDF rendering (with Circular seal A1) ----------------
def draw_circular_seal(c: canvas.Canvas, center_x: float, center_y: float, radius: float, score_text: str):
    """Draw a circular seal with score_text in center (A1 style)."""
    # outer circle
    c.setLineWidth(2)
    c.setStrokeColor(HexColor("#0b3d91"))
    c.circle(center_x, center_y, radius, stroke=1, fill=0)
    # inner ring
    c.setLineWidth(1)
    c.circle(center_x, center_y, radius * 0.8, stroke=1, fill=0)
    # fill center rectangle with score
    c.setFont("Helvetica-Bold", int(radius * 0.5))
    c.setFillColor(HexColor("#0b3d91"))
    # center the text
    c.drawCentredString(center_x, center_y - (radius * 0.15), score_text)

def fetch_header_bytes() -> Optional[bytes]:
    # try Supabase storage
    try:
        data = supabase.storage.from_(HEADER_BUCKET).download(HEADER_FILENAME)
        if data:
            return data
    except Exception:
        pass
    # try public URL
    try:
        url = "https://ukykrsrwamxhfbcfdncm.supabase.co/storage/v1/object/public/assets/coal%20image.jpg"
        import requests
        r = requests.get(url, timeout=8)
        if r.status_code == 200:
            return r.content
    except Exception:
        pass
    # local fallback
    local = os.path.join(os.getcwd(), HEADER_FILENAME)
    if os.path.exists(local):
        with open(local, "rb") as f:
            return f.read()
    return None

def make_pdf_bytes(pages: Dict[str, Any], overall_score: float, filename_short: str, header_bytes: Optional[bytes]) -> bytes:
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # draw header + footer helper
    def draw_header_footer(page_num: int):
        # header image (if available) centered top
        if header_bytes:
            try:
                img = ImageReader(io.BytesIO(header_bytes))
                iw, ih = img.getSize()
                desired_w = width * 0.5
                scale = desired_w / float(iw)
                draw_w = desired_w
                draw_h = float(ih) * scale
                x = (width - draw_w) / 2.0
                y = height - draw_h - 12
                c.drawImage(img, x, y, draw_w, draw_h, mask='auto')
            except Exception:
                pass
        # footer
        footer_text = f"Generated by Bytespace evaluator — Page {page_num} of 6"
        c.setFont("Helvetica-Oblique", 9)
        c.setFillColor(HexColor("#333333"))
        c.drawCentredString(width / 2.0, 12 * mm, footer_text)

    # Page 1 — Cover with circular seal
    p1 = pages.get("page1", {})
    title1 = p1.get("title", "Executive Summary")
    content1 = sanitize_text(p1.get("content", ""))
    # draw header/footer
    draw_header_footer(1)
    # draw circular seal center-right top
    seal_radius = 42 * mm
    seal_cx = width * 0.75
    seal_cy = height - 80*mm
    draw_circular_seal(c, seal_cx, seal_cy, seal_radius, f"{int(round(overall_score))}%")
    # title + small info
    c.setFont("Helvetica-Bold", 18)
    c.drawString(24*mm, height - 70*mm, title1)
    c.setFont("Helvetica", 11)
    y = height - 80*mm
    # draw content lines (wrap roughly)
    text = c.beginText(24*mm, y)
    text.setFont("Helvetica", 10)
    lines = []
    for para in content1.split("\n\n"):
        for ln in re.split(r'(?<=\.)\s+', para):
            if ln.strip():
                lines.append(ln.strip())
        lines.append("")  # paragraph gap
    for ln in lines[:40]:
        text.textLine(ln)
    c.drawText(text)
    draw_header_footer(1)
    c.showPage()

    # Pages 2-6: each with title + content
    for i in range(2, 7):
        page = pages.get(f"page{i}", {})
        title = page.get("title", f"Page {i}")
        content = sanitize_text(page.get("content", ""))
        draw_header_footer(i)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(20*mm, height - 30*mm, title)
        c.setFont("Helvetica", 10)
        text = c.beginText(20*mm, height - 40*mm)
        # wrap: naive split by sentences/lines
        for para in content.split("\n\n"):
            # split long lines further
            lines = re.split(r'(?<=[.!?])\s+', para)
            for ln in lines:
                ln2 = ln.strip()
                if not ln2:
                    continue
                # ensure max characters per line ~95
                while len(ln2) > 120:
                    text.textLine(ln2[:120])
                    ln2 = ln2[120:]
                text.textLine(ln2)
            text.textLine("")
        c.drawText(text)
        draw_header_footer(i)
        c.showPage()

    c.save()
    buffer.seek(0)
    return buffer.read()

# ---------------- Main endpoint ----------------
@router.post("/report-gen")
async def authenticator_endpoint(file: UploadFile = File(...)):
    """
    Receives a paper file, sends it to multiple endpoints in parallel,
    aggregates outputs, validates with Gemini, renders PDF, uploads to Supabase.
    """
    try:
        filename = file.filename or f"upload_{datetime.utcnow().isoformat()}"
        file_bytes = await file.read()

        routes = [
            "/timeline",
            "/check-plagiarism-final",
            "/novelty-checks",
            "/process-and-estimate",
            "/detect-ai-and-validate"
        ]

        async with httpx.AsyncClient(timeout=120.0) as client:
            tasks = [post_file_to_route(client, r, filename, file_bytes) for r in routes]
            results = await asyncio.gather(*tasks, return_exceptions=False)

        modules_out = {}
        for res in results:
            route = res.get("route")
            if res.get("ok"):
                modules_out[route] = res.get("json") or {}
            else:
                modules_out[route] = {"error": res.get("error") or res.get("text") or f"HTTP {res.get('status')}"}

        computed = compute_scores(modules_out)

        # call Gemini to validate and produce page content
        prompt = build_gemini_scoring_prompt(modules_out, computed)
        model = genai.GenerativeModel("gemini-2.5-flash-lite")
        resp = model.generate_content(prompt)
        gem_out = safe_parse_json_from_text(resp.text or "")

        validated_scores = gem_out.get("validated_scores") or {
            "ai_score": computed["subscores"]["ai_subscore"],
            "plagiarism_score": computed["subscores"]["plagiarism_subscore"],
            "novelty_score": computed["subscores"]["novelty_subscore"],
            "cost_score": computed["subscores"]["cost_subscore"],
            "timeline_score": computed["subscores"]["timeline_subscore"],
            "final_overall_score": computed["overall_score"],
            "justification": ""
        }

        pages = gem_out.get("pages") or {}
        # Ensure each page has a title & content
        for i in range(1,7):
            key = f"page{i}"
            if key not in pages or not isinstance(pages[key], dict):
                pages[key] = {"title": f"Page {i}", "content": f"No content generated for {key}."}

        short_recs = gem_out.get("short_recommendations") or gem_out.get("short_recs") or []

        # get header image once
        header_bytes = fetch_header_bytes()

        overall_score = validated_scores.get("final_overall_score") or computed.get("overall_score")
        pdf_bytes = make_pdf_bytes(pages, float(overall_score), filename.rsplit(".",1)[0], header_bytes)

        # upload PDF to Supabase
        safe_name = re.sub(r"[<>:\"/\\|?*]+", "_", filename.rsplit(".",1)[0]) + ".authenticator.pdf"
        # if name exists, pick unique
        try:
            existing = supabase.storage.from_(REPORT_BUCKET).list() or []
            existing_names = [o.get("name") for o in existing]
        except Exception:
            existing_names = []
        if safe_name in existing_names:
            i = 1
            base = safe_name.rsplit(".",1)[0]
            candidate = f"{base}_{i}.authenticator.pdf"
            while candidate in existing_names:
                i += 1
                candidate = f"{base}_{i}.authenticator.pdf"
            safe_name = candidate

        # upload (some clients accept bytes; attempt both)
        upload_ok = False
        try:
            supabase.storage.from_(REPORT_BUCKET).upload(safe_name, pdf_bytes, {"content-type":"application/pdf"})
            upload_ok = True
        except Exception:
            try:
                supabase.storage.from_(REPORT_BUCKET).upload(safe_name, io.BytesIO(pdf_bytes), {"content-type":"application/pdf"})
                upload_ok = True
            except Exception:
                upload_ok = False

        public_url = None
        try:
            pub = supabase.storage.from_(REPORT_BUCKET).get_public_url(safe_name)
            # get_public_url sometimes returns dict or string - handle both
            if isinstance(pub, str):
                public_url = pub
            elif isinstance(pub, dict):
                public_url = pub.get("publicUrl") or pub.get("url") or None
        except Exception:
            public_url = None

        return JSONResponse({
            "ok": True,
            "filename": filename,
            "report_object": safe_name,
            "report_url": public_url,
            "computed_scores": computed,
            "validated_scores": validated_scores,
            "short_recommendations": short_recs,
            "modules": modules_out,
            "uploaded_to_supabase": upload_ok,
            "created_at": datetime.utcnow().isoformat()
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"ok": False, "error": str(e)}, status_code=500)

# --- run with: uvicorn report_gen_final:app --reload --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("report_gen_final:app", host="0.0.0.0", port=8000, reload=True)
