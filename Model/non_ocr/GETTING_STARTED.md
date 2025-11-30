# Getting Started with Non-OCR to OCR PDF Converter

## 🎯 What This Does

Converts **scanned/non-OCR PDFs** into **searchable OCR PDFs** where you can:
- 🔍 Search for text
- 📋 Copy text
- 🤖 Process with AI
- 💾 Archive with searchable content

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies

```bash
cd /home/aksshay88/Desktop/projects/sih/SIH25180/Model

# Python packages
pip install reportlab

# System package (if not already installed)
sudo apt-get install poppler-utils
```

### Step 2: Test It Works

```bash
python non_ocr/test_converter.py
```

**Expected output:**
```
✓ TEST 1 PASSED - Image to OCR PDF
✓ TEST 2 PASSED - PDF OCR Detection  
✓ TEST 3 PASSED - API Availability

🎉 ALL TESTS PASSED!
```

### Step 3: Use It!

**Option A: Via API**
```bash
# Start server
python main.py

# In another terminal, convert a file
curl -X POST http://localhost:8000/non-ocr/convert-to-ocr \
  -F "file=@scanned_document.pdf" \
  -o searchable_document.pdf
```

**Option B: Via Command Line**
```bash
python non_ocr/cli.py scanned_document.pdf
# Output: scanned_document_ocr.pdf
```

---

## 📖 Detailed Usage

### Command-Line Examples

#### Basic Conversion
```bash
python non_ocr/cli.py input.pdf
```

#### Custom Output Name
```bash
python non_ocr/cli.py input.pdf -o output_ocr.pdf
```

#### High Quality (400 DPI)
```bash
python non_ocr/cli.py input.pdf --dpi 400
```

#### Check if PDF Has OCR
```bash
python non_ocr/cli.py input.pdf --check-only
```

#### Convert Image to PDF
```bash
python non_ocr/cli.py scanned_page.png
```

### API Examples

#### Convert to OCR PDF

**Request:**
```bash
curl -X POST http://localhost:8000/non-ocr/convert-to-ocr \
  -F "file=@document.pdf" \
  -F "dpi=300" \
  --output result_ocr.pdf
```

**Response:**
- Downloads the searchable PDF
- Headers contain metadata:
  - `X-Pages-Processed`: Number of pages
  - `X-Text-Length`: Characters extracted
  - `X-Conversion-Status`: success/already_ocr

#### Check OCR Status

**Request:**
```bash
curl -X POST http://localhost:8000/non-ocr/check-ocr-status \
  -F "file=@document.pdf"
```

**Response:**
```json
{
  "filename": "document.pdf",
  "is_ocr": false,
  "text_length": 5,
  "sample_text": "",
  "recommendation": "OCR conversion needed"
}
```

#### Health Check

```bash
curl http://localhost:8000/non-ocr/health
```

---

## 🔧 How It Works

```
Input: scanned_document.pdf (no searchable text)
           ↓
Step 1: Convert each page to image (300 DPI)
           ↓
Step 2: Run OCR (PaddleOCR) → Extract text + positions
           ↓
Step 3: Create new PDF:
        • Original image as background
        • Invisible text layer on top (searchable!)
           ↓
Step 4: Merge all pages
           ↓
Output: scanned_document_ocr.pdf (fully searchable!)
```

---

## 🎨 Use Cases

### 1. Legal Documents
```bash
# Convert scanned contract
python non_ocr/cli.py contract_signed.pdf

# Result: Searchable contract, can find clauses
```

### 2. Research Papers
```bash
# Convert old scanned paper
python non_ocr/cli.py research_paper_1990.pdf --dpi 400

# Result: Can search for citations, copy text
```

### 3. Forms Processing
```bash
# Convert filled form
python non_ocr/cli.py filled_form.pdf

# Result: Can extract data programmatically
```

### 4. Batch Processing
```bash
# Process all PDFs in a folder
for pdf in documents/*.pdf; do
    python non_ocr/cli.py "$pdf"
done
```

---

## ⚡ Performance

| Document | Pages | DPI | Time | Quality |
|----------|-------|-----|------|---------|
| Small | 1-5 | 300 | 30s | Good |
| Medium | 10-20 | 300 | 2min | Good |
| Large | 50+ | 300 | 10min+ | Good |
| High Quality | Any | 400 | 2x slower | Excellent |

**Tips:**
- Use 300 DPI for most documents
- Use 400 DPI for small text or high accuracy needs
- Use 200 DPI for quick tests

---

## 🐛 Troubleshooting

### "reportlab not found"
```bash
pip install reportlab
```

### "PaddleOCR not available"
```bash
pip install paddlepaddle paddleocr
```

### "pdf2image not installed"
```bash
pip install pdf2image
sudo apt-get install poppler-utils
```

### Text not searchable in output
Check the conversion logs. Should see:
```
Running OCR...
Creating searchable PDF...
✓ Conversion complete!
```

### Poor OCR accuracy
```bash
# Use higher DPI
python non_ocr/cli.py input.pdf --dpi 400

# Or ensure input is high quality scan
```

---

## 💡 Tips & Best Practices

### ✅ DO:
- Test with a small file first
- Use 300 DPI for standard documents
- Keep original files as backup
- Verify output is searchable (try Ctrl+F)

### ❌ DON'T:
- Convert already-OCR PDFs (check first!)
- Use very high DPI (400+) unless needed
- Process huge files without testing
- Delete original files immediately

---

## 🔗 Integration Examples

### With Python Code

```python
from non_ocr.converter import convert_pdf_to_ocr, is_pdf_ocr

# Read PDF
with open('document.pdf', 'rb') as f:
    pdf_bytes = f.read()

# Check if needs OCR
is_ocr, text = is_pdf_ocr(pdf_bytes)

if not is_ocr:
    # Convert to OCR
    ocr_pdf, metadata = convert_pdf_to_ocr(pdf_bytes)
    
    # Save
    with open('document_ocr.pdf', 'wb') as f:
        f.write(ocr_pdf)
    
    print(f"Converted {metadata['pages_processed']} pages")
else:
    print("PDF already has OCR!")
```

### With Your Web App

```javascript
// Upload and convert
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('dpi', 300);

const response = await fetch('http://localhost:8000/non-ocr/convert-to-ocr', {
    method: 'POST',
    body: formData
});

const ocrPdf = await response.blob();
// Download or process OCR PDF
```

---

## 📊 Comparison: Before vs After

### Before (Scanned PDF):
```
document.pdf
├── Page 1: [Image only]
├── Page 2: [Image only]
└── Page 3: [Image only]

❌ Cannot search
❌ Cannot copy text
❌ Cannot extract data
```

### After (OCR PDF):
```
document_ocr.pdf
├── Page 1: [Image] + [Invisible Text Layer]
├── Page 2: [Image] + [Invisible Text Layer]
└── Page 3: [Image] + [Invisible Text Layer]

✅ Fully searchable
✅ Can copy text
✅ Can extract data
✅ Same visual quality
```

---

## 🎯 What's Next?

1. ✅ Test basic conversion
2. ✅ Try with your real documents
3. ✅ Integrate with your workflow
4. ✅ Set up batch processing if needed

For more details, see [README.md](./README.md)

---

## 📞 Support

Issues? Check:
1. Run tests: `python non_ocr/test_converter.py`
2. Check dependencies: `pip list | grep -E "reportlab|paddle|pdf2image"`
3. See detailed docs: `non_ocr/README.md`
4. Review logs during conversion

**Happy Converting! 📄✨**
