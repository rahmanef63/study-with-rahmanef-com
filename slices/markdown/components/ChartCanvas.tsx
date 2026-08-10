"use client";

/** recharts renderer for ChartBlock — split into its own module so recharts
 *  (~150kB) is code-split behind next/dynamic and only loaded when a ```chart
 *  fence actually renders, not on every markdown page. */

import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";

import type { ChartSpec } from "./chart-spec";
import { seriesKeys } from "./chart-spec";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function ChartCanvas({ spec }: { spec: ChartSpec }) {
  const xKey = spec.xKey ?? "name";
  const keys = seriesKeys(spec);
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart(spec, xKey, keys)}
      </ResponsiveContainer>
    </div>
  );
}

function renderChart(spec: ChartSpec, xKey: string, keys: string[]) {
  const axisProps = { tick: { fontSize: 11 }, stroke: "var(--muted-foreground)" } as const;
  switch (spec.type) {
    case "bar":
      return (
        <BarChart data={spec.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip />
          {keys.length > 1 && <Legend />}
          {keys.map((k, i) => <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />)}
        </BarChart>
      );
    case "line":
      return (
        <LineChart data={spec.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip />
          {keys.length > 1 && <Legend />}
          {keys.map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />)}
        </LineChart>
      );
    case "area":
      return (
        <AreaChart data={spec.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip />
          {keys.length > 1 && <Legend />}
          {keys.map((k, i) => (
            <Area key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.25} />
          ))}
        </AreaChart>
      );
    case "pie": {
      const valueKey = keys[0] ?? "value";
      return (
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie data={spec.data} dataKey={valueKey} nameKey={xKey} innerRadius="45%" outerRadius="80%" paddingAngle={2}>
            {spec.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
        </PieChart>
      );
    }
  }
}
