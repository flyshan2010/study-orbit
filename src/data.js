/* ---------- 資料：讀班網的題本檔（公開、無學生資料），排成地圖用的 R ----------
   題本檔由班網同步產生（P2 SPEC §3）：data/study-orbit/index.json＋<題本代碼>.json。
   GitHub Pages 上兩站同網域：本站 /study-orbit/、班網 /class-website/，所以用相對路徑。 */
const DATA_BASE=(()=>{try{const d=new URLSearchParams(location.search).get('data');
  /* 只接受同網域的相對路徑（預覽用），避免被帶去讀別人的檔案 */
  if(d&&/^\.{1,2}\/[\w\-./]*\/$/.test(d)&&!d.includes('//'))return d}catch(e){}
  return '../class-website/data/study-orbit/'})();

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* 五區風景（範本 10 定案）：區＝科目；小島地標依序輪用 lm */
const THEME={
 '國語':{id:'zh',zone:'墨竹書鄉',style:'竹林、遠山、書院亭——水墨山水',ang:-90,c:{land:'#b7d3bb',edge:'#7fa58b',t1:'#3f7d5a',t2:'#67a47c',m1:'#7f93a8'},gl:['bamboo','bamboo','inkmt','pine','pav'],lm:['book','pav','brush','inkmt']},
 '數學':{id:'ma',zone:'晶礦機關城',style:'水晶、方塊、齒輪——幾何與機關',ang:-18,c:{land:'#bdb7ee',edge:'#857dcc',t1:'#5a4fb8',t2:'#8f86e6',m1:'#6e68b0'},gl:['crystal','crystal','cube','gear','pine'],lm:['tower','cube','protr','pie','sign','gear','tri','gear','drop','bars']},
 '社會':{id:'so',zone:'家鄉聚落',style:'屋舍、田地、廟埕、牌樓——暖色鄉鎮',ang:54,c:{land:'#ecd09a',edge:'#b9975a',t1:'#b5683a',t2:'#9fbf6a',m1:'#a58a6a'},gl:['house','house','field','pine','temple'],lm:['inkmt','house','gate','lantern']},
 '自然':{id:'sc',zone:'雨林觀測站',style:'闊葉林、火山、觀測鏡——生態探險',ang:126,c:{land:'#86cc93',edge:'#4f9460',t1:'#2f7d48',t2:'#58b06f',m1:'#6b7f6a'},gl:['broad','broad','flower','volcano','scope'],lm:['scope','volcano','broad','flower']},
 '英語':{id:'en',zone:'熱氣球海港',style:'棕櫚、帆船、旗幟、熱氣球——環遊世界',ang:198,c:{land:'#f1dfa6',edge:'#c2a868',t1:'#2e9c93',t2:'#ff8f6b',m1:'#8fb7c9'},gl:['palm','palm','flag','balloon','house'],lm:['balloon','sail','flag']},
};
const SUBJ_ORDER=['國語','數學','社會','自然','英語'];

const DATA={index:null,books:{},examDone:{}};
async function getJSON(url){const r=await fetch(url,{cache:'no-cache'});if(!r.ok)throw new Error(url+' '+r.status);return r.json()}
async function loadIndex(){DATA.index=await getJSON(DATA_BASE+'index.json');return DATA.index}
async function loadBook(code){if(!/^[a-z0-9-]+$/.test(code))throw new Error('題本代碼不對');
  return DATA.books[code]||(DATA.books[code]=await getJSON(DATA_BASE+code+'.json'))}
/* 定期評量考完了沒：讀班網行事曆（type＝考試、標題含期中／期末），讀不到就當沒考 */
async function loadExams(){try{const cal=await getJSON(DATA_BASE+'../calendar.json'),now=todayStr();
  for(const e of cal){if(e.type!=='考試')continue;const k=/期中/.test(e.title)?'期中':/期末/.test(e.title)?'期末':null;
    if(k&&(e.endDate||e.date)<now)DATA.examDone[k]=true}}catch(e){}}
function todayStr(){return new Date(Date.now()+8*3600e3).toISOString().slice(0,10)}

/* 每科選哪一本：記在這台載具；沒選過就用最後一本（學期最新） */
function bookOf(subj){const bs=DATA.index.books.filter(b=>b.subject===subj);if(!bs.length)return null;
  let c=null;try{c=localStorage.getItem('so-book-'+subj)}catch(e){}
  return bs.find(b=>b.code===c)||bs[bs.length-1]}
function setBookOf(subj,code){try{localStorage.setItem('so-book-'+subj,code)}catch(e){}}
const shortKey=(book,code)=>code.slice(book.length+1); /* c-h-4a-1-1 → 1-1（存檔的鍵省略題本代碼） */

/* 由題本結構排出 R（字串一律先跳脫，地圖用 innerHTML 畫）；進度另由 applyProgress 填（地圖物件要沿用，不能重建） */
function buildRegions(){
  return SUBJ_ORDER.map(subj=>{const T=THEME[subj],b=bookOf(subj);if(!b)return null;
    const islands=(b.structure&&b.structure.islands)||[];
    const units=islands.map((isl,i)=>{const lvs=isl.levels||[];
      return{n:esc(isl.name),u:'第 '+esc(isl.id)+' 單元',lm:T.lm[i%T.lm.length],
        lv:lvs.map(l=>esc(l.name)),pin:lvs.map(l=>esc(String(l.name).split('・').pop())),codes:lvs.map(l=>l.code),
        keys:lvs.map(l=>shortKey(b.code,l.code)),exam:lvs.map(l=>l.exam||''),slots:lvs.map(l=>l.slots||[]),
        ex:lvs.length>0&&lvs.every(l=>DATA.examDone[l.exam]),best:[],on:[],done:0,total:lvs.length,chest:false}});
    return{id:T.id,name:esc(subj),subj,zone:T.zone,style:T.style,ang:T.ang,c:T.c,gl:T.gl,per:1,
      book:b.code,bookTitle:esc(b.title),units,done:0,total:units.reduce((a,u)=>a+u.total,0)}}).filter(Boolean)}
/* save＝{題本代碼: decodeSave() 的形狀} */
function applyProgress(R,save){R.forEach(r=>{const m=save[r.book]||{lv:{}};
  r.units.forEach(u=>{u.best=u.keys.map(k=>(m.lv[k]||[0])[0]);u.on=u.best.map(s=>s>=1);
    u.done=u.on.filter(Boolean).length;u.chest=u.keys.length>0&&chestOpen(u.keys,m.lv)});
  r.done=r.units.reduce((a,u)=>a+u.done,0)})}
