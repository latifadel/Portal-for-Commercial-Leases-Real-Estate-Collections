import React from 'react';
import { Printer, X, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PaymentInstallment, Tenant, Office } from '../../types';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatSAR, formatDate, formatCRNumber, formatVATNumber } from '../../utils/formatters';

interface ReceiptVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: PaymentInstallment | null;
}

export const ReceiptVoucherModal: React.FC<ReceiptVoucherModalProps> = ({
  isOpen,
  onClose,
  installment,
}) => {
  const { settings, tenants, offices } = useData();
  const { language, t } = useLanguage();

  if (!isOpen || !installment) return null;

  const tenant = tenants.find(t => t.id === installment.tenantId);
  const office = offices.find(o => o.id === installment.officeId);
  const lastTx = installment.transactions && installment.transactions.length > 0
    ? installment.transactions[installment.transactions.length - 1]
    : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-scaleUp print:m-0 print:p-0 print:border-none print:shadow-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-sand-50 border-b border-sand-200 print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-najdi-800">
            <CheckCircle2 className="h-4 w-4 text-sand-600" />
            <span>Official Rent Receipt Voucher (سند قبض إيجار)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sand-500 hover:bg-sand-600 text-najdi-900 font-semibold text-xs transition-colors shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Voucher</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-sand-500 hover:bg-sand-200 text-xs"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Document */}
        <div className="p-8 space-y-6 text-xs bg-white text-najdi-900">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-brand-700 pb-4">
            <div>
              <h2 className="text-lg font-black text-brand-900 uppercase tracking-tight">
                {settings.buildingName}
              </h2>
              <p className="text-xs font-bold text-najdi-700 font-arabic">{settings.buildingNameAr}</p>
              <p className="text-[11px] text-sand-600 mt-1">{settings.buildingAddress}</p>
              <div className="text-[11px] text-sand-700 mt-0.5 space-x-2">
                <span>CR: {formatCRNumber(settings.crNumber)}</span>
                <span>•</span>
                <span>VAT ID: {formatVATNumber(settings.vatNumber)}</span>
              </div>
            </div>

            <div className="text-end">
              <span className="inline-block px-3 py-1 rounded-md bg-sand-100 text-najdi-900 border border-sand-300 font-black text-sm uppercase tracking-wider">
                RECEIPT VOUCHER
              </span>
              <p className="text-[11px] text-sand-600 font-arabic mt-0.5 font-bold">سند قبض مالي</p>
              <p className="text-xs font-bold text-najdi-800 mt-2">
                Voucher #: {installment.invoiceNumber}
              </p>
              <p className="text-[11px] text-sand-600">
                Date: {formatDate(lastTx?.paymentDate || installment.paymentDate, 'dd MMM yyyy')}
              </p>
            </div>
          </div>

          {/* Received From (Tenant Details) */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-sand-50/60 border border-sand-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-sand-500">Received From (المستأجر):</span>
              <p className="text-sm font-bold text-najdi-900 mt-0.5">{tenant?.name}</p>
              <p className="text-[11px] text-najdi-700 font-arabic">{tenant?.nameAr}</p>
              <p className="text-[11px] text-sand-600 mt-1">CR: {formatCRNumber(tenant?.crNumber || '')} | VAT: {formatVATNumber(tenant?.vatNumber || '')}</p>
            </div>

            <div className="text-end">
              <span className="text-[10px] uppercase font-bold text-sand-500">Leased Unit (الوحدة):</span>
              <p className="text-sm font-bold text-najdi-900 mt-0.5">{office?.officeNumber}</p>
              <p className="text-[11px] text-sand-600">Contract Ref: {installment.contractId}</p>
              <p className="text-[11px] text-sand-600">Period: {installment.periodLabel}</p>
            </div>
          </div>

          {/* Amount Paid Box */}
          <div className="p-4 rounded-xl bg-sand-100/70 border border-sand-300 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-najdi-900 uppercase">Amount Received (المبلغ المستلم):</span>
              <p className="text-xs text-sand-700 mt-0.5">
                Payment Method: {lastTx?.paymentMethod || installment.paymentMethod || 'Bank Transfer'}
                {lastTx?.referenceNumber ? ` (Ref: ${lastTx.referenceNumber})` : ''}
              </p>
            </div>
            <div className="text-end">
              <span className="text-2xl font-black text-najdi-900">
                {formatSAR(lastTx?.amount || installment.paidAmount, language)}
              </span>
            </div>
          </div>

          {/* Breakdown Table */}
          <table className="w-full text-xs border border-sand-200">
            <thead className="bg-sand-100/90 font-bold text-najdi-800">
              <tr>
                <th className="p-2.5 text-start border-b border-sand-200">Description</th>
                <th className="p-2.5 text-end border-b border-sand-200">Base Rent</th>
                <th className="p-2.5 text-end border-b border-sand-200">VAT (15%)</th>
                <th className="p-2.5 text-end border-b border-sand-200">Total Scheduled</th>
                <th className="p-2.5 text-end border-b border-sand-200">Total Paid</th>
                <th className="p-2.5 text-end border-b border-sand-200">Remaining Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2.5 font-medium">{installment.periodLabel}</td>
                <td className="p-2.5 text-end">{formatSAR(installment.baseAmount, language)}</td>
                <td className="p-2.5 text-end">{formatSAR(installment.vatAmount, language)}</td>
                <td className="p-2.5 text-end font-bold">{formatSAR(installment.totalAmount, language)}</td>
                <td className="p-2.5 text-end font-bold text-najdi-900">{formatSAR(installment.paidAmount, language)}</td>
                <td className="p-2.5 text-end font-bold text-rose-600">{formatSAR(installment.remainingAmount, language)}</td>
              </tr>
            </tbody>
          </table>

          {/* Signatures & Stamps */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200">
            <div>
              <p className="text-[11px] font-bold text-slate-700">Recipient / Landlord Sign & Stamp</p>
              <p className="text-[10px] text-slate-400 font-arabic">توقيع وختم المؤجر</p>
              <div className="mt-8 border-b border-dashed border-slate-400 w-48" />
              <p className="text-[10px] text-slate-500 mt-1">Building Management Office</p>
            </div>

            <div className="text-end">
              <p className="text-[11px] font-bold text-slate-700">Tenant / Representative</p>
              <p className="text-[10px] text-slate-400 font-arabic">توقيع المستلم / المستأجر</p>
              <div className="mt-8 border-b border-dashed border-slate-400 w-48 ms-auto" />
              <p className="text-[10px] text-slate-500 mt-1">{tenant?.contactPerson || 'Authorized Signatory'}</p>
            </div>
          </div>

          <div className="text-center pt-4 text-[10px] text-slate-400">
            This electronic voucher serves as official proof of payment for commercial lease accounting.
          </div>
        </div>
      </div>
    </div>
  );
};
