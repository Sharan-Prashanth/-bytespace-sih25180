# novelty_processor_v2.py
import os
import json
import re
from io import BytesIO
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from difflib import SequenceMatcher
from typing import List, Dict, Any

import PyPDF2
import chardet
import docx
import google.generativeai as genai
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse

from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# ---------------------------
# CONFIG
# ---------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")   # service_role recommended
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or not GEMINI_API_KEY:
    raise Exception("Set SUPABASE_URL, SUPABASE_KEY, and GEMINI_API_KEY in environment")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-2.5-flash-lite"

RAW_BUCKET = "Coal-research-files"
JSON_BUCKET = "novelty-json"

router = APIRouter()

# ---------------------------
# UTILITIES
# ---------------------------
def _safe_json_parse(text: str) -> Any:
    if not text:
        return None
    m = re.search(r"\{[\s\S]*\}$", text.strip())
    raw = m.group(0) if m else text.strip()
    try:
        return json.loads(raw)
    except Exception:
        # try to salvage by extracting first and last braces
        try:
            first = raw.find("{")
            last = raw.rfind("}")
            if first != -1 and last != -1 and last > first:
                return json.loads(raw[first:last+1])
        except Exception:
            return None
    return None

def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a or "", b or "").ratio()

def sanitize_filename(name: str) -> str:
    # remove problematic chars, keep spaces but avoid leading/trailing
    name = name.strip()
    name = re.sub(r"[<>:\"/\\|?*]+", "_", name)
    return name

# ---------------------------
# TEXT EXTRACTION
# ---------------------------
def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        reader = PyPDF2.PdfReader(BytesIO(file_bytes))
        out = ""
        for p in reader.pages:
            t = p.extract_text()
            if t:
                out += t + "\n"
        return out
    except Exception:
        enc = chardet.detect(file_bytes)["encoding"] or "utf-8"
        try:
            return file_bytes.decode(enc, errors="ignore")
        except Exception:
            return ""

def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        doc = docx.Document(BytesIO(file_bytes))
        return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    except Exception:
        return ""

def extract_text(filename: str, data: bytes) -> str:
    ext = filename.lower().split(".")[-1]
    if ext == "pdf":
        return extract_text_from_pdf(data)
    if ext == "docx":
        return extract_text_from_docx(data)
    if ext in ("txt", "csv"):
        enc = chardet.detect(data)["encoding"] or "utf-8"
        try:
            return data.decode(enc, errors="ignore")
        except Exception:
            return ""
    return ""

# ---------------------------
# CHUNKING
# ---------------------------
def chunk_text(text: str, min_lines: int = 60) -> List[str]:
    lines = [ln for ln in text.splitlines() if ln.strip()]
    if not lines:
        return []
    chunks = []
    i = 0
    n = len(lines)
    while i < n:
        j = min(i + min_lines, n)
        chunks.append("\n".join(lines[i:j]))
        i = j
    return chunks

# ---------------------------
# LOAD PAST JSONS FROM STORAGE
# ---------------------------
def load_all_past_novelty_json() -> List[Dict[str, Any]]:
    try:
        files = supabase.storage.from_(JSON_BUCKET).list()
    except Exception as e:
        print("Error listing JSON bucket:", e)
        return []
    json_list = []
    for f in files or []:
        try:
            if not f.get("name", "").endswith(".json"):
                continue
            blob = supabase.storage.from_(JSON_BUCKET).download(f["name"])
            content = json.loads(blob.decode("utf-8"))
            json_list.append({
                "filename": f["name"],
                "data": content,
                "raw": content.get("raw_text", ""),
                "unique_sections": content.get("unique_sections", []) or []
            })
        except Exception as e:
            print("Warning: failed to load/parse", f.get("name"), e)
    return json_list

