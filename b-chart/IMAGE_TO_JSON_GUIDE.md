# 📸 Image to JSON - User Guide

## ✅ YES! It Can Convert Chart Images to JSON!

Your API now has **AI-powered image recognition** that can:
- Upload any chart image (bar chart, PERT chart, Gantt chart, etc.)
- Extract data automatically using Google Gemini Vision AI
- Return structured JSON data

---

## 🚀 How to Use

### **Method 1: Web Browser (Interactive)** ⭐ EASIEST

1. Open: **http://localhost:8001/docs**
2. Find the endpoint: **`POST /api/image-to-json`**
3. Click **"Try it out"**
4. Click **"Choose File"** and select your chart image
5. Select chart_type: `auto`, `bar`, or `pert`
6. Click **"Execute"**
7. **See JSON output below!** 🎉

### **Method 2: Python Script**

```python
import requests

# Upload bar chart image
with open('my_chart.png', 'rb') as f:
    files = {'file': ('chart.png', f, 'image/png')}
    data = {'chart_type': 'auto'}
    
    response = requests.post(
        'http://localhost:8001/api/image-to-json',
        files=files,
        data=data
    )
    
    print(response.json())
```

### **Method 3: cURL Command**

```bash
curl -X POST "http://localhost:8001/api/image-to-json" \
  -F "file=@your_chart.png" \
  -F "chart_type=auto"
```

---

## 📊 Supported Chart Types

| Chart Type | Description | JSON Output |
|------------|-------------|-------------|
| **Bar Chart** | Vertical/horizontal bars | Labels, values, colors |
| **PERT Chart** | Project network diagram | Tasks, dependencies, durations |
| **Gantt Chart** | Timeline view | Tasks with start/end dates |
| **Auto** | AI detects type | Appropriate structure |

---

## 📤 API Endpoints

### 1. **General Image to JSON**
```
POST /api/image-to-json
```
- **Parameters:**
  - `file`: Image file (PNG, JPG, JPEG)
  - `chart_type`: "auto", "bar", "pert", "line", "pie"

### 2. **Bar Chart Only**
```
POST /api/bar-chart-from-image
```
- Optimized for bar/column charts

### 3. **PERT Chart Only**
```
POST /api/pert-chart-from-image
```
- Optimized for PERT/Gantt charts

---

## 💡 Example Outputs

### Bar Chart → JSON
```json
{
  "success": true,
  "filename": "sales_chart.png",
  "detectedType": "bar",
  "data": {
    "chartType": "bar",
    "title": "Monthly Sales",
    "data": [
      {"label": "Jan", "value": 45000},
      {"label": "Feb", "value": 52000},
      {"label": "Mar", "value": 48000}
    ],
    "xAxisLabel": "Month",
    "yAxisLabel": "Sales (₹)"
  }
}
```

### PERT Chart → JSON
```json
{
  "success": true,
  "filename": "project_chart.png",
  "detectedType": "pert",
  "data": {
    "chartType": "pert",
    "projectTitle": "Software Development",
    "tasks": [
      {
        "id": "A",
        "name": "Planning",
        "duration": 5,
        "dependencies": [],
        "startDate": "2025-01-01"
      },
      {
        "id": "B",
        "name": "Development",
        "duration": 20,
        "dependencies": ["A"],
        "startDate": "2025-01-06"
      }
    ],
    "projectStartDate": "2025-01-01"
  }
}
```

---

## 🧪 Test It Now

1. **Find or create a chart image** (screenshot a chart from Excel, PowerPoint, etc.)
2. **Save it** to your computer
3. **Open**: http://localhost:8001/docs
4. **Try the `/api/image-to-json` endpoint**
5. **Upload your image** and get JSON! ✨

---

## 📝 Tips for Best Results

✅ **DO:**
- Use clear, high-resolution images
- Ensure text/labels are readable
- Use standard chart formats

❌ **AVOID:**
- Blurry or low-quality images
- Heavily stylized charts
- Charts with overlapping elements

---

## 🔧 Troubleshooting

**Problem:** "Error processing image"
- **Solution:** Check image format (PNG, JPG only)

**Problem:** Inaccurate data extraction
- **Solution:** Use `chart_type` parameter instead of "auto"

**Problem:** Server not responding
- **Solution:** Check if server is running on port 8001

---

## ✨ That's It!

You can now **upload any chart image** and get **JSON data** instantly! 🎯
