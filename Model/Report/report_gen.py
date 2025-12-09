from fastapi import FastAPI, UploadFile, File, HTTPException,APIRouter
from fastapi.responses import JSONResponse
import httpx
import os
import json
import time
import uuid
import hashlib
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

router = APIRouter()

# INTERNAL endpoints to forward the PDF to
INTERNAL_ENDPOINTS = [
    "/detect-ai-and-validate",
    "/process-and-estimate",
    "/deliverable-check",
    "/analyze-novelty",
    "/technical_feasibility",
    "/benefit-check",
    "/swot-agent"
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

print(f"[CONFIG] SUPABASE_URL: {SUPABASE_URL}")
print(f"[CONFIG] SUPABASE_KEY: {'*' * 10 if SUPABASE_KEY else 'Not set'}")
print(f"[CONFIG] SUPABASE_BUCKET: {SUPABASE_BUCKET}")

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("[CONFIG] Supabase client created successfully")
    except Exception as e:
        print(f"[CONFIG] Warning: could not create supabase client: {e}")


def compute_file_hash(file_bytes: bytes) -> str:
    """Compute SHA256 hash of file content for caching."""
    return hashlib.sha256(file_bytes).hexdigest()


def check_cached_analysis(file_hash: str):
    """Check if analysis exists in Supabase bucket for this file hash."""
    if not supabase:
        return None
    try:
        cache_filename = f"{file_hash}.json"
        print(f"[CACHE] Checking for cached analysis: {cache_filename}")
        
        # Try to download the cached result from bucket
        data = supabase.storage.from_(SUPABASE_BUCKET).download(cache_filename)
        if data:
            # Convert bytes to string and parse JSON
            if isinstance(data, bytes):
                cached_data = json.loads(data.decode('utf-8'))
            else:
                cached_data = json.loads(data)
            print(f"[CACHE] Found cached analysis")
            return cached_data
    except Exception as e:
        print(f"[CACHE] No cached analysis found or error: {e}")
    return None


def store_analysis_result(file_hash: str, filename: str, analysis_data: dict):
    """Store analysis result in Supabase bucket."""
    if not supabase:
        print("[CACHE] Supabase not configured, skipping cache storage")
        return False
    try:
        cache_filename = f"{file_hash}.json"
        
        # Add metadata to cached data
        cached_result = {
            "file_hash": file_hash,
            "filename": filename,
            "cached_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "analysis_data": analysis_data
        }
        
        json_bytes = json.dumps(cached_result, indent=2).encode("utf-8")
        
        print(f"[CACHE] Storing analysis in cache: {cache_filename}")
        print(f"[CACHE] Data size: {len(json_bytes)} bytes")
        
        # Try to remove existing file first (to handle updates)
        try:
            supabase.storage.from_(SUPABASE_BUCKET).remove([cache_filename])
            print(f"[CACHE] Removed existing cache file")
        except Exception:
            # File doesn't exist, that's fine
            pass
        
        # Upload the new file
        result = supabase.storage.from_(SUPABASE_BUCKET).upload(
            cache_filename,
            json_bytes,
            file_options={"content-type": "application/json"}
        )
        
        print(f"[CACHE] Upload result: {result}")
        print(f"[CACHE] Successfully cached analysis")
        return True
    except Exception as e:
        print(f"[CACHE] Failed to store cache: {e}")
        return False

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
        cached_data = cached_result.get("analysis_data", cached_result)
        cached_data["cached"] = True
        cached_data["cached_at"] = cached_result.get("cached_at")
        cached_data["file_hash"] = file_hash
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

                print(f"[ANALYSIS] Calling {endpoint}...")
                response = await client.post(
                    BASE_URL + endpoint,
                    files={field_name: (pdf.filename, pdf_bytes, "application/pdf")}
                )
                
                # Check if response is successful
                if response.status_code == 200:
                    try:
                        response_data = response.json()
                        results.append({
                            "endpoint": endpoint,
                            "output": response_data,
                            "status": "success"
                        })
                        print(f"[ANALYSIS] {endpoint} completed successfully")
                    except Exception as json_error:
                        results.append({
                            "endpoint": endpoint,
                            "error": f"Invalid JSON response: {str(json_error)}",
                            "status": "error"
                        })
                else:
                    # Non-200 response
                    results.append({
                        "endpoint": endpoint,
                        "error": f"HTTP {response.status_code}: {response.text[:200]}",
                        "status": "error"
                    })
                    print(f"[ANALYSIS] {endpoint} failed with status {response.status_code}")
                    
            except httpx.TimeoutException:
                results.append({
                    "endpoint": endpoint,
                    "error": "Request timeout (300s limit exceeded)",
                    "status": "timeout"
                })
                print(f"[ANALYSIS] {endpoint} timed out")
            except Exception as e:
                results.append({
                    "endpoint": endpoint,
                    "error": str(e),
                    "status": "error"
                })
                print(f"[ANALYSIS] {endpoint} error: {e}")

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
    
    # Store analysis result in Supabase bucket for future retrieval
    if supabase:
        print(f"[CACHE] Attempting to store analysis in Supabase")
        cache_stored = store_analysis_result(file_hash, pdf.filename, response_data)
        response_data["stored_in_cache"] = cache_stored
        if cache_stored:
            print(f"[CACHE] Analysis successfully stored in cache bucket")
        else:
            print(f"[CACHE] Failed to store analysis in cache")
    else:
        print(f"[CACHE] Supabase not configured - skipping cache storage")
        response_data["stored_in_cache"] = False
    
    return latest_analysis_result
