import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  isUtilization?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  showLabel = false,
  size = 'md',
  color,
  isUtilization = false,
}) => {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  let barGradient = color;
  if (!barGradient && isUtilization) {
    if (value > 100) barGradient = 'bg-gradient-to-r from-rose-500 to-red-600 shadow-rose-500/25';
    else if (value >= 70) barGradient = 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-500/25';
    else if (value >= 50) barGradient = 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-amber-500/25';
    else barGradient = 'bg-gradient-to-r from-slate-400 to-slate-500 shadow-slate-500/15';
  } else if (!barGradient) {
    barGradient = 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-500/20';
  }

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-semibold text-slate-700">
          <span className="font-mono">{value.toFixed(1)}%</span>
          {isUtilization && value > 100 && (
            <span className="text-rose-600 font-bold flex items-center gap-1 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Over Capacity
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-slate-200/70 dark:bg-slate-700/40 rounded-full overflow-hidden p-0.5 border border-slate-300/40 shadow-inner ${heightClasses[size]}`}>
        <div
          className={`${barGradient} h-full rounded-full transition-all duration-700 ease-out shadow-sm relative overflow-hidden`}
          style={{ width: `${percent}%` }}
        >
          {/* Subtle Glass Specular Glint */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
