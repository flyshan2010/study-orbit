// 前台的 rules.mjs 必須和班網正本一字不差（P2 SPEC §8：改規則只改正本，再跑 build.py）
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const MASTER = path.join(here, "../../class-website/scripts/classos/study-orbit/rules.mjs");
test("src/rules.mjs ＝ 班網正本（去掉檔頭一行）", { skip: !fs.existsSync(MASTER) }, () => {
  const copy = fs.readFileSync(path.join(here, "../src/rules.mjs"), "utf8").split("\n");
  assert.match(copy[0], /自動複製，勿手改/);
  assert.equal(copy.slice(1).join("\n"), fs.readFileSync(MASTER, "utf8"));
});
test("index.html 已用最新 src 建置（含 noindex）", () => {
  const html = fs.readFileSync(path.join(here, "../index.html"), "utf8");
  assert.match(html, /<meta name="robots" content="noindex/);
  for (const f of ["play.mjs", "data.js", "map.js", "game.js", "app.js", "music.js", "boot.js"]) assert.ok(html.includes(`/* ===== ${f} ===== */`), f);
});
