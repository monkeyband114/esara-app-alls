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
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis width={40} />
        <Tooltip />
        <Line type="monotone" dataKey="publications" stroke="#17406d" strokeWidth={2} />
        <Line type="monotone" dataKey="citations" stroke="#0f9f6e" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Keeps category labels from overflowing narrow (phone-width) charts; the tooltip still shows the full name. */
function shortLabel(value: unknown) {
  const text = String(value);
  return text.length > 12 ? `${text.slice(0, 11)}…` : text;
}

export function DepartmentChart({ data }: { data: { department: string; srs: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="department" tick={{ fontSize: 11 }} tickFormatter={shortLabel} interval={0} />
        <YAxis width={40} />
        <Tooltip />
        <Bar dataKey="srs" fill="#17406d" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LecturerBarChart({ data, metric }: { data: { name: string; publications?: number; citations?: number; srs?: number }[]; metric: "publications" | "citations" | "srs" }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} tickFormatter={shortLabel} />
        <YAxis width={40} />
        <Tooltip />
        <Bar dataKey={metric} fill={metric === "citations" ? "#0f766e" : "#17406d"} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Distinct colors; slices beyond the palette used to render black, so every slice index cycles through it.
const PIE_COLORS = ["#17406d", "#0f9f6e", "#b7791f", "#c2410c", "#6d28d9", "#0e7490", "#94a3b8"];

export function QuartileChart({ data, showLegend = false }: { data: { name: string; value: number }[]; showLegend?: boolean }) {
  const slices = data.filter((item) => item.value > 0);
  if (!slices.length) return <p className="py-10 text-center text-sm text-muted-foreground">No data yet.</p>;
  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={slices} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
            {slices.map((item, index) => (
              <Cell key={item.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      {showLegend ? (
        <ul className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
          {slices.map((item, index) => (
            <li key={item.name} className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
              <span className="truncate" title={item.name}>{item.name}</span>
              <span className="ml-auto shrink-0 text-muted-foreground">{item.value}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Top six research areas plus "Other", so the chart stays readable when a profile spans dozens of topics. */
export function AreaDistributionChart({ data }: { data: { name: string; value: number }[] }) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, 6);
  const other = sorted.slice(6).reduce((sum, item) => sum + item.value, 0);
  return <QuartileChart data={other ? [...top, { name: "Other", value: other }] : top} showLegend />;
}

export function AnnualCitationAreaChart({ data }: { data: { year: number; citations: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis width={40} />
        <Tooltip />
        <Area type="monotone" dataKey="citations" stroke="#0f766e" fill="#99f6e4" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PerformanceRadarChart({ data }: { data: { metric: string; current: number; average: number; top: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} outerRadius="62%">
        <PolarGrid />
        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
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
