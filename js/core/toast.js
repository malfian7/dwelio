/* Toast notifications */
'use strict';

/* =========================================================
   TOASTS
   ========================================================= */
const toastsEl=$('#toasts');
function toast(msg,type='ok'){
  while(toastsEl.children.length>=3)toastsEl.lastElementChild.remove();
  const el=document.createElement('div');el.className='toast '+(type==='info'?'info':'');
  el.innerHTML=`<span class="ti">${type==='info'?ICONS.plus.replace('width="13" height="13"','width="10" height="10"'):ICONS.tick}</span><span></span>`;
  el.lastChild.textContent=msg;toastsEl.prepend(el);
  setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),280)},2300);
}
