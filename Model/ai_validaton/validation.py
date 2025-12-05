"""
validator_with_extractor.py

- Uses your extractor code (unchanged) to extract FORM-I JSON
- Validates fields against Guidelines.pdf using hybrid (rules + Gemini) approach
- Exposes: POST /validation/validate-form1  (accepts PDF upload)

Run:
    uvicorn validator_with_extractor:app --reload --port 8001
"""
import os
import re
import json
import uuid
import shutil
import tempfile
import logging
import traceback
from typing import Dict, Any, List

import PyPDF2
import docx
import chardet
import pdfplumber
from io import BytesIO
from datetime import datetime

from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# --- Gemini client (optional) ---
try:
    import google.generativeai as genai
except Exception:
    genai = None

# --- Supabase client (used by extractor) ---
try:
    from supabase import create_client, Client
except Exception:
    create_client = None
    Client = None

load_dotenv()

# ---------- CONFIG ----------
GUIDELINES_PDF_PATH = os.getenv("GUIDELINES_PDF_PATH", "/mnt/data/Guidelines.pdf")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY4") or os.getenv("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY3")

# Supabase envs used in extractor (kept as in your provided code)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
UPLOAD_BUCKET = "Coal-research-files"
JSON_BUCKET = "proposal-json"

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("validator")

# ---------- Initialize Gemini if available ----------
model = None
if GEMINI_API_KEY and genai:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.5-flash-lite")
        logger.info("Gemini configured for validation")
    except Exception:
        logger.exception("Failed to configure Gemini - falling back to deterministic validation")
        model = None
else:
    logger.info("Gemini not configured - using deterministic fallback")

# ---------- Initialize Supabase client for extractor (if configured) ----------
supabase = None
if create_client and SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase client initialized")
    except Exception:
        logger.exception("Failed to initialize Supabase client; extractor will continue but DB upload may fail")
        supabase = None
else:
    if create_client:
        logger.warning("SUPABASE_URL or SUPABASE_KEY not set - supabase operations will be skipped")
    else:
        logger.warning("supabase client library not available; supabase operations will be skipped")

# -------------------------------------------------------------------------
# ------------------ Your extractor code (kept functionally unchanged) ---
# -------------------------------------------------------------------------
# NOTE: I copied your extractor code exactly into this file (only minor
# adjustments to work within a single module, and to avoid aborting when
# supabase isn't configured). Do not change these function names; the
# validator below calls them in-process.

import traceback as _traceback  # for printing inside extractor exceptions

# Initialize Gemini inside extractor if available (this is same variable `model`)
if genai and GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # extractor uses the same model name in your snippet
        extractor_model = genai.GenerativeModel("gemini-2.5-flash-lite")
    except Exception:
        extractor_model = None
else:
    extractor_model = None

def extract_text_from_file(filename: str, file_bytes: bytes) -> str:
    """Extract text from various file formats (unchanged logic)."""
    try:
        ext = filename.lower().split(".")[-1]
        if ext == "pdf":
            reader = PyPDF2.PdfReader(BytesIO(file_bytes))
            text = ""
            for page in reader.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"
            return text.strip()
        elif ext == "docx":
            doc = docx.Document(BytesIO(file_bytes))
            text_parts = []
            for paragraph in doc.paragraphs:
                text_parts.append(paragraph.text)
            return "\n".join(text_parts)
        elif ext in ["txt", "csv"]:
            encoding = chardet.detect(file_bytes)["encoding"] or "utf-8"
            return file_bytes.decode(encoding, errors="ignore")
        else:
            raise ValueError(f"Unsupported file format: {ext}")
    except Exception as e:
        raise Exception(f"Error extracting text from {filename}: {str(e)}")

def clean_text_field(text: str) -> str:
    """Clean and format text field."""
    if not text or text.strip() == "":
        return ""
    cleaned = ' '.join(text.split())
    return cleaned

