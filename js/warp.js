export async function startWarp(state) {
  const section = document.querySelector(".work");
  const canvas = section.querySelector(".work__warp");
  let THREE;
  let renderer;
  try {
    THREE = await import("three");
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
  } catch {
    return;
  }
  const small = innerWidth < 760;
  const N = small ? 2500 : 7000;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 200);

  const pos = new Float32Array(N * 3);
  const seed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 2 + Math.pow(Math.random(), 0.6) * 26;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = Math.sin(a) * r * 0.7;
    pos[i * 3 + 2] = -Math.random() * 120;
    seed[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
  const uniforms = {
    uTravel: { value: 0 },
    uSpeed: { value: 0 },
    uTint: { value: new THREE.Color("#7c5cff") },
    uTint2: { value: new THREE.Color("#9fe3ff") },
    uPx: { value: renderer.getPixelRatio() },
    uLight: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float seed;
      uniform float uTravel;
      uniform float uSpeed;
      uniform float uPx;
      varying float vA;
      varying float vS;
      void main() {
        vec3 p = position;
        p.z = mod(p.z + uTravel, 120.0) - 115.0;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float near = smoothstep(-115.0, -20.0, p.z);
        vA = near * (0.25 + seed * 0.75) * smoothstep(0.0, -3.0, p.z);
        vS = seed;
        gl_PointSize = (1.0 + seed * 2.2) * uPx * (30.0 / -mv.z) * (1.0 + uSpeed * 2.5);
      }`,
    fragmentShader: `
      uniform vec3 uTint;
      uniform vec3 uTint2;
      uniform float uLight;
      varying float vA;
      varying float vS;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * vA;
        vec3 c = mix(uTint, uTint2, vS) + vec3(0.4) * smoothstep(0.2, 0.0, d);
        if (uLight > 0.5) c *= 0.55;
        gl_FragColor = vec4(c, a);
      }`,
  });
  scene.add(new THREE.Points(geo, mat));

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  addEventListener("resize", resize);

  const cases = [...section.querySelectorAll(".case")];
  let visible = false;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(section);
  let lastY = scrollY;
  let travel = 0;
  let speed = 0;
  let last = performance.now();
  const tint = new THREE.Color();
  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const dy = scrollY - lastY;
    lastY = scrollY;
    if (!visible) return;
    speed += (Math.min(1.5, Math.abs(dy) / 40) - speed) * 0.08;
    if (!state.paused && !state.reduced) travel += dt * (4 + speed * 60);
    uniforms.uTravel.value = travel;
    uniforms.uSpeed.value = speed;
    const front = cases.find((c) => c.classList.contains("is-front")) || cases[0];
    const t = getComputedStyle(front).getPropertyValue("--tint").trim().split(/\s+/).map(Number);
    if (t.length === 3) {
      tint.setRGB(t[0] / 255, t[1] / 255, t[2] / 255);
      uniforms.uTint.value.lerp(tint, 0.05);
    }
    uniforms.uLight.value = document.documentElement.dataset.theme === "light" ? 1 : 0;
    mat.blending = uniforms.uLight.value ? THREE.NormalBlending : THREE.AdditiveBlending;
    camera.rotation.z += ((speed * 0.15) - camera.rotation.z) * 0.05;
    renderer.render(scene, camera);
  };
  requestAnimationFrame(frame);
}
