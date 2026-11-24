/**
 * Math utilities for 3D auditorium spatial mapping and viewing ergonomics.
 */

export function getScreenDimensions(format, width) {
  let aspectRatio = 16 / 9;
  if (format === '2.39:1') aspectRatio = 2.39;
  if (format === '1.43:1') aspectRatio = 1.43;

  const height = width / aspectRatio;
  return { width, height, aspectRatio };
}

export function calculateSeatWorldPos(gridRow, gridCol, totalRows, totalCols, geometry) {
  const {
    slopeAngle = 18,
    screenDistance = 6.0,
    rowDepth = 1.15,
    seatSpacing = 0.65,
    screenOrientation = 'bottom'
  } = geometry;

  // BookMyShow standard: Screen is at bottom of the 2D view.
  // The row closest to the bottom (gridRow = totalRows - 1) is closest to the screen!
  let rowFromScreen = gridRow;
  if (screenOrientation === 'bottom') {
    rowFromScreen = (totalRows - 1) - gridRow;
  }

  const slopeRad = (slopeAngle * Math.PI) / 180;
  // Tier elevation: base height + stadium rake
  const tierElevation = 0.4 + (rowFromScreen * rowDepth * Math.tan(slopeRad));
  const eyeHeight = tierElevation + 1.15; // Average human seated eye height

  const zPos = screenDistance + (rowFromScreen * rowDepth);
  const centerCol = (totalCols - 1) / 2;
  const xPos = (gridCol - centerCol) * seatSpacing;

  return {
    x: Number(xPos.toFixed(3)),
    y: Number(eyeHeight.toFixed(3)),
    z: Number(zPos.toFixed(3)),
    tierElevation: Number(tierElevation.toFixed(3)),
    rowFromScreen
  };
}

export function calculateErgonomics(seatPos, geometry) {
  const { width: screenWidth, height: screenHeight } = getScreenDimensions(geometry.screenFormat, geometry.screenWidth);
  const screenCenterY = geometry.screenHeightOffset + (screenHeight / 2);

  const dx = seatPos.x;
  const dy = screenCenterY - seatPos.y;
  const dz = seatPos.z;
  const distanceToScreen = Math.sqrt(dx * dx + dy * dy + dz * dz);

  // Horizontal Off-Axis Angle (degrees from perpendicular screen normal)
  const horizontalAngle = Math.abs(Math.atan2(seatPos.x, seatPos.z) * (180 / Math.PI));

  // Vertical Neck Tilt (degrees looking up to screen center)
  const verticalAngle = Math.atan2(dy, seatPos.z) * (180 / Math.PI);

  // Field of View (FOV fill in degrees) subtended horizontally by screen
  const leftAngle = Math.atan2(-screenWidth / 2 - seatPos.x, seatPos.z);
  const rightAngle = Math.atan2(screenWidth / 2 - seatPos.x, seatPos.z);
  const fovFill = Math.abs(rightAngle - leftAngle) * (180 / Math.PI);

  // SMPTE / THX Scoring Model (0 - 100)
  // 1. FOV Score (THX recommended >= 36°, SMPTE >= 30°, IMAX 50°-70°)
  let fovScore = 0;
  if (fovFill >= 36 && fovFill <= 55) {
    fovScore = 100;
  } else if (fovFill > 55 && fovFill <= 72) {
    fovScore = 95;
  } else if (fovFill > 72) {
    fovScore = Math.max(30, 100 - (fovFill - 72) * 3);
  } else if (fovFill >= 28 && fovFill < 36) {
    fovScore = 75 + (fovFill - 28) * 3;
  } else {
    fovScore = Math.max(15, fovFill * 2.5);
  }

  // 2. Horizontal Center Score
  let horizScore = 0;
  if (horizontalAngle <= 8) {
    horizScore = 100;
  } else if (horizontalAngle <= 18) {
    horizScore = 90 - (horizontalAngle - 8) * 2;
  } else if (horizontalAngle <= 28) {
    horizScore = 70 - (horizontalAngle - 18) * 2.5;
  } else {
    horizScore = Math.max(15, 45 - (horizontalAngle - 28) * 1.5);
  }

  // 3. Vertical Neck Tilt Score (SMPTE recommends gaze angle to screen top <= 35°)
  let vertScore = 0;
  if (verticalAngle >= -5 && verticalAngle <= 12) {
    vertScore = 100;
  } else if (verticalAngle > 12 && verticalAngle <= 20) {
    vertScore = 90 - (verticalAngle - 12) * 3;
  } else if (verticalAngle > 20) {
    vertScore = Math.max(10, 66 - (verticalAngle - 20) * 3.5);
  } else {
    vertScore = Math.max(55, 90 + verticalAngle * 2);
  }

  const score = Math.round(fovScore * 0.4 + horizScore * 0.35 + vertScore * 0.25);

  let rating = 'good';
  let badge = 'Standard View';

  if (verticalAngle > 22) {
    rating = 'high-tilt';
    badge = 'Front Row — High Neck Tilt';
  } else if (horizontalAngle > 26) {
    rating = 'off-axis';
    badge = 'Off-Axis Angle';
  } else if (score >= 88) {
    rating = 'optimal';
    badge = 'Optimal Sweet Spot';
  } else if (score >= 74) {
    rating = 'great';
    badge = 'Great View';
  }

  return {
    horizontalAngle: Number(horizontalAngle.toFixed(1)),
    verticalAngle: Number(verticalAngle.toFixed(1)),
    fovFill: Number(fovFill.toFixed(1)),
    score,
    rating,
    badge,
    distanceToScreen: Number(distanceToScreen.toFixed(2))
  };
}

export function getScoreColor(score) {
  if (score >= 85) return '#1EA83C'; // Emerald green - optimal sweet spot
  if (score >= 72) return '#22c55e'; // Bright green - great view
  if (score >= 60) return '#eab308'; // Amber - standard/good
  if (score >= 45) return '#f97316'; // Orange - fair/off-axis
  return '#ef4444'; // Red - high neck strain
}
