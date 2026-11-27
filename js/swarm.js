const VISION = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const HAND_MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export async function startSwarm(state) {
  const section = document.querySelector(".contact");
  const canvas = section.querySelector(".swarm");
  let THREE;
  let renderer;
  try {
    THREE = await import("three");
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    return;
  }
  const small = window.innerWidth < 760;
  const N = small ? 1100 : 2600;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
  camera.position.z = 8;

  const blade = new THREE.ConeGeometry(0.014, 0.22, 4, 1);
  blade.translate(0, 0.04, 0);
  const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending });
  const mesh = new THREE.InstancedMesh(blade, material, N);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);

  const P = new Float32Array(N * 3);
  const V = new Float32Array(N * 3);
  const ring = new Float32Array(N);
  const phase = new Float32Array(N);
  const speed = new Float32Array(N);
  const sph = new Float32Array(N * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const col = new THREE.Color();
  const darkCols = [new THREE.Color("#ffd24a"), new THREE.Color("#b8ff5c"), new THREE.Color("#4dffa1"), new THREE.Color("#ffb347")];
  const lightCols = [new THREE.Color("#a35d00"), new THREE.Color("#2f7d12"), new THREE.Color("#0b7a55"), new THREE.Color("#8a3b00")];
  const paint = () => {
    const light = document.documentElement.dataset.theme === "light";
    const set = light ? lightCols : darkCols;
    material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
    material.opacity = light ? 0.75 : 0.7;
    material.needsUpdate = true;
    for (let i = 0; i < N; i++) {
      col.copy(set[i % set.length]).lerp(set[(i + 1) % set.length], Math.random() * 0.6);
      mesh.setColorAt(i, col);
    }
    mesh.instanceColor.needsUpdate = true;
  };
  for (let i = 0; i < N; i++) {
    P[i * 3] = (Math.random() - 0.5) * 14;
    P[i * 3 + 1] = (Math.random() - 0.5) * 8;
    P[i * 3 + 2] = (Math.random() - 0.5) * 2;
    ring[i] = 0.45 + Math.pow(Math.random(), 0.8) * 1.9;
    phase[i] = Math.random() * Math.PI * 2;
    speed[i] = 0.5 + Math.random() * 0.9;
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    sph[i * 3] = Math.cos(th) * r;
    sph[i * 3 + 1] = y;
    sph[i * 3 + 2] = Math.sin(th) * r;
  }
  paint();
  let paintedTheme = document.documentElement.dataset.theme;

  const view = { hw: 1, hh: 1 };
  const layout = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    view.hh = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    view.hw = view.hh * camera.aspect;
  };
  layout();
  window.addEventListener("resize", layout);

  const ctl = { x: 3, y: 0, tx: 3, ty: 0, mode: "swirl", hold: false, rainUntil: 0, energy: 0, source: "mouse" };
  const toWorld = (nx, ny) => ({ x: (nx * 2 - 1) * view.hw, y: -(ny * 2 - 1) * view.hh });
  const home = () => { ctl.tx = view.hw * (small ? 0.1 : 0.42); ctl.ty = small ? -view.hh * 0.45 : 0; };
  home();
  ctl.x = ctl.tx;
  ctl.y = ctl.ty;
  section.addEventListener("pointerleave", () => { if (ctl.source === "mouse") home(); });
  section.addEventListener("pointermove", (e) => {
    if (ctl.source !== "mouse") return;
    const r = canvas.getBoundingClientRect();
    const p = toWorld((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    ctl.energy = Math.min(1.5, ctl.energy + Math.hypot(p.x - ctl.tx, p.y - ctl.ty) * 0.15);
    ctl.tx = p.x;
    ctl.ty = p.y;
  });
  section.addEventListener("pointerdown", (e) => { if (e.target.closest("a, button")) return; ctl.hold = true; });
  window.addEventListener("pointerup", () => { ctl.hold = false; });
  section.addEventListener("dblclick", (e) => { if (e.target.closest("a, button")) return; ctl.rainUntil = performance.now() + 3500; });

  let visible = false;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(section);

  const handBtn = section.querySelector(".swarm__hand");
  const status = section.querySelector(".swarm__status");
  const video = section.querySelector(".swarm__cam");
  let landmarker = null;
  let stream = null;
  let lastVideoTime = -1;
  const stopHand = () => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    ctl.source = "mouse";
    handBtn.setAttribute("aria-pressed", "false");
    handBtn.textContent = "Steer with your hand";
    status.textContent = "";
  };
  handBtn.addEventListener("click", async () => {
    if (ctl.source === "hand") return stopHand();
    status.textContent = "Starting the camera…";
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" } });
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
        });
      }
      ctl.source = "hand";
      handBtn.setAttribute("aria-pressed", "true");
      handBtn.textContent = "Stop hand control";
      status.textContent = "Point to steer. Make a fist for a sphere. Show the rock sign to make it rain. Your camera stays on this device.";
    } catch {
      stopHand();
      status.textContent = "The camera isn’t available, so the swarm follows your pointer.";
    }
  });

  const readHand = (now) => {
    if (ctl.source !== "hand" || !landmarker || video.readyState < 2 || video.currentTime === lastVideoTime) return;
    lastVideoTime = video.currentTime;
    const res = landmarker.detectForVideo(video, now);
    const lm = res.landmarks && res.landmarks[0];
    if (!lm) { ctl.hold = false; return; }
    const tip = lm[8];
    const p = toWorld(1 - tip.x, tip.y);
    ctl.tx = p.x;
    ctl.ty = p.y;
    const d = (a, b) => Math.hypot(lm[a].x - lm[b].x, lm[a].y - lm[b].y);
    const palm = d(0, 9) || 0.001;
    const ext = (t, m) => d(t, 0) > d(m, 0) * 1.1;
    const index = ext(8, 6);
    const middle = ext(12, 10);
    const ringF = ext(16, 14);
    const pinky = ext(20, 18);
    const curl = (d(8, 0) + d(12, 0) + d(16, 0) + d(20, 0)) / (4 * palm);
    ctl.hold = curl < 1.15;
    if (index && pinky && !middle && !ringF) ctl.rainUntil = now + 1200;
  };

  const dummy = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0);
  const dir = new THREE.Vector3();
  let t = 0;
  let last = performance.now();
  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (!visible) return;
    if (document.documentElement.dataset.theme !== paintedTheme) { paintedTheme = document.documentElement.dataset.theme; paint(); }
    readHand(now);
    const live = !state.paused && !state.reduced;
    if (live) t += dt;
    ctl.x += (ctl.tx - ctl.x) * 0.08;
    ctl.y += (ctl.ty - ctl.y) * 0.08;
    ctl.energy *= 0.94;
    const raining = now < ctl.rainUntil;
    const sphereR = 1.15 + Math.sin(t * 2) * 0.05;
    const step = live ? dt : 0;
    for (let i = 0; i < N; i++) {
      const ix = i * 3;
      let tx, ty, tz;
      if (raining) {
        tx = P[ix];
        ty = P[ix + 1] - 6;
        tz = P[ix + 2];
      } else if (ctl.hold) {
        const a = t * 0.8;
        const sx = sph[ix], sy = sph[ix + 1], sz = sph[ix + 2];
        tx = ctl.x + (sx * Math.cos(a) - sz * Math.sin(a)) * sphereR;
        ty = ctl.y + sy * sphereR;
        tz = (sx * Math.sin(a) + sz * Math.cos(a)) * sphereR;
      } else {
        const th = phase[i] + t * speed[i] * (1.2 / ring[i]);
        const r = ring[i] * (1 + ctl.energy * 0.35);
        tx = ctl.x + Math.cos(th) * r;
        ty = ctl.y + Math.sin(th) * r * 0.62 + Math.sin(th * 2 + phase[i]) * 0.12;
        tz = Math.sin(th) * r * 0.5;
      }
      const k = raining ? 2.5 : ctl.hold ? 9 : 4.5;
      V[ix] += (tx - P[ix]) * k * step;
      V[ix + 1] += (ty - P[ix + 1]) * k * step - (raining ? 9 * step : 0);
      V[ix + 2] += (tz - P[ix + 2]) * k * step;
      const damp = raining ? 0.985 : 0.92;
      V[ix] *= damp;
      V[ix + 1] *= damp;
      V[ix + 2] *= damp;
      P[ix] += V[ix] * step;
      P[ix + 1] += V[ix + 1] * step;
      P[ix + 2] += V[ix + 2] * step;
      if (raining && P[ix + 1] < -view.hh - 1) {
        P[ix + 1] = view.hh + 1 + Math.random() * 2;
        P[ix] = (Math.random() * 2 - 1) * view.hw;
        V[ix + 1] = -2;
      }
      const vx = V[ix], vy = V[ix + 1], vz = V[ix + 2];
      const sp = Math.hypot(vx, vy, vz);
      if (sp > 0.0001) {
        dir.set(vx / sp, vy / sp, vz / sp);
        dummy.quaternion.setFromUnitVectors(up, dir);
      }
      dummy.position.set(P[ix], P[ix + 1], P[ix + 2]);
      const len = 0.6 + Math.min(1.6, sp * 0.35);
      dummy.scale.set(1, len, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
  };
  requestAnimationFrame(frame);
}
