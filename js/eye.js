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

  const bez = (P, t) => {
    const u = 1 - t;
    return [
      u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0],
      u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1],
    ];
  };
  const lerp2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const lidsAt = (closed) => {
    const { cx, cy, hw, hh } = geo;
    const I = [cx - hw, cy + hh * 0.1];
    const O = [cx + hw, cy - hh * 0.1];
    const lowC1 = [cx + hw * 0.5, cy + hh * 0.98 - closed * hh * 0.2];
    const lowC2 = [cx - hw * 0.42, cy + hh * 1.06 - closed * hh * 0.2];
    const up1 = lerp2([cx - hw * 0.45, cy - hh * 1.42], [cx - hw * 0.42, cy + hh * 0.8], closed);
    const up2 = lerp2([cx + hw * 0.48, cy - hh * 1.18], [cx + hw * 0.5, cy + hh * 0.72], closed);
    return { upper: [I, up1, up2, O], lower: [O, lowC1, lowC2, I], I, O };
  };
  const almond = (c, closed = 0) => {
    const L = lidsAt(closed);
    c.beginPath();
    c.moveTo(...L.upper[0]);
    c.bezierCurveTo(...L.upper[1], ...L.upper[2], ...L.upper[3]);
    c.bezierCurveTo(...L.lower[1], ...L.lower[2], ...L.lower[3]);
    c.closePath();
    return L;
  };
  const sample = (P, n = 90, from = 0, to = 1) => {
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push(bez(P, from + ((to - from) * i) / n));
    return pts;
  };
  const offset = (pts, d) => pts.map((q, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const tx = b[0] - a[0], ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    return [q[0] + (ty / l) * d, q[1] - (tx / l) * d];
  });

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
    dpr = state.lite ? 1 : Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    theme = document.documentElement.dataset.theme;
    const light = theme === "light";
    const pal = palette(light);
    const narrow = w < 900;
    const hw = narrow ? w * 0.46 : Math.min(w * 0.34, h * 0.7);
    const hh = hw * 0.4;
    geo = { cx: narrow ? w * 0.5 : w * 0.63, cy: narrow ? h * 0.36 : h * 0.5, hw, hh, R: hh * 1.02 };

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
    const L = lidsAt(0);
    const upperPts = sample(L.upper);
    const lowerPts = sample(L.lower);
    const lidText = "look closer see further think deeper build braver ";
    [0, 5, 10, 16].forEach((o, i) => textAlong(lc, offset(upperPts, o), lidText, fs + 3 - i, i ? `${pal.lid}${["", "cc", "88", "44"][i]}` : pal.lid));
    [0, 6].forEach((o, i) => textAlong(lc, offset(lowerPts, o), lidText, fs + 1 - i, i ? `${pal.lid}66` : `${pal.lid}cc`));
    const crease = [
      [L.I[0] + hw * 0.14, L.I[1] - hh * 0.5],
      [geo.cx - hw * 0.42, geo.cy - hh * 2.0],
      [geo.cx + hw * 0.46, geo.cy - hh * 1.72],
      [L.O[0] - hw * 0.08, L.O[1] - hh * 0.46],
    ];
    textAlong(lc, sample(crease), "dream think build ", fs, `${pal.lid}55`);
    textAlong(lc, offset(sample(crease, 90, 0.08, 0.9), 7), "dream think build ", fs - 1, `${pal.lid}22`);
    const quad = (A, C, B, n = 14) => {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n, u = 1 - t;
        pts.push([u * u * A[0] + 2 * u * t * C[0] + t * t * B[0], u * u * A[1] + 2 * u * t * C[1] + t * t * B[1]]);
      }
      return pts;
    };
    const lashes = (P, count, from, to, lenFn, sign, curl, alpha) => {
      for (let i = 0; i < count; i++) {
        const t = from + ((to - from) * i) / (count - 1);
        const B0 = bez(P, t);
        const B1 = bez(P, Math.min(1, t + 0.01));
        const tx = B1[0] - B0[0], ty = B1[1] - B0[1];
        const l = Math.hypot(tx, ty) || 1;
        const T = [tx / l, ty / l];
        const N = [T[1] * sign, -T[0] * sign];
        const len = lenFn(t);
        const k = curl(t);
        const C = [B0[0] + N[0] * len * 0.7, B0[1] + N[1] * len * 0.7];
        const E = [B0[0] + N[0] * len * 0.85 + T[0] * len * k, B0[1] + N[1] * len * 0.85 + T[1] * len * k];
        textAlong(lc, quad(B0, C, E), "lashes", Math.max(5, fs - 1), `${pal.lash.replace(/[\d.]+\)$/, alpha + ")")}`);
      }
    };
    const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    lashes(L.upper, 28, 0.12, 0.985, (t) => hh * (0.18 + 0.52 * smooth(0.05, 0.8, t) * (1 - 0.35 * smooth(0.9, 1, t))), 1, (t) => 0.12 + 0.5 * t, 0.7);
    lashes(L.lower, 12, 0.08, 0.66, (t) => hh * (0.22 - 0.16 * t), -1, (t) => -0.35 + 0.1 * t, 0.55);

    const lidShade = mk(canvas.width, canvas.height);
    const sc = lidShade.getContext("2d");
    sc.scale(dpr, dpr);
    almond(sc, 0);
    sc.clip();
    const vg = sc.createRadialGradient(geo.cx, geo.cy, hh * 0.6, geo.cx, geo.cy, hw * 1.05);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, light ? "rgba(0,0,0,0.14)" : "rgba(0,0,0,0.38)");
    sc.fillStyle = vg;
    sc.fillRect(0, 0, w, h);
    sc.filter = "blur(10px)";
    sc.lineWidth = hh * 0.3;
    sc.strokeStyle = light ? "rgba(0,0,0,0.18)" : "rgba(0,0,0,0.42)";
    sc.beginPath();
    sc.moveTo(...L.upper[0]);
    sc.bezierCurveTo(...L.upper[1], ...L.upper[2], ...L.upper[3]);
    sc.stroke();
    sc.filter = "none";
    sc.fillStyle = light ? "rgba(190,100,100,0.28)" : "rgba(255,150,150,0.22)";
    sc.beginPath();
    sc.ellipse(L.I[0] + hw * 0.07, L.I[1] - hh * 0.02, hh * 0.13, hh * 0.1, -0.2, 0, Math.PI * 2);
    sc.fill();

    const R = geo.R;
    const IS = state.lite ? 2 : 3;
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
    shade.addColorStop(0, "rgba(0,0,0,0.2)");
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
    layers = { field, bright, lids, lidShade, iris, rings, isz, IS, pal };
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
    const q = Math.min(1, Math.max(0, (p - 0.3) / 0.42));
    const dive = q * q * (3 - 2 * q);
    const burst = Math.min(1, Math.max(0, (p - 0.68) / 0.3));
    copy.style.opacity = String(1 - Math.min(1, q * 2.2));
    copy.style.transform = `translate3d(0, ${-q * 80}px, 0)`;

    if (live && now > blinkAt && blinkStart < 0 && dive < 0.05) blinkStart = now;
    let closed = 0;
    if (blinkStart >= 0) {
      const t = (now - blinkStart) / 340;
      if (t >= 1) { blinkStart = -1; blinkAt = now + 3800 + Math.random() * 4200; }
      else closed = t < 0.35 ? Math.pow(t / 0.35, 1.6) : 1 - Math.pow((t - 0.35) / 0.65, 0.8);
    }

    const { cx, cy, hw, hh, R } = geo;
    const { field, bright, lids, lidShade, iris, rings, isz, IS, pal } = layers;
    const ix = cx + look.x * hw * 0.3 * (1 - dive);
    const iy = cy - hh * 0.06 + look.y * hh * 0.22 * (1 - dive);
    const zoom = Math.exp(dive * Math.log(42));
    const pr = R * (0.33 + 0.03 * Math.sin(now / 1100) + dive * 0.08);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * (ix - ix * zoom), dpr * (iy - iy * zoom));

    ctx.globalAlpha = Math.max(0, 1 - dive * 3);
    ctx.drawImage(field, 0, 0, w, h);
    ctx.globalAlpha = 1;

    ctx.save();
    almond(ctx, closed);
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
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = R * 0.03;
    ctx.globalAlpha = Math.max(0, 1 - dive * 4);
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.78, Math.PI * 1.08, Math.PI * 1.38);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
    if (closed < 0.02) {
      ctx.globalAlpha = Math.max(0, 1 - dive * 3);
      ctx.drawImage(lidShade, 0, 0, w, h);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    ctx.globalAlpha = Math.max(0, 1 - dive * 3);
    if (closed < 0.02) {
      ctx.drawImage(lids, 0, 0, w, h);
    } else {
      const Lc = lidsAt(closed);
      ctx.strokeStyle = pal.lid;
      ctx.lineWidth = 2.2;
      ctx.shadowColor = pal.lid;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(...Lc.upper[0]);
      ctx.bezierCurveTo(...Lc.upper[1], ...Lc.upper[2], ...Lc.upper[3]);
      ctx.moveTo(...Lc.lower[0]);
      ctx.bezierCurveTo(...Lc.lower[1], ...Lc.lower[2], ...Lc.lower[3]);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;

    if (dive > 0.6) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (dive > 0.985) ctx.clearRect(0, 0, canvas.width, canvas.height);
      const fade = burst < 0.45 ? 1 : 1 - Math.min(1, (burst - 0.45) / 0.5);
      ctx.globalAlpha = Math.min(1, (dive - 0.6) / 0.4) * fade;
      ctx.fillStyle = pal.pupil;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    }
    if (burst > 0 && burst < 1) drawBurst(burst);
  };

  const streaks = Array.from({ length: state.lite ? 240 : 1100 }, () => ({
    a: Math.random() * Math.PI * 2,
    s: 0.35 + Math.pow(Math.random(), 1.4) * 1.1,
    o: Math.random() * 0.25,
    c: Math.random(),
  }));
  const drawBurst = (bt) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cx = w / 2, cy = h / 2;
    const diag = Math.hypot(w, h) * 0.62;
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    const fl = Math.max(0, 1 - Math.abs(bt - 0.12) / 0.14);
    if (fl > 0) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, diag * 0.5);
      g.addColorStop(0, `rgba(255,236,200,${0.85 * fl})`);
      g.addColorStop(0.25, `rgba(255,190,110,${0.35 * fl})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    for (const st of streaks) {
      const t = Math.max(0, (bt - st.o * 0.4) / (1 - st.o * 0.4));
      if (t <= 0) continue;
      const r0 = 6 + Math.pow(t, 1.7) * st.s * diag * 1.25;
      const len = (8 + Math.pow(t, 1.3) * 260) * st.s;
      const x0 = cx + Math.cos(st.a) * r0, y0 = cy + Math.sin(st.a) * r0;
      const x1 = cx + Math.cos(st.a) * (r0 + len), y1 = cy + Math.sin(st.a) * (r0 + len);
      const alpha = Math.sin(Math.PI * Math.min(1, t * 1.05)) * 0.85;
      const col = st.c < 0.55 ? "255,206,130" : st.c < 0.85 ? "190,232,255" : "255,255,255";
      ctx.strokeStyle = `rgba(${col},${alpha * 0.25})`;
      ctx.lineWidth = 3.2 * st.s;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.strokeStyle = `rgba(${col},${alpha})`;
      ctx.lineWidth = 1.1 * st.s;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  };
  requestAnimationFrame(frame);
}
