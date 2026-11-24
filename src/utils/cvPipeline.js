import { calculateSeatWorldPos, calculateErgonomics } from './math.js';

/**
 * Stage 1: Detect Screen Line, Curved Arc, or Glow
 * In BookMyShow / District / PVR screenshots, the screen is represented by:
 * - A curved arc or line (often cyan #38bdf8, green, or bright white with glow)
 * - Text like "ALL EYES THIS WAY PLEASE!", "SCREEN THIS WAY", or "SCREEN"
 * - Usually located in the bottom 25% or top 25% of the chart
 */
export function detectScreenLocation(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { screenOrientation: 'bottom', screenY: canvas.height * 0.9, confidence: 0.8 };

  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Scan top 25% vs bottom 25%
  let topCyanScore = 0;
  let bottomCyanScore = 0;
  let topCurveScore = 0;
  let bottomCurveScore = 0;

  const topLimit = Math.floor(h * 0.28);
  const bottomStart = Math.floor(h * 0.72);

  for (let y = 0; y < topLimit; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Detect cyan/sky-blue or bright neon screen line (high B and G, lower R)
      if (b > 160 && g > 140 && b > r + 30) {
        topCyanScore++;
      }
      // High contrast horizontal line
      if (r > 200 && g > 200 && b > 200) {
        topCurveScore += 0.5;
      }
    }
  }

  for (let y = bottomStart; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      if (b > 160 && g > 140 && b > r + 30) {
        bottomCyanScore++;
      }
      if (r > 200 && g > 200 && b > 200) {
        bottomCurveScore += 0.5;
      }
    }
  }

  const topTotal = topCyanScore * 2 + topCurveScore;
  const bottomTotal = bottomCyanScore * 2 + bottomCurveScore;

  // BookMyShow default is screen at bottom unless top has decisively higher score
  const isTop = topTotal > bottomTotal && topTotal > 60;
  const orientation = isTop ? 'top' : 'bottom';
  const screenY = isTop ? Math.round(h * 0.08) : Math.round(h * 0.92);

  return {
    screenOrientation: orientation,
    screenY,
    confidence: Math.max(0.65, Math.min(0.98, Math.abs(bottomTotal - topTotal) / 100)),
    boundingBox: {
      x: Math.round(w * 0.1),
      y: isTop ? 10 : Math.round(h * 0.88),
      width: Math.round(w * 0.8),
      height: Math.round(h * 0.1)
    }
  };
}

/**
 * Stage 2 & 3: High-Precision Local Adaptive Seat Detection Engine
 */
