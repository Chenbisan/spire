// Spire — update banner. Polls the live js/config.js for a newer APP_VERSION and offers a one-click refresh.
// Bumping APP_VERSION is what triggers the banner for players, so bump it with every published change.
const UPD={every:10*60e3,lastCheck:0,v:null,dismissed:null};
const newerVer=(a,b)=>{const x=a.split('.').map(Number),y=b.split('.').map(Number);
  for(let i=0;i<3;i++){const p=x[i]||0,q=y[i]||0;if(p!==q)return p>q}return false};
async function checkUpdate(){
  if(location.protocol==='file:'||Date.now()-UPD.lastCheck<60e3)return; // file:// can't fetch; at most once a minute
  UPD.lastCheck=Date.now();
  try{const r=await fetch('js/config.js?check='+Date.now(),{cache:'no-store'});if(!r.ok)return;
    const m=/APP_VERSION\s*=\s*'([^']+)'/.exec(await r.text());
    if(m&&newerVer(m[1],APP_VERSION)&&m[1]!==UPD.dismissed)showUpdate(m[1])}catch(e){}
}
function showUpdate(v){UPD.v=v;$('updTxt').textContent=`Version ${v} is available`;$('updNew').href=CHANGELOG_URL;$('upd').hidden=false;updRunNote()}
const updRunNote=()=>{if(!$('upd').hidden)TX('updSub',run&&!run.over?'Tap to refresh · ends the current run':'Tap to refresh')};
$('updGo').addEventListener('click',async()=>{
  TX('updSub','Updating…');persist();
  // re-download the page and its files so the reload can't pick up stale cached copies
  const urls=[location.href.split('#')[0],...[...document.scripts].map(s=>s.src),...[...document.querySelectorAll('link[rel=stylesheet]')].map(l=>l.href)]
    .filter(u=>u&&u.startsWith(location.origin));
  await Promise.all(urls.map(u=>fetch(u,{cache:'reload'}).catch(()=>{})));
  location.reload();
});
$('updX').addEventListener('click',()=>{UPD.dismissed=UPD.v;$('upd').hidden=true});
setTimeout(checkUpdate,3000);setInterval(checkUpdate,UPD.every);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkUpdate()});
