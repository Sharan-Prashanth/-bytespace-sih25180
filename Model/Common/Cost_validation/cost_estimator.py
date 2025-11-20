import os
import json
import re
import math
from io import BytesIO
from datetime import datetime

import PyPDF2
import chardet
import docx
import google.generativeai as genai
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from supabase import create_client, Client
from dotenv import load_dotenv
import joblib
# Some saved SentenceTransformer/transformers pickles expect older private attributes
# (e.g. _output_attentions) on config classes. When unpickling with a newer
# transformers version this can raise AttributeError. To be robust, add missing
# attributes to BertConfig before loading pickles.
try:
    from transformers import BertConfig
    if not hasattr(BertConfig, "_output_attentions"):
        setattr(BertConfig, "_output_attentions", None)
    if not hasattr(BertConfig, "_output_hidden_states"):
        setattr(BertConfig, "_output_hidden_states", None)
except Exception:
    # transformers may not be installed or importable; ignore and let joblib.load fail later
    pass
import pandas as pd
import torch
from sentence_transformers import SentenceTransformer, util

# ---------------- ENV INIT ----------------
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY4")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_API_KEY)

router = APIRouter()


# ===============================================================
#               SBERT + LGBM MAIN COST MODEL (NEW MODEL)
# ===============================================================

SBERT_ENCODER_PATH = r"C:\Users\Shanmuga Shyam. B\OneDrive\Desktop\SIH25180\Model\Common\Cost_validation\pre-trained\SBERT_text_encoder.joblib"
LGBM_MODEL_PATH  = r"C:\Users\Shanmuga Shyam. B\OneDrive\Desktop\SIH25180\Model\Common\Cost_validation\pre-trained\SBERT_LightGBM_cost_model.joblib"

print("Loading SBERT encoder & LightGBM model...")

sbert_encoder = joblib.load(SBERT_ENCODER_PATH)
lgbm_model    = joblib.load(LGBM_MODEL_PATH)

print("Loaded SBERT + LightGBM successfully.")


# ===============================================================
#                 HISTORICAL EXCEL FOR RAG
# ===============================================================

EXCEL_PATH = r"C:\Users\Shanmuga Shyam. B\OneDrive\Desktop\SIH25180\web-scarpping\completion_reports_with_json.xlsx"

abstract_col = "Extracted_JSON"
year_col     = "Financial Year"
cost_col     = "Cost (Lakhs)"

df_excel = pd.read_excel(EXCEL_PATH)

df_excel = df_excel[[abstract_col, year_col, cost_col]].dropna()

# Prepare / cache embeddings for the historical Excel abstracts.
# Save embeddings to disk to avoid recomputing on every process start.
emb_dir = os.path.join(os.path.dirname(SBERT_ENCODER_PATH), "cached_embeddings")
os.makedirs(emb_dir, exist_ok=True)
emb_file = os.path.join(emb_dir, "excel_embeddings.pt")

# choose device for encoding
device = "cuda" if torch.cuda.is_available() else "cpu"

def _compute_and_save_embeddings(texts):
    # batch encode and return a CPU tensor saved to disk
    emb = sbert_encoder.encode(texts, batch_size=64, show_progress_bar=True, convert_to_tensor=True, device=device)
    # ensure stored on CPU to be portable
    emb_cpu = emb.cpu()
    try:
        torch.save(emb_cpu, emb_file)
    except Exception:
        pass
    return emb_cpu

excel_embeddings = None
try:
    if os.path.exists(emb_file):
        loaded = torch.load(emb_file)
        # verify length matches dataframe
        if hasattr(loaded, "shape") and loaded.shape[0] == len(df_excel):
            # move to chosen device for similarity computations
            excel_embeddings = loaded.to(device)
        else:
            excel_embeddings = _compute_and_save_embeddings(df_excel[abstract_col].tolist()).to(device)
    else:
        excel_embeddings = _compute_and_save_embeddings(df_excel[abstract_col].tolist()).to(device)
except Exception:
    # fallback: compute in-memory without caching
    excel_embeddings = sbert_encoder.encode(df_excel[abstract_col].tolist(), batch_size=64, convert_to_tensor=True, device=device)


