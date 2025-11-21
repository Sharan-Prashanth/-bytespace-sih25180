import os
import re
import json
import math
import hashlib
from io import BytesIO
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from multiprocessing import Pool, cpu_count

import PyPDF2
import chardet
import docx
import google.generativeai as genai
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from supabase import create_client, Client
import joblib
import traceback

# --- Optional detector libs (not required) ---
try:
    import importlib
    typetruth = importlib.import_module("typetruth")
    TYPETRUTH_AVAILABLE = True
except Exception:
    typetruth = None
    TYPETRUTH_AVAILABLE = False

# GPT-2 perplexity fallback is optional and expensive:
try:
    from transformers import GPT2LMHeadModel, GPT2TokenizerFast
    TRANSFORMERS_AVAILABLE = True
except Exception:
    TRANSFORMERS_AVAILABLE = False

# Load .env
load_dotenv()

# -------------------- CONFIG --------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # service_role recommended
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY4")

if not SUPABASE_URL or not SUPABASE_KEY or not GEMINI_API_KEY:
    raise Exception("Set SUPABASE_URL, SUPABASE_KEY, and GEMINI_API_KEY in .env")

# Buckets / table names - adjust to your names
RAW_BUCKET = os.getenv("RAW_BUCKET", "Coal-research-files")
REPORT_BUCKET = os.getenv("REPORT_BUCKET", "ai-detection-json")
REPORT_TABLE = os.getenv("REPORT_TABLE", "ai_detection_reports")

# Thresholds & workers
SENTENCE_VALIDATE_THRESHOLD = float(os.getenv("SENTENCE_VALIDATE_THRESHOLD", "0.65"))  # detector score -> candidate
WORKER_COUNT = min(int(os.getenv("WORKER_COUNT", str(max(1, cpu_count() - 1)))), 8)

MODEL_NAME = os.getenv("MODEL_NAME", "gemini-2.5-flash-lite")
# Optional trained validator model (joblib file). If present, use it to score sentences.
<<<<<<<< HEAD:Model/Common/ai_validator/ai_detector_pipeline.py
MODEL_JOBLIB_PATH = r"C:\Users\Shanmuga Shyam. B\OneDrive\Desktop\SIH25180\Model\Common\ai_validator\pre-trained\my_trained_model.joblib"
========
MODEL_JOBLIB_PATH = r"C:\Users\Shanmuga Shyam. B\OneDrive\Desktop\SIH25180\Model\ai_validator\pre-trained\my_trained_model.joblib"
>>>>>>>> 694690a0870dec395c19d2d2221e8c7afb3c97af:Model/ai_validator/ai_detector_pipeline.py
AI_VALIDATOR_MODEL = None
AI_VALIDATOR_AVAILABLE = False
try:
    if os.path.exists(MODEL_JOBLIB_PATH):
        AI_VALIDATOR_MODEL = joblib.load(MODEL_JOBLIB_PATH)
        AI_VALIDATOR_AVAILABLE = True
    else:
        # No joblib provided — create a simple heuristic validator and save it
        class _HeuristicValidator:
            """Simple fallback validator with predict and predict_proba.

            predict_proba returns [[1-prob, prob]] where prob is heuristic AI-probability.
            """
            def __init__(self):
                pass

            def _score_text(self, text: str) -> float:
                words = text.split()
                if not words:
                    return 0.0
                avg_word_len = sum(len(w) for w in words) / len(words)
                # heuristic: shorter words and high punctuation increase AI-likeness
                punct = sum(1 for ch in text if ch in ".,;:!?()'")
                base = 0.18 if avg_word_len >= 4 else 0.45
                prob = min(0.99, base * (len(text) / 800.0) + min(0.2, punct/50.0))
                return float(max(0.0, min(0.999999, prob)))

            def predict_proba(self, X):
                out = []
                for x in X:
                    p = self._score_text(x)
                    out.append([1.0 - p, p])
                return out

            def predict(self, X):
                out = []
                for x in X:
                    p = self._score_text(x)
                    out.append(1 if p >= 0.5 else 0)
                return out

        # ensure directory exists
        try:
            os.makedirs(os.path.dirname(MODEL_JOBLIB_PATH), exist_ok=True)
            fallback = _HeuristicValidator()
            joblib.dump(fallback, MODEL_JOBLIB_PATH)
            AI_VALIDATOR_MODEL = fallback
            AI_VALIDATOR_AVAILABLE = True
            print(f"No pretrained model found — created heuristic fallback at {MODEL_JOBLIB_PATH}")
        except Exception:
            AI_VALIDATOR_MODEL = None
            AI_VALIDATOR_AVAILABLE = False
            traceback.print_exc()
