import re
from io import BytesIO
from datetime import datetime
from typing import List, Tuple
import os
import json

import chardet
import PyPDF2
import docx
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse

router = APIRouter()


# Gemini configuration (optional)
try:
    import google.generativeai as genai
    _GEMINI_AVAILABLE = True
except Exception:
    genai = None
    _GEMINI_AVAILABLE = False

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY2") or os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("GEMINI_MODEL") or "gemini-2.5-flash-lite"
if _GEMINI_AVAILABLE and GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
    except Exception:
        pass


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


_UNIT_MAP = {
    "year": 12,
    "years": 12,
    "yr": 12,
    "yrs": 12,
    "month": 1,
    "months": 1,
    "mo": 1,
    "mos": 1,
    "week": 1 / 4.345,
    "weeks": 1 / 4.345,
    "wk": 1 / 4.345,
    "day": 1 / 30.44,
    "days": 1 / 30.44,
    "quarter": 3,
    "semester": 6,
}


def parse_number(text: str) -> float:
    # safe parse: handle None, empty strings, commas and simple words
    if text is None:
        return 0.0
    t = str(text).strip()
    if t == "":
        return 0.0
    # try numeric with commas
    try:
        return float(t.replace(',', ''))
    except Exception:
        # words to numbers simple mapping for common words
        words = {
            "one": 1,
            "two": 2,
            "three": 3,
            "four": 4,
            "five": 5,
            "six": 6,
            "seven": 7,
            "eight": 8,
            "nine": 9,
            "ten": 10,
        }
        return float(words.get(t.lower(), 0))


def find_durations(text: str) -> List[Tuple[float, str]]:
    """Find duration expressions and return list of (months, raw_text)"""
    out = []
    t = text.lower()
    # direct phrases that imply within-1-year
    if re.search(r"within\s+one\s+year|within\s+12\s+months|<\s*12\s*months", t):
        out.append((12.0, "within 1 year phrase"))

    # ranges like 6-12 months or 6 to 12 months
    range_re = re.compile(r"(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(years?|yrs?|yr|months?|mos?|mo|weeks?|wks?)")
    for m in range_re.finditer(t):
        a = parse_number(m.group(1))
        b = parse_number(m.group(2))
        unit = m.group(3)
        unit_months = _UNIT_MAP.get(unit.rstrip('s'), _UNIT_MAP.get(unit, 1))
        # conservative: take the upper bound
        months = max(a, b) * unit_months
        out.append((months, m.group(0)))

    # single durations like '6 months', 'two years'
    single_re = re.compile(r"(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten)\s*(years?|yrs?|yr|months?|mos?|mo|weeks?|wks?|days?|day|quarter|semester)\b")
    for m in single_re.finditer(t):
        n = parse_number(m.group(1))
        unit = m.group(2)
        unit_key = unit.rstrip('s')
        months = n * _UNIT_MAP.get(unit_key, _UNIT_MAP.get(unit, 1))
        out.append((months, m.group(0)))

    # hyphenated like '6-month' or '12-month'
    hyphen_re = re.compile(r"(\d+(?:\.\d+)?)-month")
    for m in hyphen_re.finditer(t):
        n = parse_number(m.group(1))
        out.append((n, m.group(0)))

    # If no durations found but 'short-term' or 'pilot' with time hints
    if not out:
        if re.search(r"short-?term|pilot|pilot[- ]scale|proof[- ]of[- ]concept|prototype", t):
            # assume short-term ~6 months as heuristic
            out.append((6.0, "heuristic: short-term/pilot mentioned"))

    return out


