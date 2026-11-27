import { signSVG } from "./signs.js";

const VISION = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const HAND_MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export const FORMATIONS = [
  { id: 0, name: "Orbit", hint: "Thumb and pinky", pal: ["#7cf6ff", "#6b7bff", "#ff6bd6"] },
  { id: 1, name: "Sphere", hint: "Fist", pal: ["#ffcf6b", "#ff6a3d", "#fff2c2"] },
  { id: 2, name: "Galaxy", hint: "Open palm", pal: ["#a58cff", "#4fdcff", "#ff8ad8"] },
  { id: 3, name: "Helix", hint: "Two fingers", pal: ["#5dffb0", "#3fb8ff", "#e9fff6"] },
  { id: 4, name: "Torus", hint: "Three fingers", pal: ["#ff5fa2", "#8a6bff", "#ffd1f0"] },
  { id: 5, name: "Rain", hint: "Rock sign", pal: ["#c9efff", "#5aa9ff", "#ffffff"] },
  { id: 6, name: "Heart", hint: "Thumbs up", pal: ["#ff3d6b", "#ff9eb5", "#ffd6e0"] },
  { id: 7, name: "Vortex", hint: "Pinch", pal: ["#7dffea", "#2f9bff", "#c4fff7"] },
  { id: 8, name: "Wave", hint: "Four fingers", pal: ["#ffd36b", "#ff7a4c", "#fff1c9"] },
  { id: 9, name: "Comet", hint: "Point", pal: ["#ffffff", "#8fdcff", "#ffcf8a"] },
  { id: 10, name: "Lotus", hint: "L shape", pal: ["#ff8fe0", "#ffd36b", "#b99cff"] },
  { id: 11, name: "Infinity", hint: "OK sign", pal: ["#5cffc8", "#ffe36b", "#6bbcff"] },
];

