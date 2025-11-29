import os
import io
import json
import pdfplumber
import uvicorn
import tempfile
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict

# ========= ENVIRONMENT ==========
from dotenv import load_dotenv
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENV")
PINECONE_INDEX = os.getenv("PINECONE_INDEX")

GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY3")

PDF_BUCKET = os.getenv("PDF_BUCKET", "documents")
GUIDELINES_PDF = os.getenv("GUIDELINES_PDF", "guidelines.pdf")
THRUST_PDF = os.getenv("THRUST_PDF", "thrust_areas.pdf")

# ========= CLIENTS ==========
from supabase import create_client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

from pinecone import Pinecone, ServerlessSpec

# Create Pinecone client
pc = Pinecone(api_key=PINECONE_API_KEY)

# Check if index exists
existing_indexes = pc.list_indexes().names()

if PINECONE_INDEX not in existing_indexes:
    pc.create_index(
        name=PINECONE_INDEX,
        dimension=384,
        metric="cosine",
        spec=ServerlessSpec(
            cloud="aws",
            region=PINECONE_ENV
        )
    )

# Connect to the index
index = pc.Index(PINECONE_INDEX)


# ========= EMBEDDING ==========
from sentence_transformers import SentenceTransformer
embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def embed(text):
    return embedder.encode(text).tolist()

# ========= CHUNKING ==========
def chunk_text(text, size=350, overlap=40):
    words = text.split()
    chunks, i = [], 0
    while i < len(words):
        part = words[i:i+size]
        chunks.append(" ".join(part))
        i += size - overlap
    return chunks

# ========= PDF LOADING ==========
def load_pdf_from_supabase(path):
    """
    Load PDF from Supabase storage bucket
    """
    try:
        print(f"Downloading {path} from Supabase...")
        data = supabase.storage.from_(PDF_BUCKET).download(path)
        if data:
            return pdfplumber.open(io.BytesIO(data))
        else:
            raise Exception(f"Failed to download {path}")
    except Exception as e:
        print(f"Error loading PDF {path}: {e}")
        return None

# ========= INGEST ==========
def ingest_pdf(pdf_name, source):
    """
    Ingest a single PDF from Supabase storage
    """
    print(f"Starting ingestion of {pdf_name} as {source}...")
    
    pdf = load_pdf_from_supabase(pdf_name)
    if not pdf:
        print(f"Failed to load PDF: {pdf_name}")
        return False
    
    total_chunks = 0
    try:
        for page in pdf.pages:
            text = page.extract_text() or ""
            if text.strip():  # Only process pages with content
                chunks = chunk_text(text)
                
                for chunk_idx, chunk in enumerate(chunks):
                    if chunk.strip():  # Only process non-empty chunks
                        try:
                            # Store chunk in database
                            row = supabase.table("chunks").insert({
                                "source": source,
                                "pdf_name": pdf_name,
                                "page_number": page.page_number,
                                "chunk_text": chunk
                            }).execute().data[0]

                            # Generate embedding
                            vec = embed(chunk)
                            
                            # Store in vector database
                            index.upsert([(
                                str(row["id"]), 
                                vec, 
                                {
                                    "source": source, 
                                    "page": page.page_number,
                                    "chunk_id": chunk_idx
                                }
                            )])
                            total_chunks += 1
                            
                        except Exception as e:
                            print(f"Error processing chunk {chunk_idx} on page {page.page_number}: {e}")
                            continue
        
        pdf.close()
        print(f"✓ Ingested {source}: {total_chunks} chunks from {len(pdf.pages)} pages")
        return True
        
    except Exception as e:
        print(f"Error during PDF ingestion for {source}: {e}")
        pdf.close()
        return False

