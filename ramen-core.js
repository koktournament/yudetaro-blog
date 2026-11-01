'use strict';
/* AIラーメン Muse支店 - ゲーム本体ロジック（ストレージ非依存）
   倉庫(Worker/DO or ローカルMap)が state を丸ごと保存し、本モジュールの関数で進める。
   情報の非対称は viewFor() が担保する：役割の見えない情報はビューに含めない。 */

const ITEMS = [
  { id: 'shoyu', name: '醤油ラーメン', price: 800, cost: 260, share: 0.45 },
  { id: 'miso',  name: '味噌ラーメン', price: 900, cost: 320, share: 0.30 },
  { id: 'shio',  name: '塩ラーメン',   price: 850, cost: 290, share: 0.25 },
];
const WEEKDAYS = ['金', '土', '日', '月', '火', '水', '木']; // 1日目=金曜スタート
const BASE_FOOTFALL = { '金': 85, '土': 120, '日': 110, '月': 65, '火': 60, '水': 70, '木': 80 };
const WEATHERS = [
  { id: 'hare',  name: '晴れ',   factor: 1.0 },
  { id: 'kumori',name: '曇り',   factor: 0.95 },
  { id: 'ame',   name: '雨',     factor: 0.8 },
  { id: 'yuki',  name: '雪',     factor: 0.65 },
  { id: 'mousho', name: '猛暑', factor: 0.85 },
];
/* イベントには強弱がある。強い日はヒントも断定的、弱い日はぼんやり。
   影響（客足倍率の1からの乖離と人気倍率）は弱い日は半分になる。 */
const EVENTS = [
  { id: 'none',   label: '特になし（平常運転の日）', footfall: 1.0,  favored: null,
    hints: ['今日は特に変わった様子はない', 'いつもの常連さんの顔が見えそう', '穏やかな一日になりそうな予感'],
    hintsWeak: ['今日は特に変わった様子はない', 'いつもの常連さんの顔が見えそう', '穏やかな一日になりそうな予感'] },
  { id: 'school', label: '近所の高校の文化祭', footfall: 1.3, favored: 'shoyu',
    hints: ['近所の高校が今日はやけに騒がしい', '学生っぽい若い客が増えそうな予感', '若い子はあっさり醤油が好きそう'],
    hintsWeak: ['近所の高校で何かやってるみたい', '若い客が少し増えるかもしれない', 'なんとなく醤油が出そうな気もする'] },
  { id: 'kouji',  label: '近所の工事で通行止め', footfall: 0.75, favored: null,
    hints: ['店の前の道、なんだか人が少ない気がする', '遠くで工事の音がする', '今日は静かかもしれない'],
    hintsWeak: ['店の前の道、いつもより少し静か', '遠くで工事の音がする気がする', '大きな変化はなさそう'] },
  { id: 'dantai', label: '団体客の流れ込み', footfall: 1.35, favored: 'miso',
    hints: ['電話で「大人数で入れる？」という問い合わせがあった', 'がっつり食べたい系の団体が来そう', 'こってり味噌が動きそうな気配'],
    hintsWeak: ['電話で人数の問い合わせが1件あった', '団体っぽい客が来るかもしれない', '味噌が少し動きそうな気配'] },
  { id: 'flu',    label: 'インフルエンザ流行', footfall: 0.7, favored: null,
    hints: ['マスクの人がやたら多い', '近所の学校が学級閉鎖らしい', '今日は客足が鈍そう'],
    hintsWeak: ['マスクの人がちらほら増えた', '風邪が流行り始めているらしい', '客足は少し鈍るかもしれない'] },
  { id: 'tv',     label: 'テレビで塩ラーメン特集', footfall: 1.25, favored: 'shio',
    hints: ['常連さんが「昨日のテレビ見た？」と話していた', '塩ラーメンのことを聞く人が増えそう', 'なんとなく塩が話題の空気'],
    hintsWeak: ['テレビでラーメンの話題があったらしい', '塩のことを聞く人がいるかもしれない', '塩が少し話題の空気'] },
  { id: 'jouren', label: '常連さんの誕生日会', footfall: 1.1, favored: 'shoyu',
    hints: ['常連の田中さんが誰か連れてきそうだと言っていた', 'いつもの顔が多めの一日になりそう', '田中さんはいつも醤油'],
    hintsWeak: ['常連の田中さんが来るかもしれない', 'いつもの顔が少し多めかも', '田中さんはいつも醤油'] },
];
const POLICIES = [
  { id: 'normal', name: '通常営業', footfall: 1.0, sat: 0 },
  { id: 'yobikomi', name: '呼び込み強化', footfall: 1.25, sat: -3 },
  { id: 'teinei', name: '丁寧接客', footfall: 0.9, sat: 5 },
];
const PRICE_BANDS = [
  { id: 'normal', name: '通常価格', price: 1.0, footfall: 1.0, sat: 0 },
  { id: 'premium', name: '強気（価格+15%）', price: 1.15, footfall: 0.82, sat: -1 },
  { id: 'value', name: 'お得（価格-10%）', price: 0.9, footfall: 1.16, sat: 1 },
];
const BASE_UNIT_COST = 250; // 共通ベース1食分の原価（相場の平均で変動）
const BASE_PREP_MAX = 40;
const GAME_DAYS = 7;
const FIXED_COST = 25000; // 家賃・人件費・光熱費（1日）
const START_FUNDS = 100000;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function itemById(id) { return ITEMS.find(i => i.id === id); }

