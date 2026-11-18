/* Create mode: interactive builder and guided demo */
'use strict';

/* =========================================================
   CREATE — interactive builder + guided demo
   ========================================================= */
const TOOLS=[['wall','Wall','W','tWall'],['door','Door','D','tDoor'],['window','Window','N','tWin'],['glass','Glass wall','G','tGlass'],['slide','Sliding door','S','tSlide'],['|'],['floor','Floor','F','tFloor'],['roof','Roof','O','tRoof'],['|'],['erase','Erase','X','tErase']];
const TOOL_HELP={
  wall:['Draw walls','Click a point on the grid to start, move, then click again to place a straight wall. The length shows live and snaps to 0.5 m. Click the last point again (or press Esc) to finish.'],
  door:['Place a door','Hover a wall and click. A 1 m door is cut into the wall. Green means it fits, red means there is no room.'],
  window:['Place a window','Hover a wall and click. 1.5 m wide, sill at 0.9 m. Use it for bedrooms and kitchens.'],
  glass:['Place a glass wall','A 2 m floor-to-ceiling glass panel. Good toward a terrace or garden.'],
  slide:['Place a sliding door','A 2 m sliding glass door with a dark frame.'],
  floor:['Lay a floor','Click inside a closed room. Click it again to remove the floor. Floors on the first level also act as the ceiling below.'],
  roof:['Add a roof','Click inside a closed room to cap it. Gable and shed roofs need a rectangular room; other shapes get a flat roof.'],
  erase:['Erase','Click a wall, opening, floor or roof to remove it. Hold Shift to remove a single 0.5 m piece of wall.']
};
const C={mode:'build',started:false,editing:null,tool:'wall'};
const bbar=$('#bbar'),bHint=$('#bHint'),bLabel=$('#bLabel'),toolBtns={};
TOOLS.forEach(t=>{
  if(t[0]==='|'){const s=document.createElement('span');s.className='sep';bbar.appendChild(s);return}
  const b=document.createElement('button');b.className='bt';b.dataset.tool=t[0];b.setAttribute('aria-pressed',t[0]==='wall');b.setAttribute('aria-label',t[1]+' ('+t[2]+')');
  b.innerHTML=`${ICONS[t[3]]}<span class="bl">${t[1]}</span><kbd>${t[2]}</kbd>`;b.addEventListener('click',()=>setTool(t[0]));bbar.appendChild(b);toolBtns[t[0]]=b;
});
['undo','redo'].forEach(k=>{const b=document.createElement('button');b.className='bt sm';b.id='b'+k;b.setAttribute('aria-label',k==='undo'?'Undo (Ctrl+Z)':'Redo (Ctrl+Shift+Z)');b.innerHTML=ICONS[k]+`<span class="bl">${k==='undo'?'Undo':'Redo'}</span>`;
  if(k==='undo'){const s=document.createElement('span');s.className='sep';bbar.appendChild(s)}
  b.addEventListener('click',()=>{k==='undo'?AB.undo():AB.redo()});bbar.appendChild(b)});
