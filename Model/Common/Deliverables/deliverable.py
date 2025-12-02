import re
from io import BytesIO
from datetime import datetime
from typing import List, Tuple, Dict, Optional, Any
import os
import json

import chardet
import PyPDF2
import docx
from fastapi import APIRouter, UploadFile, File, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

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


class DeliverableFeasibilityAgent:
    """
    AI Agent for evaluating project deliverable feasibility.
    
    This agent follows a multi-step reasoning workflow:
    1. Extract text from document
    2. Parse durations and convert to months
    3. Extract budget information
    4. Evaluate feasibility against time horizon
    5. Integrate Gemini AI assessment if available
    6. Generate structured response with scoring and recommendations
    """
    
    def __init__(self, horizon_months: float = 24.0):
        """
        Initialize the agent with a time horizon for feasibility evaluation.
        
        Args:
            horizon_months: Maximum acceptable project duration in months
        """
        self.horizon_months = horizon_months
        self._unit_map = {
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
    
    def extract_text(self, filename: str, file_bytes: bytes) -> str:
        """
        Extract text content from various file formats.
        
        Args:
            filename: Name of the file
            file_bytes: Raw file data
            
        Returns:
            Extracted text content
        """
        ext = (filename or "").lower().split(".")[-1]
        if ext == "pdf":
            return self._extract_text_from_pdf(file_bytes)
        elif ext == "docx":
            return self._extract_text_from_docx(file_bytes)
        elif ext in ("txt", "csv"):
            return self._extract_text_from_text(file_bytes)
        elif ext == "json":
            return self._extract_text_from_json(file_bytes)
        return ""
    
    def _extract_text_from_json(self, file_bytes: bytes) -> str:
        """Extract text from JSON files containing FORM-I data."""
        try:
            json_data = json.loads(file_bytes.decode('utf-8'))
            return self._convert_json_to_text(json_data)
        except Exception:
            return ""
    
    def _convert_json_to_text(self, data: Dict[str, Any]) -> str:
        """Convert FORM-I JSON structure to text for analysis."""
        text_parts = []
        
        # Basic information
        basic_info = data.get("basic_information", {})
        if basic_info.get("project_title"):
            text_parts.append(f"Project Title: {basic_info['project_title']}")
        if basic_info.get("project_duration"):
            text_parts.append(f"Project Duration: {basic_info['project_duration']}")
        
        # Project details
        project_details = data.get("project_details", {})
        for key, value in project_details.items():
            if value:
                formatted_key = key.replace("_", " ").title()
                text_parts.append(f"{formatted_key}: {value}")
        
        # Cost breakdown analysis
        cost_breakdown = data.get("cost_breakdown", {})
        if cost_breakdown:
            text_parts.append("Cost Breakdown Analysis:")
            text_parts.extend(self._extract_cost_text(cost_breakdown))
        
        return "\n".join(text_parts)
    
    def _extract_cost_text(self, cost_breakdown: Dict[str, Any]) -> List[str]:
        """Extract cost information as text for duration analysis."""
        cost_text = []
        
        # Capital expenditure
        cap_exp = cost_breakdown.get("capital_expenditure", {})
        if cap_exp:
            for category, details in cap_exp.items():
                if isinstance(details, dict):
                    category_name = category.replace("_", " ").title()
                    years = [k for k in details.keys() if k.startswith("year")]
                    if years:
                        cost_text.append(f"{category_name} expenses planned over {len(years)} years")
        
        # Revenue expenditure
        rev_exp = cost_breakdown.get("revenue_expenditure", {})
        if rev_exp:
            for category, details in rev_exp.items():
                if isinstance(details, dict):
                    category_name = category.replace("_", " ").title()
                    years = [k for k in details.keys() if k.startswith("year")]
                    if years:
                        cost_text.append(f"{category_name} expenses planned over {len(years)} years")
        
        # Total project cost
        total_cost = cost_breakdown.get("total_project_cost", {})
        if total_cost:
            years = [k for k in total_cost.keys() if k.startswith("year")]
            if years:
                cost_text.append(f"Total project cost distributed over {len(years)} years")
        
        return cost_text
    
    def _extract_text_from_pdf(self, file_bytes: bytes) -> str:
        """Extract text from PDF files."""
        try:
            reader = PyPDF2.PdfReader(BytesIO(file_bytes))
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text
        except Exception:
            # Fallback to text decoding
            enc = chardet.detect(file_bytes).get("encoding") or "utf-8"
            try:
                return file_bytes.decode(enc, errors="ignore")
            except Exception:
                return ""
    
    def _extract_text_from_docx(self, file_bytes: bytes) -> str:
        """Extract text from DOCX files."""
        try:
            doc = docx.Document(BytesIO(file_bytes))
            return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
        except Exception:
            return ""
    
    def _extract_text_from_text(self, file_bytes: bytes) -> str:
        """Extract text from plain text files."""
        enc = chardet.detect(file_bytes).get("encoding") or "utf-8"
        try:
            return file_bytes.decode(enc, errors="ignore")
        except Exception:
            return ""
    
    def parse_durations(self, text: str) -> List[Tuple[float, str]]:
        """
        Parse duration expressions from text and convert to months.
        
        Args:
            text: Input text to analyze
            
        Returns:
            List of (duration_in_months, raw_text) tuples
        """
        durations = []
        text_lower = text.lower()
        
        # Direct phrases that imply within-1-year
        if re.search(r"within\s+one\s+year|within\s+12\s+months|<\s*12\s*months", text_lower):
            durations.append((12.0, "within 1 year phrase"))

        # Ranges like 6-12 months or 6 to 12 months
        range_pattern = re.compile(
            r"(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(years?|yrs?|yr|months?|mos?|mo|weeks?|wks?)"
        )
        for match in range_pattern.finditer(text_lower):
            start = self._parse_number(match.group(1))
            end = self._parse_number(match.group(2))
            unit = match.group(3)
            unit_months = self._unit_map.get(unit.rstrip('s'), self._unit_map.get(unit, 1))
            # Conservative: take the upper bound
            months = max(start, end) * unit_months
            durations.append((months, match.group(0)))

        # Single durations like '6 months', 'two years'
        single_pattern = re.compile(
            r"(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten)\s*"
            r"(years?|yrs?|yr|months?|mos?|mo|weeks?|wks?|days?|day|quarter|semester)\b"
        )
        for match in single_pattern.finditer(text_lower):
            number = self._parse_number(match.group(1))
            unit = match.group(2)
            unit_key = unit.rstrip('s')
            months = number * self._unit_map.get(unit_key, self._unit_map.get(unit, 1))
            durations.append((months, match.group(0)))

        # Hyphenated like '6-month' or '12-month'
        hyphen_pattern = re.compile(r"(\d+(?:\.\d+)?)-month")
        for match in hyphen_pattern.finditer(text_lower):
            number = self._parse_number(match.group(1))
            durations.append((number, match.group(0)))

        # Check for year-based cost distribution patterns
        year_distribution = re.findall(r"over\s+(\d+)\s+years?", text_lower)
        for year_match in year_distribution:
            years = self._parse_number(year_match)
            months = years * 12
            durations.append((months, f"over {year_match} years"))

        # If no durations found but 'short-term' or 'pilot' with time hints
        if not durations:
            if re.search(r"short-?term|pilot|pilot[- ]scale|proof[- ]of[- ]concept|prototype", text_lower):
                durations.append((6.0, "heuristic: short-term/pilot mentioned"))

        return durations
    
    def parse_durations_from_json(self, json_data: Dict[str, Any]) -> List[Tuple[float, str]]:
        """
        Parse duration information directly from FORM-I JSON structure.
        
        Args:
            json_data: Parsed JSON data from FORM-I
            
        Returns:
            List of (duration_in_months, raw_text) tuples
        """
        durations = []
        
        # Check basic information for project duration
        basic_info = json_data.get("basic_information", {})
        if basic_info.get("project_duration"):
            duration_text = str(basic_info["project_duration"]).lower()
            text_durations = self.parse_durations(duration_text)
            durations.extend(text_durations)
        
        # Analyze cost breakdown for year-based planning
        cost_breakdown = json_data.get("cost_breakdown", {})
        if cost_breakdown:
            year_count = self._count_project_years(cost_breakdown)
            if year_count > 0:
                months = year_count * 12
                durations.append((months, f"project planned for {year_count} years based on cost breakdown"))
        
        # Check time_schedule in project_details
        project_details = json_data.get("project_details", {})
        if project_details.get("time_schedule"):
            schedule_text = str(project_details["time_schedule"]).lower()
            text_durations = self.parse_durations(schedule_text)
            durations.extend(text_durations)
        
        # Check work_plan for timeline hints
        if project_details.get("work_plan"):
            work_plan_text = str(project_details["work_plan"]).lower()
            text_durations = self.parse_durations(work_plan_text)
            durations.extend(text_durations)
        
        return durations
    
    def _count_project_years(self, cost_breakdown: Dict[str, Any]) -> int:
        """Count the number of years in the cost breakdown structure."""
        max_years = 0
        
        # Check all cost categories
        categories = []
        if "capital_expenditure" in cost_breakdown:
            categories.extend(cost_breakdown["capital_expenditure"].values())
        if "revenue_expenditure" in cost_breakdown:
            categories.extend(cost_breakdown["revenue_expenditure"].values())
        if "total_project_cost" in cost_breakdown:
            categories.append(cost_breakdown["total_project_cost"])
        
        for category in categories:
            if isinstance(category, dict):
                year_keys = [k for k in category.keys() if k.startswith("year") and category[k]]
                if year_keys:
                    # Extract year numbers and find the maximum
                    year_numbers = []
                    for key in year_keys:
                        try:
                            year_num = int(key.replace("year", ""))
                            year_numbers.append(year_num)
                        except ValueError:
                            continue
                    if year_numbers:
                        max_years = max(max_years, max(year_numbers))
        
        return max_years
    
    def _parse_number(self, text: str) -> float:
        """Safely parse number from text, handling words and special cases."""
        if text is None:
            return 0.0
        text = str(text).strip()
        if text == "":
            return 0.0
        
        # Try numeric with commas
        try:
            return float(text.replace(',', ''))
        except Exception:
            # Word to number mapping for common words
            word_map = {
                "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
                "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
            }
            return float(word_map.get(text.lower(), 0))
    
    def extract_budget(self, text: str) -> Dict[str, Any]:
        """
        Extract budget information from text.
        
        Args:
            text: Input text to analyze
            
        Returns:
            Dictionary with budget breakdown including manpower and capital equipment
        """
        budget = {"manpower": 0.0, "capital_equipment": 0.0, "currency_unit": "unknown"}
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        
        number_pattern = re.compile(r"([\d,]+\.?\d*)")
        
        for line in lines:
            line_lower = line.lower()
            
            if "manpower" in line_lower or "salary" in line_lower or "salaries" in line_lower:
                match = number_pattern.search(line.replace('rs.', '').replace('rs', ''))
                if match:
                    try:
                        value = float(match.group(1).replace(',', ''))
                        budget["manpower"] += value
                    except Exception:
                        pass
            
            if any(keyword in line_lower for keyword in ["capital", "capital equipment", "equipment", "land", "building"]):
                match = number_pattern.search(line.replace('rs.', '').replace('rs', ''))
                if match:
                    try:
                        value = float(match.group(1).replace(',', ''))
                        budget["capital_equipment"] += value
                    except Exception:
                        pass
            
            # Detect currency units
            if any(keyword in line_lower for keyword in ["lakh", "lakhs"]):
                budget["currency_unit"] = "lakhs"
            if any(keyword in line_lower for keyword in ["rs", "rupee", "inr"]):
                budget["currency_unit"] = "INR"
        
        return budget
    
    def extract_budget_from_json(self, json_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract budget information directly from FORM-I JSON structure.
        
        Args:
            json_data: Parsed JSON data from FORM-I
            
        Returns:
            Dictionary with comprehensive budget breakdown
        """
        budget = {
            "manpower": 0.0,
            "capital_equipment": 0.0,
            "land_building": 0.0,
            "consumables": 0.0,
            "travel": 0.0,
            "workshop_seminar": 0.0,
            "total_capital": 0.0,
            "total_revenue": 0.0,
            "total_project_cost": 0.0,
            "currency_unit": "lakhs",
            "years": 0
        }
        
        cost_breakdown = json_data.get("cost_breakdown", {})
        if not cost_breakdown:
            return budget
        
        # Count project years
        budget["years"] = self._count_project_years(cost_breakdown)
        
        # Capital expenditure
        cap_exp = cost_breakdown.get("capital_expenditure", {})
        
        # Land and building
        land_building = cap_exp.get("land_building", {})
        if land_building:
            budget["land_building"] = self._sum_yearly_values(land_building)
        
        # Equipment
        equipment = cap_exp.get("equipment", {})
        if equipment:
            budget["capital_equipment"] = self._sum_yearly_values(equipment)
        
        # Revenue expenditure
        rev_exp = cost_breakdown.get("revenue_expenditure", {})
        
        # Salaries (manpower)
        salaries = rev_exp.get("salaries", {})
        if salaries:
            budget["manpower"] = self._sum_yearly_values(salaries)
        
        # Consumables
        consumables = rev_exp.get("consumables", {})
        if consumables:
            budget["consumables"] = self._sum_yearly_values(consumables)
        
        # Travel
        travel = rev_exp.get("travel", {})
        if travel:
            budget["travel"] = self._sum_yearly_values(travel)
        
        # Workshop/Seminar
        workshop = rev_exp.get("workshop_seminar", {})
        if workshop:
            budget["workshop_seminar"] = self._sum_yearly_values(workshop)
        
        # Calculate totals
        budget["total_capital"] = budget["land_building"] + budget["capital_equipment"]
        budget["total_revenue"] = (budget["manpower"] + budget["consumables"] + 
        budget["travel"] + budget["workshop_seminar"])
        
        # Total project cost
        total_cost = cost_breakdown.get("total_project_cost", {})
        if total_cost:
            budget["total_project_cost"] = self._sum_yearly_values(total_cost)
        else:
            budget["total_project_cost"] = budget["total_capital"] + budget["total_revenue"]
        
        return budget
    
    def _sum_yearly_values(self, category_data: Dict[str, Any]) -> float:
        """Sum all yearly values in a budget category."""
        total = 0.0
        for key, value in category_data.items():
            if key.startswith("year") and value:
                try:
                    total += float(str(value).replace(',', ''))
                except (ValueError, TypeError):
                    continue
        return total
    
    def evaluate_feasibility(self, durations: List[Tuple[float, str]]) -> Tuple[str, float, str]:
        """
        Evaluate project feasibility against time horizon.
        
        Args:
            durations: List of (duration_in_months, raw_text) tuples
            
        Returns:
            Tuple of (decision, total_months, rationale)
        """
        if not durations:
            return "Uncertain", 0.0, "No explicit timeline durations found in document."
        
        # Smart duration analysis: prefer explicit project durations over summed phases
        months_list = [duration for duration, _ in durations]
        
        # Look for explicit project duration mentions
        project_durations = []
        phase_durations = []
        
        for months, description in durations:
            desc_lower = description.lower()
            if any(keyword in desc_lower for keyword in ["project planned", "total", "overall", "years based on cost"]):
                project_durations.append(months)
            elif any(keyword in desc_lower for keyword in ["phase", "months:", "heuristic"]):
                phase_durations.append(months)
            else:
                project_durations.append(months)  # Default to project level
        
        # Choose the most reasonable duration
        if project_durations:
            # Use the most common project duration or the median
            total_months = max(set(project_durations), key=project_durations.count)
        else:
            # Fall back to summing phases if no project-level duration found
            total_months = sum(phase_durations)
        
        # If any single duration exceeds horizon
        if any(months > self.horizon_months for months in months_list):
            return "No", total_months, f"At least one phase exceeds {int(self.horizon_months)} months."
        
        # If total duration exceeds horizon
        if total_months > self.horizon_months:
            return "No", total_months, f"Project duration of {total_months:.0f} months exceeds {int(self.horizon_months)} months."
        
        # Check for explicit within-timeframe phrases
        for months, raw_text in durations:
            if 'within' in raw_text and ('year' in raw_text or 'month' in raw_text):
                return "Yes", total_months, f"Document explicitly states completion within {int(self.horizon_months)} months."
        
        return "Yes", total_months, f"Project duration of {total_months:.0f} months is within {int(self.horizon_months)} months horizon."
    
    def _integrate_gemini_assessment(self, text: str, summary: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Call Gemini AI for enhanced assessment if available.
        
        Args:
            text: Full document text
            summary: Project summary dictionary
            
        Returns:
            Gemini assessment result or None if unavailable
        """
        if not _GEMINI_AVAILABLE or not GEMINI_API_KEY:
            return None
        
        # Enhanced prompt for FORM-I data
        is_form_i = summary.get("form_type", "").startswith("FORM-I")
        project_title = summary.get("project_title", "")
        
        if is_form_i:
            prompt = (
                f"You are an expert project reviewer evaluating a FORM-I S&T Grant Proposal. "
                f"Project: {project_title}\n"
                f"Assess whether this project can realistically be completed within {int(self.horizon_months)} months.\n"
                f"Consider the budget allocation, work plan, methodology, and timeline.\n"
                f"Output ONLY a JSON object with keys: decision (Yes/No/Uncertain), "
                f"score (0-100 integer), comment (detailed assessment paragraph).\n"
                f"Include a rationale field explaining the decision.\n\n"
                f"Project Summary:\n{json.dumps(summary, indent=2)}"
            )
        else:
            prompt = (
                "You are an expert project reviewer. Given the extracted project expenditure and timeline text,"
                f" decide whether the project can be completed within {int(self.horizon_months)} months.\n"
                "Output ONLY a JSON object with keys: decision (Yes/No/Uncertain), score (0-100 integer), "
                "comment (one short paragraph).\n"
                "Also include a short rationale field. The comment should be suitable for a human-readable report.\n"
                "Input summary (as JSON):\n" + json.dumps(summary)
            )
        
        try:
            resp = genai.generate(model=MODEL_NAME, prompt=prompt)
            
            # Extract text from different response formats
            text_content = None
            if hasattr(resp, 'candidates') and resp.candidates:
                text_content = resp.candidates[0].content
            elif hasattr(resp, 'text'):
                text_content = resp.text
            elif isinstance(resp, dict) and 'output' in resp:
                text_content = resp['output']
            
            if not text_content:
                return None
            
            # Try to extract JSON from response
            json_text = text_content.strip()
            json_match = re.search(r"(\{[\s\S]*\})", json_text)
            if json_match:
                json_text = json_match.group(1)
            
            parsed = json.loads(json_text)
            
            # Validate required fields
            if "decision" not in parsed:
                return None
            
            # Safe score parsing
            raw_score = parsed.get("score")
            score_value = None
            if raw_score is not None:
                try:
                    if isinstance(raw_score, (int, float)):
                        score_value = int(round(float(raw_score)))
                    else:
                        score_str = str(raw_score).strip()
                        if score_str:
                            score_value = int(round(float(score_str.replace(',', ''))))
                except Exception:
                    score_value = None
            
            return {
                "decision": parsed.get("decision"),
                "score": score_value,
                "comment": parsed.get("comment"),
                "rationale": parsed.get("rationale") or parsed.get("reason")
            }
            
        except Exception:
            return None
    
    def _calculate_heuristic_score(self, total_months: float, durations: List[Tuple[float, str]], budget: Dict[str, Any]) -> int:
        """Calculate heuristic score based on timeline and budget factors."""
        score = 50
        
        # Timeline factors
        if total_months <= self.horizon_months:
            score += 25
        if any(months > self.horizon_months for months, _ in durations):
            score -= 40
        
        # Budget completeness and realism factors
        try:
            # Check for comprehensive budget planning
            if budget.get("manpower", 0) > 0:
                score += 10
            if budget.get("capital_equipment", 0) > 0:
                score += 7
            if budget.get("consumables", 0) > 0:
                score += 5
            if budget.get("travel", 0) > 0:
                score += 3
                
            # Year-based planning bonus
            project_years = budget.get("years", 0)
            if project_years > 0:
                if project_years <= 3:  # Reasonable project duration
                    score += 10
                elif project_years > 5:  # Very long project
                    score -= 15
                    
            # Budget balance assessment
            total_budget = budget.get("total_project_cost", 0)
            if total_budget > 0:
                capital_ratio = budget.get("total_capital", 0) / total_budget
                revenue_ratio = budget.get("total_revenue", 0) / total_budget
                
                # Reasonable balance between capital and revenue
                if 0.2 <= capital_ratio <= 0.7 and 0.3 <= revenue_ratio <= 0.8:
                    score += 8
                    
        except Exception:
            pass
        
        return int(max(0, min(100, score)))
    
    def generate_comment(self, decision: str, total_months: float, 
                        durations: List[Tuple[float, str]], score: int) -> str:
        """
        Generate structured comment with recommendations.
        
        Args:
            decision: Feasibility decision (Yes/No/Uncertain)
            total_months: Total project duration in months
            durations: List of duration breakdowns
            score: Feasibility score
            
        Returns:
            Formatted comment with recommendations
        """
        months_str = f"{total_months:.1f}" if total_months else "N/A"
        changeable = int(max(0, min(100, round((100 - score) * 0.8))))
        
        # Generate decision-specific paragraph
        if decision == "Yes":
            paragraph = (
                f"Proposed milestones are defined and the timeline ({months_str} months)\n"
                "appears achievable with current resources, provided clear acceptance criteria and\n"
                "measurable outputs are attached to each milestone. Strengthen deliverable descriptions\n"
                "to tie disbursements to verified progress."
            )
            recommendations = [
                "Attach a Gantt with milestone dates and specific, testable acceptance criteria for each deliverable.",
                "Define measurable KPIs (e.g., pilot throughput, emissions targets, energy recovery rates) per milestone.",
                "Propose verification methods and third-party sign-off procedures to enable tranche-based funding."
            ]
        elif decision == "No":
            paragraph = (
                f"The extracted timeline ({months_str} months) and phase breakdown indicate the project\n"
                "is unlikely to be completed within the requested horizon without scope reduction or\n"
                "additional resources (staff, equipment, or budget). Consider re-scoping or parallelisation."
            )
            recommendations = [
                "Reduce scope or split work into parallel tracks to shorten the critical path.",
                "Request additional manpower/equipment or revise budget allocation to critical phases.",
                "Provide a phased delivery plan with clear acceptance tests for each tranche."
            ]
        else:  # Uncertain
            paragraph = (
                "Unable to determine feasibility from the provided document. The submission lacks clear\n"
                "milestones, durations per phase, or a detailed resource plan. Provide explicit timelines."
            )
            recommendations = [
                "Add a Gantt chart with phase durations and dependencies.",
                "List staffing and equipment per phase with estimated FTEs and availability.",
                "Specify acceptance criteria and KPIs for each milestone."
            ]
        
        # Build final comment
        header = f"Score: {score}/100    Changeable: {changeable}%"
        comment_parts = [header, paragraph, "", "Recommended actions:"]
        
        for rec in recommendations:
            comment_parts.append(f"- {rec}")
        
        return "\n".join(comment_parts)
    
    def run(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Execute the complete agent workflow.
        
        Args:
            file_bytes: Raw file data
            filename: Name of the file
            
        Returns:
            Structured assessment result
        """
        # Step 1: Extract text and determine file type
        text = self.extract_text(filename, file_bytes)
        if not text or len(text.strip()) < 50:
            raise ValueError("Could not extract meaningful text or file too short.")
        
        # Check if input is JSON (FORM-I data)
        json_data = None
        ext = (filename or "").lower().split(".")[-1]
        if ext == "json":
            try:
                json_data = json.loads(file_bytes.decode('utf-8'))
            except Exception:
                json_data = None
        
        # Step 2: Parse durations and convert to months
        if json_data:
            durations = self.parse_durations_from_json(json_data)
            # Also parse from converted text for additional patterns
            text_durations = self.parse_durations(text)
            durations.extend(text_durations)
            # Remove duplicates
            seen = set()
            unique_durations = []
            for duration, desc in durations:
                key = (duration, desc)
                if key not in seen:
                    seen.add(key)
                    unique_durations.append((duration, desc))
            durations = unique_durations
        else:
            durations = self.parse_durations(text)
        
        # Step 3: Extract budget information
        if json_data:
            budget = self.extract_budget_from_json(json_data)
        else:
            budget = self.extract_budget(text)
        
        # Step 4: Evaluate feasibility against time horizon
        decision, total_months, rationale = self.evaluate_feasibility(durations)
        
        # Step 5: Prepare summary for Gemini integration
        summary = {
            "filename": filename,
            "total_estimated_months": total_months,
            "durations": durations,
            "budget_items": budget,
            "rationale": rationale,
            "form_type": json_data.get("form_type") if json_data else "document",
            "project_title": json_data.get("basic_information", {}).get("project_title") if json_data else None
        }
        
        # Integrate Gemini assessment if available
        gemini_result = self._integrate_gemini_assessment(text, summary)
        
        # Calculate final score and decision
        heuristic_score = self._calculate_heuristic_score(total_months, durations, budget)
        
        if gemini_result:
            final_score = gemini_result.get("score") if gemini_result.get("score") is not None else heuristic_score
            final_decision = gemini_result.get("decision") or decision
            gemini_comment = gemini_result.get("comment")
        else:
            final_score = heuristic_score
            final_decision = decision
            gemini_comment = None
        
        # Ensure score is valid integer
        final_score = int(max(0, min(100, final_score)))
        changeable = int(max(0, min(100, round((100 - final_score) * 0.8))))
        
        # Step 6: Generate final comment
        if gemini_comment:
            # Use Gemini comment but ensure proper formatting
            header = f"Score: {final_score}/100    Changeable: {changeable}%"
            final_comment = f"{header}\n{gemini_comment}"
        else:
            final_comment = self.generate_comment(final_decision, total_months, durations, final_score)
        
        return {
            "decision": final_decision,
            "score": final_score,
            "changeable": changeable,
            "comment": final_comment,
            "total_months": total_months,
            "durations": durations,
            "budget": budget,
            "form_analysis": {
                "is_form_i": json_data is not None,
                "project_years": budget.get("years", 0) if isinstance(budget, dict) else 0,
                "total_budget": budget.get("total_project_cost", 0) if isinstance(budget, dict) else 0,
                "budget_currency": budget.get("currency_unit", "unknown") if isinstance(budget, dict) else "unknown"
            }
        }

@router.post('/deliverable-check')
async def deliverable_check(file: UploadFile = File(...)):
    """
    Assess project deliverable feasibility using the DeliverableFeasibilityAgent.
    
    Args:
        file: Uploaded project document (PDF, DOCX, TXT, JSON with FORM-I data)
        
    Returns:
        JSON response with comprehensive feasibility assessment
    """
    try:
        # Read file data
        data = await file.read()
        filename = file.filename or f"upload_{datetime.utcnow().isoformat()}"
        
        # Initialize and run the agent
        agent = DeliverableFeasibilityAgent(horizon_months=24.0)
        result = agent.run(data, filename)
        
        # Enhanced response for FORM-I data
        response_data = {
            "score": result["score"],
            "comment": result["comment"],
            "analysis": {
                "decision": result["decision"],
                "total_months": result["total_months"],
                "changeable_percentage": result["changeable"],
                "form_analysis": result.get("form_analysis", {}),
                "duration_breakdown": result["durations"],
                "budget_summary": result["budget"]
            }
        }
        
        return JSONResponse(response_data)
        
    except ValueError as ve:
        return JSONResponse({"error": str(ve)}, status_code=400)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)