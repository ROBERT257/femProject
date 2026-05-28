import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Stethoscope, Heart, ArrowRight, Shield } from 'lucide-react';
import { FlameIcon, Clock, UsersIcon } from '../shared/Icons';
import BrandMark from '../shared/BrandMark';
import ThemeToggle from '../ui/ThemeToggle';

export default function RoleSelectionScreen({ onRoleSelect }) {
  const roles = [
    {
      id: 'admin',
      title: 'Administrator',
      description: 'Create therapist accounts and manage secure system access',
      icon: Shield,
      gradient: 'from-slate-700 to-slate-900',
    },
    {
      id: 'therapist',
      title: "I'm a Therapist",
      description: 'Manage patient progress, assign exercises, and track outcomes',
      icon: Stethoscope,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'patient',
      title: "I'm a Patient",
      description: 'View your exercise plan, log sessions, and track your recovery journey',
      icon: Heart,
      gradient: 'from-blue-500 to-indigo-600',
    },
  ];

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
              Empowering recovery through intelligent exercise tracking
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              A seamless platform where therapists assign personalized rehabilitation exercises and patients track their recovery journey - all in one place.
            </p>
            
            <div className="flex flex-wrap gap-4">
              {[
                { icon: FlameIcon, label: 'Accurate Tracking' },
                { icon: Clock, label: 'Secure & Reliable' },
                { icon: UsersIcon, label: 'Patient-First' },
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

        {/* Right Side - Role Selection */}
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

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold font-heading text-neutral-900 dark:text-white mb-3">
                Welcome Back
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                Select your role to continue
              </p>
            </div>

            <div className="space-y-4">
              {roles.map((role, index) => (
                <motion.button
                  key={role.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onClick={() => onRoleSelect(role.id)}
                  className="w-full group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-dark-surface"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${role.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  
                  <div className="relative flex items-center gap-4">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${role.gradient} text-white shadow-lg`}>
                      <role.icon className="h-7 w-7" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-bold font-heading text-neutral-900 dark:text-white mb-1">
                        {role.title}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {role.description}
                      </p>
                    </div>

                    <ArrowRight className="h-5 w-5 text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-neutral-500 dark:text-neutral-500">
                By continuing, you agree to our{' '}
                <a href="#terms" className="text-primary-600 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#privacy" className="text-primary-600 hover:underline">Privacy Policy</a>
              </p>
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
