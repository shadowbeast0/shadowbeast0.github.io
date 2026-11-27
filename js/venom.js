const T = 9;

const VERT = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform vec2 uOrigin;
uniform float uTime;
uniform float uGrow;
uniform float uEat;
uniform vec2 uBias;
uniform vec2 uExit;
uniform vec4 uTa[${T}];
uniform vec4 uTb[${T}];
out vec4 outColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 3.1; a *= 0.5; }
  return v;
}
float smax(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (a - b) / k, 0.0, 1.0);
  return mix(b, a, h) + k * h * (1.0 - h);
}
float ease(float t) { t = clamp(t, 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }

float body(vec2 frag) {
  float S = length(uRes);
  vec2 p = (frag - uOrigin) / S;
  float t = uTime;
  float field = -1.0;
  for (int k = 0; k < ${T}; k++) {
    vec2 dir = uTa[k].xy;
    float speed = uTa[k].z;
    float delay = uTa[k].w;
    float width = uTb[k].x;
    float freq = uTb[k].y;
    float amp = uTb[k].z;
    float swell = uTb[k].w;
    float g = ease((uGrow - delay) / (1.0 - delay));
    float len = speed * pow(g, 0.7);
    if (len <= 0.0) continue;
    vec2 nrm = vec2(-dir.y, dir.x);
    float along = dot(p, dir);
    float wig = sin(along * freq - t * 5.0 + float(k) * 1.7) * amp * along + sin(along * freq * 2.3 + t * 3.0) * amp * 0.35 * along;
    float perp = abs(dot(p, nrm) - wig);
    float a = clamp(along / max(len, 0.0001), 0.0, 1.0);
    float r = width * pow(1.0 - a, 0.55) + 0.002;
    float d = (along < 0.0 || along > len) ? -1.0 : r - perp;
    vec2 tip = dir * len + nrm * (sin(len * freq - t * 5.0 + float(k) * 1.7) * amp * len);
    float blob = swell * ease((uGrow - delay - 0.25) / 0.55) * (0.85 + 0.15 * sin(t * 6.0 + float(k)));
    float db = blob - length(p - tip) + (fbm(p * 18.0 + float(k)) - 0.5) * blob * 0.6;
    field = smax(field, d, 0.012);
    field = smax(field, db, 0.03);
  }
  float ang = atan(p.y, p.x);
  vec2 q = p / max(length(p), 0.0001);
  float lop = 1.0 + 0.35 * dot(q, uBias);
  float mass = pow(ease((uGrow - 0.34) / 0.66), 2.2) * 2.1 * lop;
  float rim = mass * (0.82 + 0.3 * fbm(vec2(ang * 2.5, t * 0.4)));
  float dm = rim - length(p) + (fbm(p * 9.0 - t * 0.3) - 0.5) * 0.05;
  float core = ease(uGrow / 0.12) * 0.035 - length(p);
  field = smax(field, dm, 0.05);
  field = smax(field, core, 0.02);
  vec2 uv = frag / uRes.y;
  float holes = fbm(uv * 3.0 + vec2(t * 0.2, -t * 0.12)) + fbm(uv * 8.0 - t * 0.25) * 0.25;
  float retreat = uEat * (1.9 + clamp(dot(p, uExit), -1.0, 1.0) * 0.5);
  field = min(field, (holes - retreat + 0.1) * 0.5);
  return field;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float s = body(frag);
  float e = 1.5;
  float sx = body(frag + vec2(e, 0.0)) - s;
  float sy = body(frag + vec2(0.0, e)) - s;
  float mask = smoothstep(0.0, 0.0018, s);
  if (mask <= 0.0) { outColor = vec4(0.0); return; }
  float dome = smoothstep(0.0, 0.04, s);
  vec2 uv = frag / uRes.y;
  float skin = fbm(uv * 16.0 + vec2(uTime * 0.2, 0.0));
  float vein = fbm(uv * 4.5 + skin * 0.7 + uTime * 0.05);
  float veins = smoothstep(0.47, 0.5, vein) - smoothstep(0.5, 0.53, vein);
  float bend = 340.0 * (1.0 - dome * 0.85);
  vec3 n = normalize(vec3(-sx * bend - (skin - 0.5) * 0.4, -sy * bend - (skin - 0.5) * 0.4, 1.0));
  vec3 v = vec3(0.0, 0.0, 1.0);
  vec3 l1 = normalize(vec3(-0.5, 0.65, 0.8));
  vec3 l2 = normalize(vec3(0.75, -0.25, 0.6));
  float spec1 = pow(max(dot(reflect(-l1, n), v), 0.0), 70.0);
  float spec2 = pow(max(dot(reflect(-l2, n), v), 0.0), 22.0);
  float rim = pow(1.0 - n.z, 2.2);
  float pulse = 0.5 + 0.5 * sin(uTime * 7.0 - length(frag - uOrigin) * 0.02);
  vec3 col = vec3(0.01, 0.01, 0.016);
  col += vec3(0.05, 0.06, 0.09) * skin * 0.7;
  col += vec3(0.22, 0.32, 0.85) * veins * (0.08 + 0.12 * pulse);
  col += vec3(0.9, 0.94, 1.0) * spec1 * 1.3;
  col += vec3(0.4, 0.5, 0.95) * spec2 * 0.55;
  col += vec3(0.22, 0.28, 0.5) * rim * 0.7;
  outColor = vec4(col * mask, mask);
}`;

const smooth = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function venomTransition(origin, swap, lite = false) {
  const canvas = document.createElement("canvas");
  canvas.className = "venom";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) { canvas.remove(); swap(); return Promise.resolve(); }
  const dpr = lite ? 0.75 : Math.min(devicePixelRatio || 1, 1.25);
  canvas.width = Math.round(innerWidth * dpr);
  canvas.height = Math.round(innerHeight * dpr);
  gl.viewport(0, 0, canvas.width, canvas.height);
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
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

  const ox = origin.x / innerWidth * 2 - 1;
  const oy = 1 - origin.y / innerHeight * 2;
  const toward = Math.atan2(-oy, -ox);
  const ta = [];
  const tb = [];
  for (let k = 0; k < T; k++) {
    const lead = k < 3;
    const a = toward + (lead ? (Math.random() - 0.5) * 1.1 : (Math.random() - 0.5) * Math.PI * 2);
    ta.push(Math.cos(a), Math.sin(a), lead ? 0.7 + Math.random() * 0.6 : 0.25 + Math.random() * 0.45, lead ? Math.random() * 0.08 : 0.05 + Math.random() * 0.3);
    tb.push(0.012 + Math.random() * 0.02, 8 + Math.random() * 14, 0.04 + Math.random() * 0.08, 0.03 + Math.random() * 0.07);
  }
  const bias = toward + (Math.random() - 0.5) * 0.9;
  const exit = Math.random() * Math.PI * 2;
  gl.uniform2f(U("uRes"), canvas.width, canvas.height);
  gl.uniform2f(U("uOrigin"), origin.x * dpr, (innerHeight - origin.y) * dpr);
  gl.uniform4fv(U("uTa"), new Float32Array(ta));
  gl.uniform4fv(U("uTb"), new Float32Array(tb));
  gl.uniform2f(U("uBias"), Math.cos(bias), Math.sin(bias));
  gl.uniform2f(U("uExit"), Math.cos(exit), Math.sin(exit));
  const uTime = U("uTime"), uGrow = U("uGrow"), uEat = U("uEat");

  const GROW = 2700, HOLD = 300, EAT = 1600;
  const shakeAt = GROW * 0.62;
  const start = performance.now();
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
            { transform: "translate3d(-4px,3px,0)" },
            { transform: "translate3d(5px,-2px,0)" },
            { transform: "translate3d(-3px,-3px,0)" },
            { transform: "translate3d(2px,2px,0)" },
            { transform: "translate3d(0,0,0)" },
          ], { duration: 420, easing: "ease-out" });
        }
      }
      if (!swapped && t >= GROW) { swapped = true; swap(); }
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, t / 1000);
      gl.uniform1f(uGrow, grow);
      gl.uniform1f(uEat, eat);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (t < GROW + HOLD + EAT) requestAnimationFrame(frame);
      else { canvas.remove(); resolve(); }
    };
    requestAnimationFrame(frame);
  });
}
