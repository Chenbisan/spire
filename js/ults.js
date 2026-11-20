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
const ultFx=[]; // render-only effects (real time)
function ultInit(){run.ult={};run.frostSlow=0;run.frostR=0;for(const u of ULTS)run.ult[u.k]={cd:u.passive?0:uv(u.k,'cd')*.5,act:0,x:0,y:0,ang:0,after:0}}
const inRange=()=>enemies.filter(e=>!e.dead&&e.dist<=run.s.range+e.d.sz);
// extra damage enemies take from Silver ultimates
function ultDmgMult(e){const R=run,S=R&&R.ultSt;if(!S)return 1;let m=1;
  if(R.frostSlow&&S.frost>=1&&e.dist<=R.frostR)m*=1.2;
  if(e.stunT>0&&S.shock>=1)m*=1.25;
  const g=R.ult.grav;if(g&&g.act>0&&S.grav>=1&&(e.x-g.x)**2+(e.y-g.y)**2<=uv('grav','radius')**2)m*=1.2;
  return m}
function ultTick(dt,tgt){const R=run;if(!R.ult)ultInit();R.frostSlow=0;R.ultSt={};for(const u of ULTS)R.ultSt[u.k]=ultStatus(u.k);const S=R.ultSt;
  R.chainP=ultOwned('chain')?uv('chain','chance'):0; // read on every bullet hit
  for(const u of ULTS){if(!ultOwned(u.k)||u.passive)continue;const st=R.ult[u.k];
    if(ultPerm(u.k)){ // always on; the well and the laser re-aim every few seconds
      const mover=u.k==='grav'||u.k==='laser';if(mover)st.mv=(st.mv||0)-dt;
      if(st.act<=0||(mover&&st.mv<=0)){st.cd=0;st.act=0;if(fireUlt(u.k,tgt))st.mv=u.k==='laser'?ULT.laserAim:ULT.gravMove}st.act=Math.max(st.act,1)}
    if(u.k==='shock'&&st.after>0&&(st.after-=dt)<=0)shockBlast(true);
    if(st.act>0){st.act-=dt;
      if(u.k==='frost'){R.frostSlow=Math.min(.8,uv('frost','slow')+(S.frost>=2?.2:0));R.frostR=R.s.range*uv('frost','radius');
        if(S.frost>=3){const r2=R.frostR**2;for(let i=ebs.length-1;i>=0;i--){const b=ebs[i];if(b.x*b.x+b.y*b.y<=r2){ebs[i]=ebs[ebs.length-1];ebs.pop();ebPool.push(b)}}}}
      if(u.k==='grav'){const r2=uv('grav','radius')**2,pull=uv('grav','pull'),dps=S.grav>=2?R.s.damage*2*dt:0;
        for(const e of enemies){if(e.dead)continue;const dx=st.x-e.x,dy=st.y-e.y,d2=dx*dx+dy*dy;if(d2>r2)continue;
          if(d2>=1){const d=Math.sqrt(d2),m=Math.min(d,pull*dt/e.d.weight);e.x+=dx/d*m;e.y+=dy/d*m}
          if(S.grav>=3)e.stunT=Math.max(e.stunT,dt*2);if(dps)damage(e,dps,0,false,1)}}
      if(u.k==='laser'){const w=uv('laser','width')/2,dps=R.s.damage*uv('laser','dmg')*(S.laser>=2?1.5:1)*dt,cx=Math.cos(st.ang),cy=Math.sin(st.ang),both=S.laser>=3;
        for(const e of enemies){if(e.dead)continue;if(!both&&e.x*cx+e.y*cy<=0)continue;if(Math.abs(e.x*cy-e.y*cx)<=w+e.d.sz)damage(e,dps,0,false,S.laser>=1?3:1)}}}
    else if(st.cd>0)st.cd-=dt;
    if(st.cd<=0&&st.act<=0&&!ultManual(u.k)&&tgt)fireUlt(u.k,tgt)}}
