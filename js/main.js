import { startAurora } from "./aurora.js";
import { startOrb } from "./orb.js";
import { venomTransition } from "./venom.js";

const root = document.documentElement;
const state = {
  reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  fine: window.matchMedia("(pointer: fine)").matches,
  paused: false,
  lite: window.matchMedia("(pointer: coarse)").matches || innerWidth < 900 || (navigator.hardwareConcurrency || 8) <= 4,
};
root.classList.toggle("lite", state.lite);
const scrollJobs = [];
let scrollQueued = false;
const onScroll = (fn) => {
  scrollJobs.push(fn);
  if (scrollJobs.length === 1) {
    addEventListener("scroll", () => {
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(() => { scrollQueued = false; for (const job of scrollJobs) job(); });
    }, { passive: true });
  }
};
const hero = document.querySelector(".hero");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function splitHero() {
  let i = 0;
  for (const el of document.querySelectorAll("[data-split]")) {
    const text = el.textContent;
    el.setAttribute("aria-label", text);
    el.textContent = "";
    for (const ch of text) {
      const s = document.createElement("span");
      s.className = "char";
      s.setAttribute("aria-hidden", "true");
      s.style.setProperty("--i", i++);
      s.textContent = ch;
      el.appendChild(s);
    }
  }
}

function splitTitles() {
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
  }, { rootMargin: "0px 0px -15% 0px" });
  for (const el of document.querySelectorAll("[data-reveal]")) {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.textContent = "";
    words.forEach((w, i) => {
      const rw = document.createElement("span");
      rw.className = "rw";
      rw.setAttribute("aria-hidden", "true");
      const inner = document.createElement("span");
      inner.style.setProperty("--i", i);
      inner.textContent = w;
      rw.appendChild(inner);
      el.appendChild(rw);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
    io.observe(el);
  }
}

function sheen() {
  const titles = [...document.querySelectorAll(".title")];
  const update = () => {
    const vh = window.innerHeight;
    for (const t of titles) {
      const r = t.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      t.style.setProperty("--sp", clamp((vh - r.top) / (vh + r.height), 0, 1).toFixed(3));
    }
  };
  onScroll(update);
  update();
}

function statement() {
  const el = document.querySelector("[data-words]");
  const sec = document.querySelector(".bh");
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = "";
  const spans = words.map((w, i) => {
    const s = document.createElement("span");
    s.className = "w";
    s.dataset.hot = /^(AI|agent|automation|testing)/i.test(w) ? "1" : "";
    s.textContent = w;
    el.appendChild(s);
    if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    return s;
  });
  if (state.reduced) { spans.forEach((s) => s.classList.add("on")); return; }
  const update = () => {
    const r = sec.getBoundingClientRect();
    const p = clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
    const lit = Math.round(clamp((p - 0.04) / 0.56, 0, 1) * spans.length);
    spans.forEach((s, i) => {
      s.classList.toggle("on", i < lit);
      s.classList.toggle("hot", i < lit && s.dataset.hot === "1");
    });
  };
  onScroll(update);
  update();
}

function heroExit() {
  const foot = document.querySelector(".hero__foot");
  const pauseBtn = document.querySelector(".pause");
  const update = () => {
    const r = hero.getBoundingClientRect();
    const p = clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
    if (!hero.classList.contains("is-in")) return;
    foot.style.opacity = String(1 - clamp(p * 3, 0, 1));
    foot.style.transform = `translate3d(0, ${p * 60}px, 0)`;
    pauseBtn.style.opacity = String(1 - clamp(p * 4, 0, 1));
  };
  onScroll(update);
}

function intro() {
  const el = document.querySelector(".intro");
  let seen = false;
  try { seen = sessionStorage.getItem("shad:intro") === "1"; } catch {}
  if (state.reduced || seen) { el.classList.add("is-skipped"); return Promise.resolve(); }
  const count = el.querySelector("[data-count]");
  const bar = el.querySelector(".intro__bar span");
  const start = performance.now();
  return new Promise((resolve) => {
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 1300);
      const e = 1 - Math.pow(1 - t, 3);
      count.textContent = String(Math.round(e * 100)).padStart(2, "0");
      bar.style.setProperty("--p", e);
      if (t < 1) return requestAnimationFrame(tick);
      try { sessionStorage.setItem("shad:intro", "1"); } catch {}
      el.classList.add("is-done");
      setTimeout(() => el.classList.add("is-skipped"), 1200);
      resolve();
    };
    requestAnimationFrame(tick);
  });
}

