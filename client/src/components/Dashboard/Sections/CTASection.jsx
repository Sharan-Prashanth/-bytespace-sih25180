'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import GlassCard from '../Shared/GlassCard';

export default function CTASection() {
    return (
        <GlassCard className="p-8 relative overflow-hidden group">
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-3 border border-blue-100">
                        <Sparkles size={12} />
                        <span>PREMIUM FEATURE</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Upgrade to Pro Analytics</h3>
                    <p className="text-gray-500 max-w-md">
                        Unlock advanced AI-driven insights, unlimited proposal tracking, and custom reporting tools.
                    </p>
                </div>

                <button className="group relative px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold overflow-hidden transition-all hover:shadow-lg hover:shadow-blue-500/25">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center gap-2">
                        <span>Upgrade Now</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                </button>
            </div>
        </GlassCard>
    );
}
