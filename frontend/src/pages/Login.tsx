import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, ArrowRight, Shield, User, Briefcase, Users, AlertCircle, Lock, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import { AuthResponse } from '../types';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
      login(response.data);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setIsLoading(true);
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        email: demoEmail,
        password: demoPass,
      });
      login(response.data);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fc] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white">
      {/* Brand Logo & Title */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-xl bg-blue-600 items-center justify-center text-white shadow-md shadow-blue-600/25 mb-1">
          <Box className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          TalentSync AI
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Smarter Teams. Stronger Tomorrow.
        </p>
      </div>

      {/* Main Login Card (Enterprise SaaS White Card) */}
      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm rounded-2xl border border-slate-200/90 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Sign in to your account</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your corporate credentials or use a 1-click demo persona
              </p>
            </div>
            {user && (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
              >
                Dashboard &rarr;
              </button>
            )}
          </div>

          {user && (
            <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
              <span className="truncate">
                Logged in as <strong className="text-blue-950">{user.full_name}</strong>
              </span>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-blue-700 hover:text-blue-900 font-bold ml-2 shrink-0"
              >
                Continue &rarr;
              </button>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@talentsync.ai"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign in to Platform'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Demo Accounts */}
          <div className="pt-5 border-t border-slate-100 space-y-3">
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Quick 1-Click Demo Personas
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@talentsync.ai', 'Admin@123')}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 text-left transition-all group"
              >
                <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700 truncate">Administrator</div>
                  <div className="text-[10px] text-slate-400 truncate">Sarah Jenkins</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('hr@talentsync.ai', 'HrManager@123')}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 text-left transition-all group"
              >
                <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 truncate">HR Director</div>
                  <div className="text-[10px] text-slate-400 truncate">Marcus Vance</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('pm@talentsync.ai', 'ProjectManager@123')}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 text-left transition-all group"
              >
                <div className="w-7 h-7 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 truncate">Lead PM</div>
                  <div className="text-[10px] text-slate-400 truncate">Elena Rostova</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('employee@talentsync.ai', 'Employee@123')}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 hover:bg-purple-50/60 border border-slate-200 hover:border-purple-300 text-left transition-all group"
              >
                <div className="w-7 h-7 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700 truncate">AI Engineer</div>
                  <div className="text-[10px] text-slate-400 truncate">Alex Chen</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
