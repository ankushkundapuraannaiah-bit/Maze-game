import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const P = window.Pathfinding, MZ = window.MazeGenerator, AU = window.CyberAudio;
const $ = id => document.getElementById(id), sh = (id, v = 'flex') => { $(id).style.display = v; }, hd = id => { $(id).style.display = 'none'; };
const on = (id, ev, fn) => $(id).addEventListener(ev, fn);

/* Player speed is fixed (4.4 tiles/s). From Hard up, Nemesis is FASTER than you: EMP, loops and decoys decide the race. */
const DIFF = {
  easy:      { n: 11, braid: .25, eSpd: 2.9, ramp: .010, emps: 3, decoys: 2, grace: 6, rubber: 0,   mult: 1 },
  medium:    { n: 17, braid: .15, eSpd: 4.0, ramp: .020, emps: 2, decoys: 1, grace: 4, rubber: .15, mult: 2 },
  hard:      { n: 23, braid: .10, eSpd: 4.9, ramp: .030, emps: 2, decoys: 1, grace: 3, rubber: .30, mult: 3 },
  nightmare: { n: 31, braid: .07, eSpd: 5.5, ramp: .040, emps: 1, decoys: 0, grace: 2, rubber: .50, mult: 5 }
};
const PSPD = 4.4, WH = 1.6, EMP_R = 8, EMP_CD = 1;
const G = { diff: 'medium', custom: 0, level: 1, mode: 'run', view: 'run', state: 'menu', algo: 'A*', vec: true, fro: true, sens: 4, yaw: 0, pitch: 0 };
const keys = {};

/* ---------- renderer / post ---------- */
const canvas = document.querySelector('canvas.threejs');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x030504); scene.fog = new THREE.FogExp2(0x040806, .12);
const cam = new THREE.PerspectiveCamera(75, 1, .05, 220); cam.rotation.order = 'YXZ';
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, cam));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), .7, .7, .3));
composer.addPass(new OutputPass());
const vig = document.createElement('div'); vig.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:6;opacity:0;transition:opacity .25s;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 35%,rgba(25,0,0,.55) 70%,rgba(0,0,0,.95) 100%)'; document.body.appendChild(vig);
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); composer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

const amb = new THREE.AmbientLight(0x2a3a30, .4); scene.add(amb, new THREE.HemisphereLight(0x4a6a58, 0x030504, .12));

/* ---------- horror textures: rotten brick, cracked wet tile, blood ---------- */
function grime(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), R = Math.random, wall = kind === 'wall';
  x.fillStyle = wall ? '#2a2b27' : '#16181a'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) { const v = 18 + R() * 40 | 0; x.fillStyle = `rgba(${v},${v + 3},${v},.35)`; x.fillRect(R() * 256, R() * 256, 2 + R() * 4, 2 + R() * 4); }
  for (let i = 0; i < 7; i++) { x.fillStyle = 'rgba(28,48,24,.22)'; x.beginPath(); x.arc(R() * 256, R() * 256, 10 + R() * 28, 0, 7); x.fill(); }
  x.strokeStyle = 'rgba(4,5,4,.9)'; x.lineWidth = 3;
  if (wall) { for (let r = 0; r < 8; r++) { const y = r * 32; x.beginPath(); x.moveTo(0, y); x.lineTo(256, y); x.stroke(); for (let k = r % 2 ? 0 : 32; k < 256; k += 64) { x.beginPath(); x.moveTo(k, y); x.lineTo(k, y + 32); x.stroke(); } } }
  else for (let i = 0; i <= 256; i += 128) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); }
  x.lineWidth = 1.2; for (let i = 0; i < 5; i++) { let a = R() * 256, b = R() * 256; x.beginPath(); x.moveTo(a, b); for (let j = 0; j < 6; j++) { a += (R() - .5) * 40; b += (R() - .3) * 30; x.lineTo(a, b); } x.stroke(); }
  for (let i = 0; i < (wall ? 3 : 2); i++) {
    if (wall) { const a = 12 + R() * 230, b = R() * 90, g = x.createLinearGradient(0, b, 0, b + 150); g.addColorStop(0, 'rgba(120,5,7,.9)'); g.addColorStop(1, 'rgba(60,0,2,0)'); x.fillStyle = g; x.fillRect(a, b, 4 + R() * 6, 70 + R() * 80); x.fillStyle = 'rgba(100,4,6,.8)'; x.beginPath(); x.arc(a + 3, b + 70 + R() * 60, 5, 0, 7); x.fill(); }
    else { const g = x.createRadialGradient(0, 0, 2, 0, 0, 40); g.addColorStop(0, 'rgba(110,4,6,.85)'); g.addColorStop(1, 'rgba(60,0,2,0)'); x.save(); x.translate(30 + R() * 190, 30 + R() * 190); x.scale(1 + R(), 1); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 40, 0, 7); x.fill(); x.restore(); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
const wallTex = grime('wall'), floorTex = grime('floor');
const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, bumpMap: wallTex, bumpScale: 2.5, roughness: .92, metalness: .05 });
const capMat = new THREE.MeshStandardMaterial({ color: 0x14120e, roughness: 1 });
const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, bumpMap: floorTex, bumpScale: 1.5, roughness: .3, metalness: .15 });
const ceilMat = new THREE.MeshStandardMaterial({ color: 0x050605, roughness: 1 });
const redGlow = new THREE.Color(0xff0033).multiplyScalar(2.2);

/* ---------- persistent actors ---------- */
const pLight = new THREE.PointLight(0xff8844, 4, 6, 2); scene.add(pLight);
const torch = new THREE.SpotLight(0xffe0b0, 34, 16, .42, .7, 1.8); scene.add(torch, torch.target);

