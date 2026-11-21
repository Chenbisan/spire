// Spire — game state and fixed-step simulation.
// Lab levels come from the save
const labLv=k=>Math.min(LK[k].max,save.lab[k]||0),labVal=k=>LK[k].val(labLv(k));
const speeds=()=>[1,2,3,5,8,12,16,24].filter(s=>s<=labVal('speed'));
// ================= stats =================
// maxOfRange: the stat is capped at that share of your current range (bounce range)
const curRange=()=>run&&run.s&&run.s.range!=null?run.s.range:valAt(SK.range,0,save.ws.range||0);
const statMax=s=>s.maxOfRange?curRange()*s.maxOfRange:s.max;
function valAt(s,r,w){let v=s.mul?s.base*(1+s.ra*r)*s.wm**w:s.base+(s.ra||0)*r+(s.wa||0)*w;const m=statMax(s);if(m!=null)v=Math.min(v,m);return s.min!=null?Math.max(v,s.min):v}
// enemies always spawn beyond your range
const spawnRadius=()=>run&&run.s?Math.max(CFG.spawnR,run.s.range*CFG.spawnRatio):CFG.spawnR;
// the renderer publishes how far the screen reaches (m); spawns start just past the screen edge in their direction,
// never closer than spawnRadius() and never farther than 2× it
const VIEW={hx:0,hy:0};
function spawnDist(a){const base=spawnRadius();if(!VIEW.hx)return base;
  const c=Math.abs(Math.cos(a)),s=Math.abs(Math.sin(a)),edge=Math.min(c>1e-6?VIEW.hx/c:Infinity,s>1e-6?VIEW.hy/s:Infinity);
  return Math.min(base*2,Math.max(base,edge+CFG.offscreen))}
const spawnMax=()=>spawnRadius()*2;
const capped=(s,r,w)=>{const m=statMax(s);if(s.min!=null)return valAt(s,r,w)<=s.min+1e-9;return m!=null&&valAt(s,r,w)>=m-1e-9};
function recalc(){if(!run)return;const old=run.s?run.s.health:0;run.s={};for(const s of ST)run.s[s.k]=valAt(s,run.lv[s.k]||0,save.ws[s.k]||0);
  // cards and modules on top (stat caps still apply)
  const F=loadoutFx();for(const k in F.mul)run.s[k]*=F.mul[k];for(const k in F.add)run.s[k]+=F.add[k];
  for(const s of ST){if(s.max!=null)run.s[s.k]=Math.min(run.s[s.k],s.max);if(s.min!=null)run.s[s.k]=Math.max(run.s[s.k],s.min)}
  run.s.bounceRange=Math.min(run.s.bounceRange,run.s.range*SK.bounceRange.maxOfRange);
  run.fx=F;run.waveLen=CFG.waveLen*(1-F.rush);
  const oldBar=run.barMax||0;run.barMax=run.s.health*run.s.barrier;run.bar=run.barT>0?0:Math.min(run.barMax,(run.bar||0)+Math.max(0,run.barMax-oldBar)); // upgrades add their extra right away (not while it's recharging)
  if(old)run.hp=Math.max(1,run.hp+run.s.health-old)}
