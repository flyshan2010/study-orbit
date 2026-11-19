/* 自學星圖・圖表素材畫圖（格式正本：ClassOS_v3.5_藍圖/SPEC_自學星圖_P1資料模型.md §3.6.1）
   table／bar／line 的 JSON → HTML（圖用 SVG 由程式畫，不用圖片檔，離線可用）。
   這裡只負責「畫」；格式對不對由班網 check.mjs 第 15 條擋。畫不出來就回傳 ''，呼叫端改顯示原文。 */
const E = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const COL = ['#1F5FA8', '#7A3D9A', '#2E7D5B'];      // 教學 DS 數學科 accent、accent-2，第三組用森綠
const INK = '#3a2a10', SUB = '#5a4a30', MAJ = '#d4c08e', MIN = '#ece0bf', BG = '#fff8e6';
const W = 360, F = 15;                              // viewBox 寬 360：手機寬 375px（圖約 320px）時字約 13px
const fmt = (v) => String(Math.round(v * 10) / 10);
const tw = (s, f = F) => [...String(s)].reduce((a, c) => a + (/[\x20-\x7e]/.test(c) ? 0.58 : 1), 0) * f;   // 估字寬
let seq = 0;

export function drawChart(d) {
  if (!d || typeof d !== 'object') return '';
  try {
    if (d.k === 'table') return table(d);
    if (d.k === 'bar' || d.k === 'line') return plot(d);
  } catch (e) { /* 畫不出來就交給呼叫端 */ }
  return '';
}

function table(d) {
  if (!Array.isArray(d.rows) || !d.rows.length) return '';
  const head = Array.isArray(d.head) ? `<tr>${d.head.map((h) => `<th scope="col">${E(h)}</th>`).join('')}</tr>` : '';
  const rows = d.rows.map((r) => `<tr>${r.map((c) => `<td>${E(c)}</td>`).join('')}</tr>`).join('');
  return `<figure class="chart"><table>${head}${rows}</table><figcaption>${E(d.title || '')}</figcaption></figure>`;
}

/* 波浪（省略符號）：沿著 a→b 畫，horiz＝橫向畫（直式圖的省略帶） */
function wave(a, b, at, horiz) {
  let p = '', s = 1;
  for (let t = a; t < b; t += 6, s = -s) {
    const m = Math.min(t + 3, b), e = Math.min(t + 6, b);
    p += horiz ? `${t === a ? `M${a} ${at}` : ''} Q${m} ${at + 4 * s} ${e} ${at}` : `${t === a ? `M${at} ${a}` : ''} Q${at + 4 * s} ${m} ${at} ${e}`;
  }
  return p;
}

