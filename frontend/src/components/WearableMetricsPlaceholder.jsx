import { Watch } from 'lucide-react';

export default function WearableMetricsPlaceholder() {
  return (
    <article className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 p-6 dark:border-neutral-700 dark:bg-neutral-900/50">
      <div className="mb-3 flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
        <Watch className="h-5 w-5 text-cyan-600" />
        <h3 className="font-heading text-lg font-semibold">Wearable Metrics</h3>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Google Fit / Apple Health sync is coming next. This panel will show daily steps, heart rate,
        sleep quality, and recovery readiness.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-neutral-500 dark:text-neutral-400">Steps</p>
          <p className="font-semibold text-neutral-800 dark:text-neutral-100">--</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-neutral-500 dark:text-neutral-400">Avg HR</p>
          <p className="font-semibold text-neutral-800 dark:text-neutral-100">--</p>
        </div>
      </div>
    </article>
  );
}
