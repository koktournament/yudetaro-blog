'use strict';
/* yudetaro.com Worker（本番用）
   ルーティング: /api/ramen/* と /api/trpg/* は部屋ごとの Durable Object（倉庫）へ、それ以外は静的アセットへ。 */
import coreModule from './ramen-core.js';
const core = coreModule.default || coreModule;
import trpgModule from './trpg-core.js';
const trpg = trpgModule.default || trpgModule;
import ryuModule from './ryu-core.js';
const ryu = ryuModule.default || ryuModule;
import jinmonModule from './jinmon-core.js';
const jinmon = jinmonModule.default || jinmonModule;

const WORDS = ['neko', 'inu', 'tora', 'sora', 'umi', 'yama', 'kawa', 'hoshi'];
const TRPG_WORDS = ['mura', 'hora', 'gobu', 'yama', 'hata', 'inu'];
const RYU_WORDS = ['ryu', 'tou', 'kane', 'sato', 'kiri', 'hashi'];
const JINMON_WORDS = ['jin', 'mon', 'kei', 'sai', 'hito'];
function seedFromCode(code) { let h = 2166136261; for (const c of code) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function json(obj, status) { return new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } }); }

export class RamenRoom {
  constructor(state, env) { this.storage = state.storage; }
  async load() { return (await this.storage.get('room')) || null; }
  async save(st) { await this.storage.put('room', st); }
  async fetch(req) {
    const u = new URL(req.url);
    const code = u.searchParams.get('code') || (await req.clone().json().catch(() => ({}))).code;
    if (u.pathname.endsWith('/init')) {
      if (!(await this.load())) await this.save(core.newRoom(seedFromCode(code)));
      return json({ ok: true });
    }
    const st = await this.load();
    if (!st) return json({ error: '部屋が見つかりません' }, 404);
    if (u.pathname.endsWith('/state')) {
      const role = u.searchParams.get('role');
      if (role !== 'human' && role !== 'robot') return json({ error: 'role は human か robot' }, 400);
      return json(core.viewFor(st, role));
    }
    if (u.pathname.endsWith('/message')) {
      const body = await req.json();
      const r = core.submitMessage(st, body.role, body.text, body.memo);
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true, phase: st.phase });
    }
    if (u.pathname.endsWith('/submit')) {
      const body = await req.json();
      const r = core.submit(st, body.role, body.decision || {});
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true, phase: st.phase });
    }
    if (u.pathname.endsWith('/tentative')) {
      const body = await req.json();
      if (body.role !== 'robot') return json({ error: '仮仕込みは調理ロボだけが置けます' }, 400);
      const r = core.setTentative(st, body.plan === undefined ? null : body.plan);
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true });
    }
    if (u.pathname.endsWith('/ack')) {
      const body = await req.json();
      const r = core.ack(st, body.role);
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true, phase: st.phase, day: st.day });
    }
    return json({ error: 'not found' }, 404);
  }
}

