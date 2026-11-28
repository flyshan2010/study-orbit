
/* ---------- 工具 ---------- */
const $=s=>document.querySelector(s);
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function blob(cx,cy,rx,ry,seed,n=12,j=.16){const r=rng(seed),p=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2,k=1-j+r()*j*2;p.push([cx+Math.cos(a)*rx*k,cy+Math.sin(a)*ry*k])}
  let d='';for(let i=0;i<n;i++){const a=p[i],b=p[(i+1)%n],m=[(a[0]+b[0])/2,(a[1]+b[1])/2];d+=(i?'Q'+a[0].toFixed(1)+' '+a[1].toFixed(1)+' ':'M'+((p[n-1][0]+a[0])/2).toFixed(1)+' '+((p[n-1][1]+a[1])/2).toFixed(1)+'Q'+a[0].toFixed(1)+' '+a[1].toFixed(1)+' ')+m[0].toFixed(1)+' '+m[1].toFixed(1)}return d+'z'}
const at=(x,y,s,inner)=>`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s})">${inner}</g>`;

/* ---------- 風景零件（全部程式畫，無圖片檔） ---------- */
const GL={
pine:c=>`<path d="M0-22-8-4h16z" fill="${c.t1}"/><path d="M0-30-6-14h12z" fill="${c.t2}"/><rect x="-1.5" y="-4" width="3" height="4" fill="#6b4a2e"/>`,
bamboo:c=>`<path d="M-4 0v-26M0 0v-32M4 0v-22" stroke="${c.t1}" stroke-width="2"/><path d="M0-32l6-3M-4-26l-6-2M4-22l6-2M0-20l-6-3" stroke="${c.t2}" stroke-width="1.6"/>`,
inkmt:c=>`<path d="M-22 0-6-30 2-16 10-24 24 0z" fill="${c.m1}"/><path d="M-6-30-1-21-9-20z" fill="#fff" opacity=".7"/>`,
pav:c=>`<path d="M-14-14 0-24 14-14z" fill="#b5483a"/><rect x="-9" y="-14" width="18" height="12" fill="#f3e9d2"/><rect x="-11" y="-2" width="22" height="2" fill="#8a6a4a"/>`,
book:c=>`<path d="M-14-4q7-6 14 0q7-6 14 0v-14q-7-6-14 0q-7-6-14 0z" fill="#fff8e6" stroke="#8a6a4a"/>`,
brush:c=>`<path d="M-8 0 6-24" stroke="#8a6a4a" stroke-width="3"/><path d="M6-24l5-9-9 4z" fill="#22283f"/>`,
crystal:c=>`<path d="M0-26 7-14 0 0-7-14z" fill="${c.t2}"/><path d="M0-26 7-14 0-12z" fill="#fff" opacity=".45"/>`,
cube:c=>`<path d="M0-18 9-13 0-8-9-13z" fill="#e9e6ff"/><path d="M-9-13 0-8v10l-9-5z" fill="${c.t1}"/><path d="M9-13 0-8v10l9-5z" fill="${c.t2}"/>`,
gear:c=>`<circle r="9" cy="-11" fill="none" stroke="${c.t1}" stroke-width="5" stroke-dasharray="3.2 2.4"/><circle r="5.5" cy="-11" fill="${c.t2}"/>`,
bars:c=>`<rect x="-14" y="-16" width="7" height="16" fill="#ff9f6b"/><rect x="-4" y="-28" width="7" height="28" fill="#6bb7ff"/><rect x="6" y="-21" width="7" height="21" fill="#ffd166"/>`,
pie:c=>`<circle cy="-12" r="12" fill="#fff3e0"/><path d="M0-12V-24A12 12 0 0 1 12-12z" fill="#ff8f6b"/><path d="M0-12H12A12 12 0 0 1 0 0z" fill="#ffc46b"/>`,
protr:c=>`<path d="M-16 0A16 16 0 0 1 16 0z" fill="#e9e6ff" stroke="${c.t1}" stroke-width="2"/><path d="M0 0 10-12" stroke="#ff6b6b" stroke-width="2"/>`,
tri:c=>`<path d="M0-30 16 0h-32z" fill="${c.t2}"/><path d="M0-30 16 0H0z" fill="${c.t1}"/>`,
tower:c=>`<rect x="-12" y="-10" width="24" height="10" fill="${c.t1}"/><rect x="-9" y="-20" width="18" height="10" fill="${c.t2}"/><rect x="-6" y="-30" width="12" height="10" fill="#e9e6ff"/>`,
sign:c=>`<path d="M0 0v-22" stroke="#8a6a4a" stroke-width="2.5"/><path d="M-2-24h16l5 4-5 4H-2z" fill="#fff3c9"/><path d="M2-13h-16l-5 4 5 4H2z" fill="#ffd9a0"/>`,
drop:c=>`<path d="M0-26q10 14 0 22q-10-8 0-22z" fill="#7fd3ff"/>`,
house:c=>`<rect x="-7" y="-10" width="14" height="10" fill="#f6ead0"/><path d="M-9-10 0-18 9-10z" fill="${c.t1}"/>`,
field:c=>`<path d="M-14 0-8-8h22l-6 8z" fill="${c.t2}"/><path d="M-9-2h18M-6-5h18" stroke="#fff" stroke-opacity=".5"/>`,
temple:c=>`<path d="M-16-12q16-10 32 0z" fill="#c0503c"/><rect x="-11" y="-12" width="22" height="12" fill="#f3d9a8"/><rect x="-3" y="-8" width="6" height="8" fill="#7a3b2a"/>`,
gate:c=>`<path d="M-14 0v-18M14 0v-18" stroke="#b5483a" stroke-width="3"/><path d="M-18-18h36M-15-13h30" stroke="#b5483a" stroke-width="3"/>`,
lantern:c=>`<path d="M0-26v6" stroke="#fff"/><ellipse cy="-13" rx="7" ry="8" fill="#e5533d"/><rect x="-3" y="-6" width="6" height="2" fill="#ffd166"/>`,
broad:c=>`<circle cy="-16" r="9" fill="${c.t1}"/><circle cx="5" cy="-12" r="6" fill="${c.t2}"/><rect x="-1.5" y="-8" width="3" height="8" fill="#6b4a2e"/>`,
volcano:c=>`<path d="M-22 0-7-26h14l15 26z" fill="#7a6a62"/><path d="M-7-26h14l-3 6h-8z" fill="#ff7a45"/>`,
flower:c=>`<path d="M0 0v-5" stroke="#2f6b3d" stroke-width="1.5"/><circle cy="-7" r="3.2" fill="#ffd166"/>`,
scope:c=>`<path d="M-6 0 0-12 6 0" stroke="#dfe5ff" stroke-width="2" fill="none"/><path d="M-9-10 9-20" stroke="#dfe5ff" stroke-width="5" stroke-linecap="round"/>`,
palm:c=>`<path d="M0 0q3-12 0-22" stroke="#8a6a4a" stroke-width="2.5" fill="none"/><path d="M0-22q-10-6-14 2M0-22q10-6 14 2M0-22q-4-10-12-8M0-22q4-10 12-8" stroke="${c.t1}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
balloon:c=>`<circle cy="-34" r="9" fill="${c.t2}"/><path d="M-5-27-2-20h4l3-7" stroke="#fff" fill="none"/><rect x="-2.5" y="-20" width="5" height="4" fill="#8a6a4a"/>`,
flag:c=>`<path d="M0 0v-22" stroke="#fff" stroke-width="1.5"/><path d="M0-22h11l-3 4 3 4H0z" fill="${c.t2}"/>`,
sail:c=>`<path d="M-12-4h24l-4 5h-16z" fill="#8a5a3a"/><path d="M0-4v-22l11 18z" fill="#fff"/>`
};

/* ---------- 資料：由 data.js 依班網題本檔排出（R＝各區，見 buildRegions） ---------- */
let R=[];
const LVW=()=>1; /* 正式版一關就是一關（範本的「一課五關」已拆成五個關卡） */

/* ---------- 四季（P3 §2.2）：依臺北今天自動切換，學生不必設定；預覽用 ?season=spring|summer|autumn|winter，?season=off＝不套用 ----------
   五區主題色（THEME.c）不動，只換天空、海、光線色票，樹冠／草地綠色往季節色偏一點，冬天朝上的面積雪，再加飄落物（2D 備援只換色票）。
   退路：SEASON_ON 改 false＝預設關（網址參數仍可預覽） */
const SEASON_ON=true;
const SEASONS={
 off:{n:'',e:'',fx:'',sky:[[.13,.17,.4],[.02,.03,.11]],wat:[[.035,.075,.22],[.26,.34,.64]],tint:[1,1,1],leaf:[0,0,0],leafK:0,snow:0,svg:['#0d1436','#3b82c4','#16306e']},
 spring:{n:'春',e:'🌸',fx:'petal',sky:[[.34,.24,.46],[.05,.06,.19]],wat:[[.05,.09,.24],[.36,.38,.66]],tint:[1.05,.99,1.03],leaf:[1,.7,.82],leafK:.28,snow:0,svg:['#1a1640','#6f7fd0','#2a2a70']},
 summer:{n:'夏',e:'☀️',fx:'firefly',sky:[[.09,.25,.47],[.01,.04,.15]],wat:[[.02,.1,.26],[.2,.44,.7]],tint:[.98,1.03,1],leaf:[.22,.72,.34],leafK:.25,snow:0,svg:['#08183a','#2f8fd6','#0f2f6e']},
 autumn:{n:'秋',e:'🍁',fx:'leaf',sky:[[.42,.22,.27],[.07,.04,.15]],wat:[[.05,.06,.19],[.38,.3,.5]],tint:[1.08,.98,.9],leaf:[.92,.46,.18],leafK:.7,snow:0,svg:['#1d1230','#8a5a7a','#2c2a5a']},
 winter:{n:'冬',e:'❄️',fx:'snow',sky:[[.22,.28,.5],[.04,.05,.15]],wat:[[.04,.07,.19],[.4,.46,.68]],tint:[.95,.98,1.08],leaf:[.24,.42,.38],leafK:.3,snow:1,svg:['#0f1638','#6d7fb8','#1c2a5e']}};
const SZK=(()=>{let k=null;try{k=new URLSearchParams(location.search).get('season')}catch(e){}
  return SEASONS[k]?k:SEASON_ON?season(todayStr()):'off'})(),SZ=SEASONS[SZK];
/* 地圖角落小標籤：季節＋今天節氣（預覽別的季節時只顯示季節，節氣照今天） */
function seasonTag(){const t=$('#sz');if(!t)return;if(SZK==='off'){t.hidden=true;return}t.hidden=false;t.textContent=SZ.e+' '+SZ.n+'・'+solarTerm(todayStr())}
/* 飄落物：一張 2D 畫布疊在 3D 地圖上，跟地圖共用同一個 requestAnimationFrame（不另開計時器）；減少動態或 2D 備援時不產生 */
const FX={on:false,cv:null,c:null,p:[],w:0,h:0,
  init(stage){if(matchMedia('(prefers-reduced-motion: reduce)').matches||!SZ.fx)return;const cv=document.createElement('canvas');cv.id='fx';cv.setAttribute('aria-hidden','true');stage.insertBefore(cv,$('#pins'));this.cv=cv;this.c=cv.getContext('2d');this.on=!!this.c},
  size(w,h){if(!this.on)return;this.w=w;this.h=h;this.cv.width=w;this.cv.height=h;const n=innerWidth<901?30:60;while(this.p.length<n)this.p.push(this.spawn(true));this.p.length=n},
  spawn(any){const r=Math.random,k=SZ.fx,up=k==='firefly';return{x:r()*this.w,y:any?r()*this.h:up?this.h+10:-10,v:(k==='snow'?22:k==='firefly'?-10:30)*(.6+r()*.8),
    sw:r()*6.28,ss:.6+r()*1.2,a:r()*6.28,va:(r()-.5)*2.4,s:k==='snow'?1.6+r()*2.6:k==='firefly'?1.6+r()*1.4:3.5+r()*3,hue:r()}},
  step(dt,t){if(!this.on||!this.w)return;const c=this.c,k=SZ.fx;c.clearRect(0,0,this.w,this.h);
    for(let i=0;i<this.p.length;i++){const q=this.p[i];q.y+=q.v*dt;q.x+=Math.sin(t*q.ss+q.sw)*(k==='firefly'?14:18)*dt;q.a+=q.va*dt;
      if(q.y>this.h+12||q.y<-14||q.x<-20||q.x>this.w+20){this.p[i]=this.spawn(false);continue}
      if(k==='snow'){c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.arc(q.x,q.y,q.s,0,6.283);c.fill()}
      else if(k==='firefly'){const f=.45+.55*Math.abs(Math.sin(t*1.8+q.sw));c.fillStyle=`rgba(255,246,160,${(.25*f).toFixed(2)})`;c.beginPath();c.arc(q.x,q.y,q.s*3.2,0,6.283);c.fill();c.fillStyle=`rgba(255,250,200,${f.toFixed(2)})`;c.beginPath();c.arc(q.x,q.y,q.s,0,6.283);c.fill()}
      else{c.save();c.translate(q.x,q.y);c.rotate(q.a);c.fillStyle=k==='petal'?(q.hue<.5?'#ffc0d8':'#ffd9e6'):(q.hue<.5?'#e0662c':'#f2b33d');c.beginPath();
        if(k==='petal')c.ellipse(0,0,q.s,q.s*.6,0,0,6.283);else{c.moveTo(-q.s,0);c.quadraticCurveTo(0,-q.s*.8,q.s,0);c.quadraticCurveTo(0,q.s*.8,-q.s,0)}c.fill();c.restore()}}}};

/* ---------- 畫圖 ---------- */
const svg=$('#svg'),panel=$('#panel'),crumb=$('#crumb');
let view={k:'world'};
const sea=`<defs><radialGradient id="g" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="${SZ.svg[1]}"/><stop offset="1" stop-color="${SZ.svg[2]}"/></radialGradient></defs><rect width="1000" height="660" fill="${SZ.svg[0]}"/>`;
function starfield(seed){const r=rng(seed);let s='';for(let i=0;i<70;i++)s+=`<circle cx="${(r()*1000).toFixed(0)}" cy="${(r()*660).toFixed(0)}" r="${(r()*1.3+.3).toFixed(1)}" fill="#fff" opacity="${(r()*.5+.15).toFixed(2)}"/>`;return s}
function scatter(cx,cy,rx,ry,gl,c,n,seed,s=1,lm){const r=rng(seed),a=[];for(let i=0;i<n;i++){const t=r()*Math.PI*2,k=Math.sqrt(r())*.72;a.push([cx+Math.cos(t)*rx*k,cy+Math.sin(t)*ry*k-2,gl[Math.floor(r()*gl.length)]])}
  if(lm)a.push([cx,cy+ry*.1,lm,1.7]);a.sort((p,q)=>p[1]-q[1]);return a.map(p=>at(p[0],p[1],s*(p[3]||1),GL[p[2]](c))).join('')}
function land(cx,cy,rx,ry,c,seed,lock){return `<path d="${blob(cx,cy+7,rx+10,ry+8,seed)}" fill="#4f9ad6" opacity=".55"/><path d="${blob(cx,cy+5,rx,ry,seed)}" fill="${c.edge}"/><path class="land" d="${blob(cx,cy,rx,ry,seed)}" fill="${c.land}" ${lock?'opacity=".55"':''}/>`}
function label(x,y,t,s,col){return `<text x="${x}" y="${y}" text-anchor="middle" class="lbl" font-size="19" ${col?`style="fill:${col}"`:''}>${t}</text>`+(s?`<text x="${x}" y="${y+19}" text-anchor="middle" class="sub">${s}</text>`:'')}
function castle(x,y,s){return at(x,y,s,`<rect x="-34" y="-22" width="68" height="22" fill="#cfd5f5"/><path d="M-34-22h8v-6h8v6h8v-6h8v6h8v-6h8v6h8v-6h8v6" fill="none" stroke="#cfd5f5" stroke-width="5"/><rect x="-44" y="-36" width="16" height="36" fill="#aeb6ea"/><path d="M-46-36-36-52-26-36z" fill="#e5533d"/><rect x="28" y="-36" width="16" height="36" fill="#aeb6ea"/><path d="M26-36 36-52 46-36z" fill="#e5533d"/><rect x="-10" y="-62" width="20" height="62" fill="#e9ecff"/><path d="M-14-62 0-84 14-62z" fill="#ffd166"/><circle cy="-70" r="5" fill="#fff"><animate attributeName="opacity" values="1;.4;1" dur="2.4s" repeatCount="indefinite"/></circle><rect x="-6" y="-14" width="12" height="14" rx="6" fill="#5a4fb8"/><path d="M0-84v-14" stroke="#fff" stroke-width="1.5"/><path d="M0-98h12l-3 4 3 4H0z" fill="#6fe0a6"/>`)}

function drawWorld(){const cx=500,cy=335;let s=sea+starfield(3)+`<ellipse cx="${cx}" cy="${cy}" rx="470" ry="300" fill="url(#g)" opacity=".85"/>`;
  R.forEach(r=>{const a=r.ang*Math.PI/180;r.x=cx+Math.cos(a)*300;r.y=cy+Math.sin(a)*205;s+=`<path d="M${cx} ${cy}L${r.x.toFixed(0)} ${r.y.toFixed(0)}" stroke="#c9a56b" stroke-width="9" stroke-dasharray="3 5" opacity=".8"/>`});
  R.forEach((r,i)=>{s+=`<g class="hit" data-go="region" data-r="${r.id}" tabindex="0" role="button" aria-label="${r.name}區">`+land(r.x,r.y,128,82,r.c,i*13+2,r.lock)+scatter(r.x,r.y,118,66,r.gl,r.c,17,i*31+7,1)+label(r.x,r.y+70,`${r.name}・${r.zone}`,r.lock?'尚未建置':`${r.units.length} 島・已完成 ${r.done}／${r.total} 關`)+`</g>`});
  s+=`<g class="hit" data-go="castle" tabindex="0" role="button" aria-label="皇城：我的自學情況">`+land(cx,cy+8,96,58,{land:'#d9dcf2',edge:'#8d93c4'},99)+castle(cx,cy+22,1.15)+label(cx,cy+86,'皇城｜我的自學情況','星數、進度、複習卡冊','#ffd166')+`</g>`;
  svg.innerHTML=s}

function drawRegion(r){const U=r.units,n=U.length,cols=n>5?5:n,rows=Math.ceil(n/cols);let s=sea+starfield(11)+`<rect x="20" y="50" width="960" height="590" rx="40" fill="url(#g)" opacity=".8"/>`;
  const pos=U.map((u,i)=>{const row=Math.floor(i/cols),k=i%cols,cc=row%2?cols-1-k:k,w=920/cols;return[40+w*(cc+.5),rows>1?215+row*250:330+(i%2?40:-40)]});
  s+=`<path d="M${pos.map(p=>p[0].toFixed(0)+' '+p[1].toFixed(0)).join('L')}" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round" opacity=".7"/>`;
  U.forEach((u,i)=>{const[x,y]=pos[i],rx=n>5?74:100,ry=n>5?50:66,gl=r.gl.slice((i%2),(i%2)+4);u.x=x;u.y=y;
    s+=`<g class="hit" data-go="island" data-r="${r.id}" data-u="${i}" tabindex="0" role="button" aria-label="${u.n}">`+land(x,y,rx,ry,r.c,i*19+r.ang+400,r.lock)+scatter(x,y,rx*.9,ry*.75,gl,r.c,n>5?6:9,i*23+r.ang+900,.9,u.lm)+label(x,y+ry+26,u.un,r.lock?u.u:`${u.u}・${u.done}／${u.total} 關`)+`</g>`});
  svg.innerHTML=s}