function genDayFor(seed, day) {
  const rng = mulberry32(seed + day * 7919);
  const weekday = WEEKDAYS[(day - 1) % 7];
  const weather = pick(rng, WEATHERS);
  const event = pick(rng, EVENTS);
  const market = {};
  for (const it of ITEMS) market[it.id] = Math.round((0.9 + rng() * 0.3) * 100) / 100;
  const strength = event.id === 'none' ? null : (rng() < 0.5 ? 'strong' : 'weak');
  const k = strength === 'weak' ? 0.5 : 1;
  const effFootfall = 1 + (event.footfall - 1) * k;
  const favMult = event.favored ? (strength === 'weak' ? 1.2 : 1.4) : 1;
  const hints = (strength === 'weak' ? event.hintsWeak : event.hints).slice();
  return { day, weekday, weather, event, market, strength, effFootfall, favMult, hints, preview: null };
}
/* 明日の予告：接客だけが知る翌日の気配。在庫は持ち越せるので、伝言の第3の軸になる */
const PREVIEW_BY_EVENT = {
  dantai: '明日は大人数の予約が入っている',
  school: '明日は近所の高校の行事があるらしい',
  tv: '明日はテレビでラーメン特集があるらしい',
  flu: '明日も体調不良の人が多そうだ',
  kouji: '明日も近所の工事は続くらしい',
  jouren: '明日は常連さんの集まりがあるらしい',
};
function makePreview(seed, day, next) {
  const rng = mulberry32(seed + day * 5557);
  if (next.event.id !== 'none' && PREVIEW_BY_EVENT[next.event.id] && rng() < 0.65) return PREVIEW_BY_EVENT[next.event.id];
  if ((next.weather.id === 'ame' || next.weather.id === 'yuki') && rng() < 0.6) return '明日は天気が崩れそうだ';
  if (next.weather.id === 'hare' && rng() < 0.4) return '明日は晴れて客足が伸びそうだ';
  return null;
}
function baseUnitCostToday(state) {
  const m = state.cur.market;
  const avg = (m.shoyu + m.miso + m.shio) / 3;
  return Math.round(BASE_UNIT_COST * avg);
}

const MSG_MAX = 10; // 朝の伝言の文字数上限（本人の決定：漢字なら10文字で十分すぎる情報量になるため）

