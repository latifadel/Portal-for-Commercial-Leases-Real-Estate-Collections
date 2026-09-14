import React, { useState, useMemo } from 'react';
import {
  Clock,
  Search,
  Filter,
  Users,
  Building2,
  FileText,
  DollarSign,
  Settings,
  Shield,
  RotateCw,
  XCircle,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { ActivityLog } from '../../types';
import { formatDate } from '../../utils/formatters';

export const ActivityLogView: React.FC = () => {
  const { activityLogs } = useData();
  const { language, t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      return (
        log.description.toLowerCase().includes(q) ||
        (log.descriptionAr && log.descriptionAr.toLowerCase().includes(q)) ||
        log.userName.toLowerCase().includes(q) ||
        log.entityId.toLowerCase().includes(q)
      );
    });
  }, [activityLogs, searchQuery, actionFilter]);

  const getActionIcon = (action: ActivityLog['action']) => {
    switch (action) {
      case 'TENANT_ADDED':
      case 'TENANT_UPDATED':
      case 'TENANT_DELETED':
        return <Users className="h-4 w-4 text-brand-600 dark:text-brand-400" />;
      case 'OFFICE_ADDED':
      case 'OFFICE_UPDATED':
      case 'OFFICE_DELETED':
        return <Building2 className="h-4 w-4 text-sand-600 dark:text-sand-400" />;
      case 'CONTRACT_CREATED':
      case 'CONTRACT_UPDATED':
        return <FileText className="h-4 w-4 text-bronze-600 dark:text-bronze-400" />;
      case 'CONTRACT_RENEWED':
        return <RotateCw className="h-4 w-4 text-brand-600 dark:text-brand-400" />;
      case 'CONTRACT_CANCELLED':
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'PAYMENT_RECORDED':
      case 'PAYMENT_UPDATED':
        return <DollarSign className="h-4 w-4 text-sand-600 dark:text-sand-400" />;
      case 'SETTINGS_UPDATED':
        return <Settings className="h-4 w-4 text-bronze-600 dark:text-bronze-400" />;
      default:
        return <Clock className="h-4 w-4 text-sand-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-najdi-900 dark:text-cream-50 flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <Clock className="h-6 w-6" />
          </div>
          <span>{t('activity_log')} & Audit Trail</span>
        </h2>
        <p className="text-xs text-sand-500 dark:text-sand-400 mt-1">
          {language === 'ar' ? 'سجل العمليات والتغييرات لبرج العبداللطيف' : 'Immutable chronological ledger of all property changes, financial transactions, and user mutations'}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sand-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'البحث في سجل العمليات، المستخدمين...' : 'Search activity description, user, entity ID...'}
            className="w-full ps-10 pe-4 py-2 rounded-xl text-xs bg-cream-50 dark:bg-najdi-950 border border-cream-300 dark:border-najdi-700 text-najdi-900 dark:text-cream-100 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-cream-300 dark:border-najdi-700 text-xs bg-cream-50 dark:bg-najdi-950 font-semibold text-najdi-900 dark:text-cream-100"
        >
          <option value="ALL">{language === 'ar' ? 'جميع العمليات' : 'All Actions'} ({activityLogs.length})</option>
          <option value="PAYMENT_RECORDED">{language === 'ar' ? 'تسجيل سداد' : 'Payments Recorded'}</option>
          <option value="CONTRACT_CREATED">{language === 'ar' ? 'عقود منشأة' : 'Contracts Created'}</option>
          <option value="CONTRACT_RENEWED">{language === 'ar' ? 'عقود مجددة' : 'Contracts Renewed'}</option>
          <option value="CONTRACT_CANCELLED">{language === 'ar' ? 'عقود ملغاة' : 'Contracts Cancelled'}</option>
          <option value="TENANT_ADDED">{language === 'ar' ? 'مستأجرين جدد' : 'Tenants Added'}</option>
          <option value="OFFICE_ADDED">{language === 'ar' ? 'وحدات مضافة' : 'Offices Added'}</option>
          <option value="SETTINGS_UPDATED">{language === 'ar' ? 'تحديث الإعدادات' : 'Settings Updated'}</option>
        </select>
      </div>

      {/* Timeline List */}
      <div className="overflow-hidden rounded-2xl border border-cream-300 dark:border-najdi-800 bg-white dark:bg-najdi-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-cream-100/90 dark:bg-najdi-850 text-sand-600 dark:text-sand-400 uppercase tracking-wider font-semibold border-b border-cream-300 dark:border-najdi-800">
              <tr>
                <th className="p-4 text-start">Action Type</th>
                <th className="p-4 text-start">Description</th>
                <th className="p-4 text-start">Entity ID</th>
                <th className="p-4 text-start">Performed By</th>
                <th className="p-4 text-end">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200 dark:divide-najdi-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sand-400">
                    {language === 'ar' ? 'لا توجد سجلات عمليات' : 'No activity logs found.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-cream-50/70 dark:hover:bg-najdi-850/40 transition-colors">
                    <td className="p-4">
                      <div className="inline-flex items-center gap-2 font-semibold text-najdi-900 dark:text-cream-50">
                        <div className="p-1.5 rounded-lg bg-cream-100 dark:bg-najdi-800">
                          {getActionIcon(log.action)}
                        </div>
                        <span className="font-mono text-[11px]">{log.action}</span>
                      </div>
                    </td>

                    <td className="p-4 font-medium text-najdi-900 dark:text-cream-100">
                      {language === 'ar' && log.descriptionAr ? log.descriptionAr : log.description}
                    </td>

                    <td className="p-4 font-mono text-[11px] text-sand-400">
                      {log.entityId}
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-najdi-900 dark:text-cream-50">{log.userName}</div>
                      <div className="text-[10px] text-sand-400 flex items-center gap-1">
                        <Shield className="h-3 w-3 text-sand-600" />
                        {log.userRole}
                      </div>
                    </td>

                    <td className="p-4 text-end font-mono text-sand-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
