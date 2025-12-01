"""
PDF to OCR Converter

Converts non-OCR (scanned) PDFs into searchable OCR PDFs with embedded text layer.
Supports both PDF and image inputs.
"""

import os
import io
from typing import Optional, Tuple, List
from pathlib import Path

import PyPDF2
from PIL import Image
import numpy as np
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse

try:
    from pdf2image import convert_from_bytes, convert_from_path
except ImportError:
    convert_from_bytes = None
    convert_from_path = None

try:
    from paddleocr import PaddleOCR
    _paddle_ocr = None
except ImportError:
    PaddleOCR = None
    _paddle_ocr = None


router = APIRouter(prefix="/non-ocr", tags=["Non-OCR Converter"])


# ============================================================================
# OCR ENGINE INITIALIZATION
# ============================================================================

def get_paddle_ocr():
    """Lazy initialize PaddleOCR to save memory."""
    global _paddle_ocr
    if _paddle_ocr is None and PaddleOCR is not None:
        try:
            _paddle_ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
            print("✓ PaddleOCR initialized successfully")
        except Exception as e:
            print(f"✗ Failed to initialize PaddleOCR: {e}")
            _paddle_ocr = False
    return _paddle_ocr if _paddle_ocr is not False else None


# ============================================================================
# PDF DETECTION
# ============================================================================

def is_pdf_ocr(file_bytes: bytes, threshold: int = 50) -> Tuple[bool, str]:
    """
    Check if a PDF has OCR (embedded text).
    
    Args:
        file_bytes: PDF file content as bytes
        threshold: Minimum character count to consider PDF as OCR-enabled
    
    Returns:
        Tuple of (is_ocr, extracted_text)
    """
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        
        for page in reader.pages:
            page_text = page.extract_text() or ""
            text += page_text
        
        is_ocr = len(text.strip()) >= threshold
        
        return is_ocr, text
    
    except Exception as e:
        print(f"Error checking PDF OCR status: {e}")
        return False, ""


# ============================================================================
# OCR PROCESSING
# ============================================================================

def run_ocr_on_image(image: Image.Image) -> List[dict]:
    """
    Run OCR on a PIL Image and return structured results with bounding boxes.
    
    Args:
        image: PIL Image object
    
    Returns:
        List of OCR results with text and coordinates
    """
    ocr = get_paddle_ocr()
    if ocr is None:
        raise RuntimeError(
            "PaddleOCR is not available. "
            "Install with: pip install paddlepaddle paddleocr"
        )
    
    # Convert PIL Image to numpy array
    img_array = np.array(image)
    
    # Run OCR with detailed results
    result = ocr.ocr(img_array, cls=True)
    
    # Parse results
    ocr_results = []
    if result and result[0]:
        for line in result[0]:
            if line and len(line) >= 2:
                # line[0] contains bounding box coordinates
                # line[1] contains (text, confidence)
                bbox = line[0]
                text_info = line[1]
                
                ocr_results.append({
                    'text': text_info[0],
                    'confidence': text_info[1],
                    'bbox': bbox
                })
    
    return ocr_results


def extract_text_from_ocr_results(ocr_results: List[dict]) -> str:
    """Extract plain text from OCR results."""
    return "\n".join([r['text'] for r in ocr_results if r['text'].strip()])


# ============================================================================
# PDF CREATION WITH OCR LAYER
# ============================================================================