except Exception:
    AI_VALIDATOR_MODEL = None
    AI_VALIDATOR_AVAILABLE = False
    # do not raise here; fallback to local heuristics
    traceback.print_exc()

# --- clients & configure ---
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_API_KEY)

router = APIRouter()

# -------------------- Utilities --------------------
def sha256_bytes(b: bytes) -> str:
    h = hashlib.sha256()
    h.update(b)
    return h.hexdigest()

def sanitize_filename(name: str) -> str:
    name = (name or "").strip()
    name = re.sub(r"[<>:\"/\\|?*\n\r]+", "_", name)
    return name

def make_unique_filename(base_name: str, existing_names: List[str]) -> str:
    if base_name not in existing_names:
        return base_name
    base, dot, ext = base_name.rpartition(".")
    if not dot:
        base = base_name
        ext = ""
    else:
        ext = "." + ext
    i = 1
    candidate = f"{base}-v{i}{ext}"
    while candidate in existing_names:
        i += 1
        candidate = f"{base}-v{i}{ext}"
    return candidate

def safe_json_parse(text: str) -> Optional[Dict[str, Any]]:
    if not text:
        return None
    txt = text.strip()
    # try JSON directly
    try:
        return json.loads(txt)
    except Exception:
        pass
    # fallback: extract first {...} block
    m = re.search(r"\{[\s\S]*\}", txt)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            return None
    return None

# -------------------- Text extraction --------------------
def text_from_pdf_bytes(b: bytes) -> str:
    try:
        reader = PyPDF2.PdfReader(BytesIO(b))
        out = []
        for p in reader.pages:
            t = p.extract_text()
            if t:
                out.append(t)
        return "\n\n".join(out).strip()
    except Exception:
        enc = chardet.detect(b).get("encoding") or "utf-8"
        try:
            return b.decode(enc, errors="ignore")
        except Exception:
            return ""

def text_from_docx_bytes(b: bytes) -> str:
    try:
        doc = docx.Document(BytesIO(b))
        paragraphs = [p.text for p in doc.paragraphs if p.text and p.text.strip()]
        return "\n\n".join(paragraphs).strip()
    except Exception:
        return ""

def extract_text(filename: str, data: bytes) -> str:
    ext = (filename.lower().rsplit(".", 1) + [""])[-1]
    if ext == "pdf":
        return text_from_pdf_bytes(data)
    if ext == "docx":
        return text_from_docx_bytes(data)
    # fallback to text/csv
    enc = chardet.detect(data).get("encoding") or "utf-8"
    try:
        return data.decode(enc, errors="ignore")
    except Exception:
        return ""

# -------------------- Segmentation --------------------
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
    sents = re.split(r'(?<=[.!?])\s+', segment.strip())
    sents = [s.strip() for s in sents if s.strip()]
    return sents if sents else [segment.strip()]

# -------------------- Local detector (worker-safe) --------------------
# Worker helper functions MUST be top-level for pickling.

def detect_with_typetruth_text(text: str) -> float:
    try:
        if typetruth and hasattr(typetruth, "predict"):
            res = typetruth.predict(text)
            if isinstance(res, dict) and "ai_prob" in res:
                return float(res["ai_prob"])
        if typetruth and hasattr(typetruth, "score"):
            return float(typetruth.score(text))
    except Exception:
        return 0.0
    return 0.0

