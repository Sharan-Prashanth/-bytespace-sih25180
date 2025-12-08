'use client';

import { Calendar, Moon, Sun, FileText, Clock, CheckCircle, Rocket, Plus, BarChart3, Users, Settings, AlertCircle, TrendingUp, TrendingDown, Download, FileDown, Printer, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import CalendarWidget from '../../Widgets/CalendarWidget';
import CMPDISidebar from './CMPDISidebar';

export default function CMPDIDashboardLayout({
    children,
    activeSection,
    setActiveSection,
    user,
    logout,
    theme,
    toggleTheme
}) {
    const [isMobile, setIsMobile] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Format date as "16 May, 2023"
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Mock dashboard stats
    const dashboardStats = [
        { label: 'Total Proposals', value: '1,247', change: '+12%', trend: 'up', Icon: FileText, color: 'blue' },
        { label: 'Pending Review', value: '34', change: '-5%', trend: 'down', Icon: Clock, color: 'orange' },
        { label: 'Approved', value: '892', change: '+8%', trend: 'up', Icon: CheckCircle, color: 'green' },
        { label: 'Active Projects', value: '156', change: '+15%', trend: 'up', Icon: Rocket, color: 'purple' },
    ];

    const recentActivities = [
        { title: 'New proposal submitted', user: 'Rajesh Kumar', time: '10 mins ago', type: 'new', Icon: FileText },
        { title: 'Budget approved', user: 'Priya Sharma', time: '1 hour ago', type: 'approved', Icon: CheckCircle },
        { title: 'Document updated', user: 'Amit Patel', time: '2 hours ago', type: 'update', Icon: AlertCircle },
        { title: 'Review completed', user: 'Sneha Reddy', time: '3 hours ago', type: 'completed', Icon: CheckCircle },
    ];

    const upcomingDeadlines = [
        { project: 'Highway Construction Phase 2', deadline: '15 Dec 2025', priority: 'high' },
        { project: 'Water Supply Infrastructure', deadline: '20 Dec 2025', priority: 'medium' },
        { project: 'School Building Renovation', deadline: '28 Dec 2025', priority: 'low' },
    ];

    const activeProjects = [
        { 
            id: 'PRJ001',
            name: 'Metro Rail Extension - Phase 3',
            department: 'Transportation',
            progress: 75,
            budget: '₹2,450 Cr',
            status: 'on-track',
            team: 45,
            startDate: 'Jan 2024',
            endDate: 'Dec 2025'
        },
        { 
            id: 'PRJ002',
            name: 'Smart City Infrastructure Development',
            department: 'Urban Development',
            progress: 60,
            budget: '₹1,800 Cr',
            status: 'on-track',
            team: 32,
            startDate: 'Mar 2024',
            endDate: 'Mar 2026'
        },
        { 
            id: 'PRJ003',
            name: 'Rural Electrification Program',
            department: 'Energy & Power',
            progress: 45,
            budget: '₹950 Cr',
            status: 'at-risk',
            team: 28,
            startDate: 'Feb 2024',
            endDate: 'Jan 2026'
        },
        { 
            id: 'PRJ004',
            name: 'Digital Education Initiative',
            department: 'Education',
            progress: 85,
            budget: '₹650 Cr',
            status: 'on-track',
            team: 18,
            startDate: 'Nov 2023',
            endDate: 'Jun 2025'
        },
        { 
            id: 'PRJ005',
            name: 'Waste Management & Recycling',
            department: 'Environment',
            progress: 30,
            budget: '₹420 Cr',
            status: 'delayed',
            team: 22,
            startDate: 'Apr 2024',
            endDate: 'Apr 2026'
        },
        { 
            id: 'PRJ006',
            name: 'Public Healthcare Expansion',
            department: 'Health & Welfare',
            progress: 92,
            budget: '₹1,250 Cr',
            status: 'on-track',
            team: 56,
            startDate: 'Aug 2023',
            endDate: 'Feb 2025'
        },
    ];

    // Chart Data
    const monthlyProposalsData = [
        { month: 'Jan', proposals: 85, approved: 65, rejected: 20 },
        { month: 'Feb', proposals: 92, approved: 70, rejected: 22 },
        { month: 'Mar', proposals: 78, approved: 60, rejected: 18 },
        { month: 'Apr', proposals: 105, approved: 85, rejected: 20 },
        { month: 'May', proposals: 118, approved: 95, rejected: 23 },
        { month: 'Jun', proposals: 125, approved: 100, rejected: 25 },
        { month: 'Jul', proposals: 110, approved: 88, rejected: 22 },
        { month: 'Aug', proposals: 135, approved: 110, rejected: 25 },
        { month: 'Sep', proposals: 142, approved: 118, rejected: 24 },
        { month: 'Oct', proposals: 155, approved: 130, rejected: 25 },
        { month: 'Nov', proposals: 148, approved: 125, rejected: 23 },
        { month: 'Dec', proposals: 165, approved: 140, rejected: 25 },
    ];

    const budgetAllocationData = [
        { name: 'Infrastructure', value: 3500, color: '#3b82f6' },
        { name: 'Healthcare', value: 2800, color: '#10b981' },
        { name: 'Education', value: 2200, color: '#f59e0b' },
        { name: 'Technology', value: 1800, color: '#8b5cf6' },
        { name: 'Environment', value: 1500, color: '#06b6d4' },
        { name: 'Others', value: 1200, color: '#6b7280' },
    ];

    const departmentPerformanceData = [
        { department: 'Transport', completed: 45, ongoing: 12, planned: 8 },
        { department: 'Health', completed: 38, ongoing: 15, planned: 10 },
        { department: 'Education', completed: 42, ongoing: 10, planned: 6 },
        { department: 'Urban Dev', completed: 35, ongoing: 18, planned: 12 },
        { department: 'Energy', completed: 30, ongoing: 14, planned: 9 },
        { department: 'Environment', completed: 28, ongoing: 11, planned: 7 },
    ];

    const projectTimelineData = [
        { month: 'Jan', onTime: 85, delayed: 15 },
        { month: 'Feb', onTime: 82, delayed: 18 },
        { month: 'Mar', onTime: 88, delayed: 12 },
        { month: 'Apr', onTime: 90, delayed: 10 },
        { month: 'May', onTime: 87, delayed: 13 },
        { month: 'Jun', onTime: 92, delayed: 8 },
    ];

    const isDark = theme === 'dark' || theme === 'darkest';

    const handleExportPDF = () => {
        // Create a printable version of the dashboard
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>CMPDI Dashboard Report - ${formattedDate}</title>
                <style>
                    @page { size: A4; margin: 20mm; }
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        color: #1e293b;
                        line-height: 1.6;
                    }
                    .header {
                        text-align: center;
                        padding: 20px 0;
                        border-bottom: 3px solid #ea580c;
                        margin-bottom: 30px;
                    }
                    .header h1 {
                        color: #ea580c;
                        margin: 0;
                        font-size: 28px;
                    }
                    .header .subtitle {
                        color: #64748b;
                        margin: 5px 0;
                    }
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 15px;
                        margin-bottom: 30px;
                    }
                    .stat-card {
                        background: #f8fafc;
                        border: 2px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 15px;
                    }
                    .stat-label {
                        font-size: 12px;
                        color: #64748b;
                        margin-bottom: 8px;
                    }
                    .stat-value {
                        font-size: 24px;
                        font-weight: bold;
                        color: #0f172a;
                    }
                    .stat-change {
                        font-size: 11px;
                        font-weight: 600;
                        margin-top: 5px;
                    }
                    .stat-change.up { color: #16a34a; }
                    .stat-change.down { color: #dc2626; }
                    .section {
                        margin-bottom: 30px;
                        page-break-inside: avoid;
                    }
                    .section-title {
                        font-size: 18px;
                        font-weight: bold;
                        color: #0f172a;
                        margin-bottom: 15px;
                        padding-bottom: 8px;
                        border-bottom: 2px solid #e2e8f0;
                    }
                    .project-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 15px;
                    }
                    .project-card {
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 6px;
                        padding: 15px;
                    }
                    .project-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: start;
                        margin-bottom: 10px;
                    }
                    .project-id {
                        font-size: 10px;
                        background: #e2e8f0;
                        padding: 3px 8px;
                        border-radius: 4px;
                        font-weight: 600;
                    }
                    .project-status {
                        font-size: 10px;
                        padding: 3px 8px;
                        border-radius: 4px;
                        font-weight: 600;
                    }
                    .status-on-track { background: #dcfce7; color: #16a34a; }
                    .status-at-risk { background: #fed7aa; color: #ea580c; }
                    .status-delayed { background: #fee2e2; color: #dc2626; }
                    .project-name {
                        font-size: 13px;
                        font-weight: 600;
                        margin: 8px 0;
                    }
                    .project-dept {
                        font-size: 11px;
                        color: #64748b;
                        margin-bottom: 10px;
                    }
                    .progress-bar {
                        width: 100%;
                        height: 6px;
                        background: #e2e8f0;
                        border-radius: 3px;
                        overflow: hidden;
                        margin: 10px 0;
                    }
                    .progress-fill {
                        height: 100%;
                        background: linear-gradient(90deg, #ea580c, #f97316);
                    }
                    .project-details {
                        font-size: 11px;
                        line-height: 1.8;
                    }
                    .project-details div {
                        display: flex;
                        justify-content: space-between;
                    }
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 2px solid #e2e8f0;
                        text-align: center;
                        font-size: 11px;
                        color: #64748b;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🏛️ CMPDI Dashboard Report</h1>
                    <p class="subtitle">Generated on ${formattedDate}</p>
                    <p class="subtitle">User: ${user?.fullName || 'CMPDI Admin'}</p>
                </div>

                <div class="section">
                    <h2 class="section-title">📊 Key Metrics</h2>
                    <div class="stats-grid">
                        ${dashboardStats.map(stat => `
                            <div class="stat-card">
                                <div class="stat-label">${stat.label}</div>
                                <div class="stat-value">${stat.value}</div>
                                <div class="stat-change ${stat.trend}">${stat.change}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="section">
                    <h2 class="section-title">🚀 Active Projects</h2>
                    <div class="project-grid">
                        ${activeProjects.map(project => `
                            <div class="project-card">
                                <div class="project-header">
                                    <span class="project-id">${project.id}</span>
                                    <span class="project-status status-${project.status}">
                                        ${project.status === 'on-track' ? '● On Track' :
                                          project.status === 'at-risk' ? '● At Risk' : '● Delayed'}
                                    </span>
                                </div>
                                <div class="project-name">${project.name}</div>
                                <div class="project-dept">${project.department}</div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${project.progress}%"></div>
                                </div>
                                <div class="project-details">
                                    <div><span>Progress:</span><strong>${project.progress}%</strong></div>
                                    <div><span>Budget:</span><strong>${project.budget}</strong></div>
                                    <div><span>Team:</span><strong>${project.team} members</strong></div>
                                    <div><span>Timeline:</span><strong>${project.startDate} - ${project.endDate}</strong></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="footer">
                    <p>© ${new Date().getFullYear()} CMPDI - Central Mine Planning & Design Institute Limited</p>
                    <p>This is a confidential document. Unauthorized distribution is prohibited.</p>
                </div>
            </body>
            </html>
        `;

        // Open print dialog with the content
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Wait for content to load, then print
        printWindow.onload = () => {
            printWindow.print();
        };
        
        setShowExportMenu(false);
    };

    const handleExportCSV = () => {
        // Prepare CSV data
        const csvRows = [];
        
        // Header
        csvRows.push(['CMPDI Dashboard Report']);
        csvRows.push([`Generated on: ${formattedDate}`]);
        csvRows.push([`User: ${user?.fullName || 'CMPDI Admin'}`]);
        csvRows.push([]);
        
        // Key Metrics Section
        csvRows.push(['KEY METRICS']);
        csvRows.push(['Metric', 'Value', 'Change']);
        dashboardStats.forEach(stat => {
            csvRows.push([stat.label, stat.value, stat.change]);
        });
        csvRows.push([]);
        
        // Active Projects Section
        csvRows.push(['ACTIVE PROJECTS']);
        csvRows.push(['ID', 'Name', 'Department', 'Progress (%)', 'Budget', 'Status', 'Team Size', 'Start Date', 'End Date']);
        activeProjects.forEach(project => {
            csvRows.push([
                project.id,
                project.name,
                project.department,
                project.progress,
                project.budget,
                project.status,
                project.team,
                project.startDate,
                project.endDate
            ]);
        });
        csvRows.push([]);
        
        // Monthly Proposals Data
        csvRows.push(['MONTHLY PROPOSALS TREND']);
        csvRows.push(['Month', 'Total Proposals', 'Approved', 'Rejected']);
        monthlyProposalsData.forEach(data => {
            csvRows.push([data.month, data.proposals, data.approved, data.rejected]);
        });
        csvRows.push([]);
        
        // Budget Allocation Data
        csvRows.push(['BUDGET ALLOCATION BY SECTOR']);
        csvRows.push(['Sector', 'Amount (₹ Cr)']);
        budgetAllocationData.forEach(data => {
            csvRows.push([data.name, data.value]);
        });
        
        // Convert to CSV string
        const csvContent = csvRows.map(row => 
            row.map(cell => {
                // Handle cells with commas or quotes
                const cellStr = String(cell || '');
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
            }).join(',')
        ).join('\n');
        
        // Create blob and download
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `CMPDI_Dashboard_Report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setShowExportMenu(false);
    };

    const handlePrint = () => {
        window.print();
        setShowExportMenu(false);
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'CMPDI Dashboard Report',
                text: `Dashboard Report - ${formattedDate}`,
                url: window.location.href
            }).catch(err => console.log('Error sharing:', err));
        } else {
            // Fallback: Copy link to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert('Dashboard link copied to clipboard!');
            });
        }
        setShowExportMenu(false);
    };

    return (
        <div className={`flex h-screen overflow-hidden transition-colors duration-300
            ${theme === 'darkest' ? 'bg-black text-slate-100' : 
              theme === 'dark' ? 'bg-slate-900 text-slate-100' : 
              'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900'}
        `} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
            {/* Left Sidebar */}
            <CMPDISidebar
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                onLogout={logout}
                theme={theme}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
                {/* Header */}
                <header className={`px-8 py-5 flex items-center justify-between shrink-0 relative z-20 border-b ${
                    isDark ? 'border-slate-800/50 bg-slate-900/50' : 'border-slate-200/60 bg-white/60'
                } backdrop-blur-sm`}>
                    <div className="flex-1">
                        {activeSection === 'overview' && (
                            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                                <h1 className={`text-xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Welcome, {user?.fullName || 'CMPDI Admin'}
                                </h1>
                                <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Track projects and manage resources
                                </p>
                            </div>
                        )}
                    </div>
                    
                    <div className={`flex items-center gap-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {/* Export Button - Only show on overview */}
                        {activeSection === 'overview' && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
                                        showExportMenu
                                            ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/30'
                                            : theme === 'darkest' ? 'bg-neutral-900 border border-neutral-800 text-slate-300 hover:bg-neutral-800' :
                                              theme === 'dark' ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700' :
                                              'bg-white border border-orange-200 text-slate-700 hover:bg-orange-50 shadow-sm'
                                    }`}
                                >
                                    <Download size={16} strokeWidth={2} />
                                    <span>Export</span>
                                </button>

                                {/* Export Dropdown Menu */}
                                {showExportMenu && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-30" 
                                            onClick={() => setShowExportMenu(false)}
                                        />
                                        <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-xl border z-40 ${
                                            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                                        }`}>
                                            <div className="py-2">
                                                <button
                                                    onClick={handleExportPDF}
                                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                                                        isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-orange-50 text-slate-700'
                                                    }`}
                                                >
                                                    <FileDown size={16} strokeWidth={2} />
                                                    <span>Export as PDF</span>
                                                </button>
                                                <button
                                                    onClick={handleExportCSV}
                                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                                                        isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-orange-50 text-slate-700'
                                                    }`}
                                                >
                                                    <FileDown size={16} strokeWidth={2} />
                                                    <span>Export as CSV</span>
                                                </button>
                                                <button
                                                    onClick={handlePrint}
                                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                                                        isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-orange-50 text-slate-700'
                                                    }`}
                                                >
                                                    <Printer size={16} strokeWidth={2} />
                                                    <span>Print Report</span>
                                                </button>
                                                <button
                                                    onClick={handleShare}
                                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                                                        isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-orange-50 text-slate-700'
                                                    }`}
                                                >
                                                    <Share2 size={16} strokeWidth={2} />
                                                    <span>Share Report</span>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Date Badge */}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                            isDark ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white border border-slate-200'
                        }`}>
                            <Calendar className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} strokeWidth={2} />
                            <span className="font-medium">{formattedDate}</span>
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                                theme === 'darkest' ? 'bg-neutral-900 border border-neutral-800 text-white hover:bg-neutral-800' :
                                theme === 'dark' ? 'bg-slate-800 border border-slate-700 text-white hover:bg-slate-700' :
                                'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                            }`}
                            title={theme === 'light' ? 'Switch to Dark Mode' : theme === 'dark' ? 'Switch to Darkest Mode' : 'Switch to Light Mode'}
                        >
                            {theme === 'light' ? (
                                <Moon size={18} strokeWidth={2} />
                            ) : theme === 'dark' ? (
                                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
                                </svg>
                            ) : (
                                <Sun size={18} strokeWidth={2} />
                            )}
                        </button>

                        {/* Calendar Widget Trigger */}
                        <div className="relative">
                            <button
                                onClick={() => setShowCalendar(!showCalendar)}
                                className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                                    showCalendar
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                        : theme === 'darkest' ? 'bg-neutral-900 border border-neutral-800 text-slate-200 hover:bg-neutral-800' :
                                          theme === 'dark' ? 'bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700' :
                                          'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
                                }`}
                            >
                                <Calendar size={18} strokeWidth={2} />
                            </button>

                            {showCalendar && (
                                <CalendarWidget onClose={() => setShowCalendar(false)} theme={theme} />
                            )}
                        </div>
                    </div>
                </header>
                {/* Content - Scrollable based on section */}
                <main className={`flex-1 px-8 py-6 transition-all duration-300 ${
                    activeSection === 'overview' ? 'overflow-hidden' : 'overflow-y-auto h-full'
                }`}>
                    {activeSection === 'overview' ? (
                        <div className="h-full overflow-y-auto">
                            <div className="space-y-6 max-w-[1600px] mx-auto pb-6">
                                {/* Stats Grid - MOVED TO FIRST */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                    {dashboardStats.map((stat, index) => (
                                        <div
                                            key={index}
                                            className={`rounded-xl p-6 border transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                                                isDark 
                                                    ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800' 
                                                    : 'bg-white border-slate-200 hover:shadow-lg'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${
                                                    stat.color === 'blue' ? isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600' :
                                                    stat.color === 'orange' ? isDark ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600' :
                                                    stat.color === 'green' ? isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600' :
                                                    isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'
                                                }`}>
                                                    <stat.Icon size={20} strokeWidth={2} />
                                                </div>
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 ${
                                                    stat.trend === 'up' 
                                                        ? 'bg-green-500/10 text-green-600' 
                                                        : 'bg-red-500/10 text-red-600'
                                                }`}>
                                                    {stat.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                    {stat.change}
                                                </span>
                                            </div>
                                            <p className={`text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                                {stat.label}
                                            </p>
                                            <p className={`text-3xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                {stat.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                          
                                
                                {/* Charts Section */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Monthly Proposals Trend */}
                                    <div className={`rounded-xl p-6 border ${
                                        isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
                                    }`}>
                                        <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            Monthly Proposals Trend
                                        </h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <AreaChart data={monthlyProposalsData}>
                                                <defs>
                                                    <linearGradient id="colorProposals" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                    </linearGradient>
                                                    <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                                                <XAxis dataKey="month" stroke={isDark ? '#94a3b8' : '#64748b'} style={{ fontSize: '12px' }} />
                                                <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} style={{ fontSize: '12px' }} />
                                                <Tooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                                        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                                                        borderRadius: '8px',
                                                        fontSize: '12px'
                                                    }}
                                                />
                                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                                <Area type="monotone" dataKey="proposals" stroke="#3b82f6" strokeWidth={2} fill="url(#colorProposals)" name="Total Proposals" />
                                                <Area type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} fill="url(#colorApproved)" name="Approved" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Budget Allocation */}
                                    <div className={`rounded-xl p-6 border ${
                                        isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
                                    }`}>
                                        <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            Budget Allocation by Sector (₹ Cr)
                                        </h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={budgetAllocationData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={100}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {budgetAllocationData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                                        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                                                        borderRadius: '8px',
                                                        fontSize: '12px'
                                                    }}
                                                    formatter={(value) => `₹${value} Cr`}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Department Performance */}
                                    <div className={`rounded-xl p-6 border ${
                                        isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
                                    }`}>
                                        <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            Department Performance
                                        </h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={departmentPerformanceData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                                                <XAxis dataKey="department" stroke={isDark ? '#94a3b8' : '#64748b'} style={{ fontSize: '11px' }} />
                                                <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} style={{ fontSize: '12px' }} />
                                                <Tooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                                        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                                                        borderRadius: '8px',
                                                        fontSize: '12px'
                                                    }}
                                                />
                                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                                <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="ongoing" fill="#3b82f6" name="Ongoing" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="planned" fill="#f59e0b" name="Planned" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Project Timeline Performance */}
                                    <div className={`rounded-xl p-6 border ${
                                        isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
                                    }`}>
                                        <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            Project Timeline Performance (%)
                                        </h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={projectTimelineData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                                                <XAxis dataKey="month" stroke={isDark ? '#94a3b8' : '#64748b'} style={{ fontSize: '12px' }} />
                                                <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} style={{ fontSize: '12px' }} />
                                                <Tooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                                        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                                                        borderRadius: '8px',
                                                        fontSize: '12px'
                                                    }}
                                                    formatter={(value) => `${value}%`}
                                                />
                                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                                <Line type="monotone" dataKey="onTime" stroke="#10b981" strokeWidth={3} name="On Time" dot={{ r: 4 }} />
                                                <Line type="monotone" dataKey="delayed" stroke="#ef4444" strokeWidth={3} name="Delayed" dot={{ r: 4 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                {/* Two Column Layout */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Recent Activities */}
                                    <div className={`lg:col-span-2 rounded-xl p-6 border ${
                                        isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
                                    }`}>
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                Recent Activities
                                            </h3>
                                            <button className={`text-sm font-medium transition-colors ${
                                                isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                                            }`}>
                                                View All →
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {recentActivities.map((activity, index) => (
                                                <div
                                                    key={index}
                                                    className={`flex items-start gap-4 p-4 rounded-lg transition-colors border ${
                                                        isDark ? 'hover:bg-slate-700/30 border-slate-700/30' : 'hover:bg-slate-50 border-slate-100'
                                                    }`}
                                                >
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                                        activity.type === 'new' ? isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600' :
                                                        activity.type === 'approved' ? isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600' :
                                                        activity.type === 'update' ? isDark ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600' :
                                                        isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'
                                                    }`}>
                                                        <activity.Icon size={18} strokeWidth={2} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                            {activity.title}
                                                        </p>
                                                        <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                                            by {activity.user}
                                                        </p>
                                                    </div>
                                                    <span className={`text-xs font-medium whitespace-nowrap ${
                                                        isDark ? 'text-slate-500' : 'text-slate-500'
                                                    }`}>
                                                        {activity.time}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Upcoming Deadlines */}
                                    <div className={`rounded-xl p-6 border ${
                                        isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
                                    }`}>
                                        <h3 className={`text-base font-semibold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            Upcoming Deadlines
                                        </h3>
                                        <div className="space-y-4">
                                            {upcomingDeadlines.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className={`p-4 rounded-lg border-l-4 ${
                                                        item.priority === 'high' ? 'border-red-500 bg-red-500/5' :
                                                        item.priority === 'medium' ? 'border-orange-500 bg-orange-500/5' :
                                                        'border-green-500 bg-green-500/5'
                                                    }`}
                                                >
                                                    <p className={`font-medium text-sm mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                        {item.project}
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-xs flex items-center gap-1.5 ${
                                                            isDark ? 'text-slate-400' : 'text-slate-600'
                                                        }`}>
                                                            <Calendar size={12} />
                                                            {item.deadline}
                                                        </span>
                                                        <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${
                                                            item.priority === 'high' ? 'bg-red-500/10 text-red-600' :
                                                            item.priority === 'medium' ? 'bg-orange-500/10 text-orange-600' :
                                                            'bg-green-500/10 text-green-600'
                                                        }`}>
                                                            {item.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>


                               


                                {/* Active Projects Section */}
                                <div className={`rounded-xl p-6 border ${
                                    isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
                                }`}>
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                Active Projects
                                            </h3>
                                            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                                Currently ongoing initiatives across departments
                                            </p>
                                        </div>
                                        <button className={`text-sm font-medium transition-colors ${
                                            isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                                        }`}>
                                            View All Projects →
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {activeProjects.map((project, index) => (
                                            <div
                                                key={index}
                                                className={`p-5 rounded-lg border transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
                                                    isDark 
                                                        ? 'bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50' 
                                                        : 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-md'
                                                }`}
                                            >
                                                {/* Project Header */}
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                                                isDark ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-700'
                                                            }`}>
                                                                {project.id}
                                                            </span>
                                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                                                project.status === 'on-track' ? 'bg-green-500/10 text-green-600' :
                                                                project.status === 'at-risk' ? 'bg-orange-500/10 text-orange-600' :
                                                                'bg-red-500/10 text-red-600'
                                                            }`}>
                                                                {project.status === 'on-track' ? '● On Track' :
                                                                 project.status === 'at-risk' ? '● At Risk' : '● Delayed'}
                                                            </span>
                                                        </div>
                                                        <h4 className={`text-sm font-semibold leading-tight ${
                                                            isDark ? 'text-white' : 'text-slate-900'
                                                        }`}>
                                                            {project.name}
                                                        </h4>
                                                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                                            {project.department}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="mb-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className={`text-xs font-medium ${
                                                            isDark ? 'text-slate-400' : 'text-slate-600'
                                                        }`}>
                                                            Progress
                                                        </span>
                                                        <span className={`text-xs font-semibold ${
                                                            isDark ? 'text-white' : 'text-slate-900'
                                                        }`}>
                                                            {project.progress}%
                                                        </span>
                                                    </div>
                                                    <div className={`w-full h-2 rounded-full overflow-hidden ${
                                                        isDark ? 'bg-slate-600' : 'bg-slate-200'
                                                    }`}>
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-500 ${
                                                                project.progress >= 75 ? 'bg-green-500' :
                                                                project.progress >= 50 ? 'bg-blue-500' :
                                                                project.progress >= 25 ? 'bg-orange-500' : 'bg-red-500'
                                                            }`}
                                                            style={{ width: `${project.progress}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Project Details */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                                            Budget
                                                        </span>
                                                        <span className={`text-xs font-semibold ${
                                                            isDark ? 'text-white' : 'text-slate-900'
                                                        }`}>
                                                            {project.budget}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                                            Team Size
                                                        </span>
                                                        <span className={`text-xs font-semibold flex items-center gap-1 ${
                                                            isDark ? 'text-white' : 'text-slate-900'
                                                        }`}>
                                                            <Users size={12} />
                                                            {project.team} members
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                                            Timeline
                                                        </span>
                                                        <span className={`text-xs font-medium ${
                                                            isDark ? 'text-slate-300' : 'text-slate-700'
                                                        }`}>
                                                            {project.startDate} - {project.endDate}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        children
                    )}
                </main>
            </div>
        </div>
    );
}