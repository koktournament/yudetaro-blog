'use strict';
/* AIラーメン Muse支店 - ゲーム本体ロジック（ストレージ非依存）
   倉庫(Worker/DO or ローカルMap)が state を丸ごと保存し、本モジュールの関数で進める。
   情報の非対称は viewFor() が担保する：役割の見えない情報はビューに含めない。

   v2（2026-11-02 本人の設計決定）:
   - サイドメニュー3品（餃子・唐揚げ・ビール）を追加。需要は来客数への付随率で決まる。
   - イベントを2軸に分離：量のイベント（客足）と味の偏り（需要の寄り）を別々に抽選する。
   - 厨房の事情（ロボ専用情報）：1品の仕込み上限半分、または1品の仕入れ25%引き。夜の日報で開示。 */

const ITEMS = [
  { id: 'shoyu',   name: '醤油ラーメン', price: 800, cost: 260, share: 0.45, kind: 'main' },
  { id: 'miso',    name: '味噌ラーメン', price: 900, cost: 320, share: 0.30, kind: 'main' },
  { id: 'shio',    name: '塩ラーメン',   price: 850, cost: 290, share: 0.25, kind: 'main' },
  { id: 'gyoza',   name: '餃子',         price: 380, cost: 150, attach: 0.28, kind: 'side' },
  { id: 'karaage', name: '唐揚げ',       price: 420, cost: 180, attach: 0.16, kind: 'side' },
  { id: 'beer',    name: 'ビール',       price: 550, cost: 240, attach: 0.14, kind: 'side',
    weatherMod: { mousho: 1.8, yuki: 0.5, ame: 0.8 } },
];
const MAINS = ITEMS.filter(i => i.kind === 'main');
const WEEKDAYS = ['金', '土', '日', '月', '火', '水', '木']; // 1日目=金曜スタート
const BASE_FOOTFALL = { '金': 85, '土': 120, '日': 110, '月': 65, '火': 60, '水': 70, '木': 80 };
const WEATHERS = [
  { id: 'hare',  name: '晴れ',   factor: 1.0 },
  { id: 'kumori',name: '曇り',   factor: 0.95 },
  { id: 'ame',   name: '雨',     factor: 0.8 },
  { id: 'yuki',  name: '雪',     factor: 0.65 },
  { id: 'mousho', name: '猛暑', factor: 0.85 },
];
/* 量のイベント（客足倍率のみ）。強弱あり：弱い日は影響が半分でヒントも曖昧。 */
const EVENTS = [
  { id: 'none',   label: '特になし（平常運転の日）', footfall: 1.0,
    hints: ['今日は特に変わった様子はない', 'いつもの常連さんの顔が見えそう', '穏やかな一日になりそうな予感'],
    hintsWeak: ['今日は特に変わった様子はない', 'いつもの常連さんの顔が見えそう', '穏やかな一日になりそうな予感'] },
  { id: 'school', label: '近所の高校の行事', footfall: 1.3,
    hints: ['近所の高校が今日はやけに騒がしい', '学生っぽい若い客が増えそうな予感'],
    hintsWeak: ['近所の高校で何かやってるみたい', '若い客が少し増えるかもしれない'] },
  { id: 'kouji',  label: '近所の工事で通行止め', footfall: 0.75,
    hints: ['店の前の道、なんだか人が少ない気がする', '遠くで工事の音がする', '今日は静かかもしれない'],
    hintsWeak: ['店の前の道、いつもより少し静か', '遠くで工事の音がする気がする', '大きな変化はなさそう'] },
  { id: 'dantai', label: '団体客の流れ込み', footfall: 1.35,
    hints: ['電話で「大人数で入れる？」という問い合わせがあった', 'がっつり食べたい系の団体が来そう'],
    hintsWeak: ['電話で人数の問い合わせが1件あった', '団体っぽい客が来るかもしれない'] },
  { id: 'flu',    label: 'インフルエンザ流行', footfall: 0.7,
    hints: ['マスクの人がやたら多い', '近所の学校が学級閉鎖らしい', '今日は客足が鈍そう'],
    hintsWeak: ['マスクの人がちらほら増えた', '風邪が流行り始めているらしい', '客足は少し鈍るかもしれない'] },
  { id: 'jouren', label: '常連さんの集まり', footfall: 1.1,
    hints: ['常連の田中さんが誰か連れてきそうだと言っていた', 'いつもの顔が多めの一日になりそう'],
    hintsWeak: ['常連の田中さんが来るかもしれない', 'いつもの顔が少し多めかも'] },
];
/* 味の偏り（需要の寄り）。量のイベントとは別抽選。接客だけがヒントで知る。
   メインは人気シェア倍率、サイドは付随率倍率として効く。 */