# ---------------------------
# LLM PROMPTS
# ---------------------------
def build_innovation_extraction_prompt(text: str) -> str:
    # concise but explicit prompt to extract innovation statements
    return f"""
You are an expert at extracting *innovation points* from technical research text.
Task: Read the text below and extract **distinct innovation ideas** (methods, new architectures,
novel datasets, unique workflows, new problem formulations, or new combinations).
Return ONLY a JSON object with the key "innovations" containing a list of short strings (5-20).
Each item should be 8-40 words, focused, and represent a single innovation claim.

JSON schema:
{{ "innovations": ["...","..."] }}

Text:
{text}
"""

def build_novelty_prompt_for_chunks(chunk: str) -> str:
    # main novelty analysis for chunk — used to create detailed_context if needed
    return f"""
You are a skilled research novelty analyst.
Read the chunk below and return JSON ONLY with:
{{
  "novelty_percentage": 0,
  "unique_sections": [],
  "detailed_context": ""
}}
- novelty_percentage: integer 0-100 for this chunk
- unique_sections: 2-6 short excerpts or summaries (8-40 words)
- detailed_context: 20-40 lines explaining why these are novel or not

Chunk:
{chunk}
"""

def build_self_validation_prompt(full_text: str, final_json: Dict[str, Any]) -> str:
    return f"""
You are a self-validation auditor for a novelty analysis.
Given the original text (truncated) and the produced JSON, perform internal checks and report issues.
Return ONLY JSON with keys:
- logic_checks: list of short statements verifying reasoning steps
- consistency_checks: list of mismatches between score and extracted innovations or uniqueness
- possible_errors: list of potential reliability issues (parsing, short text, low confidence)

Original-text (truncated):
{full_text[:5000]}

Produced-JSON:
{json.dumps(final_json, ensure_ascii=False) }
"""

# ---------------------------
# LLM CALLS
# ---------------------------
def call_gemini(prompt: str, model_name: str = MODEL_NAME) -> str:
    model = genai.GenerativeModel(model_name)
    resp = model.generate_content(prompt)
    return resp.text or ""

def extract_innovations_from_text(text: str) -> List[str]:
    prompt = build_innovation_extraction_prompt(text)
    raw = call_gemini(prompt)
    parsed = _safe_json_parse(raw)
    if parsed and isinstance(parsed, dict) and isinstance(parsed.get("innovations"), list):
        # clean items
        return [i.strip() for i in parsed["innovations"] if isinstance(i, str) and i.strip()]
    # fallback: try to extract lines heuristically
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    return lines[:10]

def analyze_chunk_novelty(chunk: str) -> Dict[str, Any]:
    prompt = build_novelty_prompt_for_chunks(chunk)
    raw = call_gemini(prompt)
    parsed = _safe_json_parse(raw)
    if parsed and isinstance(parsed, dict):
        # normalize keys
        parsed.setdefault("novelty_percentage", int(parsed.get("novelty_percentage", 0) or 0))
        parsed.setdefault("unique_sections", parsed.get("unique_sections", []) or [])
        parsed.setdefault("detailed_context", parsed.get("detailed_context", "") or "")
        return parsed
    # fallback minimal
    return {"novelty_percentage": 0, "unique_sections": [], "detailed_context": raw}

def run_self_validation(full_text: str, final_json: Dict[str, Any]) -> Dict[str, Any]:
    prompt = build_self_validation_prompt(full_text, final_json)
    raw = call_gemini(prompt)
    parsed = _safe_json_parse(raw)
    if parsed and isinstance(parsed, dict):
        # ensure keys
        return {
            "logic_checks": parsed.get("logic_checks", []),
            "consistency_checks": parsed.get("consistency_checks", []),
            "possible_errors": parsed.get("possible_errors", [])
        }
    return {
        "logic_checks": [],
        "consistency_checks": [],
        "possible_errors": ["self-validation JSON parse error"]
    }

