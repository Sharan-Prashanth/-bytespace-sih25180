import os
import re
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import pdfplumber
import google.generativeai as genai

# -------------------- CONFIG -------------------- #

GEMINI_API_KEY = os.getenv("PAMPERS_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL")   # e.g. gemini-1.5-pro

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not set in environment")

if not GEMINI_MODEL:
    raise RuntimeError("GEMINI_MODEL not set in environment")

genai.configure(api_key=GEMINI_API_KEY)

router = APIRouter(prefix="/scamper", tags=["SCAMPER Semantic Analysis"])


# -------------------- PDF EXTRACTION -------------------- #

def extract_text_from_pdf(uploaded_file: UploadFile) -> str:
    try:
        with pdfplumber.open(uploaded_file.file) as pdf:
            pages = [p.extract_text() or "" for p in pdf.pages]
        return "\n".join(pages)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read PDF: {str(e)}")


# -------------------- FORM-I SECTION PARSER -------------------- #

def extract_between(text: str, start: str, end: str) -> str:
    start_re = re.search(start, text, flags=re.IGNORECASE)
    if not start_re:
        return ""

    start_pos = start_re.end()
    end_re = re.search(end, text[start_pos:], flags=re.IGNORECASE)

    end_pos = start_pos + end_re.start() if end_re else len(text)
    return text[start_pos:end_pos].strip()


def parse_form_sections(full_text: str):
    text = re.sub(r"[ \t]+", " ", full_text)

    objectives = extract_between(
        text,
        r"5\s+Objectives.*?:",
        r"6\s+Justification"
    )

    methodology = extract_between(
        text,
        r"8\.1\s+Methodology.*?:",
        r"8\.2\s+Organization of work elements"
    )

    return objectives, methodology, text


# -------------------- SEMANTIC SCAMPER ANALYSIS USING GEMINI -------------------- #

def semantic_scamper_check(objectives: str, methodology: str):
    content = f"""
Objectives:
{objectives}

Methodology:
{methodology}
"""

    prompt = f"""
You are an expert evaluator for Ministry of Coal (India).

Analyze this proposal (Objectives + Methodology) and classify it according to SCAMPER.

SCAMPER Elements:
1. Substitute
2. Combine
3. Adapt
4. Modify / Magnify / Minify
5. Put to other use
6. Eliminate
7. Reverse / Rearrange

Your evaluation MUST be SEMANTIC-BASED:
- DO NOT use keyword detection.
- Understand the meaning and intent behind the content.
- Decide YES/NO for each SCAMPER element.

Return the analysis in a point-by-point format as follows:

1. **Substitute**
   - Present: Yes/No
   - Explanation: Why it qualifies or not
   - Evidence: Short quote or summary snippet from content

2. **Combine**
   - Present: Yes/No
   - Explanation: Why it qualifies or not
   - Evidence: Short quote or summary snippet from content

3. **Adapt**
   - Present: Yes/No
   - Explanation: Why it qualifies or not
   - Evidence: Short quote or summary snippet from content

4. **Modify / Magnify / Minify**
   - Present: Yes/No
   - Explanation: Why it qualifies or not
   - Evidence: Short quote or summary snippet from content

5. **Put to Other Use**
   - Present: Yes/No
   - Explanation: Why it qualifies or not
   - Evidence: Short quote or summary snippet from content

6. **Eliminate**
   - Present: Yes/No
   - Explanation: Why it qualifies or not
   - Evidence: Short quote or summary snippet from content

7. **Reverse / Rearrange**
   - Present: Yes/No
   - Explanation: Why it qualifies or not
   - Evidence: Short quote or summary snippet from content

Proposal Content:
{content}
"""

    model = genai.GenerativeModel(GEMINI_MODEL)

    response = model.generate_content(prompt)

    return response.text   # Gemini returns raw text


# -------------------- FASTAPI ENDPOINT -------------------- #

@router.post("/analyze")
async def analyze_scamper_semantic(file: UploadFile = File(...)):

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    # Extract text
    full_text = extract_text_from_pdf(file)

    # Parse FORM-I sections (Objectives + Methodology)
    objectives, methodology, _ = parse_form_sections(full_text)

    # Semantic SCAMPER with Gemini
    result_json = semantic_scamper_check(objectives, methodology)

    return JSONResponse(content={"scamper_semantic_result": result_json})
