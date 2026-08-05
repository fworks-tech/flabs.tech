"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface TrafficPoint {
  day: string;
  pageviews: number;
  sessions: number;
  uniques: number;
}

const COLORS = {
  violet: "#7048e8",
  blue: "#3b5bdb",
  teal: "#12b886",
  gray: "#868e96",
  orange: "#f76707",
};

export function TrafficChart({ data }: { data: TrafficPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="pageviews" stroke={COLORS.violet} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="uniques" stroke={COLORS.teal} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="sessions" stroke={COLORS.blue} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TopPagesChart({ data }: { data: { path: string; views: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 32)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis type="category" dataKey="path" tick={{ fontSize: 11 }} width={180} />
        <Tooltip />
        <Bar dataKey="views" fill={COLORS.blue} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DevicePie({ data }: { data: { name: string; value: number }[] }) {
  const colors = [COLORS.violet, COLORS.teal, COLORS.orange, COLORS.gray];
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