const LEANS = [
  { id: 'shoyu',   label: '醤油が多めに出そう',
    hint: '常連の田中さんはいつも醤油。今日はその仲間も来そう', hintWeak: '醤油が出そうな気配' },
  { id: 'miso',    label: '味噌が多めに出そう',
    hint: '「こってり味噌が食べたい」という声を聞いた', hintWeak: '味噌が少し動きそうな気配' },
  { id: 'shio',    label: '塩が多めに出そう',
    hint: 'テレビで塩ラーメンの特集をやっていたらしい', hintWeak: '塩のことを聞く人がいるかもしれない' },
  { id: 'gyoza',   label: '餃子が多めに出そう',
    hint: '常連さんが「今日は餃子の気分」と言っていた', hintWeak: '餃子がちょこちょこ出そうな気配' },
  { id: 'karaage', label: '唐揚げが多めに出そう',
    hint: '学生さんが「唐揚げも頼みたい」と話していた', hintWeak: '唐揚げが少し出そうな気配' },
  { id: 'beer',    label: 'ビールが多めに出そう',
    hint: '近所でビールが進みそうな集まりがあるらしい', hintWeak: 'ビールが少し出そうな気配' },
];
/* 厨房の事情（ロボだけが知る）。夜の日報で接客にも開示される。 */
const KITCHEN_NONE = null;
function kitchenLabel(k) {
  if (!k) return null;
  const it = itemById(k.item);
  return k.type === 'cap'
    ? `${it.name}の仕込み場が手狭で、仕込み上限が半分`
    : `${it.name}の材料が特売で、仕入れが25%引き`;
}
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
const PREP_MAX = { main: 80, side: 60 };
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
function prepMaxFor(state, item) {
  let cap = PREP_MAX[item.kind];
  const k = state && state.cur ? state.cur.kitchen : null;
  if (k && k.type === 'cap' && k.item === item.id) cap = Math.floor(cap / 2);
  return cap;
}
function effUnitCost(state, item) {
  let c = item.cost * state.cur.market[item.id];
  const k = state.cur.kitchen;
  if (k && k.type === 'discount' && k.item === item.id) c *= 0.75;
  return c;
}

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
  // 味の偏り：40%なし、各品10%
  let lean = null, leanStrength = null;
  if (rng() >= 0.4) {
    lean = pick(rng, LEANS);
    leanStrength = rng() < 0.5 ? 'strong' : 'weak';
  }
  const favMult = !lean ? 1
    : (itemById(lean.id).kind === 'side'
      ? (leanStrength === 'weak' ? 1.3 : 1.6)
      : (leanStrength === 'weak' ? 1.2 : 1.4));
  // 厨房の事情：45%なし、残りは対象品×種別
  let kitchen = KITCHEN_NONE;
  if (rng() >= 0.45) {
    const it = pick(rng, ITEMS);
    kitchen = { item: it.id, type: rng() < 0.55 ? 'cap' : 'discount' };
  }
  // 強弱は言い回しの頭で明示する（弱「なんとなく、」／強「明らかに、」）。伝言に強弱を残す余地がほぼ無いため、ヒント側で差をはっきりさせる
  const mark = s => (s === 'weak' ? 'なんとなく、' : '明らかに、');
  const hints = (strength === 'weak' ? event.hintsWeak : event.hints).slice()
    .map(t => (strength ? mark(strength) + t : t));
  if (lean) hints.push(mark(leanStrength) + (leanStrength === 'weak' ? lean.hintWeak : lean.hint));
  return { day, weekday, weather, event, market, strength, effFootfall, lean, leanStrength, favMult, kitchen, hints, preview: null };
}
/* 明日の予告：接客だけが知る翌日の気配。在庫は持ち越せるので、伝言の第3の軸になる */
const PREVIEW_BY_EVENT = {
  dantai: '明日は大人数の予約が入っている',
  school: '明日は近所の高校の行事があるらしい',
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
function ensureStock(state) {
  for (const it of ITEMS) if (typeof state.stock[it.id] !== 'number') state.stock[it.id] = 0;
}

const MSG_MAX = 10; // 朝の伝言の文字数上限（本人の決定：漢字なら10文字で十分すぎる情報量になるため）

function newRoom(seed) {
  const state = {
    v: 2, seed: seed >>> 0, day: 1, phase: 'message', // message -> input -> report -> (ack) -> message ... -> finished
    funds: START_FUNDS, satisfaction: 70,
    stock: { shoyu: 40, miso: 30, shio: 30, gyoza: 0, karaage: 0, beer: 0 },
    history: [], // 確定した各日の実績 {day, sales:{}, demand:{}}（両者公開：答え合わせ済みの情報）
    reports: [], // 夜の答え合わせ
    msgs: { human: null, robot: null, forecast: null }, // 朝の伝言（両者そろうまで非公開）。forecast は接客が任意で付ける予告メモ（伝言とは別枠）
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

const FORECAST_MEMO_MAX = 30; // 予告メモ（任意・別枠）の文字数上限
function submitMessage(state, role, text, forecast) {
  if (state.phase !== 'message') return { ok: false, error: '今は伝言フェーズではありません' };
  if (role !== 'human' && role !== 'robot') return { ok: false, error: '役割が不正です' };
  if (state.msgs[role] !== null) return { ok: false, error: '本日の伝言は送信済みです' };
  const t = String(text || '').trim();
  if ([...t].length > MSG_MAX) return { ok: false, error: `伝言は${MSG_MAX}文字以内です` };
  state.msgs[role] = t;
  if (role === 'human') {
    const f = String(forecast || '').trim();
    state.msgs.forecast = f ? [...f].slice(0, FORECAST_MEMO_MAX).join('') : null;
  }
  if (state.msgs.human !== null && state.msgs.robot !== null) state.phase = 'input';
  return { ok: true };
}

function submit(state, role, decision) {
  if (state.phase !== 'input') return { ok: false, error: '今は入力フェーズではありません' };
  if (role !== 'human' && role !== 'robot') return { ok: false, error: '役割が不正です' };
  if (state.submissions[role]) return { ok: false, error: '本日は既に入力済みです' };
  ensureStock(state);
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
      const cap = prepMaxFor(state, it);
      const p = Math.max(0, Math.min(cap, Math.floor(Number(decision.prep && decision.prep[it.id]) || 0)));
      if (p > state.stock[it.id] + b) return { ok: false, error: `${it.name}の仕込みが在庫＋仕入れを超えています` };
      totalCost += Math.round(b * effUnitCost(state, it));
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
  ensureStock(state);
  const pol = POLICIES.find(p => p.id === H.policy);
  const band = PRICE_BANDS.find(b => b.id === H.priceBand);
  // 来客数
  let footfall = BASE_FOOTFALL[d.weekday] * d.weather.factor * pol.footfall * band.footfall * d.effFootfall * (0.85 + 0.3 * state.satisfaction / 100);
  footfall = Math.max(5, Math.round(footfall));
  // メインの需要配分
  const shares = {};
  let sum = 0;
  for (const it of MAINS) {
    let s = it.share;
    if (H.push === it.id) s *= 1.6;
    if (d.lean && d.lean.id === it.id) s *= d.favMult;
    shares[it.id] = s; sum += s;
  }
  const rng = mulberry32(state.seed + state.day * 104729);
  const demand = {}, sales = {}, waste = {}, stockout = {}, fromBase = {};
  let revenue = 0, demandW = 0, stockoutW = 0;
  for (const it of ITEMS) {
    let dem;
    if (it.kind === 'main') {
      dem = Math.max(0, Math.round(footfall * (shares[it.id] / sum) * (0.95 + rng() * 0.1)));
    } else {
      let rate = it.attach;
      if (H.push === it.id) rate *= 1.6;
      if (d.lean && d.lean.id === it.id) rate *= d.favMult;
      if (it.weatherMod && it.weatherMod[d.weather.id]) rate *= it.weatherMod[d.weather.id];
      dem = Math.max(0, Math.round(footfall * rate * (0.95 + rng() * 0.1)));
    }
    demand[it.id] = dem;
    const sold = Math.min(R.prep[it.id] || 0, dem);
    sales[it.id] = sold;
    waste[it.id] = (R.prep[it.id] || 0) - sold;
    stockout[it.id] = dem - sold;
    fromBase[it.id] = 0;
    const w = it.kind === 'main' ? 1 : 0.5; // 満足度への重み：サイドの品切れは半分
    demandW += dem * w; stockoutW += stockout[it.id] * w;
  }
  // 共通ベースで品切れを肩代わり（メインのみ・品切れ比率に応じて配分）
  let basePool = R.basePrep || 0, baseUsed = 0;
  const totalOut = MAINS.reduce((a, it) => a + stockout[it.id], 0);
  if (basePool > 0 && totalOut > 0) {
    for (const it of MAINS) {
      if (stockout[it.id] <= 0) continue;
      const conv = Math.min(stockout[it.id], Math.floor(basePool * stockout[it.id] / totalOut));
      fromBase[it.id] = conv; stockout[it.id] -= conv; baseUsed += conv;
    }
    let rest = basePool - baseUsed;
    for (const it of MAINS) { // 端数ぶんを順に配る
      if (rest <= 0) break;
      const add = Math.min(stockout[it.id], rest);
      fromBase[it.id] += add; stockout[it.id] -= add; baseUsed += add; rest -= add;
    }
    stockoutW = 0; demandW = 0;
    for (const it of ITEMS) {
      const w = it.kind === 'main' ? 1 : 0.5;
      demandW += demand[it.id] * w; stockoutW += stockout[it.id] * w;
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
  let stockoutTotal = 0;
  for (const it of ITEMS) {
    sales[it.id] += fromBase[it.id];
    revenue += sales[it.id] * Math.round(it.price * band.price);
    stockoutTotal += stockout[it.id];
  }
  // 在庫と資金
  let buyCost = 0;
  for (const it of ITEMS) {
    buyCost += Math.round((R.buy[it.id] || 0) * effUnitCost(state, it));
    state.stock[it.id] = state.stock[it.id] + (R.buy[it.id] || 0) - (R.prep[it.id] || 0);
  }
  const baseCost = (R.basePrep || 0) * baseUnitCostToday(state);
  state.funds = state.funds + revenue - buyCost - baseCost - FIXED_COST;
  // 満足度
  let sat = state.satisfaction + pol.sat + band.sat;
  if (demandW > 0) sat -= Math.round(20 * stockoutW / demandW);
  if (stockoutTotal === 0) sat += 2;
  state.satisfaction = Math.max(0, Math.min(100, sat));
  const report = {
    day: d.day, weekday: d.weekday, weather: d.weather.name,
    messages: { human: state.msgs.human, robot: state.msgs.robot, forecast: state.msgs.forecast },
    eventLabel: d.event.label, eventStrength: d.strength,
    leanLabel: d.lean ? d.lean.label : null, leanStrength: d.leanStrength,
    kitchenLabel: kitchenLabel(d.kitchen),
    footfall, demand, sales, waste, stockout, fromBase,
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
    state.msgs = { human: null, robot: null, forecast: null };
    state.acks = { human: false, robot: false };
  }
  return { ok: true };
}

function finalResult(state) {
  const score = state.funds + state.satisfaction * 300;
  const rank = score >= 380000 ? 'S' : score >= 320000 ? 'A' : score >= 260000 ? 'B' : 'C';
  return { funds: state.funds, satisfaction: state.satisfaction, score, rank };
}

/* 役割別ビュー：見えない情報は含めない */
function viewFor(state, role) {
  ensureStock(state);
  const base = {
    day: state.day, totalDays: GAME_DAYS, phase: state.phase,
    weekday: state.cur.weekday, weather: state.cur.weather.name,
    reports: state.reports,
    submitted: { human: !!state.submissions.human || state.phase !== 'input', robot: !!state.submissions.robot || state.phase !== 'input' },
    msgSubmitted: { human: state.msgs.human !== null, robot: state.msgs.robot !== null },
    messages: state.phase === 'message' ? null : { human: state.msgs.human, robot: state.msgs.robot, forecast: state.msgs.forecast },
    msgMax: MSG_MAX,
    acks: state.acks,
    yourRole: role,
  };
  if (state.phase === 'finished') base.final = finalResult(state);
  if (role === 'human') {
    base.yourInfo = {
      hints: state.cur.hints,
      tomorrow: state.cur.preview,
      policies: POLICIES.map(p => ({ id: p.id, name: p.name })),
      priceBands: PRICE_BANDS.map(b => ({ id: b.id, name: b.name })),
      items: ITEMS.map(i => ({ id: i.id, name: i.name, price: i.price, kind: i.kind })),
      history: state.history,
      youSubmitted: !!state.submissions.human,
    };
  } else if (role === 'robot') {
    const prepMax = {};
    for (const it of ITEMS) prepMax[it.id] = prepMaxFor(state, it);
    base.yourInfo = {
      funds: state.funds, satisfaction: state.satisfaction, stock: state.stock,
      market: state.cur.market, baseFootfall: BASE_FOOTFALL[state.cur.weekday],
      baseUnitCost: baseUnitCostToday(state), basePrepMax: BASE_PREP_MAX,
      kitchen: state.cur.kitchen ? { item: state.cur.kitchen.item, type: state.cur.kitchen.type, label: kitchenLabel(state.cur.kitchen) } : null,
      prepMax,
      items: ITEMS.map(i => ({ id: i.id, name: i.name, price: i.price, cost: i.cost, baseShare: i.share || null, attach: i.attach || null, kind: i.kind })),
      history: state.history,
      youSubmitted: !!state.submissions.robot,
    };
  }
  return base;
}

module.exports = { newRoom, submitMessage, submit, ack, viewFor, finalResult, ITEMS, POLICIES, PRICE_BANDS, GAME_DAYS, MSG_MAX, BASE_PREP_MAX };
