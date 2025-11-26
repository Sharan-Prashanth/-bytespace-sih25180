export function StatCard({ label, value, change, trend, icon }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
        </div>
        {icon && <div className="text-primary">{icon}</div>}
      </div>
      {change && (
        <div
          className={`flex items-center gap-1 text-sm font-medium ${trend === "up" ? "text-teal-600" : "text-red-600"}`}
        >
          {trend === "up" ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8L5.586 19.414" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8L5.586 4.586" />
            </svg>
          )}
          {change}
        </div>
      )}
    </div>
  )
}
