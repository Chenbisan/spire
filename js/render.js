// Spire — canvas rendering. Reads simulation state; only writes render-only fields (shot rx/ry = last drawn position).
// ================= render =================
const cv=$('cv'),ctx=cv.getContext('2d'),stage=$('stage');
let C={},A=1;const IX=o=>o.px+(o.x-o.px)*A,IY=o=>o.py+(o.y-o.py)*A;
function readColors(){const p=$('probe');for(const k of['arena','grid','acc','ink','mute','gold','hot','e1','e2','e3','e4','e5','e6','e7','e8','barrier']){p.style.color=`var(--${k})`;C[k]=getComputedStyle(p).color}}
readColors();
new MutationObserver(readColors).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',readColors);
const ro=new ResizeObserver(()=>{const d=Math.min(2,devicePixelRatio||1);cv.width=Math.round(stage.clientWidth*d);cv.height=Math.round(stage.clientHeight*d)});ro.observe(stage);
function shape(e){
  const d=e.d,P=SHAPES[d.sh],s=d.sz,x=IX(e),y=IY(e),r=d.rot==='face'?Math.atan2(-y,-x):d.rot==='spin'?run.time*.5:0;
  const c=Math.cos(r)*s,n=Math.sin(r)*s;
  ctx.moveTo(x+P[0][0]*c-P[0][1]*n,y+P[0][0]*n+P[0][1]*c);
  for(let i=1;i<P.length;i++)ctx.lineTo(x+P[i][0]*c-P[i][1]*n,y+P[i][0]*n+P[i][1]*c);
  ctx.closePath();
}
function shots(list,col,h){
  if(!list.length)return;
  ctx.strokeStyle=col;ctx.globalAlpha=.45;ctx.lineWidth=h;ctx.lineCap='round';ctx.beginPath();
  for(const b of list){const x=IX(b),y=IY(b);let x0=b.rx,y0=b.ry;const dx=x-x0,dy=y-y0,L=Math.hypot(dx,dy);
    if(L>CFG.streakMax){x0=x-dx/L*CFG.streakMax;y0=y-dy/L*CFG.streakMax}if(L>.5){ctx.moveTo(x0,y0);ctx.lineTo(x,y)}}
  ctx.stroke();ctx.globalAlpha=1;ctx.lineCap='butt';
  ctx.fillStyle=col;ctx.beginPath();for(const b of list){const x=IX(b),y=IY(b);ctx.rect(x-h,y-h,h*2,h*2);b.rx=x;b.ry=y}ctx.fill();
}
let viewR=0,viewT=0;
function draw(){
  const W=cv.width,H=cv.height;ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=C.arena;ctx.fillRect(0,0,W,H);
  // the view zooms smoothly to fit the spawn ring, which follows your range
  const target=Math.max(CFG.arenaR,spawnRadius()-15),now=performance.now();
  viewR=viewR?viewR+(target-viewR)*Math.min(1,(now-viewT)/300):target;viewT=now;
  const VR=viewR,sc=Math.min(W,H)/(2*VR),ext=Math.max(W,H)/sc/2;ctx.setTransform(sc,0,0,sc,W/2,H/2);
  // distance rings every 100 m (every 200 m once the view is huge), labelled along the crosshair
  ctx.strokeStyle=C.grid;ctx.lineWidth=1.5/sc*Math.min(W,H)/640;const step=VR>1100?200:100;
  ctx.beginPath();for(let r=step;r<=ext;r+=step){ctx.moveTo(r,0);ctx.arc(0,0,r,0,6.283)}ctx.stroke();
  ctx.beginPath();ctx.moveTo(-ext,0);ctx.lineTo(ext,0);ctx.moveTo(0,-ext);ctx.lineTo(0,ext);ctx.stroke();
  ctx.fillStyle=C.mute;ctx.globalAlpha=.7;ctx.font=`500 ${11/sc}px 'Chakra Petch',sans-serif`;ctx.textAlign='left';
  for(let r=step;r<=ext;r+=step)ctx.fillText(r+' m',r+4/sc,-4/sc);ctx.globalAlpha=1;
  const R=run,tr=CFG.towerR;
  if(R){
    ctx.setLineDash([6,8]);ctx.strokeStyle=C.acc;ctx.globalAlpha=.5;ctx.beginPath();ctx.arc(0,0,R.s.range,0,6.283);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
    // healer pulses and shield rings sit under the bodies
    ctx.lineWidth=1.5;
    for(const e of enemies)if(!e.dead&&e.hf>0){ctx.strokeStyle=C[e.d.c];ctx.globalAlpha=e.hf/.4*.6;ctx.beginPath();ctx.arc(IX(e),IY(e),e.d.healR*(1.1-e.hf/.4*.4),0,6.283);ctx.stroke()}
    ctx.globalAlpha=1;
    for(const e of enemies)if(!e.dead&&e.shield>0){ctx.strokeStyle=C.e6;ctx.lineWidth=1+e.shield*.6;ctx.beginPath();ctx.arc(IX(e),IY(e),e.d.sz*1.65,0,6.283);ctx.stroke()}
    // bodies: light fill + solid outline, one batched path per type (later types draw on top, boss last)
    ctx.lineWidth=2;ctx.lineJoin='round';
    for(const t of TYPES){ctx.beginPath();let any=false;for(const e of enemies)if(e.t===t&&!e.dead){shape(e);any=true}
      if(any){const col=C[ET[t].c];ctx.fillStyle=col;ctx.globalAlpha=.3;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=col;ctx.stroke()}}
    ctx.fillStyle=C.hot;
    for(const e of enemies)if(e.d.bar&&!e.dead&&e.hp<e.mhp){const s=e.d.sz;ctx.fillRect(IX(e)-s,IY(e)-s-6,2*s*Math.max(0,e.hp/e.mhp),3)}
    // shots: a streak from where each was last drawn to where it is now, so fast shots glide instead of jumping
    shots(bullets,C.acc,2);shots(ebs,C.e4,2.5);
    ctx.lineCap='round';
    for(const t of tracers){ctx.strokeStyle=t.k===1?C.e4:t.k===3?C.hot:t.k===2?C.gold:C.acc;ctx.globalAlpha=.55*t.l/CFG.tracerLife;ctx.lineWidth=2.5;
      let x0=t.x0,y0=t.y0;const dx=t.x1-x0,dy=t.y1-y0,L=Math.hypot(dx,dy);if(L>CFG.streakMax){x0=t.x1-dx/L*CFG.streakMax;y0=t.y1-dy/L*CFG.streakMax}
      ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(t.x1,t.y1);ctx.stroke()}
    ctx.globalAlpha=1;ctx.lineCap='butt';
    ctx.fillStyle=C.mute;ctx.beginPath();for(const p of parts){const z=3*p.l/.5;ctx.rect(IX(p)-z/2,IY(p)-z/2,z,z)}ctx.fill();
    // tower
    ctx.fillStyle=C.acc;ctx.beginPath();for(let i=0;i<6;i++){const a=i*1.0472+Math.PI/6;i?ctx.lineTo(Math.cos(a)*tr,Math.sin(a)*tr):ctx.moveTo(Math.cos(a)*tr,Math.sin(a)*tr)}ctx.closePath();ctx.fill();
    ctx.fillStyle=C.arena;ctx.beginPath();ctx.arc(0,0,tr*.4,0,6.283);ctx.fill();
    if(R.barMax>0){const f=Math.max(0,R.bar/R.barMax);ctx.strokeStyle=C.barrier;ctx.lineWidth=3;
      ctx.globalAlpha=.2;ctx.beginPath();ctx.arc(0,0,tr+7,0,6.283);ctx.stroke();
      ctx.globalAlpha=.35+.65*f;ctx.beginPath();ctx.arc(0,0,tr+7,-Math.PI/2,-Math.PI/2+6.283*f);ctx.stroke();ctx.globalAlpha=1}
    if(dnums.length){ctx.font="600 11px 'Chakra Petch',sans-serif";ctx.textAlign='center';
      for(const n of dnums){ctx.fillStyle=n.c===2?C.hot:n.c?C.gold:C.ink;ctx.globalAlpha=Math.min(1,n.l*2);ctx.fillText(n.t||(n.b?'block':fmt(n.v)),n.x,n.py+(n.y-n.py)*A)}ctx.globalAlpha=1}
  }else{ctx.fillStyle=C.acc;ctx.beginPath();ctx.arc(0,0,tr,0,6.283);ctx.fill()}
}
