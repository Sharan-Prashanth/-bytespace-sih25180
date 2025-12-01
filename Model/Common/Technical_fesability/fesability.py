import os
import re
import json
from io import BytesIO
from typing import List, Tuple, Dict

import chardet
import PyPDF2
import docx
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse


def extract_text_from_pdf_bytes(file_bytes: bytes) -> str:
    try:
        reader = PyPDF2.PdfReader(BytesIO(file_bytes))
        out = []
        for p in reader.pages:
            t = p.extract_text()
            if t:
                out.append(t)
        return "\n".join(out)
    except Exception:
        enc = chardet.detect(file_bytes).get("encoding") or "utf-8"
        try:
            return file_bytes.decode(enc, errors="ignore")
        except Exception:
            return ""


def extract_text_from_docx_bytes(file_bytes: bytes) -> str:
    try:
        d = docx.Document(BytesIO(file_bytes))
        return "\n".join([p.text for p in d.paragraphs if p.text.strip()])
    except Exception:
        return ""


def extract_text_from_path(path: str) -> str:
    path = os.path.abspath(path)
    if not os.path.exists(path):
        raise FileNotFoundError(path)
    ext = path.lower().split('.')[-1]
    with open(path, 'rb') as f:
        data = f.read()
    if ext == 'pdf':
        return extract_text_from_pdf_bytes(data)
    if ext in ('docx', 'doc'):
        return extract_text_from_docx_bytes(data)
    # fallback to smart decode
    enc = chardet.detect(data).get('encoding') or 'utf-8'
    try:
        return data.decode(enc, errors='ignore')
    except Exception:
        return ''


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
    "day": 1 / 30.44,
    "days": 1 / 30.44,
    "quarter": 3,
    "semester": 6,
}


def parse_number(text: str) -> float:
    if text is None:
        return 0.0
    t = str(text).strip()
    if t == "":
        return 0.0
    try:
        return float(t.replace(',', ''))
    except Exception:
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
    out = []
    t = text.lower()
    if re.search(r"within\s+one\s+year|within\s+12\s+months|<\s*12\s*months", t):
        out.append((12.0, "within 1 year phrase"))

    range_re = re.compile(r"(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(years?|yrs?|yr|months?|mos?|mo|weeks?|wks?)")
    for m in range_re.finditer(t):
        a = parse_number(m.group(1))
        b = parse_number(m.group(2))
        unit = m.group(3)
        unit_months = _UNIT_MAP.get(unit.rstrip('s'), _UNIT_MAP.get(unit, 1))
        months = max(a, b) * unit_months
        out.append((months, m.group(0)))

    single_re = re.compile(r"(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten)\s*(years?|yrs?|yr|months?|mos?|mo|weeks?|wks?|days?|day|quarter|semester)\b")
    for m in single_re.finditer(t):
        n = parse_number(m.group(1))
        unit = m.group(2)
        unit_key = unit.rstrip('s')
        months = n * _UNIT_MAP.get(unit_key, _UNIT_MAP.get(unit, 1))
        out.append((months, m.group(0)))

    if not out:
        if re.search(r"short-?term|pilot|pilot[- ]scale|proof[- ]of[- ]concept|prototype", t):
            out.append((6.0, "heuristic: short-term/pilot mentioned"))

    return out


def decide_within_months(durations: List[Tuple[float, str]], horizon_months: float = 24.0) -> Tuple[str, float, str]:
    if not durations:
        return "Uncertain", 0.0, "No explicit timeline durations found in document."
    months_list = [m for m, _ in durations]
    total = sum(months_list)
    if any(m > horizon_months for m in months_list):
        return "No", total, f"At least one phase exceeds {int(horizon_months)} months."
    if total > horizon_months:
        return "No", total, f"Summed phase durations exceed {int(horizon_months)} months."
    for m, raw in durations:
        if 'within' in raw and ('year' in raw or 'month' in raw):
            return "Yes", total, f"Document explicitly states completion within {int(horizon_months)} months."
    return "Yes", total, f"Summed durations within {int(horizon_months)} months (assumes sequential phases)."


