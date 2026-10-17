import React, { useState, useEffect } from 'react';
import {
  Scale,
  Flame,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import apiClient from '../services/api';
import { WorkloadSummaryResponse, RebalanceSuggestion } from '../types';
import { ProgressBar } from '../components/common/ProgressBar';
import { useAuth } from '../context/AuthContext';

export const Workload: React.FC = () => {
  const [data, setData] = useState<WorkloadSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [applyingTransfer, setApplyingTransfer] = useState<RebalanceSuggestion | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { hasRole } = useAuth();

  useEffect(() => {
    fetchWorkloadData();
  }, []);

  const fetchWorkloadData = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<WorkloadSummaryResponse>('/workload');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyRebalance = async (sugg: RebalanceSuggestion) => {
    if (
      !confirm(
        `Apply workload rebalancing transfer: Transfer ${sugg.suggested_hours_to_transfer}h from ${sugg.overloaded_employee_name} to ${sugg.candidate_recipient_name}?`
      )
    )
      return;

    try {
      setApplyingTransfer(sugg);
      setActionSuccess(null);
      const res = await apiClient.post('/workload/rebalance/apply', sugg);
      setActionSuccess(res.data.message);
      fetchWorkloadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Rebalance transfer failed');
    } finally {
      setApplyingTransfer(null);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex h-96 items-center justify-center text-xs font-bold text-slate-500">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Overview Card */}
      <div className="liquid-glass-card p-6 sm:p-7 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 shadow-lg shadow-purple-500/20 ring-1 ring-white/50 flex items-center justify-center text-white shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Workload & Capacity Balancer
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Real-time capacity tracking across {data.total_employees} staff. Identifies burnout risk and recommends non-disruptive task redistribution.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-center px-4 py-2 bg-white/80 rounded-2xl border border-white shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-400">Workforce Avg Utilization</div>
            <span className="text-xl font-black text-slate-900">{data.average_utilization_percent}%</span>
          </div>
          <button
            onClick={fetchWorkloadData}
            className="p-2.5 rounded-2xl liquid-glass border border-white/80 text-slate-600 hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
            title="Refresh Analysis"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Summary Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="liquid-glass-card liquid-glass-interactive p-5 sm:p-6 flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-red-500/20 text-rose-600 border border-rose-200/80 shadow-rose-500/10 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overloaded Staff</span>
            <div className="text-3xl font-black text-rose-600 font-mono sm:font-sans">{data.overloaded_count}</div>
            <p className="text-[11px] text-slate-400 font-medium">&gt; 100% committed capacity</p>
          </div>
        </div>

        <div className="liquid-glass-card liquid-glass-interactive p-5 sm:p-6 flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-600 border border-emerald-200/80 shadow-emerald-500/10 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Balanced Staff</span>
            <div className="text-3xl font-black text-emerald-600 font-mono sm:font-sans">{data.optimal_count}</div>
            <p className="text-[11px] text-slate-400 font-medium">70% to 100% capacity</p>
          </div>
        </div>

        <div className="liquid-glass-card liquid-glass-interactive p-5 sm:p-6 flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-600 border border-amber-200/80 shadow-amber-500/10 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Underutilized Staff</span>
            <div className="text-3xl font-black text-amber-600 font-mono sm:font-sans">{data.underutilized_count}</div>
            <p className="text-[11px] text-slate-400 font-medium">&lt; 70% capacity (Available for projects)</p>
          </div>
        </div>
      </div>

      {/* Suggested Workload Rebalancing Proposals */}
      <div className="liquid-glass-card p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
              Actionable Workload Redistribution Opportunities
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Algorithmically identified workload transfers to eliminate burnout while preserving critical project skill coverage.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-2xs">
            {data.rebalance_suggestions.length} Proposals Available
          </span>
        </div>

        {data.rebalance_suggestions.length === 0 ? (
          <div className="p-10 text-center text-xs font-semibold text-slate-500 bg-white/40 rounded-2xl border border-dashed border-slate-300">
            No critical overload imbalances detected. Workforce is operating at safe capacity thresholds.
          </div>
        ) : (
          <div className="space-y-3">
            {data.rebalance_suggestions.map((sugg, idx) => (
              <div
                key={idx}
                className="p-4.5 rounded-2xl border border-white bg-white/70 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      Overload Source: {sugg.overloaded_employee_name}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Target Recipient: {sugg.candidate_recipient_name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">({sugg.target_project_name})</span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{sugg.justification}</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-semibold">
                    <span>
                      Transfer: <strong className="text-blue-600">{sugg.suggested_hours_to_transfer} hrs/wk</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Recipient Utilization: {sugg.candidate_current_utilization}% &rarr;{' '}
                      <strong className="text-emerald-600">{sugg.candidate_projected_utilization}%</strong>
                    </span>
                  </div>
                </div>

                {hasRole(['admin', 'hr', 'pm']) && (
                  <button
                    onClick={() => handleApplyRebalance(sugg)}
                    disabled={applyingTransfer !== null}
                    className="liquid-button-primary px-4 py-2 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 self-start md:self-auto shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Approve Rebalance</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete Workforce Utilization Table */}
      <div className="liquid-glass-card overflow-hidden">
        <div className="p-4 bg-white/60 border-b border-slate-200/60 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">All Workforce Allocations</h3>
          <span className="text-xs font-semibold text-slate-500">{data.all_employees.length} employees sorted by utilization</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200/60 text-[10px]">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department & Title</th>
                <th className="py-3 px-4">Committed / Capacity</th>
                <th className="py-3 px-4 w-48">Utilization Meter</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {data.all_employees.map((emp) => (
                <tr key={emp.employee_id} className="hover:bg-white/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{emp.employee_name}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {emp.job_title} &bull; <span className="font-semibold text-slate-500">{emp.department}</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">
                    {emp.committed_hours}h / {emp.weekly_working_hours}h ({emp.remaining_capacity}h free)
                  </td>
                  <td className="py-3.5 px-4">
                    <ProgressBar value={emp.utilization_percent} isUtilization size="sm" showLabel />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border shadow-2xs ${
                        emp.status === 'OVERLOADED'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : emp.status === 'OPTIMAL'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
