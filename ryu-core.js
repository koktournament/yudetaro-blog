/* 『竜の眠る峠』コア：状態・ダイス・勝敗はコードが持ち、世界の事実は台帳と物理、
   物語はGM（AI）が担う3層構造。ゴブリン洞穴（trpg-core.js）の設計を継承した中編。 */
'use strict';

/* ===== 世界の台帳（プレイヤーにも見える「約束」） ===== */
const STOPS = [
  { key: 'sato', name: 'かやの里' },
  { key: 'saka', name: '苔坂' },
  { key: 'sugi', name: '霧杉の林' },
  { key: 'hashi', name: '吊り橋の谷' },
  { key: 'touge', name: '竜の峠' },
  { key: 'machi', name: '峠の町' },
];
const STOP_KEYS = STOPS.map(s => s.key);
const WEATHER = { 1: '晴れ', 2: '晴れ', 3: '霧', 4: '雨', 5: '晴れ', 6: '晴れ', 7: '曇り', 8: '雨', 9: '霧', 10: '晴れ', 11: '晴れ', 12: '晴れ' };
const PRICES = { medicine: 8, seeds: 6, food: 2, arrows: 3, herb: 5, oil: 8 };
const PRICE_LABEL = { medicine: '薬（祠守の爺さま用）', seeds: '種籾（村の分）', food: '食料', arrows: '矢束（+6）', herb: '薬草', oil: '油の小瓶' };
const LEDGER = {
  places: ['かやの里（出発地）', '苔坂', '霧杉の林', '吊り橋の谷', '竜の峠', '峠の町'],
  people: {
    sato: ['村長のウメ', '狩人の源太', '母のチヨ', '巫女見習いのサヨ'],
    road: ['巫女見習いのサヨ'],
    machi: ['薬屋の平蔵', '宿の女将', '隊商の頭', '巫女見習いのサヨ'],
  },
  noHave: ['馬や荷車', '近道や裏道', '竜を倒せる武器', '名のある勇者や兵士', 'この里と町以外の集落'],
};
const WORLD_GUIDELINE = '竜は実在する。古い言葉が通じ、悪ではない。ただし世界の約束は絶対で、竜と戦って勝つことは決してない。物語では豊かに、数字ではケチに。';
const HARD_RULES = [
  '存在しない物は、ダイスに成功しても絶対に出ない。',
  '数字の天井は「通常のもの+2」。',
  '締め切り（12日目の朝）と勝敗はコードが決める。',
  '一度始まった戦闘は、どちらかが全滅するまで終わらない。',
  '竜への攻撃は、その場で物語が終わる（竜の結末）。',
].join('\n');
const INTRO = [
  'この里に、名前はある。かやの里。',
  '山に抱かれた、小さな里だ。',
  '',
  '里の外へ出る道は、一本だけ。',
  '竜の眠る峠を越える、細い山道。',
  '七年に一度、里は貢ぎ手を送る。',
  '峠の町へ行き、薬と種籾を持ち帰るために。',
  '',
  '今年、貢ぎ手に選ばれたのは、あなただ。',
  '同行は、祠の巫女見習いサヨ。',
  '峠には、本当に竜が眠っている。',
  '作法を守れば、竜は目覚めない――そう伝えられてきた。',
].join('\n');
const MISSION = [
  '12日目の朝の祭りまでに、薬と種籾を持ち帰れ',
  '峠の作法を守れ：声を立てるな、竜の名を呼ぶな、落ちた宝に触るな',
];
const EPILOGUE = '祭りの朝、里に鐘の音が響いた。薬は爺さまを救い、種籾は畑に蒔かれた。峠の向こうと里を結ぶ細い道は、また七年、静かに眠り続ける。';
const EPILOGUE_BELL = '祭りの朝、里は静かだった。祠の鐘は、もうない。けれど爺さまは治り、種は蒔かれ、峠の竜は宝を取り戻して深い眠りに戻った。七年ごとの貢ぎの旅は、この年で終わる。里と町を結ぶ道は、もう誰のものでもない、ただの山道になった。';

