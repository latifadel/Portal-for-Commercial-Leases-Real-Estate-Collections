import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { CommandPalette } from './components/layout/CommandPalette';
import { DashboardView } from './components/dashboard/DashboardView';
import { TenantList } from './components/tenants/TenantList';
import { OfficeList } from './components/offices/OfficeList';
import { ContractList } from './components/contracts/ContractList';
import { PaymentList } from './components/payments/PaymentList';
import { AccruedRentalView } from './components/accrued/AccruedRentalView';
import { ReportsView } from './components/reports/ReportsView';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { ActivityLogView } from './components/activity/ActivityLogView';
import { SettingsView } from './components/settings/SettingsView';
import { LoginView } from './components/auth/LoginView';
import {
  Eye,
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  DollarSign,
  TrendingUp,
  Loader2,
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentUser, isViewer, isLoadingAuth } = useAuth();
  const { language, isRTL, t } = useLanguage();

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedEntityId, setSelectedEntityId] = useState<string | undefined>(undefined);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-najdi-900 flex flex-col items-center justify-center gap-3 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        <span className="text-xs text-slate-400 font-medium">Checking session...</span>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView />;
  }

  const handleNavigate = (view: string, id?: string) => {
    setCurrentView(view);
    setSelectedEntityId(id);
    setIsMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const mobileNavItems = [
    { id: 'dashboard', label: language === 'ar' ? 'الرئيسية' : 'Home', icon: LayoutDashboard },
    { id: 'tenants', label: language === 'ar' ? 'المستأجرين' : 'Tenants', icon: Users },
    { id: 'offices', label: language === 'ar' ? 'الوحدات' : 'Offices', icon: Building2 },
    { id: 'contracts', label: language === 'ar' ? 'العقود' : 'Contracts', icon: FileText },
    { id: 'payments', label: language === 'ar' ? 'الدفعات' : 'Payments', icon: DollarSign },
    { id: 'reports', label: language === 'ar' ? 'التقارير' : 'Reports', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-najdi-950 text-najdi-900 dark:text-cream-50 flex flex-col font-sans selection:bg-sand-500 selection:text-najdi-900">
      {/* Viewer Alert Banner */}
      {isViewer && (
        <div className="bg-najdi-900 border-b border-bronze-500/30 text-bronze-300 px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 z-50 shadow-sm">
          <Eye className="h-4 w-4 text-brand-500" />
          <span>
            {language === 'ar'
              ? 'أنت في وضع المعاينة (للقراءة فقط). تم تعطيل إضافة أو تعديل البيانات.'
              : 'You are in Viewer (Read-Only) mode. Record creation, edits, and deletions are disabled.'}
          </span>
        </div>
      )}

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={view => handleNavigate(view)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
            isRTL
              ? isSidebarCollapsed ? 'lg:mr-20' : 'lg:mr-64'
              : isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          }`}
        >
          {/* Header */}
          <Header
            onOpenSearch={() => setIsSearchOpen(true)}
            onNavigate={handleNavigate}
            onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          />

          {/* Main Body */}
          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
            {currentView === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}
            {currentView === 'tenants' && (
              <TenantList onNavigate={handleNavigate} selectedTenantId={selectedEntityId} />
            )}
            {currentView === 'offices' && (
              <OfficeList onNavigate={handleNavigate} selectedOfficeId={selectedEntityId} />
            )}
            {currentView === 'contracts' && (
              <ContractList onNavigate={handleNavigate} selectedContractId={selectedEntityId} />
            )}
            {currentView === 'payments' && (
              <PaymentList onNavigate={handleNavigate} selectedInstallmentId={selectedEntityId} />
            )}
            {currentView === 'accrued' && <AccruedRentalView />}
            {currentView === 'reports' && <ReportsView />}
            {currentView === 'settings' && <SettingsView />}
          </main>
        </div>
      </div>

      {/* iPhone / Mobile Bottom Bar - Deep Najdi Dark Brown */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-najdi-950/95 backdrop-blur-md border-t border-najdi-800 px-2 py-2 flex items-center justify-around shadow-2xl">
        {mobileNavItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all ${
                isActive
                  ? 'text-brand-400 font-bold scale-105'
                  : 'text-sand-400 hover:text-cream-50'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <DataProvider>
          <MainLayout />
        </DataProvider>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;
