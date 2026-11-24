const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;
const hero = document.querySelector(".hero");

function splitChars() {
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

function splitWords() {
  for (const el of document.querySelectorAll("[data-words]")) {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach((w, idx) => {
      const s = document.createElement("span");
      s.className = "w";
      s.textContent = w;
      el.appendChild(s);
      if (idx < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
  }
}

function runIntro() {
  const intro = document.querySelector(".intro");
  let seen = false;
  try { seen = sessionStorage.getItem("shad:intro") === "1"; } catch {}
  if (reduced || seen) {
    intro.classList.add("is-skipped");
    return Promise.resolve();
  }
  const count = intro.querySelector("[data-count]");
  const bar = intro.querySelector(".intro__bar span");
  const duration = 1300;
  const start = performance.now();
  return new Promise((resolve) => {
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      count.textContent = String(Math.round(eased * 100)).padStart(2, "0");
      bar.style.setProperty("--p", eased);
      if (t < 1) return requestAnimationFrame(tick);
      try { sessionStorage.setItem("shad:intro", "1"); } catch {}
      intro.classList.add("is-done");
      setTimeout(() => intro.classList.add("is-skipped"), 1200);
      resolve();
    };
    requestAnimationFrame(tick);
  });
}

async function startOrb() {
  const canvas = document.querySelector(".hero__gl");
  let THREE;
  try {
    THREE = await import("three");
  } catch {
    hero.classList.add("no-gl");
    return;
  }
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    hero.classList.add("no-gl");
    return;
  }
  const small = window.innerWidth < 760;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 6.2);

  const uniforms = {
    uTime: { value: 0 },
    uAmp: { value: 0.24 },
    uPointer: { value: new THREE.Vector2() },
    uEnergy: { value: 0 },
  };

  const geometry = new THREE.IcosahedronGeometry(1.25, small ? 48 : 96);
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      uniform float uTime;
      uniform float uAmp;
      uniform float uEnergy;
      uniform vec2 uPointer;
      varying vec3 vNormal;
      varying vec3 vView;
      varying float vDisp;

      vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      float snoise(vec3 v) {
        const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + 2.0 * C.xxx;
        vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
        i = mod(i, 289.0);
        vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 1.0 / 7.0;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
      }

      float field(vec3 p) {
        float t = uTime * 0.18;
        float n = snoise(p * 0.72 + vec3(t, t * 0.7, -t));
        n += 0.18 * snoise(p * 1.5 - vec3(t * 1.3, 0.0, t));
        vec3 dir = normalize(vec3(uPointer, 0.9));
        float pull = pow(max(dot(normalize(p), dir), 0.0), 6.0);
        return n * (uAmp + uEnergy * 0.2) + pull * (0.14 + uEnergy * 0.3);
      }

      vec3 displaced(vec3 p) {
        return p + normalize(p) * field(p);
      }

      void main() {
        vec3 p = position;
        vec3 n = normalize(normal);
        vec3 tangent = normalize(cross(n, abs(n.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
        vec3 bitangent = normalize(cross(n, tangent));
        float e = 0.01;
        vec3 a = displaced(p);
        vec3 b = displaced(p + tangent * e);
        vec3 c = displaced(p + bitangent * e);
        vec3 dn = normalize(cross(b - a, c - a));
        vDisp = field(p);
        vNormal = normalize(normalMatrix * dn);
        vec4 mv = modelViewMatrix * vec4(a, 1.0);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vView;
      varying float vDisp;

      vec3 studio(vec3 r) {
        float y = r.y;
        vec3 col = mix(vec3(0.015, 0.016, 0.02), vec3(0.09, 0.095, 0.11), smoothstep(-1.0, 0.2, y));
        col += vec3(1.0) * smoothstep(0.18, 0.02, abs(y - 0.62)) * 1.4;
        col += vec3(0.9, 0.95, 1.0) * smoothstep(0.08, 0.0, abs(r.x + 0.55)) * smoothstep(-0.2, 0.6, y) * 1.1;
        col += vec3(0.62, 0.89, 1.0) * smoothstep(0.12, 0.0, abs(r.x - 0.72 + 0.1 * sin(uTime * 0.3))) * 0.9;
        col += vec3(1.0, 0.82, 0.62) * smoothstep(0.25, 0.0, abs(y + 0.55)) * 0.35;
        return col;
      }

      void main() {
        vec3 n = normalize(vNormal);
        vec3 v = normalize(vView);
        vec3 r = reflect(-v, n);
        float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
        vec3 base = studio(r);
        vec3 film = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + fres * 0.7 + vDisp * 0.9));
        vec3 col = base * mix(vec3(1.0), film * 1.2, 0.18 + fres * 0.4);
        col += fres * vec3(0.55, 0.85, 1.0) * 0.35;
        col = col / (col + vec3(0.85));
        col = pow(col, vec3(0.9));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0, energy: 0 };
  let last = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -((e.clientY / window.innerHeight) * 2 - 1);
    const speed = Math.hypot(x - last.x, y - last.y);
    pointer.energy = Math.min(1, pointer.energy + speed * 2.2);
    pointer.tx = x;
    pointer.ty = y;
    last = { x, y };
  }, { passive: true });

  function layout() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const narrow = w < 760;
    camera.position.z = narrow ? 8.4 : 6.2;
    mesh.position.set(narrow ? 0.15 : 0.35, narrow ? 0.55 : 0.05, 0);
    camera.updateProjectionMatrix();
  }
  layout();
  window.addEventListener("resize", layout);

  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(hero);

  let paused = false;
  const pauseBtn = document.querySelector(".hero__pause");
  if (reduced) pauseBtn.hidden = true;
  pauseBtn.addEventListener("click", () => {
    paused = !paused;
    pauseBtn.setAttribute("aria-pressed", String(paused));
    pauseBtn.textContent = paused ? "Play motion" : "Pause motion";
  });

  const clock = new THREE.Clock();
  let scale = reduced ? 1 : 0.6;
  const loop = () => {
    requestAnimationFrame(loop);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!reduced && !paused) uniforms.uTime.value += dt;
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    pointer.energy *= 0.96;
    uniforms.uEnergy.value += (pointer.energy - uniforms.uEnergy.value) * 0.1;
    uniforms.uPointer.value.set(pointer.x, pointer.y);
    mesh.rotation.y += ((pointer.x * 0.6 + uniforms.uTime.value * 0.08) - mesh.rotation.y) * 0.05;
    mesh.rotation.x += ((-pointer.y * 0.4) - mesh.rotation.x) * 0.05;
    scale += (1 - scale) * 0.04;
    const scrollFade = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.9));
    mesh.scale.setScalar(scale * (0.85 + scrollFade * 0.15));
    canvas.style.opacity = String(0.25 + scrollFade * 0.75);
    renderer.render(scene, camera);
  };
  loop();
}

