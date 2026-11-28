/* ---------- APP：存檔、作答紀錄、側欄 ----------
   試玩模式（還沒登入）：進度只記在這個分頁（sessionStorage），關掉就沒了，不上傳、不上排行榜。
   登入後（APP.me 有值）：作答事件照代理 so_push 格式（P2 SPEC §5.3 與 §15 前台約定）排進上傳佇列（api.js），
   進度快取在這台載具、以伺服器拉回的為準；paused＝代理暫停中，退回只能試玩、不記錄。 */
const APP={me:null,paused:false,save:{},
  m(book){return this.save[book]||(this.save[book]=decodeSave(null))},
  rec(){return!!this.me&&!this.paused}, /* 這一回合會不會記錄 */
  persist(book){const s=encodeSave(this.m(book));if(this.me){API.cache(book,s);return}try{sessionStorage.setItem('so-trial-'+book,s)}catch(e){}},
  restore(){for(const b of DATA.index.books){try{const s=this.me?(API.cached(b.code)||{}).save:sessionStorage.getItem('so-trial-'+b.code);if(s)this.save[b.code]=decodeSave(s)}catch(e){}}},
  log(book,e){if(this.rec())API.enqueue(book,e)},
  /* 換載具接續：每答完一題記一次 mid（只在登入時送） */
  midSet(LV,mid){if(!this.rec())return;this.m(LV.book).mid=mid;this.persist(LV.book);API.setMid(LV.book,mid)},
  /* 今日任務來源（§1 第 4 項）：n 下一關／r 複習（沒有卡要複習時，重玩沒到 3 星的關）／f 自選 */
  taskOf(LV,m,before){const r=R.find(x=>x.book===LV.book),keys=r?r.units.flatMap(u=>u.keys):[],today=todayStr();
    const hasDue=R.some(x=>{const d=deckOf(this.m(x.book),today);return d.todo.length+d.due.length>0});
    return taskSrc(this.me.today.done,{isNext:nextLevelKey(keys,m.lv)===LV.key,before,hasDue})},
  best(LV){return(this.m(LV.book).lv[LV.key]||[0])[0]},
  short(book,code){return code.indexOf(book+'-')===0?code.slice(book.length+1):code},
  setCard(book,code,st){const m=this.m(book),k=this.short(book,code),t=todayStr();
    if(st==='t'){m.cd[k]=['t',t];m.ok=m.ok.filter(x=>x!==k)}
    else if(st==='d'){if(m.cd[k]&&m.cd[k][0]==='t')m.cd[k]=['d',t]}
    else if(st==='o'){delete m.cd[k];if(!m.ok.includes(k))m.ok.push(k)}},
  /* 闖關作答 ["a", 關, 格, 題目ID, 選項, 提示數, 秒數, 第幾次]；第一次答錯就發卡（待複習） */
  answer(LV,slot,q,opt,hints,sec,nth,cards){this.log(LV.book,['a',LV.key,slot,q.id,opt,hints,sec,nth]);
    if(nth===1)cards.forEach(c=>{this.setCard(LV.book,c,'t');LV.got=(LV.got||0)+1})},
  /* 配合題：一對一筆事件，選項只帶那一對（例 "2D"）；代理 soJudge_ 只判那一對、一題最多發兩張卡（與 cardsFor 同一套） */
  answerMatch(LV,slots,idx,q,pairs,hints,sec,nth,cards){idx.forEach(i=>this.log(LV.book,['a',LV.key,slots[i],q.id,(i+1)+(pairs[i+1]||''),hints,sec,nth])); /* 再挑戰只記原本配錯的那幾對 */
    if(nth===1)cards.forEach(c=>{this.setCard(LV.book,c,'t');LV.got=(LV.got||0)+1})},
  overcome(LV,codes){codes.forEach(c=>this.setCard(LV.book,c,'d'))},
  card(book,code){const full=code.indexOf(book+'-')===0?code:book+'-'+code,b=(DATA.books[book]||{blindspots:[]}).blindspots.find(x=>x.code===full);
    return b?{name:b.name,...b.card}:{name:'秘笈卡',fix:'',ex:'',chk:''}},
  /* 回合結束 ["e", 關, 任務來源]：最高星等、曾經全金、挑戰次數、故事卡 */
  endRound(LV,g,sv){const m=this.m(LV.book),before=(m.lv[LV.key]||[0])[0],src=this.rec()?this.taskOf(LV,m,before):'',was=chestOpen(LV.isl,m.lv);
    const res=applyRound(m.lv[LV.key]||[0,0,0],g,sv),got=LV.got||0;LV.got=0;
    if(this.rec()){if(m.mid&&m.mid.k===LV.key)m.mid=null;API.setMid(LV.book,null);if(src)this.me.today.done.push(src)}
    m.lv[LV.key]=res.record;let storyNew=false;
    if(passed(g,sv)&&LV.story&&!m.sc.includes(LV.key)){m.sc.push(LV.key);storyNew=true}
    this.log(LV.book,['e',LV.key,src]);this.persist(LV.book);if(this.rec())API.flush();
    const now=chestOpen(LV.isl,m.lv);
    return{gained:res.gained,storyNew,cards:got,chest:now,chestNew:now&&!was}},
  /* 卡冊挑戰 ["c", 盲點, 題目ID, 選項, 秒數] */
  cardResult(c,q,opt,sec,ok){const m=this.m(c.book),k=this.short(c.book,c.code),now=cardAfter(m.cd[k],ok,todayStr());
    this.log(c.book,['c',k,q.id,opt,sec]);
    if(now==='o')this.setCard(c.book,c.code,'o');else m.cd[k]=now;
    if(this.rec()){const d=this.me.today.done;if(!d.includes('r')&&d.length<3)d.push('r');API.flush()} /* 卡冊一張算「複習」（代理同一套） */
    this.persist(c.book);return now},
  afterPlay(){applyProgress(R,this.save);if(M3&&M3.W3.refresh)M3.W3.refresh();go(view)}};

