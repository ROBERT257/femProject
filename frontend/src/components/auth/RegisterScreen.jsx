import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import BrandMark from '../shared/BrandMark';
import { ArrowLeft, Flame, Clock, Users } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';

export default function RegisterScreen({ 
  selectedRole, 
  onRoleChange, 
  onRegister, 
  onBackToRoles,
  onLogin,
  onAdmin,
  registerForm,
  onRegisterFormChange,
  notice,
  isLoading 
}) {
  const roleLabel = selectedRole === 'therapist' ? 'Therapist' : 'Patient';

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
              Registration is managed by the hospital
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              Accounts are created by the admin team and credentials are issued from the backend.
            </p>
            
            <div className="flex flex-wrap gap-4">
              {[
                { icon: Flame, label: 'Hospital-issued reg numbers' },
                { icon: Clock, label: 'Backend issued access' },
                { icon: Users, label: 'Role-based access' },
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

        {/* Right Side - Register Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
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
                Request access as a {roleLabel}
              </h2>
            </div>

            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              This screen is kept for reference only; active accounts are created by the backend.
            </p>

            {/* Role Switcher */}
            <div className="flex gap-2 p-1 bg-neutral-200 dark:bg-neutral-800 rounded-xl mb-6">
              <button
                onClick={() => onRoleChange('patient')}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  selectedRole === 'patient'
                    ? 'bg-white dark:bg-dark-surface text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Patient
              </button>
              <button
                onClick={() => onRoleChange('therapist')}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  selectedRole === 'therapist'
                    ? 'bg-white dark:bg-dark-surface text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Therapist
              </button>
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

            {/* Register Form */}
            <form onSubmit={onRegister} className="space-y-4">
              <Input
                label="Full name"
                placeholder="Enter your full name"
                value={registerForm.fullName}
                onChange={(e) => onRegisterFormChange('fullName', e.target.value)}
                autoComplete="name"
                required
              />

              <Input
                type="email"
                label="Email address"
                placeholder="name@example.com"
                value={registerForm.email}
                onChange={(e) => onRegisterFormChange('email', e.target.value)}
                autoComplete="email"
                required
              />

              <Input
                type="password"
                label="Password"
                placeholder="Create a password"
                value={registerForm.password}
                onChange={(e) => onRegisterFormChange('password', e.target.value)}
                autoComplete="new-password"
                required
              />

              <Input
                label="Hospital reg number"
                placeholder="Issued by the hospital"
                value={registerForm.regNo}
                onChange={(e) => onRegisterFormChange('regNo', e.target.value)}
                required
              />

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Request access
              </Button>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onLogin}
                  className="flex-1"
                >
                  I already have an account
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onAdmin}
                  className="flex-1"
                >
                  Open admin setup
                </Button>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={onBackToRoles}
                className="w-full"
              >
                Back to roles
              </Button>
            </form>

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
