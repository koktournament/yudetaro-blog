'use strict';
/* AI GM TRPG「ゴブリン洞穴」core（設計確定版）
設計原則（AIラーメンと同じ型）：
- 状態・ダイス・勝敗はこのコードが持つ。GM(AI) は物語を語ることと、
  プレイヤーの自由行動を「裁定」することしかできない。
- GM の文章では世界の事実（HP・所持品・フラグ）は一切書き換わらない。
- 舞台は村と洞穴だけ。期間は7日間。都会も長期修行も、世界の側に存在しない。 */

const PROMISES = [
  '舞台は村と近くの洞穴（元・鉱山の坑道）だけです。都会へ行く道は、この物語にはありません。',
  '期間は7日間です。長年の修行のような時間の飛躍はできません。',
  '村に残るのは6人だけ。戦えるのは主人公と幼なじみのミオだけです。',
  '8日目の朝までに洞穴の親玉を倒さなければ、増えたゴブリンが村に押し寄せます。',
  'ゴブリンは耳がいい：いったん戦いが始まれば、奥から増援が来て、どちらかが全滅するまで終わりません。引くなら、戦うな。',
];

/* 世界の指針（最上位）：AIの発明の上限であり、プレイヤーへの予告でもある */
const WORLD_GUIDELINE = 'この世界に特別なものはない。勇者の末裔も、隠された力も、伝説の品もない。村の全員が一般人で、起きることも村の規模のことだけ。';
/* AI判断の指針：禁止事項のリストではなく「判断の順序」で書く */
const DECISION_ORDER = [
  '①まず、求められた物・人が村の台帳に載っているか確かめる。',
  '②なければ「この村にありそうな物」への置き換えを考える。',
  '③結果を効果の語彙（品／次の一撃+2／仕掛け／治療／時間／情報）へ翻訳する。',
  '④難易度を決める。可能性がゼロのことにはダイスを振らない（振ると「出るかも」という嘘の希望を持たせ、1日3回の行動を無駄にさせる）。絶対にない物は、初回から「ない」と明言する。',
  '⑤数字はシステムが確定する。GMは物語で包む。同じ手には同じ裁定を（一貫性）。',
  '合言葉：「物語では豊かに、数字ではケチに」',
].join('\n');
const HARD_RULES = [
  '存在しない物は、ダイスに成功しても絶対に出ない。',
  '数字の天井は「通常のもの+2」。この村にある物は、通常の物と、せいぜい+2の物だけ。',
  '締め切り（8日目の朝）と勝敗はコードが決める。',
  '一度始まった戦闘は、どちらかが全滅するまで終わらない。',
].join('\n');

/* 村の台帳：この世界に存在する物・人・場所の全量。これに載っていない物は存在しない。
   台帳はプレイヤーにも公開する（世界の約束の一部）。 */
const VILLAGE_LEDGER = {
  places: ['自宅（母がいる）', '鍛冶屋（爺さんの家）', '村の広場', '裏山（薬草と小獣）', '村外れの洞穴（元・鉱山の坑道）'],
  people: [
    { name: '母', role: '39歳。家事と裁縫が抜群に上手く、村の布関係を一手に担う。戦闘はまったくできない' },
    { name: '鍛冶屋の爺さん', role: '63歳。元は坑夫で、20年前の退治の中心。今は金物修理と助言と武器研ぎ。剣や鎧は材料がなく作れない' },
    { name: 'ミオ', role: '17歳。幼なじみ。弓の猟師で、同行する唯一の味方。近接は自信がない' },
    { name: '村の子供たち', role: '12歳の二人。戦いたがるが村じゅうに反対され、内緒で洞穴を偵察していて今の洞穴に詳しい' },
    { name: '行商', role: '4日目だけ広場に来る。油の小瓶・矢束・薬草・革当てを売る。外の話が聞けるので人気' },
  ],
  things: ['薬草（裏山で摘める）', '母の弁当（1日1つ）', '小銭（狩りの獲物と交換）', '行商の品（4日目のみ）', '鍛冶屋の修理・武器研ぎ（新造は不可）', '装備：山刀・弓（村の寄せ集め）、母の布当て'],
  notHere: ['名剣や魔法の道具', '宿屋・商店（行商以外）', '兵士・傭兵・馬', '都会や他村への道', 'ここに名前のない人物'],
};

/* 人物と世界の確定事実（GM用の一貫性の担保）。
   原則：攻略や世界の物理に影響する質問は、台帳と物理だけが正解（なければ「知らない」、発明しない）。
   影響しない私事は人物造形から発明してよいが、一度発明した私事はその人物の確定事実として一貫させる。 */
const CAST_NOTES = [
  '年表：30年前、鉱山が掘り尽くされて閉山（爺さんは33歳、坑夫から金物修理へ）。20年前、空き坑道に住み着いたゴブリンを退治（爺さん43歳が中心。当時は村の人数も多く、気づくのが遅れてゴブリンは今よりずっと多かった）。10年前、流行り病で村の約7人が死亡。現在、住人は6人。',
  '主人公とミオは17歳。10年前、二人とも7歳で親を亡くした（主人公の父、ミオの両親は流行り病で死亡）。特定の里親はなく、村じゅうに育てられた。',
  '母は39歳（主人公を22歳で産み、29歳で未亡人）。村にとって不可欠な働き手なので、洞穴への同行は村からも主人公達からも止められている。優しく、手先が器用で、いつも二人を心配している。彼女の縫う布は、行商を通じて街でも買い手がつく（村の外貨）。',
  '爺さんは実の子を流行り病で亡くしている。だから二人が心配でならない。情報は惜しみなく教え、武器も研いでくれる。今は皆に戦闘参加を止められている。洞穴（元坑道）に詳しいのは、坑夫だったから。',
  'ミオは「主役が一人では心配」と同行を譲らなかった。弓は上手いので役に立つと主張する。いつか街に行ってみたいと思っている（行商の外の話が、その憧れの出どころ）。',
  '子供たちは12歳の二人。流行り病のとき2歳で、両親（主人公の親と同じ働き盛り世代）を亡くした。「俺たちもやれる」と思っているが反対され、役に立ちたくて禁止されても偵察に行く。今回ゴブリンの住み着きに早く気づけたのは、彼らのおかげ。',
  '行商はただの商人。このルートは儲からないが、他に行商が来ないので最低限の売上が立ち、巡回を続けている。「最近、モンスターが増えている気がする」は本人の印象の範囲の話で、世界の確定事実ではない。',
  '主人公の初期の武器・防具・持ち物・小銭10は、全部「村じゅうからかき集めたもの」。だから探しても、それ以上は村にない。',
].join('\n');

