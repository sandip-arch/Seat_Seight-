import React, { useState, useRef } from 'react';
import { useStore } from '../../store/useStore.js';
import { generateMultiplexPreset, generateIMAXPreset, renderDemoScreenshot } from '../../utils/presets.js';
import { 
  UploadCloud, 
  Film, 
  Sparkles, 
  ShieldCheck, 
  Sliders, 
  Compass, 
  Layers, 
  ArrowRight,
  Maximize2,
  CheckCircle,
  FileImage
} from 'lucide-react';

export default function LandingView() {
  const { 
    setStep, 
    setActiveLayout, 
    setUploadedImage, 
    setCropRect, 
    setToast 
  } = useStore();

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (file) => {
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setToast({ message: 'Please upload a valid image file (PNG, JPG, or WebP).', type: 'error' });
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setToast({ message: 'Screenshot is too large (max 15MB).', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result;
      setUploadedImage(dataUrl);
      setCropRect(null); // will initialize in calibration
      setStep('calibrate');
      setToast({ message: 'Screenshot loaded! Now crop the seat chart area.', type: 'info' });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleLoadPreset = (presetType) => {
    const layout = presetType === 'imax' ? generateIMAXPreset() : generateMultiplexPreset();
    // Render demo screenshot for realistic calibration studio
    const demoImg = renderDemoScreenshot(layout);
    setUploadedImage(demoImg);
    setActiveLayout(layout);
    setStep('view3d');
    setToast({ message: `Loaded ${layout.name} directly into 3D view!`, type: 'success' });
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden">
      {/* Background cinematic glow lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-bms-green/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-10 right-10 w-[400px] h-[400px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16 flex-1 flex flex-col items-center text-center z-10">
        
        {/* Privacy Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cinema-850 border border-neutral-800 text-xs font-medium text-neutral-300 mb-6 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>100% Private Client-Side Vision</span>
          <span className="text-neutral-600">•</span>
          <span className="text-neutral-400">Zero backend or AI API dependencies</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-[1.12]">
          Never Book A <span className="text-rose-500 line-through decoration-neutral-500">Bad Seat</span> Again.
          <br />
          <span className="bg-gradient-to-r from-bms-green via-emerald-400 to-sky-400 bg-clip-text text-transparent">
            Preview the Real 3D POV
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-5 text-base sm:text-lg text-neutral-400 max-w-2xl leading-relaxed">
          Upload any 2D seating screenshot from <span className="text-neutral-200 font-semibold">BookMyShow</span>, <span className="text-neutral-200 font-semibold">District</span>, or <span className="text-neutral-200 font-semibold">PVR/INOX</span>. 
          Our browser-native vision pipeline instantly renders a true-to-scale 3D auditorium with SMPTE/THX viewing ergonomics.
        </p>

        {/* 3-Step Flow Pills */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full text-left">
          <div className="p-4 rounded-xl bg-cinema-900/80 border border-neutral-800/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-bms-green/20 text-bms-green flex items-center justify-center font-bold text-sm shrink-0 border border-bms-green/30">
              1
            </div>
            <div>
              <h4 className="font-semibold text-sm text-white">Upload Screenshot</h4>
              <p className="text-xs text-neutral-400 mt-0.5">Drag & drop your mobile booking chart screenshot.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cinema-900/80 border border-neutral-800/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm shrink-0 border border-sky-500/30">
              2
            </div>
            <div>
              <h4 className="font-semibold text-sm text-white">Calibrate Grid</h4>
              <p className="text-xs text-neutral-400 mt-0.5">Auto-detect seats, adjust stadium slope and format.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cinema-900/80 border border-neutral-800/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-bms-yellow/20 text-bms-yellow flex items-center justify-center font-bold text-sm shrink-0 border border-bms-yellow/30">
              3
            </div>
            <div>
              <h4 className="font-semibold text-sm text-white">Preview 3D POV</h4>
              <p className="text-xs text-neutral-400 mt-0.5">Sit in any seat, look around, and find the sweet spot.</p>
            </div>
          </div>
        </div>

        {/* Primary Action Section: Upload Area */}
        <div className="mt-10 w-full max-w-2xl">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(e.target.files?.[0])}
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
          />

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-8 sm:p-10 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
              isDragging
                ? 'border-bms-green bg-bms-green/10 shadow-glow-green scale-[1.01]'
                : 'border-neutral-700/80 hover:border-bms-green/60 bg-cinema-900/60 hover:bg-cinema-850/60'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-cinema-800 border border-neutral-700 flex items-center justify-center text-bms-green shadow-inner">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Drop your seat map screenshot here
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                or <span className="text-bms-green font-semibold underline underline-offset-4">browse files</span> from your phone or desktop
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
              <span>PNG, JPG, WEBP</span>
              <span>•</span>
              <span>Up to 15MB</span>
              <span>•</span>
              <span className="text-emerald-500">Private client-side processing</span>
            </div>
          </div>
        </div>

        {/* Quick Demo Presets Selector */}
        <div className="mt-12 w-full max-w-3xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-bms-yellow" />
              Try Sample BookMyShow Layouts
            </h3>
            <span className="text-xs text-neutral-500">No screenshot needed</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Preset 1: Standard Multiplex */}
            <div 
              onClick={() => handleLoadPreset('multiplex')}
              className="p-5 rounded-xl bg-cinema-850/80 border border-neutral-800 hover:border-bms-green/70 hover:bg-cinema-800 transition-all text-left cursor-pointer group shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-bms-green uppercase tracking-wider bg-bms-green/10 px-2 py-0.5 rounded border border-bms-green/20">
                    Cinema Scope 2.39:1
                  </span>
                  <h4 className="font-bold text-base text-white mt-2 group-hover:text-bms-green transition-colors">
                    Standard Multiplex (PVR / Inox)
                  </h4>
                </div>
                <div className="w-8 h-8 rounded-lg bg-cinema-800 flex items-center justify-center group-hover:bg-bms-green group-hover:text-white transition-all">
                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                </div>
              </div>

              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Classic Club, Prime Executive & Recliner tiers. 13 rows (A–N), twin side aisles, standard 18° stadium elevation.
              </p>

              <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 font-mono">
                <span>13 Rows • 230 Seats</span>
                <span className="text-emerald-400 font-semibold group-hover:underline">Launch 3D POV →</span>
              </div>
            </div>

            {/* Preset 2: Large IMAX Auditorium */}
            <div 
              onClick={() => handleLoadPreset('imax')}
              className="p-5 rounded-xl bg-cinema-850/80 border border-neutral-800 hover:border-sky-500/70 hover:bg-cinema-800 transition-all text-left cursor-pointer group shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                    Grand IMAX 1.43:1
                  </span>
                  <h4 className="font-bold text-base text-white mt-2 group-hover:text-sky-400 transition-colors">
                    Large IMAX Grand Auditorium
                  </h4>
                </div>
                <div className="w-8 h-8 rounded-lg bg-cinema-800 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-all">
                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                </div>
              </div>

              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Steep stadium seating (24° rake) with a 22-meter curved screen. 16 rows (A–P), VIP balcony, and wide FOV fill.
              </p>

              <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 font-mono">
                <span>16 Rows • 350 Seats</span>
                <span className="text-sky-400 font-semibold group-hover:underline">Launch 3D POV →</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-850 py-4 px-6 text-center text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto w-full">
        <span>Seat Sight © 2026 — Anatomical Cinema Seating Simulator</span>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <span>SMPTE EG-18 & THX Ergonomics Compliant</span>
          <span>•</span>
          <span className="text-neutral-400">Pure Client-Side Vision</span>
        </div>
      </footer>
    </div>
  );
}
