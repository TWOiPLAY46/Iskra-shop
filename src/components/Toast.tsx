import React from 'react';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast } = useStore();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-orange-400 shrink-0" />
  };

  return (
    <div className="fixed top-5 right-5 z-[9999] max-w-md w-[calc(100vw-40px)] animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/60 shadow-2xl rounded-xl p-4 flex items-center gap-3">
        {icons[toast.type]}
        <div className="text-sm font-medium leading-snug flex-1">
          {toast.message}
        </div>
      </div>
    </div>
  );
};
