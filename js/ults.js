// Spire — Ultimate weapons: run-time behaviour, effects, the Ultimates tab and manual fire buttons. Data in config.js.
const ultLv=(k,t)=>(save.ults[k]||{})[t]||0, ultOwned=k=>!!save.ults[k];
// strength tracks grow base × (1 + level/band)^pow; the rest move evenly from base to end over all levels
const trackVal=(t,l)=>{const n=Math.min(l,t.lv);return t.pow?t.base*(1+n/ULT.band)**t.pow:t.base+(t.end-t.base)*n/t.lv};
function ultVal(u,tr,l){return+trackVal(u.t.find(x=>x.k===tr),l).toFixed(4)}
const uv=(k,tr)=>ultVal(UK[k],tr,ultLv(k,tr));
// how complete an ultimate is: the average progress of its 4 tracks (0 to 1)
const ultProg=k=>UK[k].t.reduce((a,t)=>a+Math.min(1,ultLv(k,t.k)/t.lv),0)/UK[k].t.length;
// a level's price: the 100-level price at the same point in the tier bands, × √(100/lv) for short tracks
const ultCost=(t,l)=>Math.ceil((t.lv>=ULT.levels?ULT.cost(l):ULT.cost(Math.floor(l*ULT.levels/t.lv))*Math.sqrt(ULT.levels/t.lv))*(t.cm||1));
const ultUnlock=u=>Math.ceil(ULT.unlock*u.cost); // ... times the ultimate's own price multiplier
// status: 0 none, 1 Silver, 2 Gold, 3 Platinum, from how complete the ultimate is (ULT.medals)
function ultStatus(k){if(!ultOwned(k))return 0;const p=ultProg(k)+1e-9;let s=0;for(const m of ULT.medals)if(p>=m)s++;return s}
const ultPerm=k=>UK[k].perm&&ultStatus(k)>=1; // ultimates marked perm are always on at Silver (none right now)
const ultManual=k=>!!save.set.ultMan[k]&&!ultPerm(k)&&!UK[k].passive;
// 1.23: tracks went from 4-20 levels to 40-100; convert old levels proportionally so every track keeps its value
// the track layout used from 1.23 to 1.32 ([base, per level, levels, % growth]); old saves convert through it
const ULT_V3={chain:{chance:[.1,.01,50],jumps:[2,.1,40],mult:[.4,.01,50],dmg:[2,.2,100]},frost:{slow:[.3,.013,50],rate:[.5,.07,50],radius:[.6,.028,50],brittle:[.002,.00018,100]},
    shock:{force:[40,0,100,.04],stun:[1,.05,60],radius:[.6,.008,50],cd:[90,-1.4,50]},grav:{radius:[50,1.2,50],pull:[70,0,100,.04],dur:[10,1,50],cd:[300,-4,60]},laser:{dmg:[3,.3,100],width:[10,.4,50],dur:[3,.2,60],cd:[60,-.8,60]}};
if((save.ultV||1)<2){for(const k in save.ults){const u=UK[k],o=ULT_OLD_LV[k];if(!u||!o)continue;
  for(const t of u.t){const l=save.ults[k][t.k];if(l&&o[t.k])save.ults[k][t.k]=Math.min((ULT_V3[k][t.k]||[0,0,t.lv])[2],Math.round(l/o[t.k]*((ULT_V3[k][t.k]||[0,0,t.lv])[2])))}
  for(const tk of Object.keys(save.ults[k]))if(!u.t.some(t=>t.k===tk)){let back=0;for(let i=0;i<save.ults[k][tk];i++)back+=Math.ceil(10*1.6**i);delete save.ults[k][tk];if(back){save.chips+=back;save.refund=(save.refund||0)+back}}}
  save.ultV=2;persist()}
// 1.25: Shockwave Force and Gravity Well Pull grow by % per level (100 levels); convert old levels to the same value
if(save.ultV<3){const conv=(k,tk,old)=>{const l=(save.ults[k]||{})[tk];if(!l)return;const o=ULT_V3[k][tk];save.ults[k][tk]=Math.min(o[2],Math.round(Math.log(old(l)/o[0])/Math.log(1+o[3])))};
  conv('shock','force',l=>40+1.6*l);conv('grav','pull',l=>70+2*l);save.ultV=3;persist()}
