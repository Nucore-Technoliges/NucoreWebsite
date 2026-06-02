import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const stage = document.getElementById('gpuStage');
if (stage) {
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = THREE.MathUtils.lerp;

  let size = stage.clientWidth || 460;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(5.4, 4.6, 6.6);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(size, size);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
  stage.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(size, size);
  labelRenderer.domElement.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
  stage.appendChild(labelRenderer.domElement);

  // PBR environment for realistic metal/copper reflections
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // Lighting
  scene.add(new THREE.AmbientLight(0x70707a, 0.45));
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(6, 9, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x99bbff, 0.4);
  rim.position.set(-5, 3, -6);
  scene.add(rim);
  const accent = new THREE.PointLight(0x1a9e4a, 0.6, 30);
  accent.position.set(0, 2, 4);
  scene.add(accent);

  const mat = (color, metalness, roughness, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });

  const box = (w, h, d, material) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);

  const gpu = new THREE.Group();
  scene.add(gpu);

  const layers = []; // { group, baseY, explY }
  const fans = [];
  const labelDefs = []; // { obj, el }

  function addLabel(parent, text, x, y, z) {
    const el = document.createElement('div');
    el.className = 'gpu-tag';
    el.textContent = text;
    const obj = new CSS2DObject(el);
    obj.position.set(x, y, z);
    parent.add(obj);
    labelDefs.push({ el });
    return obj;
  }

  // ---- Backplate ----
  const backplate = new THREE.Group();
  backplate.add(box(3.5, 0.14, 2.35, mat(0x3c3c44, 0.85, 0.45)));
  addLabel(backplate, 'Backplate', 2.0, 0, 0.2);
  gpu.add(backplate);
  layers.push({ group: backplate, baseY: 0, explY: 0 });

  // ---- PCB (board + die + VRAM + VRM) ----
  const pcb = new THREE.Group();
  pcb.add(box(3.3, 0.12, 2.2, mat(0x0f5230, 0.25, 0.6)));
  const die = box(0.78, 0.12, 0.78, mat(0x0a0a0f, 0.4, 0.45, { emissive: 0x0c5e2e, emissiveIntensity: 0.6 }));
  die.position.y = 0.12;
  pcb.add(die);
  const vramMat = mat(0x2c6e46, 0.45, 0.5);
  const vramPos = [[-1.0, 0.55], [-0.45, 0.78], [0.45, 0.78], [1.0, 0.55], [-1.0, -0.55], [1.0, -0.55], [-0.45, -0.78], [0.45, -0.78]];
  vramPos.forEach(([x, z]) => { const v = box(0.34, 0.08, 0.22, vramMat); v.position.set(x, 0.1, z); pcb.add(v); });
  const vrmMat = mat(0x1b1b22, 0.6, 0.4);
  for (let i = 0; i < 5; i++) { const c = box(0.16, 0.16, 0.18, vrmMat); c.position.set(1.45, 0.12, -0.7 + i * 0.35); pcb.add(c); }
  addLabel(pcb, 'GPU Die', 0.0, 0.5, 0.0);
  addLabel(pcb, 'PCB', 2.0, 0, -0.2);
  gpu.add(pcb);
  layers.push({ group: pcb, baseY: 0.17, explY: 0.95 });

  // ---- Vapor chamber (copper) + heat pipes ----
  const vapor = new THREE.Group();
  vapor.add(box(3.05, 0.16, 2.0, mat(0xc9772f, 1.0, 0.28)));
  const pipeMat = mat(0xd9884a, 1.0, 0.22);
  for (let i = 0; i < 3; i++) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 2.7, 20), pipeMat);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(0, 0.12, -0.6 + i * 0.6);
    vapor.add(pipe);
  }
  addLabel(vapor, 'Vapor Chamber', 2.0, 0, 0);
  gpu.add(vapor);
  layers.push({ group: vapor, baseY: 0.32, explY: 1.7 });

  // ---- Heatsink fin stack ----
  const fins = new THREE.Group();
  const finMat = mat(0xb0b6c0, 0.92, 0.32);
  const finCount = 26;
  for (let i = 0; i < finCount; i++) {
    const fin = box(0.035, 0.62, 1.95, finMat);
    fin.position.x = -1.45 + (i / (finCount - 1)) * 2.9;
    fins.add(fin);
  }
  fins.add(box(2.95, 0.06, 2.0, mat(0x8a909c, 0.9, 0.35))); // base plate
  addLabel(fins, 'Heatsink Fins', 2.0, 0, 0);
  gpu.add(fins);
  layers.push({ group: fins, baseY: 0.75, explY: 2.65 });

  // ---- Shroud + fans ----
  const shroud = new THREE.Group();
  shroud.add(box(3.15, 0.22, 2.1, mat(0x202028, 0.5, 0.6)));
  function makeFan(cx) {
    const fan = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.07, 16, 40), mat(0x16161c, 0.5, 0.5, { emissive: 0x0c4a24, emissiveIntensity: 0.4 }));
    ring.rotation.x = Math.PI / 2;
    fan.add(ring);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.14, 20), mat(0x1a9e4a, 0.3, 0.4, { emissive: 0x0e6e34, emissiveIntensity: 0.7 }));
    hub.position.y = 0.04;
    fan.add(hub);
    const bladeMat = mat(0x101015, 0.4, 0.55);
    for (let b = 0; b < 9; b++) {
      const blade = box(0.5, 0.02, 0.2, bladeMat);
      blade.position.set(0.32, 0.02, 0);
      blade.rotation.y = 0.5;
      const arm = new THREE.Group();
      arm.add(blade);
      arm.rotation.y = (b / 9) * Math.PI * 2;
      fan.add(arm);
    }
    fan.position.set(cx, 0.16, 0);
    fans.length < 2 && fans.push(fan);
    return fan;
  }
  shroud.add(makeFan(-0.78));
  shroud.add(makeFan(0.78));
  addLabel(shroud, 'Shroud + Fans', 2.0, 0.2, 0);
  gpu.add(shroud);
  layers.push({ group: shroud, baseY: 1.05, explY: 3.55 });

  // ---- Controls ----
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = 0.5;
  controls.maxPolarAngle = 1.5;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.9;
  controls.target.set(0, 1.7, 0);

  let interacted = false;
  controls.addEventListener('start', () => {
    interacted = true;
    controls.autoRotate = false;
    stage.classList.add('is-grabbed');
    const hint = stage.querySelector('.gpu-hint');
    if (hint) hint.style.opacity = '0';
  });

  // ---- Explode driven by scroll + intro ----
  const hero = document.querySelector('.hero-home') || document.body;
  function scrollProgress() {
    const r = hero.getBoundingClientRect();
    return clamp(-r.top / ((window.innerHeight || 800) * 0.7), 0, 1);
  }
  function setExplode(t) {
    layers.forEach((L) => { L.group.position.y = lerp(L.baseY, L.explY, t); });
    controls.target.y = lerp(0.55, 1.7, t);
    const o = clamp((t - 0.2) / 0.8, 0, 1);
    labelDefs.forEach((l) => { l.el.style.opacity = String(o); });
  }

  function resize() {
    size = stage.clientWidth || 460;
    renderer.setSize(size, size);
    labelRenderer.setSize(size, size);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  const start = performance.now();
  function animate(now) {
    requestAnimationFrame(animate);
    const intro = clamp((now - start) / 1300, 0, 1);
    const introEased = 1 - Math.pow(1 - intro, 3);
    const t = (1 - scrollProgress()) * introEased;
    setExplode(t);
    fans.forEach((f, i) => { f.rotation.y += i ? -0.045 : 0.045; });
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
}