/* ---------- 側欄（範本的示意文字換成真資料） ---------- */
const bar=(v,c)=>`<div class="bar"><i style="width:${v}%;background:${c}"></i></div>`;
const trialNote='<p class="trial-note">試玩中：進度只留在這個分頁，不會記錄、不上排行榜。<button class="lnk" data-login>登入</button></p>';
/* 目前進度的下一個還沒過的關（今日任務「前進」）：照星圖區的順序找第一本有下一關的 */
function findNext(){for(const r of R){const m=APP.m(r.book),k=nextLevelKey(r.units.flatMap(u=>u.keys),m.lv);if(!k)continue;
  for(let ui=0;ui<r.units.length;ui++){const li=r.units[ui].keys.indexOf(k);if(li>=0)return{r:r.id,u:ui,l:li,t:r.name+'・'+r.units[ui].lv[li]}}}return null}
function tasksHTML(noStreak){if(!APP.rec())return'';const d=APP.me.today.done,n=findNext(),it=(k,t,s)=>`<li class="${d.includes(k)?'ok':''}"><span>${d.includes(k)?'✅':'⬜'}</span><span><b>${t}</b><small>${s}</small></span></li>`;
  return`<h3>📋 今日任務 ${Math.min(d.length,3)}／3${d.length>=3?'　🎉 3／3 完成！':''}</h3><ul class="tasks">${it('r','複習','卡冊挑一張卡；沒有卡要複習，就把還沒 3 星的關再玩一次')}${it('n','前進',n?'下一關：'+n.t:'目前開放的關都過了！')}${it('f','自選','任選一關打一回合')}</ul>`
   +(APP.me.streak&&!noStreak?`<p>🔥 連續自學 <b>${APP.me.streak}</b> 天<small class="mut">（週末、放假沒玩不會中斷）</small></p>`:'')
   +(n&&!d.includes('n')&&d.length<3?`<button class="btn" id="toNext">▶ 前進：${n.t}</button>`:'')}
