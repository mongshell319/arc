'use strict';
// ═══════════════════════════════════════════════════
//  아크 제로 — 세대선  |  Arc Zero: Generation Ship
// ═══════════════════════════════════════════════════

// ─── 설정 ───────────────────────────────────────────
const C = {
  START_YEAR:  47,
  TURNS_PER_YEAR: 12,
  START_POP:   2400,
  START_FOOD:  170,
  START_ENERGY: 71,
  START_MORALE: 55,
  START_HANTO:  45,
  START_SUC_QUEUE: 38,
  ELITE_REL_START: 20,

  FOOD_CRISIS:   40,
  ENERGY_CRISIS: 20,
  POP_LOSE:      500,

  WIN_ZONES: 24,
  WIN_TURNS: 72,

  SUC_FOOD:   30,
  SUC_ENERGY: 20,
};

// ─── 건물 정의 ──────────────────────────────────────
// tier: 1=기본 / 2=발전형 / 3=고급형(잠금 해제 필요)
const BUILDINGS = {
  // ══ 식량 생산 T1→T2→T3 ═══════════════════════════
  farm:           { name:'농장',        icon:'🌾', tier:1, group:'food',
                    foodPerTurn:8, energyDrain:1,
                    buildCost:{food:20,energy:30},
                    desc:'식량+8/월 · 저렴하고 안정적 · [조합] 작업장과 함께면 +3',
                    prodDesc:'+8식량' },
  hydroponics:    { name:'수경 농장',   icon:'💧', tier:2, group:'food',
                    foodPerTurn:15, energyDrain:4,
                    buildCost:{food:35,energy:55},
                    desc:'식량+15/월, 에너지-4/월 · 농장 대비 1.9배 효율, 전력 4배 소모',
                    prodDesc:'+15식량/-4전력' },
  vertical_farm:  { name:'수직 농장',   icon:'🏗️', tier:3, group:'food',
                    foodPerTurn:26, energyDrain:9,
                    buildCost:{food:60,energy:100},
                    desc:'식량+26/월, 에너지-9/월 · 압도적 효율. 전력 끊기면 전체 손실',
                    prodDesc:'+26식량/-9전력', unlock:'vertFarm' },

  // ══ 에너지 T1→T2→T3 ════════════════════════════
  solar_array:    { name:'태양전지판', icon:'☀️', tier:1, group:'energy',
                    energyPerTurn:6,
                    buildCost:{food:5,energy:0},
                    desc:'에너지+6/월 · 건설비 거의 없음. 출력 낮음 · [조합] 발전소와 함께면 +2',
                    prodDesc:'+6에너지' },
  powerplant:     { name:'발전소',      icon:'⚡', tier:2, group:'energy',
                    energyPerTurn:13,
                    buildCost:{food:10,energy:0},
                    desc:'에너지+13/월 · 표준 발전. 유지비 없음 · [조합] 태양전지판과 함께면 +2',
                    prodDesc:'+13에너지' },
  fusion_reactor: { name:'핵융합로',    icon:'☢️', tier:3, group:'energy',
                    energyPerTurn:26, foodDrain:2,
                    buildCost:{food:25,energy:110},
                    desc:'에너지+26/월, 식량-2/월(연료 소모) · 발전소의 2배. 연료 없으면 셧다운',
                    prodDesc:'+26에너지/-2식량', unlock:'fusion' },

  // ══ 주거·복지 T1→T2→T3 ════════════════════════
  housing:        { name:'주거 구역',   icon:'🏠', tier:1, group:'housing',
                    moraleBonus:2,
                    buildCost:{food:15,energy:20},
                    desc:'사기+2 (설치 즉시) · 빠르고 저렴. 지속 효과 없음',
                    prodDesc:'+2사기(즉시)' },
  welfare_center: { name:'복지 센터',   icon:'🏛️', tier:2, group:'housing',
                    moralePerTurn:2, hantoPerTurn:1,
                    buildCost:{food:28,energy:32},
                    desc:'사기+2/월, 항도+1/월 · 지속 효과. 주거 구역보다 운영비 높음',
                    prodDesc:'+2사기/월 +1항도' },
  community_hub:  { name:'공동체 허브', icon:'🌟', tier:3, group:'housing',
                    moralePerTurn:3, hantoPerTurn:2, popGrowthBonus:1,
                    buildCost:{food:45,energy:50},
                    desc:'사기+3/월, 항도+2/월, 인구+1/4턴 · 공동체의 구심점. 건설·운영비 모두 비쌈',
                    prodDesc:'+3사기 +2항도/월', unlock:'communityHub' },

  // ══ 문화·정신 T1→T2→T3 (+방송탑 분기) ════════
  meditation:     { name:'명상원',      icon:'🪷', tier:1, group:'culture',
                    hantoPerTurn:3, moralePerTurn:-1,
                    buildCost:{food:12,energy:10},
                    desc:'항도+3/월, 사기-1/월 · 내면 집중. 생산성 저하 · [조합] 문화 구역과 함께면 항도+2',
                    prodDesc:'+3항도/-1사기' },
  cultural_center:{ name:'문화 구역',   icon:'🎭', tier:2, group:'culture',
                    moralePerTurn:2, hantoPerTurn:2,
                    buildCost:{food:15,energy:18},
                    desc:'사기+2/월, 항도+2/월 · 균형형 · [조합] 명상원+2항도 / 방송탑 충돌',
                    prodDesc:'+2사기/+2항도' },
  hanto_temple:   { name:'항도 성전',   icon:'⛩️', tier:3, group:'culture',
                    moralePerTurn:3, hantoPerTurn:5, energyDrain:3,
                    buildCost:{food:35,energy:55},
                    desc:'항도+5/월, 사기+3/월, 에너지-3/월 · 정신적 구심점. 믿지 않는 사람엔 부담',
                    prodDesc:'+5항도/+3사기', unlock:'hantoTemple' },
  propaganda:     { name:'방송탑',      icon:'📢', tier:2, group:'culture',
                    moralePerTurn:3, hantoPerTurn:-2,
                    buildCost:{food:8,energy:20},
                    desc:'사기+3/월, 항도-2/월 · 선전 효과 강력. 항도를 갉아먹음 · [충돌] 문화 구역',
                    prodDesc:'+3사기/-2항도' },

  // ══ 기술·승계 T1→T2→T3 ════════════════════════
  workshop:       { name:'기술 작업장', icon:'🔧', tier:1, group:'tech',
                    repairBonus:5, energyDrain:2,
                    buildCost:{food:10,energy:25},
                    desc:'수리 효율+5%, 에너지-2/월 · [조합] 농장류와 함께면 식량+3',
                    prodDesc:'수리+5%' },
  research_lab:   { name:'연구소',      icon:'🔬', tier:2, group:'tech',
                    repairBonus:12, sucBonus:6, energyDrain:3,
                    buildCost:{food:22,energy:42},
                    desc:'수리+12%, 승계+6%, 에너지-3/월 · 작업장보다 범용적이고 효율적',
                    prodDesc:'수리+12%/승계+6%' },
  succession_lab: { name:'승계 실험실', icon:'🧬', tier:3, group:'tech',
                    sucBonus:20, energyDrain:4,
                    buildCost:{food:28,energy:60},
                    desc:'승계+20%, 에너지-4/월 · 승계 전용 최고급 시설. 다른 용도로 못 씀',
                    prodDesc:'승계+20%', unlock:'sucLabUnlocked' },

  // ══ 독립 특수 시설 ════════════════════════════
  clinic:         { name:'의무실',      icon:'🏥', tier:2, group:'misc',
                    sucBonus:8, popGrowthBonus:1,
                    buildCost:{food:25,energy:20},
                    desc:'승계+8%, 인구+1/4턴 · 의료와 승계를 병행. 소모품 공급 필요',
                    prodDesc:'승계+8%/인구↑' },
  barracks:       { name:'방위대',      icon:'🛡️', tier:1, group:'misc',
                    defenseBonus:30, energyDrain:2,
                    buildCost:{food:15,energy:30},
                    desc:'탈환 저항+30%, 에너지-2/월 · 감시가 일상이 되면 사람이 달라진다',
                    prodDesc:'방어+30%' },
  trading_post:   { name:'교역소',      icon:'🔄', tier:1, group:'misc',
                    tradeEnabled:true, energyDrain:1, expandBonus:0.10,
                    buildCost:{food:15,energy:25},
                    desc:'중립 구역 병합+10%, 에너지-1/월 · 자원 교역 가능',
                    prodDesc:'병합↑·교역' },
};

// ─── 건물 카테고리 (빌드 메뉴 표시 순서) ────────────
const BUILDING_GROUPS = [
  { label:'🌾 식량 생산', ids:['farm','hydroponics','vertical_farm'] },
  { label:'⚡ 에너지',    ids:['solar_array','powerplant','fusion_reactor'] },
  { label:'🏠 주거·복지', ids:['housing','welfare_center','community_hub'] },
  { label:'🎭 문화·정신', ids:['meditation','cultural_center','hanto_temple','propaganda'] },
  { label:'🔧 기술·승계', ids:['workshop','research_lab','succession_lab'] },
  { label:'⚙️ 특수 시설', ids:['clinic','barracks','trading_post'] },
];

// ─── 정책 정의 ──────────────────────────────────────
const POLICIES = {
  foodRation:     { name: '배급 통제',   icon: '🌾', desc: '식량 소비 -1/월, 사기 -1/월',         deltaFood: 1,   deltaMorale: -1 },
  energySave:     { name: '에너지 절약', icon: '⚡', desc: '에너지 +3/월, 사기 -1/월',            deltaEnergy: 3,  deltaMorale: -1 },
  openCulture:    { name: '문화 개방',   icon: '🎭', desc: '항도 +3/월, 에너지 -2/월',            deltaHanto: 3,  deltaEnergy: -2 },
  sucFocus:       { name: '승계 우선',   icon: '🔬', desc: '승계 성공률 +15%',                    sucBonus: 0.15 },
  expansion:      { name: '확장 집중',   icon: '📡', desc: '병합 성공률 +15%',                   expandBonus: 0.15 },
  securityFocus:  { name: '치안 강화',   icon: '🛡️', desc: '구역 탈환 저항 +10%, 사기 -2/월',    deltaMorale: -2, securityBonus: 0.10 },
  techFocus:      { name: '기술 집중',   icon: '🔩', desc: '수리 효율 +15%, 에너지 -2/월',        repairBonus: 0.15, deltaEnergy: -2 },
};

// ─── 구역 유형별 최대 슬롯 ───────────────────────────
const TYPE_SLOTS = { food: 3, power: 2, housing: 4, tech: 3, culture: 3 };

// ─── 게임 상태 ──────────────────────────────────────
let S = {};

function newGame() {
  S = {
    turn: 0,
    phase: 'running',
    res: {
      food:   C.START_FOOD,
      energy: C.START_ENERGY,
      pop:    C.START_POP,
      morale: C.START_MORALE,
      hanto:  C.START_HANTO,
    },
    zones: buildZones(),
    sucQueue: C.START_SUC_QUEUE,
    flags: {
      storyStage: 0, eliteRel: C.ELITE_REL_START,
      doyulRel: 50,      // 도율 관계
      seonuRel: 30,      // 선우 관계
      eumRel: 40,        // 이음 관계
      haonRel: 35,       // 하온 관계
      byeolRel: 20,      // 별 관계
      kangmuRel: 40,     // 강무 관계
      elderRel: 60,      // 오래된 자 관계
      byeolSecretClues: 0, // 별의 비밀 단서
    },
    policies: { foodRation: false, energySave: false, openCulture: false, sucFocus: false, expansion: false, securityFocus: false, techFocus: false },
    systems: { sucBasic: true, hanto: false, zoneMerge: false, sucAdvanced: false, eliteRelations: false, sucLabUnlocked: false, vertFarm: false, fusion: false, hantoTemple: false, communityHub: false },
    log: [],
    pending: [],
    curEvent: null,
    stats: { sucOk: 0, sucFail: 0, expanded: 0, turns: 0 },
    selected: null,
    buildMenuOpen: null,
  };
  updateZoneCounts();
}

