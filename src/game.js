/* ---------- 闖關畫面（全螢幕）：開場 → 7 格答題 → 結算 → 故事卡；另含複習卡冊的單題挑戰 ----------
   畫面與互動沿用範本 8／9／10；題目改用班網題本檔的真題。燈色、星等一律呼叫 rules.mjs 的函式（U83）。
   作答紀錄全部交給 APP（app.js）：試玩模式只記在這個分頁；登入後由 APP 排進上傳佇列（第 4 步）。 */
const G8=(()=>{
const $=s=>document.querySelector(s),RI=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const OWL=`<svg viewBox="0 0 120 130" aria-hidden="true"><ellipse cx="60" cy="122" rx="34" ry="6" fill="#0003"/><path d="M26 30 L38 44 L22 50Z M94 30 L82 44 L98 50Z" fill="#e8b87a"/><ellipse cx="60" cy="74" rx="42" ry="48" fill="#f6d39a"/><ellipse cx="60" cy="90" rx="26" ry="28" fill="#fff6e0"/><ellipse cx="20" cy="82" rx="9" ry="20" fill="#e8b87a" transform="rotate(12 20 82)"/><ellipse cx="100" cy="82" rx="9" ry="20" fill="#e8b87a" transform="rotate(-12 100 82)"/><circle cx="43" cy="58" r="17" fill="#fff"/><circle cx="77" cy="58" r="17" fill="#fff"/><circle cx="45" cy="60" r="8" fill="#2a2350"/><circle cx="75" cy="60" r="8" fill="#2a2350"/><circle cx="48" cy="57" r="3" fill="#fff"/><circle cx="78" cy="57" r="3" fill="#fff"/><path d="M54 70 L66 70 L60 80Z" fill="#ff9a4a"/><circle cx="30" cy="76" r="6" fill="#ffb7c8" opacity=".8"/><circle cx="90" cy="76" r="6" fill="#ffb7c8" opacity=".8"/><path d="M46 120 l6-6 l6 6 M62 120 l6-6 l6 6" stroke="#ff9a4a" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`;

/* ---------- 音效（範本 9；平板靜音鍵也要響 → audioSession＝playback） ---------- */
let AC,snd=true;
try{snd=localStorage.getItem('so-sfx')!=='0'}catch(e){}
function unlock(){try{if(navigator.audioSession)navigator.audioSession.type='playback';AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state!=='running')AC.resume()}catch(e){}return AC}
function setSnd(v){snd=v;try{localStorage.setItem('so-sfx',v?'1':'0')}catch(e){}document.querySelectorAll('.snd,#sndmap').forEach(b=>{b.textContent=b.id==='sndmap'?(snd?'🔊 音效：開':'🔇 音效：關'):(snd?'🔊':'🔇');b.setAttribute('aria-pressed',snd)});if(snd){unlock();MUS.sfx('ok')}}
const sfx=k=>{if(snd)MUS.sfx(k)};

/* ---------- 狀態 ---------- */
const S=$('#scene');
let LV={},PL=[],st=null,lock=false,MODE='round';
const starStr=n=>'★'.repeat(n)+'☆'.repeat(3-n);
const LETTER='ABCD';
const SAY=['島上 7 盞燈熄了，答對一題就點亮一盞。卡關時點「查看提示」，我一步一步給你線索。','好的開始！慢慢想，不用趕。','第三盞了，再亮一盞就過半。','過半了！繼續穩穩來。','越來越難囉，先讀清楚題目。','剩兩題！','最後一題！過關就能翻一張故事卡。'];

function open(lv){LV=lv;MODE='round';$('#g8play').hidden=false;document.body.style.overflow='hidden';intro()}
function close(){$('#g8play').hidden=true;document.body.style.overflow='';APP.afterPlay();if(APP.rec())API.flush()}
function modeChips(){return APP.rec()?`<span class="chip">今日任務 ${APP.me.today.done.length}／3</span>${APP.me.streak?`<span class="chip">🔥 連續自學 ${APP.me.streak} 天</span>`:''}`:'<span class="chip trial">試玩中，不會記錄</span>'}
function intro(){const best=APP.best(LV);
  S.innerHTML=`<div class="intro"><button class="ghost" data-act="quit">← 回到地圖</button><div class="where">${LV.crumb}</div><h2>${LV.title}</h2>
   <div class="owl">${OWL}</div><div class="say">${LV.isCore?'💠 島心試煉：這座島各關的重點都在這裡！<br>7 盞燈全部金燈，就能打開寶箱。':'島嶼點燈：島上 7 盞燈籠熄了！<br>答對一題，就點亮一盞。'}</div>
   <div class="chips"><span class="chip">${best?'最高紀錄 '+starStr(best):'第一次挑戰'}</span>${modeChips()}</div>
   <button class="big" data-act="start">${LV.resume?'繼續闖關！':'出發點燈！'}</button></div>`}

/* ---------- 一回合 ---------- */
/* 開一回合；LV.resume＝換載具接續（resumeOf 還原的題目與燈），等再挑戰的格子直接進再挑戰 */
function start(){const rs=LV.resume;LV.resume=null;PL=rs?rs.plan:LV.coreLv?planCore(LV.questions,{levels:LV.coreLv},LV.slotsOf):planRound(LV.questions,LV.code);
  if(LV.coreLv)LV.slots=PL.map(it=>it.kind||(LV.slotsOf(it.q.level)||[])[it.q.slot-1]||'基礎'); /* 虛擬島心：燈形照題目原本那一格 */
  st={n:rs?rs.n:0,res:rs?rs.res.slice():Array(7).fill(''),combo:0,max:0,cards:{},it:null,q:null,hint:0,re:false,wrong:[],sel:-1,pairs:{},pl:null,t0:0};nextQ();
  if(rs&&rs.pend.length&&st.it){st.wrongSlots=st.it.slots.map((s,i)=>rs.pend.includes(s)?i:-1).filter(i=>i>=0);retry()}}
/* 每答完一次就記 mid（pend＝第一次答錯、等再挑戰的格子）；只有登入時才送 */
function saveMid(pend){if(MODE==='round')APP.midSet(LV,midOf(LV.key,PL,st.n,st.res,pend||[]))}
function nextQ(){if(st.n>=PL.length)return result();st.it=PL[st.n];st.q=st.it.q;st.re=false;st.wrong=[];st.wrongSlots=null;drawQ()}
const slotOf=()=>st.it.slots[0];
const levelTag=()=>{const s=LV.slots[slotOf()-1]||'';return s?s+'題':''};
/* 共用素材：圖表由 chart.mjs 依 JSON 畫（P1 SPEC §3.6.1；圖表單題沒有題組也有圖）；畫不出來才退回顯示原文 */
function material(q){if(!q.material)return'';
  if(q.materialType==='圖表'){let d=null;try{d=JSON.parse(q.material)}catch(e){}const h=drawChart(d);if(h)return`<div class="mat chartmat">${h}</div>`}
  return`<div class="mat">${esc(q.material).replace(/\n/g,'<br>')}</div>`}
function head(){const lit=st.res.filter(r=>r&&r!=='dark').length,cur=st.it.slots;
  return`<div class="qh"><button class="back" data-act="quit">← 回到地圖</button><div class="ava">${APP.rec()?seatTxt(APP.me.seat):'試玩'}</div>
    <div class="ttl"><span class="gcrumb">${LV.crumb}</span><h2>${LV.title}</h2></div>
    <div class="prog" aria-label="已點亮 ${lit} 盞，共 7 盞">${LV.slots.map((p,i)=>`<i class="mk${p==='應用'?' d':''} ${st.res[i]||''}${cur.includes(i+1)?' cur':''}"></i>`).join('')}
      <span class="combo${st.combo>1?' on':''}" id="combo">🔥 連對 ${st.combo}</span>${APP.rec()?`<span class="task">今日任務 ${APP.me.today.done.length}／3</span>`:''}
      <button class="snd" data-act="snd" aria-label="音效開關">${snd?'🔊':'🔇'}</button></div></div>`}
function drawQ(){const q=st.q,s=st.it.slots;lock=false;st.sel=-1;st.pairs={};st.pl=null;st.hint=0;st.t0=Date.now();
  const no=s.length>1?`第 ${s[0]}～${s[s.length-1]} 盞（配合題，一對一盞）`:`第 ${s[0]} 題／共 7 題`;
  const say=st.re?'用秘笈卡的方法，再挑戰一題同類的題目！':st.combo>=3?`連對 ${st.combo} 題，手感正好！`:SAY[s[0]-1];
  S.innerHTML=`<div class="quiz">${head()}
   <div class="qn">${no}<span class="lvtag${st.re?' re':''}">${st.re?'再挑戰一次':levelTag()}</span></div>
   ${body(q)}
   <div class="guide"><div class="owl" id="owl">${OWL}</div><div class="say2" id="say">${say}</div></div>
   <div class="qf"><button class="ghost" id="hb" data-act="hint">💡 查看提示（1／3）</button><button class="big" id="gobtn" data-act="confirm" disabled>確認答案</button></div></div>`}
/* 題目本體：有共用素材（閱讀題組、圖表）時包成兩欄，寬螢幕文章在左、題目在右 */
function body(q){const main=`<p class="q">${esc(q.stem)}</p><p class="why" id="why" hidden></p>${q.type==='配合'?matchHTML(q):choiceHTML(q)}`,m=material(q);
  return m?`<div class="qbody">${m}<div class="qmain">${main}</div></div>`:main}
function choiceHTML(q){const long=q.options.some(o=>[...String(o)].length>9);
  return`<div class="opts${long?' long':''}">${q.options.map((x,i)=>`<button class="gopt" data-i="${i}"><span class="k">${LETTER[i]}</span><span>${esc(x)}</span></button>`).join('')}</div>`}
function matchHTML(q){return`<div class="match" id="match"><div class="mcol">${q.left.map((x,i)=>`<button class="ml" data-l="${i+1}"><span class="k">${i+1}</span><span>${esc(x)}</span><b class="to"></b></button>`).join('')}</div>
   <div class="mcol">${q.right.map((x,i)=>`<button class="mr" data-r="${LETTER[i]}"><span class="k">${LETTER[i]}</span><span>${esc(x)}</span></button>`).join('')}</div></div>
   <p class="mhelp">先點左邊一項，再點右邊和它配對的那一項；點已配好的左邊項目可以重配。</p>`}
function drawPairs(){const used=new Set(Object.values(st.pairs));
  S.querySelectorAll('.ml').forEach(b=>{const v=st.pairs[b.dataset.l];b.querySelector('.to').textContent=v?'→ '+v:'';b.classList.toggle('sel',st.pl===b.dataset.l);b.classList.toggle('set',!!v)});
  S.querySelectorAll('.mr').forEach(b=>b.classList.toggle('set',used.has(b.dataset.r)));
  $('#gobtn').disabled=Object.keys(st.pairs).length<st.q.left.length}
function tapLeft(l){if(lock)return;sfx('tap');delete st.pairs[l];st.pl=l;drawPairs()} /* 點已配好的＝拆掉重配；自動跳到的下一項再點一次仍是選取 */
function tapRight(r){if(lock||!st.pl)return;sfx('tap');for(const k in st.pairs)if(st.pairs[k]===r)delete st.pairs[k];st.pairs[st.pl]=r;
  const next=st.q.left.map((_,i)=>String(i+1)).find(k=>!st.pairs[k]);st.pl=next||null;drawPairs()}
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;S.appendChild(d);setTimeout(()=>d.remove(),1300)}
function hint(){const q=st.q;if(lock||st.hint>=3)return;st.hint++;
  let t=st.hint===1?q.hint1:q.hint2;
  if(st.hint===3){if(q.type==='配合'){const ans=parsePairs(q.answer),k=Object.keys(ans).find(k=>st.pairs[k]!==ans[k]);
      if(k){for(const x in st.pairs)if(st.pairs[x]===ans[k])delete st.pairs[x];st.pairs[k]=ans[k];const b=S.querySelector(`.ml[data-l="${k}"]`);b.classList.add('fixed');b.disabled=true;if(st.pl===k)st.pl=null;drawPairs()}
      t='我幫你連好一對了。'}
    else{const bs=[...S.querySelectorAll('.gopt')],w=bs.filter((b,i)=>LETTER[i]!==String(q.answer).toUpperCase()&&i!==st.sel&&!b.disabled);if(w[0]){w[0].classList.add('gone');w[0].disabled=true}t='我幫你拿掉一個不對的答案了。'}}
  $('#say').textContent='💡 '+(t||'再讀一次題目，找關鍵字。');const hb=$('#hb');if(st.hint<3)hb.textContent=`💡 查看提示（${st.hint+1}／3）`;else{hb.textContent='提示用完了';hb.disabled=true}}
