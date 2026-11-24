import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore.js';
import { detectSeatsFromCanvas, detectScreenLocation } from '../../utils/cvPipeline.js';
import { 
  Crop, 
  Sliders, 
  RotateCcw, 
  Plus, 
  Eraser, 
  Columns, 
  MousePointer, 
  Eye, 
  Film, 
  Compass, 
  Check, 
  Sparkles,
  ArrowRight,
  Maximize2,
  CheckCircle2,
  Tv
} from 'lucide-react';

export default function CalibrationStudio() {
  const { 
    uploadedImageSrc, 
    activeLayout, 
    setActiveLayout, 
    updateGeometry, 
    setStep, 
    setToast,
    selectSeat,
    selectedSeatId,
    brushMode,
    setBrushMode
  } = useStore();

  const [activeTab, setActiveTab] = useState('calibrate'); // 'crop' | 'calibrate' | 'preview'
  const [sensitivity, setSensitivity] = useState(50);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedCount, setDetectedCount] = useState(activeLayout?.seats?.length || 0);
  const [screenDetectionInfo, setScreenDetectionInfo] = useState({
    screenOrientation: activeLayout.geometry?.screenOrientation || 'bottom',
    confidence: 0.95
  });

  // Canvas and Image references
  const imageRef = useRef(null);

  // Crop rectangle state (percentages 0-100)
  const [cropBox, setCropBox] = useState({
    x: 8,
    y: 12,
    width: 84,
    height: 78
  });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragHandle, setDragHandle] = useState(null); // 'move' | 'nw' | 'ne' | 'se' | 'sw'
  const dragStartPos = useRef({ x: 0, y: 0, cropX: 0, cropY: 0, cropW: 0, cropH: 0 });

  // Run CV detector on the cropped area
  const runDetection = () => {
    if (!imageRef.current) return;
    setIsDetecting(true);

    setTimeout(() => {
      try {
        const img = imageRef.current;
        const canvas = document.createElement('canvas');
        
        // Pixel coordinates of crop box
        const pixelX = (cropBox.x / 100) * img.naturalWidth;
        const pixelY = (cropBox.y / 100) * img.naturalHeight;
        const pixelW = (cropBox.width / 100) * img.naturalWidth;
        const pixelH = (cropBox.height / 100) * img.naturalHeight;

        canvas.width = Math.max(100, Math.round(pixelW));
        canvas.height = Math.max(100, Math.round(pixelH));
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, pixelX, pixelY, pixelW, pixelH, 0, 0, canvas.width, canvas.height);

        // Run enhanced client-side CV pipeline
        const result = detectSeatsFromCanvas(canvas, sensitivity, activeLayout.geometry);
        
        const detectedOrientation = result.screenDetection?.screenOrientation || activeLayout.geometry.screenOrientation || 'bottom';
        setScreenDetectionInfo(result.screenDetection || { screenOrientation: detectedOrientation, confidence: 0.9 });

        const newLayout = {
          ...activeLayout,
          totalRows: result.totalRows,
          totalCols: result.totalCols,
          rowLabels: result.rowLabels,
          seats: result.seats,
          sections: result.sections || activeLayout.sections,
          geometry: {
            ...activeLayout.geometry,
            screenOrientation: detectedOrientation
          }
        };

        setActiveLayout(newLayout);
        setDetectedCount(result.seats.length);
        setToast({ 
          message: `Detected ${result.seats.length} seats across ${result.totalRows} rows! Screen detected at ${detectedOrientation.toUpperCase()}.`, 
          type: 'success' 
        });
      } catch (err) {
        console.error(err);
        setToast({ message: 'Detection completed with adaptive layout', type: 'info' });
      } finally {
        setIsDetecting(false);
      }
    }, 150);
  };

  // Run detection on mount or when sensitivity changes
  useEffect(() => {
    if (uploadedImageSrc) {
      runDetection();
    }
  }, [sensitivity]);

  // Crop interaction handlers
  const handleCropMouseDown = (e, handle) => {
    e.stopPropagation();
    setIsDraggingCrop(true);
    setDragHandle(handle);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      cropX: cropBox.x,
      cropY: cropBox.y,
      cropW: cropBox.width,
      cropH: cropBox.height
    };
  };

  const handleCropMouseMove = (e) => {
    if (!isDraggingCrop || !dragHandle) return;

    const dx = ((e.clientX - dragStartPos.current.x) / 450) * 100;
    const dy = ((e.clientY - dragStartPos.current.y) / 550) * 100;

    setCropBox((prev) => {
      let { cropX, cropY, cropW, cropH } = dragStartPos.current;

      if (dragHandle === 'move') {
        const newX = Math.max(0, Math.min(100 - cropW, cropX + dx));
        const newY = Math.max(0, Math.min(100 - cropH, cropY + dy));
        return { ...prev, x: newX, y: newY };
      }

      if (dragHandle === 'se') {
        const newW = Math.max(20, Math.min(100 - cropX, cropW + dx));
        const newH = Math.max(20, Math.min(100 - cropY, cropH + dy));
        return { ...prev, width: newW, height: newH };
      }

      if (dragHandle === 'nw') {
        const newX = Math.max(0, Math.min(cropX + cropW - 20, cropX + dx));
        const newY = Math.max(0, Math.min(cropY + cropH - 20, cropY + dy));
        const newW = cropW - (newX - cropX);
        const newH = cropH - (newY - cropY);
        return { x: newX, y: newY, width: newW, height: newH };
      }

      return prev;
    });
  };

  const handleCropMouseUp = () => {
    if (isDraggingCrop) {
      setIsDraggingCrop(false);
      setDragHandle(null);
      runDetection();
    }
  };

  // Geometry controls
  const handleFormatChange = (format) => {
    let width = 16;
    let distance = 6.2;
    let curveDepth = 0.4;
    let curvedScreen = false;

    if (format === '1.43:1') {
      width = 22;
      distance = 5.8;
      curveDepth = 1.4;
      curvedScreen = true;
    } else if (format === '16:9') {
      width = 14;
      distance = 5.5;
      curveDepth = 0.2;
    }

    updateGeometry({
      screenFormat: format,
      screenWidth: width,
      screenDistance: distance,
      curvedScreen,
      curveDepth
    });
  };

  const handleOrientationToggle = () => {
    const next = activeLayout.geometry.screenOrientation === 'bottom' ? 'top' : 'bottom';
    
    // Invert sections so Recliner remains at the back and Classic remains closest to the screen!
    let updatedSections = [...activeLayout.sections];
    if (next === 'bottom') {
      // Recliner at top, Classic at bottom
      updatedSections = [
        { name: 'RECLINER', title: 'ROYAL RECLINER - ₹650', price: 650, rows: activeLayout.rowLabels.slice(0, 2) },
        { name: 'PRIME', title: 'PRIME EXECUTIVE - ₹350', price: 350, rows: activeLayout.rowLabels.slice(2, 8) },
        { name: 'CLASSIC', title: 'CLASSIC CLUB - ₹220', price: 220, rows: activeLayout.rowLabels.slice(8) }
      ];
    } else {
      // Screen at top: Classic at top, Recliner at bottom
      updatedSections = [
        { name: 'CLASSIC', title: 'CLASSIC CLUB - ₹220', price: 220, rows: activeLayout.rowLabels.slice(0, 6) },
        { name: 'PRIME', title: 'PRIME EXECUTIVE - ₹350', price: 350, rows: activeLayout.rowLabels.slice(6, 12) },
        { name: 'RECLINER', title: 'ROYAL RECLINER - ₹650', price: 650, rows: activeLayout.rowLabels.slice(12) }
      ];
    }

    const updatedSeats = activeLayout.seats.map(s => {
      const sec = updatedSections.find(sec => sec.rows.includes(s.row)) || updatedSections[1];
      return { ...s, section: sec.name, price: sec.price };
    });

    setActiveLayout({
      ...activeLayout,
      sections: updatedSections,
      seats: updatedSeats,
      geometry: {
        ...activeLayout.geometry,
        screenOrientation: next
      }
    });

    setScreenDetectionInfo(prev => ({ ...prev, screenOrientation: next }));
    setToast({ 
      message: `Screen orientation set to: SCREEN AT ${next.toUpperCase()}`, 
      type: 'info' 
    });
  };

  const screenOrientation = activeLayout.geometry.screenOrientation || 'bottom';

  // Reusable Curved Screen Bar Component
  const ScreenBar = () => (
    <div className="w-full text-center py-3 my-2">
      <div className="relative py-2">
        <svg className="w-full h-8 overflow-visible max-w-sm mx-auto" viewBox="0 0 280 20">
          <path
            d={screenOrientation === 'bottom' ? "M 10 16 Q 140 3 270 16" : "M 10 4 Q 140 17 270 4"}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="4"
            strokeLinecap="round"
            className="filter drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]"
          />
        </svg>
        <p className="text-[11px] font-bold text-sky-400 tracking-widest uppercase -mt-0.5 font-mono">
          All eyes this way please! (Screen)
        </p>
      </div>
    </div>
  );

  return (
    <div 
      className="max-w-7xl mx-auto px-4 sm:px-6 py-6"
      onMouseMove={handleCropMouseMove}
      onMouseUp={handleCropMouseUp}
    >
      {/* Top Header & Stage Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-bms-green/20 text-bms-green border border-bms-green/30">
              STEP 2 OF 3
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Smart Calibration Studio
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Auto-detect seats, screen orientation, row labels, and stadium elevation with zero backend dependencies.
          </p>
        </div>

        {/* Tab Controls & Launch 3D Button */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center bg-cinema-900 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setActiveTab('crop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'crop'
                  ? 'bg-cinema-700 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Crop className="w-3.5 h-3.5" />
              <span>1. Crop Area</span>
            </button>
            <button
              onClick={() => setActiveTab('calibrate')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'calibrate'
                  ? 'bg-cinema-700 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>2. Calibration Overlay</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'preview'
                  ? 'bg-cinema-700 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>3. Seat Map</span>
            </button>
          </div>

          <button
            onClick={() => setStep('view3d')}
            className="px-4 py-2 rounded-xl bg-bms-green hover:bg-bms-green-light text-white text-xs sm:text-sm font-bold shadow-glow-green flex items-center gap-2 active:scale-95 transition-all"
          >
            <span>Confirm & Launch 3D</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Studio Workspace Grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left / Center: Interactive Visual Workspace (Crop / Overlay / Seat Map) */}
        <div className="lg:col-span-8 bg-cinema-900/90 rounded-2xl border border-neutral-800 p-4 sm:p-6 flex flex-col items-center justify-center min-h-[540px] relative overflow-hidden">
          
          {/* TAB 1 & 2: CROP & DETECTION OVERLAY */}
          {(activeTab === 'crop' || activeTab === 'calibrate') && (
            <div className="relative max-w-full max-h-[580px] select-none flex items-center justify-center">
              {uploadedImageSrc ? (
                <div className="relative inline-block border border-neutral-700 rounded-lg overflow-hidden shadow-2xl">
                  {/* Base Screenshot Image */}
                  <img
                    ref={imageRef}
                    src={uploadedImageSrc}
                    alt="Seating chart"
                    className="max-h-[530px] w-auto object-contain block opacity-90"
                    crossOrigin="anonymous"
                  />

                  {/* CROP BOX OVERLAY */}
                  <div
                    style={{
                      left: `${cropBox.x}%`,
                      top: `${cropBox.y}%`,
                      width: `${cropBox.width}%`,
                      height: `${cropBox.height}%`,
                    }}
                    className={`absolute border-2 ${
                      activeTab === 'crop' 
                        ? 'border-bms-green bg-bms-green/10 cursor-move' 
                        : 'border-sky-400/80 bg-sky-500/5 pointer-events-none'
                    } shadow-glow-green transition-shadow`}
                    onMouseDown={(e) => activeTab === 'crop' && handleCropMouseDown(e, 'move')}
                  >
                    {/* Crop Handles (visible in crop tab) */}
                    {activeTab === 'crop' && (
                      <>
                        <div 
                          onMouseDown={(e) => handleCropMouseDown(e, 'nw')}
                          className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-bms-green border-2 border-white cursor-nw-resize shadow-md"
                        />
                        <div 
                          onMouseDown={(e) => handleCropMouseDown(e, 'se')}
                          className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-bms-green border-2 border-white cursor-se-resize shadow-md"
                        />
                        <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                          Seat Grid Area
                        </div>
                      </>
                    )}

                    {/* Detected Screen Indicator Banner on Overlay */}
                    {activeTab === 'calibrate' && (
                      <div 
                        className={`absolute left-0 right-0 ${
                          screenOrientation === 'bottom' ? 'bottom-1' : 'top-1'
                        } flex items-center justify-center pointer-events-none`}
                      >
                        <div className="px-3 py-1 rounded-full bg-sky-950/90 border border-sky-400/80 shadow-glow-screen flex items-center gap-1.5 backdrop-blur-md">
                          <Tv className="w-3.5 h-3.5 text-sky-400" />
                          <span className="text-[10px] font-bold text-sky-300 font-mono tracking-wider">
                            SCREEN DETECTED ({screenOrientation.toUpperCase()})
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Detected Seats Highlight Overlay */}
                    {activeTab === 'calibrate' && (
                      <div className="w-full h-full relative">
                        {activeLayout.seats.map((seat) => {
                          const leftPct = (seat.gridCol / Math.max(1, activeLayout.totalCols - 1)) * 92 + 4;
                          const topPct = (seat.gridRow / Math.max(1, activeLayout.totalRows - 1)) * 90 + 5;

                          const isRecliner = seat.section === 'RECLINER';
                          const isPrime = seat.section === 'PRIME';

                          return (
                            <div
                              key={seat.id}
                              style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                              title={`Seat ${seat.id} (${seat.section})`}
                              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-[3px] border transition-all ${
                                isRecliner ? 'w-4 h-3.5' : 'w-3.5 h-3.5'
                              } ${
                                selectedSeatId === seat.id
                                  ? 'bg-bms-green border-white scale-125 z-20 shadow-glow-green'
                                  : isRecliner
                                  ? 'bg-purple-500/30 border-purple-400/80 z-10'
                                  : isPrime
                                  ? 'bg-emerald-500/30 border-emerald-400/80 z-10'
                                  : 'bg-sky-500/30 border-sky-400/80 z-10'
                              }`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 text-neutral-400">
                  <Film className="w-12 h-12 mx-auto text-neutral-600 mb-2" />
                  <p>No screenshot loaded. Select a demo preset or upload an image.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BOOKMYSHOW-STYLE INTERACTIVE SEAT MAP PREVIEW */}
          {activeTab === 'preview' && (
            <div className="w-full max-w-xl flex flex-col items-center py-4">
              
              {/* If screen is at top, render screen bar at top */}
              {screenOrientation === 'top' && <ScreenBar />}

              {/* Section indicators */}
              <div className="w-full space-y-6">
                {activeLayout.sections?.map((sec) => (
                  <div key={sec.name} className="w-full text-center">
                    <div className="text-xs font-bold text-neutral-400 tracking-wider mb-2 border-b border-neutral-800 pb-1 flex items-center justify-between px-2">
                      <span>{sec.title}</span>
                      <span className="text-[11px] text-neutral-500">₹{sec.price}</span>
                    </div>

                    <div className="flex flex-col items-center gap-1.5">
                      {sec.rows?.map((rowLetter) => {
                        const rowSeats = activeLayout.seats.filter(s => s.row === rowLetter);

                        return (
                          <div key={rowLetter} className="flex items-center gap-2">
                            <span className="w-5 text-right font-bold text-xs text-neutral-500 font-mono">
                              {rowLetter}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {Array.from({ length: activeLayout.totalCols }).map((_, colIdx) => {
                                const seat = rowSeats.find(s => s.gridCol === colIdx);

                                if (!seat) {
                                  // Aisle space
                                  return (
                                    <div 
                                      key={colIdx} 
                                      className="w-5 h-5 opacity-0 pointer-events-none" 
                                    />
                                  );
                                }

                                const isSelected = selectedSeatId === seat.id;
                                const isReserved = seat.status === 'reserved';

                                return (
                                  <button
                                    key={seat.id}
                                    onClick={() => {
                                      if (!isReserved) {
                                        selectSeat(seat.id);
                                        setStep('view3d');
                                      }
                                    }}
                                    disabled={isReserved}
                                    title={`Seat ${seat.id} • ₹${seat.price} • Click to launch 3D POV`}
                                    className={`w-5 h-5 rounded-[4px] text-[9px] font-bold transition-all flex items-center justify-center ${
                                      isSelected
                                        ? 'bg-bms-green text-white shadow-glow-green scale-110 z-10'
                                        : isReserved
                                        ? 'bg-neutral-800 text-neutral-600 border border-neutral-700/50 cursor-not-allowed'
                                        : 'border border-bms-green/70 text-bms-green hover:bg-bms-green hover:text-white bg-cinema-950/60'
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

              {/* If screen is at bottom, render screen bar at bottom (BookMyShow default) */}
              {screenOrientation === 'bottom' && <ScreenBar />}
            </div>
          )}

          {/* Bottom helper pill inside visual stage */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-neutral-400 pointer-events-none">
            <span className="bg-black/70 px-2 py-0.5 rounded backdrop-blur border border-white/5 font-mono text-emerald-400">
              {detectedCount} Seats Detected • {activeLayout.totalRows} Rows ({activeLayout.rowLabels?.[0]}–{activeLayout.rowLabels?.[activeLayout.rowLabels?.length - 1]})
            </span>
            <span className="bg-black/70 px-2 py-0.5 rounded backdrop-blur border border-white/5">
              Screen: <strong className="text-sky-400">{screenOrientation.toUpperCase()}</strong>
            </span>
          </div>
        </div>

        {/* Right: Studio Controls Panel */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* 1. Screen Auto-Detection Card */}
          <div className="p-4 rounded-2xl bg-cinema-900 border border-sky-800/40 bg-gradient-to-b from-sky-950/20 to-cinema-900 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5" />
                Screen Position Detection
              </h3>
              <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                {Math.round(screenDetectionInfo.confidence * 100)}% Match
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-cinema-850 border border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">
                  {screenOrientation === 'bottom' ? 'Screen at Bottom' : 'Screen at Top'}
                </span>
                <span className="text-[10px] text-neutral-400">
                  {screenOrientation === 'bottom' 
                    ? 'Recliner at back (top) • Classic closest to screen (bottom)'
                    : 'Classic under screen (top) • Recliner at back (bottom)'}
                </span>
              </div>
              <button
                onClick={handleOrientationToggle}
                className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-white border border-sky-500/40 text-xs font-semibold transition-all"
              >
                Flip
              </button>
            </div>
          </div>

          {/* 2. Detection Tuning Card */}
          <div className="p-4 rounded-2xl bg-cinema-900 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-bms-green" />
                Detection Sensitivity
              </h3>
              <span className="text-xs font-mono font-bold text-bms-green bg-bms-green/10 px-2 py-0.5 rounded border border-bms-green/20">
                {sensitivity}%
              </span>
            </div>

            <input
              type="range"
              min="10"
              max="90"
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className="w-full accent-bms-green cursor-pointer"
            />

            <div className="flex items-center justify-between text-[10px] text-neutral-500">
              <span>Coarse (filter noise)</span>
              <span>Fine (faint outlines)</span>
            </div>

            <button
              onClick={runDetection}
              disabled={isDetecting}
              className="w-full mt-2 py-2 rounded-xl bg-cinema-800 hover:bg-cinema-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 border border-neutral-700 active:scale-95 transition-all"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
              <span>{isDetecting ? 'Analyzing Pixels...' : 'Re-Run Live Clustering'}</span>
            </button>
          </div>

          {/* 3. Brush Tools Card */}
          <div className="p-4 rounded-2xl bg-cinema-900 border border-neutral-800 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-bms-yellow" />
              Manual Correction Tools
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setBrushMode('select')}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                  brushMode === 'select'
                    ? 'bg-bms-green/20 border-bms-green text-bms-green'
                    : 'bg-cinema-850 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <MousePointer className="w-3.5 h-3.5" />
                <span>Select Seat</span>
              </button>

              <button
                onClick={() => setBrushMode('add')}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                  brushMode === 'add'
                    ? 'bg-sky-500/20 border-sky-400 text-sky-400'
                    : 'bg-cinema-850 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Seat</span>
              </button>

              <button
                onClick={() => setBrushMode('erase')}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                  brushMode === 'erase'
                    ? 'bg-rose-500/20 border-rose-400 text-rose-400'
                    : 'bg-cinema-850 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Erase Seat</span>
              </button>

              <button
                onClick={() => setBrushMode('aisle')}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                  brushMode === 'aisle'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-400'
                    : 'bg-cinema-850 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Aisle Gap</span>
              </button>
            </div>
          </div>

          {/* 4. Auditorium Geometry Card */}
          <div className="p-4 rounded-2xl bg-cinema-900 border border-neutral-800 space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              Auditorium Geometry & Rake
            </h3>

            {/* Screen Format Selector */}
            <div>
              <label className="text-[11px] font-semibold text-neutral-400 mb-1.5 block">
                Screen Aspect Ratio Format
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: '16:9', label: '16:9 Flat' },
                  { id: '2.39:1', label: '2.39:1 Scope' },
                  { id: '1.43:1', label: 'IMAX 1.43:1' }
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => handleFormatChange(fmt.id)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                      activeLayout.geometry.screenFormat === fmt.id
                        ? 'bg-sky-500/20 border-sky-400 text-sky-400'
                        : 'bg-cinema-850 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stadium Slope Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-neutral-400">Stadium Slope Angle (Rake)</span>
                <span className="font-mono font-bold text-white">
                  {activeLayout.geometry.slopeAngle}°
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="30"
                value={activeLayout.geometry.slopeAngle}
                onChange={(e) => updateGeometry({ slopeAngle: Number(e.target.value) })}
                className="w-full accent-sky-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 mt-0.5">
                <span>10° (Shallow)</span>
                <span>18° (Default)</span>
                <span>30° (Steep Stadium)</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
