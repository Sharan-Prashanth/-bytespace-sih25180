from fastapi import FastAPI, UploadFile, File, HTTPException
import httpx

app = FastAPI()

# INTERNAL endpoints to forward the PDF to
INTERNAL_ENDPOINTS = [
    "/detect-ai-and-validate",
    "/process-and-estimate",
    "/deliverable-check",
    "/analyze-novelty",
    "/technical-feasibility",
    "/benefit-check"
]

BASE_URL = "http://localhost:8000"   # Change if your internal services run elsewhere


@app.post("/full-analysis")
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

    return {
        "filename": pdf.filename,
        "results": results
    }
