import React, { useMemo, useState } from 'react';
import { Search, RefreshCw, SlidersHorizontal, ClipboardList, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'high-pain', label: 'High pain cases' },
];

export default function PlanList({ plans, onFetchPlans, onSelect, selectedPlanId }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredPlans = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return plans.filter((plan) => {
      const matchesQuery = !normalized || [plan.title, plan.patient_name, plan.therapist_name, plan.goal]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));

      const averagePain = Number(plan.average_pain || 0);
      const matchesFilter =
        filter === 'all'
          || (filter === 'active' && plan.status === 'active')
          || (filter === 'completed' && plan.status === 'completed')
          || (filter === 'high-pain' && averagePain >= 6);

      return matchesQuery && matchesFilter;
    });
  }, [plans, query, filter]);

  return (
    <Card className="overflow-hidden border-neutral-200/80 bg-white/95 shadow-[0_16px_48px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90">
      <CardHeader className="border-b border-neutral-200/70 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/60">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/60 dark:text-emerald-300">
              <ClipboardList className="h-3.5 w-3.5" />
              Plans Library
            </div>
            <CardTitle className="text-2xl md:text-3xl">Rehabilitation plans overview</CardTitle>
            <p className="max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
              Search, filter, and jump between saved rehabilitation plans. Use the list to inspect the plan and the editor to update exercises.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onFetchPlans}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload plans
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onSelect(null)}>
              Clear selection
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6 md:p-7">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_auto] xl:items-end">
          <Input
            label="Search plans"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="search"
            placeholder="Search patient, therapist, or plan"
          />

          <div className="flex flex-wrap gap-2 xl:justify-end">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${filter === item.id
                  ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-emerald-300 hover:text-emerald-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-emerald-700 dark:hover:text-emerald-300'
                }`}
                onClick={() => setFilter(item.id)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
          <span>{filteredPlans.length} plan{filteredPlans.length === 1 ? '' : 's'} visible</span>
          <span className="inline-flex items-center gap-2">
            <Search className="h-4 w-4" />
            Updated from backend
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
          {filteredPlans.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-400 md:col-span-2">
              No matching plans. Try another search or filter.
            </div>
          ) : filteredPlans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => onSelect(plan.id)}
                className={`group text-left rounded-3xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${isSelected
                  ? 'border-emerald-500 bg-emerald-50 shadow-md dark:border-emerald-500/80 dark:bg-emerald-950/20'
                  : 'border-neutral-200 bg-white hover:border-emerald-300 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-emerald-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <h3 className="truncate text-lg font-semibold text-neutral-950 dark:text-white">
                      {plan.title || `Plan ${plan.id}`}
                    </h3>
                    <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                      {plan.patient_name || 'Unknown patient'}
                      <span className="mx-2 text-neutral-300 dark:text-neutral-700">•</span>
                      {plan.therapist_name || 'No therapist'}
                    </p>
                  </div>

                  <Badge variant={plan.status === 'completed' ? 'success' : 'primary'} size="sm">
                    {plan.status || 'active'}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Started</p>
                    <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-white">{plan.start_date || 'No start date'}</p>
                  </div>
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Exercises</p>
                    <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-white">{plan.entry_count ?? 0} assigned</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
                  <span className="truncate">{plan.goal || 'No recovery goal added yet.'}</span>
                  <span className="inline-flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
                    Open
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
