import React, { useState } from 'react';
import { 
  CreditCard, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  RotateCcw, 
  AlertCircle, 
  X, 
  Copy,
  ExternalLink,
  Building2,
  Phone
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { createMonobankInvoice } from '../services/paymentService';

interface OnlinePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  customerName: string;
  customerPhone: string;
  gateway?: 'monobank' | 'wayforpay' | 'liqpay' | 'manual';
  monobankToken?: string;
  onPaymentSuccess?: (details: {
    transactionId: string;
    provider: string;
    paidAt: string;
    cardMask?: string;
  }) => void;
}

export const OnlinePaymentModal: React.FC<OnlinePaymentModalProps> = ({
  isOpen,
  onClose,
  orderId,
  amount,
  customerName,
  customerPhone,
  gateway = 'monobank',
  monobankToken,
  onPaymentSuccess
}) => {
  const { siteSettings, showToast, editOrder, orders } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reportedTransfer, setReportedTransfer] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOrder = orders.find(o => o.id === orderId);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    showToast(`${label} скопійовано в буфер!`, 'success');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Handle Apple Pay / Google Pay / Monobank Invoice
  const handleAcquiringPay = async (provider: 'apple_pay' | 'google_pay' | 'monobank') => {
    setErrorMsg(null);
    setIsProcessing(true);

    const activeToken = monobankToken || siteSettings.monobankToken;

    if (activeToken && activeToken.trim().length > 10) {
      setProcessingStep('Створення офіційного інвойсу Monobank / Apple Pay...');
      try {
        const res = await createMonobankInvoice(
          activeToken,
          orderId,
          amount,
          customerName,
          customerPhone,
          currentOrder?.items?.map(it => ({ name: it.name, qty: it.qty, price: it.price })) || [
            { name: `Замовлення №${orderId}`, qty: 1, price: amount }
          ],
          window.location.origin
        );

        if (res.success && res.pageUrl) {
          setProcessingStep('Перенаправлення на сторінку банку...');
          window.location.href = res.pageUrl;
          return;
        } else {
          setErrorMsg(res.error || 'Не вдалося створити платіжну сесію. Будь ласка, скористайтеся реквізитами.');
        }
      } catch (err) {
        setErrorMsg('Помилка з’єднання з платіжним шлюзом.');
      } finally {
        setIsProcessing(false);
        setProcessingStep('');
      }
    } else {
      // If direct acquiring token is not yet configured in admin settings
      setIsProcessing(false);
      setErrorMsg(
        'Прямий онлайн-еквайринг Apple Pay / Google Pay очікує підключення API-токена в налаштуваннях магазину. Будь ласка, скористайтеся оплатою за офіційними реквізитами IBAN нижче.'
      );
    }
  };

  // Handle manual transfer confirmation report by buyer
  const handleNotifyTransfer = () => {
    editOrder(orderId, {
      notes: `${currentOrder?.notes ? currentOrder.notes + ' · ' : ''}Клієнт повідомив про переказ коштів (${amount.toFixed(2)} грн)`
    });
    setReportedTransfer(true);
    showToast('Повідомлення надіслано! Менеджер перевірить зарахування та підтвердить замовлення.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight text-white">
                  Оплата замовлення ISKRA
                </h3>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold">
                  Безпечний платіж
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Замовлення №{orderId} · Статус: <b>Очікує оплати</b>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sum bar */}
        <div className="bg-emerald-50/80 px-5 py-3 border-b border-emerald-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-900">
            Сума до сплати:
          </span>
          <span className="text-lg font-black text-emerald-700 tabular-nums">
            {amount.toFixed(2)} грн
          </span>
        </div>

        {/* Body content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Quick Pay Buttons (Apple Pay & Google Pay) */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-700">Швидка онлайн-оплата:</div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleAcquiringPay('apple_pay')}
                className="py-3 px-3 bg-black hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-97 cursor-pointer disabled:opacity-50"
              >
                <span className="text-sm font-semibold tracking-tight"> Pay</span>
                <span className="text-[10px] text-slate-300 font-medium">в 1 клік</span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleAcquiringPay('google_pay')}
                className="py-3 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-97 cursor-pointer disabled:opacity-50"
              >
                <span className="text-sm font-bold tracking-tight">G Pay</span>
                <span className="text-[10px] text-slate-500 font-medium">в 1 клік</span>
              </button>
            </div>
          </div>

          {/* Processing status */}
          {isProcessing && (
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-center gap-2.5 animate-in fade-in">
              <RotateCcw className="w-4 h-4 animate-spin text-sky-600 shrink-0" />
              <span className="font-semibold">{processingStep}</span>
            </div>
          )}

          {/* Error / Notice Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Official Bank Requisites for manual transfer */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-600" />
                <span>Офіційні реквізити для оплати (IBAN):</span>
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 text-[11px]">Одержувач:</span>
                <span className="font-bold text-slate-900 text-right">{siteSettings.companyName || 'ТОВ «ІСКРА ЕЛЕКТРОТЕХНІКА»'}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 text-[11px]">Код ЄДРПОУ:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-900">{siteSettings.companyEdrpou || '43928174'}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(siteSettings.companyEdrpou || '43928174', 'ЄДРПОУ')}
                    className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                    title="Скопіювати ЄДРПОУ"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 text-[11px]">Рахунок IBAN:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(siteSettings.companyIban || 'UA213052990000026007894561230', 'IBAN')}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3 text-slate-500" />
                    <span>{copiedKey === 'IBAN' ? 'Скопійовано!' : 'Скопіювати IBAN'}</span>
                  </button>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200 font-mono text-[11px] font-bold text-slate-900 select-all break-all">
                  {siteSettings.companyIban || 'UA213052990000026007894561230'}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 text-[11px]">Банк:</span>
                <span className="font-medium text-slate-800 text-right">{siteSettings.companyBank || 'АТ КБ «ПриватБанк»'}</span>
              </div>

              <div className="space-y-1 pt-1 border-t border-slate-200">
                <span className="text-slate-500 text-[11px]">Призначення платежу:</span>
                <div className="p-2 bg-emerald-50/70 border border-emerald-200 rounded-lg text-[11px] font-semibold text-emerald-950 flex items-center justify-between gap-2">
                  <span>Оплата замовлення №{orderId} ({customerName || 'Покупець'})</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`Оплата замовлення №${orderId}`, 'Призначення')}
                    className="p-1 hover:bg-emerald-100 rounded text-emerald-800 cursor-pointer shrink-0"
                    title="Скопіювати призначення"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Buyer Report Transfer Button */}
            {reportedTransfer ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Дякуємо! Повідомлення збережено. Менеджер перевірить зарахування та підтвердить замовлення.</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleNotifyTransfer}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Я здійснив оплату (Повідомити менеджера)</span>
              </button>
            )}
          </div>

          {/* Manager Contact Assistance */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>Маєте запитання щодо оплати?</span>
            <a 
              href={`tel:${siteSettings.phone.replace(/\D/g, '')}`} 
              className="text-red-600 font-bold hover:underline flex items-center gap-1"
            >
              <Phone className="w-3 h-3" />
              <span>{siteSettings.phone}</span>
            </a>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Закрити вікно
          </button>

        </div>

      </div>
    </div>
  );
};

