import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Tenant,
  Office,
  Contract,
  PaymentInstallment,
  SystemNotification,
  ActivityLog,
  SystemSettings,
  ContractAttachment,
  PaymentTransaction,
} from '../types';
import { initialSettings } from '../data/seedData';
import {
  generatePaymentSchedule,
  determineContractStatus,
  determinePaymentStatus,
  calculateDaysOverdue,
  calculateVAT,
  calculateTotalWithVAT,
} from '../utils/calculations';
import { useAuth } from './AuthContext';
import {
  loadPropertyDataFromSupabase,
  savePropertyDataToSupabase,
  subscribeToRealtimePropertyData,
  SupabasePropertyData,
} from '../services/supabaseClient';

interface DataContextType {
  tenants: Tenant[];
  offices: Office[];
  contracts: Contract[];
  payments: PaymentInstallment[];
  notifications: SystemNotification[];
  activityLogs: ActivityLog[];
  settings: SystemSettings;
  effectiveDate: string;

  // Tenant CRUD
  addTenant: (tenant: Omit<Tenant, 'id' | 'createdAt'>) => string;
  updateTenant: (id: string, updates: Partial<Tenant>) => void;
  deleteTenant: (id: string) => void;

  // Office CRUD
  addOffice: (office: Omit<Office, 'id'>) => string;
  updateOffice: (id: string, updates: Partial<Office>) => void;
  deleteOffice: (id: string) => void;

  // Contract CRUD
  addContract: (contract: Omit<Contract, 'id' | 'createdAt' | 'vatAmount' | 'totalRent' | 'status'> & { customInstallments?: PaymentInstallment[] }) => string;
  updateContract: (id: string, updates: Partial<Contract>) => void;
  cancelContract: (id: string, reason?: string) => void;
  deleteContract: (id: string) => void;
  renewContract: (contractId: string, newStartDate: string, newEndDate: string, newBaseRent: number) => string;
  attachContractDoc: (contractId: string, doc: Omit<ContractAttachment, 'id' | 'uploadedAt'>) => void;

  // Payment CRUD
  recordPayment: (params: {
    installmentId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: PaymentTransaction['paymentMethod'];
    referenceNumber?: string;
    receiptAttachment?: string;
    notes?: string;
  }) => void;
  updateInstallment: (installmentId: string, updates: Partial<PaymentInstallment>) => void;
  deletePayment: (installmentId: string) => void;

  // Notifications
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Settings & System
  updateSettings: (updates: Partial<SystemSettings>) => void;
  resetToDefaultData: () => void;
  exportBackup: () => string;
  importBackup: (jsonData: string) => boolean;

  // Supabase Cloud Synchronization
  cloudStatus: 'synced' | 'saving' | 'offline' | 'error';
  lastSyncedAt: string;
  refreshFromCloud: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const getCacheKey = (userId?: string) => (userId ? `prop_mgmt_supabase_cache_${userId}` : 'prop_mgmt_supabase_cache_guest');

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<PaymentInstallment[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);

  const [cloudStatus, setCloudStatus] = useState<'synced' | 'saving' | 'offline' | 'error'>('synced');
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(() => new Date().toLocaleTimeString());

  // Prevent saving during initial cloud fetch
  const isInitialLoadDone = useRef<boolean>(false);

  // Effective Current Date (supports simulation date override)
  const effectiveDate = useMemo(() => {
    return settings.useSimulatedDate && settings.simulatedDate
      ? settings.simulatedDate
      : new Date().toISOString().split('T')[0];
  }, [settings.useSimulatedDate, settings.simulatedDate]);

