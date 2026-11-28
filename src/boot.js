/* ---------- 開機：讀題本檔 → 排地圖 → 畫 ---------- */
(()=>{const b=document.createElement('button');b.id='sndmap';b.setAttribute('aria-label','音效開關');b.style.cssText='position:fixed;right:16px;bottom:16px;z-index:40;font:inherit;font-size:16px;font-weight:700;padding:10px 16px;border-radius:999px;border:2px solid #ffffff55;background:#0b1030cc;color:#fff;cursor:pointer';
  b.textContent=G8.snd?'🔊 音效：開':'🔇 音效：關';b.onclick=()=>G8.setSnd(!G8.snd);document.body.append(b);addEventListener('pointerdown',()=>{if(G8.snd)G8.unlock()},{once:true})})();
let BOOTED=false;
async function boot(again){const msg=$('#loading');
  try{if(!again){await Promise.all([loadIndex(),loadExams()]);await Promise.all(DATA.index.books.map(b=>loadBook(b.code)));await API.init();APP.restore()}
    R=buildRegions();applyProgress(R,APP.save);
    if(!R.length){msg.textContent='目前還沒有開放的題本，請等老師準備好。';msg.hidden=false;return}
    msg.hidden=true;
    if(again&&M3){location.reload();return} /* 換題本＝地圖要重排，重新載入最單純（試玩進度存在分頁裡，不會掉） */
    $('#lg').hidden=!R.some(r=>r.units.some(u=>u.ex));
    if(makeM3()){const g0=go;go=function(v){g0(v);M3.cam3(v)}}
    seasonTag();BOOTED=true;go(view);API.start()}
  catch(e){console.error(e);msg.hidden=false;msg.innerHTML='題本讀不到，請檢查網路後<button class="btn" onclick="location.reload()">重新整理</button>'}}
boot();
