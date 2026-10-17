import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Users,
  Clock,
  Layers,
  TrendingUp,
  FlaskConical,
  Activity,
} from 'lucide-react';
import apiClient from '../services/api';
import { Project, Employee, SimulationComparison } from '../types';
import { ProgressBar } from '../components/common/ProgressBar';
import { useAuth } from '../context/AuthContext';

export const Simulation: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [simTeamSize, setSimTeamSize] = useState<number>(3);
  const [simWeeklyHours, setSimWeeklyHours] = useState<number>(30.0);
  const [excludedEmpIds, setExcludedEmpIds] = useState<number[]>([]);
  const [comparison, setComparison] = useState<SimulationComparison | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);

  const { hasRole } = useAuth();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [projRes, empRes] = await Promise.all([
        apiClient.get<Project[]>('/projects'),
        apiClient.get<Employee[]>('/employees'),
      ]);
      setProjects(projRes.data);
      setEmployees(empRes.data);
      if (projRes.data.length > 0) {
        const first = projRes.data[0];
        setSelectedProjectId(first.id);
        setSimTeamSize(first.required_team_size);
        setSimWeeklyHours(first.estimated_weekly_hours);
        runSimulation(first.id, first.required_team_size, first.estimated_weekly_hours, []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const runSimulation = async (
    projectId: number,
    teamSize: number,
    hours: number,
    excluded: number[]
  ) => {
    try {
      setIsSimulating(true);
      setApplyMessage(null);
      const payload = {
        project_id: projectId,
        adjusted_team_size: teamSize,
        adjusted_weekly_hours: hours,
        candidate_overrides: excluded.map((id) => ({
          employee_id: id,
          is_excluded: true,
        })),
      };

      const res = await apiClient.post<SimulationComparison>('/simulation/run', payload);
      setComparison(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSelectProject = (projectId: number) => {
    setSelectedProjectId(projectId);
    const p = projects.find((proj) => proj.id === projectId);
    if (p) {
      setSimTeamSize(p.required_team_size);
      setSimWeeklyHours(p.estimated_weekly_hours);
      setExcludedEmpIds([]);
      runSimulation(projectId, p.required_team_size, p.estimated_weekly_hours, []);
    }
  };

  const toggleExcludeEmployee = (empId: number) => {
    const updated = excludedEmpIds.includes(empId)
      ? excludedEmpIds.filter((id) => id !== empId)
      : [...excludedEmpIds, empId];

    setExcludedEmpIds(updated);
    if (selectedProjectId) {
      runSimulation(selectedProjectId, simTeamSize, simWeeklyHours, updated);
    }
  };

  const handleReset = () => {
    if (!selectedProjectId) return;
    const p = projects.find((proj) => proj.id === selectedProjectId);
    if (p) {
      setSimTeamSize(p.required_team_size);
      setSimWeeklyHours(p.estimated_weekly_hours);
      setExcludedEmpIds([]);
      runSimulation(selectedProjectId, p.required_team_size, p.estimated_weekly_hours, []);
    }
  };

  const handleApplySimulation = async () => {
    if (!comparison || !selectedProjectId) return;
    if (
      !confirm(
        'Are you sure you want to commit these simulated allocations to the LIVE database? This will update live assignments and record an audit log.'
      )
    )
      return;

    try {
      setIsApplying(true);
      const payload = {
        project_id: selectedProjectId,
        allocations: comparison.simulated_members,
      };

      const res = await apiClient.post('/simulation/apply', payload);
      setApplyMessage(res.data.message);
      fetchInitialData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to apply simulation');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Simulator Control Header */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 shadow-glass border border-white/60 dark:border-white/10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-500 shadow-sm backdrop-blur-md">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  What-If Scenario Sandbox
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  Zero Live Mutation
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Stress-test headcount, hour adjustments, or sudden staff leaves in an isolated memory buffer before committing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <select
              value={selectedProjectId || ''}
              onChange={(e) => handleSelectProject(Number(e.target.value))}
              className="px-3.5 py-2 bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleReset}
              className="p-2 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
              title="Reset to Baseline"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sliders and Toggles Sandbox in Frosted Glass */}
        <div className="p-5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs backdrop-blur-md">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Simulated Team Size</label>
              <span className="font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
                {simTeamSize} members
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              value={simTeamSize}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setSimTeamSize(val);
                if (selectedProjectId) runSimulation(selectedProjectId, val, simWeeklyHours, excludedEmpIds);
              }}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>1 member</span>
              <span>6 members</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Simulated Project Hours</label>
              <span className="font-extrabold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                {simWeeklyHours} hrs/wk
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="80"
              step="5"
              value={simWeeklyHours}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setSimWeeklyHours(val);
                if (selectedProjectId) runSimulation(selectedProjectId, simTeamSize, val, excludedEmpIds);
              }}
              className="w-full accent-cyan-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>10 hrs</span>
              <span>80 hrs</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Simulate Employee Leave</label>
              <span className="text-[10px] text-slate-400">
                {excludedEmpIds.length} unavailable
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-inner">
              {employees.slice(0, 10).map((emp) => {
                const isExcluded = excludedEmpIds.includes(emp.id);
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => toggleExcludeEmployee(emp.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                      isExcluded
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 line-through border border-rose-500/30'
                        : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {emp.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {applyMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{applyMessage}</span>
          </div>
        )}
      </div>

      {/* Side-by-Side Comparison Diff */}
      {isSimulating ? (
        <div className="p-16 text-center text-xs text-slate-500 dark:text-slate-400 liquid-glass rounded-3xl">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Recalculating What-If simulation models & capacity shifts...
        </div>
      ) : !comparison ? (
        <div className="p-16 text-center text-xs text-slate-500 dark:text-slate-400 liquid-glass rounded-3xl">
          Run simulation to view side-by-side comparison.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Comparison Delta Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="liquid-glass-card rounded-2xl p-4 border border-white/60 dark:border-white/10 shadow-glass text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                Team Size Delta
              </span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {comparison.original_team_size} &rarr;{' '}
                <span className="text-blue-600 dark:text-blue-400">{comparison.simulated_team_size}</span>
              </div>
            </div>

            <div className="liquid-glass-card rounded-2xl p-4 border border-white/60 dark:border-white/10 shadow-glass text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                Weekly Hours Delta
              </span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {comparison.original_weekly_hours}h &rarr;{' '}
                <span className="text-cyan-600 dark:text-cyan-400">{comparison.simulated_weekly_hours}h</span>
              </div>
            </div>

            <div className="liquid-glass-card rounded-2xl p-4 border border-white/60 dark:border-white/10 shadow-glass text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                Skill Coverage Delta
              </span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {comparison.original_skill_coverage}% &rarr;{' '}
                <span
                  className={
                    comparison.simulated_skill_coverage >= comparison.original_skill_coverage
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }
                >
                  {comparison.simulated_skill_coverage}%
                </span>
              </div>
            </div>

            <div className="liquid-glass-card rounded-2xl p-4 border border-white/60 dark:border-white/10 shadow-glass text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                Team Fit Delta
              </span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {comparison.original_team_fit_score} &rarr;{' '}
                <span
                  className={
                    comparison.simulated_team_fit_score >= comparison.original_team_fit_score
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }
                >
                  {comparison.simulated_team_fit_score} pts
                </span>
              </div>
            </div>
          </div>

          {/* Member Changes Diff Table */}
          <div className="liquid-glass-card rounded-3xl p-6 shadow-glass border border-white/60 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-slate-800/50">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Roster Reallocation Delta</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tracking members retained, substituted, or newly assigned under this scenario.
                </p>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 italic bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                In-Memory Preview Only
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200/60 dark:border-slate-800/60">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Status Change</th>
                    <th className="py-3 px-4">Simulated Weekly Hours</th>
                    <th className="py-3 px-4">Projected Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {comparison.member_diffs.map((diff) => (
                    <tr
                      key={diff.employee_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {diff.employee_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            diff.status === 'added'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : diff.status === 'removed'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                              : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
                          }`}
                        >
                          {diff.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {diff.allocated_hours} hrs/wk
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-600 dark:text-slate-400">
                          {diff.utilization_before}% &rarr;{' '}
                          <strong
                            className={
                              diff.utilization_after > 100
                                ? 'text-rose-600 dark:text-rose-400 font-extrabold'
                                : 'text-slate-900 dark:text-white'
                            }
                          >
                            {diff.utilization_after}%
                          </strong>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Trade-off summary */}
            <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <span className="font-bold text-slate-900 dark:text-white block flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-500" />
                Scenario Trade-Off Evaluation:
              </span>
              <p className="leading-relaxed">{comparison.trade_off_summary}</p>
            </div>

            {/* Warnings if simulation creates overloads */}
            {comparison.new_capacity_warnings.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Caution: {comparison.new_capacity_warnings.join('; ')}</span>
              </div>
            )}

            {/* Manager Commit Gate */}
            {hasRole(['admin', 'pm']) && (
              <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ready to promote this scenario to production? Commits live project assignments with full audit logging.
                </p>

                <button
                  onClick={handleApplySimulation}
                  disabled={isApplying}
                  className="liquid-button-primary px-6 py-2.5 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isApplying ? 'Applying to Live Data...' : 'Approve & Commit to Production'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
