import os
import json
import re
import math
from io import BytesIO
from datetime import datetime
from typing import Dict

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
#               ENHANCED MULTI-REGRESSION COST MODEL
# ===============================================================

ENHANCED_PREDICTOR_PATH = r"C:\Users\Shanmuga Shyam. B\OneDrive\Desktop\SIH25180\Model\Common\Cost_validation\pre-trained\Enhanced_Cost_Predictor.joblib"

print("Loading Enhanced Multi-Regression Cost Model...")

try:
    enhanced_predictor = joblib.load(ENHANCED_PREDICTOR_PATH)
    print("✅ Enhanced Cost Predictor loaded successfully!")
    print("Features: 403 (SBERT + Year trends + Technology categories + Agency types)")
    print("Model: Random Forest with 14.6% improved accuracy")
except FileNotFoundError:
    print("❌ Enhanced model file not found. Using fallback mode.")
    enhanced_predictor = None


# ===============================================================
#                HISTORICAL DATA (FALLBACK MODE ONLY)
# ===============================================================

# This section is only used if enhanced model is not available
# The enhanced model contains its own optimized historical data

EXCEL_PATH = r"C:\Users\Shanmuga Shyam. B\OneDrive\Desktop\SIH25180\web-scarpping\completion_reports_with_json.xlsx"

if enhanced_predictor is None:
    print("Loading fallback historical data...")
    try:
        df_excel = pd.read_excel(EXCEL_PATH)
        abstract_col = "Extracted_JSON"
        year_col = "Financial Year"
        cost_col = "Cost (Lakhs)"
        df_excel = df_excel[[abstract_col, year_col, cost_col]].dropna()
        print(f"Loaded {len(df_excel)} historical projects for fallback mode")
    except Exception as e:
        print(f"Warning: Could not load historical data: {e}")
        df_excel = pd.DataFrame()
else:
    print("Enhanced model contains optimized historical data")


def get_similar_projects(query_text, top_k=5):
    """Fallback function for similarity search when enhanced model not available"""
    if enhanced_predictor is not None:
        # Use enhanced model if available
        return get_similar_projects_enhanced(query_text, top_k)
    
    # Fallback mode - simplified similarity search
    try:
        if 'df_excel' not in globals() or df_excel.empty:
            return []
        
        # Simple keyword-based similarity for fallback
        examples = []
        for i, row in df_excel.head(top_k).iterrows():
            examples.append({
                "abstract": row[abstract_col],
                "year": row[year_col], 
                "cost": float(row[cost_col])
            })
        return examples
    except Exception:
        return []


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


# Recommended category ranges (percents) used for quick validation
CATEGORY_RANGES = {
    "equipment": (5, 35),
    "software_and_tools": (5, 15),
    "manpower": (30, 55),
    "data_collection": (5, 20),
    "travel_and_fieldwork": (2, 8),
    "cloud_and_compute": (2, 10),
    "maintenance_and_operations": (3, 12),
    "consumables": (2, 10),
    "contingency": (5, 10)
}


def assess_breakdown(breakdown: Dict[str, int], total_cost: float) -> str:
    """Return a concise one-line comment assessing whether major categories are within recommended ranges.

    If a category is outside the range, mention it briefly. If all OK, return an OK message.
    """
    issues = []
    if not breakdown or total_cost <= 0:
        return "No valid breakdown available to assess category proportions."

    for cat, (low, high) in CATEGORY_RANGES.items():
        val = float(breakdown.get(cat, 0))
        pct = (val / total_cost) * 100 if total_cost else 0.0
        # allow small rounding tolerance +-1%
        if pct + 1 < low:
            issues.append(f"{cat} low ({pct:.0f}% < {low}%)")
        elif pct - 1 > high:
            issues.append(f"{cat} high ({pct:.0f}% > {high}%)")

    if not issues:
        return "Breakdown looks reasonable against typical funding ranges."
    # return top 3 issues as a succinct comment
    return "; ".join(issues[:3]) + "."


