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

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname.startsWith('/api/ramen/')) return new Response('not found', { status: 404 });
    if (u.pathname.startsWith('/api/trpg/')) return routeApi(req, env, '/api/trpg', env.TRPG_ROOM, TRPG_WORDS);
    if (u.pathname.startsWith('/api/ryu/')) return routeApi(req, env, '/api/ryu', env.RYU_ROOM, RYU_WORDS);
    if (u.pathname.startsWith('/api/jinmon/')) return routeApi(req, env, '/api/jinmon', env.JINMON_ROOM, JINMON_WORDS);
    return env.ASSETS.fetch(req);
  },
};
