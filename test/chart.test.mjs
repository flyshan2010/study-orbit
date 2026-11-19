// 圖表畫圖（src/chart.mjs）：P1 SPEC §3.6.1 的範例都要畫得出來，壞資料回傳 ''
import test from 'node:test';
import assert from 'node:assert/strict';
import { drawChart } from '../src/chart.mjs';

const EX = [
  { k: 'bar', title: '四年甲班最喜歡的運動', unit: '人', cat: '運動', labels: ['籃球', '躲避球', '跑步', '游泳'], series: [{ name: '', vals: [8, 12, 4, 6] }], max: 12, step: 2 },
  { k: 'bar', title: '模範生選舉得票數', unit: '票', labels: ['甲', '乙', '丙', '丁', '戊'], series: [{ name: '', vals: [520, 610, 580, 640, 550] }], min: 500, max: 650, step: 10, lab: 5 },
  { k: 'bar', title: '各社團男女生人數', unit: '人', cat: '社團', labels: ['桌球', '合唱', '圍棋'], series: [{ name: '男生', vals: [9, 3, 7] }, { name: '女生', vals: [5, 10, 4] }], max: 16, step: 2, dir: 'h', stack: true },
  { k: 'line', title: '某日 8 時到 16 時的氣溫', unit: '°C', cat: '時', labels: ['8', '10', '12', '14', '16'], series: [{ name: '', vals: [14, 17, 20, 19, 15] }], min: 10, max: 22, step: 2 },
  { k: 'table', title: '位值表', head: ['萬位', '千位', '百位', '十位', '個位'], rows: [[5, 0, 3, 0, 6]] },
];
const count = (s, re) => (s.match(re) || []).length;

test('五個範例都畫得出來，標題寫在圖下方', () => {
  for (const d of EX) {
    const h = drawChart(d);
    assert.ok(h.startsWith('<figure class="chart">'), d.title);
    assert.ok(h.includes(`<figcaption>${d.title}</figcaption></figure>`), d.title);
  }
});

test('長條數＝數值個數；堆疊每組一段', () => {
  assert.equal(count(drawChart(EX[0]), /<rect /g), 4);
  assert.equal(count(drawChart(EX[2]), /<rect x="[\d.]+" y="[\d.]+" width="[\d.]+" height="[\d.]+" fill/g), 6 + 2 /* 圖例兩格；花紋底沒有 x、y 不算 */);
});

test('長條上不標數字（要看刻度讀）', () => {
  const h = drawChart(EX[0]);
  const texts = [...h.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
  assert.deepEqual(texts.filter((t) => /^\d+$/.test(t)), ['0', '2', '4', '6', '8', '10', '12']);   // 只有刻度
});

test('省略符號：min>0 時畫波浪並標原點 0；大格每 5 格標一次', () => {
  const h = drawChart(EX[1]);
  assert.ok(h.includes('stroke="#fff8e6" stroke-width="6"'));
  const nums = [...h.matchAll(/<text[^>]*>(\d+)<\/text>/g)].map((m) => m[1]);
  assert.deepEqual(nums, ['500', '550', '600', '650', '0']);
  assert.ok(!drawChart(EX[0]).includes('stroke-width="6"'));
});

test('null＝還沒畫：長條少一條、折線斷開', () => {
  const bar = structuredClone(EX[0]); bar.series[0].vals[2] = null;
  assert.equal(count(drawChart(bar), /<rect /g), 3);
  assert.ok(drawChart(bar).includes('跑步 未畫'));
  const line = structuredClone(EX[3]); line.series[0].vals[2] = null;
  const d = drawChart(line).match(/<path d="(M[^"]+)" fill="none" stroke="#1F5FA8"/)[1];
  assert.equal(count(d, /M/g), 2);
});

test('多組資料有圖例、點的形狀不同', () => {
  const d = { k: 'line', title: '三地數量', unit: '隻', labels: ['105', '106', '107'], series: [{ name: '甲地', vals: [10, 20, 15] }, { name: '乙地', vals: [5, 8, 12] }, { name: '丙地', vals: [18, 9, 14] }], max: 20, step: 5 };
  const h = drawChart(d);
  for (const n of ['甲地', '乙地', '丙地']) assert.ok(h.includes(`>${n}</text>`));
  assert.equal(count(h, /<circle /g), 4);   // 甲地 3 點＋圖例 1
});

test('aria-label 寫出全部數據', () => {
  assert.ok(drawChart(EX[0]).includes('aria-label="四年甲班最喜歡的運動，長條圖，單位人。籃球 8、躲避球 12、跑步 4、游泳 6"'));
});

test('跳脫特殊字元；壞資料回傳空字串', () => {
  assert.ok(drawChart({ ...EX[0], title: '<b>' }).includes('&lt;b&gt;'));
  for (const bad of [null, {}, { k: 'pie' }, { ...EX[0], step: 0 }, { ...EX[0], max: 0 }, { ...EX[0], labels: undefined }, { k: 'table', rows: [] }])
    assert.equal(drawChart(bad), '');
});
