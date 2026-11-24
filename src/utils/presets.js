import { calculateSeatWorldPos, calculateErgonomics } from './math.js';

export function generateMultiplexPreset() {
  // From back of hall (top of map) to front of hall (bottom of map, closest to screen)
  const rowLabels = ['N', 'M', 'L', 'K', 'J', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];
  
  const sections = [
    { name: 'RECLINER', title: 'ROYAL RECLINER - ₹650', price: 650, rows: ['N', 'M'] },
    { name: 'PRIME', title: 'PRIME EXECUTIVE - ₹350', price: 350, rows: ['L', 'K', 'J', 'H', 'G', 'F'] },
    { name: 'CLASSIC', title: 'CLASSIC CLUB - ₹220', price: 220, rows: ['E', 'D', 'C', 'B', 'A'] }
  ];

  const geometry = {
    screenFormat: '2.39:1',
    curvedScreen: false,
    curveDepth: 0.4,
    slopeAngle: 18,
    screenDistancePreset: 'standard',
    screenDistance: 6.2,
    screenWidth: 16,
    screenHeight: 16 / 2.39,
    screenHeightOffset: 1.8,
    rowDepth: 1.15,
    seatSpacing: 0.68,
    screenOrientation: 'bottom' // Screen at bottom (BookMyShow standard)
  };

  const totalRows = rowLabels.length;
  const totalCols = 22;
  const seats = [];

  rowLabels.forEach((rowLetter, gridRow) => {
    let section = sections[2]; // default classic
    if (['N', 'M'].includes(rowLetter)) section = sections[0]; // Recliner (furthest from screen)
    else if (['L', 'K', 'J', 'H', 'G', 'F'].includes(rowLetter)) section = sections[1]; // Prime (middle)

    let seatNumber = 1;

    for (let gridCol = 0; gridCol < totalCols; gridCol++) {
      // Twin aisles at cols 4 and 17
      const isAisle = gridCol === 4 || gridCol === 17;
      if (isAisle) continue;

      if (section.name === 'RECLINER' && (gridCol === 0 || gridCol === 21)) {
        continue;
      }

      const worldPos = calculateSeatWorldPos(gridRow, gridCol, totalRows, totalCols, geometry);
      const ergonomics = calculateErgonomics(worldPos, geometry);

      const seed = (gridRow * 31 + gridCol * 17) % 100;
      const status = seed < 22 ? 'reserved' : 'available';

      seats.push({
        id: `${rowLetter}-${seatNumber}`,
        row: rowLetter,
        col: seatNumber,
        displayCol: seatNumber,
        section: section.name,
        price: section.price,
        status,
        gridRow,
        gridCol,
        worldPos,
        ergonomics
      });

      seatNumber++;
    }
  });

  return {
    id: 'preset-standard-multiplex',
    name: 'PVR Inox — Audi 4 (Standard Multiplex)',
    theatreType: 'multiplex',
    totalRows,
    totalCols,
    rowLabels,
    seats,
    sections,
    geometry,
    createdAt: new Date().toISOString()
  };
}

