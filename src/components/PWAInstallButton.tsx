import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, Share2, PlusSquare, X } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'button' | 'badge';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  className = '',
  variant = 'button' 
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running in installed standalone mode, do not show install button
  if (isInstalled) {
    return null;
  }

  // If on Android / Desktop Chrome with beforeinstallprompt ready:
  if (isInstallable) {
    if (variant === 'header') {
      return (
        <button
          type="button"
          onClick={install}
          className={`flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer ${className}`}
          title="Встановити додаток ISKRA на головний екран"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Додаток ISKRA</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={install}
        className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer ${className}`}
      >
        <Download className="w-4 h-4" />
        <span>Встановити як додаток</span>
      </button>
    );
  }

  // iOS Safari flow (iOS doesn't fire beforeinstallprompt event, guide user via Share -> Add to Home Screen)
  if (isIOS) {
    return (
      <>
        {variant === 'header' ? (
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer ${className}`}
            title="Встановити на iPhone"
          >
            <Smartphone className="w-3.5 h-3.5 text-orange-400" />
            <span>Додаток для iPhone</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            className={`flex items-center gap-2 px-3.5 py-2 border border-slate-300 hover:border-orange-500 bg-white hover:bg-orange-50/30 text-slate-800 text-xs font-bold rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer ${className}`}
          >
            <Smartphone className="w-4 h-4 text-orange-600" />
            <span>Додати на екран iPhone</span>
          </button>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 relative text-slate-900">
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Закрити"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center p-2 shadow-md">
                  <img src="/favicon.svg" alt="ISKRA" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-base font-display">Встановлення на iPhone / iPad</h3>
                  <p className="text-xs text-slate-500">Додаток ISKRA на головному екрані</p>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs leading-relaxed text-slate-700">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <p>
                    Натисніть кнопку <strong>«Поділитися»</strong> (
                    <Share2 className="w-3.5 h-3.5 inline text-blue-600 align-text-bottom mx-0.5" />
                    квадрат зі стрілкою вгору) внизу в браузері Safari.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <p>
                    Прокрутіть меню вниз та натисніть <strong>«На початковий екран»</strong> (
                    <PlusSquare className="w-3.5 h-3.5 inline text-slate-700 align-text-bottom mx-0.5" />
                    Add to Home Screen).
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <p>
                    Натисніть <strong>«Додати»</strong> у правому верхньому кутку — іконка ISKRA з'явиться на екрані вашого смартфона!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                Зрозуміло, дякую!
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback when browser hasn't fired beforeinstallprompt or desktop:
  return null;
};
