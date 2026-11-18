#!/usr/bin/env node
/* 壓力測試落地比對：stress.mjs 的 expected.json ↔ Notion 沙盒表回讀（SQL 結果存成 JSON）
   用法：node tools/stress-compare.mjs <expected.json> <log.json> <prog.json> [基準.json]
   log.json：自學紀錄（模擬）當天各列 {標題, 題數, 答對數, len(作答明細字數), rr(回合摘要行數)}
   prog.json：自學進度（模擬）各列 {標題, 存檔版本, 星數, 完成關數}
   基準.json：測試前就有的當天列 {"901":{"q":7,"c":7,"len":231,"rr":1}}（新行接在舊內容後面，中間多一個換行）
   作答明細＝每行用換行接起來，所以字數＝各行字數合計＋行數−1。 */
import fs from 'node:fs';
const [exp, log, prog, base] = process.argv.slice(2).map((f) => f && JSON.parse(fs.readFileSync(f, 'utf8')));
const rows = (x) => x.results || x;
const L = Object.fromEntries(rows(log).map((r) => [Number(r['標題'].split('｜')[1]), r]));
const P = Object.fromEntries(rows(prog).map((r) => { const [, b, s] = r['標題'].split('｜'); return [b + ':' + Number(s), r]; }));
let bad = 0, n = 0;
const diff = [];
for (const [seat, e] of Object.entries(exp.seats)) {
  const b0 = (base || {})[seat] || { q: 0, c: 0, len: 0, rr: 0 };
  const want = { q: b0.q + e.q, c: b0.c + e.c, len: e.q ? (b0.len ? b0.len : -1) + e.linesChars + e.q : b0.len, rr: b0.rr + e.rounds };
  const r = L[seat];
  if (e.q && !r) { bad++; diff.push(`${seat} 自學紀錄沒有這一列`); continue; }
  if (r) {
    const got = { q: r['題數'], c: r['答對數'], len: r['len'], rr: r['rr'] };
    for (const k of ['q', 'c', 'len', 'rr']) { n++; if (got[k] !== want[k]) { bad++; diff.push(`${seat} 紀錄 ${k}：應為 ${want[k]}、Notion ${got[k]}`); } }
  }
  for (const [book, v] of Object.entries(e.books)) {
    const p = P[book + ':' + seat];
    if (!p) { bad++; diff.push(`${seat} ${book} 自學進度沒有這一列`); continue; }
    for (const [k, col] of [['ver', '存檔版本'], ['stars', '星數'], ['completed', '完成關數']]) { n++; if (p[col] !== v[k]) { bad++; diff.push(`${seat} ${book} ${col}：應為 ${v[k]}、Notion ${p[col]}`); } }
  }
}
const q = Object.values(exp.seats).reduce((s, e) => s + e.q, 0);
console.log(`座號 ${Object.keys(exp.seats).length}、題數 ${q}、比對 ${n} 格、不符 ${bad}`);
diff.slice(0, 40).forEach((d) => console.log('  ' + d));
process.exit(bad ? 1 : 0);
