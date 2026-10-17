import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'purple';
  trend?: string;
  trendPositive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
  trendPositive,
}) => {
  const colorGradients = {
    blue: 'bg-gradient-to-tr from-blue-500/15 to-indigo-500/20 text-blue-600 border-blue-200/70 shadow-blue-500/10',
    emerald: 'bg-gradient-to-tr from-emerald-500/15 to-teal-500/20 text-emerald-600 border-emerald-200/70 shadow-emerald-500/10',
    amber: 'bg-gradient-to-tr from-amber-500/15 to-orange-500/20 text-amber-600 border-amber-200/70 shadow-amber-500/10',
    rose: 'bg-gradient-to-tr from-rose-500/15 to-pink-500/20 text-rose-600 border-rose-200/70 shadow-rose-500/10',
    indigo: 'bg-gradient-to-tr from-indigo-500/15 to-violet-500/20 text-indigo-600 border-indigo-200/70 shadow-indigo-500/10',
    purple: 'bg-gradient-to-tr from-purple-500/15 to-fuchsia-500/20 text-purple-600 border-purple-200/70 shadow-purple-500/10',
  };

  return (
    <div className="liquid-glass-card liquid-glass-interactive p-5 sm:p-6 relative overflow-hidden group">
      {/* Specular Edge Highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
      
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`p-2.5 rounded-2xl border backdrop-blur-md shadow-sm transition-transform duration-300 group-hover:scale-105 ${colorGradients[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2.5">
        <span className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono sm:font-sans">
          {value}
        </span>
        {trend && (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-xs flex items-center gap-1 ${
              trendPositive
                ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/80'
                : 'bg-rose-50/80 text-rose-700 border-rose-200/80'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${trendPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-slate-500 font-medium line-clamp-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};