// ================= state =================
let run=null,paused=false,GEN=0;
const enemies=[],ePool=[],bullets=[],bPool=[],ebs=[],ebPool=[],dnums=[],parts=[];
// tracers: visual-only streaks for shots that landed, so hits stay visible at high game speed (faded in real time)
const tracers=[];
function trace(x0,y0,x1,y1,k){if(tracers.length<CFG.maxTracers)tracers.push({x0,y0,x1,y1,k,l:CFG.tracerLife})}
function newRun(tier){
  stopAuto();sepBuilt=false;
  for(const e of enemies)ePool.push(e);for(const b of bullets)bPool.push(b);for(const b of ebs)ebPool.push(b);
  enemies.length=bullets.length=ebs.length=dnums.length=parts.length=tracers.length=0;
  run={tier,wave:1,waveT:0,spawnT:0,spawned:0,lv:{},fireT:0,kills:0,coins:0,shards:0,chips:0,alloy:0,cashEarned:0,time:0,over:false,tm:CFG.tier(tier)};
  run.barT=0;recalc();run.hp=run.s.health;run.bar=run.barMax;ultInit();run.cash=run.s.startCash;
  paused=false;showOv(null);buildPanel();
}
// an enemy type's stats on wave w of tier t (same formulas spawn() uses)
function enemyStats(t,w,tier){const d=ET[t],tm=CFG.tier(tier);return{hp:d.hp*CFG.hpGrow**(w-1)*tm.hp,atk:d.dmg*CFG.dmgGrow**(w-1)*tm.dmg,spd:d.spd,weight:d.weight,coins:d.coin*tm.coin*CFG.killCoin(w)}}
// chance each type is picked for a regular spawn on wave w (mirrors pickType; Basic takes what's left)
function spawnChance(w){const o={};let left=1;for(const t of TYPES){const d=ET[t];if(!d.freq||w<d.from)continue;const p=Math.min(left,d.freq);o[t]=p;left-=p}o.basic=(o.basic||0)+left;return o}
function pickType(w){let r=Math.random(),acc=0;for(const t of TYPES){const d=ET[t];if(!d.freq||w<d.from)continue;acc+=d.freq;if(r<acc)return t}return'basic'}
function spawn(t,x,y){
  const d=ET[t],R=run,a=Math.random()*Math.PI*2,wv=R.wave-1,e=ePool.pop()||{};
  const x0given=x!=null;if(!x0given){const sr=spawnDist(a);x=Math.cos(a)*sr;y=Math.sin(a)*sr}
  e.t=t;e.d=d;e.x=x;e.y=y;e.px=x;e.py=y;e.dist=Math.hypot(x,y);
  e.mhp=e.hp=d.hp*CFG.hpGrow**wv*R.tm.hp;e.dmg=d.dmg*CFG.dmgGrow**wv*R.tm.dmg;e.atk=0;e.gen=++GEN;e.dead=false;
  e.shield=d.shield||0;e.ht=0;e.hf=0;e.slowT=0;e.slowF=0;e.age=x0given?CFG.fadeIn:0;e.stunT=0;e.rest=0;e.pend=0;e.gi=-1;e.fs=0;e.frz1=false;e.frzT=0;
  enemies.push(e);
}
function nextWave(){
  const R=run;R.wave++;R.waveT=R.spawnT=R.spawned=0;
  const wc=CFG.waveCash(R.wave)*R.s.waveCash;R.cash+=wc;
  if(R.fx.interest){const it=Math.min(R.cash*R.fx.interest,wc*5);R.cash+=it;save.stats.cash+=it}save.stats.cash+=wc;save.stats.waves++;
  if(R.wave%CFG.bossEvery===0)spawn('boss');
  if((save.best[R.tier]||0)<R.wave)save.best[R.tier]=R.wave;
  if(R.wave>=CFG.tierUnlockWave&&R.tier===save.tierMax){save.tierMax++;persist();toast(`Tier ${save.tierMax} unlocked`)}
}
function kill(e){
  const R=run;e.dead=true;R.kills++;save.kills++;
  const c=e.d.cash*R.s.cashBonus*CFG.killCash(R.wave),st=save.stats;R.cash+=c;R.cashEarned+=c;st.cash+=c;if(e.d.r===2)st.elite++;else if(e.d.r===3)st.boss++;
  const k=e.d.coin*R.s.coinBonus*R.tm.coin*CFG.killCoin(R.wave);save.coins+=k;R.coins+=k;st.coins+=k;
  const db=1+R.fx.drop;
  if(e.d.r===3){const v=DROPS.chips(R.wave,R.tier)*db;save.chips+=v;R.chips+=v;st.chips+=v}
  else if(e.d.r===2){const v=DROPS.alloy(R.wave,R.tier)*db;save.alloy+=v;R.alloy+=v;st.alloy+=v}
  if(e.d.split)for(let i=0;i<e.d.split;i++)spawn('fast',e.x+(Math.random()-.5)*8,e.y+(Math.random()-.5)*8);
  for(let i=0;i<(cleanFx()?1:4)&&parts.length<CFG.maxParts;i++){const a=Math.random()*6.283,v=30+Math.random()*60;parts.push({x:e.x,y:e.y,px:e.x,py:e.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:.5})}
}
function damage(e,v,crit,thorn,f=0){ // f: 1 = no damage number (damage over time), 2 = ignores shields
  v*=ultDmgMult(e); // silver ultimates make enemies take more damage
  const blocked=e.shield>0&&!(f&2),st=save.stats;
  let a=0;if(blocked){e.shield--;st.blocked++}else{a=Math.min(v,Math.max(0,e.hp));e.hp-=v;st.dmg+=a;if(thorn)st.thorn+=a}
  e.hitAt=performance.now(); // render-only: hit flash
  if(save.set.dmgNums&&dnums.length<CFG.maxDmgNums&&!(f&1)&&(crit||blocked||!cleanFx()))dnums.push({x:e.x,y:e.y-e.d.sz,py:e.y-e.d.sz,v,c:crit,b:blocked,l:.6}); // clean mode: only crits and blocks
  if(e.hp<=0&&!e.dead)kill(e);
  return a;
}
function hitTower(v,att){
  const R=run;
  if(R.invT>0){if(att&&R.s.thorns>0&&!att.dead)damage(att,att.mhp*R.s.thorns,false,true);return} // Second Wind: invincible
  let t=v*(1-R.s.defense);
  if(R.bar>0){const a=Math.min(R.bar,t);R.bar-=a;t-=a;save.stats.absorbed+=a;if(R.bar<=1e-9){R.bar=0;R.barT=R.s.barrierRegen;R.barBrokeAt=performance.now()}} // broken: recharges to full after the timer
  R.hp-=t;save.stats.taken+=t;
  if(R.hp<=0&&R.s.deathDefy>0&&Math.random()<R.s.deathDefy){R.hp+=t;save.stats.taken-=t;save.stats.defies++;R.defies=(R.defies||0)+1;R.defyAt=performance.now()} // render-only: gold burst + DEFIED
  if(R.hp<=0&&R.fx.revive&&!R.revived){R.revived=true;R.hp=Math.max(1,R.hp+t);save.stats.taken-=t;R.invT=R.fx.revive;save.stats.winds=(save.stats.winds||0)+1;toast(`Second Wind! Invincible for ${R.fx.revive} s`)}
  if(att&&R.s.thorns>0&&!att.dead)damage(att,att.mhp*R.s.thorns,false,true);
  if(R.hp<=0)gameOver();
}
// enemies near (x,y) within r: uses this step's push-apart grid when it's built, otherwise scans everything
function forNear(x,y,r,fn){if(!sepBuilt){for(const e of enemies)if(!e.dead)fn(e);return}
  const c0x=sepCell(x-r),c1x=sepCell(x+r),c0y=sepCell(y-r),c1y=sepCell(y+r);
  for(let gy=c0y;gy<=c1y;gy++)for(let gx=c0x;gx<=c1x;gx++)for(let j=sepHead[gy*SEPN+gx];j!==-1;j=sepNext[j]){const e=enemies[j];if(e&&!e.dead)fn(e)}}
