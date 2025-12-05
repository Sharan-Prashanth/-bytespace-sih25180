from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import google.generativeai as genai
import base64
from PIL import Image
import io
import json

# Load environment variables
load_dotenv()

# Configure Gemini AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDR9K3ZR0WEgcuZ9HcF59L1qGZa3ZyT5Zs")
genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="Chart Data Generator API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Models ====================

class Task(BaseModel):
    id: str
    name: str
    duration: int  # in days
    dependencies: List[str] = []
    startDate: Optional[str] = None
    endDate: Optional[str] = None

class PERTChartRequest(BaseModel):
    tasks: List[Task]
    projectStartDate: Optional[str] = None

class BarChartDataPoint(BaseModel):
    label: str
    value: float
    color: Optional[str] = None

class BarChartRequest(BaseModel):
    title: str
    data: List[BarChartDataPoint]
    xAxisLabel: Optional[str] = "Categories"
    yAxisLabel: Optional[str] = "Values"

class TimelineTask(BaseModel):
    id: str
    name: str
    start: str
    end: str
    progress: Optional[float] = 0
    dependencies: List[str] = []

# ==================== Helper Functions ====================

def calculate_pert_schedule(tasks: List[Task], start_date: str = None):
    """
    Calculate PERT chart schedule with earliest/latest start and finish times
    """
    if start_date is None:
        start_date = datetime.now().strftime("%Y-%m-%d")
    
    project_start = datetime.strptime(start_date, "%Y-%m-%d")
    
    # Create task dictionary
    task_dict = {task.id: task for task in tasks}
    
    # Calculate Early Start (ES) and Early Finish (EF)
    es = {}
    ef = {}
    
    def calculate_early_times(task_id):
        if task_id in es:
            return es[task_id], ef[task_id]
        
        task = task_dict[task_id]
        
        if not task.dependencies:
            es[task_id] = 0
        else:
            max_ef = 0
            for dep_id in task.dependencies:
                if dep_id in task_dict:
                    _, dep_ef = calculate_early_times(dep_id)
                    max_ef = max(max_ef, dep_ef)
            es[task_id] = max_ef
        
        ef[task_id] = es[task_id] + task.duration
        return es[task_id], ef[task_id]
    
    # Calculate for all tasks
    for task_id in task_dict.keys():
        calculate_early_times(task_id)
    
    # Calculate project duration
    project_duration = max(ef.values())
    
    # Calculate Late Finish (LF) and Late Start (LS)
    lf = {}
    ls = {}
    
    def calculate_late_times(task_id):
        if task_id in lf:
            return ls[task_id], lf[task_id]
        
        task = task_dict[task_id]
        
        # Find tasks that depend on this one
        dependents = [tid for tid, t in task_dict.items() if task_id in t.dependencies]
        
        if not dependents:
            lf[task_id] = project_duration
        else:
            min_ls = project_duration
            for dep_id in dependents:
                dep_ls, _ = calculate_late_times(dep_id)
                min_ls = min(min_ls, dep_ls)
            lf[task_id] = min_ls
        
        ls[task_id] = lf[task_id] - task.duration
        return ls[task_id], lf[task_id]
    
    # Calculate for all tasks
    for task_id in task_dict.keys():
        calculate_late_times(task_id)
    
    # Calculate slack and critical path
    result_tasks = []
    critical_path = []
    
    for task in tasks:
        task_id = task.id
        slack = ls[task_id] - es[task_id]
        is_critical = slack == 0
        
        if is_critical:
            critical_path.append(task_id)
        
        start_date_calc = project_start + timedelta(days=es[task_id])
        end_date_calc = project_start + timedelta(days=ef[task_id])
        
        result_tasks.append({
            "id": task_id,
            "name": task.name,
            "duration": task.duration,
            "dependencies": task.dependencies,
            "earlyStart": es[task_id],
            "earlyFinish": ef[task_id],
            "lateStart": ls[task_id],
            "lateFinish": lf[task_id],
            "slack": slack,
            "isCritical": is_critical,
            "startDate": start_date_calc.strftime("%Y-%m-%d"),
            "endDate": end_date_calc.strftime("%Y-%m-%d")
        })
    
    return {
        "tasks": result_tasks,
        "projectDuration": project_duration,
        "criticalPath": critical_path,
        "projectStartDate": start_date,
        "projectEndDate": (project_start + timedelta(days=project_duration)).strftime("%Y-%m-%d")
    }