// ─── 구역 데이터 ────────────────────────────────────
function buildZones() {
  // 자치 구역 5개 — 엔진부 (설계 문서 기준)
  const player = [
    { id:37, name:'37구역', type:'power',   owner:'player', cond:71, fac:['powerplant'],          pop:480, desc:'발전 구역. 출력 71%, 에너지 여유 없음.' },
    { id:39, name:'39구역', type:'tech',    owner:'player', cond:95, fac:['workshop'],             pop:460, desc:'기술 구역. 새하의 본거지. 설계도 보관.', special:'design_docs' },
    { id:40, name:'40구역', type:'housing', owner:'player', cond:78, fac:['housing','housing'],    pop:620, desc:'주거 구역. 인구 과밀 상태.' },
    { id:41, name:'41구역', type:'food',    owner:'player', cond:62, fac:['farm'],                 pop:520, desc:'식량 구역. 수율 62%, 설비 노후화.', special:'hidden_farm' },
    { id:44, name:'44구역', type:'culture', owner:'player', cond:55, fac:['cultural_center'],      pop:320, desc:'문화 구역. 부분 가동. 항도 거점.', special:'elder_base' },
  ].map(z => ({ ...z, slots: TYPE_SLOTS[z.type] || 3 }));

  // 중립 구역 21개
  const neutral = [
    { id: 9, name: '9구역',  type:'housing', cond:82, pop:280, desc:'의료 본원. 중립 지역.' },
    { id:12, name:'12구역', type:'housing', cond:75, pop:200, desc:'일반 행정 창구. 기득권 행정에 지쳐있음.' },
    { id:13, name:'13구역', type:'housing', cond:70, pop:380, desc:'함수부 외층 주거.' },
    { id:14, name:'14구역', type:'housing', cond:65, pop:350, desc:'함수부 외층 주거. 식량 배급 불균등.' },
    { id:15, name:'15구역', type:'food',    cond:80, pop:120, desc:'창고 구역. 자급자족 유지 중.' },
    { id:16, name:'16구역', type:'housing', cond:72, pop:190, desc:'의료 분원. 기득권 지원 끊긴 상태.' },
    { id:24, name:'24구역', type:'housing', cond:78, pop:420, desc:'중간부 중층 주거. 식량 부족 문제 있음.' },
    { id:25, name:'25구역', type:'housing', cond:74, pop:390, desc:'중간부 중층 주거. 항도 신자가 많음.' },
    { id:26, name:'26구역', type:'culture', cond:60, pop:150, desc:'문화 광장. 반란 이후 집회 금지됨.' },
    { id:27, name:'27구역', type:'tech',    cond:68, pop:180, desc:'교육 시설. 자원 부족으로 일부 폐쇄.' },
    { id:28, name:'28구역', type:'housing', cond:73, pop:210, desc:'의료 분원. 약품 부족.' },
    { id:29, name:'29구역', type:'culture', cond:65, pop:130, desc:'항도 본원. 오래된 자의 핵심 거점.' },
    { id:30, name:'30구역', type:'tech',    cond:55, pop:90,  desc:'소형 승계실 A. 자원 부족으로 대기 길어짐.' },
    { id:31, name:'31구역', type:'food',    cond:58, pop:140, desc:'창고. 설비 불안정.' },
    { id:32, name:'32구역', type:'housing', cond:77, pop:360, desc:'외곽 주거. 승계 거부자 일부 거주.' },
    { id:33, name:'33구역', type:'tech',    cond:82, pop:160, desc:'소규모 공방. 자치 구역과 비공식 교류 있음.' },
    { id:42, name:'42구역', type:'tech',    cond:60, pop:85,  desc:'소형 승계실 B. 이음단 운영.' },
    { id:43, name:'43구역', type:'housing', cond:75, pop:230, desc:'의료실. 자치 구역 인근.' },
    { id:45, name:'45구역', type:'housing', cond:70, pop:300, desc:'엔진부 외층 주거. 자치 구역 인접.' },
    { id:46, name:'46구역', type:'power',   cond:50, pop:80,  desc:'폐기물 처리. 설비 노후 심각.' },
    { id:47, name:'47구역', type:'tech',    cond:85, pop:60,  desc:'관측 구역. 케플러 그린 탐사 데이터 보관.', special:'observatory' },
  ].map(z => ({ ...z, fac:[], slots: TYPE_SLOTS[z.type] || 3, owner:'neutral' }));

  // 기득권 구역 21개 — 함수부·중간부 심층 중심
  const enemy = [
    { id: 1, name: '1구역',  type:'tech',    cond:90, pop:50,  desc:'항법 중추. 접근 엄격 통제.' },
    { id: 2, name: '2구역',  type:'housing', cond:88, pop:120, desc:'운영위원회 청사. 반란 이후 보안 강화.' },
    { id: 3, name: '3구역',  type:'tech',    cond:85, pop:80,  desc:'중앙 승계실. 기득권 우선 배정.' },
    { id: 4, name: '4구역',  type:'housing', cond:82, pop:150, desc:'보안 사령부. 무경이 관할.' },
    { id: 5, name: '5구역',  type:'tech',    cond:80, pop:60,  desc:'기록 보존실. 아크 제로의 역사 보관.' },
    { id: 6, name: '6구역',  type:'tech',    cond:70, pop:0,   desc:'봉인 구역. 공식 문서에 없다.', special:'sealed' },
    { id: 7, name: '7구역',  type:'housing', cond:78, pop:200, desc:'행정 지원. 기득권 하부 조직.' },
    { id: 8, name: '8구역',  type:'tech',    cond:83, pop:70,  desc:'통신 중계실. 소이가 관리.' },
    { id:10, name:'10구역', type:'tech',    cond:88, pop:100, desc:'이음단 본원. 승계사 집단 거점.' },
    { id:11, name:'11구역', type:'housing', cond:92, pop:80,  desc:'귀빈 주거. 기득권 고위직 거주.' },
    { id:17, name:'17구역', type:'power',   cond:85, pop:120, desc:'중앙 발전소. 아크 제로 전력의 60% 공급.' },
    { id:18, name:'18구역', type:'power',   cond:80, pop:90,  desc:'에너지 분배 제어실. 태린이 통제.' },
    { id:19, name:'19구역', type:'food',    cond:75, pop:110, desc:'중앙 식량 저장고. 반란의 불씨가 된 곳.' },
    { id:20, name:'20구역', type:'power',   cond:82, pop:70,  desc:'수처리 시설. 전체 음수 공급.' },
    { id:21, name:'21구역', type:'food',    cond:78, pop:130, desc:'중앙 물류 허브. 자원 분배 통제.' },
    { id:22, name:'22구역', type:'food',    cond:80, pop:200, desc:'제1 농장. 기득권 직할 관리.' },
    { id:23, name:'23구역', type:'food',    cond:77, pop:195, desc:'제2 농장. 반란 이후 생산량 감소.' },
    { id:34, name:'34구역', type:'power',   cond:88, pop:150, desc:'주 엔진실. 아크 제로 항법 핵심.' },
    { id:35, name:'35구역', type:'power',   cond:82, pop:120, desc:'보조 엔진실. 자치 구역과 인접.' },
    { id:36, name:'36구역', type:'tech',    cond:85, pop:100, desc:'기술 연구소. 기득권 핵심 인재.' },
    { id:38, name:'38구역', type:'tech',    cond:79, pop:80,  desc:'핵심 부품 창고. 접근 통제.' },
  ].map(z => ({ ...z, fac:[], slots: TYPE_SLOTS[z.type] || 3, owner:'enemy' }));

  return [...player, ...neutral, ...enemy];
}

// ─── 자원 계산 ──────────────────────────────────────
function calcDelta() {
  const myZones = S.zones.filter(z => z.owner === 'player');
  let foodProd = 0, energyProd = 0, energyDrain = myZones.length * 2;
  let moraleDelta = 0, hantoDelta = 0;

  myZones.forEach(z => {
    const eff = z.cond / 100;
    (z.fac || []).forEach(fid => {
      const b = BUILDINGS[fid];
      if (!b) return;
      if (b.foodPerTurn)   foodProd    += b.foodPerTurn   * eff;
      if (b.energyPerTurn) energyProd  += b.energyPerTurn * eff;
      if (b.energyDrain)   energyDrain += b.energyDrain;
      if (b.foodDrain)     foodProd    -= b.foodDrain;          // 핵융합로 연료 소모
      if (b.moralePerTurn) moraleDelta += b.moralePerTurn;
      if (b.hantoPerTurn)  hantoDelta  += b.hantoPerTurn;
    });

    // ── 콤보 보너스: 같은 구역 내 건물 시너지 ──
    const fac = z.fac || [];
    const hasFarm    = fac.some(f => f === 'farm' || f === 'hydroponics');
    const hasWork    = fac.includes('workshop');
    const hasCulture = fac.includes('cultural_center');
    const hasMedit   = fac.includes('meditation');
    const hasPower   = fac.includes('powerplant');
    const hasSolar   = fac.includes('solar_array');
    const hasPropag  = fac.includes('propaganda');
    if (hasFarm && hasWork)       foodProd   += 3;   // 효율적 유지보수
    if (hasCulture && hasMedit)   hantoDelta += 2;   // 문화·명상 시너지
    if (hasPower && hasSolar)     energyProd += 2;   // 전력망 안정화
    if (hasPropag && hasCulture) { moraleDelta -= 1; hantoDelta -= 1; } // 선전과 문화의 충돌
  });

  const foodCon = Math.ceil(S.res.pop / 200);
  const energyPenalty = S.flags.energyPenalty || 0;

  if (S.res.food   < C.FOOD_CRISIS)   { moraleDelta -= 2; hantoDelta -= 1; }
  else if (S.res.food > 120)            moraleDelta += 1;
  if (S.res.energy < C.ENERGY_CRISIS) { moraleDelta -= 2; hantoDelta -= 1; }
  if (S.res.morale > 70) moraleDelta -= 1;
  if (S.res.morale < 30) moraleDelta += 1;
  if (S.res.hanto  > 70) hantoDelta  -= 1;
  if (S.res.hanto  < 25) hantoDelta  += 1;

  // 정책 효과 적용
  let pFoodDelta = 0, pEnergyDelta = 0, pMoraleDelta = 0, pHantoDelta = 0;
  Object.entries(S.policies).forEach(([pid, on]) => {
    if (!on) return;
    const p = POLICIES[pid];
    if (p.deltaFood)   pFoodDelta   += p.deltaFood;
    if (p.deltaEnergy) pEnergyDelta += p.deltaEnergy;
    if (p.deltaMorale) pMoraleDelta += p.deltaMorale;
    if (p.deltaHanto)  pHantoDelta  += p.deltaHanto;
  });

  return {
    food:   Math.floor(foodProd) - foodCon + pFoodDelta,
    energy: Math.floor(energyProd) - energyDrain - energyPenalty + pEnergyDelta,
    morale: moraleDelta + pMoraleDelta,
    hanto:  hantoDelta  + pHantoDelta,
  };
}

// ─── 턴 진행 ────────────────────────────────────────
function nextTurn() {
  if (S.phase !== 'running') return;

  S.turn++;
  S.stats.turns++;

  const d = calcDelta();
  S.res.food   = Math.max(0, S.res.food   + d.food);
  S.res.energy = Math.max(0, Math.min(100, S.res.energy + d.energy));
  S.res.morale = Math.max(0, Math.min(100, S.res.morale + d.morale));
  S.res.hanto  = Math.max(0, Math.min(100, S.res.hanto  + d.hanto));

  // 3D: 구역 빛 상태 갱신
  if (window.threeScene) {
    const ts = window.threeScene;
    const playerZones = S.zones.filter(z => z.owner === 'player');
    playerZones.forEach(z => {
      const state = z.cond < 35 ? 'offline'
                  : (S.res.food < C.FOOD_CRISIS || S.res.energy < C.ENERGY_CRISIS) ? 'crisis'
                  : 'normal';
      ts.setZoneLight(z.id, state);
    });
    // 식량/에너지 위기 시 카메라 쉐이크
    if (S.res.food < C.FOOD_CRISIS || S.res.energy < C.ENERGY_CRISIS) ts.shake(0.2);
  }

  // 에너지 패널티 감소
  if (S.flags.energyPenalty > 0) S.flags.energyPenalty = Math.max(0, S.flags.energyPenalty - 3);

  // 구역 자연 노후화
  S.zones.filter(z => z.owner === 'player').forEach(z => {
    z.cond = Math.max(20, z.cond - 0.4);
  });

  // 승계 대기자 자연 증가
  if (S.turn % 4 === 0) S.sucQueue += Math.floor(S.res.pop / 600);

  // 인구 자연증가 (의무실·공동체 허브)
  if (S.turn % 4 === 0) {
    const allFac2 = S.zones.filter(z => z.owner === 'player').flatMap(z => z.fac);
    const popGain = allFac2.filter(f => f === 'clinic').length + allFac2.filter(f => f === 'community_hub').length;
    if (popGain > 0) {
      S.res.pop += popGain;
      addLog(`인구 자연증가 +${popGain}명 (의무실·공동체 허브).`);
    }
  }

  // 기술 발견 보상 지연 처리
  if (S.flags.techDiscovery && S.turn >= S.flags.techDiscovery) {
    S.res.food   += 15;
    S.res.energy += 10;
    S.flags.techDiscovery = null;
    addLog('기술 분석 완료. 식량 +15, 에너지 +10.');
    notify('기술 발견 보상 적용!', 'success');
  }

  // 기득권 반격 (구역 8개 이상, 기득권 관계 불량, 3턴 쿨)
  const ownedCount = S.zones.filter(z => z.owner === 'player').length;
  if (ownedCount >= 8 && S.flags.eliteRel < 45 && !S.flags.cd_eliteCounter && Math.random() < 0.25) {
    const vulnerable = S.zones.filter(z => z.owner === 'player' && !(z.fac || []).includes('barracks'));
    if (vulnerable.length > 0) {
      const target = vulnerable[Math.floor(Math.random() * vulnerable.length)];
      const resist = (S.policies.securityFocus ? 0.10 : 0) + ((target.fac || []).includes('barracks') ? 0.30 : 0);
      if (Math.random() > resist) {
        target.cond = Math.max(20, target.cond - 18);
        addLog(`⚠ 기득권이 ${target.name} 설비를 방해했다. 상태 악화.`);
        notify(`${target.name}이 기득권의 방해를 받았습니다.`, 'warning');
        S.flags.cd_eliteCounter = S.turn + 3;
      }
    }
  }

  // 스토리 단계 갱신
  const owned = S.zones.filter(z => z.owner === 'player').length;
  if (owned >= 8  && S.flags.storyStage < 1) S.flags.storyStage = 1;
  if (owned >= 14 && S.flags.storyStage < 2) S.flags.storyStage = 2;
  if (owned >= 20 && S.flags.storyStage < 3) S.flags.storyStage = 3;

  // 고급 건물 잠금 해제
  if (S.flags.storyStage >= 1 && !S.systems.vertFarm)    { S.systems.vertFarm    = true; notify('🏗️ 수직 농장 기술 해제!', 'success'); }
  if (S.flags.storyStage >= 1 && !S.systems.sucLabUnlocked) { S.systems.sucLabUnlocked = true; notify('🧬 승계 실험실 기술 해제!', 'success'); }
  if (S.flags.storyStage >= 2 && !S.systems.communityHub) { S.systems.communityHub = true; notify('🌟 공동체 허브 기술 해제!', 'success'); }
  if (S.flags.elderLastDone   && !S.systems.hantoTemple)  { S.systems.hantoTemple = true; notify('⛩️ 항도 성전 건설 가능!', 'success'); }
  if (S.flags.storyStage >= 3 && !S.systems.fusion)       { S.systems.fusion       = true; notify('☢️ 핵융합로 기술 해제!', 'success'); }

  // 스토리 이벤트 체크
  STORY_EVENTS.forEach(ev => {
    if (!S.flags['done_' + ev.id] && ev.trigger(S)) {
      S.pending.push(ev);
      S.flags['done_' + ev.id] = true;
    }
  });

  // 랜덤 이벤트 (35% 확률)
  if (S.pending.length === 0 && Math.random() < 0.35) {
    const eligible = RANDOM_EVENTS.filter(ev =>
      !S.flags['cd_' + ev.id] && ev.condition(S)
    );
    if (eligible.length > 0) {
      const w = eligible.map(e => e.weight);
      const total = w.reduce((a,b) => a+b, 0);
      let r = Math.random() * total;
      for (let i = 0; i < eligible.length; i++) {
        r -= eligible[i].weight;
        if (r <= 0) {
          S.pending.push(eligible[i]);
          S.flags['cd_' + eligible[i].id] = S.turn + 6;
          break;
        }
      }
    }
  }

  // 이벤트 쿨다운 정리
  Object.keys(S.flags).forEach(k => {
    if (k.startsWith('cd_') && S.flags[k] <= S.turn) delete S.flags[k];
  });

  // 게임오버 체크
  const go = checkGameOver();
  if (go) { showEnd(go); return; }

  // 이벤트 처리 or 렌더
  if (S.pending.length > 0) {
    showEvent(S.pending.shift());
  } else {
    render();
  }
}

