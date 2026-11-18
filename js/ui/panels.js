/* Models panel: materials, snapshots and export */
'use strict';

/* =========================================================
   UI WIRING — part 2: panels, materials, CAD UI, interior UI, export, keys
   ========================================================= */

/* ---------- accordion ---------- */
$$('.pv').forEach(pv=>{
  const single=pv.dataset.pv==='models',cards=$$('.card',pv);
  cards.forEach(card=>{
    const head=$('.card-head',card);if(!head)return;
    head.addEventListener('click',()=>{
      const willOpen=!card.classList.contains('open');
      if(single)cards.forEach(c=>{c.classList.remove('open');const h=$('.card-head',c);h&&h.setAttribute('aria-expanded','false')});
      card.classList.toggle('open',willOpen);head.setAttribute('aria-expanded',willOpen);
      if(willOpen&&single)setTimeout(()=>card.scrollIntoView({block:'nearest',behavior:REDUCED?'auto':'smooth'}),380);
    });
  });
});

/* ---------- section summaries (value shown on the right of each header) ---------- */
const SUMS={roof:()=>ST.roof,wall:()=>ST.panel,tech:()=>[ST.lights&&'Lights',ST.solar&&'Solar',ST.glass&&'Tinted'].filter(Boolean).join(' · ')||'All off',land:()=>ST.climate,
  sheets:()=>(CAD.SHEETS[CAD.state.cur]||{}).no||'',floor:()=>ST.floor,paint:()=>PAINTS[paintPicked][0],scene:()=>ST.scene,furn:()=>$('#furnToggle').getAttribute('aria-checked')==='true'?'Shown':'Hidden'};
$$('.card[data-card]').forEach(c=>{const h=$('.card-head',c);if(h&&SUMS[c.dataset.card]){const e=document.createElement('span');e.className='sum';h.insertBefore(e,$('.chev',h))}});
function syncSum(){$$('.card[data-card]').forEach(c=>{const f=SUMS[c.dataset.card],e=$('.sum',c);if(f&&e)try{e.textContent=f()}catch(_){}})}
$('.panel').addEventListener('click',()=>setTimeout(syncSum,0));

/* ---------- hover preview for swatches (mouse only) ---------- */
function hoverPreview(btn,over,out){
  let t=null,on=false;
  btn.addEventListener('pointerenter',e=>{if(e.pointerType!=='mouse')return;clearTimeout(t);t=setTimeout(()=>{on=true;over()},130)});
  btn.addEventListener('pointerleave',()=>{clearTimeout(t);if(on){on=false;out()}});
  btn.addEventListener('click',()=>{clearTimeout(t);on=false});
}

/* =========================================================
   MATERIALS (models panel)
   ========================================================= */
