/* App shell: modes, popovers, 3D controls, project menu */
'use strict';

/* =========================================================
   UI WIRING — part 1: boot, modes, popovers, 3D controls
   ========================================================= */
paintIcons();
const glOK=initScene();
const A=glOK?SCN:new Proxy({st:{mode:'models',size:80},walk:{lv:0},hooks:SCN.hooks},{get:(t,k)=>k in t?t[k]:(k==='getSize'?()=>80:()=>{})});
if(!glOK){$('#nogl').style.display='grid'}
const H=SCN.hooks;
const AB=glOK?SCN.build:new Proxy({},{get:()=>()=>undefined});
const curProj=()=>PROJECTS.find(p=>p.id===curProject);
const isCustom=()=>{const p=curProj();return !!(p&&p.custom)};
let mode='models',switching=false;
const ST={roof:'Soft roofing',panel:'Raw concrete',fin:'As modelled',climate:'Temperate',lights:true,solar:false,glass:false,floor:'Oak boards',scene:'Warm evening',project:'Casa Terra'};
const NSTAGE=8;

$$('input[type=range]').forEach(r=>{setSliderFill(r);r.addEventListener('input',()=>setSliderFill(r))});
const setPressed=(list,i)=>list.forEach((b,j)=>b.setAttribute('aria-pressed',j===i));

/* ---------- tiny helpers ---------- */
function holdRepeat(btn,fn){
  let t1=null,t2=null,fired=false;
  const stop=()=>{clearTimeout(t1);clearInterval(t2);t1=t2=null};
  btn.addEventListener('pointerdown',e=>{if(e.button)return;fired=true;fn();t1=setTimeout(()=>{t2=setInterval(fn,70)},340)});
  ['pointerup','pointerleave','pointercancel'].forEach(ev=>btn.addEventListener(ev,stop));
  btn.addEventListener('click',e=>{if(e.detail===0)fn()});   // keyboard activation
}
function slideInd(ind,btn,pad=0){if(!btn||!btn.offsetWidth)return;ind.style.width=btn.offsetWidth+'px';ind.style.transform=`translateX(${btn.offsetLeft+pad}px)`}
function copyText(txt,inputEl){
  const done=()=>toast('Link copied to clipboard');
  const fallback=()=>{try{inputEl.focus();inputEl.select();if(document.execCommand('copy')){done();return}}catch(_){}toast('Link selected — press Ctrl/⌘ + C','info')};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(done,fallback);else fallback();
}
function veilRun(fn,hold=70){
  const v=$('#veil');v.classList.add('on');
  return new Promise(res=>setTimeout(()=>{try{fn&&fn()}finally{setTimeout(()=>{v.classList.remove('on');setTimeout(res,240)},hold)}},REDUCED?0:270));
}

/* ---------- popovers ---------- */
const popBtn=new Map();
function closePops(except){
  $$('.pop.open').forEach(p=>{if(p===except)return;p.classList.remove('open');const b=popBtn.get(p);b&&b.setAttribute('aria-expanded','false')});
}
function togglePop(pop,btn,onOpen){
  const open=!pop.classList.contains('open');closePops(open?pop:null);
  if(btn)popBtn.set(pop,btn);
  pop.classList.toggle('open',open);btn&&btn.setAttribute('aria-expanded',open);
  if(open&&onOpen)onOpen();
  return open;
}
document.addEventListener('pointerdown',e=>{
  if(e.target.closest('.pop,.pin,#logoBtn,#backBtn')||[...popBtn.values()].some(b=>b.contains(e.target)))return;
  closePops();if(!e.target.closest('.export'))$$('.menu.show').forEach(m=>m.classList.remove('show'));
});

/* ---------- modals ---------- */
let modalPrev=null;
function openModal(m){modalPrev=document.activeElement;m.classList.add('open');const f=$('button',m);f&&setTimeout(()=>f.focus(),60)}
function closeModal(m){m.classList.remove('open');modalPrev&&modalPrev.focus&&modalPrev.focus()}
$$('.modal-back').forEach(m=>m.addEventListener('pointerdown',e=>{if(e.target===m&&!(m.id==='pubModal'&&pubBusy))closeModal(m)}));