function drawIsland(r,ui){const u=r.units[ui],L=u.lv,n=L.length;let s=sea+starfield(21)+`<ellipse cx="500" cy="350" rx="470" ry="290" fill="url(#g)" opacity=".8"/>`+land(500,350,400,215,r.c,ui*19+r.ang+400)+scatter(500,300,380,150,r.gl,r.c,34,ui*41+r.ang,1.25)+at(500,250,3.2,GL[u.lm](r.c));
  const pts=L.map((_,i)=>[190+620*(n>1?i/(n-1):.5),430+(i%2?-34:22)]);
  s+=`<path d="M${pts.map(p=>p.join(' ')).join('L')}" fill="none" stroke="#fff8e6" stroke-width="7" stroke-dasharray="2 12" stroke-linecap="round"/>`;
  L.forEach((t,i)=>{const[x,y]=pts[i],full=!!u.on[i],bst=u.best[i]||0;
    s+=`<g class="hit" data-go="level" data-r="${r.id}" data-u="${ui}" data-l="${i}" tabindex="0" role="button" aria-label="${t}"><circle cx="${x}" cy="${y}" r="30" fill="${full?'#ffd166':'#1b2766'}" stroke="${full?'#b8860b':'#aab3e6'}" stroke-width="4"/><text x="${x}" y="${y+7}" text-anchor="middle" font-size="17" font-weight="700" fill="${full?'#2a1d00':'#fff'}">${u.keys[i]}</text>`+label(x,y+56,u.pin[i],bst?'★'.repeat(bst)+'☆'.repeat(3-bst):'未挑戰')+`</g>`});
  svg.innerHTML=s}

