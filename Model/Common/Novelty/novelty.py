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
import joblib
import numpy as np
from pathlib import Path
from sklearn.neighbors import NearestNeighbors

load_dotenv()

# ---------------------------
# CONFIG
# ---------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")   # service_role recommended
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY2")

if not SUPABASE_URL or not SUPABASE_KEY or not GEMINI_API_KEY:
    raise Exception("Set SUPABASE_URL, SUPABASE_KEY, and GEMINI_API_KEY in environment")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-2.5-flash-lite"

RAW_BUCKET = "Coal-research-files"
JSON_BUCKET = "novelty-json"
PRETRAIN_DIR = os.path.join(os.path.dirname(__file__), "pre-trained")
os.makedirs(PRETRAIN_DIR, exist_ok=True)
NOVELTY_JOBLIB_PATH = os.path.join(PRETRAIN_DIR, "novelty_embeddings.joblib")

# lazy SBERT embedder (initialized on demand)
_SBERT_EMBEDDER = None
def get_sbert_embedder(model_name: str = "all-MiniLM-L6-v2"):
    global _SBERT_EMBEDDER
    if _SBERT_EMBEDDER is None:
        try:
            from sentence_transformers import SentenceTransformer
            _SBERT_EMBEDDER = SentenceTransformer(model_name)
        except Exception:
            _SBERT_EMBEDDER = None
    return _SBERT_EMBEDDER

# In-memory cache of precomputed embeddings/texts
_NOVELTY_STORE = {"texts": [], "embs": None}
# optional nearest-neighbor index for fast similarity search
_NOVELTY_STORE.setdefault("nn", None)

def load_novelty_joblib():
    """Load precomputed novelty embeddings/texts from joblib if available.
    If not present, attempt to build from DB/stored JSONs and persist.
    """
    global _NOVELTY_STORE
    if os.path.exists(NOVELTY_JOBLIB_PATH):
        try:
            data = joblib.load(NOVELTY_JOBLIB_PATH)
            texts = data.get("texts", [])
            embs = data.get("embs", None)
            nn = data.get("nn", None)
            if embs is not None:
                embs = np.asarray(embs)
            _NOVELTY_STORE = {"texts": texts, "embs": embs, "nn": nn}
            return _NOVELTY_STORE
        except Exception:
            pass
    # build from DB/JSON entries
    past = load_all_past_novelty_json()
    texts = []
    for p in past:
        # prefer unique_sections then raw
        for s in (p.get("unique_sections") or [])[:5]:
            if s and s not in texts:
                texts.append(s)
        raw = (p.get("raw") or "").strip()
        if raw and raw not in texts:
            texts.append(raw[:800])
    # compute embeddings if possible
    embedder = get_sbert_embedder()
    if embedder and texts:
        try:
            embs = embedder.encode(texts, convert_to_tensor=False, show_progress_bar=False)
            embs = [np.array(e).astype(np.float32) for e in embs]
            emb_arr = np.vstack(embs)
            # attempt to build a nearest-neighbor index for fast retrieval
            nn = None
            try:
                nn = NearestNeighbors(n_neighbors=10, metric='cosine').fit(emb_arr)
            except Exception:
                nn = None
            _NOVELTY_STORE = {"texts": texts, "embs": emb_arr, "nn": nn}
            try:
                joblib.dump({"texts": texts, "embs": emb_arr.tolist(), "nn": nn}, NOVELTY_JOBLIB_PATH)
            except Exception:
                pass
            return _NOVELTY_STORE
        except Exception:
            pass
    # fallback: store texts only
    _NOVELTY_STORE = {"texts": texts, "embs": None, "nn": None}
    try:
        joblib.dump({"texts": texts, "embs": None, "nn": None}, NOVELTY_JOBLIB_PATH)
    except Exception:
        pass
    return _NOVELTY_STORE

def save_novelty_joblib():
    global _NOVELTY_STORE
    try:
        data = {"texts": _NOVELTY_STORE.get("texts", []), "embs": _NOVELTY_STORE.get("embs"), "nn": _NOVELTY_STORE.get("nn")}
        # convert numpy array to list for joblib portability
        if isinstance(data["embs"], np.ndarray):
            data["embs"] = data["embs"].tolist()
        joblib.dump(data, NOVELTY_JOBLIB_PATH)
    except Exception:
        pass

