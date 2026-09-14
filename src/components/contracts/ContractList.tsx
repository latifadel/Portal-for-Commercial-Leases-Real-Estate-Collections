import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Clock,
  Trash2,
  Mail,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Contract } from '../../types';
import { Badge } from '../common/Badge';
import { ContractModal } from './ContractModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmailNoticeModal } from '../common/EmailNoticeModal';
import { formatSAR, formatDate } from '../../utils/formatters';
import { generateExpiryEmail } from '../../services/emailService';
import { calculateContractRemainingDays } from '../../utils/calculations';

interface ContractListProps {
  onNavigate: (view: string, id?: string) => void;
  selectedContractId?: string;
}

export const ContractList: React.FC<ContractListProps> = ({ onNavigate, selectedContractId }) => {
  const { contracts, tenants, offices, payments, settings, effectiveDate, cancelContract } = useData();
  const { language, t } = useLanguage();
  const { isAdmin } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);

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

  const handleOpenExpiryEmail = (contract: Contract) => {
    const tenant = tenants.find(t => t.id === contract.tenantId);
    const office = offices.find(o => o.id === contract.officeId);
    if (!tenant) return;

    const daysLeft = calculateContractRemainingDays(contract.endDate, effectiveDate);
    const { subject, body } = generateExpiryEmail(tenant, contract, office, settings, Math.max(0, daysLeft));

    setEmailNoticeData({
      isOpen: true,
      to: tenant.email || '',
      subject,
      body,
    });
  };

  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      const matchesStatus =
        statusFilter === 'ALL' ? true : contract.status === statusFilter;

      const tenant = tenants.find(t => t.id === contract.tenantId);
      const office = offices.find(o => o.id === contract.officeId);

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        contract.id.toLowerCase().includes(q) ||
        (tenant && tenant.name.toLowerCase().includes(q)) ||
        (tenant && tenant.nameAr && tenant.nameAr.toLowerCase().includes(q)) ||
        (office && office.officeNumber.toLowerCase().includes(q));

      return matchesStatus && matchesQuery;
    });
  }, [contracts, tenants, offices, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-najdi-900 dark:text-cream-50 flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <FileText className="h-6 w-6" />
            </div>
            <span>{t('contracts')}</span>
            <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-sand-200/70 dark:bg-najdi-800 text-najdi-800 dark:text-cream-200">
              {contracts.length}
            </span>
          </h2>
          <p className="text-xs text-sand-500 dark:text-sand-400 mt-1">
            {language === 'ar' ? 'سجل عقود الإيجار، مدد العقود، والدفعات لبرج العبداللطيف' : 'Lease agreements, contract durations, and payment schedules for Alabdullatif Tower'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sand-500 hover:bg-sand-600 text-najdi-900 text-xs font-bold transition-all shadow-sm shadow-sand-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>{t('create_contract')}</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sand-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'البحث برقم العقد، المستأجر، أو الوحدة...' : 'Search by contract ID, tenant, or unit...'}
            className="w-full ps-10 pe-4 py-2 rounded-xl text-xs bg-cream-50 dark:bg-najdi-950 border border-cream-300 dark:border-najdi-700 text-najdi-900 dark:text-cream-100 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="inline-flex rounded-xl bg-cream-100 dark:bg-najdi-950 p-1 text-xs border border-cream-200 dark:border-najdi-800">
            {['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED'].map(status => (
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
                  : status === 'ACTIVE'
                  ? (language === 'ar' ? 'نشط' : 'Active')
                  : status === 'EXPIRING_SOON'
                  ? (language === 'ar' ? 'ينتهي قريباً' : 'Expiring Soon')
                  : (language === 'ar' ? 'منتهي' : 'Expired')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="overflow-hidden rounded-2xl border border-cream-300 dark:border-najdi-800 bg-white dark:bg-najdi-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-cream-100/90 dark:bg-najdi-850 text-sand-600 dark:text-sand-400 uppercase tracking-wider font-semibold border-b border-cream-300 dark:border-najdi-800">
              <tr>
                <th className="p-4 text-start">ID</th>
                <th className="p-4 text-start">{t('tenant')}</th>
                <th className="p-4 text-start">{t('office_unit')}</th>
                <th className="p-4 text-start">{language === 'ar' ? 'فترة العقد' : 'Lease Period'}</th>
                <th className="p-4 text-center">{language === 'ar' ? 'المدة' : 'Duration'}</th>
                <th className="p-4 text-end">{language === 'ar' ? 'الإجمالي شامل الضريبة' : 'Total with VAT'}</th>
                <th className="p-4 text-end">{language === 'ar' ? 'المحصل' : 'Received'}</th>
                <th className="p-4 text-end">{language === 'ar' ? 'المتبقي' : 'Outstanding'}</th>
                <th className="p-4 text-center">{t('status')}</th>
                <th className="p-4 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200 dark:divide-najdi-800">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-sand-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="h-8 w-8 text-sand-300 dark:text-najdi-700" />
                      <p>{language === 'ar' ? 'لا توجد عقود مضافة حالياً' : 'No contracts found.'}</p>
                      {isAdmin && (
                        <button
                          onClick={() => setIsAddOpen(true)}
                          className="mt-2 text-xs text-brand-600 font-bold hover:underline"
                        >
                          + {language === 'ar' ? 'إنشاء أول عقد إيجار' : 'Create First Lease Contract'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContracts.map(contract => {
                  const tenant = tenants.find(t => t.id === contract.tenantId);
                  const office = offices.find(o => o.id === contract.officeId);
                  const contractPayments = payments.filter(p => p.contractId === contract.id);
                  const paidAmount = contractPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
                  const outstanding = Math.max(0, contract.totalRent - paidAmount);

                  return (
                    <tr
                      key={contract.id}
                      className="hover:bg-cream-50/70 dark:hover:bg-najdi-850/40 transition-colors group"
                    >
                      <td className="p-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                        {contract.id}
                      </td>

                      <td className="p-4 font-bold text-najdi-900 dark:text-cream-50">
                        {tenant?.name || 'N/A'}
                      </td>

                      <td className="p-4">
                        <span className="font-semibold text-sand-700 dark:text-sand-300">
                          {office?.officeNumber || 'Unit'}
                        </span>
                        {office?.floor && (
                          <span className="block text-[11px] text-sand-400">Floor {office.floor}</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="font-medium text-najdi-800 dark:text-cream-200">
                          {formatDate(contract.startDate, 'dd/MM/yyyy')}
                        </div>
                        <div className="text-[11px] text-sand-400">
                          {language === 'ar' ? 'إلى' : 'to'} {formatDate(contract.endDate, 'dd/MM/yyyy')}
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sand-100 dark:bg-najdi-800 text-najdi-800 dark:text-cream-200 font-bold text-xs">
                          <Clock className="h-3 w-3 text-brand-600" />
                          {contract.durationMonths} {language === 'ar' ? 'شهر' : 'Months'}
                        </span>
                      </td>

                      <td className="p-4 text-end font-bold text-najdi-900 dark:text-cream-50">
                        {formatSAR(contract.totalRent, language)}
                      </td>

                      <td className="p-4 text-end font-semibold text-najdi-800 dark:text-sand-300">
                        {formatSAR(paidAmount, language)}
                      </td>

                      <td className="p-4 text-end font-semibold text-bronze-600 dark:text-bronze-400">
                        {formatSAR(outstanding, language)}
                      </td>

                      <td className="p-4 text-center">
                        <Badge
                          variant={
                            contract.status === 'ACTIVE'
                              ? 'sand'
                              : contract.status === 'EXPIRING_SOON'
                              ? 'bronze'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {contract.status === 'ACTIVE'
                            ? (language === 'ar' ? 'نشط' : 'Active')
                            : contract.status === 'EXPIRING_SOON'
                            ? (language === 'ar' ? 'ينتهي قريباً' : 'Expiring Soon')
                            : (language === 'ar' ? 'منتهي' : 'Expired')}
                        </Badge>
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onNavigate('payments', contract.id)}
                            className="px-2.5 py-1 rounded-lg bg-cream-100 dark:bg-najdi-800 hover:bg-brand-50 dark:hover:bg-najdi-750 text-sand-700 dark:text-sand-300 hover:text-brand-600 text-[11px] font-semibold transition-colors"
                          >
                            {language === 'ar' ? 'الدفعات' : 'Payments'}
                          </button>
                          <button
                            onClick={() => handleOpenExpiryEmail(contract)}
                            className="p-1.5 rounded-lg text-sand-400 hover:text-bronze-600 hover:bg-cream-100 dark:hover:bg-najdi-800 transition-colors"
                            title={language === 'ar' ? 'إشعار انتهاء العقد بالبريد' : 'Email Expiry Notice'}
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => setContractToDelete(contract)}
                              className="p-1.5 rounded-lg text-sand-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              title={t('delete')}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

      {/* Create Contract Modal */}
      <ContractModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      {/* Delete / Cancel Confirmation */}
      <ConfirmDialog
        isOpen={!!contractToDelete}
        onClose={() => setContractToDelete(null)}
        onConfirm={() => {
          if (contractToDelete) {
            cancelContract(contractToDelete.id);
            setContractToDelete(null);
          }
        }}
        title={t('cancel_contract')}
        message={
          language === 'ar'
            ? `هل أنت متأكد من رغبتك في إلغاء العقد "${contractToDelete?.id}"؟`
            : `Are you sure you want to cancel contract "${contractToDelete?.id}"?`
        }
        confirmText={language === 'ar' ? 'إلغاء العقد' : 'Cancel Contract'}
        variant="danger"
      />

      {/* Email Expiry Modal */}
      <EmailNoticeModal
        isOpen={emailNoticeData.isOpen}
        onClose={() => setEmailNoticeData(prev => ({ ...prev, isOpen: false }))}
        defaultTo={emailNoticeData.to}
        defaultSubject={emailNoticeData.subject}
        defaultBody={emailNoticeData.body}
        title={language === 'ar' ? 'إرسال إشعار قرب انتهاء العقد' : 'Send Lease Expiry Notice'}
      />
    </div>
  );
};