def generate_bar_chart_json(request: BarChartRequest):
    """
    Generate bar chart configuration in JSON format
    """
    # Calculate statistics
    values = [point.value for point in request.data]
    total = sum(values)
    average = total / len(values) if values else 0
    max_value = max(values) if values else 0
    min_value = min(values) if values else 0
    
    # Generate color palette if not provided
    default_colors = [
        "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
        "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16"
    ]
    
    chart_data = []
    for i, point in enumerate(request.data):
        color = point.color if point.color else default_colors[i % len(default_colors)]
        chart_data.append({
            "label": point.label,
            "value": point.value,
            "color": color,
            "percentage": (point.value / total * 100) if total > 0 else 0
        })
    
    return {
        "chartType": "bar",
        "title": request.title,
        "xAxisLabel": request.xAxisLabel,
        "yAxisLabel": request.yAxisLabel,
        "data": chart_data,
        "statistics": {
            "total": total,
            "average": average,
            "max": max_value,
            "min": min_value,
            "count": len(values)
        }
    }

# ==================== API Endpoints ====================

@app.get("/")
async def root():
    return {
        "message": "Chart Data Generator API",
        "version": "1.0.0",
        "endpoints": {
            "pert_chart": "/api/pert-chart",
            "bar_chart": "/api/bar-chart",
            "gantt_chart": "/api/gantt-chart"
        }
    }

