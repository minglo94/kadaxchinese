import { useEffect, useRef } from "react";

type Point = {
  x: number;
  y: number;
  w: number;
  life: number;
};

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

export function BrushTrail({
  enabled,
  dark,
}: {
  enabled: boolean;
  dark: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;
    const points: Point[] = [];
    let lastX = 0;
    let lastY = 0;
    let lastT = 0;
    let lastSpeed = 0;
    let dirty = false;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ink = dark ? "235, 228, 214" : "28, 25, 21";

    const drawNib = (x: number, y: number, width: number, alpha: number, angle: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = `rgba(${ink},${alpha})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, width * 0.55, width * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const tick = () => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      if (!dirty && points.length === 0) return;

      ctx.clearRect(0, 0, w, h);

      for (let i = points.length - 1; i >= 0; i--) {
        points[i].life -= 0.016;
        if (points[i].life <= 0) points.splice(i, 1);
      }

      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1;
        const angle = Math.atan2(dy, dx) + Math.PI / 2;
        const steps = Math.max(1, Math.ceil(dist / 2.4));
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const x = a.x + dx * t;
          const y = a.y + dy * t;
          const width = a.w + (b.w - a.w) * t;
          const alpha = Math.max(0, (a.life + (b.life - a.life) * t) * 0.28);
          drawNib(x, y, width, alpha, angle);
        }
      }

      dirty = points.length > 0;
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const now = performance.now();
      const dt = Math.max(8, now - (lastT || now));
      const x = event.clientX;
      const y = event.clientY;
      const dist = lastT ? Math.hypot(x - lastX, y - lastY) : 0;
      const speed = dist / dt;
      const width = 13.5 - clamp(speed / 1.35, 0, 1) * 11.2;
      points.push({ x, y, w: width, life: 1 });
      if (points.length > 90) points.shift();

      if (lastT && lastSpeed - speed > 0.55 && Math.random() > 0.55) {
        const splat = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < splat; i++) {
          points.push({
            x: x + (Math.random() - 0.5) * 18,
            y: y + (Math.random() - 0.5) * 18,
            w: 1.2 + Math.random() * 2.4,
            life: 0.55 + Math.random() * 0.3,
          });
        }
      }

      lastX = x;
      lastY = y;
      lastT = now;
      lastSpeed = speed;
      dirty = true;
    };

    const onLeave = () => {
      lastT = 0;
    };

    const onVisibility = () => {
      if (document.hidden) points.length = 0;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, dark]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[1]"
      aria-hidden="true"
    />
  );
}
