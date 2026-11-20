// Spire — Ultimate weapons: run-time behaviour, effects, the Ultimates tab and manual fire buttons. Data in config.js.
const ultLv=(k,t)=>(save.ults[k]||{})[t]||0, ultOwned=k=>!!save.ults[k];
function ultVal(u,tr,l){const t=u.t.find(x=>x.k===tr);let v=t.base+t.per*l;if(t.min!=null)v=Math.max(t.min,v);if(t.max!=null)v=Math.min(t.max,v);return+v.toFixed(3)}
const uv=(k,tr)=>ultVal(UK[k],tr,ultLv(k,tr)), ultManual=k=>!!save.set.ultMan[k];
const ultFx=[]; // render-only effects (real time)
function ultInit(){run.ult={};run.frostSlow=0;for(const u of ULTS)run.ult[u.k]={cd:uv(u.k,'cd')*.5,act:0,x:0,y:0}}
const inRange=()=>enemies.filter(e=>!e.dead&&e.dist<=run.s.range+e.d.sz);
function ultTick(dt,tgt){const R=run;if(!R.ult)ultInit();R.frostSlow=0;
  for(const u of ULTS){if(!ultOwned(u.k))continue;const st=R.ult[u.k];
    if(st.act>0){st.act-=dt;
      if(u.k==='frost')R.frostSlow=uv('frost','slow');
      if(u.k==='grav'){const r2=uv('grav','radius')**2;for(const e of enemies){if(e.dead)continue;const dx=st.x-e.x,dy=st.y-e.y,d2=dx*dx+dy*dy;if(d2>r2||d2<1)continue;const d=Math.sqrt(d2),m=Math.min(d,ULT.pull*dt/e.d.weight);e.x+=dx/d*m;e.y+=dy/d*m}}}
    else if(st.cd>0)st.cd-=dt;
    if(st.cd<=0&&st.act<=0&&!ultManual(u.k)&&tgt)fireUlt(u.k,tgt)}}
function fireUlt(k,tgt){const R=run,st=R.ult&&R.ult[k];if(!st||!ultOwned(k)||st.cd>0||st.act>0||R.over)return false;
  const near=inRange();if(!near.length)return false;tgt=tgt&&!tgt.dead?tgt:near.sort((a,b)=>a.dist-b.dist)[0];
  st.cd=uv(k,'cd');save.stats.ultUses++;const now=performance.now();
  if(k==='chain'){const dmg=R.s.damage*uv('chain','dmg'),hit=new Set();let e=tgt;const pts=[[0,0]];
    for(let j=0;j<uv('chain','jumps')&&e;j++){hit.add(e);pts.push([e.x,e.y]);damage(e,dmg,0);
      let best=null,bd=ULT.chainJump**2;for(const o of enemies){if(o.dead||hit.has(o))continue;const d=(o.x-e.x)**2+(o.y-e.y)**2;if(d<bd){bd=d;best=o}}e=best}
    ultFx.push({k,pts:pts.map(p=>p.slice()),jit:pts.map(()=>[Math.random()-.5,Math.random()-.5]),at:now})}
  else if(k==='frost'){st.act=uv('frost','dur')}
  else if(k==='shock'){const f=uv('shock','force'),sn=uv('shock','stun'),lim=spawnMax();
    for(const e of near){const d=Math.hypot(e.x,e.y)||1,m=Math.min(f/e.d.weight,lim-d);if(m>0){e.x+=e.x/d*m;e.y+=e.y/d*m;e.px=e.x;e.py=e.y}e.stunT=Math.max(e.stunT,sn)}
    ultFx.push({k,at:now,r:R.s.range})}
  else if(k==='grav'){const r2=uv('grav','radius')**2;let best=near[0],bc=-1;
    for(const a of near){let c=0;for(const b of near)if((a.x-b.x)**2+(a.y-b.y)**2<=r2)c++;if(c>bc){bc=c;best=a}}
    st.x=best.x;st.y=best.y;st.act=uv('grav','dur')}
  return true}
