(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  if (reduce) document.documentElement.classList.add('reduce');
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  /* ---------- toast: a little game-text box for fidget feedback ---------- */
  const toastEl = document.createElement('div');
  toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastEl);
  let toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  /* ---------- cursor: every duck's pupils follow it ---------- */
  let mx = innerWidth / 2, my = innerHeight / 3;
  addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
  function lookFor(svg) {
    const r = svg.getBoundingClientRect();
    const dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height * 0.38);
    const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 300);
    return [(dx / d) * 4 * k, (dy / d) * 3.5 * k];
  }

  /* ---------- live ducks: 8-frame flipbook + eye tracking + click reactions ---------- */
  const ducks = [];
  function addDuck(g, stageFn, opts = {}) {
    const svg = g.ownerSVGElement;
    const d = { g, svg, stageFn, boost: 0, i: 0, ...opts };
    ducks.push(d);
    return d;
  }
  let tick = 0;
  function renderDuck(d) {
    if (d.override) { d.g.innerHTML = d.override(); return; }
    const st = d.stageFn();
    const extra = { look: lookFor(d.svg) };
    if (d.boost > 0) { extra.press = 4; extra.wave = (tick % 4) / 4; d.boost--; }
    d.g.innerHTML = Shad.frame(st, reduce ? 0 : tick, extra);
  }
  function renderAll() { ducks.forEach(renderDuck); }
  setInterval(() => { tick++; renderAll(); }, 1000 / 9);

  // speech bubble + squish when a duck is poked
  const POKES = ['Psy…?', 'My head…', 'Headache intensifies!', '*confused quacking*', 'SHAD used CONFUSION!', 'Thinking very hard.', 'That tickles. Also my head hurts.'];
  function pokeable(container, d, onPoke) {
    const bubble = document.createElement('span');
    bubble.className = 'bubble'; bubble.setAttribute('aria-hidden', 'true');
    container.appendChild(bubble);
    container.classList.add('pokeable');
    container.setAttribute('tabindex', '0');
    container.setAttribute('role', 'button');
    if (!container.getAttribute('aria-label')) container.setAttribute('aria-label', 'Poke Shad');
    let bt;
    function poke() {
      d.boost = 9;
      d.svg.classList.remove('squish'); void d.svg.offsetWidth; d.svg.classList.add('squish');
      bubble.textContent = pick(POKES); bubble.classList.add('show');
      clearTimeout(bt); bt = setTimeout(() => bubble.classList.remove('show'), 1600);
      onPoke && onPoke();
    }
    container.addEventListener('click', poke);
    container.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); poke(); } });
  }

  // hero duck: poke it 7 times and its headache unleashes its final form for a moment
  let pokes = 0, unleashed = false;
  const heroDuck = addDuck($('#heroShad'), () => (unleashed ? 2 : 0));
  pokeable($('.p-mascot'), heroDuck, () => {
    if (++pokes % 7 === 0 && !unleashed) {
      unleashed = true;
      $('.hero-page').classList.add('shake');
      toast('SHAD\'s headache reached its limit! It unleashed PSYCHIC!');
      setTimeout(() => { unleashed = false; $('.hero-page').classList.remove('shake'); }, 2600);
    }
  });
  const cardDuck = addDuck($('#cardShad'), () => 2);
  pokeable($('.tc-photo'), cardDuck);

  /* ---------- RPG dialogue typer ---------- */
  function dialogue(el, box, lines, { auto = 2600 } = {}) {
    let li = 0, ci = 0, timer, typing = false;
    function type() {
      typing = true;
      const line = lines[li];
      if (reduce) { el.textContent = line; typing = false; schedule(); return; }
      el.textContent = line.slice(0, ++ci);
      if (ci < line.length) timer = setTimeout(type, 28);
      else { typing = false; schedule(); }
    }
    function schedule() { clearTimeout(timer); timer = setTimeout(next, auto); }
    function next() {
      clearTimeout(timer);
      if (typing) { ci = lines[li].length; el.textContent = lines[li]; typing = false; schedule(); return; }
      li = (li + 1) % lines.length; ci = 0; type();
    }
    box.addEventListener('click', next);
    box.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } });
    return { start: type };
  }
  const heroDlg = dialogue($('#heroDlgText'), $('#heroDlg'), [
    'A wild SHAD appeared!',
    'SHAD is a software engineer and AI researcher from Jadavpur University.',
    'SHAD is holding its head. Its headache is getting stronger...',
    'SHAD used AGENTIC AI! It\'s super effective!',
    'SHAD won the battle at IIT Kharagpur! Microsoft judges were watching.',
    'Psst. Try poking SHAD a few times.',
  ]);

  /* ---------- hero title letters: poke a letter and it flips ---------- */
  $$('.hero-title .ch').forEach((ch) => {
    ch.addEventListener('click', () => { ch.classList.remove('flip'); void ch.offsetWidth; ch.classList.add('flip'); });
  });

  /* ---------- evolution: scroll-scrubbed frame sequence ---------- */
  const STAGES = [
    { name: 'SHAD', years: '2008 to 2023 · Kolkata', line: 'SHAD is confused, but curious about everything.',
      text: 'Grew up at Delhi Public School Ruby Park, writing first programs in C and taking apart anything with a screen.' },
    { name: 'SHADOW', years: '2023 to 2025 · Jadavpur University', line: 'SHADOW\'s headache grew stronger! It learned GRAPH TRANSFORMER!',
      text: 'Started B.E. Computer Science at Jadavpur University and has held a 9.5 CGPA since. Joined CMATER Lab under Prof. Ram Sarkar, then spent a summer at ISI Kolkata with Prof. Swagatam Das, training graph transformers.' },
    { name: 'SHADOWBEAST', years: '2025 to now', line: 'Congratulations! SHAD evolved into SHADOWBEAST!',
      text: 'Led teams to win OpenAImer at SRIJAN and Lexicognition at IIT Kharagpur. Published at IEEE IJCNN and Springer ICITA. Now building AI agents for SWIFT payments at Wells Fargo.' },
  ];
  const SIL = STAGES.map((_, s) => Shad.draw(s, { sil: true }));
  $$('.evo-static [data-stage]').forEach((g) => (g.innerHTML = Shad.draw(+g.dataset.stage)));
  $$('.evo-static [data-text]').forEach((p) => (p.textContent = STAGES[+p.dataset.text].text));

  const evo = $('#story'), flash = $('#evoFlash'), stageEl = $('#evoStage');
  const nameEl = $('#evoName'), yearsEl = $('#evoYears'), textEl = $('#evoText'), dlgEl = $('#evoDlg');
  const steps = $$('.evo-steps li');
  const BOUNDS = [0.36, 0.7], WIN = 0.14, FLASH = 0.04;
  let evoStage = 0, evoMode = 'idle', silFrame = 0, shownStage = -1;
  const evoDuck = addDuck($('#evoShad'), () => evoStage, { override: null });
  pokeable(stageEl, evoDuck);

  function setCopy(s, evolving) {
    if (shownStage !== s) {
      shownStage = s;
      nameEl.textContent = STAGES[s].name; yearsEl.textContent = STAGES[s].years; textEl.textContent = STAGES[s].text;
      steps.forEach((li, i) => li.classList.toggle('on', i <= s));
    }
    dlgEl.textContent = evolving ? `What? ${STAGES[s].name} is evolving!` : STAGES[s].line;
  }
  function onEvoScroll() {
    const r = evo.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
    let s = p < BOUNDS[0] ? 0 : p < BOUNDS[1] ? 1 : 2;
    let m = 'idle', f = 0;
    BOUNDS.forEach((b, bi) => {
      if (p >= b - WIN && p < b) {
        // charging: flicker between the current and next silhouette, faster near the boundary
        const t = (p - (b - WIN)) / WIN;
        m = 'evolving'; s = bi;
        silFrame = Math.floor(t * t * 18) % 2 ? bi + 1 : bi;
      }
      if (p >= b && p < b + FLASH) f = 1 - (p - b) / FLASH;
    });
    evoStage = s; evoMode = m;
    evoDuck.override = m === 'evolving' ? () => SIL[silFrame] : null;
    flash.style.opacity = f.toFixed(3);
    stageEl.classList.toggle('charging', m === 'evolving');
    setCopy(s, m === 'evolving');
    renderDuck(evoDuck);
  }
  if (!reduce) {
    addEventListener('scroll', onEvoScroll, { passive: true });
    addEventListener('resize', onEvoScroll);
    onEvoScroll();
  }

  /* ---------- EXP bar: fills as you read; levels up at the end ---------- */
  const expFill = $('#expFill'), expLv = $('#expLv');
  let leveled = false;
  function onExp() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, scrollY / max) : 0;
    expFill.style.transform = `scaleX(${p})`;
    expLv.textContent = p >= 0.995 ? 'Lv. UP!' : `Lv. ${1 + Math.floor(p * 99)}`;
    if (p >= 0.995 && !leveled) { leveled = true; toast('You reached the end! Your recruiter skills grew to Lv. 100.'); }
  }
  addEventListener('scroll', onExp, { passive: true }); onExp();

  /* ---------- Shad-dex: catch every build ---------- */
  const dexCards = $$('.dex');
  let caught = 0;
  const caughtN = $('#caughtN');
  dexCards.forEach((card) => {
    const name = card.querySelector('h3').textContent;
    const btn = document.createElement('button');
    btn.className = 'catch'; btn.type = 'button'; btn.textContent = 'Catch';
    btn.setAttribute('aria-label', `Catch ${name}`);
    card.appendChild(btn);
    btn.addEventListener('click', () => {
      if (card.classList.contains('caught')) return;
      card.classList.add('caught');
      btn.textContent = 'Caught!'; btn.setAttribute('aria-pressed', 'true');
      caughtN.textContent = ++caught;
      if (caught === dexCards.length) toast('Shad-dex complete! You caught every build.');
      else toast(`Gotcha! ${name} was caught.`);
    });
  });

  /* ---------- badges spin, party members get sent out ---------- */
  $$('.tc-badges li').forEach((li) => {
    li.tabIndex = 0;
    const spin = () => { li.classList.remove('spin'); void li.offsetWidth; li.classList.add('spin'); };
    li.addEventListener('click', spin);
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); spin(); } });
  });
  $$('.tc-party li').forEach((li) => {
    li.tabIndex = 0;
    const go = () => { toast(`Go, ${li.textContent}!`); li.classList.remove('hop'); void li.offsetWidth; li.classList.add('hop'); };
    li.addEventListener('click', go);
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });

  /* ---------- trainer card tilts toward the cursor ---------- */
  const tcard = $('.tcard');
  if (finePointer && !reduce) {
    tcard.addEventListener('pointermove', (e) => {
      const r = tcard.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      tcard.style.transform = `perspective(1200px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
      tcard.style.setProperty('--gx', `${(x + 0.5) * 100}%`); tcard.style.setProperty('--gy', `${(y + 0.5) * 100}%`);
    });
    tcard.addEventListener('pointerleave', () => { tcard.style.transform = ''; });
  }

  /* ---------- move list ---------- */
  const MOVES = [
    { src: 'SAGED-Net · CMATER Lab, JU', name: 'Adaptive Gating',
      stats: [['Type', 'Psychic'], ['Venue', 'IEEE IJCNN / WCCI 2026'], ['Where', 'Netherlands'], ['Effect', 'Beats SOTA']],
      effect: 'A lightweight network that outlines cell nuclei in histopathology slides. Learnable adaptive gating suppresses background noise, and a tri-domain fidelity loss keeps boundaries sharp. Outperformed state-of-the-art results on TNBC, CPM and PanNuke. Advised by Prof. Ram Sarkar.',
      link: ['https://github.com/shadowbeast0/SAGED-NET', 'Open SAGED-Net on GitHub'] },
    { src: 'LGLD-Net 2 · CMATER Lab, JU', name: 'Global-Local Strike',
      stats: [['Type', 'Steel'], ['Accuracy', '96.69% on ALL'], ['Raabin-WBC', '96.5%'], ['Venue', 'Springer · 19th ICITA, Oslo']],
      effect: 'A dual-stream network that looks at a blood-cell image as a whole and in fine detail at the same time, then fuses the two. Set new state-of-the-art results on two leukemia and white-blood-cell benchmarks while staying small.',
      link: ['https://github.com/shadowbeast0/LGLD-Net', 'Open LGLD-Net on GitHub'] },
    { src: 'Indian Statistical Institute, Kolkata', name: 'Graph Transformer',
      stats: [['Type', 'Ghost'], ['When', 'Summer 2025'], ['Advisor', 'Prof. Swagatam Das']],
      effect: 'Implemented and customised a benchmark suite of graph models (GCN, Graph Transformer, NAGPhormer, SGFormer and DualFormer) and improved their accuracy. Follow-up work explores using GNN explainability to cut the cost of attention.',
      link: ['https://github.com/shadowbeast0/Explainable-Graph-Transformer', 'Open Explainable Graph Transformer on GitHub'] },
    { src: 'Wells Fargo · Hyderabad', name: 'SWIFT Agent',
      stats: [['Type', 'Electric'], ['When', 'Jun to Aug 2026'], ['Team', 'Global Payments & Liquidity Tech']],
      effect: 'Built an AI agent that automates testing for SWIFT payment flows, inside Commercial and Corporate Investment Banking Technology.',
      link: null },
  ];
  const tabs = $$('.movelist button');
  function showMove(i, animate) {
    const m = MOVES[i];
    tabs.forEach((b, j) => { b.setAttribute('aria-selected', j === i); b.tabIndex = j === i ? 0 : -1; });
    $('#mdSrc').textContent = m.src; $('#mdName').textContent = m.name; $('#mdEffect').textContent = m.effect;
    $('#mdStats').innerHTML = m.stats.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    const a = $('#mdLink');
    if (m.link) { a.hidden = false; a.href = m.link[0]; a.textContent = m.link[1]; } else a.hidden = true;
    if (animate && window.gsap && !reduce) {
      gsap.fromTo('#moveDetail > *', { x: 24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, stagger: 0.04, ease: 'power2.out' });
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

  /* ---------- motion: hero sequence, panels drawing in, parallax, scroll velocity ---------- */
  if (!window.gsap || reduce) {
    // keep the hand-lettered tilt without animation
    $$('.hero-title .ch').forEach((c, i) => (c.style.transform = ['', 'translateY(-.06em) rotate(-3deg)', '', 'rotate(4deg)'][i]));
    heroDlg.start(); return;
  }
  gsap.registerPlugin(ScrollTrigger);

  let lenis;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.12 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -70 }); }
    }));
    // manga "speed" lean: panels skew a touch with scroll velocity, then settle
    const lean = gsap.quickTo('.lean', 'skewY', { duration: 0.4, ease: 'power3' });
    lenis.on('scroll', ({ velocity }) => lean(gsap.utils.clamp(-3, 3, velocity * 0.12)));
  }

  // one orchestrated page-load: panels ink in, letters slam, SFX pops, then the dialogue starts
  const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
  tl.from('.hero-page > *', { clipPath: 'inset(0 100% 0 0)', duration: 0.55, stagger: 0.14 })
    .fromTo('.hero-title .ch',
      { yPercent: -120, rotate: () => gsap.utils.random(-25, 25), opacity: 0 },
      { yPercent: (i) => [0, -6, 0, 0][i], rotate: (i) => [0, -3, 0, 4][i], opacity: 1, duration: 0.45, stagger: 0.07, ease: 'back.out(2.2)' }, '-=0.5')
    .from('.sfx-go', { scale: 0, rotate: -40, duration: 0.35, ease: 'back.out(3)' }, '-=0.15')
    .from('.realname, .lede, .p-title .chapter', { opacity: 0, y: 14, duration: 0.4, stagger: 0.06, ease: 'power2.out' }, '-=0.25')
    .add(() => heroDlg.start());

  // hero parallax on the way out: title drifts up, mascot sinks, SFX flies
  gsap.to('.title-wrap', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.sfx-go', { yPercent: -60, rotate: 20, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.p-mascot .shad', { y: 40, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // every panel draws in, top to bottom, like ink being laid down
  gsap.utils.toArray('.reveal').forEach((el) => {
    gsap.from(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: 'power3.inOut', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });
  // chapter titles slam in letter-free: skew + slide
  gsap.utils.toArray('.chap-head h2').forEach((h) => {
    gsap.from(h, { xPercent: -12, skewX: -18, opacity: 0, duration: 0.6, ease: 'back.out(1.6)', scrollTrigger: { trigger: h, start: 'top 85%', once: true } });
  });
  // dex cards settle from a slight tilt as they draw in
  gsap.utils.toArray('.dex-grid > *').forEach((el, i) => {
    gsap.from(el, { rotate: i % 2 ? 2.5 : -2.5, y: 40, duration: 0.8, ease: 'back.out(1.4)', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  // SFX float on scroll throughout the page
  gsap.utils.toArray('.sfx:not(.sfx-go)').forEach((s) => {
    gsap.fromTo(s, { y: 40 }, { y: -40, ease: 'none', scrollTrigger: { trigger: s.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  // move list: options slide in one by one
  gsap.from('.movelist button', { x: -30, opacity: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out', scrollTrigger: { trigger: '.battle', start: 'top 80%', once: true } });
  // trainer card flips up into view, badges pop, party members hop in
  gsap.from('.tcard', { rotateX: 25, y: 60, transformPerspective: 1200, transformOrigin: '50% 100%', duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.tcard', start: 'top 85%', once: true } });
  gsap.from('.tc-badges li', { scale: 0, rotate: -30, duration: 0.45, stagger: 0.08, ease: 'back.out(2.5)', scrollTrigger: { trigger: '.tc-badges', start: 'top 85%', once: true } });
  gsap.from('.tc-party li', { y: 30, opacity: 0, duration: 0.4, stagger: 0.06, ease: 'back.out(2)', scrollTrigger: { trigger: '.tc-party', start: 'top 90%', once: true } });
  // contact: ドン slams down, speed lines spin up as you arrive
  gsap.from('.sfx-don', { scale: 3, opacity: 0, rotate: -30, duration: 0.5, ease: 'back.out(2)', scrollTrigger: { trigger: '.p-contact', start: 'top 70%', once: true } });
  gsap.fromTo('.p-contact .speed', { scale: 0.6 }, { scale: 1.2, ease: 'none', scrollTrigger: { trigger: '.p-contact', start: 'top bottom', end: 'bottom bottom', scrub: true } });
})();
