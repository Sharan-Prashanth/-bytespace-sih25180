# cost_validation_agent.py
import os
import json
import uuid
import re
from datetime import datetime
from typing import Dict, Any, List, Tuple
import PyPDF2
import docx
import chardet
import google.generativeai as genai
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from supabase import create_client, Client
from io import BytesIO
from dotenv import load_dotenv
import traceback
from decimal import Decimal, ROUND_HALF_UP

load_dotenv()

router = APIRouter()

# --- Your existing environment & initialization (kept as-is) ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY4")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Missing SUPABASE_URL or SUPABASE_KEY in environment variables")

if not GEMINI_API_KEY:
    raise Exception("Missing GEMINI_API_KEY in environment variables")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Gemini AI
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash-lite")

# Storage buckets
UPLOAD_BUCKET = "Coal-research-files"
JSON_BUCKET = "proposal-json"

# -----------------------------
# === YOUR ORIGINAL EXTRACTION CODE (unchanged) ===
# I copied the exact functions you provided so extraction logic is preserved.
# (No edits)
# -----------------------------
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

@router.post("/extract-form1")
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

# -----------------------------
# === NEW: process-and-estimate endpoint (uses your extraction unchanged) ===
# -----------------------------

# Helper: parse numeric strings to lakhs (float)
def parse_cost_to_lakhs(raw: str) -> float:
    """
    Normalize extracted cost text into a float representing lakhs.
    Heuristics:
      - remove commas and currency symbols
      - if text contains 'lakh' or 'lakhs' -> use number directly
      - if number > 1000 -> probably value in rupees -> convert to lakhs (divide by 100000)
      - if number between 100 and 1000 -> ambiguous; assume rupees -> convert
      - empty or non-numeric -> 0.0
    Returns float (lakhs)
    """
    if raw is None:
        return 0.0
    if isinstance(raw, (int, float)):
        # assume value given already in lakhs
        return float(raw)
    s = str(raw).strip().lower()
    if s == "" or s in ["na", "n/a", "-", "--"]:
        return 0.0

    # detect lakh keyword
    if "lakh" in s:
        m = re.search(r"(\d+(?:\.\d+)?)", s.replace(",", ""))
        if m:
            return float(m.group(1))
    # otherwise extract first numeric token
    m = re.search(r"(\d+(?:\.\d+)?)", s.replace(",", ""))
    if not m:
        return 0.0
    num = float(m.group(1))
    # If implcit rupee-like large number, convert to lakhs
    # Heuristic thresholds:
    # - If number >= 1000 -> treat as INR and convert to lakhs (e.g., 560000 -> 5.6 L)
    # - If 100 <= number < 1000 -> likely rupees (e.g., 500 -> 0.005L?) <-- safer treat as rupees -> convert
    # - else treat number as lakhs directly
    if "rs" in s or "₹" in s or "inr" in s:
        # contains currency symbol -> assume rupees
        if num >= 1000:
            return num / 100000.0
        if num >= 100:
            return num / 100000.0
        # small rupee amounts -> convert too
        return num / 100000.0
    # no currency marker: use size heuristics
    if num >= 1000:
        return num / 100000.0
    if num >= 100:
        return num / 100000.0
    # otherwise treat as lakhs
    return float(num)

# Safely get cost field from extracted_data dict using keys and convert
def get_cost_field_as_lakhs(extracted: Dict[str, Any], key: str) -> float:
    val = extracted.get(key, "")
    return parse_cost_to_lakhs(val)

