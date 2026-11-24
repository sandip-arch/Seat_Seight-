import React, { useEffect } from 'react';
import { useStore } from '../../store/useStore.js';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toast, clearToast } = useStore();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      clearToast();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 max-w-sm animate-bounce-in">
      <div className={`p-4 rounded-xl border shadow-xl flex items-start gap-3 backdrop-blur-md ${
        toast.type === 'success' 
          ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200 shadow-emerald-950/50'
          : toast.type === 'error'
          ? 'bg-rose-950/90 border-rose-800 text-rose-200 shadow-rose-950/50'
          : 'bg-cinema-850/90 border-neutral-700 text-neutral-200 shadow-black/50'
      }`}>
        <div className="mt-0.5">
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
        </div>
        <div className="flex-1 text-xs leading-relaxed font-medium">
          {toast.message}
        </div>
        <button
          onClick={clearToast}
          className="text-neutral-400 hover:text-white p-0.5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
