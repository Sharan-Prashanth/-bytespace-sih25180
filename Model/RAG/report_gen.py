import os
import io
import json
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional

import httpx
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from dotenv import load_dotenv
from supabase import create_client, Client
import google.generativeai as genai

load_dotenv()

# ---------- Config ----------
APP_BASE = os.getenv("APP_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY2")
REPORT_BUCKET = os.getenv("REPORT_BUCKET", "reports")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Missing SUPABASE_URL or SUPABASE_KEY in environment")

if not GEMINI_API_KEY:
    raise Exception("Missing GEMINI_API_KEY in environment")

# supabase & gemini
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_API_KEY)

router = APIRouter()

# ---------- helper: call one endpoint with file bytes ----------
async def post_file_to_route(client: httpx.AsyncClient, route: str, filename: str, file_bytes: bytes) -> Dict[str, Any]:
    """
    POST file bytes as multipart/form-data to {APP_BASE}{route}.
    Returns JSON dict (or error info).
    """
    url = APP_BASE + route
    files = {"file": (filename, file_bytes, "application/octet-stream")}
    try:
        r = await client.post(url, files=files, timeout=120.0)
        try:
            return {"ok": True, "route": route, "status": r.status_code, "json": r.json()}
        except Exception:
            return {"ok": False, "route": route, "status": r.status_code, "text": r.text}
    except Exception as e:
        return {"ok": False, "route": route, "error": str(e)}

# ---------- helper: normalize module outputs (robust) ----------
def safe_get(d: Dict[str, Any], *keys, default=None):
    cur = d
    for k in keys:
        if isinstance(cur, dict) and k in cur:
            cur = cur[k]
        else:
            return default
    return cur