# Validation & scoring engine (rule-based)
def validate_and_score_from_extracted(extracted_json: Dict[str, Any]) -> Dict[str, Any]:
    """
    Accepts json_structure (constructed by your extraction code), normalizes numeric costs,
    applies S&T rules, returns flags, category_scores, final_score, changeable, reviewer_comment.
    """
    # gather numeric fields (in lakhs)
    cost = extracted_json.get("cost_breakdown", {})
    cap = cost.get("capital_expenditure", {})
    rev = cost.get("revenue_expenditure", {})
    tot = cost.get("total_project_cost", {})

    # raw keys used by your extractor mapping
    land_total = parse_cost_to_lakhs(cap.get("land_building", {}).get("total", ""))
    eq_total = parse_cost_to_lakhs(cap.get("equipment", {}).get("total", ""))
    sal_total = parse_cost_to_lakhs(rev.get("salaries", {}).get("total", ""))
    cons_total = parse_cost_to_lakhs(rev.get("consumables", {}).get("total", ""))
    travel_total = parse_cost_to_lakhs(rev.get("travel", {}).get("total", ""))
    workshop_total = parse_cost_to_lakhs(rev.get("workshop_seminar", {}).get("total", ""))
    grand_total = parse_cost_to_lakhs(tot.get("total", ""))
    fund_phasing = cost.get("fund_phasing", "") or extracted_json.get("project_details", {}).get("foreign_exchange_details", "")

    # category base points
    cats = {
        "financial_structure": Decimal("25"),
        "allowable_items": Decimal("20"),
        "ceiling_compliance": Decimal("20"),
        "equipment_fe_rules": Decimal("15"),
        "phasing_logic": Decimal("10"),
        "documentation": Decimal("10")
    }
    flags: List[Dict[str, Any]] = []

    # 1. Financial structure: compare declared grand_total vs sum of components
    computed_sum = Decimal(str(eq_total + sal_total + cons_total + travel_total + workshop_total + land_total))
    # contingency/overhead/taxes may be embedded in consumables or not extracted; we cannot always compute. So lenient tolerance.
    if grand_total == 0:
        cats["financial_structure"] -= Decimal("5")
        flags.append({"severity": "WARN", "rule": "grand_total_missing", "message": "Grand total not declared."})
    else:
        # allow tolerance 0.5L
        if abs(Decimal(str(grand_total)) - computed_sum) > Decimal("0.5"):
            cats["financial_structure"] -= Decimal("10")
            flags.append({"severity": "ERROR", "rule": "grand_total_mismatch", "message": f"Declared grand total {grand_total}L vs computed components {float(computed_sum)}L."})
    # year-wise presence check
    y1 = parse_cost_to_lakhs(tot.get("year1", ""))
    y2 = parse_cost_to_lakhs(tot.get("year2", ""))
    y3 = parse_cost_to_lakhs(tot.get("year3", ""))
    if (y1 == 0 and y2 == 0 and y3 == 0):
        cats["financial_structure"] -= Decimal("5")
        flags.append({"severity": "WARN", "rule": "year_wise_missing", "message": "Year-wise grand totals appear missing."})

    # 2. Allowable items
    # Land/building usually not funded — flag if >0
    if land_total > 0:
        cats["allowable_items"] -= Decimal("8")
        flags.append({"severity": "WARN", "rule": "land_building_not_normal", "message": "Land/Building requested — normally not funded; justification required."})
    # foreign travel / permanent staff detection - search text blocks
    # We'll inspect some free-text fields for keywords
    doc_text = " ".join([
    str(extracted_json.get("basic_information", {}).get("project_title", "")),
    str(extracted_json.get("project_details", {}).get("definition_of_issue", "")),
    str(extracted_json.get("project_details", {}).get("objectives", "")),
    str(extracted_json.get("additional_information", {}).get("cv_details", "")),
    ]).lower()

    if "permanent" in doc_text:
        cats["allowable_items"] -= Decimal("10")
        flags.append({"severity": "ERROR", "rule": "permanent_salary", "message": "Permanent staff salary mentioned — not allowed under S&T rules."})
    if "foreign travel" in doc_text or "abroad" in doc_text:
        cats["allowable_items"] -= Decimal("5")
        flags.append({"severity": "ERROR", "rule": "foreign_travel", "message": "Foreign travel listed — not allowed for Indian implementing agencies."})

    # 3. Ceiling compliance
    revenue_total = Decimal(str(sal_total + cons_total + travel_total + workshop_total))
    # contingency extracted rarely — try to find in raw_data if user had it:
    # look for 'contingency' key in additional text or raw_data
    # As we kept extraction code unchanged, contingency might be in project_details or raw_data; try to parse it from strings
    # For safety assume contingency 0 if not provided
    contingency_val = 0.0
    # allowed contingency = 5% of revenue
    allowed_cont = (revenue_total * Decimal("0.05")).quantize(Decimal("0.01"))
    if Decimal(str(contingency_val)) > allowed_cont:
        cats["ceiling_compliance"] -= Decimal("8")
        flags.append({"severity": "ERROR", "rule": "contingency_exceed", "message": f"Contingency exceeds 5% of revenue ({float(allowed_cont)}L)."})

    # travel cap
    if Decimal(str(travel_total)) > Decimal("3.0"):
        cats["ceiling_compliance"] -= Decimal("4")
        flags.append({"severity": "WARN", "rule": "travel_exceed", "message": f"Travel {travel_total}L exceeds ₹3.0L per institute; provide justification."})
    # workshop cap
    if Decimal(str(workshop_total)) > Decimal("0.5"):
        cats["ceiling_compliance"] -= Decimal("3")
        flags.append({"severity": "WARN", "rule": "workshop_exceed", "message": f"Workshops/Seminars exceed ₹0.5L per agency/year; verify justification."})

    # overhead rules — check if 'institutional_overhead' present in additional fields of extractor raw data
    # Since your extractor doesn't expose overhead separately, skip unless present; we'll not penalize further here.

    # 4. Equipment FE & high-value checks
    # Extract equipment justification and equipment cost from extracted_json
    equipment_just = cap.get("equipment", {}).get("justification", "")
    if eq_total > 50:
        cats["equipment_fe_rules"] -= Decimal("5")
        flags.append({"severity": "WARN", "rule": "equip_high_value", "message": f"Equipment cost {eq_total}L > ₹50L; vendor quotes required."})
    if eq_total > 0 and (equipment_just is None or str(equipment_just).strip() == ""):
        cats["equipment_fe_rules"] -= Decimal("3")
        flags.append({"severity": "WARN", "rule": "equipment_just_missing", "message": "Equipment justification missing."})

    # 5. Phasing logic: check fund_phasing sums to 100 if present
    pf = cost.get("fund_phasing", "") or ""
    phasing_ok = True
    if pf:
        nums = [Decimal(n) for n in re.findall(r"(\d+(?:\.\d+)?)", str(pf))]
        if nums and sum(nums) != Decimal("100"):
            phasing_ok = False
    else:
        cats["phasing_logic"] -= Decimal("3")
        flags.append({"severity": "WARN", "rule": "phasing_missing", "message": "Fund phasing details not provided."})
    if not phasing_ok:
        cats["phasing_logic"] -= Decimal("5")
        flags.append({"severity": "ERROR", "rule": "phasing_sum", "message": "Phasing percentages do not sum to 100%."})

    # 6. Documentation completeness
    fx_block = extracted_json.get("project_details", {}).get("foreign_exchange_details", "")
    if not fx_block:
        cats["documentation"] -= Decimal("3")
        flags.append({"severity": "WARN", "rule": "fe_details_missing", "message": "Foreign exchange currency or exchange rate missing."})
    # CV/past experience etc. — if empty, small penalty
    cv = extracted_json.get("additional_information", {}).get("cv_details", "")
    if not cv:
        cats["documentation"] -= Decimal("2")
        flags.append({"severity": "WARN", "rule": "cv_missing", "message": "CV / project proponent details missing."})

    # clamp categories >=0
    for k in cats:
        if cats[k] < 0:
            cats[k] = Decimal("0")

    final_score = sum(cats.values())
    if final_score < 0:
        final_score = Decimal("0")
    if final_score > 100:
        final_score = Decimal("100")

    changeable = int((Decimal("100") - final_score).quantize(Decimal("1"), rounding=ROUND_HALF_UP))

    score_summary = f"Score: {int(final_score)}; Changeable: {changeable}"
    summary = ("The proposal demonstrates partial compliance with MoC S&T financial \n"
               "guidelines. Several cost heads require clarification to ensure \n"
               "alignment with funding norms.")
    key_findings = [f["message"] for f in flags] if flags else ["No major financial or guideline violations detected."]
    recommended_actions = [
        "Correct the cost heads that exceed guideline ceilings.",
        "Provide vendor quotations for high-value equipment (>50 lakhs).",
        "Remove or justify any non-permissible items per S&T rules.",
        "Standardize phasing to 100% and align with milestones.",
        "Ensure FE component details include currency, amount, and exchange rate.",
        "Clarify contingency estimation basis."
    ]

    # convert category scores to serializable values
    category_out = {k: int(cats[k]) if cats[k] == cats[k].to_integral_value() else float(cats[k]) for k in cats}

    return {
        "flags": flags,
        "category_scores": category_out,
        "final_score": int(final_score),
        "changeable": changeable,
        "reviewer_comment": {
            "score_summary": score_summary,
            "summary": summary,
            "key_findings": key_findings,
            "recommended_actions": recommended_actions
        }
    }

