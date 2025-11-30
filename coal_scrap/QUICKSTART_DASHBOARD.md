# 🎉 Coal Statistics Dashboard - Quick Guide

## ✅ What's Been Created

### 1. **Interactive Dashboard** 📊
- **Location**: `dashboard/index.html`
- **Features**:
  - 📊 Bar chart for subsidiary production
  - 🥧 Pie chart for market share
  - 📈 Line chart for trends
  - 🍩 Doughnut chart for target achievement
  - 📋 Detailed data table
  - 🎛️ Year and month filters

### 2. **Data Files** 📁

#### Extracted Data:
- **1,158 CSV files** - Individual tables from PDFs
- **51 Excel sheets** - One consolidated file
- **51 Text files** - Full PDF text content
- **Location**: `extracted_data/` folder

#### Consolidated Excel:
- **File**: `extracted_data/coal_statistics_all_data.xlsx`
- **Size**: 1.7 MB
- **Sheets**: 1,145 sheets (all data in one file!)

#### Dashboard Data:
- **File**: `dashboard/data.js`
- **Contains**: Real data from 20 months (2022-2024)

### 3. **Documentation** 📖
- **DASHBOARD_README.md** - Complete guide to the dashboard
  - Data coverage details
  - Year-wise breakdown
  - How to use the dashboard
  - Metrics explanation

## 🚀 How to Use

### Open the Dashboard:
```bash
# Option 1: Open directly in browser
xdg-open dashboard/index.html

# Option 2: Use the file path
firefox dashboard/index.html
# or
google-chrome dashboard/index.html
```

### Or manually:
1. Navigate to: `/home/aksshay88/Desktop/projects/coal_scrap/dashboard/`
2. Double-click `index.html`
3. It will open in your default browser

## 📊 Data Coverage

### Years Available:
- **2021**: 6 months (Jul-Dec)
- **2022**: 11 months (missing Aug)
- **2023**: 12 months (complete year)
- **2024**: 12 months (complete year)
- **2025**: 10 months (Jan-Oct)

### Total: 51 months of data!

## 🎨 Dashboard Features

### Visualizations:
1. **Bar Chart** - Compare production by subsidiary
2. **Pie Chart** - Market share distribution
3. **Line Chart** - Monthly trends
4. **Doughnut Chart** - Target vs Achievement

### Statistics Cards:
- Total Production (MT)
- CIL Production
- SCCL Production
- Growth Rate (%)

### Filters:
- **Year**: 2021, 2022, 2023, 2024, 2025, or All
- **Month**: Any month or All months

## 📂 Project Structure

```
coal_scrap/
├── dashboard/
│   ├── index.html          ← Main dashboard (OPEN THIS!)
│   ├── dashboard.js        ← Dashboard logic
│   └── data.js            ← Real data from CSVs
│
├── extracted_data/
│   ├── coal_statistics_all_data.xlsx  ← All data in Excel
│   ├── tables/            ← 1,158 CSV files
│   ├── text/              ← PDF text extracts
│   └── extraction_results.json
│
├── downloaded_pdfs/       ← 51 original PDFs
│
├── DASHBOARD_README.md    ← Full documentation
├── README.md              ← Project readme
├── scraper.py             ← PDF downloader
├── pdf_extractor.py       ← Data extractor
├── run_all.py             ← Run everything
└── generate_dashboard_data.py  ← Create dashboard data
```

## 🔄 Update Data (Future)

When new monthly data is released:
```bash
# 1. Run the scraper and extractor
python run_all.py

# 2. Generate new dashboard data
python generate_dashboard_data.py

# 3. Refresh your browser
```

## 💡 Quick Tips

### View Specific Data:
- Select **Year: 2024** → See all 2024 data
- Select **Month: October** → Compare October across all years
- Select **Year: 2024, Month: October** → See Oct 2024 only

### Export Data:
- Open `coal_statistics_all_data.xlsx` in Excel/LibreOffice
- Each sheet = one table from the PDFs
- 1,145 sheets total!

### Read Documentation:
- Open `DASHBOARD_README.md` for complete details
- Explains all metrics and data sources

## 🎯 What You Can Do Now

### 1. **View the Dashboard** ✅
```bash
xdg-open dashboard/index.html
```

### 2. **Access the Excel File** ✅
```bash
libreoffice extracted_data/coal_statistics_all_data.xlsx
```

### 3. **Read the Documentation** ✅
```bash
cat DASHBOARD_README.md
```

## 📊 Sample Data Shown

The dashboard currently shows real data extracted from:
- 20+ months of coal production statistics
- Multiple subsidiaries (ECL, BCCL, CCL, NCL, WCL, SECL, MCL, NEC)
- CIL and SCCL totals
- Production, targets, achievements, and growth rates

## 🎨 Dashboard Preview

When you open it, you'll see:
- **Beautiful purple gradient background**
- **White cards with statistics**
- **Interactive charts** (hover for details)
- **Filterable data table**
- **Responsive design** (works on mobile too!)

## ✨ Success!

Everything is ready! Just open `dashboard/index.html` in your browser! 🎉

---

**Dashboard Location**: `/home/aksshay88/Desktop/projects/coal_scrap/dashboard/index.html`
**Excel File**: `/home/aksshay88/Desktop/projects/coal_scrap/extracted_data/coal_statistics_all_data.xlsx`
**Documentation**: `/home/aksshay88/Desktop/projects/coal_scrap/DASHBOARD_README.md`
