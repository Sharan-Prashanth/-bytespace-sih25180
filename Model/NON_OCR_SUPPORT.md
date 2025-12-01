# Non-OCR Document Processing Guide

## Overview

The model now supports **both OCR and non-OCR documents**. This means you can upload:

1. **OCR-enabled PDFs** - PDFs with embedded text (traditional PDFs)
2. **Non-OCR PDFs** - Scanned PDFs without embedded text (image-based PDFs)
3. **Image files** - PNG, JPG, JPEG, TIFF, BMP containing scanned documents

## How It Works

### Automatic Detection

The system automatically detects whether a PDF is OCR-enabled or non-OCR:

1. **First Attempt**: Tries to extract text using PyPDF2
2. **Detection**: If extracted text is less than 50 characters, considers it non-OCR
3. **OCR Fallback**: Automatically applies OCR using PaddleOCR

### Supported File Types

| File Type | OCR Support | Non-OCR Support |
|-----------|-------------|-----------------|
| PDF       | ✓           | ✓               |
| DOCX      | ✓           | N/A             |
| TXT       | ✓           | N/A             |
| PNG       | N/A         | ✓               |
| JPG/JPEG  | N/A         | ✓               |
| TIFF      | N/A         | ✓               |
| BMP       | N/A         | ✓               |

## Technical Implementation

### OCR Engine

- **Engine**: PaddleOCR (supports 80+ languages)
- **Language**: English (default)
- **Accuracy**: High-accuracy text detection and recognition
- **Features**: 
  - Angle classification
  - Multi-page PDF support
  - Image preprocessing

### PDF to Image Conversion

- **Library**: pdf2image
- **DPI**: 300 (high quality)
- **Format**: RGB images
- **Processing**: Page-by-page conversion

## Installation

### Required Dependencies

```bash
# Install Python packages
pip install pdf2image paddlepaddle paddleocr

# Install system dependencies
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install poppler-utils

# macOS
brew install poppler

# Windows
# Download poppler from: https://github.com/oschwartz10612/poppler-windows/releases
# Add to PATH
```

### Verify Installation

```bash
cd Model
python test_ocr.py
```

## API Usage

### Endpoint: `/process-file`

Upload a single file for processing.

**Method**: POST  
**Content-Type**: multipart/form-data

#### Example: OCR-enabled PDF

```bash
curl -X POST http://localhost:8000/process-file \
  -F "file=@proposal_with_text.pdf"
```

#### Example: Non-OCR Scanned PDF

```bash
curl -X POST http://localhost:8000/process-file \
  -F "file=@scanned_proposal.pdf"
```

#### Example: Scanned Image

```bash
curl -X POST http://localhost:8000/process-file \
  -F "file=@scanned_document.png"
```

### Response Format

```json
{
  "project_title": "Extracted title...",
  "principal_investigator": "Name...",
  "definition_of_issue": [
    {
      "type": "paragraph",
      "children": [{"text": "Extracted content..."}]
    }
  ],
  ...
}
```

## Processing Flow

```
┌─────────────────┐
│  Upload File    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Check File     │
│  Extension      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐  ┌──────────┐
│ PDF?  │  │ Image?   │
└───┬───┘  └────┬─────┘
    │           │
    ▼           ▼
┌───────────┐  ┌──────────────┐
│ Extract   │  │ Apply OCR    │
│ Text      │  │ Directly     │
└─────┬─────┘  └──────┬───────┘
      │                │
      ▼                │
┌────────────┐        │
│ Text < 50  │        │
│ chars?     │        │
└─────┬──────┘        │
      │               │
      ▼               │
┌─────────────────────┴──┐
│  Convert to Images &   │
│  Apply OCR (PaddleOCR) │
└──────────┬─────────────┘
           │
           ▼
┌──────────────────────┐
│  Extract Structured  │
│  JSON using Gemini   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Return JSON         │
└──────────────────────┘
```

## Code Changes

### Updated Files

