#!/usr/bin/env python3
"""
Coal Statistics Scraper
Scrapes monthly statistics PDFs from coal.nic.in and extracts data
"""

import requests
from bs4 import BeautifulSoup
import re
import os
import time
from urllib.parse import urljoin
import json

class CoalStatsScraper:
    def __init__(self):
        self.base_url = "https://coal.nic.in"
        self.stats_url = "https://coal.nic.in/public-information/monthly-statistics-at-glance"
        self.download_dir = "downloaded_pdfs"
        self.output_dir = "extracted_data"
        
        # Create directories if they don't exist
        os.makedirs(self.download_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)
    
    def get_pdf_links(self):
        """Fetch all PDF links from the statistics page"""
        print(f"Fetching PDF links from {self.stats_url}...")
        
        try:
            response = requests.get(self.stats_url, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            pdf_links = []
            
            # Find all links that contain .pdf
            for link in soup.find_all('a', href=re.compile(r'\.pdf$', re.IGNORECASE)):
                href = link.get('href')
                title = link.get('aria-label', '')
                
                # Extract month/year from the row
                parent_row = link.find_parent('tr')
                if parent_row:
                    title_cell = parent_row.find('td', class_='views-field-title')
                    if title_cell:
                        title = title_cell.get_text(strip=True)
                
                full_url = urljoin(self.base_url, href)
                pdf_links.append({
                    'title': title,
                    'url': full_url,
                    'filename': os.path.basename(href)
                })
            
            print(f"Found {len(pdf_links)} PDF files")
            return pdf_links
            
        except Exception as e:
            print(f"Error fetching PDF links: {e}")
            return []
    
    def download_pdf(self, pdf_info):
        """Download a single PDF file"""
        url = pdf_info['url']
        filename = pdf_info['filename']
        filepath = os.path.join(self.download_dir, filename)
        
        # Skip if already downloaded
        if os.path.exists(filepath):
            print(f"  ✓ Already exists: {filename}")
            return filepath
        
        try:
            print(f"  Downloading: {filename}...")
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            print(f"  ✓ Downloaded: {filename}")
            return filepath
            
        except Exception as e:
            print(f"  ✗ Error downloading {filename}: {e}")
            return None
    
    def download_all_pdfs(self, pdf_links, limit=None):
        """Download all PDFs"""
        print(f"\n{'='*60}")
        print("DOWNLOADING PDFs")
        print(f"{'='*60}\n")
        
        downloaded = []
        
        for i, pdf_info in enumerate(pdf_links[:limit] if limit else pdf_links):
            print(f"[{i+1}/{len(pdf_links)}] {pdf_info['title']}")
            filepath = self.download_pdf(pdf_info)
            
            if filepath:
                pdf_info['local_path'] = filepath
                downloaded.append(pdf_info)
            
            # Be polite to the server
            time.sleep(0.5)
        
        print(f"\n✓ Successfully downloaded {len(downloaded)} PDFs")
        return downloaded
    
    def save_metadata(self, pdf_links):
        """Save metadata about all PDFs"""
        metadata_file = os.path.join(self.output_dir, 'pdf_metadata.json')
        
        with open(metadata_file, 'w') as f:
            json.dump(pdf_links, f, indent=2)
        
        print(f"\n✓ Metadata saved to: {metadata_file}")
    
    def generate_summary(self, pdf_links):
        """Generate a summary report"""
        summary_file = os.path.join(self.output_dir, 'summary.txt')
        
        with open(summary_file, 'w') as f:
            f.write("COAL STATISTICS SCRAPING SUMMARY\n")
            f.write("="*60 + "\n\n")
            f.write(f"Total PDFs found: {len(pdf_links)}\n")
            f.write(f"Download directory: {os.path.abspath(self.download_dir)}\n")
            f.write(f"Output directory: {os.path.abspath(self.output_dir)}\n\n")
            f.write("PDF Files:\n")
            f.write("-"*60 + "\n")
            
            for i, pdf in enumerate(pdf_links, 1):
                f.write(f"{i}. {pdf['title']}\n")
                f.write(f"   File: {pdf['filename']}\n")
                if 'local_path' in pdf:
                    f.write(f"   ✓ Downloaded\n")
                f.write("\n")
        
        print(f"✓ Summary saved to: {summary_file}")

def main():
    print("""
╔════════════════════════════════════════════════════════════╗
║         COAL STATISTICS SCRAPER                            ║
║         coal.nic.in Monthly Statistics                     ║
╚════════════════════════════════════════════════════════════╝
    """)
    
    scraper = CoalStatsScraper()
    
    # Step 1: Get all PDF links
    pdf_links = scraper.get_pdf_links()
    
    if not pdf_links:
        print("No PDF links found. Exiting.")
        return
    
    # Step 2: Download PDFs (you can limit with limit=5 for testing)
    downloaded = scraper.download_all_pdfs(pdf_links)
    
    # Step 3: Save metadata
    scraper.save_metadata(downloaded)
    
    # Step 4: Generate summary
    scraper.generate_summary(downloaded)
    
    print(f"""
╔════════════════════════════════════════════════════════════╗
║                   SCRAPING COMPLETE!                       ║
╚════════════════════════════════════════════════════════════╝

Next Steps:
1. PDFs are in: {os.path.abspath(scraper.download_dir)}
2. Metadata in: {os.path.abspath(scraper.output_dir)}
3. Run pdf_extractor.py to extract data from PDFs
    """)

if __name__ == "__main__":
    main()
