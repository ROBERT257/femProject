import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Clock3, Link2, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import WearableCard from '../components/WearableCard';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { getWearableData, startGoogleFitLogin, syncGoogleFit, formatWearableTimestamp } from '../api/wearables';

function emptyMetrics() {
  return { steps: 0, heart_rate: null, sleep_hours: null, calories: null };
}

export default function GoogleFitConnect({ userId, onBack }) {
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [syncedAt, setSyncedAt] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState('Connect Google Fit to power analytics and AI context with wearable data.');
  const [status, setStatus] = useState('Not connected');

  useEffect(() => {
    let active = true;

    async function loadWearableData() {
      if (!userId) {
        return;
      }

      setIsLoading(true);
      try {
        const response = await getWearableData(userId);
        if (!active) {
          return;
        }

        const rows = response?.data || [];
        if (rows.length > 0) {
          const latest = rows[0];
          setMetrics({
            steps: latest.steps || 0,
            heart_rate: latest.heart_rate ?? null,
            sleep_hours: latest.sleep_hours ?? null,
            calories: latest.calories ?? null,
          });
          setSyncedAt(latest.recorded_at || null);
          setStatus('Connected');
          setMessage('Latest wearable data loaded from PostgreSQL.');
        } else {
          setStatus('Not connected');
        }
      } catch {
        if (!active) {
          return;
        }
        setStatus('Not connected');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadWearableData();

    return () => {
      active = false;
    };
  }, [userId]);

  const lastSyncLabel = useMemo(() => formatWearableTimestamp(syncedAt), [syncedAt]);

  const handleConnect = () => {
    startGoogleFitLogin(userId);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setMessage('Syncing Google Fit metrics...');

    try {
      const response = await syncGoogleFit(userId);
      setMetrics({
        steps: response.steps || 0,
        heart_rate: response.heart_rate ?? null,
        sleep_hours: response.sleep_hours ?? null,
        calories: response.calories ?? null,
      });
      setSyncedAt(response.synced_at || new Date().toISOString());
      setStatus('Connected');
      setMessage('Google Fit sync completed successfully.');
    } catch (error) {
      setMessage(error.message || 'Failed to sync wearable data.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef7f2_100%)] px-4 py-8 dark:bg-neutral-950">
      <div className="mx-auto max-w-6xl space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-neutral-950/80 md:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/60 dark:text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                Wearable integration
              </div>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-neutral-950 dark:text-white md:text-5xl">
                Connect Google Fit for recovery-aware coaching
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-neutral-600 dark:text-neutral-400 md:text-lg">
                Bring your daily steps, resting heart rate, calories, sleep, and activity sessions into the rehab dashboard.
                The chatbot and recommendations continue to work even without wearable data.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Badge variant="success" size="sm">{status}</Badge>
                <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-sm text-neutral-600 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                  <Clock3 className="h-4 w-4" />
                  Last sync: {lastSyncLabel}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px] lg:grid-cols-1">
              <Card className="border-emerald-100 bg-emerald-50/70 dark:border-emerald-950 dark:bg-emerald-950/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm dark:bg-neutral-900">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">Secure token storage</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Refresh tokens stay server-side only.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
                      <Link2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">Google OAuth flow</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">State is validated before tokens are saved.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={handleConnect} disabled={!userId || isLoading}>
              Connect Google Fit
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleSync} disabled={!userId || isSyncing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync latest data
            </Button>
            {onBack ? (
              <Button variant="ghost" onClick={onBack}>
                Back to dashboard
              </Button>
            ) : null}
          </div>

          <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">{message}</p>
        </motion.section>

        <WearableCard metrics={metrics} />

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: 'AI context', text: 'Wearable summaries are appended to the assistant prompt when available.' },
            { title: 'Recovery score', text: 'Sleep and heart rate can lower recovery and increase fatigue estimates.' },
            { title: 'Recommendations', text: 'Low steps or poor sleep can trigger lighter mobility guidance.' },
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle className="text-xl">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-400">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}