def get_similar_projects(query_text, top_k=5):
    query_emb = sbert_encoder.encode(query_text, convert_to_tensor=True, device=device)
    scores = util.pytorch_cos_sim(query_emb, excel_embeddings)[0]
    top_idx = torch.topk(scores, top_k).indices.cpu().numpy()

    examples = []
    for i in top_idx:
        row = df_excel.iloc[i]
        examples.append({
            "abstract": row[abstract_col],
            "year":     row[year_col],
            "cost":     float(row[cost_col])
        })
    return examples


# ===============================================================
#                 TEXT EXTRACTORS
# ===============================================================

def extract_pdf_text(bts):
    try:
        reader = PyPDF2.PdfReader(BytesIO(bts))
        return "\n".join([page.extract_text() or "" for page in reader.pages])
    except:
        enc = chardet.detect(bts)["encoding"] or "utf-8"
        return bts.decode(enc, errors="ignore")


def extract_docx_text(bts):
    doc = docx.Document(BytesIO(bts))
    return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])


def extract_text(filename, bts):
    ext = filename.split(".")[-1].lower()
    if ext == "pdf":
        return extract_pdf_text(bts)
    if ext == "docx":
        return extract_docx_text(bts)

    enc = chardet.detect(bts)["encoding"] or "utf-8"
    return bts.decode(enc, errors="ignore")


# ===============================================================
#                 CHUNK HANDLER
# ===============================================================

def chunk_text(text, min_lines=60):
    lines = [l for l in text.splitlines() if l.strip()]
    return ["\n".join(lines[i:i + min_lines])
            for i in range(0, len(lines), min_lines)]


# ===============================================================
#                 LLM PROMPT WITH HISTORICAL DATA
# ===============================================================

def llm_cost_prompt(new_context, similar_projects):

    sim_block = ""
    for p in similar_projects:
        sim_block += f"""
PAST PROJECT ABSTRACT:
{p['abstract']}

FINANCIAL YEAR: {p['year']}
FINAL APPROVED COST (Lakhs): {p['cost']}
---------------------------------------------------------
"""

    return f"""
You are a senior Government of India R&D Cost Estimation Officer.

Your job is to estimate project cost STRICTLY in **Indian Rupees (Lakhs)** 
based on:
1. Historical completed project data (below)
2. The new proposal abstract (below)

Your estimate MUST be realistic and comply with:
• DST / CSIR / MoC / CMPDI / CIL funding norms  
• Typical R&D funding scales (10–500 Lakhs range for normal projects)  
• No exaggerated or inflated numbers  

=========================================================
HISTORICAL COMPLETED PROJECTS (Reference Benchmarks)
=========================================================
{sim_block}

=========================================================
NEW PROJECT ABSTRACT
=========================================================
{new_context}

=========================================================
STRICT COSTING RULES (MANDATORY)
=========================================================

⚫ Output cost MUST be expressed in **Lakhs**, not crores.
⚫ Final cost must be within realistic boundaries:
    • Small Software/AI/Automation projects: 10–80 Lakhs
    • Medium R&D/Field/Lab projects: 40–150 Lakhs
    • Large Mining/Equipment/Deployment projects: 100–500 Lakhs
⚫ DO NOT exceed 500 Lakhs unless the abstract clearly demands 
   heavy mining machinery or multi-site deployments.

⚫ COST CATEGORY LIMITS:
    equipment: 5%–35%
    software_and_tools: 5%–15%
    manpower: 30%–55%
    data_collection: 5%–20%
    travel_and_fieldwork: 2%–8%
    cloud_and_compute: 2%–10%
    maintenance_and_operations: 3%–12%
    consumables: 2%–10%
    contingency: 5%–10%

⚫ The sum of the breakdown MUST equal estimated_cost exactly.
⚫ Values must be integers only.
⚫ Be conservative, realistic, and consistent with past projects.

=========================================================
REQUIRED OUTPUT FORMAT (STRICT JSON ONLY)
=========================================================
{{
  "estimated_cost": 0,
  "breakdown": {{
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
  "confidence": 0.0
}}

Return ONLY the JSON object. No explanations. No text outside JSON.
"""



def call_gemini(prompt):
    model = genai.GenerativeModel("gemini-2.5-flash-lite")
    resp = model.generate_content(prompt)
    return resp.text or ""


def parse_json(text):
    try:
        return json.loads(text[text.find("{"): text.rfind("}") + 1])
    except:
        return None


# ===============================================================
#              LLM COST ESTIMATION (MULTI-CHUNK)
# ===============================================================

