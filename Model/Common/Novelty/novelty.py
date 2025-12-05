"""
Simplified novelty checker
- Loads processed JSON files from Supabase storage bucket (default: 'processed-json')
- Accepts an uploaded PDF or an `extracted_json` string (JSON) with `project_details`
- Computes SBERT embeddings and compares the input proposal to past projects
- Returns: novelty_percentage, comment, flagged_lines

Usage:
    - Configure `SUPABASE_URL` and `SUPABASE_KEY` in environment (.env)
    - Optionally set `PROCESSED_JSON_BUCKET` env var (defaults to 'processed-json')

Endpoint:
    POST /analyze-novelty
    form fields: `file` (pdf) or `extracted_json` (string)

"""
import os
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# minimal logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Config
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
PROCESSED_BUCKET = os.getenv("PROCESSED_JSON_BUCKET", "processed-json")
EMBED_MODEL = os.getenv("EMBED_MODEL", "all-MiniLM-L6-v2")
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.6"))
TOP_FLAGGED = int(os.getenv("TOP_FLAGGED", "10"))

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("SUPABASE_URL and SUPABASE_KEY must be set in environment")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Lazy load sentence-transformers to avoid heavy import on module load
_embedder = None

def get_embedder():
    global _embedder
    if _embedder is None:
        try:
            from sentence_transformers import SentenceTransformer
            _embedder = SentenceTransformer(EMBED_MODEL)
            logger.info(f"Loaded embedder: {EMBED_MODEL}")
        except Exception as e:
            logger.error(f"Failed to load SentenceTransformer: {e}")
            raise
    return _embedder

# -------------------- Helpers --------------------

def extract_text_from_pdf_bytes(file_bytes: bytes) -> str:
    try:
        import PyPDF2
        from io import BytesIO
        reader = PyPDF2.PdfReader(BytesIO(file_bytes))
        texts = []
        for page in reader.pages:
            texts.append(page.extract_text() or "")
        return "\n".join(texts)
    except Exception as e:
        logger.error(f"PDF text extraction failed: {e}")
        return ""


def load_processed_projects_from_supabase(bucket: str = PROCESSED_BUCKET) -> List[Dict[str, Any]]:
    """Download JSON files from the Supabase storage bucket and return as list of dicts.
    This function handles failures gracefully and returns an empty list on error.
    """
    projects = []
    try:
        # list files in bucket
        res = supabase.storage.from_(bucket).list()
        # `res` format may vary; try to handle common cases
        files = []
        if isinstance(res, list):
            files = res
        elif isinstance(res, dict) and res.get("data"):
            files = res["data"]
        else:
            files = res

        for f in files:
            # each `f` may be a dict with 'name' key or a string
            filename = f.get("name") if isinstance(f, dict) and f.get("name") else f
            try:
                dl = supabase.storage.from_(bucket).download(filename)
                # downloaded object may be bytes-like or a response with 'content'
                content = None
                if hasattr(dl, 'content'):
                    content = dl.content
                elif isinstance(dl, (bytes, bytearray)):
                    content = dl
                else:
                    # fallback: try to get public url and fetch
                    pub = supabase.storage.from_(bucket).get_public_url(filename)
                    import requests
                    r = requests.get(pub)
                    if r.status_code == 200:
                        content = r.content

                if content:
                    try:
                        text = content.decode('utf-8')
                    except Exception:
                        try:
                            text = content.decode('latin-1')
                        except Exception:
                            text = None

                    if text:
                        try:
                            data = json.loads(text)
                            projects.append({"filename": filename, "data": data})
                        except Exception:
                            # not valid json
                            continue
            except Exception as e:
                logger.warning(f"Failed to download/parse {filename} from bucket {bucket}: {e}")
                continue
    except Exception as e:
        logger.error(f"Failed to list files from bucket {bucket}: {e}")
    return projects


