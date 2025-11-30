# COMPLETE TEST GUIDE - Non-OCR PDF Converter

## 📋 EXACTLY WHAT TO DO (Copy & Paste Each Command)

### Step 1: Go to the folder (5 seconds)

```bash
cd /home/aksshay88/Desktop/projects/sih/SIH25180/Model/non_ocr
```

---

### Step 2: Install everything (3-5 minutes)

```bash
# Install Python packages
pip install -r requirements.txt

# Install system tool (Linux only)
sudo apt-get update && sudo apt-get install -y poppler-utils
```

**OR use the automatic script:**

```bash
./INSTALL.sh
```

---

### Step 3: Test it works (1 minute)

```bash
python test_converter.py
```

**You should see:**
```
✓ TEST 1 PASSED - Image to OCR PDF
✓ TEST 2 PASSED - PDF OCR Detection
✓ TEST 3 PASSED - API Availability
🎉 ALL TESTS PASSED!
```

✅ If you see this, **everything works!**

---

## 🎯 NOW TEST WITH YOUR OWN PDF

### Method 1: Command Line (Easiest)

```bash
# Convert your scanned PDF
python cli.py /path/to/your/scanned.pdf

# Output: scanned_ocr.pdf will be created in same folder
```

**Example:**
```bash
python cli.py ~/Documents/my_scan.pdf
# Creates: ~/Documents/my_scan_ocr.pdf
```

**Check it worked:**
- Open the `_ocr.pdf` file
- Try searching (Ctrl+F)
- Try copying text
- ✅ If you can search/copy, it worked!

---

### Method 2: API Server (For Web App)

**Terminal 1 - Start server:**
```bash
cd /home/aksshay88/Desktop/projects/sih/SIH25180/Model
python main.py
```

**Terminal 2 - Upload file:**
```bash
curl -X POST http://localhost:8000/non-ocr/convert-to-ocr \
  -F "file=@/path/to/your/scanned.pdf" \
  -o result_ocr.pdf
```

**Or use your browser:**
1. Go to: http://localhost:8000/docs
2. Find: **POST /non-ocr/convert-to-ocr**
3. Click "Try it out"
4. Upload your PDF
5. Click "Execute"
6. Download the result

---

## 🧪 CREATE A TEST PDF (If you don't have one)

```bash
cd /tmp

# Create a test image with text
python3 << 'PYTHON_EOF'
from PIL import Image, ImageDraw

img = Image.new('RGB', (800, 400), color='white')
draw = ImageDraw.Draw(img)
draw.text((50, 50), "TEST DOCUMENT\n\nThis is a scanned document.\nIt should become searchable!", fill='black')
img.save('test_scan.png')
print("✅ Test image created: /tmp/test_scan.png")
PYTHON_EOF

# Convert it to OCR PDF
python /home/aksshay88/Desktop/projects/sih/SIH25180/Model/non_ocr/cli.py test_scan.png

# Check the output
ls -lh test_scan_ocr.pdf
```

---

## ✅ VERIFICATION CHECKLIST

After converting, check:

- [ ] Output file created (filename_ocr.pdf)
- [ ] File size is reasonable (usually 1-5 MB per page)
- [ ] Can open in PDF reader
- [ ] Can search text (Ctrl+F)
- [ ] Can copy text
- [ ] Text is accurate

---

## 🐛 TROUBLESHOOTING

### "ModuleNotFoundError: No module named 'reportlab'"
```bash
pip install reportlab
```

### "ModuleNotFoundError: No module named 'paddleocr'"
```bash
pip install paddlepaddle paddleocr
```

### "Unable to get page count. Is poppler installed?"
```bash
sudo apt-get install poppler-utils
```

### "Permission denied: ./INSTALL.sh"
```bash
chmod +x INSTALL.sh
./INSTALL.sh
```

### Tests fail with import errors
```bash
# Make sure you're in the right directory
cd /home/aksshay88/Desktop/projects/sih/SIH25180/Model/non_ocr

# Reinstall dependencies
pip install -r requirements.txt
```

---

## 📊 WHAT TO EXPECT

### Processing Times:

| Document Type | Pages | Time |
|--------------|-------|------|
| Small PDF | 1-5 | 30 seconds |
| Medium PDF | 10-20 | 2 minutes |
| Large PDF | 50+ | 10+ minutes |
| Single Image | 1 | 5-10 seconds |

### File Sizes:

Original scanned PDF: 2 MB  
→ OCR PDF output: ~2-3 MB (similar size)

---

## 🎯 COMPLETE EXAMPLE

```bash
# 1. Install (one time)
cd /home/aksshay88/Desktop/projects/sih/SIH25180/Model/non_ocr
pip install -r requirements.txt
sudo apt-get install poppler-utils

# 2. Test
python test_converter.py

# 3. Convert your PDF
python cli.py ~/Downloads/scanned_document.pdf

# 4. Check output
ls -lh ~/Downloads/scanned_document_ocr.pdf

# 5. Open and verify it's searchable
# Use your PDF reader and try Ctrl+F
```

---

## 🚀 FOR YOUR WEB APP

**Integration example:**

```python
# In your upload handler
from non_ocr.converter import is_pdf_ocr, convert_pdf_to_ocr

# Check if PDF needs OCR
is_ocr, text = is_pdf_ocr(pdf_bytes)

if not is_ocr:
    # Convert to searchable PDF
    ocr_pdf, metadata = convert_pdf_to_ocr(pdf_bytes)
    
    # Save it
    with open('output.pdf', 'wb') as f:
        f.write(ocr_pdf)
    
    print(f"✓ Converted {metadata['pages_processed']} pages")
else:
    print("✓ PDF already searchable")
```

---

## 📞 NEED HELP?

1. **Check logs:** Look at console output during conversion
2. **Run tests:** `python test_converter.py`
3. **Verify install:** `pip list | grep -E "reportlab|paddle|pdf2image"`
4. **Check poppler:** `which pdftoppm` (should show a path)

---

## ✨ SUCCESS INDICATORS

You'll know it worked when:

✅ Tests pass without errors  
✅ Output PDF file is created  
✅ You can search text in the PDF (Ctrl+F)  
✅ You can copy text from the PDF  
✅ Text accuracy is good  

---

**That's it! You're ready to convert scanned PDFs! 📄→🔍📄**