function setTool(t,quiet){
  C.tool=t;AB.setTool(t);
  Object.entries(toolBtns).forEach(([k,b])=>b.setAttribute('aria-pressed',k===t));
  const h=TOOL_HELP[t];$('#bhT').textContent=h[0];$('#bhP').textContent=h[1];
  $('#bOptFloor').hidden=t!=='floor';$('#bOptRoof').hidden=t!=='roof';
  $$('#bSteps li').forEach(li=>li.classList.toggle('cur',(li.dataset.tool==='door'&&['door','window','glass','slide'].includes(t))||li.dataset.tool===t));
  if(t==='roof'&&AB.getCut()){setCut(false);if(!quiet)toast('Showing full-height walls so you can place the roof','info')}
  bHint.textContent='';
}
function setCut(on){AB.setCut(on);$('#bCut').setAttribute('aria-checked',on)}
$('#bCut').addEventListener('click',()=>setCut($('#bCut').getAttribute('aria-checked')!=='true'));
$$('#bLvl button').forEach((b,i,all)=>b.addEventListener('click',()=>{setPressed(all,i);AB.setLevel(i);toast(i?'Editing the first floor — draw walls on top of the ground floor':'Editing the ground floor','info')}));
/* floor + roof options */
const FLOOR_NAMES=['Timber','Tile','Concrete'],FLOOR_KINDS=['f_oak','f_tile','concrete'];
FLOOR_NAMES.forEach((n,i)=>{const b=document.createElement('button');b.className='chip';b.setAttribute('aria-pressed',i===0);b.innerHTML=`<i style="background-image:${urlOf(FLOOR_KINDS[i])};background-size:cover"></i>${n}`;b.addEventListener('click',()=>{setPressed($$('#bFloorChips .chip'),i);AB.setFloorMat(i)});$('#bFloorChips').appendChild(b)});
const ROOF_STYLES=[['flat','Flat','Flat slab with a small overhang.'],['gable','Gable','Two slopes meeting at a ridge along the longer side.'],['shed','Shed','A single slope — modern and simple.']];
ROOF_STYLES.forEach(([k,n,h],i)=>{const b=document.createElement('button');b.className='chip';b.setAttribute('aria-pressed',i===0);b.textContent=n;b.addEventListener('click',()=>{setPressed($$('#bRoofChips .chip'),i);AB.setRoofStyle(k);$('#bRoofHint').textContent=h});$('#bRoofChips').appendChild(b)});
$('#bRoofHint').textContent=ROOF_STYLES[0][2];
/* examples */
const EXAMPLES=[['studio','Studio','8 × 5 m, flat roof'],['cottage','Cottage','Two rooms, gable roof'],['lhouse','L-house','L-shaped, flat roof'],['twostory','Two-storey','Terrace + upper floor']];
EXAMPLES.forEach(([k,n,s])=>{const b=document.createElement('button');b.className='ex';b.innerHTML=`<b>${n}</b><small>${s}</small>`;b.addEventListener('click',()=>loadExample(k));$('#exGrid').appendChild(b)});
function loadExample(k){AB.preset(k);setLevelUI(0);C.started=true;AB.center();setTool('door',true);toast('Example loaded — change anything you like','info')}
function setLevelUI(i){AB.setLevel(i);setPressed($$('#bLvl button'),i)}
$('#bClear').addEventListener('click',()=>{if(!AB.hasContent())return;AB.clear();toast('Cleared — start with the Wall tool','info');setTool('wall',true)});
/* live state from the engine */
H.bstate=s=>{
  if(!s)return;
  statSet('#stW',s.walls,v=>(v%1?v.toFixed(1):v)+' m');statSet('#stR',s.rooms,v=>String(v));statSet('#stF',s.floorArea,v=>(v%1?v.toFixed(1):v)+' m²');statSet('#stO',s.openings,v=>String(v));
  const done={walls:s.wallCount>=4,open:s.openings>0,floor:s.floors>0,roof:s.roofs>0};
  $$('#bSteps li').forEach(li=>li.classList.toggle('done',!!done[li.dataset.step]));
  const un=$('#bundo'),re=$('#bredo');if(un)un.disabled=!s.canUndo;if(re)re.disabled=!s.canRedo;
  $('#bOpen').disabled=!s.wallCount;
  toolBtns.wall.classList.toggle('nudge',!s.wallCount&&mode==='create'&&C.mode==='build');
};
H.bhint=t=>{bHint.textContent=t;bHint.classList.toggle('on',!!t)};
H.blabel=(t,x,y)=>{if(!t){bLabel.classList.remove('on');return}bLabel.textContent=t;bLabel.style.left=x+'px';bLabel.style.top=y+'px';bLabel.classList.add('on')};
H.bchange=k=>{
  if(k==='open-area')toast('This area is open — close every side with walls first','info');
  else if(k==='bad')toast('Not enough straight wall there for that piece','info');
  else if(k==='roof-flat')toast('That room is not a rectangle — placed a flat roof instead','info');
};
$$('#bSteps li').forEach(li=>{const go=()=>setTool(li.dataset.tool);li.addEventListener('click',go);li.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();go()}})});

