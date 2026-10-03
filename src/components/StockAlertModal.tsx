import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  Phone, 
  User, 
  Package, 
  ShieldCheck, 
  AlertCircle,
  Zap,
  Droplets
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { getSafeImageUrl } from '../utils/assetImages';
import { formatPriceUnit } from '../utils/unitFormatter';

export const StockAlertModal: React.FC = () => {
  const { 
    stockAlertModalProduct, 
    closeStockAlertModal, 
    addStockAlert,
    currentClientPhone,
    currentClient,
    siteSettings
  } = useStore();

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [notifyMethod, setNotifyMethod] = useState<'viber_sms' | 'phone_call'>('phone_call');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill client data if authenticated
  useEffect(() => {
    if (stockAlertModalProduct) {
      setIsSuccess(false);
      setError(null);
      if (currentClientPhone) {
        const clean = currentClientPhone.replace(/^\+380/, '').replace(/^380/, '');
        setPhone(clean);
      } else {
        setPhone('');
      }
      setName(currentClient?.name || '');
    }
  }, [stockAlertModalProduct, currentClientPhone, currentClient]);

  if (!stockAlertModalProduct) return null;

  const isPlumbing = 
    stockAlertModalProduct.category?.toLowerCase().includes('сантех') ||
    stockAlertModalProduct.category?.toLowerCase().includes('змішувач') ||
    stockAlertModalProduct.category?.toLowerCase().includes('труб') ||
    stockAlertModalProduct.category?.toLowerCase().includes('фітинг');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.length < 9) {
      setError('Будь ласка, введіть коректний номер телефону (наприклад: 097 123 45 67)');
      return;
    }

    const fullPhone = clean.startsWith('380') 
      ? `+${clean}` 
      : clean.startsWith('0') 
      ? `+38${clean}` 
      : `+380${clean}`;

    setIsSubmitting(true);
    try {
      await addStockAlert(
        stockAlertModalProduct.id,
        stockAlertModalProduct.name,
        fullPhone,
        name.trim() || undefined,
        stockAlertModalProduct.sku,
        stockAlertModalProduct.image,
        stockAlertModalProduct.price
      );
      setIsSuccess(true);
    } catch {
      setError('Не вдалося надіслати запит. Спробуйте ще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white p-5 sm:p-6 pb-6">
          <button
            type="button"
            onClick={closeStockAlertModal}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Закрити"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-inner">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-100/90 block">
                Служба наявності
              </span>
              <h3 className="text-lg sm:text-xl font-black font-display leading-tight text-white">
                Повідомити про наявність
              </h3>
            </div>
          </div>
          <p className="text-xs text-amber-50/90 leading-relaxed mt-1">
            Ми надішлемо вам повідомлення або зателефонуємо, щойно партія товару надійде на наш склад.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Target Product Preview Card */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="w-14 h-14 rounded-xl bg-white p-1 border border-slate-200 shrink-0 flex items-center justify-center overflow-hidden">
              {stockAlertModalProduct.image && stockAlertModalProduct.image.trim() !== '' ? (
                <img
                  src={getSafeImageUrl(stockAlertModalProduct.image)}
                  alt={stockAlertModalProduct.name}
                  className="max-h-full max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : isPlumbing ? (
                <Droplets className="w-6 h-6 text-slate-400 stroke-[1.5]" />
              ) : (
                <Zap className="w-6 h-6 text-slate-400 stroke-[1.5]" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-mono text-slate-500 font-semibold truncate">
                  {stockAlertModalProduct.sku}
                </span>
                <span className="text-[9.5px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded shrink-0">
                  Закінчився
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 line-clamp-1 leading-snug">
                {stockAlertModalProduct.name}
              </h4>
              <div className="text-xs font-extrabold text-slate-900 mt-0.5">
                {stockAlertModalProduct.price} грн{' '}
                <span className="text-[10px] font-normal text-slate-400">
                  {formatPriceUnit(stockAlertModalProduct.unit)}
                </span>
              </div>
            </div>
          </div>

          {/* Form or Success State */}
          {isSuccess ? (
            <div className="py-4 text-center space-y-3 animate-in fade-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-md">
                <Check className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Запит успішно зареєстровано!
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                Ми зафіксували ваш запит. Як тільки товар надійде, наш менеджер зв'яжеться з вами першочергово!
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={closeStockAlertModal}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  Зрозуміло, продовжити покупки
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Phone Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Номер телефону *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <span className="text-xs font-bold text-slate-500">+380</span>
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="97 123 45 67"
                    className="w-full pl-13 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Для дзвінка або SMS/Viber сповіщення
                </p>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ваше ім'я (необов'язково)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Олександр"
                    className="w-full pl-3.5 pr-9 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Preferred method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Бажаний спосіб зв'язку:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setNotifyMethod('phone_call')}
                    className={`p-2 rounded-xl border text-center font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      notifyMethod === 'phone_call'
                        ? 'border-amber-500 bg-amber-50/70 text-amber-950 ring-1 ring-amber-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5 text-amber-600" />
                    <span>Дзвінок менеджера</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifyMethod('viber_sms')}
                    className={`p-2 rounded-xl border text-center font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      notifyMethod === 'viber_sms'
                        ? 'border-amber-500 bg-amber-50/70 text-amber-950 ring-1 ring-amber-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-600" />
                    <span>SMS / Месенджер</span>
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeStockAlertModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Збереження...</span>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 fill-slate-950" />
                      <span>Повідомити, коли з'явиться</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Без спаму. Номер використовується лише для сповіщення про цей товар.</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
