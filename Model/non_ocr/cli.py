"""
Command-line interface for PDF to OCR conversion
"""

import sys
import argparse
from pathlib import Path

from converter import convert_pdf_to_ocr, is_pdf_ocr, process_image_to_ocr_pdf


def progress_callback(current, total):
    """Display progress bar."""
    percent = (current / total) * 100
    bar_length = 50
    filled = int(bar_length * current / total)
    bar = '█' * filled + '░' * (bar_length - filled)
    print(f'\r  Progress: [{bar}] {percent:.1f}% ({current}/{total})', end='', flush=True)
    if current == total:
        print()  # New line when complete


def main():
    parser = argparse.ArgumentParser(
        description='Convert non-OCR PDFs to searchable OCR PDFs'
    )
    parser.add_argument(
        'input',
        help='Input PDF or image file'
    )
    parser.add_argument(
        '-o', '--output',
        help='Output PDF file (default: input_ocr.pdf)',
        default=None
    )
    parser.add_argument(
        '--dpi',
        type=int,
        default=300,
        help='DPI for PDF to image conversion (default: 300)'
    )
    parser.add_argument(
        '--check-only',
        action='store_true',
        help='Only check if PDF has OCR, don\'t convert'
    )
    
    args = parser.parse_args()
    
    # Read input file
    input_path = Path(args.input)
    
    if not input_path.exists():
        print(f"✗ Error: File not found: {input_path}")
        sys.exit(1)
    
    with open(input_path, 'rb') as f:
        file_bytes = f.read()
    
    file_ext = input_path.suffix.lower()
    
    # Check OCR status for PDFs
    if file_ext == '.pdf' and args.check_only:
        print(f"\n{'='*60}")
        print(f"Checking OCR status: {input_path.name}")
        print(f"{'='*60}\n")
        
        is_ocr, text = is_pdf_ocr(file_bytes)
        
        if is_ocr:
            print("✓ PDF has OCR (searchable)")
            print(f"  Text length: {len(text)} characters")
            print(f"\n  Sample text:")
            print(f"  {text[:200]}...")
        else:
            print("✗ PDF does NOT have OCR (scanned image)")
            print("  Recommendation: Convert to OCR using this tool")
        
        print(f"\n{'='*60}\n")
        sys.exit(0)
    
    # Set output path
    if args.output:
        output_path = Path(args.output)
    else:
        output_path = input_path.parent / f"{input_path.stem}_ocr.pdf"
    
    # Convert
    print(f"\n{'='*60}")
    print(f"Converting to OCR PDF")
    print(f"{'='*60}")
    print(f"Input:  {input_path}")
    print(f"Output: {output_path}")
    print(f"DPI:    {args.dpi}")
    print(f"{'='*60}\n")
    
    try:
        if file_ext == '.pdf':
            ocr_pdf, metadata = convert_pdf_to_ocr(
                file_bytes,
                dpi=args.dpi,
                progress_callback=progress_callback
            )
        elif file_ext in ['.png', '.jpg', '.jpeg', '.tiff', '.bmp']:
            ocr_pdf, metadata = process_image_to_ocr_pdf(
                file_bytes,
                input_path.name
            )
        else:
            print(f"✗ Unsupported file type: {file_ext}")
            sys.exit(1)
        
        # Save output
        with open(output_path, 'wb') as f:
            f.write(ocr_pdf)
        
        print(f"\n{'='*60}")
        print("✓ Conversion successful!")
        print(f"{'='*60}")
        print(f"  Status:         {metadata['status']}")
        print(f"  Pages:          {metadata['pages_processed']}")
        print(f"  Text extracted: {metadata['text_length']} characters")
        print(f"  Output file:    {output_path}")
        print(f"{'='*60}\n")
    
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
