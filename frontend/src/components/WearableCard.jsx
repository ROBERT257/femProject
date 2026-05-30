import { motion } from 'framer-motion';
import { Activity, HeartPulse, Flame, BedDouble, Footprints } from 'lucide-react';

function StatLine({ label, value, icon: Icon, accentClass = 'text-emerald-500' }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/70 p-4 shadow-sm backdrop-blur dark:bg-neutral-900/70">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
            {label}
          </p>
          <p className="mt-2 font-heading text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 ${accentClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function WearableCard({ metrics }) {
  const steps = metrics?.steps ?? 0;
  const heartRate = metrics?.heart_rate ?? null;
  const sleepHours = metrics?.sleep_hours ?? null;
  const calories = metrics?.calories ?? null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-5 shadow-[0_20px_60px_rgba(16,24,40,0.08)] dark:border-emerald-900/40 dark:from-emerald-950/40 dark:via-neutral-950 dark:to-amber-950/20"
    >
      <div className="absolute right-0 top-0 h-32 w-32 translate-x-1/3 -translate-y-1/3 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-40 w-40 -translate-x-1/3 translate-y-1/3 rounded-full bg-amber-300/20 blur-3xl" />

      <div className="relative mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm dark:border-emerald-900/60 dark:bg-neutral-900 dark:text-emerald-300">
            <Activity className="h-3.5 w-3.5" />
            Wearable summary
          </div>
          <h3 className="font-heading text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">
            Google Fit at a glance
          </h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-neutral-600 dark:text-neutral-400">
            Daily steps, heart rate, sleep, and calories appear here after you connect and sync your Google account.
          </p>
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-right shadow-sm backdrop-blur dark:border-white/10 dark:bg-neutral-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Status</p>
          <p className="mt-1 font-heading text-lg font-bold text-neutral-950 dark:text-white">Active feed</p>
        </div>
      </div>

      <div className="relative grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
        <StatLine label="Steps" value={steps.toLocaleString()} icon={Footprints} accentClass="text-emerald-600" />
        <StatLine label="Heart rate" value={heartRate ? `${heartRate} bpm` : '—'} icon={HeartPulse} accentClass="text-rose-500" />
        <StatLine label="Sleep" value={sleepHours ? `${sleepHours.toFixed(1)} h` : '—'} icon={BedDouble} accentClass="text-indigo-500" />
        <StatLine label="Calories" value={calories ? calories.toLocaleString() : '—'} icon={Flame} accentClass="text-amber-500" />
      </div>
    </motion.article>
  );
}