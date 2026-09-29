import React, { useState, useMemo } from 'react';
import { 
  SlidersHorizontal, 
  X, 
  RotateCcw, 
  Check, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Tag,
  Banknote
} from 'lucide-react';

export interface BrandCount {
  name: string;
  count: number;
}

interface ProductFiltersProps {
  minLimit: number;
  maxLimit: number;
  currentMinPrice: number | '';
  currentMaxPrice: number | '';
  onPriceChange: (min: number | '', max: number | '') => void;
  availableBrands: BrandCount[];
  selectedBrands: string[];
  onToggleBrand: (brand: string) => void;
  onClearBrands: () => void;
  onResetAll: () => void;
  hasActiveFilters: boolean;
  totalFilteredCount: number;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  minLimit,
  maxLimit,
  currentMinPrice,
  currentMaxPrice,
  onPriceChange,
  availableBrands,
  selectedBrands,
  onToggleBrand,
  onClearBrands,
  onResetAll,
  hasActiveFilters,
  totalFilteredCount,
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
}) => {
  const [brandSearch, setBrandSearch] = useState('');
  const [isPriceSectionOpen, setIsPriceSectionOpen] = useState(true);
  const [isBrandSectionOpen, setIsBrandSectionOpen] = useState(true);
  const [showAllBrands, setShowAllBrands] = useState(false);

  // Local inputs state for responsive typing without jumpiness
  const [localMin, setLocalMin] = useState<string>(currentMinPrice === '' ? '' : String(currentMinPrice));
  const [localMax, setLocalMax] = useState<string>(currentMaxPrice === '' ? '' : String(currentMaxPrice));

  // Sync with props if updated externally
  React.useEffect(() => {
    setLocalMin(currentMinPrice === '' ? '' : String(currentMinPrice));
  }, [currentMinPrice]);

  React.useEffect(() => {
    setLocalMax(currentMaxPrice === '' ? '' : String(currentMaxPrice));
  }, [currentMaxPrice]);

  const handleApplyPrice = () => {
    const minVal = localMin.trim() === '' ? '' : Math.max(0, Number(localMin) || 0);
    const maxVal = localMax.trim() === '' ? '' : Math.max(0, Number(localMax) || 0);
    onPriceChange(minVal, maxVal);
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleApplyPrice();
    }
  };

  // Filter brands by search text
  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return availableBrands;
    const q = brandSearch.toLowerCase().trim();
    return availableBrands.filter((b) => b.name.toLowerCase().includes(q));
  }, [availableBrands, brandSearch]);

  const displayedBrands = showAllBrands ? filteredBrands : filteredBrands.slice(0, 8);

  // Quick price presets
  const presets: { label: string; min: number | ''; max: number | '' }[] = [
    { label: 'До 300 грн', min: '', max: 300 },
    { label: '300 - 1000 грн', min: 300, max: 1000 },
    { label: '1000 - 3000 грн', min: 1000, max: 3000 },
    { label: 'Від 3000 грн', min: 3000, max: '' },
  ];

  const filterContent = (
    <div className="space-y-6">
      
      {/* 1. Price Filter Section */}
      <div className="border-b border-slate-200/80 pb-5">
        <button
          type="button"
          onClick={() => setIsPriceSectionOpen(!isPriceSectionOpen)}
          className="w-full flex items-center justify-between text-left group cursor-pointer mb-3"
        >
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-red-600" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 font-display">
              Ціна (грн)
            </span>
          </div>
          <span className="p-1 rounded-lg text-slate-400 group-hover:text-slate-600 group-hover:bg-slate-100 transition-colors">
            {isPriceSectionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {isPriceSectionOpen && (
          <div className="space-y-3 animate-in fade-in duration-150">
            {/* From - To inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                  Від
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    placeholder={minLimit > 0 ? String(minLimit) : '0'}
                    value={localMin}
                    onChange={(e) => setLocalMin(e.target.value)}
                    onKeyDown={handlePriceKeyDown}
                    className="w-full pl-2.5 pr-6 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/20 tabular-nums transition-all"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold pointer-events-none">
                    ₴
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                  До
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    placeholder={maxLimit > 0 ? String(maxLimit) : '9999'}
                    value={localMax}
                    onChange={(e) => setLocalMax(e.target.value)}
                    onKeyDown={handlePriceKeyDown}
                    className="w-full pl-2.5 pr-6 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/20 tabular-nums transition-all"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold pointer-events-none">
                    ₴
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplyPrice}
              className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            >
              Застосувати ціну
            </button>

            {/* Quick Price Range Presets */}
            <div className="pt-1 flex flex-wrap gap-1.5">
              {presets.map((preset) => {
                const isActive = 
                  (preset.min === '' ? currentMinPrice === '' : currentMinPrice === preset.min) &&
                  (preset.max === '' ? currentMaxPrice === '' : currentMaxPrice === preset.max);

                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      if (isActive) {
                        onPriceChange('', '');
                      } else {
                        onPriceChange(preset.min, preset.max);
                      }
                    }}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-red-600 text-white font-bold shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Manufacturer / Brand Filter Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setIsBrandSectionOpen(!isBrandSectionOpen)}
            className="flex items-center gap-2 text-left group cursor-pointer"
          >
            <Tag className="w-4 h-4 text-red-600" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 font-display">
              Виробник / Бренд
            </span>
            <span className="p-0.5 rounded text-slate-400 group-hover:text-slate-600">
              {isBrandSectionOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

          {selectedBrands.length > 0 && (
            <button
              type="button"
              onClick={onClearBrands}
              className="text-[11px] font-bold text-red-600 hover:text-red-700 transition-colors"
            >
              Скинути ({selectedBrands.length})
            </button>
          )}
        </div>

        {isBrandSectionOpen && (
          <div className="space-y-2.5 animate-in fade-in duration-150">
            {/* Brand Search input if more than 5 brands */}
            {availableBrands.length > 5 && (
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Пошук виробника..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-red-600 transition-all"
                />
                {brandSearch && (
                  <button
                    type="button"
                    onClick={() => setBrandSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Brand checkboxes list */}
            {filteredBrands.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Виробника не знайдено
              </p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {displayedBrands.map((b) => {
                  const isChecked = selectedBrands.includes(b.name);

                  return (
                    <label
                      key={b.name}
                      className={`flex items-center justify-between p-1.5 rounded-xl text-xs transition-colors cursor-pointer select-none ${
                        isChecked 
                          ? 'bg-red-50 text-red-900 font-bold' 
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                            isChecked
                              ? 'bg-red-600 border-red-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="truncate">
                          {b.name}
                        </span>
                      </div>

                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full shrink-0 ${
                        isChecked 
                          ? 'bg-red-200/70 text-red-800 font-bold' 
                          : 'bg-slate-200/70 text-slate-500'
                      }`}>
                        {b.count}
                      </span>

                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleBrand(b.name)}
                        className="sr-only"
                      />
                    </label>
                  );
                })}
              </div>
            )}

            {/* Show more/less brands toggle */}
            {filteredBrands.length > 8 && (
              <button
                type="button"
                onClick={() => setShowAllBrands(!showAllBrands)}
                className="text-xs font-bold text-red-600 hover:text-red-700 pt-1 block cursor-pointer"
              >
                {showAllBrands ? 'Показати менше' : `Показати всі (${filteredBrands.length})`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Global Reset Button */}
      {hasActiveFilters && (
        <div className="pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onResetAll}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-300 hover:border-red-400 bg-white hover:bg-red-50 text-xs font-bold text-slate-700 hover:text-red-600 transition-colors shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Скинути всі фільтри</span>
          </button>
        </div>
      )}

    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (visible on lg screens) */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs sticky top-24 self-start">
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-black font-display text-slate-900 uppercase tracking-wider">
              Фільтри товарів
            </h3>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetAll}
              className="text-[11px] font-bold text-red-600 hover:text-red-700 cursor-pointer"
              title="Скинути всі фільтри"
            >
              Скинути
            </button>
          )}
        </div>

        {filterContent}
      </aside>

      {/* Mobile Drawer (Bottom sheet modal on < lg screens) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-red-600" />
                <h3 className="text-sm font-black font-display text-slate-900">
                  Фільтри сантехніки та товарів
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable filters body */}
            <div className="flex-1 overflow-y-auto p-5">
              {filterContent}
            </div>

            {/* Sticky bottom action buttons */}
            <div className="p-4 border-t border-slate-200 bg-white grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onResetAll}
                disabled={!hasActiveFilters}
                className="py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-center transition-colors"
              >
                Очистити
              </button>

              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold text-center shadow-xs transition-colors"
              >
                Показати ({totalFilteredCount})
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
