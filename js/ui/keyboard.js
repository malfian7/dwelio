/* Keyboard shortcuts */
'use strict';

/* =========================================================
   KEYBOARD
   ========================================================= */
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&mode==='create'&&C.mode==='build'&&!(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'))){
    const kk=e.key.toLowerCase();if(kk==='z'){e.preventDefault();e.shiftKey?AB.redo():AB.undo();return}if(kk==='y'){e.preventDefault();AB.redo();return}
  }
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  const t=e.target,typing=t&&((t.tagName==='INPUT'&&t.type!=='range')||t.tagName==='TEXTAREA'||t.isContentEditable);
  if(e.key==='Escape'){
    const m=$('.modal-back.open');if(m&&!(m.id==='pubModal'&&pubBusy)){closeModal(m)}
    closePops();$$('.menu.show').forEach(x=>x.classList.remove('show'));
    if(mode==='create')AB.cancel();
    if(mode==='drawings'&&CAD.state.tool==='measure')CAD.setTool('pan');
    if(commenting)setCommenting(false);
    return;
  }
  if(typing||$('.modal-back.open'))return;
  const k=e.key.length===1?e.key.toLowerCase():e.key;
  if(k==='?'){openModal($('#keysModal'));return}
  if(k==='1'||k==='2'||k==='3'||k==='4'){setMode(['create','models','interior','drawings'][+k-1]);return}
  if(k==='p'){screenshot();return}
  if(k==='r'){resetView();return}
  if(mode==='create'&&C.mode==='build'){
    const tk={w:'wall',d:'door',n:'window',g:'glass',s:'slide',f:'floor',o:'roof',x:'erase'};
    if(tk[k]){setTool(tk[k]);return}if(k==='Enter'){AB.cancel();return}
    return;
  }
  if(mode==='models'||mode==='create'){
    if(k===' '&&!t.closest('button,a,[role=switch]')){e.preventDefault();if(mode==='create'){if(C.mode==='demo')$('#bldPlay').click()}else spinBtn.click();return}
    const map={f:'front',b:'back',l:'left',t:'top',i:'iso'};
    if(map[k])A.setView(map[k]);
  }else if(mode==='drawings'){
    if(k==='m')tl.measure.click();else if(k==='s')tl.snap.click();else if(k==='g')tl.grid.click();else if(k==='v')CAD.setTool('pan');
    else if(k==='f')CAD.fit();else if(k==='+'||k==='=')CAD.zoomBy(1.2);else if(k==='-'||k==='_')CAD.zoomBy(1/1.2);
    else if(k===']'||k==='['){const i=CAD.ORDER.indexOf(CAD.state.cur),n=CAD.ORDER[(i+(k===']'?1:-1)+CAD.ORDER.length)%CAD.ORDER.length];CAD.setSheet(n)}
  }
});
