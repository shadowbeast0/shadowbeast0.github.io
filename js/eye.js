const WORDS = "attention retrieval agents embeddings gradients pytorch langgraph llamaindex fastapi spring boot nextjs graphs transformers segmentation research build ship iterate curiosity kolkata jadavpur shad latency tokens context memory evaluate reason plan tools vectors chroma gemini llama datasets benchmarks cora oslo wcci signal noise loss epoch batch softmax tensor kernel inference rag prompt judge".split(" ");
const IRIS = "every model is a lens and every lens bends the light a little closer look again ";

const mono = (px, weight = 500) => `${weight} ${px}px "Geist Mono", ui-monospace, monospace`;

function words(n, seed) {
  let s = "";
  let k = seed;
  while (s.length < n) {
    k = (k * 9301 + 49297) % 233280;
    s += WORDS[k % WORDS.length] + " ";
  }
  return s;
}

function palette(light) {
  return light
    ? { dim: "rgba(20,22,30,0.13)", bright: "rgba(15,17,24,0.82)", lid: "#0b0c12", lash: "rgba(10,12,18,0.85)", rays: ["#9a5a05", "#0a7c72", "#0d5fae", "#0a3f7a"], ring: "#0b3a63", pupil: "#030305", glint: "rgba(255,255,255,0.75)" }
    : { dim: "rgba(220,228,245,0.12)", bright: "rgba(236,240,250,0.78)", lid: "#ffffff", lash: "rgba(255,255,255,0.85)", rays: ["#ffd48a", "#45f0d2", "#56b4ff", "#2f6dff"], ring: "#9ed8ff", pupil: "#010102", glint: "rgba(255,255,255,0.9)" };
}