// 1.33: every track has 400 levels in tier bands; convert each level to the first new level that's at least as strong
if(save.ultV<4){const O=ULT_V3;
  for(const k in save.ults){const u=UK[k];if(!u)continue;for(const t of u.t){const l=save.ults[k][t.k],o=O[k]&&O[k][t.k];if(!l||!o)continue;
    const n=Math.min(l,o[2]),v=o[3]?o[0]*(1+o[3])**n:o[0]+o[1]*n;let nl=0;
    if(t.pow)nl=Math.ceil(ULT.band*((v/t.base)**(1/t.pow)-1)-1e-9);else nl=Math.ceil((v-t.base)/(t.end-t.base)*t.lv-1e-9);
    save.ults[k][t.k]=Math.max(0,Math.min(t.lv,nl))}}
  save.ultV=4;persist()}
// 1.34: 400 levels per track became 100 (5 per tier band); level n now equals old level 4n, so round up
if(save.ultV<5){for(const k in save.ults)for(const tk in save.ults[k])save.ults[k][tk]=Math.min(ULT.levels,Math.ceil(save.ults[k][tk]/4));save.ultV=5;persist()}
// 1.35: capped stats got their own short tracks; convert by progress, rounding up so nothing weakens
if(save.ultV<6){for(const k in save.ults){const u=UK[k];if(!u)continue;for(const t of u.t){const l=save.ults[k][t.k];if(l&&t.lv<ULT.levels)save.ults[k][t.k]=Math.min(t.lv,Math.ceil(l*t.lv/ULT.levels-1e-9))}}save.ultV=6;persist()}
// 1.39: Shockwave's Stun became a weight-scaled Damage multiplier; Stun levels are refunded at their price
if(save.ultV<7){const sh=save.ults.shock;if(sh&&sh.stun){const old={lv:12,cm:UK.shock.cost};let back=0;for(let i=0;i<Math.min(12,sh.stun);i++)back+=ultCost(old,i);delete sh.stun;if(back){save.chips+=back;save.refund=(save.refund||0)+back}}save.ultV=7;persist()}
const ultFx=[]; // render-only effects (real time)
function ultInit(){run.ult={};run.frostR=0;run.frostCap=0;for(const u of ULTS)run.ult[u.k]={cd:u.passive?0:uv(u.k,'cd')*.5,act:0,x:0,y:0,ang:0,after:0,tick:0}}
const inRange=()=>enemies.filter(e=>!e.dead&&e.dist<=run.s.range+e.d.sz);
// extra damage enemies take from Silver ultimates
function ultDmgMult(e){const R=run,S=R&&R.ultSt;if(!S)return 1;let m=1;
  if(e.fs&&R.brittle)m*=1+e.fs*R.brittle*(e.frzT>0&&S.frost>=2?2:1); // Frost Field brittle: more damage per frost stack (doubled while frozen at Gold)
  if(e.shakenAt!=null&&R.time-e.shakenAt<ULT.shaken)m*=e.shakeM; // Shockwave: shaken enemies take × (multiplier × weight)
  return m}
