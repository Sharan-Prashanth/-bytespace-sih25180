# novelty_agent_gnn_gemini.py
"""
Novelty Agent with 3-component scoring + GNN + Gemini (gemini-2.5-flash)

Endpoint:
  POST /analyze-novelty
    form field: file (PDF)

Environment variables (required):
  SUPABASE_URL
  SUPABASE_KEY

Optional:
  GEMINI_API_KEY4       # to enable gemini LLM usage
  PROCESSED_JSON_BUCKET (default: processed-json)
  UPLOAD_BUCKET (default: Coal-research-files)
  EXTRACT_BUCKET (default: proposal-json)
  EMBED_MODEL (default: all-MiniLM-L6-v2)
  SIMILARITY_THRESHOLD, GNN_EDGE_THRESHOLD, GNN_PROP_ITERS
  UNIQUENESS_WEIGHT (default: 0.4)
  ADVANTAGE_WEIGHT (default: 0.3)
  SIGNIFICANCE_WEIGHT (default: 0.3)

Outputs JSON with:
  novelty_percentage, uniqueness_score, advantage_score, significance_score,
  gnn_score, llm_comment, citations_global, citations_internal, table, checked_at, ...
"""
import os
import re
import json
import uuid
import hashlib
import logging
import traceback
import tempfile
from io import BytesIO
from datetime import datetime
from typing import List, Dict, Any, Optional

import requests
import numpy as np
import torch
import torch.nn as nn
import PyPDF2

from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from supabase import create_client, Client
from sentence_transformers import SentenceTransformer
# Try to import the exact extraction module provided by the user
try:
    from Model.Json_extraction.ocr_extraction import (
        extract_form_data_with_ai,
        construct_simple_json_structure,
        extract_text_from_file as extract_text_from_file_generic,
    )
    HAS_EXTRACT_MODULE = True
except Exception:
    HAS_EXTRACT_MODULE = False

# SCAMPER analysis is now integrated directly below
HAS_SCAMPER_MODULE = True

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("novelty-agent-gnn-gemini")

# Log SCAMPER availability
if not HAS_SCAMPER_MODULE:
    logger.warning("SCAMPER module not available - SCAMPER analysis will be skipped")

# ---------------------- CONFIG ----------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
PROCESSED_BUCKET = os.getenv("PROCESSED_JSON_BUCKET", "processed-json")
UPLOAD_BUCKET = os.getenv("UPLOAD_BUCKET", "Coal-research-files")
EXTRACT_BUCKET = os.getenv("EXTRACT_JSON_BUCKET", "proposal-json")
NOVELTY_CACHE_BUCKET = os.getenv("NOVELTY_CACHE_BUCKET", "novelty-json")

EMBED_MODEL = os.getenv("EMBED_MODEL", "all-MiniLM-L6-v2")
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.6"))
GNN_EDGE_THRESHOLD = float(os.getenv("GNN_EDGE_THRESHOLD", "0.45"))
GNN_PROP_ITERS = int(os.getenv("GNN_PROP_ITERS", "2"))
TOP_FLAGGED = int(os.getenv("TOP_FLAGGED", "10"))

UNIQUENESS_WEIGHT = float(os.getenv("UNIQUENESS_WEIGHT", "0.4"))
ADVANTAGE_WEIGHT = float(os.getenv("ADVANTAGE_WEIGHT", "0.3"))
SIGNIFICANCE_WEIGHT = float(os.getenv("SIGNIFICANCE_WEIGHT", "0.3"))

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("SUPABASE_URL and SUPABASE_KEY must be set in environment")

# ---------------------- CLIENTS ----------------------
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
embedder = SentenceTransformer(EMBED_MODEL)

# Gemini configuration
GENAI_AVAILABLE = False
gemini_model = None
GEMINI_KEY = os.getenv("NOVELTY_ANALYSIS_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
if GEMINI_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_KEY)
        gemini_model = genai.GenerativeModel(GEMINI_MODEL)
        GENAI_AVAILABLE = True
        logger.info("Gemini configured.")
    except Exception as e:
        logger.warning(f"Could not configure Gemini: {e}")
        GENAI_AVAILABLE = False

app = FastAPI(title="Novelty Agent (GNN + Gemini)")
router = APIRouter()

# SCAMPER is now integrated directly in the novelty analysis

# ---------------------- CACHE HELPERS ----------------------
def compute_pdf_hash(pdf_bytes: bytes) -> str:
    """Compute SHA-256 hash of PDF file for caching."""
    return hashlib.sha256(pdf_bytes).hexdigest()

def check_novelty_cache(pdf_hash: str) -> Optional[Dict[str, Any]]:
    """Check if novelty analysis result exists in cache (Supabase S3)."""
    try:
        cache_filename = f"{pdf_hash}.json"
        logger.info(f"[CACHE] Checking for cached result: {cache_filename}")
        
        # Try to download from novelty-json bucket
        response = supabase.storage.from_(NOVELTY_CACHE_BUCKET).download(cache_filename)
        
        # Handle different response types
        content = None
        if hasattr(response, "content"):
            content = response.content
        elif isinstance(response, (bytes, bytearray)):
            content = bytes(response)
        else:
            content = response
        
        if not content:
            logger.info(f"[CACHE] No cached result found")
            return None
        
        # Parse JSON
        cached_data = json.loads(content.decode("utf-8") if isinstance(content, bytes) else content)
        logger.info(f"[CACHE] Found cached result from {cached_data.get('checked_at')}")
        return cached_data
        
    except Exception as e:
        logger.debug(f"[CACHE] Cache miss or error: {e}")
        return None

def store_novelty_cache(pdf_hash: str, result_data: Dict[str, Any]) -> None:
    """Store novelty analysis result in cache (Supabase S3)."""
    try:
        cache_filename = f"{pdf_hash}.json"
        json_bytes = json.dumps(result_data, indent=2).encode("utf-8")
        
        logger.info(f"[CACHE] Storing result in cache: {cache_filename}")
        supabase.storage.from_(NOVELTY_CACHE_BUCKET).upload(
            cache_filename,
            json_bytes,
            {"content-type": "application/json", "upsert": "true"}
        )
        logger.info(f"[CACHE] Successfully cached result")
        
    except Exception as e:
        logger.warning(f"[CACHE] Failed to store cache: {e}")

# ---------------------- PDF extraction ----------------------
def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    try:
        reader = PyPDF2.PdfReader(BytesIO(pdf_bytes))
        pages = [p.extract_text() or "" for p in reader.pages]
        return "\n".join(pages).strip()
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        raise

# ---------------------- Methodology/Objectives extraction ----------------------
EXTRACTION_KEYS = {"methodology": "", "objectives": ""}

def gemini_extract_method_obj(raw_text: str) -> Dict[str, str]:
    prompt = (
        "Extract EXACTLY the following JSON keys (use empty string if missing):\n"
        f"{json.dumps(EXTRACTION_KEYS, indent=2)}\n\nDocument:\n" + raw_text[:14000]
    )
    try:
        resp = gemini_model.generate_content(prompt)
        txt = resp.text.strip()
        if txt.startswith("```"):
            txt = txt.split("```", 1)[-1]
        parsed = json.loads(txt)
        return {k: (parsed.get(k) or "").strip() for k in EXTRACTION_KEYS}
    except Exception as e:
        logger.warning(f"Gemini extraction error: {e}")
        return {k: "" for k in EXTRACTION_KEYS}

