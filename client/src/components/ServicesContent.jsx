import { useState } from 'react';

const ServicesContent = () => {
    const [activeServiceTab, setActiveServiceTab] = useState('rd');

    const rdServices = [
        {
            title: "Proposal Submission",
            desc: "Submit research proposals through our guided digital interface with government-approved templates and real-time validation.",
            icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
            tag: "Core Service"
        },
        {
            title: "Expert Evaluation",
            desc: "Multi-tier review process by domain experts and AI-powered assessment ensuring fair, transparent, and merit-based evaluation.",
            icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
            tag: "Quality Assurance"
        },
        {
            title: "Progress Monitoring",
            desc: "Track project milestones, deliverables, and fund utilization through real-time dashboards and automated reporting.",
            icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
            tag: "Analytics"
        },
        {
            title: "Collaboration Hub",
            desc: "Connect with researchers, academic institutions, and industry partners across India for collaborative research initiatives.",
            icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
            tag: "Networking"
        }
    ];

    const supportServices = [
        {
            title: "Research Literature",
            desc: "Access curated repositories of scientific papers, coal industry journals, and technical documentation for comprehensive research.",
            icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
            tag: "Knowledge Base"
        },
        {
            title: "Laboratory Access",
            desc: "Book advanced laboratory equipment and testing facilities at partner institutions with integrated scheduling and resource management.",
            icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
            tag: "Infrastructure"
        },
        {
            title: "Innovation Incubation",
            desc: "End-to-end incubation support for breakthrough technologies including mentorship, prototyping, and commercialization pathways.",
            icon: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z",
            tag: "Incubation"
        },
        {
            title: "Grant Assistance",
            desc: "Expert guidance on securing government grants, industry funding, and institutional support for your research projects.",
            icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
            tag: "Funding"
        }
    ];

    const currentServices = activeServiceTab === 'rd' ? rdServices : supportServices;

    return (
        <div className="w-full max-w-6xl mx-auto">
            {/* Tab Switcher - Government Style */}
            <div className="flex justify-center mb-10">
                <div className="relative bg-slate-100 p-1 rounded-xl inline-flex border border-slate-200">
                    <button
                        onClick={() => setActiveServiceTab('rd')}
                        className={`relative z-10 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                            activeServiceTab === 'rd' 
                                ? 'bg-white text-slate-900 shadow-md' 
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        R&D Services
                    </button>
                    <button
                        onClick={() => setActiveServiceTab('support')}
                        className={`relative z-10 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                            activeServiceTab === 'support' 
                                ? 'bg-white text-slate-900 shadow-md' 
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Research Support
                    </button>
                </div>
            </div>

            {/* Services Grid - Professional Card Design */}
            <div className="grid md:grid-cols-2 gap-6">
                {currentServices.map((item, idx) => (
                    <div
                        key={`${activeServiceTab}-${idx}`}
                        className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 overflow-hidden"
                    >
                        <div className="p-6">
                            {/* Header with Icon and Tag */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors duration-300">
                                    <svg className="w-6 h-6 text-slate-600 group-hover:text-blue-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                                    </svg>
                                </div>
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-semibold rounded-full uppercase tracking-wider group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors duration-300">
                                    {item.tag}
                                </span>
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                                {item.title}
                            </h3>

                            {/* Description */}
                            <p className="text-slate-500 text-sm leading-relaxed mb-4">
                                {item.desc}
                            </p>

                            {/* Footer Link */}
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <a href="#" className="text-sm text-blue-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:text-blue-700">
                                    Learn more
                                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </a>
                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Available
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};

export default ServicesContent;