1. **`Model/Json_extraction/extractor.py`**
   - Added `run_ocr_on_image()` - OCR processing for PIL images
   - Added `extract_text_from_scanned_pdf()` - PDF to image to OCR pipeline
   - Enhanced `extract_text()` - Automatic non-OCR detection and fallback
   - Added support for image file uploads (PNG, JPG, etc.)

2. **`Model/requirement.txt`**
   - Added `pdf2image` dependency

3. **`Model/test_ocr.py`** (New)
   - Test suite for OCR functionality

## Performance Considerations

### Processing Time

- **OCR-enabled PDF**: ~1-2 seconds per page
- **Non-OCR PDF**: ~5-10 seconds per page (OCR overhead)
- **Image files**: ~5-10 seconds per image

### Memory Usage

- **PDF to Image Conversion**: ~100MB per PDF page at 300 DPI
- **OCR Processing**: ~500MB (model loading)
- **Recommendation**: For large documents, consider pagination

### Optimization Tips

1. **Lazy Loading**: OCR model loads only when needed
2. **DPI Setting**: Adjust DPI (200-400) based on quality needs
3. **Batch Processing**: Process multiple files asynchronously
4. **GPU Acceleration**: Use GPU for faster OCR (if available)

## Troubleshooting

### Issue: "pdf2image is not installed"

**Solution**:
```bash
pip install pdf2image
sudo apt-get install poppler-utils  # Linux
brew install poppler  # macOS
```

### Issue: "PaddleOCR is not available"

**Solution**:
```bash
pip install paddlepaddle paddleocr
```

### Issue: Poor OCR Accuracy

**Solutions**:
- Increase DPI: Change `dpi=300` to `dpi=400` in `extract_text_from_scanned_pdf()`
- Improve image quality: Scan at higher resolution
- Preprocess images: Enhance contrast, remove noise

### Issue: Timeout on Large PDFs

**Solutions**:
- Process files asynchronously
- Implement pagination
- Increase server timeout limits

## Examples

### Example 1: Processing a Scanned Research Proposal

```python
import requests

# Upload scanned PDF
with open('scanned_proposal.pdf', 'rb') as f:
    files = {'file': f}
    response = requests.post('http://localhost:8000/process-file', files=files)
    
result = response.json()
print(result['project_title'])
```

### Example 2: Batch Processing Multiple Scanned Documents

```python
import os
import requests

documents = ['doc1.pdf', 'doc2.png', 'doc3.jpg']

for doc in documents:
    with open(doc, 'rb') as f:
        files = {'file': f}
        response = requests.post('http://localhost:8000/process-file', files=files)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✓ Processed {doc}")
        else:
            print(f"✗ Failed to process {doc}")
```

## Testing

### Run Test Suite

```bash
cd Model
python test_ocr.py
```

### Expected Output

```
Testing OCR Functionality for Non-OCR Documents
============================================================

============================================================
TEST 1: OCR on Generated Image
============================================================
Test image saved to: /tmp/test_ocr_image.png

✓ OCR Extraction Successful!

Extracted Text:
------------------------------------------------------------
PROJECT PROPOSAL FOR S&T GRANT
1. Project Title: Coal Mining Research
...
------------------------------------------------------------

============================================================
TEST SUMMARY
============================================================
Tests Passed: 2/2
✓ All tests passed!
```

## Future Enhancements

1. **Multi-language Support**: Add support for regional languages
2. **Handwritten Text**: Integrate handwriting recognition
3. **Table Detection**: Extract structured tables from scanned docs
4. **Form Recognition**: Detect and extract form fields
5. **Quality Assessment**: Provide OCR confidence scores
6. **Async Processing**: Queue-based processing for large batches

## Support

For issues or questions:
- Check the troubleshooting section above
- Review test output: `python test_ocr.py`
- Check server logs for error details
- Ensure all dependencies are installed correctly

## References

- [PaddleOCR Documentation](https://github.com/PaddlePaddle/PaddleOCR)
- [pdf2image Documentation](https://github.com/Belval/pdf2image)
- [PyPDF2 Documentation](https://pypdf2.readthedocs.io/)
