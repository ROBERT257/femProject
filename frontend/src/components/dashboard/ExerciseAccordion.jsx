import React, { useEffect, useState } from 'react';
import { ChevronDown, Edit3, Trash2, Save, HeartPulse, Activity, ClipboardCheck } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

function clamp(value) {
  return Math.max(0, Math.min(10, Number(value) || 0));
}

function statusVariant(status = 'pending') {
  const value = String(status).toLowerCase();
  if (value === 'completed') return 'success';
  if (value === 'skipped') return 'danger';
  if (value === 'in_progress' || value === 'in-progress') return 'warning';
  return 'default';
}

export default function ExerciseAccordion({ entry, onChange, onSave, onDelete, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [local, setLocal] = useState(entry);

  useEffect(() => {
    setLocal(entry);
  }, [entry]);

  function update(field, value) {
    const next = { ...local, [field]: value };
    setLocal(next);
    if (onChange) onChange(next);
  }

  function handleSave() {
    if (onSave) onSave(local);
  }

  const painValue = clamp(local?.pain_level ?? 0);
  const fatigueValue = clamp(local?.fatigue_level ?? 0);

  return (
    <Card className="overflow-hidden border-neutral-200/80 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950/90">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 p-5 text-left transition hover:bg-neutral-50 dark:hover:bg-neutral-900/70"
        onClick={() => setOpen((current) => !current)}
      >
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-neutral-950 dark:text-white">{local?.exercise || 'Untitled exercise'}</h3>
            <Badge variant={statusVariant(local?.completion_status)} size="sm">
              {local?.completion_status || 'pending'}
            </Badge>
            <Badge variant={painValue >= 7 ? 'danger' : painValue >= 4 ? 'warning' : 'success'} size="sm">
              Pain {painValue}/10
            </Badge>
            <Badge variant={fatigueValue >= 7 ? 'danger' : fatigueValue >= 4 ? 'warning' : 'primary'} size="sm">
              Fatigue {fatigueValue}/10
            </Badge>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {local?.patient_notes || 'Tap to expand and update the exercise details.'}
          </p>
        </div>
        <ChevronDown className={`mt-1 h-5 w-5 flex-shrink-0 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="space-y-5 border-t border-neutral-100 p-5 dark:border-neutral-800">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 md:col-span-1">
              <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Completion</span>
              <select
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary-500 dark:border-neutral-800 dark:bg-neutral-950"
                value={local?.completion_status || 'pending'}
                onChange={(event) => update('completion_status', event.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="skipped">Skipped</option>
              </select>
            </label>

            <label className="space-y-2">
              <div className="flex items-center justify-between text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                <span>Pain</span>
                <span>{painValue}/10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={painValue}
                onChange={(event) => update('pain_level', Number(event.target.value))}
                className="w-full accent-danger-500"
              />
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <HeartPulse className="h-4 w-4 text-danger-500" />
                Lower is better for recovery
              </div>
            </label>

            <label className="space-y-2">
              <div className="flex items-center justify-between text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                <span>Fatigue</span>
                <span>{fatigueValue}/10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={fatigueValue}
                onChange={(event) => update('fatigue_level', Number(event.target.value))}
                className="w-full accent-warning-500"
              />
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <Activity className="h-4 w-4 text-warning-500" />
                Track session strain and recovery cost
              </div>
            </label>
          </div>

          <label className="space-y-2 block">
            <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Patient notes</span>
            <textarea
              value={local?.patient_notes || ''}
              onChange={(event) => update('patient_notes', event.target.value)}
              className="min-h-[120px] w-full rounded-3xl border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary-500 dark:border-neutral-800 dark:bg-neutral-950"
              placeholder="Patient feedback, pain triggers, movement quality, or session notes."
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
              <ClipboardCheck className="h-4 w-4" />
              Changes are saved through the existing exercise update endpoint.
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                <Edit3 className="mr-2 h-4 w-4" />
                Collapse
              </Button>
              <Button type="button" variant="danger" size="sm" onClick={() => onDelete && onDelete(local?.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <Button type="button" size="sm" onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save exercise
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
