/* ---------- （搬自範本 10）各區背景音樂＋成套音效（全部由程式合成，沒有音檔） ---------- */
const MUS=(()=>{
const hz=m=>440*Math.pow(2,(m-69)/12);
let on=false,armed=false,bus=null,sfxOut=null,ana=null,noiseBuf=null,cur='home',playing=null,step=0,nextT=0,timer=null,swT=0,duck=false;
try{on=localStorage.getItem('so-music')==='1'}catch(e){}
function ctx(){const A=G8.unlock();if(!A)return null;
  if(!bus){const lp=A.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3800;bus=A.createGain();bus.gain.value=0;bus.connect(lp);lp.connect(A.destination);
    sfxOut=A.createGain();sfxOut.gain.value=1;sfxOut.connect(A.destination);
    ana=A.createAnalyser();ana.fftSize=2048;lp.connect(ana);sfxOut.connect(ana);
    const n=A.sampleRate*.2|0;noiseBuf=A.createBuffer(1,n,A.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1}
  return A}
/* 一個音：f 頻率、dur 長度、vol 音量；o.sus＝持續音（笛、手風琴），否則是撥弦／敲擊的自然衰減 */
function tone(A,out,t,f,dur,vol,type,o={}){const os=A.createOscillator(),g=A.createGain();os.type=type||'sine';os.frequency.setValueAtTime(f,t);if(o.det)os.detune.value=o.det;
  if(o.to)os.frequency.exponentialRampToValueAtTime(o.to,t+Math.min(dur,o.glide||dur));
  if(o.vib){const l=A.createOscillator(),lg=A.createGain();l.frequency.value=5.2;lg.gain.value=f*.007;l.connect(lg);lg.connect(os.frequency);l.start(t+.12);l.stop(t+dur+.1)}
  const a=o.a||.008;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+a);
  if(o.sus){g.gain.setValueAtTime(vol,t+Math.max(a+.001,dur*.75));g.gain.linearRampToValueAtTime(.0001,t+dur)}else g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  os.connect(g);g.connect(out);os.start(t);os.stop(t+dur+.06)}
/* 樂器（合成的近似音色）：參數＝(A,輸出,時間,音高,音量倍率,長度) */
const I={
 harp:(A,o,t,m,v=1)=>{tone(A,o,t,hz(m),1.4,.085*v,'triangle');tone(A,o,t,hz(m)*2,.5,.02*v,'sine')},
 zheng:(A,o,t,m,v=1)=>{tone(A,o,t,hz(m)*1.035,1.6,.09*v,'triangle',{to:hz(m),glide:.09});tone(A,o,t,hz(m)*3,.25,.018*v,'sine')},
 flute:(A,o,t,m,v=1,d=.6)=>{tone(A,o,t,hz(m),d,.075*v,'sine',{sus:1,a:.07,vib:1});tone(A,o,t,hz(m)*2,d,.012*v,'sine',{sus:1,a:.09})},
 box:(A,o,t,m,v=1)=>{tone(A,o,t,hz(m),1.1,.075*v,'sine');tone(A,o,t,hz(m)*4,.18,.02*v,'sine')},
 bell:(A,o,t,m,v=1)=>{tone(A,o,t,hz(m),1.8,.06*v,'sine');tone(A,o,t,hz(m)*2.76,.9,.016*v,'sine')},
 guitar:(A,o,t,m,v=1)=>{tone(A,o,t,hz(m),1.0,.065*v,'triangle');tone(A,o,t,hz(m),.45,.018*v,'sawtooth')},
 whistle:(A,o,t,m,v=1,d=.5)=>tone(A,o,t,hz(m),d,.06*v,'sine',{sus:1,a:.04,vib:1}),
 marimba:(A,o,t,m,v=1)=>{tone(A,o,t,hz(m),.45,.1*v,'sine');tone(A,o,t,hz(m)*4,.07,.03*v,'sine')},
 accordion:(A,o,t,m,v=1,d=.4)=>{tone(A,o,t,hz(m),d,.02*v,'square',{sus:1,a:.035,det:7});tone(A,o,t,hz(m),d,.02*v,'square',{sus:1,a:.035,det:-7})},
 bass:(A,o,t,m,v=1,d=.6)=>tone(A,o,t,hz(m),d,.08*v,'triangle'),
 pad:(A,o,t,m,v=1,d=2)=>tone(A,o,t,hz(m),d,.02*v,'triangle',{sus:1,a:.5}),
 tick:(A,o,t,f,v=1)=>tone(A,o,t,f,.03,.018*v,'square'),
 shake:(A,o,t,v=1)=>{const s=A.createBufferSource(),g=A.createGain(),h=A.createBiquadFilter();h.type='highpass';h.frequency.value=2600;s.buffer=noiseBuf;g.gain.setValueAtTime(.035*v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.07);s.connect(h);h.connect(g);g.connect(o);s.start(t);s.stop(t+.1)},
 /* 百鍊之塔：太鼓（音高往下掉的低鼓）、鐵砧（不和諧泛音的金屬清響）、銅管（兩支微走音鋸齒波長音） */
 taiko:(A,o,t,v=1)=>{tone(A,o,t,120,.38,.16*v,'sine',{to:48,glide:.3});const s=A.createBufferSource(),g=A.createGain(),h=A.createBiquadFilter();h.type='lowpass';h.frequency.value=900;s.buffer=noiseBuf;g.gain.setValueAtTime(.05*v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.06);s.connect(h);h.connect(g);g.connect(o);s.start(t);s.stop(t+.1)},
 anvil:(A,o,t,m,v=1)=>{tone(A,o,t,hz(m),.9,.05*v,'sine');tone(A,o,t,hz(m)*2.76,.35,.022*v,'sine');tone(A,o,t,hz(m)*5.4,.12,.012*v,'sine')},
 brass:(A,o,t,m,v=1,d=.6)=>{tone(A,o,t,hz(m),d,.022*v,'sawtooth',{sus:1,a:.06,det:5});tone(A,o,t,hz(m),d,.022*v,'sawtooth',{sus:1,a:.06,det:-5});tone(A,o,t,hz(m),d,.03*v,'triangle',{sus:1,a:.05,vib:1})},
 chirp:(A,o,t,v=1)=>{tone(A,o,t,2300,.09,.02*v,'sine',{to:3300});tone(A,o,t+.13,2500,.09,.02*v,'sine',{to:3500})}
};
const M=(...b)=>b.flat();
/* 分解和弦：pat 的 0–2＝和弦三個音，3–5＝高八度，null＝休息 */
const arp=(inst,pat,oct,v)=>(A,o,t,i,ch)=>{const p=pat[i];if(p==null)return;I[inst](A,o,t,(p<3?ch[p]:ch[p-3]+12)+oct,v)};
/* 六套主題。mel＝旋律（每格一個八分音符；數字＝音高，[音高,幾格]＝長音，0＝休息） */
const TH={
 home:{name:'皇城・主畫面',look:'皇城與世界地圖',music:'豎琴分解和弦＋鐘琴旋律，C 大調，安穩明亮',tempo:80,sfx:'豎琴',bpm:80,spb:8,melI:'bell',
  ch:[[48,52,55],[45,48,52],[41,45,48],[43,47,50],[48,52,55],[40,43,47],[41,45,48],[43,47,50]],
  acc(A,o,t,i,ch,sd){arp('harp',[0,1,2,3,2,1,2,1],12,.8)(A,o,t,i,ch);if(i===0){I.bass(A,o,t,ch[0],1,sd*6);ch.forEach(m=>I.pad(A,o,t,m+12,1,sd*8))}},
  mel:M([76,0,0,79,0,0,84,0],[81,0,0,79,0,76,0,0],[77,0,0,81,0,0,84,0],[83,0,81,0,79,0,0,0],[76,0,0,79,0,0,84,0],[83,0,0,79,0,76,0,0],[77,0,81,0,84,0,81,0],[79,0,0,0,0,0,0,0])},
 zh:{name:'國語・墨竹書鄉',look:'竹林、遠山、書院亭——水墨山水',music:'五聲音階，古箏撥弦＋竹笛長音，慢而留白',tempo:66,sfx:'古箏',bpm:66,spb:8,melI:'flute',melOct:-12,
  ch:[[45,52,57],[48,55,60],[50,57,62],[45,52,57],[48,55,60],[43,50,55],[50,57,62],[45,52,57]],
  acc(A,o,t,i,ch,sd){arp('zheng',[0,null,2,null,1,2,3,null],12,.9)(A,o,t,i,ch);if(i===0)I.pad(A,o,t,ch[0]+12,1.2,sd*8)},
  mel:M([[81,3],0,0,[84,1],[86,4],0,0,0],[[88,2],0,[86,1],[84,1],[81,4],0,0,0],[[79,2],0,[81,2],0,[84,3],0,0,[86,1]],[[81,6],0,0,0,0,0,0,0],
        [[84,2],0,[86,2],0,[88,3],0,0,[91,1]],[[88,2],0,[86,2],0,[84,4],0,0,0],[[81,1],[84,1],[86,2],0,[84,2],0,[79,2],0],[[81,7],0,0,0,0,0,0,0])},
 ma:{name:'數學・晶礦機關城',look:'水晶、方塊、齒輪——幾何與機關',music:'音樂盒分解和弦＋水晶鐘聲＋鐘錶滴答，規律而清亮',tempo:100,sfx:'音樂盒',bpm:100,spb:8,melI:'bell',
  ch:[[48,52,55],[50,54,57],[52,55,59],[50,54,57],[48,52,55],[47,50,54],[52,55,59],[50,54,57]],
  acc(A,o,t,i,ch,sd){arp('box',[0,2,1,3,2,1,3,2],24,.95)(A,o,t,i,ch);if(i%2===0)I.tick(A,o,t,i%4?1500:1900);if(i===0)I.bass(A,o,t,ch[0],1,sd*4)},
  mel:M([79,0,0,0,78,0,0,0],[81,0,0,0,78,0,74,0],[79,0,0,0,83,0,0,0],[81,0,78,0,74,0,0,0],[76,0,0,0,79,0,0,0],[78,0,0,0,74,0,71,0],[76,0,79,0,83,0,0,0],[81,0,0,0,0,0,0,0])},
 so:{name:'社會・家鄉聚落',look:'屋舍、田地、廟埕、牌樓——暖色鄉鎮',music:'木吉他分解和弦＋口哨旋律，G 大調，溫暖親切',tempo:92,sfx:'木吉他',bpm:92,spb:8,melI:'whistle',
  ch:[[43,47,50],[40,43,47],[48,52,55],[50,54,57],[43,47,50],[40,43,47],[48,52,55],[43,47,50]],
  acc(A,o,t,i,ch,sd){arp('guitar',[0,2,1,2,3,2,1,2],12,1)(A,o,t,i,ch);if(i===0||i===4)I.bass(A,o,t,ch[0]+(i?7:0),.9,sd*3)},
  mel:M([[74,2],0,[76,1],[74,1],[71,2],0,[67,2],0],[[69,2],0,[71,2],0,[67,4],0,0,0],[[72,2],0,[76,1],[74,1],[72,2],0,[69,2],0],[[74,6],0,0,0,0,0,0,0],
        [[74,2],0,[76,1],[79,1],[78,2],0,[74,2],0],[[76,2],0,[74,2],0,[71,4],0,0,0],[[72,2],0,[71,1],[69,1],[67,2],0,[69,2],0],[[67,6],0,0,0,0,0,0,0])},
 sc:{name:'自然・雨林觀測站',look:'闊葉林、火山、觀測鏡——生態探險',music:'木琴切分節奏＋沙鈴＋偶爾的鳥鳴，輕快有活力',tempo:104,sfx:'木琴',bpm:104,spb:8,melI:'box',
  ch:[[41,45,48],[50,53,57],[46,50,53],[48,52,55],[41,45,48],[50,53,57],[46,50,53],[48,52,55]],
  acc(A,o,t,i,ch,sd,bar){arp('marimba',[0,null,2,1,null,2,3,null],12,1)(A,o,t,i,ch);if(i%2)I.shake(A,o,t,i===3||i===7?1:.6);if(i===0||i===5)I.bass(A,o,t,ch[0]+(ch[0]<44?12:0),.9,sd*2);if((bar===3||bar===7)&&i===6)I.chirp(A,o,t)},
  mel:M([77,0,0,81,0,84,0,0],[0,81,0,77,0,0,74,0],[77,0,0,82,0,86,0,0],[0,84,0,79,0,0,76,0],[77,0,81,0,84,0,89,0],[86,0,0,81,0,0,77,0],[82,0,0,86,0,82,0,0],[84,0,79,0,76,0,0,0])},
 /* 百鍊之塔（P3 §5）：太鼓穩定的心跳給專注節奏，鐵砧清響＝「百鍊成鋼」，上行撥弦＝一層一層往上爬；
    D 小調、有決心但不緊張（不倒數，不用急促的音樂催孩子）。off＝依層數升調（每 2 層升半音，最多 +5），越往上越亮 */
 tw:{name:'百鍊之塔',look:'層層疊起的試煉塔',music:'太鼓心跳＋鐵砧清響＋上行撥弦，銅管旋律，D 小調；越往上層音樂越高',tempo:112,sfx:'鐵砧',bpm:112,spb:8,melI:'brass',melOct:-12,off:0,
  ch:[[50,53,57],[46,50,53],[48,52,55],[45,48,52],[50,53,57],[53,57,60],[43,46,50],[45,49,52]],
  acc(A,o,t,i,ch,sd){arp('guitar',[0,1,2,3,0,1,2,3],12,.6)(A,o,t,i,ch);if(i===0||i===3||i===6)I.taiko(A,o,t,i?.7:1);if(i===4)I.anvil(A,o,t,ch[0]+36,.5);if(i===0){I.bass(A,o,t,ch[0]-12,1.1,sd*3);I.pad(A,o,t,ch[1]+12,.9,sd*8)}},
  mel:M([[74,3],0,0,[77,1],[81,4],0,0,0],[[82,2],0,[81,2],0,[77,4],0,0,0],[[79,3],0,0,[81,1],[84,4],0,0,0],[[81,6],0,0,0,0,0,0,0],
        [[74,2],0,[77,2],0,[81,2],0,[86,2],0],[[84,4],0,0,0,[81,2],0,[77,2],0],[[79,2],0,[82,2],0,[86,3],0,0,[84,1]],[[81,6],0,0,0,0,0,0,0])},
 en:{name:'英語・熱氣球海港',look:'棕櫚、帆船、旗幟、熱氣球——環遊世界',music:'三拍子圓舞曲，手風琴旋律＋嘭恰恰伴奏，悠閒搖擺',tempo:108,sfx:'手風琴',bpm:108,spb:6,melI:'accordion',melOct:-12,
  ch:[[53,57,60,65],[50,57,62,65],[55,58,62,67],[48,58,60,64],[53,57,60,65],[46,58,62,65],[48,55,60,64],[53,57,60,65]],
  acc(A,o,t,i,ch,sd){if(i===0)I.bass(A,o,t,ch[0],1,sd*2.5);if(i===2||i===4)ch.slice(1).forEach(m=>I.guitar(A,o,t,m,.55))},
  mel:M([[72,2],0,[77,2],0,[81,2],0],[[86,4],0,0,0,[81,2],0],[[82,2],0,[79,2],0,[74,2],0],[[76,6],0,0,0,0,0],[[77,2],0,[81,2],0,[84,2],0],[[86,4],0,0,0,[82,2],0],[[84,2],0,[82,2],0,[79,2],0],[[77,6],0,0,0,0,0])}
};
/* 成套音效：和該區背景音樂同一種樂器、同一個調，聽起來是同一個世界 */
const SF={
 home:{i:'harp',tap:72,ok:[72,79],no:[64,60],win:[60,64,67,72,76]},
 zh:{i:'zheng',tap:69,ok:[76,81],no:[64,62],win:[69,72,74,76,81]},
 ma:{i:'box',tap:79,ok:[79,86],no:[66,62],win:[67,71,74,79,83]},
 so:{i:'guitar',tap:67,ok:[67,74],no:[62,59],win:[62,67,71,74,79]},
 sc:{i:'marimba',tap:77,ok:[77,84],no:[60,57],win:[65,69,72,77,81]},
 en:{i:'accordion',tap:72,ok:[72,77],no:[60,57],win:[60,65,69,72,77]},
 tw:{i:'anvil',tap:86,ok:[86,93],no:[62,57],win:[74,77,81,86,89]}
};
function sfx(k){if(!G8.snd)return;const A=ctx();if(!A)return;const z=SF[cur],f=I[z.i],o=sfxOut,t=A.currentTime+.01;
  if(k==='tap')f(A,o,t,z.tap,1.2,.12);
  else if(k==='ok'){f(A,o,t,z.ok[0],1.8,.14);f(A,o,t+.11,z.ok[1],1.8,.3)}
  else if(k==='no'){f(A,o,t,z.no[0],1.5,.2);f(A,o,t+.17,z.no[1],1.5,.35)}
  else if(k==='win')z.win.forEach((m,n)=>f(A,o,t+n*.13,m,1.8,n===4?.6:.16));
  else if(k==='card')[0,4,7,12,16].forEach((d,n)=>f(A,o,t+n*.06,z.tap+d,1.2,.12));
  else if(k==='enter'){f(A,o,t,z.win[0]+12,1.3,.14);f(A,o,t+.1,z.win[2]+12,1.3,.14);f(A,o,t+.2,z.win[3]+12,1.3,.3)}}
function playStep(A,T,s,t){const sd=30/T.bpm,bar=(s/T.spb|0)%T.ch.length,i=s%T.spb,off=T.off||0;T.acc(A,bus,t,i,off?T.ch[bar].map(m=>m+off):T.ch[bar],sd,bar);
  if(duck)return;const n=T.mel[s];if(n){const a=Array.isArray(n);I[T.melI](A,bus,t,(a?n[0]:n)+(T.melOct||0)+off,1,(a?n[1]:1)*sd*.95)}}
function tick(){const A=ctx();if(!A||!playing)return;const T=TH[playing],sd=30/T.bpm;if(nextT<A.currentTime)nextT=A.currentTime+.06;
  while(nextT<A.currentTime+.3){playStep(A,T,step,nextT);nextT+=sd;step=(step+1)%T.mel.length}}
function fade(v,d){const A=ctx();if(!A)return;const g=bus.gain,t=A.currentTime;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(v,t+d)}
function stopTimer(){clearInterval(timer);timer=null;clearTimeout(swT)}
/* 依目前狀態決定要不要播、播哪一套；換區時先淡出再淡入 */
function apply(){sync();if(!armed)return;const A=ctx();if(!A)return;
  if(!on||document.hidden){fade(0,.3);stopTimer();playing=null;return}
  const lv=duck?.5:1;
  if(playing!==cur||!timer){const want=cur,wait=playing&&playing!==cur?420:0;fade(0,.35);stopTimer();
    swT=setTimeout(()=>{playing=want;step=0;nextT=0;fade(lv,.9);timer=setInterval(tick,90);tick()},wait)}
  else fade(lv,.4)}
function sync(){document.querySelectorAll('.musb,#musmap').forEach(b=>{b.setAttribute('aria-pressed',on);if(b.id==='musmap')b.textContent=on?'🎵 音樂：開':'🎵 音樂：關';else b.style.opacity=on?1:.4})}
function set(v){on=v;try{localStorage.setItem('so-music',v?'1':'0')}catch(e){}apply()}
function zone(id,ring){if(!TH[id])id='home';if(cur===id)return;cur=id;apply();if(ring&&armed)sfx('enter')}
['pointerdown','keydown'].forEach(ev=>addEventListener(ev,()=>{if(!armed){armed=true;apply()}},true));
document.addEventListener('visibilitychange',apply);
/* 百鍊之塔：第 f 層 → 升幾個半音（1–2 層 0、3–4 層 +1 … 11–12 層 +5） */
function lift(f){TH.tw.off=Math.max(0,Math.min(5,Math.floor((Number(f)||1)-1)/2|0))}
return{TH,sfx,zone,set,lift,toggle:()=>set(!on),duck:v=>{if(duck!==v){duck=v;apply()}},sync,
  state:()=>{let rms=0;if(ana){const d=new Float32Array(ana.fftSize);ana.getFloatTimeDomainData(d);rms=Math.sqrt(d.reduce((a,x)=>a+x*x,0)/d.length)}return{on,armed,cur,playing,duck,step,rms:+rms.toFixed(4)}}}})();

