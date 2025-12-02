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


@router.post('/evaluate_json_proposal')
async def evaluate_json_proposal_route(proposal_data: dict, horizon: int = 24):
    """
    Evaluate technical feasibility from JSON proposal data.
    
    Args:
        proposal_data: Dictionary containing structured grant proposal data
        horizon: Timeline horizon in months (default: 24)
    
    Returns:
        JSONResponse with feasibility assessment
    """
    try:
        # Convert the proposal JSON to assessment format
        result = evaluate_project_feasibility(proposal_data)
        
        # Format the response to match the expected structure
        response_data = {
            "assessment_score": f"{result['score']}/100",
            "feasibility": result['feasibility'], 
            "timeline_decision": result['timeline_decision']['decision'],
            "total_duration_months": result['timeline_decision']['total_months'],
            "budget_summary": {
                "manpower": result['budget']['manpower'],
                "equipment": result['budget']['capital_equipment'],
                "currency": result['budget'].get('currency_unit', 'unknown')
            },
            "recommendations_count": len(result['recommended_actions']),
            "flagged_lines_count": len(result['flagged_lines']),
            "detailed_results": {
                "score": result['score'],
                "timeline_decision": result['timeline_decision'],
                "feasibility_assessment": result['feasibility'],
                "checklist": result['checklist'],
                "budget": result['budget'],
                "durations": result['durations'],
                "flagged_lines": result['flagged_lines'],
                "recommended_actions": result['recommended_actions'],
                "summary_comment": result['summary_comment']
            }
        }
        
        return JSONResponse(content=response_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assessment failed: {str(e)}")


@router.post('/feasibility_json_output')
async def feasibility_json_output(file: UploadFile = File(...), horizon: int = 24):
    """
    Evaluate technical feasibility and return structured JSON output.
    
    Args:
        file: Uploaded proposal file (PDF, DOCX, or TXT)
        horizon: Timeline horizon in months (default: 24)
    
    Returns:
        JSONResponse with structured feasibility assessment
    """
    try:
        # Extract text from uploaded file
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

        # Perform feasibility analysis
        checklist = match_checklist(full_text)
        durations = find_durations(full_text)
        decision, total_months, rationale = decide_within_months(durations, horizon_months=horizon)
        budget = extract_budget_items(full_text)
        score = heuristic_score_from_components(checklist, total_months, budget, horizon_months=horizon)

        # Determine feasibility assessment
        if decision == 'No':
            feasibility = 'Not Feasible within horizon; likely requires re-scoping or more resources.'
        elif decision == 'Yes' and score >= 60:
            feasibility = 'Feasible: project appears deliverable within horizon with minor clarifications.'
        elif decision == 'Yes' and score < 60:
            feasibility = 'Potentially Feasible but needs stronger budget/milestones/KPIs.'
        else:
            feasibility = 'Uncertain: insufficient information to determine feasibility.'

        # Extract relevant lines for detailed analysis
        try:
            flagged_lines = extract_feasibility_lines(full_text, max_results=25)
        except Exception:
            flagged_lines = []

        # Generate recommendations
        recommended_actions = build_recommended_actions(checklist, feasibility)
        summary_comment = build_summary_comment(feasibility, score)

        # Create structured result
        result = {
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

        # Format JSON response
        json_output = {
            "assessment_score": f"{result['score']}/100",
            "feasibility": result['feasibility'],
            "timeline_decision": result['timeline_decision']['decision'],
            "total_duration_months": result['timeline_decision']['total_months'],
            "budget_summary": {
                "manpower": result['budget']['manpower'],
                "equipment": result['budget']['capital_equipment'],
                "currency": result['budget'].get('currency_unit', 'unknown')
            },
            "recommendations_count": len(result['recommended_actions']),
            "flagged_lines_count": len(result['flagged_lines']),
            "detailed_results": {
                "score": result['score'],
                "timeline_decision": result['timeline_decision'],
                "feasibility_assessment": result['feasibility'],
                "checklist": result['checklist'],
                "budget": result['budget'],
                "durations": result['durations'],
                "flagged_lines": result['flagged_lines'],
                "recommended_actions": result['recommended_actions'],
                "summary_comment": result['summary_comment']
            }
        }

        return JSONResponse(content=json_output)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assessment failed: {str(e)}")


@router.get('/test_sample_json')
async def test_sample_json():
    """
    Test endpoint that returns JSON output for a sample proposal.
    
    Returns:
        JSONResponse with sample feasibility assessment
    """
    try:
        # Create sample proposal
        sample_proposal = create_sample_proposal_json()
        
        # Run assessment
        result = evaluate_project_feasibility(sample_proposal)
        
        # Format JSON response (same as test_feasibility_agent function)
        json_output = {
            "assessment_score": f"{result['score']}/100",
            "feasibility": result['feasibility'],
            "timeline_decision": result['timeline_decision']['decision'],
            "total_duration_months": result['timeline_decision']['total_months'],
            "budget_summary": {
                "manpower": result['budget']['manpower'],
                "equipment": result['budget']['capital_equipment'],
                "currency": result['budget'].get('currency_unit', 'unknown')
            },
            "recommendations_count": len(result['recommended_actions']),
            "flagged_lines_count": len(result['flagged_lines']),
            "detailed_results": {
                "score": result['score'],
                "timeline_decision": result['timeline_decision'],
                "feasibility_assessment": result['feasibility'],
                "checklist": result['checklist'],
                "budget": result['budget'],
                "durations": result['durations'],
                "flagged_lines": result['flagged_lines'],
                "recommended_actions": result['recommended_actions'],
                "summary_comment": result['summary_comment']
            }
        }
        
        return JSONResponse(content=json_output)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test assessment failed: {str(e)}")


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


@router.post('/technical_feasibility_enhanced')
async def technical_feasibility_enhanced(file: UploadFile = File(...)):
    """
    Enhanced technical feasibility analysis endpoint that provides detailed product availability,
    cost analysis, and technical assessment for coal industry projects
    """
    try:
        # Read the uploaded PDF file
        pdf_content = await file.read()
        
        # Extract text from PDF
        from io import BytesIO
        import PyPDF2
        
        pdf_reader = PyPDF2.PdfReader(BytesIO(pdf_content))
        pdf_text = ""
        for page in pdf_reader.pages:
            pdf_text += page.extract_text() + "\\n"
        
        # Perform enhanced feasibility analysis
        analysis_result = analyze_pdf_proposal_feasibility(pdf_text)
        
        # Structure the comprehensive response
        enhanced_response = {
            "assessment_score": analysis_result["score"],
            "feasibility_decision": analysis_result["feasibility_prediction"],
            "feasibility_comment": analysis_result.get("feasibility_comment", ""),
            "technical_assessment": analysis_result["technical_assessment"],
            
            "product_availability": {
                "equipment_found": analysis_result["product_availability"]["total_equipment_found"],
                "equipment_feasibility_score": analysis_result["product_availability"]["feasibility_score"],
                "equipment_details": analysis_result["product_availability"]["equipment_assessment"],
                "equipment_list": analysis_result["product_availability"]["equipment_list"]
            },
            
            "cost_analysis": {
                "total_estimated_budget_lakhs": analysis_result["cost_analysis"]["total_estimated_budget"],
                "budget_quality_score": analysis_result["cost_analysis"]["budget_score"],
                "budget_breakdown": analysis_result["cost_analysis"]["budget_categories"],
                "budget_quality_assessment": analysis_result["cost_analysis"]["budget_breakdown_quality"],
                "cost_reasonableness": analysis_result["cost_analysis"]["cost_reasonableness"]
            },
            
            "content_analysis": {
                "issue_definition": analysis_result["issue"],
                "methodology": analysis_result["methodology"], 
                "objectives": analysis_result["objectives"],
                "work_plan": analysis_result["work_plan"]
            },
            
            "recommendations": analysis_result["recommendations"],
            "refinements": analysis_result["refinements"],
            
            "summary": {
                "is_technically_feasible": analysis_result["score"] >= 60,
                "main_concerns": [],
                "next_steps": analysis_result["recommendations"][:3] if analysis_result["recommendations"] else [],
                "confidence_level": "High" if analysis_result["score"] >= 80 else "Medium" if analysis_result["score"] >= 60 else "Low"
            }
        }
        
        # Add main concerns based on analysis
        if analysis_result["product_availability"]["feasibility_score"] < 20:
            enhanced_response["summary"]["main_concerns"].append("Equipment availability and specifications need verification")
        
        if analysis_result["cost_analysis"]["budget_score"] < 15:
            enhanced_response["summary"]["main_concerns"].append("Budget breakdown is insufficient and needs detailed cost analysis")
        
        if analysis_result["score"] < 40:
            enhanced_response["summary"]["main_concerns"].append("Project content appears to be mostly placeholder text")
        
        # Add metadata
        enhanced_response["metadata"] = {
            "analysis_timestamp": "2024-12-01",
            "analyzer_version": "v2.0_enhanced",
            "file_processed": file.filename,
            "score_breakdown": {
                "content_completeness_max": 40,
                "equipment_feasibility_max": 30,
                "budget_quality_max": 35,
                "total_max": 100
            }
        }
        
        return JSONResponse(enhanced_response)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")



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


def analyze_equipment_feasibility(pdf_text: str) -> Dict:
    """
    Analyze equipment and technology feasibility from PDF text.
    
    Args:
        pdf_text: Raw text extracted from PDF
        
    Returns:
        Dictionary with equipment analysis results
    """
    import re
    
    # Extract equipment mentions
    equipment_patterns = [
        r'equipment[^.]*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        r'machine[^.]*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        r'instrument[^.]*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        r'technology[^.]*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'
    ]
    
    equipment_list = []
    for pattern in equipment_patterns:
        matches = re.findall(pattern, pdf_text, re.IGNORECASE)
        equipment_list.extend(matches)
    
    # Common mining and coal industry equipment database
    available_equipment = {
        "conveyor systems": {"available": True, "cost_range": "5-50 lakhs", "suppliers": ["L&T", "BEML"]},
        "crushing equipment": {"available": True, "cost_range": "10-100 lakhs", "suppliers": ["Metso", "Sandvik"]},
        "screening equipment": {"available": True, "cost_range": "5-25 lakhs", "suppliers": ["Terex", "McCloskey"]},
        "washing plants": {"available": True, "cost_range": "50-500 lakhs", "suppliers": ["CDE", "McLanahan"]},
        "dust suppression": {"available": True, "cost_range": "2-20 lakhs", "suppliers": ["Belterra", "Dustex"]},
        "safety equipment": {"available": True, "cost_range": "1-10 lakhs", "suppliers": ["3M", "Honeywell"]},
        "monitoring systems": {"available": True, "cost_range": "10-50 lakhs", "suppliers": ["Siemens", "ABB"]},
        "automation systems": {"available": True, "cost_range": "25-200 lakhs", "suppliers": ["Rockwell", "Schneider"]}
    }
    
    # Check availability of mentioned equipment
    equipment_assessment = {}
    feasibility_score = 0
    
    for equipment in equipment_list[:5]:  # Limit to first 5 for analysis
        equipment_lower = equipment.lower()
        found_match = False
        
        for available_eq, details in available_equipment.items():
            if any(word in equipment_lower for word in available_eq.split()):
                equipment_assessment[equipment] = {
                    "available": True,
                    "category": available_eq,
                    "estimated_cost": details["cost_range"],
                    "suppliers": details["suppliers"],
                    "feasibility": "High"
                }
                feasibility_score += 15
                found_match = True
                break
        
        if not found_match:
            equipment_assessment[equipment] = {
                "available": "Unknown",
                "category": "Custom/Specialized",
                "estimated_cost": "Requires quotation",
                "suppliers": ["Custom manufacturers"],
                "feasibility": "Requires investigation"
            }
            feasibility_score += 5
    
    return {
        "equipment_list": equipment_list[:5],
        "equipment_assessment": equipment_assessment,
        "feasibility_score": min(feasibility_score, 30),
        "total_equipment_found": len(equipment_list)
    }


def analyze_budget_feasibility(pdf_text: str) -> Dict:
    """
    Analyze budget feasibility and cost structure from PDF text.
    
    Args:
        pdf_text: Raw text extracted from PDF
        
    Returns:
        Dictionary with budget analysis results
    """
    import re
    
    # Extract budget numbers and categories
    budget_patterns = [
        r'(\d+(?:\.\d+)?)\s*(?:lakhs?|crores?)',
        r'Rs\.?\s*(\d+(?:,\d+)*(?:\.\d+)?)',
        r'Cost[^:]*:\s*(\d+(?:\.\d+)?)',
        r'Amount[^:]*:\s*(\d+(?:\.\d+)?)'
    ]
    
    budget_amounts = []
    for pattern in budget_patterns:
        matches = re.findall(pattern, pdf_text, re.IGNORECASE)
        budget_amounts.extend([float(m.replace(',', '')) for m in matches])
    
    # Extract budget categories
    capital_expenditure = re.findall(r'Capital.*?(\d+(?:\.\d+)?)', pdf_text, re.IGNORECASE)
    revenue_expenditure = re.findall(r'Revenue.*?(\d+(?:\.\d+)?)', pdf_text, re.IGNORECASE)
    equipment_cost = re.findall(r'Equipment.*?(\d+(?:\.\d+)?)', pdf_text, re.IGNORECASE)
    
    total_budget = sum(budget_amounts) if budget_amounts else 0
    
    # Budget feasibility assessment
    budget_score = 0
    budget_analysis = {
        "total_estimated_budget": total_budget,
        "budget_categories": {
            "capital_expenditure": sum([float(x) for x in capital_expenditure]) if capital_expenditure else 0,
            "revenue_expenditure": sum([float(x) for x in revenue_expenditure]) if revenue_expenditure else 0,
            "equipment_cost": sum([float(x) for x in equipment_cost]) if equipment_cost else 0
        },
        "budget_breakdown_quality": "",
        "cost_reasonableness": "",
        "budget_score": 0
    }
    
    # Score budget completeness
    if total_budget > 0:
        budget_score += 15
        if len(budget_amounts) >= 5:  # Multiple budget items
            budget_score += 10
            budget_analysis["budget_breakdown_quality"] = "Good - Multiple cost items identified"
        else:
            budget_analysis["budget_breakdown_quality"] = "Limited - Few cost items identified"
    else:
        budget_analysis["budget_breakdown_quality"] = "Poor - No clear budget information"
    
    # Assess cost reasonableness for coal industry projects
    if total_budget > 0:
        if total_budget < 10:  # Less than 10 lakhs
            budget_analysis["cost_reasonableness"] = "Very low - May be insufficient for meaningful coal industry project"
            budget_score += 5
        elif total_budget < 100:  # 10-100 lakhs
            budget_analysis["cost_reasonableness"] = "Reasonable - Suitable for pilot/small-scale projects"
            budget_score += 15
        elif total_budget < 500:  # 100-500 lakhs
            budget_analysis["cost_reasonableness"] = "Good - Appropriate for medium-scale coal industry projects"
            budget_score += 20
        else:  # > 500 lakhs
            budget_analysis["cost_reasonableness"] = "High - Major project scale, requires detailed justification"
            budget_score += 10
    
    budget_analysis["budget_score"] = budget_score
    
    return budget_analysis


def analyze_content_completeness(issue: str, methodology: str, objectives: str, work_plan: str, placeholder_phrases: list) -> int:
    """
    Analyze content completeness and quality.
    
    Returns:
        Content completeness score (0-40)
    """
    score = 0
    
    # Issue Analysis (0-10 points)
    if any(phrase in issue.lower() for phrase in placeholder_phrases) or len(issue.strip()) < 10:
        score += 0  # Placeholder or insufficient content
    else:
        score += 10  # Actual content
        
    # Methodology Analysis (0-15 points)
    if any(phrase in methodology.lower() for phrase in placeholder_phrases) or len(methodology.strip()) < 10:
        score += 0  # Placeholder content
    else:
        score += 10  # Has content
        
        # Check for technical keywords in methodology
        technical_keywords = [
            "equipment", "technology", "software", "hardware", "infrastructure",
            "algorithm", "analysis", "research", "development", "mining", "coal", "safety"
        ]
        
        methodology_keywords_found = [kw for kw in technical_keywords if kw in methodology.lower()]
        if methodology_keywords_found:
            score += 5  # Additional points for technical terms
    
    # Objectives Analysis (0-10 points)
    if any(phrase in objectives.lower() for phrase in placeholder_phrases) or len(objectives.strip()) < 10:
        score += 0
    else:
        score += 10
        
    # Work Plan Analysis (0-5 points)
    if any(phrase in work_plan.lower() for phrase in placeholder_phrases) or len(work_plan.strip()) < 10:
        score += 0
    else:
        score += 5
        
    return score


def determine_enhanced_feasibility(score: int, equipment_analysis: Dict, budget_analysis: Dict) -> Dict:
    """
    Determine enhanced feasibility based on multiple factors.
    
    Returns:
        Dictionary with prediction and detailed comment
    """
    equipment_feasibility = equipment_analysis.get("feasibility_score", 0)
    budget_quality = budget_analysis.get("budget_score", 0)
    
    # Enhanced decision logic
    if score >= 80 and equipment_feasibility >= 20 and budget_quality >= 15:
        return {
            "prediction": "Technically Feasible",
            "comment": f"HIGH FEASIBILITY (Score: {score}/100) - Well-defined proposal with available technology and realistic budget"
        }
    elif score >= 60 and equipment_feasibility >= 15:
        return {
            "prediction": "Feasible with Modifications",
            "comment": f"MODERATE FEASIBILITY (Score: {score}/100) - Good foundation but needs refinement in budget or technical details"
        }
    elif score >= 40:
        return {
            "prediction": "Potentially Feasible",
            "comment": f"LOW FEASIBILITY (Score: {score}/100) - Basic concept present but requires significant development"
        }
    else:
        return {
            "prediction": "Not Technically Feasible",
            "comment": f"VERY LOW FEASIBILITY (Score: {score}/100) - Insufficient technical detail and planning"
        }


def generate_specific_recommendations(equipment_analysis: Dict, budget_analysis: Dict, content_score: int, total_score: int) -> list:
    """
    Generate specific recommendations based on analysis results.
    """
    recommendations = []
    
    # Equipment-based recommendations
    equipment_score = equipment_analysis.get("feasibility_score", 0)
    if equipment_score < 20:
        recommendations.append(
            "Specify detailed equipment requirements with technical specifications and justify their necessity for the project"
        )
        
    # Budget-based recommendations
    budget_score = budget_analysis.get("budget_score", 0)
    if budget_score < 15:
        recommendations.append(
            "Provide detailed budget breakdown with itemized costs for equipment, manpower, and operational expenses"
        )
        
    budget_total = budget_analysis.get("total_estimated_budget", 0)
    if budget_total > 0:
        recommendations.append(
            f"Current budget estimate: ₹{budget_total} lakhs - Verify cost accuracy with current market rates"
        )
        
    # Content-based recommendations
    if content_score < 30:
        recommendations.append(
            "Replace placeholder text with actual project content and technical details"
        )
        
    # Score-based recommendations
    if total_score < 60:
        recommendations.extend([
            "Conduct detailed technical feasibility study with expert consultation",
            "Develop comprehensive project timeline with measurable milestones",
            "Include risk assessment and mitigation strategies"
        ])
        
    return recommendations


def generate_refinement_suggestions(equipment_analysis: Dict, budget_analysis: Dict) -> list:
    """
    Generate specific refinement suggestions for improvement.
    """
    refinements = []
    
    # Equipment refinements
    equipment_assessment = equipment_analysis.get("equipment_assessment", {})
    for equipment, details in equipment_assessment.items():
        if details.get("available") == "Unknown":
            refinements.append(
                f"Research suppliers and availability for {equipment} - consider alternatives if not readily available"
            )
        elif details.get("available"):
            refinements.append(
                f"{equipment}: Available from {', '.join(details.get('suppliers', []))} - estimated cost {details.get('estimated_cost', 'TBD')}"
            )
            
    # Budget refinements
    total_budget = budget_analysis.get("total_estimated_budget", 0)
    if total_budget > 0:
        if total_budget < 50:
            refinements.append(
                "Consider if budget is sufficient for meaningful impact in coal industry - may need to scale up or focus scope"
            )
        elif total_budget > 200:
            refinements.append(
                "Large budget project - ensure proper justification and phase-wise implementation plan"
            )
            
    return refinements


def generate_technical_assessment(equipment_analysis: Dict, budget_analysis: Dict, content_score: int) -> str:
    """
    Generate comprehensive technical assessment based on analysis results.
    """
    assessment_parts = []
    
    # Equipment assessment
    equipment_score = equipment_analysis.get("feasibility_score", 0)
    equipment_found = equipment_analysis.get("total_equipment_found", 0)
    
    if equipment_found > 0:
        assessment_parts.append(f"Equipment Analysis: {equipment_found} equipment types identified with feasibility score {equipment_score}/30")
        
        equipment_assessment = equipment_analysis.get("equipment_assessment", {})
        available_count = sum(1 for details in equipment_assessment.values() if details.get("available") == True)
        
        if available_count > 0:
            assessment_parts.append(f"✓ {available_count} equipment types are readily available in the market")
        
        unknown_count = sum(1 for details in equipment_assessment.values() if details.get("available") == "Unknown")
        if unknown_count > 0:
            assessment_parts.append(f"⚠ {unknown_count} equipment types require further investigation for availability")
    else:
        assessment_parts.append("Equipment Analysis: No specific equipment mentioned - requires detailed technical specifications")
    
    # Budget assessment
    budget_score = budget_analysis.get("budget_score", 0)
    total_budget = budget_analysis.get("total_estimated_budget", 0)
    
    if total_budget > 0:
        assessment_parts.append(f"Budget Analysis: ₹{total_budget} lakhs estimated with quality score {budget_score}/35")
        assessment_parts.append(f"Cost Reasonableness: {budget_analysis.get('cost_reasonableness', 'Not assessed')}")
    else:
        assessment_parts.append("Budget Analysis: No clear budget information provided - requires comprehensive cost breakdown")
    
    # Content quality assessment
    if content_score >= 30:
        assessment_parts.append("Content Quality: Good - Contains substantial project details")
    elif content_score >= 15:
        assessment_parts.append("Content Quality: Fair - Some details provided but needs improvement")
    else:
        assessment_parts.append("Content Quality: Poor - Mostly placeholder text, needs actual project content")
    
    return " | ".join(assessment_parts)


def analyze_pdf_proposal_feasibility(pdf_text: str) -> Dict:
    """
    Enhanced analysis of proposal feasibility from PDF content with detailed technical assessment
    Returns comprehensive analysis with product availability, cost analysis, and refinements
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
    
    # Enhanced analysis structure
    analysis = {
        "issue": issue,
        "methodology": methodology,
        "objectives": objectives,
        "work_plan": work_plan,
        "technical_assessment": "",
        "product_availability": {},
        "cost_analysis": {},
        "feasibility_prediction": "",
        "score": 0,
        "recommendations": [],
        "refinements": []
    }
    
    # Extract equipment and technology mentions
    equipment_analysis = analyze_equipment_feasibility(pdf_text)
    analysis["product_availability"] = equipment_analysis
    
    # Extract and analyze budget components
    budget_analysis = analyze_budget_feasibility(pdf_text)
    analysis["cost_analysis"] = budget_analysis
    
    # Check for placeholder text vs actual content
    placeholder_phrases = [
        "will come here", "comes here", "section", "beneficial",
        "chart will come here", "elements will come here", "title comes here"
    ]
    
    # Calculate technical feasibility score
    completeness_score = 0
    
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
    """Test the feasibility agent with sample data and return JSON output."""
    # Create sample proposal
    sample_proposal = create_sample_proposal_json()
    
    # Run assessment
    result = evaluate_project_feasibility(sample_proposal)
    
    # Format results as JSON
    json_output = {
        "assessment_score": f"{result['score']}/100",
        "feasibility": result['feasibility'],
        "timeline_decision": result['timeline_decision']['decision'],
        "total_duration_months": result['timeline_decision']['total_months'],
        "budget_summary": {
            "manpower": result['budget']['manpower'],
            "equipment": result['budget']['capital_equipment'],
            "currency": result['budget'].get('currency_unit', 'unknown')
        },
        "recommendations_count": len(result['recommended_actions']),
        "flagged_lines_count": len(result['flagged_lines']),
        "detailed_results": {
            "score": result['score'],
            "timeline_decision": result['timeline_decision'],
            "feasibility_assessment": result['feasibility'],
            "checklist": result['checklist'],
            "budget": result['budget'],
            "durations": result['durations'],
            "flagged_lines": result['flagged_lines'],
            "recommended_actions": result['recommended_actions'],
            "summary_comment": result['summary_comment']
        }
    }
    
    # Print JSON output
    print(json.dumps(json_output, indent=2, ensure_ascii=False))
    
    return json_output


# FastAPI application setup for standalone running
def create_app():
    """Create FastAPI application with all routes."""
    from fastapi import FastAPI
    app = FastAPI(
        title="Technical Feasibility Assessment API",
        description="API for assessing technical feasibility of research proposals",
        version="1.0.0"
    )
    app.include_router(router, prefix="/api/v1")
    return app


# Main execution
if __name__ == '__main__':
    import argparse
    import uvicorn

    parser = argparse.ArgumentParser(description='Technical Feasibility Assessment Tool')
    parser.add_argument('--mode', choices=['test', 'server', 'assess'], default='test',help='Mode: test (run sample), server (start API), assess (analyze file)')
    parser.add_argument('--paper', '-p', help='Path to the R&D paper (pdf/docx/txt)')
    parser.add_argument('--guidelines', '-g', help='Path to S&T guidelines PDF (optional)')
    parser.add_argument('--horizon', '-m', type=int, default=24, help='Horizon in months')
    parser.add_argument('--out', '-o', help='Path to write JSON report (optional)')
    parser.add_argument('--host', default='localhost', help='Server host (default: localhost)')
    parser.add_argument('--port', type=int, default=8000, help='Server port (default: 8000)')

    args = parser.parse_args()
    
    if args.mode == 'test':
        # Run test with JSON output
        print("Testing Technical Feasibility Assessment Agent")
        print("=" * 50)
        test_feasibility_agent()
        
    elif args.mode == 'server':
        # Start FastAPI server
        app = create_app()
        print(f"Starting server at http://{args.host}:{args.port}")
        print("Available routes:")
        print("  POST /api/v1/technical_feasibility - Upload file for assessment")
        print("  POST /api/v1/evaluate_json_proposal - Submit JSON proposal for assessment")
        print("  GET /docs - Interactive API documentation")
        uvicorn.run(app, host=args.host, port=args.port)
        
    elif args.mode == 'assess':
        # Assess a specific file
        if not args.paper:
            print("Error: --paper argument required for assess mode")
            exit(1)
            
        try:
            rpt = assess(args.paper, guidelines_path=args.guidelines, horizon_months=args.horizon)
            
            # Convert to JSON output format
            json_output = {
                "assessment_score": f"{rpt['score']}/100",
                "feasibility": rpt['feasibility'],
                "timeline_decision": rpt['timeline_decision']['decision'],
                "total_duration_months": rpt['timeline_decision']['total_months'],
                "budget_summary": {
                    "manpower": rpt['budget']['manpower'],
                    "equipment": rpt['budget']['capital_equipment'],
                    "currency": rpt['budget'].get('currency_unit', 'unknown')
                },
                "recommendations_count": len(rpt.get('recommendations', [])),
                "detailed_results": rpt
            }
            
            # Output JSON
            out_file = args.out or (os.path.splitext(args.paper)[0] + '.feasibility.json')
            with open(out_file, 'w', encoding='utf-8') as fh:
                json.dump(json_output, fh, indent=2, ensure_ascii=False)
            
            print(json.dumps(json_output, indent=2, ensure_ascii=False))
            print(f"\nFeasibility report written to: {out_file}")
            
        except Exception as e:
            print(f"Error: {e}")
            exit(1)
