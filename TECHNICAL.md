# 아크 제로 — 기술 설계 문서 (TECHNICAL.md)

## 렌더링 구조

Three.js 3D 배경 + HTML 2D UI 오버레이 방식.

```
┌─────────────────────────────────┐
│  Three.js 캔버스 (배경 전체)     │
│  ┌───────────────────────────┐  │
│  │  2D UI 오버레이 (HTML)    │  │
│  │  - 자원 패널              │  │
│  │  - 구역 현황              │  │
│  │  - 이벤트 창              │  │
│  │  - 버튼들                 │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

- Three.js 캔버스: `position: fixed`, `z-index: 0`
- HTML UI: `position: fixed`, `z-index: 10` 이상
- 둘은 완전히 분리. 서로 영향 없음

---

## 파일 구조

```
arc-zero/
├── index.html          # 진입점. UI 오버레이 포함
├── style.css           # UI 스타일
├── main.js             # 게임 로직 (턴, 자원, 이벤트)
├── three-scene.js      # Three.js 3D 배경 전담
├── ui.js               # UI 업데이트 전담
├── data/
│   ├── events.js       # 랜덤 인카운터 데이터
│   ├── buildings.js    # 건물 데이터
│   └── story.js        # 스토리 이벤트 데이터
└── CLAUDE.md           # 게임 설계 문서
```

---

## Three.js 장면 설계

### 메인 게임 화면

우주선 내부 단면도를 옆에서 바라보는 시점.

```javascript
// 카메라 설정
camera.position.set(0, 0, 80)
camera.fov = 60

// 배경색
scene.background = new THREE.Color(0x050a14)

// 안개 (깊이감)
scene.fog = new THREE.FogExp2(0x050a14, 0.008)
```

### 오브젝트 구성

복잡한 모델링 없이 Three.js 기본 도형만 사용.

| 오브젝트 | 도형 | 비고 |
|---------|------|------|
| 우주선 외관 | BoxGeometry + CylinderGeometry | 금속 질감 |
| 구역 모듈 | BoxGeometry | emissive 빛 발산 |
| 창문 | PlaneGeometry | 따뜻한 빛 |
| 별 배경 | Points (파티클 3000개) | 천천히 회전 |
| 엔진 불꽃 | ConeGeometry + 파티클 | 파란빛 glow |

### 구역별 조명

각 구역은 상태에 따라 빛 색상이 달라진다.

```javascript
const ZONE_LIGHT = {
  normal:     0xd4891a,  // 정상 — amber
  crisis:     0xc0392b,  // 위기 — 붉음
  succession: 0x2980b9,  // 승계 중 — 파랑
  offline:    0x1a2332,  // 꺼짐 — 어두움
  highlight:  0xf39c12,  // 선택됨 — 밝은 amber
}
```

### 씬별 카메라 연출

| 상황 | 카메라 동작 |
|------|-----------|
| 기본 게임 화면 | 고정 + 매우 느린 좌우 흔들림 (살아있는 느낌) |
| 이벤트 발생 | 해당 구역 쪽으로 0.5초간 살짝 이동 |
| 위기 이벤트 | 카메라 미세 흔들림 (shake) |
| 프롤로그 | 지구에서 멀어지는 방향으로 서서히 이동 |
| 엔딩 | 케플러 그린 방향으로 서서히 이동 |
| 승계 이벤트 | 승계실 구역 줌인 |

---

## 분위기 색상 팔레트

```css
/* 배경 */
--color-space:       #050a14;   /* 짙은 네이비 블랙 */
--color-hull:        #1a2332;   /* 차가운 금속 */

/* 구역 빛 */
--color-normal:      #d4891a;   /* 정상 — 따뜻한 amber */
--color-crisis:      #c0392b;   /* 위기 — 붉은 경고 */
--color-succession:  #2980b9;   /* 승계 — 차분한 파랑 */
--color-engine:      #4fc3f7;   /* 엔진 — 차가운 파란 불꽃 */