# ---------------------------
# INNOVATION COMPARISON
# ---------------------------
def compare_innovation_against_past(innovation: str, past_jsons: List[Dict[str, Any]], sim_threshold: float = 0.55) -> List[Dict[str, Any]]:
    matches = []
    for past in past_jsons:
        # compare against unique_sections first
        best_sim = 0.0
        matched_texts = []
        for sec in past.get("unique_sections", []) or past.get("data", {}).get("unique_sections", []) or []:
            sim = similarity(innovation[:300], sec[:300])
            if sim > best_sim:
                best_sim = sim
                matched_texts = [sec]
            elif sim > 0.5:
                matched_texts.append(sec)
        # also compare against raw text snapshot
        raw_sim = similarity(innovation[:500], (past.get("raw") or "")[:500])
        if raw_sim > best_sim:
            best_sim = raw_sim
        if best_sim >= sim_threshold:
            matches.append({
                "file": past.get("filename"),
                "similarity": round(best_sim, 3),
                "matched_sections": matched_texts
            })
    return matches

# ---------------------------
# NOVELTY SCORING
# ---------------------------
def compute_novelty_score(total_innovations: int, truly_new_count: int) -> int:
    if total_innovations <= 0:
        return 0
    # base score: percent of truly new innovations, scaled to 0-100
    score = int(round((truly_new_count / total_innovations) * 100))
    # clamp
    return max(0, min(100, score))

