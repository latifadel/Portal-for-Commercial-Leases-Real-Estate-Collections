import React, { useState, useMemo } from 'react';
import {
  FileText,
  Building2,
  Users,
  Calendar,
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileUp,
  Download,
  RotateCw,
  XCircle,
  Layers,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Contract, PaymentInstallment } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatSAR, formatDate } from '../../utils/formatters';
import {
  calculateContractRemainingDays,
  calculateContractProgress,
  getContractAlertLevel,
  calculateContractAccrual,
  calculateDaysOverdue,
} from '../../utils/calculations';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface ContractDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
  onRecordPayment?: (installmentId: string) => void;
  onNavigateTenant?: (tenantId: string) => void;
  onNavigateOffice?: (officeId: string) => void;
}

export const ContractDetailModal: React.FC<ContractDetailModalProps> = ({
  isOpen,
  onClose,
  contract,
  onRecordPayment,
  onNavigateTenant,
  onNavigateOffice,
}) => {
  const { language, t } = useLanguage();
  const { tenants, offices, payments, effectiveDate, cancelContract, renewContract, attachContractDoc } = useData();
  const { isAdmin } = useAuth();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewStartDate, setRenewStartDate] = useState('');
  const [renewEndDate, setRenewEndDate] = useState('');
  const [renewRent, setRenewRent] = useState(0);

  const contractDetails = useMemo(() => {
    if (!contract) return null;

    const tenant = tenants.find(t => t.id === contract.tenantId);
    const office = offices.find(o => o.id === contract.officeId);
    const contractPayments = payments.filter(p => p.contractId === contract.id);

    const totalPaid = contractPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const outstanding = Math.max(0, contract.totalRent - totalPaid);

    const remainingDays = calculateContractRemainingDays(contract.endDate, effectiveDate);
    const progress = calculateContractProgress(contract.startDate, contract.endDate, effectiveDate);
    const alertLevel = getContractAlertLevel(contract.endDate, effectiveDate);

    const accrual = calculateContractAccrual(contract, payments, tenant, office, effectiveDate);

    return {
      tenant,
      office,
      contractPayments,
      totalPaid,
      outstanding,
      remainingDays,
      progress,
      alertLevel,
      accrual,
    };
  }, [contract, tenants, offices, payments, effectiveDate]);

  if (!contract || !contractDetails) return null;

  const handleOpenRenew = () => {
    // Propose start date day after current contract ends
    setRenewStartDate(contract.endDate);
    setRenewEndDate('2027-12-31');
    setRenewRent(contract.baseRent);
    setShowRenewModal(true);
  };

  const handleConfirmRenew = (e: React.FormEvent) => {
    e.preventDefault();
    renewContract(contract.id, renewStartDate, renewEndDate, renewRent);
    setShowRenewModal(false);
    onClose();
  };

  const handleConfirmCancel = () => {
    cancelContract(contract.id, cancelReason);
    setShowCancelDialog(false);
    onClose();
  };

  const handleSimulateAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      attachContractDoc(contract.id, {
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        fileType: 'application/pdf',
      });
    }
  };

  const alertBadgeColors = {
    NORMAL: 'bg-sand-100 text-najdi-800 border-sand-300',
    UPCOMING: 'bg-sand-200 text-najdi-800 border-sand-400',
    WARNING: 'bg-bronze-100 text-bronze-800 border-bronze-300',
    URGENT: 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse',
    EXPIRED: 'bg-najdi-800 text-white border-najdi-700',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Contract Details: ${contract.id}`}
      subtitle={`Ejari Commercial Lease Agreement • ${contractDetails.tenant?.name || 'Tenant'}`}
      maxWidth="5xl"
    >
      <div className="space-y-6">
        {/* Top Status & Expiry Alert Banner */}
        <div className="p-5 rounded-2xl bg-sand-50 dark:bg-najdi-850/60 border border-sand-200/80 dark:border-najdi-700/60 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Badge type="contract" status={contract.status} />
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${alertBadgeColors[contractDetails.alertLevel]}`}>
                {contractDetails.remainingDays > 0
                  ? `${contractDetails.remainingDays} Days Remaining (${contractDetails.alertLevel})`
                  : 'Contract Expired'}
              </span>
            </div>

            {isAdmin && contract.status !== 'CANCELLED' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenRenew}
                  className="px-3 py-1.5 rounded-xl bg-sand-500 hover:bg-sand-600 text-najdi-900 font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  Renew Contract
                </button>
                <button
                  onClick={() => setShowCancelDialog(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold text-xs border border-rose-200 dark:border-rose-900 transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Cancel Lease
                </button>
              </div>
            )}
          </div>

          {/* Timeline Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-sand-500 mb-1.5">
              <span>Start: {formatDate(contract.startDate, 'dd MMM yyyy')}</span>
              <span className="font-semibold text-najdi-700 dark:text-sand-300">
                {Math.round(contractDetails.progress * 100)}% Elapsed
              </span>
              <span>End: {formatDate(contract.endDate, 'dd MMM yyyy')}</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-sand-200 dark:bg-najdi-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-bronze-500 rounded-full transition-all duration-500"
                style={{ width: `${contractDetails.progress * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4 Financial Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-white dark:bg-najdi-900 border border-sand-200 dark:border-najdi-800">
            <p className="text-[11px] font-semibold text-sand-500 uppercase">Base Rental (Excl. VAT)</p>
            <p className="text-base font-bold text-najdi-900 dark:text-white mt-0.5">
              {formatSAR(contract.baseRent, language)}
            </p>
            <p className="text-[10px] text-sand-400 mt-1">VAT 15%: {formatSAR(contract.vatAmount, language)}</p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-najdi-900 border border-sand-200 dark:border-najdi-800">
            <p className="text-[11px] font-semibold text-brand-700 uppercase">Total Contract Value</p>
            <p className="text-base font-bold text-brand-700 mt-0.5">
              {formatSAR(contract.totalRent, language)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">{contract.paymentFrequency}</p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <p className="text-[11px] font-semibold text-blue-600 uppercase">Accrued Rental (Earned)</p>
            <p className="text-base font-bold text-blue-600 mt-0.5">
              {formatSAR(contractDetails.accrual.earnedToDate, language)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Earned to date ({contractDetails.accrual.progressPercent}%)</p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <p className="text-[11px] font-semibold text-amber-600 uppercase">Outstanding Balance</p>
            <p className="text-base font-bold text-amber-600 mt-0.5">
              {formatSAR(contractDetails.outstanding, language)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Paid: {formatSAR(contractDetails.totalPaid, language)}</p>
          </div>
        </div>

        {/* Tenant & Unit Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Tenant Party</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {contractDetails.tenant?.name || 'N/A'}
              </p>
              <p className="text-xs text-slate-500">
                CR: {contractDetails.tenant?.crNumber} • {contractDetails.tenant?.contactPerson}
              </p>
            </div>
            {contractDetails.tenant && (
              <button
                onClick={() => onNavigateTenant?.(contractDetails.tenant!.id)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-xs font-semibold"
              >
                Profile &rarr;
              </button>
            )}
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Leased Property</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {contractDetails.office?.officeNumber || 'N/A'}
              </p>
              <p className="text-xs text-slate-500">
                Floor {contractDetails.office?.floor} • {contractDetails.office?.sizeSqm} m²
              </p>
            </div>
            {contractDetails.office && (
              <button
                onClick={() => onNavigateOffice?.(contractDetails.office!.id)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-xs font-semibold"
              >
                Unit &rarr;
              </button>
            )}
          </div>
        </div>

        {/* Payment Installments Schedule Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Payment Installments Schedule
            </h4>
            <span className="text-xs text-slate-400">
              {contractDetails.contractPayments.length} Invoices
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 text-start">Invoice #</th>
                  <th className="p-3 text-start">Period</th>
                  <th className="p-3 text-start">Due Date</th>
                  <th className="p-3 text-end">Base (SAR)</th>
                  <th className="p-3 text-end">VAT (15%)</th>
                  <th className="p-3 text-end">Total Due</th>
                  <th className="p-3 text-end">Paid Amount</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {contractDetails.contractPayments.map(p => {
                  const daysOverdue = calculateDaysOverdue(p.dueDate, effectiveDate);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{p.invoiceNumber}</td>
                      <td className="p-3 text-slate-500">{p.periodLabel}</td>
                      <td className="p-3 text-slate-500">
                        {formatDate(p.dueDate, 'dd MMM yyyy')}
                        {daysOverdue > 0 && p.remainingAmount > 0 && (
                          <span className="block text-[10px] text-rose-600 font-bold">
                            {daysOverdue}d Overdue
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-end">{formatSAR(p.baseAmount, language)}</td>
                      <td className="p-3 text-end text-sand-700 dark:text-sand-300">{formatSAR(p.vatAmount, language)}</td>
                      <td className="p-3 text-end font-bold text-slate-900 dark:text-white">
                        {formatSAR(p.totalAmount, language)}
                      </td>
                      <td className="p-3 text-end font-semibold text-sand-800 dark:text-sand-300">
                        {formatSAR(p.paidAmount, language)}
                      </td>
                      <td className="p-3 text-center">
                        <Badge type="payment" status={p.status} />
                      </td>
                      <td className="p-3 text-center">
                        {p.remainingAmount > 0 && isAdmin ? (
                          <button
                            onClick={() => onRecordPayment?.(p.id)}
                            className="px-2.5 py-1 bg-sand-500 hover:bg-sand-600 text-najdi-900 rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            Record Pay
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {p.remainingAmount === 0 ? 'Completed' : 'View only'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Attachments Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Attached Lease Contracts & Documents
            </h4>
            {isAdmin && (
              <label className="cursor-pointer px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5">
                <FileUp className="h-3.5 w-3.5 text-brand-600" />
                <span>Upload PDF</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleSimulateAttach}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(contract.attachments || []).map(att => (
              <div
                key={att.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-red-50 text-red-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                      {att.fileName}
                    </p>
                    <p className="text-[10px] text-slate-400">{att.fileSize} • {formatDate(att.uploadedAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() => alert(`Simulating download of ${att.fileName}`)}
                  className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-50 rounded-lg"
                  title="Download File"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Renew Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scaleUp"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl">
                <RotateCw className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Renew Lease Contract</h4>
                <p className="text-xs text-slate-500">Create new renewal cycle for this tenant</p>
              </div>
            </div>

            <form onSubmit={handleConfirmRenew} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Start Date
                </label>
                <input
                  type="date"
                  value={renewStartDate}
                  onChange={e => setRenewStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New End Date
                </label>
                <input
                  type="date"
                  value={renewEndDate}
                  onChange={e => setRenewEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Annual Base Rent (SAR)
                </label>
                <input
                  type="number"
                  step={1000}
                  value={renewRent}
                  onChange={e => setRenewRent(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 font-bold"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRenewModal(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-xs transition-colors"
                >
                  Confirm Renewal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Commercial Lease Contract"
        message={`Are you sure you want to cancel contract ${contract.id}? This will mark the contract as cancelled and release office ${contractDetails.office?.officeNumber} as vacant.`}
        confirmText="Confirm Cancellation"
        type="danger"
      />
    </Modal>
  );
};
