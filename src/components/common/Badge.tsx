import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { getContractStatusBadge, getPaymentStatusBadge } from '../../utils/formatters';

interface BadgeProps {
  type?: 'contract' | 'payment' | 'custom';
  status?: string;
  variant?: 'emerald' | 'amber' | 'rose' | 'slate' | 'blue' | 'bronze' | 'sand' | 'clay' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  customClass?: string;
  dot?: boolean;
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  type = 'custom',
  status = '',
  variant,
  size = 'md',
  customClass = '',
  dot = true,
  children,
}) => {
  const { language } = useLanguage();

  if (variant) {
    const variantStyles: Record<string, string> = {
      emerald: 'bg-sand-100 dark:bg-najdi-800 text-najdi-800 dark:text-sand-300 border-sand-300 dark:border-najdi-700',
      amber: 'bg-bronze-50 dark:bg-bronze-950/60 text-bronze-800 dark:text-bronze-300 border-bronze-300 dark:border-bronze-800',
      bronze: 'bg-bronze-50 dark:bg-bronze-950/60 text-bronze-800 dark:text-bronze-300 border-bronze-300 dark:border-bronze-800',
      rose: 'bg-danger-50 dark:bg-danger-950/60 text-danger-700 dark:text-danger-300 border-danger-300 dark:border-danger-800',
      danger: 'bg-danger-50 dark:bg-danger-950/60 text-danger-700 dark:text-danger-300 border-danger-300 dark:border-danger-800',
      slate: 'bg-sand-100 dark:bg-najdi-800 text-najdi-700 dark:text-sand-300 border-sand-300 dark:border-najdi-700',
      sand: 'bg-sand-100 dark:bg-najdi-800 text-najdi-800 dark:text-sand-300 border-sand-300 dark:border-najdi-700',
      blue: 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border-brand-300 dark:border-brand-800',
      clay: 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border-brand-300 dark:border-brand-800',
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variantStyles[variant]} ${customClass}`}>
        {children}
      </span>
    );
  }

  if (type === 'custom') {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${customClass}`}>
        {children}
      </span>
    );
  }

  const info = type === 'contract' ? getContractStatusBadge(status) : getPaymentStatusBadge(status);
  const label = language === 'ar' ? info.labelAr : info.labelEn;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${info.bg} ${customClass}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${info.dot}`} />}
      {children || label}
    </span>
  );
};
