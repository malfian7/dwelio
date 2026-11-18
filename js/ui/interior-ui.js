/* Interior mode UI (rooms, finishes, lighting, minimap) */
'use strict';

/* =========================================================
   INTERIOR UI
   ========================================================= */
const FLOOR_OPTS=[['f_oak','Oak boards','Warm oak planks, the default.'],['f_walnut','Walnut','Dark, rich and quiet underfoot.'],['f_ash','Pale ash','Light timber that opens up small rooms.'],['f_marble','Marble','Polished stone — cool and reflective.'],['f_terrazzo','Terrazzo','Chips of stone set in cement.'],['f_tile','Large tile','Durable and easy to clean.'],['f_deck','Deck boards','Weathered, outdoor-style boards.']];
const floorRow=$('#floorRow');let floorPicked=0;
FLOOR_OPTS.forEach(([k,n,hint],i)=>{
  const b=document.createElement('button');b.className='sw';b.title=n;b.setAttribute('aria-label',n);b.style.backgroundImage=urlOf(k);b.setAttribute('aria-pressed',i===0);
  b.addEventListener('click',()=>{floorPicked=i;setPressed($$('.sw',floorRow),i);A.setFloor(k);ST.floor=n;$('#floorHint').textContent=hint;toast(n+' flooring applied')});
  hoverPreview(b,()=>A.setFloor(k),()=>A.setFloor(FLOOR_OPTS[floorPicked][0]));floorRow.appendChild(b);
});
$('#floorHint').textContent=FLOOR_OPTS[0][2];
const PAINTS=[['Warm plaster',0xe9dcc8],['Chalk white',0xf2efe8],['Sage',0xb7c2a8],['Terracotta',0xc9876a],['Mist blue',0xaebfd0],['Graphite',0x4a4d52],['Butter',0xf0d98a]];
const paintRow=$('#paintRow');let paintPicked=0;
PAINTS.forEach(([n,hex],i)=>{
  const b=document.createElement('button');b.className='sw';b.title=n;b.setAttribute('aria-label',n);b.style.background='#'+hex.toString(16).padStart(6,'0');b.setAttribute('aria-pressed',i===0);
  b.addEventListener('click',()=>{paintPicked=i;setPressed($$('.sw',paintRow),i);A.setPaint(hex);toast(n+' walls')});
  hoverPreview(b,()=>A.setPaint(hex),()=>A.setPaint(PAINTS[paintPicked][1]));paintRow.appendChild(b);
});
A.setPaint(PAINTS[0][1]);
const SCENE_OPTS=[['warm','Warm evening','#ffb066'],['cozy','Cozy','#ff9a4d'],['bright','Bright','#fff1de'],['cinema','Cinema','#7c9bff']];
const sceneChips=$('#sceneChips');
SCENE_OPTS.forEach(([k,n,col],i)=>{
  const b=document.createElement('button');b.className='chip';b.setAttribute('aria-pressed',i===0);b.innerHTML=`<i style="background:${col}"></i>${n}`;
  b.addEventListener('click',()=>{setPressed($$('.chip',sceneChips),i);A.setScene(k);ST.scene=n;toast(n+' lighting','info')});sceneChips.appendChild(b);
});
const brRange=$('#brRange');
brRange.addEventListener('input',()=>{$('#brVal').textContent=brRange.value+'%';A.setBrightness(+brRange.value/100)});
$('#furnToggle').addEventListener('click',e=>{const t=e.currentTarget,on=t.getAttribute('aria-checked')!=='true';t.setAttribute('aria-checked',on);A.showFurniture(on);toast(on?'Furniture shown':'Furniture hidden','info')});
$('#tvToggle').addEventListener('click',e=>{const t=e.currentTarget,on=t.getAttribute('aria-checked')!=='true';t.setAttribute('aria-checked',on);A.showTV(on);toast(on?'Screens on':'Screens hidden','info')});
$('#fovRange').addEventListener('input',e=>{const v=+e.target.value;$('#fovVal').textContent=v+'°';A.setFov(v)});
$('#exitWalk').addEventListener('click',()=>setMode('models'));

/* room list */
const roomListEl=$('#roomList'),roomBtns={};let lastRoom=null;
ROOMS.forEach(r=>{
  const b=document.createElement('button');b.innerHTML=`<i></i>${r.name}`;b.setAttribute('aria-current','false');
  b.addEventListener('click',()=>{syncLevelUI(r.lv);A.goRoom(r.id)});roomListEl.appendChild(b);roomBtns[r.id]=b;
});
const roomLabelEl=$('#roomLabel');let roomT=null;
H.room=r=>{
  lastRoom=r&&r.id!=='outside'?r:lastRoom;
  Object.entries(roomBtns).forEach(([id,b])=>b.setAttribute('aria-current',!!(r&&r.id===id)));
  $$('.mm-room').forEach(e=>e.classList.toggle('on',!!(r&&e.dataset.id===r.id)));
  clearTimeout(roomT);
  if(r&&mode==='interior'){roomLabelEl.textContent=r.name;roomLabelEl.classList.add('show');roomT=setTimeout(()=>roomLabelEl.classList.remove('show'),2400)}
  else roomLabelEl.classList.remove('show');
};