# ---------- scoring algorithm ----------
def compute_scores(mod_outputs: Dict[str, Any]) -> Dict[str, Any]:
    """
    Accept module outputs (raw JSON per route). Return per-module numeric scores and overall score.
    We'll define a baseline scoring heuristic — tune weights as required.
    """

    # extract useful numbers safely (many modules follow slightly different keys)
    # plagiarism percent (0-100) -> lower is better
    plag_pct = None
    try:
        plag_json = mod_outputs.get("/check-plagiarism-final", {}) or {}
        # try common keys
        plag_pct = (plag_json.get("plagiarism_percentage") or
                    safe_get(plag_json, "result", "plagiarism_percentage") or
                    safe_get(plag_json, "plagiarism", "percentage") or
                    None)
        if isinstance(plag_pct, str):
            plag_pct = float(replace_non_numeric(plag_pct))  # helper defined below if needed
    except Exception:
        plag_pct = None

    # ai detection percent (AI-likelihood, higher is worse)
    ai_pct = None
    try:
        ai_json = mod_outputs.get("/detect-ai-and-validate", {}) or {}
        ai_pct = (ai_json.get("ai_probability") or safe_get(ai_json, "result","ai_probability") or ai_json.get("ai_percentage") or None)
        if isinstance(ai_pct, str):
            ai_pct = float(ai_pct)
    except Exception:
        ai_pct = None

    # novelty (0-100) higher is better
    novelty_pct = None
    try:
        nov_json = mod_outputs.get("/novelty-checks", {}) or {}
        novelty_pct = (nov_json.get("novelty_percentage") or safe_get(nov_json,"result","novelty_percentage") or None)
        if isinstance(novelty_pct, str):
            novelty_pct = float(novelty_pct)
    except Exception:
        novelty_pct = None

    # cost: lower cost -> better. We expect estimated_cost in INR
    cost_value = None
    try:
        cost_json = mod_outputs.get("/process-and-estimate", {}) or {}
        cost_value = (cost_json.get("estimated_cost") or safe_get(cost_json,"result","estimated_cost") or None)
        if isinstance(cost_value, str):
            cost_value = float(cost_value)
    except Exception:
        cost_value = None

    # timeline: if long timeline (many months) -> may reduce score
    timeline_len = None
    try:
        tl_json = mod_outputs.get("/timeline", {}) or {}
        timeline_list = (tl_json.get("timeline") or safe_get(tl_json,"timeline") or [])
        timeline_len = len(timeline_list)
    except Exception:
        timeline_len = None

    # compute normalized sub-scores (0-100, higher is better)
    # plagiarism subscore: 100 if plag_pct is 0, down to 0 if 100
    plag_sub = 100.0 if plag_pct is None else max(0.0, 100.0 - float(plag_pct))
    # ai_sub: higher ai_pct -> lower score
    ai_sub = 100.0 if ai_pct is None else max(0.0, 100.0 - float(ai_pct)*100.0) if ai_pct <= 1 else max(0.0, 100.0 - float(ai_pct))
    # novelty_sub: higher is better (map 0-100)
    novelty_sub = 50.0 if novelty_pct is None else float(novelty_pct)
    # cost_sub: we invert cost: cheaper is better. define threshold
    if cost_value is None:
        cost_sub = 60.0
    else:
        # example mapping: 0-50k INR -> 90, 50k-200k -> 70, 200k-1M -> 40, >1M -> 10
        c = float(cost_value)
        if c <= 50_000:
            cost_sub = 90.0
        elif c <= 200_000:
            cost_sub = 70.0
        elif c <= 1_000_000:
            cost_sub = 40.0
        else:
            cost_sub = 10.0

    # timeline_sub: longer timeline reduces score: len >8 -> reduce
    if timeline_len is None:
        timeline_sub = 60.0
    else:
        if timeline_len <= 4:
            timeline_sub = 90.0
        elif timeline_len <= 8:
            timeline_sub = 70.0
        else:
            timeline_sub = 40.0

    # weighting rules: you mentioned AI+plag+novelty are main drivers, cost & timeline also matter
    weights = {
        "plag": 0.28,
        "ai":   0.28,
        "novelty": 0.22,
        "cost": 0.12,
        "timeline": 0.10
    }

    overall = (
        plag_sub * weights["plag"] +
        ai_sub * weights["ai"] +
        novelty_sub * weights["novelty"] +
        cost_sub * weights["cost"] +
        timeline_sub * weights["timeline"]
    )

    # ensure 0-100
    overall = max(0.0, min(100.0, overall))

    return {
        "subscores": {
            "plagiarism_subscore": round(plag_sub,1),
            "ai_subscore": round(ai_sub,1),
            "novelty_subscore": round(novelty_sub,1),
            "cost_subscore": round(cost_sub,1),
            "timeline_subscore": round(timeline_sub,1)
        },
        "overall_score": round(overall,1),
        "raw_inputs": {
            "plag_pct": plag_pct,
            "ai_pct": ai_pct,
            "novelty_pct": novelty_pct,
            "cost_value": cost_value,
            "timeline_len": timeline_len
        }
    }

# small helper to strip non-numeric from strings
import re
def replace_non_numeric(s):
    return re.sub(r"[^\d\.]", "", s or "")

