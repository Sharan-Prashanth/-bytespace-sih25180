export default function ProcessFlow() {
    const steps = [
        {
            number: 1,
            title: "Submit Proposal",
            description: "Register on the portal and submit your research proposal using government-approved templates and guided forms.",
            timeline: "Day 1",
            icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
        },
        {
            number: 2,
            title: "Initial Screening",
            description: "Proposals undergo eligibility verification and completeness check by the NaCCER review committee.",
            timeline: "5 Days",
            icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        },
        {
            number: 3,
            title: "Expert Evaluation",
            description: "Domain experts assess technical merit, feasibility, and alignment with coal industry priorities.",
            timeline: "15-30 Days",
            icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        },
        {
            number: 4,
            title: "Funding Approval",
            description: "Approved projects receive funding allocation and proceed to implementation with ongoing monitoring.",
            timeline: "45-60 Days",
            icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
        }
    ];

    return (
        <section className="py-20 bg-white relative overflow-hidden">
            {/* Subtle background pattern matching other sections */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_1px,transparent_1px),linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] [background-size:4rem_4rem] opacity-60"></div>
            
            {/* Decorative gradient orbs */}
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-100/40 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-100/40 rounded-full blur-3xl"></div>

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                {/* Section Header - Government Style */}
                <div className="mb-16">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-blue-600"></div>
                        <span className="text-blue-600 font-semibold text-sm tracking-wide uppercase">How It Works</span>
                        <div className="h-px w-12 bg-gradient-to-l from-transparent to-blue-600"></div>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-4">Research Proposal Lifecycle</h2>
                    <p className="text-slate-600 text-center max-w-2xl mx-auto text-lg">
                        A transparent, merit-based evaluation process from submission to funding approval under the Ministry of Coal.
                    </p>
                    {/* Accent underline */}
                    <div className="flex justify-center mt-6">
                        <div className="h-1 w-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 rounded-full"></div>
                    </div>
                </div>

                {/* Process Timeline Container */}
                <div className="relative">
                    {/* Enhanced Connecting Line (Desktop) */}
                    <div className="hidden lg:block absolute top-24 left-[12%] right-[12%]">
                        {/* Main gradient line */}
                        <div className="h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-400 rounded-full shadow-sm"></div>
                        {/* Glow effect */}
                        <div className="h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-400 rounded-full blur-sm -mt-1 opacity-50"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 relative">
                        {steps.map((step, index) => (
                            <div key={index} className="relative group">
                                {/* Step Card */}
                                <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 h-full relative z-10">
                                    {/* Step Number Badge */}
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 text-white font-bold flex items-center justify-center shadow-lg group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300">
                                            {String(step.number).padStart(2, '0')}
                                        </div>
                                        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            {step.timeline}
                                        </span>
                                    </div>

                                    {/* Icon */}
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-blue-50 transition-colors">
                                        <svg className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
                                        </svg>
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                                        {step.title}
                                    </h3>

                                    <p className="text-slate-500 text-sm leading-relaxed">
                                        {step.description}
                                    </p>

                                    {/* Progress indicator */}
                                    <div className="mt-5 pt-4 border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden`}>
                                                <div 
                                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${(index + 1) * 25}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-medium text-slate-400">{(index + 1) * 25}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Enhanced Connector Node (Desktop) */}
                                {index < steps.length - 1 && (
                                    <div className="hidden lg:flex absolute top-[88px] -right-3 z-20 items-center">
                                        {/* Arrow connector */}
                                        <div className="relative flex items-center">
                                            {/* Outer ring with gradient */}
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                                {/* Inner white circle */}
                                                <div className="w-3 h-3 bg-white rounded-full"></div>
                                            </div>
                                            {/* Arrow pointer */}
                                            <div className="absolute -right-1 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-indigo-600"></div>
                                        </div>
                                    </div>
                                )}

                                {/* Mobile Connector */}
                                {index < steps.length - 1 && (
                                    <div className="lg:hidden flex justify-center py-4">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="w-0.5 h-6 bg-gradient-to-b from-blue-400 to-indigo-500"></div>
                                            <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a.75.75 0 01-.53-.22l-4.5-4.5a.75.75 0 111.06-1.06L10 16.19l3.97-3.97a.75.75 0 111.06 1.06l-4.5 4.5A.75.75 0 0110 18z" clipRule="evenodd"/>
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
