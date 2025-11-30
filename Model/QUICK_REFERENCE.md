# Quick Reference: OCR & Non-OCR Document Processing

## 🚀 Quick Start

```bash
# 1. Install dependencies
pip install pdf2image paddlepaddle paddleocr
sudo apt-get install poppler-utils  # Linux only

# 2. Test it works
cd Model && python test_ocr.py

# 3. Start the server
python main.py

# 4. Upload a file
curl -X POST http://localhost:8000/process-file -F "file=@document.pdf"
```

## 📄 Supported File Types

| Type | Extension | OCR Required | Status |
|------|-----------|--------------|--------|
| PDF with text | `.pdf` | No | ✅ Automatic |
| Scanned PDF | `.pdf` | Yes | ✅ Automatic |
| Images | `.png`, `.jpg`, `.jpeg` | Yes | ✅ Automatic |
| Images | `.tiff`, `.bmp` | Yes | ✅ Automatic |
| Word Docs | `.docx` | No | ✅ Supported |
| Text Files | `.txt`, `.csv` | No | ✅ Supported |

## 🔄 How Detection Works

```
Upload PDF
    ↓
Extract text with PyPDF2
    ↓
Text < 50 characters?
    ↓
   YES → Apply OCR (Scanned PDF)
   NO  → Use extracted text (Normal PDF)
```

## 📡 API Endpoints

### `/process-file` - Single file upload
```bash
curl -X POST http://localhost:8000/process-file \
  -F "file=@scanned_proposal.pdf"
```

### `/process-all-files` - Batch processing
```bash
curl -X POST http://localhost:8000/process-all-files
```

### `/process-non-ocr` - Project timeline extraction
```bash
curl -X POST http://localhost:8000/process-non-ocr \
  -F "file=@timeline_image.png"
```

## 🔧 Configuration

### Adjust OCR Quality

Edit `Model/Json_extraction/extractor.py`:

```python
# Line ~145: Change DPI (higher = better quality, slower)
images = convert_from_bytes(file_bytes, dpi=300)  # Try 200 or 400
```

### Change OCR Language

Edit `Model/Json_extraction/extractor.py`:

```python
# Line ~52: Change language
_paddle_ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
# Options: 'ch' (Chinese), 'en' (English), 'fr' (French), etc.
```

### Adjust Non-OCR Detection Threshold

Edit `Model/Json_extraction/extractor.py`:

```python
# Line ~106: Change threshold
if len(text.strip()) < 50:  # Try 30 or 100
```

## ⚡ Performance Tips

### Speed Up Processing
- Lower DPI: `dpi=200` instead of `dpi=300`
- Disable angle classification: `use_angle_cls=False`
- Use GPU if available

### Improve Accuracy
- Increase DPI: `dpi=400` or `dpi=600`
- Preprocess images (contrast, noise reduction)
- Scan documents at higher resolution

### Reduce Memory Usage
- Process files one at a time
- Lower DPI for large documents
- Restart server periodically

## 🐛 Common Issues

### "pdf2image is not installed"
```bash
pip install pdf2image
sudo apt-get install poppler-utils  # Linux
brew install poppler  # macOS
```

### "PaddleOCR is not available"
```bash
pip install paddlepaddle paddleocr
```

### OCR is slow
- Use lower DPI (200 instead of 300)
- Enable GPU: `pip install paddlepaddle-gpu`

### Low accuracy
- Increase DPI (400 or 600)
- Ensure good scan quality
- Clean/preprocess images

## 📊 Processing Time

| File Type | Pages/Images | Approx. Time |
|-----------|--------------|--------------|
| OCR PDF | 10 pages | 1-2 sec |
| Non-OCR PDF | 10 pages | 50-100 sec |
| Single Image | 1 image | 5-10 sec |

## 🧪 Testing

```bash
# Run test suite
cd Model
python test_ocr.py

# Test with real file
curl -X POST http://localhost:8000/process-file \
  -F "file=@test_document.pdf" \
  | jq .  # Pretty print JSON
```

## 📝 Example Response

```json
{
  "project_title": "Coal Mining Safety Research",
  "principal_investigator": "Dr. John Doe",
  "definition_of_issue": [
    {
      "type": "paragraph",
      "children": [
        {"text": "Extracted content from scanned document..."}
      ]
    }
  ],
  ...
}
```

## 🔗 Links

- **Full Documentation**: [NON_OCR_SUPPORT.md](./NON_OCR_SUPPORT.md)
- **Implementation Details**: [NON_OCR_IMPLEMENTATION_SUMMARY.md](./NON_OCR_IMPLEMENTATION_SUMMARY.md)
- **PaddleOCR Docs**: https://github.com/PaddlePaddle/PaddleOCR
- **pdf2image Docs**: https://github.com/Belval/pdf2image

## 💡 Tips

✅ **Always test with sample files first**  
✅ **Monitor server logs for errors**  
✅ **Use high-quality scans (300+ DPI)**  
✅ **Process large batches asynchronously**  
✅ **Keep dependencies updated**  

## 🆘 Get Help

1. Check server logs: `tail -f server.log`
2. Run test: `python test_ocr.py`
3. Verify install: `pip list | grep -E "paddle|pdf2image"`
4. Check docs: [NON_OCR_SUPPORT.md](./NON_OCR_SUPPORT.md)
