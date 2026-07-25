/* ТИШЕ — движок на НАСТОЯЩИХ записях (moodist, MIT). Микшер: слои с отдельной громкостью.
   У каждого звука своё оформление карточки: градиент, акцент и рисунок. */
"use strict";
const Engine = (() => {
  const BASE = 'assets/audio/';

  // рисунки для карточек — рисуются кодом, у каждого свой характер
  const ART = {
    downpour: (c)=>`<svg viewBox="0 0 100 100" preserveAspectRatio="none"><g stroke="${c}" stroke-linecap="round">${
      Array.from({length:26},(_,i)=>{const x=2+i*3.9,l=26+((i*29)%34);
      return `<line x1="${x}" y1="${((i*17)%14)-6}" x2="${x-11}" y2="${((i*17)%14)-6+l}" stroke-width="${i%3?1.5:2.2}"/>`}).join('')}
      <ellipse cx="30" cy="90" rx="11" ry="3" fill="none" stroke-width="1.2" opacity=".6"/><ellipse cx="66" cy="95" rx="14" ry="3.5" fill="none" stroke-width="1.2" opacity=".45"/></g></svg>`,
    stream: (c)=>`<svg viewBox="0 0 100 100" preserveAspectRatio="none"><g fill="none" stroke="${c}" stroke-linecap="round">
      <path d="M-4 20q22 14 30 30t34 34" stroke-width="1.8"/><path d="M14 12q20 16 26 32t30 40" stroke-width="1.2" opacity=".6"/>
      <path d="M-6 40q24 10 32 26t28 30" stroke-width="1.2" opacity=".5"/>
      <ellipse cx="62" cy="44" rx="7" ry="4.5" stroke-width="1.3"/><ellipse cx="34" cy="66" rx="5.5" ry="3.5" stroke-width="1.3" opacity=".7"/></g></svg>`,
    bird: (c)=>`<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round">
      <path d="M14 34q9-9 17 0"/><path d="M31 34q9-9 17 0"/>
      <path d="M46 58q7-7 13 0"/><path d="M59 58q7-7 13 0"/>
      <path d="M28 76q5.5-5 10 0" opacity=".65"/><path d="M38 76q5.5-5 10 0" opacity=".65"/></g></svg>`,
    owl: (c)=>`<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round">
      <path d="M26 40c0-14 11-24 24-24s24 10 24 24v18c0 15-11 26-24 26S26 73 26 58Z"/>
      <circle cx="40" cy="44" r="9"/><circle cx="60" cy="44" r="9"/><circle cx="40" cy="44" r="2.6" fill="${c}" stroke="none"/><circle cx="60" cy="44" r="2.6" fill="${c}" stroke="none"/>
      <path d="M50 52l-4 6h8Z"/><path d="M28 26l7 8M72 26l-7 8"/><path d="M34 74q16 9 32 0" opacity=".5"/></g></svg>`,
    stars: (c)=>`<svg viewBox="0 0 100 100"><g stroke="${c}" fill="none">
      <path d="M22 30l20 12 16-16 22 10" stroke-width=".9" opacity=".45"/><path d="M42 42l6 26 26 8" stroke-width=".9" opacity=".35"/>
      ${[[22,30,2.4],[42,42,1.6],[58,26,2],[80,36,1.5],[48,68,2.2],[74,76,1.4],[30,62,1.2],[66,54,1.7]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="none"/>`).join('')}
      ${[[58,26],[48,68]].map(([x,y])=>`<path d="M${x-7} ${y}h14M${x} ${y-7}v14" stroke-width=".8" opacity=".55"/>`).join('')}</g></svg>`,
    bars: (c)=>`<svg viewBox="0 0 100 100" preserveAspectRatio="none"><g fill="${c}">${
      Array.from({length:17},(_,i)=>{const h=18+((i*53)%56),x=3+i*5.7;
      return `<rect x="${x}" y="${96-h}" width="3.2" height="${h}" rx="1.6" opacity="${0.45+(i%4)*0.16}"/>`}).join('')}</g></svg>`,
    static: (c)=>`<svg viewBox="0 0 100 100"><g fill="${c}">${
      Array.from({length:150},(_,i)=>`<rect x="${(i*37)%98}" y="${(i*61)%96}" width="1.6" height="1.6" opacity="${0.2+((i*13)%7)*0.11}"/>`).join('')}</g></svg>`,
    drum: (c)=>`<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="1.5">
      <circle cx="50" cy="50" r="32"/><circle cx="50" cy="50" r="24" opacity=".55"/>
      <path d="M50 26a24 24 0 0 1 17 41" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="40" cy="42" r="4.5" opacity=".7"/><circle cx="60" cy="56" r="6" opacity=".7"/><circle cx="46" cy="62" r="3.5" opacity=".5"/></g></svg>`,
    sheets: (c)=>`<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round">
      <path d="M22 24h26l10 10v40H22Z" opacity=".45"/><path d="M32 32h26l10 10v40H32Z" opacity=".7"/>
      <path d="M42 40h26l10 10v40H42Z"/><path d="M68 40v10h10"/>
      <path d="M50 62h18M50 70h18M50 78h12" opacity=".5"/></g></svg>`,
    typebars: (c)=>`<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="1.4" stroke-linecap="round">
      <path d="M20 82h60" stroke-width="1.8"/><path d="M30 74h40"/>
      ${[-34,-22,-11,0,11,22,34].map((d)=>`<path d="M${50+d*0.55} 74 L${50+d} ${34+Math.abs(d)*0.35}" opacity="${0.85-Math.abs(d)/70}"/>`).join('')}
      <path d="M26 26h48" opacity=".4"/><circle cx="50" cy="30" r="2.2" fill="${c}" stroke="none" opacity=".7"/></g></svg>`,
    grass: (c)=>`<svg viewBox="0 0 100 100" preserveAspectRatio="none"><g fill="none" stroke="${c}" stroke-linecap="round">${
      Array.from({length:15},(_,i)=>{const x=4+i*6.6,b=((i*31)%18)-9,h=34+((i*43)%40);
      return `<path d="M${x} 100q${b} -${h*0.6} ${b*1.7} -${h}" stroke-width="${1.5-((i%3)*0.3)}" opacity="${0.5+(i%3)*0.2}"/>`}).join('')}</g></svg>`,
    streaks: (c,n=14)=>`<svg viewBox="0 0 100 100" preserveAspectRatio="none">${
      Array.from({length:n},(_,i)=>{const x=7+i*(86/n),l=18+((i*37)%42);
      return `<line x1="${x}" y1="${4+((i*23)%20)}" x2="${x-6}" y2="${4+((i*23)%20)+l}" stroke="${c}" stroke-width="1.4" stroke-linecap="round"/>`}).join('')}</svg>`,
    waves: (c)=>`<svg viewBox="0 0 100 100" preserveAspectRatio="none">${
      [26,44,62,80].map((y,i)=>`<path d="M-4 ${y} q 13 -${7+i} 26 0 t 26 0 t 26 0 t 26 0" fill="none" stroke="${c}" stroke-width="${1.6-i*0.15}"/>`).join('')}</svg>`,
    flame: (c)=>`<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round">
      <path d="M50 88c-14 0-24-10-24-23 0-16 16-24 20-41 3 12 11 15 15 24 3 7 13 9 13 20 0 12-10 20-24 20Z"/>
      <path d="M50 82c-7 0-12-5-12-12 0-8 8-12 10-21 2 7 6 8 8 13 2 4 6 5 6 10 0 6-5 10-12 10Z" opacity=".65"/></g></svg>`,
    leaves: (c)=>`<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="1.4" stroke-linecap="round">
      <path d="M20 84c0-26 14-44 40-52"/><path d="M34 70c-2-12 4-22 16-27"/><path d="M52 56c8-6 18-6 26-2"/>
      <path d="M60 32c6 0 12 3 15 8"/><circle cx="74" cy="24" r="5" opacity=".7"/></g></svg>`,
    moon: (c)=>`<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="1.5">
      <path d="M66 62A20 20 0 1 1 50 30a16 16 0 0 0 16 32Z"/>
      <circle cx="24" cy="26" r="1.6" fill="${c}"/><circle cx="78" cy="76" r="1.4" fill="${c}"/>
      <circle cx="34" cy="76" r="1.2" fill="${c}"/><circle cx="82" cy="34" r="1" fill="${c}"/></g></svg>`,
    dots: (c,d=9)=>`<svg viewBox="0 0 100 100">${
      Array.from({length:d*d},(_,i)=>{const x=8+(i%d)*(84/(d-1)),y=8+((i/d)|0)*(84/(d-1));
      return `<circle cx="${x}" cy="${y}" r="${0.7+((i*7)%5)/6}" fill="${c}" opacity="${0.35+((i*11)%5)/9}"/>`}).join('')}</svg>`,
    keys: (c)=>`<svg viewBox="0 0 100 100">${
      Array.from({length:12},(_,i)=>{const x=12+(i%4)*22,y=22+((i/4)|0)*22;
      return `<rect x="${x}" y="${y}" width="17" height="17" rx="4" fill="none" stroke="${c}" stroke-width="1.3" opacity="${i%3?0.75:1}"/>`}).join('')}</svg>`,
    clock: (c)=>`<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="1.5">
      <circle cx="50" cy="50" r="30"/><path d="M50 50V32M50 50l14 9" stroke-linecap="round"/>
      <path d="M50 18v4M82 50h-4M50 82v-4M18 50h4"/></g></svg>`,
    fan: (c)=>`<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="1.5">
      ${[0,90,180,270].map(a=>`<path d="M50 50c0-16 6-24 14-24s10 10 0 18-14 6-14 6Z" transform="rotate(${a} 50 50)"/>`).join('')}
      <circle cx="50" cy="50" r="5"/></g></svg>`,
    chimes: (c)=>`<svg viewBox="0 0 100 100"><g stroke="${c}" stroke-width="1.5" fill="none" stroke-linecap="round">
      <path d="M22 18h56"/>${[30,42,54,66,78].map((x,i)=>`<line x1="${x}" y1="18" x2="${x}" y2="${44+i*8}"/>
      <circle cx="${x}" cy="${48+i*8}" r="2.4" fill="${c}"/>`).join('')}</g></svg>`,
    ripple: (c)=>`<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="1.4">
      ${[10,20,30,40].map((r,i)=>`<circle cx="50" cy="50" r="${r}" opacity="${1-i*0.2}"/>`).join('')}</g></svg>`,
    rails: (c)=>`<svg viewBox="0 0 100 100" preserveAspectRatio="none"><g stroke="${c}" fill="none">
      <path d="M32 100L46 8M68 100L54 8" stroke-width="1.6"/>
      ${Array.from({length:9},(_,i)=>{const y=14+i*10,w=6+i*2.6;return `<line x1="${50-w}" y1="${y}" x2="${50+w}" y2="${y}" stroke-width="1.2" opacity="${0.3+i*0.07}"/>`}).join('')}</g></svg>`,
    paper: (c)=>`<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="1.4">
      <path d="M30 16h30l14 14v54H30Z"/><path d="M60 16v14h14"/>
      ${[42,52,62,72].map(y=>`<path d="M38 ${y}h28" opacity=".6"/>`).join('')}</g></svg>`,
    drop: (c)=>`<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="1.5">
      <path d="M50 22c10 14 18 22 18 32a18 18 0 0 1-36 0c0-10 8-18 18-32Z"/>
      <path d="M42 54a8 8 0 0 0 6 12" opacity=".6" stroke-linecap="round"/></g></svg>`,
    window: (c)=>`<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="1.5">
      <rect x="24" y="18" width="52" height="64" rx="3"/><path d="M50 18v64M24 50h52"/>
      ${[34,60].map((x,i)=>`<path d="M${x} ${28+i*4}l-4 12M${x+10} ${34+i*4}l-4 12" stroke-width="1.1" opacity=".65"/>`).join('')}</g></svg>`,
    cup: (c)=>`<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round">
      <path d="M26 44h38v18a19 19 0 0 1-19 19h0a19 19 0 0 1-19-19Z"/><path d="M64 48h7a9 9 0 0 1 0 18h-7"/>
      <path d="M38 34c0-6 5-7 5-13M52 34c0-6 5-7 5-13" opacity=".6"/></g></svg>`,
    bolt: (c)=>`<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round">
      <path d="M56 14L36 52h16l-8 34 28-44H56l8-28Z"/><path d="M22 30q10-6 18-2M78 34q-8-6-16-3" opacity=".55"/></g></svg>`,
  };


  // компактные глифы для кнопок и подписей — рисуются кодом, в цвете звука
  const ICON = {
    downpour:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.7" stroke-linecap="round"><path d="M4 4l-1 6M8 3l-1.5 8M12 4l-1.5 8M16 3l-1.5 8M20 4l-1 6"/><path d="M6 18q3-3 6 0t6 0" opacity=".8"/></svg>`,
    stream:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.7" stroke-linecap="round"><path d="M3 4q5 4 6 8t6 8"/><path d="M9 3q5 5 5 9t5 9" opacity=".6"/><ellipse cx="15" cy="11" rx="2.4" ry="1.5" stroke-width="1.3"/></svg>`,
    bird:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"><path d="M2 8q4-4.5 8 0"/><path d="M10 8q4-4.5 8 0"/><path d="M7 16q3-3.5 6 0"/><path d="M14 19q2-2.5 4 0" opacity=".6"/></svg>`,
    owl:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round"><path d="M5 10a7 7 0 0 1 14 0v4a7 7 0 0 1-14 0Z"/><circle cx="9.2" cy="11" r="2.4"/><circle cx="14.8" cy="11" r="2.4"/><path d="M12 13.4l-1.3 2h2.6Z"/><path d="M6 5l2 2.4M18 5l-2 2.4"/></svg>`,
    stars:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round"><path d="M5 8l6 4 4-5 5 3" opacity=".5"/><path d="M9 4v3M7.5 5.5h3"/><path d="M17 13v3M15.5 14.5h3" opacity=".8"/><circle cx="11" cy="12" r="1.1" fill="${c}" stroke="none"/><circle cx="6" cy="18" r="1" fill="${c}" stroke="none" opacity=".7"/></svg>`,
    bars:c=>`<svg viewBox="0 0 24 24" fill="${c}"><rect x="3" y="12" width="2.6" height="9" rx="1.3" opacity=".55"/><rect x="7.5" y="7" width="2.6" height="14" rx="1.3" opacity=".8"/><rect x="12" y="10" width="2.6" height="11" rx="1.3"/><rect x="16.5" y="4" width="2.6" height="17" rx="1.3" opacity=".7"/></svg>`,
    static:c=>`<svg viewBox="0 0 24 24" fill="${c}">${Array.from({length:30},(_,i)=>`<rect x="${2+((i*7)%20)}" y="${2+((i*11)%20)}" width="1.5" height="1.5" opacity="${0.3+((i*5)%6)*0.12}"/>`).join('')}</svg>`,
    drum:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5A8.5 8.5 0 0 1 18 18" stroke-width="2.2" stroke-linecap="round"/><circle cx="9.5" cy="10" r="1.6" opacity=".7"/><circle cx="14" cy="14" r="2.1" opacity=".7"/></svg>`,
    sheets:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.5" stroke-linejoin="round"><path d="M4 4h8l3 3v11H4Z" opacity=".5"/><path d="M9 7h8l3 3v11H9Z"/><path d="M17 7v3h3"/></svg>`,
    typebars:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round"><path d="M4 20h16"/><path d="M7 16h10"/><path d="M9 16 6.5 7M12 16V6M15 16l2.5-9"/></svg>`,
    grass:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round"><path d="M6 21q-2-6 1-11"/><path d="M12 21q0-8 3-13"/><path d="M18 21q1-5-1-9" opacity=".7"/></svg>`,
    streaks:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.7" stroke-linecap="round"><path d="M5 5c2-2 5-2 7 0s5 2 7 0"/><path d="M7 11l-2 5M12 11l-2 5M17 11l-2 5"/></svg>`,
    window:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 3v18M4 12h16"/><path d="M7 6l-1 3M16 15l-1 3"/></svg>`,
    bolt:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L6 13h5l-2 9 9-12h-5l2-8Z"/></svg>`,
    waves:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.7" stroke-linecap="round"><path d="M2 9c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.4 5-.6"/><path d="M2 15c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.4 5-.6"/></svg>`,
    drop:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.7" stroke-linecap="round"><path d="M12 3c4 6 7 9 7 12a7 7 0 0 1-14 0c0-3 3-6 7-12Z"/></svg>`,
    leaves:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round"><path d="M4 20c0-8 5-14 15-16"/><path d="M8 15c4 1 8-1 10-5"/><path d="M11 20c3 0 6-2 7-5"/></svg>`,
    flame:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.7" stroke-linecap="round"><path d="M12 22c-4 0-7-3-7-7 0-5 5-7 6-13 1 4 3 5 4 7 1 2 4 3 4 6 0 4-3 7-7 7Z"/></svg>`,
    moon:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round"><path d="M18 16A8 8 0 1 1 11 4a6.5 6.5 0 0 0 7 12Z"/><path d="M5 5h.01M20 8h.01"/></svg>`,
    chimes:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round"><path d="M4 4h16"/><path d="M8 4v9M12 4v12M16 4v7"/><circle cx="8" cy="15" r="1.5"/><circle cx="12" cy="18" r="1.5"/><circle cx="16" cy="13" r="1.5"/></svg>`,
    ripple:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7" opacity=".65"/><circle cx="12" cy="12" r="10.5" opacity=".35"/></svg>`,
    dots:c=>`<svg viewBox="0 0 24 24" fill="${c}"><circle cx="6" cy="6" r="1.5"/><circle cx="12" cy="5" r="1.1"/><circle cx="18" cy="7" r="1.4"/><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="13" r="1.1"/><circle cx="7" cy="18" r="1.4"/><circle cx="13" cy="19" r="1.2"/><circle cx="18" cy="18" r="1.5"/></svg>`,
    keys:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.5"><rect x="2" y="6" width="20" height="12" rx="2.5"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" stroke-linecap="round" stroke-width="1.9"/></svg>`,
    clock:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2.5"/></svg>`,
    fan:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="2"/><path d="M12 10c0-4 1.5-6 3.5-6S18 6.5 14 10"/><path d="M14 12c4 0 6 1.5 6 3.5S17.5 18 14 14"/><path d="M12 14c0 4-1.5 6-3.5 6S6 17.5 10 14"/><path d="M10 12c-4 0-6-1.5-6-3.5S6.5 6 10 10"/></svg>`,
    paper:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round"><path d="M6 3h8l5 5v13H6Z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h5"/></svg>`,
    cup:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round"><path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z"/><path d="M17 10h2a2.5 2.5 0 0 1 0 5h-2"/><path d="M8 5c0-1 1-1.5 1-2.5M12 5c0-1 1-1.5 1-2.5" opacity=".7"/></svg>`,
    rails:c=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round"><path d="M8 22L10 2M16 22L14 2"/><path d="M7 18h10M8 13h8M9 8h6"/></svg>`,
  };

  const C = [
    // id            имя                кат        emoji  градиент                                      акцент     рисунок
    ['rain',        'Дождь',           'Непогода','🌧️','linear-gradient(160deg,#1E2A4A,#0E1424)','#8FB4E8','streaks'],
    ['heavy-rain',  'Ливень',          'Непогода','⛈️','linear-gradient(160deg,#16233E,#0B1120)','#7FA3DA','downpour'],
    ['rain-window', 'Дождь в окно',    'Непогода','🪟','linear-gradient(160deg,#243044,#12181F)','#A9C4DE','window'],
    ['thunder',     'Гром',            'Непогода','🌩️','linear-gradient(160deg,#2A2740,#12111C)','#B9A6E8','bolt'],
    ['waves',       'Океан',           'Вода',    '🌊','linear-gradient(160deg,#12384A,#081C26)','#79CBDF','waves'],
    ['river',       'Ручей',           'Вода',    '🏞️','linear-gradient(160deg,#153F3C,#08201F)','#7FD4C0','stream'],
    ['waterfall',   'Водопад',         'Вода',    '💧','linear-gradient(160deg,#0F3A44,#071E24)','#84D6E2','drop'],
    ['wind',        'Ветер в кронах',  'Лес',     '🌬️','linear-gradient(160deg,#1D3630,#0C1A17)','#9AD3B4','leaves'],
    ['birds',       'Птицы в лесу',    'Лес',     '🐦','linear-gradient(160deg,#243C22,#101B0F)','#B4D98A','bird'],
    ['campfire',    'Костёр',          'Уют',     '🔥','linear-gradient(160deg,#3E2415,#1C0F08)','#F0A868','flame'],
    ['crickets',    'Сверчки',         'Ночь',    '🦗','linear-gradient(160deg,#1B2B22,#0B1410)','#A8CF9A','grass'],
    ['owl',         'Сова',            'Ночь',    '🦉','linear-gradient(160deg,#2B2438,#130F1C)','#C0AEE0','owl'],
    ['night',       'Ночная деревня',  'Ночь',    '🌙','linear-gradient(160deg,#1F2440,#0D101F)','#AEB8E8','stars'],
    ['chimes',      'Ветряные колокольчики','Уют','🎐','linear-gradient(160deg,#2F2A3E,#15121D)','#D6C2E8','chimes'],
    ['bowl',        'Поющая чаша',     'Медитация','🔔','linear-gradient(160deg,#3A2E1E,#1A150D)','#E2C489','ripple'],
    ['cafe',        'Кофейня',         'Места',   '☕','linear-gradient(160deg,#33251C,#17100C)','#D8A87E','cup'],
    ['library-amb', 'Библиотека',      'Места',   '📚','linear-gradient(160deg,#2C2A22,#141310)','#D2C69A','paper'],
    ['train',       'В поезде',        'Места',   '🚆','linear-gradient(160deg,#25303C,#101519)','#9FB6C8','rails'],
    ['keyboard',    'Клавиатура',      'ASMR',    '⌨️','linear-gradient(160deg,#232A34,#0F1216)','#A4B8D0','keys'],
    ['typewriter',  'Печатная машинка','ASMR',    '🖨️','linear-gradient(160deg,#302A26,#161311)','#CDBBA6','typebars'],
    ['paper',       'Шелест бумаги',   'ASMR',    '📄','linear-gradient(160deg,#2E2C26,#151412)','#CFC7B0','sheets'],
    ['clock',       'Часы',            'ASMR',    '🕰️','linear-gradient(160deg,#2A2A2E,#131315)','#BEBEC6','clock'],
    ['fan',         'Вентилятор',      'Дом',     '💨','linear-gradient(160deg,#20303A,#0E1519)','#93B6C4','fan'],
    ['washing',     'Стиральная машина','Дом',    '🧺','linear-gradient(160deg,#26303E,#11151C)','#9EB2CE','drum'],
    ['brown',       'Коричневый шум',  'Шум',     '🟤','linear-gradient(160deg,#38291D,#19120C)','#D8A97C','dots'],
    ['pink',        'Розовый шум',     'Шум',     '🩷','linear-gradient(160deg,#3A2430,#1A0F16)','#E8A6BE','bars'],
    ['white',       'Белый шум',       'Шум',     '⚪','linear-gradient(160deg,#2C2F33,#141517)','#D6DAE0','static'],
  ];
  const EXT = {brown:'wav',pink:'wav',white:'wav'};
  const CATALOG = C.map(([id,name,cat,emoji,grad,accent,art])=>({
    id,name,cat,emoji,grad,accent,
    file:id+'.'+(EXT[id]||'mp3'),
    art:(ART[art]||ART.dots)(accent),
    icon:(ICON[art]||ICON.dots)(accent)
  }));
  const FILE = Object.fromEntries(CATALOG.map(s=>[s.id,s.file]));

  const store=new Map(), active=new Set(), listeners=new Set();
  let masterVol=0.9, ctx=null;

  function ensure(id){
    if(store.has(id)) return store.get(id);
    const el=new Audio(BASE+FILE[id]);
    el.loop=true; el.preload='auto'; el.volume=0;
    const o={el,vol:0.7,fadeTimer:null}; store.set(id,o); return o;
  }
  function fade(o,target,ms){
    clearInterval(o.fadeTimer);
    const start=o.el.volume, t0=performance.now();
    o.fadeTimer=setInterval(()=>{
      const k=Math.min(1,(performance.now()-t0)/ms);
      o.el.volume=Math.max(0,Math.min(1,start+(target-start)*k));
      if(k>=1){clearInterval(o.fadeTimer);o.fadeTimer=null;if(target<=0)o.el.pause();}
    },40);
  }
  function emit(){ const ids=[...active]; listeners.forEach(fn=>fn(ids)); }

  return {
    CATALOG, ART, ICON,
    get(id){ return CATALOG.find(s=>s.id===id); },
    isOn(id){ return active.has(id); },
    activeIds(){ return [...active]; },
    onChange(fn){ listeners.add(fn); fn([...active]); },
    toggle(id){
      if(!FILE[id]) return false;                      // защита от неизвестного id
      const o=ensure(id);
      if(active.has(id)){ fade(o,0,400); active.delete(id); emit(); return false; }
      o.el.play().catch(()=>{});
      fade(o,o.vol*masterVol,900);
      active.add(id); emit(); return true;
    },
    play(id){ if(FILE[id]&&!active.has(id)) this.toggle(id); },
    setVol(id,v){ const o=ensure(id); o.vol=v; if(active.has(id)){clearInterval(o.fadeTimer);o.el.volume=v*masterVol;} },
    getVol(id){ return store.has(id)?store.get(id).vol:0.7; },
    setMaster(v){ masterVol=v; active.forEach(id=>{const o=store.get(id);if(o){clearInterval(o.fadeTimer);o.el.volume=o.vol*masterVol;}}); },
    stopAll(fadeSec){
      const ms=(fadeSec!=null?fadeSec*1000:500);
      active.forEach(id=>{const o=store.get(id);if(o)fade(o,0,ms);});
      active.clear(); emit();
    },
    tone(on){
      if(on){
        const AC=window.AudioContext||window.webkitAudioContext;
        if(!ctx)ctx=new AC(); if(ctx.state==='suspended')ctx.resume();
        const osc=ctx.createOscillator(),g=ctx.createGain();
        osc.type='sine'; osc.frequency.value=196; g.gain.value=0;
        osc.connect(g); g.connect(ctx.destination);
        g.gain.linearRampToValueAtTime(0.05,ctx.currentTime+1);
        this._tone={osc,g}; osc.start();
      } else if(this._tone){
        const {osc,g}=this._tone; g.gain.linearRampToValueAtTime(0,ctx.currentTime+0.6);
        setTimeout(()=>{try{osc.stop()}catch(e){}},700); this._tone=null;
      }
    }
  };
})();
