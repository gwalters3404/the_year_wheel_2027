const TYPES=[["h","Holidays"],["e","Events"],["i","Industry"],["o","Observances"],["b","Births"],["d","Deaths"]];
const TN=Object.fromEntries(TYPES);
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONL=["January","February","March","April","May","June","July","August","September","October","November","December"];
const DIM=[31,28,31,30,31,30,31,31,30,31,30,31];
const MSTART=DIM.reduce((a,d,i)=>(a.push(i?a[i-1]+DIM[i-1]:0),a),[]);
const WD=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function doy(iso){ if(!iso) return null; const y=+iso.slice(0,4),m=+iso.slice(5,7)-1,d=+iso.slice(8,10);
  if(y<2027) return 0; if(y>2027) return 364; return MSTART[m]+d-1; }
function md(d){ let m=11; while(MSTART[m]>d) m--; return [m,d-MSTART[m]+1]; }
function wday(d){ return (5+d)%7; } // Jan 1, 2027 is a Friday
function label(d){ const [m,day]=md(d); return MON[m]+" "+day; }
function range(it){ if(it.s==null) return ""; if(it.e==null||it.e===it.s) return label(it.s);
  const f=x=>{const m=+x.slice(5,7)-1,d=+x.slice(8,10),y=x.slice(0,4);return MON[m]+" "+d+(y!=="2027"?", "+y:"");}; return f(it.rs)+" to "+f(it.re); }
let ITEMS=[];
function loadData(){ return fetch("data.json").then(r=>r.json()).then(rows=>{
  ITEMS=rows.map(r=>{ const it={t:r[0],n:r[1],rs:r[2],re:r[3],c:r[4],l:r[5],st:r[6],x:r[7],u:r[8],y:r[9]};
    it.s=doy(r[2]); it.e=r[3]?doy(r[3]):null; if(it.s==null&&it.e!=null){ it.s=it.e; it.rs=it.re; }
    if(it.e!=null&&it.e<it.s) it.e=it.s; it.hay=(r[1]+" "+r[4]+" "+r[5]).toLowerCase(); return it; });
  return ITEMS; }); }
function buildIndex(pass){
  const byDay=Array.from({length:365},()=>[]), running=Array.from({length:365},()=>[]), undated=[]; let matched=0;
  for(const it of ITEMS){ if(!pass(it)) continue; matched++;
    if(it.s==null){ undated.push(it); continue; }
    const e=it.e==null?it.s:it.e;
    if(it.t==="o"&&e>it.s){ byDay[it.s].push(it); for(let d=it.s+1;d<=e;d++) running[d].push(it); }
    else for(let d=it.s;d<=e;d++) byDay[d].push(it); }
  return {byDay,running,undated,matched}; }
function pill(it){ if(!it.st) return "";
  const cls=it.st==="Confirmed"||it.st==="Listed"?"ok":(it.st==="Estimated"||it.st==="TBD"?"warn":"");
  return `<span class="pill ${cls}" title="${esc(it.x||"")}">${esc(it.st)}</span>`; }
function li(it,showDate){
  const name=it.u?`<a href="${esc(it.u)}" target="_blank" rel="noopener">${esc(it.n)}</a>`:esc(it.n);
  const bits=[]; if(showDate||(it.e!=null&&it.e!==it.s)){ const r=range(it); if(r) bits.push(r); }
  if(it.l) bits.push(it.l); if(it.c) bits.push(it.c);
  let extra=""; if(((it.st==="Estimated"||it.st==="Not held in 2027")&&it.x)||(it.t==="h"&&it.x&&it.x!=="Fixed date")) extra=`<div class="meta">${esc(it.x)}</div>`;
  return `<li><div><div class="nm">${name}</div><div class="meta">${esc(bits.join(" · "))}</div>${extra}</div>${pill(it)}</li>`; }
function people(list,t){ return `<div class="people">`+list.map(it=>{
    const yrs=it.y?` <small>${t==="b"?"turns "+it.y:it.y+" yrs ago"}</small>`:"";
    const inner=esc(it.n)+(it.c?` <small>${esc(it.c)}</small>`:"")+yrs;
    return it.u?`<a href="${esc(it.u)}" target="_blank" rel="noopener">${inner}</a>`:`<span>${inner}</span>`;}).join("")+`</div>`; }
function section(k,title,html){ return `<div class="sec"><h3 style="--c:var(--${k})"><span class="dot"></span>${title}</h3>${html}</div>`; }
function dayTitle(d){ const [m,day]=md(d); return WD[wday(d)]+", "+MONL[m]+" "+day; }
function dayHTML(d,idx){ const list=idx.byDay[d]; let h="";
  for(const [k,n] of TYPES){ const sub=list.filter(x=>x.t===k); if(!sub.length) continue;
    h+=(k==="b"||k==="d")?section(k,n+" ("+sub.length+")",people(sub,k)):section(k,n+" ("+sub.length+")",`<ul class="items">${sub.map(x=>li(x,false)).join("")}</ul>`); }
  const run=idx.running[d];
  if(run.length) h+=`<div class="sec"><details><summary>${run.length} week- and month-long observances also running</summary><ul class="items">${run.map(x=>li(x,true)).join("")}</ul></details></div>`;
  return h||'<p class="empty-note">Nothing matches the current filters on this day.</p>'; }
function searchHTML(pass){ const res=ITEMS.filter(pass).sort((a,b)=>(a.s==null?999:a.s)-(b.s==null?999:b.s));
  const body=res.length?`<ul class="items">`+res.slice(0,300).map(it=>{
    const tag=`<span class="meta" style="color:var(--${it.t})">${TN[it.t]}</span>`;
    const go=it.s!=null?` · <a href="#" data-go="${it.s}">open ${label(it.s)}</a>`:"";
    const name=it.u?`<a href="${esc(it.u)}" target="_blank" rel="noopener">${esc(it.n)}</a>`:esc(it.n);
    const bits=[range(it)||"No date yet",it.l,it.c].filter(Boolean).join(" · ");
    return `<li><div><div class="nm">${name}</div><div class="meta">${tag} · ${esc(bits)}${go}</div></div>${pill(it)}</li>`;}).join("")+`</ul>`
    :'<p class="empty-note">No matches. Try a shorter word.</p>';
  return {count:res.length,html:body}; }
function chipsHTML(types){ const counts={}; for(const it of ITEMS) counts[it.t]=(counts[it.t]||0)+1;
  return TYPES.map(([k,n])=>`<button class="chip" style="--c:var(--${k})" data-t="${k}" aria-pressed="${types.has(k)}"><span class="dot"></span>${n} <span class="n">${(counts[k]||0).toLocaleString()}</span></button>`).join(""); }
function todayDoy(){ const now=new Date(); return MSTART[now.getMonth()]+Math.min(now.getDate(),DIM[now.getMonth()])-1; }
function hashDay(){ const m=/^#d-(\d\d)-(\d\d)$/.exec(location.hash); if(!m) return null; const mo=+m[1]-1,d=+m[2];
  if(mo<0||mo>11||d<1||d>DIM[mo]) return null; return MSTART[mo]+d-1; }
function setHash(d){ const [m,day]=md(d); try{ history.replaceState(null,"","#d-"+String(m+1).padStart(2,"0")+"-"+String(day).padStart(2,"0")); }catch(e){} }
