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
  START_MORALE: 45,
  START_SUC_QUEUE: 38,

  FOOD_CRISIS:   40,
  ENERGY_CRISIS: 20,
  POP_LOSE:      500,

  WIN_ZONES: 24,
  WIN_TURNS: 72,

  SUC_FOOD:   30,
  SUC_ENERGY: 20,
};

// ─── 건물 정의 ──────────────────────────────────────
const BUILDINGS = {
  farm:            { name: '농장',       icon: '🌾', foodPerTurn: 8,  energyDrain: 1, buildCost: { food: 20, energy: 30 }, desc: '식량 +8/월', prodDesc: '+8식량' },
  powerplant:      { name: '발전소',     icon: '⚡', energyPerTurn:12, buildCost: { food: 10, energy: 0 },  desc: '에너지 +12/월', prodDesc: '+12에너지' },
  housing:         { name: '주거 구역',  icon: '🏠', moraleBonus: 2,  buildCost: { food: 15, energy: 20 }, desc: '사기 +2 (설치 즉시)', prodDesc: '+2사기' },
  workshop:        { name: '기술 작업장',icon: '🔧', repairBonus: 5,  energyDrain: 2, buildCost: { food: 10, energy: 25 }, desc: '수리 효율 +5%', prodDesc: '수리↑' },
  cultural_center: { name: '문화 구역',  icon: '🎭', moralePerTurn: 3,buildCost: { food: 10, energy: 15 }, desc: '사기 +3/월', prodDesc: '+3사기/월' },
  succession_lab:  { name: '승계 실험실',icon: '🔬', sucBonus: 15,    energyDrain: 3, buildCost: { food: 20, energy: 40 }, desc: '승계 성공률 +15%', prodDesc: '승계↑', unlock: 'sucLabUnlocked' },
};

// ─── 정책 정의 ──────────────────────────────────────
const POLICIES = {
  foodRation:  { name: '배급 통제',   icon: '🌾', desc: '식량 소비 -1/월, 사기 -1/월',    deltaFood: 1,  deltaMorale: -1 },
  energySave:  { name: '에너지 절약', icon: '⚡', desc: '에너지 +3/월, 사기 -1/월',       deltaEnergy: 3, deltaMorale: -1 },
  openCulture: { name: '문화 개방',   icon: '🎭', desc: '사기 +3/월, 에너지 -2/월',       deltaMorale: 3, deltaEnergy: -2 },
  sucFocus:    { name: '승계 우선',   icon: '🔬', desc: '승계 성공률 +15%',               sucBonus: 0.15 },
  expansion:   { name: '확장 집중',   icon: '📡', desc: '병합 성공률 +15%',              expandBonus: 0.15 },
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
    },
    zones: buildZones(),
    sucQueue: C.START_SUC_QUEUE,
    flags: { storyStage: 0 },
    policies: { foodRation: false, energySave: false, openCulture: false, sucFocus: false, expansion: false },
    systems: { sucBasic: true, hanto: false, zoneMerge: false, sucAdvanced: false, eliteRelations: false },
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
  const player = [
    { id:3,  name:'3구역',  type:'food',    owner:'player',  cond:62, fac:['farm'],                     pop:520, desc:'주요 식량 구역. 설비 노후화로 수율 저하.', special:'hidden_farm' },
    { id:7,  name:'7구역',  type:'power',   owner:'player',  cond:71, fac:['powerplant'],               pop:480, desc:'전력 공급 구역. 핵심 설비 노후화 중.' },
    { id:11, name:'11구역', type:'tech',    owner:'player',  cond:95, fac:['workshop'],                 pop:460, desc:'기술 구역. 새하의 본거지. 설계도 보관.', special:'design_docs' },
    { id:15, name:'15구역', type:'housing', owner:'player',  cond:78, fac:['housing','housing'],        pop:620, desc:'주거 구역. 인구 과밀 상태.' },
    { id:19, name:'19구역', type:'culture', owner:'player',  cond:55, fac:['cultural_center'],          pop:320, desc:'문화 구역. 전력 부족으로 부분 가동. 항도 거점.', special:'elder_base' },
  ].map(z => ({ ...z, slots: TYPE_SLOTS[z.type] || 3 }));
  const neutral = [
    { id:2,  name:'2구역',  type:'food',    owner:'neutral', cond:70, fac:[], pop:200, desc:'중립 식량 구역.' },
    { id:5,  name:'5구역',  type:'power',   owner:'neutral', cond:65, fac:[], pop:150, desc:'중립 발전 구역.' },
    { id:8,  name:'8구역',  type:'housing', owner:'neutral', cond:80, fac:[], pop:350, desc:'중립 주거 구역.' },
    { id:12, name:'12구역', type:'tech',    owner:'neutral', cond:75, fac:[], pop:180, desc:'중립 기술 구역. 기득권 압박 받는 중.' },
    { id:16, name:'16구역', type:'food',    owner:'neutral', cond:85, fac:[], pop:280, desc:'중립 식량 구역. 자급자족 상태.' },
    { id:20, name:'20구역', type:'culture', owner:'neutral', cond:60, fac:[], pop:120, desc:'중립 문화 구역. 항도 신자가 많음.' },
    { id:23, name:'23구역', type:'housing', owner:'neutral', cond:72, fac:[], pop:400, desc:'중립 주거 구역. 식량 부족 문제 있음.' },
    { id:27, name:'27구역', type:'food',    owner:'neutral', cond:68, fac:[], pop:190, desc:'중립 식량 구역.' },
    { id:31, name:'31구역', type:'power',   owner:'neutral', cond:58, fac:[], pop:140, desc:'중립 발전 구역. 설비 불안정.' },
    { id:35, name:'35구역', type:'tech',    owner:'neutral', cond:82, fac:[], pop:210, desc:'중립 기술 구역.' },
    { id:39, name:'39구역', type:'housing', owner:'neutral', cond:77, fac:[], pop:380, desc:'중립 주거 구역.' },
    { id:43, name:'43구역', type:'food',    owner:'neutral', cond:73, fac:[], pop:160, desc:'중립 식량 구역.' },
  ].map(z => ({ ...z, slots: TYPE_SLOTS[z.type] || 3 }));

  const enemyIds = [1,4,6,9,10,13,14,17,18,21,22,24,25,26,28,29,30,32,33,34,36,37,38,40,41,42,44,45,46,47];
  const types = ['food','power','housing','tech','culture'];
  const enemy = enemyIds.map(id => ({
    id, name:`${id}구역`, type: types[id % 5],
    owner: 'enemy', cond: 55 + (id % 35),
    fac: [], pop: 180 + (id * 17) % 400,
    slots: TYPE_SLOTS[types[id % 5]] || 3,
    desc: '기득권 통제 구역.',
  }));

  return [...player, ...neutral, ...enemy];
}