def extract_budget_items(text: str) -> dict:
    out = {"manpower": 0.0, "capital_equipment": 0.0, "currency_unit": "unknown"}
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    num_re = re.compile(r"([\d,]+\.?\d*)")
    for ln in lines:
        low = ln.lower()
        if "manpower" in low or "personnel" in low or "fte" in low:
            m = num_re.search(ln.replace('rs.', '').replace('rs', ''))
            if m:
                try:
                    val = float(m.group(1).replace(',', ''))
                except Exception:
                    val = 0.0
                out["manpower"] += val
        if "capital" in low or "capital equipment" in low or "equipment" in low or "machin" in low:
            m = num_re.search(ln.replace('rs.', '').replace('rs', ''))
            if m:
                try:
                    val = float(m.group(1).replace(',', ''))
                except Exception:
                    val = 0.0
                out["capital_equipment"] += val
        if "lakh" in low or "lakhs" in low:
            out["currency_unit"] = "lakhs"
        if "rs" in low or "rupee" in low or "inr" in low:
            out["currency_unit"] = "INR"
    return out


CHECKLIST = [
    {"id": "objective", "label": "Clear objectives/aims", "keywords": ["objective", "aim", "purpose", "goal"]},
    {"id": "novelty", "label": "Novelty / state-of-the-art", "keywords": ["novel", "novelty", "state of the art", "state-of-the-art", "original"]},
    {"id": "methodology", "label": "Methodology / technical approach", "keywords": ["methodology", "approach", "method", "technique", "protocol"]},
    {"id": "deliverables", "label": "Deliverables / outputs", "keywords": ["deliverable", "output", "result", "report", "prototype"]},
    {"id": "timeline", "label": "Timeline / milestones / Gantt", "keywords": ["timeline", "milestone", "gantt", "month", "schedule", "phase"]},
    {"id": "budget", "label": "Budget and cost breakdown", "keywords": ["budget", "cost", "capital", "manpower", "expenditure", "cost estimate"]},
    {"id": "manpower", "label": "Staffing / manpower plan", "keywords": ["manpower", "personnel", "fte", "team", "staff"]},
    {"id": "equipment", "label": "Equipment / infrastructure", "keywords": ["equipment", "pilot plant", "facility", "infrastructure"]},
    {"id": "environment", "label": "Environmental / safety compliance", "keywords": ["emission", "environment", "safety", "pollution", "hazard"]},
    {"id": "commercial", "label": "Commercialisation / scalability plan", "keywords": ["commercial", "scale", "scalability", "market", "deployment"]},
    {"id": "ip", "label": "Intellectual property / patent plan", "keywords": ["patent", "ip", "intellectual property", "copyright"]},
    {"id": "kpi", "label": "KPIs and acceptance criteria", "keywords": ["kpi", "acceptance", "criteria", "indicator", "benchmark"]},
    {"id": "risk", "label": "Risk mitigation and contingency", "keywords": ["risk", "mitigation", "contingency", "uncertain"]},
    {"id": "collab", "label": "Collaborations / partners / institutions", "keywords": ["collaborat", "partner", "institution", "industry", "lab"]},
]


def match_checklist(full_text: str) -> List[Dict]:
    t = full_text.lower()
    results = []
    for item in CHECKLIST:
        kw_found = []
        for kw in item['keywords']:
            if kw in t:
                kw_found.append(kw)
        # simple rules: >=2 keywords -> satisfied, 1 keyword -> partial, 0 -> missing
        if len(kw_found) >= 2:
            status = 'Satisfied'
        elif len(kw_found) == 1:
            status = 'Partially satisfied'
        else:
            status = 'Missing'
        results.append({
            'id': item['id'],
            'label': item['label'],
            'status': status,
            'found_keywords': kw_found
        })
    return results


def heuristic_score_from_components(checklist: List[Dict], total_months: float, budget: dict, horizon_months: int = 24) -> int:
    score = 50
    # each satisfied checklist item +3, partial +1
    for c in checklist:
        if c['status'] == 'Satisfied':
            score += 3
        elif c['status'] == 'Partially satisfied':
            score += 1
    # timeline
    if total_months and total_months <= horizon_months:
        score += 10
    # budget presence
    try:
        if budget.get('manpower', 0) and budget.get('manpower', 0) > 0:
            score += 5
        if budget.get('capital_equipment', 0) and budget.get('capital_equipment', 0) > 0:
            score += 5
    except Exception:
        pass
    return int(max(0, min(100, score)))