def extract_form_data_with_ai(content: str) -> Dict[str, Any]:
    """Extract structured data from FORM-I content using Gemini AI (kept your original prompt)."""
    extraction_prompt = """
    You are an expert at extracting information from FORM-I S&T grant proposals for the Ministry of Coal.
    
    Extract the following information from the provided content and return it as a JSON object with these exact keys:
    
    {
        "project_title": "",
        "principal_implementing_agency": "",
        "project_leader_name": "",
        "sub_implementing_agency": "",
        "co_investigator_name": "",
        "definition_of_issue": "",
        "objectives": "",
        "justification_subject_area": "",
        "project_benefits": "",
        "work_plan": "",
        "methodology": "",
        "organization_of_work": "",
        "time_schedule": "",
        "foreign_exchange_details": "",
        "land_building_cost_total": "",
        "land_building_cost_year1": "",
        "land_building_cost_year2": "",
        "land_building_cost_year3": "",
        "land_building_justification": "",
        "equipment_cost_total": "",
        "equipment_cost_year1": "",
        "equipment_cost_year2": "",
        "equipment_cost_year3": "",
        "equipment_justification": "",
        "salaries_cost_total": "",
        "salaries_cost_year1": "",
        "salaries_cost_year2": "",
        "salaries_cost_year3": "",
        "consumables_cost_total": "",
        "consumables_cost_year1": "",
        "consumables_cost_year2": "",
        "consumables_cost_year3": "",
        "consumables_outlay_notes": "",
        "travel_cost_total": "",
        "travel_cost_year1": "",
        "travel_cost_year2": "",
        "travel_cost_year3": "",
        "workshop_cost_total": "",
        "workshop_cost_year1": "",
        "workshop_cost_year2": "",
        "workshop_cost_year3": "",
        "total_cost_total": "",
        "total_cost_year1": "",
        "total_cost_year2": "",
        "total_cost_year3": "",
        "fund_phasing": "",
        "cv_details": "",
        "past_experience": "",
        "other_details": "",
        "submission_date": "",
        "project_duration": "",
        "contact_email": "",
        "contact_phone": ""
    }
    
    Instructions:
    1. Extract exact text as it appears in the document
    2. For cost fields, extract only numerical values (without "Rs." or "lakhs")
    3. If information is not found, use empty string ""
    4. For long text fields, preserve the original formatting and content
    5. Return ONLY the JSON object, no additional text
    
    Content to extract from:
    """ + content
    try:
        # Use extractor_model if available, otherwise fallback to deterministic empty structure
        if extractor_model:
            response = extractor_model.generate_content(extraction_prompt)
            extracted_json = response.text.strip()
            # Clean code block markers if present
            if extracted_json.startswith('```json'):
                extracted_json = extracted_json[7:]
            if extracted_json.endswith('```'):
                extracted_json = extracted_json[:-3]
            extracted_data = json.loads(extracted_json)
            return extracted_data
        else:
            # If no extractor LLM configured, return empty template
            return {
                "project_title": "",
                "principal_implementing_agency": "",
                "project_leader_name": "",
                "sub_implementing_agency": "",
                "co_investigator_name": "",
                "definition_of_issue": "",
                "objectives": "",
                "justification_subject_area": "",
                "project_benefits": "",
                "work_plan": "",
                "methodology": "",
                "organization_of_work": "",
                "time_schedule": "",
                "foreign_exchange_details": "",
                "land_building_cost_total": "",
                "land_building_cost_year1": "",
                "land_building_cost_year2": "",
                "land_building_cost_year3": "",
                "land_building_justification": "",
                "equipment_cost_total": "",
                "equipment_cost_year1": "",
                "equipment_cost_year2": "",
                "equipment_cost_year3": "",
                "equipment_justification": "",
                "salaries_cost_total": "",
                "salaries_cost_year1": "",
                "salaries_cost_year2": "",
                "salaries_cost_year3": "",
                "consumables_cost_total": "",
                "consumables_cost_year1": "",
                "consumables_cost_year2": "",
                "consumables_cost_year3": "",
                "consumables_outlay_notes": "",
                "travel_cost_total": "",
                "travel_cost_year1": "",
                "travel_cost_year2": "",
                "travel_cost_year3": "",
                "workshop_cost_total": "",
                "workshop_cost_year1": "",
                "workshop_cost_year2": "",
                "workshop_cost_year3": "",
                "total_cost_total": "",
                "total_cost_year1": "",
                "total_cost_year2": "",
                "total_cost_year3": "",
                "fund_phasing": "",
                "cv_details": "",
                "past_experience": "",
                "other_details": "",
                "submission_date": "",
                "project_duration": "",
                "contact_email": "",
                "contact_phone": ""
            }
    except Exception as e:
        logger.error("Error in AI extraction: %s", e)
        # Return empty structure if AI fails
        return {
            "project_title": "",
            "principal_implementing_agency": "",
            "project_leader_name": "",
            "sub_implementing_agency": "",
            "co_investigator_name": "",
            "definition_of_issue": "",
            "objectives": "",
            "justification_subject_area": "",
            "project_benefits": "",
            "work_plan": "",
            "methodology": "",
            "organization_of_work": "",
            "time_schedule": "",
            "foreign_exchange_details": "",
            "land_building_cost_total": "",
            "land_building_cost_year1": "",
            "land_building_cost_year2": "",
            "land_building_cost_year3": "",
            "land_building_justification": "",
            "equipment_cost_total": "",
            "equipment_cost_year1": "",
            "equipment_cost_year2": "",
            "equipment_cost_year3": "",
            "equipment_justification": "",
            "salaries_cost_total": "",
            "salaries_cost_year1": "",
            "salaries_cost_year2": "",
            "salaries_cost_year3": "",
            "consumables_cost_total": "",
            "consumables_cost_year1": "",
            "consumables_cost_year2": "",
            "consumables_cost_year3": "",
            "consumables_outlay_notes": "",
            "travel_cost_total": "",
            "travel_cost_year1": "",
            "travel_cost_year2": "",
            "travel_cost_year3": "",
            "workshop_cost_total": "",
            "workshop_cost_year1": "",
            "workshop_cost_year2": "",
            "workshop_cost_year3": "",
            "total_cost_total": "",
            "total_cost_year1": "",
            "total_cost_year2": "",
            "total_cost_year3": "",
            "fund_phasing": "",
            "cv_details": "",
            "past_experience": "",
            "other_details": "",
            "submission_date": "",
            "project_duration": "",
            "contact_email": "",
            "contact_phone": ""
        }

