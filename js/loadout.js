// Spire — Cards and Modules: their combined effects, and the two side-panel tabs.
// Data (CARDS, MODS, prices, drops) lives in config.js.
const cardLv=k=>save.cards[k]||0, modLv=k=>save.mods[k]||0;
const modRarity=l=>Math.min(RARITY.length-1,Math.floor((Math.max(1,l)-1)/MOD.per));
const modMain=(m,l)=>m.mul?`+${PC(m.per*l)} ${m.st==='aspd'?'attack speed':SK[m.st].n.toLowerCase()}`:m.st==='crit'?`+${(m.per*l*100).toFixed(1)}% crit chance`:`+${fmt(m.per*l)} ${SK[m.st].n.toLowerCase()}`;
const modCost=l=>MOD.cost(l)*(l%MOD.per===0?MOD.ascend:1); // l → l+1; crossing into a new rarity costs more
function loadoutFx(){
  const F={mul:{},add:{},slowAura:0,slowHit:0,revive:0,rush:0,eliteDmg:0,multi:0,interest:0,drop:0};
  for(const s of ST){F.mul[s.k]=1;F.add[s.k]=0}
  for(const k of save.cardEq){const c=CK[k],l=cardLv(k);if(c&&l)c.fx(F,c.v[l-1])}
  for(const sl of MOD_SLOTS){const m=MK[save.modEq[sl.k]],l=m&&modLv(m.k);if(!l)continue;
    if(m.mul)F.mul[m.st]*=1+m.per*l;else F.add[m.st]+=m.per*l;m.fx(F,m.sp[modRarity(l)])}
  return F;
}
const stars=l=>'★'.repeat(l)+'☆'.repeat(5-l);
function cardsHtml(){
  const used=save.cardEq.length,next=CARD.slotCost[save.cardSlots-CARD.slots0];
  let h=`<p class="note">Cards are perks you buy with <b class="chip">chips</b>, which bosses drop. Equip up to ${save.cardSlots} at a time and level each one to 5 stars. Changes apply right away, mid-run too.</p>
  <div class="lhead"><span>Chips <b class="chip">${fmt(save.chips)}</b></span><span>Slots <b>${used} / ${save.cardSlots}</b></span>${next!=null?`<button class="chip" data-cslot ${save.chips>=next?'':'disabled'}>+1 slot · ${fmt(next)}</button>`:''}</div>`;
  const row=c=>{const l=cardLv(c.k),eq=save.cardEq.includes(c.k),mx=l>=5,cost=l?CARD.up[l-1]:CARD.buy;
    const v=!l?c.f(c.v[0]):mx?c.f(c.v[4]):`${c.f(c.v[l-1])} → ${c.f(c.v[l])}`;
    return`<div class="row lrow${eq?' eq':''}"><div><b>${c.n}</b> <span class="stars">${l?stars(l):''}</span><span class="v">${v}</span></div><div class="lbtns">
      ${mx?'<button class="buy" disabled>Max</button>':`<button class="buy chip" data-cbuy="${c.k}" ${save.chips>=cost?'':'disabled'}>${l?'<span class="q">★</span>':'Buy '}${fmt(cost)}</button>`}
      ${l?`<button data-ceq="${c.k}" class="${eq?'on':''}" ${!eq&&used>=save.cardSlots?'disabled':''}>${eq?'Equipped':'Equip'}</button>`:''}</div></div>`};
  const eq=CARDS.filter(c=>save.cardEq.includes(c.k)),rest=CARDS.filter(c=>!save.cardEq.includes(c.k));
  return h+(eq.length?`<div class="gh">Equipped</div>${eq.map(row).join('')}`:'')+`<div class="gh">${eq.length?'Other cards':'All cards'}</div>${rest.map(row).join('')}`;
}
function modsHtml(){
  let h=`<p class="note">Modules are gear for the spire, bought and levelled with <b class="alloy">alloy</b>, which elites drop. One per slot. Every ${MOD.per} levels a module ranks up (${RARITY.join(' → ')}), making its special effect stronger.</p>
  <div class="lhead"><span>Alloy <b class="alloy">${fmt(save.alloy)}</b></span></div>`;
  for(const sl of MOD_SLOTS){const cur=MK[save.modEq[sl.k]];
    h+=`<div class="gh ghx"><span>${sl.n}</span><span class="note" style="margin:0">${cur&&modLv(cur.k)?cur.n:'empty'}</span></div>`;
    for(const m of MODS.filter(x=>x.s===sl.k)){const l=modLv(m.k),r=modRarity(l),mx=l>=MOD.max,cost=l?modCost(l):MOD.buy,eq=save.modEq[sl.k]===m.k&&l>0;
      const asc=l&&l%MOD.per===0&&!mx;
      h+=`<div class="row lrow${eq?' eq':''}"><div><b>${m.n}</b> ${l?`<span class="rar r${r}">${RARITY[r]}</span> <span class="v" style="display:inline">Lv ${l}/${MOD.max}</span>`:''}
        <span class="v">${l?(mx?modMain(m,l):`${modMain(m,l)} → ${modMain(m,l+1).replace(/^\+/,'+')}`):modMain(m,1)+' at Lv 1'}</span>
        <span class="v sp">${m.sf(m.sp[r])}${!mx&&r<RARITY.length-1?` <span class="nx">(${RARITY[r+1]}: ${m.sf(m.sp[r+1])})</span>`:''}</span></div><div class="lbtns">
        ${mx?'<button class="buy" disabled>Max</button>':`<button class="buy alloy" data-mbuy="${m.k}" ${save.alloy>=cost?'':'disabled'}>${!l?'Buy ':asc?'Rank up ':'<span class="q">+1</span>'}${fmt(cost)}</button>`}
        ${l?`<button data-meq="${m.k}" class="${eq?'on':''}">${eq?'Equipped':'Equip'}</button>`:''}</div></div>`}}
  return h;
}
// affordability changes as chips/alloy drop mid-run; rebuild the tab when it does
let loSig='';
function refreshLoadout(){if(ui.tab!=='Cards'&&ui.tab!=='Modules')return;const P=$('panel');
  const sig=ui.tab+'|'+[CARD.buy,...CARD.up,...CARD.slotCost].filter(c=>save.chips>=c).length+'|'+MODS.map(m=>{const l=modLv(m.k);return save.alloy>=(l?modCost(l):MOD.buy)?1:0}).join('');
  if(sig===loSig)return;loSig=sig;const y=P.scrollTop;P.innerHTML=ui.tab==='Cards'?cardsHtml():modsHtml();P.scrollTop=y}
