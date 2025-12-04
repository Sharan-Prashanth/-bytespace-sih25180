"""
Template generator for dynamic proposal reports
"""
from typing import Dict, Any, Optional
import json

def generate_html_template(proposal_data: Optional[Dict[str, Any]] = None, scores: Optional[Dict[str, Any]] = None) -> str:
    """
    Generate HTML template with dynamic proposal data
    """
    # Default values
    project_title = "Unknown Project"
    principal_agency = "Unknown Agency" 
    project_leader = "Unknown Leader"
    duration = "Unknown"
    total_cost = "Unknown"
    submission_date = "Unknown"
    
    # Extract scores
    overall_score = 75
    novelty_score = 80
    feasibility_score = 70
    cost_score = 75
    ai_score = 85
    plagiarism_score = 90
    timeline_score = 65
    
    if scores:
        overall_score = scores.get('overall_score', overall_score)
        subscores = scores.get('subscores', {})
        novelty_score = subscores.get('novelty_subscore', novelty_score)
        ai_score = subscores.get('ai_subscore', ai_score)
        plagiarism_score = subscores.get('plagiarism_subscore', plagiarism_score)
        cost_score = subscores.get('cost_subscore', cost_score)
        timeline_score = subscores.get('timeline_subscore', timeline_score)
    
    # Extract proposal information
    if proposal_data and 'form_data' in proposal_data:
        form_data = proposal_data['form_data']
        basic_info = form_data.get('basic_information', {})
        project_details = form_data.get('project_details', {})
        
        project_title = basic_info.get('project_title', project_title)
        principal_agency = basic_info.get('principal_implementing_agency', principal_agency)
        project_leader = basic_info.get('project_leader_name', project_leader)
        submission_date = basic_info.get('submission_date', submission_date)
        
        if basic_info.get('project_duration'):
            duration = f"{basic_info.get('project_duration')} months"
            
        if proposal_data.get('calculated_totals', {}).get('total_cost'):
            total_cost = f"₹{proposal_data['calculated_totals']['total_cost']:.2f} lakhs"
    
    # Truncate long text for display
    def truncate(text, max_length=100):
        if not text:
            return "Not provided"
        return text[:max_length] + "..." if len(text) > max_length else text
    
    # Get project details if available
    definition_of_issue = "Not provided"
    objectives = "Not provided" 
    project_benefits = "Not provided"
    methodology = "Not provided"
    
    if proposal_data and 'form_data' in proposal_data:
        project_details = proposal_data['form_data'].get('project_details', {})
        definition_of_issue = truncate(project_details.get('definition_of_issue', ''))
        objectives = truncate(project_details.get('objectives', ''))
        project_benefits = truncate(project_details.get('project_benefits', ''))
        methodology = truncate(project_details.get('methodology', ''))

    html_template = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>MOC Project Evaluation Report</title>
  <style>
    @page {{
      size: A4;
      margin: 15mm;
    }}

    * {{
      box-sizing: border-box;
    }}

    body {{
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #333;
    }}

    .page {{
      width: 214mm;
      min-height: 297mm;
      margin: 8px auto;
      background: linear-gradient(180deg, #fff3e6 0%, #ffffff 48%, #eef8f0 100%);
      padding: 12mm;
      position: relative;
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.12);
      page-break-after: always;
      border-left: 3px solid rgba(255,153,51,0.12);
      border-right: 3px solid rgba(19,136,8,0.07);
    }}

    .header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 15px;
      background: linear-gradient(90deg, #ff9933, #ffffff, #138808);
      border-radius: 8px;
    }}

    .header-title {{
      font-size: 18px;
      font-weight: bold;
      color: #002855;
    }}

    .project-info {{
      background: white;
      border: 1px solid #e6e6e6;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
    }}

    .project-info table {{
      width: 100%;
      border-collapse: collapse;
    }}

    .project-info th,
    .project-info td {{
      padding: 8px 10px;
      border-bottom: 1px solid #f0f0f0;
      text-align: left;
    }}

    .project-info th {{
      background: #f7f7f7;
      font-weight: bold;
      color: #002855;
    }}

    .scores-grid {{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 20px 0;
    }}

    .score-card {{
      background: white;
      border: 2px solid #e6e6e6;
      border-radius: 10px;
      padding: 15px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }}

    .score-value {{
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }}

    .score-label {{
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
    }}

    .overall-score {{
      grid-column: span 3;
      background: linear-gradient(135deg, #ff9933, #138808);
      color: white;
      border: none;
    }}

    .overall-score .score-value {{
      font-size: 36px;
    }}

    .details-section {{
      background: white;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
      border-left: 4px solid #ff9933;
    }}

    .section-title {{
      font-size: 16px;
      font-weight: bold;
      color: #002855;
      margin-bottom: 10px;
    }}

    .section-content {{
      font-size: 14px;
      line-height: 1.5;
      color: #333;
    }}

    .footer {{
      position: absolute;
      bottom: 15mm;
      left: 15mm;
      right: 15mm;
      text-align: center;
      font-size: 10px;
      color: #666;
    }}
  </style>
</head>
<body>

<!-- Page 1: Executive Summary -->
<div class="page">
  <div class="header">
    <div class="header-title">Ministry of Coal - Project Evaluation Report</div>
    <div style="font-size: 12px;">Generated: {submission_date}</div>
  </div>

  <div class="project-info">
    <table>
      <tr>
        <th>Project Title</th>
        <td>{project_title}</td>
      </tr>
      <tr>
        <th>Principal Agency</th>
        <td>{principal_agency}</td>
      </tr>
      <tr>
        <th>Project Leader</th>
        <td>{project_leader}</td>
      </tr>
      <tr>
        <th>Duration</th>
        <td>{duration}</td>
      </tr>
      <tr>
        <th>Total Cost</th>
        <td>{total_cost}</td>
      </tr>
    </table>
  </div>

  <div class="scores-grid">
    <div class="score-card overall-score">
      <div class="score-value">{overall_score}%</div>
      <div class="score-label">Overall Score</div>
    </div>
    
    <div class="score-card">
      <div class="score-value" style="color: #ff9933;">{novelty_score}%</div>
      <div class="score-label">Novelty</div>
    </div>
    
    <div class="score-card">
      <div class="score-value" style="color: #138808;">{feasibility_score}%</div>
      <div class="score-label">Feasibility</div>
    </div>
    
    <div class="score-card">
      <div class="score-value" style="color: #2b8fd6;">{cost_score}%</div>
      <div class="score-label">Cost Efficiency</div>
    </div>
    
    <div class="score-card">
      <div class="score-value" style="color: #7e57c2;">{ai_score}%</div>
      <div class="score-label">AI Score</div>
    </div>
    
    <div class="score-card">
      <div class="score-value" style="color: #d81b60;">{plagiarism_score}%</div>
      <div class="score-label">Plagiarism</div>
    </div>
    
    <div class="score-card">
      <div class="score-value" style="color: #ff5722;">{timeline_score}%</div>
      <div class="score-label">Timeline</div>
    </div>
  </div>

  <div class="details-section">
    <div class="section-title">Problem Definition</div>
    <div class="section-content">{definition_of_issue}</div>
  </div>

  <div class="details-section">
    <div class="section-title">Project Objectives</div>
    <div class="section-content">{objectives}</div>
  </div>

  <div class="footer">
    Generated by Bytespace Evaluator — Page 1 of 3
  </div>
</div>

<!-- Page 2: Detailed Analysis -->
<div class="page">
  <div class="header">
    <div class="header-title">Detailed Analysis & Recommendations</div>
  </div>

  <div class="details-section">
    <div class="section-title">Project Benefits</div>
    <div class="section-content">{project_benefits}</div>
  </div>

  <div class="details-section">
    <div class="section-title">Methodology</div>
    <div class="section-content">{methodology}</div>
  </div>

  <div class="details-section">
    <div class="section-title">AI Analysis Results</div>
    <div class="section-content">
      The AI analysis indicates a score of {ai_score}% based on automated content evaluation.
      This includes checks for originality, technical feasibility, and alignment with coal industry objectives.
    </div>
  </div>

  <div class="details-section">
    <div class="section-title">Plagiarism Check Results</div>
    <div class="section-content">
      Plagiarism check completed with a score of {plagiarism_score}%.
      This indicates the level of original content in the proposal documentation.
    </div>
  </div>

  <div class="footer">
    Generated by Bytespace Evaluator — Page 2 of 3
  </div>
</div>

<!-- Page 3: Financial Summary -->
<div class="page">
  <div class="header">
    <div class="header-title">Financial Summary & Recommendations</div>
  </div>

  <div class="details-section">
    <div class="section-title">Cost Analysis</div>
    <div class="section-content">
      Total Project Cost: {total_cost}<br>
      Cost Efficiency Score: {cost_score}%<br>
      This score reflects the appropriateness of the proposed budget for the project scope and expected deliverables.
    </div>
  </div>

  <div class="details-section">
    <div class="section-title">Timeline Assessment</div>
    <div class="section-content">
      Project Duration: {duration}<br>
      Timeline Feasibility Score: {timeline_score}%<br>
      The timeline has been evaluated for realistic milestones and deliverable schedules.
    </div>
  </div>

  <div class="details-section">
    <div class="section-title">Overall Recommendation</div>
    <div class="section-content">
      Based on the comprehensive analysis, this project has received an overall score of {overall_score}%.
      {'This project is recommended for approval.' if overall_score >= 70 else 'This project requires further review before approval.' if overall_score >= 50 else 'This project is not recommended for approval in its current form.'}
    </div>
  </div>

  <div class="footer">
    Generated by Bytespace Evaluator — Page 3 of 3
  </div>
</div>

</body>
</html>'''

    return html_template


def generate_json_template_data(proposal_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Generate template data that can be used with various template engines
    """
    # Default data structure matching your sample
    template_data = {
        "form_type": "FORM-I S&T Grant Proposal",
        "basic_information": {
            "project_title": "Project title comes here",
            "principal_implementing_agency": None,
            "project_leader_name": "principal",
            "sub_implementing_agency": "Sub-agency",
            "co_investigator_name": None,
            "contact_email": None,
            "contact_phone": None,
            "submission_date": "28-11-2025",
            "project_duration": None
        },
        "project_details": {
            "definition_of_issue": "Issue will come here",
            "objectives": "Objectives section",
            "justification_subject_area": "Justify",
            "project_benefits": "Very very beneficial",
            "work_plan": "Work plan will come here",
            "methodology": "Methodology will come here",
            "organization_of_work": "Organization of work elements will come here",
            "time_schedule": "Bar Chart/PERT chart will come here",
            "foreign_exchange_details": "50%"
        },
        "cost_breakdown": {
            "capital_expenditure": {
                "land_building": {
                    "total": None,
                    "year1": "45",
                    "year2": "45", 
                    "year3": "54",
                    "justification": None
                },
                "equipment": {
                    "total": None,
                    "year1": "4",
                    "year2": "5",
                    "year3": "5",
                    "justification": None
                }
            },
            "revenue_expenditure": {
                "salaries": {
                    "total": None,
                    "year1": "7",
                    "year2": "7",
                    "year3": "7"
                },
                "consumables": {
                    "total": None,
                    "year1": "8",
                    "year2": "8", 
                    "year3": "8",
                    "notes": None
                },
                "travel": {
                    "total": None,
                    "year1": "9",
                    "year2": "9",
                    "year3": "9"
                },
                "workshop_seminar": {
                    "total": None,
                    "year1": "7",
                    "year2": "7",
                    "year3": "7"
                }
            },
            "total_project_cost": {
                "total": None,
                "year1": "7",
                "year2": "7",
                "year3": "7"
            },
            "fund_phasing": None
        },
        "additional_information": {
            "cv_details": None,
            "past_experience": None,
            "other_details": None
        }
    }
    
    # Override with actual proposal data if provided
    if proposal_data and 'form_data' in proposal_data:
        form_data = proposal_data['form_data']
        
        # Merge the form data, keeping the structure
        for key in template_data:
            if key in form_data and form_data[key]:
                if isinstance(template_data[key], dict) and isinstance(form_data[key], dict):
                    template_data[key].update(form_data[key])
                else:
                    template_data[key] = form_data[key]
    
    return template_data