from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import PyPDF2
import os

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PDF_MAPPING = {
    "thrust": os.path.join(BASE_DIR, "data_files", "Thrust_Areas_2020.pdf"),
    "guidelines": os.path.join(BASE_DIR, "data_files", "Thrust_Areas_2020.pdf"),
}

class FetchTextRequest(BaseModel):
    source: str
    page: int

@router.post("/fetch-source-text")
async def fetch_source_text(request: FetchTextRequest):
    try:
        pdf_path = PDF_MAPPING.get(request.source)
        
        print(f"Fetching source: {request.source}, page: {request.page}")
        print(f"PDF path: {pdf_path}")
        print(f"File exists: {os.path.exists(pdf_path) if pdf_path else False}")
        
        if not pdf_path or not os.path.exists(pdf_path):
            return {"text": f"Source document '{request.source}' not found at {pdf_path}"}
        
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            total_pages = len(reader.pages)
            
            print(f"Total pages in PDF: {total_pages}")
            
            if request.page < 1 or request.page > total_pages:
                return {"text": f"Page {request.page} not found in document (total pages: {total_pages})"}
            
            page_text = reader.pages[request.page - 1].extract_text()
            
            print(f"Extracted text length: {len(page_text)}")
            
            return {"text": page_text}
    
    except Exception as e:
        print(f"Error in fetch_source_text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))