/* ---- start dialog ---- */
const startModal=$('#startModal'),optGrid=$('#optGrid'),tplGrid=$('#tplGrid'),tplRow=$('#tplRow');
function startView(v){
  optGrid.hidden=v!=='options';tplGrid.hidden=v!=='tpl';tplRow.hidden=v!=='tpl';
  $('#startTitle').textContent=v==='tpl'?'Pick an example':'Start a new home';
  $('#startSub').textContent=v==='tpl'?'It loads onto the grid so you can see how walls, openings, floors and roofs fit together. Change anything.':'You will draw walls, place doors and windows, then lay a floor and a roof on an empty plot.';
}
EXAMPLES.forEach(([k,n,s])=>{const b=document.createElement('button');b.className='tpl';b.innerHTML=`<span class="pt ex-ic" data-icon="${k==='studio'?'tWall':k==='cottage'?'tRoof':k==='lhouse'?'tFloor':'tGlass'}"></span><span><b>${n}</b><small>${s}</small></span>`;b.addEventListener('click',()=>{closeModal(startModal);enterBuild();loadExample(k)});tplGrid.appendChild(b)});
paintIcons(tplGrid);
function openStart(){startView('options');openModal(startModal)}
function enterBuild(blank){C.mode='build';C.started=true;showMode();if(blank){AB.clear();setLevelUI(0);setTool('wall',true)}}
optGrid.addEventListener('click',e=>{
  const o=e.target.closest('.opt');if(!o)return;
  if(o.dataset.opt==='blank'){closeModal(startModal);enterBuild(true)}
  else if(o.dataset.opt==='example')startView('tpl');
  else{closeModal(startModal);startDemo()}
});
$('#tplBack').addEventListener('click',()=>startView('options'));
const dismissStart=()=>{if(!C.started){C.started=true;showMode()}};
$('#startClose').addEventListener('click',()=>{closeModal(startModal);dismissStart()});
startModal.addEventListener('pointerdown',e=>{if(e.target===startModal)dismissStart()});
$('#bDemo').addEventListener('click',startDemo);

/* ---- switching between builder and demo ---- */
function showMode(){
  const build=C.mode==='build';
  app.dataset.cmode=C.mode;
  $('#bPanel').hidden=!build;$('#demoPanel').hidden=build;
  if(mode==='create')applySubject('create');
  updatePlotCap();
}