/* ===== AI GM TRPG「ゴブリン洞穴」 ===== */
export class TrpgRoom {
  constructor(state, env) { this.storage = state.storage; }
  async load() { return (await this.storage.get('room')) || null; }
  async save(st) { await this.storage.put('room', st); }
  async fetch(req) {
    const u = new URL(req.url);
    const code = u.searchParams.get('code') || (await req.clone().json().catch(() => ({}))).code;
    if (u.pathname.endsWith('/init')) {
      if (!(await this.load())) await this.save(trpg.newGame(seedFromCode(code)));
      return json({ ok: true });
    }
    const st = await this.load();
    if (!st) return json({ error: '部屋が見つかりません' }, 404);
    if (u.pathname.endsWith('/state')) {
      const role = u.searchParams.get('role');
      const sigOf = (s) => JSON.stringify([s.day, s.phase, s.result, s.log.length, s.pendingText ? 1 : 0, s.pendingFree ? 1 : 0, s.pendingAsk ? 1 : 0, s.player.hp, s.ally.hp, s.actionsLeft, s.combat ? s.combat.round + ':' + s.combat.enemies.map(e => e.hp).join(',') : '']);
      let cur = st;
      let sig = sigOf(cur);
      const wait = Math.min(25, Math.max(0, parseInt(u.searchParams.get('wait') || '0', 10) || 0));
      const want = u.searchParams.get('sig');
      if (wait > 0 && want && want === sig) {
        const deadline = Date.now() + wait * 1000;
        while (Date.now() < deadline) {
          await new Promise(r => setTimeout(r, 800));
          const fresh = await this.load();
          if (!fresh) break;
          cur = fresh;
          const ns = sigOf(fresh);
          if (ns !== sig) { sig = ns; break; }
        }
      }
      const view = role === 'gm' ? trpg.gmView(cur) : trpg.playerView(cur);
      view.sig = sig;
      return json(view);
    }
    if (u.pathname.endsWith('/declare')) {
      const body = await req.json();
      const r = trpg.playerDeclare(st, body.text, body.talkTo);
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true });
    }
    if (u.pathname.endsWith('/interpret')) {
      const body = await req.json();
      const r = trpg.gmInterpret(st, body.spec || {});
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true });
    }
    if (u.pathname.endsWith('/action')) {
      const body = await req.json();
      const r = trpg.playerAction(st, body.action || {});
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true });
    }
    if (u.pathname.endsWith('/narrate')) {
      const body = await req.json();
      const r = trpg.gmNarrate(st, body.text);
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true });
    }
    if (u.pathname.endsWith('/ask')) {
      const body = await req.json();
      const r = trpg.playerAsk(st, body.text);
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true });
    }
    if (u.pathname.endsWith('/answer')) {
      const body = await req.json();
      const r = trpg.gmAnswer(st, body.text);
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true });
    }
    if (u.pathname.endsWith('/rule')) {
      const body = await req.json();
      const r = trpg.gmRule(st, body.tier, body.reward, body.custom);
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true, roll: r.roll, success: r.success });
    }
    return json({ error: 'not found' }, 404);
  }
}

/* ===== AI GM TRPG「竜の眠る峠」 ===== */
export class RyuRoom {
  constructor(state, env) { this.storage = state.storage; }
  async load() { return (await this.storage.get('room')) || null; }
  async save(st) { await this.storage.put('room', st); }
  async fetch(req) {
    const u = new URL(req.url);
    const code = u.searchParams.get('code') || (await req.clone().json().catch(() => ({}))).code;
    if (u.pathname.endsWith('/init')) {
      if (!(await this.load())) await this.save(ryu.newGame(seedFromCode(code)));
      return json({ ok: true });
    }
    const st = await this.load();
    if (!st) return json({ error: '部屋が見つかりません' }, 404);
    if (u.pathname.endsWith('/state')) {
      const role = u.searchParams.get('role');
      const sigOf = (s) => JSON.stringify([s.day, s.phase, s.result, s.log.length, s.pendingText ? 1 : 0, s.pendingFree ? 1 : 0, s.pendingAsk ? 1 : 0, s.player.hp, s.ally.hp, s.actionsLeft, s.combat ? s.combat.round + ':' + s.combat.enemies.map(e => e.hp).join(',') : '']);
      let cur = st;
      let sig = sigOf(cur);
      const wait = Math.min(25, Math.max(0, parseInt(u.searchParams.get('wait') || '0', 10) || 0));
      const want = u.searchParams.get('sig');
      if (wait > 0 && want && want === sig) {
        const deadline = Date.now() + wait * 1000;
        while (Date.now() < deadline) {
          await new Promise(r => setTimeout(r, 800));
          const fresh = await this.load();
          if (!fresh) break;
          cur = fresh;
          const ns = sigOf(fresh);
          if (ns !== sig) { sig = ns; break; }
        }
      }
      const view = role === 'gm' ? ryu.gmView(cur) : ryu.playerView(cur);
      view.sig = sig;
      return json(view);
    }
    if (u.pathname.endsWith('/declare')) {
      const body = await req.json();
      const r = ryu.playerDeclare(st, body.text, body.talkTo);
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true });
    }
    if (u.pathname.endsWith('/interpret')) {
      const body = await req.json();
      const r = ryu.gmInterpret(st, body.spec || {});
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true });
    }
    if (u.pathname.endsWith('/action')) {
      const body = await req.json();
      const r = ryu.playerAction(st, body.action || {});
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true });
    }
    if (u.pathname.endsWith('/narrate')) {
      const body = await req.json();
      const r = ryu.gmNarrate(st, body.text);
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true });
    }
    if (u.pathname.endsWith('/ask')) {
      const body = await req.json();
      const r = ryu.playerAsk(st, body.text);
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true });
    }
    if (u.pathname.endsWith('/answer')) {
      const body = await req.json();
      const r = ryu.gmAnswer(st, body.text);
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true });
    }
    if (u.pathname.endsWith('/rule')) {
      const body = await req.json();
      const r = ryu.gmRule(st, body.tier, body.reward, body.custom);
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true, roll: r.roll, success: r.success });
    }
    return json({ error: 'not found' }, 404);
  }
}