function checkGameOver() {
  if (S.res.pop    < C.POP_LOSE) return { type:'lose', title:'항해가 멈췄다', msg:'인구가 너무 줄었다. 아크 제로는 더 이상 나아갈 수 없다.' };
  if (S.res.food   <= 0)         return { type:'lose', title:'기아',          msg:'식량이 바닥났다. 우주선 안에서 굶는 것. 이것이 끝이었다.' };
  if (S.res.energy <= 0)         return { type:'lose', title:'블랙아웃',      msg:'우주선의 불이 꺼졌다. 어둠 속에서, 모든 것이 멈췄다.' };

  const owned = S.zones.filter(z => z.owner === 'player').length;
  const sucSuffix = S.flags.saehaSuccession === 'will'
    ? '\n\n새하는 그 날을 볼 것이다.'
    : S.flags.saehaSuccession === 'refuse'
    ? '\n\n새하는 그 날을 보지 못할 수도 있다. 하지만 사람들은 볼 것이다.'
    : '';

  // ── 숨겨진 엔딩 ──────────────────────────────────
  // 항도 엔딩: 항도 75 이상, 15구역 이상, 스토리 3단계
  if (S.res.hanto >= 75 && owned >= 15 && S.flags.storyStage >= 3 && !S.flags._endingHanto) {
    S.flags._endingHanto = true;
    return {
      type: 'win', title: '항도의 시대',
      msg: `항도는 신앙이 아니었다.\n\n길을 잃지 않으려는 방식. 기억이 끊기는 우주에서 스스로를 잃지 않으려는 방식.\n\n새하는 그것을 이해했다. 처음엔 몰랐지만 — 지금은 안다.\n\n아크 제로가 케플러 그린을 향해 날아간다.${sucSuffix}`,
    };
  }
  // 통합 엔딩: 기득권 관계 70 이상, 12구역 이상
  if (S.flags.eliteRel >= 70 && owned >= 12 && !S.flags._endingUnion) {
    S.flags._endingUnion = true;
    return {
      type: 'win', title: '통합',
      msg: `기득권과 자치 구역이 처음으로 같은 테이블에 앉았다.\n\n완전한 승리는 아니었다. 완전한 패배도 아니었다.\n\n아크 제로 안의 모든 사람이 같은 목적지를 향하고 있다.\n\n그것으로 충분했다.${sucSuffix}`,
    };
  }
  // 승계 완성 엔딩: 누적 승계 성공 50명 이상, 인구 3000 이상
  if (S.stats.sucOk >= 50 && S.res.pop >= 3000 && !S.flags._endingSuc) {
    S.flags._endingSuc = true;
    return {
      type: 'win', title: '기억이 이어지다',
      msg: `50명이 넘는 사람들의 기억이 끊기지 않았다.\n\n승계는 죽음이 아니다. 이어짐이다.\n\n아크 제로 안에서, 세대가 겹쳐지며 살아간다.\n\n케플러 그린은 이 사람들이 만든 역사를 가지게 될 것이다.${sucSuffix}`,
    };
  }
  // ─────────────────────────────────────────────────
  if (owned >= C.WIN_ZONES) return { type:'win', title:'아크 제로를 되찾다', msg:`새하의 자치 구역이 아크 제로의 절반 이상을 포괄하게 됐다.\n\n기득권은 협상 테이블로 돌아왔다.\n우주선은 계속 날아간다.\n\n케플러 그린이 가까워지고 있다.${sucSuffix}` };
  if (S.turn >= C.WIN_TURNS) return { type:'win', title:'항해는 계속된다',   msg:`${C.WIN_TURNS}달. 새하는 버텼다.\n\n자치 구역은 살아있다. 아크 제로는 오늘도 날아가고 있다.\n\n케플러 그린이 조금 더 가까워졌다.${sucSuffix}` };

  return null;
}

// ─── 승계 시스템 ────────────────────────────────────
function doSuccession() {
  if (S.sucQueue <= 0) { notify('승계 대기자가 없습니다.'); return; }
  if (S.res.food < C.SUC_FOOD || S.res.energy < C.SUC_ENERGY) {
    notify(`자원 부족 (필요: 식량 ${C.SUC_FOOD}, 에너지 ${C.SUC_ENERGY})`, 'error'); return;
  }

  S.res.food   -= C.SUC_FOOD;
  S.res.energy -= C.SUC_ENERGY;

  const allFac = S.zones.filter(z => z.owner === 'player').flatMap(z => z.fac);
  const sucBonus = (S.policies.sucFocus ? 0.15 : 0)
    + allFac.filter(f => f === 'succession_lab').length * 0.15  // T3: +15%
    + allFac.filter(f => f === 'research_lab').length   * 0.06  // T2: +6%
    + allFac.filter(f => f === 'clinic').length          * 0.08; // misc: +8%
  const successRate = Math.min(0.95, (S.res.food / 250) * 0.5 + (S.res.energy / 100) * 0.5 + sucBonus);
  const count = Math.min(3, S.sucQueue);
  let ok = 0, fail = 0;
  for (let i = 0; i < count; i++) {
    (Math.random() < successRate) ? ok++ : fail++;
  }

  S.sucQueue -= count;
  S.res.pop  += ok;
  S.stats.sucOk   += ok;
  S.stats.sucFail += fail;

  // 3D: 승계 구역(42, 39) 파란빛
  if (window.threeScene) {
    window.threeScene.setZoneLight(39, 'succession');
    setTimeout(() => window.threeScene && window.threeScene.setZoneLight(39, 'normal'), 3000);
  }

  if (fail > 0) {
    S.res.morale -= fail * 3;
    addLog(`승계 시행: ${ok}명 성공, ${fail}명 기억 일부 손실.`);
    notify(`${ok}명 이어짐. ${fail}명의 직전 기억이 흐려졌습니다.`, 'warning');
    if (window.threeScene) window.threeScene.shake(0.3);
  } else {
    S.res.morale += 2;
    addLog(`승계 시행: ${ok}명 성공. 항해가 이어집니다.`);
    notify(`${ok}명이 성공적으로 이어졌습니다.`, 'success');
  }
  render();
}

// ─── 구역 행동 ──────────────────────────────────────
function repairZone(zoneId) {
  const z = S.zones.find(z => z.id === zoneId);
  if (!z || z.owner !== 'player') return;
  if (S.res.food < 10 || S.res.energy < 20) { notify('자원 부족 (식량 10, 에너지 20)', 'error'); return; }

  S.res.food   -= 10;
  S.res.energy -= 20;
  const repairExtra = (S.policies.techFocus ? 15 * 0.15 : 0) +
    ((z.fac || []).includes('workshop') ? 15 * 0.05 : 0);
  z.cond = Math.min(100, z.cond + 15 + Math.round(repairExtra));
  addLog(`${z.name} 수리 완료. 상태 ${Math.round(z.cond)}%.`);
  if (window.threeScene) {
    window.threeScene.setZoneLight(z.id, 'highlight');
    setTimeout(() => window.threeScene && window.threeScene.setZoneLight(z.id, 'normal'), 1500);
  }
  render();
}

function expandZone(zoneId) {
  const z = S.zones.find(z => z.id === zoneId);
  if (!z || z.owner !== 'neutral') return;
  if (S.res.food < 40) { notify('식량 부족 (필요: 40)', 'error'); return; }

  const hasTradingPost = S.zones.filter(z => z.owner === 'player').flatMap(z => z.fac).includes('trading_post');
  const expandBonus = (S.policies.expansion ? 0.15 : 0) + (hasTradingPost ? 0.10 : 0);
  const rate = 0.35 + (S.res.morale / 200) + expandBonus;
  if (Math.random() < rate) {
    S.res.food -= 40;
    z.owner = 'player';
    S.stats.expanded++;
    updateZoneCounts();
    addLog(`${z.name} 병합 성공. 자치 구역 확장.`);
    notify(`${z.name}이 자치 구역에 합류했습니다.`, 'success');
    if (window.threeScene) {
      window.threeScene.setZoneLight(z.id, 'highlight');
      setTimeout(() => window.threeScene && window.threeScene.setZoneLight(z.id, 'normal'), 2500);
    }
  } else {
    S.res.food -= 20;
    addLog(`${z.name} 협상 실패. 식량 일부 소비.`);
    notify('협상이 결렬됐습니다.', 'warning');
  }
  render();
}

// ─── 건물 건설 / 해체 ────────────────────────────────
function buildInZone(zoneId, buildingId) {
  const z = S.zones.find(z => z.id === zoneId);
  if (!z || z.owner !== 'player') return;

  const b = BUILDINGS[buildingId];
  if (!b) return;
  if (b.unlock && !S.systems[b.unlock]) { notify('해당 건물은 아직 잠금 해제되지 않았습니다.', 'error'); return; }

  const maxSlots = z.slots || TYPE_SLOTS[z.type] || 3;
  if ((z.fac || []).length >= maxSlots) { notify('슬롯이 가득 찼습니다.', 'error'); return; }

  if (S.res.food < b.buildCost.food || S.res.energy < b.buildCost.energy) {
    notify(`자원 부족 (식량 ${b.buildCost.food}, 에너지 ${b.buildCost.energy})`, 'error'); return;
  }

  S.res.food   -= b.buildCost.food;
  S.res.energy -= b.buildCost.energy;
  z.fac.push(buildingId);

  if (b.moraleBonus) S.res.morale = Math.min(100, S.res.morale + b.moraleBonus);

  S.buildMenuOpen = null;
  addLog(`${z.name}에 ${b.name} 건설 완료.`);
  notify(`${b.name} 건설됐습니다.`, 'success');
  render();
}

function removeBuilding(zoneId, index) {
  const z = S.zones.find(z => z.id === zoneId);
  if (!z || z.owner !== 'player') return;
  const removed = z.fac.splice(index, 1)[0];
  const b = BUILDINGS[removed];
  // 철거 시 자원 일부 환불
  if (b) {
    S.res.food   += Math.floor(b.buildCost.food   * 0.3);
    S.res.energy += Math.floor(b.buildCost.energy * 0.3);
  }
  addLog(`${z.name}에서 ${b ? b.name : removed} 철거.`);
  render();
}

function toggleBuildMenu(zoneId) {
  S.buildMenuOpen = S.buildMenuOpen === zoneId ? null : zoneId;
  selectZone(zoneId);
}

// ─── 정책 토글 ────────────────────────────────────────
function togglePolicy(policyId) {
  if (!S.policies.hasOwnProperty(policyId)) return;
  S.policies[policyId] = !S.policies[policyId];
  const p = POLICIES[policyId];
  addLog(`정책 '${p.name}' ${S.policies[policyId] ? '시행' : '해제'}.`);
  render();
}

// ─── 이벤트 시스템 ──────────────────────────────────
function showEvent(ev) {
  S.phase    = 'event';
  S.curEvent = ev;

  // 3D: 이벤트 타입에 따른 카메라 연출
  if (window.threeScene) {
    if (ev.type === 'crisis' || ev.type === 'threat') window.threeScene.shake(0.4);
    // 관련 구역이 있으면 카메라 포커스
    if (ev.zoneId) window.threeScene.focusZone(ev.zoneId);
  }

  const TYPE_LABELS = {
    story:       '[ 이야기 ]',
    crisis:      '[ 위기 ]',
    opportunity: '[ 기회 ]',
    threat:      '[ 위협 ]',
  };

  el('ev-type').textContent  = TYPE_LABELS[ev.type] || '[ 이벤트 ]';
  el('ev-type').className    = `ev-type-label ${ev.type}`;
  el('ev-title').textContent = ev.title;

  el('ev-body').innerHTML = ev.body
    .split('\n')
    .map(line => line.trim() ? `<p>${line}</p>` : '<br>')
    .join('');

  el('ev-choices').innerHTML = '';
  ev.choices.forEach((ch, i) => {
    const canAfford = !ch.needFood || S.res.food >= ch.needFood;
    const btn = document.createElement('button');
    btn.className = 'ev-choice';
    btn.disabled  = !canAfford;
    btn.innerHTML = `${ch.text}${ch.needFood ? `<span class="choice-cost">비용: 식량 ${ch.needFood}</span>` : ''}`;
    if (canAfford) btn.addEventListener('click', () => resolveChoice(i));
    else btn.title = '자원이 부족합니다';
    el('ev-choices').appendChild(btn);
  });

  el('event-modal').classList.remove('hidden');
}

function resolveChoice(idx) {
  const ch = S.curEvent.choices[idx];
  if (ch.apply) ch.apply(S);

  el('ev-choices').innerHTML = '';
  if (ch.result) {
    el('ev-body').insertAdjacentHTML('beforeend',
      `<div class="choice-result-text">${ch.result}</div>`);
    const cont = document.createElement('button');
    cont.className = 'btn-continue';
    cont.textContent = '계속 →';
    cont.addEventListener('click', closeEvent);
    el('ev-choices').appendChild(cont);
  } else {
    closeEvent();
  }
}

function closeEvent() {
  el('event-modal').classList.add('hidden');
  S.phase    = 'running';
  S.curEvent = null;

  if (S.pending.length > 0) {
    setTimeout(() => showEvent(S.pending.shift()), 300);
  } else {
    render();
  }
}

