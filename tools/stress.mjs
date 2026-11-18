#!/usr/bin/env node
/* 自學星圖 P2 第 5 步：54 台壓力測試（SPEC §10.3）
   用法（查詢碼只從環境變數讀，不寫進任何檔案）：
     SO_TEST_KEY=… node tools/stress.mjs usage            只讀：屬性用量、so:err、觸發器
     SO_TEST_KEY=… node tools/stress.mjs run [--min 10] [--n 54] [--switch 9] [--out 目錄]
     SO_TEST_KEY=… node tools/stress.mjs clear            清掉測試座號的暫存區（不碰 Notion）
   run：54 個虛擬載具照前台 api.js 的同一套規則（滿 5 筆／30 秒／回合結束送出、隨機錯開 0–3 秒、
   needPull 先拉再送、失敗退避重送），座號 901 起，每題 5–20 秒、選項隨機；其中 --switch 台中途換新載具碼接續，
   量「舊載具關掉 → 新載具看到同一份 mid」的延遲。跑完把每個座號「應該落地的內容」寫成 expected.json，
   之後用 Notion 沙盒表回讀逐座號比對（題數、答對數、作答明細總字數、回合數、各本存檔版本與星數）。 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { planRound, parsePairs } from '../src/play.mjs';
import { takeBatch, dropUpTo, booksIn, backoff, midOf, resumeOf } from '../src/sync.mjs';
import { decodeSave, totals } from '../src/rules.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(HERE, '../../class-website/data');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const MODE = process.argv[2] || 'usage';
const KEY = process.env.SO_TEST_KEY || '';
const URL_ = JSON.parse(fs.readFileSync(path.join(DATA, 'site-config.json'), 'utf8')).updateProxyUrl;
const MIN = Number(arg('min', 10)), N = Number(arg('n', 54)), NSW = Number(arg('switch', 9));
const SEAT0 = Number(arg('seat0', 901));
const OUT = arg('out', path.join(HERE, '../.stress'));
if (!KEY) { console.error('缺 SO_TEST_KEY（環境變數）'); process.exit(2); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rid = () => Array.from({ length: 8 }, () => 'abcdefghjkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 31)]).join('');

/* ---------- 請求與統計 ---------- */
const ST = { req: [], samples: [], inflight: 0, peak: 0 };
async function post(body) {
  const t0 = Date.now(), ac = new AbortController(), to = setTimeout(() => ac.abort(), 25000);
  ST.inflight++; ST.peak = Math.max(ST.peak, ST.inflight);
  let r = null, kind = 'ok', text = '';
  try {
    const res = await fetch(URL_, { method: 'POST', body: JSON.stringify(body), signal: ac.signal, headers: { 'Content-Type': 'text/plain' } });
    text = await res.text();
    try { r = JSON.parse(text); } catch (e) { kind = 'html'; }
  } catch (e) { kind = e.name === 'AbortError' ? 'timeout' : 'net'; text = String(e.message || e); }
  finally { clearTimeout(to); ST.inflight--; }
  if (r) kind = r.ok ? 'ok' : r.needPull ? 'needPull' : r.relogin ? 'relogin' : r.retry ? 'busy' : r.paused ? 'paused' : 'error';
  const ms = Date.now() - t0;
  ST.req.push({ a: body.action, kind, ms, t: t0, lockMs: r && typeof r.lockMs === 'number' ? r.lockMs : null, lockWait: r && typeof r.lockWait === 'number' ? r.lockWait : null });
  if (kind !== 'ok' && kind !== 'needPull' && ST.samples.length < 40) ST.samples.push({ a: body.action, kind, at: new Date(t0).toISOString(), msg: (r && r.error) || text.replace(/\s+/g, ' ').slice(0, 300) });
  return r;
}

/* ---------- 題本 ---------- */
const BOOKS = {};
for (const b of JSON.parse(fs.readFileSync(path.join(DATA, 'study-orbit/index.json'), 'utf8')).books.map((x) => x.code)) {
  const d = JSON.parse(fs.readFileSync(path.join(DATA, 'study-orbit', b + '.json'), 'utf8'));
  BOOKS[b] = { qs: d.questions, levels: [...new Set(d.questions.map((q) => q.level))].sort() };
}
const BOOK_W = Object.keys(BOOKS).flatMap((b) => Array(Math.max(1, BOOKS[b].levels.length)).fill(b)); // 關多的本多玩一點
const norm = (s) => String(s ?? '').toUpperCase().replace(/\s/g, '');
const LETTERS = 'ABCDEFGHIJ';

