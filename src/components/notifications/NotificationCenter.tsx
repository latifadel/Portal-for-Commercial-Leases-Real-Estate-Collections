import React, { useState, useMemo } from 'react';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  DollarSign,
  FileText,
  Building2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatDate } from '../../utils/formatters';

interface NotificationCenterProps {
  onNavigate: (view: string, id?: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigate }) => {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useData();
  const { language, t } = useLanguage();

  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'OVERDUE' | 'EXPIRING' | 'PAYMENT'>('ALL');

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notif => {
      if (filter === 'UNREAD') return !notif.isRead;
      if (filter === 'OVERDUE') return notif.type === 'RENT_OVERDUE' || notif.type === 'RENT_DUE_SOON';
      if (filter === 'EXPIRING') return notif.type === 'CONTRACT_EXPIRING' || notif.type === 'CONTRACT_EXPIRED';
      if (filter === 'PAYMENT') return notif.type === 'PAYMENT_RECORDED';
      return true;
    });
  }, [notifications, filter]);

  const handleAction = (notif: typeof notifications[0]) => {
    markNotificationRead(notif.id);
    if (notif.targetType === 'TENANT') onNavigate('tenants', notif.targetId);
    else if (notif.targetType === 'CONTRACT') onNavigate('contracts', notif.targetId);
    else if (notif.targetType === 'PAYMENT') onNavigate('payments', notif.targetId);
    else if (notif.targetType === 'OFFICE') onNavigate('offices', notif.targetId);
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'URGENT':
        return {
          icon: ShieldAlert,
          color: 'text-rose-600 bg-rose-100 dark:bg-rose-950/80 border-rose-200 dark:border-rose-900',
          badge: 'bg-rose-100 text-rose-700 font-bold',
        };
      case 'WARNING':
        return {
          icon: AlertTriangle,
          color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/80 border-amber-200 dark:border-amber-900',
          badge: 'bg-amber-100 text-amber-700 font-bold',
        };
      case 'UPCOMING':
        return {
          icon: Clock,
          color: 'text-blue-600 bg-blue-100 dark:bg-blue-950/80 border-blue-200 dark:border-blue-900',
          badge: 'bg-blue-100 text-blue-700 font-medium',
        };
      case 'EXPIRED':
        return {
          icon: AlertTriangle,
          color: 'text-slate-800 bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700',
          badge: 'bg-slate-800 text-white font-bold',
        };
      default:
        return {
          icon: CheckCircle2,
          color: 'text-najdi-800 bg-sand-200 dark:bg-najdi-850 border-sand-300 dark:border-najdi-700',
          badge: 'bg-sand-200 text-najdi-800 font-medium',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="h-6 w-6 text-brand-600" />
            <span>{t('notifications')} & Alert Center</span>
            {unreadNotificationCount > 0 && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500 text-white">
                {unreadNotificationCount} New
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated alerts for rent due dates, overdue invoices, and lease expiration warnings
          </p>
        </div>

        {unreadNotificationCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <CheckCheck className="h-4 w-4 text-brand-600" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs overflow-x-auto">
        {(
          [
            { id: 'ALL', label: 'All Alerts' },
            { id: 'UNREAD', label: `Unread (${unreadNotificationCount})` },
            { id: 'OVERDUE', label: 'Rent Due & Overdue' },
            { id: 'EXPIRING', label: 'Contract Expirations' },
            { id: 'PAYMENT', label: 'Payment Receipts' },
          ] as const
        ).map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              filter === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            No notifications found in this category.
          </div>
        ) : (
          filteredNotifications.map(notif => {
            const style = getSeverityStyle(notif.severity);
            const Icon = style.icon;

            return (
              <div
                key={notif.id}
                onClick={() => handleAction(notif)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !notif.isRead
                    ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 shadow-xs ring-1 ring-brand-500/30'
                    : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${style.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {language === 'ar' && notif.titleAr ? notif.titleAr : notif.title}
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${style.badge}`}>
                        {notif.severity}
                      </span>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {language === 'ar' && notif.messageAr ? notif.messageAr : notif.message}
                    </p>

                    <p className="text-[11px] text-slate-400">
                      Generated on: {formatDate(notif.createdAt, 'dd MMM yyyy', language)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 sm:self-center">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleAction(notif);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 text-brand-700 dark:text-brand-300 text-xs font-semibold transition-colors"
                  >
                    <span>View Record</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