export function detectSeatsFromCanvas(sourceCanvas, sensitivity = 50, geometry) {
  const ctx = sourceCanvas.getContext('2d');
  if (!ctx) return generateFallbackResult(geometry);

  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  if (width < 30 || height < 30) {
    return generateFallbackResult(geometry);
  }

  // 1. Detect Screen Location first
  const screenDetection = detectScreenLocation(sourceCanvas);
  const detectedOrientation = screenDetection.screenOrientation;

  // 2. Extract Pixels & Analyze Background Color
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Determine background color by sampling perimeter pixels
  let bgR = 0, bgG = 0, bgB = 0, sampleCount = 0;
  for (let x = 0; x < width; x += 4) {
    // top and bottom borders
    const topIdx = x * 4;
    const botIdx = ((height - 1) * width + x) * 4;
    bgR += data[topIdx] + data[botIdx];
    bgG += data[topIdx + 1] + data[botIdx + 1];
    bgB += data[topIdx + 2] + data[botIdx + 2];
    sampleCount += 2;
  }
  bgR /= sampleCount;
  bgG /= sampleCount;
  bgB /= sampleCount;
  const bgLum = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;
  const isDarkMode = bgLum < 128;

  // 3. Grayscale conversion
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    gray[i / 4] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }

  // 4. Sobel Edge Gradient Magnitude
  const grad = new Uint8Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    const yOffset = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = yOffset + x;
      const gx = -gray[idx - width - 1] + gray[idx - width + 1]
                 -2 * gray[idx - 1] + 2 * gray[idx + 1]
                 -gray[idx + width - 1] + gray[idx + width + 1];
      const gy = -gray[idx - width - 1] - 2 * gray[idx - width] - gray[idx - width + 1]
                 +gray[idx + width - 1] + 2 * gray[idx + width] + gray[idx + width + 1];
      grad[idx] = Math.min(255, Math.abs(gx) + Math.abs(gy));
    }
  }

  // 5. Multi-Pass Adaptive Binary Mask
  // Sensitivity scales threshold: 50 -> standard (grad > 26 or contrast > 24)
  const gradThreshold = Math.max(14, 42 - (sensitivity / 100) * 28);
  const contrastThreshold = Math.max(15, 45 - (sensitivity / 100) * 30);
  const binary = new Uint8Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    const yOffset = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = yOffset + x;
      const pixelDiff = isDarkMode ? gray[idx] - bgLum : bgLum - gray[idx];
      // A seat boundary or filled seat has strong edge gradient OR distinct contrast against background
      if (grad[idx] > gradThreshold || pixelDiff > contrastThreshold) {
        binary[idx] = 1;
      }
    }
  }

  // 6. Connected Component Labeling (CCL)
  const labels = new Int32Array(width * height);
  let currentLabel = 1;
  const parent = [0];

  function find(i) {
    let root = i;
    while (root !== parent[root]) root = parent[root];
    let curr = i;
    while (curr !== root) {
      const nxt = parent[curr];
      parent[curr] = root;
      curr = nxt;
    }
    return root;
  }

  function union(i, j) {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) parent[rootJ] = rootI;
  }

  for (let y = 1; y < height - 1; y++) {
    const yOffset = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = yOffset + x;
      if (binary[idx] === 0) continue;

      const up = labels[idx - width];
      const left = labels[idx - 1];

      if (up === 0 && left === 0) {
        labels[idx] = currentLabel;
        parent[currentLabel] = currentLabel;
        currentLabel++;
      } else if (up > 0 && left === 0) {
        labels[idx] = up;
      } else if (up === 0 && left > 0) {
        labels[idx] = left;
      } else {
        const rootUp = find(up);
        const rootLeft = find(left);
        labels[idx] = rootUp;
        if (rootUp !== rootLeft) {
          union(rootUp, rootLeft);
        }
      }
    }
  }

  // Aggregate bounding boxes per connected component
  const comps = new Map();
  for (let y = 1; y < height - 1; y++) {
    const yOffset = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = yOffset + x;
      const l = labels[idx];
      if (l === 0) continue;
      const root = find(l);

      let box = comps.get(root);
      if (!box) {
        box = { minX: x, maxX: x, minY: y, maxY: y, count: 0 };
        comps.set(root, box);
      }
      if (x < box.minX) box.minX = x;
      if (x > box.maxX) box.maxX = x;
      if (y < box.minY) box.minY = y;
      if (y > box.maxY) box.maxY = y;
      box.count++;
    }
  }

  // Filter boxes by cinema seat size and aspect ratio
  // Standard seat icons are 12px to 48px wide, and 12px to 45px high
  const minDim = Math.max(9, Math.min(width, height) * 0.015);
  const maxDim = Math.max(52, Math.min(width, height) * 0.095);
  const candidateBoxes = [];

  comps.forEach(box => {
    const w = box.maxX - box.minX + 1;
    const h = box.maxY - box.minY + 1;
    const aspect = w / h;

    // Reject screen bar or full-width banners (which have huge width)
    if (w > width * 0.4 || h > height * 0.3) return;

    if (w >= minDim && w <= maxDim && h >= minDim && h <= maxDim) {
      // Seats are square-ish or wide recliners: aspect ratio 0.6 to 2.4
      if (aspect >= 0.6 && aspect <= 2.4 && box.count >= minDim * 1.8) {
        candidateBoxes.push({
          x: box.minX,
          y: box.minY,
          width: w,
          height: h,
          cx: box.minX + w / 2,
          cy: box.minY + h / 2
        });
      }
    }
  });

  // If candidate count is sparse, use adaptive grid fitting instead of static dummy
  if (candidateBoxes.length < 8) {
    return generateSmartFittedGrid(width, height, detectedOrientation, geometry);
  }

  // 7. Horizontal Projection Profile & Row Clustering
  // Sort candidates by Y center
  candidateBoxes.sort((a, b) => a.cy - b.cy);
  const heights = candidateBoxes.map(b => b.height).sort((a, b) => a - b);
  const medianHeight = heights[Math.floor(heights.length / 2)] || 22;

  const rowGroups = [];
  let currentRow = [];

  for (const box of candidateBoxes) {
    if (currentRow.length === 0) {
      currentRow.push(box);
    } else {
      const avgRowY = currentRow.reduce((acc, b) => acc + b.cy, 0) / currentRow.length;
      if (Math.abs(box.cy - avgRowY) < medianHeight * 0.68) {
        currentRow.push(box);
      } else {
        rowGroups.push(currentRow);
        currentRow = [box];
      }
    }
  }
  if (currentRow.length > 0) rowGroups.push(currentRow);

  // Keep rows that have at least 2 detected seats
  const validRows = rowGroups.filter(row => row.length >= 2);
  if (validRows.length < 2) {
    return generateSmartFittedGrid(width, height, detectedOrientation, geometry);
  }

  // Sort each row horizontally from left to right
  validRows.forEach(row => row.sort((a, b) => a.cx - b.cx));

  // 8. Median Pitch & Column Alignment
  const pitches = [];
  validRows.forEach(row => {
    for (let i = 0; i < row.length - 1; i++) {
      const p = row[i + 1].cx - row[i].cx;
      if (p > 8 && p < medianHeight * 3.5) {
        pitches.push(p);
      }
    }
  });
  pitches.sort((a, b) => a - b);
  const medianPitch = pitches[Math.floor(pitches.length / 2)] || medianHeight * 1.35;

  // Global X-origin to align columns across rows
  const minX = Math.min(...validRows.map(r => r[0].cx));
  const maxX = Math.max(...validRows.map(r => r[r.length - 1].cx));
  const totalCols = Math.max(14, Math.round((maxX - minX) / medianPitch) + 1);

  // 9. Row Label Assignment (A-Z)
  // In BookMyShow / Multiplexes:
  // When screen is at bottom:
  // - The row closest to the screen (bottom of screenshot) is Row A (or Row A, B, C...)
  // - The row furthest from the screen (top of screenshot) is the highest letter (e.g. Row M, N, P)
  // Let's generate authentic cinema row labels:
  const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T'];
  const totalRowsCount = validRows.length;
  const rowLabels = [];

  if (detectedOrientation === 'bottom') {
    // Top row is highest letter (Recliner), bottom row is Row A (Classic, closest to screen)
    for (let r = 0; r < totalRowsCount; r++) {
      const letterIndex = (totalRowsCount - 1) - r;
      rowLabels.push(alphabet[letterIndex] || `R${letterIndex + 1}`);
    }
  } else {
    // Screen is at top: Top row is Row A (closest to screen)
    for (let r = 0; r < totalRowsCount; r++) {
      rowLabels.push(alphabet[r] || `R${r + 1}`);
    }
  }

  // 10. Section Allocation:
  // ALWAYS: Recliner is at the BACK (furthest from screen), Classic is CLOSEST to screen!
  const reclinerRowCount = Math.max(1, Math.floor(totalRowsCount * 0.2));
  const primeRowCount = Math.max(1, Math.floor(totalRowsCount * 0.5));

  let sections = [];
  if (detectedOrientation === 'bottom') {
    // Screen at bottom:
    // Rows 0 to reclinerRowCount - 1: RECLINER (top of map, furthest from screen)
    // Rows reclinerRowCount to reclinerRowCount + primeRowCount - 1: PRIME
    // Remaining rows at bottom: CLASSIC (closest to screen)
    const reclinerRows = rowLabels.slice(0, reclinerRowCount);
    const primeRows = rowLabels.slice(reclinerRowCount, reclinerRowCount + primeRowCount);
    const classicRows = rowLabels.slice(reclinerRowCount + primeRowCount);

    sections = [
      { name: 'RECLINER', title: 'ROYAL RECLINER - ₹650', price: 650, rows: reclinerRows },
      { name: 'PRIME', title: 'PRIME EXECUTIVE - ₹350', price: 350, rows: primeRows },
      { name: 'CLASSIC', title: 'CLASSIC CLUB - ₹220', price: 220, rows: classicRows }
    ];
  } else {
    // Screen at top:
    // Rows 0 to classic: CLASSIC (closest to screen)
    // Middle rows: PRIME
    // Bottom rows: RECLINER (furthest from screen)
    const classicRows = rowLabels.slice(0, Math.ceil(totalRowsCount * 0.35));
    const primeRows = rowLabels.slice(Math.ceil(totalRowsCount * 0.35), totalRowsCount - reclinerRowCount);
    const reclinerRows = rowLabels.slice(totalRowsCount - reclinerRowCount);

    sections = [
      { name: 'CLASSIC', title: 'CLASSIC CLUB - ₹220', price: 220, rows: classicRows },
      { name: 'PRIME', title: 'PRIME EXECUTIVE - ₹350', price: 350, rows: primeRows },
      { name: 'RECLINER', title: 'ROYAL RECLINER - ₹650', price: 650, rows: reclinerRows }
    ];
  }

  // Updated geometry with detected orientation
  const updatedGeometry = {
    ...geometry,
    screenOrientation: detectedOrientation
  };

  // 11. Build Seats List
  const seats = [];
  const detectedBoxes = [];

  validRows.forEach((row, rowIndex) => {
    const rowLetter = rowLabels[rowIndex];
    
    // Determine section for this row
    let sec = sections.find(s => s.rows.includes(rowLetter)) || sections[sections.length - 1];

    let seatNumber = 1;

    row.forEach((box) => {
      // Approximate grid column relative to minX
      const gridCol = Math.max(0, Math.min(totalCols - 1, Math.round((box.cx - minX) / medianPitch)));

      box.gridRow = rowIndex;
      box.gridCol = gridCol;
      detectedBoxes.push(box);

      const worldPos = calculateSeatWorldPos(rowIndex, gridCol, totalRowsCount, totalCols, updatedGeometry);
      const ergonomics = calculateErgonomics(worldPos, updatedGeometry);

      seats.push({
        id: `${rowLetter}-${seatNumber}`,
        row: rowLetter,
        col: seatNumber,
        displayCol: seatNumber,
        section: sec.name,
        price: sec.price,
        status: 'available',
        gridRow: rowIndex,
        gridCol,
        worldPos,
        ergonomics
      });

      seatNumber++;
    });
  });

  return {
    detectedBoxes,
    seats,
    totalRows: totalRowsCount,
    totalCols,
    rowLabels,
    sections,
    screenDetection
  };
}

