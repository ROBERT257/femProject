import ThemeToggle from './ui/ThemeToggle';

export default function Navbar({ title = 'AI Rehab Dashboard', subtitle = 'Personalized guidance powered by your backend', userName = 'Patient' }) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/60 bg-white/70 px-5 py-4 shadow-[0_14px_36px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
      <div className="min-w-0">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200">
          Live rehab workspace
        </div>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white md:text-3xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]" />
          {userName}
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
}
