const NOISE = `
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
}`;

export async function startOrb(state) {
  const hero = document.querySelector(".hero");
  const canvas = document.querySelector(".hero__gl");
  let THREE;
  let renderer;
  try {
    THREE = await import("three");
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
    uLight: { value: 0 },
  };

  const blob = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.25, small ? 48 : 96),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        uniform float uTime;
        uniform float uAmp;
        uniform float uEnergy;
        uniform vec2 uPointer;
        varying vec3 vNormal;
        varying vec3 vView;
        varying float vDisp;
        ${NOISE}
        float field(vec3 p) {
          float t = uTime * 0.18;
          float n = snoise(p * 0.72 + vec3(t, t * 0.7, -t));
          n += 0.18 * snoise(p * 1.5 - vec3(t * 1.3, 0.0, t));
          vec3 dir = normalize(vec3(uPointer, 0.9));
          float pull = pow(max(dot(normalize(p), dir), 0.0), 6.0);
          return n * (uAmp + uEnergy * 0.2) + pull * (0.14 + uEnergy * 0.3);
        }
        vec3 displaced(vec3 p) { return p + normalize(p) * field(p); }
        void main() {
          vec3 p = position;
          vec3 n = normalize(normal);
          vec3 tangent = normalize(cross(n, abs(n.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
          vec3 bitangent = normalize(cross(n, tangent));
          float e = 0.01;
          vec3 a = displaced(p);
          vec3 b = displaced(p + tangent * e);
          vec3 c = displaced(p + bitangent * e);
          vDisp = field(p);
          vNormal = normalize(normalMatrix * normalize(cross(b - a, c - a)));
          vec4 mv = modelViewMatrix * vec4(a, 1.0);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform float uTime;
        uniform float uLight;
        varying vec3 vNormal;
        varying vec3 vView;
        varying float vDisp;
        vec3 studio(vec3 r) {
          float y = r.y;
          vec3 col = mix(vec3(0.015, 0.016, 0.02), vec3(0.09, 0.095, 0.11), smoothstep(-1.0, 0.2, y));
          col += vec3(1.0) * smoothstep(0.18, 0.02, abs(y - 0.62)) * 1.4;
          col += vec3(0.9, 0.95, 1.0) * smoothstep(0.08, 0.0, abs(r.x + 0.55)) * smoothstep(-0.2, 0.6, y) * 1.1;
          col += vec3(0.62, 0.89, 1.0) * smoothstep(0.12, 0.0, abs(r.x - 0.72 + 0.1 * sin(uTime * 0.3))) * 0.9;
          col += vec3(1.0, 0.72, 0.42) * smoothstep(0.25, 0.0, abs(y + 0.55)) * 0.5;
          return col;
        }
        void main() {
          vec3 n = normalize(vNormal);
          vec3 v = normalize(vView);
          vec3 r = reflect(-v, n);
          float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
          vec3 base = studio(r);
          vec3 film = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + fres * 0.7 + vDisp * 0.9));
          vec3 col = base * mix(vec3(1.0), film * 1.25, 0.22 + fres * 0.45);
          col += fres * vec3(0.55, 0.85, 1.0) * 0.35;
          col = col / (col + vec3(0.85));
          col = pow(col, vec3(0.9));
          col = mix(col, col * 0.9 + vec3(0.04), uLight);
          gl_FragColor = vec4(col, 1.0);
        }`,
    }),
  );
  scene.add(blob);

  const dustCount = small ? 900 : 2200;
  const pos = new Float32Array(dustCount * 3);
  const seed = new Float32Array(dustCount * 4);
  for (let i = 0; i < dustCount; i++) {
    const r = 1.7 + Math.pow(Math.random(), 0.6) * 2.4;
    const th = Math.random() * Math.PI * 2;
    const ph = (Math.random() - 0.5) * 0.9;
    pos[i * 3] = Math.cos(th) * r;
    pos[i * 3 + 1] = Math.sin(ph) * r * 0.55;
    pos[i * 3 + 2] = Math.sin(th) * r;
    seed[i * 4] = r;
    seed[i * 4 + 1] = th;
    seed[i * 4 + 2] = ph;
    seed[i * 4 + 3] = Math.random();
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  dustGeo.setAttribute("seed", new THREE.BufferAttribute(seed, 4));
  const dustMat = new THREE.ShaderMaterial({
    uniforms: { uTime: uniforms.uTime, uEnergy: uniforms.uEnergy, uPointer: uniforms.uPointer, uLight: uniforms.uLight, uPx: { value: renderer.getPixelRatio() } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec4 seed;
      uniform float uTime;
      uniform float uEnergy;
      uniform vec2 uPointer;
      uniform float uPx;
      varying float vA;
      varying float vHue;
      void main() {
        float r = seed.x * (1.0 + uEnergy * 0.25 * sin(seed.w * 20.0 + uTime));
        float th = seed.y + uTime * (0.05 + 0.12 / seed.x) + uPointer.x * 0.4;
        float ph = seed.z + sin(uTime * 0.3 + seed.w * 6.28) * 0.12 + uPointer.y * 0.15;
        vec3 p = vec3(cos(th) * r, sin(ph) * r * 0.55, sin(th) * r);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float tw = 0.5 + 0.5 * sin(uTime * (1.5 + seed.w * 3.0) + seed.w * 40.0);
        vA = tw * smoothstep(-9.0, -4.0, mv.z);
        vHue = seed.w;
        gl_PointSize = (1.2 + seed.w * 2.6) * uPx * (6.0 / -mv.z);
      }`,
    fragmentShader: `
      uniform float uLight;
      varying float vA;
      varying float vHue;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        float a = smoothstep(0.5, 0.0, d) * vA;
        vec3 gold = mix(vec3(1.0, 0.78, 0.38), vec3(1.0, 0.95, 0.75), vHue);
        vec3 ink = mix(vec3(0.55, 0.36, 0.08), vec3(0.2, 0.2, 0.25), vHue);
        gl_FragColor = vec4(mix(gold, ink, uLight), a * mix(0.9, 0.7, uLight));
      }`,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0, energy: 0 };
  let last = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -((e.clientY / window.innerHeight) * 2 - 1);
    pointer.energy = Math.min(1, pointer.energy + Math.hypot(x - last.x, y - last.y) * 2.2);
    pointer.tx = x;
    pointer.ty = y;
    last = { x, y };
  }, { passive: true });

  const layout = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const narrow = w < 760;
    camera.position.z = narrow ? 8.4 : 6.2;
    blob.position.set(narrow ? 0.15 : 0.35, narrow ? 0.55 : 0.05, 0);
    dust.position.copy(blob.position);
    camera.updateProjectionMatrix();
  };
  layout();
  window.addEventListener("resize", layout);

  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(hero);

  const clock = new THREE.Clock();
  let scale = state.reduced ? 1 : 0.6;
  const loop = () => {
    requestAnimationFrame(loop);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const light = document.documentElement.dataset.theme === "light" ? 1 : 0;
    uniforms.uLight.value += (light - uniforms.uLight.value) * 0.1;
    dustMat.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
    if (!state.reduced && !state.paused) uniforms.uTime.value += dt;
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    pointer.energy *= 0.96;
    uniforms.uEnergy.value += (pointer.energy - uniforms.uEnergy.value) * 0.1;
    uniforms.uPointer.value.set(pointer.x, pointer.y);
    blob.rotation.y += ((pointer.x * 0.6 + uniforms.uTime.value * 0.08) - blob.rotation.y) * 0.05;
    blob.rotation.x += ((-pointer.y * 0.4) - blob.rotation.x) * 0.05;
    dust.rotation.x = blob.rotation.x * 0.4;
    scale += (1 - scale) * 0.04;
    const fade = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.9));
    blob.scale.setScalar(scale * (0.85 + fade * 0.15));
    canvas.style.opacity = String(0.2 + fade * 0.8);
    renderer.render(scene, camera);
  };
  loop();
}