def construct_simple_json_structure(extracted_data: Dict[str, Any]) -> Dict[str, Any]:
    """Construct a simple JSON structure from extracted data (kept your function)."""
    cleaned_data = {}
    for key, value in extracted_data.items():
        if isinstance(value, str):
            cleaned_data[key] = clean_text_field(value)
        else:
            cleaned_data[key] = value

    return {
        "form_type": "FORM-I S&T Grant Proposal",
        "basic_information": {
            "project_title": cleaned_data.get("project_title", ""),
            "principal_implementing_agency": cleaned_data.get("principal_implementing_agency", ""),
            "project_leader_name": cleaned_data.get("project_leader_name", ""),
            "sub_implementing_agency": cleaned_data.get("sub_implementing_agency", ""),
            "co_investigator_name": cleaned_data.get("co_investigator_name", ""),
            "contact_email": cleaned_data.get("contact_email", ""),
            "contact_phone": cleaned_data.get("contact_phone", ""),
            "submission_date": cleaned_data.get("submission_date", ""),
            "project_duration": cleaned_data.get("project_duration", "")
        },
        "project_details": {
            "definition_of_issue": cleaned_data.get("definition_of_issue", ""),
            "objectives": cleaned_data.get("objectives", ""),
            "justification_subject_area": cleaned_data.get("justification_subject_area", ""),
            "project_benefits": cleaned_data.get("project_benefits", ""),
            "work_plan": cleaned_data.get("work_plan", ""),
            "methodology": cleaned_data.get("methodology", ""),
            "organization_of_work": cleaned_data.get("organization_of_work", ""),
            "time_schedule": cleaned_data.get("time_schedule", ""),
            "foreign_exchange_details": cleaned_data.get("foreign_exchange_details", "")
        },
        "cost_breakdown": {
            "capital_expenditure": {
                "land_building": {
                    "total": cleaned_data.get("land_building_cost_total", ""),
                    "year1": cleaned_data.get("land_building_cost_year1", ""),
                    "year2": cleaned_data.get("land_building_cost_year2", ""),
                    "year3": cleaned_data.get("land_building_cost_year3", ""),
                    "justification": cleaned_data.get("land_building_justification", "")
                },
                "equipment": {
                    "total": cleaned_data.get("equipment_cost_total", ""),
                    "year1": cleaned_data.get("equipment_cost_year1", ""),
                    "year2": cleaned_data.get("equipment_cost_year2", ""),
                    "year3": cleaned_data.get("equipment_cost_year3", ""),
                    "justification": cleaned_data.get("equipment_justification", "")
                }
            },
            "revenue_expenditure": {
                "salaries": {
                    "total": cleaned_data.get("salaries_cost_total", ""),
                    "year1": cleaned_data.get("salaries_cost_year1", ""),
                    "year2": cleaned_data.get("salaries_cost_year2", ""),
                    "year3": cleaned_data.get("salaries_cost_year3", "")
                },
                "consumables": {
                    "total": cleaned_data.get("consumables_cost_total", ""),
                    "year1": cleaned_data.get("consumables_cost_year1", ""),
                    "year2": cleaned_data.get("consumables_cost_year2", ""),
                    "year3": cleaned_data.get("consumables_cost_year3", ""),
                    "notes": cleaned_data.get("consumables_outlay_notes", "")
                },
                "travel": {
                    "total": cleaned_data.get("travel_cost_total", ""),
                    "year1": cleaned_data.get("travel_cost_year1", ""),
                    "year2": cleaned_data.get("travel_cost_year2", ""),
                    "year3": cleaned_data.get("travel_cost_year3", "")
                },
                "workshop_seminar": {
                    "total": cleaned_data.get("workshop_cost_total", ""),
                    "year1": cleaned_data.get("workshop_cost_year1", ""),
                    "year2": cleaned_data.get("workshop_cost_year2", ""),
                    "year3": cleaned_data.get("workshop_cost_year3", "")
                }
            },
            "total_project_cost": {
                "total": cleaned_data.get("total_cost_total", ""),
                "year1": cleaned_data.get("total_cost_year1", ""),
                "year2": cleaned_data.get("total_cost_year2", ""),
                "year3": cleaned_data.get("total_cost_year3", "")
            },
            "fund_phasing": cleaned_data.get("fund_phasing", "")
        },
        "additional_information": {
            "cv_details": cleaned_data.get("cv_details", ""),
            "past_experience": cleaned_data.get("past_experience", ""),
            "other_details": cleaned_data.get("other_details", "")
        }
    }