/* UI 오버레이 */
--ui-bg:             rgba(5, 10, 20, 0.85);
--ui-border:         #2e4057;
--ui-text:           #e8d5b7;   /* 따뜻한 크림 */
--ui-text-dim:       #8899aa;   /* 흐린 텍스트 */
--ui-accent:         #d4891a;   /* amber 강조 */
--ui-accent-danger:  #c0392b;   /* 위기 강조 */
--ui-accent-safe:    #27ae60;   /* 안전 강조 */
```

---

## UI 레이아웃

```
┌──────────┬──────────────────────┬──────────┐
│ 자원 패널 │     구역 맵 (중앙)    │ 인물 패널 │
│          │                      │          │
│ 인구      │   [3D 배경 위에]     │ 도율      │
│ 식량      │   구역 버튼들         │ 선우      │
│ 에너지    │   클릭 시 상세 정보   │ 하온 ...  │
│          │                      │          │
├──────────┴──────────────────────┴──────────┤
│              이벤트 / 메시지 창              │
│  [상황 텍스트]          [선택지 A] [B] [C]  │
├─────────────────────────────────────────────┤
│  턴: 47    [다음 턴]    목표: ___    항도: __ │
└─────────────────────────────────────────────┘
```

---

## 성능 관리 규칙

```javascript
// 반드시 지킬 것
- 그림자 렌더링 OFF          // renderer.shadowMap.enabled = false
- 폴리곤 수 최소화            // 단순 기하 도형만 사용
- 텍스처 최소화               // 색상(MeshLambertMaterial)으로 대체
- 별 파티클 3000개 이하
- 애니메이션 requestAnimationFrame 사용
- UI 업데이트와 3D 렌더링 완전 분리
- 목표 60fps, 하한선 30fps

// 피할 것
- PBR 머티리얼 (MeshStandardMaterial) 남용
- 복잡한 후처리 효과 (post-processing)
- 실시간 그림자
- 고해상도 텍스처
```

---

## 외부 라이브러리

```html
<!-- Three.js r128 (CDN) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
```

Three.js 외 추가 라이브러리 없음. 순수 JS로 나머지 처리.

---

## 개발 순서 권장

1. HTML/CSS UI 레이아웃 먼저 완성
2. 게임 로직 (자원, 턴, 이벤트) 구현
3. Three.js 배경 별도 파일로 추가
4. 두 레이어 연결 (이벤트 발생 시 3D 반응)

> 3D 배경은 게임 로직과 독립적이어야 한다.
> 3D가 없어도 게임이 돌아가야 한다.
> 3D는 분위기 레이어일 뿐이다.

---

## Three.js 기본 씬 셋업 (참고 코드)

```javascript
// three-scene.js

let scene, camera, renderer, stars

function initScene() {
  // 씬
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x050a14)
  scene.fog = new THREE.FogExp2(0x050a14, 0.008)

  // 카메라
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(0, 0, 80)

  // 렌더러
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = false
  document.body.appendChild(renderer.domElement)

  // 조명
  const ambient = new THREE.AmbientLight(0x111827, 0.5)
  scene.add(ambient)

  const mainLight = new THREE.PointLight(0xd4891a, 1.5, 200)
  mainLight.position.set(0, 20, 30)
  scene.add(mainLight)

  // 별 파티클
  createStars()

  // 우주선
  createShip()

  // 애니메이션 루프
  animate()
}

function createStars() {
  const geometry = new THREE.BufferGeometry()
  const positions = []
  for (let i = 0; i < 3000; i++) {
    positions.push(
      (Math.random() - 0.5) * 600,
      (Math.random() - 0.5) * 600,
      (Math.random() - 0.5) * 600
    )
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.3 })
  stars = new THREE.Points(geometry, material)
  scene.add(stars)
}

function animate() {
  requestAnimationFrame(animate)
  // 별 천천히 회전
  if (stars) stars.rotation.y += 0.0001
  renderer.render(scene, camera)
}

// 이벤트 발생 시 구역 빛 변경
function setZoneLight(zoneId, state) {
  const colors = {
    normal: 0xd4891a,
    crisis: 0xc0392b,
    succession: 0x2980b9,
    offline: 0x1a2332
  }
  const zone = scene.getObjectByName(`zone_${zoneId}`)
  if (zone) zone.material.emissive.setHex(colors[state] || colors.normal)
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
```
