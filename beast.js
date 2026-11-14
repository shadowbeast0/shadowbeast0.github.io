/* Shad the shadow beast: an original, faceted wolf-head emblem made of shadow.
   Stage 0 = Shad (round-eyed pup), 1 = Shadow (slit eyes, war-mark), 2 = ShadowBeast (horns, fangs, blazing markings).
   Drag it, throw it, click it to make it roar. Wisps of shadow flicker around it frame by frame. */
(function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const NS = 'http://www.w3.org/2000/svg';

  /* shared glow filter, defined once per page */
  function installDefs() {
    if (document.getElementById('bs-defs')) return;
    const s = document.createElementNS(NS, 'svg');
    s.id = 'bs-defs'; s.setAttribute('width', '0'); s.setAttribute('height', '0'); s.setAttribute('aria-hidden', 'true'); s.style.position = 'absolute';
    s.innerHTML = `<defs>
      <filter id="bs-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.2"/></filter>
      <filter id="bs-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.4"/></filter>
      <linearGradient id="bs-horn" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#F4ECDC"/><stop offset=".7" stop-color="#E9DCC0"/><stop offset="1" stop-color="#E4262B"/></linearGradient>
    </defs>`;
    document.body.prepend(s);
  }
  if (document.body) installDefs(); else document.addEventListener('DOMContentLoaded', installDefs);

  const P = (pts) => pts.map((p) => p.join(',')).join(' ');
  const mir = (pts) => pts.map(([x, y]) => [200 - x, y]);

  // facet shades: left side catches the light, right side falls into shadow
  const SH = { c0: '#0C0912', c1: '#191326', c2: '#282040', c3: '#3B2F5E', c4: '#56467F' };

  function geometry(st) {
    // ears get taller and cheeks spikier as it evolves
    const ear = [34, 14, 6][st], cheek = [32, 24, 18][st], jaw = [42, 34, 28][st];
    const L = {
      T: [100, 42], B1: [80, 48], ET: [56 - st * 2, ear], EB: [44, 72], EI: [70, 58],
      C1: [cheek, 100], C2: [46, 106], J1: [jaw, 136], J2: [60, 134], M1: [78, 158], CH: [100, 176],
      S1: [82, 114], EYE: [60, 96], SN: [84, 110],
    };
    const outlineL = [L.T, L.B1, L.ET, L.EB, L.C1, L.C2, L.J1, L.J2, L.M1, L.CH];
    const outline = [...outlineL, ...mir(outlineL.slice(0, -1)).reverse()];
    const facets = [
      [[L.T, L.B1, L.EI, [100, 92]], 'c3', 'c2'],
      [[L.B1, L.ET, L.EB, L.EI], 'c2', 'c1'],
      [[L.EI, L.EB, L.C1, L.EYE], 'c2', 'c1'],
      [[L.EYE, L.C1, L.C2, L.S1, L.SN], 'c1', 'c0'],
      [[L.C2, L.J1, L.J2, L.M1, L.S1], 'c2', 'c1'],
      [[L.EI, L.EYE, L.SN, [100, 104], [100, 92]], 'c0', 'c0'],
      [[L.SN, [100, 104], [100, 148], [86, 136]], 'c4', 'c3'],
      [[L.S1, [86, 136], [100, 148], [100, 176], L.M1], 'c2', 'c1'],
    ];
    const earIn = [[L.ET[0] + 4, L.ET[1] + 16], [52, 64], [68, 58]];
    return { L, outline, facets, earIn };
  }

  /* the whole emblem as an SVG string (without ground shadow) */
  function head(st, o = {}) {
    const { blink = false, roar = 0, flash = 0 } = o;
    const g = geometry(st);
    let s = '';
    // horns sit behind the head (final form)
    if (st === 2) {
      const horn = 'M60 72 C40 66 22 50 14 22 C30 42 44 52 66 58Z';
      const ridges = 'M44 62 l-3 7 M32 52 l-4 6 M23 40 l-5 4';
      s += `<path d="${horn}" fill="url(#bs-horn)" stroke="#000" stroke-width="3.5" stroke-linejoin="round"/><path d="${ridges}" stroke="#9C8E74" stroke-width="2" stroke-linecap="round"/>`;
      s += `<g transform="translate(200 0) scale(-1 1)"><path d="${horn}" fill="url(#bs-horn)" stroke="#000" stroke-width="3.5" stroke-linejoin="round"/><path d="${ridges}" stroke="#9C8E74" stroke-width="2" stroke-linecap="round"/></g>`;
    }
    // base silhouette + facets
    s += `<polygon points="${P(g.outline)}" fill="${SH.c1}"/>`;
    g.facets.forEach(([pts, l, r]) => { s += `<polygon points="${P(pts)}" fill="${SH[l]}"/><polygon points="${P(mir(pts))}" fill="${SH[r]}"/>`; });
    s += `<polygon points="${P(g.earIn)}" fill="#8E1B22"/><polygon points="${P(mir(g.earIn))}" fill="#6E141A"/>`;
    // rim light along the top-left edges
    s += `<polyline points="${P([g.L.C1, g.L.EB, g.L.ET, g.L.B1, g.L.T])}" fill="none" stroke="#8B5CF6" stroke-width="2.5" stroke-linejoin="round" opacity=".9"/>`;

    // war-markings
    const hot = st === 2 ? '#FF3B3B' : '#FFD60A';
    if (st >= 1) {
      const mark = 'M90 56 L100 76 L110 56';
      s += `<path d="${mark}" fill="none" stroke="${hot}" stroke-width="7" filter="url(#bs-glow)" opacity=".8"/><path d="${mark}" fill="none" stroke="${st === 2 ? '#FFD60A' : '#FFF3B0'}" stroke-width="2.6" stroke-linejoin="round"/>`;
    }
    if (st === 2) {
      const slash = 'M38 114 l16 -5 M42 124 l14 -4';
      [slash].forEach((d) => {
        s += `<path d="${d}" stroke="#FF3B3B" stroke-width="6" stroke-linecap="round" filter="url(#bs-glow)"/><path d="${d}" stroke="#FFD60A" stroke-width="2.2" stroke-linecap="round"/>`;
        s += `<g transform="translate(200 0) scale(-1 1)"><path d="${d}" stroke="#FF3B3B" stroke-width="6" stroke-linecap="round" filter="url(#bs-glow)"/><path d="${d}" stroke="#FFD60A" stroke-width="2.2" stroke-linecap="round"/></g>`;
      });
    }

    // eyes (a separate group so they can follow the cursor)
    let e = '';
    if (st === 0) {
      [[78, 92], [122, 92]].forEach(([x, y]) => {
        if (blink) { e += `<path d="M${x - 10} ${y + 1} Q${x} ${y + 6} ${x + 10} ${y + 1}" fill="none" stroke="#FFD60A" stroke-width="3" stroke-linecap="round"/>`; return; }
        e += `<circle cx="${x}" cy="${y}" r="13" fill="#FFD60A" filter="url(#bs-glow)" opacity=".55"/><circle cx="${x}" cy="${y}" r="11" fill="#FFF7D1" stroke="#000" stroke-width="2.5"/>`;
        e += `<g class="bs-pupil"><circle cx="${x}" cy="${y + 1}" r="6.5" fill="#1A1028"/><circle cx="${x - 2.5}" cy="${y - 2.5}" r="2.4" fill="#fff"/></g>`;
      });
    } else {
      const eyeL = [[60, 84], [90, 95], [85, 102], [64, 93]];
      const core = st === 2 ? '#FFE15A' : '#FFD60A', halo = st === 2 ? '#FF3B3B' : '#FFD60A';
      [eyeL, mir(eyeL)].forEach((pts, i) => {
        if (blink) { const a = pts[0], b = pts[1]; e += `<path d="M${a[0]} ${a[1] + 6} L${b[0]} ${b[1] + 2}" stroke="${core}" stroke-width="2.4" stroke-linecap="round"/>`; return; }
        e += `<polygon points="${P(pts)}" fill="${halo}" filter="url(#bs-glow)" opacity="${0.75 + flash * 0.25}"/>`;
        e += `<polygon points="${P(pts)}" fill="${core}" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/>`;
        const cx = i ? 124 : 76, cy = 93;
        e += `<g class="bs-pupil"><rect x="${cx - 1.6}" y="${cy - 6}" width="3.2" height="10" rx="1.6" fill="#2A0A0E"/></g>`;
      });
      // brow ridge
      s += `<path d="M56 80 L90 90 M144 80 L110 90" stroke="${SH.c4}" stroke-width="3" stroke-linecap="round"/>`;
    }
    s += `<g class="bs-eyes">${e}</g>`;

    // mouth + jaw: the jaw drops when it roars
    const drop = roar * 14;
    if (roar > 0.05) {
      s += `<polygon points="80,150 120,150 ${114} ${168 + drop} ${86} ${168 + drop}" fill="#3A0610"/>`;
      s += `<polygon points="88,${160 + drop} 112,${160 + drop} 100,${150 + drop * 0.6}" fill="#E4262B"/>`;
      s += `<polygon points="84,150 92,150 88,${162 + roar * 4}" fill="#fff" stroke="#000" stroke-width="1.2"/><polygon points="108,150 116,150 112,${162 + roar * 4}" fill="#fff" stroke="#000" stroke-width="1.2"/>`;
    } else if (st === 2) {
      s += `<polygon points="86,158 92,158 89,168" fill="#fff" stroke="#000" stroke-width="1.2"/><polygon points="108,158 114,158 111,168" fill="#fff" stroke="#000" stroke-width="1.2"/>`;
    }
    s += `<g transform="translate(0 ${drop})"><polygon points="78,158 100,166 122,158 100,176" fill="${SH.c1}"/><polygon points="78,158 100,166 100,176" fill="${SH.c2}"/></g>`;
    // nose
    s += `<polygon points="90,142 110,142 100,154" fill="#000"/><path d="M93 144 L99 144" stroke="#6B5A92" stroke-width="2" stroke-linecap="round"/>`;
    // ink outline over everything
    const out = g.outline.map((p, i) => (i === g.outline.length - 1 ? p : p));
    s += `<polygon points="${P(out.map(([x, y]) => [x, y > 150 && x > 70 && x < 130 ? y + (y > 160 ? drop : 0) : y]))}" fill="none" stroke="#000" stroke-width="4.5" stroke-linejoin="round"/>`;
    return s;
  }

  /* shadow wisps around the head, 8 flipbook frames */
  function wisps(st, f, flare = 0) {
    const n = [5, 9, 13][st], len0 = [14, 22, 30][st] * (1 + flare * 0.9);
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (1.05 + (0.9 * i) / (n - 1)) + Math.sin(f * 0.8 + i) * 0.04;
      const dx = Math.cos(a), dy = Math.sin(a), px = -dy, py = dx;
      const r = 50 + (i % 2) * 6, len = len0 * (0.7 + 0.45 * Math.abs(Math.sin(f * 0.9 + i * 1.7))), w = 9 + (i % 3) * 2;
      const bx = 100 + dx * r, by = 100 + dy * r, sway = Math.sin(f * 1.3 + i) * 6;
      const tx = bx + dx * len + px * sway, ty = by + dy * len + py * sway;
      const d = `M${bx + px * w} ${by + py * w} Q${bx + dx * len * 0.5 + px * w * 0.9} ${by + dy * len * 0.5 + py * w * 0.9} ${tx} ${ty} Q${bx + dx * len * 0.5 - px * w * 0.7} ${by + dy * len * 0.5 - py * w * 0.7} ${bx - px * w} ${by - py * w}Z`;
      const hot = st === 2 && i % 3 === 1;
      s += `<path d="${d}" fill="${hot ? '#5A0E1A' : '#1E1530'}" stroke="${hot ? '#FF3B3B' : '#8B5CF6'}" stroke-width="2" stroke-linejoin="round"/>`;
    }
    return s;
  }

  const SCALE = [0.8, 0.9, 1];
  function markup(st) {
    return `<ellipse cx="100" cy="192" rx="52" ry="6" fill="rgba(0,0,0,.25)"/><g transform="translate(100 110) scale(${SCALE[st]}) translate(-100 -110)">${wisps(st, 2)}${head(st)}</g>`;
  }

  /* ---------------- the live beast ---------------- */
  const all = new Set();
  let mouse = { x: -9999, y: -9999 };
  addEventListener('pointermove', (e) => { mouse = { x: e.clientX, y: e.clientY }; }, { passive: true });

  class Beast {
    constructor(svg, { stage = 0, draggable = true, reduce = false, onPoke, onLand } = {}) {
      installDefs();
      Object.assign(this, { svg, draggable, reduce, onPoke, onLand });
      this.x = 0; this.y = 0; this.vx = 0; this.vy = 0; this.rot = 0; this.vrot = 0; this.sq = 1; this.vsq = 0;
      this.t = rand(0, 10); this.blinkT = rand(1.5, 3); this.roar = 0; this.flash = 0; this.shake = 0; this.pop = 1;
      this.look = [0, 0]; this.drag = false; this.down = null; this.fx = []; this.wf = 0; this.wt = 0; this.visible = true; this.key = '';
      svg.innerHTML = `<ellipse class="bs-shadow" cx="100" cy="192" rx="52" ry="6" fill="rgba(0,0,0,.25)"/><g class="bs-root"><g class="bs-wisps"></g><g class="bs-head"></g></g><g class="bs-fx"></g>`;
      this.gShadow = svg.querySelector('.bs-shadow'); this.gRoot = svg.querySelector('.bs-root');
      this.gWisps = svg.querySelector('.bs-wisps'); this.gHead = svg.querySelector('.bs-head'); this.gFx = svg.querySelector('.bs-fx');
      this.stage = stage; this.build(); this.bind(); all.add(this);
      if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; }).observe(svg);
      this.render();
    }
    setStage(s, drop) {
      if (s === this.stage) return;
      this.stage = s; this.key = ''; this.build();
      if (drop && !this.reduce) { this.pop = 0.2; this.vpop = 0; this.burstRings(3); this.flash = 1; }
    }
    build() {
      const blink = this.blinkT < 0;
      const roar = Math.round(this.roar * 6) / 6, flash = Math.round(this.flash * 4) / 4;
      const key = `${this.stage}|${blink}|${roar}|${flash}`;
      if (key !== this.key) { this.key = key; this.gHead.innerHTML = head(this.stage, { blink, roar, flash }); this.eyes = this.gHead.querySelector('.bs-eyes'); this.pupils = this.gHead.querySelectorAll('.bs-pupil'); }
    }
    toSvg(cx, cy) { const m = this.svg.getScreenCTM(); if (!m) return { x: 0, y: 0 }; const p = this.svg.createSVGPoint(); p.x = cx; p.y = cy; return p.matrixTransform(m.inverse()); }
    bind() {
      const svg = this.svg;
      svg.addEventListener('pointerdown', (e) => {
        if (e.button > 0) return;
        const p = this.toSvg(e.clientX, e.clientY);
        this.down = { x: p.x, y: p.y, ox: p.x - this.x, oy: p.y - this.y }; this.hist = [{ x: p.x, y: p.y, t: performance.now() }];
        if (this.draggable) { try { svg.setPointerCapture(e.pointerId); } catch (err) {} e.preventDefault(); }
      });
      svg.addEventListener('pointermove', (e) => {
        if (!this.down) return;
        const p = this.toSvg(e.clientX, e.clientY);
        if (!this.drag && this.draggable && Math.hypot(p.x - this.down.x, p.y - this.down.y) > 5) { this.drag = true; svg.classList.add('grabbing'); }
        if (this.drag) { this.target = [clamp(p.x - this.down.ox, -90, 90), clamp(p.y - this.down.oy, -110, 40)]; this.hist.push({ x: p.x, y: p.y, t: performance.now() }); if (this.hist.length > 6) this.hist.shift(); }
      });
      svg.addEventListener('pointerup', () => {
        if (!this.down) return;
        if (this.drag) {
          const a = this.hist[0], b = this.hist[this.hist.length - 1], dt = Math.max(16, b.t - a.t) / 1000;
          this.vx = clamp((b.x - a.x) / dt, -1800, 1800); this.vy = clamp((b.y - a.y) / dt, -1800, 1800); this.vrot += this.vx * 0.9;
          this.drag = false; svg.classList.remove('grabbing');
        } else this.poke();
        this.down = null;
      });
      svg.addEventListener('pointercancel', () => { this.drag = false; this.down = null; svg.classList.remove('grabbing'); });
    }
    burstRings(n = 2) {
      for (let i = 0; i < n; i++) {
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', 100 + this.x); c.setAttribute('cy', 110 + this.y); c.setAttribute('fill', 'none');
        c.setAttribute('stroke', i % 2 ? '#FFD60A' : '#8B5CF6'); c.setAttribute('stroke-width', '4');
        this.gFx.appendChild(c); this.fx.push({ e: c, r: 30, life: 0.7 + i * 0.15, max: 0.7 + i * 0.15, delay: i * 0.08 });
      }
    }
    poke() { this.roar = 1; this.flash = 1; this.vsq -= 4; this.vrot += rand(-260, 260); this.burstRings(3); this.onPoke && this.onPoke(this); }
    lunge(dir = 1) { this.vx += 520 * dir; this.vy -= 160; this.roar = 1; this.flash = 1; this.vrot += 300 * dir; }
    step(dt) {
      this.t += dt;
      const bob = this.reduce ? 0 : Math.sin(this.t * 1.8) * 4;
      if (this.drag) {
        const [tx, ty] = this.target || [this.x, this.y];
        this.vx += (330 * (tx - this.x) - 24 * this.vx) * dt; this.vy += (330 * (ty - this.y) - 24 * this.vy) * dt;
      } else {
        this.vx += (-60 * this.x - 7 * this.vx) * dt; this.vy += (-60 * (this.y - bob) - 7 * this.vy) * dt;
      }
      this.x += this.vx * dt; this.y += this.vy * dt;
      if (Math.abs(this.x) > 90) { this.x = clamp(this.x, -90, 90); this.vx *= -0.6; this.onLand && this.onLand(this); }
      if (this.y < -120 || this.y > 45) { this.y = clamp(this.y, -120, 45); this.vy *= -0.6; this.vsq -= 1.5; this.onLand && this.onLand(this); }
      // tilt toward the cursor (and with its own motion)
      const known = mouse.x > -9000;
      const c = known ? this.toSvg(mouse.x, mouse.y) : { x: 100 + this.x, y: 95 + this.y };
      const lean = clamp((c.x - 100 - this.x) * 0.06, -9, 9);
      this.vrot += (90 * ((this.drag ? this.vx * 0.02 : lean) - this.rot) - 9 * this.vrot) * dt; this.rot += this.vrot * dt;
      this.rot = clamp(this.rot, -40, 40);
      this.vsq += (260 * (1 + (this.reduce ? 0 : Math.sin(this.t * 2.6) * 0.012) - this.sq) - 12 * this.vsq) * dt; this.sq += this.vsq * dt;
      if (this.pop < 1 || this.vpop) { this.vpop = (this.vpop || 0) + (220 * (1 - this.pop) - 12 * (this.vpop || 0)) * dt; this.pop += this.vpop * dt; if (Math.abs(1 - this.pop) < 0.002 && Math.abs(this.vpop) < 0.01) { this.pop = 1; this.vpop = 0; } }
      const ex = c.x - (100 + this.x), ey = c.y - (95 + this.y), d = Math.hypot(ex, ey) || 1, k = Math.min(1, d / 90);
      this.look[0] += ((ex / d) * 3 * k - this.look[0]) * Math.min(1, dt * 12); this.look[1] += ((ey / d) * 2.4 * k - this.look[1]) * Math.min(1, dt * 12);
      this.blinkT -= dt; if (this.blinkT < -0.12) this.blinkT = rand(2.4, 5.2);
      this.roar = Math.max(0, this.roar - dt * 1.8); this.flash = Math.max(0, this.flash - dt * 2.5);
      this.wt += dt; if (this.wt > 0.11) { this.wt = 0; this.wf++; this.gWisps.innerHTML = wisps(this.stage, this.wf, this.roar); }
      this.fx = this.fx.filter((r) => {
        if (r.delay > 0) { r.delay -= dt; return true; }
        r.life -= dt; if (r.life <= 0) { r.e.remove(); return false; }
        const p = 1 - r.life / r.max; r.e.setAttribute('r', 30 + p * 110); r.e.setAttribute('opacity', 1 - p); r.e.setAttribute('stroke-width', 5 * (1 - p) + 0.5);
        return true;
      });
      this.build(); this.render();
    }
    render() {
      const sy = this.sq, sx = 1 / Math.sqrt(sy), s = SCALE[this.stage] * this.pop;
      const jx = this.shake ? rand(-1, 1) * this.shake * 5 : 0, jy = this.shake ? rand(-1, 1) * this.shake * 4 : 0;
      this.gRoot.setAttribute('transform', `translate(${this.x + jx} ${this.y + jy}) rotate(${this.rot} 100 110) translate(100 110) scale(${s * sx} ${s * sy}) translate(-100 -110)`);
      const lift = clamp(1 - (this.y < 0 ? -this.y / 160 : 0), 0.4, 1);
      this.gShadow.setAttribute('transform', `translate(${this.x} 0) translate(100 192) scale(${lift * SCALE[this.stage]} 1) translate(-100 -192)`);
      this.gShadow.setAttribute('opacity', lift);
      if (this.eyes) this.pupils.forEach((p) => p.setAttribute('transform', `translate(${this.look[0]} ${this.look[1]})`));
      if (!this.gWisps.firstChild) this.gWisps.innerHTML = wisps(this.stage, this.wf, 0);
    }
  }

  let last = performance.now();
  (function loop(now) { const dt = Math.min(0.033, (now - last) / 1000); last = now; all.forEach((b) => { if (b.visible) b.step(dt); }); requestAnimationFrame(loop); })(last);

  window.Beast = Beast;
  Beast.markup = markup;
  Beast.head = (st) => head(st);
})();
