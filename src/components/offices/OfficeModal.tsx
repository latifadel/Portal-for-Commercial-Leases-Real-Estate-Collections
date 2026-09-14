import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Office } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';

interface OfficeModalProps {
  isOpen: boolean;
  onClose: () => void;
  officeToEdit?: Office | null;
}

export const OfficeModal: React.FC<OfficeModalProps> = ({ isOpen, onClose, officeToEdit }) => {
  const { t } = useLanguage();
  const { addOffice, updateOffice } = useData();

  const [formData, setFormData] = useState({
    officeNumber: '',
    floor: 1,
    floorLabel: '',
    sizeSqm: 100,
    status: 'VACANT' as Office['status'],
    annualRent: 100000,
    amenities: '' as string,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (officeToEdit) {
      setFormData({
        officeNumber: officeToEdit.officeNumber,
        floor: officeToEdit.floor,
        floorLabel: officeToEdit.floorLabel || '',
        sizeSqm: officeToEdit.sizeSqm,
        status: officeToEdit.status,
        annualRent: officeToEdit.annualRent,
        amenities: officeToEdit.amenities?.join(', ') || '',
        notes: officeToEdit.notes || '',
      });
    } else {
      setFormData({
        officeNumber: '',
        floor: 1,
        floorLabel: '',
        sizeSqm: 120,
        status: 'VACANT',
        annualRent: 110000,
        amenities: 'Central AC, High Speed Fibre, Parking',
        notes: '',
      });
    }
    setErrors({});
  }, [officeToEdit, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.officeNumber.trim()) errs.officeNumber = 'Office number is required (e.g. Office 301)';
    if (formData.sizeSqm <= 0) errs.sizeSqm = 'Size must be greater than 0';
    if (formData.annualRent <= 0) errs.annualRent = 'Annual rent must be greater than 0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const amenitiesArray = formData.amenities
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (officeToEdit) {
      updateOffice(officeToEdit.id, {
        ...formData,
        amenities: amenitiesArray,
      });
    } else {
      addOffice({
        ...formData,
        amenities: amenitiesArray,
      });
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={officeToEdit ? `${t('edit')} ${t('office_unit')}` : t('add_office')}
      subtitle="Configure office unit dimensions, floor, and target rental value"
      maxWidth="2xl"
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-semibold text-najdi-900 bg-sand-500 hover:bg-sand-600 rounded-xl transition-colors shadow-sm"
          >
            {t('save')}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('office_unit')} (e.g. Office 201) *
            </label>
            <input
              type="text"
              value={formData.officeNumber}
              onChange={e => setFormData({ ...formData, officeNumber: e.target.value })}
              placeholder="e.g. Office 201"
              className={`w-full px-3.5 py-2 rounded-xl border text-sm bg-white dark:bg-slate-800 ${
                errors.officeNumber ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.officeNumber && <p className="text-[11px] text-rose-500 mt-0.5">{errors.officeNumber}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Floor Number *
            </label>
            <input
              type="number"
              min={0}
              max={50}
              value={formData.floor}
              onChange={e => setFormData({ ...formData, floor: Number(e.target.value) })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('office_size')} *
            </label>
            <input
              type="number"
              min={1}
              value={formData.sizeSqm}
              onChange={e => setFormData({ ...formData, sizeSqm: Number(e.target.value) })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('annual_rent')} (SAR Base) *
            </label>
            <input
              type="number"
              min={1}
              step={1000}
              value={formData.annualRent}
              onChange={e => setFormData({ ...formData, annualRent: Number(e.target.value) })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('status')}
            </label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as Office['status'] })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 font-semibold"
            >
              <option value="VACANT">Vacant (شاغر)</option>
              <option value="OCCUPIED">Occupied (مشغول)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Floor Label / Wing (Optional)
          </label>
          <input
            type="text"
            value={formData.floorLabel}
            onChange={e => setFormData({ ...formData, floorLabel: e.target.value })}
            placeholder="e.g. 2nd Floor - East Wing"
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Amenities & Features (Comma-separated)
          </label>
          <input
            type="text"
            value={formData.amenities}
            onChange={e => setFormData({ ...formData, amenities: e.target.value })}
            placeholder="e.g. Corner View, Private Pantry, 2 Parkings"
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {t('notes')}
          </label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Fit-out status, maintenance notes, keys location..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800"
          />
        </div>
      </form>
    </Modal>
  );
};
