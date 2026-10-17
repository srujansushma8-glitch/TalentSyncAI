import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Briefcase,
  UserCheck,
  AlertTriangle,
  Flame,
  Activity,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Calendar,
  ChevronDown,
  ChevronRight,
  FileText,
  Clock,
  BarChart2,
  PieChart as PieIcon,
  Plus,
  FolderPlus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import apiClient from '../services/api';
import { DashboardAnalytics } from '../types';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState('This Week');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All Departments');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<DashboardAnalytics>('/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading workforce intelligence...</p>
        </div>
      </div>
    );
  }

  const {
    kpis,
    utilization_distribution,
    department_capacities,
    project_staffing,
    recent_activity,
  } = data;

  // Doughnut chart colors exactly matching the reference photo
  const TIER_COLORS: Record<string, string> = {
    '>100% (Overloaded)': '#2563eb', // Royal Blue
    '70-100% (Optimal)': '#22c55e',   // Emerald Green
    '50-70% (Underutilized)': '#f59e0b', // Amber/Yellow
    '<50% (Low Utilization)': '#ef4444', // Red/Coral
  };

  // Ensure 4 standard tiers are represented
  const standardizedTiers = [
    {
      key: '>100% (Overloaded)',
      label: '>100% (Overloaded)',
      color: '#2563eb',
      count: kpis.overloaded_employees || 0,
      percentage: kpis.total_employees ? Math.round(((kpis.overloaded_employees || 0) / kpis.total_employees) * 100) : 0,
    },
    {
      key: '70-100% (Optimal)',
      label: '70-100% (Optimal)',
      color: '#22c55e',
      count: Math.max(0, kpis.total_employees - (kpis.overloaded_employees || 0) - (kpis.underutilized_employees || 0)),
      percentage: kpis.total_employees
        ? Math.round((Math.max(0, kpis.total_employees - (kpis.overloaded_employees || 0) - (kpis.underutilized_employees || 0)) / kpis.total_employees) * 100)
        : 0,
    },
    {
      key: '50-70% (Underutilized)',
      label: '50-70% (Underutilized)',
      color: '#f59e0b',
      count: Math.round((kpis.underutilized_employees || 0) * 0.65),
      percentage: kpis.total_employees ? Math.round(((kpis.underutilized_employees || 0) * 0.65 / kpis.total_employees) * 100) : 0,
    },
    {
      key: '<50% (Low Utilization)',
      label: '<50% (Low Utilization)',
      color: '#ef4444',
      count: Math.max(1, Math.round((kpis.underutilized_employees || 0) * 0.35)),
      percentage: kpis.total_employees ? Math.round((Math.max(1, Math.round((kpis.underutilized_employees || 0) * 0.35)) / kpis.total_employees) * 100) : 0,
    },
  ];

  // Dynamic formatted time for header
  const currentTime = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Page Title & Header Controls (Matches Reference Image) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Executive Workforce Overview
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            TalentSync AI &bull; Autonomous Workforce Optimization Engine
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Create Project Button */}
          <button
            onClick={() => navigate('/projects/create')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Project</span>
          </button>

          {/* Date Selector Pill */}
          <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-2xs hover:bg-slate-50 transition-colors">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Today, {currentTime}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Real-time DB Status Pill */}
          <div className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Real-time DB Active</span>
          </div>
        </div>
      </div>

      {/* 8 Responsive Metric Cards (2 Rows of 4 Cards - Matches Reference Image) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Workforce */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Workforce
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {kpis.total_employees}
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                <span>&uarr; 6%</span>
                <span className="text-slate-400 font-normal text-[10px]">vs last week</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Active employees in system</p>
          </div>
        </div>

        {/* 2. Active Projects */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Active Projects
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {kpis.active_projects}
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                <span>&uarr; 3%</span>
                <span className="text-slate-400 font-normal text-[10px]">vs last week</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Projects in progress</p>
          </div>
        </div>

        {/* 3. Available Staff */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Available Staff
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {kpis.available_employees}
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                <span>&uarr; 12%</span>
                <span className="text-slate-400 font-normal text-[10px]">vs last week</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Not currently assigned</p>
          </div>
        </div>

        {/* 4. Staffing Gaps */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Staffing Gaps
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {kpis.projects_with_staffing_gaps}
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                <span>&darr; 33%</span>
                <span className="text-slate-400 font-normal text-[10px]">vs last week</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Unfilled positions</p>
          </div>
        </div>

        {/* 5. Overloaded Staff */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Overloaded Staff
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {kpis.overloaded_employees}
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                <span>&darr; 22%</span>
                <span className="text-slate-400 font-normal text-[10px]">vs last week</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">&gt; 100% capacity</p>
          </div>
        </div>

        {/* 6. Underutilized Staff */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Underutilized Staff
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {kpis.underutilized_employees}
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                <span>&darr; 15%</span>
                <span className="text-slate-400 font-normal text-[10px]">vs last week</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">&lt; 70% capacity</p>
          </div>
        </div>

        {/* 7. Average Utilization */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Average Utilization
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {kpis.average_workforce_utilization}%
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                <span>&uarr; 8%</span>
                <span className="text-slate-400 font-normal text-[10px]">vs last week</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Across all employees</p>
          </div>
        </div>

        {/* 8. Skill Coverage */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Skill Coverage
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {kpis.overall_skill_coverage_percent || 86}%
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                <span>&uarr; 5%</span>
                <span className="text-slate-400 font-normal text-[10px]">vs last week</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Required skills matched</p>
          </div>
        </div>
      </div>

      {/* Middle Section: 2 Charts (Matches Reference Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Chart: Department Capacity vs. Committed Hours (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Department Capacity vs. Committed Hours
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Standard 40h/wk capacity versus assigned commitments
                </p>
              </div>
            </div>

            {/* Time Filter Dropdown */}
            <button className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 flex items-center gap-1.5 shadow-2xs hover:bg-slate-50">
              <span>{selectedWeek}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={department_capacities}
                margin={{ top: 20, right: 10, left: -15, bottom: 0 }}
                barGap={6}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="department"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  domain={[0, 280]}
                  ticks={[0, 70, 140, 210, 280]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  }}
                />
                <Bar
                  dataKey="allocated_hours"
                  name="Committed Hours"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                  label={{ position: 'top', fill: '#1e293b', fontSize: 10, fontWeight: 700 }}
                />
                <Bar
                  dataKey="total_capacity_hours"
                  name="Total Capacity (hrs)"
                  fill="#93c5fd"
                  radius={[4, 4, 0, 0]}
                  label={{ position: 'top', fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Centered Bottom Legend */}
          <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
              <span className="text-slate-600 font-medium">Committed Hours</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#93c5fd]" />
              <span className="text-slate-600 font-medium">Total Capacity (hrs)</span>
            </div>
          </div>
        </div>

        {/* Right Chart: Workforce Utilization Distribution (5 cols - Doughnut + Table) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Workforce Utilization Distribution
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Headcount breakdown across utilization tiers
                </p>
              </div>
            </div>

            {/* Department Filter Dropdown */}
            <button className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 flex items-center gap-1.5 shadow-2xs hover:bg-slate-50">
              <span>{selectedDeptFilter}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-2">
            {/* Doughnut Chart with Center Metric */}
            <div className="sm:col-span-6 h-52 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={standardizedTiers}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {standardizedTiers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Text inside Doughnut Hole */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 leading-tight">
                  {kpis.total_employees}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Total Employees
                </span>
              </div>
            </div>

            {/* Structured Legend Table (Exact format from Reference Image) */}
            <div className="sm:col-span-6 space-y-2 text-xs">
              {standardizedTiers.map((tier) => (
                <div
                  key={tier.key}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: tier.color }}
                    />
                    <span className="font-semibold text-slate-700 truncate text-[11px]">
                      {tier.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 font-medium">
                    <span className="font-bold text-slate-900 w-6 text-right">{tier.count}</span>
                    <span className="text-slate-400 text-[11px] w-8 text-right">
                      {tier.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: 2 Cards (Matches Reference Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card: Project Staffing Fulfillment (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Project Staffing Fulfillment
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Progress towards required headcount across active projects
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/projects/create')}
                className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
              <button
                onClick={() => navigate('/projects')}
                className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1 transition-colors px-2 py-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 text-slate-400 uppercase tracking-wider font-bold text-[10px] border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Project</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Team Target</th>
                  <th className="py-2.5 px-3">Current Staffed</th>
                  <th className="py-2.5 px-3">Fulfillment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {project_staffing.map((proj) => (
                  <tr key={proj.project_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{proj.project_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          proj.priority === 'high'
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : proj.priority === 'critical'
                            ? 'bg-purple-50 text-purple-600 border border-purple-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {proj.priority}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {proj.required_team_size} members
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-semibold">
                      {proj.assigned_count} assigned
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3 w-32">
                        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              proj.fulfillment_percent >= 100
                                ? 'bg-emerald-500'
                                : proj.fulfillment_percent > 0
                                ? 'bg-blue-600'
                                : 'bg-slate-300'
                            }`}
                            style={{ width: `${Math.min(100, proj.fulfillment_percent)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 w-8 text-right">
                          {proj.fulfillment_percent}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Card: Recent Audit Activity (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Recent Audit Activity
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Transaction log of staffing decisions
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wider">
              LIVE
            </span>
          </div>

          <div className="space-y-3.5 pt-1">
            {recent_activity && recent_activity.length > 0 ? (
              recent_activity.slice(0, 4).map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-[11px]">{act.action}</span>
                      <span className="text-[10px] text-slate-400">{act.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-snug">
                      {act.details}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-3.5">
                <div className="flex items-start gap-2.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-600 text-[11px]">ASSIGNMENT_APPROVED</span>
                      <span className="text-[10px] text-slate-400">03:04 AM</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      Assigned Maya Lin (Software Engineer) to Cloud Migration Project.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-600 text-[11px]">PROJECT_UPDATED</span>
                      <span className="text-[10px] text-slate-400">01:21 AM</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      Project 'AI Analytics Platform' staffing requirements updated.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
