/* File downloads and a minimal vector PDF writer */
'use strict';

/* =========================================================
   DOWNLOADS (claude downloads capability, with local fallback)
   ========================================================= */
async function saveFile(name,blob){
  try{
    if(window.claude&&window.claude.use){
      const d=await window.claude.use('downloads');
      if(d){await d.save({filename:name,data:blob});return 'saved'}
    }
  }catch(e){
    const c=e&&e.code;
    if(c==='declined')return 'declined';
    if(c&&!['unavailable','not_granted','capability_disabled','capability_removed'].includes(c))return 'error';
  }
  try{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);return 'saved'}catch(e){return 'error'}
}

/* =========================================================
   MINIMAL PDF WRITER (vector text/lines + JPEG images)
   ========================================================= */
function latin1(s){const u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i)&255;return u}
function cat(arrs){let n=0;arrs.forEach(a=>n+=a.length);const o=new Uint8Array(n);let p=0;arrs.forEach(a=>{o.set(a,p);p+=a.length});return o}
const pdfEsc=s=>String(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
function makePDF(pages){
  const objs=[];const add=b=>{objs.push(typeof b==='string'?latin1(b):b);return objs.length};
  add('<< /Type /Catalog /Pages 2 0 R >>');
  add('PAGES');
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const kids=[];
  pages.forEach(pg=>{
    const imgIds=[];
    (pg.images||[]).forEach(im=>{
      const head=latin1(`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.jpeg.length} >>\nstream\n`);
      imgIds.push(add(cat([head,im.jpeg,latin1('\nendstream')])));
    });
    const cs=latin1(pg.content);
    const cid=add(cat([latin1(`<< /Length ${cs.length} >>\nstream\n`),cs,latin1('\nendstream')]));
    const xo=imgIds.map((id,i)=>`/Im${i} ${id} 0 R`).join(' ');
    const pid=add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pg.w.toFixed(2)} ${pg.h.toFixed(2)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << ${xo} >> >> /Contents ${cid} 0 R >>`);
    kids.push(pid);
  });
  objs[1]=latin1(`<< /Type /Pages /Kids [${kids.map(k=>k+' 0 R').join(' ')}] /Count ${kids.length} >>`);
  const parts=[latin1('%PDF-1.4\n')];let pos=parts[0].length;const offs=[];
  objs.forEach((o,i)=>{offs.push(pos);const h=latin1(`${i+1} 0 obj\n`),t=latin1('\nendobj\n');parts.push(h,o,t);pos+=h.length+o.length+t.length});
  let xr=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`;offs.forEach(o=>xr+=String(o).padStart(10,'0')+' 00000 n \n');
  xr+=`trailer\n<< /Size ${objs.length+1} /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF`;
  parts.push(latin1(xr));
  return new Blob([cat(parts)],{type:'application/pdf'});
}
function dataURLtoBytes(u){const b=atob(u.split(',')[1]);const a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a}
