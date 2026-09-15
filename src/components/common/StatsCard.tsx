import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
    label?: string;
  };
  colorScheme?: 'emerald' | 'clay' | 'bronze' | 'sand' | 'rose';
  onClick?: () => void;
  badge?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'clay',
  onClick,
  badge,
}) => {
  const colorMap = {
    emerald: {
      accent: 'bg-emerald-500',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-900',
      value: 'text-emerald-700 dark:text-emerald-400',
      border: 'hover:border-emerald-300 dark:hover:border-emerald-800',
      badge: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900',
    },
    clay: {
      accent: 'bg-brand-500',
      iconBg: 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 ring-1 ring-brand-200 dark:ring-brand-900',
      value: 'text-najdi-900 dark:text-cream-50',
      border: 'hover:border-brand-300 dark:hover:border-brand-800',
      badge: 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-900',
    },
    bronze: {
      accent: 'bg-bronze-500',
      iconBg: 'bg-bronze-50 dark:bg-bronze-950/40 text-bronze-600 dark:text-bronze-400 ring-1 ring-bronze-200 dark:ring-bronze-900',
      value: 'text-najdi-900 dark:text-cream-50',
      border: 'hover:border-bronze-300 dark:hover:border-bronze-800',
      badge: 'bg-bronze-50 dark:bg-bronze-950 text-bronze-700 dark:text-bronze-300 border border-bronze-200 dark:border-bronze-900',
    },
    sand: {
      accent: 'bg-sand-500',
      iconBg: 'bg-sand-100 dark:bg-najdi-800 text-najdi-800 dark:text-sand-300 ring-1 ring-sand-300 dark:ring-najdi-700',
      value: 'text-najdi-900 dark:text-cream-50',
      border: 'hover:border-sand-400 dark:hover:border-najdi-700',
      badge: 'bg-sand-100 dark:bg-najdi-800 text-najdi-800 dark:text-sand-300 border border-sand-300 dark:border-najdi-700',
    },
    rose: {
      accent: 'bg-danger-600',
      iconBg: 'bg-danger-50 dark:bg-danger-950/40 text-danger-600 dark:text-danger-400 ring-1 ring-danger-200 dark:ring-danger-900',
      value: 'text-danger-700 dark:text-danger-400',
      border: 'hover:border-danger-300 dark:hover:border-danger-800',
      badge: 'bg-danger-50 dark:bg-danger-950 text-danger-700 dark:text-danger-300 border border-danger-200 dark:border-danger-900',
    },
  };

  const theme = colorMap[colorScheme] || colorMap.clay;

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-cream-300 dark:border-najdi-800 bg-white dark:bg-najdi-900 shadow-xs transition-all duration-200 ${
        onClick
          ? `cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ${theme.border}`
          : ''
      }`}
    >
      {/* Left accent stripe */}
      <div className={`absolute top-0 start-0 bottom-0 w-1 rounded-s-2xl ${theme.accent} opacity-80`} />

      {/* Top shimmer line */}
      <div className="absolute top-0 start-1 end-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/10 pointer-events-none" />

      <div className="p-5 ps-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-sand-500 dark:text-sand-400 truncate">
              {title}
            </p>
            <p className={`text-2xl sm:text-3xl font-black tracking-tight font-serif leading-none ${theme.value}`}>
              {value}
            </p>
          </div>
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${theme.iconBg}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>

        {(subtitle || trend || badge) && (
          <div className="mt-3.5 flex items-center justify-between gap-2 pt-3 border-t border-cream-200 dark:border-najdi-800/60 text-xs">
            {subtitle && (
              <span className="text-sand-500 dark:text-sand-400 truncate leading-relaxed">
                {subtitle}
              </span>
            )}
            {badge && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${theme.badge}`}>
                {badge}
              </span>
            )}
            {trend && (
              <span
                className={`font-bold shrink-0 ${
                  trend.isPositive
                    ? 'text-najdi-700 dark:text-sand-300'
                    : 'text-danger-600 dark:text-danger-400'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value} {trend.label}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
