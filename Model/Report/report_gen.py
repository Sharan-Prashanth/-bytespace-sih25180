from fastapi import FastAPI, UploadFile, File, HTTPException,APIRouter
from fastapi.responses import JSONResponse
import httpx
import os
import json
import time
import uuid
import hashlib
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
SUPABASE_TABLE = "full_analysis_cache"  # Table to store analysis results
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Warning: could not create supabase client: {e}")


def compute_file_hash(file_bytes: bytes) -> str:
    """Compute SHA256 hash of file content for caching."""
    return hashlib.sha256(file_bytes).hexdigest()


def check_cached_analysis(file_hash: str):
    """Check if analysis exists in Supabase for this file hash."""
    if not supabase:
        return None
    try:
        response = supabase.table(SUPABASE_TABLE).select("*").eq("file_hash", file_hash).order("created_at", desc=True).limit(1).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
    except Exception as e:
        print(f"Error checking cache: {e}")
    return None


def store_analysis_result(file_hash: str, filename: str, analysis_data: dict):
    """Store analysis result in Supabase table."""
    if not supabase:
        return None
    try:
        record = {
            "file_hash": file_hash,
            "filename": filename,
            "analysis_result": analysis_data,
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        response = supabase.table(SUPABASE_TABLE).insert(record).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"Error storing analysis: {e}")
        return None

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
    global latest_analysis_result
    
    # Validate file type
    if pdf.content_type not in ["application/pdf"]:
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    # Read PDF content as bytes
    pdf_bytes = await pdf.read()
    
    # Compute file hash for caching
    file_hash = compute_file_hash(pdf_bytes)
    
    # Check if analysis already exists for this file
    cached_result = check_cached_analysis(file_hash)
    if cached_result:
        print(f"Found cached analysis for file: {pdf.filename} (hash: {file_hash[:16]}...)")
        # Update latest result for GET endpoint
        cached_data = cached_result.get("analysis_result", {})
        cached_data["cached"] = True
        cached_data["cached_at"] = cached_result.get("created_at")
        cached_data["cache_note"] = "This analysis was retrieved from cache (file previously analyzed)"
        latest_analysis_result = cached_data
        return JSONResponse(status_code=200, content=cached_data)

    # File not in cache, perform full analysis
    print(f"No cache found. Performing full analysis for: {pdf.filename}")
    
    results = []

    async with httpx.AsyncClient(timeout=300.0) as client:
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
        "file_hash": file_hash,
        "results": results,
        "cached": False,
        "processed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    # Include Supabase project URL and bucket in the response (may be None)
    response_data["supabase_url"] = SUPABASE_URL
    response_data["supabase_bucket"] = SUPABASE_BUCKET
    
    # Store latest result for GET endpoint (auto-render on frontend)
    latest_analysis_result = response_data
    
    # Store analysis result in Supabase table for future retrieval
    if supabase:
        try:
            stored_record = store_analysis_result(file_hash, pdf.filename, response_data)
            if stored_record:
                response_data["stored_in_db"] = True
                response_data["db_record_id"] = stored_record.get("id")
                print(f"Analysis stored in database with ID: {stored_record.get('id')}")
        except Exception as e:
            print(f"Failed to store analysis in database: {e}")
            response_data["stored_in_db"] = False
    
    # Try uploading the JSON result to Supabase storage (best-effort)
    if supabase:
        try:
            obj_name = f"{os.path.splitext(pdf.filename)[0]}_full-analysis_{int(time.time())}.json"
            payload = json.dumps(response_data, ensure_ascii=False, indent=None).encode("utf-8")
            supabase.storage.from_(SUPABASE_BUCKET).upload(obj_name, payload, {"content-type": "application/json"})
            public = supabase.storage.from_(SUPABASE_BUCKET).get_public_url(obj_name)
            # Normalize public URL (client may return a dict)
            public_url = None
            if isinstance(public, str):
                public_url = public
            elif isinstance(public, dict):
                for k in ("publicUrl", "public_url", "url", "publicURL"):
                    if k in public and isinstance(public[k], str):
                        public_url = public[k]
                        break
                if not public_url:
                    try:
                        public_url = str(public.get("publicUrl") or public.get("url") or next(iter(public.values())))
                    except Exception:
                        public_url = str(public)
            else:
                public_url = str(public)

            # Attach public URL and Supabase info to both the immediate response and stored latest result
            response_data["uploaded_url"] = public_url
            response_data["uploaded_object"] = obj_name

            latest_analysis_result = {
                **latest_analysis_result,
                "uploaded_url": public_url,
                "uploaded_object": obj_name,
                "supabase_url": SUPABASE_URL,
                "supabase_bucket": SUPABASE_BUCKET,
            }
        except Exception as e:
            print(f"Supabase upload failed: {e}")
            response_data.setdefault("uploaded_url", None)
            response_data.setdefault("uploaded_object", None)

    return latest_analysis_result
