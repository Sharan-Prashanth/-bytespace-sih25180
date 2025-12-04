// Use real data from data.js file or fallback to sample data
let sampleData = typeof coalData !== 'undefined' ? coalData : {
    "2023": {
        "oct": {
            subsidiaries: [
                { name: "MCL", production: 15.50, target: 18.50, achievement: 83.78, growth: 2.50 }
            ],
            cil: 61.58,
            sccl: 4.50,
            total: 61.58
        }
    }
};

let charts = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    updateDashboard();
    
    // Add event listeners for filters
    document.getElementById('yearFilter').addEventListener('change', updateDashboard);
    document.getElementById('monthFilter').addEventListener('change', updateDashboard);
});

function initializeCharts() {
    // Subsidiary Bar Chart
    const ctxBar = document.getElementById('subsidiaryChart').getContext('2d');
    charts.subsidiaryChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Production (MT)',
                data: [],
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Million Tonnes' }
                }
            }
        }
    });
    
    // Market Share Pie Chart
    const ctxPie = document.getElementById('marketShareChart').getContext('2d');
    charts.marketShareChart = new Chart(ctxPie, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#667eea', '#764ba2', '#f093fb', '#4facfe',
                    '#43e97b', '#fa709a', '#fee140', '#30cfd0'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
    
    // Trend Line Chart
    const ctxLine = document.getElementById('trendChart').getContext('2d');
    charts.trendChart = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Total Production',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Million Tonnes' }
                }
            }
        }
    });
    
    // Target vs Achievement Doughnut Chart
    const ctxDoughnut = document.getElementById('targetChart').getContext('2d');
    charts.targetChart = new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
            labels: ['Achieved', 'Remaining'],
            datasets: [{
                data: [75, 25],
                backgroundColor: ['#48bb78', '#f56565']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function updateDashboard() {
    const year = document.getElementById('yearFilter').value;
    const month = document.getElementById('monthFilter').value;
    
    let data = [];
    let totalProduction = 0;
    let cilProduction = 0;
    let scclProduction = 0;
    let avgGrowth = 0;
    
    // Aggregate data based on filters
    if (year === 'all') {
        // Aggregate all years
        Object.keys(sampleData).forEach(y => {
            Object.keys(sampleData[y]).forEach(m => {
                if (month === 'all' || m.startsWith(month)) {
                    const monthData = sampleData[y][m];
                    totalProduction += monthData.total;
                    cilProduction += monthData.cil;
                    scclProduction += monthData.sccl;
                    data.push(...monthData.subsidiaries);
                }
            });
        });
    } else if (sampleData[year]) {
        if (month === 'all') {
            // All months of selected year
            Object.keys(sampleData[year]).forEach(m => {
                const monthData = sampleData[year][m];
                totalProduction += monthData.total;
                cilProduction += monthData.cil;
                scclProduction += monthData.sccl;
                data.push(...monthData.subsidiaries);
            });
        } else {
            // Specific month and year
            const monthKey = Object.keys(sampleData[year]).find(m => m.startsWith(month));
            if (monthKey && sampleData[year][monthKey]) {
                const monthData = sampleData[year][monthKey];
                totalProduction = monthData.total;
                cilProduction = monthData.cil;
                scclProduction = monthData.sccl;
                data = monthData.subsidiaries;
            }
        }
    }
    
    // Calculate average growth
    if (data.length > 0) {
        avgGrowth = data.reduce((sum, item) => sum + item.growth, 0) / data.length;
    }
    
    // Update stats cards
    document.getElementById('totalProduction').textContent = totalProduction.toFixed(2);
    document.getElementById('cilProduction').textContent = cilProduction.toFixed(2);
    document.getElementById('scclProduction').textContent = scclProduction.toFixed(2);
    const growthElem = document.getElementById('growthRate');
    growthElem.textContent = `${avgGrowth >= 0 ? '+' : ''}${avgGrowth.toFixed(2)}%`;
    growthElem.className = avgGrowth >= 0 ? 'value positive' : 'value negative';
    
    // Aggregate subsidiaries by name
    const subsidiaryMap = {};
    data.forEach(item => {
        if (!subsidiaryMap[item.name]) {
            subsidiaryMap[item.name] = { ...item, count: 1 };
        } else {
            subsidiaryMap[item.name].production += item.production;
            subsidiaryMap[item.name].target += item.target;
            subsidiaryMap[item.name].achievement += item.achievement;
            subsidiaryMap[item.name].growth += item.growth;
            subsidiaryMap[item.name].count += 1;
        }
    });
    
    // Average the values
    const aggregatedData = Object.values(subsidiaryMap).map(item => ({
        name: item.name,
        production: item.production,
        target: item.target,
        achievement: item.achievement / item.count,
        growth: item.growth / item.count
    }));
    
    // Update charts
    updateCharts(aggregatedData);
    
    // Update table
    updateTable(aggregatedData);
}

function updateCharts(data) {
    if (data.length === 0) {
        // Show empty state
        data = [{ name: 'No Data', production: 0, target: 0, achievement: 0, growth: 0 }];
    }
    
    // Update bar chart
    charts.subsidiaryChart.data.labels = data.map(d => d.name);
    charts.subsidiaryChart.data.datasets[0].data = data.map(d => d.production);
    charts.subsidiaryChart.update();
    
    // Update pie chart
    charts.marketShareChart.data.labels = data.map(d => d.name);
    charts.marketShareChart.data.datasets[0].data = data.map(d => d.production);
    charts.marketShareChart.update();
    
    // Update trend chart (showing production vs target)
    charts.trendChart.data.labels = data.map(d => d.name);
    charts.trendChart.data.datasets[0].data = data.map(d => d.production);
    charts.trendChart.update();
    
    // Update doughnut chart (avg achievement)
    const avgAchievement = data.reduce((sum, d) => sum + d.achievement, 0) / data.length;
    charts.targetChart.data.datasets[0].data = [avgAchievement, 100 - avgAchievement];
    charts.targetChart.update();
}

function updateTable(data) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">No data available</td></tr>';
        return;
    }
    
    data.forEach(item => {
        const row = document.createElement('tr');
        const growthClass = item.growth >= 0 ? 'positive' : 'negative';
        const growthSymbol = item.growth >= 0 ? '▲' : '▼';
        
        row.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td>${item.production.toFixed(2)}</td>
            <td>${item.target.toFixed(2)}</td>
            <td>${item.achievement.toFixed(2)}%</td>
            <td class="${growthClass}">${growthSymbol} ${Math.abs(item.growth).toFixed(2)}%</td>
        `;
        tbody.appendChild(row);
    });
}
