/* Shad, the 3D neon shadow beast.
   A rigged, animated four-legged model (glTF sample "Fox": model CC0 by PixelMannen,
   rigging/animation CC-BY 4.0 by tomkranis, glTF conversion CC-BY 4.0 by @AsoboStudio and @scurest),
   restyled as a shadow beast: dark body with a neon fresnel rim, a ring of flame spikes round the neck,
   tail flames, glowing eyes, horns in its final form, and shadow smoke. It roams the whole page. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/Fox/glTF-Binary/Fox.glb';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;

const STAGES = [
  { scale: 2.1, rimTop: '#22F0FF', rimLow: '#7DF9FF', flame: '#22F0FF', eye: '#FFF36B', neck: 10, shoulder: 0, horns: false, glow: 'rgba(34,240,255,.85)' },
  { scale: 2.5, rimTop: '#FF2E88', rimLow: '#22F0FF', flame: '#FF2E88', eye: '#FFD60A', neck: 16, shoulder: 8, horns: false, glow: 'rgba(255,46,136,.85)' },
  { scale: 2.9, rimTop: '#FF2E88', rimLow: '#8B5CF6', flame: '#FF3B6B', eye: '#FF3B3B', neck: 20, shoulder: 12, horns: true, glow: 'rgba(255,59,107,.9)' },
];

function softDot(color) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class Beast3D {
  constructor({ stage = 1, reduce = false, zIndex = 60, onReady, pose = null, smoke = true } = {}) {
    this.reduce = reduce; this.stageI = stage; this.onReady = onReady; this.pose = pose; this.smokeOn = smoke && !pose;
    this.anchor = null; this.charge = 0;
    const cv = (this.canvas = document.createElement('canvas'));
    cv.className = 'beast3d'; cv.setAttribute('aria-hidden', 'true');
    Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: String(zIndex) });
    document.body.appendChild(cv);
    this.renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 10, 5000);
    // lights: dim violet fill, a cool key from top-left, and a hot rim from behind
    this.scene.add(new THREE.AmbientLight('#5a3a9a', 0.9));
    const key = new THREE.DirectionalLight('#ffffff', 1.4); key.position.set(-400, 600, 700); this.scene.add(key);
    const rim = new THREE.DirectionalLight('#ff2e88', 2.2); rim.position.set(300, 200, -800); this.scene.add(rim);

    // rig: root (screen position) > tilt (climb) > yaw (facing) > model
    this.root = new THREE.Group(); this.tilt = new THREE.Group(); this.yaw = new THREE.Group();
    this.root.add(this.tilt); this.tilt.add(this.yaw); this.scene.add(this.root);
    this.smokeTex = softDot('rgba(80,40,150,1)'); this.sparkTex = softDot('rgba(255,255,255,1)');
    this.fx = new THREE.Group(); this.scene.add(this.fx); this.parts = [];

    this.pos = { x: innerWidth * 0.72, y: innerHeight * 0.55 }; this.v = { x: -80, y: 0 }; this.speed = 0;
    this.face = -1; this.yawNow = -Math.PI / 2; this.t = 0; this.mood = 0; this.dash = 0;
    this.target = { ...this.pos }; this.mouse = null; this.lastMove = -1e9; this.wander = { a: rand(0, 6.28), ...this.pos };
    this.resize(); addEventListener('resize', () => this.resize());
    addEventListener('pointermove', (e) => { this.mouse = { x: e.clientX, y: e.clientY }; this.lastMove = performance.now(); }, { passive: true });
    addEventListener('pointerdown', (e) => { if (!e.target.closest || !e.target.closest('a,button,input,[role=button],[role=tab]')) this.pounce(e.clientX, e.clientY); }, { passive: true });
    let lastY = scrollY;
    addEventListener('scroll', () => { const d = scrollY - lastY; lastY = scrollY; this.v.y += clamp(d, -80, 80) * 5; }, { passive: true });

    new GLTFLoader().load(MODEL, (g) => this.ready(g));
    this.clock = new THREE.Clock();
    const loop = () => { const dt = Math.min(0.033, this.clock.getDelta()); this.step(dt); this.renderer.render(this.scene, this.camera); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  resize() {
    const w = innerWidth, h = innerHeight; this.w = w; this.h = h;
    this.renderer.setSize(w, h, false);
    // camera distance chosen so 1 world unit = 1 CSS pixel on the z=0 plane
    const dist = h / 2 / Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    this.camera.aspect = w / h; this.camera.position.set(0, 0, dist); this.camera.near = 10; this.camera.far = dist * 3; this.camera.updateProjectionMatrix();
    this.mobileK = w < 760 ? 0.6 : 1;
  }
  toWorld(px, py) { return { x: px - this.w / 2, y: this.h / 2 - py }; }

  ready(gltf) {
    this.model = gltf.scene; this.yaw.add(this.model);
    this.model.position.set(0, -40, 10); // centre the body on the root
    // the shadow-beast material: dark body + neon fresnel rim (top colour -> low colour)
    this.rimU = { rimTop: { value: new THREE.Color() }, rimLow: { value: new THREE.Color() }, rimStr: { value: 2.4 } };
    const mat = new THREE.MeshStandardMaterial({ color: '#1a0f2e', roughness: 0.5, metalness: 0.35, flatShading: true });
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.rimU);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 rimTop; uniform vec3 rimLow; uniform float rimStr;')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          float fres = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.0);
          vec3 rimC = mix(rimLow, rimTop, clamp(normal.y * 0.5 + 0.5, 0.0, 1.0));
          totalEmissiveRadiance += rimC * fres * rimStr;`);
    };
    this.model.traverse((o) => { if (o.isMesh) { o.material = mat; o.frustumCulled = false; } });
    this.mixer = new THREE.AnimationMixer(this.model);
    this.actions = Object.fromEntries(gltf.animations.map((a) => [a.name, this.mixer.clipAction(a)]));
    Object.values(this.actions).forEach((a) => { a.play(); a.setEffectiveWeight(0); });
    this.actions.Run.setEffectiveWeight(1);
    this.bones = {}; this.model.traverse((o) => { if (o.isBone) this.bones[o.name] = o; });
    this.model.updateMatrixWorld(true);
    this.decorate(); this.applyStage();
    this.onReady && this.onReady(this);
  }

  // attach an object to a bone, given its rest-pose position/orientation in model space
  pin(bone, obj) { this.model.add(obj); obj.updateMatrixWorld(true); bone.attach(obj); }

  decorate() {
    const B = this.bones;
    this.flameMat = new THREE.MeshBasicMaterial({ color: '#FF2E88', transparent: true, opacity: 0.95 });
    this.flameCore = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8 });
    const cone = new THREE.ConeGeometry(3.2, 26, 5); cone.translate(0, 13, 0);
    const coreCone = new THREE.ConeGeometry(1.2, 18, 4); coreCone.translate(0, 9, 0);
    this.spikes = [];
    const ring = (bone, center, radius, n, len, back, group) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const dir = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
        if (dir.y < -0.75) continue; // leave the throat clear
        const m = new THREE.Mesh(cone, this.flameMat), c = new THREE.Mesh(coreCone, this.flameCore); m.add(c);
        m.position.copy(center).addScaledVector(dir, radius);
        const out = dir.clone().multiplyScalar(1).add(new THREE.Vector3(0, 0.35, -back)).normalize();
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), out);
        m.scale.setScalar(len); m.userData = { base: len, ph: rand(0, 6.28), group };
        this.pin(bone, m); this.spikes.push(m);
      }
    };
    const P = (b) => { const v = new THREE.Vector3(); this.bones[b].getWorldPosition(v); return this.model.worldToLocal(v); };
    const neck = P('b_Neck_04'), head = P('b_Head_05'), sp2 = P('b_Spine02_03');
    ring(B.b_Neck_04, neck.clone().lerp(head, 0.15), 15, 20, 1, 1.1, 'neck');
    ring(B.b_Head_05, head.clone().add(new THREE.Vector3(0, 2, -6)), 13, 14, 0.75, 1.3, 'neck');
    ring(B.b_Spine02_03, sp2, 15, 14, 0.7, 1.2, 'shoulder');
    // tail flames
    ['b_Tail01_012', 'b_Tail02_013', 'b_Tail03_014'].forEach((tb, k) => {
      const c = P(tb);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2, dir = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
        const m = new THREE.Mesh(cone, this.flameMat); m.position.copy(c).addScaledVector(dir, 6 + k * 2);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().add(new THREE.Vector3(0, 0.2, -1.6)).normalize());
        m.scale.setScalar(0.55 + k * 0.15); m.userData = { base: 0.55 + k * 0.15, ph: rand(0, 6.28), group: 'tail' };
        this.pin(this.bones[tb], m); this.spikes.push(m);
      }
    });
    // glowing eyes (slit diamonds) on the head
    this.eyeMat = new THREE.MeshBasicMaterial({ color: '#FFD60A' });
    const eyeG = new THREE.OctahedronGeometry(3.8, 0); eyeG.scale(1.7, 0.75, 0.8);
    this.eyes = [-1, 1].map((s) => { const e = new THREE.Mesh(eyeG, this.eyeMat); e.position.copy(head).add(new THREE.Vector3(s * 6.5, 7, 14)); e.rotation.z = s * 0.35; this.pin(B.b_Head_05, e); return e; });
    // horns (final form)
    this.hornMat = new THREE.MeshStandardMaterial({ color: '#F4ECDC', emissive: '#FF2E88', emissiveIntensity: 0.35, roughness: 0.4, flatShading: true });
    const hg = new THREE.ConeGeometry(3.6, 30, 6); hg.translate(0, 15, 0);
    this.horns = [-1, 1].map((s) => { const h = new THREE.Mesh(hg, this.hornMat); h.position.copy(head).add(new THREE.Vector3(s * 7, 14, 2)); h.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(s * 0.45, 0.8, -0.7).normalize()); this.pin(B.b_Head_05, h); return h; });
  }

  setStage(i) { this.stageI = i; this.applyStage(); this.burst(30); }
  applyStage() {
    const S = STAGES[this.stageI];
    this.canvas.style.setProperty("--glow", `drop-shadow(0 0 5px ${S.glow}) drop-shadow(0 0 14px rgba(139,92,246,.55))`);
    if (!this.model) return;
    this.rimU.rimTop.value.set(S.rimTop); this.rimU.rimLow.value.set(S.rimLow);
    this.flameMat.color.set(S.flame); this.eyeMat.color.set(S.eye);
    let n = 0, sh = 0;
    this.spikes.forEach((m) => {
      const g = m.userData.group;
      if (g === 'neck') m.visible = n++ < S.neck * 1.7;
      else if (g === 'shoulder') m.visible = sh++ < S.shoulder;
      else m.visible = this.stageI > 0 || Math.random() < 0.5;
    });
    this.horns.forEach((h) => (h.visible = S.horns));
  }

  pounce(x, y) { this.target = { x, y }; this.dash = 0.75; this.mood = 1; this.burst(18); }
  roar() { this.mood = 1; this.burst(30); }
  burst(n) { for (let i = 0; i < n; i++) this.emit(true); }
  emit(spark) {
    const mat = new THREE.SpriteMaterial({ map: spark ? this.sparkTex : this.smokeTex, color: spark ? STAGES[this.stageI].flame : '#ffffff', transparent: true, depthWrite: false, blending: spark ? THREE.AdditiveBlending : THREE.NormalBlending, opacity: spark ? 1 : 0.5 });
    const s = new THREE.Sprite(mat), k = STAGES[this.stageI].scale * this.mobileK;
    const p = this.toWorld(this.pos.x, this.pos.y);
    s.position.set(p.x - this.face * rand(10, 50) * k, p.y + rand(-15, 20) * k, rand(-20, 20));
    const size = spark ? rand(5, 10) : rand(9, 17) * k; s.scale.set(size, size, 1);
    this.fx.add(s);
    this.parts.push({ s, spark, vx: spark ? rand(-300, 300) : -this.v.x * 0.15 + rand(-20, 20), vy: spark ? rand(-100, 320) : this.v.y * 0.1 + rand(10, 50), life: spark ? rand(0.4, 0.8) : rand(0.7, 1.2), max: 1.2, grow: spark ? 0 : rand(10, 26) });
  }

  step(dt) {
    this.t += dt;
    const S = STAGES[this.stageI], k = S.scale * this.mobileK, now = performance.now();
    // where to go: hug the cursor, else wander; dash on a click
    const anc = this.anchor && this.anchor.el && this.anchor.el.getBoundingClientRect();
    const ancPt = anc ? { x: anc.left + anc.width * (this.anchor.fx ?? 0.5), y: anc.top + anc.height * (this.anchor.fy ?? 0.6) } : null;
    if (this.dash > 0) this.dash -= dt;
    else if (ancPt && this.anchor.strong) this.target = ancPt;
    else if (this.mouse && now - this.lastMove < 2600) this.target = { x: this.mouse.x + Math.cos(this.t * 0.8) * 140 * k, y: this.mouse.y + 60 * k + Math.sin(this.t * 1.6) * 30 };
    else if (ancPt) this.target = ancPt;
    this.wandering = !this.dash && !(ancPt) && !(this.mouse && now - this.lastMove < 2600);
    if (this.wandering) {
      const w = this.wander; w.a += rand(-1, 1) * dt * 1.3;
      w.x += Math.cos(w.a) * 160 * dt; w.y += Math.sin(w.a) * 60 * dt;
      if (w.x < 140 || w.x > this.w - 140) { w.a = Math.PI - w.a; w.x = clamp(w.x, 140, this.w - 140); }
      // roam the lower part of the screen so it never sits on what you're reading
      const top = this.h * 0.66;
      if (w.y < top || w.y > this.h - 70) { w.a = -w.a; w.y = clamp(w.y, top, this.h - 70); }
      this.target = { x: w.x, y: w.y };
    }
    const dx = this.target.x - this.pos.x, dy = this.target.y - this.pos.y, d = Math.hypot(dx, dy) || 1;
    const max = (this.dash > 0 ? 950 : 330) * this.mobileK, want = Math.min(max, d * 2.6), kk = Math.min(1, dt * (this.dash > 0 ? 6 : 2.6));
    this.v.x = lerp(this.v.x, (dx / d) * want, kk); this.v.y = lerp(this.v.y, (dy / d) * want, kk);
    this.pos.x = clamp(this.pos.x + this.v.x * dt, 90 * k, this.w - 90 * k); this.pos.y = clamp(this.pos.y + this.v.y * dt, 60 * k, this.h - 30 * k);
    this.speed = Math.hypot(this.v.x, this.v.y);
    this.mood = Math.max(0, this.mood - dt * 1.4);

    // place + orient: face left/right with a 3/4 turn toward the camera, lean into climbs
    if (this.pose) { this.pos = { x: this.w / 2, y: this.h / 2 + 40 * k }; this.v = { x: 0, y: 0 }; this.speed = 0; }
    const p = this.toWorld(this.pos.x, this.pos.y);
    const jit = this.charge ? (Math.random() - 0.5) * this.charge * 10 : 0;
    this.root.position.set(p.x + jit, p.y + (this.speed < 40 ? Math.sin(this.t * 2) * 3 : 0) + jit * 0.6, 0);
    if (Math.abs(this.v.x) > 25) this.face = this.v.x > 0 ? 1 : -1;
    const yawT = this.pose ? this.pose.yaw : this.face * (Math.PI / 2 - 0.42);
    this.yawNow = lerp(this.yawNow, yawT, Math.min(1, dt * 6));
    this.yaw.rotation.y = this.yawNow;
    this.tilt.rotation.x = 0.28; // look slightly down on its back so it reads as 3D
    this.tilt.rotation.z = lerp(this.tilt.rotation.z, clamp(Math.atan2(-this.v.y, Math.abs(this.v.x) + 60) * 0.6, -0.5, 0.5) * this.face, Math.min(1, dt * 5));
    this.wk = lerp(this.wk ?? 1, this.wandering ? 0.62 : 1, Math.min(1, dt * 2.5));
    this.root.scale.setScalar(k * this.wk * (1 + this.mood * 0.08));

    if (this.mixer) {
      // blend Survey / Walk / Run by speed; run faster when dashing
      if (this.pose) { ['Run', 'Walk', 'Survey'].forEach((n) => this.actions[n].setEffectiveWeight(n === this.pose.anim ? 1 : 0)); this.actions[this.pose.anim].time = this.pose.time; this.mixer.update(0); }
      const s = this.speed, wRun = clamp((s - 160) / 160, 0, 1), wWalk = clamp(s / 120, 0, 1) * (1 - wRun), wIdle = 1 - clamp(s / 60, 0, 1);
      if (!this.pose) { this.actions.Run.setEffectiveWeight(wRun); this.actions.Walk.setEffectiveWeight(wWalk * (1 - wIdle)); this.actions.Survey.setEffectiveWeight(wIdle); }
      this.actions.Run.timeScale = clamp(s / 380, 0.6, 2.2); this.actions.Walk.timeScale = clamp(s / 110, 0.6, 1.6);
      if (!this.pose) this.mixer.update(this.reduce ? 0 : dt);
      // flames flicker frame by frame; they flare when it pounces
      this.spikes.forEach((m) => { const u = m.userData; m.scale.set(u.base, u.base * (0.8 + 0.3 * Math.sin(this.t * 11 + u.ph) + this.mood * 0.6), u.base); });
      const blink = (this.t % 3.6) > 3.48; this.eyes.forEach((e) => (e.scale.y = blink ? 0.15 : 1 + this.mood * 0.6));
      this.rimU.rimStr.value = 2.4 + this.mood * 2 + this.charge * 3;
    }
    // shadow smoke + sparks
    if (!this.reduce && this.model && this.smokeOn) {
      if (Math.random() < (this.speed > 150 ? 0.45 : 0.15)) this.emit(false);
      if (Math.random() < (this.speed > 250 ? 0.4 : 0.08)) this.emit(true);
    }
    this.parts = this.parts.filter((q) => {
      q.life -= dt; if (q.life <= 0) { this.fx.remove(q.s); q.s.material.dispose(); return false; }
      if (q.spark) q.vy -= 500 * dt;
      q.s.position.x += q.vx * dt; q.s.position.y += q.vy * dt;
      if (q.grow) { const sc = q.s.scale.x + q.grow * dt; q.s.scale.set(sc, sc, 1); }
      q.s.material.opacity = (q.spark ? 1 : 0.22) * Math.min(1, q.life / (q.max * 0.6));
      return true;
    });
  }
}
