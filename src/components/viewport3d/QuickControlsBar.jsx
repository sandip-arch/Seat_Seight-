import React, { useRef } from 'react';
import { useStore } from '../../store/useStore.js';
import { 
  RotateCcw, 
  Share2, 
  Play, 
  Pause, 
  Smartphone, 
  Upload, 
  Sliders, 
  Maximize, 
  Compass, 
  Film 
} from 'lucide-react';

export default function QuickControlsBar({ onCaptureSnapshot }) {
  const { 
    fov, 
    setFov, 
    activeLayout, 
    updateGeometry, 
    isPlayingScreenVideo, 
    toggleVideoPlay,
    setScreenVideoSource,
    gyroscopeActive,
    toggleGyroscope,
    setToast
  } = useStore();

  const fileInputRef = useRef(null);

  const handleAspectRatioChange = (format) => {
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

    setToast({ message: `Screen format updated to ${format}`, type: 'info' });
  };

  const handleLocalVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setToast({ message: 'Please select a valid video file.', type: 'error' });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setScreenVideoSource(objectUrl);
    setToast({ message: `Loaded video preview: "${file.name}"`, type: 'success' });
  };

  const handleRecenter = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
    setToast({ message: 'View recentered to screen center (Shortcut: R)', type: 'info' });
  };

  const handleGyroToggle = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permissionState = await DeviceOrientationEvent.requestPermission();
        if (permissionState === 'granted') {
          toggleGyroscope();
          setToast({ message: 'Gyroscope head tracking enabled!', type: 'success' });
        } else {
          setToast({ message: 'Gyroscope permission was denied.', type: 'error' });
        }
      } catch (err) {
        toggleGyroscope();
      }
    } else {
      toggleGyroscope();
      setToast({ 
        message: gyroscopeActive ? 'Gyroscope tracking disabled' : 'Gyroscope tracking enabled', 
        type: 'info' 
      });
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 sm:gap-3 p-2 rounded-2xl glass-panel-elevated border border-white/10 shadow-2xl max-w-[95vw] overflow-x-auto">
      
      {/* Recenter Button */}
      <button
        onClick={handleRecenter}
        title="Recenter Head View (Press R)"
        className="px-3 py-2 rounded-xl bg-cinema-850 hover:bg-cinema-800 text-neutral-300 hover:text-white border border-neutral-700/80 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm shrink-0"
      >
        <RotateCcw className="w-3.5 h-3.5 text-bms-yellow" />
        <span className="hidden sm:inline">Recenter</span>
        <kbd className="hidden md:inline px-1 py-0.2 text-[10px] bg-neutral-800 rounded font-mono text-neutral-400">R</kbd>
      </button>

      {/* Vertical Divider */}
      <div className="h-6 w-px bg-neutral-700/70 shrink-0" />

      {/* FOV Slider */}
      <div className="flex items-center gap-2 px-2 shrink-0">
        <span className="text-[11px] font-semibold text-neutral-400 hidden sm:inline">
          FOV:
        </span>
        <input
          type="range"
          min="45"
          max="75"
          value={fov}
          onChange={(e) => setFov(Number(e.target.value))}
          title={`Field of View: ${fov}°`}
          className="w-16 sm:w-24 accent-bms-green cursor-pointer"
        />
        <span className="text-xs font-mono font-bold text-white w-7 text-right">
          {fov}°
        </span>
      </div>

      {/* Vertical Divider */}
      <div className="h-6 w-px bg-neutral-700/70 shrink-0" />

      {/* Screen Format Switcher */}
      <div className="flex items-center bg-cinema-900/90 p-1 rounded-xl border border-neutral-800 shrink-0">
        {[
          { id: '16:9', label: '16:9' },
          { id: '2.39:1', label: '2.39:1' },
          { id: '1.43:1', label: 'IMAX' }
        ].map((fmt) => (
          <button
            key={fmt.id}
            onClick={() => handleAspectRatioChange(fmt.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              activeLayout.geometry.screenFormat === fmt.id
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {fmt.label}
          </button>
        ))}
      </div>

      {/* Vertical Divider */}
      <div className="h-6 w-px bg-neutral-700/70 shrink-0" />

      {/* Screen Playback Controls & Local Video Upload */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={toggleVideoPlay}
          title={isPlayingScreenVideo ? "Pause Cinema Preview" : "Play Cinema Preview"}
          className={`p-2 rounded-xl border transition-all ${
            isPlayingScreenVideo 
              ? 'bg-cinema-850 hover:bg-cinema-800 text-neutral-300 border-neutral-700' 
              : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
          }`}
        >
          {isPlayingScreenVideo ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleLocalVideoUpload}
          accept="video/mp4,video/webm"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Upload Local Video File for Screen"
          className="p-2 rounded-xl bg-cinema-850 hover:bg-cinema-800 text-neutral-400 hover:text-sky-400 border border-neutral-700 transition-colors"
        >
          <Film className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Gyroscope Mode Toggle (Mobile / Tablet) */}
      <button
        onClick={handleGyroToggle}
        title="Toggle Mobile Gyroscope Head Tracking"
        className={`p-2 rounded-xl border transition-all shrink-0 ${
          gyroscopeActive
            ? 'bg-bms-green/20 border-bms-green text-bms-green shadow-glow-green'
            : 'bg-cinema-850 hover:bg-cinema-800 text-neutral-400 hover:text-white border-neutral-700'
        }`}
      >
        <Smartphone className="w-3.5 h-3.5" />
      </button>

      {/* Share Snapshot Button */}
      <button
        onClick={onCaptureSnapshot}
        title="Export Clean Seat POV Snapshot (Ready for WhatsApp)"
        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-bms-green to-emerald-600 hover:from-bms-green-light hover:to-emerald-500 text-white text-xs font-bold shadow-glow-green flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Share POV</span>
      </button>

    </div>
  );
}
