import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  GitMerge,
  Cpu,
  BarChart3,
  Calendar,
  Users,
  Clock,
  X,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import apiClient from '../services/api';
import { Project, SkillCatalogItem } from '../types';
import { ProgressBar } from '../components/common/ProgressBar';
import { useAuth } from '../context/AuthContext';

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [skillsCatalog, setSkillsCatalog] = useState<SkillCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: 'Engineering',
    priority: 'medium',
    status: 'planning',
    required_team_size: 3,
    estimated_weekly_hours: 30.0,
    min_experience: 2.0,
    start_date: new Date().toISOString().split('T')[0],
    deadline: '',
    required_skills: [] as Array<{ skill_id: number; min_proficiency: number; is_mandatory: boolean }>,
  });

  const { hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    fetchSkillsCatalog();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<Project[]>('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSkillsCatalog = async () => {
    try {
      const res = await apiClient.get<SkillCatalogItem[]>('/employees/skills/catalog');
      setSkillsCatalog(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSkillToForm = (skillId: number) => {
    if (formData.required_skills.some((s) => s.skill_id === skillId)) return;
    setFormData({
      ...formData,
      required_skills: [
        ...formData.required_skills,
        { skill_id: skillId, min_proficiency: 2, is_mandatory: true },
      ],
    });
  };

  const handleRemoveSkillFromForm = (skillId: number) => {
    setFormData({
      ...formData,
      required_skills: formData.required_skills.filter((s) => s.skill_id !== skillId),
    });
  };

  const handleUpdateSkillInForm = (skillId: number, field: string, val: any) => {
    setFormData({
      ...formData,
      required_skills: formData.required_skills.map((s) =>
        s.skill_id === skillId ? { ...s, [field]: val } : s
      ),
    });
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        start_date: formData.start_date.trim() ? formData.start_date : null,
        deadline: formData.deadline.trim() ? formData.deadline : null,
      };
      await apiClient.post('/projects', payload);
      setShowAddModal(false);
      setFormData({
        name: '',
        description: '',
        department: 'Engineering',
        priority: 'medium',
        status: 'planning',
        required_team_size: 3,
        estimated_weekly_hours: 30.0,
        min_experience: 2.0,
        start_date: new Date().toISOString().split('T')[0],
        deadline: '',
        required_skills: [],
      });
      fetchProjects();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create project');
    }
  };

  const departments = ['Engineering', 'Data & AI', 'Cloud & DevOps', 'Cybersecurity'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Project Portfolio & Staffing
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage project skill requirements, team capacity, and run candidate matching engines.
          </p>
        </div>
        {hasRole(['admin', 'pm', 'hr']) && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => navigate('/projects/create')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Project</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Quick modal entry"
            >
              <span>Quick Modal</span>
            </button>
          </div>
        )}
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="liquid-glass-card p-16 text-center text-xs font-bold text-slate-500">
          Loading projects...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="liquid-glass-card p-6 flex flex-col justify-between relative overflow-hidden group hover:border-blue-400/60 transition-all duration-300"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

              <div className="space-y-4">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 text-base tracking-tight">{proj.name}</h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border shadow-2xs ${
                          proj.priority === 'critical'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : proj.priority === 'high'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {proj.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">{proj.department}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/80 text-slate-700 border border-slate-200/80 shadow-2xs capitalize">
                    {proj.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-2">
                  {proj.description}
                </p>

                {/* Team & Hours Progress */}
                <div className="p-4 rounded-2xl bg-white/70 border border-white shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        Staffing: {proj.assigned_count} of {proj.required_team_size} members
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{proj.estimated_weekly_hours} hrs/wk</span>
                    </span>
                  </div>
                  <ProgressBar value={proj.staffing_fulfillment_percent} size="sm" />
                </div>

                {/* Required Skills */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Required Skills ({proj.required_skills.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {proj.required_skills.map((req) => (
                      <span
                        key={req.id || req.skill_id}
                        className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-semibold border shadow-2xs ${
                          req.is_mandatory
                            ? 'bg-blue-50/90 text-blue-800 border-blue-200/80'
                            : 'bg-white/80 text-slate-700 border-slate-200/80'
                        }`}
                      >
                        {req.skill_name || `Skill #${req.skill_id}`}
                        <span className="ml-1.5 px-1.5 py-0.2 rounded-md bg-white text-slate-800 text-[10px] font-bold border border-slate-200">
                          Min L{req.min_proficiency}
                        </span>
                        {req.is_mandatory && <span className="ml-1 text-[11px] text-blue-600 font-black">*</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 mt-5 border-t border-slate-200/60 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => navigate(`/matching?project_id=${proj.id}`)}
                  className="flex-1 py-2 px-3.5 liquid-button-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  <span>Match Candidates</span>
                </button>
                <button
                  onClick={() => navigate(`/optimization?project_id=${proj.id}`)}
                  className="flex-1 py-2 px-3.5 liquid-button-secondary text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5 text-blue-600" />
                  <span>Optimize Team</span>
                </button>
                <button
                  onClick={() => navigate(`/skill-gaps?project_id=${proj.id}`)}
                  className="py-2 px-3 liquid-glass-subtle hover:bg-white text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-white/80 cursor-pointer shadow-2xs"
                  title="Analyze Gaps"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Gaps</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Create New Project</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Quick modal entry for project requirements</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. AI-Powered Recommendation Service"
                  className="w-full px-3.5 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Goals, deliverables, and technical scope..."
                  className="w-full px-3.5 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Required Team Size</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.required_team_size}
                    onChange={(e) => setFormData({ ...formData, required_team_size: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Est. Weekly Hours</label>
                  <input
                    type="number"
                    step="5"
                    min="5"
                    value={formData.estimated_weekly_hours}
                    onChange={(e) => setFormData({ ...formData, estimated_weekly_hours: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Required Skills Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Required Skills</label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddSkillToForm(Number(e.target.value));
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3.5 py-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 mb-2 cursor-pointer"
                >
                  <option value="">+ Add required skill from catalog...</option>
                  {skillsCatalog.map((sk) => (
                    <option key={sk.id} value={sk.id}>
                      {sk.name} ({sk.category})
                    </option>
                  ))}
                </select>

                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {formData.required_skills.map((req) => {
                    const skObj = skillsCatalog.find((s) => s.id === req.skill_id);
                    return (
                      <div
                        key={req.skill_id}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-slate-800">{skObj?.name || `Skill #${req.skill_id}`}</span>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={req.is_mandatory}
                              onChange={(e) => handleUpdateSkillInForm(req.skill_id, 'is_mandatory', e.target.checked)}
                              className="rounded text-blue-600"
                            />
                            <span>Mandatory</span>
                          </label>
                          <select
                            value={req.min_proficiency}
                            onChange={(e) =>
                              handleUpdateSkillInForm(req.skill_id, 'min_proficiency', Number(e.target.value))
                            }
                            className="bg-white border border-slate-200 rounded px-2 py-0.5 text-[11px] font-bold"
                          >
                            <option value="1">Min L1</option>
                            <option value="2">Min L2</option>
                            <option value="3">Min L3</option>
                            <option value="4">Min L4</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkillFromForm(req.skill_id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    navigate('/projects/create');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Open Full Screen Form &rarr;
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition-colors"
                  >
                    Create Project
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
