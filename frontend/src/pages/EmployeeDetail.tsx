import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Clock,
  Award,
  BookOpen,
  Calendar,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import apiClient from '../services/api';
import { Employee, SkillCatalogItem, TrainingRecommendation } from '../types';
import { ProficiencyBadge, AvailabilityBadge, WorkloadBadge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { useAuth } from '../context/AuthContext';

export const EmployeeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [skillsCatalog, setSkillsCatalog] = useState<SkillCatalogItem[]>([]);
  const [recommendations, setRecommendations] = useState<TrainingRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSkillId, setSelectedSkillId] = useState<number | ''>('');
  const [selectedLevel, setSelectedLevel] = useState<number>(2);

  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchEmployee();
      fetchSkillsCatalog();
      fetchTrainingRecommendations();
    }
  }, [id]);

  const fetchEmployee = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<Employee>(`/employees/${id}`);
      setEmployee(res.data);
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

  const fetchTrainingRecommendations = async () => {
    try {
      const res = await apiClient.get<TrainingRecommendation[]>('/training/recommendations', {
        params: { employee_id: id },
      });
      setRecommendations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddOrUpdateSkill = async (skillId: number, level: number) => {
    try {
      await apiClient.post(`/employees/${id}/skills`, {
        skill_id: skillId,
        proficiency_level: level,
      });
      setSelectedSkillId('');
      fetchEmployee();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update skill');
    }
  };

  const handleRemoveSkill = async (skillId: number) => {
    if (!window.confirm('Remove this skill from employee profile?')) return;
    try {
      await apiClient.delete(`/employees/${id}/skills/${skillId}`);
      fetchEmployee();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to remove skill');
    }
  };

  if (isLoading || !employee) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const canEdit = hasRole(['admin', 'hr']) || (user && user.role === 'employee' && employee.email === user.email);
  const employeeSkillIds = new Set(employee.skills.map((s) => s.skill_id));
  const availableSkills = skillsCatalog.filter((sk) => !employeeSkillIds.has(sk.id));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/employees')}
        className="liquid-button-secondary px-3.5 py-2 rounded-2xl text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Talent Directory</span>
      </button>

      {/* Profile Overview Card */}
      <div className="liquid-glass-card p-6 sm:p-7 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

        <div className="flex items-center gap-4 sm:gap-5">
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 ring-2 ring-white/50 shrink-0">
            {employee.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{employee.name}</h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-white/80 text-slate-600 border border-slate-200/80 shadow-2xs">
                {employee.employee_code}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {employee.job_title} &bull; <span className="font-bold text-slate-700">{employee.department}</span>
            </p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{employee.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <AvailabilityBadge status={employee.availability_status} />
          <WorkloadBadge
            status={
              employee.utilization_percent > 100
                ? 'OVERLOADED'
                : employee.utilization_percent >= 70
                ? 'OPTIMAL'
                : 'UNDERUTILIZED'
            }
            percentage={employee.utilization_percent}
          />
        </div>
      </div>

      {/* Grid: Capacity & Workload + Assignments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Capacity Breakdown */}
        <div className="liquid-glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Weekly Capacity</span>
            </h3>
            <span className="text-xs font-bold text-slate-500">{employee.weekly_working_hours} hrs/wk</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Committed Hours</span>
                <span className="text-slate-900 font-bold">{employee.committed_hours}h</span>
              </div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-600">Remaining Capacity</span>
                <span className="text-emerald-700 font-bold">{employee.remaining_capacity}h</span>
              </div>
              <ProgressBar value={employee.utilization_percent} isUtilization showLabel />
            </div>

            <div className="pt-3 border-t border-slate-200/60 text-xs text-slate-500 space-y-1.5 font-medium">
              <p>Experience: <strong className="text-slate-800 font-bold">{employee.years_of_experience} years</strong></p>
              <p>Learning Goals: <span className="text-slate-700">{employee.learning_interests || 'Full-stack & AI architecture'}</span></p>
            </div>
          </div>
        </div>

        {/* Current Active Commitments */}
        <div className="md:col-span-2 liquid-glass-card p-6">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 mb-4">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <span>Active Project Commitments</span>
          </h3>

          {employee.assignments.length === 0 ? (
            <div className="p-10 text-center text-xs font-semibold text-slate-500 bg-white/40 rounded-2xl border border-dashed border-slate-300">
              No active project assignments. Employee has full {employee.weekly_working_hours}h weekly capacity available.
            </div>
          ) : (
            <div className="space-y-2.5">
              {employee.assignments.map((asgn) => (
                <div
                  key={asgn.id}
                  className="p-3.5 rounded-2xl border border-white bg-white/70 shadow-2xs flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{asgn.project_name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">{asgn.role_in_project}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200/60 shadow-2xs">
                      {asgn.assigned_weekly_hours} hrs / week
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Skills Inventory & Proficiency Editor */}
      <div className="liquid-glass-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span>Skills Inventory & Proficiency Levels</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Proficiency scale: L1 (Beginner), L2 (Intermediate), L3 (Advanced), L4 (Expert)
            </p>
          </div>

          {canEdit && availableSkills.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={selectedSkillId}
                onChange={(e) => setSelectedSkillId(e.target.value ? Number(e.target.value) : '')}
                className="px-3 py-1.5 border border-white/90 rounded-xl text-xs bg-white/80 text-slate-700 font-semibold shadow-2xs"
              >
                <option value="">Select skill to add...</option>
                {availableSkills.map((sk) => (
                  <option key={sk.id} value={sk.id}>
                    {sk.name} ({sk.category})
                  </option>
                ))}
              </select>

              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(Number(e.target.value))}
                className="px-2.5 py-1.5 border border-white/90 rounded-xl text-xs bg-white/80 text-slate-700 font-bold shadow-2xs"
              >
                <option value="1">L1</option>
                <option value="2">L2</option>
                <option value="3">L3</option>
                <option value="4">L4</option>
              </select>

              <button
                type="button"
                disabled={!selectedSkillId}
                onClick={() => handleAddOrUpdateSkill(Number(selectedSkillId), selectedLevel)}
                className="liquid-button-primary px-3 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-50 flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          )}
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {employee.skills.map((es) => (
            <div
              key={es.skill_id}
              className="p-3.5 rounded-2xl border border-white bg-white/70 shadow-2xs flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">{es.name}</span>
                  {es.is_verified && (
                    <span title="Verified Skill">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">{es.category}</span>
              </div>

              <div className="flex items-center gap-2">
                {canEdit ? (
                  <select
                    value={es.proficiency_level}
                    onChange={(e) => handleAddOrUpdateSkill(es.skill_id, Number(e.target.value))}
                    className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-blue-600 shadow-2xs"
                  >
                    <option value="1">L1 Beginner</option>
                    <option value="2">L2 Intermediate</option>
                    <option value="3">L3 Advanced</option>
                    <option value="4">L4 Expert</option>
                  </select>
                ) : (
                  <ProficiencyBadge level={es.proficiency_level} />
                )}

                {canEdit && (
                  <button
                    onClick={() => handleRemoveSkill(es.skill_id)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-lg"
                    title="Remove Skill"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Targeted Learning & Training Recommendations */}
      <div className="liquid-glass-card p-6 space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span>Recommended Learning Pathways</span>
        </h3>

        {recommendations.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 font-medium">No pending upskilling pathways assigned to this employee.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-4 rounded-2xl border border-white bg-white/70 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                    Target: {rec.target_skill_name}
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold">{rec.estimated_hours} hrs</span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs">{rec.resource_title}</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">{rec.reason}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold">{rec.resource_provider}</span>
                  <a
                    href={rec.resource_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>Open Course</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
