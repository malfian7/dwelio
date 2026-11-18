/* Inline SVG icon set */
'use strict';

/* =========================================================
   ICONS
   ========================================================= */
const S=(p,extra='')=>`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${p}</svg>`;
const ICONS={
  logo:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 20.5V10.2L12 4l7.5 6.2v10.3z"/><path d="M9.6 20.5v-5.2a2.4 2.4 0 0 1 4.8 0v5.2"/></svg>`,
  tWall:S('<rect x="3" y="6" width="18" height="12" rx="1"/><path d="M3 12h18M9 6v6M15 12v6"/>','width="22" height="22"'),
  tDoor:S('<path d="M6 21V4.5h12V21M3.5 21h17"/><circle cx="15" cy="13" r=".9" fill="currentColor"/>','width="22" height="22"'),
  tWin:S('<rect x="5" y="4" width="14" height="16" rx="1"/><path d="M12 4v16M5 12h14"/>','width="22" height="22"'),
  tGlass:S('<rect x="4" y="3.5" width="16" height="17" rx="1"/><path d="M12 3.5v17M8 14l5-5M8 18l9-9"/>','width="22" height="22"'),
  tSlide:S('<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M12 5v14M5.5 12h3.5M15 12h4M17 9.8l2.2 2.2L17 14.2"/>','width="22" height="22"'),
  tFloor:S('<path d="M3 14.5 12 9l9 5.5-9 5.5z"/><path d="m7.5 11.8 9 5.4M16.5 11.8l-9 5.4"/>','width="22" height="22"'),
  tRoof:S('<path d="M3 12.5 12 4.5l9 8M6 10.5V20h12v-9.5"/>','width="22" height="22"'),
  tErase:S('<path d="m5 15 8.2-8.2a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L12.5 18H8.4z"/><path d="M12 18h8M8.6 11.4l4.8 4.8"/>','width="22" height="22"'),
  undo:S('<path d="M9 14 4 9l5-5"/><path d="M4 9h9.5a6.5 6.5 0 0 1 0 13H11"/>','width="18" height="18"'),
  redo:S('<path d="m15 14 5-5-5-5"/><path d="M20 9h-9.5a6.5 6.5 0 0 0 0 13H13"/>','width="18" height="18"'),
  plusSq:S('<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M12 8.5v7M8.5 12h7"/>','width="20" height="20"'),
  plotIc:S('<path d="M4 18.5 12 21l8-2.5V9L12 6.5 4 9z" stroke-dasharray="2.4 2.2"/><path d="M12 6.5V3M9.8 4.6 12 3l2.2 1.6"/>','width="22" height="22"'),
  play:S('<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>','width="14" height="14"'),
  pause:S('<path d="M8 5.5v13M16 5.5v13" stroke-width="3.2"/>','width="16" height="16"'),
  skipPrev:S('<path d="M7 5.5v13M18 5.5 10 12l8 6.5z" fill="currentColor"/>','width="14" height="14"'),
  skipNext:S('<path d="M17 5.5v13M6 5.5 14 12l-8 6.5z" fill="currentColor"/>','width="14" height="14"'),
  back:S('<path d="M15 18l-6-6 6-6"/>','width="14" height="14"'),
  megaphone:S('<path d="M4 10v4h3l7 4V6L7 10H4z"/><path d="M17.5 9.5c1.2 1.4 1.2 3.6 0 5"/>','width="15" height="15" fill="currentColor"'),
  share:S('<circle cx="18" cy="5.5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="18.5" r="2.6"/><path d="M8.3 10.7l7.4-4M8.3 13.3l7.4 4"/>','width="15" height="15"'),
  dots:`<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="7" cy="7" r="1.7"/><circle cx="17" cy="7" r="1.7"/><circle cx="7" cy="17" r="1.7"/><circle cx="17" cy="17" r="1.7"/></svg>`,
  sun:S('<circle cx="12" cy="12" r="3.8"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>','width="15" height="15"'),
  moon:S('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill="currentColor"/>','width="15" height="15"'),
  plus:S('<path d="M12 6v12M6 12h12"/>','width="13" height="13" stroke-width="2.4"'),
  minus:S('<path d="M7 12h10"/>','width="10" height="10" stroke-width="2.8"'),
  comment:S('<path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>','width="14" height="14"'),
  cube:S('<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>','width="12" height="12" stroke-width="2"'),
  wand:S('<path d="M5 19L15 9"/><path d="M17 3.5l.9 2.1L20 6.5l-2.1.9L17 9.5l-.9-2.1L14 6.5l2.1-.9z" fill="currentColor"/><path d="M8 4.5l.5 1.1L9.6 6 8.5 6.5 8 7.6 7.5 6.5 6.4 6l1.1-.4z" fill="currentColor"/><path d="M19 13l.5 1.1 1.1.4-1.1.5L19 16.1l-.5-1.1-1.1-.5 1.1-.4z" fill="currentColor"/>','width="19" height="19" stroke-width="2"'),
  chevDown:S('<path d="M6 9l6 6 6-6"/>','width="14" height="14"'),
  chevDownSm:S('<path d="M6 9l6 6 6-6"/>','width="11" height="11" stroke-width="2.2"'),
  triUp:`<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 7.5L6 4l3.5 3.5"/></svg>`,
  triDown:`<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4.5L6 8l3.5-3.5"/></svg>`,
  triLeft:`<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 2.5L4 6l3.5 3.5"/></svg>`,
  triRight:`<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 2.5L8 6 4.5 9.5"/></svg>`,
  globe:`<svg width="28" height="28" viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="13" cy="13" r="10.5" fill="#eef2ea"/><ellipse cx="13" cy="13" rx="4.8" ry="10.5"/><path d="M2.5 13h21M4 8h18M4 18h18"/></svg>`,
  fit:S('<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/>','width="17" height="17"'),
  camera:S('<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.4"/>','width="15" height="15"'),
  keyboard:S('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/>','width="15" height="15"'),
  gauge:S('<path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4-5"/>','width="15" height="15"'),
  users:S('<circle cx="9" cy="9" r="3.2"/><path d="M3 19c.5-3.2 3-5 6-5s5.500 1.800 6 5"/><path d="M16 6.500a3 3 0 0 1 0 5.500M17.500 14.200c1.800.6 3 2.200 3.300 4.800"/>','width="15" height="15"'),
  cursor:S('<path d="M5 3l14 7-6 2-2 6z" fill="currentColor"/>','width="17" height="17"'),
  ruler:S('<path d="M3 16L16 3l5 5L8 21z"/><path d="M7 12l2 2M10 9l2 2M13 6l2 2"/>','width="17" height="17"'),
  magnet:S('<path d="M5 4h4v8a3 3 0 0 0 6 0V4h4v8a7 7 0 0 1-14 0z"/><path d="M5 8h4M15 8h4"/>','width="17" height="17"'),
  grid:S('<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 9.300h16M4 14.700h16M9.300 4v16M14.700 4v16"/>','width="17" height="17"'),
  zin:S('<circle cx="11" cy="11" r="6.500"/><path d="M16 16l4.500 4.500M11 8.500v5M8.500 11h5"/>','width="17" height="17"'),
  zout:S('<circle cx="11" cy="11" r="6.500"/><path d="M16 16l4.500 4.500M8.500 11h5"/>','width="17" height="17"'),
  paper:S('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>','width="17" height="17"'),
  sheet:S('<rect x="4" y="4" width="16" height="16" rx="1.500"/><path d="M4 12h16M12 4v16"/>','width="16" height="16"'),
  layers:S('<path d="M12 4l9 5-9 5-9-5z"/><path d="M3 14l9 5 9-5"/>','width="16" height="16"'),
  floorico:S('<path d="M3 17l9-5 9 5-9 5z"/><path d="M3 12l9-5 9 5"/>','width="16" height="16"'),
  paintico:S('<rect x="4" y="4" width="14" height="6" rx="1.500"/><path d="M18 7h2v5h-8v3"/><rect x="10" y="15" width="4" height="6" rx="1"/>','width="16" height="16"'),
  bulb:S('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.500 10.900c.5.400.800 1 .8 1.600V16h5.400v-.5c0-.6.300-1.200.8-1.600A6 6 0 0 0 12 3z"/>','width="16" height="16"'),
  sofa:S('<path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/><path d="M3 13a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v5H3z"/><path d="M6 18v2M18 18v2"/>','width="16" height="16"'),
  exit:S('<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 8l4 4-4 4M19 12H9"/>','width="14" height="14"'),
  rot360:S('<path d="M20 12a8 8 0 1 1-2.400-5.700"/><path d="M20 4v4.500h-4.500"/>','width="15" height="15" stroke-width="2"'),
  tick:S('<path d="M5 12.500l4.500 4.500L19 7.500"/>','width="11" height="11" stroke-width="3"'),
  eye:S('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>','width="14" height="14"'),
  eyeOff:S('<path d="M3 3l18 18M10.500 6.200A9.600 9.600 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3 3.600M6.500 7.600A17 17 0 0 0 2 12s4 7 10 7c1.400 0 2.700-.3 3.800-.8"/>','width="14" height="14"'),
  close:S('<path d="M6 6l12 12M18 6L6 18"/>','width="12" height="12" stroke-width="2.2"'),
  copy:S('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>','width="13" height="13"')
};
function paintIcons(root=document){$$('[data-icon]',root).forEach(el=>{if(!el.dataset.painted){const h=ICONS[el.dataset.icon];if(h){el.insertAdjacentHTML('afterbegin',h);el.dataset.painted='1'}}})}
paintIcons();