/* =========================================================
   MODES (tabs)
   ========================================================= */
const tabsEl=$('#tabs'),tabInd=$('#tabInd'),tabBtns=$$('.tab',tabsEl);
const placeTabInd=()=>{
  const b=$('.tab[aria-selected=true]',tabsEl);if(!b||!b.offsetWidth)return;
  if(getComputedStyle(tabsEl).flexDirection==='column'){tabInd.style.width='';tabInd.style.height=b.offsetHeight+'px';tabInd.style.transform=`translateY(${b.offsetTop}px)`}
  else{tabInd.style.height='100%';tabInd.style.width=b.offsetWidth+'px';tabInd.style.transform=`translateX(${b.offsetLeft}px)`}
};
async function setMode(m,opts={}){
  if(m===mode||switching)return;
  if(m==='interior'&&!glOK){toast('Walking inside needs WebGL','info');return}
  if((m==='interior'||m==='drawings')&&isCustom()){toast('Walk-through and drawings are generated for the sample house, Casa Terra. Custom layouts open in Model.','info');return}
  switching=true;closePops();
  tabBtns.forEach(t=>t.setAttribute('aria-selected',t.dataset.mode===m));placeTabInd();
  const prev=mode;mode=m;A.stopAuto&&A.stopAuto();
  if(prev==='create'){bldPause();if(C.mode==='build'&&C.started)C.work=AB.data()}
  await veilRun(()=>{
    app.dataset.mode=m;
    $$('.pv').forEach(p=>{p.hidden=p.dataset.pv!==m});
    A.setMode(m==='create'?'models':m);
    applySubject(m);
    if(m==='create'){if(prev!=='models')A.setView('iso');createEnter()}
    if(m==='drawings')CAD.show();else if(prev==='drawings')CAD.hide();
    if(m==='interior'){A.enterInterior(opts.room||'living');buildMinimapLevel(A.walk.lv);syncLevelUI(A.walk.lv);const wt=$('#walkTip');wt.classList.remove('gone');clearTimeout(wt._t);wt._t=setTimeout(()=>wt.classList.add('gone'),7000)}
    if(prev==='interior'){A.setJoy(0,0);roomLabelEl.classList.remove('show')}
    if(m!=='models'){const cp=$('#commentPop');cp.classList.remove('open');if(commenting)setCommenting(false)}
    app.classList.toggle('paper',m==='drawings'&&CAD.state.paper);
  });
  const names={drawings:'Drawings — CAD sheets',interior:'Interior — walk inside'};
  if(names[m])toast(names[m],'info');
  switching=false;
}
tabBtns.forEach(t=>t.addEventListener('click',()=>setMode(t.dataset.mode)));

/* =========================================================
   TOPBAR: projects, share, publish, quick menu
   ========================================================= */