# GPT-2 perplexity fallback; this will be executed inside worker processes lazily
def _perplexity_score_gpt2_local(text: str, cache: Dict) -> float:
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
    # compute a segment-level score
    seg_score = 0.0
    if TYPETRUTH_AVAILABLE:
        try:
            seg_score = detect_with_typetruth_text(segment)
        except Exception:
            seg_score = 0.0
    elif TRANSFORMERS_AVAILABLE:
        try:
            seg_score = _perplexity_score_gpt2_local(segment, cache)
        except Exception:
            seg_score = 0.0
    else:
        words = segment.split()
        if len(words) > 6:
            avg_word_len = sum(len(w) for w in words) / len(words)
            heur = 0.45 if avg_word_len < 4 else 0.18
            seg_score = round(min(0.99, heur * (len(segment) / 1000)), 6)

    # sentence-level scores
    sentences = split_sentences(segment)
    sentence_scores = []
    for s in sentences:
        s_score = 0.0
        # 1) If a trained AI validator model is available, use it first.
        if AI_VALIDATOR_AVAILABLE and AI_VALIDATOR_MODEL is not None:
            try:
                # prefer predict_proba if available
                if hasattr(AI_VALIDATOR_MODEL, "predict_proba"):
                    probs = AI_VALIDATOR_MODEL.predict_proba([s])
                    # try to pick the 'ai' class probability; commonly last column
                    if probs is not None and len(probs) > 0:
                        prob = float(probs[0][-1])
                        s_score = max(0.0, min(0.999999, prob))
                    else:
                        s_score = 0.0
                elif hasattr(AI_VALIDATOR_MODEL, "predict"):
                    p = AI_VALIDATOR_MODEL.predict([s])[0]
                    # if predict returns class labels (0/1), map to 0.0/1.0
                    try:
                        s_score = float(p)
                    except Exception:
                        s_score = 0.0
                else:
                    s_score = 0.0
            except Exception:
                # fallback to other detectors if model call fails
                try:
                    traceback.print_exc()
                except Exception:
                    pass
                s_score = 0.0
        else:
            # 2) existing local fallbacks
            if TYPETRUTH_AVAILABLE:
                try:
                    s_score = detect_with_typetruth_text(s)
                except Exception:
                    s_score = 0.0
            elif TRANSFORMERS_AVAILABLE:
                try:
                    s_score = _perplexity_score_gpt2_local(s, cache)
                except Exception:
                    s_score = 0.0
            else:
                words = s.split()
                if len(words) > 4:
                    avg_word_len = sum(len(w) for w in words) / len(words)
                    heur = 0.5 if avg_word_len < 4 else 0.18
                    s_score = round(min(0.99, heur * (len(s) / 800)), 6)
                else:
                    s_score = 0.0
        sentence_scores.append({"sentence_text": s, "sentence_ai_prob": float(round(s_score, 6))})

    return {"segment_ai_prob": float(round(seg_score, 6)), "sentences": sentence_scores}

# -------------------- Worker wrapper (picklable) --------------------
def worker_detect(args: Tuple[int, str]):
    idx, segment = args
    # per-process cache stored as function attribute
    if not hasattr(worker_detect, "_cache"):
        worker_detect._cache = {}
    cache = worker_detect._cache
    res = detect_segment_and_sentences_local(segment, cache)
    return {
        "segment_index": int(idx),
        "segment_text": segment,
        "ai_probability_detector": float(res["segment_ai_prob"]),
        "sentences": res["sentences"]
    }