function wireLogin(){panel.querySelectorAll('[data-login]').forEach(b=>b.onclick=loginDlg);const n=$('#toNext');if(n)n.onclick=()=>{const x=findNext();if(x)go({k:'level',r:x.r,u:x.u,l:x.l})}}
function pWorld(){panel.innerHTML=`<h2>歡迎來到自學星圖</h2>${APP.rec()?'':trialNote}${tasksHTML()}<ul><li><b>中間皇城</b>＝我的星星、複習卡冊、故事卡</li><li><b>各區</b>＝國語、數學、社會…，點一區看小島</li><li><b>小島</b>＝單元；島上的燈籠＝<b>島嶼點燈</b>，一關 7 題</li></ul><h3>各科進度</h3>`
  +R.map(r=>`<div class="mut">${r.name}・${r.bookTitle}　${r.done}／${r.total} 關</div>${bar(r.total?r.done/r.total*100:0,r.c.t1)}`).join('')+'<p class="mut">點地圖上的標籤進入。老師把新的單元做好，這裡就會自動多出小島。</p>';wireLogin()}
function totalsAll(){let s=0,c=0;R.forEach(r=>{const t=totals(APP.m(r.book).lv);s+=t.stars;c+=t.completed});return{stars:s,completed:c}}
/* ---------- 皇城側欄（P3 §2.1，範本 13 第①頁）：資料全部來自存檔與代理既有回覆，不新增代理欄位 ---------- */
function pCastle(){return pCastleV2()}
function ringSVG(p,c,mid){const r=40,L=2*Math.PI*r;return`<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="${r}" fill="none" stroke="#ffffff1a" stroke-width="11"/>${p>0?`<circle cx="50" cy="50" r="${r}" fill="none" stroke="${c}" stroke-width="11" stroke-linecap="round" stroke-dasharray="${(L*p).toFixed(1)} ${L.toFixed(1)}" transform="rotate(-90 50 50)"/>`:''}<text x="50" y="57" text-anchor="middle" fill="#eef0ff" font-size="${mid.length>4?15:20}" font-weight="800">${mid}</text></svg>`}
const ringBox=(p,c,mid,t,sub)=>`<div class="ring">${ringSVG(p,c,mid)}<b>${t}</b><small>${sub}</small></div>`;
/* 島的短名：國語「第一課」、其他科「三單元」 */
const isleShort=(r,u)=>{const h=u.un.split(/[ 、]/)[0];return r.subj==='國語'?h:h+'單元'};
/* 下一步建議：依存檔照固定順序挑前 2 條成立的（句子寫死，P3 §2.1 第 6 項；第②步起加島心、第④步起加百鍊塔） */
function castleTips(due){const t=[];
  if(due)t.push(`🃏 有 ${due} 張秘笈卡到期了，先複習最划算。`);
  for(const r of R){const u=r.units.find(u=>u.left>0&&u.left<=2);if(u){t.push(`🌙 ${r.name}科「${u.un}」還有 ${u.left} 關沒亮，過完就能挑戰島心試煉。`);break}}
  for(const r of R){const u=r.units.find(u=>u.open&&!u.chest&&u.core>=0);if(u){const b=u.best[u.core]||0;
    t.push(b===3?`💠 ${r.name}科「${u.un}」的島心試煉還差 1 盞金燈就開寶箱。`:`💠 ${r.name}科「${u.un}」的島心試煉七盞全金，就能打開寶箱。`);break}}
  outer:for(const r of R)for(const u of r.units)for(let i=0;i<u.best.length;i++)if(u.best[i]===1||u.best[i]===2){t.push(`⭐ ${r.name}科「${u.lv[i]}」再玩一次有機會拿 3 星。`);break outer}
  if(!t.length)t.push('✨ 今天挑一座新的島探險吧！');return t.slice(0,2)}
