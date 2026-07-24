/* ТИШЕ — движок ASMR-звуков. Всё синтезируется в браузере через Web Audio, без файлов.
   Микшер: несколько звуков играют слоями, у каждого своя громкость. */
"use strict";
const Engine = (() => {
  let ctx = null, master = null;
  const active = new Map();          // id -> { out, gain, stop, timers }
  const bufCache = {};
  const listeners = new Set();

  function impulse(dur, decay){
    const len = ctx.sampleRate*dur, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for(let ch=0; ch<2; ch++){ const d=buf.getChannelData(ch);
      for(let i=0;i<len;i++){ d[i]=(Math.random()*2-1)*Math.pow(1-i/len, decay); } }
    return buf;
  }
  function ac(){
    if(!ctx){
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.9;
      // мягкий срез верхов — шум перестаёт резать уши
      const mlp = ctx.createBiquadFilter(); mlp.type='lowpass'; mlp.frequency.value=7000; mlp.Q.value=0.5;
      // лёгкая компрессия для «склейки» слоёв
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value=-18; comp.ratio.value=2.4; comp.attack.value=0.02; comp.release.value=0.3;
      // общая реверберация даёт объём и убирает «плоскость»
      const verb = ctx.createConvolver(); verb.buffer = impulse(2.6, 2.8);
      const verbGain = ctx.createGain(); verbGain.gain.value=0.20;
      master.connect(mlp); mlp.connect(comp); comp.connect(ctx.destination);
      master.connect(verb); verb.connect(verbGain); verbGain.connect(comp);
    }
    if(ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // буферы шума (кэшируются)
  function noise(kind){
    const key = kind, C = ac();
    if(bufCache[key]) return bufCache[key];
    const len = C.sampleRate * 4, buf = C.createBuffer(1, len, C.sampleRate), d = buf.getChannelData(0);
    let last = 0, b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for(let i=0;i<len;i++){
      const w = Math.random()*2-1;
      if(kind==='brown'){ last=(last+0.02*w)/1.02; d[i]=last*3.2; }
      else if(kind==='pink'){ // Paul Kellet
        b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759; b2=0.96900*b2+w*0.1538520;
        b3=0.86650*b3+w*0.3104856; b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
        d[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11; b6=w*0.115926;
      } else d[i]=w; // white
    }
    return bufCache[key]=buf;
  }
  function src(kind, loop=true){ const s=ac().createBufferSource(); s.buffer=noise(kind); s.loop=loop; return s; }
  function gain(v){ const g=ac().createGain(); g.gain.value=v; return g; }
  function lp(f){ const b=ac().createBiquadFilter(); b.type='lowpass'; b.frequency.value=f; return b; }
  function hp(f){ const b=ac().createBiquadFilter(); b.type='highpass'; b.frequency.value=f; return b; }
  function bp(f,q){ const b=ac().createBiquadFilter(); b.type='bandpass'; b.frequency.value=f; b.Q.value=q||1; return b; }

  // короткий «зерно»-импульс (капля, треск, тик, клик, чирп)
  function grain(freq, dur, type, peak, filt){
    const C=ac(), o=C.createOscillator(), g=C.createGain();
    o.type=type||'sine'; o.frequency.value=freq;
    let node=o;
    if(filt){ o.connect(filt); node=filt; }
    node.connect(g); g.connect(masterFor());
    const t=C.currentTime;
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(peak||0.3, t+dur*0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    o.start(t); o.stop(t+dur+0.02);
  }
  function noiseBurst(cut, dur, peak){
    const C=ac(), s=src('white',false), f=lp(cut), g=C.createGain();
    s.connect(f); f.connect(g); g.connect(masterFor());
    const t=C.currentTime;
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(peak,t+dur*0.1);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    s.start(t); s.stop(t+dur+0.02);
  }
  let _routeGain=null;
  function masterFor(){ return _routeGain||master; }

  // ── рецепты звуков ──
  const R = {
    rain(o){ const s=src('brown'), f=lp(1400), g=gain(0.95); s.connect(f);f.connect(g);g.connect(o); s.start();
             const t=setInterval(()=>{ _routeGain=o; for(let i=0;i<3;i++) if(Math.random()<0.55) noiseBurst(4200+Math.random()*3000,0.045,0.028); _routeGain=null; },150);
             return {stop:()=>{s.stop();clearInterval(t);}}; },
    storm(o){ const s=src('brown'), f=lp(1800), g=gain(1.05); s.connect(f);f.connect(g);g.connect(o); s.start();
             const rain=setInterval(()=>{ _routeGain=o; for(let i=0;i<4;i++) if(Math.random()<0.7) noiseBurst(7000,0.03,0.05); _routeGain=null; },110);
             const thunder=setInterval(()=>{ if(Math.random()<0.14){ _routeGain=o; const s2=src('brown',false),lp2=lp(220),g2=gain(0); s2.connect(lp2);lp2.connect(g2);g2.connect(o);
               const tt=ac().currentTime; g2.gain.setValueAtTime(0,tt); g2.gain.linearRampToValueAtTime(0.8,tt+0.1); g2.gain.exponentialRampToValueAtTime(0.001,tt+2.4); s2.start(tt); s2.stop(tt+2.5); _routeGain=null; } },1600);
             return {stop:()=>{s.stop();clearInterval(rain);clearInterval(thunder);}}; },
    ocean(o){ const s=src('brown'), f=lp(560), g=gain(1); s.connect(f);f.connect(g);g.connect(o); s.start();
             const lfo=ac().createOscillator(), lg=gain(0.5); lfo.frequency.value=0.08; lfo.connect(lg); lg.connect(g.gain); lfo.start();
             return {stop:()=>{s.stop();lfo.stop();}}; },
    wind(o){ const s=src('brown'), f=bp(500,1.2), g=gain(0.9); s.connect(f);f.connect(g);g.connect(o); s.start();
             const lfo=ac().createOscillator(), lg=gain(360); lfo.frequency.value=0.06; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
             return {stop:()=>{s.stop();lfo.stop();}}; },
    stream(o){ const s=src('white'), h=hp(700), f=bp(2400,0.7), g=gain(0.32); s.connect(h);h.connect(f);f.connect(g);g.connect(o); s.start();
             const lfo=ac().createOscillator(), lg=gain(600); lfo.frequency.value=0.7; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
             return {stop:()=>{s.stop();lfo.stop();}}; },
    fire(o){ const s=src('brown'), f=lp(420), g=gain(0.5); s.connect(f);f.connect(g);g.connect(o); s.start();
             const t=setInterval(()=>{ _routeGain=o; const n=1+(Math.random()*3|0); for(let i=0;i<n;i++) if(Math.random()<0.5) noiseBurst(2500+Math.random()*3000,0.05+Math.random()*0.06,0.06+Math.random()*0.05); _routeGain=null; },120);
             return {stop:()=>{s.stop();clearInterval(t);}}; },
    forest(o){ const s=src('brown'), f=lp(700), g=gain(0.28); s.connect(f);f.connect(g);g.connect(o); s.start();
             const t=setInterval(()=>{ if(Math.random()<0.5){ _routeGain=o; const base=2200+Math.random()*2200; grain(base,0.12,'sine',0.14,bp(base,6)); if(Math.random()<0.5) setTimeout(()=>{_routeGain=o;grain(base*1.1,0.1,'sine',0.1,bp(base,6));_routeGain=null;},110); _routeGain=null; } },700);
             return {stop:()=>{s.stop();clearInterval(t);}}; },
    crickets(o){ const s=src('brown'), f=lp(300), g=gain(0.12); s.connect(f);f.connect(g);g.connect(o); s.start();
             const t=setInterval(()=>{ for(let k=0;k<3;k++) setTimeout(()=>{_routeGain=o;grain(4400,0.035,'triangle',0.035,bp(4400,9));_routeGain=null;},k*65); },440);
             return {stop:()=>{s.stop();clearInterval(t);}}; },
    cafe(o){ const s=src('brown'), f=lp(900), g=gain(0.42); s.connect(f);f.connect(g);g.connect(o); s.start();
             const t=setInterval(()=>{ if(Math.random()<0.25){ _routeGain=o; grain(3200+Math.random()*2000,0.09,'triangle',0.05,bp(4000,8)); _routeGain=null; } },900);
             return {stop:()=>{s.stop();clearInterval(t);}}; },
    fan(o){ const s=src('brown'), f=lp(1100), g=gain(0.8); s.connect(f);f.connect(g);g.connect(o); s.start();
             const lfo=ac().createOscillator(), lg=gain(0.14); lfo.frequency.value=7.5; lfo.connect(lg); lg.connect(g.gain); lfo.start();
             return {stop:()=>{s.stop();lfo.stop();}}; },
    clock(o){ const g=gain(1); g.connect(o);
             const t=setInterval(()=>{ _routeGain=o; noiseBurst(3500,0.02,0.09); _routeGain=null; },1000);
             return {stop:()=>{clearInterval(t);}}; },
    keys(o){ const g=gain(1); g.connect(o);
             let t=null; const tick=()=>{ _routeGain=o; noiseBurst(2200+Math.random()*1400,0.02,0.055); _routeGain=null; t=setTimeout(tick,90+Math.random()*300); }; tick();
             return {stop:()=>{clearTimeout(t);}}; },
    brown(o){ const s=src('brown'), g=gain(0.7); s.connect(g);g.connect(o); s.start(); return {stop:()=>s.stop()}; },
    pink(o){ const s=src('pink'), g=gain(0.85); s.connect(g);g.connect(o); s.start(); return {stop:()=>s.stop()}; },
    white(o){ const s=src('white'), f=lp(9000), g=gain(0.45); s.connect(f);f.connect(g);g.connect(o); s.start(); return {stop:()=>s.stop()}; },
  };

  const CATALOG = [
    {id:'rain',    name:'Дождь',          cat:'Природа',  emoji:'🌧️'},
    {id:'storm',   name:'Гроза',          cat:'Природа',  emoji:'⛈️'},
    {id:'ocean',   name:'Океан',          cat:'Природа',  emoji:'🌊'},
    {id:'stream',  name:'Ручей',          cat:'Природа',  emoji:'🏞️'},
    {id:'wind',    name:'Ветер',          cat:'Природа',  emoji:'🌬️'},
    {id:'forest',  name:'Лес и птицы',    cat:'Природа',  emoji:'🌲'},
    {id:'crickets',name:'Сверчки',        cat:'Ночь',     emoji:'🦗'},
    {id:'fire',    name:'Костёр',         cat:'Уют',      emoji:'🔥'},
    {id:'cafe',    name:'Кофейня',        cat:'Уют',      emoji:'☕'},
    {id:'fan',     name:'Вентилятор',     cat:'Уют',      emoji:'💨'},
    {id:'clock',   name:'Часы',           cat:'ASMR',     emoji:'🕰️'},
    {id:'keys',    name:'Клавиатура',     cat:'ASMR',     emoji:'⌨️'},
    {id:'brown',   name:'Коричневый шум', cat:'Шум',      emoji:'🟤'},
    {id:'pink',    name:'Розовый шум',    cat:'Шум',      emoji:'🩷'},
    {id:'white',   name:'Белый шум',      cat:'Шум',      emoji:'⚪'},
  ];

  function emit(){ listeners.forEach(fn=>fn(activeIds())); }
  function activeIds(){ return [...active.keys()]; }

  return {
    CATALOG,
    isOn(id){ return active.has(id); },
    activeIds,
    onChange(fn){ listeners.add(fn); },
    toggle(id){
      const C=ac();
      if(active.has(id)){ const a=active.get(id); a.stop(); try{a.out.disconnect()}catch(e){}; active.delete(id); emit(); return false; }
      const out=C.createGain(); out.gain.value=0; out.connect(master);
      const rec=R[id]; if(!rec) return false;
      const inst=rec(out);
      out.gain.linearRampToValueAtTime(0.6, C.currentTime+0.9);
      active.set(id, {out, gain:out.gain, stop:inst.stop}); emit(); return true;
    },
    setVol(id,v){ const a=active.get(id); if(a) a.gain.linearRampToValueAtTime(v, ac().currentTime+0.15); },
    setMaster(v){ if(master) master.gain.linearRampToValueAtTime(v, ac().currentTime+0.15); },
    stopAll(fade){
      if(!master) return;
      const t=ac().currentTime, f=fade||0.6;
      master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value,t);
      master.gain.linearRampToValueAtTime(0, t+f);
      setTimeout(()=>{ active.forEach(a=>{a.stop();try{a.out.disconnect()}catch(e){}}); active.clear();
        if(master) master.gain.setValueAtTime(0.9, ac().currentTime); emit(); }, (f+0.1)*1000);
    },
    // синтез тона для дыхания (используется на focus.html)
    tone(on){
      const C=ac();
      if(on){ const o=C.createOscillator(), g=C.createGain(); o.type='sine'; o.frequency.value=196; g.gain.value=0;
        o.connect(g); g.connect(master); g.gain.linearRampToValueAtTime(0.05, C.currentTime+1); this._tone={o,g}; o.start(); }
      else if(this._tone){ const {o,g}=this._tone; g.gain.linearRampToValueAtTime(0,C.currentTime+.6); setTimeout(()=>{try{o.stop()}catch(e){}},700); this._tone=null; }
    }
  };
})();
