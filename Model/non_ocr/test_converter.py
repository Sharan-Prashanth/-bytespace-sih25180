#!/usr/bin/env python3
"""
Test script for non_ocr PDF to OCR PDF converter
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from non_ocr.converter import (
    is_pdf_ocr,
    convert_pdf_to_ocr,
    process_image_to_ocr_pdf
)
from PIL import Image, ImageDraw, ImageFont


def create_test_image():
    """Create a test image with text."""
    img = Image.new('RGB', (800, 600), color='white')
    draw = ImageDraw.Draw(img)
    
    text = """PROJECT PROPOSAL FOR S&T GRANT

Title: Advanced Coal Mining Safety System

Principal Investigator: Dr. John Smith
Institution: Mining Research Institute
Duration: 3 Years

Objectives:
1. Improve mining safety by 40%
2. Reduce accidents through AI monitoring
3. Implement real-time hazard detection

Budget: Rs 50 Lakhs
"""
    
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
    except:
        font = ImageFont.load_default()
    
    draw.text((50, 50), text, fill='black', font=font)
    
    return img


def test_image_to_ocr_pdf():
    """Test converting an image to OCR PDF."""
    print("=" * 70)
    print("TEST 1: Image to OCR PDF")
    print("=" * 70)
    
    try:
        # Create test image
        img = create_test_image()
        img_path = "/tmp/test_document.png"
        img.save(img_path)
        print(f"✓ Test image created: {img_path}")
        
        # Convert to bytes
        import io
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes = img_bytes.getvalue()
        
        # Convert to OCR PDF
        print("\nConverting to OCR PDF...")
        ocr_pdf, metadata = process_image_to_ocr_pdf(img_bytes, "test_document.png")
        
        # Save OCR PDF
        output_path = "/tmp/test_document_ocr.pdf"
        with open(output_path, 'wb') as f:
            f.write(ocr_pdf)
        
        print(f"\n✓ OCR PDF created: {output_path}")
        print(f"  Status: {metadata['status']}")
        print(f"  Pages: {metadata['pages_processed']}")
        print(f"  Text length: {metadata['text_length']} characters")
        print(f"  Image size: {metadata['image_size']}")
        
        print("\n✓ TEST PASSED")
        return True
    
    except Exception as e:
        print(f"\n✗ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_pdf_ocr_detection():
    """Test PDF OCR detection."""
    print("\n" + "=" * 70)
    print("TEST 2: PDF OCR Detection")
    print("=" * 70)
    
    try:
        # Create a simple PDF with text using reportlab
        from reportlab.pdfgen import canvas
        import io
        
        buffer = io.BytesIO()
        pdf = canvas.Canvas(buffer)
        pdf.drawString(100, 750, "This is a text PDF with OCR")
        pdf.save()
        
        pdf_bytes = buffer.getvalue()
        
        # Check OCR status
        is_ocr, text = is_pdf_ocr(pdf_bytes)
        
        print(f"\n✓ PDF created with embedded text")
        print(f"  Has OCR: {is_ocr}")
        print(f"  Text length: {len(text)} characters")
        print(f"  Sample text: '{text[:50]}...'")
        
        if is_ocr:
            print("\n✓ TEST PASSED - PDF correctly detected as having OCR")
            return True
        else:
            print("\n✗ TEST FAILED - Should have detected OCR")
            return False
    
    except Exception as e:
        print(f"\n✗ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_api_availability():
    """Test if API endpoints are available."""
    print("\n" + "=" * 70)
    print("TEST 3: API Availability Check")
    print("=" * 70)
    
    try:
        from non_ocr.converter import router
        
        endpoints = []
        for route in router.routes:
            endpoints.append(f"  • {route.methods} {route.path}")
        
        print("\n✓ API Router loaded successfully")
        print("\nAvailable endpoints:")
        for endpoint in endpoints:
            print(endpoint)
        
        print("\n✓ TEST PASSED")
        return True
    
    except Exception as e:
        print(f"\n✗ TEST FAILED: {e}")
        return False


def print_summary(results):
    """Print test summary."""
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    
    passed = sum(results)
    total = len(results)
    
    print(f"\nTests Passed: {passed}/{total}")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        print("\nNext steps:")
        print("  1. Start server: python main.py")
        print("  2. Test endpoint: POST http://localhost:8000/non-ocr/convert-to-ocr")
        print("  3. Or use CLI: python non_ocr/cli.py your_file.pdf")
    else:
        print("\n⚠️  SOME TESTS FAILED")
        print("\nCheck the output above for errors.")
    
    print("\n" + "=" * 70)


if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("NON-OCR PDF CONVERTER - TEST SUITE")
    print("=" * 70)
    print("\nThis will test:")
    print("  1. Image to OCR PDF conversion")
    print("  2. PDF OCR detection")
    print("  3. API availability")
    print("\n" + "=" * 70)
    
    results = []
    
    # Run tests
    results.append(test_image_to_ocr_pdf())
    results.append(test_pdf_ocr_detection())
    results.append(test_api_availability())
    
    # Print summary
    print_summary(results)
    
    # Exit with appropriate code
    sys.exit(0 if all(results) else 1)
