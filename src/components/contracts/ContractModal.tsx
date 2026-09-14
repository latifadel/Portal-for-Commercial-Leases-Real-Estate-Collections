import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { PaymentFrequency } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { calculateVAT, calculateTotalWithVAT } from '../../utils/calculations';
import { formatSAR } from '../../utils/formatters';
import { differenceInMonths, parseISO, addMonths, format } from 'date-fns';
import { Clock, Calculator, CalendarCheck } from 'lucide-react';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedOfficeId?: string;
  preselectedTenantId?: string;
}

export const ContractModal: React.FC<ContractModalProps> = ({
  isOpen,
  onClose,
  preselectedOfficeId,
  preselectedTenantId,
}) => {
  const { language, t } = useLanguage();
  const { tenants, offices, settings, addContract } = useData();

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const nextYearStr = format(addMonths(new Date(), 12), 'yyyy-MM-dd');

  const [tenantId, setTenantId] = useState(preselectedTenantId || '');
  const [officeId, setOfficeId] = useState(preselectedOfficeId || '');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(nextYearStr);
  const [durationMonths, setDurationMonths] = useState(12);
  const [annualRent, setAnnualRent] = useState<number>(100000);
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>('SEMI_ANNUAL');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-update duration when start/end dates change
  useEffect(() => {
    try {
      if (startDate && endDate) {
        const s = parseISO(startDate);
        const e = parseISO(endDate);
        const months = Math.max(1, differenceInMonths(e, s));
        setDurationMonths(months);
      }
    } catch {
      // ignore
    }
  }, [startDate, endDate]);

  // Set default annual rent when office is selected
  useEffect(() => {
    if (officeId) {
      const off = offices.find(o => o.id === officeId);
      if (off && off.annualRent > 0) setAnnualRent(off.annualRent);
    }
  }, [officeId, offices]);

  useEffect(() => {
    if (preselectedOfficeId) setOfficeId(preselectedOfficeId);
    if (preselectedTenantId) setTenantId(preselectedTenantId);
  }, [preselectedOfficeId, preselectedTenantId, isOpen]);

  // Financial calculations based on Annual Rent & Duration
  const vatRate = settings.defaultVatRate || 0.15;
  const durationYears = durationMonths / 12;
  const totalContractBaseRent = useMemo(() => {
    return Math.round((annualRent * durationYears) * 100) / 100;
  }, [annualRent, durationYears]);

  const vatAmount = useMemo(() => calculateVAT(totalContractBaseRent, vatRate), [totalContractBaseRent, vatRate]);
  const totalRent = useMemo(() => calculateTotalWithVAT(totalContractBaseRent, vatRate), [totalContractBaseRent, vatRate]);

  // Installment schedule preview
  const installmentPreview = useMemo(() => {
    let intervals = 1;
    if (paymentFrequency === 'MONTHLY') intervals = Math.max(1, durationMonths);
    else if (paymentFrequency === 'QUARTERLY') intervals = Math.max(1, Math.ceil(durationMonths / 3));
    else if (paymentFrequency === 'SEMI_ANNUAL') intervals = Math.max(1, Math.ceil(durationMonths / 6));
    else if (paymentFrequency === 'ANNUAL') intervals = Math.max(1, Math.ceil(durationMonths / 12));
    else if (paymentFrequency === 'ONE_TIME') intervals = 1;

    const basePerInstallment = Math.round((totalContractBaseRent / intervals) * 100) / 100;
    const vatPerInstallment = Math.round((vatAmount / intervals) * 100) / 100;
    const totalPerInstallment = Math.round((totalRent / intervals) * 100) / 100;

    return {
      intervals,
      basePerInstallment,
      vatPerInstallment,
      totalPerInstallment,
    };
  }, [totalContractBaseRent, vatAmount, totalRent, durationMonths, paymentFrequency]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!tenantId) errs.tenantId = language === 'ar' ? 'يرجى اختيار المستأجر' : 'Please select a tenant';
    if (!officeId) errs.officeId = language === 'ar' ? 'يرجى اختيار الوحدة / المكتب' : 'Please select an office unit';
    if (!startDate) errs.startDate = language === 'ar' ? 'تاريخ البداية مطلوب' : 'Start date is required';
    if (!endDate) errs.endDate = language === 'ar' ? 'تاريخ النهاية مطلوب' : 'End date is required';
    if (annualRent <= 0) errs.annualRent = language === 'ar' ? 'قيمة الإيجار السنوي يجب أن تكون أكبر من 0' : 'Annual rent must be greater than 0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    addContract({
      tenantId,
      officeId,
      startDate,
      endDate,
      durationMonths,
      annualRent,
      baseRent: totalContractBaseRent,
      vatRate,
      paymentFrequency,
      notes,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'ar' ? 'إنشاء عقد إيجار جديد' : 'New Commercial Lease Contract'}
      subtitle={language === 'ar' ? 'ربط المستأجر بالوحدة وتحديد الإيجار السنوي والمدة والدفعات' : 'Link tenant to office unit, set annual rent, lease duration, and schedule payments'}
      maxWidth="2xl"
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-semibold text-najdi-900 bg-sand-500 hover:bg-sand-600 rounded-xl transition-colors shadow-sm"
          >
            {language === 'ar' ? 'إنشاء العقد وتوليد الدفعات' : 'Create Contract & Payments'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tenant and Office Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'ar' ? 'المستأجر' : 'Select Tenant'} *
            </label>
            <select
              value={tenantId}
              onChange={e => setTenantId(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-800 ${
                errors.tenantId ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <option value="">{language === 'ar' ? '-- اختر المستأجر --' : '-- Select Tenant --'}</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {errors.tenantId && <p className="text-[11px] text-rose-500 mt-1">{errors.tenantId}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'ar' ? 'الوحدة / المكتب' : 'Office / Unit'} *
            </label>
            <select
              value={officeId}
              onChange={e => setOfficeId(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-800 ${
                errors.officeId ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <option value="">{language === 'ar' ? '-- اختر الوحدة --' : '-- Select Unit --'}</option>
              {offices.map(o => (
                <option key={o.id} value={o.id}>
                  {o.officeNumber} {o.floor ? `(Floor ${o.floor})` : ''} - {o.status === 'OCCUPIED' ? (language === 'ar' ? 'مشغول' : 'Occupied') : (language === 'ar' ? 'شاغر' : 'Vacant')}
                </option>
              ))}
            </select>
            {errors.officeId && <p className="text-[11px] text-rose-500 mt-1">{errors.officeId}</p>}
          </div>
        </div>

        {/* Start Date & End Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'ar' ? 'تاريخ بداية العقد' : 'Contract Start Date'} *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'ar' ? 'تاريخ نهاية العقد' : 'Contract End Date'} *
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800"
            />
          </div>
        </div>

        {/* Duration Display Box */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Clock className="h-4 w-4 text-brand-600" />
            <span className="text-xs font-semibold">{language === 'ar' ? 'مدة العقد المحسوبة:' : 'Calculated Duration:'}</span>
          </div>
          <div className="text-end">
            <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
              {durationMonths} {language === 'ar' ? 'أشهر' : 'Months'}
            </span>
            {durationMonths >= 12 && (
              <span className="text-xs text-sand-500 ms-1.5 font-medium">
                ({(durationMonths / 12).toFixed(1).replace('.0', '')} {language === 'ar' ? 'سنوات' : 'Years'})
              </span>
            )}
          </div>
        </div>

        {/* Financial: Annual Rent & Frequency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'ar' ? 'قيمة الإيجار السنوي (ر.س / سنة)' : 'Annual Base Rent (SAR / Year)'} *
            </label>
            <input
              type="number"
              min="1"
              value={annualRent || ''}
              onChange={e => setAnnualRent(Number(e.target.value))}
              placeholder="e.g. 10000000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 font-semibold"
            />
            {errors.annualRent && <p className="text-[11px] text-rose-500 mt-1">{errors.annualRent}</p>}
            <p className="text-[11px] text-sand-500 mt-1">
              {language === 'ar'
                ? 'أدخل الإيجار السنوي، وسيتم احتساب إجمالي العقد والدفعات تلقائياً'
                : 'Enter annual rent; total contract and installments are calculated automatically'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'ar' ? 'دورية الدفع' : 'Payment Frequency'}
            </label>
            <select
              value={paymentFrequency}
              onChange={e => setPaymentFrequency(e.target.value as PaymentFrequency)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 font-medium"
            >
              <option value="SEMI_ANNUAL">{language === 'ar' ? 'نصف سنوي (دفعتان في السنة)' : 'Semi-Annual (2 Payments / Year)'}</option>
              <option value="ANNUAL">{language === 'ar' ? 'سنوي (دفعة واحدة كل سنة)' : 'Annual (1 Payment / Year)'}</option>
              <option value="QUARTERLY">{language === 'ar' ? 'ربع سنوي (4 دفعات في السنة)' : 'Quarterly (4 Payments / Year)'}</option>
              <option value="MONTHLY">{language === 'ar' ? 'شهري (دفعات شهرية)' : 'Monthly (Monthly Payments)'}</option>
              <option value="ONE_TIME">{language === 'ar' ? 'دفعة واحدة (كامل قيمة العقد مقدمة)' : 'One-Time / Full Contract Upfront'}</option>
              <option value="CUSTOM">{language === 'ar' ? 'مخصص' : 'Custom'}</option>
            </select>
          </div>
        </div>

        {/* Financial Summary Calculation Banner */}
        <div className="p-4 rounded-2xl bg-sand-100/70 dark:bg-najdi-900 border border-sand-300 dark:border-najdi-700 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-sand-600 dark:text-sand-400 block">{language === 'ar' ? 'الإيجار السنوي:' : 'Annual Rent:'}</span>
              <span className="font-bold text-najdi-900 dark:text-white text-sm">{formatSAR(annualRent, language)}</span>
            </div>
            <div>
              <span className="text-sand-600 dark:text-sand-400 block">
                {language === 'ar' ? 'إجمالي العقد الأساسي:' : 'Total Contract Base:'}
              </span>
              <span className="font-bold text-najdi-900 dark:text-white text-sm">{formatSAR(totalContractBaseRent, language)}</span>
            </div>
            <div>
              <span className="text-sand-600 dark:text-sand-400 block">VAT (15%):</span>
              <span className="font-bold text-sand-800 dark:text-sand-300 text-sm">{formatSAR(vatAmount, language)}</span>
            </div>
            <div>
              <span className="text-sand-600 dark:text-sand-400 block">{language === 'ar' ? 'الإجمالي شامل الضريبة:' : 'Total Incl. VAT:'}</span>
              <span className="font-bold text-brand-700 dark:text-brand-300 text-base">{formatSAR(totalRent, language)}</span>
            </div>
          </div>

          {/* Installment Breakdown Highlight */}
          <div className="pt-2.5 border-t border-sand-200 dark:border-najdi-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-sand-700 dark:text-sand-300 font-medium">
              <CalendarCheck className="h-4 w-4 text-brand-600" />
              <span>
                {language === 'ar'
                  ? `قيمة الدفعة (${installmentPreview.intervals} دفعة):`
                  : `Per Installment (${installmentPreview.intervals} payments):`}
              </span>
            </div>
            <div className="text-end">
              <span className="font-bold text-brand-700 dark:text-sand-300 text-sm">
                {formatSAR(installmentPreview.totalPerInstallment, language)}
              </span>
              <span className="text-[11px] text-sand-500 ms-1">
                ({language === 'ar' ? 'شامل الضريبة' : 'incl. VAT'})
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {language === 'ar' ? 'ملاحظات العقد' : 'Contract Notes'}
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={language === 'ar' ? 'أي شروط أو ملاحظات خاصة...' : 'Any special terms or conditions...'}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800"
          />
        </div>
      </form>
    </Modal>
  );
};

