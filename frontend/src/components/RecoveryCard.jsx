import { Activity } from 'lucide-react';

export default function RecoveryCard({ score = 78, status = 'Good Recovery', trend = '+4 this week' }) {
  return (
    <article className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold text-neutral-900 dark:text-white">Recovery Score</h3>
        <Activity className="h-5 w-5 text-emerald-600" />
      </div>
      <div className="mb-2 text-4xl font-extrabold text-neutral-900 dark:text-white">{score}</div>
      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{status}</p>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{trend}</p>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
      </div>
    </article>
  );
}
