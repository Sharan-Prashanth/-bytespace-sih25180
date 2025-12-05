from fastapi import FastAPI, UploadFile, File, HTTPException,APIRouter
from fastapi.responses import JSONResponse
import httpx

router = APIRouter()

# INTERNAL endpoints to forward the PDF to
INTERNAL_ENDPOINTS = [
    "/detect-ai-and-validate",
    "/process-and-estimate",
    "/deliverable-check",
    "/analyze-novelty",
    "/technical_feasibility",
    "/benefit-check"
]

BASE_URL = "http://localhost:8000"   # Change if your internal services run elsewhere

# Store latest analysis result for GET endpoint (auto-render on frontend)
latest_analysis_result = {"status": "waiting", "message": "No analysis has been performed yet"}

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
                response = await client.post(
                    BASE_URL + endpoint,
                    files={"file": (pdf.filename, pdf_bytes, "application/pdf")}
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
    
    return response_data