// ---- drawing (called from draw()) ----
function drawUlts(sc,W){const R=run;if(!R||!R.ult)return;const now=performance.now(),dpr=W/(stage.clientWidth||W);
  if(R.frostSlow){ctx.fillStyle=C.alloy;ctx.globalAlpha=.07;ctx.beginPath();ctx.arc(0,0,R.s.range,0,6.283);ctx.fill();ctx.globalAlpha=.5;ctx.strokeStyle=C.alloy;ctx.lineWidth=2*dpr/sc;ctx.stroke();ctx.globalAlpha=1}
  const g=R.ult.grav;if(g&&g.act>0){const r=uv('grav','radius'),a0=now/300;ctx.strokeStyle=C.shard;ctx.lineWidth=2*dpr/sc;
    for(let i=0;i<3;i++){ctx.globalAlpha=.25+.2*i;ctx.beginPath();ctx.arc(g.x,g.y,r*(1-i*.3),a0+i,a0+i+4);ctx.stroke()}
    ctx.globalAlpha=.12;ctx.fillStyle=C.shard;ctx.beginPath();ctx.arc(g.x,g.y,r,0,6.283);ctx.fill();ctx.globalAlpha=1}
  for(let i=ultFx.length-1;i>=0;i--){const f=ultFx[i],k=(now-f.at)/(f.k==='chain'?260:450);if(k>=1){ultFx.splice(i,1);continue}
    if(f.k==='chain'){ctx.strokeStyle=C.barrier;ctx.lineWidth=3*dpr/sc;ctx.globalAlpha=1-k;ctx.beginPath();ctx.moveTo(f.pts[0][0],f.pts[0][1]);
      for(let j=1;j<f.pts.length;j++){const [x0,y0]=f.pts[j-1],[x1,y1]=f.pts[j],mx=(x0+x1)/2+f.jit[j][0]*30,my=(y0+y1)/2+f.jit[j][1]*30;ctx.lineTo(mx,my);ctx.lineTo(x1,y1)}ctx.stroke()}
    else if(f.k==='shock'){ctx.strokeStyle=C.gold;ctx.lineWidth=4*dpr/sc;ctx.globalAlpha=(1-k)*.8;ctx.beginPath();ctx.arc(0,0,CFG.towerR+k*f.r,0,6.283);ctx.stroke()}}
  ctx.globalAlpha=1;
  // stunned enemies get a gold dashed ring
  ctx.strokeStyle=C.gold;ctx.lineWidth=1.5*dpr/sc;ctx.setLineDash([3*dpr/sc,3*dpr/sc]);ctx.beginPath();
  for(const e of enemies)if(!e.dead&&e.stunT>0){const x=IX(e),y=IY(e),r=e.d.sz*1.5;ctx.moveTo(x+r,y);ctx.arc(x,y,r,0,6.283)}ctx.stroke();ctx.setLineDash([]);
}
// ---- Ultimates tab ----
const ultIcon=u=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="var(--${u.col})" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${u.icon}</svg>`;
function ultsHtml(){
  let h=`<p class="note">Ultimate weapons are bought and upgraded with <b class="chip">chips</b> (the same chips as Equipment). Every one you own is always active. Each fires on its own cooldown, automatically, or set it to Manual and fire it with its button under the arena.</p>
  <div class="lhead"><span>Chips <b class="chip">${fmt(save.chips)}</b></span></div><div class="armory ults">`;
  for(const u of ULTS){const own=ultOwned(u.k),man=ultManual(u.k);
    h+=`<div class="item${own?' eq':' locked'}" style="--c:var(--${u.col})"><div class="itop">${ultIcon(u)}<div><b>${u.n}</b><span class="note" style="margin:0;display:block">${u.d}</span></div></div>`;
    if(!own)h+=`<div class="ibtns"><button class="buy chip" data-ubuy="${u.k}" ${save.chips>=ULT.unlock?'':'disabled'}>Unlock ${fmt(ULT.unlock)}</button></div>`;
    else{for(const t of u.t){const l=ultLv(u.k,t.k),mx=l>=ULT.max,c=ULT.cost(l),cur=ultVal(u,t.k,l),nx=ultVal(u,t.k,l+1),capped=mx||nx===cur;
        h+=`<div class="utr"><div><b>${t.n}</b> <span class="v">Lv ${l}/${ULT.max}</span><span class="v">${t.f(cur)}${capped?' (max)':` → ${t.f(nx)}`}</span></div>${capped?'<button class="buy" disabled>Max</button>':`<button class="buy chip" data-uup="${u.k}" data-t="${t.k}" ${save.chips>=c?'':'disabled'}><span class="q">+1</span>${fmt(c)}</button>`}</div>`}
      h+=`<div class="subs" style="margin:4px 0 0"><button data-umode="${u.k}" data-v="auto" class="${man?'':'on'}">Auto</button><button data-umode="${u.k}" data-v="man" class="${man?'on':''}">Manual</button></div>`}
    h+='</div>'}
  return h+'</div>'}
$('panel').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;
  if(d.ubuy){if(save.chips<ULT.unlock)return;save.chips-=ULT.unlock;save.stats.chipsSpent=(save.stats.chipsSpent||0)+ULT.unlock;save.ults[d.ubuy]={};if(run&&run.ult)run.ult[d.ubuy].cd=uv(d.ubuy,'cd')*.5}
  else if(d.uup){const l=ultLv(d.uup,d.t),c=ULT.cost(l);if(l>=ULT.max||save.chips<c)return;save.chips-=c;save.stats.chipsSpent=(save.stats.chipsSpent||0)+c;save.ults[d.uup][d.t]=l+1}
  else if(d.umode){save.set.ultMan[d.umode]=d.v==='man'}
  else return;
  persist();loSig='';refreshLoadout();buildUltBar()});
// ---- manual fire buttons under the arena ----
function buildUltBar(){const el=$('ultBar');el.innerHTML=ULTS.filter(u=>ultOwned(u.k)&&ultManual(u.k)).map(u=>`<button class="ultb" data-fire="${u.k}" style="--c:var(--${u.col})" title="${u.n}">${ultIcon(u)}<span></span></button>`).join('')}
function refreshUltBar(){for(const b of $('ultBar').children){const st=run&&!run.over&&run.ult&&run.ult[b.dataset.fire],t=b.querySelector('span');
  const ready=st&&st.cd<=0&&st.act<=0,txt=!st?'':st.act>0?'on':ready?'ready':Math.ceil(st.cd)+'s';if(t.textContent!==txt)t.textContent=txt;b.classList.toggle('ready',!!ready);b.disabled=!ready}}
$('ultBar').addEventListener('click',e=>{const b=e.target.closest('button');if(b&&fireUlt(b.dataset.fire))refreshUltBar()});
buildUltBar();
