import React, { useRef } from 'react';
import { useStore } from '../../store/useStore.js';
import { X, Trash2, Download, Upload, BookmarkCheck, Calendar, Film } from 'lucide-react';

export default function SavedTheatresDrawer({ isOpen, onClose }) {
  const { savedLayouts, activeLayout, setActiveLayout, deleteSavedLayout, importLayout, setStep } = useStore();
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleExport = (layout) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(layout, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${layout.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-layout.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result);
        importLayout(json);
        onClose();
      } catch (err) {
        alert('Invalid JSON layout file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-cinema-900 border-l border-neutral-800 h-full flex flex-col z-10 shadow-2xl">
        {/* Drawer Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-bms-yellow" />
            <h3 className="font-bold text-base text-white">Saved Theatres Library</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-cinema-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <p className="text-xs text-neutral-400">
            Stored in your browser's <code className="text-neutral-300">localStorage</code>. Export or load your favorite theatre configurations instantly.
          </p>

          <div className="space-y-2.5 pt-1">
            {savedLayouts.map((layout) => {
              const isActive = activeLayout.id === layout.id;

              return (
                <div 
                  key={layout.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isActive 
                      ? 'bg-cinema-800/90 border-bms-green/60 shadow-glow-green/20'
                      : 'bg-cinema-850/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-sm text-white flex items-center gap-1.5">
                        {layout.name}
                        {isActive && (
                          <span className="text-[10px] font-bold text-bms-green bg-bms-green/10 px-1.5 py-0.5 rounded border border-bms-green/30">
                            Active
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {layout.theatreType?.toUpperCase() || 'CINEMA'} • {layout.totalRows} Rows • {layout.seats?.length} Seats • {layout.geometry?.screenFormat}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleExport(layout)}
                        title="Export JSON"
                        className="p-1.5 rounded hover:bg-cinema-700 text-neutral-400 hover:text-sky-400 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteSavedLayout(layout.id)}
                        title="Delete"
                        className="p-1.5 rounded hover:bg-cinema-700 text-neutral-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-neutral-800/60">
                    <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(layout.createdAt || Date.now()).toLocaleDateString()}
                    </span>

                    <button
                      onClick={() => {
                        setActiveLayout(layout);
                        setStep('view3d');
                        onClose();
                      }}
                      className="px-3 py-1 rounded bg-bms-green/20 hover:bg-bms-green text-bms-green hover:text-white border border-bms-green/40 hover:border-transparent text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <Film className="w-3 h-3" />
                      Load 3D View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Import Footer */}
        <div className="p-4 border-t border-neutral-800 bg-cinema-950/60 flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-4 rounded-xl border border-neutral-700 hover:border-neutral-500 bg-cinema-850 hover:bg-cinema-800 text-xs font-semibold text-neutral-200 flex items-center justify-center gap-2 transition-all"
          >
            <Upload className="w-4 h-4 text-sky-400" />
            Import Layout (.JSON)
          </button>
        </div>
      </div>
    </div>
  );
}
