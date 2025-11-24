import { useState } from 'react';

const ServicesContent = () => {
    const [activeServiceTab, setActiveServiceTab] = useState('rd');

    const rdServices = [
        {
            title: "Proposal Submission",
            desc: "Streamlined online submission process with intelligent form validation and real-time status tracking.",
            icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
            gradient: "from-blue-500 to-indigo-600",
            bgGradient: "from-blue-50 to-indigo-50"
        },
        {
            title: "Expert Review",
            desc: "Rigorous peer review system powered by AI analytics and domain experts for comprehensive evaluation.",
            icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
            gradient: "from-emerald-500 to-teal-600",
            bgGradient: "from-emerald-50 to-teal-50"
        },
        {
            title: "Progress Tracking",
            desc: "Real-time monitoring dashboard with milestone tracking, deliverable management, and performance analytics.",
            icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
            gradient: "from-purple-500 to-pink-600",
            bgGradient: "from-purple-50 to-pink-50"
        },
        {
            title: "Collaboration Hub",
            desc: "Connect with researchers, institutions, and industry partners across the nation for collaborative innovation.",
            icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
            gradient: "from-orange-500 to-red-600",
            bgGradient: "from-orange-50 to-red-50"
        }
    ];

    const supportServices = [
        {
            title: "Literature Support",
            desc: "Access to a vast repository of research papers, journals, and academic resources with advanced search.",
            icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
            gradient: "from-indigo-500 to-blue-600",
            bgGradient: "from-indigo-50 to-blue-50"
        },
        {
            title: "Lab Resources",
            desc: "Book advanced laboratory equipment, facilities, and technical infrastructure with seamless scheduling.",
            icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
            gradient: "from-teal-500 to-cyan-600",
            bgGradient: "from-teal-50 to-cyan-50"
        },
        {
            title: "Innovation Hub",
            desc: "Incubation support for breakthrough technologies with mentorship, resources, and commercialization guidance.",
            icon: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z",
            gradient: "from-pink-500 to-rose-600",
            bgGradient: "from-pink-50 to-rose-50"
        },
        {
            title: "Funding Support",
            desc: "Comprehensive guidance on securing grants, financial aid, and investment opportunities for research projects.",
            icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
            gradient: "from-cyan-500 to-blue-600",
            bgGradient: "from-cyan-50 to-blue-50"
        }
    ];

    const currentServices = activeServiceTab === 'rd' ? rdServices : supportServices;

    return (
        <div className="w-full max-w-6xl mx-auto">
            {/* Tab Switcher */}
            <div className="flex justify-center mb-8">
                <div className="relative bg-white p-1.5 rounded-2xl shadow-lg border border-slate-200 inline-flex">
                    {/* Animated Background Slider */}
                    <div
                        className={`absolute top-1.5 bottom-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl transition-all duration-500 ease-out shadow-lg ${activeServiceTab === 'rd' ? 'left-1.5 right-[50%]' : 'left-[50%] right-1.5'
                            }`}
                    />

                    <button
                        onClick={() => setActiveServiceTab('rd')}
                        className={`relative z-10 px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeServiceTab === 'rd' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            R&D Services
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveServiceTab('support')}
                        className={`relative z-10 px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeServiceTab === 'support' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            Research Support
                        </span>
                    </button>
                </div>
            </div>

            {/* Services Grid */}
            <div className="grid md:grid-cols-2 gap-5">
                {currentServices.map((item, idx) => (
                    <div
                        key={`${activeServiceTab}-${idx}`}
                        className="group relative bg-white rounded-2xl p-5 shadow-md border border-slate-100 hover:shadow-2xl hover:border-blue-200 transition-all duration-500 cursor-pointer overflow-hidden"
                        style={{ animationDelay: `${idx * 100}ms` }}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${item.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                        <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />

                        <div className="relative z-10">
                            <div className={`w-12 h-12 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                </svg>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                                {item.title}
                            </h3>

                            <p className="text-slate-600 leading-relaxed text-sm mb-3 group-hover:text-slate-700 transition-colors duration-300">
                                {item.desc}
                            </p>

                            <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                <span>Learn more</span>
                                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </div>
                        </div>

                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100/50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ServicesContent;