# ---------- Gemini summarizer prompt ----------
def build_gemini_scoring_prompt(all_module_json: Dict[str, Any], computed_scores: Dict[str, Any]) -> str:
    """
    Fully robust, brace-escaped, professional scoring prompt.
    Safe for Python f-strings and .format().
    """

    modules_str = json.dumps(all_module_json, ensure_ascii=False, indent=2)
    scores_str = json.dumps(computed_scores, ensure_ascii=False, indent=2)

    prompt = f"""
You are a *Senior Research Project Auditor* with expertise in:
- plagiarism detection,
- novelty assessment,
- AI-generated content analysis,
- research cost estimation,
- academic project timeline construction.

You will receive:
1. `modules_json` → the raw outputs from five analyzers.
2. `initial_scores` → the automatically computed numeric scores.

====================================================
YOUR OBJECTIVES (CRITICAL — FOLLOW EXACTLY)
====================================================

A) **VALIDATE ALL SCORES**
- Recalculate the correctness of each sub-score using evidence from `modules_json`.
- If any score is inconsistent or mathematically incorrect, FIX it.
- Provide 1–2 line justification for each correction.
- Compute a FINAL overall percentage (0–100).

B) **GENERATE A SIX-PAGE REPORT** (for PDF generation later)
You must produce polished, concise, professional text for each page.

1) **Page 1 — Executive Summary**
   - Final overall score (percentage).
   - 5-line summary of the entire paper quality.
   - Key strengths + risks.

2) **Page 2 — AI-Generated Text Audit**
   - AI probability score.
   - Sentences/paragraphs flagged as AI-generated.
   - Short explanation of why they appear AI-generated.

3) **Page 3 — Plagiarism Report**
   - Final plagiarism percentage.
   - List of suspicious sections.
   - Reasoning behind detected overlap.
   - Mention if any content matches internal database / Supabase stored files.

4) **Page 4 — Novelty Evaluation**
   - Novelty percentage.
   - Unique ideas.
   - Weak originality areas.
   - Suggestions to increase novelty.

5) **Page 5 — Cost Estimation**
   - Estimated project cost (INR).
   - Detailed cost breakdown.
   - Recommendations to reduce cost.

6) **Page 6 — Timeline**
   - Recommended stage-by-stage project timeline.
   - Clarify if source document lacked a proper timeline.
   - Adjusted timeline if needed.

C) **WRITE SHORT RECOMMENDATIONS**
3–8 bullets, one line each.

====================================================
OUTPUT FORMAT (STRICT JSON — MUST FOLLOW EXACTLY)
====================================================

Return ONLY a JSON object of the form:

{{
  "validated_scores": {{
      "ai_score": 0,
      "plagiarism_score": 0,
      "novelty_score": 0,
      "cost_score": 0,
      "timeline_score": 0,
      "final_overall_score": 0,
      "justification": "..."
  }},
  "pages": {{
      "page1": {{
        "title": "Executive Summary",
        "content": "..."
      }},
      "page2": {{
        "title": "AI Detection",
        "content": "..."
      }},
      "page3": {{
        "title": "Plagiarism Report",
        "content": "..."
      }},
      "page4": {{
        "title": "Novelty Assessment",
        "content": "..."
      }},
      "page5": {{
        "title": "Cost Estimation",
        "content": "..."
      }},
      "page6": {{
        "title": "Timeline Evaluation",
        "content": "..."
      }}
  }},
  "short_recommendations": [
      "Recommendation 1...",
      "Recommendation 2...",
      "Recommendation 3..."
  ]
}}

====================================================
REFERENCE INPUT
====================================================

### Modules JSON:
{modules_str}

### Initial Computed Scores:
{scores_str}

IMPORTANT:
- DO NOT add commentary outside the JSON.
- DO NOT include markdown formatting.
- Return ONLY VALID JSON.
"""

    return prompt

# ---------- PDF generator using reportlab ----------
def make_pdf_bytes(pages_content: Dict[str, Any], overall_score: float, filename_short: str) -> bytes:
    """
    pages_content: dict with keys page1..page6 each containing title & content strings.
    returns PDF bytes
    """
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    def draw_page(title: str, body: str, footer: Optional[str] = None):
        c.setFont("Helvetica-Bold", 16)
        c.drawString(20*mm, height - 30*mm, title)
        c.setFont("Helvetica", 10)
        text_obj = c.beginText(20*mm, height - 40*mm)
        # wrap body reasonably
        for line in body.splitlines():
            text_obj.textLine(line)
        c.drawText(text_obj)
        if footer:
            c.setFont("Helvetica-Oblique", 9)
            c.drawString(20*mm, 10*mm, footer)
        c.showPage()

    # Cover page - page1 (include overall score big)
    p1 = pages_content.get("page1", {})
    title = p1.get("title", f"Authenticator Report — {filename_short}")
    content = p1.get("content", "")
    # draw big score
    c.setFont("Helvetica-Bold", 36)
    c.drawCentredString(width/2.0, height - 50*mm, f"Overall Score: {overall_score}%")
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(width/2.0, height - 70*mm, title)
    c.setFont("Helvetica", 10)
    text_obj = c.beginText(20*mm, height - 90*mm)
    for line in content.splitlines():
        text_obj.textLine(line)
    c.drawText(text_obj)
    c.showPage()

    # pages 2..6
    for i in range(2,7):
        key = f"page{i}"
        p = pages_content.get(key, {})
        draw_page(p.get("title", f"Page {i}"), p.get("content",""), footer=f"Generated: {datetime.utcnow().isoformat()}")

    c.save()
    buffer.seek(0)
    return buffer.read()

