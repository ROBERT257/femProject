import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ArrowDownRight, ArrowUpRight, CheckCircle2, HeartPulse, ShieldAlert, Sparkles, UserCircle2 } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

function getFallback(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getStatusTone(status = 'improving') {
  const value = String(status).toLowerCase();

  if (value.includes('high') || value.includes('risk')) {
    return {
      label: 'High Risk',
      variant: 'danger',
      icon: ShieldAlert,
      description: 'Needs close review',
    };
  }

  if (value.includes('need') || value.includes('attention') || value.includes('monitor')) {
    return {
      label: 'Needs Attention',
      variant: 'warning',
      icon: Activity,
      description: 'Monitor trends closely',
    };
  }

  return {
    label: 'Improving',
    variant: 'success',
    icon: CheckCircle2,
    description: 'Recovery is trending up',
  };
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

export default function PatientOverviewCard({ patient, plan, progress, className = '' }) {
  const recoveryScore = clampPercent(progress?.recoveryScore ?? plan?.recoveryScore ?? 78);
  const completionPercent = clampPercent(
    progress?.completed_exercises && progress?.total_exercises
      ? (progress.completed_exercises / progress.total_exercises) * 100
      : plan?.completion_percent ?? plan?.completionPercent ?? 0,
  );
  const averagePain = Number(progress?.average_pain_level ?? plan?.average_pain ?? 0);
  const averageFatigue = Number(progress?.average_fatigue_level ?? plan?.average_fatigue ?? averagePain);
  const trend = averagePain >= 7 ? 'High Risk' : averagePain >= 4 || averageFatigue >= 5 ? 'Needs Attention' : 'Improving';
  const tone = getStatusTone(trend);
  const ToneIcon = tone.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className={className}>
      <Card className="overflow-hidden border-neutral-200/80 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90">
        <CardHeader className="border-b border-neutral-100 bg-gradient-to-r from-blue-50 via-white to-emerald-50 dark:border-neutral-800 dark:from-blue-950/30 dark:via-neutral-950 dark:to-emerald-950/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-300">
                <UserCircle2 className="h-3.5 w-3.5" />
                Patient overview
              </div>
              <CardTitle className="mt-4 text-2xl text-neutral-950 dark:text-white">{patient?.fullName || 'Select a patient'}</CardTitle>
              <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                {plan?.title || 'No active program selected'}
              </p>
            </div>
            <div className="text-right">
              <Avatar fallback={getFallback(patient?.fullName || 'PT')} size="xl" className="ring-4 ring-white shadow-sm dark:ring-neutral-900" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6 md:p-7">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Recovery score</p>
              <p className="mt-2 text-3xl font-bold text-neutral-950 dark:text-white">{recoveryScore}</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium text-success-600 dark:text-success-400">
                <ArrowUpRight className="h-4 w-4" />
                Trending positive
              </p>
            </div>
            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Current status</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={tone.variant} size="sm">{tone.label}</Badge>
                <ToneIcon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              </div>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{tone.description}</p>
            </div>
            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Completion</p>
              <p className="mt-2 text-3xl font-bold text-neutral-950 dark:text-white">{completionPercent}%</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                <Sparkles className="h-4 w-4" />
                {completionPercent >= 70 ? 'On track' : 'Needs momentum'}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/80">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Current program</p>
                <p className="mt-1 text-lg font-semibold text-neutral-950 dark:text-white">{plan?.goal || plan?.title || 'No program selected'}</p>
              </div>
              <Badge variant={plan?.status === 'completed' ? 'success' : plan?.status === 'active' ? 'primary' : 'default'}>
                {plan?.status || 'Active'}
              </Badge>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Pain trend</p>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
                  <HeartPulse className="h-4 w-4 text-danger-500" />
                  {averagePain <= 3 ? 'Down' : 'Elevated'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Fatigue trend</p>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
                  <Activity className="h-4 w-4 text-warning-500" />
                  {averageFatigue <= 4 ? 'Stable' : 'Rising'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Last update</p>
                <p className="mt-2 text-sm font-semibold text-neutral-900 dark:text-white">
                  {plan?.start_date || progress?.last_updated || 'Today'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
