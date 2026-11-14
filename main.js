(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const root = document.documentElement;
  if (reduce) root.classList.add('reduce');
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };

  /* ================= sound: tiny synthesized blips, off by default ================= */
  let actx = null, soundOn = store.get('shad-sound') === '1';
  function tone(f, d = 0.08, type = 'square', vol = 0.04, slide = 0) {
    if (!soundOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + d + 0.02);
    } catch (e) {}
  }
  const sfx = {
    pop: () => tone(660, 0.07, 'square', 0.03, -300),
    boing: () => tone(220, 0.2, 'sine', 0.08, 500),
    roar: () => { tone(110, 0.45, 'sawtooth', 0.07, -60); tone(165, 0.35, 'square', 0.03, -90); },
    coin: () => { tone(988, 0.07); setTimeout(() => tone(1319, 0.14), 70); },
    hit: () => tone(140, 0.16, 'sawtooth', 0.06, -80),
    thud: () => tone(80, 0.08, 'sine', 0.09, -30),
    level: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.1), i * 90)),
    evolve: () => tone(200, 0.8, 'triangle', 0.07, 900),
    whoosh: () => tone(900, 0.25, 'triangle', 0.04, -700),
  };
  const soundBtn = $('#soundBtn');
  function paintSound() { soundBtn.setAttribute('aria-pressed', soundOn); soundBtn.textContent = soundOn ? '♪ Sound on' : '♪ Sound off'; }
  soundBtn.addEventListener('click', () => { soundOn = !soundOn; paintSound(); sfx.coin(); store.set('shad-sound', soundOn ? '1' : '0'); });
  paintSound();

  /* ================= toast ================= */
  const toastEl = document.createElement('div');
  toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastEl);
  let toastT;
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2600); }

  /* ================= manga sound-effect pops ================= */
  const POPS = ['ドン!', 'バン!', 'ポン!', 'ドカッ', 'POW!', 'BAM!', 'ZAP!', 'ゴゴ'];
  const POPC = ['#E4262B', '#FFD60A', '#7CC8F2', '#F95587', '#7ED957', '#8B5CF6'];
  function spawnPop(x, y, text, color) {
    if ($$('.pop').length > 10) return;
    const s = document.createElement('span');
    s.className = 'pop'; s.textContent = text || pick(POPS);
    s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.color = color || pick(POPC); s.style.setProperty('--r', rand(-18, 18) + 'deg');
    document.body.appendChild(s);
    s.addEventListener('animationend', () => s.remove()); setTimeout(() => s.remove(), 1200);
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('a,button,[role=button],[role=tab],svg.beast,.pokeable,.dlg,.tc-badges li,.tc-party li,.hero-title,.wf-battle,.chap-head h2')) return;
    if (String(getSelection ? getSelection() : '').length) return;
    spawnPop(e.clientX, e.clientY); sfx.pop();
  });

  /* ================= particles: sparks + shadow swarm (shared loop) ================= */
  const bits = [], swarm = [];
  function burst(x, y, n = 14, colors = ['#8B5CF6', '#FFD60A', '#E4262B', '#1E1530']) {
    if (reduce) return;
    for (let i = 0; i < n; i++) {
      const e = document.createElement('i'); e.className = 'confetti'; e.style.background = pick(colors);
      document.body.appendChild(e);
      bits.push({ e, x, y, vx: rand(-300, 300), vy: rand(-560, -200), r: rand(0, 360), vr: rand(-700, 700), life: 1.2 });
    }
  }
  function shadowSwarm(n = 20) {
    if (reduce) { toast('The shadows swarm! (Motion is reduced, so picture it.)'); return; }
    for (let i = 0; i < n; i++) {
      const s = rand(56, 104), d = document.createElement('div');
      d.className = 'swarm-b'; d.style.width = d.style.height = s + 'px';
      d.innerHTML = `<svg viewBox="0 0 200 200" width="100%" height="100%" overflow="visible">${Beast.markup(i % 3)}</svg>`;
      document.body.appendChild(d);
      swarm.push({ e: d, s, x: rand(0, innerWidth - s), y: rand(-700, -120), vx: rand(-110, 110), vy: rand(0, 200), r: rand(-30, 30), vr: rand(-260, 260), life: 6.5 });
    }
    sfx.roar(); setTimeout(sfx.level, 300);
  }
  function stepParticles(dt) {
    for (let i = bits.length - 1; i >= 0; i--) {
      const p = bits[i];
      p.vy += 1300 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.life -= dt;
      if (p.life <= 0) { p.e.remove(); bits.splice(i, 1); continue; }
      p.e.style.transform = `translate(${p.x}px,${p.y}px) rotate(${p.r}deg)`; p.e.style.opacity = Math.min(1, p.life * 2);
    }
    for (let i = swarm.length - 1; i >= 0; i--) {
      const p = swarm[i];
      p.vy += 1400 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.life -= dt;
      const floor = innerHeight - p.s * 0.95;
      if (p.y > floor) { p.y = floor; if (p.vy > 120) { p.vy *= -0.5; p.vr *= 0.6; p.vx *= 0.85; } else { p.vy = 0; p.vr *= 0.9; } }
      if (p.x < 0 || p.x > innerWidth - p.s) { p.x = clamp(p.x, 0, innerWidth - p.s); p.vx *= -0.7; }
      if (p.life <= 0) { p.e.remove(); swarm.splice(i, 1); continue; }
      p.e.style.transform = `translate(${p.x}px,${p.y}px) rotate(${p.r}deg)`; p.e.style.opacity = Math.min(1, p.life);
    }
  }

  /* ================= shadow trail that follows the cursor ================= */
  const trail = [];
  let trailCtx = null, trailCv = null;
  if (finePointer && !reduce) {
    trailCv = document.createElement('canvas'); trailCv.className = 'trail'; trailCv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(trailCv); trailCtx = trailCv.getContext('2d');
    const size = () => { const r = devicePixelRatio || 1; trailCv.width = innerWidth * r; trailCv.height = innerHeight * r; trailCtx.setTransform(r, 0, 0, r, 0, 0); };
    size(); addEventListener('resize', size);
    let lx = null, ly = null;
    addEventListener('pointermove', (e) => {
      if (lx !== null) {
        const d = Math.hypot(e.clientX - lx, e.clientY - ly), n = Math.min(4, Math.ceil(d / 14));
        for (let i = 0; i < n; i++) trail.push({ x: lx + ((e.clientX - lx) * (i + 1)) / n + rand(-3, 3), y: ly + ((e.clientY - ly) * (i + 1)) / n + rand(-3, 3), r: rand(5, 11), life: 0.55, vy: rand(-30, -10), hot: Math.random() < 0.12 });
      }
      lx = e.clientX; ly = e.clientY;
    }, { passive: true });
  }
  function stepTrail(dt) {
    if (!trailCtx) return;
    trailCtx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = trail.length - 1; i >= 0; i--) {
      const p = trail[i]; p.life -= dt; p.y += p.vy * dt;
      if (p.life <= 0) { trail.splice(i, 1); continue; }
      const a = p.life / 0.55;
      trailCtx.beginPath(); trailCtx.arc(p.x, p.y, p.r * (0.4 + a * 0.6), 0, Math.PI * 2);
      trailCtx.fillStyle = p.hot ? `rgba(255,214,10,${a * 0.9})` : `rgba(30,21,48,${a * 0.55})`; trailCtx.fill();
      if (!p.hot) { trailCtx.lineWidth = 1.5; trailCtx.strokeStyle = `rgba(139,92,246,${a * 0.6})`; trailCtx.stroke(); }
    }
    if (trail.length > 160) trail.splice(0, trail.length - 160);
  }

  /* ================= glitchy katakana scramble for big titles ================= */
  const GLYPHS = 'アカサタナハマヤラワイキシチニヒミリ#%&$@!?ガザダバ';
  function scramble(el, finalText) {
    const text = finalText || el.dataset.text || el.textContent;
    el.dataset.text = text; el.setAttribute('aria-label', text);
    if (reduce) { el.textContent = text; return; }
    const start = performance.now(), dur = 650;
    cancelAnimationFrame(el._scr);
    (function f(now) {
      const p = Math.min(1, (now - start) / dur), shown = Math.floor(p * text.length);
      el.textContent = [...text].map((c, i) => (i < shown || c === ' ' ? c : pick(GLYPHS))).join('');
      if (p < 1) el._scr = requestAnimationFrame(f);
    })(start);
  }
  $$('.chap-head h2').forEach((h) => { h.dataset.text = h.textContent; h.addEventListener('pointerenter', () => scramble(h)); });

  /* ================= shadow mode: flip the manga into a negative ================= */
  const modeBtn = $('#modeBtn');
  function paintMode() {
    const on = root.classList.contains('shadow'), narrow = innerWidth < 760;
    modeBtn.setAttribute('aria-pressed', on); modeBtn.setAttribute('aria-label', on ? 'Switch to paper mode' : 'Switch to shadow mode');
    modeBtn.textContent = narrow ? (on ? '☀' : '☾') : on ? '☀ Paper mode' : '☾ Shadow mode';
  }
  addEventListener('resize', () => paintMode());
  if (store.get('shad-mode') === 'shadow') root.classList.add('shadow');
  paintMode();
  modeBtn.addEventListener('click', () => {
    root.classList.toggle('shadow'); paintMode(); store.set('shad-mode', root.classList.contains('shadow') ? 'shadow' : 'paper');
    const on = root.classList.contains('shadow');
    spawnPop(innerWidth / 2, innerHeight / 2, on ? 'シャドウ!' : 'ピカッ!', on ? '#8B5CF6' : '#FFD60A');
    sfx.whoosh(); if (on) { hero.poke(); toast('Shadow mode on. The beast feels at home.'); }
  });

  /* ================= beasts ================= */
  const POKES = ['GRRRAAH!', 'Rawr. Fearsome, right?', 'The shadows obey.', 'SHAD used SHADOW ROAR!', '*ominous growling*', 'Eyes on the job.', 'Again. I dare you.'];
  function pokeable(container, beast) {
    const bubble = document.createElement('span');
    bubble.className = 'bubble'; bubble.setAttribute('aria-hidden', 'true');
    container.appendChild(bubble);
    container.setAttribute('tabindex', '0'); container.setAttribute('role', 'button');
    let bt;
    beast.say = (msg) => { bubble.textContent = msg || pick(POKES); bubble.classList.add('show'); clearTimeout(bt); bt = setTimeout(() => bubble.classList.remove('show'), 1600); };
    container.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); beast.poke(); } });
  }
  function roarFx(b) {
    const r = b.svg.getBoundingClientRect();
    spawnPop(r.left + r.width * rand(0.2, 0.8), r.top + r.height * 0.25, pick(['ガオー!', 'グルル', 'ゴォォ']), pick(['#E4262B', '#8B5CF6', '#FFD60A']));
    burst(r.left + r.width / 2, r.top + r.height * 0.45, 10);
    sfx.roar();
  }

  let pokes = 0, unleashed = false;
  const hero = new Beast($('#heroBeast'), {
    stage: 0, draggable: true, reduce,
    onLand: () => sfx.thud(),
    onPoke: (b) => {
      roarFx(b); b.say();
      if (++pokes % 7 === 0 && !unleashed) {
        unleashed = true; b.setStage(2, true); sfx.evolve();
        $('.hero-page').classList.add('shake'); b.say('THE BEAST AWAKENS!');
        toast('SHAD awakened into its final form for a moment!');
        setTimeout(() => { unleashed = false; b.setStage(0, false); $('.hero-page').classList.remove('shake'); }, 4200);
      }
    },
  });
  pokeable($('.p-mascot'), hero);

  const card = new Beast($('#cardBeast'), { stage: 2, draggable: true, reduce, onLand: () => sfx.thud(), onPoke: (b) => { roarFx(b); b.say(pick(['Fully awakened.', 'Horns polished. Code reviewed.', 'Fear the 9.5 CGPA.'])); } });
  pokeable($('.tc-photo'), card);

  const ally = new Beast($('#allyBeast'), { stage: 2, draggable: false, reduce, onPoke: (b) => roarFx(b) });
  $('#allyBeast').style.touchAction = 'pan-y';

  // a small static emblem in the nav logo
  $('#logoBeast').innerHTML = Beast.head(1);

  /* ================= hero letters: they dodge the cursor, flip on click ================= */
  const letters = [...$$('.hero-title .ch')].map((el) => ({ el, x: 0, y: 0, vx: 0, vy: 0 }));
  let mx = -9999, my = -9999;
  addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
  letters.forEach((l) => l.el.addEventListener('click', () => { restart(l.el, 'flip'); sfx.boing(); }));
  function stepLetters(dt) {
    if (reduce || !finePointer) return;
    letters.forEach((l) => {
      const r = l.el.getBoundingClientRect();
      const cx = r.left + r.width / 2 - l.x, cy = r.top + r.height / 2 - l.y;
      const dx = cx - mx, dy = cy - my, d = Math.hypot(dx, dy) || 1;
      const f = d < 220 ? (1 - d / 220) * 46 : 0;
      l.vx += (200 * ((dx / d) * f - l.x) - 14 * l.vx) * dt; l.vy += (200 * ((dy / d) * f - l.y) - 14 * l.vy) * dt;
      l.x += l.vx * dt; l.y += l.vy * dt;
      l.el.style.translate = `${l.x.toFixed(1)}px ${l.y.toFixed(1)}px`;
    });
  }

  /* ================= RPG dialogue typer ================= */
  function dialogue(el, box, lines, { auto = 2800 } = {}) {
    let li = 0, ci = 0, timer, typing = false;
    function type() {
      typing = true;
      const line = lines[li];
      if (reduce) { el.textContent = line; typing = false; schedule(); return; }
      el.textContent = line.slice(0, ++ci);
      if (ci < line.length) timer = setTimeout(type, 26); else { typing = false; schedule(); }
    }
    function schedule() { clearTimeout(timer); timer = setTimeout(next, auto); }
    function next() {
      clearTimeout(timer);
      if (typing) { ci = lines[li].length; el.textContent = lines[li]; typing = false; schedule(); return; }
      li = (li + 1) % lines.length; ci = 0; type(); sfx.pop();
    }
    box.addEventListener('click', next);
    box.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } });
    return { start: type };
  }
  const heroDlg = dialogue($('#heroDlgText'), $('#heroDlg'), [
    'A wild SHAD appeared!',
    'SHAD is a software engineer and AI researcher.',
    'SHAD is a Technology Program Intern at Wells Fargo, building AI agents!',
    'SHAD won Lexicognition AI at Kshitij, IIT Kharagpur\'s tech fest! Microsoft judges were watching.',
    'SHAD also won OpenAImer at SRIJAN, Jadavpur University\'s tech fest!',
    'Psst. Drag the beast and throw it. Or type "shad" anywhere.',
  ]);

  /* ================= Wells Fargo mini battle ================= */
  const foe = $('#foe'), hpEl = $('#foeHp'), wfDlg = $('#wfDlg'), atk = $('#wfAttack'), arena = $('.wf-battle');
  let hp = 100, turn = 0, busy = false, won = false;
  const TURNS = [
    ['SHAD ARCHITECTED an AI agent!', 34, 'It\'s effective!'],
    ['SHAD BUILT the agent!', 33, 'It\'s super effective!'],
    ['SHAD ORCHESTRATED the agent across the line of business!', 33, 'A critical hit!'],
  ];
  function paintHp() { hpEl.style.width = hp + '%'; hpEl.classList.toggle('mid', hp <= 50 && hp > 20); hpEl.classList.toggle('low', hp <= 20); }
  function dmgNumber(n) {
    const fr = foe.getBoundingClientRect(), ar = arena.getBoundingClientRect();
    const s = document.createElement('span'); s.className = 'dmg'; s.textContent = `-${n}`;
    s.style.left = (fr.left - ar.left + fr.width * 0.55) + 'px'; s.style.top = (fr.top - ar.top + 10) + 'px';
    arena.appendChild(s); setTimeout(() => s.remove(), 1000);
  }
  function rematch() {
    won = false; hp = 100; turn = 0; paintHp(); foe.classList.remove('fainted', 'hit'); arena.classList.remove('won');
    wfDlg.textContent = 'MANUAL WORK is back for a rematch! What will SHAD do?'; atk.textContent = 'Use AI agent';
  }
  atk.addEventListener('click', () => {
    if (busy) return;                 // ignore clicks while a move or the knockout is playing
    if (won) { rematch(); return; }   // only an explicit rematch refills the HP
    busy = true; atk.disabled = true;
    const [line, dmg, after] = TURNS[turn];
    wfDlg.textContent = line; ally.lunge(1); roarFx(ally);
    setTimeout(() => {
      hp = Math.max(0, hp - dmg); paintHp(); restart(foe, 'hit'); dmgNumber(dmg); sfx.hit();
      wfDlg.textContent = `${line} ${after}`; turn++;
      if (hp > 0) { busy = false; atk.disabled = false; return; }
      setTimeout(() => {
        foe.classList.add('fainted'); arena.classList.add('won'); sfx.level();
        wfDlg.textContent = 'MANUAL WORK fainted! The line of business gained an AI agent.';
        const r = foe.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 24);
        spawnPop(r.left + r.width / 2, r.top + r.height / 3, 'K.O.!', '#FFD60A');
        setTimeout(() => { won = true; busy = false; atk.disabled = false; atk.textContent = 'Rematch'; }, 900);
      }, 700);
    }, 320);
  });

  /* ================= evolution: scroll awakens the beast ================= */
  const STAGES = [
    { name: 'SHAD', years: '2008 to 2023 · School days', line: 'SHAD is a shadow pup with big, curious eyes.',
      text: 'Grew up at Delhi Public School Ruby Park, writing first programs in C and taking apart anything with a screen.' },
    { name: 'SHADOW', years: '2023 to 2025 · Jadavpur University', line: 'SHADOW\'s eyes sharpened! It learned GRAPH TRANSFORMER!',
      text: 'Started B.E. Computer Science at Jadavpur University and has held a 9.5 CGPA since. Joined CMATER Lab under Prof. Ram Sarkar, then spent a summer at ISI with Prof. Swagatam Das, training graph transformers.' },
    { name: 'SHADOWBEAST', years: '2025 to now', line: 'SHADOWBEAST has fully awakened.',
      text: 'Led teams to win OpenAImer at SRIJAN 2025, Jadavpur University\'s tech fest, and Lexicognition AI at Kshitij 2026, IIT Kharagpur\'s tech fest. Published at IEEE IJCNN and Springer ICITA, then joined Wells Fargo to architect, build and orchestrate an AI agent for Commercial and Corporate Investment Banking.' },
  ];
  $$('.evo-static [data-stage]').forEach((s) => (s.innerHTML = Beast.markup(+s.dataset.stage)));
  $$('.evo-static [data-text]').forEach((p) => (p.textContent = STAGES[+p.dataset.text].text));
  $$('.evo-static [data-years]').forEach((p) => (p.textContent = STAGES[+p.dataset.years].years));

  const evo = $('#story'), flash = $('#evoFlash'), stageEl = $('#evoStage');
  const nameEl = $('#evoName'), yearsEl = $('#evoYears'), textEl = $('#evoText'), dlgEl = $('#evoDlg');
  const steps = $$('.evo-steps li');
  const evoB = new Beast($('#evoBeast'), { stage: 0, draggable: false, reduce, onPoke: (b) => roarFx(b) });
  $('#evoBeast').style.touchAction = 'pan-y';
  const BOUNDS = [0.36, 0.7], WIN = 0.12;
  let evoStage = 0, evolvedAt = -1e9;
  function setCopy(s, animate) {
    if (animate) scramble(nameEl, STAGES[s].name); else nameEl.textContent = STAGES[s].name;
    yearsEl.textContent = STAGES[s].years; textEl.textContent = STAGES[s].text;
    steps.forEach((li, i) => li.classList.toggle('on', i <= s));
  }
  setCopy(0); dlgEl.textContent = STAGES[0].line;
  function onEvoScroll() {
    const r = evo.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - innerHeight), 0, 1);
    const s = p < BOUNDS[0] ? 0 : p < BOUNDS[1] ? 1 : 2;
    let charge = 0;
    BOUNDS.forEach((b) => { if (p >= b - WIN && p < b) charge = (p - (b - WIN)) / WIN; });
    evoB.shake = charge; stageEl.classList.toggle('charging', charge > 0);
    if (s !== evoStage) {
      const fwd = s > evoStage; evoStage = s;
      evoB.setStage(s, fwd); setCopy(s, true);
      if (fwd) { restart(flash, 'go'); sfx.evolve(); evolvedAt = performance.now(); }
    }
    dlgEl.textContent = charge > 0 ? `What? ${STAGES[evoStage].name} is evolving!`
      : performance.now() - evolvedAt < 2600 ? `Congratulations! SHAD evolved into ${STAGES[evoStage].name}!` : STAGES[evoStage].line;
  }
  if (!reduce) { addEventListener('scroll', onEvoScroll, { passive: true }); addEventListener('resize', onEvoScroll); onEvoScroll(); }

  /* ================= EXP bar ================= */
  const expFill = $('#expFill'), expLv = $('#expLv');
  let leveled = false;
  function onExp() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, scrollY / max) : 0;
    expFill.style.transform = `scaleX(${p})`;
    expLv.textContent = p >= 0.995 ? 'Lv. UP!' : `Lv. ${1 + Math.floor(p * 99)}`;
    if (p >= 0.995 && !leveled) { leveled = true; sfx.level(); toast('You read the whole manga! Recruiter skills grew to Lv. 100.'); }
  }
  addEventListener('scroll', onExp, { passive: true }); onExp();

  /* ================= idle: the shadow watches you ================= */
  const eyes = document.createElement('div');
  eyes.className = 'idle-eyes'; eyes.setAttribute('aria-hidden', 'true');
  const oneEye = `<g class="ie"><polygon points="20,18 80,34 72,46 26,34" fill="#FF3B3B" filter="url(#bs-glow)"/><polygon points="20,18 80,34 72,46 26,34" fill="#FFD60A"/><rect class="ie-p" x="50" y="22" width="5" height="18" rx="2.5" fill="#2A0A0E"/></g>`;
  // mirror lives on an outer group so the blink animation (on .ie) can't override it
  eyes.innerHTML = `<svg viewBox="0 0 200 60"><g>${oneEye}</g><g transform="translate(200 0) scale(-1 1)">${oneEye}</g></svg>`;
  document.body.appendChild(eyes);
  let lastActive = performance.now(), idleT = 0, watching = false, seenOnce = false;
  function wake() {
    lastActive = performance.now();
    if (watching) { watching = false; eyes.classList.remove('show'); if (!seenOnce) { seenOnce = true; toast('…the shadow was watching you.'); } }
  }
  ['pointermove', 'scroll', 'keydown', 'pointerdown', 'touchstart'].forEach((ev) => addEventListener(ev, wake, { passive: true }));
  function stepIdle(dt) {
    if (reduce) return;
    idleT = (performance.now() - lastActive) / 1000;   // wall-clock, so slow frame rates can't stretch it
    if (!watching && idleT > 14) { watching = true; eyes.classList.add('show'); sfx.roar(); }
    if (watching) eyes.querySelectorAll('.ie-p').forEach((p) => p.setAttribute('transform', `translate(${Math.sin(idleT * 0.7) * 9} 0)`));
  }

  /* ================= Shad-dex: holo tilt + catch ================= */
  const dexCards = $$('.dex');
  let caught = 0;
  const caughtN = $('#caughtN');
  dexCards.forEach((cardEl) => {
    const name = cardEl.querySelector('h3').textContent;
    const btn = document.createElement('button');
    btn.className = 'catch magnet'; btn.type = 'button'; btn.textContent = 'Catch'; btn.setAttribute('aria-label', `Catch ${name}`);
    cardEl.appendChild(btn);
    btn.addEventListener('click', () => {
      if (cardEl.classList.contains('caught')) { toast(`${name} is already in the Shad-dex.`); return; }
      cardEl.classList.add('caught'); btn.textContent = 'Caught!'; btn.setAttribute('aria-pressed', 'true');
      caughtN.textContent = ++caught; sfx.coin();
      const r = btn.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, 16);
      if (caught === dexCards.length) { toast('Shad-dex complete! The shadows celebrate.'); setTimeout(() => shadowSwarm(), 300); }
      else toast(`Gotcha! ${name} was caught.`);
    });
    if (finePointer && !reduce) {
      cardEl.addEventListener('pointermove', (e) => {
        const r = cardEl.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        cardEl.style.transform = `perspective(900px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg) scale(1.01)`;
        cardEl.style.setProperty('--mx', `${(x + 0.5) * 100}%`); cardEl.style.setProperty('--my', `${(y + 0.5) * 100}%`);
        cardEl.classList.add('lit');
      });
      cardEl.addEventListener('pointerleave', () => {
        cardEl.style.transition = 'transform .35s cubic-bezier(.3,1.5,.5,1)'; cardEl.style.transform = ''; cardEl.classList.remove('lit');
        setTimeout(() => (cardEl.style.transition = ''), 360);
      });
    }
  });

  /* ================= trainer card: tilt, badges spin, party members hop ================= */
  const tcard = $('.tcard');
  if (finePointer && !reduce) {
    tcard.addEventListener('pointermove', (e) => {
      if (card.drag) return;
      const r = tcard.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      tcard.style.transform = `perspective(1200px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
      tcard.style.setProperty('--gx', `${(x + 0.5) * 100}%`); tcard.style.setProperty('--gy', `${(y + 0.5) * 100}%`);
    });
    tcard.addEventListener('pointerleave', () => { tcard.style.transform = ''; });
  }
  $$('.tc-badges li').forEach((li) => {
    li.tabIndex = 0;
    const spin = () => { restart(li, 'spin'); sfx.coin(); const r = li.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + 20, 8, ['#FFD60A', '#fff', '#8B5CF6']); };
    li.addEventListener('click', spin);
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); spin(); } });
  });
  $$('.tc-party li').forEach((li) => {
    li.tabIndex = 0;
    const go = () => { toast(`Go, ${li.textContent}!`); restart(li, 'hop'); sfx.boing(); };
    li.addEventListener('click', go);
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });

  /* ================= move list ================= */
  const MOVES = [
    { src: 'SAGED-Net · CMATER Lab, JU', name: 'Adaptive Gating',
      stats: [['Type', 'Psychic'], ['Venue', 'IEEE IJCNN / WCCI 2026'], ['Where', 'Netherlands'], ['Effect', 'Beats SOTA']],
      effect: 'A lightweight network that outlines cell nuclei in histopathology slides. Learnable adaptive gating suppresses background noise, and a tri-domain fidelity loss keeps boundaries sharp. Outperformed state-of-the-art results on TNBC, CPM and PanNuke. Advised by Prof. Ram Sarkar.',
      link: ['https://github.com/shadowbeast0/SAGED-NET', 'Open SAGED-Net on GitHub'] },
    { src: 'LGLD-Net 2 · CMATER Lab, JU', name: 'Global-Local Strike',
      stats: [['Type', 'Steel'], ['Accuracy', '96.69% on ALL'], ['Raabin-WBC', '96.5%'], ['Venue', 'Springer · 19th ICITA, Oslo']],
      effect: 'A dual-stream network that looks at a blood-cell image as a whole and in fine detail at the same time, then fuses the two. Set new state-of-the-art results on two leukemia and white-blood-cell benchmarks while staying small.',
      link: ['https://github.com/shadowbeast0/LGLD-Net', 'Open LGLD-Net on GitHub'] },
    { src: 'Indian Statistical Institute', name: 'Graph Transformer',
      stats: [['Type', 'Ghost'], ['When', 'Summer 2025'], ['Advisor', 'Prof. Swagatam Das']],
      effect: 'Implemented and customised a benchmark suite of graph models (GCN, Graph Transformer, NAGPhormer, SGFormer and DualFormer) and improved their accuracy. Follow-up work explores using GNN explainability to cut the cost of attention.',
      link: ['https://github.com/shadowbeast0/Explainable-Graph-Transformer', 'Open Explainable Graph Transformer on GitHub'] },
  ];
  const tabs = $$('.movelist button'), md = $('#moveDetail');
  function showMove(i, animate) {
    const m = MOVES[i];
    tabs.forEach((b, j) => { b.setAttribute('aria-selected', j === i); b.tabIndex = j === i ? 0 : -1; });
    $('#mdSrc').textContent = m.src; $('#mdEffect').textContent = m.effect;
    $('#mdStats').innerHTML = m.stats.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    const a = $('#mdLink'); a.href = m.link[0]; a.textContent = m.link[1];
    if (animate) {
      scramble($('#mdName'), m.name); restart(md, 'hit'); sfx.hit();
      if (window.gsap && !reduce) gsap.fromTo('#moveDetail > :not(.effective):not(h3)', { x: 24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, stagger: 0.04, ease: 'power2.out' });
    } else $('#mdName').textContent = m.name;
  }
  tabs.forEach((b, i) => {
    b.addEventListener('click', () => showMove(i, true));
    b.addEventListener('keydown', (e) => {
      const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (d) { e.preventDefault(); const n = (i + d + tabs.length) % tabs.length; tabs[n].focus(); showMove(n, true); }
    });
  });
  showMove(0, false);

  /* ================= type "shad" anywhere ================= */
  let keys = '';
  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input,textarea,[contenteditable]')) return;
    if (e.key.length !== 1) return;
    keys = (keys + e.key.toLowerCase()).slice(-4);
    if (keys === 'shad') { keys = ''; shadowSwarm(); toast('The shadows swarm!'); }
  });

  /* ================= magnetic buttons ================= */
  if (finePointer && !reduce) {
    $$('.magnet').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.translate = `${((e.clientX - (r.left + r.width / 2)) * 0.3).toFixed(1)}px ${((e.clientY - (r.top + r.height / 2)) * 0.4).toFixed(1)}px`;
      });
      el.addEventListener('pointerleave', () => { el.style.translate = ''; });
    });
  }

  /* ================= crossing marquee bands: speed + direction follow your scroll ================= */
  const tracks = [...$$('.track')].map((el) => ({ el, x: 0, dir: +el.dataset.dir, w: el.firstElementChild.offsetWidth }));
  addEventListener('resize', () => tracks.forEach((t) => (t.w = t.el.firstElementChild.offsetWidth)));
  let lastY = scrollY, vel = 0, sdir = 1;
  function stepBands(dt) {
    const dy = scrollY - lastY; lastY = scrollY;
    vel += (dy / Math.max(dt, 0.001) - vel) * 0.12;
    if (Math.abs(vel) > 5) sdir = vel < 0 ? -1 : 1;
    if (reduce) return;
    tracks.forEach((t) => {
      t.x += t.dir * sdir * (55 + Math.min(900, Math.abs(vel) * 0.6)) * dt;
      if (t.x < -t.w) t.x += t.w; if (t.x > 0) t.x -= t.w;
      t.el.style.transform = `translateX(${t.x.toFixed(1)}px)`;
    });
  }

  /* ================= one shared frame loop for page fidgets ================= */
  let last = performance.now();
  (function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    stepParticles(dt); stepLetters(dt); stepBands(dt); stepTrail(dt); stepIdle(dt);
    requestAnimationFrame(loop);
  })(last);

  /* ================= scroll choreography (GSAP) ================= */
  if (!window.gsap || reduce) {
    $$('.hero-title .ch').forEach((c, i) => (c.style.transform = ['', 'translateY(-.06em) rotate(-3deg)', '', 'rotate(4deg)'][i]));
    heroDlg.start(); return;
  }
  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.12 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -90 }); }
    }));
    const lean = gsap.quickTo('.lean', 'skewY', { duration: 0.4, ease: 'power3' });
    lenis.on('scroll', ({ velocity }) => lean(clamp(velocity * 0.12, -3, 3)));
  }

  // page load: panels ink in, letters slam, SFX pops, the beast pops in with a roar, dialogue starts
  const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
  tl.from('.hero-page > *', { clipPath: 'inset(0 100% 0 0)', duration: 0.55, stagger: 0.14 })
    .fromTo('.hero-title .ch', { yPercent: -120, rotate: () => gsap.utils.random(-25, 25), opacity: 0 },
      { yPercent: (i) => [0, -6, 0, 0][i], rotate: (i) => [0, -3, 0, 4][i], opacity: 1, duration: 0.45, stagger: 0.07, ease: 'back.out(2.2)' }, '-=0.5')
    .add(() => { hero.pop = 0.2; hero.vpop = 0; hero.burstRings(3); }, '-=0.3')
    .from('.sfx-go', { scale: 0, rotate: -40, duration: 0.35, ease: 'back.out(3)' }, '-=0.15')
    .from('.realname, .lede, .p-title .chapter', { opacity: 0, y: 14, duration: 0.4, stagger: 0.06, ease: 'power2.out' }, '-=0.25')
    .add(() => heroDlg.start());

  const scrub = (trigger, start = 'top top', end = 'bottom top') => ({ trigger, start, end, scrub: true });
  gsap.to('.title-wrap', { yPercent: -18, ease: 'none', scrollTrigger: scrub('.hero') });
  gsap.to('.sfx-go', { yPercent: -60, rotate: 20, ease: 'none', scrollTrigger: scrub('.hero') });
  gsap.fromTo('.band-a', { rotate: -1 }, { rotate: -6, ease: 'none', scrollTrigger: scrub('.bands', 'top bottom', 'bottom top') });
  gsap.fromTo('.band-b', { rotate: 1 }, { rotate: 5, ease: 'none', scrollTrigger: scrub('.bands', 'top bottom', 'bottom top') });

  gsap.utils.toArray('.reveal').forEach((el) => {
    gsap.from(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: 'power3.inOut', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });
  gsap.utils.toArray('.chap-head h2').forEach((h) => {
    ScrollTrigger.create({ trigger: h, start: 'top 85%', once: true, onEnter: () => scramble(h) });
  });
  gsap.from('.wf-steps li', { y: 40, rotate: (i) => [-6, 4, -3][i], opacity: 0, duration: 0.6, stagger: 0.12, ease: 'back.out(1.8)', scrollTrigger: { trigger: '.wf-steps', start: 'top 88%', once: true } });
  gsap.from('.wf-main h3', { scale: 1.6, opacity: 0, duration: 0.5, ease: 'back.out(2)', scrollTrigger: { trigger: '.wf-main', start: 'top 80%', once: true } });
  gsap.from('#foe', { x: 120, opacity: 0, duration: 0.7, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.wf-battle', start: 'top 75%', once: true } });
  ScrollTrigger.create({ trigger: '.wf-battle', start: 'top 70%', once: true, onEnter: () => { ally.pop = 0.2; ally.vpop = 0; ally.burstRings(2); } });
  gsap.utils.toArray('.dex-grid > *').forEach((el, i) => {
    gsap.from(el, { rotate: i % 2 ? 2.5 : -2.5, y: 40, duration: 0.8, ease: 'back.out(1.4)', clearProps: 'transform', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  gsap.utils.toArray('.sfx:not(.sfx-go)').forEach((s) => {
    gsap.fromTo(s, { y: 40 }, { y: -40, ease: 'none', scrollTrigger: scrub(s.parentElement, 'top bottom', 'bottom top') });
  });
  gsap.from('.movelist button', { x: -30, opacity: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out', scrollTrigger: { trigger: '.battle', start: 'top 80%', once: true } });
  gsap.from('.tcard', { y: 80, rotate: -2, scale: 0.96, duration: 0.8, ease: 'back.out(1.4)', clearProps: 'transform', scrollTrigger: { trigger: '.tcard', start: 'top 85%', once: true } });
  gsap.from('.tc-badges li', { scale: 0, rotate: -30, duration: 0.45, stagger: 0.08, ease: 'back.out(2.5)', scrollTrigger: { trigger: '.tc-badges', start: 'top 85%', once: true } });
  gsap.from('.tc-party li', { y: 30, opacity: 0, duration: 0.4, stagger: 0.06, ease: 'back.out(2)', scrollTrigger: { trigger: '.tc-party', start: 'top 90%', once: true } });
  ScrollTrigger.create({ trigger: '.tcard', start: 'top 70%', once: true, onEnter: () => { card.pop = 0.2; card.vpop = 0; card.burstRings(3); } });
  gsap.from('.sfx-don', { scale: 3, opacity: 0, rotate: -30, duration: 0.5, ease: 'back.out(2)', scrollTrigger: { trigger: '.p-contact', start: 'top 70%', once: true } });
  gsap.fromTo('.p-contact .speed', { scale: 0.6 }, { scale: 1.2, ease: 'none', scrollTrigger: scrub('.p-contact', 'top bottom', 'bottom bottom') });
})();