def heuristic_extract_method_obj(raw_text: str) -> Dict[str, str]:
    lower = raw_text.lower()
    res = {k: "" for k in EXTRACTION_KEYS}
    for key in EXTRACTION_KEYS:
        variants = [key, key.replace("_", " ")]
        for v in variants:
            idx = lower.find(v)
            if idx != -1:
                start = idx + len(v)
                snippet = raw_text[start:start+2000]
                if "\n\n" in snippet:
                    snippet = snippet.split("\n\n", 1)[0]
                res[key] = snippet.strip()
                break
    import re
    if not res["methodology"]:
        m = re.search(r"(methodolog(?:y|ies)|method|approach)([:\-\s]+)([\s\S]{40,800})", raw_text, flags=re.I)
        if m:
            res["methodology"] = m.group(3).split("\n\n")[0].strip()
    if not res["objectives"]:
        m = re.search(r"(objective(?:s)?|aims?)([:\-\s]+)([\s\S]{40,800})", raw_text, flags=re.I)
        if m:
            res["objectives"] = m.group(3).split("\n\n")[0].strip()
    return res

def extract_methodology_objectives(raw_text: str) -> Dict[str, str]:
    if GENAI_AVAILABLE and gemini_model:
        try:
            out = gemini_extract_method_obj(raw_text)
            if any(out.values()):
                return out
        except Exception:
            pass
    return heuristic_extract_method_obj(raw_text)

def summarize_idea(text: str, max_chars: int = 300) -> str:
    if not text:
        return ""
    if GENAI_AVAILABLE and gemini_model:
        try:
            prompt = (
                "Summarize the core research IDEA from the text in one concise sentence. Return only the sentence.\n\n"
                f"Text:\n{text[:7000]}"
            )
            resp = gemini_model.generate_content(prompt)
            idea = resp.text.strip()
            if idea.startswith("```"):
                idea = idea.strip("`")
            return " ".join(idea.split())[:max_chars]
        except Exception:
            pass

    # Fallback heuristic: extract first one or two sentences
    import re
    # split on sentence-ending punctuation followed by space and uppercase (simple heuristic)
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    if not sentences:
        return text.strip()[:max_chars]
    if len(sentences) == 1:
        return sentences[0][:max_chars]
    # return first two sentences if available
    return (sentences[0] + " " + sentences[1])[:max_chars]

# ---------------------- Supabase processed-json loader ----------------------
def list_processed_projects(bucket: str = PROCESSED_BUCKET) -> List[Dict[str, Any]]:
    projects = []
    try:
        res = supabase.storage.from_(bucket).list()
        files = res if isinstance(res, list) else (res.get("data") or [])
        for f in files:
            fname = f.get("name") if isinstance(f, dict) and f.get("name") else (f if isinstance(f, str) else None)
            if not fname:
                continue
            try:
                dl = supabase.storage.from_(bucket).download(fname)
                content = None
                if hasattr(dl, "content"):
                    content = dl.content
                elif isinstance(dl, (bytes, bytearray)):
                    content = dl
                else:
                    pub = supabase.storage.from_(bucket).get_public_url(fname)
                    r = requests.get(pub, timeout=10)
                    if r.status_code == 200:
                        content = r.content
                if not content:
                    continue
                try:
                    txt = content.decode("utf-8")
                except Exception:
                    txt = content.decode("latin-1", errors="ignore")
                obj = json.loads(txt)
                projects.append({"filename": fname, "data": obj})
            except Exception as e:
                logger.debug(f"Skipping {fname}: {e}")
                continue
    except Exception as e:
        logger.error(f"Error listing processed projects: {e}")
    return projects

# ---------------------- Embeddings & GNN ----------------------
def compute_embeddings(texts: List[str]) -> np.ndarray:
    if not texts:
        return np.zeros((0, embedder.get_sentence_embedding_dimension()))
    return embedder.encode(texts, convert_to_numpy=True, show_progress_bar=False)

class SimpleRefiner(nn.Module):
    def __init__(self, dim: int):
        super().__init__()
        self.lin_self = nn.Linear(dim, dim)
        self.lin_nei = nn.Linear(dim, dim)
        try:
            nn.init.eye_(self.lin_self.weight)
        except Exception:
            pass
        nn.init.xavier_uniform_(self.lin_nei.weight)
        self.act = nn.ReLU()

    def forward(self, x: torch.Tensor, adj: List[List[int]]) -> torch.Tensor:
        self_x = self.lin_self(x)
        nei_acc = torch.zeros_like(self_x)
        for i, neigh in enumerate(adj):
            if not neigh:
                continue
            nei_feats = x[neigh]
            nei_mean = nei_feats.mean(dim=0, keepdim=True)
            nei_acc[i:i+1] = self.lin_nei(nei_mean)
        return self.act(self_x + nei_acc)

def build_similarity_graph(embs: np.ndarray, threshold: float) -> List[List[int]]:
    n = embs.shape[0]
    if n == 0:
        return []
    normed = embs / (np.linalg.norm(embs, axis=1, keepdims=True) + 1e-12)
    sim = normed @ normed.T
    adj = [[] for _ in range(n)]
    for i in range(n):
        for j in range(i+1, n):
            if sim[i, j] >= threshold:
                adj[i].append(j)
                adj[j].append(i)
    return adj

# ---------------------- Academic search ----------------------
def search_openalex(idea: str, limit: int = 8) -> List[Dict[str, Any]]:
    try:
        params = {"search": idea, "per-page": limit}
        r = requests.get("https://api.openalex.org/works", params=params, timeout=12)
        if r.status_code != 200:
            logger.debug(f"OpenAlex status: {r.status_code}")
            return []
        data = r.json()
        hits = []
        for w in data.get("results", []):
            doi = w.get("doi")
            url = w.get("id") or (f"https://doi.org/{doi}" if doi else None)
            snippet = ""
            ai = w.get("abstract_inverted_index")
            if ai:
                try:
                    positions = []
                    for word, pos in ai.items():
                        for p in pos:
                            positions.append((p, word))
                    positions = sorted(positions)[:80]
                    snippet = " ".join([wd for _, wd in positions])
                except Exception:
                    snippet = ""
            hits.append({"source": "OpenAlex", "title": w.get("title"), "url": url, "doi": doi, "snippet": snippet[:400], "year": w.get("publication_year")})
        return hits
    except Exception as e:
        logger.warning(f"OpenAlex error: {e}")
        return []

def search_semantic_scholar(idea: str, limit: int = 8) -> List[Dict[str, Any]]:
    try:
        params = {"query": idea, "limit": limit, "fields": "title,abstract,year,url,authors"}
        r = requests.get("https://api.semanticscholar.org/graph/v1/paper/search", params=params, timeout=12)
        if r.status_code != 200:
            logger.debug(f"SemanticScholar status: {r.status_code}")
            return []
        data = r.json()
        hits = []
        for p in data.get("data", []):
            hits.append({"source": "SemanticScholar", "title": p.get("title"), "url": p.get("url"), "snippet": (p.get("abstract") or "")[:400], "year": p.get("year"), "authors": [a.get("name") for a in p.get("authors", [])] if p.get("authors") else []})
        return hits
    except Exception as e:
        logger.warning(f"SemanticScholar error: {e}")
        return []

def search_crossref(idea: str, limit: int = 8) -> List[Dict[str, Any]]:
    try:
        params = {"query": idea, "rows": limit}
        r = requests.get("https://api.crossref.org/works", params=params, timeout=12)
        if r.status_code != 200:
            logger.debug(f"CrossRef status: {r.status_code}")
            return []
        data = r.json()
        hits = []
        for item in data.get("message", {}).get("items", []):
            doi = item.get("DOI")
            url = item.get("URL") or (f"https://doi.org/{doi}" if doi else None)
            title = item.get("title", [""])[0] if item.get("title") else ""
            snippet = (item.get("abstract") or "")[:400] if item.get("abstract") else ""
            year = None
            issued = item.get("issued", {}).get("date-parts", [[None]])
            if issued and issued[0]:
                year = issued[0][0]
            hits.append({"source": "CrossRef", "title": title, "url": url, "doi": doi, "snippet": snippet, "year": year})
        return hits
    except Exception as e:
        logger.warning(f"CrossRef error: {e}")
        return []

