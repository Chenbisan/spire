// Spire — main loop and boot. Loaded last.
// ================= loop =================
let simCapped=false,last=performance.now(),acc=0,frames=0,fpsT=0,fps=0,simMs=0,hudT=0;
function frame(now){
  const dt=Math.min(.1,(now-last)/1000);last=now;
  if(run&&!run.over&&!paused){
    const sp=save.set.speed;acc+=dt*sp;let n=0;const max=sp*3+2,t0=performance.now();
    // time budget: if a huge crowd makes steps expensive, run slower than the chosen speed rather than freezing the screen
    while(acc>=CFG.step&&n<max&&!run.over&&performance.now()-t0<CFG.simBudget){update(CFG.step);acc-=CFG.step;n++}
    simCapped=acc>=CFG.step;if(n>=max||simCapped)acc=Math.min(acc,CFG.step);simMs=simMs*.9+(performance.now()-t0)*.1;
  }
  A=(run&&!run.over&&!paused)?Math.min(1,acc/CFG.step):1;
  for(let i=tracers.length-1;i>=0;i--){const t=tracers[i];t.l-=dt;if(t.l<=0){tracers[i]=tracers[tracers.length-1];tracers.pop()}}
  draw();bars();frames++;fpsT+=dt;hudT+=dt;
  if(fpsT>=.5){fps=Math.round(frames/fpsT);frames=0;fpsT=0}
  if(hudT>=.1){hudT=0;autoBuy();hud()}
  requestAnimationFrame(frame);
}
// ---- background running: while the tab is hidden the browser stops drawing frames, so a run keeps going from a ticker ----
// The ticker lives in a tiny worker because browsers slow hidden pages' own timers to once a second or even once a minute.
// Each tick simulates the real time since the last one at the chosen speed (within CFG.bgBudget ms of work; if a huge crowd
// makes that too slow the run falls behind, like the on-screen time budget). While a run is advancing it also saves, so coming
// back doesn't pay offline earnings for time the run was already playing.
let bgLast=0,bgSave=0;
function bgTick(){
  const now=performance.now();if(!document.hidden){bgLast=0;return}
  if(!bgLast){bgLast=now;return}
  const dt=Math.min(CFG.bgMaxGap,(now-bgLast)/1000);bgLast=now;
  if(!run||run.over||paused)return;
  let a=dt*save.set.speed;const t0=performance.now();
  while(a>=CFG.step&&!run.over&&performance.now()-t0<CFG.bgBudget){update(CFG.step);a-=CFG.step}
  tracers.length=0;autoBuy();
  if(now-bgSave>5000){bgSave=now;persist()}
}
try{const w=new Worker(URL.createObjectURL(new Blob([`setInterval(()=>postMessage(0),${CFG.bgTick})`],{type:'text/javascript'})));w.onmessage=bgTick}
catch(e){setInterval(bgTick,CFG.bgTick)}
// ---- persistence lifecycle + boot ----
document.addEventListener('visibilitychange',()=>{if(document.hidden)persist();else offline()});
setInterval(()=>{if(!document.hidden)persist()},5000);addEventListener('pagehide',persist);
offline();
if(!speeds().includes(save.set.speed))save.set.speed=1;
buildSpeeds();buildPanel();showOv('start');requestAnimationFrame(frame);
