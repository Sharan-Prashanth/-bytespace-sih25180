from fastapi import FastAPI, UploadFile, File, HTTPException,APIRouter
from fastapi.responses import JSONResponse
import httpx
import os
import json
import time
import uuid
from supabase import create_client, Client

router = APIRouter()

# INTERNAL endpoints to forward the PDF to
INTERNAL_ENDPOINTS = [
    "/detect-ai-and-validate",
    "/process-and-estimate",
    "/deliverable-check",
    "/analyze-novelty",
    "/technical_feasibility",
    "/benefit-check"
    ,"/swot-agent"
]

BASE_URL = "http://localhost:8000"   # Change if your internal services run elsewhere

# Store latest analysis result for GET endpoint (auto-render on frontend)
latest_analysis_result = {"status": "waiting", "message": "No analysis has been performed yet"}

# Supabase upload config (optional)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_BUCKET = os.getenv("FULL_ANALYSIS_BUCKET", "full-analysis")
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Warning: could not create supabase client: {e}")

@router.get("/full-analysis/latest")
async def get_latest_analysis_result():
    """
    GET endpoint to retrieve the latest full analysis result.
    Frontend can poll this endpoint and auto-render when status 200 is returned with data.
    """
    if latest_analysis_result.get("status") == "waiting":
        return JSONResponse(status_code=202, content=latest_analysis_result)
    return JSONResponse(status_code=200, content=latest_analysis_result)


@router.post("/full-analysis")
async def full_analysis(pdf: UploadFile = File(...)):
    # Validate file type
    if pdf.content_type not in ["application/pdf"]:
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    # Read PDF content as bytes
    pdf_bytes = await pdf.read()

    results = []

    async with httpx.AsyncClient() as client:
        for endpoint in INTERNAL_ENDPOINTS:
            try:
                # Some internal endpoints expect different form field names.
                field_name = "file"
                if endpoint == "/swot-agent":
                    field_name = "form1_pdf"

                response = await client.post(
                    BASE_URL + endpoint,
                    files={field_name: (pdf.filename, pdf_bytes, "application/pdf")}
                )
                response.raise_for_status()
                results.append({
                    "endpoint": endpoint,
                    "output": response.json()
                })
            except Exception as e:
                results.append({
                    "endpoint": endpoint,
                    "error": str(e)
                })

    response_data = {
        "filename": pdf.filename,
        "results": results
    }
    
    # Store latest result for GET endpoint (auto-render on frontend)
    global latest_analysis_result
    latest_analysis_result = response_data
    # Try uploading the JSON result to Supabase storage (best-effort)
    if supabase:
        try:
            obj_name = f"{os.path.splitext(pdf.filename)[0]}_full-analysis_{int(time.time())}.json"
            payload = json.dumps(response_data, ensure_ascii=False, indent=None).encode("utf-8")
            supabase.storage.from_(SUPABASE_BUCKET).upload(obj_name, payload, {"content-type": "application/json"})
            public = supabase.storage.from_(SUPABASE_BUCKET).get_public_url(obj_name)
            # Attach public URL to the stored latest result
            latest_analysis_result = {
                **latest_analysis_result,
                "uploaded_url": public,
                "uploaded_object": obj_name
            }
        except Exception as e:
            print(f"Supabase upload failed: {e}")

    return latest_analysis_result
