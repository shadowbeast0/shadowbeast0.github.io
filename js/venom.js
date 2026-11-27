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
uniform vec3 uTint;
out vec4 outColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 6; i++) { v += a * noise(p); p = p * 2.02 + 3.1; a *= 0.5; }
  return v;
}

float body(vec2 frag) {
  vec2 d = frag - uOrigin;
  float maxd = length(max(uOrigin, uRes - uOrigin)) * 1.08;
  float r = length(d) / maxd;
  float a = atan(d.y, d.x);
  float t = uTime;
  float warp = fbm(vec2(a * 2.2, r * 3.0 - t * 0.6)) - 0.5;
  float spikes = pow(abs(sin(a * 9.0 + warp * 7.0 + t * 0.4)), 18.0);
  float spikes2 = pow(abs(sin(a * 23.0 - warp * 9.0)), 40.0);
  float reach = uGrow * 1.35;
  float front = reach * (0.78 + 0.22 * fbm(vec2(a * 3.0, t * 0.5)))
              + (spikes * 0.35 + spikes2 * 0.22) * reach * (1.0 - uGrow * 0.35);
  float s = front - r;
  vec2 uv = frag / uRes.y;
  float drops = smoothstep(0.62, 0.7, fbm(uv * 7.0 + t * 0.2)) * smoothstep(0.25, 0.0, abs(s - 0.04)) * step(0.02, uGrow);
  s = max(s, drops * 0.03);
  float holes = fbm(uv * 3.2 + vec2(t * 0.25, -t * 0.15)) + fbm(uv * 9.0 - t * 0.3) * 0.25;
  s = min(s, (holes - uEat * 1.45 + 0.08) * 0.6);
  return s;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float s = body(frag);
  float e = 1.5;
  float sx = body(frag + vec2(e, 0.0)) - s;
  float sy = body(frag + vec2(0.0, e)) - s;
  float mask = smoothstep(0.0, 0.0025, s);
  if (mask <= 0.0) { outColor = vec4(0.0); return; }
  float dome = smoothstep(0.0, 0.05, s);
  vec2 uv = frag / uRes.y;
  float skin = fbm(uv * 14.0 + vec2(uTime * 0.15, 0.0));
  float veins = smoothstep(0.48, 0.5, fbm(uv * 5.0 + skin * 0.6)) - smoothstep(0.5, 0.53, fbm(uv * 5.0 + skin * 0.6));
  vec3 n = normalize(vec3(-sx * 260.0 * (1.0 - dome * 0.8) - (skin - 0.5) * 0.35, -sy * 260.0 * (1.0 - dome * 0.8) - (skin - 0.5) * 0.35, 1.0));
  vec3 l1 = normalize(vec3(-0.5, 0.6, 0.8));
  vec3 l2 = normalize(vec3(0.7, -0.3, 0.6));
  vec3 v = vec3(0.0, 0.0, 1.0);
  float spec1 = pow(max(dot(reflect(-l1, n), v), 0.0), 60.0);
  float spec2 = pow(max(dot(reflect(-l2, n), v), 0.0), 24.0);
  float rim = pow(1.0 - n.z, 2.0);
  vec3 col = vec3(0.012, 0.012, 0.018);
  col += vec3(0.06, 0.07, 0.1) * skin * 0.6;
  col += uTint * veins * 0.12;
  col += vec3(0.85, 0.9, 1.0) * spec1 * 1.2;
  col += vec3(0.45, 0.55, 0.9) * spec2 * 0.5;
  col += vec3(0.25, 0.3, 0.45) * rim * 0.6;
  outColor = vec4(col * mask, mask);
}`;

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function venomTransition(origin, swap) {
  const canvas = document.createElement("canvas");
  canvas.className = "venom";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, alpha: true });
  if (!gl) { canvas.remove(); swap(); return Promise.resolve(); }
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
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
  gl.uniform2f(U("uRes"), canvas.width, canvas.height);
  gl.uniform2f(U("uOrigin"), origin.x * dpr, (innerHeight - origin.y) * dpr);
  gl.uniform3f(U("uTint"), 0.35, 0.45, 1.0);
  const uTime = U("uTime"), uGrow = U("uGrow"), uEat = U("uEat");
  const GROW = 950, HOLD = 160, EAT = 1050;
  const start = performance.now();
  let swapped = false;
  return new Promise((resolve) => {
    const frame = (now) => {
      const t = now - start;
      const grow = ease(Math.min(1, t / GROW));
      const eat = ease(Math.min(1, Math.max(0, (t - GROW - HOLD) / EAT)));
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
