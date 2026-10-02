import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Settings2, 
  Eye, 
  Boxes, 
  ArrowRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { parseProductCSV, CsvImportOptions, ParsedCsvResult } from '../utils/csvProductParser';
import { Product } from '../types/store';
import { formatUnit } from '../utils/unitFormatter';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (products: Product[], options: { overwriteExisting: boolean }) => void;
  existingProducts: Product[];
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingProducts
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [defaultStock, setDefaultStock] = useState<number>(10);
  const [setStockIfZero, setSetStockIfZero] = useState<boolean>(true);
  const [roundPriceToInteger, setRoundPriceToInteger] = useState<boolean>(true);
  const [overwriteExisting, setOverwriteExisting] = useState<boolean>(true);
  const [defaultCategory, setDefaultCategory] = useState<string>('Світлодіодне освітлення');
  const [parsedResult, setParsedResult] = useState<ParsedCsvResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'upload' | 'preview'>('upload');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      setRawText(text);
      reparse(text, {
        defaultStock,
        setStockIfZero,
        roundPriceToInteger,
        overrideStockWithDefault: false,
        defaultCategory
      });
      setActiveView('preview');
    };
    reader.readAsText(selectedFile, 'UTF-8');
    e.target.value = '';
  };

  const reparse = (text: string, opts: CsvImportOptions) => {
    if (!text) return;
    const res = parseProductCSV(text, opts);
    setParsedResult(res);
  };

  const handleStockOptionChange = (newStock: number, ifZero: boolean) => {
    setDefaultStock(newStock);
    setSetStockIfZero(ifZero);
    if (rawText) {
      reparse(rawText, {
        defaultStock: newStock,
        setStockIfZero: ifZero,
        roundPriceToInteger,
        overrideStockWithDefault: false,
        defaultCategory
      });
    }
  };

  const handleRoundPriceChange = (round: boolean) => {
    setRoundPriceToInteger(round);
    if (rawText) {
      reparse(rawText, {
        defaultStock,
        setStockIfZero,
        roundPriceToInteger: round,
        overrideStockWithDefault: false,
        defaultCategory
      });
    }
  };

  const handleExecuteImport = () => {
    if (!parsedResult || parsedResult.products.length === 0) return;
    setIsProcessing(true);
    try {
      onImport(parsedResult.products, { overwriteExisting });
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate matching stats
  const existingSkus = new Set(existingProducts.map(p => p.sku.toLowerCase().trim()).filter(Boolean));
  const newItemsCount = parsedResult 
    ? parsedResult.products.filter(p => !existingSkus.has(p.sku.toLowerCase().trim())).length 
    : 0;
  const updateItemsCount = parsedResult 
    ? parsedResult.products.length - newItemsCount 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Розумний імпорт товарів з CSV / Excel
              </h3>
              <p className="text-xs text-slate-500">
                Автоматичне розпізнавання колонок, артикулів, цін та гнучке налаштування залишків на складі
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* File Upload & Settings Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Upload Area */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                file 
                  ? 'border-emerald-400 bg-emerald-50/40 text-emerald-950' 
                  : 'border-slate-300 hover:border-orange-500 hover:bg-orange-50/30 text-slate-600'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,application/vnd.ms-excel"
                onChange={handleFileChange}
                className="hidden"
              />

              {file ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-sm text-emerald-900 truncate max-w-xs">{file.name}</span>
                  <span className="text-xs text-emerald-700 mt-1">
                    {(file.size / 1024).toFixed(1)} КБ • Натисніть, щоб обрати інший файл
                  </span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-2">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-sm text-slate-900">Натисніть або перетягніть CSV файл</span>
                  <span className="text-xs text-slate-400 mt-1">
                    Підтримуються файли 1С, УкрСклад, ETRON, Excel, Prom (.csv)
                  </span>
                </>
              )}
            </div>

            {/* Smart Stock Settings */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Boxes className="w-4 h-4 text-orange-600" />
                <span>Налаштування складських залишків:</span>
              </div>

              <div className="space-y-2 text-xs">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="stockMode"
                    checked={setStockIfZero}
                    onChange={() => handleStockOptionChange(defaultStock, true)}
                    className="mt-0.5 text-orange-600"
                  />
                  <div>
                    <span className="font-bold text-slate-800">
                      Встановити {defaultStock} шт., якщо у файлі 0 або немає
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Якщо в прайсі немає кількості або написано «В наявності» / «0», товар отримає {defaultStock} шт.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="stockMode"
                    checked={!setStockIfZero}
                    onChange={() => handleStockOptionChange(defaultStock, false)}
                    className="mt-0.5 text-orange-600"
                  />
                  <div>
                    <span className="font-bold text-slate-800">
                      Залишати точно як у файлі (навіть якщо 0 шт.)
                    </span>
                  </div>
                </label>
              </div>

              {/* Number of units input */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Кількість за замовчуванням:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    value={defaultStock}
                    onChange={(e) => handleStockOptionChange(Math.max(1, parseInt(e.target.value) || 1), setStockIfZero)}
                    className="w-20 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold font-mono text-center outline-none focus:border-orange-500"
                  />
                  <span className="text-xs text-slate-500 font-bold">шт.</span>
                </div>
              </div>
            </div>

            {/* Smart Price & Rounding Settings */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Налаштування цін та заокруглення:</span>
              </div>

              <div className="space-y-2 text-xs">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roundPriceToInteger}
                    onChange={(e) => handleRoundPriceChange(e.target.checked)}
                    className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800">
                      Заокруглювати ціни до цілих гривень (напр. 65.50 грн → 66 грн)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Автоматично видаляє копійки для красивого та зручного відображення на вітрині
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Автоматично використовується роздрібна ціна магазину (замість прихідної/собівартості)</span>
              </div>
            </div>

          </div>

          {/* Parsed Preview Table */}
          {parsedResult && parsedResult.products.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Попередній перегляд знайдених позицій:
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-black text-xs">
                    {parsedResult.products.length} товарів
                  </span>
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-3">
                  <span className="text-emerald-700 font-semibold">
                    ✨ Нових: <b>{newItemsCount}</b>
                  </span>
                  <span className="text-indigo-700 font-semibold">
                    🔄 Буде оновлено: <b>{updateItemsCount}</b>
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Артикул</th>
                      <th className="py-2.5 px-3">Назва товару</th>
                      <th className="py-2.5 px-3">Категорія</th>
                      <th className="py-2.5 px-3 text-center">Залишок</th>
                      <th className="py-2.5 px-3 text-right">Ціна</th>
                      <th className="py-2.5 px-3">Одиниця</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedResult.products.slice(0, 50).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-700">{item.sku}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900 max-w-xs truncate" title={item.name}>
                          {item.name}
                        </td>
                        <td className="py-2 px-3 text-slate-500 truncate max-w-[120px]">{item.category}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black ${
                            item.stock > 0 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.stock > 0 ? `✅ ${item.stock} шт` : '❌ 0 шт'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                          {item.price.toFixed(2)} грн
                        </td>
                        <td className="py-2 px-3 text-slate-500 font-mono">
                          {formatUnit(item.unit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedResult.products.length > 50 && (
                <p className="text-[11px] text-slate-400 text-center">
                  Показано перші 50 з {parsedResult.products.length} знайдених позицій
                </p>
              )}
            </div>
          )}

          {parsedResult && parsedResult.products.length === 0 && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>У вибраному файлі не знайдено валідних рядків з товарами. Перевірте формат CSV.</span>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
          >
            Скасувати
          </button>

          <div className="flex items-center gap-3">
            {parsedResult && parsedResult.products.length > 0 && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-orange-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Збереження...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Завантажити {parsedResult.products.length} товарів у каталог</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