// ─── 스토리 이벤트 ──────────────────────────────────
const STORY_EVENTS = [
  {
    id: 'intro',
    trigger: s => s.turn === 0,
    type: 'story',
    title: '첫 번째 결정',
    body: `도율이 데이터 패드를 내밀었다.

"현황 보고드릴게요. 좋은 소식은 없습니다."

새하는 3구역 식량 구역 설계도를 펼쳤다. 손가락으로 두 곳을 짚었다.

"여기랑 여기. 원래 보조 경작 슬롯이에요. 설계 당시부터 있었는데 한 번도 안 썼네요."

도율이 고개를 기울였다. "몰랐어요. 기록에 없어서."

"설계도엔 있어요."`,
    choices: [
      {
        text: '즉시 보조 슬롯을 가동한다',
        apply(s) {
          const z = s.zones.find(z => z.id === 41);
          if (z) { z.cond = 82; }
          s.res.food += 30;
          s.flags.hiddenFarm = true;
          addLog('41구역 보조 경작 슬롯 가동. 식량 생산량 상승.');
        },
        result: '식량 구역 수율이 82%로 회복됐다. 설계도를 아는 사람만이 찾을 수 있는 해답이었다.',
      },
      {
        text: '승계 대기자부터 처리한다 (식량 30, 에너지 20)',
        needFood: 30,
        apply(s) {
          const n = Math.min(5, s.sucQueue);
          s.sucQueue   -= n;
          s.res.food   -= 30;
          s.res.energy -= 20;
          s.stats.sucOk += n;
          addLog(`승계 시행. ${n}명 이어짐.`);
        },
        result: '38명의 대기자 중 5명이 승계됐다. 자원이 빠듯했지만, 먼저 기다린 사람들이 먼저였다.',
      },
    ],
  },
  {
    id: 'gaze',
    trigger: s => s.turn === 2,
    type: 'story',
    title: '시선',
    body: `새하가 주거 구역을 걷고 있었다.

배급 현황을 확인하러 나온 것뿐이었다. 그런데 사람들이 길을 비켰다.

세 번째 사람이 고개를 숙였다. 새하는 멈췄다.

"왜 그러는 거예요."

도율이 뒤에서 조용히 말했다.

"위원장이니까요."

새하는 다시 걷기 시작했다. 사람들은 계속 비켰다. 익숙해지려고 했지만 잘 되지 않았다.`,
    choices: [
      {
        text: '불편하지만 받아들인다',
        apply(s) { s.flags.gazeAccepted = true; },
        result: '익숙해지려고 했다. 잘 되지 않았다. 어제까지 같은 복도에서 일하던 사람들이었다.',
      },
      {
        text: '"나 이거 잘 못 할 것 같아요"라고 도율에게 솔직히 말한다',
        apply(s) { s.flags.doyulTrust = true; s.res.morale += 3; addLog('도율과의 신뢰 형성.'); },
        result: '도율이 잠깐 침묵했다가 말했다. "그러니까 저한테 말하는 거잖아요." 그것이 전부였다. 그러나 충분했다.',
      },
      {
        text: '사복을 입고 다닌다',
        apply(s) { s.flags.casualLeader = true; s.res.morale += 5; addLog('사복 순찰 시작. 주민 친밀도 상승.'); },
        result: '사복을 입으면 달라질 줄 알았다. 달라지지 않았다. 그래도 조금은 나았다.',
      },
    ],
  },
  {
    id: 'elder1',
    trigger: s => s.turn === 5 && !s.flags.elder1Done,
    type: 'story',
    title: '오래된 자의 방문',
    body: `19구역 문화 구역에서 연락이 왔다. 오래된 자가 새하를 찾는다고.

새하가 문을 열고 들어가자 그가 앉아 있었다. 아크 제로에서 가장 많은 승계를 거친 사람.

"어떻게 운영하고 있나요."

새하는 잠깐 망설이다 솔직하게 말했다.

"잘 모르겠어요. 그냥 아는 것부터 하고 있어요."

오래된 자가 고개를 끄덕였다. "그게 맞아요. 이 배는 아는 사람이 운영해야 해요. 화려한 말 하는 사람이 아니라."`,
    choices: [
      {
        text: '지명한 이유를 묻는다',
        apply(s) { s.flags.elder1Done = true; s.flags.askedReason = true; addLog('오래된 자에게 지명 이유를 물었다. 답을 얻지 못했다.'); },
        result: '오래된 자가 웃었다. "때가 되면 알게 됩니다." 그것뿐이었다.',
      },
      {
        text: '항도에 대해 묻는다',
        apply(s) { s.flags.elder1Done = true; s.res.morale += 5; addLog('항도에 대한 이해 깊어짐. 지지율 상승.'); },
        result: '"항도는 신앙이 아닙니다. 사람들이 길을 잃지 않으려는 방식이에요." 새하는 처음으로 항도를 이해한 것 같았다.',
      },
      {
        text: '승계 불평등 문제를 언급한다',
        apply(s) { s.flags.elder1Done = true; s.flags.sucFocus = true; addLog('승계 불평등 문제 제기. 개선 방향 모색 시작.'); },
        result: '"알고 있어요. 그래서 당신이 필요했어요." 오래된 자의 표정이 처음으로 진지해졌다.',
      },
    ],
  },
  {
    id: 'neutral_contact',
    trigger: s => s.turn === 8 && !s.flags.neutral1Done,
    type: 'story',
    title: '중립 구역의 접촉',
    body: `24구역에서 연락이 왔다. 식량이 부족하다. 기득권에도, 자치 구역에도 속하지 않은 420명.

그들의 대표가 직접 찾아왔다. 젊은 여성이었다. 승계를 한 번도 하지 않은, 새하와 비슷한 나이.

"도움을 요청하러 왔습니다. 기득권은 우리한테 아무것도 안 줬어요."`,
    choices: [
      {
        text: '식량을 지원한다 (식량 -40)',
        needFood: 40,
        apply(s) {
          s.flags.neutral1Done = true;
          s.res.food -= 40;
          const z = s.zones.find(z => z.id === 24);
          if (z) { z.owner = 'player'; z.fac = ['housing']; }
          s.stats.expanded++;
          updateZoneCounts();
          addLog('24구역 병합. 420명이 자치 구역에 합류했다.');
        },
        result: '식량을 보내자 24구역 사람들이 움직이기 시작했다. 조용히, 그러나 확실하게.',
      },
      {
        text: '자원 교환을 협상한다',
        apply(s) {
          s.flags.neutral1Done = true;
          s.flags.zone24negotiating = true;
          addLog('24구역과 협상 중. 다음 달 결과 확인 예정.');
        },
        result: '협상은 길어졌다. 그러나 대화의 문이 열렸다.',
      },
      {
        text: '지금 당장은 어렵다고 솔직하게 말한다',
        apply(s) {
          s.flags.neutral1Done = true;
          const z = s.zones.find(z => z.id === 24);
          if (z && Math.random() > 0.5) { z.owner = 'enemy'; addLog('24구역이 기득권으로 넘어갔다.'); updateZoneCounts(); }
          else addLog('24구역이 아직 중립을 유지하고 있다.');
        },
        result: '대표가 조용히 일어났다. "알겠습니다." 그것이 전부였다.',
      },
    ],
  },
  {
    id: 'priority_dilemma',
    trigger: s => s.turn === 12 && !s.flags.dilemma1Done,
    type: 'story',
    title: '우선순위',
    body: `같은 날 두 가지 일이 생겼다.

오전에는 발전 구역 보조 설비에서 과부하 신호가 왔다. 새하가 직접 보면 두 시간 안에 잡을 수 있는 문제였다.

오후에는 중립 구역 대표가 면담을 요청했다. 병합 협상의 첫 번째 기회였다. 놓치면 그 구역이 기득권으로 넘어갈 수 있었다.

둘 다 같은 시간이었다.

나는 저걸 고칠 수 있다. 저 면담은 잘 못 한다.
그런데 내가 해야 하는 건 저 면담이다.`,
    choices: [
      {
        text: '면담에 간다. 설비는 도율에게 맡긴다.',
        apply(s) {
          s.flags.dilemma1Done = true;
          s.flags.doyulTrust  = true;
          const neutrals = s.zones.filter(z => z.owner === 'neutral');
          if (neutrals.length > 0) {
            const t = neutrals[0];
            t.owner = 'player';
            s.stats.expanded++;
            updateZoneCounts();
            addLog(`${t.name} 병합 협상 성공. 도율이 설비 수리 완료.`);
          }
        },
        result: '도율을 믿고 맡겼다. 면담도 됐고, 설비도 해결됐다. 잘하는 일을 내려놓는 것. 이게 위원장이구나.',
      },
      {
        text: '설비를 직접 고친다. 면담은 다음에',
        apply(s) {
          s.flags.dilemma1Done = true;
          const z = s.zones.find(z => z.id === 7);
          if (z) z.cond = Math.min(100, z.cond + 10);
          addLog('설비 수리 완료. 면담 기회 놓침.');
        },
        result: '설비는 고쳤다. 면담 자리는 비었다. 그 구역의 대표는 기득권 측으로 넘어갔다는 소식이 나중에 들렸다.',
      },
    ],
  },
  {
    id: 'suc_failure',
    trigger: s => s.turn === 18 && s.sucQueue >= 45,
    type: 'crisis',
    title: '승계 실패 사건',
    body: `경보가 울렸다.

승계실에서 사고가 났다. 자원이 부족한 상태에서 무리하게 시행한 승계. 이식률이 너무 낮았다.

38세의 주민이 눈을 떴다. 그런데 직전 20년의 기억이 없었다.

아이가 있었다. 아내가 있었다. 직업이 있었다.

기억이 없다.

가족이 항의하러 왔다. 운영위원장실 앞에 서서 아무 말도 하지 않았다. 그냥 서 있었다.`,
    choices: [
      {
        text: '직접 사과하고 보상책을 마련한다 (식량 -20)',
        needFood: 20,
        apply(s) { s.res.food -= 20; s.res.morale += 8; addLog('승계 실패 공식 사과. 보상 지급. 신뢰도 상승.'); },
        result: '"죄송합니다." 말이 부족하다는 걸 알았다. 그래도 말했다. 가족은 오래 서 있다가 돌아갔다.',
      },
      {
        text: '승계 시스템을 일시 중단하고 자원을 확보한다',
        apply(s) { s.flags.sucPaused = true; s.res.food += 30; s.sucQueue += 5; addLog('승계 일시 중단. 자원 확보. 대기자 증가.'); },
        result: '중단을 선언했다. 대기자들이 조용해졌다. 조용한 것이 항상 좋은 신호는 아니었다.',
      },
      {
        text: '승계사에게 책임을 묻는다',
        apply(s) { s.res.morale -= 5; addLog('승계사 문책. 분위기 경직.'); },
        result: '"자원이 부족했습니다. 저도 알고 있었어요." 새하는 아무 말도 할 수 없었다.',
      },
    ],
  },
  {
    id: 'table',
    trigger: s => s.turn === 10 && !s.flags.tableDone,
    type: 'story',
    title: '테이블',
    body: `기득권 측에서 면담 요청이 들어왔다.

운영위원회 청사. 진서, 태린, 무경이 앉아 있었다.

진서가 먼저 말했다. "자치 구역 운영 현황을 공유해 주세요."

새하는 준비한 데이터를 꺼내지 않았다. 도율이 귀띔해 줬다. 그들이 원하는 건 데이터가 아니라 먼저 요청하게 만드는 것.

침묵이 흘렀다.

태린이 숫자가 빼곡한 패드를 밀었다. "자치 구역 식량 안정화 수치입니다."

새하는 패드를 받지 않았다.`,
    choices: [
      {
        text: '도율에게 협상을 배운다',
        apply(s) { s.flags.tableDone = true; s.flags.learnedNeg = true; s.flags.eliteRel += 5; addLog('첫 기득권 면담. 도율로부터 협상의 언어를 배우기 시작함.'); },
        result: '"말하지 않는 것도 협상이에요." 도율의 말이 그날 이후 머릿속에 남았다.',
      },
      {
        text: '실무와 수치로 정면 승부한다',
        apply(s) { s.flags.tableDone = true; s.flags.eliteRel -= 5; s.res.morale += 5; addLog('기득권 면담. 수치로 정면 대응. 기득권 관계 소폭 악화.'); },
        result: '태린의 눈썹이 올라갔다. 진서는 미동도 없었다. 그것이 좋은 신호인지 나쁜 신호인지 알 수 없었다.',
      },
      {
        text: '오래된 자에게 먼저 조언을 구한다',
        apply(s) { s.flags.tableDone = true; s.res.hanto += 8; s.flags.eliteRel += 3; addLog('오래된 자 조언으로 기득권 면담 준비. 항도 지지율 상승.'); },
        result: '"그들이 두려워하는 건 당신이 아니에요. 당신이 얼마나 오래 버틸지 모른다는 사실이에요." 그 말을 가지고 테이블에 앉았다.',
      },
    ],
  },
  {
    id: 'suc_attitude',
    trigger: s => s.turn === 16 && !s.flags.sucAttitudeDone,
    type: 'story',
    title: '승계에 대해서',
    body: `도율이 업무 보고 중에 불쑥 물었다.

"위원장님은 언제 승계하실 건가요?"

새하는 보고서에서 눈을 들었다.

반란 이전에는 생각해본 적 없는 질문이었다. 엔지니어 시절에는 때가 되면 하면 되는 일이었다.

지금은 달랐다. 승계 대기자가 수십 명이다. 자원이 빠듯하다. 위원장인 새하가 승계를 받으면 그 자원을 다른 사람에게 쓸 수 있다.

도율은 답을 강요하지 않았다. 그냥 물었다.`,
    choices: [
      {
        text: '"언젠가는 해야겠죠. 아직은 아니지만."',
        apply(s) { s.flags.sucAttitudeDone = true; s.flags.sucAttitude = 'sometime'; s.res.morale += 3; s.res.hanto += 3; addLog('승계 태도: 언젠가는. 주민 안심 효과.'); },
        result: '도율이 고개를 끄덕였다. 그것으로 충분한 답이었다.',
      },
      {
        text: '"아직은 아니에요."',
        apply(s) { s.flags.sucAttitudeDone = true; s.flags.sucAttitude = 'not_yet'; addLog('승계 태도: 아직은 아니다.'); },
        result: '도율은 더 이상 묻지 않았다. 그 침묵이 무겁게 남았다.',
      },
      {
        text: '"모르겠어요. 솔직히."',
        apply(s) { s.flags.sucAttitudeDone = true; s.flags.sucAttitude = 'unsure'; s.flags.doyulTrust = true; addLog('승계에 대한 솔직한 고백. 도율 신뢰 형성.'); },
        result: '도율이 잠깐 침묵했다. "저도 모르겠어요, 사실은." 그것이 새하를 웃게 만든 첫 번째 말이었다.',
      },
    ],
  },
  {
    id: 'elder_last',
    trigger: s => s.turn >= 36 && s.flags.storyStage >= 2 && !s.flags.elderLastDone,
    type: 'story',
    title: '오래된 자의 마지막 방문',
    body: `오래된 자가 새하를 데려갔다. 기록에도 없는 통로 끝.

그가 처음으로 새하를 제대로 바라봤다.

"당신의 어머니 이서에 대해 말해야 할 것이 있어요."

그가 말했다. 이서는 아크 제로 설계팀 일원이었다. 오래된 자는 출발 전 이서를 설득했다. 승계를 거부하도록. 6구역의 비밀을 아는 사람이 승계를 거듭해 판단이 흐려지면 안 된다는 이유로.

그러나 진짜 이유는 말하지 않았다.

이서는 자신이 이용당했다는 것을 끝까지 몰랐다.

새하가 오래된 자를 바라봤다.`,
    choices: [
      {
        text: '기록을 모두 읽는다',
        apply(s) {
          s.flags.elderLastDone = true;
          s.flags.motherTruth   = true;
          s.flags.storyStage    = 3;
          s.res.morale += 10;
          addLog('어머니가 이용당했다는 진실을 알게 됐다. 오래된 자를 다시 보게 됐다.');
        },
        result: '새하는 오래 그 자리에 서 있었다. 오래된 자도 아무 말 하지 않았다. 침묵이 답이었다.',
      },
    ],
  },
  {
    id: 'zone6',
    trigger: s => s.flags.motherTruth && !s.flags.zone6Done,
    type: 'story',
    title: '6구역 — 봉인 구역',
    body: `새하의 어머니가 설계한 공간.

벽에 기록이 있었다. 오래된 자의 필체로.

"나는 네 어머니에게 두 가지를 했다.

하나는, 그녀를 설득해 승계를 거부하게 만든 것. 나는 그것이 필요하다고 판단했다. 그러나 그녀에게 진짜 이유를 말하지 않았다. 그것은 거짓말이었다.

다른 하나는, 그녀가 죽은 후 47년 동안 너를 지켜봤지만 아무것도 하지 않은 것. 그것은 비겁함이었다.

솔직히 말하면 나는 지쳐있었다. 오래 살았고, 많이 잃었고, 이제 내가 누구인지 모르겠다. 그리고 6구역의 비밀을 감당할 사람이 필요했다. 너는 그 조건에 맞는 유일한 사람이었다.

이것이 선택의 전부다. 숭고하지 않다.

그러나 한 가지는 진심이다. 네 어머니는 훌륭한 사람이었다. 나보다 훨씬. 그녀의 딸이 이 배를 이끄는 것을 보고 싶었다."`,
    choices: [
      {
        text: '기록을 모두 읽는다',
        apply(s) {
          s.flags.zone6Done = true;
          s.res.morale += 10;
          s.res.hanto  += 5;
          s.flags.storyStage = Math.max(s.flags.storyStage, 4);
          addLog('6구역 봉인 해제. 오래된 자의 고백문을 읽다.');
        },
        result: '새하는 오래 그 자리에 서 있었다. 이것이 선택의 전부라고 했다. 숭고하지 않다고 했다. 그것이 오히려 무거웠다.',
      },
    ],
  },
  {
    id: 'seonu_conflict',
    trigger: s => s.turn >= 20 && !s.flags.seonuConflictDone && s.flags.storyStage >= 1,
    type: 'story',
    title: '선우의 질문',
    body: `선우가 새하를 찾아왔다.

"기득권이랑 협상하는 거 봤어요. 실망이에요."

새하는 잠깐 생각하다 물었다.

"뭘 원하는 거예요, 선우 씨."

"기득권을 무너뜨리는 거요. 공평한 배분. 처음부터 그게 목표였잖아요."

"그게 가능한 방법이에요?"

"당신이 의지가 없는 거잖아요."`,
    choices: [
      {
        text: '"지금 방법으로는 사람이 다쳐요"',
        apply(s) { s.flags.seonuRel = (s.flags.seonuRel || 30) - 5; s.res.morale += 3; s.flags.seonuConflictDone = true; addLog('선우와 대립. 사람이 다친다는 입장 고수.'); },
        result: '선우가 일어났다. "그래도 결국 타협은 굴복이에요." 새하는 그 말이 틀렸다고 생각하지 않았다.',
      },
      {
        text: '"당신 말이 맞아요. 방법을 찾읍시다"',
        apply(s) { s.flags.seonuRel = (s.flags.seonuRel || 30) + 10; s.flags.eliteRel -= 5; s.flags.seonuConflictDone = true; addLog('선우 입장 수용. 기득권 관계 냉각.'); },
        result: '선우가 처음으로 새하를 똑바로 봤다. "그 말 믿겠어요." 아직 믿지 않는다는 표정이었다.',
      },
      {
        text: '"나도 모르겠어요"',
        apply(s) { s.flags.seonuRel = (s.flags.seonuRel || 30) + 5; s.flags.seonuConflictDone = true; addLog('선우에게 솔직하게 고백.'); },
        result: '선우가 잠깐 멈췄다. "그 말은 처음 들어요." 그리고 나갔다. 적이 된 것 같지는 않았다.',
      },
    ],
  },
  {
    id: 'elder_final_talk',
    trigger: s => s.flags.zone6Done && !s.flags.elderFinalDone,
    type: 'story',
    title: '마지막 대화',
    body: `새하가 오래된 자를 찾아갔다.

44구역. 그는 창가에 앉아 있었다.

새하: "왜 어머니한테 진짜 이유를 말 안 했어요."

오래된 자: "말했으면 거부했을 거예요."

새하: "그러면 됐잖아요."

오래된 자: "그러면 이 배에 필요한 사람이 없어졌을 거예요."

새하: "그게 어머니보다 중요했어요?"

오래된 자가 오래 침묵했다.`,
    choices: [
      {
        text: '더 이상 묻지 않는다',
        apply(s) { s.flags.elderRel = (s.flags.elderRel || 60) + 10; s.flags.elderFinalDone = true; addLog('오래된 자와의 대화를 멈췄다. 관계 개선.'); },
        result: '"...모르겠어요. 그때는 그렇게 생각했어요." 새하는 창밖을 봤다. 이 어둠 어딘가에 케플러 그린이 있다.',
      },
      {
        text: '"당신이 한 일이 잘못됐다고 생각해요"',
        apply(s) { s.flags.elderRel = Math.max(0, (s.flags.elderRel || 60) - 5); s.res.morale += 5; s.flags.elderFinalDone = true; addLog('오래된 자에게 잘못을 말했다.'); },
        result: '"알아요." 그것이 전부였다. 변명도 설명도 없이. 그리고 그것이 새하를 더 힘들게 했다.',
      },
    ],
  },
  {
    id: 'memory_harayuki',
    trigger: s => s.stats.sucOk > 0 && !s.flags.memHarayukiDone,
    type: 'story',
    title: '기억 — 하라 유키의 첫 번째 승계',
    body: `출발 후 15년째.

하라 유키가 승계실 시술대에 누웠다. 집도 승계사가 물었다. "준비됐습니까?"

"아니요. 그래도 합니다."

하라 유키-2가 눈을 떴다. 기억이 있었다. 그런데 커피 맛이 없었다. 정확히 어떤 맛이었는지. 그녀는 승계사에게 물었다. "커피가 어떤 맛이었는지 아십니까?"

"쓰고 향이 있다고 들었습니다."

하라 유키는 일어나 앉았다. "괜찮습니다. 계속하죠."`,
    choices: [
      {
        text: '기록을 읽다',
        apply(s) { s.flags.memHarayukiDone = true; addLog('하라 유키의 첫 번째 승계 기록을 읽다.'); },
        result: '하라 유키-2는 이후 37년을 더 살았다. 커피 맛은 끝내 기억하지 못했다.',
      },
    ],
  },
  {
    id: 'memory_byeol_mother',
    trigger: s => s.flags.elder1Done && !s.flags.memByeolDone,
    type: 'story',
    title: '기억 — 별과 새하 어머니',
    body: `출발 후 28년째.

교실. 열다섯 살 이서가 별에게 물었다.

"선생님, 승계를 안 하면 어떻게 돼요?"

별: "늙어."

이서: "그게 다예요?"

별: "응. 그게 다야."

이서: "선생님은 승계할 거예요?"

별이 창밖을 봤다.

"아직 모르겠어."`,
    choices: [
      {
        text: '기록을 읽다',
        apply(s) { s.flags.memByeolDone = true; s.flags.byeolRel = (s.flags.byeolRel || 20) + 5; addLog('별과 새하 어머니의 기억 기록을 읽다.'); },
        result: '별은 그 학생이 훗날 승계를 거부한다는 것을 몰랐다. 그리고 그 학생의 딸이 지금 당신 옆에 있다.',
      },
    ],
  },
  {
    id: 'memory_elder_design',
    trigger: s => s.flags.zone6Done && !s.flags.memElderDesignDone,
    type: 'story',
    title: '기억 — 오래된 자의 설계팀 시절',
    body: `2360년. 설계 회의실.

오래된 자가 도면 위 한 구역을 손가락으로 짚었다.

"이 구역은 공식 도면에서 빼겠습니다."

동료: "왜요?"

"때가 되면 필요한 사람이 찾아낼 겁니다."

오래된 자가 연필로 작게 썼다. 6.`,
    choices: [
      {
        text: '기록을 읽다',
        apply(s) { s.flags.memElderDesignDone = true; addLog('오래된 자의 설계팀 시절 기록을 읽다.'); },
        result: '오래된 자는 그 순간을 4번의 승계를 거치는 동안 한 번도 잊지 않았다. 희석되지 않은 것들이 있다. 그것들은 대부분 작은 결정이다.',
      },
    ],
  },
  {
    id: 'memory_doyul_parent',
    trigger: s => s.flags.doyulRel >= 65 && !s.flags.memDoyulDone,
    type: 'story',
    title: '기억 — 도율 부모 세대',
    body: `도율 일곱 살.

어머니가 말했다.

"네가 있어서 승계했어."

"다 크면?"

"네 애가 크는 것도 보고 싶을 것 같아서."

도율의 어머니는 세 번째 승계에서 그 대화를 잃었다.`,
    choices: [
      {
        text: '기록을 읽다',
        apply(s) { s.flags.memDoyulDone = true; addLog('도율 부모 세대의 기억 기록을 읽다.'); },
        result: '도율은 기억한다. 그래서 말하지 않는다. 말하면 어머니가 슬퍼할 테니까.',
      },
    ],
  },
  {
    id: 'memory_equal_org',
    trigger: s => s.flags.seonuConflictDone && !s.flags.memEqualDone,
    type: 'story',
    title: '기억 — 균등회 초창기',
    body: `출발 후 32년째.

다섯 명의 모임.

선우의 아버지: "우리 뭘 원하는 거야?"

누군가 답했다.

"그냥 공평하게. 승계를 공평하게. 밥을 공평하게. 그게 다야."

선우의 아버지: "그게 다인데 왜 이렇게 어렵냐."

아무도 대답하지 않았다.`,
    choices: [
      {
        text: '기록을 읽다',
        apply(s) { s.flags.memEqualDone = true; addLog('균등회 초창기 기록을 읽다.'); },
        result: '그 다섯 명 중 셋은 균등회가 커지는 것을 보지 못했다. 원하는 것은 처음부터 지금까지 같다. 공평하게.',
      },
    ],
  },
  {
    id: 'final_succession',
    trigger: s => s.turn >= 60 && s.flags.zone6Done && !s.flags.finalSucDone,
    type: 'story',
    title: '도착을 보고 싶다',
    body: `케플러 그린 관측 데이터가 들어왔다.

새하는 47구역 관측실에서 그 숫자들을 읽었다. 대기 성분. 수분 함량. 기온 범위.

살 수 있다.

아크 제로를 탄 사람들이 가장 듣고 싶었던 숫자들.

새하는 창밖의 어둠을 바라봤다. 이 어둠 어딘가에 빛이 있다.

도착하는 걸 보고 싶었다.

하지만 자원은 여전히 빠듯하다. 승계를 받으면 그 자원이 다른 대기자에게 간다.`,
    choices: [
      {
        text: '"도착하는 걸 보고 싶다." — 승계를 결심한다',
        apply(s) {
          s.flags.finalSucDone = true;
          s.flags.saehaSuccession = 'will';
          s.res.hanto  += 10;
          s.res.morale += 8;
          addLog('새하, 승계를 결심하다. 도착을 보기 위해.');
        },
        result: '"도착하는 걸 보고 싶다." 새하는 처음으로 자신을 위한 결정을 했다.',
      },
      {
        text: '"대기자가 먼저다." — 승계를 미룬다',
        apply(s) {
          s.flags.finalSucDone = true;
          s.flags.saehaSuccession = 'refuse';
          s.sucQueue = Math.max(0, s.sucQueue - 3);
          s.res.pop  += 3;
          s.res.morale += 5;
          addLog('새하, 승계 거부. 대기자에게 자원 돌림.');
        },
        result: '"대기자가 먼저예요." 도율이 아무 말 하지 않았다. 그 침묵이 무엇을 뜻하는지 새하는 알았다.',
      },
    ],
  },
];

