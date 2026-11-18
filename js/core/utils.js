/* Shared helpers: DOM shortcuts, math, easing, tween */
'use strict';

const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const app=$('#app'), stageEl=$('#stage');
const REDUCED=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const wrapPI=a=>{a=(a+Math.PI)%(Math.PI*2);if(a<0)a+=Math.PI*2;return a-Math.PI};
const easeOut=t=>1-Math.pow(1-t,3);
const easeInOut=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function tween(dur,fn,ease=easeOut){return new Promise(res=>{if(REDUCED){fn(1);return res()}const t0=performance.now();(function s(){const p=clamp((performance.now()-t0)/dur,0,1);fn(ease(p));p<1?requestAnimationFrame(s):res()})()})}
