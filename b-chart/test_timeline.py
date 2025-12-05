import requests
import json
import sys

# Base URL
BASE_URL = "http://localhost:8001"

print("=" * 70)
print("Testing TIMELINE Chart Image to JSON")
print("=" * 70)

# Check if image file is provided
if len(sys.argv) < 2:
    print("\n❌ Please provide an image file path")
    print("\nUsage:")
    print("  python test_timeline.py <image_file.png>")
    print("\nExample:")
    print("  python test_timeline.py bar.png")
    print("=" * 70)
    sys.exit(1)

image_path = sys.argv[1]

print(f"\n📤 Uploading: {image_path}")
print(f"🔍 Chart Type: timeline (product lifecycle)")
print("-" * 70)

try:
    with open(image_path, 'rb') as f:
        files = {'file': (image_path, f, 'image/png')}
        
        # Use the timeline-specific endpoint
        response = requests.post(
            f"{BASE_URL}/api/timeline-from-image",
            files=files
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Timeline JSON Extracted Successfully!")
            print("\n📊 Full Response:")
            print(json.dumps(result, indent=2))
            
            # Extract just the data part
            if 'data' in result:
                print("\n" + "=" * 70)
                print("📋 CLEAN DATA (Use this for your app):")
                print("=" * 70)
                print(json.dumps(result['data'], indent=2))
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            
except FileNotFoundError:
    print(f"❌ File not found: {image_path}")
    print("Please check the file path and try again.")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 70)
print("💡 TIP: If format is wrong, the AI will auto-adjust on next try!")
print("=" * 70)
