import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
  onClick,
}) {
  const colorMap = {
    blue: { bg: 'bg-blue-50 text-blue-600', border: 'hover:border-blue-300' },
    indigo: { bg: 'bg-indigo-50 text-indigo-600', border: 'hover:border-indigo-300' },
    emerald: { bg: 'bg-emerald-50 text-emerald-600', border: 'hover:border-emerald-300' },
    amber: { bg: 'bg-amber-50 text-amber-600', border: 'hover:border-amber-300' },
    rose: { bg: 'bg-rose-50 text-rose-600', border: 'hover:border-rose-300' },
    purple: { bg: 'bg-purple-50 text-purple-600', border: 'hover:border-purple-300' },
    sky: { bg: 'bg-sky-50 text-sky-600', border: 'hover:border-sky-300' },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm transition-all duration-200 ${
        onClick ? `cursor-pointer ${scheme.border} hover:shadow-md` : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${scheme.bg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {value !== undefined && value !== null ? value : '--'}
        </div>
        {trend && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="mt-1 text-xs text-slate-500 font-normal">
          {subtitle}
        </div>
      )}
    </div>
  );
}