/* ---------- 一台載具（照 api.js） ---------- */
class Dev {
  constructor(st) { this.st = st; this.seat = st.seat; this.dev = rid(); this.q = []; this.seq = {}; this.mid = {}; this.token = ''; this.busy = false; this.timer = null; this.fails = 0; this.dead = false; }
  async login() {
    for (let n = 1; n <= 12; n++) {
      const r = await post({ action: 'so_login', seat: this.seat, code: KEY, dev: this.dev });
      if (r && r.ok) { this.token = r.token; return true; }
      await sleep(backoff(n));
    }
    return false;
  }
  async pull(b) {
    for (let n = 1; n <= 8; n++) {
      const r = await post({ action: 'so_pull', token: this.token, book: b });
      if (r && r.ok) return r;
      if (r && r.relogin) await this.login(); else await sleep(backoff(n));
    }
    return null;
  }
  async start() { await Promise.all(Object.keys(BOOKS).map((b) => this.pull(b))); this.flush(true); }
  enqueue(b, e) {
    const s = (this.seq[b] || 0) + 1; this.seq[b] = s; this.q.push({ b, s, e }); this.st.expect(b, e);
    if (this.q.length >= 5) this.flush(); else this.soon();
  }
  setMid(b, m) { if (m) this.mid[b] = m; else delete this.mid[b]; this.soon(); }
  soon(ms = 30000) { if (!this.timer && !this.dead) this.timer = setTimeout(() => { this.timer = null; this.flush(); }, ms); }
  async flush(now) {
    if (this.busy || this.dead) return;
    const books = [...new Set([...booksIn(this.q), ...Object.keys(this.mid)])]; if (!books.length) return;
    clearTimeout(this.timer); this.timer = null; this.busy = true; let res = 'ok';
    try { if (!now) await sleep(Math.random() * 3000); for (const b of books) { res = await this.pushBook(b); if (res !== 'ok') break; } }
    finally { this.busy = false; }
    if (res === 'retry') { this.fails++; this.soon(backoff(this.fails)); }
    else if (this.q.length || Object.keys(this.mid).length) { this.fails = 0; this.soon(1000); } else this.fails = 0;
  }
  async pushBook(b) {
    const bt = takeBatch(this.q, b), mid = this.mid[b] || null; if (!bt && !mid) return 'ok';
    this.st.books.add(b);
    const body = () => ({ action: 'so_push', token: this.token, book: b, dev: this.dev, seq0: bt ? bt.seq0 : (this.seq[b] || 0) + 1, ev: bt ? bt.ev : [], mid });
    let r = await post(body());
    if (r && r.needPull) { if (!await this.pull(b)) return 'retry'; r = await post(body()); }
    if (!r) return 'retry';
    if (r.relogin) { await this.login(); return 'retry'; }
    if (!r.ok) return 'retry';
    if (bt) this.q = dropUpTo(this.q, b, bt.last);
    if (this.mid[b] === mid) delete this.mid[b];
    if (bt && bt.ev.some((e) => e[0] === 'e') && !this.q.some((x) => x.b === b)) await this.pull(b); // 前台：回合結束送完就拉一次
    return 'ok';
  }
  /* 關掉前把佇列與 mid 送完（模擬 sendBeacon，但等回覆以確定送達），最多 90 秒 */
  async drain(limitMs = 90000) {
    const t0 = Date.now(); clearTimeout(this.timer); this.timer = null;
    while ((this.q.length || Object.keys(this.mid).length) && Date.now() - t0 < limitMs) {
      while (this.busy) await sleep(200);
      await this.flush(true);
      if (this.q.length || Object.keys(this.mid).length) await sleep(this.fails ? backoff(this.fails) : 500);
    }
    this.dead = true; clearTimeout(this.timer);
    return !this.q.length && !Object.keys(this.mid).length;
  }
}

