import React, { useState } from 'react';
import {
  Settings,
  Building,
  Percent,
  Calendar,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  Globe,
  Mail,
  CreditCard,
  ShieldCheck,
  HardDrive,
  Share2,
  Cloud,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { SUPABASE_SETUP_SQL } from '../../services/supabaseClient';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetToDefaultData, exportBackup, importBackup, cloudStatus, lastSyncedAt, refreshFromCloud } = useData();
  const { language, setLanguage, t } = useLanguage();
  const { isAdmin } = useAuth();

  const [copiedSql, setCopiedSql] = useState(false);
  const [showSql, setShowSql] = useState(false);

  const [formData, setFormData] = useState({
    buildingName: settings.buildingName,
    buildingNameAr: settings.buildingNameAr,
    buildingAddress: settings.buildingAddress,
    buildingAddressAr: settings.buildingAddressAr,
    crNumber: settings.crNumber,
    vatNumber: settings.vatNumber,
    defaultVatRate: settings.defaultVatRate * 100,
    simulatedDate: settings.simulatedDate,
    useSimulatedDate: settings.useSimulatedDate,
    // Email Notifications
    notificationEmail: settings.notificationEmail || '',
    resendApiKey: settings.resendApiKey || '',
    senderEmail: settings.senderEmail || '',
    // Bank / Payment
    bankName: settings.bankName || '',
    bankIban: settings.bankIban || '',
    bankAccountName: settings.bankAccountName || '',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      buildingName: formData.buildingName,
      buildingNameAr: formData.buildingNameAr,
      buildingAddress: formData.buildingAddress,
      buildingAddressAr: formData.buildingAddressAr,
      crNumber: formData.crNumber,
      vatNumber: formData.vatNumber,
      defaultVatRate: formData.defaultVatRate / 100,
      simulatedDate: formData.simulatedDate,
      useSimulatedDate: formData.useSimulatedDate,
      notificationEmail: formData.notificationEmail,
      resendApiKey: formData.resendApiKey,
      senderEmail: formData.senderEmail,
      bankName: formData.bankName,
      bankIban: formData.bankIban,
      bankAccountName: formData.bankAccountName,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `Alabdullatif_Tower_Backup_${dateStr}.json`;
    link.click();
  };

  const handleShareBackup = async () => {
    const jsonStr = exportBackup();
    const dateStr = new Date().toISOString().split('T')[0];
    const file = new File([jsonStr], `Alabdullatif_Tower_Backup_${dateStr}.json`, { type: 'application/json' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'نسخة احتياطية للعقار - Backup',
          text: `نسخة احتياطية لبيانات إدارة العقار بتاريخ ${dateStr}`,
          files: [file],
        });
        return;
      } catch (e) {
        // Fallback to download
      }
    }
    handleDownloadBackup();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = event => {
        const content = event.target?.result as string;
        const success = importBackup(content);
        if (success) {
          alert(language === 'ar' ? 'تم استرجاع النسخة الاحتياطية بنجاح!' : 'Backup data successfully restored!');
        } else {
          alert(language === 'ar' ? 'ملف النسخة الاحتياطية غير صالح.' : 'Invalid backup file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-najdi-900 dark:text-cream-50 flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <Settings className="h-6 w-6" />
          </div>
          <span>{t('settings')}</span>
        </h2>
        <p className="text-xs text-sand-500 dark:text-sand-400 mt-1">
          {language === 'ar'
            ? 'بيانات برج العبداللطيف، نسبة الضريبة، التخزين المحلي، وإعدادات إشعارات البريد'
            : 'Alabdullatif Tower credentials, ZATCA VAT rates, local storage, and email notifications'}
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-sand-100/80 dark:bg-najdi-850 border border-sand-300 dark:border-najdi-700 text-xs text-najdi-800 dark:text-sand-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-sand-600 shrink-0" />
          <span>{language === 'ar' ? 'تم حفظ التعديلات بنجاح في جهازك!' : 'Settings successfully updated and saved on your device!'}</span>
        </div>
      )}

      {/* Supabase Cloud Connection Banner */}
      <div className="p-5 rounded-2xl bg-najdi-900 text-cream-50 border border-najdi-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sand-200/20 text-sand-300 flex items-center justify-center shrink-0">
              <Cloud className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold flex items-center gap-2 font-serif">
                <span>{language === 'ar' ? 'المزامنة السحابية متصلة عبر Supabase' : 'Supabase Cloud Database Connected'}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  cloudStatus === 'synced' ? 'bg-sand-500/20 text-sand-200' : 'bg-bronze-500/20 text-bronze-300'
                }`}>
                  {cloudStatus === 'synced' ? (language === 'ar' ? 'متزامن لحظياً' : 'Real-time Synced') : (language === 'ar' ? 'جارِ المزامنة...' : 'Syncing...')}
                </span>
              </h4>
              <p className="text-xs text-sand-400 mt-0.5">
                {language === 'ar'
                  ? `مشروع السحابة: wgktclizjfkdlzgnmlra.supabase.co • آخر مزامنة: ${lastSyncedAt}`
                  : `Cloud Project: wgktclizjfkdlzgnmlra.supabase.co • Last synced: ${lastSyncedAt}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refreshFromCloud()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-najdi-800 hover:bg-najdi-750 text-cream-100 text-xs font-semibold border border-najdi-700 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{language === 'ar' ? 'تحديث السحابة' : 'Refresh Cloud'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSql(!showSql)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sand-500 hover:bg-sand-600 text-najdi-900 text-xs font-semibold shadow-sm transition-colors"
            >
              <span>{showSql ? (language === 'ar' ? 'إخفاء كود الجدول' : 'Hide SQL') : (language === 'ar' ? 'كود إعداد Supabase SQL' : 'Supabase SQL Setup')}</span>
            </button>
          </div>
        </div>

        {showSql && (
          <div className="pt-3 border-t border-najdi-800 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-sand-400">
                {language === 'ar' ? 'نفذ هذا الكود في Supabase SQL Editor لإنشاء الجدول وسياسات الأمان RLS:' : 'Run this in Supabase SQL Editor once to set up the table and RLS policies:'}
              </p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2000);
                }}
                className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-semibold"
              >
                {copiedSql ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSql ? (language === 'ar' ? 'تم النسخ!' : 'Copied!') : (language === 'ar' ? 'نسخ الكود' : 'Copy SQL')}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-najdi-950 text-cream-200 text-[10px] font-mono overflow-x-auto whitespace-pre leading-relaxed border border-najdi-800">
              {SUPABASE_SETUP_SQL}
            </pre>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Building Identification */}
        <div className="p-6 rounded-2xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-cream-200 dark:border-najdi-800">
            <Building className="h-5 w-5 text-brand-600" />
            <h3 className="text-sm font-serif font-bold text-najdi-900 dark:text-cream-50">
              {language === 'ar' ? 'بيانات المبنى والعقار' : 'Commercial Property Profile'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-sand-700 dark:text-sand-300 mb-1">
                {language === 'ar' ? 'اسم المبنى (بالعربية)' : 'Building Name (Arabic)'}
              </label>
              <input
                type="text"
                value={formData.buildingNameAr}
                onChange={e => setFormData({ ...formData, buildingNameAr: e.target.value })}
                disabled={!isAdmin}
                className="w-full px-3.5 py-2 rounded-xl border border-cream-300 dark:border-najdi-700 text-sm bg-cream-50 dark:bg-najdi-950 text-najdi-900 dark:text-cream-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-sand-700 dark:text-sand-300 mb-1">
                {language === 'ar' ? 'اسم المبنى (بالإنجليزية)' : 'Building Name (English)'}
              </label>
              <input
                type="text"
                value={formData.buildingName}
                onChange={e => setFormData({ ...formData, buildingName: e.target.value })}
                disabled={!isAdmin}
                className="w-full px-3.5 py-2 rounded-xl border border-cream-300 dark:border-najdi-700 text-sm bg-cream-50 dark:bg-najdi-950 text-najdi-900 dark:text-cream-100"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Financial & VAT Configuration */}
        <div className="p-6 rounded-2xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-cream-200 dark:border-najdi-800">
            <Percent className="h-5 w-5 text-bronze-600" />
            <h3 className="text-sm font-serif font-bold text-najdi-900 dark:text-cream-50">
              {language === 'ar' ? 'إعدادات الضريبة والعملة' : 'VAT & Currency Rules (Saudi Arabia)'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-sand-700 dark:text-sand-300 mb-1">
                {language === 'ar' ? 'نسبة ضريبة القيمة المضافة (%)' : 'VAT Rate %'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={50}
                  step={0.5}
                  value={formData.defaultVatRate}
                  onChange={e => setFormData({ ...formData, defaultVatRate: Number(e.target.value) })}
                  disabled={!isAdmin}
                  className="w-full ps-3.5 pe-10 py-2 rounded-xl border border-cream-300 dark:border-najdi-700 text-sm font-bold bg-cream-50 dark:bg-najdi-950 text-najdi-900 dark:text-cream-100"
                />
                <span className="absolute end-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-sand-400">
                  %
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-sand-700 dark:text-sand-300 mb-1">
                {language === 'ar' ? 'العملة المعتمدة' : 'Operational Currency'}
              </label>
              <div className="w-full px-3.5 py-2 rounded-xl border border-cream-300 dark:border-najdi-700 text-sm font-bold bg-sand-100/70 dark:bg-najdi-850 text-najdi-800 dark:text-cream-200">
                {language === 'ar' ? 'ريال سعودي (ر.س)' : 'Saudi Riyal (SAR)'}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Email Notifications & Bank Details */}
        <div className="p-6 rounded-2xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-cream-200 dark:border-najdi-800">
            <Mail className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-serif font-bold text-najdi-900 dark:text-cream-50">
              {language === 'ar' ? 'إشعارات البريد الإلكتروني وبيانات التحويل' : 'Email Notifications & Payment Details'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-sand-700 dark:text-sand-300 mb-1">
                {language === 'ar' ? 'البريد الإلكتروني للوالد / الإدارة' : 'Owner / Management Notification Email'}
              </label>
              <input
                type="email"
                placeholder="owner@property.sa"
                value={formData.notificationEmail}
                onChange={e => setFormData({ ...formData, notificationEmail: e.target.value })}
                disabled={!isAdmin}
                className="w-full px-3.5 py-2 rounded-xl border border-cream-300 dark:border-najdi-700 text-xs bg-cream-50 dark:bg-najdi-950 text-najdi-900 dark:text-cream-100 placeholder-sand-400"
              />
              <p className="text-[11px] text-sand-400 mt-1">
                {language === 'ar' ? 'يظهر في إشعارات تذكير المستأجرين للرد والتواصل' : 'Used as contact email in payment reminder notices'}
              </p>
            </div>
          </div>

          {/* Bank Transfer Details for Payment Reminders */}
          <div className="pt-3 border-t border-cream-200 dark:border-najdi-800 space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-bronze-600 dark:text-bronze-400" />
              <p className="text-xs font-bold text-najdi-800 dark:text-sand-300">
                {language === 'ar' ? 'بيانات التحويل البنكي (تُدرج تلقائياً في خطابات تذكير الإيجار)' : 'Bank Transfer Details (Auto-included in overdue notices)'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-sand-600 dark:text-sand-400 mb-1">
                  {language === 'ar' ? 'اسم البنك' : 'Bank Name'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'ar' ? 'مثال: مصرف الراجحي' : 'e.g. Al Rajhi Bank'}
                  value={formData.bankName}
                  onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                  disabled={!isAdmin}
                  className="w-full px-3 py-2 rounded-xl border border-cream-300 dark:border-najdi-700 text-xs bg-cream-50 dark:bg-najdi-950 text-najdi-900 dark:text-cream-100 placeholder-sand-400"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-sand-600 dark:text-sand-400 mb-1">
                  {language === 'ar' ? 'رقم الآيبان (IBAN)' : 'IBAN Number'}
                </label>
                <input
                  type="text"
                  placeholder="SA00 0000 0000 0000 0000 0000"
                  value={formData.bankIban}
                  onChange={e => setFormData({ ...formData, bankIban: e.target.value })}
                  disabled={!isAdmin}
                  className="w-full px-3 py-2 rounded-xl border border-cream-300 dark:border-najdi-700 text-xs font-mono bg-cream-50 dark:bg-najdi-950 text-najdi-900 dark:text-cream-100 placeholder-sand-400"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-sand-600 dark:text-sand-400 mb-1">
                  {language === 'ar' ? 'اسم صاحب الحساب' : 'Beneficiary Account Name'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'ar' ? 'اسم مالك العقار كما في البنك' : 'Account holder name'}
                  value={formData.bankAccountName}
                  onChange={e => setFormData({ ...formData, bankAccountName: e.target.value })}
                  disabled={!isAdmin}
                  className="w-full px-3 py-2 rounded-xl border border-cream-300 dark:border-najdi-700 text-xs bg-cream-50 dark:bg-najdi-950 text-najdi-900 dark:text-cream-100 placeholder-sand-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        {isAdmin && (
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-sand-500 hover:bg-sand-600 text-najdi-900 font-bold text-xs shadow-sm shadow-sand-900/30 transition-all"
            >
              {language === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
            </button>
          </div>
        )}
      </form>

      {/* Card 4: Backup, Restore & Sharing */}
      <div className="p-6 rounded-2xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 shadow-sm space-y-4">
        <h3 className="text-sm font-serif font-bold text-najdi-900 dark:text-cream-50 flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          <span>{language === 'ar' ? 'النسخ الاحتياطي ومشاركة البيانات' : 'Data Backup & Sharing'}</span>
        </h3>
        <p className="text-xs text-sand-500 dark:text-sand-400">
          {language === 'ar'
            ? 'يمكنك تنزيل نسخة احتياطية كاملة لبيانات برج العبداللطيف أو مشاركتها لنقل البيانات بين الهاتف والكمبيوتر بسهولة تامة.'
            : 'Download or restore full Alabdullatif Tower database backup to easily transfer data between phone and computer.'}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-najdi-900 hover:bg-najdi-800 text-cream-50 text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>{language === 'ar' ? 'تنزيل نسخة احتياطية (JSON)' : 'Download Backup File'}</span>
          </button>

          <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cream-50 dark:bg-najdi-950 border border-cream-300 dark:border-najdi-700 text-sand-700 dark:text-sand-300 text-xs font-semibold hover:bg-cream-100 transition-colors shadow-xs cursor-pointer">
            <Upload className="h-4 w-4" />
            <span>{language === 'ar' ? 'استرجاع من ملف' : 'Restore from File'}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          {isAdmin && (
            <button
              onClick={() => {
                if (confirm(language === 'ar' ? 'هل أنت متأكد من رغبتك في إعادة تعيين كافة البيانات؟' : 'Are you sure you want to reset all data?')) {
                  resetToDefaultData();
                  alert(language === 'ar' ? 'تمت إعادة التعيين!' : 'Reset complete!');
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-semibold border border-red-200 dark:border-red-900 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>{language === 'ar' ? 'إعادة ضبط البيانات' : 'Reset All Data'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