function themeToggle() {
  const btn = document.querySelector(".theme");
  const meta = document.querySelector('meta[name="theme-color"]');
  const sync = () => {
    const light = root.dataset.theme === "light";
    btn.setAttribute("aria-pressed", String(light));
    btn.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
    meta.setAttribute("content", light ? "#f2efe8" : "#050506");
  };
  sync();
  let busy = false;
  btn.addEventListener("click", async () => {
    if (busy) return;
    const next = root.dataset.theme === "light" ? "dark" : "light";
    const apply = () => {
      root.dataset.theme = next;
      try { localStorage.setItem("shad:theme", next); } catch {}
      sync();
    };
    if (state.reduced) return apply();
    busy = true;
    const r = btn.getBoundingClientRect();
    await venomTransition({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, apply, state.lite);
    busy = false;
  });
}

function nav() {
  const el = document.querySelector(".nav");
  const links = [...el.querySelectorAll(".nav__links a")];
  const targets = links.map((a) => document.querySelector(a.getAttribute("href")));
  let lastY = scrollY;
  const update = () => {
    const y = scrollY;
    el.classList.toggle("is-solid", y > 40);
    el.classList.toggle("is-hidden", y > lastY && y > innerHeight * 0.8 && !el.contains(document.activeElement));
    lastY = y;
    const mid = innerHeight * 0.4;
    targets.forEach((t, i) => {
      if (!t) return;
      const r = t.getBoundingClientRect();
      links[i].classList.toggle("is-active", r.top <= mid && r.bottom >= mid);
    });
  };
  onScroll(update);
  el.addEventListener("focusin", () => el.classList.remove("is-hidden"));
  update();
}

function smooth() {
  if (state.reduced || !window.Lenis) return;
  const lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  for (const a of document.querySelectorAll('a[href^="#"]')) {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id === "#top" ? 0 : document.querySelector(id);
      if (target === null) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0 });
      if (target) {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    });
  }
}

function experience() {
  const sec = document.querySelector(".exp");
  const track = sec.querySelector(".exp__track");
  const bar = sec.querySelector(".exp__progress");
  const cards = [...sec.querySelectorAll(".xcard")];
  const mq = window.matchMedia("(min-width: 1025px)");
  const update = () => {
    if (!sec.classList.contains("is-pinned")) { track.style.transform = ""; cards.forEach((c) => { c.style.transform = ""; c.style.opacity = ""; }); return; }
    const r = sec.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - innerHeight), 0, 1);
    const max = track.scrollWidth - innerWidth;
    track.style.transform = `translate3d(${-p * Math.max(0, max)}px, 0, 0)`;
    bar.style.setProperty("--p", p.toFixed(3));
    for (const card of cards) {
      const cr = card.getBoundingClientRect();
      const off = clamp((cr.left + cr.width / 2 - innerWidth / 2) / innerWidth, -1, 1);
      const a = Math.abs(off);
      card.style.transform = `perspective(1400px) translateZ(${-a * 320}px) rotateY(calc(${(-off * 34).toFixed(2)}deg + var(--ry))) rotateX(var(--rx)) scale(${(1 - a * 0.08).toFixed(3)})`;
      card.style.opacity = (1 - a * 0.55).toFixed(3);
    }
  };
  const setup = () => {
    sec.classList.toggle("is-pinned", mq.matches && !state.reduced);
    update();
  };
  mq.addEventListener("change", setup);
  onScroll(update);
  addEventListener("resize", update);
  setup();
}

