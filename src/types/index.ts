export type Role = 'ADMIN' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  nameAr?: string;
  email: string;
  role: Role;
  avatarUrl?: string;
}

export type TenantStatus = 'ACTIVE' | 'INACTIVE';

export interface Tenant {
  id: string;
  name: string;
  nameAr?: string;
  status: TenantStatus;
  notes?: string;
  contactPerson?: string;
  mobile?: string;
  email?: string;
  crNumber?: string;
  vatNumber?: string;
  nationalId?: string;
  officeIds?: string[];
  createdAt: string;
}

export type OfficeStatus = 'OCCUPIED' | 'VACANT';

export interface Office {
  id: string;
  officeNumber: string;
  floor: number;
  floorLabel?: string;
  sizeSqm: number;
  status: OfficeStatus;
  currentTenantId?: string;
  currentContractId?: string;
  annualRent: number; // Base annual rent in SAR
  notes?: string;
  amenities?: string[];
}

export type PaymentFrequency = 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'ONE_TIME' | 'CUSTOM';

export type ContractStatus = 'UPCOMING' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'RENEWED' | 'CANCELLED';

export type ContractAlertLevel = 'NORMAL' | 'UPCOMING' | 'WARNING' | 'URGENT' | 'EXPIRED';

export interface ContractAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadedAt: string;
  downloadUrl?: string;
}

export interface Contract {
  id: string; // e.g. "CTR-2026-001"
  tenantId: string;
  officeId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationMonths: number;
  baseRent: number; // SAR before VAT
  vatRate: number; // e.g. 0.15 (15%)
  vatAmount: number; // calculated SAR
  totalRent: number; // baseRent + vatAmount
  paymentFrequency: PaymentFrequency;
  status: ContractStatus;
  notes?: string;
  attachments?: ContractAttachment[];
  createdAt: string;
}

export type PaymentStatus = 'UPCOMING' | 'DUE' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE';

export interface PaymentTransaction {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'BANK_TRANSFER' | 'CHEQUE' | 'SADAD' | 'CASH' | 'CREDIT_CARD';
  referenceNumber?: string;
  recordedBy: string;
  receiptAttachment?: string;
  notes?: string;
}

export interface PaymentInstallment {
  id: string; // e.g. "INV-2026-001"
  contractId: string;
  tenantId: string;
  officeId: string;
  invoiceNumber: string;
  installmentNumber?: number;
  periodLabel: string;
  periodStartDate: string;
  periodEndDate: string;
  dueDate: string;
  baseAmount: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentDate?: string;
  paymentMethod?: string;
  status: PaymentStatus;
  transactions?: PaymentTransaction[];
  notes?: string;
}

export interface TenantLeaseReportRow {
  contractId: string;
  tenantId: string;
  tenantName: string;
  tenantNameAr?: string;
  officeId: string;
  officeNumber: string;
  floorLabel?: string;
  startDate: string;
  endDate: string;
  durationMonths: number;
  paymentFrequency: PaymentFrequency;
  baseRent: number;
  vatRate: number;
  vatAmount: number;
  totalRentWithVat: number;
  rentReceived: number;
  outstandingBalance: number;
  overdueAmount: number;
  status: ContractStatus;
}

export interface BuildingFinancialSummary {
  totalTenants: number;
  activeLeases: number;
  totalOffices: number;
  occupiedOffices: number;
  occupancyRate: number;
  totalBaseRent: number;
  totalVat: number;
  totalContractValueWithVat: number;
  totalRentReceived: number;
  totalOutstandingRent: number;
  totalOverdueRent: number;
  overdueInstallmentsCount: number;
}

export type NotificationType = 
  | 'RENT_DUE_SOON' 
  | 'RENT_OVERDUE' 
  | 'CONTRACT_EXPIRING' 
  | 'CONTRACT_EXPIRED' 
  | 'PAYMENT_RECORDED';

export interface SystemNotification {
  id: string;
  type: NotificationType;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  severity: ContractAlertLevel;
  targetType: 'TENANT' | 'CONTRACT' | 'PAYMENT' | 'OFFICE';
  targetId: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: 
    | 'TENANT_ADDED' 
    | 'TENANT_UPDATED' 
    | 'TENANT_DELETED'
    | 'OFFICE_ADDED'
    | 'OFFICE_UPDATED'
    | 'OFFICE_DELETED'
    | 'CONTRACT_CREATED' 
    | 'CONTRACT_UPDATED' 
    | 'CONTRACT_RENEWED' 
    | 'CONTRACT_CANCELLED' 
    | 'PAYMENT_RECORDED' 
    | 'PAYMENT_UPDATED'
    | 'SETTINGS_UPDATED';
  description: string;
  descriptionAr?: string;
  entityType: 'TENANT' | 'OFFICE' | 'CONTRACT' | 'PAYMENT' | 'SYSTEM';
  entityId: string;
  userId: string;
  userName: string;
  userRole: Role;
}

export interface SystemSettings {
  buildingName: string;
  buildingNameAr: string;
  buildingAddress: string;
  buildingAddressAr: string;
  crNumber: string;
  vatNumber: string;
  currency: 'SAR';
  defaultVatRate: number; // 0.15 = 15%
  language: 'en' | 'ar';
  simulatedDate: string; // e.g. "2026-09-13"
  useSimulatedDate: boolean;
  // Cloud Sync & Vercel
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  // Email Notifications
  notificationEmail?: string;
  resendApiKey?: string;
  senderEmail?: string;
  bankName?: string;
  bankIban?: string;
  bankAccountName?: string;
}

export interface AccruedRentSummaryItem {
  contractId: string;
  tenantId: string;
  tenantName: string;
  tenantNameAr?: string;
  officeId: string;
  officeNumber: string;
  contractValue: number;
  startDate: string;
  endDate: string;
  totalDurationDays: number;
  elapsedDays: number;
  earnedToDate: number; // Rental amount earned strictly between start and report date
  amountReceived: number;
  accruedAmount: number; // Net accrued receivable = max(0, earnedToDate - amountReceived)
  outstandingAmount: number; // Total contract remaining to collect
  contractStatus: ContractStatus;
  progressPercent: number;
}