function ultTick(dt,tgt){const R=run;if(!R.ult)ultInit();R.ultSt={};for(const u of ULTS)R.ultSt[u.k]=ultStatus(u.k);const S=R.ultSt;
  R.chainP=ultOwned('chain')?uv('chain','chance'):0; // read on every bullet hit
  frostTick(dt,S.frost||0);shockRings(dt,S.shock||0);missileTick(dt,S.missile||0);
  for(const u of ULTS){if(!ultOwned(u.k)||u.passive)continue;const st=R.ult[u.k];
    if(u.k==='grav'){gravTick(dt,st,S.grav||0);continue} // its own rules: several wells, cooldown from cast
    if(ultPerm(u.k)){ // always on; the laser re-aims every few seconds
      if(st.act<=0){st.cd=0;fireUlt(u.k,tgt)}st.act=Math.max(st.act,1)}
    if(u.k==='shock'&&st.after>0&&(st.after-=dt)<=0)shockBlast(true); // Platinum (Echo): a second ring
    if(st.act>0){st.act-=dt;
      // damage over time lands in dotHz chunks (same total damage, far fewer hits to process); movement stays per step
      const dotT=(st.dot=(st.dot||0)+dt)>=1/CFG.dotHz?st.dot:0;if(dotT)st.dot=0;
      if(u.k==='laser'){const L=S.laser||0;
        if(L>=1){const t=biggest();if(t){let da=Math.atan2(t.y,t.x)-st.ang;da=Math.atan2(Math.sin(da),Math.cos(da));const turn=(L>=3?ULT.laserTurnFast:ULT.laserTurn)*dt;st.ang+=Math.max(-turn,Math.min(turn,da))}} // Silver: tracking
        if(dotT){const w=uv('laser','width')/2,dmg=R.s.damage*uv('laser','dmg')*dotT,cx=Math.cos(st.ang),cy=Math.sin(st.ang);
          for(const e of enemies){if(e.dead||e.x*cx+e.y*cy<=0||Math.abs(e.x*cy-e.y*cx)>w+e.d.sz)continue;
            if(L>=2)e.noHealAt=R.time; // Gold (Cauterize)
            if(L>=3){e.slowT=Math.max(e.slowT,1/CFG.dotHz+.05);e.slowF=Math.max(e.slowF||0,.5)} // Platinum (Lock-on): slowed inside the beam
            damage(e,dmg,0,false,1)}}}}
    else if(st.cd>0)st.cd-=dt;
    if(st.cd<=0&&st.act<=0&&!ultManual(u.k)&&tgt)fireUlt(u.k,tgt)}}
// Gravity Well: each well opens on the biggest cluster not already inside a well and pulls enemies within its radius in (pull ÷
// weight, never through the crowd). The cooldown counts from when a well opens, so Duration ≥ Cooldown keeps one up for good;
// up to ULT.maxWells at once. Silver: a well that ends collapses, yanking everything within 2× its radius in. Gold: kills inside
// add ULT.siphon s (up to 2× its duration). Platinum: enemies inside are ULT.heavy × as heavy (wtOf).
function gravTick(dt,st,S){const R=run,W=R.wells||(R.wells=[]),rad=uv('grav','radius'),r2=rad*rad,pull=uv('grav','pull');
  for(let i=W.length-1;i>=0;i--){const w=W[i];w.act-=dt;
    forNear(w.x,w.y,rad,e=>{const dx=w.x-e.x,dy=w.y-e.y,d2=dx*dx+dy*dy;if(d2>r2)return;if(S>=3)e.heavyAt=R.time;if(e.d.immov)return;
      if(d2>=1){const d=Math.sqrt(d2);walk(e,dx/d,dy/d,Math.min(d,pull*dt/e.wt))}}); // pulled in, but no closer than the crowd allows
    if(w.act<=0){if(S>=1)gravCollapse(w,rad,pull);W.splice(i,1)}}
  if(st.cd>0)st.cd-=dt;st.act=0;
  if(st.cd<=0&&!ultManual('grav'))openWell(st)}
function openWell(st){const R=run,W=R.wells||(R.wells=[]);if(W.length>=ULT.maxWells||R.over)return false;
  const rad=uv('grav','radius'),r2=rad*rad,inWell=e=>W.some(w=>(e.x-w.x)**2+(e.y-w.y)**2<=r2);
  const near=inRange().filter(e=>!inWell(e));if(!near.length)return false;const m=Math.min(near.length,ULT.gravSample);let best=near[0],bc=-1;
  // up to gravSample candidates (all of them in small crowds), each counting its neighbours through the grid
  for(let i=0;i<m;i++){const a=m<near.length?near[Math.floor(Math.random()*near.length)]:near[i];let c=0;forNear(a.x,a.y,rad,b=>{if((a.x-b.x)**2+(a.y-b.y)**2<=r2)c++});if(c>bc){bc=c;best=a}}
  const dur=uv('grav','dur');W.push({x:best.x,y:best.y,act:dur,max:dur*2});st.cd=uv('grav','cd');save.stats.ultUses++;return true}