/* 側欄（pWorld／pCastle／pRegion／pIsland／pLevel）在 app.js */
function setCrumb(a){crumb.innerHTML=a.map((x,i)=>`<button data-c="${i}">${x[0]}</button>`).join('');crumb.querySelectorAll('button').forEach((b,i)=>b.onclick=()=>go(a[i][1]))}
function go(v){view=v;const r=R.find(x=>x.id===v.r);const c=[['🏰 全島',{k:'world'}]];
  if(v.k==='world'){drawWorld();pWorld()}
  else if(v.k==='castle'){drawWorld();pCastle();c.push(['皇城',v])}
  else if(v.k==='tower'){drawWorld();pTower();c.push(['皇城',{k:'castle'}],['百鍊之塔',v])}
  else{c.push([r.name+'區',{k:'region',r:r.id}]);
    if(v.k==='region'){drawRegion(r);pRegion(r)}
    else{c.push([r.units[v.u].n,{k:'island',r:r.id,u:v.u}]);drawIsland(r,v.u);v.k==='island'?pIsland(r,v.u):pLevel(r,v.u,v.l)}}
  setCrumb(c)}
function act(e){const g=e.target.closest('.hit');if(!g)return;const d=g.dataset;
  if(d.go==='castle')go({k:'castle'});else if(d.go==='region')go({k:'region',r:d.r});
  else if(d.go==='island'){const r=R.find(x=>x.id===d.r);r.lock?(drawRegion(r),pRegion(r)):go({k:'island',r:d.r,u:+d.u})}
  else if(d.go==='level')go({k:'level',r:d.r,u:+d.u,l:+d.l})}
svg.addEventListener('click',act);svg.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();act(e)}});

/* ---------- 3D 地圖 ---------- */
let M3=null;
function makeM3(){M3=(()=>{
const FOV=42*Math.PI/180;
const W3={ok:false,focus:-1,t:0,asp:1.6,dpr:1,q:0};
const CAM={az:0,el:.62,r:40,tx:0,tz:-4,goal:null,touched:false};
const hex=h=>[(h>>16&255)/255,(h>>8&255)/255,(h&255)/255];
const hexs=s=>hex(parseInt(s.slice(1),16));
function mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o}
function trs(x,y,z,ry=0,sx=1,sy=sx,sz=sx){const c=Math.cos(ry),s=Math.sin(ry);return new Float32Array([c*sx,0,-s*sx,0, 0,sy,0,0, s*sz,0,c*sz,0, x,y,z,1])}
function persp(fov,asp,n,f){const t=1/Math.tan(fov/2);return new Float32Array([t/asp,0,0,0, 0,t,0,0, 0,0,(f+n)/(n-f),-1, 0,0,2*f*n/(n-f),0])}
function look(e,c){let zx=e[0]-c[0],zy=e[1]-c[1],zz=e[2]-c[2];let l=Math.hypot(zx,zy,zz);zx/=l;zy/=l;zz/=l;
  let xx=zz,xz=-zx;l=Math.hypot(xx,xz)||1;xx/=l;xz/=l;const yx=zy*xz,yy=zz*xx-zx*xz,yz=-zy*xx;
  return new Float32Array([xx,yx,zx,0, 0,yy,zy,0, xz,yz,zz,0, -(xx*e[0]+xz*e[2]),-(yx*e[0]+yy*e[1]+yz*e[2]),-(zx*e[0]+zy*e[1]+zz*e[2]),1])}
class Geo{
  constructor(){this.v=[];this.m=null}
  get n(){return this.v.length/10}
  tp(p){const m=this.m;if(!m)return p;return[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]]}
  at(m,fn){const o=this.m;this.m=o?mul(o,m):m;fn();this.m=o}
  raw(p,c,a){this.v.push(p[0],p[1],p[2],0,1,0,c[0],c[1],c[2],a)}
  tri(a,b,c,col,em=0){a=this.tp(a);b=this.tp(b);c=this.tp(c);
    const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
    let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
    for(const p of[a,b,c])this.v.push(p[0],p[1],p[2],nx,ny,nz,col[0],col[1],col[2],em)}
  quad(a,b,c,d,col,em=0){this.tri(a,b,c,col,em);this.tri(a,c,d,col,em)}
  cyl(x,y0,z,r0,r1,h,n,col,em=0,rot=0){const y1=y0+h,p=(r,a,y)=>[x+Math.cos(a)*r,y,z+Math.sin(a)*r];
    for(let i=0;i<n;i++){const a0=rot+i/n*6.2832,a1=rot+(i+1)/n*6.2832;
      if(r1>0){this.quad(p(r0,a0,y0),p(r0,a1,y0),p(r1,a1,y1),p(r1,a0,y1),col,em);this.tri([x,y1,z],p(r1,a0,y1),p(r1,a1,y1),col,em)}
      else this.tri(p(r0,a0,y0),p(r0,a1,y0),[x,y1,z],col,em)}}
  box(x,y,z,w,h,d,col,em=0){const x0=x-w/2,x1=x+w/2,z0=z-d/2,z1=z+d/2,y1=y+h;
    this.quad([x0,y,z1],[x1,y,z1],[x1,y1,z1],[x0,y1,z1],col,em);this.quad([x1,y,z0],[x0,y,z0],[x0,y1,z0],[x1,y1,z0],col,em);
    this.quad([x0,y,z0],[x0,y,z1],[x0,y1,z1],[x0,y1,z0],col,em);this.quad([x1,y,z1],[x1,y,z0],[x1,y1,z0],[x1,y1,z1],col,em);
    this.quad([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],col,em)}
  ball(x,y,z,r,col,em=0,ns=8,nt=5){const p=(t,a)=>[x+Math.sin(t)*Math.cos(a)*r,y+Math.cos(t)*r,z+Math.sin(t)*Math.sin(a)*r];
    for(let j=0;j<nt;j++){const t0=j/nt*Math.PI,t1=(j+1)/nt*Math.PI;for(let i=0;i<ns;i++){const a0=i/ns*6.2832,a1=(i+1)/ns*6.2832;
      if(j===0)this.tri(p(t0,a0),p(t1,a1),p(t1,a0),col,em);else if(j===nt-1)this.tri(p(t0,a0),p(t0,a1),p(t1,a0),col,em);else this.quad(p(t0,a0),p(t0,a1),p(t1,a1),p(t1,a0),col,em)}}}
  slab(cx,cz,pts,y0,s0,y1,s1,side,top,em=0){const n=pts.length,P=(q,s,y)=>[cx+q[0]*s,y,cz+q[1]*s];
    for(let i=0;i<n;i++){const a=pts[i],b=pts[(i+1)%n];this.quad(P(a,s0,y0),P(b,s0,y0),P(b,s1,y1),P(a,s1,y1),side,em);this.tri([cx,y1,cz],P(a,s1,y1),P(b,s1,y1),top,em)}}
  star(x,y,z,r,t,col,em){const pt=[];for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;pt.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr,z])}
    for(let i=0;i<10;i++){const a=pt[i],b=pt[(i+1)%10];this.tri([x,y,z+t],a,b,col,em);this.tri([x,y,z-t],b,a,col,em)}}
  /* 扇形島（環狀地圖用）：內半徑 ri、外半徑 ro、角度 a0→a1；hw＝放射狀水道半寬（等寬）；d＝向外擴張量（負值＝內縮）。從 (d0,y0) 斜到 (d1,y1)，頂面在 y1 */
  sect(ri,ro,a0,a1,hw,d0,y0,d1,y1,side,top,em=0){const N=Math.max(8,Math.round((a1-a0)*10));
    const ring=(d,y)=>{const A=[],B=[],r0=ri-d,r1=ro+d,e0=Math.asin(Math.max(0,hw-d)/r0),e1=Math.asin(Math.max(0,hw-d)/r1);
      for(let i=0;i<=N;i++){const u=i/N,t0=a0+e0+(a1-a0-2*e0)*u,t1=a0+e1+(a1-a0-2*e1)*u;A.push([Math.cos(t0)*r0,y,Math.sin(t0)*r0]);B.push([Math.cos(t1)*r1,y,Math.sin(t1)*r1])}return[A,B]};
    const[A0,B0]=ring(d0,y0),[A1,B1]=ring(d1,y1);
    for(let i=0;i<N;i++){this.quad(A0[i+1],A0[i],A1[i],A1[i+1],side,em);this.quad(B0[i],B0[i+1],B1[i+1],B1[i],side,em);this.quad(A1[i],A1[i+1],B1[i+1],B1[i],top,em)}
    this.quad(B0[0],A0[0],A1[0],B1[0],side,em);this.quad(A0[N],B0[N],B1[N],A1[N],side,em)}
}
function blob(R,seed,N=30){const a=[];for(let i=0;i<N;i++){const t=i/N*6.2832,r=R*(1+.10*Math.sin(3*t+seed)+.07*Math.sin(5*t+seed*2.3));a.push([Math.cos(t)*r,Math.sin(t)*r])}return a}
function buildOwl(){const g=new Geo(),b=hex(0x8ea2ff),d=hex(0x6478d8),w=hex(0xf4f6ff),o=hex(0xffb347);
  g.at(trs(0,.5,0,0,.42,.5,.4),()=>g.ball(0,0,0,1,b));g.at(trs(0,.4,.2,0,.28,.33,.25),()=>g.ball(0,0,0,1,hex(0xdfe5ff)));
  g.cyl(-.22,.88,0,.11,0,.26,4,d);g.cyl(.22,.88,0,.11,0,.26,4,d);
  g.ball(-.15,.68,.31,.125,w,.35);g.ball(.15,.68,.31,.125,w,.35);g.ball(-.15,.68,.42,.055,hex(0x1a1f4a));g.ball(.15,.68,.42,.055,hex(0x1a1f4a));
  g.cyl(0,.5,.4,.06,0,.12,4,o,.2);g.at(trs(-.41,.48,0,0,.1,.3,.24),()=>g.ball(0,0,0,1,d));g.at(trs(.41,.48,0,0,.1,.3,.24),()=>g.ball(0,0,0,1,d));
  g.ball(-.13,.04,.14,.075,o);g.ball(.13,.04,.14,.075,o);g.cyl(.52,.3,.1,.02,.02,.5,4,hex(0x6b4a2e));g.ball(.52,.86,.1,.09,hex(0xffe08a),1,6,4);return g}
function buildBoat(){const g=new Geo(),wd=hex(0x8a5a36);
  g.at(trs(0,0,0,0,1.5,1,.72),()=>g.cyl(0,-.05,0,.38,.52,.3,6,wd));g.cyl(0,.2,0,.03,.03,1.15,5,hex(0x5a3a22));
  g.tri([.03,.4,0],[.03,1.3,0],[-.7,.42,0],hex(0xfff3d6),.25);g.tri([.06,.45,0],[.06,1.05,0],[.5,.47,0],hex(0xffd98a),.25);g.ball(.62,.38,0,.07,hex(0xffe08a),1,6,3);return g}
function buildBeam(){const g=new Geo(),c=[1,.86,.5],L=24,R=3.2,n=10;
  for(const s of[1,-1])for(let i=0;i<n;i++){const a0=i/n*6.2832,a1=(i+1)/n*6.2832;g.raw([0,0,0],c,1);g.raw([s*L,Math.cos(a0)*R,Math.sin(a0)*R],c,0);g.raw([s*L,Math.cos(a1)*R,Math.sin(a1)*R],c,0)}return g}
