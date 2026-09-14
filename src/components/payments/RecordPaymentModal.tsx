import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { PaymentInstallment, PaymentTransaction } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { formatSAR, formatDate } from '../../utils/formatters';
import { calculateDaysOverdue } from '../../utils/calculations';
import { DollarSign, CheckCircle2, AlertCircle, FileUp } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: PaymentInstallment | null;
  onPaymentSuccess?: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  installment,
  onPaymentSuccess,
}) => {
  const { language, t } = useLanguage();
  const { tenants, offices, recordPayment, effectiveDate } = useData();

  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(effectiveDate);
  const [paymentMethod, setPaymentMethod] = useState<PaymentTransaction['paymentMethod']>('BANK_TRANSFER');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');

  useEffect(() => {
    if (installment) {
      setPaymentAmount(installment.remainingAmount);
      setPaymentDate(effectiveDate);
      setReferenceNumber('');
      setNotes('');
      setReceiptFileName('');
    }
  }, [installment, effectiveDate, isOpen]);

  const tenant = useMemo(() => {
    return installment ? tenants.find(t => t.id === installment.tenantId) : null;
  }, [installment, tenants]);

  const office = useMemo(() => {
    return installment ? offices.find(o => o.id === installment.officeId) : null;
  }, [installment, offices]);

  // Live calculation of remaining balance and resulting status
  const currentRemaining = installment ? installment.remainingAmount : 0;
  const newRemaining = Math.max(0, Math.round((currentRemaining - paymentAmount) * 100) / 100);
  const isFullPayment = newRemaining === 0;
  const isPartialPayment = paymentAmount > 0 && newRemaining > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!installment || paymentAmount <= 0) return;

    recordPayment({
      installmentId: installment.id,
      amount: paymentAmount,
      paymentDate,
      paymentMethod,
      referenceNumber,
      receiptAttachment: receiptFileName || undefined,
      notes,
    });

    onPaymentSuccess?.();
    onClose();
  };

  const handleSimulateReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFileName(e.target.files[0].name);
    }
  };

  if (!installment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('record_payment')}
      subtitle={`Invoice: ${installment.invoiceNumber} • ${installment.periodLabel}`}
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
            Confirm & Save Payment
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Invoice Summary Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400">Tenant:</span>
              <p className="font-bold text-slate-900 dark:text-white">
                {tenant ? (language === 'ar' && tenant.nameAr ? tenant.nameAr : tenant.name) : 'N/A'}
              </p>
            </div>
            <div className="text-end">
              <span className="text-slate-400">Unit:</span>
              <p className="font-bold text-slate-900 dark:text-white">{office?.officeNumber}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
            <div>
              <span className="text-slate-400">Total Invoice:</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {formatSAR(installment.totalAmount, language)}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Already Paid:</span>
              <p className="font-semibold text-sand-800 dark:text-sand-300">
                {formatSAR(installment.paidAmount, language)}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Current Due:</span>
              <p className="font-bold text-rose-600">
                {formatSAR(installment.remainingAmount, language)}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Amount Input & Partial Payment Calculator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Amount Received (SAR) *
            </label>
            <button
              type="button"
              onClick={() => setPaymentAmount(installment.remainingAmount)}
              className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Pay Full Remaining ({formatSAR(installment.remainingAmount, language)})
            </button>
          </div>

          <div className="relative">
            <input
              type="number"
              step={10}
              min={1}
              max={installment.remainingAmount}
              value={paymentAmount || ''}
              onChange={e => setPaymentAmount(Number(e.target.value))}
              className="w-full ps-4 pe-16 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-base font-extrabold bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              required
            />
            <span className="absolute end-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              SAR
            </span>
          </div>

          {/* Dynamic Result Indicator */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs">
            <span className="text-slate-600 dark:text-slate-300">
              Remaining Balance after this payment:
            </span>
            <span className="font-extrabold text-slate-900 dark:text-white">
              {formatSAR(newRemaining, language)}
            </span>
          </div>

          {isPartialPayment && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                This will be recorded as a <strong>Partial Payment</strong>. Remaining balance of {formatSAR(newRemaining, language)} will remain outstanding.
              </span>
            </div>
          )}

          {isFullPayment && (
            <div className="p-2.5 rounded-xl bg-sand-100/80 dark:bg-najdi-850 border border-sand-300 dark:border-najdi-700 text-[11px] text-najdi-800 dark:text-sand-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-sand-600" />
              <span>
                This will mark invoice <strong>{installment.invoiceNumber}</strong> as <strong>Fully Paid</strong>.
              </span>
            </div>
          )}
        </div>

        {/* Payment Date & Method */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Receipt Date *
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('payment_method')} *
            </label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentTransaction['paymentMethod'])}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 font-semibold"
            >
              <option value="BANK_TRANSFER">Bank Wire Transfer (تحويل بنكي)</option>
              <option value="SADAD">SADAD Payment (نظام سداد)</option>
              <option value="CHEQUE">Bank Cheque (شيك مصرفي)</option>
              <option value="CREDIT_CARD">Credit / Mada Card (بطاقة مدى/ائتمان)</option>
              <option value="CASH">Cash Deposit (نقدي)</option>
            </select>
          </div>
        </div>

        {/* Reference Number & Proof Upload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bank / Transaction Reference #
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={e => setReferenceNumber(e.target.value)}
              placeholder="e.g. SNB-TRX-982145 or Cheque #1029"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Voucher / Slip
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs">
              <FileUp className="h-4 w-4 text-slate-400 shrink-0" />
              <div className="flex-1 truncate">
                {receiptFileName ? (
                  <span className="font-semibold text-sand-800 dark:text-sand-300 truncate">{receiptFileName}</span>
                ) : (
                  <label className="cursor-pointer text-brand-600 hover:underline">
                    <span>Upload Transfer Slip</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleSimulateReceiptUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Payment Notes
          </label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Cleared via corporate account at Al Rajhi Bank..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
          />
        </div>
      </form>
    </Modal>
  );
};