def estimate_cost_from_chunks(chunks, similar_projects):
    results = []
    for c in chunks:
        prompt = llm_cost_prompt(c, similar_projects)
        raw = call_gemini(prompt)
        parsed = parse_json(raw) or {"estimated_cost": 0, "confidence": 0.0}
        results.append(parsed)
    return results


def aggregate_llm_cost(results):
    total = sum(r.get("estimated_cost", 0) for r in results)
    avg_conf = sum(r.get("confidence", 0) for r in results) / len(results)

    combined_breakdown = {}
    for r in results:
        b = r.get("breakdown", {})
        for k, v in b.items():
            combined_breakdown[k] = combined_breakdown.get(k, 0) + int(v)

    return total, avg_conf, combined_breakdown


# ===============================================================
#                ML COST PREDICTION FROM SBERT + LGBM
# ===============================================================

def ml_cost_estimate(text):
    import numpy as _np

    emb = sbert_encoder.encode(text)
    # convert to 1D numpy array
    try:
        emb_arr = _np.asarray(emb).reshape(-1)
    except Exception:
        emb_arr = _np.array(list(emb)).reshape(-1)

    # determine expected number of features from the trained LGBM model
    expected = None
    if hasattr(lgbm_model, "n_features_in_"):
        expected = int(getattr(lgbm_model, "n_features_in_"))
    else:
        # try LightGBM booster info
        try:
            booster = getattr(lgbm_model, "booster_") or getattr(lgbm_model, "_Booster", None)
            if booster is not None:
                expected = int(booster.num_feature())
        except Exception:
            expected = None

    if expected is not None:
        cur = emb_arr.shape[0]
        if cur < expected:
            # pad with zeros
            pad = _np.zeros(expected - cur, dtype=emb_arr.dtype)
            emb_arr = _np.concatenate([emb_arr, pad])
        elif cur > expected:
            # truncate (log a warning)
            try:
                print(f"Warning: embedding length {cur} > expected {expected}; truncating to match model input")
            except:
                pass
            emb_arr = emb_arr[:expected]

    pred_cost = lgbm_model.predict([emb_arr])[0]
    return float(pred_cost)


# ===============================================================
#                    FASTAPI ENDPOINT
# ===============================================================

@router.post("/process-and-estimate")
async def process_and_estimate(file: UploadFile = File(...)):

    file_bytes = await file.read()
    text = extract_text(file.filename, file_bytes)

    if len(text) < 30:
        return {"error": "Unable to extract meaningful text"}

    # --- Retrieve Similar Past Projects ---
    similar_projects = get_similar_projects(text, top_k=5)

    # --- LLM COST ESTIMATION ---
    chunks = chunk_text(text)
    if not chunks:
        chunks = [text]

    llm_chunk_results = estimate_cost_from_chunks(chunks, similar_projects)

    llm_cost, llm_conf, llm_breakdown = aggregate_llm_cost(llm_chunk_results)

    # --- ML MODEL PREDICTION ---
    ml_cost_value = ml_cost_estimate(text)

    diff_ratio = abs(llm_cost - ml_cost_value) / (ml_cost_value + 1)

    validation_status = (
        "valid" if diff_ratio <= 0.20 else
        "warning" if diff_ratio <= 0.40 else
        "invalid"
    )

    final_score = int((0.6 * ml_cost_value) + (0.4 * llm_cost))


    # --- SAVE TO SUPABASE ---
    save_record = {
        "filename": file.filename,
        "final_cost": final_score,
        "ml_cost": ml_cost_value,
        "llm_cost": llm_cost,
        "validation_status": validation_status,
        "difference_ratio": diff_ratio,
        "breakdown": llm_breakdown,
        "confidence": llm_conf,
        "raw_text": text[:20000],
        "created_at": datetime.utcnow().isoformat()
    }

    try:
        supabase.table("final_cost_estimations").insert(save_record).execute()
    except Exception as e:
        print("Supabase Insert Error:", e)


    # --- FINAL API RESPONSE ---
    return {
        "project": file.filename,
        "final_score": final_score,
        "ml_cost": ml_cost_value,
        "llm_cost": llm_cost,
        "validation_status": validation_status,
        "difference_ratio": diff_ratio,
        "confidence": llm_conf,
        "historical_matches_used": similar_projects,
        "breakdown": llm_breakdown
    }