/* ---------- 一位學生（座號），可能換載具 ---------- */
class Student {
  constructor(seat, switchAt) { this.seat = seat; this.switchAt = switchAt; this.books = new Set(); this.lines = {}; this.rounds = 0; this.switchMs = null; this.lost = false; }
  expect(b, e) { // 代理會寫進作答明細的那一行（soFold_ 同一格式）
    if (e[0] === 'e') { this.rounds++; return; }
    if (e[0] !== 'a') return;
    const q = BOOKS[b].qs.find((x) => x.id === e[3]);
    let ok;
    if (String(q.answer).includes(',')) { const o = parsePairs(e[4]), k = Object.keys(o)[0]; ok = parsePairs(q.answer)[k] === o[k]; }
    else ok = norm(q.answer) === norm(e[4]);
    (this.lines[b] = this.lines[b] || []).push(`${b}-${e[1]}#${e[2]},${e[3]},${e[4]},${ok ? 1 : 0},${e[5]},${e[6]},${e[7]}`);
  }
  async run(t0, tEnd) {
    await sleep(rnd(0, 3000));
    this.d = new Dev(this);
    if (!await this.d.login()) { this.lost = true; return; }
    await this.d.start();
    while (Date.now() < tEnd) {
      const b = pick(BOOK_W), level = pick(BOOKS[b].levels), k = level.slice(b.length + 1);
      const plan = planRound(BOOKS[b].qs, level);
      const done = await this.round(b, k, level, plan, 0, Array(7).fill(''), tEnd);
      if (!done) break;
    }
  }
  /* 闖一回合；回 false＝時間到（停在半途，mid 已送） */
  async round(b, k, level, plan, n0, res, tEnd) {
    for (let n = n0; n < plan.length; n++) {
      if (Date.now() >= tEnd) return false;
      const it = plan[n];
      await this.item(b, k, it, res);
      this.d.setMid(b, midOf(k, plan, n + 1, res, [], Date.now()));
      if (this.switchAt && Date.now() >= this.switchAt && n + 1 < plan.length) { // 換載具
        this.switchAt = 0;
        const want = midOf(k, plan, n + 1, res, [], 0).res;
        const t0 = Date.now();
        await this.d.drain();
        this.d = new Dev(this);
        await this.d.login();
        await this.d.start();
        let m = null;
        while (Date.now() - t0 < 120000) {
          const r = await this.d.pull(b);
          m = r && decodeSave(r.save).mid;
          if (m && m.k === k && m.res === want) break;
          await sleep(2000);
        }
        this.switchMs = Date.now() - t0;
        const rs = resumeOf(m, BOOKS[b].qs, level);
        if (!rs) { this.switchMs = -1; return true; }
        return this.round(b, k, level, rs.plan, rs.n, rs.res, tEnd);
      }
    }
    this.d.enqueue(b, ['e', k, Math.random() < 0.5 ? 'n' : 'f']);
    this.d.setMid(b, null);
    this.d.flush();
    return true;
  }
  async item(b, k, it, res) {
    const q = it.q, hints = Math.random() < 0.1 ? 1 : 0;
    if (q.type === '配合') {
      const ans = parsePairs(q.answer), letters = LETTERS.slice(0, q.left.length).split('').sort(() => Math.random() - 0.5);
      await sleep(rnd(5000, 20000)); const sec = Math.round(rnd(5, 20));
      const wrong = [];
      it.slots.forEach((s, i) => {
        const ok = ans[i + 1] === letters[i];
        this.d.enqueue(b, ['a', k, s, q.id, (i + 1) + letters[i], hints, sec, 1]);
        if (ok) res[s - 1] = hints ? 'silver' : 'gold'; else wrong.push(i);
      });
      if (!wrong.length) return;
      const q2 = it.alt || q, a2 = parsePairs(q2.answer);
      await sleep(rnd(5000, 20000)); const sec2 = Math.round(rnd(5, 20));
      for (const i of wrong) { const l = pick(LETTERS.slice(0, q2.left.length).split('')); this.d.enqueue(b, ['a', k, it.slots[i], q2.id, (i + 1) + l, 0, sec2, 2]); res[it.slots[i] - 1] = a2[i + 1] === l ? 'silver' : 'dark'; }
      return;
    }
    const s = it.slots[0], nOpt = (q.options || []).length || 4;
    await sleep(rnd(5000, 20000));
    const opt = LETTERS[Math.floor(Math.random() * nOpt)];
    this.d.enqueue(b, ['a', k, s, q.id, opt, hints, Math.round(rnd(5, 20)), 1]);
    if (norm(q.answer) === opt) { res[s - 1] = hints ? 'silver' : 'gold'; return; }
    const q2 = it.alt || q, n2 = (q2.options || []).length || 4;
    await sleep(rnd(5000, 20000));
    const o2 = LETTERS[Math.floor(Math.random() * n2)];
    this.d.enqueue(b, ['a', k, s, q2.id, o2, 0, Math.round(rnd(5, 20)), 2]);
    res[s - 1] = norm(q2.answer) === o2 ? 'silver' : 'dark';
  }
}

