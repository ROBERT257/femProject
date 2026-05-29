import ThemeToggle from './ui/ThemeToggle';

export default function Navbar({ title = 'AI Rehab Dashboard', subtitle = 'Personalized guidance powered by your backend', userName = 'Patient' }) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-neutral-900 dark:text-white">{title}</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
          {userName}
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
}