/* ---- guided demo (staged build of the sample house) ---- */
const STAGES=[
  ['Foundation','Concrete slab and footings'],['Ground-floor walls','Masonry shell with openings'],['Upper slab & stair','Floor structure and staircase'],['First-floor walls','Walls, bands and balcony'],
  ['Roof','Roof deck, finish and solar'],['Glazing','Windows and sliding doors'],['Furnishing','Interior staging'],['Landscape & details','Steps, glow strips, planters']
];
const bld={stage:0,playing:false,speed:1,timer:null,run:-1};
const stageList=$('#stageList'),bldProg=$('#bldProg'),bldPlay=$('#bldPlay'),bldOpen=$('#bldOpen');
STAGES.forEach(([n,sub],i)=>{
  const li=document.createElement('li');li.className='stage-it';li.tabIndex=0;li.dataset.i=i;
  li.innerHTML=`<span class="dot">${ICONS.tick||''}</span><span><b style="font-weight:inherit">${n}</b><small>${sub}</small></span>`;
  const go=()=>{bldPause();bldTo(i+1,true)};
  li.addEventListener('click',go);li.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();go()}});
  stageList.appendChild(li);
});
function startDemo(){C.mode='demo';C.started=true;bld.stage=0;bld.run=-1;showMode();paintStages();bldPlayNow()}
function updatePlotCap(){
  const c=$('#plotCap');
  if(C.mode==='build')c.textContent='Building plot · 15 × 11 m';
  else if(bld.stage===0)c.textContent='Building plot · 15 × 11 m';
  else if(bld.stage>=NSTAGE&&bld.run<0)c.textContent='Shell complete';
  else c.textContent=`Stage ${Math.min(bld.stage,NSTAGE)} / ${NSTAGE} · ${STAGES[Math.min(bld.stage,NSTAGE)-1][0]}`;
}
function paintStages(){
  const k=bld.stage,done=k>=NSTAGE&&bld.run<0;
  $$('.stage-it',stageList).forEach((li,i)=>{li.classList.toggle('run',i===bld.run);li.classList.toggle('done',i<k&&i!==bld.run)});
  bldProg.style.width=(k/NSTAGE*100)+'%';
  $('#bldTitle').textContent=done?'The shell is complete':k===0?'Ready to build':bld.run>=0?STAGES[bld.run][0]+'…':'Paused at '+STAGES[k-1][0].toLowerCase();
  $('#bldSub').textContent=done?'That is the order to follow in the builder: walls, openings, floor, roof.':k===0?'Press play to raise the first stage.':'Watch how each stage goes up on the plot.';
  bldPlay.innerHTML=bld.playing?ICONS.pause:ICONS.play;bldPlay.setAttribute('aria-label',bld.playing?'Pause':done?'Replay':'Play');
  $('#bldPrev').disabled=k<=0;$('#bldNext').disabled=k>=NSTAGE;
  updatePlotCap();
}
let runTimer=null;
function bldTo(k,animate){
  k=Math.max(0,Math.min(NSTAGE,k));const prev=bld.stage;bld.stage=k;
  clearTimeout(runTimer);bld.run=-1;
  if(animate&&k>prev&&mode==='create'&&!REDUCED){bld.run=k-1;A.setBuild(k,{animate:true,dur:1100/bld.speed});runTimer=setTimeout(()=>{bld.run=-1;paintStages()},1300/bld.speed)}
  else A.setBuild(k,{animate:false});
  paintStages();
}
function bldTick(){
  if(!bld.playing)return;
  if(bld.stage>=NSTAGE){bld.playing=false;paintStages();return}
  bldTo(bld.stage+1,true);
  bld.timer=setTimeout(bldTick,(REDUCED?500:2100)/bld.speed);
}
function bldPlayNow(){if(bld.stage>=NSTAGE)bldTo(0,false);bld.playing=true;clearTimeout(bld.timer);paintStages();bld.timer=setTimeout(bldTick,bld.stage===0?350:0)}
function bldPause(){if(!bld.playing)return;bld.playing=false;clearTimeout(bld.timer);paintStages()}
bldPlay.addEventListener('click',()=>{bld.playing?bldPause():bldPlayNow()});
$('#bldNext').addEventListener('click',()=>{bldPause();bldTo(bld.stage+1,true)});
$('#bldPrev').addEventListener('click',()=>{bldPause();bldTo(bld.stage-1,false)});
$$('#bldSpeed button').forEach((b,i,all)=>b.addEventListener('click',()=>{setPressed(all,i);bld.speed=+b.dataset.s}));
bldOpen.addEventListener('click',()=>{bldPause();C.mode='build';showMode();setTool('wall',true);toast('Your turn — pick the Wall tool and click on the grid','info')});

/* ---- open the finished layout as a project ---- */
$('#bOpen').addEventListener('click',()=>{
  const s=AB.stats();if(!s||!s.wallCount){toast('Draw at least one wall first','info');return}
  const name=($('#bName').value||'My house').trim()||'My house',data=AB.data();
  const sub=`${s.rooms||'—'} room${s.rooms===1?'':'s'} · ${Math.round(s.floorArea)} m² floor`;
  let p;
  if(C.editing){p=PROJECTS.find(x=>x.id===C.editing);if(p){p.name=name;p.data=data;p.sub=sub}}
  if(!p){p={id:'u'+(++userProjects),name,sub,kind:'concrete',custom:true,data};PROJECTS.splice(1,0,p)}
  curProject=p.id;setProjectName(name);C.started=false;C.editing=null;C.work=null;
  setMode('models').then(()=>{toast(`“${name}” is open in the editor`);A.setView('iso')});
});
let userProjects=0;
function startNew(){
  bldPause();C.work=null;C.started=false;C.editing=null;C.mode='build';AB.clear();setLevelUI(0);
  if(mode==='create'){showMode();openStart()}else setMode('create');
}
function editLayout(){
  const p=PROJECTS.find(x=>x.id===curProject);if(!p||!p.custom)return;
  C.work=null;C.editing=p.id;C.mode='build';C.started=true;AB.load(p.data);setLevelUI(0);$('#bName').value=p.name;setTool('door',true);
  setMode('create');
}
$('#editLayout').addEventListener('click',editLayout);
$('#bName').addEventListener('input',()=>{if(mode==='create'&&C.mode==='build')setProjectName($('#bName').value.trim()||'My house')});
function createEnter(){
  if(!C.started){showMode();openStart()}
  else{showMode();if(C.mode==='demo')paintStages();else{if(C.work)AB.load(C.work);AB.center();setTool(C.tool,true)}}
}
setTool('wall',true);
