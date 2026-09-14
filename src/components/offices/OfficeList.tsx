import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Users,
  FileText,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Office } from '../../types';
import { Badge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { OfficeModal } from './OfficeModal';
import { formatSAR } from '../../utils/formatters';

interface OfficeListProps {
  onNavigate: (view: string, id?: string) => void;
  selectedOfficeId?: string;
}

export const OfficeList: React.FC<OfficeListProps> = ({ onNavigate, selectedOfficeId }) => {
  const { offices, tenants, contracts, deleteOffice } = useData();
  const { language, t } = useLanguage();
  const { isAdmin } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OCCUPIED' | 'VACANT'>('ALL');
  const [floorFilter, setFloorFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [officeToEdit, setOfficeToEdit] = useState<Office | null>(null);
  const [officeToDelete, setOfficeToDelete] = useState<Office | null>(null);

  // Available Floors
  const distinctFloors = useMemo(() => {
    const floors = Array.from(new Set(offices.map(o => o.floor))).sort((a, b) => a - b);
    return floors;
  }, [offices]);

  // Overall Occupancy stats
  const stats = useMemo(() => {
    const total = offices.length;
    const occupied = offices.filter(o => o.status === 'OCCUPIED').length;
    const vacant = total - occupied;
    const totalArea = offices.reduce((sum, o) => sum + o.sizeSqm, 0);
    const occupiedArea = offices.filter(o => o.status === 'OCCUPIED').reduce((sum, o) => sum + o.sizeSqm, 0);

    return {
      total,
      occupied,
      vacant,
      totalArea,
      occupiedArea,
      occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
    };
  }, [offices]);

  const filteredOffices = useMemo(() => {
    return offices.filter(office => {
      const matchesStatus = statusFilter === 'ALL' ? true : office.status === statusFilter;
      const matchesFloor = floorFilter === 'ALL' ? true : String(office.floor) === floorFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        office.officeNumber.toLowerCase().includes(q) ||
        (office.floorLabel && office.floorLabel.toLowerCase().includes(q)) ||
        (office.notes && office.notes.toLowerCase().includes(q)) ||
        (office.amenities && office.amenities.some(a => a.toLowerCase().includes(q)));

      return matchesStatus && matchesFloor && matchesQuery;
    });
  }, [offices, searchQuery, statusFilter, floorFilter]);

  const handleEdit = (office: Office, e: React.MouseEvent) => {
    e.stopPropagation();
    setOfficeToEdit(office);
    setIsAddEditOpen(true);
  };

  const handleDelete = (office: Office, e: React.MouseEvent) => {
    e.stopPropagation();
    setOfficeToDelete(office);
  };

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-najdi-900 dark:text-cream-50 flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Building2 className="h-6 w-6" />
            </div>
            <span>{t('offices')}</span>
            <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-sand-200/70 dark:bg-najdi-800 text-najdi-800 dark:text-cream-200">
              {offices.length} {language === 'ar' ? 'وحدة' : 'Units'} ({stats.totalArea.toLocaleString()} m²)
            </span>
          </h2>
          <p className="text-xs text-sand-500 dark:text-sand-400 mt-1">
            {language === 'ar' ? 'سجل الوحدات والمكاتب ببرج العبداللطيف، حالة الإشغال والمساحات' : 'Floor-by-floor commercial unit directory, occupancy state, and space specifications for Alabdullatif Tower'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setOfficeToEdit(null);
              setIsAddEditOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sand-500 hover:bg-sand-600 text-najdi-900 text-xs font-bold transition-all shadow-sm shadow-sand-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>{t('add_office')}</span>
          </button>
        )}
      </div>

      {/* Occupancy Indicator Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-sand-100/70 dark:bg-najdi-900 border border-sand-300 dark:border-najdi-700 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-najdi-900 dark:text-sand-200 uppercase tracking-wider">{t('occupied_offices')}</p>
            <p className="text-2xl font-serif font-black text-najdi-900 dark:text-sand-100 mt-1">
              {stats.occupied} <span className="text-xs font-sans font-normal text-sand-600 dark:text-sand-400">({stats.occupiedArea} m²)</span>
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-sand-200 dark:bg-najdi-800 flex items-center justify-center text-najdi-800 dark:text-sand-300">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-sand-50/70 dark:bg-najdi-900 border border-sand-300 dark:border-najdi-700 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-najdi-800 dark:text-sand-300 uppercase tracking-wider">{t('vacant_offices')}</p>
            <p className="text-2xl font-serif font-black text-najdi-900 dark:text-cream-100 mt-1">
              {stats.vacant} <span className="text-xs font-sans font-normal text-sand-500 dark:text-sand-400">({stats.totalArea - stats.occupiedArea} m²)</span>
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-sand-200/80 dark:bg-najdi-800 flex items-center justify-center text-bronze-600 dark:text-bronze-400">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-brand-50/60 dark:bg-brand-950/20 border border-brand-200/80 dark:border-brand-900/50 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-brand-800 dark:text-brand-300 uppercase tracking-wider">{t('occupancy_rate')}</p>
            <p className="text-2xl font-serif font-black text-brand-700 dark:text-brand-300 mt-1">
              {stats.occupancyRate}%
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Layers className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-najdi-900 border border-cream-300 dark:border-najdi-800 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sand-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'البحث برقم الوحدة، الطابق، المساحة...' : 'Search office unit, floor, size, amenities...'}
            className="w-full ps-10 pe-4 py-2 rounded-xl text-xs bg-cream-50 dark:bg-najdi-950 border border-cream-300 dark:border-najdi-700 text-najdi-900 dark:text-cream-100 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <div className="inline-flex rounded-xl bg-cream-100 dark:bg-najdi-950 p-1 text-xs border border-cream-200 dark:border-najdi-800">
            {(['ALL', 'OCCUPIED', 'VACANT'] as const).map(status => (
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
                  : status === 'OCCUPIED'
                  ? (language === 'ar' ? 'مشغول' : 'Occupied')
                  : (language === 'ar' ? 'شاغر' : 'Vacant')}
              </button>
            ))}
          </div>

          {/* Floor Filter */}
          <select
            value={floorFilter}
            onChange={e => setFloorFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-cream-300 dark:border-najdi-700 text-xs bg-cream-50 dark:bg-najdi-950 font-semibold text-najdi-900 dark:text-cream-100"
          >
            <option value="ALL">{language === 'ar' ? 'جميع الطوابق' : 'All Floors'}</option>
            {distinctFloors.map(floor => (
              <option key={floor} value={String(floor)}>
                {language === 'ar' ? `طابق ${floor}` : `Floor ${floor}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Offices Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredOffices.length === 0 ? (
          <div className="col-span-full p-12 text-center text-sand-400 bg-white dark:bg-najdi-900 rounded-2xl border border-cream-300 dark:border-najdi-800">
            {language === 'ar' ? 'لا توجد وحدات تطابق معايير البحث' : 'No offices found matching search criteria.'}
          </div>
        ) : (
          filteredOffices.map(office => {
            const isVacant = office.status === 'VACANT';
            const tenant = office.currentTenantId
              ? tenants.find(t => t.id === office.currentTenantId)
              : null;
            const contract = office.currentContractId
              ? contracts.find(c => c.id === office.currentContractId)
              : null;

            return (
              <div
                key={office.id}
                className="relative rounded-2xl border border-cream-300 dark:border-najdi-800 bg-white dark:bg-najdi-900 p-5 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Office Number & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-serif font-bold text-najdi-900 dark:text-cream-50">
                        {office.officeNumber}
                      </h3>
                      <p className="text-xs text-sand-500 dark:text-sand-400">
                        {office.floorLabel || `Floor ${office.floor}`} • {office.sizeSqm} m²
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        isVacant
                          ? 'bg-sand-100 dark:bg-najdi-800 text-najdi-800 dark:text-sand-300 border-sand-300 dark:border-najdi-700'
                          : 'bg-sand-200/80 dark:bg-najdi-800 text-najdi-900 dark:text-sand-200 border-sand-400 dark:border-sand-600'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isVacant ? 'bg-sand-400' : 'bg-sand-600'
                        }`}
                      />
                      {isVacant ? (language === 'ar' ? 'شاغر' : 'Vacant') : (language === 'ar' ? 'مشغول' : 'Occupied')}
                    </span>
                  </div>

                  {/* Financial & Tenant Details */}
                  <div className="mt-4 p-3 rounded-xl bg-cream-50 dark:bg-najdi-950/70 border border-cream-200 dark:border-najdi-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-sand-600 dark:text-sand-400">{language === 'ar' ? 'الإيجار السنوي المستهدف:' : 'Target Annual Rent:'}</span>
                      <span className="font-bold text-najdi-900 dark:text-cream-50">
                        {formatSAR(office.annualRent, language)}
                      </span>
                    </div>

                    {tenant ? (
                      <div className="pt-2 border-t border-cream-200 dark:border-najdi-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sand-600 dark:text-sand-400">{language === 'ar' ? 'المستأجر الحالي:' : 'Current Tenant:'}</span>
                          <button
                            onClick={() => onNavigate('tenants', tenant.id)}
                            className="font-bold text-brand-600 dark:text-brand-400 hover:underline truncate max-w-[160px]"
                          >
                            {language === 'ar' && tenant.nameAr ? tenant.nameAr : tenant.name}
                          </button>
                        </div>
                        {contract && (
                          <div className="flex items-center justify-between text-[11px] text-sand-400">
                            <span>{language === 'ar' ? 'العقد:' : 'Contract:'}</span>
                            <button
                              onClick={() => onNavigate('contracts', contract.id)}
                              className="font-medium text-brand-600 dark:text-brand-400 hover:underline"
                            >
                              {contract.id} ({contract.durationMonths}m)
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-sand-200 dark:border-najdi-800 text-[11px] text-sand-600 dark:text-sand-400 font-medium">
                        {language === 'ar' ? 'الوحدة جاهزة للتأجير الفوري.' : 'Unit ready for immediate occupancy.'}
                      </div>
                    )}
                  </div>

                  {/* Amenities Tags */}
                  {office.amenities && office.amenities.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {office.amenities.map((amenity, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-sand-100 dark:bg-najdi-800 text-najdi-800 dark:text-cream-200"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-cream-200 dark:border-najdi-800 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {isAdmin && (
                      <>
                        <button
                          onClick={e => handleEdit(office, e)}
                          className="p-1.5 rounded-lg text-sand-400 hover:text-brand-600 hover:bg-cream-100 dark:hover:bg-najdi-800 transition-colors"
                          title="Edit Unit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={e => handleDelete(office, e)}
                          className="p-1.5 rounded-lg text-sand-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Delete Unit"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  {isVacant ? (
                    <button
                      onClick={() => onNavigate('contracts', `new?officeId=${office.id}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sand-500 hover:bg-sand-600 text-najdi-900 font-bold text-xs shadow-xs transition-colors"
                    >
                      <span>{language === 'ar' ? 'تأجير الوحدة' : 'Lease Unit'}</span>
                      <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                    </button>
                  ) : (
                    contract && (
                      <button
                        onClick={() => onNavigate('contracts', contract.id)}
                        className="text-xs font-semibold text-sand-700 dark:text-cream-200 hover:text-brand-600 flex items-center gap-1"
                      >
                        <span>{language === 'ar' ? 'تفاصيل العقد' : 'Contract Details'}</span>
                        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <OfficeModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        officeToEdit={officeToEdit}
      />

      <ConfirmDialog
        isOpen={!!officeToDelete}
        onClose={() => setOfficeToDelete(null)}
        onConfirm={() => {
          if (officeToDelete) deleteOffice(officeToDelete.id);
        }}
        title="Delete Office Unit"
        message={`Are you sure you want to delete ${officeToDelete?.officeNumber}? This will remove it from the building roster.`}
        type="danger"
      />
    </div>
  );
};
