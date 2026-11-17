// 自學星圖前台：出題與判題（純函式）。node 測試直接 import；build.py 去掉 export 併進頁面。
// 規格：P1 SPEC §5（一格最多兩次、再挑戰換同一格的另一題）、§9 第 4 項（配合題一對一盞燈）、
//       PLAN §一之一（閱讀題組：同一組小題用同一篇；兩組擇一）。燈色與星等一律用 rules.mjs。

/**
 * 排一回合：每一格（配合題＝起始格、占 span 格）從兩題擇一，另一題留給再挑戰。
 * 閱讀題組：同一回合整組一起選（選了 G1 的第一小題，後面幾格也都用 G1）。
 * @returns {{slots:number[], q:object, alt:object|null}[]} 依格子順序
 */
export function planRound(questions, level, rand = Math.random) {
  const mine = questions.filter((q) => q.level === level);
  const starts = [...new Set(mine.map((q) => q.slot))].sort((a, b) => a - b);
  const chosen = new Set(), rejected = new Set();
  return starts.map((s) => {
    const c = mine.filter((q) => q.slot === s)
      .sort((a, b) => (a.mother ? 1 : 0) - (b.mother ? 1 : 0) || a.id.localeCompare(b.id));
    let i = c.findIndex((q) => q.group && chosen.has(q.group));
    if (i < 0) i = c.findIndex((q) => q.group && !rejected.has(q.group) && c.some((o) => o !== q && o.group && rejected.has(o.group)));
    if (i < 0) i = c.length > 1 ? Math.floor(rand() * c.length) : 0;
    c.forEach((q, k) => { if (q.group) (k === i ? chosen : rejected).add(q.group); });
    const q = c[i], span = Math.max(1, Number(q.span) || 1);
    return { slots: Array.from({ length: span }, (_, k) => s + k), q, alt: c.find((_, k) => k !== i) ?? null };
  });
}

/** 配合題答案字串 "1B,2D,3A,4C" ↔ {1:"B",2:"D",…} */
export function parsePairs(s) {
  const o = {};
  String(s ?? "").toUpperCase().replace(/\s/g, "").split(",").forEach((x) => { if (x) o[x.slice(0, -1)] = x.slice(-1); });
  return o;
}
export const pairsStr = (o) => Object.keys(o).sort((a, b) => a - b).map((k) => k + o[k]).join(",");

export const judgeChoice = (q, letter) => String(q.answer).trim().toUpperCase() === String(letter).toUpperCase();

/** 配合題逐對判：回傳每一對（左欄 1…n）對不對 */
export function judgeMatch(q, pairs) {
  const ans = parsePairs(q.answer);
  return q.left.map((_, i) => ans[i + 1] != null && ans[i + 1] === pairs[i + 1]);
}

/** 答錯時要發的秘笈卡：選擇題＝選到的那個錯誤選項；配合題＝配錯的那幾對（一次最多兩張，不重複） */
export function cardsFor(q, picked) {
  const ob = q.ob || {};
  if (q.type === "配合") {
    const ok = judgeMatch(q, picked), out = [];
    ok.forEach((v, i) => { const b = ob[i + 1]; if (!v && b && !out.includes(b)) out.push(b); });
    return out.slice(0, 2);
  }
  const b = ob[String(picked).toUpperCase()];
  return b ? [b] : [];
}

/** 複習卡冊：抽一題掛著這個盲點的題（選擇題優先，配合題次之） */
export function cardQuestion(questions, bs, rand = Math.random) {
  const has = questions.filter((q) => Object.values(q.ob || {}).includes(bs));
  const pool = has.filter((q) => q.type !== "配合");
  const list = pool.length ? pool : has;
  return list.length ? list[Math.floor(rand() * list.length)] : null;
}

/** 兩個日期（YYYY-MM-DD）差幾天 */
export const dayDiff = (a, b) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 864e5);

/**
 * 卡冊清單（m＝decodeSave 的形狀，鍵是短代碼）：
 * todo＝待複習；due＝已克服滿 7 天、今天要確認；wait＝已克服未滿 7 天；ok＝已結案的數量
 */
export function deckOf(m, today) {
  const out = { todo: [], due: [], wait: [], ok: (m.ok || []).length };
  for (const [k, [st, d]] of Object.entries(m.cd || {})) {
    if (st === "t") out.todo.push(k);
    else if (st === "d") (dayDiff(d, today) >= 7 ? out.due : out.wait).push(k);
  }
  return out;
}

/** 卡冊挑戰的結果怎麼改卡（與代理 soFold_ 的 "c" 事件同一套） */
export function cardAfter(cur, ok, today) {
  if (!ok) return ["t", today];
  if (!cur || cur[0] === "t") return ["d", today];
  if (cur[0] === "d" && dayDiff(cur[1], today) >= 7) return "o"; // 結案
  return cur;
}
