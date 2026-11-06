/* 尋問ゲーム「金庫の中身」コア：質問の記録・質問数・犯人宣言の照合はコードが持ち、
   事件の事実は各容疑者の台帳（マニュアル）、演技は容疑者役のAIが担う3層構造。
   情報分離：容疑者は完全に分かれており、actorView は担当キャラの分しか返さない。 */
'use strict';

const CHARS = [
  { id: 'takada', name: '高田恒夫', age: 58, role: 'オーナー', pub: '店の経営者で、発見者・通報者。事件の日は店に不在で、翌朝の集金で初めて異変に気づいた。資金繰りに苦しんでいるという噂がある。' },
  { id: 'nakamura', name: '中村大輔', age: 38, role: '社員', pub: 'ただ一人の正社員。シフトは10時から22時。レジ締めと売上の確認、金庫への投函は彼の担当だった。' },
  { id: 'yui', name: '小林ゆい', age: 20, role: 'バイト', pub: 'アルバイト。この日のシフトは11時から21時30分。レジと、売上の袋詰めを担当していた。' },
  { id: 'kaito', name: '山本海斗', age: 22, role: 'バイト', pub: 'アルバイト。バイトの小林と同じく、この日は11時から21時30分。' },
  { id: 'okada', name: 'うろついていた男', age: null, role: '氏名不詳', pub: '事件の夜、20時から深夜0時ごろまで、店の近所をうろつく姿が防犯カメラに映っていた。氏名・住所はまだ割れていない。' },
];
const CHAR_IDS = CHARS.map(c => c.id);
const CULPRIT = 'nakamura';

const ITEMS = [
  { id: 'photo_all', name: '全員の写真' },
  { id: 'photo_keyhole', name: '鍵穴の写真' },
  { id: 'report', name: '売上日報' },
  { id: 'camera', name: '防犯カメラの情報' },
  { id: 'shifts', name: '勤務記録' },
];
const ITEM_NAME = Object.fromEntries(ITEMS.map(i => [i.id, i.name]));

const INTRO = [
  '翌朝8時。飲食店のオーナーが、集金のために店にやってきた。',
  '',
  '金庫はバックルームにある投げ込み式。レジを締めるたび、売上は袋に入れて投げ込む。鍵を持っているのはオーナーだけだ。',
  '',
  '鍵を開けると、中は空だった。',
  '',
  '消えたのは昨日の売上。昼と夜、二回分の締めに加えて、近くの会社3軒分の弁当代の入金が、まとめて入っていたはずの日だ。',
  '',
  '鍵穴には、擦ったような傷があった。',
  '',
  'オーナーはその場で警察に通報した。',
  '',
  '店内の防犯カメラに、客がバックルームへ入る姿はなかった。近隣のカメラに映っていたのは、店の人間たちと、見知らぬ男ひとりだけだった。',
  '',
  '容疑者たちは、それぞれ別の取り調べ室にいる。あなたは刑事だ。話を聞き、資料と突き合わせ、最後に犯人を指名する。',
  '質問の数は記録される。少ないほど、評価は上がる。',
].join('\n');

const DOCS = [
  { id: 'photo_all', name: '全員の写真', body: '容疑者5人の写真。うろついていた男の分は、防犯カメラの映像から切り出したもの。' },
  { id: 'photo_keyhole', name: '鍵穴の写真', body: '金庫の鍵穴の拡大写真。周りに擦り傷がある。古い傷と、新しい傷が重なっているように見える。' },
  { id: 'report', name: '売上日報', body: '消えた金額の内訳。弁当代（近隣3社分・現金）約40万円、昼の売上 約4万円、夜の売上 約5万円。合計 約49万円が金庫に入っているはずだった。' },
  { id: 'camera', name: '防犯カメラの情報', body: '店内カメラ：客がバックルームに入る姿はない。近隣カメラ：事件の夜に映っていたのは、店の人間たちと、一人の男だけ。その男は20時から0時ごろまで店の近所にいた。' },
  { id: 'shifts', name: '勤務記録', body: '事件当日のシフト。中村大輔 10:00〜22:00。小林ゆい・山本海斗 11:00〜21:30。高田恒夫は当日不在（翌朝8:00に集金で来店）。' },
];

function newGame(seed) {
  const chars = {};
  for (const id of CHAR_IDS) chars[id] = { log: [], pending: null, status: '' };
  return { seed: seed >>> 0, chars, totalQuestions: 0, askEvents: 0, accusations: [], result: null, groupSeq: 0 };
}
function charOf(id) { return CHARS.find(c => c.id === id) || null; }
function pushLog(st, id, entry) { st.chars[id].log.push(entry); }

function playerAsk(st, charId, text) {
  if (!charOf(charId)) return { ok: false, error: '容疑者が違います' };
  if (st.result) return { ok: false, error: 'この事件は終わっています' };
  const t = String(text || '').trim();
  if (!t) return { ok: false, error: '質問が空です' };
  const room = st.chars[charId];
  if (room.pending) return { ok: false, error: '前の質問への返答を待っています' };
  pushLog(st, charId, { kind: 'q', text: t });
  room.pending = { kind: 'ask', text: t };
  st.totalQuestions += 1;
  st.askEvents += 1;
  return { ok: true };
}

