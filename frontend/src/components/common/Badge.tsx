import React from 'react';

export const ProficiencyBadge: React.FC<{ level: number }> = ({ level }) => {
  const configs: Record<number, { label: string; style: string; dot: string }> = {
    1: { label: 'L1 Beginner', style: 'bg-slate-100/80 text-slate-700 border-slate-200/80', dot: 'bg-slate-400' },
    2: { label: 'L2 Intermediate', style: 'bg-blue-50/80 text-blue-700 border-blue-200/80', dot: 'bg-blue-500' },
    3: { label: 'L3 Advanced', style: 'bg-indigo-50/80 text-indigo-700 border-indigo-200/80', dot: 'bg-indigo-500' },
    4: { label: 'L4 Expert', style: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' },
  };

  const current = configs[level] || configs[1];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border backdrop-blur-md shadow-2xs ${current.style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
};

export const AvailabilityBadge: React.FC<{ status: string }> = ({ status }) => {
  const configs: Record<string, { label: string; dot: string; style: string }> = {
    available: {
      label: 'Available',
      dot: 'bg-emerald-500 animate-pulse',
      style: 'bg-emerald-50/80 text-emerald-800 border-emerald-200/80 shadow-emerald-500/5',
    },
    partially_available: {
      label: 'Partially Available',
      dot: 'bg-amber-500',
      style: 'bg-amber-50/80 text-amber-800 border-amber-200/80 shadow-amber-500/5',
    },
    unavailable: {
      label: 'Unavailable',
      dot: 'bg-rose-500',
      style: 'bg-rose-50/80 text-rose-800 border-rose-200/80 shadow-rose-500/5',
    },
  };

  const current = configs[status.toLowerCase()] || configs.available;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md shadow-2xs ${current.style}`}>
      <span className={`w-2 h-2 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
};

export const WorkloadBadge: React.FC<{ status: string; percentage?: number }> = ({ status, percentage }) => {
  const configs: Record<string, { label: string; dot: string; style: string }> = {
    OVERLOADED: {
      label: 'Overloaded (>100%)',
      dot: 'bg-rose-500 animate-ping',
      style: 'bg-rose-50/90 text-rose-800 border-rose-200/90 shadow-rose-500/10',
    },
    OPTIMAL: {
      label: 'Balanced (70-100%)',
      dot: 'bg-emerald-500',
      style: 'bg-emerald-50/90 text-emerald-800 border-emerald-200/90 shadow-emerald-500/10',
    },
    UNDERUTILIZED: {
      label: 'Underutilized (<70%)',
      dot: 'bg-amber-500',
      style: 'bg-amber-50/90 text-amber-800 border-amber-200/90 shadow-amber-500/10',
    },
  };

  const current = configs[status] || configs.OPTIMAL;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-2xs ${current.style}`}>
      <span className={`w-2 h-2 rounded-full ${current.dot}`} />
      {percentage !== undefined ? `${percentage}% (${status})` : current.label}
    </span>
  );
};
