import React, { useState } from 'react';
import { Product } from '../types/store';
import { useStore } from '../context/StoreContext';
import { getProductBrand } from '../utils/brandHelper';
import { ShoppingBag, Heart, Droplets, Zap, Check, AlertTriangle, Flame } from 'lucide-react';
import { getSafeImageUrl } from '../utils/assetImages';
import { formatUnit, formatPriceUnit } from '../utils/unitFormatter';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, toggleWishlist, isInWishlist, setQuickViewProduct, siteSettings } = useStore();
  const [imageError, setImageError] = useState(false);
  const [isAddedRecently, setIsAddedRecently] = useState(false);

  const brand = getProductBrand(product);
  const isFavorited = Boolean(product?.id && isInWishlist(product.id));
  const isOutOfStock = product.stock <= 0;
  const lowThreshold = siteSettings?.features?.lowStockThreshold ?? 3;
  const isLowStock = !isOutOfStock && product.stock <= lowThreshold;
  const showLowStockBadge = isLowStock && (siteSettings?.features?.showLowStockBadgeToBuyers ?? true);

  const isPlumbing = 
    product.category?.toLowerCase().includes('сантех') ||
    product.category?.toLowerCase().includes('радіатор') ||
    product.category?.toLowerCase().includes('змішувач') ||
    product.category?.toLowerCase().includes('труб') ||
    product.category?.toLowerCase().includes('фітинг') ||
    product.category?.toLowerCase().includes('унітаз') ||
    product.mainCategory?.toLowerCase().includes('сантех');

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, 1);
    setIsAddedRecently(true);
    setTimeout(() => setIsAddedRecently(false), 1200);
  };

  return (
    <div 
      onClick={() => setQuickViewProduct(product)}
      className="group bg-slate-100/80 hover:bg-slate-100 rounded-2xl border border-slate-200/90 overflow-hidden hover:border-slate-300 hover:shadow-lg transition-all duration-200 flex flex-col cursor-pointer relative p-3 sm:p-4 justify-between"
    >
      {/* Top Section: Badge & Favorite Button */}
      <div className="flex items-center justify-between w-full mb-2 z-10">
        <div>
          {product.badge ? (
            <span className={`text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
              product.badge === 'Хіт продажу' 
                ? 'bg-red-600 text-white' 
                : product.badge === 'Акція'
                ? 'bg-red-600 text-white'
                : 'bg-emerald-700 text-white'
            }`}>
              {product.badge}
            </span>
          ) : (
            <div className="h-4" />
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (product?.id) {
              toggleWishlist(product.id);
            }
          }}
          className={`p-1.5 rounded-full transition-all active:scale-90 ${
            isFavorited 
              ? 'text-red-600' 
              : 'text-slate-400 hover:text-red-500'
          }`}
          title={isFavorited ? "Видалити з обраного" : "Додати до обраного"}
          aria-label={isFavorited ? "Видалити з обраного" : "Додати до обраного"}
        >
          <Heart className={`w-4 h-4 transition-transform ${isFavorited ? 'fill-red-600 text-red-600 scale-110' : 'text-slate-400'}`} />
        </button>
      </div>

      {/* Visual Image / Icon Area */}
      <div className="relative aspect-[4/3] w-full flex items-center justify-center p-2 mb-3">
        {!imageError && product.image && product.image.trim() !== '' ? (
          <img
            src={getSafeImageUrl(product.image)}
            alt={product.name}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            {isPlumbing ? (
              <Droplets className="w-16 h-16 sm:w-20 sm:h-20 text-slate-400/80 stroke-[1.5]" />
            ) : (
              <Zap className="w-16 h-16 sm:w-20 sm:h-20 text-slate-400/80 stroke-[1.5]" />
            )}
          </div>
        )}
      </div>

      {/* Product Content Body */}
      <div className="flex flex-col flex-1 justify-between">
        <div>
          {/* SKU & Brand */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] sm:text-[11px] font-mono text-slate-500 font-medium truncate">
              {product.sku}
            </span>
            {brand && brand !== 'Інші виробники' && (
              <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200/80 px-1.5 py-0.2 rounded shrink-0">
                {brand}
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug mb-1.5 group-hover:text-red-600 transition-colors">
            {product.name}
          </h3>

          {/* Stock Status */}
          <div className="text-[11px] font-semibold mb-3">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 text-slate-400 font-medium text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                <span>Закінчився на складі</span>
              </span>
            ) : showLowStockBadge ? (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-900 text-[11px] font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="tracking-tight">
                  Закінчується: <span className="font-extrabold text-amber-950 font-mono">лише {product.stock} {formatUnit(product.unit)}</span>
                </span>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>В наявності ({product.stock} {formatUnit(product.unit)})</span>
              </span>
            )}
          </div>
        </div>

        {/* Pricing & Cart Button Row */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 mt-auto">
          <div>
            <div className="text-sm sm:text-base font-black text-slate-900 tabular-nums leading-none">
              {product.price}{' '}
              <span className="text-xs font-bold text-slate-900">
                грн
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
              {formatPriceUnit(product.unit)}
            </div>
          </div>

          <div className="relative inline-flex items-center">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`relative px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm ${
                isOutOfStock 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : isAddedRecently
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-red-600 hover:bg-red-700 text-white btn-pulse-red'
              }`}
              title="Додати в кошик"
              aria-label="Купити"
            >
              {isAddedRecently ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span className="text-xs">В кошику</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 stroke-[2]" />
                  <span>Купити</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
