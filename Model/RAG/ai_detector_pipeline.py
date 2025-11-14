# ai_sentence_detector_option_b.py
import os
import json
import re
import hashlib
from io import BytesIO
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from multiprocessing import Pool, cpu_count

import PyPDF2
import chardet
import docx
import google.generativeai as genai
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from supabase import create_client, Client

# Optional detector libs
try:
    import importlib
    typetruth = importlib.import_module("typetruth")
    TYPETRUTH_AVAILABLE = True
except Exception:
    typetruth = None
    TYPETRUTH_AVAILABLE = False


try:
    from transformers import GPT2LMHeadModel, GPT2TokenizerFast
    TRANSFORMERS_AVAILABLE = True
except Exception:
    TRANSFORMERS_AVAILABLE = False

load_dotenv()

# --------------------- CONFIG ---------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or not GEMINI_API_KEY:
    raise Exception("Set SUPABASE_URL, SUPABASE_KEY and GEMINI_API_KEY in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-2.5-flash-lite"   # validator model used in main process
RAW_BUCKET = "Coal-research-files"
REPORT_BUCKET = "ai-detection-json"
REPORT_TABLE = "ai_detection_reports"

router = APIRouter()

# --------------------- Utilities ---------------------
def sha256_bytes(b: bytes) -> str:
    import hashlib
    h = hashlib.sha256()
    h.update(b)
    return h.hexdigest()

def sanitize_filename(name: str) -> str:
    name = name.strip()
    name = re.sub(r"[<>:\"/\\|?*]+", "_", name)
    return name

def safe_json_parse(text: str) -> Optional[Dict]:
    if not text:
        return None
    txt = text.strip()
    m = re.search(r"\{[\s\S]*\}$", txt)
    raw = m.group(0) if m else txt
    try:
        return json.loads(raw)
    except Exception:
        try:
            f = raw.find("{"); l = raw.rfind("}")
            if f != -1 and l != -1 and l > f:
                return json.loads(raw[f:l+1])
        except Exception:
            return None
    return None

# --------------------- Text extraction ---------------------
def text_from_pdf_bytes(b: bytes) -> str:
    try:
        reader = PyPDF2.PdfReader(BytesIO(b))
        out = ""
        for p in reader.pages:
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

def text_from_docx_bytes(b: bytes) -> str:
    try:
        doc = docx.Document(BytesIO(b))
        return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    except Exception:
        return ""

def extract_text(filename: str, data: bytes) -> str:
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if ext == "pdf":
        return text_from_pdf_bytes(data)
    if ext == "docx":
        return text_from_docx_bytes(data)
    enc = chardet.detect(data)["encoding"] or "utf-8"
    try:
        return data.decode(enc, errors="ignore")
    except:
        return ""

# --------------------- Segmentation ---------------------
def segment_text_by_paragraphs(text: str, min_chars: int = 300) -> List[str]:
    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    if not paras:
        paras = [ln.strip() for ln in text.splitlines() if ln.strip()]
    segments = []
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
                segments.append(cur)
                cur = p
    if cur:
        segments.append(cur)
    out = []
    for s in segments:
        if len(s) <= 1200:
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

def split_sentences(segment: str) -> List[str]:
    # keep sentence boundaries; fallback to splitting on periods
    sents = re.split(r'(?<=[.!?])\s+', segment.strip())
    sents = [s.strip() for s in sents if s.strip()]
    if not sents:
        return [segment.strip()]
    return sents

# --------------------- Local detectors ---------------------
def detect_with_typetruth(text: str) -> float:
    try:
        if hasattr(typetruth, "predict"):
            res = typetruth.predict(text)
            if isinstance(res, dict) and "ai_prob" in res:
                return float(res["ai_prob"])
        if hasattr(typetruth, "score"):
            return float(typetruth.score(text))
    except Exception:
        return 0.0
    return 0.0

# GPT-2 perplexity fallback (lazy load per worker)
def _perplexity_score_gpt2(text: str, cache: Dict) -> float:
    try:
        if "tokenizer" not in cache:
            cache["tokenizer"] = GPT2TokenizerFast.from_pretrained("gpt2")
            cache["model"] = GPT2LMHeadModel.from_pretrained("gpt2")
            cache["model"].eval()
        tokenizer = cache["tokenizer"]
        model = cache["model"]
        enc = tokenizer(text, return_tensors="pt", truncation=True, max_length=1024)
        import torch
        with torch.no_grad():
            out = model(enc["input_ids"], labels=enc["input_ids"])
            loss = float(out.loss.item())
        import math
        ppl = math.exp(loss) if loss < 100 else float("inf")
        if ppl == float("inf"):
            return 0.0
        if ppl <= 10:
            return 0.98
        if ppl >= 200:
            return 0.02
        val = 1 - (math.log(ppl) - math.log(10)) / (math.log(200) - math.log(10))
        val = max(0.0, min(0.99, val))
        return float(val)
    except Exception:
        return 0.0

def detect_segment_and_sentences_local(segment: str, cache: Dict) -> Dict[str, Any]:
    """
    Returns detector score for segment and for each sentence.
    This runs inside worker processes only and must be pickle-safe.
    """
    # segment score
    seg_score = 0.0
    if TYPETRUTH_AVAILABLE:
        try:
            seg_score = detect_with_typetruth(segment)
        except Exception:
            seg_score = 0.0
    elif TRANSFORMERS_AVAILABLE:
        try:
            seg_score = _perplexity_score_gpt2(segment, cache)
        except Exception:
            seg_score = 0.0
    else:
        words = segment.split()
        if len(words) > 6:
            avg_word_len = sum(len(w) for w in words) / len(words)
            heur = 0.45 if avg_word_len < 4 else 0.18
            seg_score = round(float(min(0.99, heur * (len(segment) / 1000))), 4)

    # sentence scores
    sentences = split_sentences(segment)
    sentence_scores = []
    for s in sentences:
        s_score = 0.0
        if TYPETRUTH_AVAILABLE:
            try:
                s_score = detect_with_typetruth(s)
            except Exception:
                s_score = 0.0
        elif TRANSFORMERS_AVAILABLE:
            try:
                s_score = _perplexity_score_gpt2(s, cache)
            except Exception:
                s_score = 0.0
        else:
            words = s.split()
            if len(words) > 4:
                avg_word_len = sum(len(w) for w in words) / len(words)
                heur = 0.5 if avg_word_len < 4 else 0.18
                s_score = round(float(min(0.99, heur * (len(s) / 800))), 4)
            else:
                s_score = 0.0
        sentence_scores.append({"sentence_text": s, "sentence_ai_prob": float(round(s_score, 6))})

    return {"segment_ai_prob": float(round(seg_score, 6)), "sentences": sentence_scores}

# --------------------- Worker wrapper ---------------------
def worker_detector_sentences(args):
    """
    Worker receives (index, segment). Uses per-process cache via attribute.
    """
    idx, segment = args
    if not hasattr(worker_detector_sentences, "_cache"):
        worker_detector_sentences._cache = {}
    cache = worker_detector_sentences._cache
    res = detect_segment_and_sentences_local(segment, cache)
    return {
        "segment_index": int(idx),
        "segment_text": segment,
        "ai_probability_detector": float(res["segment_ai_prob"]),
        "sentences": res["sentences"]
    }

# --------------------- Gemini validator (main process) ---------------------
def build_gemini_sentence_validation_prompt(sentence: str, ai_prob: float, past_reports_sample: List[Dict[str, Any]]) -> str:
    past_preview = "\n\n".join(f"--- {r.get('filename')} ---\n{(r.get('result') or {}).get('raw_text','')[:600]}" for r in (past_reports_sample or [])[:6])
    prompt = f"""
You are an expert auditor of AI-generated text. You will be given:
1) a single sentence,
2) the AI-detector's probability (0.0-1.0),
3) short past report snippets for context.

TASKS:
- Confirm or correct the detector probability.
- Decide: 'ai' if sentence likely written/generated by an LLM, 'human' otherwise, 'uncertain' if unclear.
- If 'ai', list reasons (style, repetition, unnatural phrasing, low semantic coherence, pattern).
- If similar to any past snippet, include filename and short note.
- Output ONLY valid JSON with keys:
{{
  "validated_ai_probability": 0.0,
  "decision": "ai"|"human"|"uncertain",
  "comment": "COMMENT: <one-line verdict> | REASONS: <comma-separated> | CONFIDENCE: <0.0-1.0>",
  "matched_past_files": [ {{ "filename":"", "similarity":0.0 }} ]
}}

Sentence:
{sentence}

Detector ai_prob: {ai_prob}

Past preview:
{past_preview}
"""
    return prompt

def call_gemini_validate_sentence(sentence: str, ai_prob: float, past_reports_sample: List[Dict[str, Any]]) -> Dict[str, Any]:
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        prompt = build_gemini_sentence_validation_prompt(sentence, ai_prob, past_reports_sample)
        resp = model.generate_content(prompt)
        raw = resp.text or ""
        parsed = safe_json_parse(raw)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass
    return {
        "validated_ai_probability": float(round(ai_prob, 6)),
        "decision": "uncertain",
        "comment": "COMMENT: Validator parse failed | REASONS: parse-fail | CONFIDENCE: 0.0",
        "matched_past_files": []
    }

# --------------------- Aggregation ---------------------
def aggregate_sentence_level_results(segment_reports: List[Dict[str, Any]]) -> Dict[str, Any]:
    # compute average detector probability across sentences and counts by Gemini decision
    sentence_probs = []
    gemini_ai_count = 0
    gemini_human_count = 0
    gemini_uncount = 0
    flagged_sentences = []
    for seg in segment_reports:
        for s in seg.get("sentences", []):
            sentence_probs.append(s.get("sentence_ai_prob", 0.0))
            gv = s.get("gemini_validation") or {}
            decision = gv.get("decision")
            if decision == "ai":
                gemini_ai_count += 1
                flagged_sentences.append({"segment_index": seg["segment_index"], "sentence": s["sentence_text"][:500], "detector_prob": s["sentence_ai_prob"], "gemini": gv})
            elif decision == "human":
                gemini_human_count += 1
            else:
                gemini_uncount += 1
    avg_detector_sentence_prob = float(round(sum(sentence_probs)/len(sentence_probs), 4)) if sentence_probs else 0.0
    total_sentences = len(sentence_probs)
    ai_sentence_pct = int(round((gemini_ai_count / total_sentences) * 100)) if total_sentences else 0
    return {
        "avg_detector_sentence_prob": avg_detector_sentence_prob,
        "total_sentences": total_sentences,
        "gemini_ai_count": gemini_ai_count,
        "gemini_human_count": gemini_human_count,
        "gemini_uncertain_count": gemini_uncount,
        "ai_sentences_percentage_by_gemini": ai_sentence_pct,
        "flagged_sentences": flagged_sentences
    }

# --------------------- File existence & renaming ---------------------
def find_existing_by_filename_or_hash(filename: str, file_bytes: bytes) -> Dict[str, Any]:
    try:
        files = supabase.storage.from_(RAW_BUCKET).list() or []
    except Exception:
        files = []
    h_new = sha256_bytes(file_bytes)
    for f in files:
        if f.get("name") == filename:
            return {"type": "name", "existing_name": f.get("name")}
    for f in files:
        try:
            blob = supabase.storage.from_(RAW_BUCKET).download(f.get("name"))
            if sha256_bytes(blob) == h_new:
                return {"type": "hash", "existing_name": f.get("name")}
        except Exception:
            continue
    return {}

def make_unique_filename(filename: str, existing_names: List[str]) -> str:
    base, ext = (filename.rsplit(".",1)+[""])[:2]
    ext = "." + ext if ext else ""
    candidate = filename
    i = 1
    while candidate in existing_names:
        candidate = f"{base}-v{i}{ext}"
        i += 1
    return candidate

# --------------------- Load recent past reports (for Gemini context) ---------------------
def load_recent_reports(limit: int = 30) -> List[Dict[str, Any]]:
    out = []
    try:
        res = supabase.table(REPORT_TABLE).select("id,filename,result").order("created_at", {"ascending": False}).limit(limit).execute()
        rows = getattr(res, "data", []) or []
        for r in rows:
            out.append({"filename": r.get("filename"), "result": r.get("result")})
    except Exception:
        pass
    return out

# --------------------- Main endpoint (Option B: validate sentences with ai_prob >= 0.65) ---------------------
@router.post("/detect-ai-and-validate")
async def detect_ai_sentences_option_b(file: UploadFile = File(...)):
    try:
        data = await file.read()
        original_name = sanitize_filename(file.filename or f"upload_{datetime.utcnow().isoformat()}")
        text = extract_text(original_name, data)
        if not text or len(text.strip()) < 50:
            return JSONResponse({"error": "No usable text extracted"}, status_code=400)

        # segment into paragraphs / chunks
        segments = segment_text_by_paragraphs(text, min_chars=300)
        if not segments:
            segments = [text]

        # prepare worker args (detection only)
        detector_args = [(i, segments[i]) for i in range(len(segments))]

        # run detection in parallel (workers do only local detection)
        workers = min(cpu_count(), 8)
        with Pool(processes=workers) as pool:
            detector_results = pool.map(worker_detector_sentences, detector_args)

        # load past reports once for Gemini context
        past_reports = load_recent_reports(limit=20)

        # now validate suspicious sentences (ai_prob >= 0.65) sequentially in main process
        suspicious_sentences: List[Tuple[int,int,str,float]] = []  # (seg_idx, sent_idx, text, ai_prob)
        for seg in detector_results:
            for si, s in enumerate(seg["sentences"]):
                if s.get("sentence_ai_prob", 0.0) >= 0.65:
                    suspicious_sentences.append((seg["segment_index"], si, s["sentence_text"], s["sentence_ai_prob"]))

        # validate each suspicious sentence with Gemini
        # store validations keyed by (seg_idx, sent_idx)
        validations = {}
        for seg_idx, sent_idx, sentence_text, s_prob in suspicious_sentences:
            val = call_gemini_validate_sentence(sentence_text, s_prob, past_reports)
            validations[(seg_idx, sent_idx)] = val

        # attach gemini validations back into detector_results
        for seg in detector_results:
            seg_idx = seg["segment_index"]
            for si, s in enumerate(seg["sentences"]):
                key = (seg_idx, si)
                if key in validations:
                    s["gemini_validation"] = validations[key]
                else:
                    # for non-validated sentences, set a default decision based on threshold
                    s["gemini_validation"] = {
                        "validated_ai_probability": s.get("sentence_ai_prob", 0.0),
                        "decision": "ai" if s.get("sentence_ai_prob",0.0) >= 0.90 else ("human" if s.get("sentence_ai_prob",0.0) < 0.45 else "uncertain"),
                        "comment": f"COMMENT: Auto decision based on detector threshold | REASONS: detector-only | CONFIDENCE: {round(s.get('sentence_ai_prob',0.0),3)}",
                        "matched_past_files": []
                    }

        # aggregate sentence-level results
        agg = aggregate_sentence_level_results(detector_results)

        # build final detailed report
        report = {
            "original_filename": original_name,
            "processed_as": original_name,
            "created_at": datetime.utcnow().isoformat(),
            "segments_count": len(detector_results),
            "segments": detector_results,
            "aggregate": agg,
            "raw_text_snippet": text[:20000]
        }

        # handle storage / renaming / duplication
        existing = find_existing_by_filename_or_hash(original_name, data)
        rename_performed = False
        stored_raw = False
        uploaded_name = original_name

        if existing.get("type") == "name":
            try:
                files = supabase.storage.from_(RAW_BUCKET).list() or []
                existing_names = [f.get("name") for f in files]
            except Exception:
                existing_names = []
            uploaded_name = make_unique_filename(original_name, existing_names)
            rename_performed = True

        if existing.get("type") == "hash":
            uploaded_name = existing.get("existing_name")
            stored_raw = False
        else:
            try:
                supabase.storage.from_(RAW_BUCKET).upload(uploaded_name, data, {"content-type": "application/octet-stream"})
                stored_raw = True
            except Exception:
                stored_raw = False

        # store report JSON (best-effort)
        json_name = sanitize_filename(uploaded_name.rsplit(".",1)[0]) + ".ai-detect.json"
        try:
            supabase.storage.from_(REPORT_BUCKET).upload(json_name, json.dumps(report, ensure_ascii=False).encode("utf-8"), {"content-type":"application/json"})
        except Exception:
            pass

        # insert DB row (best-effort)
        try:
            supabase.table(REPORT_TABLE).insert({
                "filename": uploaded_name,
                "stored_as": uploaded_name,
                "file_path": f"{RAW_BUCKET}/{uploaded_name}",
                "ai_percentage": agg.get("ai_sentences_percentage_by_gemini"),
                "segments_count": agg.get("total_sentences"),
                "result": report
            }).execute()
        except Exception:
            pass

        # prepare compact response
        response = {
            "original_filename": original_name,
            "stored_as": uploaded_name,
            "rename_performed": rename_performed,
            "stored_raw_file": stored_raw,
            "ai_sentences_percentage": agg.get("ai_sentences_percentage_by_gemini"),
            "total_sentences": agg.get("total_sentences"),
            "flagged_sentences_sample": agg.get("flagged_sentences")[:6],
            "json_report": json_name
        }
        return JSONResponse(response)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)
