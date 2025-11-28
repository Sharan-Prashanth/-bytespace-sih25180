import re
import json
import io
from typing import List, Dict, Optional

from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse

try:
    import easyocr
except Exception:
    easyocr = None

from PIL import Image
import numpy as np
import cv2

router = APIRouter()

# Cache reader to avoid reinitialization cost
_OCR_READER = None


def get_easyocr_reader():
    global _OCR_READER
    if _OCR_READER is not None:
        return _OCR_READER
    if easyocr is None:
        return None
    try:
        _OCR_READER = easyocr.Reader(["en"], gpu=False)
    except Exception:
        _OCR_READER = None
    return _OCR_READER


def run_ocr_on_bytes(file_bytes: bytes) -> str:
    """Run OCR on raw image bytes using EasyOCR and return extracted text.

    Returns plain text with newline-separated lines. If `easyocr` is not installed,
    raises an informative RuntimeError.
    """
    reader = get_easyocr_reader()
    if reader is None:
        raise RuntimeError("`easyocr` is not installed or failed to initialize. Install it with `pip install easyocr`.")

    # Load image into numpy array
    img_arr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
    if img is None:
        try:
            pil_img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
            img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        except Exception as e:
            raise RuntimeError(f"Unable to read image bytes: {e}")

    # EasyOCR expects RGB image in numpy array
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Run text detection/recognition
    try:
        results = reader.readtext(img_rgb, detail=0, paragraph=False)
    except Exception as e:
        raise RuntimeError(f"EasyOCR failed: {e}")

    # results is list of strings
    lines = [r.strip() for r in results if r and r.strip()]
    return "\n".join(lines)


def parse_text_to_project_plan(text: str) -> Dict:
    """Parse OCR-extracted text into the `project_plan` JSON structure.

    The parser groups lines into categories (headings) and extracts tasks with start/end weeks.
    It returns the normalized structure like the example the user provided.
    """
    if not text:
        return {"project_plan": []}

    lines = [l.strip() for l in text.splitlines() if l.strip()]
    categories: List[Dict] = []
    current_category: Optional[Dict] = None

    # Regex patterns to capture a task name and week range
    patterns = [
        # e.g. "Import Test Data 2-4" or "Import Test Data 2 - 4"
        re.compile(r"^(?P<name>.+?)\s+(?P<start>\d{1,2})\s*[-–]\s*(?P<end>\d{1,2})$"),
        # e.g. "Import Test Data (2-4)" or "Import Test Data (2 - 4)"
        re.compile(r"^(?P<name>.+?)\s*\(\s*(?P<start>\d{1,2})\s*[-–]\s*(?P<end>\d{1,2})\s*\)$"),
        # e.g. "Import Test Data Week 2 to 4" or "Import Test Data week 2 to 4"
        re.compile(r"^(?P<name>.+?)\s+[Ww]eek[s]?\s*(?P<start>\d{1,2})\s*(?:to|-)\s*(?P<end>\d{1,2})$"),
        # e.g. "Import Test Data 2 to 4"
        re.compile(r"^(?P<name>.+?)\s+(?P<start>\d{1,2})\s+to\s+(?P<end>\d{1,2})$", re.I),
        # e.g. "start_week:2 end_week:4" (rare)
        re.compile(r"^(?P<name>.+?)\D+start[_ ]?week\D*(?P<start>\d{1,2})\D+end[_ ]?week\D*(?P<end>\d{1,2})$", re.I),
    ]

    def match_task(line: str) -> Optional[Dict]:
        for p in patterns:
            m = p.match(line)
            if m:
                name = m.group("name").strip(" -:•\t")
                try:
                    s = int(m.group("start"))
                    e = int(m.group("end"))
                except Exception:
                    return None
                return {"name": name, "start_week": s, "end_week": e}
        return None

    i = 0
    while i < len(lines):
        line = lines[i]
        # Consider a line a category if it's short (<=60 chars), has no digits
        # and not likely to be a task
        if re.search(r"\d", line) is None and len(line) <= 80 and (i + 1 < len(lines)):
            # start a new category
            current_category = {"category": line, "tasks": []}
            categories.append(current_category)
            i += 1
            # collect task-like lines
            while i < len(lines):
                tline = lines[i]
                # stop collecting if next line looks like a new category
                if re.search(r"\d", tline) is None and len(tline) <= 80 and not any(ch.isdigit() for ch in tline):
                    break
                task = match_task(tline)
                if task:
                    current_category["tasks"].append(task)
                else:
                    # try to see if the next token contains week range separated by comma
                    # or appended like "Name , 2-4"
                    # split by commas and try each segment
                    parts = [p.strip() for p in re.split(r",", tline)] if "," in tline else [tline]
                    added = False
                    for part in parts:
                        task = match_task(part)
                        if task:
                            current_category["tasks"].append(task)
                            added = True
                            break
                    if not added:
                        # attempt to find range anywhere in the line
                        range_found = re.search(r"(\d{1,2})\s*[-–to]+\s*(\d{1,2})", tline, re.I)
                        if range_found:
                            rng = range_found.groups()
                            name_only = re.sub(r"(\d{1,2})\s*[-–to]+\s*(\d{1,2})", "", tline).strip(" -:•,\t")
                            try:
                                s = int(rng[0]); e = int(rng[1])
                                current_category["tasks"].append({"name": name_only, "start_week": s, "end_week": e})
                            except Exception:
                                pass
                i += 1
            continue

        # If line matches a task and we have no category, create default category
        task = match_task(line)
        if task:
            if not categories:
                categories.append({"category": "Project Plan", "tasks": []})
            categories[-1]["tasks"].append(task)
            i += 1
            continue

        # Otherwise, try to detect a standalone short category
        if len(line.split()) <= 6 and re.search(r"\d", line) is None:
            categories.append({"category": line, "tasks": []})

        i += 1

    # Normalize output: ensure ints and consistent keys
    out = []
    for c in categories:
        tasks = []
        for t in c.get("tasks", []):
            tasks.append({
                "name": t.get("name"),
                "start_week": int(t.get("start_week")) if t.get("start_week") is not None else None,
                "end_week": int(t.get("end_week")) if t.get("end_week") is not None else None,
            })
        out.append({"category": c.get("category"), "tasks": tasks})

    return {"project_plan": out}


@router.post("/process-non-ocr")
async def process_non_ocr(file: UploadFile = File(...)):
    """Accepts only an uploaded image/text file and returns the structured `project_plan` JSON.

    The endpoint requires a multipart upload with the file field named `file`.
    """
    try:
        content = await file.read()
        # Run easyocr on bytes; will raise if easyocr not installed
        text = run_ocr_on_bytes(content)
        plan = parse_text_to_project_plan(text)
        return JSONResponse(content=plan)
    except RuntimeError as rexc:
        return JSONResponse({"error": str(rexc)}, status_code=500)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


if __name__ == "__main__":
    # CLI: process a local file and print JSON to stdout
    import argparse

    parser = argparse.ArgumentParser("non_ocr_processor")
    parser.add_argument("--file", "-f", help="Path to image or text file to process", required=True)
    args = parser.parse_args()

    path = args.file
    try:
        with open(path, "rb") as fh:
            b = fh.read()
    except Exception as e:
        print(json.dumps({"project_plan": []}, indent=2))
        raise SystemExit(f"failed to open file: {e}")

    try:
        text = run_ocr_on_bytes(b)
    except RuntimeError:
        # if easyocr not available, try reading as plain text
        try:
            text = b.decode("utf-8", errors="ignore")
        except Exception:
            text = ""

    out = parse_text_to_project_plan(text)
    print(json.dumps(out, indent=2))