function humanoid(o) {
  const b = o.bulk || 1, g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const suit = new THREE.MeshStandardMaterial({ color: o.suit, roughness: .4, metalness: .75 }), dark = new THREE.MeshStandardMaterial({ color: 0x080b14, roughness: .55, metalness: .6 });
  const glow = new THREE.MeshStandardMaterial({ color: o.glow, emissive: o.glow, emissiveIntensity: 3 });
  const M = (geo, mat, x, y, z, par) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); (par || body).add(m); return m; };
  M(new THREE.CapsuleGeometry(.13 * b, .24, 6, 14), suit, 0, .64, 0); M(new THREE.CapsuleGeometry(.1 * b, .1, 4, 10), dark, 0, .44, 0);
  M(new THREE.BoxGeometry(.2 * b, .028, .02), glow, 0, .72, .125 * b);
  const head = new THREE.Group(); head.position.y = .94; body.add(head); M(new THREE.SphereGeometry(.095 * b, 18, 14), dark, 0, 0, 0, head); M(new THREE.BoxGeometry(.13 * b, .032, .05), glow, 0, .008, .078 * b, head);
  if (o.horns) [-1, 1].forEach(x => { const h = M(new THREE.ConeGeometry(.025, .16, 6), suit, x * .07, .1, -.01, head); h.rotation.z = -x * .35; const sp = M(new THREE.ConeGeometry(.045, .14, 6), suit, x * .22 * b, .93, 0); sp.rotation.z = -x * 1.0; });
  if (o.pack) M(new THREE.BoxGeometry(.17, .22, .075), dark, 0, .68, -.15); 
  const limb = (x, y, len, w) => { const p = new THREE.Group(); p.position.set(x, y, 0); body.add(p);
    M(new THREE.CapsuleGeometry(w, len, 4, 10), suit, 0, -(len / 2 + w), 0, p); M(new THREE.SphereGeometry(w * 1.15, 10, 8), dark, 0, 0, 0, p); M(new THREE.BoxGeometry(.012, len * .8, .012), glow, Math.sign(x) * w, -(len / 2 + w), 0, p); return p; };
  const armL = limb(-.2 * b, .82, .25, .045 * b), armR = limb(.2 * b, .82, .25, .045 * b), legL = limb(-.085 * b, .45, .3, .06 * b), legR = limb(.085 * b, .45, .3, .06 * b);
  [legL, legR].forEach(l => M(new THREE.BoxGeometry(.1 * b, .05, .17), dark, 0, -.405, .035, l));
  return { g, body, head, armL, armR, legL, legR, glow, phase: 0, yaw: Math.PI, bias: o.bias || 0, lean: o.lean || 0 };
}
const shTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 2, 32, 32, 32); g.addColorStop(0, 'rgba(0,0,0,.8)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const mkShadow = r => { const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false })); m.position.y = .02; return m; };
const hero = humanoid({ suit: 0x32372c, glow: 0xffc36b, pack: 1, lean: .04 }); hero.g.scale.setScalar(.95); const pMesh = new THREE.Group(); pMesh.add(hero.g, mkShadow(.34)); scene.add(pMesh);
const gMat = new THREE.MeshStandardMaterial({ color: 0x15151c, emissive: 0x3a0610, emissiveIntensity: .6, roughness: .8, transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false });
const enemy = new THREE.Group(), gBody = new THREE.Group(); enemy.add(gBody);
/* smooth sheet-ghost silhouette: round dome head flowing into a wide hem */
const prof = new THREE.SplineCurve([[.001, 1.58], [.12, 1.55], [.22, 1.48], [.29, 1.36], [.325, 1.2], [.335, 1.0], [.35, .8], [.39, .55], [.45, .3], [.52, .1], [.54, 0]].map(a => new THREE.Vector2(a[0], a[1]))).getPoints(44);
const shroudGeo = new THREE.LatheGeometry(prof, 56), shroudBase = shroudGeo.attributes.position.array.slice();
const shroud = new THREE.Mesh(shroudGeo, gMat), halo = new THREE.Mesh(shroudGeo, new THREE.MeshBasicMaterial({ color: 0x8a0a14, transparent: true, opacity: .16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
halo.scale.set(1.14, 1.03, 1.14); gBody.add(shroud, halo);
/* painted face wrapped around the dome: sunken sockets, nose hollow, cheek shadows */
const faceTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const blot = (cx, cy, rx, ry, a) => { x.save(); x.translate(cx, cy); x.scale(rx / ry, 1); const g = x.createRadialGradient(0, 0, 2, 0, 0, ry); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(.6, `rgba(4,8,16,${a * .75})`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, ry, 0, 7); x.fill(); x.restore(); };
  const lite = (cx, cy, rx, ry, a) => { x.save(); x.translate(cx, cy); x.scale(rx / ry, 1); const g = x.createRadialGradient(0, 0, 2, 0, 0, ry); g.addColorStop(0, `rgba(150,150,170,${a})`); g.addColorStop(1, 'rgba(150,150,170,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, ry, 0, 7); x.fill(); x.restore(); };
  lite(128, 38, 60, 26, .22); lite(68, 118, 20, 30, .26); lite(188, 118, 20, 30, .26); lite(128, 100, 8, 20, .2);
  blot(88, 64, 26, 42, .95); blot(168, 64, 26, 42, .95); blot(88, 66, 15, 30, 1); blot(168, 66, 15, 30, 1);
  blot(128, 108, 10, 18, .55); blot(70, 112, 22, 30, .3); blot(186, 112, 22, 30, .3); blot(128, 165, 36, 40, .55);
  x.strokeStyle = 'rgba(210,20,30,.55)'; x.lineWidth = 2.5; [88, 168].forEach(cx => { x.beginPath(); x.ellipse(cx, 66, 17, 31, 0, 0, 7); x.stroke(); });
  x.strokeStyle = 'rgba(0,0,0,.8)'; x.lineWidth = 4; [[60, 38, 100, 46], [196, 38, 156, 46]].forEach(l => { x.beginPath(); x.moveTo(l[0], l[1]); x.lineTo(l[2], l[3]); x.stroke(); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const face = new THREE.Mesh(new THREE.CylinderGeometry(.337, .337, .4, 32, 1, true, -.7, 1.4), new THREE.MeshBasicMaterial({ map: faceTex, transparent: true, depthWrite: false })); face.position.y = 1.12; gBody.add(face);
const black = new THREE.MeshBasicMaterial({ color: 0 }), redEye = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff1100).multiplyScalar(4) });
const gMouth = new THREE.Mesh(new THREE.SphereGeometry(.04, 12, 10), new THREE.MeshBasicMaterial({ color: 0x3c0006 })); gMouth.scale.set(1.3, 2.4, .5); gMouth.position.set(0, 1.05, .333); gBody.add(gMouth);
[-1, 1].forEach(x => { const p = new THREE.Mesh(new THREE.SphereGeometry(.02, 8, 6), redEye); p.position.set(x * .0735, 1.215, .333); gBody.add(p); });
/* long wispy arms with clawed fingers */
const arms = [-1, 1].map(x => { const m = new THREE.Mesh(new THREE.CylinderGeometry(.014, .055, .85, 10).translate(0, -.425, 0), gMat); m.position.set(x * .3, 1.0, .08);
  for (let i = -1.5; i <= 1.5; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(.013, .14, 5), gMat); f.position.set(i * .024, -.9, 0); f.rotation.set(Math.PI, 0, -i * .2); m.add(f); }
  gBody.add(m); return m; });
/* glow aura + orbiting wisps */
const auraTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, 'rgba(160,210,255,.9)'); g.addColorStop(1, 'rgba(160,210,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: auraTex, color: 0xaa1020, transparent: true, opacity: .25, blending: THREE.AdditiveBlending, depthWrite: false })); aura.scale.set(2.4, 2.8, 1); aura.position.set(0, .85, -.15); gBody.add(aura);
const wispMat = new THREE.MeshBasicMaterial({ color: 0xb01020, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false });
const wisps = Array.from({ length: 6 }, () => { const w = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), wispMat); gBody.add(w); return w; });
const eLight = new THREE.PointLight(0xff2a2a, 16, 9, 2); eLight.position.y = 1.1; enemy.add(eLight, mkShadow(.5)); scene.add(enemy);
let gYaw = 0;
function ghostAnim(t, dt) {
  const st = S.stun > 0, pr = S.prox || 0, sp = G.state === 'play' ? Math.hypot(S.evx || 0, S.evz || 0) : 0;
  let d = Math.atan2(S.px - S.ex, S.pz - S.ez) - gYaw; d = Math.atan2(Math.sin(d), Math.cos(d)); gYaw += d * Math.min(1, dt * 4); enemy.rotation.y = gYaw;
  gBody.position.y = .22 + Math.sin(t * 1.7) * .08 - (st ? .15 : 0); gBody.rotation.x = .08 + Math.min(.22, sp * .045) + (st ? .25 : 0); gBody.rotation.z = Math.sin(t * 1.3) * .05;
  const p = shroudGeo.attributes.position.array;
  for (let i = 0; i < p.length; i += 3) { const x = shroudBase[i], y = shroudBase[i + 1], z = shroudBase[i + 2], w = Math.max(0, (.55 - y) / .55), a = Math.atan2(z, x), f = 1 + Math.sin(a * 5 + t * 3 + y * 5) * .16 * w; p[i] = x * f; p[i + 1] = y + Math.sin(a * 6 + t * 2) * .07 * w; p[i + 2] = z * f; }
  shroudGeo.attributes.position.needsUpdate = true; shroudGeo.computeVertexNormals();
  arms.forEach((m, i) => { m.rotation.x = -1.3 + Math.sin(t * 2 + i * 2) * .14 - Math.min(.25, pr) * .3; m.rotation.z = (i ? 1 : -1) * .3 + Math.sin(t * 1.4 + i) * .08; });
  wisps.forEach((w, i) => { const a = t * (.7 + i * .05) + i * 1.05; w.position.set(Math.cos(a) * (.5 + .08 * Math.sin(t + i)), .2 + (i % 3) * .3 + Math.sin(t * 2 + i) * .1, Math.sin(a) * .5); });
  gMouth.scale.y = st ? 1.2 : 2.4 + pr * 2.4 + Math.sin(t * 6) * .3; gMouth.scale.x = 1.3 + pr * .5;
  gMat.opacity = st ? .2 + Math.random() * .15 : .78 + Math.sin(t * 2.3) * .05 - (Math.sin(t * .7) > .93 ? .35 : 0); gMat.color.setHex(st ? 0x3a3f66 : 0x15151c); gMat.emissive.setHex(st ? 0x111a55 : 0x3a0610); aura.material.opacity = st ? .08 : .25 + pr * .3;
  eLight.intensity = st ? 3 + Math.random() * 6 : 16 + Math.sin(t * 9) * 4 + pr * 16;
}
function animate(r, vx, vz, dt, stunned) {
  const sp = Math.hypot(vx, vz);
  if (sp > .15) { let d = Math.atan2(vx, vz) - r.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); r.yaw += d * Math.min(1, dt * 11); }
  r.g.rotation.y = r.yaw; r.phase += sp * dt * 3.6;
  const s = Math.sin(r.phase), c = Math.cos(r.phase), k = Math.min(1, sp / 3), idle = Math.sin(clock * 1.8);
  if (stunned) {
    r.body.rotation.x += (.5 - r.body.rotation.x) * Math.min(1, dt * 6); r.body.position.y += (-.06 - r.body.position.y) * Math.min(1, dt * 6); r.body.rotation.z = (Math.random() - .5) * .1;
    r.head.rotation.x = .45; r.legL.rotation.x = r.legR.rotation.x = .1; r.armL.rotation.x = r.armR.rotation.x = .25;
  } else {
    r.body.rotation.x = .02 + (.1 + r.lean) * k + idle * .008; r.body.position.y = Math.abs(c) * .05 * k + idle * .006 * (1 - k); r.body.rotation.z = s * .05 * k;
    r.legL.rotation.x = s * .95 * k; r.legR.rotation.x = -s * .95 * k; r.armL.rotation.x = -s * .8 * k * (r.bias ? .5 : 1) + r.bias * k; r.armR.rotation.x = s * .8 * k * (r.bias ? .5 : 1) + r.bias * k;
    r.head.rotation.x = -.05 * k; r.head.rotation.y = Math.sin(clock * 1.2) * .25 * (1 - k);
  }
}
const decoyM = new THREE.Mesh(new THREE.OctahedronGeometry(.25, 1), new THREE.MeshBasicMaterial({ color: 0x66ccff, wireframe: true, transparent: true, opacity: .9 })); scene.add(decoyM);
const empRing = new THREE.Mesh(new THREE.RingGeometry(.92, 1, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x38bdf8).multiplyScalar(2.5), transparent: true, side: THREE.DoubleSide })); empRing.visible = false; scene.add(empRing);

