# validation_with_embedded_extractor.py
import os
import json
import uuid
import re
from datetime import datetime
from typing import Dict, Any, List, Optional
import traceback

from io import BytesIO
from dotenv import load_dotenv

load_dotenv()

# ========== ORIGINAL EXTRACTION BLOCK (UNCHANGED) ==========
import PyPDF2
import docx
import chardet
import google.generativeai as genai
from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Body
from fastapi.responses import JSONResponse
from supabase import create_client, Client

# Environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY4")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Missing SUPABASE_URL or SUPABASE_KEY in environment variables")

if not GEMINI_API_KEY:
    raise Exception("Missing GEMINI_API_KEY in environment variables")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Gemini AI for extraction
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash-lite")

# Storage buckets
UPLOAD_BUCKET = "Coal-research-files"
JSON_BUCKET = "proposal-json"

def extract_text_from_file(filename: str, file_bytes: bytes) -> str:
    """Extract text from various file formats."""
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
    
    # Clean up the text by removing extra whitespace and normalizing
    cleaned = ' '.join(text.split())
    return cleaned

def extract_form_data_with_ai(content: str) -> Dict[str, Any]:
    """Extract structured data from FORM-I content using Gemini AI."""
    
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
        response = model.generate_content(extraction_prompt)
        extracted_json = response.text.strip()
        
        # Clean the response to ensure it's valid JSON
        if extracted_json.startswith('```json'):
            extracted_json = extracted_json[7:]
        if extracted_json.endswith('```'):
            extracted_json = extracted_json[:-3]
        
        extracted_data = json.loads(extracted_json)
        return extracted_data
        
    except Exception as e:
        print(f"Error in AI extraction: {str(e)}")
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
    """Construct a simple JSON structure from extracted data."""
    
    # Clean all text fields
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
    """Store extracted proposal data in Supabase database."""
    try:
        # Prepare data for database storage
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
        
        # Insert into proposals table
        response = supabase.table("proposals").insert(db_data).execute()
        
        if response.data:
            return {
                "success": True,
                "proposal_id": db_data["id"],
                "database_response": response.data[0]
            }
        else:
            return {
                "success": False,
                "error": "Failed to insert into database"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Database storage error: {str(e)}"
        }

# keep the original extract route so it's available if you still want to call it separately
extract_router = APIRouter()

@extract_router.post("/extract-form1")
async def extract_form1_proposal(file: UploadFile = File(...)):
    """
    Extract content from FORM-I proposal document and store in Supabase.
    Returns structured JSON in Slate.js format.
    """
    try:
        # Validate file type
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
            
        ext = file.filename.lower().split(".")[-1]
        if ext not in ["pdf", "docx", "txt"]:
            raise HTTPException(status_code=400, detail="Unsupported file format. Only PDF, DOCX, and TXT files are allowed.")
        
        # Read file content
        file_bytes = await file.read()
        
        # Upload original file to Supabase storage
        unique_filename = f"{uuid.uuid4()}.{ext}"
        upload_response = supabase.storage.from_(UPLOAD_BUCKET).upload(
            unique_filename,
            file_bytes,
            {"content-type": file.content_type}
        )
        
        file_url = supabase.storage.from_(UPLOAD_BUCKET).get_public_url(unique_filename)
        
        file_info = {
            "filename": file.filename,
            "stored_as": unique_filename,
            "public_url": file_url
        }
        
        # Extract text from file
        extracted_text = extract_text_from_file(file.filename, file_bytes)
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No text content could be extracted from the file")
        
        # Extract structured data using AI
        proposal_data = extract_form_data_with_ai(extracted_text)
        
        # Construct simple JSON structure
        json_structure = construct_simple_json_structure(proposal_data)
        
        # Store in Supabase database
        db_result = store_in_supabase(proposal_data, file_info)
        
        # Prepare response
        response_data = {
            "success": True,
            "message": "FORM-I proposal extracted successfully",
            "extraction_id": db_result.get("proposal_id"),
            "file_info": file_info,
            "database_stored": db_result.get("success", False),
            "extracted_data": json_structure,
            "raw_data": proposal_data,
            "statistics": {
                "text_length": len(extracted_text),
                "fields_extracted": len([v for v in proposal_data.values() if v]),
                "total_fields": len(proposal_data)
            }
        }
        
        # Store JSON structure in storage bucket
        json_filename = f"{uuid.uuid4()}_structure.json"
        json_bytes = json.dumps(json_structure, indent=2).encode('utf-8')
        supabase.storage.from_(JSON_BUCKET).upload(
            json_filename,
            json_bytes,
            {"content-type": "application/json"}
        )
        
        json_url = supabase.storage.from_(JSON_BUCKET).get_public_url(json_filename)
        response_data["json_structure_url"] = json_url
        
        return JSONResponse(content=response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Extraction error: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing FORM-I proposal: {str(e)}"
        )


