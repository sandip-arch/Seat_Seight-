import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useStore } from '../../store/useStore.js';
import CinemaScene from './CinemaScene.jsx';
import FirstPersonControls from './FirstPersonControls.jsx';
import QuickControlsBar from './QuickControlsBar.jsx';
import SeatInfoHUD from './SeatInfoHUD.jsx';
import BookMyShowSidebar from '../sidebar/BookMyShowSidebar.jsx';
import { 
  AlertTriangle, 
  RotateCcw, 
  Eye, 
  Sparkles, 
  X, 
  Compass,
  Layers,
  Share2
} from 'lucide-react';

// Error Boundary for WebGL & Canvas Crashes
class WebGLErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('WebGL 3D Context Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cinema-950 p-6 text-center">
          <div className="max-w-md p-6 rounded-2xl bg-cinema-900 border border-neutral-800 shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">3D Viewport Encountered an Error</h3>
            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
              Hardware acceleration or WebGL context was interrupted. Try reloading the viewport.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-bms-green hover:bg-bms-green-light text-white text-xs font-bold shadow-glow-green"
            >
              Reload Viewport
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Auditorium3D() {
  const { 
    activeLayout, 
    selectedSeatId, 
    selectSeat, 
    setToast 
  } = useStore();

  const selectedSeat = activeLayout.seats.find(s => s.id === selectedSeatId) || activeLayout.seats[0];

  // Canvas element reference for snapshot
  const canvasRef = useRef(null);

  // Onboarding Hint Tooltip (visible for 4 seconds or until dismissed)
  const [showOnboarding, setShowOnboarding] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOnboarding(false);
    }, 4500);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard navigation: Arrow Keys to hop to adjacent seats
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedSeat) return;

      const currentRow = selectedSeat.gridRow;
      const currentCol = selectedSeat.gridCol;

      let targetSeat = null;

      if (e.key === 'ArrowLeft') {
        // Move left in same row
        targetSeat = activeLayout.seats
          .filter(s => s.gridRow === currentRow && s.gridCol < currentCol && s.status !== 'reserved')
          .sort((a, b) => b.gridCol - a.gridCol)[0];
      } else if (e.key === 'ArrowRight') {
        // Move right in same row
        targetSeat = activeLayout.seats
          .filter(s => s.gridRow === currentRow && s.gridCol > currentCol && s.status !== 'reserved')
          .sort((a, b) => a.gridCol - b.gridCol)[0];
      } else if (e.key === 'ArrowUp') {
        // Move to row further back or forward depending on screen orientation
        const targetRow = activeLayout.geometry.screenOrientation === 'bottom' ? currentRow - 1 : currentRow + 1;
        targetSeat = activeLayout.seats
          .filter(s => s.gridRow === targetRow && s.status !== 'reserved')
          .sort((a, b) => Math.abs(a.gridCol - currentCol) - Math.abs(b.gridCol - currentCol))[0];
      } else if (e.key === 'ArrowDown') {
        const targetRow = activeLayout.geometry.screenOrientation === 'bottom' ? currentRow + 1 : currentRow - 1;
        targetSeat = activeLayout.seats
          .filter(s => s.gridRow === targetRow && s.status !== 'reserved')
          .sort((a, b) => Math.abs(a.gridCol - currentCol) - Math.abs(b.gridCol - currentCol))[0];
      }

      if (targetSeat) {
        selectSeat(targetSeat.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSeat, activeLayout, selectSeat]);

  // Snapshot Exporter with WhatsApp-ready corner branding badge
  const handleCaptureSnapshot = () => {
    if (!canvasRef.current) return;

    try {
      const glCanvas = canvasRef.current.querySelector('canvas');
      if (!glCanvas) return;

      // Composite onto a 2D canvas with watermark and badge
      const compCanvas = document.createElement('canvas');
      compCanvas.width = glCanvas.width;
      compCanvas.height = glCanvas.height;
      const ctx = compCanvas.getContext('2d');
      if (!ctx) return;

      // 1. Draw 3D screen buffer
      ctx.drawImage(glCanvas, 0, 0);

      // 2. Draw stylish dark glassmorphic badge in top-left
      const badgeW = 380;
      const badgeH = 100;
      const margin = 30;

      ctx.save();
      ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;

      // Rounded rectangle
      ctx.beginPath();
      ctx.roundRect(margin, margin, badgeW, badgeH, 16);
      ctx.fill();
      ctx.stroke();

      // Brand text
      ctx.fillStyle = '#1EA83C';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillText('SEAT SIGHT • 3D AUDITORIUM POV', margin + 20, margin + 32);

      // Seat info text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.fillText(`Row ${selectedSeat?.row} • Seat ${selectedSeat?.col}`, margin + 20, margin + 62);

      // Ergonomic score text
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 14px Inter, sans-serif';
      ctx.fillText(`Score: ${selectedSeat?.ergonomics?.score}/100 • ${selectedSeat?.ergonomics?.badge}`, margin + 20, margin + 84);
      ctx.restore();

      // 3. Export PNG download
      const dataUrl = compCanvas.toDataURL('image/png');
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataUrl);
      downloadAnchor.setAttribute('download', `SeatSight-${selectedSeat?.id}-POV.png`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setToast({ message: 'POV Snapshot downloaded! Ready to share with friends on WhatsApp.', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to capture snapshot.', type: 'error' });
    }
  };

  return (
    <WebGLErrorBoundary>
      <div 
        ref={canvasRef}
        className="fixed inset-0 w-screen h-screen overflow-hidden bg-cinema-950 select-none"
      >
        {/* Onboarding Guidance Tooltip (First 4.5 seconds) */}
        {showOnboarding && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 animate-pulse-subtle pointer-events-auto">
            <div className="px-4 py-2.5 rounded-2xl glass-panel-elevated border border-bms-green/40 text-neutral-200 text-xs font-semibold shadow-2xl flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-bms-green animate-ping" />
              <span>Drag to look around freely • Click any seat on the right to switch POV</span>
              <button
                onClick={() => setShowOnboarding(false)}
                className="text-neutral-400 hover:text-white p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 1. Top-Left Floating Seat Info & Ergonomics HUD */}
        <SeatInfoHUD />

        {/* 2. Right Docked BookMyShow Seat Selector & Heatmap */}
        <BookMyShowSidebar />

        {/* 3. Bottom Center Floating Quick Controls Bar */}
        <QuickControlsBar onCaptureSnapshot={handleCaptureSnapshot} />

        {/* 4. Full-Bleed Three.js Canvas */}
        <Canvas
          dpr={[1, 2]} // Performance DPR clamping for 60fps
          gl={{
            antialias: true,
            preserveDrawingBuffer: true, // Required for clean snapshot captures
            powerPreference: 'high-performance'
          }}
          camera={{
            fov: 58, // Natural human eye field of view
            near: 0.1,
            far: 120,
            position: [0, 2, 8]
          }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          <Suspense fallback={null}>
            <FirstPersonControls />
            <CinemaScene />
          </Suspense>
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  );
}
