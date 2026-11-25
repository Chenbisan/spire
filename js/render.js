// Spire — canvas rendering. Reads simulation state; only writes render-only fields (shot rx/ry = last drawn position).
// ================= render =================
const cv=$('cv'),ctx=cv.getContext('2d'),stage=$('stage');
let C={},A=1;const IX=o=>o.px+(o.x-o.px)*A,IY=o=>o.py+(o.y-o.py)*A;
let SPR={},sprKey='',colorVer=0;
function readColors(){const p=$('probe');for(const k of['arena','grid','acc','ink','mute','gold','hot','e1','e2','e3','e4','e5','e6','e7','e8','e9','e10','barrier','bolt','alloy','shard','chip','fire']){p.style.color=`var(--${k})`;C[k]=getComputedStyle(p).color}colorVer++;}
// ---- enemy sprites: each type × health band (× facing, for types that turn) is pre-drawn once per zoom level, then stamped ----
const SPR_ROT=16;
function sprite(t,b,rot,d=ET[t]){const k=t+d.sz+'_'+b+'_'+rot;let s=SPR[k];if(s)return s; // keyed by size too (smaller Splitters)
  const P=SHAPES[d.sh],sc=sprSc,half=Math.ceil((d.sz*1.4+2)*sc)+1,cv2=document.createElement('canvas');cv2.width=cv2.height=half*2;
  const g=cv2.getContext('2d'),col=C[d.c],r=rot*Math.PI*2/SPR_ROT,c=Math.cos(r)*d.sz,n=Math.sin(r)*d.sz;
  g.setTransform(sc,0,0,sc,half,half);g.beginPath();g.moveTo(P[0][0]*c-P[0][1]*n,P[0][0]*n+P[0][1]*c);for(let i=1;i<P.length;i++)g.lineTo(P[i][0]*c-P[i][1]*n,P[i][0]*n+P[i][1]*c);g.closePath();
  g.fillStyle=col;g.globalAlpha=CFG.hpFill[b];g.fill();g.globalAlpha=1;g.strokeStyle=col;g.lineWidth=2;g.lineJoin='round';g.stroke();
  return SPR[k]={cv:cv2,half}}
