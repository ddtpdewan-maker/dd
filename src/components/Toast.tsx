import React from 'react';
import { CheckCircle2, AlertCircle, Info, X, Stamp } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'urgent' | 'info';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-start gap-3 transition-all transform animate-in slide-in-from-bottom duration-200 ${
            t.type === 'urgent'
              ? 'bg-red-900 text-white border-red-700 shadow-red-900/30'
              : t.type === 'success'
              ? 'bg-slate-900 text-white border-slate-800 shadow-slate-900/40'
              : 'bg-blue-900 text-white border-blue-800 shadow-blue-900/30'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {t.type === 'urgent' ? (
              <AlertCircle className="w-5 h-5 text-red-400" />
            ) : t.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Stamp className="w-5 h-5 text-blue-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h5 className="font-bold text-xs">{t.title}</h5>
            <p className="text-xs opacity-90 leading-relaxed mt-0.5">{t.message}</p>
          </div>

          <button
            onClick={() => onDismiss(t.id)}
            className="p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-white/10 transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