/* ---------- 統計輸出 ---------- */
const pct = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
function report() {
  const by = {};
  for (const x of ST.req) { const o = by[x.a] = by[x.a] || { n: 0, kinds: {}, ms: [] }; o.n++; o.kinds[x.kind] = (o.kinds[x.kind] || 0) + 1; o.ms.push(x.ms); }
  const out = {};
  for (const a in by) out[a] = { n: by[a].n, kinds: by[a].kinds, p50: pct(by[a].ms, 0.5), p95: pct(by[a].ms, 0.95), max: Math.max(...by[a].ms) };
  const lock = ST.req.filter((x) => x.lockMs != null).map((x) => x.lockMs);
  const wait = ST.req.filter((x) => x.lockWait != null).map((x) => x.lockWait); // v2.23 起：等待鎖（標準 ⑤）與持鎖分開
  return { requests: out, lockMs: { n: lock.length, p50: pct(lock, 0.5), p95: pct(lock, 0.95), max: lock.length ? Math.max(...lock) : null },
    lockWait: { n: wait.length, p50: pct(wait, 0.5), p95: pct(wait, 0.95), max: wait.length ? Math.max(...wait) : null }, peakInflight: ST.peak, samples: ST.samples };
}

/* ---------- 主程式 ---------- */
const usage = async () => post({ action: 'so_test_clear', testKey: KEY, dry: true });
if (MODE === 'usage') { console.log(JSON.stringify(await usage(), null, 1)); process.exit(0); }
if (MODE === 'clear') { console.log(JSON.stringify(await post({ action: 'so_test_clear', testKey: KEY }), null, 1)); process.exit(0); }
if (MODE !== 'run') { console.error('模式只有 usage／run／clear'); process.exit(2); }

fs.mkdirSync(OUT, { recursive: true });
const u0 = await usage();
console.log(`[${new Date().toISOString()}] 測前用量 ${u0 && u0.usage ? u0.usage.bytes : '?'}B；${N} 台、${MIN} 分鐘、換載具 ${NSW} 台`);
const t0 = Date.now(), tEnd = t0 + MIN * 60000;
const sw = new Set(); while (sw.size < Math.min(NSW, N)) sw.add(Math.floor(Math.random() * N));
const studs = Array.from({ length: N }, (_, i) => new Student(SEAT0 + i, sw.has(i) ? t0 + rnd(0.3, 0.7) * MIN * 60000 : 0));
const tick = setInterval(() => { const r = ST.req.length, bad = ST.req.filter((x) => x.kind !== 'ok' && x.kind !== 'needPull').length; console.log(`[${Math.round((Date.now() - t0) / 1000)}s] 請求 ${r}、非 ok ${bad}、同時進行峰值 ${ST.peak}`); }, 60000);
await Promise.all(studs.map((s) => s.run(t0, tEnd)));
console.log(`[${new Date().toISOString()}] 作答結束，送完佇列…`);
const drained = await Promise.all(studs.map((s) => s.d ? s.d.drain(180000) : true));
clearInterval(tick);
/* 各本最後進度（暫存區）：用一台新載具拉，當作 Notion 落地後的對照值 */
const exp = { at: new Date().toISOString(), date: new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10), seats: {} };
for (const s of studs) {
  const d = new Dev(s); await d.login();
  const books = {};
  for (const b of s.books) { const r = await d.pull(b); if (r) { const t = totals(decodeSave(r.save).lv); books[b] = { ver: r.ver, stars: t.stars, completed: t.completed }; } }
  const all = Object.keys(s.lines).flatMap((b) => s.lines[b]);
  exp.seats[s.seat] = { q: all.length, c: all.filter((l) => l.split(',')[3] === '1').length, rounds: s.rounds, linesChars: all.reduce((n, l) => n + l.length, 0), books, switchMs: s.switchMs, lost: s.lost };
}
const rep = report();
rep.notDrained = drained.filter((x) => !x).length;
rep.switchMs = studs.filter((s) => s.switchMs != null).map((s) => s.switchMs);
rep.usageBefore = u0 && u0.usage; rep.usageAfter = (await usage() || {}).usage;
fs.writeFileSync(path.join(OUT, 'expected.json'), JSON.stringify(exp, null, 1));
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(rep, null, 1));
fs.writeFileSync(path.join(OUT, 'requests.json'), JSON.stringify(ST.req));
console.log(JSON.stringify({ ...rep, samples: rep.samples.slice(0, 8) }, null, 1));
console.log(`總題數 ${Object.values(exp.seats).reduce((n, s) => n + s.q, 0)}、回合 ${Object.values(exp.seats).reduce((n, s) => n + s.rounds, 0)}；輸出 ${OUT}`);
