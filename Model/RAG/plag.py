import os
import json
import re
import hashlib
from io import BytesIO
from datetime import datetime
from difflib import SequenceMatcher
from typing import List, Dict, Any
from multiprocessing import Pool, cpu_count

import PyPDF2
import chardet
import docx
import google.generativeai as genai
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# -------------------------
# CONFIG - set in .env
# -------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # service_role
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or not GEMINI_API_KEY:
    raise Exception("Set SUPABASE_URL, SUPABASE_KEY and GEMINI_API_KEY in environment")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-2.5-flash-lite"
RAW_BUCKET = "Coal-research-files"
PLAG_BUCKET = "plagiarism-json"
PROCESSED_BUCKET = "processed-json"     # other processed results to compare with
PROCESSED_DOCS_TABLE = "processed_documents"  # optional table

router = APIRouter()

# -------------------------
# UTILITIES
# -------------------------
def sha256_bytes(b: bytes) -> str:
    h = hashlib.sha256()
    h.update(b)
    return h.hexdigest()

def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, (a or "")[:1000], (b or "")[:1000]).ratio()

def sanitize_filename(name: str) -> str:
    name = name.strip()
    name = re.sub(r"[<>:\"/\\|?*]+", "_", name)
    return name

def safe_json_parse(text: str) -> Any:
    if not text:
        return None
    m = re.search(r"\{[\s\S]*\}$", text.strip())
    raw = m.group(0) if m else text.strip()
    try:
        return json.loads(raw)
    except Exception:
        # fallback: attempt to find braces
        try:
            f = raw.find("{"); l = raw.rfind("}")
            if f != -1 and l != -1 and l > f:
                return json.loads(raw[f:l+1])
        except Exception:
            return None
    return None

# -------------------------
# TEXT EXTRACTION
# -------------------------
def extract_pdf(b: bytes) -> str:
    try:
        r = PyPDF2.PdfReader(BytesIO(b))
        out = ""
        for p in r.pages:
            t = p.extract_text()
            if t:
                out += t + "\n"
        return out
    except Exception:
        enc = chardet.detect(b)["encoding"] or "utf-8"
        try:
            return b.decode(enc, errors="ignore")
        except:
            return ""

def extract_docx(b: bytes) -> str:
    try:
        d = docx.Document(BytesIO(b))
        return "\n".join([p.text for p in d.paragraphs if p.text.strip()])
    except Exception:
        return ""

def extract_text(filename: str, b: bytes) -> str:
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if ext == "pdf":
        return extract_pdf(b)
    if ext == "docx":
        return extract_docx(b)
    # fallback text/csv
    enc = chardet.detect(b)["encoding"] or "utf-8"
    try:
        return b.decode(enc, errors="ignore")
    except:
        return ""

# -------------------------
# SEGMENTATION (paragraph-first, then sentence-chunk)
# -------------------------
def segment_text(text: str, min_chars: int = 300) -> List[str]:
    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    segs = []
    cur = ""
    for p in paras:
        if not cur:
            cur = p
        elif len(cur) + len(p) + 2 <= min_chars:
            cur += "\n\n" + p
        else:
            if len(cur) < min_chars:
                cur += "\n\n" + p
            else:
                segs.append(cur)
                cur = p
    if cur:
        segs.append(cur)
    # split long segments by sentences
    out = []
    for s in segs:
        if len(s) <= 1000:
            out.append(s)
        else:
            sents = re.split(r'(?<=[.!?])\s+', s)
            chunk = ""
            for sent in sents:
                if not chunk:
                    chunk = sent
                elif len(chunk) + len(sent) < 900:
                    chunk += " " + sent
                else:
                    out.append(chunk.strip())
                    chunk = sent
            if chunk:
                out.append(chunk.strip())
    return out