function nearestOther(x,y,ex,r){let best=null,bd=r*r;forNear(x,y,r,e=>{if(e===ex)return;const d=(e.x-x)**2+(e.y-y)**2;if(d<bd){bd=d;best=e}});return best}
// nearest enemy: looks in the grid around (x,y) first (exact if anything is that close), else scans everything
function nearest(x,y){if(sepBuilt){const n=nearestOther(x,y,null,CFG.nearR);if(n)return n}
  let best=null,bd=Infinity;for(const e of enemies){if(e.dead)continue;const d=(e.x-x)**2+(e.y-y)**2;if(d<bd){bd=d;best=e}}return best}
// shards earned by this run so far (paid when it ends)
const runShards=R=>R.kills*CFG.shardPerKill*R.tm.shard*(1+R.fx.drop);
function gameOver(quit){
  const R=run;if(R.over)return;R.over=true;R.quit=!!quit;R.hp=0;save.runs++;
  R.shards=runShards(R);save.shards+=R.shards;save.stats.shards+=R.shards;
  R.cph=R.time>0?R.coins/R.time*3600:0;R.newBest=false;
  if(R.time>=CFG.offlineMinRun&&R.cph>save.bestCph){save.bestCph=R.cph;R.newBest=true}
  R.sph=R.time>0?R.shards/R.time*3600:0;R.newBestS=R.time>=CFG.offlineMinRun&&R.sph>save.bestSph;if(R.newBestS)save.bestSph=R.sph;
  const prevBest=save.best[R.tier]||0;R.newBestWave=R.wave>prevBest;
  if(prevBest<R.wave)save.best[R.tier]=R.wave;
  {const T=save.stats.tiers[R.tier]||(save.stats.tiers[R.tier]={runs:0,coins:0,cph:0});T.runs++;T.coins+=R.coins;if(R.time>=CFG.offlineMinRun)T.cph=Math.max(T.cph,R.cph)}
  save.hist.unshift({at:Date.now(),t:R.tier,w:R.wave,df:R.defies||0,c:R.coins,s:R.shards,ch:R.chips,al:R.alloy,cph:R.cph,time:R.time,k:R.kills,quit:!!quit,best:R.newBestWave});
  save.hist.length=Math.min(save.hist.length,CFG.histMax);
  persist();ovTier=R.tier;if(!quit)startAuto(); // a run you end yourself doesn't auto-restart
  showOv('over');buildPanel();
}
// ================= simulation (fixed step) =================
let rankKey='',rankMap=null;
// target priority: types above 'closest' in save.set.prio are shot first, in order; the rest share one rank (closest first)
function targetRank(){const P=save.set.prio,ci=P.indexOf('closest');if(ci<=0)return null;const k=P.join();
  if(k!==rankKey){rankKey=k;rankMap={};TYPES.forEach(t=>rankMap[t]=ci);for(let i=0;i<ci;i++)rankMap[P[i]]=i}return rankMap}
