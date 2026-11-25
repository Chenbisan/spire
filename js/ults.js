// Spire — Ultimate weapons: run-time behaviour, effects, the Ultimates tab and manual fire buttons. Data in config.js.
const ultLv=(k,t)=>(save.ults[k]||{})[t]||0, ultOwned=k=>!!save.ults[k];
function ultVal(u,tr,l){const t=u.t.find(x=>x.k===tr);return+(t.base+t.per*Math.min(l,t.lv)).toFixed(3)}
const uv=(k,tr)=>ultVal(UK[k],tr,ultLv(k,tr));
const trackMax=(k,t)=>ultLv(k,t.k)>=t.lv;
// status: 0 none, 1 Silver (silver pair maxed), 2 Gold (3 maxed incl. the pair), 3 Platinum (all 4)
function ultStatus(k){const u=UK[k];if(!ultOwned(k))return 0;const n=u.t.filter(t=>trackMax(k,t)).length;
  if(!u.silverT.every(tk=>trackMax(k,u.t.find(t=>t.k===tk))))return 0;return n>=4?3:n>=3?2:1}
const ultPerm=k=>UK[k].timed&&ultStatus(k)>=1; // timed ultimates at Silver are always on
const ultManual=k=>!!save.set.ultMan[k]&&!ultPerm(k)&&!UK[k].passive;
// 1.23: tracks went from 4-20 levels to 40-100; convert old levels proportionally so every track keeps its value
if((save.ultV||1)<2){for(const k in save.ults){const u=UK[k],o=ULT_OLD_LV[k];if(!u||!o)continue;
  for(const t of u.t){const l=save.ults[k][t.k];if(l&&o[t.k])save.ults[k][t.k]=Math.min(t.lv,Math.round(l/o[t.k]*t.lv))}
  for(const tk of Object.keys(save.ults[k]))if(!u.t.some(t=>t.k===tk)){let back=0;for(let i=0;i<save.ults[k][tk];i++)back+=Math.ceil(10*1.6**i);delete save.ults[k][tk];if(back){save.chips+=back;save.refund=(save.refund||0)+back}}}
  save.ultV=2;persist()}
const ultFx=[]; // render-only effects (real time)
function ultInit(){run.ult={};run.frostR=0;run.frostCap=0;for(const u of ULTS)run.ult[u.k]={cd:u.passive?0:uv(u.k,'cd')*.5,act:0,x:0,y:0,ang:0,after:0,tick:0}}
const inRange=()=>enemies.filter(e=>!e.dead&&e.dist<=run.s.range+e.d.sz);
// extra damage enemies take from Silver ultimates
function ultDmgMult(e){const R=run,S=R&&R.ultSt;if(!S)return 1;let m=1;
  if(e.fs&&R.brittle)m*=1+e.fs*R.brittle*(e.frzT>0&&S.frost>=3?2:1); // Frost Field brittle: more damage per frost stack (doubled while frozen at Platinum)
  if(e.stunT>0&&S.shock>=1)m*=1.25;
  const g=R.ult.grav;if(g&&g.act>0&&S.grav>=1&&(e.x-g.x)**2+(e.y-g.y)**2<=uv('grav','radius')**2)m*=1.2;
  return m}
