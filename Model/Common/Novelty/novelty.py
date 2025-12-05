# novelty_agent_gnn_gemini.py
"""
Novelty Agent with 3-component scoring + GNN + Gemini (gemini-2.5-flash-lite)

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
import json
import uuid
import logging
import traceback
from io import BytesIO
from datetime import datetime
from typing import List, Dict, Any

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

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("novelty-agent-gnn-gemini")

# ---------------------- CONFIG ----------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
PROCESSED_BUCKET = os.getenv("PROCESSED_JSON_BUCKET", "processed-json")
UPLOAD_BUCKET = os.getenv("UPLOAD_BUCKET", "Coal-research-files")
EXTRACT_BUCKET = os.getenv("EXTRACT_JSON_BUCKET", "proposal-json")

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

# Gemini (gemini-2.5-flash-lite)
GENAI_AVAILABLE = False
gemini_model = None
GEMINI_KEY = os.getenv("GEMINI_API_KEY4")
if GEMINI_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_KEY)
        gemini_model = genai.GenerativeModel("gemini-2.5-flash-lite")
        GENAI_AVAILABLE = True
        logger.info("Gemini configured.")
    except Exception as e:
        logger.warning(f"Could not configure Gemini: {e}")
        GENAI_AVAILABLE = False

app = FastAPI(title="Novelty Agent (GNN + Gemini)")
router = APIRouter()

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
        except Exception as e:
            logger.warning(f"Gemini summarize failed: {e}")
    s = text.replace("\n", " ").strip()
    sentences = [seg.strip() for seg in s.split(".") if seg.strip()]
    if not sentences:
        return s[:max_chars]
    if len(sentences[0]) > 10:
        return sentences[0][:max_chars]
    if len(sentences) > 1:
        return (sentences[0] + ". " + sentences[1])[:max_chars]
    return sentences[0][:max_chars]

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

# ---------------------- Gemini comparator for 3-component scoring ----------------------
def gemini_score_components(idea: str, internal_matches: List[Dict[str, Any]], external_matches: List[Dict[str, Any]]) -> Dict[str, Any]:
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
You are a senior research evaluator. Given the new proposal idea and examples of previous work (internal) and published papers (external), produce a JSON object with these exact keys:
- uniqueness: integer 0-100
- advantage: integer 0-100
- significance: integer 0-100
- explanation: string (one paragraph explaining why those numbers; mention which cited items influenced the judgement using [E1]/[I1] style)
- recommended_actions: list of short strings (2-4 items)
The final novelty score will be computed externally as a weighted sum: uniqueness*{UNIQUENESS_WEIGHT} + advantage*{ADVANTAGE_WEIGHT} + significance*{SIGNIFICANCE_WEIGHT}.

New idea:
\"\"\"{idea}\"\"\"

Internal matches:
{internal_text or 'None'}

External matches (top):
{external_text or 'None'}

Rules:
- Compare concretely: if the new idea clearly addresses explicit weaknesses or limitations mentioned in the external matches, advantage should be high.
- If many external matches essentially implement the same method, uniqueness should be low.
- Significance should reflect potential impact and scale.
- Return only JSON (no extra commentary).
"""

    if GENAI_AVAILABLE and gemini_model:
        try:
            resp = gemini_model.generate_content(prompt)
            txt = resp.text.strip()
            if txt.startswith("```"):
                txt = txt.split("```", 1)[-1]
            result = json.loads(txt)
            # sanitize numeric values
            for k in ("uniqueness", "advantage", "significance"):
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
    """
    try:
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="No file uploaded")
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files accepted")

        file_bytes = await file.read()
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
        try:
            json_name = f"{uuid.uuid4()}_extracted.json"
            supabase.storage.from_(EXTRACT_BUCKET).upload(json_name, json.dumps({"methodology": methodology, "objectives": objectives}, indent=2).encode("utf-8"), {"content-type": "application/json"})
            extracted_json_url = supabase.storage.from_(EXTRACT_BUCKET).get_public_url(json_name)
        except Exception as e:
            logger.warning(f"Supabase upload extracted JSON failed: {e}")

        # Load past projects and compute past ideas
        past_projects = list_processed_projects(PROCESSED_BUCKET)
        past_ideas = []
        past_filenames = []
        for p in past_projects:
            pdata = p.get("data") or {}
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

        # External academic search
        citations_global = academic_search_combined(idea, limit=12)
        # embeddings for external snippets to compute external_sim
        ext_texts = [((c.get("title") or "") + ". " + (c.get("snippet") or ""))[:1500] for c in citations_global]
        ext_embs = compute_embeddings(ext_texts) if ext_texts else np.zeros((0, embedder.get_sentence_embedding_dimension()))
        # compute cosine sim between input_emb(original embedding before GNN?) We'll use refined input_emb for consistency
        ext_sims = [cos(input_emb, e) for e in ext_embs] if ext_embs.size else []
        # build normalized external evidence list
        external_evidence = []
        for i, hit in enumerate(citations_global):
            url = hit.get("url") or (f"https://doi.org/{hit.get('doi')}" if hit.get("doi") else None)
            external_evidence.append({"source": hit.get("source"), "title": hit.get("title"), "url": url, "doi": hit.get("doi"), "snippet": hit.get("snippet"), "year": hit.get("year"), "similarity": round(ext_sims[i], 4) if i < len(ext_sims) else None})

        # Prepare matches for LLM: internal_matches include similarity score, external_matches include title/snippet/url/similarity
        internal_matches_for_llm = [{"source": f.get("source") if isinstance(f, dict) and f.get("source") else f.get("source", f.get("source")), "similarity_score": f.get("similarity_score"), "past_idea": f.get("past_idea")} for f in flagged_internal]  # keep as-is
        external_matches_for_llm = external_evidence

        # Use Gemini to compute uniqueness/advantage/significance
        comp_result = gemini_score_components(idea, internal_matches_for_llm, external_matches_for_llm)
        uniqueness = comp_result.get("uniqueness", 0)
        advantage = comp_result.get("advantage", 0)
        significance = comp_result.get("significance", 0)
        explanation = comp_result.get("explanation", "")
        recommended_actions = comp_result.get("recommended_actions", [])

        # Weighted final novelty
        final_novelty = (uniqueness * UNIQUENESS_WEIGHT) + (advantage * ADVANTAGE_WEIGHT) + (significance * SIGNIFICANCE_WEIGHT)
        final_novelty = float(max(0.0, min(100.0, final_novelty)))

        # Build LLM reviewer-style comment (use generated explanation + citations)
        # Compose citations block for comment
        citation_lines = []
        for i, e in enumerate(external_evidence[:8], start=1):
            t = e.get("title") or "Untitled"
            u = e.get("url") or (f"https://doi.org/{e.get('doi')}" if e.get("doi") else "No URL")
            citation_lines.append(f"[{i}] {t}\n    {u}")
        citations_block = "\n".join(citation_lines) if citation_lines else "No external references found."

        if GENAI_AVAILABLE and gemini_model:
            # Ask Gemini to render final reviewer comment combining numeric scores and references
            comment_prompt = f"""
