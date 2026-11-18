/* Three.js scene: house model, builder engine, furniture, cameras, render loop */
'use strict';

/* =========================================================
   3D SCENE (exterior + hollow house + interior walk)
   ========================================================= */
const canvas=$('#gl');
let renderer=null;
const SCN={hooks:{}};   // public scene API (filled by initScene)

function initScene(){
  const THREE=window.THREE;
  if(!THREE)return false;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'})}catch(e){return false}
  let DPR=Math.min(window.devicePixelRatio||1,2);
  renderer.setPixelRatio(DPR);
  renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=.95;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000,0);

  const scene=new THREE.Scene();
  const cam=new THREE.OrthographicCamera(-10,10,10,-10,.1,220);
  const pcam=new THREE.PerspectiveCamera(72,1,.05,120);
  const world=new THREE.Group();scene.add(world);
  const hooks=SCN.hooks;

  /* ---------- staged build: every scene object lives in a stage group ---------- */
  const STAGE_COUNT=8;let curStage=-1,bStage=STAGE_COUNT;
  const baseGroup=new THREE.Group(),stageGroups=[];
  world.add(baseGroup);
  for(let i=0;i<STAGE_COUNT;i++){const g=new THREE.Group();stageGroups.push(g);world.add(g)}
  world.add=function(...objs){objs.forEach(o=>{(o.isLight||curStage<0?baseGroup:stageGroups[curStage]).add(o)});return world};

  /* ---------- helpers ---------- */
  const tex=(c,rx=1,ry=1,srgb=true)=>{const t=new THREE.CanvasTexture(c);if(srgb)t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=4;return t};
  const pickables=[],lightsNight=[],bulbMats=[],colliders=[],strips=[];
  const addCol=(x0,x1,z0,z1,lv)=>colliders.push({x0,x1,z0,z1,lv});
  function bx(x0,x1,y0,y1,z0,z1,m,o={}){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0),m);
    mesh.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);
    mesh.castShadow=o.cast!==false;mesh.receiveShadow=o.recv!==false;
    if(o.part){mesh.userData.part=o.part;pickables.push(mesh)}
    (o.parent||world).add(mesh);return mesh;
  }
  function planeXZ(x0,x1,z0,z1,y,m,uv=.8,o={}){
    const geo=new THREE.PlaneGeometry(x1-x0,z1-z0);geo.rotateX(-Math.PI/2);
    const p=geo.attributes.position,u=geo.attributes.uv,cx=(x0+x1)/2,cz=(z0+z1)/2;
    for(let i=0;i<p.count;i++)u.setXY(i,(p.getX(i)+cx)*uv,(p.getZ(i)+cz)*uv);
    const mesh=new THREE.Mesh(geo,m);mesh.position.set(cx,y,cz);mesh.receiveShadow=true;(o.parent||world).add(mesh);return mesh;
  }
  function radialTex(inner,outer,size=128){const c=mkCanvas(size,size),g=c.getContext('2d');const gr=g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);gr.addColorStop(0,inner);gr.addColorStop(1,outer);g.fillStyle=gr;g.fillRect(0,0,size,size);return tex(c,1,1,false)}
  function gradTex(horizontal){const c=horizontal?mkCanvas(64,4):mkCanvas(4,64),g=c.getContext('2d');const gr=horizontal?g.createLinearGradient(0,0,64,0):g.createLinearGradient(0,0,0,64);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.5,'rgba(255,255,255,.95)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return tex(c,1,1,false)}
  const gradV=gradTex(false),gradU=gradTex(true),dotTex=radialTex('rgba(255,255,255,1)','rgba(255,255,255,0)',64),warmGlowTex=radialTex('rgba(255,190,110,.9)','rgba(255,190,110,0)',128);

  /* ---------- materials ---------- */
  const MS=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.9},o));
  const mat={
    wall:MS(0xece9e2),trim:MS(0xf3f0ea),plat:MS(0xcfccc5,{roughness:.95}),platSide:MS(0xb9b5ac,{roughness:1}),terrace:MS(0xd8d5ce,{roughness:.95}),
    roof:MS(0xd3d0c9),frame:MS(0x2b2621,{roughness:.6,metalness:.2}),
    glass:new THREE.MeshPhysicalMaterial({color:0x211d19,transparent:true,opacity:.16,roughness:.06,metalness:.1,depthWrite:false,side:THREE.DoubleSide}),
    accent:MS(0xffffff,{roughness:.8}),wood:MS(0xe2cdb0,{roughness:.75}),
    strip:new THREE.MeshBasicMaterial({color:0xffe3ad}),
    soil:MS(0x211b16,{roughness:1}),shrub:MS(0x1f2c24,{roughness:1}),bark:MS(0x1d1814,{roughness:1}),leaf:MS(0x2f6b3c),solar:MS(0x14223a,{roughness:.25,metalness:.6}),
    inWall:MS(0xf1e6d6,{roughness:.95,emissive:0x3a2410,emissiveIntensity:.5}),
    ceil:MS(0xf7f0e4,{roughness:.95,emissive:0x3a2410,emissiveIntensity:.4}),
    floor:MS(0xffffff,{roughness:.55}),floorTile:MS(0xffffff,{roughness:.35}),deck:MS(0xffffff,{roughness:.8}),
    lamp:new THREE.MeshBasicMaterial({color:0xfff2d0})
  };
  const FM={
    rug:MS(0xb9a58c,{roughness:1}),wood:MS(0xa8754a,{roughness:.7}),fabA:MS(0x8a8478,{roughness:1}),fabB:MS(0x5f6e65,{roughness:1}),
    dark:MS(0x2b2723,{roughness:.6}),stone:MS(0xd7d2c8,{roughness:.4}),white:MS(0xf0ece4,{roughness:.8}),linen:MS(0xe8e2d6,{roughness:1}),
    tv:MS(0x090c12,{roughness:.3,emissive:0x2a4a7a,emissiveIntensity:.5})
  };
  function setAccent(kind){const t=tex(drawKind(kind,128,128));if(mat.accent.map)mat.accent.map.dispose();mat.accent.map=t;mat.accent.needsUpdate=true}
  setAccent('concrete');
  mat.wood.map=tex(drawKind('slat',128,128));
  const floorKinds={f_oak:1,f_walnut:1,f_ash:1,f_marble:1,f_terrazzo:1};
  function setFloor(kind){const t=tex(drawKind(kind,128,128));if(mat.floor.map)mat.floor.map.dispose();mat.floor.map=t;mat.floor.roughness=kind==='f_marble'||kind==='f_terrazzo'?.3:.6;mat.floor.needsUpdate=true}
  setFloor('f_oak');
  mat.floorTile.map=tex(drawKind('f_tile',128,128));mat.deck.map=tex(drawKind('f_deck',128,128));
  {const c=mkCanvas(128,128),g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,128,128);g.strokeStyle='rgba(120,114,100,.28)';g.lineWidth=1.5;g.strokeRect(.5,.5,127,127);const t=tex(c,15,11);mat.plat.map=t;mat.terrace.map=t.clone();mat.terrace.map.repeat.set(8,4);mat.terrace.map.needsUpdate=true}

  /* =========================================================
     BUILD: ground, platform, shell
     ========================================================= */
  {const m=new THREE.Mesh(new THREE.PlaneGeometry(46,38),new THREE.MeshBasicMaterial({map:radialTex('rgba(0,0,0,.55)','rgba(0,0,0,0)',256),transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(0,-.72,0);world.add(m);SCN.shadowPlane=m}
  bx(-7.5,7.5,-.7,-.02,-5.5,5.5,mat.platSide,{part:'deck'});
  bx(-7.5,7.5,-.02,0,-5.5,5.5,mat.plat,{part:'deck'});
  curStage=0;
  bx(-7.2,.5,0,.25,.9,5.2,mat.terrace,{part:'deck'});
  {const c=mkCanvas(256,256),g=c.getContext('2d');g.fillStyle='#d7d4cd';g.fillRect(0,0,256,256);for(let y=0;y<256;y+=14){g.fillStyle='#b9b5ac';g.fillRect(0,y,256,2);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(0,y+2,256,2)}
    const p=new THREE.Mesh(new THREE.PlaneGeometry(7,4.3),new THREE.MeshStandardMaterial({map:tex(c,1,1),roughness:.95}));p.rotation.x=-Math.PI/2;p.rotation.z=Math.PI/2;p.position.set(3.8,.012,3.1);p.receiveShadow=true;world.add(p)}

  curStage=-1;
  /* ---------- walls ---------- */
  function wallMats(w){
    const E=mat.wall,I=mat.inWall;
    if(!w.outer)return [I,I,I,I,I,I];
    const a=[E,E,E,E,E,E];
    if(w.axis==='x'){if(w.outer==='+z'){a[5]=I}else{a[4]=I}}
    else{if(w.outer==='+x'){a[1]=I}else{a[0]=I}}
    return a;
  }
  const glassPanes=[];
  function addGlass(w,o){
    const prevStage=curStage;curStage=5;
    const wd=o.a1-o.a0,h=o.b1-o.b0,cc=(w.c0+w.c1)/2,a=(o.a0+o.a1)/2,yc=(o.b0+o.b1)/2,g=new THREE.Group();
    const glass=new THREE.Mesh(new THREE.PlaneGeometry(wd,h),mat.glass);glass.userData.part='glass';pickables.push(glass);g.add(glass);glassPanes.push(glass);
    const t=.07,d=(w.c1-w.c0)*.7;
    const fb=(ww,hh,x,y)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(ww,hh,d),mat.frame);m.position.set(x,y,0);g.add(m)};
    fb(wd+t,t,0,h/2);fb(wd+t,t,0,-h/2);fb(t,h,-wd/2,0);fb(t,h,wd/2,0);
    const nm=o.k==='door'?1:Math.max(0,Math.round(wd/1.4)-1);
    for(let i=1;i<=nm;i++)fb(.045,h,-wd/2+i*wd/(nm+1),0);
    if(w.axis==='x'){g.position.set(a,yc,cc)}else{g.position.set(cc,yc,a);g.rotation.y=Math.PI/2}
    world.add(g);curStage=prevStage;
  }
  function buildWall(w){
    const ms=wallMats(w),ops=[...w.op].sort((p,q)=>p.a0-q.a0);let cur=w.a0;
    const piece=(s0,s1,b0,b1)=>{if(s1-s0<.001||b1-b0<.001)return;
      if(w.axis==='x')bx(s0,s1,b0,b1,w.c0,w.c1,ms,{part:w.outer?'wall':null});else bx(w.c0,w.c1,b0,b1,s0,s1,ms,{part:w.outer?'wall':null})};
    ops.forEach(o=>{piece(cur,o.a0,w.y0,w.y1);piece(o.a0,o.a1,w.y0,o.b0);piece(o.a0,o.a1,o.b1,w.y1);cur=o.a1;
      if(o.k==='window'||(o.k==='door'&&o.sl))addGlass(w,o)});
    piece(cur,w.a1,w.y0,w.y1);
    // colliders: whole span except walk-through openings
    const doors=ops.filter(o=>o.k==='door'||o.k==='pass');let c2=w.a0;
    const seg=(s0,s1)=>{if(s1-s0<.05)return;w.axis==='x'?addCol(s0,s1,w.c0,w.c1,w.lv):addCol(w.c0,w.c1,s0,s1,w.lv)};
    doors.forEach(d=>{seg(c2,d.a0);c2=d.a1});seg(c2,w.a1);
  }
  // foundation: thin slab + perimeter footings
  curStage=0;
  bx(-4.5,4.0,0,.011,-3.2,.9,mat.plat,{part:'deck'});
  [[-4.62,-4.42,-3.32,1.02],[3.9,4.1,-3.32,1.02]].forEach(([a,b,c,d])=>bx(a,b,0,.12,c,d,mat.platSide,{part:'deck'}));
  [[-4.62,4.1,-3.32,-3.12],[-4.62,4.1,.82,1.02]].forEach(([a,b,c,d])=>bx(a,b,0,.12,c,d,mat.platSide,{part:'deck'}));
  WALLS.forEach(w=>{curStage=w.lv===0?1:3;buildWall(w)});curStage=-1;

  /* ---------- slabs & roofs ---------- */
  curStage=2;
  const slabM=side=>[mat.trim,mat.trim,mat.trim,mat.ceil,mat.trim,mat.trim];
  const SL=slabM();
  // first floor: house A with stair opening
  bx(-4.5,.5,2.8,3.1,-3.2,-2.95,SL);bx(-4.5,.5,2.8,3.1,-2.05,1.0,SL);
  bx(-4.5,STAIR.x0,2.8,3.1,-2.95,-2.05,SL);bx(STAIR.x1,.5,2.8,3.1,-2.95,-2.05,SL);
  // B (cantilever) and balcony
  bx(.5,4.9,2.8,3.1,-2.4,3.4,SL,{part:'wall'});
  bx(-4.5,.5,2.8,3.1,1.0,3.3,[mat.trim,mat.trim,mat.trim,mat.ceil,mat.trim,mat.trim],{part:'wall'});
  // roofs
  curStage=4;
  const RF=[mat.trim,mat.trim,mat.trim,mat.ceil,mat.trim,mat.trim];
  bx(-4.7,.7,6.2,6.5,-3.4,1.2,RF,{part:'roof'});
  bx(.4,5.0,6.2,6.78,-2.5,3.5,RF,{part:'roof'});
  bx(-4.4,.4,6.5,6.56,-3.1,.9,mat.roof,{part:'roof'});
  bx(.5,4.9,6.78,6.84,-2.4,3.4,mat.roof,{part:'roof'});
  // skylight lantern
  bx(-1.6,-.2,6.56,7.1,-2.4,-1.3,mat.trim,{part:'roof'});
  {const gm=new THREE.MeshBasicMaterial({color:0xffc37a});[[1.1,-.9,-1.295,Math.PI],[1.0,-.195,-1.85,Math.PI/2],[1.0,-1.605,-1.85,-Math.PI/2]].forEach(([w,x,z,ry])=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,.4),gm);m.position.set(x,6.82,z);m.rotation.y=ry;world.add(m)})}
  // decorative bands & balcony details
  curStage=3;
  bx(-2.3,-1.7,3.1,6.2,1.0,1.1,mat.accent,{part:'wall'});
  bx(2.4,3.0,3.1,6.2,3.4,3.5,mat.accent,{part:'wall'});
  bx(-4.4,-4.1,0,2.8,3.0,3.3,mat.trim,{part:'wall'});                 // balcony column
  {const gl=new THREE.Mesh(new THREE.BoxGeometry(5,.8,.04),mat.glass);gl.position.set(-2,3.5,3.28);world.add(gl);
   const gl2=new THREE.Mesh(new THREE.BoxGeometry(.04,.8,2.3),mat.glass);gl2.position.set(-4.48,3.5,2.15);world.add(gl2);
   bx(-4.5,.5,3.9,3.96,3.26,3.32,mat.frame,{cast:false});}
  curStage=2;bx(4.5,4.82,0,2.8,3.1,3.42,mat.trim,{part:'wall'});curStage=3;                 // column under cantilever
  addCol(4.5,4.82,3.1,3.42,0);
  // balcony rails (collision, upper level)
  addCol(-4.5,.5,3.2,3.3,1);addCol(-4.5,-4.4,1.0,3.3,1);addCol(.4,.5,3.15,3.3,1);
  // wooden slat screen on the east side of the ground floor
  bx(4.0,4.12,0,2.8,-1.75,.75,mat.frame,{cast:false});
  for(let i=0;i<12;i++)bx(4.12,4.3,.1,2.7,-1.7+i*.205,-1.7+i*.205+.11,mat.wood,{cast:false});
  // exterior steps from the balcony
  curStage=7;
  for(let i=0;i<6;i++)bx(-2.0,-.8,.25,2.7-i*.43,3.3+i*.42,3.3+(i+1)*.42,mat.wood,{part:'wall'});
  addCol(-2.0,-.8,3.3,5.9,0);
  // floors inside
  FLOORS.forEach(f=>{curStage=f.lv?2:0;const m=f.m==='tile'?mat.floorTile:f.m==='deck'?mat.deck:mat.floor;planeXZ(f.r[0],f.r[1],f.r[2],f.r[3],FLOOR_Y[f.lv]+.012,m,f.m==='tile'?.9:.8)});
  // stair (solid steps)
  curStage=2;
  const stairMeshes=[];
  for(let i=0;i<STAIR.steps;i++){const run=(STAIR.x1-STAIR.x0)/STAIR.steps,x0=STAIR.x0+i*run;
    stairMeshes.push(bx(x0,x0+run,0,(i+1)*STAIR.rise/STAIR.steps,STAIR.z0,STAIR.z1,mat.wood,{cast:true}))}
  addCol(STAIR.x0,STAIR.x1,STAIR.z0,STAIR.z1,0);addCol(STAIR.x0,STAIR.x1,STAIR.z0,STAIR.z1,1);
  bx(STAIR.x0,STAIR.x1,3.1,3.95,STAIR.z1-.03,STAIR.z1,mat.glass,{cast:false});   // glass guard on the opening

  /* ---------- solar panels ---------- */
  curStage=4;
  const solar=new THREE.Group();solar.visible=false;world.add(solar);
  for(let i=0;i<3;i++)for(let j=0;j<2;j++){const p=new THREE.Mesh(new THREE.BoxGeometry(1.2,.05,1.8),mat.solar);p.position.set(1.4+i*1.4,6.98,-1.0+j*2.0);p.rotation.z=-.2;p.castShadow=true;solar.add(p)}
  for(let i=0;i<3;i++){const p=new THREE.Mesh(new THREE.BoxGeometry(1.2,.05,1.8),mat.solar);p.position.set(-3.6+i*1.4,6.7,-1.8);p.rotation.z=-.2;p.castShadow=true;solar.add(p)}

  /* ---------- exterior strips / glows ---------- */
  curStage=7;
  function floorGlow(x,z,w,d,op=.5,y=.03){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:warmGlowTex,transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);world.add(m);lightsNight.push(m);m.userData.op=op;return m}
  function strip(x0,z0,x1,z1,y){
    const th=.1;
    const m=bx(Math.min(x0,x1)-th/2,Math.max(x0,x1)+th/2,y,y+.05,Math.min(z0,z1)-th/2,Math.max(z0,z1)+th/2,mat.strip,{cast:false,recv:false});lightsNight.push(m);
    const horiz=Math.abs(x1-x0)>=Math.abs(z1-z0),len=horiz?Math.abs(x1-x0):Math.abs(z1-z0);
    const p=new THREE.Mesh(new THREE.PlaneGeometry(horiz?len+.8:1.2,horiz?1.2:len+.8),new THREE.MeshBasicMaterial({map:horiz?gradV:gradU,color:0xff9f45,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false}));
    p.rotation.x=-Math.PI/2;p.position.set((x0+x1)/2,y+.02,(z0+z1)/2);world.add(p);lightsNight.push(p);p.userData.op=.55;
  }
  strip(-7.2,5.2,.5,5.2,.25);strip(-7.2,.9,-7.2,5.2,.25);strip(.5,5.25,7.3,5.25,0);strip(-2.2,3.3,-.6,3.3,.25);strip(-6.6,3.0,-3.6,3.0,.25);strip(-3.6,3.0,-3.6,4.0,.25);strip(-3.6,4.0,-1.0,4.0,.25);
  floorGlow(-2.1,2.3,7,3.4,.2);floorGlow(2.4,.8,6,3,.16);floorGlow(3.6,3.3,6.5,3,.16);floorGlow(-5.6,3.2,3.5,3,.12);

  /* ---------- planters ---------- */
  function planter(x0,x1,z0,z1,y0,seed){
    const r=rng(seed);
    bx(x0,x1,y0,y0+.55,z0,z1,mat.trim,{part:'land'});bx(x0+.08,x1-.08,y0+.5,y0+.58,z0+.08,z1-.08,mat.soil,{part:'land',cast:false});
    addCol(x0,x1,z0,z1,0);
    const n=Math.max(3,Math.round((x1-x0)/.55));
    for(let i=0;i<n;i++){const h=.7+r()*.9,rad=.22+r()*.14;const m=new THREE.Mesh(new THREE.ConeGeometry(rad,h,7),mat.shrub);m.position.set(x0+.3+(x1-x0-.6)*(i/(n-1||1)),y0+.55+h/2,(z0+z1)/2+(r()-.5)*.2);m.castShadow=true;m.userData.part='land';pickables.push(m);world.add(m)}
    const l=new THREE.Mesh(new THREE.BoxGeometry(x1-x0-.1,.04,.04),mat.strip);l.position.set((x0+x1)/2,y0+.1,z1+.02);world.add(l);lightsNight.push(l);
    floorGlow((x0+x1)/2,z1+.3,x1-x0+1.2,1.5,.22,y0+.03);
  }
  planter(-6.4,-3.7,3.9,4.75,.25,3);planter(-1.4,1.7,4.2,5.0,0,5);planter(2.6,5.6,4.3,5.1,0,8);

  /* ---------- trees ---------- */
  curStage=-1;
  const treeGroup=new THREE.Group();world.add(treeGroup);const treeLeafGroups=[];
  const up=new THREE.Vector3(0,1,0);
  function cyl(p0,p1,r0,r1,parent){const dir=p1.clone().sub(p0),len=dir.length();const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r0,len,5),mat.bark);m.position.copy(p0).addScaledVector(dir,.5);m.quaternion.setFromUnitVectors(up,dir.normalize());m.castShadow=true;parent.add(m)}
  function makeTree(x,z,h,seed){
    const r=rng(seed),g=new THREE.Group();g.position.set(x,.25,z);const pts=[],leaves=new THREE.Group();g.add(leaves);
    function branch(p0,dir,len,rad,depth){
      const p1=p0.clone().addScaledVector(dir,len);cyl(p0,p1,rad,Math.max(rad*.65,.012),g);
      if(depth<=3)pts.push(p1.x,p1.y,p1.z);
      if(depth===0){const b=new THREE.Mesh(new THREE.IcosahedronGeometry(.34+r()*.2,0),mat.leaf);b.position.copy(p1);b.castShadow=true;leaves.add(b);return}
      const n=depth>=4?2:3;
      for(let i=0;i<n;i++){const d=dir.clone();d.x+=(r()-.5)*1.35;d.z+=(r()-.5)*1.35;d.y+=(r()-.25)*.45;if(d.y<.2)d.y=.2;d.normalize();branch(p1,d,len*(.66+r()*.14),rad*.6,depth-1)}
    }
    branch(new THREE.Vector3(0,0,0),new THREE.Vector3((r()-.5)*.12,1,(r()-.5)*.12).normalize(),h*.3,.15,5);
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
    const pm=new THREE.PointsMaterial({map:dotTex,color:0xe89a45,size:9*DPR,sizeAttenuation:false,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:1});
    pm.userData={base:9,tree:true};bulbMats.push(pm);g.add(new THREE.Points(geo,pm));
    leaves.visible=false;treeLeafGroups.push(leaves);treeGroup.add(g);
    addCol(x-.25,x+.25,z-.25,z+.25,0);
  }
  let treeSeed=17;
  function buildTrees(seed){
    while(treeGroup.children.length){const c=treeGroup.children.pop();c.traverse(o=>{if(o.geometry)o.geometry.dispose()})}
    treeLeafGroups.length=0;for(let i=bulbMats.length-1;i>=0;i--)if(bulbMats[i].userData.tree)bulbMats.splice(i,1);
    for(let i=colliders.length-1;i>=0;i--)if(colliders[i].tree)colliders.splice(i,1);
    makeTree(-6.2,2.2,5.6,seed);makeTree(-5.1,.4,6.8,seed+9);
    treeGroup.traverse(o=>{if(o.isMesh&&o.material===mat.bark){o.userData.part='land';pickables.push(o)}});
    applyTheme();applyClimate();
  }

  /* =========================================================
     INTERIOR: furniture, plants, lights
     ========================================================= */
  curStage=6;
  const furnMeshes={furn:[],tv:[]};
  /* ---------- detailed furniture (procedural, replaces the old boxes) ---------- */
  const FX=(()=>{
    const grain=(base,dark,seed,lines=70)=>{const c=mkCanvas(256,256),g=c.getContext('2d'),r=rng(seed);g.fillStyle=base;g.fillRect(0,0,256,256);
      for(let i=0;i<lines;i++){const y=r()*256;g.strokeStyle=dark;g.globalAlpha=.06+r()*.14;g.lineWidth=.6+r()*1.8;g.beginPath();g.moveTo(0,y);
        for(let x=0;x<=256;x+=32)g.lineTo(x,y+(r()-.5)*5);g.stroke()}g.globalAlpha=1;return c};
    const weave=(base,seed)=>{const c=mkCanvas(128,128),g=c.getContext('2d'),r=rng(seed);g.fillStyle=base;g.fillRect(0,0,128,128);
      for(let i=0;i<2600;i++){g.fillStyle=r()>.5?'rgba(255,255,255,.07)':'rgba(0,0,0,.07)';g.fillRect(r()*128,r()*128,1.4,1.4)}
      g.strokeStyle='rgba(0,0,0,.045)';for(let i=0;i<128;i+=3){g.beginPath();g.moveTo(i,0);g.lineTo(i,128);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(128,i);g.stroke()}return c};
    const marble=(seed)=>{const c=mkCanvas(256,256),g=c.getContext('2d'),r=rng(seed);g.fillStyle='#ebe7de';g.fillRect(0,0,256,256);
      for(let i=0;i<7;i++){g.strokeStyle='rgba(120,116,108,'+(.1+r()*.18)+')';g.lineWidth=.6+r()*1.4;g.beginPath();let x=r()*256,y=0;g.moveTo(x,y);
        while(y<256){x+=(r()-.5)*40;y+=18+r()*22;g.lineTo(x,y)}g.stroke()}return c};
    const rugTex=(a,b,c2)=>{const c=mkCanvas(256,256),g=c.getContext('2d');g.fillStyle=a;g.fillRect(0,0,256,256);g.strokeStyle=b;g.lineWidth=7;g.strokeRect(14,14,228,228);
      g.lineWidth=2;g.strokeStyle=c2;g.strokeRect(30,30,196,196);
      for(let i=0;i<5;i++){g.fillStyle=i%2?b:c2;g.globalAlpha=.55;g.beginPath();g.moveTo(128,52+i*30);g.lineTo(150+i*8,128);g.lineTo(128,204-i*30);g.lineTo(106-i*8,128);g.fill()}g.globalAlpha=1;
      for(let i=0;i<3000;i++){g.fillStyle=Math.random()>.5?'rgba(255,255,255,.07)':'rgba(0,0,0,.07)';g.fillRect(Math.random()*256,Math.random()*256,1.5,1.5)}return c};
    const art=(seed)=>{const c=mkCanvas(200,260),g=c.getContext('2d'),r=rng(seed);g.fillStyle='#f1ebdf';g.fillRect(0,0,200,260);
      const cols=['#c9694a','#7f9a85','#e0b27a','#3d4e45','#d9a3a0'];for(let i=0;i<5;i++){g.fillStyle=cols[i];g.globalAlpha=.9;g.beginPath();g.arc(40+r()*120,50+r()*160,24+r()*46,0,7);g.fill()}
      g.globalAlpha=1;g.strokeStyle='#2c2a26';g.lineWidth=2;g.beginPath();g.moveTo(20,200);g.bezierCurveTo(70,120,120,260,180,150);g.stroke();return c};
    const m={
      oak:MS(0xffffff,{roughness:.55,map:tex(grain('#d1a877','#7d5a34',11),1,1)}),
      walnut:MS(0xffffff,{roughness:.5,map:tex(grain('#6b4a30','#2c1a0d',12),1,1)}),
      sofa:MS(0xffffff,{roughness:1,map:tex(weave('#b3a794',3),3,3)}),
      sage:MS(0xffffff,{roughness:1,map:tex(weave('#6f8b79',4),3,3)}),
      clay:MS(0xffffff,{roughness:1,map:tex(weave('#c0623e',5),2,2)}),
      cream:MS(0xffffff,{roughness:1,map:tex(weave('#efe9dc',6),3,3)}),
      linenW:MS(0xffffff,{roughness:1,map:tex(weave('#faf7f0',7),3,3)}),
      mustard:MS(0xffffff,{roughness:1,map:tex(weave('#d9a441',8),2,2)}),
      leather:MS(0x9a5d36,{roughness:.55}),
      brass:MS(0xb88f56,{roughness:.3,metalness:.85}),
      black:MS(0x1e1d1b,{roughness:.45,metalness:.35}),
      ceramic:MS(0xf6f3ec,{roughness:.2}),
      terra:MS(0xc5724c,{roughness:.8}),
      stone:MS(0xffffff,{roughness:.22,map:tex(marble(9),1,1)}),
      steel:MS(0xc9ccd0,{roughness:.25,metalness:.9}),
      water:MS(0xdfe9ee,{roughness:.1}),
      mirror:MS(0xb9c8d2,{roughness:.08,metalness:0,emissive:0x6f8796,emissiveIntensity:.45}),
      shade:MS(0xf3e9d3,{roughness:1,emissive:0xffd9a0,emissiveIntensity:.35,side:THREE.DoubleSide}),
      art:MS(0xffffff,{roughness:.9,map:tex(art(2),1,1)}),art2:MS(0xffffff,{roughness:.9,map:tex(art(7),1,1)}),
      rug1:MS(0xffffff,{roughness:1,map:tex(rugTex('#d9cdb8','#b36a4a','#7e9784'),1,1)}),
      rug2:MS(0xffffff,{roughness:1,map:tex(rugTex('#e4ddd0','#8a9c8e','#c8b49a'),1,1)}),
      rug3:MS(0xffffff,{roughness:1,map:tex(rugTex('#ddd4c4','#c78a4f','#5f6e65'),1,1)}),
      book:[0xb25a3c,0x3f5a4b,0xd6b476,0x2f3a52,0xc9c2b2,0x8a4b4b,0x5e7a68].map(c=>MS(c,{roughness:.85}))
    };
    return m;
  })();
  const _gc={};
  const FG=(k,f)=>_gc[k]||(_gc[k]=f());
  /* rounded box centred on the origin; r = corner radius */
  function rr(w,h,d,r,m){
    if(r<=.004){const g=FG('b'+w+'|'+h+'|'+d,()=>new THREE.BoxGeometry(w,h,d));return new THREE.Mesh(g,m)}
    r=Math.min(r,w/2-.002,h/2-.002,d/2-.002);
    const g=FG('r'+w+'|'+h+'|'+d+'|'+r,()=>{
      const b=Math.min(r*.55,.025),W=w-2*b,H=h-2*b,rad=Math.max(r-b,.002),x=-W/2,y=-H/2;
      const s=new THREE.Shape();s.moveTo(x+rad,y);s.lineTo(x+W-rad,y);s.quadraticCurveTo(x+W,y,x+W,y+rad);s.lineTo(x+W,y+H-rad);s.quadraticCurveTo(x+W,y+H,x+W-rad,y+H);
      s.lineTo(x+rad,y+H);s.quadraticCurveTo(x,y+H,x,y+H-rad);s.lineTo(x,y+rad);s.quadraticCurveTo(x,y,x+rad,y);
      const e=new THREE.ExtrudeGeometry(s,{depth:Math.max(d-2*b,.002),bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:3,curveSegments:5});
      e.translate(0,0,-(d-2*b)/2);return e});
    return new THREE.Mesh(g,m);
  }
  const cylM=(rt,rb,h,m,seg=16)=>new THREE.Mesh(FG('c'+rt+'|'+rb+'|'+h+'|'+seg,()=>new THREE.CylinderGeometry(rt,rb,h,seg)),m);
  const sphM=(rx,ry,rz,m,seg=14)=>{const s=new THREE.Mesh(FG('s'+seg,()=>new THREE.SphereGeometry(1,seg,Math.max(8,seg>>1))),m);s.scale.set(rx,ry,rz);return s};
  function put(g,o,x,y,z,rx=0,ry=0,rz=0){o.position.set(x,y,z);o.rotation.set(rx,ry,rz);g.add(o);return o}
  const bxm=(w,h,d,m)=>rr(w,h,d,0,m);
  const legs=(g,w,d,y0,h,m,r=.02,ins=.07)=>{[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>put(g,cylM(r*.75,r,h,m,8),a*(w/2-ins),y0+h/2,b*(d/2-ins)))};
  const books=(g,x0,x1,y,z,hMax,seed)=>{const r=rng(seed);let x=x0;while(x<x1-.05){const w=.025+r()*.03,h=hMax*(.65+r()*.35);if(x+w>x1)break;
    const b=put(g,bxm(w,h,.18,FX.book[Math.floor(r()*FX.book.length)]),x+w/2,y+h/2,z,0,0,r()>.93?.12:0);b.castShadow=false;x+=w+.003}};
  const lampT=(g,x,y,z,s=1)=>{put(g,cylM(.09*s,.11*s,.03,FX.brass),x,y+.015,z);put(g,cylM(.012,.012,.24*s,FX.brass,8),x,y+.15*s,z);
    const sh=put(g,cylM(.1*s,.16*s,.19*s,FX.shade,18),x,y+.33*s,z);sh.castShadow=false};
  const pillow=(g,x,y,z,ry,m,s=.4)=>{const p=put(g,rr(s,s*.98,.13,.055,m),x,y,z,0,ry,0);p.castShadow=true;return p};

  const FURN_BUILD={};
  const FURN_FACE={tvunit:90,tv:90,sofa:-90,arm:180,dch1:180,dch2:180,dchair:180,lchair:180,bookcase:90,lounge:90,toilet:90};
  const FURN_SKIP={sofab:1,sofa1:1,sofa2:1,armb:1,loungeb:1,head:1,pil1:1,pil2:1};

  FURN_BUILD.rug1=(W,D)=>{const g=new THREE.Group();put(g,rr(W,.02,D,.008,FX.rug1),0,.01,0).castShadow=false;return g};
  FURN_BUILD.lrug=(W,D)=>{const g=new THREE.Group();put(g,rr(W,.02,D,.008,FX.rug2),0,.01,0).castShadow=false;return g};
  FURN_BUILD.mrug=(W,D)=>{const g=new THREE.Group();put(g,rr(W,.02,D,.008,FX.rug3),0,.01,0).castShadow=false;return g};

  FURN_BUILD.tvunit=(W,D)=>{const g=new THREE.Group();
    put(g,rr(W,.4,D,.012,FX.walnut),0,.3,0);legs(g,W,D,0,.1,FX.black,.014,.1);
    for(let i=0;i<3;i++)put(g,bxm(W/3-.03,.34,.006,FX.oak),-W/3+i*W/3,.3,D/2+.002);
    put(g,bxm(.2,.002,.12,FX.black),0,.502,0);
    // decor on top
    const v=put(g,cylM(.05,.07,.2,FX.terra,14),-W/2+.2,.6,0);v.castShadow=true;
    put(g,rr(.2,.05,.14,.01,FX.book[1]),W/2-.25,.525,0);put(g,rr(.18,.04,.12,.01,FX.book[2]),W/2-.25,.57,0);
    return g};
  FURN_BUILD.tv=(W)=>{const g=new THREE.Group();const H=.7;
    put(g,rr(W,H,.035,.01,FX.black),0,H/2,0);
    const scr=new THREE.Mesh(new THREE.PlaneGeometry(W-.04,H-.04),(typeof FM!=='undefined'?FM.tv:FX.black));put(g,scr,0,H/2,.019);
    return g};
  FURN_BUILD.sofa=(W,D)=>{const g=new THREE.Group();const m=FX.sofa;
    put(g,rr(W,.14,D,.04,FX.walnut),0,.15,0);legs(g,W,D,0,.1,FX.black,.016,.09);
    const armW=.16,seatW=(W-2*armW)/2;
    put(g,rr(W,.5,.2,.07,m),0,.52,-D/2+.1);              // back frame
    [-1,1].forEach(s=>put(g,rr(armW,.4,D,.07,m),s*(W/2-armW/2),.4,0));
    [-1,1].forEach(s=>put(g,rr(seatW-.01,.17,D-.24,.07,m),s*(seatW/2+.005),.31,.07));   // seat cushions
    [-1,1].forEach(s=>{const b=put(g,rr(seatW-.02,.4,.17,.08,m),s*(seatW/2+.005),.62,-D/2+.28,-.16,0,0)});
    pillow(g,-W/2+.38,.5,-D/2+.34,.25,FX.clay,.38);pillow(g,W/2-.38,.5,-D/2+.34,-.3,FX.sage,.38);
    put(g,rr(.52,.04,.3,.02,FX.mustard),.12,.41,.1,-.06,.1,0);
    return g};
  FURN_BUILD.arm=(W,D)=>{const g=new THREE.Group();const m=FX.sage;
    put(g,rr(W*.9,.1,D*.9,.03,FX.walnut),0,.12,0);legs(g,W*.9,D*.9,0,.08,FX.walnut,.016,.06);
    put(g,rr(W,.2,D,.07,m),0,.28,.02);
    put(g,rr(W,.45,.15,.07,m),0,.55,-D/2+.07,-.12,0,0);
    [-1,1].forEach(s=>put(g,rr(.1,.3,D,.05,m),s*(W/2-.05),.42,0));
    pillow(g,0,.5,.03,0,FX.cream,.3);
    return g};
  FURN_BUILD.ctable=(W,D)=>{const g=new THREE.Group();
    const top=put(g,cylM(.5,.5,.035,FX.walnut,28),0,.4,0);top.scale.set(W/1,1,D/1);
    [[-.5,-.5],[.5,-.5],[0,.55]].forEach(([a,b])=>{const l=put(g,cylM(.014,.02,.36,FX.black,8),a*W*.7,.2,b*D*.7)});
    put(g,rr(.24,.03,.17,.006,FX.book[1]),-.06,.432,.03,0,.3,0);put(g,rr(.2,.03,.15,.006,FX.book[3]),-.05,.46,.03,0,.1,0);
    put(g,cylM(.045,.03,.16,FX.ceramic,12),.12,.51,-.08).castShadow=true;
    return g};
  FURN_BUILD.counter=(W,D)=>{const g=new THREE.Group();
    put(g,bxm(W,.1,D-.05,FX.black),0,.05,-.02);
    put(g,rr(W,.76,D-.04,.006,FX.oak),0,.48,-.02);
    const n=3;for(let i=0;i<n;i++){put(g,bxm(W/n-.02,.7,.012,FX.walnut),-W/2+W/n*(i+.5),.5,D/2-.045);put(g,bxm(.1,.012,.02,FX.brass),-W/2+W/n*(i+.5),.78,D/2-.03)}
    put(g,rr(W+.02,.04,D+.03,.006,FX.stone),0,.88,.0);
    // sink + tap
    put(g,rr(.4,.012,.3,.04,FX.steel),-W*.2,.906,0);put(g,cylM(.014,.016,.3,FX.steel,8),-W*.2,1.04,-D/2+.07);
    put(g,rr(.02,.02,.16,.008,FX.steel),-W*.2,1.18,-D/2+.15);
    // hob
    put(g,rr(.5,.01,.42,.02,FX.black),W*.28,.905,0);[[-.11,-.09],[.11,-.09],[-.11,.09],[.11,.09]].forEach(([a,b])=>put(g,cylM(.07,.07,.006,FX.steel,16),W*.28+a,.912,b));
    // kettle, board
    put(g,cylM(.06,.075,.15,FX.steel,14),W*.28,.99,-D/2+.1).castShadow=true;
    return g};
  FURN_BUILD.cab=(W,D)=>{const g=new THREE.Group();
    put(g,rr(W,.8,D,.006,FX.oak),0,.4,0);
    for(let i=0;i<3;i++){put(g,bxm(W/3-.02,.74,.012,FX.walnut),-W/2+W/3*(i+.5),.4,D/2+.003);put(g,bxm(.012,.1,.02,FX.brass),-W/2+W/3*(i+.5)+.07,.1,D/2+.015)}
    return g};
  FURN_BUILD.island=(W,D)=>{const g=new THREE.Group();
    put(g,rr(W,.84,D-.06,.008,FX.walnut),0,.45,-.02);
    put(g,rr(W+.1,.04,D+.1,.008,FX.stone),0,.93,0);
    for(let i=0;i<3;i++)put(g,bxm(W/3-.03,.7,.01,FX.oak),-W/3+i*W/3,.46,D/2-.05);
    put(g,rr(.34,.04,.22,.02,FX.walnut),.05,.97,0);                                     // board
    put(g,cylM(.08,.1,.07,FX.ceramic,16),-.18,.985,.05).castShadow=true;                // fruit bowl
    [[-.2,.02],[-.14,.07],[-.24,.08]].forEach(([a,b],i)=>put(g,sphM(.035,.035,.035,i===1?FX.clay:FX.mustard,8),a,1.03,b));
    return g};
  FURN_BUILD.stool1=FURN_BUILD.stool2=()=>{const g=new THREE.Group();
    put(g,cylM(.15,.13,.05,FX.leather,18),0,.66,0);put(g,cylM(.14,.14,.02,FX.black,18),0,.62,0);
    [[0,0],[.1,.1],[-.1,.1],[.1,-.1],[-.1,-.1]].slice(1).forEach(([a,b])=>put(g,cylM(.01,.014,.62,FX.black,6),a,.31,b));
    put(g,cylM(.1,.1,.01,FX.black,16),0,.22,0).castShadow=false;
    return g};
  FURN_BUILD.dtable=(W,D)=>{const g=new THREE.Group();
    put(g,rr(W,.04,D,.02,FX.walnut),0,.73,0);legs(g,W,D,0,.71,FX.walnut,.03,.07);
    put(g,cylM(.04,.06,.2,FX.ceramic,14),0,.85,0).castShadow=true;
    [0,1,2].forEach(i=>{const s=put(g,sphM(.02,.07,.02,FX.sage,6),(i-1)*.012,.99+i*.01,0)});
    put(g,rr(.34,.012,.34,.01,FX.cream),-W/2+.2,.752,.08).castShadow=false;
    return g};
  FURN_BUILD.dch1=FURN_BUILD.dch2=()=>{const g=new THREE.Group();const W=.4,D=.4;
    put(g,rr(W,.045,D,.02,FX.sage),0,.44,0);legs(g,W,D,0,.42,FX.walnut,.016,.04);
    put(g,rr(W,.4,.04,.02,FX.walnut),0,.68,-D/2+.02,-.1,0,0);
    return g};
  FURN_BUILD.desk=(W,D)=>{const g=new THREE.Group();
    put(g,rr(W,.04,D,.012,FX.oak),0,.74,0);
    [-1,1].forEach(s=>put(g,rr(.04,.72,D-.06,.006,FX.black),s*(W/2-.1),.36,0));
    put(g,rr(W-.2,.3,.02,.004,FX.black),0,.55,-D/2+.06);
    put(g,rr(.5,.2,D-.12,.006,FX.walnut),W/2-.45,.6,0);put(g,bxm(.1,.012,.012,FX.brass),W/2-.45,.64,D/2-.05);
    // laptop, mug, lamp
    put(g,rr(.34,.012,.24,.008,FX.steel),-.2,.766,.02);put(g,rr(.34,.23,.01,.006,FX.steel),-.2,.88,-.09,-.25,0,0);
    const sc=put(g,new THREE.Mesh(new THREE.PlaneGeometry(.31,.2),FX.black),-.2,.88,-.083,-.25,0,0);
    put(g,cylM(.035,.032,.09,FX.terra,12),.1,.81,.14).castShadow=true;
    lampT(g,.65,.76,-.15,.9);
    put(g,rr(.22,.03,.16,.008,FX.book[0]),.35,.775,.1,0,.2,0);
    return g};
  const officeChair=()=>{const g=new THREE.Group();
    put(g,rr(.46,.08,.44,.04,FX.black),0,.5,0);put(g,rr(.44,.5,.07,.035,FX.black),0,.8,-.2,-.12,0,0);
    put(g,cylM(.025,.025,.42,FX.steel,8),0,.25,0);
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2;put(g,bxm(.03,.025,.26,FX.black),Math.sin(a)*.13,.06,Math.cos(a)*.13,0,a,0);put(g,sphM(.02,.02,.02,FX.black,8),Math.sin(a)*.26,.025,Math.cos(a)*.26)}
    return g};
  FURN_BUILD.dchair=officeChair;FURN_BUILD.lchair=officeChair;
  FURN_BUILD.shelf=(W,D)=>{const g=new THREE.Group();const H=2.0;
    [-1,1].forEach(s=>put(g,bxm(.03,H,D,FX.oak),s*(W/2-.015),H/2,0));put(g,bxm(W,H,.012,FX.oak),0,H/2,-D/2+.006);
    for(let i=0;i<=5;i++)put(g,bxm(W,.03,D,FX.oak),0,.02+i*.39,0);
    [0,1,2].forEach(i=>books(g,-W/2+.05,W/2-.05,.035+i*.39,0,.31,40+i));
    const v=put(g,cylM(.05,.07,.22,FX.terra,12),.2,1.8+.03,0);v.castShadow=true;
    [0,1,2].forEach(i=>{const s=put(g,sphM(.025,.08,.025,FX.sage,6),.2+(i-1)*.03,2.0+.12,0,0,0,(i-1)*.3)});
    return g};
  FURN_BUILD.bench=(W,D)=>{const g=new THREE.Group();
    put(g,rr(W,.12,D,.05,FX.sage),0,.38,0);put(g,rr(W-.05,.04,D-.06,.02,FX.walnut),0,.3,0);legs(g,W,D,0,.28,FX.black,.012,.08);return g};
  FURN_BUILD.ldesk=(W,D)=>{const g=new THREE.Group();
    put(g,rr(W,.04,D,.012,FX.walnut),0,.74,0);legs(g,W,D,0,.72,FX.black,.02,.05);
    put(g,rr(.34,.012,.24,.008,FX.steel),0,.766,.05);put(g,rr(.34,.23,.01,.006,FX.steel),0,.88,-.07,-.25,0,0);
    lampT(g,W/2-.12,.76,-D/2+.12,.9);return g};
  FURN_BUILD.bookcase=(W,D)=>{const g=new THREE.Group();const H=2.2;
    [-1,1].forEach(s=>put(g,bxm(.03,H,D,FX.walnut),s*(W/2-.015),H/2,0));put(g,bxm(W,H,.012,FX.walnut),0,H/2,-D/2+.006);
    const n=6;for(let i=0;i<=n;i++)put(g,bxm(W,.03,D,FX.walnut),0,.02+i*(H-.05)/n,0);
    for(let i=0;i<n;i++){const y=.035+i*(H-.05)/n;if(i%3===1){put(g,rr(.3,.34,.2,.02,FX.terra),-W/2+.5,y+.17,0);put(g,rr(.26,.3,.12,.01,FX.ceramic),W/2-.5,y+.15,0)}
      else books(g,-W/2+.05,W/2-.05,y,0,(H-.05)/n-.06,70+i)}
    return g};
  FURN_BUILD.lounge=(W,D)=>{const g=new THREE.Group();const m=FX.leather;
    put(g,rr(W,.14,D,.05,m),0,.34,.0);put(g,rr(W*.9,.06,D*.9,.02,FX.black),0,.2,0);legs(g,W*.85,D*.85,0,.18,FX.black,.014,.05);
    put(g,rr(W,.5,.14,.06,m),0,.6,-D/2+.07,-.18,0,0);
    [-1,1].forEach(s=>put(g,rr(.08,.2,D,.04,m),s*(W/2-.04),.46,0));
    pillow(g,0,.5,-.06,0,FX.mustard,.3);return g};
  FURN_BUILD.bed=(W,D)=>{const g=new THREE.Group();
    put(g,rr(W+.1,.22,D,.025,FX.oak),0,.2,0);legs(g,W+.1,D,0,.1,FX.black,.018,.06);
    put(g,rr(W,.2,D-.08,.07,FX.linenW),0,.42,.03);                                          // mattress
    put(g,rr(W+.04,.07,D*.66,.04,FX.sage),0,.55,D/2-D*.33-.04);                             // duvet
    put(g,rr(W+.08,.05,.45,.025,FX.cream),0,.54,.12,-.02,0,0);                              // fold-back
    put(g,rr(W+.2,1.05,.08,.03,FX.sofa),0,.82,-D/2-.02);put(g,rr(W+.14,.08,.1,.03,FX.oak),0,.3,-D/2-.04); // headboard
    [-1,1].forEach(s=>pillow(g,s*(W/4),.6,-D/2+.32,s*.04,FX.linenW,.5));
    [-1,1].forEach(s=>pillow(g,s*(W/4),.68,-D/2+.46,-s*.06,s>0?FX.clay:FX.cream,.34));
    put(g,rr(.42,.04,.55,.02,FX.mustard),.0,.6,D/2-.5,0,.0,0);                              // throw
    return g};
  const nightstand=()=>{const g=new THREE.Group();const W=.4,D=.4;
    put(g,rr(W,.44,D,.01,FX.walnut),0,.36,0);legs(g,W,D,0,.14,FX.black,.012,.04);put(g,rr(W-.04,.1,.012,.004,FX.oak),0,.42,D/2+.002);put(g,rr(W-.04,.1,.012,.004,FX.oak),0,.28,D/2+.002);
    put(g,bxm(.07,.012,.02,FX.brass),0,.42,D/2+.014);put(g,bxm(.07,.012,.02,FX.brass),0,.28,D/2+.014);
    lampT(g,0,.58,0,.8);return g};
  FURN_BUILD.ns1=nightstand;FURN_BUILD.ns2=nightstand;
  FURN_BUILD.mbench=(W,D)=>{const g=new THREE.Group();
    put(g,rr(W,.14,.4,.05,FX.sofa),0,.38,0);legs(g,W,.4,0,.3,FX.black,.014,.06);return g};
  FURN_BUILD.tub=(W,D)=>{const g=new THREE.Group();
    put(g,rr(W,.55,D,.28,FX.ceramic),0,.28,0);put(g,rr(W-.1,.02,D-.12,.22,FX.water),0,.545,0).castShadow=false;
    put(g,cylM(.014,.014,.55,FX.steel,8),0,.5,-D/2+.08);put(g,rr(.02,.02,.14,.008,FX.steel),0,.78,-D/2+.15);
    put(g,rr(.16,.02,.12,.006,FX.cream),W/2-.12,.57,D/2-.4).castShadow=false;return g};
  FURN_BUILD.vanity=(W,D)=>{const g=new THREE.Group();
    put(g,rr(W,.7,D,.008,FX.walnut),0,.45,0);legs(g,W,D,0,.1,FX.black,.012,.04);
    put(g,rr(W-.06,.2,.012,.004,FX.oak),0,.62,D/2+.002);put(g,rr(W-.06,.3,.012,.004,FX.oak),0,.34,D/2+.002);
    put(g,rr(W+.02,.035,D+.02,.006,FX.stone),0,.82,0);
    put(g,cylM(.17,.12,.12,FX.ceramic,24),0,.9,.02).castShadow=true;put(g,cylM(.012,.012,.26,FX.brass,8),0,.98,-D/2+.1);
    put(g,rr(.02,.02,.1,.006,FX.brass),0,1.1,-D/2+.15);
    put(g,rr(.6,.8,.02,.3,FX.mirror),0,1.55,-D/2+.01);return g};
  FURN_BUILD.toilet=(W,D)=>{const g=new THREE.Group();
    put(g,rr(.4,.38,.14,.03,FX.ceramic),0,.55,-D/2+.07);put(g,rr(.34,.03,.16,.01,FX.steel),0,.75,-D/2+.07);
    put(g,rr(.32,.2,.3,.1,FX.ceramic),0,.29,-.0);const bowl=put(g,sphM(.19,.12,.27,FX.ceramic,18),0,.39,.07);bowl.castShadow=true;
    put(g,rr(.3,.025,.4,.12,FX.cream),0,.5,.07);return g};
  FURN_BUILD.cshelf=(W,D)=>{const g=new THREE.Group();const H=2.4;
    [-1,1].forEach(a=>put(g,bxm(.03,H,D,FX.oak),a*(W/2-.015),H/2,0));put(g,bxm(.03,H,D,FX.oak),0,H/2,0);
    put(g,bxm(W,H,.01,FX.oak),0,H/2,-D/2+.005);
    for(let i=0;i<=5;i++)put(g,bxm(W,.03,D,FX.oak),0,.03+i*.46,0);
    const rail=put(g,cylM(.011,.011,W/2-.06,FX.brass,8),-W/4,1.9,0);rail.rotation.z=Math.PI/2;
    const cc=[FX.cream,FX.sage,FX.clay,FX.sofa,FX.linenW,FX.mustard,FX.cream,FX.sage];
    for(let i=0;i<8;i++)put(g,rr(.04,.9,.2,.012,cc[i]),-W/2+.14+i*.095,1.42,0);
    [FX.sofa,FX.linenW,FX.sage].forEach((m,i)=>put(g,rr(.38,.24,.22,.03,m),W/4,.18+i*.46,0));
    put(g,rr(.36,.12,.2,.02,FX.cream),W/4,1.1,0);put(g,rr(.36,.12,.2,.02,FX.sage),W/4,1.57,0);
    return g};
  FURN_BUILD.cchest=(W,D)=>{const g=new THREE.Group();
    put(g,rr(W,.8,D,.01,FX.walnut),0,.45,0);legs(g,W,D,0,.05,FX.black,.014,.05);
    for(let r=0;r<3;r++){put(g,rr(W-.06,.2,.012,.004,FX.oak),0,.2+r*.25+.1,D/2+.002);put(g,bxm(.1,.012,.02,FX.brass),0,.3+r*.25,D/2+.014)}
    lampT(g,-W/2+.2,.85,0,.7);put(g,rr(.26,.03,.18,.008,FX.book[2]),W/2-.2,.865,0,0,.2,0);return g};
  const plantBuild=(h)=>{const g=new THREE.Group();
    put(g,cylM(.19,.14,.34,FX.terra,16),0,.17,0).castShadow=true;put(g,cylM(.17,.17,.02,mat.soil,16),0,.33,0);
    put(g,cylM(.014,.02,h*.7,FX.walnut,6),0,.34+h*.35,0);
    const r=rng(21+Math.round(h*10));
    for(let i=0;i<14;i++){const a=r()*Math.PI*2,hh=.5+r()*h*.7,rad=.08+r()*.22;
      const l=put(g,sphM(.17,.015,.11,mat.leaf,8),Math.sin(a)*rad,.34+hh,Math.cos(a)*rad,(r()-.5)*.7,a,(r()-.5)*.6);l.scale.multiplyScalar(.6+r()*.4);l.castShadow=true}
    return g};
  const pendant=(x,yTop,drop,z,s=1)=>{const g=new THREE.Group();
    put(g,cylM(.005,.005,drop,FX.black,6),0,-drop/2,0);
    put(g,cylM(.05*s,.17*s,.2*s,FX.black,20),0,-drop-.1*s,0);
    put(g,sphM(.055*s,.04*s,.055*s,mat.lamp,8),0,-drop-.19*s,0);
    g.position.set(x,yTop,z);return g};
  const floorLamp=(x,y,z)=>{const g=new THREE.Group();
    put(g,cylM(.12,.14,.025,FX.black,18),0,.012,0);put(g,cylM(.01,.01,1.45,FX.brass,8),0,.74,0);
    put(g,cylM(.09,.15,.22,FX.shade,20),0,1.55,0);g.position.set(x,y,z);return g};
  const artFrame=(w,h,m,x,y,z,ry)=>{const g=new THREE.Group();put(g,rr(w+.06,h+.06,.03,.004,FX.black),0,0,0);put(g,new THREE.Mesh(new THREE.PlaneGeometry(w,h),m),0,0,.017);g.position.set(x,y,z);g.rotation.y=ry;return g};

  FURN.forEach(f=>{
    if(FURN_SKIP[f.id])return;
    const base=FLOOR_Y[f.lv]+.012,b=f.b,bf=FURN_BUILD[f.id];
    const fw=b[1]-b[0],fd=b[5]-b[4];
    if(bf){
      const ang=FURN_FACE[f.id]||0,rot=Math.abs(ang)===90;
      const obj=bf(rot?fd:fw,rot?fw:fd);obj.rotation.y=ang*Math.PI/180;
      obj.position.set((b[0]+b[1])/2,base+(f.id==='cab'?b[2]:0),(b[4]+b[5])/2);
      const sz=new THREE.Vector3();
      obj.traverse(o=>{if(!o.isMesh)return;o.receiveShadow=true;o.geometry.computeBoundingBox();o.geometry.boundingBox.getSize(sz);
        const x=sz.x*o.scale.x,y=sz.y*o.scale.y,z=sz.z*o.scale.z;o.castShadow=Math.max(x,y,z)>.14&&Math.min(x,y,z)>.015});
      world.add(obj);(furnMeshes[f.g]||furnMeshes.furn).push(obj);
    }else{
      const m=bx(b[0],b[1],base+b[2],base+b[3],b[4],b[5],FM[f.m],{cast:b[3]>.15});(furnMeshes[f.g]||furnMeshes.furn).push(m);
    }
    if(f.col&&b[3]-b[2]>.3)addCol(b[0],b[1],b[4],b[5],f.lv);
  });
  PLANTS.forEach(p=>{
    const base=FLOOR_Y[p.lv]+.012,o=plantBuild(p.h);o.position.set(p.x,base,p.z);world.add(o);furnMeshes.furn.push(o);addCol(p.x-.22,p.x+.22,p.z-.22,p.z+.22,p.lv);
  });
  // extras: pendants, floor lamp, wall art
  {const y0=FLOOR_Y[0]+.012,y1=FLOOR_Y[1]+.012,ex=[];
    ex.push(pendant(-.55,2.78,.85,-1.28,.65),pendant(-.25,2.78,.85,-1.28,.65),pendant(-.325,2.78,.8,.05,.9));
    ex.push(floorLamp(-1.45,y0,.55));
    ex.push(artFrame(.9,.6,FX.art,2.8,y0+1.5,-1.735,0),artFrame(.5,.7,FX.art2,1.2,y0+1.5,-1.735,0),artFrame(.9,.55,FX.art2,3.1,y1+1.8,.875,0));
    ex.forEach(o=>{o.traverse(c=>{if(c.isMesh){c.castShadow=false}});world.add(o);furnMeshes.furn.push(o)})}
  // ceiling lights + interior point lights
  const intLights=[],lampMeshes=[];
  [[-2.6,-.5,0],[-.4,-.2,0],[2.1,-.5,0],[-1.8,-.7,1],[2.6,2.0,1],[1.5,-.9,1],[3.6,-.9,1]].forEach(([x,z,lv])=>{
    const y=lv?6.19:2.79;
    const d=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.02,16),mat.lamp);d.position.set(x,y,z);world.add(d);lampMeshes.push(d);
    const pl=new THREE.PointLight(0xffb066,0,8,2);pl.position.set(x,y-.4,z);world.add(pl);intLights.push(pl);
  });
  // TV glow light
  const tvLight=new THREE.PointLight(0x7aa2ff,0,4,2);tvLight.position.set(-3.8,1.3,-.5);world.add(tvLight);
  const isDay=()=>st.day&&st.mode!=='interior';
  const SCENES={warm:{c:0xffb066,pl:.9,em:.36,wall:0x3a2410},cozy:{c:0xff9a4d,pl:.6,em:.32,wall:0x2e1b0b},bright:{c:0xfff1de,pl:1.6,em:.95,wall:0x4a3a28},cinema:{c:0x7c9bff,pl:.22,em:.12,wall:0x10151f}};
  const il={scene:'warm',br:1};
  function applyInterior(){
    const sc=SCENES[il.scene],k=il.br*(isDay()?.4:1)*(bStage>=7?1:0);
    intLights.forEach(l=>{l.color.setHex(sc.c);l.intensity=sc.pl*k*1.15});
    mat.inWall.emissive.setHex(sc.wall);mat.inWall.emissiveIntensity=sc.em*k;
    mat.ceil.emissive.setHex(sc.wall);mat.ceil.emissiveIntensity=sc.em*k*.8;
    mat.lamp.color.setHex(il.scene==='cinema'?0x9fb4ff:0xfff2d0);
    const cin=il.scene==='cinema';tvLight.color.setHex(0x7aa2ff);tvLight.intensity=(cin?1.4:.35)*(furnMeshes.tv[0]&&furnMeshes.tv[0].visible?1:0);
    FM.tv.emissiveIntensity=cin?1.4:.5;
  }

  /* ---------- lights ---------- */
  curStage=-1;
  const hemi=new THREE.HemisphereLight(0xa3acc2,0x2b2622,.6);scene.add(hemi);
  const moon=new THREE.DirectionalLight(0xbac4ff,.75);moon.position.set(-9,18,14);moon.castShadow=true;
  moon.shadow.mapSize.set(2048,2048);Object.assign(moon.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:1,far:60});moon.shadow.bias=-.0004;moon.shadow.normalBias=.03;scene.add(moon);

  /* =========================================================
     STATE
     ========================================================= */
  const st={day:true,smart:true,glassTint:false,mode:'models',size:80,az:Math.PI/4,el:32.5,zoomMul:1,tx:.3,ty:2.1,tz:0,auto:false,autoSpeed:0,vaz:0,
            cur:{az:Math.PI/4,el:32.5,zoom:1,tx:.3,ty:2.1,tz:0}};
  let climate='temperate';
  function applyTheme(){
    const night=!isDay(),lightsOn=night&&st.smart;
    hemi.intensity=isDay()?.95:.6;hemi.color.setHex(isDay()?0xdfe8ff:0xa3acc2);
    moon.intensity=isDay()?1.3:.75;moon.color.setHex(isDay()?0xfff1dc:0xbac4ff);
    renderer.toneMappingExposure=isDay()?1.0:.95;
    lightsNight.forEach(o=>{if(o.isLight)o.intensity=lightsOn?o.userData.pl:0;else if(o.material&&o.userData.op!==undefined){o.material.opacity=lightsOn?o.userData.op:0}else o.visible=lightsOn});
    bulbMats.forEach(m=>{m.opacity=lightsOn?1:(night?.25:0)});
    if(SCN.shadowPlane)SCN.shadowPlane.material.opacity=isDay()?.6:1;
    if(SCN.gridMats)SCN.gridMats.forEach(m=>m.color.setHex(isDay()?0x35503f:0xcfe0d4))
    mat.glass.opacity=st.glassTint?.62:(st.mode==='interior'?.07:.16);
    app.classList.toggle('night',!st.day&&st.mode==='models');
    applyInterior();
  }
  function applyClimate(){
    const cfg={temperate:{leaves:false,shrub:0x1f2c24,bulb:0xe89a45},arid:{leaves:false,shrub:0x6d6a45,bulb:0xe08a38},tropical:{leaves:true,leaf:0x2f6b3c,shrub:0x1f4a2b,bulb:0xf0b565}}[climate];
    treeLeafGroups.forEach(g=>g.visible=cfg.leaves);if(cfg.leaf)mat.leaf.color.setHex(cfg.leaf);mat.shrub.color.setHex(cfg.shrub);bulbMats.forEach(m=>m.color.setHex(cfg.bulb));
  }

  /* =========================================================
     CAMERAS
     ========================================================= */
  const TARGET=new THREE.Vector3();
  function viewport(){const w=stageEl.clientWidth,h=stageEl.clientHeight;return{w,h,desktop:window.innerWidth>900}}
  function layoutCam(){
    const{w,h,desktop}=viewport(),aspect=w/h;
    const walkM=st.mode==='interior';
    const freeL=desktop?360:0,freeR=desktop?136:0,freeW=w-freeL-freeR;
    const cx=(freeL+freeW/2)/w,cy=desktop?.55:.58;
    const needW=19.5*(w/freeW);let viewH=Math.max(19.5,needW/aspect);viewH/=st.cur.zoom;
    cam.left=-viewH*aspect*cx;cam.right=viewH*aspect*(1-cx);cam.top=viewH*cy;cam.bottom=-viewH*(1-cy);cam.updateProjectionMatrix();
  }
  function placeCam(){
    const el=st.cur.el*Math.PI/180,az=st.cur.az,d=70;TARGET.set(st.cur.tx,st.cur.ty,st.cur.tz);
    cam.position.set(TARGET.x+d*Math.cos(el)*Math.sin(az),TARGET.y+d*Math.sin(el),TARGET.z+d*Math.cos(el)*Math.cos(az));cam.lookAt(TARGET);
  }
  function resize(){
    const{w,h}=viewport();if(!w||!h)return;
    renderer.setSize(w,h,false);pcam.aspect=w/h;pcam.updateProjectionMatrix();
    bulbMats.forEach(m=>{m.size=m.userData.base*DPR*(w>900?1:.9)});layoutCam();
  }
  new ResizeObserver(resize).observe(stageEl);window.addEventListener('resize',resize);

  const VIEWS={iso:[Math.PI/4,32.5],front:[0,9],right:[Math.PI/2,9],back:[Math.PI,9],left:[-Math.PI/2,9],top:[Math.PI/4,88]};
  function setView(name){
    const v=VIEWS[name];if(!v)return;stopAuto();st.vaz=0;
    st.az=st.cur.az+wrapPI(v[0]-st.cur.az);st.el=v[1];hooks.view&&hooks.view(name);
  }
  function stopAuto(){if(st.auto){st.auto=false;hooks.auto&&hooks.auto(false)}}
  function setAuto(on){st.auto=on;if(on){st.vaz=0;st.autoSpeed=0}hooks.auto&&hooks.auto(on)}
  function setSize(v,silent){
    st.size=Math.round(clamp(v,40,130)/5)*5;hooks.size&&hooks.size(st.size);
  }

  /* =========================================================
     EXTERIOR INTERACTION: orbit, hover, pick, pins
     ========================================================= */
  const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
  let drag=null,pinsOn=false,hoverPart=null,pointer={x:0,y:0,over:false,dirty:false};
  const PART_MATS={roof:[mat.roof,mat.trim],wall:[mat.wall,mat.accent],glass:[mat.glass],land:[mat.shrub,mat.bark,mat.soil],deck:[mat.terrace,mat.plat]};
  const PART_LABEL={roof:['Roof','Roofing materials'],wall:['Walls','Wall materials'],glass:['Windows','Technological filling'],land:['Landscape','Landscape plans'],deck:['Terrace & paving','Landscape plans']};
  function setHover(p){
    if(p===hoverPart)return;
    if(hoverPart)(PART_MATS[hoverPart]||[]).forEach(m=>m.emissive.setHex(0x000000));
    hoverPart=p;
    if(p)(PART_MATS[p]||[]).forEach(m=>m.emissive.setHex(p==='glass'?0x553a10:0x2e2410));
    canvas.style.cursor=p&&!pinsOn?'pointer':'';
  }
  function pickAt(clientX,clientY,list){
    const r=canvas.getBoundingClientRect();ndc.set(((clientX-r.left)/r.width)*2-1,-((clientY-r.top)/r.height)*2+1);
    ray.setFromCamera(ndc,st.mode==='interior'?pcam:cam);return ray.intersectObjects(list||pickables,false).find(h=>{let o=h.object;while(o){if(!o.visible)return false;o=o.parent}return true})||null;
  }
  canvas.addEventListener('pointerdown',e=>{
    if(st.mode==='interior'){walkDown(e);return}
    stopAuto();drag={x:e.clientX,y:e.clientY,az:st.az,el:st.el,moved:false,lx:e.clientX,lt:performance.now(),v:0};
    try{canvas.setPointerCapture(e.pointerId)}catch(_){}
    canvas.classList.add('drag');setHover(null);canvas.focus({preventScroll:true});
  });
  canvas.addEventListener('pointermove',e=>{
    pointer.x=e.clientX;pointer.y=e.clientY;pointer.over=true;pointer.dirty=true;
    if(st.mode==='interior'){walkMove(e);return}
    if(B.on&&!(drag&&drag.moved))bHoverReq(e.clientX,e.clientY,e.shiftKey);
    if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(Math.abs(dx)>4||Math.abs(dy)>4)drag.moved=true;
    if(drag.moved){
      st.az=drag.az-dx*.0075;st.el=clamp(drag.el+dy*.25,8,88);
      const now=performance.now(),dt=Math.max(1,now-drag.lt);drag.v=lerp(drag.v,-(e.clientX-drag.lx)*.0075/dt*1000,.5);drag.lx=e.clientX;drag.lt=now;hooks.view&&hooks.view(null);
    }
  });
  const endDrag=e=>{
    if(st.mode==='interior'){walkUp(e);return}
    if(!drag)return;const d=drag;drag=null;canvas.classList.remove('drag');
    if(d.moved){st.vaz=Math.abs(d.v)>.2&&performance.now()-d.lt<90?clamp(d.v,-6,6):0;return}
    // click
    if(B.on){bClick(e.clientX,e.clientY,e.shiftKey);return}
    if(pinsOn){
      const hit=pickAt(e.clientX,e.clientY);
      let pt=hit?hit.point.clone():null;
      if(!pt){const pl=new THREE.Plane(new THREE.Vector3(0,1,0),0),v=new THREE.Vector3();if(ray.ray.intersectPlane(pl,v))pt=v}
      if(pt)hooks.pin&&hooks.pin(pt.x,pt.y,pt.z,e.clientX,e.clientY);
    }else{
      const hit=pickAt(e.clientX,e.clientY);
      if(hit&&hit.object.userData.part)hooks.pick&&hooks.pick(hit.object.userData.part,PART_LABEL[hit.object.userData.part]);
    }
  };
  canvas.addEventListener('pointerup',endDrag);
  canvas.addEventListener('pointercancel',()=>{drag=null;canvas.classList.remove('drag');walkCancel()});
  canvas.addEventListener('pointerleave',()=>{pointer.over=false;setHover(null);hooks.tip&&hooks.tip(null);bLeave()});
  canvas.addEventListener('wheel',e=>{if(st.mode==='interior')return;e.preventDefault();setSize(st.size*(e.deltaY<0?1.08:.93))},{passive:false});
  canvas.addEventListener('keydown',e=>{
    if(st.mode!=='models')return;
    const k=e.key;
    if(k==='ArrowLeft'){st.az+=.2;stopAuto();hooks.view&&hooks.view(null);e.preventDefault()}
    else if(k==='ArrowRight'){st.az-=.2;stopAuto();hooks.view&&hooks.view(null);e.preventDefault()}
    else if(k==='ArrowUp'){st.el=clamp(st.el+5,8,88);e.preventDefault()}
    else if(k==='ArrowDown'){st.el=clamp(st.el-5,8,88);e.preventDefault()}
  });

  /* =========================================================
     WALK (first person)
     ========================================================= */
  const walk={x:-2.9,z:-.4,lv:0,y:0,yaw:-Math.PI/2,pitch:0,vx:0,vz:0,target:null,anim:null,bob:0,keys:{},joy:{x:0,y:0},room:'',stuck:0,busy:false,look:null,run:false};
  const ringMesh=new THREE.Mesh(new THREE.RingGeometry(.12,.17,28),new THREE.MeshBasicMaterial({color:0xffc933,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));
  ringMesh.rotation.x=-Math.PI/2;world.add(ringMesh);
  const R=.22;
  function collide(x,z,lv){
    for(let pass=0;pass<3;pass++){
      for(const c of colliders){
        if(c.lv!==lv)continue;
        const nx=clamp(x,c.x0,c.x1),nz=clamp(z,c.z0,c.z1),dx=x-nx,dz=z-nz,d2=dx*dx+dz*dz;
        if(d2<R*R){
          if(d2>1e-8){const d=Math.sqrt(d2),k=(R-d)/d;x+=dx*k;z+=dz*k}
          else{ // centre inside: push out the shortest way
            const l=x-c.x0,r=c.x1-x,t=z-c.z0,b=c.z1-z,m=Math.min(l,r,t,b);
            if(m===l)x=c.x0-R;else if(m===r)x=c.x1+R;else if(m===t)z=c.z0-R;else z=c.z1+R;
          }
        }
      }
    }
    if(lv===0){x=clamp(x,-6.8,6.8);z=clamp(z,-4.8,4.8)}
    return[x,z];
  }
  function roomAt(x,z,lv){
    for(const r of ROOMS){if(r.lv!==lv)continue;const[x0,x1,z0,z1]=r.r;if(x>=x0&&x<=x1&&z>=z0&&z<=z1)return r}
    if(lv===0&&(x<-4.5||x>4||z>1||z<-3.2))return{id:'outside',name:'Terrace & garden'};
    return null;
  }
  const floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  let wd=null;
  function walkDown(e){if(walk.anim)return;wd={x:e.clientX,y:e.clientY,yaw:walk.yaw,pitch:walk.pitch,moved:false};try{canvas.setPointerCapture(e.pointerId)}catch(_){}canvas.classList.add('drag');canvas.focus({preventScroll:true})}
  function walkMove(e){if(!wd)return;const dx=e.clientX-wd.x,dy=e.clientY-wd.y;if(Math.abs(dx)>4||Math.abs(dy)>4)wd.moved=true;if(wd.moved){walk.yaw=wd.yaw-dx*.0045;walk.pitch=clamp(wd.pitch-dy*.0045,-1.15,1.15)}}
  function walkUp(e){
    if(!wd)return;const d=wd;wd=null;canvas.classList.remove('drag');
    if(!d.moved&&!walk.anim){
      const r=canvas.getBoundingClientRect();ndc.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,pcam);
      floorPlane.constant=-(FLOOR_Y[walk.lv]);const p=new THREE.Vector3();
      if(ray.ray.intersectPlane(floorPlane,p)&&p.distanceTo(pcam.position)<14){walk.target={x:p.x,z:p.z};walk.stuck=0;ringMesh.position.set(p.x,FLOOR_Y[walk.lv]+.04,p.z);ringMesh.userData.t=0}
    }
  }
  function walkCancel(){wd=null;canvas.classList.remove('drag')}
  window.addEventListener('keydown',e=>{
    if(st.mode!=='interior'||e.metaKey||e.ctrlKey||e.altKey)return;
    const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable))return;
    const k=e.key.length===1?e.key.toLowerCase():e.key;
    if(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Shift'].includes(k)){walk.keys[k]=true;if(k!=='Shift'){walk.target=null;if(walk.anim)endAnim()}e.preventDefault()}
  });
  window.addEventListener('keyup',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;walk.keys[k]=false});
  window.addEventListener('blur',()=>{walk.keys={}});

  function veil(fn,hold=60){
    const v=$('#veil');v.classList.add('on');
    return new Promise(res=>setTimeout(()=>{try{fn&&fn()}finally{setTimeout(()=>{v.classList.remove('on');setTimeout(res,260)},hold)}},270));
  }
  const ascPath=p=>{ // 0→1 along stairs, returns x,z,y,yaw,pitch
    const A=[-3.7,-1.55],B=[-4.0,-2.5],C=[-1.15,-2.5],D=[-.55,-1.25];
    if(p<.18){const u=easeInOut(p/.18);return{x:lerp(A[0],B[0],u),z:lerp(A[1],B[1],u),y:lerp(0,.15,u),yaw:-Math.PI/2+.6*(1-u),pitch:.0}}
    if(p<.82){const u=(p-.18)/.64;return{x:lerp(B[0],C[0],u),z:B[1],y:lerp(.15,3.1,u),yaw:-Math.PI/2,pitch:.18*Math.sin(u*Math.PI)}}
    const u=easeInOut((p-.82)/.18);return{x:lerp(C[0],D[0],u),z:lerp(C[1],D[1],u),y:3.1,yaw:-Math.PI/2-.2*u*0+(Math.PI*.5*0),pitch:0}
  };
  function endAnim(){
    if(!walk.anim)return;const a=walk.anim;walk.anim=null;walk.lv=a.to;walk.y=FLOOR_Y[a.to];
    const f=a.to===1?ascPath(1):ascPath(0);walk.x=f.x;walk.z=f.z;walk.yaw=a.to===1?-Math.PI/2+Math.PI*.35:Math.PI/2*0+(-Math.PI/2);walk.pitch=0;
    hooks.level&&hooks.level(a.to);
  }
  async function goLevel(lv){
    if(walk.lv===lv||walk.anim||walk.busy)return false;walk.busy=true;
    await veil(()=>{const s=lv===1?ascPath(0):ascPath(1);walk.x=s.x;walk.z=s.z;walk.y=lv===1?0:3.1;walk.yaw=-Math.PI/2;walk.target=null});
    walk.anim={t:0,dur:2.8,to:lv,from:1-lv};walk.busy=false;return true;
  }
  async function goRoom(id){
    const rm=ROOMS.find(r=>r.id===id);if(!rm||walk.busy)return;walk.busy=true;
    await veil(()=>{walk.anim=null;walk.lv=rm.lv;walk.y=FLOOR_Y[rm.lv];[walk.x,walk.z]=collide(rm.spawn[0],rm.spawn[1],rm.lv);walk.yaw=rm.spawn[2];walk.pitch=0;walk.target=null;hooks.level&&hooks.level(rm.lv)});
    walk.busy=false;
  }
  function teleport(x,z,lv){ // used by the minimap
    if(walk.busy)return;walk.busy=true;
    veil(()=>{walk.anim=null;walk.lv=lv;walk.y=FLOOR_Y[lv];[walk.x,walk.z]=collide(x,z,lv);walk.target=null;hooks.level&&hooks.level(lv)}).then(()=>{walk.busy=false});
  }
  function stepWalk(dt){
    if(walk.anim){
      const a=walk.anim;a.t+=dt;const p=clamp(a.t/a.dur,0,1),pp=a.to===1?easeInOut(p):1-easeInOut(p);
      const s=ascPath(pp),ds=ascPath(clamp(pp+(a.to===1?.02:-.02),0,1));
      walk.x=s.x;walk.z=s.z;walk.y=s.y;
      let yaw=Math.atan2(-(ds.x-s.x),-(ds.z-s.z));if(Math.abs(ds.x-s.x)+Math.abs(ds.z-s.z)<1e-5)yaw=walk.yaw;
      walk.yaw+=wrapPI(yaw-walk.yaw)*Math.min(1,dt*6);walk.pitch=lerp(walk.pitch,(a.to===1?s.pitch:-s.pitch*.6),Math.min(1,dt*5));
      if(p>=1){walk.anim=null;walk.lv=a.to;walk.y=FLOOR_Y[a.to];walk.pitch=0;hooks.level&&hooks.level(a.to)}
      return;
    }
    const k=walk.keys;let f=0,s=0;
    if(k.w||k.ArrowUp)f+=1;if(k.s||k.ArrowDown)f-=1;if(k.d)s+=1;if(k.a)s-=1;
    f+=-walk.joy.y;s+=walk.joy.x;
    if(k.ArrowLeft)walk.yaw+=dt*1.9;if(k.ArrowRight)walk.yaw-=dt*1.9;
    const sp=(k.Shift?3.3:1.7);let wx=0,wz=0;
    if(Math.abs(f)+Math.abs(s)>.02){
      walk.target=null;const l=Math.hypot(f,s)>1?Math.hypot(f,s):1;f/=l;s/=l;
      const fx=-Math.sin(walk.yaw),fz=-Math.cos(walk.yaw),rx=Math.cos(walk.yaw),rz=-Math.sin(walk.yaw);
      wx=(fx*f+rx*s)*sp;wz=(fz*f+rz*s)*sp;
    }else if(walk.target){
      const dx=walk.target.x-walk.x,dz=walk.target.z-walk.z,d=Math.hypot(dx,dz);
      if(d<.14){walk.target=null}else{wx=dx/d*1.9;wz=dz/d*1.9;const want=Math.atan2(-dx,-dz);walk.yaw+=wrapPI(want-walk.yaw)*Math.min(1,dt*4)}
    }
    const kk=1-Math.exp(-dt*10);walk.vx=lerp(walk.vx,wx,kk);walk.vz=lerp(walk.vz,wz,kk);
    const ox=walk.x,oz=walk.z;
    const[nx,nz]=collide(walk.x+walk.vx*dt,walk.z+walk.vz*dt,walk.lv);walk.x=nx;walk.z=nz;
    const moved=Math.hypot(walk.x-ox,walk.z-oz)/Math.max(dt,1e-4);
    if(walk.target){if(moved<.25){walk.stuck+=dt;if(walk.stuck>.5)walk.target=null}else walk.stuck=0}
    walk.bob+=moved*dt*5.2;
    walk.y=lerp(walk.y,FLOOR_Y[walk.lv],1-Math.exp(-dt*12));
  }
  function updateWalkCam(dt){
    const bobAmp=REDUCED?0:.022,by=Math.sin(walk.bob)*bobAmp;
    pcam.position.set(walk.x,walk.y+1.64+by,walk.z);pcam.rotation.set(walk.pitch,walk.yaw,0,'YXZ');
    if(ringMesh.userData.t!==undefined){ringMesh.userData.t+=dt;const t=ringMesh.userData.t;ringMesh.material.opacity=walk.target?Math.max(0,.85-(t%1.1)*.6):Math.max(0,ringMesh.material.opacity-dt*4);const sc=1+(t%1.1)*1.4;ringMesh.scale.set(sc,sc,sc)}
    const r=roomAt(walk.x,walk.z,walk.lv),id=r?r.id:'';
    if(id!==walk.room){walk.room=id;hooks.room&&hooks.room(r)}
    hooks.walk&&hooks.walk({x:walk.x,z:walk.z,yaw:walk.yaw,lv:walk.lv});
  }

  /* =========================================================
     MODES
     ========================================================= */
  function setMode(m){
    st.mode=m;
    if(m==='interior'){pcam.fov=+($('#fovRange').value);pcam.updateProjectionMatrix();ringMesh.visible=true}else{ringMesh.visible=false;walk.keys={};walk.joy={x:0,y:0}}
    renderer.shadowMap.enabled=st.shadows!==false;
    applyTheme();layoutCam();
  }
  async function enterInterior(roomId){
    const rm=ROOMS.find(r=>r.id===(roomId||'living'));
    walk.x=rm.spawn[0];walk.z=rm.spawn[1];walk.lv=rm.lv;walk.y=FLOOR_Y[rm.lv];walk.yaw=rm.spawn[2];walk.pitch=0;walk.target=null;walk.anim=null;walk.vx=walk.vz=0;
    [walk.x,walk.z]=collide(walk.x,walk.z,walk.lv);
  }

  /* =========================================================
     FRAME LOOP
     ========================================================= */
  const clock=new THREE.Clock();let fpsAcc=0,fpsN=0,lastDeg=-1;
  let hoverCool=0;
  function frame(){
    const dt=Math.min(clock.getDelta(),.05);
    if(growing.length)updateGrow(performance.now());
    if(!REDUCED&&st.mode==='models'&&treeGroup.visible){const tt=clock.elapsedTime;for(let i=0;i<treeLeafGroups.length;i++){const lg=treeLeafGroups[i];lg.rotation.z=Math.sin(tt*.7+i*1.9)*.014;lg.rotation.x=Math.cos(tt*.55+i*2.3)*.01}}
    if(st.mode==='drawings'){requestAnimationFrame(frame);return}
    const c=st.cur;
    if(st.mode==='interior'){
      stepWalk(dt);updateWalkCam(dt);renderer.render(scene,pcam);
    }else{
      // 360 tour + inertia
      if(st.auto){st.autoSpeed=lerp(st.autoSpeed,.52,1-Math.exp(-dt*2.2));st.az+=st.autoSpeed*dt;hooks.view&&hooks.view(null)}
      else if(Math.abs(st.vaz)>.004&&!drag){st.az+=st.vaz*dt;st.vaz*=Math.exp(-dt*3.2)}else if(!drag)st.vaz=0;
      const k=1-Math.exp(-dt*(drag?30:9));
      c.zoom=lerp(c.zoom,st.zoomMul*st.size/80,1-Math.exp(-dt*9));c.tx=lerp(c.tx,st.tx,k);c.ty=lerp(c.ty,st.ty,k);c.tz=lerp(c.tz,st.tz,k);
      c.az=lerp(c.az,st.az,k);c.el=lerp(c.el,st.el,k);
      placeCam();layoutCam();
      const deg=Math.round(((c.az*180/Math.PI)%360+360)%360);if(deg!==lastDeg){lastDeg=deg;hooks.deg&&hooks.deg(deg)}
      // hover
      hoverCool-=dt;
      if(!B.on&&pointer.dirty&&pointer.over&&!drag&&!pinsOn&&hoverCool<=0){
        pointer.dirty=false;hoverCool=.04;const hit=pickAt(pointer.x,pointer.y);const p=hit&&hit.object.userData.part||null;setHover(p);
        hooks.tip&&hooks.tip(p?PART_LABEL[p][0]:null,pointer.x,pointer.y,p?PART_LABEL[p][1]:'');
      }else if(!B.on&&pointer.dirty&&pointer.over){hooks.tip&&hooks.tip(hoverPart?PART_LABEL[hoverPart][0]:null,pointer.x,pointer.y,hoverPart?PART_LABEL[hoverPart][1]:'')}
      // pins
      hooks.frame&&hooks.frame(cam);
      renderer.render(scene,cam);
    }
    fpsAcc+=dt;fpsN++;if(fpsAcc>.5){hooks.fps&&hooks.fps(Math.round(fpsN/fpsAcc));fpsAcc=0;fpsN=0}
    requestAnimationFrame(frame);
  }

  /* =========================================================
     BUILDER — grid walls, openings, floors, roofs (Create mode)
     ========================================================= */
  const BU=.5,BH=2.8,BT=.2,GXr=[-15,15],GZr=[-11,11],CUT=1.15;
  const OPEN={door:{n:2,label:'Door'},window:{n:3,label:'Window'},glass:{n:4,label:'Glass wall'},slide:{n:4,label:'Sliding door'}};
  const bgrp=new THREE.Group(),bghost=new THREE.Group(),bgridG=new THREE.Group();
  scene.add(bgrp,bghost,bgridG);bgrp.visible=false;bgridG.visible=false;
  const B={on:false,tool:'wall',lv:0,cut:true,edges:new Map(),floors:new Map(),roofs:[],nid:1,start:null,cursor:null,undo:[],redo:[],floorMat:0,roofStyle:'flat',result:false,sig:''};
  const bm={door:MS(0xb0825a,{roughness:.7}),handle:MS(0x1f1b17,{roughness:.4,metalness:.5}),conc:MS(0xc9c6bf,{roughness:.9}),
    ok:new THREE.MeshBasicMaterial({color:0x3f9a6a,transparent:true,opacity:.48,depthTest:false,depthWrite:false}),
    bad:new THREE.MeshBasicMaterial({color:0xd0503a,transparent:true,opacity:.5,depthTest:false,depthWrite:false}),
    mark:new THREE.MeshBasicMaterial({color:0x2f7a52,depthTest:false,transparent:true,opacity:.95,side:THREE.DoubleSide}),
    line:new THREE.MeshBasicMaterial({color:0x2f7a52,depthTest:false,transparent:true,opacity:.9})};
  const FLOOR_MATS=[mat.floor,mat.floorTile,bm.conc];
  /* grid + plot outline */
  const gridMat=new THREE.LineBasicMaterial({color:0x35503f,transparent:true,opacity:.16}),gridMajMat=new THREE.LineBasicMaterial({color:0x35503f,transparent:true,opacity:.3});
  {const a=[],b=[];
    for(let i=GXr[0];i<=GXr[1];i++){(i%2===0?b:a).push(i*BU,0,GZr[0]*BU,i*BU,0,GZr[1]*BU)}
    for(let j=GZr[0];j<=GZr[1];j++){(j%2===0?b:a).push(GXr[0]*BU,0,j*BU,GXr[1]*BU,0,j*BU)}
    const ga=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(a,3)),gb=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(b,3));
    bgridG.add(new THREE.LineSegments(ga,gridMat),new THREE.LineSegments(gb,gridMajMat));
    bgridG.position.y=.045;}
  SCN.gridMats=[gridMat,gridMajMat];
  const bmark=new THREE.Mesh(new THREE.RingGeometry(.13,.22,24),bm.mark);bmark.rotation.x=-Math.PI/2;bmark.visible=false;bmark.renderOrder=20;scene.add(bmark);

  const ek=(lv,ax,i,j)=>lv+','+ax+','+i+','+j;
  const pk=k=>{const a=k.split(',');return{lv:+a[0],ax:a[1],i:+a[2],j:+a[3]}};
  const hasE=(lv,ax,i,j)=>B.edges.has(ek(lv,ax,i,j));
  const lineEdge=(lv,ax,line,idx)=>ax==='x'?ek(lv,'x',idx,line):ek(lv,'z',line,idx);
  const vdeg=(lv,i,j)=>(hasE(lv,'x',i-1,j)?1:0)+(hasE(lv,'x',i,j)?1:0)+(hasE(lv,'z',i,j-1)?1:0)+(hasE(lv,'z',i,j)?1:0);

  /* ---------- geometry ---------- */
  function bbox(x0,x1,y0,y1,z0,z1,m,meta,cast=true){
    if(y1-y0<1e-4||x1-x0<1e-4||z1-z0<1e-4)return null;
    const me=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0),m);
    me.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);me.castShadow=cast;me.receiveShadow=true;Object.assign(me.userData,meta);bgrp.add(me);return me;
  }
  function bplane(x0,x1,z0,z1,y,m,meta){
    const geo=new THREE.PlaneGeometry(x1-x0,z1-z0);geo.rotateX(-Math.PI/2);
    const p=geo.attributes.position,u=geo.attributes.uv,cx=(x0+x1)/2,cz=(z0+z1)/2;
    for(let i=0;i<p.count;i++)u.setXY(i,(p.getX(i)+cx)*.8,(p.getZ(i)+cz)*.8);
    const me=new THREE.Mesh(geo,m);me.position.set(cx,y,cz);me.receiveShadow=true;Object.assign(me.userData,meta);bgrp.add(me);return me;
  }
  function clearGroup(g){while(g.children.length){const c=g.children.pop();c.parent=null;if(c.geometry)c.geometry.dispose()}}
  const cutting=()=>B.on&&B.cut;

  function wallSegment(lv,ax,line,i0,i1,o){
    const yb=lv*BH,top=cutting()&&lv>=B.lv?yb+CUT:1e9,c=line*BU;
    const SB=(y0,y1,a0,a1,th,m,meta,cast)=>{if(y0>=top)return;const yy=Math.min(y1,top);
      if(ax==='x')bbox(a0,a1,y0,yy,c-th/2,c+th/2,m,meta,cast);else bbox(c-th/2,c+th/2,y0,yy,a0,a1,m,meta,cast)};
    const nb0=B.edges.has(lineEdge(lv,ax,line,i0-1)),nb1=B.edges.has(lineEdge(lv,ax,line,i1));
    const a0=i0*BU,a1=i1*BU;
    if(!o){SB(yb,yb+BH,a0-(nb0?0:BT/2),a1+(nb1?0:BT/2),BT,mat.wall,{kind:'wall',lv});return}
    const meta={kind:'opening',lv,id:o.id},t=o.t,m=(a0+a1)/2;
    const e0=a0-(nb0?0:BT/2),e1=a1+(nb1?0:BT/2);
    if(t==='door'){
      SB(yb+2.1,yb+BH,e0,e1,BT,mat.wall,meta);
      SB(yb+.02,yb+2.08,a0+.06,a1-.06,.05,bm.door,meta);
      SB(yb+.95,yb+1.08,a1-.2,a1-.1,.1,bm.handle,meta,false);
      SB(yb,yb+2.1,a0,a0+.05,BT+.04,mat.trim,meta);SB(yb,yb+2.1,a1-.05,a1,BT+.04,mat.trim,meta);SB(yb+2.05,yb+2.1,a0,a1,BT+.04,mat.trim,meta);
    }else if(t==='window'){
      SB(yb,yb+.9,e0,e1,BT,mat.wall,meta);SB(yb+2.1,yb+BH,e0,e1,BT,mat.wall,meta);
      SB(yb+.9,yb+2.1,a0,a1,.03,mat.glass,meta,false);
      SB(yb+.9,yb+2.1,a0,a0+.05,.11,mat.frame,meta);SB(yb+.9,yb+2.1,a1-.05,a1,.11,mat.frame,meta);
      SB(yb+.9,yb+.95,a0,a1,.11,mat.frame,meta);SB(yb+2.05,yb+2.1,a0,a1,.11,mat.frame,meta);
      SB(yb+1.45,yb+1.5,a0,a1,.09,mat.frame,meta);
      for(let x=a0+1;x<a1-.2;x+=1)SB(yb+.9,yb+2.1,x-.02,x+.02,.09,mat.frame,meta);
      SB(yb+.9,yb+.95,a0-.04,a1+.04,BT+.1,mat.trim,meta);
    }else if(t==='glass'){
      SB(yb+2.6,yb+BH,e0,e1,BT,mat.wall,meta);
      SB(yb,yb+2.6,a0,a1,.03,mat.glass,meta,false);
      for(let x=a0;x<=a1+.001;x+=1)SB(yb,yb+2.6,x-.03,x+.03,.09,mat.frame,meta);
      SB(yb+2.55,yb+2.6,a0,a1,.09,mat.frame,meta);SB(yb,yb+.05,a0,a1,.09,mat.frame,meta);
    }else{ // sliding
      SB(yb+2.2,yb+BH,e0,e1,BT,mat.wall,meta);
      SB(yb,yb+2.2,a0,a1,.03,mat.glass,meta,false);
      SB(yb,yb+2.2,a0,a0+.07,.12,mat.frame,meta);SB(yb,yb+2.2,a1-.07,a1,.12,mat.frame,meta);SB(yb,yb+2.2,m-.05,m+.05,.12,mat.frame,meta);
      SB(yb+2.13,yb+2.2,a0,a1,.12,mat.frame,meta);SB(yb,yb+.07,a0,a1,.12,mat.frame,meta);
      SB(yb+.9,yb+1.4,m-.14,m-.1,.16,bm.handle,meta,false);SB(yb+.9,yb+1.4,m+.1,m+.14,.16,bm.handle,meta,false);
    }
  }
  function rebuildWalls(){
    for(const lv of [0,1])for(const ax of ['x','z']){
      const lines=new Map();
      B.edges.forEach((e,k)=>{const p=pk(k);if(p.lv!==lv||p.ax!==ax)return;const line=ax==='x'?p.j:p.i,idx=ax==='x'?p.i:p.j;let a=lines.get(line);if(!a)lines.set(line,a=[]);a.push({idx,o:e.o})});
      lines.forEach((arr,line)=>{
        arr.sort((a,b)=>a.idx-b.idx);let n=0;
        while(n<arr.length){
          let m=n;const key=arr[n].o?arr[n].o.id:0;
          while(m+1<arr.length&&arr[m+1].idx===arr[m].idx+1&&(arr[m+1].o?arr[m+1].o.id:0)===key)m++;
          wallSegment(lv,ax,line,arr[n].idx,arr[m].idx+1,arr[n].o);n=m+1;
        }
      });
    }
  }
  function rowRuns(cells){
    const rows=new Map();cells.forEach(([i,j,v])=>{let r=rows.get(j);if(!r)rows.set(j,r=[]);r.push([i,v])});
    const out=[];rows.forEach((r,j)=>{r.sort((a,b)=>a[0]-b[0]);let n=0;while(n<r.length){let m=n;while(m+1<r.length&&r[m+1][0]===r[m][0]+1&&r[m+1][1]===r[n][1])m++;out.push({j,i0:r[n][0],i1:r[m][0]+1,v:r[n][1]});n=m+1}});
    return out;
  }
  function rebuildFloors(){
    for(const lv of [0,1]){
      const cells=[];B.floors.forEach((v,k)=>{const a=k.split(',');if(+a[0]===lv)cells.push([+a[1],+a[2],v])});
      const top=lv===0?.035:BH,thick=lv===0?.035:.22,ex=BT/2;
      rowRuns(cells).forEach(r=>{
        const x0=r.i0*BU-ex,x1=r.i1*BU+ex,z0=r.j*BU-ex,z1=(r.j+1)*BU+ex,meta={kind:'floor',lv};
        bbox(x0,x1,top-thick,top,z0,z1,mat.platSide,meta,lv>0);
        bplane(x0,x1,z0,z1,top+.003,FLOOR_MATS[r.v]||mat.floor,meta);
      });
    }
  }
  function roofGeometry(r){
    const top=(r.lv+1)*BH,cs=r.cells;
    const meta={kind:'roof',lv:r.lv,id:r.id};
    if(r.style==='flat'){
      rowRuns(cs.map(c=>[c[0],c[1],0])).forEach(q=>{const oh=.22;bbox(q.i0*BU-oh,q.i1*BU+oh,top,top+.2,q.j*BU-oh,(q.j+1)*BU+oh,mat.roof,meta)});
      return;
    }
    let i0=1e9,i1=-1e9,j0=1e9,j1=-1e9;cs.forEach(([i,j])=>{i0=Math.min(i0,i);i1=Math.max(i1,i);j0=Math.min(j0,j);j1=Math.max(j1,j)});
    const x0=i0*BU,x1=(i1+1)*BU,z0=j0*BU,z1=(j1+1)*BU,W=x1-x0,D=z1-z0,alongX=W>=D,span=alongX?D:W,len=alongX?W:D,oh=.3,ohl=.25;
    const gable=r.style==='gable',rise=gable?clamp(span*.32,.8,2.4):clamp(span*.2,.6,1.4);
    const sh=new THREE.Shape();
    if(gable){sh.moveTo(-span/2-oh,0);sh.lineTo(span/2+oh,0);sh.lineTo(0,rise);sh.closePath()}
    else{sh.moveTo(-span/2-oh,0);sh.lineTo(span/2+oh,0);sh.lineTo(span/2+oh,rise);sh.lineTo(-span/2-oh,rise*.3);sh.closePath()}
    const g=new THREE.ExtrudeGeometry(sh,{depth:len+2*ohl,bevelEnabled:false});g.translate(0,0,-(len+2*ohl)/2);
    const me=new THREE.Mesh(g,mat.roof);me.position.set((x0+x1)/2,top-.04,(z0+z1)/2);if(alongX)me.rotation.y=Math.PI/2;
    me.castShadow=true;me.receiveShadow=true;Object.assign(me.userData,meta);bgrp.add(me);
  }
  function rebuildRoofs(){B.roofs.forEach(r=>{if(cutting()&&r.lv>=B.lv)return;roofGeometry(r)})}
  function rebuild(){
    clearGroup(bgrp);rebuildFloors();rebuildWalls();rebuildRoofs();
    bgridG.position.y=B.lv*BH+.045;
    try{spawnDiff()}catch(e){}
    hooks.bstate&&hooks.bstate(bstats());
  }
  /* pieces that did not exist after the previous rebuild rise into place */
  const easeBack=p=>{const c=1.25,q=p-1;return 1+(c+1)*q*q*q+c*q*q};
  function spawnDiff(){
    const sigs=new Set(),fresh=[],prev=B.prevSigs;
    bgrp.children.forEach(o=>{if(!o.isMesh||!o.geometry)return;o.geometry.computeBoundingBox();const b=o.geometry.boundingBox;
      const k=(o.userData.kind||'')+'|'+[o.position.x,o.position.y,o.position.z,b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z,o.rotation.y].map(v=>v.toFixed(2)).join(',');
      sigs.add(k);if(prev&&!prev.has(k))fresh.push(o)});
    B.prevSigs=sigs;
    if(!prev||REDUCED||!fresh.length||fresh.length>170)return;
    const t0=performance.now(),step=fresh.length>12?Math.min(7,420/fresh.length):16;
    fresh.forEach((o,n)=>{const g=prepGrow(o);applyGrow(o,g,0);growing.push({o,g,t0:t0+n*step,d:fresh.length>12?460:380,ease:easeBack})});
  }

  /* ---------- regions (rooms) ---------- */
  function regionOf(lv,i,j){
    const seen=new Set([i+','+j]),q=[[i,j]],cells=[];let open=false;
    if(i<GXr[0]||i>=GXr[1]||j<GZr[0]||j>=GZr[1])return{cells:[],enclosed:false};
    while(q.length){
      const [a,b]=q.pop();cells.push([a,b]);
      const nx=[[a+1,b,hasE(lv,'z',a+1,b)],[a-1,b,hasE(lv,'z',a,b)],[a,b+1,hasE(lv,'x',a,b+1)],[a,b-1,hasE(lv,'x',a,b)]];
      for(const [x,y,blocked] of nx){
        if(blocked)continue;
        if(x<GXr[0]||x>=GXr[1]||y<GZr[0]||y>=GZr[1]){open=true;continue}
        const k=x+','+y;if(seen.has(k))continue;seen.add(k);q.push([x,y]);
      }
    }
    return{cells,enclosed:!open};
  }
  function isRect(cells){
    let i0=1e9,i1=-1e9,j0=1e9,j1=-1e9;cells.forEach(([i,j])=>{i0=Math.min(i0,i);i1=Math.max(i1,i);j0=Math.min(j0,j);j1=Math.max(j1,j)});
    return cells.length===(i1-i0+1)*(j1-j0+1);
  }

  /* ---------- stats ---------- */
  function bstats(){
    let wl=0;const ids=new Set(),types={};
    B.edges.forEach((e,k)=>{wl+=BU;if(e.o&&!ids.has(e.o.id)){ids.add(e.o.id);types[e.o.t]=(types[e.o.t]||0)+1}});
    let rooms=0;const seen=new Set();
    for(const lv of [0,1]){
      for(let i=GXr[0];i<GXr[1];i++)for(let j=GZr[0];j<GZr[1];j++){
        const k=lv+','+i+','+j;if(seen.has(k))continue;
        const r=regionOf(lv,i,j);r.cells.forEach(([a,b])=>seen.add(lv+','+a+','+b));
        if(r.enclosed&&r.cells.length>1&&r.cells.length<1100)rooms++;
      }
    }
    return{walls:wl,wallCount:B.edges.size,openings:ids.size,types,rooms,floorArea:B.floors.size*BU*BU,floors:B.floors.size,roofs:B.roofs.length,
      canUndo:B.undo.length>0,canRedo:B.redo.length>0};
  }

  /* ---------- history ---------- */
  const bsnap=()=>JSON.stringify({e:[...B.edges].map(([k,v])=>[k,v.o]),f:[...B.floors],r:B.roofs,n:B.nid});
  function brestore(s){const d=JSON.parse(s);B.edges=new Map(d.e.map(([k,o])=>[k,{o}]));B.floors=new Map(d.f);B.roofs=d.r;B.nid=d.n}
  function bpush(){B.undo.push(bsnap());if(B.undo.length>100)B.undo.shift();B.redo.length=0}
  function bundo(){if(!B.undo.length)return false;B.redo.push(bsnap());brestore(B.undo.pop());B.start=null;rebuild();clearGhost();return true}
  function bredo(){if(!B.redo.length)return false;B.undo.push(bsnap());brestore(B.redo.pop());rebuild();clearGhost();return true}

  /* ---------- picking ---------- */
  const bplanes=new THREE.Plane(new THREE.Vector3(0,1,0),0),bv=new THREE.Vector3();
  function bSetRay(cx,cy){const r=canvas.getBoundingClientRect();ndc.set(((cx-r.left)/r.width)*2-1,-((cy-r.top)/r.height)*2+1);ray.setFromCamera(ndc,cam)}
  function planeHit(y){bplanes.constant=-y;return ray.ray.intersectPlane(bplanes,bv)?bv.clone():null}
  function pickUser(kinds){const hs=ray.intersectObjects(bgrp.children,false);return hs.find(h=>(!kinds||kinds.includes(h.object.userData.kind)))||null}
  function edgeAtPoint(lv,p){
    let best=null,bd=.24;
    const j=Math.round(p.z/BU),i=Math.floor(p.x/BU);
    if(hasE(lv,'x',i,j)){const d=Math.abs(p.z-j*BU);if(d<bd){bd=d;best={lv,ax:'x',line:j,idx:i}}}
    const i2=Math.round(p.x/BU),j2=Math.floor(p.z/BU);
    if(hasE(lv,'z',i2,j2)){const d=Math.abs(p.x-i2*BU);if(d<bd){bd=d;best={lv,ax:'z',line:i2,idx:j2}}}
    return best;
  }
  function spanFor(e,n){
    const order=[];const c=Math.floor((n-1)/2);order.push(e.idx-c);
    for(let k=1;k<n;k++){order.push(e.idx-c+k);order.push(e.idx-c-k)}
    for(const s of order){
      if(s>e.idx||s+n-1<e.idx)continue;
      let ok=true;
      for(let k=0;k<n&&ok;k++){const ed=B.edges.get(lineEdge(e.lv,e.ax,e.line,s+k));if(!ed||ed.o)ok=false}
      for(let k=1;k<n&&ok;k++){const vi=e.ax==='x'?s+k:e.line,vj=e.ax==='x'?e.line:s+k;if(vdeg(e.lv,vi,vj)!==2)ok=false}
      if(ok)return s;
    }
    return null;
  }
  function runOf(lv,ax,line,idx){
    // maximal collinear run between junction vertices
    let a=idx,b=idx;
    const vtx=k=>ax==='x'?[k,line]:[line,k];
    for(;;){const [vi,vj]=vtx(a);if(vdeg(lv,vi,vj)!==2||!B.edges.has(lineEdge(lv,ax,line,a-1)))break;a--}
    for(;;){const [vi,vj]=vtx(b+1);if(vdeg(lv,vi,vj)!==2||!B.edges.has(lineEdge(lv,ax,line,b+1)))break;b++}
    return{a,b};
  }
  function openingEdges(id){const out=[];B.edges.forEach((e,k)=>{if(e.o&&e.o.id===id)out.push(pk(k))});return out}

  /* ---------- ghosts ---------- */
  function clearGhost(){clearGroup(bghost);bmark.visible=false;B.sig='';hooks.blabel&&hooks.blabel(null)}
  function gbox(x0,x1,y0,y1,z0,z1,m){const me=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0),m);me.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);me.renderOrder=15;bghost.add(me);return me}
  function ghostEdges(list,m,pad=.03){
    list.forEach(({lv,ax,line,idx0,idx1})=>{
      const yb=lv*BH,top=cutting()&&lv>=B.lv?yb+CUT:yb+BH,c=line*BU,a0=idx0*BU,a1=idx1*BU,th=BT+pad*2;
      if(ax==='x')gbox(a0-.02,a1+.02,yb,top,c-th/2,c+th/2,m);else gbox(c-th/2,c+th/2,yb,top,a0-.02,a1+.02,m);
    });
  }
  function ghostCells(cells,y,m){cells.forEach(([i,j])=>gbox(i*BU,(i+1)*BU,y,y+.05,j*BU,(j+1)*BU,m))}
  function scr(x,y,z){const w=stageEl.clientWidth,h=stageEl.clientHeight;bv.set(x,y,z).project(cam);return{x:(bv.x*.5+.5)*w,y:(-bv.y*.5+.5)*h}}

  /* ---------- hover + click (returns an action descriptor) ---------- */
  function target(cx,cy){
    bSetRay(cx,cy);const t=B.tool,lv=B.lv;
    if(t==='wall'){
      const p=planeHit(lv*BH);if(!p)return null;
      let i=clamp(Math.round(p.x/BU),GXr[0],GXr[1]),j=clamp(Math.round(p.z/BU),GZr[0],GZr[1]);
      if(B.start){const dx=Math.abs(i-B.start.i),dz=Math.abs(j-B.start.j);if(dx>=dz)j=B.start.j;else i=B.start.i}
      return{kind:'wall',i,j};
    }
    if(OPEN[t]){
      const hit=pickUser(['wall','opening']);if(!hit)return{kind:'none'};
      const L=hit.object.userData.lv,e=edgeAtPoint(L,hit.point);if(!e)return{kind:'none'};
      const n=OPEN[t].n,s=spanFor(e,n);
      return s===null?{kind:'badopen',e,n}:{kind:'open',e,n,s};
    }
    if(t==='floor'||t==='roof'){
      const y=t==='floor'?lv*BH:(lv+1)*BH,p=planeHit(y);if(!p)return{kind:'none'};
      const i=Math.floor(p.x/BU),j=Math.floor(p.z/BU);
      if(i<GXr[0]||i>=GXr[1]||j<GZr[0]||j>=GZr[1])return{kind:'none'};
      if(t==='floor'){
        const wh=ray.intersectObjects(bgrp.children.filter(o=>o.userData.kind==='wall'||o.userData.kind==='opening'),false)[0];
        if(wh&&wh.distance<ray.ray.origin.distanceTo(p)-.05)return{kind:'none',blocked:true};
      }
      const reg=regionOf(lv,i,j);return{kind:t,reg,lv,i,j};
    }
    if(t==='erase'){
      const hit=pickUser();if(!hit)return{kind:'none'};
      const u=hit.object.userData,L=u.lv;
      if(u.kind==='opening')return{kind:'eopen',id:u.id,edges:openingEdges(u.id)};
      if(u.kind==='wall'){const e=edgeAtPoint(L,hit.point);if(!e)return{kind:'none'};return{kind:'ewall',e,run:runOf(L,e.ax,e.line,e.idx)}}
      if(u.kind==='floor'){const i=Math.floor(hit.point.x/BU),j=Math.floor(hit.point.z/BU);return{kind:'efloor',lv:L,i,j}}
      if(u.kind==='roof')return{kind:'eroof',id:u.id,lv:L};
    }
    return null;
  }
  const tsig=t=>t?JSON.stringify(t,(k,v)=>k==='reg'?(v.enclosed+':'+v.cells.length+':'+(v.cells[0]||[]).join(',')):v):'';
  function showTarget(t,cx,cy,shift){
    const sg=tsig(t)+(B.start?'|'+B.start.i+','+B.start.j:'')+B.tool+(shift?'S':'')+B.lv;if(sg===B.sig)return;B.sig=sg;
    clearGroup(bghost);bmark.visible=false;hooks.blabel&&hooks.blabel(null);let hint='';
    const lv=B.lv;
    if(!t||t.kind==='none'){hint=t&&t.blocked?'A wall is in front — switch to Top view or Low walls':OPEN[B.tool]?'Point at a wall':B.tool==='floor'||B.tool==='roof'?'Point inside a room':B.tool==='erase'?'Point at something to remove':'';}
    else if(t.kind==='wall'){
      const y=lv*BH+.05;bmark.position.set(t.i*BU,y,t.j*BU);bmark.visible=true;
      if(B.start){
        const di=t.i-B.start.i,dj=t.j-B.start.j,len=(Math.abs(di)+Math.abs(dj))*BU;
        if(len>0){const ax=di!==0?'x':'z',line=ax==='x'?B.start.j:B.start.i,a=ax==='x'?Math.min(B.start.i,t.i):Math.min(B.start.j,t.j),b=ax==='x'?Math.max(B.start.i,t.i):Math.max(B.start.j,t.j);
          ghostEdges([{lv,ax,line,idx0:a,idx1:b}],bm.ok,0);
          const mx=(B.start.i+t.i)/2*BU,mz=(B.start.j+t.j)/2*BU,p=scr(mx,y+.9,mz);hooks.blabel&&hooks.blabel(len.toFixed(1).replace(/\.0$/,'')+' m',p.x,p.y)}
        hint=len>0?'Click to place · click the same point or press Esc to finish':'Move the cursor to set the wall length';
      }else hint='Click to start a wall';
    }
    else if(t.kind==='open'||t.kind==='badopen'){
      const e=t.e,ok=t.kind==='open';
      if(ok)ghostEdges([{lv:e.lv,ax:e.ax,line:e.line,idx0:t.s,idx1:t.s+t.n}],bm.ok,.04);else ghostEdges([{lv:e.lv,ax:e.ax,line:e.line,idx0:e.idx,idx1:e.idx+1}],bm.bad,.04);
      hint=ok?'Click to place the '+OPEN[B.tool].label.toLowerCase()+' ('+(t.n*BU)+' m wide)':'No room here — try a longer straight wall piece';
    }
    else if(t.kind==='floor'||t.kind==='roof'){
      const ok=t.reg.enclosed;const y=t.kind==='floor'?t.lv*BH+.03:(t.lv+1)*BH+.02;
      if(ok)ghostCells(t.reg.cells,y,bm.ok);else ghostCells([[t.i,t.j]],y,bm.bad);
      hint=ok?(t.kind==='floor'?'Click to lay the floor in this room':'Click to place a roof over this room'):'This area is open — close it with walls first';
    }
    else if(t.kind==='eopen'){ghostEdges(t.edges.map(e=>({lv:e.lv,ax:e.ax,line:e.ax==='x'?e.j:e.i,idx0:e.ax==='x'?e.i:e.j,idx1:(e.ax==='x'?e.i:e.j)+1})),bm.bad,.05);hint='Click to remove this opening'}
    else if(t.kind==='ewall'){
      const e=t.e;if(shift)ghostEdges([{lv:e.lv,ax:e.ax,line:e.line,idx0:e.idx,idx1:e.idx+1}],bm.bad,.05);else ghostEdges([{lv:e.lv,ax:e.ax,line:e.line,idx0:t.run.a,idx1:t.run.b+1}],bm.bad,.05);
      hint=shift?'Click to remove this 0.5 m piece':'Click to remove this wall (Shift = one piece)';
    }
    else if(t.kind==='efloor'){ghostCells(floorRegion(t.lv,t.i,t.j),t.lv*BH+.03,bm.bad);hint='Click to remove this floor'}
    else if(t.kind==='eroof'){const r=B.roofs.find(x=>x.id===t.id);if(r)ghostCells(r.cells,(r.lv+1)*BH+.2,bm.bad);hint='Click to remove this roof'}
    hooks.bhint&&hooks.bhint(hint);
  }
  function floorRegion(lv,i,j){
    const out=[],seen=new Set([i+','+j]),q=[[i,j]];
    if(!B.floors.has(lv+','+i+','+j))return[[i,j]];
    while(q.length){const [a,b]=q.pop();out.push([a,b]);
      for(const [x,y,bl] of [[a+1,b,hasE(lv,'z',a+1,b)],[a-1,b,hasE(lv,'z',a,b)],[a,b+1,hasE(lv,'x',a,b+1)],[a,b-1,hasE(lv,'x',a,b)]]){
        const k=x+','+y;if(bl||seen.has(k)||!B.floors.has(lv+','+k))continue;seen.add(k);q.push([x,y])}}
    return out;
  }
  let hovRaf=0,hovPt=null;
  function bHoverReq(cx,cy,shift){hovPt={cx,cy,shift};if(hovRaf)return;hovRaf=requestAnimationFrame(()=>{hovRaf=0;if(!B.on||!hovPt)return;showTarget(target(hovPt.cx,hovPt.cy),hovPt.cx,hovPt.cy,hovPt.shift)})}
  function bLeave(){hovPt=null;if(B.on)clearGhost()}
  function bClick(cx,cy,shift){
    const t=target(cx,cy);if(!t)return;
    if(t.kind==='wall'){
      if(!B.start){B.start={i:t.i,j:t.j};B.sig='';showTarget(t,cx,cy);return}
      if(t.i===B.start.i&&t.j===B.start.j){B.start=null;B.sig='';showTarget(t,cx,cy);hooks.bchange&&hooks.bchange('wall-end');return}
      bpush();
      const lv=B.lv,s=B.start;
      if(t.j===s.j){for(let i=Math.min(s.i,t.i);i<Math.max(s.i,t.i);i++)if(!hasE(lv,'x',i,s.j))B.edges.set(ek(lv,'x',i,s.j),{o:null})}
      else{for(let j=Math.min(s.j,t.j);j<Math.max(s.j,t.j);j++)if(!hasE(lv,'z',s.i,j))B.edges.set(ek(lv,'z',s.i,j),{o:null})}
      B.start={i:t.i,j:t.j};rebuild();B.sig='';showTarget(target(cx,cy),cx,cy);hooks.bchange&&hooks.bchange('wall');return;
    }
    if(t.kind==='open'){
      bpush();const id=B.nid++;
      for(let k=0;k<t.n;k++){const ed=B.edges.get(lineEdge(t.e.lv,t.e.ax,t.e.line,t.s+k));ed.o={t:B.tool,id}}
      rebuild();B.sig='';showTarget(target(cx,cy),cx,cy);hooks.bchange&&hooks.bchange('open');return;
    }
    if(t.kind==='badopen'){hooks.bchange&&hooks.bchange('bad');return}
    if(t.kind==='floor'){
      if(!t.reg.enclosed){hooks.bchange&&hooks.bchange('open-area');return}
      bpush();const same=t.reg.cells.every(([i,j])=>B.floors.get(t.lv+','+i+','+j)===B.floorMat);
      t.reg.cells.forEach(([i,j])=>{const k=t.lv+','+i+','+j;if(same)B.floors.delete(k);else B.floors.set(k,B.floorMat)});
      rebuild();B.sig='';showTarget(target(cx,cy),cx,cy);hooks.bchange&&hooks.bchange('floor');return;
    }
    if(t.kind==='roof'){
      if(!t.reg.enclosed){hooks.bchange&&hooks.bchange('open-area');return}
      bpush();let style=B.roofStyle,note=null;
      if(style!=='flat'&&!isRect(t.reg.cells)){style='flat';note='rect'}
      const set=new Set(t.reg.cells.map(c=>c.join(',')));
      B.roofs=B.roofs.filter(r=>!(r.lv===t.lv&&r.cells.some(c=>set.has(c.join(',')))));
      B.roofs.push({id:B.nid++,lv:t.lv,style,cells:t.reg.cells});
      rebuild();B.sig='';hooks.bchange&&hooks.bchange(note==='rect'?'roof-flat':'roof');return;
    }
    if(t.kind==='eopen'){bpush();t.edges.forEach(e=>{const ed=B.edges.get(ek(e.lv,e.ax,e.i,e.j));if(ed)ed.o=null});rebuild();B.sig='';clearGhost();hooks.bchange&&hooks.bchange('erase');return}
    if(t.kind==='ewall'){
      bpush();const e=t.e,a=shift?e.idx:t.run.a,b=shift?e.idx:t.run.b;
      for(let k=a;k<=b;k++)B.edges.delete(lineEdge(e.lv,e.ax,e.line,k));
      rebuild();B.sig='';clearGhost();hooks.bchange&&hooks.bchange('erase');return;
    }
    if(t.kind==='efloor'){bpush();floorRegion(t.lv,t.i,t.j).forEach(([i,j])=>B.floors.delete(t.lv+','+i+','+j));rebuild();B.sig='';clearGhost();hooks.bchange&&hooks.bchange('erase');return}
    if(t.kind==='eroof'){bpush();B.roofs=B.roofs.filter(r=>r.id!==t.id);rebuild();B.sig='';clearGhost();hooks.bchange&&hooks.bchange('erase');return}
  }

  /* ---------- presets ---------- */
  const E=(lv,ax,i,j)=>B.edges.set(ek(lv,ax,i,j),{o:null});
  function chain(lv,pts){for(let k=0;k<pts.length-1;k++){const[a,b]=pts[k],[c,d]=pts[k+1];if(b===d)for(let i=Math.min(a,c);i<Math.max(a,c);i++)E(lv,'x',i,b);else for(let j=Math.min(b,d);j<Math.max(b,d);j++)E(lv,'z',a,j)}}
  const rectPts=(a,b,c,d)=>[[a,b],[c,b],[c,d],[a,d],[a,b]];
  function putOpen(lv,ax,i,j,t){const n=OPEN[t].n,id=B.nid++;for(let k=0;k<n;k++){const e=B.edges.get(ax==='x'?ek(lv,'x',i+k,j):ek(lv,'z',i,j+k));if(e)e.o={t,id}}}
  function fillRoom(lv,i,j,m){regionOf(lv,i,j).cells.forEach(([a,b])=>B.floors.set(lv+','+a+','+b,m))}
  function roofRoom(lv,i,j,style){const r=regionOf(lv,i,j);B.roofs.push({id:B.nid++,lv,style:style!=='flat'&&!isRect(r.cells)?'flat':style,cells:r.cells})}
  const PRESETS={
    studio(){chain(0,rectPts(-8,-5,8,5));putOpen(0,'x',-1,5,'door');putOpen(0,'x',-6,-5,'window');putOpen(0,'x',3,-5,'window');putOpen(0,'z',8,-3,'glass');putOpen(0,'z',-8,-1,'window');fillRoom(0,0,0,0);roofRoom(0,0,0,'flat')},
    cottage(){chain(0,rectPts(-9,-5,9,5));chain(0,[[0,-5],[0,5]]);putOpen(0,'x',-5,5,'door');putOpen(0,'x',-7,-5,'window');putOpen(0,'x',-3,-5,'window');putOpen(0,'x',3,-5,'window');putOpen(0,'x',6,5,'window');putOpen(0,'z',0,1,'door');putOpen(0,'z',9,-2,'slide');fillRoom(0,-4,0,0);fillRoom(0,4,0,1);
      const a=regionOf(0,-4,0),b=regionOf(0,4,0);B.roofs.push({id:B.nid++,lv:0,style:'gable',cells:a.cells.concat(b.cells)})},
    lhouse(){chain(0,[[-10,-4],[2,-4],[2,0],[10,0],[10,4],[-10,4],[-10,-4]]);putOpen(0,'x',-3,4,'door');putOpen(0,'x',-9,-4,'window');putOpen(0,'x',-4,-4,'window');putOpen(0,'x',5,4,'glass');putOpen(0,'z',-10,-1,'window');putOpen(0,'z',10,1,'window');fillRoom(0,-5,0,0);roofRoom(0,-5,0,'flat')},
    twostory(){chain(0,rectPts(-7,-4,7,4));putOpen(0,'x',-1,4,'door');putOpen(0,'x',-6,-4,'window');putOpen(0,'x',3,-4,'window');putOpen(0,'x',-6,4,'window');putOpen(0,'z',7,-2,'glass');fillRoom(0,0,0,0);
      chain(1,rectPts(-7,-4,2,4));putOpen(1,'x',-5,4,'window');putOpen(1,'x',-2,-4,'window');putOpen(1,'z',-7,-1,'window');putOpen(1,'z',2,-1,'glass');
      // slab for whole ground footprint so the upper level has a floor
      regionOf(0,0,0).cells.forEach(([a,b])=>B.floors.set('1,'+a+','+b,0));
      fillRoom(1,-3,0,1);roofRoom(1,-3,0,'flat')}
  };
  function bClear(){B.edges.clear();B.floors.clear();B.roofs=[];B.start=null;B.undo=[];B.redo=[];B.nid=1;rebuild();clearGhost()}
  function bPreset(name){bClear();if(PRESETS[name])PRESETS[name]();B.undo=[];rebuild()}

  /* ---------- view modes ---------- */
  function bView(m){
    B.prevSigs=null;B.on=m==='build';B.result=m==='result';
    bgrp.visible=m!=='off';bgridG.visible=m==='build';treeGroup.visible=m==='off';
    if(!B.on){clearGhost();B.start=null}
    canvas.style.cursor=B.on?'crosshair':'';
    rebuild();
  }
  function bTool(t){B.tool=t;B.start=null;B.sig='';clearGhost();hooks.bchange&&hooks.bchange('tool')}
  function bLevel(l){B.prevSigs=null;B.lv=l;B.start=null;B.sig='';clearGhost();rebuild()}
  function bCut(on){B.prevSigs=null;B.cut=on;B.sig='';rebuild()}
  SCN.build={view:bView,setTool:bTool,getTool:()=>B.tool,setLevel:bLevel,getLevel:()=>B.lv,setCut:bCut,getCut:()=>B.cut,undo:bundo,redo:bredo,clear:bClear,preset:bPreset,
    cancel(){if(B.start){B.start=null;B.sig='';clearGhost();return true}return false},stats:bstats,data:bsnap,
    load(s){B.prevSigs=null;brestore(s);B.undo=[];B.redo=[];B.start=null;rebuild()},
    setFloorMat(i){B.floorMat=i},setRoofStyle(s){B.roofStyle=s},hasContent:()=>B.edges.size>0,
    center(){
      if(!B.edges.size){st.tx=0;st.ty=.7;st.tz=0;return}
      let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;B.edges.forEach((e,k)=>{const p=pk(k);const xa=p.i,za=p.j,xb=p.ax==='x'?p.i+1:p.i,zb=p.ax==='z'?p.j+1:p.j;x0=Math.min(x0,xa,xb);x1=Math.max(x1,xa,xb);z0=Math.min(z0,za,zb);z1=Math.max(z1,za,zb)});
      st.tx=(x0+x1)/2*BU;st.tz=(z0+z1)/2*BU;st.ty=B.on?.7:1.3},
    restoreTarget(){st.tx=.3;st.ty=2.1;st.tz=0},refresh:rebuild,isOn:()=>B.on};

  /* =========================================================
     STAGED BUILD API
     ========================================================= */
  const growing=[];
  function prepGrow(o){
    if(o.userData.grow)return o.userData.grow;
    const g={p0:o.position.y,s0:o.scale.clone(),mode:'u',base:0};
    if(o.isGroup||(o.isMesh&&o.geometry&&o.geometry.type!=='PlaneGeometry')){g.base=new THREE.Box3().setFromObject(o).min.y;g.mode='y'}
    o.userData.grow=g;return g;
  }
  function applyGrow(o,g,s){
    s=Math.max(.001,s);
    if(g.mode==='y'){o.scale.y=g.s0.y*s;o.position.y=g.base+(g.p0-g.base)*s}
    else o.scale.copy(g.s0).multiplyScalar(s);
  }
  function restoreGrow(o,g){o.scale.copy(g.s0);o.position.y=g.p0}
  function finishGrowing(){growing.forEach(e=>restoreGrow(e.o,e.g));growing.length=0}
  function growStage(i,dur){
    const t0=performance.now(),kids=stageGroups[i].children.slice().sort((a,b)=>a.position.y-b.position.y);
    kids.forEach((o,n)=>{const g=prepGrow(o);const delay=kids.length>1?(n/(kids.length-1))*dur*.5:0;applyGrow(o,g,0);growing.push({o,g,t0:t0+delay,d:dur*.5})});
  }
  function updateGrow(now){
    for(let i=growing.length-1;i>=0;i--){
      const e=growing[i];if(!e.o.parent){growing.splice(i,1);continue}
      const p=clamp((now-e.t0)/e.d,0,1);
      if(p>=1){restoreGrow(e.o,e.g);growing.splice(i,1)}else applyGrow(e.o,e.g,e.ease?e.ease(p):easeOut(p));
    }
  }
  function setBuild(k,opts={}){
    k=clamp(Math.round(k),0,STAGE_COUNT);const animate=opts.animate!==false&&!REDUCED,dur=opts.dur||1000,prev=bStage;
    finishGrowing();bStage=k;
    stageGroups.forEach((g,i)=>{g.visible=i<k});
    if(animate&&k>prev)for(let i=prev;i<k;i++)growStage(i,dur);
    applyInterior();hooks.build&&hooks.build(k);
  }

  /* =========================================================
     PUBLIC API
     ========================================================= */
  Object.assign(SCN,{
    THREE,camera:cam,pcam,world,renderer,st,walk,colliders,
    setMode,setView,setAuto,stopAuto,setSize,getSize:()=>st.size,setBuild,getBuild:()=>bStage,STAGE_COUNT,
    rotate(d){stopAuto();st.az+=d;hooks.view&&hooks.view(null)},
    tilt(d){st.el=clamp(st.el+d,8,88)},
    reset(){setView('iso');setSize(80)},
    setDay(d){st.day=d;applyTheme()},
    setAccent,setFloor,
    setPaint(hex){mat.inWall.color.setHex(hex)},
    setWallTint(hex){mat.wall.color.setHex(hex)},
    setRoof(hex,rough){mat.roof.color.setHex(hex);mat.roof.roughness=rough==null?.9:rough},
    setTech(k,on){if(k==='lights'){st.smart=on;applyTheme()}if(k==='solar'){solar.visible=on}if(k==='glass'){st.glassTint=on;applyTheme()}},
    setClimate(c){climate=c;applyClimate()},
    regenTrees(){treeSeed=(treeSeed*7+13)%9973;buildTrees(treeSeed)},
    setCommenting(on){pinsOn=on;if(on)setHover(null)},
    setShadows(on){st.shadows=on;moon.castShadow=on;renderer.shadowMap.enabled=on;scene.traverse(o=>{if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.needsUpdate=true)}})},
    setQuality(hi){DPR=hi?Math.min(window.devicePixelRatio||1,2):1;renderer.setPixelRatio(DPR);resize()},
    setScene(n){il.scene=n;applyInterior()},setBrightness(v){il.br=v;applyInterior()},
    showFurniture(on){furnMeshes.furn.forEach(m=>m.visible=on);applyInterior()},showTV(on){furnMeshes.tv.forEach(m=>m.visible=on);applyInterior()},
    setFov(v){pcam.fov=v;pcam.updateProjectionMatrix()},
    setJoy(x,y){walk.joy.x=x;walk.joy.y=y},
    enterInterior,goLevel,goRoom,teleport,
    snapshot(type='image/png',q=.92){renderer.render(scene,st.mode==='interior'?pcam:cam);return new Promise(res=>canvas.toBlob(b=>res(b),type,q))},
    snapshotURL(type='image/jpeg',q=.92){renderer.render(scene,st.mode==='interior'?pcam:cam);return canvas.toDataURL(type,q)},
    project(x,y,z){const v=new THREE.Vector3(x,y,z).project(cam);return{x:(v.x+1)/2*canvas.clientWidth,y:(1-v.y)/2*canvas.clientHeight,z:v.z}},
    isReady:true
  });
  setSize(80);buildTrees(treeSeed);resize();applyTheme();applyClimate();setMode('models');
  requestAnimationFrame(frame);
  window.__scene={scene,cam,pcam,world,st,walk,renderer,mat};
  return true;
}
