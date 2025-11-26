"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function ProfileChart({ title, type, data, dataKey, stroke = "#3b82f6", fill = "#3b82f6" }) {
  return (
    <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-lg font-bold text-slate-900 mb-6">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        {type === "line" && (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#0f172a" }}
            />
            <Line type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={3} dot={{ fill: stroke, r: 5 }} />
          </LineChart>
        )}
        {type === "bar" && (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#0f172a" }}
            />
            <Bar dataKey={dataKey} fill={fill} radius={[8, 8, 0, 0]} />
          </BarChart>
        )}
        {type === "area" && (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#0f172a" }}
            />
            <Area type="monotone" dataKey={dataKey} fill={fill} stroke={stroke} fillOpacity={0.3} />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
