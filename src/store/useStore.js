import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateMultiplexPreset, generateIMAXPreset } from '../utils/presets.js';
import { calculateSeatWorldPos, calculateErgonomics } from '../utils/math.js';

const initialMultiplex = generateMultiplexPreset();
// Default to a middle prime sweetspot seat like G-12 or H-10
const defaultSeat = initialMultiplex.seats.find(s => s.id === 'G-8') || initialMultiplex.seats[Math.floor(initialMultiplex.seats.length / 2)];

export const useStore = create(
  persist(
    (set, get) => ({
      // Navigation & Flow
      currentStep: 'landing', // 'landing' | 'calibrate' | 'view3d'
      setStep: (step) => set({ currentStep: step }),

      // Active Auditorium Layout
      activeLayout: initialMultiplex,
      setActiveLayout: (layout) => {
        // Find best default seat (center optimal or first available)
        const optimal = layout.seats.find(s => s.ergonomics?.rating === 'optimal' && s.status === 'available')
          || layout.seats.find(s => s.status === 'available')
          || layout.seats[0];

        set({
          activeLayout: layout,
          selectedSeatId: optimal ? optimal.id : null
        });
      },

      // Seat Selection
      selectedSeatId: defaultSeat ? defaultSeat.id : null,
      hoveredSeatId: null,
      selectSeat: (seatId) => set({ selectedSeatId: seatId }),
      setHoveredSeat: (seatId) => set({ hoveredSeatId: seatId }),

      // 3D Viewport Settings
      fov: 58,
      setFov: (fov) => set({ fov }),
      showHeatmap: false,
      toggleHeatmap: () => set((state) => ({ showHeatmap: !state.showHeatmap })),
      showSidebar: true,
      toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
      gyroscopeActive: false,
      toggleGyroscope: () => set((state) => ({ gyroscopeActive: !state.gyroscopeActive })),
      
      // Screen Video / Cinema Playback
      isPlayingScreenVideo: true,
      toggleVideoPlay: () => set((state) => ({ isPlayingScreenVideo: !state.isPlayingScreenVideo })),
      screenVideoSource: null, // local video URL if provided
      setScreenVideoSource: (src) => set({ screenVideoSource: src, isPlayingScreenVideo: true }),

      // Image Upload & Calibration Studio
      uploadedImageSrc: null,
      setUploadedImage: (src) => set({ uploadedImageSrc: src }),
      cropRect: null,
      setCropRect: (cropRect) => set({ cropRect }),
      detectionSensitivity: 50,
      setSensitivity: (sensitivity) => set({ detectionSensitivity: sensitivity }),
      brushMode: 'select', // 'select' | 'add' | 'erase' | 'aisle'
      setBrushMode: (mode) => set({ brushMode: mode }),

      // Saved Theatres in localStorage
      savedLayouts: [
        initialMultiplex,
        generateIMAXPreset()
      ],
      saveCurrentLayout: (name) => {
        const state = get();
        const current = state.activeLayout;
        const newLayout = {
          ...current,
          id: `theatre-${Date.now()}`,
          name: name || current.name,
          createdAt: new Date().toISOString()
        };
        const updated = [newLayout, ...state.savedLayouts.filter(l => l.id !== newLayout.id)];
        set({
          savedLayouts: updated,
          activeLayout: newLayout,
          toast: { message: `Theatre "${newLayout.name}" saved to library!`, type: 'success' }
        });
      },
      deleteSavedLayout: (id) => {
        set((state) => ({
          savedLayouts: state.savedLayouts.filter(l => l.id !== id),
          toast: { message: 'Layout removed from library', type: 'info' }
        }));
      },
      importLayout: (layoutData) => {
        try {
          if (!layoutData.seats || !layoutData.geometry) {
            throw new Error('Invalid layout file schema');
          }
          const imported = {
            ...layoutData,
            id: `imported-${Date.now()}`,
            name: layoutData.name || 'Imported Theatre'
          };
          set((state) => ({
            savedLayouts: [imported, ...state.savedLayouts],
            activeLayout: imported,
            selectedSeatId: imported.seats[0]?.id || null,
            currentStep: 'view3d',
            toast: { message: `Successfully imported "${imported.name}"!`, type: 'success' }
          }));
        } catch (err) {
          set({ toast: { message: `Import failed: ${err.message}`, type: 'error' } });
        }
      },

      // Update Auditorium Geometry and dynamically recalculate all seats
      updateGeometry: (geometryUpdates) => {
        const state = get();
        const current = state.activeLayout;
        const updatedGeometry = { ...current.geometry, ...geometryUpdates };

        const updatedSeats = current.seats.map((seat) => {
          const worldPos = calculateSeatWorldPos(
            seat.gridRow,
            seat.gridCol,
            current.totalRows,
            current.totalCols,
            updatedGeometry
          );
          const ergonomics = calculateErgonomics(worldPos, updatedGeometry);
          return {
            ...seat,
            worldPos,
            ergonomics
          };
        });

        set({
          activeLayout: {
            ...current,
            geometry: updatedGeometry,
            seats: updatedSeats
          }
        });
      },

      // Live Calibration Studio seat brush editing
      addSeatAtGrid: (gridRow, gridCol) => {
        const state = get();
        const layout = state.activeLayout;
        const exists = layout.seats.some(s => s.gridRow === gridRow && s.gridCol === gridCol);
        if (exists) return;

        const rowLetter = layout.rowLabels[gridRow] || `R${gridRow + 1}`;
        const worldPos = calculateSeatWorldPos(gridRow, gridCol, layout.totalRows, layout.totalCols, layout.geometry);
        const ergonomics = calculateErgonomics(worldPos, layout.geometry);

        const newSeat = {
          id: `${rowLetter}-${gridCol + 1}`,
          row: rowLetter,
          col: gridCol + 1,
          displayCol: gridCol + 1,
          section: 'PRIME',
          price: 350,
          status: 'available',
          gridRow,
          gridCol,
          worldPos,
          ergonomics
        };

        const updatedSeats = [...layout.seats, newSeat];
        set({
          activeLayout: {
            ...layout,
            seats: updatedSeats
          }
        });
      },

      removeSeatAtGrid: (gridRow, gridCol) => {
        const state = get();
        const layout = state.activeLayout;
        const updatedSeats = layout.seats.filter(s => !(s.gridRow === gridRow && s.gridCol === gridCol));
        set({
          activeLayout: {
            ...layout,
            seats: updatedSeats
          }
        });
      },

      // Toast Notifications
      toast: null,
      setToast: (toast) => set({ toast }),
      clearToast: () => set({ toast: null })
    }),
    {
      name: 'seat-sight-storage-v1',
      partialize: (state) => ({
        savedLayouts: state.savedLayouts,
        fov: state.fov,
        showHeatmap: state.showHeatmap
      })
    }
  )
);
