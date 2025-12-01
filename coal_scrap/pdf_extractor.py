#!/usr/bin/env python3
"""
PDF Data Extractor
Extracts tables and text data from coal statistics PDFs
"""

import os
import re
import json
import csv
from pathlib import Path

try:
    import PyPDF2
    import pdfplumber
    import pandas as pd
except ImportError:
    print("Required libraries not installed. Please run: pip install PyPDF2 pdfplumber pandas openpyxl")
    exit(1)

class PDFDataExtractor:
    def __init__(self, pdf_dir="downloaded_pdfs", output_dir="extracted_data"):
        self.pdf_dir = pdf_dir
        self.output_dir = output_dir
        self.tables_dir = os.path.join(output_dir, "tables")
        self.text_dir = os.path.join(output_dir, "text")
        
        os.makedirs(self.tables_dir, exist_ok=True)
        os.makedirs(self.text_dir, exist_ok=True)
    
    def extract_text_from_pdf(self, pdf_path):
        """Extract raw text from PDF"""
        try:
            text = ""
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
            return text
        except Exception as e:
            print(f"  Error extracting text: {e}")
            return None
    
    def extract_tables_from_pdf(self, pdf_path):
        """Extract tables from PDF using pdfplumber"""
        tables = []
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    page_tables = page.extract_tables()
                    
                    for table_num, table in enumerate(page_tables, 1):
                        if table:
                            tables.append({
                                'page': page_num,
                                'table_number': table_num,
                                'data': table
                            })
            
            return tables
            
        except Exception as e:
            print(f"  Error extracting tables: {e}")
            return []
    
    def save_table_as_csv(self, table_data, filename, table_num):
        """Save a single table as CSV"""
        csv_filename = f"{filename}_table_{table_num}.csv"
        csv_path = os.path.join(self.tables_dir, csv_filename)
        
        try:
            with open(csv_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerows(table_data)
            return csv_path
        except Exception as e:
            print(f"  Error saving CSV: {e}")
            return None
    
    def save_table_as_excel(self, all_tables, filename):
        """Save all tables from a PDF as Excel with multiple sheets"""
        excel_filename = f"{filename}_all_tables.xlsx"
        excel_path = os.path.join(self.tables_dir, excel_filename)
        
        try:
            with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
                for i, table_info in enumerate(all_tables, 1):
                    df = pd.DataFrame(table_info['data'])
                    sheet_name = f"Page{table_info['page']}_Table{i}"[:31]  # Excel sheet name limit
                    df.to_excel(writer, sheet_name=sheet_name, index=False, header=False)
            
            return excel_path
        except Exception as e:
            print(f"  Error saving Excel: {e}")
            return None
    
    def save_text(self, text, filename):
        """Save extracted text"""
        text_filename = f"{filename}_text.txt"
        text_path = os.path.join(self.text_dir, text_filename)
        
        try:
            with open(text_path, 'w', encoding='utf-8') as f:
                f.write(text)
            return text_path
        except Exception as e:
            print(f"  Error saving text: {e}")
            return None
    
    def extract_key_statistics(self, text):
        """Extract key statistics from text using patterns"""
        stats = {}
        
        # Common patterns in coal statistics
        patterns = {
            'production': r'(?i)production[:\s]+([0-9,.]+)',
            'dispatch': r'(?i)dispatch[:\s]+([0-9,.]+)',
            'stock': r'(?i)stock[:\s]+([0-9,.]+)',
            'offtake': r'(?i)offtake[:\s]+([0-9,.]+)',
            'import': r'(?i)import[:\s]+([0-9,.]+)',
            'export': r'(?i)export[:\s]+([0-9,.]+)',
        }
        
        for key, pattern in patterns.items():
            match = re.search(pattern, text)
            if match:
                stats[key] = match.group(1)
        
        return stats
    
    def process_pdf(self, pdf_path):
        """Process a single PDF file"""
        filename = Path(pdf_path).stem
        print(f"\nProcessing: {filename}")
        
        results = {
            'filename': filename,
            'text_extracted': False,
            'tables_extracted': 0,
            'files_created': []
        }
        
        # Extract text
        print("  Extracting text...")
        text = self.extract_text_from_pdf(pdf_path)
        if text:
            text_path = self.save_text(text, filename)
            if text_path:
                results['text_extracted'] = True
                results['files_created'].append(text_path)
                print(f"  ✓ Text saved")
                
                # Extract key statistics
                key_stats = self.extract_key_statistics(text)
                if key_stats:
                    results['key_statistics'] = key_stats
        
        # Extract tables
        print("  Extracting tables...")
        tables = self.extract_tables_from_pdf(pdf_path)
        
        if tables:
            # Save each table as CSV
            for i, table_info in enumerate(tables, 1):
                csv_path = self.save_table_as_csv(table_info['data'], filename, i)
                if csv_path:
                    results['files_created'].append(csv_path)
            
            # Save all tables as Excel
            excel_path = self.save_table_as_excel(tables, filename)
            if excel_path:
                results['files_created'].append(excel_path)
            
            results['tables_extracted'] = len(tables)
            print(f"  ✓ Extracted {len(tables)} tables")
        else:
            print("  ℹ No tables found")
        
        return results
    
    def process_all_pdfs(self):
        """Process all PDFs in the directory"""
        pdf_files = list(Path(self.pdf_dir).glob("*.pdf"))
        
        if not pdf_files:
            print(f"No PDF files found in {self.pdf_dir}")
            return []
        
        print(f"\n{'='*60}")
        print(f"EXTRACTING DATA FROM {len(pdf_files)} PDFs")
        print(f"{'='*60}")
        
        results = []
        
        for i, pdf_path in enumerate(pdf_files, 1):
            print(f"\n[{i}/{len(pdf_files)}]", end=" ")
            result = self.process_pdf(str(pdf_path))
            results.append(result)
        
        # Save processing results
        results_file = os.path.join(self.output_dir, 'extraction_results.json')
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n\n{'='*60}")
        print("EXTRACTION COMPLETE!")
        print(f"{'='*60}")
        print(f"✓ Processed: {len(pdf_files)} PDFs")
        print(f"✓ Tables directory: {os.path.abspath(self.tables_dir)}")
        print(f"✓ Text directory: {os.path.abspath(self.text_dir)}")
        print(f"✓ Results saved: {results_file}")
        
        return results

def main():
    print("""
╔════════════════════════════════════════════════════════════╗
║              PDF DATA EXTRACTOR                            ║
║         Extract tables and text from PDFs                  ║
╚════════════════════════════════════════════════════════════╝
    """)
    
    extractor = PDFDataExtractor()
    results = extractor.process_all_pdfs()
    
    # Print summary
    total_tables = sum(r['tables_extracted'] for r in results)
    total_text = sum(1 for r in results if r['text_extracted'])
    
    print(f"""
Summary:
- Total PDFs processed: {len(results)}
- Total tables extracted: {total_tables}
- Text extracted from: {total_text} PDFs
- All data saved in: {os.path.abspath(extractor.output_dir)}

You can now use the extracted CSV/Excel files in your dashboard!
    """)

if __name__ == "__main__":
    main()
