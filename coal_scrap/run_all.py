#!/usr/bin/env python3
"""
All-in-One Coal Statistics Scraper
Run this single script to download PDFs and extract all data
"""

import subprocess
import sys
import os

def check_dependencies():
    """Check if required libraries are installed"""
    required = ['requests', 'bs4', 'PyPDF2', 'pdfplumber', 'pandas', 'openpyxl']
    missing = []
    
    for lib in required:
        try:
            __import__(lib)
        except ImportError:
            missing.append(lib)
    
    if missing:
        print(f"❌ Missing dependencies: {', '.join(missing)}")
        print(f"\nInstall them with:")
        print(f"  pip3 install -r requirements.txt")
        print(f"\nOr run:")
        print(f"  ./setup.sh")
        return False
    
    return True

def run_scraper():
    """Run the main scraper"""
    print("\n" + "="*60)
    print("STEP 1: DOWNLOADING PDFs")
    print("="*60 + "\n")
    
    try:
        subprocess.run([sys.executable, 'scraper.py'], check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Scraper failed: {e}")
        return False

def run_extractor():
    """Run the PDF extractor"""
    print("\n" + "="*60)
    print("STEP 2: EXTRACTING DATA FROM PDFs")
    print("="*60 + "\n")
    
    try:
        subprocess.run([sys.executable, 'pdf_extractor.py'], check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Extractor failed: {e}")
        return False

def main():
    print("""
╔════════════════════════════════════════════════════════════╗
║     COAL STATISTICS SCRAPER - ALL-IN-ONE                   ║
║     Automated PDF Download & Data Extraction               ║
╚════════════════════════════════════════════════════════════╝
    """)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Run scraper
    if not run_scraper():
        print("\n❌ Failed at scraping stage")
        sys.exit(1)
    
    # Ask user if they want to continue to extraction
    print("\n" + "="*60)
    response = input("PDFs downloaded! Extract data now? (y/n): ").lower()
    
    if response != 'y':
        print("\nYou can run data extraction later with:")
        print("  python3 pdf_extractor.py")
        return
    
    # Run extractor
    if not run_extractor():
        print("\n❌ Failed at extraction stage")
        sys.exit(1)
    
    # Final summary
    print(f"""
╔════════════════════════════════════════════════════════════╗
║                  ALL DONE! ✓                               ║
╚════════════════════════════════════════════════════════════╝

Your data is ready:
📁 PDFs: {os.path.abspath('downloaded_pdfs')}
📊 Tables: {os.path.abspath('extracted_data/tables')}
📝 Text: {os.path.abspath('extracted_data/text')}
📋 Metadata: {os.path.abspath('extracted_data')}

You can now use this data in your dashboard!
    """)

if __name__ == "__main__":
    main()