export function startEye(state) {
  const section = document.querySelector(".about");
  const canvas = section.querySelector(".eye__gl");
  const copy = section.querySelector(".about__copy");
  const ctx = canvas.getContext("2d");
  let w = 0, h = 0, dpr = 1;
  let geo = null;
  let layers = null;
  let theme = "";

  const almond = (c, b, grow = 0) => {
    const { cx, cy, hw, hh } = geo;
    const steps = 64;
    c.beginPath();
    for (let i = 0; i <= steps; i++) {
      const x = -hw + (2 * hw * i) / steps;
      const k = Math.max(0, 1 - (x / hw) ** 2);
      const y = cy - (hh + grow) * Math.pow(k, 0.8) * b;
      i ? c.lineTo(cx + x, y) : c.moveTo(cx + x, y);
    }
    for (let i = steps; i >= 0; i--) {
      const x = -hw + (2 * hw * i) / steps;
      const k = Math.max(0, 1 - (x / hw) ** 2);
      c.lineTo(cx + x, cy + (hh * 0.86 + grow) * Math.pow(k, 0.85) * b);
    }
    c.closePath();
  };

  const textAlong = (c, pts, str, size, color) => {
    c.font = mono(size, 600);
    c.fillStyle = color;
    let s = 0;
    let ci = 0;
    const step = size * 0.62;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const seg = Math.hypot(x1 - x0, y1 - y0);
      const ang = Math.atan2(y1 - y0, x1 - x0);
      while (s < seg) {
        const t = s / seg;
        c.save();
        c.translate(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
        c.rotate(ang);
        c.fillText(str[ci % str.length], 0, size * 0.35);
        c.restore();
        ci++;
        s += step;
      }
      s -= seg;
    }
  };

  const build = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    theme = document.documentElement.dataset.theme;
    const light = theme === "light";
    const pal = palette(light);
    const narrow = w < 900;
    const hw = narrow ? w * 0.46 : Math.min(w * 0.34, h * 0.7);
    const hh = hw * 0.44;
    geo = { cx: narrow ? w * 0.5 : w * 0.63, cy: narrow ? h * 0.36 : h * 0.5, hw, hh, R: hh * 0.96 };

    const mk = (cw, ch) => { const c = document.createElement("canvas"); c.width = cw; c.height = ch; return c; };
    const field = mk(canvas.width, canvas.height);
    const bright = mk(canvas.width, canvas.height);
    const fs = Math.max(7, Math.round(Math.min(w, 1600) / 150));
    for (const [cv, col] of [[field, pal.dim], [bright, pal.bright]]) {
      const c = cv.getContext("2d");
      c.scale(dpr, dpr);
      c.font = mono(fs);
      c.fillStyle = col;
      c.textBaseline = "middle";
      let i = 0;
      for (let y = fs; y < h; y += fs * 1.32) {
        c.fillText(words(Math.ceil(w / (fs * 0.55)) + 20, i * 13 + 5), -((i * 37) % 60), y);
        i++;
      }
    }

    const lids = mk(canvas.width, canvas.height);
    const lc = lids.getContext("2d");
    lc.scale(dpr, dpr);
    const curve = (sign, off, k = 0.8) => {
      const pts = [];
      for (let i = 0; i <= 80; i++) {
        const x = -hw + (2 * hw * i) / 80;
        const q = Math.max(0, 1 - (x / hw) ** 2);
        pts.push([geo.cx + x, geo.cy + sign * ((sign < 0 ? hh : hh * 0.86) + off) * Math.pow(q, k)]);
      }
      return pts;
    };
    const lidText = "look closer see further think deeper build braver ";
    [0, 6, 12, 19].forEach((o, i) => textAlong(lc, curve(-1, o), lidText, fs + 3 - i, i ? `${pal.lid}${["", "cc", "88", "44"][i]}` : pal.lid));
    [0, 7].forEach((o, i) => textAlong(lc, curve(1, o, 0.85), lidText, fs + 2 - i, i ? `${pal.lid}77` : pal.lid));
    lc.font = mono(fs, 600);
    lc.fillStyle = pal.lash;
    for (let i = 0; i < 26; i++) {
      const t = -0.86 + (1.72 * i) / 25;
      const x = t * hw;
      const q = Math.max(0, 1 - t * t);
      const y = geo.cy - (hh + 20) * Math.pow(q, 0.8);
      const ang = -Math.PI / 2 + t * 1.1;
      const len = 26 + 34 * q;
      lc.save();
      lc.translate(geo.cx + x, y);
      lc.rotate(ang);
      for (let s = 0; s < len; s += fs * 0.7) lc.fillText("lens"[Math.floor(s) % 4], s, 0);
      lc.restore();
    }

    const R = geo.R;
    const IS = 3;
    const isz = Math.ceil(R * 2 * dpr * IS) + 8;
    const iris = mk(isz, isz);
    const ic = iris.getContext("2d");
    ic.translate(isz / 2, isz / 2);
    ic.scale(dpr * IS, dpr * IS);
    ic.textBaseline = "middle";
    const rayFs = Math.max(5, R * 0.055);
    ic.font = mono(rayFs, 600);
    const rays = Math.floor((Math.PI * 2 * R * 0.4) / (rayFs * 0.85));
    const text = IRIS.repeat(20);
    for (let j = 0; j < rays; j++) {
      const a = (j / rays) * Math.PI * 2;
      ic.save();
      ic.rotate(a);
      let ci = j * 7;
      for (let r = R * 0.36; r < R * 0.97; r += rayFs * 0.62) {
        const x = (r - R * 0.36) / (R * 0.61);
        const col = x < 0.16 ? pal.rays[0] : x < 0.55 ? pal.rays[1] : x < 0.85 ? pal.rays[2] : pal.rays[3];
        ic.fillStyle = col;
        ic.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(j * 0.37 + x * 5));
        ic.fillText(text[ci++ % text.length], r, 0);
      }
      ic.restore();
    }
    ic.globalAlpha = 1;
    const shade = ic.createRadialGradient(0, 0, R * 0.34, 0, 0, R);
    shade.addColorStop(0, "rgba(0,0,0,0.35)");
    shade.addColorStop(0.18, "rgba(0,0,0,0)");
    shade.addColorStop(0.82, "rgba(0,0,0,0)");
    shade.addColorStop(1, light ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.7)");
    ic.fillStyle = shade;
    ic.beginPath();
    ic.arc(0, 0, R, 0, Math.PI * 2);
    ic.fill();

    const rings = mk(isz, isz);
    const rc = rings.getContext("2d");
    rc.translate(isz / 2, isz / 2);
    rc.scale(dpr * IS, dpr * IS);
    rc.textAlign = "center";
    rc.textBaseline = "middle";
    for (const [rr, size, col, alpha] of [[R * 0.5, R * 0.05, pal.rays[0], 0.9], [R * 0.985, R * 0.05, pal.ring, 0.85]]) {
      rc.font = mono(size, 700);
      rc.fillStyle = col;
      rc.globalAlpha = alpha;
      const n = Math.floor((Math.PI * 2 * rr) / (size * 0.66));
      for (let j = 0; j < n; j++) {
        rc.save();
        rc.rotate((j / n) * Math.PI * 2);
        rc.translate(0, -rr);
        rc.fillText(text[j % text.length], 0, 0);
        rc.restore();
      }
    }
    layers = { field, bright, lids, iris, rings, isz, IS, pal };
  };

  const look = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener("pointermove", (e) => {
    if (!geo) return;
    const r = canvas.getBoundingClientRect();
    const dx = e.clientX - (r.left + geo.cx);
    const dy = e.clientY - (r.top + geo.cy);
    const d = Math.hypot(dx, dy) || 1;
    const m = Math.min(1, d / 600);
    look.tx = (dx / d) * m;
    look.ty = (dy / d) * m;
  }, { passive: true });

  let blinkAt = performance.now() + 2200;
  let blinkStart = -1;
  canvas.addEventListener("click", () => { blinkStart = performance.now(); });

  let visible = false;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(section);
  let rt = 0;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(build, 150); });
  build();

  let spin = 0;
  let last = performance.now();
  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!visible) return;
    if (document.documentElement.dataset.theme !== theme) build();
    const live = !state.paused && !state.reduced;
    if (live) spin += dt;
    look.x += (look.tx - look.x) * 0.08;
    look.y += (look.ty - look.y) * 0.08;

    const sr = section.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -sr.top / Math.max(1, sr.height - innerHeight)));
    const q = Math.min(1, Math.max(0, (p - 0.42) / 0.58));
    const dive = q * q * (3 - 2 * q);
    copy.style.opacity = String(1 - Math.min(1, q * 2.2));
    copy.style.transform = `translate3d(0, ${-q * 80}px, 0)`;

    if (live && now > blinkAt && blinkStart < 0 && dive < 0.05) blinkStart = now;
    let b = 1;
    if (blinkStart >= 0) {
      const t = (now - blinkStart) / 300;
      if (t >= 1) { blinkStart = -1; blinkAt = now + 3800 + Math.random() * 4200; }
      else b = Math.max(0.03, Math.abs(1 - 2 * t));
    }

    const { cx, cy, hw, hh, R } = geo;
    const { field, bright, lids, iris, rings, isz, IS, pal } = layers;
    const ix = cx + look.x * hw * 0.3 * (1 - dive);
    const iy = cy + look.y * hh * 0.26 * (1 - dive);
    const zoom = Math.exp(dive * Math.log(42));
    const pr = R * (0.33 + 0.03 * Math.sin(now / 1100) + dive * 0.08);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * (ix - ix * zoom), dpr * (iy - iy * zoom));

    ctx.globalAlpha = Math.max(0, 1 - dive * 3);
    ctx.drawImage(field, 0, 0, w, h);
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.translate(0, cy);
    ctx.scale(1, b);
    ctx.translate(0, -cy);
    almond(ctx, 1);
    ctx.clip();
    ctx.globalAlpha = Math.max(0, 1 - dive * 3);
    ctx.drawImage(bright, 0, 0, w, h);
    ctx.globalAlpha = 1;
    const isd = isz / (dpr * IS);
    ctx.save();
    ctx.translate(ix, iy);
    ctx.save();
    ctx.rotate(spin * 0.06);
    ctx.drawImage(iris, -isd / 2, -isd / 2, isd, isd);
    ctx.restore();
    ctx.save();
    ctx.rotate(-spin * 0.12);
    ctx.drawImage(rings, -isd / 2, -isd / 2, isd, isd);
    ctx.restore();
    const glint = ctx.createConicGradient(spin * 0.4, 0, 0);
    glint.addColorStop(0, "rgba(255,255,255,0)");
    glint.addColorStop(0.08, theme === "light" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.22)");
    glint.addColorStop(0.16, "rgba(255,255,255,0)");
    glint.addColorStop(1, "rgba(255,255,255,0)");
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = glint;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    const pg = ctx.createRadialGradient(0, 0, pr * 0.85, 0, 0, pr * 1.08);
    pg.addColorStop(0, pal.pupil);
    pg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(0, 0, pr * 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = pal.glint;
    ctx.globalAlpha = Math.max(0, 1 - dive * 4);
    ctx.beginPath();
    ctx.ellipse(-pr * 0.38, -pr * 0.42, pr * 0.16, pr * 0.11, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pr * 0.3, pr * 0.34, pr * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.restore();

    ctx.save();
    ctx.translate(0, cy);
    ctx.scale(1, b);
    ctx.translate(0, -cy);
    ctx.globalAlpha = Math.max(0, 1 - dive * 3);
    ctx.drawImage(lids, 0, 0, w, h);
    ctx.restore();

    if (dive > 0.6) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = Math.min(1, (dive - 0.6) / 0.4);
      ctx.fillStyle = pal.pupil;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    }
  };
  requestAnimationFrame(frame);
}