# -------------------------
# LOAD PAST REFERENCE TEXTS (once)
# -------------------------
def load_past_texts(limit: int = 500) -> List[Dict[str, Any]]:
    """Load raw_text from processed JSON buckets and from processed_documents table (if exists)."""
    results = []
    # from processed-json bucket
    buckets = [PROCESSED_BUCKET, "novelty-json", PLAG_BUCKET]
    for bucket in buckets:
        try:
            files = supabase.storage.from_(bucket).list()
        except Exception:
            files = []
        for f in files or []:
            name = f.get("name")
            if not name or not name.endswith(".json"):
                continue
            try:
                blob = supabase.storage.from_(bucket).download(name)
                obj = json.loads(blob.decode("utf-8"))
                raw = obj.get("raw_text") or obj.get("raw") or obj.get("result", {}).get("raw_text") or ""
                if raw:
                    results.append({"filename": name, "raw": raw, "bucket": bucket})
            except Exception:
                continue
    # from processed_documents table
    try:
        res = supabase.table(PROCESSED_DOCS_TABLE).select("filename, raw_text").limit(limit).execute()
        rows = getattr(res, "data", []) or []
        for r in rows:
            if r.get("raw_text"):
                results.append({"filename": r.get("filename"), "raw": r.get("raw_text"), "bucket": PROCESSED_DOCS_TABLE})
    except Exception:
        pass
    return results

# load once per process (kept small to reduce prompt size)
PAST_TEXTS = load_past_texts()

# -------------------------
# PROMPT: per-segment classification with your 7 rules
# -------------------------
PLAG_PROMPT_TEMPLATE = """
You are an academic plagiarism analyst. For the segment below, judge if it is:
 - directly copied (verbatim),
 - paraphrased (same idea but reworded),
 - or original.
Also decide if the segment contains claims that should have citations but none are present.

Follow these rules precisely (do NOT ignore):
1) Paraphrase means full rewrite + added interpretation; merely replacing 2-3 words is still plagiarism.
2) When text is paraphrased from a source, mark paraphrased = true and include matched source snippet.
3) If exact phrase (>=90% overlap) exists in prior docs mark copied = true.
4) If claims/statistics/theories appear without citation, mark missing_citation = true.
5) Suggest citation format example (APA or IEEE) for any matched source.
6) Output strict JSON only — no extra text.

Return JSON:
{{
  "segment_text": "...",
  "copied": false,
  "paraphrased": false,
  "missing_citation": false,
  "severity": "low|medium|high",
  "confidence": 0.0,
  "matched_files": [
    {{
      "filename": "",
      "similarity": 0.0,
      "matched_snippet": ""
    }}
  ],
  "citation_suggestion": "", 
  "notes": ""
}}

PAST_SNIPPETS_PREVIEW:
{past_preview}

SEGMENT:
{segment}
"""

def build_prompt_for_segment(segment: str, candidate_snippets: List[str]) -> str:
    preview = "\n\n".join(s[:800] for s in candidate_snippets[:6])
    return PLAG_PROMPT_TEMPLATE.format(past_preview=preview, segment=segment[:1800])

# -------------------------
# MODEL CALL
# -------------------------
def call_gemini_prompt(prompt: str, timeout_seconds: int = 25) -> Dict[str, Any]:
    """
    Single-call wrapper. We keep this simple; if JSON parse fails, we return conservative defaults.
    """
    try:    
        model = genai.GenerativeModel(MODEL_NAME)
        resp = model.generate_content(prompt)
        raw = resp.text or ""
        parsed = safe_json_parse(raw)
        if parsed and isinstance(parsed, dict):
            return parsed
    except Exception:
        pass
    # conservative fallback
    return {
        "segment_text": prompt.split("SEGMENT:")[-1].strip()[:1000],
        "copied": False,
        "paraphrased": False,
        "missing_citation": False,
        "severity": "low",
        "confidence": 0.0,
        "matched_files": [],
        "citation_suggestion": "",
        "notes": "fallback or parse fail"
    }

# -------------------------
# WORKER (for multiprocessing)
# -------------------------
def worker_segment(args):
    idx, segment, past_texts = args
    # quick candidate selection by cheap similarity
    scored = []
    for p in past_texts:
        try:
            s = similarity(segment[:800], p["raw"][:800])
        except Exception:
            s = 0.0
        if s > 0.18:  # coarse filter
            scored.append((s, p))
    scored.sort(reverse=True, key=lambda x: x[0])
    candidates = [p["raw"] for _, p in scored[:8]]
    prompt = build_prompt_for_segment(segment, candidates)
    res = call_gemini_prompt(prompt)
    # enrich matched_files similarity numbers if present
    mf = []
    for m in res.get("matched_files", []):
        fname = m.get("filename", "")
        snippet = m.get("matched_snippet", "") or ""
        sim = 0.0
        # if this filename is one of scored, compute similarity estimate
        for sscore, p in scored:
            if p["filename"] == fname:
                sim = round(sscore, 3)
                break
        mf.append({"filename": fname, "similarity": float(m.get("similarity", sim)), "matched_snippet": snippet[:800]})
    res["matched_files"] = mf
    res["segment_index"] = idx
    return res