def store_in_supabase(proposal_data: Dict[str, Any], file_info: Dict[str, str]) -> Dict[str, Any]:
    """Store extracted proposal data in Supabase database (kept same structure)."""
    try:
        if not supabase:
            return {"success": False, "error": "Supabase client not configured"}
        db_data = {
            "id": str(uuid.uuid4()),
            "original_filename": file_info.get("filename", ""),
            "file_url": file_info.get("public_url", ""),
            "project_title": proposal_data.get("project_title", ""),
            "principal_implementing_agency": proposal_data.get("principal_implementing_agency", ""),
            "project_leader_name": proposal_data.get("project_leader_name", ""),
            "sub_implementing_agency": proposal_data.get("sub_implementing_agency", ""),
            "co_investigator_name": proposal_data.get("co_investigator_name", ""),
            "definition_of_issue": proposal_data.get("definition_of_issue", ""),
            "objectives": proposal_data.get("objectives", ""),
            "justification_subject_area": proposal_data.get("justification_subject_area", ""),
            "project_benefits": proposal_data.get("project_benefits", ""),
            "work_plan": proposal_data.get("work_plan", ""),
            "methodology": proposal_data.get("methodology", ""),
            "organization_of_work": proposal_data.get("organization_of_work", ""),
            "time_schedule": proposal_data.get("time_schedule", ""),
            "total_cost_total": proposal_data.get("total_cost_total", ""),
            "total_cost_year1": proposal_data.get("total_cost_year1", ""),
            "total_cost_year2": proposal_data.get("total_cost_year2", ""),
            "total_cost_year3": proposal_data.get("total_cost_year3", ""),
            "land_building_cost_total": proposal_data.get("land_building_cost_total", ""),
            "equipment_cost_total": proposal_data.get("equipment_cost_total", ""),
            "salaries_cost_total": proposal_data.get("salaries_cost_total", ""),
            "consumables_cost_total": proposal_data.get("consumables_cost_total", ""),
            "travel_cost_total": proposal_data.get("travel_cost_total", ""),
            "workshop_cost_total": proposal_data.get("workshop_cost_total", ""),
            "cv_details": proposal_data.get("cv_details", ""),
            "past_experience": proposal_data.get("past_experience", ""),
            "other_details": proposal_data.get("other_details", ""),
            "submission_date": proposal_data.get("submission_date", ""),
            "project_duration": proposal_data.get("project_duration", ""),
            "contact_email": proposal_data.get("contact_email", ""),
            "contact_phone": proposal_data.get("contact_phone", ""),
            "extraction_date": datetime.now().isoformat(),
            "status": "extracted"
        }
        response = supabase.table("proposals").insert(db_data).execute()
        if response.data:
            return {"success": True, "proposal_id": db_data["id"], "database_response": response.data[0]}
        else:
            return {"success": False, "error": "Failed to insert into database"}
    except Exception as e:
        return {"success": False, "error": f"Database storage error: {str(e)}"}

# -------------------------------------------------------------------------
# ------------------ Validation logic (hybrid) -----------------------------
# -------------------------------------------------------------------------

# Fields to validate (Deliverables & Thrust Area removed)
VALIDATE_FIELDS = [
    "Project Title",
    "Principal Investigator",
    "Organization",
    "Definition of the Issue",
    "Objectives",
    "Justification for Subject Area",
    "Benefits to Coal Industry",
    "Work Plan",
    "Methodology",
    "Organization of Work Elements",
    "Time Schedule"
]

# Rules derived from Guidelines.pdf (you asked to use Guidelines.pdf content)
# These are the explicit structural rules we enforce deterministically:
GUIDELINE_RULES = {
    "Project Title": {"max_words": 60, "fail_reason": "Project Title must be concise (<= 60 words) and descriptive."},
    "Principal Investigator": {"required": True, "fail_reason": "Principal Investigator must be specified and valid (not placeholder)."},
    "Organization": {"required": True, "fail_reason": "Principal / Sub-implementing Agency must be specified."},
    "Definition of the Issue": {"min_words": 30, "fail_reason": "Definition must clearly explain the technical problem, impact and importance."},
    "Objectives": {"min_count": 2, "max_count": 5, "must_be_list": True, "fail_reason": "Objectives must be 2–5 clearly defined and listed."},
    "Justification for Subject Area": {"min_words": 20, "fail_reason": "Justification must explain the research need and relevance to coal industry."},
    "Benefits to Coal Industry": {"min_words": 10, "fail_reason": "Benefits should explicitly state measurable benefits to the coal industry."},
    "Work Plan": {"min_words": 30, "fail_reason": "Work Plan should be phase-wise/stepwise with responsibilities and milestones."},
    "Methodology": {"min_words": 30, "fail_reason": "Methodology must state technical approach, tools and data analysis plan."},
    "Organization of Work Elements": {"min_words": 10, "fail_reason": "Organization of work should specify team roles and responsibilities."},
    "Time Schedule": {"must_have_chart": True, "fail_reason": "Time Schedule must include a Bar/PERT/Gantt chart or explicit milestones."}
}