// ─── 랜덤 이벤트 ────────────────────────────────────
const RANDOM_EVENTS = [
  {
    id: 'food_dmg', weight: 10,
    condition: s => s.res.food > 60,
    type: 'crisis', title: '식량 저장고 손상',
    body: `3구역 식량 저장고 일부가 손상됐다는 보고가 들어왔다. 밀봉 실패로 인한 오염. 긴급 대응이 필요하다.`,
    choices: [
      { text: '즉시 복구팀을 파견한다 (에너지 -15)', apply: s => { s.res.energy -= 15; s.res.food -= 15; addLog('식량 저장고 긴급 복구. 피해 최소화.'); }, result: '복구팀이 밤새 작업했다. 손실이 줄었다.' },
      { text: '손상된 식량을 즉시 분배한다',          apply: s => { s.res.food -= 30; s.res.morale += 3; addLog('손상 식량 긴급 분배.'); }, result: '주민들이 이해했다.' },
      { text: '사실을 숨기고 배급을 줄인다',          apply: s => { s.res.food -= 20; s.res.morale -= 8; addLog('위기 은폐. 배급 축소. 불만 증가.'); }, result: '소문은 항상 퍼진다.' },
    ],
  },
  {
    id: 'power_ol', weight: 9,
    condition: s => s.res.energy < 65,
    type: 'crisis', title: '발전기 과부하',
    body: `7구역 발전 구역에서 과부하 경고가 울렸다. 즉시 조치하지 않으면 에너지 공급이 크게 감소한다.`,
    choices: [
      { text: '기술팀을 보낸다 (에너지 -10)', apply: s => { s.res.energy -= 10; const z = s.zones.find(z => z.id === 7); if (z) z.cond = Math.min(90, z.cond + 15); addLog('발전기 수리 완료.'); }, result: '새하의 팀이 4시간 만에 잡았다.' },
      { text: '비핵심 구역 전력을 줄인다',    apply: s => { s.res.energy += 5; s.res.morale -= 5; addLog('비핵심 구역 전력 감축.'); }, result: '문화 구역의 불이 꺼졌다.' },
    ],
  },
  {
    id: 'neutral_crisis', weight: 8,
    condition: s => s.zones.filter(z => z.owner === 'neutral').length > 2,
    type: 'opportunity', title: '중립 구역의 위기',
    body: `인접한 중립 구역에서 식량 부족 위기가 발생했다. 기득권은 도움을 거부했다.`,
    choices: [
      {
        text: '식량 지원을 보낸다 (식량 -35)',
        needFood: 35,
        apply: s => {
          const nz = s.zones.filter(z => z.owner === 'neutral');
          if (nz.length > 0) {
            const t = nz[Math.floor(Math.random() * nz.length)];
            t.owner = 'player'; s.res.food -= 35; s.stats.expanded++;
            updateZoneCounts();
            addLog(`${t.name} 병합. 위기 지원으로 신뢰 얻음.`);
          }
        },
        result: '식량 트럭이 출발했다. 사람들이 그것을 기억할 것이다.',
      },
      { text: '지켜본다', apply: s => addLog('중립 구역 위기 관망.'), result: '기득권이 먼저 움직였다.' },
    ],
  },
  {
    id: 'enemy_press', weight: 9,
    condition: s => s.turn > 6,
    type: 'threat', title: '기득권의 압박',
    body: `기득권 측에서 통보가 왔다. 에너지 공급 계약 재검토. 기존 조약보다 불리한 조건을 제시하고 있다.`,
    choices: [
      { text: '조건을 받아들인다',                 apply: s => { s.flags.energyPenalty = (s.flags.energyPenalty||0) + 12; s.flags.eliteRel += 5; addLog('기득권 에너지 계약 수정. 불리하나 관계 유지.'); }, result: '불리했다. 그러나 지금은 버티는 것이 중요했다.' },
      { text: '거부하고 독립 전력 확보에 집중한다', apply: s => { s.res.energy -= 20; s.flags.energyIndep = true; s.flags.eliteRel -= 8; addLog('기득권 계약 거부. 독립 전력 추진. 기득권 관계 악화.'); }, result: '일시적으로 에너지가 부족해졌다. 그러나 독립의 첫 걸음이었다.' },
      { text: '오래된 자에게 조언을 구한다',       apply: s => { s.res.morale += 5; s.res.energy -= 5; s.flags.eliteRel += 2; addLog('오래된 자 조언 수용.'); }, result: '"그들이 원하는 건 자원이 아니에요. 당신이 먼저 부탁하게 만드는 것이에요."' },
    ],
  },
  {
    id: 'hanto_rally', weight: 6,
    condition: s => s.res.hanto < 42,
    type: 'opportunity', title: '항도 집회',
    body: `44구역 문화 구역 앞에 사람들이 모였다. 항도 집회가 자발적으로 열렸다. 어두운 시기, 사람들은 모이고 싶어한다.`,
    choices: [
      { text: '집회에 새하도 참석한다',   apply: s => { s.res.hanto += 10; s.res.morale += 3; addLog('항도 집회 참석. 주민들과 함께함.'); }, result: '새하는 연설을 하지 않았다. 그냥 앉아있었다. 그것으로 충분했다.' },
      { text: '집회는 허용하되 불참한다', apply: s => { s.res.hanto += 4;  addLog('항도 집회 허용.'); }, result: '사람들이 모였다. 새하가 없어도 모였다.' },
    ],
  },
  {
    id: 'suc_chance', weight: 5,
    condition: s => s.res.food > 120 && s.res.energy > 55 && s.sucQueue > 0,
    type: 'opportunity', title: '자원 여유',
    body: `자원 상황이 안정됐다. 승계 대기자들을 처리할 수 있는 기회다.`,
    choices: [
      {
        text: '대규모 승계를 시행한다 (식량 -40, 에너지 -30)',
        needFood: 40,
        apply: s => {
          const n = Math.min(10, s.sucQueue);
          s.sucQueue -= n; s.res.food -= 40; s.res.energy -= 30;
          s.res.pop += Math.floor(n * 0.5); s.res.morale += 8;
          s.stats.sucOk += n;
          addLog(`대규모 승계 시행. ${n}명 이어짐.`);
        },
        result: '승계실에 불이 켜졌다. 눈을 뜬 사람들이 천천히 고개를 끄덕였다.',
      },
      { text: '자원을 구역 개선에 쓴다', apply: s => { s.zones.filter(z => z.owner === 'player').forEach(z => z.cond = Math.min(100, z.cond + 5)); addLog('자원 여유분으로 구역 개선.'); }, result: '작은 보수가 쌓여 큰 차이를 만든다.' },
    ],
  },
  // ── 추가 이벤트 ──────────────────────────────────
  {
    id: 'elite_sabotage', weight: 7,
    condition: s => s.zones.filter(z => z.owner === 'player').length >= 8 && s.flags.eliteRel < 50,
    type: 'threat', title: '기득권의 방해',
    body: `자치 구역 설비 몇 곳에서 원인 불명의 장애가 발생했다. 무경의 보안팀이 개입했다는 소문이 돈다.`,
    choices: [
      {
        text: '증거를 수집하고 공개한다',
        apply: s => {
          const z = s.zones.filter(z => z.owner === 'player')[0];
          if (z) z.cond = Math.max(20, z.cond - 8);
          s.res.hanto += 5;
          addLog('기득권 방해 증거 공개. 항도 지지율 상승.');
        },
        result: '증거를 공개하자 소문이 확산됐다. 기득권은 부인했다. 그러나 사람들은 알았다.',
      },
      {
        text: '방위대를 배치한다 (에너지 -15)',
        apply: s => { s.res.energy -= 15; s.flags.cd_eliteCounter = s.turn + 8; addLog('방위대 긴급 배치. 추가 방해 차단.'); },
        result: '방위대가 순찰을 강화했다. 방해 시도가 줄었다.',
      },
      {
        text: '태린에게 조용히 항의 연락을 보낸다',
        apply: s => { s.flags.eliteRel += 4; addLog('기득권에 조용한 항의. 관계 소폭 개선.'); },
        result: '"확인해 보겠습니다." 태린의 목소리는 평온했다. 그 평온함이 더 불안했다.',
      },
    ],
  },
  {
    id: 'zone_trade', weight: 7,
    condition: s => s.zones.some(z => z.owner === 'neutral') && s.res.energy > 50,
    type: 'opportunity', title: '중립 구역의 교역 제안',
    body: `인접한 중립 구역에서 연락이 왔다. 식량이 부족하지만 에너지는 여유가 있다고. 서로 필요한 것을 가지고 있다.`,
    choices: [
      {
        text: '교역한다 (에너지 -20, 식량 +35)',
        apply: s => { s.res.energy -= 20; s.res.food += 35; addLog('중립 구역과 교역. 식량 확보.'); },
        result: '거래는 공정했다. 기득권이 좋아하지 않을 것이었다.',
      },
      {
        text: '교역하고 병합을 제안한다 (에너지 -20, 식량 +20)',
        apply: s => {
          s.res.energy -= 20; s.res.food += 20;
          const nz = s.zones.filter(z => z.owner === 'neutral');
          if (nz.length > 0 && Math.random() < 0.55) {
            const t = nz[0]; t.owner = 'player'; s.stats.expanded++; updateZoneCounts();
            addLog(`교역 후 ${t.name} 병합. 신뢰가 문을 열었다.`);
          } else { addLog('교역 완료. 병합 제안은 다음 기회로.'); }
        },
        result: '거래가 신뢰가 됐다.',
      },
      {
        text: '무상으로 지원한다 (식량 -20)',
        apply: s => { s.res.food -= 20; s.res.morale += 3; s.res.hanto += 4; addLog('무상 지원. 항도·사기 상승.'); },
        result: '"받기만 할 수는 없어요." 그들이 나중에 돌려줄 것이라는 생각은 하지 않았다.',
      },
    ],
  },
  {
    id: 'tech_discovery', weight: 5,
    condition: s => s.zones.some(z => z.owner === 'player' && (z.fac || []).includes('workshop')),
    type: 'opportunity', title: '기술 발견',
    body: `39구역 작업장에서 흥미로운 발견이 있었다. 오래된 설계도 사본. 새하가 직접 해석하면 실용화할 수 있다.`,
    choices: [
      {
        text: '직접 분석한다 (3개월 후 보상)',
        apply: s => { s.flags.techDiscovery = s.turn + 3; addLog('기술 발견 분석 시작. 3개월 후 완료 예정.'); },
        result: '새하의 손가락이 도면 위를 움직였다. 익숙하면서 낯선 선들이었다.',
      },
      {
        text: '팀에 맡긴다 (즉시, 효과 작음)',
        apply: s => { s.zones.filter(z => z.owner === 'player').forEach(z => z.cond = Math.min(100, z.cond + 6)); addLog('기술팀 설계도 적용. 구역 상태 개선.'); },
        result: '팀이 일주일 만에 해석을 마쳤다. 작은 차이지만 분명한 차이였다.',
      },
    ],
  },
  {
    id: 'faction_conflict', weight: 6,
    condition: s => s.res.hanto > 55 && s.res.morale < 45,
    type: 'crisis', title: '항도파와 실용파의 갈등',
    body: `주거 구역에서 말다툼이 벌어졌다. 한쪽은 항도 집회를 열고 싶고, 다른 쪽은 그 시간에 설비 수리를 해야 한다고 한다. 작은 분쟁이지만, 더 커질 수 있다.`,
    choices: [
      {
        text: '집회를 먼저 허용한다',
        apply: s => { s.res.hanto += 5; s.res.morale -= 3; addLog('항도 집회 우선 허용. 실용파 불만 증가.'); },
        result: '집회는 평화롭게 끝났다. 설비 수리는 하루 늦어졌다.',
      },
      {
        text: '수리 먼저, 집회 이틀 후 허용',
        apply: s => { s.res.morale += 3; s.res.hanto -= 2; addLog('실용적 조정. 양측 타협.'); },
        result: '아무도 완전히 만족하지 않았다. 그래서 타협이었다.',
      },
      {
        text: '새하가 직접 중재한다 — 수리를 도우며 집회도 참석',
        apply: s => { s.res.hanto += 3; s.res.morale += 3; addLog('새하 직접 중재. 양측 신뢰 상승.'); },
        result: '새하가 집회 전에 수리를 도왔다. 그것으로 충분했다.',
      },
    ],
  },
  {
    id: 'pop_surge', weight: 5,
    condition: s => s.sucQueue > 40,
    type: 'crisis', title: '승계 대기 폭발',
    body: `소문이 퍼졌다. 기득권 구역의 승계가 지연되고 있다. 사람들이 자치 구역의 승계실을 찾아오기 시작했다. 48시간 만에 대기자가 20명 늘었다.`,
    choices: [
      {
        text: '모두를 받아들인다',
        apply: s => { s.sucQueue += 20; s.res.morale += 5; s.res.hanto += 5; addLog('대기자 전원 수용. 승계 대기 급증.'); },
        result: '줄이 길어졌다. 하지만 줄이 존재한다는 것, 그것이 중요했다.',
      },
      {
        text: '자원 상황을 설명하고 일부만 받는다',
        apply: s => { s.sucQueue += 8; s.res.morale += 2; addLog('대기자 일부 수용. 자원 상황 설명.'); },
        result: '이해한 사람도 있었다. 이해하지 못한 사람도 있었다.',
      },
      {
        text: '기존 대기자 우선을 유지한다',
        apply: s => { s.res.food += 10; addLog('기존 대기자 우선. 신규 수용 제한.'); },
        result: '문 앞에서 돌아간 사람들이 어디로 갔는지는 알 수 없었다.',
      },
    ],
  },
  {
    id: 'barracks_effect', weight: 4,
    condition: s => s.zones.some(z => z.owner === 'player' && (z.fac || []).includes('barracks')),
    type: 'opportunity', title: '방위대의 부작용',
    body: `방위대가 배치된 구역 주민들 사이에서 불만이 나왔다. 물자 검색과 야간 순찰이 일상이 됐다. 안전해졌지만, 뭔가 달라졌다.`,
    choices: [
      {
        text: '방위대 운영 방식을 완화한다',
        apply: s => { s.res.morale += 5; s.res.hanto += 3; addLog('방위대 운영 방식 완화. 주민 신뢰 회복.'); },
        result: '순찰이 줄었다. 사람들이 다시 복도에서 이야기를 나눴다.',
      },
      {
        text: '안전이 최우선이라고 설명한다',
        apply: s => { s.res.morale -= 3; addLog('방위대 유지. 주민 이해 요청. 불만 잔존.'); },
        result: '"우리가 보호받는 건지 감시받는 건지 모르겠어요." 말이 마음에 남았다.',
      },
    ],
  },
  {
    id: 'byeol_sick', weight: 5,
    condition: s => s.flags.byeolRel >= 20 && !s.flags.byeolConvalescent,
    type: 'crisis', title: '별의 건강 이상',
    body: `별이 쓰러졌다는 연락이 왔다. 44구역 의무실.

승계를 권유해야 하는 상황이지만, 별은 승계를 거부한 사람이다.

의무실 앞에서 새하는 멈췄다.`,
    choices: [
      {
        text: '아무 말 하지 않고 곁에 있는다',
        apply: s => {
          s.flags.byeolRel = (s.flags.byeolRel || 20) + 8;
          s.flags.byeolConvalescent = true;
          addLog('별의 곁에 있었다. 말 없이.');
        },
        result: '"말 안 해줘서 고마워요." 별이 조용히 말했다. "새하 어머니도 이런 사람이었어요."',
      },
      {
        text: '승계를 권유한다',
        apply: s => {
          s.flags.byeolRel = Math.max(0, (s.flags.byeolRel || 20) - 8);
          s.flags.byeolConvalescent = true;
          addLog('별에게 승계를 권유했다. 거절당했다.');
        },
        result: '"괜찮아요. 이게 내가 선택한 거예요." 별의 목소리에 흔들림이 없었다.',
      },
      {
        text: '최선을 다해 간호한다 (에너지 -5)',
        apply: s => {
          s.res.energy -= 5;
          s.flags.byeolRel = (s.flags.byeolRel || 20) + 5;
          s.flags.byeolSecretClues = (s.flags.byeolSecretClues || 0) + 2;
          s.flags.byeolConvalescent = true;
          addLog('별을 간호했다. 어머니에 대한 이야기를 조금 들었다.');
        },
        result: '"새하 어머니도 이런 사람이었어요. 정확히 당신같이." 별이 눈을 감았다.',
      },
    ],
  },
  {
    id: 'seonu_radical', weight: 6,
    condition: s => s.flags.seonuRel !== undefined && s.flags.seonuRel < 35 && s.turn > 15,
    type: 'threat', title: '강무의 움직임',
    body: `강무가 자치 구역 내 비공식 모임을 운영하고 있다는 보고가 들어왔다.

도율이 조용히 말했다. "12명 정도예요. 아직 작아요."

새하는 설계도를 내려놨다.`,
    choices: [
      {
        text: '강무를 직접 불러 묻는다',
        apply: s => {
          s.flags.kangmuRel = Math.max(0, (s.flags.kangmuRel || 40) - 5);
          s.flags.kangmuWarned = true;
          addLog('강무와 직접 대면. 관계 냉각.');
        },
        result: '"저는 더 빠른 길을 원합니다." 강무의 눈빛이 흔들리지 않았다.',
      },
      {
        text: '도율에게 파악을 맡긴다',
        apply: s => {
          s.flags.doyulRel = (s.flags.doyulRel || 50) + 3;
          addLog('도율에게 강무 파악 의뢰.');
        },
        result: '3일 후 도율이 보고했다. "12명이요. 전부 반란 때 청사에 있었던 사람들이에요."',
      },
      {
        text: '지금은 모른 척한다',
        apply: s => {
          s.flags.kangmuIgnored = true;
          addLog('강무 움직임 관망.');
        },
        result: '강무는 계속 움직였다. 모르는 척하는 것이 허락은 아니었는데.',
      },
    ],
  },
  {
    id: 'doyul_silent', weight: 5,
    condition: s => s.turn > 25 && !s.flags.doyulConfessTriggered,
    type: 'story', title: '도율의 침묵',
    body: `며칠째 도율이 눈을 피하고 있었다.

보고는 정확했다. 업무는 완벽했다. 그러나 새하와 눈을 마주치지 않았다.

새하는 그것을 알아챘다.`,
    choices: [
      {
        text: '직접 묻는다',
        apply: s => {
          s.flags.doyulConfessTriggered = true;
          s.flags.doyulRel = (s.flags.doyulRel || 50) + 5;
          addLog('도율에게 직접 물었다. 무언가를 고백했다.');
        },
        result: '도율이 오래 침묵했다가 말했다. "청사 진입 그날 밤. 저는 알고 있었어요. 강경파 계획을." 새하는 아무 말도 하지 않았다.',
      },
      {
        text: '기다린다',
        apply: s => {
          s.flags.doyulRel = (s.flags.doyulRel || 50) + 2;
          addLog('도율을 기다렸다.');
        },
        result: '4일 후 도율이 먼저 왔다. "말해야 할 게 있어요." 그 이야기는 길었다.',
      },
    ],
  },
  {
    id: 'succession_wait', weight: 7,
    condition: s => s.sucQueue > 20 && s.turn > 10,
    type: 'crisis', title: '승계 대기자의 항의',
    body: `대기 4년이 넘은 시민이 운영위원장실에 왔다.

분노하지 않았다. 그냥 물었다.

"저는 언제쯤 될까요."

새하는 그 질문에 즉시 답을 할 수 없었다.`,
    choices: [
      {
        text: '우선순위를 조정해 빨리 처리한다 (식량 -10)',
        needFood: 10,
        apply: s => {
          s.res.food -= 10;
          s.res.morale += 5;
          if (s.sucQueue > 0) { s.sucQueue--; s.res.pop++; s.stats.sucOk++; }
          addLog('승계 우선순위 조정. 대기자 처리.');
        },
        result: '처리됐다. 그는 감사하다는 말 없이 돌아갔다. 기다렸던 사람에게는 당연한 것이었다.',
      },
      {
        text: '기준을 설명하고 기다리게 한다',
        apply: s => {
          addLog('승계 기준 설명. 대기 유지.');
        },
        result: '3개월 후 그는 승계됐다. 이식률 78%. 일부 기억이 흐려졌다. 그가 기다린 이유가 그 중에 있었는지 새하는 몰랐다.',
      },
      {
        text: '이음단 상담을 연결해준다',
        apply: s => {
          s.flags.eumRel = (s.flags.eumRel || 40) + 3;
          addLog('이음단 상담 연결.');
        },
        result: '"잃을 게 뭔지 알고 기다린 거예요." 이음이 나중에 새하에게 말했다.',
      },
    ],
  },
  {
    id: 'hanto_dropout', weight: 5,
    condition: s => s.res.hanto > 40 && s.turn > 20,
    type: 'crisis', title: '항도 이탈자',
    body: `항도 신자 한 명이 공개적으로 탈퇴를 선언했다.

"왜 이렇게 힘든가. 항도가 답을 준다고 했는데."

다른 신자들이 동요하고 있다.`,
    choices: [
      {
        text: '개입하지 않는다',
        apply: s => {
          s.res.hanto -= 8;
          addLog('항도 이탈 방관. 지지율 하락.');
        },
        result: '일주일 후 5명이 더 이탈했다.',
      },
      {
        text: '새하가 직접 그를 만난다',
        apply: s => {
          s.res.morale += 3;
          s.flags.hantoInnerFlag = true;
          addLog('이탈자 직접 면담. 새하 내면 질문.');
        },
        result: '"위원장님은 믿는 게 있어요?" 그 질문에 새하는 바로 답하지 못했다.',
      },
      {
        text: '오래된 자에게 맡긴다',
        apply: s => {
          s.res.hanto += 2;
          s.flags.elderRel = (s.flags.elderRel || 60) + 3;
          addLog('오래된 자가 이탈자를 만났다.');
        },
        result: '오래된 자가 그를 만나고 왔다. "있어요. 그냥 오늘은 못 보인 거예요."',
      },
    ],
  },
  {
    id: 'hanto_eum_conflict', weight: 4,
    condition: s => s.res.hanto > 45 && s.flags.eumRel >= 40,
    type: 'crisis', title: '항도와 이음단의 갈등',
    body: `항도 신자들이 승계실 안에서 의례를 하고 싶다고 요청했다.

이음이 거부했다.

"시술은 정확해야 합니다. 감정이 개입되면 집중이 흐려져요."

오래된 자: "기억을 잇는 것에 마음이 없으면 기술만 남아요."

양쪽이 새하에게 결정을 요청했다.`,
    choices: [
      {
        text: '항도 의례를 허용한다',
        apply: s => {
          s.res.hanto += 8;
          s.flags.eumRel = Math.max(0, (s.flags.eumRel || 40) - 8);
          addLog('항도 의례 허용. 이음단 불만.');
        },
        result: '"다음엔 묻지 않겠습니다." 이음의 말이 위협처럼 들렸다. 아마 위협이 맞았다.',
      },
      {
        text: '이음단의 방침을 지지한다',
        apply: s => {
          s.flags.eumRel = (s.flags.eumRel || 40) + 5;
          s.res.hanto -= 5;
          addLog('이음단 지지. 항도 지지율 하락.');
        },
        result: '오래된 자가 말했다. "둘 다 맞아요. 그래서 어려운 거예요."',
      },
      {
        text: '타협안: 시술 전후 짧은 의례만 허용',
        apply: s => {
          s.res.hanto += 3;
          s.flags.eumRel = (s.flags.eumRel || 40) + 3;
          addLog('항도-이음단 타협. 양측 수용.');
        },
        result: '아무도 완전히 만족하지 않았다. 그래서 타협이었다.',
      },
    ],
  },
  {
    id: 'jinseo_meeting', weight: 4,
    condition: s => s.turn > 18 && !s.flags.jinseoMetDone,
    type: 'threat', title: '진서의 면담 요청',
    body: `기득권 수석 위원 진서가 직접 면담을 요청했다.

이례적인 일이었다.

도율이 말했다. "조심해요. 그 사람이 먼저 움직일 때는 이유가 있어요."`,
    choices: [
      {
        text: '단독으로 수락한다',
        apply: s => {
          s.flags.eliteRel -= 5;
          s.flags.jinseoMetDone = true;
          addLog('진서 단독 면담. 정보 획득.');
        },
        result: '"생각보다 오래 버텼어요." 진서가 말했다. 칭찬인지 경고인지 알 수 없었다.',
      },
      {
        text: '하온을 동반한다',
        apply: s => {
          s.flags.haonRel = (s.flags.haonRel || 35) + 5;
          s.flags.jinseoMetDone = true;
          addLog('하온 동반 면담. 하온-진서 구면 확인.');
        },
        result: '하온과 진서가 눈빛을 교환했다. 아는 사이였다. 새하는 그것을 기억해뒀다.',
      },
      {
        text: '거절한다',
        apply: s => {
          s.flags.eliteRel += 10;
          s.flags.jinseoMetDone = true;
          s.res.food -= 10;
          addLog('진서 면담 거절. 기득권 압박 증가.');
        },
        result: '다음 달 식량 공급이 줄었다. 우연이라고 하기엔 타이밍이 정확했다.',
      },
    ],
  },
  {
    id: 'moo_kyung_warning', weight: 4,
    condition: s => s.flags.seonuConflictDone && !s.flags.mooKyungWarned,
    type: 'opportunity', title: '무경의 비공식 경고',
    body: `비공식 경로로 메시지가 왔다.

보안국장 무경.

"강무를 조심하세요. 개인적인 말입니다."

새하는 그 메시지를 오래 바라봤다.`,
    choices: [
      {
        text: '무경을 직접 만난다',
        apply: s => {
          s.flags.eliteRel += 3;
          s.flags.mooKyungWarned = true;
          addLog('무경 직접 면담.');
        },
        result: '"저는 당신의 적이 아닙니다." 무경이 말했다. "하지만 우리 편도 아닌 건 사실이에요." 그것이 이상하게 솔직하게 들렸다.',
      },
      {
        text: '강무를 더 주시한다',
        apply: s => {
          s.flags.kangmuRel = Math.max(0, (s.flags.kangmuRel || 40) - 3);
          s.flags.mooKyungWarned = true;
          addLog('강무 감시 강화.');
        },
        result: '강무는 계속 움직였다. 조용하게.',
      },
      {
        text: '무시한다',
        apply: s => {
          s.flags.mooKyungWarned = true;
          s.flags.kangmuDangerous = true;
          addLog('무경 경고 무시.');
        },
        result: '이틀 후 강무가 중립 구역 대표와 비공식 접촉했다는 보고가 들어왔다.',
      },
    ],
  },
  {
    id: 'soy_info', weight: 3,
    condition: s => s.turn > 30 && !s.flags.soyInfoDone,
    type: 'opportunity', title: '소이의 정보 거래 제안',
    body: `익명 메시지.

"기득권 내부 정보와 교환할 것이 있습니다."

하온이 말했다. "소이예요. 아마도."`,
    choices: [
      {
        text: '수락한다',
        apply: s => {
          s.flags.soyInfoDone = true;
          s.flags.soyTrustBuilt = true;
          addLog('소이 정보 거래 수락. 예상치 못한 결과.');
        },
        result: '소이가 원한 건 정보 거래가 아니었다. 새하를 직접 보고 싶었던 것이다. 정보는 그냥 줬다.',
      },
      {
        text: '하온을 통해 탐색한다',
        apply: s => {
          s.flags.haonRel = (s.flags.haonRel || 35) + 5;
          s.flags.soyInfoDone = true;
          addLog('하온 경로로 소이 탐색.');
        },
        result: '하온이 말했다. "소이는 진서 편이 아닌 것 같아요. 혼자 움직이고 있어요."',
      },
    ],
  },
  {
    id: 'old_one_last_broadcast', weight: 3,
    condition: s => s.flags.elderLastDone && !s.flags.elderBroadcastDone && s.turn > 45,
    type: 'story', title: '오래된 자의 마지막 강연',
    body: `오래된 자가 전체 방송 요청을 보내왔다.

도율이 말했다. "내용을 모르겠어요. 그냥 방송을 틀어달라고 해요."

새하는 잠깐 생각했다.`,
    choices: [
      {
        text: '방송을 허용한다',
        apply: s => {
          s.res.hanto += 10;
          s.flags.elderBroadcastDone = true;
          s.flags.elderLastBroadcast = true;
          addLog('오래된 자 마지막 방송 허용.');
        },
        result: '아크 제로 전체에 목소리가 울렸다. "이 항해는 끝나지 않을 것입니다. 우리가 그린에 닿더라도. 항해는 계속됩니다. 다만 배가 달라질 뿐이에요."',
      },
      {
        text: '내용을 먼저 확인한다',
        apply: s => {
          s.flags.elderRel = Math.max(0, (s.flags.elderRel || 60) - 5);
          s.flags.elderBroadcastDone = true;
          addLog('오래된 자 방송 내용 검열 요청. 관계 냉각.');
        },
        result: '오래된 자가 잠깐 침묵했다. "확인하셔도 돼요." 그 침묵이 더 무거웠다.',
      },
    ],
  },
];