def extract_feasibility_lines(full_text: str, max_results: int = 25) -> List[Dict]:
    """Extract lines/sentences relevant to technical feasibility.

    The function searches for checklist keywords, budget mentions, and timeline/duration phrases.
    Returns list of {line_number, text, matched_topics, matched_keywords, match_count} sorted by match_count.
    """
    if not full_text:
        return []

    # Prepare sentence list
    sents = re.split(r'(?<=[.!?])\s+', full_text)
    if not sents or len(sents) < 2:
        sents = [ln.strip() for ln in full_text.splitlines() if ln.strip()]

    # aggregate keywords from CHECKLIST plus timeline and budget keywords
    topic_map = {}
    for item in CHECKLIST:
        for kw in item.get('keywords', []):
            topic_map[kw.lower()] = item['id']

    extra_kws = ['budget', 'cost', 'capital', 'manpower', 'fte', 'timeline', 'milestone', 'gantt', 'pilot', 'prototype', 'schedule', 'kpi', 'risk']
    for kw in extra_kws:
        topic_map.setdefault(kw.lower(), 'other')

    results = []
    for sent in sents:
        txt = sent.strip()
        if not txt or len(txt) < 20:
            continue
        low = txt.lower()
        matched_topics = set()
        matched_keywords = []
        for kw, topic in topic_map.items():
            if kw in low:
                matched_topics.add(topic)
                matched_keywords.append(kw)

        # Also check for explicit numeric durations or budget mentions
        if re.search(r'\b(\d+[\d,]*\.?\d*)\s*(years?|months?|weeks?|days?|lakh|lakhs|rs\b|inr)\b', low):
            matched_topics.add('timeline')
            matched_keywords.append('duration')
        if re.search(r'\b(\d+[\d,]*\.?\d*)\s*(rs\.?|inr|lakh|lakhs|crore|%)\b', low):
            matched_topics.add('budget')
            matched_keywords.append('amount')

        if matched_topics:
            # approximate line number
            line_number = None
            try:
                pos = full_text.find(txt)
                if pos >= 0:
                    line_number = full_text[:pos].count('\n') + 1
            except Exception:
                line_number = None

            results.append({
                'line_number': line_number,
                'text': txt[:400].strip(),
                'matched_topics': sorted(list(matched_topics)),
                'matched_keywords': sorted(list(set(matched_keywords))),
                'match_count': len(matched_keywords)
            })

    results = sorted(results, key=lambda x: x.get('match_count', 0), reverse=True)[:max_results]
    return results


def assess(paper_path: str, guidelines_path: str = None, horizon_months: int = 24) -> Dict:
    report = {'paper_path': paper_path, 'horizon_months': horizon_months}
    full_text = extract_text_from_path(paper_path)
    if not full_text or len(full_text.strip()) < 20:
        raise ValueError('Could not extract text from paper or paper too short')

    report['text_snippet'] = full_text[:400]

    # guidelines text (optional)
    if guidelines_path and os.path.exists(guidelines_path):
        try:
            guidelines_text = extract_text_from_path(guidelines_path)
            report['guidelines_snippet'] = guidelines_text[:400]
        except Exception:
            report['guidelines_snippet'] = ''
    else:
        report['guidelines_snippet'] = ''

    # checklist mapping
    checklist = match_checklist(full_text)
    report['checklist'] = checklist

    # durations
    durations = find_durations(full_text)
    decision, total_months, rationale = decide_within_months(durations, horizon_months=horizon_months)
    report['durations'] = durations
    report['timeline_decision'] = {'decision': decision, 'total_months': total_months, 'rationale': rationale}

    # budget
    budget = extract_budget_items(full_text)
    report['budget'] = budget

    # score
    score = heuristic_score_from_components(checklist, total_months, budget, horizon_months=horizon_months)
    report['score'] = score

    # feasibility decision mapping
    if decision == 'No':
        feasibility = 'Not Feasible within horizon; likely requires re-scoping or more resources.'
    elif decision == 'Yes' and score >= 60:
        feasibility = 'Feasible: project appears deliverable within horizon with minor clarifications.'
    elif decision == 'Yes' and score < 60:
        feasibility = 'Potentially Feasible but needs stronger budget/milestones/KPIs.'
    else:
        feasibility = 'Uncertain: insufficient information to determine feasibility.'
    report['feasibility'] = feasibility

    # recommended actions (simple synthesis)
    recs = []
    if any(c['status'] == 'Missing' for c in checklist):
        recs.append('Fill missing sections: objectives, deliverables, methodology, timeline, budget, KPIs as applicable.')
    if decision == 'No':
        recs.append('Re-scope the project or provide parallelisation/additional resources to meet horizon.')
    if budget.get('manpower', 0) == 0 and budget.get('capital_equipment', 0) == 0:
        recs.append('Provide a clear budget breakdown (manpower and capital equipment at minimum).')
    recs.append('Attach a Gantt chart with milestones and acceptance criteria for tranche-based funding.')
    report['recommendations'] = recs

    return report


# -- FastAPI route and response formatting -------------------------------------------------
router = APIRouter()