function ultTick(dt,tgt){const R=run;if(!R.ult)ultInit();R.ultSt={};for(const u of ULTS)R.ultSt[u.k]=ultStatus(u.k);const S=R.ultSt;
  R.chainP=ultOwned('chain')?uv('chain','chance'):0; // read on every bullet hit
  frostTick(dt,S.frost||0);
  for(const u of ULTS){if(!ultOwned(u.k)||u.passive)continue;const st=R.ult[u.k];
    if(ultPerm(u.k)){ // always on; the well and the laser re-aim every few seconds
      const mover=u.k==='grav'||u.k==='laser';if(mover)st.mv=(st.mv||0)-dt;
      if(st.act<=0||(mover&&st.mv<=0)){st.cd=0;st.act=0;if(fireUlt(u.k,tgt))st.mv=u.k==='laser'?ULT.laserAim:ULT.gravMove}st.act=Math.max(st.act,1)}
    if(u.k==='shock'&&st.after>0&&(st.after-=dt)<=0)shockBlast(true);
    if(st.act>0){st.act-=dt;
      // damage over time lands in dotHz chunks (same total damage, far fewer hits to process); movement stays per step
      const dotT=(st.dot=(st.dot||0)+dt)>=1/CFG.dotHz?st.dot:0;if(dotT)st.dot=0;
      if(u.k==='grav'){const rad=uv('grav','radius'),r2=rad*rad,pull=uv('grav','pull'),dmg=S.grav>=2&&dotT?R.s.damage*2*dotT:0,hold=S.grav>=3;
        forNear(st.x,st.y,rad,e=>{const dx=st.x-e.x,dy=st.y-e.y,d2=dx*dx+dy*dy;if(d2>r2)return;
          if(d2>=1){const d=Math.sqrt(d2),m=Math.min(d,pull*dt/e.d.weight);e.x+=dx/d*m;e.y+=dy/d*m}
          if(hold)e.stunT=Math.max(e.stunT,dt*2);if(dmg)damage(e,dmg,0,false,1)})}
      if(u.k==='laser'&&dotT){const w=uv('laser','width')/2,dmg=R.s.damage*uv('laser','dmg')*(S.laser>=2?1.5:1)*dotT,cx=Math.cos(st.ang),cy=Math.sin(st.ang),both=S.laser>=3,fl=S.laser>=1?3:1;
        for(const e of enemies){if(e.dead)continue;if(!both&&e.x*cx+e.y*cy<=0)continue;if(Math.abs(e.x*cy-e.y*cx)<=w+e.d.sz)damage(e,dmg,0,false,fl)}}}
    else if(st.cd>0)st.cd-=dt;
    if(st.cd<=0&&st.act<=0&&!ultManual(u.k)&&tgt)fireUlt(u.k,tgt)}}
// Frost Field: always on. Every 1/rate s, enemies touching the field gain a frost stack. Stacks never wear off and have
// no limit; slow is stacks × ULT.frostPer up to the Max slow track (95% at most), brittle adds damage taken per stack.
function frostTick(dt,st){const R=run;if(!ultOwned('frost')){R.frostR=R.frostCap=R.brittle=0;return}
  R.frostR=R.s.range*uv('frost','radius');R.frostCap=Math.min(.95,uv('frost','slow'));R.brittle=uv('frost','brittle');
  const F=R.ult.frost,maxSt=Math.ceil(R.frostCap/ULT.frostPer-1e-9);F.tick+=dt;
  if(F.tick>=1/uv('frost','rate')){F.tick=0;const r=R.frostR;
    for(const e of enemies){if(e.dead||e.dist>r+e.d.sz)continue;e.fs++;
      if(st>=1&&!e.frz1&&e.fs>=maxSt){e.frz1=true;e.frzT=ULT.freeze}}} // Silver: freeze the first time it reaches max slow
  if(st>=2){const r2=R.frostR**2;for(let i=ebs.length-1;i>=0;i--){const b=ebs[i];if(b.x*b.x+b.y*b.y<=r2){ebs[i]=ebs[ebs.length-1];ebs.pop();ebPool.push(b)}}}} // Gold: shots melt in the field
function shockBlast(after){const R=run,S=R.ultSt||{},f=uv('shock','force'),sn=uv('shock','stun'),lim=spawnMax(),rad=R.s.range*uv('shock','radius'),bd=S.shock>=2?R.s.damage*20:0;
  for(const e of enemies){if(e.dead||e.dist>rad+e.d.sz)continue;const d=Math.hypot(e.x,e.y)||1,m=Math.min(f/e.d.weight,lim-d);
    if(m>0){e.x+=e.x/d*m;e.y+=e.y/d*m;e.px=e.x;e.py=e.y}e.stunT=Math.max(e.stunT,sn);if(bd&&!e.dead)damage(e,bd,0)}
  ultFx.push({k:'shock',at:performance.now(),r:rad,after})}
