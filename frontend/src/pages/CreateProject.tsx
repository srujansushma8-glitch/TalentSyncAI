import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Award,
  Layers,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FolderPlus,
  Cpu,
  Shield,
  Code,
  Database,
  Cloud,
} from 'lucide-react';
import apiClient from '../services/api';
import { SkillCatalogItem, Project } from '../types';
import { useAuth } from '../context/AuthContext';

interface PresetTemplate {
  name: string;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planning' | 'in_progress';
  teamSize: number;
  weeklyHours: number;
  minExp: number;
  description: string;
  suggestedSkillNames: string[];
}

const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    name: 'Enterprise Cloud Modernization',
    department: 'Cloud & DevOps',
    priority: 'high',
    status: 'planning',
    teamSize: 4,
    weeklyHours: 35.0,
    minExp: 3.5,
    description:
      'Migrate monolithic infrastructure to AWS containerized microservices managed via Terraform, Docker, and Kubernetes.',
    suggestedSkillNames: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD'],
  },
  {
    name: 'Autonomous AI Recommendation Engine',
    department: 'Data & AI',
    priority: 'critical',
    status: 'planning',
    teamSize: 3,
    weeklyHours: 30.0,
    minExp: 4.0,
    description:
      'Build end-to-end embedding retrieval and transformer ranking pipeline for intelligent candidate matching and talent discovery.',
    suggestedSkillNames: ['Python', 'Machine Learning', 'Deep Learning', 'SQL', 'FastAPI'],
  },
  {
    name: 'Customer Portal Web Platform',
    department: 'Engineering',
    priority: 'medium',
    status: 'planning',
    teamSize: 3,
    weeklyHours: 30.0,
    minExp: 2.0,
    description:
      'High-performance enterprise SaaS web application with real-time analytics dashboards, role-based controls, and responsive UI.',
    suggestedSkillNames: ['React', 'TypeScript', 'Node.js', 'REST API', 'PostgreSQL'],
  },
  {
    name: 'SOC2 & Zero-Trust Security Audit',
    department: 'Cybersecurity',
    priority: 'high',
    status: 'planning',
    teamSize: 2,
    weeklyHours: 25.0,
    minExp: 4.0,
    description:
      'Comprehensive penetration testing, vulnerability assessment, and SOC2 compliance controls validation across all production assets.',
    suggestedSkillNames: ['Network Security', 'Penetration Testing', 'Compliance & SOC2'],
  },
];