def academic_search_combined(idea: str, limit: int = 8) -> List[Dict[str, Any]]:
    results = []
    seen = set()
    for fn in (search_openalex, search_semantic_scholar, search_crossref):
        try:
            hits = fn(idea, limit=limit)
            for h in hits:
                t = (h.get("title") or "").strip().lower()
                if t and t not in seen:
                    results.append(h)
                    seen.add(t)
        except Exception as e:
            logger.debug(f"Academic search {fn.__name__} failed: {e}")
    return results

# ---------------------- SCAMPER SEMANTIC ANALYSIS (INTEGRATED) ----------------------
def semantic_scamper_check(objectives: str, methodology: str) -> str:
    """
    Performs semantic SCAMPER analysis using Gemini LLM.
    Returns formatted text with analysis of 7 SCAMPER elements.
    Each element must have: Present (Yes/No), Explanation, Evidence
    """
    content = f"""
Objectives:
{objectives}

Methodology:
{methodology}
"""

    prompt = f"""
You are an expert evaluator for Ministry of Coal (India) performing SCAMPER innovation analysis.

Analyze this proposal (Objectives + Methodology) and classify it according to SCAMPER framework.

SCAMPER Elements:
1. Substitute - Replacing components, materials, processes, or approaches with alternatives
2. Combine - Merging multiple technologies, methods, or ideas together
3. Adapt - Adjusting or modifying existing concepts for new applications
4. Modify/Magnify/Minify - Changing size, scale, features, or attributes
5. Put to Other Use - Repurposing technology or methods for different applications
6. Eliminate - Removing unnecessary components, steps, or features
7. Reverse/Rearrange - Changing sequence, order, or direction of processes

IMPORTANT EVALUATION RULES:
- Use SEMANTIC UNDERSTANDING - understand the meaning and innovation intent
- DO NOT rely on keyword matching
- Look for actual innovation elements, not just mentions
- Each element MUST have: Present (Yes/No), Explanation (why/why not), Evidence (quote/snippet)

Return EXACTLY this format for ALL 7 elements:

1. **Substitute**
   - Present: Yes/No
   - Explanation: [Why this element is present or absent - 1-2 sentences]
   - Evidence: [Direct quote or specific snippet from the proposal that supports your decision]

2. **Combine**
   - Present: Yes/No
   - Explanation: [Why this element is present or absent - 1-2 sentences]
   - Evidence: [Direct quote or specific snippet from the proposal that supports your decision]

3. **Adapt**
   - Present: Yes/No
   - Explanation: [Why this element is present or absent - 1-2 sentences]
   - Evidence: [Direct quote or specific snippet from the proposal that supports your decision]

4. **Modify / Magnify / Minify**
   - Present: Yes/No
   - Explanation: [Why this element is present or absent - 1-2 sentences]
   - Evidence: [Direct quote or specific snippet from the proposal that supports your decision]

5. **Put to Other Use**
   - Present: Yes/No
   - Explanation: [Why this element is present or absent - 1-2 sentences]
   - Evidence: [Direct quote or specific snippet from the proposal that supports your decision]

6. **Eliminate**
   - Present: Yes/No
   - Explanation: [Why this element is present or absent - 1-2 sentences]
   - Evidence: [Direct quote or specific snippet from the proposal that supports your decision]

7. **Reverse / Rearrange**
   - Present: Yes/No
   - Explanation: [Why this element is present or absent - 1-2 sentences]
   - Evidence: [Direct quote or specific snippet from the proposal that supports your decision]

Proposal Content:
{content}

Provide thorough analysis with clear evidence for each element.
"""

    if GENAI_AVAILABLE and gemini_model:
        try:
            response = gemini_model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini SCAMPER analysis failed: {e}")
            return f"SCAMPER analysis failed: {str(e)}"
    else:
        return "Gemini not available for SCAMPER analysis"

# ---------------------- SCAMPER Analysis Helper ----------------------
def analyze_scamper_for_similarity(objectives: str, methodology: str, raw_text: str = "") -> Dict[str, Any]:
    """
    Analyzes SCAMPER elements when similarity is detected.
    Uses the extracted objectives and methodology to perform semantic SCAMPER analysis.
    Returns parsed SCAMPER results with counts and adjustments.
    """
    if not HAS_SCAMPER_MODULE:
        logger.warning("SCAMPER module not available, skipping SCAMPER analysis")
        return {
            "scamper_available": False, 
            "scamper_score": 0, 
            "scamper_count": 0,
            "scamper_elements": [], 
            "scamper_analysis": "SCAMPER analysis not available - module not imported"
        }
    
    if not objectives and not methodology:
        logger.warning("No objectives or methodology provided for SCAMPER analysis")
        return {
            "scamper_available": False,
            "scamper_score": 0,
            "scamper_count": 0,
            "scamper_elements": [],
            "scamper_analysis": "SCAMPER analysis skipped - no objectives or methodology extracted"
        }
    
    try:
        logger.info(f"Performing SCAMPER analysis on objectives ({len(objectives)} chars) and methodology ({len(methodology)} chars)")
        
        # Call SCAMPER semantic check directly with the text content
        scamper_result = semantic_scamper_check(objectives, methodology)
        
        # Parse the result to extract YES/NO for each element
        scamper_elements = ["Substitute", "Combine", "Adapt", "Modify", "Put to Other Use", "Eliminate", "Reverse"]
        scamper_present = {}
        scamper_details = {}
        scamper_evidence = {}
        
        # Parse the text response from Gemini
        result_text = scamper_result if isinstance(scamper_result, str) else str(scamper_result)
        
        logger.info(f"SCAMPER analysis returned {len(result_text)} characters")
        
        # Build structured SCAMPER elements array
        scamper_structured = []
        
        for element in scamper_elements:
            # Look for "Present: Yes" or "Present: No" patterns
            pattern = rf"{element}.*?Present:\s*(Yes|No)"
            match = re.search(pattern, result_text, re.IGNORECASE | re.DOTALL)
            is_present = False
            if match:
                is_present = match.group(1).lower() == "yes"
                scamper_present[element] = is_present
            else:
                scamper_present[element] = False
            
            # Extract explanation for this element
            expl_pattern = rf"{element}.*?Explanation:\s*([^\n]+(?:\n(?!\d+\.|\*\*|Present:|Evidence:)[^\n]+)*)"
            expl_match = re.search(expl_pattern, result_text, re.IGNORECASE | re.DOTALL)
            explanation_text = "No explanation extracted"
            if expl_match:
                explanation_text = expl_match.group(1).strip()
                # Clean up explanation (remove markdown, extra spaces)
                explanation_text = re.sub(r'\[|\]|\*\*', '', explanation_text)
                explanation_text = ' '.join(explanation_text.split())
                scamper_details[element] = explanation_text[:500]
            else:
                scamper_details[element] = explanation_text
            
            # Extract evidence for this element
            evid_pattern = rf"{element}.*?Evidence:\s*([^\n]+(?:\n(?!\d+\.|\*\*|Present:|Explanation:)[^\n]+)*)"
            evid_match = re.search(evid_pattern, result_text, re.IGNORECASE | re.DOTALL)
            evidence_text = "No evidence extracted"
            if evid_match:
                evidence_text = evid_match.group(1).strip()
                # Clean up evidence
                evidence_text = re.sub(r'\[|\]|\*\*', '', evidence_text)
                evidence_text = ' '.join(evidence_text.split())
                scamper_evidence[element] = evidence_text[:400]
            else:
                scamper_evidence[element] = evidence_text
            
            # Build structured object for this element
            scamper_structured.append({
                "element": element,
                "present": "Yes" if is_present else "No",
                "explanation": scamper_details[element],
                "evidence": scamper_evidence[element]
            })
        
        # Count how many SCAMPER elements are present
        scamper_count = sum(1 for v in scamper_present.values() if v)
        
        # Calculate SCAMPER score (0-100)
        # More SCAMPER elements present = more innovation/novelty
        scamper_score = (scamper_count / len(scamper_elements)) * 100
        
        logger.info(f"SCAMPER analysis complete: {scamper_count}/{len(scamper_elements)} elements detected, score: {scamper_score:.2f}")
        
        return {
            "scamper_available": True,
            "scamper_score": round(scamper_score, 2),
            "scamper_count": scamper_count,
            "scamper_present": scamper_present,
            "scamper_details": scamper_details,
            "scamper_evidence": scamper_evidence,
            "scamper_structured": scamper_structured,  # Structured array with all elements
            "scamper_analysis": result_text,
            "scamper_elements_detected": [k for k, v in scamper_present.items() if v]
        }
        
    except Exception as e:
        logger.error(f"SCAMPER analysis failed: {e}")
        logger.error(traceback.format_exc())
        return {
            "scamper_available": False, 
            "scamper_score": 0, 
            "scamper_count": 0,
            "scamper_error": str(e), 
            "scamper_analysis": f"SCAMPER analysis failed: {str(e)}"
        }

