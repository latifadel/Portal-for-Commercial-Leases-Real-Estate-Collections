import React, { useState } from 'react';
import {
  Bell,
  Search,
  Calendar,
  Globe,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  ExternalLink,
  Shield,
  ChevronDown,
  UserCheck,
  Menu,
  Cloud,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { formatDate } from '../../utils/formatters';

interface HeaderProps {
  onOpenSearch: () => void;
  onNavigate: (view: string, id?: string) => void;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onNavigate, onOpenMobileMenu }) => {
  const { language, setLanguage, t } = useLanguage();
  const { currentUser, switchRole, isAdmin, isViewer, logout } = useAuth();
  const {
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    effectiveDate,
    updateSettings,
    cloudStatus,
    lastSyncedAt,
    refreshFromCloud,
  } = useData();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDate, setTempDate] = useState(effectiveDate);

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    markNotificationRead(notif.id);
    setShowNotifications(false);
    if (notif.targetType === 'TENANT') onNavigate('tenants', notif.targetId);
    else if (notif.targetType === 'CONTRACT') onNavigate('contracts', notif.targetId);
    else if (notif.targetType === 'PAYMENT') onNavigate('payments', notif.targetId);
    else if (notif.targetType === 'OFFICE') onNavigate('offices', notif.targetId);
  };

  const handleApplySimulatedDate = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      simulatedDate: tempDate,
      useSimulatedDate: true,
    });
    setShowDateModal(false);
  };

  const handleResetToRealDate = () => {
    const today = new Date().toISOString().split('T')[0];
    updateSettings({
      simulatedDate: today,
      useSimulatedDate: false,
    });
    setTempDate(today);
    setShowDateModal(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-cream-300 dark:border-najdi-800 bg-cream-50/90 dark:bg-najdi-950/90 backdrop-blur-md px-3 sm:px-6 gap-2 sm:gap-4 transition-colors">
      {/* Left: Mobile Menu Trigger + Logo + Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-najdi-700 dark:text-cream-200 hover:bg-cream-200 dark:hover:bg-najdi-800 transition-colors shrink-0"
          title="Open Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Header App Logo & Name */}
        <div 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 shrink-0 cursor-pointer select-none group"
          title="مركز العبداللطيف"
        >
          <img
            src="/logo.png"
            alt="مركز العبداللطيف"
            className="h-9 w-9 rounded-full object-cover border border-sand-400/50 shadow-sm shrink-0 group-hover:scale-105 transition-transform"
          />
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="font-serif font-bold text-xs sm:text-sm text-najdi-900 dark:text-cream-50 group-hover:text-brand-600 dark:group-hover:text-sand-300 transition-colors">
              مركز العبداللطيف
            </span>
            <span className="text-[9px] text-sand-500 font-sans tracking-wide uppercase">
              Alabdullatif Center
            </span>
          </div>
        </div>

        {/* Search Bar Trigger - Warm Sand / Cream */}
        <button
          onClick={onOpenSearch}
          className="flex items-center w-full gap-2 sm:gap-3 px-3.5 py-2 text-xs sm:text-sm text-najdi-600 dark:text-sand-300 bg-cream-200/80 dark:bg-najdi-900 rounded-xl hover:bg-cream-300/80 dark:hover:bg-najdi-850 transition-colors border border-cream-300 dark:border-najdi-800/80 shadow-2xs"
        >
          <Search className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
          <span className="flex-1 text-start truncate">{t('search_placeholder')}</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-sand-500 bg-cream-50 dark:bg-najdi-950 rounded border border-cream-300 dark:border-najdi-800">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Supabase Cloud Sync Status Button */}
        <button
          onClick={() => refreshFromCloud()}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold border transition-all ${
            cloudStatus === 'synced'
              ? 'bg-cream-100 dark:bg-najdi-900 text-najdi-800 dark:text-sand-200 border-bronze-500/30 hover:bg-cream-200'
              : cloudStatus === 'saving'
              ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border-brand-300 dark:border-brand-800 animate-pulse'
              : 'bg-danger-50 dark:bg-danger-950/40 text-danger-700 dark:text-danger-300 border-danger-200 dark:border-danger-800'
          }`}
          title={language === 'ar' ? `سحابي متزامن عبر Supabase (آخر تحديث: ${lastSyncedAt})` : `Supabase Cloud Synced (Last updated: ${lastSyncedAt})`}
        >
          {cloudStatus === 'saving' ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-brand-600" />
          ) : (
            <Cloud className="h-3.5 w-3.5 text-bronze-500" />
          )}
          <span className="hidden md:inline">
            {cloudStatus === 'saving'
              ? (language === 'ar' ? 'جارِ المزامنة...' : 'Syncing...')
              : cloudStatus === 'synced'
              ? (language === 'ar' ? 'سحابي متزامن' : 'Cloud Synced')
              : (language === 'ar' ? 'خطأ سحابي' : 'Sync Error')}
          </span>
        </button>

        {/* System Simulation Date Badge */}
        <button
          onClick={() => setShowDateModal(true)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-medium bg-sand-100 dark:bg-najdi-900 text-najdi-800 dark:text-sand-200 border border-sand-300 dark:border-najdi-800 hover:bg-sand-200/80 transition-colors"
          title="Change System Simulation Date"
        >
          <Calendar className="h-3.5 w-3.5 text-brand-600" />
          <span className="hidden md:inline text-najdi-500 dark:text-sand-400">
            {t('as_of_date')}:
          </span>
          <span className="font-semibold">{formatDate(effectiveDate, 'dd MMM', language)}</span>
        </button>

        {/* Language Switcher */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-najdi-800 dark:text-sand-200 hover:bg-cream-200 dark:hover:bg-najdi-850 border border-cream-300 dark:border-najdi-800 transition-colors"
          title="Switch Language (English / العربية)"
        >
          <Globe className="h-3.5 w-3.5 text-bronze-600" />
          <span className="hidden sm:inline">{language === 'en' ? 'العربية' : 'English'}</span>
          <span className="sm:hidden font-bold">{language === 'en' ? 'عربي' : 'EN'}</span>
        </button>

        {/* Notifications Dropdown (Prominent with Terracotta Badge) */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-najdi-700 dark:text-sand-300 hover:bg-cream-200 dark:hover:bg-najdi-850 transition-colors"
            title={t('notifications')}
          >
            <Bell className="h-5 w-5" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1 end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white shadow-xs animate-scaleUp">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute end-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-najdi-900 shadow-2xl border border-cream-300 dark:border-najdi-800 overflow-hidden z-50 animate-scaleUp">
              <div className="flex items-center justify-between p-4 border-b border-cream-200 dark:border-najdi-800 bg-cream-50 dark:bg-najdi-950/60">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-brand-600" />
                  <h3 className="text-sm font-bold text-najdi-900 dark:text-cream-50">{t('notifications')}</h3>
                  {unreadNotificationCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                      {unreadNotificationCount}
                    </span>
                  )}
                </div>
                {unreadNotificationCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {t('mark_all_read')}
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-cream-100 dark:divide-najdi-800/60">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-sand-500">
                    {language === 'ar' ? 'لا توجد تنبيهات حالياً' : 'No notifications'}
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3.5 hover:bg-cream-100/70 dark:hover:bg-najdi-850 cursor-pointer transition-colors ${
                        !notif.isRead ? 'bg-cream-50/90 dark:bg-najdi-850/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-semibold ${!notif.isRead ? 'text-najdi-900 dark:text-cream-50' : 'text-najdi-600 dark:text-sand-400'}`}>
                          {language === 'ar' && notif.titleAr ? notif.titleAr : notif.title}
                        </p>
                        <span className="text-[10px] text-sand-400 shrink-0">
                          {formatDate(notif.createdAt, 'dd MMM', language)}
                        </span>
                      </div>
                      <p className="text-xs text-najdi-600 dark:text-sand-400 mt-1 leading-relaxed">
                        {language === 'ar' && notif.messageAr ? notif.messageAr : notif.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-cream-50 dark:bg-najdi-950/60 border-t border-cream-200 dark:border-najdi-800 text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate('notifications');
                  }}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
                >
                  {t('view_all')} <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Role & Profile Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-cream-200 dark:hover:bg-najdi-850 transition-colors border border-transparent hover:border-cream-300 dark:hover:border-najdi-800"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-700 to-brand-500 text-white flex items-center justify-center font-serif font-bold text-sm shadow-sm">
              {currentUser?.name.charAt(0) || 'A'}
            </div>
            <div className="hidden lg:block text-start text-xs leading-tight">
              <p className="font-serif font-bold text-najdi-900 dark:text-cream-50">
                {language === 'ar' && currentUser?.nameAr ? currentUser.nameAr : currentUser?.name}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Shield className="h-3 w-3 text-bronze-600" />
                <span className="text-[11px] text-sand-500 font-medium">
                  {isAdmin ? t('role_admin') : t('role_viewer')}
                </span>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-sand-400 hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute end-0 mt-2 w-64 rounded-2xl bg-white dark:bg-najdi-900 shadow-2xl border border-cream-300 dark:border-najdi-800 p-2 z-50 animate-scaleUp">
              <div className="p-3 border-b border-cream-200 dark:border-najdi-800 mb-1 bg-cream-50/60 dark:bg-najdi-950/40 rounded-xl">
                <p className="text-xs font-serif font-bold text-najdi-900 dark:text-cream-50">
                  {currentUser?.name}
                </p>
                <p className="text-[11px] text-sand-500 truncate">{currentUser?.email}</p>
              </div>

              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sand-400">
                Switch Role / Preview As
              </p>

              <button
                onClick={() => {
                  switchRole('ADMIN');
                  setShowUserMenu(false);
                }}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isAdmin
                    ? 'bg-cream-100 dark:bg-najdi-800 text-brand-700 dark:text-brand-300 font-semibold'
                    : 'text-najdi-700 dark:text-sand-300 hover:bg-cream-100 dark:hover:bg-najdi-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-brand-600" />
                  <span>{t('role_admin')}</span>
                </div>
                {isAdmin && <UserCheck className="h-4 w-4 text-brand-600" />}
              </button>

              <button
                onClick={() => {
                  switchRole('VIEWER');
                  setShowUserMenu(false);
                }}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isViewer
                    ? 'bg-cream-100 dark:bg-najdi-800 text-brand-700 dark:text-brand-300 font-semibold'
                    : 'text-najdi-700 dark:text-sand-300 hover:bg-cream-100 dark:hover:bg-najdi-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-bronze-600" />
                  <span>{t('role_viewer')}</span>
                </div>
                {isViewer && <UserCheck className="h-4 w-4 text-brand-600" />}
              </button>

              <div className="border-t border-cream-200 dark:border-najdi-800 mt-2 pt-2 space-y-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigate('settings');
                  }}
                  className="w-full text-start px-3 py-2 rounded-xl text-xs text-najdi-700 dark:text-sand-300 hover:bg-cream-100 dark:hover:bg-najdi-800 transition-colors"
                >
                  {t('settings')}
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full text-start px-3 py-2 rounded-xl text-xs text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/40 transition-colors flex items-center gap-2 font-semibold mt-1"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{language === 'ar' ? 'تسجيل الخروج' : 'Log Out'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Date Simulation Modal */}
      {showDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-najdi-950/70 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-md bg-white dark:bg-najdi-900 rounded-2xl shadow-2xl border border-cream-300 dark:border-najdi-800 p-6 animate-scaleUp"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-najdi-900 dark:text-white font-serif">
                  {t('simulated_date_label')}
                </h3>
                <p className="text-xs text-sand-500">
                  Test real-time accrued rent calculations and expiration alerts as of any date.
                </p>
              </div>
            </div>

            <form onSubmit={handleApplySimulatedDate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-najdi-700 dark:text-sand-300 mb-1">
                  Simulation Date
                </label>
                <input
                  type="date"
                  value={tempDate}
                  onChange={e => setTempDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-cream-300 dark:border-najdi-700 text-sm font-semibold bg-cream-50 dark:bg-najdi-800 text-najdi-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleResetToRealDate}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-najdi-600 dark:text-sand-300 hover:bg-cream-100 dark:hover:bg-najdi-800 transition-colors"
                >
                  Reset to Real Today
                </button>
                <button
                  type="button"
                  onClick={() => setShowDateModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-sand-500 hover:bg-cream-100 dark:hover:bg-najdi-800 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sand-500 hover:bg-sand-600 text-najdi-900 text-xs font-bold transition-all shadow-xs"
                >
                  Apply Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