def call_gemini_usage_comment(final_budget: int, llm_cost: float, ml_cost: float, breakdown: Dict[str, int], validation_status: str) -> str:
    """Ask Gemini to produce exactly 5 short lines describing why the cost is lower and how the saved money can be used to meet expectations.

    Returns a single string with 5 newline-separated lines. Falls back to a heuristic 5-line comment on failure.
    """
    try:
        # Build a compact prompt that provides the numbers and requests exactly five lines.
        breakdown_preview = ", ".join([f"{k}:{v}" for k, v in (breakdown or {}).items() if v])
        prompt = f"""
You are a senior Government of India R&D cost advisor. Based on the inputs below, produce EXACTLY five short, plain-language lines (no numbering, no extra text) explaining:
- Why the final budget is lower than expected (point to likely categories or conservative assumptions).
- Practical ways the government can reallocate or use the freed/saved funds to meet the project's expectations.

INPUT:
Final government budget (Lakhs): {int(final_budget)}
LLM combined cost (Lakhs): {round(llm_cost,2)}
ML predicted cost (Lakhs): {round(ml_cost,2)}
Validation status: {validation_status}
Breakdown sample: {breakdown_preview}

REQUIREMENTS:
- Return EXACTLY 5 lines separated by newlines. Each line must be short (<=140 characters).
- Lines should be actionable and focused on cost drivers and reallocation options.

EXAMPLE:
Score: 40/100    Changeable: 24%
The budget broadly aligns with pilot-scale efforts but lacks
detailed line-item breakdowns for high-value equipment. Several
procurement entries above ₹5M require vendor quotes or
justification.
Recommended actions:
Provide detailed quotations for specialized
equipment and vendor estimates for each major line
item.Separate capital vs operational expenses and
include lifecycle maintenance cost estimates.Clarify contingencies and explain assumptions
behind unit costs to reduce budget uncertainty
"""
        model = genai.GenerativeModel("gemini-2.5-flash-lite")
        resp = model.generate_content(prompt)
        raw = resp.text or ""
        # normalize output to five non-empty lines
        lines = [ln.strip() for ln in raw.splitlines() if ln.strip()]
        if len(lines) >= 5:
            return "\n".join(lines[:5])
        # if model returned fewer lines but some text, try to split by sentences
        import re as _re
        sents = _re.split(r'(?<=[.?!])\s+', raw.strip()) if raw else []
        sents = [s.strip() for s in sents if s.strip()]
        if len(sents) >= 5:
            return "\n".join(sents[:5])
    except Exception:
        pass

    # Fallback heuristic 5-line comment
    fb = []
    fb.append(f"Final budget set to {int(final_budget)} Lakhs after cross-checks with ML/LLM estimates.")
    fb.append("Lower cost likely due to conservative equipment estimates or reliance on internal manpower.")
    fb.append("Use savings for focused pilot deployments, validation studies, or targeted equipment upgrades.")
    fb.append("Allocate a portion to capacity building and field validation to meet expected outcomes.")
    fb.append("Keep a contingency reserve and tie disbursements to clear milestones for accountability.")
    return "\n".join(fb)


# ===============================================================
#                ENHANCED COST PREDICTION FUNCTION
# ===============================================================

def enhanced_ml_cost_estimate(text, target_year=2025, agency_type="government", project_scale="medium"):
    """
    Enhanced ML cost estimation using the multi-regression model
    
    Args:
        text: Project description text
        target_year: Target year for cost estimation (default: 2025)
        agency_type: Type of agency (government, academic, private, public_sector)
        project_scale: Project scale (pilot, medium, large)
    
    Returns:
        dict: Comprehensive cost estimation with breakdown and confidence
    """
    if enhanced_predictor is None:
        # Fallback to simple estimation if enhanced model not available
        fallback_cost = simple_cost_fallback(text)
        return {
            "predicted_cost": fallback_cost,
            "confidence_score": 50.0,
            "cost_breakdown": {},
            "model_type": "simple_fallback",
            "error": "Enhanced model not available"
        }
    
    try:
        # Use enhanced predictor for comprehensive analysis
        result = enhanced_predictor.predict_cost(
            project_description=text,
            target_year=target_year,
            agency_type=agency_type,
            project_scale=project_scale
        )
        
        return {
            "predicted_cost": result['predicted_cost_lakhs'],
            "confidence_score": result['confidence_score'],
            "cost_breakdown": result['cost_breakdown'],
            "year_analysis": result['year_analysis'],
            "similar_projects": result['similar_projects'],
            "recommendations": result['recommendations'],
            "model_type": "enhanced_multi_regression"
        }
        
    except Exception as e:
        print(f"Enhanced model error: {e}")
        # Fallback estimation
        fallback_cost = simple_cost_fallback(text)
        return {
            "predicted_cost": fallback_cost,
            "confidence_score": 30.0,
            "cost_breakdown": {},
            "model_type": "simple_fallback",
            "error": str(e)
        }