function gravCollapse(w,rad,pull){const R2=(2*rad)**2;forNear(w.x,w.y,2*rad,e=>{const dx=w.x-e.x,dy=w.y-e.y,d2=dx*dx+dy*dy;if(d2>R2||d2<1||e.d.immov)return;
  const d=Math.sqrt(d2);walk(e,dx/d,dy/d,Math.min(d,pull*ULT.collapse/e.wt));e.px=e.x;e.py=e.y;e.rest=0});ultFx.push({k:'collapse',x:w.x,y:w.y,r:2*rad,at:performance.now()})}
// Gold (Siphon): a kill inside a well keeps it open longer
function gravSiphon(e){const W=run.wells;if(!W)return;const r2=uv('grav','radius')**2;for(const w of W)if((e.x-w.x)**2+(e.y-w.y)**2<=r2){w.act=Math.min(w.max,w.act+ULT.siphon);break}}
// how heavy an enemy counts for being pushed or shaken: Gravity Well Platinum makes those inside a well heavier
const wtOf=e=>e.wt*(run&&run.ultSt&&run.ultSt.grav>=3&&e.heavyAt!=null&&run.time-e.heavyAt<.25?ULT.heavy:1);
// Frost Field: always on. Every 1/rate s, enemies touching the field gain a frost stack. Stacks never wear off and have
// no limit; slow is stacks × ULT.frostPer up to the Max slow track (95% at most), brittle adds damage taken per stack.
function frostTick(dt,st){const R=run;if(!ultOwned('frost')){R.frostR=R.frostCap=R.brittle=0;return}
  R.frostR=R.s.range*uv('frost','radius');R.frostCap=Math.min(.95,uv('frost','slow'));R.brittle=uv('frost','brittle');
  const F=R.ult.frost,maxSt=Math.ceil(R.frostCap/ULT.frostPer-1e-9);F.tick+=dt;
  if(F.tick>=1/uv('frost','rate')){F.tick=0;const r=R.frostR;
    for(const e of enemies){if(e.dead||e.dist>r+e.d.sz)continue;e.fs++;
      if(st>=1&&!e.frz1&&e.fs>=maxSt){e.frz1=true;e.frzT=ULT.freeze}}} // Silver: freeze the first time it reaches max slow
  // Platinum: each step an enemy shot spends inside the field it may melt, ULT.melt chance per 10 m travelled
  if(st>=3){const r2=R.frostR**2,p=1-(1-ULT.melt)**(CFG.ebSpd*dt/10);for(let i=ebs.length-1;i>=0;i--){const b=ebs[i];if(b.x*b.x+b.y*b.y<=r2&&Math.random()<p){ebs[i]=ebs[ebs.length-1];ebs.pop();ebPool.push(b)}}}}
// Shockwave: a ring travels out from the spire to its radius in ULT.ringTime. Each enemy it reaches is shoved outward (force ÷ weight,
// never through the crowd) and shaken for ULT.shaken s: it takes damage × (multiplier × weight) from everything. No damage of its own.
let ringId=0;
// how hard enemy e is shaken: the multiplier × its weight (bosses count bossWt of theirs), never below 1
const shakeOf=e=>Math.max(1,uv('shock','dmg')*(e.d.r===3?wtOf(e)*ULT.bossWt:wtOf(e)));
// Gold (Aftershock): a shaken enemy that dies passes its shake to enemies within spreadR for the time it had left,
// at each one's own strength (a stronger or longer shake already on them is kept)
function shakeSpread(e){const R=run,r2=ULT.spreadR**2;forNear(e.x,e.y,ULT.spreadR,o=>{if(o===e||(o.x-e.x)**2+(o.y-e.y)**2>r2)return;
  const active=o.shakenAt!=null&&R.time-o.shakenAt<ULT.shaken;if(active&&o.shakenAt>=e.shakenAt)return;
  o.shakeM=Math.max(active?o.shakeM:1,shakeOf(o));o.shakenAt=e.shakenAt})}
