import os
import json
import re
import math
from io import BytesIO
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

import PyPDF2
import chardet
import docx
import google.generativeai as genai
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY4")

if not SUPABASE_URL or not SUPABASE_KEY or not GEMINI_API_KEY:
    raise Exception("Missing environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_API_KEY)

router = APIRouter()

# ---------------- LOAD MAIN ML VALIDATION MODEL ----------------
import joblib

MODEL_PATH = r"C:\Users\Shanmuga Shyam. B\OneDrive\Desktop\SIH25180\Model\Cost_validation\pre-trained\main_cost_model.joblib"
if os.path.exists(MODEL_PATH):
    main_model = joblib.load(MODEL_PATH)
    print("Main validation model loaded.")
else:
    main_model = None
    print("Main validation model NOT FOUND — skipping validation.")

# ---------------- PDF/TEXT EXTRACTORS ----------------
def extract_pdf_text(bts):
    try:
        reader = PyPDF2.PdfReader(BytesIO(bts))
        text = "\n".join([page.extract_text() or "" for page in reader.pages])
        return text
    except:
        enc = chardet.detect(bts)["encoding"] or "utf-8"
        return bts.decode(enc, errors="ignore")


def extract_docx_text(bts):
    doc = docx.Document(BytesIO(bts))
    return "\n".join([p.text for p in doc.paragraphs if p.text.strip() != ""])


def extract_text(filename, bts):
    ext = filename.lower().split(".")[-1]
    if ext == "pdf":
        return extract_pdf_text(bts)
    if ext == "docx":
        return extract_docx_text(bts)
    enc = chardet.detect(bts)["encoding"] or "utf-8"
    return bts.decode(enc, errors="ignore")

# ---------------- CHUNK HANDLER ----------------
def chunk_text(text, min_lines=60):
    lines = [l for l in text.splitlines() if l.strip()]
    return ["\n".join(lines[i:i + min_lines]) for i in range(0, len(lines), min_lines)]

# ---------------- LLM PROMPTS ----------------
def llm_cost_prompt(context):
    return f"""
You are an expert Government of India R&D Cost Estimation Officer 
specialized in Coal, Mining, Excavation, Mechanical Systems, Computer 
Science, Automation, Instrumentation, AI/ML Projects, and Public Sector Budgeting.

Your role is to:
1. Read the full project abstract.
2. Understand scope, deliverables, manpower, equipment, materials,
   software, field activities, testing, and compliance requirements.
3. Produce a highly accurate cost estimate following Indian Government norms.

Strict Requirements:
-----------------------------------------
• Return ONLY valid JSON. No prose, no commentary, no markdown.
• Numbers must be integers in Indian Rupees (₹).
• Follow standard budgeting norms used by DST, CSIR, MoC, CMPDI, CIL, MeitY.
• Ensure the breakdown sums EXACTLY to the estimated_cost.
• Always produce realistic, defendable values.

Budgeting Logic (MANDATORY):
-----------------------------------------
For typical Coal/Mining/Tech R&D projects, costing usually involves:

• Equipment & Machinery: (10%–35%)
• Software / Tools / Licensing: (5%–15%)
• Manpower (JRF/SRF/RA/Project staff): (30%–55%)
• Field Deployment, Data Collection, Sampling: (5%–20%)
• Travel, Site Visits, Workshops: (2%–8%)
• Cloud & Compute (for AI/ML projects): (2%–10%)
• Maintenance, Repairs, Lab consumables: (3%–12%)
• Contingency (max 10%)

You must infer missing details logically from context.

Your final JSON must follow this schema EXACTLY:
-------------------------------------------------

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
  "explanations": {{
    "project_scope_summary": "",
    "assumption_notes": "",
    "cost_rationale": "",
    "risk_factors": "",
    "final_recommendation": ""
  }}
}}

Explanation Requirements:
-----------------------------------------
• project_scope_summary → 5–10 lines
• assumption_notes → major technical assumptions
• cost_rationale → reasoning for each line item
• risk_factors → dependencies, uncertainties
• final_recommendation → funding recommendation summary

Your response MUST be:
• Pure JSON  
• Fully structured  
• 100% valid  
• No markdown  
• No extra text before or after JSON  

PROJECT ABSTRACT:
-----------------------------------------
{context}

"""



def call_gemini(prompt):
    model = genai.GenerativeModel("gemini-2.5-flash-lite")
    resp = model.generate_content(prompt)
    return resp.text or ""

def parse_json(text):
    try:
        return json.loads(text[text.find("{"):text.rfind("}") + 1])
    except:
        return None


# ---------------- MAIN COST ESTIMATION PIPELINE ----------------
def estimate_cost_from_chunks(chunks):
    results = []
    for c in chunks:
        raw = call_gemini(llm_cost_prompt(c))
        parsed = parse_json(raw) or {"estimated_cost": 0, "breakdown": {}, "confidence": 0.0}
        results.append(parsed)
    return results


def aggregate_llm_cost(results):
    final_cost = sum(r.get("estimated_cost", 0) for r in results)
    avg_conf = sum(r.get("confidence", 0) for r in results) / len(results)
    breakdown = {}
    for r in results:
        for k, v in r.get("breakdown", {}).items():
            breakdown[k] = breakdown.get(k, 0) + int(v)
    return final_cost, avg_conf, breakdown


# ---------------- MAIN FASTAPI ENDPOINT ----------------
@router.post("/process-and-estimate")
async def process_and_estimate(file: UploadFile = File(...)):

    file_bytes = await file.read()
    text = extract_text(file.filename, file_bytes)

    if len(text) < 30:
        return {"error": "Unable to extract meaningful text"}

    # ---------- LLM COST ESTIMATION ----------
    chunks = chunk_text(text)
    if not chunks:
        chunks = [text]

    chunk_results = estimate_cost_from_chunks(chunks)
    llm_cost, llm_conf, llm_breakdown = aggregate_llm_cost(chunk_results)

    # ---------- MAIN MODEL VALIDATION ----------
    if main_model:
        ml_cost = float(main_model.predict([text])[0])

        diff_ratio = abs(llm_cost - ml_cost) / (ml_cost + 1)

        validation_status = "valid" if diff_ratio < 0.25 else "invalid"

        final_best_cost = int((0.6 * ml_cost) + (0.4 * llm_cost))
    else:
        ml_cost = None
        diff_ratio = None
        validation_status = "model_missing"
        final_best_cost = llm_cost

    # ---------- SUPABASE SAVE ----------
    record = {
        "filename": file.filename,
        "final_cost": ml_cost,
        "breakdown": llm_breakdown,
        "validation_status": validation_status,
        "validation_difference_ratio": diff_ratio,
        "confidence": llm_conf,
        "raw_text": text[:20000],
        "created_at": datetime.utcnow().isoformat(),
    }

    try:
        supabase.table("final_cost_estimations").insert(record).execute()
    except Exception as e:
        print("Supabase insert error:", e)

    # ---------- FINAL RESPONSE ----------
    return {
        "project": file.filename,
        "best_final_cost": ml_cost,
        "validation_status": validation_status,
        "difference_ratio": diff_ratio,
        "breakdown": llm_breakdown,
        "confidence": llm_conf
    }