// ─── 렌더링 ─────────────────────────────────────────
function render() {
  renderHUD();
  renderZones();
  renderStatus();
  renderActions();
  if (S.selected !== null) selectZone(S.selected);
}

function renderHUD() {
  const year  = C.START_YEAR + Math.floor(S.turn / C.TURNS_PER_YEAR);
  const month = (S.turn % C.TURNS_PER_YEAR) + 1;
  el('hud-year').textContent  = year;
  el('hud-month').textContent = month;

  el('val-pop').textContent = S.res.pop.toLocaleString();

  const d = calcDelta();

  el('val-food').textContent   = Math.max(0, S.res.food);
  el('val-energy').textContent = Math.max(0, Math.round(S.res.energy));
  el('val-morale').textContent = Math.round(S.res.morale);
  el('val-hanto').textContent  = Math.round(S.res.hanto);
  el('val-suc').textContent    = `${S.sucQueue}명`;

  setDelta('delta-food',   d.food);
  setDelta('delta-energy', d.energy);

  el('rb-food').classList.toggle('crisis',   S.res.food   < C.FOOD_CRISIS);
  el('rb-energy').classList.toggle('crisis', S.res.energy < C.ENERGY_CRISIS);
  el('val-suc').classList.toggle('urgent',   S.sucQueue   > 50);
}

