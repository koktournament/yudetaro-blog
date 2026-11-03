'use strict';
/* yudetaro.com Worker（本番用）
   ルーティング: /api/ramen/* と /api/trpg/* は部屋ごとの Durable Object（倉庫）へ、それ以外は静的アセットへ。 */
import coreModule from './ramen-core.js';
const core = coreModule.default || coreModule;
import trpgModule from './trpg-core.js';
const trpg = trpgModule.default || trpgModule;

const WORDS = ['neko', 'inu', 'tora', 'sora', 'umi', 'yama', 'kawa', 'hoshi'];
const TRPG_WORDS = ['mura', 'hora', 'gobu', 'yama', 'hata', 'inu'];
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
      return json(role === 'gm' ? trpg.gmView(st) : trpg.playerView(st));
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
    if (u.pathname.startsWith('/api/ramen/')) return routeApi(req, env, '/api/ramen', env.RAMEN_ROOM, WORDS);
    if (u.pathname.startsWith('/api/trpg/')) return routeApi(req, env, '/api/trpg', env.TRPG_ROOM, TRPG_WORDS);
    return env.ASSETS.fetch(req);
  },
};
