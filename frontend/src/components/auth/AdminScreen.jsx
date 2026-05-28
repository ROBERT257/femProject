import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import BrandMark from '../shared/BrandMark';
import { ArrowLeft, Users } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';

export default function AdminScreen({ 
  accounts, 
  onCreateTherapist,
  onBackToRoles,
  notice 
}) {
  const [therapistForm, setTherapistForm] = useState({ fullName: '', email: '' });
  const [formMessage, setFormMessage] = useState('');

  const therapistAccounts = accounts.filter((account) => account.role === 'therapist');
  const patientAccounts = accounts.filter((account) => account.role === 'patient');

  async function handleCreateTherapist(event) {
    event.preventDefault();

    const result = await onCreateTherapist(therapistForm);
    if (!result.ok) {
      setFormMessage(result.message);
      return;
    }

    setFormMessage('Therapist account created.');
    setTherapistForm({ fullName: '', email: '' });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 dark:from-dark-bg dark:via-dark-surface dark:to-dark-border">
      <div className="min-h-screen flex">
        {/* Left Side - Hero */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <BrandMark className="w-12 h-12 text-white bg-white/20 rounded-xl p-2" />
              <span className="text-3xl font-bold font-heading text-white">RehabTrack</span>
            </div>
          </div>

          <div className="relative z-10">
            <h1 className="text-5xl font-bold font-heading text-white mb-6 leading-tight">
              Create therapist accounts from the backend
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              Therapist credentials are generated on the server, stored in the database, and sent by email.
            </p>
            
            <div className="flex flex-wrap gap-4">
              {[
                { icon: Users, label: 'Backend creation' },
                { icon: Users, label: 'Stored accounts' },
                { icon: Users, label: 'Live roster' },
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                  <feature.icon className="w-5 h-5 text-white" />
                  <span className="text-white font-medium">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 text-white/60 text-sm">
            © 2024 RehabTrack. All rights reserved.
          </div>
        </div>

        {/* Right Side - Admin Panel */}
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl"
          >
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <BrandMark className="w-10 h-10 text-primary-600" />
              <span className="text-2xl font-bold font-heading text-neutral-900 dark:text-white">RehabTrack</span>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={onBackToRoles}
                className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
              </button>
              <h2 className="text-2xl font-bold font-heading text-neutral-900 dark:text-white">
                Admin Therapist Setup
              </h2>
            </div>

            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Create therapist accounts here. Credentials are generated on the backend and sent to the therapist's email.
            </p>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create Therapist Account</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTherapist} className="space-y-4">
                  <Input
                    label="Full name"
                    placeholder="Dr. Jane Smith"
                    value={therapistForm.fullName}
                    onChange={(e) => setTherapistForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    required
                  />
                  <Input
                    type="email"
                    label="Email address"
                    placeholder="jane.smith@hospital.com"
                    value={therapistForm.email}
                    onChange={(e) => setTherapistForm((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                  <Button type="submit" className="w-full">
                    Create therapist
                  </Button>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    The therapist logs in with the credentials sent to their email.
                  </p>
                  {formMessage && (
                    <p className="text-sm font-medium text-danger-600 dark:text-danger-400">
                      {formMessage}
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">Therapists</p>
                  <p className="text-3xl font-bold font-heading text-neutral-900 dark:text-white">{therapistAccounts.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">Patients</p>
                  <p className="text-3xl font-bold font-heading text-neutral-900 dark:text-white">{patientAccounts.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Notice Banner */}
            {notice.text && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 p-4 rounded-xl border-2 ${
                  notice.type === 'error'
                    ? 'bg-danger-50 border-danger-200 text-danger-800 dark:bg-danger-900/20 dark:border-danger-800 dark:text-danger-300'
                    : notice.type === 'success'
                    ? 'bg-success-50 border-success-200 text-success-800 dark:bg-success-900/20 dark:border-success-800 dark:text-success-300'
                    : notice.type === 'warning'
                    ? 'bg-warning-50 border-warning-200 text-warning-800 dark:bg-warning-900/20 dark:border-warning-800 dark:text-warning-300'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300'
                }`}
              >
                <p className="text-sm font-medium">{notice.text}</p>
              </motion.div>
            )}

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Therapist Roster</CardTitle>
              </CardHeader>
              <CardContent>
                {therapistAccounts.length === 0 ? (
                  <p className="text-neutral-600 dark:text-neutral-400">No therapist accounts have been created yet.</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {therapistAccounts.map((account) => (
                      <div key={account.id} className="flex items-center justify-between gap-4 p-4 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-dark-surface">
                        <div>
                          <p className="font-semibold font-heading text-neutral-900 dark:text-white">{account.fullName}</p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">ID: {account.regNo} · Email: {account.email}</p>
                        </div>
                        <Badge variant="success" size="sm">Active</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-6 flex gap-2">
              <Button
                variant="ghost"
                onClick={onBackToRoles}
                className="flex-1"
              >
                Back to roles
              </Button>
            </div>

            <div className="lg:hidden mt-6 flex justify-center">
              <ThemeToggle />
            </div>
          </motion.div>
        </div>

        {/* Theme Toggle - Desktop */}
        <div className="hidden lg:flex absolute top-8 right-8">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