/* 本週七格：代理回 days 才畫（第②步部署後才有 weekDays）；沒有就只顯示連續天數，不用本機資料假造 */
function weekHTML(today){if(!APP.rec())return'';const w=Array.isArray(APP.me.days)&&typeof weekDays==='function'?weekDays(APP.me.days,today):null;
  return`<h3>🔥 ${w?'本週自學 '+w.filter(Boolean).length+' 天・':''}連續 ${APP.me.streak||0} 天</h3>`
    +(w?`<div class="week">${w.map((on,i)=>`<i class="${on?'on':''}">${'一二三四五六日'[i]}</i>`).join('')}</div>`:'')+'<p class="mut">週末、放假沒玩不會中斷。</p>'}
function pCastleV2(){const t=totalsAll(),today=todayStr(),decks=R.map(r=>({r,d:deckOf(APP.m(r.book),today)}));
  const sum=f=>decks.reduce((a,x)=>a+f(x.d),0),nT=sum(d=>d.todo.length),nDue=sum(d=>d.due.length),nD=nDue+sum(d=>d.wait.length),nO=sum(d=>d.ok);
  const lvDone=R.reduce((a,r)=>a+r.done,0),lvAll=R.reduce((a,r)=>a+r.total,0),isl=R.flatMap(r=>r.units),chests=isl.filter(u=>u.chest).length;
  const rings=ringBox(lvAll?lvDone/lvAll:0,'var(--ok)',lvAll?Math.round(lvDone/lvAll*100)+'%':'0%','島嶼點燈',`${lvDone}／${lvAll} 關`)
   +ringBox(0,'var(--gold)','🔒','百鍊塔','即將開放')
   +ringBox(isl.length?chests/isl.length:0,'#b9a6ff',chests+'／'+isl.length,'島心寶箱',`已開 ${chests}／${isl.length} 個`);
  const cons=R.map(r=>`<div class="crow"><span class="sj" style="color:${r.c.t2}">${r.name}</span><div class="isles">`+r.units.map((u,ui)=>
    `<button class="isle" data-isle="${r.id}|${ui}" title="${u.un}" aria-label="${r.name}${u.un}：${u.done}／${u.total} 關${u.chest?'，寶箱已開':''}"><span class="dots">${u.best.map((v,i)=>`<i class="dot${i===u.core?' dia'+(u.open?'':' lk'):''}${v?' s'+v:''}"></i>`).join('')}${u.chest?'🎁':''}</span><small>${isleShort(r,u)}</small></button>`).join('')+'</div></div>').join('');
  const row=(r,k,due)=>{const c=APP.card(r.book,k);return`<li class="dk"><span><b>${esc(c.name)}</b><small>${r.name}・${due?'7 天到了，確認一次':'待複習'}</small></span><button class="btn" data-card="${r.book}|${k}|${due?1:0}">${due?'確認':'再挑戰'}</button></li>`};
  const list=decks.flatMap(({r,d})=>[...d.due.map(k=>row(r,k,1)),...d.todo.map(k=>row(r,k,0))]).join('');
  const stories=R.map(r=>{const m=APP.m(r.book),bk=DATA.books[r.book];if(!bk)return'';const got=bk.stories.filter(s=>m.sc.includes(APP.short(r.book,s.level)));
    return`<div class="mut">${r.name}　${got.length}／${bk.stories.length} 張</div>`+got.map(s=>`<details class="sty"><summary>📖 ${esc(s.title)}</summary>${esc(s.body)}</details>`).join('')}).join('');
  panel.innerHTML=`<h2>皇城｜我的自學情況</h2>${APP.rec()?'':trialNote}
   <h3>我的三種練習</h3><div class="rings">${rings}</div><p class="mut">累計 ${t.stars} ★・完成 ${t.completed} 關</p>
   <h3>我的星座圖</h3><p class="mut">一點＝一關、一串＝一座島；點一串就飛過去。</p><div class="cons">${cons}</div>
   <div class="lgd"><span><i class="dot"></i>還沒過</span><span><i class="dot s1"></i>1 星</span><span><i class="dot s2"></i>2 星</span><span><i class="dot s3"></i>3 星</span><span><i class="dot dia"></i>島心</span></div>
   ${tasksHTML(true)}${weekHTML(today)}
   <h3>🃏 秘笈卡冊</h3><div class="stacks"><div class="stk"><b>${nT}</b>待複習</div><div class="stk"><b>${nD}</b>7 天後確認${nDue?`<small>今天到期 ${nDue} 張</small>`:''}</div><div class="stk"><b>${nO}</b>已克服</div></div>
   ${list?`<details class="deckbox"><summary class="btn">🃏 去複習（${nT+nDue} 張）</summary><ul class="deck">${list}</ul></details>`:'<p class="mut">目前沒有要複習的卡。答錯拿到的秘笈卡會收在這裡。</p>'}
   <h3>💡 下一步建議</h3><ul class="tips">${castleTips(nDue).map(x=>`<li>${x}</li>`).join('')}</ul>
   <details class="more"><summary>📖 故事卡圖鑑・🏆 排行榜</summary>${stories}<button class="btn" id="toRank">🏆 看排行榜</button></details>`;
  $('#toRank').onclick=()=>tab('t4');wireLogin();
  panel.querySelectorAll('[data-isle]').forEach(b=>b.onclick=()=>{const[r,u]=b.dataset.isle.split('|');go({k:'island',r,u:+u})});
  panel.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>{const[book,k,due]=b.dataset.card.split('|'),full=book+'-'+k,q=cardQuestion(DATA.books[book].questions,full);
    if(!q){b.disabled=true;b.textContent='沒有題目';return}G8.openCard({book,code:full,name:APP.card(book,k).name,q,due:due==='1'})})}
