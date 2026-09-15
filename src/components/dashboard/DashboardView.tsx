import React, { useMemo } from 'react';
import {
  Building2,
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Clock,
  DollarSign,
  Download,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { StatsCard } from '../common/StatsCard';
import { NajdiSkylineBackdrop, NajdiPatternDivider } from '../common/NajdiMotifs';
import { formatSAR, formatDate, formatPaymentFrequency } from '../../utils/formatters';
import { calculateDaysOverdue, calculateContractFinancials } from '../../utils/calculations';
import { exportToPDF } from '../../utils/exportHelpers';

interface DashboardViewProps {
  onNavigate: (view: string, id?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { tenants, offices, contracts, payments, settings, effectiveDate } = useData();
  const { language, t } = useLanguage();
  const { isAdmin } = useAuth();

  // --- Financial & Operational KPIs ---
  const kpis = useMemo(() => {
    const totalOffices = offices.length;
    const occupiedOffices = offices.filter(o => o.status === 'OCCUPIED').length;
    const vacantOffices = totalOffices - occupiedOffices;
    const occupancyRate = totalOffices > 0 ? Math.round((occupiedOffices / totalOffices) * 100) : 0;

    const activeTenants = tenants.filter(t => t.status === 'ACTIVE').length;
    const validContracts = contracts.filter(c => c.status !== 'CANCELLED');
    const validContractIds = new Set(validContracts.map(c => c.id));
    const activeContracts = validContracts.filter(c => c.status === 'ACTIVE' || c.status === 'EXPIRING_SOON').length;

    const totalContractValueWithVAT = validContracts.reduce((sum, c) => sum + (c.totalRent || 0), 0);
    const validPayments = payments.filter(p => validContractIds.has(p.contractId));
    const totalCollected = validPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const totalOutstanding = validPayments.reduce((sum, p) => sum + (p.remainingAmount || 0), 0);

    const overdueList = validPayments.filter(
      p => p.remainingAmount > 0 && (p.status === 'OVERDUE' || calculateDaysOverdue(p.dueDate, effectiveDate) > 0)
    );
    const totalOverdue = overdueList.reduce((sum, p) => sum + p.remainingAmount, 0);

    return {
      totalOffices,
      occupiedOffices,
      vacantOffices,
      occupancyRate,
      activeTenants,
      activeContracts,
      totalContractValueWithVAT,
      totalCollected,
      totalOutstanding,
      totalOverdue,
      overdueCount: overdueList.length,
      overdueList: overdueList
        .map(p => {
          const tenant = tenants.find(t => t.id === p.tenantId);
          const office = offices.find(o => o.id === p.officeId);
          return {
            ...p,
            tenantName: tenant?.name || 'N/A',
            officeNumber: office?.officeNumber || 'Unit',
            daysOverdue: calculateDaysOverdue(p.dueDate, effectiveDate),
          };
        })
        .sort((a, b) => b.daysOverdue - a.daysOverdue),
    };
  }, [offices, tenants, contracts, payments, effectiveDate]);

  // --- Monthly Collections Data for Chart (Jan - Dec) ---
  const monthlyCashflowData = useMemo(() => {
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
      const targetPrefix = `${currentYear}-${m.num}`;
      const collectedInMonth = payments.reduce((sum, p) => {
        if (!p.transactions || p.transactions.length === 0) {
          if (p.paymentDate && p.paymentDate.startsWith(targetPrefix)) {
            return sum + (p.paidAmount || 0);
          }
          return sum;
        }
        const txSum = p.transactions
          .filter(tx => tx.paymentDate && tx.paymentDate.startsWith(targetPrefix))
          .reduce((s, tx) => s + tx.amount, 0);
        return sum + txSum;
      }, 0);

      return {
        month: language === 'ar' ? m.ar : m.en,
        collected: collectedInMonth,
      };
    });
  }, [payments, language]);

  // Master PDF Download Handler
  const handleExportPDF = () => {
    const todayDate = new Date().toISOString().split('T')[0];
    const bName = 'Alabdullatif Center - مركز العبداللطيف';

    const totalWithVAT = contracts.reduce((s, c) => s + c.totalRent, 0);
    const totalBaseRent = contracts.reduce((s, c) => s + c.baseRent, 0);
    const totalVAT = contracts.reduce((s, c) => s + (c.vatAmount || 0), 0);
    const totalReceived = payments.reduce((s, p) => s + (p.paidAmount || 0), 0);
    const totalOutstanding = payments.reduce((s, p) => s + (p.remainingAmount || 0), 0);

    const pdfData = contracts.map((c, index) => {
      const tenant = tenants.find(t => t.id === c.tenantId);
      const office = offices.find(o => o.id === c.officeId);
      const fin = calculateContractFinancials(c, payments, effectiveDate);

      return {
        index: index + 1,
        tenantName: tenant?.name || 'N/A',
        officeNumber: office?.officeNumber || 'Unit',
        contractDate: `${formatDate(c.startDate, 'dd/MM/yy')} - ${formatDate(c.endDate, 'dd/MM/yy')}`,
        duration: `${c.durationMonths}m`,
        frequency: formatPaymentFrequency(c.paymentFrequency, 'en'),
        baseRent: formatSAR(fin.baseRent, 'en'),
        vatAmount: formatSAR(fin.vatAmount, 'en'),
        totalRent: formatSAR(fin.totalRentWithVat, 'en'),
        received: formatSAR(fin.rentReceived, 'en'),
        outstanding: formatSAR(fin.outstandingBalance, 'en'),
        overdue: formatSAR(fin.overdueAmount, 'en'),
        status: c.status,
      };
    });

    const totalsRow = {
      index: 'TOTALS',
      tenantName: `${contracts.length} Leases`,
      officeNumber: '-',
      contractDate: '-',
      duration: '-',
      frequency: '-',
      baseRent: formatSAR(totalBaseRent, 'en'),
      vatAmount: formatSAR(totalVAT, 'en'),
      totalRent: formatSAR(totalWithVAT, 'en'),
      received: formatSAR(totalReceived, 'en'),
      outstanding: formatSAR(totalOutstanding, 'en'),
      overdue: formatSAR(kpis.totalOverdue, 'en'),
      status: '-',
    };

    exportToPDF({
      filename: `Alabdullatif_Tower_Financial_Report_${todayDate}`,
      title: 'Tenant Leases, Rent & Collections Financial Report',
      subtitle: 'Comprehensive statement of tenant count, active leases, contract values, rent received, outstanding balances, and overdue collections.',
      buildingName: `${bName} Commercial Property Management`,
      summaryCards: [
        { label: 'Total Tenants', value: String(tenants.length) },
        { label: 'Active Leases', value: String(kpis.activeContracts) },
        { label: 'Occupancy Rate', value: `${kpis.occupancyRate}% (${kpis.occupiedOffices}/${kpis.totalOffices})` },
        { label: 'Total Value (VAT)', value: formatSAR(totalWithVAT, 'en') },
        { label: 'Rent Received', value: formatSAR(totalReceived, 'en') },
        { label: 'Outstanding Rent', value: formatSAR(totalOutstanding, 'en') },
        { label: 'Overdue Rent', value: formatSAR(kpis.totalOverdue, 'en') },
      ],
      columns: [
        { header: '#', key: 'index', width: 6, align: 'center' },
        { header: 'Tenant Name', key: 'tenantName', width: 26, align: 'left' },
        { header: 'Office', key: 'officeNumber', width: 12, align: 'center' },
        { header: 'Lease Period', key: 'contractDate', width: 22, align: 'center' },
        { header: 'Dur', key: 'duration', width: 8, align: 'center' },
        { header: 'Frequency', key: 'frequency', width: 14, align: 'center' },
        { header: 'Base Rent', key: 'baseRent', width: 18, align: 'right' },
        { header: 'VAT (15%)', key: 'vatAmount', width: 16, align: 'right' },
        { header: 'Total Value', key: 'totalRent', width: 20, align: 'right' },
        { header: 'Received', key: 'received', width: 18, align: 'right' },
        { header: 'Outstanding', key: 'outstanding', width: 20, align: 'right' },
        { header: 'Overdue', key: 'overdue', width: 18, align: 'right' },
        { header: 'Status', key: 'status', width: 14, align: 'center' },
      ],
      data: pdfData,
      totalsRow,
      orientation: 'landscape',
    });
  };

  const isBrandNew = offices.length === 0 && tenants.length === 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Hero Header with Subtle Najdi Architectural Skyline */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-najdi-950 via-najdi-900 to-najdi-850 p-6 sm:p-8 text-cream-50 border border-bronze-500/25 shadow-xl">
        <NajdiSkylineBackdrop />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-najdi-800/80 border border-bronze-500/30 text-bronze-300 text-xs font-semibold">
              <span>{language === 'ar' ? 'بوابة إدارة الأملاك التجارية' : 'Commercial Real Estate Portal'}</span>
              <span>•</span>
              <span>{language === 'ar' ? 'الرياض' : 'Riyadh, KSA'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-cream-50 tracking-tight">
              {language === 'ar' ? 'مركز العبداللطيف' : 'Alabdullatif Center'}
            </h1>

            <p className="text-xs sm:text-sm text-sand-300 max-w-xl leading-relaxed">
              {language === 'ar'
                ? 'متابعة نسبة الإشغال، عقود الإيجار، التحصيلات المالية، والمتأخرات وفق أعلى معايير الحوكمة العقارية.'
                : 'Real-time occupancy tracking, tenant contracts, VAT-compliant rent collections, and arrears management.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* PDF Report Download Button */}
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sand-500 hover:bg-sand-600 text-najdi-900 text-xs font-bold transition-all shadow-md shadow-sand-900/30"
            >
              <Download className="h-4 w-4" />
              <span>{language === 'ar' ? 'تحميل تقرير PDF' : 'Download PDF Report'}</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => onNavigate('contracts')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bronze-500 hover:bg-bronze-400 text-najdi-950 text-xs font-bold transition-all shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span>{language === 'ar' ? 'إضافة عقد جديد' : 'New Contract'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Onboarding Welcome if brand new */}
      {isBrandNew && (
        <div className="p-6 rounded-3xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-bold">
              ✦
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-najdi-900 dark:text-cream-50">
                {language === 'ar' ? 'مرحباً بك في نظام مركز العبداللطيف' : 'Welcome to Alabdullatif Center Management'}
              </h3>
              <p className="text-xs text-sand-500">
                {language === 'ar'
                  ? 'ابدأ بإضافة الوحدات والمكاتب، ثم تسجيل المستأجرين وإنشاء عقود الإيجار.'
                  : 'Get started by creating office units, adding tenants, and issuing lease agreements.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('offices')}
              className="px-4 py-2 rounded-xl bg-sand-500 hover:bg-sand-600 text-najdi-900 text-xs font-bold transition-colors shadow-xs"
            >
              + {language === 'ar' ? 'إضافة أول مكتب / وحدة' : 'Add First Office Unit'}
            </button>
            <button
              onClick={() => onNavigate('tenants')}
              className="px-4 py-2 rounded-xl bg-cream-200 dark:bg-najdi-800 text-najdi-900 dark:text-cream-100 text-xs font-bold border border-cream-300 dark:border-najdi-700 hover:bg-cream-300 transition-colors"
            >
              + {language === 'ar' ? 'إضافة مستأجر' : 'Add Tenant'}
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid - Warm Najdi Styling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Total Tenants */}
        <StatsCard
          title={language === 'ar' ? 'إجمالي المستأجرين' : 'Active Tenants'}
          value={kpis.activeTenants}
          subtitle={language === 'ar' ? `${tenants.length} مسجلين بالنظام` : `${tenants.length} total registered`}
          icon={Users}
          colorScheme="clay"
          onClick={() => onNavigate('tenants')}
        />

        {/* 2. Occupancy Rate */}
        <StatsCard
          title={language === 'ar' ? 'نسبة إشغال البرج' : 'Occupancy Rate'}
          value={`${kpis.occupancyRate}%`}
          subtitle={
            language === 'ar'
              ? `${kpis.occupiedOffices} مؤجر • ${kpis.vacantOffices} شاغر`
              : `${kpis.occupiedOffices} leased • ${kpis.vacantOffices} vacant`
          }
          icon={Building2}
          colorScheme="bronze"
          badge={kpis.occupancyRate >= 80 ? 'إشغال ممتاز' : 'متاح للتأجير'}
          onClick={() => onNavigate('offices')}
        />

        {/* 3. Total Contracts Value */}
        <StatsCard
          title={language === 'ar' ? 'إجمالي قيمة العقود (شامل الضريبة)' : 'Total Contract Value (Incl VAT)'}
          value={formatSAR(kpis.totalContractValueWithVAT, language)}
          subtitle={language === 'ar' ? `${kpis.activeContracts} عقود نشطة` : `${kpis.activeContracts} active leases`}
          icon={FileText}
          colorScheme="sand"
          onClick={() => onNavigate('contracts')}
        />

        {/* 4. Total Rent Collected */}
        <StatsCard
          title={language === 'ar' ? 'المحصل الفعلي' : 'Total Rent Collected'}
          value={formatSAR(kpis.totalCollected, language)}
          subtitle={language === 'ar' ? 'دفعات مسددة ومؤكدة' : 'Confirmed payments received'}
          icon={CheckCircle2}
          colorScheme="sand"
          onClick={() => onNavigate('payments')}
        />

        {/* 5. Outstanding Rent */}
        <StatsCard
          title={language === 'ar' ? 'المتبقي المستحق' : 'Outstanding Balance'}
          value={formatSAR(kpis.totalOutstanding, language)}
          subtitle={language === 'ar' ? 'إجمالي مبالغ الدفعات المتبقية' : 'Remaining lease installments'}
          icon={Clock}
          colorScheme="clay"
          onClick={() => onNavigate('payments')}
        />

        {/* 6. Overdue Payments */}
        <StatsCard
          title={language === 'ar' ? 'الدفعات المتأخرة' : 'Total Overdue Rent'}
          value={formatSAR(kpis.totalOverdue, language)}
          subtitle={
            language === 'ar'
              ? `${kpis.overdueCount} دفعات متأخرة السداد`
              : `${kpis.overdueCount} installment${kpis.overdueCount === 1 ? '' : 's'} past due date`
          }
          icon={AlertCircle}
          colorScheme="rose"
          badge={kpis.overdueCount > 0 ? `${kpis.overdueCount} متأخرة` : 'لا توجد متأخرات'}
          onClick={() => onNavigate('payments')}
        />
      </div>

      {/* Middle Section: Collections Chart & Overdue List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Collections Bar Chart (Terracotta / Sand) */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-cream-200 dark:border-najdi-800">
            <div>
              <h3 className="text-sm font-serif font-bold text-najdi-900 dark:text-cream-50">
                {language === 'ar' ? 'التحصيلات الشهرية (ريال سعودي)' : 'Monthly Rent Collections (SAR)'}
              </h3>
              <p className="text-xs text-sand-500">
                {language === 'ar' ? 'التدفقات النقدية المحصلة فعلياً لعام 2026' : 'Actual cash inflow collected for 2026'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-bold">
              <TrendingUp className="h-4 w-4" />
              <span>{formatSAR(kpis.totalCollected, language)}</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyCashflowData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ebe3d5" opacity={0.6} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#7a6358' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#7a6358' }}
                  tickFormatter={val => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                />
                <Tooltip
                  formatter={(value: any) => [formatSAR(Number(value) || 0, language), language === 'ar' ? 'المحصل' : 'Collected']}
                  contentStyle={{
                    backgroundColor: '#1c1512',
                    borderColor: '#43342d',
                    borderRadius: '16px',
                    color: '#faf7f2',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
                  }}
                />
                <Bar
                  dataKey="collected"
                  fill="#b8502d"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={38}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overdue Payments Card List */}
        <div className="rounded-3xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-cream-200 dark:border-najdi-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-danger-600" />
                <h3 className="text-sm font-serif font-bold text-najdi-900 dark:text-cream-50">
                  {language === 'ar' ? 'أبرز المتأخرات' : 'Overdue Notices'}
                </h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-danger-50 text-danger-700 dark:bg-danger-950 dark:text-danger-300">
                {kpis.overdueCount} {language === 'ar' ? 'دفعات' : 'items'}
              </span>
            </div>

            <div className="mt-3 space-y-2.5 max-h-60 overflow-y-auto">
              {kpis.overdueList.length === 0 ? (
                <div className="py-10 text-center text-xs text-sand-500">
                  <CheckCircle2 className="h-6 w-6 text-sand-500 mx-auto mb-1.5 opacity-80" />
                  <p>{language === 'ar' ? 'لا توجد دفعات متأخرة حالياً' : 'All rent payments are up to date!'}</p>
                </div>
              ) : (
                kpis.overdueList.slice(0, 4).map(item => (
                  <div
                    key={item.id}
                    onClick={() => onNavigate('payments', item.id)}
                    className="p-3 rounded-2xl bg-cream-50 dark:bg-najdi-850 hover:bg-cream-100 transition-colors cursor-pointer border border-cream-200 dark:border-najdi-800 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-najdi-900 dark:text-cream-50 mb-0.5">
                      <span className="truncate">{item.tenantName}</span>
                      <span className="text-danger-600 dark:text-danger-400">
                        {formatSAR(item.remainingAmount, language)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-sand-500">
                      <span>{language === 'ar' ? `مكتب ${item.officeNumber}` : `Office ${item.officeNumber}`}</span>
                      <span className="text-danger-600 font-semibold">
                        {item.daysOverdue} {language === 'ar' ? 'يوم تأخير' : 'days late'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('payments')}
            className="w-full py-2.5 rounded-xl bg-cream-100 dark:bg-najdi-850 text-najdi-800 dark:text-sand-200 hover:bg-cream-200 text-xs font-bold border border-cream-300 dark:border-najdi-700 transition-colors flex items-center justify-center gap-1"
          >
            <span>{language === 'ar' ? 'عرض جدول الدفعات بالكامل' : 'View All Payment Schedules'}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