/* ---------- level ---------- */
let lamps = [], dust = null, world = null, items = [], exitG = null, frontM = null, pathM = null, ceil = null;
const m4 = new THREE.Matrix4();
function build() {
  if (world) { scene.remove(world); world.traverse(o => o.geometry && o.geometry.dispose()); }
  world = new THREE.Group(); scene.add(world);
  const { grid, width: W, height: H } = G.maze, walls = [];
  grid.forEach((r, y) => r.forEach((v, x) => v && walls.push([x, y])));
  const wm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, WH, 1), wallMat, walls.length), cm = new THREE.InstancedMesh(new THREE.BoxGeometry(1.02, .06, 1.02), capMat, walls.length);
  walls.forEach(([x, y], i) => { m4.setPosition(x, WH / 2, y); wm.setMatrixAt(i, m4); m4.setPosition(x, WH + .02, y); cm.setMatrixAt(i, m4); });
  floorTex.repeat.set(W, H);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, H).rotateX(-Math.PI / 2), floorMat); floor.position.set(W / 2 - .5, 0, H / 2 - .5);
  ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, H).rotateX(Math.PI / 2), ceilMat); ceil.position.set(W / 2 - .5, WH, H / 2 - .5);
  world.add(wm, cm, floor, ceil);
  items = G.maze.items.map(p => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(.15, 0), new THREE.MeshStandardMaterial({ color: 0x6a4a1a, emissive: 0xffb347, emissiveIntensity: 2.6 }));
    m.position.set(p.x, .6, p.y); m.userData = { x: p.x, y: p.y, got: false }; world.add(m); return m; });
  exitG = new THREE.Group(); const ex = G.maze.exitPos, em = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x66ffcc).multiplyScalar(2) });
  for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(.32 + i * .06, .02, 8, 40), em); r.rotation.x = Math.PI / 2; r.position.y = .3 + i * .45; exitG.add(r); }
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, WH + 2, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0x33ffaa, transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  beam.position.y = (WH + 2) / 2; exitG.add(beam, new THREE.PointLight(0x33ffaa, 22, 8, 2)); exitG.position.set(ex.x, 0, ex.y); world.add(exitG);
  frontM = new THREE.InstancedMesh(new THREE.PlaneGeometry(.86, .86).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x1e60ff, transparent: true, opacity: .3, depthWrite: false }), W * H); frontM.count = 0; frontM.frustumCulled = false;
  pathM = new THREE.InstancedMesh(new THREE.BoxGeometry(.2, .03, .2), new THREE.MeshBasicMaterial({ color: redGlow }), W * H); pathM.count = 0; pathM.frustumCulled = false;
  world.add(frontM, pathM);
  lamps = []; const nL = Math.min(5, Math.round(W / 5));
  for (let i = 0, tries = 0; i < nL && tries < 200; tries++) { const x = 1 + Math.random() * (W - 2) | 0, y = 1 + Math.random() * (H - 2) | 0; if (grid[y][x] !== 0 || (Math.abs(x - G.maze.playerStart.x) + Math.abs(y - G.maze.playerStart.y)) < 4) continue; i++;
    const l = new THREE.PointLight(0xff8a3a, 7, 6, 2); l.position.set(x, 1.25, y); l.userData = { base: 7, ph: Math.random() * 9 }; const b = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff9a4a).multiplyScalar(2) })); b.position.copy(l.position); world.add(l, b); lamps.push(l); }
  const N = 500, dp = new Float32Array(N * 3); for (let i = 0; i < N; i++) { dp[i * 3] = Math.random() * W - .5; dp[i * 3 + 1] = Math.random() * WH; dp[i * 3 + 2] = Math.random() * H - .5; }
  dust = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(dp, 3)), new THREE.PointsMaterial({ color: 0xaab5a8, size: .035, transparent: true, opacity: .55, depthWrite: false })); world.add(dust);
}