const PROJECTS=[
  {id:'casa',name:'Casa Terra',sub:'Two floors · 186 m²',kind:'concrete',p:{roof:2,panel:'concrete',tint:0xece9e2,climate:'temperate'}},
  {id:'lake',name:'Lakeside Villa',sub:'Walnut · slate roof',kind:'walnut',p:{roof:1,panel:'walnut',tint:0xe9d9c4,climate:'tropical'}},
  {id:'pine',name:'Pine Ridge Cabin',sub:'Warm slats · clay tile',kind:'slat',p:{roof:0,panel:'slat',tint:0xe3e1db,climate:'arid'}},
  {id:'harb',name:'Harbor Studio',sub:'Charcoal · slate roof',kind:'charcoal',p:{roof:1,panel:'charcoal',tint:0xdde4de,climate:'temperate'}}
];
function applySubject(m){
  const p=curProj(),custom=!!(p&&p.custom);
  if(m==='create'){
    app.classList.remove('custom');
    if(C.mode==='build'){A.setBuild(0,{animate:false});AB.view('build');AB.center()}
    else{AB.view('off');AB.restoreTarget();A.setBuild(bld.stage,{animate:false})}
  }else if(custom&&m==='models'){
    AB.load(p.data);A.setBuild(0,{animate:false});AB.view('result');AB.center();app.classList.add('custom');
  }else{
    app.classList.remove('custom');AB.view('off');AB.restoreTarget();A.setBuild(NSTAGE,{animate:false});
  }
  setProjectName((m==='create'&&C.mode==='build')?(($('#bName')&&$('#bName').value.trim())||'My house'):(p?p.name:'Casa Terra'));
  syncSum();
}
const projSlug=n=>n.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'dwelio';
function setProjectName(n){
  $('#projName').textContent=n;ST.project=n;$$('.pn').forEach(e=>e.textContent=n);
  $('#shareLink').value='https://dwelio.app/p/'+projSlug(n);CAD.setProject(n);
}
let curProject='casa';
const projPop=$('#projPop');
function renderProjects(){
  projPop.innerHTML='<h5 style="padding:4px 8px 6px">Projects</h5>';
  PROJECTS.forEach(p=>{
    const b=document.createElement('button');b.className='proj';b.setAttribute('role','menuitem');b.setAttribute('aria-current',p.id===curProject);
    b.innerHTML=`<span class="pt" style="background-image:${urlOf(p.kind)}"></span><span><b>${p.name}</b><small>${p.sub}</small></span><span class="ck" data-icon="tick"></span>`;
    b.addEventListener('click',()=>openProject(p.id));projPop.appendChild(b);
  });
  projPop.appendChild(document.createElement('hr'));
  const nb=document.createElement('button');nb.className='proj new';nb.setAttribute('role','menuitem');
  nb.innerHTML='<span class="pt" data-icon="plus"></span><span><b>New project</b><small>Start from an empty plot</small></span>';
  nb.addEventListener('click',()=>{closePops();startNew()});projPop.appendChild(nb);
  paintIcons(projPop);
}
async function openProject(id){
  const p=PROJECTS.find(x=>x.id===id);closePops();if(id===curProject||switching)return;
  curProject=id;renderProjects();
  const sc=$('#scan');sc.classList.remove('run');void sc.offsetWidth;sc.classList.add('run');
  setTimeout(()=>{
    setProjectName(p.name);
    if(p.custom){if(mode==='interior'||mode==='drawings')setMode('models');else applySubject(mode)}
    else{
      pickRoof(p.p.roof,true);pickPanelKind(p.p.panel,true);A.setWallTint(p.p.tint);$$('.fin',finRow).forEach(x=>x.setAttribute('aria-pressed','false'));pickClimate(p.p.climate,true);
      A.regenTrees();applySubject(mode);
    }
    if(mode==='models'||mode==='create')A.setView('iso');
  },420);
  toast('Opened '+p.name);
}
$('#logoBtn').addEventListener('click',()=>togglePop(projPop,$('#logoBtn'),renderProjects));
$('#backBtn').addEventListener('click',()=>togglePop(projPop,$('#backBtn'),renderProjects));

const sharePop=$('#sharePop');
$('#shareBtn').addEventListener('click',()=>togglePop(sharePop,$('#shareBtn')));
$('#copyLink').addEventListener('click',()=>{const b=$('#copyLink');copyText($('#shareLink').value,$('#shareLink'));b.textContent='Copied ✓';setTimeout(()=>b.textContent='Copy link',1600)});
$$('#sharePerm button').forEach((b,i,all)=>b.addEventListener('click',()=>{setPressed(all,i);toast('Link permission: '+b.textContent)}));
$('#shareDl').addEventListener('click',e=>{const t=e.currentTarget,on=t.getAttribute('aria-checked')!=='true';t.setAttribute('aria-checked',on);toast(on?'Downloads allowed':'Downloads disabled','info')});