function shockBlast(after){const R=run,S=R.ultSt||{},f=uv('shock','force'),sn=uv('shock','stun'),lim=spawnMax(),rad=R.s.range*uv('shock','radius'),bd=S.shock>=2?R.s.damage*20:0;
  for(const e of enemies){if(e.dead||e.dist>rad+e.d.sz)continue;const d=Math.hypot(e.x,e.y)||1,m=Math.min(f/e.d.weight,lim-d);
    if(m>0){e.x+=e.x/d*m;e.y+=e.y/d*m;e.px=e.x;e.py=e.y}e.stunT=Math.max(e.stunT,sn);if(bd&&!e.dead)damage(e,bd,0)}
  ultFx.push({k:'shock',at:performance.now(),r:rad,after})}
// Chain Lightning: sparked by a bullet hit on e. Each enemy struck has the proc chance to split into `jumps` new bolts to
// nearby unhit enemies (within ULT.chainJump m), each doing `mult` × the previous bolt's damage. Capped for performance.
function chainBolt(e0){const R=run,S=R.ultSt||{},ch=uv('chain','chance'),n=uv('chain','jumps'),mul=uv('chain','mult'),jr=ULT.chainJump**2,hits=S.chain>=2?2:1;
  const hit=new Set([e0]),segs=[],q=[[e0,R.s.damage*uv('chain','dmg'),0]];save.stats.ultUses++;
  const strike=(e,v0)=>{for(let h=0;h<hits;h++){let c=0,v=v0;if(S.chain>=1&&Math.random()<R.s.crit){c=1;v*=R.s.critMult;if(Math.random()<R.s.superCrit){c=2;v*=R.s.superMult}}damage(e,v,c)}
    if(S.chain>=3){e.slowT=2;e.slowF=Math.max(e.slowF||0,.5)}};
  for(let qi=0;qi<q.length;qi++){const [e,v,dp]=q[qi];strike(e,v);
    if(dp>=ULT.chainDepth||hit.size>=ULT.chainMax||Math.random()>=ch)continue;
    const near=[];for(const o of enemies){if(o.dead||hit.has(o))continue;const d=(o.x-e.x)**2+(o.y-e.y)**2;if(d<=jr)near.push([d,o])}
    near.sort((a,b)=>a[0]-b[0]);for(const [,o] of near.slice(0,n)){if(hit.size>=ULT.chainMax)break;hit.add(o);segs.push([e.x,e.y,o.x,o.y,Math.random()-.5,Math.random()-.5,dp]);q.push([o,v*mul,dp+1])}}
  if(ultFx.length<80)ultFx.push({k:'chain',x:e0.x,y:e0.y,segs,at:performance.now()})}
function fireUlt(k,tgt){const R=run,st=R.ult&&R.ult[k];if(!st||!ultOwned(k)||UK[k].passive||st.cd>0||st.act>0||R.over)return false;
  const near=inRange();if(!near.length)return false;tgt=tgt&&!tgt.dead?tgt:near.sort((a,b)=>a.dist-b.dist)[0];
  st.cd=uv(k,'cd');save.stats.ultUses++;const S=R.ultSt||{},now=performance.now();
  if(k==='frost'){st.act=uv('frost','dur')}
  else if(k==='shock'){shockBlast(false);if(S.shock>=3)st.after=ULT.aftershock}
  else if(k==='laser'){st.ang=Math.atan2(tgt.y,tgt.x);st.act=uv('laser','dur')}
  else if(k==='grav'){const r2=uv('grav','radius')**2;let best=near[0],bc=-1;
    for(const a of near){let c=0;for(const b of near)if((a.x-b.x)**2+(a.y-b.y)**2<=r2)c++;if(c>bc){bc=c;best=a}}
    st.x=best.x;st.y=best.y;st.act=uv('grav','dur')}
  return true}
