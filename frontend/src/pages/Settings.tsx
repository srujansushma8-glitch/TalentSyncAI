import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  RotateCcw,
  Shield,
  Key,
  Users,
  CheckCircle2,
  AlertTriangle,
  Server,
  Lock,
} from 'lucide-react';
import apiClient from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Settings: React.FC = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const { user, hasRole } = useAuth();

  const handleResetDemoData = async () => {
    if (
      !confirm(
        'Are you sure you want to re-initialize demo data? This will restore the pristine state of 22 synthetic employees and 5 master projects.'
      )
    )
      return;

    try {
      setIsResetting(true);
      setResetSuccess(null);
      const res = await apiClient.post('/system/reset-demo-data');
      setResetSuccess(res.data.message);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Reset failed');
    } finally {
      setIsResetting(false);
    }
  };

  const demoAccounts = [
    { role: 'Administrator', email: 'admin@talentsync.ai', pass: 'Admin@123', scope: 'Full system CRUD & platform controls' },
    { role: 'HR Director', email: 'hr@talentsync.ai', pass: 'HrManager@123', scope: 'Workforce skills, employee profiles, training' },
    { role: 'Project Manager', email: 'pm@talentsync.ai', pass: 'ProjectManager@123', scope: 'Projects, matching, team allocations' },
    { role: 'Employee', email: 'employee@talentsync.ai', pass: 'Employee@123', scope: 'Personal capacity, skill editor, courses' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 shadow-glass border border-white/60 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-500/20 via-blue-500/20 to-indigo-500/20 border border-slate-500/30 flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-sm backdrop-blur-md">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Platform Preferences & Settings
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                System Controls
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Platform configuration, role directory, and development demo data management.
            </p>
          </div>
        </div>
      </div>

      {resetSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{resetSuccess}</span>
        </div>
      )}

      {/* Demo Account Credentials Guide */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 shadow-glass border border-white/60 dark:border-white/10 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/50 dark:border-slate-800/50">
          <Key className="w-4 h-4 text-blue-500" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Seeded Hackathon Demo Personas</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Four distinct role personas are provisioned in the database for comprehensive evaluation across authorization tiers.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {demoAccounts.map((acc, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 space-y-2 text-xs shadow-2xs backdrop-blur-sm"
            >
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                <span>{acc.role}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {acc.pass}
                </span>
              </div>
              <div className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">{acc.email}</div>
              <div className="text-slate-400 dark:text-slate-500 text-[10px]">{acc.scope}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Database Management & Demo Reset */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 shadow-glass border border-white/60 dark:border-white/10 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/50 dark:border-slate-800/50">
          <Server className="w-4 h-4 text-purple-500" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Synthetic Database Management</h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Re-initialize or reset the database back to its default state. This restores 22 synthetic employees across 4 departments, 5 projects, and curated learning resources.
        </p>

        {hasRole(['admin', 'hr']) ? (
          <div className="pt-2">
            <button
              onClick={handleResetDemoData}
              disabled={isResetting}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
            >
              <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
              <span>{isResetting ? 'Resetting Database...' : 'Reset Demo Data to Initial State'}</span>
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Demo reset requires Administrator or HR Director role privileges.
          </p>
        )}
      </div>
    </div>
  );
};