# ========== VALIDATION BLOCK (ADDED) ==========

# We'll reuse the same genai client (model) for validation calls.
# If for some reason you want a separate API key you can modify GEMINI_API_KEY4 env var.

# Fields to validate (these 13 only)
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
    "Time Schedule",
    "Deliverables",
    "Thrust Area"
]

# Concise guideline summaries (Option B) — adjust as needed.
GUIDELINE_SUMMARIES: Dict[str, str] = {
    "Project Title": (
        "Project title should be concise, specific to the technical scope of the work, "
        "and must reflect the key objective or deliverable. Avoid placeholders, generic phrases, "
        "or overly long descriptive titles."
    ),
    "Principal Investigator": (
        "Principal Investigator must be a named, qualified person with credentials and affiliation. "
        "The proposal should include the PI's name and evidence of competence (CV in additional info)."
    ),
    "Organization": (
        "Name of the principal implementing organization / sub-implementing agency must be provided, "
        "and should be a real institution (not placeholders)."
    ),
    "Definition of the Issue": (
        "Problem definition must be precise and technical: describe the current gap, baseline, "
        "and why the problem matters. It must be more than a one-line placeholder."
    ),
    "Objectives": (
        "Objectives must be 1–5 clear, specific, measurable items directly linked to the problem definition. "
        "They should be concise and actionable (not generic text)."
    ),
    "Justification for Subject Area": (
        "Justification should explain why the proposed research is important, show state-of-the-art context, "
        "and justify the subject area selection with evidence or references where applicable."
    ),
    "Benefits to Coal Industry": (
        "Benefits section must explicitly state how the project helps the coal industry (operational gains, cost reduction, "
        "safety improvements, environmental impact), not vague claims."
    ),
    "Work Plan": (
        "Work plan must describe tasks, sequencing, milestones, responsible parties and expected outputs; "
        "should not be a placeholder sentence."
    ),
    "Methodology": (
        "Methodology must describe the technical approach, experimental or analytical methods, data collection and analysis plans. "
        "High-level placeholders are insufficient."
    ),
    "Organization of Work Elements": (
        "Breakdown of work elements (phases, team roles, responsibilities) should be present and show how tasks are organized."
    ),
    "Time Schedule": (
        "A time schedule with milestones must be provided — typically a Bar Chart or PERT chart showing tasks vs time. "
        "A textual placeholder saying 'Bar chart will come here' is not acceptable."
    ),
    "Deliverables": (
        "Expected deliverables (reports, prototypes, software, datasets, patents) must be listed and described. "
        "Empty or placeholder deliverables are not acceptable."
    ),
    "Thrust Area": (
        "The proposal must clearly indicate the claimed Thrust Area / Research Area and how the project maps to it."
    )
}

# Basic placeholder detection
PLACEHOLDER_RE = re.compile(
    r"(come here|placeholder|tbd|to be filled|objectives section|very very beneficial|issue will come here|work plan will come here|methodology will come here|bar chart/pert|bar chart|pert chart)",
    re.IGNORECASE
)

def is_placeholder_text(s: Optional[str]) -> bool:
    if not s:
        return True
    if PLACEHOLDER_RE.search(s):
        return True
    if len(s.strip()) < 4:
        return True
    return False

