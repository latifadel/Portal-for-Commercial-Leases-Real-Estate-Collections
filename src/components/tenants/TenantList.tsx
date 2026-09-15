import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Building2,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Tenant } from '../../types';
import { Badge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { TenantModal } from './TenantModal';
import { formatSAR, formatDate } from '../../utils/formatters';

interface TenantListProps {
  onNavigate: (view: string, id?: string) => void;
  selectedTenantId?: string;
}

export const TenantList: React.FC<TenantListProps> = ({ onNavigate, selectedTenantId }) => {
  const { tenants, offices, contracts, payments, deleteTenant } = useData();
  const { language, t } = useLanguage();
  const { isAdmin } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [tenantToEdit, setTenantToEdit] = useState<Tenant | null>(null);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);

  const filteredTenants = useMemo(() => {
    return tenants.filter(tenant => {
      const matchesStatus =
        statusFilter === 'ALL' ? true : tenant.status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        tenant.name.toLowerCase().includes(q) ||
        (tenant.nameAr && tenant.nameAr.toLowerCase().includes(q)) ||
        (tenant.notes && tenant.notes.toLowerCase().includes(q));

      return matchesStatus && matchesQuery;
    });
  }, [tenants, searchQuery, statusFilter]);

  const handleEdit = (tenant: Tenant, e: React.MouseEvent) => {
    e.stopPropagation();
    setTenantToEdit(tenant);
    setIsAddEditOpen(true);
  };

  const handleDelete = (tenant: Tenant, e: React.MouseEvent) => {
    e.stopPropagation();
    setTenantToDelete(tenant);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-najdi-900 dark:text-cream-50 flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Users className="h-6 w-6" />
            </div>
            <span>{t('tenants')}</span>
            <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-sand-200/70 dark:bg-najdi-800 text-najdi-800 dark:text-cream-200">
              {tenants.length}
            </span>
          </h2>
          <p className="text-xs text-sand-500 dark:text-sand-400 mt-1">
            {language === 'ar' ? 'سجل مستأجري مركز العبداللطيف والعقود المرتبطة' : 'Alabdullatif Center tenant directory and linked lease agreements'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setTenantToEdit(null);
              setIsAddEditOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sand-500 hover:bg-sand-600 text-najdi-900 text-xs font-bold transition-all shadow-sm shadow-sand-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>{t('add_tenant')}</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sand-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'البحث باسم المستأجر...' : 'Search by tenant name...'}
            className="w-full ps-10 pe-4 py-2 rounded-xl text-xs bg-cream-50 dark:bg-najdi-950 border border-cream-300 dark:border-najdi-700 text-najdi-900 dark:text-cream-100 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="inline-flex rounded-xl bg-cream-100 dark:bg-najdi-950 p-1 text-xs border border-cream-200 dark:border-najdi-800">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  statusFilter === status
                    ? 'bg-sand-500 text-najdi-900 shadow-xs'
                    : 'text-sand-600 dark:text-sand-400 hover:text-najdi-900 dark:hover:text-cream-100'
                }`}
              >
                {status === 'ALL'
                  ? (language === 'ar' ? 'الكل' : 'All')
                  : status === 'ACTIVE'
                  ? (language === 'ar' ? 'نشط' : 'Active')
                  : (language === 'ar' ? 'غير نشط' : 'Inactive')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="overflow-hidden rounded-2xl border border-cream-300 dark:border-najdi-800 bg-white dark:bg-najdi-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-cream-100/90 dark:bg-najdi-850 text-sand-600 dark:text-sand-400 uppercase tracking-wider font-semibold border-b border-cream-300 dark:border-najdi-800">
              <tr>
                <th className="p-4 text-start">{t('company_name')}</th>
                <th className="p-4 text-start">{t('office_unit')}</th>
                <th className="p-4 text-start">{language === 'ar' ? 'مدة العقد' : 'Contract Duration'}</th>
                <th className="p-4 text-end">{language === 'ar' ? 'المحصل' : 'Received'}</th>
                <th className="p-4 text-end">{language === 'ar' ? 'المتبقي' : 'Outstanding'}</th>
                <th className="p-4 text-center">{t('status')}</th>
                <th className="p-4 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200 dark:divide-najdi-800">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-sand-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="h-8 w-8 text-sand-300 dark:text-najdi-700" />
                      <p>{language === 'ar' ? 'لا يوجد مستأجرين مضافين حالياً' : 'No tenants found.'}</p>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setTenantToEdit(null);
                            setIsAddEditOpen(true);
                          }}
                          className="mt-2 text-xs text-brand-600 font-bold hover:underline"
                        >
                          + {language === 'ar' ? 'إضافة مستأجر جديد' : 'Add First Tenant'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTenants.map(tenant => {
                  const activeContract = contracts.find(
                    c => c.tenantId === tenant.id && (c.status === 'ACTIVE' || c.status === 'EXPIRING_SOON')
                  );
                  const rentedOffice = offices.find(o => o.currentTenantId === tenant.id);
                  const tenantPayments = payments.filter(p => p.tenantId === tenant.id);
                  const paid = tenantPayments.reduce((s, p) => s + (p.paidAmount || 0), 0);
                  const outstanding = tenantPayments.reduce((s, p) => s + (p.remainingAmount || 0), 0);

                  return (
                    <tr
                      key={tenant.id}
                      className="hover:bg-cream-50/70 dark:hover:bg-najdi-850/40 transition-colors group"
                    >
                      <td className="p-4">
                        <div className="font-bold text-najdi-900 dark:text-cream-50 text-sm">
                          {tenant.name}
                        </div>
                        {tenant.notes && (
                          <div className="text-[11px] text-sand-400 mt-0.5 truncate max-w-xs">
                            {tenant.notes}
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        {rentedOffice ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sand-100 dark:bg-najdi-800 text-najdi-900 dark:text-sand-200 font-semibold text-xs border border-sand-300 dark:border-sand-700">
                            <Building2 className="h-3.5 w-3.5" />
                            {rentedOffice.officeNumber}
                          </span>
                        ) : (
                          <span className="text-sand-400 italic">{language === 'ar' ? 'بدون وحدة' : 'No unit assigned'}</span>
                        )}
                      </td>

                      <td className="p-4">
                        {activeContract ? (
                          <div>
                            <div className="font-semibold text-najdi-800 dark:text-cream-200">
                              {activeContract.durationMonths} {language === 'ar' ? 'شهر' : 'Months'}
                            </div>
                            <div className="text-[11px] text-sand-400">
                              {formatDate(activeContract.startDate, 'dd/MM/yyyy')} - {formatDate(activeContract.endDate, 'dd/MM/yyyy')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sand-400 italic">{language === 'ar' ? 'لا يوجد عقد نشط' : 'No active lease'}</span>
                        )}
                      </td>

                      <td className="p-4 text-end font-semibold text-najdi-800 dark:text-sand-300">
                        {formatSAR(paid, language)}
                      </td>

                      <td className="p-4 text-end font-semibold text-bronze-600 dark:text-bronze-400">
                        {formatSAR(outstanding, language)}
                      </td>

                      <td className="p-4 text-center">
                        <Badge
                          variant={tenant.status === 'ACTIVE' ? 'sand' : 'clay'}
                          size="sm"
                        >
                          {tenant.status === 'ACTIVE'
                            ? (language === 'ar' ? 'نشط' : 'Active')
                            : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                        </Badge>
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isAdmin && (
                            <>
                              <button
                                onClick={e => handleEdit(tenant, e)}
                                className="p-1.5 rounded-lg text-sand-400 hover:text-brand-600 hover:bg-cream-100 dark:hover:bg-najdi-800 transition-colors"
                                title={t('edit')}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={e => handleDelete(tenant, e)}
                                className="p-1.5 rounded-lg text-sand-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                title={t('delete')}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Tenant Modal */}
      <TenantModal
        isOpen={isAddEditOpen}
        onClose={() => {
          setIsAddEditOpen(false);
          setTenantToEdit(null);
        }}
        tenantToEdit={tenantToEdit}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!tenantToDelete}
        onClose={() => setTenantToDelete(null)}
        onConfirm={() => {
          if (tenantToDelete) {
            deleteTenant(tenantToDelete.id);
            setTenantToDelete(null);
          }
        }}
        title={t('confirm_delete')}
        message={
          language === 'ar'
            ? `هل أنت متأكد من رغبتك في حذف المستأجر "${tenantToDelete?.name}"؟`
            : `Are you sure you want to delete tenant "${tenantToDelete?.name}"?`
        }
        confirmText={t('delete')}
        variant="danger"
      />
    </div>
  );
};