function pRegion(r){const bs=DATA.index.books.filter(b=>b.subject===r.subj);
  panel.innerHTML=`<h2>${r.name}區・${r.zone}</h2><p class="mut">${r.bookTitle}｜${r.units.length} 座小島・${r.done}／${r.total} 關</p>`
  +(bs.length>1?`<h3>換一本題本</h3><div class="seg">${bs.map(b=>`<button class="btn${b.code===r.book?' on':''}" data-bk="${esc(b.code)}">${esc(b.title)}</button>`).join('')}</div>`:'')
  +`<h3>小島</h3><ul>${r.units.map((u,i)=>`${u.ul&&(!i||r.units[i-1].uno!==u.uno)?`<li class="uh">${u.ul}</li>`:''}<li><button class="lnk" data-u="${i}">${u.un}</button>　${u.done}／${u.total} 關${u.chest?'・🎁':''}</li>`).join('')}</ul>`;
  panel.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>go({k:'island',r:r.id,u:+b.dataset.u}));
  panel.querySelectorAll('[data-bk]').forEach(b=>b.onclick=()=>{setBookOf(r.subj,b.dataset.bk);boot(true)})}
function pIsland(r,ui){const u=r.units[ui];
  panel.innerHTML=`<h2>${u.un}</h2><p class="mut">${r.name}・${u.u}｜${u.total} 關${u.ex?'・期中評量考過（複習用）':''}</p>${bar(u.total?u.done/u.total*100:0,r.c.t1)}
   <h3>🏮 島嶼點燈</h3><ol class="lvs">${u.lv.map((t,i)=>i===u.core?'':`<li><button class="lnk" data-l="${i}">${u.keys[i]} ${t}</button> <span class="st">${u.best[i]?'★'.repeat(u.best[i])+'☆'.repeat(3-u.best[i]):'未挑戰'}</span></li>`).join('')}</ol>
   ${u.core>=0?`<h3>島心與寶箱</h3><p><button class="lnk" data-l="${u.core}">${coreTitle(u)}</button> <span class="st">${u.open?(u.best[u.core]?'★'.repeat(u.best[u.core])+'☆'.repeat(3-u.best[u.core]):'未挑戰'):'🔒 還差 '+u.left+' 關'}</span></p>`:''}
   <p class="mut">${u.chest?'🎁 寶箱打開了！':'🎁 島心試煉七盞全金，寶箱就會打開。'}</p>`;
  panel.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>go({k:'level',r:r.id,u:ui,l:+b.dataset.l}))}
