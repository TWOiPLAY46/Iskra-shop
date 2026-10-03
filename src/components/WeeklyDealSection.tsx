import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  Flame, 
  Clock, 
  ShoppingBag, 
  Check, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  Truck, 
  Sparkles,
  ArrowRight,
  Bell
} from 'lucide-react';
import { getSafeImageUrl, ASSET_IMAGES } from '../utils/assetImages';
import { formatPriceUnit } from '../utils/unitFormatter';

export const WeeklyDealSection: React.FC = () => {
  const { 
    weeklyDeal, 
    products, 
    addToCart, 
    setIsCartDrawerOpen, 
    setQuickViewProduct,
    openStockAlertModal 
  } = useStore();

  const [timeLeft, setTimeLeft] = useState({
    days: 3,
    hours: 14,
    minutes: 42,
    seconds: 18
  });

  const [isAddedRecently, setIsAddedRecently] = useState(false);

  // Live countdown timer calculation
  useEffect(() => {
    if (!weeklyDeal.enabled) return;

    const targetTime = weeklyDeal.endTimestamp || (Date.now() + 3 * 86400000 + 14 * 3600000);

    const updateTimer = () => {
      const difference = targetTime - Date.now();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [weeklyDeal.enabled, weeklyDeal.endTimestamp]);

  // If disabled in admin panel, do not render
  if (!weeklyDeal.enabled) {
    return null;
  }

  // Find promo product
  const promoProduct = products.find(p => p.id === weeklyDeal.productId) || products[0];
  if (!promoProduct) return null;

  const discountPercent = weeklyDeal.discountPercent || 25;
  const originalPrice = promoProduct.price;
  const promoPrice = weeklyDeal.customPrice 
    ? weeklyDeal.customPrice 
    : Math.round(originalPrice * (1 - discountPercent / 100));
  const savings = originalPrice - promoPrice;

  const handleBuy = () => {
    const discountedItem = {
      ...promoProduct,
      price: promoPrice,
      desc: `${promoProduct.desc} (Акційна ціна: -${discountPercent}%)`
    };
    addToCart(discountedItem);
    setIsAddedRecently(true);
    setIsCartDrawerOpen(true);
    setTimeout(() => setIsAddedRecently(false), 2200);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-slate-900 to-slate-950 text-white border border-red-500/30 shadow-2xl shadow-red-950/20 my-6">
      
      {/* Decorative ambient glowing accents */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-5 sm:p-8 lg:p-10">
        
        {/* Top Header Row with Badge & Live Countdown Timer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-linear-to-r from-red-600 to-orange-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/40 animate-pulse">
              <Flame className="w-4 h-4 fill-white" />
              <span>{weeklyDeal.badgeText || 'АКЦІЯ ТИЖНЯ'}</span>
            </span>

            <span className="hidden md:inline-flex items-center gap-1 text-xs font-medium text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Обмежена кількість за спецціною</span>
            </span>
          </div>

          {/* Live Countdown Timer */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-bold text-slate-300 mr-1">
              <Clock className="w-3.5 h-3.5 text-red-500 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-[11px] uppercase tracking-wide text-slate-400">До кінця акції:</span>
            </div>

            <div className="flex items-center gap-1.5 text-center">
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl px-2.5 py-1 min-w-[36px]">
                <div className="text-sm font-black text-white font-mono leading-tight">{String(timeLeft.days).padStart(2, '0')}</div>
                <div className="text-[8px] uppercase tracking-wider text-slate-400">дні</div>
              </div>
              <span className="text-slate-500 font-bold">:</span>
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl px-2.5 py-1 min-w-[36px]">
                <div className="text-sm font-black text-white font-mono leading-tight">{String(timeLeft.hours).padStart(2, '0')}</div>
                <div className="text-[8px] uppercase tracking-wider text-slate-400">год</div>
              </div>
              <span className="text-slate-500 font-bold">:</span>
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl px-2.5 py-1 min-w-[36px]">
                <div className="text-sm font-black text-white font-mono leading-tight">{String(timeLeft.minutes).padStart(2, '0')}</div>
                <div className="text-[8px] uppercase tracking-wider text-slate-400">хв</div>
              </div>
              <span className="text-slate-500 font-bold">:</span>
              <div className="bg-red-950/80 border border-red-500/40 rounded-xl px-2.5 py-1 min-w-[36px]">
                <div className="text-sm font-black text-red-400 font-mono leading-tight">{String(timeLeft.seconds).padStart(2, '0')}</div>
                <div className="text-[8px] uppercase tracking-wider text-red-300">сек</div>
              </div>
            </div>
          </div>

        </div>

        {/* Promo Product Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-6">
          
          {/* Left Column: Product Image with Floating Discount Tag */}
          <div className="lg:col-span-5 relative group flex items-center justify-center">
            
            <div className="relative w-full max-w-sm aspect-4/3 rounded-2xl bg-white/95 p-4 flex items-center justify-center shadow-2xl border border-white/10 overflow-hidden cursor-pointer"
                 onClick={() => setQuickViewProduct(promoProduct)}>
              {promoProduct.image && promoProduct.image.trim() !== '' ? (
                <img 
                  src={getSafeImageUrl(promoProduct.image)} 
                  alt={promoProduct.name}
                  onError={(e) => {
                    e.currentTarget.src = ASSET_IMAGES.faucetMixer;
                  }}
                  className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
                  <Flame className="w-12 h-12" />
                </div>
              )}

              {/* Floating Discount Tag */}
              <div className="absolute top-3 left-3 bg-red-600 text-white font-black text-sm px-3 py-1 rounded-xl shadow-lg shadow-red-600/40 flex items-center gap-1">
                <span>-{discountPercent}%</span>
              </div>

              {/* Stock in Green */}
              <div className="absolute bottom-3 right-3 bg-emerald-500/90 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>В наявності: {promoProduct.stock} шт</span>
              </div>
            </div>

          </div>

          {/* Right Column: Title, Subtitle, Highlights, Price & Pulsing Buy Button */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-mono text-red-400 font-bold bg-red-950/60 px-2 py-0.5 rounded border border-red-800/50">
                  АРТИКУЛ: {promoProduct.sku}
                </span>
                <span className="text-xs text-slate-400">
                  {promoProduct.category}
                </span>
              </div>

              <h3 
                onClick={() => setQuickViewProduct(promoProduct)}
                className="text-xl sm:text-2xl lg:text-3xl font-black font-display text-white tracking-tight leading-tight hover:text-red-400 transition-colors cursor-pointer"
              >
                {promoProduct.name}
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2.5">
                {weeklyDeal.subtitle || promoProduct.desc || 'Спеціальна ціна цього тижня на сертифікований якісний товар для монтажу та ремонту.'}
              </p>
            </div>

            {/* Quick Benefits Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 py-1">
              <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Офіційна гарантія</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-slate-200">
                <Truck className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Швидка відправка</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-slate-200 col-span-2 sm:col-span-1">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>100% оригінал</span>
              </div>
            </div>

            {/* Pricing & Pulsing Button Area */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              {/* Pricing Display */}
              <div>
                <div className="flex items-baseline gap-3">
                  <div className="text-3xl sm:text-4xl font-black font-display text-white tracking-tight tabular-nums">
                    {promoPrice}{' '}
                    <span className="text-lg sm:text-xl font-bold text-red-500">грн</span>
                  </div>

                  <div className="text-base sm:text-lg font-bold text-slate-500 line-through tabular-nums">
                    {originalPrice} грн
                  </div>
                </div>

                <div className="text-xs text-emerald-400 font-bold mt-1 flex items-center gap-1">
                  <span>Ви економите: {savings} грн</span>
                  <span className="text-[10px] text-slate-400">{formatPriceUnit(promoProduct.unit)}</span>
                </div>
              </div>

              {/* Buy Button or Notify Button */}
              <div className="relative inline-flex items-center">
                {promoProduct.stock <= 0 ? (
                  <button
                    type="button"
                    onClick={() => openStockAlertModal(promoProduct)}
                    className="relative px-6 sm:px-8 py-3 rounded-2xl font-black text-sm sm:text-base text-slate-950 bg-amber-500 hover:bg-amber-600 flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-md border border-amber-400 cursor-pointer"
                  >
                    <Bell className="w-5 h-5 stroke-[2.2] text-slate-950" />
                    <span>Повідомити про наявність</span>
                  </button>
                ) : (
                  <button
                    onClick={handleBuy}
                    className={`relative px-6 sm:px-8 py-3 rounded-2xl font-black text-sm sm:text-base text-white flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-md ${
                      isAddedRecently
                        ? 'bg-emerald-600 text-white shadow-emerald-600/40'
                        : 'bg-red-600 hover:bg-red-700 btn-pulse-red'
                    }`}
                    aria-label="Купити по акції"
                  >
                    {isAddedRecently ? (
                      <>
                        <Check className="w-5 h-5 stroke-[2.5]" />
                        <span>Додано в кошик!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-5 h-5 stroke-[2]" />
                        <span>Купити по акції</span>
                        <ArrowRight className="w-4 h-4 ml-0.5" />
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
};
