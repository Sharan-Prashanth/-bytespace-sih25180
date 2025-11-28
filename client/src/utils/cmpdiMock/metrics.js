
import { Activity, AlertTriangle, CheckCircle, DollarSign, FileText, HardHat, Map, Users } from 'lucide-react';

export const getCMPDIMetrics = async () => {
    return {
        metrics: [
            { key: 'activeProjects', title: 'Active Projects', value: 124, change: '+12', trend: 'up', icon: HardHat, color: 'blue' },
            { key: 'proposalsSubmitted', title: 'Proposals Submitted', value: 45, change: '+5', trend: 'up', icon: FileText, color: 'indigo' },
            { key: 'fundsAllocated', title: 'Funds Allocated', value: '₹450Cr', change: '+15%', trend: 'up', icon: DollarSign, color: 'emerald' },
            { key: 'safetyIncidents', title: 'Safety Incidents', value: 2, change: '-1', trend: 'down', icon: AlertTriangle, color: 'red' },
            { key: 'siteCoverage', title: 'Site Coverage', value: '1,250 km²', change: '+50 km²', trend: 'up', icon: Map, color: 'amber' },
            { key: 'staffActive', title: 'Active Staff', value: 340, change: '+8', trend: 'up', icon: Users, color: 'cyan' },
            { key: 'completedProjects', title: 'Completed Projects', value: 89, change: '+3', trend: 'up', icon: CheckCircle, color: 'green' },
            { key: 'pendingReviews', title: 'Pending Reviews', value: 12, change: '-2', trend: 'down', icon: Activity, color: 'orange' },
        ]
    };
};

export const getCMPDIMetricDetails = async (key) => {
    // Mock data for charts based on key
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const generateData = (min, max) => {
        return months.map(month => ({
            name: month,
            value: Math.floor(Math.random() * (max - min + 1)) + min
        }));
    };

    switch (key) {
        case 'activeProjects':
            return {
                chart: { type: 'area', data: generateData(100, 130) }
            };
        case 'proposalsSubmitted':
            return {
                chart: { type: 'bar', data: generateData(20, 60) }
            };
        case 'fundsAllocated':
            return {
                chart: { type: 'line', data: generateData(300, 500) }
            };
        case 'safetyIncidents':
            return {
                chart: { type: 'bar', data: generateData(0, 5) }
            };
        default:
            return {
                chart: { type: 'area', data: generateData(50, 100) }
            };
    }
};