/* 島心的標題：國語「💠 島心・1-5 美麗島・評量複習」；虛擬島心「💠 島心試煉」 */
const coreTitle=u=>u.virt?'💠 島心試煉':'💠 島心・'+u.keys[u.core]+' '+u.lv[u.core];
function lvCtx(r,ui,li){const u=r.units[ui],bk=DATA.books[r.book],code=u.codes[li],isCore=li===u.core,virt=isCore&&u.virt;
  const slotsOf=c=>{const k=u.codes.indexOf(c);return k>=0?u.slots[k]:[]};
  return{book:r.book,key:u.keys[li],code,subj:r.id,crumb:`${r.name}區・${u.un}`,title:isCore?coreTitle(u):u.keys[li]+' '+u.lv[li],slots:u.slots[li],
    questions:bk.questions,story:bk.stories.find(s=>s.level===code)||null,islandKeys:u.keys,isl:u.isl,isCore,
    coreLv:virt?u.coreLv:null,slotsOf,src:''}}
function pLevel(r,ui,li){const u=r.units[ui],m=APP.m(r.book),rec=m.lv[u.keys[li]]||[0,0,0],bk=DATA.books[r.book],isCore=li===u.core;
  if(isCore&&!u.open){panel.innerHTML=`<h2>${coreTitle(u)}</h2><p class="mut">${r.name}・${u.un}</p><p>🔒 這座島其他的關都過關（至少 1 星），島心試煉就會開放。</p><p><b>還差 ${u.left} 關</b></p>
     <p class="mut">島心試煉七盞全金，就能打開這座島的寶箱。</p>`;return}
  const kps=bk?bk.kps.filter(k=>isCore&&u.virt?u.coreLv.includes(k.level):k.level===u.codes[li]):[];
  /* 換載具接續：存檔裡有這一關答到一半的 mid → 「繼續上次（第 N 題）」 */
  const rs=APP.rec()&&bk&&m.mid&&m.mid.k===u.keys[li]?resumeOf(m.mid,bk.questions,u.codes[li],isCore&&u.virt?u.coreLv:null):null;
  panel.innerHTML=`<h2>${isCore?coreTitle(u):u.keys[li]+' '+u.lv[li]}</h2><p class="mut">${r.name}・${u.un}${u.exam[li]?'・'+esc(u.exam[li])+'評量範圍':''}</p>
   ${rs?`<button class="btn go" id="resume">⏯ 繼續上次（${rs.n>=rs.plan.length?'看結果':'第 '+midSlot(m.mid)+' 題'}）</button> `:''}<button class="btn go${rs?' ghost':''}" id="enter">▶ ${rs?'重新開始':'進入這一關'}</button>
   <p>${rec[0]?`最高紀錄 ${'★'.repeat(rec[0])+'☆'.repeat(3-rec[0])}・挑戰 ${rec[2]} 次${rec[1]?'・曾經七盞全金':''}`:'還沒挑戰過'}</p>
   ${kps.length?`<h3>${isCore?'這座島':'這一關'}的學習重點</h3><ul>${kps.map(k=>`<li>${esc(k.name)}</li>`).join('')}</ul>`:''}
   <p class="mut">${isCore?(u.virt?'島心試煉從這座島各關抽 7 題；':'')+'7 盞燈全部金燈，就能打開這座島的寶箱'+(u.chest?'（🎁 已打開）':'')+'。':'一關 7 題，答對一題點亮一盞燈；3 盞以上就過關，可以翻一張故事卡。'}</p>`;
  $('#enter').onclick=()=>G8.open(lvCtx(r,ui,li));if(rs)$('#resume').onclick=()=>G8.open({...lvCtx(r,ui,li),resume:rs})}
