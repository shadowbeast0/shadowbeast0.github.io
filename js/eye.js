const WORDS = "attention retrieval agents embeddings gradients pytorch langgraph llamaindex fastapi spring boot next.js graphs transformers segmentation rank one research build ship iterate curiosity kolkata jadavpur shad latency tokens context memory evaluate reason plan tool calls vectors chroma gemini llama datasets benchmarks cora pannuke oslo wcci signal noise".split(" ");
const IRIS = "look closer every model is a lens and every lens bends the light a little ";

function sentence(n, seed) {
  let s = "";
  let k = seed;
  while (s.length < n) {
    k = (k * 9301 + 49297) % 233280;
    s += WORDS[k % WORDS.length] + " ";
  }
  return s;
}

export function startEye(state) {
  const box = document.querySelector(".eye");
  const canvas = box.querySelector(".eye__gl");
  const ctx = canvas.getContext("2d");
  let w = 0, h = 0, dpr = 1;
  let rows = null;
  let iris = null;
  let theme = "";
  let geo = null;

  const palette = () => document.documentElement.dataset.theme === "light"
    ? { text: "rgba(20,20,26,0.62)", lid: "rgba(20,20,26,0.9)", ring: ["#0a6a8a", "#0d8f7a", "#1f4fae", "#0b7fb5"], pupil: "#050507", hl: "rgba(255,255,255,0.9)" }
    : { text: "rgba(235,238,245,0.55)", lid: "rgba(240,242,248,0.95)", ring: ["#6fe7ff", "#3fd6b8", "#7aa8ff", "#a8f0ff"], pupil: "#020203", hl: "rgba(255,255,255,0.85)" };

  const build = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    theme = document.documentElement.dataset.theme;
    const pal = palette();
    const hw = w * 0.47;
    const hh = Math.min(h * 0.4, hw * 0.46);
    const R = hh * 0.92;
    geo = { cx: w / 2, cy: h / 2, hw, hh, R };

    rows = document.createElement("canvas");
    rows.width = canvas.width;
    rows.height = canvas.height;
    const rc = rows.getContext("2d");
    rc.scale(dpr, dpr);
    const fs = Math.max(7, Math.round(w / 95));
    rc.font = `500 ${fs}px "Geist Mono", monospace`;
    rc.fillStyle = pal.text;
    rc.textBaseline = "middle";
    let i = 0;
    for (let y = geo.cy - hh; y <= geo.cy + hh; y += fs * 1.25) {
      rc.fillText(sentence(220, i * 7 + 3), geo.cx - hw, y);
      i++;
    }

    const size = Math.ceil(R * 2 * dpr) + 4;
    iris = document.createElement("canvas");
    iris.width = size;
    iris.height = size;
    const ic = iris.getContext("2d");
    ic.translate(size / 2, size / 2);
    ic.scale(dpr, dpr);
    ic.textAlign = "center";
    ic.textBaseline = "middle";
    const ringCount = 9;
    for (let k = 0; k < ringCount; k++) {
      const rr = R * (0.4 + (k / (ringCount - 1)) * 0.56);
      const rfs = Math.max(6, rr * 0.11);
      ic.font = `600 ${rfs}px "Geist Mono", monospace`;
      ic.fillStyle = pal.ring[k % pal.ring.length];
      ic.globalAlpha = 0.55 + 0.45 * Math.sin(k * 1.7) ** 2;
      const step = rfs * 0.72;
      const n = Math.floor((Math.PI * 2 * rr) / step);
      const text = IRIS.repeat(6);
      for (let j = 0; j < n; j++) {
        const a = (j / n) * Math.PI * 2 + k * 0.4;
        ic.save();
        ic.rotate(a);
        ic.translate(0, -rr);
        ic.fillText(text[(j + k * 5) % text.length], 0, 0);
        ic.restore();
      }
    }
    ic.globalAlpha = 1;
    const shade = ic.createRadialGradient(0, 0, R * 0.3, 0, 0, R);
    shade.addColorStop(0, "rgba(0,0,0,0)");
    shade.addColorStop(1, theme === "light" ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.45)");
    ic.fillStyle = shade;
    ic.beginPath();
    ic.arc(0, 0, R, 0, Math.PI * 2);
    ic.fill();
  };

  const lidPath = (b) => {
    const { cx, cy, hw, hh } = geo;
    ctx.beginPath();
    ctx.moveTo(cx - hw, cy);
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const x = -hw + (2 * hw * i) / steps;
      const k = 1 - (x / hw) ** 2;
      ctx.lineTo(cx + x, cy - hh * Math.pow(Math.max(0, k), 0.85) * b);
    }
    for (let i = steps; i >= 0; i--) {
      const x = -hw + (2 * hw * i) / steps;
      const k = 1 - (x / hw) ** 2;
      ctx.lineTo(cx + x, cy + hh * Math.pow(Math.max(0, k), 0.85) * b * 0.92);
    }
    ctx.closePath();
  };

  const look = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy) || 1;
    const m = Math.min(1, d / 500);
    look.tx = (dx / d) * m;
    look.ty = (dy / d) * m;
  }, { passive: true });

  let blinkAt = performance.now() + 2500;
  let blinkStart = -1;
  canvas.addEventListener("click", () => { blinkStart = performance.now(); });

  let visible = false;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(box);
  window.addEventListener("resize", () => { build(); });
  build();

  let spin = 0;
  let last = performance.now();
  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!visible) return;
    if (document.documentElement.dataset.theme !== theme || canvas.clientWidth !== w) build();
    const moving = !state.paused && !state.reduced;
    if (moving) spin += dt * 0.15;
    look.x += (look.tx - look.x) * 0.08;
    look.y += (look.ty - look.y) * 0.08;
    if (moving && now > blinkAt && blinkStart < 0) blinkStart = now;
    let b = 1;
    if (blinkStart >= 0) {
      const p = (now - blinkStart) / 320;
      if (p >= 1) { blinkStart = -1; blinkAt = now + 3500 + Math.random() * 4000; }
      else b = Math.max(0.04, Math.abs(1 - 2 * p));
    }
    const pal = palette();
    const { cx, cy, hw, hh, R } = geo;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.save();
    lidPath(b);
    ctx.clip();
    ctx.drawImage(rows, 0, 0, w, h);
    const ix = cx + look.x * hw * 0.32;
    const iy = cy + look.y * hh * 0.28;
    ctx.save();
    ctx.translate(ix, iy);
    ctx.rotate(spin);
    ctx.drawImage(iris, -iris.width / dpr / 2, -iris.height / dpr / 2, iris.width / dpr, iris.height / dpr);
    ctx.restore();
    const pr = R * (0.34 + 0.04 * Math.sin(now / 900));
    ctx.fillStyle = pal.pupil;
    ctx.beginPath();
    ctx.arc(ix, iy, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = pal.hl;
    ctx.beginPath();
    ctx.arc(ix - pr * 0.35, iy - pr * 0.4, pr * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    lidPath(b);
    ctx.strokeStyle = pal.lid;
    ctx.lineWidth = 1.6;
    ctx.shadowColor = pal.lid;
    ctx.shadowBlur = theme === "light" ? 0 : 10;
    ctx.stroke();
    ctx.restore();
  };
  requestAnimationFrame(frame);
}
