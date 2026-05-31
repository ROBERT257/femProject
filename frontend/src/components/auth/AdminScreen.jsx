import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowLeft,
  ClipboardList,
  Download,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  Shield,
  UserCog,
  UserRound,
  Users,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import BrandMark from '../shared/BrandMark';
import ThemeToggle from '../ui/ThemeToggle';

const ROLE_OPTIONS = [
  { value: 'all', label: 'All roles' },
  { value: 'admin', label: 'Admins' },
  { value: 'therapist', label: 'Therapists' },
  { value: 'patient', label: 'Patients' },
];

function getRoleBadge(role) {
  if (role === 'admin') {
    return 'danger';
  }

  if (role === 'therapist') {
    return 'primary';
  }

  return 'success';
}

function getShortName(name = '') {
  return String(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function buildCsvRow(values) {
  return values.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',');
}

export default function AdminScreen({
  accounts,
  onCreateTherapist,
  onCreatePatient,
  onBackToRoles,
  notice,
}) {
  const [therapistForm, setTherapistForm] = useState({ fullName: '', email: '' });
  const [patientForm, setPatientForm] = useState({ fullName: '', email: '', therapistLoginId: '' });
  const [formMessage, setFormMessage] = useState('');
  const [patientMessage, setPatientMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activePanel, setActivePanel] = useState('overview');

  const sortedAccounts = useMemo(() => {
    const items = [...accounts];
    items.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    return items;
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return sortedAccounts.filter((account) => {
      if (roleFilter !== 'all' && account.role !== roleFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [account.fullName, account.email, account.loginId, account.regNo, account.createdBy]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });
  }, [roleFilter, searchTerm, sortedAccounts]);

  const roleCounts = useMemo(() => {
    return sortedAccounts.reduce((accumulator, account) => {
      accumulator[account.role] = (accumulator[account.role] || 0) + 1;
      return accumulator;
    }, { admin: 0, therapist: 0, patient: 0 });
  }, [sortedAccounts]);

  const therapistAccounts = useMemo(() => sortedAccounts.filter((account) => account.role === 'therapist'), [sortedAccounts]);
  const patientAccounts = useMemo(() => sortedAccounts.filter((account) => account.role === 'patient'), [sortedAccounts]);

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

  async function handleCreatePatient(event) {
    event.preventDefault();

    const therapistAccount = therapistAccounts.find((account) => account.loginId === patientForm.therapistLoginId);
    if (!therapistAccount) {
      setPatientMessage('Select a therapist before creating a patient.');
      return;
    }

    const result = await onCreatePatient({ fullName: patientForm.fullName, email: patientForm.email }, therapistAccount);
    if (!result.ok) {
      setPatientMessage(result.message);
      return;
    }

    setPatientMessage(`Patient account created under ${therapistAccount.fullName}.`);
    setPatientForm({ fullName: '', email: '', therapistLoginId: '' });
  }

  function downloadReport() {
    const now = new Date();
    const summaryRows = [
      ['Report generated at', now.toISOString()],
      ['Total accounts', sortedAccounts.length],
      ['Admin accounts', roleCounts.admin],
      ['Therapist accounts', roleCounts.therapist],
      ['Patient accounts', roleCounts.patient],
      [],
      ['ID', 'Role', 'Full name', 'Email', 'Login ID', 'Reg No', 'Created by', 'Parent therapist ID', 'Patient sequence', 'Created at'],
      ...filteredAccounts.map((account) => [
        account.id,
        account.role,
        account.fullName,
        account.email,
        account.loginId,
        account.regNo,
        account.createdBy,
        account.createdByTherapistId ?? '',
        account.patientSequence ?? '',
        account.createdAt,
      ]),
    ];

    const csv = summaryRows.map((row) => (row.length === 0 ? '' : buildCsvRow(row))).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rehabtrack-admin-report-${now.toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const dashboardCards = [
    { label: 'System users', value: sortedAccounts.length, icon: Users, tone: 'from-blue-500 to-cyan-500' },
    { label: 'Therapists', value: roleCounts.therapist, icon: UserCog, tone: 'from-indigo-500 to-violet-500' },
    { label: 'Patients', value: roleCounts.patient, icon: UserRound, tone: 'from-emerald-500 to-teal-500' },
    { label: 'Admins', value: roleCounts.admin, icon: Shield, tone: 'from-rose-500 to-red-500' },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.08),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_24%),linear-gradient(180deg,#f8fbff_0%,#f4f7fb_40%,#eef3f9_100%)] dark:bg-dark-bg">
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 p-4 md:p-6 xl:p-8">
          <div className="mb-6 overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-dark-border dark:bg-dark-surface/90">
            <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-300">
                  <Shield className="h-3.5 w-3.5" />
                  System administration
                </div>
                <h1 className="font-heading text-3xl font-bold tracking-tight text-neutral-950 dark:text-white md:text-5xl">
                  Welcome back, Admin
                </h1>
                <p className="max-w-3xl text-base leading-7 text-neutral-600 dark:text-neutral-300 md:text-lg">
                  Manage all system users by role, review the current roster, and generate a downloadable system report from one place.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Button type="button" variant={activePanel === 'overview' ? 'primary' : 'outline'} onClick={() => setActivePanel('overview')}>
                  <Activity className="mr-2 h-4 w-4" />
                  Overview
                </Button>
                <Button type="button" variant={activePanel === 'users' ? 'primary' : 'outline'} onClick={() => setActivePanel('users')}>
                  <Users className="mr-2 h-4 w-4" />
                  Users
                </Button>
                <Button type="button" variant={activePanel === 'reports' ? 'primary' : 'outline'} onClick={() => setActivePanel('reports')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Reports
                </Button>
                <Button type="button" variant="ghost" onClick={downloadReport}>
                  <Download className="mr-2 h-4 w-4" />
                  Download report
                </Button>
                <Button variant="ghost" size="sm" type="button" onClick={onBackToRoles}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to roles
                </Button>
                <ThemeToggle />
              </div>
            </div>
          </div>

          {activePanel === 'overview' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {dashboardCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <Card key={card.label} className="overflow-hidden border-neutral-200/80 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90">
                      <CardContent className="p-5">
                        <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tone} text-white shadow-lg`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">{card.label}</p>
                        <p className="mt-2 text-3xl font-bold text-neutral-950 dark:text-white">{card.value}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <Card className="overflow-hidden border-neutral-200/80 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90">
                  <CardHeader className="border-b border-neutral-100 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/60">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Control panel
                    </div>
                    <CardTitle className="text-2xl text-neutral-950 dark:text-white">Create users by role</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-6 p-5 lg:grid-cols-2">
                    <form onSubmit={handleCreateTherapist} className="space-y-4 rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-neutral-950 dark:text-white">Create therapist</h3>
                        <Badge variant="primary" size="sm">Therapist role</Badge>
                      </div>
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
                        <Plus className="mr-2 h-4 w-4" />
                        Create therapist
                      </Button>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Credentials are generated by the backend and emailed to the therapist.
                      </p>
                      {formMessage ? <p className="text-sm font-medium text-success-600 dark:text-success-400">{formMessage}</p> : null}
                    </form>

                    <form onSubmit={handleCreatePatient} className="space-y-4 rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-neutral-950 dark:text-white">Create patient</h3>
                        <Badge variant="success" size="sm">Patient role</Badge>
                      </div>
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
                      <Select
                        label="Assign to therapist"
                        value={patientForm.therapistLoginId}
                        onChange={(e) => setPatientForm((prev) => ({ ...prev, therapistLoginId: e.target.value }))}
                        required
                      >
                        <option value="">Select therapist</option>
                        {therapistAccounts.map((therapist) => (
                          <option key={therapist.id} value={therapist.loginId}>
                            {therapist.fullName} - {therapist.regNo}
                          </option>
                        ))}
                      </Select>
                      <Button type="submit" className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Create patient
                      </Button>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Patients are created under the selected therapist so the roster stays role-aware.
                      </p>
                      {patientMessage ? <p className="text-sm font-medium text-success-600 dark:text-success-400">{patientMessage}</p> : null}
                    </form>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-neutral-200/80 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90">
                  <CardHeader className="border-b border-neutral-100 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/60">
                    <CardTitle className="text-2xl text-neutral-950 dark:text-white">System notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-5">
                    <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/70">
                      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Access level</p>
                      <p className="mt-2 text-sm font-semibold text-neutral-950 dark:text-white">Admin manages all users and system reporting</p>
                    </div>
                    <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/70">
                      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Therapists</p>
                      <p className="mt-2 text-sm font-semibold text-neutral-950 dark:text-white">{roleCounts.therapist} active therapist accounts</p>
                    </div>
                    <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/70">
                      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Patients</p>
                      <p className="mt-2 text-sm font-semibold text-neutral-950 dark:text-white">{roleCounts.patient} patient accounts in the system</p>
                    </div>
                    {notice.text ? (
                      <div className={`rounded-3xl border p-4 text-sm ${notice.type === 'success' ? 'border-success-200 bg-success-50 text-success-800 dark:border-success-900/50 dark:bg-success-950/20 dark:text-success-300' : notice.type === 'warning' ? 'border-warning-200 bg-warning-50 text-warning-800 dark:border-warning-900/50 dark:bg-warning-950/20 dark:text-warning-300' : notice.type === 'error' ? 'border-danger-200 bg-danger-50 text-danger-800 dark:border-danger-900/50 dark:bg-danger-950/20 dark:text-danger-300' : 'border-neutral-200 bg-white text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300'}`}>
                        {notice.text}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activePanel === 'users' && (
            <div className="space-y-6">
              <Card className="overflow-hidden border-neutral-200/80 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90">
                <CardHeader className="border-b border-neutral-100 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/60">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
                    <Filter className="h-3.5 w-3.5" />
                    User roster
                  </div>
                  <CardTitle className="text-2xl text-neutral-950 dark:text-white">Manage accounts by role</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 p-5 lg:grid-cols-[1.4fr_0.6fr]">
                  <Input
                    type="search"
                    label="Search users"
                    placeholder="Search by name, email, role, or login ID"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                  <Select label="Filter by role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Select>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card className="border-neutral-200/80 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90">
                  <CardContent className="p-5">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Total visible</p>
                    <p className="mt-2 text-3xl font-bold text-neutral-950 dark:text-white">{filteredAccounts.length}</p>
                  </CardContent>
                </Card>
                <Card className="border-neutral-200/80 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90">
                  <CardContent className="p-5">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Admins</p>
                    <p className="mt-2 text-3xl font-bold text-neutral-950 dark:text-white">{roleCounts.admin}</p>
                  </CardContent>
                </Card>
                <Card className="border-neutral-200/80 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90">
                  <CardContent className="p-5">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Therapists</p>
                    <p className="mt-2 text-3xl font-bold text-neutral-950 dark:text-white">{roleCounts.therapist}</p>
                  </CardContent>
                </Card>
                <Card className="border-neutral-200/80 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90">
                  <CardContent className="p-5">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Patients</p>
                    <p className="mt-2 text-3xl font-bold text-neutral-950 dark:text-white">{roleCounts.patient}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="overflow-hidden border-neutral-200/80 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90">
                <CardHeader className="border-b border-neutral-100 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/60">
                  <CardTitle className="text-2xl text-neutral-950 dark:text-white">Role-aware roster</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-5">
                  {filteredAccounts.length === 0 ? (
                    <p className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-400">
                      No accounts match the current search and role filters.
                    </p>
                  ) : (
                    filteredAccounts.map((account) => (
                      <div key={account.id} className="flex flex-col gap-4 rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-950 text-sm font-bold text-white dark:bg-neutral-800">
                            {getShortName(account.fullName)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold text-neutral-950 dark:text-white">{account.fullName}</p>
                              <Badge variant={getRoleBadge(account.role)} size="sm">{account.role}</Badge>
                            </div>
                            <p className="mt-1 truncate text-sm text-neutral-600 dark:text-neutral-400">
                              {account.email} · {account.regNo}
                            </p>
                            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                              Login ID: {account.loginId} · Created by: {account.createdBy || 'system'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" size="sm">View</Button>
                          <Button type="button" variant="ghost" size="sm">Edit</Button>
                          <Button type="button" variant="ghost" size="sm">Manage role</Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activePanel === 'reports' && (
            <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
              <Card className="overflow-hidden border-neutral-200/80 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90">
                <CardHeader className="border-b border-neutral-100 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/60">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
                    <ClipboardList className="h-3.5 w-3.5" />
                    Reports
                  </div>
                  <CardTitle className="text-2xl text-neutral-950 dark:text-white">System summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/70">
                      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Total users</p>
                      <p className="mt-2 text-3xl font-bold text-neutral-950 dark:text-white">{sortedAccounts.length}</p>
                    </div>
                    <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/70">
                      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Filtered users</p>
                      <p className="mt-2 text-3xl font-bold text-neutral-950 dark:text-white">{filteredAccounts.length}</p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/70">
                    <p className="text-sm font-semibold text-neutral-950 dark:text-white">What the report includes</p>
                    <ul className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
                      <li>• Total users by role</li>
                      <li>• User roster snapshot</li>
                      <li>• Therapist and patient ownership mapping</li>
                      <li>• Downloadable CSV export for offline review</li>
                    </ul>
                  </div>

                  <Button type="button" onClick={downloadReport} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV report
                  </Button>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-neutral-200/80 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90">
                <CardHeader className="border-b border-neutral-100 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/60">
                  <CardTitle className="text-2xl text-neutral-950 dark:text-white">Quick status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-5">
                  <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/70">
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Therapist coverage</p>
                    <p className="mt-2 text-sm font-semibold text-neutral-950 dark:text-white">{therapistAccounts.length} therapists can receive patients</p>
                  </div>
                  <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/70">
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Patient coverage</p>
                    <p className="mt-2 text-sm font-semibold text-neutral-950 dark:text-white">{patientAccounts.length} patients are tracked in the system</p>
                  </div>
                  <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/70">
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Admin authority</p>
                    <p className="mt-2 text-sm font-semibold text-neutral-950 dark:text-white">Admin can review, create, and report across all roles</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