// ---- drawing (called from draw()) ----
function drawUlts(sc,W){const R=run;if(!R||!R.ult)return;const now=performance.now(),dpr=W/(stage.clientWidth||W);
  if(R.frostSlow){ctx.fillStyle=C.alloy;ctx.globalAlpha=.08;ctx.beginPath();ctx.arc(0,0,R.frostR,0,6.283);ctx.fill();ctx.globalAlpha=.55;ctx.strokeStyle=C.alloy;ctx.lineWidth=2*dpr/sc;ctx.stroke();ctx.globalAlpha=1}
  const g=R.ult.grav;if(g&&g.act>0&&ultOwned('grav')){const r=uv('grav','radius'),a0=now/300;ctx.strokeStyle=C.shard;ctx.lineWidth=2*dpr/sc;
    for(let i=0;i<3;i++){ctx.globalAlpha=.25+.2*i;ctx.beginPath();ctx.arc(g.x,g.y,r*(1-i*.3),a0+i,a0+i+4);ctx.stroke()}
    ctx.globalAlpha=.12;ctx.fillStyle=C.shard;ctx.beginPath();ctx.arc(g.x,g.y,r,0,6.283);ctx.fill();ctx.globalAlpha=1}
  const L=R.ult.laser;if(L&&ultOwned('laser')){const len=spawnMax()*1.5,w=uv('laser','width');
    if(L.act>0){const cx=Math.cos(L.ang)*len,cy=Math.sin(L.ang)*len,fl=.85+.15*Math.sin(now/40),x0=(R.ultSt&&R.ultSt.laser>=3)?-cx:0,y0=(R.ultSt&&R.ultSt.laser>=3)?-cy:0;
      ctx.lineCap='round';ctx.strokeStyle=C.hot;ctx.globalAlpha=.25*fl;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(cx,cy);ctx.stroke();
      ctx.globalAlpha=.9*fl;ctx.lineWidth=Math.max(2*dpr/sc,w*.25);ctx.stroke();ctx.globalAlpha=1;ctx.lineCap='butt'}
    else if(L.cd<1.5){const k=1-Math.max(0,L.cd)/1.5;ctx.fillStyle=C.hot;ctx.globalAlpha=.15+.5*k;ctx.beginPath();ctx.arc(0,0,CFG.towerR+4+8*k,0,6.283);ctx.fill();ctx.globalAlpha=1}} // charging glow
  for(let i=ultFx.length-1;i>=0;i--){const f=ultFx[i],k=(now-f.at)/(f.k==='chain'?260:450);if(k>=1){ultFx.splice(i,1);continue}
    if(f.k==='chain'){ctx.strokeStyle=C.barrier;ctx.globalAlpha=1-k;ctx.fillStyle=C.barrier;ctx.beginPath();ctx.arc(f.x,f.y,5*dpr/sc,0,6.283);ctx.fill(); // spark, then branches thinning with depth
      for(const [x0,y0,x1,y1,jx,jy,dp] of f.segs){const L=Math.hypot(x1-x0,y1-y0)*.35;ctx.lineWidth=Math.max(1,3-dp*.5)*dpr/sc;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo((x0+x1)/2+jx*L,(y0+y1)/2+jy*L);ctx.lineTo(x1,y1);ctx.stroke()}}
    else if(f.k==='shock'){ctx.strokeStyle=C.gold;ctx.lineWidth=(f.after?2.5:4)*dpr/sc;ctx.globalAlpha=(1-k)*.8;ctx.beginPath();ctx.arc(0,0,CFG.towerR+k*f.r,0,6.283);ctx.stroke()}}
  ctx.globalAlpha=1;
  // stunned enemies get a gold dashed ring
  ctx.strokeStyle=C.gold;ctx.lineWidth=1.5*dpr/sc;ctx.setLineDash([3*dpr/sc,3*dpr/sc]);ctx.beginPath();
  for(const e of enemies)if(!e.dead&&e.stunT>0){const x=IX(e),y=IY(e),r=e.d.sz*1.5;ctx.moveTo(x+r,y);ctx.arc(x,y,r,0,6.283)}ctx.stroke();ctx.setLineDash([]);
}
// ---- Ultimates tab ----
const MCLS=['','s','g','p'];
const medal=k=>{const s=ultStatus(k);return s?`<span class="medal ${MCLS[s]} on">${MEDALS[s]}</span>`:''};
const ultIcon=u=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="var(--${u.col})" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${u.icon}</svg>`;
function ultsHtml(){
  let h=`<p class="note">Ultimate weapons are bought and upgraded with <b class="chip">chips</b> (the same chips as Equipment). Every one you own is always active and fires on its own cooldown, automatically, or set it to Manual and fire it with its button under the arena. Max upgrades to earn <b>Silver</b> (the 2 marked ★), <b>Gold</b> (any 3) and <b>Platinum</b> (all 4); each adds a bonus.</p>
  <div class="lhead"><span>Chips <b class="chip">${fmt(save.chips)}</b></span></div><div class="armory ults">`;
  for(const u of ULTS){const own=ultOwned(u.k),man=ultManual(u.k);
    h+=`<div class="item${own?' eq':' locked'}" style="--c:var(--${u.col})"><div class="itop">${ultIcon(u)}<div><b>${u.n}</b> ${medal(u.k)}<span class="note" style="margin:0;display:block">${u.d}</span></div></div>`;
    if(!own)h+=`<div class="ibtns"><button class="buy chip" data-ubuy="${u.k}" ${save.chips>=ULT.unlock?'':'disabled'}>Unlock ${fmt(ULT.unlock)}</button></div>`;
    else{const stt=ultStatus(u.k),pair=u.silverT.map(tk=>u.t.find(t=>t.k===tk).n).join(' + ');
      h+=`<div class="ustat"><span class="medal s${stt>=1?' on':''}">Silver</span><span>Max ${pair}: <b>${u.sb}</b></span><span class="medal g${stt>=2?' on':''}">Gold</span><span>Max any 3: <b>${u.gb}</b></span><span class="medal p${stt>=3?' on':''}">Platinum</span><span>Max all 4: <b>${u.pb}</b></span></div>`;
      for(const t of u.t){const l=ultLv(u.k,t.k),mx=l>=t.lv,c=ULT.cost(l),cur=ultVal(u,t.k,l),nx=ultVal(u,t.k,l+1);
        h+=`<div class="utr"><div><b>${u.silverT.includes(t.k)?'★ ':''}${t.n}</b> <span class="v">Lv ${l}/${t.lv}</span><span class="v">${t.f(cur)}${mx?' (max)':` → ${t.f(nx)}`}</span></div>${mx?'<button class="buy" disabled>Max</button>':`<button class="buy chip" data-uup="${u.k}" data-t="${t.k}" ${save.chips>=c?'':'disabled'}><span class="q">+1</span>${fmt(c)}</button>`}</div>`}
      h+=u.passive?'<p class="note" style="margin:4px 0 0">Triggers on your shots, no cooldown.</p>':ultPerm(u.k)?'<p class="note" style="margin:4px 0 0">Always on.</p>':`<div class="subs" style="margin:4px 0 0"><button data-umode="${u.k}" data-v="auto" class="${man?'':'on'}">Auto</button><button data-umode="${u.k}" data-v="man" class="${man?'on':''}">Manual</button></div>`}
    h+='</div>'}
  return h+'</div>'}
$('panel').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;
  if(d.ubuy){if(save.chips<ULT.unlock)return;save.chips-=ULT.unlock;save.stats.chipsSpent=(save.stats.chipsSpent||0)+ULT.unlock;save.ults[d.ubuy]={};if(run&&run.ult)run.ult[d.ubuy].cd=uv(d.ubuy,'cd')*.5}
  else if(d.uup){const t=UK[d.uup].t.find(x=>x.k===d.t),l=ultLv(d.uup,d.t),c=ULT.cost(l);if(l>=t.lv||save.chips<c)return;const before=ultStatus(d.uup);
    save.chips-=c;save.stats.chipsSpent=(save.stats.chipsSpent||0)+c;save.ults[d.uup][d.t]=l+1;const after=ultStatus(d.uup);if(after>before)toast(`${UK[d.uup].n} reached ${MEDALS[after]}!`)}
  else if(d.umode){save.set.ultMan[d.umode]=d.v==='man'}
  else return;
  persist();loSig='';refreshLoadout();buildUltBar()});
// ---- manual fire buttons under the arena ----
function buildUltBar(){const el=$('ultBar');el.innerHTML=ULTS.filter(u=>ultOwned(u.k)&&ultManual(u.k)).map(u=>`<button class="ultb" data-fire="${u.k}" style="--c:var(--${u.col})" title="${u.n}">${ultIcon(u)}<span></span></button>`).join('')}
function refreshUltBar(){for(const b of $('ultBar').children){const st=run&&!run.over&&run.ult&&run.ult[b.dataset.fire],t=b.querySelector('span');
  const ready=st&&st.cd<=0&&st.act<=0,txt=!st?'':st.act>0?'on':ready?'ready':Math.ceil(st.cd)+'s';if(t.textContent!==txt)t.textContent=txt;b.classList.toggle('ready',!!ready);b.disabled=!ready}}
$('ultBar').addEventListener('click',e=>{const b=e.target.closest('button');if(b&&fireUlt(b.dataset.fire))refreshUltBar()});
buildUltBar();
