#!/bin/bash

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "   Installing Non-OCR PDF Converter Dependencies"
echo "═══════════════════════════════════════════════════════════"
echo ""

cd "$(dirname "$0")"

echo "📦 Installing Python packages..."
echo "─────────────────────────────────────────────────────────"
pip install -r requirements.txt

echo ""
echo "📦 Installing system dependencies (poppler)..."
echo "─────────────────────────────────────────────────────────"

if command -v apt-get &> /dev/null; then
    echo "Detected: Debian/Ubuntu"
    sudo apt-get update
    sudo apt-get install -y poppler-utils
elif command -v brew &> /dev/null; then
    echo "Detected: macOS"
    brew install poppler
else
    echo "⚠️  Please install poppler manually:"
    echo "   Ubuntu/Debian: sudo apt-get install poppler-utils"
    echo "   macOS: brew install poppler"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Installation complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Next step: Test it!"
echo "  python test_converter.py"
echo ""

