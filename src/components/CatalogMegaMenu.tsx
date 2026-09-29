import React from 'react';
import { useStore } from '../context/StoreContext';
import { 
  X, 
  ChevronRight, 
  Droplets, 
  Zap, 
  Flame, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface CatalogMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CatalogMegaMenu: React.FC<CatalogMegaMenuProps> = ({ isOpen, onClose }) => {
  const { 
    categoriesTree, 
    activeCategory, 
    setActiveCategory, 
    setActiveView,
    setSearchQuery
  } = useStore();

  if (!isOpen) return null;

  const handleSelectCategory = (catName: string) => {
    setActiveCategory(catName);
    setSearchQuery('');
    setActiveView('store');
    onClose();
    setTimeout(() => {
      const el = document.getElementById('catalog-products-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleShowAll = () => {
    setActiveCategory('Усі');
    setSearchQuery('');
    setActiveView('store');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-x-0 top-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-50">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col animate-in slide-in-from-top-3 duration-200">
          
          {/* Header Bar of Catalog */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="bg-red-600 text-white font-black px-2.5 py-0.5 rounded-lg text-sm font-display">
                КАТАЛОГ
              </span>
              <h2 className="text-base sm:text-lg font-bold font-display">
                Категорії сантехніки та електротоварів
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleShowAll}
                className="text-xs text-slate-300 hover:text-white underline font-semibold transition-colors hidden sm:block"
              >
                Показати всі товари
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Закрити каталог"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body: Hierarchical Categories Grid */}
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {Object.keys(categoriesTree).length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-sm font-semibold">Категорії ще не додані</p>
                <p className="text-xs text-slate-400 mt-1">Створіть категорії в панелі керування ISKRA</p>
              </div>
            ) : (
              <div className={`grid grid-cols-1 ${Object.keys(categoriesTree).length > 1 ? 'md:grid-cols-2 lg:grid-cols-2' : ''} gap-8 divide-y md:divide-y-0 ${Object.keys(categoriesTree).length > 1 ? 'md:divide-x' : ''} divide-slate-100`}>
                {Object.entries(categoriesTree).map(([mainCatName, mainObj], idx) => {
                  const directLeaves = Array.isArray(mainObj?._leaves) ? mainObj._leaves : [];
                  const subCategories = Object.entries(mainObj || {}).filter(([k]) => k !== '_leaves');

                  const getIcon = (name: string) => {
                    const lower = name.toLowerCase();
                    if (lower.includes('сант') || lower.includes('вод') || lower.includes('труб')) {
                      return <Droplets className="w-5 h-5 text-blue-600" />;
                    }
                    if (lower.includes('електр') || lower.includes('кабел') || lower.includes('освіт')) {
                      return <Zap className="w-5 h-5 text-amber-500" />;
                    }
                    if (lower.includes('опал') || lower.includes('котел') || lower.includes('радіат')) {
                      return <Flame className="w-5 h-5 text-rose-500" />;
                    }
                    return <Sparkles className="w-5 h-5 text-red-500" />;
                  };

                  return (
                    <div key={mainCatName} className={`space-y-5 ${idx > 0 ? 'md:pl-8 pt-6 md:pt-0' : ''}`}>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleSelectCategory(mainCatName)}
                          className="flex items-center gap-2.5 text-base sm:text-lg font-black text-slate-900 hover:text-red-600 transition-colors group text-left"
                        >
                          <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-red-50 group-hover:scale-105 transition-all">
                            {getIcon(mainCatName)}
                          </div>
                          <span>{mainCatName}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>

                      {/* Direct Leaves (if any) */}
                      {directLeaves.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pl-2">
                          {directLeaves.map((leaf) => (
                            <button
                              key={leaf}
                              onClick={() => handleSelectCategory(leaf)}
                              className="text-[11px] font-medium bg-amber-50/80 hover:bg-red-50 text-amber-900 hover:text-red-600 px-2.5 py-1 rounded-lg border border-amber-200/70 transition-colors"
                            >
                              {leaf}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Subcategories */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-2">
                        {subCategories.map(([subCatName, leaves]) => {
                          const items = Array.isArray(leaves) ? leaves : [];

                          return (
                            <div key={subCatName} className="space-y-1.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                              <button
                                onClick={() => handleSelectCategory(subCatName)}
                                className="font-bold text-xs text-slate-900 hover:text-red-600 text-left w-full flex items-center justify-between"
                              >
                                <span>{subCatName}</span>
                                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                              </button>
                              {items.length > 0 && (
                                <ul className="space-y-1 pt-1">
                                  {items.map((leaf) => (
                                    <li key={leaf}>
                                      <button
                                        onClick={() => handleSelectCategory(leaf)}
                                        className="text-[11px] text-slate-500 hover:text-red-600 transition-colors text-left flex items-center gap-1.5 py-0.5"
                                      >
                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                        <span>{leaf}</span>
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Швидка доставка по Україні або самовивіз у с. Оратів</span>
            </div>

            <button
              onClick={handleShowAll}
              className="inline-flex items-center gap-1.5 font-bold text-red-600 hover:text-red-700"
            >
              <span>Переглянути весь асортимент</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