function work() {
  const sec = document.querySelector(".work");
  const cases = [...sec.querySelectorAll(".case")];
  const counter = sec.querySelector("[data-work-index]");
  const space = sec.querySelector(".work__space");
  const mq = window.matchMedia("(min-width: 1025px)");
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  sec.addEventListener("pointermove", (e) => {
    tilt.tx = (e.clientX / innerWidth - 0.5) * 2;
    tilt.ty = (e.clientY / innerHeight - 0.5) * 2;
  });
  let active = mq.matches && !state.reduced;
  const setup = () => {
    active = mq.matches && !state.reduced;
    sec.classList.toggle("is-3d", active);
    sec.style.height = active ? `${(cases.length + 0.6) * 100}vh` : "";
    if (!active) cases.forEach((c) => { c.style.transform = ""; c.style.opacity = ""; c.style.zIndex = ""; c.classList.remove("is-front"); });
  };
  mq.addEventListener("change", setup);
  setup();
  const frame = () => {
    requestAnimationFrame(frame);
    if (!active) return;
    const r = sec.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const p = clamp(-r.top / (r.height - innerHeight), 0, 1);
    const f = p * (cases.length - 1);
    tilt.x += (tilt.tx - tilt.x) * 0.06;
    tilt.y += (tilt.ty - tilt.y) * 0.06;
    space.style.transform = `rotateY(${tilt.x * 3}deg) rotateX(${-tilt.y * 2}deg)`;
    let front = 0;
    cases.forEach((c, i) => {
      const d = i - f;
      const side = i % 2 ? 1 : -1;
      const z = -d * 1100;
      const x = d * 340 * side;
      const y = d * -50;
      const ry = d * 16 * side;
      const rx = d * 4;
      const op = d < 0 ? clamp(1 + d * 2.2, 0, 1) : clamp(1 - d * 0.32, 0, 1);
      c.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px) rotateY(${ry}deg) rotateX(${rx}deg)`;
      c.style.opacity = op.toFixed(3);
      c.style.zIndex = String(100 - Math.round(Math.abs(d) * 10));
      const isFront = Math.abs(d) < 0.5;
      c.classList.toggle("is-front", isFront);
      if (isFront) front = i;
    });
    counter.textContent = String(front + 1).padStart(2, "0");
  };
  requestAnimationFrame(frame);
}

function ghosts() {
  const items = [...document.querySelectorAll(".ghost")].map((g) => ({ g, sec: g.closest("section") }));
  if (state.reduced) return;
  const update = () => {
    for (const { g, sec } of items) {
      const r = sec.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) continue;
      const p = clamp((innerHeight - r.top) / (r.height + innerHeight), 0, 1);
      g.style.transform = `translate3d(${(0.35 - p * 0.9) * innerWidth}px, -50%, 0)`;
    }
  };
  onScroll(update);
  update();
}

function timeline() {
  const ledger = document.querySelector(".ledger");
  const rows = [...ledger.querySelectorAll("li")];
  const update = () => {
    const r = ledger.getBoundingClientRect();
    const line = innerHeight * 0.62;
    ledger.style.setProperty("--p", clamp((line - r.top) / r.height, 0, 1).toFixed(3));
    for (const li of rows) li.classList.toggle("lit", li.getBoundingClientRect().top + 40 < line);
  };
  onScroll(update);
  update();
}

function cardsGlow() {
  for (const card of document.querySelectorAll(".xcard, .vcard")) {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", `${px * 100}%`);
      card.style.setProperty("--my", `${py * 100}%`);
      if (state.fine && !state.reduced) {
        card.style.setProperty("--ry", `${(px - 0.5) * 8}deg`);
        card.style.setProperty("--rx", `${(0.5 - py) * 6}deg`);
      }
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  }
}

function peek() {
  const box = document.querySelector(".peek");
  const inner = box.querySelector(".peek__inner");
  if (!state.fine) return;
  const pos = { x: 0, y: 0, tx: 0, ty: 0, vx: 0 };
  let on = false;
  for (const a of document.querySelectorAll(".rows a")) {
    a.addEventListener("pointerenter", () => {
      const src = a.dataset.preview;
      inner.style.setProperty("--tint", getComputedStyle(a).getPropertyValue("--tint"));
      if (src === "metric") {
        inner.innerHTML = `<div class="peek__metric"><strong></strong><span></span></div>`;
        inner.querySelector("strong").textContent = a.dataset.metric;
        inner.querySelector("span").textContent = a.dataset.sub;
      } else {
        inner.innerHTML = `<img alt="" width="800" height="500">`;
        inner.querySelector("img").src = src;
      }
      box.classList.add("is-on");
      on = true;
    });
    a.addEventListener("pointerleave", () => { box.classList.remove("is-on"); on = false; });
  }
  addEventListener("pointermove", (e) => { pos.tx = e.clientX + 40; pos.ty = e.clientY; }, { passive: true });
  const frame = () => {
    requestAnimationFrame(frame);
    const nx = pos.x + (pos.tx - pos.x) * 0.15;
    pos.vx = nx - pos.x;
    pos.x = nx;
    pos.y += (pos.ty - pos.y) * 0.15;
    const sc = on ? 1 : 0.6;
    box.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(0, -50%) rotate(${clamp(pos.vx * 0.6, -12, 12)}deg) scale(${sc})`;
  };
  requestAnimationFrame(frame);
}

function countUp() {
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      io.unobserve(en.target);
      const el = en.target;
      const to = parseFloat(el.dataset.countTo);
      const dec = parseInt(el.dataset.decimals || "0", 10);
      if (state.reduced) { el.textContent = to.toFixed(dec); continue; }
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / 1400);
        const e = 1 - Math.pow(1 - t, 4);
        el.textContent = (to * e).toFixed(dec);
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.6 });
  document.querySelectorAll("[data-count-to]").forEach((el) => io.observe(el));
}

