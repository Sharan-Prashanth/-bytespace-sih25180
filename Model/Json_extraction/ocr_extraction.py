import os
import json
import uuid
import re
from datetime import datetime
from typing import Dict, Any, List
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

load_dotenv()

router = APIRouter()

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

# Initialize Gemini AI
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

@router.get("/proposal/{proposal_id}")
async def get_proposal_by_id(proposal_id: str):
    """Retrieve a specific proposal by ID from Supabase."""
    try:
        response = supabase.table("proposals").select("*").eq("id", proposal_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        return JSONResponse(content={
            "success": True,
            "proposal": response.data[0]
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving proposal: {str(e)}")

@router.get("/proposals/list")
async def list_all_proposals():
    """List all proposals from Supabase."""
    try:
        response = supabase.table("proposals").select("*").order("extraction_date", desc=True).execute()
        
        return JSONResponse(content={
            "success": True,
            "proposals": response.data,
            "count": len(response.data)
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing proposals: {str(e)}")

@router.delete("/proposal/{proposal_id}")
async def delete_proposal(proposal_id: str):
    """Delete a proposal from Supabase."""
    try:
        response = supabase.table("proposals").delete().eq("id", proposal_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        return JSONResponse(content={
            "success": True,
            "message": "Proposal deleted successfully"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting proposal: {str(e)}")
