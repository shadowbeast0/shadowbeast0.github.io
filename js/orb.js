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

async function drawName(hero, ctx, w, h, dpr, ink) {
  try { await document.fonts.load('800 100px "Archivo"'); } catch {}
  const words = [...hero.querySelectorAll(".hero__name .word")];
  const box = hero.querySelector(".hero__pin").getBoundingClientRect();
  const fs = parseFloat(getComputedStyle(hero.querySelector(".hero__name")).fontSize);
  const stretch = getComputedStyle(hero.querySelector(".hero__name")).fontStretch;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.font = `800 ${fs}px "Archivo"`;
  if ("fontStretch" in ctx) ctx.fontStretch = parseFloat(stretch) >= 120 ? "expanded" : "semi-expanded";
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${-0.045 * fs}px`;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = ink;
  const m = ctx.measureText("ARJEESH");
  const asc = m.fontBoundingBoxAscent || fs * 0.9;
  const desc = m.fontBoundingBoxDescent || fs * 0.25;
  const lines = [];
  for (const wEl of words) {
    const r = wEl.getBoundingClientRect();
    const text = (wEl.getAttribute("aria-label") || wEl.textContent).toUpperCase();
    const half = (r.height - (asc + desc)) / 2;
    const base = r.top - box.top + half + asc;
    const right = wEl.closest(".line--right");
    ctx.textAlign = right ? "right" : "left";
    ctx.fillText(text, right ? r.right - box.left : r.left - box.left, base);
    lines.push({ top: (r.top - box.top) / h, bottom: (r.bottom - box.top) / h });
  }
  return lines;
}

export async function startOrb(state) {
  const hero = document.querySelector(".hero");
  const pin = hero.querySelector(".hero__pin");
  const canvas = hero.querySelector(".hero__gl");
  let THREE;
  let renderer;
  try {
    THREE = await import("three");
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !state.lite, alpha: true, powerPreference: "high-performance" });
  } catch {
    hero.classList.add("no-gl");
    return;
  }
  const small = innerWidth < 760;
  const dpr = state.lite ? 1 : Math.min(devicePixelRatio, small ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.autoClear = false;

  const textCanvas = document.createElement("canvas");
  const tctx = textCanvas.getContext("2d");
  const textTex = new THREE.CanvasTexture(textCanvas);
  textTex.colorSpace = THREE.SRGBColorSpace;
  textTex.minFilter = THREE.LinearFilter;

  const ui = {
    uTex: { value: textTex },
    uReveal: { value: state.reduced ? 1 : 0 },
    uSplit: { value: 0 },
    uL1: { value: new THREE.Vector2(0.2, 0.4) },
    uL2: { value: new THREE.Vector2(0.4, 0.6) },
  };
  const bgScene = new THREE.Scene();
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const textQuad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: ui,
      transparent: true,
      depthTest: false,
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: `
        uniform sampler2D uTex;
        uniform float uReveal;
        uniform float uSplit;
        uniform vec2 uL1;
        uniform vec2 uL2;
        varying vec2 vUv;
        void main() {
          float y = 1.0 - vUv.y;
          vec2 uv = vUv;
          float a = 0.0;
          float r1 = clamp(uReveal * 1.4, 0.0, 1.0);
          float r2 = clamp(uReveal * 1.4 - 0.25, 0.0, 1.0);
          r1 = 1.0 - pow(1.0 - r1, 3.0);
          r2 = 1.0 - pow(1.0 - r2, 3.0);
          if (y >= uL1.x && y <= uL1.y) {
            float hgt = uL1.y - uL1.x;
            vec2 s = uv + vec2(uSplit * 0.55, (1.0 - r1) * hgt);
            float yy = 1.0 - s.y;
            if (yy >= uL1.x && yy <= uL1.y) a = 1.0;
            gl_FragColor = texture2D(uTex, s) * a;
            return;
          }
          if (y >= uL2.x && y <= uL2.y) {
            float hgt = uL2.y - uL2.x;
            vec2 s = uv + vec2(-uSplit * 0.55, (1.0 - r2) * hgt);
            float yy = 1.0 - s.y;
            if (yy >= uL2.x && yy <= uL2.y) a = 1.0;
            gl_FragColor = texture2D(uTex, s) * a;
            return;
          }
          gl_FragColor = vec4(0.0);
        }`,
    })
  );
  bgScene.add(textQuad);

  const sparkN = state.lite ? 360 : small ? 700 : 1800;
  const sp = new Float32Array(sparkN * 3);
  const sd = new Float32Array(sparkN * 4);
  for (let i = 0; i < sparkN; i++) {
    sp[i * 3] = (Math.random() * 2 - 1);
    sp[i * 3 + 1] = (Math.random() * 2 - 1);
    sp[i * 3 + 2] = 0;
    sd[i * 4] = Math.random();
    sd[i * 4 + 1] = Math.random();
    sd[i * 4 + 2] = Math.random();
    sd[i * 4 + 3] = Math.random();
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  sparkGeo.setAttribute("seed", new THREE.BufferAttribute(sd, 4));
  const sparkU = { uTime: { value: 0 }, uPx: { value: dpr }, uAspect: { value: 1 }, uLight: { value: 0 }, uPointer: { value: new THREE.Vector2() } };
  const sparks = new THREE.Points(sparkGeo, new THREE.ShaderMaterial({
    uniforms: sparkU,
    transparent: true,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec4 seed;
      uniform float uTime;
      uniform float uPx;
      uniform float uAspect;
      uniform vec2 uPointer;
      varying float vA;
      varying float vW;
      void main() {
        float depth = seed.z;
        vec2 p = position.xy;
        p.x += sin(uTime * (0.05 + seed.w * 0.1) + seed.x * 30.0) * 0.08;
        p.y = mod(p.y + 1.0 + uTime * (0.01 + depth * 0.025), 2.0) - 1.0;
        p += uPointer * (0.02 + depth * 0.05);
        gl_Position = vec4(p, 0.0, 1.0);
        float tw = 0.4 + 0.6 * pow(0.5 + 0.5 * sin(uTime * (1.0 + seed.w * 3.0) + seed.x * 50.0), 3.0);
        vA = tw * (0.25 + depth * 0.75);
        vW = seed.y;
        gl_PointSize = (0.8 + pow(depth, 3.0) * 5.0) * uPx;
      }`,
    fragmentShader: `
      uniform float uLight;
      varying float vA;
      varying float vW;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * vA;
        vec3 c = mix(vec3(1.0, 0.86, 0.62), vec3(0.72, 0.9, 1.0), vW);
        if (uLight > 0.5) c = mix(vec3(0.45, 0.3, 0.1), vec3(0.15, 0.25, 0.4), vW);
        gl_FragColor = vec4(c, a);
      }`,
  }));
  bgScene.add(sparks);

  const rt = new THREE.WebGLRenderTarget(4, 4, { samples: state.lite ? 0 : 4 });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 6.2);
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: { uTex: { value: rt.texture } },
      transparent: true,
      depthWrite: false,
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }`,
      fragmentShader: `uniform sampler2D uTex; varying vec2 vUv; void main() { gl_FragColor = texture2D(uTex, vUv); }`,
    })
  );
  backdrop.frustumCulled = false;
  backdrop.renderOrder = -1;
  scene.add(backdrop);

  const MAXR = 4;
  const uniforms = {
    uTime: { value: 0 },
    uAmp: { value: 0.17 },
    uPointer: { value: new THREE.Vector2() },
    uEnergy: { value: 0 },
    uScene: { value: rt.texture },
    uRes: { value: new THREE.Vector2(1, 1) },
    uBg: { value: new THREE.Color("#050506") },
    uLight: { value: 0 },
    uRip: { value: Array.from({ length: MAXR }, () => new THREE.Vector4(0, 0, 1, -99)) },
  };
  const blob = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.42, state.lite ? 40 : small ? 64 : 128),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        uniform float uTime;
        uniform float uAmp;
        uniform float uEnergy;
        uniform vec2 uPointer;
        uniform vec4 uRip[${MAXR}];
        varying vec3 vNormal;
        varying vec3 vView;
        varying float vDisp;
        ${NOISE}
        float field(vec3 p) {
          float t = uTime * 0.16;
          vec3 q = normalize(p);
          float n = snoise(p * 0.58 + vec3(t, t * 0.7, -t));
          n += 0.14 * snoise(p * 1.25 - vec3(t * 1.4, 0.0, t));
          vec3 dir = normalize(vec3(uPointer, 0.9));
          float pull = pow(max(dot(q, dir), 0.0), 7.0);
          float rip = 0.0;
          for (int i = 0; i < ${MAXR}; i++) {
            float age = uTime - uRip[i].w;
            if (age < 0.0 || age > 3.0) continue;
            float ang = acos(clamp(dot(q, normalize(uRip[i].xyz)), -1.0, 1.0));
            float front = age * 1.6;
            rip += sin((ang - front) * 22.0) * exp(-abs(ang - front) * 6.0) * exp(-age * 1.4) * 0.09;
          }
          return n * (uAmp + uEnergy * 0.18) + pull * (0.12 + uEnergy * 0.3) + rip;
        }
        vec3 displaced(vec3 p) { return p + normalize(p) * field(p); }
        void main() {
          vec3 p = position;
          vec3 n = normalize(normal);
          vec3 tangent = normalize(cross(n, abs(n.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
          vec3 bitangent = normalize(cross(n, tangent));
          float e = 0.008;
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
        uniform sampler2D uScene;
        uniform vec2 uRes;
        uniform vec3 uBg;
        uniform float uLight;
        varying vec3 vNormal;
        varying vec3 vView;
        varying float vDisp;
        vec3 studio(vec3 r) {
          float y = r.y;
          vec3 col = mix(vec3(0.01, 0.012, 0.016), vec3(0.08, 0.085, 0.1), smoothstep(-1.0, 0.2, y));
          col += vec3(1.0) * smoothstep(0.14, 0.02, abs(y - 0.62)) * 1.6;
          col += vec3(0.92, 0.96, 1.0) * smoothstep(0.06, 0.0, abs(r.x + 0.55)) * smoothstep(-0.2, 0.6, y) * 1.2;
          col += vec3(0.6, 0.85, 1.0) * smoothstep(0.1, 0.0, abs(r.x - 0.72 + 0.08 * sin(uTime * 0.3))) * 0.9;
          col += vec3(1.0, 0.7, 0.4) * smoothstep(0.22, 0.0, abs(y + 0.55)) * 0.55;
          return col;
        }
        vec3 sampleScene(vec2 uv) {
          vec4 s = texture2D(uScene, uv);
          return mix(uBg, s.rgb / max(s.a, 0.0001), s.a);
        }
        void main() {
          vec3 n = normalize(vNormal);
          vec3 v = normalize(vView);
          float ndv = max(dot(n, v), 0.0);
          float fres = pow(1.0 - ndv, 2.6);
          vec2 suv = gl_FragCoord.xy / uRes;
          vec2 off = n.xy * (0.05 + 0.04 * (1.0 - ndv)) + (suv - 0.5) * -0.04;
          vec3 refr;
          refr.r = sampleScene(suv - off * 1.0).r;
          refr.g = sampleScene(suv - off * 1.015).g;
          refr.b = sampleScene(suv - off * 1.03).b;
          vec3 tint = mix(vec3(0.86, 0.92, 1.0), vec3(0.96, 0.97, 1.0), uLight);
          vec3 r = reflect(-v, n);
          vec3 refl = studio(r);
          vec3 film = mix(vec3(1.0, 0.9, 0.76), vec3(0.78, 0.9, 1.0), smoothstep(-0.15, 0.25, vDisp));
          refl *= mix(vec3(1.0), film, 0.45);
          vec3 col = mix(refr * tint, refl, clamp(0.12 + fres * 0.95, 0.0, 1.0));
          float spec = pow(max(dot(reflect(-normalize(vec3(-0.4, 0.7, 0.6)), n), v), 0.0), 80.0);
          col += vec3(1.0) * spec * 0.9;
          col += vec3(0.85, 0.92, 1.0) * pow(fres, 3.0) * 0.3;
          gl_FragColor = vec4(col, 1.0);
        }`,
    })
  );
  scene.add(blob);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0, energy: 0 };
  let last = { x: 0, y: 0 };
  addEventListener("pointermove", (e) => {
    const x = (e.clientX / innerWidth) * 2 - 1;
    const y = -((e.clientY / innerHeight) * 2 - 1);
    pointer.energy = Math.min(1, pointer.energy + Math.hypot(x - last.x, y - last.y) * 2.4);
    pointer.tx = x;
    pointer.ty = y;
    last = { x, y };
  }, { passive: true });
  let ripIndex = 0;
  const ray = new THREE.Raycaster();
  pin.addEventListener("pointerdown", (e) => {
    if (e.target.closest("a, button")) return;
    const r = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    const hit = ray.intersectObject(blob)[0];
    const dir = hit ? blob.worldToLocal(hit.point.clone()).normalize() : new THREE.Vector3(0, 0, 1);
    uniforms.uRip.value[ripIndex % MAXR].set(dir.x, dir.y, dir.z, uniforms.uTime.value);
    ripIndex++;
    pointer.energy = 1;
  });

  let theme = "";
  const relayout = async () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    rt.setSize(Math.round(w * dpr), Math.round(h * dpr));
    uniforms.uRes.value.set(w * dpr, h * dpr);
    camera.aspect = w / h;
    const narrow = w < 760;
    camera.position.z = narrow ? 8.4 : 6.2;
    camera.updateProjectionMatrix();
    textCanvas.width = Math.round(w * dpr);
    textCanvas.height = Math.round(h * dpr);
    theme = document.documentElement.dataset.theme;
    const light = theme === "light";
    const lines = await drawName(hero, tctx, w, h, dpr, light ? "#0d0d0f" : "#f4f3ef");
    if (lines[0]) ui.uL1.value.set(lines[0].top, lines[0].bottom);
    if (lines[1]) ui.uL2.value.set(lines[1].top, lines[1].bottom);
    textTex.needsUpdate = true;
    uniforms.uBg.value.set(light ? "#f2efe8" : "#050506");
    uniforms.uLight.value = light ? 1 : 0;
    sparkU.uLight.value = light ? 1 : 0;
    sparks.material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
    sparks.material.needsUpdate = true;
  };
  await relayout();
  hero.classList.add("gl-text");
  let rt0 = 0;
  addEventListener("resize", () => { clearTimeout(rt0); rt0 = setTimeout(relayout, 150); });

  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(hero);

  const clock = new THREE.Clock();
  let scale = state.reduced ? 1 : 0.4;
  const api = {
    reveal() {
      if (state.reduced) return;
      const start = performance.now();
      const tick = (now) => {
        ui.uReveal.value = Math.min(1, (now - start) / 1500);
        if (ui.uReveal.value < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
  };
  const loop = () => {
    requestAnimationFrame(loop);
    if (!visible) return;
    if (document.documentElement.dataset.theme !== theme) relayout();
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!state.reduced && !state.paused) uniforms.uTime.value += dt;
    sparkU.uTime.value = uniforms.uTime.value;
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    pointer.energy *= 0.95;
    uniforms.uEnergy.value += (pointer.energy - uniforms.uEnergy.value) * 0.1;
    uniforms.uPointer.value.set(pointer.x, pointer.y);
    sparkU.uPointer.value.set(pointer.x, pointer.y);

    const hr = hero.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -hr.top / Math.max(1, hr.height - innerHeight)));
    const e = p * p * (3 - 2 * p);
    ui.uSplit.value = e;
    const narrow = canvas.clientWidth < 760;
    scale += (1 - scale) * 0.035;
    blob.scale.setScalar(scale * (1 + e * (narrow ? 1.1 : 1.9)));
    blob.position.set((narrow ? 0.15 : 0.35) * (1 - e), (narrow ? 0.55 : 0.05) * (1 - e), e * 1.2);
    blob.rotation.y += ((pointer.x * 0.6 + uniforms.uTime.value * 0.08 + e * 2.0) - blob.rotation.y) * 0.05;
    blob.rotation.x += ((-pointer.y * 0.4) - blob.rotation.x) * 0.05;
    canvas.style.opacity = String(1 - Math.max(0, (p - 0.82) / 0.18));

    renderer.setRenderTarget(rt);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(bgScene, ortho);
    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(scene, camera);
  };
  loop();
  return api;
}