# -------------------------
# AGGREGATION
# -------------------------
def aggregate_results(segment_reports: List[Dict[str, Any]]) -> Dict[str, Any]:
    total_chars = sum(len(r.get("segment_text","")) for r in segment_reports) or 1
    copied_chars = 0
    paraphrased_chars = 0
    weighted_similarity = 0.0
    copied_sections = []
    paraphrased_sections = []
    matched_files_map = {}

    for r in segment_reports:
        seg_len = len(r.get("segment_text",""))
        w = seg_len / total_chars
        if r.get("copied"):
            copied_chars += seg_len
            copied_sections.append({"segment_index": r.get("segment_index"), "text": r.get("segment_text")[:600], "confidence": r.get("confidence",0.0)})
        if r.get("paraphrased"):
            paraphrased_chars += seg_len
            paraphrased_sections.append({"segment_index": r.get("segment_index"), "text": r.get("segment_text")[:600], "confidence": r.get("confidence",0.0)})
        # pick best similarity from matched_files if any
        best_sim = 0.0
        for m in r.get("matched_files", []):
            s = float(m.get("similarity") or 0.0)
            if s > best_sim:
                best_sim = s
            # aggregate
            if m.get("filename"):
                matched_files_map.setdefault(m["filename"], []).append({"similarity": s, "snippet": m.get("matched_snippet","")})
        weighted_similarity += best_sim * w

    plagiarism_percentage = int(round(100.0 * (copied_chars / total_chars)))  # proportion of chars that are copied
    # add paraphrase weight: treat paraphrase as 0.5 weight to plagiarism
    paraphrase_weight = paraphrased_chars / total_chars * 0.5
    plagiarism_percentage = int(max(0, min(100, round(plagiarism_percentage + paraphrase_weight * 100))))

    similarity_percentage = int(round(weighted_similarity * 100))

    matched_files = []
    for fname, hits in matched_files_map.items():
        avg = sum(h["similarity"] for h in hits) / len(hits)
        matched_files.append({"filename": fname, "avg_similarity": round(avg,3), "matches_count": len(hits), "example_snippets": [h["snippet"][:300] for h in hits[:3]]})
    matched_files.sort(key=lambda x: x["avg_similarity"], reverse=True)

    return {
        "plagiarism_percentage": plagiarism_percentage,
        "similarity_percentage": similarity_percentage,
        "copied_sections": copied_sections,
        "paraphrased_sections": paraphrased_sections,
        "matched_files": matched_files
    }

# -------------------------
# RAW FILE EXISTENCE / RENAMING
# -------------------------
def find_existing_by_filename_or_hash(filename: str, file_bytes: bytes) -> Dict[str, Any]:
    """
    If same filename exists -> return {"type":"name","existing_name":...}
    If same content hash exists -> return {"type":"hash","existing_name":...}
    Else return {}
    """
    try:
        files = supabase.storage.from_(RAW_BUCKET).list()
    except Exception:
        files = []
    new_hash = sha256_bytes(file_bytes)
    # check filename match
    for f in files or []:
        if f.get("name") == filename:
            return {"type": "name", "existing_name": f.get("name")}
    # check hash match by downloading - if many files, this is expensive; we still attempt but you can optimize by storing hashes in DB
    for f in files or []:
        try:
            blob = supabase.storage.from_(RAW_BUCKET).download(f.get("name"))
            if sha256_bytes(blob) == new_hash:
                return {"type": "hash", "existing_name": f.get("name")}
        except Exception:
            continue
    return {}

def make_unique_filename(filename: str, existing_names: List[str]) -> str:
    base, ext = (filename.rsplit(".",1)+[""])[:2]
    ext = "."+ext if ext else ""
    candidate = filename
    i = 1
    while candidate in existing_names:
        candidate = f"{base}-v{i}{ext}"
        i += 1
    return candidate