You are an expert reviewer. Produce a human-readable novelty comment in this exact format:

Score: <final_novelty_integer>;
<One or two short paragraphs describing novelty, referencing external items like [1], [2] where relevant.>
Supporting prior-art references:
{citations_block}

Recommended actions:
- <bullet>
- <bullet>

Also include a short line explaining why the numeric breakdown is: Uniqueness={uniqueness}, Advantage={advantage}, Significance={significance}.

Return only the assembled text (no JSON).
Core idea:
\"\"\"{idea}\"\"\"

Internal top matches summary:
{json.dumps(internal_matches_for_llm[:6], indent=2)}
"""
            try:
                resp = gemini_model.generate_content(comment_prompt)
                llm_comment = resp.text.strip()
                if llm_comment.startswith("```"):
                    llm_comment = llm_comment.strip("`")
            except Exception as e:
                logger.warning(f"Gemini comment render failed: {e}")
                llm_comment = f"Score: {int(round(final_novelty))};\n{explanation}\n\nSupporting prior-art references:\n{citations_block}\n\nRecommended actions:\n" + ("\n".join([f"- {r}" for r in (recommended_actions or [])]) or "- Provide comparative metrics vs cited works.")
        else:
            # fallback comment
            llm_comment = f"Score: {int(round(final_novelty))};\n{explanation}\n\nSupporting prior-art references:\n{citations_block}\n\nRecommended actions:\n" + ("\n".join([f"- {r}" for r in (recommended_actions or [])]) or "- Provide comparative metrics vs cited works.")

        # short readable comment
        if final_novelty >= 80:
            short_comment = f"High novelty ({round(final_novelty,2)}%)."
        elif final_novelty >= 60:
            short_comment = f"Moderate novelty ({round(final_novelty,2)}%)."
        elif final_novelty >= 40:
            short_comment = f"Low-moderate novelty ({round(final_novelty,2)}%)."
        else:
            short_comment = f"Low novelty ({round(final_novelty,2)}%)."

        result = {
            "novelty_percentage": round(final_novelty, 2),
            "uniqueness_score": uniqueness,
            "advantage_score": advantage,
            "significance_score": significance,
            "gnn_score": gnn_score,
            "comment": short_comment,
            "llm_comment": llm_comment,
            "explanation": explanation,
            "recommended_actions": recommended_actions,
            "flagged_internal": flagged_internal,
            "citations_global": external_evidence,
            "table": [{"column": "methodology", "value": methodology}, {"column": "objectives", "value": objectives}],
            "checked_at": datetime.now().isoformat(),
            "idea": idea,
            "uploaded_pdf_url": uploaded_pdf_url,
            "extracted_json_url": extracted_json_url,
            "max_internal_similarity": round(max_sim, 4)
        }

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
