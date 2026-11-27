// Spire — Ultimate weapons: run-time behaviour, effects, the Ultimates tab and manual fire buttons. Data in config.js.
const ultDesc=u=>typeof u.d==='function'?u.d():u.d; // some descriptions are built from your current upgrade values
const ultLv=(k,t)=>(save.ults[k]||{})[t]||0, ultOwned=k=>!!save.ults[k];
// Hackers: run.hack[k] = {e: the Hacker, g: its gen, d: levels drained per track, n: levels drained in all, acc}. A Hacker
// at the spire drains hackRate random levels a second (each remaining level equally likely), so an Ultimate with more
// levels lasts longer. In a run an Ultimate works at its remaining levels, and with none left it's off (ultLive false)
// until the Hacker dies
const hackOf=k=>typeof run!=='undefined'&&run&&!run.over&&run.hack&&run.hack[k];
const ultLvTot=k=>UK[k].t.reduce((a,t)=>a+ultLv(k,t.k),0);
const hackF=k=>{const h=hackOf(k);if(!h)return 0;const T=ultLvTot(k);return T?Math.min(1,h.n/T):1};
const ultLive=k=>ultOwned(k)&&hackF(k)<1;
const ultLvH=(k,t)=>{const l=ultLv(k,t),h=hackOf(k);return h?Math.max(0,l-(h.d[t]||0)):l};
// strength tracks grow base × (1 + level/band)^pow; the rest move evenly from base to end over all levels
const trackVal=(t,l)=>{const n=Math.min(l,t.lv);return t.pow?t.base*(1+n/ULT.band)**t.pow:t.base+(t.end-t.base)*n/t.lv};
function ultVal(u,tr,l){return+trackVal(u.t.find(x=>x.k===tr),l).toFixed(4)}
const uv=(k,tr)=>ultVal(UK[k],tr,ultLvH(k,tr));
// Ultimate damage is spire damage × the average multiplier crits give your shots, so every crit stat raises it:
// 1 + crit × (crit damage − 1) + crit × super crit × crit damage × (super crit damage − 1). Linear in crit chance, so it keeps
// working if crit chance ever goes past 100%. Ultimates don't roll crits themselves unless one says so (Chain Lightning Silver).
const ultDmg=()=>run.s.damage*critX(run.s);
// how complete an ultimate is: the average progress of its 4 tracks (0 to 1)
const ultProg=k=>UK[k].t.reduce((a,t)=>a+Math.min(1,ultLv(k,t.k)/t.lv),0)/UK[k].t.length;
// a level's price: on a full-length track, ULT.cost of that step; a short track's level costs every full-length step it spans,
// so every track costs the same to finish and all four move through the medals together
const ultCost=(t,l)=>{const L=ULT.levels,cm=t.cm||1;if(t.lv>=L)return Math.ceil(ULT.cost(l)*cm);
  const a=Math.floor(l*L/t.lv),b=Math.floor((l+1)*L/t.lv);let c=0;for(let j=a;j<b;j++)c+=ULT.cost(j);return Math.ceil(c*cm)};
// unlock price: ULT.unlock × the ultimate's own price multiplier × unlockGrow for every ultimate you already own (each one costs more)
const ultUnlock=u=>Math.ceil(ULT.unlock*u.cost*ULT.unlockGrow**Object.keys(save.ults).length);
// status: 0 none, 1 Silver, 2 Gold, 3 Platinum, from how complete the ultimate is (ULT.medals)
function ultStatus(k){if(!ultOwned(k))return 0;const p=ultProg(k)+1e-9;let s=0;for(const m of ULT.medals)if(p>=m)s++;return s}
const ultManual=k=>!!save.set.ultMan[k]&&!UK[k].passive;
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
// migrations before 1.70 use the old lengths: strength tracks 100 levels in bands of 5, short tracks half today's levels
const LV0=t=>t.lv>=ULT.levels?100:t.lv/2;
// 1.33: every track has 400 levels in tier bands; convert each level to the first new level that's at least as strong
if(save.ultV<4){const O=ULT_V3;
  for(const k in save.ults){const u=UK[k];if(!u)continue;for(const t of u.t){const l=save.ults[k][t.k],o=O[k]&&O[k][t.k];if(!l||!o)continue;
    const n=Math.min(l,o[2]),v=o[3]?o[0]*(1+o[3])**n:o[0]+o[1]*n;let nl=0;
    if(t.pow){const p0=t.pow===ULT.dmgPow?1.2:t.pow;nl=Math.ceil(5*((v/t.base)**(1/p0)-1)-1e-9)}else nl=Math.ceil((v-t.base)/(t.end-t.base)*LV0(t)-1e-9);
    save.ults[k][t.k]=Math.max(0,Math.min(LV0(t),nl))}}
  save.ultV=4;persist()}
