/* ---------- 百鍊之塔（P3 SPEC §5、§13）：國語・字詞階／數學・算力階／社會・常識階，一層 10 題快答 ----------
   出題、判對錯、過層、金階、開放一律呼叫 rules.mjs（towerFloor／towerPool／towerFloorBank／towerResult／towerOpen…；代理用同一支，U83）。
   不倒數、只顯示用時（正數計時）；用時只和自己的最佳紀錄比、不上排行榜。2 秒銀燈規則不適用：
   改成連續 3 題 1 秒內作答就提醒「看清楚再答」（只提醒、不扣分、不擋）。
   登入後一層打完送（排進該階題本的上傳佇列）：數學 ["t","ma",層,種子,10 個選項字串,用時秒,快答次數]；
   國社 ["t",階,層,種子,10 個原始字母,用時秒,快答次數,10 個題目 key]（代理 v2.29 靠題號＋原始字母判）。試玩只記在這個分頁。 */
const TOWER_ON=true; /* 退路（§9）：false＝塔入口全部關閉，塔紀錄獨立一格、不影響島嶼存檔 */
const TOWER_STAIRS=['ch','ma','so']; /* 退路（§13.8）：拿掉某階＝藏分頁，存檔不動 */
const fmtSec=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const TWR={
  _pool:{},
  /* 該階用哪一本題本（＝地圖上該科那一本）；題本沒上線＝這一階不顯示 */
  book(st){const r=R.find(x=>x.subj===TOWER_STAIR_SUBJ[st]);return r?r.book:null},
  stairs(){return TOWER_STAIRS.filter(st=>this.book(st))},
  on(){return TOWER_ON&&this.stairs().length>0},
  /* 目前這一階：上次玩的那一階（記在這台載具）；第一次＝數學 */
  cur(){const ss=this.stairs();let c=null;try{c=localStorage.getItem('so-tw-stair')}catch(e){}
    return ss.includes(c)?c:ss.includes('ma')?'ma':ss[0]},
  setCur(st){try{localStorage.setItem('so-tw-stair',st)}catch(e){}},
  meta(st){const code=this.book(st);return(DATA.index.books||[]).find(b=>b.code===code)||null},
  /* 國社題池（同一本題本只建一次）；數學不用題池 */
  pool(st){if(st==='ma')return null;const code=this.book(st),m=this.meta(st);
    if(!code||!DATA.books[code]||!m)return{};
    const k=st+'|'+code;return this._pool[k]||(this._pool[k]=towerPool(st,DATA.books[code],m.structure)||{})},
  floors(st){return st==='ma'?towerFloors('ma'):towerFloors(st,this.pool(st))},
  names(st){const m=this.meta(st);return towerNames(st,m&&m.structure)},
  /* 數學沿用 v2.28 的本機鍵；國社各自一格 */
  key(st){const s=st==='ma'?'':'-'+st;return APP.me?'so-tw'+s+'-'+APP.me.seat:'so-trial-tw'+s},
  /* 塔紀錄＝本機（還沒上傳完的）＋伺服器回的，合併（最高層取大、各層最佳取小） */
  rec(st){st=st||this.cur();let loc=null;try{loc=APP.me?LS.get(this.key(st)):JSON.parse(sessionStorage.getItem(this.key(st))||'null')}catch(e){}
    return towerMerge(loc,APP.me&&APP.me.tw&&APP.me.tw[st])},
  save(st,rec){if(APP.me){LS.set(this.key(st),rec);return}try{sessionStorage.setItem(this.key(st),JSON.stringify(rec))}catch(e){}},
  top(st){return this.rec(st)[0]||0},
  passed(st){const rec=this.rec(st);return this.floors(st).filter(f=>(rec[f]||0)>0).length},
  /* 皇城第二環：三階過層數合計／三階可用層數 */
  sum(){let p=0,n=0;this.stairs().forEach(st=>{p+=this.passed(st);n+=this.floors(st).length});return{p,n}},
  /* 皇城建議用（最近玩的那一階）：下一個可挑戰、還沒過的層；全部過了 f＝0 */
  next(){const st=this.cur(),rec=this.rec(st),fl=this.floors(st),nm=this.names(st);
    const f=fl.find(x=>!(rec[x]>0)&&towerOpen(st,rec,x,fl))||0;
    return{st,f,name:f?nm[f-1]||'':'',best:f?rec[f]||0:0,all:fl.length>0&&!f&&fl.every(x=>rec[x]>0),n:fl.length}}};