# ---------- Main endpoint: /report-gen ----------
@router.post("/report-gen")
async def authenticator_endpoint(file: UploadFile = File(...)):
    """
    Receives a paper and:
      - calls 5 endpoints in parallel with the same file
      - aggregates JSON outputs
      - computes scores
      - asks Gemini to validate + produce page text
      - renders PDF and uploads to supabase
      - returns public_url and details
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

        # normalize into dict by route
        modules_out = {}
        for res in results:
            route = res.get("route")
            if res.get("ok"):
                modules_out[route] = res.get("json") if res.get("json") is not None else {}
            else:
                modules_out[route] = {"error": res.get("error") or res.get("text") or f"HTTP {res.get('status')}"}

        # compute local heuristic scores
        computed = compute_scores(modules_out)

        # ask Gemini to validate and produce page contents
        prompt = build_gemini_scoring_prompt(modules_out, computed)
        model = genai.GenerativeModel("gemini-2.5-flash-lite")
        resp = model.generate_content(prompt)
        try:
            gem_json = json.loads(resp.text)
        except Exception:
            # attempt to extract JSON substring
            txt = resp.text or ""
            start = txt.find("{")
            end = txt.rfind("}")
            gem_json = json.loads(txt[start:end+1]) if start!=-1 and end!=-1 else {"error":"gemini output non-json", "raw": txt}

        validated = gem_json.get("validated_scores", computed)
        pages = gem_json.get("pages", {})
        short_recs = gem_json.get("short_recommendations", [])

        # build PDF bytes from pages and overall score
        overall_score = validated.get("overall_score", computed["overall_score"])
        pdf_bytes = make_pdf_bytes(pages, overall_score, filename.rsplit(".",1)[0])

        # upload PDF to supabase REPORT_BUCKET
        safe_name = re.sub(r"[<>:\"/\\|?*]+", "_", filename.rsplit(".",1)[0]) + ".authenticator.pdf"
        try:
            supabase.storage.from_(REPORT_BUCKET).upload(safe_name, pdf_bytes, {"content-type":"application/pdf"})
        except Exception as e:
            # if object exists, rename
            existing = supabase.storage.from_(REPORT_BUCKET).list() or []
            existing_names = [o.get("name") for o in existing]
            if safe_name in existing_names:
                i = 1
                candidate = f"{safe_name.rsplit('.',1)[0]}_{i}.authenticator.pdf"
                while candidate in existing_names:
                    i += 1
                    candidate = f"{safe_name.rsplit('.',1)[0]}_{i}.authenticator.pdf"
                supabase.storage.from_(REPORT_BUCKET).upload(candidate, pdf_bytes, {"content-type":"application/pdf"})
                safe_name = candidate
            else:
                raise e

        public_url = supabase.storage.from_(REPORT_BUCKET).get_public_url(safe_name)

        return JSONResponse({
            "ok": True,
            "filename": filename,
            "report_object": safe_name,
            "report_url": public_url,
            "computed_scores": computed,
            "validated_scores": validated,
            "short_recommendations": short_recs,
            "modules": modules_out
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"ok": False, "error": str(e)}, status_code=500)