function fire(tgt){const s=run.s,b=bPool.pop()||{};let c=Math.random()<s.crit?1:0;save.stats.shots++;if(c){save.stats.crits++;if(s.superCrit>0&&Math.random()<s.superCrit){c=2;save.stats.supers++}}
  tgt.shotAt=performance.now(); // render-only: targeting beam
  b.x=b.y=b.px=b.py=b.rx=b.ry=0;b.e=tgt;b.g=tgt.gen;b.c=c;b.dmg=s.damage*(c?s.critMult:1)*(c===2?s.superMult:1);b.l=2;
  b.bn=s.bounceChance>0&&Math.random()<s.bounceChance?Math.floor(s.bounceTargets):0;bullets.push(b)}
// multishot's extra targets: the best k in range after the main target (same order as targeting). Picked once per step
// with a small insertion list instead of sorting every enemy on every shot.
let multiStep=-1;const multiList=[],healers=[];
function multiPicks(tgt,pr,k){
  if(multiStep===GEN_STEP)return multiList;multiStep=GEN_STEP;multiList.length=0;if(k<=0)return multiList;
  const rg=run.s.range,key=e=>(pr?pr[e.t]*1e6:0)+e.dist;
  for(const e of enemies){if(e.dead||e===tgt||e.dist>rg+e.d.sz)continue;const v=key(e);
    if(multiList.length===k&&v>=key(multiList[k-1]))continue;
    let i=multiList.length===k?k-1:multiList.length;while(i>0&&key(multiList[i-1])>v){multiList[i]=multiList[i-1];i--}multiList[i]=e}
  return multiList}