def create_searchable_pdf(image: Image.Image, ocr_results: List[dict]) -> bytes:
    """
    Create a searchable PDF with image background and invisible text layer.
    
    Args:
        image: PIL Image of the page
        ocr_results: OCR results with text and bounding boxes
    
    Returns:
        PDF bytes
    """
    # Create a buffer for the PDF
    buffer = io.BytesIO()
    
    # Get image dimensions
    img_width, img_height = image.size
    
    # Create PDF with image size
    pdf = canvas.Canvas(buffer, pagesize=(img_width, img_height))
    
    # Draw the image as background
    img_reader = ImageReader(image)
    pdf.drawImage(img_reader, 0, 0, width=img_width, height=img_height)
    
    # Add invisible text layer
    pdf.setFillColorRGB(0, 0, 0, alpha=0)  # Invisible text
    
    for result in ocr_results:
        text = result['text']
        bbox = result['bbox']
        
        # Calculate position (PDF coordinates start from bottom-left)
        # bbox format: [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
        x = min([p[0] for p in bbox])
        y = img_height - max([p[1] for p in bbox])  # Flip Y coordinate
        
        # Calculate text size based on bounding box
        bbox_width = max([p[0] for p in bbox]) - min([p[0] for p in bbox])
        bbox_height = max([p[1] for p in bbox]) - min([p[1] for p in bbox])
        
        # Estimate font size
        font_size = max(8, min(bbox_height * 0.8, 72))
        
        pdf.setFont("Helvetica", font_size)
        pdf.drawString(x, y, text)
    
    # Finalize the PDF
    pdf.save()
    
    # Get PDF bytes
    buffer.seek(0)
    return buffer.read()


def merge_pdf_pages(pdf_pages: List[bytes]) -> bytes:
    """
    Merge multiple PDF pages into a single PDF.
    
    Args:
        pdf_pages: List of PDF bytes for each page
    
    Returns:
        Merged PDF bytes
    """
    merger = PyPDF2.PdfMerger()
    
    for page_bytes in pdf_pages:
        page_buffer = io.BytesIO(page_bytes)
        merger.append(page_buffer)
    
    # Write merged PDF to buffer
    output_buffer = io.BytesIO()
    merger.write(output_buffer)
    merger.close()
    
    output_buffer.seek(0)
    return output_buffer.read()


# ============================================================================
# MAIN CONVERSION FUNCTION
# ============================================================================

def convert_pdf_to_ocr(
    file_bytes: bytes,
    dpi: int = 300,
    progress_callback=None
) -> Tuple[bytes, dict]:
    """
    Convert a non-OCR PDF to a searchable OCR PDF.
    
    Args:
        file_bytes: Input PDF as bytes
        dpi: Resolution for PDF to image conversion
        progress_callback: Optional callback function for progress updates
    
    Returns:
        Tuple of (ocr_pdf_bytes, metadata)
    """
    if convert_from_bytes is None:
        raise RuntimeError(
            "pdf2image is not installed. "
            "Install with: pip install pdf2image"
        )
    
    # Check if PDF already has OCR
    is_ocr, existing_text = is_pdf_ocr(file_bytes)
    if is_ocr:
        print("⚠️  PDF already has OCR text. Returning original.")
        return file_bytes, {
            'status': 'already_ocr',
            'pages_processed': 0,
            'text_length': len(existing_text)
        }
    
    print(f"🔄 Converting non-OCR PDF to searchable PDF (DPI: {dpi})...")
    
    # Convert PDF to images
    images = convert_from_bytes(file_bytes, dpi=dpi)
    total_pages = len(images)
    
    print(f"📄 Processing {total_pages} pages...")
    
    # Process each page
    pdf_pages = []
    all_text = []
    
    for i, image in enumerate(images, 1):
        if progress_callback:
            progress_callback(i, total_pages)
        
        print(f"  Page {i}/{total_pages}: Running OCR...")
        
        # Run OCR
        ocr_results = run_ocr_on_image(image)
        
        # Extract text
        page_text = extract_text_from_ocr_results(ocr_results)
        all_text.append(page_text)
        
        print(f"  Page {i}/{total_pages}: Creating searchable PDF...")
        
        # Create searchable PDF page
        page_pdf = create_searchable_pdf(image, ocr_results)
        pdf_pages.append(page_pdf)
        
        print(f"  ✓ Page {i}/{total_pages} complete")
    
    # Merge all pages
    print("📑 Merging pages...")
    final_pdf = merge_pdf_pages(pdf_pages)
    
    metadata = {
        'status': 'success',
        'pages_processed': total_pages,
        'text_length': len("\n\n".join(all_text)),
        'dpi': dpi
    }
    
    print("✓ Conversion complete!")
    
    return final_pdf, metadata