def run_ingestion():
    """
    Ingest both S&T Guidelines and Thrust Areas from Supabase storage
    """
    print("🚀 Starting ingestion from Supabase storage...")
    
    # Use actual filenames from your Supabase storage
    guidelines_files = [
        "Modified_S&T_Guidelines.pdf",  # Adjust if filename is different
        "guidelines.pdf",  # Fallback
        GUIDELINES_PDF  # Environment variable
    ]
    
    thrust_files = [
        "Thrust_Areas_2020.pdf",
        "thrust_areas.pdf",  # Fallback 
        THRUST_PDF  # Environment variable
    ]
    
    guidelines_success = False
    thrust_success = False
    
    # Try ingesting guidelines
    for filename in guidelines_files:
        if ingest_pdf(filename, "guidelines"):
            guidelines_success = True
            break
    
    # Try ingesting thrust areas
    for filename in thrust_files:
        if ingest_pdf(filename, "thrust"):
            thrust_success = True
            break
    
    if guidelines_success and thrust_success:
        print("✅ ALL DOCUMENTS SUCCESSFULLY INGESTED")
        return {"status": "success", "message": "Both guidelines and thrust areas ingested"}
    elif guidelines_success:
        print("⚠️ Only guidelines ingested, thrust areas failed")
        return {"status": "partial", "message": "Guidelines ingested, thrust areas failed"}
    elif thrust_success:
        print("⚠️ Only thrust areas ingested, guidelines failed")
        return {"status": "partial", "message": "Thrust areas ingested, guidelines failed"}
    else:
        print("❌ INGESTION FAILED FOR ALL DOCUMENTS")
        return {"status": "error", "message": "Failed to ingest any documents"}

# ========= LOCAL PDF INGESTION ==========
def ingest_local_guidelines(guidelines_dir="guidelines"):
    """
    Ingest PDF files from local guidelines directory
    """
    if not os.path.exists(guidelines_dir):
        print(f"Guidelines directory '{guidelines_dir}' not found")
        return {"status": "error", "message": f"Directory '{guidelines_dir}' not found"}
    
    ingested_docs = []
    total_chunks = 0
    
    try:
        # Process all PDF files in directory
        for filename in os.listdir(guidelines_dir):
            if filename.lower().endswith('.pdf'):
                pdf_path = os.path.join(guidelines_dir, filename)
                print(f"Processing {filename}...")
                
                # Extract and process PDF
                with pdfplumber.open(pdf_path) as pdf:
                    for page_num, page in enumerate(pdf.pages, 1):
                        text = page.extract_text() or ""
                        if text.strip():  # Only process non-empty pages
                            chunks = chunk_text(text)
                            
                            for chunk_idx, chunk in enumerate(chunks):
                                if chunk.strip():  # Only process non-empty chunks
                                    # Store in database
                                    try:
                                        row = supabase.table("chunks").insert({
                                            "source": filename,
                                            "pdf_name": filename,
                                            "page_number": page_num,
                                            "chunk_text": chunk
                                        }).execute().data[0]
                                        
                                        # Generate embedding and store in vector DB
                                        vec = embed(chunk)
                                        index.upsert([(
                                            str(row["id"]), 
                                            vec, 
                                            {
                                                "source": filename,
                                                "page": page_num,
                                                "chunk_id": chunk_idx
                                            }
                                        )])
                                        total_chunks += 1
                                        
                                    except Exception as e:
                                        print(f"Error processing chunk: {e}")
                                        continue
                
                ingested_docs.append({
                    'filename': filename,
                    'pages': len(pdf.pages),
                    'processed': True
                })
                print(f"✓ Processed {filename}")
        
        return {
            "status": "success",
            "message": f"Ingested {len(ingested_docs)} documents with {total_chunks} total chunks",
            "documents": ingested_docs
        }
        
    except Exception as e:
        print(f"Error during ingestion: {e}")
        return {"status": "error", "message": str(e)}

# ========= RETRIEVAL ==========
def retrieve(query, k=8):
    qvec = embed(query)
    results = index.query(vector=qvec, top_k=k, include_metadata=True)
    items = []

    for m in results["matches"]:
        cid = m["id"]
        row = supabase.table("chunks").select("*").eq("id", cid).single().execute().data
        items.append({
            "chunk_id": cid,
            "score": m["score"],
            "page": m["metadata"]["page"],
            "source": m["metadata"]["source"],
            "chunk": row["chunk_text"]
        })
    return items

# ========= GEMINI CALL ==========
import google.generativeai as genai
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash-lite")

def call_gemini(prompt):
    try:
        response = model.generate_content(prompt)
        if response and response.text:
            return response.text.strip()
        else:
            raise ValueError("Empty response from Gemini model")
    except Exception as e:
        print(f"Gemini API Error: {e}")
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