# ---------------------------
# MAIN ROUTE
# ---------------------------
@router.post("/novelty-checks")
async def process_innovations(file: UploadFile = File(...)):
    try:
        data = await file.read()
        filename = sanitize_filename(file.filename or f"upload_{datetime.utcnow().isoformat()}")
        full_text = extract_text(filename, data)
        if not full_text or len(full_text.strip()) < 50:
            return JSONResponse({"error": "Could not extract meaningful text"}, status_code=400)

        # 1) Extract innovations from the whole document (primary)
        # We run a single extraction to get candidate innovations
        innovations = extract_innovations_from_text(full_text)
        # deduplicate and trim
        unique_innovations = []
        seen = set()
        for inv in innovations:
            s = re.sub(r"\s+", " ", inv.strip())
            if not s:
                continue
            k = s.lower()
            if k in seen:
                continue
            seen.add(k)
            unique_innovations.append(s)
        # limit to reasonable size
        unique_innovations = unique_innovations[:50]

        # 2) Load past novelty JSONs
        past_jsons = load_all_past_novelty_json()

        # 3) Compare each innovation with past DB
        already_existing = []
        truly_new = []
        comparison_map = {}  # innovation -> matches
        for inv in unique_innovations:
            matches = compare_innovation_against_past(inv, past_jsons, sim_threshold=0.55)
            comparison_map[inv] = matches
            if matches:
                already_existing.append({
                    "innovation": inv,
                    "matches": matches
                })
            else:
                truly_new.append(inv)

        # 4) Compute novelty score from idea-level comparison (do not modify LLM's own scoring)
        total_innov = len(unique_innovations)
        truly_new_count = len(truly_new)
        novelty_score = compute_novelty_score(total_innov, truly_new_count)

        # 5) For richer context, run chunk-level novelty analysis concurrently (to produce detailed_context)
        chunks = chunk_text(full_text, min_lines=60)
        if not chunks:
            chunks = [full_text]
        chunk_results = []
        max_workers = min(3, len(chunks))
        with ThreadPoolExecutor(max_workers=max_workers) as ex:
            futures = {ex.submit(analyze_chunk_novelty, ch): idx for idx, ch in enumerate(chunks)}
            for fut in as_completed(futures):
                try:
                    res = fut.result()
                    chunk_results.append(res)
                except Exception as e:
                    print("Chunk analysis failed:", e)

        # aggregate chunk results for detailed_context and unique_sections
        # prefer the longest detailed_context and union of unique_sections
        detailed_context = ""
        aggregated_unique_sections = []
        for r in chunk_results:
            if r.get("detailed_context") and len(r.get("detailed_context")) > len(detailed_context):
                detailed_context = r.get("detailed_context")
            for us in r.get("unique_sections", []):
                if us and us not in aggregated_unique_sections:
                    aggregated_unique_sections.append(us)
        # fallback if nothing produced
        if not detailed_context:
            detailed_context = "Detailed context not produced by chunk analysis. Using extracted innovations as explanation."

        final_unique_sections = aggregated_unique_sections[:10] or unique_innovations[:10]

        # 6) Self-validation: run LLM to check reasoning + JSON structure
        final_json_for_validation = {
            "novelty_percentage": novelty_score,
            "total_innovations": total_innov,
            "truly_new_count": truly_new_count,
            "truly_new_innovations": truly_new,
            "already_existing_innovations": already_existing,
            "unique_sections": final_unique_sections,
            "detailed_context": detailed_context
        }
        self_validation_report = run_self_validation(full_text, final_json_for_validation)

        # 7) Suggestions (non-destructive)
        suggestions = {
            "recommendations": [],
            "notes": []
        }
        if total_innov == 0:
            suggestions["recommendations"].append("No innovations extracted. Consider providing a longer or clearer description of innovations.")
        if len(full_text) < 800:
            suggestions["notes"].append("Document appears short; consider providing more detail to improve detection accuracy.")
        if already_existing:
            suggestions["notes"].append(f"{len(already_existing)} innovation(s) appear similar to past items — review matched files for duplication.")

        # 8) Compose final result (this is what will be stored and returned)
        result_record = {
            "filename": filename,
            "file_path": f"{RAW_BUCKET}/{filename}",
            "result": {
                "novelty_percentage": novelty_score,
                "total_innovations": total_innov,
                "truly_new_count": truly_new_count,
                "truly_new_innovations": truly_new,
                "already_existing_innovations": already_existing,
                "unique_sections": final_unique_sections,
                "detailed_context": detailed_context,
                "self_validation": self_validation_report,
                "suggestions": suggestions,
                "raw_text": full_text[:20000]  # store snippet for future matching
            },
            "created_at": datetime.utcnow().isoformat()
        }

        # 9) Save JSON to storage (use sanitized name)
        json_name = sanitize_filename(filename.rsplit(".", 1)[0]) + ".novelty.json"
        try:
            supabase.storage.from_(JSON_BUCKET).upload(
                json_name,
                json.dumps(result_record["result"], ensure_ascii=False).encode("utf-8"),
                {"content-type": "application/json"}
            )
        except Exception as e:
            # if bucket not found or upload fails, log and continue (DB insertion still attempted)
            print("Warning: upload to storage failed:", e)

        # get public URL if possible (bucket may be private)
        public_url = None
        try:
            public_url = supabase.storage.from_(JSON_BUCKET).get_public_url(json_name)
        except Exception:
            public_url = None

        # 10) Insert into DB
        try:
            supabase.table("novelty_reports").insert({
                "filename": result_record["filename"],
                "file_path": result_record["file_path"],
                "novelty_percentage": result_record["result"]["novelty_percentage"],
                "result": result_record["result"]
            }).execute()
        except Exception as e:
            print("Warning: DB insert failed:", e)

        # 11) Return final JSON payload to user (clear, structured)
        response_payload = {
            "filename": result_record["filename"],
            "novelty_percentage": result_record["result"]["novelty_percentage"],
            "total_innovations": result_record["result"]["total_innovations"],
            "truly_new_count": result_record["result"]["truly_new_count"],
            "truly_new_innovations": result_record["result"]["truly_new_innovations"],
            "already_existing_innovations": result_record["result"]["already_existing_innovations"],
            "unique_sections": result_record["result"]["unique_sections"],
            "self_validation": result_record["result"]["self_validation"],
            "suggestions": result_record["result"]["suggestions"],
            "json_url": public_url
        }
        return JSONResponse(response_payload)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)