/* 接到畫面：地圖走到哪一區就換哪一套；進答題畫面只留伴奏、音量減半 */
(()=>{
 const hook=(n,id)=>{const f=window[n];window[n]=function(r){f.apply(this,arguments);MUS.zone(id||r.id,true)}};
 hook('pWorld','home');hook('pCastle','home');hook('pRegion');hook('pIsland');hook('pLevel');
 if(typeof pTower==='function'){const f=pTower;window.pTower=function(){f.apply(this,arguments);if(TWR.on())MUS.lift(TWR.next().f);MUS.zone('tw',true)}}
 const o0=G8.open,c0=G8.close;G8.open=lv=>{MUS.zone(lv.subj);o0(lv)};
 const sc=document.querySelector('#scene'),play=document.querySelector('#g8play');
 const watch=()=>{MUS.duck(!play.hidden&&!!sc.querySelector('.gopt,.ml'));
   sc.querySelectorAll('.snd').forEach(b=>{const n=b.nextElementSibling;if(n&&n.classList.contains('musb'))return;const m=document.createElement('button');m.className='musb';m.textContent='🎵';m.setAttribute('aria-label','背景音樂開關');m.onclick=e=>{e.stopPropagation();MUS.toggle()};b.after(m)});MUS.sync()};
 new MutationObserver(watch).observe(sc,{childList:true,subtree:true});
 new MutationObserver(watch).observe(play,{attributes:true,attributeFilter:['hidden']});
 const b=document.createElement('button');b.id='musmap';b.setAttribute('aria-label','背景音樂開關');b.style.cssText='position:fixed;right:16px;bottom:66px;z-index:40;font:inherit;font-size:16px;font-weight:700;padding:10px 16px;border-radius:999px;border:2px solid #ffffff55;background:#0b1030cc;color:#fff;cursor:pointer';b.onclick=()=>MUS.toggle();document.body.append(b);MUS.sync();
})();