# ========= FORM-I FIELD EXTRACTION ==========
def extract_form1_fields(pdf_path: str):
    pdf = pdfplumber.open(pdf_path)
    
    # Extract text and tables from all pages
    all_text = ""
    all_tables = []
    
    for page_num, page in enumerate(pdf.pages, 1):
        # Extract text
        page_text = page.extract_text() or ""
        all_text += f"\n--- PAGE {page_num} ---\n{page_text}\n"
        
        # Extract tables
        tables = page.extract_tables()
        if tables:
            for table_idx, table in enumerate(tables):
                all_tables.append({
                    'page': page_num,
                    'table_index': table_idx,
                    'data': table
                })
    
    pdf.close()

    # Enhanced field extraction with table processing
    def extract_field_value(text, patterns):
        """Extract field value using multiple pattern attempts"""
        for pattern in patterns:
            if ":" in pattern:
                try:
                    start_key = pattern
                    start_pos = text.find(start_key)
                    if start_pos != -1:
                        remaining_text = text[start_pos + len(start_key):]
                        stop_patterns = ['\n1.', '\n2.', '\n3.', '\n4.', '\n5.', '\n6.', '\n7.', '\n8.', '\n9.', 
                                       '\nName', '\nObjectives', '\nJustification', '\nMethodology', '\nBenefits']
                        
                        end_pos = len(remaining_text)
                        for stop_pattern in stop_patterns:
                            pos = remaining_text.find(stop_pattern)
                            if pos != -1 and pos < end_pos:
                                end_pos = pos
                        
                        return remaining_text[:end_pos].strip()
                except Exception:
                    continue
            else:
                if pattern in text:
                    return pattern
        return ""

    # Process tables into structured data
    def process_tables(tables):
        """Convert tables to structured text for analysis"""
        table_content = {}
        
        for table_info in tables:
            page = table_info['page']
            table_data = table_info['data']
            
            if table_data and len(table_data) > 1:  # Has headers and data
                # Create table description
                table_text = f"Table on Page {page}:\n"
                
                for row_idx, row in enumerate(table_data):
                    if row and any(cell for cell in row if cell):  # Skip empty rows
                        row_text = " | ".join([str(cell or "") for cell in row])
                        table_text += f"Row {row_idx + 1}: {row_text}\n"
                
                # Try to identify table type based on content
                table_lower = table_text.lower()
                if any(keyword in table_lower for keyword in ['cost', 'budget', 'expense', 'amount']):
                    table_content['cost_table'] = table_text
                elif any(keyword in table_lower for keyword in ['timeline', 'schedule', 'duration', 'month', 'year']):
                    table_content['timeline_table'] = table_text
                elif any(keyword in table_lower for keyword in ['deliverable', 'output', 'milestone']):
                    table_content['deliverables_table'] = table_text
                elif any(keyword in table_lower for keyword in ['personnel', 'staff', 'investigator', 'team']):
                    table_content['personnel_table'] = table_text
                else:
                    table_content[f'table_page_{page}'] = table_text
        
        return table_content

    # Extract structured fields
    extracted_fields = {
        "proposal_id": "PDF-" + os.urandom(4).hex(),
        "title": extract_field_value(all_text, [
            "1. PROJECT TITLE:",
            "1 PROJECT TITLE:",
            "PROJECT TITLE:",
            "Title:"
        ]),
        "pi_name": extract_field_value(all_text, [
            "2. Name of Principal Investigator:",
            "2 Name of Principal Investigator:",
            "Principal Investigator:",
            "PI Name:"
        ]),
        "organization": extract_field_value(all_text, [
            "3. Name of the Organization:",
            "3 Name of the Organization:",
            "Organization:",
            "Institute:"
        ]),
        "definition": extract_field_value(all_text, [
            "4. Definition of the issue:",
            "4 Definition of the issue:",
            "Definition of the issue:",
            "Problem Definition:"
        ]),
        "objectives": extract_field_value(all_text, [
            "5. Objectives:",
            "5 Objectives:",
            "Objectives:",
            "Project Objectives:"
        ]),
        "justification": extract_field_value(all_text, [
            "6. Justification:",
            "6 Justification:",
            "Justification:",
            "Project Justification:"
        ]),
        "benefits": extract_field_value(all_text, [
            "7. How the project is beneficial:",
            "7 How the project is beneficial:",
            "Benefits to Coal Industry:",
            "Benefits:"
        ]),
        "methodology": extract_field_value(all_text, [
            "8.1 Methodology:",
            "8.1. Methodology:",
            "Methodology:",
            "Approach:"
        ]),
        "work_plan": extract_field_value(all_text, [
            "8.2 Organization of work:",
            "8.2. Organization of work:",
            "Work Plan:",
            "Project Plan:"
        ]),
        "deliverables": extract_field_value(all_text, [
            "Deliverables:",
            "Expected Deliverables:",
            "Project Deliverables:",
            "Outputs:"
        ]),
        "thrust_area_claimed": extract_field_value(all_text, [
            "Thrust Area:",
            "Research Area:",
            "Focus Area:",
            "Domain:"
        ])
    }

    # Process tables and add to fields
    table_content = process_tables(all_tables)
    extracted_fields.update(table_content)
    
    # Add full document text for comprehensive search
    extracted_fields["full_document_text"] = all_text

    return extracted_fields