# -------------------------
# MAIN FAST ENDPOINT (multiprocess)
# -------------------------
@router.post("/check-plagiarism-final")
async def check_plagiarism_final(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        original_name = sanitize_filename(file.filename or f"upload_{datetime.utcnow().isoformat()}")
        text = extract_text(original_name, file_bytes)
        if not text or len(text.strip()) < 50:
            return JSONResponse({"error": "No usable text extracted"}, status_code=400)

        # 1) compute existence / renaming rules
        existing = find_existing_by_filename_or_hash(original_name, file_bytes)
        rename_performed = False
        stored_raw = False
        uploaded_name = original_name

        # if name exists (same filename), we will rename the new file (keep old intact)
        if existing.get("type") == "name":
            # get current list of names
            try:
                files = supabase.storage.from_(RAW_BUCKET).list() or []
                existing_names = [f.get("name") for f in files]
            except Exception:
                existing_names = []
            new_name = make_unique_filename(original_name, existing_names)
            uploaded_name = new_name
            rename_performed = True

        # if hash exists (identical content), don't upload raw file again
        if existing.get("type") == "hash":
            uploaded_name = existing.get("existing_name")
            stored_raw = False
        else:
            # upload raw file under uploaded_name
            try:
                supabase.storage.from_(RAW_BUCKET).upload(uploaded_name, file_bytes, {"content-type": "application/octet-stream"})
                stored_raw = True
            except Exception:
                stored_raw = False

        # 2) segment the text
        segments = segment_text(text, min_chars=350)
        if not segments:
            segments = [text]

        # 3) prepare worker args and run in parallel
        past_texts = PAST_TEXTS  # preloaded list of {"filename","raw","bucket"}
        workers = min(cpu_count(), 10)
        args = [(i, segments[i], past_texts) for i in range(len(segments))]
        with Pool(processes=workers) as pool:
            results = pool.map(worker_segment, args)

        # 4) aggregate
        summary = aggregate_results(results)

        final_report = {
            "filename_uploaded_as": uploaded_name,
            "original_filename": original_name,
            "rename_performed": rename_performed,
            "stored_raw_file": stored_raw,
            "created_at": datetime.utcnow().isoformat(),
            "segments_count": len(results),
            "segments": results,
            "plagiarism_summary": summary,
            "raw_text_snippet": text[:20000]
        }

        # 5) insert into DB and storage
        json_name = sanitize_filename(uploaded_name.rsplit(".",1)[0]) + ".plag.json"
        try:
            supabase.storage.from_(PLAG_BUCKET).upload(json_name, json.dumps(final_report, ensure_ascii=False).encode("utf-8"), {"content-type":"application/json"})
        except Exception:
            pass

        try:
            supabase.table("plagiarism_reports").insert({
                "filename": uploaded_name,
                "file_path": f"{RAW_BUCKET}/{uploaded_name}",
                "plagiarism_percentage": summary.get("plagiarism_percentage"),
                "similarity_percentage": summary.get("similarity_percentage"),
                "result": final_report
            }).execute()
        except Exception:
            pass

        # 6) Prepare response with details and suggested next actions (per your rules)
        suggestions = []
        p = summary.get("plagiarism_percentage", 0)
        if p <= 15:
            suggestions.append("Similarity is excellent (0-15%). Good to proceed.")
        elif p <= 25:
            suggestions.append("Similarity acceptable if properly cited. Add citations where needed.")
        else:
            suggestions.append("High similarity (>30%). Strongly revise: paraphrase properly, add original analysis, and add citations.")

        response = {
            "original_filename": original_name,
            "stored_as": uploaded_name,
            "rename_performed": rename_performed,
            "stored_raw_file": stored_raw,
            "plagiarism_percentage": summary.get("plagiarism_percentage"),
            "similarity_percentage": summary.get("similarity_percentage"),
            "top_matched_files": summary.get("matched_files")[:6],
            "copied_sections": summary.get("copied_sections"),
            "paraphrased_sections": summary.get("paraphrased_sections"),
            "suggestions": suggestions,
            "json_report_name": json_name
        }
        return JSONResponse(response)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)
