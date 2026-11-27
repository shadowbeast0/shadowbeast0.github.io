const VERT = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = (steps) => `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uDist;
uniform float uIncl;
uniform float uYaw;
uniform vec2 uLook;
uniform float uShift;
out vec4 outColor;

float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash2(i), hash2(i + vec2(1, 0)), u.x), mix(hash2(i + vec2(0, 1)), hash2(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; } return v; }

vec3 stars(vec3 d) {
  vec3 col = vec3(0.0);
  for (int k = 0; k < 3; k++) {
    float sc = 90.0 + float(k) * 110.0;
    vec3 c = floor(d * sc);
    float h = hash(c + float(k) * 13.0);
    if (h > 0.985) {
      vec3 f = fract(d * sc) - 0.5;
      float b = smoothstep(0.35, 0.0, length(f)) * (h - 0.985) * 66.0;
      col += mix(vec3(1.0, 0.85, 0.7), vec3(0.7, 0.85, 1.0), hash(c + 7.0)) * b;
    }
  }
  float neb = fbm(d.xy * 2.2 + d.z) * fbm(d.yz * 3.1 - 1.3);
  col += vec3(0.08, 0.05, 0.12) * neb * 1.4 + vec3(0.02, 0.05, 0.09) * fbm(d.zx * 4.0);
  return col;
}

vec3 diskColor(vec3 pos, vec3 dir) {
  float r = length(pos.xz);
  if (r < 2.4 || r > 9.0) return vec3(0.0);
  float a = atan(pos.z, pos.x);
  float speed = 1.0 / sqrt(r);
  float swirl = a + uTime * speed * 1.6;
  float turb = fbm(vec2(swirl * 3.0, r * 1.4)) * 0.7 + fbm(vec2(swirl * 9.0, r * 5.0)) * 0.3;
  float bands = 0.6 + 0.4 * sin(r * 7.0 + turb * 6.0);
  float x = (r - 2.4) / 6.6;
  float heat = pow(1.0 - x, 2.2);
  vec3 c = mix(vec3(0.75, 0.22, 0.04), vec3(1.0, 0.62, 0.22), smoothstep(0.0, 0.45, heat));
  c = mix(c, vec3(1.0, 0.95, 0.85), smoothstep(0.55, 1.0, heat));
  vec3 vel = normalize(vec3(-pos.z, 0.0, pos.x));
  float dopp = 1.0 + dot(vel, -dir) * 0.75;
  float edge = smoothstep(2.4, 2.9, r) * smoothstep(9.0, 6.5, r);
  return c * heat * 5.6 * bands * turb * edge * pow(max(dopp, 0.1), 3.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  uv -= uLook * 0.04;
  uv.x += uShift;
  float ci = cos(uIncl), si = sin(uIncl), cy = cos(uYaw), sy = sin(uYaw);
  vec3 ro = vec3(sy * uDist * ci, uDist * si, -cy * uDist * ci);
  vec3 fw = normalize(-ro);
  vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw));
  vec3 up = cross(fw, rt);
  vec3 rd = normalize(fw * 1.6 + rt * uv.x + up * uv.y);
  vec3 pos = ro;
  vec3 dir = rd;
  vec3 col = vec3(0.0);
  float alpha = 1.0;
  bool captured = false;
  for (int i = 0; i < ${steps}; i++) {
    float r = length(pos);
    if (r < 1.0) { captured = true; break; }
    float h = clamp(r * 0.06, 0.04, 0.9);
    vec3 acc = -normalize(pos) * 1.55 / (r * r);
    vec3 np = pos + dir * h;
    dir = normalize(dir + acc * h);
    if (pos.y * np.y < 0.0) {
      vec3 hit = mix(pos, np, pos.y / (pos.y - np.y));
      vec3 dc = diskColor(hit, dir);
      col += dc * alpha;
      alpha *= 1.0 - clamp(length(dc) * 0.22, 0.0, 0.92);
    }
    pos = np;
    if (r > 60.0) break;
  }
  if (!captured) col += stars(dir) * alpha;
  float glow = exp(-pow(length(uv) * 2.2, 2.0)) * 0.06;
  col += vec3(1.0, 0.6, 0.25) * glow;
  col = 1.0 - exp(-col * 1.15);
  col = pow(col, vec3(0.92));
  float vig = smoothstep(1.3, 0.35, length(uv));
  outColor = vec4(col * vig, 1.0);
}`;

export function startBlackHole(state) {
  const section = document.querySelector(".bh");
  const canvas = section.querySelector(".bh__gl");
  const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
  if (!gl) { section.classList.add("no-gl"); return; }
  const small = innerWidth < 760;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG(state.lite ? 64 : small ? 110 : 170)));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { section.classList.add("no-gl"); return; }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(prog, n);
  const u = { res: U("uRes"), time: U("uTime"), dist: U("uDist"), incl: U("uIncl"), yaw: U("uYaw"), look: U("uLook"), shift: U("uShift") };

  const scale = state.lite ? 0.32 : small ? 0.5 : 0.62;
  const resize = () => {
    const pr = state.lite ? 1 : Math.min(devicePixelRatio, 1.5);
    canvas.width = Math.round(canvas.clientWidth * scale * pr);
    canvas.height = Math.round(canvas.clientHeight * scale * pr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  addEventListener("resize", resize);

  const look = { x: 0, y: 0, tx: 0, ty: 0 };
  section.addEventListener("pointermove", (e) => { look.tx = e.clientX / innerWidth - 0.5; look.ty = 0.5 - e.clientY / innerHeight; });

  let visible = false;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(section);
  let t = 0;
  let last = performance.now();
  let lastDraw = 0;
  const frame = (now) => {
    requestAnimationFrame(frame);
    if (!visible || (state.lite && now - lastDraw < 33)) return;
    lastDraw = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!state.paused && !state.reduced) t += dt;
    const r = section.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
    const e = p * p * (3 - 2 * p);
    look.x += (look.tx - look.x) * 0.05;
    look.y += (look.ty - look.y) * 0.05;
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform1f(u.time, t);
    gl.uniform1f(u.dist, 30 - e * 16);
    gl.uniform1f(u.incl, 0.16 + e * 0.12 + look.y * 0.1);
    gl.uniform1f(u.yaw, -0.25 + e * 0.6 + look.x * 0.25);
    gl.uniform2f(u.look, look.x, look.y);
    gl.uniform1f(u.shift, small ? 0.0 : -0.36);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    section.style.setProperty("--bh", e.toFixed(3));
  };
  requestAnimationFrame(frame);
}
