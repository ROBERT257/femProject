import { LayoutDashboard, MessageSquareHeart, ActivitySquare, LogOut } from 'lucide-react';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'assistant', label: 'Rehab Assistant', icon: MessageSquareHeart },
  { key: 'analytics', label: 'Analytics', icon: ActivitySquare },
];

export default function Sidebar({ active = 'dashboard', onSelect, onLogout }) {
  return (
    <aside className="hidden w-64 flex-col border-r border-neutral-200 bg-white p-4 lg:flex dark:border-neutral-800 dark:bg-neutral-950">
      <h2 className="mb-6 px-2 font-heading text-xl font-bold text-neutral-900 dark:text-white">AI Rehab</h2>
      <nav className="space-y-2">
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect?.(item.key)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
              active === item.key
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <button
        type="button"
        onClick={onLogout}
        className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </aside>
  );
}
