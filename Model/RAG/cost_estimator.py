import os
import json
import re
import math
from io import BytesIO
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from difflib import SequenceMatcher
from typing import List, Optional

import PyPDF2
import chardet
import docx
import google.generativeai as genai
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse

from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# ---------- Config ----------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # server-only (service_role recommended)
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or not GEMINI_API_KEY:
    raise Exception("Set SUPABASE_URL, SUPABASE_KEY, and GEMINI_API_KEY in environment")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-2.5-flash-lite"  # adjust if you have other access

UPLOAD_BUCKET = "Coal-research-files"
JSON_BUCKET = "processed-json"

router = APIRouter()

# ---------- Helpers ----------
def extract_text_from_pdf_bytes(file_bytes: bytes) -> str:
    text = ""
    try:
        reader = PyPDF2.PdfReader(BytesIO(file_bytes))
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    except Exception:
        try:
            enc = chardet.detect(file_bytes)["encoding"] or "utf-8"
            return file_bytes.decode(enc, errors="ignore")
        except Exception:
            return ""
    return text

def extract_text_from_docx_bytes(file_bytes: bytes) -> str:
    doc = docx.Document(BytesIO(file_bytes))
    return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])

def extract_text_by_extension(filename: str, file_bytes: bytes) -> str:
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if ext == "pdf":
        return extract_text_from_pdf_bytes(file_bytes)
    elif ext == "docx":
        return extract_text_from_docx_bytes(file_bytes)
    elif ext in ("txt", "csv"):
        enc = chardet.detect(file_bytes)["encoding"] or "utf-8"
        return file_bytes.decode(enc, errors="ignore")
    else:
        return ""

def chunk_text_by_lines(text: str, min_lines_per_chunk: int = 60) -> List[str]:
    lines = [ln for ln in text.splitlines() if ln.strip() != ""]
    if not lines:
        return []
    chunks = []
    i = 0
    n = len(lines)
    while i < n:
        j = min(i + min_lines_per_chunk, n)
        chunk_lines = lines[i:j]
        chunks.append("\n".join(chunk_lines))
        i = j
    return chunks