def get_similar_projects_enhanced(query_text, top_k=5):
    """Get similar projects using enhanced model's built-in functionality"""
    if enhanced_predictor is None:
        return []
    
    try:
        # Use enhanced predictor's similarity matching
        result = enhanced_predictor.predict_cost(query_text, target_year=2025)
        return result.get('similar_projects', [])
    except Exception:
        return []


def simple_cost_fallback(text):
    """Simple fallback cost estimation when enhanced model fails"""
    # Basic heuristic based on text length and keywords
    base_cost = 300
    
    # Adjust based on text length
    text_factor = min(len(text) / 1000, 2.0)
    
    # Technology keywords boost
    tech_keywords = ['iot', 'ai', 'machine learning', 'automation', 'sensor', 'monitoring']
    tech_boost = sum(1 for keyword in tech_keywords if keyword.lower() in text.lower()) * 50
    
    # Scale keywords boost  
    scale_keywords = ['large', 'commercial', 'industrial', 'deployment']
    scale_boost = sum(1 for keyword in scale_keywords if keyword.lower() in text.lower()) * 100
    
    estimated_cost = base_cost + (base_cost * text_factor) + tech_boost + scale_boost
    return min(estimated_cost, 1000)  # Cap at 1000 Lakhs


# ===============================================================
#                    FORM-I COST BREAKDOWN ANALYSIS
# ===============================================================

def analyze_form1_cost_breakdown(form_data: Dict) -> Dict:
    """Analyze and validate Form-I cost breakdown data."""
    cost_breakdown = form_data.get("cost_breakdown", {})
    
    # Extract all cost values and convert to numbers
    extracted_costs = {}
    total_extracted = 0
    
    try:
        # Capital expenditure
        cap_ex = cost_breakdown.get("capital_expenditure", {})
        
        land_building = cap_ex.get("land_building", {})
        lb_year1 = float(land_building.get("year1", 0) or 0)
        lb_year2 = float(land_building.get("year2", 0) or 0)
        lb_year3 = float(land_building.get("year3", 0) or 0)
        lb_total = lb_year1 + lb_year2 + lb_year3
        
        equipment = cap_ex.get("equipment", {})
        eq_year1 = float(equipment.get("year1", 0) or 0)
        eq_year2 = float(equipment.get("year2", 0) or 0)
        eq_year3 = float(equipment.get("year3", 0) or 0)
        eq_total = eq_year1 + eq_year2 + eq_year3
        
        # Revenue expenditure
        rev_ex = cost_breakdown.get("revenue_expenditure", {})
        
        salaries = rev_ex.get("salaries", {})
        sal_year1 = float(salaries.get("year1", 0) or 0)
        sal_year2 = float(salaries.get("year2", 0) or 0)
        sal_year3 = float(salaries.get("year3", 0) or 0)
        sal_total = sal_year1 + sal_year2 + sal_year3
        
        consumables = rev_ex.get("consumables", {})
        con_year1 = float(consumables.get("year1", 0) or 0)
        con_year2 = float(consumables.get("year2", 0) or 0)
        con_year3 = float(consumables.get("year3", 0) or 0)
        con_total = con_year1 + con_year2 + con_year3
        
        travel = rev_ex.get("travel", {})
        tr_year1 = float(travel.get("year1", 0) or 0)
        tr_year2 = float(travel.get("year2", 0) or 0)
        tr_year3 = float(travel.get("year3", 0) or 0)
        tr_total = tr_year1 + tr_year2 + tr_year3
        
        workshop = rev_ex.get("workshop_seminar", {})
        ws_year1 = float(workshop.get("year1", 0) or 0)
        ws_year2 = float(workshop.get("year2", 0) or 0)
        ws_year3 = float(workshop.get("year3", 0) or 0)
        ws_total = ws_year1 + ws_year2 + ws_year3
        
        # Map to our standard categories
        extracted_costs = {
            "equipment": int(eq_total + lb_total),  # Combine equipment and infrastructure
            "software_and_tools": 0,  # Not explicitly in Form-I, estimate later
            "manpower": int(sal_total),
            "data_collection": int(con_total * 0.3),  # Portion of consumables for data
            "travel_and_fieldwork": int(tr_total),
            "cloud_and_compute": 0,  # Not in Form-I, estimate later
            "maintenance_and_operations": int(con_total * 0.4),  # Portion of consumables
            "consumables": int(con_total * 0.3),  # Remaining consumables
            "contingency": int(ws_total)  # Use workshop/seminar for contingency
        }
        
        total_extracted = sum(extracted_costs.values())
        
    except (ValueError, TypeError) as e:
        print(f"Error parsing Form-I cost data: {e}")
        extracted_costs = {}
        total_extracted = 0
    
    return {
        "extracted_costs": extracted_costs,
        "total_extracted": total_extracted,
        "has_valid_data": total_extracted > 0
    }