let GEN_STEP=0;
function update(dt){GEN_STEP++;
  const R=run,s=R.s,tr=CFG.towerR;R.time+=dt;save.stats.time+=dt;R.waveT+=dt;R.spawnT+=dt;
  const cnt=CFG.spawnCount(R.wave),iv=R.waveLen*.9/cnt;
  while(R.spawnT>=iv&&R.spawned<cnt){R.spawnT-=iv;R.spawned++;spawn(pickType(R.wave))}
  if(R.waveT>=R.waveLen)nextWave();
  R.hp=Math.min(s.health,R.hp+s.regen*dt);
  if(R.invT>0)R.invT=Math.max(0,R.invT-dt);
  if(R.barT>0&&(R.barT-=dt)<=0){R.barT=0;R.bar=R.barMax} // barrier back at full
  // targeting: Closest, or by your type priority (then closest within a type)
  const pr=targetRank();let tgt=null,td=Infinity,tp=Infinity;
  for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];if(e.dead){enemies[i]=enemies[enemies.length-1];enemies.pop();ePool.push(e)}}
  sepBuild(); // the grid comes first: walking enemies check it so they never step into each other
  for(let i=0,n0=enemies.length;i<n0;i++){
    const e=enemies[i];if(e.dead)continue;
    e.px=e.x;e.py=e.y;if(e.age<CFG.fadeIn)e.age+=dt;const d=e.d,dist=Math.hypot(e.x,e.y),stop=d.stop||tr+d.sz;e.dist=dist;
    let sp=d.spd;if(e.slowT>0){e.slowT-=dt;sp*=1-e.slowF}if(R.fx.slowAura&&dist<=s.range)sp*=1-R.fx.slowAura;if(e.fs&&R.frostCap)sp*=1-Math.min(R.frostCap,e.fs*ULT.frostPer); // frost stacks
    if(e.frzT>0)e.frzT-=dt; // frozen: no moving, no attacking
    else if(e.stunT>0)e.stunT-=dt; // stunned: no moving, no attacking
    else if(dist>stop){e.pend+=sp*dt;if(e.rest>0)e.rest--;else if(e.pend>=CFG.walkMin||e.pend>=dist-stop){const m=Math.min(e.pend,dist-stop);e.pend=0;if(walk(e,-e.x/dist,-e.y/dist,m)<1e-3)e.rest=CFG.restSteps}} // stops (or slides aside) when the crowd ahead leaves no room; a fully blocked enemy rests a few steps before checking again; slow movers step every few frames once they've built up walkMin metres
    else{e.atk+=dt;
      if(d.stop){if(e.atk>=2){e.atk=0;const b=ebPool.pop()||{};b.x=b.px=b.rx=e.x;b.y=b.py=b.ry=e.y;b.dmg=e.dmg;ebs.push(b)}}
      else if(e.atk>=1){e.atk=0;hitTower(e.dmg,e);if(R.over)return}}
    if(d.heal){e.hf=Math.max(0,e.hf-dt);e.ht+=dt;if(e.ht>=1){e.ht=0;e.hf=.4;healers.push(e)}} // healed below, once the grid is built
    if(!e.dead&&dist<=s.range+d.sz){const p=pr?pr[e.t]:0;if(p<tp||(p===tp&&dist<td)){tp=p;td=dist;tgt=e}}
  }
  separate();
  for(const h of healers){const r2=h.d.healR**2,f=h.d.heal;forNear(h.x,h.y,h.d.healR,o=>{if(o!==h&&(o.x-h.x)**2+(o.y-h.y)**2<=r2)o.hp=Math.min(o.mhp,o.hp+o.mhp*f)})}
  healers.length=0;
  ultTick(dt,tgt);if(R.over)return;
  const fi=1/s.aspd;R.fireT+=dt;
  if(!tgt)R.fireT=Math.min(R.fireT,fi);
  else while(R.fireT>=fi){R.fireT-=fi;fire(tgt);
    const mc=s.multiChance+R.fx.multi;
    if(mc>0&&Math.random()<mc){const extra=multiPicks(tgt,pr,Math.floor(s.multiTargets));for(const e of extra)if(!e.dead)fire(e);if(extra.length)save.stats.multi++}}
  const m=CFG.bulletSpd*dt;
  for(let i=bullets.length-1;i>=0;i--){
    const b=bullets[i];b.px=b.x;b.py=b.y;let e=b.e,drop=false;
    if(e.dead||e.gen!==b.g){e=nearest(b.x,b.y);if(e){b.e=e;b.g=e.gen}else drop=true}
    if(!drop){const dx=e.x-b.x,dy=e.y-b.y,dd=Math.hypot(dx,dy);
      if(dd<=m+e.d.sz){trace(b.rx,b.ry,e.x,e.y,b.c===2?3:b.c?2:0);if(R.fx.slowHit){e.slowT=1;e.slowF=R.fx.slowHit}{const dealt=damage(e,b.dmg*(e.d.r>=2?1+R.fx.eliteDmg:1)*(1+s.dmgDist*e.dist),b.c);if(R.chainP&&Math.random()<R.chainP)chainBolt(e);if(s.lifesteal>0&&dealt>0){const h=Math.min(s.health-R.hp,dealt*s.lifesteal);if(h>0){R.hp+=h;save.stats.stolen+=h}}}drop=true;
        if(!e.dead&&s.kbChance>0&&Math.random()<s.kbChance){const d=Math.hypot(e.x,e.y)||1,k=Math.min(s.kbForce/e.d.weight,spawnMax()-d);if(k>0){walk(e,e.x/d,e.y/d,k);e.px=e.x;e.py=e.y;e.rest=0;save.stats.kbs++}}
        if(b.bn>0){const n=nearestOther(e.x,e.y,e,s.bounceRange);if(n){b.bn--;b.rx=b.x=b.px=e.x;b.ry=b.y=b.py=e.y;b.e=n;b.g=n.gen;b.l=2;drop=false;save.stats.bounces++}}}else{b.x+=dx/dd*m;b.y+=dy/dd*m;b.l-=dt;if(b.l<=0)drop=true}}
    if(drop){bullets[i]=bullets[bullets.length-1];bullets.pop();bPool.push(b)}
  }
  const em=CFG.ebSpd*dt;
  for(let i=ebs.length-1;i>=0;i--){const b=ebs[i],d=Math.hypot(b.x,b.y);b.px=b.x;b.py=b.y;
    if(d<=tr+em){trace(b.rx,b.ry,b.x/d*tr,b.y/d*tr,1);ebs[i]=ebs[ebs.length-1];ebs.pop();ebPool.push(b);hitTower(b.dmg,null);if(R.over)return}
    else{b.x-=b.x/d*em;b.y-=b.y/d*em}}
  for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.px=p.x;p.py=p.y;p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt;if(p.l<=0){parts[i]=parts[parts.length-1];parts.pop()}}
  for(let i=dnums.length-1;i>=0;i--){const n=dnums[i];n.py=n.y;n.y-=30*dt;n.l-=dt;if(n.l<=0){dnums[i]=dnums[dnums.length-1];dnums.pop()}}
}
// ---- crowding: enemies never get closer than sepGap × their combined size ----
// Walking enemies stop at that distance (or slide sideways into a gap), so crowds form a wall instead of piling up.
// separate() then pushes apart anything shoved together by other means (Shockwave, knockback, splits, new spawns).
// grid cell (m): about one enemy wide, so crowded cells stay small. Bosses ("big": their reach is wider than a cell)
// are listed separately and checked over a wider area.
const SEPC=24;let sepBuilt=false,SEPN=16,SEPO=SEPC*SEPN/2,sepHead=new Int32Array(SEPN*SEPN),sepNext=new Int32Array(256);
const sepCell=v=>Math.max(0,Math.min(SEPN-1,Math.floor((v+SEPO)/SEPC)));
const SEPDX=[0,1,-1,0,1],SEPDY=[0,0,1,1,1],bigs=[];
const BIG_SZ=SEPC/(2*CFG.sepGap),MAX_SZ=Math.max(...Object.values(ET).map(d=>d.sz)),BIG_CELLS=Math.ceil((MAX_SZ*2*CFG.sepGap+1)/SEPC);
let sepFlip=0,SX=new Float32Array(256),SY=new Float32Array(256),SS=new Float32Array(256),SW=new Float32Array(256);
function sepBuild(){
  sepBuilt=false;bigs.length=0;const n=enemies.length;if(n<2)return;
  if(sepNext.length<n){sepNext=new Int32Array(n*2);SX=new Float32Array(n*2);SY=new Float32Array(n*2);SS=new Float32Array(n*2);SW=new Float32Array(n*2)}
  const N=Math.ceil(2*(spawnMax()+60)/SEPC);if(N!==SEPN){SEPN=N;SEPO=SEPC*N/2;sepHead=new Int32Array(N*N)} // grid grows with the arena
  sepHead.fill(-1);sepBuilt=true;
  // flat copies of position/size/weight (much faster to read than enemy objects); walk() keeps SX/SY in step with moves
  for(let i=0;i<n;i++){const e=enemies[i];e.gi=i;SX[i]=e.x;SY[i]=e.y;SS[i]=e.dead?-1:e.d.sz;SW[i]=e.d.weight;
    const c=sepCell(e.y)*SEPN+sepCell(e.x);sepNext[i]=sepHead[c];sepHead[c]=i;if(e.d.sz>BIG_SZ)bigs.push(i)}}