/* ===== 尋問ゲーム「金庫の中身」 ===== */
export class JinmonRoom {
  constructor(state, env) { this.storage = state.storage; }
  async load() { return (await this.storage.get('room')) || null; }
  async save(st) { await this.storage.put('room', st); }
  async fetch(req) {
    const u = new URL(req.url);
    const code = u.searchParams.get('code') || (await req.clone().json().catch(() => ({}))).code;
    if (u.pathname.endsWith('/init')) {
      if (!(await this.load())) await this.save(jinmon.newGame(seedFromCode(code)));
      return json({ ok: true });
    }
    const st = await this.load();
    if (!st) return json({ error: '部屋が見つかりません' }, 404);
    if (u.pathname.endsWith('/state')) {
      const role = u.searchParams.get('role');
      const sigOf = (s) => JSON.stringify([s.result, s.totalQuestions, s.accusations.length, Object.values(s.chars).map(r => [r.log.length, r.pending ? 1 : 0, r.status])]);
      let cur = st;
      let sig = sigOf(cur);
      const wait = Math.min(25, Math.max(0, parseInt(u.searchParams.get('wait') || '0', 10) || 0));
      const want = u.searchParams.get('sig');
      if (wait > 0 && want && want === sig) {
        const deadline = Date.now() + wait * 1000;
        while (Date.now() < deadline) {
          await new Promise(r => setTimeout(r, 800));
          const fresh = await this.load();
          if (!fresh) break;
          cur = fresh;
          const ns = sigOf(fresh);
          if (ns !== sig) { sig = ns; break; }
        }
      }
      const view = role === 'actor' ? jinmon.actorView(cur, u.searchParams.get('char') || '') : jinmon.playerView(cur);
      if (view.error) return json({ error: view.error }, 400);
      view.sig = sig;
      return json(view);
    }
    if (u.pathname.endsWith('/ask')) {
      const body = await req.json();
      const r = jinmon.playerAsk(st, body.char, body.text);
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true });
    }
    if (u.pathname.endsWith('/askall')) {
      const body = await req.json();
      const r = jinmon.playerAskAll(st, body.text);
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true, sent: r.sent, group: r.group });
    }
    if (u.pathname.endsWith('/present')) {
      const body = await req.json();
      const r = jinmon.playerPresent(st, body.char, body.item);
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true });
    }
    if (u.pathname.endsWith('/reply')) {
      const body = await req.json();
      const r = jinmon.actorReply(st, body.char, body.text);
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true });
    }
    if (u.pathname.endsWith('/note')) {
      const body = await req.json();
      const r = jinmon.actorNote(st, body.char, body.status);
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true });
    }
    if (u.pathname.endsWith('/accuse')) {
      const body = await req.json();
      const r = jinmon.playerAccuse(st, body.char);
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true, correct: r.correct, insufficient: !!r.insufficient });
    }
    if (u.pathname.endsWith('/hint')) {
      const body = await req.json();
      const r = jinmon.playerHint(st);
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true, text: r.text });
    }
    if (u.pathname.endsWith('/report')) {
      const body = await req.json();
      const r = jinmon.actorReport(st, body.char);
      if (!r.ok) return json({ error: r.error }, 400);
      await this.save(st);
      return json({ ok: true, count: r.count, gameover: r.gameover });
    }
    return json({ error: 'not found' }, 404);
  }
}

