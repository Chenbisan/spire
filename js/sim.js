// Spire — game state and fixed-step simulation.
// Lab levels come from the save
const labLv=k=>Math.min(LK[k].max,save.lab[k]||0),labVal=k=>LK[k].val(labLv(k));
const speeds=()=>[1,2,3,5,8,12,16,24].filter(s=>s<=labVal('speed'));
// ================= stats =================
function valAt(s,r,w){let v=s.mul?s.base*(1+s.ra*r)*s.wm**w:s.base+(s.ra||0)*r+(s.wa||0)*w;return s.max!=null?Math.min(v,s.max):v}
const capped=(s,r,w)=>s.max!=null&&valAt(s,r,w)>=s.max-1e-9;
function recalc(){if(!run)return;const old=run.s?run.s.health:0;run.s={};for(const s of ST)run.s[s.k]=valAt(s,run.lv[s.k]||0,save.ws[s.k]||0);
  // cards and modules on top (stat caps still apply)
  const F=loadoutFx();for(const k in F.mul)run.s[k]*=F.mul[k];for(const k in F.add)run.s[k]+=F.add[k];
  for(const s of ST)if(s.max!=null)run.s[s.k]=Math.min(run.s[s.k],s.max);
  run.fx=F;run.waveLen=CFG.waveLen*(1-F.rush);
  const oldBar=run.barMax||0;run.barMax=run.s.health*run.s.barrier;run.bar=Math.min(run.barMax,(run.bar||0)+Math.max(0,run.barMax-oldBar)); // upgrades add their extra right away
  if(old)run.hp=Math.max(1,run.hp+run.s.health-old)}
