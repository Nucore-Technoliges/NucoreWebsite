import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Kronos — CGI rendering of an on-prem LLM compute rack (WebGL, rendered in-browser).
const stage = document.getElementById('kronosStage');
if (stage) {
  let w = stage.clientWidth || 460;
  let h = stage.clientHeight || 345;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 100);
  camera.position.set(5.6, 3.4, 6.8);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
  stage.appendChild(renderer.domElement);

  // PBR environment for realistic metal reflections
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // Lighting
  scene.add(new THREE.AmbientLight(0x6a6a74, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(6, 9, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x99bbff, 0.45);
  rim.position.set(-5, 3, -6);
  scene.add(rim);
  const accent = new THREE.PointLight(0x1a9e4a, 0.9, 30);
  accent.position.set(0, 1.5, 3.5);
  scene.add(accent);

  const mat = (color, metalness, roughness, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  const box = (x, y, z, material) => new THREE.Mesh(new THREE.BoxGeometry(x, y, z), material);

  const cluster = new THREE.Group();
  scene.add(cluster);

  // ---- Cabinet frame ----
  const frameMat = mat(0x26262d, 0.85, 0.42);
  const postMat = mat(0x16161c, 0.9, 0.4);
  const W = 3.0, D = 2.1, H = 4.0;
  // four vertical posts
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => {
    const post = box(0.14, H, 0.14, postMat);
    post.position.set(sx * (W / 2), 0, sz * (D / 2));
    cluster.add(post);
  });
  // top + bottom plates
  const cap = () => box(W + 0.16, 0.16, D + 0.16, frameMat);
  const top = cap(); top.position.y = H / 2; cluster.add(top);
  const bot = cap(); bot.position.y = -H / 2; cluster.add(bot);
  // back panel
  const back = box(W + 0.1, H, 0.06, mat(0x101015, 0.6, 0.5));
  back.position.z = -D / 2 - 0.02;
  cluster.add(back);

  // ---- Server sleds with glowing front bezels ----
  const sledMat = mat(0x1b1b22, 0.7, 0.45);
  const bezelMat = mat(0x0c0c11, 0.5, 0.5);
  const SLEDS = 9;
  const sledH = 0.30, gap = 0.12;
  const stackH = SLEDS * sledH + (SLEDS - 1) * gap;
  const leds = []; // { mesh, phase, lit }

  for (let i = 0; i < SLEDS; i++) {
    const y = -stackH / 2 + sledH / 2 + i * (sledH + gap);
    const sled = box(W - 0.34, sledH, D - 0.34, sledMat);
    sled.position.y = y;
    cluster.add(sled);

    // front bezel
    const bezel = box(W - 0.30, sledH - 0.06, 0.05, bezelMat);
    bezel.position.set(0, y, (D - 0.34) / 2 + 0.02);
    cluster.add(bezel);

    // status LEDs across the bezel
    const ledCount = 7;
    for (let j = 0; j < ledCount; j++) {
      const lit = Math.random() > 0.28;
      const color = lit ? 0x1a9e4a : 0x223027;
      const led = box(0.07, 0.07, 0.04, mat(0x05060a, 0.3, 0.4, {
        emissive: color, emissiveIntensity: lit ? 1.0 : 0.15,
      }));
      led.position.set(-((W - 0.7) / 2) + j * ((W - 0.7) / (ledCount - 1)), y + 0.05, (D - 0.34) / 2 + 0.05);
      cluster.add(led);
      leds.push({ mesh: led, phase: Math.random() * Math.PI * 2, lit });
    }
    // a couple of drive handles
    const handleMat = mat(0x33333b, 0.8, 0.4);
    [-0.9, 0.9].forEach((hx) => {
      const handle = box(0.12, 0.12, 0.04, handleMat);
      handle.position.set(hx, y - 0.05, (D - 0.34) / 2 + 0.05);
      cluster.add(handle);
    });
  }

  // ---- Interconnect glow core behind the stack ----
  const core = box(0.12, stackH * 0.92, 0.12, mat(0x05060a, 0.2, 0.4, {
    emissive: 0x1a9e4a, emissiveIntensity: 1.4,
  }));
  core.position.set(0, 0, -D / 2 + 0.18);
  cluster.add(core);

  // ---- Controls ----
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = 0.6;
  controls.maxPolarAngle = 1.55;
  controls.target.set(0, 0, 0);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  controls.autoRotate = !reduceMotion;
  controls.autoRotateSpeed = 0.85;

  controls.addEventListener('start', () => {
    controls.autoRotate = false;
    stage.parentElement && stage.parentElement.classList.add('is-grabbed');
    const hint = stage.parentElement && stage.parentElement.querySelector('.cgi-hint');
    if (hint) hint.style.opacity = '0';
  });

  function resize() {
    w = stage.clientWidth || 460;
    h = stage.clientHeight || 345;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  function animate(now) {
    requestAnimationFrame(animate);
    const t = now * 0.001;
    // subtle LED blink + core breathe
    if (!reduceMotion) {
      leds.forEach((l) => {
        if (!l.lit) return;
        l.mesh.material.emissiveIntensity = 0.6 + 0.5 * (0.5 + 0.5 * Math.sin(t * 2.4 + l.phase));
      });
      core.material.emissiveIntensity = 1.1 + 0.5 * Math.sin(t * 1.6);
    }
    controls.update();
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
}
