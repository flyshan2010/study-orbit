/* ---------- 百鍊之塔・數學算力階（P3 SPEC §5）：一層 10 題快答 ----------
   出題、判對錯、過層、金階一律呼叫 rules.mjs（towerFloor／towerResult…；代理用同一支重算，U83）。
   不倒數、只顯示用時（正數計時）；用時只和自己的最佳紀錄比、不上排行榜。2 秒銀燈規則不適用：
   改成連續 3 題 1 秒內作答就提醒「看清楚再答」（只提醒、不扣分、不擋）。
   登入後：一層打完送 ["t", 階, 層, 種子, 10 個選項, 用時秒, 快答提醒次數]（排進數學題本的上傳佇列）；試玩只記在這個分頁。 */
const TOWER_ON=true; /* 退路（§9）：false＝塔入口全部關閉，塔紀錄獨立一格、不影響島嶼存檔 */
const fmtSec=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const TWR={
  book(){const r=R.find(x=>x.subj==='數學');return r?r.book:null},
  on(){return TOWER_ON&&!!this.book()},
  key(){return APP.me?'so-tw-'+APP.me.seat:'so-trial-tw'},
  /* 塔紀錄＝本機（還沒上傳完的）＋伺服器回的，合併（最高層取大、各層最佳取小） */
  rec(){let loc=null;try{loc=APP.me?LS.get(this.key()):JSON.parse(sessionStorage.getItem(this.key())||'null')}catch(e){}
    return towerMerge(loc,APP.me&&APP.me.tw&&APP.me.tw.ma)},
  save(rec){if(APP.me){LS.set(this.key(),rec);return}try{sessionStorage.setItem(this.key(),JSON.stringify(rec))}catch(e){}},
  top(){return this.rec()[0]||0},
  /* 皇城建議用：下一個可挑戰的層與最佳紀錄 */
  next(){const rec=this.rec(),n=TOWER_FLOORS.ma.length,f=Math.min(n,(rec[0]||0)+1);return{f,best:rec[f]||0,top:rec[0]||0,n}}};

/* ---------- 側欄：塔的各層 ---------- */
function pTower(){if(!TWR.on()){panel.innerHTML='<h2>🗼 百鍊之塔</h2><p class="mut">百鍊之塔暫時關閉。</p>';return}
  const rec=TWR.rec(),N=TOWER_FLOORS.ma,top=rec[0]||0,li=[];
  for(let f=N.length;f>=1;f--){const done=f<=top,open=towerOpen(rec,f),b=rec[f]||0;
    li.push(`<li><button class="fl${done?' done':open?' open':''}" data-f="${f}"${open?'':' disabled'}><span class="no">${f}</span><span class="nm">${esc(N[f-1])}</span><span class="st">${done?'✅ 最佳 '+fmtSec(b):open?'▶ 挑戰':'🔒'}</span></button></li>`)}
  panel.innerHTML=`<h2>🗼 百鍊之塔</h2><p class="mut">數學・算力階｜最高過到第 <b>${top}</b> 層／${N.length} 層${top>=N.length?'・🏆 登上塔頂！':''}</p>${APP.rec()?'':trialNote}
   <p>一層 10 題，<b>答對 9 題以上</b>就過層、往上一層。<b>不倒數</b>，只記用時；比<b>自己的最佳紀錄</b>更快＝<b style="color:var(--gold)">金階</b>。不上排行榜。</p>
   <ol class="floors">${li.join('')}</ol><p class="mut">國語字詞階、社會常識階之後開放。</p>`;
  panel.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>TW.open(+b.dataset.f));wireLogin()}

