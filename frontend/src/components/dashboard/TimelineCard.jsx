import React from 'react';
import { Clock3, Flame, MoveRight, PauseCircle, PlayCircle, CircleDashed } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

function getStatusMeta(status = 'pending') {
  const value = String(status).toLowerCase();

  if (value === 'completed') {
    return {
      label: 'Completed',
      variant: 'success',
      border: 'border-success-200 bg-success-50 dark:border-success-900/40 dark:bg-success-950/20',
      dot: 'bg-success-500',
      icon: PlayCircle,
    };
  }

  if (value === 'in_progress' || value === 'in-progress') {
    return {
      label: 'In Progress',
      variant: 'warning',
      border: 'border-warning-200 bg-warning-50 dark:border-warning-900/40 dark:bg-warning-950/20',
      dot: 'bg-warning-500',
      icon: PauseCircle,
    };
  }

  if (value === 'skipped') {
    return {
      label: 'Skipped',
      variant: 'danger',
      border: 'border-danger-200 bg-danger-50 dark:border-danger-900/40 dark:bg-danger-950/20',
      dot: 'bg-danger-500',
      icon: MoveRight,
    };
  }

  return {
    label: 'Pending',
    variant: 'default',
    border: 'border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60',
    dot: 'bg-neutral-400',
    icon: CircleDashed,
  };
}

export default function TimelineCard({ entries = [], className = '' }) {
  return (
    <Card className={`overflow-hidden border-neutral-200/80 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90 ${className}`}>
      <CardHeader className="border-b border-neutral-100 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/60">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
          <Clock3 className="h-3.5 w-3.5" />
          Session timeline
        </div>
        <CardTitle className="text-2xl text-neutral-950 dark:text-white">Vertical recovery log</CardTitle>
      </CardHeader>
      <CardContent className="p-6 md:p-7">
        {entries.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-400">
            No timeline entries yet.
          </div>
        ) : (
          <div className="relative space-y-4 before:absolute before:inset-y-2 before:left-5 before:w-px before:bg-neutral-200 dark:before:bg-neutral-800">
            {entries.map((entry, index) => {
              const meta = getStatusMeta(entry.completion_status);
              const Icon = meta.icon;
              const pain = Number(entry.pain_level ?? 0);
              const fatigue = Number(entry.fatigue_level ?? 0);

              return (
                <article key={`${entry.exercise || 'exercise'}-${index}`} className={`relative ml-8 rounded-3xl border p-5 shadow-sm transition-transform hover:-translate-y-0.5 ${meta.border}`}>
                  <span className={`absolute -left-10 top-6 h-4 w-4 rounded-full border-4 border-white ${meta.dot} dark:border-neutral-950`} />
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-neutral-950 dark:text-white">{entry.exercise || 'Exercise'}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant={meta.variant} size="sm">{meta.label}</Badge>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">Step {index + 1}</span>
                      </div>
                    </div>
                    <Icon className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm dark:bg-neutral-950/70">
                      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Pain</p>
                      <p className="mt-1 text-sm font-semibold text-neutral-950 dark:text-white">{pain}/10</p>
                    </div>
                    <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm dark:bg-neutral-950/70">
                      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Fatigue</p>
                      <p className="mt-1 text-sm font-semibold text-neutral-950 dark:text-white">{fatigue}/10</p>
                    </div>
                    <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm dark:bg-neutral-950/70">
                      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Notes</p>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold text-neutral-950 dark:text-white">{entry.patient_notes || 'No patient notes yet.'}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <Flame className="h-4 w-4 text-danger-500" />
                    <span>{entry.therapist_comments || 'No therapist notes captured.'}</span>
                    {entry.completed_at ? <span className="text-neutral-400">• Completed {new Date(entry.completed_at).toLocaleDateString()}</span> : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
