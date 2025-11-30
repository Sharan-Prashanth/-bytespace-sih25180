#!/bin/bash
# Quick setup script for Coal Statistics Scraper

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     COAL STATISTICS SCRAPER - SETUP                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check Python version
echo "Checking Python version..."
python3 --version

# Install dependencies
echo ""
echo "Installing dependencies..."
pip3 install -r requirements.txt

# Verify installation
echo ""
echo "Verifying installation..."
python3 -c "
import sys
try:
    import requests
    import bs4
    import PyPDF2
    import pdfplumber
    import pandas
    import openpyxl
    print('✓ All libraries installed successfully!')
    print('')
    print('Ready to scrape!')
    print('')
    print('Next steps:')
    print('1. Run: python3 scraper.py       (to download PDFs)')
    print('2. Run: python3 pdf_extractor.py (to extract data)')
except ImportError as e:
    print(f'✗ Error: {e}')
    sys.exit(1)
"