const VERT = `
attribute vec4 aRand;
uniform float uTime;
uniform float uFrom;
uniform float uTo;
uniform float uMorph;
uniform vec3 uCenter;
uniform vec3 uDir;
uniform float uScale;
uniform float uEnergy;
uniform float uSpan;
uniform float uLen;
varying float vTip;
varying float vMix;
varying float vFade;

const float PI = 3.14159265;

vec3 shape(float id, vec4 r, float t) {
  float u = r.x, v = r.y, w = r.z, k = r.w;
  if (id < 0.5) {
    float rad = 0.6 + pow(u, 0.7) * 2.1;
    float a = v * 6.2832 + t * (0.35 + 0.9 / rad);
    return vec3(cos(a) * rad, sin(a) * rad * 0.58 + sin(a * 3.0 + k * 6.0) * 0.08, sin(a) * rad * 0.45);
  }
  if (id < 1.5) {
    float y = 1.0 - u * 2.0;
    float rr = sqrt(1.0 - y * y);
    float th = v * 6.2832 * 40.0 + t * 0.6;
    float br = 1.25 + sin(t * 2.4) * 0.04 + (k - 0.5) * 0.08;
    return vec3(cos(th) * rr, y, sin(th) * rr) * br;
  }
  if (id < 2.5) {
    float arm = floor(w * 3.0);
    float rad = pow(u, 0.55) * 3.0 + 0.15;
    float a = arm * 2.0944 + rad * 1.9 - t * 0.35 + (v - 0.5) * 0.55 / (rad + 0.3);
    return vec3(cos(a) * rad, (k - 0.5) * 0.18 * (3.2 - rad), sin(a) * rad * 0.55) + vec3(0.0, sin(a) * rad * 0.22, 0.0);
  }
  if (id < 3.5) {
    float x = (u * 2.0 - 1.0) * 3.4;
    float strand = step(0.5, w);
    float a = x * 1.9 + t * 1.6 + strand * PI;
    vec3 p = vec3(x, sin(a) * 0.75, cos(a) * 0.75);
    if (k < 0.18) {
      float m = fract(x * 1.2);
      float rung = floor(x * 1.2) / 1.2;
      float ar = rung * 1.9 + t * 1.6;
      p = vec3(rung, mix(sin(ar), sin(ar + PI), v) * 0.75, mix(cos(ar), cos(ar + PI), v) * 0.75);
    }
    return p;
  }
  if (id < 4.5) {
    float a = u * 6.2832 + t * 0.4;
    float b = v * 6.2832 + t * 1.2;
    float R = 1.8, rr = 0.5 + (k - 0.5) * 0.12;
    vec3 p = vec3((R + rr * cos(b)) * cos(a), rr * sin(b), (R + rr * cos(b)) * sin(a));
    float tilt = 0.9;
    return vec3(p.x, p.y * cos(tilt) - p.z * sin(tilt), p.y * sin(tilt) + p.z * cos(tilt));
  }
  if (id < 5.5) {
    float h = 7.0;
    float y = 3.5 - mod(t * (3.0 + k * 2.5) + v * h, h);
    return vec3((u * 2.0 - 1.0) * uSpan, y, (w - 0.5) * 2.0);
  }
  if (id < 6.5) {
    float a = u * 6.2832;
    float s = sin(a);
    vec3 p = vec3(16.0 * s * s * s, 13.0 * cos(a) - 5.0 * cos(2.0 * a) - 2.0 * cos(3.0 * a) - cos(4.0 * a), 0.0) / 9.0;
    float fill = pow(v, 0.5);
    float beat = 1.0 + 0.08 * pow(max(sin(t * 5.0), 0.0), 8.0);
    return vec3(p.xy * mix(0.25, 1.0, fill) * beat, (w - 0.5) * 0.5 * (1.0 - fill));
  }
  if (id < 7.5) {
    float y = (u * 2.0 - 1.0) * 2.3;
    float rad = 0.15 + (y + 2.3) * 0.42 + (k - 0.5) * 0.1;
    float a = v * 6.2832 + t * (3.2 - y * 0.4) + y * 1.4;
    return vec3(cos(a) * rad, y, sin(a) * rad);
  }
  if (id < 8.5) {
    float x = (u * 2.0 - 1.0) * 3.6;
    float z = (v * 2.0 - 1.0) * 1.3;
    return vec3(x, sin(x * 1.4 + t * 2.0) * 0.65 * cos(z * 1.6) + sin(z * 3.0 + t) * 0.15, z);
  }
  if (id < 9.5) {
    float along = pow(u, 1.6) * 4.2;
    vec3 d = normalize(uDir + vec3(0.0001));
    vec3 side = normalize(cross(d, vec3(0.0, 0.0, 1.0)) + vec3(0.0001));
    vec3 up2 = cross(d, side);
    float a = v * 6.2832 + t * 4.0 - along * 2.0;
    float rad = (0.05 + along * 0.18) * (0.6 + k * 0.8);
    return -d * along + (side * cos(a) + up2 * sin(a)) * rad;
  }
  if (id < 10.5) {
    float a = u * 6.2832 + t * 0.25;
    float petals = 5.0;
    float rad = (0.4 + abs(cos(petals * 0.5 * a)) * 2.0) * pow(v, 0.4);
    float lift = (1.0 - pow(v, 0.4)) * 0.9 + abs(cos(petals * 0.5 * a)) * pow(v, 2.0) * 0.6;
    vec3 p = vec3(cos(a) * rad, lift - 0.4, sin(a) * rad);
    float tilt = 0.55;
    return vec3(p.x, p.y * cos(tilt) - p.z * sin(tilt), p.y * sin(tilt) + p.z * cos(tilt));
  }
  float a = u * 6.2832 + t * 0.9;
  float d = 1.0 + sin(a) * sin(a);
  vec3 p = vec3(cos(a) / d * 3.0, sin(a) * cos(a) / d * 2.2, 0.0);
  float b = v * 6.2832 + t * 2.0;
  return p + vec3(0.0, cos(b), sin(b)) * (0.18 + k * 0.12);
}

vec3 place(float t) {
  float m = clamp(uMorph * 1.6 - aRand.w * 0.6, 0.0, 1.0);
  m = m * m * (3.0 - 2.0 * m);
  vec3 a = shape(uFrom, aRand, t);
  vec3 b = shape(uTo, aRand, t);
  vec3 p = mix(a, b, m);
  vec3 swirl = vec3(sin(aRand.x * 40.0 + t), cos(aRand.y * 40.0 + t * 1.3), sin(aRand.z * 40.0 - t)) ;
  p += swirl * (sin(m * PI) * 0.9 + uEnergy * 0.12 + 0.012);
  return p * uScale + uCenter;
}

void main() {
  float t = uTime;
  vec3 p1 = place(t);
  vec3 p0 = place(t - 0.035);
  vec3 dir = p1 - p0;
  float sp = length(dir);
  dir = sp > 0.00001 ? dir / sp : vec3(0.0, 1.0, 0.0);
  vec3 side = normalize(cross(dir, abs(dir.z) < 0.95 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0)));
  vec3 nrm = cross(side, dir);
  float len = uLen * (0.75 + min(sp * 9.0, 1.6)) * (0.7 + aRand.z * 0.6);
  vec3 local = position;
  vec3 world = p1 + side * local.x + dir * local.y * len + nrm * local.z;
  vTip = local.y + 0.5;
  vMix = aRand.x;
  vec4 mv = modelViewMatrix * vec4(world, 1.0);
  vFade = smoothstep(-16.0, -4.0, mv.z);
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = `
uniform vec3 uA0;
uniform vec3 uA1;
uniform vec3 uA2;
uniform vec3 uB0;
uniform vec3 uB1;
uniform vec3 uB2;
uniform float uMorph;
uniform float uLight;
varying float vTip;
varying float vMix;
varying float vFade;
void main() {
  vec3 a = mix(mix(uA0, uA1, smoothstep(0.0, 0.6, vMix)), uA2, smoothstep(0.75, 1.0, vMix));
  vec3 b = mix(mix(uB0, uB1, smoothstep(0.0, 0.6, vMix)), uB2, smoothstep(0.75, 1.0, vMix));
  vec3 c = mix(a, b, clamp(uMorph, 0.0, 1.0));
  float core = smoothstep(0.55, 1.0, vTip);
  vec3 col = mix(c * 0.55, c, smoothstep(0.0, 0.5, vTip)) + vec3(1.0) * core * 0.55;
  float alpha = (0.35 + 0.65 * smoothstep(0.0, 0.7, vTip)) * vFade;
  if (uLight > 0.5) { col = c * 0.62; alpha *= 0.85; }
  gl_FragColor = vec4(col, alpha);
}`;

export async function startSwarm(state) {
  const section = document.querySelector(".contact");
  const canvas = section.querySelector(".swarm");
  let THREE;
  let renderer;
  try {
    THREE = await import("three");
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return;
  }
  const small = innerWidth < 760;
  const N = small ? 4000 : 12000;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  camera.position.z = 9;

  const base = new THREE.ConeGeometry(0.012, 1, 3, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index;
  geo.attributes.position = base.attributes.position;
  const rand = new Float32Array(N * 4);
  for (let i = 0; i < N * 4; i++) rand[i] = Math.random();
  geo.setAttribute("aRand", new THREE.InstancedBufferAttribute(rand, 4));
  geo.instanceCount = N;

  const col = (h) => new THREE.Color(h);
  const uniforms = {
    uTime: { value: 0 },
    uFrom: { value: 0 },
    uTo: { value: 0 },
    uMorph: { value: 1 },
    uCenter: { value: new THREE.Vector3() },
    uDir: { value: new THREE.Vector3(1, 0, 0) },
    uScale: { value: 1 },
    uEnergy: { value: 0 },
    uSpan: { value: 6 },
    uLen: { value: 0.1 },
    uLight: { value: 0 },
    uA0: { value: col("#7cf6ff") }, uA1: { value: col("#6b7bff") }, uA2: { value: col("#ff6bd6") },
    uB0: { value: col("#7cf6ff") }, uB1: { value: col("#6b7bff") }, uB2: { value: col("#ff6bd6") },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  scene.add(mesh);

  const view = { hw: 1, hh: 1 };
  const layout = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    view.hh = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    view.hw = view.hh * camera.aspect;
    uniforms.uSpan.value = view.hw;
  };
  layout();
  addEventListener("resize", layout);

  const ctl = { x: 0, y: 0, tx: 0, ty: 0, vx: 1, vy: 0, scale: 1, tscale: 1, current: 0, base: 0, source: "mouse", hold: false };
  const home = () => { ctl.tx = small ? 0 : view.hw * 0.34; ctl.ty = small ? -view.hh * 0.3 : view.hh * 0.08; };
  home();
  ctl.x = ctl.tx; ctl.y = ctl.ty;

  const chips = [...section.querySelectorAll("[data-form]")];
  chips.forEach((c) => { const sp = c.querySelector("span"); if (sp) sp.outerHTML = signSVG(+c.dataset.form, 30); c.title = FORMATIONS[+c.dataset.form].hint; });
  const label0 = section.querySelector(".swarm__now");
  if (label0) label0.innerHTML = `${signSVG(0, 34)}<span>Orbit</span>`;
  const label = section.querySelector(".swarm__now");
  const setForm = (id) => {
    if (id === ctl.current) return;
    const from = FORMATIONS[ctl.current];
    const to = FORMATIONS[id];
    const m = uniforms.uMorph.value;
    uniforms.uFrom.value = m < 0.5 ? uniforms.uFrom.value : uniforms.uTo.value;
    uniforms.uTo.value = id;
    uniforms.uMorph.value = 0;
    uniforms.uA0.value.copy(uniforms.uB0.value); uniforms.uA1.value.copy(uniforms.uB1.value); uniforms.uA2.value.copy(uniforms.uB2.value);
    uniforms.uB0.value.set(to.pal[0]); uniforms.uB1.value.set(to.pal[1]); uniforms.uB2.value.set(to.pal[2]);
    ctl.current = id;
    chips.forEach((c) => c.setAttribute("aria-pressed", String(+c.dataset.form === id)));
    if (label) label.innerHTML = `${signSVG(id, 34)}<span>${to.name}</span>`;
    void from;
  };
  chips.forEach((c) => c.addEventListener("click", () => { ctl.base = +c.dataset.form; setForm(ctl.base); }));
  addEventListener("keydown", (e) => {
    if (!visible || e.target.closest("input, textarea, select")) return;
    const map = { "1": 0, "2": 1, "3": 2, "4": 3, "5": 4, "6": 5, "7": 6, "8": 7, "9": 8, "0": 9, "-": 10, "=": 11 };
    if (e.key in map) { ctl.base = map[e.key]; setForm(ctl.base); }
  });

  const toWorld = (nx, ny) => ({ x: (nx * 2 - 1) * view.hw, y: -(ny * 2 - 1) * view.hh });
  section.addEventListener("pointermove", (e) => {
    if (ctl.source !== "mouse") return;
    const r = canvas.getBoundingClientRect();
    const p = toWorld((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    ctl.tx = p.x; ctl.ty = p.y;
  });
  section.addEventListener("pointerleave", () => { if (ctl.source === "mouse") home(); });
  section.addEventListener("pointerdown", (e) => {
    if (e.target.closest("a, button") || ctl.source !== "mouse") return;
    ctl.hold = true;
    setForm(1);
  });
  addEventListener("pointerup", () => { if (ctl.hold) { ctl.hold = false; setForm(ctl.base); } });
  section.addEventListener("dblclick", (e) => { if (!e.target.closest("a, button")) { ctl.base = 5; setForm(5); } });

  let visible = false;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(section);

  const handBtn = section.querySelector(".swarm__hand");
  const status = section.querySelector(".swarm__status");
  const video = section.querySelector(".swarm__cam");
  const preview = section.querySelector(".swarm__preview");
  const pctx = preview.getContext("2d");
  let landmarker = null;
  let stream = null;
  let lastDetect = 0;
  let pending = { id: -1, n: 0 };

  const stopHand = () => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    ctl.source = "mouse";
    ctl.tscale = 1;
    section.classList.remove("is-hand");
    handBtn.setAttribute("aria-pressed", "false");
    handBtn.textContent = "Steer with your hand";
    status.textContent = "";
    home();
  };
  handBtn.addEventListener("click", async () => {
    if (ctl.source === "hand") return stopHand();
    status.textContent = "Starting the camera…";
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360, facingMode: "user" } });
      video.srcObject = stream;
      await video.play();
      if (!landmarker) {
        status.textContent = "Loading hand tracking…";
        const vision = await import(`${VISION}/vision_bundle.mjs`);
        const files = await vision.FilesetResolver.forVisionTasks(`${VISION}/wasm`);
        landmarker = await vision.HandLandmarker.createFromOptions(files, {
          baseOptions: { modelAssetPath: HAND_MODEL, delegate: "GPU" },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.6,
          minTrackingConfidence: 0.5,
        });
      }
      ctl.source = "hand";
      section.classList.add("is-hand");
      handBtn.setAttribute("aria-pressed", "true");
      handBtn.textContent = "Stop hand control";
      status.textContent = "Show a sign from the list. Move your hand to steer, closer to grow.";
    } catch {
      stopHand();
      status.textContent = "The camera isn’t available, so use the buttons or your pointer.";
    }
  });

  const classify = (lm) => {
    const d = (a, b) => Math.hypot(lm[a].x - lm[b].x, lm[a].y - lm[b].y);
    const vec = (a, b) => [lm[b].x - lm[a].x, lm[b].y - lm[a].y, (lm[b].z || 0) - (lm[a].z || 0)];
    const cos = (u, v) => (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / ((Math.hypot(...u) * Math.hypot(...v)) || 1);
    const palm = d(0, 9) || 0.001;
    const straight = (m) => cos(vec(m, m + 1), vec(m + 2, m + 3)) > 0.5 && d(m + 3, 0) > d(m + 1, 0) * 1.08 && d(m + 3, m) > palm * 0.55;
    const index = straight(5), middle = straight(9), ring = straight(13), pinky = straight(17);
    const thumb = cos(vec(2, 3), vec(3, 4)) > 0.6 && d(4, 5) > palm * 0.5 && d(4, 13) > palm * 0.8;
    const pinch = d(4, 8) < palm * 0.32 && d(8, 0) > palm * 1.1;
    const up = index + middle + ring + pinky;
    if (pinch && middle && ring && pinky) return 11;
    if (pinch && !middle && !ring && !pinky) return 7;
    if (up === 4) return thumb ? 2 : 8;
    if (index && middle && ring && !pinky) return 4;
    if (index && middle && !ring && !pinky) return 3;
    if (index && pinky && !middle && !ring) return 5;
    if (pinky && !index && !middle && !ring) return thumb ? 0 : -1;
    if (index && !middle && !ring && !pinky) return thumb ? 10 : 9;
    const highest = Math.min(...[6, 8, 10, 12, 14, 16, 18, 20].map((i) => lm[i].y));
    if (up === 0) return cos(vec(2, 3), vec(3, 4)) > 0.5 && lm[4].y < highest - palm * 0.15 ? 6 : 1;
    return -1;
  };

  const drawPreview = (lm) => {
    const w = preview.width, h = preview.height;
    pctx.save();
    pctx.clearRect(0, 0, w, h);
    pctx.translate(w, 0);
    pctx.scale(-1, 1);
    pctx.globalAlpha = 0.55;
    pctx.drawImage(video, 0, 0, w, h);
    pctx.globalAlpha = 1;
    if (lm) {
      const bones = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]];
      pctx.strokeStyle = "rgba(160,240,255,0.9)";
      pctx.lineWidth = 2;
      pctx.beginPath();
      for (const [a, b] of bones) { pctx.moveTo(lm[a].x * w, lm[a].y * h); pctx.lineTo(lm[b].x * w, lm[b].y * h); }
      pctx.stroke();
      pctx.fillStyle = "#fff";
      for (const p of lm) { pctx.beginPath(); pctx.arc(p.x * w, p.y * h, 2.4, 0, 6.3); pctx.fill(); }
    }
    pctx.restore();
  };

  const readHand = (now) => {
    if (ctl.source !== "hand" || !landmarker || video.readyState < 2 || now - lastDetect < 33) return;
    lastDetect = now;
    const res = landmarker.detectForVideo(video, now);
    const lm = res.landmarks && res.landmarks[0];
    drawPreview(lm);
    if (!lm) return;
    const c = lm[9];
    const p = toWorld(1 - c.x, c.y);
    const prevx = ctl.tx, prevy = ctl.ty;
    ctl.tx = p.x * 1.25;
    ctl.ty = p.y * 1.2;
    const vx = ctl.tx - prevx, vy = ctl.ty - prevy;
    if (Math.hypot(vx, vy) > 0.02) { ctl.vx = ctl.vx * 0.7 + vx * 0.3; ctl.vy = ctl.vy * 0.7 + vy * 0.3; }
    const size = Math.hypot(lm[0].x - lm[9].x, lm[0].y - lm[9].y);
    ctl.tscale = Math.min(1.6, Math.max(0.6, size * 5.5));
    const id = classify(lm);
    if (id < 0) return;
    if (id === pending.id) pending.n++;
    else pending = { id, n: 1 };
    if (pending.n >= 4) setForm(id);
  };

  addEventListener("pointermove", (e) => {
    if (ctl.source !== "mouse") return;
    ctl.vx = ctl.vx * 0.85 + e.movementX * 0.15;
    ctl.vy = ctl.vy * 0.85 - e.movementY * 0.15;
  }, { passive: true });

  let paintedLight = -1;
  let last = performance.now();
  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!visible) return;
    const light = document.documentElement.dataset.theme === "light" ? 1 : 0;
    if (light !== paintedLight) {
      paintedLight = light;
      material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
      material.needsUpdate = true;
      uniforms.uLight.value = light;
    }
    readHand(now);
    const live = !state.paused && !state.reduced;
    if (live) uniforms.uTime.value += dt;
    if (uniforms.uMorph.value < 1) uniforms.uMorph.value = Math.min(1, uniforms.uMorph.value + dt * 0.75);
    const k = ctl.source === "hand" ? 0.22 : 0.09;
    const ox = ctl.x, oy = ctl.y;
    ctl.x += (ctl.tx - ctl.x) * k;
    ctl.y += (ctl.ty - ctl.y) * k;
    ctl.scale += (ctl.tscale - ctl.scale) * 0.12;
    const moved = Math.hypot(ctl.x - ox, ctl.y - oy);
    uniforms.uEnergy.value += (Math.min(1, moved * 6) - uniforms.uEnergy.value) * 0.1;
    uniforms.uCenter.value.set(ctl.x, ctl.y, 0);
    uniforms.uScale.value = ctl.scale * (small ? 0.6 : 0.78);
    const dl = Math.hypot(ctl.vx, ctl.vy);
    if (dl > 0.0001) uniforms.uDir.value.set(ctl.vx / dl, ctl.vy / dl, 0);
    renderer.render(scene, camera);
  };
  requestAnimationFrame(frame);
}