function pick(i){const bs=S.querySelectorAll('.gopt');if(lock||!bs[i]||bs[i].disabled)return;sfx('tap');st.sel=i;bs.forEach((b,k)=>b.classList.toggle('sel',k===i));$('#gobtn').disabled=false}

function setLight(slot,kind){st.res[slot-1]=kind;const mk=S.querySelectorAll('.mk')[slot-1];if(mk){mk.classList.remove('cur');mk.classList.add(kind,'pop')}}
function bump(kind){if(kind==='gold'){st.combo++;st.max=Math.max(st.max,st.combo)}else if(kind==='dark')st.combo=0;
  const c=$('#combo');c.textContent='🔥 連對 '+st.combo;c.classList.toggle('on',st.combo>1);if(st.combo>1)c.classList.add('bump')}
function toNext(){const go=$('#gobtn'),last=st.n===PL.length-1;go.dataset.act='next';go.textContent=last?'看結果 →':'下一題 →';go.disabled=false;go.focus()}
const secs=()=>Math.round((Date.now()-st.t0)/100)/10;

function confirm(){if(MODE==='card')return cardConfirm();const q=st.q;if(lock)return;
  if(q.type==='配合'){if(Object.keys(st.pairs).length<q.left.length)return}else if(st.sel<0)return;
  lock=true;$('#hb').disabled=true;const sec=secs(),nth=st.re?2:1,hints=st.hint;
  if(q.type==='配合')return confirmMatch(q,sec,nth,hints);
  const letter=LETTER[st.sel],ok=judgeChoice(q,letter),bs=S.querySelectorAll('.gopt'),slot=slotOf();
  bs.forEach(b=>{b.disabled=true;b.classList.remove('sel')});
  APP.answer(LV,slot,q,letter,hints,sec,nth,ok?[]:cardsFor(q,letter));
  if(ok){bs[st.sel].classList.add('ok');sfx('ok');$('#owl').classList.add('hop');
    const kind=st.re?'silver':slotLight({first:true,hinted:hints>0,fast:isFast(sec)}).light;
    setLight(slot,kind);bump(kind);
    if(st.re){APP.overcome(LV,st.wrong);toast('秘笈卡蓋上「已克服」章！');$('#say').textContent='你克服這個盲點了！秘笈卡收進卡冊，之後隨時能回來翻。'}
    else{toast(kind==='gold'?'金燈 +1':'銀燈 +1');$('#say').textContent=kind==='gold'?(st.combo>1?`答對了！連對 ${st.combo} 題，金燈再亮一盞。`:'答對了！金燈亮一盞。'):hints?'答對了！用了提示，這盞是銀燈；下次試試不靠提示。':'答對了！不過答得太快，這盞先給銀燈；下次讀完題目再作答。'}
    saveMid();toNext()}
  else{bs[st.sel].classList.add('no');sfx('no');$('#owl').classList.add('tilt');bump('dark');
    if(!st.re){st.wrong=cardsFor(q,letter);saveMid([slot]);$('#say').textContent=st.wrong.length?'差一點！我有一張秘笈卡要送你。':'差一點！換一題同類的再試一次。';setTimeout(()=>giveCards(st.wrong),800)}
    else{setLight(slot,'dark');saveMid();bs.forEach((b,k)=>LETTER[k]===String(q.answer).toUpperCase()&&b.classList.add('ok'));showWhy(q);
      $('#say').textContent='沒關係，這盞燈先留著，之後再回來點亮它。';toNext()}}}

/* 配合題：一對一盞燈；第一次配錯的那幾對發卡、再挑戰換另一組配合題，只算原本配錯的那幾對 */
function confirmMatch(q,sec,nth,hints){const ok=judgeMatch(q,st.pairs),slots=st.it.slots,ans=parsePairs(q.answer);
  S.querySelectorAll('.ml,.mr').forEach(b=>b.disabled=true);
  S.querySelectorAll('.ml').forEach(b=>{const k=b.dataset.l;b.classList.add(ok[k-1]?'ok':'no');if(!ok[k-1])b.querySelector('.to').textContent='→ '+st.pairs[k]+'（應為 '+ans[k]+'）'});
  const counted=st.re?st.wrongSlots:slots.map((_,i)=>i);
  APP.answerMatch(LV,slots,counted,q,st.pairs,hints,sec,nth,cardsFor(q,st.pairs));
  let bad=[];
  counted.forEach(i=>{const s=slots[i];if(ok[i]){const kind=st.re?'silver':slotLight({first:true,hinted:hints>0,fast:isFast(sec)}).light;setLight(s,kind);bump(kind)}else{bad.push(i);if(st.re)setLight(s,'dark');bump('dark')}});
  const right=counted.length-bad.length;saveMid(!st.re&&bad.length?bad.map(i=>slots[i]):[]);
  if(!bad.length){sfx('ok');$('#owl').classList.add('hop');if(st.re)APP.overcome(LV,st.wrong);
    $('#say').textContent=st.re?'配對都正確了！秘笈卡蓋上「已克服」章。':hints?'全部配對正確！用了提示，這幾盞是銀燈。':'全部配對正確！';toNext();return}
  sfx('no');$('#owl').classList.add('tilt');
  if(!st.re){st.wrongSlots=bad;st.wrong=cardsFor(q,st.pairs);$('#say').textContent=`配對了 ${right} 對，錯 ${bad.length} 對。紅色的是配錯的，旁邊寫了正確答案。`;
    const b=$('#gobtn');b.dataset.act='cards';b.textContent=st.wrong.length?'看秘笈卡 →':'再挑戰 →';b.disabled=false}
  else{showWhy(q);$('#say').textContent=`這次配對了 ${right} 對。沒關係，這幾盞燈先留著，之後再回來點亮。`;toNext()}}
function showWhy(q){const w=$('#why');w.hidden=false;w.textContent='看這裡：'+(q.explanation||'')}
function giveCards(list){if(!list.length)return retry();const c=APP.card(LV.book,list[0]),rest=list.slice(1),d=document.createElement('div');d.className='ov';
  d.innerHTML=`<div class="gcard" role="dialog" aria-label="秘笈卡"><h3>🃏 差一點！貓頭鷹送你一張秘笈卡</h3><h4>${esc(c.name)}</h4><dl><dt>正確的想法</dt><dd>${esc(c.fix)}</dd><dt>看例子</dt><dd>${esc(c.ex)}</dd><dt>檢查口訣</dt><dd>${esc(c.chk)}</dd></dl><button class="big" data-act="${rest.length?'more':'retry'}">${rest.length?'下一張秘笈卡 →':'我懂了，再挑戰！'}</button></div>`;
  d.querySelector('button').onclick=e=>{e.stopPropagation();d.remove();rest.length?giveCards(rest):retry()};
  S.appendChild(d);sfx('card');d.querySelector('button').focus()}
function retry(){const alt=st.it.alt||st.it.q;st.q=alt;st.re=true;drawQ();
  if(alt.type==='配合'&&st.wrongSlots){$('#say').textContent=`換一組配合題！這次只算剛才配錯的 ${st.wrongSlots.length} 對（第 ${st.wrongSlots.map(i=>i+1).join('、')} 對）。`}}

function result(){const g=st.res.filter(r=>r==='gold').length,sv=st.res.filter(r=>r==='silver').length,sc=stars(g,sv);
  const r=APP.endRound(LV,g,sv);
  if(sc){sfx('win');confetti()}
  const story=sc?LV.story:null,cs=r.cards;
  S.innerHTML=`<div class="res"><h2>${sc===3?(g===7?'全對！太厲害了！':'燈籠全亮了！'):sc?'過關！':'再試一次就能過關'}</h2>
   <div class="stars">${[0,1,2].map(i=>`<span class="${i<sc?'on':''}" style="animation-delay:${.2+i*.25}s">★</span>`).join('')}</div>
   <div class="lans" style="flex:none">${st.res.map(x=>`<div class="lan ${x}"></div>`).join('')}</div>
   <div class="chips">${r.gained?`<span class="chip">🎉 刷新紀錄 +${r.gained} 顆星</span>`:''}<span class="chip">金燈 ${g}・銀燈 ${sv}</span><span class="chip">最高連對 ${st.max}</span>${cs?`<span class="chip">🃏 這一回合拿到秘笈卡 ${cs} 張</span>`:''}${r.chestNew?'<span class="chip">🎁 寶箱打開了！</span>':LV.isCore&&!r.chest?'<span class="chip">💠 島心七盞全金，就能打開寶箱</span>':g===7?'<span class="chip">🌟 這一關七盞全金</span>':''}${APP.rec()?'':'<span class="chip trial">試玩中，不會記錄</span>'}</div>
   ${story?`<div id="myst">${r.storyNew?`<p style="margin:4px 0 8px;font-weight:800">選一張翻開，看看這一關的故事卡</p><div class="myst">${[0,1,2].map(i=>`<button class="mc" data-act="flip" aria-label="第 ${i+1} 張神祕卡">？</button>`).join('')}</div>`:`<div class="story">📖 ${esc(story.title)}<br><small>這張故事卡已經收集過了</small></div>`}</div>`:''}
   <div class="row"><button class="big" data-act="start">${sc===3?'再玩一次':'再挑戰（題目不同）'}</button><button class="ghost" data-act="quit">← 回到地圖</button></div></div>`}