def similar_ratio(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()

# ---------- Prompt builders ----------
def build_cost_prompt(context_text: str, past_examples: list) -> str:
    past_snippets = ""
    if past_examples:
        past_snippets = "\n\nPAST COST EXAMPLES:\n"
        for ex in past_examples:
            try:
                cost_val = ex.get("estimated_cost") or ex.get("result", {}).get("estimated_cost")
            except:
                cost_val = None
            past_snippets += f"- {ex.get('filename','<unknown>')} : ₹{cost_val}\n"

    prompt = f"""
You are a senior financial analyst and cost estimation specialist.
The cost need to be efficient and optimized according to the indian government regulations and standards.
Produce VALID JSON ONLY following the schema and rules below.

Schema:
{{
    "estimated_cost": 0,
    "cost_breakdown": {{
    "equipment": 0,
    "software_and_tools": 0,
    "manpower": 0,
    "data_collection": 0,
    "travel_and_fieldwork": 0,
    "cloud_and_compute": 0,
    "maintenance_and_operations": 0,
    "consumables": 0,
    "contingency": 0
    }},
    "confidence": 0.0,
    "similar_previous": null,
    "detailed_context": "..." 
}}

Rules:
- Return JSON ONLY, no commentary.
- All numeric costs must be integers in Indian Rupees.
- detailed_context must be verbose (aim for 50+ short lines) explaining assumptions and calculations.
- Use past examples (if provided) to calibrate numbers.

Past examples (if any):
{past_snippets}

DOCUMENT:
{context_text}

Respond with JSON only.
"""
    return prompt

def build_self_eval_prompt(original_text: str, past_examples: list, current_json: dict) -> str:
    # Include truncated original text and current json
    orig_trunc = original_text[:5000]
    past_snips = json.dumps(past_examples[:10], ensure_ascii=False, indent=2)
    cur_json_str = json.dumps(current_json, ensure_ascii=False, indent=2)
    prompt = f"""
You are an expert AI auditor for cost estimations.

ORIGINAL TEXT (truncated):
{orig_trunc}

PAST EXAMPLES:
{past_snips}

CURRENT ESTIMATION JSON:
{cur_json_str}

TASK:
1) Validate that total cost equals the sum of the breakdown categories.
2) Identify missing categories, obvious numeric errors, or unrealistic values.
3) Adjust numbers where needed, explain in the detailed_context (50+ lines).
4) Return a corrected JSON that follows the same schema EXACTLY (JSON only).

Return corrected JSON only.
"""
    return prompt

# ---------- LLM call wrappers ----------
def call_gemini_prompt(prompt: str, model_name: str = MODEL_NAME) -> str:
    model = genai.GenerativeModel(model_name)
    # single string call; guard with try/except in caller
    resp = model.generate_content(prompt)
    return resp.text or ""

def parse_json_from_text(text: str) -> Optional[dict]:
    if not text:
        return None
    m = re.search(r"\{[\s\S]*\}$", text.strip())
    raw = m.group(0) if m else text.strip()
    try:
        return json.loads(raw)
    except Exception:
        # try to salvage by removing trailing text
        try:
            # find first { and last }
            first = raw.find("{")
            last = raw.rfind("}")
            if first != -1 and last != -1 and last > first:
                candidate = raw[first:last+1]
                return json.loads(candidate)
        except Exception:
            return None
    return None

# ---------- Chunk-level estimator ----------
def call_gemini_for_chunk(chunk_text: str, past_examples: list) -> dict:
    prompt = build_cost_prompt(chunk_text, past_examples)
    try:
        raw = call_gemini_prompt(prompt)
        parsed = parse_json_from_text(raw)
        if not parsed:
            return {"raw_output": raw, "estimated_cost": 0, "cost_breakdown": {}, "confidence": 0.0, "detailed_context": raw}
        # Normalize
        parsed.setdefault("estimated_cost", int(parsed.get("estimated_cost", 0) or 0))
        parsed.setdefault("cost_breakdown", parsed.get("cost_breakdown", {}))
        parsed.setdefault("confidence", float(parsed.get("confidence", 0.0) or 0.0))
        parsed.setdefault("similar_previous", parsed.get("similar_previous", None))
        parsed.setdefault("detailed_context", parsed.get("detailed_context", ""))
        return parsed
    except Exception as e:
        return {"raw_output": str(e), "estimated_cost": 0, "cost_breakdown": {}, "confidence": 0.0, "detailed_context": ""}

# ---------- Self-evaluation ----------
def self_evaluate_and_fix(final_json: dict, original_text: str, past_examples: list) -> dict:
    prompt = build_self_eval_prompt(original_text, past_examples, final_json)
    try:
        raw = call_gemini_prompt(prompt)
        parsed = parse_json_from_text(raw)
        if parsed:
            # ensure integers for costs
            parsed["estimated_cost"] = int(parsed.get("estimated_cost", 0) or 0)
            for k, v in (parsed.get("cost_breakdown") or {}).items():
                try:
                    parsed["cost_breakdown"][k] = int(v or 0)
                except Exception:
                    parsed["cost_breakdown"][k] = 0
            parsed["confidence"] = float(parsed.get("confidence", 0.0) or 0.0)
            return parsed
    except Exception:
        pass
    # fallback: ensure original JSON is minimally valid
    final_json["estimated_cost"] = int(final_json.get("estimated_cost", 0) or 0)
    final_json["cost_breakdown"] = {k: int(v or 0) for k, v in (final_json.get("cost_breakdown") or {}).items()}
    final_json.setdefault("confidence", 0.0)
    return final_json

# ---------- Past examples fetch ----------
def fetch_past_estimations(limit: int = 10) -> list:
    try:
        res = supabase.table("cost_estimations").select("id, filename, result, estimated_cost").order("created_at", {"ascending": False}).limit(limit).execute()
        if getattr(res, "error", None):
            return []
        return getattr(res, "data", []) or []
    except Exception:
        return []

def find_most_similar_past(text: str, past_examples: list, threshold: float = 0.55):
    best = None
    best_score = 0.0
    for ex in past_examples:
        ex_text = None
        try:
            ex_text = (ex.get("result") or {}).get("raw_text")
        except Exception:
            ex_text = None
        if not ex_text:
            continue
        score = similar_ratio(text[:2000], ex_text[:2000])
        if score > best_score:
            best_score = score
            best = ex
    if best_score >= threshold:
        return best, best_score
    return None, best_score

# ---------- Aggregation ----------
def aggregate_chunk_results(chunk_results: List[dict], similar_found: dict = None) -> dict:
    total = 0.0
    breakdown = {}
    confidences = []
    for r in chunk_results:
        cost = r.get("estimated_cost") or 0
        total += float(cost)
        for k, v in (r.get("cost_breakdown") or {}).items():
            breakdown[k] = breakdown.get(k, 0) + float(v or 0)
        try:
            confidences.append(float(r.get("confidence") or 0.0))
        except Exception:
            pass
    avg_conf = (sum(confidences) / len(confidences)) if confidences else 0.0
    if similar_found:
        prev_cost = float(similar_found.get("estimated_cost") or (similar_found.get("result") or {}).get("estimated_cost") or 0)
        blended = int(math.ceil(0.6 * total + 0.4 * prev_cost))
        return {
            "estimated_cost": blended,
            "cost_breakdown": {k: int(v) for k, v in breakdown.items()},
            "confidence": round(avg_conf, 3),
            "blend_with_previous_id": similar_found.get("id")
        }
    return {
        "estimated_cost": int(math.ceil(total)),
        "cost_breakdown": {k: int(v) for k, v in breakdown.items()},
        "confidence": round(avg_conf, 3)
    }

# ---------- Endpoint ----------
@router.post("/process-and-estimate")
async def process_and_estimate(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        filename = file.filename

        # optional: upload raw file for storage (silently continue on failure)
        try:
            supabase.storage.from_(UPLOAD_BUCKET).upload(
                filename, file_bytes, {"content-type": file.content_type}
            )
        except Exception as e:
            print("Warning: raw upload failed:", e)

        full_text = extract_text_by_extension(filename, file_bytes)
        if not full_text or len(full_text.strip()) < 50:
            return JSONResponse({"error": "Could not extract meaningful text from file"}, status_code=400)

        # chunk text
        chunks = chunk_text_by_lines(full_text, min_lines_per_chunk=60)
        if not chunks:
            chunks = [full_text]

        # fetch past examples and find similarity
        past_examples = fetch_past_estimations(limit=20)
        similar, sim_score = find_most_similar_past(full_text, past_examples, threshold=0.55)
        if similar:
            print("Found similar past example:", similar.get("id"), "score:", sim_score)

        # concurrent chunk processing
        max_workers = min(2, len(chunks))  # conservative for rate limits; tune for your account
        chunk_results = []
        with ThreadPoolExecutor(max_workers=max_workers) as exe:
            futures = {exe.submit(call_gemini_for_chunk, chunk, past_examples): idx for idx, chunk in enumerate(chunks)}
            for fut in as_completed(futures):
                idx = futures[fut]
                try:
                    res = fut.result()
                except Exception as exc:
                    print(f"Chunk {idx} failed:", exc)
                    res = {"estimated_cost": 0, "cost_breakdown": {}, "confidence": 0.0, "detailed_context": ""}
                chunk_results.append(res)

        # aggregate
        final = aggregate_chunk_results(chunk_results, similar_found=similar)

        # pick best detailed_context or combine
        best_context = max((r.get("detailed_context","") for r in chunk_results), key=len, default="")
        final["detailed_context"] = best_context or "\n".join([c[:1000] for c in chunks])

        # --- SELF-EVALUATION (run in thread to avoid blocking if desired) ---
        try:
            with ThreadPoolExecutor(max_workers=1) as exe:
                future = exe.submit(self_evaluate_and_fix, final, full_text, past_examples)
                final = future.result(timeout=120)  # adjust timeout as needed
        except Exception as e:
            print("Self-eval failed or timed out:", e)

        # prepare record
        record = {
            "filename": filename,
            "file_path": f"{UPLOAD_BUCKET}/{filename}",
            "result": {
                "estimated_cost": final["estimated_cost"],
                "cost_breakdown": final["cost_breakdown"],
                "confidence": final["confidence"],
                "detailed_context": final.get("detailed_context",""),
                "raw_text": full_text[:20000]
            },
            "estimated_cost": final["estimated_cost"],
            "created_at": datetime.utcnow().isoformat()
        }

        # upload result JSON to storage
        json_name = filename.rsplit(".", 1)[0] + ".cost.json"
        try:
            supabase.storage.from_(JSON_BUCKET).upload(
                json_name,
                json.dumps(record["result"], ensure_ascii=False).encode("utf-8"),
                {"content-type": "application/json"}
            )
        except Exception as e:
            print("Warning: failed to upload result to storage:", e)

        # insert record into DB
        try:
            insert_res = supabase.table("cost_estimations").insert({
                "filename": record["filename"],
                "file_path": record["file_path"],
                "result": record["result"],
                "estimated_cost": record["estimated_cost"]
            }).execute()
            if getattr(insert_res, "error", None):
                print("DB insert error:", insert_res.error)
        except Exception as e:
            print("Warning: DB insert failed:", e)

        public_url = None
        try:
            public_url = supabase.storage.from_(JSON_BUCKET).get_public_url(json_name)
        except Exception:
            pass

        out = {
            "filename": filename,
            "estimated_cost": final["estimated_cost"],
            "cost_breakdown": final["cost_breakdown"],
            "confidence": final.get("confidence", 0.0),
            "json_url": public_url,
            "detailed_context_excerpt": final.get("detailed_context","")[:4000]
        }
        return JSONResponse(out)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)
