import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Printer,
  Mail,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { PaymentInstallment } from '../../types';
import { Badge } from '../common/Badge';
import { RecordPaymentModal } from './RecordPaymentModal';
import { ReceiptVoucherModal } from './ReceiptVoucherModal';
import { EmailNoticeModal } from '../common/EmailNoticeModal';
import { formatSAR, formatDate } from '../../utils/formatters';
import { calculateDaysOverdue } from '../../utils/calculations';
import { generateOverdueEmail } from '../../services/emailService';

interface PaymentListProps {
  onNavigate: (view: string, id?: string) => void;
  selectedInstallmentId?: string;
}

export const PaymentList: React.FC<PaymentListProps> = ({ onNavigate, selectedInstallmentId }) => {
  const { payments, tenants, offices, contracts, settings, effectiveDate } = useData();
  const { language, t } = useLanguage();
  const { isAdmin } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');
  const [tenantFilter, setTenantFilter] = useState<string>('ALL');

  const [recordingInstallment, setRecordingInstallment] = useState<PaymentInstallment | null>(() => {
    if (selectedInstallmentId) {
      return payments.find(p => p.id === selectedInstallmentId) || null;
    }
    return null;
  });

  const [voucherInstallment, setVoucherInstallment] = useState<PaymentInstallment | null>(null);
  const [emailNoticeData, setEmailNoticeData] = useState<{
    isOpen: boolean;
    to: string;
    subject: string;
    body: string;
  }>({
    isOpen: false,
    to: '',
    subject: '',
    body: '',
  });

  const handleOpenEmailNotice = (p: PaymentInstallment) => {
    const tenant = tenants.find(t => t.id === p.tenantId);
    const contract = contracts.find(c => c.id === p.contractId);
    if (!tenant) return;

    const daysOverdue = Math.max(1, calculateDaysOverdue(p.dueDate, effectiveDate));
    const { subject, body } = generateOverdueEmail(tenant, contract, p, settings, daysOverdue);

    setEmailNoticeData({
      isOpen: true,
      to: tenant.email || '',
      subject,
      body,
    });
  };

  // Financial Summary Cards
  const stats = useMemo(() => {
    const totalCollected = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const totalOutstanding = payments.reduce((sum, p) => sum + (p.remainingAmount || 0), 0);
    const overdueList = payments.filter(
      p => p.remainingAmount > 0 && (p.status === 'OVERDUE' || calculateDaysOverdue(p.dueDate, effectiveDate) > 0)
    );
    const totalOverdue = overdueList.reduce((sum, p) => sum + p.remainingAmount, 0);

    return {
      totalCollected,
      totalOutstanding,
      totalOverdue,
      overdueCount: overdueList.length,
    };
  }, [payments, effectiveDate]);

  const filteredPayments = useMemo(() => {
    return payments
      .filter(p => {
        const isOverdue = p.remainingAmount > 0 && (p.status === 'OVERDUE' || calculateDaysOverdue(p.dueDate, effectiveDate) > 0);
        const isPaid = p.status === 'PAID' || p.remainingAmount === 0;
        const isPending = !isPaid && !isOverdue;

        if (statusFilter === 'PAID' && !isPaid) return false;
        if (statusFilter === 'OVERDUE' && !isOverdue) return false;
        if (statusFilter === 'PENDING' && !isPending) return false;

        if (tenantFilter !== 'ALL' && p.tenantId !== tenantFilter) return false;

        const tenant = tenants.find(t => t.id === p.tenantId);
        const office = offices.find(o => o.id === p.officeId);

        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          p.invoiceNumber.toLowerCase().includes(q) ||
          p.periodLabel.toLowerCase().includes(q) ||
          (tenant && tenant.name.toLowerCase().includes(q)) ||
          (office && office.officeNumber.toLowerCase().includes(q));

        return matchesQuery;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [payments, tenants, offices, searchQuery, statusFilter, tenantFilter, effectiveDate]);

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-najdi-900 dark:text-cream-50 flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <DollarSign className="h-6 w-6" />
            </div>
            <span>{t('payments')}</span>
            <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-sand-200/70 dark:bg-najdi-800 text-najdi-800 dark:text-cream-200">
              {payments.length} {language === 'ar' ? 'دفعات' : 'Installments'}
            </span>
          </h2>
          <p className="text-xs text-sand-500 dark:text-sand-400 mt-1">
            {language === 'ar' ? 'متابعة الدفعات المحصلة، المتبقية، والمتأخرة لبرج العبداللطيف' : 'Track received payments, outstanding balances, and overdue rent for Alabdullatif Tower'}
          </p>
        </div>
      </div>

      {/* 3 Main Summary Cards: Received, Outstanding, Overdue */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-sand-300 dark:border-najdi-700 bg-sand-100/70 dark:bg-najdi-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-najdi-900 dark:text-sand-200 uppercase tracking-wider">
              {language === 'ar' ? 'الدفعات المحصلة' : 'Payments Received'}
            </span>
            <div className="h-9 w-9 rounded-xl bg-sand-200 text-najdi-800 dark:bg-najdi-800 dark:text-sand-300 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black font-serif text-najdi-900 dark:text-sand-100">
            {formatSAR(stats.totalCollected, language)}
          </div>
          <p className="text-[11px] text-sand-600 dark:text-sand-400 mt-1">
            {language === 'ar' ? 'إجمالي المبالغ المستلمة' : 'Total cash collected'}
          </p>
        </div>

        <div className="rounded-2xl border border-sand-300 dark:border-najdi-700 bg-sand-50/70 dark:bg-najdi-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-najdi-800 dark:text-sand-300 uppercase tracking-wider">
              {language === 'ar' ? 'الدفعات المتبقية' : 'Payments Outstanding'}
            </span>
            <div className="h-9 w-9 rounded-xl bg-sand-200/80 dark:bg-najdi-800 text-bronze-600 dark:text-bronze-400 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black font-serif text-najdi-900 dark:text-cream-100">
            {formatSAR(stats.totalOutstanding, language)}
          </div>
          <p className="text-[11px] text-sand-500 dark:text-sand-400 mt-1">
            {language === 'ar' ? 'مبالغ قادمة ومستحقة' : 'Pending & future installments'}
          </p>
        </div>

        <div className="rounded-2xl border border-red-200/80 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/20 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wider">
              {language === 'ar' ? 'الدفعات المتأخرة' : 'Overdue Payments'}
            </span>
            <div className="h-9 w-9 rounded-xl bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black font-serif text-red-700 dark:text-red-300">
            {formatSAR(stats.totalOverdue, language)}
          </div>
          <p className="text-[11px] text-red-700/80 dark:text-red-400 mt-1 font-semibold">
            {stats.overdueCount} {language === 'ar' ? 'دفعات تجاوزت تاريخ الاستحقاق' : 'installments past due date'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sand-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'البحث برقم الفاتورة، المستأجر، أو الوحدة...' : 'Search by invoice #, tenant, unit...'}
            className="w-full ps-10 pe-4 py-2 rounded-xl text-xs bg-cream-50 dark:bg-najdi-950 border border-cream-300 dark:border-najdi-700 text-najdi-900 dark:text-cream-100 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="inline-flex rounded-xl bg-cream-100 dark:bg-najdi-950 p-1 text-xs border border-cream-200 dark:border-najdi-800">
            {(['ALL', 'PAID', 'PENDING', 'OVERDUE'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  statusFilter === status
                    ? 'bg-sand-500 text-najdi-900 shadow-xs'
                    : 'text-sand-600 dark:text-sand-400 hover:text-najdi-900 dark:hover:text-cream-100'
                }`}
              >
                {status === 'ALL'
                  ? (language === 'ar' ? 'الكل' : 'All')
                  : status === 'PAID'
                  ? (language === 'ar' ? 'المحصل' : 'Received')
                  : status === 'PENDING'
                  ? (language === 'ar' ? 'المتبقي' : 'Pending')
                  : (language === 'ar' ? 'المتأخر' : 'Overdue')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="overflow-hidden rounded-2xl border border-cream-300 dark:border-najdi-800 bg-white dark:bg-najdi-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-cream-100/90 dark:bg-najdi-850 text-sand-600 dark:text-sand-400 uppercase tracking-wider font-semibold border-b border-cream-300 dark:border-najdi-800">
              <tr>
                <th className="p-4 text-start">{language === 'ar' ? 'رقم الدفعة' : 'Invoice #'}</th>
                <th className="p-4 text-start">{t('tenant')}</th>
                <th className="p-4 text-start">{t('office_unit')}</th>
                <th className="p-4 text-start">{language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                <th className="p-4 text-end">{language === 'ar' ? 'المبلغ الإجمالي' : 'Total Amount'}</th>
                <th className="p-4 text-end">{language === 'ar' ? 'المحصل' : 'Received'}</th>
                <th className="p-4 text-end">{language === 'ar' ? 'المتبقي' : 'Outstanding'}</th>
                <th className="p-4 text-center">{t('status')}</th>
                <th className="p-4 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200 dark:divide-najdi-800">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-sand-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <DollarSign className="h-8 w-8 text-sand-300 dark:text-najdi-700" />
                      <p>{language === 'ar' ? 'لا توجد دفعات مسجلة' : 'No payments found.'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => {
                  const tenant = tenants.find(t => t.id === p.tenantId);
                  const office = offices.find(o => o.id === p.officeId);
                  const daysOverdue = calculateDaysOverdue(p.dueDate, effectiveDate);
                  const isOverdue = p.remainingAmount > 0 && daysOverdue > 0;
                  const isPaid = p.remainingAmount === 0;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-cream-50/70 dark:hover:bg-najdi-850/40 transition-colors group"
                    >
                      <td className="p-4 font-mono font-bold text-najdi-900 dark:text-cream-100">
                        {p.invoiceNumber}
                        <span className="block text-[11px] text-sand-400 font-sans">{p.periodLabel}</span>
                      </td>

                      <td className="p-4 font-bold text-najdi-900 dark:text-cream-50">
                        {tenant?.name || 'N/A'}
                      </td>

                      <td className="p-4">
                        <span className="font-semibold text-sand-700 dark:text-sand-300">
                          {office?.officeNumber || 'Unit'}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="font-medium text-najdi-800 dark:text-cream-200">
                          {formatDate(p.dueDate, 'dd/MM/yyyy')}
                        </div>
                        {isOverdue && (
                          <span className="text-[11px] text-red-600 dark:text-red-400 font-bold block">
                            {daysOverdue} {language === 'ar' ? 'يوم تأخير' : 'days overdue'}
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-end font-bold text-najdi-900 dark:text-cream-50">
                        {formatSAR(p.totalAmount, language)}
                      </td>

                      <td className="p-4 text-end font-semibold text-najdi-800 dark:text-sand-300">
                        {formatSAR(p.paidAmount, language)}
                      </td>

                      <td className="p-4 text-end font-semibold text-bronze-600 dark:text-bronze-400">
                        {formatSAR(p.remainingAmount, language)}
                      </td>

                      <td className="p-4 text-center">
                        <Badge
                          variant={
                            isPaid
                              ? 'sand'
                              : isOverdue
                              ? 'danger'
                              : 'bronze'
                          }
                          size="sm"
                        >
                          {isPaid
                            ? (language === 'ar' ? 'تم السداد' : 'Paid')
                            : isOverdue
                            ? (language === 'ar' ? 'متأخر' : 'Overdue')
                            : (language === 'ar' ? 'مستحق' : 'Pending')}
                        </Badge>
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isAdmin && !isPaid && (
                            <button
                              onClick={() => setRecordingInstallment(p)}
                              className="px-3 py-1.5 rounded-xl bg-sand-500 hover:bg-sand-600 text-najdi-900 text-xs font-bold transition-all shadow-xs"
                            >
                              {language === 'ar' ? 'تسجيل سداد' : 'Record Payment'}
                            </button>
                          )}
                          {!isPaid && (
                            <button
                              onClick={() => handleOpenEmailNotice(p)}
                              className="p-1.5 rounded-lg text-sand-500 hover:text-brand-600 hover:bg-cream-100 dark:hover:bg-najdi-800 transition-colors"
                              title={language === 'ar' ? 'إرسال إشعار تذكير بالسداد' : 'Send Payment Reminder Email'}
                            >
                              <Mail className="h-4 w-4" />
                            </button>
                          )}
                          {p.paidAmount > 0 && (
                            <button
                              onClick={() => setVoucherInstallment(p)}
                              className="p-1.5 rounded-lg text-sand-500 hover:text-najdi-900 dark:hover:text-cream-100 hover:bg-cream-100 dark:hover:bg-najdi-800 transition-colors"
                              title={language === 'ar' ? 'سند قبض' : 'Receipt Voucher'}
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {recordingInstallment && (
        <RecordPaymentModal
          isOpen={!!recordingInstallment}
          onClose={() => setRecordingInstallment(null)}
          installment={recordingInstallment}
        />
      )}

      {/* Receipt Voucher Print Modal */}
      {voucherInstallment && (
        <ReceiptVoucherModal
          isOpen={!!voucherInstallment}
          onClose={() => setVoucherInstallment(null)}
          installment={voucherInstallment}
        />
      )}

      {/* Email Notice Modal */}
      <EmailNoticeModal
        isOpen={emailNoticeData.isOpen}
        onClose={() => setEmailNoticeData(prev => ({ ...prev, isOpen: false }))}
        defaultTo={emailNoticeData.to}
        defaultSubject={emailNoticeData.subject}
        defaultBody={emailNoticeData.body}
        title={language === 'ar' ? 'إرسال إشعار استحقاق دفعة إيجارية' : 'Send Rent Payment Reminder'}
      />
    </div>
  );
};
