/* Procedural texture patterns (canvas) */
'use strict';

/* =========================================================
   TEXTURE PATTERNS
   ========================================================= */
function rng(seed){let s=seed%2147483647;if(s<=0)s+=2147483646;return()=>(s=s*16807%2147483647)/2147483647}
function mkCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function drawKind(kind,w=96,h=96){
  const c=mkCanvas(w,h),g=c.getContext('2d'),r=rng(kind.split('').reduce((a,ch)=>a*31+ch.charCodeAt(0),7));
  const fill=col=>{g.fillStyle=col;g.fillRect(0,0,w,h)};
  const hlines=(cols,n,len=.6)=>{for(let i=0;i<n;i++){g.strokeStyle=cols[(r()*cols.length)|0];g.globalAlpha=.25+r()*.5;g.lineWidth=.6+r()*1.4;const y=r()*h,x=r()*w;g.beginPath();g.moveTo(x,y);g.lineTo(x+len*w*(.3+r()),y+(r()-.5)*2);g.stroke()}g.globalAlpha=1};
  const vlines=(cols,n)=>{for(let i=0;i<n;i++){g.strokeStyle=cols[(r()*cols.length)|0];g.globalAlpha=.25+r()*.5;g.lineWidth=.6+r()*1.2;const x=r()*w,y=r()*h;g.beginPath();g.moveTo(x,y);g.lineTo(x+(r()-.5)*2,y+h*(.3+r()*.7));g.stroke()}g.globalAlpha=1};
  const dots=(cols,n,rad=1.4)=>{for(let i=0;i<n;i++){g.fillStyle=cols[(r()*cols.length)|0];g.globalAlpha=.2+r()*.5;g.beginPath();g.arc(r()*w,r()*h,.5+r()*rad,0,7);g.fill()}g.globalAlpha=1};
  const planks=(base,tones,pw)=>{fill(base);const n=Math.ceil(h/pw);for(let i=0;i<n;i++){g.fillStyle=tones[(r()*tones.length)|0];g.globalAlpha=.55;g.fillRect(0,i*pw,w,pw);g.globalAlpha=1;g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,i*pw,w,1);const j=r()*w;g.fillRect(j,i*pw,1,pw)}
    for(let i=0;i<90;i++){g.strokeStyle=tones[(r()*tones.length)|0];g.globalAlpha=.25;g.lineWidth=.7;const y=r()*h,x=r()*w;g.beginPath();g.moveTo(x,y);g.lineTo(x+w*.3*r(),y);g.stroke()}g.globalAlpha=1};
  switch(kind){
    case 'oak':fill('#74716d');hlines(['#5b5854','#8d8984','#4c4a47'],120);break;
    case 'ash':fill('#c4c1bb');for(let y=0;y<h;y+=12){g.fillStyle='#a8a59f';g.fillRect(0,y,w,1.5)}hlines(['#b0ada7','#d6d3cd'],60);break;
    case 'slat':for(let x=0;x<w;x+=8){g.fillStyle=(x/8)%2?'#cf9450':'#bd7d3a';g.fillRect(x,0,7,h);g.fillStyle='#5a3a1a';g.fillRect(x+7,0,1,h)}vlines(['#e0a965','#9a642a'],70);break;
    case 'walnut':fill('#42332a');vlines(['#2b2019','#5a463b','#33261e'],150);break;
    case 'concrete':{fill('#8f9195');dots(['#6e7074','#a7a9ad','#7c7e82'],260,1.2);const gr=g.createRadialGradient(w/2,h/2,4,w/2,h/2,w*.7);gr.addColorStop(0,'rgba(255,255,255,.14)');gr.addColorStop(1,'rgba(0,0,0,.18)');g.fillStyle=gr;g.fillRect(0,0,w,h)}break;
    case 'charcoal':{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#2a2a2c');gr.addColorStop(.5,'#3a3a3d');gr.addColorStop(1,'#242426');g.fillStyle=gr;g.fillRect(0,0,w,h);vlines(['#444447','#1d1d1f'],60)}break;
    case 'sand':fill('#b9a98f');dots(['#a39478','#cdbfa6'],200,1.6);break;
    case 'cork':fill('#d49a5e');dots(['#b87c42','#e8b883','#9a6532','#f0c995'],420,2.2);break;
    case 'fire':fill('#bab4a8');dots(['#a49e92','#d0cabe'],300,1.5);hlines(['#aaa498'],30);break;
    case 'noise':fill('#a3b2a5');dots(['#8d9d90','#bccabd'],300,2);break;
    case 'thermal':fill('#e5d6c1');dots(['#d4c3aa','#f2e7d6'],260,1.8);break;
    case 'eps':fill('#ecece8');dots(['#d7d7d2','#fafaf8'],420,2.2);break;
    case 'wool':fill('#d9c36b');hlines(['#c0aa4f','#ecd98a','#b79f44'],260,.4);break;
    case 'pir':fill('#c9a37a');for(let y=0;y<h;y+=16){g.fillStyle='rgba(255,255,255,.18)';g.fillRect(0,y,w,1.5)}dots(['#b78d63','#dbb78f'],120,1.4);break;
    case 'cellulose':fill('#9d9183');hlines(['#85796b','#b3a799','#6f6558'],240,.35);break;
    case 'corkb':fill('#a77b4d');dots(['#8a6137','#c39563','#6f4b28'],380,2);break;
    case 'wfibre':fill('#b79b73');hlines(['#9d8157','#cdb28a'],220,.5);break;
    case 'hemp':fill('#8f8c62');hlines(['#77744d','#a8a578'],240,.4);break;
    case 'tile':fill('#b9674a');for(let y=0;y<h;y+=16){for(let x=((y/16)%2)*12;x<w;x+=24){g.fillStyle='#c97955';g.fillRect(x,y,22,14);g.fillStyle='#8c4a33';g.fillRect(x,y+14,22,2)}}break;
    case 'ondulin':fill('#3f4a45');for(let x=0;x<w;x+=12){const gr=g.createLinearGradient(x,0,x+12,0);gr.addColorStop(0,'#2d3631');gr.addColorStop(.5,'#59675f');gr.addColorStop(1,'#2d3631');g.fillStyle=gr;g.fillRect(x,0,12,h)}break;
    case 'soft':fill('#d3d0c9');for(let y=0;y<h;y+=12){for(let x=((y/12)%2)*9;x<w;x+=18){g.fillStyle='#e0ddd6';g.fillRect(x,y,17,10);g.fillStyle='#b9b6af';g.fillRect(x,y+10,17,2)}}break;
    case 'tech':fill('#101012');g.fillStyle='#3a6ea5';g.beginPath();g.arc(w/2,h/2,w*.32,0,7);g.fill();g.fillStyle='#0b0b0c';g.beginPath();g.arc(w/2,h/2,w*.18,0,7);g.fill();g.fillStyle='#cfe6ff';g.beginPath();g.arc(w*.45,h*.46,w*.05,0,7);g.fill();break;
    case 'land':{const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#8cd24f');gr.addColorStop(1,'#2f7a2a');g.fillStyle=gr;g.fillRect(0,0,w,h);hlines(['#b5ec74','#1f5a1d'],140,.3)}break;
    /* interior floors */
    case 'f_oak':planks('#b88a55',['#c79a64','#a97a47','#bf9059','#d0a672'],h/6);break;
    case 'f_walnut':planks('#5a3f2d',['#664a36','#4d3424','#70513c','#563b2a'],h/6);break;
    case 'f_ash':planks('#cdbca1',['#d8c9b0','#c4b295','#e0d3bc','#bfae92'],h/6);break;
    case 'f_marble':{fill('#e9e6e0');for(let i=0;i<9;i++){g.strokeStyle='rgba(120,120,130,'+(.12+r()*.2)+')';g.lineWidth=.6+r()*1.6;g.beginPath();let x=r()*w,y=0;g.moveTo(x,y);for(let k=0;k<6;k++){x+=(r()-.5)*40;y+=h/6;g.lineTo(x,y)}g.stroke()}g.strokeStyle='rgba(0,0,0,.15)';g.lineWidth=1;g.strokeRect(.5,.5,w-1,h-1)}break;
    case 'f_terrazzo':{fill('#d9d3c8');const cols=['#8f7a65','#c4a47a','#5b6a73','#e8e1d3','#a85f4a'];for(let i=0;i<110;i++){g.fillStyle=cols[(r()*cols.length)|0];g.beginPath();const x=r()*w,y=r()*h,s=1.5+r()*4;g.moveTo(x,y);g.lineTo(x+s,y+s*.3);g.lineTo(x+s*.6,y+s);g.closePath();g.fill()}}break;
    case 'f_tile':{fill('#cfd3d4');g.strokeStyle='rgba(60,70,75,.5)';g.lineWidth=1.5;for(let i=0;i<=w;i+=w/2){g.beginPath();g.moveTo(i,0);g.lineTo(i,h);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(w,i);g.stroke()}dots(['#bdc2c4','#dfe3e4'],160,1.4)}break;
    case 'f_deck':planks('#8a6a46',['#9a7852','#7d5f3f','#a68360','#725636'],h/8);break;
    default:fill('#777');
  }
  return c;
}
const kindURL={};
const urlOf=k=>kindURL[k]||(kindURL[k]=`url(${drawKind(k,96,96).toDataURL()})`);

function setSliderFill(inp){const p=(inp.value-inp.min)/(inp.max-inp.min)*100;inp.style.setProperty('--p',p+'%')}
$$('.slider').forEach(i=>{setSliderFill(i);i.addEventListener('input',()=>setSliderFill(i))});