# New endpoint
@router.post("/process-and-estimate")
async def process_and_estimate(file: UploadFile = File(...)):
    """
    New agent endpoint. Uses your existing extraction functions unchanged, normalizes numeric costs,
    validates against S&T guidelines, returns extracted_json + reviewer_comment + flags + scores.
    """
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        ext = file.filename.lower().split(".")[-1]
        if ext not in ["pdf", "docx", "txt"]:
            raise HTTPException(status_code=400, detail="Unsupported file format. Only PDF, DOCX, and TXT files are allowed.")

        file_bytes = await file.read()

        # store original file to Supabase
        unique_filename = f"{uuid.uuid4()}.{ext}"
        try:
            supabase.storage.from_(UPLOAD_BUCKET).upload(unique_filename, file_bytes, {"content-type": file.content_type})
            file_url_obj = supabase.storage.from_(UPLOAD_BUCKET).get_public_url(unique_filename)
            # supabase client may return dict with public_url or publicUrl
            public_url = file_url_obj.get("publicUrl") if isinstance(file_url_obj, dict) and file_url_obj.get("publicUrl") else (file_url_obj.get("public_url") if isinstance(file_url_obj, dict) else file_url_obj)
        except Exception:
            public_url = None

        # Extract text & structured fields using your extraction code (unchanged)
        extracted_text = extract_text_from_file(file.filename, file_bytes)
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No text content could be extracted from the file")

        # Use original AI extraction function (unchanged)
        raw_extracted = extract_form_data_with_ai(extracted_text)
        # Build the json structure unchanged (keeps your formatting)
        extracted_json = construct_simple_json_structure(raw_extracted)

        # Normalize numeric costs (the user required A: normalize to numeric floats)
        # We'll replace strings with numeric floats (in lakhs) inside extracted_json copy for validation
        normalized_json = json.loads(json.dumps(extracted_json))  # deep copy

        # For every cost field mapping, convert
        def set_if_present(path: List[str], value):
            cur = normalized_json
            for k in path[:-1]:
                cur = cur.get(k, {})
            cur[path[-1]] = value

        # mapping: path list -> key in raw_extracted
        mapping = [
            (["cost_breakdown", "capital_expenditure", "land_building", "total"], raw_extracted.get("land_building_cost_total", "")),
            (["cost_breakdown", "capital_expenditure", "land_building", "year1"], raw_extracted.get("land_building_cost_year1", "")),
            (["cost_breakdown", "capital_expenditure", "land_building", "year2"], raw_extracted.get("land_building_cost_year2", "")),
            (["cost_breakdown", "capital_expenditure", "land_building", "year3"], raw_extracted.get("land_building_cost_year3", "")),

            (["cost_breakdown", "capital_expenditure", "equipment", "total"], raw_extracted.get("equipment_cost_total", "")),
            (["cost_breakdown", "capital_expenditure", "equipment", "year1"], raw_extracted.get("equipment_cost_year1", "")),
            (["cost_breakdown", "capital_expenditure", "equipment", "year2"], raw_extracted.get("equipment_cost_year2", "")),
            (["cost_breakdown", "capital_expenditure", "equipment", "year3"], raw_extracted.get("equipment_cost_year3", "")),

            (["cost_breakdown", "revenue_expenditure", "salaries", "total"], raw_extracted.get("salaries_cost_total", "")),
            (["cost_breakdown", "revenue_expenditure", "salaries", "year1"], raw_extracted.get("salaries_cost_year1", "")),
            (["cost_breakdown", "revenue_expenditure", "salaries", "year2"], raw_extracted.get("salaries_cost_year2", "")),
            (["cost_breakdown", "revenue_expenditure", "salaries", "year3"], raw_extracted.get("salaries_cost_year3", "")),

            (["cost_breakdown", "revenue_expenditure", "consumables", "total"], raw_extracted.get("consumables_cost_total", "")),
            (["cost_breakdown", "revenue_expenditure", "consumables", "year1"], raw_extracted.get("consumables_cost_year1", "")),
            (["cost_breakdown", "revenue_expenditure", "consumables", "year2"], raw_extracted.get("consumables_cost_year2", "")),
            (["cost_breakdown", "revenue_expenditure", "consumables", "year3"], raw_extracted.get("consumables_cost_year3", "")),

            (["cost_breakdown", "revenue_expenditure", "travel", "total"], raw_extracted.get("travel_cost_total", "")),
            (["cost_breakdown", "revenue_expenditure", "travel", "year1"], raw_extracted.get("travel_cost_year1", "")),
            (["cost_breakdown", "revenue_expenditure", "travel", "year2"], raw_extracted.get("travel_cost_year2", "")),
            (["cost_breakdown", "revenue_expenditure", "travel", "year3"], raw_extracted.get("travel_cost_year3", "")),

            (["cost_breakdown", "revenue_expenditure", "workshop_seminar", "total"], raw_extracted.get("workshop_cost_total", "")),
            (["cost_breakdown", "revenue_expenditure", "workshop_seminar", "year1"], raw_extracted.get("workshop_cost_year1", "")),
            (["cost_breakdown", "revenue_expenditure", "workshop_seminar", "year2"], raw_extracted.get("workshop_cost_year2", "")),
            (["cost_breakdown", "revenue_expenditure", "workshop_seminar", "year3"], raw_extracted.get("workshop_cost_year3", "")),

            (["cost_breakdown", "total_project_cost", "total"], raw_extracted.get("total_cost_total", "")),
            (["cost_breakdown", "total_project_cost", "year1"], raw_extracted.get("total_cost_year1", "")),
            (["cost_breakdown", "total_project_cost", "year2"], raw_extracted.get("total_cost_year2", "")),
            (["cost_breakdown", "total_project_cost", "year3"], raw_extracted.get("total_cost_year3", "")),

            (["cost_breakdown", "fund_phasing"], raw_extracted.get("fund_phasing", "")),
        ]

        # Apply normalization to normalized_json
        for path, rawval in mapping:
            if path[-1] == "fund_phasing":
                # keep as string
                set_if_present(path, rawval or "")
            else:
                num = parse_cost_to_lakhs(rawval)
                set_if_present(path, num if num is not None else 0.0)

        # Keep equipment justification and other texts from your earlier json structure
        # If any numeric fields remain empty strings, convert to 0.0
        def normalize_all_numbers(d):
            if isinstance(d, dict):
                for k, v in d.items():
                    if isinstance(v, dict):
                        normalize_all_numbers(v)
                    else:
                        # if value looks numeric string, convert
                        if isinstance(v, str):
                            if re.search(r"\d", v):
                                # convert and set as float
                                try:
                                    d[k] = parse_cost_to_lakhs(v)
                                except Exception:
                                    d[k] = v
                            elif v.strip() == "":
                                # keep as empty string for textual fields, for cost leaves already set
                                d[k] = v
                        # leave numbers as-is
            return d

        normalized_json = normalize_all_numbers(normalized_json)

        # Run validation engine based on normalized_json
        validation = validate_and_score_from_extracted(normalized_json)

        # store normalized artifact in supabase JSON bucket
        norm_filename = f"{uuid.uuid4()}_normalized.json"
        try:
            supabase.storage.from_(JSON_BUCKET).upload(norm_filename, json.dumps({
                "raw_extracted": raw_extracted,
                "normalized_json": normalized_json,
                "validation": validation,
                "extracted_at": datetime.utcnow().isoformat()
            }, default=str).encode("utf-8"), {"content-type": "application/json"})
            pub = supabase.storage.from_(JSON_BUCKET).get_public_url(norm_filename)
            normalized_json_url = pub.get("publicUrl") if isinstance(pub, dict) and pub.get("publicUrl") else (pub.get("public_url") if isinstance(pub, dict) else pub)
        except Exception:
            normalized_json_url = None

        # insert summary record into proposals table (non-blocking safe handling)
        db_info = {"success": False}
        try:
            rec = {
                "id": str(uuid.uuid4()),
                "project_title": (normalized_json.get("basic_information", {}).get("project_title") or "")[:500],
                "filename": file.filename,
                "stored_filename": unique_filename,
                "file_url": public_url,
                "normalized_json": json.dumps(normalized_json, default=str),
                "validation_json": json.dumps(validation, default=str),
                "score": validation.get("final_score"),
                "changeable": validation.get("changeable"),
                "extraction_date": datetime.utcnow().isoformat()
            }
            db_resp = supabase.table("proposals").insert(rec).execute()
            # safety: don't try to return raw APIResponse objects
            if hasattr(db_resp, "data") and db_resp.data:
                db_info = {"success": True, "response": db_resp.data[0]}
            else:
                db_info = {"success": False, "response": str(db_resp)}
        except Exception as e:
            db_info = {"success": False, "error": str(e)}

        # Final response shape
        response = {
            "success": True,
            "endpoint": "/process-and-estimate",
            "extracted_json": normalized_json,
            "reviewer_comment": validation.get("reviewer_comment", {}),
            "validation_flags": validation.get("flags", []),
            "category_scores": validation.get("category_scores", {}),
            "file_info": {
                "original_filename": file.filename,
                "stored_filename": unique_filename,
                "file_url": public_url,
                "normalized_json_url": normalized_json_url
            },
            "database_info": db_info
        }

        return JSONResponse(content=response)

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing FORM-I proposal: {str(e)}")