function shockBlast(after){const R=run;(R.rings||(R.rings=[])).push({id:++ringId,r:0,rad:R.s.range*uv('shock','radius'),after})}
function shockRings(dt,st){const R=run;if(!R.rings||!R.rings.length)return;const f=uv('shock','force'),lim=spawnMax();
  for(let i=R.rings.length-1;i>=0;i--){const g=R.rings[i],r0=g.r;g.r=Math.min(g.rad,g.r+g.rad/ULT.ringTime*dt);
    const hit=enemies.filter(e=>!e.dead&&e.ring!==g.id&&e.dist-e.d.sz<=g.r&&e.dist+e.d.sz>=r0-1).sort((a,b)=>b.dist-a.dist);
    for(const e of hit){e.ring=g.id;const d=Math.hypot(e.x,e.y)||1,m=e.d.immov?0:Math.min(f/wtOf(e),lim-d); // immovable: shaken but not pushedlet moved=m;
      if(m>0){moved=walk(e,e.x/d,e.y/d,m);e.px=e.x;e.py=e.y;e.rest=0}
      const blocked=m>0?Math.max(0,1-moved/m):0;
      e.shakeM=shakeOf(e)*(st>=1?1+blocked*ULT.crush:1);e.shakenAt=R.time} // Silver (Crush): pinned enemies are shaken harder
    if(g.r>=g.rad)R.rings.splice(i,1)}}
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
// Missiles: each homes in on the enemy with the least health (retargeting if it dies first). On impact it deals spire damage ×
// Missile damage × (1 + Low-health bonus × the share of health the target is missing) to the target and the same to everything
// within the blast radius. Silver: 2 bomblets at the next weakest nearby, 50% damage. Gold: non-boss targets under 15% die
// outright. Platinum: 3 missiles per launch.
function weakest(n,skip,x,y,r){const out=[];for(const e of enemies){if(e.dead||e.age<CFG.fadeIn||(skip&&skip.has(e)))continue;
    if(r!=null&&(e.x-x)**2+(e.y-y)**2>r*r)continue;
    if(out.length<n||e.hp<out[out.length-1].hp){out.push(e);out.sort((a,b)=>a.hp-b.hp);if(out.length>n)out.pop()}}return out}
function launchMissiles(S){const R=run,M=R.missiles||(R.missiles=[]);for(const t of weakest(S>=3?ULT.salvo:1))M.push({x:0,y:0,px:0,py:0,t,g:t.gen,m:1})}
function missileTick(dt,S){const R=run,M=R.missiles;if(!M||!M.length)return;const step=ULT.missileSpd*dt;
  for(let i=M.length-1;i>=0;i--){const m=M[i];m.px=m.x;m.py=m.y;let t=m.t;
    if(t.dead||t.gen!==m.g){t=weakest(1)[0];if(!t){M.splice(i,1);continue}m.t=t;m.g=t.gen} // its target died: find the next weakest
    const dx=t.x-m.x,dy=t.y-m.y,d=Math.hypot(dx,dy);
    if(d>step+t.d.sz){m.x+=dx/d*step;m.y+=dy/d*step;continue}
    M.splice(i,1);missileHit(m,t,S)}}
function missileHit(m,t,S){const R=run,low=uv('missile','low'),dmg=R.s.damage*uv('missile','dmg')*(1+low*Math.max(0,1-t.hp/t.mhp))*m.m,rad=uv('missile','radius');
  const hitE=(o,f)=>{const v=S>=3?dmg*ULT.mStack**(o.mh||0):dmg;o.mh=(o.mh||0)+1;damage(o,v,0,false,f)}; // Platinum: each earlier missile hit on this enemy multiplies the damage
  if(S>=2&&t.d.r!==3&&t.hp/t.mhp<ULT.execute)damage(t,t.hp+1,0,false,2); // Gold (Execute)
  else hitE(t,0);
  forNear(t.x,t.y,rad,o=>{if(o!==t&&(o.x-t.x)**2+(o.y-t.y)**2<=rad*rad)hitE(o,1)}); // collateral: the same damage to everything in the blast
  if(S>=1&&m.m===1){const M=R.missiles||(R.missiles=[]);for(const b of weakest(ULT.bomblets,new Set([t]),t.x,t.y,ULT.bombletR))M.push({x:t.x,y:t.y,px:t.x,py:t.y,t:b,g:b.gen,m:.5})} // Silver (Cluster)
  if(ultFx.length<80)ultFx.push({k:'boom',x:t.x,y:t.y,r:rad*(m.m<1?.6:1),at:performance.now()})}
