// node --test test/  （出題、判題、卡冊；用班網真題本檔跑，讀不到就跳過那幾項）
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { planRound, parsePairs, pairsStr, judgeChoice, judgeMatch, cardsFor, cardQuestion, deckOf, cardAfter } from "../src/play.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(here, "../../class-website/data/study-orbit");
const has = fs.existsSync(path.join(DATA, "index.json"));
const load = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8"));

test("每一關都排得出剛好 7 格、每格一題、另一題留給再挑戰", { skip: !has }, () => {
  const idx = load("index.json");
  let n = 0;
  for (const b of idx.books) {
    const qs = load(b.code + ".json").questions;
    for (const isl of b.structure.islands) for (const lv of isl.levels) {
      for (let k = 0; k < 20; k++) {
        const items = planRound(qs, lv.code);
        const slots = items.flatMap((x) => x.slots);
        assert.deepEqual(slots, [1, 2, 3, 4, 5, 6, 7], lv.code);
        for (const it of items) {
          assert.ok(it.alt, `${lv.code} 第 ${it.slots[0]} 格沒有第二題`);
          assert.notEqual(it.alt.id, it.q.id);
          assert.equal(it.alt.type, it.q.type);
        }
      }
      n++;
    }
  }
  assert.ok(n >= 7, `只檢查到 ${n} 關`); // 試點 7 關起跳；題本續產後關數會增加（2026-11-20 已 12 關），不寫死
});

test("閱讀題組：同一回合整組同一篇", { skip: !has }, () => {
  const qs = load("c-h-4a.json").questions;
  const seen = new Set();
  for (let k = 0; k < 40; k++) {
    const g = new Set(planRound(qs, "c-h-4a-1-2").map((x) => x.q.group).filter(Boolean));
    assert.equal(g.size, 1);
    seen.add([...g][0]);
  }
  assert.equal(seen.size, 2); // 兩組都抽得到
});

test("固定亂數：兩題輪流抽得到", () => {
  const qs = [{ id: "A1", level: "x", slot: 1 }, { id: "A2", level: "x", slot: 1, mother: "A1" }];
  assert.equal(planRound(qs, "x", () => 0)[0].q.id, "A1");
  assert.equal(planRound(qs, "x", () => 0.9)[0].q.id, "A2");
  assert.equal(planRound(qs, "x", () => 0.9)[0].alt.id, "A1");
});

test("配合題逐對判、配錯發卡最多兩張", () => {
  const q = { type: "配合", left: ["a", "b", "c", "d"], answer: "1B,2D,3A,4C", ob: { 1: "X-B1", 2: "X-B2", 3: "X-B2", 4: "X-B3" } };
  assert.deepEqual(parsePairs("1b, 2D,3A,4C"), { 1: "B", 2: "D", 3: "A", 4: "C" });
  assert.equal(pairsStr({ 2: "D", 1: "B" }), "1B,2D");
  assert.deepEqual(judgeMatch(q, { 1: "B", 2: "D", 3: "C", 4: "A" }), [true, true, false, false]);
  assert.deepEqual(cardsFor(q, { 1: "A", 2: "A", 3: "B", 4: "D" }), ["X-B1", "X-B2"]);
  assert.deepEqual(cardsFor(q, { 1: "B", 2: "D", 3: "A", 4: "C" }), []);
});

test("選擇題判對錯與發卡", () => {
  const q = { type: "選擇", answer: "C", ob: { A: "X-B1", B: "X-B1" } };
  assert.ok(judgeChoice(q, "c"));
  assert.ok(!judgeChoice(q, "A"));
  assert.deepEqual(cardsFor(q, "A"), ["X-B1"]);
  assert.deepEqual(cardsFor(q, "D"), []); // 沒掛盲點的錯誤選項：不發卡
});

test("卡冊：抽得到掛這個盲點的題、到期判斷、改卡", () => {
  const qs = [{ id: "1", type: "配合", ob: { 1: "B9" } }, { id: "2", type: "選擇", ob: { A: "B9" } }, { id: "3", type: "選擇", ob: { A: "B8" } }];
  assert.equal(cardQuestion(qs, "B9").id, "2");
  assert.equal(cardQuestion(qs, "B7"), null);
  const m = { cd: { "1-1-B1": ["t", "2026-11-17"], "1-1-B2": ["d", "2026-11-10"], "1-1-B3": ["d", "2026-11-15"] }, ok: ["1-1-B4"] };
  assert.deepEqual(deckOf(m, "2026-11-17"), { todo: ["1-1-B1"], due: ["1-1-B2"], wait: ["1-1-B3"], ok: 1 });
  assert.deepEqual(cardAfter(["t", "2026-11-10"], true, "2026-11-17"), ["d", "2026-11-17"]);
  assert.equal(cardAfter(["d", "2026-11-10"], true, "2026-11-17"), "o");
  assert.deepEqual(cardAfter(["d", "2026-11-15"], true, "2026-11-17"), ["d", "2026-11-15"]);
  assert.deepEqual(cardAfter(["d", "2026-11-10"], false, "2026-11-17"), ["t", "2026-11-17"]);
});