@app.post("/api/pert-chart")
async def generate_pert_chart(request: PERTChartRequest):
    """
    Generate PERT chart data in JSON format
    
    Returns:
    - Task scheduling information
    - Critical path
    - Early/Late start and finish times
    - Slack time for each task
    """
    try:
        result = calculate_pert_schedule(
            request.tasks,
            request.projectStartDate
        )
        return {
            "success": True,
            "data": result,
            "chartType": "pert"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/bar-chart")
async def generate_bar_chart(request: BarChartRequest):
    """
    Generate bar chart data in JSON format
    
    Returns:
    - Chart configuration
    - Data points with colors
    - Statistical summary
    """
    try:
        result = generate_bar_chart_json(request)
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/gantt-chart")
async def generate_gantt_chart(request: PERTChartRequest):
    """
    Generate Gantt chart data in JSON format (similar to PERT but formatted for timeline view)
    
    Returns:
    - Timeline data
    - Task bars with start/end dates
    - Dependencies
    """
    try:
        pert_result = calculate_pert_schedule(
            request.tasks,
            request.projectStartDate
        )
        
        # Convert to Gantt format
        gantt_tasks = []
        for task in pert_result["tasks"]:
            gantt_tasks.append({
                "id": task["id"],
                "name": task["name"],
                "start": task["startDate"],
                "end": task["endDate"],
                "duration": task["duration"],
                "progress": 0,
                "dependencies": task["dependencies"],
                "isCritical": task["isCritical"],
                "type": "task"
            })
        
        return {
            "success": True,
            "data": {
                "chartType": "gantt",
                "projectStartDate": pert_result["projectStartDate"],
                "projectEndDate": pert_result["projectEndDate"],
                "projectDuration": pert_result["projectDuration"],
                "tasks": gantt_tasks,
                "criticalPath": pert_result["criticalPath"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/sample/pert")
async def get_sample_pert():
    """
    Get sample PERT chart request
    """
    return {
        "tasks": [
            {
                "id": "A",
                "name": "Project Planning",
                "duration": 5,
                "dependencies": []
            },
            {
                "id": "B",
                "name": "Design Phase",
                "duration": 10,
                "dependencies": ["A"]
            },
            {
                "id": "C",
                "name": "Development",
                "duration": 15,
                "dependencies": ["B"]
            },
            {
                "id": "D",
                "name": "Testing",
                "duration": 7,
                "dependencies": ["C"]
            },
            {
                "id": "E",
                "name": "Deployment",
                "duration": 3,
                "dependencies": ["D"]
            }
        ],
        "projectStartDate": "2025-01-01"
    }

@app.get("/api/sample/bar")
async def get_sample_bar():
    """
    Get sample bar chart request
    """
    return {
        "title": "Monthly Sales Data",
        "data": [
            {"label": "January", "value": 45000},
            {"label": "February", "value": 52000},
            {"label": "March", "value": 48000},
            {"label": "April", "value": 61000},
            {"label": "May", "value": 55000},
            {"label": "June", "value": 67000}
        ],
        "xAxisLabel": "Month",
        "yAxisLabel": "Sales (₹)"
    }

# ==================== IMAGE TO JSON ENDPOINTS ====================

async def extract_chart_data_from_image(image_bytes: bytes, chart_type: str = "auto"):
    """
    Use Google Gemini Vision to extract chart data from image
    """
    try:
        # Load image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Initialize Gemini model with vision capability
        model = genai.GenerativeModel('gemini-2.5-flash-lite')
        
        # Create detailed prompt based on chart type
        if chart_type == "timeline":
            prompt = """Analyze this timeline/product lifecycle chart and extract the data.

For each product/item shown, extract the start date and end date (or "still_produced" if ongoing).

Return EXACTLY this format (object with product names as keys):
{
  "Product Name 1": {
    "start": "YYYY-MM",
    "end": "YYYY-MM" or "still_produced"
  },
  "Product Name 2": {
    "start": "YYYY-MM",
    "end": "YYYY-MM" or "still_produced"
  }
}

Important:
- Use YYYY-MM format for dates (e.g., "2019-09")
- If a product is still being produced/active, use "still_produced" as end date
- Use exact product names from the chart
- Return ONLY valid JSON, no markdown or extra text."""

        elif chart_type == "bar" or chart_type == "auto":
            prompt = """Analyze this chart image and extract the data in JSON format.

If this is a BAR CHART, return:
{
  "chartType": "bar",
  "title": "detected title",
  "data": [
    {"label": "category1", "value": numeric_value},
    {"label": "category2", "value": numeric_value}
  ],
  "xAxisLabel": "x-axis label",
  "yAxisLabel": "y-axis label"
}

If this is a PERT/GANTT CHART, return:
{
  "chartType": "pert",
  "tasks": [
    {
      "id": "task_id",
      "name": "task name",
      "duration": days,
      "dependencies": ["list of dependent task ids"],
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD"
    }
  ],
  "projectStartDate": "YYYY-MM-DD"
}

Extract all visible data accurately. Return ONLY valid JSON, no other text."""

        elif chart_type == "pert":
            prompt = """Analyze this PERT/Gantt chart image and extract the project data in JSON format.

Return:
{
  "chartType": "pert",
  "projectTitle": "detected project name",
  "tasks": [
    {
      "id": "A",
      "name": "task name",
      "duration": number_of_days,
      "dependencies": ["list of task IDs this depends on"],
      "startDate": "YYYY-MM-DD (if visible)",
      "endDate": "YYYY-MM-DD (if visible)"
    }
  ],
  "projectStartDate": "YYYY-MM-DD"
}

Extract all tasks, their durations, and dependencies. Return ONLY valid JSON."""

        else:  # line, pie, etc.
            prompt = """Analyze this chart image and extract the data in JSON format.

Detect the chart type and return appropriate JSON structure:
- For bar/column charts: labels and values
- For line charts: x-axis points and y-axis values
- For pie charts: categories and percentages/values
- For timelines/gantt: tasks with dates

Return ONLY valid JSON, no markdown or extra text."""

        # Generate response
        response = model.generate_content([prompt, image])
        
        # Extract JSON from response
        response_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text.replace("```json", "").replace("```", "").strip()
        elif response_text.startswith("```"):
            response_text = response_text.replace("```", "").strip()
        
        # Parse JSON
        chart_data = json.loads(response_text)
        
        return chart_data
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response as JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@app.post("/api/image-to-json")
async def image_to_json(
    file: UploadFile = File(...),
    chart_type: str = "auto"
):
    """
    Upload a chart image and get JSON data extracted from it
    
    Parameters:
    - file: Image file (PNG, JPG, JPEG)
    - chart_type: Type of chart ("auto", "bar", "pert", "timeline", "line", "pie")
    
    Returns:
    - Extracted chart data in JSON format
    """
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image bytes
        image_bytes = await file.read()
        
        # Extract chart data using AI
        chart_data = await extract_chart_data_from_image(image_bytes, chart_type)
        
        return {
            "success": True,
            "filename": file.filename,
            "detectedType": chart_data.get("chartType", chart_type),
            "data": chart_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/bar-chart-from-image")
async def bar_chart_from_image(file: UploadFile = File(...)):
    """
    Upload a bar chart image and get structured JSON data
    """
    return await image_to_json(file, "bar")


@app.post("/api/pert-chart-from-image")
async def pert_chart_from_image(file: UploadFile = File(...)):
    """
    Upload a PERT/Gantt chart image and get task data in JSON
    """
    return await image_to_json(file, "pert")


@app.post("/api/timeline-from-image")
async def timeline_from_image(file: UploadFile = File(...)):
    """
    Upload a timeline/product lifecycle chart and get simple start/end dates
    
    Returns format:
    {
      "Product Name": {
        "start": "YYYY-MM",
        "end": "YYYY-MM" or "still_produced"
      }
    }
    """
    return await image_to_json(file, "timeline")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )
