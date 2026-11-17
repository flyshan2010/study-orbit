/* ---------- APP：存檔、作答紀錄、側欄 ----------
   試玩模式（還沒登入）：進度只記在這個分頁（sessionStorage），關掉就沒了，不上傳、不上排行榜。
   登入、上傳佇列、接續、排行榜在第 4 步接代理（APP.me 有值＝已登入）。
   作答事件格式照代理 so_push（P2 SPEC §5.3 與 §15 前台約定），先排進 APP.ev，第 4 步才送出。 */
const APP={me:null,save:{},ev:[],
  m(book){return this.save[book]||(this.save[book]=decodeSave(null))},
  persist(book){try{sessionStorage.setItem('so-trial-'+book,encodeSave(this.m(book)))}catch(e){}},
  restore(){for(const b of DATA.index.books){try{const s=sessionStorage.getItem('so-trial-'+b.code);if(s)this.save[b.code]=decodeSave(s)}catch(e){}}},
  log(book,e){this.ev.push([book,e])},
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
  endRound(LV,g,sv){const m=this.m(LV.book),res=applyRound(m.lv[LV.key]||[0,0,0],g,sv),got=LV.got||0;LV.got=0;
    m.lv[LV.key]=res.record;let storyNew=false;
    if(passed(g,sv)&&LV.story&&!m.sc.includes(LV.key)){m.sc.push(LV.key);storyNew=true}
    this.log(LV.book,['e',LV.key,LV.src||'']);this.persist(LV.book);
    const isl=LV.islandKeys,gold=isl.filter(k=>(m.lv[k]||[])[1]===1).length;
    return{gained:res.gained,storyNew,cards:got,chest:[gold,isl.length]}},
  /* 卡冊挑戰 ["c", 盲點, 題目ID, 選項, 秒數] */
  cardResult(c,q,opt,sec,ok){const m=this.m(c.book),k=this.short(c.book,c.code),now=cardAfter(m.cd[k],ok,todayStr());
    this.log(c.book,['c',k,q.id,opt,sec]);
    if(now==='o')this.setCard(c.book,c.code,'o');else m.cd[k]=now;
    this.persist(c.book);return now},
  afterPlay(){applyProgress(R,this.save);if(M3&&M3.W3.refresh)M3.W3.refresh();go(view)}};

/* ---------- 側欄（範本的示意文字換成真資料） ---------- */
const bar=(v,c)=>`<div class="bar"><i style="width:${v}%;background:${c}"></i></div>`;
const trialNote='<p class="trial-note">試玩中：進度只留在這個分頁，不會記錄、不上排行榜。</p>';
function pWorld(){panel.innerHTML=`<h2>歡迎來到自學星圖</h2>${APP.me?'':trialNote}<ul><li><b>中間皇城</b>＝我的星星、複習卡冊、故事卡</li><li><b>各區</b>＝國語、數學、社會…，點一區看小島</li><li><b>小島</b>＝單元；島上的燈籠＝關卡，一關 7 題</li></ul><h3>各科進度</h3>`
  +R.map(r=>`<div class="mut">${r.name}・${r.bookTitle}　${r.done}／${r.total} 關</div>${bar(r.total?r.done/r.total*100:0,r.c.t1)}`).join('')+'<p class="mut">點地圖上的標籤進入。老師把新的單元做好，這裡就會自動多出小島。</p>'}
function totalsAll(){let s=0,c=0;R.forEach(r=>{const t=totals(APP.m(r.book).lv);s+=t.stars;c+=t.completed});return{stars:s,completed:c}}
function pCastle(){const t=totalsAll(),today=todayStr(),decks=R.map(r=>({r,d:deckOf(APP.m(r.book),today)}));
  const todo=decks.reduce((a,x)=>a+x.d.todo.length+x.d.due.length,0),okN=decks.reduce((a,x)=>a+x.d.ok+x.d.wait.length,0);
  const row=(r,k,due)=>{const c=APP.card(r.book,k);return`<li class="dk"><span><b>${esc(c.name)}</b><small>${r.name}・${due?'7 天到了，確認一次':'待複習'}</small></span><button class="btn" data-card="${r.book}|${k}|${due?1:0}">${due?'確認':'再挑戰'}</button></li>`};
  const list=decks.flatMap(({r,d})=>[...d.due.map(k=>row(r,k,1)),...d.todo.map(k=>row(r,k,0))]).join('');
  const stories=R.map(r=>{const m=APP.m(r.book),bk=DATA.books[r.book];if(!bk)return'';const got=bk.stories.filter(s=>m.sc.includes(APP.short(r.book,s.level)));
    return`<div class="mut">${r.name}　${got.length}／${bk.stories.length} 張</div>`+got.map(s=>`<details class="sty"><summary>📖 ${esc(s.title)}</summary>${esc(s.body)}</details>`).join('')}).join('');
  panel.innerHTML=`<h2>皇城｜我的自學情況</h2>${APP.me?'':trialNote}<div class="kpis"><div class="kpi"><b>${t.stars} ★</b>累計星數</div><div class="kpi"><b>${t.completed} 關</b>完成關數</div><div class="kpi"><b>${todo} 張</b>待複習的卡</div><div class="kpi"><b>${okN} 個</b>已克服的盲點</div></div>
   <h3>🃏 複習卡冊</h3>${list?`<ul class="deck">${list}</ul>`:'<p class="mut">目前沒有要複習的卡。答錯拿到的秘笈卡會收在這裡。</p>'}
   <h3>📖 故事卡圖鑑</h3>${stories}<button class="btn" id="toRank">🏆 看排行榜</button>`;
  $('#toRank').onclick=()=>tab('t4');
  panel.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>{const[book,k,due]=b.dataset.card.split('|'),full=book+'-'+k,q=cardQuestion(DATA.books[book].questions,full);
    if(!q){b.disabled=true;b.textContent='沒有題目';return}G8.openCard({book,code:full,name:APP.card(book,k).name,q,due:due==='1'})})}
function pRegion(r){const bs=DATA.index.books.filter(b=>b.subject===r.subj);
  panel.innerHTML=`<h2>${r.name}區・${r.zone}</h2><p class="mut">${r.bookTitle}｜${r.units.length} 座小島・${r.done}／${r.total} 關</p>`
  +(bs.length>1?`<h3>換一本題本</h3><div class="seg">${bs.map(b=>`<button class="btn${b.code===r.book?' on':''}" data-bk="${esc(b.code)}">${esc(b.title)}</button>`).join('')}</div>`:'')
  +`<h3>小島</h3><ul>${r.units.map((u,i)=>`<li><button class="lnk" data-u="${i}">${u.n}</button>　${u.done}／${u.total} 關${u.chest?'・🎁':''}</li>`).join('')}</ul>`;
  panel.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>go({k:'island',r:r.id,u:+b.dataset.u}));
  panel.querySelectorAll('[data-bk]').forEach(b=>b.onclick=()=>{setBookOf(r.subj,b.dataset.bk);boot(true)})}
function pIsland(r,ui){const u=r.units[ui];
  panel.innerHTML=`<h2>${u.n}</h2><p class="mut">${r.name}・${u.u}｜${u.total} 關${u.ex?'・期中評量考過（複習用）':''}</p>${bar(u.total?u.done/u.total*100:0,r.c.t1)}
   <ol class="lvs">${u.lv.map((t,i)=>`<li><button class="lnk" data-l="${i}">${t}</button> <span class="st">${u.best[i]?'★'.repeat(u.best[i])+'☆'.repeat(3-u.best[i]):'未挑戰'}</span></li>`).join('')}</ol>
   <p class="mut">${u.chest?'🎁 寶箱打開了！':'🔒 每一關都「七盞全金」，寶箱就會打開。'}</p>`;
  panel.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>go({k:'level',r:r.id,u:ui,l:+b.dataset.l}))}
function lvCtx(r,ui,li){const u=r.units[ui],bk=DATA.books[r.book],code=u.codes[li];
  return{book:r.book,key:u.keys[li],code,subj:r.id,crumb:`${r.name}區・${u.n}`,title:u.lv[li],slots:u.slots[li],
    questions:bk.questions,story:bk.stories.find(s=>s.level===code)||null,islandKeys:u.keys,src:''}}
function pLevel(r,ui,li){const u=r.units[ui],m=APP.m(r.book),rec=m.lv[u.keys[li]]||[0,0,0],bk=DATA.books[r.book];
  const kps=bk?bk.kps.filter(k=>k.level===u.codes[li]):[];
  panel.innerHTML=`<h2>${u.lv[li]}</h2><p class="mut">${r.name}・${u.n}${u.exam[li]?'・'+esc(u.exam[li])+'評量範圍':''}</p>
   <button class="btn go" id="enter">▶ 進入這一關</button>
   <p>${rec[0]?`最高紀錄 ${'★'.repeat(rec[0])+'☆'.repeat(3-rec[0])}・挑戰 ${rec[2]} 次${rec[1]?'・曾經七盞全金':''}`:'還沒挑戰過'}</p>
   ${kps.length?`<h3>這一關的學習重點</h3><ul>${kps.map(k=>`<li>${esc(k.name)}</li>`).join('')}</ul>`:''}
   <p class="mut">一關 7 題，答對一題點亮一盞燈；3 盞以上就過關，可以翻一張故事卡。</p>`;
  $('#enter').onclick=()=>G8.open(lvCtx(r,ui,li))}
function pChest(r,ui){const u=r.units[ui],m=APP.m(r.book),gold=u.keys.filter(k=>(m.lv[k]||[])[1]===1).length;
  panel.innerHTML=`<h2>${u.n}的寶箱</h2><p>這座島的每一關都<b>七盞全金</b>（不必同一天），寶箱就會打開。</p><p class="mut">${u.chest?'🎁 寶箱打開了！':'目前七盞全金的關：'+gold+'／'+u.total+' 關'}</p>`}

/* ---------- 分頁 ---------- */
function tab(id){document.querySelectorAll('main>section').forEach(s=>s.classList.toggle('on',s.id===id));document.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===id));
  if(id==='t4')drawBoard();scrollTo(0,0)}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
function drawBoard(){$('#lb').innerHTML=APP.me?'<p class="mut">排行榜讀取中…</p>':'<div class="lock-msg"><b>🏆 登入後才看得到排行榜</b><p>試玩的成績不會上排行榜。登入功能在下一步開放。</p></div>'}