def create_project_summary(form_data: Dict) -> str:
    """Create a concise project summary from Form-I data for cost estimation."""
    basic_info = form_data.get("basic_information", {})
    project_details = form_data.get("project_details", {})
    
    title = basic_info.get("project_title", "")
    objectives = project_details.get("objectives", "")
    methodology = project_details.get("methodology", "")
    work_plan = project_details.get("work_plan", "")
    benefits = project_details.get("project_benefits", "")
    
    summary = f"""
Project Title: {title}

Objectives: {objectives}

Methodology: {methodology}

Work Plan: {work_plan}

Expected Benefits: {benefits}
    """.strip()
    
    return summary


# ===============================================================
#                    FASTAPI ENDPOINTS
# ===============================================================

@router.post("/estimate-from-form1-data")
async def estimate_from_form1_data(form_data: dict):
    """
    Accept Form-I JSON data (from /extract-form1 endpoint) and provide cost estimation.
    This works with the JSON structure returned by the existing Form-I extraction endpoint.
    """
    try:
        # Validate input structure
        if not isinstance(form_data, dict):
            return {"success": False, "error": "Invalid input: expected JSON object"}
        
        # Check if this is Form-I data
        form_type = form_data.get("form_type", "")
        if "FORM-I" not in form_type:
            return {"success": False, "error": "Input does not appear to be Form-I data"}
        
        # Analyze the cost breakdown from Form-I
        cost_analysis = analyze_form1_cost_breakdown(form_data)
        
        # Create project summary for AI estimation
        project_summary = create_project_summary(form_data)
        
        # If project summary is too short, use available text
        if len(project_summary.strip()) < 50:
            basic_info = form_data.get("basic_information", {})
            project_details = form_data.get("project_details", {})
            
            # Combine all available text
            all_text = []
            for section in [basic_info, project_details]:
                if isinstance(section, dict):
                    for value in section.values():
                        if isinstance(value, str) and value.strip():
                            all_text.append(value.strip())
            
            project_summary = " ".join(all_text)
        
        # Get similar projects for context using enhanced model
        similar_projects = get_similar_projects_enhanced(project_summary, top_k=5)
        
        # Perform cost estimation using enhanced model and LLM
        enhanced_result = enhanced_ml_cost_estimate(project_summary, target_year=2025)
        ml_cost_value = enhanced_result.get('predicted_cost', 500.0)
        
        # LLM estimation
        chunks = chunk_text(project_summary)
        if not chunks:
            chunks = [project_summary]
            
        llm_chunk_results = estimate_cost_from_chunks(chunks, similar_projects)
        llm_cost, llm_conf, llm_breakdown = aggregate_llm_cost(llm_chunk_results)
        
        # Compare with extracted Form-I costs
        extracted_total = cost_analysis["total_extracted"]
        has_form_costs = cost_analysis["has_valid_data"]
        
        # Calculate final recommendation
        if has_form_costs and extracted_total > 0:
            # Use weighted average of all three estimates
            final_estimate = int((0.4 * ml_cost_value) + (0.3 * llm_cost) + (0.3 * extracted_total))
            confidence_note = "Based on Form-I data, ML model, and LLM analysis"
        else:
            # Fall back to ML + LLM only
            final_estimate = int((0.6 * ml_cost_value) + (0.4 * llm_cost))
            confidence_note = "Based on ML model and LLM analysis (Form-I cost data incomplete)"
        
        # Calculate validation metrics
        if has_form_costs:
            form_diff = abs(final_estimate - extracted_total) / (extracted_total + 1)
        else:
            form_diff = 0
            
        ml_diff = abs(final_estimate - ml_cost_value) / (ml_cost_value + 1)
        llm_diff = abs(final_estimate - llm_cost) / (llm_cost + 1)
        
        avg_diff = (ml_diff + llm_diff + form_diff) / (3 if has_form_costs else 2)
        
        validation_status = (
            "high_confidence" if avg_diff <= 0.15 else
            "medium_confidence" if avg_diff <= 0.30 else
            "low_confidence"
        )
        
        # Generate final breakdown (prefer LLM breakdown, adjust if Form-I data available)
        if has_form_costs and cost_analysis["extracted_costs"]:
            # Blend LLM breakdown with Form-I extracted costs
            final_breakdown = {}
            for category in llm_breakdown:
                form_value = cost_analysis["extracted_costs"].get(category, 0)
                llm_value = llm_breakdown.get(category, 0)
                if form_value > 0:
                    # Use weighted average favoring Form-I actual data
                    final_breakdown[category] = int((0.7 * form_value) + (0.3 * llm_value))
                else:
                    final_breakdown[category] = llm_value
        else:
            final_breakdown = llm_breakdown
        
        # Ensure breakdown sums to final estimate
        breakdown_sum = sum(final_breakdown.values())
        if breakdown_sum != final_estimate and breakdown_sum > 0:
            # Proportionally adjust
            ratio = final_estimate / breakdown_sum
            final_breakdown = {k: int(v * ratio) for k, v in final_breakdown.items()}
        
        # Assessment comment
        breakdown_assessment = assess_breakdown(final_breakdown, final_estimate)
        
        # Calculate score
        score_pct = int(round(max(0.0, min(1.0, 1.0 - avg_diff)) * 100))
        
        # Generate usage comment
        usage_comment = call_gemini_usage_comment(
            final_estimate, llm_cost, ml_cost_value, final_breakdown, validation_status
        )
        
        return {
            "success": True,
            "cost_estimation": {
                "government_budget_lakhs": final_estimate,
                "score_pct": score_pct,
                "confidence_level": validation_status,
                "breakdown": final_breakdown,
                "comment": usage_comment
            },
            "estimation_details": {
                "ml_predicted_cost": round(ml_cost_value, 2),
                "llm_predicted_cost": round(llm_cost, 2),
                "form_extracted_cost": extracted_total if has_form_costs else None,
                "confidence_note": confidence_note,
                "breakdown_assessment": breakdown_assessment,
                "similar_projects_count": len(similar_projects)
            },
            "form_cost_analysis": cost_analysis,
            "project_summary_length": len(project_summary)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Processing error: {str(e)}"
        }