function smoothScroll() {
  if (reduced || !window.Lenis) return null;
  const lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  for (const a of document.querySelectorAll('a[href^="#"]')) {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id === "#top" ? 0 : document.querySelector(id);
      if (target === null) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: id === "#top" ? 0 : -80 });
      if (target) {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    });
  }
  return lenis;
}

function navState() {
  const nav = document.querySelector(".nav");
  let lastY = window.scrollY;
  const update = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-solid", y > 40);
    nav.classList.toggle("is-hidden", y > lastY && y > window.innerHeight * 0.8 && !nav.contains(document.activeElement));
    lastY = y;
  };
  window.addEventListener("scroll", update, { passive: true });
  nav.addEventListener("focusin", () => nav.classList.remove("is-hidden"));
  update();
}

function statementReveal() {
  const el = document.querySelector("[data-words]");
  if (!el) return;
  const words = [...el.querySelectorAll(".w")];
  if (reduced) { words.forEach((w) => w.classList.add("on")); return; }
  const update = () => {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
    const lit = Math.round(progress * words.length);
    words.forEach((w, i) => w.classList.toggle("on", i < lit));
  };
  window.addEventListener("scroll", update, { passive: true });
  update();
}

function glare() {
  for (const shot of document.querySelectorAll(".shot")) {
    shot.addEventListener("pointermove", (e) => {
      const r = shot.getBoundingClientRect();
      shot.style.setProperty("--gx", `${e.clientX - r.left}px`);
      shot.style.setProperty("--gy", `${e.clientY - r.top}px`);
    });
  }
  const mail = document.querySelector(".contact__mail");
  if (mail) {
    mail.addEventListener("pointermove", (e) => {
      const r = mail.getBoundingClientRect();
      mail.style.setProperty("--sx", `${((e.clientX - r.left) / r.width) * 100}%`);
    });
  }
}

function cursor() {
  if (!finePointer || reduced) return;
  document.documentElement.classList.add("has-cursor");
  const el = document.querySelector(".cursor");
  let x = -100, y = -100, cx = -100, cy = -100;
  window.addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
  document.addEventListener("pointerover", (e) => {
    el.classList.toggle("is-link", !!e.target.closest("a, button"));
  });
  const tick = () => {
    cx += (x - cx) * 0.22;
    cy += (y - cy) * 0.22;
    el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(tick);
  };
  tick();
}

splitChars();
splitWords();
navState();
statementReveal();
glare();
cursor();
const orb = startOrb();
window.addEventListener("load", () => smoothScroll());
runIntro().then(async () => {
  await orb;
  requestAnimationFrame(() => hero.classList.add("is-in"));
});