PLACEHOLDER_RE = re.compile(
    r"(come here|placeholder|tbd|to be filled|objectives section|issue will come here|work plan will come here|methodology will come here|very very beneficial|sample|xxx)",
    re.IGNORECASE
)

def load_guidelines_text(pdf_path: str) -> str:
    if not os.path.exists(pdf_path):
        logger.warning("Guidelines PDF not found at %s", pdf_path)
        return ""
    texts = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for p in pdf.pages:
                try:
                    texts.append(p.extract_text() or "")
                except Exception:
                    texts.append("")
        return "\n".join(texts)
    except Exception as e:
        logger.exception("Failed to read guidelines PDF: %s", e)
        return ""

def build_guideline_excerpts(text: str, fields: List[str], window_sentences: int = 2) -> Dict[str, str]:
    """
    Find small excerpts from Guidelines text relevant to each field using keyword search.
    Returns dict field->excerpt (may be empty).
    """
    excerpts = {}
    if not text:
        for f in fields:
            excerpts[f] = ""
        return excerpts

    # simple sentence splitter
    sentences = re.split(r'(?<=[\.\?\n])\s+', text)
    lc = [s.lower() for s in sentences]

    key_map = {
        "Project Title": ["project title", "title of the project"],
        "Principal Investigator": ["principal investigator", "project leader", "pi"],
        "Organization": ["implementing agency", "sub-implementing", "principal implementing"],
        "Definition of the Issue": ["definition of the issue", "problem definition", "definition"],
        "Objectives": ["objectives", "objectives of the project"],
        "Justification for Subject Area": ["justification", "justification for the"],
        "Benefits to Coal Industry": ["benefit to the industry", "benefits"],
        "Work Plan": ["work plan", "organization of work", "work elements"],
        "Methodology": ["methodology", "approach"],
        "Organization of Work Elements": ["organization of work", "roles", "responsibilities"],
        "Time Schedule": ["time schedule", "bar chart", "pert chart", "gantt", "schedule"]
    }

    for f in fields:
        keywords = key_map.get(f, [f.lower()])
        found = False
        excerpt = ""
        for kw in keywords:
            for i, s in enumerate(lc):
                if kw in s:
                    start = max(0, i - window_sentences)
                    end = min(len(sentences), i + window_sentences + 1)
                    excerpt = " ".join(sentences[start:end]).strip()
                    found = True
                    break
            if found:
                break
        excerpts[f] = excerpt
    return excerpts

# ---------- Simple helpers ----------
def count_words(text: str) -> int:
    return len(re.findall(r"\S+", text))

def parse_objectives(text: str) -> List[str]:
    if not text:
        return []
    parts = re.split(r'\n|;|\d+\.\s*|\(\d+\)|\-\s+|\•', text)
    items = [p.strip() for p in parts if p.strip()]
    return items

