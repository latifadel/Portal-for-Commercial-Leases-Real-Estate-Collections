import { Tenant, Contract, PaymentInstallment, SystemSettings, Office } from '../types';

export interface EmailParams {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 2,
  }).format(amount);
};

// ----------------- Email Template Generators -----------------

export const generateOverdueEmail = (
  tenant: Tenant,
  contract: Contract | undefined,
  installment: PaymentInstallment,
  settings: SystemSettings,
  daysOverdue: number
): { subject: string; body: string } => {
  const building = settings.buildingNameAr || settings.buildingName || 'إدارة العقار';
  const tenantName = tenant.nameAr || tenant.name;
  const amountStr = `${installment.remainingAmount.toLocaleString()} ر.س`;
  const ibanStr = settings.bankIban
    ? `\n\nبيانات التحويل البنكي:\n- البنك: ${settings.bankName || 'البنك'}\n- الآيبان (IBAN): ${settings.bankIban}\n- اسم الحساب: ${settings.bankAccountName || building}`
    : '';

  const subject = `إشعار استحقاق دفعة إيجارية متأخرة - ${tenantName} (${installment.invoiceNumber})`;

  const body = `السلام عليكم ورحمة الله وبركاته،

السادة / ${tenantName} المحترمون،

تحية طيبة وبعد،

نود تذكيركم بلطف بأن الدفعة الإيجارية رقم (${installment.invoiceNumber}) المستحقة بتاريخ (${installment.dueDate}) وقيمتها (${amountStr}) قد تجاوزت موعد الاستحقاق بـ (${daysOverdue}) يوماً.

تفاصيل الفاتورة:
- رقم الفاتورة: ${installment.invoiceNumber}
- رقم العقد: ${installment.contractId}
- الفترة: ${installment.periodStartDate} إلى ${installment.periodEndDate}
- المبلغ المتبقي للسداد: ${amountStr}
${ibanStr}

يرجى التكرم بسداد المبلغ المتبقي في أقرب وقت وموافاتنا بإشعار التحويل البنكي شاكرين لكم حسن تعاونكم.

مع خالص التحية والتقدير،
${building}
هاتف / بريد التواصل: ${settings.notificationEmail || 'info@property.sa'}
`;

  return { subject, body };
};

export const generateExpiryEmail = (
  tenant: Tenant,
  contract: Contract,
  office: Office | undefined,
  settings: SystemSettings,
  daysLeft: number
): { subject: string; body: string } => {
  const building = settings.buildingNameAr || settings.buildingName || 'إدارة العقار';
  const tenantName = tenant.nameAr || tenant.name;
  const unitStr = office ? `الوحدة رقم (${office.officeNumber})` : `العقد (${contract.id})`;

  const subject = `تنبيه قرب انتهاء عقد الإيجار - ${tenantName} (${unitStr})`;

  const body = `السلام عليكم ورحمة الله وبركاته،

السادة / ${tenantName} المحترمون،

تحية طيبة وبعد،

نحيطكم علماً بأن عقد الإيجار رقم (${contract.id}) الخاص بـ ${unitStr} سينتهي خلال (${daysLeft}) يوماً، وتحديداً بتاريخ (${contract.endDate}).

تفاصيل العقد:
- رقم العقد: ${contract.id}
- تاريخ بداية العقد: ${contract.startDate}
- تاريخ نهاية العقد: ${contract.endDate}
- القيمة الإجمالية السنوية: ${contract.totalRent.toLocaleString()} ر.س

يرجى إفادتنا برغبتكم الكريمة بخصوص تجديد العقد أو إنهائه قبل موعد الانتهاء بوقت كافٍ لترتيب الإجراءات اللازمة.

شاكرين لكم طيب تعاونكم،
${building}
بريد التواصل: ${settings.notificationEmail || 'info@property.sa'}
`;

  return { subject, body };
};

export const generateReceiptEmail = (
  tenant: Tenant,
  installment: PaymentInstallment,
  amountPaid: number,
  paymentMethod: string,
  settings: SystemSettings
): { subject: string; body: string } => {
  const building = settings.buildingNameAr || settings.buildingName || 'إدارة العقار';
  const tenantName = tenant.nameAr || tenant.name;

  const subject = `سند استلام دفعة إيجارية - ${installment.invoiceNumber} - ${tenantName}`;

  const body = `السلام عليكم ورحمة الله وبركاته،

السادة / ${tenantName} المحترمون،

نفيدكم باستلام مبلغ وقدره (${amountPaid.toLocaleString()} ر.س) كدفعة إيجارية مسددة بواسطة (${paymentMethod}).

تفاصيل السند:
- رقم الفاتورة: ${installment.invoiceNumber}
- رقم العقد: ${installment.contractId}
- المبلغ المدفوع: ${amountPaid.toLocaleString()} ر.س
- الرصيد المتبقي على الفاتورة: ${installment.remainingAmount.toLocaleString()} ر.س
- التاريخ: ${new Date().toISOString().split('T')[0]}

نشكركم على التزامكم وسدادكم في الموعد المحدد.

مع أطيب التحيات،
${building}
`;

  return { subject, body };
};

// ----------------- Dispatch Helpers -----------------

export const openNativeMailClient = (params: EmailParams) => {
  const { to, subject, body } = params;
  const mailtoUrl = `mailto:${encodeURIComponent(to || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoUrl, '_blank');
};

export const sendDirectEmailViaResend = async (
  params: EmailParams,
  settings: SystemSettings
): Promise<{ success: boolean; message: string }> => {
  const apiKey = settings.resendApiKey || (import.meta as any).env?.VITE_RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, message: 'Resend API Key is not configured in Settings.' };
  }

  const sender = settings.senderEmail || 'onboarding@resend.dev';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${settings.buildingName || 'Property Management'} <${sender}>`,
        to: [params.to],
        subject: params.subject,
        text: params.body,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, message: 'Email sent successfully via Cloud Mail Service!' };
    } else {
      return { success: false, message: data.message || 'Failed to send email via Resend' };
    }
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network error sending email' };
  }
};
