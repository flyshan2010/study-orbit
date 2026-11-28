// node --test test/  （接代理的純函式：佇列分包、接續 mid、今日任務）
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { takeBatch, dropUpTo, booksIn, backoff, midOf, resumeOf, midSlot, nextLevelKey, taskSrc, catchUpText } from "../src/sync.mjs";
import { planRound } from "../src/play.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(here, "../../class-website/data/study-orbit");
const has = fs.existsSync(path.join(DATA, "index.json"));
const load = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8"));

test("佇列分包：每本各自連號、斷號先送前段、上限 200、送完只清到 last", () => {
  const q = [{ b: "x", s: 1, e: 1 }, { b: "y", s: 1, e: 9 }, { b: "x", s: 2, e: 2 }, { b: "x", s: 4, e: 4 }];
  assert.deepEqual(takeBatch(q, "x"), { seq0: 1, ev: [1, 2], last: 2 });
  assert.deepEqual(booksIn(q), ["x", "y"]);
  const left = dropUpTo(q, "x", 2);
  assert.deepEqual(left.map((x) => x.b + x.s), ["y1", "x4"]);
  assert.equal(takeBatch(left, "x").seq0, 4);
  assert.equal(takeBatch([], "x"), null);
  const big = Array.from({ length: 450 }, (_, i) => ({ b: "x", s: i + 1, e: i }));
  const b1 = takeBatch(big, "x");
  assert.equal(b1.ev.length, 200);
  assert.equal(takeBatch(dropUpTo(big, "x", b1.last), "x").seq0, 201);
});

test("重試等待 2、4、8…最多 60 秒", () => {
  assert.deepEqual([1, 2, 3, 5, 6, 9].map(backoff), [2000, 4000, 8000, 32000, 60000, 60000]);
});

test("接續 mid：答到第 4 題 → 換載具還原同一組題目、燈色，從第 4 題接著答", { skip: !has }, () => {
  for (const b of load("index.json").books) {
    const qs = load(b.code + ".json").questions;
    for (const isl of b.structure.islands) for (const lv of isl.levels) {
      const plan = planRound(qs, lv.code);
      // 前 k 項答完（金、銀、熄輪流），從第 k 項接著答（配合題一項占好幾格，所以用「項」不用「格」）
      const k = Math.min(3, plan.length - 1), res = Array(7).fill(""), L = ["gold", "silver", "dark"];
      for (let i = 0; i < k; i++) plan[i].slots.forEach((s) => (res[s - 1] = L[i % 3]));
      const mid = midOf("k", plan, k, res, [], 123);
      assert.equal(mid.q.length, plan.length * 2);
      assert.ok(mid.q.length <= 14, "代理只收 14 個題目 ID");
      assert.equal(mid.res.length, 7);
      const r = resumeOf(JSON.parse(JSON.stringify(mid)), qs, lv.code);
      assert.ok(r, lv.code);
      assert.deepEqual(r.plan.map((x) => x.q.id), plan.map((x) => x.q.id));
      assert.deepEqual(r.plan.map((x) => x.alt && x.alt.id), plan.map((x) => x.alt && x.alt.id));
      assert.deepEqual(r.res, res);
      assert.equal(r.n, k, lv.code);
      assert.equal(midSlot(mid), plan[k].slots[0]);
      assert.deepEqual(r.pend, []);
    }
  }
});

test("接續 mid：第一次答錯在等再挑戰（w）→ 接續直接進再挑戰；配合題只留配錯的對", { skip: !has }, () => {
  const qs = load("c-h-4a.json").questions;
  const lvl = [...new Set(qs.filter((q) => q.type === "配合").map((q) => q.level))][0];
  if (!lvl) return;
  const plan = planRound(qs, lvl);
  const mi = plan.findIndex((x) => x.slots.length > 1);
  const res = Array(7).fill("");
  for (let i = 0; i < mi; i++) plan[i].slots.forEach((s) => (res[s - 1] = "gold"));
  const ms = plan[mi].slots;
  res[ms[0] - 1] = "gold"; // 第一對配對了
  const mid = midOf("k", plan, mi, res, ms.slice(1));
  const r = resumeOf(mid, qs, lvl);
  assert.equal(r.n, mi);
  assert.deepEqual(r.pend, ms.slice(1));
  // 7 格都定案：接續＝直接看結果
  const done = midOf("k", plan, plan.length, Array(7).fill("gold"), []);
  assert.equal(resumeOf(done, qs, lvl).n, plan.length);
  assert.equal(midSlot(done), 0);
});

test("接續 mid：題目對不上（題本改版）或格式壞掉 → null，從頭開始", () => {
  assert.equal(resumeOf(null, [], "x"), null);
  assert.equal(resumeOf({ q: ["NOPE", ""], res: "......." }, [], "x"), null);
  assert.equal(resumeOf({ q: [], res: "..." }, [], "x"), null);
});

test("今日任務：下一關＝前進；沒卡要複習時重玩沒到 3 星＝複習；其他＝自選；做滿 3 件不再算", () => {
  const lv = { "1-1": [3, 1, 1], "1-2": [2, 0, 1] };
  assert.equal(nextLevelKey(["1-1", "1-2", "1-3"], lv), "1-3");
  assert.equal(nextLevelKey(["1-1"], lv), null);
  assert.equal(taskSrc([], { isNext: true, before: 0, hasDue: false }), "n");
  assert.equal(taskSrc(["n"], { isNext: true, before: 0, hasDue: false }), "f");
  assert.equal(taskSrc([], { isNext: false, before: 2, hasDue: false }), "r");
  assert.equal(taskSrc([], { isNext: false, before: 2, hasDue: true }), "f"); // 有卡要複習 → 重玩不算複習
  assert.equal(taskSrc([], { isNext: false, before: 3, hasDue: false }), "f");
  assert.equal(taskSrc(["r", "n", "f"], { isNext: true, before: 0, hasDue: false }), "");
  assert.equal(taskSrc(["f", "r"], { isNext: false, before: 1, hasDue: false }), "");
});

test("排行榜追趕說法", () => {
  assert.equal(catchUpText("stars", 3), "再 3 顆星就追平前一名");
  assert.equal(catchUpText("progress", 2), "再完成 2 關就追平前一名");
  assert.equal(catchUpText("weekly", null), "");
});

test("P3 §3.1 虛擬島心接續：題目來自本島各關、依出題順序排第 1～7 格", () => {
  const qs = [1, 2, 3, 4, 5, 6, 7].flatMap((i) => [{ id: "A" + i, level: "b-1-" + (i % 3 + 1), slot: i, span: 1 }, { id: "B" + i, level: "b-1-" + (i % 3 + 1), slot: i, span: 1 }]);
  const mid = { k: "1-0", i: 2, res: "gg.....", q: qs.filter((q) => q.id[0] === "A").flatMap((q) => [q.id, "B" + q.id.slice(1)]), t: 1 };
  const r = resumeOf(mid, qs, "b-1-0", ["b-1-1", "b-1-2", "b-1-3"]);
  assert.equal(r.plan.length, 7);
  assert.deepEqual(r.plan.map((x) => x.slots[0]), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(r.n, 2);
  assert.equal(resumeOf(mid, qs, "b-1-0", ["b-1-1"]), null, "題目不在本島＝從頭開始");
});