# -------------------- Gemini validator prompt/builders --------------------
def build_gemini_sentence_validation_prompt(sentence: str, ai_prob: float, past_reports_sample: List[Dict[str, Any]]) -> str:
    past_preview = ""
    for r in (past_reports_sample or [])[:6]:
        preview = (r.get("result") or {}).get("raw_text") if isinstance((r.get("result") or {}).get("raw_text"), str) else None
        if preview:
            past_preview += f"--- {r.get('filename','<file>')} ---\n{preview[:600]}\n\n"
    # Escape braces in JSON example by doubling them if using .format elsewhere; here we use f-string so OK.
    prompt = f"""
You are an expert auditor specializing in detecting AI-generated text.

Input:
- Sentence: {sentence}
- Detector AI probability (0.0-1.0): {ai_prob}
- Short past report previews (for similarity): {bool(past_preview)}

TASKS:
1) Confirm or adjust the probability (0.0-1.0).
2) Decide: "ai", "human", or "uncertain".
3) Provide a one-line comment with reasons and confidence.
4) If similar to any past preview, include filename and approximate similarity (0.0-1.0).

Return ONLY valid JSON with keys:
{{
  "validated_ai_probability": 0.0,
  "decision": "ai"|"human"|"uncertain",
  "comment": "one-line comment | reasons | confidence:<0.0-1.0>",
  "Lines": "the detected sentence are needed to be shown one by one in point wise and they needed to be highlighted in bold format",
  "matched_past_files": [ {{ "filename": "...", "similarity": 0.0 }} ]
}}

Past previews:
{past_preview}
"""
    return prompt

def call_gemini_validate_sentence(sentence: str, ai_prob: float, past_reports_sample: List[Dict[str, Any]]) -> Dict[str, Any]:
    try:
        prompt = build_gemini_sentence_validation_prompt(sentence, ai_prob, past_reports_sample)
        model = genai.GenerativeModel(MODEL_NAME)
        resp = model.generate_content(prompt)
        raw = resp.text or ""
        parsed = safe_json_parse(raw)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass
    # fallback auto-decision heuristics if model fails
    decision = "ai" if ai_prob >= 0.9 else ("human" if ai_prob < 0.45 else "uncertain")
    return {
        "validated_ai_probability": float(round(ai_prob, 6)),
        "decision": decision,
        "comment": f"Auto-validated: detector-only decision ({decision}) | confidence:{round(ai_prob,3)}",
        "matched_past_files": []
    }

# -------------------- DB & Storage helpers --------------------
def load_existing_report_by_hash(file_hash: str) -> Optional[Dict[str, Any]]:
    try:
        res = supabase.table(REPORT_TABLE).select("id,filename,file_hash,result,created_at").eq("file_hash", file_hash).limit(1).execute()
        rows = getattr(res, "data", []) or []
        if rows:
            return rows[0]
    except Exception:
        pass
    return None

def upload_raw_file_to_storage(filename: str, data: bytes) -> bool:
    try:
        supabase.storage.from_(RAW_BUCKET).upload(filename, data, {"content-type": "application/octet-stream"})
        return True
    except Exception:
        # try rename if exists
        try:
            existing = supabase.storage.from_(RAW_BUCKET).list() or []
            existing_names = [o.get("name") for o in existing]
            unique = make_unique_filename(filename, existing_names)
            supabase.storage.from_(RAW_BUCKET).upload(unique, data, {"content-type": "application/octet-stream"})
            return True
        except Exception:
            return False

def upload_json_report_to_storage(json_name: str, report: Dict[str, Any]) -> bool:
    try:
        supabase.storage.from_(REPORT_BUCKET).upload(json_name, json.dumps(report, ensure_ascii=False).encode("utf-8"), {"content-type": "application/json"})
        return True
    except Exception:
        # if exists, attempt unique name
        try:
            existing = supabase.storage.from_(REPORT_BUCKET).list() or []
            existing_names = [o.get("name") for o in existing]
            unique = make_unique_filename(json_name, existing_names)
            supabase.storage.from_(REPORT_BUCKET).upload(unique, json.dumps(report, ensure_ascii=False).encode("utf-8"), {"content-type": "application/json"})
            return True
        except Exception:
            return False

def insert_report_row_db(row: Dict[str, Any]) -> bool:
    try:
        supabase.table(REPORT_TABLE).insert(row).execute()
        return True
    except Exception:
        return False

def load_recent_reports(limit: int = 20) -> List[Dict[str, Any]]:
    try:
        res = supabase.table(REPORT_TABLE).select("*").order("created_at", desc=True).limit(limit).execute()
        rows = getattr(res, "data", []) or []
        return rows
    except Exception:
        return []