function setDelta(id, val) {
  const e = el(id);
  if (!e) return;
  e.textContent = val >= 0 ? `+${val}` : `${val}`;
  e.className   = 'delta ' + (val >= 0 ? 'pos' : 'neg');
}

function renderZones() {
  const container = el('zones-list');
  const TYPE_ICON = { food:'🌾', power:'⚡', tech:'🔧', housing:'🏠', culture:'🎭' };
  let html = '';

  const players  = S.zones.filter(z => z.owner === 'player');
  const neutrals = S.zones.filter(z => z.owner === 'neutral');

  html += `<div class="zone-group-label">자치 구역</div>`;
  players.forEach(z => { html += zoneCard(z, TYPE_ICON); });

  if (neutrals.length > 0) {
    html += `<div class="zone-group-label" style="margin-top:8px">중립 구역</div>`;
    neutrals.slice(0, 7).forEach(z => { html += zoneCard(z, TYPE_ICON); });
    if (neutrals.length > 7) {
      html += `<div class="zone-card" style="opacity:0.4;font-size:11px;padding:6px 10px;border:1px solid var(--border)">+${neutrals.length - 7}개 더 있음</div>`;
    }
  }

  container.innerHTML = html;

  container.querySelectorAll('.zone-card[data-id]').forEach(card => {
    card.addEventListener('click', () => selectZone(parseInt(card.dataset.id)));
    if (parseInt(card.dataset.id) === S.selected) card.classList.add('selected');
  });
}

function zoneCard(z, icons) {
  const condClass = z.cond >= 80 ? 'good' : z.cond >= 55 ? 'ok' : 'poor';
  const facs = (z.fac || []).map(f => BUILDINGS[f] ? `<span class="fac-dot">${BUILDINGS[f].icon}</span>` : '').join('');
  const tag  = z.owner === 'neutral'
    ? `<span class="zc-tag neutral">중립</span>`
    : `<span class="zc-cond ${condClass}">${Math.round(z.cond)}%</span>`;
  return `
    <div class="zone-card owner-${z.owner}" data-id="${z.id}">
      <div class="zone-card-head">
        <span class="zc-icon">${icons[z.type] || '🔲'}</span>
        <span class="zc-name">${z.name}</span>
        ${tag}
      </div>
      ${facs ? `<div class="zc-fac">${facs}</div>` : ''}
      <div class="zc-pop">${z.pop ? z.pop.toLocaleString() : z.population?.toLocaleString() || ''}명</div>
    </div>`;
}

