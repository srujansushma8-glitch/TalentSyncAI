import React from 'react';
import {
  FileSpreadsheet,
  Download,
  Users,
  Briefcase,
  Scale,
  BarChart3,
  CheckCircle2,
  FileDown,
} from 'lucide-react';

export const Reports: React.FC = () => {
  const reports = [
    {
      title: 'Employee Skills Inventory',
      description: 'Comprehensive roster of all 22 employees with department, experience, proficiency scores, and capacity limits.',
      filename: 'employees_skills_inventory.csv',
      endpoint: 'http://localhost:8000/api/reports/employees.csv',
      icon: Users,
      badge: 'Workforce Roster',
      color: 'blue',
    },
    {
      title: 'Project Staffing & Requirements',
      description: 'All 5 active projects detailing team targets, assigned headcounts, hours, and mandatory/optional skill criteria.',
      filename: 'project_staffing_report.csv',
      endpoint: 'http://localhost:8000/api/reports/projects.csv',
      icon: Briefcase,
      badge: 'Portfolio Health',
      color: 'indigo',
    },
    {
      title: 'Workload & Capacity Distribution',
      description: 'Granular capacity telemetry detailing committed hours, utilization percentages, and overload alerts.',
      filename: 'workload_capacity_report.csv',
      endpoint: 'http://localhost:8000/api/reports/workload.csv',
      icon: Scale,
      badge: 'Capacity Audit',
      color: 'purple',
    },
    {
      title: 'Organization Skill Gaps Matrix',
      description: 'Supply vs demand deficit matrix identifying critical skill shortages and required training pathways.',
      filename: 'org_skill_gaps_report.csv',
      endpoint: 'http://localhost:8000/api/reports/skill-gaps.csv',
      icon: BarChart3,
      badge: 'Skill Intelligence',
      color: 'rose',
    },
  ];

  const handleDownload = (endpoint: string, filename: string) => {
    const token = localStorage.getItem('talentsync_token');
    fetch(endpoint, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch((err) => alert('Export failed'));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 shadow-glass border border-white/60 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-500/20 via-indigo-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center text-blue-500 shadow-sm backdrop-blur-md">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Executive Reports & Data Exports
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Live Data Feeds
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Download real, audit-ready CSV exports containing complete current database snapshots.
            </p>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reports.map((rep, idx) => {
          const Icon = rep.icon;
          return (
            <div
              key={idx}
              className="liquid-glass-card rounded-3xl p-6 shadow-glass border border-white/60 dark:border-white/10 hover:shadow-glass-lg transition-all duration-200 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-200/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-white/40 dark:border-white/5">
                    {rep.badge}
                  </span>
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-base">{rep.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{rep.description}</p>
                <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100/50 dark:bg-slate-900/50 px-2.5 py-1 rounded-lg border border-slate-200/50 dark:border-slate-800/50 w-fit">
                  {rep.filename}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                <button
                  onClick={() => handleDownload(rep.endpoint, rep.filename)}
                  className="w-full liquid-button-primary py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download Live CSV Snapshot</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
