/* ---------- 接代理：登入、上傳佇列、接續、排行榜、今日任務（P2 SPEC §5、§7；前台約定見 §15） ----------
   代理網址讀班網 data/site-config.json 的 updateProxyUrl（同網域公開檔）；讀不到＝只能試玩。
   載具上只存：登入憑證（不是查詢碼）、座號、載具碼、每本的 seq、待上傳佇列、進度快取。查詢碼本身不存。
   本機儲存一律包 try/catch；壞掉就退回記憶體（關掉分頁會掉，但不擋作答）。 */
const LS={mem:{},
  get(k){try{const v=localStorage.getItem(k);return v==null?null:JSON.parse(v)}catch(e){return k in this.mem?this.mem[k]:null}},
  set(k,v){this.mem[k]=v;try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},
  del(k){delete this.mem[k];try{localStorage.removeItem(k)}catch(e){}}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

const API={url:'',dev:'',q:[],mid:{},busy:false,timer:null,fails:0,err:'',online:true,rk:{scope:'all',metric:'stars'},
  key(k,b){return'so-'+k+'-'+APP.me.seat+(b?'-'+b:'')},
  /* 開機：讀代理網址、載具碼、登入狀態 */
  async init(){try{const c=await getJSON(DATA_BASE+'../site-config.json'),u=String(c.updateProxyUrl||'');
      if(/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(u))this.url=u}catch(e){}
    let d=LS.get('so-dev');if(!/^[A-Za-z0-9]{8}$/.test(d||'')){d=Array.from({length:8},()=>'abcdefghjkmnpqrstuvwxyz23456789'[Math.floor(Math.random()*31)]).join('');LS.set('so-dev',d)}this.dev=d;
    const a=LS.get('so-auth');
    if(this.url&&a&&typeof a.token==='string'&&a.seat>0){APP.me={seat:a.seat,token:a.token,today:{done:[]},streak:0};this.q=LS.get(this.key('q'))||[]}
    acctUI()},
  async post(body){if(!this.url)return null;const ac=new AbortController(),t=setTimeout(()=>ac.abort(),25000);
    try{const r=await fetch(this.url,{method:'POST',body:JSON.stringify(body),signal:ac.signal});this.online=true;return await r.json()}
    catch(e){this.online=false;return null}finally{clearTimeout(t)}},
  /* 代理回覆的共同處理：ok／retry（稍後重送）／stop（要重新登入或暫停中） */
  check(r){if(!r)return'retry';if(r.ok){this.err='';return'ok'}
    if(r.relogin){this.err='登入過期了，請重新登入（還沒上傳的會留著）';LS.del('so-auth');APP.me.token='';APP.relogin=true;acctUI();return'stop'}
    if(r.paused){APP.paused=true;this.err=r.error||'自學星圖暫停中';acctUI();return'stop'}
    if(r.retry)return'retry';this.err=r.error||'上傳失敗';return'retry'},
  setMe(r){if(!APP.me)return;if(r.today&&Array.isArray(r.today.src))APP.me.today={done:r.today.src.slice()};if(typeof r.streak==='number')APP.me.streak=r.streak},

  /* ---- 登入／登出 ---- */
  async login(seat,code){if(!this.url)return'現在連不到自學星圖的伺服器，只能試玩。';
    const r=await this.post({action:'so_login',seat,code:String(code).trim(),dev:this.dev});
    if(!r)return'連不上網路，請檢查後再試。';if(!r.ok)return r.paused?'自學星圖暫停中，現在只能試玩。':(r.error||'登入失敗');
    LS.set('so-auth',{token:r.token,seat:r.seat});location.reload();return''},
  logout(){const n=this.q.length;if(n&&!confirm(`還有 ${n} 筆作答沒上傳，登出後要用同一台登入同一個座號才會補傳。確定登出？`))return;
    LS.del('so-auth');location.reload()},

  /* ---- 進度：快取與拉取 ---- */
  cache(book,save){if(!APP.me)return;const c=LS.get(this.key('sv',book))||{ver:0};c.save=save;LS.set(this.key('sv',book),c)},
  cached(book){const c=APP.me&&LS.get(this.key('sv',book));return c&&typeof c.save==='string'?c:null},
  /* 拉某一本：佇列裡沒有這本待送的事件，才用伺服器的進度蓋掉本機（有的話等送完再拉） */
  async pull(book){if(!APP.me||!APP.me.token||APP.paused)return false;
    const r=await this.post({action:'so_pull',token:APP.me.token,book});if(this.check(r)!=='ok')return false;
    this.setMe(r);const c=LS.get(this.key('sv',book))||{ver:0};
    if(!this.q.some(x=>x.b===book)&&!this.mid[book]){APP.save[book]=decodeSave(r.save);LS.set(this.key('sv',book),{save:r.save,ver:r.ver})}
    else LS.set(this.key('sv',book),{save:c.save||r.save,ver:r.ver});
    return true},
  /* 開機後在背景跑：各本拉一次 → 重畫 → 送出還沒送的 */
  async start(){if(!APP.me||!APP.me.token){if(APP.me)loginDlg();return}
    const ok=await Promise.all(DATA.index.books.map(b=>this.pull(b.code)));
    if(ok.some(Boolean))APP.afterPlay();acctUI();this.flush(true)},

  /* ---- 上傳佇列（§7：滿 5 筆、過 30 秒、回合結束、離開頁面） ---- */
  saveQ(){LS.set(this.key('q'),this.q);acctUI()},
  enqueue(book,e){const k=this.key('seq',book),s=(LS.get(k)||0)+1;LS.set(k,s);this.q.push({b:book,s,e});this.saveQ();
    if(this.q.length>=5)this.flush();else this.soon()},
  setMid(book,mid){if(mid)this.mid[book]=mid;else delete this.mid[book];this.soon()},
  soon(ms=30000){if(!this.timer)this.timer=setTimeout(()=>{this.timer=null;this.flush()},ms)},
  async flush(now){if(this.busy||!APP.me||!APP.me.token||APP.paused||!this.url)return;
    const books=[...new Set([...booksIn(this.q),...Object.keys(this.mid)])];if(!books.length)return;
    clearTimeout(this.timer);this.timer=null;this.busy=true;let res='ok';
    try{if(!now)await sleep(Math.random()*3000); /* 隨機錯開 0–3 秒，全班同時按不會擠在同一秒 */
      for(const b of books){res=await this.pushBook(b);if(res!=='ok')break}}
    finally{this.busy=false}
    if(res==='retry'){this.fails++;this.soon(backoff(this.fails))}
    else if(res==='ok'){this.fails=0;if(this.q.length||Object.keys(this.mid).length)this.soon(1000)}
    acctUI()},
  async pushBook(b){const bt=takeBatch(this.q,b),mid=this.mid[b]||null;if(!bt&&!mid)return'ok';
    const body=()=>({action:'so_push',token:APP.me.token,book:b,dev:this.dev,seq0:bt?bt.seq0:(LS.get(this.key('seq',b))||0)+1,ev:bt?bt.ev:[],mid});
    let r=await this.post(body());
    if(r&&r.needPull){if(!await this.pull(b))return'retry';r=await this.post(body())} /* 伺服器暫存區沒有這格：先拉一次再重送 */
    const c=this.check(r);if(c!=='ok')return c;
    if(bt){this.q=dropUpTo(this.q,b,bt.last);this.saveQ()}
    if(this.mid[b]===mid)delete this.mid[b];
    this.setMe(r);const sv=LS.get(this.key('sv',b));if(sv){sv.ver=r.ver;LS.set(this.key('sv',b),sv)}
    /* 送出的有回合結束或卡冊 → 這本送完就拉一次，用伺服器算的進度為準（兩台載具時也一致） */
    if(bt&&bt.ev.some(e=>e[0]==='e'||e[0]==='c')&&!this.q.some(x=>x.b===b)&&await this.pull(b))APP.afterPlay();
    return'ok'},
  /* 離開頁面：用 sendBeacon 送（拿不到回覆，所以佇列不清，下次照送、代理靠 seq 去重） */
  beacon(){if(!APP.me||!APP.me.token||APP.paused||!this.url||!navigator.sendBeacon)return;
    for(const b of new Set([...booksIn(this.q),...Object.keys(this.mid)])){const bt=takeBatch(this.q,b);
      const body={action:'so_push',token:APP.me.token,book:b,dev:this.dev,seq0:bt?bt.seq0:(LS.get(this.key('seq',b))||0)+1,ev:bt?bt.ev:[],mid:this.mid[b]||null};
      try{navigator.sendBeacon(this.url,new Blob([JSON.stringify(body)],{type:'text/plain'}))}catch(e){}}},

  /* ---- 排行榜 ---- */
  async rank(){if(!APP.me||!APP.me.token)return null;const r=await this.post({action:'so_rank',token:APP.me.token,scope:this.rk.scope,metric:this.rk.metric});
    return this.check(r)==='ok'?r:{err:r&&r.error||'排行榜讀不到，請檢查網路'}}};

addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')API.beacon();else API.flush()});
addEventListener('pagehide',()=>API.beacon());
addEventListener('online',()=>API.flush(true));

/* ---------- 標頭：模式、待上傳、登入／登出 ---------- */
function acctUI(){const m=$('#mode'),b=$('#acct');if(!m||!b)return;
  if(!APP.me){m.textContent=API.url?'試玩中，不會記錄':'試玩中（連不到伺服器）';m.className='mode';b.textContent='登入';b.hidden=!API.url;b.onclick=loginDlg;return}
  const n=API.q.length;
  m.textContent=APP.paused?'暫停中：只能試玩、不會記錄':!APP.me.token?`${APP.me.seat} 號・請重新登入`:API.err?`${APP.me.seat} 號・${API.err}`:n?`${APP.me.seat} 號・待上傳 ${n} 筆${API.online?'':'（離線）'}`:`${APP.me.seat} 號・已記錄`;
  m.className='mode'+(APP.paused||API.err||!APP.me.token?'':' in');
  if(!APP.me.token){b.textContent='重新登入';b.onclick=loginDlg}else{b.textContent='登出';b.onclick=()=>API.logout()}b.hidden=false}

function loginDlg(){if($('#dlg'))return;const d=document.createElement('div');d.id='dlg';d.className='dlg';
  const seat=APP.me?APP.me.seat:'';
  d.innerHTML=`<form class="box" role="dialog" aria-label="登入自學星圖"><h2>登入自學星圖</h2>
   <p class="mut">用座號和老師給的查詢碼登入。登入後進度會記錄、換一台載具也能接著玩。</p>
   <label>座號<input name="seat" type="number" inputmode="numeric" min="1" required value="${seat}"></label>
   <label>查詢碼<input name="code" type="password" autocomplete="off" required></label>
   <p class="err" id="lerr" role="alert"></p>
   <div class="row"><button class="btn" type="submit">登入</button><button class="btn ghost" type="button" id="lno">先試玩</button></div></form>`;
  document.body.append(d);const f=d.querySelector('form');f.seat.value?f.code.focus():f.seat.focus();
  d.querySelector('#lno').onclick=()=>d.remove();
  f.onsubmit=async e=>{e.preventDefault();const btn=f.querySelector('[type=submit]');btn.disabled=true;btn.textContent='登入中…';
    const msg=await API.login(Math.floor(Number(f.seat.value)),f.code.value);
    if(msg){$('#lerr').textContent=msg;btn.disabled=false;btn.textContent='登入'}}}