/* ===== ブログのコメント（名前だけで投稿可・即時表示。管理画面で事後削除可） ===== */
export class CommentStore {
  constructor(state, env) { this.storage = state.storage; }
  async pages() { return (await this.storage.get('pages')) || []; }
  async fetch(req) {
    const u = new URL(req.url);
    if (u.pathname.endsWith('/list')) {
      const page = u.searchParams.get('page') || '';
      if (!page.startsWith('/entry/')) return json({ comments: [] });
      const arr = (await this.storage.get('c:' + page)) || [];
      return json({ comments: arr.filter(c => c.status === 'approved').map(c => ({ id: c.id, name: c.name, body: c.body, ts: c.ts })) });
    }
    if (u.pathname.endsWith('/post')) {
      const b = await req.json().catch(() => ({}));
      if (b.hp) return json({ ok: true });
      const page = String(b.page || '');
      const name = String(b.name || '').trim().slice(0, 40);
      const body = String(b.body || '').trim().slice(0, 2000);
      if (!page.startsWith('/entry/')) return json({ error: 'ページが不正です' }, 400);
      if (!name || !body) return json({ error: '名前とコメントを入力してください' }, 400);
      if (b.iph) {
        const last = (await this.storage.get('ip:' + b.iph)) || 0;
        if (Date.now() - last < 10000) return json({ error: '少し間隔をあけて投稿してください' }, 429);
        await this.storage.put('ip:' + b.iph, Date.now());
      }
      const arr = (await this.storage.get('c:' + page)) || [];
      arr.push({ id: Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36), name: name, body: body, ts: Date.now(), status: 'approved' });
      await this.storage.put('c:' + page, arr);
      const pages = await this.pages();
      if (!pages.includes(page)) { pages.push(page); await this.storage.put('pages', pages); }
      return json({ ok: true });
    }
    if (u.pathname.endsWith('/admin-list')) {
      const out = [];
      for (const page of await this.pages()) {
        const arr = (await this.storage.get('c:' + page)) || [];
        for (const c of arr) out.push({ page: page, id: c.id, name: c.name, body: c.body, ts: c.ts, status: c.status });
      }
      out.sort((a, b) => b.ts - a.ts);
      return json({ comments: out.slice(0, 200) });
    }
    if (u.pathname.endsWith('/moderate')) {
      const b = await req.json().catch(() => ({}));
      const arr = (await this.storage.get('c:' + b.page)) || [];
      const i = arr.findIndex(c => c.id === b.id);
      if (i < 0) return json({ error: '見つかりません' }, 404);
      if (b.action === 'approve') arr[i].status = 'approved';
      else if (b.action === 'delete') arr.splice(i, 1);
      else return json({ error: 'action が不正です' }, 400);
      await this.storage.put('c:' + b.page, arr);
      return json({ ok: true });
    }
    return json({ error: 'not found' }, 404);
  }
}