// ─── 자원 계산 ──────────────────────────────────────
function calcDelta() {
  const myZones = S.zones.filter(z => z.owner === 'player');
  let foodProd = 0, energyProd = 0, energyDrain = myZones.length * 2;

  myZones.forEach(z => {
    const eff = z.cond / 100;
    (z.fac || []).forEach(fid => {
      const b = BUILDINGS[fid];
      if (!b) return;
      if (b.foodPerTurn)  foodProd    += b.foodPerTurn  * eff;
      if (b.energyPerTurn)energyProd  += b.energyPerTurn* eff;
      if (b.energyDrain)  energyDrain += b.energyDrain;
    });
  });

  const foodCon = Math.ceil(S.res.pop / 200);
  const energyPenalty = S.flags.energyPenalty || 0;

  let moraleDelta = 0;
  const culturalCount = myZones.flatMap(z => z.fac).filter(f => f === 'cultural_center').length;
  moraleDelta += culturalCount * 1;
  if (S.res.food   < C.FOOD_CRISIS)   moraleDelta -= 2;
  else if (S.res.food > 120)           moraleDelta += 1;
  if (S.res.energy < C.ENERGY_CRISIS) moraleDelta -= 2;
  if (S.res.morale > 70) moraleDelta -= 1;
  if (S.res.morale < 30) moraleDelta += 1;

  // 정책 효과 적용
  let pFoodDelta = 0, pEnergyDelta = 0, pMoraleDelta = 0;
  Object.entries(S.policies).forEach(([pid, on]) => {
    if (!on) return;
    const p = POLICIES[pid];
    if (p.deltaFood)   pFoodDelta   += p.deltaFood;
    if (p.deltaEnergy) pEnergyDelta += p.deltaEnergy;
    if (p.deltaMorale) pMoraleDelta += p.deltaMorale;
  });

  return {
    food:   Math.floor(foodProd) - foodCon + pFoodDelta,
    energy: Math.floor(energyProd) - energyDrain - energyPenalty + pEnergyDelta,
    morale: moraleDelta + pMoraleDelta,
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

  // 에너지 패널티 감소
  if (S.flags.energyPenalty > 0) S.flags.energyPenalty = Math.max(0, S.flags.energyPenalty - 3);

  // 구역 자연 노후화
  S.zones.filter(z => z.owner === 'player').forEach(z => {
    z.cond = Math.max(20, z.cond - 0.4);
  });

  // 승계 대기자 자연 증가
  if (S.turn % 4 === 0) S.sucQueue += Math.floor(S.res.pop / 600);

  // 스토리 단계 갱신
  const owned = S.zones.filter(z => z.owner === 'player').length;
  if (owned >= 8  && S.flags.storyStage < 1) S.flags.storyStage = 1;
  if (owned >= 14 && S.flags.storyStage < 2) S.flags.storyStage = 2;
  if (owned >= 20 && S.flags.storyStage < 3) S.flags.storyStage = 3;

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
  if (owned >= C.WIN_ZONES) return { type:'win', title:'아크 제로를 되찾다', msg:`새하의 자치 구역이 아크 제로의 절반 이상을 포괄하게 됐다.\n\n기득권은 협상 테이블로 돌아왔다.\n우주선은 계속 날아간다.\n\n케플러 그린이 가까워지고 있다.` };
  if (S.turn >= C.WIN_TURNS) return { type:'win', title:'항해는 계속된다',   msg:`${C.WIN_TURNS}달. 새하는 버텼다.\n\n자치 구역은 살아있다. 아크 제로는 오늘도 날아가고 있다.\n\n케플러 그린이 조금 더 가까워졌다.` };

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

  const sucLabCount = S.zones.filter(z => z.owner === 'player').flatMap(z => z.fac).filter(f => f === 'succession_lab').length;
  const sucBonus = (S.policies.sucFocus ? 0.15 : 0) + sucLabCount * 0.1;
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

  if (fail > 0) {
    S.res.morale -= fail * 3;
    addLog(`승계 시행: ${ok}명 성공, ${fail}명 기억 일부 손실.`);
    notify(`${ok}명 이어짐. ${fail}명의 직전 기억이 흐려졌습니다.`, 'warning');
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
  z.cond = Math.min(100, z.cond + 15);
  addLog(`${z.name} 수리 완료. 상태 ${Math.round(z.cond)}%.`);
  render();
}

function expandZone(zoneId) {
  const z = S.zones.find(z => z.id === zoneId);
  if (!z || z.owner !== 'neutral') return;
  if (S.res.food < 40) { notify('식량 부족 (필요: 40)', 'error'); return; }

  const expandBonus = S.policies.expansion ? 0.15 : 0;
  const rate = 0.35 + (S.res.morale / 200) + expandBonus;
  if (Math.random() < rate) {
    S.res.food -= 40;
    z.owner = 'player';
    S.stats.expanded++;
    updateZoneCounts();
    addLog(`${z.name} 병합 성공. 자치 구역 확장.`);
    notify(`${z.name}이 자치 구역에 합류했습니다.`, 'success');
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
          const z = s.zones.find(z => z.id === 3);
          if (z) { z.cond = 82; }
          s.res.food += 30;
          s.flags.hiddenFarm = true;
          addLog('3구역 보조 경작 슬롯 가동. 식량 생산량 상승.');
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
    body: `23구역에서 연락이 왔다. 식량이 부족하다. 기득권에도, 자치 구역에도 속하지 않은 400명.

그들의 대표가 직접 찾아왔다. 젊은 여성이었다. 승계를 한 번도 하지 않은, 새하와 비슷한 나이.

"도움을 요청하러 왔습니다. 기득권은 우리한테 아무것도 안 줬어요."`,
    choices: [
      {
        text: '식량을 지원한다 (식량 -40)',
        needFood: 40,
        apply(s) {
          s.flags.neutral1Done = true;
          s.res.food -= 40;
          const z = s.zones.find(z => z.id === 23);
          if (z) { z.owner = 'player'; z.fac = ['housing']; }
          s.stats.expanded++;
          updateZoneCounts();
          addLog('23구역 병합. 400명이 자치 구역에 합류했다.');
        },
        result: '식량을 보내자 23구역 사람들이 움직이기 시작했다. 조용히, 그러나 확실하게.',
      },
      {
        text: '자원 교환을 협상한다',
        apply(s) {
          s.flags.neutral1Done = true;
          s.flags.zone23negotiating = true;
          addLog('23구역과 협상 중. 다음 달 결과 확인 예정.');
        },
        result: '협상은 길어졌다. 그러나 대화의 문이 열렸다.',
      },
      {
        text: '지금 당장은 어렵다고 솔직하게 말한다',
        apply(s) {
          s.flags.neutral1Done = true;
          const z = s.zones.find(z => z.id === 23);
          if (z && Math.random() > 0.5) { z.owner = 'enemy'; addLog('23구역이 기득권으로 넘어갔다.'); updateZoneCounts(); }
          else addLog('23구역이 아직 중립을 유지하고 있다.');
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
    id: 'elder_last',
    trigger: s => s.turn >= 36 && s.flags.storyStage >= 2 && !s.flags.elderLastDone,
    type: 'story',
    title: '오래된 자의 마지막 방문',
    body: `오래된 자가 새하를 불렀다.

19구역이 아니었다. 아크 제로 깊숙이, 한 번도 가본 적 없는 통로 끝.

그가 벽을 짚었다. 숨겨진 문이 열렸다.

안에는 기록이 있었다. 오래된 자의 기록이. 그리고 — 새하의 어머니에 대한 기록이.

새하의 어머니는 아크 제로 설계팀의 일원이었다. 유일하게 승계를 거부한 사람. 그녀는 자신의 기억을 새하의 유전자 안에 남겼다.

새하가 설계도를 본능적으로 읽어내는 것은 재능이 아니었다. 기억이었다.

"승계하지 않은 자가 가장 순수한 기억을 가진 자다. 네 어머니가 남긴 것이 네 안에 있다."`,
    choices: [
      {
        text: '기록을 모두 읽는다',
        apply(s) {
          s.flags.elderLastDone = true;
          s.flags.motherTruth   = true;
          s.flags.storyStage    = 3;
          s.res.morale += 10;
          addLog('어머니에 대한 진실을 알게 됐다. 무언가가 달라졌다.');
        },
        result: '새하는 오래 그 자리에 서 있었다. 설계도를 다시 떠올렸다. 같은 선이지만, 다르게 보였다. 어머니의 눈으로.',
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
      { text: '조건을 받아들인다',                 apply: s => { s.flags.energyPenalty = (s.flags.energyPenalty||0) + 12; addLog('기득권 에너지 계약 수정. 불리하나 안정 유지.'); }, result: '불리했다. 그러나 지금은 버티는 것이 중요했다.' },
      { text: '거부하고 독립 전력 확보에 집중한다', apply: s => { s.res.energy -= 20; s.flags.energyIndep = true; addLog('기득권 계약 거부. 독립 전력 추진.'); }, result: '일시적으로 에너지가 부족해졌다. 그러나 독립의 첫 걸음이었다.' },
      { text: '오래된 자에게 조언을 구한다',       apply: s => { s.res.morale += 5; s.res.energy -= 5; addLog('오래된 자 조언 수용.'); }, result: '"그들이 원하는 건 자원이 아니에요. 당신이 먼저 부탁하게 만드는 것이에요."' },
    ],
  },
  {
    id: 'hanto_rally', weight: 6,
    condition: s => s.res.morale < 42,
    type: 'opportunity', title: '항도 집회',
    body: `문화 구역 앞에 사람들이 모였다. 항도 집회가 자발적으로 열렸다. 어두운 시기, 사람들은 모이고 싶어한다.`,
    choices: [
      { text: '집회에 새하도 참석한다',   apply: s => { s.res.morale += 10; addLog('항도 집회 참석. 주민들과 함께함.'); }, result: '새하는 연설을 하지 않았다. 그냥 앉아있었다. 그것으로 충분했다.' },
      { text: '집회는 허용하되 불참한다', apply: s => { s.res.morale += 4;  addLog('항도 집회 허용.'); }, result: '사람들이 모였다. 새하가 없어도 모였다.' },
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
      const availableBuildings = Object.entries(BUILDINGS).filter(([bid, b]) => {
        if (b.unlock && !S.systems[b.unlock]) return false;
        return true;
      });
      buildMenuHtml = `
        <div class="build-menu">
          <div class="bm-title">건설할 건물 선택</div>
          ${availableBuildings.map(([bid, b]) => {
            const canAfford = S.res.food >= b.buildCost.food && S.res.energy >= b.buildCost.energy;
            return `<div class="bm-item ${canAfford ? '' : 'bm-disabled'}" onclick="${canAfford ? `buildInZone(${z.id},'${bid}')` : ''}">
              <span class="bm-icon">${b.icon}</span>
              <div class="bm-info">
                <span class="bm-name">${b.name}</span>
                <span class="bm-desc">${b.prodDesc || b.desc}</span>
              </div>
              <span class="bm-cost">식량 ${b.buildCost.food} / 에너지 ${b.buildCost.energy}</span>
            </div>`;
          }).join('')}
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

  let actHtml = '';
  if (z.owner === 'player') {
    actHtml = `
      <div class="zone-actions">
        <button class="btn-action" onclick="repairZone(${z.id})">🔧 시설 수리 (식량 10, 에너지 20)</button>
      </div>`;
  } else if (z.owner === 'neutral') {
    actHtml = `
      <div class="zone-actions">
        <button class="btn-action expand" onclick="expandZone(${z.id})">🤝 병합 협상 (식량 40 필요)</button>
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
  if (S.res.food   < C.FOOD_CRISIS)   warns.push('⚠ 식량 위기 임박');
  if (S.res.energy < C.ENERGY_CRISIS) warns.push('⚠ 에너지 위기 임박');
  if (S.sucQueue   > 50)              warns.push('⚠ 승계 대기자 과다');
  if (S.res.morale < 30)              warns.push('⚠ 주민 사기 저하');

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
    </div>
    ${warns.length ? `<div class="warn-list">${warns.map(w => `<div class="warn-item">${w}</div>`).join('')}</div>` : ''}`;
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