/* ---------- game state ---------- */
const S = {};
function cfg() { return DIFF[G.diff]; }
function newGame() {
  const c = cfg(), n = G.custom || c.n; G.maze = MZ.generate(n, n, c.braid); build();
  const m = G.maze; Object.assign(S, { px: m.playerStart.x, pz: m.playerStart.y, ex: m.enemyStart.x, ez: m.enemyStart.y, t: 0, shards: 0, emps: c.emps, decoys: c.decoys, cd: 0, stun: 0, decoyT: 0, dx: 0, dz: 0, prox: 0, pvx: 0, pvz: 0, evx: 0, evz: 0, res: null, key: '', hud: 0, mm: 0, ring: 0,
    espd: c.eSpd * (1 + .05 * (G.level - 1)) });
  for (const [dx, dz] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) if (m.grid[m.playerStart.y + dz]?.[m.playerStart.x + dx] === 0) { G.yaw = Math.atan2(-dx, -dz); break; }
  G.pitch = 0; G.view = G.mode === 'run' ? 'run' : 'chase'; G.state = 'play';
  ['start-screen', 'howtoplay-overlay', 'finish-screen', 'solver-pause-overlay', 'runner-overlay', 'solved-screen'].forEach(hd);
  sh('cyber-hud-top', 'flex'); sh('tactical-dock', 'block'); sh('pause-btn', 'block'); sh('mini-map-canvas', 'block');
  if (matchMedia('(pointer:coarse)').matches) { sh('touch-dpad', 'block'); sh('touch-look-zone', 'block'); }
  $('hud-diff-badge').textContent = `${G.diff.toUpperCase()} ${n}×${n}` + (G.level > 1 ? ` L${G.level}` : '');
  if (G.mode === 'run') lock();
  hudUpdate(true);
}
const lock = () => { try { const p = canvas.requestPointerLock(); p && p.catch && p.catch(() => {}); } catch (e) {} };
const unlock = () => { if (document.pointerLockElement) document.exitPointerLock(); };
const tile = (x, z) => ({ x: Math.round(x), y: Math.round(z) });
const walk = (x, z) => G.maze.grid[Math.round(z)]?.[Math.round(x)] === 0;
const free = (x, z, r = .27) => walk(x - r, z - r) && walk(x + r, z - r) && walk(x - r, z + r) && walk(x + r, z + r);

