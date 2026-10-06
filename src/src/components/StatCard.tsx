import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accent?: 'cyan' | 'teal' | 'red' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accent = 'cyan',
}) => {
  const accentGlow = {
    cyan: 'border-slate-800/80 hover:border-cyan-500/50 hover:shadow-cyan-500/10',
    teal: 'border-slate-800/80 hover:border-teal-500/50 hover:shadow-teal-500/10',
    red: 'border-slate-800/80 hover:border-red-500/50 hover:shadow-red-500/10',
    purple: 'border-slate-800/80 hover:border-purple-500/50 hover:shadow-purple-500/10',
  };

  const iconAccent = {
    cyan: 'bg-cyan-950/40 text-cyan-400 border-cyan-800/50',
    teal: 'bg-teal-950/40 text-teal-400 border-teal-800/50',
    red: 'bg-red-950/40 text-red-400 border-red-800/50',
    purple: 'bg-purple-950/40 text-purple-400 border-purple-800/50',
  };

  return (
    <div
      className={`relative bg-[#090f1d]/75 backdrop-blur-md border rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${accentGlow[accent]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {icon && (
          <div className={`p-2 rounded-xl border ${iconAccent[accent]}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-2xl font-bold text-slate-100 tracking-tight">
          {value}
        </h3>
        {(subtitle || trend) && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            {trend && (
              <span
                className={`font-semibold ${
                  trend.isPositive ? 'text-teal-400' : 'text-rose-400'
                }`}
              >
                {trend.value}
              </span>
            )}
            {subtitle && <span className="text-slate-400">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

