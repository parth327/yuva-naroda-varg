import { useEffect, useRef } from 'react';

// Saffron/gold ambient particle canvas, ported from public/js/particles.js.
// Exposes a startFireworks() burst via a forwarded ref for SuccessPage to
// trigger on mount.
const COLORS = ['rgba(255, 119, 0, ', 'rgba(255, 196, 0, ', 'rgba(255, 153, 51, ', 'rgba(17, 128, 7, '];

class Particle {
  constructor(canvas) {
    this.canvas = canvas;
    this.reset();
  }
  reset() {
    const canvas = this.canvas;
    this.x = Math.random() * canvas.width;
    this.y = canvas.height + Math.random() * 50;
    this.size = Math.random() * 3 + 1;
    this.speedY = -(Math.random() * 1.5 + 0.5);
    this.speedX = Math.sin(Math.random() * 2 * Math.PI) * 0.4;
    this.baseColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.alpha = Math.random() * 0.5 + 0.3;
    this.fadeSpeed = Math.random() * 0.005 + 0.002;
  }
  update() {
    this.y += this.speedY;
    this.x += this.speedX;
    this.alpha -= this.fadeSpeed;
    if (this.alpha <= 0 || this.y < -10 || this.x < 0 || this.x > this.canvas.width) this.reset();
  }
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.baseColor + this.alpha + ')';
    ctx.shadowBlur = this.size * 2;
    ctx.shadowColor = 'rgba(255, 196, 0, 0.5)';
    ctx.fill();
  }
}

export default function ParticleBackground({ fireworksRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let raf;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 45; i++) particles.push(new Particle(canvas));

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.shadowBlur = 0;
      particles.forEach((p) => { p.update(); p.draw(ctx); });
      raf = requestAnimationFrame(animate);
    }
    animate();

    if (fireworksRef) {
      fireworksRef.current = () => {
        for (let i = 0; i < 45; i++) {
          setTimeout(() => {
            const burst = new Particle(canvas);
            burst.x = window.innerWidth / 2 + (Math.random() - 0.5) * 150;
            burst.y = window.innerHeight / 2 + (Math.random() - 0.5) * 150;
            burst.speedY = (Math.random() - 0.5) * 8;
            burst.speedX = (Math.random() - 0.5) * 8;
            burst.size = Math.random() * 6 + 2.5;
            burst.alpha = 1.0;
            burst.fadeSpeed = 0.012;
            particles.push(burst);
            setTimeout(() => {
              const idx = particles.indexOf(burst);
              if (idx > -1) particles.splice(idx, 1);
            }, 2000);
          }, i * 15);
        }
      };
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [fireworksRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    />
  );
}