def adjust_novelty_with_scamper(base_novelty: float, uniqueness: int, advantage: int, significance: int, scamper_result: Dict[str, Any], max_similarity: float) -> tuple:
    """
    Adjusts novelty scores based on SCAMPER analysis.
    
    NEW LOGIC:
    - If ANY SCAMPER element is detected (count >= 1): Minimum novelty score of 70
    - For each additional element beyond the first: Add incremental boost
    - Scale: 1 element = 70, 2 = 75, 3 = 80, 4 = 85, 5 = 90, 6 = 95, 7 = 100
    
    Returns: (adjusted_novelty, adjusted_uniqueness, adjusted_advantage, adjusted_significance)
    """
    if not scamper_result.get("scamper_available", False):
        return (base_novelty, uniqueness, advantage, significance)
    
    scamper_score = scamper_result.get("scamper_score", 0)
    scamper_count = scamper_result.get("scamper_count", 0)
    
    # If NO SCAMPER elements detected, return base scores
    if scamper_count == 0:
        logger.info("No SCAMPER elements detected, using base novelty score")
        return (base_novelty, uniqueness, advantage, significance)
    
    # If ANY SCAMPER element is detected (count >= 1), ensure minimum novelty of 70
    # Progressive scale: 1→70, 2→75, 3→80, 4→85, 5→90, 6→95, 7→100
    scamper_minimum_score = 70 + (scamper_count - 1) * 5  # 70, 75, 80, 85, 90, 95, 100
    
    logger.info(f"SCAMPER elements detected: {scamper_count}/7")
    logger.info(f"SCAMPER minimum novelty score: {scamper_minimum_score}")
    
    # Calculate target novelty based on SCAMPER count
    target_novelty = float(scamper_minimum_score)
    
    # If base novelty is already higher, use the higher value
    if base_novelty >= target_novelty:
        logger.info(f"Base novelty ({base_novelty:.2f}) already meets/exceeds SCAMPER minimum ({target_novelty})")
        # Still apply small boost for validation
        adjusted_novelty = min(100, base_novelty + scamper_count)
        return (adjusted_novelty, uniqueness, advantage, significance)
    
    # Otherwise, boost to meet SCAMPER minimum
    logger.info(f"Boosting novelty from {base_novelty:.2f} to {target_novelty} (SCAMPER threshold)")
    
    # Calculate how much boost is needed to reach target
    novelty_gap = target_novelty - base_novelty
    
    # Distribute the boost across components proportionally
    # We need to adjust uniqueness, advantage, significance such that the weighted sum reaches target_novelty
    # Current: base_novelty = uniqueness*0.4 + advantage*0.3 + significance*0.3
    # Target: target_novelty = new_uniqueness*0.4 + new_advantage*0.3 + new_significance*0.3
    
    # Strategy: Boost each component proportionally to reach the target
    boost_factor = novelty_gap / base_novelty if base_novelty > 0 else 1.0
    
    # Calculate component boosts (distributed by their weights)
    uniqueness_boost = int((novelty_gap / UNIQUENESS_WEIGHT) * 0.4)
    advantage_boost = int((novelty_gap / ADVANTAGE_WEIGHT) * 0.4)
    significance_boost = int((novelty_gap / SIGNIFICANCE_WEIGHT) * 0.4)
    
    adjusted_uniqueness = min(100, uniqueness + uniqueness_boost)
    adjusted_advantage = min(100, advantage + advantage_boost)
    adjusted_significance = min(100, significance + significance_boost)
    
    # Recalculate actual novelty with adjusted components
    adjusted_novelty = (
        adjusted_uniqueness * UNIQUENESS_WEIGHT +
        adjusted_advantage * ADVANTAGE_WEIGHT +
        adjusted_significance * SIGNIFICANCE_WEIGHT
    )
    
    # Ensure we meet the minimum (may need further adjustment due to rounding)
    if adjusted_novelty < target_novelty:
        # Direct adjustment to meet minimum
        adjusted_novelty = target_novelty
        # Recalculate components to be consistent
        scale_factor = target_novelty / (adjusted_novelty + 0.01)
        adjusted_uniqueness = min(100, int(adjusted_uniqueness * scale_factor))
        adjusted_advantage = min(100, int(adjusted_advantage * scale_factor))
        adjusted_significance = min(100, int(adjusted_significance * scale_factor))
    
    # Cap at 100
    adjusted_novelty = min(100.0, adjusted_novelty)
    
    logger.info(f"Novelty adjusted from {base_novelty:.2f} to {adjusted_novelty:.2f}")
    logger.info(f"Component adjustments - Uniqueness: {uniqueness}→{adjusted_uniqueness}, "
                f"Advantage: {advantage}→{adjusted_advantage}, Significance: {significance}→{adjusted_significance}")
    
    return (adjusted_novelty, adjusted_uniqueness, adjusted_advantage, adjusted_significance)

