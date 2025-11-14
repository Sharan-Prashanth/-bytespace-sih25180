import os
import json
import chardet
import PyPDF2
import docx
import re
import google.generativeai as genai
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from supabase import create_client, Client
from io import BytesIO

router = APIRouter()

# Environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

UPLOAD_BUCKET = "Coal-research-files"
JSON_BUCKET = "processed-json"

# Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash-lite")


# ----------------------------------------------------
# TEXT EXTRACTION
# ----------------------------------------------------
def extract_text(filename, file_bytes):
    ext = filename.lower().split(".")[-1]

    if ext == "pdf":
        reader = PyPDF2.PdfReader(BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text

    elif ext == "docx":
        doc = docx.Document(BytesIO(file_bytes))
        return "\n".join([p.text for p in doc.paragraphs])

    elif ext in ["txt", "csv"]:
        enc = chardet.detect(file_bytes)["encoding"] or "utf-8"
        return file_bytes.decode(enc, errors="ignore")

    else:
        return ""


# ----------------------------------------------------
# JSON GENERATION
# ----------------------------------------------------
def generate_json(content):
    prompt = """
    Extract the following details and return ONLY valid JSON structure:
    {
        "title": "",
        "author": "",
        "affiliation": "",
        "abstract": "",
        "keywords": [],
        "introduction": "",
        "methodology": "",
        "results": "",
        "discussion": "",
        "conclusion": "",
        "references": [],
        "timeline": "",
        "research_needs": [],
        "funding_sources": [],
        "collaborating_institutions": []
    }
    Return ONLY JSON. No explanation.
    """
    response = model.generate_content([prompt, content])
    raw = response.text.strip()

    m = re.search(r"\{.*\}", raw, re.DOTALL)
    if m:
        raw = m.group(0)

    try:
        return json.loads(raw)
    except:
        return {"raw_output": raw}


# ----------------------------------------------------
# MAIN AUTOMATIC PROCESSING ENDPOINT
# ----------------------------------------------------
@router.post("/process-all-files")
def process_all_files():
    try:
        files = supabase.storage.from_(UPLOAD_BUCKET).list()

        if not files:
            return {"message": "No files found in bucket"}

        results = []

        for f in files:
            try:
                filename = f["name"]
                print(f"Processing file: {filename}")

                # 1️⃣ Download file
                file_bytes = supabase.storage.from_(UPLOAD_BUCKET).download(filename)

                if not file_bytes:
                    print(f"Skipping: unable to download {filename}")
                    continue

                # 2️⃣ Extract text safely
                try:
                    text = extract_text(filename, file_bytes)
                except Exception as err:
                    print(f"Skipping {filename}: unsupported file or extraction error {err}")
                    continue

                # 3️⃣ Generate JSON
                structured = generate_json(text)

                # 4️⃣ Save JSON
                json_name = filename.rsplit(".", 1)[0] + ".json"
                supabase.storage.from_(JSON_BUCKET).upload(
                    json_name,
                    json.dumps(structured).encode(),
                    {"content-type": "application/json"},
                )

                # 5️⃣ Public URL
                json_url = supabase.storage.from_(JSON_BUCKET).get_public_url(json_name)

                results.append({
                    "file": filename,
                    "json_file": json_name,
                    "json_url": json_url
                })

            except Exception as file_error:
                print("Error inside processing loop:", file_error)
                continue  # continue processing other files

        return {
            "message": "Processing completed",
            "processed_files": results
        }

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JSONResponse({"error": str(e)}, status_code=500)
