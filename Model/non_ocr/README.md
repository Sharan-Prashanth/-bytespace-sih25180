# Non-OCR PDF to OCR PDF Converter

Convert scanned/non-OCR PDFs into **searchable OCR PDFs** with embedded text layer.

## Features

✅ **PDF to OCR PDF** - Convert scanned PDFs to searchable PDFs  
✅ **Image to OCR PDF** - Convert images (PNG, JPG, TIFF) to searchable PDFs  
✅ **Auto-Detection** - Automatically detects if PDF needs OCR  
✅ **Invisible Text Layer** - Creates searchable PDFs with invisible text overlay  
✅ **CLI & API** - Use via command-line or REST API  
✅ **High Accuracy** - PaddleOCR with configurable DPI  

## Why This Approach?

### Advantages:
1. **Preserves Original Quality** - Original image remains unchanged
2. **Searchable** - Text is embedded for search and copy
3. **Universal Compatibility** - Works with all PDF readers
4. **Better for Archives** - Single searchable PDF instead of separate files

### Use Cases:
- 📄 Legal documents scanning
- 📚 Book digitization
- 📋 Form processing
- 🗄️ Document archival
- 🔍 Making old scanned documents searchable

## Installation

```bash
cd Model/non_ocr

# Install Python dependencies
pip install paddlepaddle paddleocr pdf2image reportlab PyPDF2

# Install system dependency
sudo apt-get install poppler-utils  # Linux
brew install poppler               # macOS
```

## Usage

### 1. API Endpoint (Recommended)

First, integrate with main.py:

```python
# In Model/main.py, add:
from non_ocr import router as non_ocr_router
app.include_router(non_ocr_router)
```

Start the server:
```bash
cd Model
python main.py
```

#### Convert PDF/Image to OCR PDF

```bash
curl -X POST http://localhost:8000/non-ocr/convert-to-ocr \
  -F "file=@scanned_document.pdf" \
  -F "dpi=300" \
  -o output_ocr.pdf
```

#### Check if PDF has OCR

```bash
curl -X POST http://localhost:8000/non-ocr/check-ocr-status \
  -F "file=@document.pdf"
```

Response:
```json
{
  "filename": "document.pdf",
  "is_ocr": false,
  "text_length": 12,
  "sample_text": "Some text...",
  "recommendation": "OCR conversion needed"
}
```

### 2. Command-Line Interface

```bash
cd Model/non_ocr

# Convert PDF to OCR
python cli.py input.pdf

# Specify output file
python cli.py input.pdf -o output_ocr.pdf

# Adjust DPI (higher = better quality, slower)
python cli.py input.pdf --dpi 400

# Check if PDF has OCR (without converting)
python cli.py input.pdf --check-only

# Convert image to OCR PDF
python cli.py scanned_page.png
```

### 3. Python Code

```python
from non_ocr.converter import convert_pdf_to_ocr, is_pdf_ocr

# Check if PDF has OCR
with open('document.pdf', 'rb') as f:
    file_bytes = f.read()

is_ocr, text = is_pdf_ocr(file_bytes)
print(f"Has OCR: {is_ocr}")

# Convert to OCR PDF
if not is_ocr:
    ocr_pdf, metadata = convert_pdf_to_ocr(file_bytes, dpi=300)
    
    # Save result
    with open('document_ocr.pdf', 'wb') as f:
        f.write(ocr_pdf)
    
    print(f"Processed {metadata['pages_processed']} pages")
```

## How It Works

```
Input: Scanned PDF (no text)
           ↓
1. Convert PDF pages to images (300 DPI)
           ↓
2. Run OCR on each image (PaddleOCR)
           ↓
3. Extract text + bounding boxes
           ↓
4. Create new PDF:
   - Image as background
   - Invisible text layer on top
           ↓
5. Merge all pages
           ↓
Output: Searchable OCR PDF
```

## Examples

### Example 1: Convert Scanned Research Paper

```bash
# Input: scanned_paper.pdf (10 pages, no text)
python cli.py scanned_paper.pdf --dpi 300

# Output: scanned_paper_ocr.pdf (searchable)
# ✓ All text is searchable
# ✓ Can copy text from PDF
# ✓ Original image quality preserved
```

### Example 2: Batch Processing

```bash
# Process all PDFs in a directory
for pdf in *.pdf; do
    python cli.py "$pdf"
done
```

