#!/bin/bash
# Quick Test Script for OCR Feature

echo "════════════════════════════════════════════════════════════"
echo "           Testing OCR Feature - Quick Test"
echo "════════════════════════════════════════════════════════════"
echo ""

# Navigate to Model directory
cd "$(dirname "$0")"

echo "📁 Current directory: $(pwd)"
echo ""

# Check if dependencies are installed
echo "🔍 Checking dependencies..."
echo ""

# Check Python packages
if python3 -c "import pdf2image" 2>/dev/null; then
    echo "✓ pdf2image is installed"
else
    echo "✗ pdf2image is NOT installed"
    echo "  Run: pip install pdf2image"
fi

if python3 -c "import paddleocr" 2>/dev/null; then
    echo "✓ paddleocr is installed"
else
    echo "✗ paddleocr is NOT installed"
    echo "  Run: pip install paddlepaddle paddleocr"
fi

# Check poppler
if command -v pdftoppm &> /dev/null; then
    echo "✓ poppler is installed"
else
    echo "✗ poppler is NOT installed"
    echo "  Run: sudo apt-get install poppler-utils"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Check if all dependencies are met
if python3 -c "import pdf2image, paddleocr" 2>/dev/null && command -v pdftoppm &> /dev/null; then
    echo "✓ All dependencies installed! Running tests..."
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo ""
    
    # Run the test
    python3 test_ocr.py
    
    TEST_EXIT_CODE=$?
    
    echo ""
    echo "════════════════════════════════════════════════════════════"
    
    if [ $TEST_EXIT_CODE -eq 0 ]; then
        echo ""
        echo "🎉 SUCCESS! OCR feature is working correctly!"
        echo ""
        echo "Next steps:"
        echo "  1. Start server: python3 main.py"
        echo "  2. Upload files to: http://localhost:8000/process-file"
        echo ""
    else
        echo ""
        echo "⚠️  Tests failed. Check the output above for errors."
        echo ""
        echo "For help, see: TEST_INSTRUCTIONS.md"
        echo ""
    fi
else
    echo ""
    echo "⚠️  Missing dependencies. Please install them first:"
    echo ""
    echo "Run these commands:"
    echo ""
    echo "  pip install pdf2image paddlepaddle paddleocr"
    echo "  sudo apt-get update && sudo apt-get install -y poppler-utils"
    echo ""
    echo "Then run this script again: ./RUN_TEST.sh"
    echo ""
fi

echo "════════════════════════════════════════════════════════════"