def _format_comment_and_recs(report: Dict) -> Tuple[str, List[str]]:
    checklist = report.get('checklist', [])
    # Base paragraph depending on feasibility
    feasibility = report.get('feasibility', '')
    if 'Feasible' in feasibility:
        para = (
            "Engineering plans and team experience indicate feasibility at pilot scale. "
            "Critical items include feedstock logistics, emissions control testing, and availability of pilot facilities for commissioning."
        )
    elif 'Not Feasible' in feasibility:
        para = (
            "The proposed timeline and resource plan indicate the project is unlikely to be completed within the requested horizon without scope reduction or additional resources. "
            "Consider re-scoping or adding manpower/equipment to reduce the critical path."
        )
    else:
        para = (
            "Unable to determine feasibility conclusively. The submission lacks clear milestones, budget breakdowns, or acceptance criteria. "
            "Provide a Gantt chart, detailed budget and KPIs to enable a definitive technical feasibility judgement."
        )

    # Recommended actions - generic set, refined by missing checklist items
    recs = [
        'Supply detailed feedstock supply agreements and contingency plans for variable feedstock quality.',
        'Include third-party testing schedules for emissions and demonstrate access to pilot facilities.',
        'Provide a commissioning plan with acceptance criteria and responsible parties for each milestone.'
    ]

    if any(c['id'] == 'budget' and c['status'] != 'Satisfied' for c in checklist):
        recs.insert(0, 'Provide a clear budget breakdown (manpower and capital equipment at minimum).')
    if any(c['id'] == 'timeline' and c['status'] != 'Satisfied' for c in checklist):
        recs.insert(0, 'Attach a Gantt chart with milestones and specific, testable acceptance criteria for each deliverable.')
    if any(c['id'] == 'kpi' and c['status'] != 'Satisfied' for c in checklist):
        recs.insert(0, 'Define measurable KPIs (e.g., pilot throughput, emissions targets, energy recovery rates) per milestone.')

    return para, recs