function flip(){const s=LV.story;$('#myst').innerHTML=`<div class="story">📖 <b>${esc(s.title)}</b><br>${esc(s.body)}<br><small>已收進故事卡圖鑑</small></div>`;sfx('card')}
function confetti(){const st2=document.querySelector('#g8play .stage');for(let i=0;i<26;i++){const c=document.createElement('i');c.className='conf';c.style.cssText=`left:${RI(2,98)}%;background:${['#ffd166','#ff9ec4','#8fd3ff','#b9e38c'][i%4]};animation-duration:${1.4+Math.random()*1.4}s;animation-delay:${Math.random()*.5}s`;st2.appendChild(c);setTimeout(()=>c.remove(),3400)}}

/* ---------- 複習卡冊：抽一題掛著這個盲點的題（不影響燈與星，只改卡） ---------- */
let CARD=null;
function openCard(c){CARD=c;MODE='card';lock=false;LV={crumb:'皇城・複習卡冊',title:esc(c.name),slots:[]};$('#g8play').hidden=false;document.body.style.overflow='hidden';
  st={res:[],combo:0,it:{slots:[1]},q:c.q,re:false,hint:0,sel:-1,pairs:{},pl:null,t0:Date.now()};
  const info=APP.card(c.book,c.code);
  S.innerHTML=`<div class="quiz"><div class="qh"><button class="back" data-act="quit">← 回到皇城</button><div class="ttl"><span class="gcrumb">皇城・複習卡冊</span><h2>${esc(info.name)}</h2></div></div>
   <div class="gcard mini"><dl><dt>正確的想法</dt><dd>${esc(info.fix)}</dd><dt>檢查口訣</dt><dd>${esc(info.chk)}</dd></dl></div>
   <div class="qn">${c.due?'7 天後確認':'再挑戰'}<span class="lvtag re">卡冊</span></div>
   ${body(c.q)}
   <div class="guide"><div class="owl" id="owl">${OWL}</div><div class="say2" id="say">用秘笈卡上的方法想一想。卡冊的挑戰不影響燈和星星。</div></div>
   <div class="qf"><button class="ghost" id="hb" data-act="hint">💡 查看提示（1／3）</button><button class="big" id="gobtn" data-act="confirm" disabled>確認答案</button></div></div>`}