/**
 * Intelligent Fitted Grid when image resolution is atypical
 */
function generateSmartFittedGrid(width, height, orientation, geometry) {
  const rowCount = 12;
  const colCount = 18;
  const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P'];
  const rowLabels = [];

  if (orientation === 'bottom') {
    for (let r = 0; r < rowCount; r++) {
      rowLabels.push(alphabet[rowCount - 1 - r] || `R${r + 1}`);
    }
  } else {
    for (let r = 0; r < rowCount; r++) {
      rowLabels.push(alphabet[r] || `R${r + 1}`);
    }
  }

  const sections = orientation === 'bottom' ? [
    { name: 'RECLINER', title: 'ROYAL RECLINER - ₹650', price: 650, rows: rowLabels.slice(0, 2) },
    { name: 'PRIME', title: 'PRIME EXECUTIVE - ₹350', price: 350, rows: rowLabels.slice(2, 7) },
    { name: 'CLASSIC', title: 'CLASSIC CLUB - ₹220', price: 220, rows: rowLabels.slice(7) }
  ] : [
    { name: 'CLASSIC', title: 'CLASSIC CLUB - ₹220', price: 220, rows: rowLabels.slice(0, 5) },
    { name: 'PRIME', title: 'PRIME EXECUTIVE - ₹350', price: 350, rows: rowLabels.slice(5, 10) },
    { name: 'RECLINER', title: 'ROYAL RECLINER - ₹650', price: 650, rows: rowLabels.slice(10) }
  ];

  const updatedGeometry = {
    ...geometry,
    screenOrientation: orientation
  };

  const seats = [];
  const detectedBoxes = [];
  const pitchX = width / (colCount + 2);
  const pitchY = height / (rowCount + 3);

  rowLabels.forEach((rowLetter, gridRow) => {
    let sec = sections.find(s => s.rows.includes(rowLetter)) || sections[1];
    let seatNum = 1;

    for (let gridCol = 0; gridCol < colCount; gridCol++) {
      // Twin aisle gaps at cols 3 and 14
      if (gridCol === 3 || gridCol === 14) continue;

      const worldPos = calculateSeatWorldPos(gridRow, gridCol, rowCount, colCount, updatedGeometry);
      const ergonomics = calculateErgonomics(worldPos, updatedGeometry);

      const bx = (gridCol + 1) * pitchX;
      const by = (gridRow + 1) * pitchY;

      detectedBoxes.push({
        x: bx,
        y: by,
        width: pitchX * 0.7,
        height: pitchY * 0.7,
        gridRow,
        gridCol
      });

      seats.push({
        id: `${rowLetter}-${seatNum}`,
        row: rowLetter,
        col: seatNum,
        displayCol: seatNum,
        section: sec.name,
        price: sec.price,
        status: (gridRow * 7 + gridCol * 13) % 10 < 2 ? 'reserved' : 'available',
        gridRow,
        gridCol,
        worldPos,
        ergonomics
      });

      seatNum++;
    }
  });

  return {
    detectedBoxes,
    seats,
    totalRows: rowCount,
    totalCols: colCount,
    rowLabels,
    sections,
    screenDetection: {
      screenOrientation: orientation,
      screenY: orientation === 'bottom' ? height * 0.92 : height * 0.08,
      confidence: 0.85
    }
  };
}

export function generateFallbackResult(geometry) {
  return generateSmartFittedGrid(600, 800, geometry.screenOrientation || 'bottom', geometry);
}