function newRoom(seed) {
  const state = {
    v: 1, seed: seed >>> 0, day: 1, phase: 'message', // message -> input -> report -> (ack) -> message ... -> finished
    funds: START_FUNDS, satisfaction: 70,
    stock: { shoyu: 40, miso: 30, shio: 30 },
    history: [], // 確定した各日の実績 {day, sales:{}, demand:{}}（両者公開：答え合わせ済みの情報）
    reports: [], // 夜の答え合わせ
    msgs: { human: null, robot: null }, // 朝の伝言（両者そろうまで非公開）
    submissions: { human: null, robot: null },
    acks: { human: false, robot: false },
    days: null, // 全日程を先に生成（明日の予告のため）。ビューには絶対に含めない
    cur: null,
  };
  state.days = [];
  for (let d = 1; d <= GAME_DAYS; d++) state.days.push(genDayFor(state.seed, d));
  for (let d = 1; d < GAME_DAYS; d++) state.days[d - 1].preview = makePreview(state.seed, d, state.days[d]);
  state.cur = state.days[0];
  return state;
}

function submitMessage(state, role, text) {
  if (state.phase !== 'message') return { ok: false, error: '今は伝言フェーズではありません' };
  if (role !== 'human' && role !== 'robot') return { ok: false, error: '役割が不正です' };
  if (state.msgs[role] !== null) return { ok: false, error: '本日の伝言は送信済みです' };
  const t = String(text || '').trim();
  if ([...t].length > MSG_MAX) return { ok: false, error: `伝言は${MSG_MAX}文字以内です` };
  state.msgs[role] = t;
  if (state.msgs.human !== null && state.msgs.robot !== null) state.phase = 'input';
  return { ok: true };
}

function submit(state, role, decision) {
  if (state.phase !== 'input') return { ok: false, error: '今は入力フェーズではありません' };
  if (role !== 'human' && role !== 'robot') return { ok: false, error: '役割が不正です' };
  if (state.submissions[role]) return { ok: false, error: '本日は既に入力済みです' };
  if (role === 'human') {
    const pol = POLICIES.find(p => p.id === decision.policy);
    if (!pol) return { ok: false, error: '接客方針が不正です' };
    const band = PRICE_BANDS.find(b => b.id === decision.priceBand);
    if (!band) return { ok: false, error: '価格帯が不正です' };
    if (decision.push !== null && !itemById(decision.push)) return { ok: false, error: '押しメニューが不正です' };
    state.submissions.human = { push: decision.push, policy: decision.policy, priceBand: decision.priceBand, comment: String(decision.comment || '').slice(0, 200) };
  } else {
    const buy = {}, prep = {};
    let totalCost = 0;
    for (const it of ITEMS) {
      const b = Math.max(0, Math.min(200, Math.floor(Number(decision.buy && decision.buy[it.id]) || 0)));
      const p = Math.max(0, Math.min(80, Math.floor(Number(decision.prep && decision.prep[it.id]) || 0)));
      if (p > state.stock[it.id] + b) return { ok: false, error: `${it.name}の仕込みが在庫＋仕入れを超えています` };
      totalCost += Math.round(b * it.cost * state.cur.market[it.id]);
      buy[it.id] = b; prep[it.id] = p;
    }
    const basePrep = Math.max(0, Math.min(BASE_PREP_MAX, Math.floor(Number(decision.basePrep) || 0)));
    totalCost += basePrep * baseUnitCostToday(state);
    if (totalCost > state.funds) return { ok: false, error: '資金が足りません' };
    state.submissions.robot = { buy, prep, basePrep, reading: String(decision.reading || '').slice(0, 80), comment: String(decision.comment || '').slice(0, 200) };
  }
  if (state.submissions.human && state.submissions.robot) resolveDay(state);
  return { ok: true, resolved: state.phase !== 'input' };
}