def decide_within_one_year(durations: List[Tuple[float, str]]) -> Tuple[str, float, str]:
    """Return decision 'Yes'/'No'/'Uncertain', total_months (sum), and rationale."""
    if not durations:
        return "Uncertain", 0.0, "No explicit timeline durations found in document."
    # conservative strategy: sum durations (assume sequential)
    months_list = [m for m, _ in durations]
    total = sum(months_list)
    # if any single duration > 12 months -> No
    if any(m > 12.0 for m in months_list):
        return "No", total, "At least one phase exceeds 12 months."
    # if total > 12 -> likely No
    if total > 12.0:
        return "No", total, "Summed phase durations exceed 12 months." 
    # if any explicit within-1-year phrase present -> Yes
    for m, raw in durations:
        if 'within' in raw and 'year' in raw:
            return "Yes", total, "Document explicitly states completion within one year." 
    # otherwise yes
    return "Yes", total, "Summed durations within 12 months (assumes sequential phases)."


def decide_within_months(durations: List[Tuple[float, str]], horizon_months: float = 24.0) -> Tuple[str, float, str]:
    """Generic decision for an arbitrary horizon in months."""
    if not durations:
        return "Uncertain", 0.0, "No explicit timeline durations found in document."
    months_list = [m for m, _ in durations]
    total = sum(months_list)
    # if any single duration > horizon -> No
    if any(m > horizon_months for m in months_list):
        return "No", total, f"At least one phase exceeds {int(horizon_months)} months."
    if total > horizon_months:
        return "No", total, f"Summed phase durations exceed {int(horizon_months)} months."
    for m, raw in durations:
        if 'within' in raw and ('year' in raw or 'month' in raw):
            return "Yes", total, f"Document explicitly states completion within {int(horizon_months)} months."
    return "Yes", total, f"Summed durations within {int(horizon_months)} months (assumes sequential phases)."


def _extract_budget_items(text: str) -> dict:
    """Try to extract simple budget numbers for 'manpower' and 'capital equipment' from text.
    Returns dict like {'manpower': float, 'capital_equipment': float, 'currency_unit': str}
    """
    out = {"manpower": 0.0, "capital_equipment": 0.0, "currency_unit": "unknown"}
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    # search lines for keywords and capture numbers
    num_re = re.compile(r"([\d,]+\.?\d*)")
    for ln in lines:
        low = ln.lower()
        if "manpower" in low:
            m = num_re.search(ln.replace('rs.', '').replace('rs', ''))
            if m:
                try:
                    val = float(m.group(1).replace(',', ''))
                except Exception:
                    val = 0.0
                out["manpower"] += val
        if "capital" in low or "capital equipment" in low or "equipment" in low:
            m = num_re.search(ln.replace('rs.', '').replace('rs', ''))
            if m:
                try:
                    val = float(m.group(1).replace(',', ''))
                except Exception:
                    val = 0.0
                out["capital_equipment"] += val
        # detect unit hints
        if "lakh" in low or "lakhs" in low:
            out["currency_unit"] = "lakhs"
        if "rs" in low or "rupee" in low or "inr" in low:
            out["currency_unit"] = "INR"
    return out


