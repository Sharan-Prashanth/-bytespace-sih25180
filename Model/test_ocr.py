#!/usr/bin/env python3
"""
Test script to verify OCR functionality for non-OCR PDFs and images.
"""
import sys
import os
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import PyPDF2

# Add Model directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from Json_extraction.extractor import extract_text, extract_text_from_scanned_pdf, run_ocr_on_image


def create_test_image_with_text():
    """Create a test image with sample text."""
    # Create a white image
    img = Image.new('RGB', (800, 400), color='white')
    draw = ImageDraw.Draw(img)
    
    # Add text
    text = """
    PROJECT PROPOSAL FOR S&T GRANT
    
    1. Project Title: Coal Mining Research
    2. Principal Investigator: Dr. John Doe
    3. Institution: Mining Research Institute
    4. Duration: 3 years
    """
    
    try:
        # Try to use a default font
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    draw.text((50, 50), text, fill='black', font=font)
    
    return img


def test_image_ocr():
    """Test OCR on a generated image."""
    print("=" * 60)
    print("TEST 1: OCR on Generated Image")
    print("=" * 60)
    
    # Create test image
    img = create_test_image_with_text()
    
    # Save temporarily to visualize (optional)
    test_img_path = "/tmp/test_ocr_image.png"
    img.save(test_img_path)
    print(f"Test image saved to: {test_img_path}")
    
    # Run OCR
    try:
        extracted_text = run_ocr_on_image(img)
        print("\n✓ OCR Extraction Successful!")
        print("\nExtracted Text:")
        print("-" * 60)
        print(extracted_text)
        print("-" * 60)
        return True
    except Exception as e:
        print(f"\n✗ OCR Failed: {e}")
        return False


def test_extract_text_integration():
    """Test the complete extract_text function with image."""
    print("\n" + "=" * 60)
    print("TEST 2: Integration Test with extract_text()")
    print("=" * 60)
    
    # Create test image
    img = create_test_image_with_text()
    
    # Convert to bytes (simulating file upload)
    img_bytes = BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes = img_bytes.getvalue()
    
    # Test extraction
    try:
        extracted_text = extract_text("test_document.png", img_bytes)
        print("\n✓ Integration Test Successful!")
        print("\nExtracted Text:")
        print("-" * 60)
        print(extracted_text)
        print("-" * 60)
        return True
    except Exception as e:
        print(f"\n✗ Integration Test Failed: {e}")
        return False


def print_summary(results):
    """Print test summary."""
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(results)
    total = len(results)
    
    print(f"Tests Passed: {passed}/{total}")
    
    if passed == total:
        print("✓ All tests passed!")
    else:
        print("✗ Some tests failed. Check the output above.")


if __name__ == "__main__":
    print("\nTesting OCR Functionality for Non-OCR Documents")
    print("=" * 60)
    
    results = []
    
    # Run tests
    results.append(test_image_ocr())
    results.append(test_extract_text_integration())
    
    # Print summary
    print_summary(results)
    
    # Instructions
    print("\n" + "=" * 60)
    print("NEXT STEPS:")
    print("=" * 60)
    print("1. Install dependencies: pip install pdf2image paddlepaddle paddleocr")
    print("2. For pdf2image, also install poppler-utils:")
    print("   - Ubuntu/Debian: sudo apt-get install poppler-utils")
    print("   - macOS: brew install poppler")
    print("3. Test with your actual scanned PDFs using the /process-file endpoint")
    print("=" * 60)
