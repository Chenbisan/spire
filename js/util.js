// Spire — small shared helpers: DOM lookup, number formatting, toast.
const $=id=>document.getElementById(id);
const SUF=['','K','M','B','T','aa','ab','ac','ad','ae','af','ag'];
function fmt(n){if(!isFinite(n))return'∞';if(n<1000)return n<10?String(+n.toFixed(1)):String(Math.floor(n));let i=0;while(n>=1000&&i<SUF.length-1){n/=1000;i++}return n.toFixed(n<10?2:n<100?1:0)+SUF[i]}
const fv=(s,v)=>s.p?(v*100).toFixed(1).replace(/\.0$/,'')+'%'+(s.u||''):s.x?'×'+v.toFixed(2):s.k==='aspd'?v.toFixed(2)+'/s':fmt(v)+(s.u||'');
const toastEl=$('toast');let toastT;
function toast(m){toastEl.textContent=m;toastEl.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>toastEl.classList.remove('show'),2200)}
