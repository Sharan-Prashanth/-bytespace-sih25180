import os
import re
import json
from io import BytesIO
from datetime import datetime
from typing import Dict, Any, Optional

import PyPDF2
import docx
import chardet
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse

from supabase import create_client, Client

load_dotenv()

# -----------------------------
# ENV CONFIG
# -----------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")
TIMELINE_BUCKET = "timelines-json"
STORE_IN_BUCKET = os.getenv("STORE_IN_BUCKET", "true").lower() in ("true", "1", "yes")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Missing Supabase configurations in .env")

if not GEMINI_API_KEY:
    raise Exception("Missing GEMINI_API_KEY in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_API_KEY)

router = APIRouter()

# -----------------------------------------------------------
# TEXT EXTRACTION
# -----------------------------------------------------------
def extract_text_pdf(file_bytes: bytes) -> str:
    try:
        reader = PyPDF2.PdfReader(BytesIO(file_bytes))
        text = ""
        for p in reader.pages:
            t = p.extract_text()
            if t:
                text += t + "\n"
        return text
    except:
        enc = chardet.detect(file_bytes)["encoding"] or "utf-8"
        return file_bytes.decode(enc, errors="ignore")

def extract_text_docx(file_bytes: bytes) -> str:
    try:
        doc = docx.Document(BytesIO(file_bytes))
        lines = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(lines)
    except:
        return ""

def extract_text_auto(filename: str, data: bytes) -> str:
    ext = filename.lower().rsplit(".", 1)[-1]
    if ext == "pdf":
        return extract_text_pdf(data)
    if ext == "docx":
        return extract_text_docx(data)
    if ext in ("txt", "csv"):
        enc = chardet.detect(data)["encoding"] or "utf-8"
        return data.decode(enc, errors="ignore")

    # fallback
    txt = extract_text_pdf(data)
    if txt.strip():
        return txt
    return data.decode("utf-8", errors="ignore")

# -----------------------------------------------------------
# SAFE JSON PARSER
# -----------------------------------------------------------
def safe_json_parse(text: str) -> Optional[Dict[str, Any]]:
    try:
        # Extract { ... } cleanly
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1:
            return None
        return json.loads(text[start:end+1])
    except:
        return None

# -----------------------------------------------------------
# PROMPT FOR TIMELINE EXTRACTION
# -----------------------------------------------------------
def build_timeline_prompt(content: str) -> str:
    return f"""
You are a professional project timeline extraction system.

Your task:
- Read the full document text below.
- Determine ONLY the internal project workflow stages.
- DO NOT use publication years or citation dates.
- DO NOT use references section for timeline.
- DO NOT list other authors’ works.
- ONLY build timeline for the project described in this document.

If the document already contains a timeline or methodology flow:
- Extract it exactly as written.

If not:
- Build a clear project timeline based on the project’s narrative.
- Include key phases such as:
  - Problem identification
  - Literature survey summary (without dates)
  - Dataset acquisition or simulation
  - Preprocessing / feature extraction
  - Model design
  - Model training & validation
  - Optimization steps
  - Deployment or real-time system integration
  - Evaluation and results
  - Future improvements

You must output ONLY a valid JSON object in this structure:

{{
  "timeline": [
    {{
      "stage": "Short label",
      "description": "Desc"
    }}
  ]
}}


Rules:
- DO NOT include any real calendar dates.
- The timeline must reflect the project flow, not other papers.
- Keep descriptions specific to the project content.
- No extra text outside JSON.

DOCUMENT CONTENT:
{content}

"""

# -----------------------------------------------------------
# GEMINI CALL
# -----------------------------------------------------------
def call_gemini(prompt: str) -> Dict[str, Any]:
    model = genai.GenerativeModel("gemini-2.5-flash-lite")
    resp = model.generate_content(prompt)
    raw = resp.text or ""

    parsed = safe_json_parse(raw)
    if parsed:
        return parsed

    # retry clean JSON-only request
    resp2 = model.generate_content(
        f"Return ONLY the valid JSON object extracted from this text:\n\n{raw}"
    )
    parsed2 = safe_json_parse(resp2.text or "")
    if parsed2:
        return parsed2

    return {
        "timeline": [],
        "has_original_timeline": False,
        "analysis_notes": "Failed to parse JSON",
        "raw_output": raw
    }

# -----------------------------------------------------------
# SAVE TO SUPABASE STORAGE ONLY (not DB)
# -----------------------------------------------------------
def save_timeline_json(filename: str, timeline_json: Dict[str, Any]) -> str:
    if not STORE_IN_BUCKET:
        return None

    base = filename.rsplit(".", 1)[0]
    clean_name = re.sub(r"[<>:\"/\\|?*]+", "_", base)
    object_name = f"{clean_name}.timeline.json"

    try:
        supabase.storage.from_(TIMELINE_BUCKET).upload(
            object_name,
            json.dumps(timeline_json, ensure_ascii=False).encode("utf-8"),
            {"content-type": "application/json"}
        )
    except:
        # rename if exists
        i = 1
        new_name = f"{clean_name}_{i}.timeline.json"
        while True:
            try:
                supabase.storage.from_(TIMELINE_BUCKET).upload(
                    new_name,
                    json.dumps(timeline_json, ensure_ascii=False).encode("utf-8"),
                    {"content-type": "application/json"}
                )
                object_name = new_name
                break
            except:
                i += 1
                new_name = f"{clean_name}_{i}.timeline.json"

    # get public URL
    return supabase.storage.from_(TIMELINE_BUCKET).get_public_url(object_name)

# -----------------------------------------------------------
# MAIN API ENDPOINT
# -----------------------------------------------------------
@router.post("/timeline")
async def process_timeline(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        filename = file.filename

        content = extract_text_auto(filename, file_bytes)
        if len(content.strip()) < 30:
            return JSONResponse({"error": "Could not extract usable text"}, status_code=400)

        prompt = build_timeline_prompt(content)
        timeline_json = call_gemini(prompt)

        public_url = save_timeline_json(filename, timeline_json)

        return {
            "filename": filename,
            "saved_to_storage": bool(public_url),
            "public_url": public_url,
            "timeline": timeline_json
        }

    except Exception as e:
        return {"error": str(e)}
