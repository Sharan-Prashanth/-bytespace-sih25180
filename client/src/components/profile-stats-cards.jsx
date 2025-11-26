"use client";

export function StatCard({ label, value, change, trend, icon }) {
  return (
    <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-500 relative overflow-hidden group hover:-translate-y-1">
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          </div>
          {icon && (
            <div className="text-blue-600 bg-blue-50 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
              {icon}
            </div>
          )}
        </div>

        {change && (
          <div
            className={`flex items-center gap-1 text-sm font-bold ${trend === "up" ? "text-emerald-600" : "text-red-600"
              }`}
          >
            {trend === "up" ? (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8L5.586 19.414"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 17h8m0 0V9m0 8L5.586 4.586"
                />
              </svg>
            )}
            {change}
          </div>
        )}
      </div>
    </div>
  );
}
