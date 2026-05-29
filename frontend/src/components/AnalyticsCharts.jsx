import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area,
} from 'recharts';

export default function AnalyticsCharts({ data = [] }) {
  const chartData = useMemo(() => data ?? [], [data]);

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <article className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
        <h3 className="mb-3 font-heading text-lg font-semibold text-neutral-900 dark:text-white">Pain & Fatigue Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" />
              <XAxis dataKey="day" stroke="#71717a" />
              <YAxis domain={[0, 10]} stroke="#71717a" />
              <Tooltip />
              <Line type="monotone" dataKey="pain" stroke="#f97316" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="fatigue" stroke="#22c55e" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
        <h3 className="mb-3 font-heading text-lg font-semibold text-neutral-900 dark:text-white">Adherence</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" />
              <XAxis dataKey="day" stroke="#71717a" />
              <YAxis domain={[0, 100]} stroke="#71717a" />
              <Tooltip />
              <Area type="monotone" dataKey="adherence" stroke="#2563eb" fill="#93c5fd" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}
