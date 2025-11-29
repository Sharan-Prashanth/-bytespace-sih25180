/**
 * Ministry of Coal Report - Dynamic Data Integration
 * This script populates the HTML template with data from API routes
 */

// Global data store for report information
let reportData = {
  project: {},
  assessment: {},
  routes: {}
};

/**
 * Initialize the report with dynamic data
 * This function should be called with data from the Python backend
 */
function initializeReport(data) {
  console.log('Initializing report with data:', data);
  reportData = data;
  
  populateBasicInfo();
  populateOverallAssessment();
  populateCapabilityGrid();
  populateDetailedAnalysis();
  populateDashboard();
  
  // Update all report ID references
  updateReportIds();
  
  console.log('Report initialization complete');
}

/**
 * Populate basic project information
 */
function populateBasicInfo() {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Set dynamic values with fallbacks
  setElementText('report-date', currentDate);
  setElementText('project-title', reportData.project?.title || 'Advanced Coal Mining Technology Research');
  setElementText('principal-investigator', reportData.project?.pi || 'Dr. Rajesh Kumar');
  setElementText('institute', reportData.project?.institute || 'Indian Institute of Technology, Delhi');
  setElementText('budget', reportData.project?.budget || '₹15.5 Lakhs');
  setElementText('duration', reportData.project?.duration || '36 months');
  setElementText('priority', reportData.project?.priority || 'High Priority');
  
  // Generate unique report ID
  const reportId = `MOC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;
  setElementText('report-id', reportId);
}

/**
 * Populate overall assessment section
 */
function populateOverallAssessment() {
  const overallScore = reportData.assessment?.overall_score || 75;
  const recommendation = getRecommendation(overallScore);
  
  // Update overall score
  setElementText('overall-score', overallScore);
  setElementText('overall-recommendation', recommendation.text);
  
  // Update progress circle
  updateProgressCircle('overall-progress-circle', overallScore);
  
  // Populate strengths and concerns
  populateStrengthsConcerns();
}

/**
 * Populate capability assessment grid with route data
 */
function populateCapabilityGrid() {
  const capabilityContainer = document.getElementById('capability-grid');
  if (!capabilityContainer) return;
  
  // Define capability categories with route mapping
  const capabilities = [
    {
      title: 'Technical Feasibility',
      score: reportData.routes?.technical_feasibility?.score || 78,
      description: reportData.routes?.technical_feasibility?.comment || 'Strong technical approach with proven methodologies. Implementation plan is well-structured and realistic.',
      route: 'technical_feasibility'
    },
    {
      title: 'Timeline Realism',
      score: reportData.routes?.timeline_realism?.score || 65,
      description: reportData.routes?.timeline_realism?.comment || 'Proposed timeline is ambitious but achievable with proper resource allocation and milestone management.',
      route: 'timeline_realism'
    },
    {
      title: 'Novelty & Innovation',
      score: reportData.routes?.novelty?.score || 82,
      description: reportData.routes?.novelty?.comment || 'Highly innovative approach with significant potential for breakthrough discoveries in coal technology.',
      route: 'novelty'
    },
    {
      title: 'Cost Validation',
      score: reportData.routes?.cost_validation?.score || 70,
      description: reportData.routes?.cost_validation?.comment || 'Budget allocation is reasonable. Some cost items need additional justification for optimal resource utilization.',
      route: 'cost_validation'
    },
    {
      title: 'Benefit to Coal Industry',
      score: reportData.routes?.coal_industry_benefit?.score || 85,
      description: reportData.routes?.coal_industry_benefit?.comment || 'Exceptional potential impact on coal mining efficiency, safety, and environmental sustainability.',
      route: 'coal_industry_benefit'
    },
    {
      title: 'Deliverables Quality',
      score: reportData.routes?.deliverables?.score || 73,
      description: reportData.routes?.deliverables?.comment || 'Clear and measurable deliverables aligned with industry requirements and research objectives.',
      route: 'deliverables'
    }
  ];
  
  // Clear existing content
  capabilityContainer.innerHTML = '';
  
  // Create capability cards
  capabilities.forEach(capability => {
    const card = createCapabilityCard(capability);
    capabilityContainer.appendChild(card);
  });
}

/**
 * Create a capability card element
 */
function createCapabilityCard(capability) {
  const card = document.createElement('div');
  card.className = 'capability-card';
  
  const scoreClass = getScoreClass(capability.score);
  
  card.innerHTML = `
    <div class="capability-header">
      <div class="capability-title">${capability.title}</div>
      <div class="capability-score ${scoreClass}">${capability.score}</div>
    </div>
    <div class="capability-description">${capability.description}</div>
  `;
  
  return card;
}

/**
 * Populate detailed analysis section
 */
function populateDetailedAnalysis() {
  const analysisContainer = document.getElementById('detailed-analysis');
  if (!analysisContainer) return;
  
  // Analysis categories based on route data
  const analysisCategories = [
    {
      title: 'Technical Assessment',
      points: extractAnalysisPoints('technical_feasibility')
    },
    {
      title: 'Innovation & Novelty Analysis',
      points: extractAnalysisPoints('novelty')
    },
    {
      title: 'Cost-Benefit Evaluation',
      points: extractAnalysisPoints('cost_validation')
    },
    {
      title: 'Industry Impact Assessment',
      points: extractAnalysisPoints('coal_industry_benefit')
    },
    {
      title: 'Timeline & Deliverables Review',
      points: extractAnalysisPoints('timeline_realism', 'deliverables')
    }
  ];
  
  analysisContainer.innerHTML = '';
  
  analysisCategories.forEach(category => {
    const section = createAnalysisSection(category);
    analysisContainer.appendChild(section);
  });
}

/**
 * Create analysis section element
 */
function createAnalysisSection(category) {
  const section = document.createElement('div');
  section.className = 'analysis-category';
  
  const pointsList = category.points.map(point => `<li>${point}</li>`).join('');
  
  section.innerHTML = `
    <h3>${category.title}</h3>
    <ul class="analysis-points">
      ${pointsList}
    </ul>
  `;
  
  return section;
}

/**
 * Extract analysis points from route data
 */
function extractAnalysisPoints(...routes) {
  const points = [];
  
  routes.forEach(route => {
    if (reportData.routes?.[route]) {
      const routeData = reportData.routes[route];
      
      if (routeData.comment) {
        points.push(routeData.comment);
      }
      
      if (routeData.detailed_analysis) {
        points.push(...routeData.detailed_analysis);
      }
      
      if (routeData.recommendations) {
        points.push(...routeData.recommendations);
      }
    }
  });
  
  // Add default points if no route data
  if (points.length === 0) {
    points.push(
      'Comprehensive evaluation based on established assessment criteria.',
      'Analysis considers both technical and practical implementation factors.',
      'Recommendations align with Ministry of Coal strategic objectives.'
    );
  }
  
  return points;
}

/**
 * Populate dashboard section
 */
function populateDashboard() {
  populateRiskMatrix();
  populateCostBreakdown();
  populateTimeline();
  populateFinalRecommendations();
}

/**
 * Populate risk assessment matrix
 */
function populateRiskMatrix() {
  const riskContainer = document.getElementById('risk-matrix');
  if (!riskContainer) return;
  
  const riskFactors = [
    { name: 'Technical', level: calculateRiskLevel('technical_feasibility') },
    { name: 'Financial', level: calculateRiskLevel('cost_validation') },
    { name: 'Timeline', level: calculateRiskLevel('timeline_realism') },
    { name: 'Innovation', level: 'Low' },
    { name: 'Regulatory', level: 'Medium' },
    { name: 'Market', level: 'Low' }
  ];
  
  riskContainer.innerHTML = '';
  
  riskFactors.forEach(risk => {
    const riskItem = document.createElement('div');
    riskItem.className = `risk-item risk-${risk.level.toLowerCase()}`;
    riskItem.innerHTML = `<div>${risk.name}</div><div>${risk.level}</div>`;
    riskContainer.appendChild(riskItem);
  });
}

/**
 * Populate cost breakdown chart
 */
function populateCostBreakdown() {
  const costContainer = document.getElementById('cost-breakdown');
  if (!costContainer) return;
  
  const costData = reportData.routes?.cost_validation?.breakdown || {
    personnel: 40,
    equipment: 30,
    materials: 20,
    overhead: 10
  };
  
  const chartSvg = createCostChart(costData);
  costContainer.innerHTML = '';
  costContainer.appendChild(chartSvg);
}

/**
 * Create cost breakdown donut chart
 */
function createCostChart(costData) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'cost-chart');
  svg.setAttribute('width', '150');
  svg.setAttribute('height', '150');
  svg.setAttribute('viewBox', '0 0 150 150');
  
  const colors = ['#ff9933', '#138808', '#002855', '#6b6f71'];
  const total = Object.values(costData).reduce((sum, val) => sum + val, 0);
  
  let startAngle = 0;
  Object.entries(costData).forEach(([key, value], index) => {
    const percentage = value / total;
    const endAngle = startAngle + (percentage * 360);
    
    const path = createArcPath(75, 75, 60, 30, startAngle, endAngle);
    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathElement.setAttribute('d', path);
    pathElement.setAttribute('fill', colors[index % colors.length]);
    
    svg.appendChild(pathElement);
    startAngle = endAngle;
  });
  
  return svg;
}

/**
 * Populate timeline view
 */
function populateTimeline() {
  const timelineContainer = document.getElementById('timeline-view');
  if (!timelineContainer) return;
  
  const milestones = [
    'Project Start',
    'Phase 1 Complete',
    'Mid-term Review',
    'Phase 2 Complete',
    'Final Delivery'
  ];
  
  timelineContainer.innerHTML = '';
  
  milestones.forEach(milestone => {
    const milestoneDiv = document.createElement('div');
    milestoneDiv.className = 'timeline-milestone';
    milestoneDiv.innerHTML = `<div class="timeline-label">${milestone}</div>`;
    timelineContainer.appendChild(milestoneDiv);
  });
}

/**
 * Populate final recommendations
 */
function populateFinalRecommendations() {
  const recommendationsContainer = document.getElementById('final-recommendations');
  if (!recommendationsContainer) return;
  
  const overallScore = reportData.assessment?.overall_score || 75;
  const recommendation = getRecommendation(overallScore);
  
  recommendationsContainer.innerHTML = `
    <div class="recommendation-status">${recommendation.status}</div>
    <div class="recommendation-text">${recommendation.detailed}</div>
  `;
}

/**
 * Utility function to set element text content safely
 */
function setElementText(elementId, text) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = text;
  }
}

/**
 * Update progress circle stroke-dashoffset based on score
 */
function updateProgressCircle(elementId, score) {
  const circle = document.getElementById(elementId);
  if (circle) {
    const circumference = 220; // 2 * PI * radius (35)
    const offset = circumference - (score / 100) * circumference;
    circle.style.strokeDashoffset = offset;
  }
}

/**
 * Get CSS class for score styling
 */
function getScoreClass(score) {
  if (score >= 80) return 'score-excellent';
  if (score >= 70) return 'score-good';
  if (score >= 60) return 'score-average';
  return 'score-poor';
}

/**
 * Get recommendation based on overall score
 */
function getRecommendation(score) {
  if (score >= 80) {
    return {
      text: 'Strongly Recommended for Funding',
      status: 'APPROVED',
      detailed: 'This project demonstrates exceptional merit across all evaluation criteria. The proposal shows strong technical foundation, innovative approach, and significant potential for advancing coal industry capabilities. Immediate funding approval is recommended.'
    };
  } else if (score >= 70) {
    return {
      text: 'Recommended for Funding',
      status: 'APPROVED',
      detailed: 'This project meets funding criteria with good scores across most evaluation areas. While some aspects may need minor improvements, the overall proposal demonstrates sufficient merit for funding approval.'
    };
  } else if (score >= 60) {
    return {
      text: 'Conditional Approval',
      status: 'CONDITIONAL',
      detailed: 'This project shows promise but requires addressing identified concerns before full approval. Recommend conditional funding with specific milestones and review requirements.'
    };
  } else {
    return {
      text: 'Not Recommended',
      status: 'REJECTED',
      detailed: 'This project does not meet minimum funding criteria. Significant improvements in technical approach, budget justification, or deliverables are required before reconsideration.'
    };
  }
}

/**
 * Calculate risk level based on route score
 */
function calculateRiskLevel(routeKey) {
  const score = reportData.routes?.[routeKey]?.score || 50;
  if (score >= 75) return 'Low';
  if (score >= 60) return 'Medium';
  return 'High';
}

/**
 * Populate strengths and concerns
 */
function populateStrengthsConcerns() {
  const strengths = [];
  const concerns = [];
  
  // Extract from route data
  Object.entries(reportData.routes || {}).forEach(([route, data]) => {
    if (data.score >= 75) {
      strengths.push(data.comment || `Strong performance in ${route.replace('_', ' ')}`);
    } else if (data.score < 60) {
      concerns.push(data.comment || `Improvement needed in ${route.replace('_', ' ')}`);
    }
  });
  
  // Default strengths and concerns if no route data
  if (strengths.length === 0) {
    strengths.push(
      'Strong technical approach with innovative methodology',
      'Well-qualified research team with relevant expertise',
      'Clear deliverables aligned with coal industry needs'
    );
  }
  
  if (concerns.length === 0) {
    concerns.push(
      'Timeline appears ambitious for proposed scope',
      'Budget justification requires additional detail'
    );
  }
  
  // Update DOM
  const strengthsList = document.getElementById('key-strengths');
  const concernsList = document.getElementById('areas-concerns');
  
  if (strengthsList) {
    strengthsList.innerHTML = strengths.map(s => `<li>${s}</li>`).join('');
  }
  
  if (concernsList) {
    concernsList.innerHTML = concerns.map(c => `<li>${c}</li>`).join('');
  }
}

/**
 * Update all report ID references
 */
function updateReportIds() {
  const reportId = document.getElementById('report-id')?.textContent;
  if (reportId) {
    document.querySelectorAll('.report-id-ref').forEach(element => {
      element.textContent = reportId;
    });
  }
}

/**
 * Create arc path for donut chart
 */
function createArcPath(centerX, centerY, outerRadius, innerRadius, startAngle, endAngle) {
  const startAngleRad = (startAngle - 90) * Math.PI / 180;
  const endAngleRad = (endAngle - 90) * Math.PI / 180;
  
  const x1 = centerX + outerRadius * Math.cos(startAngleRad);
  const y1 = centerY + outerRadius * Math.sin(startAngleRad);
  const x2 = centerX + outerRadius * Math.cos(endAngleRad);
  const y2 = centerY + outerRadius * Math.sin(endAngleRad);
  
  const x3 = centerX + innerRadius * Math.cos(endAngleRad);
  const y3 = centerY + innerRadius * Math.sin(endAngleRad);
  const x4 = centerX + innerRadius * Math.cos(startAngleRad);
  const y4 = centerY + innerRadius * Math.sin(startAngleRad);
  
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  
  return `M ${x1} ${y1} 
          A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}
          L ${x3} ${y3} 
          A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} 
          Z`;
}

/**
 * Initialize report when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing report...');
  
  // Check if data is passed from Python backend
  if (typeof window.reportData !== 'undefined') {
    initializeReport(window.reportData);
  } else {
    // Initialize with sample data for testing
    initializeReport({
      project: {
        title: 'Advanced Coal Mining Automation Research',
        pi: 'Dr. Rajesh Kumar Sharma',
        institute: 'Indian Institute of Technology, Delhi',
        budget: '₹18.5 Lakhs',
        duration: '42 months',
        priority: 'High Priority'
      },
      assessment: {
        overall_score: 76
      },
      routes: {
        technical_feasibility: {
          score: 78,
          comment: 'Strong technical foundation with proven methodologies and realistic implementation approach.'
        },
        timeline_realism: {
          score: 65,
          comment: 'Timeline is ambitious but achievable with proper resource management and milestone tracking.'
        },
        novelty: {
          score: 82,
          comment: 'Highly innovative approach with significant potential for breakthrough discoveries in automation.'
        },
        cost_validation: {
          score: 70,
          comment: 'Budget allocation is reasonable with minor adjustments needed for equipment costs.'
        },
        coal_industry_benefit: {
          score: 85,
          comment: 'Exceptional potential for improving mining efficiency, safety protocols, and operational sustainability.'
        },
        deliverables: {
          score: 73,
          comment: 'Well-defined deliverables with clear success metrics and industry-relevant outcomes.'
        }
      }
    });
  }
});

/**
 * Export initializeReport function for external use
 */
window.initializeReport = initializeReport;