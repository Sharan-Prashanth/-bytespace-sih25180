# Chart Data Generator API

A FastAPI service that generates JSON data for PERT charts, Bar charts, and Gantt charts.

## Features

- **PERT Chart**: Generate project scheduling data with critical path analysis
- **Bar Chart**: Create bar chart data with statistics
- **Gantt Chart**: Generate timeline-based project data

## Installation

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

## Running the Server

```bash
python main.py
```

The server will start on `http://localhost:8001`

## API Endpoints

### 1. Generate PERT Chart

**POST** `/api/pert-chart`

Request body:
```json
{
  "tasks": [
    {
      "id": "A",
      "name": "Task A",
      "duration": 5,
      "dependencies": []
    },
    {
      "id": "B",
      "name": "Task B",
      "duration": 10,
      "dependencies": ["A"]
    }
  ],
  "projectStartDate": "2025-01-01"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "A",
        "name": "Task A",
        "duration": 5,
        "dependencies": [],
        "earlyStart": 0,
        "earlyFinish": 5,
        "lateStart": 0,
        "lateFinish": 5,
        "slack": 0,
        "isCritical": true,
        "startDate": "2025-01-01",
        "endDate": "2025-01-06"
      }
    ],
    "projectDuration": 15,
    "criticalPath": ["A", "B"],
    "projectStartDate": "2025-01-01",
    "projectEndDate": "2025-01-16"
  },
  "chartType": "pert"
}
```

### 2. Generate Bar Chart

**POST** `/api/bar-chart`

Request body:
```json
{
  "title": "Monthly Sales",
  "data": [
    {
      "label": "January",
      "value": 45000,
      "color": "#3b82f6"
    },
    {
      "label": "February",
      "value": 52000
    }
  ],
  "xAxisLabel": "Month",
  "yAxisLabel": "Sales (₹)"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "chartType": "bar",
    "title": "Monthly Sales",
    "xAxisLabel": "Month",
    "yAxisLabel": "Sales (₹)",
    "data": [
      {
        "label": "January",
        "value": 45000,
        "color": "#3b82f6",
        "percentage": 46.39
      }
    ],
    "statistics": {
      "total": 97000,
      "average": 48500,
      "max": 52000,
      "min": 45000,
      "count": 2
    }
  }
}
```

### 3. Generate Gantt Chart

**POST** `/api/gantt-chart`

Same request format as PERT chart, returns timeline-formatted data.

### 4. Get Sample Data

**GET** `/api/sample/pert` - Get sample PERT chart data
**GET** `/api/sample/bar` - Get sample bar chart data

## Usage Examples

### Using cURL

```bash
# PERT Chart
curl -X POST http://localhost:8001/api/pert-chart \
  -H "Content-Type: application/json" \
  -d @sample_pert.json

# Bar Chart
curl -X POST http://localhost:8001/api/bar-chart \
  -H "Content-Type: application/json" \
  -d @sample_bar.json
```

### Using Python

```python
import requests

# PERT Chart
pert_data = {
    "tasks": [
        {"id": "A", "name": "Planning", "duration": 5, "dependencies": []},
        {"id": "B", "name": "Development", "duration": 10, "dependencies": ["A"]}
    ],
    "projectStartDate": "2025-01-01"
}

response = requests.post("http://localhost:8001/api/pert-chart", json=pert_data)
print(response.json())

# Bar Chart
bar_data = {
    "title": "Sales Data",
    "data": [
        {"label": "Q1", "value": 100000},
        {"label": "Q2", "value": 150000}
    ]
}

response = requests.post("http://localhost:8001/api/bar-chart", json=bar_data)
print(response.json())
```

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`
