import os
from dotenv import load_dotenv

load_dotenv()

import json
import chardet
import PyPDF2
import docx
import re
import google.generativeai as genai
from fastapi import APIRouter, UploadFile, File
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

# Gemini configuration
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Monkey patch to increase timeout globally
import google.api_core.gapic_v1.method
import functools

original_wrap_method = google.api_core.gapic_v1.method.wrap_method

def custom_wrap_method(func, default_retry=None, default_timeout=None, client_info=None):
    # Override default timeout to 600 seconds (10 minutes)
    custom_timeout = 600.0
    return original_wrap_method(func, default_retry=default_retry, default_timeout=custom_timeout, client_info=client_info)

google.api_core.gapic_v1.method.wrap_method = custom_wrap_method

# Configure model with generation settings
model = genai.GenerativeModel(
    "gemini-2.5-flash-lite",
    generation_config=genai.GenerationConfig(
        temperature=0.7,
    )
)


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
    prompt = """Extract the following details from the Form-I proposal content and return ONLY a valid JSON structure. For all long-text fields (definition_of_issue, objectives, justification_subject_area, project_benefits, work_plan, methodology, organization_of_work, time_schedule, foreign_exchange_details, fund_phasing, land_building_justification, equipment_justification, consumables_outlay_notes, cv_details, past_experience, other_details) return their value as a Slate.js nodes array (an array of objects where each object is a Slate block node, e.g. {"type":"paragraph","children":[{"text":"..."}]}).

Values not present should be returned as empty strings or empty arrays.

Return ONLY this format rather then this dont need anything and the extraction needed to add on this structure and need to return same strutred output
. No explanation.
[
  {
    type: 'h1',
    align: 'center',
    children: [{ text: 'PROJECT PROPOSAL FOR S&T GRANT OF MoC', bold: true }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  
  // Sections 1-8: Single comprehensive table
  {
    type: 'table',
    children: [
      {
        type: 'tr',
        children: [
          {
            type: 'th',
            width: '10%',
            children: [{ type: 'p', children: [{ text: '1', bold: true }] }],
          },
          {
            type: 'th',
            width: '40%',
            children: [{ type: 'p', children: [{ text: 'PROJECT TITLE', bold: true }] }],
          },
          {
            type: 'td',
            width: '50%',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'th',
            children: [{ type: 'p', children: [{ text: '2', bold: true }] }],
          },
          {
            type: 'td',
            children: [
              { type: 'p', children: [{ text: 'Name and address of principal Implementing Agency(s)' }] },
              { type: 'p', children: [{ text: 'Name of Project Leader/Coordinator/Principle Investigator' }] },
            ],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'th',
            children: [{ type: 'p', children: [{ text: '3', bold: true }] }],
          },
          {
            type: 'td',
            children: [
              { type: 'p', children: [{ text: 'Name and address of Sub-Implementing Agency(s)' }] },
              { type: 'p', children: [{ text: 'Name of Co-investigator(s)' }] },
            ],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'th',
            children: [{ type: 'p', children: [{ text: '4', bold: true }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: 'Definition of the issue (Max. 300 words)' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'th',
            children: [{ type: 'p', children: [{ text: '5', bold: true }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: 'Objectives (Specific and not more than 2-3)' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'th',
            children: [{ type: 'p', children: [{ text: '6', bold: true }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: 'Justification for subject area (Max. 200 words)' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'th',
            children: [{ type: 'p', children: [{ text: '7', bold: true }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: 'How the project is beneficial to coal industry' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'th',
            children: [{ type: 'p', children: [{ text: '8', bold: true }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: 'Work Plan (Max. 100 words)' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'th',
            children: [{ type: 'p', children: [{ text: '8.1', bold: true }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: 'Methodology (Max. 200 words)' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'th',
            children: [{ type: 'p', children: [{ text: '8.2', bold: true }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: 'Organization of work elements (Max. 200 words)' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'th',
            children: [{ type: 'p', children: [{ text: '8.3', bold: true }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: 'Time schedule of activities giving Milestones (also include a Bar Chart/PERT Chart)' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
    ],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },

  // Section 9: Details of Proposed Outlay
  {
    type: 'h2',
    children: [{ text: '9. Details of proposed outlay', bold: true }],
  },
  {
    type: 'p',
    children: [{ text: '(Rs in lakhs)', italic: true }],
  },
  {
    type: 'table',
    children: [
      {
        type: 'tr',
        children: [
          {
            type: 'th',
            width: '10%',
            children: [{ type: 'p', children: [{ text: 'Sl. No.', bold: true }] }],
          },
          {
            type: 'th',
            width: '30%',
            children: [{ type: 'p', children: [{ text: 'Items', bold: true }] }],
          },
          {
            type: 'th',
            colSpan: 4,
            width: '60%',
            children: [{ type: 'p', children: [{ text: 'Total cost estimated (Rs in lakhs)', bold: true }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'td',
            width: '10%',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            width: '30%',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'th',
            width: '15%',
            children: [{ type: 'p', children: [{ text: 'Total project cost', bold: true }] }],
          },
          {
            type: 'th',
            width: '15%',
            children: [{ type: 'p', children: [{ text: '1st Year', bold: true }] }],
          },
          {
            type: 'th',
            width: '15%',
            children: [{ type: 'p', children: [{ text: '2nd Year', bold: true }] }],
          },
          {
            type: 'th',
            width: '15%',
            children: [{ type: 'p', children: [{ text: '3rd Year', bold: true }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'th',
            children: [{ type: 'p', children: [{ text: 'Capital Expenditure', bold: true }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '9.1' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: 'Land & Building' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '9.2' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: 'Equipment' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '9.3' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: 'Total Capital (9.1+9.2)', bold: true, italic: true }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'th',
            children: [{ type: 'p', children: [{ text: 'Revenue Expenditure', bold: true }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '9.4' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: 'Salaries / allowances' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '9.5' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: 'Consumables' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '9.6' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: 'Travel' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '9.7' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: 'Attending or organizing Workshop/Seminar' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '9.8' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: 'Total Revenue expenditure (9.4+9.5+9.6+9.7)', bold: true, italic: true }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '9.9' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: 'Contingency' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '9.10' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: 'Institutional Overhead' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '9.11' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: 'Applicable taxes/duties/charges etc.' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'th',
            children: [{ type: 'p', children: [{ text: 'Grand Total', bold: true }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '9.12' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '(9.3+ 9.8+9.9+9.10+9.11)', italic: true }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
          {
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
    ],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },

  // Foreign Exchange Component
  {
    type: 'p',
    children: [{ text: 'Foreign Exchange Component:' }],
  },
  {
    type: 'p',
    children: [{ text: 'Name of the Foreign Currency: _______________' }],
  },
  {
    type: 'p',
    children: [{ text: 'Exchange Rate: _______________     Date: _______________' }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },

  // Section 10.0
  {
    type: 'h2',
    children: [{ text: '10.0 Phasing of fund requirement (in percentage) with respect to activities/milestone', bold: true }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },

  // Section 11.0: Outlay for land & Building
  {
    type: 'h2',
    children: [{ text: '11.0 Outlay for land & Building', bold: true }],
  },
  {
    type: 'p',
    children: [{ text: '(Rs. in lakhs)', italic: true }],
  },
  {
    type: 'p',
    children: [{ text: 'Building:', bold: true }],
  },
  {
    type: 'table',
    children: [
      {
        type: 'tr',
        children: [
          {
            type: 'th',
            width: '10%',
            children: [{ type: 'p', children: [{ text: 'Sl. No.', bold: true }] }],
          },
          {
            type: 'th',
            width: '30%',
            children: [{ type: 'p', children: [{ text: 'Item', bold: true }] }],
          },
          {
            type: 'th',
            width: '20%',
            children: [{ type: 'p', children: [{ text: 'Plinth Area', bold: true }] }],
          },
          {
            type: 'th',
            width: '20%',
            children: [{ type: 'p', children: [{ text: 'Type of Bldg.', bold: true }] }],
          },
          {
            type: 'th',
            width: '20%',
            children: [{ type: 'p', children: [{ text: 'Estimated Cost', bold: true }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          { type: 'td', children: [{ type: 'p', children: [{ text: '1.' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
        ],
      },
      {
        type: 'tr',
        children: [
          { type: 'td', children: [{ type: 'p', children: [{ text: '2.' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
        ],
      },
      {
        type: 'tr',
        children: [
          { type: 'th', children: [{ type: 'p', children: [{ text: 'Total', bold: true }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
        ],
      },
    ],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },

  // Section 12.0: Justification for land & building
  {
    type: 'h2',
    children: [{ text: '12.0 Justification for land & building:', bold: true }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },

  // Section 13.0: Outlay for Equipment
  {
    type: 'h2',
    children: [{ text: '13.0 Outlay for Equipment:', bold: true }],
  },
  {
    type: 'table',
    children: [
      {
        type: 'tr',
        children: [
          {
            type: 'th',
            width: '35%',
            children: [{ type: 'p', children: [{ text: 'Generic Name of equipment and accessories with major specifications', bold: true }] }],
          },
          {
            type: 'th',
            width: '10%',
            children: [{ type: 'p', children: [{ text: 'Number', bold: true }] }],
          },
          {
            type: 'th',
            width: '15%',
            children: [{ type: 'p', children: [{ text: 'Imported/ Indigenous', bold: true }] }],
          },
          {
            type: 'th',
            width: '20%',
            children: [{ type: 'p', children: [{ text: 'Estimated Cost (Rs in lakhs)', bold: true }] }],
          },
          {
            type: 'th',
            width: '20%',
            children: [{ type: 'p', children: [{ text: 'Foreign Exchange Component', bold: true }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          { type: 'td', children: [{ type: 'p', children: [{ text: '1.' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
        ],
      },
      {
        type: 'tr',
        children: [
          { type: 'td', children: [{ type: 'p', children: [{ text: '2.' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
        ],
      },
      {
        type: 'tr',
        children: [
          { type: 'td', children: [{ type: 'p', children: [{ text: '3.' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
        ],
      },
      {
        type: 'tr',
        children: [
          { type: 'th', children: [{ type: 'p', children: [{ text: 'Total', bold: true }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
        ],
      },
    ],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },

  // Note section
  {
    type: 'p',
    children: [{ text: 'Note:-', bold: true }],
  },
  {
    type: 'p',
    indent: 1,
    children: [{ text: '(i) Include GST, installation charges, inland transport, insurance etc.' }],
  },
  {
    type: 'p',
    indent: 1,
    children: [{ text: '(ii) For the imported equipment, import duty concessions available for research/S&T/ Environment / Protection / Ecology protection projectors will be availed of, wherever applicable.' }],
  },
  {
    type: 'p',
    indent: 1,
    children: [{ text: '(iii) A Certificate to the effect that imported equipment is essential to the project and in the long run will save/not save foreign exchange.' }],
  },
  {
    type: 'p',
    indent: 1,
    children: [{ text: '(iv)Please elaborate whether the imported equipment will help/not help, in indigenization of technology.' }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },

  // Section 14.0: Justification for Equipment
  {
    type: 'h2',
    children: [{ text: '14.0 Justification for Equipment:', bold: true }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },

  // Section 15.0: Outlay for consumable materials
  {
    type: 'h2',
    children: [{ text: '15.0 Outlay for consumable materials:', bold: true }],
  },
  {
    type: 'table',
    children: [
      {
        type: 'tr',
        children: [
          {
            type: 'th',
            width: '20%',
            children: [{ type: 'p', children: [{ text: 'Head', bold: true }] }],
          },
          {
            type: 'th',
            width: '20%',
            children: [{ type: 'p', children: [{ text: 'Particular', bold: true }] }],
          },
          {
            type: 'th',
            colSpan: 4,
            width: '60%',
            children: [{ type: 'p', children: [{ text: 'Outlay', bold: true }] }],
          },
        ],
      },
      {
        type: 'tr',
        children: [
          { type: 'td', width: '20%', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', width: '20%', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'th', width: '15%', children: [{ type: 'p', children: [{ text: '1st Yr.', bold: true }] }] },
          { type: 'th', width: '15%', children: [{ type: 'p', children: [{ text: '2nd Yr.', bold: true }] }] },
          { type: 'th', width: '15%', children: [{ type: 'p', children: [{ text: '3rd Yr.', bold: true }] }] },
          { type: 'th', width: '15%', children: [{ type: 'p', children: [{ text: 'Total', bold: true }] }] },
        ],
      },
      {
        type: 'tr',
        children: [
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: 'Q' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
        ],
      },
      {
        type: 'tr',
        children: [
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: 'B' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
        ],
      },
      {
        type: 'tr',
        children: [
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: 'F' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
        ],
      },
      {
        type: 'tr',
        children: [
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: 'E' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
        ],
      },
    ],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },

  // Legend
  {
    type: 'p',
    children: [{ text: 'Q  -   Quantity/Number' }],
  },
  {
    type: 'p',
    children: [{ text: 'B  -   Outlay in Rs. Lakhs' }],
  },
  {
    type: 'p',
    children: [{ text: 'F  -   FE Components' }],
  },
  {
    type: 'p',
    children: [{ text: 'E  -   Exchange rate adopted' }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },

  // Section 16.0: Curriculum
  {
    type: 'h2',
    children: [{ text: '16.0 Curriculum – Vitae of Project Proponents, Viz. Principal Investigator/ Project leader and Co-investigator.', bold: true }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  {
    type: 'p',
    indent: 1,
    children: [{ text: '-   Educational Qualifications.' }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  {
    type: 'p',
    indent: 1,
    children: [{ text: '-   Past Experience in the field of research & industry' }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  {
    type: 'p',
    indent: 1,
    children: [{ text: '-   Number of research projects handled' }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  {
    type: 'p',
    indent: 1,
    children: [{ text: '-   Commercial application of research findings of other research projects handled by the investigator(s) in the past.' }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  {
    type: 'p',
    indent: 1,
    children: [{ text: '-   Papers published (India / Abroad) by the Investigators, etc.' }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },

  // Section 17.0: Past experience
  {
    type: 'h2',
    children: [{ text: '17.0 Past experience', bold: true }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  {
    type: 'p',
    indent: 1,
    children: [{ text: '❖   Details of expertise available and work done in the proposed field by the institution/agency(s) concerned.' }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  {
    type: 'p',
    indent: 1,
    children: [{ text: '❖   Details of infrastructure facilities available in the institution.' }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  {
    type: 'p',
    indent: 1,
    children: [{ text: '❖   The past experience and performance of Principal Implementing / Sub-implementing Agency(s) in the execution of similar project vis-a-vis time schedule.' }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  {
    type: 'p',
    indent: 1,
    children: [{ text: '❖   The track record for performance assessment of Academic Institutes should be referring to the performance of respective PIs of the project submitting R&D project proposal for assessing, whether the projects given earlier to them are being properly implemented or are suffering from cost and time overrun.' }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },

  // Section 18.0: Others
  {
    type: 'h2',
    children: [{ text: '18.0 Others', bold: true }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  {
    type: 'p',
    indent: 1,
    children: [{ text: '❖   Discussions with DGMS, in case of projects requiring field trials in the mines.' }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  {
    type: 'p',
    indent: 1,
    children: [{ text: '❖   Literature/ web survey bringing out clearly the recent development in the proposed field in two parts i.e. in the country and in other parts of the world.' }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  {
    type: 'p',
    indent: 1,
    children: [{ text: '❖   R&D components present in the project proposal. Specific research or development content which is exclusive to this proposal shall be clearly indicated.' }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
]

Populate the above structure with the extracted text. Return ONLY the valid JSON array.
"""
    response = model.generate_content([prompt, content])
    raw = response.text.strip()

    # Match JSON array or object
    m = re.search(r"(\[.*\]|\{.*\})", raw, re.DOTALL)
    if m:
        raw = m.group(0)

    try:
        data = json.loads(raw)
        return data
    except:
        # If JSON parsing fails, try to clean up common issues (like single quotes)
        try:
            import ast
            data = ast.literal_eval(raw)
            return data
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


@router.post("/process-file")
async def process_file(file: UploadFile = File(...)):
    """Process a single uploaded file and return the structured JSON (Slate-ready fields).

    This endpoint reads the uploaded file, extracts text depending on extension,
    runs `generate_json`, normalizes Slate fields, and returns the JSON result.
    """
    try:
        filename = file.filename
        file_bytes = await file.read()

        text = extract_text(filename, file_bytes)
        structured = generate_json(text)

        return JSONResponse(structured)

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JSONResponse({"error": str(e)}, status_code=500)