def process_image_to_ocr_pdf(
    image_bytes: bytes,
    filename: str
) -> Tuple[bytes, dict]:
    """
    Convert an image (PNG, JPG, etc.) to a searchable OCR PDF.
    
    Args:
        image_bytes: Input image as bytes
        filename: Original filename for extension detection
    
    Returns:
        Tuple of (ocr_pdf_bytes, metadata)
    """
    print(f"🖼️  Converting image to searchable PDF: {filename}")
    
    # Open image
    image = Image.open(io.BytesIO(image_bytes))
    
    # Run OCR
    print("  Running OCR...")
    ocr_results = run_ocr_on_image(image)
    
    # Create searchable PDF
    print("  Creating searchable PDF...")
    pdf_bytes = create_searchable_pdf(image, ocr_results)
    
    # Extract text
    text = extract_text_from_ocr_results(ocr_results)
    
    metadata = {
        'status': 'success',
        'pages_processed': 1,
        'text_length': len(text),
        'image_size': image.size
    }
    
    print("✓ Conversion complete!")
    
    return pdf_bytes, metadata


# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.post("/convert-to-ocr")
async def convert_to_ocr_endpoint(
    file: UploadFile = File(...),
    dpi: int = 300
):
    """
    Convert a non-OCR PDF or image to a searchable OCR PDF.
    
    **Supports:**
    - Non-OCR PDFs (scanned documents)
    - Image files (PNG, JPG, JPEG, TIFF, BMP)
    
    **Returns:**
    - Downloadable searchable PDF with embedded text layer
    """
    try:
        # Read file
        file_bytes = await file.read()
        filename = file.filename or "document"
        file_ext = filename.lower().split('.')[-1]
        
        print(f"\n{'='*60}")
        print(f"Processing: {filename}")
        print(f"{'='*60}")
        
        # Process based on file type
        if file_ext == 'pdf':
            # Convert PDF
            ocr_pdf, metadata = convert_pdf_to_ocr(file_bytes, dpi=dpi)
            output_filename = filename.replace('.pdf', '_ocr.pdf')
        
        elif file_ext in ['png', 'jpg', 'jpeg', 'tiff', 'bmp']:
            # Convert image
            ocr_pdf, metadata = process_image_to_ocr_pdf(file_bytes, filename)
            output_filename = filename.rsplit('.', 1)[0] + '_ocr.pdf'
        
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file_ext}"
            )
        
        print(f"{'='*60}\n")
        
        # Return PDF as downloadable file
        return StreamingResponse(
            io.BytesIO(ocr_pdf),
            media_type="application/pdf",
            headers={
                'Content-Disposition': f'attachment; filename="{output_filename}"',
                'X-Pages-Processed': str(metadata['pages_processed']),
                'X-Text-Length': str(metadata['text_length']),
                'X-Conversion-Status': metadata['status']
            }
        )
    
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/check-ocr-status")
async def check_ocr_status_endpoint(file: UploadFile = File(...)):
    """
    Check if a PDF has OCR (embedded text) or not.
    
    **Returns:**
    - is_ocr: Boolean indicating if PDF has OCR
    - text_length: Number of characters found
    - sample_text: First 200 characters of extracted text
    """
    try:
        file_bytes = await file.read()
        
        is_ocr, text = is_pdf_ocr(file_bytes)
        
        return JSONResponse({
            'filename': file.filename,
            'is_ocr': is_ocr,
            'text_length': len(text.strip()),
            'sample_text': text.strip()[:200] if text else "",
            'recommendation': 'OCR conversion needed' if not is_ocr else 'PDF already searchable'
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Check if OCR service is available."""
    ocr = get_paddle_ocr()
    
    return JSONResponse({
        'status': 'healthy' if ocr else 'ocr_unavailable',
        'ocr_engine': 'PaddleOCR' if ocr else None,
        'pdf2image_available': convert_from_bytes is not None
    })
