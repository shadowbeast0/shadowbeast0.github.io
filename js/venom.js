const VERT = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = (T, B) => `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform vec2 uOrigin;
uniform float uTime;
uniform float uGrow;
uniform float uEat;
uniform vec2 uBias;
uniform vec2 uExit;
uniform float uSeed;
uniform vec4 uTa[${T}];
uniform vec4 uTb[${T}];
out vec4 outColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float h1(float x) { return fract(sin(x * 91.345 + uSeed) * 47453.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.07 + 3.1; a *= 0.5; }
  return v;
}
float ridge(vec2 p) {
  float v = 0.0, a = 0.55;
  for (int i = 0; i < 4; i++) { float n = 1.0 - abs(noise(p) * 2.0 - 1.0); v += a * n * n; p = p * 2.2 + 1.7; a *= 0.5; }
  return v;
}
float smax(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (a - b) / k, 0.0, 1.0);
  return mix(b, a, h) + k * h * (1.0 - h);
}
float ease(float t) { t = clamp(t, 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }

float wiggle(float s, float freq, float amp, float ph) {
  return (sin(s * freq - uTime * 5.5 + ph) + 0.45 * sin(s * freq * 2.7 + uTime * 3.3 + ph * 1.7) + 0.2 * sin(s * freq * 6.1 - uTime * 7.0)) * amp * s;
}

float strand(vec2 p, vec2 o, vec2 dir, float len, float width, float freq, float amp, float ph) {
  if (len <= 0.0) return -1.0;
  vec2 q = p - o;
  vec2 nrm = vec2(-dir.y, dir.x);
  float along = dot(q, dir);
  if (along < 0.0 || along > len) return -1.0;
  float perp = abs(dot(q, nrm) - wiggle(along, freq, amp, ph));
  float a = along / len;
  float lump = 0.65 + 0.7 * noise(vec2(along * 70.0 + ph * 10.0, ph));
  float r = width * pow(1.0 - a, 0.7) * lump + 0.0012;
  float rag = (noise(vec2(along * 160.0, perp * 400.0 + ph)) - 0.5) * r * 0.9;
  return r - perp + rag;
}

vec2 rot(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }

float body(vec2 frag) {
  float S = length(uRes);
  vec2 p = (frag - uOrigin) / S;
  float t = uTime;
  float field = -1.0;
  float ang = atan(p.y, p.x);
  vec2 q = p / max(length(p), 0.0001);
  float lop = 1.0 + 0.35 * dot(q, uBias);
  float mass = pow(ease((uGrow - 0.42) / 0.58), 2.2) * 2.1 * lop;
  float spikes = pow(noise(vec2(ang * 34.0, t * 0.8)), 4.0) * 0.12 + pow(noise(vec2(ang * 90.0, 3.0)), 6.0) * 0.06;
  float rim = mass * (0.8 + 0.3 * fbm(vec2(ang * 3.0, t * 0.4))) + spikes * min(mass * 3.0, 1.0);
  float dm = rim - length(p) + (ridge(p * 14.0 - t * 0.3) - 0.5) * 0.04;
  float core = ease(uGrow / 0.1) * 0.03 - length(p) + (noise(p * 60.0) - 0.5) * 0.012;
  if (dm > 0.03) {
    field = dm;
  } else {
    for (int k = 0; k < ${T}; k++) {
      vec2 dir = uTa[k].xy;
      float speed = uTa[k].z;
      float delay = uTa[k].w;
      float width = uTb[k].x;
      float freq = uTb[k].y;
      float amp = uTb[k].z;
      float swell = uTb[k].w;
      float fk = float(k);
      float g = ease((uGrow - delay) / (1.0 - delay));
      float len = speed * pow(g, 0.65);
      if (len <= 0.0) continue;
      float al = dot(p, dir);
      if (al < -0.06 || al > len * 1.15 + 0.08 || abs(dot(p, vec2(-dir.y, dir.x))) > len * 0.85 + 0.06) continue;
      field = smax(field, strand(p, vec2(0.0), dir, len, width, freq, amp, fk * 1.7), 0.004);
      vec2 nrm = vec2(-dir.y, dir.x);
      for (int b = 0; b < ${B}; b++) {
        float fb = float(b);
        float at = 0.22 + 0.22 * fb + h1(fk * 7.0 + fb) * 0.12;
        float s0 = at * speed;
        float bg = clamp((len - s0) / (speed * 0.45), 0.0, 1.0);
        if (bg <= 0.0) continue;
        vec2 o = dir * s0 + nrm * wiggle(s0, freq, amp, fk * 1.7);
        float side = (mod(fb + fk, 2.0) < 1.0 ? 1.0 : -1.0);
        float ang = side * (0.45 + h1(fk * 3.1 + fb * 5.3) * 0.75);
        vec2 bd = rot(dir, ang);
        float blen = speed * (0.3 + h1(fk + fb * 11.0) * 0.35) * (1.0 - at * 0.6) * pow(bg, 0.7);
        float bw = width * (0.5 + 0.2 * h1(fb + fk * 2.0)) * (1.0 - at * 0.7);
        field = smax(field, strand(p, o, bd, blen, bw, freq * 1.4, amp * 1.3, fk * 2.3 + fb * 4.1), 0.003);
        float tw = clamp((bg - 0.45) / 0.55, 0.0, 1.0);
        if (tw > 0.0) {
          vec2 bn = vec2(-bd.y, bd.x);
          float s1 = blen * 0.55;
          vec2 o2 = o + bd * s1 + bn * wiggle(s1, freq * 1.4, amp * 1.3, fk * 2.3 + fb * 4.1);
          vec2 td = rot(bd, -side * (0.6 + h1(fk * 5.0 + fb) * 0.6));
          field = smax(field, strand(p, o2, td, blen * 0.45 * tw, bw * 0.55, freq * 2.0, amp * 1.6, fk + fb * 9.0), 0.002);
        }
      }
      vec2 tip = dir * len + nrm * wiggle(len, freq, amp, fk * 1.7);
      float blob = swell * ease((uGrow - delay - 0.3) / 0.5);
      float spiky = (noise(p * 40.0 + fk * 7.0) - 0.5) * blob * 1.1;
      field = smax(field, blob - length(p - tip) + spiky, 0.01);
    }

    field = smax(field, dm, 0.012);
    field = smax(field, core, 0.008);
  }
  vec2 uv = frag / uRes.y;
  float holes = fbm(uv * 3.2 + vec2(t * 0.2, -t * 0.12)) + ridge(uv * 9.0 - t * 0.2) * 0.22;
  float retreat = uEat * (1.9 + clamp(dot(p, uExit), -1.0, 1.0) * 0.5);
  field = min(field, (holes - retreat + 0.1) * 0.5);
  return field;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float s = body(frag);
  float sx = dFdx(s) * 1.5;
  float sy = dFdy(s) * 1.5;
  float mask = smoothstep(0.0, 0.0012, s);
  if (mask <= 0.0) { outColor = vec4(0.0); return; }
  float dome = smoothstep(0.0, 0.03, s);
  vec2 uv = frag / uRes.y;
  float edge = 1.0 - smoothstep(0.0, 0.025, s);
  float fold = fbm(uv * 3.2 + vec2(uTime * 0.12, -uTime * 0.08));
  float fib = ridge(uv * vec2(2.5, 9.0) + vec2(uTime * 0.06, fold * 1.5));
  float skin = fbm(uv * 14.0 + vec2(uTime * 0.25, 0.0));
  float bump = (fold - 0.5) * 0.9 + (fib - 0.5) * 0.45 + (skin - 0.5) * 0.7 * edge;
  float vein = ridge(uv * 5.5 + skin * 0.8 + uTime * 0.05);
  float veins = smoothstep(0.72, 0.9, vein);
  float bend = 420.0 * pow(1.0 - dome, 2.0);
  vec2 gb = vec2(dFdx(bump), dFdy(bump)) * 16.0;
  vec3 n = normalize(vec3(-sx * bend - gb.x, -sy * bend - gb.y, 1.0));
  vec3 v = vec3(0.0, 0.0, 1.0);
  vec3 l1 = normalize(vec3(-0.5, 0.65, 0.8));
  vec3 l2 = normalize(vec3(0.75, -0.25, 0.6));
  float spec1 = pow(max(dot(reflect(-l1, n), v), 0.0), 90.0);
  float spec2 = pow(max(dot(reflect(-l2, n), v), 0.0), 26.0);
  float rim = pow(1.0 - n.z, 2.2);
  float pulse = 0.5 + 0.5 * sin(uTime * 7.0 - length(frag - uOrigin) * 0.02);
  vec3 col = vec3(0.008, 0.008, 0.013);
  col += vec3(0.04, 0.05, 0.075) * (fold * 0.7 + fib * 0.4);
  col += vec3(0.25, 0.35, 0.95) * veins * (0.07 + 0.13 * pulse);
  col += vec3(0.92, 0.95, 1.0) * spec1 * 1.4;
  col += vec3(0.4, 0.5, 0.95) * spec2 * 0.5;
  col += vec3(0.22, 0.28, 0.5) * rim * 0.75;
  outColor = vec4(col * mask, mask);
}`;

