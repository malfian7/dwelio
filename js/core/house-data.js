/* House data (walls, rooms, furniture): single source for 3D, drawings and minimap */
'use strict';

/* =========================================================
   HOUSE DATA — single source of truth for 3D, CAD and minimap
   (units: metres; x → east, z → south/front, y → up)
   ========================================================= */
const FLOOR_Y=[0,3.1];
const WALLS=[
  /* ---------- ground floor ---------- */
  {id:'G-S-A',axis:'x',c0:.75,c1:1.0,a0:-4.5,a1:.5,y0:0,y1:2.8,lv:0,outer:'+z',ends:'a0',op:[
    {a0:-4.0,a1:-2.2,b0:.1,b1:2.6,k:'window'},{a0:-2.2,a1:-.9,b0:0,b1:2.6,k:'door',sl:1},{a0:-.9,a1:-.3,b0:.1,b1:2.6,k:'window'}]},
  {id:'G-W-A',axis:'z',c0:-4.5,c1:-4.25,a0:-2.95,a1:.75,y0:0,y1:2.8,lv:0,outer:'-x',ends:'',op:[{a0:-1.9,a1:.7,b0:2.0,b1:2.6,k:'window'}]},
  {id:'G-N-A',axis:'x',c0:-3.2,c1:-2.95,a0:-4.5,a1:.5,y0:0,y1:2.8,lv:0,outer:'-z',ends:'both',op:[
    {a0:-3.2,a1:-1.4,b0:2.0,b1:2.6,k:'window'},{a0:-.7,a1:.1,b0:1.1,b1:2.3,k:'window'}]},
  {id:'G-E-A',axis:'z',c0:.25,c1:.5,a0:-2.95,a1:.75,y0:0,y1:2.8,lv:0,outer:'+x',ends:'',op:[{a0:-1.75,a1:.75,b0:0,b1:2.6,k:'pass'}]},
  {id:'G-S-C',axis:'x',c0:.75,c1:1.0,a0:.5,a1:4.0,y0:0,y1:2.8,lv:0,outer:'+z',ends:'a1',op:[
    {a0:.9,a1:2.9,b0:.1,b1:2.6,k:'window'},{a0:2.9,a1:3.7,b0:0,b1:2.6,k:'door',sl:1}]},
  {id:'G-N-C',axis:'x',c0:-2.0,c1:-1.75,a0:.5,a1:4.0,y0:0,y1:2.8,lv:0,outer:'-z',ends:'a1',op:[{a0:1.2,a1:3.0,b0:.9,b1:2.3,k:'window'}]},
  {id:'G-E-C',axis:'z',c0:3.75,c1:4.0,a0:-1.75,a1:.75,y0:0,y1:2.8,lv:0,outer:'+x',ends:'',op:[{a0:-1.5,a1:.5,b0:.2,b1:2.6,k:'window'}]},
  /* ---------- first floor ---------- */
  {id:'U-S-A',axis:'x',c0:.75,c1:1.0,a0:-4.5,a1:.5,y0:3.1,y1:6.2,lv:1,outer:'+z',ends:'a0',op:[
    {a0:-4.0,a1:-2.3,b0:3.6,b1:5.5,k:'window'},{a0:-1.6,a1:-.35,b0:3.1,b1:5.4,k:'door',sl:1}]},
  {id:'U-W-A',axis:'z',c0:-4.5,c1:-4.25,a0:-2.95,a1:.75,y0:3.1,y1:6.2,lv:1,outer:'-x',ends:'',op:[{a0:-2.0,a1:.4,b0:3.7,b1:5.5,k:'window'}]},
  {id:'U-N-A',axis:'x',c0:-3.2,c1:-2.95,a0:-4.5,a1:.5,y0:3.1,y1:6.2,lv:1,outer:'-z',ends:'both',op:[
    {a0:-3.8,a1:-2.2,b0:3.8,b1:5.4,k:'window'},{a0:-.9,a1:.1,b0:3.8,b1:5.4,k:'window'}]},
  {id:'U-E-A',axis:'z',c0:.25,c1:.5,a0:-2.95,a1:.75,y0:3.1,y1:6.2,lv:1,outer:'+x',ends:'',op:[{a0:-.4,a1:.6,b0:3.1,b1:5.2,k:'door'}]},
  {id:'U-S-B',axis:'x',c0:3.15,c1:3.4,a0:.5,a1:4.9,y0:3.1,y1:6.2,lv:1,outer:'+z',ends:'both',op:[
    {a0:.95,a1:2.35,b0:3.2,b1:6.0,k:'window'},{a0:2.95,a1:4.5,b0:3.2,b1:6.0,k:'window'}]},
  {id:'U-N-B',axis:'x',c0:-2.4,c1:-2.15,a0:.5,a1:4.9,y0:3.1,y1:6.2,lv:1,outer:'-z',ends:'a1',op:[
    {a0:1.0,a1:2.1,b0:4.2,b1:5.4,k:'window'},{a0:3.0,a1:4.4,b0:3.9,b1:5.5,k:'window'}]},
  {id:'U-E-B',axis:'z',c0:4.65,c1:4.9,a0:-2.15,a1:3.15,y0:3.1,y1:6.2,lv:1,outer:'+x',ends:'',op:[
    {a0:1.0,a1:3.0,b0:3.2,b1:6.0,k:'window'},{a0:-1.8,a1:-.4,b0:4.0,b1:5.4,k:'window'}]},
  {id:'U-W-B',axis:'z',c0:.5,c1:.75,a0:.75,a1:3.15,y0:3.1,y1:6.2,lv:1,outer:'-x',ends:'',op:[{a0:1.5,a1:3.0,b0:3.2,b1:6.0,k:'window'}]},
  {id:'U-P1',axis:'x',c0:.74,c1:.86,a0:.75,a1:4.65,y0:3.1,y1:6.2,lv:1,outer:'',ends:'',op:[{a0:.9,a1:1.8,b0:3.1,b1:5.2,k:'door'}]},
  {id:'U-P2',axis:'z',c0:2.54,c1:2.66,a0:-2.15,a1:.74,y0:3.1,y1:6.2,lv:1,outer:'',ends:'',op:[{a0:-.5,a1:.3,b0:3.1,b1:5.2,k:'door'}]}
];
const STAIR={x0:-4.2,x1:-1.0,z0:-2.95,z1:-2.05,steps:16,rise:3.1};
const ROOMS=[
  {id:'living',name:'Living room',lv:0,r:[-4.25,-1.0,-2.05,.75],spawn:[-2.9,-.4,-Math.PI/2]},
  {id:'kitchen',name:'Kitchen & dining',lv:0,r:[-1.0,.25,-2.95,.75],spawn:[-.35,-2.0,Math.PI]},
  {id:'hall',name:'Hall & studio',lv:0,r:[.5,3.75,-1.75,.75],spawn:[1.1,-.5,-Math.PI/2]},
  {id:'loft',name:'Loft & study',lv:1,r:[-4.25,.25,-2.05,.75],spawn:[-.5,-.4,Math.PI/2]},
  {id:'master',name:'Master bedroom',lv:1,r:[.75,4.65,.86,3.15],spawn:[4.2,2.85,.55]},
  {id:'bath',name:'Bathroom',lv:1,r:[.5,2.54,-2.15,.74],spawn:[1.6,.3,0]},
  {id:'closet',name:'Walk-in closet',lv:1,r:[2.66,4.65,-2.15,.74],spawn:[3.6,.3,.3]},
  {id:'balcony',name:'Balcony',lv:1,r:[-4.5,.5,1.0,3.3],spawn:[-1.0,1.7,Math.PI],outdoor:true}
];
const FLOORS=[
  {lv:0,r:[-4.25,.25,-2.95,.75],m:'main'},{lv:0,r:[.5,3.75,-1.75,.75],m:'main'},
  {lv:1,r:[-4.25,.25,-2.05,.75],m:'main'},{lv:1,r:[-1.0,.25,-2.95,-2.05],m:'main'},
  {lv:1,r:[.75,4.65,.86,3.15],m:'main'},{lv:1,r:[2.66,4.65,-2.15,.74],m:'main'},
  {lv:1,r:[.5,2.54,-2.15,.74],m:'tile'},{lv:1,r:[-4.5,.5,1.0,3.3],m:'deck'}
];
/* furniture boxes: b=[x0,x1,y0,y1,z0,z1] (y relative to floor) */
const FURN=[
  /* living */
  {id:'rug1',lv:0,b:[-3.9,-2.1,0,.02,-1.7,.4],m:'rug',col:0,g:'furn'},
  {id:'tvunit',lv:0,b:[-4.25,-3.85,0,.5,-1.3,.3],m:'wood',col:1,g:'furn'},
  {id:'tv',lv:0,b:[-4.23,-4.19,.85,1.65,-1.1,.1],m:'tv',col:0,g:'tv'},
  {id:'sofa',lv:0,b:[-2.6,-1.7,0,.45,-1.5,.5],m:'fabA',col:1,g:'furn'},
  {id:'sofab',lv:0,b:[-1.95,-1.7,.45,.95,-1.5,.5],m:'fabA',col:0,g:'furn'},
  {id:'sofa1',lv:0,b:[-2.6,-1.7,.45,.65,-1.5,-1.3],m:'fabA',col:0,g:'furn'},
  {id:'sofa2',lv:0,b:[-2.6,-1.7,.45,.65,.3,.5],m:'fabA',col:0,g:'furn'},
  {id:'ctable',lv:0,b:[-3.4,-2.9,0,.4,-.9,-.2],m:'wood',col:1,g:'furn'},
  {id:'arm',lv:0,b:[-3.7,-3.1,0,.45,.1,.65],m:'fabB',col:1,g:'furn'},
  {id:'armb',lv:0,b:[-3.7,-3.1,.45,.95,.5,.65],m:'fabB',col:0,g:'furn'},
  /* kitchen & dining */
  {id:'counter',lv:0,b:[-.9,.25,0,.9,-2.95,-2.4],m:'stone',col:1,g:'furn'},
  {id:'cab',lv:0,b:[-.9,.25,1.5,2.3,-2.95,-2.6],m:'wood',col:0,g:'furn'},
  {id:'island',lv:0,b:[-.8,.0,0,.95,-1.6,-.95],m:'wood',col:1,g:'furn'},
  {id:'stool1',lv:0,b:[-.7,-.45,0,.65,-.85,-.6],m:'dark',col:0,g:'furn'},
  {id:'stool2',lv:0,b:[-.35,-.1,0,.65,-.85,-.6],m:'dark',col:0,g:'furn'},
  {id:'dtable',lv:0,b:[-.75,.1,0,.75,-.3,.4],m:'wood',col:1,g:'furn'},
  {id:'dch1',lv:0,b:[-.55,-.25,0,.45,.45,.72],m:'dark',col:0,g:'furn'},
  {id:'dch2',lv:0,b:[-.2,.1,0,.45,.45,.72],m:'dark',col:0,g:'furn'},
  /* hall & studio */
  {id:'desk',lv:0,b:[2.0,3.6,0,.75,-1.75,-1.2],m:'wood',col:1,g:'furn'},
  {id:'dchair',lv:0,b:[2.6,3.0,0,.9,-1.1,-.7],m:'dark',col:0,g:'furn'},
  {id:'shelf',lv:0,b:[.6,1.5,0,2.0,-1.75,-1.45],m:'wood',col:1,g:'furn'},
  {id:'bench',lv:0,b:[1.2,2.4,0,.45,.35,.7],m:'fabB',col:0,g:'furn'},
  /* loft */
  {id:'ldesk',lv:1,b:[-.7,.2,0,.75,-2.95,-2.35],m:'wood',col:1,g:'furn'},
  {id:'lchair',lv:1,b:[-.4,0,0,.9,-2.2,-1.8],m:'dark',col:0,g:'furn'},
  {id:'bookcase',lv:1,b:[-4.25,-3.95,0,2.2,-1.8,.2],m:'wood',col:1,g:'furn'},
  {id:'lounge',lv:1,b:[-3.7,-3.1,0,.5,-.6,0],m:'fabB',col:1,g:'furn'},
  {id:'loungeb',lv:1,b:[-3.7,-3.55,.5,.95,-.6,0],m:'fabB',col:0,g:'furn'},
  {id:'lrug',lv:1,b:[-3.6,-1.8,0,.02,-1.2,.6],m:'rug',col:0,g:'furn'},
  /* master */
  {id:'bed',lv:1,b:[2.3,3.9,0,.5,.95,2.75],m:'linen',col:1,g:'furn'},
  {id:'head',lv:1,b:[2.25,3.95,0,1.1,.86,1.0],m:'wood',col:0,g:'furn'},
  {id:'pil1',lv:1,b:[2.4,2.9,.5,.62,1.05,1.4],m:'white',col:0,g:'furn'},
  {id:'pil2',lv:1,b:[3.3,3.8,.5,.62,1.05,1.4],m:'white',col:0,g:'furn'},
  {id:'ns1',lv:1,b:[1.85,2.25,0,.6,.95,1.4],m:'wood',col:1,g:'furn'},
  {id:'ns2',lv:1,b:[3.95,4.4,0,.6,.95,1.4],m:'wood',col:1,g:'furn'},
  {id:'mbench',lv:1,b:[2.4,3.8,0,.45,2.85,3.1],m:'fabB',col:0,g:'furn'},
  {id:'mrug',lv:1,b:[1.9,4.3,0,.02,.95,3.0],m:'rug',col:0,g:'furn'},
  /* bath */
  {id:'tub',lv:1,b:[.75,1.45,0,.55,-2.1,-.4],m:'white',col:1,g:'furn'},
  {id:'vanity',lv:1,b:[1.8,2.4,0,.95,-2.1,-1.6],m:'wood',col:1,g:'furn'},
  {id:'toilet',lv:1,b:[.75,1.15,0,.45,-.3,.15],m:'white',col:1,g:'furn'},
  /* closet */
  {id:'cshelf',lv:1,b:[2.7,4.6,0,2.4,-2.15,-1.85],m:'wood',col:1,g:'furn'},
  {id:'cchest',lv:1,b:[3.2,4.1,0,.85,-1.0,-.4],m:'wood',col:1,g:'furn'}
];
const PLANTS=[{x:-4.0,z:.5,lv:0,h:1.5},{x:3.5,z:.45,lv:0,h:1.3},{x:-4.0,z:.45,lv:1,h:1.4},{x:4.3,z:1.4,lv:1,h:1.3}];