# ========= VALIDATION ==========
def validate_proposal(fields):
    """
    🔍 STEP 1: Extract Key Fields & Table Data from FORM-I - COMPLETED in extract_form1_fields
    
    🔎 STEP 2: Convert Extracted FORM-I Data into Targeted Search Queries for S&T Guidelines
    """
    
    # Generate specific search queries based on the form content from the images
    search_queries = []
    
    # Query 1: Project title and objectives validation
    title = fields.get('title', 'Project title comes here')
    objectives = fields.get('objectives', 'Objectives section')
    if title or objectives:
        search_queries.append({
            'query': f"project title requirements objectives criteria validation {title} {objectives}",
            'purpose': 'title_objectives_validation',
            'field_name': 'Project Title & Objectives'
        })
    
    # Query 2: Principal investigator qualifications
    pi_name = fields.get('pi_name', 'principal')
    search_queries.append({
        'query': f"principal investigator qualifications eligibility criteria requirements {pi_name}",
        'purpose': 'pi_eligibility',
        'field_name': 'Principal Investigator Eligibility'
    })
    
    # Query 3: Sub-agency and implementing agency requirements
    organization = fields.get('organization', 'Sub-agency')
    search_queries.append({
        'query': f"sub-agency implementing agency organization requirements criteria {organization}",
        'purpose': 'agency_requirements',
        'field_name': 'Agency Requirements'
    })
    
    # Query 4: Issue definition and problem statement criteria
    issue_definition = fields.get('definition', 'Issue will come here')
    search_queries.append({
        'query': f"issue definition problem statement research criteria validation {issue_definition}",
        'purpose': 'issue_validation',
        'field_name': 'Issue Definition'
    })
    
    # Query 5: Justification and benefits criteria
    justification = fields.get('justification', 'Justify')
    benefits = fields.get('benefits', 'Very very beneficial')
    search_queries.append({
        'query': f"justification benefits coal industry research validation criteria {justification} {benefits}",
        'purpose': 'benefits_validation',
        'field_name': 'Justification & Benefits'
    })
    
    # Query 6: Work plan and methodology requirements
    work_plan = fields.get('work_plan', 'Work plan will come here')
    methodology = fields.get('methodology', 'Methodology will come here')
    search_queries.append({
        'query': f"work plan methodology research approach requirements validation {work_plan} {methodology}",
        'purpose': 'methodology_validation',
        'field_name': 'Work Plan & Methodology'
    })
    
    # Query 7: Budget and cost validation (specific to cost table)
    cost_table = fields.get('cost_table', '')
    if cost_table or 'Grand Total' in str(fields.get('full_document_text', '')):
        search_queries.append({
            'query': f"budget cost expenditure capital revenue foreign exchange limits maximum allowed {cost_table}",
            'purpose': 'budget_validation',
            'field_name': 'Budget & Cost Structure'
        })
    
    # Query 8: Timeline and project duration criteria
    timeline_table = fields.get('timeline_table', '')
    if timeline_table or 'Bar Chart' in str(fields.get('full_document_text', '')):
        search_queries.append({
            'query': f"timeline project duration schedule milestones maximum allowed duration {timeline_table}",
            'purpose': 'timeline_validation',
            'field_name': 'Project Timeline'
        })

    """
    📚 STEP 3: Retrieve Relevant S&T Guideline Conditions (RAG)
    """
    
    validation_results = []
    print(f"🔍 Searching S&T Guidelines for {len(search_queries)} specific criteria...")
    
    for search in search_queries:
        try:
            print(f"  🔎 Searching: {search['field_name']}")
            chunks = retrieve(search['query'], k=3)  # Get top 3 most relevant guidelines
            
            if chunks:
                # Prepare evidence for this specific field
                evidence_text = ""
                for i, chunk in enumerate(chunks, 1):
                    evidence_text += f"""
[GUIDELINE {i}]
Source: {chunk['source']} | Page: {chunk['page']} | Relevance: {chunk['score']:.3f}
Content: {chunk['chunk'][:400]}
---
"""
                
                # Get field value from extracted data
                field_value = ""
                if search['purpose'] == 'title_objectives_validation':
                    field_value = f"Title: {title}\nObjectives: {objectives}"
                elif search['purpose'] == 'pi_eligibility':
                    field_value = f"Principal Investigator: {pi_name}"
                elif search['purpose'] == 'agency_requirements':
                    field_value = f"Organization: {organization}"
                elif search['purpose'] == 'issue_validation':
                    field_value = f"Issue Definition: {issue_definition}"
                elif search['purpose'] == 'benefits_validation':
                    field_value = f"Justification: {justification}\nBenefits: {benefits}"
                elif search['purpose'] == 'methodology_validation':
                    field_value = f"Work Plan: {work_plan}\nMethodology: {methodology}"
                elif search['purpose'] == 'budget_validation':
                    field_value = f"Cost Information: {cost_table[:300]}"
                elif search['purpose'] == 'timeline_validation':
                    field_value = f"Timeline Information: {timeline_table[:300]}"
                
                """
                🤖 STEP 4: LLM Validation for Each Field
                """
                
                prompt = f"""You are validating a FORM-I proposal field against S&T Guidelines from Coal India Limited.

FIELD BEING VALIDATED: {search['field_name']}

PROPOSAL FIELD VALUE:
{field_value}

RETRIEVED S&T GUIDELINE CONDITIONS:
{evidence_text}

VALIDATION TASK:
Using ONLY the provided guideline conditions above, determine if the proposal field value satisfies the requirements.

CRITICAL INSTRUCTIONS:
- Use ONLY conditions explicitly mentioned in the retrieved guidelines
- Do NOT create or assume requirements not stated in the guidelines
- If guidelines are unclear or insufficient, default to FALSE
- Look for specific criteria like limits, requirements, eligibility, format, etc.
- Provide exact text from guidelines as justification

Return ONLY this JSON structure:
{{
    "field_name": "{search['field_name']}",
    "validation_result": true/false,
    "condition_found": "Exact condition text from guidelines (if any)",
    "reason": "Brief explanation of why the field passes/fails the condition",
    "guideline_source": "Source document and page number",
    "confidence": "high/medium/low"
}}
"""
                
                try:
                    response = model.generate_content(prompt)
                    response_text = response.text.strip()
                    
                    # Parse JSON response
                    if "```json" in response_text:
                        start = response_text.find("```json") + 7
                        end = response_text.find("```", start)
                        json_str = response_text[start:end].strip()
                    else:
                        json_str = response_text
                    
                    field_result = json.loads(json_str)
                    validation_results.append(field_result)
                    
                    # Print individual result
                    status = "✅ PASS" if field_result.get('validation_result', False) else "❌ FAIL"
                    print(f"    {status} {search['field_name']}: {field_result.get('reason', 'No reason provided')}")
                    
                except json.JSONDecodeError as e:
                    print(f"    ⚠️ JSON parsing error for {search['field_name']}: {e}")
                    validation_results.append({
                        "field_name": search['field_name'],
                        "validation_result": False,
                        "reason": f"Parsing error: {str(e)}",
                        "error": True
                    })
                except Exception as e:
                    print(f"    ❌ Validation error for {search['field_name']}: {e}")
                    validation_results.append({
                        "field_name": search['field_name'],
                        "validation_result": False,
                        "reason": f"Validation error: {str(e)}",
                        "error": True
                    })
            else:
                print(f"    ⚠️ No guidelines found for {search['field_name']}")
                validation_results.append({
                    "field_name": search['field_name'],
                    "validation_result": False,
                    "reason": "No relevant guidelines found in database",
                    "no_guidelines": True
                })
                
        except Exception as e:
            print(f"❌ Error processing {search['field_name']}: {e}")
            validation_results.append({
                "field_name": search['field_name'],
                "validation_result": False,
                "reason": f"Processing error: {str(e)}",
                "error": True
            })

    """
    🧾 STEP 5: Compile Overall Results
    """
    
    # Calculate overall results
    total_fields = len(validation_results)
    passed_fields = sum(1 for result in validation_results if result.get('validation_result', False))
    overall_pass = passed_fields == total_fields and total_fields > 0
    
    final_result = {
        "overall_validation": overall_pass,
        "summary": f"Passed {passed_fields}/{total_fields} validation criteria",
        "individual_validations": validation_results,
        "title": fields.get('title', 'Unknown Title'),
        "total_criteria_checked": total_fields,
        "criteria_passed": passed_fields,
        "criteria_failed": total_fields - passed_fields
    }
    
    print(f"\n📋 VALIDATION SUMMARY:")
    print(f"Title: {final_result['title']}")
    print(f"Overall Result: {'✅ APPROVED' if overall_pass else '❌ REJECTED'}")
    print(f"Score: {passed_fields}/{total_fields} criteria met")
    
    return final_result

