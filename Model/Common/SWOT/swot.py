import os
import PyPDF2
from fastapi import FastAPI, UploadFile, File, HTTPException, APIRouter
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

# --------------------------------------------
# 1. Load Environment Variables (API KEY)
# --------------------------------------------
api_key = os.getenv("SWOT_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
if not api_key:
    raise ValueError("ERROR: Set SWOT_KEY in environment variables.")

genai.configure(api_key=api_key)

# --------------------------------------------
# 2. Initialize FastAPI App
# --------------------------------------------
router = APIRouter()

# --------------------------------------------
# 3. Load Thrust Areas Document ONCE (Agent Memory)
# --------------------------------------------
def extract_pdf_text_from_path(path: str):
    text = ""
    with open(path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
    return text

# Get the absolute path to the data_files directory
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.dirname(os.path.dirname(CURRENT_DIR))
THRUST_AREAS_PATH = os.path.join(MODEL_DIR, "data_files", "Thrust_Areas_2020.pdf")
THRUST_TEXT = extract_pdf_text_from_path(THRUST_AREAS_PATH)

print("✔ Agent Memory Loaded: MoC Thrust Areas")

# --------------------------------------------
# 4. Helper to Extract Text from Uploaded PDF
# --------------------------------------------
def extract_pdf_text(upload_file: UploadFile) -> str:
    text = ""
    try:
        reader = PyPDF2.PdfReader(upload_file.file)
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
        upload_file.file.seek(0)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read PDF: {str(e)}")
    return text


# --------------------------------------------
# 5. Agent Prompt: Intelligent MoC Reasoner
# --------------------------------------------
def build_agent_prompt(form_text: str):
    return f"""
You are **MoC-SWOT-Agent**, an expert evaluator for the Ministry of Coal (MoC), India.

You have long-term memory containing:
- Official MoC Thrust Areas
- Knowledge of S&T Grant evaluation
- Rules for SWOT construction
- Understanding of geosciences and mining R&D

You will now analyze an uploaded Form-I project proposal.

Your responsibilities as an MoC Agent:
---------------------------------------------------
1. Fully understand the proposal (objectives, issue definition, methodology, justification, budget, PI expertise).
2. Match proposal content to relevant **MoC Thrust Areas** stored in your memory.
3. Identify internal strengths and weaknesses from the proposal.
4. Identify external opportunities and threats based on MoC thrust areas + national coal-sector conditions.
5. Produce a **perfect MoC-compliant SWOT analysis** in EXACTLY this format:

S — Strengths

[bullet 1]
[bullet 2]
[bullet 3]
[bullet 4]
[bullet 5]
[bullet 6]

W — Weaknesses

[bullet 1]
[bullet 2]
[bullet 3]
[bullet 4]
[bullet 5]
[bullet 6]

O — Opportunities

[bullet 1]
[bullet 2]
[bullet 3]
[bullet 4]
[bullet 5]
[bullet 6]

T — Threats

[bullet 1]
[bullet 2]
[bullet 3]
[bullet 4]
[bullet 5]
[bullet 6]

Strict Rules for Output:
-------------------------------------
- Do NOT output anything except the SWOT sections.
- Do NOT include explanation of reasoning.
- Strengths & Weaknesses MUST come from proposal.
- Opportunities & Threats MUST come from MoC thrust areas + external risks.
- Bullets must be concise, technical, and MoC-review ready.

--------------- AGENT MEMORY (THRUST AREAS) ---------------
{THRUST_TEXT}

--------------- FORM-I PROPOSAL BEING ANALYZED ---------------
{form_text}

Now perform your task and return ONLY the SWOT.
"""


# --------------------------------------------
# 6. FASTAPI Endpoint — MoC SWOT Agent
# --------------------------------------------
@router.post("/swot-agent")
async def swot_agent(form1_pdf: UploadFile = File(...)):
    if not form1_pdf.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Error: Upload a valid PDF file.")

    form_text = extract_pdf_text(form1_pdf)

    prompt = build_agent_prompt(form_text)

    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(prompt)
        swot_output = response.text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(e)}")

    return JSONResponse(content={"swot": swot_output})