/* ---------- 側欄：三階分頁＋各層 ---------- */
function pTower(){if(!TWR.on()){panel.innerHTML='<h2>🗼 百鍊之塔</h2><p class="mut">百鍊之塔暫時關閉。</p>';return}
  const st=TWR.cur(),ss=TWR.stairs(),rec=TWR.rec(st),fl=TWR.floors(st),nm=TWR.names(st),li=[];
  for(let f=nm.length;f>=1;f--){const ok=fl.includes(f),done=(rec[f]||0)>0,open=ok&&towerOpen(st,rec,f,fl),b=rec[f]||0;
    if(!nm[f-1]&&!ok)continue; /* 層號空著（社會小節還沒編號）不列 */
    li.push(`<li><button class="fl${done?' done':open?' open':''}${ok?'':' prep'}" data-f="${f}"${open?'':' disabled'}><span class="no">${f}</span><span class="nm">${esc(nm[f-1]||'')}</span><span class="st">${!ok?'題目準備中':done?'✅ 最佳 '+fmtSec(b):open?'▶ 挑戰':'🔒'}</span></button></li>`)}
  const pass=TWR.passed(st),tabs=ss.length>1?`<div class="twtabs" role="tablist">${ss.map(s=>`<button class="twtab${s===st?' on':''}" role="tab" aria-selected="${s===st}" data-st="${s}">${TOWER_STAIR_TITLE[s]}</button>`).join('')}</div>`:'';
  panel.innerHTML=`<h2>🗼 百鍊之塔</h2>${tabs}<p class="mut">${TOWER_STAIR_TITLE[st]}｜已過 <b>${pass}</b> 層／可挑戰 ${fl.length} 層${nm.length>fl.length?`（共 ${nm.length} 層，其餘題目準備中）`:''}${fl.length&&pass>=fl.length?'・🏆 全部過關！':''}</p>${APP.rec()?'':trialNote}
   <p>一層 10 題，<b>答對 9 題以上</b>就過層、往上一層。<b>不倒數</b>，只記用時；比<b>自己的最佳紀錄</b>更快＝<b style="color:var(--gold)">金階</b>。不上排行榜。</p>
   <ol class="floors">${li.join('')}</ol>`;
  panel.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{TWR.setCur(b.dataset.st);pTower()});
  panel.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>TW.open(+b.dataset.f,st));wireLogin()}