// Chain Lightning: sparked by a bullet hit on e. Each enemy struck has the proc chance to split into `jumps` new bolts to
// nearby unhit enemies (within ULT.chainJump m), each doing `mult` × the previous bolt's damage. Capped for performance.
let chainStamp=0;const chainQ=[],chainV=[],chainD=[],chainNear=[],chainNd=[];
function chainBolt(e0){const R=run,S=R.ultSt||{},ch=uv('chain','chance'),nf=uv('chain','jumps'),mul=uv('chain','mult'),jr=ULT.chainJump**2,hits=S.chain>=2?2:1;
  const stamp=++chainStamp,fx=ultFx.length<80,segs=fx?[]:null;let hitN=1;e0.cz=stamp;save.stats.ultUses++;
  chainQ.length=chainV.length=chainD.length=0;chainQ.push(e0);chainV.push(R.s.damage*uv('chain','dmg'));chainD.push(0);
  const strike=(e,v0)=>{for(let h=0;h<hits;h++){let c=0,v=v0;if(S.chain>=1&&Math.random()<R.s.crit){c=1;v*=R.s.critMult;if(Math.random()<R.s.superCrit){c=2;v*=R.s.superMult}}damage(e,v,c)}
    if(S.chain>=3){e.slowT=2;e.slowF=Math.max(e.slowF||0,.5)}};
  for(let qi=0;qi<chainQ.length;qi++){const e=chainQ[qi],v=chainV[qi],dp=chainD[qi];strike(e,v);
    if(dp>=ULT.chainDepth||hitN>=ULT.chainMax||Math.random()>=ch)continue;
    // the n nearest unhit enemies within the jump range, kept in a short sorted list
    const n=Math.floor(nf)+(Math.random()<nf%1?1:0); // fractional targets: the remainder is the chance of one more
    chainNear.length=chainNd.length=0;
    forNear(e.x,e.y,ULT.chainJump,o=>{if(o.cz===stamp)return;const d=(o.x-e.x)**2+(o.y-e.y)**2;if(d>jr)return;
      if(chainNear.length===n&&d>=chainNd[n-1])return;let i=chainNear.length===n?n-1:chainNear.length;
      while(i>0&&chainNd[i-1]>d){chainNear[i]=chainNear[i-1];chainNd[i]=chainNd[i-1];i--}chainNear[i]=o;chainNd[i]=d});
    for(const o of chainNear){if(hitN>=ULT.chainMax)break;o.cz=stamp;hitN++;if(segs)segs.push([e.x,e.y,o.x,o.y,Math.random()-.5,Math.random()-.5,dp]);chainQ.push(o);chainV.push(v*mul);chainD.push(dp+1)}}
  if(fx)ultFx.push({k:'chain',x:e0.x,y:e0.y,segs,at:performance.now()})}
function fireUlt(k,tgt){const R=run,st=R.ult&&R.ult[k];if(!st||!ultOwned(k)||UK[k].passive||st.cd>0||st.act>0||R.over)return false;
  const near=inRange();if(!near.length)return false;tgt=tgt&&!tgt.dead?tgt:near.sort((a,b)=>a.dist-b.dist)[0];
  st.cd=uv(k,'cd');save.stats.ultUses++;const S=R.ultSt||{},now=performance.now();
  if(k==='shock'){shockBlast(false);if(S.shock>=3)st.after=ULT.aftershock}
  else if(k==='laser'){st.ang=Math.atan2(tgt.y,tgt.x);st.act=uv('laser','dur')}
  else if(k==='grav'){const rad=uv('grav','radius'),r2=rad*rad,m=Math.min(near.length,ULT.gravSample);let best=near[0],bc=-1;
    // up to gravSample candidates (all of them in small crowds), each counting its neighbours through the grid
    for(let i=0;i<m;i++){const a=m<near.length?near[Math.floor(Math.random()*near.length)]:near[i];let c=0;forNear(a.x,a.y,rad,b=>{if((a.x-b.x)**2+(a.y-b.y)**2<=r2)c++});if(c>bc){bc=c;best=a}}
    st.x=best.x;st.y=best.y;st.act=uv('grav','dur')}
  return true}