export function generateIMAXPreset() {
  const rowLabels = ['P', 'O', 'N', 'M', 'L', 'K', 'J', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];
  
  const sections = [
    { name: 'RECLINER', title: 'IMAX VIP BALCONY - ₹950', price: 950, rows: ['P', 'O'] },
    { name: 'PRIME', title: 'IMAX PRIME SWEETSPOT - ₹600', price: 600, rows: ['N', 'M', 'L', 'K', 'J', 'I', 'H', 'G'] },
    { name: 'CLASSIC', title: 'IMAX STANDARD - ₹420', price: 420, rows: ['F', 'E', 'D', 'C', 'B', 'A'] }
  ];

  const geometry = {
    screenFormat: '1.43:1', // Classic Grand IMAX
    curvedScreen: true,
    curveDepth: 1.5,
    slopeAngle: 24, // Steep stadium seating
    screenDistancePreset: 'grand',
    screenDistance: 5.8,
    screenWidth: 22,
    screenHeight: 22 / 1.43,
    screenHeightOffset: 1.2,
    rowDepth: 1.18,
    seatSpacing: 0.72,
    screenOrientation: 'bottom'
  };

  const totalRows = rowLabels.length;
  const totalCols = 26;
  const seats = [];

  rowLabels.forEach((rowLetter, gridRow) => {
    let section = sections[2];
    if (['P', 'O'].includes(rowLetter)) section = sections[0];
    else if (['N', 'M', 'L', 'K', 'J', 'I', 'H', 'G'].includes(rowLetter)) section = sections[1];

    let seatNumber = 1;

    for (let gridCol = 0; gridCol < totalCols; gridCol++) {
      const isAisle = gridCol === 5 || gridCol === 20;
      if (isAisle) continue;

      if ((rowLetter === 'A' || rowLetter === 'B') && (gridCol < 2 || gridCol > 23)) {
        continue;
      }

      const worldPos = calculateSeatWorldPos(gridRow, gridCol, totalRows, totalCols, geometry);
      const ergonomics = calculateErgonomics(worldPos, geometry);

      const seed = (gridRow * 47 + gridCol * 23) % 100;
      const status = seed < 28 ? 'reserved' : 'available';

      seats.push({
        id: `${rowLetter}-${seatNumber}`,
        row: rowLetter,
        col: seatNumber,
        displayCol: seatNumber,
        section: section.name,
        price: section.price,
        status,
        gridRow,
        gridCol,
        worldPos,
        ergonomics
      });

      seatNumber++;
    }
  });

  return {
    id: 'preset-large-imax',
    name: 'IMAX Laser Experience — Grand Auditorium',
    theatreType: 'imax',
    totalRows,
    totalCols,
    rowLabels,
    seats,
    sections,
    geometry,
    createdAt: new Date().toISOString()
  };
}

/**
 * Creates a realistic BookMyShow screenshot with section headers,
 * row labels (A-Z), seats, and the glowing curved screen at the bottom.
 */
export function renderDemoScreenshot(layout) {
  const canvas = document.createElement('canvas');
  canvas.width = 750;
  canvas.height = 1334;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#1f2533';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Header Bar
  ctx.fillStyle = '#2b3144';
  ctx.fillRect(0, 0, canvas.width, 130);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(layout.name.slice(0, 32), 40, 65);
  ctx.fillStyle = '#9ca3af';
  ctx.font = '18px sans-serif';
  ctx.fillText('English • 2D • Dolby Atmos 7.1', 40, 102);

  // Seat Grid Area
  const gridOffsetY = 200;
  const colPitch = 26;
  const rowPitch = 32;
  const startX = (canvas.width - layout.totalCols * colPitch) / 2 + 10;

  // Draw Sections and Seats
  layout.sections?.forEach((section) => {
    // Find first row of section to draw section header
    const firstRowIndex = layout.rowLabels.indexOf(section.rows[0]);
    if (firstRowIndex !== -1) {
      const headerY = gridOffsetY + firstRowIndex * rowPitch - 12;
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(section.title, 40, headerY);

      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, headerY + 4);
      ctx.lineTo(canvas.width - 40, headerY + 4);
      ctx.stroke();
    }
  });

  // Draw Row Letters on Left Margin
  layout.rowLabels.forEach((letter, rIdx) => {
    const y = gridOffsetY + rIdx * rowPitch + 16;
    ctx.fillStyle = '#9ca3af';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(letter, startX - 16, y);
  });

  // Draw Seat Icons
  layout.seats.forEach(seat => {
    const x = startX + seat.gridCol * colPitch;
    const y = gridOffsetY + seat.gridRow * rowPitch;

    if (seat.status === 'reserved') {
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(x, y, 20, 20);
    } else {
      ctx.strokeStyle = '#1EA83C';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, 20, 20);
      ctx.fillStyle = '#111827';
      ctx.fillRect(x + 1, y + 1, 18, 18);

      // Seat number
      ctx.fillStyle = '#1EA83C';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(seat.col.toString(), x + 10, y + 14);
    }
  });

  // Screen Curve at the Bottom (BookMyShow Signature)
  const screenY = gridOffsetY + layout.totalRows * rowPitch + 80;
  ctx.beginPath();
  ctx.moveTo(80, screenY + 30);
  ctx.quadraticCurveTo(canvas.width / 2, screenY, canvas.width - 80, screenY + 30);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 6;
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 18;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('All eyes this way please!', canvas.width / 2, screenY + 65);

  return canvas.toDataURL('image/png');
}