const SETS={
  decor:{panelsLbl:'Cladding boards',finLbl:'Render & finish',
    panels:[['oak','Weathered oak'],['ash','Pale ash'],['slat','Cedar slats'],['walnut','Dark walnut'],['concrete','Raw concrete'],['charcoal','Charcoal'],['sand','Dune sand']],
    fin:[['cork','Lime, mold-resistant',0xe9d9c4],['fire','Fire-rated coat',0xe3e1db],['noise','Acoustic lining',0xdde4de],['thermal','Warm-wall wrap',0xede2d2]]},
  insul:{panelsLbl:'Insulation core',finLbl:'Outer systems',
    panels:[['wool','Mineral wool'],['eps','EPS foam'],['pir','PIR board'],['cellulose','Cellulose'],['corkb','Cork'],['wfibre','Wood fibre'],['hemp','Hemp']],
    fin:[['thermal','Thin-coat plaster',0xeeebe4],['fire','Mineral render',0xe6e4de],['cork','Cork render',0xeadccb],['noise','Lime wash',0xe8ece6]]}
};
let curSet='decor';const picked={decor:4,insul:0};
const panelRow=$('#panelRow'),finRow=$('#finRow');
function renderWall(){
  const s=SETS[curSet];
  $('#panelsLbl').textContent=s.panelsLbl;$('#finLbl').textContent=s.finLbl;
  $('#wallSeg').dataset.v=curSet==='decor'?0:1;
  $('#segDecor').setAttribute('aria-pressed',curSet==='decor');$('#segInsul').setAttribute('aria-pressed',curSet==='insul');
  panelRow.innerHTML='';finRow.innerHTML='';
  s.panels.forEach(([k,n],i)=>{
    const b=document.createElement('button');b.className='sw';b.title=n;b.setAttribute('aria-label',n);
    b.style.backgroundImage=urlOf(k);b.setAttribute('aria-pressed',picked[curSet]===i);
    b.addEventListener('click',()=>{picked[curSet]=i;setPressed($$('.sw',panelRow),i);A.setAccent(k);ST.panel=n;toast(n+' cladding applied')});
    hoverPreview(b,()=>A.setAccent(k),()=>A.setAccent(SETS[curSet].panels[picked[curSet]][0]));
    panelRow.appendChild(b);
  });
  s.fin.forEach(([k,n,tint])=>{
    const b=document.createElement('button');b.className='fin';b.setAttribute('aria-pressed','false');
    b.innerHTML=`<span class="fsw" style="background-image:${urlOf(k)}"></span><span class="ft">${n}</span>`;
    b.addEventListener('click',()=>{$$('.fin',finRow).forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');A.setWallTint(tint);ST.fin=n;toast(n+' on the facade')});
    finRow.appendChild(b);
  });
  A.setAccent(s.panels[picked[curSet]][0]);
}
function pickPanelKind(kind,quiet){
  for(const key of ['decor','insul']){
    const i=SETS[key].panels.findIndex(p=>p[0]===kind);
    if(i>=0){curSet=key;picked[key]=i;renderWall();ST.panel=SETS[key].panels[i][1];if(!quiet)toast(ST.panel+' cladding applied');return}
  }
}
$('#segDecor').addEventListener('click',()=>{curSet='decor';renderWall()});
$('#segInsul').addEventListener('click',()=>{curSet='insul';renderWall()});
renderWall();

/* roofing */
const ROOF=[['tile','Tile',0xb9674a,.85,'Clay tile: heavy, long-lived and fire resistant.'],
            ['ondulin','Ondulin',0x3f4a45,.7,'Ondulin: light corrugated sheets that are quick to install.'],
            ['soft','Soft roofing',0xd3d0c9,.95,'Soft roofing: lightweight bitumen shingles, quiet in the rain.']];
const roofChips=$('#roofChips');
ROOF.forEach(([k,n],i)=>{
  const b=document.createElement('button');b.className='chip';b.setAttribute('aria-pressed',i===2);
  b.innerHTML=`<i style="background-image:${urlOf(k)};background-size:cover"></i>${n}`;
  b.addEventListener('click',()=>pickRoof(i));roofChips.appendChild(b);
});
$('#roofHint').textContent=ROOF[2][4];
function pickRoof(i,quiet){const[,n,hex,r,hint]=ROOF[i];setPressed($$('.chip',roofChips),i);A.setRoof(hex,r);$('#roofHint').textContent=hint;ST.roof=n;if(!quiet)toast(n+' roof applied')}

/* landscape */
const CLIM=[['temperate','Temperate','#7aa35a','Bare-branch trees with string lights, evergreen shrubs.'],
            ['arid','Arid','#c9b27a','Drought-tolerant shrubs and bare ornamental trees.'],
            ['tropical','Tropical','#3fae5a','Full canopy trees and dense, deep-green planting.']];
const cc=$('#climateChips');
CLIM.forEach(([k,n,col],i)=>{
  const b=document.createElement('button');b.className='chip';b.setAttribute('aria-pressed',i===0);
  b.innerHTML=`<i style="background:${col}"></i>${n}`;b.addEventListener('click',()=>pickClimate(k));cc.appendChild(b);
});
$('#climateHint').textContent=CLIM[0][3];
function pickClimate(k,quiet){const i=CLIM.findIndex(c=>c[0]===k);setPressed($$('.chip',cc),i);A.setClimate(k);$('#climateHint').textContent=CLIM[i][3];ST.climate=CLIM[i][1];if(!quiet)toast(CLIM[i][1]+' planting applied')}

/* tech toggles */
const TECH_MSG={lights:['Smart lighting on','Smart lighting off'],solar:['Solar panels installed','Solar panels removed'],glass:['Smart glass tinted','Smart glass clear']};
$$('[data-tech]').forEach(t=>t.addEventListener('click',()=>{
  const k=t.dataset.tech,on=t.getAttribute('aria-checked')!=='true';t.setAttribute('aria-checked',on);A.setTech(k,on);ST[k]=on;toast(TECH_MSG[k][on?0:1],'info');
}));
H.size(80);

/* =========================================================
   SNAPSHOTS + EXPORT
   ========================================================= */
function snapCanvas(){
  const gl=A.renderer.domElement;A.snapshotURL('image/jpeg',.5);          // forces a fresh render
  const w=gl.width,h=gl.height,c=mkCanvas(w,h),g=c.getContext('2d');
  const gr=g.createRadialGradient(w*.45,h*.4,0,w*.45,h*.4,Math.max(w,h)*.75);
  if(mode==='interior'){gr.addColorStop(0,'#1c1917');gr.addColorStop(1,'#0c0b0a')}
  else if(A.st.day){gr.addColorStop(0,'#e2e9ef');gr.addColorStop(1,'#9fb0c0')}
  else{gr.addColorStop(0,'#2d2e33');gr.addColorStop(1,'#101011')}
  g.fillStyle=gr;g.fillRect(0,0,w,h);g.drawImage(gl,0,0);return c;
}
const canvasBlob=(c,type='image/png',q)=>new Promise(res=>c.toBlob(res,type,q));
function viewPDF(title,rows){
  const c=snapCanvas(),jpeg=dataURLtoBytes(c.toDataURL('image/jpeg',.9));
  const PW=841.89,PH=595.28,M=32,side=206,iw=PW-M*2-side-16,ih=PH-M*2-30,k=Math.min(iw/c.width,ih/c.height),w=c.width*k,h=c.height*k;
  const x=M+(iw-w)/2,y=M+30+(ih-h)/2,sx=PW-M-side;
  const T=(f,sz,tx,ty,str,rgb)=>`BT ${rgb} rg /${f} ${sz} Tf ${tx.toFixed(1)} ${ty.toFixed(1)} Td (${pdfEsc(str)}) Tj ET\n`;
  let s=`0.97 0.96 0.94 rg 0 0 ${PW} ${PH} re f\n0.07 0.07 0.07 rg ${M} ${PH-M-26} ${PW-M*2} 26 re f\n`;
  s+=T('F2',11,M+12,PH-M-17,'DWELIO - '+ST.project.toUpperCase()+'  /  '+title.toUpperCase(),'1 1 1');
  s+=T('F1',8,PW-M-150,PH-M-16,new Date().toLocaleDateString('en-GB')+'  REV C','0.8 0.8 0.8');
  s+=`q ${w.toFixed(1)} 0 0 ${h.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)} cm /Im0 Do Q\n0.7 0.7 0.7 RG 0.6 w ${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re S\n`;
  let ty=PH-M-58;
  s+=T('F2',13,sx,ty,title,'0.07 0.07 0.07');ty-=26;
  rows.forEach(([a,b])=>{s+=T('F1',7,sx,ty,a.toUpperCase(),'0.5 0.5 0.5')+T('F2',10,sx,ty-13,b,'0.1 0.1 0.1')+`0.8 0.8 0.8 RG 0.4 w ${sx} ${ty-20} m ${sx+side} ${ty-20} l S\n`;ty-=36});
  s+=T('F1',7,M,M+8,'Generated from the live model - orthographic view, units in metres.','0.45 0.45 0.45');
  return makePDF([{w:PW,h:PH,content:s,images:[{w:c.width,h:c.height,jpeg}]}]);
}
const slug=()=>projSlug(ST.project);
async function doExport(ctx,fmt){
  if(ctx==='drawings'){
    const id=CAD.state.cur,nm=`${slug()}-${id}`;
    if(fmt==='PDF')return[nm+'.pdf',CAD.exportPDF(id)];if(fmt==='SVG')return[nm+'.svg',CAD.exportSVG(id)];return[nm+'.png',await CAD.exportPNG(id)];
  }
  if(ctx==='models'){
    if(fmt==='PNG')return[`${slug()}-3d.png`,await canvasBlob(snapCanvas())];
    return[`${slug()}-3d.pdf`,viewPDF('3D model',[['View',($('#vbDeg').textContent||'')+' orbit'],['Lighting',A.st.day?'Daylight':'Night'],['Roof',ST.roof],['Wall panels',ST.panel],['Facade',ST.fin],['Landscape',ST.climate],['Smart lighting',ST.lights?'On':'Off'],['Solar roof',ST.solar?'Installed':'None'],['Smart glass',ST.glass?'Tinted':'Clear']])];
  }
  const rm=lastRoom?lastRoom.name:'Interior';
  if(fmt==='PNG')return[`${slug()}-interior.png`,await canvasBlob(snapCanvas())];
  return[`${slug()}-interior.pdf`,viewPDF('Interior view',[['Room',rm],['Floor',A.walk.lv?'First floor':'Ground floor'],['Flooring',ST.floor],['Lighting scene',ST.scene],['Field of view',$('#fovRange').value+' deg']])];
}
async function screenshot(){
  const fl=document.createElement('div');fl.style.cssText='position:absolute;inset:0;background:#fff;z-index:30;pointer-events:none;border-radius:inherit';stageEl.appendChild(fl);
  fl.animate([{opacity:.85},{opacity:0}],{duration:REDUCED?1:420,easing:'ease-out'}).onfinish=()=>fl.remove();
  try{
    const ctx=mode==='create'?'models':mode;const[n,b]=await doExport(ctx,'PNG');
    const r=await saveFile(n,b);toast(r==='saved'?'Screenshot saved — '+n:r==='declined'?'Download cancelled':'Could not save the screenshot',r==='saved'?'ok':'info');
  }catch(e){console.error(e);toast('Could not capture the view','info')}
}
$$('[data-export]').forEach(ex=>{
  const fmts=ex.dataset.formats.split(','),ctx=ex.dataset.ctx;let fmt=fmts[0];
  const fmtBtn=$('.fmt',ex),menu=$('.menu',ex),dl=$('.dl',ex),fv=$('.fv',ex),lab=$('span',dl);
  fmts.forEach(f=>{const b=document.createElement('button');b.textContent=f;b.setAttribute('role','option');b.setAttribute('aria-selected',f===fmt);
    b.addEventListener('click',()=>{fmt=f;fv.textContent=f;$$('button',menu).forEach(x=>x.setAttribute('aria-selected',x.textContent===f));menu.classList.remove('show');fmtBtn.setAttribute('aria-expanded','false')});menu.appendChild(b)});
  fmtBtn.addEventListener('click',()=>{const o=menu.classList.toggle('show');fmtBtn.setAttribute('aria-expanded',o)});
  dl.addEventListener('click',async()=>{
    if(dl.classList.contains('busy'))return;const old=lab.textContent;dl.classList.add('busy');lab.textContent='Preparing…';
    const t0=performance.now();let res=null;
    try{res=await doExport(ctx,fmt)}catch(e){console.error(e)}
    await sleep(REDUCED?0:Math.max(0,900-(performance.now()-t0)));
    if(!res){toast('Export failed — try another format','info');lab.textContent=old;dl.classList.remove('busy');return}
    const r=await saveFile(res[0],res[1]);
    toast(r==='saved'?`Saved ${res[0]}`:r==='declined'?'Download cancelled':'Download is not available here','ok'===r?'ok':(r==='saved'?'ok':'info'));
    lab.textContent=r==='saved'?'Saved ✓':old;await sleep(1100);lab.textContent=old;dl.classList.remove('busy');
  });
});
