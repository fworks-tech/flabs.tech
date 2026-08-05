"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = {
  violet: "#7048e8",
  teal: "#12b886",
  red: "#e03131",
  orange: "#f76707",
};

export interface AiDayPoint {
  day: string;
  requests: number;
  tokensIn: number;
  tokensOut: number;
  blocked: number;
}

export function AiRequestsChart({ data }: { data: AiDayPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="requests" stroke={COLORS.violet} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="blocked" stroke={COLORS.red} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AiTokensChart({ data }: { data: AiDayPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="tokensIn" stroke={COLORS.teal} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="tokensOut" stroke={COLORS.orange} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
