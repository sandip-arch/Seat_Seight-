import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store/useStore.js';
import { getScreenDimensions } from '../../utils/math.js';
import { CinematicScreenCanvas } from './CanvasMovieTexture.js';

export default function CinemaScene() {
  const { 
    activeLayout, 
    selectedSeatId, 
    isPlayingScreenVideo,
    screenVideoSource
  } = useStore();

  const geometry = activeLayout.geometry;
  const { width: screenWidth, height: screenHeight } = getScreenDimensions(
    geometry.screenFormat, 
    geometry.screenWidth
  );
  const screenCenterY = geometry.screenHeightOffset + screenHeight / 2;

  // Selected Seat
  const selectedSeat = activeLayout.seats.find(s => s.id === selectedSeatId) || activeLayout.seats[0];

  // 1. Screen Texture Setup (CanvasTexture or HTML Video)
  const screenCanvasRef = useRef(new CinematicScreenCanvas(1280, 720));
  const canvasTextureRef = useRef(null);
  const videoRef = useRef(null);
  const [videoTexture, setVideoTexture] = useState(null);

  // Setup canvas texture
  const canvasTexture = useMemo(() => {
    const tex = new THREE.CanvasTexture(screenCanvasRef.current.getCanvas());
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    canvasTextureRef.current = tex;
    return tex;
  }, []);

  // Handle local video upload if provided
  useEffect(() => {
    if (screenVideoSource) {
      const vid = document.createElement('video');
      vid.src = screenVideoSource;
      vid.crossOrigin = 'anonymous';
      vid.loop = true;
      vid.muted = true;
      vid.play();
      videoRef.current = vid;
      const vTex = new THREE.VideoTexture(vid);
      setVideoTexture(vTex);

      return () => {
        vid.pause();
        vid.src = '';
      };
    } else {
      setVideoTexture(null);
    }
  }, [screenVideoSource]);

  // Update canvas texture on frame
  useFrame(() => {
    if (!videoTexture && screenCanvasRef.current && canvasTextureRef.current) {
      screenCanvasRef.current.update(isPlayingScreenVideo);
      canvasTextureRef.current.needsUpdate = true;
    }
  });

  // 2. Movie Screen Mesh Geometry (Flat or Curved)
  const screenGeometry = useMemo(() => {
    if (geometry.curvedScreen && geometry.curveDepth > 0) {
      // Cylinder segment curve for IMAX
      const radius = Math.max(10, (screenWidth * screenWidth) / (8 * geometry.curveDepth) + geometry.curveDepth / 2);
      const angle = 2 * Math.asin(screenWidth / (2 * radius));
      const geom = new THREE.CylinderGeometry(
        radius, 
        radius, 
        screenHeight, 
        48, 
        1, 
        true, 
        Math.PI - angle / 2, 
        angle
      );
      // Flip normals inside so it faces viewer at +Z
      geom.scale(-1, 1, 1);
      return geom;
    } else {
      return new THREE.PlaneGeometry(screenWidth, screenHeight, 32, 16);
    }
  }, [geometry.curvedScreen, geometry.curveDepth, screenWidth, screenHeight]);

  // 3. Auditorium Architecture Dimensions
  const totalRows = activeLayout.totalRows;
  const maxZ = geometry.screenDistance + totalRows * geometry.rowDepth + 3;
  const hallWidth = Math.max(screenWidth + 6, activeLayout.totalCols * geometry.seatSpacing + 6);
  const maxTierElevation = 0.4 + (totalRows * geometry.rowDepth * Math.tan((geometry.slopeAngle * Math.PI) / 180));
  const ceilingHeight = Math.max(screenHeight + 4, maxTierElevation + 5.5);

  // 4. Instanced Cinema Seats
  const seatInstancedRef = useRef(null);
  const dummyMatrix = useMemo(() => new THREE.Object3D(), []);

  // Low-poly seat geometry components: Seat Cushion + Backrest + Armrests
  const seatGeom = useMemo(() => {
    const seatGroup = new THREE.BoxGeometry(0.55, 0.45, 0.5);
    return seatGroup;
  }, []);

  const seatMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#1b1b26',
      roughness: 0.85,
      metalness: 0.1
    });
  }, []);

  // Populate InstancedMesh matrices
  useEffect(() => {
    if (!seatInstancedRef.current) return;
    const mesh = seatInstancedRef.current;

    activeLayout.seats.forEach((seat, idx) => {
      // Skip selected seat from generic instance because it's rendered as a glowing active seat
      const isSelected = seat.id === selectedSeatId;
      if (isSelected) {
        dummyMatrix.position.set(0, -999, 0); // hide in instance
      } else {
        // Seat base sits on tier floor: eye level is +1.15m above floor, so seat base is at Y - 0.75m
        dummyMatrix.position.set(seat.worldPos.x, seat.worldPos.y - 0.75, seat.worldPos.z);
        dummyMatrix.rotation.set(0, Math.PI, 0); // face towards screen (-Z)
        dummyMatrix.scale.set(1, 1, 1);
      }
      dummyMatrix.updateMatrix();
      mesh.setMatrixAt(idx, dummyMatrix.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [activeLayout.seats, selectedSeatId, dummyMatrix]);

  return (
    <group>
      {/* ----------------- MOVIE SCREEN ----------------- */}
      <group position={[0, screenCenterY, 0]}>
        {/* Screen Display Mesh */}
        <mesh geometry={screenGeometry} castShadow={false} receiveShadow={false}>
          <meshBasicMaterial
            map={videoTexture || canvasTexture}
            toneMapped={false}
          />
        </mesh>

        {/* Screen Frame / Bezel */}
        <mesh position={[0, 0, -0.06]}>
          <boxGeometry args={[screenWidth + 0.6, screenHeight + 0.6, 0.1]} />
          <meshStandardMaterial color="#08080a" roughness={0.9} />
        </mesh>

        {/* Screen Glow Light: emits dynamic ambient light into the auditorium */}
        <pointLight
          position={[0, 0, 1.8]}
          color="#38bdf8"
          intensity={1.8}
          distance={geometry.screenDistance * 2.8}
          decay={1.8}
        />
        <pointLight
          position={[0, -screenHeight * 0.35, 1.5]}
          color="#1EA83C"
          intensity={1.0}
          distance={geometry.screenDistance * 1.5}
          decay={2}
        />
      </group>

      {/* ----------------- AUDITORIUM ARCHITECTURE ----------------- */}
      
      {/* Stepped Tiered Floors */}
      {Array.from({ length: totalRows }).map((_, rIndex) => {
        // Distance and elevation for tier
        let rowFromScreen = rIndex;
        if (geometry.screenOrientation === 'bottom') {
          rowFromScreen = (totalRows - 1) - rIndex;
        }

        const slopeRad = (geometry.slopeAngle * Math.PI) / 180;
        const tierElevation = 0.4 + (rowFromScreen * geometry.rowDepth * Math.tan(slopeRad));
        const tierZ = geometry.screenDistance + (rowFromScreen * geometry.rowDepth);
        const tierDepth = geometry.rowDepth * 1.05;

        return (
          <group key={rIndex} position={[0, tierElevation / 2, tierZ]}>
            {/* Tier Platform */}
            <mesh receiveShadow>
              <boxGeometry args={[hallWidth, tierElevation, tierDepth]} />
              <meshStandardMaterial 
                color="#0f0f14" 
                roughness={0.92}
                metalness={0.05}
              />
            </mesh>

            {/* Dim Warm Aisle Floor Strip Light (Amber LEDs) */}
            <mesh position={[0, tierElevation / 2 + 0.01, -tierDepth / 2 + 0.04]}>
              <boxGeometry args={[hallWidth * 0.96, 0.02, 0.05]} />
              <meshBasicMaterial color="#f59e0b" toneMapped={false} />
            </mesh>
          </group>
        );
      })}

      {/* Ground Floor (in front of first row) */}
      <mesh 
        position={[0, -0.1, geometry.screenDistance / 2]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        receiveShadow
      >
        <planeGeometry args={[hallWidth, geometry.screenDistance + 2]} />
        <meshStandardMaterial color="#09090c" roughness={0.95} />
      </mesh>

      {/* Dark Acoustic Side Walls with Subtle Slat Panels */}
      {/* Left Wall */}
      <mesh position={[-hallWidth / 2, ceilingHeight / 2, maxZ / 2]}>
        <boxGeometry args={[0.2, ceilingHeight, maxZ + 4]} />
        <meshStandardMaterial color="#121218" roughness={0.88} />
      </mesh>
      {/* Right Wall */}
      <mesh position={[hallWidth / 2, ceilingHeight / 2, maxZ / 2]}>
        <boxGeometry args={[0.2, ceilingHeight, maxZ + 4]} />
        <meshStandardMaterial color="#121218" roughness={0.88} />
      </mesh>
      {/* Back Wall */}
      <mesh position={[0, ceilingHeight / 2, maxZ + 2]}>
        <boxGeometry args={[hallWidth, ceilingHeight, 0.2]} />
        <meshStandardMaterial color="#0c0c10" roughness={0.9} />
      </mesh>

      {/* Ceiling with subtle dark acoustic grid */}
      <mesh position={[0, ceilingHeight, maxZ / 2]}>
        <boxGeometry args={[hallWidth, 0.2, maxZ + 4]} />
        <meshStandardMaterial color="#08080b" roughness={0.95} />
      </mesh>

      {/* ----------------- INSTANCED CINEMA SEATS ----------------- */}
      <instancedMesh
        ref={seatInstancedRef}
        args={[seatGeom, seatMaterial, activeLayout.seats.length]}
        castShadow
        receiveShadow
      />

      {/* ----------------- CURRENT SEAT & FRONT ROW OBSTRUCTION ----------------- */}
      {/* Render the user's current seat cushion & armrests directly under eye level */}
      {selectedSeat && (
        <group position={[selectedSeat.worldPos.x, selectedSeat.worldPos.y - 0.75, selectedSeat.worldPos.z]}>
          {/* Seat Cushion */}
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[0.56, 0.38, 0.52]} />
            <meshStandardMaterial 
              color="#1EA83C" 
              emissive="#1EA83C" 
              emissiveIntensity={0.25} 
              roughness={0.7} 
            />
          </mesh>
          {/* Backrest */}
          <mesh castShadow receiveShadow position={[0, 0.36, 0.2]}>
            <boxGeometry args={[0.54, 0.52, 0.16]} />
            <meshStandardMaterial 
              color="#1EA83C" 
              emissive="#1EA83C" 
              emissiveIntensity={0.2} 
              roughness={0.7} 
            />
          </mesh>
          {/* Armrests */}
          <mesh position={[-0.31, 0.18, 0]}>
            <boxGeometry args={[0.08, 0.24, 0.44]} />
            <meshStandardMaterial color="#181820" roughness={0.9} />
          </mesh>
          <mesh position={[0.31, 0.18, 0]}>
            <boxGeometry args={[0.08, 0.24, 0.44]} />
            <meshStandardMaterial color="#181820" roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* ----------------- AMBIENT AUDITORIUM LIGHTING ----------------- */}
      {/* Very dim cinema ambience so seats and tiers have tangible depth */}
      <ambientLight intensity={0.22} color="#1e1e2d" />

      {/* Subtle downlights from ceiling */}
      <pointLight
        position={[0, ceilingHeight - 0.5, maxZ * 0.5]}
        color="#38bdf8"
        intensity={0.4}
        distance={hallWidth * 1.5}
        decay={2}
      />
    </group>
  );
}
