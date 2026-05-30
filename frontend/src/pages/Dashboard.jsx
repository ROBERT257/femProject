import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import RehabAssistant from './RehabAssistant';
import RecoveryCard from '../components/RecoveryCard';
import RecommendationCard from '../components/RecommendationCard';
import AnalyticsCharts from '../components/AnalyticsCharts';
import WearableMetricsPlaceholder from '../components/WearableMetricsPlaceholder';
import GoogleFitConnect from './GoogleFitConnect';
import { generateRecommendations } from '../api/recommendations';
import { getAnalyticsSnapshot } from '../api/analytics';

export default function Dashboard({ session, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [recommendations, setRecommendations] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [score, setScore] = useState(78);

  useEffect(() => {
    let active = true;
    getAnalyticsSnapshot()
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
  };

  const subtitleByTab = {
    dashboard: 'Personalized rehab intelligence powered by your backend',
    assistant: 'Chat with the AI assistant and review recovery guidance',
    analytics: 'Track recovery trends, adherence, and wearable context',
  };

  const isAssistantTab = activeTab === 'assistant';
  const isAnalyticsTab = activeTab === 'analytics';

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto flex max-w-[1480px]">
        <Sidebar active={activeTab} onSelect={setActiveTab} onLogout={onLogout} />

        <main className="w-full p-4 md:p-8">
          <Navbar
            userName={session?.fullName || 'Patient'}
            title={titleByTab[activeTab] || titleByTab.dashboard}
            subtitle={subtitleByTab[activeTab] || subtitleByTab.dashboard}
          />

          {activeTab === 'dashboard' && (
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
        </main>
      </div>
    </div>
  );
}