// ================= state =================
let run=null,paused=false,GEN=0;
const enemies=[],ePool=[],bullets=[],bPool=[],ebs=[],ebPool=[],dnums=[],parts=[];
// tracers: visual-only streaks for shots that landed, so hits stay visible at high game speed (faded in real time)
const tracers=[];
function trace(x0,y0,x1,y1,k){if(tracers.length<CFG.maxTracers)tracers.push({x0,y0,x1,y1,k,l:CFG.tracerLife})}
function newRun(tier){
  stopAuto();
  for(const e of enemies)ePool.push(e);for(const b of bullets)bPool.push(b);for(const b of ebs)ebPool.push(b);
  enemies.length=bullets.length=ebs.length=dnums.length=parts.length=tracers.length=0;
  run={tier,wave:1,waveT:0,spawnT:0,spawned:0,lv:{},fireT:0,kills:0,coins:0,shards:0,chips:0,alloy:0,cashEarned:0,time:0,over:false,tm:CFG.tier(tier)};
  recalc();run.hp=run.s.health;run.bar=run.barMax;run.cash=run.s.startCash;
  paused=false;showOv(null);buildPanel();
}
// an enemy type's stats on wave w of tier t (same formulas spawn() uses)
function enemyStats(t,w,tier){const d=ET[t],tm=CFG.tier(tier);return{hp:d.hp*CFG.hpGrow**(w-1)*tm.hp,atk:d.dmg*CFG.dmgGrow**(w-1)*tm.dmg,spd:d.spd,weight:d.weight,coins:d.coin*tm.coin*CFG.killCoin(w)}}
// chance each type is picked for a regular spawn on wave w (mirrors pickType; Basic takes what's left)
function spawnChance(w){const o={};let left=1;for(const t of TYPES){const d=ET[t];if(!d.freq||w<d.from)continue;const p=Math.min(left,d.freq);o[t]=p;left-=p}o.basic=(o.basic||0)+left;return o}
function pickType(w){let r=Math.random(),acc=0;for(const t of TYPES){const d=ET[t];if(!d.freq||w<d.from)continue;acc+=d.freq;if(r<acc)return t}return'basic'}
function spawn(t,x,y){
  const d=ET[t],R=run,a=Math.random()*Math.PI*2,wv=R.wave-1,e=ePool.pop()||{};
  if(x==null){x=Math.cos(a)*CFG.spawnR;y=Math.sin(a)*CFG.spawnR}
  e.t=t;e.d=d;e.x=x;e.y=y;e.px=x;e.py=y;e.dist=Math.hypot(x,y);
  e.mhp=e.hp=d.hp*CFG.hpGrow**wv*R.tm.hp;e.dmg=d.dmg*CFG.dmgGrow**wv*R.tm.dmg;e.atk=0;e.gen=++GEN;e.dead=false;
  e.shield=d.shield||0;e.ht=0;e.hf=0;e.slowT=0;e.slowF=0;
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
  for(let i=0;i<4&&parts.length<CFG.maxParts;i++){const a=Math.random()*6.283,v=30+Math.random()*60;parts.push({x:e.x,y:e.y,px:e.x,py:e.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:.5})}
}
function damage(e,v,crit,thorn){
  const blocked=e.shield>0,st=save.stats;
  let a=0;if(blocked){e.shield--;st.blocked++}else{a=Math.min(v,Math.max(0,e.hp));e.hp-=v;st.dmg+=a;if(thorn)st.thorn+=a}
  if(save.set.dmgNums&&dnums.length<CFG.maxDmgNums)dnums.push({x:e.x,y:e.y-e.d.sz,py:e.y-e.d.sz,v,c:crit,b:blocked,l:.6});
  if(e.hp<=0&&!e.dead)kill(e);
  return a;
}
function hitTower(v,att){
  const R=run;let t=v*(1-R.s.defense);
  if(R.bar>0){const a=Math.min(R.bar,t);R.bar-=a;t-=a;save.stats.absorbed+=a}
  R.hp-=t;save.stats.taken+=t;
  if(R.hp<=0&&R.s.deathDefy>0&&Math.random()<R.s.deathDefy){R.hp+=t;save.stats.defies++;if(save.set.dmgNums&&dnums.length<CFG.maxDmgNums)dnums.push({x:0,y:-CFG.towerR-8,py:-CFG.towerR-8,v:0,c:0,t:'defied',l:.8})}
  if(R.hp<=0&&R.fx.revive&&!R.revived){R.revived=true;R.hp=R.s.health*R.fx.revive;toast('Second Wind!')}
  if(att&&R.s.thorns>0&&!att.dead)damage(att,att.mhp*R.s.thorns,false,true);
  if(R.hp<=0)gameOver();
}
function nearestOther(x,y,ex,r){let best=null,bd=r*r;for(const e of enemies){if(e.dead||e===ex)continue;const d=(e.x-x)**2+(e.y-y)**2;if(d<bd){bd=d;best=e}}return best}
function nearest(x,y){let best=null,bd=Infinity;for(const e of enemies){if(e.dead)continue;const d=(e.x-x)**2+(e.y-y)**2;if(d<bd){bd=d;best=e}}return best}
// shards earned by this run so far (paid when it ends)
const runShards=R=>R.kills*CFG.shardPerKill*R.tm.shard*(1+R.fx.drop);
function gameOver(quit){
  const R=run;if(R.over)return;R.over=true;R.hp=0;save.runs++;
  R.shards=runShards(R);save.shards+=R.shards;save.stats.shards+=R.shards;
  R.cph=R.time>0?R.coins/R.time*3600:0;R.newBest=false;
  if(R.time>=CFG.offlineMinRun&&R.cph>save.bestCph){save.bestCph=R.cph;R.newBest=true}
  const prevBest=save.best[R.tier]||0;R.newBestWave=R.wave>prevBest;
  if(prevBest<R.wave)save.best[R.tier]=R.wave;
  {const T=save.stats.tiers[R.tier]||(save.stats.tiers[R.tier]={runs:0,coins:0,cph:0});T.runs++;T.coins+=R.coins;if(R.time>=CFG.offlineMinRun)T.cph=Math.max(T.cph,R.cph)}
  save.hist.unshift({at:Date.now(),t:R.tier,w:R.wave,c:R.coins,s:R.shards,ch:R.chips,al:R.alloy,cph:R.cph,time:R.time,k:R.kills,quit:!!quit,best:R.newBestWave});
  save.hist.length=Math.min(save.hist.length,CFG.histMax);
  persist();ovTier=R.tier;startAuto();showOv('over');buildPanel();
}
// ================= simulation (fixed step) =================
function fire(tgt){const s=run.s,b=bPool.pop()||{};let c=Math.random()<s.crit?1:0;save.stats.shots++;if(c){save.stats.crits++;if(s.superCrit>0&&Math.random()<s.superCrit){c=2;save.stats.supers++}}
  b.x=b.y=b.px=b.py=b.rx=b.ry=0;b.e=tgt;b.g=tgt.gen;b.c=c;b.dmg=s.damage*(c?s.critMult:1)*(c===2?s.superMult:1);b.l=2;
  b.bn=s.bounceChance>0&&Math.random()<s.bounceChance?Math.floor(s.bounceTargets):0;bullets.push(b)}