/* 冒頭の地の文（ゲーム開始前に読む導入） */
const INTRO = [
  'この村に、名前はない。',
  '30年前、鉱山を掘り尽くした。',
  '人は一人、また一人と、村を出ていった。',
  '10年前、流行り病が来た。',
  '残っていた家の半分が、絶えた。',
  '父も、ミオの両親も、そのとき死んだ。',
  '二人は、7歳だった。',
  '二人は、村じゅうに育てられた。',
  'そして、17歳になった。',
  '今、村にいるのは6人。',
  '母。鍛冶屋の爺さん。12歳の子ども二人。',
  'そして、二人。',
  '村の近くの洞穴に、ゴブリンが住み着いた。',
  '掘り尽くした鉱山の、元の坑道だ。',
  '今は、まだ増える前。',
  'でも放っておけば、増え続ける。',
  '増えれば、いつか村を襲う。',
  '20年前も、同じことがあった。',
  'ゴブリンは増えた。それでも、村にはたくさんの人がいた。',
  '大勢で、なんとか退治できた。',
  '今は、その人たちがいない。',
  '戦えるのは、二人だけ。',
  'だから、増える前に叩くしかない。',
  '武器も、持ち物も、小銭も、村じゅうからの寄せ集め。',
  'これが全てだ。これでやるしかない。',
].join('\n');

/* 最初に発表されるミッション（導入文とは別枠で出す。本人の指定） */
const MISSION = [
  '1週間以内にゴブリンを退治せよ！',
  '4日目に行商の商人が村に来る',
];

/* 勝利後の後日談（鉱脈の発見） */
const EPILOGUE = [
  '戦いのあと、二人は最深部のさらに奥に、新しく掘られた坑道を見つけた。ゴブリンたちが、住処を広げるために掘っていたのだ。その壁が、松明の明かりで鈍く光った。',
  '村から爺さんを連れてきた。爺さんは光る壁を長いこと見つめて、やがて震える声で言った。',
  '「間違いない！　これは……諦めたところから、あと3歩分じゃったか！」',
  '30年前に掘り尽くされたはずの鉱山は、あと3歩のところで、新しい鉱脈に届いていた。この先どうなるかは、まだ誰にも分からない。けれどこの村には、久しぶりに「この先」の話ができる夜が来た。',
];

/* 世界の物理：即興戦術が効くかどうかは、GMのその場の判断ではなく先に決めた事実で決まる。 */
const WORLD_FACTS = [
  '煙攻めは効かない：洞穴（元坑道）は奥が広く、通気口から煙が逃げる。20年前に試して失敗した。',
  '水攻めはできない：近くに川はなく、洞穴の入口は村より高い所にある。',
  '落盤は起こせない：岩盤は固く、農具では歯が立たない。',
  '毒攻めはできない：水や食料に混ぜるような毒は村にない。ただし猟師が小獣に使う弱い毒のような物は、GMの判断で「+2相当の小物」としてだけ存在しうる。',
  '洞穴ごと燃やすことはできない：入口付近に燃える物がなく、奥まで火は届かない（油の小瓶は戦闘で投げる分だけ）。',
  'ゴブリンと交渉はできない：言葉が通じず、小銭や食べ物で懐くこともない。',
  'ゴブリンは耳がいい：戦いの音は奥に届く。戦闘が長引けば、奥から増援が来る（3ラウンドごと）。',
];
const ZONES = {
  iriguchi: { name: '洞穴の入口', pool: [6, 6] },
  chuso: { name: '洞穴の中層', pool: [6, 6, 7] },
  saishin: { name: '洞穴の最深部', pool: [6, 6] },
};
const ZONE_ORDER = ['iriguchi', 'chuso', 'saishin'];
const BOSS = { name: 'ゴブリンの親玉', hp: 18, die: 6 };
const PRICES = { oil: 8, arrows: 3, herb: 5, leather: 8 };
const FREE_TARGETS = { easy: 2, normal: 4, hard: 5 };
const ARMORS = { none: 'なし', cloth: '母の布当て', leather: '革当て' };
const WEAPONS = { blade: '山刀', bow: '弓' };