# ========= FASTAPI ROUTER ==========
router = APIRouter(
    prefix="/validation",
    tags=["validation"],
    responses={404: {"description": "Not found"}}
)

# Middleware will be handled by main FastAPI app

@router.get("/")
async def root():
    """
    Health check endpoint
    """
    return {
        "message": "AI Proposal Validator API",
        "status": "active",
        "version": "1.0.0",
        "endpoints": {
            "validate": "POST /validation",
            "ingest": "POST /ingest-guidelines", 
            "search": "GET /search-guidelines"
        }
    }

@router.post("/ingest-guidelines")
async def ingest_guidelines():
    """
    One-time ingestion of guideline documents.
    Processes PDFs from Supabase storage and stores in vector database.
    """
    try:
        # Primary: Ingest from Supabase storage
        print("Attempting Supabase ingestion...")
        result = run_ingestion()
        
        if result["status"] in ["success", "partial"]:
            return JSONResponse(
                status_code=200 if result["status"] == "success" else 207,
                content={
                    **result,
                    "source": "supabase_storage",
                    "files_processed": [
                        "Modified_S&T_Guidelines.pdf",
                        "Thrust_Areas_2020.pdf"
                    ]
                }
            )
        else:
            # Fallback to local directory if Supabase fails
            print("Supabase ingestion failed, trying local directory...")
            local_result = ingest_local_guidelines()
            
            if local_result["status"] == "success":
                return JSONResponse(
                    status_code=200,
                    content={
                        **local_result,
                        "source": "local_directory",
                        "fallback": True
                    }
                )
            else:
                return JSONResponse(
                    status_code=500,
                    content={
                        "status": "error",
                        "message": "Both Supabase and local ingestion failed",
                        "supabase_error": result["message"],
                        "local_error": local_result["message"]
                    }
                )
            
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Ingestion process failed: {str(e)}"
            }
        )

