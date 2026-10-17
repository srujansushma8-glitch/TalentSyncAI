import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
  Award,
  Layers,
  ArrowRight,
} from 'lucide-react';
import apiClient from '../services/api';
import { TrainingResource, TrainingRecommendation } from '../types';
import { useAuth } from '../context/AuthContext';

export const Training: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'recommendations' | 'catalog'>('recommendations');
  const [resources, setResources] = useState<TrainingResource[]>([]);
  const [recommendations, setRecommendations] = useState<TrainingRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genSuccess, setGenSuccess] = useState<string | null>(null);

  const { user, hasRole } = useAuth();

  useEffect(() => {
    fetchRecommendations();
    fetchResources();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<TrainingRecommendation[]>('/training/recommendations');
      setRecommendations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await apiClient.get<TrainingResource[]>('/training/resources');
      setResources(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateRecommendations = async () => {
    try {
      setIsGenerating(true);
      setGenSuccess(null);
      const res = await apiClient.post('/training/recommendations/generate');
      setGenSuccess(res.data.message);
      fetchRecommendations();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateStatus = async (recId: number, newStatus: string) => {
    try {
      await apiClient.put(`/training/recommendations/${recId}/status`, { status: newStatus });
      setRecommendations((prev) =>
        prev.map((r) => (r.id === recId ? { ...r, status: newStatus as any } : r))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Top Header */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 shadow-glass border border-white/60 dark:border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-sm backdrop-blur-md">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Curated Learning & Upskilling Hub
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Targeted Pathways
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tailored learning sequences mapped directly to active project skill gaps and employee growth tracks.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {hasRole(['admin', 'hr', 'pm']) && (
            <button
              onClick={handleGenerateRecommendations}
              disabled={isGenerating}
              className="liquid-button-primary px-4 py-2 text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'Mapping Pathways...' : 'Auto-Map Skill Pathways'}</span>
            </button>
          )}

          {/* Liquid Segmented Control */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-white/5 shadow-inner">
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === 'recommendations'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Recommendations ({recommendations.length})
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === 'catalog'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Course Catalog ({resources.length})
            </button>
          </div>
        </div>
      </div>

      {genSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{genSuccess}</span>
        </div>
      )}

      {activeTab === 'recommendations' ? (
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-16 text-center text-xs text-slate-500 dark:text-slate-400 liquid-glass rounded-3xl">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading learning pathways & verified curriculum...
            </div>
          ) : recommendations.length === 0 ? (
            <div className="p-16 text-center liquid-glass rounded-3xl border border-white/60 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400 space-y-3">
              <p>No training pathways assigned yet.</p>
              {hasRole(['admin', 'hr', 'pm']) && (
                <button
                  onClick={handleGenerateRecommendations}
                  className="liquid-button-primary px-5 py-2.5 text-xs font-bold"
                >
                  Generate Recommendations from Project Gaps
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="liquid-glass-card rounded-3xl p-6 shadow-glass border border-white/60 dark:border-white/10 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-200/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 text-[10px] font-extrabold flex items-center justify-center">
                          #{rec.sequence_order}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{rec.employee_name}</span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          rec.priority === 'HIGH'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                        }`}
                      >
                        {rec.priority} Priority
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                      {rec.resource_title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{rec.reason}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-blue-500" />
                        <span>
                          Skill: <strong className="text-slate-800 dark:text-slate-200">{rec.target_skill_name}</strong>
                        </span>
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{rec.estimated_hours} hrs</span>
                      </span>
                      <span>&bull;</span>
                      <span>
                        Level: <strong className="text-slate-800 dark:text-slate-200">{rec.level}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Footer Action & Status Tracking */}
                  <div className="pt-3.5 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Status:</label>
                      <select
                        value={rec.status}
                        onChange={(e) => handleUpdateStatus(rec.id, e.target.value)}
                        className="px-2.5 py-1 bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/80 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm"
                      >
                        <option value="recommended">Recommended</option>
                        <option value="enrolled">Enrolled (In Progress)</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <a
                      href={rec.resource_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      <span>Open Verified Course</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Course Catalog Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((res) => (
            <div
              key={res.id}
              className="liquid-glass-card rounded-3xl p-5 shadow-glass border border-white/60 dark:border-white/10 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-200/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-white/40 dark:border-white/5">
                    {res.skill_category}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {res.estimated_hours} hrs
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{res.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                  {res.description}
                </p>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Provider: <strong className="text-slate-800 dark:text-slate-200">{res.provider}</strong> &bull; Level:{' '}
                  <strong>{res.level}</strong>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{res.skill_name}</span>
                <a
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  <span>View Provider</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
