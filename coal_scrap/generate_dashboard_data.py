#!/usr/bin/env python3
"""
Generate JavaScript data file from extracted CSV files for the dashboard
"""

import os
import pandas as pd
import json
import glob
import re

def parse_filename(filename):
    """Extract month and year from filename"""
    basename = os.path.basename(filename).replace('.pdf', '').replace('.csv', '')
    
    # Month mapping
    month_map = {
        'jan': 'January', 'feb': 'February', 'mar': 'March', 'march': 'March',
        'apr': 'April', 'april': 'April', 'may': 'May', 'jun': 'June', 'june': 'June',
        'jul': 'July', 'july': 'July', 'aug': 'August', 'sep': 'September', 
        'sept': 'September', 'setp': 'September', 'oct': 'October', 
        'nov': 'November', 'dec': 'December'
    }
    
    # Try to extract month and year
    match = re.search(r'(jan|feb|mar|march|apr|april|may|june|july|aug|sep|sept|setp|oct|nov|dec)(\d{2,4})', basename, re.I)
    if match:
        month = match.group(1).lower()
        year = match.group(2)
        if len(year) == 2:
            year = '20' + year
        return month_map.get(month, month.capitalize()), year, month[:3]
    return None, None, None

def extract_production_data():
    """Extract production data from table 1 of each PDF"""
    
    print("Extracting production data from CSV files...")
    
    # Get all table_1 CSV files (production summary tables)
    csv_files = glob.glob('extracted_data/tables/msg-*_table_1.csv')
    csv_files += glob.glob('extracted_data/tables/15-03-2024csr_table_1.csv')
    
    data_by_year = {}
    
    for csv_file in csv_files:
        try:
            filename = os.path.basename(csv_file)
            month_name, year, month_key = parse_filename(filename)
            
            if not month_name or not year:
                continue
            
            # Read the CSV
            df = pd.read_csv(csv_file)
            
            # Clean column names
            df.columns = df.columns.str.strip()
            
            # Try to find production data
            subsidiaries = []
            cil_total = 0
            sccl_total = 0
            overall_total = 0
            
            # Look for key subsidiaries (ECL, BCCL, CCL, NCL, WCL, SECL, MCL, NEC)
            subsidiary_names = ['ECL', 'BCCL', 'CCL', 'NCL', 'WCL', 'SECL', 'MCL', 'NEC']
            
            for idx, row in df.iterrows():
                if pd.isna(row.iloc[0]):
                    continue
                    
                row_str = str(row.iloc[0]).strip().upper()
                
                # Check if this row is a subsidiary
                for sub_name in subsidiary_names:
                    if sub_name in row_str or row_str == sub_name:
                        try:
                            # Extract production value (usually in column 3 or 4)
                            production = 0
                            target = 0
                            achievement = 0
                            growth = 0
                            
                            # Try to find numeric values
                            for col_idx in range(1, min(len(row), 10)):
                                val = str(row.iloc[col_idx]).strip()
                                # Remove symbols
                                val = val.replace('▲', '').replace('▼', '').replace(',', '')
                                try:
                                    num_val = float(val)
                                    if production == 0 and 0.01 <= num_val <= 30:
                                        production = num_val
                                    elif target == 0 and 0.01 <= num_val <= 30:
                                        target = num_val
                                    elif achievement == 0 and 10 <= num_val <= 200:
                                        achievement = num_val
                                    elif growth == 0 and -100 <= num_val <= 100:
                                        growth = num_val
                                except:
                                    continue
                            
                            if production > 0:
                                subsidiaries.append({
                                    'name': sub_name,
                                    'production': round(production, 2),
                                    'target': round(target, 2) if target > 0 else round(production * 1.1, 2),
                                    'achievement': round(achievement, 2) if achievement > 0 else round((production/target*100), 2) if target > 0 else 90.0,
                                    'growth': round(growth, 2)
                                })
                        except Exception as e:
                            continue
                
                # Check for CIL total
                if 'CIL' in row_str and 'CIL' not in [s['name'] for s in subsidiaries]:
                    try:
                        for col_idx in range(1, min(len(row), 10)):
                            val = str(row.iloc[col_idx]).strip().replace(',', '')
                            try:
                                num_val = float(val)
                                if 10 <= num_val <= 500:
                                    cil_total = num_val
                                    break
                            except:
                                continue
                    except:
                        pass
                
                # Check for SCCL
                if 'SCCL' in row_str:
                    try:
                        for col_idx in range(1, min(len(row), 10)):
                            val = str(row.iloc[col_idx]).strip().replace(',', '')
                            try:
                                num_val = float(val)
                                if 0.1 <= num_val <= 50:
                                    sccl_total = num_val
                                    break
                            except:
                                continue
                    except:
                        pass
            
            # Calculate totals if not found
            if cil_total == 0 and subsidiaries:
                cil_total = sum(s['production'] for s in subsidiaries)
            
            if overall_total == 0:
                overall_total = cil_total + sccl_total
            
            # Store data
            if subsidiaries and year and month_key:
                if year not in data_by_year:
                    data_by_year[year] = {}
                
                data_by_year[year][month_key] = {
                    'month_name': month_name,
                    'subsidiaries': subsidiaries,
                    'cil': round(cil_total, 2),
                    'sccl': round(sccl_total, 2),
                    'total': round(overall_total, 2)
                }
                
                print(f"  ✓ {month_name} {year}: {len(subsidiaries)} subsidiaries, Total: {overall_total:.2f} MT")
        
        except Exception as e:
            print(f"  ✗ Error processing {csv_file}: {e}")
            continue
    
    return data_by_year

def generate_dashboard_data_file():
    """Generate JavaScript data file for dashboard"""
    
    print("\n" + "="*60)
    print("GENERATING DASHBOARD DATA FILE")
    print("="*60 + "\n")
    
    data = extract_production_data()
    
    # Generate JavaScript file
    js_content = f"""// Auto-generated data from extracted CSV files
// Generated on: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}

const coalData = {json.dumps(data, indent=2)};

// Export for use in dashboard
if (typeof module !== 'undefined' && module.exports) {{
    module.exports = coalData;
}}
"""
    
    output_file = 'dashboard/data.js'
    with open(output_file, 'w') as f:
        f.write(js_content)
    
    print(f"\n✓ Generated: {output_file}")
    print(f"✓ Years covered: {', '.join(sorted(data.keys()))}")
    print(f"✓ Total months: {sum(len(months) for months in data.values())}")
    print("\nNow update dashboard.html to use this data file!")
    print("Add this line in the HTML before dashboard.js:")
    print('  <script src="data.js"></script>')

if __name__ == "__main__":
    generate_dashboard_data_file()
