import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useStore } from './store/useStore.js';
import Header from './components/common/Header.jsx';
import LandingView from './components/landing/LandingView.jsx';
import CalibrationStudio from './components/calibration/CalibrationStudio.jsx';
import SavedTheatresDrawer from './components/common/SavedTheatresDrawer.jsx';
import Toast from './components/common/Toast.jsx';
import { Loader2 } from 'lucide-react';

// Code-split 3D Auditorium via React.lazy for instant initial page load
const Auditorium3D = lazy(() => import('./components/viewport3d/Auditorium3D.jsx'));

function Loading3DFallback() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cinema-950 text-white">
      <div className="w-16 h-16 rounded-2xl bg-cinema-900 border border-bms-green/40 flex items-center justify-center shadow-glow-green mb-4">
        <Loader2 className="w-8 h-8 text-bms-green animate-spin" />
      </div>
      <h3 className="text-lg font-bold text-white tracking-wide">
        Generating 3D Auditorium...
      </h3>
      <p className="text-xs text-neutral-400 mt-1 font-mono">
        Calculating stadium tier elevations and SMPTE ergonomics
      </p>
    </div>
  );
}

export default function App() {
  const { 
    currentStep, 
    toggleSidebar, 
    toggleHeatmap 
  } = useStore();

  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'm' || e.key === 'M') {
        toggleSidebar();
      } else if (e.key === 'h' || e.key === 'H') {
        toggleHeatmap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, toggleHeatmap]);

  return (
    <div className="min-h-screen bg-cinema-950 text-neutral-100 flex flex-col relative selection:bg-bms-green selection:text-white">
      {/* Header (hidden in full 3D mode for maximum immersive POV view, or can show with back button) */}
      {currentStep !== 'view3d' && (
        <Header onOpenSavedDrawer={() => setIsSavedDrawerOpen(true)} />
      )}

      {/* Main Flow Content */}
      <main className="flex-1">
        {currentStep === 'landing' && <LandingView />}
        {currentStep === 'calibrate' && <CalibrationStudio />}
        {currentStep === 'view3d' && (
          <Suspense fallback={<Loading3DFallback />}>
            <Auditorium3D />
          </Suspense>
        )}
      </main>

      {/* Saved Theatres Drawer */}
      <SavedTheatresDrawer 
        isOpen={isSavedDrawerOpen} 
        onClose={() => setIsSavedDrawerOpen(false)} 
      />

      {/* Global Toast Notifications */}
      <Toast />
    </div>
  );
}
