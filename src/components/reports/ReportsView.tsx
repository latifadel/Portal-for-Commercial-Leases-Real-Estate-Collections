import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Building2,
  DollarSign,
  AlertCircle,
  TrendingUp,
  FileText,
  Search,
  Filter,
  Printer,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  ArrowUpRight,
  Edit2,
  Receipt,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  formatSAR,
  formatDate,
  formatPaymentFrequency,
  getContractStatusBadge,
  getPaymentStatusBadge,
} from '../../utils/formatters';
import {
  calculateDaysOverdue,
  calculateContractFinancials,
  calculateBuildingFinancialSummary,
} from '../../utils/calculations';
import { exportToExcel, exportToPDF, exportToCSV, printReport } from '../../utils/exportHelpers';
import { RecordPaymentModal } from '../payments/RecordPaymentModal';
import { EditInstallmentModal } from '../payments/EditInstallmentModal';
import { ReceiptVoucherModal } from '../payments/ReceiptVoucherModal';
import { PaymentInstallment } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const ReportsView: React.FC = () => {
  const { offices, tenants, contracts, payments, settings, effectiveDate, deletePayment } = useData();
  const { language, t } = useLanguage();
  const { isAdmin } = useAuth();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'TENANT_STATEMENT' | 'PAYMENT_SCHEDULE' | 'MONTHLY_CASHFLOW'>('TENANT_STATEMENT');

  // Tenant Statement Filters
  const [tenantSearchQuery, setTenantSearchQuery] = useState('');
  const [tenantStatusFilter, setTenantStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'HAS_OVERDUE'>('ALL');

  // Payment Schedule Filters
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState('');
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState<'ALL' | 'OVERDUE' | 'DUE_SOON' | 'UPCOMING' | 'PARTIALLY_PAID' | 'PAID'>('ALL');
  const [scheduleTenantFilter, setScheduleTenantFilter] = useState<string>('ALL');
  const [scheduleOfficeFilter, setScheduleOfficeFilter] = useState<string>('ALL');
  const [scheduleStartDate, setScheduleStartDate] = useState<string>('');
  const [scheduleEndDate, setScheduleEndDate] = useState<string>('');

  // Modals
  const [selectedInstallmentForPayment, setSelectedInstallmentForPayment] = useState<PaymentInstallment | null>(null);
  const [selectedInstallmentForEdit, setSelectedInstallmentForEdit] = useState<PaymentInstallment | null>(null);
  const [selectedInstallmentForReceipt, setSelectedInstallmentForReceipt] = useState<PaymentInstallment | null>(null);
  const [installmentToDelete, setInstallmentToDelete] = useState<PaymentInstallment | null>(null);

  // --- Dynamic Building Financial Summary KPIs ---
  const summary = useMemo(() => {
    return calculateBuildingFinancialSummary({
      tenants,
      offices,
      contracts,
      payments,
      currentDateStr: effectiveDate,
    });
  }, [tenants, offices, contracts, payments, effectiveDate]);

  // --- 1. Tenant Lease Details Data Rows ---
  const tenantStatementRows = useMemo(() => {
    return contracts
      .filter(c => c.status !== 'CANCELLED')
      .map((contract, index) => {
        const tenant = tenants.find(t => t.id === contract.tenantId);
        const office = offices.find(o => o.id === contract.officeId);
        const fin = calculateContractFinancials(contract, payments, effectiveDate);

        return {
          index: index + 1,
          contractId: contract.id,
          tenantId: contract.tenantId,
          tenantName: tenant?.name || 'N/A',
          tenantNameAr: tenant?.nameAr || tenant?.name || 'N/A',
          officeId: contract.officeId,
          officeNumber: office?.officeNumber || 'Unit',
          floorLabel: office?.floor ? `Floor ${office.floor}` : undefined,
          startDate: contract.startDate,
          endDate: contract.endDate,
          periodString: `${formatDate(contract.startDate, 'dd/MM/yyyy')} - ${formatDate(contract.endDate, 'dd/MM/yyyy')}`,
          durationMonths: contract.durationMonths,
          paymentFrequency: contract.paymentFrequency,
          frequencyLabel: formatPaymentFrequency(contract.paymentFrequency, language),
          baseRent: fin.baseRent,
          vatRate: fin.vatRate,
          vatAmount: fin.vatAmount,
          totalRentWithVat: fin.totalRentWithVat,
          rentReceived: fin.rentReceived,
          outstandingBalance: fin.outstandingBalance,
          overdueAmount: fin.overdueAmount,
          status: contract.status,
        };
      });
  }, [contracts, tenants, offices, payments, effectiveDate, language]);

  // Filtered Tenant Statement Rows
  const filteredStatementRows = useMemo(() => {
    return tenantStatementRows.filter(row => {
      // Status Filter
      let matchesStatus = true;
      if (tenantStatusFilter === 'ACTIVE') matchesStatus = row.status === 'ACTIVE';
      else if (tenantStatusFilter === 'EXPIRING_SOON') matchesStatus = row.status === 'EXPIRING_SOON';
      else if (tenantStatusFilter === 'EXPIRED') matchesStatus = row.status === 'EXPIRED';
      else if (tenantStatusFilter === 'HAS_OVERDUE') matchesStatus = row.overdueAmount > 0;

      // Search Query
      const q = tenantSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        row.tenantName.toLowerCase().includes(q) ||
        row.tenantNameAr.toLowerCase().includes(q) ||
        row.officeNumber.toLowerCase().includes(q) ||
        row.contractId.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [tenantStatementRows, tenantStatusFilter, tenantSearchQuery]);

  // Totals Row dynamically computed from the displayed rows
  const statementTotals = useMemo(() => {
    return filteredStatementRows.reduce(
      (acc, row) => ({
        totalBaseRent: acc.totalBaseRent + row.baseRent,
        totalVat: acc.totalVat + row.vatAmount,
        totalContractValue: acc.totalContractValue + row.totalRentWithVat,
        totalRentReceived: acc.totalRentReceived + row.rentReceived,
        totalOutstanding: acc.totalOutstanding + row.outstandingBalance,
        totalOverdue: acc.totalOverdue + row.overdueAmount,
      }),
      {
        totalBaseRent: 0,
        totalVat: 0,
        totalContractValue: 0,
        totalRentReceived: 0,
        totalOutstanding: 0,
        totalOverdue: 0,
      }
    );
  }, [filteredStatementRows]);

  // --- 2. Payment Schedule / Collections Rows ---
  const scheduleRows = useMemo(() => {
    const validContracts = contracts.filter(c => c.status !== 'CANCELLED');
    const validContractIds = new Set(validContracts.map(c => c.id));

    return payments
      .filter(inst => validContractIds.has(inst.contractId))
      .map(inst => {
        const tenant = tenants.find(t => t.id === inst.tenantId);
        const office = offices.find(o => o.id === inst.officeId);
        const contract = contracts.find(c => c.id === inst.contractId);
        const daysOverdue = calculateDaysOverdue(inst.dueDate, effectiveDate);

        return {
          ...inst,
          tenantName: tenant?.name || 'N/A',
          tenantNameAr: tenant?.nameAr || tenant?.name || 'N/A',
          officeNumber: office?.officeNumber || 'Unit',
          contractFrequency: contract?.paymentFrequency,
          daysOverdue,
        };
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [payments, tenants, offices, contracts, effectiveDate]);

  // Filtered Schedule Rows
  const filteredScheduleRows = useMemo(() => {
    return scheduleRows.filter(p => {
      // Status Filter
      let matchesStatus = true;
      if (scheduleStatusFilter === 'OVERDUE') matchesStatus = p.status === 'OVERDUE' || (p.remainingAmount > 0 && p.daysOverdue > 0);
      else if (scheduleStatusFilter === 'DUE_SOON') matchesStatus = p.status === 'DUE';
      else if (scheduleStatusFilter === 'UPCOMING') matchesStatus = p.status === 'UPCOMING';
      else if (scheduleStatusFilter === 'PARTIALLY_PAID') matchesStatus = p.status === 'PARTIALLY_PAID';
      else if (scheduleStatusFilter === 'PAID') matchesStatus = p.status === 'PAID';

      // Tenant Filter
      const matchesTenant = scheduleTenantFilter === 'ALL' || p.tenantId === scheduleTenantFilter;

      // Office Filter
      const matchesOffice = scheduleOfficeFilter === 'ALL' || p.officeId === scheduleOfficeFilter;

      // Date Range Filter
      let matchesDate = true;
      if (scheduleStartDate && p.dueDate < scheduleStartDate) matchesDate = false;
      if (scheduleEndDate && p.dueDate > scheduleEndDate) matchesDate = false;

      // Search Query
      const q = scheduleSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.invoiceNumber.toLowerCase().includes(q) ||
        p.tenantName.toLowerCase().includes(q) ||
        p.tenantNameAr.toLowerCase().includes(q) ||
        p.officeNumber.toLowerCase().includes(q) ||
        p.periodLabel.toLowerCase().includes(q);

      return matchesStatus && matchesTenant && matchesOffice && matchesDate && matchesSearch;
    });
  }, [scheduleRows, scheduleStatusFilter, scheduleTenantFilter, scheduleOfficeFilter, scheduleStartDate, scheduleEndDate, scheduleSearchQuery]);

  // Schedule Totals
  const scheduleTotals = useMemo(() => {
    return filteredScheduleRows.reduce(
      (acc, p) => ({
        totalDue: acc.totalDue + p.totalAmount,
        totalPaid: acc.totalPaid + (p.paidAmount || 0),
        totalRemaining: acc.totalRemaining + (p.remainingAmount || 0),
      }),
      { totalDue: 0, totalPaid: 0, totalRemaining: 0 }
    );
  }, [filteredScheduleRows]);

  // --- 3. Monthly Collections Data (Jan - Dec) ---
  const monthlyData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const months = [
      { num: '01', en: 'Jan', ar: 'يناير' },
      { num: '02', en: 'Feb', ar: 'فبراير' },
      { num: '03', en: 'Mar', ar: 'مارس' },
      { num: '04', en: 'Apr', ar: 'أبريل' },
      { num: '05', en: 'May', ar: 'مايو' },
      { num: '06', en: 'Jun', ar: 'يونيو' },
      { num: '07', en: 'Jul', ar: 'يوليو' },
      { num: '08', en: 'Aug', ar: 'أغسطس' },
      { num: '09', en: 'Sep', ar: 'سبتمبر' },
      { num: '10', en: 'Oct', ar: 'أكتوبر' },
      { num: '11', en: 'Nov', ar: 'نوفمبر' },
      { num: '12', en: 'Dec', ar: 'ديسمبر' },
    ];

    return months.map(m => {
      const prefix = currentYear + '-' + m.num;
      let collected = 0;
      payments.forEach(p => {
        if (p.transactions && p.transactions.length > 0) {
          p.transactions.forEach(tx => {
            if (tx.paymentDate.startsWith(prefix)) {
              collected += tx.amount;
            }
          });
        } else if (p.status === 'PAID' && p.paymentDate && p.paymentDate.startsWith(prefix)) {
          collected += p.paidAmount;
        }
      });

      const scheduled = payments
        .filter(p => p.dueDate.startsWith(prefix))
        .reduce((s, p) => s + p.totalAmount, 0);

      return {
        monthKey: m.num,
        name: language === 'ar' ? m.ar : m.en,
        collected,
        scheduled,
      };
    });
  }, [payments, language]);

  const totalCollectedYear = useMemo(() => {
    return monthlyData.reduce((s, m) => s + m.collected, 0);
  }, [monthlyData]);

  // Occupancy details
  const occupancyStats = useMemo(() => {
    const total = offices.length;
    const occupied = offices.filter(o => o.status === 'OCCUPIED').length;
    const vacant = total - occupied;
    const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;

    const unitList = offices.map(o => {
      const tenant = o.currentTenantId ? tenants.find(t => t.id === o.currentTenantId) : null;
      const contract = o.currentContractId ? contracts.find(c => c.id === o.currentContractId) : null;
      return {
        ...o,
        tenantName: tenant?.name || (language === 'ar' ? 'شاغر' : 'Vacant'),
        contractDuration: contract ? `${contract.durationMonths} ${language === 'ar' ? 'أشهر' : 'Months'}` : 'N/A',
        contractEnd: contract ? contract.endDate : 'N/A',
      };
    });

    return { total, occupied, vacant, rate, unitList };
  }, [offices, tenants, contracts, language]);

  // --- 4. Master PDF Export (A4 Landscape) ---
  const handleExportMasterPDF = () => {
    const todayDate = new Date().toISOString().split('T')[0];
    const bName = settings.buildingName || 'Alabdullatif Center';

    const pdfData = filteredStatementRows.map((r, i) => ({
      index: i + 1,
      tenantName: r.tenantName,
      officeNumber: r.officeNumber,
      leasePeriod: `${formatDate(r.startDate, 'dd/MM/yy')} - ${formatDate(r.endDate, 'dd/MM/yy')}`,
      duration: `${r.durationMonths}m`,
      frequency: r.frequencyLabel,
      baseRent: formatSAR(r.baseRent, 'en'),
      vatAmount: formatSAR(r.vatAmount, 'en'),
      totalRentWithVat: formatSAR(r.totalRentWithVat, 'en'),
      rentReceived: formatSAR(r.rentReceived, 'en'),
      outstandingBalance: formatSAR(r.outstandingBalance, 'en'),
      overdueAmount: formatSAR(r.overdueAmount, 'en'),
      status: r.status,
    }));

    const totalsRow = {
      index: 'TOTALS',
      tenantName: `${filteredStatementRows.length} Leases`,
      officeNumber: '-',
      leasePeriod: '-',
      duration: '-',
      frequency: '-',
      baseRent: formatSAR(statementTotals.totalBaseRent, 'en'),
      vatAmount: formatSAR(statementTotals.totalVat, 'en'),
      totalRentWithVat: formatSAR(statementTotals.totalContractValue, 'en'),
      rentReceived: formatSAR(statementTotals.totalRentReceived, 'en'),
      outstandingBalance: formatSAR(statementTotals.totalOutstanding, 'en'),
      overdueAmount: formatSAR(statementTotals.totalOverdue, 'en'),
      status: '-',
    };

    exportToPDF({
      filename: `Alabdullatif_Tower_Financial_Report_${todayDate}`,
      title: 'Tenant Leases, Rent & Collections Financial Report',
      subtitle: 'Comprehensive statement of tenant count, active leases, contract values, rent received, outstanding balances, and overdue collections.',
      buildingName: `${bName} Commercial Property Management`,
      summaryCards: [
        { label: 'Total Tenants', value: String(summary.totalTenants) },
        { label: 'Active Leases', value: String(summary.activeLeases) },
        { label: 'Occupancy Rate', value: `${summary.occupancyRate}% (${summary.occupiedOffices}/${summary.totalOffices})` },
        { label: 'Total Value (VAT)', value: formatSAR(summary.totalContractValueWithVat, 'en') },
        { label: 'Rent Received', value: formatSAR(summary.totalRentReceived, 'en') },
        { label: 'Outstanding Rent', value: formatSAR(summary.totalOutstandingRent, 'en') },
        { label: 'Overdue Rent', value: formatSAR(summary.totalOverdueRent, 'en') },
      ],
      columns: [
        { header: '#', key: 'index', width: 6, align: 'center' },
        { header: 'Tenant Name', key: 'tenantName', width: 26, align: 'left' },
        { header: 'Office', key: 'officeNumber', width: 12, align: 'center' },
        { header: 'Lease Period', key: 'leasePeriod', width: 22, align: 'center' },
        { header: 'Dur', key: 'duration', width: 8, align: 'center' },
        { header: 'Frequency', key: 'frequency', width: 14, align: 'center' },
        { header: 'Base Rent', key: 'baseRent', width: 18, align: 'right' },
        { header: 'VAT (15%)', key: 'vatAmount', width: 16, align: 'right' },
        { header: 'Total Value', key: 'totalRentWithVat', width: 20, align: 'right' },
        { header: 'Received', key: 'rentReceived', width: 18, align: 'right' },
        { header: 'Outstanding', key: 'outstandingBalance', width: 20, align: 'right' },
        { header: 'Overdue', key: 'overdueAmount', width: 18, align: 'right' },
        { header: 'Status', key: 'status', width: 14, align: 'center' },
      ],
      data: pdfData,
      totalsRow,
      orientation: 'landscape',
    });
  };

  // --- 5. Excel Export ---
  const handleExportExcel = () => {
    const todayDate = new Date().toISOString().split('T')[0];
    const bName = settings.buildingName || 'Alabdullatif Center';

    if (activeTab === 'TENANT_STATEMENT') {
      const excelData = filteredStatementRows.map((r, i) => ({
        index: i + 1,
        tenantName: r.tenantName,
        officeNumber: r.officeNumber,
        startDate: r.startDate,
        endDate: r.endDate,
        durationMonths: r.durationMonths,
        frequency: r.frequencyLabel,
        baseRent: r.baseRent,
        vatAmount: r.vatAmount,
        totalRentWithVat: r.totalRentWithVat,
        rentReceived: r.rentReceived,
        outstandingBalance: r.outstandingBalance,
        overdueAmount: r.overdueAmount,
        status: r.status,
      }));

      const totalsRow = {
        index: 'TOTALS',
        tenantName: `${filteredStatementRows.length} Leases`,
        officeNumber: '',
        startDate: '',
        endDate: '',
        durationMonths: '',
        frequency: '',
        baseRent: statementTotals.totalBaseRent,
        vatAmount: statementTotals.totalVat,
        totalRentWithVat: statementTotals.totalContractValue,
        rentReceived: statementTotals.totalRentReceived,
        outstandingBalance: statementTotals.totalOutstanding,
        overdueAmount: statementTotals.totalOverdue,
        status: '',
      };

      exportToExcel({
        filename: `Alabdullatif_Tower_Leases_Statement_${todayDate}`,
        sheetName: 'Tenant_Leases',
        title: `${bName} – Tenant Leases, Rent & Collections Financial Statement`,
        columns: [
          { header: '#', key: 'index', width: 6 },
          { header: 'Tenant Name', key: 'tenantName', width: 28 },
          { header: 'Office Unit', key: 'officeNumber', width: 14 },
          { header: 'Start Date', key: 'startDate', width: 14 },
          { header: 'End Date', key: 'endDate', width: 14 },
          { header: 'Duration (Months)', key: 'durationMonths', width: 16 },
          { header: 'Payment Frequency', key: 'frequency', width: 18 },
          { header: 'Base Rent (SAR)', key: 'baseRent', width: 18 },
          { header: 'VAT 15% (SAR)', key: 'vatAmount', width: 16 },
          { header: 'Total Value with VAT (SAR)', key: 'totalRentWithVat', width: 24 },
          { header: 'Rent Received (SAR)', key: 'rentReceived', width: 20 },
          { header: 'Outstanding Balance (SAR)', key: 'outstandingBalance', width: 24 },
          { header: 'Overdue Amount (SAR)', key: 'overdueAmount', width: 22 },
          { header: 'Contract Status', key: 'status', width: 16 },
        ],
        data: excelData,
        totalsRow,
      });
    } else if (activeTab === 'PAYMENT_SCHEDULE') {
      const scheduleExcelData = filteredScheduleRows.map(p => ({
        invoiceNumber: p.invoiceNumber,
        tenantName: p.tenantName,
        officeNumber: p.officeNumber,
        periodLabel: p.periodLabel,
        dueDate: p.dueDate,
        daysOverdue: p.daysOverdue > 0 ? p.daysOverdue : 0,
        totalAmount: p.totalAmount,
        paidAmount: p.paidAmount || 0,
        remainingAmount: p.remainingAmount || 0,
        paymentDate: p.paymentDate || '-',
        paymentMethod: p.paymentMethod || '-',
        status: p.status,
      }));

      exportToExcel({
        filename: `Alabdullatif_Tower_Payment_Schedule_${todayDate}`,
        sheetName: 'Payment_Schedule',
        title: `${bName} – Cross-Tenant Payment Installment & Collections Schedule`,
        columns: [
          { header: 'Invoice #', key: 'invoiceNumber', width: 16 },
          { header: 'Tenant Name', key: 'tenantName', width: 26 },
          { header: 'Office Unit', key: 'officeNumber', width: 14 },
          { header: 'Period Description', key: 'periodLabel', width: 24 },
          { header: 'Due Date', key: 'dueDate', width: 14 },
          { header: 'Days Overdue', key: 'daysOverdue', width: 14 },
          { header: 'Amount Due (SAR)', key: 'totalAmount', width: 18 },
          { header: 'Amount Paid (SAR)', key: 'paidAmount', width: 18 },
          { header: 'Remaining Balance (SAR)', key: 'remainingAmount', width: 22 },
          { header: 'Payment Date', key: 'paymentDate', width: 14 },
          { header: 'Payment Method', key: 'paymentMethod', width: 16 },
          { header: 'Status', key: 'status', width: 14 },
        ],
        data: scheduleExcelData,
        totalsRow: {
          invoiceNumber: 'TOTALS',
          tenantName: `${filteredScheduleRows.length} Installments`,
          officeNumber: '',
          periodLabel: '',
          dueDate: '',
          daysOverdue: '',
          totalAmount: scheduleTotals.totalDue,
          paidAmount: scheduleTotals.totalPaid,
          remainingAmount: scheduleTotals.totalRemaining,
          paymentDate: '',
          paymentMethod: '',
          status: '',
        },
      });
    } else {
      exportToExcel({
        filename: `Alabdullatif_Tower_Monthly_Collections_${todayDate}`,
        sheetName: 'Collections',
        title: `${bName} – Monthly Cashflow & Collections Report`,
        columns: [
          { header: 'Month', key: 'name', width: 18 },
          { header: 'Collected Amount (SAR)', key: 'collected', width: 24 },
          { header: 'Scheduled Rent (SAR)', key: 'scheduled', width: 24 },
        ],
        data: monthlyData,
      });
    }
  };

  // --- 6. CSV Export ---
  const handleExportCSV = () => {
    const todayDate = new Date().toISOString().split('T')[0];
    const csvData = filteredStatementRows.map((r, i) => ({
      index: i + 1,
      tenantName: r.tenantName,
      officeNumber: r.officeNumber,
      startDate: r.startDate,
      endDate: r.endDate,
      durationMonths: r.durationMonths,
      frequency: r.frequencyLabel,
      baseRent: r.baseRent,
      vatAmount: r.vatAmount,
      totalRentWithVat: r.totalRentWithVat,
      rentReceived: r.rentReceived,
      outstandingBalance: r.outstandingBalance,
      overdueAmount: r.overdueAmount,
      status: r.status,
    }));

    exportToCSV(
      `Alabdullatif_Tower_Financial_Report_${todayDate}`,
      [
        { header: '#', key: 'index' },
        { header: 'Tenant Name', key: 'tenantName' },
        { header: 'Office Unit', key: 'officeNumber' },
        { header: 'Start Date', key: 'startDate' },
        { header: 'End Date', key: 'endDate' },
        { header: 'Duration (Months)', key: 'durationMonths' },
        { header: 'Payment Frequency', key: 'frequency' },
        { header: 'Base Rent (SAR)', key: 'baseRent' },
        { header: 'VAT 15% (SAR)', key: 'vatAmount' },
        { header: 'Total Value with VAT (SAR)', key: 'totalRentWithVat' },
        { header: 'Rent Received (SAR)', key: 'rentReceived' },
        { header: 'Outstanding Balance (SAR)', key: 'outstandingBalance' },
        { header: 'Overdue Amount (SAR)', key: 'overdueAmount' },
        { header: 'Status', key: 'status' },
      ],
      csvData
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ============================================================
          OFFICIAL FINANCIAL REPORT HEADER
         ============================================================ */}
      <div className="rounded-3xl border border-sand-300 dark:border-najdi-800 bg-white dark:bg-najdi-900 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sand-100 dark:bg-najdi-950 border border-sand-300 dark:border-najdi-800 text-najdi-800 dark:text-sand-300 text-xs font-semibold flex-wrap">
              <span>{language === 'ar' ? 'مركز العبداللطيف لإدارة الأملاك' : 'Alabdullatif Center – Property Management'}</span>
              <span>•</span>
              <span>{language === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, KSA'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-najdi-900 dark:text-cream-50 tracking-tight">
              {language === 'ar' ? 'التقرير المالي لعقود الإيجار والتحصيلات' : 'Tenant Leases, Rent & Collections Financial Report'}
            </h1>

            <p className="text-xs sm:text-sm text-sand-600 dark:text-sand-400 max-w-3xl leading-relaxed">
              {language === 'ar'
                ? 'بيان شامل يوضح عدد المستأجرين، عقود الإيجار النشطة، قيم العقود شاملة الضريبة، الإيجار المحصل، الأرصدة المتبقية، والتحصيلات المتأخرة.'
                : 'Comprehensive overview of tenant count, active leases, contract values, rent received, outstanding balances, and overdue collections.'}
            </p>

            <div className="flex items-center gap-3 pt-1 text-[11px] text-sand-500 dark:text-sand-400 font-medium">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-sand-500" />
                {language === 'ar' ? 'تاريخ التوليد:' : 'Generated on:'}{' '}
                <strong className="text-najdi-900 dark:text-cream-50">{formatDate(effectiveDate, 'dd MMMM yyyy', language)}</strong>
              </span>
              <span>•</span>
              <span>{language === 'ar' ? 'العملة: ريال سعودي (SAR)' : 'Currency: Saudi Riyals (SAR)'}</span>
            </div>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {/* Download Master PDF */}
            <button
              onClick={handleExportMasterPDF}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sand-500 hover:bg-sand-600 text-najdi-900 text-xs font-bold transition-all shadow-sm shadow-sand-900/30"
              title="Export A4 Landscape Statement"
            >
              <FileText className="h-4 w-4" />
              <span>{language === 'ar' ? 'تحميل تقرير PDF الشامل' : 'Download PDF Report'}</span>
            </button>

            {/* Excel Export */}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-cream-50 dark:bg-najdi-950 hover:bg-cream-200 dark:hover:bg-najdi-800 text-najdi-900 dark:text-cream-100 border border-cream-300 dark:border-najdi-700 text-xs font-semibold transition-colors shadow-xs"
            >
              <Download className="h-4 w-4 text-bronze-600" />
              <span>{language === 'ar' ? 'إكسل (.xlsx)' : 'Excel'}</span>
            </button>

            {/* CSV Export */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-cream-50 dark:bg-najdi-950 hover:bg-cream-200 dark:hover:bg-najdi-800 text-najdi-900 dark:text-cream-100 border border-cream-300 dark:border-najdi-700 text-xs font-semibold transition-colors shadow-xs"
            >
              <span>CSV</span>
            </button>

            {/* Print Button */}
            <button
              onClick={printReport}
              className="p-2.5 rounded-xl bg-cream-50 dark:bg-najdi-950 hover:bg-cream-200 dark:hover:bg-najdi-800 text-najdi-800 dark:text-cream-100 border border-cream-300 dark:border-najdi-700 text-xs font-semibold transition-colors shadow-xs"
              title="Print Statement"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          SUMMARY KPI SECTION (7 METRICS)
         ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* 1. Total Tenants */}
        <div className="p-4 rounded-2xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 shadow-xs">
          <span className="text-[10px] font-bold text-sand-500 uppercase tracking-wider block">
            {language === 'ar' ? 'إجمالي المستأجرين' : 'Total Tenants'}
          </span>
          <div className="mt-1.5 text-xl font-serif font-black text-najdi-900 dark:text-cream-50">
            {summary.totalTenants}
          </div>
          <p className="text-[10px] text-sand-400 mt-0.5">{language === 'ar' ? 'مستأجر مسجل' : 'Registered tenants'}</p>
        </div>

        {/* 2. Active Leases */}
        <div className="p-4 rounded-2xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 shadow-xs">
          <span className="text-[10px] font-bold text-sand-500 uppercase tracking-wider block">
            {language === 'ar' ? 'عقود الإيجار النشطة' : 'Active Leases'}
          </span>
          <div className="mt-1.5 text-xl font-serif font-black text-emerald-700 dark:text-emerald-400">
            {summary.activeLeases}
          </div>
          <p className="text-[10px] text-sand-400 mt-0.5">{language === 'ar' ? 'عقود جارية ومقبلة' : 'Current active'}</p>
        </div>

        {/* 3. Occupancy Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 shadow-xs">
          <span className="text-[10px] font-bold text-sand-500 uppercase tracking-wider block">
            {language === 'ar' ? 'نسبة الإشغال' : 'Occupancy Rate'}
          </span>
          <div className="mt-1.5 text-xl font-serif font-black text-najdi-900 dark:text-cream-50">
            {summary.occupancyRate}%
          </div>
          <p className="text-[10px] text-sand-400 mt-0.5">
            {summary.occupiedOffices}/{summary.totalOffices} {language === 'ar' ? 'وحدات' : 'Units'}
          </p>
        </div>

        {/* 4. Total Contract Value with VAT */}
        <div className="p-4 rounded-2xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 shadow-xs">
          <span className="text-[10px] font-bold text-sand-500 uppercase tracking-wider block">
            {language === 'ar' ? 'إجمالي العقود (مع الضريبة)' : 'Total Value (Incl VAT)'}
          </span>
          <div className="mt-1.5 text-sm sm:text-base font-serif font-black text-najdi-900 dark:text-cream-50 truncate">
            {formatSAR(summary.totalContractValueWithVat, language)}
          </div>
          <p className="text-[10px] text-sand-400 mt-0.5">
            {language === 'ar' ? `الأساسي: ${formatSAR(summary.totalBaseRent, language)}` : `Base: ${formatSAR(summary.totalBaseRent, language)}`}
          </p>
        </div>

        {/* 5. Rent Received */}
        <div className="p-4 rounded-2xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
            {language === 'ar' ? 'الإيجار المحصل' : 'Rent Received'}
          </span>
          <div className="mt-1.5 text-sm sm:text-base font-serif font-black text-emerald-700 dark:text-emerald-400 truncate">
            {formatSAR(summary.totalRentReceived, language)}
          </div>
          <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400 mt-0.5">
            {language === 'ar' ? 'تم تحصيله فعلياً' : 'Total cash collected'}
          </p>
        </div>

        {/* 6. Outstanding Rent */}
        <div className="p-4 rounded-2xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 shadow-xs">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
            {language === 'ar' ? 'الرصيد المتبقي' : 'Outstanding Rent'}
          </span>
          <div className="mt-1.5 text-sm sm:text-base font-serif font-black text-amber-700 dark:text-amber-400 truncate">
            {formatSAR(summary.totalOutstandingRent, language)}
          </div>
          <p className="text-[10px] text-amber-600/80 dark:text-amber-400 mt-0.5">
            {language === 'ar' ? 'يشمل المستحق مستقبلاً' : 'All unpaid contract balances'}
          </p>
        </div>

        {/* 7. Overdue Rent */}
        <div className={`p-4 rounded-2xl border shadow-xs ${
          summary.totalOverdueRent > 0
            ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'
            : 'bg-white dark:bg-najdi-900 border-cream-300 dark:border-najdi-800'
        }`}>
          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
            {language === 'ar' ? 'المتأخرات المستحقة' : 'Overdue Rent'}
          </span>
          <div className="mt-1.5 text-sm sm:text-base font-serif font-black text-rose-700 dark:text-rose-400 truncate">
            {formatSAR(summary.totalOverdueRent, language)}
          </div>
          <p className="text-[10px] text-rose-600/80 dark:text-rose-400 mt-0.5">
            {summary.overdueInstallmentsCount} {language === 'ar' ? 'دفعات تجاوزت موعدها' : 'past due installments'}
          </p>
        </div>
      </div>

      {/* ============================================================
          NAVIGATION TABS
         ============================================================ */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex items-center gap-2 border-b border-cream-300 dark:border-najdi-800 pb-2 min-w-max">
          <button
            onClick={() => setActiveTab('TENANT_STATEMENT')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'TENANT_STATEMENT'
                ? 'bg-sand-500 text-najdi-900 shadow-sm'
                : 'text-sand-600 dark:text-sand-400 hover:bg-cream-100 dark:hover:bg-najdi-800'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>{language === 'ar' ? 'بيان عقود وتحصيلات المستأجرين' : 'Tenant Leases Statement'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-sand-200 dark:bg-najdi-950 text-najdi-900 font-bold">
              {tenantStatementRows.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('PAYMENT_SCHEDULE')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'PAYMENT_SCHEDULE'
                ? 'bg-sand-500 text-najdi-900 shadow-sm'
                : 'text-sand-600 dark:text-sand-400 hover:bg-cream-100 dark:hover:bg-najdi-800'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>{language === 'ar' ? 'جدول استحقاق الدفعات والتحصيلات' : 'Payment Schedule & Collections'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-sand-200 dark:bg-najdi-950 text-najdi-900 font-bold">
              {scheduleRows.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('MONTHLY_CASHFLOW')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'MONTHLY_CASHFLOW'
                ? 'bg-sand-500 text-najdi-900 shadow-sm'
                : 'text-sand-600 dark:text-sand-400 hover:bg-cream-100 dark:hover:bg-najdi-800'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>{language === 'ar' ? 'التدفقات الشهرية ونسبة الإشغال' : 'Monthly Cashflow & Occupancy'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================
          TAB 1: TENANT LEASES & COLLECTIONS STATEMENT
         ============================================================ */}
      {activeTab === 'TENANT_STATEMENT' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Filter & Search Toolbar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 shadow-xs">
            <div className="relative flex-1 w-full">
              <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sand-400" />
              <input
                type="text"
                value={tenantSearchQuery}
                onChange={e => setTenantSearchQuery(e.target.value)}
                placeholder={language === 'ar' ? 'البحث باسم المستأجر، رقم الوحدة، أو رقم العقد...' : 'Search by tenant name, unit, contract #...'}
                className="w-full ps-10 pe-4 py-2 rounded-xl text-xs bg-cream-50 dark:bg-najdi-950 border border-cream-300 dark:border-najdi-700 text-najdi-900 dark:text-cream-100 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-sand-500"
              />
            </div>

            {/* Status Filter Chips */}
            <div className="inline-flex rounded-xl bg-cream-100 dark:bg-najdi-950 p-1 text-xs border border-cream-200 dark:border-najdi-800 flex-wrap">
              {(
                [
                  { id: 'ALL', label: language === 'ar' ? 'الكل' : 'All' },
                  { id: 'ACTIVE', label: language === 'ar' ? 'نشط' : 'Active' },
                  { id: 'EXPIRING_SOON', label: language === 'ar' ? 'ينتهي قريباً' : 'Expiring Soon' },
                  { id: 'HAS_OVERDUE', label: language === 'ar' ? 'به متأخرات' : 'Has Overdue' },
                  { id: 'EXPIRED', label: language === 'ar' ? 'منتهي' : 'Expired' },
                ] as const
              ).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setTenantStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    tenantStatusFilter === tab.id
                      ? 'bg-sand-500 text-najdi-900 shadow-xs'
                      : 'text-sand-600 dark:text-sand-400 hover:text-najdi-900 dark:hover:text-cream-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Statement Table */}
          <div className="overflow-hidden rounded-2xl border border-cream-300 dark:border-najdi-800 bg-white dark:bg-najdi-900 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start border-collapse">
                <thead className="bg-cream-100/95 dark:bg-najdi-850 text-sand-600 dark:text-sand-300 uppercase tracking-wider font-bold border-b border-cream-300 dark:border-najdi-800 text-[11px]">
                  <tr>
                    <th className="p-3 text-center w-8">#</th>
                    <th className="p-3 text-start">{language === 'ar' ? 'اسم المستأجر' : 'Tenant Name'}</th>
                    <th className="p-3 text-center">{language === 'ar' ? 'الوحدة' : 'Office'}</th>
                    <th className="p-3 text-center">{language === 'ar' ? 'فترة العقد' : 'Lease Period'}</th>
                    <th className="p-3 text-center">{language === 'ar' ? 'المدة' : 'Duration'}</th>
                    <th className="p-3 text-center">{language === 'ar' ? 'دورية الدفع' : 'Frequency'}</th>
                    <th className="p-3 text-end">{language === 'ar' ? 'الإيجار الأساسي' : 'Base Rent'}</th>
                    <th className="p-3 text-end">{language === 'ar' ? 'الضريبة 15%' : 'VAT 15%'}</th>
                    <th className="p-3 text-end">{language === 'ar' ? 'الإجمالي مع الضريبة' : 'Total (VAT)'}</th>
                    <th className="p-3 text-end text-emerald-700 dark:text-emerald-400">{language === 'ar' ? 'المحصل' : 'Received'}</th>
                    <th className="p-3 text-end text-amber-700 dark:text-amber-400">{language === 'ar' ? 'المتبقي' : 'Outstanding'}</th>
                    <th className="p-3 text-end text-rose-700 dark:text-rose-400">{language === 'ar' ? 'المتأخر' : 'Overdue'}</th>
                    <th className="p-3 text-center">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200 dark:divide-najdi-800 text-najdi-900 dark:text-cream-50 font-medium">
                  {filteredStatementRows.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="p-12 text-center text-sand-500 font-medium">
                        {language === 'ar' ? 'لا توجد عقود تطابق معايير البحث' : 'No contract leases found matching the selected filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredStatementRows.map((row, idx) => {
                      const badge = getContractStatusBadge(row.status);
                      return (
                        <tr key={row.contractId} className="hover:bg-cream-50/80 dark:hover:bg-najdi-850/50 transition-colors">
                          <td className="p-3 text-center text-sand-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="p-3 font-bold text-najdi-900 dark:text-cream-50">
                            <div>{language === 'ar' ? row.tenantNameAr : row.tenantName}</div>
                            <div className="text-[10px] font-mono text-sand-500 font-normal">{row.contractId}</div>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-bold px-2 py-0.5 rounded-md bg-cream-100 dark:bg-najdi-950 border border-cream-200 dark:border-najdi-800 text-najdi-800 dark:text-cream-100">
                              {row.officeNumber}
                            </span>
                          </td>
                          <td className="p-3 text-center text-[11px] text-sand-600 dark:text-sand-400">
                            {formatDate(row.startDate, 'dd/MM/yy')} - {formatDate(row.endDate, 'dd/MM/yy')}
                          </td>
                          <td className="p-3 text-center text-sand-600 dark:text-sand-400">
                            {row.durationMonths} {language === 'ar' ? 'أشهر' : 'm'}
                          </td>
                          <td className="p-3 text-center text-[11px]">
                            <span className="px-2 py-0.5 rounded-md bg-sand-100 dark:bg-najdi-950 text-najdi-800 dark:text-sand-200 border border-sand-200 dark:border-najdi-800 font-semibold">
                              {row.frequencyLabel}
                            </span>
                          </td>
                          <td className="p-3 text-end font-mono">{formatSAR(row.baseRent, language)}</td>
                          <td className="p-3 text-end font-mono text-sand-600 dark:text-sand-400">{formatSAR(row.vatAmount, language)}</td>
                          <td className="p-3 text-end font-mono font-bold text-najdi-900 dark:text-cream-50">{formatSAR(row.totalRentWithVat, language)}</td>
                          <td className="p-3 text-end font-mono font-bold text-emerald-700 dark:text-emerald-400">{formatSAR(row.rentReceived, language)}</td>
                          <td className="p-3 text-end font-mono font-bold text-amber-700 dark:text-amber-400">{formatSAR(row.outstandingBalance, language)}</td>
                          <td className={`p-3 text-end font-mono font-bold ${row.overdueAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-sand-400'}`}>
                            {formatSAR(row.overdueAmount, language)}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                              <span>{language === 'ar' ? badge.labelAr : badge.labelEn}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {/* Clear Dynamic Totals Row */}
                {filteredStatementRows.length > 0 && (
                  <tfoot className="bg-sand-100/90 dark:bg-najdi-850 font-bold text-najdi-900 dark:text-cream-50 border-t-2 border-sand-300 dark:border-najdi-700 text-xs">
                    <tr>
                      <td colSpan={6} className="p-3.5 text-start uppercase tracking-wider font-bold">
                        {language === 'ar' ? `المجموع الإجمالي (${filteredStatementRows.length} عقود):` : `Grand Totals (${filteredStatementRows.length} Leases):`}
                      </td>
                      <td className="p-3.5 text-end font-mono">{formatSAR(statementTotals.totalBaseRent, language)}</td>
                      <td className="p-3.5 text-end font-mono">{formatSAR(statementTotals.totalVat, language)}</td>
                      <td className="p-3.5 text-end font-mono text-sm">{formatSAR(statementTotals.totalContractValue, language)}</td>
                      <td className="p-3.5 text-end font-mono text-emerald-700 dark:text-emerald-400 text-sm">{formatSAR(statementTotals.totalRentReceived, language)}</td>
                      <td className="p-3.5 text-end font-mono text-amber-700 dark:text-amber-400 text-sm">{formatSAR(statementTotals.totalOutstanding, language)}</td>
                      <td className={`p-3.5 text-end font-mono text-sm ${statementTotals.totalOverdue > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-sand-500'}`}>
                        {formatSAR(statementTotals.totalOverdue, language)}
                      </td>
                      <td className="p-3.5 text-center text-[10px] text-sand-500 font-normal">
                        {language === 'ar' ? 'محسوب آلياً' : 'Live Calculated'}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 2: PAYMENT SCHEDULE & COLLECTIONS
         ============================================================ */}
      {activeTab === 'PAYMENT_SCHEDULE' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Multi-Filter Controls */}
          <div className="p-4 rounded-2xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sand-400" />
                <input
                  type="text"
                  value={scheduleSearchQuery}
                  onChange={e => setScheduleSearchQuery(e.target.value)}
                  placeholder={language === 'ar' ? 'البحث بالفاتورة، المستأجر، أو المكتب...' : 'Search invoice, tenant, unit...'}
                  className="w-full ps-9 pe-3 py-2 rounded-xl text-xs bg-cream-50 dark:bg-najdi-950 border border-cream-300 dark:border-najdi-700 text-najdi-900 dark:text-cream-100 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-sand-500"
                />
              </div>

              {/* Tenant Filter */}
              <div>
                <select
                  value={scheduleTenantFilter}
                  onChange={e => setScheduleTenantFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-cream-50 dark:bg-najdi-950 border border-cream-300 dark:border-najdi-700 text-najdi-900 dark:text-cream-100 font-semibold"
                >
                  <option value="ALL">{language === 'ar' ? 'جميع المستأجرين' : 'All Tenants'}</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Office Filter */}
              <div>
                <select
                  value={scheduleOfficeFilter}
                  onChange={e => setScheduleOfficeFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-cream-50 dark:bg-najdi-950 border border-cream-300 dark:border-najdi-700 text-najdi-900 dark:text-cream-100 font-semibold"
                >
                  <option value="ALL">{language === 'ar' ? 'جميع الوحدات' : 'All Office Units'}</option>
                  {offices.map(o => (
                    <option key={o.id} value={o.id}>{o.officeNumber}</option>
                  ))}
                </select>
              </div>

              {/* Reset Filters */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={scheduleStartDate}
                  onChange={e => setScheduleStartDate(e.target.value)}
                  className="w-1/2 px-2 py-2 rounded-xl text-[11px] bg-cream-50 dark:bg-najdi-950 border border-cream-300 dark:border-najdi-700 text-najdi-900 dark:text-cream-100"
                  title="From Date"
                />
                <input
                  type="date"
                  value={scheduleEndDate}
                  onChange={e => setScheduleEndDate(e.target.value)}
                  className="w-1/2 px-2 py-2 rounded-xl text-[11px] bg-cream-50 dark:bg-najdi-950 border border-cream-300 dark:border-najdi-700 text-najdi-900 dark:text-cream-100"
                  title="To Date"
                />
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-cream-200 dark:border-najdi-800 flex-wrap">
              <div className="inline-flex rounded-xl bg-cream-100 dark:bg-najdi-950 p-1 text-xs border border-cream-200 dark:border-najdi-800 flex-wrap">
                {(
                  [
                    { id: 'ALL', label: language === 'ar' ? 'الكل' : 'All' },
                    { id: 'OVERDUE', label: language === 'ar' ? 'المتأخرات' : 'Overdue' },
                    { id: 'DUE_SOON', label: language === 'ar' ? 'مستحق قريباً' : 'Due Soon' },
                    { id: 'UPCOMING', label: language === 'ar' ? 'مستقبلي' : 'Upcoming' },
                    { id: 'PARTIALLY_PAID', label: language === 'ar' ? 'مدفوع جزئياً' : 'Partially Paid' },
                    { id: 'PAID', label: language === 'ar' ? 'مسدد بالكامل' : 'Paid' },
                  ] as const
                ).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setScheduleStatusFilter(tab.id)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      scheduleStatusFilter === tab.id
                        ? 'bg-sand-500 text-najdi-900 shadow-xs'
                        : 'text-sand-600 dark:text-sand-400 hover:text-najdi-900 dark:hover:text-cream-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {(scheduleSearchQuery || scheduleStatusFilter !== 'ALL' || scheduleTenantFilter !== 'ALL' || scheduleOfficeFilter !== 'ALL' || scheduleStartDate || scheduleEndDate) && (
                <button
                  onClick={() => {
                    setScheduleSearchQuery('');
                    setScheduleStatusFilter('ALL');
                    setScheduleTenantFilter('ALL');
                    setScheduleOfficeFilter('ALL');
                    setScheduleStartDate('');
                    setScheduleEndDate('');
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>{language === 'ar' ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Schedule Table */}
          <div className="overflow-hidden rounded-2xl border border-cream-300 dark:border-najdi-800 bg-white dark:bg-najdi-900 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start border-collapse">
                <thead className="bg-cream-100/95 dark:bg-najdi-850 text-sand-600 dark:text-sand-300 uppercase tracking-wider font-bold border-b border-cream-300 dark:border-najdi-800 text-[11px]">
                  <tr>
                    <th className="p-3 text-start">{language === 'ar' ? 'رقم الفاتورة / الدفعة' : 'Invoice / Installment #'}</th>
                    <th className="p-3 text-start">{language === 'ar' ? 'المستأجر' : 'Tenant'}</th>
                    <th className="p-3 text-center">{language === 'ar' ? 'الوحدة' : 'Unit'}</th>
                    <th className="p-3 text-start">{language === 'ar' ? 'الوصف / الفترة' : 'Description'}</th>
                    <th className="p-3 text-center">{language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                    <th className="p-3 text-end">{language === 'ar' ? 'المبلغ المستحق' : 'Amount Due'}</th>
                    <th className="p-3 text-end text-emerald-700 dark:text-emerald-400">{language === 'ar' ? 'المسدد' : 'Paid'}</th>
                    <th className="p-3 text-end text-amber-700 dark:text-amber-400">{language === 'ar' ? 'المتبقي' : 'Remaining'}</th>
                    <th className="p-3 text-center">{language === 'ar' ? 'تاريخ السداد' : 'Payment Date'}</th>
                    <th className="p-3 text-center">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th className="p-3 text-center">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200 dark:divide-najdi-800 text-najdi-900 dark:text-cream-50 font-medium">
                  {filteredScheduleRows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-12 text-center text-sand-500 font-medium">
                        {language === 'ar' ? 'لا توجد دفعات تطابق معايير البحث' : 'No payment installments found matching criteria.'}
                      </td>
                    </tr>
                  ) : (
                    filteredScheduleRows.map(inst => {
                      const badge = getPaymentStatusBadge(inst.status);
                      const isPastDue = inst.daysOverdue > 0 && inst.remainingAmount > 0;

                      return (
                        <tr key={inst.id} className="hover:bg-cream-50/80 dark:hover:bg-najdi-850/50 transition-colors">
                          <td className="p-3 font-mono font-bold text-najdi-900 dark:text-cream-50 text-[11px]">
                            {inst.invoiceNumber}
                          </td>
                          <td className="p-3 font-bold text-najdi-900 dark:text-cream-50">
                            {language === 'ar' ? inst.tenantNameAr : inst.tenantName}
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-bold px-2 py-0.5 rounded-md bg-cream-100 dark:bg-najdi-950 border border-cream-200 dark:border-najdi-800 text-najdi-800 dark:text-cream-100">
                              {inst.officeNumber}
                            </span>
                          </td>
                          <td className="p-3 text-sand-600 dark:text-sand-400 text-[11px] max-w-xs truncate">
                            {inst.periodLabel}
                          </td>
                          <td className="p-3 text-center">
                            <div className="font-semibold text-najdi-900 dark:text-cream-100">
                              {formatDate(inst.dueDate, 'dd/MM/yyyy')}
                            </div>
                            {isPastDue && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
                                {inst.daysOverdue} {language === 'ar' ? 'يوم تأخير' : 'd overdue'}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-end font-mono font-bold text-najdi-900 dark:text-cream-50">{formatSAR(inst.totalAmount, language)}</td>
                          <td className="p-3 text-end font-mono font-bold text-emerald-700 dark:text-emerald-400">{formatSAR(inst.paidAmount, language)}</td>
                          <td className={`p-3 text-end font-mono font-bold ${isPastDue ? 'text-rose-600 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}`}>
                            {formatSAR(inst.remainingAmount, language)}
                          </td>
                          <td className="p-3 text-center text-sand-600 dark:text-sand-400 text-[11px]">
                            {inst.paymentDate ? formatDate(inst.paymentDate, 'dd/MM/yyyy') : '-'}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                              <span>{language === 'ar' ? badge.labelAr : badge.labelEn}</span>
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Record Payment Button */}
                              {inst.remainingAmount > 0 && isAdmin && (
                                <button
                                  onClick={() => setSelectedInstallmentForPayment(inst)}
                                  className="px-2.5 py-1 rounded-lg bg-sand-500 hover:bg-sand-600 text-najdi-900 font-bold text-[11px] transition-all shadow-xs"
                                  title="Record Payment"
                                >
                                  {language === 'ar' ? 'تحصيل' : 'Pay'}
                                </button>
                              )}

                              {/* Edit Installment (Admin) */}
                              {isAdmin && (
                                <button
                                  onClick={() => setSelectedInstallmentForEdit(inst)}
                                  className="p-1 rounded-lg hover:bg-cream-200 dark:hover:bg-najdi-800 text-sand-600 dark:text-sand-300 transition-colors"
                                  title="Adjust Due Date / Amount"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                              )}

                              {/* Print Receipt Voucher */}
                              {inst.paidAmount > 0 && (
                                <button
                                  onClick={() => setSelectedInstallmentForReceipt(inst)}
                                  className="p-1 rounded-lg hover:bg-cream-200 dark:hover:bg-najdi-800 text-bronze-600 transition-colors"
                                  title="Print Receipt Voucher"
                                >
                                  <Receipt className="h-3.5 w-3.5" />
                                </button>
                              )}

                              {/* Delete Installment (Admin) */}
                              {isAdmin && (
                                <button
                                  onClick={() => setInstallmentToDelete(inst)}
                                  className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/40 text-sand-400 hover:text-red-600 transition-colors"
                                  title={language === 'ar' ? 'حذف الدفعة' : 'Delete Installment'}
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
                {/* Totals Row */}
                {filteredScheduleRows.length > 0 && (
                  <tfoot className="bg-sand-100/90 dark:bg-najdi-850 font-bold text-najdi-900 dark:text-cream-50 border-t-2 border-sand-300 dark:border-najdi-700 text-xs">
                    <tr>
                      <td colSpan={5} className="p-3.5 text-start uppercase tracking-wider font-bold">
                        {language === 'ar' ? `المجموع الإجمالي (${filteredScheduleRows.length} دفعات):` : `Schedule Totals (${filteredScheduleRows.length} Installments):`}
                      </td>
                      <td className="p-3.5 text-end font-mono text-sm">{formatSAR(scheduleTotals.totalDue, language)}</td>
                      <td className="p-3.5 text-end font-mono text-emerald-700 dark:text-emerald-400 text-sm">{formatSAR(scheduleTotals.totalPaid, language)}</td>
                      <td className="p-3.5 text-end font-mono text-amber-700 dark:text-amber-400 text-sm">{formatSAR(scheduleTotals.totalRemaining, language)}</td>
                      <td colSpan={3} className="p-3.5 text-center text-[10px] text-sand-500 font-normal">
                        {language === 'ar' ? 'محسوب آلياً' : 'Live Calculated'}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 3: MONTHLY CASHFLOW & OCCUPANCY
         ============================================================ */}
      {activeTab === 'MONTHLY_CASHFLOW' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Monthly Collections Chart */}
          <div className="rounded-3xl border border-cream-300 dark:border-najdi-800 bg-white dark:bg-najdi-900 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-serif font-bold text-najdi-900 dark:text-cream-50">
                  {language === 'ar' ? 'التدفقات النقدية والتحصيلات الشهرية (ر.س)' : 'Monthly Collections vs. Scheduled Rent (SAR)'}
                </h3>
                <p className="text-xs text-sand-500 mt-0.5">
                  {language === 'ar' ? `إجمالي المحصل الفعلي للعام الحالي: ${formatSAR(totalCollectedYear, language)}` : `Total actual cash collected this year: ${formatSAR(totalCollectedYear, language)}`}
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#b89045" opacity={0.15} />
                  <XAxis dataKey="name" stroke="#8a7968" fontSize={11} />
                  <YAxis stroke="#8a7968" fontSize={11} tickFormatter={val => (val / 1000) + 'k'} />
                  <Tooltip
                    formatter={(val: number) => [formatSAR(val, language), language === 'ar' ? 'المحصل' : 'Collected']}
                    contentStyle={{ backgroundColor: '#2a1a10', borderRadius: '12px', color: '#f7f1e7', border: '1px solid #4a3426', fontSize: '12px' }}
                  />
                  <Bar dataKey="collected" fill="#c9a66b" radius={[6, 6, 0, 0]} name="Collected (المحصل)" />
                  <Bar dataKey="scheduled" fill="#e2c99a" opacity={0.4} radius={[6, 6, 0, 0]} name="Scheduled (المجدول)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Occupancy Units Grid */}
          <div className="overflow-hidden rounded-2xl border border-cream-300 dark:border-najdi-800 bg-white dark:bg-najdi-900 shadow-sm">
            <div className="p-4 border-b border-cream-200 dark:border-najdi-800 bg-cream-50/70 dark:bg-najdi-950 flex items-center justify-between">
              <h4 className="text-sm font-bold text-najdi-900 dark:text-cream-50 font-serif">
                {language === 'ar' ? 'سجل إشغال الوحدات والمكاتب' : 'Building Units & Occupancy Breakdown'}
              </h4>
              <span className="text-xs font-bold text-sand-600 dark:text-sand-400">
                {occupancyStats.occupied}/{occupancyStats.total} {language === 'ar' ? 'مشغول' : 'Occupied'} ({occupancyStats.rate}%)
              </span>
            </div>

            <table className="w-full text-xs text-start">
              <thead className="bg-cream-100/90 dark:bg-najdi-850 text-sand-600 dark:text-sand-400 uppercase tracking-wider font-semibold border-b border-cream-300 dark:border-najdi-800">
                <tr>
                  <th className="p-4 text-start">{t('office_unit')}</th>
                  <th className="p-4 text-start">{language === 'ar' ? 'الدور' : 'Floor'}</th>
                  <th className="p-4 text-start">{language === 'ar' ? 'المستأجر الحالي' : 'Current Tenant'}</th>
                  <th className="p-4 text-start">{language === 'ar' ? 'مدة العقد' : 'Lease Duration'}</th>
                  <th className="p-4 text-start">{language === 'ar' ? 'تاريخ انتهاء العقد' : 'Lease Expiration'}</th>
                  <th className="p-4 text-center">{t('status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200 dark:divide-najdi-800">
                {occupancyStats.unitList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sand-400">
                      {language === 'ar' ? 'لا توجد وحدات مضافة بعد' : 'No office units registered yet.'}
                    </td>
                  </tr>
                ) : (
                  occupancyStats.unitList.map(unit => (
                    <tr key={unit.id} className="hover:bg-cream-50/70 dark:hover:bg-najdi-850/40">
                      <td className="p-4 font-bold text-najdi-900 dark:text-cream-50">{unit.officeNumber}</td>
                      <td className="p-4 text-sand-600 dark:text-sand-400">Floor {unit.floor}</td>
                      <td className="p-4 font-semibold text-najdi-900 dark:text-cream-100">{unit.tenantName}</td>
                      <td className="p-4 text-sand-600 dark:text-sand-400">{unit.contractDuration}</td>
                      <td className="p-4 text-sand-600 dark:text-sand-400">{unit.contractEnd !== 'N/A' ? formatDate(unit.contractEnd, 'dd/MM/yyyy') : 'N/A'}</td>
                      <td className="p-4 text-center">
                        <Badge variant={unit.status === 'OCCUPIED' ? 'sand' : 'clay'} size="sm">
                          {unit.status === 'OCCUPIED' ? (language === 'ar' ? 'مشغول' : 'Occupied') : (language === 'ar' ? 'شاغر' : 'Vacant')}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================
          RECORD PAYMENT MODAL
         ============================================================ */}
      <RecordPaymentModal
        isOpen={!!selectedInstallmentForPayment}
        onClose={() => setSelectedInstallmentForPayment(null)}
        installment={selectedInstallmentForPayment}
      />

      {/* ============================================================
          EDIT / ADJUST INSTALLMENT MODAL
         ============================================================ */}
      <EditInstallmentModal
        isOpen={!!selectedInstallmentForEdit}
        onClose={() => setSelectedInstallmentForEdit(null)}
        installment={selectedInstallmentForEdit}
      />

      {/* ============================================================
          PRINT RECEIPT VOUCHER MODAL
         ============================================================ */}
      <ReceiptVoucherModal
        isOpen={!!selectedInstallmentForReceipt}
        onClose={() => setSelectedInstallmentForReceipt(null)}
        installment={selectedInstallmentForReceipt}
      />

      {/* Delete Installment Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!installmentToDelete}
        onClose={() => setInstallmentToDelete(null)}
        onConfirm={() => {
          if (installmentToDelete) {
            deletePayment(installmentToDelete.id);
            setInstallmentToDelete(null);
          }
        }}
        title={language === 'ar' ? 'تأكيد حذف الدفعة' : 'Confirm Delete Payment'}
        message={
          language === 'ar'
            ? `هل أنت متأكد من حذف الدفعة (${installmentToDelete?.invoiceNumber || ''}) بمبلغ ${installmentToDelete?.totalAmount ? formatSAR(installmentToDelete.totalAmount, language) : ''}؟`
            : `Are you sure you want to permanently delete payment installment (${installmentToDelete?.invoiceNumber || ''}) for ${installmentToDelete?.totalAmount ? formatSAR(installmentToDelete.totalAmount, language) : ''}?`
        }
        confirmText={language === 'ar' ? 'نعم، حذف نهائي' : 'Yes, Delete Permanently'}
        variant="danger"
      />
    </div>
  );
};