function pause() {
  if (G.state !== 'play') return; G.state = 'pause'; unlock(); sh(G.mode === 'run' ? 'runner-overlay' : 'solver-pause-overlay'); hd('pointer-lock-hint');
}
function resume() { if (G.state !== 'pause') return; G.state = 'play'; hd('runner-overlay'); hd('solver-pause-overlay'); if (G.mode === 'run') lock(); }
function menu() {
  G.state = 'menu'; unlock(); ['cyber-hud-top', 'tactical-dock', 'pause-btn', 'mini-map-canvas', 'finish-screen', 'runner-overlay', 'solver-pause-overlay', 'pointer-lock-hint', 'touch-dpad', 'touch-look-zone'].forEach(hd);
  $('cyber-deck').classList.remove('open'); sh('start-screen');
}
function end(win) {
  G.state = 'end'; unlock(); hd('pointer-lock-hint'); const c = cfg(); let txt;
  if (win) {
    const bonus = Math.max(0, Math.round(((G.maze.width * 3) - S.t) * 10)), total = live() + (1000 + bonus) * c.mult, k = 'cm3d_best_' + G.diff;
    let best = 0; try { best = +localStorage.getItem(k) || 0; if (total > best) { localStorage.setItem(k, total); } } catch (e) {}
    txt = `Score ${total}${total > best ? '  ★ NEW BEST' : '  (best ' + best + ')'} · ${fmt(S.t)} · ${S.shards}/${items.length} cores`; AU.win();
  } else { txt = `Caught after ${fmt(S.t)} · ${S.shards}/${items.length} cores · Score ${live()}`; AU.lose(); }
  $('finish-title').textContent = win ? 'ESCAPED!' : 'THE GHOST GOT YOU'; $('finish-level-text').textContent = txt;
  $('next-level-btn').style.display = win ? '' : 'none'; $('next-level-btn').textContent = win ? 'Next Level ▶ (AI +5% faster)' : ''; sh('finish-screen');
}
const fmt = t => `${String(t / 60 | 0).padStart(2, '0')}:${(t % 60).toFixed(1).padStart(4, '0')}`;
const live = () => Math.floor((S.shards * 150 + S.t * 2) * cfg().mult);

/* ---------- abilities ---------- */
function emp() {
  if (S.emps <= 0 || S.cd > 0) return; S.emps--; S.cd = EMP_CD; AU.emp(); S.ring = .001; empRing.position.set(S.px, .1, S.pz);
  if (Math.hypot(S.ex - S.px, S.ez - S.pz) <= EMP_R) S.stun = { easy: 4.5, medium: 3.5, hard: 3, nightmare: 2.5 }[G.diff];
}
function decoy() { if (S.decoys <= 0 || S.decoyT > 0) return; S.decoys--; S.decoyT = 3.5; S.dx = Math.round(S.px); S.dz = Math.round(S.pz); decoyM.position.set(S.dx, .7, S.dz); AU.decoy(); }

