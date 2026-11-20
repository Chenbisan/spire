// Spire — game state and fixed-step simulation.
// Lab levels come from the save
const labLv=k=>Math.min(LK[k].max,save.lab[k]||0),labVal=k=>LK[k].val(labLv(k));
const speeds=()=>[1,2,3,5,8,12,16,24].filter(s=>s<=labVal('speed'));
// ================= stats =================
function valAt(s,r,w){let v=s.mul?s.base*(1+s.ra*r)*s.wm**w:s.base+(s.ra||0)*r+(s.wa||0)*w;return s.max!=null?Math.min(v,s.max):v}
const capped=(s,r,w)=>s.max!=null&&valAt(s,r,w)>=s.max-1e-9;
function recalc(){if(!run)return;const old=run.s?run.s.health:0;run.s={};for(const s of ST)run.s[s.k]=valAt(s,run.lv[s.k]||0,save.ws[s.k]||0);if(old)run.hp=Math.max(1,run.hp+run.s.health-old)}
// ================= state =================
let run=null,paused=false,GEN=0;
const enemies=[],ePool=[],bullets=[],bPool=[],ebs=[],ebPool=[],dnums=[],parts=[];
function newRun(tier){
  stopAuto();
  for(const e of enemies)ePool.push(e);for(const b of bullets)bPool.push(b);for(const b of ebs)ebPool.push(b);
  enemies.length=bullets.length=ebs.length=dnums.length=parts.length=0;
  run={tier,wave:1,waveT:0,spawnT:0,spawned:0,lv:{},fireT:0,kills:0,coins:0,shards:0,cashEarned:0,time:0,over:false,tm:CFG.tier(tier)};
  recalc();run.hp=run.s.health;run.cash=run.s.startCash;
  paused=false;showOv(null);buildPanel();
}
function pickType(w){let r=Math.random(),acc=0;for(const t of TYPES){const d=ET[t];if(!d.wt||w<d.from)continue;acc+=d.wt;if(r<acc)return t}return'basic'}
function spawn(t){
  const d=ET[t],R=run,a=Math.random()*Math.PI*2,wv=R.wave-1,e=ePool.pop()||{};
  e.t=t;e.d=d;e.x=Math.cos(a)*CFG.spawnR;e.y=Math.sin(a)*CFG.spawnR;e.px=e.x;e.py=e.y;e.dist=CFG.spawnR;
  e.mhp=e.hp=d.hp*CFG.hpGrow**wv*R.tm.hp;e.dmg=d.dmg*CFG.dmgGrow**wv*R.tm.dmg;e.atk=0;e.gen=++GEN;e.dead=false;
  enemies.push(e);
}
function nextWave(){
  const R=run;R.wave++;R.waveT=R.spawnT=R.spawned=0;
  R.cash+=CFG.waveCash(R.wave)*R.s.waveCash;
  if(R.wave%CFG.bossEvery===0)spawn('boss');
  if((save.best[R.tier]||0)<R.wave)save.best[R.tier]=R.wave;
  if(R.wave>=CFG.tierUnlockWave&&R.tier===save.tierMax){save.tierMax++;persist();toast(`Tier ${save.tierMax} unlocked`)}
}
function kill(e){
  const R=run;e.dead=true;R.kills++;save.kills++;
  const c=e.d.cash*R.s.cashBonus*CFG.killCash(R.wave);R.cash+=c;R.cashEarned+=c;
  const k=e.d.coin*R.s.coinBonus*R.tm.coin*CFG.killCoin(R.wave);save.coins+=k;R.coins+=k;
  if(R.tm.shard){const sh=e.d.coin*CFG.shardRate*R.tm.shard;save.shards+=sh;R.shards+=sh}
  for(let i=0;i<4&&parts.length<CFG.maxParts;i++){const a=Math.random()*6.283,v=30+Math.random()*60;parts.push({x:e.x,y:e.y,px:e.x,py:e.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:.5})}
}
function damage(e,v,crit){
  e.hp-=v;
  if(save.set.dmgNums&&dnums.length<CFG.maxDmgNums)dnums.push({x:e.x,y:e.y-e.d.sz,py:e.y-e.d.sz,v,c:crit,l:.6});
  if(e.hp<=0&&!e.dead)kill(e);
}
function hitTower(v,att){
  const R=run;R.hp-=v*(1-R.s.defense);
  if(att&&R.s.thorns>0&&!att.dead)damage(att,att.mhp*R.s.thorns,false);
  if(R.hp<=0)gameOver();
}
function nearest(x,y){let best=null,bd=Infinity;for(const e of enemies){if(e.dead)continue;const d=(e.x-x)**2+(e.y-y)**2;if(d<bd){bd=d;best=e}}return best}
function gameOver(){
  const R=run;if(R.over)return;R.over=true;R.hp=0;save.runs++;
  R.cph=R.time>0?R.coins/R.time*3600:0;R.newBest=false;
  if(R.time>=CFG.offlineMinRun&&R.cph>save.bestCph){save.bestCph=R.cph;R.newBest=true}
  if((save.best[R.tier]||0)<R.wave)save.best[R.tier]=R.wave;
  persist();ovTier=R.tier;startAuto();showOv('over');buildPanel();
}
// ================= simulation (fixed step) =================
function update(dt){
  const R=run,s=R.s,tr=CFG.towerR;R.time+=dt;R.waveT+=dt;R.spawnT+=dt;
  const cnt=CFG.spawnCount(R.wave),iv=CFG.waveLen*.9/cnt;
  while(R.spawnT>=iv&&R.spawned<cnt){R.spawnT-=iv;R.spawned++;spawn(pickType(R.wave))}
  if(R.waveT>=CFG.waveLen)nextWave();
  R.hp=Math.min(s.health,R.hp+s.regen*dt);
  let tgt=null,td=Infinity;
  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];
    if(e.dead){enemies[i]=enemies[enemies.length-1];enemies.pop();ePool.push(e);continue}
    e.px=e.x;e.py=e.y;const d=e.d,dist=Math.hypot(e.x,e.y),stop=d.stop||tr+d.sz;e.dist=dist;
    if(dist>stop){const m=Math.min(d.spd*dt,dist-stop);e.x-=e.x/dist*m;e.y-=e.y/dist*m}
    else{e.atk+=dt;
      if(d.stop){if(e.atk>=2){e.atk=0;const b=ebPool.pop()||{};b.x=b.px=e.x;b.y=b.py=e.y;b.dmg=e.dmg;ebs.push(b)}}
      else if(e.atk>=1){e.atk=0;hitTower(e.dmg,e);if(R.over)return}}
    if(!e.dead&&dist<=s.range+d.sz&&dist<td){td=dist;tgt=e}
  }
  const fi=1/s.aspd;R.fireT+=dt;
  if(!tgt)R.fireT=Math.min(R.fireT,fi);
  else while(R.fireT>=fi){R.fireT-=fi;const b=bPool.pop()||{},c=Math.random()<s.crit;b.x=b.y=b.px=b.py=0;b.e=tgt;b.g=tgt.gen;b.c=c;b.dmg=s.damage*(c?s.critMult:1);b.l=2;bullets.push(b)}
  const m=CFG.bulletSpd*dt;
  for(let i=bullets.length-1;i>=0;i--){
    const b=bullets[i];b.px=b.x;b.py=b.y;let e=b.e,drop=false;
    if(e.dead||e.gen!==b.g){e=nearest(b.x,b.y);if(e){b.e=e;b.g=e.gen}else drop=true}
    if(!drop){const dx=e.x-b.x,dy=e.y-b.y,dd=Math.hypot(dx,dy);
      if(dd<=m+e.d.sz){damage(e,b.dmg,b.c);drop=true}else{b.x+=dx/dd*m;b.y+=dy/dd*m;b.l-=dt;if(b.l<=0)drop=true}}
    if(drop){bullets[i]=bullets[bullets.length-1];bullets.pop();bPool.push(b)}
  }
  const em=CFG.ebSpd*dt;
  for(let i=ebs.length-1;i>=0;i--){const b=ebs[i],d=Math.hypot(b.x,b.y);b.px=b.x;b.py=b.y;
    if(d<=tr+em){ebs[i]=ebs[ebs.length-1];ebs.pop();ebPool.push(b);hitTower(b.dmg,null);if(R.over)return}
    else{b.x-=b.x/d*em;b.y-=b.y/d*em}}
  for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.px=p.x;p.py=p.y;p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt;if(p.l<=0){parts[i]=parts[parts.length-1];parts.pop()}}
  for(let i=dnums.length-1;i>=0;i--){const n=dnums[i];n.py=n.y;n.y-=30*dt;n.l-=dt;if(n.l<=0){dnums[i]=dnums[dnums.length-1];dnums.pop()}}
}
// ---- auto-buyer (runs from the HUD tick) ----
function autoBuy(){
  if(!run||run.over||paused||!labLv('auto'))return;let any=false;
  for(let i=0;i<100;i++){let best=null,bc=Infinity;
    for(const s of ST){if(s.ws||!save.set.ab[s.g])continue;const r=run.lv[s.k]||0;if(capped(s,r,save.ws[s.k]||0))continue;const c=s.c[0]*s.c[1]**r;if(c<bc){bc=c;best=s}}
    if(!best||bc>run.cash)break;run.cash-=bc;run.lv[best.k]=(run.lv[best.k]||0)+1;any=true}
  if(any)recalc();
}