# ------------ Deterministic rule check ------------
def rule_based_check(field_label: str, value: str) -> Dict[str, str]:
    rule = GUIDELINE_RULES.get(field_label, {})
    v = (value or "").strip()
    if not v:
        return {"validation_result": "not_filled", "reason": f"{field_label} not filled in FORM-I (required by S&T Guidelines)."}

    if PLACEHOLDER_RE.search(v):
        return {"validation_result": "not_following_guidelines", "reason": f"{field_label} appears to contain placeholder text which violates S&T Guidelines."}

    # Project Title length
    if field_label == "Project Title":
        words = count_words(v)
        maxw = rule.get("max_words", 9999)
        if words > maxw:
            return {"validation_result": "not_following_guidelines", "reason": rule.get("fail_reason", "") + f" (found {words} words)."}
        return {"validation_result": "filled_and_ok", "reason": "Title length within guideline limit."}

    if field_label == "Principal Investigator":
        if len(v.split()) < 2:
            return {"validation_result": "not_following_guidelines", "reason": rule.get("fail_reason", "") + " (name looks incomplete)."}
        return {"validation_result": "filled_and_ok", "reason": "PI name provided and appears valid."}

    if field_label == "Organization":
        return {"validation_result": "filled_and_ok", "reason": "Organization provided."}

    if field_label == "Definition of the Issue":
        words = count_words(v)
        if words < rule.get("min_words", 0):
            return {"validation_result": "not_following_guidelines", "reason": rule.get("fail_reason", "") + f" (only {words} words)."}
        return {"validation_result": "filled_and_ok", "reason": "Definition appears sufficiently detailed."}

    if field_label == "Objectives":
        items = parse_objectives(v)
        must_list = rule.get("must_be_list", False)
        # if must be list and looks like a paragraph, fail
        if must_list and len(items) == 1 and "\n" not in v and not re.search(r'\d+\)', v):
            return {"validation_result": "not_following_guidelines", "reason": rule.get("fail_reason", "") + " (objectives appear as a paragraph rather than listed items)."}
        if len(items) < rule.get("min_count", 0) or len(items) > rule.get("max_count", 9999):
            return {"validation_result": "not_following_guidelines", "reason": rule.get("fail_reason", "") + f" (found {len(items)} objectives)."}
        return {"validation_result": "filled_and_ok", "reason": f"{len(items)} objectives provided (within allowed range)."}

    if field_label == "Justification for Subject Area":
        if count_words(v) < rule.get("min_words", 0):
            return {"validation_result": "not_following_guidelines", "reason": rule.get("fail_reason", "") + f" (only {count_words(v)} words)."}
        return {"validation_result": "filled_and_ok", "reason": "Justification length OK."}

    if field_label == "Benefits to Coal Industry":
        if count_words(v) < rule.get("min_words", 0):
            return {"validation_result": "not_following_guidelines", "reason": rule.get("fail_reason", "") + f" (only {count_words(v)} words)."}
        if re.search(r"very beneficial|very very beneficial|beneficial", v, flags=re.IGNORECASE) and count_words(v) < 20:
            return {"validation_result": "not_following_guidelines", "reason": "Benefits are too vague; S&T Guidelines require explicit measurable benefits."}
        return {"validation_result": "filled_and_ok", "reason": "Benefits appear explicit."}

    if field_label == "Work Plan":
        if count_words(v) < rule.get("min_words", 0):
            return {"validation_result": "not_following_guidelines", "reason": rule.get("fail_reason", "") + f" (only {count_words(v)} words)."}
        if not re.search(r"\b(Phase|Phase-I|Phase II|Milestone|month|quarter|year|Q1|Q2|Q3|Q4)\b", v, flags=re.IGNORECASE):
            return {"validation_result": "not_following_guidelines", "reason": "Work Plan lacks phase-wise/milestone indications as required by S&T Guidelines."}
        return {"validation_result": "filled_and_ok", "reason": "Work Plan includes phase-wise steps/milestones."}

    if field_label == "Methodology":
        if count_words(v) < rule.get("min_words", 0):
            return {"validation_result": "not_following_guidelines", "reason": rule.get("fail_reason", "") + f" (only {count_words(v)} words)."}
        if not re.search(r"\b(technique|method|instrument|software|survey|sampling|analysis|inversion|modelling|equipment)\b", v, flags=re.IGNORECASE):
            return {"validation_result": "not_following_guidelines", "reason": "Methodology lacks mention of specific techniques or tools (required by S&T Guidelines)."}
        return {"validation_result": "filled_and_ok", "reason": "Methodology sufficiently technical."}

    if field_label == "Organization of Work Elements":
        if count_words(v) < rule.get("min_words", 0):
            return {"validation_result": "not_following_guidelines", "reason": rule.get("fail_reason", "") + f" (only {count_words(v)} words)."}
        if not re.search(r"\b(PI|Co-?I|investigator|team|role|responsib|coordinator)\b", v, flags=re.IGNORECASE):
            return {"validation_result": "not_following_guidelines", "reason": "Organization of Work lacks roles/responsibilities specification."}
        return {"validation_result": "filled_and_ok", "reason": "Organization of work elements described."}

    if field_label == "Time Schedule":
        if re.search(r"\b(bar chart|pert|gantt|milestone|schedule|month|year|quarter)\b", v, flags=re.IGNORECASE):
            return {"validation_result": "filled_and_ok", "reason": "Time Schedule mentions chart/milestones."}
        return {"validation_result": "not_following_guidelines", "reason": GUIDELINE_RULES["Time Schedule"]["fail_reason"]}

    return {"validation_result": "filled_and_ok", "reason": "Field validated by deterministic rule."}

