import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

const translations: Translations = {
  // App & Navigation
  app_name: { en: 'Al-Oula Tower', ar: 'برج الأولى' },
  app_tagline: { en: 'Commercial Property & Lease Management', ar: 'إدارة العقارات التجارية وعقود الإيجار' },
  dashboard: { en: 'Dashboard', ar: 'لوحة التحكم' },
  tenants: { en: 'Tenants', ar: 'المستأجرين' },
  offices: { en: 'Offices / Units', ar: 'المكاتب والوحدات' },
  contracts: { en: 'Contracts', ar: 'عقود الإيجار' },
  payments: { en: 'Rent Payments', ar: 'دفعات الإيجار' },
  accrued_rental: { en: 'Accrued Rental', ar: 'الإيجار المستحق' },
  reports: { en: 'Reports Hub', ar: 'مركز التقارير' },
  notifications: { en: 'Notifications', ar: 'الإشعارات' },
  activity_log: { en: 'Activity Log', ar: 'سجل العمليات' },
  settings: { en: 'Settings', ar: 'الإعدادات' },
  logout: { en: 'Sign Out', ar: 'تسجيل الخروج' },

  // Dashboard Summary Cards
  total_offices: { en: 'Total Offices', ar: 'إجمالي المكاتب' },
  occupied_offices: { en: 'Occupied Offices', ar: 'المكاتب المشغولة' },
  vacant_offices: { en: 'Vacant Offices', ar: 'المكاتب الشاغرة' },
  occupancy_rate: { en: 'Occupancy Rate', ar: 'نسبة الإشغال' },
  active_tenants: { en: 'Active Tenants', ar: 'المستأجرين النشطين' },
  active_contracts: { en: 'Active Contracts', ar: 'العقود النشطة' },
  expiring_soon_contracts: { en: 'Contracts Expiring Soon', ar: 'عقود تنتهي قريباً' },
  total_contract_value: { en: 'Base Contract Value', ar: 'قيمة العقود الأساسية' },
  total_vat: { en: 'Total VAT (15%)', ar: 'إجمالي ضريبة القيمة المضافة' },
  total_contract_value_vat: { en: 'Total Contract Value (Incl. VAT)', ar: 'إجمالي قيمة العقود شاملة الضريبة' },
  total_rent_collected: { en: 'Total Rent Collected', ar: 'إجمالي الإيجار المحصل' },
  total_outstanding_rent: { en: 'Outstanding Rent', ar: 'الإيجار المتبقي غير المحصل' },
  accrued_rental_income: { en: 'Accrued Rental Income', ar: 'الإيراد الإيجاري المستحق' },
  total_overdue_payments: { en: 'Total Overdue Payments', ar: 'إجمالي الدفعات المتأخرة' },

  // Sections & Headers
  upcoming_payments: { en: 'Upcoming Rent Payments', ar: 'دفعات الإيجار القادمة' },
  expiring_contracts: { en: 'Expiring Contracts', ar: 'العقود المنتهية وقيد الانتهاء' },
  overdue_payments: { en: 'Overdue Rent Payments', ar: 'الدفعات المتأخرة والمستحقة' },
  monthly_income_chart: { en: 'Monthly Rental Income & Collections', ar: 'الإيرادات والتحصيلات الشهرية' },
  paid_vs_outstanding: { en: 'Paid vs Outstanding Rent', ar: 'الإيجار المحصل مقابل المتبقي' },
  income_by_tenant: { en: 'Rental Value by Tenant', ar: 'قيمة العقود حسب المستأجر' },
  contract_timeline: { en: 'Contract Expiration Timeline', ar: 'الجدول الزمني لانتهاء العقود' },

  // Filters & Timeframes
  next_30_days: { en: 'Next 30 Days', ar: 'خلال 30 يوماً' },
  next_60_days: { en: 'Next 60 Days', ar: 'خلال 60 يوماً' },
  next_90_days: { en: 'Next 90 Days', ar: 'خلال 90 يوماً' },
  all_time: { en: 'All Time', ar: 'الكل' },
  days_overdue: { en: 'Days Overdue', ar: 'أيام التأخير' },
  days_remaining: { en: 'Days Left', ar: 'أيام متبقية' },

  // Common Table & Form labels
  tenant: { en: 'Tenant', ar: 'المستأجر' },
  company_name: { en: 'Company / Tenant Name', ar: 'اسم الشركة / المستأجر' },
  contact_person: { en: 'Contact Person', ar: 'المسؤول' },
  mobile_number: { en: 'Mobile Number', ar: 'رقم الجوال' },
  email_address: { en: 'Email Address', ar: 'البريد الإلكتروني' },
  cr_number: { en: 'Commercial Reg. (CR)', ar: 'السجل التجاري' },
  vat_number: { en: 'VAT Number (ZATCA)', ar: 'الرقم الضريبي' },
  national_id: { en: 'National ID / Iqama', ar: 'الهوية الوطنية / الإقامة' },
  office_unit: { en: 'Office / Unit', ar: 'المكتب / الوحدة' },
  floor: { en: 'Floor', ar: 'الدور' },
  office_size: { en: 'Size (sqm)', ar: 'المساحة (م²)' },
  annual_rent: { en: 'Annual Rent', ar: 'الإيجار السنوي' },
  contract_id: { en: 'Contract ID', ar: 'رقم العقد' },
  start_date: { en: 'Start Date', ar: 'تاريخ البدء' },
  end_date: { en: 'End Date', ar: 'تاريخ الانتهاء' },
  duration: { en: 'Duration', ar: 'المدة' },
  months: { en: 'Months', ar: 'أشهر' },
  base_rent: { en: 'Base Rent (Excl. VAT)', ar: 'الإيجار الأساسي (غير شامل الضريبة)' },
  vat_percentage: { en: 'VAT Rate', ar: 'نسبة الضريبة' },
  vat_amount: { en: 'VAT Amount', ar: 'مبلغ الضريبة' },
  total_with_vat: { en: 'Total with VAT', ar: 'الإجمالي شامل الضريبة' },
  payment_frequency: { en: 'Payment Frequency', ar: 'طريقة الدفع' },
  status: { en: 'Status', ar: 'الحالة' },
  actions: { en: 'Actions', ar: 'الإجراءات' },
  amount_due: { en: 'Amount Due', ar: 'المبلغ المستحق' },
  amount_paid: { en: 'Amount Paid', ar: 'المبلغ المدفوع' },
  remaining_amount: { en: 'Remaining Balance', ar: 'المبلغ المتبقي' },
  due_date: { en: 'Due Date', ar: 'تاريخ الاستحقاق' },
  payment_date: { en: 'Payment Date', ar: 'تاريخ السداد' },
  payment_method: { en: 'Payment Method', ar: 'طريقة السداد' },
  notes: { en: 'Notes', ar: 'الملاحظات' },

  // Buttons & Actions
  add_tenant: { en: 'Add New Tenant', ar: 'إضافة مستأجر جديد' },
  add_office: { en: 'Add New Office', ar: 'إضافة مكتب جديد' },
  create_contract: { en: 'Create New Lease Contract', ar: 'إنشاء عقد إيجار جديد' },
  record_payment: { en: 'Record Payment', ar: 'تسجيل دفعة إيجار' },
  export_excel: { en: 'Export Excel', ar: 'تصدير إكسل' },
  export_pdf: { en: 'Export PDF', ar: 'تصدير PDF' },
  export_csv: { en: 'Export CSV', ar: 'تصدير CSV' },
  print: { en: 'Print Report', ar: 'طباعة التقرير' },
  search_placeholder: { en: 'Search tenants, CR, offices, contracts, invoices... (Ctrl+K)', ar: 'بحث عن مستأجر، سجل تجاري، مكتب، عقد، فاتورة... (Ctrl+K)' },
  save: { en: 'Save Changes', ar: 'حفظ التغييرات' },
  cancel: { en: 'Cancel', ar: 'إلغاء' },
  delete: { en: 'Delete', ar: 'حذف' },
  edit: { en: 'Edit', ar: 'تعديل' },
  view_profile: { en: 'View 360° Profile', ar: 'عرض الملف الشامل' },
  view_contract: { en: 'View Contract Details', ar: 'عرض تفاصيل العقد' },
  view_all: { en: 'View All', ar: 'عرض الكل' },
  close: { en: 'Close', ar: 'إغلاق' },
  as_of_date: { en: 'As of Date', ar: 'حتى تاريخ' },
  reset_demo_data: { en: 'Reset to Demo Data', ar: 'استعادة البيانات التجريبية' },

  // Roles & Permissions
  role_admin: { en: 'Admin (Full Access)', ar: 'مدير النظام (صلاحية كاملة)' },
  role_viewer: { en: 'Viewer (Read Only)', ar: 'مستعرض (للقراءة فقط)' },
  viewer_restricted_tooltip: { en: 'Viewer mode: modifications disabled', ar: 'وضع المستعرض: التعديل غير متاح' },
  simulated_date_label: { en: 'Simulated System Date', ar: 'تاريخ النظام المحاكى' },
  current_date: { en: 'Current Date', ar: 'التاريخ الحالي' },
  currency_sar: { en: 'SAR', ar: 'ر.س' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('al_oula_lang');
    return (saved === 'ar' || saved === 'en') ? saved : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('al_oula_lang', lang);
  };

  useEffect(() => {
    const isRtl = language === 'ar';
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', language);
    if (isRtl) {
      document.body.classList.add('font-arabic');
    } else {
      document.body.classList.remove('font-arabic');
    }
  }, [language]);

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][language] || translations[key].en || key;
    }
    return key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isRTL: language === 'ar',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
