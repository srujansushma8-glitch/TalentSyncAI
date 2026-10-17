import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  GitMerge,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  ChevronDown,
  ChevronUp,
  UserCheck,
  XCircle,
  Sliders,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  BookOpen,
  Award,
  ShieldAlert,
  Zap,
  Info,
  X,
  ExternalLink,
} from 'lucide-react';
import apiClient from '../services/api';
import { Project, ProjectMatchingResult, CandidateMatchScore } from '../types';
import { AvailabilityBadge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';

export const Matching: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [matchingResult, setMatchingResult] = useState<ProjectMatchingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedCandidateId, setExpandedCandidateId] = useState<number | null>(null);
  const [assigningCandidate, setAssigningCandidate] = useState<CandidateMatchScore | null>(null);
  const [assignedHoursInput, setAssignedHoursInput] = useState<number>(15.0);
  const [roleInput, setRoleInput] = useState<string>('Team Member');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters and Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterQualifiedOnly, setFilterQualifiedOnly] = useState(false);
  const [filterAvailableOnly, setFilterAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'score' | 'experience' | 'capacity' | 'name'>('score');

  const { hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const projIdParam = searchParams.get('project_id');
    if (projIdParam && projects.length > 0) {
      const pid = parseInt(projIdParam);
      setSelectedProjectId(pid);
      fetchMatches(pid);
    } else if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
      fetchMatches(projects[0].id);
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

  const fetchMatches = async (projectId: number) => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<ProjectMatchingResult>(`/matching/${projectId}`);
      setMatchingResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    if (!selectedProjectId) return;
    setIsRefreshing(true);
    await fetchMatches(selectedProjectId);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleSelectProject = (projectId: number) => {
    setSelectedProjectId(projectId);
    setSearchParams({ project_id: projectId.toString() });
    fetchMatches(projectId);
    setSuccessMessage(null);
  };

  const handleAssignCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !assigningCandidate) return;

    try {
      await apiClient.post(`/projects/${selectedProjectId}/assign`, {
        employee_id: assigningCandidate.employee_id,
        assigned_weekly_hours: assignedHoursInput,
        role_in_project: roleInput,
      });

      setSuccessMessage(
        `Successfully allocated ${assigningCandidate.employee_name} (${assignedHoursInput}h/wk) to ${matchingResult?.project_name}.`
      );
      setAssigningCandidate(null);
      fetchMatches(selectedProjectId);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Assignment failed');
    }
  };

  // Distinct departments for filter
  const departments = useMemo(() => {
    if (!matchingResult) return [];
    const depts = new Set<string>();
    matchingResult.candidates.forEach((c) => {
      if (c.department) depts.add(c.department);
    });
    return Array.from(depts);
  }, [matchingResult]);

  // Filtered & Sorted Candidates
  const filteredCandidates = useMemo(() => {
    if (!matchingResult) return [];
    let list = [...matchingResult.candidates];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.employee_name.toLowerCase().includes(q) ||
          c.employee_code.toLowerCase().includes(q) ||
          c.job_title.toLowerCase().includes(q) ||
          c.department.toLowerCase().includes(q) ||
          c.matched_skills.some((s) => s.skill_name.toLowerCase().includes(q))
      );
    }

    if (filterDepartment !== 'ALL') {
      list = list.filter((c) => c.department === filterDepartment);
    }

    if (filterQualifiedOnly) {
      list = list.filter((c) => !c.has_hard_constraint_violation);
    }

    if (filterAvailableOnly) {
      list = list.filter((c) => c.availability_status === 'available' || c.remaining_capacity > 0);
    }

    list.sort((a, b) => {
      if (sortBy === 'score') {
        // Qualified first, then match_score desc
        if (!a.has_hard_constraint_violation && b.has_hard_constraint_violation) return -1;
        if (a.has_hard_constraint_violation && !b.has_hard_constraint_violation) return 1;
        return b.match_score - a.match_score;
      }
      if (sortBy === 'experience') return b.years_of_experience - a.years_of_experience;
      if (sortBy === 'capacity') return b.remaining_capacity - a.remaining_capacity;
      if (sortBy === 'name') return a.employee_name.localeCompare(b.employee_name);
      return 0;
    });

    return list;
  }, [matchingResult, searchQuery, filterDepartment, filterQualifiedOnly, filterAvailableOnly, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    filterDepartment !== 'ALL' ||
    filterQualifiedOnly ||
    filterAvailableOnly ||
    sortBy !== 'score';

  const resetFilters = () => {
    setSearchQuery('');
    setFilterDepartment('ALL');
    setFilterQualifiedOnly(false);
    setFilterAvailableOnly(false);
    setSortBy('score');
  };

  // Real-time KPI calculations
  const kpis = useMemo(() => {
    if (!matchingResult || matchingResult.candidates.length === 0) {
      return { total: 0, qualified: 0, available: 0, avgScore: 0 };
    }
    const total = matchingResult.total_candidates_evaluated;
    const qualified = matchingResult.eligible_candidates_count;
    const available = matchingResult.candidates.filter(
      (c) => c.availability_status === 'available' || c.remaining_capacity > 0
    ).length;
    const sumScores = matchingResult.candidates.reduce((acc, c) => acc + c.match_score, 0);
    const avgScore = total > 0 ? (sumScores / total).toFixed(1) : 0;

    return { total, qualified, available, avgScore };
  }, [matchingResult]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Liquid Glass Header Hero */}
      <div className="liquid-glass-card p-6 sm:p-7 relative overflow-hidden">
        {/* Specular Edge Highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20 ring-1 ring-white/50 flex items-center justify-center text-white shrink-0">
                <GitMerge className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Intelligent Candidate Matching Engine
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="font-semibold text-blue-600 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Exact 40/20/25/15 Mathematical Model
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live SQLite DB Connected
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Project Selector & Run Matching CTA */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-64">
              <select
                value={selectedProjectId || ''}
                onChange={(e) => handleSelectProject(Number(e.target.value))}
                className="w-full pl-3.5 pr-8 py-2.5 liquid-glass text-xs font-bold text-slate-800 rounded-2xl border border-white/80 shadow-xs focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer appearance-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.department})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing || isLoading}
              className="liquid-button-primary px-4 py-2.5 rounded-2xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Computing...' : 'Run Matching Engine'}</span>
            </button>
          </div>
        </div>

        {/* Formula Weights Pills */}
        <div className="mt-5 p-3.5 rounded-2xl bg-white/60 border border-white/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-800">Deterministic Model:</span>
            <code className="text-[11px] bg-white/90 px-2.5 py-0.5 rounded-xl border border-slate-200 text-slate-800 font-mono font-semibold shadow-2xs">
              Score = 0.40 × Skill + 0.20 × Exp + 0.25 × Avail + 0.15 × Prof
            </code>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
            <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60">
              Skill: <strong>40%</strong>
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              Exp: <strong>20%</strong>
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              Avail: <strong>25%</strong>
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/60">
              Prof: <strong>15%</strong>
            </span>
          </div>
        </div>

        {successMessage && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between backdrop-blur-md animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 4 Apple Liquid Glass KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="liquid-glass-card liquid-glass-interactive p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Candidates</span>
            <div className="p-2.5 rounded-2xl bg-blue-50/80 text-blue-600 border border-blue-200/60 shadow-2xs">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono sm:font-sans">{kpis.total}</span>
            <span className="text-xs text-slate-500 font-medium">in roster</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">Scored against project criteria</p>
        </div>

        <div className="liquid-glass-card liquid-glass-interactive p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Qualified Candidates</span>
            <div className="p-2.5 rounded-2xl bg-emerald-50/80 text-emerald-600 border border-emerald-200/60 shadow-2xs">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 font-mono sm:font-sans">{kpis.qualified}</span>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              Zero Violations
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">Ready for direct assignment</p>
        </div>

        <div className="liquid-glass-card liquid-glass-interactive p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Available Staff</span>
            <div className="p-2.5 rounded-2xl bg-teal-50/80 text-teal-600 border border-teal-200/60 shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono sm:font-sans">{kpis.available}</span>
            <span className="text-xs text-slate-500 font-medium">with spare capacity</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">Capacity &gt; 0 hours / week</p>
        </div>

        <div className="liquid-glass-card liquid-glass-interactive p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Average Match Score</span>
            <div className="p-2.5 rounded-2xl bg-purple-50/80 text-purple-600 border border-purple-200/60 shadow-2xs">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono sm:font-sans">{kpis.avgScore}%</span>
            <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/60">
              Normed
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">Overall workforce compatibility</p>
        </div>
      </div>

      {/* Candidate Controls Bar: Search, Filter, Sort */}
      <div className="liquid-glass p-4 rounded-2xl border border-white/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search candidate name, role, skill, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white/70 text-xs text-slate-800 placeholder-slate-400 border border-white/90 shadow-2xs focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/70 text-xs font-semibold text-slate-700 border border-white/90 shadow-2xs"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Qualified Only Toggle */}
          <button
            onClick={() => setFilterQualifiedOnly(!filterQualifiedOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              filterQualifiedOnly
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white/70 text-slate-600 border-white/90 hover:bg-white'
            }`}
          >
            Qualified Only
          </button>

          {/* Available Only Toggle */}
          <button
            onClick={() => setFilterAvailableOnly(!filterAvailableOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              filterAvailableOnly
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white/70 text-slate-600 border-white/90 hover:bg-white'
            }`}
          >
            Available Only
          </button>
        </div>

        {/* Sort & Reset */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Sort:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/70 text-xs font-bold text-slate-700 border border-white/90 shadow-2xs"
          >
            <option value="score">Match Score</option>
            <option value="experience">Experience</option>
            <option value="capacity">Available Capacity</option>
            <option value="name">Candidate Name</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 rounded-xl transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Candidate Ranking List */}
      {isLoading ? (
        <div className="liquid-glass-card p-16 text-center">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">Evaluating 40/20/25/15 workforce candidate rankings...</p>
          <p className="text-xs text-slate-400 mt-1">Cross-referencing proficiencies and workload capacity</p>
        </div>
      ) : !matchingResult ? (
        <div className="liquid-glass-card p-16 text-center text-slate-500 text-sm">
          Please select a project above to run candidate matching.
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="liquid-glass-card p-12 text-center space-y-3">
          <XCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-800">No candidates match the selected filters.</p>
          <button
            onClick={resetFilters}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-2 font-medium">
            <span>
              Showing <strong>{filteredCandidates.length}</strong> of {matchingResult.total_candidates_evaluated} candidates
            </span>
            <span className="text-slate-400">
              * Hard constraints (capacity & availability) take precedence over numerical match score
            </span>
          </div>

          <div className="space-y-3">
            {filteredCandidates.map((cand, idx) => {
              const isExpanded = expandedCandidateId === cand.employee_id;
              const hasViolations = cand.has_hard_constraint_violation;
              const isTop = idx === 0 && !hasViolations;

              return (
                <div
                  key={cand.employee_id}
                  className={`liquid-glass-card overflow-hidden transition-all duration-300 border ${
                    hasViolations
                      ? 'border-rose-200/80 bg-rose-50/20 opacity-90'
                      : isTop
                      ? 'border-blue-400/80 ring-2 ring-blue-500/20 shadow-lg'
                      : 'border-white/80 hover:border-slate-300/80 shadow-xs hover:shadow-md'
                  }`}
                >
                  <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Identity & Department */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 border shadow-xs ${
                          hasViolations
                            ? 'bg-rose-100 text-rose-700 border-rose-200'
                            : isTop
                            ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white border-white/40 shadow-blue-500/25'
                            : 'bg-white/80 text-slate-800 border-slate-200/80'
                        }`}
                      >
                        #{idx + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">{cand.employee_name}</h4>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {cand.employee_code}
                          </span>
                          <AvailabilityBadge status={cand.availability_status} />
                          {hasViolations ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3 text-rose-600" />
                              Hard Block
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                              Qualified
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 mt-1 font-medium">
                          {cand.job_title} &bull; <span className="font-semibold text-slate-700">{cand.department}</span> &bull;{' '}
                          {cand.years_of_experience} yrs experience &bull;{' '}
                          <span className={cand.remaining_capacity > 0 ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                            {cand.remaining_capacity.toFixed(0)}h/wk available
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Subscores & Match Gauge & CTA Actions */}
                    <div className="flex flex-wrap items-center gap-5 sm:gap-6">
                      {/* 4 Mini Gauges */}
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div className="px-2 py-1 rounded-xl bg-blue-50/60 border border-blue-100/60">
                          <div className="text-[9px] uppercase font-bold text-blue-700">Skill 40%</div>
                          <span className="text-xs font-black text-slate-800">{cand.skill_score}%</span>
                        </div>
                        <div className="px-2 py-1 rounded-xl bg-indigo-50/60 border border-indigo-100/60">
                          <div className="text-[9px] uppercase font-bold text-indigo-700">Exp 20%</div>
                          <span className="text-xs font-black text-slate-800">{cand.experience_score}%</span>
                        </div>
                        <div className="px-2 py-1 rounded-xl bg-teal-50/60 border border-teal-100/60">
                          <div className="text-[9px] uppercase font-bold text-teal-700">Avail 25%</div>
                          <span className="text-xs font-black text-slate-800">{cand.availability_score}%</span>
                        </div>
                        <div className="px-2 py-1 rounded-xl bg-purple-50/60 border border-purple-100/60">
                          <div className="text-[9px] uppercase font-bold text-purple-700">Prof 15%</div>
                          <span className="text-xs font-black text-slate-800">{cand.proficiency_score}%</span>
                        </div>
                      </div>

                      {/* Total Score Badge */}
                      <div className="text-right shrink-0">
                        <div
                          className={`inline-flex items-baseline px-3.5 py-1.5 rounded-2xl font-black text-xl border shadow-xs ${
                            hasViolations
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : cand.match_score >= 80
                              ? 'bg-gradient-to-tr from-emerald-500/15 to-teal-500/20 text-emerald-800 border-emerald-300/80 shadow-emerald-500/10'
                              : 'bg-gradient-to-tr from-blue-500/15 to-indigo-500/20 text-blue-800 border-blue-300/80 shadow-blue-500/10'
                          }`}
                        >
                          {cand.match_score}%
                          <span className="text-[10px] font-bold ml-1.5 text-slate-500 uppercase tracking-wider">
                            Match
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {hasRole(['admin', 'pm']) && !hasViolations && (
                          <button
                            type="button"
                            onClick={() => {
                              setAssigningCandidate(cand);
                              setAssignedHoursInput(cand.proposed_allocation_hours || 15);
                            }}
                            className="liquid-button-primary px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
                          >
                            Assign
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setExpandedCandidateId(isExpanded ? null : cand.employee_id || null)}
                          className="p-2 text-slate-500 hover:text-slate-800 rounded-xl liquid-glass border border-white/80 hover:bg-white transition-all cursor-pointer"
                          title={isExpanded ? 'Collapse explainability' : 'Expand explainability'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Hard Constraint Alert Banner */}
                  {hasViolations && (
                    <div className="mx-5 mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <div>
                        <span className="font-extrabold uppercase tracking-wide mr-1.5">Hard Constraint Active:</span>
                        <span>{cand.violations.join('; ')}</span>
                      </div>
                    </div>
                  )}

                  {/* Expandable Liquid Glass Explainability Panel */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-3 border-t border-slate-200/60 bg-white/40 space-y-4 text-xs animate-in fade-in duration-200">
                      {/* Plain-Language Explanation */}
                      <div className="p-4 rounded-2xl bg-white/80 border border-white shadow-2xs text-slate-700 leading-relaxed">
                        <span className="font-extrabold text-slate-900 block mb-1 flex items-center gap-1.5 text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          Workforce Intelligence Explainability Rationale
                        </span>
                        <p className="text-slate-600 text-xs leading-relaxed">{cand.explanation}</p>
                      </div>

                      {/* Skill Breakdown Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Matched Skills */}
                        <div className="space-y-2">
                          <span className="font-bold text-slate-800 block text-xs flex items-center justify-between">
                            <span>Matched Skills ({cand.matched_skills.length})</span>
                            <span className="text-[10px] text-emerald-600 font-semibold">Criteria Satisfied</span>
                          </span>
                          <div className="space-y-1.5">
                            {cand.matched_skills.map((ms) => (
                              <div
                                key={ms.skill_id}
                                className="p-2.5 rounded-xl bg-white/80 border border-white shadow-2xs flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-bold text-slate-800">{ms.skill_name}</span>
                                  {ms.is_mandatory && (
                                    <span className="ml-1.5 text-[10px] text-blue-600 font-extrabold uppercase">
                                      *Mandatory
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] font-semibold text-slate-600">
                                  Proficiency: <strong className="text-blue-600 font-bold">L{ms.employee_proficiency}</strong> / Req L{ms.required_proficiency}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Missing Skills & Training Recommendations */}
                        <div className="space-y-2">
                          <span className="font-bold text-slate-800 block text-xs flex items-center justify-between">
                            <span>Missing Required Skills ({cand.missing_skills.length})</span>
                            {cand.missing_skills.length > 0 && (
                              <span className="text-[10px] text-rose-600 font-semibold">Requires Upskilling</span>
                            )}
                          </span>
                          {cand.missing_skills.length === 0 ? (
                            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-emerald-800 font-medium text-xs flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Zero skill gaps! Candidate satisfies 100% of project skill requirements.</span>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {cand.missing_skills.map((ms) => (
                                <div
                                  key={ms.skill_id}
                                  className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 text-xs flex items-center justify-between"
                                >
                                  <div>
                                    <span className="font-bold text-rose-900">{ms.skill_name}</span>
                                    {ms.is_mandatory && (
                                      <span className="ml-1.5 text-[10px] text-rose-600 font-extrabold uppercase">
                                        *Critical Missing
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
                                    Req: Level {ms.required_proficiency}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Assignment Confirmation Glass Modal */}
      {assigningCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in">
          <div className="liquid-glass rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-white/80 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">Assign Candidate to Project</h3>
              </div>
              <button
                onClick={() => setAssigningCandidate(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignCandidate} className="mt-4 space-y-4">
              <div className="p-3.5 rounded-2xl bg-white/70 border border-white text-xs space-y-1">
                <p className="font-bold text-slate-800">{assigningCandidate.employee_name}</p>
                <p className="text-slate-500">
                  {assigningCandidate.job_title} &bull; {assigningCandidate.department}
                </p>
                <p className="text-slate-600 font-medium pt-1">
                  Target Project: <strong className="text-blue-600">{matchingResult?.project_name}</strong>
                </p>
                <p className="text-[11px] text-slate-500">
                  Remaining Capacity: <strong>{assigningCandidate.remaining_capacity.toFixed(0)}h / week</strong>
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Weekly Assigned Hours:</label>
                <input
                  type="number"
                  step="1"
                  min="5"
                  max={Math.max(40, assigningCandidate.remaining_capacity)}
                  value={assignedHoursInput}
                  onChange={(e) => setAssignedHoursInput(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl liquid-glass text-xs font-bold text-slate-900 border border-white/90"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Role on Project:</label>
                <input
                  type="text"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl liquid-glass text-xs font-semibold text-slate-900 border border-white/90"
                  placeholder="e.g. Lead Engineer, Consultant"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAssigningCandidate(null)}
                  className="liquid-button-secondary px-4 py-2 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="liquid-button-primary px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
