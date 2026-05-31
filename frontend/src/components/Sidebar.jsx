import { LayoutDashboard, MessageSquareHeart, ActivitySquare, LogOut, Watch } from 'lucide-react';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'assistant', label: 'Rehab Assistant', icon: MessageSquareHeart },
  { key: 'analytics', label: 'Analytics', icon: ActivitySquare },
  { key: 'wearables', label: 'Wearables', icon: Watch },
];

export default function Sidebar({ active = 'dashboard', onSelect, onLogout }) {
  return (
    <aside className="hidden w-72 flex-col border-r border-white/50 bg-white/70 p-4 shadow-[12px_0_40px_rgba(15,23,42,0.05)] backdrop-blur-xl lg:flex dark:border-white/10 dark:bg-slate-950/60">
      <div className="mb-5 rounded-[24px] border border-slate-200/70 bg-white/80 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
            <span className="font-heading text-lg font-extrabold tracking-tight">A</span>
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold tracking-tight text-slate-950 dark:text-white">AI Rehab</h2>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Recovery cockpit</p>
          </div>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect?.(item.key)}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${
              active === item.key
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200'
                : 'text-slate-600 hover:-translate-y-0.5 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-white/5'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200 hover:text-rose-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-rose-500/30 dark:hover:text-rose-200"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
