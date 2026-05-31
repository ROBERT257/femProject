import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import RehabAssistant from './RehabAssistant';
import RecoveryCard from '../components/RecoveryCard';
import RecommendationCard from '../components/RecommendationCard';
import AnalyticsCharts from '../components/AnalyticsCharts';
import WearableMetricsPlaceholder from '../components/WearableMetricsPlaceholder';
import GoogleFitConnect from './GoogleFitConnect';
import MyPlans from './MyPlans';
import { generateRecommendations } from '../api/recommendations';
import { getAnalyticsSnapshot } from '../api/analytics';

export default function Dashboard({ session, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [recommendations, setRecommendations] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [score, setScore] = useState(78);

  useEffect(() => {
    let active = true;
    getAnalyticsSnapshot(session?.role === 'patient' ? { patientId: session?.id } : {})
      .then((snapshot) => {
        if (!active) {
          return;
        }
        setAnalyticsData(snapshot.painTrend || []);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setAnalyticsData([]);
      });

    generateRecommendations({
      pain_level: 7,
      sleep_hours: 5,
      fatigue_level: 6,
      workout_completed: false,
    })
      .then((payload) => {
        if (!active) {
          return;
        }
        setRecommendations(payload?.recommendations || []);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setRecommendations(['Unable to load recommendations from backend.']);
      });

    return () => {
      active = false;
    };
  }, []);

  const recoveryStatus = useMemo(() => {
    if (score >= 80) {
      return 'Excellent Recovery';
    }
    if (score >= 65) {
      return 'Good Recovery';
    }
    return 'Needs Attention';
  }, [score]);

  const handleAIResponse = (payload) => {
    const nextRecommendations = payload?.recommendations || [];
    if (nextRecommendations.length > 0) {
      setRecommendations(nextRecommendations);
    }

    const risk = payload?.risk_level || 'low';
    if (risk === 'high') {
      setScore(52);
      return;
    }
    if (risk === 'medium') {
      setScore(67);
      return;
    }
    setScore(82);
  };

  if (activeTab === 'wearables') {
    return <GoogleFitConnect userId={session?.id || 1} onBack={() => setActiveTab('dashboard')} />;
  }

  const titleByTab = {
    dashboard: 'AI Rehab Dashboard',
    assistant: 'Rehab Assistant',
    analytics: 'Recovery Analytics',
    myplans: 'My Rehabilitation Plans',
  };

  const subtitleByTab = {
    dashboard: 'Personalized rehab intelligence powered by your backend',
    assistant: 'Chat with the AI assistant and review recovery guidance',
    analytics: 'Track recovery trends, adherence, and wearable context',
    myplans: 'View and update the plans assigned to you',
  };

  const isAssistantTab = activeTab === 'assistant';
  const isAnalyticsTab = activeTab === 'analytics';
  const isDashboardTab = activeTab === 'dashboard';
  const isMyPlansTab = activeTab === 'myplans';

  const scoreTone = score >= 80 ? 'from-emerald-500 to-teal-500' : score >= 65 ? 'from-amber-400 to-orange-500' : 'from-rose-500 to-pink-500';
  const scoreAccent = score >= 80 ? 'text-emerald-700 dark:text-emerald-300' : score >= 65 ? 'text-amber-700 dark:text-amber-300' : 'text-rose-700 dark:text-rose-300';
  const dashboardSummary = [
    { label: 'Recovery score', value: `${score}%`, detail: recoveryStatus },
    { label: 'Live assistant', value: 'Online', detail: 'Context-aware guidance' },
    { label: 'Wearable sync', value: 'Ready', detail: 'Google Fit connected view' },
    { label: 'Active tab', value: titleByTab[activeTab] || 'Dashboard', detail: 'Updated instantly' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_28%),radial-gradient(circle_at_85%_12%,_rgba(59,130,246,0.10),_transparent_24%),linear-gradient(180deg,_#f7fafc_0%,_#eef4f8_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_28%),radial-gradient(circle_at_85%_12%,_rgba(59,130,246,0.12),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] dark:text-white">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-[-6rem] top-[-5rem] h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-400/20" />
        <div className="absolute right-[-4rem] top-40 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-400/10" />
        <div className="absolute bottom-[-6rem] left-1/3 h-80 w-80 rounded-full bg-indigo-300/10 blur-3xl dark:bg-indigo-500/10" />
      </div>

      <div className="relative mx-auto flex max-w-[1540px]">
        <Sidebar active={activeTab} onSelect={setActiveTab} onLogout={onLogout} />

        <main className="w-full p-4 md:p-6 xl:p-8">
          <Navbar
            userName={session?.fullName || 'Patient'}
            title={titleByTab[activeTab] || titleByTab.dashboard}
            subtitle={subtitleByTab[activeTab] || subtitleByTab.dashboard}
          />

          <section className="mb-6 overflow-hidden rounded-[30px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 md:p-6">
            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr] xl:items-stretch">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Personalized rehab cockpit
                </div>
                <div className="space-y-3">
                  <h2 className="max-w-3xl font-heading text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white md:text-5xl">
                    Clinical clarity, modern rhythm, and every recovery signal in one place.
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 md:text-base">
                    Review AI guidance, track recovery trends, and jump into your assigned plan without losing context.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {session?.role === 'patient' && activeTab !== 'myplans' ? (
                    <button
                      className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                      onClick={() => setActiveTab('myplans')}
                    >
                      View my plans
                    </button>
                  ) : null}
                  <button
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-emerald-400/40 dark:hover:text-emerald-200"
                    onClick={() => setActiveTab('assistant')}
                  >
                    Open assistant
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {dashboardSummary.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-950/60"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{item.label}</p>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <strong className={`text-lg font-heading ${item.label === 'Recovery score' ? scoreAccent : 'text-slate-950 dark:text-white'}`}>{item.value}</strong>
                      {item.label === 'Recovery score' ? (
                        <span className={`inline-flex rounded-full bg-gradient-to-r ${scoreTone} px-2.5 py-1 text-[11px] font-semibold text-white`}>
                          Live
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {isDashboardTab && (
            <>
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
                <div className="xl:col-span-8">
                  <RehabAssistant userId={session?.id || 1} onResponse={handleAIResponse} />
                </div>
                <div className="space-y-5 xl:col-span-4">
                  <RecoveryCard score={score} status={recoveryStatus} />
                  <RecommendationCard recommendations={recommendations} />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-12">
                <div className="xl:col-span-8">
                  <AnalyticsCharts data={analyticsData} />
                </div>
                <div className="xl:col-span-4">
                  <WearableMetricsPlaceholder />
                </div>
              </div>
            </>
          )}

          {isAssistantTab && (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
              <div className="xl:col-span-8">
                <RehabAssistant userId={session?.id || 1} onResponse={handleAIResponse} />
              </div>
              <div className="space-y-5 xl:col-span-4">
                <RecoveryCard score={score} status={recoveryStatus} />
                <RecommendationCard recommendations={recommendations} />
                <WearableMetricsPlaceholder />
              </div>
            </div>
          )}

          {isAnalyticsTab && (
            <div className="space-y-6">
              <AnalyticsCharts data={analyticsData} />
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
                <div className="xl:col-span-4">
                  <RecoveryCard score={score} status={recoveryStatus} />
                </div>
                <div className="xl:col-span-8">
                  <RecommendationCard recommendations={recommendations} />
                </div>
              </div>
              <WearableMetricsPlaceholder />
            </div>
          )}

          {isMyPlansTab && (
            <MyPlans session={session} />
          )}
        </main>
      </div>
    </div>
  );
}
