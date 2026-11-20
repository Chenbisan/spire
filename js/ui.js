// Spire — DOM UI: HUD, overlays, upgrade panel, settings, controls.
// ---- auto-restart after a run ends ----
let autoLeft=0,autoTimer=null;
function stopAuto(){clearInterval(autoTimer);autoTimer=null;autoLeft=0}
function startAuto(){stopAuto();if(!save.set.auto)return;autoLeft=save.set.autoDelay;
  autoTimer=setInterval(()=>{autoLeft--;const el=document.getElementById('autoTxt');if(el)el.textContent=autoLeft;if(autoLeft<=0){stopAuto();newRun(ovTier)}},1000)}
const hpBar=$('hpBar'),waveBar=$('waveBar');let lastHp=-1,lastWv=-1;
function bars(){
  const hp=run?Math.max(0,Math.min(1,run.hp/run.s.health)):0;
  const wv=run&&!run.over?Math.min(1,(run.waveT+(paused?0:A*CFG.step))/CFG.waveLen):0;
  if(Math.abs(hp-lastHp)>1e-4){lastHp=hp;hpBar.style.transform=`scaleX(${hp})`}
  if(Math.abs(wv-lastWv)>1e-4){lastWv=wv;waveBar.style.transform=`scaleX(${wv})`}
}
// ================= UI =================
const TX=(id,t)=>{const e=$(id);t=String(t);if(e.textContent!==t)e.textContent=t};
function hud(){
  TX('hTier',run?run.tier:'–');TX('hWave',run?run.wave:'–');
  TX('hCash',run?fmt(run.cash):'0');TX('hCoins',fmt(save.coins));
  if(run){TX('hpTxt',`${fmt(Math.max(0,run.hp))} / ${fmt(run.s.health)}`)}
  else{TX('hpTxt','–')}
  const pf=$('perf');pf.hidden=!save.set.perf;$('perfBtn').classList.toggle('on',save.set.perf);
  if(save.set.perf)pf.textContent=`${fps} fps  ·  sim ${simMs.toFixed(2)} ms/frame\n${enemies.length} enemies  ·  ${bullets.length} shots  ·  ${ebs.length} enemy shots`;
  refreshPanel();
}
let ovTier=save.tierMax;
function tierPicker(){let h='<div class="tiers">';for(let t=1;t<=save.tierMax;t++)h+=`<button data-tier="${t}" class="${t===ovTier?'on':''}">Tier ${t}<small>best wave ${save.best[t]||0}</small></button>`;return h+'</div>'}
function showOv(kind){
  const ov=$('ov'),c=$('ovCard');if(!kind){ov.hidden=true;return}ov.hidden=false;
  ovTier=Math.min(ovTier,save.tierMax);
  if(kind==='start')c.innerHTML=`<h2>Hold the center</h2><p>Your spire fires automatically. Spend cash on upgrades during a run; coins carry over to the workshop. Reach wave ${CFG.tierUnlockWave} to unlock the next tier.</p>${tierPicker()}<button class="go" id="goBtn">Start run</button>`;
  else{const R=run,m=Math.floor(R.time/60),s=Math.floor(R.time%60);
    c.innerHTML=`<h2>Fell on wave ${R.wave}</h2><p>Tier ${R.tier} · best ${save.best[R.tier]||0}</p><div class="grid2"><div><span>Coins earned</span>${fmt(R.coins)}</div><div><span>Coins per hour</span>${fmt(R.cph)}${R.newBest?' · new best':''}</div><div><span>Offline rate</span>${fmt(save.bestCph)}/h${R.time<CFG.offlineMinRun?' (run too short to count)':''}</div><div><span>Kills</span>${fmt(R.kills)}</div><div><span>Cash earned</span>${fmt(R.cashEarned)}</div><div><span>Run time</span>${m}m ${s}s (game time)</div></div><button id="toWs" style="width:100%;margin-bottom:8px">Open workshop (${fmt(save.coins)} coins)</button>${tierPicker()}<button class="go" id="goBtn">${autoTimer?`Run again · auto in <span id="autoTxt">${autoLeft}</span>s`:'Run again'}</button>${autoTimer?'<button id="stopAuto" style="width:100%;margin-top:8px">Stay on this screen</button>':''}`}
}
$('ovCard').addEventListener('click',e=>{
  const t=e.target.closest('button');if(!t)return;
  if(t.dataset.tier){ovTier=+t.dataset.tier;showOv(run&&run.over?'over':'start')}
  else if(t.id==='goBtn'){stopAuto();newRun(ovTier)}
  else if(t.id==='stopAuto'){stopAuto();showOv('over')}
  else if(t.id==='toWs'){ui.tab='Workshop';buildPanel()}
});
const ui={tab:'Attack',mult:1};let rows=[];
const TABS=['Attack','Defense','Utility','Workshop','Lab','Settings'];
function buildTabs(){$('tabs').innerHTML=TABS.map(t=>`<button data-tab="${t}" class="${t===ui.tab?'on':''}">${t}</button>`).join('')}
$('tabs').addEventListener('click',e=>{const t=e.target.closest('button');if(t){ui.tab=t.dataset.tab;buildPanel()}});
function plan(s,ws){
  const r=run?run.lv[s.k]||0:0,w=save.ws[s.k]||0,[c0r,g]=ws?s.w:s.c,lv=ws?w:r,c0=ws?c0r*(1-labVal('disc')):c0r;
  const bank=ws?save.coins:(run&&!run.over?run.cash:0),lim=ui.mult==='Max'?1000:ui.mult;
  let n=0,tot=0;
  while(n<lim){if(ws?capped(s,0,w+n):capped(s,r+n,w))break;const c=c0*g**(lv+n);if(ui.mult==='Max'&&tot+c>bank)break;tot+=c;n++}
  const isCap=ws?capped(s,0,w):capped(s,r,w);
  let show=n,cost=tot;if(n===0&&!isCap){show=1;cost=c0*g**lv}
  const cur=ws?valAt(s,0,w):valAt(s,r,w),nxt=ws?valAt(s,0,w+show):valAt(s,r+show,w);
  return{n,cost,show,cur,nxt,isCap,ok:n>0&&tot<=bank};
}
function buildPanel(){
  buildTabs();const P=$('panel');
  labRows=[];
  if(ui.tab==='Settings'){P.innerHTML=settingsHtml();return rows=[]}
  if(ui.tab==='Lab'){rows=[];
    P.innerHTML=`<p class="note">Research applies instantly and lasts forever. No timers.</p>`+LAB.map(l=>`<div class="row"><div><b>${l.n}</b><span class="v"></span><span class="note" style="display:block;margin:2px 0 0">${l.d}</span></div><button class="buy coin" data-lab="${l.k}"></button></div>`).join('');
    labRows=[...P.querySelectorAll('[data-lab]')].map(b=>({l:LK[b.dataset.lab],b,v:b.parentNode.querySelector('.v')}));
    return refreshPanel()}
  const ws=ui.tab==='Workshop';
  let h=`<div class="mults">${[1,10,'Max'].map(m=>`<button data-mult="${m}" class="${ui.mult===m?'on':''}">${m==='Max'?'Max':'×'+m}</button>`).join('')}</div>`;
  if(ws){h+='<p class="note">Permanent upgrades, paid in coins. They apply to every run, including the one in progress. Values shown are your starting values.</p>'+`<p class="note">Offline rate: <b class="coin">${fmt(save.bestCph*labVal('offSpd'))} coins/hour</b> (best run ${fmt(save.bestCph)}/h × lab ${labVal('offSpd').toFixed(2)}, up to ${labVal('offCap')}h). Runs under ${CFG.offlineMinRun/60} minutes of game time don't count. Rate is per game-hour, so game speed doesn't change it.</p>`;
    for(const g of['Attack','Defense','Utility'])h+=`<div class="gh">${g}</div>`+ST.filter(s=>s.g===g).map(rowHtml).join('')}
  else{if(labLv('auto'))h+=`<label class="ab"><input type="checkbox" data-ab="${ui.tab}" ${save.set.ab[ui.tab]?'checked':''}> Auto-buy ${ui.tab.toLowerCase()} upgrades</label>`;
    if(!run||run.over)h+='<p class="note">Start a run to buy in-run upgrades.</p>';h+=ST.filter(s=>s.g===ui.tab&&!s.ws).map(rowHtml).join('')}
  P.innerHTML=h;
  rows=[...P.querySelectorAll('.row')].map(r=>({s:SK[r.dataset.k],v:r.querySelector('.v'),b:r.querySelector('.buy')}));
  refreshPanel();
}
let labRows=[];
const labCost=l=>l.c[0]*l.c[1]**labLv(l.k);
const rowHtml=s=>`<div class="row" data-k="${s.k}"><div><b>${s.n}</b><span class="v"></span></div><button class="buy" data-k="${s.k}"></button></div>`;
function refreshPanel(){
  for(const r of labRows){const l=r.l,lv=labLv(l.k),mx=lv>=l.max,c=labCost(l);
    const vt=mx?l.f(l.val(lv))+' (max)':`${l.f(l.val(lv))} → ${l.f(l.val(lv+1))}`;if(r.v.textContent!==vt)r.v.textContent=vt;
    const ok=!mx&&save.coins>=c;if(r.b.disabled===ok)r.b.disabled=!ok;const t=mx?'Max':fmt(c);if(r.b.textContent!==t)r.b.textContent=t}
  const ws=ui.tab==='Workshop';
  for(const r of rows){const p=plan(r.s,ws);
    const vt=p.isCap?fv(r.s,p.cur)+' (max)':`${fv(r.s,p.cur)} → ${fv(r.s,p.nxt)}`;if(r.v.textContent!==vt)r.v.textContent=vt;
    if(r.b.disabled===p.ok)r.b.disabled=!p.ok;
    const html=p.isCap?'Max':`<span class="q">+${p.show}</span>${fmt(p.cost)}`;
    if(r.b.innerHTML!==html)r.b.innerHTML=html;
    r.b.classList.toggle('coin',ws);r.b.classList.toggle('cash',!ws)}
}
$('panel').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.mult){ui.mult=b.dataset.mult==='Max'?'Max':+b.dataset.mult;return buildPanel()}
  if(b.dataset.lab){const l=LK[b.dataset.lab],c=labCost(l);if(labLv(l.k)>=l.max||save.coins<c)return;save.coins-=c;save.lab[l.k]=labLv(l.k)+1;persist();
    if(l.k==='speed')buildSpeeds();if(l.k==='auto')toast('Auto-buy toggles added to the upgrade tabs');refreshPanel();return}
  if(b.dataset.k){const s=SK[b.dataset.k],ws=ui.tab==='Workshop',p=plan(s,ws);if(!p.ok)return;
    if(ws){save.coins-=p.cost;save.ws[s.k]=(save.ws[s.k]||0)+p.n;persist()}else{run.cash-=p.cost;run.lv[s.k]=(run.lv[s.k]||0)+p.n}
    recalc();refreshPanel();return}
  settingsClick(b);
});
function settingsHtml(){return`<div class="set">
  <label><input type="checkbox" id="optDn" ${save.set.dmgNums?'checked':''}> Damage numbers</label>
  <label><input type="checkbox" id="optPf" ${save.set.perf?'checked':''}> Performance overlay</label>
  <label><input type="checkbox" id="optAuto" ${save.set.auto?'checked':''}> Auto-restart after a run ends, after
    <select id="optDelay" style="font:inherit;min-height:36px;border-radius:8px;background:var(--arena);color:var(--ink);border:1px solid var(--line)">${[3,5,10,15].map(n=>`<option ${save.set.autoDelay===n?'selected':''}>${n}</option>`).join('')}</select> s</label>
  <div class="gh">Save</div><p class="note">Progress saves in this browser automatically. Copy a backup code to be safe, or paste one to restore.</p>
  <textarea id="saveTxt" placeholder="Backup code appears here, or paste one to import"></textarea>
  <div class="btns"><button data-act="export">Copy backup code</button><button data-act="import">Import code</button></div>
  <div class="gh">Run</div><div class="btns"><button data-act="abandon" ${run&&!run.over?'':'disabled'}>End current run</button></div>
  <div class="gh">Danger zone</div><div class="btns"><button data-act="reset" class="danger">Reset all progress</button></div>
  <p class="note">Keys: Space pause · 1–5 speed</p><p class="note"><a href="${CHANGELOG_URL}" target="_blank" rel="noopener" style="color:inherit">Version ${APP_VERSION} · what's new</a></p></div>`}