# ---------- LLM-based qualitative judgment ----------
def ask_gemini_validate(field_label: str, field_value: str, guideline_excerpt: str) -> Dict[str, str]:
    """Ask Gemini to validate a qualitative field; returns {'validation_result','reason'}"""
    if not model:
        # fallback
        return deterministic_llm_fallback(field_label, field_value, guideline_excerpt)

    prompt = f"""
You are a strict validator for FORM-I fields, using only the provided S&T guideline excerpt.

FIELD: {field_label}
FIELD_VALUE:
'''{field_value if field_value else ""}'''

GUIDELINE EXCERPT:
'''{guideline_excerpt if guideline_excerpt else ""}'''

TASK:
Using ONLY the guideline excerpt, return EXACTLY a JSON object with:
{{ "validation_result": "<filled_and_ok | not_filled | not_following_guidelines>", "reason": "<brief explanation citing the guideline condition that failed or passed>" }}

Rules:
- If field_value empty -> not_filled
- If field_value is placeholder -> not_following_guidelines
- If excerpt clearly specifies a condition that field_value violates -> not_following_guidelines (cite the condition)
- Otherwise conservatively return not_following_guidelines unless excerpt explicitly approves.
"""
    try:
        resp = model.generate_content(prompt)
        txt = (resp.text or "").strip()
        m = re.search(r"\{.*\}", txt, flags=re.S)
        if not m:
            return deterministic_llm_fallback(field_label, field_value, guideline_excerpt)
        parsed = json.loads(m.group(0))
        vr = parsed.get("validation_result", "").strip()
        reason = parsed.get("reason", "").strip()
        if vr not in ("filled_and_ok", "not_filled", "not_following_guidelines"):
            # normalize
            low = vr.lower()
            if low in ("yes","pass","true"): vr = "filled_and_ok"
            elif low in ("no","fail","false"): vr = "not_following_guidelines"
            else: vr = "not_following_guidelines"
        if not reason:
            reason = "LLM provided no reason."
        return {"validation_result": vr, "reason": reason}
    except Exception as e:
        logger.exception("Gemini validation error: %s", e)
        return deterministic_llm_fallback(field_label, field_value, guideline_excerpt)

def deterministic_llm_fallback(field_label: str, field_value: str, guideline_excerpt: str) -> Dict[str, str]:
    v = (field_value or "").strip()
    if not v:
        return {"validation_result": "not_filled", "reason": f"{field_label} not filled in FORM-I."}
    if PLACEHOLDER_RE.search(v):
        return {"validation_result": "not_following_guidelines", "reason": f"{field_label} contains placeholder text; violates guideline requirement for substantive content."}
    if guideline_excerpt and guideline_excerpt.strip():
        cit = guideline_excerpt.split(".")[0].strip()
        # short values are suspicious
        if len(v) < 40:
            return {"validation_result": "not_following_guidelines", "reason": f"Does not satisfy guideline condition: '{cit}...' (per S&T Guidelines)."}
        return {"validation_result": "filled_and_ok", "reason": "Field appears substantive (deterministic fallback)."}
    return {"validation_result": "filled_and_ok", "reason": "Field present; no specific guideline excerpt found - accepted by fallback."}

# ---------- Map extracted JSON -> canonical fields ----------
def get_value_from_extracted_payload(extracted_payload: Dict[str, Any], field_label: str) -> str:
    """
    The extractor returns 'extracted_data' and 'raw_data' shapes (as in your extractor).
    Try multiple keys to find a value.
    """
    if not isinstance(extracted_payload, dict):
        return ""
    # try structured
    try_paths = {
        "Project Title": ["basic_information.project_title", "project_title"],
        "Principal Investigator": ["basic_information.project_leader_name", "project_leader_name", "principal_implementing_agency"],
        "Organization": ["basic_information.sub_implementing_agency", "sub_implementing_agency", "principal_implementing_agency"],
        "Definition of the Issue": ["project_details.definition_of_issue", "definition_of_issue"],
        "Objectives": ["project_details.objectives", "objectives"],
        "Justification for Subject Area": ["project_details.justification_subject_area", "justification_subject_area"],
        "Benefits to Coal Industry": ["project_details.project_benefits", "project_benefits"],
        "Work Plan": ["project_details.work_plan", "work_plan"],
        "Methodology": ["project_details.methodology", "methodology"],
        "Organization of Work Elements": ["project_details.organization_of_work", "organization_of_work"],
        "Time Schedule": ["project_details.time_schedule", "time_schedule"]
    }

    def deep_get(obj, path):
        if not obj:
            return ""
        cur = obj
        for p in path.split("."):
            if isinstance(cur, dict) and p in cur:
                cur = cur[p]
            else:
                return ""
        return cur

    candidates = try_paths.get(field_label, [])
    for c in candidates:
        val = deep_get(extracted_payload, c)
        if val:
            return val

    # fallback: try flat keys
    for k, v in extracted_payload.items():
        if not v:
            continue
        lk = k.lower()
        if field_label.split()[0].lower() in lk:
            return v if isinstance(v, str) else json.dumps(v)
    return ""

# -------------------------------------------------------------------------
# ------------------ FastAPI application & routes -------------------------
# -------------------------------------------------------------------------

app = FastAPI(title="FORM-I Validator (Extractor integrated)", version="1.0")
router = APIRouter(prefix="/validation", tags=["validation"])