function buildSky(){const g=new Geo();[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]].forEach(p=>g.raw([p[0],p[1],.999],[0,0,0],0));return g}
function buildWater(){const g=new Geo(),s=320;[[-s,-s],[s,-s],[s,s],[-s,-s],[s,s],[-s,s]].forEach(p=>g.raw([p[0],0,p[1]],[0,0,0],0));return g}
function buildStars(){const v=[],R=rng(42);for(let i=0;i<420;i++){const a=R()*6.2832,y=.04+R()*.96,h=Math.sqrt(1-y*y),r=380;v.push(Math.cos(a)*h*r,y*r,Math.sin(a)*h*r, 1.2+R()*2.4,0,.1+R(), .8+R()*.2,.85+R()*.15,1,.5+R()*.5)}
  v.push(-150,210,-290, 54,0,0, 1,.95,.8,.95);return{v,n:v.length/10}}
const VS_LIT='attribute vec3 aP;attribute vec3 aN;attribute vec4 aC;uniform mat4 uVP,uM;varying vec3 vN,vW;varying vec4 vC;void main(){vec4 w=uM*vec4(aP,1.);vW=w.xyz;vN=(uM*vec4(aN,0.)).xyz;vC=aC;gl_Position=uVP*w;}';
const FS_LIT='precision mediump float;varying vec3 vN,vW;varying vec4 vC;uniform vec3 uL,uCam,uFog,uLH,uTint,uLeaf;uniform float uLHi,uFogD,uLeafK,uSnow,uTop;void main(){vec3 n=normalize(vN);if(!gl_FrontFacing)n=-n;float d=max(dot(n,uL),0.);vec3 b=vC.rgb;float gd=b.g-max(b.r,b.b);b=mix(b,uLeaf*(.55+.6*dot(b,vec3(.3,.59,.11))),uLeafK*smoothstep(.02,.12,gd)*(1.-vC.a)*step(uTop-.05,vW.y));float up=smoothstep(.55,.85,n.y)*uSnow*(1.-vC.a);float hy=vW.y-uTop;up*=hy>.3?1.:(abs(hy)<.04?.5:0.);b=mix(b,vec3(.93,.96,1.),up);vec3 hemi=mix(vec3(.2,.22,.4),vec3(.5,.56,.82),n.y*.5+.5)*uTint;vec3 lit=b*(hemi+vec3(1.,.93,.78)*d*.7);vec3 tl=uLH-vW;float dl=length(tl);lit+=b*vec3(1.,.78,.42)*uLHi*max(dot(n,tl/dl),0.)/(1.+dl*dl*.02);vec3 col=mix(lit,vC.rgb*1.3,vC.a);float f=1.-exp(-pow(length(uCam-vW)*uFogD,2.));gl_FragColor=vec4(mix(col,uFog,f),1.);}';
const VS_WAT='attribute vec3 aP;uniform mat4 uVP;varying vec3 vW;void main(){vW=aP;gl_Position=uVP*vec4(aP,1.);}';
const FS_WAT='precision mediump float;varying vec3 vW;uniform vec3 uL,uCam,uFog,uLH;uniform vec3 uW0,uW1;uniform float uT,uLHi,uFogD;void main(){vec2 p=vW.xz;float t=uT;vec3 n=normalize(vec3(.07*cos(p.x*.9+t*1.1)+.05*cos(p.x*.4-p.y*.7+t*.7),1.,.07*cos(p.y*1.1+t*.9)+.05*cos(p.x*.6+p.y*.5-t*.8)));vec3 v=normalize(uCam-vW);float fr=pow(1.-max(dot(n,v),0.),3.);vec3 col=mix(uW0,uW1,fr*.85+.08);vec3 hv=normalize(uL+v);col+=vec3(1.,.95,.8)*pow(max(dot(n,hv),0.),80.)*.6;float dl=length(p-uLH.xz);col+=vec3(1.,.72,.34)*uLHi*.28/(1.+dl*dl*.035);vec2 g=floor(p*1.3);float h=fract(sin(dot(g,vec2(12.9898,78.233)))*43758.5453);vec2 q=fract(p*1.3)-.5;float s=step(.965,h)*(.45+.55*sin(t*1.6+h*80.))*smoothstep(.2,0.,length(q));col+=s*vec3(.85,.92,1.);float f=1.-exp(-pow(length(uCam-vW)*uFogD,2.));gl_FragColor=vec4(mix(col,uFog,f),1.);}';
const VS_SKY='attribute vec3 aP;varying float vY;void main(){vY=aP.y;gl_Position=vec4(aP,1.);}';
const FS_SKY='precision mediump float;varying float vY;uniform float uH;uniform vec3 uS0,uS1;void main(){float k=clamp((vY-uH)/.9,0.,1.);gl_FragColor=vec4(mix(uS0,uS1,k),1.);}';
const VS_PT='attribute vec3 aP;attribute vec3 aN;attribute vec4 aC;uniform mat4 uVP;uniform float uPx,uT;varying vec4 vC;void main(){gl_Position=uVP*vec4(aP,1.);float tw=aN.z>0.?.7+.3*sin(uT*1.7+aN.z*40.):1.;vC=vec4(aC.rgb,aC.a*tw);gl_PointSize=aN.x*uPx*(aN.y>.5?30./max(gl_Position.w,1.):1.);}';
const FS_PT='precision mediump float;varying vec4 vC;void main(){float a=smoothstep(.5,0.,length(gl_PointCoord-.5));gl_FragColor=vec4(vC.rgb*vC.a*a*a,1.);}';
const VS_GLW='attribute vec3 aP;attribute vec4 aC;uniform mat4 uVP,uM;varying vec4 vC;void main(){vC=aC;gl_Position=uVP*uM*vec4(aP,1.);}';
const FS_GLW='precision mediump float;varying vec4 vC;uniform float uA;void main(){gl_FragColor=vec4(vC.rgb*vC.a*uA,1.);}';
const ID4=trs(0,0,0);
/* ---------- 3D 五區地圖（範本 6；引擎沿用範本 3，地形與地標重畫） ---------- */
const TOP=.55,D2R=Math.PI/180,REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
const pastel=s=>{const c=hexs(s);return c.map(v=>v*.9+.07)};
const dark=(c,k=.72)=>c.map(v=>v*k);
const WOOD=hex(0x8a5a36),CREAM=hex(0xfff3e0),GOLD=hex(0xffe08a),PINK=hex(0xffb7d0),RED=hex(0xe8604c),WHITE=hex(0xf7f7ff),STONE=hex(0xc3cae2);
/* 注意：3D 用的座標一律存成 X3／Z3／R3／S3／N3，不可用 x、y——平面地圖（退路）也會在同一批物件上寫 x、y。
   配置：皇城在中央；每區佔一個 72 度扇形，小島排成內外兩圈 */
/* 未建置的科目（lock）先不畫，建好拿掉 lock 就會自動排進來；區數不寫死 */
const VR=R.filter(r=>!r.lock),SW=6.2832/VR.length;
/* 期中評量範圍（老師 2026-11-15 提供）：國語第 1 課～愛閱讀一＝第一、二單元（L1–L6）；數學第 1–5 單元；社會第 1–2 單元；自然第 1–2 單元；
   英語 U1～Review 1（英語尚未建置，建置時把 Review 1 之前的 Unit 數填進 en）。數字＝該科前幾個單元已考。內圈＝已考過、外圈＝下次評量範圍 */
const BAND=14.3;
VR.forEach((r,vi)=>{const n=r.units.length,a=Math.PI/2-vi*SW,ex=r.units.filter(u=>u.ex).length,split=ex>0&&ex<n,inner=split?ex:Math.max(1,Math.floor(n*.4)),outer=n-inner,W=Math.min(SW-.45,1.9);r.a3=a;r.sp3=split;
  /* 國語分單元（範本 12 方案 B）：同一圈裡換單元時多空 G 格，同單元的島排在一起 */
  const G=r.units.some(u=>u.uno)?.75:0,pos=[],tot=[0,0];
  r.units.forEach((u,i)=>{const row=i<inner?0:1,pv=r.units[i-1];if(pv&&(i-1<inner?0:1)===row&&G&&pv.uno!==u.uno)tot[row]+=G;pos[i]=tot[row];tot[row]+=1});
  r.X3=Math.cos(a)*14.5;r.Z3=Math.sin(a)*14.5;
  r.units.forEach((u,i)=>{const row=i<inner?0:1,m=row?outer:inner,rad=row?17.6:11.3,f=m===2?.56:1,span=tot[row]-1,t=a+(m===1?0:(pos[i]/span-.5)*W*f),sp=m===1?9:rad*W*f/span;
    u.E3=split&&row===0;u.R3=Math.max(1.15,Math.min(2.6,sp*.43));u.X3=Math.cos(t)*rad;u.Z3=Math.sin(t)*rad;u.S3=r.ang+i*7.3;
    /* P3 §3.1 島心排在島中央；其餘各關沿弧線排；QC＝弧線缺口（朝皇城）的角度，地標移到那裡 */
    {const q0=Math.atan2(-u.Z3,-u.X3)+.55,nn=u.lv.length-(u.core>=0?1:0);let j=0;u.QC=q0-1.0;
     u.N3=u.lv.map((_,k)=>{if(k===u.core)return{q:u.QC,x:u.X3,z:u.Z3,on:!!u.on[k],core:1};const q=q0+(nn>1?j++/(nn-1)*4.3:0),d=u.R3*.58;return{q,x:u.X3+Math.cos(q)*d,z:u.Z3+Math.sin(q)*d,on:!!u.on[k]}})}})});
