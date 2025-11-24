import os
import re
from io import BytesIO
from datetime import datetime
from typing import List, Tuple, Dict

import chardet
import PyPDF2
import docx
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse

router = APIRouter()


def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        reader = PyPDF2.PdfReader(BytesIO(file_bytes))
        out = ""
        for p in reader.pages:
            t = p.extract_text()
            if t:
                out += t + "\n"
        return out
    except Exception:
        enc = chardet.detect(file_bytes).get("encoding") or "utf-8"
        try:
            return file_bytes.decode(enc, errors="ignore")
        except Exception:
            return ""


def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        doc = docx.Document(BytesIO(file_bytes))
        return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    except Exception:
        return ""


def extract_text(filename: str, data: bytes) -> str:
    ext = (filename or "").lower().split(".")[-1]
    if ext == "pdf":
        return extract_text_from_pdf(data)
    if ext == "docx":
        return extract_text_from_docx(data)
    if ext in ("txt", "csv"):
        enc = chardet.detect(data).get("encoding") or "utf-8"
        try:
            return data.decode(enc, errors="ignore")
        except Exception:
            return ""
    return ""


# Categories and representative keywords (simple, extendable)
BENEFIT_CATEGORIES = {
    "advanced_mining": {
        "label": "Advanced technologies for improving coal mining",
        "keywords": [
            "automation", "mechanization", "remote monitoring", "sensors", "autonomous",
            "robot", "drones", "predictive maintenance", "telemetry", "real-time monitoring"
        ]
    },
    "safety_health_env": {
        "label": "Safety, health, and environment improvements",
        "keywords": [
            "safety", "occupational", "health", "environment", "emissions", "dust control",
            "rehabilitation", "water treatment", "ventilation", "ppe"
        ]
    },
    "waste_to_wealth": {
        "label": "Waste-to-Wealth concepts",
        "keywords": [
            "waste-to-energy", "gasification", "ash utilization", "valorization", "byproduct",
            "pyrolysis", "circular economy", "resource recovery"
        ]
    },
    "alternative_uses": {
        "label": "Alternative uses of coal & clean coal technologies",
        "keywords": [
            "clean coal", "carbon capture", "ccs", "coal-to-liquids", "hydrogen", "syngas", "igcc"
        ]
    },
    "beneficiation": {
        "label": "Coal beneficiation & efficient utilization",
        "keywords": [
            "beneficiation", "washing", "density separation", "efficiency", "grinding", "briquetting",
            "sintering", "optimization"
        ]
    },
    "exploration": {
        "label": "Exploration technologies",
        "keywords": [
            "remote sensing", "geophysical", "gis", "drilling", "seismic", "3d modeling", "airborne"
        ]
    },
    "indigenization": {
        "label": "Innovation & indigenization (Make-in-India)",
        "keywords": [
            "indigenization", "make-in-india", "local manufacturing", "localize", "indigenous", "cost reduction"
        ]
    }
}


def text_matches_keywords(text: str, keywords: List[str]) -> int:
    t = (text or "").lower()
    count = 0
    for kw in keywords:
        # allow multi-word keywords
        if kw in t:
            count += 1
    return count


def compute_benefit_score(full_text: str) -> Tuple[int, dict]:
    """Return score (0-100) and per-category match info."""
    matches = {}
    total_categories = len(BENEFIT_CATEGORIES)
    matched_categories = 0
    # also compute keyword counts for finer-grain score
    total_keyword_matches = 0
    total_possible_keywords = 0
    for k, meta in BENEFIT_CATEGORIES.items():
        kws = meta.get("keywords", [])
        total_possible_keywords += max(1, len(kws))
        c = text_matches_keywords(full_text, kws)
        matches[k] = {"label": meta.get("label"), "keyword_matches": c, "matched": c > 0}
        if c > 0:
            matched_categories += 1
            total_keyword_matches += c

    # primary score: proportion of categories matched
    cat_score = int(round((matched_categories / total_categories) * 100))
    # secondary: boost modestly if many keyword matches
    kw_boost = int(min(20, (total_keyword_matches / max(1, total_possible_keywords)) * 20))
    final_score = min(100, cat_score + kw_boost)
    return final_score, {"matched_categories": matched_categories, "details": matches, "total_keyword_matches": total_keyword_matches}


def build_formatted_comment(score: int, summary: str, missing_categories: List[str]) -> str:
    score_int = int(round(score))
    changeable = max(0, 100 - score_int)
    benefit_yes = "Yes" if score_int >= 50 else "No"
    # short paragraph
    if score_int >= 75:
        para = f"The document aligns well with Ministry priorities and presents clear benefit pathways for MOC. Prioritise validation and pilot demonstrations."
    elif score_int >= 50:
        para = f"The document contains useful concepts relevant to MOC, but some areas need more technical detail or validation to strengthen impact."
    else:
        para = f"The document has limited alignment to the listed MOC benefit areas; revisions are needed to demonstrate clear benefits and technical readiness."

    # recommended actions driven by missing categories
    recs = []
    if missing_categories:
        recs.append(f"Address gaps: include work on {', '.join(missing_categories[:3])}.")
    recs.append("Add technical validation or pilot plans to demonstrate feasibility.")
    recs.append("Highlight practical benefits to operations, safety, or environment with quantitative targets.")

    comment_lines = [f"Score: {score_int}/100 Benefit to MOC: {benefit_yes}", para, "Recommended actions:"]
    for r in recs:
        comment_lines.append(f"- {r}")
    return "\n".join(comment_lines)


@router.post("/benefit-check")
async def benefit_check(file: UploadFile = File(...)):
    try:
        data = await file.read()
        filename = file.filename or f"upload_{datetime.utcnow().isoformat()}"
        full_text = extract_text(filename, data)
        if not full_text or len(full_text.strip()) < 30:
            return JSONResponse({"error": "Could not extract meaningful text"}, status_code=400)

        score, meta = compute_benefit_score(full_text)
        matched = [k for k, v in meta["details"].items() if v.get("matched")]
        missing = [v["label"] for k, v in meta["details"].items() if not v.get("matched")]

        # create a short summary from first 2 matched categories or first sentences
        summary = ""
        if matched:
            labels = [BENEFIT_CATEGORIES[k]["label"] for k in BENEFIT_CATEGORIES.keys() if k in matched]
            summary = f"Matches categories: {', '.join(labels[:3])}."
        else:
            summary = "No clear category matches detected."

        comment = build_formatted_comment(score, summary, missing)

        return JSONResponse({"benefit_score": int(round(score)), "comment": comment, "meta": meta})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