def _gemini_assess(full_text: str, summary: dict, horizon_months: int = 24) -> dict:
    """Call Gemini to get a structured assessment. Returns dict with keys: decision, score, comment.
    If Gemini not available or returns invalid output, returns None.
    """
    if not _GEMINI_AVAILABLE or not GEMINI_API_KEY:
        return None
    # Build a prompt that asks for strict JSON output
    prompt = (
        "You are an expert project reviewer. Given the extracted project expenditure and timeline text,"
        f" decide whether the project can be completed within {horizon_months} months.\n"
        "Output ONLY a JSON object with keys: decision (Yes/No/Uncertain), score (0-100 integer), comment (one short paragraph).\n"
        "Also include a short rationale field. The comment should be suitable for a human-readable report.\n"
        "Input summary (as JSON):\n" + json.dumps(summary)
    )
    try:
        resp = genai.generate(model=MODEL_NAME, prompt=prompt)
        # resp may have text in different fields depending on SDK; try common ones
        text = None
        if hasattr(resp, 'candidates') and resp.candidates:
            text = resp.candidates[0].content
        elif hasattr(resp, 'text'):
            text = resp.text
        elif isinstance(resp, dict) and 'output' in resp:
            text = resp['output']
        if not text:
            return None
        # try to find JSON in text
        jtext = text.strip()
        # sometimes model returns markdown; try to extract {...}
        m = re.search(r"(\{[\s\S]*\})", jtext)
        if m:
            jtext = m.group(1)
        parsed = json.loads(jtext)
        # basic validation (allow missing score/comment but require decision)
        if "decision" not in parsed:
            return None
        # safe score parsing: accept int/float or numeric string; treat empty as None
        raw_score = parsed.get("score")
        score_val = None
        if raw_score is not None:
            try:
                if isinstance(raw_score, (int, float)):
                    score_val = int(round(float(raw_score)))
                else:
                    s = str(raw_score).strip()
                    if s != "":
                        score_val = int(round(float(s.replace(',', ''))))
                    else:
                        score_val = None
            except Exception:
                score_val = None
        return {
            "decision": parsed.get("decision"),
            "score": score_val,
            "comment": parsed.get("comment"),
            "rationale": parsed.get("rationale") or parsed.get("reason")
        }
    except Exception:
        return None


def build_comment(decision: str, months: float, details: List[Tuple[float, str]]) -> str:
    # New formatter returning the exact structure requested by the user.
    months_str = f"{months:.1f}" if months else "N/A"
    # Short paragraph tailored to decision
    if decision == "Yes":
        para = (
            f"Proposed milestones are defined and the timeline ({months_str} months)\n"
            "appears achievable with current resources, provided clear acceptance criteria and\n"
            "measurable outputs are attached to each milestone. Strengthen deliverable descriptions\n"
            "to tie disbursements to verified progress."
        )
        recs = [
            "Attach a Gantt with milestone dates and specific, testable acceptance criteria for each deliverable.",
            "Define measurable KPIs (e.g., pilot throughput, emissions targets, energy recovery rates) per milestone.",
            "Propose verification methods and third-party sign-off procedures to enable tranche-based funding."
        ]
    elif decision == "No":
        para = (
            f"The extracted timeline ({months_str} months) and phase breakdown indicate the project\n"
            "is unlikely to be completed within the requested horizon without scope reduction or\n"
            "additional resources (staff, equipment, or budget). Consider re-scoping or parallelisation."
        )
        recs = [
            "Reduce scope or split work into parallel tracks to shorten the critical path.",
            "Request additional manpower/equipment or revise budget allocation to critical phases.",
            "Provide a phased delivery plan with clear acceptance tests for each tranche."
        ]
    else:
        para = (
            "Unable to determine feasibility from the provided document. The submission lacks clear\n"
            "milestones, durations per phase, or a detailed resource plan. Provide explicit timelines."
        )
        recs = [
            "Add a Gantt chart with phase durations and dependencies.",
            "List staffing and equipment per phase with estimated FTEs and availability.",
            "Specify acceptance criteria and KPIs for each milestone."
        ]

    # Compose the block. Changeable heuristic: proportion of issues that can be improved
    # We map lower score -> higher changeable; scale factor chosen so score 60 -> 32 as example.
    def _changeable_from_score(s: int) -> int:
        try:
            s = int(s)
        except Exception:
            return 50
        changeable = int(max(0, min(100, round((100 - s) * 0.8))))
        return changeable

    # Build the text block
    score = 0
    try:
        # caller normally provides score via outer scope; keep placeholder
        score = int(round(months)) if months and months > 0 else 0
    except Exception:
        score = 0

    # We'll leave score injection to the caller; this function returns the paragraph + recs portion
    details_txt = "; ".join([f"{d[1]} -> {d[0]:.1f} months" for d in details]) or "No durations detected."

    body_lines = [para, "", "Recommended actions:"]
    for r in recs:
        body_lines.append(f"- {r}")

    return "\n".join(body_lines)