@router.post("/extract-form1-and-estimate")
async def extract_form1_and_estimate(file: UploadFile = File(...)):
    """
    Extract Form-I data and provide cost estimation in a single endpoint.
    This is a simplified version that works with the existing text extraction.
    """
    try:
        file_bytes = await file.read()
        
        # Validate file type
        if not file.filename:
            return {"success": False, "error": "No filename provided"}
            
        ext = file.filename.lower().split(".")[-1]
        if ext not in ["pdf", "docx", "txt"]:
            return {"success": False, "error": "Unsupported file format. Only PDF, DOCX, and TXT files are allowed."}
        
        # Extract text using existing function
        extracted_text = extract_text(file.filename, file_bytes)
        if not extracted_text.strip():
            return {"success": False, "error": "No text content could be extracted from the file"}
        
        # Create a basic Form-I structure for cost analysis
        # Note: This is simplified. For full Form-I extraction, use the /extract-form1 endpoint first
        basic_form_data = {
            "form_type": "FORM-I S&T Grant Proposal",
            "basic_information": {
                "project_title": "Extracted from document",
                "principal_implementing_agency": None,
                "project_leader_name": "",
                "sub_implementing_agency": "",
                "co_investigator_name": None,
                "contact_email": None,
                "contact_phone": None,
                "submission_date": "",
                "project_duration": None
            },
            "project_details": {
                "definition_of_issue": "",
                "objectives": extracted_text[:1000] if len(extracted_text) > 1000 else extracted_text,
                "justification_subject_area": "",
                "project_benefits": "",
                "work_plan": "",
                "methodology": "",
                "organization_of_work": "",
                "time_schedule": "",
                "foreign_exchange_details": ""
            },
            "cost_breakdown": {
                "capital_expenditure": {
                    "land_building": {"total": None, "year1": "0", "year2": "0", "year3": "0", "justification": None},
                    "equipment": {"total": None, "year1": "0", "year2": "0", "year3": "0", "justification": None}
                },
                "revenue_expenditure": {
                    "salaries": {"total": None, "year1": "0", "year2": "0", "year3": "0"},
                    "consumables": {"total": None, "year1": "0", "year2": "0", "year3": "0", "notes": None},
                    "travel": {"total": None, "year1": "0", "year2": "0", "year3": "0"},
                    "workshop_seminar": {"total": None, "year1": "0", "year2": "0", "year3": "0"}
                },
                "total_project_cost": {"total": None, "year1": "0", "year2": "0", "year3": "0"},
                "fund_phasing": None
            },
            "additional_information": {
                "cv_details": None,
                "past_experience": None,
                "other_details": None
            }
        }
        
        # Use the text directly for cost estimation
        similar_projects = get_similar_projects_enhanced(extracted_text, top_k=5)
        
        # Enhanced ML and LLM cost estimation
        enhanced_result = enhanced_ml_cost_estimate(extracted_text, target_year=2025)
        ml_cost_value = enhanced_result.get('predicted_cost', 500.0)
        
        chunks = chunk_text(extracted_text)
        if not chunks:
            chunks = [extracted_text]
            
        llm_chunk_results = estimate_cost_from_chunks(chunks, similar_projects)
        llm_cost, llm_conf, llm_breakdown = aggregate_llm_cost(llm_chunk_results)
        
        # Final estimate (no Form-I costs available in this simplified version)
        final_estimate = int((0.6 * ml_cost_value) + (0.4 * llm_cost))
        
        # Calculate validation metrics
        ml_diff = abs(final_estimate - ml_cost_value) / (ml_cost_value + 1)
        llm_diff = abs(final_estimate - llm_cost) / (llm_cost + 1)
        avg_diff = (ml_diff + llm_diff) / 2
        
        validation_status = (
            "high_confidence" if avg_diff <= 0.15 else
            "medium_confidence" if avg_diff <= 0.30 else
            "low_confidence"
        )
        
        # Assessment and scoring
        breakdown_assessment = assess_breakdown(llm_breakdown, final_estimate)
        score_pct = int(round(max(0.0, min(1.0, 1.0 - avg_diff)) * 100))
        usage_comment = call_gemini_usage_comment(
            final_estimate, llm_cost, ml_cost_value, llm_breakdown, validation_status
        )
        
        return {
            "success": True,
            "extracted_text_preview": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text,
            "form_data_basic": basic_form_data,
            "cost_estimation": {
                "government_budget_lakhs": final_estimate,
                "score_pct": score_pct,
                "confidence_level": validation_status,
                "breakdown": llm_breakdown,
                "comment": usage_comment
            },
            "estimation_details": {
                "ml_predicted_cost": round(ml_cost_value, 2),
                "llm_predicted_cost": round(llm_cost, 2),
                "form_extracted_cost": None,
                "confidence_note": "Based on ML model and LLM analysis (use /extract-form1 first for detailed Form-I extraction)",
                "breakdown_assessment": breakdown_assessment,
                "similar_projects_count": len(similar_projects),
                "text_length": len(extracted_text)
            },
            "note": "This is a simplified extraction. For full Form-I parsing, use /extract-form1 endpoint first, then /estimate-from-form1-data"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Processing error: {str(e)}"
        }


