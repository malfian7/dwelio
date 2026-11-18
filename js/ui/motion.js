/* Motion helpers: count-up, ripples, placement ping, panel edge */
'use strict';

/* ---- motion helpers: count-up numbers, press ripples, placement ping, panel scroll edge ---- */
const _stat={};
function statSet(sel,to,fmt){
  const el=$(sel);if(!el)return;const from=_stat[sel]===undefined?0:_stat[sel];if(from===to){el.textContent=fmt(to);return}
  _stat[sel]=to;el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');
  if(REDUCED){el.textContent=fmt(to);return}
  const t0=performance.now(),d=420;(function s(now){const p=Math.min(1,(now-t0)/d),e=1-Math.pow(1-p,3),v=from+(to-from)*e;el.textContent=fmt(p>=1?to:Math.round(v*10)/10);if(p<1&&_stat[sel]===to)requestAnimationFrame(s)})(t0);
}
document.addEventListener('pointerdown',e=>{
  if(REDUCED||e.button>0)return;const b=e.target.closest&&e.target.closest('.btn,.opt,.tpl,.ex,.bbar .bt');if(!b||b.disabled)return;
  const r=b.getBoundingClientRect(),d=document.createElement('span');d.className='rip';d.style.left=(e.clientX-r.left)+'px';d.style.top=(e.clientY-r.top)+'px';
  b.appendChild(d);setTimeout(()=>d.remove(),600);
},{passive:true});
(function(){const cv=$('#gl');if(!cv)return;
  cv.addEventListener('pointerup',e=>{
    if(REDUCED||mode!=='create'||C.mode!=='build'||e.button>0)return;
    const st=$('.stage'),r=st.getBoundingClientRect(),p=document.createElement('i');p.className='pingring';
    p.style.left=(e.clientX-r.left-23)+'px';p.style.top=(e.clientY-r.top-23)+'px';st.appendChild(p);setTimeout(()=>p.remove(),650);
  });
  const pn=$('.panel');if(pn)pn.addEventListener('scroll',()=>pn.classList.toggle('scrolled',pn.scrollTop>4),{passive:true});
})();