let sprSc=1;
readColors();
new MutationObserver(readColors).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',readColors);
const ro=new ResizeObserver(()=>{const d=Math.min(2,devicePixelRatio||1);cv.width=Math.round(stage.clientWidth*d);cv.height=Math.round(stage.clientHeight*d)});ro.observe(stage);
function shape(e,T=ctx){ // T: the canvas context, or a Path2D to collect into
  const d=e.d,P=SHAPES[d.sh],s=d.sz,x=IX(e),y=IY(e),r=d.rot==='face'?Math.atan2(-y,-x):d.rot==='spin'?run.time*.5:0;
  const c=Math.cos(r)*s,n=Math.sin(r)*s;
  T.moveTo(x+P[0][0]*c-P[0][1]*n,y+P[0][0]*n+P[0][1]*c);
  for(let i=1;i<P.length;i++)T.lineTo(x+P[i][0]*c-P[i][1]*n,y+P[i][0]*n+P[i][1]*c);
  T.closePath();
}
function shots(list,col,h){
  if(!list.length)return;
  ctx.strokeStyle=col;ctx.globalAlpha=.45;ctx.lineWidth=h;ctx.lineCap='round';ctx.beginPath();
  for(const b of list){const x=IX(b),y=IY(b);let x0=b.rx,y0=b.ry;const dx=x-x0,dy=y-y0,L=Math.hypot(dx,dy);
    if(L>CFG.streakMax){x0=x-dx/L*CFG.streakMax;y0=y-dy/L*CFG.streakMax}if(L>.5){ctx.moveTo(x0,y0);ctx.lineTo(x,y)}}
  ctx.stroke();ctx.globalAlpha=1;ctx.lineCap='butt';
  ctx.fillStyle=col;ctx.beginPath();for(const b of list){const x=IX(b),y=IY(b);ctx.rect(x-h,y-h,h*2,h*2);b.rx=x;b.ry=y}ctx.fill();
}
// clean effects: at high game speed, show steady targeting beams and hit flashes instead of strobing shots
const cleanFx=()=>save.set.fx==='clean'||(save.set.fx!=='full'&&save.set.speed>=CFG.cleanFxAt);
let viewR=0,viewT=0;
function draw(){
  const W=cv.width,H=cv.height;ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=C.arena;ctx.fillRect(0,0,W,H);
  // the view zooms smoothly to fit the spawn ring, which follows your range
  const [v0,v1,vAt]=CFG.viewRatio,rg=run&&run.s?run.s.range:0,vk=Math.max(0,Math.min(1,(rg-SK.range.base)/(vAt-SK.range.base)));
  const target=Math.max(CFG.arenaR,rg*(v0+(v1-v0)*vk)),now=performance.now();
  viewR=viewR?viewR+(target-viewR)*Math.min(1,(now-viewT)/300):target;viewT=now;
  const VR=viewR,sc=Math.min(W,H)/(2*VR),ext=Math.max(W,H)/sc/2;VIEW.hx=W/2/sc;VIEW.hy=H/2/sc;ctx.setTransform(sc,0,0,sc,W/2,H/2);
  // distance rings every 100 m (wider apart when zoomed far out or on small screens), labelled along the crosshair
  ctx.strokeStyle=C.grid;ctx.lineWidth=1.5/sc*Math.min(W,H)/640;const dpr=W/(stage.clientWidth||W),step=[100,200,500,1000,2000,5000].find(st=>st*sc/dpr>=48)||10000; // keep ≥48 screen px between rings
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
    ctx.strokeStyle=C.e6;ctx.lineWidth=2;ctx.beginPath();for(const e of enemies)if(!e.dead&&e.shield>0){const x=IX(e),y=IY(e),r=e.d.sz*1.65;ctx.moveTo(x+r,y);ctx.arc(x,y,r,0,6.283)}ctx.stroke();
    // bodies: the fill shows health (solid at full, emptying to just the outline), in 4 bands, batched per type and band;
    // then one outline path per type (later types draw on top, boss last). No per-enemy health bars.
    ctx.lineWidth=2;ctx.lineJoin='round';const HF=CFG.hpFill,band=e=>{const f=e.hp/e.mhp;return f>.75?0:f>.5?1:f>.25?2:3};
    // stamp pre-drawn sprites (rebuilt when the zoom or theme changes); the spinning boss is still drawn as a path
    {const q=Math.round(Math.log2(sc)*8),key=q+'|'+colorVer;if(key!==sprKey){sprKey=key;SPR={};sprSc=2**(q/8)} // scale in ~9% steps so the smooth zoom doesn't redraw sprites every frame
      for(const t of TYPES){const d=ET[t];
        if(d.rot==='spin'){const col=C[d.c];ctx.fillStyle=col;ctx.strokeStyle=col;for(const e of enemies)if(e.t===t&&!e.dead&&e.age>=CFG.fadeIn){ctx.beginPath();shape(e);ctx.globalAlpha=HF[band(e)];ctx.fill();ctx.globalAlpha=1;ctx.stroke()}continue}
        for(const e of enemies){if(e.t!==t||e.dead||e.age<CFG.fadeIn)continue;const x=IX(e),y=IY(e);
          const rot=d.rot==='face'?((Math.round(Math.atan2(-y,-x)/(Math.PI*2)*SPR_ROT)%SPR_ROT)+SPR_ROT)%SPR_ROT:0,sp=sprite(t,band(e),rot,e.d),h=sp.half/sprSc;
          ctx.drawImage(sp.cv,x-h,y-h,h*2,h*2)}}}
    for(const e of enemies)if(!e.dead&&e.age<CFG.fadeIn){const col=C[e.d.c],f=e.age/CFG.fadeIn;ctx.beginPath();shape(e);ctx.fillStyle=col;ctx.globalAlpha=HF[band(e)]*f;ctx.fill();ctx.globalAlpha=f;ctx.strokeStyle=col;ctx.stroke()}ctx.globalAlpha=1;
    // shots: a streak from where each was last drawn to where it is now, so fast shots glide instead of jumping
    const clean=cleanFx();
    if(clean){ // one faint, steady line per enemy being shot at
      // a short stub off each enemy being shot at, pointing back at the spire; held for beamHold real ms after each shot
      const now=performance.now(),bl=viewR*CFG.beamLen;ctx.strokeStyle=C.acc;ctx.globalAlpha=.6;ctx.lineWidth=2;ctx.lineCap='round';ctx.beginPath();
      for(const e of enemies)if(!e.dead&&now-(e.shotAt||0)<CFG.beamHold){const x=IX(e),y=IY(e),d=Math.hypot(x,y)||1,s0=e.d.sz*1.2,s1=Math.min(d-CFG.towerR,s0+bl);
        if(s1>s0){ctx.moveTo(x-x/d*s0,y-y/d*s0);ctx.lineTo(x-x/d*s1,y-y/d*s1)}}ctx.stroke();ctx.globalAlpha=1;ctx.lineCap='butt';
      ctx.fillStyle=C.e4;ctx.beginPath();for(const b of ebs){const x=IX(b),y=IY(b);ctx.rect(x-2.5,y-2.5,5,5);b.rx=x;b.ry=y}ctx.fill();
    }else{shots(bullets,C.acc,2);shots(ebs,C.e4,2.5)}
    ctx.lineCap='round';
    if(!clean)for(const t of tracers){ctx.strokeStyle=t.k===1?C.e4:t.k===3?C.hot:t.k===2?C.gold:C.acc;ctx.globalAlpha=.55*t.l/CFG.tracerLife;ctx.lineWidth=2.5;
      let x0=t.x0,y0=t.y0;const dx=t.x1-x0,dy=t.y1-y0,L=Math.hypot(dx,dy);if(L>CFG.streakMax){x0=t.x1-dx/L*CFG.streakMax;y0=t.y1-dy/L*CFG.streakMax}
      ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(t.x1,t.y1);ctx.stroke()}
    ctx.globalAlpha=1;ctx.lineCap='butt';
    // hit flash: hit enemies light up solid in their colour (real time, so it reads the same at any speed); one path per type
    {const now=performance.now();ctx.strokeStyle=C.ink;ctx.lineWidth=2.5;
      for(const t of TYPES){ctx.beginPath();let any=false;for(const e of enemies)if(e.t===t&&!e.dead&&now-(e.hitAt||0)<CFG.hitFlash){shape(e);any=true}
        if(any){ctx.fillStyle=C[ET[t].c];ctx.globalAlpha=.8;ctx.fill();ctx.globalAlpha=.9;ctx.stroke()}}ctx.globalAlpha=1}
    ctx.fillStyle=C.mute;ctx.beginPath();for(const p of parts){const z=3*p.l/.5;ctx.rect(IX(p)-z/2,IY(p)-z/2,z,z)}ctx.fill();
    // tower
    ctx.fillStyle=C.acc;ctx.beginPath();for(let i=0;i<6;i++){const a=i*1.0472+Math.PI/6;i?ctx.lineTo(Math.cos(a)*tr,Math.sin(a)*tr):ctx.moveTo(Math.cos(a)*tr,Math.sin(a)*tr)}ctx.closePath();ctx.fill();
    ctx.fillStyle=C.arena;ctx.beginPath();ctx.arc(0,0,tr*.4,0,6.283);ctx.fill();
    if(R.barMax>0){const f=Math.max(0,R.bar/R.barMax);ctx.strokeStyle=C.barrier;ctx.lineWidth=3;
      ctx.globalAlpha=.2;ctx.beginPath();ctx.arc(0,0,tr+7,0,6.283);ctx.stroke();
      if(R.barT>0){const k=1-R.barT/R.s.barrierRegen;ctx.setLineDash([3,4]);ctx.globalAlpha=.5;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,tr+7,-Math.PI/2,-Math.PI/2+6.283*k);ctx.stroke();ctx.setLineDash([])} // broken: dashed recharge arc
      else{ctx.globalAlpha=.35+.65*f;ctx.beginPath();ctx.arc(0,0,tr+7,-Math.PI/2,-Math.PI/2+6.283*f);ctx.stroke()}ctx.globalAlpha=1}
    drawUlts(sc,W);
    // Second Wind: pulsing shield and countdown while invincible
    if(R.invT>0){const dpr=W/(stage.clientWidth||W),pz=.5+.5*Math.sin(performance.now()/160);ctx.strokeStyle=C.ink;ctx.lineWidth=3*dpr/sc;
      ctx.globalAlpha=.35+.35*pz;ctx.beginPath();ctx.arc(0,0,tr+12*dpr/sc,0,6.283);ctx.stroke();ctx.globalAlpha=.9;ctx.fillStyle=C.ink;
      ctx.font=`600 ${12*dpr/sc}px 'Chakra Petch',sans-serif`;ctx.textAlign='center';ctx.fillText(`INVINCIBLE ${Math.ceil(R.invT)}s`,0,tr+30*dpr/sc);ctx.globalAlpha=1}
    // death defied: gold shockwave, gold spire, big DEFIED (real time, any speed)
    {const k=(performance.now()-(R.defyAt||-1e9))/CFG.defyFx;if(k<1){const dpr=W/(stage.clientWidth||W);ctx.strokeStyle=C.gold;ctx.fillStyle=C.gold;
      ctx.globalAlpha=(1-k)*.9;ctx.lineWidth=4*dpr/sc;ctx.beginPath();ctx.arc(0,0,tr+8+k*viewR*.35,0,6.283);ctx.stroke();
      ctx.globalAlpha=(1-k)*.85;ctx.beginPath();for(let i=0;i<6;i++){const a=i*1.0472+Math.PI/6;i?ctx.lineTo(Math.cos(a)*tr,Math.sin(a)*tr):ctx.moveTo(Math.cos(a)*tr,Math.sin(a)*tr)}ctx.closePath();ctx.fill();
      ctx.globalAlpha=Math.min(1,(1-k)*2);ctx.font=`700 ${20*dpr/sc}px 'Chakra Petch',sans-serif`;ctx.textAlign='center';ctx.fillText('DEFIED',0,-tr-(14+k*26)*dpr/sc);ctx.globalAlpha=1}}
    if(dnums.length){ctx.font="600 11px 'Chakra Petch',sans-serif";ctx.textAlign='center';
      for(const n of dnums){ctx.fillStyle=n.c===2?C.hot:n.c?C.gold:C.ink;ctx.globalAlpha=Math.min(1,n.l*2);ctx.fillText(n.t||(n.b?'block':fmt(n.v)),n.x,n.py+(n.y-n.py)*A)}ctx.globalAlpha=1}
  }else{ctx.fillStyle=C.acc;ctx.beginPath();ctx.arc(0,0,tr,0,6.283);ctx.fill()}
}
