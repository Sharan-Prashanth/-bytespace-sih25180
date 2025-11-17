import os
from fastapi import APIRouter, UploadFile, File
from supabase import create_client, Client
import uuid
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Missing SUPABASE_URL or SUPABASE_KEY in environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

BUCKET = "Coal-research-files"  # exact bucket name

@router.post("/upload")
async def upload_files(files: list[UploadFile] = File(...)):
    uploaded = []

    for file in files:
        ext = file.filename.split(".")[-1]
        unique_name = f"{uuid.uuid4()}.{ext}"
        file_bytes = await file.read()

        # IMPORTANT: correct upload format for Supabase Python client
        supabase.storage.from_(BUCKET).upload(
            unique_name,
            file_bytes,
            {
                "content-type": file.content_type
            }
        )

        public_url = supabase.storage.from_(BUCKET).get_public_url(unique_name)

        uploaded.append({
            "filename": file.filename,
            "stored_as": unique_name,
            "public_url": public_url
        })

    return {"count": len(uploaded), "files": uploaded}