/* ===== 乱数（部屋コードから種を作る決定的乱数） ===== */
function seedFromCode(code) { let h = 2166136261; const s = String(code || 'ryu'); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rnd(st) { st.rng = (Math.imul(st.rng, 1664525) + 1013904223) >>> 0; return st.rng / 4294967296; }
function die(st, n) { const v = 1 + Math.floor(rnd(st) * n); if (st._rolls) st._rolls.push({ sides: n, value: v }); return v; }
function captureRolls(st, fn) {
  if (st._rolls) return fn();
  const start = st.log.length;
  st._rolls = [];
  try { return fn(); } finally {
    const rolls = st._rolls; st._rolls = null;
    if (rolls && rolls.length) for (let i = start; i < st.log.length; i++) { if (!st.log[i].rolls) { st.log[i].rolls = rolls; break; } }
  }
}
function log(st, kind, text) { st.log.push({ kind, text }); if (st.log.length > 400) st.log = st.log.slice(-400); }

/* ===== 初期状態 ===== */
function newGame(seed) {
  const st = {
    rng: (seed >>> 0) || 123456789,
    day: 1, phase: 'village', leg: 0, heading: 'machi', result: null,
    player: { name: '若者', hp: 20, maxHp: 20 },
    ally: { name: 'サヨ', hp: 12, maxHp: 12, out: false },
    equip: { weapon: 'blade', armor: 'cloth', ownLeather: false },
    money: 20, arrows: 8, food: 6,
    items: { herb: 1, oil: 0, trap: 1, bento: 0, fur: 0 },
    quest: { medicine: false, seeds: false, tribute: true },
    bell: { carried: false, returned: false },
    flags: { firstHit: 0, setup: false, gentaMet: false, umeMet: false, dragonGone: false, sleptOut: 0 },
    luck: 0, customItems: [],
    combat: null, actionsLeft: 3,
    pendingFree: null, pendingText: null, pendingAsk: null,
    log: [],
  };
  log(st, 'sys', '【ミッション】' + MISSION[0]);
  log(st, 'sys', '【ミッション】' + MISSION[1]);
  return st;
}
function stopName(st) { return STOPS[st.leg].name; }
function weatherOf(day) { return WEATHER[day] || '晴れ'; }
function atDragon(st) { return STOPS[st.leg].key === 'touge' && !st.flags.dragonGone; }

/* ===== 戦闘 ===== */
const WEAPONS = { blade: '山刀', bow: '弓' };
const ARMORS = { none: 'なし', cloth: '母の布当て', leather: '革当て' };
function livingEnemies(st) { return st.combat ? st.combat.enemies.filter(e => e.hp > 0) : []; }
function armorReduce(st, dmg) {
  if (st.equip.armor === 'leather' && !st.flags.leatherUsed && dmg >= 4) { st.flags.leatherUsed = true; log(st, 'sys', '革当てが大きな一撃を受け止めた！（ダメージ0）'); return 0; }
  if (st.equip.armor === 'cloth' || st.equip.armor === 'leather') return Math.max(0, dmg - 1);
  return dmg;
}
function partyDown(st, who) {
  st.combat = null; st.result = 'lose_dead'; st.phase = 'ended';
  if (who === 'ally') log(st, 'sys', 'サヨが倒れた。呆然と立ち尽くす若者もろとも、山の闇に呑まれた――物語はここで終わる。');
  else log(st, 'sys', st.player.name + 'が倒れた。サヨの叫びも、山の闇に消えた――物語はここで終わる。');
}
function startCombat(st, foes) {
  if (st.flags.setup && foes.length) { st.flags.setup = false; foes = foes.slice(1); log(st, 'sys', '仕掛けた罠が決まった！ ' + '敵の1体は戦う前に倒れた'); if (!foes.length) { log(st, 'sys', '罠だけで片が付いた。'); return; } }
  st.combat = { zone: stopName(st), round: 1, enemies: foes };
  log(st, 'sys', '戦闘になった！（' + foes.map(f => f.name).join('・') + '）一度始まれば、どちらかが全滅するまで終わらない');
}
function allyPhase(st) {
  if (st.ally.out || st.ally.hp <= 0 || !st.combat) return;
  const foes = livingEnemies(st); if (!foes.length) return;
  if (st.ally.hp <= 5 && st.items.herb > 0) {
    st.items.herb -= 1; const h = die(st, 6) + 2;
    st.ally.hp = Math.min(st.ally.maxHp, st.ally.hp + h);
    log(st, 'dice', 'サヨは自分の判断で薬草を使った（サヨのHP+' + h + '）'); return;
  }
  if (st.arrows <= 0) { log(st, 'dice', 'サヨは矢筒を確かめたが空だった。オロオロしている'); return; }
  st.arrows -= 1;
  const roll = die(st, 6);
  if (roll >= 3) { const dmg = die(st, 6); foes[0].hp -= dmg; log(st, 'dice', 'サヨの弓が' + foes[0].name + 'に命中（' + dmg + 'ダメージ）'); }
  else log(st, 'dice', 'サヨの矢は外れた');
}
function enemyPhase(st) {
  for (const e of livingEnemies(st)) {
    const toAlly = !st.ally.out && st.ally.hp > 0 && rnd(st) < 0.4;
    const roll = die(st, 6);
    if (roll >= 3) {
      const raw = die(st, e.die);
      if (toAlly) { st.ally.hp -= raw; log(st, 'dice', e.name + 'の攻撃がサヨに命中（' + raw + 'ダメージ）'); }
      else { const dmg = armorReduce(st, raw); st.player.hp -= dmg; log(st, 'dice', e.name + 'の攻撃が命中（' + dmg + 'ダメージ）'); }
    } else log(st, 'dice', e.name + 'の攻撃は外れた');
    if (st.player.hp <= 0) { partyDown(st, 'player'); return; }
    if (!st.ally.out && st.ally.hp <= 0) { st.ally.hp = 0; partyDown(st, 'ally'); return; }
  }
  if (st.combat) st.combat.round += 1;
}
function afterCombatTurn(st) {
  if (!st.combat) return;
  if (livingEnemies(st).length) allyPhase(st);
  if (!st.combat) return;
  if (livingEnemies(st).length) enemyPhase(st);
  if (!st.combat) return;
  if (!livingEnemies(st).length) { st.combat = null; log(st, 'sys', 'その場は切り抜けた。'); }
}
function dragonEnd(st) {
  st.combat = null; st.result = 'dragon'; st.phase = 'ended';
  log(st, 'sys', '竜が目を覚ました。山より大きな瞳が、二人を見下ろした――物語はここで終わる。');
}
function maybeWolves(st) {
  if (STOP_KEYS[st.leg] !== 'sugi') return;
  if (weatherOf(st.day) !== '霧') return;
  if (st.flags['wolves_' + st.day]) return;
  st.flags['wolves_' + st.day] = true;
  log(st, 'sys', '霧の林の奥から、唸り声。腹を空かせた山狼が、霧に紛れて囲んできた！');
  startCombat(st, [0, 1, 2].map(() => ({ name: '山狼', hp: 6, maxHp: 6, die: 5 })));
}

/* ===== 日跨ぎ ===== */
function endDay(st, auto) {
  if (st.phase === 'ended') return;
  const here = STOP_KEYS[st.leg];
  st.day += 1;
  if (st.day >= 12) {
    st.result = 'lose_time'; st.phase = 'ended';
    log(st, 'sys', '12日目の朝。祭りの日が来てしまった。薬も種籾もない里に、冬が来る――物語はここで終わる。');
    return;
  }
  if (st.food > 0) { st.food -= 1; if (here === 'sato' || here === 'machi') { st.player.hp = Math.min(st.player.maxHp, st.player.hp + 3); if (!st.ally.out) st.ally.hp = Math.min(st.ally.maxHp, st.ally.hp + 3); log(st, 'sys', '夜が明けた。' + st.day + '日目（天気：' + weatherOf(st.day) + '）。温かい食事と寝床で、二人とも少し回復した（HP+3）'); } else { st.player.hp = Math.min(st.player.maxHp, st.player.hp + 1); if (!st.ally.out) st.ally.hp = Math.min(st.ally.maxHp, st.ally.hp + 1); log(st, 'sys', '野営の夜が明けた。' + st.day + '日目（天気：' + weatherOf(st.day) + '）。焚き火のそばで、二人とも少し回復した（HP+1）'); } }
  else { st.player.hp = Math.max(1, st.player.hp - 2); if (!st.ally.out) st.ally.hp = Math.max(1, st.ally.hp - 2); log(st, 'sys', '食料が尽きたまま夜が明けた。' + st.day + '日目（天気：' + weatherOf(st.day) + '）。空腹で二人の顔色が悪い（HP-2）'); }
  st.actionsLeft = 3;
  st.flags.bentoGot = false;
}
function maybeAutoSleep(st) {
  if (st.phase !== 'ended' && !st.combat && !st.pendingText && !st.pendingFree && st.actionsLeft <= 0) endDay(st, true);
}

/* ===== プレイヤーの標準アクション ===== */
const KEY_ALIASES = { armor: 'leather', arrow: 'arrows', herbs: 'herb', sword: 'blade' };
function normKey(v) { return (typeof v === 'string' && KEY_ALIASES[v]) ? KEY_ALIASES[v] : v; }
function syncPhase(st) { if (st.phase === 'ended') return; st.phase = st.leg === 0 ? 'village' : st.leg === 5 ? 'town' : 'journey'; }
function checkWin(st) {
  if (st.leg === 0 && st.heading === 'sato' && st.quest.medicine && st.quest.seeds && st.phase !== 'ended') {
    st.result = 'win'; st.phase = 'ended';
    log(st, 'sys', '薬と種籾を持って、里へ帰り着いた。');
    log(st, 'story', st.bell.returned ? EPILOGUE_BELL : EPILOGUE);
  }
}
function playerActionInner(st, action) {
  if (st.phase === 'ended') return { ok: false, error: '物語は終わっています' };
  if (action) { if (typeof action.item === 'string' && !action.item.startsWith('custom:')) action.item = normKey(action.item); if (action.weapon) action.weapon = normKey(action.weapon); }
  const t = action && action.type;
  if (st.pendingFree) return { ok: false, error: '自由行動の裁定を待っています' };
  if (t === 'setname') {
    const nm = String(action.name || '').trim().slice(0, 8);
    if (!nm) return { ok: false, error: '名前が空です' };
    st.player.name = nm; log(st, 'sys', '主人公の名前は「' + nm + '」になった。'); return { ok: true };
  }
  if (t === 'equip') {
    if (st.combat) return { ok: false, error: '戦闘中は装備を変えられない' };
    if (action.slot === 'weapon' && WEAPONS[action.item]) { st.equip.weapon = action.item; log(st, 'sys', '武器を' + WEAPONS[action.item] + 'に持ち替えた。'); return { ok: true }; }
    if (action.slot === 'armor' && ARMORS[action.item]) {
      if (action.item === 'leather' && !st.equip.ownLeather) return { ok: false, error: '革当てを持っていない' };
      st.equip.armor = action.item; log(st, 'sys', '防具を「' + ARMORS[action.item] + '」にした。'); return { ok: true };
    }
    return { ok: false, error: 'その装備はない' };
  }
  if (t === 'settrap') {
    if (st.combat) return { ok: false, error: '戦闘中は仕掛けられない' };
    if (st.flags.setup) return { ok: false, error: '罠はもう仕掛けてある' };
    if (st.items.trap <= 0) return { ok: false, error: '罠を持っていない' };
    if (st.actionsLeft <= 0) return { ok: false, error: '今日の行動回数はもう残っていない' };
    st.actionsLeft -= 1; st.items.trap -= 1; st.flags.setup = true;
    log(st, 'sys', '罠を仕掛けた（次の戦闘で、敵の1体は戦う前に倒れる）'); return { ok: true };
  }
  /* ---- 戦闘中の手番 ---- */
  if (st.combat) {
    if (t === 'attack') {
      if (atDragon(st)) { dragonEnd(st); return { ok: true }; }
      const w = action.weapon === 'bow' ? 'bow' : (action.weapon === 'blade' ? 'blade' : st.equip.weapon);
      if (w === 'bow') { if (st.arrows <= 0) return { ok: false, error: '矢がない' }; st.arrows -= 1; }
      const foes = livingEnemies(st); if (!foes.length) return { ok: false, error: '敵がいない' };
      const roll = die(st, 6) + st.luck; st.luck = 0;
      if (roll >= 3) { let dmg = w === 'bow' ? die(st, 6) : die(st, 6) + 1; if (st.flags.firstHit) { dmg += st.flags.firstHit; st.flags.firstHit = 0; } if (st.flags.atkBonus) { dmg += st.flags.atkBonus; st.flags.atkBonus = 0; } foes[0].hp -= dmg; log(st, 'dice', (w === 'bow' ? '弓' : '山刀') + 'が' + foes[0].name + 'に命中（' + dmg + 'ダメージ）'); }
      else log(st, 'dice', '攻撃は外れた');
      afterCombatTurn(st); return { ok: true };
    }
    if (t === 'item') {
      const item = action.item;
      if (item === 'trap') return { ok: false, error: '罠は戦闘中に使うものではない' };
      if (item === 'oil' && atDragon(st)) { dragonEnd(st); return { ok: true }; }
      if (typeof item === 'string' && item.startsWith('custom:')) {
        const ci = st.customItems[Number(item.slice(7))];
        if (!ci || ci.count <= 0) return { ok: false, error: 'その道具は持っていない' };
        ci.count -= 1; if (ci.count <= 0) st.customItems.splice(Number(item.slice(7)), 1);
        if (ci.effect === 'atk') { st.flags.atkBonus = 2; log(st, 'sys', ci.name + 'を使った（次の攻撃のダメージ+2）'); }
        else if (ci.effect === 'heal') { const h = die(st, 4) + 1; st.player.hp = Math.min(st.player.maxHp, st.player.hp + h); log(st, 'sys', ci.name + 'を使った（HP+' + h + '）'); }
        else log(st, 'sys', ci.name + 'を使った');
        afterCombatTurn(st); return { ok: true };
      }
      if (!(item in st.items) || st.items[item] <= 0) return { ok: false, error: 'その道具は持っていない' };
      if (item === 'herb') { st.items.herb -= 1; const h = die(st, 6) + 2; const tgt = action.target === 'ally' ? st.ally : st.player; tgt.hp = Math.min(tgt.maxHp, tgt.hp + h); log(st, 'sys', '薬草を使った（' + (tgt === st.ally ? 'サヨ' : st.player.name) + 'のHP+' + h + '）'); }
      else if (item === 'bento') { st.items.bento -= 1; st.player.hp = Math.min(st.player.maxHp, st.player.hp + 5); if (!st.ally.out) st.ally.hp = Math.min(st.ally.maxHp, st.ally.hp + 5); log(st, 'sys', '母の弁当を分け合った（二人ともHP+5）'); }
      else if (item === 'oil') { const foes = livingEnemies(st); if (foes.length) { st.items.oil -= 1; foes[0].hp = 0; log(st, 'sys', '油を投げて火をつけた。' + foes[0].name + 'が燃え上がった'); } else { log(st, 'sys', '使う相手がいないので使わなかった'); return { ok: true }; } }
      else return { ok: false, error: '戦闘では使えない' };
      afterCombatTurn(st); return { ok: true };
    }
    return { ok: false, error: '戦闘中は攻撃か道具だけだ（始めたら全滅まで終わらない）' };
  }
  if (t === 'attack') {
    if (atDragon(st)) { dragonEnd(st); return { ok: true }; }
    return { ok: false, error: '敵がいない' };
  }
  if (t === 'item' && action.item === 'oil' && atDragon(st)) { dragonEnd(st); return { ok: true }; }
  /* ---- 移動 ---- */
  if (t === 'advance' || t === 'retreat') {
    const dirToMachi = t === 'advance' ? (st.heading === 'machi' ? 1 : -1) : (st.heading === 'machi' ? -1 : 1);
    const next = st.leg + dirToMachi;
    if (next < 0 || next > 5) return { ok: false, error: 'その先はない' };
    const crossingBridge = (st.leg === 3 && next === 4) || (st.leg === 4 && next === 3);
    const cost = (crossingBridge && weatherOf(st.day) === '雨') ? 2 : 1;
    if (st.actionsLeft < cost) return { ok: false, error: cost > 1 ? '雨で橋が滑る。今日の残り行動では渡りきれない' : '今日の行動回数はもう残っていない' };
    st.actionsLeft -= cost;
    st.leg = next; syncPhase(st);
    if (crossingBridge && cost === 2) log(st, 'sys', '雨に濡れた吊り橋を、慎重に渡った（行動2回分）');
    log(st, 'sys', stopName(st) + 'に着いた。（天気：' + weatherOf(st.day) + '）');
    if (st.leg === 5 && st.quest.tribute) { st.quest.tribute = false; log(st, 'sys', '峠の町の祠務め所へ、貢ぎを届けた。'); }
    if (atDragon(st)) log(st, 'sys', '峠の岩場の上に、竜が眠っている。鱗が、呼吸に合わせて静かに動いている。');
    checkWin(st);
    if (st.leg === 5) st.heading = 'sato';
    if (st.leg === 0) st.heading = 'machi';
    if (st.phase !== 'ended') maybeWolves(st);
    return { ok: true };
  }
  if (t === 'depart') { /* 里を出る＝advance の別名として受ける */
    return playerActionInner(st, { type: 'advance' });
  }
  /* ---- 村と町の行動 ---- */
  if (t === 'buy') {
    if (STOP_KEYS[st.leg] !== 'machi') return { ok: false, error: '買い物は峠の町だけだ' };
    const item = action.item;
    if (item === 'leather') { if (st.equip.ownLeather) return { ok: false, error: '革当てはもう持っている' }; if (st.money < 8) return { ok: false, error: '小銭が足りない' }; st.money -= 8; st.equip.ownLeather = true; log(st, 'sys', '革当てを買った（小銭-8）'); return { ok: true }; }
    if (!(item in PRICES)) return { ok: false, error: 'その品は売っていない' };
    if (st.money < PRICES[item]) return { ok: false, error: '小銭が足りない' };
    if ((item === 'medicine' && st.quest.medicine) || (item === 'seeds' && st.quest.seeds)) return { ok: false, error: 'それはもう買ってある' };
    st.money -= PRICES[item];
    if (item === 'medicine') st.quest.medicine = true;
    else if (item === 'seeds') st.quest.seeds = true;
    else if (item === 'food') st.food += 1;
    else if (item === 'arrows') st.arrows += 6;
    else st.items[item] += 1;
    log(st, 'sys', PRICE_LABEL[item] + 'を買った（小銭-' + PRICES[item] + '）'); return { ok: true };
  }
  if (t === 'sell') {
    if (STOP_KEYS[st.leg] !== 'machi') return { ok: false, error: '売るのは峠の町だけだ' };
    if (action.item === 'fur' && st.items.fur > 0) { st.items.fur -= 1; st.money += 4; log(st, 'sys', '狼の毛皮を売った（小銭+4）'); return { ok: true }; }
    if (action.item === 'herb' && st.items.herb > 0) { st.items.herb -= 1; st.money += 2; log(st, 'sys', '薬草を売った（小銭+2）'); return { ok: true }; }
    return { ok: false, error: '売れる物を持っていない' };
  }
  if (t === 'gather' || t === 'hunt') {
    if (STOP_KEYS[st.leg] === 'machi') return { ok: false, error: '町では採れない' };
    if (st.actionsLeft <= 0) return { ok: false, error: '今日の行動回数はもう残っていない' };
    st.actionsLeft -= 1;
    if (t === 'gather') { st.food += 1; log(st, 'sys', '山菜と木の実を集めた（食料+1）'); }
    else { st.food += 2; let extra = ''; if (STOP_KEYS[st.leg] === 'saka' || STOP_KEYS[st.leg] === 'sugi') { st.items.fur += 1; extra = '、狼の毛皮も手に入れた'; } log(st, 'sys', '小獣を狩った（食料+2' + extra + '）'); }
    return { ok: true };
  }
  if (t === 'bento') {
    if (st.leg !== 0) return { ok: false, error: '弁当は里の母だけだ' };
    if (st.flags.bentoGot) return { ok: false, error: '今日の分はもうもらった' };
    if (st.actionsLeft <= 0) return { ok: false, error: '今日の行動回数はもう残っていない' };
    st.actionsLeft -= 1; st.flags.bentoGot = true; st.items.bento += 1;
    log(st, 'sys', '母のチヨが弁当を持たせてくれた（弁当+1）'); return { ok: true };
  }
  if (t === 'talk_genta') {
    if (st.leg !== 0) return { ok: false, error: '源太は里にいる' };
    if (st.actionsLeft <= 0) return { ok: false, error: '今日の行動回数はもう残っていない' };
    st.actionsLeft -= 1;
    if (!st.flags.gentaMet) { st.flags.gentaMet = true; st.flags.firstHit = 2; log(st, 'sys', '源太が山の歩き方と獣の捌き方を教えてくれた（次の戦闘の最初の一撃+2）'); }
    else log(st, 'sys', '源太「山の天気は、空の色で読め」');
    return { ok: true };
  }
  if (t === 'talk_ume') {
    if (st.leg !== 0) return { ok: false, error: 'ウメは里にいる' };
    if (st.actionsLeft <= 0) return { ok: false, error: '今日の行動回数はもう残っていない' };
    st.actionsLeft -= 1;
    if (!st.flags.umeMet) { st.flags.umeMet = true; log(st, 'sys', 'ウメ「祠の鐘はな、峠の宝の金で鋳たものだそうだ。……昔の貢ぎ手が、持ち帰ったとさ」'); }
    else log(st, 'sys', 'ウメ「作法だけは、破るでないよ」');
    return { ok: true };
  }
  if (t === 'bell') {
    if (st.leg !== 0) return { ok: false, error: '鐘は里の祠にある' };
    if (st.combat) return { ok: false, error: '戦闘中はできない' };
    st.bell.carried = !st.bell.carried;
    log(st, 'sys', st.bell.carried ? '祠の鐘を、荷にくくりつけた。（鐘を持っていく）' : '祠の鐘を、祠に戻した。');
    return { ok: true };
  }
  if (t === 'offer') {
    if (!atDragon(st)) return { ok: false, error: '奉納は竜の峠でだけだ' };
    if (!st.bell.carried) return { ok: false, error: '奉納する鐘を持っていない' };
    st.bell.carried = false; st.bell.returned = true; st.flags.dragonGone = true;
    log(st, 'sys', '鐘を岩場に置くと、竜がゆっくりと目を開けた。長いこと見つめたあと、竜は鐘を掴み、峠の奥へと去っていった。');
    return { ok: true };
  }
  if (t === 'rest' || t === 'sleep') { endDay(st, false); return { ok: true }; }
  if (t === 'item') {
    const item = action.item;
    if (typeof item === 'string' && item.startsWith('custom:')) {
      const ci = st.customItems[Number(item.slice(7))];
      if (!ci || ci.count <= 0) return { ok: false, error: 'その道具は持っていない' };
      ci.count -= 1; if (ci.count <= 0) st.customItems.splice(Number(item.slice(7)), 1);
      if (ci.effect === 'heal') { const h = die(st, 4) + 1; st.player.hp = Math.min(st.player.maxHp, st.player.hp + h); log(st, 'sys', ci.name + 'を使った（HP+' + h + '）'); }
      else log(st, 'sys', ci.name + 'を使った');
      return { ok: true };
    }
    if (!(item in st.items) || st.items[item] <= 0) return { ok: false, error: 'その道具は持っていない' };
    if (item === 'herb') { st.items.herb -= 1; const h = die(st, 6) + 2; const tgt = action.target === 'ally' ? st.ally : st.player; tgt.hp = Math.min(tgt.maxHp, tgt.hp + h); log(st, 'sys', '薬草を使った（' + (tgt === st.ally ? 'サヨ' : st.player.name) + 'のHP+' + h + '）'); }
    else if (item === 'bento') { st.items.bento -= 1; st.player.hp = Math.min(st.player.maxHp, st.player.hp + 5); if (!st.ally.out) st.ally.hp = Math.min(st.ally.maxHp, st.ally.hp + 5); log(st, 'sys', '母の弁当を分け合った（二人ともHP+5）'); }
    else return { ok: false, error: 'それは今使うものではない' };
    return { ok: true };
  }
  return { ok: false, error: 'その行動は分からない' };
}
function playerAction(st, action) {
  return captureRolls(st, () => { const r = playerActionInner(st, action); if (r.ok) maybeAutoSleep(st); return r; });
}

/* ===== 宣言・解釈・裁定・質問 ===== */
function peopleHere(st) {
  const k = STOP_KEYS[st.leg];
  const arr = k === 'sato' ? LEDGER.people.sato : k === 'machi' ? LEDGER.people.machi : LEDGER.people.road;
  return arr.map(n => ({ name: n }));
}
function playerDeclare(st, text, talkTo) {
  if (st.phase === 'ended') return { ok: false, error: '物語は終わっています' };
  const t = String(text || '').slice(0, 300).trim();
  if (!t) return { ok: false, error: '文章を書いてください' };
  if (st.pendingText || st.pendingFree) return { ok: false, error: 'GMの応答を待っています' };
  if (talkTo) {
    const person = peopleHere(st).find(p => p.name === talkTo);
    if (!person) return { ok: false, error: 'その人物はここにいない' };
  }
  st.pendingText = { text: t, talkTo: talkTo || null };
  log(st, 'player', (talkTo ? '（' + talkTo + 'へ）' : '') + '「' + t + '」');
  return { ok: true };
}
function gmNarrate(st, text) {
  const t = String(text || '').slice(0, 1000);
  if (!t) return { ok: false, error: '文章が空です' };
  log(st, 'gm', t);
  return { ok: true };
}
function playerAsk(st, text) {
  if (st.phase === 'ended') return { ok: false, error: '物語は終わっています' };
  const t = String(text || '').trim().slice(0, 200);
  if (!t) return { ok: false, error: '質問を書いてください' };
  if (st.pendingAsk) return { ok: false, error: '前の質問への答えを待っています' };
  st.pendingAsk = { text: t, day: st.day };
  log(st, 'player', '（GMへの質問）「' + t + '」');
  return { ok: true };
}
function gmAnswer(st, text) {
  if (!st.pendingAsk) return { ok: false, error: '答える質問がありません' };
  const t = String(text || '').slice(0, 1000);
  if (!t) return { ok: false, error: '文章が空です' };
  st.pendingAsk = null;
  log(st, 'gm', t);
  return { ok: true };
}
const FREE_TARGETS = { easy: 2, normal: 4, hard: 5 };
const GRANTABLE = { oil: '油の小瓶', herb: '薬草', trap: '罠', arrows: '矢（+3）', food: '食料（+2）' };
const INFO_FACTS = [
  '竜は音に敏感だ。峠では静かにするのが、作法の第一だという',
  '山狼は火と大人数を嫌う。霧の日は気が立っている',
  '吊り橋は雨の日が一番危ない。地元の者は、雨の日は渡らない',
  '峠のあちこちに、昔の貢ぎや宝が散らばっている。触れた者の里は祟られるという',
  '祠の鐘は、峠の宝の金で鋳たものだ――ウメだけが知る言い伝えがある',
  '竜は古い言葉なら聞き分ける。サヨは、その断片だけが分かる',
  '峠の町の隊商は、峠に新しい道を切り開こうとしている',
  '山狼は、腹を空かせているときにだけ人を襲う',
];
function gmRuleInner(st, tier, reward, custom) {
  if (!st.pendingFree) return { ok: false, error: '裁定待ちの自由行動がありません' };
  if (tier === 'reject') { log(st, 'sys', 'GM裁定：その行動はこの世界ではできない。'); st.pendingFree = null; return { ok: true }; }
  if (tier === 'auto') { log(st, 'sys', 'GM裁定：ダイスを振るまでもない――そのまま成功した（物語上の成功。数字の報酬はない）'); st.pendingFree = null; return { ok: true, auto: true, success: true }; }
  const target = FREE_TARGETS[tier];
  if (!target) return { ok: false, error: '難易度は easy / normal / hard / auto / reject のいずれかです' };
  if (!st.combat && st.actionsLeft <= 0) return { ok: false, error: '今日の行動回数はもう残っていない' };
  if (!st.combat) st.actionsLeft -= 1;
  const roll = die(st, 6);
  st.pendingFree = null;
  if (roll >= target) {
    if (reward === 'custom' && custom && String(custom.name || '').trim() && st.customItems.length < 6) {
      const nm = String(custom.name).slice(0, 12);
      const ef = ['atk', 'heal', 'none'].includes(custom.effect) ? custom.effect : 'none';
      st.customItems.push({ name: nm, effect: ef, count: 1 });
      log(st, 'dice', '自由行動の判定：出目' + roll + '（目標' + target + '）成功！ ' + nm + 'を手に入れた（持ち物に記入した）');
    } else if (reward === 'setup') { st.flags.setup = true; log(st, 'dice', '自由行動の判定：出目' + roll + '（目標' + target + '）成功！ 仕掛けが整った（次の戦闘で敵1体が戦う前に倒れる）'); }
    else if (reward === 'treat') { const tgt = (!st.ally.out && st.ally.hp / st.ally.maxHp < st.player.hp / st.player.maxHp) ? st.ally : st.player; const h = die(st, 4); tgt.hp = Math.min(tgt.maxHp, tgt.hp + h); log(st, 'dice', '自由行動の判定：出目' + roll + '（目標' + target + '）成功！ 工夫した手当てが効いた（' + (tgt === st.ally ? 'サヨ' : st.player.name) + 'のHP+' + h + '）'); }
    else if (reward === 'time') { if (st.phase === 'village' || st.phase === 'town') { st.actionsLeft += 1; log(st, 'dice', '自由行動の判定：出目' + roll + '（目標' + target + '）成功！ 段取りが冴えて、今日の行動が1回増えた'); } else { st.luck += 2; log(st, 'dice', '自由行動の判定：出目' + roll + '（目標' + target + '）成功！ 次の一撃に+2の勢いがついた'); } }
    else if (reward === 'info') { const f = INFO_FACTS[(st.flags.infoIdx || 0) % INFO_FACTS.length]; st.flags.infoIdx = (st.flags.infoIdx || 0) + 1; log(st, 'dice', '自由行動の判定：出目' + roll + '（目標' + target + '）成功！ ' + f); }
    else if (reward && GRANTABLE[reward]) { if (reward === 'arrows') st.arrows += 3; else if (reward === 'food') st.food += 2; else st.items[reward] += 1; log(st, 'dice', '自由行動の判定：出目' + roll + '（目標' + target + '）成功！ ' + GRANTABLE[reward] + 'を手に入れた'); }
    else if (st.combat) { st.luck += 2; log(st, 'dice', '自由行動の判定：出目' + roll + '（目標' + target + '）成功！ 次の一撃に+2の勢いがついた'); }
    else { st.food += 1; log(st, 'dice', '自由行動の判定：出目' + roll + '（目標' + target + '）成功！ うまいこといって、食料を見つけた'); }
  } else {
    if (tier === 'hard') { st.player.hp = Math.max(1, st.player.hp - 1); log(st, 'dice', '自由行動の判定：出目' + roll + '（目標' + target + '）失敗。無理がたたって軽い怪我（HP-1）'); }
    else log(st, 'dice', '自由行動の判定：出目' + roll + '（目標' + target + '）失敗。うまくいかなかった');
  }
  return { ok: true, roll, success: roll >= target };
}
function gmRule(st, tier, reward, custom) {
  return captureRolls(st, () => { const r = gmRuleInner(st, tier, reward, custom); if (r.ok && st.combat && r.roll !== undefined) afterCombatTurn(st); if (r.ok) maybeAutoSleep(st); return r; });
}
function gmInterpretInner(st, spec) {
  if (!st.pendingText) return { ok: false, error: '解釈待ちの宣言がありません' };
  const kind = spec && spec.as;
  if (kind === 'fiction') { st.pendingText = null; log(st, 'sys', '（物語として受け取られた）'); return { ok: true }; }
  if (kind === 'reject') { st.pendingText = null; log(st, 'sys', 'GM：それはこの世界ではできない'); return { ok: true }; }
  if (kind === 'ending') {
    if (st.combat) return { ok: false, error: '戦闘中は物語を終わらせられない' };
    st.pendingText = null; st.result = 'escape'; st.phase = 'ended';
    log(st, 'sys', '―― 物語は、ここで終わった ――'); return { ok: true };
  }
  if (kind === 'action') {
    const a = spec.action || {};
    st.pendingText = null;
    return playerActionInner(st, a);
  }
  if (kind === 'free') {
    st.pendingFree = st.pendingText; st.pendingText = null;
    return gmRuleInner(st, spec.tier || 'normal', spec.reward, spec.custom);
  }
  return { ok: false, error: '解釈の種類（as）が不正です' };
}
function gmInterpret(st, spec) {
  return captureRolls(st, () => { const r = gmInterpretInner(st, spec); if (r.ok && st.combat && spec && spec.as === 'free') afterCombatTurn(st); if (r.ok) maybeAutoSleep(st); return r; });
}

/* ===== 表示 ===== */
const ITEM_NAMES = { herb: '薬草', oil: '油の小瓶', trap: '罠', bento: '母の弁当', fur: '狼の毛皮' };
function heldList(st) {
  const list = [];
  for (const k of Object.keys(ITEM_NAMES)) if (st.items[k] > 0) list.push({ key: k, name: ITEM_NAMES[k], count: st.items[k] });
  if (st.quest.tribute) list.push({ key: 'tribute', name: '貢ぎの包み', count: 1 });
  if (st.quest.medicine) list.push({ key: 'medicine', name: '薬', count: 1 });
  if (st.quest.seeds) list.push({ key: 'seeds', name: '種籾', count: 1 });
  if (st.bell.carried) list.push({ key: 'bell', name: '祠の鐘', count: 1 });
  st.customItems.forEach((ci, i) => { if (ci.count > 0) list.push({ key: 'custom:' + i, name: ci.name, count: ci.count, effect: ci.effect }); });
  return list;
}
function heldText(st) { const h = heldList(st); return '／持ち物：' + (h.length ? h.map(x => x.name + '×' + x.count).join(' ') : 'なし'); }
function statusLine(st, forGm) {
  const place = st.phase === 'ended' ? '終了' : stopName(st) + '（残り行動' + st.actionsLeft + '）';
  return st.day + '日目／' + place + '／天気：' + weatherOf(st.day)
    + '／' + st.player.name + ' HP ' + st.player.hp + '/' + st.player.maxHp
    + '／サヨHP ' + (st.ally.out ? '離脱' : st.ally.hp + '/' + st.ally.maxHp)
    + '／装備：' + WEAPONS[st.equip.weapon] + '・' + ARMORS[st.equip.armor]
    + '／小銭' + st.money + '／矢' + st.arrows + '／食料' + st.food
    + heldText(st)
    + (st.flags.setup ? '／仕掛け済み' : '')
    + '／使命：薬' + (st.quest.medicine ? '済' : '未') + '・種籾' + (st.quest.seeds ? '済' : '未')
    + (forGm ? '／GM情報：竜は' + (st.flags.dragonGone ? '去った' : '峠で眠っている') + '／鐘：' + (st.bell.returned ? '奉納済み' : st.bell.carried ? '持参中' : '里の祠') + '／目的地：' + (st.heading === 'machi' ? '峠の町' : '里への帰路') : '');
}
const PROMISES = [
  '竜は実在する。作法を守れば、目覚めない',
  '締め切りは12日目の朝。過ぎれば、里の冬は越えられない',
  '戦いは一度始まれば、どちらかが全滅するまで終わらない',
  'この世界にない物は、ダイスに成功しても出てこない',
];
const CAST_FULL = [
  { name: '村長のウメ', role: '里の村長' }, { name: '狩人の源太', role: '里の狩人' },
  { name: '母のチヨ', role: '主人公の母' }, { name: '巫女見習いのサヨ', role: '同行する巫女見習い' },
  { name: '薬屋の平蔵', role: '峠の町の薬屋' }, { name: '宿の女将', role: '峠の町の宿' }, { name: '隊商の頭', role: '峠の町の隊商' },
];
function playerView(st) {
  return {
    promises: PROMISES,
    handout: { places: LEDGER.places, people: CAST_FULL, notHere: LEDGER.noHave },
    peopleHere: peopleHere(st),
    day: st.day, phase: st.phase, result: st.result, status: statusLine(st, false),
    playerName: st.player.name,
    player: { hp: st.player.hp, maxHp: st.player.maxHp }, ally: { name: st.ally.name, hp: st.ally.hp, maxHp: st.ally.maxHp, out: st.ally.out },
    equip: { weapon: st.equip.weapon, armor: st.equip.armor, weaponName: WEAPONS[st.equip.weapon], armorName: ARMORS[st.equip.armor], ownLeather: st.equip.ownLeather },
    money: st.money, arrows: st.arrows, food: st.food, actionsLeft: st.actionsLeft, setup: st.flags.setup,
    zones: STOPS.map((z, i) => ({ key: z.key, name: z.name, cleared: i < st.leg, locked: i > st.leg, current: i === st.leg })),
    zone: STOP_KEYS[st.leg],
    combat: st.combat ? { zone: st.combat.zone, round: st.combat.round, reinforcementLeft: 0, nextWaveIn: 0, enemies: livingEnemies(st).map(e => ({ name: e.name, hp: e.hp, maxHp: e.maxHp })) } : null,
    ledger: { people: peopleHere(st), places: LEDGER.places, noHave: LEDGER.noHave },
    held: heldList(st),
    log: st.log,
    pendingText: !!st.pendingText, pendingFree: !!st.pendingFree,
    intro: INTRO, mission: MISSION, epilogue: st.result === 'win' ? [st.bell.returned ? EPILOGUE_BELL : EPILOGUE] : null,
    pendingAsk: st.pendingAsk ? st.pendingAsk.text : null,
  };
}
function gmView(st) {
  const v = playerView(st);
  v.gmSummary = 'ゲーム: 竜の眠る峠（AI GM TRPG・中編） / あなたはGMです。\n'
    + '## 世界の指針（最上位）\n' + WORLD_GUIDELINE + '\n'
    + '## 硬いルール\n' + HARD_RULES + '\n'
    + '判断の順序・人物と世界の確定事実・世界の物理・裁定の作法・戦闘の規則・秘密は、GMマニュアルに集約されています: https://www.yudetaro.com/games/ryu-touge/muse （まだ読んでいなければ、裁定の前に必ず読んでください）\n'
    + '\n現在: ' + statusLine(st, true)
    + (st.pendingText ? '\nプレイヤーの宣言: 「' + st.pendingText.text + '」→ 解釈してください。通常の行動（移動・攻撃・道具・装備・村や町の行動）に対応づくなら action、発想の勝負なら free（難易度+報酬/効果/custom）、数字の動かない交流や描写なら fiction、世界の理に反するなら reject。プレイヤーが確認のうえ物語を畳む選択をしたなら ending。' : '')
    + (st.pendingAsk ? '\nGMへの質問: 「' + st.pendingAsk.text + '」→ POST /answer で答えてください。行動回数もダイスも動きません。答えは、その場で見える・聞こえる・旅の若者が知っていることだけ（台帳と世界の物理が正解で、なければ「分からない」）。知るために行動が要ることは「ゲームの中で確かめて」と返し、宣言へ誘導してください。' : '')
    + (st.pendingFree ? '\n裁定待ちの自由行動: 「' + st.pendingFree.text + '」→ 裁定を選んでください：ダイスを振るまでもなければ auto（即成功・報酬なし）、そうでなければ難易度 easy/normal/hard、世界の理に反すれば reject。ダイスはシステムが振ります。' : '\n裁定待ちの自由行動はありません。直近の出来事に物語をつけてください（narration）。')
    + '\n直近のログ:\n' + st.log.slice(-8).map(l => '[' + l.kind + '] ' + l.text).join('\n');
  v.pendingFreeText = st.pendingFree ? st.pendingFree.text : null;
  v.pendingTextContent = st.pendingText ? st.pendingText.text : null;
  v.pendingTalkTo = st.pendingText ? (st.pendingText.talkTo || null) : null;
  v.pendingAskText = st.pendingAsk ? st.pendingAsk.text : null;
  return v;
}

module.exports = { newGame, playerAction, playerDeclare, playerAsk, gmInterpret, gmNarrate, gmAnswer, gmRule, playerView, gmView, seedFromCode, STOPS, WEATHER, PRICES, INTRO, MISSION };
