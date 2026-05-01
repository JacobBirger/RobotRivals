// Audio: lobby music, stage music, SFX
const _lobbyAudio=new Audio('LobbyMusic.mp3');
_lobbyAudio.loop=true;
_lobbyAudio.volume=1.0;

let bgMusic=null;       // current HTMLAudioElement (stage music)
let bgMusicSrc='';      // src currently loaded

function playLobbyMusic(){
  // Pause stage music if playing
  if(bgMusic){bgMusic.pause();bgMusic.currentTime=0;bgMusic=null;bgMusicSrc='';}
  if(!_lobbyAudio.paused) return; // already playing
  _lobbyAudio.play().catch(()=>{
    // Autoplay blocked — retry on next user interaction
    function onInteract(){
      _lobbyAudio.play().catch(()=>{});
      document.removeEventListener('keydown',onInteract);
      document.removeEventListener('mousedown',onInteract);
      document.removeEventListener('touchstart',onInteract);
    }
    document.addEventListener('keydown',onInteract);
    document.addEventListener('mousedown',onInteract);
    document.addEventListener('touchstart',onInteract);
  });
}

function playStageMusic(st){
  const m=st&&st.music;
  if(!m){stopBgMusic();return;}
  // Pause lobby music when stage music starts
  if(!_lobbyAudio.paused){_lobbyAudio.pause();_lobbyAudio.currentTime=0;}
  if(bgMusic&&bgMusicSrc===m.src) return; // already playing
  stopBgMusic();
  bgMusic=new Audio(m.src);
  bgMusic.loop=true;
  bgMusic.volume=m.volume??0.5;
  bgMusicSrc=m.src;
  bgMusic.play().catch(()=>{});
}

function stopBgMusic(){
  if(bgMusic){bgMusic.pause();bgMusic.currentTime=0;bgMusic=null;bgMusicSrc='';}
}

// ---- Knockback scale ----
function kbScale(dmg){
  const base=1+dmg/95;
  if(dmg<=100) return base;
  const excess=dmg-100;
  return base*Math.pow(1.03,excess); // +3% per % above 100
}

// ---- SFX ----
let _sfxCtx=null;
function _ac(){if(!_sfxCtx)_sfxCtx=new(window.AudioContext||window.webkitAudioContext)();return _sfxCtx;}

function playSfx({freq=440,freq2=null,type='square',decay=0.12,vol=0.18,attack=0.004}={}){
  try{
    const ac=_ac(),g=ac.createGain(),o=ac.createOscillator();
    const f2=freq2??freq*0.5;
    o.type=type;
    o.frequency.setValueAtTime(freq,ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(f2,ac.currentTime+decay);
    g.gain.setValueAtTime(0.001,ac.currentTime);
    g.gain.linearRampToValueAtTime(vol,ac.currentTime+attack);
    g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+decay);
    o.connect(g);g.connect(ac.destination);
    o.start();o.stop(ac.currentTime+decay+0.02);
  }catch(e){}
}

function playSfxNoise(duration=0.08,vol=0.25,hipass=200){
  try{
    const ac=_ac(),buf=ac.createBuffer(1,Math.ceil(ac.sampleRate*duration),ac.sampleRate);
    const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1);
    const src=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();
    f.type='highpass';f.frequency.value=hipass;
    g.gain.setValueAtTime(vol,ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+duration);
    src.buffer=buf;src.connect(f);f.connect(g);g.connect(ac.destination);src.start();
  }catch(e){}
}

function sfxSwing(charId,type,dir){
  const h=type==='heavy';
  switch(charId){
    case 0: // BOLT — punchy electric zap
      playSfx({freq:h?120:180,freq2:h?50:90,type:'square',decay:h?0.16:0.1,vol:0.16}); break;
    case 1: // CRUSHER — deep grinding thud
      playSfx({freq:h?60:80,freq2:h?25:40,type:'sawtooth',decay:h?0.28:0.18,vol:0.22}); break;
    case 2: // ZIPPY — fast bright ping
      playSfx({freq:h?400:700,freq2:h?100:180,type:'sine',decay:h?0.1:0.06,vol:0.15}); break;
    case 3: // BLASTER — charge whine
      playSfx({freq:h?200:300,freq2:h?900:700,type:'sawtooth',decay:h?0.2:0.12,vol:0.14}); break;
    case 4: // EDGE — metallic swoosh
      playSfx({freq:h?280:400,freq2:h?80:150,type:'triangle',decay:h?0.22:0.14,vol:0.17});
      playSfxNoise(h?0.14:0.08,0.08,2000); break;
    case 5: // PIERCE — high stab whistle
      playSfx({freq:h?500:900,freq2:h?150:300,type:'sine',decay:h?0.18:0.1,vol:0.15}); break;
    case 6: // ROCKET — ignite hiss
      playSfx({freq:h?160:220,freq2:h?50:80,type:'sawtooth',decay:h?0.25:0.14,vol:0.16});
      playSfxNoise(h?0.18:0.1,0.1,400); break;
    case 7: // UNSTABLE — glitchy buzz
      playSfx({freq:h?100:180,freq2:h?300:440,type:'square',decay:h?0.2:0.1,vol:0.18});
      playSfx({freq:h?300:440,freq2:h?80:120,type:'square',decay:h?0.28:0.16,vol:0.1}); break;
    case 8: // BLADE — knife flick
      playSfx({freq:h?600:1100,freq2:h?200:320,type:'sine',decay:h?0.14:0.07,vol:0.14}); break;
    case 10: // PRISTINE — elegant chime
      playSfx({freq:h?440:700,freq2:h?220:440,type:'sine',decay:h?0.22:0.14,vol:0.13}); break;
    case 11: // MAGMA — fire crackle
      playSfxNoise(h?0.22:0.12,h?0.3:0.2,h?80:200); break;
    case 12: // FACTORY — mechanical clunk
      playSfx({freq:h?80:110,freq2:h?30:55,type:'sawtooth',decay:h?0.2:0.13,vol:0.2});
      playSfxNoise(h?0.1:0.06,0.12,600); break;
    case 13: // GLITCH — digital glitch chirp
      playSfx({freq:h?200:600,freq2:h?800:100,type:'square',decay:h?0.15:0.08,vol:0.16});
      if(!h)playSfx({freq:1200,freq2:80,type:'square',decay:0.05,vol:0.1}); break;
    default: // fallback
      playSfx({freq:h?200:300,freq2:h?80:150,type:'square',decay:0.1,vol:0.14});
  }
}

function sfxHit(heavy){
  if(heavy){
    playSfxNoise(0.14,0.38,120);
    playSfx({freq:90,freq2:35,type:'sine',decay:0.18,vol:0.22});
  } else {
    playSfxNoise(0.08,0.22,700);
  }
}

export { playLobbyMusic, playStageMusic, stopBgMusic, kbScale, playSfx, playSfxNoise, sfxSwing, sfxHit };
