#!/usr/bin/env python3
"""
Consolidate all CSV files into a single Excel file with multiple sheets
"""

import os
import pandas as pd
from openpyxl import Workbook
from openpyxl.utils.dataframe import dataframe_to_rows
import glob

def consolidate_csvs_to_excel():
    """Consolidate all CSV files into one Excel file"""
    
    print("╔════════════════════════════════════════════════════════════╗")
    print("║     CSV TO EXCEL CONSOLIDATOR                              ║")
    print("╚════════════════════════════════════════════════════════════╝\n")
    
    # Paths
    tables_dir = "extracted_data/tables"
    output_file = "extracted_data/coal_statistics_all_data.xlsx"
    
    # Get all CSV files
    csv_files = sorted(glob.glob(os.path.join(tables_dir, "*.csv")))
    
    if not csv_files:
        print("❌ No CSV files found!")
        return
    
    print(f"Found {len(csv_files)} CSV files\n")
    print("Creating Excel file with sheets...")
    
    # Create Excel writer
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        sheet_count = 0
        errors = []
        
        for csv_file in csv_files:
            try:
                # Get filename without extension
                filename = os.path.basename(csv_file)
                sheet_name = filename.replace('.csv', '')
                
                # Excel sheet names are limited to 31 characters
                if len(sheet_name) > 31:
                    # Create abbreviated name
                    parts = sheet_name.split('_')
                    if len(parts) >= 2:
                        sheet_name = f"{parts[0][:20]}_t{parts[-1]}"
                    sheet_name = sheet_name[:31]
                
                # Read CSV
                df = pd.read_csv(csv_file)
                
                # Skip empty dataframes
                if df.empty:
                    continue
                
                # Write to Excel
                df.to_excel(writer, sheet_name=sheet_name, index=False)
                sheet_count += 1
                
                if sheet_count % 50 == 0:
                    print(f"  Processed {sheet_count} sheets...")
                
            except Exception as e:
                errors.append(f"{filename}: {str(e)}")
                continue
    
    print(f"\n✓ Successfully created Excel file with {sheet_count} sheets!")
    print(f"✓ Output file: {output_file}")
    
    # Get file size
    file_size = os.path.getsize(output_file)
    size_mb = file_size / (1024 * 1024)
    print(f"✓ File size: {size_mb:.2f} MB")
    
    if errors:
        print(f"\n⚠ {len(errors)} files had errors:")
        for error in errors[:10]:  # Show first 10 errors
            print(f"  - {error}")
        if len(errors) > 10:
            print(f"  ... and {len(errors) - 10} more")
    
    print("\n" + "="*60)
    print("CONSOLIDATION COMPLETE!")
    print("="*60)
    print(f"\nYour single Excel file is ready:")
    print(f"📊 {os.path.abspath(output_file)}")

if __name__ == "__main__":
    consolidate_csvs_to_excel()