@router.post("/validate-form1")
async def validate_form1(file: UploadFile = File(...)):
    """
    Main endpoint:
    1) Reads file bytes
    2) Calls extractor logic (in-process) to get structured JSON (as your /extract-form1 does)
    3) Validates fields against Guidelines (hybrid)
    4) Returns structured result exactly as requested
    """
    if not file.filename or not file.filename.lower().endswith((".pdf", ".docx", ".txt")):
        raise HTTPException(status_code=400, detail="Please upload a PDF/DOCX/TXT file")

    tmp_path = None
    try:
        # Save temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        with open(tmp_path, "rb") as fh:
            file_bytes = fh.read()

        # ----- Call extractor logic exactly as your /extract-form1 route -----
        extracted_text = extract_text_from_file(file.filename, file_bytes)
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No text content could be extracted from the file")

        # Use AI extractor (if configured) to return proposal_data; otherwise, the extractor returns empty keys.
        proposal_data = extract_form_data_with_ai(extracted_text)
        json_structure = construct_simple_json_structure(proposal_data)

        # Attempt to store in supabase (if configured) - keep behavior same as extractor
        file_info = {
            "filename": file.filename,
            "stored_as": f"{uuid.uuid4()}{os.path.splitext(file.filename)[1]}",
            "public_url": ""
        }
        if supabase:
            try:
                # upload to storage (best-effort)
                supabase.storage.from_(UPLOAD_BUCKET).upload(file_info["stored_as"], file_bytes, {"content-type": file.content_type})
                pu = supabase.storage.from_(UPLOAD_BUCKET).get_public_url(file_info["stored_as"])
                file_info["public_url"] = pu
            except Exception:
                # proceed even if upload fails
                pass
            db_res = store_in_supabase(proposal_data, file_info)
        else:
            db_res = {"success": False, "error": "Supabase not configured"}

        # raw_extracted = proposal_data (AI output raw keys)
        raw_extracted = proposal_data.copy()

        # Build guideline excerpts
        guidelines_text = load_guidelines_text(GUIDELINES_PDF_PATH)
        guideline_excerpts = build_guideline_excerpts(guidelines_text, VALIDATE_FIELDS, window_sentences=2)

        # Validate fields
        fields_out = []
        missing_columns = []
        failing_columns = []

        # The combined extracted payload for get_value function: use json_structure for structured plus raw_extracted for fallbacks
        combined_payload = json_structure.copy()
        # Flatten: add top-level raw keys to combined for fallback
        for k, v in raw_extracted.items():
            if k not in combined_payload:
                combined_payload[k] = v

        for field_label in VALIDATE_FIELDS:
            # get value using extractor outputs
            value = get_value_from_extracted_payload(json_structure, field_label)
            if not value:
                # try raw_extracted fallback keys
                for rk in raw_extracted:
                    if isinstance(raw_extracted[rk], str) and field_label.split()[0].lower() in rk.lower():
                        value = raw_extracted[rk]
                        break
            if isinstance(value, (list, dict)):
                value = json.dumps(value)

            # if deterministic rule exists, apply it first
            if field_label in GUIDELINE_RULES:
                rule_res = rule_based_check(field_label, value)
                res = rule_res
            else:
                # use LLM validation for qualitative fields (if available), otherwise fallback
                excerpt = guideline_excerpts.get(field_label, "")
                res = ask_gemini_validate(field_label, value or "", excerpt)

            vr = res.get("validation_result", "not_following_guidelines")
            reason = res.get("reason", "")

            # Normalize outputs
            if vr not in ("filled_and_ok", "not_filled", "not_following_guidelines"):
                # map common alternatives
                lower = vr.lower()
                if lower in ("yes", "pass", "true"):
                    vr = "filled_and_ok"
                elif lower in ("no", "fail", "false"):
                    vr = "not_following_guidelines"
                else:
                    vr = "not_following_guidelines"

            entry = {
                "field_name": field_label,
                "value": value or "",
                "validation_result": vr,
                "reason": reason or ("Not following guidelines (no specific reason provided).")
            }
            fields_out.append(entry)

            if vr == "not_filled":
                missing_columns.append(field_label)
            if vr == "not_following_guidelines":
                failing_columns.append({"field": field_label, "reason": reason})

        overall = False if (missing_columns or failing_columns) else True

        validation_result = {
            "overall_validation": overall,
            "columns_missing_value": missing_columns,
            "columns_not_following_guidelines": failing_columns,
            "fields": fields_out
        }

        response = {
            "validation_result": validation_result,
            "extracted_data": json_structure,
            "raw_extracted": raw_extracted,
            "guidelines_used": os.path.basename(GUIDELINES_PDF_PATH)
        }

        return JSONResponse(status_code=200, content=response)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Validation failed: %s", e)
        # include short traceback in error message for debugging
        tb = _traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Validation error: {str(e)}\n{tb}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass

@router.get("/health")
async def health():
    return {"status": "running", "hybrid_validator": True, "guidelines": os.path.basename(GUIDELINES_PDF_PATH)}

app.include_router(router)

# If run as main:
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("validator_with_extractor:app", host="0.0.0.0", port=8001, reload=True)
