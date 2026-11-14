(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  if (reduce) document.documentElement.classList.add('reduce');
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  /* ================= sound: tiny synthesized blips, off by default ================= */
  let actx = null, soundOn = false;
  try { soundOn = localStorage.getItem('shad-sound') === '1'; } catch (e) {}
  function tone(f, d = 0.08, type = 'square', vol = 0.04, slide = 0) {
    if (!soundOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + d);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + d + 0.02);
    } catch (e) {}
  }
  const sfx = {
    pop: () => tone(660, 0.07, 'square', 0.03, -300),
    boing: () => tone(220, 0.2, 'sine', 0.08, 500),
    chomp: () => { tone(190, 0.06); setTimeout(() => tone(150, 0.06), 70); },
    coin: () => { tone(988, 0.07); setTimeout(() => tone(1319, 0.14), 70); },
    hit: () => tone(140, 0.16, 'sawtooth', 0.06, -80),
    thud: () => tone(90, 0.08, 'sine', 0.09, -30),
    level: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.1), i * 90)),
    evolve: () => tone(260, 0.7, 'triangle', 0.07, 900),
  };
  const soundBtn = $('#soundBtn');
  function paintSound() { soundBtn.setAttribute('aria-pressed', soundOn); soundBtn.textContent = soundOn ? '♪ Sound on' : '♪ Sound off'; }
  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn; paintSound(); sfx.coin();
    try { localStorage.setItem('shad-sound', soundOn ? '1' : '0'); } catch (e) {}
  });
  paintSound();

  /* ================= toast ================= */
  const toastEl = document.createElement('div');
  toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastEl);
  let toastT;
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2400); }

  /* ================= particles: sesame confetti + burger rain (one shared loop) ================= */
  const bits = [], rains = [];
  function burst(x, y, n = 14, colors = ['#FFF3D0', '#FFD60A', '#7ED957', '#E4262B']) {
    if (reduce) return;
    for (let i = 0; i < n; i++) {
      const e = document.createElement('i'); e.className = 'confetti'; e.style.background = pick(colors);
      document.body.appendChild(e);
      bits.push({ e, x, y, vx: rand(-280, 280), vy: rand(-560, -200), r: rand(0, 360), vr: rand(-700, 700), life: 1.2 });
    }
  }
  function burgerRain(n = 22) {
    if (reduce) { toast('It\'s raining Shads! (Motion is reduced, so imagine it.)'); return; }
    for (let i = 0; i < n; i++) {
      const s = rand(54, 100), d = document.createElement('div');
      d.className = 'rain-b'; d.style.width = d.style.height = s + 'px';
      d.innerHTML = `<svg viewBox="0 0 200 200" width="100%" height="100%" overflow="visible">${Burger.markup(i % 3)}</svg>`;
      document.body.appendChild(d);
      rains.push({ e: d, s, x: rand(0, innerWidth - s), y: rand(-700, -120), vx: rand(-90, 90), vy: rand(0, 200), r: rand(-30, 30), vr: rand(-220, 220), life: 6.5 });
    }
    sfx.level();
  }
  function stepParticles(dt) {
    for (let i = bits.length - 1; i >= 0; i--) {
      const p = bits[i];
      p.vy += 1300 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.life -= dt;
      if (p.life <= 0) { p.e.remove(); bits.splice(i, 1); continue; }
      p.e.style.transform = `translate(${p.x}px,${p.y}px) rotate(${p.r}deg)`; p.e.style.opacity = Math.min(1, p.life * 2);
    }
    for (let i = rains.length - 1; i >= 0; i--) {
      const p = rains[i];
      p.vy += 1400 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.life -= dt;
      const floor = innerHeight - p.s * 0.92;
      if (p.y > floor) { p.y = floor; if (p.vy > 120) { p.vy *= -0.45; p.vr *= 0.6; p.vx *= 0.8; } else { p.vy = 0; p.vr *= 0.9; } }
      if (p.x < 0 || p.x > innerWidth - p.s) { p.x = clamp(p.x, 0, innerWidth - p.s); p.vx *= -0.7; }
      if (p.life <= 0) { p.e.remove(); rains.splice(i, 1); continue; }
      p.e.style.transform = `translate(${p.x}px,${p.y}px) rotate(${p.r}deg)`; p.e.style.opacity = Math.min(1, p.life);
    }
  }

  /* ================= click anywhere: manga sound effects ================= */
  const POPS = ['ドン!', 'バン!', 'ポン!', 'ドカッ', 'POW!', 'BAM!', 'ZAP!', 'ゴゴ'];
  const POPC = ['#E4262B', '#FFD60A', '#7CC8F2', '#F95587', '#7ED957'];
  function spawnPop(x, y, text) {
    if ($$('.pop').length > 10) return;
    const s = document.createElement('span');
    s.className = 'pop'; s.textContent = text || pick(POPS);
    s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.color = pick(POPC); s.style.setProperty('--r', rand(-18, 18) + 'deg');
    document.body.appendChild(s);
    s.addEventListener('animationend', () => s.remove()); setTimeout(() => s.remove(), 1200);
    sfx.pop();
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('a,button,[role=button],[role=tab],svg.burger,.pokeable,.dlg,.tc-badges li,.tc-party li,.hero-title,.wf-battle')) return;
    if (getSelection && String(getSelection()).length) return;
    spawnPop(e.clientX, e.clientY);
  });

  /* ================= type "shad" anywhere ================= */
  let keys = '';
  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input,textarea,[contenteditable]')) return;
    if (e.key.length !== 1) return;
    keys = (keys + e.key.toLowerCase()).slice(-4);
    if (keys === 'shad') { keys = ''; burgerRain(); toast('It\'s raining Shads!'); }
  });

  /* ================= burgers ================= */
  const POKES = ['Hey! That tickles.', 'Extra cheese, please.', 'Did someone say lunch?', '*happy sizzling*', 'I\'m not on the menu!', 'Again! Again!', 'SHAD used BUN BASH!'];
  function pokeable(container, burger) {
    const bubble = document.createElement('span');
    bubble.className = 'bubble'; bubble.setAttribute('aria-hidden', 'true');
    container.appendChild(bubble);
    container.setAttribute('tabindex', '0'); container.setAttribute('role', 'button');
    let bt;
    burger.say = (msg) => { bubble.textContent = msg || pick(POKES); bubble.classList.add('show'); clearTimeout(bt); bt = setTimeout(() => bubble.classList.remove('show'), 1600); };
    container.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); burger.poke(); } });
  }
  function seedBurst(burger) {
    const r = burger.svg.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height * 0.35, 10, ['#FFF3D0']);
  }

  let pokes = 0, unleashed = false;
  const hero = new Burger($('#heroBurger'), {
    stage: 0, draggable: true, reduce,
    onLand: () => sfx.thud(),
    onPoke: (b) => {
      sfx.chomp(); b.say(); seedBurst(b);
      if (++pokes % 7 === 0 && !unleashed) {
        unleashed = true; b.setStage(2, true); sfx.evolve();
        $('.hero-page').classList.add('shake'); b.say('MAXIMUM BURGER!');
        toast('SHAD stacked up into its final form for a moment!');
        setTimeout(() => { unleashed = false; b.setStage(0, false); $('.hero-page').classList.remove('shake'); }, 4200);
      }
    },
  });
  pokeable($('.p-mascot'), hero);
  let thrownOnce = false;
  $('#heroBurger').addEventListener('pointerup', () => { if (hero.drag && !thrownOnce) { thrownOnce = true; } });

  const card = new Burger($('#cardBurger'), { stage: 2, draggable: true, reduce, onLand: () => sfx.thud(), onPoke: (b) => { sfx.chomp(); b.say(pick(['Too hot to handle.', 'Shades stay ON.', 'Triple stacked. Fully loaded.'])); seedBurst(b); } });
  pokeable($('.tc-photo'), card);

  const ally = new Burger($('#allyBurger'), { stage: 2, draggable: false, reduce, onPoke: () => sfx.chomp() });
  $('#allyBurger').style.touchAction = 'pan-y';

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
      l.vx += (200 * ((dx / d) * f - l.x) - 14 * l.vx) * dt;
      l.vy += (200 * ((dy / d) * f - l.y) - 14 * l.vy) * dt;
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
      if (ci < line.length) timer = setTimeout(type, 26);
      else { typing = false; schedule(); }
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
    'SHAD used AGENTIC AI! It\'s super effective!',
    'Psst. Grab the burger and throw it. Or type "shad" anywhere.',
  ]);

  /* ================= Wells Fargo mini battle ================= */
  const foe = $('#foe'), hpEl = $('#foeHp'), wfDlg = $('#wfDlg'), atk = $('#wfAttack'), arena = $('.wf-battle');
  let hp = 100, turn = 0, busy = false;
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
  atk.addEventListener('click', () => {
    if (busy) return;
    if (hp <= 0) {
      hp = 100; turn = 0; paintHp(); foe.classList.remove('fainted', 'hit');
      wfDlg.textContent = 'A wild MANUAL WORK appeared! What will SHAD do?'; atk.textContent = 'Use AI agent'; return;
    }
    busy = true;
    const [line, dmg, after] = TURNS[turn];
    wfDlg.textContent = line; ally.lunge(1); sfx.chomp();
    setTimeout(() => {
      hp = Math.max(0, hp - dmg); paintHp(); restart(foe, 'hit'); dmgNumber(dmg); sfx.hit();
      wfDlg.textContent = `${line} ${after}`; turn++;
      if (hp <= 0) {
        setTimeout(() => {
          foe.classList.add('fainted'); sfx.level();
          wfDlg.textContent = 'MANUAL WORK fainted! The line of business gained an AI agent.';
          atk.textContent = 'Battle again';
          const r = foe.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 24);
        }, 700);
      }
      busy = false;
    }, 320);
  });

  /* ================= evolution: scroll stacks the burger up ================= */
  const STAGES = [
    { name: 'SHAD', years: '2008 to 2023 · School days', line: 'SHAD is a single-patty burger with big dreams.',
      text: 'Grew up at Delhi Public School Ruby Park, writing first programs in C and taking apart anything with a screen.' },
    { name: 'SHADOW', years: '2023 to 2025 · Jadavpur University', line: 'SHADOW stacked another patty! It learned GRAPH TRANSFORMER!',
      text: 'Started B.E. Computer Science at Jadavpur University and has held a 9.5 CGPA since. Joined CMATER Lab under Prof. Ram Sarkar, then spent a summer at ISI with Prof. Swagatam Das, training graph transformers.' },
    { name: 'SHADOWBEAST', years: '2025 to now', line: 'SHADOWBEAST is on fire. Literally.',
      text: 'Led teams to win OpenAImer at SRIJAN and Lexicognition at IIT Kharagpur, published at IEEE IJCNN and Springer ICITA, then joined Wells Fargo to architect, build and orchestrate an AI agent for Commercial and Corporate Investment Banking.' },
  ];
  $$('.evo-static [data-stage]').forEach((s) => (s.innerHTML = Burger.markup(+s.dataset.stage)));
  $$('.evo-static [data-text]').forEach((p) => (p.textContent = STAGES[+p.dataset.text].text));
  $$('.evo-static [data-years]').forEach((p) => (p.textContent = STAGES[+p.dataset.years].years));

  const evo = $('#story'), flash = $('#evoFlash'), stageEl = $('#evoStage');
  const nameEl = $('#evoName'), yearsEl = $('#evoYears'), textEl = $('#evoText'), dlgEl = $('#evoDlg');
  const steps = $$('.evo-steps li');
  const evoB = new Burger($('#evoBurger'), { stage: 0, draggable: false, reduce, onLand: () => sfx.thud(), onPoke: () => sfx.chomp() });
  $('#evoBurger').style.touchAction = 'pan-y';
  const BOUNDS = [0.36, 0.7], WIN = 0.12;
  let evoStage = 0, evolvedAt = -1e9;
  function setCopy(s) {
    nameEl.textContent = STAGES[s].name; yearsEl.textContent = STAGES[s].years; textEl.textContent = STAGES[s].text;
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
      evoB.setStage(s, fwd); setCopy(s);
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

  /* ================= Shad-dex: holo tilt + catch ================= */
  const dexCards = $$('.dex');
  let caught = 0;
  const caughtN = $('#caughtN');
  dexCards.forEach((card) => {
    const name = card.querySelector('h3').textContent;
    const btn = document.createElement('button');
    btn.className = 'catch magnet'; btn.type = 'button'; btn.textContent = 'Catch'; btn.setAttribute('aria-label', `Catch ${name}`);
    card.appendChild(btn);
    btn.addEventListener('click', () => {
      if (card.classList.contains('caught')) { toast(`${name} is already in the Shad-dex.`); return; }
      card.classList.add('caught'); btn.textContent = 'Caught!'; btn.setAttribute('aria-pressed', 'true');
      caughtN.textContent = ++caught; sfx.coin();
      const r = btn.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, 16);
      if (caught === dexCards.length) { toast('Shad-dex complete! Enjoy the burger rain.'); setTimeout(() => burgerRain(), 300); }
      else toast(`Gotcha! ${name} was caught.`);
    });
    if (finePointer && !reduce) {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg) scale(1.01)`;
        card.style.setProperty('--mx', `${(x + 0.5) * 100}%`); card.style.setProperty('--my', `${(y + 0.5) * 100}%`);
        card.classList.add('lit');
      });
      card.addEventListener('pointerleave', () => {
        card.style.transition = 'transform .35s cubic-bezier(.3,1.5,.5,1)'; card.style.transform = ''; card.classList.remove('lit');
        setTimeout(() => (card.style.transition = ''), 360);
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
    const spin = () => { restart(li, 'spin'); sfx.coin(); const r = li.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + 20, 8, ['#FFD60A', '#fff']); };
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
    $('#mdSrc').textContent = m.src; $('#mdName').textContent = m.name; $('#mdEffect').textContent = m.effect;
    $('#mdStats').innerHTML = m.stats.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    const a = $('#mdLink'); a.href = m.link[0]; a.textContent = m.link[1];
    if (animate) {
      restart(md, 'hit'); sfx.hit();
      if (window.gsap && !reduce) gsap.fromTo('#moveDetail > :not(.effective)', { x: 24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, stagger: 0.04, ease: 'power2.out' });
    }
  }
  tabs.forEach((b, i) => {
    b.addEventListener('click', () => showMove(i, true));
    b.addEventListener('keydown', (e) => {
      const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (d) { e.preventDefault(); const n = (i + d + tabs.length) % tabs.length; tabs[n].focus(); showMove(n, true); }
    });
  });
  showMove(0, false);

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
    stepParticles(dt); stepLetters(dt); stepBands(dt);
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

  // page load: panels ink in, letters slam, SFX pops, burger drops in, dialogue starts
  const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
  tl.from('.hero-page > *', { clipPath: 'inset(0 100% 0 0)', duration: 0.55, stagger: 0.14 })
    .fromTo('.hero-title .ch', { yPercent: -120, rotate: () => gsap.utils.random(-25, 25), opacity: 0 },
      { yPercent: (i) => [0, -6, 0, 0][i], rotate: (i) => [0, -3, 0, 4][i], opacity: 1, duration: 0.45, stagger: 0.07, ease: 'back.out(2.2)' }, '-=0.5')
    .add(() => { hero.y = -170; hero.vy = 0; }, '-=0.3')
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
    gsap.from(h, { xPercent: -12, skewX: -18, opacity: 0, duration: 0.6, ease: 'back.out(1.6)', scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
  });
  gsap.from('.wf-steps li', { y: 40, rotate: (i) => [-6, 4, -3][i], opacity: 0, duration: 0.6, stagger: 0.12, ease: 'back.out(1.8)', scrollTrigger: { trigger: '.wf-steps', start: 'top 88%', once: true } });
  gsap.from('.wf-main h3', { scale: 1.6, opacity: 0, duration: 0.5, ease: 'back.out(2)', scrollTrigger: { trigger: '.wf-main', start: 'top 80%', once: true } });
  gsap.from('#foe', { x: 120, opacity: 0, duration: 0.7, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.wf-battle', start: 'top 75%', once: true } });
  ScrollTrigger.create({ trigger: '.wf-battle', start: 'top 70%', once: true, onEnter: () => { ally.y = -170; ally.vy = 0; } });
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
  ScrollTrigger.create({ trigger: '.tcard', start: 'top 70%', once: true, onEnter: () => { card.y = -170; card.vy = 0; } });
  gsap.from('.sfx-don', { scale: 3, opacity: 0, rotate: -30, duration: 0.5, ease: 'back.out(2)', scrollTrigger: { trigger: '.p-contact', start: 'top 70%', once: true } });
  gsap.fromTo('.p-contact .speed', { scale: 0.6 }, { scale: 1.2, ease: 'none', scrollTrigger: scrub('.p-contact', 'top bottom', 'bottom bottom') });
})();
