import requests
import json

# Base URL
BASE_URL = "http://localhost:8001"

print("=" * 60)
print("Testing Chart Data Generator API")
print("=" * 60)

# Test 1: Bar Chart
print("\n1. Testing Bar Chart API...")
print("-" * 60)

bar_data = {
    "title": "Project Cost Distribution",
    "data": [
        {"label": "Personnel", "value": 450000, "color": "#3b82f6"},
        {"label": "Equipment", "value": 280000, "color": "#ef4444"},
        {"label": "Software", "value": 120000, "color": "#10b981"},
        {"label": "Training", "value": 80000, "color": "#f59e0b"}
    ],
    "xAxisLabel": "Category",
    "yAxisLabel": "Amount (₹)"
}

try:
    response = requests.post(f"{BASE_URL}/api/bar-chart", json=bar_data)
    if response.status_code == 200:
        result = response.json()
        print("✅ Bar Chart JSON Response:")
        print(json.dumps(result, indent=2))
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"❌ Connection Error: {e}")
    print("Make sure the server is running on port 8001")

# Test 2: PERT Chart
print("\n\n2. Testing PERT Chart API...")
print("-" * 60)

pert_data = {
    "tasks": [
        {"id": "A", "name": "Planning", "duration": 5, "dependencies": []},
        {"id": "B", "name": "Design", "duration": 10, "dependencies": ["A"]},
        {"id": "C", "name": "Development", "duration": 15, "dependencies": ["B"]},
        {"id": "D", "name": "Testing", "duration": 7, "dependencies": ["C"]},
        {"id": "E", "name": "Deployment", "duration": 3, "dependencies": ["D"]}
    ],
    "projectStartDate": "2025-01-01"
}

try:
    response = requests.post(f"{BASE_URL}/api/pert-chart", json=pert_data)
    if response.status_code == 200:
        result = response.json()
        print("✅ PERT Chart JSON Response:")
        print(json.dumps(result, indent=2))
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"❌ Connection Error: {e}")

# Test 3: Gantt Chart
print("\n\n3. Testing Gantt Chart API...")
print("-" * 60)

try:
    response = requests.post(f"{BASE_URL}/api/gantt-chart", json=pert_data)
    if response.status_code == 200:
        result = response.json()
        print("✅ Gantt Chart JSON Response:")
        print(json.dumps(result, indent=2))
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"❌ Connection Error: {e}")

print("\n" + "=" * 60)
print("✅ Testing Complete!")
print("=" * 60)
print("\n📖 To see interactive docs, visit: http://localhost:8001/docs")