// ---- drawing (called from draw()) ----
function drawUlts(sc,W){const R=run;if(!R||!R.ult)return;const now=performance.now(),dpr=W/(stage.clientWidth||W);
  if(R.frostR){ctx.fillStyle=C.alloy;ctx.globalAlpha=.08;ctx.beginPath();ctx.arc(0,0,R.frostR,0,6.283);ctx.fill();ctx.globalAlpha=.55;ctx.strokeStyle=C.alloy;ctx.lineWidth=2*dpr/sc;ctx.stroke();ctx.globalAlpha=1}
  const g=R.ult.grav;if(g&&g.act>0&&ultOwned('grav')){const r=uv('grav','radius'),a0=now/300;ctx.strokeStyle=C.shard;ctx.lineWidth=2*dpr/sc;
    for(let i=0;i<3;i++){ctx.globalAlpha=.25+.2*i;ctx.beginPath();ctx.arc(g.x,g.y,r*(1-i*.3),a0+i,a0+i+4);ctx.stroke()}
    ctx.globalAlpha=.12;ctx.fillStyle=C.shard;ctx.beginPath();ctx.arc(g.x,g.y,r,0,6.283);ctx.fill();ctx.globalAlpha=1}
  const L=R.ult.laser;if(L&&ultOwned('laser')){const len=spawnMax()*1.5,w=uv('laser','width');
    if(L.act>0){const cx=Math.cos(L.ang)*len,cy=Math.sin(L.ang)*len,fl=.85+.15*Math.sin(now/40),x0=(R.ultSt&&R.ultSt.laser>=3)?-cx:0,y0=(R.ultSt&&R.ultSt.laser>=3)?-cy:0;
      ctx.lineCap='round';ctx.strokeStyle=C.hot;ctx.globalAlpha=.25*fl;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(cx,cy);ctx.stroke();
      ctx.globalAlpha=.9*fl;ctx.lineWidth=Math.max(2*dpr/sc,w*.25);ctx.stroke();ctx.globalAlpha=1;ctx.lineCap='butt'}
    else if(L.cd<1.5){const k=1-Math.max(0,L.cd)/1.5;ctx.fillStyle=C.hot;ctx.globalAlpha=.15+.5*k;ctx.beginPath();ctx.arc(0,0,CFG.towerR+4+8*k,0,6.283);ctx.fill();ctx.globalAlpha=1}} // charging glow
  for(let i=ultFx.length-1;i>=0;i--){const f=ultFx[i],k=(now-f.at)/(f.k==='chain'?260:450);if(k>=1){ultFx.splice(i,1);continue}
    if(f.k==='chain'){if(i<ultFx.length-CFG.boltsDrawn)continue; // only the newest bolts; one path each
      ctx.strokeStyle=C.bolt;ctx.globalAlpha=1-k;ctx.fillStyle=C.bolt;ctx.beginPath();ctx.arc(f.x,f.y,5*dpr/sc,0,6.283);ctx.fill();
      ctx.lineWidth=2*dpr/sc;ctx.beginPath();for(const [x0,y0,x1,y1,jx,jy] of f.segs){const L=Math.hypot(x1-x0,y1-y0)*.35;ctx.moveTo(x0,y0);ctx.lineTo((x0+x1)/2+jx*L,(y0+y1)/2+jy*L);ctx.lineTo(x1,y1)}ctx.stroke()}
    else if(f.k==='shock'){ctx.strokeStyle=C.gold;ctx.lineWidth=(f.after?2.5:4)*dpr/sc;ctx.globalAlpha=(1-k)*.8;ctx.beginPath();ctx.arc(0,0,CFG.towerR+k*f.r,0,6.283);ctx.stroke()}}
  ctx.globalAlpha=1;
  // frozen enemies (Frost Field Silver) get a solid icy ring
  ctx.strokeStyle=C.alloy;ctx.lineWidth=2.5*dpr/sc;ctx.beginPath();for(const e of enemies)if(!e.dead&&e.frzT>0){const x=IX(e),y=IY(e),r=e.d.sz*1.5;ctx.moveTo(x+r,y);ctx.arc(x,y,r,0,6.283)}ctx.stroke();
  // stunned enemies get a gold dashed ring
  ctx.strokeStyle=C.gold;ctx.lineWidth=1.5*dpr/sc;ctx.setLineDash([3*dpr/sc,3*dpr/sc]);ctx.beginPath();
  for(const e of enemies)if(!e.dead&&e.stunT>0){const x=IX(e),y=IY(e),r=e.d.sz*1.5;ctx.moveTo(x+r,y);ctx.arc(x,y,r,0,6.283)}ctx.stroke();ctx.setLineDash([]);
}
// ---- Ultimates tab: one compact row per ultimate; tap a row to open it (one open at a time) ----
const MCLS=['','s','g','p'];
const medal=k=>{const s=ultStatus(k);return s?`<span class="medal ${MCLS[s]} on">${MEDALS[s]}</span>`:''};
const ultIcon=u=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="var(--${u.col})" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${u.icon}</svg>`;
let ultOpen=null;
// levels to buy on a track with the ×1 / ×10 / Max selector, and their total cost (Max: as many as you can afford)
function ultBuyPlan(k,t){const l=ultLv(k,t.k),lim=ui.mult==='Max'?t.lv:ui.mult;let n=0,c=0;
  while(n<lim&&l+n<t.lv){const nc=ULT.cost(l+n,t.lv);if(ui.mult==='Max'&&n>0&&c+nc>save.chips)break;c+=nc;n++}return{n,c}}
const ultDone=k=>UK[k].t.reduce((a,t)=>a+ultLv(k,t.k),0),ultTotal=k=>UK[k].t.reduce((a,t)=>a+t.lv,0);
function ultsHtml(){
  if(!ultOpen||!ultOwned(ultOpen))ultOpen=(ULTS.find(u=>ultOwned(u.k))||{}).k||null;
  let h=`<div class="lhead usticky"><span>Chips <b class="chip">${fmt(save.chips)}</b></span><div class="mults sm">${[1,10,'Max'].map(m=>`<button data-mult="${m}" class="${ui.mult===m?'on':''}">${m==='Max'?'Max':'×'+m}</button>`).join('')}</div></div><div class="ulist">`;
  for(const u of ULTS){const own=ultOwned(u.k),open=own&&ultOpen===u.k,done=own?ultDone(u.k):0,tot=ultTotal(u.k);
    h+=`<div class="urow${open?' open':''}${own?'':' locked'}" style="--c:var(--${u.col})">`;
    h+=`<button class="uhead" ${own?`data-uopen="${u.k}" aria-expanded="${open}"`:'tabindex="-1"'}>${ultIcon(u)}<span class="un"><b>${u.n}</b> ${medal(u.k)}<i class="uprog"><i style="transform:scaleX(${done/tot})"></i></i></span><span class="ul">${own?`${Math.round(done/tot*100)}%`:''}</span></button>`;
    if(!own)h+=`<button class="buy chip ubuy" data-ubuy="${u.k}" ${save.chips>=ULT.unlock?'':'disabled'}>Unlock ${fmt(ULT.unlock)}</button>`;
    if(open){const stt=ultStatus(u.k),pair=u.silverT.map(tk=>u.t.find(t=>t.k===tk).n).join(' + ');
      h+=`<div class="ubody"><p class="note">${u.d}</p><div class="ustat"><span class="medal s${stt>=1?' on':''}">Silver</span><span>${pair} maxed: <b>${u.sb}</b></span><span class="medal g${stt>=2?' on':''}">Gold</span><span>Any 3 maxed: <b>${u.gb}</b></span><span class="medal p${stt>=3?' on':''}">Platinum</span><span>All 4 maxed: <b>${u.pb}</b></span></div>`;
      for(const t of u.t){const l=ultLv(u.k,t.k),mx=l>=t.lv,cur=ultVal(u,t.k,l),{n,c}=mx?{n:0,c:0}:ultBuyPlan(u.k,t),nx=ultVal(u,t.k,l+n);
        h+=`<div class="utr"><div><b>${u.silverT.includes(t.k)?'★ ':''}${t.n}</b> <span class="v">${t.f(cur)}${mx?'':` → ${t.f(nx)}`}</span><i class="uprog"><i style="transform:scaleX(${l/t.lv})"></i></i><span class="v">Lv ${l}/${t.lv}</span></div>${mx?'<button class="buy" disabled>Max</button>':`<button class="buy chip" data-uup="${u.k}" data-t="${t.k}" ${save.chips>=c?'':'disabled'}><span class="q">+${n}</span>${fmt(c)}</button>`}</div>`}
      h+=u.aura?'<p class="note" style="margin:4px 0 0">Always on, no cooldown.</p>':u.passive?'<p class="note" style="margin:4px 0 0">Triggers on your shots, no cooldown.</p>':ultPerm(u.k)?'<p class="note" style="margin:4px 0 0">Always on.</p>':`<div class="subs" style="margin:6px 0 0"><button data-umode="${u.k}" data-v="auto" class="${ultManual(u.k)?'':'on'}">Auto</button><button data-umode="${u.k}" data-v="man" class="${ultManual(u.k)?'on':''}">Manual</button></div>`;
      h+='</div>'}
    h+='</div>'}
  return h+'</div><p class="note" style="margin-top:8px">Bought with <b class="chip">chips</b> (shared with Equipment). Every ultimate you own is active. Max the 2 ★ upgrades for <b>Silver</b>, any 3 for <b>Gold</b>, all 4 for <b>Platinum</b>; each adds a bonus.</p>'}
$('panel').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;
  if(d.uopen){ultOpen=ultOpen===d.uopen?'':d.uopen;loSig='';refreshLoadout();return}
  if(d.ubuy){if(save.chips<ULT.unlock)return;save.chips-=ULT.unlock;save.stats.chipsSpent=(save.stats.chipsSpent||0)+ULT.unlock;save.ults[d.ubuy]={};ultOpen=d.ubuy;if(run&&run.ult&&!UK[d.ubuy].passive)run.ult[d.ubuy].cd=uv(d.ubuy,'cd')*.5}
  else if(d.uup){const t=UK[d.uup].t.find(x=>x.k===d.t),{n,c}=ultBuyPlan(d.uup,t);if(!n||save.chips<c)return;const before=ultStatus(d.uup);
    save.chips-=c;save.stats.chipsSpent=(save.stats.chipsSpent||0)+c;save.ults[d.uup][d.t]=ultLv(d.uup,d.t)+n;const after=ultStatus(d.uup);if(after>before)toast(`${UK[d.uup].n} reached ${MEDALS[after]}!`)}
  else if(d.umode){save.set.ultMan[d.umode]=d.v==='man'}
  else return;
  persist();loSig='';refreshLoadout();buildUltBar()});
// ---- manual fire buttons under the arena ----
function buildUltBar(){const el=$('ultBar');el.innerHTML=ULTS.filter(u=>ultOwned(u.k)&&ultManual(u.k)).map(u=>`<button class="ultb" data-fire="${u.k}" style="--c:var(--${u.col})" title="${u.n}">${ultIcon(u)}<span></span></button>`).join('')}
function refreshUltBar(){for(const b of $('ultBar').children){const st=run&&!run.over&&run.ult&&run.ult[b.dataset.fire],t=b.querySelector('span');
  const ready=st&&st.cd<=0&&st.act<=0,txt=!st?'':st.act>0?'on':ready?'ready':Math.ceil(st.cd)+'s';if(t.textContent!==txt)t.textContent=txt;b.classList.toggle('ready',!!ready);b.disabled=!ready}}
$('ultBar').addEventListener('click',e=>{const b=e.target.closest('button');if(b&&fireUlt(b.dataset.fire))refreshUltBar()});
buildUltBar();