function pChest(r,ui){const u=r.units[ui];
  panel.innerHTML=`<h2>${u.un}的寶箱</h2><p><b>島心試煉七盞全金</b>，寶箱就會打開。</p><p class="mut">${u.chest?'🎁 寶箱打開了！':u.open?'💠 島心試煉已經開放，去挑戰吧！':'🔒 島心試煉還沒開放：其他的關還差 '+u.left+' 關過關。'}</p>
   ${u.core>=0&&!u.chest?`<button class="btn go" id="toCore">💠 去島心試煉</button>`:''}`;
  const b=$('#toCore');if(b)b.onclick=()=>go({k:'level',r:r.id,u:ui,l:u.core})}

/* ---------- 分頁 ---------- */
function tab(id){document.querySelectorAll('main>section').forEach(s=>s.classList.toggle('on',s.id===id));document.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===id));
  if(id==='t4')drawBoard();scrollTo(0,0)}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
/* 排行榜（§5.5）：總排行／各科 × 星數／進度／本週星數；只有前 5 名＋自己，只顯示座號 */
const MET={stars:'星數',progress:'進度（完成關數）',weekly:'本週星數'};
async function drawBoard(){const lb=$('#lb');
  if(!APP.rec()||!APP.me.token){lb.innerHTML=`<div class="lock-msg"><b>🏆 登入後才看得到排行榜</b><p>${APP.paused?'自學星圖暫停中，現在只能試玩。':'試玩的成績不會上排行榜。'}</p>${API.url&&!APP.paused?'<button class="btn" id="lbIn">登入</button>':''}</div>`;const b=$('#lbIn');if(b)b.onclick=loginDlg;return}
  const S=API.rk,subs=[...new Set(DATA.index.books.map(b=>b.subject))];
  lb.innerHTML=`<div class="rk"><div class="seg2" role="group" aria-label="範圍">${[['all','總排行'],...subs.map(s=>[s,s])].map(([v,t])=>`<button class="btn${S.scope===v?'':' ghost'}" aria-pressed="${S.scope===v}" data-sc="${esc(v)}">${esc(t)}</button>`).join('')}</div>
   <div class="seg2" role="group" aria-label="排法">${Object.entries(MET).map(([v,t])=>`<button class="btn${S.metric===v?'':' ghost'}" aria-pressed="${S.metric===v}" data-mt="${v}">${t}</button>`).join('')}</div><div id="rkl"><p class="mut">排行榜讀取中…</p></div></div>`;
  lb.querySelectorAll('[data-sc]').forEach(b=>b.onclick=()=>{S.scope=b.dataset.sc;drawBoard()});
  lb.querySelectorAll('[data-mt]').forEach(b=>b.onclick=()=>{S.metric=b.dataset.mt;drawBoard()});
  const want=S.scope+'|'+S.metric,r=await API.rank(),box=$('#rkl');if(!box||want!==S.scope+'|'+S.metric)return;
  if(!r||r.err){box.innerHTML=`<p class="mut">${esc(r?r.err:'請先登入')}</p>`;return}
  const unit=S.metric==='progress'?' 關':' ★',me=APP.me.seat,row=x=>`<tr class="${x.seat===me?'me':''}"><td>${x.rank}</td><td>${seatTxt(x.seat)}${x.seat===me?'（你）':''}</td><td>${x.value}${unit}</td></tr>`;
  const inTop=r.me&&r.top.some(x=>x.seat===r.me.seat);
  box.innerHTML=(r.top.length?`<table class="rkt"><thead><tr><th>名次</th><th>座號</th><th>${MET[S.metric]}</th></tr></thead><tbody>${r.top.map(row).join('')}${r.me&&!inTop?'<tr class="gap"><td colspan="3">⋯</td></tr>'+row(r.me):''}</tbody></table>`:'<p class="mut">還沒有人上榜，闖完一關就會出現。</p>')
   +(r.me?`<p class="cu">${r.me.rank===1?'🥇 你是第一名！':esc(catchUpText(S.metric,r.catchUp))}</p>`:'<p class="mut">你在這個排行還沒有成績，闖完一關就會上榜。</p>')
   +'<p class="mut">只顯示前 5 名和你自己；排行一分鐘更新一次。</p>'}
