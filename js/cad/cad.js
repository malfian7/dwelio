/* CAD sheets generated as SVG from the house data */
'use strict';

/* =========================================================
   CAD DRAWINGS (SVG sheets generated from the house data)
   ========================================================= */
const CAD=(function(){
  const svg=$('#cad'),viewG=$('#cadView'),gridG=$('#cadGrid'),sheetG=$('#cadSheet'),measG=$('#cadMeas');
  const status=$('#statusbar'),titleblock=$('#titleblock'),cross=$('#cadCross'),chV=$('#chV'),chH=$('#chH'),snapBox=$('#snapBox');
  const LAYERS=[
    {id:'walls',name:'Walls & outlines',v:'--c-walls'},{id:'hatch',name:'Wall hatch',v:'--c-hatch'},{id:'win',name:'Windows',v:'--c-win'},{id:'door',name:'Doors & stairs',v:'--c-door'},
    {id:'furn',name:'Furniture',v:'--c-furn'},{id:'dim',name:'Dimensions',v:'--c-dim'},{id:'text',name:'Room labels',v:'--c-text'},{id:'hid',name:'Hidden / above',v:'--c-hid'},{id:'lvl',name:'Level marks',v:'--c-lvl'},{id:'grid',name:'Grid',v:'--c-gridM'}
  ];
  const off=new Set();
  const css=document.createElement('style');css.textContent=LAYERS.map(l=>`#cad[data-off~="${l.id}"] .lay-${l.id}{display:none}`).join('\n')+'\n#cad .c-solid{fill:var(--c-walls);stroke:var(--c-walls);stroke-width:calc(var(--lw)*.6px)}';document.head.appendChild(css);

  /* ---------- primitive helpers ---------- */
  const SHEETS={};
  function newSheet(id,no,title,short,yFlip){return{id,no,title,short,yFlip:!!yFlip,prims:[],snap:[],meas:[]}}
  const line=(s,L,x1,y1,x2,y2,cls)=>{s.prims.push({t:'line',L,cls:cls||L,x1,y1,x2,y2});return s};
  const poly=(s,L,pts,closed,cls)=>{s.prims.push({t:'poly',L,cls:cls||L,pts,closed:!!closed})};
  const text=(s,L,x,y,str,h,anc,cls,rot)=>{s.prims.push({t:'text',L,cls:cls||'t-'+L,x,y,str,h:h||.17,anc:anc||'middle',rot:rot||0})};
  const rect=(s,L,x0,y0,x1,y1,cls)=>poly(s,L,[[x0,y0],[x1,y0],[x1,y1],[x0,y1]],true,cls);
  const mm=v=>String(Math.round(Math.abs(v)*1000));
  function dimH(s,xa,xb,yRef,yLine,label){
    const d=yLine>yRef?1:-1;
    line(s,'dim',xa,yRef+d*.08,xa,yLine+d*.12);line(s,'dim',xb,yRef+d*.08,xb,yLine+d*.12);
    line(s,'dim',xa-.05,yLine,xb+.05,yLine);
    line(s,'dim',xa-.07,yLine+.07,xa+.07,yLine-.07);line(s,'dim',xb-.07,yLine+.07,xb+.07,yLine-.07);
    text(s,'dim',(xa+xb)/2,yLine-.07,label||mm(xb-xa),.16,'middle','t-dim');
  }
  function dimV(s,ya,yb,xRef,xLine,label){
    const d=xLine>xRef?1:-1;
    line(s,'dim',xRef+d*.08,ya,xLine+d*.12,ya);line(s,'dim',xRef+d*.08,yb,xLine+d*.12,yb);
    line(s,'dim',xLine,ya-.05,xLine,yb+.05);
    line(s,'dim',xLine-.07,ya+.07,xLine+.07,ya-.07);line(s,'dim',xLine-.07,yb+.07,xLine+.07,yb-.07);
    text(s,'dim',xLine-.07,(ya+yb)/2,label||mm(yb-ya),.16,'middle','t-dim',-90);
  }
  const snapPts=(s,pts)=>pts.forEach(p=>s.snap.push(p));

  /* ---------- plan sheets ---------- */
  function drawPlanWall(s,w){
    const ops=[...w.op].sort((a,b)=>a.a0-b.a0),segs=[];let cur=w.a0;
    ops.forEach(o=>{if(o.a0>cur+1e-6)segs.push([cur,o.a0]);cur=o.a1});if(w.a1>cur+1e-6)segs.push([cur,w.a1]);
    const P=(a,c)=>w.axis==='x'?[a,c]:[c,a];
    const inward=!w.outer?1:(w.outer==='+z'||w.outer==='+x')?-1:1;
    segs.forEach(([s0,s1])=>{
      poly(s,'hatch',[P(s0,w.c0),P(s1,w.c0),P(s1,w.c1),P(s0,w.c1)],true,'c-hatchf');
      let a=P(s0,w.c0),b=P(s1,w.c0);line(s,'walls',a[0],a[1],b[0],b[1]);a=P(s0,w.c1);b=P(s1,w.c1);line(s,'walls',a[0],a[1],b[0],b[1]);
      snapPts(s,[P(s0,w.c0),P(s0,w.c1),P(s1,w.c0),P(s1,w.c1)]);
    });
    // end caps at openings
    ops.forEach(o=>{[o.a0,o.a1].forEach(a=>{const p=P(a,w.c0),q=P(a,w.c1);line(s,'walls',p[0],p[1],q[0],q[1])});
      const wd=o.a1-o.a0,mid=(o.a0+o.a1)/2,cm=(w.c0+w.c1)/2;
      if(o.k==='window'||(o.k==='door'&&o.sl)){
        [w.c0,cm,w.c1].forEach(c=>{const p=P(o.a0,c),q=P(o.a1,c);line(s,'win',p[0],p[1],q[0],q[1])});
        if(o.k==='door'){const c1=w.c0+(w.c1-w.c0)*.3,c2=w.c0+(w.c1-w.c0)*.7;let p=P(o.a0+.05,c1),q=P(mid+.1,c1);line(s,'door',p[0],p[1],q[0],q[1]);p=P(mid-.1,c2);q=P(o.a1-.05,c2);line(s,'door',p[0],p[1],q[0],q[1])}
      }else if(o.k==='door'){
        // swing door: leaf + quarter arc
        const hc=inward>0?w.c1:w.c0,pts=[];
        const leafEnd=w.axis==='x'?[o.a0,hc+inward*wd]:[hc+inward*wd,o.a0];
        const hinge=P(o.a0,hc);line(s,'door',hinge[0],hinge[1],leafEnd[0],leafEnd[1]);
        for(let i=0;i<=14;i++){const t=i/14*Math.PI/2;let x,y;
          if(w.axis==='x'){x=o.a0+wd*Math.cos(t);y=hc+inward*wd*Math.sin(t)}else{x=hc+inward*wd*Math.sin(t);y=o.a0+wd*Math.cos(t)}pts.push([x,y])}
        poly(s,'door',pts,false);
      }
    });
    // wall end lines
    const endLn=a=>{const p=P(a,w.c0),q=P(a,w.c1);line(s,'walls',p[0],p[1],q[0],q[1])};
    if(w.ends==='both'||w.ends==='a0')endLn(w.a0);if(w.ends==='both'||w.ends==='a1')endLn(w.a1);
  }
  function planSheet(lv){
    const s=newSheet('plan'+lv,'A-10'+(lv+1),lv?'First floor plan':'Ground floor plan',lv?'First floor':'Ground floor');
    WALLS.filter(w=>w.lv===lv).forEach(w=>drawPlanWall(s,w));
    // furniture
    FURN.filter(f=>f.lv===lv).forEach(f=>{const b=f.b;if(f.m==='rug'){const p=[[b[0],b[4]],[b[1],b[4]],[b[1],b[5]],[b[0],b[5]]];poly(s,'furn',p,true,'c-hid')}else rect(s,'furn',b[0],b[4],b[1],b[5])});
    PLANTS.filter(p=>p.lv===lv).forEach(p=>{const pts=[];for(let i=0;i<16;i++){const a=i/16*Math.PI*2;pts.push([p.x+Math.cos(a)*.24,p.z+Math.sin(a)*.24])}poly(s,'furn',pts,true)});
    // stair
    const st=STAIR,run=(st.x1-st.x0)/st.steps;
    if(lv===0){rect(s,'door',st.x0,st.z0,st.x1,st.z1);for(let i=1;i<st.steps;i++)line(s,'door',st.x0+i*run,st.z0,st.x0+i*run,st.z1);
      line(s,'door',st.x0+.2,(st.z0+st.z1)/2,st.x1-.25,(st.z0+st.z1)/2);poly(s,'door',[[st.x1-.45,(st.z0+st.z1)/2-.1],[st.x1-.2,(st.z0+st.z1)/2],[st.x1-.45,(st.z0+st.z1)/2+.1]],false);
      text(s,'text',st.x0+.5,st.z0+.18,'UP',.13,'start','t-text')}
    else{poly(s,'hid',[[st.x0,st.z0],[st.x1,st.z0],[st.x1,st.z1],[st.x0,st.z1]],true);for(let i=1;i<st.steps;i+=1)line(s,'hid',st.x0+i*run,st.z0,st.x0+i*run,st.z1);text(s,'text',st.x1-.45,st.z1-.1,'DN',.13,'end','t-text')}
    // exterior items
    if(lv===0){
      rect(s,'door',-2.0,3.3,-.8,5.82);for(let i=1;i<6;i++)line(s,'door',-2.0,3.3+i*.42,-.8,3.3+i*.42);
      poly(s,'hid',[[-4.5,1.0],[.5,1.0],[.5,3.3],[-4.5,3.3]],true);poly(s,'hid',[[.5,.75],[4.9,.75],[4.9,3.4],[.5,3.4]],true);
      text(s,'text',-2,2.2,'BALCONY ABOVE',.13,'middle','t-text');
      [[-6.4,-3.7,3.9,4.75],[-1.4,1.7,4.2,5.0],[2.6,5.6,4.3,5.1]].forEach(p=>rect(s,'furn',p[0],p[2],p[1],p[3]));
      rect(s,'walls',-7.2,.9,.5,5.2,'c-hid');
    }else{
      rect(s,'walls',-4.5,1.0,.5,3.3);line(s,'walls',-4.44,1.0,-4.44,3.3);line(s,'win',-4.5,3.24,.5,3.24);
      for(let x=-4.0;x<.5;x+=.5)line(s,'furn',x,1.1,x,3.2,'c-hid');
      text(s,'text',-2,2.2,'BALCONY',.2,'middle','t-text');text(s,'text',-2,2.47,'11.0 m²',.14,'middle','t-text');
    }
    // room labels
    ROOMS.filter(r=>r.lv===lv&&!(lv===0&&false)).forEach(r=>{
      const[x0,x1,z0,z1]=r.r;if(r.id==='balcony')return;const cx=(x0+x1)/2,cz=(z0+z1)/2;
      text(s,'text',cx,cz-.05,r.name.toUpperCase(),.15,'middle','t-text');text(s,'text',cx,cz+.17,((x1-x0)*(z1-z0)).toFixed(1)+' m²',.13,'middle','t-text');
    });
    // dimensions
    if(lv===0){
      const xs=[-4.5,-4.0,-2.2,-.9,-.3,.5,.9,2.9,3.7,4.0];for(let i=0;i<xs.length-1;i++)dimH(s,xs[i],xs[i+1],1.0,2.0+(i%2)*.0);
      dimH(s,-4.5,.5,1.0,2.55);dimH(s,.5,4.0,1.0,2.55);dimH(s,-4.5,4.0,1.0,3.1);
      dimV(s,-3.2,1.0,-4.5,-5.5);dimV(s,-2.0,1.0,4.0,5.0);dimV(s,-3.2,-2.0,-4.5,-5.0,'1200');
    }else{
      const xs=[-4.5,-4.0,-2.3,-1.6,-.35,.5,.95,2.35,2.95,4.5,4.9];for(let i=0;i<xs.length-1;i++)dimH(s,xs[i],xs[i+1],3.4,4.3);
      dimH(s,-4.5,.5,3.4,4.85);dimH(s,.5,4.9,3.4,4.85);dimH(s,-4.5,4.9,3.4,5.4);
      dimV(s,-3.2,1.0,-4.5,-5.4);dimV(s,1.0,3.3,-4.5,-5.4);dimV(s,-2.4,3.4,4.9,5.9);
    }
    // north arrow + scale bar
    const nx=-6.2,nz=-2.4;const pts=[];for(let i=0;i<24;i++){const a=i/24*Math.PI*2;pts.push([nx+Math.cos(a)*.42,nz+Math.sin(a)*.42])}poly(s,'dim',pts,true);
    poly(s,'dim',[[nx,nz-.36],[nx+.12,nz+.16],[nx,nz+.08],[nx-.12,nz+.16]],true,'c-solid');text(s,'dim',nx,nz-.55,'N',.2,'middle','t-dim');
    const by=lv?6.4:6.7;for(let i=0;i<5;i++){poly(s,'dim',[[-4.5+i,by],[-3.5+i,by],[-3.5+i,by+.12],[-4.5+i,by+.12]],true,i%2?'c-dim':'c-solid')}
    [0,1,2,3,4,5].forEach(i=>text(s,'dim',-4.5+i,by+.38,String(i)+(i===5?' m':''),.13,'middle','t-dim'));
    return s;
  }

  /* ---------- elevation sheets ---------- */
  function elevSheet(kind){
    const front=kind==='front';
    const s=newSheet(kind,'A-'+(front?'103':'104'),front?'Front elevation (south)':'Side elevation (east)',front?'Front elevation':'Side elevation',true);
    const X=front?(x,z)=>x:(x,z)=>-z;     // horizontal axis
    const items=[];
    const sol=(a0,a1,y0,y1,d)=>items.push({d,k:'sol',pts:[[a0,-y1],[a1,-y1],[a1,-y0],[a0,-y0]]});
    if(front){
      sol(-7.5,7.5,-.7,0,5.5);sol(-7.2,.5,0,.25,5.2);
      sol(-4.5,.5,0,6.2,1.0);sol(-4.7,.7,6.2,6.5,1.2);sol(-1.6,-.2,6.5,7.1,-1.3);
      sol(.5,4.0,0,2.8,1.0);sol(.5,4.9,2.8,6.2,3.4);sol(.4,5.0,6.2,6.78,3.5);
      sol(-4.5,.5,2.8,3.1,3.3);sol(4.5,4.82,0,2.8,3.42);sol(-4.4,-4.1,0,2.8,3.3);
      sol(-6.4,-3.7,.25,.8,4.75);sol(-1.4,1.7,0,.55,5.0);sol(2.6,5.6,0,.55,5.1);
    }else{
      sol(-5.5,5.5,-.7,0,7.5);sol(-5.2,-.9,0,.25,7.2);
      sol(-1.0,3.2,0,6.2,.5);sol(-1.2,3.4,6.2,6.5,.7);
      sol(-1.0,2.0,0,2.8,4.0);sol(-3.4,2.4,2.8,6.2,4.9);sol(-3.5,2.5,6.2,6.78,5.0);
      sol(-3.42,-3.1,0,2.8,4.82);sol(-5.1,-4.3,0,.55,5.6);
    }
    // normalise solids for the side view (x axis is -z)
    const fixed=[];
    if(front){items.forEach(it=>fixed.push(it))}
    else{
      // side: given as [zmin,zmax] in the first two args -> convert to sx=-z
      items.forEach(it=>{const xs=it.pts.map(p=>p[0]);const mn=Math.min(...xs),mx=Math.max(...xs);
        fixed.push({d:it.d,k:'sol',pts:it.pts.map(p=>[p[0]===mn?-mx:-mn,p[1]])})});
    }
    // windows
    WALLS.filter(w=>front?(w.outer==='+z'):(w.outer==='+x')).forEach(w=>w.op.forEach(o=>{
      if(!(o.k==='window'||(o.k==='door'&&o.sl)))return;
      const a=front?o.a0:-o.a1,b=front?o.a1:-o.a0;fixed.push({d:w.c1+.0005,k:'win',a,b,y0:o.b0,y1:o.b1,door:o.k==='door'});
    }));
    fixed.sort((p,q)=>p.d-q.d);
    fixed.forEach(it=>{
      if(it.k==='sol'){poly(s,'walls',it.pts,true,'c-sil');snapPts(s,it.pts)}
      else{const{a,b,y0,y1}=it;rect(s,'win',a,-y1,b,-y0);const wd=b-a,n=Math.max(0,Math.round(wd/1.4)-1);for(let i=1;i<=n;i++)line(s,'win',a+i*wd/(n+1),-y1,a+i*wd/(n+1),-y0);
        line(s,'win',a+.08,-y0-.12,a+Math.min(.5,wd*.35),-y0-.55,'c-hid');line(s,'win',a+.08,-y0-.4,a+Math.min(.75,wd*.5),-y0-.95,'c-hid');
        snapPts(s,[[a,-y1],[b,-y1],[a,-y0],[b,-y0]])}
    });
    // level marks
    const L=[[0,'±0.000'],[2.8,'+2.800'],[3.1,'+3.100'],[6.2,'+6.200'],[6.78,'+6.780']];
    const xl=front?-8.6:-6.4,xr=front?8.4:6.6;
    L.forEach(([y,t])=>{line(s,'lvl',xl,-y,xr,-y);poly(s,'lvl',[[xr+.05,-y],[xr+.3,-y-.14],[xr+.3,-y+.14]],true,'c-solid');text(s,'lvl',xr+.4,-y+.05,t,.15,'start','t-lvl')});
    // dimensions
    const dx=front?-9.5:-7.3;
    for(let i=0;i<L.length-1;i++)dimV(s,-L[i+1][0],-L[i][0],xl,dx);
    dimV(s,-6.78,0,xl,dx-.7);
    if(front){dimH(s,-4.5,.5,0,.95);dimH(s,.5,4.9,0,.95);dimH(s,-4.5,4.9,0,1.5)}
    else{dimH(s,-3.4,3.2,0,.95,'6600');dimH(s,-3.4,2.4,0,1.5,'5800')}
    return s;
  }

  SHEETS.plan0=planSheet(0);SHEETS.plan1=planSheet(1);SHEETS.front=elevSheet('front');SHEETS.side=elevSheet('side');
  const ORDER=['plan0','plan1','front','side'];

  /* ---------- bounds ---------- */
  function bounds(s){
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;const add=(x,y)=>{x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)};
    s.prims.forEach(p=>{if(p.t==='line'){add(p.x1,p.y1);add(p.x2,p.y2)}else if(p.t==='poly')p.pts.forEach(q=>add(q[0],q[1]));else if(p.t==='text')add(p.x,p.y)});
    return{x0,y0,x1,y1};
  }
  ORDER.forEach(id=>SHEETS[id].b=bounds(SHEETS[id]));

  /* ---------- on-screen rendering ---------- */
  const f=n=>(Math.round(n*1000)/1000);
  const layerOf=p=>p.cls==='c-hatchf'?'hatch':(p.cls==='c-sil'||p.cls==='c-solid')?(p.cls==='c-solid'&&p.L==='dim'?'dim':p.L==='lvl'?'lvl':'walls'):p.L;
  function primSVG(p){
    const lay='lay-'+(p.cls==='c-hatchf'?'hatch':p.L);
    if(p.t==='line')return`<path class="L c-${p.cls} ${lay}" d="M${f(p.x1)} ${f(p.y1)}L${f(p.x2)} ${f(p.y2)}"/>`;
    if(p.t==='poly'){const cl=p.cls.startsWith('c-')?p.cls:'c-'+p.cls;return`<path class="L ${cl} ${lay}" d="M${p.pts.map(q=>f(q[0])+' '+f(q[1])).join('L')}${p.closed?'Z':''}"/>`}
    if(p.t==='text')return`<text class="${p.cls} ${lay}" x="${f(p.x)}" y="${f(p.y)}" font-size="${p.h}" text-anchor="${p.anc}"${p.rot?` transform="rotate(${p.rot} ${f(p.x)} ${f(p.y)})"`:''}>${String(p.str).replace(/&/g,'&amp;')}</text>`;
    return'';
  }
  const cad={x:0,y:0,s:50,tx:0,ty:0,ts:50,cur:ORDER[0],tool:'pan',snap:true,grid:true,paper:false,lw:1.4,active:false,mouse:null,mstart:null,hooks:{}};
  let anim=false;
  let projName='Casa Terra';
  function setProject(n){projName=n;if(cad.active)updateTitle()}
  function availRect(){
    const W=svg.clientWidth,H=svg.clientHeight,desk=window.innerWidth>900;
    return{l:desk?372:12,r:W-(desk?132:12),t:84,b:H-(desk?92:150)};
  }
  function fitTarget(){
    const b=SHEETS[cad.cur].b,a=availRect(),w=b.x1-b.x0,h=b.y1-b.y0,pad=.7;
    const s=Math.min((a.r-a.l)/(w+pad*2),(a.b-a.t)/(h+pad*2));
    return{s,x:a.l+((a.r-a.l)-w*s)/2-b.x0*s,y:a.t+((a.b-a.t)-h*s)/2-b.y0*s};
  }
  function fit(immediate){const t=fitTarget();cad.tx=t.x;cad.ty=t.y;cad.ts=t.s;if(immediate){cad.x=t.x;cad.y=t.y;cad.s=t.s;apply()}kick()}
  function apply(){
    viewG.setAttribute('transform',`translate(${cad.x.toFixed(2)} ${cad.y.toFixed(2)}) scale(${cad.s.toFixed(4)})`);
    svg.style.setProperty('--lw',(cad.lw/cad.s).toFixed(5));
    drawGrid();updateTitle();
  }
  function kick(){if(!anim){anim=true;requestAnimationFrame(loop)}}
  function loop(){
    const k=REDUCED?1:.22;cad.x=lerp(cad.x,cad.tx,k);cad.y=lerp(cad.y,cad.ty,k);cad.s=lerp(cad.s,cad.ts,k);
    if(Math.abs(cad.x-cad.tx)<.05&&Math.abs(cad.y-cad.ty)<.05&&Math.abs(cad.s-cad.ts)<.0005){cad.x=cad.tx;cad.y=cad.ty;cad.s=cad.ts;anim=false;apply();return}
    apply();requestAnimationFrame(loop);
  }
  function drawGrid(){
    const W=svg.clientWidth,H=svg.clientHeight;let step=1;while(step*cad.s<14)step*=5;
    const x0=Math.floor((-cad.x/cad.s)/step)*step,x1=(W-cad.x)/cad.s,y0=Math.floor((-cad.y/cad.s)/step)*step,y1=(H-cad.y)/cad.s;
    let dm='',dM='';
    for(let x=x0;x<=x1;x+=step){const isM=Math.abs(Math.round(x/step)%5)===0;(isM?(dM+=`M${x} ${y0}V${y1}`):(dm+=`M${x} ${y0}V${y1}`))}
    for(let y=y0;y<=y1;y+=step){const isM=Math.abs(Math.round(y/step)%5)===0;(isM?(dM+=`M${x0} ${y}H${x1}`):(dm+=`M${x0} ${y}H${x1}`))}
    const key=[x0,x1,y0,y1,step].join();if(gridG.dataset.k===key)return;gridG.dataset.k=key;
    gridG.innerHTML=`<path class="L c-grid lay-grid" d="${dm}"/><path class="L c-gridM lay-grid" d="${dM}"/>`;
  }
  function niceScale(){const m=1000/(cad.s*.2646);const std=[10,20,25,50,75,100,125,150,200,250,300,400,500];let b=std[0];std.forEach(v=>{if(Math.abs(v-m)<Math.abs(b-m))b=v});return b}
  function updateTitle(){
    const s=SHEETS[cad.cur],d=new Date();
    titleblock.innerHTML=`<div class="r"><span>PROJECT</span><span class="big">${projName}</span></div><div class="r"><span>SHEET</span><span>${s.no} — ${s.title}</span></div><div class="r"><span>SCALE</span><span>1:${niceScale()} @ A3</span></div><div class="r"><span>DATE</span><span>${d.toLocaleDateString('en-GB')} · REV C</span></div><div class="r"><span>UNITS</span><span>millimetres</span></div>`;
  }
  function statusUpdate(){
    const s=SHEETS[cad.cur],m=cad.mouse;
    let xs='—',ys='—';if(m){xs=(m.x*1000).toFixed(0);ys=((s.yFlip?-m.y:m.y)*1000).toFixed(0)}
    const tool=cad.tool==='measure'?(cad.mstart?'MEASURE · pick end point':'MEASURE · pick start point'):'PAN / ZOOM';
    status.innerHTML=`<span>X <b>${xs}</b></span><span>Y <b>${ys}</b></span><span class="sp"></span><span>${tool}</span><span>SNAP <b class="${cad.snap?'on':''}">${cad.snap?'ON':'OFF'}</b></span><span>GRID <b class="${cad.grid?'on':''}">${cad.grid?'ON':'OFF'}</b></span><span>ZOOM <b>${Math.round(cad.s/50*100)}%</b></span>`;
  }

  /* ---------- sheet loading + draw-in animation ---------- */
  function renderSheet(id,animate){
    const s=SHEETS[id];cad.cur=id;
    sheetG.innerHTML=s.prims.map(primSVG).join('');
    renderMeasures();updateTitle();
    if(!animate||REDUCED)return;
    const delays={'c-walls':0,'c-win':220,'c-door':300,'c-furn':360,'c-dim':520,'c-sil':0};let n=0;
    $$('#cadSheet path.L',svg).forEach(el=>{
      const cls=[...el.classList].find(c=>delays[c]!==undefined);
      if(!cls||el.classList.contains('c-hid')||el.classList.contains('c-lvl')||el.classList.contains('c-sil')||el.classList.contains('c-solid')){return}
      let len=0;try{len=el.getTotalLength()}catch(_){}if(!len)return;
      el.style.strokeDasharray=len;el.style.strokeDashoffset=len;
      const an=el.animate([{strokeDashoffset:len},{strokeDashoffset:0}],{duration:520+Math.min(len*35,500),delay:delays[cls]+Math.min(n++*1.4,260),easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'});
      an.onfinish=()=>{el.style.strokeDasharray='';el.style.strokeDashoffset='';an.cancel()};
    });
    $$('#cadSheet text,#cadSheet .c-hatchf,#cadSheet .c-sil,#cadSheet .c-hid,#cadSheet .c-lvl',svg).forEach(el=>{el.animate([{opacity:0},{opacity:1}],{duration:520,delay:420,easing:'ease-out',fill:'backwards'})});
  }
  function setSheet(id,{animate=true,keepView=false}={}){
    if(!SHEETS[id])return;cad.mstart=null;
    renderSheet(id,animate);
    if(!keepView){fit(false);if(animate&&!REDUCED){cad.s=cad.ts*.9;cad.x=cad.tx+40;cad.y=cad.ty+20;kick()}}
    cad.hooks.sheet&&cad.hooks.sheet(id);statusUpdate();
  }

  /* ---------- measurements ---------- */
  function renderMeasures(){
    const s=SHEETS[cad.cur];measG.innerHTML=s.meas.map(m=>{
      const dx=m.x2-m.x1,dy=m.y2-m.y1,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len,o=.25;
      const ax=m.x1+nx*o,ay=m.y1+ny*o,bx=m.x2+nx*o,by=m.y2+ny*o,ang=Math.atan2(dy,dx)*180/Math.PI,rot=ang>90||ang<-90?ang+180:ang;
      return`<g><path class="c-meas L" d="M${m.x1} ${m.y1}L${f(ax)} ${f(ay)}M${m.x2} ${m.y2}L${f(bx)} ${f(by)}M${f(ax)} ${f(ay)}L${f(bx)} ${f(by)}"/><circle cx="${m.x1}" cy="${m.y1}" r="${.05}" fill="#ffd23f"/><circle cx="${m.x2}" cy="${m.y2}" r=".05" fill="#ffd23f"/><text class="t-meas" font-size=".18" text-anchor="middle" x="${f((ax+bx)/2+nx*.1)}" y="${f((ay+by)/2+ny*.1)}" transform="rotate(${f(rot)} ${f((ax+bx)/2+nx*.1)} ${f((ay+by)/2+ny*.1)})">${mm(len)}</text></g>`}).join('');
    cad.hooks.measures&&cad.hooks.measures(s.meas.map(m=>Math.round(Math.hypot(m.x2-m.x1,m.y2-m.y1)*1000)));
  }
  function addMeasure(a,b){const s=SHEETS[cad.cur];if(Math.hypot(b.x-a.x,b.y-a.y)<.02)return;s.meas.push({x1:a.x,y1:a.y,x2:b.x,y2:b.y});renderMeasures()}
  function removeMeasure(i){SHEETS[cad.cur].meas.splice(i,1);renderMeasures()}
  function clearRubber(){const r=$('#rubber',measG);if(r)r.remove()}

  /* ---------- pointer interaction ---------- */
  const toWorld=(cx,cy)=>{const r=svg.getBoundingClientRect();return{x:(cx-r.left-cad.x)/cad.s,y:(cy-r.top-cad.y)/cad.s,sx:cx-r.left,sy:cy-r.top}};
  function snapPoint(w){
    const s=SHEETS[cad.cur];let best=null,bd=13/cad.s;
    if(cad.snap){
      for(const p of s.snap){const d=Math.hypot(p[0]-w.x,p[1]-w.y);if(d<bd){bd=d;best={x:p[0],y:p[1],end:true}}}
      if(!best){const g=cad.s>90?.05:.1;best={x:Math.round(w.x/g)*g,y:Math.round(w.y/g)*g,end:false}}
    }else best={x:w.x,y:w.y,end:false};
    return best;
  }
  let pd=null;
  svg.addEventListener('pointerdown',e=>{pd={x:e.clientX,y:e.clientY,tx:cad.tx,ty:cad.ty,moved:false};try{svg.setPointerCapture(e.pointerId)}catch(_){}svg.style.cursor='grabbing'});
  svg.addEventListener('pointermove',e=>{
    const w=toWorld(e.clientX,e.clientY),sp=snapPoint(w);cad.mouse=sp;
    cross.style.display='';chV.setAttribute('x1',w.sx);chV.setAttribute('x2',w.sx);chH.setAttribute('y1',w.sy);chH.setAttribute('y2',w.sy);
    const spx=sp.x*cad.s+cad.x,spy=sp.y*cad.s+cad.y;
    if(sp.end){snapBox.style.display='';snapBox.setAttribute('x',spx-5);snapBox.setAttribute('y',spy-5)}else snapBox.style.display='none';
    if(pd){const dx=e.clientX-pd.x,dy=e.clientY-pd.y;if(Math.abs(dx)+Math.abs(dy)>4)pd.moved=true;if(pd.moved){cad.tx=cad.x=pd.tx+dx;cad.ty=cad.y=pd.ty+dy;apply()}}
    if(cad.tool==='measure'&&cad.mstart){
      clearRubber();const a=cad.mstart,b=sp;
      measG.insertAdjacentHTML('beforeend',`<g id="rubber"><path class="c-meas L" d="M${a.x} ${a.y}L${b.x} ${b.y}" stroke-dasharray=".12 .08"/><text class="t-meas" font-size=".18" x="${f(b.x+.15)}" y="${f(b.y-.12)}">${mm(Math.hypot(b.x-a.x,b.y-a.y))}</text></g>`);
    }
    statusUpdate();
  });
  svg.addEventListener('pointerup',e=>{
    const wasDrag=pd&&pd.moved;pd=null;svg.style.cursor='';
    if(!wasDrag&&cad.tool==='measure'){
      const sp=snapPoint(toWorld(e.clientX,e.clientY));
      if(!cad.mstart){cad.mstart=sp;toast('Pick the end point','info')}else{clearRubber();addMeasure(cad.mstart,sp);cad.mstart=null;toast('Distance added to the sheet')}
      statusUpdate();
    }
  });
  svg.addEventListener('pointerleave',()=>{cross.style.display='none';cad.mouse=null;statusUpdate()});
  svg.addEventListener('wheel',e=>{
    e.preventDefault();const r=svg.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top;
    const k=Math.exp(-e.deltaY*.0014),ns=clamp(cad.ts*k,12,400);const wx=(px-cad.tx)/cad.ts,wy=(py-cad.ty)/cad.ts;
    cad.ts=ns;cad.tx=px-wx*ns;cad.ty=py-wy*ns;kick();
  },{passive:false});
  svg.addEventListener('dblclick',()=>fit(false));

  /* ---------- tools / options ---------- */
  function zoomBy(k){const a=availRect(),px=(a.l+a.r)/2,py=(a.t+a.b)/2,ns=clamp(cad.ts*k,12,400),wx=(px-cad.tx)/cad.ts,wy=(py-cad.ty)/cad.ts;cad.ts=ns;cad.tx=px-wx*ns;cad.ty=py-wy*ns;kick()}
  function setTool(t){cad.tool=t;cad.mstart=null;clearRubber();svg.style.cursor='';cad.hooks.tool&&cad.hooks.tool(t);statusUpdate()}
  function toggleLayer(id){off.has(id)?off.delete(id):off.add(id);svg.dataset.off=[...off].join(' ');return!off.has(id)}
  function setSnap(v){cad.snap=v;statusUpdate()}
  function setGrid(v){cad.grid=v;gridG.style.display=v?'':'none';if(v)off.delete('grid');else off.add('grid');svg.dataset.off=[...off].join(' ');statusUpdate()}
  function setPaper(v){cad.paper=v;svg.classList.toggle('paper',v);app.classList.toggle('paper',v)}
  function setLW(v){cad.lw=v;apply()}

  /* ---------- exports ---------- */
  const PAL={walls:[0,0,0],hatch:[.55,.55,.55],win:[.04,.43,.5],door:[.69,.35,0],furn:[.42,.42,.42],dim:[.04,.48,.24],text:[.42,.29,0],hid:[.42,.25,.77],lvl:[.69,.12,.12]};
  const hex=c=>'#'+c.map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('');
  function sheetSVG(id){
    const s=SHEETS[id],b=s.b,pad=2.2,vx=b.x0-pad,vy=b.y0-pad-.4,vw=b.x1-b.x0+pad*2,vh=b.y1-b.y0+pad*2+2.4;
    let out=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(vx)} ${f(vy)} ${f(vw)} ${f(vh)}" width="${Math.round(vw*50)}" height="${Math.round(vh*50)}" font-family="Helvetica,Arial,sans-serif"><rect x="${f(vx)}" y="${f(vy)}" width="${f(vw)}" height="${f(vh)}" fill="#f7f5ef"/>`;
    const sw=.026;
    s.prims.forEach(p=>{
      const L=p.cls==='c-hatchf'?'hatch':p.L,col=hex(PAL[L]||PAL.walls);
      const wd=L==='walls'?sw*1.7:L==='dim'||L==='furn'||L==='win'||L==='door'?sw*.8:sw*.7;
      const dash=p.cls==='c-hid'||L==='hid'?' stroke-dasharray=".25 .12"':L==='lvl'?' stroke-dasharray=".5 .12 .08 .12"':'';
      if(p.t==='line')out+=`<path d="M${f(p.x1)} ${f(p.y1)}L${f(p.x2)} ${f(p.y2)}" stroke="${col}" stroke-width="${wd}" fill="none" stroke-linecap="round"${dash}/>`;
      else if(p.t==='poly'){const fill=p.cls==='c-hatchf'?'#dedbd2':p.cls==='c-sil'?'#f7f5ef':p.cls==='c-solid'?'#000':'none';out+=`<path d="M${p.pts.map(q=>f(q[0])+' '+f(q[1])).join('L')}${p.closed?'Z':''}" stroke="${p.cls==='c-hatchf'?'none':col}" stroke-width="${wd}" fill="${fill}" stroke-linejoin="round"${dash}/>`}
      else if(p.t==='text')out+=`<text x="${f(p.x)}" y="${f(p.y)}" font-size="${p.h}" text-anchor="${p.anc}" fill="${col}"${p.rot?` transform="rotate(${p.rot} ${f(p.x)} ${f(p.y)})"`:''}>${String(p.str).replace(/&/g,'&amp;')}</text>`;
    });
    // title block
    const tx=vx+vw-6.6,ty=vy+vh-2.3;
    out+=`<g><rect x="${f(tx)}" y="${f(ty)}" width="6.3" height="2" fill="#f7f5ef" stroke="#111" stroke-width=".03"/>`;
    [['PROJECT',projName],['SHEET',s.no+' — '+s.title],['SCALE','1:100 @ A3'],['UNITS','millimetres']].forEach((r,i)=>{out+=`<text x="${f(tx+.12)}" y="${f(ty+.4+i*.45)}" font-size=".13" fill="#666">${r[0]}</text><text x="${f(tx+1.3)}" y="${f(ty+.4+i*.45)}" font-size="${i===0?.22:.17}" fill="#111">${r[1]}</text>`;if(i)out+=`<path d="M${f(tx)} ${f(ty+.18+i*.45)}H${f(tx+6.3)}" stroke="#999" stroke-width=".01"/>`});
    return out+'</g></svg>';
  }
  function sheetPDF(id){
    const s=SHEETS[id],b=s.b,PW=1190.55,PH=841.89,M=34,tbH=84,tbW=250;
    const aw=PW-M*2,ah=PH-M*2-tbH-10,w=b.x1-b.x0,h=b.y1-b.y0,fitSc=Math.min(aw/(w+1.2),ah/(h+1.2)),N=[20,25,50,75,100,125,150,200,250,500].find(n=>2834.6/n<=fitSc)||500,sc=2834.6/N;
    const ox=M+(aw-w*sc)/2-b.x0*sc,oy=M+(ah-h*sc)/2-b.y0*sc;
    const X=x=>(ox+x*sc).toFixed(2),Y=y=>(PH-(oy+y*sc)).toFixed(2);
    let c='q\n1 J 1 j\n';
    c+=`0.97 0.96 0.94 rg 0 0 ${PW} ${PH} re f\n0 0 0 RG 0.8 w ${M} ${M} ${PW-M*2} ${PH-M*2} re S\n`;
    s.prims.forEach(p=>{
      const L=p.cls==='c-hatchf'?'hatch':p.L,col=PAL[L]||PAL.walls;
      const lw=(L==='walls'?1.3:L==='hatch'?0:.55);
      const dash=(p.cls==='c-hid'||L==='hid')?'[3 2] 0 d':L==='lvl'?'[6 2 1 2] 0 d':'[] 0 d';
      if(p.t==='line'){c+=`${col.join(' ')} RG ${lw} w ${dash}\n${X(p.x1)} ${Y(p.y1)} m ${X(p.x2)} ${Y(p.y2)} l S\n`}
      else if(p.t==='poly'){
        const path=p.pts.map((q,i)=>`${X(q[0])} ${Y(q[1])} ${i?'l':'m'}`).join('\n')+(p.closed?'\nh':'');
        if(p.cls==='c-hatchf')c+=`0.86 0.85 0.82 rg\n${path}\nf\n`;
        else if(p.cls==='c-sil')c+=`0.97 0.96 0.94 rg ${col.join(' ')} RG ${lw} w [] 0 d\n${path}\nB\n`;
        else if(p.cls==='c-solid')c+=`0 0 0 rg 0 0 0 RG 0.4 w\n${path}\nB\n`;
        else c+=`${col.join(' ')} RG ${lw} w ${dash}\n${path}\nS\n`;
      }else if(p.t==='text'){
        const size=Math.max(4,p.h*sc*1.02),tw=p.str.length*size*.52,off=p.anc==='middle'?tw/2:p.anc==='end'?tw:0;
        const ang=-(p.rot||0)*Math.PI/180,cs=Math.cos(ang),sn=Math.sin(ang);
        const px=parseFloat(X(p.x)),py=parseFloat(Y(p.y));
        c+=`BT ${col.join(' ')} rg /F1 ${size.toFixed(2)} Tf ${cs.toFixed(4)} ${sn.toFixed(4)} ${(-sn).toFixed(4)} ${cs.toFixed(4)} ${(px-off*cs).toFixed(2)} ${(py-off*sn).toFixed(2)} Tm (${pdfEsc(p.str)}) Tj ET\n`;
      }
    });
    // title block
    const tx=PW-M-tbW,ty=M;c+=`0.97 0.96 0.94 rg 0 0 0 RG 0.8 w ${tx} ${ty} ${tbW} ${tbH} re B\n`;
    [['PROJECT',projName],['SHEET',s.no+' - '+s.title],['SCALE','1:'+N+' @ A3'],['UNITS','millimetres']].forEach((r,i)=>{
      c+=`0.5 0.5 0.5 rg BT /F1 6 Tf ${tx+6} ${ty+tbH-14-i*19} Td (${r[0]}) Tj ET\n0.07 0.07 0.07 rg BT /F2 ${i===0?11:8.5} Tf ${tx+62} ${ty+tbH-15-i*19} Td (${pdfEsc(r[1])}) Tj ET\n`;
      if(i)c+=`0.6 0.6 0.6 RG 0.4 w ${tx} ${ty+tbH-5-i*19} m ${tx+tbW} ${ty+tbH-5-i*19} l S\n`;
    });
    c+='Q';
    return makePDF([{w:PW,h:PH,content:c}]);
  }
  async function sheetPNG(id){
    const svgS=sheetSVG(id),img=new Image(),url=URL.createObjectURL(new Blob([svgS],{type:'image/svg+xml'}));
    await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=url});
    const cv=mkCanvas(2400,Math.round(2400*img.height/img.width)),g=cv.getContext('2d');g.drawImage(img,0,0,cv.width,cv.height);URL.revokeObjectURL(url);
    return new Promise(res=>cv.toBlob(res,'image/png'));
  }

  /* ---------- lifecycle ---------- */
  function show(){cad.active=true;setSheet(cad.cur,{animate:true});setTimeout(()=>{statusUpdate()},0)}
  function hide(){cad.active=false;cad.mstart=null;clearRubber()}
  new ResizeObserver(()=>{if(cad.active){fit(false)}}).observe(svg);
  svg.dataset.off='';
  return{LAYERS,SHEETS,ORDER,state:cad,setProject,off,show,hide,setSheet,fit,zoomBy,setTool,toggleLayer,setSnap,setGrid,setPaper,setLW,removeMeasure,
    startMeasure(){setTool('measure')},exportSVG:id=>new Blob([sheetSVG(id||cad.cur)],{type:'image/svg+xml'}),exportPDF:id=>sheetPDF(id||cad.cur),exportPNG:id=>sheetPNG(id||cad.cur),hooks:cad.hooks};
})();