  // Sync to local cache as offline fallback per user
  useEffect(() => {
    if (!currentUser) return;
    try {
      const payload: SupabasePropertyData = {
        tenants,
        offices,
        contracts,
        payments,
        settings,
        activityLogs,
        notifications,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(getCacheKey(currentUser.id), JSON.stringify(payload));
    } catch (e) {
      // ignore storage quota errors
    }
  }, [currentUser, tenants, offices, contracts, payments, settings, activityLogs, notifications]);

  // 1. Initial Cloud Data Fetch & Realtime Subscription per user
  useEffect(() => {
    if (!currentUser) {
      setTenants([]);
      setOffices([]);
      setContracts([]);
      setPayments([]);
      setNotifications([]);
      setActivityLogs([]);
      setSettings(initialSettings);
      isInitialLoadDone.current = false;
      return;
    }

    isInitialLoadDone.current = false;
    let isMounted = true;

    // Load from user-specific local cache first for instant render
    try {
      const saved = localStorage.getItem(getCacheKey(currentUser.id));
      if (saved) {
        const cached = JSON.parse(saved);
        const cachedContracts: Contract[] = Array.isArray(cached.contracts) ? cached.contracts : [];
        if (Array.isArray(cached.tenants)) setTenants(cached.tenants);
        if (Array.isArray(cached.offices)) setOffices(cached.offices);
        setContracts(cachedContracts);

        let cachedPayments: PaymentInstallment[] = Array.isArray(cached.payments) ? cached.payments : [];
        const validContractMap = new Map<string, Contract>(cachedContracts.filter((c: Contract) => c.status !== 'CANCELLED').map((c: Contract) => [c.id, c]));
        cachedPayments = cachedPayments.filter(p => {
          const contract = validContractMap.get(p.contractId);
          if (!contract) return false;
          if (p.tenantId && p.tenantId !== contract.tenantId) return false;
          if (p.officeId && p.officeId !== contract.officeId) return false;
          return true;
        });

        for (const [cId, contract] of validContractMap.entries()) {
          const hasPayments = cachedPayments.some(p => p.contractId === cId);
          if (!hasPayments) {
            const generated = generatePaymentSchedule({
              contractId: contract.id,
              tenantId: contract.tenantId,
              officeId: contract.officeId,
              startDate: contract.startDate,
              endDate: contract.endDate,
              durationMonths: contract.durationMonths,
              baseRent: contract.baseRent,
              vatRate: contract.vatRate || 0.15,
              paymentFrequency: contract.paymentFrequency,
            });
            cachedPayments = [...cachedPayments, ...generated];
          }
        }

        setPayments(cachedPayments);
        if (cached.settings) setSettings(prev => ({ ...prev, ...cached.settings }));
        if (Array.isArray(cached.activityLogs)) setActivityLogs(cached.activityLogs);
        if (Array.isArray(cached.notifications)) setNotifications(cached.notifications);
      } else {
        // Fresh user: start with empty data
        setTenants([]);
        setOffices([]);
        setContracts([]);
        setPayments([]);
        setNotifications([]);
        setActivityLogs([]);
        setSettings(initialSettings);
      }
    } catch {
      // ignore
    }

    const fetchFromSupabase = async () => {
      setCloudStatus('saving');
      const cloudData = await loadPropertyDataFromSupabase(currentUser.id);
      if (!isMounted) return;

      if (cloudData) {
        const loadedContracts: Contract[] = Array.isArray(cloudData.contracts) ? cloudData.contracts : [];
        if (Array.isArray(cloudData.tenants)) setTenants(cloudData.tenants);
        if (Array.isArray(cloudData.offices)) setOffices(cloudData.offices);
        setContracts(loadedContracts);

        let loadedPayments: PaymentInstallment[] = Array.isArray(cloudData.payments) ? cloudData.payments : [];
        const validContractMap = new Map<string, Contract>(loadedContracts.filter((c: Contract) => c.status !== 'CANCELLED').map((c: Contract) => [c.id, c]));
        
        // Strip orphaned payments and payments with mismatched tenant/office from old deleted contracts
        loadedPayments = loadedPayments.filter(p => {
          const contract = validContractMap.get(p.contractId);
          if (!contract) return false;
          // If payment was created under an older deleted contract with a different tenant/office, purge it
          if (p.tenantId && p.tenantId !== contract.tenantId) return false;
          if (p.officeId && p.officeId !== contract.officeId) return false;
          return true;
        });

        // Ensure every active contract has its payment schedule
        for (const [cId, contract] of validContractMap.entries()) {
          const hasPayments = loadedPayments.some(p => p.contractId === cId);
          if (!hasPayments) {
            const generated = generatePaymentSchedule({
              contractId: contract.id,
              tenantId: contract.tenantId,
              officeId: contract.officeId,
              startDate: contract.startDate,
              endDate: contract.endDate,
              durationMonths: contract.durationMonths,
              baseRent: contract.baseRent,
              vatRate: contract.vatRate || 0.15,
              paymentFrequency: contract.paymentFrequency,
            });
            loadedPayments = [...loadedPayments, ...generated];
          }
        }

        setPayments(loadedPayments);
        if (cloudData.settings) setSettings(prev => ({ ...prev, ...cloudData.settings }));
        if (Array.isArray(cloudData.activityLogs)) setActivityLogs(cloudData.activityLogs);
        if (Array.isArray(cloudData.notifications)) setNotifications(cloudData.notifications);

        const timeStr = new Date().toLocaleTimeString();
        setLastSyncedAt(timeStr);
        setCloudStatus('synced');
      } else {
        // No cloud record yet for this user - create initial clean store in Supabase
        const initialPayload: SupabasePropertyData = {
          tenants: [],
          offices: [],
          contracts: [],
          payments: [],
          settings: initialSettings,
          activityLogs: [],
          notifications: [],
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.name,
        };

        await savePropertyDataToSupabase(initialPayload, currentUser.id);
        setCloudStatus('synced');
      }

      isInitialLoadDone.current = true;
    };

    fetchFromSupabase();

    // Subscribe to realtime changes for this user's private data across all their devices
    const unsubscribe = subscribeToRealtimePropertyData(currentUser.id, (incoming: SupabasePropertyData) => {
      if (!isMounted) return;
      if (Array.isArray(incoming.tenants)) setTenants(incoming.tenants);
      if (Array.isArray(incoming.offices)) setOffices(incoming.offices);
      if (Array.isArray(incoming.contracts)) setContracts(incoming.contracts);
      if (Array.isArray(incoming.payments)) {
        const validIds = new Set((incoming.contracts || []).filter((c: any) => c.status !== 'CANCELLED').map((c: any) => c.id));
        setPayments(incoming.payments.filter((p: any) => validIds.has(p.contractId)));
      }
      if (incoming.settings) setSettings(prev => ({ ...prev, ...incoming.settings }));
      if (Array.isArray(incoming.activityLogs)) setActivityLogs(incoming.activityLogs);
      if (Array.isArray(incoming.notifications)) setNotifications(incoming.notifications);

      setLastSyncedAt(new Date().toLocaleTimeString());
      setCloudStatus('synced');
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [currentUser]);

  // 2. Auto-save to Supabase with debounce whenever state changes for currentUser
  useEffect(() => {
    if (!currentUser || !isInitialLoadDone.current) return;

    const timer = setTimeout(async () => {
      setCloudStatus('saving');
      const payload: SupabasePropertyData = {
        tenants,
        offices,
        contracts,
        payments,
        settings,
        activityLogs,
        notifications,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.name,
      };

      const res = await savePropertyDataToSupabase(payload, currentUser.id);
      if (res.success) {
        setLastSyncedAt(new Date().toLocaleTimeString());
        setCloudStatus('synced');
      } else {
        setCloudStatus('error');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [currentUser, tenants, offices, contracts, payments, settings, activityLogs, notifications]);

  const refreshFromCloud = async () => {
    if (!currentUser) return;
    setCloudStatus('saving');
    const cloudData = await loadPropertyDataFromSupabase(currentUser.id);
    if (cloudData) {
      const loadedContracts: Contract[] = Array.isArray(cloudData.contracts) ? cloudData.contracts : [];
      if (Array.isArray(cloudData.tenants)) setTenants(cloudData.tenants);
      if (Array.isArray(cloudData.offices)) setOffices(cloudData.offices);
      setContracts(loadedContracts);

      let loadedPayments: PaymentInstallment[] = Array.isArray(cloudData.payments) ? cloudData.payments : [];
      const validContractMap = new Map<string, Contract>(loadedContracts.filter((c: Contract) => c.status !== 'CANCELLED').map((c: Contract) => [c.id, c]));
      
      // Permanently filter out orphaned payments and payments with mismatched tenant/office from old deleted contracts in Supabase
      loadedPayments = loadedPayments.filter(p => {
        const contract = validContractMap.get(p.contractId);
        if (!contract) return false;
        if (p.tenantId && p.tenantId !== contract.tenantId) return false;
        if (p.officeId && p.officeId !== contract.officeId) return false;
        return true;
      });

      // Ensure every active contract has its payment schedule
      for (const [cId, contract] of validContractMap.entries()) {
        const hasPayments = loadedPayments.some(p => p.contractId === cId);
        if (!hasPayments) {
          const generated = generatePaymentSchedule({
            contractId: contract.id,
            tenantId: contract.tenantId,
            officeId: contract.officeId,
            startDate: contract.startDate,
            endDate: contract.endDate,
            durationMonths: contract.durationMonths,
            baseRent: contract.baseRent,
            vatRate: contract.vatRate || 0.15,
            paymentFrequency: contract.paymentFrequency,
          });
          loadedPayments = [...loadedPayments, ...generated];
        }
      }

      setPayments(loadedPayments);
      if (cloudData.settings) setSettings(prev => ({ ...prev, ...cloudData.settings }));
      setLastSyncedAt(new Date().toLocaleTimeString());
      setCloudStatus('synced');

      // Persist the cleaned payments directly back to Supabase so it never returns old orphaned payments again
      savePropertyDataToSupabase({
        tenants: cloudData.tenants || [],
        offices: cloudData.offices || [],
        contracts: loadedContracts,
        payments: loadedPayments,
        settings: cloudData.settings || initialSettings,
        activityLogs: cloudData.activityLogs || [],
        notifications: cloudData.notifications || [],
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.name,
      }, currentUser.id);
    } else {
      setCloudStatus('error');
    }
  };

  // Dynamically update statuses based on effectiveDate
  useEffect(() => {
    setPayments(prevPayments =>
      prevPayments.map(p => {
        const calculatedStatus = determinePaymentStatus(p, effectiveDate);
        return calculatedStatus !== p.status ? { ...p, status: calculatedStatus } : p;
      })
    );

    setContracts(prevContracts =>
      prevContracts.map(ctr => {
        const calculatedStatus = determineContractStatus(ctr, effectiveDate);
        return calculatedStatus !== ctr.status ? { ...ctr, status: calculatedStatus } : ctr;
      })
    );
  }, [effectiveDate]);

  // Activity Log helper
  const logActivity = (
    action: ActivityLog['action'],
    description: string,
    descriptionAr: string,
    entityType: ActivityLog['entityType'],
    entityId: string
  ) => {
    const newLog: ActivityLog = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      action,
      description,
      descriptionAr,
      entityType,
      entityId,
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'Property Owner',
      userRole: currentUser?.role || 'ADMIN',
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // ------------------- Tenant Actions -------------------
  const addTenant = (tenantData: Omit<Tenant, 'id' | 'createdAt'>): string => {
    const id = `ten-${Date.now()}`;
    const newTenant: Tenant = {
      ...tenantData,
      id,
      createdAt: effectiveDate,
    };
    setTenants(prev => [newTenant, ...prev]);
    logActivity(
      'TENANT_ADDED',
      `Added new tenant: ${newTenant.name}`,
      `إضافة مستأجر جديد: ${newTenant.nameAr || newTenant.name}`,
      'TENANT',
      id
    );
    return id;
  };

  const updateTenant = (id: string, updates: Partial<Tenant>) => {
    setTenants(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
    logActivity('TENANT_UPDATED', `Updated tenant profile #${id}`, `تحديث بيانات المستأجر #${id}`, 'TENANT', id);
  };

  const deleteTenant = (id: string) => {
    const target = tenants.find(t => t.id === id);
    setTenants(prev => prev.filter(t => t.id !== id));
    logActivity(
      'TENANT_DELETED',
      `Deleted tenant ${target?.name || id}`,
      `حذف المستأجر ${target?.nameAr || target?.name || id}`,
      'TENANT',
      id
    );
  };

  // ------------------- Office Actions -------------------
  const addOffice = (officeData: Omit<Office, 'id'>): string => {
    const id = `off-${officeData.officeNumber.replace(/\s+/g, '-').toLowerCase()}-${Date.now() % 1000}`;
    const newOffice: Office = {
      ...officeData,
      id,
    };
    setOffices(prev => [...prev, newOffice]);
    logActivity(
      'OFFICE_ADDED',
      `Added office unit ${newOffice.officeNumber}`,
      `إضافة وحدة مكتبية جديدة: ${newOffice.officeNumber}`,
      'OFFICE',
      id
    );
    return id;
  };

  const updateOffice = (id: string, updates: Partial<Office>) => {
    setOffices(prev => prev.map(o => (o.id === id ? { ...o, ...updates } : o)));
    logActivity('OFFICE_UPDATED', `Updated office ${id}`, `تحديث بيانات المكتب ${id}`, 'OFFICE', id);
  };

  const deleteOffice = (id: string) => {
    const target = offices.find(o => o.id === id);
    setOffices(prev => prev.filter(o => o.id !== id));
    logActivity(
      'OFFICE_DELETED',
      `Deleted office ${target?.officeNumber || id}`,
      `حذف المكتب ${target?.officeNumber || id}`,
      'OFFICE',
      id
    );
  };

  // ------------------- Contract Actions -------------------
  const addContract = (
    contractData: Omit<Contract, 'id' | 'createdAt' | 'vatAmount' | 'totalRent' | 'status'> & {
      customInstallments?: PaymentInstallment[];
    }
  ): string => {
    let nextNum = contracts.length + 1;
    let id = `CTR-2026-${String(nextNum).padStart(3, '0')}`;
    while (contracts.some(c => c.id === id)) {
      nextNum++;
      id = `CTR-2026-${String(nextNum).padStart(3, '0')}`;
    }
    const vatAmount = calculateVAT(contractData.baseRent, contractData.vatRate);
    const totalRent = calculateTotalWithVAT(contractData.baseRent, contractData.vatRate);

    const initialStatus = determineContractStatus(
      { startDate: contractData.startDate, endDate: contractData.endDate, status: 'ACTIVE' },
      effectiveDate
    );

    const newContract: Contract = {
      ...contractData,
      id,
      vatAmount,
      totalRent,
      status: initialStatus,
      attachments: contractData.attachments || [],
      createdAt: effectiveDate,
    };

    let generatedInstallments: PaymentInstallment[] = [];
    if (contractData.customInstallments && contractData.customInstallments.length > 0) {
      generatedInstallments = contractData.customInstallments.map(inst => ({
        ...inst,
        contractId: id,
        tenantId: contractData.tenantId,
        officeId: contractData.officeId,
      }));
    } else {
      generatedInstallments = generatePaymentSchedule({
        contractId: id,
        tenantId: contractData.tenantId,
        officeId: contractData.officeId,
        startDate: contractData.startDate,
        endDate: contractData.endDate,
        durationMonths: contractData.durationMonths,
        baseRent: contractData.baseRent,
        vatRate: contractData.vatRate,
        paymentFrequency: contractData.paymentFrequency,
      });
    }

    setContracts(prev => [newContract, ...prev.filter(c => c.id !== id)]);
    setPayments(prev => [...prev.filter(p => p.contractId !== id), ...generatedInstallments]);

    // Mark office as OCCUPIED
    const calculatedAnnualRent =
      contractData.annualRent ||
      (contractData.durationMonths > 0
        ? Math.round((contractData.baseRent / (contractData.durationMonths / 12)) * 100) / 100
        : contractData.baseRent);

    setOffices(prev =>
      prev.map(o =>
        o.id === contractData.officeId
          ? {
              ...o,
              status: 'OCCUPIED',
              currentTenantId: contractData.tenantId,
              currentContractId: id,
              annualRent: calculatedAnnualRent,
            }
          : o
      )
    );

    // Link office to tenant
    setTenants(prev =>
      prev.map(t => {
        if (t.id === contractData.tenantId) {
          const currentOffices = t.officeIds || [];
          if (!currentOffices.includes(contractData.officeId)) {
            return { ...t, officeIds: [...currentOffices, contractData.officeId] };
          }
        }
        return t;
      })
    );

    logActivity(
      'CONTRACT_CREATED',
      `Created lease contract ${id} (Total: SAR ${totalRent.toLocaleString()})`,
      `إنشاء عقد إيجار جديد ${id} بمبلغ إجمالي ${totalRent.toLocaleString()} ر.س`,
      'CONTRACT',
      id
    );

    return id;
  };

  const updateContract = (id: string, updates: Partial<Contract>) => {
    setContracts(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    logActivity('CONTRACT_UPDATED', `Updated contract ${id}`, `تعديل العقد ${id}`, 'CONTRACT', id);
  };

  const deleteContract = (id: string) => {
    const contract = contracts.find(c => c.id === id);
    if (!contract) return;

    // 1. Remove the contract completely
    setContracts(prev => prev.filter(c => c.id !== id));

    // 2. Remove all associated payments
    setPayments(prev => prev.filter(p => p.contractId !== id));

    // 3. Free the office back to VACANT
    setOffices(prev =>
      prev.map(o =>
        o.id === contract.officeId && (o.currentContractId === id || !o.currentContractId)
          ? { ...o, status: 'VACANT', currentTenantId: undefined, currentContractId: undefined }
          : o
      )
    );

    // 4. Update tenant's officeIds
    setTenants(prev =>
      prev.map(t => {
        if (t.id === contract.tenantId && t.officeIds) {
          const hasOtherContract = contracts.some(
            c => c.id !== id && c.tenantId === contract.tenantId && c.officeId === contract.officeId && c.status !== 'CANCELLED'
          );
          if (!hasOtherContract) {
            return {
              ...t,
              officeIds: t.officeIds.filter(oid => oid !== contract.officeId),
            };
          }
        }
        return t;
      })
    );

    logActivity('CONTRACT_CANCELLED', `Deleted contract ${id}`, `حذف العقد ${id}`, 'CONTRACT', id);
  };

  const cancelContract = (id: string, reason?: string) => {
    // Cancelling or deleting completely removes the contract, its payments, and frees the office
    deleteContract(id);
  };

  const renewContract = (contractId: string, newStartDate: string, newEndDate: string, newBaseRent: number): string => {
    const existing = contracts.find(c => c.id === contractId);
    if (!existing) return '';

    setContracts(prev => prev.map(c => (c.id === contractId ? { ...c, status: 'RENEWED' as const } : c)));

    const newContractId = addContract({
      tenantId: existing.tenantId,
      officeId: existing.officeId,
      startDate: newStartDate,
      endDate: newEndDate,
      durationMonths: existing.durationMonths,
      baseRent: newBaseRent,
      vatRate: existing.vatRate,
      paymentFrequency: existing.paymentFrequency,
      notes: `Renewal of contract ${contractId}`,
    });

    logActivity(
      'CONTRACT_RENEWED',
      `Renewed contract ${contractId} into new contract ${newContractId}`,
      `تجديد العقد ${contractId} إلى العقد الجديد ${newContractId}`,
      'CONTRACT',
      newContractId
    );

    return newContractId;
  };

  const attachContractDoc = (contractId: string, doc: Omit<ContractAttachment, 'id' | 'uploadedAt'>) => {
    const newAtt: ContractAttachment = {
      ...doc,
      id: `att-${Date.now()}`,
      uploadedAt: effectiveDate,
    };
    setContracts(prev =>
      prev.map(c => (c.id === contractId ? { ...c, attachments: [...(c.attachments || []), newAtt] } : c))
    );
  };

  // ------------------- Payment Recording -------------------
  const recordPayment = (params: {
    installmentId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: PaymentTransaction['paymentMethod'];
    referenceNumber?: string;
    receiptAttachment?: string;
    notes?: string;
  }) => {
    const { installmentId, amount, paymentDate, paymentMethod, referenceNumber, receiptAttachment, notes } = params;

    const installment = payments.find(p => p.id === installmentId);
    if (!installment) return;

    const newPaidAmount = Math.round(((installment.paidAmount || 0) + amount) * 100) / 100;
    const newRemaining = Math.max(0, Math.round((installment.totalAmount - newPaidAmount) * 100) / 100);

    const isFullyPaid = newRemaining === 0;
    const newStatus = isFullyPaid
      ? 'PAID'
      : calculateDaysOverdue(installment.dueDate, effectiveDate) > 0
      ? 'OVERDUE'
      : 'PARTIALLY_PAID';

    const newTx: PaymentTransaction = {
      id: `tx-${Date.now()}`,
      amount,
      paymentDate,
      paymentMethod,
      referenceNumber,
      receiptAttachment,
      notes,
      recordedBy: currentUser?.name || 'Admin',
    };

    setPayments(prev =>
      prev.map(p =>
        p.id === installmentId
          ? {
              ...p,
              paidAmount: newPaidAmount,
              remainingAmount: newRemaining,
              paymentDate: isFullyPaid ? paymentDate : p.paymentDate || paymentDate,
              paymentMethod: paymentMethod,
              status: newStatus,
              transactions: [...(p.transactions || []), newTx],
            }
          : p
      )
    );

    if (isFullyPaid) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#059669', '#34d399', '#f59e0b'],
        });
      } catch (e) {
        // ignore in non-browser env
      }
    }

    logActivity(
      'PAYMENT_RECORDED',
      `Recorded payment of SAR ${amount.toLocaleString()} for invoice ${installment.invoiceNumber}`,
      `تسجيل دفعة بمبلغ ${amount.toLocaleString()} ر.س للفاتورة ${installment.invoiceNumber}`,
      'PAYMENT',
      installmentId
    );
  };

  const updateInstallment = (installmentId: string, updates: Partial<PaymentInstallment>) => {
    setPayments(prev =>
      prev.map(p => {
        if (p.id !== installmentId) return p;
        const updated = { ...p, ...updates };
        if (updates.totalAmount !== undefined || updates.paidAmount !== undefined || updates.dueDate !== undefined) {
          const total = updated.totalAmount;
          const paid = updated.paidAmount || 0;
          updated.remainingAmount = Math.max(0, Math.round((total - paid) * 100) / 100);
          updated.status = determinePaymentStatus(updated, effectiveDate);
        }
        return updated;
      })
    );
    logActivity(
      'PAYMENT_UPDATED',
      `Updated payment installment #${installmentId}`,
      `تعديل الدفعة #${installmentId}`,
      'PAYMENT',
      installmentId
    );
  };

  const deletePayment = (installmentId: string) => {
    const target = payments.find(p => p.id === installmentId);
    setPayments(prev => prev.filter(p => p.id !== installmentId));
    logActivity(
      'PAYMENT_UPDATED',
      `Deleted payment installment ${target?.invoiceNumber || installmentId}`,
      `حذف الدفعة ${target?.invoiceNumber || installmentId}`,
      'PAYMENT',
      installmentId
    );
  };

  // ------------------- Notifications -------------------
  const unreadNotificationCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // ------------------- Settings & Backup -------------------
  const updateSettings = (updates: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    logActivity('SETTINGS_UPDATED', 'Updated building settings', 'تحديث إعدادات النظام', 'SYSTEM', 'settings');
  };

  const resetToDefaultData = () => {
    setTenants([]);
    setOffices([]);
    setContracts([]);
    setPayments([]);
    setNotifications([]);
    setActivityLogs([]);
    setSettings(initialSettings);
  };

  const exportBackup = (): string => {
    const backup = {
      tenants,
      offices,
      contracts,
      payments,
      notifications,
      activityLogs,
      settings,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(backup, null, 2);
  };

  const importBackup = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.tenants && parsed.offices && parsed.contracts && parsed.payments) {
        const validContractIds = new Set((parsed.contracts || []).filter((c: any) => c.status !== 'CANCELLED').map((c: any) => c.id));
        setTenants(parsed.tenants);
        setOffices(parsed.offices);
        setContracts(parsed.contracts);
        setPayments(parsed.payments.filter((p: any) => validContractIds.has(p.contractId)));
        if (parsed.notifications) setNotifications(parsed.notifications);
        if (parsed.activityLogs) setActivityLogs(parsed.activityLogs);
        if (parsed.settings) setSettings(parsed.settings);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  return (
    <DataContext.Provider
      value={{
        tenants,
        offices,
        contracts,
        payments,
        notifications,
        activityLogs,
        settings,
        effectiveDate,
        addTenant,
        updateTenant,
        deleteTenant,
        addOffice,
        updateOffice,
        deleteOffice,
        addContract,
        updateContract,
        cancelContract,
        deleteContract,
        renewContract,
        attachContractDoc,
        recordPayment,
        updateInstallment,
        deletePayment,
        unreadNotificationCount,
        markNotificationRead,
        markAllNotificationsRead,
        updateSettings,
        resetToDefaultData,
        exportBackup,
        importBackup,
        cloudStatus,
        lastSyncedAt,
        refreshFromCloud,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
