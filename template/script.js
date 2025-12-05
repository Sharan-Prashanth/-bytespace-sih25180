import { Chart } from "@/components/ui/chart"
// Configuration
const API_BASE_URL = "http://localhost:8000" // Update with your backend URL

// Metric colors
const metricColors = {
  novelty: "#1f77b4",
  feasibility: "#2ca02c",
  cost: "#ff7f0e",
  aiScore: "#d62728",
  benefitToCoal: "#9467bd",
  deliverables: "#c5b0d5",
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Fetch data from backend
    const data = await fetchReportData()

    // Populate page 1
    populatePage1(data)

    // Populate page 2
    populatePage2(data)

    // Populate page 3
    populatePage3(data)

    // Create charts
    createMetricsChart(data)
    createCostBreakdownChart(data)
  } catch (error) {
    console.error("Error loading report:", error)
    showErrorMessage(error.message)
  }
})

// Fetch report data from backend
async function fetchReportData() {
  try {
    const response = await fetch(`${API_BASE_URL}/full-analysis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      const fullData = await response.json()
      return parseBackendResponse(fullData)
    }
  } catch (error) {
    console.warn("[v0] Backend not available, using mock data:", error.message)
  }

  return getMockData()
}

function parseBackendResponse(fullData) {
  if (!fullData.results || !Array.isArray(fullData.results)) {
    return getMockData()
  }

  // Extract data from each endpoint response
  const responses = {}
  fullData.results.forEach((result) => {
    if (result.output) {
      const endpoint = result.endpoint.replace("/", "")
      responses[endpoint] = result.output
    }
  })

  // Map backend responses to report data structure
  const costData = responses["processandesimate"] || {}
  const noveltyData = responses["analyzenovelty"] || {}
  const feasibilityData = responses["technicalfeasibility"] || {}
  const benefitData = responses["benefitcheck"] || {}
  const deliverableData = responses["deliverablecheck"] || {}
  const aiData = responses["detectaiandvalidate"] || {}

  const costBreakdown = costData.breakdown || {}
  const projectInfo = costData.extracted_json?.basic_information || {}

  return {
    projectTitle: projectInfo.project_title || "Project Title Placeholder",
    principalInvestigator: projectInfo.project_leader_name || "Principal Investigator",
    institute: projectInfo.principal_implementing_agency || "Institute Name",
    submissionDate: projectInfo.submission_date || "Date Unknown",
    budget: `₹ ${costData.cost_estimation?.government_budget_lakhs || "0"} Lakhs` || "Budget Unknown",
    duration: projectInfo.project_duration || "Duration Unknown",
    proposalId: "MOC-PROP-2025-0047",
    overallScore: Math.round(
      (noveltyData.novelty_percentage +
        feasibilityData.score +
        (100 - Math.abs(100 - deliverableData.score)) +
        benefitData.benefit_score) /
        4,
    ),
    riskIndex: 32,
    metrics: {
      novelty: noveltyData.novelty_percentage || 0,
      feasibility: feasibilityData.score || 0,
      cost: 100 - Math.abs(deliverableData.score - 50),
      aiScore: aiData.model_score_pct || 0,
      benefitToCoal: benefitData.benefit_score || 0,
      deliverables: deliverableData.score || 0,
    },
    findings: [
      {
        title: "Novelty",
        score: noveltyData.novelty_percentage || 0,
        changeable: 15,
        comment: noveltyData.comment || "Assessment of proposal originality and innovation.",
        recommendations: [
          "Document prior art and clearly highlight novel integration steps.",
          "Provide pilot test plans and validation data.",
          "Include IP or patent landscape notes.",
        ],
      },
      {
        title: "Technical Feasibility",
        score: feasibilityData.score || 0,
        changeable: feasibilityData.changeable_percent || 10,
        comment: feasibilityData.comment || "Assessment of technical feasibility and resource availability.",
        recommendations: feasibilityData.recommended_actions || [
          "Define measurable KPIs per milestone.",
          "Supply detailed feedstock supply agreements.",
          "Include third-party testing schedules.",
        ],
      },
      {
        title: "Cost Justification",
        score: costData.cost_estimation?.confidence_score || 0,
        changeable: 20,
        comment: costData.comment || "The budget aligns with project scope and includes contingencies.",
        recommendations: costData.recommendations || [
          "Maintain detailed financial records.",
          "Ensure all procurements follow government guidelines.",
          "Consider leveraging existing infrastructure.",
        ],
      },
      {
        title: "Deliverables",
        score: deliverableData.score || 0,
        changeable: deliverableData.changeable_percentage || 6,
        comment: deliverableData.comment || "Assessment of project deliverables and milestones.",
        recommendations: [
          "Add Gantt chart with phase durations.",
          "List staffing and equipment per phase.",
          "Specify acceptance criteria and KPIs.",
        ],
      },
      {
        title: "MOC Benefit",
        score: benefitData.benefit_score || 0,
        changeable: 10,
        comment: benefitData.comments || "Assessment of benefit alignment with Ministry of Coal objectives.",
        recommendations: [
          "Address advanced mining technology gaps.",
          "Include waste-to-wealth concepts.",
          "Highlight practical benefits to operations.",
        ],
      },
    ],
    costBreakdown: [
      {
        label: "Equipment",
        percentage:
          Math.round((costBreakdown.equipment / costData.cost_estimation?.government_budget_lakhs) * 100) || 15,
        amount: costBreakdown.equipment || 5000,
      },
      {
        label: "Manpower",
        percentage:
          Math.round((costBreakdown.manpower / costData.cost_estimation?.government_budget_lakhs) * 100) || 31,
        amount: costBreakdown.manpower || 10000,
      },
      {
        label: "Travel & Fieldwork",
        percentage:
          Math.round((costBreakdown.travel_and_fieldwork / costData.cost_estimation?.government_budget_lakhs) * 100) ||
          21,
        amount: costBreakdown.travel_and_fieldwork || 7000,
      },
      {
        label: "Consumables",
        percentage:
          Math.round((costBreakdown.consumables / costData.cost_estimation?.government_budget_lakhs) * 100) || 6,
        amount: costBreakdown.consumables || 2000,
      },
      {
        label: "Maintenance & Operations",
        percentage:
          Math.round(
            (costBreakdown.maintenance_and_operations / costData.cost_estimation?.government_budget_lakhs) * 100,
          ) || 5,
        amount: costBreakdown.maintenance_and_operations || 1500,
      },
      {
        label: "Contingency",
        percentage:
          Math.round((costBreakdown.contingency / costData.cost_estimation?.government_budget_lakhs) * 100) || 14,
        amount: costBreakdown.contingency || 4500,
      },
      {
        label: "Other",
        percentage: 8,
        amount: 2500,
      },
    ],
  }
}

// Mock data for demonstration
function getMockData() {
  return {
    projectTitle: "Integrated Coal Waste-to-Energy Demonstration Project",
    principalInvestigator: "Dr. A. K. Sharma",
    institute: "National Institute of Coal Research",
    submissionDate: "15 Oct 2025",
    budget: "₹ 18,500,000",
    duration: "30 months",
    proposalId: "MOC-PROP-2025-0047",
    overallScore: 78,
    riskIndex: 32,
    metrics: {
      novelty: 80,
      feasibility: 74,
      cost: 40,
      aiScore: 100,
      benefitToCoal: 97,
      deliverables: 60,
    },
    findings: [
      {
        title: "Novelty",
        score: 80,
        changeable: 15,
        comment:
          "The proposal introduces an integrated coal waste-to-energy process combining gasification and carbon-capture at pilot scale.",
        recommendations: [
          "Document prior art and clearly highlight novel integration steps.",
          "Provide pilot test plans and validation data.",
          "Include IP or patent landscape notes.",
        ],
      },
      {
        title: "Technical Feasibility",
        score: 74,
        changeable: 10,
        comment: "Engineering plans and team experience indicate feasibility at pilot scale.",
        recommendations: [
          "Supply detailed feedstock supply agreements.",
          "Include third-party testing schedules.",
          "Provide commissioning plan with acceptance criteria.",
        ],
      },
      {
        title: "Cost Justification",
        score: 40,
        changeable: 20,
        comment: "The budget broadly aligns but lacks detailed line-item breakdowns.",
        recommendations: [
          "Provide detailed quotations for equipment.",
          "Separate capital vs operational expenses.",
          "Clarify contingencies and cost assumptions.",
        ],
      },
      {
        title: "Deliverables",
        score: 92,
        changeable: 6,
        comment: "Project deliverables are well-defined with clear milestones.",
        recommendations: [
          "Add Gantt chart with phase durations.",
          "List staffing and equipment per phase.",
          "Specify acceptance criteria and KPIs.",
        ],
      },
      {
        title: "MOC Benefit",
        score: 30,
        changeable: 15,
        comment: "Document has limited alignment to MOC benefit areas; revisions needed.",
        recommendations: [
          "Address advanced mining technology gaps.",
          "Include waste-to-wealth concepts.",
          "Highlight practical operational benefits.",
        ],
      },
    ],
    costBreakdown: [
      { label: "Equipment", percentage: 59, amount: 104000 },
      { label: "Manpower", percentage: 10, amount: 17000 },
      { label: "Travel & Fieldwork", percentage: 12, amount: 22000 },
      { label: "Data Collection", percentage: 3, amount: 5000 },
      { label: "Consumables", percentage: 3, amount: 5000 },
      { label: "Maintenance", percentage: 4, amount: 7000 },
      { label: "Contingency", percentage: 9, amount: 17000 },
    ],
  }
}

// Populate Page 1
function populatePage1(data) {
  document.getElementById("projectTitle").textContent = data.projectTitle
  document.getElementById("principalInvestigator").textContent = data.principalInvestigator
  document.getElementById("institute").textContent = data.institute
  document.getElementById("submissionDate").textContent = data.submissionDate
  document.getElementById("budget").textContent = data.budget
  document.getElementById("duration").textContent = data.duration
  document.getElementById("proposalId").textContent = data.proposalId
  document.getElementById("overallScore").textContent = data.overallScore + "%"
  document.getElementById("riskIndex").textContent = data.riskIndex
  document.getElementById("fundDisplay").textContent = data.budget
  document.getElementById("durationDisplay").textContent = data.duration
}

// Populate Page 2
function populatePage2(data) {
  const container = document.getElementById("findingsContainer")
  container.innerHTML = ""

  data.findings.forEach((finding) => {
    const findingHTML = `
            <div class="finding-item">
                <h3>${finding.title}</h3>
                <div>
                    <span class="score">Score: ${finding.score}/100</span>
                    <span style="margin-left: 20px;">Changeable: ${finding.changeable}%</span>
                </div>
                <div class="comment">${finding.comment}</div>
                <div style="margin-top: 10px;"><strong>Recommended actions:</strong></div>
                <ul class="recommendation-list">
                    ${finding.recommendations.map((rec) => `<li>${rec}</li>`).join("")}
                </ul>
            </div>
        `
    container.innerHTML += findingHTML
  })
}

// Populate Page 3
function populatePage3(data) {
  const tbody = document.getElementById("costTableBody")
  tbody.innerHTML = ""

  let total = 0
  data.costBreakdown.forEach((item) => {
    total += item.amount
    const row = `
            <tr>
                <td>${item.label}</td>
                <td>${item.percentage}%</td>
                <td>₹ ${item.amount.toLocaleString()}</td>
            </tr>
        `
    tbody.innerHTML += row
  })

  // Add total row
  const totalRow = `
        <tr style="font-weight: bold; background-color: #f0f0f0;">
            <td>TOTAL</td>
            <td>100%</td>
            <td>₹ ${total.toLocaleString()}</td>
        </tr>
    `
  tbody.innerHTML += totalRow
}

// Create Metrics Bar Chart (Page 1)
function createMetricsChart(data) {
  const ctx = document.getElementById("metricsChart").getContext("2d")

  const chartData = {
    labels: ["Novelty", "Feasibility", "Cost", "AI Score", "Benefit to coal", "Deliverables"],
    datasets: [
      {
        label: "Score (%)",
        data: [
          data.metrics.novelty,
          data.metrics.feasibility,
          data.metrics.cost,
          data.metrics.aiScore,
          data.metrics.benefitToCoal,
          data.metrics.deliverables,
        ],
        backgroundColor: [
          metricColors.novelty,
          metricColors.feasibility,
          metricColors.cost,
          metricColors.aiScore,
          metricColors.benefitToCoal,
          metricColors.deliverables,
        ],
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  }

  new Chart(ctx, {
    type: "bar",
    data: chartData,
    options: {
      indexAxis: "x",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (value) => value + "%",
            font: {
              size: 11,
            },
          },
        },
        x: {
          ticks: {
            font: {
              size: 11,
            },
          },
        },
      },
    },
  })
}

// Create Cost Breakdown Pie Chart (Page 3)
function createCostBreakdownChart(data) {
  const ctx = document.getElementById("costBreakdownChart").getContext("2d")

  const labels = data.costBreakdown.map((item) => item.label)
  const percentages = data.costBreakdown.map((item) => item.percentage)
  const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40", "#FF6384"]

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: percentages,
          backgroundColor: colors,
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            font: {
              size: 11,
            },
            padding: 15,
          },
        },
      },
    },
  })
}

// Show error message
function showErrorMessage(message) {
  const container = document.querySelector(".container")
  container.innerHTML = `
        <div style="padding: 40px; text-align: center; background: #fff; border-radius: 8px;">
            <h2 style="color: #d9534f;">Error Loading Report</h2>
            <p>${message}</p>
            <p style="font-size: 12px; color: #999; margin-top: 20px;">
                Please ensure the backend is running at: ${API_BASE_URL}
            </p>
        </div>
    `
}