function cardConfirm(){const q=st.q;if(lock)return;let ok,opt;
  if(q.type==='配合'){if(Object.keys(st.pairs).length<q.left.length)return;const r=judgeMatch(q,st.pairs);ok=r.every(Boolean);opt=pairsStr(st.pairs);
    S.querySelectorAll('.ml').forEach(b=>b.classList.add(r[b.dataset.l-1]?'ok':'no'))}
  else{if(st.sel<0)return;opt=LETTER[st.sel];ok=judgeChoice(q,opt);const bs=S.querySelectorAll('.gopt');bs.forEach(b=>{b.disabled=true;b.classList.remove('sel')});
    bs[st.sel].classList.add(ok?'ok':'no');if(!ok)bs.forEach((b,k)=>LETTER[k]===String(q.answer).toUpperCase()&&b.classList.add('ok'))}
  lock=true;$('#hb').disabled=true;S.querySelectorAll('.ml,.mr').forEach(b=>b.disabled=true);
  const now=APP.cardResult(CARD,q,opt,secs(),ok);sfx(ok?'ok':'no');showWhy(q);
  $('#say').textContent=ok?(now==='o'?'確認通過！這張卡結案了。':'答對了！這張卡蓋上「已克服」章，7 天後再確認一次。'):'這次沒答對，卡片回到「待複習」。看完詳解，改天再挑戰。';
  const go=$('#gobtn');go.dataset.act='quit';go.textContent='回到皇城 →';go.disabled=false;go.focus()}

S.onclick=e=>{if(S.querySelector('[data-tw]'))return; /* 百鍊之塔畫面由 tower.js 處理 */const o=e.target.closest('.gopt');if(o)return pick(+o.dataset.i);const l=e.target.closest('.ml');if(l)return tapLeft(l.dataset.l);const r=e.target.closest('.mr');if(r)return tapRight(r.dataset.r);
  const a=e.target.closest('[data-act]');if(!a)return;
  ({start,quit:close,hint,confirm,next(){st.n++;nextQ()},cards(){giveCards(st.wrong)},retry,flip,snd(){setSnd(!snd)}})[a.dataset.act]?.()};
document.addEventListener('keydown',e=>{if($('#g8play').hidden||S.querySelector('.ov')||S.querySelector('[data-tw]'))return;if(/^[1-4]$/.test(e.key)&&S.querySelector('.gopt'))pick(+e.key-1);else if(e.key==='Enter'&&$('#gobtn')&&!$('#gobtn').disabled){e.preventDefault();$('#gobtn').click()}});

return{open,openCard,close,setSnd,unlock,sfx,confetti,get snd(){return snd}}})();
