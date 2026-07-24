/* ТИШЕ — движок на НАСТОЯЩИХ звуках. Каждый звук — записанный ambient-луп (mp3),
   микшер: несколько играют слоями, у каждого своя громкость. */
"use strict";
const Engine = (() => {
  const BASE = 'assets/audio/';
  const CATALOG = [
    {id:'rain',        name:'Дождь',          cat:'Природа', emoji:'🌧️', file:'rain.mp3'},
    {id:'heavy-rain',  name:'Ливень',         cat:'Природа', emoji:'⛈️', file:'heavy-rain.mp3'},
    {id:'rain-window', name:'Дождь в окно',   cat:'Ночь',    emoji:'🪟', file:'rain-window.mp3'},
    {id:'waves',       name:'Океан',          cat:'Природа', emoji:'🌊', file:'waves.mp3'},
    {id:'river',       name:'Ручей',          cat:'Природа', emoji:'🏞️', file:'river.mp3'},
    {id:'waterfall',   name:'Водопад',        cat:'Природа', emoji:'💧', file:'waterfall.mp3'},
    {id:'wind',        name:'Ветер в кронах', cat:'Природа', emoji:'🌬️', file:'wind.mp3'},
    {id:'campfire',    name:'Костёр',         cat:'Уют',     emoji:'🔥', file:'campfire.mp3'},
    {id:'birds',       name:'Птицы в лесу',   cat:'Лес',     emoji:'🐦', file:'birds.mp3'},
    {id:'crickets',    name:'Сверчки',        cat:'Ночь',    emoji:'🦗', file:'crickets.mp3'},
    {id:'owl',         name:'Сова',           cat:'Ночь',    emoji:'🦉', file:'owl.mp3'},
    {id:'cafe',        name:'Кофейня',        cat:'Места',   emoji:'☕', file:'cafe.mp3'},
    {id:'library-amb', name:'Библиотека',     cat:'Места',   emoji:'📚', file:'library-amb.mp3'},
    {id:'night',       name:'Ночная деревня', cat:'Ночь',    emoji:'🌙', file:'night.mp3'},
  ];
  const FILE = Object.fromEntries(CATALOG.map(s=>[s.id, s.file]));

  const store = new Map();     // id -> {el, vol, fadeTimer}
  const active = new Set();
  const listeners = new Set();
  let masterVol = 0.9, ctx = null;

  function ensure(id){
    if(store.has(id)) return store.get(id);
    const el = new Audio(BASE + FILE[id]);
    el.loop = true; el.preload = 'auto'; el.volume = 0;
    const o = {el, vol:0.7, fadeTimer:null};
    store.set(id, o); return o;
  }
  function fade(o, target, ms){
    clearInterval(o.fadeTimer);
    const start = o.el.volume, t0 = performance.now();
    o.fadeTimer = setInterval(()=>{
      const k = Math.min(1, (performance.now()-t0)/ms);
      o.el.volume = Math.max(0, Math.min(1, start + (target-start)*k));
      if(k>=1){ clearInterval(o.fadeTimer); o.fadeTimer=null; if(target<=0) o.el.pause(); }
    }, 40);
  }
  function emit(){ const ids=[...active]; listeners.forEach(fn=>fn(ids)); }

  return {
    CATALOG,
    isOn(id){ return active.has(id); },
    activeIds(){ return [...active]; },
    onChange(fn){ listeners.add(fn); fn([...active]); },
    toggle(id){
      const o = ensure(id);
      if(active.has(id)){ fade(o, 0, 400); active.delete(id); emit(); return false; }
      o.el.play().catch(()=>{});
      fade(o, o.vol*masterVol, 900);
      active.add(id); emit(); return true;
    },
    play(id){ if(!active.has(id)) this.toggle(id); },
    setVol(id, v){ const o=ensure(id); o.vol=v; if(active.has(id)){ clearInterval(o.fadeTimer); o.el.volume=v*masterVol; } },
    getVol(id){ return store.has(id)? store.get(id).vol : 0.7; },
    setMaster(v){ masterVol=v; active.forEach(id=>{ const o=store.get(id); if(o){ clearInterval(o.fadeTimer); o.el.volume=o.vol*masterVol; } }); },
    stopAll(fadeMs){
      const ms = (fadeMs!=null? fadeMs*1000 : 500);
      active.forEach(id=>{ const o=store.get(id); if(o) fade(o, 0, ms); });
      active.clear(); emit();
    },
    // мягкий тон для дыхания на focus.html
    tone(on){
      if(on){
        const AC=window.AudioContext||window.webkitAudioContext;
        if(!ctx) ctx=new AC(); if(ctx.state==='suspended') ctx.resume();
        const osc=ctx.createOscillator(), g=ctx.createGain();
        osc.type='sine'; osc.frequency.value=196; g.gain.value=0;
        osc.connect(g); g.connect(ctx.destination);
        g.gain.linearRampToValueAtTime(0.05, ctx.currentTime+1);
        this._tone={osc,g};
        osc.start();
      } else if(this._tone){
        const {osc,g}=this._tone; g.gain.linearRampToValueAtTime(0, ctx.currentTime+0.6);
        const o=osc; setTimeout(()=>{try{o.stop()}catch(e){}},700); this._tone=null;
      }
    }
  };
})();