/* 可愛風零件（都畫在原點、底面 y=0；c＝該區配色） */
const PR={
  pine:(g,c)=>{g.cyl(0,0,0,.07,.06,.3,5,WOOD);g.cyl(0,.24,0,.36,0,.6,6,c.t1);g.cyl(0,.56,0,.26,0,.5,6,c.t2)},
  bamboo:(g,c)=>{for(const[x,z,h]of[[0,0,1.5],[.2,.12,1.2],[-.16,.16,1]]){for(let k=0;k<3;k++)g.cyl(x,k*h/3,z,.055,.05,h/3-.03,5,k%2?c.t2:c.t1);g.cyl(x+.12,h*.8,z,.2,0,.16,4,c.t2);g.cyl(x-.1,h*.6,z,.18,0,.14,4,c.t1)}},
  inkmt:(g,c)=>{g.cyl(0,0,0,.95,0,1.5,6,c.m1);g.cyl(.75,0,.2,.6,0,.9,5,dark(c.m1,.85));g.cyl(0,1.1,0,.28,0,.42,6,WHITE)},
  pav:(g,c)=>{g.cyl(0,0,0,.7,.7,.1,6,STONE);for(const[x,z]of[[.4,.4],[-.4,.4],[.4,-.4],[-.4,-.4]])g.cyl(x,.1,z,.06,.06,.6,5,RED);g.cyl(0,.7,0,.95,.2,.3,4,c.t1,0,Math.PI/4);g.cyl(0,1,0,.3,0,.3,4,c.t1,0,Math.PI/4);g.ball(0,1.34,0,.08,GOLD,1,6,4)},
  book:(g,c)=>{g.box(0,0,0,1.1,.14,.8,hex(0x7fb2ff));g.box(.05,.14,0,1,.14,.75,RED);g.box(-.03,.28,0,1.05,.14,.78,GOLD);g.box(0,.42,0,.95,.04,.7,WHITE)},
  brush:(g,c)=>{g.cyl(0,0,0,.5,.42,.3,8,hex(0x2a3050));g.cyl(0,.3,0,.36,.36,.02,8,hex(0x10142c));g.at(trs(.15,.2,0,0),()=>{g.cyl(0,.5,0,.07,.07,1.1,5,WOOD);g.cyl(0,.1,0,.02,.11,.4,5,hex(0x2a3050))})},
  crystal:(g,c)=>{for(const[x,z,s]of[[0,0,1],[.35,.1,.6],[-.3,.2,.5]]){g.cyl(x,0,z,.2*s,.26*s,.8*s,6,c.t2,.35);g.cyl(x,.8*s,z,.26*s,0,.4*s,6,c.t2,.5)}},
  cube:(g,c)=>{g.box(0,0,0,.6,.6,.6,c.t2,.1);g.box(.5,0,.3,.4,.4,.4,PINK,.1);g.box(.1,.6,.05,.4,.4,.4,GOLD,.2)},
  gear:(g,c)=>{g.at(new Float32Array([1,0,0,0, 0,0,1,0, 0,-1,0,0, 0,.75,0,1]),()=>{g.cyl(0,-.1,0,.55,.55,.2,10,c.t1,.1);for(let k=0;k<8;k++){const a=k/8*6.2832;g.box(Math.cos(a)*.62,-.1,Math.sin(a)*.62,.2,.2,.2,c.t1,.1)}g.cyl(0,-.13,0,.2,.2,.26,8,GOLD,.4)});g.box(0,0,0,.2,.3,.3,STONE)},
  bars:(g,c)=>{g.box(0,0,0,1.5,.08,.6,hex(0x2a3a55));[3,5,2,6].forEach((v,k)=>g.box(-.54+k*.36,.08,0,.26,v*.2,.3,[hex(0x7fb2ff),GOLD,PINK,hex(0x6fd3a8)][k],.3))},
  pie:(g,c)=>{for(let k=0;k<8;k++){const a0=k/8*6.2832,a1=(k+1)/8*6.2832-.08,col=k<5?GOLD:WHITE,p=(a,y)=>[Math.cos(a)*.75,y,Math.sin(a)*.75];g.tri([0,.3,0],p(a0,.3),p(a1,.3),col,k<5?.3:0);g.quad(p(a0,0),p(a1,0),p(a1,.3),p(a0,.3),dark(col,.8))}},
  protr:(g,c)=>{for(let k=0;k<8;k++){const a0=k/8*Math.PI,a1=(k+1)/8*Math.PI,p=a=>[Math.cos(a)*.8,Math.sin(a)*.8+.05,0];g.tri([0,.05,0],p(a0),p(a1),k%2?c.t2:WHITE,.3);g.tri([0,.05,0],p(a1),p(a0),k%2?c.t2:WHITE,.3)}g.box(0,0,0,1.7,.08,.16,c.t1)},
  tri:(g,c)=>{g.cyl(0,0,0,.75,0,1.1,3,c.t2,.25,.5);g.cyl(.7,0,.3,.4,0,.6,3,GOLD,.25)},
  tower:(g,c)=>{for(let k=0;k<4;k++)g.cyl(0,k*.42,0,.6-k*.11,.56-k*.11,.4,8,k%2?WHITE:c.t2,.12);g.cyl(0,1.68,0,.32,0,.4,8,PINK);g.ball(0,2.12,0,.08,GOLD,1,6,4)},
  sign:(g,c)=>{g.cyl(0,0,0,.05,.05,1.1,5,WOOD);g.box(.25,.75,0,.6,.22,.06,CREAM);g.box(-.22,.45,0,.5,.2,.06,GOLD,.2)},
  drop:(g,c)=>{g.ball(0,.4,0,.4,hex(0x8fd0ff),.35);g.cyl(0,.6,0,.3,0,.6,8,hex(0x8fd0ff),.35);g.box(.7,0,0,.1,.9,.1,WHITE);for(let k=0;k<4;k++)g.box(.78,.15+k*.2,0,.14,.03,.1,c.t1)},
  house:(g,c)=>{g.box(0,0,0,.66,.44,.54,CREAM);g.cyl(0,.44,0,.58,0,.4,4,c.t1,0,Math.PI/4);g.quad([-.1,.1,.275],[.1,.1,.275],[.1,.3,.275],[-.1,.3,.275],GOLD,1)},
  field:(g,c)=>{for(let k=0;k<3;k++)g.box(0,0,-.3+k*.3,1,.05,.24,k%2?GOLD:c.t2)},
  temple:(g,c)=>{g.box(0,0,0,1.2,.14,.9,STONE);g.box(0,.14,0,.9,.5,.6,RED);g.cyl(0,.64,0,1,.3,.3,4,c.t1,0,Math.PI/4);g.cyl(0,.94,0,.4,0,.24,4,GOLD,.3,Math.PI/4)},
  gate:(g,c)=>{g.cyl(-.5,0,0,.07,.07,1.1,6,RED);g.cyl(.5,0,0,.07,.07,1.1,6,RED);g.box(0,1.05,0,1.5,.12,.16,RED);g.box(0,.8,0,1.1,.08,.1,RED);g.box(0,1.17,0,1.7,.06,.2,hex(0x4a3a4a))},
  lantern:(g,c)=>{g.cyl(0,0,0,.04,.04,1.2,5,WOOD);g.box(.2,1.16,0,.5,.05,.05,WOOD);g.ball(.42,.9,0,.22,RED,.6);g.cyl(.42,1.1,0,.08,.08,.06,6,GOLD,.5);g.cyl(.42,.64,0,.08,.08,.06,6,GOLD,.5)},
  broad:(g,c)=>{g.cyl(0,0,0,.1,.08,.5,5,WOOD);g.ball(0,.85,0,.48,c.t1);g.ball(.3,.62,.1,.3,c.t2);g.ball(-.28,.66,-.1,.28,c.t2)},
  volcano:(g,c)=>{g.cyl(0,0,0,1,.35,1.1,7,c.m1);g.cyl(0,1.08,0,.33,.26,.06,7,hex(0xff8f4c),1);g.ball(.1,1.5,0,.16,WHITE,.2,6,4);g.ball(-.05,1.8,.05,.2,WHITE,.2,6,4)},
  flower:(g,c)=>{for(const[x,z,col]of[[0,0,PINK],[.25,.15,GOLD],[-.2,.2,WHITE]]){g.cyl(x,0,z,.025,.025,.3,4,c.t1);g.ball(x,.36,z,.12,col,.3,6,4)}},
  scope:(g,c)=>{for(let k=0;k<3;k++){const a=k/3*6.2832;g.tri([0,.7,0],[Math.cos(a)*.4,0,Math.sin(a)*.4],[Math.cos(a+.25)*.4,0,Math.sin(a+.25)*.4],WOOD)}g.at(new Float32Array([1,0,0,0, 0,.8,.6,0, 0,-.6,.8,0, 0,.7,0,1]),()=>{g.cyl(0,-.4,0,.1,.14,.9,6,WHITE);g.cyl(0,.5,0,.15,.15,.05,6,hex(0x8fd0ff),.8)})},
  palm:(g,c)=>{g.cyl(0,0,0,.08,.06,.9,5,WOOD);for(let k=0;k<5;k++){const a=k/5*6.2832;g.tri([0,.95,0],[Math.cos(a-.3)*.55,.75,Math.sin(a-.3)*.55],[Math.cos(a+.3)*.55,.75,Math.sin(a+.3)*.55],c.t1);g.tri([0,.95,0],[Math.cos(a+.3)*.55,.75,Math.sin(a+.3)*.55],[Math.cos(a-.3)*.55,.75,Math.sin(a-.3)*.55],c.t1)}g.ball(.06,.84,.06,.07,WOOD,0,5,3)},
  balloon:(g,c)=>{g.ball(0,2.2,0,.55,c.t2,.25);g.cyl(0,1.5,0,.14,.4,.35,8,c.t2,.25);g.cyl(0,1.72,0,.56,.56,.1,8,WHITE,.2);g.box(0,1.15,0,.22,.18,.22,WOOD);g.cyl(0,0,0,.015,.015,1.15,3,WHITE)},
  flag:(g,c)=>{g.cyl(0,0,0,.035,.035,1.3,5,WHITE);g.tri([.03,1.3,0],[.03,.95,0],[.6,1.12,0],c.t2,.3);g.tri([.03,1.3,0],[.6,1.12,0],[.03,.95,0],c.t2,.3)},
  sail:(g,c)=>{g.at(trs(0,.1,0,0,1.3,1,.7),()=>g.cyl(0,0,0,.34,.5,.26,6,WOOD));g.cyl(0,.3,0,.03,.03,1,5,WOOD);g.tri([.03,.45,0],[.03,1.3,0],[-.6,.47,0],WHITE,.25);g.tri([.03,.45,0],[-.6,.47,0],[.03,1.3,0],WHITE,.25)},
  lotus:(g,c)=>{g.cyl(0,0,0,.5,.5,.03,9,c.t2);g.cyl(.75,0,.35,.32,.32,.03,8,c.t1);g.cyl(-.5,0,.6,.26,.26,.03,8,c.t2);g.ball(.1,.14,0,.14,PINK,.4,6,4);g.ball(.75,.1,.35,.09,WHITE,.4,6,4)},
  tile:(g,c)=>{[[0,0,c.t2],[.7,.1,GOLD],[.2,.75,PINK],[-.6,.5,c.t2],[.9,.85,WHITE]].forEach(q=>g.box(q[0],0,q[1],.5,.05,.5,q[2],.55))},
  paddy:(g,c)=>{g.box(0,0,0,1.9,.04,1.5,WOOD);[[-.47,-.37,c.t2],[.47,-.37,GOLD],[-.47,.37,GOLD],[.47,.37,c.t2]].forEach(q=>g.box(q[0],.04,q[1],.84,.04,.64,q[2],.12))},
  tuft:(g,c)=>{for(const[x,z]of[[0,0],[.1,.08],[-.09,.06]])g.cyl(x,0,z,.07,0,.22,4,c.t2)},
  stone:(g,c)=>{g.at(trs(0,0,0,0,.2,.12,.16),()=>g.ball(0,.6,0,1,STONE,0,6,4));g.at(trs(.2,0,.1,0,.11,.08,.1),()=>g.ball(0,.6,0,1,dark(STONE,.9),0,6,4))},
  chest:(g,c)=>{g.box(0,0,0,.62,.3,.42,WOOD);g.box(0,.3,0,.66,.16,.46,hex(0xa86b3c));g.box(0,0,0,.1,.47,.44,GOLD,.5);g.box(0,.2,.22,.14,.14,.04,GOLD,1)},
  sakura:(g,c)=>{g.cyl(0,0,0,.08,.06,.5,5,hex(0x6b4a3a));g.ball(0,.8,0,.42,PINK,.12);g.ball(.3,.6,.1,.26,hex(0xffd0e0),.12);g.ball(-.26,.62,-.1,.26,hex(0xffc4d8),.12)}
};
/* 各區的環境景物：ENV＝散在淺灘上的小礁景物、DEC＝貼在水面的裝飾、BACK＝外緣的大型遠景 */
const ENV={zh:['bamboo','bamboo','pine','pav','inkmt','bamboo'],ma:['crystal','crystal','cube','tower','gear','tri'],so:['house','field','lantern','gate','pine','house']};
const DEC={zh:'lotus',ma:'tile',so:'paddy'},BACK={zh:['inkmt','inkmt','pav','inkmt'],ma:['crystal','tower','crystal','tri'],so:['inkmt','temple','house','inkmt']};
/* 分區底座：半透明的淺灘（另一個網格，畫的時候用固定透明度混色），內圈＝已考（偏灰）、外圈＝該區顏色 */
function buildShoal(){const g=new Geo();VR.forEach(r=>{const a0=r.a3-SW/2,a1=r.a3+SW/2,hi=hexs(r.c.t2).map((v,k)=>v*.7+hexs(r.c.land)[k]*.3),lo=hi.map(v=>v*.45+.4);
    if(r.sp3){g.sect(BAND,21.6,a0,a1,1.1,.3,-.2,0,.04,hi,hi);g.sect(8,BAND,a0,a1,1.1,.3,-.2,0,.07,lo,lo)}else g.sect(8,21.6,a0,a1,1.1,.3,-.2,0,.04,hi,hi)});return g}