/* ---------- enemy AI: ALWAYS re-targets the player (or an active decoy), every tile change ---------- */
function replan() {
  const tgt = S.decoyT > 0 ? { x: S.dx, y: S.dz } : tile(S.px, S.pz), s = tile(S.ex, S.ez), key = `${s.x},${s.y}>${tgt.x},${tgt.y}`;
  if (key === S.key) return; S.key = key;
  const f = G.algo === 'BFS' ? P.findPathBFS : G.algo === 'Greedy' ? P.findPathGreedy : P.findPathAStar, r = f(G.maze.grid, s, tgt); S.res = r; viz(r);
  $('telemetry-algo').textContent = r.metrics.algorithm; $('telemetry-nodes').textContent = r.metrics.nodesExplored; $('telemetry-path').textContent = Math.max(0, r.path.length - 1); $('telemetry-latency').textContent = r.metrics.timeMs.toFixed(2) + ' ms';
}
function viz(r) {
  const n = Math.min(r.explored.length, frontM.instanceMatrix.count); r.explored.slice(0, n).forEach((p, i) => { m4.setPosition(p.x, .03, p.y); frontM.setMatrixAt(i, m4); }); frontM.count = G.fro ? n : 0; frontM.instanceMatrix.needsUpdate = true;
  r.path.forEach((p, i) => { m4.setPosition(p.x, .06, p.y); pathM.setMatrixAt(i, m4); }); pathM.count = G.vec ? r.path.length : 0; pathM.instanceMatrix.needsUpdate = true;
}
function enemyStep(dt) {
  const c = cfg(); replan(); const ox = S.ex, oz = S.ez, len = S.res ? S.res.path.length - 1 : 0;
  let state = 'HAUNTING', spd = S.espd + Math.min(1.5, S.t * c.ramp);
  spd *= 1 + c.rubber * Math.min(1, Math.max(0, len - 12) / 20); // rubber-band: never lets you gain a huge lead
  if (S.t < c.grace) state = 'DORMANT'; else if (S.stun > 0) { state = 'BANISHED'; S.stun -= dt; } else {
    if (S.decoyT > 0) state = 'LURED BY DECOY';
    const p = S.res.path; let tx, tz; if (p.length > 1) { tx = p[1].x; tz = p[1].y; } else { tx = S.decoyT > 0 ? S.dx : S.px; tz = S.decoyT > 0 ? S.dz : S.pz; }
    const dx = tx - S.ex, dz = tz - S.ez, d = Math.hypot(dx, dz), st = Math.min(d, spd * dt); if (d > 1e-4) { S.ex += dx / d * st; S.ez += dz / d * st; }
  }
  $('telemetry-state').textContent = state; eLight.color.setHex(S.stun > 0 ? 0x4455ff : 0xff2a2a);
  S.evx = (S.ex - ox) / dt; S.evz = (S.ez - oz) / dt;
  return len;
}

/* ---------- main update ---------- */
function update(dt) {
  S.t += dt; S.cd = Math.max(0, S.cd - dt); S.decoyT = Math.max(0, S.decoyT - dt);
  const k = c => keys[c] ? 1 : 0, f = k('KeyW') + k('ArrowUp') - k('KeyS') - k('ArrowDown'), s = k('KeyD') - k('KeyA') + (G.view === 'run' ? 0 : k('ArrowRight') - k('ArrowLeft'));
  if (G.view === 'run') G.yaw += (k('ArrowLeft') - k('ArrowRight')) * 2.2 * dt;
  let vx, vz; if (G.view === 'run') { vx = -Math.sin(G.yaw) * f + Math.cos(G.yaw) * s; vz = -Math.cos(G.yaw) * f - Math.sin(G.yaw) * s; } else { vx = s; vz = -f; }
  const l = Math.hypot(vx, vz), ox = S.px, oz = S.pz; if (l > 0) { vx = vx / l * PSPD * dt; vz = vz / l * PSPD * dt; if (free(S.px + vx, S.pz)) S.px += vx; if (free(S.px, S.pz + vz)) S.pz += vz; }
  S.pvx = (S.px - ox) / dt; S.pvz = (S.pz - oz) / dt;
  items.forEach(m => { if (!m.userData.got && Math.hypot(m.userData.x - S.px, m.userData.y - S.pz) < .5) { m.userData.got = true; m.visible = false; S.shards++; AU.pickup(); } });
  const len = enemyStep(dt), dist = Math.hypot(S.ex - S.px, S.ez - S.pz);
  S.prox = Math.max(0, 1 - len / 14); AU.tick(S.prox, dt);
  if (dist < .55) return end(false);
  const ex = G.maze.exitPos; if (Math.hypot(ex.x - S.px, ex.y - S.pz) < .5) return end(true);
  S.hud -= dt; if (S.hud <= 0) { S.hud = .1; hudUpdate(false, len); }
  S.mm -= dt; if (S.mm <= 0) { S.mm = .08; minimap(); }
}
function hudUpdate(force, len = 99) {
  $('hud-time').textContent = fmt(S.t); $('hud-score').textContent = live(); $('hud-shards').textContent = `${S.shards}/${items.length}`; $('hud-shard-bar').style.width = (items.length ? S.shards / items.length * 100 : 0) + '%';
  const th = $('hud-threat'); th.textContent = len < 6 ? 'DANGER' : len < 12 ? 'CLOSE' : 'SECURE'; th.className = 'metric-value ' + (len < 12 ? 'threat-danger' : 'threat-secure');
  $('dock-emp-count').textContent = S.emps; $('dock-emp-status').textContent = S.emps <= 0 ? 'EMPTY' : S.cd > 0 ? 'CHARGING' : 'READY'; $('dock-emp-gauge').style.width = (S.cd / EMP_CD * 100) + '%';
  $('dock-decoy-count').textContent = S.decoys; $('dock-decoy-status').textContent = S.decoys <= 0 ? 'EMPTY' : S.decoyT > 0 ? 'ACTIVE' : 'READY'; $('dock-decoy-gauge').style.width = (S.decoyT / 3.5 * 100) + '%';
}
const mmc = $('mini-map-canvas'), mx = mmc.getContext('2d');
function minimap() {
  const { grid, width: W, height: H } = G.maze, c = mmc.width / Math.max(W, H); mx.clearRect(0, 0, 130, 130); mx.fillStyle = '#14234b';
  grid.forEach((r, y) => r.forEach((v, x) => { if (v) mx.fillRect(x * c, y * c, c + .5, c + .5); }));
  const dot = (x, y, col, r) => { mx.fillStyle = col; mx.beginPath(); mx.arc((x + .5) * c, (y + .5) * c, r, 0, 7); mx.fill(); };
  items.forEach(m => !m.userData.got && dot(m.userData.x, m.userData.y, '#ffc36b', Math.max(1, c / 5))); dot(G.maze.exitPos.x, G.maze.exitPos.y, '#33ffaa', c / 2);
  dot(S.ex, S.ez, '#ff3344', Math.max(2.5, c / 2)); dot(S.px, S.pz, '#4aa8ff', Math.max(2.5, c / 2));
}

