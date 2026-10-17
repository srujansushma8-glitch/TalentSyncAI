import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Plus,
  Briefcase,
  Clock,
  Sparkles,
  ChevronRight,
  X,
  UserCheck,
} from 'lucide-react';
import apiClient from '../services/api';
import { Employee, SkillCatalogItem } from '../types';
import { ProficiencyBadge, AvailabilityBadge, WorkloadBadge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { useAuth } from '../context/AuthContext';

export const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [skillsCatalog, setSkillsCatalog] = useState<SkillCatalogItem[]>([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [availability, setAvailability] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Employee Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Engineering',
    job_title: '',
    years_of_experience: 3.0,
    weekly_working_hours: 40.0,
    availability_status: 'available',
    learning_interests: '',
    skills: [] as Array<{ skill_id: number; proficiency_level: number }>,
  });

  const { hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
    fetchSkillsCatalog();
  }, [department, availability]);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (department) params.department = department;
      if (availability) params.availability = availability;
      const res = await apiClient.get<Employee[]>('/employees', { params });
      setEmployees(res.data);
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

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/employees', formData);
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        department: 'Engineering',
        job_title: '',
        years_of_experience: 3.0,
        weekly_working_hours: 40.0,
        availability_status: 'available',
        learning_interests: '',
        skills: [],
      });
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create employee');
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const matchName = emp.name.toLowerCase().includes(q);
    const matchCode = emp.employee_code.toLowerCase().includes(q);
    const matchSkill = emp.skills.some((s) => s.name.toLowerCase().includes(q));
    const matchRole = emp.job_title.toLowerCase().includes(q);
    return matchName || matchCode || matchSkill || matchRole;
  });

  const departments = ['Engineering', 'Data & AI', 'Cloud & DevOps', 'Cybersecurity'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Employee Talent Directory
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Search and manage {employees.length} talent profiles, skill proficiencies, and capacity allocations.
          </p>
        </div>
        {hasRole(['admin', 'hr']) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="liquid-button-primary px-4 py-2.5 rounded-2xl text-xs font-bold text-white shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Employee</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="liquid-glass p-4 rounded-2xl border border-white/80 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, skill (e.g. Python, AWS, React), or employee code..."
            className="w-full pl-9 pr-4 py-2 bg-white/70 border border-white/90 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3.5 py-2 bg-white/70 border border-white/90 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="px-3.5 py-2 bg-white/70 border border-white/90 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer"
          >
            <option value="">All Availabilities</option>
            <option value="available">Available</option>
            <option value="partially_available">Partially Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
      </div>

      {/* Employee List Table */}
      <div className="liquid-glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-xs font-bold text-slate-500">Loading talent directory...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-16 text-center text-xs font-medium text-slate-500">
            No employees match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200/60 text-[10px]">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department & Role</th>
                  <th className="py-3 px-4">Exp</th>
                  <th className="py-3 px-4">Availability</th>
                  <th className="py-3 px-4 w-44">Workload Capacity</th>
                  <th className="py-3 px-4">Top Skills</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => navigate(`/employees/${emp.id}`)}
                    className="hover:bg-white/70 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 text-blue-700 font-extrabold text-xs flex items-center justify-center border border-blue-200/60 shadow-2xs shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {emp.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{emp.employee_code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{emp.job_title}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{emp.department}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{emp.years_of_experience} yrs</td>
                    <td className="py-3.5 px-4">
                      <AvailabilityBadge status={emp.availability_status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <ProgressBar value={emp.utilization_percent} isUtilization size="sm" />
                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                          <span>{emp.committed_hours.toFixed(0)} / {emp.weekly_working_hours.toFixed(0)}h</span>
                          <span>{emp.utilization_percent.toFixed(0)}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {emp.skills.slice(0, 3).map((s) => (
                          <span
                            key={s.skill_id}
                            className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/80 border border-slate-200/80 text-slate-700 shadow-2xs"
                          >
                            {s.name} <strong className="text-blue-600 ml-1">L{s.proficiency_level}</strong>
                          </span>
                        ))}
                        {emp.skills.length > 3 && (
                          <span className="text-[10px] text-slate-400 font-bold self-center">
                            +{emp.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 inline-block transition-transform group-hover:translate-x-0.5" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in">
          <div className="liquid-glass rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-white/80 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <h3 className="text-base font-extrabold text-slate-900">Add New Employee Profile</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl liquid-glass text-xs font-semibold text-slate-900 border border-white/90"
                  placeholder="e.g. Elena Rostova"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl liquid-glass text-xs font-semibold text-slate-900 border border-white/90"
                    placeholder="elena@talentsync.ai"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Job Title</label>
                  <input
                    type="text"
                    required
                    value={formData.job_title}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl liquid-glass text-xs font-semibold text-slate-900 border border-white/90"
                    placeholder="Senior AI Engineer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl liquid-glass text-xs font-semibold text-slate-800 border border-white/90"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Years of Experience</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.years_of_experience}
                    onChange={(e) => setFormData({ ...formData, years_of_experience: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl liquid-glass text-xs font-semibold text-slate-900 border border-white/90"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="liquid-button-secondary px-4 py-2 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="liquid-button-primary px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