def call_gemini_for_validation(field_label: str, field_value: str, guideline_summary: str) -> Dict[str, str]:
    """
    Prompt Gemini to validate a single field. Expect a strict JSON response:
    {
      "validation_result": "<filled_and_ok|not_filled|not_following_guidelines>",
      "reason": "..."
    }
    """
    # Defensive: if model not initialized, return fallback
    if model is None:
        return {"validation_result": "not_following_guidelines", "reason": "Gemini model not configured; fallback conservative result."}
    
    prompt = f"""
You are an expert grants reviewer. Use ONLY the guideline summary below to judge whether the field value satisfies the guideline.

FIELD: {field_label}
FIELD_VALUE: \"\"\"{field_value if field_value is not None else ""}\"\"\"

GUIDELINE SUMMARY:
\"\"\"{guideline_summary}\"\"\"

TASK:
Using ONLY information from the GUIDELINE SUMMARY, decide if FIELD_VALUE:
- is empty/missing -> return validation_result = "not_filled"
- is present but does not meet the guideline -> "not_following_guidelines"
- meets the guideline -> "filled_and_ok"

Return EXACTLY a JSON object (no extra text) like:
{{ "validation_result": "filled_and_ok", "reason": "Short reason citing guideline." }}
"""
    try:
        resp = model.generate_content(prompt)
        text = (resp.text or "").strip()
        # extract JSON block
        m = re.search(r"\{.*\}", text, flags=re.S)
        if not m:
            # fallback: attempt to parse raw text
            try:
                parsed = json.loads(text)
            except Exception:
                # invalid LLM response
                return {"validation_result": "not_following_guidelines", "reason": "LLM did not return valid JSON; conservative default."}
        else:
            json_str = m.group(0)
            parsed = json.loads(json_str)
        vr = parsed.get("validation_result", "").strip()
        reason = parsed.get("reason", "").strip()
        if vr not in ("filled_and_ok", "not_filled", "not_following_guidelines"):
            # normalize common alternatives
            low = vr.lower()
            if low in ("yes", "pass", "true"):
                vr = "filled_and_ok"
            elif low in ("no", "fail", "false"):
                vr = "not_following_guidelines"
            else:
                vr = "not_following_guidelines"
        return {"validation_result": vr, "reason": reason}
    except Exception as e:
        # LLM error fallback
        return {"validation_result": "not_following_guidelines", "reason": f"LLM error: {str(e)}"}

def fallback_validator(field_label: str, field_value: Optional[str]) -> Dict[str, str]:
    """
    Deterministic fallback if LLM fails or returns invalid output.
    Conservative defaults: missing -> not_filled; placeholders -> not_following_guidelines; otherwise filled_and_ok.
    """
    v = field_value or ""
    v = v.strip()
    if v == "":
        return {"validation_result": "not_filled", "reason": f"{field_label} not filled in FORM-I"}
    if is_placeholder_text(v):
        return {"validation_result": "not_following_guidelines", "reason": f"{field_label} appears to be placeholder or generic text."}
    # extra heuristics
    if field_label == "Objectives":
        items = re.split(r"\n|;|\d+\.\s*|\(\d+\)|\)\s*|-", v)
        items = [i.strip() for i in items if i.strip()]
        if len(items) == 0:
            return {"validation_result": "not_following_guidelines", "reason": "Objectives not clearly listed."}
        if len(items) > 8:
            return {"validation_result": "not_following_guidelines", "reason": "Too many objectives; guidelines expect 1-5 concise objectives."}
    if field_label == "Time Schedule":
        if not re.search(r"bar chart|pert|milestone|milestones", v, re.IGNORECASE):
            return {"validation_result": "not_following_guidelines", "reason": "Time Schedule missing a Bar Chart / PERT / milestones."}
    return {"validation_result": "filled_and_ok", "reason": f"{field_label} appears filled (fallback pass)."}

# Build FastAPI app and include original router (extract route)
router = APIRouter()
router.include_router(extract_router)

