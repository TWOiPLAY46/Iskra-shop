import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { getSafeImageUrl } from '../utils/assetImages';
import { 
  formatUkrainianPhone, 
  extractLocalPhoneDigits, 
  getFullInternationalPhone, 
  UKRAINIAN_OPERATOR_CODES 
} from '../utils/phoneFormatter';
import { 
  User, 
  Wallet, 
  Percent, 
  Package, 
  Clock, 
  Truck, 
  ExternalLink, 
  ArrowLeft, 
  LogOut, 
  CheckCircle2, 
  Phone,
  Search,
  Copy,
  Check,
  RotateCcw,
  Printer,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  MapPin,
  CreditCard,
  FileText,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { Order, OrderStatus } from '../types/store';

const ORDER_STEPS: { status: OrderStatus; label: string; desc: string }[] = [
  { status: 'Створено', label: 'Оформлено', desc: 'Замовлення прийнято в систему' },
  { status: 'Оплачено', label: 'Оплачено', desc: 'Кошти або спосіб оплати підтверджено' },
  { status: 'Збирається', label: 'Комплектується', desc: 'Збирається на складі в м. Шепетівка' },
  { status: 'Відправлено', label: 'В дорозі', desc: 'Передано перевізнику Нова Пошта' },
  { status: 'Доставлено', label: 'Доставлено', desc: 'Готово до отримання або видано' }
];

export const AccountView: React.FC = () => {
  const { 
    currentClient, 
    currentClientPhone, 
    loginClient, 
    logoutClient, 
    orders, 
    products,
    addToCart,
    setIsCartDrawerOpen,
    siteSettings,
    setActiveView,
    showToast
  } = useStore();

  // Authentication inputs
  const [inputPhone, setInputPhone] = useState('');
  const [inputName, setInputName] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Active view tab in account
  const [activeTab, setActiveTab] = useState<'orders' | 'track' | 'loyalty'>('orders');

  // Search & Filter in Orders list
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Standalone tracking search state
  const [standaloneTrackQuery, setStandaloneTrackQuery] = useState('');
  const [searchedOrderResult, setSearchedOrderResult] = useState<Order | null>(null);
  const [hasSearchedTrack, setHasSearchedTrack] = useState(false);

  // Clipboard state for copying IDs / TTN
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string, label = 'Скопійовано') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`${label}: ${text}`, 'success');
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatUkrainianPhone(raw);
    setInputPhone(formatted);
    if (phoneError) setPhoneError(null);
  };

  const handleSetOperatorCode = (code: string) => {
    const digits = extractLocalPhoneDigits(inputPhone);
    const subscriberPart = digits.length > 2 ? digits.slice(2) : '';
    const newFormatted = formatUkrainianPhone(code + subscriberPart);
    setInputPhone(newFormatted);
    if (phoneError) setPhoneError(null);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const localDigits = extractLocalPhoneDigits(inputPhone);
    if (!localDigits) {
      setPhoneError("Введіть номер телефону для входу (наприклад: +380 (67) 123-45-67)");
      return;
    }
    if (localDigits.length < 9) {
      setPhoneError(`Введіть повний 9-значний номер телефону після коду країни (+380). Залишилось ввести ще ${9 - localDigits.length} цифр.`);
      return;
    }
    setPhoneError(null);
    const fullPhone = getFullInternationalPhone(inputPhone);
    loginClient(fullPhone, inputName.trim() || 'Покупець');
    showToast('Успішний вхід до особистого кабінету!', 'success');
  };

  // Filter orders for authorized client
  const clientOrders = useMemo(() => {
    if (!currentClientPhone) return [];
    const cleanC = currentClientPhone.replace(/\D/g, '');
    return orders.filter((o) => {
      const cleanO = (o.phone || '').replace(/\D/g, '');
      return cleanO && cleanC && (cleanO === cleanC || cleanO.includes(cleanC) || cleanC.includes(cleanO));
    });
  }, [orders, currentClientPhone]);

  // Apply search & status filter
  const filteredOrders = useMemo(() => {
    return clientOrders.filter((order) => {
      // Status filter
      if (statusFilter === 'active' && order.status === 'Доставлено') return false;
      if (statusFilter === 'completed' && order.status !== 'Доставлено') return false;

      // Text query
      if (!orderSearchQuery.trim()) return true;
      const q = orderSearchQuery.toLowerCase().trim();
      const matchId = order.id.toLowerCase().includes(q);
      const matchTtn = order.ttn?.toLowerCase().includes(q);
      const matchCity = order.city?.toLowerCase().includes(q);
      const matchItem = order.items?.some(i => i.name.toLowerCase().includes(q));
      return matchId || matchTtn || matchCity || matchItem;
    });
  }, [clientOrders, statusFilter, orderSearchQuery]);

  // Standalone tracking search handler
  const handleStandaloneTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const query = standaloneTrackQuery.trim().replace(/^№/, '').toLowerCase();
    if (!query) return;

    setHasSearchedTrack(true);
    const cleanQuery = query.replace(/\D/g, '');

    const found = orders.find((o) => {
      const idMatch = o.id.toLowerCase() === query || o.id.toLowerCase().includes(query);
      const ttnMatch = o.ttn && o.ttn.replace(/\D/g, '') === cleanQuery;
      const phoneMatch = cleanQuery.length >= 9 && o.phone.replace(/\D/g, '').includes(cleanQuery);
      return idMatch || ttnMatch || phoneMatch;
    });

    setSearchedOrderResult(found || null);
    if (found) {
      showToast(`Знайдено замовлення №${found.id}`, 'success');
    } else {
      showToast('Замовлення за вказаним номером не знайдено', 'error');
    }
  };

  // Re-order items
  const handleRepeatOrder = (order: Order) => {
    let addedCount = 0;
    order.items?.forEach((item) => {
      const existing = products.find(p => p.name === item.name || (item.sku && p.sku === item.sku));
      if (existing) {
        addToCart(existing, item.qty);
        addedCount++;
      } else {
        addToCart({
          id: 'prod-' + Date.now() + Math.random().toString(36).slice(2, 6),
          name: item.name,
          category: 'Загальне',
          badge: '',
          sku: item.sku || 'SKU-' + Math.floor(1000 + Math.random() * 9000),
          stock: 99,
          price: item.price,
          unit: item.unit || 'грн/шт',
          desc: '',
          image: item.image || '/src/assets/images/product_circuit_breaker_1790671628425.jpg'
        }, item.qty);
        addedCount++;
      }
    });
    showToast(`У кошик додано ${addedCount} товар(ів) із замовлення №${order.id}!`, 'success');
    setIsCartDrawerOpen(true);
  };

  // Print order receipt
  const handlePrintOrder = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = order.items?.map(i => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${i.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${i.qty} ${i.unit || 'шт'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${i.price} грн</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${(i.price * i.qty).toFixed(2)} грн</td>
      </tr>
    `).join('') || '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Товарний чек - Замовлення №${order.id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0f172a; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
            .meta { margin-bottom: 16px; font-size: 13px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 16px 0; }
            th { background: #f8fafc; padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1; }
            .total { text-align: right; font-size: 16px; font-weight: bold; margin-top: 16px; }
            .footer { margin-top: 32px; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-size: 11px; text-align: center; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Магазин електромонтажу та сантехніки «ІСКРА»</h2>
            <div>м. Шепетівка, Хмельницька обл. · Тел: ${siteSettings.phone}</div>
          </div>
          <div class="meta">
            <div><b>Замовлення №:</b> ${order.id}</div>
            <div><b>Дата:</b> ${order.date}</div>
            <div><b>Одержувач:</b> ${order.fio} (${order.phone})</div>
            <div><b>Доставка:</b> ${order.delivery}, ${order.city}</div>
            ${order.ttn ? `<div><b>ТТН Нова Пошта:</b> ${order.ttn}</div>` : ''}
            <div><b>Статус:</b> ${order.status}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Найменування товару</th>
                <th style="text-align: center;">К-сть</th>
                <th style="text-align: right;">Ціна</th>
                <th style="text-align: right;">Сума</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="total">
            Разом до сплати: ${order.total.toFixed(2)} грн
          </div>
          <div class="footer">
            Дякуємо за покупку в магазині ISKRA! Зберігайте чек для гарантійного обслуговування.
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Доставлено':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', text: 'Доставлено' };
      case 'Відправлено':
        return { bg: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500', text: 'В дорозі (Нова Пошта)' };
      case 'Збирається':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', text: 'Комплектується на складі' };
      case 'Оплачено':
        return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500', text: 'Оплачено' };
      default:
        return { bg: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500', text: 'Створено' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs backdrop-blur-md bg-white/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          
          <button
            onClick={() => setActiveView('store')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-orange-600 transition-colors group"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-orange-50 flex items-center justify-center transition-colors">
              <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:text-orange-600" />
            </div>
            <span>Повернутися до каталогу</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-500 hidden sm:inline">Служба доставки ISKRA</span>
            <span className="font-bold text-slate-800">м. Шепетівка</span>
          </div>

        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10">

        {!currentClientPhone ? (
          /* ========================================================= */
          /* UNAUTHENTICATED VIEW: DUAL LOGIN OR QUICK TRACKING        */
          /* ========================================================= */
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Title Section */}
            <div className="text-center max-w-xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100/80 text-orange-700 rounded-full text-xs font-bold mb-1">
                <Truck className="w-3.5 h-3.5" />
                <span>Особистий кабінет та відстеження посилок</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900 tracking-tight">
                Мої замовлення та відстеження
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Увійдіть за номером телефону, щоб переглянути всі замовлення та бонуси, або введіть номер ТТН для миттєвого відстеження.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Login Card (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Вхід до особистого кабінету</h2>
                    <p className="text-[11px] text-slate-500">Автоматичний доступ до історії покупок та знижок</p>
                  </div>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Номер телефону *</span>
                      <span className="text-[11px] font-semibold text-orange-600">Приклад: +380 (67)...</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        required
                        placeholder="+380 (67) 000-00-00"
                        value={inputPhone}
                        onChange={handlePhoneChange}
                        className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm text-slate-900 outline-none transition-all font-mono tracking-wider ${
                          phoneError 
                            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/20' 
                            : 'border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 bg-slate-50/50'
                        }`}
                      />
                    </div>
                    
                    {/* Operator quick code selector */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px] text-slate-500">
                      <span className="font-medium text-slate-400">Код оператора:</span>
                      {UKRAINIAN_OPERATOR_CODES.slice(0, 6).map((op) => (
                        <button
                          key={op.code}
                          type="button"
                          onClick={() => handleSetOperatorCode(op.code)}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-orange-100 hover:text-orange-700 rounded-lg text-slate-700 font-mono font-semibold transition-colors border border-slate-200/70"
                          title={`${op.name} (${op.code})`}
                        >
                          {op.code} ({op.name})
                        </button>
                      ))}
                    </div>

                    {phoneError && (
                      <p className="text-xs text-rose-600 mt-1.5 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{phoneError}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Ваше ім'я <span className="font-normal text-slate-400">(необов'язково)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Олександр / Марія"
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm text-slate-900 bg-slate-50/50 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-orange-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    <span>Увійти та показати замовлення</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Loyalty perks list */}
                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                    <span>Накопичувальні бонуси</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                      <Truck className="w-3 h-3" />
                    </span>
                    <span>Живий статус Нової Пошти</span>
                  </div>
                </div>

              </div>

              {/* Right Column: Quick Single Order Tracking Search (5 cols) */}
              <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Швидке відстеження</h2>
                    <p className="text-[11px] text-slate-400">Без реєстрації та входу</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Введіть номер замовлення (напр. <code className="text-orange-400 font-mono">174092182</code>) або номер накладної Нової Пошти (14 цифр).
                </p>

                <form onSubmit={handleStandaloneTrack} className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Введіть номер або ТТН..."
                      value={standaloneTrackQuery}
                      onChange={(e) => setStandaloneTrackQuery(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-slate-800/90 border border-slate-700 rounded-2xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 transition-all font-mono"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-colors"
                      title="Знайти посилку"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>

                {/* Quick results if searched */}
                {hasSearchedTrack && (
                  <div className="pt-2 animate-in fade-in duration-200">
                    {searchedOrderResult ? (
                      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white font-mono">
                            Замовлення №{searchedOrderResult.id}
                          </span>
                          <span className="text-emerald-400 font-bold">
                            {searchedOrderResult.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {searchedOrderResult.fio} · {searchedOrderResult.city}
                        </div>
                        {searchedOrderResult.ttn && (
                          <div className="flex items-center justify-between pt-2 border-t border-slate-700 text-xs">
                            <span className="text-slate-400">ТТН: <b className="text-sky-300 font-mono">{searchedOrderResult.ttn}</b></span>
                            <a
                              href={`https://tracking.novaposhta.ua/#/uk/document/${searchedOrderResult.ttn.trim()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-400 hover:text-orange-300 text-xs font-bold inline-flex items-center gap-1"
                            >
                              <span>Нова Пошта</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-4 text-xs text-rose-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Замовлення не знайдено. Перевірте номер або зателефонуйте менеджеру.</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 text-[11px] text-slate-400 space-y-1">
                  <div className="font-bold text-slate-300">Потрібна допомога менеджера?</div>
                  <div>Гаряча лінія ISKRA: <a href={`tel:${siteSettings.phone.replace(/\D/g, '')}`} className="text-orange-400 font-bold hover:underline">{siteSettings.phone}</a></div>
                  <div>Графік: {siteSettings.workHours}</div>
                </div>

              </div>

            </div>

          </div>
        ) : (
          /* ========================================================= */
          /* AUTHORIZED CLIENT VIEW: FULL RICH DASHBOARD               */
          /* ========================================================= */
          <div className="space-y-8">
            
            {/* 1. Client Profile & Status Banner */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* User Identity */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-orange-600 text-white flex items-center justify-center font-black text-2xl font-display shadow-md shadow-slate-900/10">
                    {currentClient?.name?.charAt(0).toUpperCase() || 'К'}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
                        {currentClient?.name || 'Шановний клієнт'}
                      </h1>
                      <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-orange-600" />
                        <span>Покупець ISKRA</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>+{currentClientPhone}</span>
                      </span>
                      <span>·</span>
                      <span>Замовлень: <b>{clientOrders.length}</b></span>
                    </div>
                  </div>
                </div>

                {/* Actions (Logout) */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={logoutClient}
                    className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-bold text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors shadow-2xs inline-flex items-center gap-2 active:scale-95"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Вийти з кабінету</span>
                  </button>
                </div>

              </div>

              {/* Loyalty & Financial Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
                
                {/* Bonus Balance */}
                <div className="bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-2xl p-5 shadow-lg shadow-orange-500/15 relative overflow-hidden group">
                  <div className="absolute right-3 -bottom-2 text-white/10 group-hover:scale-110 transition-transform pointer-events-none">
                    <Wallet className="w-24 h-24" />
                  </div>
                  <div className="relative z-10 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-orange-100 font-bold uppercase tracking-wider">
                      <Wallet className="w-4 h-4" />
                      <span>Бонусний баланс</span>
                    </div>
                    <div className="text-3xl font-black font-display tabular-nums">
                      {(currentClient?.balance || 0).toFixed(2)} <span className="text-lg font-bold">грн</span>
                    </div>
                    <p className="text-[11px] text-orange-100/90 pt-1">
                      1 бонус = 1 грн на оплату замовлень
                    </p>
                  </div>
                </div>

                {/* Personal Discount */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg shadow-slate-900/15 border border-slate-800 relative overflow-hidden group">
                  <div className="absolute right-3 -bottom-2 text-white/5 group-hover:scale-110 transition-transform pointer-events-none">
                    <Percent className="w-24 h-24" />
                  </div>
                  <div className="relative z-10 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider">
                      <Percent className="w-4 h-4 text-emerald-400" />
                      <span>Персональна знижка</span>
                    </div>
                    <div className="text-3xl font-black font-display text-emerald-400 tabular-nums">
                      {currentClient?.discount || 0}%
                    </div>
                    <p className="text-[11px] text-slate-400 pt-1">
                      Автоматично нараховується у кошику
                    </p>
                  </div>
                </div>

                {/* Orders Statistics */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-slate-800 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase tracking-wider">
                      <Package className="w-4 h-4 text-orange-600" />
                      <span>Сума покупок</span>
                    </div>
                    <div className="text-2xl font-black font-display text-slate-900 tabular-nums">
                      {clientOrders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)} <span className="text-sm font-bold text-slate-500">грн</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                    <span>Успішних покупок: <b>{clientOrders.filter(o => o.status === 'Доставлено').length}</b></span>
                    <span>В обробці: <b>{clientOrders.filter(o => o.status !== 'Доставлено').length}</b></span>
                  </div>
                </div>

              </div>
            </div>

            {/* 2. Main Orders Section */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              
              {/* Section Header with Tabs & Search */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                
                <div className="space-y-1">
                  <h2 className="text-lg font-black font-display text-slate-900 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                    <span>Історія замовлень та відстеження</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Живий трекінг статусу доставки через склад та Нову Пошту
                  </p>
                </div>

                {/* Filter and Search controls */}
                <div className="flex flex-wrap items-center gap-3">
                  
                  {/* Status Segments */}
                  <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        statusFilter === 'all'
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Всі ({clientOrders.length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('active')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        statusFilter === 'active'
                          ? 'bg-white text-orange-600 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Активні ({clientOrders.filter(o => o.status !== 'Доставлено').length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('completed')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        statusFilter === 'completed'
                          ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Доставлені ({clientOrders.filter(o => o.status === 'Доставлено').length})
                    </button>
                  </div>

                  {/* Search input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Пошук замовлення..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-orange-500 transition-colors w-40 sm:w-48"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                </div>

              </div>

              {/* Order Cards List */}
              {filteredOrders.length === 0 ? (
                <div className="text-center py-16 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-400 mx-auto flex items-center justify-center">
                    <Package className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    {clientOrders.length === 0 ? 'У вас поки немає оформлених замовлень' : 'За вашим пошуковим запитом замовлень не знайдено'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Оберіть потрібну електротехніку або сантехніку в каталозі товарів та оформіть доставку.
                  </p>
                  <button
                    onClick={() => setActiveView('store')}
                    className="mt-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-600/20 transition-all inline-flex items-center gap-2"
                  >
                    <span>Перейти до покупок</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredOrders.map((order) => {
                    const currentIdx = ORDER_STEPS.findIndex(s => s.status === order.status);
                    const badge = getStatusBadge(order.status);

                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-shadow overflow-hidden"
                      >
                        
                        {/* 1. Card Top Bar */}
                        <div className="bg-slate-50/80 p-4 sm:p-5 border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-3">
                          
                          <div className="flex items-center gap-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-slate-900 font-display">
                                  Замовлення №{order.id}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(order.id, `order-${order.id}`, 'Номер замовлення')}
                                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                                  title="Скопіювати номер замовлення"
                                >
                                  {copiedKey === `order-${order.id}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                Оформлено: {order.date}
                              </div>
                            </div>
                          </div>

                          {/* Status Pill & Total Sum */}
                          <div className="flex items-center gap-4">
                            <div className={`px-3 py-1 rounded-full border text-xs font-bold inline-flex items-center gap-1.5 ${badge.bg}`}>
                              <span className={`w-2 h-2 rounded-full ${badge.dot} animate-pulse`} />
                              <span>{badge.text}</span>
                            </div>

                            <div className="text-right">
                              <div className="text-base font-black text-slate-900 font-display tabular-nums">
                                {order.total.toFixed(2)} грн
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium">
                                {order.paymentMethod === 'card_online' 
                                  ? 'Оплата карткою онлайн' 
                                  : order.paymentMethod === 'bank_invoice' 
                                  ? 'Безготівковий розрахунок' 
                                  : 'Оплата при отриманні'}
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* 2. Visual Multi-Step Progress Tracker */}
                        <div className="p-5 sm:p-6 border-b border-slate-100 bg-white">
                          <div className="max-w-3xl mx-auto">
                            
                            {/* Step labels and connectors */}
                            <div className="grid grid-cols-5 gap-2 relative">
                              
                              {ORDER_STEPS.map((step, idx) => {
                                const isPassed = idx < currentIdx;
                                const isCurrent = idx === currentIdx;

                                return (
                                  <div key={step.status} className="flex flex-col items-center text-center relative group">
                                    
                                    {/* Circle Icon */}
                                    <div
                                      className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold transition-all duration-300 relative z-10 mb-2 ${
                                        isPassed
                                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                                          : isCurrent
                                          ? 'bg-orange-600 text-white ring-4 ring-orange-100 shadow-md shadow-orange-600/30 animate-pulse'
                                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                                      }`}
                                    >
                                      {isPassed ? (
                                        <CheckCircle2 className="w-5 h-5" />
                                      ) : isCurrent ? (
                                        <Clock className="w-4 h-4" />
                                      ) : (
                                        <span>{idx + 1}</span>
                                      )}
                                    </div>

                                    {/* Stage Title */}
                                    <span
                                      className={`text-[11px] sm:text-xs leading-tight transition-colors ${
                                        isCurrent
                                          ? 'font-black text-orange-600'
                                          : isPassed
                                          ? 'font-bold text-slate-800'
                                          : 'font-medium text-slate-400'
                                      }`}
                                    >
                                      {step.label}
                                    </span>

                                    {/* Stage Description (hidden on tiny screens) */}
                                    <span className="hidden sm:block text-[10px] text-slate-400 mt-0.5 max-w-[100px] leading-tight">
                                      {step.desc}
                                    </span>

                                  </div>
                                );
                              })}

                            </div>

                          </div>
                        </div>

                        {/* 3. Nova Poshta Tracking Banner (if TTN exists) */}
                        {order.ttn ? (
                          <div className="bg-sky-50/70 border-b border-sky-100 p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shrink-0">
                                <Truck className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-sky-950 flex items-center gap-2">
                                  <span>Експрес-накладна Нової Пошти:</span>
                                  <span className="font-mono text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md">
                                    {order.ttn}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(order.ttn!, `ttn-${order.id}`, 'Номер ТТН')}
                                    className="text-sky-600 hover:text-sky-900"
                                    title="Скопіювати ТТН"
                                  >
                                    {copiedKey === `ttn-${order.id}` ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                                <p className="text-[11px] text-sky-700 mt-0.5">
                                  Посилка відстежується в реальному часі на офіційному сервері перевізника
                                </p>
                              </div>
                            </div>

                            <a
                              href={`https://tracking.novaposhta.ua/#/uk/document/${order.ttn.trim()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5 active:scale-95 shrink-0"
                            >
                              <span>Відстежити на сайті Нової Пошти</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : (
                          <div className="bg-amber-50/50 border-b border-amber-100/80 px-4 py-2.5 sm:px-6 text-xs text-amber-800 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>ТТН буде сформовано та надіслано після передачі товару кур'єру Нової Пошти</span>
                          </div>
                        )}

                        {/* 4. Order Details & Product Items Grid */}
                        <div className="p-5 sm:p-6 space-y-4">
                          
                          {/* Products List in Order */}
                          <div>
                            <div className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
                              <span>Товари в замовленні ({order.items?.length || 0})</span>
                              <span className="text-[11px] font-normal text-slate-500">Доставка: {order.delivery}</span>
                            </div>

                            <div className="space-y-2.5">
                              {order.items?.map((item, itemIdx) => (
                                <div
                                  key={itemIdx}
                                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-11 h-11 rounded-lg bg-white overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center p-0.5">
                                      <img
                                        src={getSafeImageUrl(item.image)}
                                        alt={item.name}
                                        className="w-full h-full object-cover rounded"
                                        onError={(e) => {
                                          (e.currentTarget as HTMLImageElement).src = '/src/assets/images/hero_iskra_store_1790671594961.jpg';
                                        }}
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className="text-xs font-bold text-slate-900 truncate">
                                        {item.name}
                                      </h4>
                                      <div className="text-[11px] text-slate-500 font-mono">
                                        {item.qty} {item.unit?.replace('грн/', '') || 'шт.'} × {item.price} грн
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className="text-xs font-bold text-slate-900 font-mono tabular-nums">
                                      {(item.price * item.qty).toFixed(2)} грн
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Recipient and Delivery Meta */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs text-slate-600">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              <div>
                                <b className="text-slate-800">Адреса / Відділення:</b>
                                <div>{order.city}, {order.delivery}</div>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              <div>
                                <b className="text-slate-800">Одержувач:</b>
                                <div>{order.fio} ({order.phone})</div>
                              </div>
                            </div>
                          </div>

                          {order.notes && (
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600">
                              <b className="text-slate-800">Коментар до замовлення:</b> {order.notes}
                            </div>
                          )}

                        </div>

                        {/* 5. Bottom Card Action Toolbar */}
                        <div className="bg-slate-50/90 px-5 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                          
                          <div className="text-[11px] text-slate-500">
                            Питання щодо замовлення? <a href={`tel:${siteSettings.phone.replace(/\D/g, '')}`} className="text-orange-600 font-bold hover:underline">{siteSettings.phone}</a>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handlePrintOrder(order)}
                              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                              title="Роздрукувати накладну"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-500" />
                              <span>Чек / Накладна</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRepeatOrder(order)}
                              className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs active:scale-95"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Повторити замовлення</span>
                            </button>
                          </div>

                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>

          </div>
        )}

      </div>

    </div>
  );
};
