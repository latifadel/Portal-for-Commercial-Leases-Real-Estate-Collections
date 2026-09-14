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
    // Desert Sand (replaces green for positive/paid/active)
    emerald: {
      bg: 'bg-sand-200/60 text-najdi-800 dark:text-sand-300',
      border: 'hover:border-sand-400 dark:hover:border-najdi-700',
      badge: 'bg-sand-200 dark:bg-najdi-800 text-najdi-800 dark:text-sand-300',
    },
    // Terracotta / Copper / Clay
    clay: {
      bg: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
      border: 'hover:border-brand-300 dark:hover:border-brand-800',
      badge: 'bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300',
    },
    // Muted Gold / Bronze
    bronze: {
      bg: 'bg-bronze-500/15 text-bronze-600 dark:text-bronze-400',
      border: 'hover:border-bronze-300 dark:hover:border-bronze-800',
      badge: 'bg-bronze-100 dark:bg-bronze-950 text-bronze-800 dark:text-bronze-300',
    },
    // Warm Desert Sand
    sand: {
      bg: 'bg-sand-200/60 text-najdi-800 dark:text-sand-300',
      border: 'hover:border-sand-400 dark:hover:border-najdi-700',
      badge: 'bg-sand-200 dark:bg-najdi-800 text-najdi-800 dark:text-sand-300',
    },
    // Red ONLY for warnings / overdue
    rose: {
      bg: 'bg-danger-50 text-danger-600 dark:bg-danger-950/40 dark:text-danger-400',
      border: 'hover:border-danger-300 dark:hover:border-danger-800',
      badge: 'bg-danger-100 dark:bg-danger-950 text-danger-700 dark:text-danger-300',
    },
  };

  const currentTheme = colorMap[colorScheme] || colorMap.clay;

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-cream-300 dark:border-najdi-800 bg-white dark:bg-najdi-900 p-5 shadow-xs transition-all duration-200 ${
        onClick ? `cursor-pointer hover:shadow-md ${currentTheme.border}` : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-sand-500 dark:text-sand-400">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight text-najdi-900 dark:text-cream-50">
            {value}
          </p>
        </div>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${currentTheme.bg}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {(subtitle || trend || badge) && (
        <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-cream-200 dark:border-najdi-800/80 text-xs">
          {subtitle && (
            <span className="text-sand-500 dark:text-sand-400 truncate">
              {subtitle}
            </span>
          )}
          {badge && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${currentTheme.badge}`}>
              {badge}
            </span>
          )}
          {trend && (
            <span
              className={`font-semibold ${
                trend.isPositive
                  ? 'text-najdi-700 dark:text-sand-300 font-bold'
                  : 'text-danger-600 dark:text-danger-400'
              }`}
            >
              {trend.isPositive ? '+' : ''}{trend.value} {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
