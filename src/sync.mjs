// 自學星圖前台：接代理用的純函式（node 測試直接 import；build.py 去掉 export 併進頁面）。
// 規格：P2 SPEC §5.3（事件、seq 去重）、§7（佇列、接續）、§1 第 4 項（今日任務）、§15 前台約定。
// 這支只算、不碰網路與 localStorage（那些在 api.js）。

/** 一包最多幾筆事件（代理上限 200） */
export const PUSH_MAX = 200;

/**
 * 佇列裡的一筆＝{b:題本, s:seq, e:事件}；seq 每個「座號×題本」各自從 1 連號（代理依題本格記每台載具的最大 seq）。
 * 取某一本最前面一段連號的事件，回 {seq0, ev, last}；沒有回 null。
 */
export function takeBatch(queue, book, max = PUSH_MAX) {
  const mine = queue.filter((x) => x.b === book).sort((a, b) => a.s - b.s);
  if (!mine.length) return null;
  const ev = [mine[0].e];
  for (let i = 1; i < mine.length && ev.length < max; i++) {
    if (mine[i].s !== mine[0].s + i) break; // 斷號就先送前面這段
    ev.push(mine[i].e);
  }
  return { seq0: mine[0].s, ev, last: mine[0].s + ev.length - 1 };
}

/** 代理收到後，把這本 seq ≤ last 的事件從佇列拿掉 */
export const dropUpTo = (queue, book, last) => queue.filter((x) => !(x.b === book && x.s <= last));

/** 佇列裡有哪些題本要送（依最早那筆的 seq 先後無意義，照出現順序） */
export const booksIn = (queue) => [...new Set(queue.map((x) => x.b))];

/** 重試等待：2、4、8…最多 60 秒（n＝第幾次失敗，從 1 起） */
export const backoff = (n) => Math.min(60, 2 ** Math.max(1, n)) * 1000;

// ── 接續（mid）──────────────────────────────────────────────
// mid＝{k:關, i:目前第幾項, res:7 字, q:[主題,備題,…], t:毫秒}
// res 一格一字：g 金燈、s 銀燈、x 熄燈（已定案）、w 第一次答錯在等再挑戰、. 還沒答
const LIGHT = { gold: "g", silver: "s", dark: "x" };

/**
 * 由闖關狀態算 mid。plan＝planRound 的結果；res＝7 格燈色（''／gold／silver／dark）；
 * pend＝第一次答錯、還在等再挑戰的格子編號（1–7）
 */
export function midOf(key, plan, n, res, pend = [], now = Date.now()) {
  const s = res.map((r, i) => (pend.includes(i + 1) ? "w" : LIGHT[r] || ".")).join("");
  return { k: key, i: n, res: s, q: plan.flatMap((it) => [it.q.id, it.alt ? it.alt.id : ""]), t: now };
}

/**
 * 把 mid 還原成可以接著玩的回合；題目對不上（題本改版）回 null＝從頭開始。
 * 回 {plan, n, res, pend}：n＝第一個還沒定案的項目；pend＝那一項裡等再挑戰的格子
 */
export function resumeOf(mid, questions, level) {
  if (!mid || !Array.isArray(mid.q) || typeof mid.res !== "string" || mid.res.length !== 7) return null;
  const byId = new Map(questions.filter((q) => q.level === level).map((q) => [q.id, q]));
  const plan = [];
  for (let i = 0; i < mid.q.length; i += 2) {
    const q = byId.get(mid.q[i]);
    if (!q) return null;
    const span = Math.max(1, Number(q.span) || 1);
    plan.push({ slots: Array.from({ length: span }, (_, k) => q.slot + k), q, alt: byId.get(mid.q[i + 1]) || null });
  }
  const slots = plan.flatMap((x) => x.slots);
  if (slots.join() !== "1,2,3,4,5,6,7") return null;
  const ch = [...mid.res];
  let n = plan.findIndex((it) => it.slots.some((s) => ".w".includes(ch[s - 1])));
  if (n < 0) n = plan.length; // 7 格都定案了、只差按「看結果」→ 接續後直接結算
  const res = ch.map((c) => ({ g: "gold", s: "silver", x: "dark" })[c] || "");
  const pend = n < plan.length ? plan[n].slots.filter((s) => ch[s - 1] === "w") : [];
  return { plan, n, res, pend };
}

/** 接續提示的「第 N 題」＝第一個還沒定案的格子 */
export function midSlot(mid) {
  if (!mid || typeof mid.res !== "string") return 0;
  const i = [...mid.res].findIndex((c) => c === "." || c === "w");
  return i < 0 ? 0 : i + 1;
}

// ── 今日任務（§1 第 4 項：複習＋前進＋自選；一回合只算一件）─────────
/** 這一本「目前進度的下一個還沒過的關」：依結構順序第一個最高星等 0 的關 */
export function nextLevelKey(keys, lv) {
  return keys.find((k) => !((lv[k] || [0])[0] >= 1)) ?? null;
}

/**
 * 一回合結束時算任務來源（送給代理的 "e" 事件第 3 格）：
 *   n＝打的正好是下一關；r＝今天沒有到期的卡、而打的是一關還沒 3 星（已過關）的；f＝其他任一回合
 * done＝今天已完成的來源；before＝這一關打之前的最高星等；hasDue＝今天有沒有該複習的卡
 */
export function taskSrc(done, { isNext, before, hasDue }) {
  const left = (x) => !done.includes(x);
  if (done.length >= 3) return "";
  if (isNext && left("n")) return "n";
  if (left("r") && !hasDue && before >= 1 && before < 3) return "r";
  if (left("f")) return "f";
  return "";
}

/** 排行榜的「再 N 顆星」說法 */
export function catchUpText(metric, n) {
  if (n == null) return "";
  if (n <= 0) return "和前一名同分！";
  return metric === "progress" ? `再完成 ${n} 關就追平前一名` : `再 ${n} 顆星就追平前一名`;
}