def flatten_project_text(project: Dict[str, Any]) -> str:
    """Given a processed project JSON, extract concatenated textual content for embedding/similarity."""
    parts = []
    # try common keys
    jd = project.get('data') if isinstance(project.get('data'), dict) else project.get('data', {})
    if not isinstance(jd, dict):
        jd = {}
    # look for project_details or raw_text or extracted_text
    for candidate in ['project_details', 'extracted', 'extracted_data', 'raw_data', 'raw_text', 'text']:
        if candidate in jd:
            v = jd[candidate]
            if isinstance(v, dict):
                parts.extend([str(x) for x in v.values() if x])
            elif isinstance(v, list):
                parts.extend([str(x) for x in v if x])
            elif isinstance(v, str):
                parts.append(v)
    # fallback: try iterate all values
    if not parts:
        for k, v in jd.items():
            if isinstance(v, str) and len(v) > 20:
                parts.append(v)
            elif isinstance(v, dict):
                parts.extend([str(x) for x in v.values() if isinstance(x, str) and len(x) > 20])
    return '\n'.join(parts)


def extract_sections_from_project(project: Dict[str, Any], section_keys: List[str]) -> Dict[str, str]:
    """Try to extract specific named sections from a project's `project_details` or top-level keys.
    Returns a dict mapping normalized section keys to text (empty string if not found).
    Matching is case-insensitive and uses a list of common aliases.
    """
    aliases = {
        'methodology': ['methodology', 'method', 'approach', 'technique'],
        'benefit_to_coal': ['benefit_to_coal', 'benefit', 'impact', 'benefits', 'benefit_to_industry', 'benefit_to_coal_industry'],
        'definition_of_issues': ['definition_of_issues', 'problem', 'issues', 'problem_statement', 'need', 'challenge'],
        'objective': ['objective', 'objectives', 'aim', 'goals'],
        'justification': ['justification', 'rationale', 'justification_of_subject_area', 'why'],
        'work_plan': ['work_plan', 'workplan', 'plan', 'timeline', 'activities']
    }

    # Prepare search source: prefer project_details dict, else use top-level
    src = {}
    if isinstance(project.get('data'), dict):
        jd = project.get('data')
    else:
        jd = project.get('data', {}) if isinstance(project.get('data'), dict) else project.get('data') or {}

    if isinstance(jd, dict) and 'project_details' in jd and isinstance(jd['project_details'], dict):
        src = {k.lower(): v for k, v in jd['project_details'].items()}
    elif isinstance(jd, dict):
        src = {k.lower(): v for k, v in jd.items()}
    elif isinstance(project, dict):
        # try top-level
        src = {k.lower(): v for k, v in project.items()}

    results = {k: '' for k in section_keys}
    for sk in section_keys:
        found_texts = []
        for alias in aliases.get(sk, [sk]):
            for key, val in src.items():
                if alias in key:
                    if isinstance(val, str) and val.strip():
                        found_texts.append(val.strip())
                    elif isinstance(val, (list, dict)):
                        try:
                            found_texts.append(json.dumps(val))
                        except Exception:
                            found_texts.append(str(val))
        # fallback: if nothing found, try to see long strings in src values
        if not found_texts:
            for key, val in src.items():
                if isinstance(val, str) and len(val) > 80 and sk.split('_')[0] in key:
                    found_texts.append(val.strip())

        results[sk] = '\n'.join(found_texts).strip()

    return results


def compute_embeddings(texts: List[str]):
    embedder = get_embedder()
    return embedder.encode(texts, convert_to_numpy=True, show_progress_bar=False)


# -------------------- Core logic --------------------

router = APIRouter()

