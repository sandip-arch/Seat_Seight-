import React from 'react';
import { useStore } from '../../store/useStore.js';
import { getScoreColor } from '../../utils/math.js';
import { 
  Flame, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Eye, 
  Sparkles, 
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function BookMyShowSidebar() {
  const { 
    activeLayout, 
    selectedSeatId, 
    selectSeat, 
    showHeatmap, 
    toggleHeatmap, 
    showSidebar, 
    toggleSidebar,
    setToast 
  } = useStore();

  const screenOrientation = activeLayout.geometry?.screenOrientation || 'bottom';

  const handleHeatmapToggle = () => {
    toggleHeatmap();
    setToast({ 
      message: !showHeatmap ? 'Best Seats SMPTE/THX Heatmap Enabled (Shortcut: H)' : 'Heatmap Disabled', 
      type: 'info' 
    });
  };

  // Reusable Curved Screen Bar Component
  const ScreenBar = () => (
    <div className="w-full text-center py-2.5 my-1">
      <div className="relative py-1.5">
        <svg className="w-full h-7 overflow-visible" viewBox="0 0 260 20">
          <path
            d={screenOrientation === 'bottom' ? "M 10 16 Q 130 3 250 16" : "M 10 4 Q 130 17 250 4"}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="filter drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]"
          />
        </svg>
        <p className="text-[10px] font-bold text-sky-400 tracking-widest uppercase -mt-0.5 font-mono">
          All eyes this way please! (Screen)
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Floating Toggle Button on Sidebar Edge (Visible on desktop) */}
      <button
        onClick={toggleSidebar}
        title={showSidebar ? "Hide Seat Map (Shortcut: M)" : "Show Seat Map (Shortcut: M)"}
        className={`fixed top-24 z-40 p-2.5 rounded-l-xl glass-panel-elevated border-y border-l border-white/10 text-neutral-300 hover:text-white shadow-xl transition-all hidden md:flex items-center gap-1.5 active:scale-95 ${
          showSidebar ? 'right-[360px]' : 'right-0'
        }`}
      >
        {showSidebar ? (
          <>
            <ChevronRight className="w-4 h-4 text-bms-green" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Map</span>
          </>
        ) : (
          <>
            <ChevronLeft className="w-4 h-4 text-bms-green" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Map</span>
          </>
        )}
      </button>

      {/* DESKTOP DOCKED SIDEBAR (360px wide) */}
      <aside
        className={`fixed top-16 right-0 bottom-0 w-[360px] glass-panel-elevated border-l border-white/10 z-30 transition-transform duration-300 ease-in-out hidden md:flex flex-col shadow-2xl ${
          showSidebar ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-cinema-950/60">
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <span>Auditorium Seat Map</span>
              <span className="text-[10px] font-bold bg-bms-green/20 text-bms-green px-1.5 py-0.5 rounded border border-bms-green/30">
                BookMyShow
              </span>
            </h3>
            <p className="text-[11px] text-neutral-400 mt-0.5 truncate max-w-[200px]">
              {activeLayout.name}
            </p>
          </div>

          {/* Heatmap Toggle Button (Shortcut: H) */}
          <button
            onClick={handleHeatmapToggle}
            title="Toggle SMPTE/THX Viewing Ergonomics Heatmap (Shortcut: H)"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all active:scale-95 ${
              showHeatmap
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                : 'bg-cinema-850 border-neutral-700 text-neutral-400 hover:text-white'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${showHeatmap ? 'text-amber-400 fill-amber-400' : ''}`} />
            <span>Heatmap</span>
            <kbd className="px-1 py-0.2 text-[9px] bg-neutral-800 rounded font-mono text-neutral-400">H</kbd>
          </button>
        </div>

        {/* Heatmap Legend (when active) */}
        {showHeatmap && (
          <div className="px-4 py-2 bg-cinema-900/90 border-b border-neutral-800 flex items-center justify-between text-[10px] font-medium text-neutral-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Optimal Sweetspot
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Standard
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> High Tilt
            </span>
          </div>
        )}

        {/* Seat Map Scroll Container */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-4 space-y-5">
          
          {/* IF SCREEN IS AT TOP: Render Screen Bar at the top */}
          {screenOrientation === 'top' && <ScreenBar />}

          {/* Sections & Rows */}
          <div className="space-y-5">
            {activeLayout.sections?.map((section) => (
              <div key={section.name} className="space-y-2">
                {/* Section Header */}
                <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 border-b border-neutral-800/80 pb-1 px-1">
                  <span className="tracking-wider">{section.title}</span>
                  <span className="text-neutral-500">₹{section.price}</span>
                </div>

                {/* Rows in this section */}
                <div className="space-y-1.5 flex flex-col items-center">
                  {section.rows?.map((rowLetter) => {
                    const rowSeats = activeLayout.seats.filter(s => s.row === rowLetter);

                    return (
                      <div key={rowLetter} className="flex items-center gap-1.5 w-full justify-center">
                        {/* Row Label */}
                        <span className="w-4 text-right text-[10px] font-mono font-bold text-neutral-500 shrink-0">
                          {rowLetter}
                        </span>

                        {/* Seat buttons */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: activeLayout.totalCols }).map((_, colIdx) => {
                            const seat = rowSeats.find(s => s.gridCol === colIdx);

                            if (!seat) {
                              return (
                                <div key={colIdx} className="w-4 h-4 opacity-0 pointer-events-none" />
                              );
                            }

                            const isSelected = selectedSeatId === seat.id;
                            const isReserved = seat.status === 'reserved';
                            const scoreColor = getScoreColor(seat.ergonomics?.score || 70);

                            // Custom color when heatmap is enabled
                            const seatStyle = showHeatmap && !isReserved ? {
                              backgroundColor: `${scoreColor}25`,
                              borderColor: scoreColor,
                              color: scoreColor
                            } : {};

                            return (
                              <button
                                key={seat.id}
                                onClick={() => {
                                  if (!isReserved) selectSeat(seat.id);
                                }}
                                disabled={isReserved}
                                style={seatStyle}
                                title={`Row ${seat.row} • Seat ${seat.col} (${seat.section})\nScore: ${seat.ergonomics?.score} • ${seat.ergonomics?.badge}`}
                                className={`w-4 h-4 rounded-[3px] text-[8px] font-bold flex items-center justify-center transition-all ${
                                  isSelected
                                    ? '!bg-bms-green !border-white !text-white shadow-glow-green scale-125 z-10'
                                    : isReserved
                                    ? 'bg-neutral-800 border border-neutral-700/40 text-neutral-600 cursor-not-allowed'
                                    : showHeatmap
                                    ? 'border'
                                    : 'border border-bms-green/70 text-bms-green/90 hover:bg-bms-green hover:text-white bg-cinema-950/60'
                                }`}
                              >
                                {seat.col}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* IF SCREEN IS AT BOTTOM (BookMyShow standard): Render Screen Bar at the bottom */}
          {screenOrientation === 'bottom' && <ScreenBar />}

        </div>

        {/* Sidebar Footer: Legend */}
        <div className="p-3 bg-cinema-950/80 border-t border-neutral-800 flex items-center justify-around text-[10px] text-neutral-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-[3px] border border-bms-green bg-cinema-950" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-[3px] bg-bms-green shadow-glow-green" />
            <span>Selected POV</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-[3px] bg-neutral-800 border border-neutral-700" />
            <span>Reserved</span>
          </div>
        </div>
      </aside>

      {/* MOBILE COLLAPSIBLE BOTTOM DRAWER (< 768px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 glass-panel-elevated border-t border-white/10 rounded-t-2xl shadow-2xl max-h-[60vh] flex flex-col">
        {/* Drag Handle & Header */}
        <div 
          onClick={toggleSidebar}
          className="p-3 border-b border-neutral-800 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 rounded-full bg-neutral-600 mx-auto absolute top-1.5 left-1/2 -translate-x-1/2" />
            <h4 className="font-bold text-xs text-white flex items-center gap-1.5 mt-1">
              <span>Select Seat POV</span>
              <span className="text-[9px] font-bold bg-bms-green/20 text-bms-green px-1 rounded">
                BookMyShow
              </span>
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleHeatmapToggle(); }}
              className={`p-1 rounded text-xs font-bold flex items-center gap-1 ${
                showHeatmap ? 'text-amber-400' : 'text-neutral-400'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
            </button>
            {showSidebar ? <ChevronDown className="w-4 h-4 text-neutral-400" /> : <ChevronUp className="w-4 h-4 text-neutral-400" />}
          </div>
        </div>

        {/* Mobile Seat Grid (visible when showSidebar is true) */}
        {showSidebar && (
          <div className="flex-1 overflow-y-auto overflow-x-auto p-4 space-y-4">
            {screenOrientation === 'top' && <ScreenBar />}

            {activeLayout.sections?.map((section) => (
              <div key={section.name} className="space-y-1.5">
                <span className="text-[10px] font-bold text-neutral-400 block border-b border-neutral-800 pb-0.5">
                  {section.title}
                </span>

                <div className="flex flex-col items-center gap-1">
                  {section.rows?.map((rowLetter) => {
                    const rowSeats = activeLayout.seats.filter(s => s.row === rowLetter);

                    return (
                      <div key={rowLetter} className="flex items-center gap-1">
                        <span className="w-3 text-right text-[9px] font-mono font-bold text-neutral-500">
                          {rowLetter}
                        </span>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: activeLayout.totalCols }).map((_, colIdx) => {
                            const seat = rowSeats.find(s => s.gridCol === colIdx);
                            if (!seat) return <div key={colIdx} className="w-4 h-4 opacity-0" />;

                            const isSelected = selectedSeatId === seat.id;
                            const isReserved = seat.status === 'reserved';

                            return (
                              <button
                                key={seat.id}
                                onClick={() => !isReserved && selectSeat(seat.id)}
                                disabled={isReserved}
                                className={`w-4 h-4 rounded-[2px] text-[8px] font-bold flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-bms-green text-white scale-110'
                                    : isReserved
                                    ? 'bg-neutral-800 text-neutral-600'
                                    : 'border border-bms-green/70 text-bms-green'
                                }`}
                              >
                                {seat.col}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {screenOrientation === 'bottom' && <ScreenBar />}
          </div>
        )}
      </div>
    </>
  );
}