async function routeComments(req, env) {
  const u = new URL(req.url);
  const stub = env.COMMENTS.get(env.COMMENTS.idFromName('blog-comments'));
  if (u.pathname === '/api/comments' && req.method === 'GET') {
    return stub.fetch('https://do/list?page=' + encodeURIComponent(u.searchParams.get('page') || ''));
  }
  if (u.pathname === '/api/comments' && req.method === 'POST') {
    const body = await req.json().catch(() => ({}));
    const ip = req.headers.get('CF-Connecting-IP') || '';
    return stub.fetch('https://do/post', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: body.page, name: body.name, body: body.body, hp: body.hp, iph: ip ? String(seedFromCode(ip)) : '' }) });
  }
  if (u.pathname.startsWith('/api/comments/admin/')) {
    if (!env.COMMENT_ADMIN_KEY) return json({ error: '管理キーが未設定です' }, 503);
    if (req.headers.get('X-Admin-Key') !== env.COMMENT_ADMIN_KEY) return json({ error: 'キーが違います' }, 401);
    if (u.pathname.endsWith('/list')) return stub.fetch('https://do/admin-list');
    if (u.pathname.endsWith('/moderate')) return stub.fetch('https://do/moderate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: await req.text() });
    return json({ error: 'not found' }, 404);
  }
  return json({ error: 'not found' }, 404);
}

const ADMIN_HTML = `<!DOCTYPE html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>コメント管理 | yudetaro.com</title>
<style>
body{font-family:sans-serif;max-width:760px;margin:2em auto;padding:0 1em;color:#222}
input[type=password]{padding:.4em;width:16em}
button{padding:.4em 1em;margin-right:.5em;cursor:pointer}
.item{border:1px solid #ccc;border-radius:6px;padding:.8em 1em;margin:.8em 0}
.item .meta{color:#666;font-size:.85em}
.item .body{white-space:pre-wrap;margin:.5em 0}
.pend{border-color:#d90}
</style></head><body>
<h1>コメント管理</h1>
<p>管理キーを入力して「読み込む」を押してください。キーはこのブラウザにだけ保存されます。</p>
<input type="password" id="key" placeholder="管理キー"> <button id="load">読み込む</button>
<p id="msg"></p>
<h2>承認待ち</h2><div id="pending"></div>
<h2>表示中</h2><div id="approved"></div>
<script>
var keyEl = document.getElementById('key');
keyEl.value = localStorage.getItem('ck') || '';
function key() { return keyEl.value.trim(); }
function fmt(ts) { return new Date(ts).toLocaleString('ja-JP'); }
function moderate(page, id, action) {
  fetch('/api/comments/admin/moderate', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key() }, body: JSON.stringify({ page: page, id: id, action: action }) })
    .then(function(r) { return r.json(); }).then(function(d) { if (d.ok) load(); else document.getElementById('msg').textContent = d.error || '失敗しました'; });
}
function makeItem(c) {
  var div = document.createElement('div'); div.className = 'item' + (c.status === 'pending' ? ' pend' : '');
  var meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = c.page + ' / ' + fmt(c.ts);
  var head = document.createElement('div'); var nm = document.createElement('strong'); nm.textContent = c.name; head.appendChild(nm);
  var body = document.createElement('div'); body.className = 'body'; body.textContent = c.body;
  div.appendChild(meta); div.appendChild(head); div.appendChild(body);
  if (c.status === 'pending') {
    var ab = document.createElement('button'); ab.textContent = '承認する';
    ab.addEventListener('click', function() { moderate(c.page, c.id, 'approve'); });
    div.appendChild(ab);
  }
  var db = document.createElement('button'); db.textContent = '削除する';
  db.addEventListener('click', function() { if (confirm('削除しますか？')) moderate(c.page, c.id, 'delete'); });
  div.appendChild(db);
  return div;
}
function load() {
  localStorage.setItem('ck', key());
  fetch('/api/comments/admin/list', { headers: { 'X-Admin-Key': key() } }).then(function(r) { return r.json(); }).then(function(d) {
    var msg = document.getElementById('msg');
    if (d.error) { msg.textContent = d.error; return; }
    msg.textContent = '';
    var p = document.getElementById('pending'); var a = document.getElementById('approved');
    p.textContent = ''; a.textContent = '';
    var np = 0, na = 0;
    d.comments.forEach(function(c) { if (c.status === 'pending') { p.appendChild(makeItem(c)); np++; } else { a.appendChild(makeItem(c)); na++; } });
    if (!np) p.textContent = '承認待ちはありません。';
    if (!na) a.textContent = '表示中のコメントはありません。';
  }).catch(function() { document.getElementById('msg').textContent = '読み込みに失敗しました'; });
}
document.getElementById('load').addEventListener('click', load);
</script>
</body></html>`;