def update_novelty_store_with_texts(new_texts: List[str]):
    """Embed new_texts and append to in-memory store and persist to joblib."""
    global _NOVELTY_STORE
    if not new_texts:
        return
    texts = _NOVELTY_STORE.get("texts", []) or []
    embs = _NOVELTY_STORE.get("embs", None)
    to_add = [t for t in new_texts if t and t not in texts]
    if not to_add:
        return
    embedder = get_sbert_embedder()
    if embedder:
        try:
            new_embs = embedder.encode(to_add, convert_to_tensor=False, show_progress_bar=False)
            new_embs = [np.array(e).astype(np.float32) for e in new_embs]
            if embs is None:
                embs_arr = np.vstack(new_embs)
            else:
                embs_arr = np.vstack([embs, np.vstack(new_embs)]) if isinstance(embs, np.ndarray) else np.vstack(new_embs)
            texts.extend(to_add)
            # rebuild nearest-neighbor index
            nn = None
            try:
                nn = NearestNeighbors(n_neighbors=10, metric='cosine').fit(embs_arr)
            except Exception:
                nn = None
            _NOVELTY_STORE = {"texts": texts, "embs": embs_arr, "nn": nn}
            save_novelty_joblib()
            return
        except Exception:
            pass
    # fallback: just append texts and save
    texts.extend(to_add)
    _NOVELTY_STORE = {"texts": texts, "embs": embs, "nn": None}
    save_novelty_joblib()

# initialize store at import
try:
    load_novelty_joblib()