// 1.34: 400 levels per track became 100 (5 per tier band); level n now equals old level 4n, so round up
if(save.ultV<5){for(const k in save.ults)for(const tk in save.ults[k])save.ults[k][tk]=Math.min(100,Math.ceil(save.ults[k][tk]/4));save.ultV=5;persist()}
// 1.35: capped stats got their own short tracks; convert by progress, rounding up so nothing weakens
if(save.ultV<6){for(const k in save.ults){const u=UK[k];if(!u)continue;for(const t of u.t){const l=save.ults[k][t.k];if(l&&LV0(t)<100)save.ults[k][t.k]=Math.min(LV0(t),Math.ceil(l*LV0(t)/100-1e-9))}}save.ultV=6;persist()}
// 1.39: Shockwave's Stun became a weight-scaled Damage multiplier; Stun levels are refunded at their price
if(save.ultV<7){const sh=save.ults.shock;if(sh&&sh.stun){const old={lv:12,cm:UK.shock.cost};let back=0;for(let i=0;i<Math.min(12,sh.stun);i++)back+=Math.ceil(200*(1+Math.floor(i*100/12)/5)**1.5*Math.sqrt(100/12)*old.cm);delete sh.stun;if(back){save.chips+=back;save.refund=(save.refund||0)+back}}save.ultV=7;persist()}
// 1.70: every track has twice the levels (strength 100 → 200, short tracks doubled) at the same values; double owned levels
if(save.ultV<8){for(const k in save.ults){const u=UK[k];if(!u)continue;for(const t of u.t){const l=save.ults[k][t.k];if(l)save.ults[k][t.k]=Math.min(t.lv,l*2)}}save.ultV=8;persist()}
const ultFx=[]; // render-only effects (real time)
function ultInit(){run.ult={};run.frostR=0;run.frostCap=0;for(const u of ULTS)run.ult[u.k]={cd:u.passive?0:uv(u.k,'cd')*.5,act:0,x:0,y:0,ang:0,after:0,tick:0}}
const inRange=()=>enemies.filter(e=>!e.dead&&e.dist<=run.s.range+e.d.sz);
// extra damage enemies take from Silver ultimates
function ultDmgMult(e){const R=run,S=R&&R.ultSt;if(!S)return 1;let m=1;
  if(e.fs&&R.brittle)m*=1+e.fs*R.brittle*(e.frzT>0&&S.frost>=2?2:1); // Frost Field brittle: more damage per frost stack (doubled while frozen at Gold)
  if(e.shakenAt!=null&&R.time-e.shakenAt<ULT.shaken)m*=e.shakeM; // Shockwave: shaken enemies take × (multiplier × weight)
  return m}
// a Hacker at the spire: keep draining its Ultimate, or pick one no other Hacker has (false: none left, so it attacks)
function hackOn(e,dt){const R=run,H=R.hack||(R.hack={}),h=e.hk&&H[e.hk];
  if(h&&h.e===e&&h.g===e.gen){h.acc+=dt*e.d.hackRate;
    for(;h.acc>=1;h.acc--){const ts=UK[e.hk].t,left=ts.map(t=>ultLvH(e.hk,t.k)),sum=left.reduce((a,b)=>a+b,0);if(!sum){h.acc=0;break}
      let x=Math.random()*sum,i=0;while(x>=left[i]){x-=left[i];i++}const tk=ts[i].k;h.d[tk]=(h.d[tk]||0)+1;h.n++}
    return true}
  const free=ULTS.filter(u=>ultOwned(u.k)&&!H[u.k]);if(!free.length)return false;
  const u=free[Math.floor(Math.random()*free.length)];H[u.k]={e,g:e.gen,d:{},n:0,acc:0};e.hk=u.k;return true}