function update(dt){
  const R=run,s=R.s,tr=CFG.towerR;R.time+=dt;save.stats.time+=dt;R.waveT+=dt;R.spawnT+=dt;
  const cnt=CFG.spawnCount(R.wave),iv=R.waveLen*.9/cnt;
  while(R.spawnT>=iv&&R.spawned<cnt){R.spawnT-=iv;R.spawned++;spawn(pickType(R.wave))}
  if(R.waveT>=R.waveLen)nextWave();
  R.hp=Math.min(s.health,R.hp+s.regen*dt);
  if(R.barMax>0)R.bar=Math.min(R.barMax,R.bar+R.barMax*s.barrierRegen*dt);
  let tgt=null,td=Infinity;
  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];
    if(e.dead){enemies[i]=enemies[enemies.length-1];enemies.pop();ePool.push(e);continue}
    e.px=e.x;e.py=e.y;const d=e.d,dist=Math.hypot(e.x,e.y),stop=d.stop||tr+d.sz;e.dist=dist;
    let sp=d.spd;if(e.slowT>0){e.slowT-=dt;sp*=1-e.slowF}if(R.fx.slowAura&&dist<=s.range)sp*=1-R.fx.slowAura;
    if(dist>stop){const m=Math.min(sp*dt,dist-stop);e.x-=e.x/dist*m;e.y-=e.y/dist*m}
    else{e.atk+=dt;
      if(d.stop){if(e.atk>=2){e.atk=0;const b=ebPool.pop()||{};b.x=b.px=b.rx=e.x;b.y=b.py=b.ry=e.y;b.dmg=e.dmg;ebs.push(b)}}
      else if(e.atk>=1){e.atk=0;hitTower(e.dmg,e);if(R.over)return}}
    if(d.heal){e.hf=Math.max(0,e.hf-dt);e.ht+=dt;if(e.ht>=1){e.ht=0;e.hf=.4;const r2=d.healR**2;
      for(const o of enemies)if(!o.dead&&o!==e&&(o.x-e.x)**2+(o.y-e.y)**2<=r2)o.hp=Math.min(o.mhp,o.hp+o.mhp*d.heal)}}
    if(!e.dead&&dist<=s.range+d.sz&&dist<td){td=dist;tgt=e}
  }
  separate();
  const fi=1/s.aspd;R.fireT+=dt;
  if(!tgt)R.fireT=Math.min(R.fireT,fi);
  else while(R.fireT>=fi){R.fireT-=fi;fire(tgt);
    const mc=s.multiChance+R.fx.multi;
    if(mc>0&&Math.random()<mc){const extra=[];for(const e of enemies)if(!e.dead&&e!==tgt&&e.dist<=s.range+e.d.sz)extra.push(e);
      extra.sort((a,b)=>a.dist-b.dist);const n=Math.min(extra.length,Math.floor(s.multiTargets));for(let k=0;k<n;k++)fire(extra[k]);if(n)save.stats.multi++}}
  const m=CFG.bulletSpd*dt;
  for(let i=bullets.length-1;i>=0;i--){
    const b=bullets[i];b.px=b.x;b.py=b.y;let e=b.e,drop=false;
    if(e.dead||e.gen!==b.g){e=nearest(b.x,b.y);if(e){b.e=e;b.g=e.gen}else drop=true}
    if(!drop){const dx=e.x-b.x,dy=e.y-b.y,dd=Math.hypot(dx,dy);
      if(dd<=m+e.d.sz){trace(b.rx,b.ry,e.x,e.y,b.c===2?3:b.c?2:0);if(R.fx.slowHit){e.slowT=1;e.slowF=R.fx.slowHit}{const dealt=damage(e,b.dmg*(e.d.r>=2?1+R.fx.eliteDmg:1)*(1+s.dmgDist*e.dist),b.c);if(s.lifesteal>0&&dealt>0){const h=Math.min(s.health-R.hp,dealt*s.lifesteal);if(h>0){R.hp+=h;save.stats.stolen+=h}}}drop=true;
        if(!e.dead&&s.kbChance>0&&Math.random()<s.kbChance){const d=Math.hypot(e.x,e.y)||1,k=Math.min(s.kbForce/e.d.weight,CFG.spawnR-d);if(k>0){e.x+=e.x/d*k;e.y+=e.y/d*k;e.px=e.x;e.py=e.y;save.stats.kbs++}}
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
// ---- crowding: enemies push each other apart (spatial grid, so it stays cheap with hundreds) ----
const SEPC=48,SEPN=16,SEPO=SEPC*SEPN/2,sepHead=new Int32Array(SEPN*SEPN);let sepNext=new Int32Array(256);
const sepCell=v=>Math.max(0,Math.min(SEPN-1,Math.floor((v+SEPO)/SEPC)));
function separate(){
  const n=enemies.length;if(n<2)return;
  if(sepNext.length<n)sepNext=new Int32Array(n*2);
  sepHead.fill(-1);
  for(let i=0;i<n;i++){const e=enemies[i];if(e.dead)continue;const c=sepCell(e.y)*SEPN+sepCell(e.x);sepNext[i]=sepHead[c];sepHead[c]=i}
  const tr=CFG.towerR,k=CFG.sepPush;
  for(let i=0;i<n;i++){const a=enemies[i];if(a.dead)continue;const cx=sepCell(a.x),cy=sepCell(a.y),sa=a.d.sz;
    for(let gy=Math.max(0,cy-1);gy<=Math.min(SEPN-1,cy+1);gy++)for(let gx=Math.max(0,cx-1);gx<=Math.min(SEPN-1,cx+1);gx++)
      for(let j=sepHead[gy*SEPN+gx];j!==-1;j=sepNext[j]){if(j<=i)continue;const b=enemies[j],sb=b.d.sz,min=(sa+sb)*CFG.sepGap;
        let dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy;if(d2>=min*min)continue;
        let d=Math.sqrt(d2);if(d<1e-3){const r=Math.random()*6.283;dx=Math.cos(r);dy=Math.sin(r);d=1}else{dx/=d;dy/=d}
        const p=(min-d)*k,wa=b.d.weight/(a.d.weight+b.d.weight),wb=1-wa; // heavier enemies get shoved less
        a.x-=dx*p*wa;a.y-=dy*p*wa;b.x+=dx*p*wb;b.y+=dy*p*wb}}
  for(let i=0;i<n;i++){const e=enemies[i],m=tr+e.d.sz,d=Math.hypot(e.x,e.y);if(d<m&&d>0){e.x*=m/d;e.y*=m/d}} // never inside the spire
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