/* ---------- 闖塔畫面（全螢幕，和島嶼點燈共用 #g8play） ---------- */
const TW=(()=>{
const $=s=>document.querySelector(s),S=$('#scene');
let ST='ma',F=1,seed=1,QS=[],st=null,lock=false,tick=null;
const title=()=>TOWER_STAIR_TITLE[ST],name=()=>esc(TWR.names(ST)[F-1]||'');
/* 題目統一成畫面用的形狀：text＝題幹、big＝配合題拆出的左欄項目（放大）、opts＝四個選項文字、ai＝正解位置、val(i)＝要送的值 */
function shape(q){if(ST==='ma')return{text:q.text,big:'',opts:q.opts,ai:q.opts.indexOf(q.ans),val:i=>q.opts[i]};
  const k=q.stem.lastIndexOf('\n'),m=q.key.includes('#')&&k>=0;
  return{text:m?q.stem.slice(0,k):q.stem,big:m?q.stem.slice(k+1):'',opts:q.opts.map(o=>o.text),ai:q.opts.findIndex(o=>o.L===q.ans),val:i=>q.opts[i].L,key:q.key}}
function open(f,s){ST=s||TWR.cur();F=f;TWR.setCur(ST);$('#g8play').hidden=false;document.body.style.overflow='hidden';intro()}
function close(){stop();$('#g8play').hidden=true;document.body.style.overflow='';APP.afterPlay();if(APP.rec())API.flush()}
function stop(){if(tick){clearInterval(tick);tick=null}}
function chips(){const b=TWR.rec(ST)[F]||0;return`<div class="chips"><span class="chip">${b?'最佳紀錄 '+fmtSec(b):'第一次挑戰這一層'}</span>${APP.rec()?`<span class="chip">今日任務 ${APP.me.today.done.length}／3</span>`:'<span class="chip trial">試玩中，不會記錄</span>'}</div>`}
function intro(){stop();MUS.lift(F);MUS.zone('tw');
  S.innerHTML=`<div class="intro"><button class="ghost" data-tw="quit">← 回到塔</button><div class="where">皇城・百鍊之塔・${title()}</div><h2>第 ${F} 層・${name()}</h2>
   <div class="say">10 題快答，<b>答對 9 題</b>就過層！<br>不倒數，看清楚再按；${TWR.rec(ST)[F]?'比最佳紀錄快就是金階。':'第一次過層會記成你的最佳紀錄。'}</div>
   ${chips()}<button class="big" data-tw="go">出發！</button></div>`}
function start(){seed=1+Math.floor(Math.random()*(TOWER_SEED_MAX-1));
  const raw=ST==='ma'?towerFloor('ma',F,seed):towerFloorBank(TWR.pool(ST),F,seed);
  if(!raw){S.innerHTML=`<div class="intro"><h2>這一層題目準備中</h2><button class="big" data-tw="quit">← 回到塔</button></div>`;return}
  QS=raw.map(shape);st={n:0,pick:[],ms:[],ok:[],warn:0,t0:0,used:0};draw();stop();tick=setInterval(clock,500)}
const used=()=>st.used+(lock?0:Date.now()-st.t0); /* 只算看題到作答的時間，對錯回饋的停頓不算 */
function clock(){const c=$('#twclock');if(c&&st)c.textContent='⏱ '+fmtSec(used()/1000)}
function draw(){const q=QS[st.n],word=ST!=='ma';lock=false;st.t0=Date.now();
  S.innerHTML=`<div class="quiz tw${word?' word':''}"><div class="qh"><button class="back" data-tw="quit">← 回到塔</button>
     <div class="ttl"><span class="gcrumb">百鍊之塔・${title()}</span><h2>第 ${F} 層・${name()}</h2></div>
     <span class="twclock" id="twclock" aria-label="用時（不倒數）">⏱ ${fmtSec(used()/1000)}</span><button class="snd" data-tw="snd" aria-label="音效開關">${G8.snd?'🔊':'🔇'}</button></div>
   <div class="prog" aria-label="第 ${st.n+1} 題，共 10 題">${QS.map((_,i)=>`<i class="mk ${i<st.n?(st.ok[i]?'gold':'dark'):''}${i===st.n?' cur':''}"></i>`).join('')}<span class="task">第 ${st.n+1}／10 題・答對 ${st.ok.filter(Boolean).length}</span></div>
   ${q.big?`<p class="q twsub">${esc(q.text)}</p><p class="q twq twbig">${esc(q.big)}</p>`:`<p class="q twq">${esc(q.text)}</p>`}
   <div class="opts">${q.opts.map((o,i)=>`<button class="gopt" data-o="${i}"><span class="k">${'ABCD'[i]}</span><span>${esc(o)}</span></button>`).join('')}</div>
   <p class="mut twnote">不倒數・用時只和自己的最佳紀錄比</p></div>`}
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;S.appendChild(d);setTimeout(()=>d.remove(),1600)}
function pick(i){if(lock||!st)return;const q=QS[st.n],ok=i===q.ai;st.used+=Date.now()-st.t0;lock=true;
  st.ms.push(Date.now()-st.t0);st.pick.push(q.val(i));st.ok.push(ok);
  const bs=S.querySelectorAll('.gopt');bs.forEach(b=>b.disabled=true);bs[i].classList.add(ok?'ok':'no');
  if(!ok&&bs[q.ai])bs[q.ai].classList.add('ok');
  G8.sfx(ok?'ok':'no');
  const w=towerFast(st.ms);if(w>st.warn){st.warn=w;toast('👀 看清楚再答')}
  setTimeout(()=>{st.n++;st.n>=QS.length?result():draw()},ok?380:900)}
function result(){stop();const correct=st.ok.filter(Boolean).length,sec=Math.max(1,Math.round(st.used/1000)),rec0=TWR.rec(ST),r=towerResult(rec0,F,correct,sec);
  TWR.save(ST,r.rec);
  if(APP.rec()){APP.log(TWR.book(ST),ST==='ma'?['t','ma',F,seed,st.pick,sec,st.warn]:['t',ST,F,seed,st.pick,sec,st.warn,QS.map(q=>q.key)]);
    const d=APP.me.today.done;if(!d.includes('f')&&d.length<3)d.push('f');API.flush()}
  const fl=TWR.floors(ST),up=r.pass?fl.find(x=>x>F&&towerOpen(ST,r.rec,x,fl)):0,last=r.pass&&!fl.some(x=>x>F);
  const h=!r.pass?'再試一次就能過層':r.gold?'🥇 金階！打破自己的紀錄':last?'🏆 登上塔頂！':'🎉 過層！';
  const msg=!r.pass?`答對 ${correct}／10，再對 ${9-correct} 題就過層。馬上再挑戰，題目會不一樣。`
    :r.gold?`第 ${F} 層最佳紀錄 ${fmtSec(r.best)} → <b>${fmtSec(sec)}</b>`
    :r.first?`第 ${F} 層最佳紀錄 <b>${fmtSec(sec)}</b>，下次比這個快就是金階。`
    :`這次 ${fmtSec(sec)}・最佳 ${fmtSec(r.best)}，再快 ${sec-r.best+1} 秒就是金階。`;
  if(r.pass){G8.sfx('win');G8.confetti()}
  S.innerHTML=`<div class="res"><h2>${h}</h2><p class="twres">${msg}</p>
   <div class="lans" style="flex:none">${st.ok.map(x=>`<div class="lan ${x?'gold':'dark'}"></div>`).join('')}</div>
   <div class="chips"><span class="chip">答對 ${correct}／10</span><span class="chip">⏱ ${fmtSec(sec)}</span>${st.warn?`<span class="chip">👀 答太快提醒 ${st.warn} 次</span>`:''}${APP.rec()?'':'<span class="chip trial">試玩中，不會記錄</span>'}</div>
   <div class="row">${up?`<button class="big" data-tw="up" data-to="${up}">往上一層 ▶</button>`:''}<button class="${up?'ghost':'big'}" data-tw="go">${r.pass?'再挑戰這一層':'再挑戰（題目不同）'}</button><button class="ghost" data-tw="quit">← 回到塔</button></div></div>`}
S.addEventListener('click',e=>{if($('#g8play').hidden||!S.querySelector('[data-tw]'))return;const b=e.target.closest('[data-tw],[data-o]');if(!b)return;
  if(b.dataset.o!=null)return pick(+b.dataset.o);
  const a=b.dataset.tw;if(a==='snd'){e.stopPropagation();G8.setSnd(!G8.snd);return}if(a==='quit')close();else if(a==='go')start();else if(a==='up'){F=+b.dataset.to;intro()}});
document.addEventListener('keydown',e=>{if($('#g8play').hidden||!S.querySelector('[data-o]'))return;if(/^[1-4]$/.test(e.key))pick(+e.key-1)});
return{open,close}})();
