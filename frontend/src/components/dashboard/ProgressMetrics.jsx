import React, { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Gauge, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Progress } from '../ui/Progress';

function clamp(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

function createFallbackPoint() {
  return { label: 'No data', pain: 0, fatigue: 0, completion: 0 };
}

function Ring({ value }) {
  const size = 144;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const offset = circumference - (clamp(value) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
          className="text-neutral-200 dark:text-neutral-800"
        />
        <circle
          stroke="url(#completion-gradient)"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
        />
        <defs>
          <linearGradient id="completion-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-bold text-neutral-950 dark:text-white">{Math.round(clamp(value))}%</p>
        <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">completion</p>
      </div>
    </div>
  );
}

export default function ProgressMetrics({ progress, entries = [], className = '' }) {
  const completionPercent = useMemo(() => {
    if (progress?.total_exercises) {
      return clamp(((progress.completed_exercises || 0) / progress.total_exercises) * 100);
    }
    return clamp(progress?.completion_percent ?? progress?.completionPercent ?? 0);
  }, [progress]);

  const data = useMemo(() => {
    const source = Array.isArray(entries) && entries.length > 0 ? entries : [createFallbackPoint()];

    return source.map((entry, index) => {
      const pain = clamp(entry.pain_level ?? entry.pain ?? 0);
      const fatigue = clamp(entry.fatigue_level ?? entry.fatigue ?? pain);
      const completion = String(entry.completion_status || '').toLowerCase() === 'completed' ? 100 : String(entry.completion_status || '').toLowerCase() === 'in_progress' ? 50 : 0;

      return {
        label: entry.exercise || entry.label || `Exercise ${index + 1}`,
        pain,
        fatigue,
        completion,
      };
    });
  }, [entries]);

  const averagePain = useMemo(() => {
    if (!data.length) return 0;
    return Math.round((data.reduce((sum, item) => sum + item.pain, 0) / data.length) * 10) / 10;
  }, [data]);

  const averageFatigue = useMemo(() => {
    if (!data.length) return 0;
    return Math.round((data.reduce((sum, item) => sum + item.fatigue, 0) / data.length) * 10) / 10;
  }, [data]);

  return (
    <div className={className}>
      <Card className="overflow-hidden border-neutral-200/80 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90">
        <CardHeader className="border-b border-neutral-100 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/60 dark:text-emerald-300">
                <Gauge className="h-3.5 w-3.5" />
                Progress visualization
              </div>
              <CardTitle className="mt-4 text-2xl text-neutral-950 dark:text-white">Recovery trend summary</CardTitle>
            </div>
            <p className="max-w-xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
              Track completion, pain, and fatigue without opening the backend plan editor.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6 md:p-7">
          <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-center">
            <div className="rounded-[1.75rem] border border-neutral-200 bg-neutral-50 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60">
              <Ring value={completionPercent} />
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
                  <span className="inline-flex items-center gap-2 font-medium"><TrendingUp className="h-4 w-4 text-success-500" />Completion</span>
                  <span className="font-semibold text-neutral-950 dark:text-white">{completionPercent}%</span>
                </div>
                <Progress value={completionPercent} />
                <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
                  <span className="inline-flex items-center gap-2 font-medium"><Activity className="h-4 w-4 text-danger-500" />Pain</span>
                  <span className="font-semibold text-neutral-950 dark:text-white">{averagePain}/10</span>
                </div>
                <Progress value={(averagePain / 10) * 100} />
                <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
                  <span className="inline-flex items-center gap-2 font-medium"><TrendingDown className="h-4 w-4 text-warning-500" />Fatigue</span>
                  <span className="font-semibold text-neutral-950 dark:text-white">{averageFatigue}/10</span>
                </div>
                <Progress value={(averageFatigue / 10) * 100} />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                <h3 className="text-sm font-semibold text-neutral-950 dark:text-white">Pain Trend</h3>
                <div className="mt-4 h-52 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" stroke="#71717a" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 10]} stroke="#71717a" tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="pain" stroke="#ef4444" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                <h3 className="text-sm font-semibold text-neutral-950 dark:text-white">Fatigue Trend</h3>
                <div className="mt-4 h-52 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" stroke="#71717a" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 10]} stroke="#71717a" tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="fatigue" stroke="#f59e0b" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                <h3 className="text-sm font-semibold text-neutral-950 dark:text-white">Completion Trend</h3>
                <div className="mt-4 h-52 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" stroke="#71717a" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} stroke="#71717a" tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="completion" stroke="#2563eb" fill="#bfdbfe" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