# ---------------------- Gemini comparator for 3-component scoring ----------------------
def gemini_score_components(idea: str, internal_matches: List[Dict[str, Any]], external_matches: List[Dict[str, Any]], gnn_score: float = 0.0, methodology: str = "", objectives: str = "") -> Dict[str, Any]:
    """
    Ask Gemini to rate uniqueness, advantage, significance (0-100) and produce an explanation.
    The LLM will compare the idea to the provided matches.
    If Gemini is unavailable or fails, a heuristic fallback will be used.
    """
    # Build context lists (top N)
    top_internal = internal_matches[:6]
    top_external = external_matches[:8]

    internal_text = ""
    for i, m in enumerate(top_internal, start=1):
        internal_text += f"[I{i}] source: {m.get('source')} | sim: {m.get('similarity_score')} | name: {m.get('source')}\n"

    external_text = ""
    for i, e in enumerate(top_external, start=1):
        title = e.get("title") or "Untitled"
        url = e.get("url") or (f"https://doi.org/{e.get('doi')}" if e.get("doi") else "No URL")
        snippet = (e.get("snippet") or "")[:600]
        external_text += f"[E{i}] {title}\nURL: {url}\nSnippet: {snippet}\n\n"

    prompt = f"""
You are a senior research evaluator. Given the new proposal idea, the extracted methodology/objectives from the proposal, internal examples of previous work (internal_matches) and published papers (external_matches), produce a JSON object with these exact keys:

- novelty_percentage: integer 0-100  # your assessed overall novelty for the idea, taking into account internal and external evidence and the GNN similarity score
- uniqueness: integer 0-100
- advantage: integer 0-100
- significance: integer 0-100
- explanation: string (one paragraph explaining why those numbers; mention which cited items influenced the judgement using [E1]/[I1] style)
- recommended_actions: list of short strings (2-4 items)

Inputs provided:
- GNN novelty proxy score (0-100): {gnn_score}
- Proposal methodology (excerpt):
\"\"\"{methodology}\"\"\"
- Proposal objectives (excerpt):
\"\"\"{objectives}\"\"\"

When assessing, use the provided external matches (published papers) as global citations and compare them directly to the idea. If you reference items, cite them as [E1], [E2], etc.

New idea:
\"\"\"{idea}\"\"\"

Internal matches:
{internal_text or 'None'}

External matches (top) with snippets:
{external_text or 'None'}

Rules:
- Consider the GNN-derived similarity (provided above) as a quantitative indicator of internal overlap; use it to calibrate uniqueness.
- Compare concrete methodology steps: if the proposal's methodology matches or is highly similar to multiple external items, uniqueness should be low.
- If the proposal addresses explicit limitations in high-relevance external works, advantage should be higher.
- Significance should reflect potential impact and scale.
- Return only JSON (no extra commentary). Numeric fields must be integers 0-100.
"""

    if GENAI_AVAILABLE and gemini_model:
        try:
            resp = gemini_model.generate_content(prompt)
            txt = resp.text.strip()
            if txt.startswith("```"):
                txt = txt.split("```", 1)[-1]
            result = json.loads(txt)
            # sanitize numeric values
            for k in ("uniqueness", "advantage", "significance", "novelty_percentage"):
                if k in result:
                    try:
                        result[k] = max(0, min(100, int(round(float(result[k])))))
                    except Exception:
                        result[k] = 0
            return result
        except Exception as e:
            logger.warning(f"Gemini scoring failed: {e}")

    # Fallback heuristic if Gemini unavailable
    # uniqueness = inverse of max internal similarity (and some external overlap)
    max_internal_sim = max([m.get("similarity_score", 0) for m in internal_matches], default=0.0)
    # compute approximate external similarity by keyword overlap
    idea_tokens = [t for t in (idea or "").lower().split() if len(t) > 3]
    ext_scores = []
    for e in external_matches:
        txt = ((e.get("title") or "") + " " + (e.get("snippet") or "")).lower()
        overlap = sum(1 for t in idea_tokens if t in txt)
        ext_scores.append(min(1.0, overlap / max(1, len(idea_tokens) / 6)))
    max_ext_sim = max(ext_scores) if ext_scores else 0.0

    uniqueness = int(round((1.0 - max(max_internal_sim, max_ext_sim)) * 100))
    advantage = 60  # neutral baseline
    significance = 60

    # small heuristic bumps
    if uniqueness > 70:
        advantage += 10
        significance += 5
    if max_internal_sim > 0.8 or max_ext_sim > 0.7:
        advantage -= 20
        significance -= 20

    advantage = int(max(0, min(100, advantage)))
    significance = int(max(0, min(100, significance)))

    explanation = f"Heuristic scores: uniqueness {uniqueness} (internal max sim {max_internal_sim:.3f}, external max sim {max_ext_sim:.3f}); advantage {advantage}; significance {significance}."
    recs = ["Document prior art and clearly highlight novel integration steps.", "Provide comparative metrics vs cited works.", "Include pilot validation data if applicable."]
    return {"uniqueness": uniqueness, "advantage": advantage, "significance": significance, "explanation": explanation, "recommended_actions": recs}

