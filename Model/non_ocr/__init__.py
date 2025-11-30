"""
Non-OCR PDF to OCR PDF Converter Module

This module provides functionality to convert scanned/non-OCR PDFs into searchable OCR PDFs.
"""

from .converter import (
    convert_pdf_to_ocr,
    is_pdf_ocr,
    process_image_to_ocr_pdf,
    router
)

__all__ = [
    'convert_pdf_to_ocr',
    'is_pdf_ocr',
    'process_image_to_ocr_pdf',
    'router'
]
