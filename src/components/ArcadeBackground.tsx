import React, { useEffect, useRef } from 'react';

export const ArcadeBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle pool
    const count = Math.min(45, Math.floor(width / 35));
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2.5 + 1,
      color: ['#06b6d4', '#8b5cf6', '#ec4899', '#3b82f6', '#f59e0b'][Math.floor(Math.random() * 5)],
      alpha: Math.random() * 0.5 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      animId = requestAnimationFrame(render);
      ctx.clearRect(0, 0, width, height);

      // Deep arcade dark background with subtle radial glow
      const grad = ctx.createRadialGradient(width / 2, height / 3, 50, width / 2, height / 2, width * 0.8);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#090d16');
      grad.addColorStop(1, '#05070c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtle cyber grid lines at bottom
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw and move floating glowing particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.03;

        if (p.x < 0) p.x = width;
        else if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        else if (p.y > height) p.y = 0;

        const dynamicAlpha = p.alpha * (0.7 + Math.sin(p.pulse) * 0.3);

        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.globalAlpha = dynamicAlpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 block"
    />
  );
};
