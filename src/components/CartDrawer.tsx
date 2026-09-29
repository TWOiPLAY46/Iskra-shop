import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ShoppingCart, 
  ArrowRight, 
  Droplets, 
  Zap, 
  Check 
} from 'lucide-react';
import { Product } from '../types/store';
import { getSafeImageUrl } from '../utils/assetImages';

export const CartDrawer: React.FC = () => {
  const { 
    cart, 
    isCartDrawerOpen, 
    setIsCartDrawerOpen, 
    removeFromCart, 
    updateCartQty, 
    totalCartSum, 
    discountedCartSum, 
    currentClient, 
    setIsCheckoutModalOpen,
    setActiveView,
    products,
    addToCart,
    showToast
  } = useStore();

  const [addedItemIds, setAddedItemIds] = useState<string[]>([]);

  const discountAmount = totalCartSum - discountedCartSum;

  // Determine if cart contains plumbing or electrical goods
  const cartHasPlumbing = useMemo(() => {
    return cart.some((item) => {
      const cat = (item.category + ' ' + (item.mainCategory || '')).toLowerCase();
      return cat.includes('сантех') || cat.includes('змішувач') || cat.includes('радіатор') || cat.includes('труб');
    });
  }, [cart]);

  // Items not already in cart for "З цим часто купують"
  const frequentlyBoughtTogether = useMemo(() => {
    const candidateItems = products.filter((p) => !cart.some((c) => c.id === p.id));
    
    // Sort so high-utility accessories come first based on cart content
    const priorityItems = candidateItems.filter((p) => {
      if (cartHasPlumbing) {
        return (
          p.id === 'prod-fum-12' ||
          p.id === 'prod-hose-50' ||
          p.id === 'prod-fit-20' ||
          p.category?.toLowerCase().includes('комплект')
        );
      } else {
        return (
          p.id === 'prod-izo-tape' ||
          p.id === 'prod-wago-221' ||
          p.id === 'prod-avt-16' ||
          p.category?.toLowerCase().includes('монтаж')
        );
      }
    });

    const rest = candidateItems.filter((p) => !priorityItems.some((pr) => pr.id === p.id));
    return [...priorityItems, ...rest].slice(0, 4);
  }, [cart, products, cartHasPlumbing]);

  if (!isCartDrawerOpen) return null;

  const handleCheckoutClick = () => {
    setIsCartDrawerOpen(false);
    setIsCheckoutModalOpen(true);
  };

  const handleAddRelated = (prod: Product) => {
    addToCart(prod, 1);
    setAddedItemIds((prev) => [...prev, prod.id]);
    showToast(`«${prod.name}» додано до вашого замовлення!`, 'success');
    setTimeout(() => {
      setAddedItemIds((prev) => prev.filter((id) => id !== prod.id));
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200">
          
          {/* Header */}
          <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                Ваше замовлення
              </h2>
            </div>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Закрити кошик"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100 space-y-1">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 my-auto">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Кошик порожній</h3>
                <p className="text-xs text-slate-500 mb-5 max-w-xs leading-relaxed">
                  Оберіть необхідні товари для сантехніки або електромонтажу та додайте їх до замовлення.
                </p>
                <button
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    setActiveView('store');
                  }}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-red-600/20"
                >
                  Перейти до покупок
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const itemTotal = item.price * item.qty;

                return (
                  <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    
                    {/* Item Information */}
                    <div className="flex-1 min-w-0 pr-1">
                      <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1 mb-0.5">
                        {item.name}
                      </h4>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {item.sku} · {item.price} {item.unit}
                      </div>
                    </div>

                    {/* Stepper + Price + Trash */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      
                      {/* Stepper container */}
                      <div className="flex items-center bg-slate-100 rounded-lg px-1 py-0.5 border border-slate-200">
                        <button
                          onClick={() => updateCartQty(item.id, item.qty - 1)}
                          className="p-1 text-slate-500 hover:text-slate-800"
                          aria-label="Зменшити"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold font-mono">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.id, item.qty + 1)}
                          className="p-1 text-slate-500 hover:text-slate-800"
                          aria-label="Збільшити"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Total Price */}
                      <span className="text-xs font-extrabold text-red-600 font-display tabular-nums min-w-[55px] text-right">
                        {itemTotal.toFixed(0)} грн
                      </span>

                      {/* Trash Icon */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
                        title="Видалити з кошика"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                    </div>
                  </div>
                );
              })
            )}

            {/* "З цим часто купують" Section inside Cart Drawer */}
            {frequentlyBoughtTogether.length > 0 && cart.length > 0 && (
              <div className="pt-6 mt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <ShoppingCart className="w-3.5 h-3.5 text-red-600" />
                    <span>З цим часто купують</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Швидке додавання</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {frequentlyBoughtTogether.map((item) => {
                    const isAdded = addedItemIds.includes(item.id);
                    const isItemPlumbing = 
                      item.category?.toLowerCase().includes('сантех') ||
                      item.category?.toLowerCase().includes('змішувач') ||
                      item.category?.toLowerCase().includes('труб') ||
                      item.category?.toLowerCase().includes('радіатор');

                    return (
                      <div 
                        key={item.id}
                        className="bg-slate-50 rounded-xl border border-slate-200/80 p-2.5 flex flex-col justify-between hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="aspect-[4/3] rounded-lg bg-white flex items-center justify-center p-1 mb-1.5 border border-slate-100">
                          {item.image && item.image.trim() !== '' ? (
                            <img
                              src={getSafeImageUrl(item.image)}
                              alt={item.name}
                              className="max-h-full max-w-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            isItemPlumbing ? (
                              <Droplets className="w-6 h-6 text-slate-400 stroke-[1.5]" />
                            ) : (
                              <Zap className="w-6 h-6 text-slate-400 stroke-[1.5]" />
                            )
                          )}
                        </div>

                        <div className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight mb-2 h-7">
                          {item.name}
                        </div>

                        <div className="flex items-center justify-between gap-1 pt-1 mt-auto">
                          <span className="text-xs font-extrabold text-red-600 tabular-nums">
                            {item.price} грн
                          </span>
                          <button
                            onClick={() => handleAddRelated(item)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-all active:scale-90 ${
                              isAdded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                            }`}
                            title="Додати до замовлення"
                          >
                            {isAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer & Checkout Trigger */}
          {cart.length > 0 && (
            <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-3">
              
              {/* Client Discount Banner */}
              {currentClient && currentClient.discount > 0 && (
                <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-200 font-medium">
                  <span>Знижка клієнта ({currentClient.discount}%)</span>
                  <span className="font-bold tabular-nums">-{discountAmount.toFixed(2)} грн</span>
                </div>
              )}

              {/* Total Row */}
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-xs font-bold text-slate-600">Разом до сплати:</span>
                <span className="text-2xl font-black font-display text-red-600 tabular-nums">
                  {discountedCartSum.toFixed(2)} грн
                </span>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={handleCheckoutClick}
                className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-red-600/25 active:scale-[0.98]"
              >
                <span>Оформити замовлення</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