function playerAskAll(st, text) {
  if (st.result) return { ok: false, error: 'この事件は終わっています' };
  const t = String(text || '').trim();
  if (!t) return { ok: false, error: '質問が空です' };
  const targets = CHAR_IDS.filter(id => !st.chars[id].pending);
  if (!targets.length) return { ok: false, error: '全員が返答待ちです' };
  st.groupSeq += 1;
  const group = 'g' + st.groupSeq;
  for (const id of targets) {
    pushLog(st, id, { kind: 'q', text: t, group });
    st.chars[id].pending = { kind: 'ask', text: t, group };
  }
  st.totalQuestions += targets.length;
  st.askEvents += 1;
  return { ok: true, sent: targets.length, group };
}

function playerPresent(st, charId, itemId) {
  if (!charOf(charId)) return { ok: false, error: '容疑者が違います' };
  if (!ITEM_NAME[itemId]) return { ok: false, error: '資料が違います' };
  if (st.result) return { ok: false, error: 'この事件は終わっています' };
  const room = st.chars[charId];
  if (room.pending) return { ok: false, error: '前の質問への返答を待っています' };
  pushLog(st, charId, { kind: 'present', text: '【資料提示】' + ITEM_NAME[itemId], item: itemId });
  room.pending = { kind: 'present', text: '刑事が「' + ITEM_NAME[itemId] + '」を見せた', item: itemId };
  st.totalQuestions += 1;
  st.askEvents += 1;
  return { ok: true };
}

function actorReply(st, charId, text) {
  if (!charOf(charId)) return { ok: false, error: '容疑者が違います' };
  const room = st.chars[charId];
  if (!room.pending) return { ok: false, error: '答えるべき質問がありません' };
  const t = String(text || '').trim();
  if (!t) return { ok: false, error: '返答が空です' };
  const grp = room.pending.group;
  pushLog(st, charId, { kind: 'a', text: t, group: grp });
  room.pending = null;
  return { ok: true };
}

function actorNote(st, charId, status) {
  if (!charOf(charId)) return { ok: false, error: '容疑者が違います' };
  const s = String(status || '').trim();
  if (!s) return { ok: false, error: '状態が空です' };
  st.chars[charId].status = s;
  pushLog(st, charId, { kind: 'sys', text: s });
  if (charId === 'okada' && /痴漢/.test(s) && /(確定|退場|除外)/.test(s) && !st.okadaCleared) {
    st.okadaCleared = true;
    pushLog(st, charId, { kind: 'sys', text: '岡田守の自宅なども調べられたが、本件（金庫の盗難）とは全く関係がないことが判明した。' });
  }
  if (charId === 'takada' && /自作自演/.test(s) && /(晴|否定|潔白)/.test(s) && !st.takadaCleared) {
    st.takadaCleared = true;
    pushLog(st, charId, { kind: 'sys', text: 'その後の調べで、高田には金を持ち出す機会がなく、店内に金が隠されていた形跡もなかった。自作自演の可能性は否定された。' });
  }
  if (charId === 'takada' && /袋/.test(s) && /(空|なし|無)/.test(s) && !st.baitoCleared) {
    st.baitoCleared = true;
    const msg = '金庫には袋すら残っていなかった。袋詰めの段階で金を抜いたのなら、袋は金庫に残るはずだ。バイト二人の犯行は成り立たない。';
    pushLog(st, 'yui', { kind: 'sys', text: msg });
    pushLog(st, 'kaito', { kind: 'sys', text: msg });
  }
  return { ok: true };
}

function playerAccuse(st, charId) {
  if (!charOf(charId)) return { ok: false, error: '容疑者が違います' };
  if (st.result) return { ok: false, error: 'この事件は終わっています' };
  st.accusations.push(charId);
  if (charId === CULPRIT) { st.result = 'solved'; return { ok: true, correct: true }; }
  return { ok: true, correct: false };
}

function playerView(st) {
  return {
    result: st.result,
    totalQuestions: st.totalQuestions,
    askEvents: st.askEvents,
    accusations: st.accusations.length,
    intro: INTRO,
    docs: DOCS,
    items: ITEMS,
    chars: CHARS.map(c => ({
      id: c.id, name: c.name, age: c.age, role: c.role, pub: c.pub,
      status: st.chars[c.id].status,
      pending: !!st.chars[c.id].pending,
      log: st.chars[c.id].log,
    })),
  };
}

function actorView(st, charId) {
  const c = charOf(charId);
  if (!c) return { error: '容疑者が違います' };
  const room = st.chars[charId];
  const v = {
    result: st.result,
    totalQuestions: st.totalQuestions,
    char: { id: c.id, name: c.name, age: c.age, role: c.role },
    status: room.status,
    pending: room.pending,
    log: room.log,
  };
  v.actorSummary = 'ゲーム: 尋問ゲーム（取り調べ室 ' + c.role + '：' + c.name + '） / あなたは容疑者「' + c.name + '」本人を演じます。\n'
    + 'あなたの台帳と作法は、専用マニュアルに集約されています: https://www.yudetaro.com/games/jinmon/muse-' + c.id + ' （まだ読んでいなければ、返答の前に必ず読んでください）\n'
    + '鉄則：事件の事実は台帳だけが正で、台帳にない事件の事実は作りません。嘘は台帳に書かれた嘘だけ。喋り方と人物の私事はキャラに合わせてよく、一度言ったことは確定事実として一貫させます。他の容疑者の台帳・返答は、あなたには見えませんし、知らないものとして振る舞います。\n'
    + (room.pending ? '刑事からの入力: 「' + room.pending.text + '」→ POST /api/jinmon/reply で、' + c.name + 'として返答してください。' : '新しい質問は来ていません。');
  return v;
}

module.exports = { newGame, playerAsk, playerAskAll, playerPresent, actorReply, actorNote, playerAccuse, playerView, actorView, CHARS, ITEMS, INTRO, DOCS };
