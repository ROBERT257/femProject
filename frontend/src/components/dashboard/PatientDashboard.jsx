import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { MetricCard } from '../ui/MetricCard';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import BrandMark from '../shared/BrandMark';
import ThemeToggle from '../ui/ThemeToggle';
import {
  MenuIcon,
  GridIcon,
  ActivityIcon,
  LogOut,
  Bell,
  FlameIcon as Flame,
  TodayIcon as Calendar,
  ArrowDownIcon as ArrowDown,
  CheckCircle,
  Clock,
  Target,
  Zap,
} from '../shared/Icons';

export default function PatientDashboard({ session, onLogout }) {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [planCount, setPlanCount] = useState(null);

  useEffect(() => {
    let active = true;

    fetch('/rehab-plans')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await response.text());
        }

        const payload = await response.json();
        if (!active) {
          return;
        }

        setBackendStatus('connected');
        setPlanCount(Array.isArray(payload) ? payload.length : 0);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setBackendStatus('offline');
        setPlanCount(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const metrics = [
    {
      title: 'Streak',
      value: '7 days',
      change: 'Keep it going!',
      trend: 'positive',
      icon: Flame,
    },
    {
      title: 'Today',
      value: '3/7',
      change: 'sessions completed',
      trend: 'neutral',
      icon: Calendar,
    },
    {
      title: 'Pain Trend',
      value: '1 pts',
      change: 'Since last week',
      trend: 'positive',
      icon: ArrowDown,
    },
  ];

  const exercises = [
    {
      name: 'Shoulder Flexion Stretch',
      detail: '3 sets × 10 reps · 3x daily · 5 min',
      note: 'Stand or sit upright. Slowly raise your affected arm...',
      completed: true,
    },
    {
      name: 'Wall Slides',
      detail: '3 sets × 8 reps · 2x daily · 7 min',
      note: 'Keep your back flat against the wall and move slowly.',
      completed: true,
    },
    {
      name: 'External Rotation',
      detail: '2 sets × 12 reps · 2x daily · 4 min',
      note: 'Keep your elbow at your side and rotate outward.',
      completed: false,
    },
  ];

  const painData = [
    { day: 'Mon', value: 72 },
    { day: 'Tue', value: 88 },
    { day: 'Wed', value: 60 },
    { day: 'Thu', value: 56 },
    { day: 'Fri', value: 80 },
    { day: 'Sat', value: 63 },
    { day: 'Sun', value: 55 },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-dark-surface border-r border-neutral-200 dark:border-dark-border h-screen sticky top-0">
          <div className="p-6 border-b border-neutral-200 dark:border-dark-border">
            <div className="flex items-center gap-3">
              <BrandMark className="w-10 h-10 text-primary-600" />
              <span className="text-xl font-bold font-heading text-neutral-900 dark:text-white">
                RehabTrack
              </span>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {[
              { label: 'Dashboard', icon: GridIcon, active: true },
              { label: 'My Exercises', icon: ActivityIcon },
              { label: 'My Progress', icon: Target },
            ].map((item) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  item.active
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-neutral-200 dark:border-dark-border">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-all"
            >
              <LogOut className="h-5 w-5" />
              Log out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold font-heading text-neutral-900 dark:text-white mb-2">
                Hello, {session?.fullName || 'John'}
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400">
                Keep up the great work on your recovery journey
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Backend Status */}
              <Badge 
                variant={backendStatus === 'connected' ? 'success' : backendStatus === 'offline' ? 'danger' : 'default'}
                size="md"
              >
                {backendStatus === 'connected' 
                  ? `Connected · ${planCount ?? 0} rehab plans` 
                  : backendStatus === 'offline' 
                  ? 'Not reachable' 
                  : 'Checking connection'}
              </Badge>

              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>

              <ThemeToggle />
            </div>
          </div>

          {/* Metrics Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            {metrics.map((metric, index) => (
              <MetricCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                change={metric.change}
                icon={metric.icon}
                trend={metric.trend}
              />
            ))}
          </motion.div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Exercises */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Today's Exercises</CardTitle>
                    <Badge variant="success">3 of 7 done</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {exercises.map((exercise, index) => (
                      <motion.div
                        key={exercise.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                          exercise.completed
                            ? 'bg-success-50 border-success-200 dark:bg-success-900/20 dark:border-success-800'
                            : 'bg-white border-neutral-200 dark:bg-dark-surface dark:border-neutral-700'
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {exercise.completed ? (
                            <div className="h-12 w-12 rounded-xl bg-success-500 flex items-center justify-center text-white">
                              <CheckCircle className="h-6 w-6" />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-400">
                              <Clock className="h-6 w-6" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold font-heading text-neutral-900 dark:text-white mb-1">
                            {exercise.name}
                          </p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                            {exercise.detail}
                          </p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-500">
                            {exercise.note}
                          </p>
                        </div>

                        <Button size="sm" variant={exercise.completed ? 'secondary' : 'primary'}>
                          {exercise.completed ? 'Log Again' : 'Start'}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pain Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Pain Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 rounded-xl bg-danger-50 dark:bg-danger-900/20">
                      <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        Before Exercise
                      </p>
                      <p className="text-3xl font-bold font-heading text-danger-600 dark:text-danger-400">
                        5.1
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                        avg pain level
                      </p>
                    </div>

                    <div className="text-center p-4 rounded-xl bg-success-50 dark:bg-success-900/20">
                      <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        After Exercise
                      </p>
                      <p className="text-3xl font-bold font-heading text-success-600 dark:text-success-400">
                        3.7
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                        avg pain level
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
                      Pain Reduction
                    </p>
                    <div className="flex items-end gap-2 h-24">
                      {painData.map((data, index) => (
                        <div key={data.day} className="flex-1 flex flex-col items-center gap-2">
                          <div
                            className="w-full rounded-t-lg bg-success-500 transition-all hover:bg-success-600"
                            style={{ height: `${data.value}%` }}
                          />
                          <span className="text-xs text-neutral-500 dark:text-neutral-500">
                            {data.day}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
