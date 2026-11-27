// Spire — small shared helpers: DOM lookup, number formatting, toast.
const $=id=>document.getElementById(id);
// K, M, B, T, then aa, ab … az, ba … zz (676 more steps, up to 10^2043; doubles end near 10^308)
const SUF=['','K','M','B','T'];for(let a=0;a<26;a++)for(let b=0;b<26;b++)SUF.push(String.fromCharCode(97+a,97+b));
function fmt(n){if(!isFinite(n))return'∞';if(n<1000)return n<10?String(+n.toFixed(1)):String(Math.floor(n));let i=0;while(n>=1000&&i<SUF.length-1){n/=1000;i++}return n.toFixed(n<10?2:n<100?1:0)+SUF[i]}
const mmss=v=>{v=Math.max(0,Math.ceil(v));return Math.floor(v/60)+':'+String(v%60).padStart(2,'0')};
const fv=(s,v)=>s.t?mmss(v):s.p?(v*100).toFixed(1).replace(/\.0$/,'')+'%'+(s.u||''):s.x?'×'+v.toFixed(2):s.k==='aspd'?v.toFixed(2)+'/s':fmt(v)+(s.u||'');
const toastEl=$('toast');let toastT;
function toast(m){toastEl.textContent=m;toastEl.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>toastEl.classList.remove('show'),2200)}
