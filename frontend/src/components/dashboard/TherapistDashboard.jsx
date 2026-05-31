import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Flame,
  HeartPulse,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Target,
  TrendingUp,
  Users,
  Sparkles,
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import BrandMark from '../shared/BrandMark';
import ThemeToggle from '../ui/ThemeToggle';
import PlanList from '../PlanList';
import PlanEditor from '../PlanEditor';
import PatientOverviewCard from './PatientOverviewCard';
import ProgressMetrics from './ProgressMetrics';
import TimelineCard from './TimelineCard';
import QuickActionsPanel from './QuickActionsPanel';
import AIInsightsPanel from './AIInsightsPanel';
import { generateAISuggestions, listRehabPlans, createRehabPlan, getRehabPlanById, updateRehabPlan } from '../../lib/api';

function getFallback(value = '') {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

const CONDITION_TEMPLATES = {
  shoulder: {
    label: 'Shoulder recovery',
    stages: {
      early: ['Pendulum swings', 'Scapular retraction', 'Table slides'],
      mid: ['Band pull apart', 'Wall slides', 'External rotation'],
      late: ['Overhead press prep', 'Loaded carries', 'Prone Y-T-W'],
    },
  },
  knee: {
    label: 'Knee rehabilitation',
    stages: {
      early: ['Quad sets', 'Heel slides', 'Straight leg raises'],
      mid: ['Mini squats', 'Step-ups', 'Terminal knee extension'],
      late: ['Split squats', 'Single-leg balance', 'Lateral step-downs'],
    },
  },
  back: {
    label: 'Back recovery',
    stages: {
      early: ['Breathing reset', 'Pelvic tilts', 'Bird-dog hold'],
      mid: ['Dead bug', 'Hip hinge drill', 'Glute bridge'],
      late: ['Farmer carry', 'Loaded hip hinge', 'Anti-rotation press'],
    },
  },
  ankle: {
    label: 'Ankle mobility',
    stages: {
      early: ['Ankle pumps', 'Towel scrunches', 'Calf stretch'],
      mid: ['Band eversion', 'Single-leg balance', 'Heel raises'],
      late: ['Hop progression', 'Lateral bounds', 'Agility ladder'],
    },
  },
  acl: {
    label: 'ACL return-to-play',
    stages: {
      early: ['ROM resets', 'Quad activation', 'Stationary bike'],
      mid: ['Single-leg squat', 'Hamstring curl', 'Lateral walk'],
      late: ['Plyometric landing', 'Sprint mechanics', 'Cutting drill'],
    },
  },
};

const STAGE_OPTIONS = [
  { value: 'early', label: 'Early healing' },
  { value: 'mid', label: 'Mid-phase' },
  { value: 'late', label: 'Late-phase' },
];

const CONDITION_OPTIONS = Object.entries(CONDITION_TEMPLATES).map(([value, config]) => ({
  value,
  label: config.label,
}));

const RECENT_ACTIVITY = [
  {
    id: 1,
    patient: 'Sarah Johnson',
    action: 'completed exercise',
    exercise: 'Shoulder Flexion',
    time: '2 hours ago',
    type: 'success',
  },
  {
    id: 2,
    patient: 'Emily Davis',
    action: 'reported high pain',
    exercise: 'Wall Slides',
    time: '3 days ago',
    type: 'warning',
  },
  {
    id: 3,
    patient: 'Michael Chen',
    action: 'started new plan',
    exercise: 'Knee Rehabilitation',
    time: '1 day ago',
    type: 'info',
  },
];

function buildWeeklyExercises(conditionKey, stageKey) {
  const template = CONDITION_TEMPLATES[conditionKey] || CONDITION_TEMPLATES.shoulder;
  const stageExercises = template.stages[stageKey] || template.stages.early;

  return stageExercises.map((exercise, index) => {
    const defaultReps = stageKey === 'late' ? 12 : stageKey === 'mid' ? 10 : 8;

    return {
      exercise,
      sets: 3,
      reps: defaultReps,
      order_index: index,
      completion_status: 'pending',
      pain_level: 0,
      fatigue_level: 0,
      patient_notes: '',
      therapist_comments: '',
    };
  });
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function normalizePlanDate(plan) {
  return plan?.start_date || plan?.created_at || plan?.updated_at || '';
}

function comparePlans(a, b) {
  const dateA = new Date(normalizePlanDate(a) || 0).getTime();
  const dateB = new Date(normalizePlanDate(b) || 0).getTime();

  if (dateA !== dateB) {
    return dateB - dateA;
  }

  return Number(b?.id || 0) - Number(a?.id || 0);
}

function matchesPatient(plan, patient) {
  if (!patient || !plan) {
    return false;
  }

  if (plan.patient_id && Number(plan.patient_id) === Number(patient.id)) {
    return true;
  }

  return String(plan.patient_name || '').trim().toLowerCase() === String(patient.fullName || '').trim().toLowerCase();
}

function buildInsights(progress, plan) {
  if (!progress && !plan) {
    return [];
  }

  const completed = Number(progress?.completed_exercises || 0);
  const total = Number(progress?.total_exercises || 0);
  const completionPercent = total > 0 ? Math.round((completed / total) * 100) : Number(plan?.completion_percent || 0);
  const pain = Number(progress?.average_pain_level ?? plan?.average_pain ?? 0);
  const fatigue = Number(progress?.average_fatigue_level ?? plan?.average_fatigue ?? 0);

  const insights = [];

  if (pain >= 6) {
    insights.push({
      title: 'Recovery score declining',
      body: 'Pain is elevated. Consider reducing intensity for the next 2 sessions.',
      tone: 'warning',
    });
  } else if (fatigue >= 6) {
    insights.push({
      title: 'Fatigue is trending up',
      body: 'Recovery load is likely too high. Add more rest or lower the volume.',
      tone: 'warning',
    });
  } else {
    insights.push({
      title: 'Recovery is stable',
      body: 'Pain and fatigue remain within range. Keep the current progression plan.',
      tone: 'success',
    });
  }

  if (completionPercent < 50) {
    insights.push({
      title: 'Completion needs support',
      body: 'Adherence is still low. A reminder or shorter session may improve follow-through.',
      tone: 'info',
    });
  }

  return insights;
}

export default function TherapistDashboard({ session, accounts, onCreatePatient, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [patientForm, setPatientForm] = useState({ fullName: '', email: '' });
  const [patientMessage, setPatientMessage] = useState('');
  const [weeklyPlanMessage, setWeeklyPlanMessage] = useState('');
  const [createPlanPatientId, setCreatePlanPatientId] = useState('');
  const [weeklyCondition, setWeeklyCondition] = useState('shoulder');
  const [weeklyStage, setWeeklyStage] = useState('early');
  const [weeklyWeekNumber, setWeeklyWeekNumber] = useState('1');
  const [weeklyTitle, setWeeklyTitle] = useState('');
  const [weeklyFocus, setWeeklyFocus] = useState('Mobility and control');
  const [weeklyNotes, setWeeklyNotes] = useState('');
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansMessage, setPlansMessage] = useState('');
  const [headerNotice, setHeaderNotice] = useState('');
  const [aiInsights, setAiInsights] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [assignPatient, setAssignPatient] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPlanDetail, setSelectedPlanDetail] = useState(null);
  const [selectedPlanProgress, setSelectedPlanProgress] = useState(null);
  const [selectedPlanLoading, setSelectedPlanLoading] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

  const therapistAccountId = session?.id;

  const createdPatients = accounts.filter(
    (account) => account.role === 'patient' && account.createdByTherapistId === therapistAccountId,
  );

  const visiblePatients = useMemo(() => {
    const normalized = patientSearch.trim().toLowerCase();
    return createdPatients.filter((patient) => {
      if (!normalized) {
        return true;
      }

      return [patient.fullName, patient.email, patient.regNo, patient.loginId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
    });
  }, [createdPatients, patientSearch]);

  const selectedPatient = useMemo(() => {
    if (!createdPatients.length) {
      return null;
    }

    return createdPatients.find((patient) => Number(patient.id) === Number(selectedPatientId)) || visiblePatients[0] || createdPatients[0] || null;
  }, [createdPatients, selectedPatientId, visiblePatients]);

  const selectedCondition = CONDITION_TEMPLATES[weeklyCondition] || CONDITION_TEMPLATES.shoulder;
  const weeklyPreviewExercises = buildWeeklyExercises(weeklyCondition, weeklyStage);
  const weeklyDefaultTitle = `${selectedCondition.label} - Week ${weeklyWeekNumber}`;

  const selectedPlan = useMemo(() => {
    const explicit = plans.find((plan) => Number(plan.id) === Number(selectedPlanId));
    if (explicit) {
      return explicit;
    }

    if (!selectedPatient) {
      return plans[0] || null;
    }

    return plans.filter((plan) => matchesPatient(plan, selectedPatient)).sort(comparePlans)[0] || plans[0] || null;
  }, [plans, selectedPatient, selectedPlanId]);

  const selectedPatientPlans = useMemo(() => {
    if (!selectedPatient) {
      return [];
    }

    return plans.filter((plan) => matchesPatient(plan, selectedPatient)).sort(comparePlans);
  }, [plans, selectedPatient]);

  const planProgress = selectedPlanProgress || {};
  const progressEntries = Array.isArray(planProgress.exercises) ? planProgress.exercises : selectedPlan?.entries || [];
  const completionPercent = clampPercent(
    planProgress?.total_exercises
      ? ((planProgress.completed_exercises || 0) / planProgress.total_exercises) * 100
      : selectedPlan?.completion_percent ?? selectedPlan?.completionPercent ?? 0,
  );
  const averagePain = Number(planProgress?.average_pain_level ?? selectedPlan?.average_pain ?? 0);
  const averageFatigue = Number(planProgress?.average_fatigue_level ?? selectedPlan?.average_fatigue ?? averagePain);
  const recoveryScore = clampPercent(100 - (averagePain * 5) - (averageFatigue * 2) + (completionPercent * 0.35));
  const currentStatus = averagePain >= 7 || averageFatigue >= 7
    ? 'High Risk'
    : completionPercent >= 70 && averagePain <= 4
      ? 'Improving'
      : 'Needs Attention';
  const selectedInsights = useMemo(() => buildInsights(planProgress, selectedPlan), [planProgress, selectedPlan]);
  const visibleInsights = aiInsights.length > 0 ? aiInsights : selectedInsights;

  useEffect(() => {
    if (!selectedPatient && createdPatients.length > 0) {
      setSelectedPatientId(String(createdPatients[0].id));
    }
  }, [createdPatients, selectedPatient]);

  useEffect(() => {
    if (!selectedPatient || plans.length === 0) {
      return;
    }

    const matchingPlan = selectedPatientPlans[0] || selectedPlan;
    if (matchingPlan && Number(selectedPlanId) !== Number(matchingPlan.id)) {
      setSelectedPlanId(matchingPlan.id);
    }
  }, [plans.length, selectedPatient, selectedPatientPlans, selectedPlan, selectedPlanId]);

  useEffect(() => {
    let active = true;

    async function loadPlans() {
      setPlansLoading(true);
      try {
        const response = await listRehabPlans();
        if (!active) {
          return;
        }

        const list = Array.isArray(response) ? response : response?.data || [];
        setPlans(list);
        setPlansMessage(list.length > 0 ? '' : 'No rehabilitation plans found yet.');
      } catch (error) {
        if (!active) {
          return;
        }
        setPlansMessage(error.message || 'Failed to load rehabilitation plans.');
        setPlans([]);
      } finally {
        if (active) {
          setPlansLoading(false);
        }
      }
    }

    loadPlans();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSelectedPlan() {
      if (!selectedPlanId) {
        setSelectedPlanDetail(null);
        setSelectedPlanProgress(null);
        return;
      }

      setSelectedPlanLoading(true);
      try {
        const planResponse = await getRehabPlanById(selectedPlanId);
        const progressResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080'}/rehab-plans/${selectedPlanId}/progress`);

        if (!progressResponse.ok) {
          throw new Error(await progressResponse.text());
        }

        const progressData = await progressResponse.json();
        if (!active) {
          return;
        }

        setSelectedPlanDetail(planResponse);
        setSelectedPlanProgress(progressData);
      } catch (error) {
        if (!active) {
          return;
        }
        setSelectedPlanDetail(null);
        setSelectedPlanProgress(null);
      } finally {
        if (active) {
          setSelectedPlanLoading(false);
        }
      }
    }

    loadSelectedPlan();

    return () => {
      active = false;
    };
  }, [selectedPlanId]);

  const selectedPlanExists = plans.some((plan) => Number(plan.id) === Number(selectedPlanId));

  async function refreshPlans() {
    setPlansLoading(true);
    try {
      const response = await listRehabPlans();
      const list = Array.isArray(response) ? response : response?.data || [];
      setPlans(list);
      setPlansMessage(list.length > 0 ? '' : 'No rehabilitation plans found yet.');
      setSelectedPlanId((currentPlanId) => {
        if (currentPlanId && list.some((plan) => Number(plan.id) === Number(currentPlanId))) {
          return currentPlanId;
        }

        if (selectedPatient) {
          const nextPlan = list.filter((plan) => matchesPatient(plan, selectedPatient)).sort(comparePlans)[0];
          return nextPlan?.id || list[0]?.id || null;
        }

        return list[0]?.id || null;
      });
    } catch (error) {
      setPlansMessage(error.message || 'Failed to load rehabilitation plans.');
    } finally {
      setPlansLoading(false);
    }
  }

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: Menu },
    { key: 'patients', label: 'Patients', icon: Users },
    { key: 'library', label: 'Exercise Library', icon: ClipboardList },
    { key: 'assign', label: 'Assign Exercises', icon: CalendarDays },
  ];

  const planSummary = selectedPlanDetail || selectedPlan;

  async function handleGenerateAI() {
    const userId = Number(session?.id || 0);
    if (!userId) {
      setPlansMessage('Select a logged-in therapist before generating AI suggestions.');
      return;
    }

    const promptLines = [
      'Generate concise clinical suggestions for this rehab patient.',
      `Therapist: ${session?.fullName || 'Unknown therapist'}`,
      `Patient: ${selectedPatient?.fullName || 'No patient selected'}`,
      `Plan: ${planSummary?.title || 'No plan selected'}`,
      `Goal: ${planSummary?.goal || 'Not provided'}`,
      `Completion: ${completionPercent}%`,
      `Average pain: ${averagePain.toFixed(1)}`,
      `Average fatigue: ${averageFatigue.toFixed(1)}`,
      `Status: ${currentStatus}`,
      `Recent exercises: ${progressEntries.slice(0, 5).map((entry) => `${entry.exercise} (${entry.completion_status || 'pending'})`).join('; ') || 'None'}`,
      'Return 3 short recommendations and keep the tone clinical and practical.',
    ];

    setAiLoading(true);
    try {
      const response = await generateAISuggestions({
        user_id: userId,
        message: promptLines.join('\n'),
      });

      const recommendations = Array.isArray(response?.recommendations) ? response.recommendations : [];
      setAiInsights([
        {
          title: response?.response || 'AI guidance generated',
          body: recommendations.length > 0 ? recommendations.join(' ') : 'No recommendations returned.',
          tone: response?.risk_level === 'high' ? 'warning' : response?.risk_level === 'medium' ? 'warning' : 'success',
        },
        ...recommendations.slice(0, 3).map((recommendation, index) => ({
          title: `Suggestion ${index + 1}`,
          body: recommendation,
          tone: 'info',
        })),
      ]);
      setPlansMessage('AI suggestions loaded from the backend.');
      setHeaderNotice('AI suggestions refreshed');
      setTimeout(() => setHeaderNotice(''), 3000);
    } catch (error) {
      setAiInsights([
        {
          title: 'AI endpoint unavailable',
          body: 'Showing local clinical guidance until the backend model comes back online.',
          tone: 'warning',
        },
        ...selectedInsights,
      ]);
      setPlansMessage(error.message || 'Failed to generate AI suggestions.');
      setHeaderNotice('AI service unavailable, using local guidance');
      setTimeout(() => setHeaderNotice(''), 3000);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.08),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.08),transparent_24%),linear-gradient(180deg,#f8fbff_0%,#f4f7fb_40%,#eef3f9_100%)] dark:bg-dark-bg">
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 p-4 md:p-6 xl:p-8">
          <div className="mb-6 overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-dark-border dark:bg-dark-surface/90">
            <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-300">
                  <Plus className="h-3.5 w-3.5" />
                  Clinical dashboard
                </div>
                <h1 className="font-heading text-3xl font-bold tracking-tight text-neutral-950 dark:text-white md:text-5xl">
                  Welcome back, {session?.fullName || 'Doctor'}
                </h1>
                <p className="max-w-3xl text-base leading-7 text-neutral-600 dark:text-neutral-300 md:text-lg">
                  Review patient recovery at a glance, inspect trends, and keep the therapist workflow clean and fast.
                </p>
                {headerNotice ? (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
                    <Sparkles className="h-4 w-4" />
                    {headerNotice}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                {navItems.map((item) => (
                  <Button
                    key={item.label}
                    type="button"
                    variant={activeTab === item.key ? 'primary' : 'outline'}
                    onClick={() => setActiveTab(item.key)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                ))}
                <Button type="button" variant="ghost" onClick={handleGenerateAI}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {aiLoading ? 'Generating...' : 'Generate AI'}
                </Button>
                <Button variant="ghost" size="sm" type="button" onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
                <ThemeToggle />
              </div>
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <div className="grid gap-6 xl:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.55fr)_minmax(300px,0.85fr)] xl:items-start">
              <motion.aside initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6 xl:sticky xl:top-6">
                <Card className="overflow-hidden border-neutral-200/80 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90">
                  <CardHeader className="border-b border-neutral-100 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/60">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
                      <Users className="h-3.5 w-3.5" />
                      Patient selector
                    </div>
                    <CardTitle className="text-2xl text-neutral-950 dark:text-white">Find a patient</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    <Input
                      type="search"
                      label="Search patients"
                      placeholder="Search by name, email, or reg no"
                      value={patientSearch}
                      onChange={(event) => setPatientSearch(event.target.value)}
                    />

                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Patients</p>
                        <p className="mt-1 text-2xl font-bold text-neutral-950 dark:text-white">{createdPatients.length}</p>
                      </div>
                      <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Plans</p>
                        <p className="mt-1 text-2xl font-bold text-neutral-950 dark:text-white">{plans.length}</p>
                      </div>
                      <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Visible</p>
                        <p className="mt-1 text-2xl font-bold text-neutral-950 dark:text-white">{visiblePatients.length}</p>
                      </div>
                    </div>

                    <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                      {visiblePatients.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-400">
                          No matching patients.
                        </div>
                      ) : visiblePatients.map((patient) => {
                        const isSelected = Number(selectedPatient?.id) === Number(patient.id);
                        const patientPlan = plans.filter((plan) => matchesPatient(plan, patient)).sort(comparePlans)[0];

                        return (
                          <button
                            key={patient.id}
                            type="button"
                            onClick={() => {
                              setSelectedPatientId(String(patient.id));
                              if (patientPlan) {
                                setSelectedPlanId(patientPlan.id);
                              }
                            }}
                            className={`w-full rounded-3xl border p-4 text-left transition-all hover:-translate-y-0.5 ${isSelected
                              ? 'border-primary-500 bg-primary-50 shadow-md dark:border-primary-500/70 dark:bg-primary-950/20'
                              : 'border-neutral-200 bg-white hover:border-primary-300 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-primary-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar fallback={getFallback(patient.fullName)} size="md" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="truncate text-sm font-semibold text-neutral-950 dark:text-white">{patient.fullName}</p>
                                  <Badge variant={isSelected ? 'primary' : 'default'} size="sm">{isSelected ? 'Selected' : 'Patient'}</Badge>
                                </div>
                                <p className="mt-1 truncate text-xs text-neutral-500 dark:text-neutral-400">{patient.regNo || patient.loginId}</p>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                              <span className="inline-flex items-center gap-1"><HeartPulse className="h-3.5 w-3.5 text-danger-500" />Program {patientPlan?.title || 'None'}</span>
                              <span className="inline-flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-success-500" />#{patient.patientSequence}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-neutral-200/80 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90">
                  <CardHeader className="border-b border-neutral-100 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/60">
                    <CardTitle className="text-2xl text-neutral-950 dark:text-white">Quick stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-center justify-between rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/60">
                      <span className="text-sm text-neutral-600 dark:text-neutral-300">Active patients</span>
                      <span className="text-sm font-semibold text-neutral-950 dark:text-white">{createdPatients.length}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/60">
                      <span className="text-sm text-neutral-600 dark:text-neutral-300">Assigned plans</span>
                      <span className="text-sm font-semibold text-neutral-950 dark:text-white">{plans.length}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/60">
                      <span className="text-sm text-neutral-600 dark:text-neutral-300">Average pain</span>
                      <span className="text-sm font-semibold text-neutral-950 dark:text-white">{averagePain.toFixed(1)}/10</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.aside>

              <section className="min-w-0 space-y-6">
                <PatientOverviewCard patient={selectedPatient} plan={planSummary} progress={planProgress} />
                <ProgressMetrics progress={planProgress} entries={progressEntries} />
                <TimelineCard entries={progressEntries} />
              </section>

              <motion.aside initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }} className="space-y-6 xl:sticky xl:top-6">
                <QuickActionsPanel
                  onMarkReviewed={() => setPlansMessage('Marked reviewed locally. Open the plan editor to persist changes.')}
                  onEditProgram={() => setActiveTab('assign')}
                  onSendReminder={() => setPlansMessage('Reminder prepared for the selected patient.')}
                  onAddExercise={() => setActiveTab('assign')}
                  onGenerateAI={handleGenerateAI}
                />

                <Card className="overflow-hidden border-neutral-200/80 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90">
                  <CardHeader className="border-b border-neutral-100 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/60">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <Target className="h-3.5 w-3.5" />
                      Plan summary
                    </div>
                    <CardTitle className="text-2xl text-neutral-950 dark:text-white">Selected program</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
                      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Patient</p>
                      <p className="mt-2 text-sm font-semibold text-neutral-950 dark:text-white">{selectedPatient?.fullName || 'No patient selected'}</p>
                    </div>
                    <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
                      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Plan</p>
                      <p className="mt-2 text-sm font-semibold text-neutral-950 dark:text-white">{planSummary?.title || 'No plan selected'}</p>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{planSummary?.goal || 'Select a plan to see the summary.'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
                        <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Recovery score</p>
                        <p className="mt-2 text-2xl font-bold text-neutral-950 dark:text-white">{recoveryScore}</p>
                      </div>
                      <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
                        <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Status</p>
                        <Badge variant={currentStatus === 'Improving' ? 'success' : currentStatus === 'Needs Attention' ? 'warning' : 'danger'} size="sm" className="mt-2">{currentStatus}</Badge>
                      </div>
                    </div>
                    {selectedPlanLoading ? <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading snapshot...</p> : null}
                  </CardContent>
                </Card>

                <AIInsightsPanel insights={visibleInsights} />

                <Card className="overflow-hidden border-neutral-200/80 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90">
                  <CardHeader className="border-b border-neutral-100 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/60">
                    <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950/50 dark:text-neutral-300">
                      <Bell className="h-3.5 w-3.5" />
                      Notifications
                    </div>
                    <CardTitle className="text-2xl text-neutral-950 dark:text-white">Recent activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    {RECENT_ACTIVITY.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${activity.type === 'success' ? 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400' : activity.type === 'warning' ? 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400' : 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'}`}>
                          {activity.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : activity.type === 'warning' ? <AlertCircle className="h-4 w-4" /> : <Flame className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-neutral-950 dark:text-white">{activity.patient}</p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">{activity.action} - {activity.exercise}</p>
                        </div>
                        <span className="whitespace-nowrap text-xs text-neutral-500 dark:text-neutral-400">{activity.time}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <details className="overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90">
                  <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-neutral-950 dark:text-white">
                    Create patient and weekly plan
                  </summary>
                  <div className="space-y-4 border-t border-neutral-100 p-5 dark:border-neutral-800">
                    <form
                      className="space-y-4"
                      onSubmit={async (event) => {
                        event.preventDefault();
                        const result = await onCreatePatient(patientForm, session);
                        if (!result.ok) {
                          setPatientMessage(result.message);
                          return;
                        }

                        setPatientMessage(`Created ${result.account.fullName} with reg no ${result.account.regNo}`);
                        setPatientForm({ fullName: '', email: '' });
                        await refreshPlans();
                      }}
                    >
                      <Input
                        label="Patient full name"
                        placeholder="Sarah Johnson"
                        value={patientForm.fullName}
                        onChange={(event) => setPatientForm((prev) => ({ ...prev, fullName: event.target.value }))}
                        required
                      />
                      <Input
                        type="email"
                        label="Patient email"
                        placeholder="sarah.johnson@example.com"
                        value={patientForm.email}
                        onChange={(event) => setPatientForm((prev) => ({ ...prev, email: event.target.value }))}
                        required
                      />
                      <Button type="submit" className="w-full">Create patient</Button>
                    </form>
                    {patientMessage ? <p className="text-sm font-medium text-success-600 dark:text-success-400">{patientMessage}</p> : null}

                    <form
                      className="space-y-4 rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60"
                      onSubmit={async (event) => {
                        event.preventDefault();
                        const title = weeklyTitle.trim() || weeklyDefaultTitle;
                        const patientName = event.target.patient_name.value.trim();
                        const patientId = Number(createPlanPatientId) || 0;
                        const customNotes = weeklyNotes.trim();

                        if (!patientName) {
                          setWeeklyPlanMessage('Please provide a patient name or select a patient.');
                          return;
                        }

                        const entries = weeklyPreviewExercises.map((entry, index) => ({
                          ...entry,
                          order_index: index,
                          therapist_comments: customNotes,
                        }));

                        try {
                          await createRehabPlan({
                            title,
                            patient_name: patientName || createdPatients.find((patient) => patient.id === patientId)?.fullName || '',
                            patient_id: patientId,
                            therapist_name: session?.fullName || '',
                            goal: weeklyFocus.trim(),
                            status: 'active',
                            start_date: new Date().toISOString().slice(0, 10),
                            description: `${selectedCondition.label} · ${STAGE_OPTIONS.find((item) => item.value === weeklyStage)?.label || ''}`,
                            entries,
                          });
                          setWeeklyPlanMessage(`Created ${title} for ${patientName}`);
                          event.target.reset();
                          setCreatePlanPatientId('');
                          setWeeklyTitle('');
                          setWeeklyCondition('shoulder');
                          setWeeklyStage('early');
                          setWeeklyWeekNumber('1');
                          setWeeklyFocus('Mobility and control');
                          setWeeklyNotes('');
                          await refreshPlans();
                        } catch (error) {
                          setWeeklyPlanMessage(error.message || 'Failed to create plan');
                        }
                      }}
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Select label="Assign to existing patient" value={createPlanPatientId} onChange={(event) => setCreatePlanPatientId(event.target.value)}>
                          <option value="">-- none --</option>
                          {createdPatients.map((patient) => (
                            <option key={patient.id} value={patient.id}>{patient.fullName} - {patient.regNo}</option>
                          ))}
                        </Select>
                        <Input name="patient_name" label="Patient name" placeholder="John Doe" defaultValue={session?.fullName || ''} required />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <Select label="Condition / disease" value={weeklyCondition} onChange={(event) => setWeeklyCondition(event.target.value)}>
                          {CONDITION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </Select>
                        <Select label="Healing stage" value={weeklyStage} onChange={(event) => setWeeklyStage(event.target.value)}>
                          {STAGE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </Select>
                        <Input type="number" min="1" max="52" label="Week #" value={weeklyWeekNumber} onChange={(event) => setWeeklyWeekNumber(event.target.value)} />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input value={weeklyTitle} onChange={(event) => setWeeklyTitle(event.target.value)} label="Plan title" placeholder={weeklyDefaultTitle} />
                        <Input value={weeklyFocus} onChange={(event) => setWeeklyFocus(event.target.value)} label="Weekly focus" placeholder="Mobility and control" />
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <Textarea
                          label="Exercises preview"
                          readOnly
                          value={weeklyPreviewExercises.map((entry) => `${entry.exercise}\n${entry.sets} sets x ${entry.reps}`).join('\n\n')}
                          className="min-h-[200px] bg-neutral-950 text-neutral-100 dark:bg-neutral-950"
                        />
                        <Textarea
                          label="Therapist notes"
                          value={weeklyNotes}
                          onChange={(event) => setWeeklyNotes(event.target.value)}
                          placeholder="Add reminders, load limits, or progression cues."
                          className="min-h-[200px]"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-neutral-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-950/70">
                        <div className="text-sm text-neutral-600 dark:text-neutral-300">
                          {weeklyPreviewExercises.length} exercises - {selectedCondition.label} - {STAGE_OPTIONS.find((item) => item.value === weeklyStage)?.label}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" onClick={() => setWeeklyTitle(weeklyDefaultTitle)}>Use suggested title</Button>
                          <Button type="submit">Upload weekly plan</Button>
                        </div>
                      </div>

                      {weeklyPlanMessage ? <p className="text-sm font-medium text-success-600 dark:text-success-400">{weeklyPlanMessage}</p> : null}
                    </form>
                  </div>
                </details>
              </motion.aside>
            </div>
          )}

          {activeTab === 'patients' && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Created Patients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {createdPatients.length === 0 ? (
                        <p className="text-neutral-600 dark:text-neutral-400">No patients created yet.</p>
                      ) : (
                        createdPatients.map((patient) => (
                          <div key={patient.id} className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-dark-surface">
                            <Avatar fallback={getFallback(patient.fullName)} size="md" />
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <p className="font-semibold font-heading text-neutral-900 dark:text-white">{patient.fullName}</p>
                                <Badge variant="success" size="sm">active</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                                <span className="flex items-center gap-1"><Search className="h-3 w-3" />Created {new Date(patient.createdAt).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />Reg no: {patient.regNo}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold font-heading text-primary-600 dark:text-primary-400">#{patient.patientSequence}</p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-500">patient ID: {patient.patientId}</p>
                            </div>
                            <Button variant="ghost" size="sm" type="button"><MoreHorizontal className="h-4 w-4" /></Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Patient Tools</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full" type="button" onClick={() => setActiveTab('dashboard')}>Back to dashboard</Button>
                    <Button className="w-full" variant="outline" type="button" onClick={() => setActiveTab('library')}>Open exercise library</Button>
                    <Button className="w-full" variant="ghost" type="button" onClick={() => setActiveTab('assign')}>Assign exercises</Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {activeTab === 'library' && (
            <div className="space-y-6">
              <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-start">
                <PlanList
                  plans={visiblePatients.length ? plans : plans}
                  onFetchPlans={refreshPlans}
                  onSelect={(id) => {
                    setSelectedPlanId(id);
                    const plan = plans.find((item) => Number(item.id) === Number(id));
                    if (plan?.patient_id) {
                      setSelectedPatientId(String(plan.patient_id));
                    }
                    if (id) {
                      setActiveTab('assign');
                    }
                  }}
                  selectedPlanId={selectedPlanId}
                />

                <Card className="xl:w-[320px]">
                  <CardHeader>
                    <CardTitle>Library status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
                      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Selected plan</p>
                      <p className="mt-2 text-sm font-semibold text-neutral-900 dark:text-white">
                        {selectedPlanId ? `Plan #${selectedPlanId}` : 'No plan selected'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
                      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Loaded plans</p>
                      <p className="mt-2 text-sm font-semibold text-neutral-900 dark:text-white">{plans.length}</p>
                    </div>
                    <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                      Use the library to review available plans, then open Assign Exercises to update their exercise rows.
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button type="button" onClick={() => setActiveTab('assign')}>Go to assign screen</Button>
                      <Button type="button" variant="outline" onClick={() => setActiveTab('dashboard')}>Back to dashboard</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {plansLoading ? <p className="text-neutral-600 dark:text-neutral-400">Loading plans...</p> : null}
              {plansMessage ? <p className="text-sm text-neutral-600 dark:text-neutral-400">{plansMessage}</p> : null}
            </div>
          )}

          {activeTab === 'assign' && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pick a plan</CardTitle>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Select a plan, then update the exercise rows in the editor on the right.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {visiblePatients.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-400">
                        No plans available yet. Open the library to reload.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {plans.map((plan) => {
                          const isSelected = selectedPlanId === plan.id;
                          return (
                            <button
                              key={plan.id}
                              type="button"
                              onClick={() => {
                                setSelectedPlanId(plan.id);
                                if (plan.patient_id) {
                                  setSelectedPatientId(String(plan.patient_id));
                                }
                              }}
                              className={`w-full rounded-3xl border p-4 text-left transition-all hover:-translate-y-0.5 ${isSelected
                                ? 'border-emerald-500 bg-emerald-50 shadow-sm dark:border-emerald-500/80 dark:bg-emerald-950/20'
                                : 'border-neutral-200 bg-white hover:border-emerald-300 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-emerald-700'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <strong className="min-w-0 truncate text-sm text-neutral-900 dark:text-white">{plan.title || `Plan ${plan.id}`}</strong>
                                <Badge variant="primary" size="sm">{plan.status || 'active'}</Badge>
                              </div>
                              <p className="mt-2 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                                {plan.patient_name || 'Unknown patient'}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex flex-col gap-2 pt-2">
                      <Button type="button" className="w-full" variant="outline" onClick={() => setActiveTab('library')}>
                        Open library
                      </Button>
                      <Button type="button" className="w-full" onClick={() => setActiveTab('dashboard')}>
                        Back to dashboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {selectedPlanExists && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Assign selected plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {createdPatients.length === 0 ? (
                        <p className="text-neutral-600">No created patients to assign to.</p>
                      ) : (
                        <div className="space-y-2">
                          <label>
                            <span>Select patient</span>
                            <select className="w-full rounded-md border p-2" value={assignPatient} onChange={(event) => setAssignPatient(event.target.value)}>
                              <option value="">-- choose patient --</option>
                              {createdPatients.map((patient) => (
                                <option key={patient.id} value={patient.id}>{patient.fullName} - {patient.regNo}</option>
                              ))}
                            </select>
                          </label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={async () => {
                                const patientId = Number(assignPatient);
                                if (!patientId) return alert('Select a patient to assign to');
                                const chosen = createdPatients.find((patient) => patient.id === patientId);
                                if (!confirm(`Assign this plan to ${chosen?.fullName || 'selected patient'}?`)) return;
                                try {
                                  await updateRehabPlan(selectedPlanId, { patient_id: patientId });
                                  setPlansMessage(`Assigned plan to ${chosen?.fullName || patientId}`);
                                  await refreshPlans();
                                } catch (error) {
                                  setPlansMessage(error.message || 'Failed to assign plan');
                                }
                              }}
                            >
                              Assign to patient
                            </Button>
                            <Button variant="ghost" onClick={() => { }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Workflow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                      Choose a rehabilitation plan, edit the exercises, and save changes directly to the backend. The editor persists each exercise row, then reloads the plan so the current state stays accurate.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="min-w-0">
                {selectedPlanExists ? (
                  <PlanEditor
                    planId={selectedPlanId}
                    onUpdated={async () => {
                      await refreshPlans();
                    }}
                    onDeleted={async () => {
                      await refreshPlans();
                    }}
                    showToast={() => { }}
                  />
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-neutral-600 dark:text-neutral-400">Select a plan to assign exercises.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