// the living enemy with the most health (absolute, not %): Laser's target
function biggest(){let b=null,h=-1;for(const e of enemies)if(!e.dead&&e.age>=CFG.fadeIn&&e.hp>h){h=e.hp;b=e}return b}
function fireUlt(k,tgt){const R=run,st=R.ult&&R.ult[k];if(!st||!ultOwned(k)||UK[k].passive||st.cd>0||st.act>0||R.over)return false;
  if(k==='grav')return openWell(st);
  const near=inRange();if(!near.length)return false;tgt=tgt&&!tgt.dead?tgt:near.sort((a,b)=>a.dist-b.dist)[0];
  st.cd=uv(k,'cd');save.stats.ultUses++;const S=R.ultSt||{},now=performance.now();
  if(k==='missile')launchMissiles(S.missile||0);
  else if(k==='shock'){shockBlast(false);if(S.shock>=3)st.after=ULT.aftershock}
  else if(k==='laser'){const t=biggest()||tgt;st.ang=Math.atan2(t.y,t.x);st.act=uv('laser','dur')} // aims at the enemy with the most health
  return true}
// ---- drawing (called from draw()) ----
function drawUlts(sc,W){const R=run;if(!R||!R.ult)return;const now=performance.now(),dpr=W/(stage.clientWidth||W);
  if(R.frostR){ctx.fillStyle=C.alloy;ctx.globalAlpha=.08;ctx.beginPath();ctx.arc(0,0,R.frostR,0,6.283);ctx.fill();ctx.globalAlpha=.55;ctx.strokeStyle=C.alloy;ctx.lineWidth=2*dpr/sc;ctx.stroke();ctx.globalAlpha=1}
  if(R.wells&&R.wells.length&&ultOwned('grav')){const r=uv('grav','radius'),a0=now/300;ctx.strokeStyle=C.shard;ctx.lineWidth=2*dpr/sc;
    for(const g of R.wells){for(let i=0;i<3;i++){ctx.globalAlpha=.25+.2*i;ctx.beginPath();ctx.arc(g.x,g.y,r*(1-i*.3),a0+i,a0+i+4);ctx.stroke()}
      ctx.globalAlpha=.12;ctx.fillStyle=C.shard;ctx.beginPath();ctx.arc(g.x,g.y,r,0,6.283);ctx.fill()}ctx.globalAlpha=1}
  const L=R.ult.laser;if(L&&ultOwned('laser')){const len=spawnMax()*1.5,w=uv('laser','width');
    if(L.act>0){const cx=Math.cos(L.ang)*len,cy=Math.sin(L.ang)*len,fl=.85+.15*Math.sin(now/40),x0=0,y0=0;
      ctx.lineCap='round';ctx.strokeStyle=C.hot;ctx.globalAlpha=.25*fl;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(cx,cy);ctx.stroke();
      ctx.globalAlpha=.9*fl;ctx.lineWidth=Math.max(2*dpr/sc,w*.25);ctx.stroke();ctx.globalAlpha=1;ctx.lineCap='butt'}
    else if(L.cd<1.5){const k=1-Math.max(0,L.cd)/1.5;ctx.fillStyle=C.hot;ctx.globalAlpha=.15+.5*k;ctx.beginPath();ctx.arc(0,0,CFG.towerR+4+8*k,0,6.283);ctx.fill();ctx.globalAlpha=1}} // charging glow
  if(R.missiles&&R.missiles.length){ctx.strokeStyle=C.chip;ctx.fillStyle=C.chip;ctx.lineCap='round';
    for(const m of R.missiles){const x=IX(m),y=IY(m),s=(m.m<1?2.5:4)*dpr/sc;ctx.globalAlpha=.5;ctx.lineWidth=s;ctx.beginPath();ctx.moveTo(m.px,m.py);ctx.lineTo(x,y);ctx.stroke();ctx.globalAlpha=1;ctx.beginPath();ctx.arc(x,y,s,0,6.283);ctx.fill()}ctx.lineCap='butt'}
  if(R.rings)for(const g of R.rings){ctx.strokeStyle=C.gold;ctx.lineWidth=(g.after?2.5:4)*dpr/sc;ctx.globalAlpha=.85*(1-g.r/g.rad)+.15;ctx.beginPath();ctx.arc(0,0,CFG.towerR+g.r,0,6.283);ctx.stroke()}
  ctx.globalAlpha=1;
  for(let i=ultFx.length-1;i>=0;i--){const f=ultFx[i],k=(now-f.at)/(f.k==='chain'?260:450);if(k>=1){ultFx.splice(i,1);continue}
    if(f.k==='chain'){if(i<ultFx.length-CFG.boltsDrawn)continue; // only the newest bolts; one path each
      ctx.strokeStyle=C.bolt;ctx.globalAlpha=1-k;ctx.fillStyle=C.bolt;ctx.beginPath();ctx.arc(f.x,f.y,5*dpr/sc,0,6.283);ctx.fill();
      ctx.lineWidth=2*dpr/sc;ctx.beginPath();for(const [x0,y0,x1,y1,jx,jy] of f.segs){const L=Math.hypot(x1-x0,y1-y0)*.35;ctx.moveTo(x0,y0);ctx.lineTo((x0+x1)/2+jx*L,(y0+y1)/2+jy*L);ctx.lineTo(x1,y1)}ctx.stroke()}
    else if(f.k==='boom'){ctx.fillStyle=C.chip;ctx.globalAlpha=(1-k)*.35;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(.4+.6*k),0,6.283);ctx.fill();ctx.strokeStyle=C.chip;ctx.lineWidth=2*dpr/sc;ctx.globalAlpha=(1-k)*.8;ctx.stroke()}
    else if(f.k==='collapse'){ctx.strokeStyle=C.shard;ctx.lineWidth=3*dpr/sc;ctx.globalAlpha=(1-k)*.8;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(1-k),0,6.283);ctx.stroke()}
    else if(f.k==='shock'){ctx.strokeStyle=C.gold;ctx.lineWidth=(f.after?2.5:4)*dpr/sc;ctx.globalAlpha=(1-k)*.8;ctx.beginPath();ctx.arc(0,0,CFG.towerR+k*f.r,0,6.283);ctx.stroke()}}
  ctx.globalAlpha=1;
  // Chargers winding up: a ring fills as the charge builds, so you can see the ram coming
  ctx.strokeStyle=C.e9;ctx.lineWidth=2.5*dpr/sc;for(const e of enemies)if(!e.dead&&e.d.charge&&e.cs===1){const x=IX(e),y=IY(e),r=e.d.sz*1.8,k=Math.min(1,e.ct/e.d.charge);ctx.globalAlpha=.4+.6*k;ctx.beginPath();ctx.arc(x,y,r,-Math.PI/2,-Math.PI/2+6.283*k);ctx.stroke()}ctx.globalAlpha=1;
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
  while(n<lim&&l+n<t.lv){const nc=ultCost(t,l+n);if(ui.mult==='Max'&&n>0&&c+nc>save.chips)break;c+=nc;n++}return{n,c}}