function put(g,key,c,x,z,rot,s){g.at(trs(x,TOP,z,rot,s),()=>(PR[key]||PR.pine)(g,c))}
/* 考過定期評量的島：靠皇城那一側插一面紅旗 */
function examFlag(g,x,z,R){const d=Math.hypot(x,z),fx=x-x/d*R*.8,fz=z-z/d*R*.8;g.cyl(fx,TOP,fz,.05,.05,1.9,5,WHITE);for(const s of[1,-1])g.tri([fx,TOP+1.9,fz],[fx,TOP+1.25,fz],[fx+s*.001+.75,TOP+1.57,fz],RED,.5);g.tri([fx,TOP+1.9,fz],[fx+.75,TOP+1.57,fz],[fx,TOP+1.25,fz],RED,.5);g.ball(fx,TOP+1.98,fz,.09,GOLD,1,6,4)}
/* 關卡圓台：過關＝金色，未過＝該區顏色；中間一圈白環 */
/* 寶箱：有島心就擺在島心旁（朝皇城那側），沒有就沿用弧線缺口 */
function chestPos(u){const k=u.core>=0?u.R3*.3:u.R3*.58;return[u.X3+Math.cos(u.QC)*k,u.Z3+Math.sin(u.QC)*k]}
/* 島心台：大一號的石台＋菱形寶石；st＝0 未開放（灰）／1 開放（紫）／2 寶箱已開（金） */
function corePad(g,x,z,st,c){const gem=st===2?GOLD:st===1?hex(0xb9a6ff):hex(0x8088a8),em=st?.6:.05;
  g.cyl(x,TOP,z,.62,.5,.2,8,STONE,.05,Math.PI/8);g.cyl(x,TOP+.2,z,.4,.4,.03,8,WHITE,.9,Math.PI/8);
  g.cyl(x,TOP+.25,z,0,.28,.34,4,gem,em,Math.PI/4);g.cyl(x,TOP+.59,z,.28,0,.34,4,gem,em,Math.PI/4)}
function pad(g,x,z,on,c){const b=on?hex(0xf2b34c):c.t1;g.cyl(x,TOP,z,.42,.34,.15,12,b,on?.25:.05);g.cyl(x,TOP+.15,z,.26,.26,.02,12,WHITE,.9);g.cyl(x,TOP+.16,z,.17,.17,.02,12,b,on?.4:.1)}
function lampPost(g,x,z,on,lock){g.cyl(x,TOP,z,.035,.035,.5,5,STONE);g.ball(x,TOP+.62,z,.15,lock?hex(0x8088a8):on?GOLD:WHITE,lock?0:on?1:.25,8,5)}
/* 皇城：日式天守，塔頂就是原本的燈塔 */
function buildCastle(g){const navy=hex(0x3f5fa8),sand=hex(0xf2e2bc);
  g.slab(0,0,blob(4.6,1.7),-.5,1.06,.1,1,hex(0xd8c9a0),sand);g.slab(0,0,blob(4.1,1.7),.1,1,TOP,.97,hex(0x8fc79a),hex(0xb9e3b0));
  g.cyl(0,TOP,0,2.5,2,.9,4,STONE,0,Math.PI/4);
  [[2.5,.9,2.6],[1.9,.75,2],[1.3,.7,1.4]].forEach((t,k)=>{const y=TOP+.9+[0,1.25,2.35][k];g.box(0,y,0,t[0],t[1],t[0],WHITE,.08);g.cyl(0,y+t[1],0,t[2]*.86,t[0]*.36,.34,4,navy,.05,Math.PI/4);
    for(const s of[-1,1])g.quad([s*t[0]*.2-.12,y+.2,t[0]/2+.01],[s*t[0]*.2+.12,y+.2,t[0]/2+.01],[s*t[0]*.2+.12,y+.5,t[0]/2+.01],[s*t[0]*.2-.12,y+.5,t[0]/2+.01],GOLD,1)});
  g.cyl(0,TOP+4.25,0,.3,.26,.45,6,WHITE,.3);g.cyl(0,TOP+4.7,0,.5,0,.36,4,navy,0,Math.PI/4);g.ball(0,TOP+4.5,0,.2,GOLD,1,8,5);
  g.at(trs(0,0,3.3,0,1.5),()=>PR.gate(g,{}));[[3,1.6],[-3,1.8],[2.2,-2.6],[-2.4,-2.4],[3.4,-.4]].forEach((p,i)=>put(g,'sakura',{},p[0],p[1],i,1+i%2*.25));
  for(const a of[.5,1.1,2,2.6])lampPost(g,Math.cos(a)*3.5,Math.sin(a)*3.5+.2,1,0);
  if(TWR.on())buildTower(g,TWX,TWZ)}
/* 百鍊之塔（P3 §5）：皇城左側一座層層疊起的塔，金環＝一層；位置用皇城的區域座標 */
const TWX=-3.5,TWZ=-.2;
function buildTower(g,x,z){const vi=hex(0x7b6fd6),cr=hex(0xf6efe4);g.cyl(x,TOP,z,.78,.68,.4,8,STONE,0,Math.PI/8);
  for(let k=0;k<5;k++){const y=TOP+.4+k*.62,r=.55-k*.06;g.cyl(x,y,z,r,r-.04,.54,8,k%2?vi:cr,.05,Math.PI/8);g.cyl(x,y+.54,z,r+.06,r+.02,.08,8,GOLD,.6,Math.PI/8)}
  const yt=TOP+.4+5*.62;g.cyl(x,yt,z,.36,0,.7,8,vi,.1,Math.PI/8);g.ball(x,yt+.82,z,.12,GOLD,1,8,5)}
