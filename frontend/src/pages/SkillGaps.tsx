import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  TrendingDown,
  Layers,
  GraduationCap,
  Sparkles,
  ShieldAlert,
  Users,
  Target,
} from 'lucide-react';
import apiClient from '../services/api';
import { Project, ProjectSkillGapReport, OrgSkillGapReport } from '../types';

export const SkillGaps: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'project' | 'organization'>('project');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projectReport, setProjectReport] = useState<ProjectSkillGapReport | null>(null);
  const [orgReport, setOrgReport] = useState<OrgSkillGapReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    fetchOrgGaps();
  }, []);

  useEffect(() => {
    const pParam = searchParams.get('project_id');
    if (pParam && projects.length > 0) {
      const pid = parseInt(pParam);
      setSelectedProjectId(pid);
      fetchProjectGaps(pid);
    } else if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
      fetchProjectGaps(projects[0].id);
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

  const fetchProjectGaps = async (projectId: number) => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<ProjectSkillGapReport>(`/skill-gaps/project/${projectId}`);
      setProjectReport(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrgGaps = async () => {
    try {
      const res = await apiClient.get<OrgSkillGapReport>('/skill-gaps/organization');
      setOrgReport(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectProject = (projectId: number) => {
    setSelectedProjectId(projectId);
    setSearchParams({ project_id: projectId.toString() });
    fetchProjectGaps(projectId);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Top Header & Tab Controls */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 shadow-glass flex flex-col md:flex-row md:items-center md:justify-between gap-5 border border-white/60 dark:border-white/10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500/20 via-pink-500/20 to-purple-500/20 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-sm backdrop-blur-md">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Skill Gap Intelligence
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  Real-time Diagnostics
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Deterministic telemetry comparing project pipeline requirements against active workforce capabilities.
              </p>
            </div>
          </div>
        </div>

        {/* Liquid Segmented Control */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-white/5 self-start md:self-auto shadow-inner">
          <button
            onClick={() => setActiveTab('project')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
              activeTab === 'project'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Project-Level Gaps
          </button>
          <button
            onClick={() => setActiveTab('organization')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
              activeTab === 'organization'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Org-Wide Shortages
          </button>
        </div>
      </div>

      {activeTab === 'project' ? (
        <div className="space-y-6">
          {/* Project Selector Bar */}
          <div className="liquid-glass rounded-2xl p-4 border border-white/60 dark:border-white/10 shadow-glass flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Target Project:</label>
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
            </div>

            {projectReport && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Health Evaluation:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border shadow-sm ${
                    projectReport.overall_health === 'HEALTHY'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : projectReport.overall_health === 'RISK'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  }`}
                >
                  {projectReport.overall_health}
                </span>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="p-16 text-center text-xs text-slate-500 dark:text-slate-400 liquid-glass rounded-2xl">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Analyzing requirement gaps & skill deficiencies...
            </div>
          ) : !projectReport ? (
            <div className="p-16 text-center text-xs text-slate-500 dark:text-slate-400 liquid-glass rounded-2xl">
              No report available.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats in Liquid Glass */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="liquid-glass-card rounded-2xl p-4 border border-white/60 dark:border-white/10 shadow-glass text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                    Total Skills
                  </span>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {projectReport.required_skills_count}
                  </div>
                </div>
                <div className="liquid-glass-card rounded-2xl p-4 border border-white/60 dark:border-white/10 shadow-glass text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                    Satisfied
                  </span>
                  <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    {projectReport.satisfied_skills_count}
                  </div>
                </div>
                <div className="liquid-glass-card rounded-2xl p-4 border border-white/60 dark:border-white/10 shadow-glass text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                    Missing Mandatory
                  </span>
                  <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                    {projectReport.missing_mandatory_count}
                  </div>
                </div>
                <div className="liquid-glass-card rounded-2xl p-4 border border-white/60 dark:border-white/10 shadow-glass text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                    Proficiency Deficit
                  </span>
                  <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                    {projectReport.proficiency_deficient_count}
                  </div>
                </div>
              </div>

              {/* Skill Gaps Breakdown Cards */}
              <div className="liquid-glass-card rounded-3xl p-6 shadow-glass border border-white/60 dark:border-white/10 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-slate-800/50">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span>Detailed Requirement Diagnostics</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {projectReport.gaps.length} evaluated competencies
                  </span>
                </div>

                <div className="space-y-3">
                  {projectReport.gaps.map((gap) => (
                    <div
                      key={gap.skill_id}
                      className={`p-4 rounded-2xl border transition-all duration-200 ${
                        gap.status === 'satisfied'
                          ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800'
                          : gap.severity === 'CRITICAL'
                          ? 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/30'
                          : 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-200/50 dark:border-slate-800/50">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{gap.skill_name}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">
                            ({gap.category})
                          </span>
                          {gap.is_mandatory && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              Mandatory
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs flex-wrap">
                          <span className="text-slate-600 dark:text-slate-300">
                            Required: <strong className="text-slate-900 dark:text-white">L{gap.required_proficiency}</strong>
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                          <span className="text-slate-600 dark:text-slate-300">
                            Team Peak:{' '}
                            <strong
                              className={
                                gap.current_highest_proficiency >= gap.required_proficiency
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }
                            >
                              {gap.current_highest_proficiency > 0 ? `L${gap.current_highest_proficiency}` : 'None (0)'}
                            </strong>
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              gap.severity === 'CRITICAL'
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                : gap.severity === 'MODERATE'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {gap.severity}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
                        {gap.recommended_action}
                      </p>

                      {/* Viable Candidates for upskilling */}
                      {gap.viable_trainees.length > 0 && (
                        <div className="pt-2.5 border-t border-slate-200/50 dark:border-slate-800/50 text-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-blue-500" />
                            Viable Upskilling Candidates:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {gap.viable_trainees.map((t) => (
                              <div
                                key={t.employee_id}
                                className="px-3 py-1.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center gap-2 text-xs"
                              >
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {t.employee_name}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                  L{t.current_proficiency} &rarr; L{t.target_proficiency} ({t.learning_effort_hours}h training)
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-end">
                  <button
                    onClick={() => navigate('/training')}
                    className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    <span>View Recommended Training Courses</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Org-Wide Skill Shortage Matrix */
        <div className="liquid-glass-card rounded-3xl p-6 shadow-glass border border-white/60 dark:border-white/10 space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Organization-Wide Skill Demand vs. Supply Matrix
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Aggregated across {orgReport?.total_skills_tracked || 0} skills in active pipelines. Highlights critical
              deficits where project demand exceeds proficient staff.
            </p>
          </div>

          {!orgReport ? (
            <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">
              Loading aggregate shortages...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200/60 dark:border-slate-800/60">
                  <tr>
                    <th className="py-3 px-4">Skill & Category</th>
                    <th className="py-3 px-4">Pipeline Demand</th>
                    <th className="py-3 px-4">Total Supply</th>
                    <th className="py-3 px-4">Proficient Staff (L3+)</th>
                    <th className="py-3 px-4">Shortage Gap</th>
                    <th className="py-3 px-4 text-right">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {orgReport.top_demanded_skills.map((item) => (
                    <tr
                      key={item.skill_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{item.skill_name}</div>
                        <div className="text-[10px] text-slate-400 uppercase">{item.category}</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                        {item.total_required_in_projects} projects
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {item.total_employees_with_skill} employees
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {item.proficient_employees_count} staff
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`font-bold ${
                            item.shortage_gap > 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {item.shortage_gap > 0 ? `-${item.shortage_gap} shortage` : 'Covered'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                            item.severity === 'CRITICAL'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                              : item.severity === 'HIGH'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {item.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