const ultDone=k=>UK[k].t.reduce((a,t)=>a+ultLv(k,t.k),0),ultTotal=k=>UK[k].t.reduce((a,t)=>a+t.lv,0);
function ultsHtml(){
  if(!ultOpen||!ultOwned(ultOpen))ultOpen=(ULTS.find(u=>ultOwned(u.k))||{}).k||null;
  let h=`<div class="lhead"><span>Chips <b class="chip">${fmt(save.chips)}</b></span><div class="mults sm">${[1,10,'Max'].map(m=>`<button data-mult="${m}" class="${ui.mult===m?'on':''}">${m==='Max'?'Max':'×'+m}</button>`).join('')}</div></div><div class="ulist">`;
  for(const u of ULTS){const own=ultOwned(u.k),open=own&&ultOpen===u.k,done=own?ultDone(u.k):0,tot=ultTotal(u.k);
    h+=`<div class="urow${open?' open':''}${own?'':' locked'}" style="--c:var(--${u.col})">`;
    h+=`<button class="uhead" ${own?`data-uopen="${u.k}" aria-expanded="${open}"`:'tabindex="-1"'}>${ultIcon(u)}<span class="un"><b>${u.n}</b> ${medal(u.k)}<i class="uprog"><i style="transform:scaleX(${own?ultProg(u.k):0})"></i></i></span><span class="ul">${own?`${Math.round(ultProg(u.k)*100)}%`:''}</span></button>`;
    if(!own)h+=`<button class="buy chip ubuy" data-ubuy="${u.k}" ${save.chips>=ultUnlock(u)?'':'disabled'}>Unlock ${fmt(ultUnlock(u))}</button>`;
    if(open){const stt=ultStatus(u.k),M=ULT.medals,pr=ultProg(u.k),lvl=m=>`${Math.min(Math.round(m*100),Math.floor(pr*100))}/${Math.round(m*100)}% complete`;
      h+=`<div class="ubody"><p class="note">${u.d} <b>Prices ×${u.cost}</b>${u.cost>1?' (one of the stronger ultimates)':u.cost<1?' (one of the cheaper ultimates)':''}.</p><div class="ustat"><span class="medal s${stt>=1?' on':''}">Silver</span><span>${lvl(M[0])}: <b>${u.sb}</b></span><span class="medal g${stt>=2?' on':''}">Gold</span><span>${lvl(M[1])}: <b>${u.gb}</b></span><span class="medal p${stt>=3?' on':''}">Platinum</span><span>${lvl(M[2])}: <b>${u.pb}</b></span></div>`;
      for(const t of u.t){const l=ultLv(u.k,t.k),mx=l>=t.lv,cur=ultVal(u,t.k,l),{n,c}=mx?{n:0,c:0}:ultBuyPlan(u.k,t),nx=ultVal(u,t.k,l+n);
        h+=`<div class="utr"><div><b>${t.n}</b> <span class="v">${t.f(cur)}${mx?'':` → ${t.f(nx)}`}</span><i class="uprog"><i style="transform:scaleX(${l/t.lv})"></i></i><span class="v">Lv ${l}/${t.lv}</span></div>${mx?'<button class="buy" disabled>Max</button>':`<button class="buy chip" data-uup="${u.k}" data-t="${t.k}" ${save.chips>=c?'':'disabled'}><span class="q">+${n}</span>${fmt(c)}</button>`}</div>`}
      h+=respecBtn('ult:'+u.k,'Refund upgrades');
      h+=u.aura?'<p class="note" style="margin:4px 0 0">Always on, no cooldown.</p>':u.passive?'<p class="note" style="margin:4px 0 0">Triggers on your shots, no cooldown.</p>':ultPerm(u.k)?'<p class="note" style="margin:4px 0 0">Always on.</p>':`<div class="subs" style="margin:6px 0 0"><button data-umode="${u.k}" data-v="auto" class="${ultManual(u.k)?'':'on'}">Auto</button><button data-umode="${u.k}" data-v="man" class="${ultManual(u.k)?'on':''}">Manual</button></div>`;
      h+='</div>'}
    h+='</div>'}
  return h+`</div><p class="note" style="margin-top:8px">Bought with <b class="chip">chips</b> (shared with Equipment). Every ultimate you own is active. Its medals come from how complete it is (the average of its 4 upgrades): <b>Silver</b> at ${Math.round(ULT.medals[0]*100)}%, <b>Gold</b> at ${Math.round(ULT.medals[1]*100)}%, <b>Platinum</b> at ${Math.round(ULT.medals[2]*100)}%; each adds a bonus. Strength upgrades have ${ULT.levels} levels (${ULT.band} per tier); the others have a few big steps that get expensive fast.</p>`}
$('panel').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;
  if(d.uopen){ultOpen=ultOpen===d.uopen?'':d.uopen;loSig='';refreshLoadout();return}
  if(d.ubuy){const uc=ultUnlock(UK[d.ubuy]);if(save.chips<uc)return;save.chips-=uc;save.stats.chipsSpent=(save.stats.chipsSpent||0)+uc;save.ults[d.ubuy]={};ultOpen=d.ubuy;if(run&&run.ult&&!UK[d.ubuy].passive)run.ult[d.ubuy].cd=uv(d.ubuy,'cd')*.5}
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