/* quick menu */
const morePop=$('#morePop');
$('#moreBtn').addEventListener('click',()=>togglePop(morePop,$('#moreBtn')));
const fpsEl=document.createElement('div');fpsEl.style.cssText='position:absolute;z-index:6;left:50%;top:60px;transform:translateX(-50%);font:600 10px var(--mono);color:#7fe0a4;background:rgba(20,28,22,.82);padding:3px 8px;border-radius:8px;display:none;pointer-events:none';stageEl.appendChild(fpsEl);
H.fps=v=>{fpsEl.textContent=v+' FPS'};
function toggleItem(it,fn){const on=it.getAttribute('aria-checked')!=='true';it.setAttribute('aria-checked',on);fn(on);return on}
$$('#morePop .it').forEach(it=>it.addEventListener('click',()=>{
  const a=it.dataset.act;
  if(a==='reset'){resetView();closePops()}
  else if(a==='shot'){closePops();screenshot()}
  else if(a==='keys'){closePops();openModal($('#keysModal'))}
  else if(a==='shadows')toggleItem(it,on=>{A.setShadows(on);toast('Shadows '+(on?'on':'off'),'info')});
  else if(a==='quality')toggleItem(it,on=>{A.setQuality(on);toast(on?'High quality rendering':'Performance mode','info')});
  else if(a==='fps')toggleItem(it,on=>{fpsEl.style.display=on?'block':'none'});
  else if(a==='ghosts')toggleItem(it,on=>{stageEl.classList.toggle('ghosts-off',!on)});
}));
$('#keysClose').addEventListener('click',()=>closeModal($('#keysModal')));

/* publish flow */
let pubBusy=false,pubTok=0;
const pubModal=$('#pubModal'),pubProg=$('#pubProg'),pubGo=$('#pubGo');
function resetPub(){$$('#pubSteps .check').forEach(c=>c.classList.remove('run','done'));pubProg.style.width='0';pubGo.textContent='Publish now';pubGo.disabled=false;pubBusy=false}
$('#publishBtn').addEventListener('click',()=>{resetPub();openModal(pubModal)});
$('#pubCancel').addEventListener('click',()=>{pubTok++;resetPub();closeModal(pubModal)});
pubGo.addEventListener('click',async()=>{
  if(pubBusy)return;pubBusy=true;const tok=++pubTok;pubGo.textContent='Publishing…';pubGo.disabled=true;
  const steps=$$('#pubSteps .check');
  for(let i=0;i<steps.length;i++){
    steps[i].classList.add('run');pubProg.style.width=(i/steps.length*100+6)+'%';
    await sleep(REDUCED?200:620+i*140);if(tok!==pubTok)return;
    steps[i].classList.remove('run');steps[i].classList.add('done');pubProg.style.width=((i+1)/steps.length*100)+'%';
  }
  pubGo.textContent='Published ✓';await sleep(700);if(tok!==pubTok)return;
  closeModal(pubModal);pubBusy=false;toast('Published — collaborators notified');
  const pb=$('#publishBtn');pb.classList.add('ok');setTimeout(()=>pb.classList.remove('ok'),1800);
});

/* =========================================================
   3D CONTROLS (models mode)
   ========================================================= */
const dayBtn=$('#dayBtn'),nightBtn=$('#nightBtn'),themeEl=$('#theme');
function setDay(d,quiet){dayBtn.setAttribute('aria-pressed',d);nightBtn.setAttribute('aria-pressed',!d);themeEl.dataset.v=d?'day':'night';A.setDay(d);if(!quiet)toast(d?'Daylight':'Night lighting','info')}
dayBtn.addEventListener('click',()=>setDay(true));nightBtn.addEventListener('click',()=>setDay(false));

