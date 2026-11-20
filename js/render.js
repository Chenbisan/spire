// Spire — canvas rendering. Reads simulation state, never changes it.
// ================= render =================
const cv=$('cv'),ctx=cv.getContext('2d'),stage=$('stage');
let C={},A=1;const IX=o=>o.px+(o.x-o.px)*A,IY=o=>o.py+(o.y-o.py)*A;
function readColors(){const p=$('probe');for(const k of['arena','grid','acc','ink','mute','gold','hot','e1','e2','e3','e4','e5','e6','e7','e8']){p.style.color=`var(--${k})`;C[k]=getComputedStyle(p).color}}
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
function draw(){
  const W=cv.width,H=cv.height;ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=C.arena;ctx.fillRect(0,0,W,H);
  const sc=Math.min(W,H)/(2*CFG.arenaR);ctx.setTransform(sc,0,0,sc,W/2,H/2);
  ctx.strokeStyle=C.grid;ctx.lineWidth=1.5;
  for(let r=80;r<=320;r+=80){ctx.beginPath();ctx.arc(0,0,r,0,6.283);ctx.stroke()}
  ctx.beginPath();ctx.moveTo(-330,0);ctx.lineTo(330,0);ctx.moveTo(0,-330);ctx.lineTo(0,330);ctx.stroke();
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
    ctx.fillStyle=C.acc;ctx.beginPath();for(const b of bullets)ctx.rect(IX(b)-2,IY(b)-2,4,4);ctx.fill();
    ctx.fillStyle=C.e4;ctx.beginPath();for(const b of ebs)ctx.rect(IX(b)-2.5,IY(b)-2.5,5,5);ctx.fill();
    ctx.fillStyle=C.mute;ctx.beginPath();for(const p of parts){const z=3*p.l/.5;ctx.rect(IX(p)-z/2,IY(p)-z/2,z,z)}ctx.fill();
    // tower
    ctx.fillStyle=C.acc;ctx.beginPath();for(let i=0;i<6;i++){const a=i*1.0472+Math.PI/6;i?ctx.lineTo(Math.cos(a)*tr,Math.sin(a)*tr):ctx.moveTo(Math.cos(a)*tr,Math.sin(a)*tr)}ctx.closePath();ctx.fill();
    ctx.fillStyle=C.arena;ctx.beginPath();ctx.arc(0,0,tr*.4,0,6.283);ctx.fill();
    ctx.strokeStyle=C.acc;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,tr+6,-Math.PI/2,-Math.PI/2+6.283*Math.max(0,R.hp/R.s.health));ctx.stroke();
    if(dnums.length){ctx.font="600 11px 'Chakra Petch',sans-serif";ctx.textAlign='center';
      for(const n of dnums){ctx.fillStyle=n.c?C.gold:C.ink;ctx.globalAlpha=Math.min(1,n.l*2);ctx.fillText(n.b?'block':fmt(n.v),n.x,n.py+(n.y-n.py)*A)}ctx.globalAlpha=1}
  }else{ctx.fillStyle=C.acc;ctx.beginPath();ctx.arc(0,0,tr,0,6.283);ctx.fill()}
}
