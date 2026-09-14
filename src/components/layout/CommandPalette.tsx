import React, { useState, useEffect, useMemo } from 'react';
import { Search, Building2, Users, FileText, DollarSign, ArrowRight, X } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatSAR } from '../../utils/formatters';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string, id?: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const { tenants, offices, contracts, payments } = useData();
  const { language, t } = useLanguage();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or state
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase().trim();
    const results: Array<{
      type: 'tenant' | 'office' | 'contract' | 'payment';
      id: string;
      title: string;
      subtitle: string;
      extra?: string;
    }> = [];

    // Search Tenants
    tenants.forEach(ten => {
      if (
        ten.name.toLowerCase().includes(q) ||
        (ten.nameAr && ten.nameAr.toLowerCase().includes(q)) ||
        (ten.notes && ten.notes.toLowerCase().includes(q))
      ) {
        results.push({
          type: 'tenant',
          id: ten.id,
          title: language === 'ar' && ten.nameAr ? ten.nameAr : ten.name,
          subtitle: ten.notes || (ten.status === 'ACTIVE' ? 'Active Tenant' : 'Inactive'),
          extra: ten.status,
        });
      }
    });

    // Search Offices
    offices.forEach(off => {
      if (
        off.officeNumber.toLowerCase().includes(q) ||
        (off.floorLabel && off.floorLabel.toLowerCase().includes(q)) ||
        `floor ${off.floor}`.includes(q)
      ) {
        results.push({
          type: 'office',
          id: off.id,
          title: off.officeNumber,
          subtitle: `Floor ${off.floor} • ${off.sizeSqm} m² • ${off.status}`,
          extra: formatSAR(off.annualRent, language),
        });
      }
    });

    // Search Contracts
    contracts.forEach(ctr => {
      const ten = tenants.find(t => t.id === ctr.tenantId);
      const off = offices.find(o => o.id === ctr.officeId);
      if (
        ctr.id.toLowerCase().includes(q) ||
        (ten && ten.name.toLowerCase().includes(q)) ||
        (off && off.officeNumber.toLowerCase().includes(q))
      ) {
        results.push({
          type: 'contract',
          id: ctr.id,
          title: `${ctr.id} - ${off?.officeNumber || ''}`,
          subtitle: `Tenant: ${ten?.name || 'N/A'} • ${ctr.startDate} to ${ctr.endDate}`,
          extra: formatSAR(ctr.totalRent, language),
        });
      }
    });

    // Search Invoices/Payments
    payments.forEach(p => {
      const ten = tenants.find(t => t.id === p.tenantId);
      if (
        p.invoiceNumber.toLowerCase().includes(q) ||
        (p.transactions && p.transactions.some(tx => tx.referenceNumber?.toLowerCase().includes(q)))
      ) {
        results.push({
          type: 'payment',
          id: p.id,
          title: `${p.invoiceNumber} (${p.periodLabel})`,
          subtitle: `Tenant: ${ten?.name || 'N/A'} • Due: ${p.dueDate}`,
          extra: `${formatSAR(p.totalAmount, language)} [${p.status}]`,
        });
      }
    });

    return results.slice(0, 10);
  }, [query, tenants, offices, contracts, payments, language]);

  if (!isOpen) return null;

  const handleSelect = (item: { type: string; id: string }) => {
    if (item.type === 'tenant') onNavigate('tenants', item.id);
    else if (item.type === 'office') onNavigate('offices', item.id);
    else if (item.type === 'contract') onNavigate('contracts', item.id);
    else if (item.type === 'payment') onNavigate('payments', item.id);
    onClose();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'tenant':
        return <Users className="h-4 w-4 text-brand-600 dark:text-brand-400" />;
      case 'office':
        return <Building2 className="h-4 w-4 text-sand-600 dark:text-sand-400" />;
      case 'contract':
        return <FileText className="h-4 w-4 text-bronze-600 dark:text-bronze-400" />;
      case 'payment':
        return <DollarSign className="h-4 w-4 text-brand-600 dark:text-brand-400" />;
      default:
        return <Search className="h-4 w-4 text-sand-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-najdi-950/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-white dark:bg-najdi-900 rounded-2xl shadow-2xl border border-cream-300 dark:border-najdi-800 overflow-hidden animate-scaleUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-cream-300 dark:border-najdi-800 gap-3">
          <Search className="h-5 w-5 text-sand-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('search_placeholder')}
            autoFocus
            className="w-full bg-transparent text-najdi-900 dark:text-cream-50 placeholder:text-sand-400 focus:outline-none text-base"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-sand-400 hover:text-najdi-900 dark:hover:text-cream-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs text-sand-500 bg-cream-100 dark:bg-najdi-800 rounded border border-cream-300 dark:border-najdi-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-2">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-sand-400 text-sm">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-40 text-brand-600" />
              <p>{language === 'ar' ? 'اكتب للبحث في مستأجري برج العبداللطيف، الوحدات، العقود، والفواتير...' : 'Search across Alabdullatif Tower tenants, offices, contracts, and invoices...'}</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center text-sand-400 text-sm">
              {language === 'ar' ? `لا توجد نتائج مطابقة لـ "${query}"` : `No matching records found for "${query}".`}
            </div>
          ) : (
            <div className="space-y-1">
              {searchResults.map((item, idx) => (
                <div
                  key={`${item.type}-${item.id}-${idx}`}
                  onClick={() => handleSelect(item)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-cream-50/80 dark:hover:bg-najdi-850/70 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cream-100 dark:bg-najdi-800">
                      {getIcon(item.type)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-najdi-900 dark:text-cream-50 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                        {item.title}
                      </p>
                      <p className="text-xs text-sand-500 dark:text-sand-400">{item.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.extra && (
                      <span className="text-xs font-semibold text-sand-600 dark:text-sand-300">
                        {item.extra}
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 text-sand-400 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all rtl:rotate-180" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-cream-50 dark:bg-najdi-950/60 border-t border-cream-300 dark:border-najdi-800 text-[11px] text-sand-400 flex items-center justify-between">
          <span>{language === 'ar' ? 'بحث شامل مباشر' : 'Global Real-time Search'}</span>
          <span>{language === 'ar' ? 'اضغط ESC للإغلاق' : 'Press ESC to close'}</span>
        </div>
      </div>
    </div>
  );
};