function loadoutChanged(){persist();if(run&&!run.over)recalc();loSig='';refreshLoadout()}
$('panel').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;
  if(d.cbuy){const k=d.cbuy,l=cardLv(k),c=l?CARD.up[l-1]:CARD.buy;if(l>=5||save.chips<c)return;save.chips-=c;save.stats.chipsSpent=(save.stats.chipsSpent||0)+c;save.cards[k]=l+1;
    if(!l&&save.cardEq.length<save.cardSlots)save.cardEq.push(k);loadoutChanged()}
  else if(d.ceq){const k=d.ceq,i=save.cardEq.indexOf(k);if(i>=0)save.cardEq.splice(i,1);else if(save.cardEq.length<save.cardSlots)save.cardEq.push(k);loadoutChanged()}
  else if('cslot' in d){const c=CARD.slotCost[save.cardSlots-CARD.slots0];if(c==null||save.chips<c)return;save.chips-=c;save.cardSlots++;loadoutChanged()}
  else if(d.mbuy){const m=MK[d.mbuy],l=modLv(m.k),c=l?modCost(l):MOD.buy;if(l>=MOD.max||save.alloy<c)return;save.alloy-=c;save.stats.alloySpent=(save.stats.alloySpent||0)+c;save.mods[m.k]=l+1;
    if(!l&&!modLv(save.modEq[m.s]||''))save.modEq[m.s]=m.k;loadoutChanged()}
  else if(d.meq){const m=MK[d.meq];save.modEq[m.s]=save.modEq[m.s]===m.k?null:m.k;loadoutChanged()}
});
