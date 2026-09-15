import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Info,
  Building2,
  Users,
  Layers,
  Calculator,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { calculateContractAccrual } from '../../utils/calculations';
import { formatSAR, formatDate } from '../../utils/formatters';
import { exportToExcel, exportToPDF, exportToCSV, printReport } from '../../utils/exportHelpers';

export const AccruedRentalView: React.FC = () => {
  const { contracts, tenants, offices, payments, effectiveDate, settings } = useData();
  const { language, t } = useLanguage();

  const [reportDate, setReportDate] = useState<string>(effectiveDate);

  // Calculate Accruals for all non-cancelled contracts as of reportDate
  const accrualData = useMemo(() => {
    return contracts
      .filter(c => c.status !== 'CANCELLED')
      .map(contract => {
        const tenant = tenants.find(t => t.id === contract.tenantId);
        const office = offices.find(o => o.id === contract.officeId);
        return calculateContractAccrual(contract, payments, tenant, office, reportDate);
      })
      .sort((a, b) => b.earnedToDate - a.earnedToDate);
  }, [contracts, tenants, offices, payments, reportDate]);

  // Aggregate Totals
  const totals = useMemo(() => {
    const totalContractValue = accrualData.reduce((sum, item) => sum + item.contractValue, 0);
    const totalEarnedToDate = accrualData.reduce((sum, item) => sum + item.earnedToDate, 0);
    const totalAmountReceived = accrualData.reduce((sum, item) => sum + item.amountReceived, 0);
    const totalAccruedAmount = accrualData.reduce((sum, item) => sum + item.accruedAmount, 0);
    const totalOutstanding = accrualData.reduce((sum, item) => sum + item.outstandingAmount, 0);

    return {
      totalContractValue,
      totalEarnedToDate,
      totalAmountReceived,
      totalAccruedAmount,
      totalOutstanding,
    };
  }, [accrualData]);

  const buildingTitle = settings.buildingName || (language === 'ar' ? 'العقار التجاري' : 'Commercial Property');

  // Export handlers
  const handleExportExcel = () => {
    exportToExcel({
      filename: `Accrued_Rental_Income_Report_${reportDate}`,
      sheetName: 'Accrued Rent',
      title: `${buildingTitle} - Accrued Rental Income Report (As of: ${reportDate})`,
      columns: [
        { header: 'Contract ID', key: 'contractId', width: 16 },
        { header: 'Tenant Name', key: 'tenantName', width: 28 },
        { header: 'Office Unit', key: 'officeNumber', width: 14 },
        { header: 'Start Date', key: 'startDate', width: 14 },
        { header: 'End Date', key: 'endDate', width: 14 },
        { header: 'Contract Value (SAR)', key: 'contractValue', width: 20 },
        { header: 'Earned to Date (SAR)', key: 'earnedToDate', width: 20 },
        { header: 'Cash Received (SAR)', key: 'amountReceived', width: 20 },
        { header: 'Accrued Rent (SAR)', key: 'accruedAmount', width: 20 },
        { header: 'Total Outstanding (SAR)', key: 'outstandingAmount', width: 22 },
        { header: 'Progress %', key: 'progressPercent', width: 14 },
      ],
      data: accrualData,
    });
  };

  const handleExportCSV = () => {
    exportToCSV(
      `Accrued_Rental_Income_${reportDate}`,
      [
        { header: 'Contract ID', key: 'contractId' },
        { header: 'Tenant Name', key: 'tenantName' },
        { header: 'Office Unit', key: 'officeNumber' },
        { header: 'Start Date', key: 'startDate' },
        { header: 'End Date', key: 'endDate' },
        { header: 'Contract Value', key: 'contractValue' },
        { header: 'Earned to Date', key: 'earnedToDate' },
        { header: 'Cash Received', key: 'amountReceived' },
        { header: 'Accrued Rent', key: 'accruedAmount' },
        { header: 'Total Outstanding', key: 'outstandingAmount' },
      ],
      accrualData
    );
  };

  const handleExportPDF = () => {
    exportToPDF({
      filename: `Accrued_Rental_Report_${reportDate}`,
      title: 'Accrued Rental Income & Revenue Recognition Report',
      subtitle: `Reporting As of Date: ${formatDate(reportDate, 'dd MMMM yyyy')}`,
      columns: [
        { header: 'Contract', key: 'contractId' },
        { header: 'Tenant', key: 'tenantName' },
        { header: 'Unit', key: 'officeNumber' },
        { header: 'Start - End', key: 'startDate' },
        { header: 'Base Rent', key: 'contractValue' },
        { header: 'Earned to Date', key: 'earnedToDate' },
        { header: 'Cash Received', key: 'amountReceived' },
        { header: 'Accrued Rent', key: 'accruedAmount' },
      ],
      data: accrualData.map(item => ({
        ...item,
        startDate: `${item.startDate} to ${item.endDate}`,
        contractValue: formatSAR(item.contractValue, 'en'),
        earnedToDate: formatSAR(item.earnedToDate, 'en'),
        amountReceived: formatSAR(item.amountReceived, 'en'),
        accruedAmount: formatSAR(item.accruedAmount, 'en'),
      })),
      summaryCards: [
        { label: 'Total Base Leases', value: formatSAR(totals.totalContractValue, 'en') },
        { label: 'Total Earned to Date', value: formatSAR(totals.totalEarnedToDate, 'en') },
        { label: 'Total Cash Received', value: formatSAR(totals.totalAmountReceived, 'en') },
        { label: 'Net Accrued Receivable', value: formatSAR(totals.totalAccruedAmount, 'en') },
      ],
      orientation: 'landscape',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-najdi-900 dark:text-cream-50 flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <TrendingUp className="h-6 w-6" />
            </div>
            <span>{t('accrued_rental')}</span>
          </h2>
          <p className="text-xs text-sand-500 dark:text-sand-400 mt-1">
            {language === 'ar' ? 'تقرير الإيراد الإيجاري المستحق والاعتراف بالإيراد في مركز العبداللطيف' : 'Accrual accounting revenue recognition earned up to the specified cut-off date for Alabdullatif Center'}
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bronze-600 hover:bg-bronze-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>{t('export_excel')}</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sand-500 hover:bg-sand-600 text-najdi-900 text-xs font-semibold shadow-xs transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{t('export_pdf')}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cream-50 dark:bg-najdi-900 border border-cream-300 dark:border-najdi-700 text-najdi-800 dark:text-cream-200 text-xs font-semibold hover:bg-cream-100 transition-colors shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{t('export_csv')}</span>
          </button>

          <button
            onClick={printReport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cream-50 dark:bg-najdi-900 border border-cream-300 dark:border-najdi-700 text-najdi-800 dark:text-cream-200 text-xs font-semibold hover:bg-cream-100 transition-colors shadow-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>{t('print')}</span>
          </button>
        </div>
      </div>

      {/* Dynamic "As Of Date" Selector Bar & Accounting Formula Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Date Selector */}
        <div className="p-4 rounded-2xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-najdi-900 dark:text-cream-50">{language === 'ar' ? 'تاريخ التقرير' : 'Reporting Cut-Off Date'}</p>
              <p className="text-[11px] text-sand-400">{language === 'ar' ? 'احتساب الاستحقاق حتى هذا التاريخ' : 'Accrue earned rent as of this date'}</p>
            </div>
          </div>

          <input
            type="date"
            value={reportDate}
            onChange={e => setReportDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-cream-300 dark:border-najdi-700 text-xs font-bold bg-cream-50 dark:bg-najdi-950 text-najdi-900 dark:text-cream-100 focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Formula Explainer */}
        <div className="lg:col-span-2 p-4 rounded-2xl bg-cream-100/70 dark:bg-najdi-950/70 border border-cream-300 dark:border-najdi-800 text-xs flex items-start gap-3">
          <Info className="h-5 w-5 text-bronze-600 dark:text-bronze-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-najdi-900 dark:text-cream-50">
              {language === 'ar' ? 'مبدأ الاعتراف بالإيراد الاستحقاقي:' : 'Accrual Revenue Recognition Principle:'}
            </p>
            <p className="text-sand-700 dark:text-sand-300 leading-relaxed text-[11px]">
              {language === 'ar'
                ? `يمثل الإيراد المكتسب القيمة الفعلية المستحقة بناءً على الأيام المنقضية من العقد حتى ${formatDate(reportDate, 'dd MMMM yyyy')}.`
                : `Earned Rent represents rental income earned according to elapsed contract duration up to ${formatDate(reportDate, 'dd MMM yyyy')}.`}{' '}
              (<code className="px-1 py-0.5 rounded bg-cream-200 dark:bg-najdi-850 font-mono text-brand-600 dark:text-brand-400">Earned = Base Value × (Elapsed / Total)</code>).
            </p>
          </div>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 shadow-xs">
          <p className="text-xs font-bold text-sand-500 dark:text-sand-400 uppercase tracking-wider">{language === 'ar' ? 'إجمالي قيمة العقود' : 'Total Contracted Value'}</p>
          <p className="text-xl font-serif font-extrabold text-najdi-900 dark:text-cream-50 mt-1">
            {formatSAR(totals.totalContractValue, language)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 shadow-xs">
          <p className="text-xs font-bold text-bronze-600 dark:text-bronze-400 uppercase tracking-wider">{language === 'ar' ? 'المكتسب حتى تاريخه' : 'Total Earned to Date'}</p>
          <p className="text-xl font-serif font-extrabold text-bronze-600 dark:text-bronze-400 mt-1">
            {formatSAR(totals.totalEarnedToDate, language)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 shadow-xs">
          <p className="text-xs font-bold text-najdi-800 dark:text-sand-300 uppercase tracking-wider">{language === 'ar' ? 'النقد المحصل' : 'Cash Collected to Date'}</p>
          <p className="text-xl font-serif font-extrabold text-najdi-900 dark:text-sand-100 mt-1">
            {formatSAR(totals.totalAmountReceived, language)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 shadow-xs">
          <p className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">{language === 'ar' ? 'المستحق الصافي' : 'Net Accrued Receivable'}</p>
          <p className="text-xl font-serif font-extrabold text-brand-600 dark:text-brand-400 mt-1">
            {formatSAR(totals.totalAccruedAmount, language)}
          </p>
        </div>
      </div>

      {/* Accrual Table */}
      <div className="overflow-hidden rounded-2xl border border-cream-300 dark:border-najdi-800 bg-white dark:bg-najdi-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-cream-100/90 dark:bg-najdi-850 text-sand-600 dark:text-sand-400 uppercase tracking-wider font-semibold border-b border-cream-300 dark:border-najdi-800">
              <tr>
                <th className="p-4 text-start">{t('tenant')}</th>
                <th className="p-4 text-start">{t('office_unit')}</th>
                <th className="p-4 text-start">{language === 'ar' ? 'فترة العقد' : 'Contract Period'}</th>
                <th className="p-4 text-end">{language === 'ar' ? 'قيمة العقد' : 'Contract Value'}</th>
                <th className="p-4 text-end">{language === 'ar' ? 'المكتسب حتى تاريخه' : 'Earned to Date'}</th>
                <th className="p-4 text-end">{language === 'ar' ? 'المحصل' : 'Amount Received'}</th>
                <th className="p-4 text-end">{language === 'ar' ? 'المستحق' : 'Accrued Amount'}</th>
                <th className="p-4 text-end">{language === 'ar' ? 'المتبقي الإجمالي' : 'Total Outstanding'}</th>
                <th className="p-4 text-center">{language === 'ar' ? 'الإنجاز' : 'Progress'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200 dark:divide-najdi-800">
              {accrualData.map(item => (
                <tr
                  key={item.contractId}
                  className="hover:bg-cream-50/70 dark:hover:bg-najdi-850/40 transition-colors"
                >
                  <td className="p-4">
                    <div className="font-bold text-najdi-900 dark:text-cream-50">
                      {language === 'ar' && item.tenantNameAr ? item.tenantNameAr : item.tenantName}
                    </div>
                    <div className="text-[11px] text-sand-400 font-mono">{item.contractId}</div>
                  </td>

                  <td className="p-4 font-semibold text-sand-700 dark:text-sand-300">
                    {item.officeNumber}
                  </td>

                  <td className="p-4 text-sand-600 dark:text-sand-400">
                    <div>{formatDate(item.startDate, 'dd MMM yyyy')}</div>
                    <div className="text-[11px] text-sand-400">to {formatDate(item.endDate, 'dd MMM yyyy')}</div>
                  </td>

                  <td className="p-4 text-end font-medium text-najdi-900 dark:text-cream-50">
                    {formatSAR(item.contractValue, language)}
                  </td>

                  <td className="p-4 text-end font-bold text-bronze-600 dark:text-bronze-400">
                    {formatSAR(item.earnedToDate, language)}
                  </td>

                  <td className="p-4 text-end font-bold text-najdi-800 dark:text-sand-300">
                    {formatSAR(item.amountReceived, language)}
                  </td>

                  <td className="p-4 text-end font-bold text-brand-600 dark:text-brand-400">
                    {formatSAR(item.accruedAmount, language)}
                  </td>

                  <td className="p-4 text-end font-medium text-sand-700 dark:text-sand-300">
                    {formatSAR(item.outstandingAmount, language)}
                  </td>

                  <td className="p-4 text-center">
                    <div className="inline-flex items-center gap-2">
                      <span className="text-[11px] font-bold text-sand-700 dark:text-sand-300">
                        {item.progressPercent}%
                      </span>
                      <div className="w-12 h-1.5 rounded-full bg-cream-200 dark:bg-najdi-800 overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full"
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Totals Footer Row */}
            <tfoot className="bg-cream-100/90 dark:bg-najdi-850 font-bold text-najdi-900 dark:text-cream-50 border-t-2 border-cream-300 dark:border-najdi-700">
              <tr>
                <td colSpan={3} className="p-4 text-start uppercase tracking-wider text-xs">
                  {language === 'ar' ? 'الإجمالي العام' : 'Grand Totals'} ({formatDate(reportDate, 'dd MMM yyyy')})
                </td>
                <td className="p-4 text-end">{formatSAR(totals.totalContractValue, language)}</td>
                <td className="p-4 text-end text-bronze-600 dark:text-bronze-400">{formatSAR(totals.totalEarnedToDate, language)}</td>
                <td className="p-4 text-end text-najdi-800 dark:text-sand-300">{formatSAR(totals.totalAmountReceived, language)}</td>
                <td className="p-4 text-end text-brand-600 dark:text-brand-400">{formatSAR(totals.totalAccruedAmount, language)}</td>
                <td className="p-4 text-end">{formatSAR(totals.totalOutstanding, language)}</td>
                <td className="p-4 text-center text-xs text-sand-400">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
