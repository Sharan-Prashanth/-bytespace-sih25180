import requests
import json
from pathlib import Path

# Base URL
BASE_URL = "http://localhost:8001"

print("=" * 60)
print("Testing IMAGE TO JSON API")
print("=" * 60)

def test_image_upload(image_path: str, chart_type: str = "auto"):
    """Test image upload and JSON extraction"""
    
    if not Path(image_path).exists():
        print(f"❌ Image file not found: {image_path}")
        return
    
    print(f"\n📤 Uploading: {image_path}")
    print(f"🔍 Chart Type: {chart_type}")
    print("-" * 60)
    
    try:
        with open(image_path, 'rb') as f:
            files = {'file': (Path(image_path).name, f, 'image/png')}
            data = {'chart_type': chart_type}
            
            response = requests.post(
                f"{BASE_URL}/api/image-to-json",
                files=files,
                data=data
            )
            
            if response.status_code == 200:
                result = response.json()
                print("✅ JSON Extracted Successfully!")
                print("\n📊 Response:")
                print(json.dumps(result, indent=2))
            else:
                print(f"❌ Error: {response.status_code}")
                print(response.text)
                
    except Exception as e:
        print(f"❌ Error: {e}")

# Instructions
print("\n📝 Instructions:")
print("1. Place your chart images in the b-chart folder")
print("2. Run this script with your image filename")
print("3. Supported formats: PNG, JPG, JPEG")
print("\n" + "=" * 60)

# Example usage - Update these paths with your actual images
print("\n💡 Example Usage:")
print("   Uncomment and update the image path below:\n")

# Test with a bar chart image
# test_image_upload("my_bar_chart.png", "bar")

# Test with a PERT chart image  
# test_image_upload("my_pert_chart.png", "pert")

# Auto-detect chart type
# test_image_upload("any_chart.png", "auto")

print("\n⚠️  To test, please:")
print("   1. Add a chart image to the b-chart folder")
print("   2. Uncomment one of the test_image_upload() lines above")
print("   3. Update the filename to match your image")
print("   4. Run this script again")
print("\n" + "=" * 60)
