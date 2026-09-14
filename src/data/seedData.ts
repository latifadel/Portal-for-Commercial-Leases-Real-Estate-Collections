import {
  Tenant,
  Office,
  Contract,
  PaymentInstallment,
  SystemNotification,
  ActivityLog,
  SystemSettings,
  User,
} from '../types';

// Default Users (Role Profiles)
export const initialUsers: User[] = [
  {
    id: 'user-admin-1',
    name: 'Property Admin',
    email: 'admin@building.sa',
    role: 'ADMIN',
  },
  {
    id: 'user-viewer-1',
    name: 'Auditor / Viewer',
    email: 'viewer@building.sa',
    role: 'VIEWER',
  },
];

// Blank Settings (User sets their commercial building details)
export const initialSettings: SystemSettings = {
  buildingName: '',
  buildingNameAr: '',
  buildingAddress: '',
  buildingAddressAr: '',
  crNumber: '',
  vatNumber: '',
  currency: 'SAR',
  defaultVatRate: 0.15,
  language: 'en',
  simulatedDate: new Date().toISOString().split('T')[0],
  useSimulatedDate: false,
};

// Clean Empty Data Collections (User creates their own data)
export const initialTenants: Tenant[] = [];
export const initialOffices: Office[] = [];
export const initialContracts: Contract[] = [];
export const initialPayments: PaymentInstallment[] = [];
export const initialNotifications: SystemNotification[] = [];
export const initialActivityLogs: ActivityLog[] = [];
