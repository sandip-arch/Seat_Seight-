import React from 'react';
import { useStore } from '../../store/useStore.js';
import { Eye, ShieldCheck, Bookmark, Sparkles, Film } from 'lucide-react';

export default function Header({ onOpenSavedDrawer }) {
  const { currentStep, setStep, activeLayout } = useStore();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-neutral-800/80 bg-cinema-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div 
          onClick={() => setStep('landing')}
          className="flex items-center gap-2.5 cursor-pointer group transition-transform active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 via-bms-green/30 to-sky-500/20 border border-bms-green/40 flex items-center justify-center shadow-glow-green group-hover:border-bms-green transition-all">
            <Eye className="w-5 h-5 text-bms-green group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                Seat Sight
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-bms-green/20 text-bms-green rounded border border-bms-green/30 tracking-wider">
                3D POV
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono -mt-0.5 hidden sm:block">
              Screen View Simulator
            </p>
          </div>
        </div>

        {/* Step Flow Indicator */}
        <div className="hidden md:flex items-center gap-2 bg-cinema-900/90 p-1.5 rounded-full border border-neutral-800">
          <button
            onClick={() => setStep('landing')}
            className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all ${
              currentStep === 'landing'
                ? 'bg-bms-green text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            1. Upload
          </button>
          <span className="text-neutral-600 text-xs">/</span>
          <button
            onClick={() => setStep('calibrate')}
            className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all ${
              currentStep === 'calibrate'
                ? 'bg-bms-green text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            2. Calibrate Grid
          </button>
          <span className="text-neutral-600 text-xs">/</span>
          <button
            onClick={() => setStep('view3d')}
            className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all ${
              currentStep === 'view3d'
                ? 'bg-bms-green text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            3. 3D POV Preview
          </button>
        </div>

        {/* Action Controls & Privacy Badge */}
        <div className="flex items-center gap-2.5">
          {/* Privacy badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Client-Side Private</span>
          </div>

          {/* Saved Theatres Drawer Button */}
          <button
            onClick={onOpenSavedDrawer}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cinema-850 hover:bg-cinema-800 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-300 hover:text-white transition-all active:scale-95 shadow-sm"
          >
            <Bookmark className="w-3.5 h-3.5 text-bms-yellow" />
            <span className="hidden sm:inline">Saved Theatres</span>
          </button>

          {/* Quick jump to 3D if in other views */}
          {currentStep !== 'view3d' && (
            <button
              onClick={() => setStep('view3d')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bms-green hover:bg-bms-green-light text-white text-xs font-semibold shadow-glow-green transition-all active:scale-95"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Launch 3D</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
