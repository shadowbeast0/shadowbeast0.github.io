const PALETTES = {
  dark: {
    hero: [[0.10, 0.16, 0.30], [0.30, 0.42, 0.55], [0.05, 0.06, 0.10], 0.55],
    prism: [[0.35, 0.10, 0.45], [0.05, 0.35, 0.55], [0.55, 0.25, 0.05], 0.75],
    exp: [[0.55, 0.12, 0.12], [0.08, 0.28, 0.65], [0.05, 0.45, 0.40], 0.8],
    work: [[0.30, 0.18, 0.70], [0.70, 0.30, 0.10], [0.05, 0.40, 0.45], 0.85],
    index: [[0.10, 0.30, 0.65], [0.60, 0.20, 0.10], [0.10, 0.45, 0.40], 0.7],
    record: [[0.65, 0.35, 0.05], [0.60, 0.08, 0.30], [0.15, 0.10, 0.35], 0.8],
    vol: [[0.05, 0.50, 0.35], [0.10, 0.30, 0.65], [0.60, 0.30, 0.08], 0.75],
    about: [[0.05, 0.35, 0.50], [0.45, 0.10, 0.40], [0.10, 0.20, 0.45], 0.75],
    contact: [[0.04, 0.12, 0.34], [0.02, 0.26, 0.32], [0.28, 0.16, 0.04], 0.7],
  },
  light: {
    hero: [[0.80, 0.86, 0.95], [0.95, 0.90, 0.82], [0.92, 0.92, 0.90], 0.5],
    prism: [[0.95, 0.80, 0.90], [0.78, 0.90, 0.98], [0.99, 0.90, 0.75], 0.65],
    exp: [[0.99, 0.82, 0.80], [0.80, 0.88, 0.99], [0.78, 0.96, 0.92], 0.7],
    work: [[0.86, 0.82, 0.99], [0.99, 0.86, 0.75], [0.78, 0.95, 0.95], 0.7],
    index: [[0.80, 0.88, 0.99], [0.99, 0.85, 0.78], [0.82, 0.96, 0.90], 0.6],
    record: [[0.99, 0.90, 0.72], [0.99, 0.80, 0.86], [0.88, 0.85, 0.98], 0.7],
    vol: [[0.78, 0.97, 0.88], [0.80, 0.88, 0.99], [0.99, 0.90, 0.75], 0.65],
    about: [[0.78, 0.92, 0.98], [0.96, 0.82, 0.94], [0.84, 0.88, 0.99], 0.65],
    contact: [[0.98, 0.94, 0.70], [0.78, 0.96, 0.84], [0.84, 0.88, 0.99], 0.7],
  },
};

const VERT = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
uniform vec3 uBg;
uniform float uAmt;
uniform vec2 uPointer;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 q = uv * vec2(uRes.x / uRes.y, 1.0) * 1.4;
  float t = uTime * 0.05;
  vec2 w = vec2(fbm(q + vec2(t, -t)), fbm(q + vec2(-t * 1.3, t * 0.7) + 4.0));
  float n1 = fbm(q * 0.9 + w * 1.6 + vec2(t * 2.0, 0.0));
  float n2 = fbm(q * 1.3 - w * 1.2 + vec2(0.0, t * 1.5) + 7.0);
  float band = smoothstep(0.25, 0.95, n1);
  float band2 = smoothstep(0.35, 1.0, n2);
  vec2 pd = uv - uPointer;
  float glow = exp(-dot(pd, pd) * 9.0) * 0.35;
  vec3 col = uC1 * band + uC2 * band2 * 0.9 + uC3 * (1.0 - band) * band2 * 0.8;
  col += (uC1 + uC2) * 0.5 * glow;
  float vig = smoothstep(1.25, 0.2, length(uv - 0.5));
  vec3 outc = mix(uBg, uBg + col, uAmt * vig);
  gl_FragColor = vec4(outc, 1.0);
}`;

export function startAurora(state) {
  const canvas = document.querySelector(".aurora");
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) { canvas.remove(); return; }
  const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(prog, n);
  const u = { res: U("uRes"), time: U("uTime"), c1: U("uC1"), c2: U("uC2"), c3: U("uC3"), bg: U("uBg"), amt: U("uAmt"), pointer: U("uPointer") };

  const scale = state.lite ? 0.16 : 0.33;
  const resize = () => {
    canvas.width = Math.max(1, Math.round(window.innerWidth * scale));
    canvas.height = Math.max(1, Math.round(window.innerHeight * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  window.addEventListener("resize", resize);

  const sections = [...document.querySelectorAll("[data-aurora]")];
  const cur = { c1: [0, 0, 0], c2: [0, 0, 0], c3: [0, 0, 0], amt: 0.5, bg: [0, 0, 0] };
  const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  window.addEventListener("pointermove", (e) => { pointer.tx = e.clientX / window.innerWidth; pointer.ty = 1 - e.clientY / window.innerHeight; }, { passive: true });

  const target = () => {
    const theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    const mid = window.innerHeight * 0.5;
    let name = "hero";
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) { name = s.dataset.aurora; break; }
    }
    const p = PALETTES[theme][name] || PALETTES[theme].hero;
    const bg = theme === "light" ? [0.949, 0.937, 0.910] : [0.02, 0.02, 0.024];
    return { c1: p[0], c2: p[1], c3: p[2], amt: p[3], bg };
  };
  const lerp = (a, b, k) => a + (b - a) * k;
  let t = 0;
  let last = performance.now();
  const first = target();
  Object.assign(cur, JSON.parse(JSON.stringify(first)));
  let lastDraw = 0;
  const frame = (now) => {
    requestAnimationFrame(frame);
    if (document.hidden || document.documentElement.classList.contains("venoming") || (state.lite && now - lastDraw < 40)) return;
    lastDraw = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!state.paused && !state.reduced) t += dt;
    const tg = target();
    const k = 0.04;
    for (const key of ["c1", "c2", "c3", "bg"]) for (let i = 0; i < 3; i++) cur[key][i] = lerp(cur[key][i], tg[key][i], key === "bg" ? 0.2 : k);
    cur.amt = lerp(cur.amt, tg.amt, k);
    pointer.x = lerp(pointer.x, pointer.tx, 0.05);
    pointer.y = lerp(pointer.y, pointer.ty, 0.05);
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform1f(u.time, t + 20);
    gl.uniform3fv(u.c1, cur.c1);
    gl.uniform3fv(u.c2, cur.c2);
    gl.uniform3fv(u.c3, cur.c3);
    gl.uniform3fv(u.bg, cur.bg);
    gl.uniform1f(u.amt, cur.amt);
    gl.uniform2f(u.pointer, pointer.x, pointer.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  requestAnimationFrame(frame);
}