// move e up to m along the unit vector (ux,uy), stopping where it would come closer than the allowed distance to
// anyone ahead of it; if blocked, it slides along the blocker with the rest of the step. Long moves (Shockwave,
// knockback) go in cell-sized chunks so they stop at the crowd too. Returns how far it actually moved.
function walk(e,ux,uy,m){
  if(!sepBuilt||enemies[e.gi]!==e){e.x+=ux*m;e.y+=uy*m;return m} // not in this step's grid (just spawned): moves freely
  let moved=0;while(m>1e-9){const c=Math.min(m,SEPC*.5),d=walk1(e,ux,uy,c);moved+=d;m-=c;if(d<c*.5)break}return moved}
function walk1(e,ux,uy,m){
  const i=e.gi,x0=e.x,y0=e.y;let t=clampT(i,x0,y0,ux,uy,m),x=x0+ux*t,y=y0+uy*t;
  if(t<m-1e-6&&walkBy>=0){ // slide: drop the part of the step that heads into the blocker
    let nx=x-SX[walkBy],ny=y-SY[walkBy];const nl=Math.hypot(nx,ny)||1;nx/=nl;ny/=nl;const dn=ux*nx+uy*ny;
    let sx=ux-nx*dn,sy=uy-ny*dn;const sl=Math.hypot(sx,sy);
    if(sl>1e-3){sx/=sl;sy/=sl;const t2=clampT(i,x,y,sx,sy,(m-t)*sl);x+=sx*t2;y+=sy*t2}}
  e.x=SX[i]=x;e.y=SY[i]=y;return Math.hypot(x-x0,y-y0)}
