import React from 'react';
import { useStore } from '../context/StoreContext';
import { Phone, MapPin, Clock, ShieldCheck, Truck, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  const { siteSettings, headerDesign, setActiveView } = useStore();

  return (
    <footer id="contacts-section" className="bg-slate-950 text-slate-400 border-t border-slate-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* Col 1: Store Brand & Story */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center bg-[#e5001e] text-white px-2.5 py-1.5 rounded-[6px] text-sm font-black tracking-tight shrink-0 shadow-xs">
                <span className="font-black text-white text-sm tracking-[0.06em] font-display leading-none transform scale-y-110 scale-x-105 inline-block uppercase select-none">
                  {headerDesign.logoBadge || 'ISKRA'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-white tracking-tight font-display leading-tight uppercase">
                  {headerDesign.logoText || 'МАГАЗИН'}
                </span>
                <span className="text-[10px] font-medium text-slate-400 tracking-tight leading-tight">
                  {headerDesign.logoSubtitle || 'Магазин надійних рішень'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Спеціалізований магазин сантехнічного та електромонтажного обладнання. Все необхідне для надійного монтажу, водопостачання, опалення та електромереж.
            </p>

            <div className="pt-2 text-xs space-y-1.5 text-slate-300">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Доставка по Україні перевізником «Нова Пошта»</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Офіційна заводська гарантія виробника</span>
              </div>
            </div>
          </div>

          {/* Col 2: Contacts & Schedule */}
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-bold text-white font-display uppercase tracking-wider mb-3">
              Контактна інформація
            </h4>

            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <b className="text-slate-200">Адреса магазину:</b><br />
                {siteSettings.city}, {siteSettings.address}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-red-500 shrink-0" />
              <div>
                <b className="text-slate-200">Телефон для замовлень та консультацій:</b><br />
                <a href={`tel:${siteSettings.phone.replace(/[^0-9+]/g, '')}`} className="text-red-400 hover:text-red-300 font-bold font-mono">
                  {siteSettings.phone}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <b className="text-slate-200">Графік роботи:</b><br />
                {siteSettings.workHours}
              </div>
            </div>
          </div>

          {/* Col 3: Map Box */}
          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 h-52 relative">
            <iframe
              title="Розташування магазину ISKRA"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2618.5!2d29.54!3d49.23!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zT3JhdGl2!5e0!3m2!1suk!2sua!4v1650000000000!5m2!1suk!2sua"
              className="w-full h-full border-0 filter grayscale contrast-125 opacity-80 hover:opacity-100 hover:filter-none transition-all duration-300"
              loading="lazy"
            />
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Магазин «ISKRA». Всі права захищені.</p>

          <button
            onClick={() => {
              setActiveView('admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 transition-colors"
            title="Вхід для персоналу"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Панель керування</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
