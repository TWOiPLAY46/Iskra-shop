import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types/store';
import { 
  Building2, 
  Upload, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  FileCode, 
  Layers, 
  HelpCircle, 
  ArrowRight,
  Database,
  Laptop,
  Globe,
  Settings,
  ShieldCheck,
  X
} from 'lucide-react';
import { parseUkrSkladFeed, generateCommerceMLOrdersXML } from '../utils/ukrSkladSync';
import { normalizeStorageUnit } from '../utils/unitFormatter';

interface UkrSkladSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UkrSkladSyncModal: React.FC<UkrSkladSyncModalProps> = ({ isOpen, onClose }) => {
  const { products, orders, batchSaveProducts, showToast } = useStore();
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'instructions' | 'api'>('import');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedSummary, setParsedSummary] = useState<{ newCount: number; updatedCount: number; errors: string[] } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Скопійовано в буфер обміну', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Handle XML / CSV upload from UkrSklad
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setParsedSummary(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          showToast('Файл порожній', 'error');
          setIsProcessing(false);
          return;
        }

        const parsed = parseUkrSkladFeed(text);
        if (parsed.products.length === 0) {
          showToast('Не знайдено товарів у файлі. Перевірте формат XML / CommerceML / CSV.', 'error');
          setIsProcessing(false);
          return;
        }

        const { newCount, updatedCount } = batchSaveProducts(parsed.products);

        setParsedSummary({
          newCount,
          updatedCount,
          errors: parsed.errors
        });

        showToast(`Успішно опрацьовано: +${newCount} нових, ${updatedCount} оновлено!`, 'success');
      } catch (err: any) {
        showToast(`Помилка опрацювання: ${err.message}`, 'error');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsText(file, 'windows-1251');
  };

  // Handle Export Orders to CommerceML XML for UkrSklad
  const handleExportOrders = () => {
    try {
      const xml = generateCommerceMLOrdersXML(orders);
      const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders_ukrsklad_${new Date().toISOString().split('T')[0]}.xml`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Файл orders.xml для УкрСклад успішно збережено!', 'success');
    } catch (e: any) {
      showToast('Помилка формування файлу: ' + e.message, 'error');
    }
  };

  const syncUrl = `${window.location.origin}/api/ukrsklad/sync`;
  const syncLogin = 'admin_iskra';
  const syncApiKey = 'ukr_sec_' + btoa(window.location.host).slice(0, 16);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black font-display">Синхронізація з програмою «УкрСклад»</h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                  CommerceML 2.0
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Автоматичний зв'язок бази товарів, цін та замовлень між ноутбуком у магазині та сайтом
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 flex gap-2 sm:gap-6 bg-slate-50/80 overflow-x-auto text-xs sm:text-sm font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`py-3.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'import'
                ? 'border-red-600 text-red-600 font-black'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Імпорт товарів з УкрСклад</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`py-3.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'export'
                ? 'border-red-600 text-red-600 font-black'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Експорт замовлень в УкрСклад</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className={`py-3.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'api'
                ? 'border-red-600 text-red-600 font-black'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Параметри модуля УкрСклад</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('instructions')}
            className={`py-3.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'instructions'
                ? 'border-red-600 text-red-600 font-black'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Покрокова інструкція</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* TAB 1: IMPORT FROM UKRSKLAD */}
          {activeTab === 'import' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900">
                <Laptop className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm space-y-1">
                  <p className="font-bold">Як завантажити товари з вашого ноутбука:</p>
                  <p className="text-amber-800">
                    В «УкрСклад» натисніть <strong>«Звіти ➔ Залишки на складі ➔ Зберегти в XML / CSV»</strong> (або скористайтесь файлом <code>import.xml</code> з модуля синхронізації) та завантажте його сюди.
                  </p>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-red-500 rounded-3xl p-8 text-center bg-slate-50/50 hover:bg-red-50/20 transition-all cursor-pointer relative group">
                <input
                  type="file"
                  accept=".xml,.csv,.txt"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {isProcessing ? (
                      <RefreshCw className="w-8 h-8 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900">
                      {isProcessing ? 'Опрацьовуємо товари...' : 'Натисніть або перетягніть файл з УкрСклад'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Підтримуються формати: CommerceML <code>import.xml</code>, <code>offers.xml</code>, <code>goods.xml</code> та CSV
                    </p>
                  </div>
                  <span className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs">
                    Обрати файл на ноутбуці
                  </span>
                </div>
              </div>

              {/* Result Summary */}
              {parsedSummary && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Базу сайту успішно синхронізовано з УкрСклад!</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 font-semibold text-slate-700">
                      <span className="text-slate-500 block">Нових товарів додано:</span>
                      <strong className="text-emerald-600 text-base">+{parsedSummary.newCount}</strong>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 font-semibold text-slate-700">
                      <span className="text-slate-500 block">Оновлено цін та залишків:</span>
                      <strong className="text-blue-600 text-base">{parsedSummary.updatedCount}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EXPORT ORDERS TO UKRSKLAD */}
          {activeTab === 'export' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 flex items-start gap-3 text-sky-900">
                <Database className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm space-y-1">
                  <p className="font-bold">Перенесення замовлень покупців в УкрСклад:</p>
                  <p className="text-sky-800">
                    Сайт генерує файл стандарту <strong>CommerceML 2.0 (orders.xml)</strong> з усіма даними покупця (ПІБ, телефон, місто, склад доставки, сума, статус оплати).
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-slate-900 text-base">Вивантажити всі замовлення сайту</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Всього замовлень у базі сайту: <strong>{orders.length} шт.</strong></p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportOrders}
                    className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                  >
                    <Download className="w-4 h-4" />
                    <span>Завантажити orders.xml</span>
                  </button>
                </div>

                <div className="text-xs text-slate-600 border-t border-slate-100 pt-3 space-y-1">
                  <p className="font-semibold text-slate-800">Як відкрити цей файл в УкрСклад:</p>
                  <p>1. В «УкрСклад» виберіть пункт меню <strong>«Сервіс ➔ Імпорт документів ➔ Замовлення з інтернет-магазину»</strong>.</p>
                  <p>2. Вкажіть завантажений файл <code>orders_ukrsklad_...xml</code> ➔ Усі рахунки та накладні сформуються автоматично!</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: API & DIRECT MODULE SETTINGS */}
          {activeTab === 'api' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-xs sm:text-sm text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">Параметри для модуля «Синхронізація з Інтернет-магазином» в УкрСклад:</p>
                <p>Введіть ці дані у вікні налаштувань модуля УкрСклад на вашому ноутбуці для автоматичного прямого зв'язку.</p>
              </div>

              <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Адреса сайту для синхронізації (URL шлюзу):</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={syncUrl}
                      className="w-full text-xs font-mono bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(syncUrl, 'url')}
                      className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Копіювати</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Логін (Ім'я користувача):</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={syncLogin}
                        className="w-full text-xs font-mono bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(syncLogin, 'login')}
                        className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs cursor-pointer"
                        title="Копіювати"
                      >
                        {copiedKey === 'login' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Секретний API Ключ (Пароль):</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={syncApiKey}
                        className="w-full text-xs font-mono bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(syncApiKey, 'key')}
                        className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs cursor-pointer"
                        title="Копіювати"
                      >
                        {copiedKey === 'key' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STEP-BY-STEP INSTRUCTIONS */}
          {activeTab === 'instructions' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-3 text-xs sm:text-sm text-slate-700">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900">Відкрийте програму «УкрСклад» на ноутбуці в магазині</h5>
                    <p className="text-slate-600 mt-0.5">
                      У головному меню зверху виберіть <strong>«Сервіс» ➔ «Експорт/Імпорт» ➔ «Синхронізація з Інтернет-магазином»</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900">Введіть параметри сайту</h5>
                    <p className="text-slate-600 mt-0.5">
                      Скопіюйте з вкладки <em>«Параметри модуля УкрСклад»</em> URL сайту, логін та API-ключ.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900">Натисніть кнопку «Синхронізувати»</h5>
                    <p className="text-slate-600 mt-0.5">
                      Програма УкрСклад відправить усі ваші товари на сайт. На сайті автоматично з'являться всі назви, ціни, артикули та залишки.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Сумісно з версіями <strong>УкрСклад 6.x / 7.x / Pro</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Закрити вікно
          </button>
        </div>

      </div>
    </div>
  );
};
