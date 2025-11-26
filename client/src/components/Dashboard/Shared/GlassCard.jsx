'use client';

export default function GlassCard({ children, className = '', gradient = false }) {
    return (
        <div
            className={`
        relative overflow-hidden rounded-[24px] border border-white/40 shadow-xl backdrop-blur-xl
        ${gradient
                    ? 'bg-gradient-to-br from-white/40 to-white/10'
                    : 'bg-white/60'
                }
        ${className}
      `}
        >
            {/* Subtle shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-50 pointer-events-none"></div>

            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