/* ---------- camera + animation ---------- */
const look = new THREE.Vector3(), cp = new THREE.Vector3(); let last = performance.now(), clock = 0;
function frame(now) {
  requestAnimationFrame(frame); const dt = Math.min(.05, (now - last) / 1000); last = now; clock += dt;
  if (G.state === 'play') update(dt);
  const t = clock;
  if (world) {
    items.forEach((m, i) => { m.rotation.y = t * 2 + i; m.rotation.x = t * 1.3; m.position.y = .6 + Math.sin(t * 2 + i) * .08; });
    exitG.children.forEach((c, i) => { if (c.geometry && c.geometry.type === 'TorusGeometry') c.rotation.z = t * (1 + i * .5); });
    ghostAnim(t, dt);
    lamps.forEach(l => { const u = l.userData; l.intensity = u.base * (.65 + .35 * Math.sin(t * 17 + u.ph) * Math.sin(t * 5.3 + u.ph)) * (Math.sin(t * .6 + u.ph * 3) > .9 ? .1 : 1); });
    dust.position.set(Math.sin(t * .2) * .4, Math.sin(t * .3) * .15, Math.cos(t * .17) * .4);
  }
  if (G.state === 'menu') { const W = G.maze.width, a = t * .12; cam.fov = 55; cam.position.set(W / 2 + Math.cos(a) * W * .55, 5 + Math.sin(t * .3) * 1.5, W / 2 + Math.sin(a) * W * .55); cam.lookAt(W / 2, 0, W / 2); cam.updateProjectionMatrix(); enemy.position.set(S.ex, 0, S.ez); pMesh.position.set(S.px, 0, S.pz); animate(hero, 0, 0, dt, false); ceil.visible = false; scene.fog.density = .03; pMesh.visible = true; torch.visible = false; amb.intensity = .9; pLight.position.set(W / 2, 3, W / 2); }
  else {
    const W = G.maze.width, H = G.maze.height, run = G.view === 'run'; const pl = G.state === 'play'; torch.visible = false; enemy.position.set(S.ex, 0, S.ez); enemy.visible = true; animate(hero, pl ? S.pvx : 0, pl ? S.pvz : 0, dt, false);
    pMesh.visible = !run; pMesh.position.set(S.px, 0, S.pz); ceil.visible = run; amb.intensity = run ? .6 : G.view === 'map' ? 1.5 : .8; decoyM.visible = S.decoyT > 0; decoyM.rotation.y = t * 3;
    if (S.ring > 0) { S.ring += dt; const u = S.ring / .7; empRing.visible = u < 1; empRing.scale.setScalar(.5 + u * EMP_R); empRing.material.opacity = 1 - u; if (u >= 1) S.ring = 0; } else empRing.visible = false;
    const fov = run ? 75 : 55; if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
    if (run) { const sk = (S.prox || 0) ** 2 * .03, r = () => (Math.random() - .5) * sk; cam.position.set(S.px + r(), .75 + r(), S.pz + r()); cam.rotation.set(G.pitch + r() * .6, G.yaw, 0); pLight.position.copy(cam.position); scene.fog.density = .14; torch.position.set(S.px, .75, S.pz); torch.target.position.set(S.px - Math.sin(G.yaw) * 6, .75 + Math.sin(G.pitch) * 6, S.pz - Math.cos(G.yaw) * 6); }
    else if (G.view === 'chase') { cp.set(S.px, 8.5, S.pz + 4.6); cam.position.lerp(cp, 1 - Math.pow(.001, dt)); look.set(S.px, 0, S.pz - .4); cam.lookAt(look); pLight.position.set(S.px, 1.4, S.pz); scene.fog.density = .06; torch.position.set(S.px, 1, S.pz); torch.target.position.set(S.px + Math.sin(hero.yaw) * 6, .2, S.pz + Math.cos(hero.yaw) * 6); }
    else { cam.position.set(W / 2 - .5, Math.max(W, H) * 1.05, H / 2 - .5 + .01); cam.lookAt(W / 2 - .5, 0, H / 2 - .5); pLight.position.set(S.px, 1.4, S.pz); scene.fog.density = 0; torch.position.set(S.px, 1, S.pz); torch.target.position.set(S.px + Math.sin(hero.yaw) * 6, .2, S.pz + Math.cos(hero.yaw) * 6); }
  }
  const px = S.prox || 0; torch.intensity = 0;
  vig.style.opacity = G.state === 'menu' ? 0 : .4 + px * .6;
  composer.render();
}

