# How to Test the OCR Feature

## Option 1: Quick Test (Recommended for First Time)

### Step 1: Install Dependencies

```bash
cd /home/aksshay88/Desktop/projects/sih/SIH25180/Model

# Install Python packages
pip install pdf2image paddlepaddle paddleocr

# Install system dependency (poppler)
sudo apt-get update
sudo apt-get install poppler-utils
```

### Step 2: Run the Test Suite

```bash
python test_ocr.py
```

**What happens:**
- Creates a test image with text
- Runs OCR on it
- Shows extracted text
- Reports test results

**Expected output:**
```
Testing OCR Functionality for Non-OCR Documents
============================================================

TEST 1: OCR on Generated Image
Test image saved to: /tmp/test_ocr_image.png
✓ OCR Extraction Successful!

Extracted Text:
------------------------------------------------------------
PROJECT PROPOSAL FOR S&T GRANT
1. Project Title: Coal Mining Research
...
------------------------------------------------------------

TEST SUMMARY
Tests Passed: 2/2
✓ All tests passed!
```

---

## Option 2: Test with the API Server

### Step 1: Start the Server

```bash
cd /home/aksshay88/Desktop/projects/sih/SIH25180/Model
python main.py
```

Wait for: `Uvicorn running on http://0.0.0.0:8000`

### Step 2: Create a Test Image

Open a new terminal:

```bash
# Create a simple test document using ImageMagick
convert -size 800x600 xc:white \
  -pointsize 24 \
  -draw "text 50,100 'PROJECT PROPOSAL'" \
  -draw "text 50,150 'Title: Coal Mining Research'" \
  -draw "text 50,200 'PI: Dr. John Doe'" \
  /tmp/test_document.png
```

**OR** use Python to create an image:

```bash
cd /tmp
python3 << 'PYTHON_EOF'
from PIL import Image, ImageDraw, ImageFont

img = Image.new('RGB', (800, 400), color='white')
draw = ImageDraw.Draw(img)

text = """PROJECT PROPOSAL FOR S&T GRANT

1. Project Title: Coal Mining Research
2. Principal Investigator: Dr. John Doe
3. Institution: Mining Research Institute
4. Duration: 3 years"""

draw.text((50, 50), text, fill='black')
img.save('test_document.png')
print("✓ Test image created: /tmp/test_document.png")
PYTHON_EOF
```

### Step 3: Test the API

```bash
# Upload the test image
curl -X POST http://localhost:8000/process-file \
  -F "file=@/tmp/test_document.png" \
  -o /tmp/result.json

# View the result
cat /tmp/result.json | python3 -m json.tool
```

---

## Option 3: Test with Real Scanned PDF

### If you have a scanned PDF:

```bash
# Make sure server is running
cd /home/aksshay88/Desktop/projects/sih/SIH25180/Model
python main.py
```

In another terminal:

```bash
# Upload your scanned PDF
curl -X POST http://localhost:8000/process-file \
  -F "file=@/path/to/your/scanned.pdf" \
  -o result.json

# Check the result
cat result.json | python3 -m json.tool
```

---

## Option 4: Interactive Testing with Browser

### Step 1: Start Server

```bash
cd /home/aksshay88/Desktop/projects/sih/SIH25180/Model
python main.py
```

### Step 2: Open API Documentation

Open your browser and go to:
```
http://localhost:8000/docs
```

### Step 3: Test via Swagger UI

1. Look for `/process-file` endpoint
2. Click "Try it out"
3. Click "Choose File" and select a scanned PDF or image
4. Click "Execute"
5. View the response below

---

## Verification Checklist

After testing, verify:

- [ ] Test suite passes (all green checkmarks)
- [ ] Server starts without errors
- [ ] Can upload an image file
- [ ] OCR extracts text correctly
- [ ] JSON response is properly formatted
- [ ] Server logs show OCR processing messages

---

## What to Look For

### Success Indicators:

✅ **Console Output (when processing non-OCR file):**
```
PDF appears to be non-OCR (scanned). Applying OCR...
Processing page 1/5 with OCR...
Processing page 2/5 with OCR...
...
```

✅ **JSON Response:**
```json
{
  "project_title": "Extracted title",
  "principal_investigator": "Name",
  ...
}
```

### Error Indicators:

❌ **Missing Dependencies:**
```
pdf2image is not installed
PaddleOCR is not available
```
**Fix:** Run installation commands again

❌ **Poppler Not Found:**
```
Unable to get page count. Is poppler installed?
```
**Fix:** `sudo apt-get install poppler-utils`

---

## Quick Troubleshooting

### If test fails:

```bash
# Check if dependencies are installed
pip list | grep -E "pdf2image|paddle"

# Should show:
# pdf2image        x.x.x
# paddleocr        x.x.x
# paddlepaddle     x.x.x

# Check poppler
which pdftoppm

# Should show: /usr/bin/pdftoppm
```

### If installation fails:

```bash
# Try with pip3
pip3 install pdf2image paddlepaddle paddleocr

# Or with user flag
pip install --user pdf2image paddlepaddle paddleocr
```

---

## Performance Testing

### Test processing time:

```bash
time curl -X POST http://localhost:8000/process-file \
  -F "file=@/tmp/test_document.png" \
  -o /tmp/result.json
```

**Expected:**
- Image files: 5-10 seconds
- Small PDFs (1-5 pages): 10-30 seconds
- Large PDFs (10+ pages): 1-2 minutes

---

## Need Help?

1. **Dependencies issue**: Check QUICK_REFERENCE.md
2. **Poor OCR quality**: See NON_OCR_SUPPORT.md troubleshooting
3. **Server errors**: Check server logs in terminal
4. **Still stuck**: Run `python test_ocr.py` and share output

