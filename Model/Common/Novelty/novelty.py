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

        if extracted_json is not None:
            try:
                j = json.loads(extracted_json) if not isinstance(extracted_json, dict) else extracted_json
                # prefer project_details if available
                if isinstance(j, dict) and 'project_details' in j and isinstance(j['project_details'], dict):
                    input_text = '\n'.join([str(x) for x in j['project_details'].values() if x])
                else:
                    # If it's a dict, stringify in readable form; else use the raw string
                    input_text = json.dumps(j) if isinstance(j, (dict, list)) else str(j)
            except Exception as e:
                # If parsing as JSON fails, accept the provided string as raw extracted text
                # This supports callers which send plain text instead of JSON (e.g., 'string').
                logger.warning(f"extracted_json is not valid JSON, treating as raw text: {e}")
                input_text = str(extracted_json)
        elif file is not None:
            # Support uploading either a PDF (to extract text) OR a JSON file
            # (processed/extracted JSON) so clients can upload the result file directly.
            fname = (file.filename or '').lower()
            fb = await file.read()
            if fname.endswith('.pdf'):
                input_text = extract_text_from_pdf_bytes(fb)
            elif fname.endswith('.json'):
                # try utf-8 then latin-1 decoding
                try:
                    j = json.loads(fb.decode('utf-8'))
                except Exception:
                    try:
                        j = json.loads(fb.decode('latin-1'))
                    except Exception as e:
                        logger.warning(f"Uploaded JSON file could not be parsed: {e}")
                        raise HTTPException(status_code=400, detail='Uploaded JSON file could not be parsed')

                # reuse extracted_json handling logic: prefer project_details
                if isinstance(j, dict) and 'project_details' in j and isinstance(j['project_details'], dict):
                    input_text = '\n'.join([str(x) for x in j['project_details'].values() if x])
                else:
                    input_text = json.dumps(j) if isinstance(j, (dict, list)) else str(j)
            else:
                raise HTTPException(status_code=400, detail='Please upload a PDF, JSON file, or provide extracted_json')
        else:
            raise HTTPException(status_code=400, detail='No input provided')

        if not input_text.strip():
            raise HTTPException(status_code=400, detail='No text could be extracted from the input')

        # Prepare embedding texts
        all_texts = [input_text] + past_texts
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

        result = {
            'novelty_percentage': novelty_pct,
            'comment': comment,
            'flagged_lines': flagged,
            'max_similarity': round(max_sim, 4),
            'checked_at': datetime.now().isoformat()
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
