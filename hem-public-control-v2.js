(() => {
  "use strict";
  const PROJECT="hem-platform";
  const BASE="https://firestore.googleapis.com/v1/projects/"+PROJECT+"/databases/(default)/documents/";
  const SITE_KEY="hemafrica.com";
  const STATUS_PATH="/status.html";
  const cache={};
  function value(v){
    if(!v)return null;
    if("stringValue"in v)return v.stringValue;
    if("booleanValue"in v)return v.booleanValue;
    if("integerValue"in v)return Number(v.integerValue);
    if("doubleValue"in v)return Number(v.doubleValue);
    if("timestampValue"in v)return v.timestampValue;
    if("nullValue"in v)return null;
    if("arrayValue"in v)return (v.arrayValue.values||[]).map(value);
    if("mapValue"in v){const o={};for(const[k,x]of Object.entries(v.mapValue.fields||{}))o[k]=value(x);return o;}
    return null;
  }
  function docToObject(d){const o={};for(const[k,v]of Object.entries(d?.fields||{}))o[k]=value(v);return o;}
  async function getDoc(collection,id){
    const key=collection+"/"+id;
    const r=await fetch(BASE+encodeURIComponent(collection)+"/"+encodeURIComponent(id),{cache:"no-store"});
    if(r.status===404){cache[key]=null;return null;}
    if(!r.ok)throw new Error("Public HEM control unavailable");
    const d=await r.json();const out={id, ...docToObject(d)};cache[key]=out;return out;
  }
  function pageMatch(pattern){
    const p=String(pattern||"*").trim(), path=location.pathname;
    if(p==="*"||p==="")return true;
    if(p.endsWith("*"))return path.startsWith(p.slice(0,-1));
    return path===p;
  }
  function inWindow(p){
    const now=Date.now();
    if(p.startAt&&!Number.isNaN(Date.parse(p.startAt))&&now<Date.parse(p.startAt))return false;
    if(p.endAt&&!Number.isNaN(Date.parse(p.endAt))&&now>Date.parse(p.endAt))return false;
    return true;
  }
  function clearNode(id){document.getElementById(id)?.remove();}
  function showControl(control){
    clearNode("hem-public-control");
    if(!control||((control.enabled!==false)&&(control.mode||"normal")==="normal"))return;
    const overlay=document.createElement("div");overlay.id="hem-public-control";
    overlay.innerHTML=`<div class="hem-control-card"><div class="hem-control-mark">H.E.M</div><span class="hem-control-label">${control.mode==="offline"?"SERVICE INTERRUPTION":"HEM AFRICA GROUP UPDATE"}</span><h1>${escapeHtml(control.title||"HEM Africa Group is temporarily unavailable")}</h1><p>${escapeHtml(control.message||"We are experiencing some issues. Our team is working to restore service.")}</p><div class="hem-control-details">${escapeHtml(control.details||"We apologise for the interruption. Please check the status page for updates.")}</div><a href="/status.html">View system status</a></div>`;
    document.body.appendChild(overlay);
  }
  function escapeHtml(s){return String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
  function safeUrl(url){
    try{const u=new URL(url,location.origin);return["http:","https:"].includes(u.protocol)?u.href:"#";}catch{return"#";}
  }
  function showPopup(p){
    if(!p.active||!inWindow(p)||!(p.pages||["*"]).some(pageMatch))return;
    const seenKey="hem_campaign_seen_"+p.id;
    if(sessionStorage.getItem(seenKey))return;
    sessionStorage.setItem(seenKey,"1");
    const wrap=document.createElement("div");wrap.id="hem-popup-"+p.id;wrap.className="hem-public-popup";
    const close=document.createElement("button");close.className="hem-popup-close";close.type="button";close.textContent="×";close.setAttribute("aria-label","Close announcement");
    const frame=document.createElement("iframe");frame.className="hem-popup-frame";frame.setAttribute("title",p.name||"HEM announcement");frame.setAttribute("sandbox","allow-scripts allow-forms allow-popups allow-modals");
    let html=String(p.html||"");
    if(p.ctaLabel&&p.ctaUrl&&!/<a\b[^>]*>/i.test(html))html+=`<p style="margin-top:18px"><a href="${safeUrl(p.ctaUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:11px 16px;background:#003399;color:#fff;border-radius:10px;text-decoration:none;font-weight:800">${escapeHtml(p.ctaLabel)}</a></p>`;
    const js=String(p.javascript||"").replaceAll("</script>","<\\/script>");
    frame.srcdoc=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:transparent}body{min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box}${p.css||""}</style></head><body>${html}<script>${js}</script></body></html>`;
    wrap.append(close,frame);document.body.appendChild(wrap);
    close.onclick=()=>{wrap.remove();sessionStorage.setItem(seenKey,"1");};
    frame.addEventListener("load",()=>{try{frame.contentWindow?.focus();}catch{}});
  }
  function renderStatus(site,global,control){
    if(!location.pathname.endsWith(STATUS_PATH))return;
    const root=document.getElementById("hem-live-status");if(!root)return;const staticHero=document.querySelector(".status-hero");if(staticHero)staticHero.style.display="none";
    const c=control||{enabled:true,mode:"normal"};
    const state=c.enabled===false||c.mode==="offline"?"Service interruption":c.mode==="incident"?"Incident in progress":c.mode==="notice"?"Service notice":"All systems operational";
    root.innerHTML=`<div class="hem-status-live"><span class="hem-status-dot ${state==="All systems operational"?"ok":"attention"}"></span><div><b>LIVE PUBLIC STATUS</b><h2>${escapeHtml(state)}</h2><p>${escapeHtml(c.message||"No active public incident has been posted.")}</p>${c.details?`<div class="hem-status-details">${escapeHtml(c.details)}</div>`:""}<small>Last control update: ${escapeHtml(c.updatedAt?new Date(c.updatedAt).toLocaleString():"recently")}</small></div></div>`;
  }
  function ensureStyles(){if(document.getElementById("hem-public-control-css"))return;const l=document.createElement("link");l.id="hem-public-control-css";l.rel="stylesheet";l.href="/hem-public-control.css";document.head.appendChild(l);}
  async function boot(){
    ensureStyles();
    try{
      const [global,site,popDoc]=await Promise.all([getDoc("public_site_control","global"),getDoc("public_site_control",SITE_KEY),getDoc("public_popups","hem-main")]);
      const control=(global&&((global.enabled===false)||(global.mode&&global.mode!=="normal")))?global:site;
      if(!location.pathname.endsWith(STATUS_PATH))showControl(control);
      renderStatus(site,global,control);
      if(!control||((control.enabled!==false)&&(control.mode||"normal")==="normal")){
        const popups=Array.isArray(popDoc?.popups)?popDoc.popups:[];
        popups.filter(p=>p.active).forEach(p=>{const delay=Math.max(0,Math.min(120,Number(p.delaySeconds||0)))*1000;window.setTimeout(()=>showPopup(p),delay);});
      }
    }catch(err){console.warn("[HEM public control]",err);}
  }
  window.HEMPublicControl={boot};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
  window.setInterval(boot,30000);
})();