/* size + orbit */
const sizeRange=$('#sizeRange');
sizeRange.addEventListener('input',()=>A.setSize(+sizeRange.value));
H.size=v=>{$('#sizeVal').textContent=v+'%';sizeRange.value=v;setSliderFill(sizeRange)};
holdRepeat($('#sizeDown'),()=>A.setSize(A.getSize()-5));holdRepeat($('#sizeUp'),()=>A.setSize(A.getSize()+5));
holdRepeat($('#orLeft'),()=>A.rotate(.12));holdRepeat($('#orRight'),()=>A.rotate(-.12));
holdRepeat($('#orUp'),()=>A.tilt(3));holdRepeat($('#orDown'),()=>A.tilt(-3));
function resetView(){
  if(mode==='models'||mode==='create'){A.reset();if(mode==='create'&&C.mode==='build')AB.center();else if(isCustom())AB.center();toast('View reset','info')}
  else if(mode==='drawings'){CAD.fit();}
  else if(mode==='interior'){A.goRoom('living')}
}
$('#orReset').addEventListener('click',resetView);
$('#thumbBtn').addEventListener('click',()=>setMode('interior'));

/* view bar: 360 tour, presets, degrees */
const spinBtn=$('#spinBtn'),vbSeg=$('#vbSeg'),vbHl=$('.hl',vbSeg),vbBtns=$$('button',vbSeg);
function placeVbHl(){const b=vbBtns.find(x=>x.getAttribute('aria-pressed')==='true');if(!b||!b.offsetWidth){vbHl.style.opacity=0;return}vbHl.style.opacity=1;slideInd(vbHl,b)}
spinBtn.addEventListener('click',()=>{A.setAuto(!A.st.auto);if(A.st.auto)toast('360° tour — drag or press Space to stop','info')});
H.auto=on=>{spinBtn.setAttribute('aria-pressed',on);$('#spinLbl').textContent=on?'Stop tour':'360° tour'};
vbBtns.forEach(b=>b.addEventListener('click',()=>A.setView(b.dataset.view)));
H.view=name=>{vbBtns.forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===name));placeVbHl()};
H.deg=d=>{$('#vbDeg').textContent=d+'°'};
placeVbHl();

/* hover tip + click-pick opens the matching accordion card */
const tip3d=$('#tip3d');
H.tip=(label,x,y,sub)=>{
  if(!label){tip3d.classList.remove('on');return}
  const r=stageEl.getBoundingClientRect();tip3d.innerHTML=`${label}<small>${sub||''}</small>`;
  tip3d.style.left=(x-r.left)+'px';tip3d.style.top=(y-r.top)+'px';tip3d.classList.add('on');
};
const PART_CARD={roof:'roof',wall:'wall',glass:'tech',land:'land',deck:'land'};
function openCard(name,flash=true){
  const card=$(`.pv[data-pv=models] [data-card=${name}]`);if(!card)return;
  if(!card.classList.contains('open'))$('.card-head',card).click();
  if(flash){card.classList.remove('flash');void card.offsetWidth;card.classList.add('flash')}
  setTimeout(()=>card.scrollIntoView({block:'nearest',behavior:REDUCED?'auto':'smooth'}),360);
}
H.pick=(part,label)=>{openCard(PART_CARD[part]);toast('Selected: '+label[0],'info')};

