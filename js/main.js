// Spire — main loop and boot. Loaded last.
// ================= loop =================
let last=performance.now(),acc=0,frames=0,fpsT=0,fps=0,simMs=0,hudT=0;
function frame(now){
  const dt=Math.min(.1,(now-last)/1000);last=now;
  if(run&&!run.over&&!paused){
    const sp=save.set.speed;acc+=dt*sp;let n=0;const max=sp*3+2,t0=performance.now();
    while(acc>=CFG.step&&n<max&&!run.over){update(CFG.step);acc-=CFG.step;n++}
    if(n>=max)acc=Math.min(acc,CFG.step);simMs=simMs*.9+(performance.now()-t0)*.1;
  }
  A=(run&&!run.over&&!paused)?Math.min(1,acc/CFG.step):1;
  draw();bars();frames++;fpsT+=dt;hudT+=dt;
  if(fpsT>=.5){fps=Math.round(frames/fpsT);frames=0;fpsT=0}
  if(hudT>=.1){hudT=0;autoBuy();hud()}
  requestAnimationFrame(frame);
}
// ---- persistence lifecycle + boot ----
document.addEventListener('visibilitychange',()=>{if(document.hidden)persist();else offline()});
setInterval(()=>{if(!document.hidden)persist()},5000);addEventListener('pagehide',persist);
offline();
if(!speeds().includes(save.set.speed))save.set.speed=1;
buildSpeeds();buildPanel();showOv('start');requestAnimationFrame(frame);
