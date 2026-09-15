import React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  DollarSign,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { AlabdullatifLogo, NajdiPatternDivider } from '../common/NajdiMotifs';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { language, t, isRTL } = useLanguage();
  const { payments, contracts, settings } = useData();

  // Compute live badges
  const validContractIds = new Set(contracts.filter(c => c.status !== 'CANCELLED').map(c => c.id));
  const overdueCount = payments.filter(p => validContractIds.has(p.contractId) && p.status === 'OVERDUE').length;
  const expiringCount = contracts.filter(c => c.status === 'EXPIRING_SOON').length;

  const navItems = [
    { id: 'dashboard', label: language === 'ar' ? 'لوحة القيادة' : 'Dashboard', icon: LayoutDashboard },
    { id: 'tenants', label: language === 'ar' ? 'المستأجرين' : 'Tenants', icon: Users },
    { id: 'offices', label: language === 'ar' ? 'الوحدات والمكاتب' : 'Offices', icon: Building2 },
    {
      id: 'contracts',
      label: language === 'ar' ? 'عقود الإيجار' : 'Contracts',
      icon: FileText,
      badge: expiringCount > 0 ? String(expiringCount) : undefined,
      badgeColor: 'bg-bronze-500 text-najdi-950 font-bold',
    },
    {
      id: 'payments',
      label: language === 'ar' ? 'التحصيلات والدفعات' : 'Payments',
      icon: DollarSign,
      badge: overdueCount > 0 ? String(overdueCount) : undefined,
      badgeColor: 'bg-danger-600 text-white font-bold animate-pulse',
    },
    { id: 'reports', label: language === 'ar' ? 'التقارير المالية' : 'Reports', icon: FileSpreadsheet },
    { id: 'settings', label: language === 'ar' ? 'الإعدادات' : 'Settings', icon: Settings },
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-najdi-950/80 backdrop-blur-sm lg:hidden animate-fadeIn"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Drawer - Deep Najdi Dark Brown */}
      <aside
        className={`fixed top-0 bottom-0 z-50 flex flex-col border-e border-najdi-800 bg-najdi-900 text-cream-100 transition-all duration-300 ${
          isRTL ? 'right-0' : 'left-0'
        } ${
          isMobileOpen
            ? 'translate-x-0 w-72 shadow-2xl'
            : isRTL
            ? 'translate-x-full lg:translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between px-4 border-b border-najdi-800/80 bg-najdi-950/40">
          <div className="flex items-center gap-3 overflow-hidden">
            {(!isCollapsed || isMobileOpen) ? (
              <AlabdullatifLogo size="md" variant="light" />
            ) : (
              <AlabdullatifLogo size="sm" variant="light" showSubtitle={false} />
            )}
          </div>

          {/* Desktop Toggle Collapse Button */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-sand-400 hover:bg-najdi-800 hover:text-cream-50 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isRTL ? (
              isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            ) : (
              isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {/* Mobile Close (X) Button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-sand-400 hover:bg-najdi-800 hover:text-cream-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Subtle Najdi Frieze Line */}
        <NajdiPatternDivider className="text-bronze-500/20" />

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`group flex items-center w-full gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-najdi-850 text-cream-50 shadow-md border-s-4 border-brand-500 font-bold'
                    : 'text-sand-300 hover:bg-najdi-800/60 hover:text-cream-50'
                }`}
                title={isCollapsed && !isMobileOpen ? item.label : undefined}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-brand-400' : 'text-sand-400 group-hover:text-sand-200'
                  }`}
                />
                {(!isCollapsed || isMobileOpen) && (
                  <span className="flex-1 text-start truncate">{item.label}</span>
                )}
                {(!isCollapsed || isMobileOpen) && item.badge && (
                  <span
                    className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Overdue Alert Banner (Najdi Red / Terracotta) */}
        {(!isCollapsed || isMobileOpen) && overdueCount > 0 && (
          <div className="p-3 m-3 rounded-2xl bg-danger-950/40 border border-danger-800/60 text-xs shadow-inner">
            <div className="flex items-center gap-2 text-danger-300 font-bold mb-1">
              <ShieldAlert className="h-4 w-4 shrink-0 text-danger-400" />
              <span>{language === 'ar' ? 'دفعات متأخرة' : 'Overdue Alert'}</span>
            </div>
            <p className="text-[11px] text-danger-200/90 leading-relaxed">
              {language === 'ar'
                ? `هناك ${overdueCount} دفعة إيجارية تجاوزت موعد الاستحقاق.`
                : `${overdueCount} payment installment${overdueCount > 1 ? 's are' : ' is'} overdue.`}
            </p>
            <button
              onClick={() => handleItemClick('payments')}
              className="mt-2 text-[11px] font-bold text-brand-300 hover:text-brand-200 hover:underline inline-block"
            >
              {language === 'ar' ? 'متابعة المتأخرات ←' : 'Review Overdue →'}
            </button>
          </div>
        )}

        {/* Subtle Najdi Frieze Bottom Detailing */}
        <NajdiPatternDivider className="text-bronze-500/20" />

        {/* Footer Details */}
        <div className="p-4 border-t border-najdi-800/80 bg-najdi-950/30 text-[11px] text-sand-400 text-center">
          {(!isCollapsed || isMobileOpen) && (
            <div className="space-y-0.5">
              <p className="font-serif text-bronze-300 font-bold text-xs tracking-wide">
                مركز العبداللطيف
              </p>
              <p className="text-[10px] text-sand-400/80">
                الرياض • المملكة العربية السعودية
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
