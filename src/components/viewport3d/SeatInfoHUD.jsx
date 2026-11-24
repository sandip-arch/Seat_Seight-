import React from 'react';
import { useStore } from '../../store/useStore.js';
import { getScoreColor } from '../../utils/math.js';
import { 
  Sparkles, 
  Sliders, 
  ArrowLeft, 
  Eye, 
  Maximize2, 
  Info,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function SeatInfoHUD() {
  const { 
    activeLayout, 
    selectedSeatId, 
    setStep 
  } = useStore();

  const selectedSeat = activeLayout.seats.find(s => s.id === selectedSeatId) || activeLayout.seats[0];
  if (!selectedSeat) return null;

  const { ergonomics } = selectedSeat;
  const scoreColor = getScoreColor(ergonomics.score);

  return (
    <div className="fixed top-20 left-4 sm:left-6 z-30 max-w-[320px] sm:max-w-xs w-full pointer-events-auto">
      <div className="p-4 rounded-2xl glass-panel-elevated border border-white/10 shadow-2xl backdrop-blur-xl">
        
        {/* Top Header: Seat ID & Comfort Badge */}
        <div className="flex items-start justify-between gap-2 border-b border-neutral-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Selected Seat
              </span>
              <span className="text-[10px] font-semibold bg-cinema-800 text-neutral-300 px-1.5 py-0.5 rounded border border-neutral-700">
                {selectedSeat.section} • ₹{selectedSeat.price}
              </span>
            </div>
            <h3 className="text-xl font-black text-white mt-0.5 tracking-tight flex items-center gap-2">
              Row {selectedSeat.row} <span className="text-neutral-500">•</span> Seat {selectedSeat.col}
            </h3>
          </div>

          {/* Ergonomic Score Pill */}
          <div 
            style={{ borderColor: `${scoreColor}60`, backgroundColor: `${scoreColor}18` }}
            className="flex flex-col items-center justify-center px-2.5 py-1 rounded-xl border"
          >
            <span style={{ color: scoreColor }} className="text-base font-black font-mono leading-none">
              {ergonomics.score}
            </span>
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">
              Score
            </span>
          </div>
        </div>

        {/* Comfort Status Badge */}
        <div className="mt-3 flex items-center gap-2">
          <div 
            style={{ backgroundColor: scoreColor }} 
            className="w-2 h-2 rounded-full animate-ping shrink-0" 
          />
          <span 
            style={{ color: scoreColor }}
            className="text-xs font-bold tracking-wide"
          >
            {ergonomics.badge}
          </span>
        </div>

        {/* Live Ergonomic Metrics Grid */}
        <div className="mt-3 grid grid-cols-3 gap-2 bg-cinema-900/80 p-2.5 rounded-xl border border-neutral-800 text-center font-mono">
          <div>
            <span className="text-[10px] text-neutral-400 block font-sans">
              FOV Fill
            </span>
            <span className="text-xs font-bold text-sky-400">
              {ergonomics.fovFill}°
            </span>
          </div>

          <div>
            <span className="text-[10px] text-neutral-400 block font-sans">
              Neck Tilt
            </span>
            <span className={`text-xs font-bold ${ergonomics.verticalAngle > 20 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {ergonomics.verticalAngle > 0 ? `+${ergonomics.verticalAngle}°` : `${ergonomics.verticalAngle}°`}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-neutral-400 block font-sans">
              Off-Axis
            </span>
            <span className={`text-xs font-bold ${ergonomics.horizontalAngle > 25 ? 'text-amber-400' : 'text-neutral-200'}`}>
              {ergonomics.horizontalAngle}°
            </span>
          </div>
        </div>

        {/* Distance & Navigation Hint */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-800/60">
          <span>Screen Distance: <strong className="text-neutral-200 font-mono">{ergonomics.distanceToScreen}m</strong></span>
          <span className="text-[10px] text-neutral-500 font-mono">Use Arrow Keys ◀ ▶</span>
        </div>

        {/* Quick Actions */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => setStep('calibrate')}
            className="flex-1 py-1.5 px-2.5 rounded-lg bg-cinema-850 hover:bg-cinema-800 text-neutral-300 hover:text-white border border-neutral-800 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <Sliders className="w-3 h-3 text-sky-400" />
            <span>Edit Calibration</span>
          </button>

          <button
            onClick={() => setStep('landing')}
            className="flex-1 py-1.5 px-2.5 rounded-lg bg-cinema-850 hover:bg-cinema-800 text-neutral-300 hover:text-white border border-neutral-800 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <ArrowLeft className="w-3 h-3 text-neutral-400" />
            <span>New Layout</span>
          </button>
        </div>

      </div>
    </div>
  );
}