@router.post("/validate-form1")
async def validate_form1(file: UploadFile = File(...)):
    """
    Main validation endpoint:
    1. Accepts FORM-I PDF upload
    2. Extracts fields and tables
    3. Searches relevant guidelines using RAG
    4. Evaluates using LLM
    5. Returns validation results
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400, 
            detail="Only PDF files are accepted"
        )
    
    temp_pdf_path = None
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            temp_pdf_path = tmp.name
        
        # Step 1: Extract fields from FORM-I PDF
        print("Extracting fields from FORM-I...")
        fields = extract_form1_fields(temp_pdf_path)
        
        if not fields:
            raise HTTPException(
                status_code=400,
                detail="Failed to extract data from PDF"
            )
        
        # Step 2-5: Validate using RAG and LLM
        print("Validating proposal...")
        validation_result = validate_proposal(fields)
        
        # Add extracted fields summary to response
        response = {
            "validation_result": validation_result,
            "extracted_fields": {
                "title": fields.get('title', 'Not found'),
                "pi_name": fields.get('pi_name', 'Not found'),
                "organization": fields.get('organization', 'Not found'),
                "thrust_area_claimed": fields.get('thrust_area_claimed', 'Not specified'),
                "has_cost_table": bool(fields.get('cost_table')),
                "has_timeline_table": bool(fields.get('timeline_table')),
                "proposal_id": fields.get('proposal_id')
            },
            "processing_info": {
                "timestamp": "2024-11-29T00:00:00Z",
                "model_version": "1.0.0",
                "filename": file.filename
            }
        }
        
        return JSONResponse(
            status_code=200,
            content=response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Validation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Validation failed: {str(e)}"
        )
        
    finally:
        # Clean up temporary file
        if temp_pdf_path and os.path.exists(temp_pdf_path):
            try:
                os.unlink(temp_pdf_path)
            except Exception as e:
                print(f"Failed to delete temp file: {e}")

@router.get("/search-guidelines")
async def search_guidelines(query: str, k: int = 5):
    """
    Search guidelines database for testing RAG functionality
    """
    if not query.strip():
        raise HTTPException(
            status_code=400,
            detail="Query parameter cannot be empty"
        )
    
    try:
        results = retrieve(query, k=k)
        
        return JSONResponse(
            status_code=200,
            content={
                "query": query,
                "results_count": len(results),
                "results": results
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(e)}"
        )

@router.get("/status")
async def get_status():
    """
    Get system status and database information
    """
    try:
        # Check database connection
        chunks_count = supabase.table("chunks").select("id", count="exact").execute().count
        
        # Check Pinecone index
        index_stats = index.describe_index_stats()
        
        # Check Supabase storage files
        try:
            files = supabase.storage.from_(PDF_BUCKET).list()
            storage_files = [f["name"] for f in files if f["name"].endswith('.pdf')]
        except Exception as e:
            storage_files = [f"Error accessing storage: {str(e)}"]
        
        return JSONResponse(
            status_code=200,
            content={
                "status": "healthy",
                "database": {
                    "chunks_stored": chunks_count,
                    "vector_count": index_stats.get("total_vector_count", 0)
                },
                "storage": {
                    "bucket": PDF_BUCKET,
                    "available_files": storage_files
                },
                "models": {
                    "embedding": "sentence-transformers/all-MiniLM-L6-v2",
                    "llm": "gemini-2.5-flash-lite"
                }
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error", 
                "message": str(e)
            }
        )

@router.get("/test-storage")
async def test_storage():
    """
    Test accessing files from Supabase storage
    """
    try:
        files = supabase.storage.from_(PDF_BUCKET).list()
        pdf_files = [f for f in files if f["name"].endswith('.pdf')]
        
        test_results = []
        for file_info in pdf_files:
            filename = file_info["name"]
            try:
                # Test downloading a small portion
                data = supabase.storage.from_(PDF_BUCKET).download(filename)
                size = len(data) if data else 0
                test_results.append({
                    "filename": filename,
                    "accessible": size > 0,
                    "size_bytes": size,
                    "status": "✓ Accessible" if size > 0 else "✗ Not accessible"
                })
            except Exception as e:
                test_results.append({
                    "filename": filename,
                    "accessible": False,
                    "error": str(e),
                    "status": "✗ Error"
                })
        
        return JSONResponse(
            status_code=200,
            content={
                "bucket": PDF_BUCKET,
                "total_pdfs": len(pdf_files),
                "files": test_results
            }
        )
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Storage test failed: {str(e)}"
            }
        )

# Module info for import
__all__ = [
    "router", 
    "validate_proposal", 
    "extract_form1_fields", 
    "run_ingestion", 
    "retrieve"
]

# For standalone testing only
if __name__ == "__main__":
    from fastapi import FastAPI
    
    standalone_router = FastAPI(title="AI Proposal Validator - Standalone")
    standalone_router.include_router(router)
    
    print("🚀 Running validation module in standalone mode...")
    print("📋 Available Endpoints:")
    print("  📤 POST /validation/validate-form1")
    print("  📚 POST /validation/ingest-guidelines")
    print("  🔍 GET /validation/search-guidelines")
    print("  📊 GET /validation/status")
    
    uvicorn.run(standalone_router, host="0.0.0.0", port=8001, reload=True)