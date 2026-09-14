import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Tenant } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantToEdit?: Tenant | null;
  onSaved?: (id: string) => void;
}

export const TenantModal: React.FC<TenantModalProps> = ({
  isOpen,
  onClose,
  tenantToEdit,
  onSaved,
}) => {
  const { language, t } = useLanguage();
  const { addTenant, updateTenant } = useData();

  const [name, setName] = useState('');
  const [status, setStatus] = useState<Tenant['status']>('ACTIVE');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (tenantToEdit) {
      setName(tenantToEdit.name || '');
      setStatus(tenantToEdit.status || 'ACTIVE');
      setNotes(tenantToEdit.notes || '');
    } else {
      setName('');
      setStatus('ACTIVE');
      setNotes('');
    }
    setError('');
  }, [tenantToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(language === 'ar' ? 'يرجى إدخال اسم المستأجر' : 'Tenant name is required');
      return;
    }

    if (tenantToEdit) {
      updateTenant(tenantToEdit.id, { name: name.trim(), status, notes: notes.trim() });
      onSaved?.(tenantToEdit.id);
    } else {
      const newId = addTenant({
        name: name.trim(),
        status,
        notes: notes.trim(),
      });
      onSaved?.(newId);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tenantToEdit ? (language === 'ar' ? 'تعديل المستأجر' : 'Edit Tenant') : (language === 'ar' ? 'إضافة مستأجر جديد' : 'Add New Tenant')}
      subtitle={language === 'ar' ? 'أدخل اسم المستأجر والحالة' : 'Enter tenant name and status'}
      maxWidth="md"
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
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {language === 'ar' ? 'اسم المستأجر / الشركة' : 'Tenant / Company Name'} *
          </label>
          <input
            type="text"
            value={name}
            onChange={e => {
              setName(e.target.value);
              if (error) setError('');
            }}
            placeholder={language === 'ar' ? 'مثال: شركة الأمل' : 'e.g. Al-Amal Trading Corp'}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-800 ${
              error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
            }`}
            autoFocus
          />
          {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {language === 'ar' ? 'الحالة' : 'Status'}
          </label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as Tenant['status'])}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 font-medium"
          >
            <option value="ACTIVE">{language === 'ar' ? 'نشط' : 'Active'}</option>
            <option value="INACTIVE">{language === 'ar' ? 'غير نشط' : 'Inactive'}</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {language === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={language === 'ar' ? 'أي ملاحظات إضافية...' : 'Any additional notes...'}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800"
          />
        </div>
      </form>
    </Modal>
  );
};