function selectZone(id) {
  S.selected = id;
  const z = S.zones.find(z => z.id === id);
  if (!z) return;

  const TYPE_ICON = { food:'🌾', power:'⚡', tech:'🔧', housing:'🏠', culture:'🎭' };
  const TYPE_NAME = { food:'식량 구역', power:'발전 구역', tech:'기술 구역', housing:'주거 구역', culture:'문화 구역' };
  const OWNER_NAME = { player:'자치', neutral:'중립', enemy:'기득권' };
  const pop = z.pop || z.population || 0;
  const cond = z.cond;
  const condClass = cond >= 80 ? 'good' : cond >= 55 ? 'ok' : 'poor';

  let facHtml = '';
  if (z.owner === 'player') {
    const maxSlots = z.slots || TYPE_SLOTS[z.type] || 3;
    const facs = z.fac || [];
    const slotItems = facs.map((fid, idx) => {
      const b = BUILDINGS[fid];
      if (!b) return '';
      return `
        <div class="slot filled">
          <span class="slot-icon">${b.icon}</span>
          <div class="slot-info">
            <span class="slot-name">${b.name}</span>
            <span class="slot-desc">${b.prodDesc || b.desc}</span>
          </div>
          <button class="slot-remove" onclick="removeBuilding(${z.id},${idx})" title="철거">✕</button>
        </div>`;
    }).join('');

    const emptyCount = maxSlots - facs.length;
    const emptySlots = emptyCount > 0
      ? `<div class="slot empty" onclick="toggleBuildMenu(${z.id})">
           <span class="slot-plus">+</span>
           <span class="slot-label">건설 (${emptyCount}슬롯 남음)</span>
         </div>`
      : '';

    let buildMenuHtml = '';
    if (S.buildMenuOpen === z.id) {
      const TIER_COLOR = { 1:'#6b8fa8', 2:'#4a90d9', 3:'#c9a227' };
      const groupsHtml = BUILDING_GROUPS.map(grp => {
        const items = grp.ids.map(bid => ({ bid, b: BUILDINGS[bid] })).filter(x => x.b);
        // 카테고리 내 건물이 모두 잠겨있으면 숨김
        if (items.every(({ b }) => b.unlock && !S.systems[b.unlock])) return '';

        const chainHtml = items.map(({ bid, b }, i) => {
          const locked   = b.unlock && !S.systems[b.unlock];
          const canAfford = !locked && S.res.food >= b.buildCost.food && S.res.energy >= b.buildCost.energy;
          const tierColor = TIER_COLOR[b.tier] || '#888';
          const badge     = b.tier ? `<span class="bm-tier-badge" style="background:${tierColor}">T${b.tier}</span>` : '';
          const costStr   = locked ? '🔒 잠김' : `식량 ${b.buildCost.food} · 에너지 ${b.buildCost.energy}`;
          const arrow     = i > 0 ? `<span class="bm-arrow">▶</span>` : '';
          return `${arrow}<div class="bm-item ${canAfford ? 'bm-can' : 'bm-disabled'} ${locked ? 'bm-locked' : ''}"
                        onclick="${canAfford ? `buildInZone(${z.id},'${bid}')` : ''}">
              ${badge}
              <span class="bm-icon">${b.icon}</span>
              <div class="bm-info">
                <span class="bm-name">${b.name}</span>
                <span class="bm-desc">${b.prodDesc}</span>
              </div>
              <span class="bm-cost">${costStr}</span>
            </div>`;
        }).join('');

        return `<div class="bm-category">
          <div class="bm-cat-label">${grp.label}</div>
          <div class="bm-tier-chain">${chainHtml}</div>
        </div>`;
      }).join('');

      buildMenuHtml = `
        <div class="build-menu">
          <div class="bm-title">건설할 건물 선택</div>
          ${groupsHtml}
          <button class="bm-cancel" onclick="toggleBuildMenu(${z.id})">취소</button>
        </div>`;
    }

    facHtml = `
      <div class="building-slots">
        <div class="bs-header">
          <span class="bs-title">건물 슬롯</span>
          <span class="bs-count">${facs.length}/${maxSlots}</span>
        </div>
        ${slotItems}
        ${emptySlots}
        ${buildMenuHtml}
      </div>`;
  }

  // 콤보 보너스 표시
  let comboHtml = '';
  if (z.owner === 'player') {
    const fac = z.fac || [];
    const combos = [];
    if ((fac.includes('farm') || fac.includes('hydroponics')) && fac.includes('workshop'))
      combos.push('🌾🔧 효율적 유지보수: 식량 +3/월');
    if (fac.includes('cultural_center') && fac.includes('meditation'))
      combos.push('🎭🪷 문화·명상 시너지: 항도 +2/월');
    if (fac.includes('powerplant') && fac.includes('solar_array'))
      combos.push('⚡☀️ 전력망 안정화: 에너지 +2/월');
    if (fac.includes('propaganda') && fac.includes('cultural_center'))
      combos.push('⚠️ 선전·문화 충돌: 사기·항도 각 -1/월');
    if (combos.length > 0)
      comboHtml = `<div class="combo-box">${combos.map(c => `<div class="combo-item">${c}</div>`).join('')}</div>`;
  }

  let actHtml = '';
  if (z.owner === 'player') {
    const repairEff = 15 + (S.policies.techFocus ? Math.round(15*0.15) : 0) + ((z.fac||[]).includes('workshop') ? 1 : 0);
    actHtml = `
      <div class="zone-actions">
        <button class="btn-action" onclick="repairZone(${z.id})">🔧 시설 수리 (식량 10, 에너지 20) → +${repairEff}%</button>
      </div>`;
  } else if (z.owner === 'neutral') {
    const hasTrade = S.zones.filter(z2 => z2.owner === 'player').flatMap(z2 => z2.fac).includes('trading_post');
    const mergeRate = Math.round((0.35 + S.res.morale/200 + (S.policies.expansion?0.15:0) + (hasTrade?0.10:0)) * 100);
    actHtml = `
      <div class="zone-actions">
        <button class="btn-action expand" onclick="expandZone(${z.id})">🤝 병합 협상 (식량 40 필요) · 성공률 약 ${mergeRate}%</button>
      </div>`;
  }

  el('zone-detail').innerHTML = `
    <div class="detail-header">
      <span class="detail-icon">${TYPE_ICON[z.type] || '🔲'}</span>
      <div class="detail-title">
        <h2>${z.name}</h2>
        <div class="detail-subtitle">${TYPE_NAME[z.type] || z.type} · ${OWNER_NAME[z.owner]}</div>
      </div>
    </div>
    <div class="detail-desc">${z.desc || ''}</div>
    <div class="detail-stats">
      <div class="ds-item">
        <div class="ds-label">시설 상태</div>
        <div class="ds-value">${Math.round(cond)}%</div>
        <div class="cond-bar"><div class="cond-fill ${condClass}" style="width:${cond}%"></div></div>
      </div>
      <div class="ds-item">
        <div class="ds-label">거주 인구</div>
        <div class="ds-value">${pop.toLocaleString()}명</div>
      </div>
    </div>
    ${facHtml}
    ${comboHtml}
    ${actHtml}`;

  // 선택 표시 갱신
  document.querySelectorAll('.zone-card').forEach(c => {
    c.classList.toggle('selected', parseInt(c.dataset.id) === id);
  });
}

function renderStatus() {
  const d = calcDelta();
  const owned = S.zones.filter(z => z.owner === 'player').length;

  const warns = [];
  if (S.res.food      < C.FOOD_CRISIS)   warns.push('⚠ 식량 위기 임박');
  if (S.res.energy    < C.ENERGY_CRISIS) warns.push('⚠ 에너지 위기 임박');
  if (S.sucQueue      > 50)              warns.push('⚠ 승계 대기자 과다');
  if (S.res.morale    < 30)              warns.push('⚠ 주민 사기 저하');
  if (S.flags.eliteRel < 15)             warns.push('⚠ 기득권 관계 위험');

  const eliteLabel = S.flags.eliteRel < 30 ? '적대적' : S.flags.eliteRel < 60 ? '중립' : '협력적';

  // 인물 관계 요약
  const charRows = [];
  if (S.flags.doyulRel !== undefined) {
    const label = S.flags.doyulRel >= 65 ? '신뢰' : S.flags.doyulRel >= 40 ? '협력' : '냉랭';
    charRows.push(`도율 ${label}`);
  }
  if (S.flags.seonuRel !== undefined) {
    const label = S.flags.seonuRel >= 50 ? '동맹' : S.flags.seonuRel >= 30 ? '중립' : '갈등';
    charRows.push(`선우 ${label}`);
  }
  if (S.flags.eumRel !== undefined) {
    const label = S.flags.eumRel >= 55 ? '신뢰' : S.flags.eumRel >= 35 ? '협력' : '냉랭';
    charRows.push(`이음 ${label}`);
  }
  if (S.flags.haonRel !== undefined) {
    const label = S.flags.haonRel >= 50 ? '신뢰' : S.flags.haonRel >= 30 ? '협력' : '냉랭';
    charRows.push(`하온 ${label}`);
  }
  if (S.flags.byeolRel !== undefined) {
    const label = S.flags.byeolRel >= 40 ? '신뢰' : S.flags.byeolRel >= 20 ? '중립' : '소원';
    charRows.push(`별 ${label}`);
  }
  if (S.flags.elderRel !== undefined) {
    const label = S.flags.elderRel >= 65 ? '신뢰' : S.flags.elderRel >= 40 ? '협력' : '냉랭';
    charRows.push(`오래된 자 ${label}`);
  }
  const charHtml = charRows.length
    ? `<div class="char-rel-section"><div class="char-rel-title">인물 관계</div><div class="char-rel-grid">${charRows.map(r => `<span class="char-rel-item">${r}</span>`).join('')}</div></div>`
    : '';

  el('status-box').innerHTML = `
    <div class="sum-grid">
      <div class="sum-item ${d.food >= 0 ? 'pos' : 'neg'}">
        <span class="sum-label">식량 변화</span>
        <span class="sum-val">${d.food >= 0 ? '+' : ''}${d.food}/월</span>
      </div>
      <div class="sum-item ${d.energy >= 0 ? 'pos' : 'neg'}">
        <span class="sum-label">에너지 변화</span>
        <span class="sum-val">${d.energy >= 0 ? '+' : ''}${d.energy}/월</span>
      </div>
      <div class="sum-item">
        <span class="sum-label">자치 구역</span>
        <span class="sum-val">${owned}/47</span>
      </div>
      <div class="sum-item">
        <span class="sum-label">승계 대기</span>
        <span class="sum-val">${S.sucQueue}명</span>
      </div>
      <div class="sum-item ${S.flags.eliteRel < 30 ? 'neg' : ''}">
        <span class="sum-label">기득권 관계</span>
        <span class="sum-val">${eliteLabel}</span>
      </div>
    </div>
    ${warns.length ? `<div class="warn-list">${warns.map(w => `<div class="warn-item">${w}</div>`).join('')}</div>` : ''}
    ${charHtml}`;
}

function renderActions() {
  const canSuc = S.res.food >= C.SUC_FOOD && S.res.energy >= C.SUC_ENERGY && S.sucQueue > 0;

  const policyHtml = Object.entries(POLICIES).map(([pid, p]) => {
    const on = S.policies[pid];
    return `
      <div class="policy-item">
        <div class="policy-info">
          <span class="policy-icon">${p.icon}</span>
          <div>
            <div class="policy-name">${p.name}</div>
            <div class="policy-desc">${p.desc}</div>
          </div>
        </div>
        <button class="policy-toggle ${on ? 'on' : 'off'}" onclick="togglePolicy('${pid}')">${on ? 'ON' : 'OFF'}</button>
      </div>`;
  }).join('');

  el('action-box').innerHTML = `
    <div class="action-btn-wrap">
      <button class="action-btn" onclick="doSuccession()" ${canSuc ? '' : 'disabled'}>
        <span class="act-name">🔬 승계 시행</span>
        <span class="act-cost">식량 ${C.SUC_FOOD} · 에너지 ${C.SUC_ENERGY} · 대기자 ${S.sucQueue}명</span>
      </button>
    </div>`;

  // 정책 패널
  const policySection = el('policy-section');
  if (policySection) policySection.innerHTML = policyHtml;
}

// ─── 게임 종료 화면 ─────────────────────────────────
function showEnd(result) {
  S.phase = 'gameover';
  el('game-screen').style.opacity = '0.2';

  const year  = C.START_YEAR + Math.floor(S.turn / C.TURNS_PER_YEAR);
  const owned = S.zones.filter(z => z.owner === 'player').length;

  el('end-type').textContent  = result.type === 'win' ? '— 항해는 계속된다 —' : '— 항해가 멈췄다 —';
  el('end-type').className    = result.type;
  el('end-title').textContent = result.title;
  el('end-msg').textContent   = result.msg;

  el('end-stats').innerHTML = `
    <div class="stats-grid">
      <div class="stat-final"><div class="stat-num">${year}년</div><div class="stat-lbl">도달 시점</div></div>
      <div class="stat-final"><div class="stat-num">${owned}/47</div><div class="stat-lbl">자치 구역</div></div>
      <div class="stat-final"><div class="stat-num">${S.stats.sucOk}</div><div class="stat-lbl">성공한 승계</div></div>
      <div class="stat-final"><div class="stat-num">${S.res.pop.toLocaleString()}</div><div class="stat-lbl">남은 인구</div></div>
    </div>`;

  el('end-screen').classList.remove('hidden');
}

// ─── 구역 수 업데이트 ────────────────────────────────
function updateZoneCounts() {
  el('cnt-player').textContent  = S.zones.filter(z => z.owner === 'player').length;
  el('cnt-neutral').textContent = S.zones.filter(z => z.owner === 'neutral').length;
  el('cnt-enemy').textContent   = S.zones.filter(z => z.owner === 'enemy').length;
}

// ─── 유틸 ───────────────────────────────────────────
function el(id) { return document.getElementById(id); }

function addLog(msg) {
  const year  = C.START_YEAR + Math.floor(S.turn / C.TURNS_PER_YEAR);
  const month = (S.turn % C.TURNS_PER_YEAR) + 1;
  S.log.unshift({ t: `${year}년 ${month}월`, msg });
  if (S.log.length > 20) S.log.pop();
  const box = el('log-entries');
  if (box) box.innerHTML = S.log.slice(0, 8).map(e =>
    `<div class="log-entry"><span class="log-time">${e.t}</span><span class="log-msg">${e.msg}</span></div>`
  ).join('');
}

function notify(msg, type = 'info') {
  const prev = document.querySelector('.notif');
  if (prev) prev.remove();
  const n = document.createElement('div');
  n.className = `notif ${type}`;
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => n.classList.add('show'), 30);
  setTimeout(() => { n.classList.remove('show'); setTimeout(() => n.remove(), 300); }, 3000);
}

// ─── 초기화 & 이벤트 리스너 ─────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  el('btn-start').addEventListener('click', () => {
    el('intro-screen').classList.add('hidden');
    el('game-screen').classList.remove('hidden');
    newGame();
    render();
    // 첫 스토리 이벤트
    setTimeout(() => {
      const first = STORY_EVENTS.find(e => e.id === 'intro');
      if (first) { S.flags['done_intro'] = true; showEvent(first); }
    }, 600);
  });

  el('btn-turn').addEventListener('click', nextTurn);

  el('btn-restart').addEventListener('click', () => {
    el('end-screen').classList.add('hidden');
    el('game-screen').style.opacity = '1';
    newGame();
    render();
  });
});
