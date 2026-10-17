import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Cpu,
  Sparkles,
  Users,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import apiClient from '../services/api';
import { Project, OptimizationResponse, TeamOption } from '../types';
import { ProgressBar } from '../components/common/ProgressBar';
import { useAuth } from '../context/AuthContext';

export const TeamOptimization: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [optData, setOptData] = useState<OptimizationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [teamSizeInput, setTeamSizeInput] = useState<number>(3);
  const [weeklyHoursInput, setWeeklyHoursInput] = useState<number>(30.0);
  const [selectedTeamTab, setSelectedTeamTab] = useState<'primary' | string>('primary');
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  const { hasRole } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const pParam = searchParams.get('project_id');
    if (pParam && projects.length > 0) {
      const pid = parseInt(pParam);
      setSelectedProjectId(pid);
      const proj = projects.find((p) => p.id === pid);
      if (proj) {
        setTeamSizeInput(proj.required_team_size);
        setWeeklyHoursInput(proj.estimated_weekly_hours);
      }
      runOptimization(pid, proj?.required_team_size, proj?.estimated_weekly_hours);
    } else if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
      setTeamSizeInput(projects[0].required_team_size);
      setWeeklyHoursInput(projects[0].estimated_weekly_hours);
      runOptimization(projects[0].id, projects[0].required_team_size, projects[0].estimated_weekly_hours);
    }
  }, [projects, searchParams]);

  const fetchProjects = async () => {
    try {
      const res = await apiClient.get<Project[]>('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const runOptimization = async (projectId: number, teamSize?: number, weeklyHours?: number) => {
    try {
      setIsLoading(true);
      setApplySuccess(null);
      const params: any = {};
      if (teamSize) params.team_size = teamSize;
      if (weeklyHours) params.weekly_hours = weeklyHours;

      const res = await apiClient.get<OptimizationResponse>(`/optimization/${projectId}`, { params });
      setOptData(res.data);
      setSelectedTeamTab('primary');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProject = (projectId: number) => {
    setSelectedProjectId(projectId);
    setSearchParams({ project_id: projectId.toString() });
    const proj = projects.find((p) => p.id === projectId);
    if (proj) {
      setTeamSizeInput(proj.required_team_size);
      setWeeklyHoursInput(proj.estimated_weekly_hours);
      runOptimization(projectId, proj.required_team_size, proj.estimated_weekly_hours);
    }
  };

  const handleApplyTeam = async (teamOption: TeamOption) => {
    if (!selectedProjectId) return;
    if (!window.confirm(`Commit ${teamOption.name} allocations to the production database?`)) return;

    try {
      setIsApplying(true);
      const payload = {
        team_id: teamOption.id,
        allocations: teamOption.members.map((m) => ({
          employee_id: m.employee_id,
          assigned_hours: m.assigned_hours,
          role_in_project: m.job_title,
        })),
      };

      await apiClient.post(`/optimization/${selectedProjectId}/apply`, payload);
      setApplySuccess(`Successfully committed ${teamOption.name} allocations to production database.`);
      // Refresh
      runOptimization(selectedProjectId, teamSizeInput, weeklyHoursInput);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to apply team');
    } finally {
      setIsApplying(false);
    }
  };

  const currentTeam: TeamOption | undefined = optData
    ? (selectedTeamTab === 'primary'
        ? optData.recommended_team
        : optData.alternative_teams.find((t) => t.id === selectedTeamTab))
    : undefined;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Optimization Control Bar */}
      <div className="liquid-glass-card p-6 sm:p-7 relative overflow-hidden space-y-5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/20 ring-1 ring-white/50 flex items-center justify-center text-white shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Combinatorial Team Optimizer
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Multi-objective solver balancing mandatory skill coverage, proficiency satisfaction, and fairness.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <label className="text-xs font-bold text-slate-600">Project:</label>
            <div className="relative min-w-56">
              <select
                value={selectedProjectId || ''}
                onChange={(e) => handleSelectProject(Number(e.target.value))}
                className="w-full pl-3.5 pr-8 py-2 liquid-glass text-xs font-bold text-slate-800 rounded-xl border border-white/80 shadow-2xs appearance-none cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.department})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Sliders for team constraints */}
        <div className="p-4.5 rounded-2xl bg-white/70 border border-white shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-5 items-center text-xs">
          <div>
            <div className="flex justify-between items-center mb-1.5 font-bold text-slate-700">
              <span>Required Team Size:</span>
              <span className="text-blue-600 font-extrabold">{teamSizeInput} members</span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              value={teamSizeInput}
              onChange={(e) => setTeamSizeInput(parseInt(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5 font-bold text-slate-700">
              <span>Weekly Project Hours:</span>
              <span className="text-blue-600 font-extrabold">{weeklyHoursInput} hrs/wk</span>
            </div>
            <input
              type="range"
              min="10"
              max="80"
              step="5"
              value={weeklyHoursInput}
              onChange={(e) => setWeeklyHoursInput(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => selectedProjectId && runOptimization(selectedProjectId, teamSizeInput, weeklyHoursInput)}
              className="liquid-button-primary px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
            >
              Recalculate Optimizer
            </button>
          </div>
        </div>

        {applySuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{applySuccess}</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="liquid-glass-card p-16 text-center text-xs font-bold text-slate-500">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span>Solving multi-objective team configuration with constraint solver...</span>
        </div>
      ) : !optData ? (
        <div className="liquid-glass-card p-16 text-center text-xs font-medium text-slate-500">
          No optimization data loaded.
        </div>
      ) : (
        <div className="space-y-6">
          {/* iOS-Style Segmented Team Tabs */}
          <div className="liquid-glass p-1.5 rounded-2xl border border-white/80 shadow-xs flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedTeamTab('primary')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                selectedTeamTab === 'primary'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-400/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended Optimal Plan ({optData.recommended_team.team_fit_score} pts)</span>
            </button>

            {optData.alternative_teams.map((alt) => (
              <button
                key={alt.id}
                onClick={() => setSelectedTeamTab(alt.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  selectedTeamTab === alt.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-400/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>{alt.name}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-white/40 text-current border border-current/20">
                  {alt.team_fit_score} pts
                </span>
              </button>
            ))}
          </div>

          {currentTeam && (
            <div className="liquid-glass-card p-6 sm:p-7 space-y-6">
              {/* Plan Header & Scores */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200/60">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">{currentTeam.name}</h3>
                    {currentTeam.is_feasible ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>100% Feasible Plan</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Infeasible / Constraints Breached</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed max-w-2xl">
                    {currentTeam.trade_off_explanation}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-center px-4 py-2 bg-white/80 rounded-2xl border border-white shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Team Fit</div>
                    <span className="text-xl font-black text-blue-600">{currentTeam.team_fit_score}</span>
                  </div>
                  <div className="text-center px-4 py-2 bg-white/80 rounded-2xl border border-white shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Skill Coverage</div>
                    <span className="text-xl font-black text-emerald-600">{currentTeam.skill_coverage_percent}%</span>
                  </div>
                  <div className="text-center px-4 py-2 bg-white/80 rounded-2xl border border-white shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Fairness Index</div>
                    <span className="text-xl font-black text-purple-600">{currentTeam.workload_fairness_score}/100</span>
                  </div>
                </div>
              </div>

              {/* Members Allocation Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Proposed Team Roster ({currentTeam.members.length} members)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {currentTeam.members.map((m) => (
                    <div
                      key={m.employee_id}
                      className="p-4.5 rounded-2xl border border-white bg-white/80 shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-bold text-slate-900 text-xs">{m.employee_name}</h5>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {m.employee_code} &bull; {m.department}
                          </p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200/60">
                          {m.assigned_hours}h/wk
                        </span>
                      </div>

                      {/* Workload Impact */}
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold mb-1">
                          <span className="text-slate-600">Projected Utilization</span>
                          <span className={m.new_utilization_percent > 100 ? 'text-rose-600 font-bold' : 'text-slate-900 font-bold'}>
                            {m.new_utilization_percent}%
                          </span>
                        </div>
                        <ProgressBar value={m.new_utilization_percent} isUtilization size="sm" />
                      </div>

                      {/* Covered Skills */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                          Covered Requirements:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {m.covered_skills.map((c, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white border border-slate-200/80 text-slate-700 shadow-2xs"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Uncovered Skills Warnings if any */}
              {currentTeam.uncovered_mandatory_skills.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Uncovered Critical Mandatory Skills:</span>
                  </span>
                  <p>{currentTeam.uncovered_mandatory_skills.join(', ')}</p>
                </div>
              )}

              {/* Apply Allocation Commit Button */}
              {hasRole(['admin', 'pm']) && (
                <div className="pt-5 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Manager Approval Gate: Commits changes transactionally with audit history logging.</span>
                  </div>

                  <button
                    onClick={() => handleApplyTeam(currentTeam)}
                    disabled={isApplying}
                    className="liquid-button-primary px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <span>{isApplying ? 'Applying Allocation...' : 'Approve & Apply Team Roster'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