### Example 3: Via API with Progress

```python
import requests

# Upload file
with open('document.pdf', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/non-ocr/convert-to-ocr',
        files={'file': f},
        data={'dpi': 300}
    )

# Save OCR PDF
with open('document_ocr.pdf', 'wb') as f:
    f.write(response.content)

# Check metadata from headers
print(f"Pages: {response.headers.get('X-Pages-Processed')}")
print(f"Text: {response.headers.get('X-Text-Length')} chars")
```

## Configuration

### Adjust OCR Quality

Edit `converter.py`:

```python
# Line ~300: Change default DPI
def convert_pdf_to_ocr(file_bytes, dpi=300):
# Try: 200 (fast), 300 (default), 400 (high quality)
```

### Change OCR Language

```python
# Line ~50: Change language
_paddle_ocr = PaddleOCR(use_angle_cls=True, lang='en')
# Options: 'en', 'ch', 'fr', 'de', 'es', etc.
```

### Text Layer Visibility

```python
# Line ~165: Adjust text transparency
pdf.setFillColorRGB(0, 0, 0, alpha=0)  # 0 = invisible
# Try: alpha=0.1 for debugging (visible text)
```

## Performance

| Document | Pages | DPI | Time | Output Size |
|----------|-------|-----|------|-------------|
| Small PDF | 5 | 300 | 30s | 5 MB |
| Medium PDF | 20 | 300 | 2min | 18 MB |
| Large PDF | 100 | 300 | 10min | 95 MB |
| Image (1 page) | 1 | 300 | 8s | 1.2 MB |

## API Reference

### POST /non-ocr/convert-to-ocr

Convert PDF/image to searchable OCR PDF.

**Parameters:**
- `file` (required): PDF or image file
- `dpi` (optional): Resolution (default: 300)

**Returns:**
- Downloadable searchable PDF
- Headers with metadata

### POST /non-ocr/check-ocr-status

Check if PDF has OCR.

**Parameters:**
- `file` (required): PDF file

**Returns:**
```json
{
  "filename": "doc.pdf",
  "is_ocr": true/false,
  "text_length": 1234,
  "sample_text": "...",
  "recommendation": "..."
}
```

### GET /non-ocr/health

Check service health.

**Returns:**
```json
{
  "status": "healthy",
  "ocr_engine": "PaddleOCR",
  "pdf2image_available": true
}
```

## Troubleshooting

### Issue: "pdf2image is not installed"

```bash
pip install pdf2image
sudo apt-get install poppler-utils
```

### Issue: Text not selectable in output PDF

Check if OCR actually ran. The output should show:
```
Running OCR...
Creating searchable PDF...
```

### Issue: Poor text recognition

- Increase DPI: `--dpi 400` or `--dpi 600`
- Use high-quality scans
- Preprocess images (contrast, noise reduction)

### Issue: Large output files

- Lower DPI: `--dpi 200`
- Compress images before OCR
- Use PDF compression tools after conversion

## Advanced Usage

### Custom Progress Callback

```python
def my_progress(current, total):
    print(f"Processing page {current}/{total}")

ocr_pdf, metadata = convert_pdf_to_ocr(
    file_bytes,
    progress_callback=my_progress
)
```

### Process Only Specific Pages

Modify `converter.py`:

```python
# Convert only pages 1-5
images = convert_from_bytes(file_bytes, dpi=dpi, first_page=1, last_page=5)
```

## Best Practices

1. **Use 300 DPI for most documents** - Good balance of quality and speed
2. **Check OCR status first** - Avoid re-processing already OCR'd files
3. **Batch process overnight** - Large documents take time
4. **Keep originals** - Always save original scanned files
5. **Validate output** - Spot-check text accuracy after conversion

## Integration with Main App

Add to `Model/main.py`:

```python
from non_ocr import router as non_ocr_router

# Include router
app.include_router(non_ocr_router)
```

Now available at:
- `http://localhost:8000/non-ocr/convert-to-ocr`
- `http://localhost:8000/non-ocr/check-ocr-status`
- `http://localhost:8000/non-ocr/health`

## License

Part of the SIH25180 project.

## Support

For issues:
1. Check logs during conversion
2. Verify all dependencies installed
3. Test with small PDF first
4. See main project documentation