export const CreateProject: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [skillsCatalog, setSkillsCatalog] = useState<SkillCatalogItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [status, setStatus] = useState<'planning' | 'in_progress'>('planning');
  const [requiredTeamSize, setRequiredTeamSize] = useState<number>(3);
  const [estimatedWeeklyHours, setEstimatedWeeklyHours] = useState<number>(30.0);
  const [minExperience, setMinExperience] = useState<number>(2.0);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<
    Array<{ skill_id: number; min_proficiency: number; is_mandatory: boolean }>
  >([]);

  useEffect(() => {
    fetchSkillsCatalog();
  }, []);

  const fetchSkillsCatalog = async () => {
    try {
      const res = await apiClient.get<SkillCatalogItem[]>('/employees/skills/catalog');
      setSkillsCatalog(res.data);
    } catch (err) {
      console.error('Failed to load skills catalog', err);
    }
  };

  const departments = ['Engineering', 'Data & AI', 'Cloud & DevOps', 'Cybersecurity'];
  const categories = ['All', ...Array.from(new Set(skillsCatalog.map((s) => s.category)))];

  const handleApplyPreset = (preset: PresetTemplate) => {
    setName(preset.name);
    setDepartment(preset.department);
    setPriority(preset.priority);
    setStatus(preset.status);
    setRequiredTeamSize(preset.teamSize);
    setEstimatedWeeklyHours(preset.weeklyHours);
    setMinExperience(preset.minExp);
    setDescription(preset.description);

    // Map suggested skill names to catalog IDs
    const matchedSkills: Array<{ skill_id: number; min_proficiency: number; is_mandatory: boolean }> = [];
    preset.suggestedSkillNames.forEach((sName) => {
      const found = skillsCatalog.find(
        (s) => s.name.toLowerCase() === sName.toLowerCase() || s.name.toLowerCase().includes(sName.toLowerCase())
      );
      if (found && !matchedSkills.some((m) => m.skill_id === found.id)) {
        matchedSkills.push({
          skill_id: found.id,
          min_proficiency: 3,
          is_mandatory: true,
        });
      }
    });

    if (matchedSkills.length > 0) {
      setRequiredSkills(matchedSkills);
    }
  };

  const handleAddSkill = (skillId: number) => {
    if (requiredSkills.some((s) => s.skill_id === skillId)) return;
    setRequiredSkills((prev) => [
      ...prev,
      { skill_id: skillId, min_proficiency: 2, is_mandatory: true },
    ]);
  };

  const handleRemoveSkill = (skillId: number) => {
    setRequiredSkills((prev) => prev.filter((s) => s.skill_id !== skillId));
  };

  const handleUpdateSkill = (skillId: number, field: string, val: any) => {
    setRequiredSkills((prev) =>
      prev.map((s) => (s.skill_id === skillId ? { ...s, [field]: val } : s))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a project name.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        department,
        priority,
        status,
        required_team_size: Number(requiredTeamSize),
        estimated_weekly_hours: Number(estimatedWeeklyHours),
        min_experience: Number(minExperience),
        start_date: startDate.trim() ? startDate : null,
        deadline: deadline.trim() ? deadline : null,
        required_skills: requiredSkills,
      };

      const res = await apiClient.post<Project>('/projects', payload);
      // Seamlessly navigate to matching page for this new project
      navigate(`/matching?project_id=${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create project. Please verify inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCatalog = skillsCatalog.filter((s) => {
    if (selectedCategory !== 'All' && s.category !== selectedCategory) return false;
    return !requiredSkills.some((req) => req.skill_id === s.id);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Breadcrumb & Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/90 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <button
              onClick={() => navigate('/projects')}
              className="hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Projects</span>
            </button>
            <span>/</span>
            <span className="text-slate-900 font-bold">Create New Project</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FolderPlus className="w-6 h-6 text-blue-600" />
            <span>Create New Project & Define Requirements</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure project specifications, timeline, team capacity targets, and skill requirements for automated candidate matching.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Creating Project...' : 'Save & Match Candidates'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preset Quick Start Templates */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Quick-Start Project Templates
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Click a template to auto-populate form</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(tmpl)}
              className="text-left p-3.5 rounded-lg bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                  {tmpl.department}
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                    tmpl.priority === 'critical'
                      ? 'bg-rose-100 text-rose-700'
                      : tmpl.priority === 'high'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {tmpl.priority}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 leading-snug">
                {tmpl.name}
              </h4>
              <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                {tmpl.description}
              </p>
              <div className="mt-2.5 flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                <span>{tmpl.teamSize} seats</span>
                <span>•</span>
                <span>{tmpl.weeklyHours}h/wk</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Fields */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. General Project Details */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Project Overview</h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Project Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Real-Time Fraud Detection Engine"
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Description & Scope
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize project goals, technical deliverable milestones, and team impact..."
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Initial Lifecycle Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="planning">Planning & Staffing</option>
                    <option value="in_progress">Active / In Progress</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Team Capacity & Staffing Specs */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Capacity & Timeline Constraints</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Required Team Size
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={requiredTeamSize}
                      onChange={(e) => setRequiredTeamSize(Number(e.target.value))}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                    <Users className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">Number of dedicated seats</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Est. Weekly Hours
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="5"
                      min="5"
                      max="80"
                      value={estimatedWeeklyHours}
                      onChange={(e) => setEstimatedWeeklyHours(Number(e.target.value))}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">Total weekly commitment</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Min. Experience
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="20"
                      value={minExperience}
                      onChange={(e) => setMinExperience(Number(e.target.value))}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                    <Award className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">Years of professional experience</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Start Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Target Deadline <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Required Skills & Competencies */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Required Skills & Competencies</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {requiredSkills.length} selected
                  </span>
                </div>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Add Skill Dropdown */}
              <div>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddSkill(Number(e.target.value));
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">+ Add a skill from catalog ({filteredCatalog.length} available)...</option>
                  {filteredCatalog.map((sk) => (
                    <option key={sk.id} value={sk.id}>
                      {sk.name} &bull; {sk.category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Configured Required Skills List */}
              {requiredSkills.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center">
                  <p className="text-xs font-medium text-slate-400">
                    No skills configured yet. Add skills from the dropdown above or click a template at the top.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {requiredSkills.map((req) => {
                    const skillObj = skillsCatalog.find((s) => s.id === req.skill_id);
                    return (
                      <div
                        key={req.skill_id}
                        className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                          <div>
                            <span className="font-bold text-slate-900">
                              {skillObj?.name || `Skill #${req.skill_id}`}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-2">
                              {skillObj?.category || 'General'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          {/* Mandatory Toggle */}
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-semibold text-xs">
                            <input
                              type="checkbox"
                              checked={req.is_mandatory}
                              onChange={(e) =>
                                handleUpdateSkill(req.skill_id, 'is_mandatory', e.target.checked)
                              }
                              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span>Mandatory</span>
                          </label>

                          {/* Proficiency Selector */}
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                            <span>Level:</span>
                            <select
                              value={req.min_proficiency}
                              onChange={(e) =>
                                handleUpdateSkill(
                                  req.skill_id,
                                  'min_proficiency',
                                  Number(e.target.value)
                                )
                              }
                              className="px-2 py-1 bg-white border border-slate-200 rounded font-bold text-slate-800 text-xs focus:outline-none"
                            >
                              <option value="1">L1 - Basic</option>
                              <option value="2">L2 - Intermediate</option>
                              <option value="3">L3 - Advanced</option>
                              <option value="4">L4 - Expert</option>
                            </select>
                          </div>

                          {/* Remove Skill */}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(req.skill_id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remove skill"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="px-5 py-2.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Creating Project...' : 'Create Project & Match Talent'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Interactive Preview */}
        <div className="lg:col-span-4 space-y-5 sticky top-20">
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Live Project Preview
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Real-Time
              </span>
            </div>

            {/* Simulated Project Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    {name.trim() || 'Untitled Project'}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-semibold">{department}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                    priority === 'critical'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : priority === 'high'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {priority}
                </span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">
                {description.trim() || 'Project description and scope will appear here.'}
              </p>

              {/* Staffing Bar Preview */}
              <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>0 of {requiredTeamSize} members</span>
                  </span>
                  <span className="text-slate-500">{estimatedWeeklyHours} hrs/wk</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-blue-600 h-1.5 rounded-full w-0" />
                </div>
              </div>

              {/* Skills Tags Preview */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Required Competencies ({requiredSkills.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {requiredSkills.length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic">No skills selected</span>
                  ) : (
                    requiredSkills.map((req) => {
                      const sk = skillsCatalog.find((s) => s.id === req.skill_id);
                      return (
                        <span
                          key={req.skill_id}
                          className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[10px] font-semibold"
                        >
                          {sk?.name || `Skill #${req.skill_id}`}
                          <span className="ml-1 text-slate-400">L{req.min_proficiency}</span>
                          {req.is_mandatory && <span className="ml-0.5 text-blue-600 font-bold">*</span>}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* AI Optimization Notice */}
            <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-blue-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-blue-700">
                <Cpu className="w-3.5 h-3.5" />
                <span>Automated Talent Matching</span>
              </div>
              <p className="text-[11px] text-blue-800/80 leading-relaxed">
                Upon saving, the AI matching engine will immediately calculate candidate fit scores across your 22 active workforce members based on skill overlap, proficiency margins, and available weekly capacity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CreateProject;
