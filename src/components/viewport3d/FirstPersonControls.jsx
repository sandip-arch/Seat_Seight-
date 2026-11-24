import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store/useStore.js';
import { getScreenDimensions } from '../../utils/math.js';

export default function FirstPersonControls() {
  const { camera, gl } = useThree();
  const { 
    activeLayout, 
    selectedSeatId, 
    fov, 
    gyroscopeActive 
  } = useStore();

  const selectedSeat = activeLayout.seats.find(s => s.id === selectedSeatId) || activeLayout.seats[0];

  // Head rotation angles (in radians)
  // Yaw: 0 looks straight at screen center, negative = left, positive = right
  const yaw = useRef(0);
  const pitch = useRef(0);

  // Target yaw and pitch for smooth mouse-look damping
  const targetYaw = useRef(0);
  const targetPitch = useRef(0);

  // Mouse / Touch Drag state
  const isDragging = useRef(false);
  const prevPointer = useRef({ x: 0, y: 0 });

  // Camera lerp target position
  const targetCamPos = useRef(new THREE.Vector3(0, 2, 8));

  // Limits
  const MAX_YAW = (80 * Math.PI) / 180;    // ±80°
  const MAX_PITCH = (45 * Math.PI) / 180;  // ±45°

  // Screen center coordinates for gaze
  const { height: screenH } = getScreenDimensions(
    activeLayout.geometry.screenFormat, 
    activeLayout.geometry.screenWidth
  );
  const screenCenterY = activeLayout.geometry.screenHeightOffset + screenH / 2;

  // On seat change or mount, calculate default gaze angle
  useEffect(() => {
    if (!selectedSeat) return;
    const { x, y, z } = selectedSeat.worldPos;
    targetCamPos.current.set(x, y, z);

    // Initial base gaze points directly at screen center (0, screenCenterY, 0)
    const dx = 0 - x;
    const dy = screenCenterY - y;
    const dz = 0 - z;

    const baseYaw = Math.atan2(dx, dz) - Math.PI; // screen is at z = 0, seat is at z > 0
    // Keep relative yaw at 0 (center)
    targetYaw.current = 0;
    targetPitch.current = 0;
  }, [selectedSeatId, activeLayout]);

  // Update FOV dynamically
  useEffect(() => {
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [fov, camera]);

  // Recenter listener (Shortcut 'R')
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'r' || e.key === 'R') {
        targetYaw.current = 0;
        targetPitch.current = 0;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Pointer event listeners on the canvas
  useEffect(() => {
    const dom = gl.domElement;

    const onPointerDown = (e) => {
      // Primary button or touch
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      isDragging.current = true;
      prevPointer.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      if (!isDragging.current) return;

      const deltaX = e.clientX - prevPointer.current.x;
      const deltaY = e.clientY - prevPointer.current.y;
      prevPointer.current = { x: e.clientX, y: e.clientY };

      const sensitivity = 0.0035;
      // Drag left -> look left (negative yaw)
      targetYaw.current -= deltaX * sensitivity;
      // Drag down -> look down (negative pitch)
      targetPitch.current -= deltaY * sensitivity;

      // Clamp yaw and pitch
      targetYaw.current = Math.max(-MAX_YAW, Math.min(MAX_YAW, targetYaw.current));
      targetPitch.current = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, targetPitch.current));
    };

    const onPointerUp = () => {
      isDragging.current = false;
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [gl, MAX_YAW, MAX_PITCH]);

  // Optional Gyroscope support for mobile
  useEffect(() => {
    if (!gyroscopeActive) return;

    const handleOrientation = (e) => {
      if (e.gamma !== null && e.beta !== null) {
        // gamma: left-to-right (-90 to 90)
        // beta: front-to-back (-180 to 180)
        const gyroYaw = (e.gamma * Math.PI) / 180 * 0.8;
        const gyroPitch = ((e.beta - 45) * Math.PI) / 180 * 0.6;
        targetYaw.current = Math.max(-MAX_YAW, Math.min(MAX_YAW, gyroYaw));
        targetPitch.current = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, gyroPitch));
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [gyroscopeActive, MAX_YAW, MAX_PITCH]);

  // Render loop: smooth position & rotation lerping
  useFrame((_, delta) => {
    // 1. Lerp camera position to selected seat eye level
    camera.position.lerp(targetCamPos.current, THREE.MathUtils.clamp(delta * 7, 0, 1));

    // 2. Smoothly damp yaw and pitch
    yaw.current += (targetYaw.current - yaw.current) * THREE.MathUtils.clamp(delta * 14, 0, 1);
    pitch.current += (targetPitch.current - pitch.current) * THREE.MathUtils.clamp(delta * 14, 0, 1);

    // 3. Compute gaze direction towards screen center + head offset
    // Base vector towards screen center
    const dir = new THREE.Vector3(
      0 - camera.position.x,
      screenCenterY - camera.position.y,
      0 - camera.position.z
    ).normalize();

    // Convert base direction to spherical coords
    const baseEuler = new THREE.Euler(0, 0, 0, 'YXZ');
    // Align base forward looking along -Z axis
    baseEuler.y = Math.atan2(0 - camera.position.x, 0 - camera.position.z) + Math.PI;
    const distHoriz = Math.sqrt(camera.position.x * camera.position.x + camera.position.z * camera.position.z);
    baseEuler.x = Math.atan2(screenCenterY - camera.position.y, distHoriz);

    // Apply head yaw and pitch offsets
    camera.rotation.order = 'YXZ';
    camera.rotation.y = baseEuler.y + yaw.current;
    camera.rotation.x = baseEuler.x + pitch.current;
    camera.rotation.z = 0;
  });

  return null;
}