function plot(d) {
  const L = d.labels, S = d.series, n = L.length, k = S.length, isBar = d.k === 'bar';
  const min = d.min || 0, max = d.max, step = d.step, lab = d.lab || 1;
  const hz = isBar && d.dir === 'h', stack = isBar && !!d.stack && k > 1, brk = min > 0;
  const ticks = Math.round((max - min) / step);
  if (!(n >= 1 && k >= 1 && step > 0 && max > min && ticks >= 1 && ticks <= 40)) return '';
  const id = 'ch' + (++seq), G = brk ? 28 : 0;     // 省略帶高度：原點 0 和 min 的數字才不會擠在一起
  const unit = `（${d.unit || ''}）`, cat = d.cat ? `（${d.cat}）` : '';
  const tl = []; for (let i = 0; i <= ticks; i++) if (i % lab === 0 || i === ticks) tl.push(i);
  const valW = Math.max(...tl.map((i) => tw(fmt(min + i * step), F - 1)), tw('0', F - 1));
  const lgH = k > 1 ? 26 : 0;

  // 版面：數量軸 P(v)、類別帶中心 C(i)
  let x0, x1, y0, y1, H, P, C, band, lf = F;
  if (!hz) {
    const mr = cat ? tw(cat, F - 1) + 10 : 10;
    x0 = valW + 14; x1 = W - mr; band = (x1 - x0) / n;
    const lw = Math.max(...L.map((l) => tw(l)));
    if (lw > band - 4) lf = Math.max(11, Math.floor(F * (band - 4) / lw));
    y1 = lgH + 28; H = y1 + 196 + 30; y0 = H - 30;
    P = (v) => y0 - G - (v - min) / (max - min) * (y0 - G - y1);
    C = (i) => x0 + band * (i + 0.5);
  } else {
    x0 = Math.max(Math.max(...L.map((l) => tw(l))) + 16, cat ? tw(cat, F - 1) + 12 : 0); x1 = W - tw(unit, F - 1) - 10;
    y1 = lgH + (cat ? 26 : 12);
    const each = stack ? 34 : Math.max(34, k * 16 + 12);
    band = each; y0 = y1 + n * each; H = y0 + 28;
    P = (v) => x0 + G + (v - min) / (max - min) * (x1 - x0 - G);
    C = (i) => y1 + band * (i + 0.5);
  }
  const B = hz ? x0 : y0;            // 原點（0）的位置
  let s = '';

  // 花紋（第 2、3 組長條）：色弱也分得出
  let defs = '';
  if (isBar && k > 1) {
    defs += `<pattern id="${id}p1" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#fff"/><rect width="3.2" height="6" fill="${COL[1]}"/></pattern>`;
    defs += `<pattern id="${id}p2" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#fff"/><circle cx="3" cy="3" r="1.9" fill="${COL[2]}"/></pattern>`;
  }
  const fillOf = (j) => (j === 0 || !isBar || k === 1 ? COL[j] : `url(#${id}p${j})`);

  // 格線與刻度數字
  for (let i = 0; i <= ticks; i++) {
    const p = P(min + i * step), major = tl.includes(i);
    s += hz ? `<line x1="${p}" y1="${y1}" x2="${p}" y2="${y0}" stroke="${major ? MAJ : MIN}"/>`
            : `<line x1="${x0}" y1="${p}" x2="${x1}" y2="${p}" stroke="${major ? MAJ : MIN}"/>`;
    if (major) s += hz ? `<text x="${p}" y="${y0 + 19}" text-anchor="middle" font-size="${F - 1}" fill="${SUB}">${fmt(min + i * step)}</text>`
                       : `<text x="${x0 - 7}" y="${p + 5}" text-anchor="end" font-size="${F - 1}" fill="${SUB}">${fmt(min + i * step)}</text>`;
  }
  if (brk) s += hz ? `<text x="${x0}" y="${y0 + 19}" text-anchor="middle" font-size="${F - 1}" fill="${SUB}">0</text>`
                   : `<text x="${x0 - 7}" y="${y0 + 5}" text-anchor="end" font-size="${F - 1}" fill="${SUB}">0</text>`;

  // 資料
  const thick = isBar ? (stack ? band * 0.56 : Math.min(band * 0.72 / k, hz ? 22 : 40)) : 0;
  const rect = (c, w, a, b, fill, col) => {          // 類別中心 c、粗 w、數量軸從 a 到 b（像素）
    const lo = Math.min(a, b), len = Math.abs(b - a);
    return hz ? `<rect x="${lo}" y="${c - w / 2}" width="${len}" height="${w}" fill="${fill}" stroke="${col}" stroke-width="1.2"/>`
              : `<rect x="${c - w / 2}" y="${lo}" width="${w}" height="${len}" fill="${fill}" stroke="${col}" stroke-width="1.2"/>`;
  };
  if (isBar) {
    L.forEach((_, i) => {
      if (stack) {
        let acc = 0, from = B;
        S.forEach((se, j) => { const v = se.vals[i]; if (v == null) return; acc += v; const to = P(acc); s += rect(C(i), thick, from, to, fillOf(j), COL[j]); from = to; });
      } else {
        S.forEach((se, j) => { const v = se.vals[i]; if (v == null) return; const c = C(i) + (j - (k - 1) / 2) * thick; s += rect(c, thick, B, P(v), fillOf(j), COL[j]); });
      }
    });
  } else {
    S.forEach((se, j) => {
      let seg = '', pen = false;                      // null＝這一點還沒描，線在這裡斷開
      se.vals.forEach((v, i) => { if (v == null) { pen = false; return; } seg += `${pen ? 'L' : 'M'}${C(i)} ${P(v)} `; pen = true; });
      s += `<path d="${seg.trim()}" fill="none" stroke="${COL[j]}" stroke-width="2.4" stroke-linejoin="round"/>`;
      se.vals.forEach((v, i) => { if (v != null) s += marker(j, C(i), P(v)); });
    });
  }

  // 軸、省略符號、類別名稱、單位
  s += hz ? `<line x1="${x0}" y1="${y0}" x2="${x1 + 4}" y2="${y0}" stroke="${INK}" stroke-width="1.5"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1 - 6}" stroke="${INK}" stroke-width="1.5"/>`
          : `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}" stroke="${INK}" stroke-width="1.5"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1 - 8}" stroke="${INK}" stroke-width="1.5"/>`;
  if (brk) {
    const m = B + (hz ? G / 2 : -G / 2);
    const w1 = hz ? wave(y1 - 4, y0 + 6, m, false) : wave(x0 - 8, x1, m, true);
    const w2 = hz ? wave(y1 - 4, y0 + 6, m - 3, false) : wave(x0 - 8, x1, m - 3, true);
    const w3 = hz ? wave(y1 - 4, y0 + 6, m + 3, false) : wave(x0 - 8, x1, m + 3, true);
    s += `<path d="${w1}" fill="none" stroke="${BG}" stroke-width="6"/><path d="${w2}" fill="none" stroke="${INK}" stroke-width="1.2"/><path d="${w3}" fill="none" stroke="${INK}" stroke-width="1.2"/>`;
  }
  L.forEach((l, i) => {
    s += hz ? `<text x="${x0 - 8}" y="${C(i) + 5}" text-anchor="end" font-size="${F}" fill="${INK}">${E(l)}</text>`
            : `<text x="${C(i)}" y="${y0 + 20}" text-anchor="middle" font-size="${lf}" fill="${INK}">${E(l)}</text>`;
  });
  if (hz) {
    s += `<text x="${x1 + 8}" y="${y0 + 5}" font-size="${F - 1}" fill="${SUB}">${E(unit)}</text>`;
    if (cat) s += `<text x="${x0 - 8}" y="${y1 - 10}" text-anchor="end" font-size="${F - 1}" fill="${SUB}">${E(cat)}</text>`;
  } else {
    s += `<text x="${x0 + 6}" y="${y1 - 10}" font-size="${F - 1}" fill="${SUB}">${E(unit)}</text>`;
    if (cat) s += `<text x="${x1 + 5}" y="${y0 + 5}" font-size="${F - 1}" fill="${SUB}">${E(cat)}</text>`;
  }

  // 圖例（兩組以上）
  if (k > 1) {
    let x = x0;
    S.forEach((se, j) => {
      s += isBar ? `<rect x="${x}" y="6" width="16" height="14" fill="${fillOf(j)}" stroke="${COL[j]}" stroke-width="1.2"/>`
                 : `<line x1="${x - 2}" y1="13" x2="${x + 18}" y2="13" stroke="${COL[j]}" stroke-width="2.4"/>${marker(j, x + 8, 13)}`;
      s += `<text x="${x + 22}" y="18" font-size="${F - 1}" fill="${INK}">${E(se.name)}</text>`;
      x += 22 + tw(se.name, F - 1) + 18;
    });
  }

  const say = `${d.title}，${isBar ? (stack ? '堆疊長條圖' : '長條圖') : '折線圖'}，單位${d.unit || ''}。` +
    S.map((se) => (se.name ? se.name + '：' : '') + L.map((l, i) => `${l} ${se.vals[i] == null ? '未畫' : fmt(se.vals[i])}`).join('、')).join('；');
  return `<figure class="chart"><svg viewBox="0 0 ${W} ${Math.round(H)}" role="img" aria-label="${E(say)}">${defs ? `<defs>${defs}</defs>` : ''}${s}</svg><figcaption>${E(d.title || '')}</figcaption></figure>`;
}

/* 折線的點：●▲■ 依組別換形狀 */
function marker(j, x, y) {
  const c = COL[j], st = `fill="${c}" stroke="#fff" stroke-width="1.5"`;
  if (j === 1) return `<path d="M${x} ${y - 6} L${x + 5.5} ${y + 4} L${x - 5.5} ${y + 4}Z" ${st}/>`;
  if (j === 2) return `<rect x="${x - 4.5}" y="${y - 4.5}" width="9" height="9" ${st}/>`;
  return `<circle cx="${x}" cy="${y}" r="4.6" ${st}/>`;
}
