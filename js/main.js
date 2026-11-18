/* Boot: initial camera, loading veil, intro build */
'use strict';

/* =========================================================
   BOOT
   ========================================================= */
window.addEventListener('resize',()=>{placeTabInd();sheetInd&&placeSheetInd()});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{placeTabInd();placeSheetInd();placeVbHl()});
placeTabInd();placeSheetInd();placeVbHl();
requestAnimationFrame(()=>{placeTabInd();placeSheetInd();placeVbHl()});
if(glOK&&!REDUCED){A.st.cur.az=A.st.az=Math.PI/4+1.6;A.st.cur.zoom=.82;setTimeout(()=>A.setView('iso'),700)}
setTimeout(()=>$('#loading').classList.add('done'),glOK?900:250);
/* intro: Casa Terra assembles stage by stage; any interaction or mode change finishes it instantly */
if(glOK&&!REDUCED){
  let intro=true;const done=()=>{if(!intro)return;intro=false;if(mode==='models'&&curProject==='casa')A.setBuild(NSTAGE,{animate:false})};
  A.setBuild(0,{animate:false});
  for(let i=0;i<NSTAGE;i++)setTimeout(()=>{if(!intro)return;if(mode!=='models'){intro=false;return}A.setBuild(i+1,{dur:520});if(i===NSTAGE-1)intro=false},1000+i*340);
  addEventListener('pointerdown',done,{once:true,capture:true});addEventListener('keydown',done,{once:true,capture:true});
}
syncSum();
window.__ui={setMode,CAD,A,ST,bld,C,AB,PROJECTS};
