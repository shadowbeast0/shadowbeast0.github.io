/* Shad the burger: an original, chunky rubber-hose burger mascot with jelly physics.
   Stage 0 = Shad (single), 1 = Shadow (double + shades on its head), 2 = ShadowBeast (triple, bacon, shades on, on fire).
   Every layer is its own spring, so dragging, throwing and poking make the stack wobble like jelly. */
(function () {
  const ink = (w = 4) => `stroke="#000" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ---------------- layer artwork (local coords: layer top at y=0) ---------------- */
  const SEEDS = [[70, 12, -30], [92, 7, 10], [116, 8, -15], [137, 16, 25], [52, 27, 15], [148, 30, -20]];
  const BROWS = ['M74 21 Q82 16 90 20 M110 20 Q118 16 126 21', 'M73 20 L90 21 M110 21 L127 20', 'M72 16 L91 24 M109 24 L128 16'];
  const MOUTHS = [
    `<path d="M88 49 Q100 58 112 49" fill="none" ${ink(3.5)}/>`,
    `<path d="M89 51 Q102 57 113 47" fill="none" ${ink(3.5)}/>`,
    `<path d="M85 47 Q100 61 115 47Z" fill="#fff" ${ink(3)}/><path d="M92 49 V54 M100 49 V56 M108 49 V54" ${ink(1.5)}/>`,
  ];

  const LAYERS = {
    bottomBun: { h: 22, ov: 0, draw: () => {
      const d = 'M40 0 H160 Q166 0 165 7 Q162 22 146 22 H54 Q38 22 35 7 Q34 0 40 0Z';
      return `<path d="${d}" fill="#EFA445"/><path d="M37 9 Q100 15 163 9 Q160 22 146 22 H54 Q40 22 37 9Z" fill="#D4842A"/>
        <path d="M44 2 H156" stroke="#FFD9A0" stroke-width="3" stroke-linecap="round"/><path d="${d}" fill="none" ${ink()}/>`;
    } },
    patty: { h: 18, ov: 3, draw: () => {
      const d = 'M36 6 Q40 0 50 2 Q58 -1 66 2 Q76 0 84 2 Q94 -1 102 2 Q112 0 120 2 Q130 -1 138 2 Q148 0 156 2 Q166 2 166 9 Q166 18 154 18 H46 Q34 18 34 9 Q34 6 36 6Z';
      const dots = [[50, 10], [63, 13], [78, 9], [95, 12], [110, 9], [126, 13], [141, 10], [152, 13]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#4E2612"/>`).join('');
      return `<path d="${d}" fill="#7A4223"/><path d="M38 13 Q100 19 162 13 Q160 18 154 18 H46 Q40 18 38 13Z" fill="#5A2E15"/>${dots}
        <path d="M60 5 l8 6 M92 5 l8 6 M124 5 l8 6" stroke="#A0613A" stroke-width="3" stroke-linecap="round"/><path d="${d}" fill="none" ${ink()}/>`;
    } },
    cheese: { h: 5, ov: 3, draw: () => {
      const drip = (x, w, dd) => `<path d="M${x} 3 Q${x} ${dd} ${x + w / 2} ${dd} Q${x + w} ${dd} ${x + w} 3Z" fill="#FFC93C" ${ink(3)}/>`;
      return `${drip(52, 12, 15)}${drip(88, 14, 19)}${drip(128, 10, 13)}
        <path d="M36 0 L27 11 L46 4Z" fill="#FFC93C" ${ink(3)}/><path d="M164 0 L173 10 L154 4Z" fill="#FFC93C" ${ink(3)}/>
        <path d="M36 0 H164 L166 5 H34Z" fill="#FFC93C" ${ink(3)}/><path d="M44 1.8 H150" stroke="#FFE38A" stroke-width="2" stroke-linecap="round"/>`;
    } },
    bacon: { h: 8, ov: 3, draw: () => {
      const d = 'M34 3 Q48 -2 62 3 T90 3 T118 3 T146 3 T168 3 L168 9 Q154 13 140 8 T112 8 T84 8 T56 8 T32 9Z';
      return `<path d="${d}" fill="#C8553D" ${ink(3)}/><path d="M38 6 Q52 2 64 6 T92 6 T120 6 T148 6 T164 6" fill="none" stroke="#F6B4A0" stroke-width="2.5" stroke-linecap="round"/>`;
    } },
    lettuce: { h: 10, ov: 4, draw: () => {
      let d = 'M28 2 H172 L172 7';
      for (let x = 172; x > 28; x -= 12) d += ` Q${x - 6} 15 ${x - 12} 7`;
      d += 'Z';
      return `<path d="${d}" fill="#7ED957"/><path d="M40 4 l6 5 M70 4 l6 5 M100 4 l6 5 M130 4 l6 5 M156 4 l6 5" stroke="#4FAF35" stroke-width="2" stroke-linecap="round"/><path d="${d}" fill="none" ${ink(3.5)}/>`;
    } },
    tomato: { h: 9, ov: 2, draw: () => {
      const d = 'M38 1 H162 Q168 1 168 5 Q168 9 162 9 H38 Q32 9 32 5 Q32 1 38 1Z';
      const seeds = [44, 58, 142, 156].map((x) => `<ellipse cx="${x}" cy="5" rx="2.4" ry="1.4" fill="#FFC1B0"/>`).join('');
      return `<path d="${d}" fill="#E4262B"/>${seeds}<path d="M40 3 H160" stroke="#FF7A6B" stroke-width="1.6" stroke-linecap="round"/><path d="${d}" fill="none" ${ink(3.5)}/>`;
    } },
    topBun: { h: 60, ov: 3, draw: (stage) => {
      const dome = 'M42 60 Q36 60 36 54 C34 22 66 2 100 2 C134 2 166 22 164 54 Q164 60 158 60Z';
      const seeds = SEEDS.map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="3.6" ry="2.2" transform="rotate(${a} ${x} ${y})" fill="#FFF3D0" ${ink(1.5)}/>`).join('');
      const eyes = `<g class="b-eyes">
          <ellipse cx="82" cy="36" rx="10.5" ry="12" fill="#fff" ${ink(3)}/><ellipse cx="118" cy="36" rx="10.5" ry="12" fill="#fff" ${ink(3)}/>
          <g class="b-pupils"><circle cx="83" cy="38" r="5.6"/><circle cx="117" cy="38" r="5.6"/><circle cx="81" cy="35.5" r="1.9" fill="#fff"/><circle cx="115" cy="35.5" r="1.9" fill="#fff"/></g>
        </g>`;
      const shadesUp = `<g transform="rotate(-8 100 8)"><rect x="73" y="0" width="23" height="11" rx="5" fill="#111" ${ink(2.5)}/><rect x="104" y="0" width="23" height="11" rx="5" fill="#111" ${ink(2.5)}/><path d="M96 4 H104" ${ink(2.5)}/><path d="M77 3 l5 0 M108 3 l5 0" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></g>`;
      const shadesOn = `<g class="b-shades"><path d="M68 28 H96 Q97 44 84 45 Q69 45 68 32Z M104 28 H132 Q131 45 116 45 Q103 44 104 28Z" fill="#111" ${ink(3)}/><path d="M96 31 H104" ${ink(3)}/>
          <path class="glint" d="M73 32 l7 0 M109 32 l7 0" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></g>`;
      return `<path d="${dome}" fill="#F2A541"/><path d="M40 51 Q100 64 160 51 Q160 60 154 60 H46 Q40 60 40 51Z" fill="#D9822B"/>
        <ellipse cx="72" cy="18" rx="20" ry="8" transform="rotate(-22 72 18)" fill="#FFD27A"/><ellipse cx="63" cy="15" rx="7" ry="3" transform="rotate(-22 63 15)" fill="#fff" opacity=".85"/>
        ${seeds}<path d="${dome}" fill="none" ${ink()}/>
        <ellipse cx="65" cy="47" rx="7" ry="4" fill="#FF6F6F" opacity=".55"/><ellipse cx="135" cy="47" rx="7" ry="4" fill="#FF6F6F" opacity=".55"/>
        ${eyes}${stage === 2 ? shadesOn : ''}
        <path d="${BROWS[stage]}" fill="none" ${ink(4)}/>
        <g class="b-mc">${MOUTHS[stage]}</g>
        <g class="b-mo" style="display:none"><path d="M85 45 Q100 67 115 45Z" fill="#5A1010" ${ink(3)}/><ellipse cx="100" cy="56" rx="6.5" ry="3.6" fill="#FF6B6B"/></g>
        ${stage === 1 ? shadesUp : ''}`;
    } },
  };
  const STACKS = [
    ['bottomBun', 'patty', 'cheese', 'lettuce', 'tomato', 'topBun'],
    ['bottomBun', 'patty', 'cheese', 'patty', 'cheese', 'lettuce', 'tomato', 'topBun'],
    ['bottomBun', 'patty', 'cheese', 'bacon', 'patty', 'cheese', 'patty', 'lettuce', 'tomato', 'topBun'],
  ];
  const STAGE_SCALE = [1, 0.95, 0.88];

  function layout(stage) {
    let y = 172; const out = [];
    STACKS[stage].forEach((key, i) => { const L = LAYERS[key]; const top = y - L.h + (i ? L.ov : 0); out.push({ key, h: L.h, y: top }); y = top; });
    return out;
  }

  const GLOVE = `<circle r="8.5" fill="#fff" ${ink(3)}/><ellipse cx="-5" cy="-5" rx="3.4" ry="4.4" fill="#fff" ${ink(2.5)}/><path d="M-3 2 h6" stroke="#000" stroke-width="1.5"/>`;
  const shoe = (s) => `<path d="M${-6 * s} 0 Q${-6 * s} -7 ${3 * s} -7 Q${14 * s} -6 ${15 * s} 1 Q${15 * s} 4 ${10 * s} 4 H${-4 * s} Q${-7 * s} 4 ${-6 * s} 0Z" fill="#E4262B" ${ink(3)}/><path d="M${-5 * s} 2.4 H${13 * s}" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;

  // fire aura: 6 hand-tuned frames, swapped like a flipbook
  const tongue = (x, y, h, w, lean, c) => `<path d="M${x} ${y} Q${x - w} ${y - h * 0.45} ${x + lean} ${y - h} Q${x + w} ${y - h * 0.45} ${x} ${y}Z" fill="${c}"/>`;
  const FLAMES = Array.from({ length: 6 }, (_, f) => {
    let s = '';
    [[30, 172, 46, -6], [22, 142, 40, -8], [34, 108, 34, -4], [100, 30, 30, 0]].forEach(([x, y, h, lean], i) => {
      const k = 0.78 + 0.28 * Math.sin(f * 2.1 + i * 1.7);
      [[x, lean], [200 - x, -lean]].forEach(([xx, ll], side) => {
        if (x === 100 && side) return;
        s += tongue(xx, y, h * k, 13, ll + Math.sin(f + i) * 4, '#FF7A1A') + tongue(xx, y - 3, h * k * 0.6, 7, ll * 0.6, '#FFD60A');
      });
    });
    return `<g opacity=".95">${s}</g>`;
  });

  function staticArm(bx, by, a, side) {
    const L = 30, hx = bx + Math.cos(a) * L, hy = by + Math.sin(a) * L;
    const mx = (bx + hx) / 2 - Math.sin(a) * 7 * side, my = (by + hy) / 2 + Math.cos(a) * 7 * side;
    return { d: `M${bx} ${by} Q${mx} ${my} ${hx} ${hy}`, hx, hy };
  }

  /* ---------------- static markup (burger rain, reduced motion) ---------------- */
  function markup(stage) {
    const lay = layout(stage);
    const patty = [...lay].reverse().find((l) => l.key === 'patty');
    const ay = patty.y + 9;
    const aL = staticArm(33, ay, 2.15, 1), aR = staticArm(167, ay, Math.PI - 2.15, -1);
    let s = stage === 2 ? FLAMES[0] : '';
    s += `<path d="M84 170 Q80 177 82 184 M116 170 Q120 177 118 184" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round"/>`;
    s += `<g transform="translate(82 184)">${shoe(-1)}</g><g transform="translate(118 184)">${shoe(1)}</g>`;
    s += lay.map((l) => `<g transform="translate(0 ${l.y})">${LAYERS[l.key].draw(stage)}</g>`).join('');
    s += `<path d="${aL.d} ${aR.d}" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round"/>`;
    s += `<g transform="translate(${aL.hx} ${aL.hy})">${GLOVE}</g><g transform="translate(${aR.hx} ${aR.hy})">${GLOVE}</g>`;
    const sc = STAGE_SCALE[stage];
    return `<ellipse cx="100" cy="188" rx="56" ry="6" fill="rgba(0,0,0,.2)"/><g transform="translate(100 186) scale(${sc}) translate(-100 -186)">${s}</g>`;
  }

  /* ---------------- the live, physics-driven burger ---------------- */
  const all = new Set();
  let mouse = { x: -9999, y: -9999 };
  addEventListener('pointermove', (e) => { mouse = { x: e.clientX, y: e.clientY }; }, { passive: true });

  class Burger {
    constructor(svg, { stage = 0, draggable = true, reduce = false, onPoke, onLand } = {}) {
      Object.assign(this, { svg, draggable, reduce, onPoke, onLand });
      this.x = 0; this.y = 0; this.vx = 0; this.vy = 0; this.sq = 1; this.vsq = 0;
      this.t = rand(0, 10); this.blink = rand(1, 3); this.mouth = 0; this.wave = 0; this.shake = 0;
      this.look = [0, 0]; this.drag = false; this.down = null; this.parts = []; this.flameT = 0; this.flameF = 0; this.visible = true;
      svg.innerHTML = `<g class="b-shadow"><ellipse cx="100" cy="188" rx="56" ry="6" fill="rgba(0,0,0,.2)"/></g>
        <g class="b-root"><g class="b-flames"></g>
          <g class="b-legs"><path class="leg-l" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round"/><path class="leg-r" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round"/><g class="shoe-l">${shoe(-1)}</g><g class="shoe-r">${shoe(1)}</g></g>
          <g class="b-layers"></g>
          <g class="b-arms"><path class="arm-l" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round"/><path class="arm-r" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round"/><g class="glove-l">${GLOVE}</g><g class="glove-r">${GLOVE}</g></g>
        </g><g class="b-fx"></g>`;
      const q = (c) => svg.querySelector(c);
      Object.assign(this, { gShadow: q('.b-shadow'), gRoot: q('.b-root'), gFlames: q('.b-flames'), gLayers: q('.b-layers'), gFx: q('.b-fx'),
        legL: q('.leg-l'), legR: q('.leg-r'), shoeL: q('.shoe-l'), shoeR: q('.shoe-r'), armL: q('.arm-l'), armR: q('.arm-r'), gloveL: q('.glove-l'), gloveR: q('.glove-r') });
      this.stage = -1; this.setStage(stage, false);
      this.bind();
      all.add(this);
      if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; }).observe(svg);
      this.render();
    }

    setStage(s, drop) {
      if (s === this.stage) return;
      this.stage = s;
      const lay = layout(s);
      this.layers = lay.map((l, i) => ({ ...l, x: this.x, vx: 0, dy: drop && !this.reduce ? -(260 + i * 55) : 0, vdy: 0, hit: false }));
      this.gLayers.innerHTML = lay.map((l) => `<g>${LAYERS[l.key].draw(s)}</g>`).join('');
      this.els = [...this.gLayers.children];
      const top = this.els[this.els.length - 1];
      this.eyes = top.querySelector('.b-eyes'); this.pupils = top.querySelector('.b-pupils');
      this.mClosed = top.querySelector('.b-mc'); this.mOpen = top.querySelector('.b-mo');
      this.pattyI = lay.map((l) => l.key).lastIndexOf('patty');
      this.scale = STAGE_SCALE[s];
      this.gFlames.style.display = s === 2 ? '' : 'none';
      if (s === 2) this.gFlames.innerHTML = FLAMES[this.flameF];
    }

    toSvg(cx, cy) {
      const m = this.svg.getScreenCTM(); if (!m) return { x: 0, y: 0 };
      const p = this.svg.createSVGPoint(); p.x = cx; p.y = cy; return p.matrixTransform(m.inverse());
    }

    bind() {
      const svg = this.svg;
      svg.addEventListener('pointerdown', (e) => {
        if (e.button > 0) return;
        const p = this.toSvg(e.clientX, e.clientY);
        this.down = { x: p.x, y: p.y, ox: p.x - this.x, oy: p.y - this.y };
        this.hist = [{ x: p.x, y: p.y, t: performance.now() }];
        if (this.draggable) { try { svg.setPointerCapture(e.pointerId); } catch (err) {} e.preventDefault(); }
      });
      svg.addEventListener('pointermove', (e) => {
        if (!this.down) return;
        const p = this.toSvg(e.clientX, e.clientY);
        if (!this.drag && this.draggable && Math.hypot(p.x - this.down.x, p.y - this.down.y) > 5) { this.drag = true; svg.classList.add('grabbing'); }
        if (this.drag) {
          this.target = [clamp(p.x - this.down.ox, -80, 80), clamp(p.y - this.down.oy, -150, 4)];
          this.hist.push({ x: p.x, y: p.y, t: performance.now() }); if (this.hist.length > 6) this.hist.shift();
        }
      });
      const up = () => {
        if (!this.down) return;
        if (this.drag) {
          const a = this.hist[0], b = this.hist[this.hist.length - 1], dt = Math.max(16, b.t - a.t) / 1000;
          this.vx = clamp((b.x - a.x) / dt, -1600, 1600); this.vy = clamp((b.y - a.y) / dt, -1600, 1600);
          this.drag = false; svg.classList.remove('grabbing');
        } else this.poke();
        this.down = null;
      };
      svg.addEventListener('pointerup', up);
      svg.addEventListener('pointercancel', () => { this.drag = false; this.down = null; svg.classList.remove('grabbing'); });
      svg.addEventListener('pointerenter', () => { this.wave = 1.3; });
    }

    poke() {
      this.mouth = 1; this.wave = 0;
      if (this.y > -4) this.vy = -420;
      this.vsq -= 3;
      const top = this.layers[this.layers.length - 1];
      for (let i = 0; i < 10; i++) this.spawn(100 + this.x + rand(-40, 40), top.y + 12 + this.y, rand(-220, 220), rand(-420, -180));
      this.onPoke && this.onPoke(this);
    }
    lunge(dir = 1) { this.vx += 420 * dir; this.vy = -280; this.mouth = 1; }
    hop() { if (this.y > -4) { this.vy = -300; this.vsq -= 1.5; } }

    spawn(x, y, vx, vy) {
      const e = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      e.setAttribute('rx', '3.4'); e.setAttribute('ry', '2'); e.setAttribute('fill', '#FFF3D0'); e.setAttribute('stroke', '#000'); e.setAttribute('stroke-width', '1.4');
      this.gFx.appendChild(e);
      this.parts.push({ e, x, y, vx, vy, r: rand(0, 360), vr: rand(-720, 720), life: 1.1 });
    }

    step(dt) {
      this.t += dt;
      // body: spring toward the pointer while dragged, otherwise gravity + spring home
      if (this.drag) {
        const [tx, ty] = this.target || [this.x, this.y];
        this.vx += (320 * (tx - this.x) - 24 * this.vx) * dt;
        this.vy += (320 * (ty - this.y) - 24 * this.vy) * dt;
      } else {
        this.vx += (-38 * this.x - (this.y > -2 ? 7 : 1.2) * this.vx) * dt;
        this.vy += 1500 * dt;
      }
      this.x += this.vx * dt; this.y += this.vy * dt;
      if (!this.drag) {
        if (this.y > 0) {
          if (this.vy > 160) { this.vsq -= this.vy * 0.004; this.vy *= -0.42; this.onLand && this.onLand(this); } else this.vy = 0;
          this.y = 0;
        }
        if (this.x < -80 || this.x > 80) { this.x = clamp(this.x, -80, 80); this.vx *= -0.6; }
        if (this.y < -160) { this.y = -160; this.vy *= -0.5; }
      }
      // squash spring + idle breathing
      const breathe = this.reduce ? 0 : Math.sin(this.t * 2.4) * 0.018;
      this.vsq += (300 * (1 + breathe - this.sq) - 13 * this.vsq) * dt;
      this.sq += this.vsq * dt;
      // layers: a chain of springs, each chasing the one below, so the stack wobbles
      let prev = this.x;
      this.layers.forEach((l) => {
        l.vx += (620 * (prev - l.x) - 18 * l.vx) * dt; l.x += l.vx * dt;
        // keep the stack together: a layer can slide at most 14 units off the one below
        if (Math.abs(l.x - prev) > 14) { l.x = prev + Math.sign(l.x - prev) * 14; l.vx *= 0.5; }
        prev = l.x;
        if (l.dy < 0 || l.vdy) {
          l.vdy += 1700 * dt; l.dy += l.vdy * dt;
          if (l.dy >= 0) { l.dy = 0; if (l.vdy > 240) { l.vdy *= -0.33; this.vsq -= 0.8; if (!l.hit) { l.hit = true; this.onLand && this.onLand(this); } } else l.vdy = 0; }
        }
      });
      // eyes: track the cursor; blink now and then
      const top = this.layers[this.layers.length - 1];
      const ep = this.toSvg(mouse.x, mouse.y);
      const ex = ep.x - (100 + this.x), ey = ep.y - (top.y + 36 + this.y);
      const d = Math.hypot(ex, ey) || 1, k = Math.min(1, d / 90);
      this.look[0] += ((ex / d) * 3.6 * k - this.look[0]) * Math.min(1, dt * 12);
      this.look[1] += ((ey / d) * 3.2 * k - this.look[1]) * Math.min(1, dt * 12);
      this.blink -= dt; if (this.blink < -0.12) this.blink = rand(2.2, 5);
      this.mouth = Math.max(0, this.mouth - dt * 2.2);
      this.wave = Math.max(0, this.wave - dt);
      this.flameT += dt; if (this.flameT > 0.09) { this.flameT = 0; this.flameF = (this.flameF + 1) % FLAMES.length; if (this.stage === 2) this.gFlames.innerHTML = FLAMES[this.flameF]; }
      // seed particles
      this.parts = this.parts.filter((p) => {
        p.vy += 1100 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.life -= dt;
        if (p.life <= 0) { p.e.remove(); return false; }
        p.e.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${p.r})`); p.e.setAttribute('opacity', Math.min(1, p.life * 2));
        return true;
      });
      this.render();
    }

    render() {
      const air = this.y < -3 || this.drag;
      const stretch = clamp(1 - this.vy * 0.00028, 0.82, 1.22);
      const sy = this.sq * stretch, sx = 1 / Math.sqrt(sy);
      const jx = this.shake ? rand(-1, 1) * this.shake * 5 : 0, jy = this.shake ? rand(-1, 1) * this.shake * 3 : 0;
      const s = this.scale;
      this.gRoot.setAttribute('transform', `translate(${this.x + jx} ${this.y + jy}) translate(100 186) scale(${s * sx} ${s * sy}) translate(-100 -186)`);
      const lift = clamp(1 + this.y / 170, 0.35, 1);
      this.gShadow.setAttribute('transform', `translate(${this.x} 0) translate(100 188) scale(${lift * s} 1) translate(-100 -188)`);
      this.gShadow.setAttribute('opacity', lift);
      const n = this.layers.length;
      this.layers.forEach((l, i) => {
        const extra = i === n - 1 ? -this.mouth * 16 : 0;
        this.els[i].setAttribute('transform', `translate(${l.x - this.x} ${l.y + l.dy + extra})`);
      });
      // face
      this.pupils.setAttribute('transform', `translate(${this.look[0]} ${this.look[1]})`);
      const bl = this.blink < 0 ? 0.1 : 1;
      this.eyes.setAttribute('transform', `translate(0 36) scale(1 ${bl}) translate(0 -36)`);
      const open = this.mouth > 0.25;
      this.mOpen.style.display = open ? '' : 'none'; this.mClosed.style.display = open ? 'none' : '';
      // arms: rest, wave hello, or flail when airborne
      const p = this.layers[this.pattyI], pdx = p.x - this.x, ay = p.y + p.dy + 9;
      let aL = 2.15 + Math.sin(this.t * 2) * 0.08, aR = Math.PI - aL;
      if (air) { aL = Math.PI + 0.6 + Math.sin(this.t * 18) * 0.5; aR = -0.6 - Math.sin(this.t * 18 + 1) * 0.5; }
      else if (this.wave > 0) aR = -0.9 + Math.sin(this.t * 14) * 0.45;
      aL += this.vx * 0.0012; aR += this.vx * 0.0012;
      const L = staticArm(33 + pdx, ay, aL, 1), R = staticArm(167 + pdx, ay, aR, -1);
      this.armL.setAttribute('d', L.d); this.armR.setAttribute('d', R.d);
      this.gloveL.setAttribute('transform', `translate(${L.hx} ${L.hy}) rotate(${(aL * 180) / Math.PI + 90})`);
      this.gloveR.setAttribute('transform', `translate(${R.hx} ${R.hy}) rotate(${(aR * 180) / Math.PI - 90}) scale(-1 1)`);
      // legs: dangle and kick in the air, lean with speed
      const b = this.layers[0], bdx = b.x - this.x;
      const swing = clamp(-this.vx * 0.006, -8, 8) + (air ? Math.sin(this.t * 16) * 5 : 0);
      [[this.legL, this.shoeL, 84, -1, swing], [this.legR, this.shoeR, 116, 1, air ? -swing : swing]].forEach(([leg, sh, hx, side, sw]) => {
        const x0 = hx + bdx, fx = hx + bdx + sw + side * 2, fy = 184;
        leg.setAttribute('d', `M${x0} 170 Q${x0 + side * 4} 177 ${fx} ${fy}`);
        sh.setAttribute('transform', `translate(${fx} ${fy})`);
      });
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    all.forEach((b) => { if (b.visible) b.step(dt); });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.Burger = Burger;
  Burger.markup = markup;
})();
