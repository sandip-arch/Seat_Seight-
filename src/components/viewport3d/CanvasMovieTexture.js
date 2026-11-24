/**
 * Generates an animated cinematic canvas texture.
 * Draws dynamic cinematic scenes (sci-fi deep space nebula, laser projector beams,
 * film grain, and title elements) without external video assets or CORS issues.
 */
export class CinematicScreenCanvas {
  constructor(width = 1280, height = 720) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');
    this.time = 0;
    this.stars = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.2
    }));
  }

  update(isPlaying = true) {
    if (!this.ctx) return;
    if (isPlaying) {
      this.time += 0.025;
    }

    const { ctx, canvas, time } = this;
    const w = canvas.width;
    const h = canvas.height;

    // Cinematic deep cosmic background gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    const r1 = Math.sin(time * 0.5) * 20 + 25;
    const g1 = Math.sin(time * 0.7) * 25 + 30;
    const b1 = Math.sin(time * 0.3) * 45 + 75;
    grad.addColorStop(0, `rgb(${Math.round(r1)}, ${Math.round(g1)}, ${Math.round(b1)})`);
    grad.addColorStop(0.5, '#050814');
    grad.addColorStop(1, '#020308');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Glowing Nebula clouds
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const numClouds = 3;
    for (let i = 0; i < numClouds; i++) {
      const cx = w * 0.5 + Math.cos(time * 0.3 + i * 2) * (w * 0.3);
      const cy = h * 0.5 + Math.sin(time * 0.4 + i * 2) * (h * 0.25);
      const rad = h * 0.45;
      const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      if (i === 0) {
        radGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        radGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      } else if (i === 1) {
        radGrad.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
        radGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
      } else {
        radGrad.addColorStop(0, 'rgba(30, 168, 60, 0.35)');
        radGrad.addColorStop(1, 'rgba(30, 168, 60, 0)');
      }
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Drifting starfield
    ctx.fillStyle = '#ffffff';
    this.stars.forEach((star) => {
      if (isPlaying) {
        star.x -= star.speed;
        if (star.x < 0) star.x = w;
      }
      ctx.globalAlpha = Math.sin(time * 2 + star.x) * 0.3 + 0.7;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Cinematic Horizon Grid Lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.lineWidth = 1.5;
    const horizonY = h * 0.65;
    for (let x = -w * 0.5; x <= w * 1.5; x += 100) {
      ctx.beginPath();
      ctx.moveTo(w * 0.5, horizonY);
      ctx.lineTo(x + Math.sin(time) * 20, h);
      ctx.stroke();
    }

    // Cinematic Film Title Overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = '800 52px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(56, 189, 248, 0.8)';
    ctx.shadowBlur = 24;
    ctx.fillText('SEAT SIGHT 3D', w / 2, h / 2 - 20);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.font = '600 22px Inter, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('ANATOMICAL CINEMA AUDITORIUM SIMULATOR', w / 2, h / 2 + 30);

    // Audio / Aspect Ratio Tag
    ctx.font = '500 16px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    const minutes = Math.floor(time / 60).toString().padStart(2, '0');
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    const millis = Math.floor((time * 100) % 100).toString().padStart(2, '0');
    ctx.fillText(`DOLBY ATMOS 7.1.4  •  4K DCI LASER  •  TC [01:${minutes}:${seconds}:${millis}]`, w / 2, h / 2 + 75);

    // Playback state badge
    if (!isPlaying) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(w / 2 - 80, h - 90, 160, 40);
      ctx.fillStyle = '#f5a623';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('❚❚ PAUSED', w / 2, h - 65);
    }
  }

  getCanvas() {
    return this.canvas;
  }
}