let resetArm=0;
function settingsClick(b){
  const a=b.dataset.act,tx=$('saveTxt');
  if(a==='export'){const code=btoa(unescape(encodeURIComponent(JSON.stringify(save))));tx.value=code;tx.select();
    navigator.clipboard?.writeText(code).then(()=>toast('Backup code copied'),()=>toast('Select the code and copy it'))||toast('Select the code and copy it')}
  else if(a==='import'){try{const s=JSON.parse(decodeURIComponent(escape(atob(tx.value.trim()))));if(s.v!==1)throw 0;save=Object.assign(fresh(),s,{set:Object.assign(fresh().set,s.set)});persist();recalc();toast('Save imported');buildPanel();if(!run)showOv('start')}catch(e){toast('That code did not work')}}
  else if(a==='abandon'){if(run&&!run.over)gameOver()}
  else if(a==='reset'){if(Date.now()-resetArm<3000){stopAuto();save=fresh();persist();run=null;enemies.length=bullets.length=ebs.length=0;ovTier=1;showOv('start');buildPanel();toast('Progress reset')}else{resetArm=Date.now();b.textContent='Click again to confirm'}}
}
$('panel').addEventListener('change',e=>{if(e.target.id==='optDn')save.set.dmgNums=e.target.checked;if(e.target.id==='optPf')save.set.perf=e.target.checked;
  if(e.target.id==='optAuto'){save.set.auto=e.target.checked;if(!save.set.auto&&autoTimer){stopAuto();if(run&&run.over)showOv('over')}}
  if(e.target.id==='optDelay')save.set.autoDelay=+e.target.value;
  if(e.target.dataset.ab)save.set.ab[e.target.dataset.ab]=e.target.checked;persist()});
function buildSpeeds(){$('speeds').innerHTML=speeds().map(s=>`<button data-sp="${s}" class="${save.set.speed===s?'on':''}">${s}×</button>`).join('')}
$('speeds').addEventListener('click',e=>{const b=e.target.closest('button');if(b){save.set.speed=+b.dataset.sp;persist();buildSpeeds()}});
const setPause=v=>{paused=v;$('pause').textContent=v?'Resume':'Pause';$('pause').classList.toggle('on',v)};
$('pause').addEventListener('click',()=>setPause(!paused));
$('perfBtn').addEventListener('click',()=>{save.set.perf=!save.set.perf;persist()});
addEventListener('keydown',e=>{if(e.target.matches('input,textarea'))return;
  if(e.code==='Space'){e.preventDefault();if(run&&!run.over)setPause(!paused)}
  const n=+e.key,sp=speeds();if(n>=1&&n<=sp.length){save.set.speed=sp[n-1];persist();buildSpeeds()}});
