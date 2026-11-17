# study-orbit（自學星圖前台）專屬規則

- 改完 `src/` 一律 `python3 build.py` 再 `node --test test/*.test.mjs`，`index.html` 與 src 一起提交。
- **`src/rules.mjs` 勿手改**：正本在 `../class-website/scripts/classos/study-orbit/rules.mjs`，改正本後跑 build.py（測試會比對）。
- 本站只讀班網 `data/study-orbit/`；**不得放任何座號以外的學生資料**，畫面只顯示座號。
- 預覽：拷到 scratchpad 模擬 Pages 目錄（`/study-orbit/` 與 `/class-website/data/` 並列）再起伺服器；量 RWD 用無頭 Chromium（預覽窗格在背景時量測不算數）。
- 規格與施作紀錄：`../ClassOS_v3.5_藍圖/SPEC_自學星圖_P2前台與線上紀錄.md` §13、§15。