function rnd(st) {
  st.rngState = (st.rngState + 0x6D2B79F5) >>> 0;
  let t = st.rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function die(st, n) { const v = 1 + Math.floor(rnd(st) * n); if (st._rolls) st._rolls.push({ sides: n, value: v }); return v; }
/* 1回の手続きで振られたダイスを、その手続きで最初に追加されたログへ付ける（画面のダイス演出用） */
function captureRolls(st, fn) {
  if (st._rolls) return fn();
  const start = st.log.length;
  st._rolls = [];
  try { return fn(); } finally {
    const rolls = st._rolls; st._rolls = null;
    if (rolls && rolls.length) for (let i = start; i < st.log.length; i++) { if (!st.log[i].rolls) { st.log[i].rolls = rolls; break; } }
  }
}
function log(st, kind, text) { st.log.push({ kind, text }); if (st.log.length > 300) st.log.splice(0, st.log.length - 300); }

function newGame(seed) {
  const st = {
    v: 2, rngState: (seed >>> 0) || 1,
    day: 1, phase: 'village', // village -> cave -> ended
    actionsLeft: 3,
    playerName: '若者',
    player: { hp: 20, maxHp: 20 },
    ally: { name: '幼なじみのミオ', hp: 14, maxHp: 14, out: false },
    money: 10, arrows: 6,
    items: { herb: 1, bento: 0, oil: 0, trap: 1 },
    customItems: [],
    equip: { weapon: 'blade', armor: 'cloth' },
    ownLeather: false,
    luck: 0,
    flags: { heardOldman: false, heardKid: false, bentoDay: 0, setup: false, infoIdx: 0, atkBonus: 0, leatherUsed: false },
    poolHp: { iriguchi: ZONES.iriguchi.pool.slice(), chuso: ZONES.chuso.pool.slice(), saishin: ZONES.saishin.pool.slice() },
    bossAlive: true,
    zones: { iriguchi: false, chuso: false, saishin: false }, // 制圧済みか（pool と親玉から導出して同期する）
    zone: null, combat: null,
    pendingFree: null, pendingText: null,
    result: null,
    log: [],
  };
  log(st, 'sys', '【ミッション】' + MISSION[0]);
  log(st, 'sys', '【ミッション】' + MISSION[1]);
  return st;
}

function syncZones(st) {
  for (const z of ZONE_ORDER) st.zones[z] = st.poolHp[z].length === 0 && (z !== 'saishin' || !st.bossAlive);
}

function endDay(st, why) {
  log(st, 'sys', why + '――' + st.day + '日目が終わった。');
  st.player.hp = Math.min(st.player.maxHp, st.player.hp + 3);
  if (!st.ally.out) st.ally.hp = Math.min(st.ally.maxHp, st.ally.hp + 3);
  st.day += 1;
  st.actionsLeft = 3;
  st.phase = 'village';
  st.zone = null; st.combat = null;
  if (st.day > 7 && !st.result) {
    st.result = 'lose_raid'; st.phase = 'ended';
    log(st, 'sys', '8日目の朝。増えきったゴブリンが村に押し寄せた――村は守れなかった。');
  } else {
    log(st, 'sys', st.day + '日目の朝。残り' + (8 - st.day) + '日。');
    if (st.day === 4) log(st, 'sys', '行商が村に着いた。売り物は――油の小瓶（小銭' + PRICES.oil + '）、矢束（' + PRICES.arrows + '）、薬草（' + PRICES.herb + '）、革当て（' + PRICES.leather + '）。行商がいるのは今日だけだ。');
  }
}

/* ===== 戦闘：始めたら、どちらかが全滅するまで終わらない =====
   ゴブリンは耳がいい。3ラウンドごとに奥から増援が来る。
   増援は「手前から順に奥の残り」から来て、最後は親玉が一人で出てくる。 */
function spawnFromPool(st, zoneId) {
  const hp = st.poolHp[zoneId].shift();
  return { name: 'ゴブリン', hp, maxHp: hp, die: 4, boss: false, from: zoneId };
}
function startCombat(st, zoneId) {
  const z = ZONES[zoneId];
  const enemies = [];
  while (st.poolHp[zoneId].length) enemies.push(spawnFromPool(st, zoneId));
  if (zoneId === 'saishin' && st.bossAlive) enemies.unshift({ name: BOSS.name, hp: BOSS.hp, maxHp: BOSS.hp, die: BOSS.die, boss: true, from: 'saishin' });
  st.combat = { zone: zoneId, round: 1, waves: 0, enemies };
  st.flags.leatherUsed = false;
  log(st, 'sys', z.name + '――' + enemies.map(e => e.name).join('、') + 'が現れた！');
  log(st, 'sys', '（戦いが始まった。ゴブリンは耳がいい――決着がつくまで、この場からは引けない）');
  if (st.flags.setup) {
    st.flags.setup = false;
    const minion = st.combat.enemies.filter(e => !e.boss && e.hp > 0).sort((a, b) => a.hp - b.hp)[0];
    if (minion) { minion.hp = 0; log(st, 'sys', '仕掛けが決まった！ ' + minion.name + 'は戦う前に倒れた'); }
    else { const boss = st.combat.enemies[0]; boss.hp -= 4; log(st, 'sys', '仕掛けが決まった！ ' + boss.name + 'に先制の4ダメージ'); }
  }
  syncZones(st);
}
function livingEnemies(st) { return st.combat ? st.combat.enemies.filter(e => e.hp > 0) : []; }
function reinforcementLeft(st) {
  // まだ奥から来る者がいるか（増援の残り or 親玉）
  if (!st.combat) return false;
  const zi = ZONE_ORDER.indexOf(st.combat.zone);
  for (let i = zi + 1; i < ZONE_ORDER.length; i++) if (st.poolHp[ZONE_ORDER[i]].length) return true;
  if (st.bossAlive && !st.combat.enemies.some(e => e.boss)) return true;
  return false;
}
function maybeReinforce(st) {
  if (!st.combat) return;
  if (st.combat.round <= 1 || (st.combat.round - 1) % 3 !== 0) return;
  if (!reinforcementLeft(st)) return;
  const zi = ZONE_ORDER.indexOf(st.combat.zone);
  for (let i = zi + 1; i < ZONE_ORDER.length; i++) {
    const zid = ZONE_ORDER[i];
    if (st.poolHp[zid].length) {
      const e = spawnFromPool(st, zid);
      st.combat.enemies.push(e);
      st.combat.waves += 1;
      log(st, 'sys', '戦いの音を聞きつけて、奥からゴブリンが1体出てきた！（増援）');
      syncZones(st);
      return;
    }
  }
  if (st.bossAlive && !st.combat.enemies.some(e => e.boss)) {
    st.combat.enemies.push({ name: BOSS.name, hp: BOSS.hp, maxHp: BOSS.hp, die: BOSS.die, boss: true, from: 'saishin' });
    st.combat.waves += 1;
    log(st, 'sys', '奥の気配が変わった――ゴブリンの親玉が、一人で姿を現した！');
  }
}
function armorReduce(st, dmg) {
  // 防具は村の普通の物：布当て・革当ては被ダメージ-1。革当ては一度だけ大きな一撃を受け止める
  if (st.equip.armor === 'leather' && !st.flags.leatherUsed && dmg >= 4) {
    st.flags.leatherUsed = true;
    log(st, 'sys', '革当てが大きな一撃を受け止めた！（ダメージ0）');
    return 0;
  }
  if (st.equip.armor === 'cloth' || st.equip.armor === 'leather') return Math.max(0, dmg - 1);
  return dmg;
}
/* 敗北は死。どちらか一方でも倒れれば、ショックのうちに殺されて物語は終わる（本人の裁定） */
function partyDown(st, who) {
  st.combat = null;
  st.result = 'lose_dead'; st.phase = 'ended';
  if (who === 'ally') log(st, 'sys', 'ミオが倒れた。ショックで動けなくなった若者もろとも、闇に呑まれた――物語はここで終わる。');
  else log(st, 'sys', '若者が倒れた。呆然とするミオの叫びも、闇に消えた――物語はここで終わる。');
}
function enemyPhase(st) {
  for (const e of livingEnemies(st)) {
    const toAlly = !st.ally.out && st.ally.hp > 0 && rnd(st) < 0.4;
    const roll = die(st, 6);
    if (roll >= 3) {
      const raw = die(st, e.die);
      if (toAlly) { st.ally.hp -= raw; log(st, 'dice', e.name + 'の攻撃がミオに命中（' + raw + 'ダメージ）'); }
      else { const dmg = armorReduce(st, raw); st.player.hp -= dmg; log(st, 'dice', e.name + 'の攻撃が命中（' + dmg + 'ダメージ）'); }
    } else {
      log(st, 'dice', e.name + 'の攻撃は外れた');
    }
    if (st.player.hp <= 0) { partyDown(st, 'player'); return; }
    if (!st.ally.out && st.ally.hp <= 0) { st.ally.hp = 0; partyDown(st, 'ally'); return; }
  }
  if (st.combat) st.combat.round += 1;
}
function allyPhase(st) {
  if (st.ally.out || st.ally.hp <= 0 || !st.combat) return;
  const foes = livingEnemies(st); if (!foes.length) return;
  /* 自律回復：傷が深ければ、撃つのをやめて自分の判断で薬草を使う（2026-11-03 本人の裁定） */
  if (st.ally.hp <= 5 && st.items.herb > 0) {
    st.items.herb -= 1;
    const h = die(st, 6) + 2;
    st.ally.hp = Math.min(st.ally.maxHp, st.ally.hp + h);
    log(st, 'dice', 'ミオは薬草を使った（ミオのHP+' + h + '）');
    return;
  }
  if (st.arrows <= 0) { log(st, 'dice', 'ミオは矢筒を確かめたが空だった。オロオロしている'); return; }
  st.arrows -= 1;
  const roll = die(st, 6);
  if (roll >= 3) { const dmg = die(st, 6); foes[0].hp -= dmg; log(st, 'dice', 'ミオの弓が' + foes[0].name + 'に命中（' + dmg + 'ダメージ）'); }
  else log(st, 'dice', 'ミオの矢は外れた');
}
function afterCombatTurn(st) {
  // プレイヤーの手番のあと：味方→敵の順に進め、決着と増援を判定する
  if (!st.combat) return;
  if (livingEnemies(st).length) allyPhase(st);
  // 親玉が倒れたら、その場で勝利（残党は逃げる）
  const boss = st.combat.enemies.find(e => e.boss);
  if (boss && boss.hp <= 0 && st.bossAlive) {
    st.bossAlive = false;
    st.combat = null;
    syncZones(st);
    st.result = 'win'; st.phase = 'ended';
    log(st, 'sys', '親玉が倒れた。残りのゴブリンは散り散りに逃げていく――村は守られた。');
    for (const line of EPILOGUE) log(st, 'story', line);
    return;
  }
  if (livingEnemies(st).length) enemyPhase(st);
  if (!st.combat) return; // 敗北（死亡）で終了済み
  if (!livingEnemies(st).length) {
    const zid = st.combat.zone;
    st.combat = null;
    syncZones(st);
    if (st.zones[zid]) log(st, 'sys', ZONES[zid].name + 'を制圧した。');
    else log(st, 'sys', 'この場の敵は片付いた。（奥にはまだ残りがいる）');
    return;
  }
  maybeReinforce(st);
}

function playerActionInner(st, action) {
  if (st.phase === 'ended') return { ok: false, error: '物語は終わっています' };
  const t = action && action.type;
  if (st.pendingFree) return { ok: false, error: '自由行動の裁定を待っています' };
  /* ---- 名前・装備（行動回数を消費しない） ---- */
  if (t === 'setname') {
    const nm = String(action.name || '').trim().slice(0, 8);
    if (!nm) return { ok: false, error: '名前が空です' };
    st.playerName = nm;
    log(st, 'sys', '主人公の名前は「' + nm + '」になった。');
    return { ok: true };
  }
  if (t === 'equip') {
    if (st.combat) return { ok: false, error: '戦闘中は装備を変えられない' };
    if (action.slot === 'weapon' && WEAPONS[action.item]) { st.equip.weapon = action.item; log(st, 'sys', '武器を' + WEAPONS[action.item] + 'に持ち替えた。'); return { ok: true }; }
    const armorItem = action.item === 'armor' ? 'leather' : action.item;
    if (action.slot === 'armor' && ARMORS[armorItem]) {
      if (armorItem === 'leather' && !st.ownLeather) return { ok: false, error: '革当てを持っていない' };
      st.equip.armor = armorItem; log(st, 'sys', '防具を「' + ARMORS[armorItem] + '」にした。'); return { ok: true };
    }
    return { ok: false, error: 'その装備はない' };
  }
  /* ---- 罠の仕掛け（村でも洞穴でも可・戦闘中は不可。ダイスなしで確実、行動1回と罠1つを消費） ---- */
  if (t === 'settrap') {
    if (st.combat) return { ok: false, error: '戦闘中は仕掛けられない' };
    if (st.flags.setup) return { ok: false, error: '罠はもう仕掛けてある' };
    if (st.items.trap <= 0) return { ok: false, error: '罠を持っていない' };
    if (st.actionsLeft <= 0) return { ok: false, error: '今日の行動回数はもう残っていない' };
    st.actionsLeft -= 1; st.items.trap -= 1; st.flags.setup = true;
    log(st, 'sys', '罠を仕掛けた（次の戦闘で、敵1体が戦う前に倒れる）');
    return { ok: true };
  }
  /* ---- 村フェーズ ---- */
  if (st.phase === 'village') {
    const needAct = () => { if (st.actionsLeft <= 0) return '今日の行動回数はもう残っていない'; st.actionsLeft -= 1; return null; };
    if (t === 'talk_oldman') { const e = needAct(); if (e) return { ok: false, error: e };
      if (!st.flags.heardOldman) { st.flags.heardOldman = true; log(st, 'sys', '鍛冶屋の爺さん（20年前に退治した当事者）：「親玉を倒せば残りは散る。油はよく燃えて効くぞ。罠も入口で使える。それと――奴らは耳がいい。一度戦いになれば、どちらかが全滅するまで終わらん。引くなら、戦うな」'); }
      else log(st, 'sys', '爺さん：「わしはもう行けん。だが道具の修理と武器研ぎなら任せろ」');
      return { ok: true };
    }
    if (t === 'talk_kid') { const e = needAct(); if (e) return { ok: false, error: e };
      if (!st.flags.heardKid) { st.flags.heardKid = true; st.luck += 2; log(st, 'sys', '村の子供たち（言いつけを破って偵察に行っていた）：「入口の見張りは夕方に居眠りするよ。奥のほうは、なんか掘る音がする」――次の戦闘の最初の一撃に勢いがつく（+2）'); }
      else log(st, 'sys', '子供たち：「ゴブリン、夜は村のほうを見てる。怖いよ」');
      return { ok: true };
    }
    if (t === 'gather') { const e = needAct(); if (e) return { ok: false, error: e };
      const n = rnd(st) < 0.5 ? 2 : 1; st.items.herb += n; log(st, 'sys', '山で薬草を摘んだ（薬草+' + n + '）'); return { ok: true };
    }
    if (t === 'hunt') { const e = needAct(); if (e) return { ok: false, error: e };
      st.money += 4; log(st, 'sys', '小獣を狩って換金した（小銭+4）'); return { ok: true };
    }
    if (t === 'bento') { const e = needAct(); if (e) return { ok: false, error: e };
      if (st.flags.bentoDay === st.day) return { ok: false, error: '今日の弁当はもうもらった' };
      st.flags.bentoDay = st.day; st.items.bento += 1; log(st, 'sys', '母から弁当を受け取った（弁当+1）'); return { ok: true };
    }
    if (t === 'rest') { const e = needAct(); if (e) return { ok: false, error: e };
      st.player.hp = Math.min(st.player.maxHp, st.player.hp + 4);
      if (!st.ally.out) st.ally.hp = Math.min(st.ally.maxHp, st.ally.hp + 4);
      log(st, 'sys', '家で体を休めた（HP+4）'); return { ok: true };
    }
    if (t === 'buy') {
      if (st.day !== 4) return { ok: false, error: '行商が来るのは4日目だけだ' };
      const item = action.item === 'armor' ? 'leather' : action.item; if (!(item in PRICES)) return { ok: false, error: 'その品は売っていない' };
      if (st.money < PRICES[item]) return { ok: false, error: '小銭が足りない' };
      if (item === 'leather' && st.ownLeather) return { ok: false, error: '革当てはもう持っている' };
      st.money -= PRICES[item];
      if (item === 'arrows') st.arrows += 6;
      else if (item === 'leather') st.ownLeather = true;
      else st.items[item] += 1;
      log(st, 'sys', '行商から買った（' + ({ oil: '油の小瓶', arrows: '矢束', herb: '薬草', leather: '革当て' })[item] + '）'); return { ok: true };
    }
    if (t === 'depart') { st.phase = 'cave'; st.zone = null; log(st, 'sys', '洞穴へ向かった。'); return { ok: true }; }
    if (t === 'sleep') { endDay(st, '今日は村で過ごした'); return { ok: true }; }
  }
  /* ---- 洞穴フェーズ ---- */
  if (st.phase === 'cave') {
    if (!st.combat) {
      if (t === 'enter') {
        if (st.actionsLeft <= 0) return { ok: false, error: '今日の行動回数はもう残っていない（帰ることはできる）' };
        const zid = action.zone;
        const idx = ZONE_ORDER.indexOf(zid); if (idx < 0) return { ok: false, error: 'その場所はない' };
        if (idx > 0 && st.poolHp[ZONE_ORDER[idx - 1]].length > 0) return { ok: false, error: 'まず手前の区域の敵を片付けないと進めない' };
        st.actionsLeft -= 1;
        st.zone = zid;
        if (st.zones[zid]) { log(st, 'sys', ZONES[zid].name + 'は静かだ（制圧済み）'); return { ok: true }; }
        startCombat(st, zid); return { ok: true };
      }
      if (t === 'return') { endDay(st, '村へ帰った'); return { ok: true }; }
      if (t === 'flee') return { ok: false, error: '戦いは始まっていない。帰るなら「村へ帰る」でよい' };
    } else {
      if (t === 'attack') {
        const w = action.weapon === 'bow' ? 'bow' : (action.weapon === 'blade' ? 'blade' : st.equip.weapon);
        if (w === 'bow') { if (st.arrows <= 0) return { ok: false, error: '矢がない' }; st.arrows -= 1; }
        const foes = livingEnemies(st); if (!foes.length) return { ok: false, error: '敵がいない' };
        const roll = die(st, 6) + st.luck; st.luck = 0;
        if (roll >= 3) { let dmg = w === 'bow' ? die(st, 6) : die(st, 6) + 1; if (st.flags.atkBonus) { dmg += st.flags.atkBonus; st.flags.atkBonus = 0; } foes[0].hp -= dmg; log(st, 'dice', (w === 'bow' ? '弓' : '山刀') + 'が' + foes[0].name + 'に命中（' + dmg + 'ダメージ）'); }
        else log(st, 'dice', '攻撃は外れた');
        afterCombatTurn(st); return { ok: true };
      }
      if (t === 'item') {
        const item = action.item;
        if (item === 'trap') return { ok: false, error: '罠は戦闘中に使うものではない。戦う前に仕掛けておくものだ' };
        if (typeof item === 'string' && item.startsWith('custom:')) {
          const ci = st.customItems[Number(item.slice(7))];
          if (!ci || ci.count <= 0) return { ok: false, error: 'その道具は持っていない' };
          ci.count -= 1;
          if (ci.count <= 0) st.customItems.splice(Number(item.slice(7)), 1);
          if (ci.effect === 'atk') { st.flags.atkBonus = 2; log(st, 'sys', ci.name + 'を使った（次の攻撃のダメージ+2）'); }
          else if (ci.effect === 'heal') { const h = die(st, 4) + 1; st.player.hp = Math.min(st.player.maxHp, st.player.hp + h); log(st, 'sys', ci.name + 'を使った（HP+' + h + '）'); }
          else log(st, 'sys', ci.name + 'を使った');
          afterCombatTurn(st); return { ok: true };
        }
        if (!(item in st.items) || st.items[item] <= 0) return { ok: false, error: 'その道具は持っていない' };
        if (item === 'herb') { st.items.herb -= 1; const h = die(st, 6) + 2; st.player.hp = Math.min(st.player.maxHp, st.player.hp + h); log(st, 'sys', '薬草を使った（HP+' + h + '）'); }
        else if (item === 'bento') { st.items.bento -= 1; st.player.hp = Math.min(st.player.maxHp, st.player.hp + 5); if (!st.ally.out) st.ally.hp = Math.min(st.ally.maxHp, st.ally.hp + 5); log(st, 'sys', '母の弁当を分け合った（二人ともHP+5）'); }
        else if (item === 'oil') {
          const foes = livingEnemies(st).filter(e => !e.boss);
          if (!foes.length) { log(st, 'sys', '雑魚がいないので使わなかった'); return { ok: true }; }
          st.items[item] -= 1; foes[0].hp = 0;
          log(st, 'sys', '油を投げて火をつけた。ゴブリンが1匹燃え上がった');
        } else return { ok: false, error: '戦闘では使えない' };
        afterCombatTurn(st); return { ok: true };
      }
      if (t === 'flee' || t === 'return') return { ok: false, error: '一度戦いが始まれば、どちらかが全滅するまで終わらない（ゴブリンは耳がいい）' };
    }
  }
  if (t === 'free') {
    const text = String(action.text || '').slice(0, 200);
    if (!text) return { ok: false, error: '行動を書いてください' };
    if (st.combat) return { ok: false, error: '戦闘中は自由行動できません' };
    st.pendingFree = { text, day: st.day };
    log(st, 'player', '自由行動：「' + text + '」');
    return { ok: true };
  }
  return { ok: false, error: 'その行動は今はできません' };
}

/* GM の手はこの2つだけ。どちらも世界の事実を直接は書き換えない */
function gmInterpret(st, spec) { return captureRolls(st, () => gmInterpretInner(st, spec)); }
function gmNarrate(st, text) {
const t = String(text || '').slice(0, 1000);
if (!t) return { ok: false, error: '文章が空です'};
log(st, 'gm', t);
return { ok: true};
}
/* 自由行動の成功で渡せる品：村にありそうで、システムに定義済みの物だけ */
const GRANTABLE = { oil: '油の小瓶', herb: '薬草', trap: '罠', arrows: '矢（+3）'};
/* 自由行動の成功で選べる「効果」の語彙。入力（プレイヤーの発想）は無限、結果はこの語彙の範囲でシステムが確定する */
const EFFECTS = { setup: '仕掛け', treat: '治療', time: '時間', info: '情報'};
const INFO_FACTS = [
'発見：ゴブリンは夕方に一度、入口の見張りを交代する。その短い隙が狙い目だ',
'発見：子供たちの偵察によれば、中層には掘りかけの横穴がある。ゴブリンは住処を奥へ広げているらしい',
'発見：親玉は大きな音を嫌う。怯んだ隙は物語の上でも本物だ',
'発見：20年前、爺さんは最深部の手前で松明を切らして引き返した。明かりの備えは多いほうがいい',
];
function gmRuleInner(st, tier, reward, custom) {
if (!st.pendingFree) return { ok: false, error: '裁定待ちの自由行動がありません'};
if (tier === 'reject') { log(st, 'sys', 'GM裁定：その行動はこの世界ではできない。'); st.pendingFree = null; return { ok: true};}
if (tier === 'auto') { log(st, 'sys', 'GM裁定：ダイスを振るまでもない――そのまま成功した（物語上の成功。数字の報酬はない）'); st.pendingFree = null; return { ok: true, auto: true, success: true};}
const target = FREE_TARGETS[tier];
if (target && st.actionsLeft <= 0) return { ok: false, error: '今日の行動回数はもう残っていない'};
if (target) st.actionsLeft -= 1;
if (!target) return { ok: false, error: '難易度は easy / normal / hard / auto / reject のいずれかです'};
const roll = die(st, 6);
const free = st.pendingFree; st.pendingFree = null;
if (roll >= target) {
if (reward === 'custom' && custom && String(custom.name || '').trim() && st.customItems.length < 6) {
const nm = String(custom.name).slice(0, 12);
const ef = ['atk', 'heal', 'none'].includes(custom.effect)? custom.effect: 'none';
st.customItems.push({ name: nm, effect: ef, count: 1});
log(st, 'dice', '自由行動の判定：出目' + roll + '（目標' + target + '）成功！ ' + nm + 'を手に入れた（持ち物に記入した）');
}
else if (reward && EFFECTS[reward]) {
if (reward === 'setup') { st.flags.setup = true; log(st, 'dice', '自由行動の判定：出目' + roll + '（目標' + target + '）成功！ 仕掛けが整った（次の戦闘で敵1体が戦う前に倒れる）');}
else if (reward === 'treat') { const tgt = (!st.ally.out && st.ally.hp / st.ally.maxHp < st.player.hp / st.player.maxHp)? st.ally: st.player; const h = die(st, 4); tgt.hp = Math.min(tgt.maxHp, tgt.hp + h); log(st, 'dice', '自由行動の判定：出目' + roll + '（目標' + target + '）成功！ 工夫した手当てが効いた（' + (tgt === st.ally? 'ミオ': '主人公') + 'のHP+' + h + '）');}
else if (reward === 'time') { if (st.phase === 'village') { st.actionsLeft += 1; log(st, 'dice', '自由行動の判定：出目' + roll + '（目標' + target + '）成功！ 段取りが冴えて、今日の行動が1回増えた');} else { st.luck += 2; log(st, 'dice', '自由行動の判定：出目' + roll + '（目標' + target + '）成功！ 次の一撃に+2の勢いがついた');}}
else if (reward === 'info') { const f = INFO_FACTS[st.flags.infoIdx % INFO_FACTS.length]; st.flags.infoIdx += 1; log(st, 'dice', '自由行動の判定：出目' + roll + '（目標' + target + '）成功！ ' + f);}
}
else if (reward && GRANTABLE[reward]) {
if (reward === 'arrows') st.arrows += 3; else st.items[reward] += 1;
log(st, 'dice', '自由行動の判定：出目' + roll + '（目標' + target + '）成功！ ' + GRANTABLE[reward] + 'を手に入れた');
}
else if (st.phase === 'cave') { st.luck += 2; log(st, 'dice', '自由行動の判定：出目' + roll + '（目標' + target + '）成功！ 次の一撃に+2の勢いがついた');}
else { st.items.herb += 1; log(st, 'dice', '自由行動の判定：出目' + roll + '（目標' + target + '）成功！ うまいこといって、薬草を1つ見つけた');}
} else {
if (tier === 'hard') { st.player.hp = Math.max(1, st.player.hp - 1); log(st, 'dice', '自由行動の判定：出目' + roll + '（目標' + target + '）失敗。無理がたたって軽い怪我（HP-1）');}
else log(st, 'dice', '自由行動の判定：出目' + roll + '（目標' + target + '）失敗。うまくいかなかった');
}
return { ok: true, roll, success: roll >= target};
}

/* 行動回数を使い果たしたら、その日は自動で終わる（プレイヤーが「寝る」を宣言する手間をなくす）。
   判定は「手番が終わって待機状態（戦闘中でなく、裁定・解釈待ちでもない）のに行動0」のとき。 */
function maybeAutoSleep(st) {
if (st.result || st.combat || st.pendingFree || st.pendingText) return;
if (st.actionsLeft > 0) return;
if (st.phase === 'village') endDay(st, '今日の行動を使い果たした');
else if (st.phase === 'cave') endDay(st, 'これ以上は動けないので、村へ帰って休んだ');
}
function playerAction(st, action) {
return captureRolls(st, () => { const r = playerActionInner(st, action); if (r.ok) maybeAutoSleep(st); return r; });
}
function gmRule(st, tier, reward, custom) {
return captureRolls(st, () => { const r = gmRuleInner(st, tier, reward, custom); if (r.ok) maybeAutoSleep(st); return r; });
}

const ITEM_NAMES = { herb: '薬草', bento: '弁当', oil: '油', trap: '罠'};
function heldList(st) {
const list = [];
for (const k of Object.keys(ITEM_NAMES)) if (st.items[k] > 0) list.push({ key: k, name: ITEM_NAMES[k], count: st.items[k]});
st.customItems.forEach((ci, i) => { if (ci.count > 0) list.push({ key: 'custom:' + i, name: ci.name, count: ci.count, effect: ci.effect});});
return list;
}
function heldText(st) {
const h = heldList(st);
return '／持ち物：' + (h.length? h.map(x => x.name + '×' + x.count).join(' '): 'なし');
}
/* 文章式の入力：プレイヤーは「どうする？」に文章で答えるだけ。GMが解釈してシステムを動かす */
function playerDeclare(st, text, talkTo) {
if (st.phase === 'ended') return { ok: false, error: '物語は終わっています'};
const t = String(text || '').slice(0, 300).trim();
if (!t) return { ok: false, error: '文章を書いてください'};
if (st.pendingText || st.pendingFree) return { ok: false, error: 'GMの応答を待っています'};
if (talkTo) {
const person = VILLAGE_LEDGER.people.find(p => p.name === talkTo);
if (!person) return { ok: false, error: 'その人物は村にいない'};
if (talkTo === '行商' && st.day!== 4) return { ok: false, error: '行商が来るのは4日目だけだ'};
}
st.pendingText = { text: t, talkTo: talkTo || null};
log(st, 'player', (talkTo? '（' + talkTo + 'へ）': '') + '「' + t + '」');
return { ok: true};
}
function gmInterpretInner(st, spec) {
if (!st.pendingText) return { ok: false, error: '解釈待ちの宣言がありません'};
const kind = spec && spec.as;
if (kind === 'fiction') { st.pendingText = null; log(st, 'sys', '（物語として受け取られた）'); return { ok: true};}
if (kind === 'reject') { st.pendingText = null; log(st, 'sys', 'GM：それはこの世界ではできない'); return { ok: true};}
if (kind === 'action') {
const r = playerAction(st, (spec && spec.action) || {});
if (!r.ok) return r;
st.pendingText = null;
maybeAutoSleep(st);
return { ok: true};
}
if (kind === 'free') {
if (st.combat) return { ok: false, error: '戦闘中は自由行動として裁定できません'};
st.pendingFree = { text: st.pendingText.text, day: st.day};
st.pendingText = null;
return gmRule(st, spec.tier || 'normal', spec.reward, spec.custom);
}
return { ok: false, error: '解釈の形式が不正です'};
}

function statusLine(st, forGm) {
return st.day + '日目／' + (st.phase === 'village'? '村（残り行動' + st.actionsLeft + '）': st.phase === 'cave'? '洞穴' + (st.combat? '・戦闘中': ''): '終了')
+ '／' + st.playerName + ' HP ' + st.player.hp + '/' + st.player.maxHp
+ '／ミオHP ' + (st.ally.out? '離脱': st.ally.hp + '/' + st.ally.maxHp)
+ '／装備：' + WEAPONS[st.equip.weapon] + '・' + ARMORS[st.equip.armor]
+ '／小銭' + st.money + '／矢' + st.arrows
+ heldText(st)
+ (st.flags.setup? '／仕掛け済み': '')
+ '／制圧：入口' + (st.zones.iriguchi? '済': '未') + '・中層' + (st.zones.chuso? '済': '未') + '・最深部' + (st.zones.saishin? '済': '未')
+ (forGm ? '／奥の残り：' + ZONE_ORDER.reduce((a, z) => a + st.poolHp[z].length, 0) + '体＋親玉' + (st.bossAlive? '健在': '討伐済') : '');
}
function playerView(st) {
return {
day: st.day, phase: st.phase, result: st.result, promises: PROMISES, ledger: { places: VILLAGE_LEDGER.places, people: VILLAGE_LEDGER.people, notHere: VILLAGE_LEDGER.notHere },
intro: INTRO, mission: MISSION, epilogue: st.result === 'win'? EPILOGUE: null,
actionsLeft: st.actionsLeft, setup: !!st.flags.setup, status: statusLine(st),
playerName: st.playerName,
player: st.player, ally: { name: st.ally.name, hp: st.ally.hp, maxHp: st.ally.maxHp, out: st.ally.out},
equip: { weapon: st.equip.weapon, weaponName: WEAPONS[st.equip.weapon], armor: st.equip.armor, armorName: ARMORS[st.equip.armor], ownLeather: st.ownLeather},
money: st.money, arrows: st.arrows, items: st.items, held: heldList(st), customItems: st.customItems,
zones: ZONE_ORDER.map(id => ({ id, name: ZONES[id].name, cleared: st.zones[id], locked: ZONE_ORDER.indexOf(id) > 0 && st.poolHp[ZONE_ORDER[ZONE_ORDER.indexOf(id) - 1]].length > 0})),
zone: st.zone,
combat: st.combat? { zone: ZONES[st.combat.zone].name, round: st.combat.round, waves: st.combat.waves, reinforcementLeft: reinforcementLeft(st), nextWaveIn: reinforcementLeft(st)? 3 - ((st.combat.round - 1) % 3): null, enemies: st.combat.enemies.map(e => ({ name: e.name, hp: e.hp, maxHp: e.maxHp}))}: null,
pendingFree:!!st.pendingFree, pendingText:!!st.pendingText, freeAvailable: st.actionsLeft > 0 &&!st.combat && st.phase!== 'ended',
log: st.log,
};
}
function gmView(st) {
const v = playerView(st);
v.gmSummary = 'ゲーム: ゴブリン洞穴（AI GM TRPG） / あなたはGMです。\n'
+ '## 世界の指針（最上位）\n' + WORLD_GUIDELINE + '\n'
+ '## 硬いルール\n' + HARD_RULES + '\n'
+ '判断の順序・人物と世界の確定事実・世界の物理・裁定の作法・戦闘の規則・秘密は、GMマニュアルに集約されています: https://www.yudetaro.com/games/goblin-trpg/muse （まだ読んでいなければ、裁定の前に必ず読んでください）\n'
+ '\n現在: ' + statusLine(st, true)
+ (st.pendingText? '\nプレイヤーの宣言: 「' + st.pendingText.text + '」→ 解釈してください。通常の行動（攻撃・移動・道具・装備・村の行動）に対応づくなら action、発想の勝負なら free（難易度+報酬/効果/custom）、数字の動かない交流や描写なら fiction、世界の事実に反するなら reject。': '')
+ (st.pendingFree? '\n裁定待ちの自由行動: 「' + st.pendingFree.text + '」→ 裁定を選んでください：ダイスを振るまでもなければ auto（即成功・報酬なし）、そうでなければ難易度 easy/normal/hard、世界の事実に反すれば reject。ダイスはシステムが振ります。': '\n裁定待ちの自由行動はありません。直近の出来事に物語をつけてください（narration）。')
+ '\n直近のログ:\n' + st.log.slice(-8).map(l => '[' + l.kind + '] ' + l.text).join('\n');
v.pendingFreeText = st.pendingFree? st.pendingFree.text: null;
v.pendingTextContent = st.pendingText? st.pendingText.text: null;
v.pendingTalkTo = st.pendingText? (st.pendingText.talkTo || null): null;
return v;
}

module.exports = { newGame, playerAction, playerDeclare, gmInterpret, gmNarrate, gmRule, playerView, gmView, PROMISES, VILLAGE_LEDGER, WORLD_FACTS, WORLD_GUIDELINE, DECISION_ORDER, HARD_RULES, CAST_NOTES, INTRO, EPILOGUE, ZONES, ZONE_ORDER};