/* ---------- comments ---------- */
let commenting=false;const pins=[],pinsEl=$('#pins'),cpop=$('#commentPop');
const REPLIES=['Nice spot — can we try a lighter finish here?','Agreed. I’ll check the spec sheet.','Looks good from this angle 👍','Let’s review this with the client on Friday.'];
function setCommenting(on){
  commenting=on;const b=$('#commentBtn');b.setAttribute('aria-pressed',on);A.setCommenting(on);
  stageEl.classList.toggle('commenting',on);canvas.style.cursor=on?'crosshair':'';
  if(on)toast('Click the model to drop a pin','info');
}
$('#commentBtn').addEventListener('click',()=>{if(mode!=='models'){toast('Comments are available in 3D models','info');return}setCommenting(!commenting)});
function updateCmtCount(){const c=$('#cmtCnt');c.hidden=!pins.length;c.textContent=pins.length}
let activePin=null;
function openThread(p){
  activePin=p;
  const rect=stageEl.getBoundingClientRect(),el=p.el;
  cpop.innerHTML=`<h5>Thread #${p.n}</h5><div class="th"></div><div class="field"><input placeholder="Write a comment…" aria-label="Comment"><button class="btn y" aria-label="Send">Send</button></div><button class="btn ghost-b" style="width:100%;margin-top:8px;height:26px">Resolve &amp; remove</button>`;
  const th=$('.th',cpop);
  p.msgs.forEach(m=>{const d=document.createElement('div');d.className='msg';const s=document.createElement('small');s.textContent=m.who;d.appendChild(s);d.appendChild(document.createTextNode(m.t));th.appendChild(d)});
  const left=Math.min(parseFloat(el.style.left)+16,rect.width-250),top=Math.max(parseFloat(el.style.top)-190,70);
  cpop.style.left=left+'px';cpop.style.top=Math.max(top,70)+'px';cpop.style.bottom='auto';
  const inp=$('input',cpop),send=$('.btn.y',cpop);
  const post=()=>{const t=inp.value.trim();if(!t)return;add('You',t);inp.value='';setTimeout(()=>add(Math.random()>.5?'Maya':'Dion',REPLIES[(Math.random()*REPLIES.length)|0]),1300+Math.random()*900)};
  const add=(who,t)=>{p.msgs.push({who,t});const d=document.createElement('div');d.className='msg';const s=document.createElement('small');s.textContent=who;d.appendChild(s);d.appendChild(document.createTextNode(t));th.appendChild(d);th.scrollTop=1e5};
  send.addEventListener('click',post);inp.addEventListener('keydown',e=>{if(e.key==='Enter')post();e.stopPropagation()});
  $('.btn.ghost-b',cpop).addEventListener('click',()=>{p.el.remove();pins.splice(pins.indexOf(p),1);pins.forEach((q,i)=>{q.n=i+1;q.el.firstChild.textContent=q.n});updateCmtCount();cpop.classList.remove('open');toast('Thread resolved')});
  closePops(cpop);cpop.classList.add('open');setTimeout(()=>inp.focus(),80);
}
H.pin=(x,y,z,cx,cy)=>{
  const el=document.createElement('button');el.className='pin';el.setAttribute('aria-label','Comment pin');
  const p={x,y,z,n:pins.length+1,el,msgs:[]};el.innerHTML=`<b>${p.n}</b>`;
  const r=stageEl.getBoundingClientRect();el.style.left=(cx-r.left)+'px';el.style.top=(cy-r.top)+'px';
  el.animate([{transform:'rotate(-45deg) scale(0)'},{transform:'rotate(-45deg) scale(1.2)'},{transform:'rotate(-45deg) scale(1)'}],{duration:REDUCED?1:380,easing:'cubic-bezier(.34,1.56,.64,1)'});
  el.addEventListener('click',e=>{e.stopPropagation();openThread(p)});
  pinsEl.appendChild(el);pins.push(p);updateCmtCount();setCommenting(false);openThread(p);
};
H.frame=()=>{
  if(!pins.length)return;
  pins.forEach(p=>{const q=A.project(p.x,p.y,p.z);p.el.style.left=q.x+'px';p.el.style.top=q.y+'px';
    if(p===activePin&&cpop.classList.contains('open')){cpop.style.left=Math.min(q.x+16,stageEl.clientWidth-250)+'px';cpop.style.top=Math.max(q.y-190,70)+'px'}});
};

