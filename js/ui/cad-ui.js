/* Drawings mode UI (sheets, layers, tools) */
'use strict';

/* =========================================================
   CAD UI
   ========================================================= */
const cadSvg=$('#cad'),sheetList=$('#sheetList'),sheetbar=$('#sheetbar'),sheetInd=$('#sheetInd'),sbBtns=[],srows=[];
CAD.ORDER.forEach(id=>{
  const s=CAD.SHEETS[id];
  const r=document.createElement('button');r.className='sheet-row';r.innerHTML=`<span class="no">${s.no}</span><span><b>${s.title}</b><small>${s.yFlip?'Elevation':'Plan'} · A3 landscape</small></span>`;
  r.addEventListener('click',()=>CAD.setSheet(id));sheetList.appendChild(r);srows.push(r);
  const b=document.createElement('button');b.textContent=s.short;b.setAttribute('aria-pressed',id===CAD.state.cur);b.addEventListener('click',()=>CAD.setSheet(id));sheetbar.appendChild(b);sbBtns.push(b);
});
function placeSheetInd(){slideInd(sheetInd,sbBtns.find(b=>b.getAttribute('aria-pressed')==='true'))}
function syncSheetUI(id){const i=CAD.ORDER.indexOf(id);sbBtns.forEach((b,j)=>b.setAttribute('aria-pressed',j===i));srows.forEach((r,j)=>r.setAttribute('aria-current',j===i));placeSheetInd()}
CAD.hooks.sheet=syncSheetUI;syncSheetUI(CAD.state.cur);

/* layers */
const layerList=$('#layerList'),layerRows={};
CAD.LAYERS.forEach(l=>{
  const b=document.createElement('button');b.className='layer-row';b.setAttribute('aria-pressed','true');
  b.innerHTML=`<span class="sq"></span><span>${l.name}</span><span class="eye" data-icon="eye"></span>`;
  b.addEventListener('click',()=>{
    if(l.id==='grid'){CAD.setGrid(!CAD.state.grid);syncGridUI();return}
    const vis=CAD.toggleLayer(l.id);paintLayerRow(l.id,vis);
  });
  layerList.appendChild(b);layerRows[l.id]=b;
});
paintIcons(layerList);
function paintLayerColors(){const cs=getComputedStyle(cadSvg);CAD.LAYERS.forEach(l=>{$('.sq',layerRows[l.id]).style.background=cs.getPropertyValue(l.v).trim()||'#888'})}
function paintLayerRow(id,vis){const b=layerRows[id];b.setAttribute('aria-pressed',vis);const e=$('.eye',b);e.innerHTML=vis?ICONS.eye:ICONS.eyeOff}
paintLayerColors();

/* tools */
const tl={select:$('#tlSelect'),measure:$('#tlMeasure'),snap:$('#tlSnap'),grid:$('#tlGrid'),paper:$('#tlPaper')};
function syncGridUI(){const on=CAD.state.grid;tl.grid.setAttribute('aria-pressed',on);paintLayerRow('grid',on)}
CAD.hooks.tool=t=>{tl.select.setAttribute('aria-pressed',t==='pan');tl.measure.setAttribute('aria-pressed',t==='measure');$('#measBtn').classList.toggle('on',t==='measure');cadSvg.style.cursor=t==='measure'?'crosshair':''};
tl.select.addEventListener('click',()=>CAD.setTool('pan'));
tl.measure.addEventListener('click',()=>{CAD.setTool(CAD.state.tool==='measure'?'pan':'measure');if(CAD.state.tool==='measure')toast('Measure: click two points (snaps to wall corners)','info')});
$('#measBtn').addEventListener('click',()=>tl.measure.click());
tl.snap.addEventListener('click',()=>{const on=!CAD.state.snap;CAD.setSnap(on);tl.snap.setAttribute('aria-pressed',on);toast(on?'Object snap on':'Object snap off','info')});
tl.grid.addEventListener('click',()=>{CAD.setGrid(!CAD.state.grid);syncGridUI()});
holdRepeat($('#tlZin'),()=>CAD.zoomBy(1.12));holdRepeat($('#tlZout'),()=>CAD.zoomBy(1/1.12));
$('#tlFit').addEventListener('click',()=>CAD.fit());
tl.paper.addEventListener('click',()=>{const on=!CAD.state.paper;CAD.setPaper(on);tl.paper.setAttribute('aria-pressed',on);setTimeout(paintLayerColors,30);toast(on?'Paper preview':'Dark workspace','info')});
$('#lwRange').addEventListener('input',e=>{const v=+e.target.value/10;$('#lwVal').textContent=v.toFixed(1);CAD.setLW(v)});
const lwr=$('#lwRange');setSliderFill(lwr);

/* measurements list */
CAD.hooks.measures=list=>{
  const ml=$('#measList');ml.innerHTML='';
  if(!list.length){ml.innerHTML='<div class="hint" style="margin:0">No measurements on this sheet yet.</div>';return}
  list.forEach((v,i)=>{const d=document.createElement('div');d.className='meas-item';d.innerHTML=`<span>#${i+1} &nbsp;${v.toLocaleString('en-US')} mm</span><button aria-label="Delete measurement ${i+1}" data-icon="close"></button>`;
    $('button',d).addEventListener('click',()=>CAD.removeMeasure(i));ml.appendChild(d)});
  paintIcons(ml);
};
CAD.hooks.measures([]);