@router.post('/deliverable-check')
async def deliverable_check(file: UploadFile = File(...)):
    try:
        data = await file.read()
        filename = file.filename or f"upload_{datetime.utcnow().isoformat()}"
        full_text = extract_text(filename, data)
        if not full_text or len(full_text.strip()) < 50:
            return JSONResponse({"error": "Could not extract meaningful text or file too short."}, status_code=400)

        # Extract durations and simple budget items
        durations = find_durations(full_text)
        budget = _extract_budget_items(full_text)

        # First, a heuristic decision for a 24-month horizon
        horizon_months = 24
        decision_h, total_months, rationale = decide_within_months(durations, horizon_months=horizon_months)

        # Prepare a summary to send to Gemini if available
        summary = {
            "filename": filename,
            "total_estimated_months": total_months,
            "durations": durations,
            "budget_items": budget,
            "rationale": rationale
        }

        gemini_result = _gemini_assess(full_text, summary, horizon_months=horizon_months)

        # Heuristic score (fallback)
        def _heuristic_score():
            score = 50
            if total_months <= horizon_months:
                score += 25
            if any(m > horizon_months for m, _ in durations):
                score -= 40
            # budget presence boosts
            try:
                if budget.get("manpower", 0) and budget.get("manpower", 0) > 0:
                    score += 10
                if budget.get("capital_equipment", 0) and budget.get("capital_equipment", 0) > 0:
                    score += 7
            except Exception:
                pass
            # clamp
            score = int(max(0, min(100, score)))
            return score

        if gemini_result:
            score = gemini_result.get("score") if gemini_result.get("score") is not None else _heuristic_score()
            decision = gemini_result.get("decision") or decision_h
            # prefer gemini's comment but fall back to local formatter
            comment_body = gemini_result.get("comment") or build_comment(decision, total_months, durations)
        else:
            score = _heuristic_score()
            decision = decision_h
            comment_body = build_comment(decision, total_months, durations)

        # Compute changeable percent: scale (100 - score) by 0.8 so 60 -> 32 as example
        try:
            score_int = int(max(0, min(100, int(round(score)))))
        except Exception:
            score_int = int(max(0, min(100, score if isinstance(score, int) else 50)))

        changeable = int(max(0, min(100, round((100 - score_int) * 0.8))))

        # Compose final formatted comment block requested by user
        header = f"Score: {score_int}/100    Changeable: {changeable}%"
        # Ensure comment_body is plain text
        if isinstance(comment_body, dict):
            # try to extract a human paragraph
            comment_text = comment_body.get("comment") or comment_body.get("rationale") or json.dumps(comment_body)
        else:
            comment_text = str(comment_body)

        final_comment = f"{header}\n{comment_text}\n"
        # Ensure Recommended actions section exists; if not, append generic recs based on decision
        if "Recommended actions" not in final_comment and "Recommended actions:" not in final_comment:
            if decision == "Yes":
                recs = [
                    "Attach a Gantt with milestone dates and specific, testable acceptance criteria for each deliverable.",
                    "Define measurable KPIs (e.g., pilot throughput, emissions targets, energy recovery rates) per milestone.",
                    "Propose verification methods and third-party sign-off procedures to enable tranche-based funding."
                ]
            elif decision == "No":
                recs = [
                    "Reduce scope or split work into parallel tracks to shorten the critical path.",
                    "Request additional manpower/equipment or revise budget allocation to critical phases.",
                    "Provide a phased delivery plan with clear acceptance tests for each tranche."
                ]
            else:
                recs = [
                    "Add a Gantt chart with phase durations and dependencies.",
                    "List staffing and equipment per phase with estimated FTEs and availability.",
                    "Specify acceptance criteria and KPIs for each milestone."
                ]
            final_comment += "Recommended actions:\n"
            for r in recs:
                final_comment += f"{r}\n"

        return JSONResponse({
            "score": score_int,
            "comment": final_comment.strip()
        })
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
