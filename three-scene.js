'use strict';
// ═══════════════════════════════════════════════════
//  아크 제로 — Three.js 3D 배경 레이어
//  game.js 게임 로직과 완전히 분리.
//  3D 없이도 게임은 정상 동작한다.
// ═══════════════════════════════════════════════════

(function () {
  if (typeof THREE === 'undefined') {
    console.warn('[three-scene] Three.js 없음. 3D 배경 생략.');
    window.threeScene = null;
    return;
  }

  let scene, camera, renderer, stars, ship;
  let zoneModules = {};
  let clock;
  let camShake = 0;
  let camTargetX = 0;

  const ZONE_COLORS = {
    normal:     0xd4891a,
    crisis:     0xc0392b,
    succession: 0x2980b9,
    offline:    0x1a2332,
    highlight:  0xf39c12,
  };

  // ── 초기화 ───────────────────────────────────────
  function init() {
    clock = new THREE.Clock();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050a14);
    scene.fog = new THREE.FogExp2(0x050a14, 0.006);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 80);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;
    renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;z-index:0;pointer-events:none;';
    document.body.insertBefore(renderer.domElement, document.body.firstChild);

    // 조명
    scene.add(new THREE.AmbientLight(0x111827, 0.6));
    const mainLight = new THREE.PointLight(0xd4891a, 1.5, 200);
    mainLight.position.set(0, 20, 30);
    scene.add(mainLight);
    const backLight = new THREE.PointLight(0x2980b9, 0.8, 150);
    backLight.position.set(-60, -10, 10);
    scene.add(backLight);

    createStars();
    createShip();
    animate();

    window.addEventListener('resize', onResize);
  }

  // ── 별 파티클 ────────────────────────────────────
  function createStars() {
    const geo = new THREE.BufferGeometry();
    const pos = [];
    for (let i = 0; i < 3000; i++) {
      pos.push(
        (Math.random() - 0.5) * 600,
        (Math.random() - 0.5) * 600,
        (Math.random() - 0.5) * 600
      );
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.3, transparent: true, opacity: 0.7 });
    stars = new THREE.Points(geo, mat);
    scene.add(stars);
  }

  // ── 우주선 ──────────────────────────────────────
  function createShip() {
    ship = new THREE.Group();

    // 메인 선체
    const hullGeo = new THREE.BoxGeometry(88, 9, 7);
    const hullMat = new THREE.MeshLambertMaterial({ color: 0x1a2332 });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.z = -5;
    ship.add(hull);

    // 선수 원뿔
    const noseGeo = new THREE.CylinderGeometry(0, 4.5, 16, 8);
    const noseMat = new THREE.MeshLambertMaterial({ color: 0x243447 });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(52, 0, -5);
    nose.rotation.z = -Math.PI / 2;
    ship.add(nose);

    // 엔진 동체
    const engGeo = new THREE.CylinderGeometry(5, 3.5, 14, 8);
    const engMat = new THREE.MeshLambertMaterial({ color: 0x1a2a3a });
    const engBody = new THREE.Mesh(engGeo, engMat);
    engBody.position.set(-51, 0, -5);
    engBody.rotation.z = Math.PI / 2;
    ship.add(engBody);

    // 엔진 불꽃 (ConeGeometry)
    const glowGeo = new THREE.ConeGeometry(3.5, 22, 8, 1, true);
    const glowMat = new THREE.MeshLambertMaterial({
      color: 0x4fc3f7,
      emissive: 0x4fc3f7,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.set(-68, 0, -5);
    glow.rotation.z = Math.PI / 2;
    glow.name = 'engineGlow';
    ship.add(glow);

    // 엔진 링 파티클
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const pGeo = new THREE.SphereGeometry(0.3, 4, 4);
      const pMat = new THREE.MeshLambertMaterial({
        color: 0x4fc3f7, emissive: 0x4fc3f7, emissiveIntensity: 1,
        transparent: true, opacity: 0.6,
      });
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.set(-58 + Math.random() * 8, Math.cos(angle) * 3.5, -5 + Math.sin(angle) * 3.5);
      p.userData.baseX = p.position.x;
      p.name = `engParticle_${i}`;
      ship.add(p);
    }

    // 구역 모듈
    createZoneModules();

    ship.position.set(0, -12, 0);
    ship.rotation.x = 0.12;
    scene.add(ship);
  }

  // ── 구역 모듈 ────────────────────────────────────
  function createZoneModules() {
    const zones = [
      { id: 37, x: -34, y: 4.5, label: '37' },
      { id: 39, x: -18, y: 5,   label: '39' },
      { id: 40, x:  -2, y: 5.5, label: '40' },
      { id: 41, x:  14, y: 5,   label: '41' },
      { id: 44, x:  30, y: 4,   label: '44' },
    ];

    zones.forEach(z => {
      const geo = new THREE.BoxGeometry(10, 5, 5);
      const mat = new THREE.MeshLambertMaterial({
        color: 0x1e3a5f,
        emissive: ZONE_COLORS.normal,
        emissiveIntensity: 0.25,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(z.x, z.y, -3);
      mesh.name = `zone_${z.id}`;

      // 창문 격자
      for (let row = 0; row < 2; row++) {
        for (let col = -2; col <= 2; col++) {
          const wGeo = new THREE.PlaneGeometry(0.7, 0.7);
          const wMat = new THREE.MeshLambertMaterial({
            color: 0xffd9a0, emissive: 0xffd9a0, emissiveIntensity: 0.5,
          });
          const win = new THREE.Mesh(wGeo, wMat);
          win.position.set(col * 1.4, row * 1.2 - 0.5, 2.6);
          mesh.add(win);
        }
      }

      ship.add(mesh);
      zoneModules[z.id] = mesh;
    });
  }

  // ── 애니메이션 루프 ───────────────────────────────
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // 카메라 살아있는 느낌 (느린 흔들림)
    camera.position.x += (camTargetX + Math.sin(t * 0.13) * 1.8 - camera.position.x) * 0.025;
    camera.position.y += (Math.sin(t * 0.09) * 0.4 - camera.position.y) * 0.025;

    // 카메라 쉐이크
    if (camShake > 0) {
      camera.position.x += (Math.random() - 0.5) * camShake;
      camera.position.y += (Math.random() - 0.5) * camShake;
      camShake *= 0.88;
      if (camShake < 0.01) camShake = 0;
    }

    // 별 천천히 회전
    if (stars) stars.rotation.y += 0.0001;

    // 엔진 불꽃 맥동
    const glow = ship && ship.getObjectByName('engineGlow');
    if (glow) glow.material.emissiveIntensity = 0.6 + Math.sin(t * 1.8) * 0.25;

    // 엔진 파티클 흐름
    for (let i = 0; i < 20; i++) {
      const p = ship && ship.getObjectByName(`engParticle_${i}`);
      if (p) {
        p.position.x = p.userData.baseX - ((t * 5 + i * 2) % 12);
        p.material.opacity = 0.4 + Math.sin(t * 3 + i) * 0.3;
      }
    }

    renderer.render(scene, camera);
  }

  // ── 리사이즈 ─────────────────────────────────────
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ── Public API ───────────────────────────────────

  /** 구역 빛 상태 변경 */
  function setZoneLight(zoneId, state) {
    const mesh = zoneModules[zoneId];
    if (!mesh) return;
    const c = ZONE_COLORS[state] || ZONE_COLORS.normal;
    mesh.material.emissive.setHex(c);
    mesh.material.emissiveIntensity = state === 'highlight' ? 0.9 : state === 'offline' ? 0.05 : 0.4;
  }

  /** 카메라 쉐이크 (위기 이벤트) */
  function shake(intensity) {
    camShake = intensity || 0.5;
  }

  /** 카메라 살짝 이동 (이벤트 발생 구역 방향) */
  function focusZone(zoneId) {
    const mesh = zoneModules[zoneId];
    if (!mesh) return;
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    camTargetX = worldPos.x * 0.25;
    setTimeout(() => { camTargetX = 0; }, 2500);
  }

  /** 모든 플레이어 구역을 normal 상태로 초기화 */
  function resetZones() {
    Object.keys(zoneModules).forEach(id => setZoneLight(Number(id), 'normal'));
  }

  // ── 노출 ─────────────────────────────────────────
  window.threeScene = { init, setZoneLight, shake, focusZone, resetZones };

  // DOM 준비 후 자동 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
