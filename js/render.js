// Spire — canvas rendering. Reads simulation state, never changes it.
// ================= render =================
const cv=$('cv'),ctx=cv.getContext('2d'),stage=$('stage');
let C={},A=1;const IX=o=>o.px+(o.x-o.px)*A,IY=o=>o.py+(o.y-o.py)*A;
function readColors(){const p=$('probe');for(const k of['arena','grid','acc','ink','mute','gold','hot','e1','e2','e3','e4','e5']){p.style.color=`var(--${k})`;C[k]=getComputedStyle(p).color}}
readColors();
new MutationObserver(readColors).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',readColors);
const ro=new ResizeObserver(()=>{const d=Math.min(2,devicePixelRatio||1);cv.width=Math.round(stage.clientWidth*d);cv.height=Math.round(stage.clientHeight*d)});ro.observe(stage);
const ECOL={basic:'e1',fast:'e2',tank:'e3',ranged:'e4',boss:'e5'};
function shape(e){
  const s=e.d.sz,x=IX(e),y=IY(e);
  switch(e.d.sh){
    case 0:ctx.rect(x-s,y-s,s*2,s*2);break;
    case 1:{const a=Math.atan2(-y,-x);ctx.moveTo(x+Math.cos(a)*s*1.3,y+Math.sin(a)*s*1.3);ctx.lineTo(x+Math.cos(a+2.4)*s,y+Math.sin(a+2.4)*s);ctx.lineTo(x+Math.cos(a-2.4)*s,y+Math.sin(a-2.4)*s);ctx.closePath();break}
    case 2:ctx.moveTo(x,y-s*1.2);ctx.lineTo(x+s,y);ctx.lineTo(x,y+s*1.2);ctx.lineTo(x-s,y);ctx.closePath();break;
    case 3:for(let i=0;i<6;i++){const a=i*1.0472+run.time*.5;i?ctx.lineTo(x+Math.cos(a)*s,y+Math.sin(a)*s):ctx.moveTo(x+Math.cos(a)*s,y+Math.sin(a)*s)}ctx.closePath();break;
  }
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
    for(const t of TYPES){ctx.beginPath();let any=false;for(const e of enemies)if(e.t===t&&!e.dead){shape(e);any=true}if(any){ctx.fillStyle=C[ECOL[t]];ctx.fill()}}
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
      for(const n of dnums){ctx.fillStyle=n.c?C.gold:C.ink;ctx.globalAlpha=Math.min(1,n.l*2);ctx.fillText(fmt(n.v),n.x,n.py+(n.y-n.py)*A)}ctx.globalAlpha=1}
  }else{ctx.fillStyle=C.acc;ctx.beginPath();ctx.arc(0,0,tr,0,6.283);ctx.fill()}
}