let walkBy=-1;
// how far enemy i at (ex,ey) can go along (ux,uy), up to m, before it is closer than (size + size) × sepGap to a
// neighbour ahead of it (walkBy = the one that stops it). Bosses look over a wider area; everyone checks the bosses.
function clampT(i,ex,ey,ux,uy,m){
  const g=CFG.sepGap,sa=SS[i],big=sa>BIG_SZ,rc=big?BIG_CELLS:1,cx=sepCell(ex),cy=sepCell(ey);let t=m;walkBy=-1;
  for(let gy=Math.max(0,cy-rc),gy1=Math.min(SEPN-1,cy+rc);gy<=gy1;gy++)for(let gx=Math.max(0,cx-rc),gx1=Math.min(SEPN-1,cx+rc);gx<=gx1;gx++)
    for(let j=sepHead[gy*SEPN+gx];j!==-1;j=sepNext[j]){const sb=SS[j];if(j===i||sb<0||(!big&&sb>BIG_SZ))continue;
      const D=(sa+sb)*g,dx=SX[j]-ex,dy=SY[j]-ey,b=ux*dx+uy*dy;if(b<=1e-6||b-t>D)continue; // behind it, or too far ahead to reach
      const c=dx*dx+dy*dy-D*D;if(c<=0){walkBy=j;return 0} // already touching and heading into it
      const disc=b*b-c;if(disc>0){const t0=b-Math.sqrt(disc);if(t0<t){t=t0>0?t0:0;walkBy=j}}}
  if(!big)for(const j of bigs){const sb=SS[j];if(j===i||sb<0)continue;
    const D=(sa+sb)*g,dx=SX[j]-ex,dy=SY[j]-ey,b=ux*dx+uy*dy;if(b<=1e-6||b-t>D)continue;
    const c=dx*dx+dy*dy-D*D;if(c<=0){walkBy=j;return 0}
    const disc=b*b-c;if(disc>0){const t0=b-Math.sqrt(disc);if(t0<t){t=t0>0?t0:0;walkBy=j}}}
  return t}