function resolveDay(state) {
  const d = state.cur, H = state.submissions.human, R = state.submissions.robot;
  const pol = POLICIES.find(p => p.id === H.policy);
  const band = PRICE_BANDS.find(b => b.id === H.priceBand);
  // 需要
  let footfall = BASE_FOOTFALL[d.weekday] * d.weather.factor * pol.footfall * band.footfall * d.effFootfall * (0.85 + 0.3 * state.satisfaction / 100);
  footfall = Math.max(5, Math.round(footfall));
  const shares = {};
  let sum = 0;
  for (const it of ITEMS) {
    let s = it.share;
    if (H.push === it.id) s *= 1.6;
    if (d.event.favored === it.id) s *= d.favMult;
    shares[it.id] = s; sum += s;
  }
  const rng = mulberry32(state.seed + state.day * 104729);
  const demand = {}, sales = {}, waste = {}, stockout = {}, fromBase = {};
  let revenue = 0, demandTotal = 0, stockoutTotal = 0;
  for (const it of ITEMS) {
    const dem = Math.max(0, Math.round(footfall * (shares[it.id] / sum) * (0.95 + rng() * 0.1)));
    demand[it.id] = dem; demandTotal += dem;
    const sold = Math.min(R.prep[it.id], dem);
    sales[it.id] = sold;
    waste[it.id] = R.prep[it.id] - sold;
    stockout[it.id] = dem - sold;
    fromBase[it.id] = 0;
  }
  // 共通ベースで品切れを肩代わり（品切れ比率に応じて配分）
  let basePool = R.basePrep || 0, baseUsed = 0;
  const totalOut = ITEMS.reduce((a, it) => a + stockout[it.id], 0);
  if (basePool > 0 && totalOut > 0) {
    for (const it of ITEMS) {
      if (stockout[it.id] <= 0) continue;
      const conv = Math.min(stockout[it.id], Math.floor(basePool * stockout[it.id] / totalOut));
      fromBase[it.id] = conv; stockout[it.id] -= conv; baseUsed += conv;
    }
    let rest = basePool - baseUsed;
    for (const it of ITEMS) { // 端数ぶんを順に配る
      if (rest <= 0) break;
      const add = Math.min(stockout[it.id], rest);
      fromBase[it.id] += add; stockout[it.id] -= add; baseUsed += add; rest -= add;
    }
  }
  // 営業シーン用タイムライン：需要ぶんの客が順に注文し、販売ぶんは提供、残りは品切れで帰る
  const timeline = [];
  {
    const trng = mulberry32(state.seed + state.day * 31337);
    const evs = [];
    for (const it of ITEMS) {
      for (let i = 0; i < sales[it.id]; i++) evs.push({ item: it.id, ok: true });
      for (let i = 0; i < stockout[it.id]; i++) evs.push({ item: it.id, ok: false });
    }
    for (let i = evs.length - 1; i > 0; i--) { const j = Math.floor(trng() * (i + 1)); const t = evs[i]; evs[i] = evs[j]; evs[j] = t; }
    const cap = 160;
    const step = evs.length > cap ? evs.length / cap : 1;
    for (let i = 0; i < evs.length && timeline.length < cap; i += step) {
      const e = evs[Math.floor(i)];
      timeline.push({ t: Math.round((timeline.length + 1) / (Math.min(evs.length, cap) + 1) * 1000) / 10, item: e.item, ok: e.ok });
    }
  }
  const baseWaste = (R.basePrep || 0) - baseUsed;
  for (const it of ITEMS) {
    sales[it.id] += fromBase[it.id];
    revenue += sales[it.id] * Math.round(it.price * band.price);
    stockoutTotal += stockout[it.id];
  }
  // 在庫と資金
  let buyCost = 0;
  for (const it of ITEMS) {
    buyCost += Math.round(R.buy[it.id] * it.cost * d.market[it.id]);
    state.stock[it.id] = state.stock[it.id] + R.buy[it.id] - R.prep[it.id];
  }
  const baseCost = (R.basePrep || 0) * baseUnitCostToday(state);
  state.funds = state.funds + revenue - buyCost - baseCost - FIXED_COST;
  // 満足度
  let sat = state.satisfaction + pol.sat + band.sat;
  if (demandTotal > 0) sat -= Math.round(20 * stockoutTotal / demandTotal);
  if (stockoutTotal === 0) sat += 2;
  state.satisfaction = Math.max(0, Math.min(100, sat));
  const report = {
    day: d.day, weekday: d.weekday, weather: d.weather.name,
    messages: { human: state.msgs.human, robot: state.msgs.robot },
    eventLabel: d.event.label, eventStrength: d.strength, footfall, demand, sales, waste, stockout, fromBase,
    basePrep: R.basePrep || 0, baseUsed, baseWaste, baseCost,
    timeline,
    revenue, buyCost, fixedCost: FIXED_COST, fundsAfter: state.funds,
    satisfactionAfter: state.satisfaction,
    humanDecision: H, robotDecision: R,
    market: d.market,
  };
  state.reports.push(report);
  state.history.push({ day: d.day, weekday: d.weekday, sales, demand });
  state.submissions = { human: null, robot: null };
  state.acks = { human: false, robot: false };
  state.phase = 'service'; // まず営業シーンを両者で見てから日報へ
  return report;
}

