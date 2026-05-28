import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { MetricCard } from '../ui/MetricCard';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Avatar } from '../ui/Avatar';
import BrandMark from '../shared/BrandMark';
import ThemeToggle from '../ui/ThemeToggle';
import {
  MenuIcon,
  UsersIcon,
  ActivityIcon,
  CalendarDays,
  LogOut,
  Bell,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  Search,
  Filter,
  Plus,
} from 'lucide-react';

function getFallback(value) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function TherapistDashboard({ session, accounts, onCreatePatient, onLogout }) {
  const [patientForm, setPatientForm] = useState({ fullName: '', email: '' });
  const [formMessage, setFormMessage] = useState('');
  const therapistAccountId = session?.id;

  const metrics = [
    {
      title: 'Active Patients',
      value: accounts.filter((account) => account.role === 'patient' && account.createdByTherapistId === therapistAccountId).length,
      change: 'Created by you',
      trend: 'positive',
      icon: UsersIcon,
    },
    {
      title: 'Plans Assigned',
      value: '18',
      change: '+5 this week',
      trend: 'positive',
      icon: Target,
    },
    {
      title: 'Avg Recovery',
      value: '78%',
      change: '+5% improvement',
      trend: 'positive',
      icon: TrendingUp,
    },
  ];

  const createdPatients = accounts.filter(
    (account) => account.role === 'patient' && account.createdByTherapistId === therapistAccountId,
  );

  const recentActivity = [
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

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg">
      <div className="flex">
        <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-dark-surface border-r border-neutral-200 dark:border-dark-border h-screen sticky top-0">
          <div className="p-6 border-b border-neutral-200 dark:border-dark-border">
            <div className="flex items-center gap-3">
              <BrandMark className="w-10 h-10 text-primary-600" />
              <span className="text-xl font-bold font-heading text-neutral-900 dark:text-white">RehabTrack</span>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {[
              { label: 'Dashboard', icon: MenuIcon, active: true },
              { label: 'Patients', icon: UsersIcon },
              { label: 'Exercise Library', icon: ActivityIcon },
              { label: 'Assign Exercises', icon: CalendarDays },
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

        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold font-heading text-neutral-900 dark:text-white mb-2">
                Welcome back, {session?.fullName || 'Dr.'}
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400">Create patients and track their recovery progress.</p>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <ThemeToggle />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle>Create Patient Account</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const result = await onCreatePatient(patientForm, session);
                    if (!result.ok) {
                      setFormMessage(result.message);
                      return;
                    }

                    setFormMessage(`Created ${result.account.fullName} with reg no ${result.account.regNo}`);
                    setPatientForm({ fullName: '', email: '' });
                  }}
                >
                  <Input
                    label="Patient full name"
                    placeholder="Sarah Johnson"
                    value={patientForm.fullName}
                    onChange={(e) => setPatientForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    required
                  />
                  <Input
                    type="email"
                    label="Patient email"
                    placeholder="sarah.johnson@example.com"
                    value={patientForm.email}
                    onChange={(e) => setPatientForm((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                  <div className="flex items-end">
                    <Button type="submit" className="w-full md:w-auto">
                      Create patient
                    </Button>
                  </div>
                </form>
                <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                  The patient registration details are generated on the backend.
                </p>
                {formMessage && (
                  <p className="mt-2 text-sm font-medium text-success-600 dark:text-success-400">{formMessage}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            {metrics.map((metric) => (
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Created Patients</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm"><Search className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm"><Filter className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {createdPatients.length === 0 ? (
                      <p className="text-neutral-600 dark:text-neutral-400">No patients created yet.</p>
                    ) : (
                      createdPatients.map((patient, index) => (
                        <motion.div
                          key={patient.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-center gap-4 p-4 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-dark-surface hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer"
                        >
                          <Avatar fallback={getFallback(patient.fullName)} size="md" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold font-heading text-neutral-900 dark:text-white">{patient.fullName}</p>
                              <Badge variant="success" size="sm">active</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Created {new Date(patient.createdAt).toLocaleDateString()}</span>
                              <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />Reg no: {patient.regNo}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold font-heading text-primary-600 dark:text-primary-400">#{patient.patientSequence}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">patient ID: {patient.patientId}</p>
                          </div>
                          <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                        </motion.div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <div className={`flex-shrink-0 p-2 rounded-lg ${
                          activity.type === 'success'
                            ? 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400'
                            : activity.type === 'warning'
                            ? 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400'
                            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                        }`}>
                          {activity.type === 'success' ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : activity.type === 'warning' ? (
                            <AlertCircle className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 dark:text-white mb-1">{activity.patient}</p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">{activity.action} - {activity.exercise}</p>
                        </div>

                        <span className="text-xs text-neutral-500 dark:text-neutral-500 whitespace-nowrap">{activity.time}</span>
                      </motion.div>
                    ))}
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