# -------------------- Aggregation --------------------
def aggregate_sentence_level_results(segment_reports: List[Dict[str, Any]]) -> Dict[str, Any]:
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
                flagged_sentences.append({
                    "segment_index": seg["segment_index"],
                    "sentence": s["sentence_text"][:800],
                    "detector_prob": s.get("sentence_ai_prob", 0.0),
                    "gemini": gv
                })
            elif decision == "human":
                gemini_human_count += 1
            else:
                gemini_uncount += 1
    avg_detector_sentence_prob = float(round(sum(sentence_probs)/len(sentence_probs), 6)) if sentence_probs else 0.0
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

# -------------------- Main endpoint --------------------
@router.post("/detect-ai-and-validate")
async def detect_ai_and_validate(file: UploadFile = File(...)):
    """
    Complete pipeline:
    - read bytes
    - compute hash -> if exist in DB return cached result
    - otherwise, run local detection in worker pool
    - collect sentences with detector >= threshold
    - validate suspicious sentences with Gemini (sequentially)
    - attach validations and aggregate
    - save raw file + json + db row
    - return compact response
    """
    try:
        data = await file.read()
        filename_raw = sanitize_filename(file.filename or f"upload_{datetime.utcnow().isoformat()}")
        file_hash = sha256_bytes(data)

        # 1) duplicate check by hash (fast)
        existing = load_existing_report_by_hash(file_hash)
        if existing:
            # return cached stored result immediately
            return JSONResponse({
                "status": "cached",
                "message": "File already processed. Returning cached result.",
                "filename": existing.get("filename"),
                "file_hash": existing.get("file_hash"),
                "created_at": existing.get("created_at"),
                "cached_result": existing.get("result")
            })

        # 2) text extraction
        text = extract_text(filename_raw, data)
        if not text or len(text.strip()) < 40:
            return JSONResponse({"error": "Could not extract usable text from file"}, status_code=400)

        # 3) segmentation
        segments = segment_text_by_paragraphs(text, min_chars=300)
        if not segments:
            segments = [text]

        # 4) run detector workers in multiprocessing pool
        args = [(i, segments[i]) for i in range(len(segments))]
        workers = min(WORKER_COUNT, max(1, len(args)))
        with Pool(processes=workers) as pool:
            detector_results = pool.map(worker_detect, args)

        # 5) assemble suspicious sentences list for Gemini validation
        suspicious = []
        for seg in detector_results:
            for si, s in enumerate(seg.get("sentences", [])):
                if s.get("sentence_ai_prob", 0.0) >= SENTENCE_VALIDATE_THRESHOLD:
                    suspicious.append((seg["segment_index"], si, s["sentence_text"], s["sentence_ai_prob"]))

        # 6) load recent reports (context for Gemini)
        past_reports = []
        try:
            past_reports = load_recent_reports(limit=20)
        except Exception:
            past_reports = []

        # 7) validate suspicious sentences with Gemini (main process)
        validations = {}
        for seg_idx, sent_idx, sent_text, s_prob in suspicious:
            validations[(seg_idx, sent_idx)] = call_gemini_validate_sentence(sent_text, s_prob, past_reports)

        # 8) attach gemini validations back to results; auto-decide for others
        for seg in detector_results:
            seg_idx = seg["segment_index"]
            for si, s in enumerate(seg["sentences"]):
                key = (seg_idx, si)
                if key in validations:
                    s["gemini_validation"] = validations[key]
                else:
                    # default inline decision heuristics
                    prob = s.get("sentence_ai_prob", 0.0)
                    if prob >= 0.90:
                        decision = "ai"
                    elif prob < 0.45:
                        decision = "human"
                    else:
                        decision = "uncertain"
                    s["gemini_validation"] = {
                        "validated_ai_probability": float(round(prob, 6)),
                        "decision": decision,
                        "comment": f"Auto-decision based on detector threshold | confidence:{round(prob,3)}",
                        "matched_past_files": []
                    }

        # 9) aggregate
        agg = aggregate_sentence_level_results(detector_results)

        # 9.1) compute model vs LLM (Gemini) scores and combined score
        # model score: average detector sentence probability (0.0-1.0)
        model_avg = agg.get("avg_detector_sentence_prob", 0.0) or 0.0

        # llm score: average of gemini validated probabilities where available
        gemini_probs = []
        for seg in detector_results:
            for s in seg.get("sentences", []):
                gv = s.get("gemini_validation") or {}
                v = gv.get("validated_ai_probability")
                if isinstance(v, (int, float)):
                    gemini_probs.append(float(v))

        if gemini_probs:
            gemini_avg = float(sum(gemini_probs) / len(gemini_probs))
        else:
            # fallback: use detector average as proxy
            gemini_avg = model_avg

        # convert to percentages
        model_score_pct = round(model_avg * 100, 2)
        llm_score_pct = round(gemini_avg * 100, 2)

        # combined score: 60% model, 40% llm
        combined_score = round((0.6 * model_score_pct) + (0.4 * llm_score_pct), 2)

        # verdict thresholds: >=65 => ai, <=35 => human, else uncertain
        if combined_score >= 65:
            file_verdict = "ai"
        elif combined_score <= 35:
            file_verdict = "human"
        else:
            file_verdict = "uncertain"

        # attach to aggregate for storage
        agg["model_avg_probability"] = float(round(model_avg, 6))
        agg["llm_avg_probability"] = float(round(gemini_avg, 6))
        agg["model_score_pct"] = model_score_pct
        agg["llm_score_pct"] = llm_score_pct
        agg["combined_score_pct"] = combined_score
        agg["file_verdict"] = file_verdict

        # 10) build report
        report = {
            "original_filename": filename_raw,
            "file_hash": file_hash,
            "created_at": datetime.utcnow().isoformat(),
            "segments_count": len(detector_results),
            "segments": detector_results,
            "aggregate": agg,
            "raw_text_snippet": text[:20000]
        }

        # 11) store raw file to storage
        # choose unique name if filename exists
        uploaded_name = filename_raw
        try:
            existing_files = supabase.storage.from_(RAW_BUCKET).list() or []
            existing_names = [o.get("name") for o in existing_files]
        except Exception:
            existing_names = []
        if uploaded_name in existing_names:
            uploaded_name = make_unique_filename(uploaded_name, existing_names)
        stored_raw = False
        try:
            supabase.storage.from_(RAW_BUCKET).upload(uploaded_name, data, {"content-type": "application/octet-stream"})
            stored_raw = True
        except Exception:
            # best-effort silence
            stored_raw = False

        # 12) store report JSON to storage
        json_name = sanitize_filename(uploaded_name.rsplit(".", 1)[0]) + ".ai-detect.json"
        try:
            upload_json_report_to_storage(json_name, report)
        except Exception:
            pass

        # 13) insert DB row with file_hash and result
        db_row = {
            "filename": uploaded_name,
            "file_path": f"{RAW_BUCKET}/{uploaded_name}",
            "file_hash": file_hash,
            "ai_percentage": agg.get("ai_sentences_percentage_by_gemini"),
            "segments_count": agg.get("total_sentences"),
            "result": report,
            "created_at": datetime.utcnow().isoformat()
        }
        try:
            insert_report_row_db(db_row)
        except Exception:
            pass

        # 14) return compact response
        response = {
            "status": "processed",
            "filename": uploaded_name,
            "stored_raw_file": stored_raw,
            "json_report_name": json_name,
            "ai_sentences_percentage": agg.get("ai_sentences_percentage_by_gemini"),
            "total_sentences": agg.get("total_sentences"),
            "flagged_sentences_sample": agg.get("flagged_sentences")[:8],
            "report_summary": {
                "avg_detector_sentence_prob": agg.get("avg_detector_sentence_prob"),
                "gemini_ai_count": agg.get("gemini_ai_count")
            }
        }
        # include model/LLM/combined scores in top-level response for quick view
        response["model_score_pct"] = agg.get("model_score_pct")
        response["llm_score_pct"] = agg.get("llm_score_pct")
        response["combined_score_pct"] = agg.get("combined_score_pct")
        response["file_verdict"] = agg.get("file_verdict")
        return JSONResponse(response)

    except Exception as e:
        # import traceback
        # traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)