# ---------------------- Final endpoint ----------------------
@router.post("/analyze-novelty")
async def analyze_novelty(file: UploadFile = File(...)):
    """
    POST /analyze-novelty
    form-data: file (PDF)
    
    This endpoint analyzes the novelty of a research proposal by:
    1. Extracting text, objectives, and methodology from the PDF
    2. Computing similarity with past projects using GNN embeddings
    3. If similarity exceeds threshold, triggering SCAMPER analysis to identify innovation elements
    4. Using Gemini LLM to score uniqueness, advantage, and significance
    5. Adjusting novelty scores based on SCAMPER findings
    6. Returning comprehensive analysis with SCAMPER details
    
    SCAMPER Analysis (triggered on high similarity):
    - Evaluates 7 innovation dimensions: Substitute, Combine, Adapt, Modify, 
      Put to Other Use, Eliminate, Reverse/Rearrange
    - Boosts novelty scores when innovative approaches are detected despite similarity
    - Provides detailed breakdown of which elements are present and why
    """
    try:
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="No file uploaded")
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files accepted")

        file_bytes = await file.read()
        
        # Compute PDF hash for caching
        pdf_hash = compute_pdf_hash(file_bytes)
        logger.info(f"[NOVELTY] Processing PDF with hash: {pdf_hash}")
        
        # Check if we have a cached result
        cached_result = check_novelty_cache(pdf_hash)
        if cached_result:
            logger.info(f"[CACHE HIT] Returning cached novelty analysis")
            cached_result["cached"] = True
            cached_result["cache_hit_at"] = datetime.now().isoformat()
            return JSONResponse(content=cached_result)
        
        logger.info(f"[CACHE MISS] Performing new novelty analysis")
        raw_text = extract_text_from_pdf_bytes(file_bytes)
        if not raw_text.strip():
            raise HTTPException(status_code=400, detail="No text extracted from PDF")

        # Upload original PDF to Supabase (best-effort)
        uploaded_pdf_url = None
        try:
            pdf_name = f"{uuid.uuid4()}.pdf"
            supabase.storage.from_(UPLOAD_BUCKET).upload(pdf_name, file_bytes, {"content-type": "application/pdf"})
            uploaded_pdf_url = supabase.storage.from_(UPLOAD_BUCKET).get_public_url(pdf_name)
        except Exception as e:
            logger.warning(f"Supabase upload failed: {e}")

        # Extract methodology & objectives
        parsed = extract_methodology_objectives(raw_text)
        methodology = (parsed.get("methodology") or "").strip()
        objectives = (parsed.get("objectives") or "").strip()

        if not methodology and not objectives:
            # fallback to abstract/title snippet
            lower = raw_text.lower()
            if "abstract" in lower:
                idx = lower.find("abstract")
                snippet = raw_text[idx:idx+1200]
                objectives = snippet
            else:
                snippet = raw_text[:1500]
                objectives = snippet

        combined = (methodology + "\n" + objectives).strip() if (methodology or objectives) else raw_text[:3000]
        idea = summarize_idea(combined)

        # Upload extracted JSON (best-effort)
        extracted_json_url = None
        proposal_data = None
        json_structure = None
        try:
            # If the exact extraction module is available, use it to produce a full extraction
            if HAS_EXTRACT_MODULE:
                try:
                    proposal_data = extract_form_data_with_ai(raw_text)
                    json_structure = construct_simple_json_structure(proposal_data)
                except Exception as ee:
                    logger.warning(f"Extraction module failed: {ee}")

            # Fallback: at minimum store methodology/objectives
            to_store = json_structure if json_structure else {"methodology": methodology, "objectives": objectives}
            json_name = f"{uuid.uuid4()}_extracted.json"
            supabase.storage.from_(EXTRACT_BUCKET).upload(json_name, json.dumps(to_store, indent=2).encode("utf-8"), {"content-type": "application/json"})
            extracted_json_url = supabase.storage.from_(EXTRACT_BUCKET).get_public_url(json_name)
        except Exception as e:
            logger.warning(f"Supabase upload extracted JSON failed: {e}")

        # Load past projects and compute past ideas
        past_projects = list_processed_projects(PROCESSED_BUCKET)
        past_ideas = []
        past_filenames = []
        for p in past_projects:
            pdata = p.get("data") or {}
            # Handle case where pdata is a list instead of dict
            if isinstance(pdata, list):
                pdata = {}
            pmeth = (pdata.get("methodology") or "") or ""
            pobj = (pdata.get("objectives") or "") or ""
            if not pmeth and not pobj:
                pcombo = (pdata.get("abstract") or "") or (pdata.get("title") or "")
            else:
                pcombo = (pmeth + "\n" + pobj).strip()
            if not pcombo:
                continue
            pidea = summarize_idea(pcombo)
            if pidea:
                past_ideas.append(pidea)
                past_filenames.append(p.get("filename", "unknown"))

        # Embeddings (idea + past)
        all_texts = [idea] + past_ideas if past_ideas else [idea]
        embs = compute_embeddings(all_texts)

        # Build similarity graph + GNN refine
        adj = build_similarity_graph(embs, GNN_EDGE_THRESHOLD)
        x = torch.tensor(embs, dtype=torch.float32)
        refiner = SimpleRefiner(x.shape[1])
        with torch.no_grad():
            h = x
            for _ in range(GNN_PROP_ITERS):
                h = refiner(h, adj)
        refined = h.numpy()

        input_emb = refined[0]
        past_embs = refined[1:] if refined.shape[0] > 1 else np.zeros((0, refined.shape[1]))

        def cos(a, b):
            return float(np.dot(a, b) / ((np.linalg.norm(a) + 1e-12) * (np.linalg.norm(b) + 1e-12)))

        sims = [cos(input_emb, p) for p in past_embs] if past_embs.size else []
        max_sim = max(sims) if sims else 0.0
        gnn_score = round((1.0 - max_sim) * 100.0, 2)

        # Flag internal matches
        flagged_internal = []
        for i, s in enumerate(sims):
            if s >= SIMILARITY_THRESHOLD:
                flagged_internal.append({"source": past_filenames[i] if i < len(past_filenames) else f"proj_{i}", "similarity_score": round(s, 4), "past_idea": past_ideas[i] if i < len(past_ideas) else ""})
        flagged_internal = sorted(flagged_internal, key=lambda x: x["similarity_score"], reverse=True)[:TOP_FLAGGED]
        
        # SCAMPER Analysis: ALWAYS perform to check for innovation elements
        # If ANY SCAMPER element is detected, novelty score will be boosted to minimum 70
        logger.info(f"Performing SCAMPER analysis (similarity: {max_sim:.4f})...")
        scamper_result = analyze_scamper_for_similarity(objectives, methodology, raw_text)
        
        if scamper_result.get("scamper_available") and scamper_result.get("scamper_count", 0) > 0:
            logger.info(f"✓ SCAMPER elements detected: {scamper_result.get('scamper_count')}/7 - Novelty boost will be applied")
        else:
            logger.info(f"✗ No SCAMPER elements detected - Using base novelty score")

        # External academic search
        citations_global = academic_search_combined(idea, limit=12)
        # embeddings for external snippets to compute external_sim
        ext_texts = [((c.get("title") or "") + ". " + (c.get("snippet") or ""))[:1500] for c in citations_global]
        ext_embs = compute_embeddings(ext_texts) if ext_texts else np.zeros((0, embedder.get_sentence_embedding_dimension()))
        # compute cosine sim between input_emb(original embedding before GNN?) We'll use refined input_emb for consistency
        ext_sims = [cos(input_emb, e) for e in ext_embs] if ext_embs.size else []
        
        # Build external evidence list with similarity and uniqueness analysis
        external_evidence = []
        logger.info(f"Generating uniqueness analysis for {len(citations_global)} external citations...")
        
        for i, hit in enumerate(citations_global):
            url = hit.get("url") or (f"https://doi.org/{hit.get('doi')}" if hit.get("doi") else None)
            similarity_score = round(ext_sims[i], 4) if i < len(ext_sims) else 0.0
            uniqueness_score = round((1.0 - (ext_sims[i] if i < len(ext_sims) else 0.0)) * 100, 2)
            
            # Generate uniqueness snippet using Gemini for top citations
            uniqueness_snippet = ""
            if GENAI_AVAILABLE and gemini_model and i < 8:  # Generate for top 8 citations
                try:
                    uniqueness_prompt = f"""
Compare the NEW proposal with this EXTERNAL work and explain in 1-2 sentences what makes the NEW proposal unique/different.
Focus on methodology differences, novel applications, or new approaches.

NEW PROPOSAL:
Idea: {idea[:600]}
Methodology: {methodology[:400] if methodology else "Not extracted"}

EXTERNAL WORK:
Title: {hit.get('title', 'No title')[:300]}
Snippet: {hit.get('snippet', 'No snippet')[:400]}

Return ONLY 1-2 sentences explaining the key unique aspects of the NEW proposal compared to this external work.
"""
                    resp = gemini_model.generate_content(uniqueness_prompt)
                    uniqueness_snippet = resp.text.strip()
                    if uniqueness_snippet.startswith("```"):
                        uniqueness_snippet = uniqueness_snippet.strip("`")
                    # Clean up the snippet
                    uniqueness_snippet = re.sub(r'\[|\]|\*\*', '', uniqueness_snippet)
                    uniqueness_snippet = ' '.join(uniqueness_snippet.split())[:500]
                except Exception as e:
                    logger.debug(f"Failed to generate uniqueness snippet for citation {i}: {e}")
                    uniqueness_snippet = f"Uniqueness score: {uniqueness_score}% - Different approach or novel application"
            else:
                # Fallback for citations beyond top 8 or when Gemini unavailable
                if uniqueness_score > 70:
                    uniqueness_snippet = "Highly unique approach with minimal overlap to this prior work"
                elif uniqueness_score > 50:
                    uniqueness_snippet = "Moderately unique with some methodological differences"
                elif uniqueness_score > 30:
                    uniqueness_snippet = "Some unique elements but shares similar research direction"
                else:
                    uniqueness_snippet = "Similar research area with minor variations"
            
            external_evidence.append({
                "source": hit.get("source"), 
                "title": hit.get("title"), 
                "url": url, 
                "doi": hit.get("doi"), 
                "snippet": hit.get("snippet"), 
                "year": hit.get("year"), 
                "similarity": similarity_score,
                "uniqueness": uniqueness_score,
                "uniqueness_snippet": uniqueness_snippet
            })
        
        logger.info(f"Generated uniqueness analysis for {len(external_evidence)} external citations")

        # Prepare matches for LLM: internal_matches include similarity score, external_matches include title/snippet/url/similarity
        internal_matches_for_llm = [{"source": f.get("source") if isinstance(f, dict) and f.get("source") else f.get("source", f.get("source")), "similarity_score": f.get("similarity_score"), "past_idea": f.get("past_idea")} for f in flagged_internal]  # keep as-is
        external_matches_for_llm = external_evidence

        # Use Gemini to compute uniqueness/advantage/significance and optionally a direct novelty percentage
        comp_result = gemini_score_components(idea, internal_matches_for_llm, external_evidence, gnn_score=gnn_score, methodology=methodology, objectives=objectives)
        uniqueness = comp_result.get("uniqueness", 0)
        advantage = comp_result.get("advantage", 0)
        significance = comp_result.get("significance", 0)
        explanation = comp_result.get("explanation", "")
        recommended_actions = comp_result.get("recommended_actions", [])
        
        # Build uniqueness comparison against internal proposals with detailed similarity/uniqueness analysis
        uniqueness_comparisons = []
        if GENAI_AVAILABLE and gemini_model and flagged_internal:
            logger.info("Generating detailed uniqueness comparisons with internal proposals...")
            for idx, internal_match in enumerate(flagged_internal[:5]):  # Top 5 similar proposals
                try:
                    similarity_to_past = internal_match.get("similarity_score", 0)
                    uniqueness_score = round((1.0 - similarity_to_past) * 100, 2)  # Inverse of similarity
                    
                    # Ask Gemini to explain BOTH similarities AND uniqueness with evidence
                    detailed_comparison_prompt = f"""
You are comparing TWO research proposals. Analyze and provide:

1. SIMILARITIES: What aspects are similar between the proposals? (2-3 bullet points with evidence)
2. UNIQUENESS: What makes the NEW proposal unique/different? (2-3 bullet points with evidence)
3. CITATION SCORE: Rate similarity (0-100%) and uniqueness (0-100%)

NEW PROPOSAL:
Title/Idea: {idea[:700]}
Methodology: {methodology[:500] if methodology else "Not extracted"}
Objectives: {objectives[:500] if objectives else "Not extracted"}

PAST PROPOSAL:
{internal_match.get('past_idea', '')[:700]}

Provide response in this EXACT format:

SIMILARITIES:
- [Point 1 with evidence]
- [Point 2 with evidence]
- [Point 3 with evidence]

UNIQUENESS:
- [Point 1 with evidence]
- [Point 2 with evidence]
- [Point 3 with evidence]

SIMILARITY_SCORE: [0-100]%
UNIQUENESS_SCORE: [0-100]%
"""
                    resp = gemini_model.generate_content(detailed_comparison_prompt)
                    analysis_text = resp.text.strip()
                    if analysis_text.startswith("```"):
                        analysis_text = analysis_text.strip("`")
                    
                    # Parse similarities
                    similarities = []
                    sim_match = re.search(r"SIMILARITIES:\s*([\s\S]*?)(?=UNIQUENESS:|$)", analysis_text, re.IGNORECASE)
                    if sim_match:
                        sim_text = sim_match.group(1).strip()
                        similarities = [s.strip().lstrip('-•*').strip() for s in sim_text.split('\n') if s.strip() and s.strip().startswith(('-', '•', '*'))]
                    
                    # Parse uniqueness points
                    uniqueness_points = []
                    uniq_match = re.search(r"UNIQUENESS:\s*([\s\S]*?)(?=SIMILARITY_SCORE:|UNIQUENESS_SCORE:|$)", analysis_text, re.IGNORECASE)
                    if uniq_match:
                        uniq_text = uniq_match.group(1).strip()
                        uniqueness_points = [u.strip().lstrip('-•*').strip() for u in uniq_text.split('\n') if u.strip() and u.strip().startswith(('-', '•', '*'))]
                    
                    # Parse scores from LLM if provided
                    llm_sim_score = None
                    llm_uniq_score = None
                    sim_score_match = re.search(r"SIMILARITY_SCORE:\s*(\d+)%?", analysis_text, re.IGNORECASE)
                    if sim_score_match:
                        llm_sim_score = int(sim_score_match.group(1))
                    uniq_score_match = re.search(r"UNIQUENESS_SCORE:\s*(\d+)%?", analysis_text, re.IGNORECASE)
                    if uniq_score_match:
                        llm_uniq_score = int(uniq_score_match.group(1))
                    
                    # Use computed scores or LLM scores
                    final_similarity = llm_sim_score if llm_sim_score is not None else round(similarity_to_past * 100, 2)
                    final_uniqueness = llm_uniq_score if llm_uniq_score is not None else uniqueness_score
                    
                    uniqueness_comparisons.append({
                        "compared_to": internal_match.get("source", "unknown"),
                        "citation_scores": {
                            "similarity_percentage": final_similarity,
                            "uniqueness_percentage": final_uniqueness,
                            "raw_similarity_score": round(similarity_to_past, 4)
                        },
                        "similarities": similarities[:5] if similarities else ["Similar research domain and objectives"],
                        "uniqueness_aspects": uniqueness_points[:5] if uniqueness_points else ["Different methodology or novel application"],
                        "past_idea_snippet": internal_match.get("past_idea", "")[:300],
                        "full_analysis": analysis_text[:1000],
                        "status": "unique" if final_uniqueness > 50 else "similar" if final_similarity > 70 else "moderate"
                    })
                    
                except Exception as e:
                    logger.warning(f"Failed to generate detailed comparison for {internal_match.get('source')}: {e}")
                    similarity_to_past = internal_match.get("similarity_score", 0)
                    uniqueness_score = round((1.0 - similarity_to_past) * 100, 2)
                    
                    uniqueness_comparisons.append({
                        "compared_to": internal_match.get("source", "unknown"),
                        "citation_scores": {
                            "similarity_percentage": round(similarity_to_past * 100, 2),
                            "uniqueness_percentage": uniqueness_score,
                            "raw_similarity_score": round(similarity_to_past, 4)
                        },
                        "similarities": ["Analysis failed - similarity score computed from embeddings"],
                        "uniqueness_aspects": ["Could not generate detailed uniqueness analysis"],
                        "past_idea_snippet": internal_match.get("past_idea", "")[:300],
                        "full_analysis": "Analysis generation failed",
                        "status": "analysis_failed"
                    })
        else:
            # Fallback: Basic uniqueness comparison without Gemini explanations
            for internal_match in flagged_internal[:5]:
                similarity_to_past = internal_match.get("similarity_score", 0)
                uniqueness_score = round((1.0 - similarity_to_past) * 100, 2)
                
                uniqueness_comparisons.append({
                    "compared_to": internal_match.get("source", "unknown"),
                    "citation_scores": {
                        "similarity_percentage": round(similarity_to_past * 100, 2),
                        "uniqueness_percentage": uniqueness_score,
                        "raw_similarity_score": round(similarity_to_past, 4)
                    },
                    "similarities": [f"Similarity based on embedding distance: {round(similarity_to_past * 100, 2)}%"],
                    "uniqueness_aspects": [f"Uniqueness score: {uniqueness_score}% - Lower similarity indicates higher uniqueness in approach or methodology"],
                    "past_idea_snippet": internal_match.get("past_idea", "")[:300],
                    "full_analysis": "Gemini not available - using basic embedding similarity",
                    "status": "unique" if uniqueness_score > 40 else "similar"
                })
        
        logger.info(f"Generated {len(uniqueness_comparisons)} detailed uniqueness comparisons with citations")

        # If Gemini provided a direct novelty percentage, prefer it (validated later by LLM comment JSON if present)
        if comp_result.get("novelty_percentage") is not None:
            try:
                base_novelty = float(comp_result.get("novelty_percentage"))
            except Exception:
                base_novelty = None
        else:
            base_novelty = None

        # If base_novelty wasn't provided by Gemini, compute weighted novelty
        if base_novelty is None:
            base_novelty = (uniqueness * UNIQUENESS_WEIGHT) + (advantage * ADVANTAGE_WEIGHT) + (significance * SIGNIFICANCE_WEIGHT)
        base_novelty = float(max(0.0, min(100.0, base_novelty)))
        
        # Adjust novelty score based on SCAMPER analysis
        final_novelty, uniqueness, advantage, significance = adjust_novelty_with_scamper(
            base_novelty, uniqueness, advantage, significance, scamper_result, max_sim
        )
        
        # Update explanation to include SCAMPER impact if applicable
        if scamper_result and scamper_result.get("scamper_available"):
            scamper_count = scamper_result.get("scamper_count", 0)
            if scamper_count > 0:
                scamper_elements_list = [k for k, v in scamper_result.get("scamper_present", {}).items() if v]
                explanation += f" SCAMPER Analysis: {scamper_count}/7 innovation elements detected ({', '.join(scamper_elements_list)}), indicating structured innovation approach."
                if max_sim >= SIMILARITY_THRESHOLD:
                    explanation += f" Despite similarity to existing work, SCAMPER elements provide differentiation and strategic advantage."

        # Build LLM reviewer-style comment (use generated explanation + citations)
        # Compose citations block for comment
        citation_lines = []
        for i, e in enumerate(external_evidence[:8], start=1):
            t = e.get("title") or "Untitled"
            u = e.get("url") or (f"https://doi.org/{e.get('doi')}" if e.get("doi") else "No URL")
            citation_lines.append(f"[{i}] {t}\n    {u}")
        citations_block = "\n".join(citation_lines) if citation_lines else "No external references found."

        if GENAI_AVAILABLE and gemini_model:
            # Ask Gemini to render a concise (3-4 lines) reviewer comment + trailing JSON summary
            comment_prompt = f"""
You are an expert reviewer. Produce a concise 3-4 line novelty comment that explains why the idea is low/moderate/high novelty. After the brief comment, on its own line append a single JSON object with these exact keys: `novelty_percentage`, `uniqueness_score`, `advantage_score`, `significance_score`, `gnn_score`, `comment`.

Return only the comment text (3-4 lines) followed by the JSON. Example:
<3 short lines explaining novelty and referencing [1] or [2]>
{{"novelty_percentage": 24, "uniqueness_score": 0, "advantage_score": 40, "significance_score": 40, "gnn_score": 100, "comment": "Low novelty — methodology closely matches [E1]."}}

Supporting prior-art references:
{citations_block}

Core idea (brief):
{idea[:1200]}

Internal top matches summary:
{json.dumps(internal_matches_for_llm[:6], indent=2)}
"""
            try:
                resp = gemini_model.generate_content(comment_prompt)
                llm_comment = resp.text.strip()
                if llm_comment.startswith("```"):
                    llm_comment = llm_comment.strip("`")
                # Try to extract trailing JSON object that contains validated scores
                parsed_json = None
                parsed_comment = None
                try:
                    import re
                    # take the last {...} block in the response
                    m = re.search(r"(\{[\s\S]*\})\s*$", llm_comment)
                    if m:
                        jtxt = m.group(1)
                        try:
                            parsed_json = json.loads(jtxt)
                            # remove the JSON from llm_comment for readability
                            llm_comment = llm_comment[:m.start(1)].strip()
                        except Exception:
                            parsed_json = None
                except Exception:
                    parsed_json = None

                if parsed_json:
                    # Map possible key variants and sanitize numeric values
                    def pick_num(d, *keys):
                        for k in keys:
                            if k in d and d[k] is not None:
                                try:
                                    return max(0, min(100, int(round(float(d[k])))))
                                except Exception:
                                    return None
                        return None

                    p_novelty = pick_num(parsed_json, "novelty_percentage", "novelty", "noveltyPercent")
                    p_uniqueness = pick_num(parsed_json, "uniqueness_score", "uniqueness")
                    p_advantage = pick_num(parsed_json, "advantage_score", "advantage")
                    p_significance = pick_num(parsed_json, "significance_score", "significance")
                    # accept a 'comment' field for the compact comment
                    parsed_comment = parsed_json.get("comment") if isinstance(parsed_json.get("comment"), str) else None

                    # If the scoring LLM produced a novelty_percentage earlier (comp_result), prefer that
                    # (comp_result is authoritative). If not present there, accept parsed LLM novelty if available.
                    if comp_result.get("novelty_percentage") is None and p_novelty is not None:
                        try:
                            final_novelty = float(p_novelty)
                        except Exception:
                            pass

                    # If LLM-provided component scores are present and comp_result did not provide them, fill them
                    if comp_result.get("uniqueness") in (None, 0) and p_uniqueness is not None:
                        uniqueness = p_uniqueness
                    if comp_result.get("advantage") in (None, 0) and p_advantage is not None:
                        advantage = p_advantage
                    if comp_result.get("significance") in (None, 0) and p_significance is not None:
                        significance = p_significance
                    # If parsed_comment present, keep it for compact display
                else:
                    parsed_comment = None
            except Exception as e:
                logger.warning(f"Gemini comment render failed: {e}")
                llm_comment = f"Score: {int(round(final_novelty))};\n{explanation}\n\nSupporting prior-art references:\n{citations_block}\n\nRecommended actions:\n" + ("\n".join([f"- {r}" for r in (recommended_actions or [])]) or "- Provide comparative metrics vs cited works.")
        else:
            # fallback comment
            llm_comment = f"Score: {int(round(final_novelty))};\n{explanation}\n\nSupporting prior-art references:\n{citations_block}\n\nRecommended actions:\n" + ("\n".join([f"- {r}" for r in (recommended_actions or [])]) or "- Provide comparative metrics vs cited works.")

        # compact, consistent comment (prefer parsed_comment from LLM if provided)
        novelty_for_comment = float(final_novelty)
        if parsed_comment:
            compact_comment = parsed_comment
        else:
            if novelty_for_comment >= 80:
                label = "High novelty"
            elif novelty_for_comment >= 60:
                label = "Moderate novelty"
            elif novelty_for_comment >= 40:
                label = "Low-moderate novelty"
            else:
                label = "Low novelty"
            compact_comment = f"{label} ({novelty_for_comment:.1f}%)."

        # Build a clear, verifiable response focused on novelty + extraction
        # Add SCAMPER-based scoring explanation
        scamper_count = scamper_result.get("scamper_count", 0)
        scamper_boost_applied = scamper_result.get("scamper_available", False) and scamper_count > 0
        scamper_minimum_score = 70 + (scamper_count - 1) * 5 if scamper_count > 0 else 0
        
        result = {
            "novelty_percentage": round(final_novelty, 2),
            "novelty_source": ("llm" if comp_result.get("novelty_percentage") is not None else "heuristic"),
            "novelty_base_score": round(base_novelty, 2),
            "novelty_adjusted_by_scamper": scamper_boost_applied,
            "scamper_minimum_applied": scamper_minimum_score if scamper_boost_applied else None,
            "uniqueness_score": uniqueness,
            "advantage_score": advantage,
            "significance_score": significance,
            "gnn_score": gnn_score,
            "comment": compact_comment,  # short 1-line or LLM-provided compact comment
            "llm_comment": llm_comment,  # full LLM reviewer comment (3-4 lines + any explanation)
            "explanation": explanation,
            "recommended_actions": recommended_actions,

            # SCAMPER Analysis Results - Structured Format
            "scamper_analysis": {
                "performed": True,  # Always performed now
                "available": scamper_result.get("scamper_available", False),
                "score": scamper_result.get("scamper_score", 0),
                "elements_count": scamper_result.get("scamper_count", 0),
                "elements_detected": scamper_result.get("scamper_elements_detected", []),
                "minimum_novelty_threshold": scamper_minimum_score if scamper_count > 0 else None,
                "boost_applied": scamper_boost_applied,
                "scoring_rule": "If ANY SCAMPER element detected: Minimum score = 70 + (count-1)*5. Scale: 1→70, 2→75, 3→80, 4→85, 5→90, 6→95, 7→100",
                
                # Structured SCAMPER elements with Present/Explanation/Evidence
                "elements": scamper_result.get("scamper_structured", []),
                
                # Legacy format for backwards compatibility
                "elements_present": scamper_result.get("scamper_present", {}),
                "details": scamper_result.get("scamper_details", {}),
                "evidence": scamper_result.get("scamper_evidence", {}),
                "full_analysis": scamper_result.get("scamper_analysis", ""),
                "error": scamper_result.get("scamper_error", None)
            },

            # Internal matches / provenance
            "citations_internal": flagged_internal,
            
            # Uniqueness comparisons - detailed analysis of how this proposal differs from similar internal proposals
            "uniqueness_comparisons": uniqueness_comparisons,

            # Global citations (top 8) with similarity, uniqueness, and snippets for both
            "citations_global": [
                {
                    "title": e.get("title"), 
                    "snippet": e.get("snippet"), 
                    "url": e.get("url"), 
                    "year": e.get("year"), 
                    "similarity": e.get("similarity"),
                    "uniqueness": e.get("uniqueness"),
                    "uniqueness_snippet": e.get("uniqueness_snippet")
                } for e in external_evidence[:8]
            ],

            # Extraction outputs (from your exact extraction module)
            "extracted_structure": json_structure,
            "raw_extracted_data": proposal_data,
            "extracted_text_snippet": raw_text[:1500],
            "methodology_excerpt": methodology,
            "objectives_excerpt": objectives,

            "checked_at": datetime.now().isoformat(),
            "idea": idea,
            "uploaded_pdf_url": uploaded_pdf_url,
            "extracted_json_url": extracted_json_url,
            "max_internal_similarity": round(max_sim, 4),
            "pdf_hash": pdf_hash,
            "cached": False
        }
        
        # Store result in cache for future requests
        store_novelty_cache(pdf_hash, result)

        return JSONResponse(content=result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(traceback.format_exc())
        return JSONResponse(content={"error": str(e), "novelty_percentage": 0.0}, status_code=500)

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("novelty_agent_gnn_gemini:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
