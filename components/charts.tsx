"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  Treemap,
  XAxis,
  YAxis
} from "recharts";

export function TrendChart({ data }: { data: { year: number; publications: number; citations: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="publications" stroke="#17406d" strokeWidth={2} />
        <Line type="monotone" dataKey="citations" stroke="#0f9f6e" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DepartmentChart({ data }: { data: { department: string; srs: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="department" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="srs" fill="#17406d" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LecturerBarChart({ data, metric }: { data: { name: string; publications?: number; citations?: number; srs?: number }[]; metric: "publications" | "citations" | "srs" }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey={metric} fill={metric === "citations" ? "#0f766e" : "#17406d"} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function QuartileChart({ data }: { data: { name: string; value: number }[] }) {
  const colors = ["#17406d", "#0f9f6e", "#b7791f", "#c2410c"];
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
          {data.map((_, index) => (
            <Cell key={colors[index]} fill={colors[index]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function AreaDistributionChart({ data }: { data: { name: string; value: number }[] }) {
  return <QuartileChart data={data} />;
}

export function AnnualCitationAreaChart({ data }: { data: { year: number; citations: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="citations" stroke="#0f766e" fill="#99f6e4" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PerformanceRadarChart({ data }: { data: { metric: string; current: number; average: number; top: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="metric" />
        <Tooltip />
        <Radar name="Current" dataKey="current" stroke="#17406d" fill="#17406d" fillOpacity={0.2} />
        <Radar name="Average" dataKey="average" stroke="#0f766e" fill="#0f766e" fillOpacity={0.16} />
        <Radar name="Top" dataKey="top" stroke="#b45309" fill="#b45309" fillOpacity={0.12} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function DepartmentTreemap({ data }: { data: { name: string; size: number; publications: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <Treemap data={data} dataKey="size" nameKey="name" stroke="#ffffff" fill="#17406d" />
    </ResponsiveContainer>
  );
}

export function ContributionBars({ data }: { data: { name: string; value: number; weight: number }[] }) {
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.name}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium">{item.name} Contribution</span>
            <span>{item.value} / {item.weight}</span>
          </div>
          <div className="h-2 rounded bg-muted">
            <div className="h-2 rounded bg-primary" style={{ width: `${Math.min(100, (item.value / item.weight) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
