# 自學星圖（study-orbit）

學生自學闖關的前台。純靜態、零相依、`noindex`；GitHub Pages：`https://flyshan2010.github.io/study-orbit/`。

- **題本**：從班網讀 `../class-website/data/study-orbit/`（班網同步產生，公開、無學生資料）。本站只讀。
- **規則**：`src/rules.mjs` 由 `build.py` 從班網正本 `class-website/scripts/classos/study-orbit/rules.mjs` 複製，**勿手改**。
- **建置**：`python3 build.py` → `index.html`；測試：`node --test test/*.test.mjs`。
- **目前階段**：P2 第 3 步＝本機模式（試玩，不上傳）。登入、上傳、排行榜在第 4 步接代理。
- 規格正本：`班級事務/ClassOS_v3.5_藍圖/SPEC_自學星圖_P2前台與線上紀錄.md`（不在本 repo）。

| 檔案 | 內容 |
|---|---|
| `src/shell.html`、`src/style.css` | 頁面骨架與樣式（範本 10 定案版） |
| `src/data.js` | 讀題本檔、排出地圖資料 |
| `src/map.js` | 3D 地圖（WebGL）＋平面地圖退路（範本 6／9） |
| `src/play.mjs` | 出題與判題（純函式，有測試） |
| `src/game.js` | 闖關畫面、秘笈卡、故事卡、複習卡冊 |
| `src/app.js` | 存檔、作答事件、側欄 |
| `src/music.js` | 各區背景音樂與音效（程式合成，無音檔） |
| `src/boot.js` | 開機 |