except Exception:
    pass

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
    # Prefer reading from the Supabase table `novelty_reports` when available.
    json_list: List[Dict[str, Any]] = []
    try:
        res = supabase.table('novelty_reports').select('filename,result').order('created_at', desc=True).limit(1000).execute()
        rows = getattr(res, 'data', []) or []
        for r in rows:
            try:
                content = r.get('result') or {}
                json_list.append({
                    'filename': r.get('filename'),
                    'data': content,
                    'raw': content.get('raw_text', ''),
                    'unique_sections': content.get('unique_sections', []) or []
                })
            except Exception:
                continue
        if json_list:
            return json_list
    except Exception as e:
        # DB read failed; fall back to storage bucket
        print('Warning: failed to read novelty_reports from DB:', e)

    # Fallback: read from JSON storage bucket
    try:
        files = supabase.storage.from_(JSON_BUCKET).list()
    except Exception as e:
        print("Error listing JSON bucket:", e)
        return json_list
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
  "points_of_novelty": [],
  "detailed_context": ""
}}
- novelty_percentage: integer 0-100 for this chunk
- unique_sections: 2-6 short excerpts or summaries (8-40 words)
- points_of_novelty: list of all the novelty brief innovation points (each point need to be in 5-20 words)
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
    # 0) Fast path: check against precomputed embeddings store if available
    try:
        store_texts = _NOVELTY_STORE.get("texts", []) or []
        store_embs = _NOVELTY_STORE.get("embs", None)
        store_nn = _NOVELTY_STORE.get("nn", None)
        embedder = get_sbert_embedder()
        # Prefer nearest-neighbor index if available
        if store_nn is not None and embedder is not None:
            try:
                inv_emb = np.array(embedder.encode([innovation], convert_to_tensor=False))[0].astype(np.float32).reshape(1, -1)
                dists, idxs = store_nn.kneighbors(inv_emb, n_neighbors=min(10, len(store_texts)))
                for dist_row, idx_row in zip(dists, idxs):
                    for dist, idx in zip(dist_row, idx_row):
                        sim = 1.0 - float(dist)
                        if sim >= sim_threshold:
                            matches.append({
                                "file": "pretrained_store",
                                "similarity": round(sim, 3),
                                "matched_sections": [store_texts[int(idx)][:300]]
                            })
            except Exception:
                pass
        elif store_embs is not None and embedder is not None:
            try:
                inv_emb = np.array(embedder.encode([innovation], convert_to_tensor=False))[0].astype(np.float32)
                # compute cosine similarity
                norms = np.linalg.norm(store_embs, axis=1) * (np.linalg.norm(inv_emb) + 1e-12)
                sims = (store_embs @ inv_emb) / (norms + 1e-12)
                for idx, s in enumerate(sims.tolist()):
                    if s >= sim_threshold:
                        matches.append({
                            "file": "pretrained_store",
                            "similarity": round(float(s), 3),
                            "matched_sections": [store_texts[idx][:300]]
                        })
            except Exception:
                pass
    except Exception:
        pass

    # 1) Also perform canonical check against past JSONs (to return real filenames)
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

        # 10) Upsert into DB in a single atomic call (requires a unique index on `filename`)
        try:
            # coerce novelty_percentage into a numeric type
            npct = result_record["result"].get("novelty_percentage")
            try:
                npct_val = float(npct) if npct is not None else None
            except Exception:
                npct_val = None

            upsert_payload = {
                "filename": result_record["filename"],
                "file_path": result_record["file_path"],
                "novelty_percentage": npct_val,
                "result": result_record["result"]
            }
            # Use upsert to insert or update based on unique filename constraint
            try:
                supabase.table("novelty_reports").upsert(upsert_payload).execute()
            except Exception:
                # If upsert with this client isn't available, fall back to insert (best-effort)
                try:
                    supabase.table("novelty_reports").insert(upsert_payload).execute()
                except Exception as e:
                    print("Warning: DB insert fallback failed:", e)
        except Exception as e:
            print("Warning: DB upsert failed:", e)

        # 11) Update the persisted novelty joblib store with truly new innovations (if any)
        try:
            update_novelty_store_with_texts(truly_new)
        except Exception:
            pass

        # 11) Minimal response: return only the novelty score and a short improvement comment
        novelty_score = int(result_record["result"]["novelty_percentage"])

        # If novelty is low, ask Gemini for concise improvement suggestions (3 short suggestions)
        def build_novelty_improvement_prompt(score: int, truly_new: List[str], already_existing: List[Dict[str, Any]], context: str) -> str:
            sample_existing = ", ".join([m.get("file","") for m in (already_existing or [])[:5]])
            return f"""
You are an expert research advisor. A document scored {score}/100 for novelty.
Task: If the score is low, return 3 short, actionable suggestions (one per line) the authors can apply to increase novelty and reduce similarity to past work. Use the provided context and matched filenames to be specific.

Score: {score}
Truly-new-ideas-count: {len(truly_new)}
Some matched files: {sample_existing}
Context (short): {context[:600]}

Return exactly 3 short lines (each <=140 chars). If the score is high, return 1 short congratulatory line.
"""

        def call_gemini_improvements(prompt: str) -> str:
            try:
                model = genai.GenerativeModel(MODEL_NAME)
                resp = model.generate_content(prompt)
                raw = resp.text or ""
                lines = [ln.strip() for ln in raw.splitlines() if ln.strip()]
                if novelty_score >= 70:
                    # keep a single line
                    return (lines[0] if lines else "Novelty score looks strong; continue with clear validation and dissemination.")
                # need exactly 3 lines
                if len(lines) >= 3:
                    return "\n".join(lines[:3])
                # fallback to splitting sentences
                import re as _re
                sents = _re.split(r'(?<=[.?!])\s+', raw.strip()) if raw else []
                sents = [s.strip() for s in sents if s.strip()]
                if len(sents) >= 3:
                    return "\n".join(sents[:3])
            except Exception:
                pass
            # heuristic fallback
            if novelty_score >= 70:
                return "Novelty score strong; focus on validating and documenting the innovations."
            return "Add more specific, domain-level details. Emphasize unique methodology or datasets. Cite and compare to closest works."

        improvement_comment = call_gemini_improvements(build_novelty_improvement_prompt(novelty_score, truly_new, already_existing, detailed_context))

        # Build verbose formatted comment using Gemini (preferred) or fallback to local template
        def build_verbose_comment_prompt(score: int, total_innov: int, truly_new_count: int, context: str, existing_files_preview: str) -> str:
            return f"""
Produce a concise formatted evaluation comment for a proposal given the novelty score and context.
Output must follow this exact structure (including labels):

Score: <score>/100 Changeable: <percent>%
<One short paragraph (2-3 sentences) summarizing the proposal's novelty in plain language.>
Recommended actions:
- <action 1>
- <action 2>
- <action 3>

Inputs:
Score: {score}
Total innovations considered: {total_innov}
Truly new ideas count: {truly_new_count}
Context (short): {context[:800]}
Matched files (sample): {existing_files_preview}

Produce exactly the structure shown above. Keep each recommended action short (<=120 chars). If score >= 85, make the paragraph congratulatory and include one validation action plus two dissemination suggestions.
"""

        try:
            sample_existing = ", ".join([m.get("file", "") for m in (already_existing or [])[:5]])
            prompt = build_verbose_comment_prompt(novelty_score, total_innov, truly_new_count, (detailed_context or ""), sample_existing)
            raw_verbose = call_gemini(prompt)
            verbose_comment = raw_verbose.strip() if raw_verbose and isinstance(raw_verbose, str) else None
        except Exception:
            verbose_comment = None

        if not verbose_comment:
            # fallback: construct a local formatted comment
            changeable_pct = max(0, 100 - novelty_score)
            summary = (detailed_context.split('\n')[0] if detailed_context else 'Novelty summary unavailable.')
            recs = [
                "Document prior art and clearly highlight novel integration steps versus published work.",
                "Provide pilot test plans and small-scale validation data to substantiate claimed innovations.",
                "Include IP or patent landscape notes where applicable to strengthen novelty claims."
            ]
            verbose_comment = f"Score: {novelty_score}/100 Changeable: {changeable_pct}%\n{summary}\nRecommended actions:\n- {recs[0]}\n- {recs[1]}\n- {recs[2]}"

        return JSONResponse({
            "novelty_percentage": novelty_score,
            "comment": verbose_comment
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)
