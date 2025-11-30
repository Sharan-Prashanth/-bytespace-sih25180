# Getting Started with OCR Support

## 🎯 What's New

Your model now supports **scanned documents** (non-OCR files)! Upload any document - with or without embedded text - and get structured JSON output.

### What You Can Upload Now

✅ Regular PDFs (with text)  
✅ Scanned PDFs (images only)  
✅ PNG/JPG images of documents  
✅ TIFF/BMP scanned files  
✅ DOCX files  
✅ TXT/CSV files  

**No configuration needed** - the system automatically detects and processes!

---

## 🚀 Step-by-Step Setup

### Step 1: Install Python Dependencies

```bash
cd Model
pip install pdf2image paddlepaddle paddleocr
```

**Note**: This may take a few minutes as PaddleOCR includes ML models.

### Step 2: Install System Dependencies

#### On Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install poppler-utils
```

#### On macOS:
```bash
brew install poppler
```

#### On Windows:
1. Download poppler from: https://github.com/oschwartz10612/poppler-windows/releases
2. Extract and add the `bin` folder to your PATH

### Step 3: Verify Installation

```bash
python test_ocr.py
```

**Expected output:**
```
============================================================
Testing OCR Functionality for Non-OCR Documents
============================================================

TEST 1: OCR on Generated Image
✓ OCR Extraction Successful!

TEST 2: Integration Test with extract_text()
✓ Integration Test Successful!

TEST SUMMARY
Tests Passed: 2/2
✓ All tests passed!
```

### Step 4: Start the Server

```bash
python main.py
```

**Server starts at:** http://localhost:8000

---

## 📤 Test with Sample Documents

### Test 1: Regular PDF (with text)
```bash
curl -X POST http://localhost:8000/process-file \
  -F "file=@regular_document.pdf" \
  -o output.json
```

### Test 2: Scanned PDF (non-OCR)
```bash
curl -X POST http://localhost:8000/process-file \
  -F "file=@scanned_document.pdf" \
  -o output.json
```

### Test 3: Image File
```bash
curl -X POST http://localhost:8000/process-file \
  -F "file=@document_scan.png" \
  -o output.json
```

### View Results
```bash
cat output.json | jq .
```

---

## 🔍 How It Works

### The Magic Behind the Scenes

```
You upload a file
       ↓
Is it a PDF?
       ↓
System tries to extract text
       ↓
Got enough text? (> 50 chars)
  ├─ YES → Use extracted text ✅
  └─ NO  → Apply OCR automatically 🔍
       ↓
Process with AI (Gemini)
       ↓
Return structured JSON
```

### Processing Times

| Document Type | Time per Page |
|---------------|---------------|
| Regular PDF | 1-2 seconds |
| Scanned PDF | 5-10 seconds |
| Image | 5-10 seconds |

---

## 📊 Example Output

### Input: Scanned Research Proposal PDF

### Output:
```json
{
  "project_title": "Advanced Coal Mining Techniques",
  "principal_investigator": "Dr. Jane Smith",
  "definition_of_issue": [
    {
      "type": "paragraph",
      "children": [
        {
          "text": "Current mining methods face efficiency challenges..."
        }
      ]
    }
  ],
  "objectives": [
    {
      "type": "paragraph",
      "children": [
        {
          "text": "1. Improve mining efficiency by 30%"
        }
      ]
    }
  ]
  // ... more fields
}
```

---

## 🎛️ Configuration (Optional)

### Adjust OCR Quality

Edit `Model/Json_extraction/extractor.py`:

```python
# Line ~145: Change DPI for quality
images = convert_from_bytes(file_bytes, dpi=300)
# Higher DPI = Better quality but slower
# Try: 200 (fast), 300 (default), 400 (high quality)
```

### Change Language

```python
# Line ~52: Change OCR language
_paddle_ocr = PaddleOCR(use_angle_cls=True, lang='en')
# Options: 'en', 'ch', 'fr', 'de', etc.
```

### Adjust Detection Threshold

```python
# Line ~106: Change non-OCR detection
if len(text.strip()) < 50:  # Characters threshold
# Lower = More aggressive OCR
# Higher = Less aggressive OCR
```

---

## 🐛 Troubleshooting

### Issue: "pdf2image is not installed"

**Fix:**
```bash
pip install pdf2image
```

### Issue: "Unable to get page count. Is poppler installed?"

**Fix (Linux):**
```bash
sudo apt-get install poppler-utils
```

**Fix (macOS):**
```bash
brew install poppler
```

### Issue: OCR is slow

**Quick Fixes:**
- Lower DPI: Change `dpi=300` to `dpi=200`
- Use smaller files for testing
- Process files one at a time

### Issue: Poor text recognition

**Fixes:**
- Increase DPI: Change to `dpi=400`
- Use high-quality scans (300+ DPI)
- Ensure good lighting in scanned images
- Remove noise/artifacts from images

---

## 📚 Learn More

### Documentation Files

1. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)**  
   Quick commands and tips

2. **[NON_OCR_SUPPORT.md](./NON_OCR_SUPPORT.md)**  
   Comprehensive technical guide

3. **[CHANGELOG.md](./CHANGELOG.md)**  
   What changed and why

4. **[FILES_SUMMARY.txt](./FILES_SUMMARY.txt)**  
   Overview of all changes

---

## ✅ Checklist

Before using in production:

- [ ] Install dependencies: `pip install pdf2image paddlepaddle paddleocr`
- [ ] Install poppler: `sudo apt-get install poppler-utils`
- [ ] Run tests: `python test_ocr.py` - All tests pass
- [ ] Test with sample scanned PDF - Works correctly
- [ ] Test with sample image - Works correctly
- [ ] Check server logs - No errors
- [ ] Performance test - Response time acceptable

---

## 🎉 You're Ready!

Your model now has **full document processing capabilities**:
- ✅ Text-based documents
- ✅ Scanned documents
- ✅ Images
- ✅ Automatic detection
- ✅ Zero configuration

Just upload and go! 🚀

---

## 💬 Need Help?

1. Run the test suite: `python test_ocr.py`
2. Check [NON_OCR_SUPPORT.md](./NON_OCR_SUPPORT.md) troubleshooting
3. Review server logs for errors
4. Verify all dependencies are installed

---

## 🔗 Quick Links

- **API Documentation**: `http://localhost:8000/docs`
- **Test Endpoint**: `http://localhost:8000/process-file`
- **Health Check**: `http://localhost:8000/`

---

**Happy Document Processing! 📄✨**