@router.post("/process-and-estimate")
async def process_and_estimate(file: UploadFile = File(...)):

    file_bytes = await file.read()
    text = extract_text(file.filename, file_bytes)

    if len(text) < 30:
        return {"error": "Unable to extract meaningful text"}

    # --- Retrieve Similar Past Projects using Enhanced Model ---
    similar_projects = get_similar_projects_enhanced(text, top_k=5)

    # --- LLM COST ESTIMATION ---
    chunks = chunk_text(text)
    if not chunks:
        chunks = [text]

    llm_chunk_results = estimate_cost_from_chunks(chunks, similar_projects)

    llm_cost, llm_conf, llm_breakdown = aggregate_llm_cost(llm_chunk_results)

    # --- ENHANCED ML MODEL PREDICTION ---
    enhanced_result = enhanced_ml_cost_estimate(text, target_year=2025)
    ml_cost_value = enhanced_result.get('predicted_cost', 500.0)

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


    # --- FINAL, MINIMAL API RESPONSE ---
    # government_budget_lakhs: overall budget the model suggests the government can give (integer Lakhs)
    # score_pct: 0-100 where higher means the ML and LLM estimates agree closely (smaller difference)
    # comment: concise assessment of major category proportions (e.g., manpower, equipment)

    # compute score from difference ratio (smaller difference => higher score)
    score_pct = int(round(max(0.0, min(1.0, 1.0 - diff_ratio)) * 100))

    # ask Gemini to produce a 5-line comment about why the cost is lower and how savings can be used
    gemini_comment = call_gemini_usage_comment(final_score, llm_cost, ml_cost_value, llm_breakdown, validation_status)

    return {
        "government_budget_lakhs": int(final_score),
        "score_pct": score_pct,
        "comment": gemini_comment
    }
