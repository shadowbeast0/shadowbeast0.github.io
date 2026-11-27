const SPECTRUM = ["#ff3b3b", "#ff8a2b", "#ffe14a", "#4cf08a", "#3fb6ff", "#5b6bff", "#b45bff"];

export function startPrism(state) {
  const section = document.querySelector(".prism");
  const canvas = section.querySelector(".prism__gl");
  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let dpr = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  };
  resize();
  window.addEventListener("resize", resize);

  const pointer = { y: 0.5, ty: 0.5, x: 0.5, tx: 0.5 };
  section.addEventListener("pointermove", (e) => {
    const r = section.getBoundingClientRect();
    pointer.ty = (e.clientY - r.top) / r.height;
    pointer.tx = (e.clientX - r.left) / r.width;
  });

  let visible = false;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(section);

  let t = 0;
  let last = performance.now();
  const lerp = (a, b, k) => a + (b - a) * k;
  const at = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) });

  const draw = (now) => {
    requestAnimationFrame(draw);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!visible) return;
    if (!state.paused && !state.reduced) t += dt;
    pointer.y = lerp(pointer.y, pointer.ty, 0.06);
    pointer.x = lerp(pointer.x, pointer.tx, 0.06);
    const light = document.documentElement.dataset.theme === "light";
    const narrow = w < 900;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const s = narrow ? Math.min(w * 0.55, 300) : Math.min(h * 0.46, w * 0.26, 440);
    const cx = narrow ? w * 0.72 : w * 0.74;
    const cy = narrow ? h * 0.86 : h * 0.5;
    const A = { x: cx, y: cy - s * 0.577 };
    const B = { x: cx - s / 2, y: cy + s * 0.289 };
    const C = { x: cx + s / 2, y: cy + s * 0.289 };

    const wob = Math.sin(t * 0.7) * 0.04;
    const u = Math.min(0.78, Math.max(0.3, 0.3 + pointer.y * 0.5 + wob));
    const entry = at(A, B, u);
    const exit = at(A, C, Math.min(0.85, u * 0.9 + 0.08));
    const src = { x: cx - s * (0.9 + pointer.y * 1.1), y: -10 };

    ctx.globalCompositeOperation = light ? "multiply" : "lighter";

    const beamCol = light ? "rgba(20,20,24,0.85)" : "rgba(255,255,255,0.95)";
    ctx.save();
    ctx.shadowColor = light ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.9)";
    ctx.shadowBlur = 18;
    ctx.strokeStyle = beamCol;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(src.x, src.y);
    ctx.lineTo(entry.x, entry.y);
    ctx.stroke();
    ctx.restore();

    const inner = ctx.createLinearGradient(entry.x, entry.y, exit.x, exit.y);
    inner.addColorStop(0, light ? "rgba(20,20,24,0.5)" : "rgba(255,255,255,0.8)");
    inner.addColorStop(1, light ? "rgba(120,60,160,0.4)" : "rgba(255,230,255,0.6)");
    ctx.strokeStyle = inner;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(entry.x, entry.y);
    ctx.lineTo(exit.x, exit.y);
    ctx.stroke();

    const reach = Math.hypot(w, h);
    const base = 0.08 + (pointer.y - 0.5) * 0.35 + Math.sin(t * 0.5) * 0.02;
    const spread = 0.045 + (pointer.x - 0.5) * 0.02;
    for (let i = 0; i < SPECTRUM.length; i++) {
      const a0 = base + (i - 0.5) * spread;
      const a1 = base + (i + 0.5) * spread;
      const p0 = { x: exit.x + Math.cos(a0) * reach, y: exit.y + Math.sin(a0) * reach };
      const p1 = { x: exit.x + Math.cos(a1) * reach, y: exit.y + Math.sin(a1) * reach };
      const g = ctx.createLinearGradient(exit.x, exit.y, (p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
      g.addColorStop(0, SPECTRUM[i]);
      g.addColorStop(0.35, SPECTRUM[i] + (light ? "aa" : "cc"));
      g.addColorStop(1, SPECTRUM[i] + "00");
      ctx.fillStyle = g;
      ctx.globalAlpha = light ? 0.55 : 0.75;
      ctx.beginPath();
      ctx.moveTo(exit.x, exit.y);
      ctx.lineTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.globalCompositeOperation = "source-over";
    const glass = ctx.createLinearGradient(B.x, A.y, C.x, C.y);
    glass.addColorStop(0, light ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.10)");
    glass.addColorStop(0.5, light ? "rgba(220,225,235,0.35)" : "rgba(255,255,255,0.03)");
    glass.addColorStop(1, light ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.14)");
    ctx.fillStyle = glass;
    ctx.strokeStyle = light ? "rgba(20,20,24,0.35)" : "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const edge = ctx.createLinearGradient(A.x, A.y, C.x, C.y);
    edge.addColorStop(0, "rgba(255,255,255,0)");
    edge.addColorStop(0.5 + Math.sin(t) * 0.3, light ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.8)");
    edge.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = edge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(C.x, C.y);
    ctx.stroke();

    const flare = ctx.createRadialGradient(exit.x, exit.y, 0, exit.x, exit.y, 40);
    flare.addColorStop(0, light ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.85)");
    flare.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = flare;
    ctx.beginPath();
    ctx.arc(exit.x, exit.y, 40, 0, Math.PI * 2);
    ctx.fill();
  };
  requestAnimationFrame(draw);
}
