# Coal Statistics Scraper

Automated scraper for coal statistics from coal.nic.in

## Features

- 🔍 Automatically finds all PDF links on the monthly statistics page
- 📥 Downloads all PDFs with progress tracking
- 📊 Extracts tables from PDFs to CSV and Excel
- 📝 Extracts text content
- 🎯 Identifies key statistics (production, dispatch, stock, etc.)
- 📁 Organized output structure

## Installation

### 1. Install Python dependencies:

```bash
pip install requests beautifulsoup4 PyPDF2 pdfplumber pandas openpyxl
```

### 2. Verify installation:

```bash
python3 -c "import requests, bs4, PyPDF2, pdfplumber, pandas; print('✓ All libraries installed')"
```

## Usage

### Step 1: Scrape and Download PDFs

```bash
python3 scraper.py
```

This will:
- Fetch all PDF links from the website
- Download all PDFs to `downloaded_pdfs/` directory
- Save metadata in `extracted_data/pdf_metadata.json`
- Generate a summary report

### Step 2: Extract Data from PDFs

```bash
python3 pdf_extractor.py
```

This will:
- Extract all tables from PDFs to CSV and Excel
- Save extracted text content
- Identify key statistics
- Generate extraction results

## Output Structure

```
coal_scrap/
├── scraper.py              # Main scraper script
├── pdf_extractor.py        # PDF data extraction script
├── downloaded_pdfs/        # All downloaded PDFs
│   ├── msg-oct23.pdf
│   ├── msg-sept23.pdf
│   └── ...
└── extracted_data/         # All extracted data
    ├── pdf_metadata.json   # Metadata about PDFs
    ├── summary.txt         # Summary report
    ├── extraction_results.json
    ├── tables/             # Extracted tables
    │   ├── msg-oct23_table_1.csv
    │   ├── msg-oct23_all_tables.xlsx
    │   └── ...
    └── text/               # Extracted text
        ├── msg-oct23_text.txt
        └── ...
```

## Dashboard Integration

The extracted data is dashboard-ready:

1. **CSV files**: Use for simple data loading
2. **Excel files**: Contains all tables from each PDF in separate sheets
3. **JSON metadata**: Contains PDF information and links
4. **Text files**: Full text content for search functionality

### Example: Loading data in Python

```python
import pandas as pd
import json

# Load metadata
with open('extracted_data/pdf_metadata.json') as f:
    metadata = json.load(f)

# Load a table
df = pd.read_csv('extracted_data/tables/msg-oct23_table_1.csv')

# Or load all tables from Excel
excel_file = pd.ExcelFile('extracted_data/tables/msg-oct23_all_tables.xlsx')
for sheet_name in excel_file.sheet_names:
    df = pd.read_excel(excel_file, sheet_name)
    print(f"Table: {sheet_name}")
    print(df.head())
```

## Advanced Options

### Download only recent PDFs (for testing):

Edit `scraper.py`, line with `download_all_pdfs()`:

```python
downloaded = scraper.download_all_pdfs(pdf_links, limit=5)  # Only download 5 PDFs
```

### Custom directories:

```python
scraper = CoalStatsScraper()
scraper.download_dir = "my_pdfs"
scraper.output_dir = "my_data"
```

## Troubleshooting

### SSL Certificate Error:
```bash
pip install --upgrade certifi
```

### Missing dependencies:
```bash
pip install --upgrade requests beautifulsoup4 PyPDF2 pdfplumber pandas openpyxl
```

### No PDFs found:
Check your internet connection and ensure the website is accessible:
```bash
curl -I https://coal.nic.in/public-information/monthly-statistics-at-glance
```

## Notes

- The scraper is polite and includes delays between downloads
- PDFs are only downloaded once (checks for existing files)
- All extracted data is saved in structured formats
- Compatible with Python 3.6+

## License

MIT License - Free to use and modify
