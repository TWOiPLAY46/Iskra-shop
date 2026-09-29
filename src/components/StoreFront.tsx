import React, { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Hero } from './Hero';
import { ProductCard } from './ProductCard';
import { WeeklyDealSection } from './WeeklyDealSection';
import { ProductFilters } from './ProductFilters';
import { getProductBrand } from '../utils/brandHelper';
import { 
  Flame, 
  ArrowUpDown, 
  Phone, 
  CheckCircle2, 
  ShoppingBag,
  Heart,
  X,
  SlidersHorizontal,
  RotateCcw,
  Banknote,
  Tag
} from 'lucide-react';

export const StoreFront: React.FC = () => {
  const { 
    products, 
    wishlist,
    showWishlistOnly,
    setShowWishlistOnly,
    activeCategory, 
    setActiveCategory, 
    searchQuery,
    setSearchQuery,
    sortOption, 
    setSortOption,
    siteSettings 
  } = useStore();

  // Price & Brand filter states
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Distinct Bestseller products ("Хіти продажу")
  const hitsProducts = useMemo(() => {
    return products.filter((p) => p.badge === 'Хіт продажу' || p.badge === 'Акція');
  }, [products]);

  // 1. Base category & search scope
  const scopeProducts = useMemo(() => {
    let list = [...products];

    // Filter by Wishlist if showWishlistOnly is active
    if (showWishlistOnly) {
      list = list.filter((p) => p?.id && wishlist.includes(p.id));
    } else {
      // Filter by Search Query from Header
      if (searchQuery && searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        list = list.filter((p) => 
          p.name.toLowerCase().includes(q) || 
          p.sku.toLowerCase().includes(q) || 
          p.category.toLowerCase().includes(q) ||
          (p.mainCategory && p.mainCategory.toLowerCase().includes(q)) ||
          (p.subCategory && p.subCategory.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q))
        );
      }

      // Filter by Category from Header Catalog
      if (activeCategory && activeCategory !== 'Усі') {
        const cat = activeCategory.toLowerCase();
        list = list.filter((p) => 
          (p.mainCategory && p.mainCategory.toLowerCase().includes(cat)) ||
          p.category.toLowerCase().includes(cat) ||
          (p.subCategory && p.subCategory.toLowerCase().includes(cat)) ||
          p.name.toLowerCase().includes(cat)
        );
      }
    }

    return list;
  }, [products, showWishlistOnly, wishlist, searchQuery, activeCategory]);

  // 2. Available brands with item counts for current scope
  const availableBrandsWithCounts = useMemo(() => {
    const map = new Map<string, number>();
    scopeProducts.forEach((p) => {
      const b = getProductBrand(p);
      map.set(b, (map.get(b) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'uk'));
  }, [scopeProducts]);

  // 3. Dynamic Price min & max limits
  const { catalogMinPrice, catalogMaxPrice } = useMemo(() => {
    if (scopeProducts.length === 0) return { catalogMinPrice: 0, catalogMaxPrice: 0 };
    let min = Infinity;
    let max = -Infinity;
    scopeProducts.forEach((p) => {
      if (p.price < min) min = p.price;
      if (p.price > max) max = p.price;
    });
    return { 
      catalogMinPrice: min === Infinity ? 0 : min, 
      catalogMaxPrice: max === -Infinity ? 0 : max 
    };
  }, [scopeProducts]);

  // 4. Final filtered & sorted products by Price and Brand
  const displayProducts = useMemo(() => {
    let list = scopeProducts.filter((p) => {
      // Filter by min price
      if (minPrice !== '' && p.price < minPrice) return false;
      // Filter by max price
      if (maxPrice !== '' && p.price > maxPrice) return false;
      // Filter by selected brands
      if (selectedBrands.length > 0) {
        const b = getProductBrand(p);
        if (!selectedBrands.includes(b)) return false;
      }
      return true;
    });

    // Sort
    list.sort((a, b) => {
      if (sortOption === 'price-asc') return a.price - b.price;
      if (sortOption === 'price-desc') return b.price - a.price;
      if (sortOption === 'name-asc') return a.name.localeCompare(b.name, 'uk');
      return 0;
    });

    return list;
  }, [scopeProducts, minPrice, maxPrice, selectedBrands, sortOption]);

  const hasPriceFilter = minPrice !== '' || maxPrice !== '';
  const hasBrandFilter = selectedBrands.length > 0;
  const hasCustomFilter = hasPriceFilter || hasBrandFilter;
  const hasCategoryOrSearchFilter = (activeCategory && activeCategory !== 'Усі') || (searchQuery && searchQuery.trim() !== '');

  const activeFiltersCount = (hasPriceFilter ? 1 : 0) + selectedBrands.length;

  const handlePriceChange = (min: number | '', max: number | '') => {
    setMinPrice(min);
    setMaxPrice(max);
  };

  const handleToggleBrand = (brand: string) => {
    setSelectedBrands((prev) => 
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const handleClearBrands = () => {
    setSelectedBrands([]);
  };

  const handleResetCustomFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedBrands([]);
  };

  const handleResetAllFilters = () => {
    handleResetCustomFilters();
    setActiveCategory('Усі');
    setSearchQuery('');
  };

  return (
    <div>
      {/* Hero Banner (hidden when viewing favorites) */}
      {!showWishlistOnly && <Hero />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        
        {/* Wishlist Header Banner when viewing favorites */}
        {showWishlistOnly && (
          <div className="bg-red-50/90 border border-red-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/30 shrink-0">
                <Heart className="w-6 h-6 fill-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black font-display text-slate-900 leading-tight">
                  Обрані товари
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  {displayProducts.length === 1 
                    ? 'У вашому списку обраного 1 товар' 
                    : `У вашому списку обраного ${displayProducts.length} товарів`}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowWishlistOnly(false)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs self-start sm:self-auto cursor-pointer"
            >
              ← Повернутися до всіх товарів
            </button>
          </div>
        )}

        {/* Deal of the Week (Акція тижня) */}
        {!hasCategoryOrSearchFilter && !hasCustomFilter && !showWishlistOnly && <WeeklyDealSection />}

        {/* Dedicated "Хіти продажу" Section (hidden when viewing favorites or filtered) */}
        {!showWishlistOnly && !hasCustomFilter && (
          <section id="hits-section" className="scroll-mt-24 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                    <Flame className="w-5 h-5 fill-red-600" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black font-display text-slate-950 tracking-tight">
                    Хіти продажу
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Найбільш популярні та перевірені майстрами позиції за вигідною ціною
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Все в наявності на складі</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
              {hitsProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Main Catalog Section with Filters */}
        <section id="catalog-products-section" className="space-y-6 pt-4 scroll-mt-20">
          
          {/* Top Bar with Title, Filter Drawer Button on mobile, and Sorting */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            
            {/* Title & Counter */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-900 text-white">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-black font-display text-slate-900 leading-tight">
                  {showWishlistOnly 
                    ? 'Обрані товари' 
                    : (activeCategory && activeCategory !== 'Усі' ? activeCategory : 'Каталог сантехніки та товарів')}
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {displayProducts.length} позицій знайдено
                </span>
              </div>
            </div>

            {/* Actions: Mobile Filter Button & Sort Dropdown */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
              {/* Mobile filter button (< lg) */}
              {!showWishlistOnly && (
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors shadow-xs active:scale-95 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-red-600" />
                  <span>Фільтри</span>
                  {activeFiltersCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              )}

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 hidden md:inline-flex items-center gap-1 font-medium">
                  <ArrowUpDown className="w-3.5 h-3.5" /> Сортування:
                </span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 outline-none focus:border-red-600 transition-colors shadow-xs cursor-pointer"
                >
                  <option value="default">За замовчуванням</option>
                  <option value="price-asc">Від дешевших до дорогих</option>
                  <option value="price-desc">Від дорогих до дешевших</option>
                  <option value="name-asc">За назвою (А - Я)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Search Notification Banner */}
          {searchQuery && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-center justify-between text-xs text-red-900 font-medium">
              <div>
                Результати пошуку за запитом: <b className="text-red-700 font-bold">«{searchQuery}»</b> ({displayProducts.length} знайдено)
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="text-red-600 hover:text-red-800 font-bold text-xs underline cursor-pointer"
              >
                Очистити
              </button>
            </div>
          )}

          {/* Active Filter Chips / Tags Bar */}
          {hasCustomFilter && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-100/80 rounded-2xl border border-slate-200 text-xs">
              <span className="text-slate-500 font-semibold mr-1">
                Активні фільтри:
              </span>

              {/* Price filter chip */}
              {hasPriceFilter && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 rounded-xl text-slate-800 font-bold shadow-2xs">
                  <Banknote className="w-3 h-3 text-red-600" />
                  <span>
                    Ціна: {minPrice !== '' ? `${minPrice} грн` : 'від 0'} — {maxPrice !== '' ? `${maxPrice} грн` : 'до макс.'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePriceChange('', '')}
                    className="p-0.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
                    title="Видалити фільтр ціни"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Selected Brand chips */}
              {selectedBrands.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 rounded-xl text-slate-800 font-bold shadow-2xs"
                >
                  <Tag className="w-3 h-3 text-red-600" />
                  <span>{b}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleBrand(b)}
                    className="p-0.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
                    title={`Видалити бренд ${b}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {/* Reset all button */}
              <button
                type="button"
                onClick={handleResetCustomFilters}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 font-bold text-xs transition-colors ml-auto cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Скинути фільтри</span>
              </button>
            </div>
          )}

          {/* Main 2-Column Section: Sidebar on Desktop + Products Grid */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Desktop & Mobile Filters Component */}
            {!showWishlistOnly && (
              <ProductFilters
                minLimit={catalogMinPrice}
                maxLimit={catalogMaxPrice}
                currentMinPrice={minPrice}
                currentMaxPrice={maxPrice}
                onPriceChange={handlePriceChange}
                availableBrands={availableBrandsWithCounts}
                selectedBrands={selectedBrands}
                onToggleBrand={handleToggleBrand}
                onClearBrands={handleClearBrands}
                onResetAll={handleResetCustomFilters}
                hasActiveFilters={hasCustomFilter}
                totalFilteredCount={displayProducts.length}
                isMobileDrawerOpen={isMobileFilterOpen}
                setIsMobileDrawerOpen={setIsMobileFilterOpen}
              />
            )}

            {/* Products Grid Column */}
            <div className="flex-1 w-full min-w-0">
              {displayProducts.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center max-w-lg mx-auto space-y-4">
                  {showWishlistOnly ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 mx-auto flex items-center justify-center">
                        <Heart className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900 font-display">
                        У списку обраного поки немає товарів
                      </h3>
                      <p className="text-xs text-slate-500">
                        Натисніть на сердечко в картці будь-якого товару в каталозі, щоб додати його до обраного.
                      </p>
                      <button
                        onClick={() => setShowWishlistOnly(false)}
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                      >
                        Перейти до каталогу
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                        <SlidersHorizontal className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900 font-display">
                        За вибраними фільтрами товарів не знайдено
                      </h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Спробуйте розширити діапазон цін або обрати інших виробників сантехніки та електрики.
                      </p>
                      <button
                        onClick={handleResetAllFilters}
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                      >
                        Скинути всі фільтри
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3.5 sm:gap-5">
                  {displayProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>

          </div>

        </section>

      </main>
    </div>
  );
};