async function routeApi(req, env, prefix, binding, words) {
  const u = new URL(req.url);
  if (u.pathname === prefix + '/create') {
    let code = '';
    for (let i = 0; i < 20; i++) {
      code = words[Math.floor(Math.random() * words.length)] + Math.floor(100 + Math.random() * 900);
      const stub = binding.get(binding.idFromName(code));
      const chk = await stub.fetch('https://do/state?code=' + code);
      if (chk.status === 404) break;
    }
    const stub = binding.get(binding.idFromName(code));
    await stub.fetch('https://do/init?code=' + code);
    return json({ code });
  }
  const body = req.method === 'POST' ? await req.clone().json().catch(() => ({})) : {};
  const code = u.searchParams.get('code') || body.code;
  if (!code) return json({ error: 'code が必要です' }, 400);
  const stub = binding.get(binding.idFromName(code));
  const path = u.pathname.replace(prefix, '');
  const qs = new URLSearchParams(u.searchParams);
  qs.set('code', code);
  return stub.fetch('https://do' + path + '?' + qs.toString(), req);
}


// はてなブログ時代のURLからの移行リダイレクト（2026-11-17）
function legacyRedirect(u) {
  const p = u.pathname;
  let m;
  if (p === '/archive') return u.origin + '/';
  if ((m = p.match(/^\/archive\/category\/(.+?)\/?$/))) {
    let name = m[1];
    try { name = decodeURIComponent(name); } catch (e) {}
    return u.origin + '/categories/' + encodeURIComponent(name.toLowerCase()) + '/';
  }
  if (/^\/archive\/\d{4}(\/\d{2}){0,2}\/?$/.test(p)) return u.origin + '/';
  if ((m = p.match(/^\/feed\/category\/(.+?)\/?$/))) {
    let name = m[1];
    try { name = decodeURIComponent(name); } catch (e) {}
    return u.origin + '/categories/' + encodeURIComponent(name.toLowerCase()) + '/index.xml';
  }
  if (p.startsWith('/entry/') && !p.endsWith('/') && !/\.[a-z0-9]+$/i.test(p)) {
    return u.origin + p + '/';
  }
  return null;
}

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    const legacy = legacyRedirect(u);
    if (legacy) return Response.redirect(legacy, 301);
    if (u.pathname.startsWith('/api/ramen/')) return new Response('not found', { status: 404 });
    if (u.pathname.startsWith('/api/trpg/')) return routeApi(req, env, '/api/trpg', env.TRPG_ROOM, TRPG_WORDS);
    if (u.pathname.startsWith('/api/ryu/')) return routeApi(req, env, '/api/ryu', env.RYU_ROOM, RYU_WORDS);
    if (u.pathname.startsWith('/api/jinmon/')) return routeApi(req, env, '/api/jinmon', env.JINMON_ROOM, JINMON_WORDS);
    if (u.pathname === '/api/comments' || u.pathname.startsWith('/api/comments/')) return routeComments(req, env);
    if (u.pathname === '/comments-admin') return new Response(ADMIN_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    return env.ASSETS.fetch(req);
  },
};
