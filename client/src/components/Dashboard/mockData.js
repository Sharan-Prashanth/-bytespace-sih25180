export const mockDashboardData = {
    stats: {
        totalUsers: {
            id: 'totalUsers',
            value: "12,450",
            trend: "up",
            trendValue: "+12%",
            label: "Total Users",
            color: "blue",
            sparkline: [10, 15, 12, 20, 18, 25, 22, 30, 28, 35, 40, 45]
        },
        totalProposals: {
            id: 'totalProposals',
            value: "385",
            trend: "up",
            trendValue: "+5%",
            label: "Total Proposals",
            color: "purple",
            sparkline: [5, 8, 6, 12, 10, 15, 12, 18, 20, 25, 22, 28]
        },
        activeProjects: {
            id: 'activeProjects',
            value: "42",
            trend: "neutral",
            trendValue: "Stable",
            label: "Active Projects",
            color: "green",
            sparkline: [2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 7, 7]
        },
        pendingReview: {
            id: 'pendingReview',
            value: "18",
            trend: "down",
            trendValue: "-2%",
            label: "Pending Review",
            color: "orange",
            sparkline: [8, 7, 6, 5, 6, 4, 3, 5, 4, 3, 2, 2]
        },
        approvedProposals: {
            id: 'approvedProposals',
            value: "156",
            trend: "up",
            trendValue: "+8%",
            label: "Approved Proposals",
            color: "emerald",
            sparkline: [10, 12, 15, 14, 18, 20, 22, 25, 28, 30, 32, 35]
        },
        rejectedProposals: {
            id: 'rejectedProposals',
            value: "89",
            trend: "down",
            trendValue: "-5%",
            label: "Rejected Proposals",
            color: "red",
            sparkline: [15, 14, 12, 10, 8, 6, 5, 4, 6, 5, 4, 3]
        },
        drafts: {
            id: 'drafts',
            value: "45",
            trend: "up",
            trendValue: "+3%",
            label: "Drafts",
            color: "slate",
            sparkline: [5, 6, 8, 7, 9, 10, 12, 11, 13, 15, 14, 16]
        },
        avgReviewTime: {
            id: 'avgReviewTime',
            value: "12 Days",
            trend: "down",
            trendValue: "-1 Day",
            label: "Avg. Review Time",
            color: "indigo",
            sparkline: [15, 14, 13, 12, 12, 11, 10, 12, 11, 10, 9, 8]
        }
    },
    charts: {
        totalUsers: {
            title: "User Growth Overview",
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            datasets: [
                {
                    label: "New Users",
                    data: [150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700],
                    backgroundColor: "#3B82F6"
                }
            ]
        },
        totalProposals: {
            title: "Proposal Status Overview",
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            datasets: [
                {
                    label: "Approved",
                    data: [12, 15, 18, 20, 22, 25, 28, 30, 32, 35, 38, 40],
                    backgroundColor: "#10B981"
                },
                {
                    label: "Rejected",
                    data: [5, 4, 6, 5, 4, 3, 5, 4, 3, 2, 4, 3],
                    backgroundColor: "#EF4444"
                },
                {
                    label: "Pending",
                    data: [8, 10, 12, 15, 14, 18, 16, 14, 12, 10, 8, 6],
                    backgroundColor: "#F59E0B"
                }
            ]
        },
        activeProjects: {
            title: "Active Projects Timeline",
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            datasets: [
                {
                    label: "Active Projects",
                    data: [20, 22, 25, 28, 30, 35, 38, 40, 42, 45, 48, 50],
                    backgroundColor: "#10B981"
                }
            ]
        },
        pendingReview: {
            title: "Pending Reviews Trend",
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            datasets: [
                {
                    label: "Pending Review",
                    data: [15, 18, 20, 18, 16, 14, 12, 15, 18, 20, 18, 16],
                    backgroundColor: "#F59E0B"
                }
            ]
        }
    },
    userDistribution: [
        { name: "Investigators", value: 4500, color: "#3B82F6" },
        { name: "Experts", value: 1200, color: "#10B981" },
        { name: "CMPDI", value: 800, color: "#F59E0B" },
        { name: "TSSRC", value: 300, color: "#8B5CF6" },
        { name: "SSRC", value: 150, color: "#EF4444" }
    ]
};