// medal while hacked: from the drained levels (an Ultimate that's fully drained has none)
function ultStatusH(k){if(!ultLive(k))return 0;if(!hackF(k))return ultStatus(k);const p=UK[k].t.reduce((a,t)=>a+Math.min(1,ultLvH(k,t.k)/t.lv),0)/UK[k].t.length+1e-9;let s=0;for(const m of ULT.medals)if(p>=m)s++;return s}
function ultTick(dt,tgt){const R=run;if(!R.ult)ultInit();
  // a dead (or recycled) Hacker gives its Ultimate every level back
  if(R.hack)for(const k in R.hack){const h=R.hack[k];if(h.e.dead||h.e.gen!==h.g)delete R.hack[k]}
  R.ultSt={};for(const u of ULTS)R.ultSt[u.k]=ultStatusH(u.k);const S=R.ultSt;
  R.chainP=ultLive('chain')?uv('chain','chance'):0; // read on every bullet hit
  frostTick(dt,S.frost||0);shockRings(dt,S.shock||0);missileTick(dt,S.missile||0);firebombTick(dt,S.firebomb||0);
  for(const u of ULTS){if(!ultLive(u.k)||u.passive)continue;const st=R.ult[u.k];
    if(u.k==='grav'){gravTick(dt,st,S.grav||0);continue} // its own rules: several wells, cooldown from cast
    if(u.k==='shock'&&st.after>0&&(st.after-=dt)<=0)shockBlast(true); // Platinum (Echo): a second ring
    if(st.act>0){st.act-=dt;
      // damage over time lands in dotHz chunks (same total damage, far fewer hits to process); movement stays per step
      const dotT=(st.dot=(st.dot||0)+dt)>=1/CFG.dotHz?st.dot:0;if(dotT)st.dot=0;
      if(u.k==='laser'){const L=S.laser||0;
        // Silver: tracking. The beam stays locked on the enemy it chose and only picks a new one (the one with the most health now) once that enemy dies
        if(L>=1){let t=st.big;if(!t||t.dead||t.gen!==st.bigGen){t=st.big=biggest();st.bigGen=t?t.gen:0}if(t){let da=Math.atan2(t.y,t.x)-st.ang;da=Math.atan2(Math.sin(da),Math.cos(da));const turn=(L>=3?ULT.laserTurnFast:ULT.laserTurn)*dt;st.ang+=Math.max(-turn,Math.min(turn,da))}}
        if(dotT){const w=uv('laser','width')/2,dmg=ultDmg()*uv('laser','dmg')*dotT,cx=Math.cos(st.ang),cy=Math.sin(st.ang);
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
function frostTick(dt,st){const R=run;if(!ultLive('frost')){R.frostR=R.frostCap=R.brittle=0;return}
  R.frostR=uv('frost','radius');R.frostCap=Math.min(.95,uv('frost','slow'));R.brittle=uv('frost','brittle');
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
const shakeOf=e=>Math.max(1,uv('shock','dmg')*(isBoss(e.d)?wtOf(e)*ULT.bossWt:wtOf(e)));
// Gold (Aftershock): a shaken enemy that dies passes its shake to enemies within spreadR for the time it had left,
// at each one's own strength (a stronger or longer shake already on them is kept)
function shakeSpread(e){const R=run,r2=ULT.spreadR**2;forNear(e.x,e.y,ULT.spreadR,o=>{if(o===e||(o.x-e.x)**2+(o.y-e.y)**2>r2)return;
  const active=o.shakenAt!=null&&R.time-o.shakenAt<ULT.shaken;if(active&&o.shakenAt>=e.shakenAt)return;
  o.shakeM=Math.max(active?o.shakeM:1,shakeOf(o));o.shakenAt=e.shakenAt})}
function shockBlast(after){const R=run;(R.rings||(R.rings=[])).push({id:++ringId,r:0,rad:R.s.range*uv('shock','radius'),after})}
function shockRings(dt,st){const R=run;if(!R.rings||!R.rings.length)return;const f=uv('shock','force'),lim=spawnMax();
  for(let i=R.rings.length-1;i>=0;i--){const g=R.rings[i],r0=g.r;g.r=Math.min(g.rad,g.r+g.rad/ULT.ringTime*dt);
    const hit=enemies.filter(e=>!e.dead&&e.ring!==g.id&&e.dist-e.d.sz<=g.r&&e.dist+e.d.sz>=r0-1).sort((a,b)=>b.dist-a.dist);
    for(const e of hit){e.ring=g.id;const d=Math.hypot(e.x,e.y)||1,m=e.d.immov?0:Math.min(f/wtOf(e),lim-d);let moved=m; // (immovable: shaken but not pushed)
      if(m>0){moved=walk(e,e.x/d,e.y/d,m);e.px=e.x;e.py=e.y;e.rest=0}
      const blocked=m>0?Math.max(0,1-moved/m):0;
      e.shakeM=shakeOf(e)*(st>=1?1+blocked*ULT.crush:1);e.shakenAt=R.time} // Silver (Crush): pinned enemies are shaken harder
    if(g.r>=g.rad)R.rings.splice(i,1)}}
// Chain Lightning: sparked by a bullet hit on e. Each enemy struck has the proc chance to split into `jumps` new bolts to
// nearby unhit enemies (within ULT.chainJump m), each doing `mult` × the previous bolt's damage. Capped for performance.
let chainStamp=0;const chainQ=[],chainV=[],chainD=[],chainNear=[],chainNd=[];
function chainBolt(e0){const R=run,S=R.ultSt||{},ch=uv('chain','chance'),nf=uv('chain','jumps'),mul=uv('chain','mult'),jr=ULT.chainJump**2,hits=S.chain>=2?2:1;
  const stamp=++chainStamp,fx=ultFx.length<80,segs=fx?[]:null;let hitN=1;e0.cz=stamp;save.stats.ultUses++;
  chainQ.length=chainV.length=chainD.length=0;chainQ.push(e0);chainV.push(ultDmg()*uv('chain','dmg'));chainD.push(0);
  // Gold strikes twice: each strike rolls its own crit, but they land as one damage call (half the work) unless the target has
  // a shield, where each strike must take off a shield of its own
  const crit=S.chain>=1,rs=R.s;
  const strike=(e,v0)=>{let tot=0,cmax=0;for(let h=0;h<hits;h++){let c=0,v=v0;if(crit){c=critRoll(rs);if(c)v*=critDmg(rs,c)}
      if(e.shield>0){damage(e,v,c);continue}tot+=v;if(c>cmax)cmax=c}if(tot>0)damage(e,tot,cmax)
    if(S.chain>=3){e.slowT=2;e.slowF=Math.max(e.slowF||0,.5)}};
  for(let qi=0;qi<chainQ.length;qi++){const e=chainQ[qi],v=chainV[qi],dp=chainD[qi];strike(e,v);
    if(dp>=ULT.chainDepth||hitN>=ULT.chainMax||Math.random()>=ch)continue;
    // the n nearest unhit enemies within the jump range, kept in a short sorted list
    const n=Math.floor(nf)+(Math.random()<nf%1?1:0); // fractional targets: the remainder is the chance of one more
    chainNear.length=chainNd.length=0;
    // scans the crowd grid directly, with no callback (this runs thousands of times a second with big multishot/bounce builds)
    const ex=e.x,ey=e.y,jd=ULT.chainJump,all=!sepBuilt,c0x=all?0:sepCell(ex-jd),c1x=all?0:sepCell(ex+jd),c0y=all?0:sepCell(ey-jd),c1y=all?0:sepCell(ey+jd);
    if(n>0)for(let gy=c0y;gy<=c1y;gy++)for(let gx=c0x;gx<=c1x;gx++)for(let j=all?0:sepHead[gy*SEPN+gx];all?j<enemies.length:j!==-1;j=all?j+1:sepNext[j]){
      const o=enemies[j];if(!o||o.dead||o.cz===stamp)continue;const d=(o.x-ex)**2+(o.y-ey)**2;if(d>jr)continue;
      if(chainNear.length===n&&d>=chainNd[n-1])continue;let i=chainNear.length===n?n-1:chainNear.length;
      while(i>0&&chainNd[i-1]>d){chainNear[i]=chainNear[i-1];chainNd[i]=chainNd[i-1];i--}chainNear[i]=o;chainNd[i]=d}
    for(const o of chainNear){if(hitN>=ULT.chainMax)break;o.cz=stamp;hitN++;if(segs)segs.push([e.x,e.y,o.x,o.y,Math.random()-.5,Math.random()-.5,dp]);chainQ.push(o);chainV.push(v*mul);chainD.push(dp+1)}}
  if(fx)ultFx.push({k:'chain',x:e0.x,y:e0.y,segs,at:performance.now()})}
// Missiles: each homes in on the enemy with the least health (retargeting if it dies first). On impact it deals spire damage ×
// Missile damage × (1 + Low-health bonus × the share of health the target is missing) to the target and the same to everything
// within the blast radius. Silver: 2 bomblets at the next weakest nearby, 50% damage. Gold: non-boss targets under 15% die
// outright. Platinum: 3 missiles per launch.
function weakest(n,skip,x,y,r){const out=[];for(const e of enemies){if(e.dead||e.age<CFG.fadeIn||(skip&&skip.has(e)))continue;
    if(r!=null&&(e.x-x)**2+(e.y-y)**2>r*r)continue;
    if(out.length<n||e.hp<out[out.length-1].hp){out.push(e);out.sort((a,b)=>a.hp-b.hp);if(out.length>n)out.pop()}}return out}
function launchMissiles(S){const R=run,M=R.missiles||(R.missiles=[]);for(const t of weakest(S>=3?ULT.salvo:1))M.push({x:0,y:0,px:0,py:0,t,g:t.gen,m:1,a:Math.atan2(t.y,t.x)})}
// the live enemy closest to (x,y), for missiles over the cap
function closestTo(x,y){let best=null,bd=Infinity;for(const e of enemies){if(e.dead||e.age<CFG.fadeIn)continue;const d=(e.x-x)**2+(e.y-y)**2;if(d<bd){bd=d;best=e}}return best}
// a missile with no target flies a lazy circle around the spire at missileOrbit of the view radius (steering back onto it if it's
// further in or out), so missiles in the air when the field clears stay on screen and wait for the next enemy
function missileLoiter(m,dt,step){const r=Math.hypot(m.x,m.y)||1,rr=viewFit()*ULT.missileOrbit,ux=m.x/r,uy=m.y/r,k=Math.max(-1,Math.min(1,(rr-r)/(rr*.3)));
  const dx=-uy+ux*k,dy=ux+uy*k;let da=Math.atan2(dy,dx)-m.a;da=Math.atan2(Math.sin(da),Math.cos(da));const tn=ULT.missileTurn*3*dt;
  m.a+=Math.max(-tn,Math.min(tn,da));m.x+=Math.cos(m.a)*step;m.y+=Math.sin(m.a)*step;
  const tr=m.tr||(m.tr=[]);tr.push(m.x,m.y);if(tr.length>ULT.missileTrail*2)tr.splice(0,2)}
function missileTick(dt,S){const R=run,M=R.missiles;if(!M||!M.length)return;const step=ULT.missileSpd*dt;
  for(let i=M.length-1;i>=0;i--){const m=M[i];m.px=m.x;m.py=m.y;let t=m.t;
    // give up: a missile (not a bomblet) still flying after missileGiveUp game seconds stops chasing the weakest enemy and dives at
    // the enemy nearest to it (n), so missiles can't pile up chasing targets that keep dying before they arrive
    if(!m.b&&!m.n&&(m.f=(m.f||0)+dt)>=ULT.missileGiveUp){m.n=1;const c=closestTo(m.x,m.y);if(c){t=m.t=c;m.g=c.gen;m.k=0}}
    // its target died: find the next weakest, or the nearest for a missile that gave up (k, the time spent chasing this target,
    // starts again). A bomblet (b) only looks within bombletR of the blast that threw it, and explodes where it is if nothing's there
    if(!t||t.dead||t.gen!==m.g){t=m.b?weakest(1,null,m.ox,m.oy,ULT.bombletR)[0]:m.n?closestTo(m.x,m.y):weakest(1)[0];
      if(!t&&m.b){M.splice(i,1);blastAt(m,m.x,m.y,S);continue}
      // nothing left to chase (the field is clear): circle the spire until an enemy shows up, then go for it
      if(!t){m.t=null;missileLoiter(m,dt,step);continue}
      m.t=t;m.g=t.gen;m.k=0}
    // a bomblet never flies further than bombletR in all: past that it explodes where it is
    if(m.b&&(m.tv=(m.tv||0)+step)>ULT.bombletR){M.splice(i,1);blastAt(m,m.x,m.y,S);continue}
    const dx=t.x-m.x,dy=t.y-m.y,d=Math.hypot(dx,dy);
    if(d<=step+t.d.sz){M.splice(i,1);missileHit(m,t,S);continue}
    // steer: turns towards the target at most missileTurn rad/s (wide, sweeping arcs), sharpening by missileSharpen every second it
    // chases this target and much more as it closes in (missileHome), so it homes in instead of circling; a new target resets both
    m.k=(m.k||0)+dt;let da=Math.atan2(dy,dx)-m.a;da=Math.atan2(Math.sin(da),Math.cos(da));const rm=Math.hypot(m.x,m.y)/(viewFit()*ULT.missileLeash);
    // leash: past missileLeash of the view radius it turns harder and harder, so wide arcs stay on screen
    const tn=ULT.missileTurn*(m.b?ULT.bombletTurn:1)*(1+ULT.missileSharpen*m.k)*(1+(ULT.missileHome/Math.max(1,d))**2)*(rm>1?1+30*(rm-1):1)*dt;
    m.a+=Math.max(-tn,Math.min(tn,da));m.x+=Math.cos(m.a)*step;m.y+=Math.sin(m.a)*step;
    // smoke trail: the last missileTrail positions
    const tr=m.tr||(m.tr=[]);tr.push(m.x,m.y);if(tr.length>ULT.missileTrail*2)tr.splice(0,2)}}
// a bomblet that lost its target (or ran out of range) bursts where it is: its damage to everything in the blast radius
function blastAt(m,x,y,S){const rad=uv('missile','radius'),dmg=ultDmg()*uv('missile','dmg')*m.m;
  forNear(x,y,rad,o=>{if((o.x-x)**2+(o.y-y)**2>rad*rad)return;const v=S>=3?dmg*ULT.mStack**(o.mh||0):dmg;o.mh=(o.mh||0)+1;damage(o,v,0,false,1)})}
function missileHit(m,t,S){const R=run,low=uv('missile','low'),dmg=ultDmg()*uv('missile','dmg')*(1+low*Math.max(0,1-t.hp/t.mhp))*m.m,rad=uv('missile','radius');
  const hitE=(o,f)=>{const v=S>=3?dmg*ULT.mStack**(o.mh||0):dmg;o.mh=(o.mh||0)+1;damage(o,v,0,false,f)}; // Platinum: each earlier missile hit on this enemy multiplies the damage
  if(S>=2&&!isBoss(t.d)&&t.hp/t.mhp<ULT.execute)damage(t,t.hp+1,0,false,6); // Gold (Execute): straight through any Protector
  else hitE(t,0);
  forNear(t.x,t.y,rad,o=>{if(o!==t&&(o.x-t.x)**2+(o.y-t.y)**2<=rad*rad)hitE(o,1)}); // collateral: the same damage to everything in the blast
  // Silver (Cluster): the bomblets burst out of the far side of the enemy hit, fanned in a V around the missile's direction of travel,
  // and curve onto the weakest other enemies within bombletR (with fewer targets than bomblets, they share them)
  if(S>=1&&m.m===1){const M=R.missiles||(R.missiles=[]),tg=weakest(ULT.bomblets,new Set([t]),t.x,t.y,ULT.bombletR),n=ULT.bomblets,fan=ULT.bombletFan*Math.PI/180;
    if(tg.length)for(let i=0;i<n;i++){const b=tg[i%tg.length];M.push({x:t.x,y:t.y,px:t.x,py:t.y,t:b,g:b.gen,m:.5,a:(m.a||0)+(n>1?(i/(n-1)-.5)*2*fan:0),b:1,ox:t.x,oy:t.y,tv:0})}}
  if(ultFx.length<80)ultFx.push({k:'boom',x:t.x,y:t.y,r:rad*(m.m<1?.6:1),at:performance.now()})}
// Firebomb: lobs a firebomb at the enemy that has stood still the longest (e.still); it lands ULT.shellFlight s later and leaves
// a flaming carpet for Carpet duration s. Every dotHz tick, anything on a carpet takes spire damage × Fire damage per second ×
// (1 + heat × the total seconds it has ever spent on a carpet); that never resets. Silver: enemies that die on a carpet light a smaller one.
// Gold: heat doubled. Platinum: 2 firebombs per launch.
function stillest(n){const out=[];for(const e of enemies){if(e.dead||e.age<CFG.fadeIn)continue;
    if(out.length<n||e.still>out[out.length-1].still){out.push(e);out.sort((a,b)=>b.still-a.still);if(out.length>n)out.pop()}}return out}
function launchFirebomb(S){const R=run,Sh=R.shells||(R.shells=[]);for(const t of stillest(S>=3?2:1))Sh.push({x:t.x,y:t.y,t:0})}
let fireTickN=0;
function firebombTick(dt,S){const R=run,Sh=R.shells,C2=R.carpets;
  if(Sh&&Sh.length)for(let i=Sh.length-1;i>=0;i--){const s=Sh[i];if((s.t+=dt)<ULT.shellFlight)continue;Sh.splice(i,1);
    (R.carpets||(R.carpets=[])).push({x:s.x,y:s.y,r:uv('firebomb','radius'),left:uv('firebomb','dur')})}
  if(!C2||!C2.length)return;R.burnT=(R.burnT||0)+dt;for(const c of C2)c.left-=dt;
  if(R.burnT>=1/CFG.dotHz){const tick=R.burnT,id=++fireTickN;R.burnT=0;const dps=ultDmg()*uv('firebomb','dmg'),heat=ULT.heat*(S>=2?2:1);
    for(const c of C2)forNear(c.x,c.y,c.r,e=>{if(e.fireTick!==id&&(e.x-c.x)**2+(e.y-c.y)**2<=c.r*c.r)e.fireTick=id});
    // e.onFire is the total time an enemy has spent on any carpet; it never resets (only a new enemy starts at 0)
    // each burning enemy takes one hit per tick, however many carpets overlap it
    for(const c of C2)forNear(c.x,c.y,c.r,e=>{if(e.fireTick!==id||e.fireDone===id)return;e.fireDone=id;
      e.onFire=(e.onFire||0)+tick;damage(e,dps*tick*(1+heat*e.onFire),0,false,1);
      if(S>=1&&e.dead)C2.push({x:e.x,y:e.y,r:c.r*ULT.spreadFire,left:uv('firebomb','dur')*ULT.spreadFire})})} // Silver (Spreading flames)
  for(let i=C2.length-1;i>=0;i--)if(C2[i].left<=0)C2.splice(i,1)}
// the living enemy with the most health (absolute, not %): Laser's target
function biggest(){let b=null,h=-1;for(const e of enemies)if(!e.dead&&e.age>=CFG.fadeIn&&e.hp>h){h=e.hp;b=e}return b}
function fireUlt(k,tgt){const R=run,st=R.ult&&R.ult[k];if(!st||!ultLive(k)||UK[k].passive||st.cd>0||st.act>0||R.over)return false;
  if(k==='grav')return openWell(st);
  const near=inRange();if(!near.length)return false;tgt=tgt&&!tgt.dead?tgt:near.sort((a,b)=>a.dist-b.dist)[0];
  st.cd=uv(k,'cd');save.stats.ultUses++;const S=R.ultSt||{},now=performance.now();
  if(k==='missile')launchMissiles(S.missile||0);
  else if(k==='firebomb')launchFirebomb(S.firebomb||0);
  else if(k==='shock'){shockBlast(false);if(S.shock>=3)st.after=ULT.aftershock}
  // aims at the enemy with the most health, chosen once here, and locks on to it
  else if(k==='laser'){const t=biggest()||tgt;st.big=t;st.bigGen=t.gen;st.ang=Math.atan2(t.y,t.x);st.act=uv('laser','dur')}
  return true}
// ---- drawing (called from draw()) ----
function drawUlts(sc,W){const R=run;if(!R||!R.ult)return;const now=performance.now(),dpr=W/(stage.clientWidth||W);
  // Hackers: a dashed tether from each one to the spire while it drains an Ultimate
  if(R.hack){ctx.strokeStyle=C.e11;ctx.lineWidth=1.5*dpr/sc;ctx.setLineDash([4*dpr/sc,4*dpr/sc]);ctx.lineDashOffset=-now/40*dpr/sc;ctx.globalAlpha=.8;ctx.beginPath();
    for(const k in R.hack){const e=R.hack[k].e;if(e.dead)continue;ctx.moveTo(IX(e),IY(e));ctx.lineTo(0,0)}ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1}
  if(R.frostR){ctx.fillStyle=C.alloy;ctx.globalAlpha=.08;ctx.beginPath();ctx.arc(0,0,R.frostR,0,6.283);ctx.fill();ctx.globalAlpha=.55;ctx.strokeStyle=C.alloy;ctx.lineWidth=2*dpr/sc;ctx.stroke();ctx.globalAlpha=1}
  if(R.wells&&R.wells.length&&ultLive('grav')){const r=uv('grav','radius'),a0=now/300;ctx.strokeStyle=C.shard;ctx.lineWidth=2*dpr/sc;
    for(const g of R.wells){for(let i=0;i<3;i++){ctx.globalAlpha=.25+.2*i;ctx.beginPath();ctx.arc(g.x,g.y,r*(1-i*.3),a0+i,a0+i+4);ctx.stroke()}
      ctx.globalAlpha=.12;ctx.fillStyle=C.shard;ctx.beginPath();ctx.arc(g.x,g.y,r,0,6.283);ctx.fill()}ctx.globalAlpha=1}
  const L=R.ult.laser;if(L&&ultLive('laser')){const len=spawnMax()*1.5,w=uv('laser','width');
    if(L.act>0){const cx=Math.cos(L.ang)*len,cy=Math.sin(L.ang)*len,fl=.85+.15*Math.sin(now/40),x0=0,y0=0;
      ctx.lineCap='round';ctx.strokeStyle=C.hot;ctx.globalAlpha=.25*fl;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(cx,cy);ctx.stroke();
      ctx.globalAlpha=.9*fl;ctx.lineWidth=Math.max(2*dpr/sc,w*.25);ctx.stroke();ctx.globalAlpha=1;ctx.lineCap='butt'}
    // charge ring: a faint track round the spire that fills clockwise from the top over the whole charge time (looks the same at every speed)
    else{const k=Math.min(1,Math.max(0,1-L.cd/uv('laser','cd'))),r=CFG.towerR+5,top=-Math.PI/2;ctx.strokeStyle=C.hot;ctx.lineWidth=3*dpr/sc;
      ctx.globalAlpha=.18;ctx.beginPath();ctx.arc(0,0,r,0,6.283);ctx.stroke();
      if(k>0){ctx.globalAlpha=.85;ctx.beginPath();ctx.arc(0,0,r,top,top+k*6.283);ctx.stroke()}ctx.globalAlpha=1}}
  if(R.carpets&&R.carpets.length){const fl=.85+.15*Math.sin(now/90);ctx.fillStyle=C.fire;for(const c of R.carpets){ctx.globalAlpha=(.14+.12*Math.min(1,c.left/2))*fl;ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,6.283);ctx.fill();ctx.globalAlpha=.4*Math.min(1,c.left/2);ctx.strokeStyle=C.fire;ctx.lineWidth=2*dpr/sc;ctx.stroke()}ctx.globalAlpha=1}
  if(R.shells&&R.shells.length){ctx.fillStyle=C.fire;const a=(run.over||paused)?0:A*CFG.step;
    for(const s of R.shells){const p=Math.min(1,(s.t+a)/ULT.shellFlight),d=Math.hypot(s.x,s.y),h=d*.35*4*p*(1-p),x=s.x*p,y=s.y*p-h; // an arc from the spire, peaking at 35% of the distance
      ctx.globalAlpha=.25;ctx.beginPath();ctx.arc(s.x*p,s.y*p,3*dpr/sc,0,6.283);ctx.fill(); // its shadow on the ground
      ctx.globalAlpha=1;ctx.beginPath();ctx.arc(x,y,4.5*dpr/sc,0,6.283);ctx.fill()}}
  // missiles: a body with a pointed nose and tail fins, facing where it flies, with a flickering exhaust flame behind it
  if(R.missiles&&R.missiles.length){const fl=.75+.25*Math.sin(now/45);
    for(const m of R.missiles){const L=Math.max((m.m<1?.62:1)*ULT.missileLen,(m.m<1?4:6)*dpr/sc),w=L*.13,tr=m.tr; // world size (shrinks as the view zooms out, like enemies), never under 6 screen px
      // smoke trail: fades out towards its tail
      if(tr&&tr.length>=4){ctx.strokeStyle=C.chip;ctx.lineCap='round';const n=tr.length/2;
        for(let j=1;j<n;j++){ctx.globalAlpha=.55*j/n;ctx.lineWidth=w*(.7+1.3*j/n);ctx.beginPath();ctx.moveTo(tr[2*j-2],tr[2*j-1]);ctx.lineTo(tr[2*j],tr[2*j+1]);ctx.stroke()}
        ctx.globalAlpha=1;ctx.lineCap='butt'}
      ctx.save();ctx.translate(IX(m),IY(m));ctx.rotate(m.a||0);
      ctx.fillStyle=C.fire;ctx.globalAlpha=.85;ctx.beginPath();ctx.moveTo(-L*.42,-w*.8);ctx.lineTo(-L*(.42+.7*fl),0);ctx.lineTo(-L*.42,w*.8);ctx.fill();ctx.globalAlpha=1;
      ctx.fillStyle=C.chip;ctx.beginPath();ctx.moveTo(L*.58,0);ctx.lineTo(L*.32,-w);ctx.lineTo(-L*.3,-w);ctx.lineTo(-L*.45,-w*2.6);ctx.lineTo(-L*.45,-w);ctx.lineTo(-L*.45,w);ctx.lineTo(-L*.45,w*2.6);ctx.lineTo(-L*.3,w);ctx.lineTo(L*.32,w);ctx.closePath();ctx.fill();ctx.restore()}}
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
  // per-enemy markers: one pass sorts out who needs which, then each kind is drawn as one batch
  const PR=MK_P,CH=MK_C,FZ=MK_F,SN=MK_S;PR.length=CH.length=FZ.length=SN.length=0;
  for(const e of enemies){if(e.dead)continue;if(e.d.protect&&e.age>=CFG.fadeIn)PR.push(e);if(e.d.charge&&e.cs===1)CH.push(e);if(e.frzT>0)FZ.push(e);else if(e.stunT>0)SN.push(e)}
  if(PR.length){ctx.strokeStyle=C.e10;ctx.lineWidth=1.5*dpr/sc;ctx.globalAlpha=.3;ctx.beginPath();for(const e of PR){const x=IX(e),y=IY(e);ctx.moveTo(x+CFG.protectR,y);ctx.arc(x,y,CFG.protectR,0,6.283)}ctx.stroke();ctx.globalAlpha=1} // Protectors' guard area
  if(CH.length){ctx.strokeStyle=C.e9;ctx.lineWidth=2.5*dpr/sc;for(const e of CH){const x=IX(e),y=IY(e),r=e.d.sz*1.8,k=Math.min(1,e.ct/e.d.charge);ctx.globalAlpha=.4+.6*k;ctx.beginPath();ctx.arc(x,y,r,-Math.PI/2,-Math.PI/2+6.283*k);ctx.stroke()}ctx.globalAlpha=1} // Chargers winding up
  if(FZ.length){ctx.strokeStyle=C.alloy;ctx.lineWidth=2.5*dpr/sc;ctx.beginPath();for(const e of FZ){const x=IX(e),y=IY(e),r=e.d.sz*1.5;ctx.moveTo(x+r,y);ctx.arc(x,y,r,0,6.283)}ctx.stroke()} // frozen (Frost Field Silver)
  if(SN.length){ctx.strokeStyle=C.gold;ctx.lineWidth=1.5*dpr/sc;ctx.setLineDash([3*dpr/sc,3*dpr/sc]);ctx.beginPath();for(const e of SN){const x=IX(e),y=IY(e),r=e.d.sz*1.5;ctx.moveTo(x+r,y);ctx.arc(x,y,r,0,6.283)}ctx.stroke();ctx.setLineDash([])} // stunned
}
const MK_P=[],MK_C=[],MK_F=[],MK_S=[];
// ---- Ultimates tab: one compact row per ultimate; tap a row to open it (one open at a time) ----
const MCLS=['','s','g','p','e','d','x'];
const medal=k=>{const s=ultStatus(k);return s?`<span class="medal ${MCLS[s]} on">${MEDALS[s]}</span>`:''};
const ultIcon=u=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="var(--${u.col})" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${u.icon}</svg>`;
let ultOpen=null;
// levels to buy on a track with the ×1 / ×10 / Max selector, and their total cost (Max: as many as you can afford)
function ultBuyPlan(k,t){const l=ultLv(k,t.k),lim=ui.mult==='Max'?t.lv:ui.mult;let n=0,c=0;
  while(n<lim&&l+n<t.lv){const nc=ultCost(t,l+n);if(ui.mult==='Max'&&n>0&&c+nc>save.chips)break;c+=nc;n++}return{n,c}}
const ultDone=k=>UK[k].t.reduce((a,t)=>a+ultLv(k,t.k),0),ultTotal=k=>UK[k].t.reduce((a,t)=>a+t.lv,0);
function ultsHtml(){
  if(!ultOpen||!ultOwned(ultOpen))ultOpen=(ULTS.find(u=>ultOwned(u.k))||{}).k||null;
  let h=`<div class="lhead usticky"><span>Chips <b class="chip">${fmt(save.chips)}</b></span><div class="mults sm">${[1,10,'Max'].map(m=>`<button data-mult="${m}" class="${ui.mult===m?'on':''}">${m==='Max'?'Max':'×'+m}</button>`).join('')}</div></div><div class="ulist">`;
  for(const u of ULTS){const own=ultOwned(u.k),open=own&&ultOpen===u.k,done=own?ultDone(u.k):0,tot=ultTotal(u.k);
    h+=`<div class="urow${open?' open':''}${own?'':' locked'}" style="--c:var(--${u.col})">`;
    h+=`<button class="uhead" ${own?`data-uopen="${u.k}" aria-expanded="${open}"`:'tabindex="-1"'}>${ultIcon(u)}<span class="un"><b>${u.n}</b> ${medal(u.k)}<i class="uprog"><i style="transform:scaleX(${own?ultProg(u.k):0})"></i></i></span><span class="ul">${own?`${Math.round(ultProg(u.k)*100)}%`:''}</span></button>`;
    if(!own)h+=`<button class="buy chip ubuy" data-ubuy="${u.k}" ${save.chips>=ultUnlock(u)?'':'disabled'}>Unlock ${fmt(ultUnlock(u))}</button>`;
    if(open){const stt=ultStatus(u.k),M=ULT.medals,pr=ultProg(u.k),lvl=m=>`${Math.min(Math.round(m*100),Math.floor(pr*100))}/${Math.round(m*100)}% complete`;
      h+=`<div class="ubody"><p class="note">${ultDesc(u)}</p><div class="ustat">${M.map((m,i)=>`<span class="medal ${MCLS[i+1]}${stt>i?' on':''}">${MEDALS[i+1]}</span><span>${lvl(m)}${i<3?`: <b>${[u.sb,u.gb,u.pb][i]}</b>`:''}</span>`).join('')}</div>`;
      for(const t of u.t){const l=ultLv(u.k,t.k),mx=l>=t.lv,cur=ultVal(u,t.k,l),{n,c}=mx?{n:0,c:0}:ultBuyPlan(u.k,t),nx=ultVal(u,t.k,l+n);
        h+=`<div class="utr"><div><b>${t.n}</b> <span class="v">${t.f(cur)}${mx?'':` → ${t.f(nx)}`}</span><i class="uprog"><i style="transform:scaleX(${l/t.lv})"></i></i><span class="v">Lv ${l}/${t.lv}</span></div>${mx?'<button class="buy" disabled>Max</button>':`<button class="buy chip" data-uup="${u.k}" data-t="${t.k}" ${save.chips>=c?'':'disabled'}><span class="q">+${n}</span>${fmt(c)}</button>`}</div>`}
      h+=respecBtn('ult:'+u.k,'Refund upgrades');
      h+=u.aura?'<p class="note" style="margin:4px 0 0">Always on, no cooldown.</p>':u.passive?'<p class="note" style="margin:4px 0 0">Triggers on your shots, no cooldown.</p>':`<div class="subs" style="margin:6px 0 0"><button data-umode="${u.k}" data-v="auto" class="${ultManual(u.k)?'':'on'}">Auto</button><button data-umode="${u.k}" data-v="man" class="${ultManual(u.k)?'on':''}">Manual</button></div>`;
      h+='</div>'}
    h+='</div>'}
  return h+`</div><p class="note" style="margin-top:8px">Bought with <b class="chip">chips</b> (shared with Equipment). Every ultimate you own is active. Damage is your spire damage × your average crit multiplier (${fmt(critX(run&&!run.over?run.s:spireStats().v))}× now), so every crit stat makes Ultimates hit harder; Ultimates only roll crits when one says so. Its medals come from how complete it is (the average of its 4 upgrades): ${medalList()}. Silver, Gold and Platinum each add a bonus. Strength upgrades have ${ULT.levels} levels; the others have fewer, bigger steps. Every step costs more than the last, so there's always a next one to save for.</p>`}
const medalList=()=>ULT.medals.map((m,i)=>`<b>${MEDALS[i+1]}</b> at ${Math.round(m*100)}%`).join(', ')
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
function refreshUltBar(){for(const b of $('ultBar').children){const k=b.dataset.fire,st=run&&!run.over&&run.ult&&run.ult[k],t=b.querySelector('span'),off=st&&!ultLive(k);
  const ready=st&&!off&&st.cd<=0&&st.act<=0,txt=!st?'':off?'hacked':st.act>0?'on':ready?'ready':Math.ceil(st.cd)+'s';if(t.textContent!==txt)t.textContent=txt;b.classList.toggle('ready',!!ready);b.disabled=!ready}}
// hacked Ultimates: one chip each with the share of levels drained so far (shut off at 100%)
function refreshHackBar(){const el=$('hackBar'),H=run&&!run.over&&run.hack,ks=H?Object.keys(H).filter(k=>!H[k].e.dead):[];
  const html=ks.map(k=>{const f=hackF(k),left=ultLvTot(k)-H[k].n;return`<span class="hackc" title="${UK[k].n} is being hacked: ${Math.floor(f*100)}% of its levels drained">${ultIcon(UK[k])}${f>=1?'off':Math.max(0,left)+' lv'}</span>`}).join('');
  if(el.dataset.h!==html){el.dataset.h=html;el.innerHTML=html}}
$('ultBar').addEventListener('click',e=>{const b=e.target.closest('button');if(b&&fireUlt(b.dataset.fire))refreshUltBar()});
buildUltBar();
