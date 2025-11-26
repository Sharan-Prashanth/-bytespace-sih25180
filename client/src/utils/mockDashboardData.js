import { Activity, Award, Briefcase, CheckCircle, Clock, DollarSign, FileText, Globe, Layers, PieChart, TrendingUp, Users, XCircle } from 'lucide-react';

// Helper to generate random data for charts
const generateChartData = (length = 12, min = 10, max = 100) => {
    return Array.from({ length }, (_, i) => ({
        name: new Date(0, i).toLocaleString('default', { month: 'short' }),
        value: Math.floor(Math.random() * (max - min + 1)) + min,
    }));
};

const METRICS = [
    {
        key: 'proposals_submitted',
        title: 'Proposals Submitted',
        value: 1432,
        trend: 12.5,
        description: 'Total proposals submitted YTD',
        icon: FileText,
        color: 'blue',
        chartType: 'bar',
        data: generateChartData(12, 50, 200)
    },
    {
        key: 'proposals_reviewed',
        title: 'Proposals Reviewed',
        value: 856,
        trend: 8.2,
        description: 'Proposals reviewed this year',
        icon: CheckCircle,
        color: 'emerald',
        chartType: 'area',
        data: generateChartData(12, 40, 150)
    },
    {
        key: 'proposals_rejected',
        title: 'Rejected Proposals',
        value: 120,
        trend: -5.4,
        description: 'Proposals rejected this year',
        icon: XCircle,
        color: 'red',
        chartType: 'bar',
        data: generateChartData(12, 5, 30)
    },
    {
        key: 'proposals_funded',
        title: 'Funded Proposals',
        value: 320,
        trend: 9.1,
        description: 'Proposals funded this year',
        icon: DollarSign,
        color: 'green',
        chartType: 'line',
        data: generateChartData(12, 10, 50)
    },
    {
        key: 'proposals_in_progress',
        title: 'Proposals In Progress',
        value: 210,
        trend: 2.5,
        description: 'Active projects in progress',
        icon: Layers,
        color: 'indigo',
        chartType: 'bar',
        data: generateChartData(12, 15, 40)
    },
    {
        key: 'projects_in_progress',
        title: 'Active Projects',
        value: 85,
        trend: 4.0,
        description: 'Ongoing funded projects',
        icon: Briefcase,
        color: 'purple',
        chartType: 'area',
        data: generateChartData(12, 60, 90)
    },
    {
        key: 'total_funds_allocated_annual',
        title: 'Funds Allocated',
        value: '$4.2M',
        trend: 15.0,
        description: 'Total funds allocated this year',
        icon: PieChart,
        color: 'green',
        chartType: 'bar',
        data: generateChartData(12, 200, 500)
    },
    {
        key: 'institutes_participating',
        title: 'Participating Institutes',
        value: 145,
        trend: 6.5,
        description: 'Institutes with active proposals',
        icon: Globe,
        color: 'cyan',
        chartType: 'bar',
        data: generateChartData(12, 100, 150)
    },
    {
        key: 'active_reviewers',
        title: 'Active Reviewers',
        value: 64,
        trend: 0.0,
        description: 'Reviewers currently assigned',
        icon: Users,
        color: 'orange',
        chartType: 'line',
        data: generateChartData(12, 50, 70)
    },
    {
        key: 'avg_review_time_days',
        title: 'Avg Review Time',
        value: '14 Days',
        trend: -10.5, // Negative is good here, but we'll handle color logic in component
        description: 'Average days to complete review',
        icon: Clock,
        color: 'amber',
        chartType: 'line',
        data: generateChartData(12, 10, 20)
    },
    {
        key: 'efficiency_score',
        title: 'Efficiency Score',
        value: '94%',
        trend: 2.1,
        description: 'Overall system efficiency',
        icon: Activity,
        color: 'teal',
        chartType: 'area',
        data: generateChartData(12, 80, 100)
    },
    {
        key: 'success_rate',
        title: 'Success Rate',
        value: '22%',
        trend: 1.5,
        description: 'Proposal acceptance rate',
        icon: Award,
        color: 'pink',
        chartType: 'line',
        data: generateChartData(12, 15, 30)
    },
    {
        key: 'submissions_this_month',
        title: 'Submissions (Mo)',
        value: 128,
        trend: 18.2,
        description: 'Proposals submitted this month',
        icon: TrendingUp,
        color: 'blue',
        chartType: 'bar',
        data: generateChartData(30, 1, 10) // Daily data for month
    },
    {
        key: 'funds_distributed',
        title: 'Funds Distributed',
        value: '$1.8M',
        trend: 12.0,
        description: 'Funds released to institutes',
        icon: DollarSign,
        color: 'emerald',
        chartType: 'bar',
        data: generateChartData(12, 100, 300)
    },
    {
        key: 'pending_reviews',
        title: 'Pending Reviews',
        value: 45,
        trend: -2.0,
        description: 'Proposals awaiting review',
        icon: Clock,
        color: 'orange',
        chartType: 'bar',
        data: generateChartData(12, 30, 60)
    },
    {
        key: 'top_region',
        title: 'Top Region',
        value: 'North',
        trend: 0,
        description: 'Region with most submissions',
        icon: Globe,
        color: 'indigo',
        chartType: 'bar',
        data: generateChartData(12, 50, 100)
    }
];

export const getMetrics = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { metrics: METRICS };
};

export const getMetricDetails = async (key, range = 'year') => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const metric = METRICS.find(m => m.key === key);

    if (!metric) return null;

    return {
        metric_key: metric.key,
        summary: {
            value: metric.value,
            trend: metric.trend,
            last_updated: new Date().toISOString()
        },
        kpis: {
            this_year: typeof metric.value === 'number' ? metric.value : 1000, // Fallback for string values
            vs_last_year_pct: metric.trend,
            institutes_participating: 67,
            avg_monthly: Math.floor(Math.random() * 100)
        },
        chart: {
            type: metric.chartType,
            data: metric.data
        },
        breakdown_endpoint: `/api/proposals?metric=${key}`
    };
};