const smooth = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function venomTransition(origin, swap, lite = false) {
  const T = lite ? 10 : 16;
  const B = lite ? 1 : 3;
  const canvas = document.createElement("canvas");
  canvas.className = "venom";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) { canvas.remove(); swap(); return Promise.resolve(); }
  const dpr = lite ? 0.7 : Math.min(0.66, 1100 / Math.max(innerWidth, 1));
  canvas.width = Math.round(innerWidth * dpr);
  canvas.height = Math.round(innerHeight * dpr);
  gl.viewport(0, 0, canvas.width, canvas.height);
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG(T, B)));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); swap(); return Promise.resolve(); }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const U = (n) => gl.getUniformLocation(prog, n);

  const ox = (origin.x / innerWidth) * 2 - 1;
  const oy = 1 - (origin.y / innerHeight) * 2;
  const toward = Math.atan2(-oy, -ox);
  const ta = [];
  const tb = [];
  for (let k = 0; k < T; k++) {
    const lead = k % 3 === 0;
    const fan = ((k + 0.5) / T - 0.5) * 2.3 + (Math.random() - 0.5) * 0.22;
    const a = toward + fan;
    ta.push(Math.cos(a), Math.sin(a), lead ? 0.75 + Math.random() * 0.55 : 0.35 + Math.random() * 0.5, lead ? Math.random() * 0.06 : 0.03 + Math.random() * 0.3);
    tb.push(0.009 + Math.random() * 0.016, 9 + Math.random() * 16, 0.05 + Math.random() * 0.09, 0.02 + Math.random() * 0.05);
  }
  const bias = toward + (Math.random() - 0.5) * 0.9;
  const exit = Math.random() * Math.PI * 2;
  gl.uniform2f(U("uRes"), canvas.width, canvas.height);
  gl.uniform2f(U("uOrigin"), origin.x * dpr, (innerHeight - origin.y) * dpr);
  gl.uniform4fv(U("uTa"), new Float32Array(ta));
  gl.uniform4fv(U("uTb"), new Float32Array(tb));
  gl.uniform2f(U("uBias"), Math.cos(bias), Math.sin(bias));
  gl.uniform2f(U("uExit"), Math.cos(exit), Math.sin(exit));
  gl.uniform1f(U("uSeed"), Math.random() * 100);
  const uTime = U("uTime"), uGrow = U("uGrow"), uEat = U("uEat");

  const GROW = 2900, HOLD = 300, EAT = 1600;
  const shakeAt = GROW * 0.62;
  const start = performance.now();
  document.documentElement.classList.add("venoming");
  let swapped = false;
  let shook = false;
  return new Promise((resolve) => {
    const frame = (now) => {
      const t = now - start;
      const grow = Math.min(1, t / GROW);
      const eat = smooth(Math.min(1, Math.max(0, (t - GROW - HOLD) / EAT)));
      if (!shook && t > shakeAt) {
        shook = true;
        const m = document.querySelector("main");
        if (m && m.animate) {
          m.animate([
            { transform: "translate3d(0,0,0)" },
            { transform: "translate3d(-5px,3px,0)" },
            { transform: "translate3d(6px,-3px,0)" },
            { transform: "translate3d(-3px,-4px,0)" },
            { transform: "translate3d(2px,2px,0)" },
            { transform: "translate3d(0,0,0)" },
          ], { duration: 460, easing: "ease-out" });
        }
      }
      if (!swapped && t >= GROW) { swapped = true; swap(); document.documentElement.classList.remove("venoming"); }
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, t / 1000);
      gl.uniform1f(uGrow, grow);
      gl.uniform1f(uEat, eat);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (t < GROW + HOLD + EAT) requestAnimationFrame(frame);
      else { canvas.remove(); document.documentElement.classList.remove("venoming"); resolve(); }
    };
    requestAnimationFrame(frame);
  });
}