function buildStatic(){const g=new Geo();g.at(trs(0,0,0,0,1.25,1.3,1.25),()=>buildCastle(g));
  VR.forEach((r,ri)=>{const c={t1:pastel(r.c.t1),t2:pastel(r.c.t2),m1:pastel(r.c.m1)},land=pastel(r.c.land),edge=pastel(r.c.edge),lk=r.lock?.62:1,sand=hex(0xe9dab0);
    const col=v=>r.lock?v.map(x=>x*.55+.2):v,cc={t1:col(c.t1),t2:col(c.t2),m1:col(c.m1)};
    r.units.forEach((u,ui)=>{const P=blob(u.R3,u.S3),rr=rng(ri*131+ui*17+3);
      g.slab(u.X3,u.Z3,P,-.5,1.12,.12,1.04,dark(sand,lk),dark(sand,lk));g.slab(u.X3,u.Z3,P,.12,1,TOP,.94,col(edge),col(land));
      {const hc=u.core>=0,lx=hc?u.X3+Math.cos(u.QC)*u.R3*.66:u.X3,lz=hc?u.Z3+Math.sin(u.QC)*u.R3*.66:u.Z3;
       g.at(trs(lx,TOP,lz,-Math.atan2(u.Z3,u.X3)+Math.PI/2,(hc?.55:.9)*u.R3/2.2),()=>(PR[u.lm]||PR.pine)(g,cc))}
      const n=Math.round(8+u.R3*4),GK=['tuft','tuft','stone','flower'];for(let k=0;k<n;k++){const a=rr()*6.2832,d=u.R3*(.2+rr()*.66);if(u.N3.some(nd=>Math.hypot(nd.x-u.X3-Math.cos(a)*d,nd.z-u.Z3-Math.sin(a)*d)<.55))continue;put(g,GK[Math.floor(rr()*GK.length)],cc,u.X3+Math.cos(a)*d,u.Z3+Math.sin(a)*d,rr()*6.28,(.5+rr()*.3)*Math.min(1,u.R3/1.9))}
      {const kit2=ENV[r.id]||r.gl,d=u.R3*.58,sc=.62*Math.min(1.15,u.R3/2.1),dot=(x,z)=>g.ball(x,TOP+.05,z,.065,WHITE,.9,5,3);
        u.N3.forEach((nd,k)=>{if(nd.core){corePad(g,nd.x,nd.z,u.chest?2:u.open?1:0,cc);return}pad(g,nd.x,nd.z,nd.on,cc);const t=u.lv[k],key=/統整/.test(t)?'book':/愛閱讀/.test(t)?'lantern':kit2[(k+ui*2)%kit2.length];
          put(g,key,cc,u.X3+Math.cos(nd.q)*u.R3*.82,u.Z3+Math.sin(nd.q)*u.R3*.82,rr()*6.28,sc);
          if(k&&!u.N3[k-1].core){const q0=u.N3[k-1].q,m=Math.max(2,Math.round((nd.q-q0)*d/.3));for(let i=1;i<m;i++){const q=q0+(nd.q-q0)*i/m,x=u.X3+Math.cos(q)*d,z=u.Z3+Math.sin(q)*d;if(Math.hypot(x-nd.x,z-nd.z)>.5&&Math.hypot(x-u.N3[k-1].x,z-u.N3[k-1].z)>.5)dot(x,z)}}});
        const n0=u.N3[0];if(n0){const qe=n0.q-.55;for(let i=0;i<3;i++){const f=i/3;dot(u.X3+Math.cos(qe)*u.R3*.9*(1-f)+(n0.x-u.X3)*f,u.Z3+Math.sin(qe)*u.R3*.9*(1-f)+(n0.z-u.Z3)*f)}
          const cp=chestPos(u);put(g,'chest',cc,cp[0],cp[1],-u.QC+Math.PI/2,.75*Math.min(1.1,u.R3/2.1))}}
      if(u.E3)examFlag(g,u.X3,u.Z3,u.R3)});
    {const er=rng(ri*991+7),kit=ENV[r.id]||r.gl,dec=DEC[r.id],bk=BACK[r.id]||r.gl;
      for(let ia=0;ia<7;ia++)for(let ir=0;ir<4;ir++){if(er()<.12)continue;const rad=9.4+(ir+.15+er()*.7)/4*11.8,dt=((ia+.15+er()*.7)/7-.5)*(SW-.45),t=r.a3+dt,x=Math.cos(t)*rad,z=Math.sin(t)*rad;
        if(rad<10.2&&Math.abs(dt)<.2)continue;if(r.units.some(u=>Math.hypot(u.X3-x,u.Z3-z)<u.R3*1.15+1.1))continue;
        if(dec&&er()<.38)g.at(trs(x,.08,z,er()*6.28,.8+er()*.7),()=>PR[dec](g,cc));
        else{const sz=.55+er()*.5;g.slab(x,z,blob(sz,er()*9,10),-.3,1.15,.3,.9,col(edge),col(land));g.at(trs(x,.3,z,er()*6.28,.7+er()*.6),()=>PR[kit[Math.floor(er()*kit.length)]](g,cc))}}
      for(let k=0;k<4;k++){const t=r.a3+((k+.5)/4-.5)*(SW-.4),rad=23+er()*.8,x=Math.cos(t)*rad,z=Math.sin(t)*rad;
        g.slab(x,z,blob(1.5,k+ri*3,12),-.3,1.1,.3,.9,col(edge),col(land));g.at(trs(x,.3,z,er()*6.28,1.9+er()*.5),()=>PR[bk[k%bk.length]](g,cc))}}
    {const pts=[{X3:Math.cos(r.a3)*8.6,Z3:Math.sin(r.a3)*8.6,R3:0}].concat(r.units);for(let k=1;k<pts.length;k++){const A=pts[k-1],B=pts[k],L=Math.hypot(B.X3-A.X3,B.Z3-A.Z3),m=Math.round(L/.75);
        for(let i=1;i<m;i++){const x=A.X3+(B.X3-A.X3)*i/m,z=A.Z3+(B.Z3-A.Z3)*i/m;if(r.units.some(u=>Math.hypot(u.X3-x,u.Z3-z)<u.R3*1.15+.2))continue;g.ball(x,.14,z,.1,WHITE,.9,5,3)}}}
    /* 橋：皇城 → 該區第一座內圈島 */
    const a=r.a3,d0=5.3,d1=8.5,L=d1-d0;
    g.at(trs(Math.cos(a)*(d0+L/2),0,Math.sin(a)*(d0+L/2),-a),()=>{g.box(0,.42,0,L,.1,.6,WOOD);for(let k=0;k<=4;k++)for(const s of[-1,1])g.cyl(-L/2+k*L/4,.1,s*.28,.05,.05,.65,5,RED)})});
  /* 外圈小礁與鳥居 */
  const rr=rng(77);for(let k=0;k<7;k++){const a=k/7*6.2832+.2,d=27+rr()*2;g.slab(Math.cos(a)*d,Math.sin(a)*d,blob(.5+rr()*.4,k),-.4,1.1,.3,.8,hex(0x8f98b8),hex(0xb9e3b0));if(k%3===0)g.at(trs(Math.cos(a)*d,-.1,Math.sin(a)*d,k,.9),()=>PR.gate(g,{}))}
  return g}
const PINS=[];let nextU=null;
function initWorld(){
  const cv=$('#gl'),stage=$('#stage');let gl=null;try{gl=cv.getContext('webgl',{antialias:true,alpha:false})}catch(e){}
  if(!gl)return false;
  const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o};
  const prog=(v,f)=>{const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,v));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,f));['aP','aN','aC'].forEach((a,i)=>gl.bindAttribLocation(p,i,a));gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));const u={},n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);for(let i=0;i<n;i++){const nm=gl.getActiveUniform(p,i).name;u[nm]=gl.getUniformLocation(p,nm)}return{p,u}};
  let P;try{P={lit:prog(VS_LIT,FS_LIT),wat:prog(VS_WAT,FS_WAT),sky:prog(VS_SKY,FS_SKY),pt:prog(VS_PT,FS_PT),glw:prog(VS_GLW,FS_GLW)}}catch(e){console.error(e);return false}
  const mesh=(arr,n)=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),gl.STATIC_DRAW);return{b,n}},gm=g=>mesh(g.v,g.n);
  const use=m=>{gl.bindBuffer(gl.ARRAY_BUFFER,m.b);gl.vertexAttribPointer(0,3,gl.FLOAT,false,40,0);gl.vertexAttribPointer(1,3,gl.FLOAT,false,40,12);gl.vertexAttribPointer(2,4,gl.FLOAT,false,40,24)};
  [0,1,2].forEach(i=>gl.enableVertexAttribArray(i));
  const st=buildStars(),sg=buildStatic();W3.tris=Math.round(sg.n/3);
  const MS={stat:gm(sg),owl:gm(buildOwl()),boat:gm(buildBoat()),beam:gm(buildBeam()),sky:gm(buildSky()),wat:gm(buildWater()),stars:mesh(st.v,st.n),shoal:gm(buildShoal())};
  const Lg=[.45,.8,.35],ll=Math.hypot(...Lg),LDIR=Lg.map(v=>v/ll),FOG=SZ.sky[0],LH={x:0,y:(TOP+4.5)*1.3,z:0};
  function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;const d=Math.min(window.devicePixelRatio||1,[1.5,1,.75][W3.q]);
    W3.w=w;W3.h=h;W3.dpr=d;W3.asp=w/h;cv.width=Math.round(w*d);cv.height=Math.round(h*d);FX.size(w,h);if(view.k==='world'&&!CAM.touched){CAM.r=fitR();if(CAM.goal)CAM.goal.r=CAM.r}}
  const eye=()=>{const sw=(!REDUCED&&!CAM.touched&&view.k==='world')?Math.sin(W3.t*.13)*.14:0,a=CAM.az+sw,ce=Math.cos(CAM.el);return[CAM.tx+Math.sin(a)*ce*CAM.r,Math.sin(CAM.el)*CAM.r,CAM.tz+Math.cos(a)*ce*CAM.r]};
  let VP=ID4;
  W3.proj=(x,y,z)=>{const m=VP,w=m[3]*x+m[7]*y+m[11]*z+m[15];if(w<=.1)return null;return[((m[0]*x+m[4]*y+m[8]*z+m[12])/w*.5+.5)*W3.w,(1-((m[1]*x+m[5]*y+m[9]*z+m[13])/w*.5+.5))*W3.h]};
  let last=0,fc=0,ft=0,low=0;
  function frame(ms){requestAnimationFrame(frame);if(document.hidden||!stage.offsetParent)return;const dt=Math.min(.1,(ms-last)/1000||0);last=ms;W3.t+=dt;
    fc++;ft+=dt;if(ft>=1){const fps=Math.round(fc/ft);$('#fps').textContent='每秒 '+fps+' 幀・'+['高','中','低'][W3.q]+'畫質・約 '+W3.tris+' 面';if(fps<26&&W3.q<2){if(++low>=2){W3.q++;low=0;resize()}}else low=0;fc=0;ft=0}
    if(CAM.goal){const g=CAM.goal,k=REDUCED?1:1-Math.exp(-dt*3.4);let d=0;for(const p of['az','el','r','tx','tz']){const dv=g[p]-CAM[p];CAM[p]+=dv*k;d+=Math.abs(dv)}if(d<.01)CAM.goal=null}
    const e=eye(),V=look(e,[CAM.tx,.6,CAM.tz]);VP=mul(persp(FOV,W3.asp,.5,900),V);
    gl.viewport(0,0,cv.width,cv.height);gl.clearColor(SZ.sky[1][0],SZ.sky[1][1],SZ.sky[1][2],1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const lhi=1.1,fogD=.0075,T=REDUCED?0:W3.t;
    gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.disable(gl.BLEND);
    gl.useProgram(P.sky.p);const pitch=Math.asin(Math.min(1,(e[1]-.6)/CAM.r));gl.uniform1f(P.sky.u.uH,Math.tan(pitch)/Math.tan(FOV/2));gl.uniform3fv(P.sky.u.uS0,SZ.sky[0]);gl.uniform3fv(P.sky.u.uS1,SZ.sky[1]);use(MS.sky);gl.drawArrays(gl.TRIANGLES,0,6);
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.useProgram(P.pt.p);gl.uniformMatrix4fv(P.pt.u.uVP,false,VP);gl.uniform1f(P.pt.u.uPx,W3.dpr);gl.uniform1f(P.pt.u.uT,T);use(MS.stars);gl.drawArrays(gl.POINTS,0,MS.stars.n);
    gl.disable(gl.BLEND);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);
    gl.useProgram(P.wat.p);let u=P.wat.u;gl.uniformMatrix4fv(u.uVP,false,VP);gl.uniform3fv(u.uL,LDIR);gl.uniform3fv(u.uCam,e);gl.uniform3fv(u.uFog,FOG);gl.uniform3f(u.uLH,LH.x,LH.y,LH.z);gl.uniform1f(u.uT,T);gl.uniform1f(u.uLHi,lhi);gl.uniform1f(u.uFogD,fogD);gl.uniform3fv(u.uW0,SZ.wat[0]);gl.uniform3fv(u.uW1,SZ.wat[1]);use(MS.wat);gl.drawArrays(gl.TRIANGLES,0,6);
    gl.useProgram(P.lit.p);u=P.lit.u;gl.uniformMatrix4fv(u.uVP,false,VP);gl.uniform3fv(u.uL,LDIR);gl.uniform3fv(u.uCam,e);gl.uniform3fv(u.uFog,FOG);gl.uniform3f(u.uLH,LH.x,LH.y,LH.z);gl.uniform1f(u.uLHi,lhi);gl.uniform1f(u.uFogD,fogD);gl.uniform3fv(u.uTint,SZ.tint);gl.uniform3fv(u.uLeaf,SZ.leaf);gl.uniform1f(u.uLeafK,SZ.leafK);gl.uniform1f(u.uSnow,SZ.snow);gl.uniform1f(u.uTop,TOP*1.0);
    const draw=(m,M)=>{gl.uniformMatrix4fv(u.uM,false,M);use(m);gl.drawArrays(gl.TRIANGLES,0,m.n)};
    draw(MS.stat,ID4);
    if(nextU)draw(MS.owl,trs(nextU.x,TOP+.01+Math.abs(Math.sin(T*2.2))*.09,nextU.z,Math.sin(T*.8)*.35+Math.atan2(nextU.x,nextU.z),.9));
    [[25.6,.035,0,1.1],[6.85,-.09,2,.7]].forEach((b,i)=>{const a=T*b[1]+b[2],x=Math.cos(a)*b[0],z=Math.sin(a)*b[0],s=Math.sign(b[1]);draw(MS.boat,trs(x,.05+Math.sin(T*1.6+i)*.04,z,Math.atan2(-Math.cos(a)*s,-Math.sin(a)*s),b[3]))});
    gl.enable(gl.BLEND);gl.blendColor(0,0,0,.4);gl.blendFunc(gl.CONSTANT_ALPHA,gl.ONE_MINUS_CONSTANT_ALPHA);gl.depthMask(false);draw(MS.shoal,ID4);
    gl.blendFunc(gl.ONE,gl.ONE);
    gl.useProgram(P.glw.p);gl.uniformMatrix4fv(P.glw.u.uVP,false,VP);gl.uniformMatrix4fv(P.glw.u.uM,false,trs(LH.x,LH.y,LH.z,T*.35));gl.uniform1f(P.glw.u.uA,.22);use(MS.beam);gl.drawArrays(gl.TRIANGLES,0,MS.beam.n);
    gl.disable(gl.BLEND);gl.depthMask(true);
    updatePins();FX.step(dt,T)}
  const ptr=new Map();let moved=0,pinch=0;
  cv.addEventListener('pointerdown',ev=>{cv.setPointerCapture(ev.pointerId);ptr.set(ev.pointerId,[ev.clientX,ev.clientY]);moved=0;if(ptr.size===2){const a=[...ptr.values()];pinch=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1])}});
  cv.addEventListener('pointermove',ev=>{const p=ptr.get(ev.pointerId);if(!p)return;const dx=ev.clientX-p[0],dy=ev.clientY-p[1];ptr.set(ev.pointerId,[ev.clientX,ev.clientY]);
    if(ptr.size===1){moved+=Math.abs(dx)+Math.abs(dy);if(moved>4){CAM.goal=null;CAM.touched=true;CAM.az-=dx*.006;CAM.el=Math.max(.16,Math.min(1.3,CAM.el+dy*.005))}}
    else if(ptr.size===2){const a=[...ptr.values()],d=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);if(pinch){CAM.goal=null;CAM.touched=true;CAM.r=Math.max(6,Math.min(95,CAM.r*pinch/d))}pinch=d}});
  const up=ev=>{ptr.delete(ev.pointerId);pinch=0};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',ev=>{ev.preventDefault();CAM.goal=null;CAM.touched=true;CAM.r=Math.max(6,Math.min(95,CAM.r*Math.exp(ev.deltaY*.0012)))},{passive:false});
  window.addEventListener('resize',resize);W3.resize=resize;if(window.ResizeObserver)new ResizeObserver(resize).observe(stage);
  W3.refresh=()=>{R.forEach(r=>r.units.forEach(u=>u.N3.forEach((nd,k)=>nd.on=!!u.on[k])));gl.deleteBuffer(MS.stat.b);const sg2=buildStatic();W3.tris=Math.round(sg2.n/3);MS.stat=gm(sg2);buildPins()};
  W3.ok=true;FX.init(stage);buildPins();resize();CAM.el=.95;CAM.r=fitR();CAM.tx=0;CAM.tz=2;frame(performance.now());return true}