function separate(){
  const n=enemies.length;if(!sepBuilt||n<2)return;
  for(let i=0;i<n;i++){const e=enemies[i];if(e.dead){SS[i]=-1;continue}SX[i]=e.x;SY[i]=e.y} // positions moved since the grid was built
  // with a huge crowd, push every other step (walking already keeps them apart; this only fixes shoves)
  if(n>CFG.sepEveryOther&&(sepFlip^=1))return;
  const k=CFG.sepPush,g=CFG.sepGap,cap=CFG.sepChecks;
  const pair=(i,j,wa0)=>{const min=(SS[i]+SS[j])*g;let dx=SX[j]-SX[i],dy=SY[j]-SY[i];const d2=dx*dx+dy*dy;if(d2>=min*min)return;
    let d=Math.sqrt(d2);if(d<1e-3){const r=Math.random()*6.283;dx=Math.cos(r);dy=Math.sin(r);d=1}else{dx/=d;dy/=d}
    const p=(min-d)*k,wb0=SW[j],wa=wb0/(wa0+wb0),wb=1-wa; // heavier enemies get shoved less
    SX[i]-=dx*p*wa;SY[i]-=dy*p*wa;SX[j]+=dx*p*wb;SY[j]+=dy*p*wb};
  // each pair is visited once: the rest of i's own cell (list entries after i), then 4 of the 8 neighbouring cells.
  // Pairs with a boss are left to the boss's own wider pass below.
  for(let i=0;i<n;i++){const sa=SS[i];if(sa<0||sa>BIG_SZ)continue;const cx=sepCell(SX[i]),cy=sepCell(SY[i]),wa0=SW[i];let chk=0;
    for(let c=0;c<5;c++){let j;
      if(c===0)j=sepNext[i];else{const gx=cx+SEPDX[c],gy=cy+SEPDY[c];if(gx<0||gx>=SEPN||gy>=SEPN)continue;j=sepHead[gy*SEPN+gx]}
      for(;j!==-1;j=sepNext[j]){if(++chk>cap)break;if(SS[j]<0||SS[j]>BIG_SZ)continue;pair(i,j,wa0)}}}
  for(const i of bigs){if(SS[i]<0)continue;const cx=sepCell(SX[i]),cy=sepCell(SY[i]);
    for(let gy=Math.max(0,cy-BIG_CELLS);gy<=Math.min(SEPN-1,cy+BIG_CELLS);gy++)for(let gx=Math.max(0,cx-BIG_CELLS);gx<=Math.min(SEPN-1,cx+BIG_CELLS);gx++)
      for(let j=sepHead[gy*SEPN+gx];j!==-1;j=sepNext[j]){if(j===i||SS[j]<0||(SS[j]>BIG_SZ&&j<i))continue;pair(i,j,SW[i])}}
  const tr=CFG.towerR;
  for(let i=0;i<n;i++){if(SS[i]<0)continue;const e=enemies[i];let x=SX[i],y=SY[i];const m=tr+SS[i],d=Math.hypot(x,y);if(d<m&&d>0){x*=m/d;y*=m/d}e.x=SX[i]=x;e.y=SY[i]=y} // never inside the spire
}
// ---- in-run purchase: each level rolls its section's free-upgrade chance and costs nothing on a hit ----
function buyRun(s,n){const r=run.lv[s.k]||0,ch=run.s['free'+s.g]||0;let paid=0,free=0;
  for(let i=0;i<n;i++){if(ch>0&&Math.random()<ch)free++;else paid+=s.c[0]*s.c[1]**(r+i)}
  run.cash-=paid;run.lv[s.k]=r+n;save.stats.ups+=n;save.stats.freeUps+=free;return free}
// ---- auto-buyer (runs from the HUD tick) ----
function autoBuy(){
  if(!run||run.over||paused||!labLv('auto'))return;let any=false;
  for(let i=0;i<100;i++){let best=null,bc=Infinity;
    for(const s of ST){if(s.ws||!save.set.ab[s.g])continue;const r=run.lv[s.k]||0;if(capped(s,r,save.ws[s.k]||0))continue;const c=s.c[0]*s.c[1]**r;if(c<bc){bc=c;best=s}}
    if(!best||bc>run.cash)break;buyRun(best,1);any=true}
  if(any)recalc();
}