@router.post('/analyze-novelty')
async def analyze_novelty(request: Request, file: UploadFile = File(None), extracted_json: Optional[str] = Form(None)):
    """Analyze novelty for uploaded PDF or provided extracted JSON string.
    Returns novelty percentage, a short comment, and flagged similar lines.
    """
    try:
        # Load processed projects from Supabase
        past_projects = load_processed_projects_from_supabase(PROCESSED_BUCKET)
        if not past_projects:
            logger.warning('No past projects loaded from Supabase; comparisons will be limited')

        # Prepare past project texts
        past_texts = [flatten_project_text(p) for p in past_projects if flatten_project_text(p).strip()]
        past_filenames = [p['filename'] for p in past_projects if flatten_project_text(p).strip()]

        # Read input
        input_text = ""
        parsed_input_json = None
        # read uploaded file early (if present) so we can prefer uploaded JSON over form field
        file_bytes = None
        file_name = None
        file_processed = False
        if file is not None:
            file_name = (file.filename or '').lower()
            try:
                file_bytes = await file.read()
            except Exception:
                file_bytes = None
        # Treat empty strings as not provided
        if isinstance(extracted_json, str) and extracted_json.strip() == "":
            extracted_json = None

        # If client sent application/json body instead of multipart/form-data, accept that payload
        if extracted_json is None:
            content_type = request.headers.get('content-type', '')
            if 'application/json' in content_type:
                try:
                    body = await request.json()
                    # If caller sent an object with 'extracted_json', use that; else if they sent the full project JSON, use it
                    if isinstance(body, dict):
                        if 'extracted_json' in body:
                            ej = body.get('extracted_json')
                            if isinstance(ej, (dict, list)):
                                extracted_json = json.dumps(ej)
                            elif ej is None:
                                extracted_json = None
                            else:
                                extracted_json = str(ej)
                        else:
                            # body looks like project JSON, use it directly
                            extracted_json = json.dumps(body)
                except Exception:
                    # ignore JSON parse errors here; will be caught below when attempting to use extracted_json
                    extracted_json = None

        # Decide input source: prefer uploaded JSON file, else use extracted_json, else uploaded PDF
        input_source_used = None
        # 1) Uploaded JSON file (prefer this)
        if file_bytes and file_name and file_name.endswith('.json'):
            try:
                try:
                    j = json.loads(file_bytes.decode('utf-8'))
                except Exception:
                    j = json.loads(file_bytes.decode('latin-1'))
                parsed_input_json = j if isinstance(j, dict) else None
                if isinstance(j, dict) and 'project_details' in j and isinstance(j['project_details'], dict):
                    input_text = '\n'.join([str(x) for x in j['project_details'].values() if x])
                else:
                    input_text = json.dumps(j) if isinstance(j, (dict, list)) else str(j)
                input_source_used = 'uploaded_json'
                file_processed = True
            except Exception:
                # fall back to other sources
                input_source_used = None

        # 2) If no uploaded JSON, try extracted_json/form body
        if not input_source_used and extracted_json is not None:
            try:
                j = json.loads(extracted_json) if not isinstance(extracted_json, dict) else extracted_json
                parsed_input_json = j if isinstance(j, dict) else None
                if isinstance(j, dict) and 'project_details' in j and isinstance(j['project_details'], dict):
                    input_text = '\n'.join([str(x) for x in j['project_details'].values() if x])
                else:
                    input_text = json.dumps(j) if isinstance(j, (dict, list)) else str(j)
                input_source_used = 'extracted_json'
            except Exception as e:
                logger.warning(f"extracted_json is not valid JSON, treating as raw text: {e}")
                input_text = str(extracted_json)
                input_source_used = 'extracted_raw'

        # 3) If still no usable input, and an uploaded file exists, handle it (PDF or JSON)
        if not input_source_used and file is not None:
            # fb is file_bytes if available
            fname = (file.filename or '').lower()
            fb = file_bytes if file_bytes is not None else await file.read()
            if fname.endswith('.pdf'):
                input_text = extract_text_from_pdf_bytes(fb)
                input_source_used = 'uploaded_pdf'
            elif fname.endswith('.json'):
                try:
                    j = json.loads(fb.decode('utf-8'))
                except Exception:
                    try:
                        j = json.loads(fb.decode('latin-1'))
                    except Exception as e:
                        logger.warning(f"Uploaded JSON file could not be parsed: {e}")
                        raise HTTPException(status_code=400, detail='Uploaded JSON file could not be parsed')
                parsed_input_json = j if isinstance(j, dict) else None
                if isinstance(j, dict) and 'project_details' in j and isinstance(j['project_details'], dict):
                    input_text = '\n'.join([str(x) for x in j['project_details'].values() if x])
                else:
                    input_text = json.dumps(j) if isinstance(j, (dict, list)) else str(j)
                input_source_used = 'uploaded_json'
            else:
                raise HTTPException(status_code=400, detail='Please upload a PDF, JSON file, or provide extracted_json')

        # 4) nothing provided
        if not input_text:
            raise HTTPException(status_code=400, detail='No input provided')

        if not input_text.strip():
            raise HTTPException(status_code=400, detail='No text could be extracted from the input')
        # Section-aware processing: try to extract structured sections if JSON was provided
        section_keys = ['methodology', 'benefit_to_coal', 'definition_of_issues', 'objective', 'justification', 'work_plan']

        input_sections = {k: '' for k in section_keys}
        if parsed_input_json:
            try:
                input_sections = extract_sections_from_project({'data': parsed_input_json}, section_keys)
            except Exception:
                input_sections = {k: '' for k in section_keys}

        # Build combined texts for embedding: prefer combined sections if available
        input_combined = None
        if parsed_input_json and any(v for v in input_sections.values()):
            # create a deterministic combined representation (table-like)
            rows = []
            for k in section_keys:
                rows.append(f"{k}: {input_sections.get(k, '')}")
            input_combined = '\n'.join(rows)
            # also keep a simple table structure for the response
            response_table = [{"column": k, "value": input_sections.get(k, '')} for k in section_keys]
        else:
            input_combined = input_text
            response_table = [{"column": "full_text", "value": input_text}]

        # Prepare past project combined texts (prefer same sections when available)
        past_combined_texts = []
        past_filenames = []
        past_sections_list = []
        for p in past_projects:
            try:
                secs = extract_sections_from_project(p, section_keys)
                past_sections_list.append(secs)
                # combine
                combined = '\n'.join([f"{k}: {secs.get(k, '')}" for k in section_keys if secs.get(k, '')])
                if not combined.strip():
                    combined = flatten_project_text(p)
                past_combined_texts.append(combined)
                past_filenames.append(p.get('filename', 'unknown'))
            except Exception:
                past_sections_list.append({k: '' for k in section_keys})
                past_combined_texts.append(flatten_project_text(p))
                past_filenames.append(p.get('filename', 'unknown'))

        # If no past texts were found, fall back to earlier behavior
        if not past_combined_texts:
            past_combined_texts = past_texts

        # Prepare embedding texts for combined similarity
        all_texts = [input_combined] + past_combined_texts
        try:
            embeddings = compute_embeddings(all_texts)
        except Exception as e:
            logger.error(f"Embedding computation failed: {e}")
            raise HTTPException(status_code=500, detail=f"Embedding failed: {e}")

        import numpy as np
        input_emb = embeddings[0]
        past_embs = embeddings[1:]

        # Compute cosine similarities vs each past project
        similarities = []
        for i, pe in enumerate(past_embs):
            # cosine similarity
            num = float(np.dot(input_emb, pe))
            denom = float((np.linalg.norm(input_emb) * np.linalg.norm(pe)) + 1e-12)
            sim = num / denom if denom != 0 else 0.0
            similarities.append((past_filenames[i] if i < len(past_filenames) else f'proj_{i}', round(float(sim), 4)))

        max_sim = max([s for _, s in similarities], default=0.0)
        novelty_pct = round(max(0.0, min(100.0, (1.0 - max_sim) * 100.0)), 2)

        # Simple comment generation
        if novelty_pct >= 80:
            comment = f"High novelty ({novelty_pct}%). Low similarity to past projects (max similarity {max_sim:.3f})."
        elif novelty_pct >= 60:
            comment = f"Moderate novelty ({novelty_pct}%). Some overlap with past work (max similarity {max_sim:.3f})."
        elif novelty_pct >= 40:
            comment = f"Low-moderate novelty ({novelty_pct}%). Noticeable similarity exists (max similarity {max_sim:.3f})."
        else:
            comment = f"Low novelty ({novelty_pct}%). High similarity to existing projects (max similarity {max_sim:.3f})."

        # Flag similar lines: split input into sentences and compare each to past projects individually
        sentences = [s.strip() for s in input_text.split('.') if len(s.strip()) > 30]
        flagged = []
        if past_texts and sentences:
            # compute sentence embeddings in batches
            sent_embs = compute_embeddings(sentences)
            past_project_embs = past_embs
            for si, sent_vec in enumerate(sent_embs):
                # compare with each past project
                best_sim = 0.0
                best_file = None
                for pi, pe in enumerate(past_project_embs):
                    num = float(np.dot(sent_vec, pe))
                    denom = float((np.linalg.norm(sent_vec) * np.linalg.norm(pe)) + 1e-12)
                    sim = num / denom if denom != 0 else 0.0
                    if sim > best_sim:
                        best_sim = sim
                        best_file = past_filenames[pi] if pi < len(past_filenames) else f'proj_{pi}'
                if best_sim >= SIMILARITY_THRESHOLD:
                    flagged.append({
                        'line_number': si + 1,
                        'text': sentences[si][:300],
                        'similarity_score': round(best_sim, 3),
                        'source': best_file
                    })
        # limit flagged
        flagged = sorted(flagged, key=lambda x: x['similarity_score'], reverse=True)[:TOP_FLAGGED]

        # Compute per-section best similarities (compare input section -> each past project's section)
        section_scores = {}
        try:
            # for each section that has content in the input, compute similarity vs past projects' same section
            for sk in section_keys:
                sk_text = input_sections.get(sk, '')
                if not sk_text:
                    section_scores[sk] = {'best_similarity': None, 'best_source': None}
                    continue
                # prepare list of past section texts (use empty string when missing)
                past_section_texts = [ps.get(sk, '') or '' for ps in past_sections_list]
                # if all past section texts are empty, skip computing for this section
                if not any(past_section_texts):
                    section_scores[sk] = {'best_similarity': None, 'best_source': None}
                    continue
                # compute embeddings: first input section then past section texts
                try:
                    sec_embs = compute_embeddings([sk_text] + past_section_texts)
                except Exception:
                    section_scores[sk] = {'best_similarity': None, 'best_source': None}
                    continue
                inp_sec_emb = sec_embs[0]
                past_sec_embs = sec_embs[1:]
                best_sim = 0.0
                best_src = None
                for pi, pe in enumerate(past_sec_embs):
                    if pe is None or (isinstance(pe, (str,)) and not pe):
                        continue
                    num = float(np.dot(inp_sec_emb, pe))
                    denom = float((np.linalg.norm(inp_sec_emb) * np.linalg.norm(pe)) + 1e-12)
                    sim = num / denom if denom != 0 else 0.0
                    if sim > best_sim:
                        best_sim = sim
                        best_src = past_filenames[pi] if pi < len(past_filenames) else f'proj_{pi}'
                section_scores[sk] = {'best_similarity': round(best_sim, 4), 'best_source': best_src}
        except Exception:
            section_scores = {k: {'best_similarity': None, 'best_source': None} for k in section_keys}

        result = {
            'novelty_percentage': novelty_pct,
            'comment': comment,
            'flagged_lines': flagged,
            'max_similarity': round(max_sim, 4),
            'checked_at': datetime.now().isoformat(),
            'table': response_table,
            'section_scores': section_scores
        }

        return JSONResponse(content=result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Novelty analysis error: {e}")
        return JSONResponse(content={
            'error': str(e),
            'novelty_percentage': 0.0,
            'comment': 'Analysis failed',
            'flagged_lines': []
        }, status_code=500)