/* avatars — original illustrations */
const AV={
  a:`<svg viewBox="0 0 40 40"><rect width="40" height="40" fill="#8fa3b8"/><path d="M6 40c1-9 7-12 14-12s13 3 14 12z" fill="#22262e"/><rect x="16.5" y="22" width="7" height="8" rx="3" fill="#c98f6b"/><ellipse cx="20" cy="17" rx="7.2" ry="8.2" fill="#d9a47f"/><path d="M12.5 15c0-6 4-8.5 8-8.5 4.5 0 7.5 3 7.2 8.5-2-3-4-4-7.5-4s-5.5 1.5-7.700 4z" fill="#1d1816"/><path d="M14 22c1.5 5 4 6.500 6 6.500s4.500-1.500 6-6.500c-2 2-4 2.800-6 2.800S16 24 14 22z" fill="#2a211c" opacity=".85"/></svg>`,
  b:`<svg viewBox="0 0 40 40"><rect width="40" height="40" fill="#c7b9a8"/><path d="M5 40c1-9 7-12 15-12s14 3 15 12z" fill="#3b2f2a"/><path d="M9 20c-1-10 5-15 11-15s12 5 11 15c0 9-2 14-3 15H12c-1-1-3-6-3-15z" fill="#2a1d18"/><ellipse cx="20" cy="19" rx="6.8" ry="8.2" fill="#e3b79a"/><path d="M12.800 16c3-1 6-3.500 8-5.800 2.500 3.200 4.500 4.800 6.500 5.800-.5-5.500-4-8-7.200-8s-7 2.500-7.300 8z" fill="#2a1d18"/><rect x="17" y="26.500" width="6" height="5" rx="2" fill="#d6a487"/></svg>`
};
$$('[data-avatar]').forEach(el=>el.insertAdjacentHTML('afterbegin',AV[el.dataset.avatar]));