function ack(state, role) {
  if (state.phase === 'service') {
    state.acks[role] = true;
    if (state.acks.human && state.acks.robot) {
      state.acks = { human: false, robot: false };
      state.phase = (state.day >= GAME_DAYS) ? 'finished' : 'report';
    }
    return { ok: true };
  }
  if (state.phase !== 'report') return { ok: false, error: '今は確認フェーズではありません' };
  state.acks[role] = true;
  if (state.acks.human && state.acks.robot) {
    state.day += 1;
    state.cur = state.days[state.day - 1];
    state.phase = 'message';
    state.msgs = { human: null, robot: null };
    state.acks = { human: false, robot: false };
  }
  return { ok: true };
}

function finalResult(state) {
  const score = state.funds + state.satisfaction * 300;
  const rank = score >= 275000 ? 'S' : score >= 230000 ? 'A' : score >= 190000 ? 'B' : 'C';
  return { funds: state.funds, satisfaction: state.satisfaction, score, rank };
}

/* 役割別ビュー：見えない情報は含めない */
function viewFor(state, role) {
  const base = {
    day: state.day, totalDays: GAME_DAYS, phase: state.phase,
    weekday: state.cur.weekday, weather: state.cur.weather.name,
    reports: state.reports,
    submitted: { human: !!state.submissions.human || state.phase !== 'input', robot: !!state.submissions.robot || state.phase !== 'input' },
    msgSubmitted: { human: state.msgs.human !== null, robot: state.msgs.robot !== null },
    messages: state.phase === 'message' ? null : { human: state.msgs.human, robot: state.msgs.robot },
    msgMax: MSG_MAX,
    acks: state.acks,
    yourRole: role,
  };
  // 入力フェーズで自分が未送信なら自分の入力欄用情報、送信済みなら相手待ち表示のみ
  if (state.phase === 'finished') base.final = finalResult(state);
  if (role === 'human') {
    base.yourInfo = {
      hints: state.cur.hints,
      tomorrow: state.cur.preview,
      policies: POLICIES.map(p => ({ id: p.id, name: p.name })),
      priceBands: PRICE_BANDS.map(b => ({ id: b.id, name: b.name })),
      items: ITEMS.map(i => ({ id: i.id, name: i.name, price: i.price })),
      history: state.history,
      youSubmitted: !!state.submissions.human,
    };
  } else if (role === 'robot') {
    base.yourInfo = {
      funds: state.funds, satisfaction: state.satisfaction, stock: state.stock,
      market: state.cur.market, baseFootfall: BASE_FOOTFALL[state.cur.weekday],
      baseUnitCost: baseUnitCostToday(state), basePrepMax: BASE_PREP_MAX,
      items: ITEMS.map(i => ({ id: i.id, name: i.name, price: i.price, cost: i.cost, baseShare: i.share })),
      history: state.history,
      youSubmitted: !!state.submissions.robot,
    };
  }
  return base;
}

module.exports = { newRoom, submitMessage, submit, ack, viewFor, finalResult, ITEMS, POLICIES, PRICE_BANDS, GAME_DAYS, MSG_MAX, BASE_PREP_MAX };