/* level toggle */
let mmLv=-1;
function syncLevelUI(lv){
  $('#lvl').dataset.v=lv;$('#lvl0').setAttribute('aria-pressed',lv===0);$('#lvl1').setAttribute('aria-pressed',lv===1);
  $('#mmLbl').textContent=lv?'First floor':'Ground floor';buildMinimapLevel(lv);
}
H.level=lv=>syncLevelUI(lv);
[0,1].forEach(lv=>$('#lvl'+lv).addEventListener('click',async()=>{
  if(A.walk.lv===lv)return;syncLevelUI(lv);
  const ok=await A.goLevel(lv);if(ok===false)syncLevelUI(A.walk.lv);
}));

/* minimap (drawn from the same wall data as the 3D model and the CAD sheets) */
const mmSvg=$('#mmSvg');
function buildMinimapLevel(lv){
  if(lv===mmLv)return;const first=mmLv<0;mmLv=lv;
  let g='';
  ROOMS.filter(r=>r.lv===lv).forEach(r=>{const[x0,x1,z0,z1]=r.r;g+=`<rect class="mm-room" data-id="${r.id}" x="${x0}" y="${z0}" width="${x1-x0}" height="${z1-z0}"/>`});
  WALLS.filter(w=>w.lv===lv).forEach(w=>{
    const ops=[...w.op].sort((a,b)=>a.a0-b.a0);let cur=w.a0;const segs=[];
    ops.forEach(o=>{if(o.a0>cur+1e-6)segs.push([cur,o.a0]);cur=o.a1});if(w.a1>cur+1e-6)segs.push([cur,w.a1]);
    segs.forEach(([s0,s1])=>{g+=w.axis==='x'?`<rect class="mm-wall" x="${s0}" y="${w.c0}" width="${s1-s0}" height="${w.c1-w.c0}"/>`:`<rect class="mm-wall" x="${w.c0}" y="${s0}" width="${w.c1-w.c0}" height="${s1-s0}"/>`});
    ops.filter(o=>o.k==='window'||(o.k==='door'&&o.sl)).forEach(o=>{g+=w.axis==='x'?`<rect class="mm-win" x="${o.a0}" y="${w.c0}" width="${o.a1-o.a0}" height="${w.c1-w.c0}"/>`:`<rect class="mm-win" x="${w.c0}" y="${o.a0}" width="${w.c1-w.c0}" height="${o.a1-o.a0}"/>`});
  });
  const st=STAIR;g+=`<rect class="mm-stair" x="${st.x0}" y="${st.z0}" width="${st.x1-st.x0}" height="${st.z1-st.z0}"/>`;
  if(lv===1)g+=`<rect class="mm-room on2" x="-4.5" y="1" width="5" height="2.3"/>`;
  mmSvg.innerHTML=`<style>.mm-wall{fill:#cfcbc2}.mm-win{fill:#5fc7d8}.mm-room{fill:rgba(255,255,255,.035);transition:fill .3s ease}.mm-room.on{fill:rgba(143,206,166,.28)}.mm-stair{fill:none;stroke:#8a867d;stroke-width:.05;stroke-dasharray:.12 .08}.on2{fill:rgba(255,255,255,.02);stroke:#8a867d;stroke-width:.04}</style><g id="mmG">${g}</g><g id="mmMe"><path d="M0 0L-.7 -1.3A1.5 1.5 0 0 1 .7 -1.3Z" fill="rgba(159,211,176,.4)"/><circle r=".26" fill="#9fd3b0" stroke="#0f1a13" stroke-width=".07"/></g>`;
  if(!first&&!REDUCED)$('#mmG').animate([{opacity:0},{opacity:1}],{duration:320,easing:'ease-out'});
  if(lastRoom)H.room(lastRoom);
}
H.walk=w=>{const me=$('#mmMe');if(me)me.setAttribute('transform',`translate(${w.x.toFixed(2)} ${w.z.toFixed(2)}) rotate(${(-w.yaw*180/Math.PI).toFixed(1)})`)};
$('#minimap').addEventListener('pointerdown',e=>{
  const pt=mmSvg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const p=pt.matrixTransform(mmSvg.getScreenCTM().inverse()),lv=A.walk.lv;
  const inside=ROOMS.some(r=>r.lv===lv&&p.x>=r.r[0]&&p.x<=r.r[1]&&p.y>=r.r[2]&&p.y<=r.r[3]);
  if(!inside){toast('Pick a spot inside the house','info');return}
  A.teleport(p.x,p.y,lv);
});

/* joystick (touch / mouse) */
const joy=$('#joy'),joyKnob=$('i',joy);let joyId=null;
function joyMove(e){
  const r=joy.getBoundingClientRect();let dx=(e.clientX-(r.left+r.width/2))/(r.width/2),dy=(e.clientY-(r.top+r.height/2))/(r.height/2);const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}
  joyKnob.style.transform=`translate(${dx*29}px,${dy*29}px)`;A.setJoy(Math.abs(dx)<.12?0:dx,Math.abs(dy)<.12?0:dy);
}
function joyEnd(e){if(joyId===null||(e&&e.pointerId!==joyId))return;joyId=null;joy.classList.remove('drag');joyKnob.style.transform='';A.setJoy(0,0)}
joy.addEventListener('pointerdown',e=>{joyId=e.pointerId;try{joy.setPointerCapture(joyId)}catch(_){}joy.classList.add('drag');joyMove(e);$('#walkTip').classList.add('gone')});
joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)joyMove(e)});
joy.addEventListener('pointerup',joyEnd);joy.addEventListener('pointercancel',joyEnd);
window.addEventListener('keydown',e=>{if(mode==='interior'&&'wasdWASD'.includes(e.key)&&e.key.length===1)$('#walkTip').classList.add('gone')});
