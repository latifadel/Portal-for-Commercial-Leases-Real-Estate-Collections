import { format, parseISO } from 'date-fns';
import { enUS, arSA } from 'date-fns/locale';

/**
 * Format SAR Currency
 * Formats numbers into clean Saudi Riyals (e.g. "SAR 125,000.00" or "١٢٥,٠٠٠.٠٠ ر.س")
 */
export function formatSAR(amount: number | undefined | null, locale: 'en' | 'ar' = 'en', includeSymbol = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return includeSymbol ? (locale === 'ar' ? '٠٫٠٠ ر.س' : 'SAR 0.00') : '0.00';
  }

  const formattedNum = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  if (!includeSymbol) {
    return formattedNum;
  }

  if (locale === 'ar') {
    return `${formattedNum} ر.س`;
  }
  return `SAR ${formattedNum}`;
}

/**
 * Format Date (Gregorian)
 */
export function formatDate(
  dateStr: string | undefined | null,
  formatPattern: string = 'dd MMM yyyy',
  locale: 'en' | 'ar' = 'en'
): string {
  if (!dateStr) return '-';
  try {
    const date = parseISO(dateStr);
    return format(date, formatPattern, {
      locale: locale === 'ar' ? arSA : enUS,
    });
  } catch (e) {
    return dateStr;
  }
}

/**
 * Format Saudi Phone Number (+966 5X XXX XXXX)
 */
export function formatSaudiPhone(phone: string): string {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('9665') && cleaned.length === 12) {
    return `+966 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  if (cleaned.startsWith('05') && cleaned.length === 10) {
    return `05 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Format Commercial Registration Number (10 digits)
 */
export function formatCRNumber(cr: string): string {
  if (!cr) return '-';
  const clean = cr.replace(/\D/g, '');
  if (clean.length === 10) {
    return `${clean.slice(0, 4)}-${clean.slice(4, 7)}-${clean.slice(7)}`;
  }
  return cr;
}

/**
 * Format VAT Number (15 digits ZATCA)
 */
export function formatVATNumber(vat: string): string {
  if (!vat) return '-';
  const clean = vat.replace(/\D/g, '');
  if (clean.length === 15) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 7)} ${clean.slice(7, 11)} ${clean.slice(11, 15)}`;
  }
  return vat;
}

/**
 * Format Payment Frequency with bilingual labels
 */
export function formatPaymentFrequency(frequency: string | undefined, locale: 'en' | 'ar' = 'en'): string {
  switch (frequency) {
    case 'MONTHLY':
      return locale === 'ar' ? 'شهري' : 'Monthly';
    case 'QUARTERLY':
      return locale === 'ar' ? 'ربع سنوي' : 'Quarterly';
    case 'SEMI_ANNUAL':
      return locale === 'ar' ? 'نصف سنوي' : 'Semi-Annual';
    case 'ANNUAL':
      return locale === 'ar' ? 'سنوي' : 'Annual';
    case 'ONE_TIME':
      return locale === 'ar' ? 'دفعة واحدة (كامل العقد)' : 'One-Time / Full';
    case 'CUSTOM':
      return locale === 'ar' ? 'مخصص' : 'Custom';
    default:
      return frequency || '-';
  }
}

/**
 * Status color and label helpers
 */
export function getContractStatusBadge(status: string) {
  switch (status) {
    case 'ACTIVE':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
        labelEn: 'Active',
        labelAr: 'نشط',
      };
    case 'EXPIRING_SOON':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500 animate-pulse',
        labelEn: 'Expiring Soon',
        labelAr: 'ينتهي قريباً',
      };
    case 'EXPIRED':
      return {
        bg: 'bg-danger-50 dark:bg-danger-950/40 text-danger-700 dark:text-danger-400 border-danger-200 dark:border-danger-800',
        dot: 'bg-danger-500',
        labelEn: 'Expired',
        labelAr: 'منتهي',
      };
    case 'UPCOMING':
      return {
        bg: 'bg-sand-100 dark:bg-najdi-800 text-najdi-700 dark:text-sand-300 border-sand-300 dark:border-najdi-700',
        dot: 'bg-sand-500',
        labelEn: 'Upcoming',
        labelAr: 'قادم',
      };
    case 'RENEWED':
      return {
        bg: 'bg-bronze-100 dark:bg-bronze-950/40 text-bronze-800 dark:text-bronze-300 border-bronze-300 dark:border-bronze-800',
        dot: 'bg-bronze-500',
        labelEn: 'Renewed',
        labelAr: 'مجدد',
      };
    case 'CANCELLED':
      return {
        bg: 'bg-sand-100 dark:bg-najdi-900 text-sand-600 dark:text-sand-400 border-sand-200 dark:border-najdi-800',
        dot: 'bg-sand-400',
        labelEn: 'Cancelled',
        labelAr: 'ملغي',
      };
    default:
      return {
        bg: 'bg-sand-50 text-sand-600 border-sand-200',
        dot: 'bg-sand-400',
        labelEn: status,
        labelAr: status,
      };
  }
}

export function getPaymentStatusBadge(status: string) {
  switch (status) {
    case 'PAID':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
        labelEn: 'Paid',
        labelAr: 'مدفوع',
      };
    case 'PARTIALLY_PAID':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
        labelEn: 'Partially Paid',
        labelAr: 'مدفوع جزئياً',
      };
    case 'DUE':
    case 'DUE_SOON':
      return {
        bg: 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800',
        dot: 'bg-brand-500',
        labelEn: 'Due Soon',
        labelAr: 'مستحق قريباً',
      };
    case 'OVERDUE':
      return {
        bg: 'bg-danger-50 dark:bg-danger-950/40 text-danger-700 dark:text-danger-400 border-danger-200 dark:border-danger-800',
        dot: 'bg-danger-500 animate-ping',
        labelEn: 'Overdue',
        labelAr: 'متأخر',
      };
    case 'UPCOMING':
      return {
        bg: 'bg-sand-100 dark:bg-najdi-800/80 text-sand-700 dark:text-sand-300 border-sand-300 dark:border-najdi-700',
        dot: 'bg-sand-400',
        labelEn: 'Upcoming',
        labelAr: 'مستقبلي',
      };
    default:
      return {
        bg: 'bg-sand-100 text-sand-600 border-sand-200',
        dot: 'bg-sand-400',
        labelEn: status,
        labelAr: status,
      };
  }
}
