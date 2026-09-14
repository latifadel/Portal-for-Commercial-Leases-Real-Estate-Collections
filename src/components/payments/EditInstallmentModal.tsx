import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { PaymentInstallment } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { formatSAR } from '../../utils/formatters';
import { Calendar, DollarSign, Edit3 } from 'lucide-react';

interface EditInstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: PaymentInstallment | null;
}

export const EditInstallmentModal: React.FC<EditInstallmentModalProps> = ({
  isOpen,
  onClose,
  installment,
}) => {
  const { language, t } = useLanguage();
  const { tenants, offices, updateInstallment, settings } = useData();

  const [dueDate, setDueDate] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [periodLabel, setPeriodLabel] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (installment) {
      setDueDate(installment.dueDate || '');
      setTotalAmount(installment.totalAmount || 0);
      setPeriodLabel(installment.periodLabel || '');
      setNotes(installment.notes || '');
    }
  }, [installment, isOpen]);

  if (!installment) return null;

  const tenant = tenants.find(t => t.id === installment.tenantId);
  const office = offices.find(o => o.id === installment.officeId);

  const vatRate = settings.defaultVatRate || 0.15;
  const calculatedBase = Math.round((totalAmount / (1 + vatRate)) * 100) / 100;
  const calculatedVat = Math.round((totalAmount - calculatedBase) * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueDate || totalAmount <= 0) return;

    updateInstallment(installment.id, {
      dueDate,
      totalAmount,
      baseAmount: calculatedBase,
      vatAmount: calculatedVat,
      periodLabel,
      notes,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'ar' ? 'تعديل بيانات الدفعة / الاستحقاق' : 'Adjust Payment Installment'}
      subtitle={`${installment.invoiceNumber} • ${tenant?.name || 'Tenant'} (${office?.officeNumber || 'Unit'})`}
      maxWidth="md"
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-najdi-700 dark:text-sand-300 hover:bg-cream-100 dark:hover:bg-najdi-800 rounded-xl transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-bold text-najdi-900 bg-sand-500 hover:bg-sand-600 rounded-xl transition-all shadow-sm"
          >
            {language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info card */}
        <div className="p-3.5 rounded-2xl bg-sand-100/70 dark:bg-najdi-950 border border-sand-300 dark:border-najdi-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-sand-600 dark:text-sand-400 block">{language === 'ar' ? 'المبلغ المسدد حالياً' : 'Paid to date'}:</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">{formatSAR(installment.paidAmount, language)}</span>
          </div>
          <div>
            <span className="text-sand-600 dark:text-sand-400 block">{language === 'ar' ? 'المتبقي' : 'Remaining'}:</span>
            <span className="font-bold text-najdi-900 dark:text-cream-50 text-sm">{formatSAR(Math.max(0, totalAmount - (installment.paidAmount || 0)), language)}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-najdi-800 dark:text-sand-300 mb-1">
            {language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'} *
          </label>
          <div className="relative">
            <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sand-500" />
            <input
              type="date"
              required
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-cream-300 dark:border-najdi-700 bg-cream-50 dark:bg-najdi-950 text-sm font-semibold text-najdi-900 dark:text-cream-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-najdi-800 dark:text-sand-300 mb-1">
            {language === 'ar' ? 'إجمالي قيمة الدفعة شاملة الضريبة (ر.س)' : 'Total Installment Amount incl. VAT (SAR)'} *
          </label>
          <div className="relative">
            <DollarSign className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sand-500" />
            <input
              type="number"
              min="1"
              step="0.01"
              required
              value={totalAmount || ''}
              onChange={e => setTotalAmount(Number(e.target.value))}
              className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-cream-300 dark:border-najdi-700 bg-cream-50 dark:bg-najdi-950 text-sm font-bold text-najdi-900 dark:text-cream-50"
            />
          </div>
          <p className="text-[11px] text-sand-500 mt-1">
            {language === 'ar' ? `الأساسي: ${formatSAR(calculatedBase, language)} • الضريبة 15%: ${formatSAR(calculatedVat, language)}` : `Base: ${formatSAR(calculatedBase, language)} • VAT 15%: ${formatSAR(calculatedVat, language)}`}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-najdi-800 dark:text-sand-300 mb-1">
            {language === 'ar' ? 'عنوان / مسمى الدفعة' : 'Installment Label / Description'}
          </label>
          <input
            type="text"
            value={periodLabel}
            onChange={e => setPeriodLabel(e.target.value)}
            placeholder="e.g. Q1 Payment (Jan 2026)"
            className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 dark:border-najdi-700 bg-cream-50 dark:bg-najdi-950 text-xs font-medium text-najdi-900 dark:text-cream-50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-najdi-800 dark:text-sand-300 mb-1">
            {language === 'ar' ? 'ملاحظات إضافية' : 'Notes / Adjustments'}
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Due date extended as per owner agreement"
            className="w-full px-3.5 py-2 rounded-xl border border-cream-300 dark:border-najdi-700 bg-cream-50 dark:bg-najdi-950 text-xs text-najdi-900 dark:text-cream-50"
          />
        </div>
      </form>
    </Modal>
  );
};