function fitR(){return Math.max(55,61/(W3.asp||1.5))}
function near(a){let d=(a-CAM.az)%6.2832;if(d>Math.PI)d-=6.2832;if(d<-Math.PI)d+=6.2832;return CAM.az+d}
function cam3(v){if(!W3.ok)return;const r=R.find(x=>x.id===v.r);if(r&&r.lock)v={k:'world'};
  if(v.k==='world'){CAM.touched=false;CAM.goal={az:near(0),el:.95,r:fitR(),tx:0,tz:2}}
  else if(v.k==='castle')CAM.goal={az:near(0),el:.5,r:17,tx:0,tz:0};
  else if(v.k==='tower')CAM.goal={az:near(-.5),el:.42,r:23,tx:TWX*1.25,tz:TWZ*1.25}; /* 從左前方看塔，塔頂名牌不被麵包屑擋住 */
  else if(v.k==='region')CAM.goal={az:near(Math.atan2(r.X3,r.Z3)),el:1.14,r:Math.max(38,50/(W3.asp||1.5)),tx:r.X3,tz:r.Z3};
  else{const u=r.units[v.u];CAM.goal={az:near(Math.atan2(u.X3,u.Z3)),el:.95,r:Math.max(9,u.R3*5.2/Math.min(1.4,W3.asp||1.5)),tx:u.X3,tz:u.Z3}}
  if(v.k!=='world')CAM.touched=true;PINS.forEach(p=>p.el.classList.toggle('cur',v.k==='level'&&p.k==='lv'&&p.r===v.r&&p.u===v.u&&p.l===v.l))}
function buildPins(){const UC=['#e9b87a','#8fc7a8','#9fb3ea','#e6a0c4'];/* 單元看板配色，島標籤外框同色 */const box=$('#pins');box.innerHTML='';PINS.length=0;
  const add=(k,o,html,cls,fn)=>{const b=document.createElement('button');b.className='pin '+cls;b.innerHTML=html;b.onclick=fn;b.style.display='none';box.appendChild(b);PINS.push(Object.assign({k,el:b},o));return b};
  add('castle',{p:[0,(TOP+5.2)*1.3,0]},'🏯 皇城<small>我的自學情況</small>','pc',()=>go({k:'castle'}));
  if(TWR.on())add('tower',{p:[TWX*1.25,(TOP+4.4)*1.3,TWZ*1.25]},`🗼 百鍊之塔<small>${TWR.top()?'第 '+TWR.top()+' 層':'數學算力'}</small>`,'pc pt',()=>go({k:'tower'}));
  VR.forEach(r=>{add('reg',{r:r.id,p:[r.X3*1.05,3.4,r.Z3*1.05]},`<i style="background:${r.c.t1}"></i><b>${r.name}</b>・${r.zone}<small>${r.lock?'待建':r.done+'／'+r.total+' 關'}</small>`,'pr'+(r.lock?' lk':''),()=>go({k:'region',r:r.id}));
    /* 單元看板：國語每個單元一塊，立在該單元島群的外側 */
    const grp={};r.units.forEach(u=>{if(u.uno)(grp[u.uno]=grp[u.uno]||[]).push(u)});
    Object.values(grp).forEach(us=>{const x=us.reduce((s,u)=>s+u.X3,0)/us.length,z=us.reduce((s,u)=>s+u.Z3,0)/us.length,d=Math.hypot(x,z)||1,R=Math.max(...us.map(u=>u.R3))+1.4,k=(d<14?d-R:d+R)/d; /* 內圈往皇城側、外圈往外側，避開另一圈的標籤 */
      add('unit',{r:r.id,p:[x*k,TOP+.4,z*k]},us[0].ul,'pu',()=>go({k:'region',r:r.id})).style.background=UC[(us[0].uno-1)%UC.length]});
    r.units.forEach((u,ui)=>{add('isl',{r:r.id,u:ui,p:[u.X3,TOP+2.3*u.R3/2.2+1+(r.units.length>6&&ui%2?1.5:0),u.Z3]},`${u.un}${r.sp3?(u.E3?'<em>已考</em>':'<em class="now">本次</em>'):''}<small>${r.lock?u.u:u.done+'／'+u.total}</small>`,'pi'+(r.lock?' lk':''),()=>r.lock?go({k:'region',r:r.id}):go({k:'island',r:r.id,u:ui}));
      if(u.N3[0]){const cp=chestPos(u),open=u.chest;add('chest',{r:r.id,u:ui,p:[cp[0],TOP+.6,cp[1]]},open?'🎁 寶箱打開了':'🔒 寶箱','pl ch'+(open?' on':''),()=>pChest(r,ui))}
      u.N3.forEach((nd,li)=>add('lv',{r:r.id,u:ui,l:li,p:[nd.x,TOP+(nd.core?1.1:.7),nd.z]},nd.core?`${u.open?'💠':'🔒'} 島心試煉${u.open?'':'<small>還差 '+u.left+' 關</small>'}`:`<span class="no">${u.keys[li]}</span>${u.pin[li]}`,'pl'+(nd.core?' core'+(u.open?'':' lk'):'')+(nd.on?' on':''),()=>go({k:'level',r:r.id,u:ui,l:li})))})});
  PINS.forEach(p=>{if(p.k!=='isl')return;const u=VR.find(r=>r.id===p.r).units[p.u];if(u.uno){p.el.style.borderColor=UC[(u.uno-1)%UC.length];p.el.style.borderWidth='3px'}});
  nextU=null;for(const r of R){if(r.lock)continue;const u=r.units.find(u=>u.done<u.total);if(u){const nd=u.N3.find(n=>!n.on)||u.N3[0];nextU={x:nd.x+.3,z:nd.z+.3};break}}}
function updatePins(){const v=view,vis=[];for(const p of PINS){let show=false;
    if(v.k==='world'||v.k==='castle'||v.k==='tower')show=p.k==='reg'||p.k==='castle'||p.k==='tower';
    else if(v.k==='region')show=(p.k==='isl'||p.k==='unit')&&p.r===v.r;
    else show=(p.k==='lv'||p.k==='chest')&&p.r===v.r&&p.u===v.u;
    const s=show?W3.proj(p.p[0],p.p[1],p.p[2]):null;
    if(s&&s[0]>-40&&s[0]<W3.w+40&&s[1]>0&&s[1]<W3.h+10){if(p.el.style.display){p.el.style.display='';p.wd=0}if(!p.wd){p.wd=p.el.offsetWidth;p.ht=p.el.offsetHeight}vis.push({p,x:s[0],y:s[1]})}else p.el.style.display='none'}
  /* 防重疊：由畫面下方（離鏡頭近）往上逐一擺放，撞到已擺好的名牌就往上錯開 */
  vis.sort((a,b)=>b.y-a.y);const put=[];
  for(const o of vis){const w=o.p.wd,h=o.p.ht,l=o.x-w/2;let t=o.y-h;
    for(let n=0;n<12;n++){const hit=put.find(q=>l<q.l+q.w+3&&l+w+3>q.l&&t<q.t+q.h+2&&t+h+2>q.t);if(!hit)break;t=hit.t-h-2}
    put.push({l,t,w,h});o.p.el.style.transform=`translate(${l.toFixed(1)}px,${t.toFixed(1)}px)`}}

return{initWorld,cam3,W3,CAM}})();
$('#stage').hidden=false;let ok=false;try{ok=M3.initWorld()}catch(e){console.error(e)}
  if(!ok){$('#stage').hidden=true;M3=null;return false}
  document.querySelector('.map').classList.add('gl');return true}