/* ---------- 闖塔畫面（全螢幕，和島嶼點燈共用 #g8play） ---------- */
const TW=(()=>{
const $=s=>document.querySelector(s),S=$('#scene');
let F=1,seed=1,QS=[],st=null,lock=false,tick=null;
const name=()=>esc(TOWER_FLOORS.ma[F-1]);
function open(f){F=f;$('#g8play').hidden=false;document.body.style.overflow='hidden';intro()}
function close(){stop();$('#g8play').hidden=true;document.body.style.overflow='';APP.afterPlay();if(APP.rec())API.flush()}
function stop(){if(tick){clearInterval(tick);tick=null}}
function chips(){const b=TWR.rec()[F]||0;return`<div class="chips"><span class="chip">${b?'最佳紀錄 '+fmtSec(b):'第一次挑戰這一層'}</span>${APP.rec()?`<span class="chip">今日任務 ${APP.me.today.done.length}／3</span>`:'<span class="chip trial">試玩中，不會記錄</span>'}</div>`}
function intro(){stop();MUS.lift(F);MUS.zone('tw');
  S.innerHTML=`<div class="intro"><button class="ghost" data-tw="quit">← 回到塔</button><div class="where">皇城・百鍊之塔・數學算力階</div><h2>第 ${F} 層・${name()}</h2>
   <div class="say">10 題快答，<b>答對 9 題</b>就過層！<br>不倒數，看清楚再按；${TWR.rec()[F]?'比最佳紀錄快就是金階。':'第一次過層會記成你的最佳紀錄。'}</div>
   ${chips()}<button class="big" data-tw="go">出發！</button></div>`}
function start(){seed=1+Math.floor(Math.random()*(TOWER_SEED_MAX-1));QS=towerFloor('ma',F,seed);
  st={n:0,pick:[],ms:[],ok:[],warn:0,t0:0,used:0};draw();stop();tick=setInterval(clock,500)}
const used=()=>st.used+(lock?0:Date.now()-st.t0); /* 只算看題到作答的時間，對錯回饋的停頓不算 */
function clock(){const c=$('#twclock');if(c&&st)c.textContent='⏱ '+fmtSec(used()/1000)}
function draw(){const q=QS[st.n];lock=false;st.t0=Date.now();
  S.innerHTML=`<div class="quiz tw"><div class="qh"><button class="back" data-tw="quit">← 回到塔</button>
     <div class="ttl"><span class="gcrumb">百鍊之塔・數學算力階</span><h2>第 ${F} 層・${name()}</h2></div>
     <span class="twclock" id="twclock" aria-label="用時（不倒數）">⏱ ${fmtSec(used()/1000)}</span><button class="snd" data-tw="snd" aria-label="音效開關">${G8.snd?'🔊':'🔇'}</button></div>
   <div class="prog" aria-label="第 ${st.n+1} 題，共 10 題">${QS.map((_,i)=>`<i class="mk ${i<st.n?(st.ok[i]?'gold':'dark'):''}${i===st.n?' cur':''}"></i>`).join('')}<span class="task">第 ${st.n+1}／10 題・答對 ${st.ok.filter(Boolean).length}</span></div>
   <p class="q twq">${esc(q.text)}</p>
   <div class="opts">${q.opts.map((o,i)=>`<button class="gopt" data-o="${i}"><span class="k">${'ABCD'[i]}</span><span>${esc(o)}</span></button>`).join('')}</div>
   <p class="mut twnote">不倒數・用時只和自己的最佳紀錄比</p></div>`}
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;S.appendChild(d);setTimeout(()=>d.remove(),1600)}
function pick(i){if(lock||!st)return;const q=QS[st.n],o=q.opts[i],ok=o===q.ans;st.used+=Date.now()-st.t0;lock=true;
  st.ms.push(Date.now()-st.t0);st.pick.push(o);st.ok.push(ok);
  const bs=S.querySelectorAll('.gopt');bs.forEach(b=>b.disabled=true);bs[i].classList.add(ok?'ok':'no');
  if(!ok)bs[q.opts.indexOf(q.ans)].classList.add('ok');
  G8.sfx(ok?'ok':'no');
  const w=towerFast(st.ms);if(w>st.warn){st.warn=w;toast('👀 看清楚再答')}
  setTimeout(()=>{st.n++;st.n>=QS.length?result():draw()},ok?380:900)}
function result(){stop();const correct=st.ok.filter(Boolean).length,sec=Math.max(1,Math.round(st.used/1000)),rec0=TWR.rec(),r=towerResult(rec0,F,correct,sec);
  TWR.save(r.rec);
  if(APP.rec()){APP.log(TWR.book(),['t','ma',F,seed,st.pick,sec,st.warn]);const d=APP.me.today.done;if(!d.includes('f')&&d.length<3)d.push('f');API.flush()}
  const N=TOWER_FLOORS.ma.length,more=r.pass&&F<N,h=!r.pass?'再試一次就能過層':r.gold?'🥇 金階！打破自己的紀錄':F===N?'🏆 登上塔頂！':'🎉 過層！';
  const msg=!r.pass?`答對 ${correct}／10，再對 ${9-correct} 題就過層。馬上再挑戰，題目會不一樣。`
    :r.gold?`第 ${F} 層最佳紀錄 ${fmtSec(r.best)} → <b>${fmtSec(sec)}</b>`
    :r.first?`第 ${F} 層最佳紀錄 <b>${fmtSec(sec)}</b>，下次比這個快就是金階。`
    :`這次 ${fmtSec(sec)}・最佳 ${fmtSec(r.best)}，再快 ${sec-r.best+1} 秒就是金階。`;
  if(r.pass){G8.sfx('win');G8.confetti()}
  S.innerHTML=`<div class="res"><h2>${h}</h2><p class="twres">${msg}</p>
   <div class="lans" style="flex:none">${st.ok.map(x=>`<div class="lan ${x?'gold':'dark'}"></div>`).join('')}</div>
   <div class="chips"><span class="chip">答對 ${correct}／10</span><span class="chip">⏱ ${fmtSec(sec)}</span>${st.warn?`<span class="chip">👀 答太快提醒 ${st.warn} 次</span>`:''}${APP.rec()?'':'<span class="chip trial">試玩中，不會記錄</span>'}</div>
   <div class="row">${more?`<button class="big" data-tw="up">往上一層 ▶</button>`:''}<button class="${more?'ghost':'big'}" data-tw="go">${r.pass?'再挑戰這一層':'再挑戰（題目不同）'}</button><button class="ghost" data-tw="quit">← 回到塔</button></div></div>`}
S.addEventListener('click',e=>{if($('#g8play').hidden||!S.querySelector('[data-tw]'))return;const b=e.target.closest('[data-tw],[data-o]');if(!b)return;
  if(b.dataset.o!=null)return pick(+b.dataset.o);
  const a=b.dataset.tw;if(a==='snd'){e.stopPropagation();G8.setSnd(!G8.snd);return}if(a==='quit')close();else if(a==='go')start();else if(a==='up'){F++;intro()}});
document.addEventListener('keydown',e=>{if($('#g8play').hidden||!S.querySelector('[data-o]'))return;if(/^[1-4]$/.test(e.key))pick(+e.key-1)});
return{open,close}})();
