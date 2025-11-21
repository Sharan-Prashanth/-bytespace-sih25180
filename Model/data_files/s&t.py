import pdfplumber
import json
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
BUCKET_NAME = "sandt-storage"  # <-- change to your bucket name

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def extract_pdf_to_json(pdf_path):
    json_output = {
        "file_name": os.path.basename(pdf_path),
        "pages": []
    }

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            text = page.extract_text()
            json_output["pages"].append({
                "page_number": page_num,
                "content": text
            })

    return json_output


def upload_json_to_bucket(bucket_name, json_data, file_name):
    file_bytes = json.dumps(json_data, indent=2).encode("utf-8")

    res = supabase.storage.from_(bucket_name).upload(
        path=f"documents/{file_name}",
        file=file_bytes,
        file_options={"content-type": "application/json"}
    )

    return res


if __name__ == "__main__":
    pdf_path = r"C:\Users\Shanmuga Shyam. B\OneDrive\Desktop\Thrust_Areas_2020 (1).pdf"
    
    json_data = extract_pdf_to_json(pdf_path)
    file_name = os.path.basename(pdf_path).replace(".pdf", ".json")

    print("JSON Created:")
    print(json.dumps(json_data, indent=2))

    # Upload to Supabase bucket instead of table
    res = upload_json_to_bucket(BUCKET_NAME, json_data, file_name)
    print("Uploaded to Supabase Storage:", res)