# New validator route that uses embedded extractor logic directly
@router.post("/validate-form1")
async def validate_form1(file: UploadFile = File(...)):
    """
    Accepts a PDF, runs the embedded extraction logic (same as /extract-form1),
    then validates the 13 fields using guideline summaries + Gemini LLM.
    Returns final JSON in exact format requested.
    """
    # Validate file
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file")

    temp_path = None
    try:
        # Read file bytes (we will use the same extraction pipeline)
        file_bytes = await file.read()

        # --- Use extraction pipeline (the exact functions above) ---
        # Note: we avoid re-uploading to supabase here to keep validation fast,
        # but we reuse the extraction functions exactly.
        extracted_text = extract_text_from_file(file.filename, file_bytes)
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No text content could be extracted from the file")

        # Use the AI extractor to get raw fields
        raw_extracted = extract_form_data_with_ai(extracted_text)  # returns flat dict of keys
        structured = construct_simple_json_structure(raw_extracted)  # nested form used below

        # Now run validation for the required 13 fields — fetch values from structured
        def get_value_for_label(label: str) -> str:
            # map labels to structured keys
            bi = structured.get("basic_information", {}) or {}
            pd = structured.get("project_details", {}) or {}
            # mapping
            mapping = {
                "Project Title": bi.get("project_title", "") or raw_extracted.get("project_title", ""),
                "Principal Investigator": bi.get("project_leader_name", "") or raw_extracted.get("project_leader_name", ""),
                "Organization": bi.get("sub_implementing_agency", "") or raw_extracted.get("sub_implementing_agency", "") or raw_extracted.get("principal_implementing_agency", ""),
                "Definition of the Issue": pd.get("definition_of_issue", "") or raw_extracted.get("definition_of_issue", ""),
                "Objectives": pd.get("objectives", "") or raw_extracted.get("objectives", ""),
                "Justification for Subject Area": pd.get("justification_subject_area", "") or raw_extracted.get("justification_subject_area", "") or raw_extracted.get("justification", ""),
                "Benefits to Coal Industry": pd.get("project_benefits", "") or raw_extracted.get("project_benefits", "") or raw_extracted.get("project_benefits", ""),
                "Work Plan": pd.get("work_plan", "") or raw_extracted.get("work_plan", ""),
                "Methodology": pd.get("methodology", "") or raw_extracted.get("methodology", ""),
                "Organization of Work Elements": pd.get("organization_of_work", "") or raw_extracted.get("organization_of_work", ""),
                "Time Schedule": pd.get("time_schedule", "") or raw_extracted.get("time_schedule", ""),
                "Deliverables": (raw_extracted.get("deliverables") or pd.get("deliverables", "")) if isinstance(raw_extracted, dict) else "",
                "Thrust Area": raw_extracted.get("thrust_area_claimed", "") or raw_extracted.get("thrust_area", "") or pd.get("thrust_area_claimed", "")
            }
            val = mapping.get(label, "")
            if val is None:
                return ""
            return val

        fields_output = []
        missing_columns = []
        failing_columns = []

        # Iterate through the 13 fields and validate using Gemini + guideline summary
        for label in VALIDATE_FIELDS:
            value = get_value_for_label(label) or ""
            summary = GUIDELINE_SUMMARIES.get(label, "")

            # Prepare LLM validation
            llm_result = None
            try:
                llm_result = call_gemini_for_validation(label, value, summary)
            except Exception as e:
                # catch gemini errors and fallback
                llm_result = {"validation_result": "not_following_guidelines", "reason": f"LLM error: {str(e)}"}

            # If LLM returned something missing or invalid, fallback deterministically
            if not llm_result or "validation_result" not in llm_result:
                fb = fallback_validator(label, value)
                llm_result = fb

            vr = llm_result.get("validation_result", "not_following_guidelines")
            reason = llm_result.get("reason", "")

            # Append to result fields
            fields_output.append({
                "field_name": label,
                "value": value or "",
                "validation_result": vr,
                "reason": reason
            })

            if vr == "not_filled":
                missing_columns.append(label)
            elif vr == "not_following_guidelines":
                failing_columns.append({"field": label, "reason": reason})

        overall = False if (missing_columns or failing_columns) else True

        final_result = {
            "overall_validation": overall,
            "columns_missing_value": missing_columns,
            "columns_not_following_guidelines": failing_columns,
            "fields": fields_output
        }

        return JSONResponse(status_code=200, content=final_result)

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")

# Create FastAPI app and include main router
app = FastAPI(title="FORM-I Extractor + Gemini Validator Service")
app.include_router(router)

# run with: python validation.py  OR uvicorn validation:app --reload --port 8001
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)
