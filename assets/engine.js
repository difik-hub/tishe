/* ТИШЕ — движок на НАСТОЯЩИХ записях (moodist, MIT). Микшер: слои с отдельной громкостью.
   У каждого звука своё оформление карточки: градиент, акцент и рисунок. */
"use strict";
const Engine = (() => {
  const BASE = 'assets/audio/';

  // рисунки для карточек — рисуются кодом, у каждого свой характер
  const ART = {
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
    bolt: (c)=>`<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round">
      <path d="M56 14L36 52h16l-8 34 28-44H56l8-28Z"/><path d="M22 30q10-6 18-2M78 34q-8-6-16-3" opacity=".55"/></g></svg>`,
  };

  const C = [
    // id            имя                кат        emoji  градиент                                      акцент     рисунок
    ['rain',        'Дождь',           'Непогода','🌧️','linear-gradient(160deg,#1E2A4A,#0E1424)','#8FB4E8','streaks'],
    ['heavy-rain',  'Ливень',          'Непогода','⛈️','linear-gradient(160deg,#16233E,#0B1120)','#7FA3DA','streaks'],
    ['rain-window', 'Дождь в окно',    'Непогода','🪟','linear-gradient(160deg,#243044,#12181F)','#A9C4DE','window'],
    ['thunder',     'Гром',            'Непогода','🌩️','linear-gradient(160deg,#2A2740,#12111C)','#B9A6E8','bolt'],
    ['waves',       'Океан',           'Вода',    '🌊','linear-gradient(160deg,#12384A,#081C26)','#79CBDF','waves'],
    ['river',       'Ручей',           'Вода',    '🏞️','linear-gradient(160deg,#153F3C,#08201F)','#7FD4C0','waves'],
    ['waterfall',   'Водопад',         'Вода',    '💧','linear-gradient(160deg,#0F3A44,#071E24)','#84D6E2','drop'],
    ['wind',        'Ветер в кронах',  'Лес',     '🌬️','linear-gradient(160deg,#1D3630,#0C1A17)','#9AD3B4','leaves'],
    ['birds',       'Птицы в лесу',    'Лес',     '🐦','linear-gradient(160deg,#243C22,#101B0F)','#B4D98A','leaves'],
    ['campfire',    'Костёр',          'Уют',     '🔥','linear-gradient(160deg,#3E2415,#1C0F08)','#F0A868','flame'],
    ['crickets',    'Сверчки',         'Ночь',    '🦗','linear-gradient(160deg,#1B2B22,#0B1410)','#A8CF9A','moon'],
    ['owl',         'Сова',            'Ночь',    '🦉','linear-gradient(160deg,#2B2438,#130F1C)','#C0AEE0','moon'],
    ['night',       'Ночная деревня',  'Ночь',    '🌙','linear-gradient(160deg,#1F2440,#0D101F)','#AEB8E8','moon'],
    ['chimes',      'Ветряные колокольчики','Уют','🎐','linear-gradient(160deg,#2F2A3E,#15121D)','#D6C2E8','chimes'],
    ['bowl',        'Поющая чаша',     'Медитация','🔔','linear-gradient(160deg,#3A2E1E,#1A150D)','#E2C489','ripple'],
    ['cafe',        'Кофейня',         'Места',   '☕','linear-gradient(160deg,#33251C,#17100C)','#D8A87E','dots'],
    ['library-amb', 'Библиотека',      'Места',   '📚','linear-gradient(160deg,#2C2A22,#141310)','#D2C69A','paper'],
    ['train',       'В поезде',        'Места',   '🚆','linear-gradient(160deg,#25303C,#101519)','#9FB6C8','rails'],
    ['keyboard',    'Клавиатура',      'ASMR',    '⌨️','linear-gradient(160deg,#232A34,#0F1216)','#A4B8D0','keys'],
    ['typewriter',  'Печатная машинка','ASMR',    '🖨️','linear-gradient(160deg,#302A26,#161311)','#CDBBA6','keys'],
    ['paper',       'Шелест бумаги',   'ASMR',    '📄','linear-gradient(160deg,#2E2C26,#151412)','#CFC7B0','paper'],
    ['clock',       'Часы',            'ASMR',    '🕰️','linear-gradient(160deg,#2A2A2E,#131315)','#BEBEC6','clock'],
    ['fan',         'Вентилятор',      'Дом',     '💨','linear-gradient(160deg,#20303A,#0E1519)','#93B6C4','fan'],
    ['washing',     'Стиральная машина','Дом',    '🧺','linear-gradient(160deg,#26303E,#11151C)','#9EB2CE','ripple'],
    ['brown',       'Коричневый шум',  'Шум',     '🟤','linear-gradient(160deg,#38291D,#19120C)','#D8A97C','dots'],
    ['pink',        'Розовый шум',     'Шум',     '🩷','linear-gradient(160deg,#3A2430,#1A0F16)','#E8A6BE','dots'],
    ['white',       'Белый шум',       'Шум',     '⚪','linear-gradient(160deg,#2C2F33,#141517)','#D6DAE0','dots'],
  ];
  const EXT = {brown:'wav',pink:'wav',white:'wav'};
  const CATALOG = C.map(([id,name,cat,emoji,grad,accent,art])=>({
    id,name,cat,emoji,grad,accent,
    file:id+'.'+(EXT[id]||'mp3'),
    art:(ART[art]||ART.dots)(accent)
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
    CATALOG, ART,
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
