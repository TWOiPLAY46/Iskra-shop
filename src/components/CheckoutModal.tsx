import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  formatUkrainianPhone, 
  extractLocalPhoneDigits, 
  getFullInternationalPhone, 
  UKRAINIAN_OPERATOR_CODES 
} from '../utils/phoneFormatter';
import { 
  X, 
  CheckCircle2, 
  Truck, 
  MapPin, 
  CreditCard, 
  Banknote, 
  ArrowRight, 
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import { Order } from '../types/store';

export const CheckoutModal: React.FC = () => {
  const { 
    isCheckoutModalOpen, 
    setIsCheckoutModalOpen, 
    cart, 
    discountedCartSum, 
    currentClient, 
    currentClientPhone,
    placeOrder, 
    setActiveView,
    siteSettings,
    showToast
  } = useStore();

  const [fio, setFio] = useState(currentClient?.name || '');
  const [phone, setPhone] = useState(currentClientPhone ? formatUkrainianPhone(currentClientPhone) : '');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [deliveryType, setDeliveryType] = useState<'novaposhta' | 'pickup' | 'courier'>('novaposhta');
  const [npCity, setNpCity] = useState('');
  const [npDepartment, setNpDepartment] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'card_online' | 'bank_invoice'>('cash_on_delivery');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Sync client phone when opened
  useEffect(() => {
    if (currentClientPhone && !phone) {
      setPhone(formatUkrainianPhone(currentClientPhone));
    }
  }, [currentClientPhone]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatUkrainianPhone(e.target.value);
    setPhone(formatted);
    if (phoneError) setPhoneError(null);
  };

  const handleSetOperatorCode = (code: string) => {
    const digits = extractLocalPhoneDigits(phone);
    const subscriberPart = digits.length > 2 ? digits.slice(2) : '';
    const newFormatted = formatUkrainianPhone(code + subscriberPart);
    setPhone(newFormatted);
    if (phoneError) setPhoneError(null);
  };

  if (!isCheckoutModalOpen) return null;

  const minSum = siteSettings.features?.minOrderSum ?? 50;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fio.trim()) return;

    const localDigits = extractLocalPhoneDigits(phone);
    if (!localDigits) {
      setPhoneError("Введіть номер телефону для зв'язку (наприклад: +380 (67) 123-45-67)");
      showToast("Вкажіть номер телефону", "error");
      return;
    }
    if (localDigits.length < 9) {
      setPhoneError(`Номер телефону має містити повні 9 цифр після +380. Залишилось: ${9 - localDigits.length}`);
      showToast("Введіть повний номер телефону", "error");
      return;
    }
    setPhoneError(null);

    if (discountedCartSum < minSum) {
      showToast(`Мінімальна сума замовлення становить ${minSum} грн`, 'error');
      return;
    }

    setIsSubmitting(true);

    let deliveryString = 'Самовивіз з магазину (с. Оратів)';
    if (deliveryType === 'novaposhta') {
      deliveryString = `Нова Пошта: ${npCity || 'Україна'}, Відділення/Поштомат: ${npDepartment || '№1'}`;
    } else if (deliveryType === 'courier') {
      deliveryString = `Кур'єрська доставка: ${streetAddress || 'Вказана адреса'}`;
    }

    try {
      const fullPhone = getFullInternationalPhone(phone);
      const order = await placeOrder({
        fio,
        phone: fullPhone,
        delivery: deliveryString,
        city: deliveryType === 'novaposhta' ? npCity : 'с. Оратів',
        paymentMethod,
        notes
      });
      setPlacedOrder(order);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsCheckoutModalOpen(false);
    setPlacedOrder(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm transition-opacity" 
        onClick={handleClose} 
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full max-w-2xl border border-slate-200">
          
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-500" />
              <h3 className="text-base font-bold font-display uppercase tracking-wider">
                {placedOrder ? "Замовлення оформлено!" : "Оформлення замовлення"}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Placed Order Success Screen */}
          {placedOrder ? (
            <div className="p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-2xl font-black font-display text-slate-900 mb-2">
                  Дякуємо за ваше замовлення!
                </h4>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Номер вашого замовлення: <span className="font-bold text-orange-600 font-mono">№{placedOrder.id}</span>.
                  Наш менеджер зв'яжеться з вами за номером <b className="text-slate-900">{placedOrder.phone}</b> для підтвердження.
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left max-w-md mx-auto text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Одержувач:</span>
                  <span className="font-semibold text-slate-900">{placedOrder.fio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Доставка:</span>
                  <span className="font-semibold text-slate-900">{placedOrder.delivery}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Сума замовлення:</span>
                  <span className="font-bold text-emerald-600 tabular-nums">{placedOrder.total.toFixed(2)} грн</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Статус:</span>
                  <span className="bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded text-[10px]">
                    {placedOrder.status}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  onClick={() => {
                    handleClose();
                    setActiveView('account');
                  }}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Переглянути в кабінеті
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Продовжити покупки
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              
              {/* Step 1: Customer Contact */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Контактні дані покупця</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Прізвище та Ім'я *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="напр., Петро Іваненко"
                      value={fio}
                      onChange={(e) => setFio(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Номер телефону *</span>
                      <span className="text-[11px] font-semibold text-orange-600">Приклад: +380 (67)...</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+380 (67) 000-00-00"
                      value={phone}
                      onChange={handlePhoneChange}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 outline-none transition-all font-mono tracking-wider ${
                        phoneError 
                          ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/20' 
                          : 'border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                      }`}
                    />

                    {/* Quick Operator selector */}
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap text-[10px] text-slate-500">
                      <span className="text-slate-400">Код:</span>
                      {UKRAINIAN_OPERATOR_CODES.slice(0, 5).map((op) => (
                        <button
                          key={op.code}
                          type="button"
                          onClick={() => handleSetOperatorCode(op.code)}
                          className="px-1.5 py-0.5 bg-slate-100 hover:bg-orange-100 hover:text-orange-700 rounded text-slate-700 font-mono font-semibold transition-colors border border-slate-200"
                          title={`${op.name} (${op.code})`}
                        >
                          {op.code}
                        </button>
                      ))}
                    </div>

                    {phoneError && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{phoneError}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: Delivery Method */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Спосіб доставки</span>
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('novaposhta')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      deliveryType === 'novaposhta'
                        ? 'border-orange-600 bg-orange-50/50 text-orange-950 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 text-xs'
                    }`}
                  >
                    <Truck className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                    <span className="text-xs">Нова Пошта</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('pickup')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      deliveryType === 'pickup'
                        ? 'border-orange-600 bg-orange-50/50 text-orange-950 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 text-xs'
                    }`}
                  >
                    <MapPin className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                    <span className="text-xs">Самовивіз</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('courier')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      deliveryType === 'courier'
                        ? 'border-orange-600 bg-orange-50/50 text-orange-950 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 text-xs'
                    }`}
                  >
                    <Truck className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                    <span className="text-xs">Кур'єр</span>
                  </button>
                </div>

                {/* Delivery Fields */}
                {deliveryType === 'novaposhta' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Місто / Населений пункт *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="напр., с. Оратів / м. Вінниця"
                        value={npCity}
                        onChange={(e) => setNpCity(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Відділення або поштомат *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="напр., Відділення №1 або Поштомат №5432"
                        value={npDepartment}
                        onChange={(e) => setNpDepartment(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white outline-none"
                      />
                    </div>
                  </div>
                )}

                {deliveryType === 'pickup' && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600">
                    <b>Адреса магазину для самовивозу:</b><br />
                    Вінницька обл., с. Оратів, вул. Героїв Майдану, 14.<br />
                    <span className="text-slate-500 text-[11px]">Графік: Пн-Пт 08:00–18:00, Сб 08:00–15:00.</span>
                  </div>
                )}

                {deliveryType === 'courier' && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Адреса доставки (місто, вулиця, будинок, квартира) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="напр., с. Оратів, вул. Центральна, 15"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Step 3: Payment Method */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Спосіб оплати</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs ${
                    paymentMethod === 'cash_on_delivery' ? 'border-orange-600 bg-orange-50 font-bold text-orange-950' : 'border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'cash_on_delivery'}
                      onChange={() => setPaymentMethod('cash_on_delivery')}
                      className="text-orange-600"
                    />
                    <span>Післяплата (при отриманні)</span>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs ${
                    paymentMethod === 'card_online' ? 'border-orange-600 bg-orange-50 font-bold text-orange-950' : 'border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'card_online'}
                      onChange={() => setPaymentMethod('card_online')}
                      className="text-orange-600"
                    />
                    <span>Оплата карткою</span>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs ${
                    paymentMethod === 'bank_invoice' ? 'border-orange-600 bg-orange-50 font-bold text-orange-950' : 'border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'bank_invoice'}
                      onChange={() => setPaymentMethod('bank_invoice')}
                      className="text-orange-600"
                    />
                    <span>Рахунок-фактура (IBAN)</span>
                  </label>
                </div>
              </div>

              {/* Order Comment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Коментар до замовлення (необов'язково)
                </label>
                <textarea
                  rows={2}
                  placeholder="Додаткові побажання щодо часу доставки або характеристик..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none"
                />
              </div>

              {/* Summary and Submit */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">До сплати:</div>
                  <div className="text-xl font-black font-display text-slate-950 tabular-nums">
                    {discountedCartSum.toFixed(2)} грн
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || cart.length === 0}
                  className="px-6 py-3.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-orange-600/30 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Оформлення...</span>
                  ) : (
                    <>
                      <span>Підтвердити замовлення</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};