/* ---------- input / UI wiring ---------- */
addEventListener('keydown', e => {
  if (e.code === 'Tab') { e.preventDefault(); if (G.state !== 'menu') $('cyber-deck').classList.toggle('open'); return; }
  keys[e.code] = true;
  if (G.state === 'play') {
    if (e.code === 'Space') { e.preventDefault(); emp(); } else if (e.code === 'KeyE') decoy(); else if (e.code === 'KeyP' || e.code === 'Escape') pause();
    else if (e.code === 'KeyM') G.view = G.view === 'map' ? (G.mode === 'run' ? 'run' : 'chase') : 'map'; else if (e.code === 'KeyF') document.documentElement.requestFullscreen?.();
  } else if (G.state === 'pause' && (e.code === 'KeyP' || e.code === 'Escape')) resume();
  if (e.code === 'KeyR' && G.state !== 'menu') menu();
});
addEventListener('keyup', e => { keys[e.code] = false; }); addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
addEventListener('mousemove', e => { if (document.pointerLockElement === canvas && G.state === 'play') { G.yaw -= e.movementX * G.sens * .0005; G.pitch = Math.max(-1.2, Math.min(1.2, G.pitch - e.movementY * G.sens * .0005)); } });
document.addEventListener('pointerlockchange', () => { const l = document.pointerLockElement === canvas; if (!l && G.state === 'play' && G.mode === 'run') pause(); $('pointer-lock-hint').style.display = (G.state === 'play' && G.mode === 'run' && !l) ? 'block' : 'none'; });
canvas.addEventListener('click', () => { if (G.state === 'play' && G.mode === 'run' && !document.pointerLockElement) lock(); });
[['dpad-up', 'KeyW'], ['dpad-down', 'KeyS'], ['dpad-left', 'KeyA'], ['dpad-right', 'KeyD']].forEach(([id, c]) => { const b = $(id); b.addEventListener('pointerdown', () => { keys[c] = true; }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => { keys[c] = false; })); });
let tx0 = 0; on('touch-look-zone', 'touchstart', e => { tx0 = e.touches[0].clientX; }); on('touch-look-zone', 'touchmove', e => { const x = e.touches[0].clientX; G.yaw -= (x - tx0) * .006; tx0 = x; });
on('touch-pause-btn', 'click', pause);

document.querySelectorAll('.diff-btn').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.diff-btn').forEach(x => x.classList.remove('active')); b.classList.add('active'); G.diff = b.dataset.diff; G.custom = 0; $('level-slider').value = DIFF[G.diff].n; $('level-value').textContent = DIFF[G.diff].n;
}));
on('level-slider', 'input', e => { G.custom = +e.target.value; $('level-value').textContent = G.custom; });
const begin = mode => { AU.init(); G.mode = mode; G.level = 1; newGame(); };
on('start-solve-btn', 'click', () => begin('chase')); on('start-run-btn', 'click', () => begin('run'));
on('howtoplay-toggle', 'click', () => sh('howtoplay-overlay')); on('howtoplay-close-btn', 'click', () => hd('howtoplay-overlay'));
on('settings-toggle', 'click', () => { const p = $('settings-panel'); p.style.display = p.style.display === 'none' ? 'block' : 'none'; });
const setSens = v => { G.sens = +v; ['sens-slider', 'pause-sens-slider'].forEach(i => $(i).value = v); $('sens-value').textContent = v; $('pause-sens-value').textContent = v; };
on('sens-slider', 'input', e => setSens(e.target.value)); on('pause-sens-slider', 'input', e => setSens(e.target.value)); on('settings-reset-btn', 'click', () => setSens(4));
['pause-resume-btn', 'solver-resume-btn'].forEach(i => on(i, 'click', resume)); ['pause-menu-btn', 'solver-menu-btn', 'restart-btn'].forEach(i => on(i, 'click', menu));
on('pause-map-btn', 'click', () => { G.view = 'map'; resume(); });
on('next-level-btn', 'click', () => { G.level++; newGame(); }); ['pause-next-level-btn', 'solver-next-level-btn'].forEach(i => on(i, 'click', () => { G.level++; newGame(); }));
on('pause-btn', 'click', pause); on('dock-emp', 'click', emp); on('dock-decoy', 'click', decoy);
on('btn-sound', 'click', () => { const o = AU.toggle(); $('btn-sound').querySelector('.btn-label').textContent = 'AUDIO: ' + (o ? 'ON' : 'OFF'); });
const deck = () => $('cyber-deck').classList.toggle('open'); ['btn-deck-trigger', 'deck-pull-tab', 'btn-close-deck'].forEach(i => on(i, 'click', deck));
document.querySelectorAll('#algo-toggle-group button').forEach(b => b.addEventListener('click', () => { document.querySelectorAll('#algo-toggle-group button').forEach(x => x.classList.remove('active')); b.classList.add('active'); G.algo = b.dataset.algo; S.key = ''; }));
const sw = (id, key) => on(id, 'click', e => { G[key] = !G[key]; e.currentTarget.classList.toggle('active', G[key]); e.currentTarget.textContent = G[key] ? 'ON' : 'OFF'; S.key = ''; if (S.res) viz(S.res); });
sw('btn-toggle-vector', 'vec'); sw('btn-toggle-frontier', 'fro');

/* boot: menu shows an orbiting demo maze behind the overlay */
G.maze = MZ.generate(15, 15, .15); Object.assign(S, { px: 1, pz: 13, ex: 13, ez: 1, shards: 0, stun: 0, decoyT: 0, ring: 0, res: null }); build(); requestAnimationFrame(frame);