@router.post('/technical_feasibility')
async def technical_feasibility(file: UploadFile = File(...), horizon: int = 24):
    try:
        data = await file.read()
        filename = file.filename or 'upload'
        ext = (filename or '').lower().split('.')[-1]
        if ext == 'pdf':
            full_text = extract_text_from_pdf_bytes(data)
        elif ext in ('docx', 'doc'):
            full_text = extract_text_from_docx_bytes(data)
        else:
            enc = chardet.detect(data).get('encoding') or 'utf-8'
            try:
                full_text = data.decode(enc, errors='ignore')
            except Exception:
                full_text = ''

        if not full_text or len(full_text.strip()) < 50:
            raise HTTPException(status_code=400, detail='Could not extract meaningful text from uploaded file.')

        checklist = match_checklist(full_text)
        durations = find_durations(full_text)
        decision, total_months, rationale = decide_within_months(durations, horizon_months=horizon)
        budget = extract_budget_items(full_text)
        score = heuristic_score_from_components(checklist, total_months, budget, horizon_months=horizon)

        score_int = int(max(0, min(100, int(round(score)))))
        changeable = int(max(0, min(100, round((100 - score_int) * 0.8))))

        report = {
            'score': score_int,
            'checklist': checklist,
            'durations': durations,
            'budget': budget,
            'feasibility': decision,
        }
        comment_para, recommendations = _format_comment_and_recs(report)

        # extract lines relevant to feasibility (budget, timeline, methodology, KPIs)
        try:
            flagged_lines = extract_feasibility_lines(full_text, max_results=25)
        except Exception:
            flagged_lines = []

        header = f"Score: {score_int}/100    Changeable: {changeable}%"
        comment_text = f"{header}\n{comment_para}"

        return JSONResponse({
            'score': score_int,
            'changeable_percent': changeable,
            'feasibility_decision': decision,
            'comment': comment_text,
            'recommended_actions': recommendations,
            'flagged_lines': flagged_lines,
            'flagged_count': len(flagged_lines)
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Feasibility checker using S&T guidelines (MoC)')
    parser.add_argument('--paper', '-p', required=True, help='Path to the R&D paper (pdf/docx/txt)')
    parser.add_argument('--guidelines', '-g', required=False, help='Path to S&T guidelines PDF (optional)')
    parser.add_argument('--horizon', '-m', type=int, default=24, help='Horizon in months to check feasibility against')
    parser.add_argument('--out', '-o', required=False, help='Path to write JSON report (optional)')

    args = parser.parse_args()
    rpt = assess(args.paper, guidelines_path=args.guidelines, horizon_months=args.horizon)
    out = args.out or (os.path.splitext(args.paper)[0] + '.feasibility.json')
    with open(out, 'w', encoding='utf-8') as fh:
        json.dump(rpt, fh, indent=2)
    print('Feasibility report written to', out)


# ================================================================================
# TECHNICAL FEASIBILITY ASSESSMENT AGENT
# ================================================================================

def convert_json_to_text(data, parent_key: str = "", separator: str = "\n") -> str:
    """
    Recursively convert a JSON structure to plain text representation.
    
    Args:
        data: The JSON data structure (dict, list, or primitive)
        parent_key: Parent key for nested structures
        separator: String to separate key-value pairs
        
    Returns:
        Plain text representation of the JSON structure
    """
    text_parts = []
    
    if isinstance(data, dict):
        for key, value in data.items():
            full_key = f"{parent_key}.{key}" if parent_key else key
            if isinstance(value, (dict, list)):
                # Recursively process nested structures
                nested_text = convert_json_to_text(value, full_key, separator)
                if nested_text:
                    text_parts.append(f"{full_key}:")
                    text_parts.append(nested_text)
            else:
                # Handle primitive values
                if value is not None and str(value).strip():
                    text_parts.append(f"{full_key}: {value}")
    
    elif isinstance(data, list):
        for i, item in enumerate(data):
            item_key = f"{parent_key}[{i}]" if parent_key else f"item_{i}"
            if isinstance(item, (dict, list)):
                nested_text = convert_json_to_text(item, item_key, separator)
                if nested_text:
                    text_parts.append(f"{item_key}:")
                    text_parts.append(nested_text)
            else:
                if item is not None and str(item).strip():
                    text_parts.append(f"{item_key}: {item}")
    
    else:
        # Handle primitive types at root level
        if data is not None and str(data).strip():
            key = parent_key if parent_key else "value"
            text_parts.append(f"{key}: {data}")
    
    return separator.join(text_parts)


def build_summary_comment(feasibility: str, score: int) -> str:
    """
    Build a summary comment based on feasibility assessment and score.
    
    Args:
        feasibility: Feasibility decision string
        score: Numerical feasibility score (0-100)
        
    Returns:
        Formatted summary comment
    """
    header = f"Score: {score}/100"
    
    if "Feasible" in feasibility and "Not" not in feasibility:
        if score >= 70:
            para = (
                "Engineering plans and team experience indicate feasibility at pilot scale. "
                "Critical items include feedstock logistics, emissions control testing, and availability of pilot facilities for commissioning. "
                "The project demonstrates strong technical foundation with well-defined objectives and deliverables."
            )
        else:
            para = (
                "The project shows feasibility potential but requires strengthening in key areas. "
                "While the core concept is technically sound, additional detail is needed in "
                "budget planning, milestone definition, and risk mitigation strategies to ensure successful completion."
            )
    elif "Not Feasible" in feasibility:
        para = (
            "The proposed timeline and resource plan indicate the project is unlikely to be completed within the requested horizon without scope reduction or additional resources. "
            "Consider re-scoping or adding manpower/equipment to reduce the critical path. "
            "Technical challenges may require extended development phases or alternative approaches."
        )
    else:
        para = (
            "Unable to determine feasibility conclusively. The submission lacks clear milestones, budget breakdowns, or acceptance criteria. "
            "Provide a Gantt chart, detailed budget and KPIs to enable a definitive technical feasibility judgement. "
            "Additional documentation is required for comprehensive assessment."
        )
    
    return f"{header}\n{para}"


def analyze_pdf_proposal_feasibility(pdf_text: str) -> Dict:
    """
    Enhanced analysis of proposal feasibility from PDF content
    Returns detailed analysis with score prediction
    """
    import re
    
    # Extract key sections from the PDF
    issue_match = re.search(r'Definition of the issue.*?:(.+?)(?=\d+|$)', pdf_text, re.DOTALL)
    issue = issue_match.group(1).strip() if issue_match else ""
    
    methodology_match = re.search(r'Methodology.*?:(.+?)(?=\d+|$)', pdf_text, re.DOTALL)
    methodology = methodology_match.group(1).strip() if methodology_match else ""
    
    objectives_match = re.search(r'Objectives.*?:(.+?)(?=\d+|$)', pdf_text, re.DOTALL)
    objectives = objectives_match.group(1).strip() if objectives_match else ""
    
    work_plan_match = re.search(r'Work Plan.*?:(.+?)(?=\d+|$)', pdf_text, re.DOTALL)
    work_plan = work_plan_match.group(1).strip() if work_plan_match else ""
    
    # Check for placeholder text vs actual content
    placeholder_phrases = [
        "will come here", "comes here", "section", "beneficial",
        "chart will come here", "elements will come here", "title comes here"
    ]
    
    # Analyze completeness
    completeness_score = 0
    analysis = {
        "issue": issue,+
        "methodology": methodology,
        "objectives": objectives,
        "work_plan": work_plan,
        "issue_analysis": "",
        "methodology_analysis": "", 
        "feasibility_prediction": "",
        "score": 0,
        "recommendations": []
    }
    
    # Issue Analysis
    if any(phrase in issue.lower() for phrase in placeholder_phrases) or len(issue.strip()) < 10:
        analysis["issue_analysis"] = "Issue definition contains placeholder text or insufficient detail"
        completeness_score += 0
    else:
        analysis["issue_analysis"] = "Issue definition appears to contain actual content"
        completeness_score += 25
    
    # Methodology Analysis  
    if any(phrase in methodology.lower() for phrase in placeholder_phrases) or len(methodology.strip()) < 10:
        analysis["methodology_analysis"] = "Methodology contains placeholder text or insufficient detail"
        completeness_score += 0
    else:
        analysis["methodology_analysis"] = "Methodology appears to contain actual content"
        completeness_score += 25
        
    # Technical feasibility keywords
    technical_keywords = [
        "equipment", "technology", "software", "hardware", "infrastructure",
        "expertise", "skills", "resources", "timeline", "implementation",
        "testing", "validation", "deployment", "scalability", "algorithm",
        "analysis", "research", "development", "mining", "coal", "safety"
    ]
    
    methodology_keywords_found = [kw for kw in technical_keywords if kw in methodology.lower()]
    if methodology_keywords_found:
        completeness_score += 15
        analysis["methodology_analysis"] += f" (Found technical terms: {', '.join(methodology_keywords_found)})"
    
    # Budget analysis
    budget_pattern = r'(\d+)'
    budget_numbers = re.findall(budget_pattern, pdf_text)
    if len(budget_numbers) > 5:  # Multiple budget entries
        completeness_score += 20
        analysis["budget_analysis"] = f"Budget details provided with {len(budget_numbers)} cost items"
    else:
        analysis["budget_analysis"] = "Limited budget information available"
        completeness_score += 10
    
    # Timeline analysis
    timeline_keywords = ["year", "month", "schedule", "milestone", "chart", "phase"]
    timeline_found = any(kw in pdf_text.lower() for kw in timeline_keywords)
    if timeline_found:
        completeness_score += 15
        analysis["timeline_analysis"] = "Timeline/scheduling information present"
    else:
        analysis["timeline_analysis"] = "No clear timeline information found"
    
    # Final score calculation (0-100)
    final_score = min(100, completeness_score)
    analysis["score"] = final_score
    
    # Feasibility prediction based on score
    if final_score >= 80:
        analysis["feasibility_prediction"] = "Yes"
        analysis["feasibility_comment"] = "HIGH FEASIBILITY - Well-defined proposal with clear methodology and planning"
    elif final_score >= 60:
        analysis["feasibility_prediction"] = "Maybe"
        analysis["feasibility_comment"] = "MODERATE FEASIBILITY - Proposal has some structure but lacks detail in key areas"
    elif final_score >= 40:
        analysis["feasibility_prediction"] = "Maybe"
        analysis["feasibility_comment"] = "LOW FEASIBILITY - Proposal appears incomplete with placeholder content"
    else:
        analysis["feasibility_prediction"] = "No"
        analysis["feasibility_comment"] = "VERY LOW FEASIBILITY - Proposal is mostly placeholder text without concrete details"
    
    # Recommendations
    if final_score < 80:
        analysis["recommendations"] = [
            "Replace all placeholder text with actual content",
            "Provide detailed technical methodology",
            "Include specific timeline with milestones", 
            "Add comprehensive budget breakdown",
            "Define clear technical requirements and resources"
        ]
    
    return analysis


def build_recommended_actions(checklist: list, feasibility: str) -> list:
    """
    Build recommended actions based on checklist results and feasibility assessment.
    
    Args:
        checklist: List of checklist items with their status
        feasibility: Feasibility decision string
        
    Returns:
        List of recommended action strings
    """
    recommendations = []
    
    # Check for missing critical components
    missing_items = [item for item in checklist if item.get('status') == 'Missing']
    
    # Budget-related recommendations
    budget_item = next((item for item in checklist if item.get('id') == 'budget'), None)
    if budget_item and budget_item.get('status') != 'Satisfied':
        recommendations.append(
            'Provide a clear budget breakdown (manpower and capital equipment at minimum).'
        )
    
    # Timeline-related recommendations
    timeline_item = next((item for item in checklist if item.get('id') == 'timeline'), None)
    if timeline_item and timeline_item.get('status') != 'Satisfied':
        recommendations.append(
            'Attach a Gantt chart with milestones and specific, testable acceptance criteria for each deliverable.'
        )
    
    # KPI recommendations
    kpi_item = next((item for item in checklist if item.get('id') == 'kpi'), None)
    if kpi_item and kpi_item.get('status') != 'Satisfied':
        recommendations.append(
            'Define measurable KPIs (e.g., pilot throughput, emissions targets, energy recovery rates) per milestone.'
        )
    
    # Standard recommendations based on feasibility outcome
    if "Not Feasible" in feasibility:
        recommendations.append(
            'Re-scope the project or provide parallelisation/additional resources to meet horizon.'
        )
    
    # Generic recommendations from _format_comment_and_recs pattern
    recommendations.extend([
        'Supply detailed feedstock supply agreements and contingency plans for variable feedstock quality.',
        'Include third-party testing schedules for emissions and demonstrate access to pilot facilities.',
        'Provide a commissioning plan with acceptance criteria and responsible parties for each milestone.'
    ])
    
    # Fill missing sections recommendation
    if missing_items:
        missing_labels = [item.get('label', item.get('id', 'unknown')) for item in missing_items]
        recommendations.insert(0, 
            f'Fill missing sections: {", ".join(missing_labels[:5])}{"..." if len(missing_labels) > 5 else ""}.'
        )
    
    return recommendations


def evaluate_project_feasibility(proposal_json: dict) -> dict:
    """
    Evaluate technical feasibility of a project based on grant proposal JSON.
    
    This function converts structured JSON proposal data into plain text,
    then applies the complete feasibility analysis pipeline to generate 
    a comprehensive assessment report.
    
    Args:
        proposal_json: Dictionary containing structured grant proposal data
        
    Returns:
        Dictionary containing complete feasibility assessment with the structure:
        {
            "score": int (0-100),
            "timeline_decision": {
                "decision": str,
                "total_months": float,
                "rationale": str
            },
            "feasibility": str,
            "checklist": List[Dict],
            "budget": Dict,
            "durations": List[Tuple],
            "flagged_lines": List[Dict],
            "recommended_actions": List[str],
            "summary_comment": str
        }
    """
    try:
        # Step 1: Convert JSON to plain text representation
        full_text = convert_json_to_text(proposal_json)
        
        if not full_text or len(full_text.strip()) < 20:
            raise ValueError("Insufficient text content in proposal JSON")
        
        # Step 2: Apply feasibility analysis pipeline using existing functions
        
        # Checklist analysis
        checklist = match_checklist(full_text)
        
        # Duration and timeline analysis
        durations = find_durations(full_text)
        decision, total_months, rationale = decide_within_months(durations, 24)
        
        # Budget analysis
        budget = extract_budget_items(full_text)
        
        # Calculate overall score
        score = heuristic_score_from_components(checklist, total_months, budget)
        
        # Extract relevant lines for detailed analysis
        try:
            flagged_lines = extract_feasibility_lines(full_text)
        except Exception:
            flagged_lines = []
        
        # Step 3: Determine overall feasibility assessment (same logic as FastAPI route)
        if decision == 'No':
            feasibility = 'Not Feasible within horizon; likely requires re-scoping or more resources.'
        elif decision == 'Yes' and score >= 60:
            feasibility = 'Feasible: project appears deliverable within horizon with minor clarifications.'
        elif decision == 'Yes' and score < 60:
            feasibility = 'Potentially Feasible but needs stronger budget/milestones/KPIs.'
        else:
            feasibility = 'Uncertain: insufficient information to determine feasibility.'
        
        # Step 4: Generate recommendations and summary using helper functions
        recommended_actions = build_recommended_actions(checklist, feasibility)
        summary_comment = build_summary_comment(feasibility, score)
        
        # Step 5: Compile final assessment report in exact specified format
        assessment_result = {
            "score": score,
            "timeline_decision": {
                "decision": decision,
                "total_months": total_months,
                "rationale": rationale
            },
            "feasibility": feasibility,
            "checklist": checklist,
            "budget": budget,
            "durations": durations,
            "flagged_lines": flagged_lines,
            "recommended_actions": recommended_actions,
            "summary_comment": summary_comment
        }
        
        return assessment_result
        
    except Exception as e:
        # Return error state with diagnostic information
        return {
            "score": 0,
            "timeline_decision": {
                "decision": "Error",
                "total_months": 0.0,
                "rationale": f"Assessment failed: {str(e)}"
            },
            "feasibility": f"Assessment Error: {str(e)}",
            "checklist": [],
            "budget": {"manpower": 0.0, "capital_equipment": 0.0, "currency_unit": "unknown"},
            "durations": [],
            "flagged_lines": [],
            "recommended_actions": [
                "Fix proposal JSON structure and content",
                "Ensure all required fields are properly populated",
                "Validate JSON format and data types"
            ],
            "summary_comment": f"Technical feasibility assessment could not be completed due to: {str(e)}"
        }


def create_sample_proposal_json():
    """
    Create a sample proposal JSON for testing the agent.
    
    Returns:
        Dictionary containing sample proposal data
    """
    return {
        "basic_information": {
            "project_title": "Development of Advanced Coal Gasification Technology for Clean Energy Production",
            "organization": "Indian Institute of Technology Delhi",
            "principal_investigator": "Dr. Rajesh Kumar",
            "contact_email": "rajesh.kumar@iitd.ac.in"
        },
        "project_details": {
            "objectives": [
                "Develop novel coal gasification technology with improved efficiency",
                "Design and test pilot-scale gasification reactor",
                "Evaluate environmental impact and emission control",
                "Assess commercial viability and scalability"
            ],
            "methodology": {
                "approach": "Integrated gasification combined cycle with advanced emission control",
                "techniques": [
                    "High-temperature gasification with oxygen enrichment",
                    "Advanced syngas cleaning and conditioning"
                ],
                "innovation": "Novel catalyst system for improved carbon conversion efficiency"
            },
            "expected_outcomes": [
                "20% improvement in gasification efficiency",
                "90% reduction in particulate emissions",
                "Pilot plant demonstration with 100 kg/hr capacity"
            ],
            "deliverables": [
                "Detailed engineering design of gasification system",
                "Pilot plant construction and commissioning",
                "Performance testing and validation reports",
                "Environmental impact assessment"
            ]
        },
        "timeline": {
            "total_duration": "18 months",
            "phases": [
                {
                    "phase": "Design and Engineering",
                    "duration": "6 months", 
                    "milestones": ["Conceptual design completion", "Detailed engineering drawings"]
                },
                {
                    "phase": "Pilot Plant Construction", 
                    "duration": "8 months",
                    "milestones": ["Equipment procurement", "Installation and commissioning"]
                },
                {
                    "phase": "Testing and Validation",
                    "duration": "4 months",
                    "milestones": ["Performance testing", "Environmental testing"]
                }
            ],
            "key_milestones": [
                "Month 6: Design review and approval",
                "Month 14: Pilot plant commissioning",
                "Month 18: Project completion and final report"
            ]
        },
        "cost_breakdown": {
            "total_budget": "120 lakhs",
            "manpower": {
                "principal_investigator": "12 lakhs",
                "research_associates": "24 lakhs", 
                "technical_staff": "18 lakhs",
                "total": "54 lakhs"
            },
            "capital_equipment": {
                "gasification_reactor": "35 lakhs",
                "gas_analysis_equipment": "15 lakhs",
                "control_systems": "10 lakhs",
                "total": "60 lakhs"
            },
            "operational": {
                "consumables": "4 lakhs",
                "utilities": "2 lakhs",
                "total": "6 lakhs"
            },
            "currency_unit": "INR lakhs"
        },
        "risk_assessment": {
            "technical_risks": [
                "Catalyst deactivation under high-ash conditions",
                "Reactor refractory degradation"
            ],
            "mitigation_strategies": [
                "Parallel development of multiple catalyst formulations",
                "Early procurement of long-lead items"
            ]
        },
        "environmental_compliance": {
            "clearances_required": ["State Pollution Control Board"],
            "emission_monitoring": "Continuous monitoring of CO, CO2, NOx, SOx, particulates"
        }
    }


# Example usage and test function
def test_feasibility_agent():
    """Test the feasibility agent with sample data."""
    print("Testing Technical Feasibility Assessment Agent")
    print("=" * 50)
    
    # Create sample proposal
    sample_proposal = create_sample_proposal_json()
    
    # Run assessment
    result = evaluate_project_feasibility(sample_proposal)
    
    # Print formatted results
    print(f"Assessment Score: {result['score']}/100")
    print(f"Feasibility: {result['feasibility']}")
    print(f"Timeline Decision: {result['timeline_decision']['decision']}")
    print(f"Total Duration: {result['timeline_decision']['total_months']} months")
    print(f"Budget Summary: Manpower={result['budget']['manpower']}, Equipment={result['budget']['capital_equipment']}")
    print(f"Recommendations: {len(result['recommended_actions'])} actions")
    print(f"Flagged Lines: {len(result['flagged_lines'])} relevant segments")
    
    return result