/* avatars: popover + ghost cursors */
const AVP={a:{n:'Maya Ortega',r:'Editing · Facade cladding',c:'#d9774a'},b:{n:'Dion Whitfield',r:'Viewing · Model',c:'#5aa07a'}};
const avPop=$('#avPop');
$$('[data-avatar]').forEach(b=>b.addEventListener('click',()=>{
  const d=AVP[b.dataset.avatar];if(!d)return;
  togglePop(avPop,b,()=>{avPop.innerHTML=`<h5>${d.n}</h5><p class="sm">${d.r}</p><button class="btn ghost-b" style="width:100%" data-follow>Follow cursor</button>`;
    $('[data-follow]',avPop).addEventListener('click',()=>{closePops();toast('Following '+d.n.split(' ')[0],'info');const g=ghosts[b.dataset.avatar];if(g){g.flash=1.6}})});
}));
$('#inviteBtn').addEventListener('click',()=>{togglePop(sharePop,$('#shareBtn'));setTimeout(()=>$('#shareLink').select(),120)});
const ghostsEl=$('#ghosts'),ghosts={};
['a','b'].forEach((k,i)=>{
  const d=AVP[k],el=document.createElement('div');el.className='ghost';
  el.innerHTML=`<svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 1l11 5-5 1.6L6.4 13z" fill="${d.c}" stroke="#fff" stroke-width="1"/></svg><span style="background:${d.c}">${d.n.split(' ')[0]}</span>`;
  ghostsEl.appendChild(el);ghosts[k]={el,x:200+i*220,y:260+i*80,tx:0,ty:0,wait:0,flash:0};
});
let lastG=performance.now();
(function ghostLoop(now){
  requestAnimationFrame(ghostLoop);
  const dt=Math.min((now-lastG)/1000,.1);lastG=now;if((mode!=='models'&&mode!=='create')||REDUCED)return;
  const w=stageEl.clientWidth,h=stageEl.clientHeight;
  Object.values(ghosts).forEach(g=>{
    g.wait-=dt;
    if(g.wait<=0){g.tx=w*.25+Math.random()*w*.45;g.ty=h*.25+Math.random()*h*.5;g.wait=1.8+Math.random()*3}
    const k=1-Math.exp(-dt*(g.flash>0?4:1.6));g.x+=(g.tx-g.x)*k;g.y+=(g.ty-g.y)*k;g.flash=Math.max(0,g.flash-dt);
    g.el.style.transform=`translate(${g.x.toFixed(1)}px,${g.y.toFixed(1)}px)`;
  });
})(performance.now());

/* AI landscape generation */
const aiBtn=$('#aiBtn'),aiPop=$('#aiPop'),aiLabel=$('#aiLabel');
const AI_PRESETS=[['Tropical garden with palms','tropical'],['Desert courtyard','arid'],['Quiet birch grove','temperate'],['Evening lantern path','temperate']];
$('#aiChips').innerHTML='';
AI_PRESETS.forEach(([t,c])=>{const b=document.createElement('button');b.className='chip text';b.textContent=t;b.addEventListener('click',()=>{$('#aiPrompt').value=t;$('#aiPrompt').dataset.c=c;$('#aiPrompt').focus()});$('#aiChips').appendChild(b)});
aiBtn.addEventListener('click',()=>togglePop(aiPop,aiBtn,()=>setTimeout(()=>$('#aiPrompt').focus(),80)));
$('#aiPrompt').addEventListener('keydown',e=>{if(e.key==='Enter')$('#aiGo').click();e.stopPropagation()});
$('#aiGo').addEventListener('click',async()=>{
  if(aiBtn.classList.contains('busy'))return;
  const q=($('#aiPrompt').value||'').toLowerCase();
  const c=/palm|tropic|jungle|banana/.test(q)?'tropical':/desert|arid|cactus|dry|sand/.test(q)?'arid':/birch|grove|temperate|forest|lantern|light/.test(q)?'temperate':($('#aiPrompt').dataset.c||['temperate','arid','tropical'][(Math.random()*3)|0]);
  aiBtn.classList.add('busy');aiLabel.textContent='Generating…';
  const pr=$('#aiProg');pr.hidden=false;const bar=$('i',pr);bar.style.width='0';
  const sc=$('#scan');sc.classList.remove('run');void sc.offsetWidth;sc.classList.add('run');
  for(let i=1;i<=4;i++){await sleep(REDUCED?60:300);bar.style.width=i*25+'%';if(i===2){A.regenTrees();pickClimate(c,true)}}
  await sleep(200);pr.hidden=true;aiBtn.classList.remove('busy');aiLabel.textContent='AI landscape';closePops();
  toast('New landscape generated — '+CLIM.find(x=>x[0]===c)[1].toLowerCase()+' planting');
});