function marquee() {
  const rows = [...document.querySelectorAll(".marquee__row")];
  rows.forEach((r) => { r.innerHTML += r.innerHTML; });
  const off = rows.map(() => 0);
  let lastY = scrollY;
  let vel = 0;
  const frame = () => {
    requestAnimationFrame(frame);
    const dy = scrollY - lastY;
    lastY = scrollY;
    vel += (dy - vel) * 0.1;
    if (state.paused || state.reduced) return;
    rows.forEach((r, i) => {
      const dir = parseFloat(r.dataset.dir);
      const half = r.scrollWidth / 2;
      off[i] = (off[i] + 0.6 + Math.abs(vel) * 0.25) % half;
      const x = dir > 0 ? -off[i] : -(half - off[i]);
      r.style.transform = `translate3d(${x}px, 0, 0) skewX(${clamp(-vel * 0.4, -12, 12)}deg)`;
    });
  };
  requestAnimationFrame(frame);
}

function magnets() {
  if (!state.fine || state.reduced) return;
  for (const el of document.querySelectorAll("[data-magnet]")) {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  }
}

function cursor() {
  if (!state.fine || state.reduced) return;
  root.classList.add("has-cursor");
  const el = document.querySelector(".cursor");
  let x = -100, y = -100, cx = -100, cy = -100;
  addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
  document.addEventListener("pointerover", (e) => el.classList.toggle("is-link", !!e.target.closest("a, button")));
  const tick = () => {
    cx += (x - cx) * 0.22;
    cy += (y - cy) * 0.22;
    el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(tick);
  };
  tick();
}

function mail() {
  const m = document.querySelector(".contact__mail");
  m.addEventListener("pointermove", (e) => {
    const r = m.getBoundingClientRect();
    m.style.setProperty("--sx", `${100 - ((e.clientX - r.left) / r.width) * 100}%`);
  });
}

function pause() {
  const btn = document.querySelector(".pause");
  if (state.reduced) { btn.hidden = true; return; }
  btn.addEventListener("click", () => {
    state.paused = !state.paused;
    root.classList.toggle("is-paused", state.paused);
    btn.setAttribute("aria-pressed", String(state.paused));
    btn.textContent = state.paused ? "Play motion" : "Pause motion";
  });
}

function lazy(selector, loader) {
  const el = document.querySelector(selector);
  const io = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    io.disconnect();
    loader().then((m) => m).catch(() => {});
  }, { rootMargin: "100% 0px" });
  io.observe(el);
}

splitHero();
splitTitles();
sheen();
statement();
heroExit();
themeToggle();
nav();
experience();
work();
cardsGlow();
ghosts();
timeline();
peek();
countUp();
marquee();
magnets();
cursor();
mail();
pause();
startAurora(state);
const orb = startOrb(state);
lazy(".bh", () => import("./blackhole.js").then((m) => m.startBlackHole(state)));
lazy(".work", () => (document.querySelector(".work").classList.contains("is-3d") ? import("./warp.js").then((m) => m.startWarp(state)) : Promise.resolve()));
lazy(".about", () => import("./eye.js").then((m) => m.startEye(state)));
lazy(".contact", () => import("./swarm.js").then((m) => m.startSwarm(state)));
addEventListener("load", smooth);
intro().then(async () => {
  const api = await orb;
  if (api) api.reveal();
  requestAnimationFrame(() => hero.classList.add("is-in"));
});
