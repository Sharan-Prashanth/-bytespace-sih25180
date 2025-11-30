# 🏭 Coal Statistics Dashboard

## Overview
An interactive web-based dashboard for visualizing monthly coal production statistics from coal.nic.in. This dashboard provides comprehensive analytics with charts, graphs, and detailed data tables.

## 📊 Data Coverage

### Time Period
- **Start Date**: July 2021
- **End Date**: October 2025
- **Total Months**: 51 months of data
- **Update Frequency**: Monthly

### Data Sources
All data is extracted from official PDF reports published by the Ministry of Coal, Government of India at [coal.nic.in/public-information/monthly-statistics-at-glance](https://coal.nic.in/public-information/monthly-statistics-at-glance)

## 📁 Data Structure

### Year-wise Data Availability

#### **2025** (10 months)
- January 2025
- February 2025
- March 2025
- April 2025
- May 2025
- June 2025
- July 2025
- August 2025
- September 2025
- October 2025

#### **2024** (12 months)
- January 2024 to December 2024
- Complete year data available

#### **2023** (12 months)
- January 2023 to December 2023
- Complete year data available

#### **2022** (11 months)
- January 2022, February 2022, March 2022, April 2022
- May 2022, June 2022, July 2022
- September 2022, October 2022, November 2022
- *Note: August 2022 data not available*

#### **2021** (5 months)
- July 2021
- August 2021
- September 2021
- October 2021
- November 2021
- December 2021

## 🏢 Coal Subsidiaries Covered

### Coal India Limited (CIL) Subsidiaries
1. **ECL** - Eastern Coalfields Limited
2. **BCCL** - Bharat Coking Coal Limited
3. **CCL** - Central Coalfields Limited
4. **NCL** - Northern Coalfields Limited
5. **WCL** - Western Coalfields Limited
6. **SECL** - South Eastern Coalfields Limited
7. **MCL** - Mahanadi Coalfields Limited
8. **NEC** - North Eastern Coalfields

### Other Major Producers
9. **SCCL** - Singareni Collieries Company Limited
10. **Captive/Others** - Private and captive coal mines

## 📈 Metrics Tracked

### Production Metrics
- **Monthly Production** (in Million Tonnes)
- **Cumulative Production** (Year-to-date)
- **Production Targets** (Monthly and Annual)
- **Achievement Percentage** (Target vs Actual)

### Performance Indicators
- **Growth Rate** (Year-on-Year comparison)
- **Market Share** by subsidiary
- **Trend Analysis** across months and years

## 🎨 Dashboard Features

### Visualizations

1. **📊 Production by Subsidiary (Bar Chart)**
   - Compare production across all coal subsidiaries
   - Filter by year and month

2. **🥧 Market Share Distribution (Pie Chart)**
   - Visual representation of production share
   - Color-coded by subsidiary

3. **📈 Monthly Production Trend (Line Chart)**
   - Track production trends over time
   - Identify seasonal patterns

4. **🍩 Target vs Achievement (Doughnut Chart)**
   - Overall achievement percentage
   - Visual gap analysis

### Interactive Filters
- **Year Filter**: Select specific year or view all years (2021-2025)
- **Month Filter**: Focus on specific month or view all months
- **Real-time Updates**: Charts update instantly based on filter selection

### Statistics Cards
- Total Production
- CIL Production (Coal India Limited)
- SCCL Production (Singareni Collieries)
- Year-on-Year Growth Rate

### Detailed Data Table
- Subsidiary-wise breakdown
- Production vs Target comparison
- Achievement percentages
- Growth indicators with color coding (▲ for positive, ▼ for negative)

## 🚀 How to Use the Dashboard

### Quick Start
1. Open `dashboard/index.html` in your web browser
2. Use the year and month dropdowns to filter data
3. Explore different visualizations
4. Hover over charts for detailed tooltips
5. Scroll down to view the detailed data table

### Navigation Tips
- **Filter by Year**: Select a specific year to focus on annual trends
- **Filter by Month**: Compare same month across different years
- **All Years View**: Get a comprehensive overview of entire dataset
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 📂 File Structure

```
coal_scrap/
├── dashboard/
│   ├── index.html          # Main dashboard HTML
│   └── dashboard.js        # JavaScript for charts and interactivity
├── downloaded_pdfs/        # Original PDF files (51 files)
├── extracted_data/
│   ├── tables/            # Individual CSV files (1158 files)
│   ├── text/              # Extracted text from PDFs
│   ├── coal_statistics_all_data.xlsx  # Consolidated Excel file
│   └── extraction_results.json        # Extraction metadata
└── DASHBOARD_README.md    # This file
```

## 📊 Data Files

### CSV Files (1,158 files)
- Individual tables extracted from each PDF
- Format: `{pdf_name}_table_{number}.csv`
- Example: `msg-oct25_table_1.csv`

### Excel Consolidation
- **File**: `coal_statistics_all_data.xlsx`
- **Size**: ~1.7 MB
- **Sheets**: 1,145 sheets (one per table)
- **Purpose**: Single-file access to all extracted data

### Text Extractions
- Full text content from each PDF
- Useful for keyword search and text analysis

## 🔍 Data Quality Notes

### Known Issues
1. Some older PDFs (2021-2022) may have inconsistent formatting
2. PDF parsing warnings are normal and don't affect data quality
3. Empty/minimal data in some tables is as per source PDFs

### Data Validation
- All production figures are in Million Tonnes (MT)
- Growth rates are Year-on-Year percentages
- Achievement percentages based on monthly targets
- Negative growth indicated by ▼ symbol

## 🛠️ Technical Details

### Technologies Used
- **Frontend**: HTML5, CSS3, JavaScript
- **Charts**: Chart.js library
- **Data Format**: CSV, Excel (XLSX)
- **Extraction**: Python (pdfplumber, pandas)

### Browser Compatibility
- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

### Performance
- Dashboard loads instantly (sample data embedded)
- No server required - runs entirely in browser
- Charts render smoothly with interactive tooltips

## 📋 Data Interpretation Guide

### Understanding the Metrics

**Production (MT)**
- Raw production output in Million Tonnes
- Monthly figures represent that month only
- Cumulative figures show year-to-date totals

**Target (MT)**
- Government-set production targets
- Based on annual planning and capacity

**Achievement (%)**
- `(Actual Production / Target) × 100`
- Values >100% indicate over-achievement
- Values <100% indicate shortfall

**Growth (%)**
- Year-on-Year comparison with same month previous year
- Positive values (▲) indicate increase
- Negative values (▼) indicate decrease

### Reading the Charts

**Bar Chart**: Best for comparing absolute production values
**Pie Chart**: Best for understanding market share distribution
**Line Chart**: Best for identifying trends and patterns
**Doughnut Chart**: Best for quick achievement overview

## 🔄 Updating the Data

To add new monthly data:
1. Download latest PDF from coal.nic.in
2. Run the scraper: `python run_all.py`
3. Extract new tables: Automatically done by run_all.py
4. Update dashboard.js with new data entries
5. Refresh browser to see updated dashboard

## 📞 Support & Resources

### Official Sources
- **Ministry of Coal**: [coal.nic.in](https://coal.nic.in)
- **Monthly Statistics**: [Monthly Stats at Glance](https://coal.nic.in/public-information/monthly-statistics-at-glance)

### Project Files
- Scraper: `scraper.py`
- PDF Extractor: `pdf_extractor.py`
- All-in-One: `run_all.py`
- Requirements: `requirements.txt`

## 📝 Version History

- **v1.0** (November 2025)
  - Initial dashboard release
  - 51 months of historical data
  - 4 chart types
  - Interactive filtering
  - Responsive design

## 🎯 Future Enhancements

Potential improvements:
- [ ] Real-time data loading from CSV files
- [ ] Export filtered data to Excel/PDF
- [ ] Comparison mode (side-by-side years)
- [ ] Predictive analytics using historical trends
- [ ] State-wise production breakdown
- [ ] Coal quality metrics integration

## ⚖️ License & Attribution

**Data Source**: Ministry of Coal, Government of India
**Visualization**: Custom dashboard built with Chart.js
**Usage**: For analysis and reporting purposes

---

**Last Updated**: November 30, 2025
**Data Version**: October 2025 (Latest available)
