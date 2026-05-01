
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = 1000, H = 600;
canvas.width = W; canvas.height = H;

// ---- Input ----
const keys = {};
let p1JumpPend=false, p2JumpPend=false, p3JumpPend=false, p4JumpPend=false;
let p1LightPend=false, p1HeavyPend=false;
let p2LightPend=false, p2HeavyPend=false;
let p3LightPend=false, p3HeavyPend=false;
let p4LightPend=false, p4HeavyPend=false;
let p1ShieldPend=false, p2ShieldPend=false, p3ShieldPend=false, p4ShieldPend=false;
let p1DashPend=false,   p2DashPend=false,   p3DashPend=false,   p4DashPend=false;
let p1HeavyRelease=false, p2HeavyRelease=false, p3HeavyRelease=false, p4HeavyRelease=false;
let mouseRight=false, mouseLeft=false;
let modeSelIdx=0;
const gpPrev=[{},{}];
const GP_DEAD=0.3;

document.addEventListener('keydown', e => {
  const was = keys[e.code];
  keys[e.code] = true;
  if (!was) {
    // Grab button (replaces jump). Separate from movement keys.
    if (e.code==='KeyE'         && gameState==='game') p1JumpPend=true;
    if (e.code==='Period'       && gameState==='game') p2JumpPend=true;
    if (e.code==='KeyZ')    p1LightPend=true;
    if (e.code==='KeyX')    p1HeavyPend=true;
    if (e.code==='KeyQ'         && gameState==='game') p1ShieldPend=true;
    if (e.code==='Slash'        && gameState==='game') p2ShieldPend=true;
    if (e.code==='ShiftLeft'    && gameState==='game') p1DashPend=true;
    if (e.code==='ShiftRight'   && gameState==='game') p2DashPend=true;
    if (e.code==='BracketLeft'  && gameState==='game') p2LightPend=true;
    if (e.code==='BracketRight' && gameState==='game') p2HeavyPend=true;
  }
  if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  if (gameState==='modeSelect')       menuModeKey(e.code);
  else if (gameState==='charSelect')  menuCharKey(e.code);
  else if (gameState==='stageSelect') menuStageKey(e.code);
  if (gameState==='gameOver' && (e.code==='Space'||e.code==='Enter'||e.code==='NumpadEnter')) resetMenu();
  if (e.code==='Escape' && gameState==='game' && networkMode==='test') resetMenu();
});
document.addEventListener('keyup', e => {
  keys[e.code]=false;
  if (e.code==='KeyX'          && gameState==='game') p1HeavyRelease=true;
  if (e.code==='BracketRight'  && gameState==='game') p2HeavyRelease=true;
});
document.addEventListener('mousedown', e => {
  if (e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='BUTTON') return;
  if (e.button===0) { p1LightPend=true; mouseLeft=true; }
  if (e.button===2) { p1HeavyPend=true; mouseRight=true; }
  e.preventDefault();
});
document.addEventListener('mouseup', e => {
  if (e.button===0) mouseLeft=false;
  if (e.button===2) { mouseRight=false; if(gameState==='game') p1HeavyRelease=true; }
});
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('wheel', e => {
  if(gameState==='charSelect'){
    const maxSc=Math.max(0,(Math.ceil(CHARS.length/3)-2)*(230+12));
    charScrollY=Math.max(0,Math.min(maxSc,charScrollY+e.deltaY*0.4));
    e.preventDefault();
  }
},{passive:false});

function getP1Input() {
  return { left:keys['KeyA']||keys['_gp1L']||keys['_ph1L'],right:keys['KeyD']||keys['_gp1R']||keys['_ph1R'],
           down:keys['KeyS']||keys['_gp1D']||keys['_ph1D'],up:keys['KeyW']||keys['_gp1U']||keys['_ph1U'],
           grab:p1JumpPend,light:p1LightPend,heavy:p1HeavyPend,shield:p1ShieldPend,
           dash:p1DashPend,heavyHeld:keys['KeyX']||keys['_gp1Hvy']||keys['_ph1Hvy'],heavyRelease:p1HeavyRelease,
           lightHeld:keys['KeyZ']||mouseLeft||keys['_gp1Lt']||keys['_ph1Lt'] };
}
function getP2Input() {
  return { left:keys['ArrowLeft']||keys['_gp2L']||keys['_ph2L'],right:keys['ArrowRight']||keys['_gp2R']||keys['_ph2R'],
           down:keys['ArrowDown']||keys['_gp2D']||keys['_ph2D'],up:keys['ArrowUp']||keys['_gp2U']||keys['_ph2U'],
           grab:p2JumpPend,light:p2LightPend,heavy:p2HeavyPend,shield:p2ShieldPend,
           dash:p2DashPend,heavyHeld:keys['BracketRight']||keys['_gp2Hvy']||keys['_ph2Hvy'],heavyRelease:p2HeavyRelease,
           lightHeld:keys['BracketLeft']||keys['_gp2Lt']||keys['_ph2Lt'] };
}
function getP3Input() {
  return { left:keys['_ph3L'],right:keys['_ph3R'],down:keys['_ph3D'],up:keys['_ph3U'],
           grab:p3JumpPend,light:p3LightPend,heavy:p3HeavyPend,shield:p3ShieldPend,
           dash:p3DashPend,heavyHeld:keys['_ph3Hvy'],heavyRelease:p3HeavyRelease,
           lightHeld:keys['_ph3Lt'] };
}
function getP4Input() {
  return { left:keys['_ph4L'],right:keys['_ph4R'],down:keys['_ph4D'],up:keys['_ph4U'],
           grab:p4JumpPend,light:p4LightPend,heavy:p4HeavyPend,shield:p4ShieldPend,
           dash:p4DashPend,heavyHeld:keys['_ph4Hvy'],heavyRelease:p4HeavyRelease,
           lightHeld:keys['_ph4Lt'] };
}
function dummyInput() { return {left:false,right:false,down:false,up:false,grab:false,light:false,heavy:false,shield:false,dash:false,heavyHeld:false,heavyRelease:false,lightHeld:false}; }

// ---- Gamepad ----
function pollGamepads(){
  const gps=navigator.getGamepads?navigator.getGamepads():[];
  for(let gi=0;gi<2;gi++){
    const gp=gps[gi];if(!gp)continue;
    const prev=gpPrev[gi];
    const btn=i=>gp.buttons[i]&&gp.buttons[i].pressed;
    const edge=i=>btn(i)&&!prev['b'+i];
    const rel=i=>!btn(i)&&prev['b'+i];
    const sx=gp.axes[0]||0,sy=gp.axes[1]||0;
    const sL=sx<-GP_DEAD,sR=sx>GP_DEAD,sU=sy<-GP_DEAD,sD=sy>GP_DEAD;
    const eL=(sL&&!prev.sL)||edge(14),eR=(sR&&!prev.sR)||edge(15);
    const eU=(sU&&!prev.sU)||edge(12),eD=(sD&&!prev.sD)||edge(13);
    const gpLeft=sL||btn(14),gpRight=sR||btn(15),gpUp=sU||btn(12),gpDown=sD||btn(13);
    if(gi===0){
      keys['_gp1L']=gpLeft;keys['_gp1R']=gpRight;keys['_gp1U']=gpUp;keys['_gp1D']=gpDown;
      keys['_gp1Hvy']=btn(3);keys['_gp1Lt']=btn(2);keys['_gp1JH']=btn(0);
      if(edge(0))p1JumpPend=true;
      if(edge(2))p1LightPend=true;
      if(edge(3))p1HeavyPend=true;
      if(edge(1)&&gameState==='game')p1ShieldPend=true;
      if((edge(4)||edge(6))&&gameState==='game')p1DashPend=true;
      if(rel(3)&&gameState==='game')p1HeavyRelease=true;
    }else{
      keys['_gp2L']=gpLeft;keys['_gp2R']=gpRight;keys['_gp2U']=gpUp;keys['_gp2D']=gpDown;
      keys['_gp2Hvy']=btn(3);keys['_gp2Lt']=btn(2);keys['_gp2JH']=btn(0);
      if(edge(0))p2JumpPend=true;
      if(edge(2))p2LightPend=true;
      if(edge(3))p2HeavyPend=true;
      if(edge(1)&&gameState==='game')p2ShieldPend=true;
      if((edge(4)||edge(6))&&gameState==='game')p2DashPend=true;
      if(rel(3)&&gameState==='game')p2HeavyRelease=true;
    }
    // Menu navigation
    if(gameState==='modeSelect'){
      if(eU)modeSelIdx=(modeSelIdx+2)%3;
      if(eD)modeSelIdx=(modeSelIdx+1)%3;
      if(edge(0)||edge(9)){const codes=['KeyL','Key4','KeyT'];menuModeKey(codes[modeSelIdx]);}
    }else if(gameState==='charSelect'){
      const kL=gi===0?'KeyA':'ArrowLeft',kR=gi===0?'KeyD':'ArrowRight';
      const kU=gi===0?'KeyW':'ArrowUp',kD=gi===0?'KeyS':'ArrowDown';
      if(eL)menuCharKey(kL);if(eR)menuCharKey(kR);if(eU)menuCharKey(kU);if(eD)menuCharKey(kD);
      if(edge(0)||edge(9))menuCharKey(gi===0?'Space':'Enter');
    }else if(gameState==='stageSelect'){
      if(eL)menuStageKey('KeyA');if(eR)menuStageKey('KeyD');if(eU)menuStageKey('KeyW');if(eD)menuStageKey('KeyS');
      if(edge(0)||edge(9))menuStageKey('Space');
    }else if(gameState==='gameOver'){
      if(edge(0)||edge(9))resetMenu();
    }
    if(gameState==='game'&&networkMode==='test'&&edge(9))resetMenu();
    for(let i=0;i<gp.buttons.length;i++)prev['b'+i]=btn(i);
    prev.sL=sL;prev.sR=sR;prev.sU=sU;prev.sD=sD;
  }
}

// ---- Phone Controller (WebSocket) ----
const phonePrev=[{},{},{},{}];
let phoneWS=null;
function initPhoneController(){
  if(location.protocol==='file:')return; // only works when served
  const proto=location.protocol==='https:'?'wss':'ws';
  phoneWS=new WebSocket(`${proto}://${location.host}`);
  phoneWS.onopen=()=>{phoneWS.send(JSON.stringify({type:'register',role:'game'}));};
  phoneWS.onclose=()=>{setTimeout(initPhoneController,3000);};
  phoneWS.onerror=()=>{};
  phoneWS.onmessage=(e)=>{
    try{
      const msg=JSON.parse(e.data);
      if(msg.type!=='input')return;
      const pi=(msg.player||1)-1; // 0=P1, 1=P2
      const prev=phonePrev[pi];
      const edge=(k)=>msg[k]&&!prev[k];
      const rel=(k)=>!msg[k]&&prev[k];
      if(pi===0){
        keys['_ph1L']=msg.left;keys['_ph1R']=msg.right;keys['_ph1U']=msg.up;keys['_ph1D']=msg.down;
        keys['_ph1Hvy']=msg.heavy;keys['_ph1Lt']=msg.light;keys['_ph1JH']=msg.jump;
        if(edge('jump'))p1JumpPend=true;
        if(edge('light'))p1LightPend=true;
        if(edge('heavy'))p1HeavyPend=true;
        if(edge('shield')&&gameState==='game')p1ShieldPend=true;
        if(edge('dash')&&gameState==='game')p1DashPend=true;
        if(rel('heavy')&&gameState==='game')p1HeavyRelease=true;
      }else if(pi===1){
        keys['_ph2L']=msg.left;keys['_ph2R']=msg.right;keys['_ph2U']=msg.up;keys['_ph2D']=msg.down;
        keys['_ph2Hvy']=msg.heavy;keys['_ph2Lt']=msg.light;keys['_ph2JH']=msg.jump;
        if(edge('jump'))p2JumpPend=true;
        if(edge('light'))p2LightPend=true;
        if(edge('heavy'))p2HeavyPend=true;
        if(edge('shield')&&gameState==='game')p2ShieldPend=true;
        if(edge('dash')&&gameState==='game')p2DashPend=true;
        if(rel('heavy')&&gameState==='game')p2HeavyRelease=true;
      }else if(pi===2){
        keys['_ph3L']=msg.left;keys['_ph3R']=msg.right;keys['_ph3U']=msg.up;keys['_ph3D']=msg.down;
        keys['_ph3Hvy']=msg.heavy;keys['_ph3Lt']=msg.light;keys['_ph3JH']=msg.jump;
        if(edge('jump'))p3JumpPend=true;
        if(edge('light'))p3LightPend=true;
        if(edge('heavy'))p3HeavyPend=true;
        if(edge('shield')&&gameState==='game')p3ShieldPend=true;
        if(edge('dash')&&gameState==='game')p3DashPend=true;
        if(rel('heavy')&&gameState==='game')p3HeavyRelease=true;
      }else if(pi===3){
        keys['_ph4L']=msg.left;keys['_ph4R']=msg.right;keys['_ph4U']=msg.up;keys['_ph4D']=msg.down;
        keys['_ph4Hvy']=msg.heavy;keys['_ph4Lt']=msg.light;keys['_ph4JH']=msg.jump;
        if(edge('jump'))p4JumpPend=true;
        if(edge('light'))p4LightPend=true;
        if(edge('heavy'))p4HeavyPend=true;
        if(edge('shield')&&gameState==='game')p4ShieldPend=true;
        if(edge('dash')&&gameState==='game')p4DashPend=true;
        if(rel('heavy')&&gameState==='game')p4HeavyRelease=true;
      }
      // Menu navigation from phone
      if(gameState==='modeSelect'){
        if(edge('up'))modeSelIdx=(modeSelIdx+2)%3;
        if(edge('down'))modeSelIdx=(modeSelIdx+1)%3;
        if(edge('jump')||edge('light')){const codes=['KeyL','Key4','KeyT'];menuModeKey(codes[modeSelIdx]);}
      }else if(gameState==='charSelect'){
        // In team4 mode each phone selects for their own player slot
        if(networkMode==='team4'){
          if(edge('left'))menuCharKey({pi,dir:'left'});
          if(edge('right'))menuCharKey({pi,dir:'right'});
          if(edge('up'))menuCharKey({pi,dir:'up'});
          if(edge('down'))menuCharKey({pi,dir:'down'});
          if(edge('jump')||edge('light'))menuCharKey({pi,dir:'confirm'});
        } else {
          const kL=pi===0?'KeyA':'ArrowLeft',kR=pi===0?'KeyD':'ArrowRight';
          const kU=pi===0?'KeyW':'ArrowUp',kD=pi===0?'KeyS':'ArrowDown';
          if(edge('left'))menuCharKey(kL);if(edge('right'))menuCharKey(kR);
          if(edge('up'))menuCharKey(kU);if(edge('down'))menuCharKey(kD);
          if(edge('jump')||edge('light'))menuCharKey(pi===0?'Space':'Enter');
        }
      }else if(gameState==='stageSelect'){
        if(pi===0){
          if(edge('left'))menuStageKey('KeyA');if(edge('right'))menuStageKey('KeyD');
          if(edge('up'))menuStageKey('KeyW');if(edge('down'))menuStageKey('KeyS');
          if(edge('jump')||edge('light'))menuStageKey('Space');
        }
      }else if(gameState==='gameOver'){
        if(edge('jump')||edge('light'))resetMenu();
      }
      // Save previous state
      for(const k of ['left','right','up','down','jump','light','heavy','shield','dash'])prev[k]=msg[k];
    }catch(e){}
  };
}
initPhoneController();

let networkMode='none';
let confirmedChars={}; // pn → char index

function defaultInput(){return{left:false,right:false,down:false,up:false,grab:false,light:false,heavy:false,shield:false,dash:false,heavyHeld:false,heavyRelease:false,lightHeld:false};}
function getInputForPn(pn) {
  if (networkMode==='team4') return pn===1?getP1Input():pn===2?getP2Input():pn===3?getP3Input():getP4Input();
  if (networkMode==='test') return pn===1?getP1Input():dummyInput();
  return pn===1?getP1Input():getP2Input();
}

// ---- Team helper ----
function sameTeam(a,b){return a&&b&&a.team>0&&b.team>0&&a.team===b.team;}

// ---- Bullets ----
const bullets = [];
class Bullet {
  constructor(x,y,vx,vy,owner,heavy) {
    this.x=x; this.y=y; this.vx=vx; this.vy=vy;
    this.owner=owner; this.heavy=heavy;
    this.ox=x; this.oy=y; this.dead=false;
    this.dmg=heavy?8:4; this.kb=heavy?6:4;
    this.maxDist=heavy?(owner.ch.heavyBulletRange||300):(owner.ch.lightBulletRange||240);
    this.size=1;
  }
  get dist() { return Math.hypot(this.x-this.ox,this.y-this.oy); }
  update(players) {
    if (this.dead) return;
    this.x+=this.vx; this.y+=this.vy;
    if (this.dist>this.maxDist||this.x<-60||this.x>W+60||this.y<-60||this.y>H+60) { this.dead=true; return; }
    const bLen=(this.heavy?15:this.wide?12:9)*this.size, bWid=(this.heavy?5:this.wide?5:3)*this.size;
    for (const p of players) {
      if (p===this.owner||sameTeam(p,this.owner)||p.dead) continue;
      if(p.laserShieldActive){
        if(this.x+bLen>p.x-10&&this.x-bLen<p.right+10&&this.y+bWid>p.y-10&&this.y-bWid<p.bottom+10){
          this.owner.damage+=Math.round(this.dmg*(this.owner.ch.def??1));
          this.owner.hitFlash=12; addHitParticles(this.x,this.y,'#00ffff',false);
          this.dead=true; return;
        }
        continue;
      }
      if (p.shieldActive) {
        if (this.x+bLen>p.x-10&&this.x-bLen<p.right+10&&this.y+bWid>p.y-10&&this.y-bWid<p.bottom+10) {
          addHitParticles(this.x,this.y,'#aaddff',false); shakeX+=(Math.random()-.5)*4; this.dead=true; return;
        }
        continue;
      }
      if(sameTeam(p,this.owner)) continue;
      if (this.x+bLen>p.x&&this.x-bLen<p.right&&this.y+bWid>p.y&&this.y-bWid<p.bottom) {
        if(p.damage>=DEATH_THRESHOLD&&!p.isDummy){instakill(p,this.x,this.y);this.dead=true;return;}
        p.damage+=Math.round(this.dmg*(p.ch.def??1)); p.hitFlash=14; p.charging=false; p.chargeTime=0;
        const km=kbScale(p.damage), kb=this.kb*km/p.ch.weight;
        p.vx=this.vx>0?kb:-kb; p.vy=-kb*0.08;
        p.vx=Math.max(-MAX_KB,Math.min(MAX_KB,p.vx)); p.vy=Math.max(-MAX_KB,Math.min(MAX_KB,p.vy));
        if(this.heavy) p.hstun=Math.min(35,Math.floor(5+kb*1.5));
        p.onGnd=false; p.onPlat=false; p.hitlag=3; this.owner.hitlag=0;
        addHitParticles(this.x,this.y,this.owner.ch.color,this.heavy);
        shakeX+=(Math.random()-.5)*(this.heavy?8:4); this.dead=true; return;
      }
    }
  }
  draw() {
    if (this.dead) return;
    const fade=Math.max(0.1,1-this.dist/this.maxDist);
    const ang=Math.atan2(this.vy,this.vx);
    ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(ang); ctx.globalAlpha=fade;
    const len=(this.heavy?15:this.wide?12:9)*this.size, wid=(this.heavy?5:this.wide?5:3)*this.size;
    ctx.shadowBlur=this.heavy?22:14; ctx.shadowColor=this.owner.ch.eyeCol;
    ctx.fillStyle=this.owner.ch.eyeCol;
    ctx.beginPath(); ctx.ellipse(0,0,len*0.7,wid*0.7,0,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0; ctx.fillStyle=this.owner.ch.color;
    ctx.beginPath(); ctx.ellipse(0,0,len,wid,0,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=fade*0.3; ctx.fillStyle=this.owner.ch.color;
    ctx.beginPath(); ctx.ellipse(-len*1.3,0,len*1.6,wid*0.5,0,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
}

// ---- Characters ----
const CHARS = [
  { id:0,name:'BOLT',tag:'The All-Rounder',
    desc:['Balanced stats','2-hit punch combo','Easy to learn'],
    color:'#3399ff',accent:'#1155cc',eyeCol:'#00ffff',hi:'#88ccff',
    w:46,h:58,speed:5.5,jumpF:-13.5,djF:-12.0,weight:1.0,def:1.00,shieldCool:120,
    lDmg:5,hDmg:10,lKB:5,hKB:11,lSU:5,hSU:15,lAct:8,hAct:12,lEl:8,hEl:22,
    lSz:44,lRch:74,hSz:62,hRch:90, maxCombo:2 },
  { id:1,name:'CRUSHER',tag:'The Powerhouse',
    desc:['Massive charged heavy','High damage','Slow but mighty'],
    color:'#ff3333',accent:'#991111',eyeCol:'#ff8800',hi:'#ff8888',
    w:58,h:68,speed:4.0,jumpF:-12.3,djF:-10.8,weight:1.5,def:0.68,shieldCool:132,
    lDmg:8,hDmg:16,lKB:10,hKB:21,lSU:6,hSU:18,lAct:10,hAct:15,lEl:10,hEl:28,
    lSz:52,lRch:60,hSz:72,hRch:77 },
  { id:2,name:'ZIPPY',tag:'The Speed Demon',
    desc:['Lightning-fast attacks','Charged heavy hits hard','Lower base knockback'],
    color:'#ffdd00',accent:'#cc8800',eyeCol:'#ff00cc',hi:'#ffee88',
    w:40,h:50,speed:8.0,jumpF:-14.1,djF:-12.6,weight:0.8,def:1.16,shieldCool:108,
    lDmg:5,hDmg:9,lKB:5,hKB:10,lSU:2,hSU:8,lAct:6,hAct:10,lEl:5,hEl:16,
    lSz:38,lRch:50,hSz:55,hRch:64 },
  { id:3,name:'BLASTER',tag:'The Marksman',
    desc:['Fires ranged bullets','Heavy shot must charge up','Short-to-mid range only'],
    color:'#00cc77',accent:'#007744',eyeCol:'#00ffaa',hi:'#88ffcc',
    w:44,h:52,speed:7.0,jumpF:-14.7,djF:-13.2,weight:0.9,def:1.08,shieldCool:120,
    lDmg:6,hDmg:8,lKB:4,hKB:9,lSU:4,hSU:50,lAct:5,hAct:7,lEl:8,hEl:22,
    lSz:10,lRch:10,hSz:12,hRch:12,
    bulletSpd:12,heavyBulletSpd:18,
    lightBulletRange:220,heavyBulletRange:300 },
  { id:4,name:'EDGE',tag:'The Duelist',
    desc:['3-hit sword combos','Direction changes combo style','Rewarding mastery'],
    color:'#cc44ff',accent:'#881acc',eyeCol:'#ff88ff',hi:'#dd99ff',
    w:44,h:56,speed:6.0,jumpF:-14.1,djF:-12.6,weight:0.9,def:1.00,shieldCool:96,
    lDmg:9,hDmg:12,lKB:6,hKB:13,lSU:4,hSU:12,lAct:7,hAct:11,lEl:8,hEl:20,
    lSz:32,lRch:90,hSz:50,hRch:102, maxCombo:3 },
  { id:5,name:'PIERCE',tag:'The Lancer',
    desc:['Extra-long spear reach','Down+Light: pogo bounce','3-hit spear swing combo'],
    color:'#00dddd',accent:'#008888',eyeCol:'#aaffff',hi:'#88eeee',
    w:44,h:56,speed:7.0,jumpF:-13.5,djF:-12.0,weight:0.8,def:1.16,shieldCool:84,
    lDmg:7,hDmg:14,lKB:8,hKB:17,lSU:4,hSU:14,lAct:8,hAct:12,lEl:9,hEl:26,
    lSz:26,lRch:100,hSz:36,hRch:118, maxCombo:3 },
  { id:6,name:'ROCKET',tag:'The Arm Cannon',
    desc:['Launches arms as projectiles','4-arm ammo system','Mines on down heavy'],
    color:'#ff6600',accent:'#993300',eyeCol:'#ffcc00',hi:'#ffaa44',
    w:50,h:62,speed:5.0,jumpF:-12.3,djF:-10.8,weight:1.0,def:1.00,shieldCool:120,
    lDmg:5,hDmg:10,lKB:5,hKB:11,lSU:4,hSU:12,lAct:6,hAct:8,lEl:4,hEl:22,
    lSz:10,lRch:10,hSz:10,hRch:10 },
  { id:8,name:'BLADE',tag:'The Knife Fighter',
    desc:['2-hit jab+knife combo','Side heavy: sword swing+throw','Down heavy: double knife spread'],
    color:'#88bbdd',accent:'#334466',eyeCol:'#cceeff',hi:'#aaccee',
    w:42,h:52,speed:7.5,jumpF:-14.7,djF:-13.2,weight:0.9,def:1.08,shieldCool:96,
    lDmg:4,hDmg:8,lKB:4,hKB:9,lSU:3,hSU:11,lAct:7,hAct:12,lEl:6,hEl:18,
    lSz:38,lRch:72,hSz:56,hRch:105, maxCombo:2 },
  { id:7,name:'UNSTABLE',tag:'The Walking Disaster',
    desc:['Smoke clouds & burn DoT','Self-destruct heavy','High risk, high chaos'],
    color:'#cc2244',accent:'#881122',eyeCol:'#ff8800',hi:'#ff4466',
    w:52,h:60,speed:6.5,jumpF:-12.9,djF:-11.4,weight:0.9,def:1.16,shieldCool:132,
    lDmg:8,hDmg:16,lKB:9,hKB:19,lSU:4,hSU:14,lAct:8,hAct:10,lEl:7,hEl:20,
    lSz:12,lRch:12,hSz:14,hRch:14 },
  { id:10,name:'PRISTINE',tag:'The Aerial Sentinel',
    desc:['Hold W/↑ in air to fly (3s)','Side+Heavy: homing rocket','Down+Heavy: laser shield'],
    color:'#ffffff',accent:'#000000',eyeCol:'#00ffff',hi:'#aaffff',
    w:44,h:56,speed:6.0,jumpF:-13.5,djF:-12.0,weight:1.0,def:0.92,shieldCool:96,
    lDmg:6,hDmg:12,lKB:5,hKB:11,lSU:3,hSU:20,lAct:6,hAct:12,lEl:6,hEl:16,
    lSz:10,lRch:10,hSz:10,hRch:10,
    lightBeamRange:175,beamSpd:14 },
  { id:11,name:'MAGMA',tag:'The Inferno',
    desc:['Hold light: flamethrower (3s fuel)','Side+Heavy: exploding fire pebble','Heavy & hard-hitting'],
    color:'#111111',accent:'#cc2200',eyeCol:'#ff4400',hi:'#442211',
    w:54,h:66,speed:4.5,jumpF:-12.3,djF:-10.8,weight:1.4,def:0.72,shieldCool:132,
    lDmg:3,hDmg:12,lKB:3,hKB:13,lSU:5,hSU:14,lAct:8,hAct:12,lEl:10,hEl:24,
    lSz:12,lRch:12,hSz:14,hRch:14,
    flameFuelMax:90,flameRange:220,flameRechargeRate:0.75 },
  { id:12,name:'FACTORY',tag:'The Manufacturer',
    desc:['Down+Light: launch Bolt minion (5s CD)','Down+Heavy: deploy 3 Zaps (3s CD)','Side+Heavy: spinning drill (1s)'],
    color:'#666666',accent:'#333333',eyeCol:'#00ccff',hi:'#999999',
    w:66,h:80,speed:3.5,jumpF:-11.5,djF:-9.5,weight:1.5,def:0.70,shieldCool:132,
    lDmg:6,hDmg:14,lKB:6,hKB:14,lSU:5,hSU:12,lAct:7,hAct:10,lEl:10,hEl:20,
    lSz:18,lRch:80,hSz:22,hRch:96,
    boltCDMax:300,zapCDMax:180 },
  { id:13,name:'GLITCH',tag:'The Phantom',
    desc:['Side/Up light: teleport arm strike','Down light: phase (2.5s invincibility)','Side heavy: random stolen weapon'],
    color:'#ff88cc',accent:'#cc4488',eyeCol:'#ffffff',hi:'#ffccee',
    w:40,h:50,speed:8.5,jumpF:-14.5,djF:-13.0,weight:0.7,def:1.10,shieldCool:96,
    lDmg:5,hDmg:10,lKB:5,hKB:11,
    lSU:3,hSU:12,lAct:18,hAct:10,lEl:8,hEl:20,
    lSz:24,lRch:70,hSz:30,hRch:30,
    teleArmRange:75 },
  { id:14,name:'KING',tag:'The Royal Guard',
    desc:['Sword + rotating shield (half dmg/KB on shield side)','Down heavy: sword on fire 2s (bonus dmg + burn)','Up heavy: spinning sword whirlwind'],
    color:'#cc1133',accent:'#ffd700',eyeCol:'#ffee44',hi:'#ff5566',
    w:50,h:62,speed:5.5,jumpF:-12.9,djF:-11.4,weight:1.05,def:0.92,shieldCool:120,
    lDmg:7,hDmg:13,lKB:6,hKB:14,
    lSU:5,hSU:14,lAct:8,hAct:12,lEl:9,hEl:22,
    lSz:34,lRch:104,hSz:46,hRch:108,
    kingPokeReach:160,           // side-light poke (long, narrow)
    kingSideHeavySwingReach:84,  // side-heavy swing arc (slightly less than poke)
    kingSideHeavyPokeReach:124,  // side-heavy poke (extends past swing)
    kingSpinReach:96,            // up-heavy spin radius
    kingFireDuration:120,        // 2s sword fire (60fps)
    kingBurnDuration:90 },       // burn applied by flaming sword
];

const DUMMY_CHAR = {
  id:9,name:'DUMMY',tag:'Training Bot',desc:['Stands still','Does not attack','Infinite respawns'],
  color:'#888',accent:'#555',eyeCol:'#aaa',hi:'#aaa',
  w:48,h:58,speed:0,jumpF:0,djF:0,weight:1.0,def:1.0,shieldCool:120,
  lDmg:0,hDmg:0,lKB:0,hKB:0,lSU:99,hSU:99,lAct:1,hAct:1,lEl:99,hEl:99,
  lSz:10,lRch:10,hSz:10,hRch:10
};

// ---- Stages ----
const STAGES = [
  // ---- All stages now obstacle-free open arenas — pure aerial dogfighting ----
  // ground:{x:0,y:2000,w:1000,h:0} = dummy off-screen (no floor — players fly freely)
  // grounds[] and plats[] empty — only enhanced background visuals remain
  { id:0,name:'THE FOUNDRY',desc:'Open skies above the molten forge.',
    bgT:'#1a0500',bgB:'#3d0f00',gCol:'#7a3011',gTop:'#aa4422',gEdge:'#ff6633',
    pCol:'#994422',pTop:'#cc6633',aCol:'#ff4400',
    ground:{x:0,y:2000,w:1000,h:0},grounds:[],plats:[],
    spawnX:[150,850], music:{src:'soundtrack/TheFoundry.mp3',volume:0.5} },
  { id:1,name:'ORBITAL STATION',desc:'Open space above the homeworld.',
    bgT:'#000008',bgB:'#000033',gCol:'#223355',gTop:'#334477',gEdge:'#4466aa',
    pCol:'#334477',pTop:'#4466aa',aCol:'#4488ff',
    ground:{x:0,y:2000,w:1000,h:0},grounds:[],plats:[],
    spawnX:[150,850], music:{src:'soundtrack/OrbitalStation.mp3',volume:0.5} },
  { id:2,name:'SCRAPYARD',desc:'Open skies over the rusted wastes.',
    bgT:'#050a02',bgB:'#0f1a07',gCol:'#3a4a22',gTop:'#4a5a2a',gEdge:'#8ab040',
    pCol:'#445522',pTop:'#556633',aCol:'#88cc33',
    ground:{x:0,y:2000,w:1000,h:0},grounds:[],plats:[],
    spawnX:[150,850], music:{src:'soundtrack/TheScrapyard.mp3',volume:0.5} },
  { id:3,name:'NEON CITY',desc:'Cyberpunk skies bathed in neon rain.',
    bgT:'#050010',bgB:'#110033',gCol:'#222255',gTop:'#4444aa',gEdge:'#aa44ff',
    pCol:'#333366',pTop:'#5555bb',aCol:'#ff44ff',
    ground:{x:0,y:2000,w:1000,h:0},grounds:[],plats:[],
    spawnX:[150,850], music:{src:'soundtrack/Neoncity.mp3',volume:0.5} },
  { id:4,name:'ARCTIC BASE',desc:'Frozen open sky above the tundra.',
    bgT:'#050f1a',bgB:'#0a1e2e',gCol:'#446688',gTop:'#88aabb',gEdge:'#aaccdd',
    pCol:'#557799',pTop:'#99bbcc',aCol:'#00ccff',
    ground:{x:0,y:2000,w:1000,h:0},grounds:[],plats:[],
    spawnX:[150,850], music:{src:'soundtrack/ArcticBase.mp3',volume:0.5} },
  { id:5,name:'CLOUD TEMPLE',desc:'Endless sky above the clouds.',
    bgT:'#4488cc',bgB:'#aaddff',gCol:'#ffffff',gTop:'#eeeeff',gEdge:'#ccddff',
    pCol:'#ddeeff',pTop:'#ffffff',aCol:'#ffdd00',
    ground:{x:0,y:2000,w:1000,h:0},grounds:[],plats:[],
    spawnX:[150,850], music:{src:'soundtrack/CloudTemple.mp3',volume:0.5} },
  { id:6,name:'MOLTEN CORE',desc:'The volcanic skybox above a sea of lava.',
    bgT:'#200500',bgB:'#3d0000',gCol:'#551100',gTop:'#cc3300',gEdge:'#ff4400',
    pCol:'#441100',pTop:'#882200',aCol:'#ff6600',
    ground:{x:0,y:2000,w:1000,h:0},grounds:[],plats:[],
    spawnX:[150,850], music:{src:'soundtrack/MoltenCore.mp3',volume:0.5} },
  { id:7,name:'DATA REALM',desc:'A boundless digital void.',
    bgT:'#000000',bgB:'#000a00',gCol:'#003300',gTop:'#006600',gEdge:'#00ff00',
    pCol:'#001a00',pTop:'#003300',aCol:'#00ff88',
    ground:{x:0,y:2000,w:1000,h:0},grounds:[],plats:[],
    spawnX:[150,850], music:{src:'soundtrack/DataRealm.mp3',volume:0.5} },
  { id:8,name:'THE CARNIVAL',desc:'Open skies above the carnival lights.',
    bgT:'#050215',bgB:'#110830',gCol:'#2a1050',gTop:'#4a1a88',gEdge:'#aa55ff',
    pCol:'#cc2244',pTop:'#ff4466',aCol:'#ffdd00',
    ground:{x:0,y:2000,w:1000,h:0},grounds:[],plats:[],
    spawnX:[150,850], music:{src:'soundtrack/TheCarnival.mp3',volume:0.5} },
  { id:9,name:'THE JUNGLE',desc:'Open skies above the canopy.',
    bgT:'#020d01',bgB:'#071508',gCol:'#1a3a0a',gTop:'#2a5510',gEdge:'#55aa22',
    pCol:'#3d2208',pTop:'#6b4010',aCol:'#88ff33',
    ground:{x:0,y:2000,w:1000,h:0},grounds:[],plats:[],
    spawnX:[150,850], music:{src:'soundtrack/TheJungle.mp3',volume:0.5} },
  { id:10,name:'SKY TEMPLE',desc:'Sky temple ruins drifting through the clouds.',
    bgT:'#0a1530',bgB:'#152245',gCol:'#5a4a28',gTop:'#8a7248',gEdge:'#ffcc44',
    pCol:'#5a4a28',pTop:'#8a7248',aCol:'#ffcc44',
    ground:{x:0,y:2000,w:1000,h:0},grounds:[],plats:[],
    spawnX:[150,850], music:{src:'soundtrack/SkyTemple.mp3',volume:0.5} },
  { id:11,name:'NEO CITY',desc:'Open skies above the gleaming megacity.',
    bgT:'#010a0d',bgB:'#011820',gCol:'#0d2a35',gTop:'#1a4a5a',gEdge:'#00e5ff',
    pCol:'#0d2a35',pTop:'#1a4a5a',aCol:'#00e5ff',
    ground:{x:0,y:2000,w:1000,h:0},grounds:[],plats:[],
    spawnX:[150,850], music:{src:'soundtrack/NeoCity.mp3',volume:0.5} },
];

// ---- Particles / Shake ----
const particles=[];
let shakeX=0,shakeY=0;
function addDeathExplosion(x,y){
  // Big visual-only burst — no damage
  for(let i=0;i<30;i++){
    const a=Math.random()*Math.PI*2,s=6+Math.random()*12;
    const cols=['#ffee00','#ff8800','#ff2200','#ffffff'];
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,life:40,max:40,col:cols[Math.floor(Math.random()*cols.length)],sz:3+Math.random()*5});
  }
  for(let i=0;i<12;i++){
    const a=(i/12)*Math.PI*2,s=18;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:14,max:14,col:'#ffffff',sz:3});
  }
  // Shockwave ring stored as a special particle
  particles.push({x,y,vx:0,vy:0,life:18,max:18,col:'#ffaa00',sz:8,ring:true,ringR:0});
  shakeX+=(Math.random()-.5)*22; shakeY+=(Math.random()-.5)*22;
}
function instakill(target,x,y){
  addDeathExplosion(x,y);
  target.die();
}
function addHitParticles(x,y,color,heavy) {
  const n=heavy?14:8;
  for (let i=0;i<n;i++) {
    const a=Math.random()*Math.PI*2,s=heavy?(4+Math.random()*6):(2+Math.random()*4);
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,life:heavy?28:18,max:heavy?28:18,col:color,sz:heavy?(3+Math.random()*4):(1.5+Math.random()*2.5)});
  }
  for (let i=0;i<(heavy?5:3);i++) {
    const a=(i/(heavy?5:3))*Math.PI*2,s=heavy?9:6;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:10,max:10,col:'#ffffff',sz:2});
  }
  shakeX+=(Math.random()-.5)*(heavy?14:6); shakeY+=(Math.random()-.5)*(heavy?14:6);
}
function updateParticles() {
  for (let i=particles.length-1;i>=0;i--) {
    const p=particles[i]; p.x+=p.vx; p.y+=p.vy; p.vx*=0.88; p.vy=p.vy*0.88+0.15; p.life--;
    if (p.life<=0) particles.splice(i,1);
  }
  shakeX*=0.72; shakeY*=0.72;
  if (Math.abs(shakeX)<0.5) shakeX=0; if (Math.abs(shakeY)<0.5) shakeY=0;
}
function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha=p.life/p.max;
    if(p.ring){
      const r=p.ringR+(1-p.life/p.max)*110;
      ctx.strokeStyle=p.col; ctx.lineWidth=3*(p.life/p.max);
      ctx.shadowBlur=18; ctx.shadowColor=p.col;
      ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.stroke();
      ctx.shadowBlur=0;
    } else {
      ctx.fillStyle=p.col; ctx.beginPath(); ctx.arc(p.x,p.y,p.sz*(p.life/p.max),0,Math.PI*2); ctx.fill();
    }
  }
  ctx.globalAlpha=1;
}

// ---- Helpers ----
function rrPath(x,y,w,h,r) {
  r=Math.min(r,w/2,h/2); ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}
function rrFill(x,y,w,h,r,c){rrPath(x,y,w,h,r);ctx.fillStyle=c;ctx.fill();}
function rrStroke(x,y,w,h,r,c,lw){rrPath(x,y,w,h,r);ctx.strokeStyle=c;ctx.lineWidth=lw;ctx.stroke();}
function aabb(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}

// ---- Attack Arc Effects ----
function drawAttackArc(atk,ch,w,h) {
  if (!atk) return;
  if (ch.id===6) return; // ROCKET uses arm projectile visuals
  if (ch.id===7) return; // UNSTABLE visuals drawn in drawUnstable
  if (ch.id===8) return; // BLADE visuals drawn in drawBlade
  if (ch.id===11) return; // MAGMA visuals drawn in drawMagma
  if (ch.id===12) return; // FACTORY visuals drawn in drawFactory
  if (ch.id===13) return; // GLITCH visuals drawn in drawGlitch
  if (ch.id===14) return; // KING visuals drawn in drawKing
  const heavy=atk.type==='heavy';
  const inSU=atk.frame<atk.su;
  const inAct=atk.frame>=atk.su&&atk.frame<atk.su+atk.act;
  if (!inSU&&!inAct) return;
  const tSU=atk.frame/Math.max(atk.su,1);
  if (ch.id===10) { // PRISTINE: muzzle flash during startup
    if(inSU){
      const mx=w*0.5+14, my=h*0.36-h*0.5;
      ctx.fillStyle=ch.eyeCol; ctx.globalAlpha=tSU*0.8;
      ctx.shadowBlur=18; ctx.shadowColor=ch.eyeCol;
      ctx.beginPath(); ctx.arc(mx,my,5+tSU*5,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0; ctx.globalAlpha=1;
    }
    return;
  }
  const tAct=(atk.frame-atk.su)/Math.max(atk.act,1);
  const color=heavy?'#ff8800':ch.color, color2='#ffffff';
  ctx.save();

  if (ch.id===3) { // BLASTER: muzzle flash + beam
    if (inAct) {
      const fade=1-tAct*0.6;
      const mx=w*0.5+22, my=h*0.36-h*0.5;
      ctx.globalAlpha=fade; ctx.strokeStyle=ch.eyeCol;
      ctx.shadowBlur=20; ctx.shadowColor=ch.eyeCol; ctx.lineCap='round';
      if(heavy&&atk.dir!=='up'&&atk.dir!=='down'){
        // 3-shot rapid fire: 3 staggered beams
        ctx.lineWidth=5;
        for(let s=0;s<3;s++){
          const yOff=(s-1)*6;
          ctx.globalAlpha=fade*Math.max(0,1-tAct*2+s*0.4)*0.9;
          ctx.beginPath(); ctx.moveTo(mx,my+yOff); ctx.lineTo(mx+220,my+yOff); ctx.stroke();
        }
        ctx.fillStyle=ch.eyeCol; ctx.globalAlpha=fade*(1-tAct)*0.9;
        ctx.shadowBlur=22; ctx.beginPath(); ctx.arc(mx,my,11,0,Math.PI*2); ctx.fill();
      } else if(heavy&&atk.dir==='up'){
        // Triangle spread: 3 diverging beams
        const bl=180;
        ctx.lineWidth=5; ctx.globalAlpha=fade*0.85;
        ctx.beginPath(); ctx.moveTo(mx,my); ctx.lineTo(mx-bl*0.3,my-bl); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(mx,my); ctx.lineTo(mx,my-bl); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(mx,my); ctx.lineTo(mx+bl*0.3,my-bl); ctx.stroke();
        ctx.fillStyle=ch.eyeCol; ctx.globalAlpha=fade*(1-tAct)*0.8;
        ctx.shadowBlur=22; ctx.beginPath(); ctx.arc(mx,my,10,0,Math.PI*2); ctx.fill();
      } else if(heavy&&atk.dir==='down'){
        // Rocket jump exhaust burst below
        ctx.lineWidth=7; ctx.globalAlpha=fade*0.8;
        ctx.beginPath(); ctx.moveTo(0,h*0.15); ctx.lineTo(0,h*0.15+90); ctx.stroke();
        ctx.fillStyle=ch.eyeCol; ctx.globalAlpha=fade*0.5;
        ctx.shadowBlur=28; ctx.beginPath(); ctx.arc(0,h*0.25,20,0,Math.PI*2); ctx.fill();
      } else {
        // Light beam
        const beamLen=140;
        ctx.lineWidth=4;
        let bx2=mx,by2=my,ex=mx,ey=my;
        if(atk.dir==='up'){by2=my-4;ey=my-beamLen*0.85;ctx.beginPath();ctx.moveTo(bx2,by2);ctx.lineTo(ex,ey);ctx.stroke();}
        else if(atk.dir==='down'){by2=my+4;ey=my+beamLen*0.75;ctx.beginPath();ctx.moveTo(bx2,by2);ctx.lineTo(ex,ey);ctx.stroke();}
        else{ex=mx+beamLen;ey=my;ctx.beginPath();ctx.moveTo(bx2,by2);ctx.lineTo(ex,ey);ctx.stroke();}
        ctx.fillStyle=ch.eyeCol; ctx.globalAlpha=fade*(1-tAct)*0.9;
        ctx.shadowBlur=18; ctx.beginPath(); ctx.arc(mx,my,8,0,Math.PI*2); ctx.fill();
      }
    }
    if (heavy&&inSU) {
      const maxR=w*0.9, r=maxR*tSU;
      // pulsing outer ring
      const pulse=Math.sin(tSU*Math.PI*8)*0.15+0.85;
      ctx.strokeStyle=ch.eyeCol; ctx.lineWidth=1+tSU*4; ctx.globalAlpha=tSU*0.55*pulse;
      ctx.beginPath(); ctx.arc(w*0.3,0,r*1.35,0,Math.PI*2); ctx.stroke();
      ctx.lineWidth=1; ctx.globalAlpha=tSU*0.3*pulse;
      ctx.beginPath(); ctx.arc(w*0.3,0,r*1.65,0,Math.PI*2); ctx.stroke();
      // inner glow ball
      const g=ctx.createRadialGradient(w*0.3,0,0,w*0.3,0,r+2);
      g.addColorStop(0,'#ffffff'); g.addColorStop(0.25,ch.eyeCol+'ff'); g.addColorStop(1,ch.eyeCol+'00');
      ctx.fillStyle=g; ctx.globalAlpha=tSU*0.95;
      ctx.beginPath(); ctx.arc(w*0.3,0,r,0,Math.PI*2); ctx.fill();
      // orbiting sparks
      if(tSU>0.15){
        ctx.fillStyle=ch.eyeCol; ctx.globalAlpha=tSU;
        for(let i=0;i<4;i++){
          const a=frame*0.18+i*Math.PI*0.5, orb=r*0.55+8;
          ctx.beginPath(); ctx.arc(Math.cos(a)*orb+w*0.3,Math.sin(a)*orb,1.5+tSU*2.5,0,Math.PI*2); ctx.fill();
        }
      }
    }
  } else if (ch.id===4) { // EDGE: sword slash arcs
    if(inSU&&heavy&&atk.dir==='side'){
      // Charge-up glow: sword energising before the swing
      const prog=atk.frame/Math.max(atk.su,1);
      ctx.save();
      ctx.shadowBlur=8+prog*24; ctx.shadowColor=ch.color;
      ctx.strokeStyle=ch.color; ctx.lineWidth=3+prog*6; ctx.lineCap='round';
      ctx.globalAlpha=0.3+prog*0.6;
      // Sword blade growing in reach direction
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(80*prog,0); ctx.stroke();
      // Expanding energy ring
      ctx.strokeStyle=ch.eyeCol; ctx.lineWidth=2; ctx.globalAlpha=prog*0.5;
      ctx.beginPath(); ctx.arc(0,0,40*prog,0,Math.PI*2); ctx.stroke();
      ctx.shadowBlur=0; ctx.restore();
    }
    if (inAct) {
      const fade=1-tAct*0.45;
      ctx.globalAlpha=fade; ctx.lineCap='round'; ctx.shadowColor=ch.color;
      if(heavy){
        ctx.shadowBlur=28; ctx.strokeStyle=ch.color;
        if(atk.dir==='side'){
          // Overhead swing: dynamic arc sweeping top to bottom
          const reach=80, ang=-Math.PI*0.75+tAct*Math.PI*1.5;
          ctx.lineWidth=10;
          ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(ang)*reach,Math.sin(ang)*reach); ctx.stroke();
          ctx.lineWidth=5; ctx.globalAlpha=fade*0.4;
          ctx.beginPath(); ctx.arc(reach*0.28,0,reach*0.88,-Math.PI*0.8,Math.PI*0.8); ctx.stroke();
        } else if(atk.dir==='down'){
          // Dive: energy trail below
          ctx.lineWidth=8;
          ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,h); ctx.stroke();
          ctx.strokeStyle=ch.eyeCol; ctx.lineWidth=5; ctx.globalAlpha=fade*0.55;
          ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,h*0.7); ctx.stroke();
        } else if(atk.dir==='up'){
          // Up throw: release glow
          ctx.strokeStyle=ch.eyeCol; ctx.lineWidth=3; ctx.globalAlpha=fade*0.45;
          ctx.beginPath(); ctx.arc(0,-h*0.45,28,0,Math.PI*2); ctx.stroke();
        }
      } else {
        // Light combos (unchanged)
        const cn=atk.comboN||1;
        const reach=cn===3?53:cn===2?88:72;
        ctx.shadowBlur=cn===3?28:18;
        ctx.strokeStyle=ch.color; ctx.lineWidth=cn===3?10:cn===2?7:5;
        if (atk.dir==='up') {
          ctx.beginPath(); ctx.arc(0,-h*0.1,reach*0.72,-Math.PI*0.85+cn*0.1,-Math.PI*0.15-cn*0.1); ctx.stroke();
          if (cn===3) { ctx.lineWidth=5; ctx.globalAlpha=fade*0.5; ctx.beginPath(); ctx.arc(0,-h*0.05,reach*1.0,-Math.PI*0.9,-0.1); ctx.stroke(); }
        } else if (atk.dir==='down') {
          ctx.beginPath(); ctx.arc(0,h*0.1,reach*0.72,Math.PI*0.15+cn*0.05,Math.PI*0.85-cn*0.05); ctx.stroke();
          if (cn===3) { ctx.lineWidth=5; ctx.globalAlpha=fade*0.5; ctx.beginPath(); ctx.arc(0,h*0.05,reach*1.0,0.1,Math.PI-0.1); ctx.stroke(); }
        } else {
          const startA=cn===2?0.5:-0.7, endA=cn===2?-0.5:0.7;
          ctx.beginPath(); ctx.arc(reach*0.35,0,reach*0.72,startA,endA); ctx.stroke();
          if (cn===3) {
            ctx.lineWidth=6; ctx.globalAlpha=fade*0.5;
            ctx.beginPath(); ctx.arc(reach*0.25,0,reach*1.0,-1.0,1.0); ctx.stroke();
            ctx.lineWidth=3; ctx.globalAlpha=fade*0.7;
            for (let i=0;i<6;i++) { const a=(i/6)*Math.PI*2; ctx.strokeStyle=ch.hi; ctx.beginPath(); ctx.moveTo(Math.cos(a)*20,Math.sin(a)*20); ctx.lineTo(Math.cos(a)*reach*0.9,Math.sin(a)*reach*0.9); ctx.stroke(); }
          }
        }
      }
    }
  } else if (ch.id===5) { // PIERCE: spear thrust trail
    if (inAct) {
      const fade=1-tAct*0.5, reach=ch.hRch;
      ctx.globalAlpha=fade; ctx.lineCap='round';
      ctx.shadowBlur=16; ctx.shadowColor=ch.eyeCol;
      ctx.strokeStyle=ch.eyeCol; ctx.lineWidth=heavy?8:5;
      if(heavy&&atk.dir==='down'){
        // Spinning sweep: ring + spinning spear line
        const r=reach*0.75, spinAng=tAct*Math.PI*2;
        ctx.lineWidth=10; ctx.globalAlpha=fade*0.65;
        ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.stroke();
        ctx.lineWidth=22; ctx.globalAlpha=fade*0.2;
        ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.stroke();
        ctx.globalAlpha=fade; ctx.lineWidth=7; ctx.shadowBlur=22;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(spinAng)*r,Math.sin(spinAng)*r); ctx.stroke();
        ctx.fillStyle=ch.eyeCol; ctx.globalAlpha=fade*0.9;
        ctx.shadowBlur=20; ctx.beginPath(); ctx.arc(Math.cos(spinAng)*r,Math.sin(spinAng)*r,8,0,Math.PI*2); ctx.fill();
      } else if (atk.dir==='up') {
        ctx.beginPath(); ctx.moveTo(0,-h*0.1); ctx.lineTo(0,-reach*0.85); ctx.stroke();
        ctx.strokeStyle=ch.color; ctx.lineWidth=heavy?4:3; ctx.globalAlpha=fade*0.5;
        for (let i=1;i<=3;i++) { ctx.beginPath(); ctx.moveTo(i*8-12,-h*0.15); ctx.lineTo(i*6-10,-reach*0.8); ctx.stroke(); }
      } else if (atk.dir==='down') {
        ctx.beginPath(); ctx.moveTo(0,h*0.2); ctx.lineTo(0,reach*0.8); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(w*0.2,0); ctx.lineTo(reach*0.88,0); ctx.stroke();
        ctx.strokeStyle=ch.color; ctx.lineWidth=heavy?4:2; ctx.globalAlpha=fade*0.5;
        for (let i=1;i<=3;i++) { ctx.beginPath(); ctx.moveTo(w*0.1,i*7-12); ctx.lineTo(reach*0.8,i*5-10); ctx.stroke(); }
      }
    }
  } else { // default (BOLT, CRUSHER, ZIPPY)
    if (heavy&&inSU) {
      const g=ctx.createRadialGradient(0,0,4,0,0,w*0.9*tSU);
      g.addColorStop(0,color+'cc'); g.addColorStop(1,color+'00');
      ctx.fillStyle=g; ctx.globalAlpha=tSU*0.7;
      ctx.beginPath(); ctx.arc(0,0,w*0.9*tSU,0,Math.PI*2); ctx.fill();
    }
    if (inAct) {
      const fade=1-tAct*0.55; ctx.globalAlpha=fade;
      ctx.shadowBlur=heavy?20:12; ctx.shadowColor=color;
      const reach=heavy?(ch.hRch||80):(ch.lRch||60), sz=heavy?(ch.hSz||62):(ch.lSz||44);
      ctx.strokeStyle=color; ctx.lineCap='round';
      if (atk.dir==='side') {
        ctx.lineWidth=heavy?9:6; ctx.beginPath(); ctx.arc(reach*0.38,0,reach*0.72,-0.75,0.75); ctx.stroke();
        ctx.strokeStyle=color2; ctx.lineWidth=heavy?5:3; ctx.globalAlpha=fade*0.5;
        ctx.beginPath(); ctx.arc(reach*0.25,0,reach*1.05,-0.95,0.95); ctx.stroke();
        ctx.globalAlpha=fade*0.8; ctx.lineWidth=heavy?3:2; ctx.strokeStyle=color2;
        for (let i=-1;i<=1;i++) { ctx.beginPath(); ctx.moveTo(4,i*sz*0.22); ctx.lineTo(reach*0.82,i*sz*0.12); ctx.stroke(); }
      } else if (atk.dir==='up') {
        ctx.lineWidth=heavy?9:6; ctx.beginPath(); ctx.arc(0,-h*0.15,reach*0.68,-Math.PI*0.9,-Math.PI*0.1); ctx.stroke();
        ctx.strokeStyle=color2; ctx.lineWidth=heavy?5:3; ctx.globalAlpha=fade*0.5;
        ctx.beginPath(); ctx.arc(0,-h*0.1,reach*0.9,-Math.PI+0.25,-0.25); ctx.stroke();
      } else if (atk.dir==='down') {
        ctx.lineWidth=heavy?9:6; ctx.beginPath(); ctx.arc(0,h*0.15,reach*0.68,Math.PI*0.1,Math.PI*0.9); ctx.stroke();
        ctx.strokeStyle=color2; ctx.lineWidth=heavy?5:3; ctx.globalAlpha=fade*0.5;
        ctx.beginPath(); ctx.arc(0,h*0.1,reach*0.9,0.25,Math.PI-0.25); ctx.stroke();
      } else {
        ctx.lineWidth=heavy?9:6; ctx.beginPath(); ctx.arc(reach*0.3,0,reach*0.5,-Math.PI*0.5,Math.PI*0.5); ctx.stroke();
        ctx.strokeStyle=color2; ctx.lineWidth=heavy?5:3; ctx.globalAlpha=fade*0.45;
        ctx.beginPath(); ctx.arc(reach*0.22,0,reach*0.68,-Math.PI*0.65,Math.PI*0.65); ctx.stroke();
      }
    }
  }
  ctx.restore();
}

// ---- Player Class ----
// Flight-mode physics: no gravity. Hold a direction = thrust acceleration. Release = drift.
const FLY_ACCEL=0.55, MAX_FLY_SPEED=14, FLY_FRIC=0.985;
const GRAB_RANGE=50, GRAB_LOCKOUT_FRAMES=60, GRAB_AUTO_RELEASE_FRAMES=120, GRAB_WHIFF_CD=24;
const SHIELD_FRAMES=15,SHIELD_COOLDOWN=120;
const DASH_FRAMES=9,DASH_COOLDOWN=38,DASH_MULT=5.2;
const MAX_KB=20; // velocity cap to prevent extreme-speed bug
const DEATH_THRESHOLD=150; // damage % at which next hit instakills
const OFF_SCREEN_KILL_FRAMES=60; // ~1 second off-screen = death
// Visible world rect (camera applies scale 0.692,0.9 about screen center, so visible world > canvas)
const CAM_SCALE_X=0.692, CAM_SCALE_Y=0.9;
const VIS_LEFT  = (0 - W/2)/CAM_SCALE_X + W/2;       // ≈ -222
const VIS_RIGHT = (W - W/2)/CAM_SCALE_X + W/2;       // ≈ 1222
const VIS_TOP   = (0 - H/2)/CAM_SCALE_Y + H/2;       // ≈ -33
const VIS_BOT   = (H - H/2)/CAM_SCALE_Y + H/2;       // ≈ 633
// Boulder + small rocks
const BOULDER_RADIUS=75;          // boulder circle radius (visual diameter 150px)
const SMALL_ROCK_RADIUS=25;       // small rock radius (~robot-sized)
const SMALL_ROCK_DMG=20;          // fixed thrown-rock damage (% — applies def multiplier)
const THROW_BOOST=10;             // velocity boost added to holder's vel on throw
const THROW_FORWARD_SPEED=14;     // throw speed when holder is stationary

class Player {
  constructor(ch,spawnX,pn,isDummy=false) {
    this.ch=ch; this.pn=pn; this.isDummy=isDummy; this.spawnX=spawnX;
    this.w=ch.w; this.h=ch.h; this.x=spawnX-ch.w/2; this.y=150;
    this.vx=0; this.vy=0; this.facing=pn===1?1:-1;
    this.onGnd=false; this.onPlat=false; this.jLeft=2;
    this.damage=0; this.stocks=isDummy?99:3;
    this.atk=null; this.atkCD=0; this.hstun=0; this.hitlag=0;
    this.dropPlat=null; this.dropTimer=0;
    this.hitFlash=0; this.dead=false; this.respawnT=0;
    this.wf=0; this.wt=0;
    // Shield
    this.shieldActive=false; this.shieldTimer=0; this.shieldCooldown=0;
    // Combo
    this.comboPend=false;
    // Dash
    this.dashActive=false; this.dashTimer=0; this.dashCD=0;
    // Charge heavy
    this.charging=false; this.chargeTime=0; this.chargeDir='side';
    // CRUSHER heavy cooldowns
    this.crusherSideHeavyCD=0; this.crusherUpHeavyCD=0; this.crusherDownHeavyCD=0;
    // ROCKET arm ammo + cooldowns
    this.armsLeft=4; this.rocketLightCD=0; this.rocketSideHeavyCD=0; this.rocketUpHeavyCD=0;
    // Status effects
    this.burnTimer=0; this.burnTick=0; this.hitImmune=0;
    // PRISTINE flight
    this.flyActive=false; this.flyTimer=180; this.flyCooldown=0; this.flyMaxCool=180;
    // PRISTINE laser shield
    this.laserShieldActive=false; this.laserShieldTimer=0;
    // PRISTINE rocket cooldown (blocks only side heavy re-fire)
    this.pristineRocketCd=0;
    // MAGMA flamethrower fuel
    this.magmaFuel=ch.flameFuelMax||180;
    // FACTORY attack cooldowns
    this.factoryBoltCD=0; this.factoryZapCD=0;
    // GLITCH phase/ghost state
    this.glitchPhaseTimer=0; this.glitchGhost=false; this.glitchWeapon=null;
    // KING shield angle (radians; 0=right, world frame, doesn't flip with facing) + sword fire
    this.kingShieldAngle=0; this.kingShieldRotateT=0; this.kingShieldRotateFrom=0; this.kingShieldRotateTo=0;
    this.kingFireTimer=0;
    // Grab state (flight-mode wrestling): grabbing=opponent ref while grabber holds them;
    // grabbedBy=opponent ref while this player is held; grabT=elapsed frames in grab;
    // grabWhiffT=frames left of whiff cooldown after pressing grab with no target.
    this.grabbing=null; this.grabbedBy=null; this.grabT=0; this.grabWhiffT=0;
    // Held small rock (after grabbing one off the stage)
    this.heldRock=null;
    // Off-screen kill timer (camera-based KO for flight mode)
    this.offScreenTimer=0;
    // Team and input (set after construction in startGame)
    this.team=0; this.localInputSlot=1;
  }
  get cx(){return this.x+this.w/2;} get cy(){return this.y+this.h/2;}
  get right(){return this.x+this.w;} get bottom(){return this.y+this.h;}

  atkDir(inp) {
    if(this.localInputSlot===1){
      const phSide1=keys['_ph1L']||keys['_ph1R'];
      if(keys['KeyW']||keys['_gp1U']||(keys['_ph1U']&&!phSide1))   return 'up';
      if(keys['KeyS']||keys['_gp1D']||(keys['_ph1D']&&!phSide1))   return 'down';
      if(keys['KeyA']||keys['KeyD']||keys['_gp1L']||keys['_gp1R']||phSide1) return 'side';
    } else if(this.localInputSlot===2){
      const phSide2=keys['_ph2L']||keys['_ph2R'];
      if(keys['ArrowUp']||keys['_gp2U']||(keys['_ph2U']&&!phSide2))    return 'up';
      if(keys['ArrowDown']||keys['_gp2D']||(keys['_ph2D']&&!phSide2))  return 'down';
      if(keys['ArrowLeft']||keys['ArrowRight']||keys['_gp2L']||keys['_gp2R']||phSide2) return 'side';
    } else if(this.localInputSlot===3){
      const phSide3=keys['_ph3L']||keys['_ph3R'];
      if(keys['_ph3U']&&!phSide3) return 'up';
      if(keys['_ph3D']&&!phSide3) return 'down';
      if(phSide3) return 'side';
    } else if(this.localInputSlot===4){
      const phSide4=keys['_ph4L']||keys['_ph4R'];
      if(keys['_ph4U']&&!phSide4) return 'up';
      if(keys['_ph4D']&&!phSide4) return 'down';
      if(phSide4) return 'side';
    } else if(inp){
      // Remote player — derive from network input
      if(inp.up&&!inp.left&&!inp.right)   return 'up';
      if(inp.down&&!inp.left&&!inp.right) return 'down';
      if(inp.left||inp.right) return 'side';
    }
    return 'neutral';
  }

  update(inp,st,opps) {
    const opp=opps&&opps.find(p=>!p.dead)||null;
    if (this.dead){this.respawnT--;if(this.respawnT<=0)this.doRespawn();return;}
    if (this.hitFlash>0) this.hitFlash--;
    if (this.hitImmune>0) this.hitImmune--;
    if (this.burnTimer>0){this.burnTimer--;this.burnTick++;if(this.burnTick>=30){this.burnTick=0;if(this.damage>=DEATH_THRESHOLD&&!this.isDummy){instakill(this,this.cx,this.cy);}else{this.damage+=2;this.hitFlash=8;}}}
    if (this.atkCD>0)    this.atkCD--;
    if (this.dropTimer>0){this.dropTimer--;if(!this.dropTimer)this.dropPlat=null;}
    if (this.grabWhiffT>0) this.grabWhiffT--;
    if (this.hitlag>0){this.hitlag--;return;}
    if (this.hstun>0){this.hstun--;if(this.charging){this.charging=false;this.chargeTime=0;}}

    // ===== GRAB SYSTEM =====
    // If the player got knocked into hitstun this frame (or a projectile pushed velocity), break grabs.
    // hstun > 0 is a strong signal of a hit landing.
    if ((this.grabbing||this.grabbedBy)&&this.hstun>0){
      if (this.grabbing){this.grabbing.grabbedBy=null;this.grabbing.grabT=0;this.grabbing=null;}
      if (this.grabbedBy){this.grabbedBy.grabbing=null;this.grabbedBy.grabT=0;this.grabbedBy=null;}
      this.grabT=0;
    }
    // Resolve broken grabs (partner died/respawned without clearing on us)
    if (this.grabbing&&(this.grabbing.dead||this.grabbing.grabbedBy!==this)) {this.grabbing=null;this.grabT=0;}
    if (this.grabbedBy&&(this.grabbedBy.dead||this.grabbedBy.grabbing!==this)) {this.grabbedBy=null;this.grabT=0;}
    // Drop held rock if it died (e.g. went off-screen while held — defensive)
    if(this.heldRock&&this.heldRock.dead) this.heldRock=null;
    // Grab initiation (only the grabber's side runs this)
    if (inp.grab&&!this.grabbing&&!this.grabbedBy&&!this.isDummy&&!this.shieldActive&&this.hstun===0&&this.grabWhiffT===0&&!this.atk) {
      // Branch 1: holding a rock → throw it (grab again toggles throw)
      if(this.heldRock){
        const r=this.heldRock;
        let bvx=this.vx, bvy=this.vy;
        const sp=Math.hypot(bvx,bvy);
        if(sp>0.5){
          bvx += (bvx/sp)*THROW_BOOST;
          bvy += (bvy/sp)*THROW_BOOST;
        } else {
          // Standing still: throw forward in facing direction
          bvx = this.facing*THROW_FORWARD_SPEED; bvy=0;
        }
        r.vx=bvx; r.vy=bvy; r.thrown=true; r.heldBy=null;
        r.lastOwner=this; r.lastOwnerImmuneT=8;
        r.trail=[];
        this.heldRock=null;
        playSfx({freq:480,freq2:200,type:'square',decay:0.1,vol:0.16});
      } else {
        // Branch 2: try to grab an opponent (existing logic, takes priority)
        let target=null;
        if(opps) for(const p of opps){
          if(p===this||p.dead) continue;
          if(this.team>0&&p.team===this.team) continue;
          if(p.grabbedBy||p.grabbing) continue;
          if(p.shieldActive||p.hitImmune>0) continue;
          const dx=p.cx-this.cx, dy=p.cy-this.cy;
          if(Math.hypot(dx,dy)<=GRAB_RANGE){target=p;break;}
        }
        if(target){
          this.grabbing=target; target.grabbedBy=this;
          this.grabT=0; target.grabT=0;
          this.vx=this.vy=0; target.vx=target.vy=0;
          target.atk=null; target.charging=false; target.chargeTime=0;
          // Face each other
          this.facing = target.cx>this.cx?1:-1;
          target.facing = this.cx>target.cx?1:-1;
          playSfx({freq:520,freq2:200,type:'square',decay:0.1,vol:0.18});
        } else {
          // Branch 3: try to pick up a small rock
          let pickedRock=null;
          for(const r of smallRocks){
            if(r.dead||r.heldBy||r.thrown) continue;
            const dx=r.x-this.cx, dy=r.y-this.cy;
            if(Math.hypot(dx,dy)<=GRAB_RANGE){pickedRock=r; break;}
          }
          if(pickedRock){
            this.heldRock=pickedRock; pickedRock.heldBy=this;
            pickedRock.vx=0; pickedRock.vy=0; pickedRock.thrown=false;
            playSfx({freq:600,freq2:300,type:'square',decay:0.08,vol:0.12});
          } else {
            // Whiff: brief reach animation + cooldown
            this.grabWhiffT=GRAB_WHIFF_CD;
            playSfx({freq:300,freq2:160,type:'sawtooth',decay:0.08,vol:0.10});
          }
        }
      }
    }
    // Grab tick: increment timer, freeze in place, handle escape/auto-release
    if (this.grabbing||this.grabbedBy){
      this.grabT++;
      this.vx=0; this.vy=0;
      // Auto-release after 2 seconds
      if (this.grabT>=GRAB_AUTO_RELEASE_FRAMES){
        if (this.grabbing){this.grabbing.grabbedBy=null;this.grabbing.grabT=0;this.grabbing=null;}
        if (this.grabbedBy){this.grabbedBy.grabbing=null;this.grabbedBy.grabT=0;this.grabbedBy=null;}
        this.grabT=0;
      }
      // The grabbed player can dash to escape AFTER 1s lockout
      else if (this.grabbedBy&&this.grabT>=GRAB_LOCKOUT_FRAMES&&inp.dash&&this.dashCD===0){
        const other=this.grabbedBy;
        other.grabbing=null;other.grabT=0;
        this.grabbedBy=null;this.grabT=0;
        // Trigger an escape dash (8-directional from input)
        this.dashActive=true; this.dashTimer=DASH_FRAMES;
        const ds=this.ch.speed*DASH_MULT;
        let dx=(inp.right?1:0)-(inp.left?1:0);
        let dy=(inp.down?1:0)-(inp.up?1:0);
        if(dx===0&&dy===0) dx=-this.facing; // default: dash backward away from grabber
        const len=Math.hypot(dx,dy)||1;
        this.vx=(dx/len)*ds; this.vy=(dy/len)*ds;
        playSfx({freq:700,freq2:300,type:'square',decay:0.1,vol:0.16});
      }
    }
    // Suppress inputs based on grab state
    if (this.grabbedBy){
      // Grabbed: full lockout for 1s, then only dash works (handled above)
      inp = {...inp, left:false,right:false,up:false,down:false,
             light:false,heavy:false,heavyHeld:false,heavyRelease:false,lightHeld:false,
             shield:false,grab:false,
             dash: this.grabT>=GRAB_LOCKOUT_FRAMES?inp.dash:false};
    } else if (this.grabbing){
      // Grabber: can attack but can't move/dash/shield/grab-again
      inp = {...inp, left:false,right:false,up:false,down:false,
             dash:false,shield:false,grab:false};
    }

    // Shield activation
    if (inp.shield&&!this.shieldActive&&this.shieldCooldown===0&&this.hstun===0&&!this.isDummy) {
      this.shieldActive=true; this.shieldTimer=SHIELD_FRAMES;
      this.atk=null; this.comboPend=false; this.charging=false; this.chargeTime=0;
    }
    if (this.shieldActive) {
      this.shieldTimer--;
      if (this.shieldTimer<=0){this.shieldActive=false;this.shieldCooldown=this.ch.shieldCool??SHIELD_COOLDOWN;}
    }
    if (this.shieldCooldown>0) this.shieldCooldown--;

    const free=this.hstun===0&&!this.isDummy&&!this.shieldActive;
    const inAtk=this.atk&&this.atk.frame<this.atk.su+this.atk.act;

    // Dash system (8-directional aerial boost)
    if(this.dashCD>0) this.dashCD--;
    if(inp.dash&&!this.dashActive&&this.dashCD===0&&free&&!this.atk&&!this.charging){
      this.dashActive=true; this.dashTimer=DASH_FRAMES;
      const ds=this.ch.speed*DASH_MULT;
      let dx=(inp.right?1:0)-(inp.left?1:0);
      let dy=(inp.down?1:0)-(inp.up?1:0);
      if(dx===0&&dy===0) dx=this.facing; // default: forward dash
      const len=Math.hypot(dx,dy)||1;
      this.vx=(dx/len)*ds; this.vy=(dy/len)*ds;
      if(dx!==0&&!inAtk) this.facing=dx>0?1:-1;
    }
    if(this.dashActive){this.dashTimer--;this.vx*=0.88;this.vy*=0.88;if(this.dashTimer<=0){this.dashActive=false;this.dashCD=DASH_COOLDOWN;}}

    // Flight movement: thrust on held direction, momentum drift otherwise
    if(free&&!this.dashActive&&!this.charging){
      if(inp.left){this.vx=Math.max(this.vx-FLY_ACCEL,-this.ch.speed);if(!inAtk)this.facing=-1;}
      else if(inp.right){this.vx=Math.min(this.vx+FLY_ACCEL,this.ch.speed);if(!inAtk)this.facing=1;}
      else{this.vx*=FLY_FRIC;if(Math.abs(this.vx)<0.05)this.vx=0;}
      const vCap=this.ch.speed*0.9;
      if(inp.up){this.vy=Math.max(this.vy-FLY_ACCEL,-vCap);}
      else if(inp.down){this.vy=Math.min(this.vy+FLY_ACCEL,vCap);}
      else{this.vy*=FLY_FRIC;if(Math.abs(this.vy)<0.05)this.vy=0;}
    } else if(!this.dashActive&&!this.charging){
      this.vx*=FLY_FRIC; this.vy*=FLY_FRIC;
    }
    if(this.charging){this.vx*=0.75;this.vy*=0.75;if(Math.abs(this.vx)<0.1)this.vx=0;if(Math.abs(this.vy)<0.1)this.vy=0;}

    // Clamp speed
    if(this.vx>MAX_FLY_SPEED)this.vx=MAX_FLY_SPEED; else if(this.vx<-MAX_FLY_SPEED)this.vx=-MAX_FLY_SPEED;
    if(this.vy>MAX_FLY_SPEED)this.vy=MAX_FLY_SPEED; else if(this.vy<-MAX_FLY_SPEED)this.vy=-MAX_FLY_SPEED;

    this.y+=this.vy; this.x+=this.vx;
    this.onGnd=false; this.onPlat=false;

    // Solid AABB collision for ground, grounds[], and plats[] (all directions block)
    const solids=[st.ground];
    if(st.grounds) for(const sg of st.grounds) solids.push(sg);
    if(st.plats) for(const pl of st.plats) solids.push(pl);
    // Boulder is a solid obstacle (AABB approximation of its circle)
    if(boulder&&!boulder.dead) solids.push(boulder.rect);
    for(const s of solids){
      if(this.right<=s.x||this.x>=s.x+s.w||this.bottom<=s.y||this.y>=s.y+s.h) continue;
      // Compute penetration on each axis; resolve along smaller axis
      const penLeft=this.right-s.x;       // pushing player left
      const penRight=s.x+s.w-this.x;      // pushing player right
      const penUp=this.bottom-s.y;        // pushing player up
      const penDown=s.y+s.h-this.y;       // pushing player down
      const penX=Math.min(penLeft,penRight);
      const penY=Math.min(penUp,penDown);
      if(penX<penY){
        if(penLeft<penRight){this.x=s.x-this.w;}
        else{this.x=s.x+s.w;}
        this.vx=0;
      } else {
        if(penUp<penDown){this.y=s.y-this.h;}
        else{this.y=s.y+s.h;}
        this.vy=0;
      }
    }

    if(!inp.left&&!inp.right&&free&&!inAtk&&!this.charging&&opp&&!opp.dead) this.facing=opp.cx>this.cx?1:-1;

    // PRISTINE: flyActive visual disabled now that the jump button is repurposed for grab.

    // BLASTER: fire bullets (3-shot side heavy, rocket-jump down heavy, triangle up heavy)
    if(this.atk&&this.ch.id===3){
      const _d=this.atk.dir,_h=this.atk.type==='heavy';
      if(_h&&_d!=='up'&&_d!=='down'){
        // 3-shot rapid fire: fire at su+0, su+3, su+6
        if(!this.atk.shotsF)this.atk.shotsF=0;
        const sf=this.atk.frame,ssu=this.atk.su;
        if(this.atk.shotsF===0&&sf>=ssu){this.fireBullet(this.atk.type,_d,0);this.atk.shotsF=1;}
        else if(this.atk.shotsF===1&&sf>=ssu+3){this.fireBullet(this.atk.type,_d,1);this.atk.shotsF=2;}
        else if(this.atk.shotsF===2&&sf>=ssu+6){this.fireBullet(this.atk.type,_d,2);this.atk.shotsF=3;}
      } else if(!this.atk.bulletFired&&this.atk.frame===this.atk.su){
        this.atk.bulletFired=true;
        if(_h&&_d==='down'){this.vy=this.ch.jumpF*1.25;this.onGnd=false;this.onPlat=false;}
        else if(_h&&_d==='up'){this.fireBullet(this.atk.type,_d,0);this.fireBullet(this.atk.type,_d,1);this.fireBullet(this.atk.type,_d,2);}
        else{this.fireBullet(this.atk.type,_d);}
      }
    }
    // ROCKET: fire arms on first active frame
    if(this.atk&&this.ch.id===6&&!this.atk.bulletFired&&this.atk.frame===this.atk.su){
      this.atk.bulletFired=true;
      this.fireRocketAttack(this.atk.type,this.atk.dir);
    }
    // BLADE special attack effects
    if(this.atk&&this.ch.id===8){
      const ba=this.atk, bd=ba.dir, bh=ba.type==='heavy', f=this.facing;
      const kspd=14;
      const bx=f>0?this.right:this.x, by=this.cy-this.h*0.15;
      // Up light: two-phase arc — reset hit at midpoint (was down light)
      if(!bh&&bd==='up'){
        const half=Math.floor(ba.act/2);
        if(ba.frame===ba.su+half)ba.hit=false;
      }
      // Down light: 3 knife spread downward on first active frame
      if(!bh&&bd==='down'&&!ba.bulletFired&&ba.frame===ba.su){
        ba.bulletFired=true;
        playSfx({freq:1100,freq2:350,type:'sine',decay:0.1,vol:0.15});
        const spd=kspd;
        knives.push(new Knife(this.cx,by,-spd*0.32,spd*0.95,this,true));
        knives.push(new Knife(this.cx,by,0,spd,this,true));
        knives.push(new Knife(this.cx,by, spd*0.32,spd*0.95,this,true));
      }
      // Side light comboN=2: throw knife on first active frame
      if(!bh&&(bd==='side'||bd==='neutral')&&ba.comboN===2&&!ba.bulletFired&&ba.frame===ba.su){
        ba.bulletFired=true;
        playSfx({freq:1200,freq2:400,type:'sine',decay:0.07,vol:0.14});
        knives.push(new Knife(bx,by,f*kspd,0,this,false));
      }
      // Side heavy: throw sword at end of active frames (second half)
      if(bh&&(bd==='side'||bd==='neutral')){
        const half=Math.floor(ba.act/2);
        if(!ba.bulletFired&&ba.frame===ba.su+half){
          ba.bulletFired=true;
          playSfx({freq:800,freq2:200,type:'triangle',decay:0.14,vol:0.16});
          throwSwords.push(new ThrowSword(bx,by,f*(kspd+2),this));
        }
      }
      // Down heavy: dual knife throw on first active frame
      if(bh&&bd==='down'&&!ba.bulletFired&&ba.frame===ba.su){
        ba.bulletFired=true;
        playSfx({freq:1000,freq2:300,type:'sine',decay:0.09,vol:0.15});
        knives.push(new Knife(this.cx,by,-kspd,0,this,false));
        knives.push(new Knife(this.cx,by, kspd,0,this,false));
      }
      // Up heavy: 3 knife spread on first active frame
      if(bh&&bd==='up'&&!ba.bulletFired&&ba.frame===ba.su){
        ba.bulletFired=true;
        playSfx({freq:1100,freq2:350,type:'sine',decay:0.1,vol:0.15});
        const spd=kspd;
        knives.push(new Knife(this.cx,by,-spd*0.32,-spd*0.95,this,true));
        knives.push(new Knife(this.cx,by,0,-spd,this,true));
        knives.push(new Knife(this.cx,by, spd*0.32,-spd*0.95,this,true));
      }
    }
    // UNSTABLE special attack effects
    if(this.atk&&this.ch.id===7){
      const ua=this.atk, ud=ua.dir, uh=ua.type==='heavy';
      // Side light: dash like shift-dash but 75% strength
      if(!uh&&(ud==='side'||ud==='neutral')&&ua.frame===ua.su){
        this.vx=this.facing*this.ch.speed*DASH_MULT*0.75;
        this.dashActive=true; this.dashTimer=DASH_FRAMES;
      }
      // Up light: fire head projectile on first active frame
      if(!uh&&ud==='up'&&!ua.bulletFired&&ua.frame===ua.su){
        ua.bulletFired=true;
        playSfx({freq:300,freq2:600,type:'sine',decay:0.08,vol:0.15});
        playSfx({freq:600,freq2:180,type:'square',decay:0.14,vol:0.1});
        unstableHeads.push(new UnstableHead(this.cx,this.y-4,this));
      }
      // Down light: spawn smoke cloud on first active frame
      if(!uh&&ud==='down'&&!ua.bulletFired&&ua.frame===ua.su){
        ua.bulletFired=true;
        playSfxNoise(0.2,0.2,100);
        smokeClouds.push(new SmokeCloud(this.cx,this.cy+this.h*0.3,this));
      }
      // Down heavy: self-damage + explosion on first active frame; atk.hit prevents repeat
      if(uh&&ud==='down'&&!ua.bulletFired&&ua.frame===ua.su){
        ua.bulletFired=true;
        playSfxNoise(0.22,0.4,80);
        playSfx({freq:120,freq2:40,type:'sawtooth',decay:0.25,vol:0.2});
        if(!this.isDummy){this.damage+=8;this.hitFlash=14;}
        addHitParticles(this.cx,this.cy,'#ff4400',true);
        shakeX+=(Math.random()-.5)*12; shakeY+=(Math.random()-.5)*12;
      }
      // Up heavy: launch self + spawn smoke cloud below on first active frame
      if(uh&&ud==='up'&&!ua.bulletFired&&ua.frame===ua.su){
        ua.bulletFired=true;
        playSfxNoise(0.16,0.25,150);
        playSfx({freq:180,freq2:80,type:'sawtooth',decay:0.2,vol:0.15});
        this.vy=this.ch.jumpF*1.5; this.onGnd=false; this.onPlat=false; this.jLeft=1;
        smokeClouds.push(new SmokeCloud(this.cx,this.bottom+30,this));
      }
    }
    // PRISTINE special attack effects
    if(this.atk&&this.ch.id===10){
      const pa=this.atk,pd=pa.dir,ph=pa.type==='heavy';
      const bspd=this.ch.beamSpd||14,range=this.ch.lightBeamRange||175;
      const f=this.facing,bx=f>0?this.right:this.x,by=this.cy-this.h*0.15;
      if(!pa.bulletFired&&pa.frame===pa.su){
        pa.bulletFired=true;
        playSfx({freq:ph?440:880,freq2:ph?220:440,type:'sine',decay:ph?0.3:0.14,vol:0.14});
        if(!ph){
          // Light attacks: laser beams
          const pDmg=Math.round(this.ch.lDmg*1.5);
          if(pd==='side'||pd==='neutral'){
            const b=new Bullet(bx,by,f*bspd,0,this,false);
            b.dmg=pDmg;b.kb=this.ch.lKB;b.maxDist=range;b.size=4;bullets.push(b);
          } else if(pd==='up'){
            const vx=bspd*0.342, vy=bspd*0.940;
            const bl=new Bullet(this.cx,by,-vx,-vy,this,false);bl.dmg=pDmg;bl.kb=this.ch.lKB;bl.maxDist=range;bl.size=4;
            const br=new Bullet(this.cx,by,vx,-vy,this,false);br.dmg=pDmg;br.kb=this.ch.lKB;br.maxDist=range;br.size=4;
            bullets.push(bl,br);
          } else if(pd==='down'){
            const vx=bspd*0.342, vy=bspd*0.940;
            const bl=new Bullet(this.cx,by,-vx,vy,this,false);bl.dmg=pDmg;bl.kb=this.ch.lKB;bl.maxDist=range;bl.size=4;
            const br=new Bullet(this.cx,by,vx,vy,this,false);br.dmg=pDmg;br.kb=this.ch.lKB;br.maxDist=range;br.size=4;
            bullets.push(bl,br);
          }
        } else {
          // Heavy attacks
          if(pd==='side'||pd==='neutral'){
            pristineRockets.push(new PristineRocket(this.cx,this.cy,f*8,0,this));
            this.pristineRocketCd=300;
          } else if(pd==='down'){
            this.laserShieldActive=true;this.laserShieldTimer=60;
          } else if(pd==='up'){
            // 4 diagonal beams
            const d=bspd*0.707;
            const dirs=[[-d,-d],[d,-d],[-d,d],[d,d]];
            for(const [vx,vy] of dirs){
              const b=new Bullet(this.cx,this.cy,vx,vy,this,false);
              b.dmg=Math.round(this.ch.lDmg*1.5);b.kb=this.ch.lKB;b.maxDist=range+20;b.wide=true;b.size=4;
              bullets.push(b);
            }
          }
        }
      }
    }
    // PRISTINE laser shield timer
    if(this.ch.id===10&&this.laserShieldActive){
      this.laserShieldTimer--;if(this.laserShieldTimer<=0)this.laserShieldActive=false;
    }
    // PRISTINE rocket cooldown tick
    if(this.ch.id===10&&this.pristineRocketCd>0) this.pristineRocketCd--;

    // MAGMA: flamethrower hold, fuel, and projectile attacks
    if(this.ch.id===11){
      const ma=this.atk, fuelMax=this.ch.flameFuelMax||180;
      const isFlaming=ma&&ma.type==='light'&&(ma.dir==='side'||ma.dir==='neutral'||ma.dir==='up')&&ma.frame>=ma.su;
      // Fuel recharge when not firing flamethrower
      if(!isFlaming&&this.magmaFuel<fuelMax) this.magmaFuel=Math.min(fuelMax,this.magmaFuel+(this.ch.flameRechargeRate??1));
      if(ma){
        const md=ma.dir, mh=ma.type==='heavy', f=this.facing;
        const bx2=f>0?this.right:this.x, by2=this.cy-this.h*0.1;
        // Side/neutral light: holdable flamethrower
        if(!mh&&(md==='side'||md==='neutral')){
          if(ma.frame>=ma.su){
            // Extend active while held and fueled
            if(inp.lightHeld&&this.magmaFuel>0) { ma.act++; this.magmaFuel--; }
            // Continuous damage tick every 8 frames
            if(ma.frame%8===0){
              const range=this.ch.flameRange||220;
              const fx=f>0?this.right:this.x-range;
              const fy=this.cy-28, fh=56;
              if(opps) for(const tgt of opps){
                if(tgt.dead||tgt.shieldActive||tgt.laserShieldActive)continue;
                if(aabb({x:fx,y:fy,w:range,h:fh},{x:tgt.x,y:tgt.y,w:tgt.w,h:tgt.h})){
                  if(tgt.damage>=DEATH_THRESHOLD&&!tgt.isDummy){instakill(tgt,tgt.cx,tgt.cy);continue;}
                  tgt.damage+=Math.round(2.8*(tgt.ch.def??1)); tgt.hitFlash=5;
                  tgt.vx+=f*0.8; // slight pushback
                }
              }
            }
          }
        }
        // Up light: holdable upward flamethrower (both arms, double width)
        if(!mh&&md==='up'){
          if(ma.frame>=ma.su){
            if(inp.lightHeld&&this.magmaFuel>0) { ma.act++; this.magmaFuel--; }
            if(ma.frame%8===0){
              const range=this.ch.flameRange||220;
              const fx=this.cx-range, fy=this.y-range, fw=range*2, fh=range;
              if(opps) for(const tgt of opps){
                if(tgt.dead||tgt.shieldActive||tgt.laserShieldActive)continue;
                if(aabb({x:fx,y:fy,w:fw,h:fh},{x:tgt.x,y:tgt.y,w:tgt.w,h:tgt.h})){
                  if(tgt.damage>=DEATH_THRESHOLD&&!tgt.isDummy){instakill(tgt,tgt.cx,tgt.cy);continue;}
                  tgt.damage+=Math.round(2.8*(tgt.ch.def??1)); tgt.hitFlash=5;
                  tgt.vy-=0.6; // slight upward push
                }
              }
            }
          }
        }
        // Down light: fire linger fireballs both sides on first active frame
        if(!mh&&md==='down'&&!ma.bulletFired&&ma.frame===ma.su){
          ma.bulletFired=true;
          playSfxNoise(0.12,0.22,150);
          playSfx({freq:200,freq2:80,type:'sawtooth',decay:0.12,vol:0.14});
          const bspd=14, by3=this.cy;
          const fl=new FirePebble(this.cx,by3,-bspd,this,true);
          fl.maxDist=220; fl.dmg=this.ch.lDmg; fl.kb=this.ch.lKB;
          const fr=new FirePebble(this.cx,by3,bspd,this,true);
          fr.maxDist=220; fr.dmg=this.ch.lDmg; fr.kb=this.ch.lKB;
          firePebbles.push(fl,fr);
        }
        // Side heavy: fire pebble on first active frame
        if(mh&&(md==='side'||md==='neutral')&&!ma.bulletFired&&ma.frame===ma.su){
          ma.bulletFired=true;
          playSfxNoise(0.14,0.28,100);
          playSfx({freq:160,freq2:60,type:'sawtooth',decay:0.18,vol:0.16});
          firePebbles.push(new FirePebble(bx2,by2,f*8,this));
        }
        // Down heavy: fire-jet launch (same as Blaster rocket jump)
        if(mh&&md==='down'&&!ma.bulletFired&&ma.frame===ma.su){
          ma.bulletFired=true;
          this.vy=this.ch.jumpF*1.25; this.onGnd=false; this.onPlat=false;
        }
        // Up heavy: semi-circle fire above — hitbox handled in hitbox()
      }
    }

    // FACTORY special mechanics
    if(this.ch.id===12){
      if(this.factoryBoltCD>0) this.factoryBoltCD--;
      if(this.factoryZapCD>0) this.factoryZapCD--;
      if(this.atk){
        const fa=this.atk, fd=fa.dir, fh=fa.type==='heavy', f=this.facing;
        // Down light: launch Bolt minion on first active frame
        if(!fh&&fd==='down'&&!fa.bulletFired&&fa.frame===fa.su){
          fa.bulletFired=true;
          playSfx({freq:110,freq2:55,type:'sawtooth',decay:0.18,vol:0.18});
          playSfxNoise(0.1,0.12,500);
          this.factoryBoltCD=this.ch.boltCDMax||300;
          const opp=opps&&opps.find(p=>!p.dead)||null;
          let bvx=f*4.5, bvy=-0.5;
          if(opp){const dx=opp.cx-this.cx,dy=opp.cy-this.cy,dist=Math.hypot(dx,dy)||1,spd=4.5;bvx=dx/dist*spd;bvy=dy/dist*spd;}
          factoryBolts.push(new FactoryBolt(this.cx,this.cy-20,bvx,bvy,this));
        }
        // Up light: launch gear upward on first active frame
        if(!fh&&fd==='up'&&!fa.bulletFired&&fa.frame===fa.su){
          fa.bulletFired=true;
          playSfx({freq:150,freq2:80,type:'sawtooth',decay:0.15,vol:0.17});
          factoryGears.push(new FactoryGear(this.cx,this.y-5,this));
        }
        // Side heavy: drill multi-hit every 10 frames during active
        if(fh&&(fd==='side'||fd==='neutral')&&fa.frame>=fa.su&&fa.frame<fa.su+fa.act){
          const reach=this.ch.hRch, sz=this.ch.hSz;
          const hx=f>0?this.right-8:this.x-reach+8;
          const hb={x:hx,y:this.cy-sz,w:reach,h:sz*2};
          if((fa.frame-fa.su)%10===0&&opps){
            for(const tgt of opps){
              if(tgt.dead||tgt.shieldActive||tgt.laserShieldActive)continue;
              if(!aabb(hb,{x:tgt.x,y:tgt.y,w:tgt.w,h:tgt.h}))continue;
              if(tgt.damage>=DEATH_THRESHOLD&&!tgt.isDummy){instakill(tgt,tgt.cx,tgt.cy);continue;}
              tgt.damage+=Math.round(this.ch.hDmg*0.4*(tgt.ch.def??1)); tgt.hitFlash=8;
              const km=kbScale(tgt.damage), kb=this.ch.hKB*0.3*km/tgt.ch.weight;
              tgt.vx=f*kb; tgt.vy=-kb*0.05;
              tgt.vx=Math.max(-MAX_KB,Math.min(MAX_KB,tgt.vx)); tgt.vy=Math.max(-MAX_KB,Math.min(MAX_KB,tgt.vy));
              tgt.hstun=Math.min(20,Math.floor(3+kb*0.8)); tgt.hitlag=3;
              addHitParticles(tgt.cx,tgt.cy,this.ch.eyeCol,false);
            }
          }
        }
        // Down heavy: spawn 3 Zaps + fire directional bullets on first active frame
        if(fh&&fd==='down'&&!fa.bulletFired&&fa.frame===fa.su){
          fa.bulletFired=true;
          playSfx({freq:400,freq2:900,type:'square',decay:0.15,vol:0.16});
          playSfxNoise(0.12,0.2,800);
          this.factoryZapCD=this.ch.zapCDMax||180;
          const opp=opps&&opps.find(p=>!p.dead)||null;
          for(const ox of [-50,0,50]){
            const zx=this.cx+ox, zy=this.cy+10;
            factoryZaps.push(new FactoryZap(zx,zy,this));
            let bvx=f*10, bvy=0;
            if(opp){const dx=opp.cx-zx,dy=opp.cy-zy,dist=Math.hypot(dx,dy)||1,bspd=10;bvx=dx/dist*bspd;bvy=dy/dist*bspd;}
            const b=new Bullet(zx,zy,bvx,bvy,this,false);
            b.dmg=Math.round(this.ch.hDmg*0.5); b.kb=this.ch.hKB*0.5; b.maxDist=450;
            bullets.push(b);
          }
        }
      }
    }

    // KING special mechanics: shield rotation + flaming sword timer
    if(this.ch.id===14){
      // Sword fire timer counts down each frame
      if(this.kingFireTimer>0) this.kingFireTimer--;
      // Shield rotation tween (smooth quarter-turn animation)
      if(this.kingShieldRotateT>0){
        this.kingShieldRotateT--;
        const rt=1-this.kingShieldRotateT/8; // 0 -> 1 over 8 frames
        // Ease out
        const eased=1-Math.pow(1-rt,2);
        this.kingShieldAngle=this.kingShieldRotateFrom+(this.kingShieldRotateTo-this.kingShieldRotateFrom)*eased;
        if(this.kingShieldRotateT===0) this.kingShieldAngle=this.kingShieldRotateTo;
      }
      if(this.atk){
        const ka=this.atk, kd=ka.dir, kh=ka.type==='heavy';
        // Down light: trigger shield 90° clockwise rotation on first active frame
        if(!kh&&kd==='down'&&!ka.bulletFired&&ka.frame===ka.su){
          ka.bulletFired=true;
          this.kingShieldRotateFrom=this.kingShieldAngle;
          this.kingShieldRotateTo=this.kingShieldAngle+Math.PI/2;
          this.kingShieldRotateT=8;
          playSfx({freq:480,freq2:240,type:'square',decay:0.12,vol:0.14});
        }
        // Side heavy: reset hit flag at the swing→poke phase transition so the poke can also connect
        if(kh&&(kd==='side'||kd==='neutral')){
          const half=Math.floor(ka.act/2);
          if(ka.frame===ka.su+half){ ka.hit=false; }
        }
        // Up heavy: spinning whirlwind — reset hit every 8 active frames so the spin can hit multiple opponents
        if(kh&&kd==='up'&&ka.frame>=ka.su&&ka.frame<ka.su+ka.act){
          const af=ka.frame-ka.su;
          if(af>0&&af%8===0) ka.hit=false;
        }
        // Down heavy: light sword on fire on first active frame
        if(kh&&kd==='down'&&!ka.bulletFired&&ka.frame===ka.su){
          ka.bulletFired=true;
          this.kingFireTimer=this.ch.kingFireDuration||120;
          playSfx({freq:220,freq2:80,type:'sawtooth',decay:0.25,vol:0.18});
          playSfxNoise(0.15,0.3,200);
          // Visual whoosh particles around sword
          for(let k=0;k<8;k++){
            const a=Math.random()*Math.PI*2,sp=2+Math.random()*3;
            particles.push({x:this.cx,y:this.cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1,life:24,max:24,col:k%2?'#ff6600':'#ffcc00',sz:3});
          }
        }
      }
    }

    // CRUSHER heavy cooldowns
    if(this.ch.id===1){
      if(this.crusherSideHeavyCD>0) this.crusherSideHeavyCD--;
      if(this.crusherUpHeavyCD>0) this.crusherUpHeavyCD--;
      if(this.crusherDownHeavyCD>0) this.crusherDownHeavyCD--;
    }
    // ROCKET cooldowns
    if(this.ch.id===6){
      if(this.rocketLightCD>0) this.rocketLightCD--;
      if(this.rocketSideHeavyCD>0) this.rocketSideHeavyCD--;
      if(this.rocketUpHeavyCD>0) this.rocketUpHeavyCD--;
    }
    // GLITCH special mechanics
    if(this.ch.id===13){
      if(this.glitchPhaseTimer>0) this.glitchPhaseTimer--;
      if(this.atk){
        const ga=this.atk, gd=ga.dir, gh=ga.type==='heavy', f=this.facing;
        // Down light: arm teleport below (hitbox handled in hitbox())
        // Side heavy: Blaster 3-shot burst at su+0, su+3, su+6 using Blaster's actual values
        if(gh&&(gd==='side'||gd==='neutral')&&this.glitchWeapon==='blaster'){
          if(!ga.shotsF) ga.shotsF=0;
          const sf=ga.frame, ssu=ga.su;
          const bx2=f>0?this.right:this.x, by2=this.cy-this.h*0.1;
          const dmgs=[2,3.5,5.6], kbs=[4.0,5.5,7.0];
          if(ga.shotsF===0&&sf>=ssu){const b=new Bullet(bx2,by2,f*12,0,this,false);b.dmg=dmgs[0];b.kb=kbs[0];b.maxDist=220;bullets.push(b);ga.shotsF=1;}
          else if(ga.shotsF===1&&sf>=ssu+3){const b=new Bullet(bx2,by2,f*12,0,this,false);b.dmg=dmgs[1];b.kb=kbs[1];b.maxDist=220;bullets.push(b);ga.shotsF=2;}
          else if(ga.shotsF===2&&sf>=ssu+6){const b=new Bullet(bx2,by2,f*12,0,this,false);b.dmg=dmgs[2];b.kb=kbs[2];b.maxDist=220;bullets.push(b);ga.shotsF=3;}
        }
        // Down heavy: disappear on first active frame, reappear+damage at end of active
        if(gh&&gd==='down'){
          if(ga.frame===ga.su){
            this.glitchGhost=true;
          }
          if(ga.frame===ga.su+ga.act){
            this.glitchGhost=false;
            // deal damage to any opponent overlapping Glitch's body on reappear
            if(opps){
              for(const tgt of opps){
                if(tgt.dead||tgt.hitImmune>0||tgt.shieldActive||tgt.laserShieldActive) continue;
                if(!aabb({x:this.x-8,y:this.y-8,w:this.w+16,h:this.h+16},{x:tgt.x,y:tgt.y,w:tgt.w,h:tgt.h})) continue;
                if(tgt.damage>=DEATH_THRESHOLD&&!tgt.isDummy){instakill(tgt,tgt.cx,tgt.cy);continue;}
                tgt.damage+=Math.round(this.ch.hDmg*1.2*(tgt.ch.def??1));
                tgt.hitFlash=15;
                const km=kbScale(tgt.damage), kb=this.ch.hKB*1.3*km/tgt.ch.weight;
                tgt.vx=f*kb; tgt.vy=-kb*0.25;
                tgt.vx=Math.max(-MAX_KB,Math.min(MAX_KB,tgt.vx)); tgt.vy=Math.max(-MAX_KB,Math.min(MAX_KB,tgt.vy));
                tgt.hstun=Math.min(30,Math.floor(5+kb*1.4)); tgt.hitlag=6; this.hitlag=4;
                addHitParticles(tgt.cx,tgt.cy,this.ch.eyeCol,true);
              }
            }
          }
        }
        // Up heavy: teleport self upward on first active frame
        if(gh&&gd==='up'&&!ga.bulletFired&&ga.frame===ga.su){
          ga.bulletFired=true;
          playSfx({freq:800,freq2:200,type:'square',decay:0.1,vol:0.16});
          playSfxNoise(0.08,0.15,600);
          this.y=Math.max(10,this.y-200);
          this.vy=0; this.onGnd=false; this.onPlat=false;
          addHitParticles(this.cx,this.cy+100,this.ch.color,false);
        }
      }
    }
    // EDGE up heavy: spawn mini sword; EDGE down heavy: dive force
    if(this.atk&&this.ch.id===4&&this.atk.type==='heavy'){
      if(this.atk.dir==='up'&&!this.atk.bulletFired&&this.atk.frame===this.atk.su){
        this.atk.bulletFired=true;
        playSfx({freq:500,freq2:180,type:'triangle',decay:0.16,vol:0.15});
        miniSwords.push(new MiniSword(this.cx-4,this.y-10,this));
      }
      if(this.atk.dir==='down'&&this.atk.frame>=this.atk.su&&this.atk.frame<this.atk.su+this.atk.act){
        this.vy=Math.min(MAX_FLY_SPEED+4,this.vy+6);
      }
    }

    // Charge heavy (CRUSHER=1, ZIPPY=2, PIERCE=5)
    const canCharge=[1,2,5].includes(this.ch.id);
    if(canCharge&&inp.heavy&&!this.atk&&!this.charging&&this.atkCD===0&&free){
      const cd=this.atkDir(inp);
      // CRUSHER: block charge if that direction is on cooldown
      let crusherBlocked=false;
      if(this.ch.id===1){
        if((cd==='side'||cd==='neutral')&&this.crusherSideHeavyCD>0) crusherBlocked=true;
        else if(cd==='up'&&this.crusherUpHeavyCD>0) crusherBlocked=true;
        else if(cd==='down'&&this.crusherDownHeavyCD>0) crusherBlocked=true;
      }
      if(!crusherBlocked){this.charging=true; this.chargeTime=0; this.chargeDir=cd;}
    }
    if(this.charging){
      this.chargeTime=Math.min(this.chargeTime+1,240);
      if(inp.heavyRelease){
        const cr=Math.min(1,this.chargeTime/240);
        this.charging=false; this.startAtk('heavy',this.chargeDir,null,cr);
      }
    }

    // Generalized combo detection (any character with maxCombo>1)
    if(this.atk&&this.ch.maxCombo>1&&this.atk.type==='light'){
      const inEl=this.atk.frame>=this.atk.su; // buffer from active frames onward
      if(inEl&&inp.light&&(this.atk.comboN||1)<this.ch.maxCombo) this.comboPend=true;
    }

    // Attack input
    if(free&&this.atkCD===0&&!this.atk&&!this.charging){
      // If a rock is held and the player presses light/heavy, drop the rock first.
      if(this.heldRock&&(inp.light||inp.heavy)){
        const r=this.heldRock;
        r.heldBy=null; r.thrown=false;
        // Tiny outward drift so it doesn't immediately re-collide with the player
        r.vx=this.facing*1.2; r.vy=-0.4;
        this.heldRock=null;
      }
      const ad=this.atkDir(inp);
      if(this.ch.id===6){
        // ROCKET: check arm availability per attack type
        if(inp.light&&this.rocketLightCD===0) this.startAtk('light',ad);
        else if(inp.heavy&&ad==='up'&&this.rocketUpHeavyCD===0) this.startAtk('heavy','up');
        else if(inp.heavy&&ad==='down') this.startAtk('heavy','down');
        else if(inp.heavy&&(ad==='side'||ad==='neutral')&&this.rocketSideHeavyCD===0) this.startAtk('heavy','side');
      } else if(this.ch.id===12){
        // FACTORY: block down attacks when on cooldown
        if(inp.light){if(!(ad==='down'&&this.factoryBoltCD>0))this.startAtk('light',ad);}
        else if(inp.heavy){if(!(ad==='down'&&this.factoryZapCD>0))this.startAtk('heavy',ad);}
      } else if(this.ch.id===10){
        // PRISTINE: side heavy blocked by rocket cooldown; other attacks free
        if(inp.light) this.startAtk('light',ad);
        else if(inp.heavy&&!canCharge){
          const sideBlocked=(ad==='side'||ad==='neutral')&&this.pristineRocketCd>0;
          if(!sideBlocked) this.startAtk('heavy',ad);
        }
      } else if(this.ch.id===13){
        // GLITCH: cannot attack while phase is active
        if(this.glitchPhaseTimer===0){
          if(inp.light) this.startAtk('light',ad);
          else if(inp.heavy) this.startAtk('heavy',ad);
        }
      } else {
        if(inp.light) this.startAtk('light',ad);
        else if(inp.heavy&&!canCharge) this.startAtk('heavy',ad);
      }
    }

    // Update attack
    if(this.atk){
      this.atk.frame++;
      if(!this.atk.hit){
        const hb=this.hitbox();
        if(hb&&opps){
          for(const tgt of opps){
            if(!tgt.dead&&tgt.hitlag===0&&tgt.hitImmune===0&&aabb(hb,{x:tgt.x,y:tgt.y,w:tgt.w,h:tgt.h})){
              this.land(tgt);this.atk.hit=true;break;
            }
          }
        }
      }
      const total=this.atk.su+this.atk.act+this.atk.el;
      if(this.atk.frame>=total){
        if(this.comboPend&&this.ch.maxCombo>1&&this.atk.type==='light'){
          const nxt=(this.atk.comboN||1)+1, dir=this.atk.dir;
          // EDGE/PIERCE: only advance to hit 3 if hit 2 connected
          if((this.ch.id===4||this.ch.id===5)&&nxt===3&&!this.atk.hit){this.atkCD=3;this.atk=null;this.comboPend=false;}
          else{this.atk=null;this.comboPend=false;this.startAtk('light',dir,nxt);}
        } else {
          if(this.ch.id===1&&this.atk.type==='heavy'){
            if(this.atk.dir==='side'||this.atk.dir==='neutral') this.crusherSideHeavyCD=180;
            else if(this.atk.dir==='up') this.crusherUpHeavyCD=180;
            else if(this.atk.dir==='down') this.crusherDownHeavyCD=180;
          }
          if(this.ch.id===6){
            if(this.atk.type==='light') this.rocketLightCD=4;
            if(this.atk.type==='heavy'&&(this.atk.dir==='side'||this.atk.dir==='neutral')) this.rocketSideHeavyCD=180;
            if(this.atk.type==='heavy'&&this.atk.dir==='up') this.rocketUpHeavyCD=210;
          }
          this.atkCD=3;this.atk=null;this.comboPend=false;
        }
      }
    }

    const moving=(this.onGnd||this.onPlat)&&(inp.left||inp.right)&&!this.charging;
    if(moving){this.wt++;if(this.wt>=6){this.wt=0;this.wf=(this.wf+1)%4;}}
  }

  fireBullet(type,dir,shotNum=0){
    playSfx({freq:type==='heavy'?600:900,freq2:type==='heavy'?150:200,type:'sawtooth',decay:0.1,vol:0.13});
    const heavy=type==='heavy', f=this.facing;
    const bx=f>0?this.right:this.x, by=this.cy-this.h*0.1;
    if(heavy&&dir!=='up'&&dir!=='down'){
      // 3-shot rapid side heavy: last shot ~70% of full heavy
      const dmgs=[2,3.5,5.6],kbs=[8.0,11.0,14.0];
      const b=new Bullet(bx,by,f*this.ch.bulletSpd,0,this,false);
      b.dmg=dmgs[Math.min(shotNum,2)]; b.kb=kbs[Math.min(shotNum,2)];
      b.maxDist=this.ch.lightBulletRange||220;
      bullets.push(b); return;
    }
    if(heavy&&dir==='up'){
      // Triangle spread: 3 bullets fanning outward
      const spd=this.ch.heavyBulletSpd;
      const sx=[-spd*0.32,0,spd*0.32],sy=[-spd*0.95,-spd,-spd*0.95];
      bullets.push(new Bullet(bx,by,sx[Math.min(shotNum,2)],sy[Math.min(shotNum,2)],this,true)); return;
    }
    const spd=heavy?this.ch.heavyBulletSpd:this.ch.bulletSpd;
    let vx=f*spd,vy=0;
    if(dir==='up'){vx=f*spd*0.2;vy=-spd;}
    else if(dir==='down'){vx=f*spd*0.2;vy=spd*0.8;}
    bullets.push(new Bullet(bx,by,vx,vy,this,heavy));
  }

  fireRocketAttack(type,dir){
    playSfx({freq:dir==='down'?120:200,freq2:40,type:'sawtooth',decay:0.28,vol:0.2});
    playSfxNoise(0.18,0.12,300);
    const f=this.facing, spd=8;
    const bx=this.cx, by=this.cy-this.h*0.1;
    if(type==='light'){
      let vx=f*spd,vy=0;
      if(dir==='up'){vx=f*spd*0.2;vy=-spd;}
      else if(dir==='down'){vx=f*spd*0.2;vy=spd;}
      rocketArms.push(new RocketArm(bx,by,vx,vy,this,false));
      this.armsLeft=Math.max(0,this.armsLeft-1);
    } else if(dir==='side'){
      // 2-arm side heavy: single projectile with dual visual (2.5× dmg/kb)
      const arm=new RocketArm(bx,by,f*spd,0,this,true);
      arm.dual=true; arm.dmgMult=2.5; arm.kbMult=4.0;
      rocketArms.push(arm);
      this.armsLeft=Math.max(0,this.armsLeft-2);
    } else if(dir==='up'){
      // 4-arm spread: left, right, diagonal-up-left, diagonal-up-right (halved range)
      const d=spd*0.707;
      const a1=new RocketArm(bx,by,-spd,0,this,true); a1.maxDist=98;
      const a2=new RocketArm(bx,by,spd,0,this,true);  a2.maxDist=98;
      const a3=new RocketArm(bx,by,-d,-d,this,true);   a3.maxDist=98;
      const a4=new RocketArm(bx,by,d,-d,this,true);    a4.maxDist=98;
      rocketArms.push(a1,a2,a3,a4);
      this.armsLeft=0;
    } else if(dir==='down'){
      // 2 hovering mines next to the robot
      rocketMines.push(new RocketMine(this.cx-55,this.cy,-1,this));
      rocketMines.push(new RocketMine(this.cx+55,this.cy,1,this));
      this.armsLeft=Math.max(0,this.armsLeft-2);
    }
  }

  startAtk(type,dir,comboN=null,chargeRatio=0){
    const c=this.ch;
    let su=type==='heavy'?c.hSU:c.lSU, act=type==='heavy'?c.hAct:c.lAct, el=type==='heavy'?c.hEl:c.lEl;
    let cn=null;
    if(c.maxCombo>1&&type==='light'){
      cn=comboN||1;
      if(c.id===4&&cn===3){su+=4;act+=3;el+=6;} // EDGE finisher slower
      else if(c.id===5&&cn===3){su+=3;act+=5;el+=6;} // PIERCE spear swing finisher
      else if(cn===c.maxCombo){su+=2;act+=2;el+=4;} // other finishers slightly slower
    }
    // BLADE direction-specific timing
    if(c.id===8){
      if(type==='light'&&(dir==='side'||dir==='neutral')){su=4;act=7;el=10;} // combo: jab + knife
      else if(type==='light'&&dir==='up'){su=6;act=16;el=12;} // two-phase arc (was down light)
      else if(type==='light'&&dir==='down'){su=10;act=8;el=18;} // downward knife spread (like up heavy)
      else if(type==='heavy'&&(dir==='side'||dir==='neutral')){su=12;act=14;el=20;} // swing+throw
      else if(type==='heavy'&&dir==='down'){su=8;act=6;el=14;}
      else if(type==='heavy'&&dir==='up'){su=10;act=8;el=18;}
    }
    // UNSTABLE direction-specific timing
    if(c.id===7){
      if(type==='light'&&(dir==='side'||dir==='neutral')){su=3;act=10;el=12;}
      else if(type==='light'&&dir==='up'){su=5;act=4;el=14;}
      else if(type==='light'&&dir==='down'){su=4;act=4;el=16;}
      else if(type==='heavy'&&(dir==='side'||dir==='neutral')){su=12;act=10;el=18;}
      else if(type==='heavy'&&dir==='down'){su=14;act=6;el=20;}
      else if(type==='heavy'&&dir==='up'){su=8;act=8;el=16;}
    }
    // ROCKET direction-specific timing
    if(c.id===6){
      if(type==='light'){su=2;act=5;el=8;}
      else if(dir==='down'){su=10;act=6;el=18;}
      else if(dir==='up'){su=10;act=8;el=22;}
      else{su=8;act=8;el=20;} // side heavy
    }
    // PRISTINE direction-specific timing
    if(c.id===10){
      if(type==='light'){su=3;act=6;el=8;}
      else if(dir==='down'){su=14;act=4;el=20;} // laser shield
      else if(dir==='up'){su=8;act=5;el=14;}    // 4 diagonal beams
      else{su=10;act=5;el=14;}                    // homing rocket
    }
    // BLASTER direction-specific heavy timing
    if(c.id===3&&type==='heavy'){
      if(dir==='down'){su=12;act=8;el=14;}   // rocket jump: short startup
      else if(dir==='up'){su=18;act=8;el=16;} // triangle: moderate startup
      else{su=25;act=14;}                      // side: halved startup, extra active frames for 3-shot burst
    }
    // MAGMA direction-specific timing
    if(c.id===11){
      if(type==='light'&&(dir==='side'||dir==='neutral')){su=4;act=6;el=14;} // flamethrower
      else if(type==='light'&&dir==='up'){su=5;act=6;el=14;}                  // upward flamethrower
      else if(type==='light'&&dir==='down'){su=5;act=6;el=12;}                // burst both sides
      else if(type==='heavy'&&(dir==='side'||dir==='neutral')){su=14;act=8;el=20;} // fire pebble
      else if(type==='heavy'&&dir==='down'){su=10;act=8;el=16;}               // fire-jet launch
      else if(type==='heavy'&&dir==='up'){su=12;act=14;el=22;}                // semicircle fire
    }
    // FACTORY direction-specific timing
    if(c.id===12){
      if(type==='light'&&(dir==='side'||dir==='neutral')){su=20;act=32;el=48;}  // gear swing (slower)
      else if(type==='light'&&dir==='up'){su=4;act=6;el=10;}                   // gear throw up
      else if(type==='light'&&dir==='down'){su=8;act=4;el=16;}                 // bolt launch
      else if(type==='heavy'&&(dir==='side'||dir==='neutral')){su=12;act=60;el=24;} // drill spin 1s
      else if(type==='heavy'&&dir==='down'){su=10;act=4;el=20;}                // zap deploy
      else if(type==='heavy'&&dir==='up'){su=18;act=14;el=22;}                 // pendulum swing
    }
    // EDGE direction-specific timing
    if(c.id===4){
      if(type==='heavy'&&(dir==='side'||dir==='neutral')){su=24;} // 0.2s extra startup on side heavy
    }
    // KING direction-specific timing
    if(c.id===14){
      if(type==='light'&&(dir==='side'||dir==='neutral')){su=6;act=8;el=12;}    // sword poke
      else if(type==='light'&&dir==='up'){su=6;act=14;el=12;}                    // pendulum swing above
      else if(type==='light'&&dir==='down'){su=4;act=4;el=14;}                   // shield rotate
      else if(type==='heavy'&&(dir==='side'||dir==='neutral')){su=10;act=20;el=18;} // swing then poke
      else if(type==='heavy'&&dir==='down'){su=10;act=6;el=18;}                  // light sword on fire
      else if(type==='heavy'&&dir==='up'){su=14;act=36;el=22;}                   // spinning sword whirlwind
    }
    // GLITCH direction-specific timing
    if(c.id===13){
      if(type==='light'&&(dir==='side'||dir==='neutral')){su=3;act=18;el=8;}   // arm teleport linger
      else if(type==='light'&&dir==='up'){su=3;act=18;el=8;}                   // both arms up
      else if(type==='light'&&dir==='down'){su=3;act=18;el=8;}                  // arm teleport below
      else if(type==='heavy'&&(dir==='side'||dir==='neutral')){
        const weapons=['edge','pierce','blaster'];
        this.glitchWeapon=weapons[Math.floor(Math.random()*3)];
        su=12; act=this.glitchWeapon==='blaster'?14:10; el=20;
      }
      else if(type==='heavy'&&dir==='down'){su=8;act=6;el=18;}                 // disappear+reappear
      else if(type==='heavy'&&dir==='up'){su=3;act=1;el=20;}                   // warp jump
    }
    this.atk={type,dir,frame:0,su,act,el,hit:false,comboN:cn,bulletFired:false,chargeRatio};
    sfxSwing(this.ch.id,type,dir);
  }

  hitbox(){
    if(!this.atk)return null;
    const a=this.atk;
    if(a.frame<a.su||a.frame>=a.su+a.act)return null;
    if(this.ch.id===10) return null; // PRISTINE: all projectile-based attacks
    if(this.ch.id===12){
      const heavy=a.type==='heavy', f=this.facing;
      if(!heavy&&(a.dir==='side'||a.dir==='neutral')){
        // Side light: gear swing arc to the side
        const reach=this.ch.lRch, sz=this.ch.lSz;
        const hx=f>0?this.right-8:this.x-reach+8;
        return{x:hx,y:this.cy-sz*2,w:reach,h:sz*3};
      }
      if(!heavy&&a.dir==='up') return null;   // FactoryGear handles this
      if(!heavy&&a.dir==='down') return null;  // FactoryBolt handles this
      if(heavy&&(a.dir==='side'||a.dir==='neutral')) return null; // drill: handled in update()
      if(heavy&&a.dir==='down') return null;   // Zap bullets handle this
      if(heavy&&a.dir==='up'){
        // Pendulum sweep: wide arc above head
        return{x:this.cx-this.ch.hRch,y:this.y-this.ch.hRch*0.7,w:this.ch.hRch*2,h:this.ch.hRch*0.8};
      }
      return null;
    }
    if(this.ch.id===13){
      const heavy=a.type==='heavy', f=this.facing, tar=this.ch.teleArmRange||150;
      if(!heavy&&(a.dir==='side'||a.dir==='neutral')){
        // Arm appears 150px in facing direction
        const armCX=this.cx+f*tar;
        return{x:armCX-12,y:this.cy-16,w:24,h:32};
      }
      if(!heavy&&a.dir==='up'){
        // Both arms appear 150px above
        return{x:this.cx-30,y:this.cy-tar-12,w:60,h:24};
      }
      if(!heavy&&a.dir==='down'){
        // Both arms appear 150px below
        return{x:this.cx-30,y:this.cy+tar-12,w:60,h:24};
      }
      if(heavy&&(a.dir==='side'||a.dir==='neutral')){
        // Depends on randomly chosen weapon
        const wep=this.glitchWeapon;
        if(wep==='edge'){const hx=f>0?this.cx-10:this.cx-118+10;return{x:hx,y:this.y-50,w:118,h:this.h+80};}
        if(wep==='pierce'){const hx=f>0?this.right-10:this.x-118+10;return{x:hx,y:this.cy-18,w:118,h:36};}
        return null; // blaster: bullet handles it
      }
      if(heavy&&a.dir==='down') return null; // reappear damage handled in update()
      if(heavy&&a.dir==='up') return null;   // teleport: no hitbox
      return null;
    }
    if(this.ch.id===14){
      const heavy=a.type==='heavy', f=this.facing;
      // Side light: forward sword poke (long, narrow)
      if(!heavy&&(a.dir==='side'||a.dir==='neutral')){
        const reach=this.ch.kingPokeReach||118, sz=28;
        const hx=f>0?this.right-8:this.x-reach+8;
        return{x:hx,y:this.cy-sz/2,w:reach,h:sz};
      }
      // Up light: pendulum swing — wide arc above head
      if(!heavy&&a.dir==='up'){
        return{x:this.cx-this.ch.lRch*0.55,y:this.y-this.ch.lRch*0.6,w:this.ch.lRch*1.1,h:this.ch.lRch*0.7};
      }
      // Down light: shield rotation — no hitbox
      if(!heavy&&a.dir==='down') return null;
      // Side heavy: two-phase swing then poke
      if(heavy&&(a.dir==='side'||a.dir==='neutral')){
        const half=Math.floor(a.act/2);
        if(a.frame<a.su+half){
          // Swing phase: shorter horizontal arc with vertical extent (overhead-to-side sweep)
          const sr=this.ch.kingSideHeavySwingReach||84;
          const hx=f>0?this.right-12:this.x-sr+12;
          return{x:hx,y:this.cy-44,w:sr,h:this.h+30};
        } else {
          // Poke phase: longer reach forward, narrow
          const pr=this.ch.kingSideHeavyPokeReach||124;
          const hx=f>0?this.right-8:this.x-pr+8;
          return{x:hx,y:this.cy-14,w:pr,h:28};
        }
      }
      // Down heavy: light sword on fire — no hitbox
      if(heavy&&a.dir==='down') return null;
      // Up heavy: spinning whirlwind — circular hitbox centered on player
      if(heavy&&a.dir==='up'){
        const r=this.ch.kingSpinReach||96;
        return{x:this.cx-r,y:this.cy-r,w:r*2,h:r*2};
      }
      return null;
    }
    if(this.ch.id===11){
      const heavy=a.type==='heavy';
      // All lights handled in MAGMA update block (flamethrower + projectiles)
      if(!heavy) return null;
      // Side heavy: fire pebble (projectile)
      if(heavy&&(a.dir==='side'||a.dir==='neutral')) return null;
      // Down heavy: fire-jet exhaust hitbox below
      if(heavy&&a.dir==='down') return{x:this.cx-26,y:this.bottom-4,w:52,h:64};
      // Up heavy: wide semicircle fire above
      if(heavy&&a.dir==='up') return{x:this.cx-80,y:this.y-72,w:160,h:82};
      return null;
    }
    if(this.ch.id===3){
      // BLASTER down heavy: rocket exhaust hitbox below character
      if(a.type==='heavy'&&a.dir==='down') return{x:this.cx-22,y:this.bottom-4,w:44,h:58};
      return null; // other BLASTER attacks use bullet system
    }
    if(this.ch.id===6)return null; // ROCKET uses arm projectile system
    if(this.ch.id===8){
      const heavy=a.type==='heavy', f=this.facing;
      // Side light comboN=1: jab with extended reach
      if(!heavy&&(a.dir==='side'||a.dir==='neutral')&&a.comboN!==2){
        const reach=96, sz=this.ch.lSz;
        const hx=f>0?this.right-10:this.x-reach+10;
        return{x:hx,y:this.cy-sz/2,w:reach,h:sz};
      }
      // Side light comboN=2: knife throw (projectile, no melee hitbox)
      if(!heavy&&(a.dir==='side'||a.dir==='neutral')&&a.comboN===2)return null;
      // Up light: two-phase arc — right then left (was down light)
      if(!heavy&&a.dir==='up'){
        const half=Math.floor(a.act/2);
        if(a.frame<a.su+half) return{x:this.cx+4,y:this.cy-this.ch.lRch*0.6,w:this.ch.lSz,h:this.ch.lRch*0.7};
        return{x:this.cx-4-this.ch.lSz,y:this.cy-this.ch.lRch*0.6,w:this.ch.lSz,h:this.ch.lRch*0.7};
      }
      // Down light: downward knife spread — no melee hitbox
      if(!heavy&&a.dir==='down')return null;
      // Side heavy: swing phase only (first half of active), throw phase is projectile
      if(heavy&&(a.dir==='side'||a.dir==='neutral')){
        const half=Math.floor(a.act/2);
        if(a.frame<a.su+half){const fx=f>0?this.right-12:this.x-this.ch.hRch+12;return{x:fx,y:this.cy-40,w:this.ch.hRch,h:80};}
        return null; // throw phase
      }
      // Down heavy: dual knife throw — no melee hitbox
      if(heavy&&a.dir==='down')return null;
      // Up heavy: knife spread — no melee hitbox
      if(heavy&&a.dir==='up')return null;
      return null;
    }
    if(this.ch.id===7){
      const heavy=a.type==='heavy', f=this.facing;
      // Side light: dash body slam — full body AABB + forward extension
      if(!heavy&&(a.dir==='side'||a.dir==='neutral')) return{x:this.x-4,y:this.y,w:this.w+8,h:this.h};
      // Up/down light: handled by projectiles
      if(!heavy&&(a.dir==='up'||a.dir==='down')) return null;
      // Side heavy: fire cone forward
      if(heavy&&(a.dir==='side'||a.dir==='neutral')){const fx=f>0?this.right-8:this.x-88+8;return{x:fx,y:this.cy-30,w:88,h:60};}
      // Down heavy: explosion AoE around player
      if(heavy&&a.dir==='down') return{x:this.cx-70,y:this.cy-60,w:140,h:100};
      // Up heavy: no direct hitbox (uses smoke cloud + self-launch)
      return null;
    }
    const heavy=a.type==='heavy', f=this.facing;
    // EDGE up heavy: mini sword handles all damage
    if(this.ch.id===4&&heavy&&a.dir==='up')return null;
    // PIERCE down heavy: spinning sweep — large centered hitbox
    if(this.ch.id===5&&heavy&&a.dir==='down'){
      const r=Math.round(this.ch.hRch*0.75);
      return{x:this.cx-r,y:this.cy-r,w:r*2,h:r*2};
    }
    // EDGE side heavy: overhead swing — tall sweeping hitbox
    if(this.ch.id===4&&heavy&&a.dir==='side'){
      const hx=f>0?this.cx-10:this.cx-80+10;
      return{x:hx,y:this.y-50,w:80,h:this.h+80};
    }
    // EDGE down heavy: dive — narrow hitbox below center
    if(this.ch.id===4&&heavy&&a.dir==='down'){
      return{x:this.cx-Math.round(this.ch.hSz*0.45),y:this.cy,w:Math.round(this.ch.hSz*0.9),h:Math.round(this.ch.hRch*0.5)};
    }
    let sz=heavy?this.ch.hSz:this.ch.lSz, reach=heavy?this.ch.hRch:this.ch.lRch;
    // EDGE combo scaling
    if(this.ch.id===4&&!heavy&&a.comboN){
      const cn=a.comboN;
      sz=cn===3?33:cn===2?48:sz; reach=cn===3?48:cn===2?82:reach;
    }
    // PIERCE 3rd-hit spear swing hitbox (tall sweep)
    else if(this.ch.id===5&&!heavy&&a.comboN===3){
      const hx=f>0?this.right-10:this.x-110+10;
      return{x:hx,y:this.y-44,w:110,h:this.h+60};
    }
    // BOLT 2-hit finisher hitbox
    else if(this.ch.maxCombo===2&&!heavy&&a.comboN===2){
      sz+=10; reach+=20;
    }
    switch(a.dir){
      case 'up':   return{x:this.cx-sz/2,y:this.y-reach+10,w:sz,h:reach};
      case 'down': return{x:this.cx-sz/2,y:this.bottom-10, w:sz,h:reach};
      default:{const hx=f>0?this.right-10:this.x-reach+10;return{x:hx,y:this.cy-sz/2,w:reach,h:sz};}
    }
  }

  land(target){
    if(target.hitImmune>0) return; // phased/immune target
    if(this.team>0&&target.team>0&&this.team===target.team) return; // no friendly fire
    // PRISTINE laser shield: reflect melee damage to attacker
    if(target.laserShieldActive){
      const heavy=this.atk.type==='heavy';
      const dmg=heavy?this.ch.hDmg:this.ch.lDmg;
      if(!this.isDummy) this.damage+=Math.round(dmg*(this.ch.def??1));
      this.hitFlash=14;
      const lag=heavy?6:4; target.hitlag=lag; this.hitlag=lag;
      addHitParticles(target.cx,target.cy,'#00ffff',true);
      shakeX+=(Math.random()-.5)*5;
      return;
    }
    if(target.shieldActive){
      addHitParticles(target.cx,target.cy,'#aaddff',false);
      playSfx({freq:700,freq2:300,type:'sine',decay:0.1,vol:0.15});
      const lag=this.atk.type==='heavy'?5:3; target.hitlag=lag; this.hitlag=lag; return;
    }
    // KING shield: if hit lands on the side the shield is facing, halve damage + knockback
    let kingShieldBlock=false;
    if(target.ch.id===14){
      const sa=target.kingShieldAngle||0;
      const sx=Math.cos(sa), sy=Math.sin(sa);
      const dx=this.cx-target.cx, dy=this.cy-target.cy;
      const dist=Math.hypot(dx,dy)||1;
      const dot=(dx/dist)*sx+(dy/dist)*sy;
      if(dot>0.35){ // attacker is on the shield-facing half (with small margin)
        kingShieldBlock=true;
      }
    }
    // Instant kill at DEATH_THRESHOLD (150%) — next hit after reaching threshold KOs
    if(target.damage>=DEATH_THRESHOLD&&!target.isDummy){instakill(target,target.cx,target.cy);return;}
    target.charging=false; target.chargeTime=0;
    const heavy=this.atk.type==='heavy', dir=this.atk.dir;
    let dmg=heavy?this.ch.hDmg:this.ch.lDmg, baseKB=heavy?this.ch.hKB:this.ch.lKB;
    // KING flaming sword: bonus damage and applies burn DoT
    let kingFireBonus=false;
    if(this.ch.id===14&&this.kingFireTimer>0){
      kingFireBonus=true;
      dmg=Math.round(dmg*1.5);
      baseKB*=1.15;
    }
    // GLITCH stolen weapon: use that character's actual stats
    if(this.ch.id===13&&heavy&&(this.atk.dir==='side'||this.atk.dir==='neutral')){
      if(this.glitchWeapon==='edge'){dmg=12;baseKB=13;}
      else if(this.glitchWeapon==='pierce'){dmg=14;baseKB=17;}
    }
    // chargeRatio scaling
    const cr=this.atk.chargeRatio||0;
    if(cr>0){dmg=Math.round(dmg*(1+cr*2));baseKB*=(1+cr*1.5);}
    // EDGE combo scaling
    if(this.ch.id===4&&!heavy&&this.atk.comboN){
      const cn=this.atk.comboN;
      dmg=Math.round(dmg*(cn===3?2.2:cn===2?1.3:1));
      baseKB=baseKB*(cn===3?1.4:cn===2?0.275:1);
    }
    // PIERCE 3rd-hit spear swing scaling
    else if(this.ch.id===5&&!heavy&&this.atk.comboN===3){
      dmg=Math.round(dmg*1.125); baseKB*=1.35;
    }
    // BOLT 2-hit finisher scaling
    else if(this.ch.maxCombo===2&&!heavy&&this.atk.comboN===2){
      dmg=Math.round(dmg*1.25); baseKB*=1.5;
    }
    // FACTORY side light: heavy gear swing = big knockback
    if(this.ch.id===12&&!heavy&&(dir==='side'||dir==='neutral')){
      baseKB*=3.0;
    }
    // KING shield block: halve damage and knockback before applying
    if(kingShieldBlock){
      dmg=Math.round(dmg*0.5);
      baseKB*=0.5;
      addHitParticles(target.cx,target.cy,'#ffd700',false);
      playSfx({freq:520,freq2:180,type:'square',decay:0.12,vol:0.16});
    }
    // BOULDER SLAM (heavy hits only): predict if knockback trajectory hits the boulder.
    // If yes, double damage and shatter the boulder so the victim flies through.
    let boulderSlam=false;
    if(heavy&&boulder&&!boulder.dead&&!target.isDummy){
      // Predicted post-KB velocity (mirrors the switch/cap below)
      const projDmg=Math.round(dmg*(target.ch.def??1));
      const km0=kbScale(target.damage+projDmg);
      const kb0=baseKB*km0/target.ch.weight, f0=this.facing;
      let pvx,pvy;
      switch(dir){
        case 'up':   pvx=f0*kb0*0.74; pvy=-kb0*0.67; break;
        case 'down': pvx=f0*kb0*0.69; pvy= kb0*0.72; break;
        default:     pvx=f0*kb0*1.2;  pvy=-kb0*0.05;
      }
      pvx=Math.max(-MAX_KB,Math.min(MAX_KB,pvx)); pvy=Math.max(-MAX_KB,Math.min(MAX_KB,pvy));
      // March the victim forward up to 30 frames (~0.5s) along the predicted trajectory
      let sx=target.x, sy=target.y, svx=pvx, svy=pvy;
      for(let step=0;step<30;step++){
        sx+=svx; sy+=svy;
        if(boulder.intersectsRect(sx,sy,target.w,target.h)){boulderSlam=true; break;}
        svx*=FLY_FRIC; svy*=FLY_FRIC;
        if(Math.abs(svx)<0.3&&Math.abs(svy)<0.3) break;
      }
    }
    if(boulderSlam){
      dmg=Math.round(dmg*2);
      boulder.shatter();
      addHitParticles(target.cx,target.cy,'#aa8855',true);
      shakeX+=(Math.random()-.5)*14; shakeY+=(Math.random()-.5)*14;
      playSfx({freq:160,freq2:60,type:'sawtooth',decay:0.3,vol:0.22});
    }
    if(!this.isDummy) target.damage+=Math.round(dmg*(target.ch.def??1));
    target.hitFlash=15;
    // KING flaming sword: apply burn DoT to victim
    if(kingFireBonus&&!target.isDummy){
      target.burnTimer=this.ch.kingBurnDuration||90; target.burnTick=0;
    }
    const km=kbScale(target.damage), kb=baseKB*km/target.ch.weight, f=this.facing;
    switch(dir){
      case 'up':   target.vx=f*kb*0.74;target.vy=-kb*0.67;break;
      case 'down': target.vx=f*kb*0.69; target.vy= kb*0.72;break;
      default:     target.vx=f*kb*1.2; target.vy=-kb*0.05;
    }
    // Velocity cap to prevent extreme launch speeds
    target.vx=Math.max(-MAX_KB,Math.min(MAX_KB,target.vx));
    target.vy=Math.max(-MAX_KB,Math.min(MAX_KB,target.vy));
    // PIERCE down+light: pogo - Pierce hops upward, target gets normal knockback
    if(this.ch.id===5&&!heavy&&dir==='down'&&this.atk.comboN===1){
      this.vy=this.ch.jumpF*0.85; this.onGnd=false; this.onPlat=false;
    }
    // UNSTABLE side light: dash — reduce damage slightly (body slam feel)
    if(this.ch.id===7&&!heavy&&(dir==='side'||dir==='neutral')){
      dmg=Math.round(dmg*0.7);
    }
    // UNSTABLE side heavy: apply burn DoT on hit
    if(this.ch.id===7&&heavy&&(dir==='side'||dir==='neutral')){
      target.burnTimer=120; target.burnTick=0;
    }
    // UNSTABLE down heavy: high damage, self-damage
    if(this.ch.id===7&&heavy&&dir==='down'){
      dmg=20; // override to ~20% damage
      if(!this.isDummy){this.damage+=8;this.hitFlash=10;} // self-damage
    }
    if(!target.isDummy&&heavy)target.hstun=Math.min(65,Math.floor(8+kb*2.5));
    target.onGnd=false;target.onPlat=false;
    const lag=heavy?6:4; target.hitlag=lag; this.hitlag=lag;
    const hb=this.hitbox(); if(hb)addHitParticles(hb.x+hb.w/2,hb.y+hb.h/2,this.ch.color,heavy);
    sfxHit(heavy);
    // ===== GRAB RELEASE =====
    // Case A: this attacker is grabbing target → the grab-release attack landed
    if(this.grabbing===target){
      this.grabbing=null; target.grabbedBy=null;
      this.grabT=0; target.grabT=0;
    }
    // Case B: target was grabbed by someone else and this hit landed → break that grab
    else if(target.grabbedBy&&target.grabbedBy!==this){
      const g=target.grabbedBy;
      g.grabbing=null; target.grabbedBy=null;
      g.grabT=0; target.grabT=0;
    }
    // Case C: target was the grabber and this hit broke them out of holding
    if(target.grabbing){
      const v=target.grabbing;
      v.grabbedBy=null; target.grabbing=null;
      v.grabT=0; target.grabT=0;
    }
  }

  checkKill(){
    if(this.dead||this.isDummy)return;
    // Hard outer safety net (extreme out-of-bounds in world coords)
    if(this.x>VIS_RIGHT+1500||this.right<VIS_LEFT-1500||this.y>VIS_BOT+1500||this.bottom<VIS_TOP-1500){this.die();return;}
    // Camera-based off-screen kill: if any part of the bounding box is inside the visible world rect, reset
    const onScreen=this.right>VIS_LEFT&&this.x<VIS_RIGHT&&this.bottom>VIS_TOP&&this.y<VIS_BOT;
    if(onScreen){this.offScreenTimer=0;}
    else{
      this.offScreenTimer++;
      if(this.offScreenTimer>=OFF_SCREEN_KILL_FRAMES) this.die();
    }
  }
  die(){this.stocks--;if(this.stocks<0)this.stocks=0;this.dead=true;this.damage=0;this.vx=this.vy=this.hstun=this.hitlag=0;this.atk=null;this.shieldActive=false;this.respawnT=150;this.offScreenTimer=0;
    if(this.grabbedBy){this.grabbedBy.grabbing=null;this.grabbedBy.grabT=0;this.grabbedBy=null;}
    if(this.grabbing){this.grabbing.grabbedBy=null;this.grabbing.grabT=0;this.grabbing=null;}
    // Drop held rock (stays in world as free-floating pickup)
    if(this.heldRock){this.heldRock.heldBy=null;this.heldRock.thrown=false;this.heldRock=null;}
    this.grabT=0;}
  doRespawn(){
    this.dead=false;this.x=this.spawnX-this.w/2;this.y=180;this.vx=this.vy=0;this.jLeft=2;this.onGnd=false;this.onPlat=false;this.offScreenTimer=0;
    // Release any grab partner: if I died while holding/being held, free the other side
    if(this.grabbedBy){this.grabbedBy.grabbing=null;this.grabbedBy.grabT=0;}
    if(this.grabbing){this.grabbing.grabbedBy=null;this.grabbing.grabT=0;}
    if(this.heldRock){this.heldRock.heldBy=null;this.heldRock.thrown=false;this.heldRock=null;}
    this.grabbing=null;this.grabbedBy=null;this.grabT=0;this.grabWhiffT=0;
    if(this.ch.id===1){this.crusherSideHeavyCD=0;this.crusherUpHeavyCD=0;this.crusherDownHeavyCD=0;}
    if(this.ch.id===6){this.armsLeft=4;this.rocketLightCD=0;this.rocketSideHeavyCD=0;this.rocketUpHeavyCD=0;for(const a of rocketArms)if(a.owner===this)a.dead=true;for(const m of rocketMines)if(m.owner===this)m.dead=true;}
    if(this.ch.id===10){this.flyActive=false;this.flyTimer=180;this.flyCooldown=0;this.laserShieldActive=false;this.laserShieldTimer=0;this.pristineRocketCd=0;for(const r of pristineRockets)if(r.owner===this)r.dead=true;}
    if(this.ch.id===11){this.magmaFuel=this.ch.flameFuelMax||180;for(const fp of firePebbles)if(fp.owner===this)fp.dead=true;}
    if(this.ch.id===12){this.factoryBoltCD=0;this.factoryZapCD=0;for(const b of factoryBolts)if(b.owner===this)b.dead=true;for(const g of factoryGears)if(g.owner===this)g.dead=true;}
    if(this.ch.id===13){this.glitchPhaseTimer=0;this.glitchGhost=false;this.glitchWeapon=null;}
    if(this.ch.id===14){this.kingShieldAngle=0;this.kingShieldRotateT=0;this.kingFireTimer=0;}
  }

  draw(){
    if(this.dead)return;
    const flash=this.hitFlash>0&&Math.floor(this.hitFlash/2)%2===0;

    // ---- Grab energy line drawn behind everything (only from grabber side to avoid double-draw) ----
    if(this.grabbing&&!this.grabbing.dead){
      const t=this.grabbing;
      const lockoutLeft=Math.max(0,GRAB_LOCKOUT_FRAMES-this.grabT);
      const tFade=lockoutLeft>0?(1-lockoutLeft/GRAB_LOCKOUT_FRAMES):1;
      ctx.save();
      ctx.globalCompositeOperation='lighter';
      const pulse=Math.sin(frame*0.4)*0.3+0.7;
      // Thick energy beam between hands
      ctx.strokeStyle=`rgba(255,200,80,${(0.45+0.4*pulse)*tFade})`;
      ctx.lineWidth=8; ctx.lineCap='round';
      ctx.shadowBlur=18; ctx.shadowColor='#ffaa44';
      ctx.beginPath(); ctx.moveTo(this.cx,this.cy); ctx.lineTo(t.cx,t.cy); ctx.stroke();
      // Inner bright core
      ctx.strokeStyle=`rgba(255,255,200,${(0.7+0.25*pulse)*tFade})`;
      ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(this.cx,this.cy); ctx.lineTo(t.cx,t.cy); ctx.stroke();
      ctx.shadowBlur=0;
      // Crackling sparks along the line
      const dx=t.cx-this.cx, dy=t.cy-this.cy, dist=Math.hypot(dx,dy)||1;
      const ux=dx/dist, uy=dy/dist; // unit
      const px=-uy, py=ux;          // perpendicular
      ctx.fillStyle=`rgba(255,240,120,${0.85*tFade})`;
      for(let i=0;i<5;i++){
        const f=((i/5)+(frame*0.025))%1;
        const sx=this.cx+ux*dist*f+px*Math.sin(frame*0.3+i*1.7)*4;
        const sy=this.cy+uy*dist*f+py*Math.sin(frame*0.3+i*1.7)*4;
        ctx.beginPath();ctx.arc(sx,sy,1.8,0,Math.PI*2);ctx.fill();
      }
      // Auto-release timer ring above the pair midpoint
      const mx=(this.cx+t.cx)/2, my=(this.cy+t.cy)/2-30;
      const rT=this.grabT/GRAB_AUTO_RELEASE_FRAMES;
      ctx.strokeStyle=`rgba(255,140,40,${0.6*tFade})`;
      ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.arc(mx,my,9,-Math.PI/2,-Math.PI/2+rT*Math.PI*2); ctx.stroke();
      ctx.restore();
    }
    // ---- Whiff: brief outward swipe ring when an empty grab was thrown ----
    if(this.grabWhiffT>GRAB_WHIFF_CD-10){
      const wt=(GRAB_WHIFF_CD-this.grabWhiffT)/10; // 0->1 in first 10 frames
      ctx.save();
      ctx.strokeStyle=`rgba(255,220,140,${(1-wt)*0.65})`;
      ctx.lineWidth=3; ctx.lineCap='round';
      ctx.shadowBlur=10; ctx.shadowColor='#ffcc66';
      const r=GRAB_RANGE*wt;
      const f=this.facing;
      // Forward arc (in front of player)
      ctx.beginPath();
      ctx.arc(this.cx+f*8,this.cy,r,f>0?-Math.PI*0.4:Math.PI*0.6,f>0?Math.PI*0.4:Math.PI*1.4);
      ctx.stroke();
      ctx.restore();
    }

    // ---- Flight animation: thruster flames drawn FIRST (behind character) in world frame ----
    if(!this.isDummy) this.drawThrusters();

    ctx.save();
    ctx.translate(this.cx,this.cy);
    if(this.facing<0)ctx.scale(-1,1);

    // Flight pose: lean into movement direction + subtle idle bob + squash on big vertical thrust
    if(!this.isDummy&&!this.shieldActive){
      const fwdV = this.vx*this.facing;             // signed forward speed in local frame
      const tiltMax = 0.45;
      const tilt = Math.max(-tiltMax,Math.min(tiltMax, fwdV/MAX_FLY_SPEED * 0.55));
      // Vertical lean: nose up when rising, nose down when falling (subtle)
      const vTilt = Math.max(-0.18,Math.min(0.18, this.vy/MAX_FLY_SPEED * -0.18));
      ctx.rotate(tilt + vTilt);
      // Idle hover bob (only when moving slowly)
      const spd = Math.hypot(this.vx,this.vy);
      if(spd<1.5 && this.hstun===0 && !this.atk){
        const bob = Math.sin(frame*0.09)*1.6;
        ctx.translate(0,bob);
      }
      // Squash/stretch on strong vertical motion
      const vyN = Math.max(-1,Math.min(1, this.vy/MAX_FLY_SPEED));
      const sy = 1 + Math.abs(vyN)*0.07*(vyN<0?1:-1); // rising stretches, falling squashes
      const sx = 1 - Math.abs(vyN)*0.04*(vyN<0?1:-1);
      ctx.scale(sx,sy);
    }

    if(flash)ctx.globalAlpha=0.22;
    if(this.isDummy)drawDummy(ctx,this.ch,this.w,this.h);
    else drawCharacter(ctx,this.ch,this.w,this.h,this.atk,this.onGnd||this.onPlat,this.wf,{armsLeft:this.armsLeft,glitchGhost:this.glitchGhost,glitchPhaseTimer:this.glitchPhaseTimer,glitchWeapon:this.glitchWeapon,kingShieldAngle:this.kingShieldAngle,kingFireTimer:this.kingFireTimer,kingFacing:this.facing});
    if(!this.isDummy)drawAttackArc(this.atk,this.ch,this.w,this.h);
    ctx.globalAlpha=1;
    ctx.restore();


    // Combo window indicator: pulsing dots above character
    if(this.atk&&this.ch.maxCombo>1&&this.atk.type==='light'&&this.atk.frame>=this.atk.su&&(this.atk.comboN||1)<this.ch.maxCombo){
      const pulse=Math.abs(Math.sin(frame*0.3));
      const mc=this.ch.maxCombo, done=(this.atk.comboN||1);
      ctx.save();
      ctx.shadowBlur=10+pulse*8; ctx.shadowColor=this.ch.color;
      for(let i=0;i<mc;i++){
        const isDone=i<done;
        ctx.globalAlpha=isDone?0.4:(0.65+pulse*0.35);
        ctx.fillStyle=isDone?'#555':this.ch.color;
        ctx.beginPath(); ctx.arc(this.cx+(i-mc/2+0.5)*14,this.y-22,4,0,Math.PI*2); ctx.fill();
        if(!isDone){
          ctx.strokeStyle=this.ch.color; ctx.lineWidth=1.5;
          ctx.globalAlpha=pulse*0.8;
          ctx.beginPath(); ctx.arc(this.cx+(i-mc/2+0.5)*14,this.y-22,8,0,Math.PI*2); ctx.stroke();
        }
      }
      ctx.restore();
    }

    // Danger aura at DEATH_THRESHOLD (150%) — visible kill-warning telegraph
    if(this.damage>=DEATH_THRESHOLD&&!this.isDummy){
      const pulse=Math.sin(frame*0.25)*0.4+0.6;
      const flash=Math.floor(frame/5)%2===0;
      ctx.save(); ctx.translate(this.cx,this.cy);
      const aura=ctx.createRadialGradient(0,0,8,0,0,this.w*1.1+pulse*10);
      aura.addColorStop(0,`rgba(255,0,60,${0.28+pulse*0.18})`);
      aura.addColorStop(1,'rgba(180,0,0,0)');
      ctx.fillStyle=aura; ctx.beginPath(); ctx.ellipse(0,0,this.w*1.1+pulse*10,this.h*0.7+pulse*6,0,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=20+pulse*14; ctx.shadowColor='#ff0040';
      ctx.strokeStyle=`rgba(255,${flash?180:60},${flash?180:60},${0.55+pulse*0.35})`; ctx.lineWidth=2+pulse*2;
      ctx.beginPath(); ctx.ellipse(0,0,this.w*0.85+pulse*6,this.h*0.55+pulse*4,0,0,Math.PI*2); ctx.stroke();
      ctx.restore();
      // "!!!" label above head
      ctx.save();
      ctx.font=`bold ${12+Math.floor(pulse*4)}px monospace`;
      ctx.textAlign='center';
      ctx.shadowBlur=10; ctx.shadowColor='#ff0040';
      ctx.fillStyle=flash?'#ffffff':'#ff0040';
      ctx.globalAlpha=0.9;
      ctx.fillText('!!!',this.cx,this.y-28-pulse*4);
      ctx.restore();
    }

    // Charge aura
    if(this.charging){
      const cr=Math.min(1,this.chargeTime/240);
      ctx.save(); ctx.translate(this.cx,this.cy);
      const aura=ctx.createRadialGradient(0,0,10,0,0,this.w*0.9+cr*20);
      aura.addColorStop(0,`rgba(255,200,50,${0.25+cr*0.35})`);
      aura.addColorStop(1,'rgba(255,120,0,0)');
      ctx.fillStyle=aura; ctx.beginPath(); ctx.ellipse(0,0,this.w*0.9+cr*20,this.h*0.6+cr*14,0,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=18+cr*20; ctx.shadowColor='#ffaa00';
      ctx.strokeStyle=`rgba(255,200,0,${0.4+cr*0.5})`; ctx.lineWidth=2+cr*3;
      ctx.beginPath(); ctx.ellipse(0,0,this.w*0.7+cr*10,this.h*0.5+cr*8,0,0,Math.PI*2); ctx.stroke();
      ctx.restore();
      // Charge bar above head
      const bw=this.w+10, bx2=this.cx-bw/2, by2=this.y-14;
      ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(bx2,by2,bw,5);
      ctx.fillStyle=`hsl(${40-cr*40},100%,55%)`; ctx.fillRect(bx2,by2,bw*cr,5);
    }

    // Shield visual
    if(this.shieldActive){
      const r=Math.max(this.w,this.h)*0.76;
      const tf=this.shieldTimer/SHIELD_FRAMES;
      ctx.save(); ctx.translate(this.cx,this.cy);
      const g=ctx.createRadialGradient(0,0,r*0.5,0,0,r*1.3);
      g.addColorStop(0,'rgba(140,200,255,0.18)');g.addColorStop(1,'rgba(100,160,255,0)');
      ctx.fillStyle=g;ctx.globalAlpha=tf;ctx.beginPath();ctx.arc(0,0,r*1.3,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=20;ctx.shadowColor='#88ccff';
      ctx.strokeStyle='#aaddff';ctx.lineWidth=3+tf*2;ctx.globalAlpha=0.65+tf*0.3;
      ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }
    // Shield recharge bar
    if(this.shieldCooldown>0){
      const pct=1-this.shieldCooldown/(this.ch.shieldCool??SHIELD_COOLDOWN);
      ctx.fillStyle='#334';ctx.fillRect(this.x,this.bottom+4,this.w,3);
      ctx.fillStyle='#66aaff';ctx.fillRect(this.x,this.bottom+4,this.w*pct,3);
    }
    // MAGMA: flamethrower fuel bar
    if(this.ch.id===11){
      const fuelMax=this.ch.flameFuelMax||180;
      const pct=this.magmaFuel/fuelMax;
      const barY=this.bottom+(this.shieldCooldown>0?10:4);
      ctx.fillStyle='#220500'; ctx.fillRect(this.x,barY,this.w,3);
      ctx.fillStyle=pct<0.25?'#ff2200':pct<0.6?'#ff6600':'#ff4400';
      ctx.fillRect(this.x,barY,this.w*pct,3);
    }
    // PRISTINE: jetpack fuel bar (shows whenever fuel is not full)
    if(this.ch.id===10&&this.flyTimer<180){
      const barY=this.bottom+(this.shieldCooldown>0?10:4);
      const pct=this.flyTimer/180;
      ctx.fillStyle='#001122';ctx.fillRect(this.x,barY,this.w,3);
      ctx.fillStyle=this.flyActive?'#00ffff':pct<0.25?'#004455':'#007799';
      ctx.fillRect(this.x,barY,this.w*pct,3);
    }
    // FACTORY: bolt and zap cooldown bars
    if(this.ch.id===12){
      let barOff=this.shieldCooldown>0?10:4;
      if(this.factoryBoltCD>0){
        const pct=1-this.factoryBoltCD/(this.ch.boltCDMax||300);
        ctx.fillStyle='#112233';ctx.fillRect(this.x,this.bottom+barOff,this.w,3);
        ctx.fillStyle='#00ccff';ctx.fillRect(this.x,this.bottom+barOff,this.w*pct,3);
        barOff+=6;
      }
      if(this.factoryZapCD>0){
        const pct=1-this.factoryZapCD/(this.ch.zapCDMax||180);
        ctx.fillStyle='#112233';ctx.fillRect(this.x,this.bottom+barOff,this.w,3);
        ctx.fillStyle='#0088ff';ctx.fillRect(this.x,this.bottom+barOff,this.w*pct,3);
      }
    }
    // PRISTINE laser shield visual
    if(this.ch.id===10&&this.laserShieldActive){
      const t=this.laserShieldTimer/60;
      const pulse=Math.sin(frame*0.25)*0.2+0.8;
      const r=Math.max(this.w,this.h)*0.78;
      ctx.save();ctx.translate(this.cx,this.cy);
      ctx.shadowBlur=28;ctx.shadowColor='#00ffff';
      ctx.strokeStyle=`rgba(0,255,255,${pulse*t})`;ctx.lineWidth=5;
      ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
      ctx.lineWidth=2;ctx.globalAlpha=pulse*0.4*t;
      ctx.beginPath();ctx.arc(0,0,r*1.25,0,Math.PI*2);ctx.stroke();
      // Hex segment lines
      ctx.lineWidth=1.5;
      for(let i=0;i<6;i++){
        const a=i/6*Math.PI*2+frame*0.03,a2=(i+1)/6*Math.PI*2+frame*0.03;
        ctx.globalAlpha=pulse*0.3*t;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a)*r*0.55,Math.sin(a)*r*0.55);
        ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);
        ctx.lineTo(Math.cos(a2)*r,Math.sin(a2)*r);
        ctx.stroke();
      }
      ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.restore();
    }
    // PRISTINE flight aura
    if(this.ch.id===10&&this.flyActive){
      const pulse=Math.sin(frame*0.18)*0.3+0.7;
      ctx.save();ctx.shadowBlur=18;ctx.shadowColor='#00ffff';
      ctx.strokeStyle=`rgba(0,255,255,${pulse*0.55})`;ctx.lineWidth=2;ctx.lineCap='round';
      // Wing energy streams on sides
      ctx.beginPath();ctx.moveTo(this.cx-12,this.cy+4);
      ctx.bezierCurveTo(this.cx-28,this.cy-6,this.cx-42,this.cy+10,this.cx-52,this.cy-2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(this.cx+12,this.cy+4);
      ctx.bezierCurveTo(this.cx+28,this.cy-6,this.cx+42,this.cy+10,this.cx+52,this.cy-2);ctx.stroke();
      // Thrust jets below
      ctx.lineWidth=3.5;
      const jlen=11+pulse*4;
      ctx.beginPath();ctx.moveTo(this.cx-8,this.bottom);ctx.lineTo(this.cx-8,this.bottom+jlen);ctx.stroke();
      ctx.beginPath();ctx.moveTo(this.cx+8,this.bottom);ctx.lineTo(this.cx+8,this.bottom+jlen);ctx.stroke();
      ctx.shadowBlur=0;ctx.restore();
    }
    if(this.isDummy){
      ctx.fillStyle='rgba(255,255,255,0.45)';ctx.font='bold 11px monospace';ctx.textAlign='center';
      ctx.fillText('DUMMY',this.cx,this.y-8);
    }
  }

  drawThrusters(){
    // Flight thruster flames drawn in world frame, behind the character.
    // Direction: opposite of velocity (or fixed below if hovering).
    const ch=this.ch;
    const spd=Math.hypot(this.vx,this.vy);
    const speeding=spd>0.5;
    const boosting=this.dashActive;
    // Thrust direction in world frame: opposite to velocity. Hover -> straight down.
    let tx,ty;
    if(speeding){tx=-this.vx/spd; ty=-this.vy/spd;}
    else{tx=0; ty=1;}
    // Flame intensity scales with speed and dash
    const intens = boosting ? 1.4 : Math.min(1, spd/MAX_FLY_SPEED + 0.18);
    if(intens<0.2) return;
    // Size scaling: average of width/height vs a 46x58 baseline (BOLT)
    const sizeScale = ((this.w/46) + (this.h/58)) * 0.5;
    const len = ((boosting?56:32) + spd*2.6) * sizeScale;
    const wid = ((boosting?18:13) + spd*0.7) * sizeScale;
    const flicker = 0.7 + Math.random()*0.4;
    // Two emitters near the bottom-rear of the character (left & right thruster nozzles)
    const offset = this.w*0.22;
    // Compute perpendicular to thrust dir to space the two nozzles
    const px = -ty, py = tx;
    // Origin: slightly inside the body, opposite the thrust direction
    const ox = this.cx - tx*this.w*0.05;
    const oy = this.cy - ty*this.h*0.05 + this.h*0.18; // bias slightly low (jet vents)
    const cores=[[ox+px*offset,oy+py*offset],[ox-px*offset,oy-py*offset]];
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    for(const [sx,sy] of cores){
      const ex=sx+tx*len*flicker, ey=sy+ty*len*flicker;
      // Outer glow
      const grad=ctx.createLinearGradient(sx,sy,ex,ey);
      grad.addColorStop(0,`rgba(255,210,120,${0.55*intens})`);
      grad.addColorStop(0.5,`rgba(255,140,40,${0.35*intens})`);
      grad.addColorStop(1,'rgba(255,60,0,0)');
      ctx.strokeStyle=grad;
      ctx.lineWidth=wid*1.8;
      ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke();
      // Inner core
      const grad2=ctx.createLinearGradient(sx,sy,ex,ey);
      grad2.addColorStop(0,`rgba(255,255,240,${0.85*intens})`);
      grad2.addColorStop(0.6,`rgba(255,200,120,${0.5*intens})`);
      grad2.addColorStop(1,'rgba(255,120,40,0)');
      ctx.strokeStyle=grad2;
      ctx.lineWidth=wid*0.7;
      ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke();
    }
    // Speed lines (small streaks behind) when fast or dashing
    if(intens>0.6){
      ctx.strokeStyle=`rgba(255,255,255,${0.18*intens})`;
      ctx.lineWidth=1;
      for(let i=0;i<3;i++){
        const r=Math.random();
        const lx=ox + tx*(len*0.6+r*len*0.6) + (Math.random()-0.5)*8;
        const ly=oy + ty*(len*0.6+r*len*0.6) + (Math.random()-0.5)*8;
        const lex=lx+tx*(4+Math.random()*5), ley=ly+ty*(4+Math.random()*5);
        ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(lex,ley); ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawOffScreenIndicator(){
    // Drawn in screen-space (call AFTER camera ctx.restore())
    if(this.dead||this.isDummy) return;
    if(this.offScreenTimer<=0) return;
    // Convert world center to screen coords
    const sx=(this.cx-W/2)*CAM_SCALE_X + W/2;
    const sy=(this.cy-H/2)*CAM_SCALE_Y + H/2;
    const m=24;
    const ex=Math.max(m,Math.min(W-m,sx));
    const ey=Math.max(m,Math.min(H-m,sy));
    const remain=Math.max(0,OFF_SCREEN_KILL_FRAMES-this.offScreenTimer);
    const sec=(remain/60).toFixed(1);
    const flash=Math.floor(frame/4)%2===0;
    ctx.save();
    const dx=sx-ex, dy=sy-ey;
    const ang=Math.atan2(dy,dx);
    ctx.translate(ex,ey);
    ctx.rotate(ang);
    ctx.fillStyle=flash?'#ffffff':'#ff0055';
    ctx.shadowBlur=12; ctx.shadowColor='#ff0055';
    ctx.beginPath();
    ctx.moveTo(14,0); ctx.lineTo(-6,-9); ctx.lineTo(-2,0); ctx.lineTo(-6,9); ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.fillStyle=flash?'#ffffff':'#ff0055';
    ctx.shadowBlur=8; ctx.shadowColor='#ff0055';
    ctx.font='bold 11px monospace';
    ctx.textAlign='center';
    const tag=`P${this.pn} ${sec}s`;
    let tx=ex, ty=ey;
    if(ex<m+2) tx=ex+22;
    else if(ex>W-m-2) tx=ex-22;
    if(ey<m+2) ty=ey+22;
    else if(ey>H-m-2) ty=ey-12;
    ctx.fillText(tag,tx,ty);
    ctx.restore();
  }

  drawHUD(side,slot=0){
    const bh=78, bw=205;
    const x=side==='left'?10:W-215, y=10+slot*(bh+4);
    rrFill(x,y,bw,bh,9,'rgba(0,0,0,0.78)');
    rrStroke(x,y,bw,bh,9,this.dead?'#333':this.ch.color,2.5);
    ctx.fillStyle=this.ch.color;ctx.font='bold 13px monospace';ctx.textAlign='left';
    const label=this.isDummy?'DUMMY':`P${this.pn}: ${this.ch.name}`;
    ctx.fillText(label,x+10,y+22);
    if(this.isDummy){
      ctx.fillStyle='#888';ctx.font='bold 20px monospace';ctx.fillText(`${Math.round(this.damage)}%`,x+10,y+56);
      ctx.fillStyle='#444';ctx.font='10px monospace';ctx.fillText('[R] reset dummy',x+10,y+70);return;
    }
    const pct=Math.round(this.damage);
    const dangerFlash=pct>=DEATH_THRESHOLD&&Math.floor(frame/6)%2===0;
    ctx.fillStyle=pct>=DEATH_THRESHOLD?(dangerFlash?'#ffffff':'#ff0055'):pct<50?'#fff':pct<100?'#ffaa00':'#ff2200';
    if(pct>=DEATH_THRESHOLD){ctx.shadowBlur=14;ctx.shadowColor='#ff0055';}
    ctx.font='bold 32px monospace';ctx.fillText(`${pct}%`,x+10,y+62);
    ctx.shadowBlur=0;
    for(let i=0;i<this.stocks;i++){ctx.fillStyle=this.ch.color;ctx.beginPath();ctx.arc(x+bw-14-i*22,y+62,8,0,Math.PI*2);ctx.fill();}
    // Shield ready indicator in HUD
    const shieldY=y+22, shieldR=7;
    if(this.shieldCooldown>0){
      const pct2=1-this.shieldCooldown/(this.ch.shieldCool??SHIELD_COOLDOWN);
      ctx.strokeStyle='#226';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+bw-14,shieldY,shieldR,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='#66aaff';ctx.beginPath();ctx.arc(x+bw-14,shieldY,shieldR,-Math.PI/2,-Math.PI/2+pct2*Math.PI*2);ctx.stroke();
    } else {
      ctx.fillStyle='#66aaff';ctx.beginPath();ctx.arc(x+bw-14,shieldY,shieldR,0,Math.PI*2);ctx.fill();
    }
  }
}

// ---- ROCKET Arm Projectiles ----
const rocketArms=[], rocketMines=[];

function explodeMines(owner,target){
  let count=0;
  for(let i=rocketMines.length-1;i>=0;i--){
    const m=rocketMines[i];
    if(!m.dead&&m.owner===owner){addHitParticles(m.x,m.y,owner.ch.color,true);m.dead=true;count++;}
  }
  owner.armsLeft=Math.min(4,owner.armsLeft+count);
  if(target&&!target.shieldActive){
    if(target.damage>=DEATH_THRESHOLD&&!target.isDummy){instakill(target,target.cx,target.cy);return;}
    target.damage+=Math.round(14*(target.ch.def??1)); target.hitFlash=14; target.charging=false; target.chargeTime=0;
    const km=kbScale(target.damage), kb=12*km/target.ch.weight;
    target.vx=owner.facing*kb; target.vy=-kb*0.45;
    target.vx=Math.max(-MAX_KB,Math.min(MAX_KB,target.vx));
    target.vy=Math.max(-MAX_KB,Math.min(MAX_KB,target.vy));
    target.hstun=Math.min(55,Math.floor(8+kb*2.2));
    target.onGnd=false; target.onPlat=false; target.hitlag=5;
  } else if(target&&target.shieldActive){
    addHitParticles(target.cx,target.cy,'#aaddff',false);
  }
}

class RocketArm {
  constructor(x,y,vx,vy,owner,heavy){
    this.x=x; this.y=y; this.vx=vx; this.vy=vy;
    this.owner=owner; this.heavy=heavy; this.dead=false;
    this.goingOut=true; this.hitOut=false; this.hitBack=false;
    this.speed=Math.hypot(vx,vy);
    this.maxDist=heavy?195:231;
    this.distTraveled=0;
  }
  hitArm(target){
    if(target.shieldActive){addHitParticles(target.cx,target.cy,'#aaddff',false);return;}
    if(target.damage>=DEATH_THRESHOLD&&!target.isDummy){instakill(target,this.x,this.y);this.dead=true;return;}
    const mult=this.dmgMult||1;
    const kbMult=this.kbMult||mult;
    const dmg=Math.round((this.heavy?Math.round(5*2.5):5)*mult), kb=(this.heavy?4*2.5:4)*kbMult;
    target.damage+=Math.round(dmg*(target.ch.def??1)); target.hitFlash=14; target.charging=false; target.chargeTime=0;
    const km=kbScale(target.damage), kbS=kb*km/target.ch.weight;
    const kDir=this.goingOut?(this.vx>0?1:-1):this.owner.facing;
    target.vx=kDir*kbS; target.vy=-kbS*0.15;
    target.vx=Math.max(-MAX_KB,Math.min(MAX_KB,target.vx));
    target.vy=Math.max(-MAX_KB,Math.min(MAX_KB,target.vy));
    if(this.heavy) target.hstun=Math.min(40,Math.floor(5+kbS*2));
    target.onGnd=false; target.onPlat=false; target.hitlag=3;
    addHitParticles(this.x,this.y,this.owner.ch.color,this.heavy);
  }
  update(players){
    if(this.dead)return;
    if(this.goingOut){
      this.x+=this.vx; this.y+=this.vy;
      this.distTraveled+=this.speed;
      if(this.distTraveled>=this.maxDist){
        this.goingOut=false;
        // Start returning toward owner
        const dx=this.owner.cx-this.x, dy=this.owner.cy-this.y;
        const d=Math.hypot(dx,dy)||1;
        this.vx=(dx/d)*this.speed; this.vy=(dy/d)*this.speed;
      }
    } else {
      const dx=this.owner.cx-this.x, dy=this.owner.cy-this.y;
      const d=Math.hypot(dx,dy);
      if(d<14){this.dead=true; this.owner.armsLeft=Math.min(4,this.owner.armsLeft+(this.dual?2:1)); return;}
      this.vx=(dx/d)*this.speed; this.vy=(dy/d)*this.speed;
      this.x+=this.vx; this.y+=this.vy;
    }
    for(const p of players){
      if(p===this.owner||sameTeam(p,this.owner)||p.dead||p.hitlag>0||p.hitImmune>0)continue;
      if(this.x-8<p.right&&this.x+8>p.x&&this.y-8<p.bottom&&this.y+8>p.y){
        if(this.goingOut&&!this.hitOut){this.hitArm(p);this.hitOut=true;p.hitImmune=6;}
        else if(!this.goingOut&&!this.hitBack&&!this.hitOut){this.hitArm(p);this.hitBack=true;}
      }
    }
  }
  draw(){
    if(this.dead)return;
    const ch=this.owner.ch, ang=Math.atan2(this.vy,this.vx);
    ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(ang);
    ctx.shadowBlur=10; ctx.shadowColor=ch.eyeCol;
    const offsets=this.dual?[-8,8]:[0];
    for(const oy of offsets){
      ctx.fillStyle=ch.color; ctx.fillRect(-16,oy-5,28,10);
      ctx.fillStyle=ch.accent; ctx.beginPath(); ctx.arc(-4,oy,6,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=this.heavy?'#ffffff':ch.eyeCol;
      ctx.beginPath(); ctx.arc(14,oy,7,0,Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur=0; ctx.restore();
  }
}

class RocketMine {
  constructor(x,y,side,owner){
    this.x=x; this.y=y; this.side=side; this.owner=owner;
    this.timer=180; this.dead=false;
  }
  update(players){
    if(this.dead)return;
    this.timer--;
    // Hover beside owner
    this.x=this.owner.cx+this.side*55;
    this.y=this.owner.cy;
    if(this.timer<=0){this.dead=true; this.owner.armsLeft=Math.min(4,this.owner.armsLeft+1); return;}
    for(const p of players){
      if(p===this.owner||sameTeam(p,this.owner)||p.dead||p.hitlag>0)continue;
      if(Math.hypot(p.cx-this.x,p.cy-this.y)<30){explodeMines(this.owner,p);return;}
    }
  }
  draw(){
    if(this.dead)return;
    const ch=this.owner.ch, pulse=0.55+Math.sin(frame*0.18)*0.45;
    const alpha=this.timer<60?Math.max(0.2,this.timer/60):1;
    ctx.save(); ctx.globalAlpha=alpha; ctx.translate(this.x,this.y);
    ctx.shadowBlur=14*pulse; ctx.shadowColor=ch.eyeCol;
    ctx.fillStyle=ch.color; ctx.beginPath(); ctx.arc(0,0,10,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=ch.eyeCol; ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=ch.eyeCol; ctx.lineWidth=2; ctx.globalAlpha=pulse*alpha;
    ctx.beginPath(); ctx.arc(0,0,17,0,Math.PI*2); ctx.stroke();
    ctx.shadowBlur=0; ctx.restore();
  }
}

// ---- FACTORY Projectiles ----
const factoryBolts=[], factoryGears=[], factoryZaps=[];
function drawGearShape(ctx,r,teeth,fillCol,strokeCol){
  ctx.fillStyle=fillCol; ctx.strokeStyle=strokeCol; ctx.lineWidth=2;
  ctx.beginPath();
  for(let i=0;i<teeth*2;i++){
    const a=i*Math.PI/teeth, rad=i%2===0?r:r*0.68;
    i===0?ctx.moveTo(Math.cos(a)*rad,Math.sin(a)*rad):ctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle=strokeCol;
  ctx.beginPath(); ctx.arc(0,0,r*0.32,0,Math.PI*2); ctx.fill();
}
class FactoryBolt {
  constructor(x,y,vx,vy,owner){
    this.x=x-9; this.y=y-8; this.vx=vx; this.vy=vy;
    this.owner=owner; this.dead=false;
    this.w=18; this.h=16; this.dmg=8; this.kb=7; this.life=360; this.frame=0;
  }
  get cx(){return this.x+9;} get cy(){return this.y+8;}
  update(players){
    if(this.dead)return;
    this.frame++; if(this.frame>this.life){this.dead=true;return;}
    // Home toward enemy
    const target=players.find(p=>p!==this.owner&&!sameTeam(p,this.owner)&&!p.dead)||null;
    if(target){
      const dx=target.cx-this.cx, dy=target.cy-this.cy;
      const targetAngle=Math.atan2(dy,dx);
      const currentAngle=Math.atan2(this.vy,this.vx);
      let diff=targetAngle-currentAngle;
      while(diff>Math.PI)diff-=Math.PI*2; while(diff<-Math.PI)diff+=Math.PI*2;
      const newAngle=currentAngle+Math.sign(diff)*Math.min(Math.abs(diff),0.07);
      const spd=Math.hypot(this.vx,this.vy)||4.5;
      this.vx=Math.cos(newAngle)*spd; this.vy=Math.sin(newAngle)*spd;
    }
    this.x+=this.vx; this.y+=this.vy;
    if(this.x<-120||this.x>W+120||this.y>H+120){this.dead=true;return;}
    // Enemy projectiles destroy the Bolt
    const pb0={x:this.x,y:this.y,w:this.w,h:this.h};
    for(const arr of [bullets,rocketArms,knives,throwSwords,firePebbles,pristineRockets,factoryBolts,factoryGears,factoryZaps]){
      for(const proj of arr){
        if(!proj||proj===this||proj.dead)continue;
        if(proj.owner===this.owner||sameTeam(proj.owner,this.owner))continue;
        const px=proj.x??proj.cx-proj.r, py=proj.y??proj.cy-proj.r;
        const pw=proj.w??(proj.r*2), ph=proj.h??(proj.r*2);
        if(aabb(pb0,{x:px,y:py,w:pw,h:ph})){this.dead=true;addHitParticles(this.cx,this.cy,'#aaaaaa',false);return;}
      }
    }
    for(const p of players){
      if(p===this.owner||sameTeam(p,this.owner)||p.dead)continue;
      const pb={x:this.x,y:this.y,w:this.w,h:this.h};
      // Enemy active melee hitbox destroys Bolt
      const hb=p.atk?p.hitbox():null;
      if(hb&&aabb(hb,pb)){this.dead=true;addHitParticles(this.cx,this.cy,'#aaaaaa',false);return;}
      if(!aabb(pb,{x:p.x,y:p.y,w:p.w,h:p.h}))continue;
      if(p.shieldActive){addHitParticles(this.cx,this.cy,'#aaddff',false);this.dead=true;return;}
      if(p.laserShieldActive){this.owner.damage+=Math.round(this.dmg*(this.owner.ch.def??1));this.owner.hitFlash=12;this.dead=true;return;}
      if(p.damage>=DEATH_THRESHOLD&&!p.isDummy){instakill(p,this.cx,this.cy);this.dead=true;return;}
      p.damage+=Math.round(this.dmg*(p.ch.def??1)); p.hitFlash=14; p.charging=false; p.chargeTime=0;
      const km=kbScale(p.damage), kb=this.kb*km/p.ch.weight;
      p.vx=this.vx>0?kb:-kb; p.vy=-kb*0.15;
      p.vx=Math.max(-MAX_KB,Math.min(MAX_KB,p.vx)); p.vy=Math.max(-MAX_KB,Math.min(MAX_KB,p.vy));
      p.onGnd=false; p.onPlat=false;
      p.hitlag=4; this.owner.hitlag=0;
      addHitParticles(this.cx,this.cy,'#00ccff',false); this.dead=true; return;
    }
  }
  draw(){
    if(this.dead)return;
    ctx.save(); ctx.translate(this.cx,this.cy);
    // Body
    rrFill(-9,-7,18,14,4,'#555');
    // Glowing eyes
    ctx.shadowBlur=6; ctx.shadowColor='#00ccff'; ctx.fillStyle='#00ccff';
    ctx.beginPath(); ctx.ellipse(-3,-1,3,2.5,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4,-1,3,2.5,0,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    // Wing nubs
    ctx.fillStyle='#888';
    ctx.beginPath(); ctx.ellipse(-10,1,5,3,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(10,1,5,3,0,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
}
class FactoryGear {
  constructor(x,y,owner){
    this.x=x; this.y=y; this.vx=0; this.vy=-10;
    this.owner=owner; this.dead=false; this.r=16;
    this.dmg=7; this.kb=7; this.hitUp=false; this.hitDown=false;
    this.goingUp=true; this.spawnY=y; this.frame=0;
  }
  update(players){
    if(this.dead)return;
    this.frame++;
    if(this.vy>=0) this.goingUp=false;
    this.vy+=0.55; this.y+=this.vy;
    if(!this.goingUp&&this.y>=this.spawnY){this.dead=true;return;}
    if(this.y<-300){this.dead=true;return;}
    for(const p of players){
      if(p===this.owner||sameTeam(p,this.owner)||p.dead||p.shieldActive)continue;
      const canHit=(this.goingUp&&!this.hitUp)||(!this.goingUp&&!this.hitDown);
      if(!canHit)continue;
      if(!aabb({x:this.x-this.r,y:this.y-this.r,w:this.r*2,h:this.r*2},{x:p.x,y:p.y,w:p.w,h:p.h}))continue;
      if(this.goingUp)this.hitUp=true; else this.hitDown=true;
      if(p.laserShieldActive){this.owner.damage+=Math.round(this.dmg*(this.owner.ch.def??1));this.owner.hitFlash=12;continue;}
      if(p.damage>=DEATH_THRESHOLD&&!p.isDummy){instakill(p,this.x,this.y);continue;}
      p.damage+=Math.round(this.dmg*(p.ch.def??1)); p.hitFlash=14; p.charging=false; p.chargeTime=0;
      const km=kbScale(p.damage), kb=this.kb*km/p.ch.weight;
      p.vx=(p.cx>this.x?1:-1)*kb*0.4;
      p.vy=this.goingUp?-kb*1.1:kb*0.7;
      p.vx=Math.max(-MAX_KB,Math.min(MAX_KB,p.vx)); p.vy=Math.max(-MAX_KB,Math.min(MAX_KB,p.vy));
      p.onGnd=false; p.onPlat=false;
      p.hitlag=3; addHitParticles(this.x,this.y,'#999999',false);
    }
  }
  draw(){
    if(this.dead)return;
    ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(this.frame*0.18);
    drawGearShape(ctx,this.r,6,'#888','#555');
    ctx.restore();
  }
}
class FactoryZap {
  constructor(x,y,owner){this.x=x; this.y=y; this.owner=owner; this.life=45; this.frame=0; this.dead=false;}
  update(){this.frame++; if(this.frame>=this.life)this.dead=true;}
  draw(){
    if(this.dead)return;
    const alpha=this.frame<this.life*0.7?1:(1-(this.frame-this.life*0.7)/(this.life*0.3));
    ctx.save(); ctx.globalAlpha=alpha; ctx.translate(this.x,this.y);
    rrFill(-8,-7,16,13,3,'#444');
    ctx.shadowBlur=5; ctx.shadowColor='#00ccff'; ctx.fillStyle='#00ccff';
    ctx.beginPath(); ctx.ellipse(0,-1,4,3,0,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    ctx.fillStyle='#333'; ctx.fillRect(-12,-3,4,7); ctx.fillRect(8,-3,4,7);
    if(this.frame<18){
      ctx.globalAlpha=alpha*(1-this.frame/18);
      ctx.shadowBlur=8; ctx.shadowColor='#00ccff'; ctx.fillStyle='#00ccff';
      ctx.beginPath(); ctx.arc(13,-1,4,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;
    }
    ctx.restore();
  }
}

// ---- BLADE Projectiles ----
const knives=[], throwSwords=[];
const firePebbles=[];
// ---- Boulder + Small Rocks (per-stage center hazard) ----
let boulder=null;
const smallRocks=[];
class FirePebble {
  constructor(x,y,vx,owner,linger=false){
    this.x=x; this.y=y; this.vx=vx; this.vy=0;
    this.owner=owner; this.dead=false;
    this.ox=x; this.oy=y;
    this.maxDist=75;
    this.dmg=4; this.kb=5;
    this.explodeDmg=16; this.explodeKB=14;
    this.explodeTimer=0;
    this.linger=linger;       // if true: after hitting, stick to target and deal 2 burn ticks
    this.lingerTicks=0;       // remaining linger ticks (counts down)
    this.lingerTickTimer=0;   // frames until next tick
    this.lingerTarget=null;
  }
  get dist(){return Math.hypot(this.x-this.ox,this.y-this.oy);}
  update(players){
    if(this.dead)return;
    // Linger burn ticks after initial hit
    if(this.lingerTicks>0){
      this.lingerTickTimer--;
      if(this.lingerTickTimer<=0){
        const p=this.lingerTarget;
        if(p&&!p.dead){
          if(p.damage>=DEATH_THRESHOLD&&!p.isDummy){instakill(p,p.cx,p.cy);this.dead=true;return;}
          p.damage+=Math.round(this.dmg*(p.ch.def??1)); p.hitFlash=8;
          addHitParticles(p.cx,p.cy,'#ff4400',false);
        }
        this.lingerTicks--;
        if(this.lingerTicks>0) this.lingerTickTimer=30;
        else this.dead=true;
      }
      return;
    }
    if(this.explodeTimer>0){this.explodeTimer--;if(this.explodeTimer<=0)this.dead=true;return;}
    this.x+=this.vx;
    if(this.dist>=this.maxDist){if(this.linger){this.dead=true;return;}this.explode(players);return;}
    if(this.x<-80||this.x>W+80||this.y<-80||this.y>H+80){this.dead=true;return;}
    for(const p of players){
      if(p===this.owner||sameTeam(p,this.owner)||p.dead)continue;
      if(p.laserShieldActive){
        if(this.x>p.x-10&&this.x<p.right+10&&this.y>p.y-10&&this.y<p.bottom+10){
          this.owner.damage+=Math.round(this.dmg*(this.owner.ch.def??1));
          this.owner.hitFlash=12; addHitParticles(this.x,this.y,'#00ffff',false);
          this.dead=true; return;
        }
        continue;
      }
      if(p.shieldActive){
        if(this.x>p.x-10&&this.x<p.right+10&&this.y>p.y-10&&this.y<p.bottom+10){
          addHitParticles(this.x,this.y,'#aaddff',false); this.dead=true; return;
        }
        continue;
      }
      if(this.x>p.x&&this.x<p.right&&this.y>p.y&&this.y<p.bottom){
        if(p.damage>=DEATH_THRESHOLD&&!p.isDummy){instakill(p,this.x,this.y);this.dead=true;return;}
        p.damage+=Math.round(this.dmg*(p.ch.def??1)); p.hitFlash=10;
        const km=kbScale(p.damage), kb=this.kb*km/p.ch.weight;
        p.vx=this.vx>0?kb:-kb; p.vy=-kb*0.08;
        p.vx=Math.max(-MAX_KB,Math.min(MAX_KB,p.vx)); p.vy=Math.max(-MAX_KB,Math.min(MAX_KB,p.vy));
        p.onGnd=false; p.onPlat=false;
        p.hitlag=3; this.owner.hitlag=0;
        addHitParticles(this.x,this.y,'#ff4400',false);
        if(this.linger){
          // Stay and burn for 2 more ticks
          this.vx=0; this.vy=0;
          this.lingerTicks=2; this.lingerTickTimer=30; this.lingerTarget=p;
        } else {
          this.dead=true;
        }
        return;
      }
    }
  }
  explode(players){
    const r=70;
    addHitParticles(this.x,this.y,'#ff4400',true);
    addHitParticles(this.x,this.y,'#ffaa00',true);
    shakeX+=(Math.random()-.5)*10; shakeY+=(Math.random()-.5)*10;
    for(const p of players){
      if(p===this.owner||sameTeam(p,this.owner)||p.dead)continue;
      if(p.laserShieldActive){
        this.owner.damage+=Math.round(this.explodeDmg*(this.owner.ch.def??1));
        this.owner.hitFlash=14; this.explodeTimer=12; return;
      }
      if(p.shieldActive){
        const dx=p.cx-this.x, dy=p.cy-this.y;
        if(Math.hypot(dx,dy)<r+Math.max(p.w,p.h)/2){
          addHitParticles(this.x,this.y,'#aaddff',false); this.explodeTimer=12; return;
        }
        continue;
      }
      const dx=p.cx-this.x, dy=p.cy-this.y;
      if(Math.hypot(dx,dy)<r+Math.max(p.w,p.h)/2){
        if(p.damage>=DEATH_THRESHOLD&&!p.isDummy){instakill(p,p.cx,p.cy);this.explodeTimer=12;return;}
        p.damage+=Math.round(this.explodeDmg*(p.ch.def??1)); p.hitFlash=15;
        const km=kbScale(p.damage), kb=this.explodeKB*km/p.ch.weight;
        const ang=Math.atan2(dy,dx);
        p.vx=Math.cos(ang)*kb; p.vy=Math.sin(ang)*kb-kb*0.15;
        p.vx=Math.max(-MAX_KB,Math.min(MAX_KB,p.vx)); p.vy=Math.max(-MAX_KB,Math.min(MAX_KB,p.vy));
        p.hstun=Math.min(58,Math.floor(8+kb*2.2)); p.onGnd=false; p.onPlat=false;
        p.hitlag=6; this.owner.hitlag=6;
      }
    }
    this.explodeTimer=12;
  }
  draw(){
    if(this.dead)return;
    ctx.save();
    if(this.explodeTimer>0){
      // Expanding explosion flash
      const t=1-this.explodeTimer/12;
      const exR=20+t*60;
      ctx.globalAlpha=(1-t)*0.85;
      const gr=ctx.createRadialGradient(this.x,this.y,2,this.x,this.y,exR);
      gr.addColorStop(0,'#ffee00'); gr.addColorStop(0.35,'#ff4400'); gr.addColorStop(1,'rgba(200,0,0,0)');
      ctx.fillStyle=gr; ctx.shadowBlur=30; ctx.shadowColor='#ff4400';
      ctx.beginPath(); ctx.arc(this.x,this.y,exR,0,Math.PI*2); ctx.fill();
      ctx.restore(); return;
    }
    const t=this.dist/this.maxDist;
    ctx.shadowBlur=16; ctx.shadowColor='#ff4400';
    const gr=ctx.createRadialGradient(this.x,this.y,1,this.x,this.y,9);
    gr.addColorStop(0,'#ffcc00'); gr.addColorStop(0.45,'#ff4400'); gr.addColorStop(1,'rgba(180,0,0,0)');
    ctx.fillStyle=gr;
    ctx.beginPath(); ctx.arc(this.x,this.y,9,0,Math.PI*2); ctx.fill();
    // Trail
    ctx.globalAlpha=0.35*(1-t); ctx.fillStyle='#ff2200';
    ctx.beginPath(); ctx.arc(this.x-this.vx*2.5,this.y,5,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
}

class Knife {
  constructor(x,y,vx,vy,owner,heavy=false){
    this.x=x;this.y=y;this.vx=vx;this.vy=vy;
    this.owner=owner;this.heavy=heavy;this.dead=false;
    this.ox=x;this.oy=y;
    this.dmg=heavy?9:6; this.kb=heavy?9:5;
    this.maxDist=heavy?420:300;
  }
  get dist(){return Math.hypot(this.x-this.ox,this.y-this.oy);}
  update(players){
    if(this.dead)return;
    this.x+=this.vx;this.y+=this.vy;
    if(this.dist>this.maxDist||this.x<-80||this.x>W+80||this.y<-80||this.y>H+80){this.dead=true;return;}
    for(const p of players){
      if(p===this.owner||sameTeam(p,this.owner)||p.dead)continue;
      if(p.shieldActive){
        if(this.x>p.x-10&&this.x<p.right+10&&this.y>p.y-10&&this.y<p.bottom+10){addHitParticles(this.x,this.y,'#aaddff',false);this.dead=true;return;}
        continue;
      }
      if(this.x>p.x&&this.x<p.right&&this.y>p.y&&this.y<p.bottom){
        if(p.damage>=DEATH_THRESHOLD&&!p.isDummy){instakill(p,this.x,this.y);this.dead=true;return;}
        p.damage+=Math.round(this.dmg*(p.ch.def??1));p.hitFlash=14;p.charging=false;p.chargeTime=0;
        const km=kbScale(p.damage),kb=this.kb*km/p.ch.weight;
        p.vx=this.vx>0?kb:-kb;p.vy=-kb*0.1;
        p.vx=Math.max(-MAX_KB,Math.min(MAX_KB,p.vx));p.vy=Math.max(-MAX_KB,Math.min(MAX_KB,p.vy));
        p.onGnd=false;p.onPlat=false;p.hitlag=3;this.owner.hitlag=0;
        addHitParticles(this.x,this.y,this.owner.ch.color,this.heavy);
        shakeX+=(Math.random()-.5)*(this.heavy?8:4);this.dead=true;return;
      }
    }
  }
  draw(){
    if(this.dead)return;
    const ang=Math.atan2(this.vy,this.vx),ch=this.owner.ch;
    ctx.save();ctx.translate(this.x,this.y);ctx.rotate(ang);
    ctx.shadowBlur=this.heavy?14:8;ctx.shadowColor=ch.eyeCol;
    const bl=this.heavy?20:14;
    ctx.fillStyle=ch.hi;ctx.beginPath();ctx.moveTo(bl,0);ctx.lineTo(-6,-4);ctx.lineTo(-6,4);ctx.closePath();ctx.fill();
    ctx.fillStyle=ch.accent;ctx.fillRect(-10,-2,5,4);
    ctx.shadowBlur=0;ctx.restore();
  }
}

class ThrowSword {
  constructor(x,y,vx,owner){
    this.x=x;this.y=y;this.vx=vx;this.vy=0;
    this.owner=owner;this.dead=false;
    this.ox=x;this.oy=y;this.rot=0;
    this.dmg=14;this.kb=14;this.maxDist=380;
  }
  get dist(){return Math.hypot(this.x-this.ox,this.y-this.oy);}
  update(players){
    if(this.dead)return;
    this.x+=this.vx;this.rot+=0.22;
    if(this.dist>this.maxDist||this.x<-80||this.x>W+80){this.dead=true;return;}
    for(const p of players){
      if(p===this.owner||sameTeam(p,this.owner)||p.dead)continue;
      if(p.shieldActive){
        if(this.x>p.x-12&&this.x<p.right+12&&this.y>p.y-12&&this.y<p.bottom+12){addHitParticles(this.x,this.y,'#aaddff',false);this.dead=true;return;}
        continue;
      }
      if(this.x>p.x-8&&this.x<p.right+8&&this.y>p.y-6&&this.y<p.bottom+6){
        if(p.damage>=DEATH_THRESHOLD&&!p.isDummy){instakill(p,this.x,this.y);this.dead=true;return;}
        p.damage+=Math.round(this.dmg*(p.ch.def??1));p.hitFlash=14;p.charging=false;p.chargeTime=0;
        const km=kbScale(p.damage),kb=this.kb*km/p.ch.weight;
        p.vx=this.vx>0?kb:-kb;p.vy=-kb*0.2;
        p.vx=Math.max(-MAX_KB,Math.min(MAX_KB,p.vx));p.vy=Math.max(-MAX_KB,Math.min(MAX_KB,p.vy));
        p.hstun=Math.min(55,Math.floor(8+kb*2.2));
        p.onGnd=false;p.onPlat=false;p.hitlag=5;this.owner.hitlag=0;
        addHitParticles(this.x,this.y,this.owner.ch.color,true);
        shakeX+=(Math.random()-.5)*10;this.dead=true;return;
      }
    }
  }
  draw(){
    if(this.dead)return;
    const ch=this.owner.ch;
    ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.rot);
    ctx.shadowBlur=18;ctx.shadowColor=ch.eyeCol;
    ctx.fillStyle=ch.hi;ctx.beginPath();ctx.moveTo(24,0);ctx.lineTo(-8,-4);ctx.lineTo(-8,4);ctx.closePath();ctx.fill();
    ctx.globalAlpha=0.7;ctx.fillStyle=ch.hi;ctx.beginPath();ctx.moveTo(-8,-2);ctx.lineTo(-15,-5);ctx.lineTo(-15,5);ctx.lineTo(-8,2);ctx.closePath();ctx.fill();
    ctx.globalAlpha=1;ctx.fillStyle=ch.accent;ctx.fillRect(-11,-6,5,12);
    ctx.shadowBlur=0;ctx.restore();
  }
}

// ---- Boulder (center-stage hazard) ----
class Boulder {
  constructor(x,y){
    this.x=x; this.y=y; this.r=BOULDER_RADIUS; this.dead=false;
    this.bobT=Math.random()*Math.PI*2;
    this.rotT=0;
    this.pulseT=0;
    this.outline=[];
    for(let i=0;i<14;i++){
      const a=(i/14)*Math.PI*2;
      const rr=this.r*(0.85+Math.random()*0.25);
      this.outline.push([Math.cos(a)*rr,Math.sin(a)*rr]);
    }
    this.cracks=[];
    for(let i=0;i<5;i++){
      const a=Math.random()*Math.PI*2;
      const r1=this.r*0.15+Math.random()*this.r*0.2;
      const r2=this.r*0.55+Math.random()*this.r*0.3;
      this.cracks.push([Math.cos(a)*r1,Math.sin(a)*r1,Math.cos(a)*r2,Math.sin(a)*r2]);
    }
  }
  // Per-stage visual config
  get theme(){
    const id=curStage?curStage.id:0;
    switch(id){
      case 0: return { // THE FOUNDRY — molten iron ore
        fill:['#5a3018','#8a4820','#c06020'], stroke:'#3a1808',
        glow:'rgba(255,100,20,0.5)', crackCol:'rgba(255,140,30,0.9)',
        hlCol:'rgba(255,180,80,0.45)', specks:'#ff6622',
        dustCols:['#ff6622','#cc3300','#ff9944','#aa2200'], label:'SLAG CORE' };
      case 1: return { // ORBITAL STATION — asteroid
        fill:['#2a2a35','#404055','#1a1a28'], stroke:'#080812',
        glow:'rgba(80,120,255,0.35)', crackCol:'rgba(150,180,255,0.6)',
        hlCol:'rgba(180,200,255,0.3)', specks:'#6688cc',
        dustCols:['#334466','#5566aa','#223355','#8899cc'], label:'ASTEROID' };
      case 2: return { // SCRAPYARD — rusted metal chunk
        fill:['#5a2a10','#7a3a18','#3a1808'], stroke:'#1a0800',
        glow:'rgba(180,80,20,0.4)', crackCol:'rgba(100,180,80,0.7)',
        hlCol:'rgba(200,120,60,0.4)', specks:'#44aa22',
        dustCols:['#7a3a10','#aa5522','#3a6618','#884422'], label:'SCRAP HEAP' };
      case 3: return { // NEON CITY — neon crystal
        fill:['#1a0a28','#2a1040','#0d0820'], stroke:'#0a0018',
        glow:'rgba(200,50,255,0.6)', crackCol:'rgba(255,80,255,0.95)',
        hlCol:'rgba(255,100,255,0.5)', specks:'#cc44ff',
        dustCols:['#cc00ff','#ff44cc','#8800cc','#ff88ff'], label:'NEON ORB' };
      case 4: return { // ARCTIC BASE — ice block
        fill:['#aaccee','#ddeeff','#7799bb'], stroke:'#446688',
        glow:'rgba(100,200,255,0.55)', crackCol:'rgba(180,230,255,0.85)',
        hlCol:'rgba(255,255,255,0.6)', specks:'#88ccff',
        dustCols:['#aaddff','#ddeeff','#88ccee','#ffffff'], label:'ICE BLOCK' };
      case 5: return { // CLOUD TEMPLE — storm cloud core
        fill:['#c8d8ee','#e8eeff','#a8b8cc'], stroke:'#8898aa',
        glow:'rgba(180,200,255,0.5)', crackCol:'rgba(100,140,255,0.7)',
        hlCol:'rgba(255,255,255,0.7)', specks:'#aabbdd',
        dustCols:['#ddeeff','#ffffff','#aaccee','#8899bb'], label:'STORM ORB' };
      case 6: return { // MOLTEN CORE — lava bomb
        fill:['#1a0800','#2d0a00','#0d0400'], stroke:'#080200',
        glow:'rgba(255,80,0,0.7)', crackCol:'rgba(255,160,0,1.0)',
        hlCol:'rgba(255,100,20,0.55)', specks:'#ff4400',
        dustCols:['#ff4400','#ff8800','#cc2200','#ffaa00'], label:'LAVA BOMB' };
      case 7: return { // DATA REALM — glitch cube
        fill:['#001800','#003300','#001200'], stroke:'#004400',
        glow:'rgba(0,255,80,0.55)', crackCol:'rgba(0,255,100,1.0)',
        hlCol:'rgba(80,255,100,0.5)', specks:'#00ff44',
        dustCols:['#00ff44','#00cc33','#44ff88','#008822'], label:'DATA CORE' };
      case 8: return { // THE CARNIVAL — iron cannonball
        fill:['#2a2a2a','#3a3a3a','#1a1a1a'], stroke:'#080808',
        glow:'rgba(255,200,50,0.4)', crackCol:'rgba(255,220,80,0.8)',
        hlCol:'rgba(255,240,100,0.4)', specks:'#ffaa00',
        dustCols:['#ff4488','#ffaa00','#44ccff','#ff6622'], label:'CANNONBALL' };
      case 9: return { // THE JUNGLE — mossy ancient stone
        fill:['#2a3a18','#1e2e10','#384a22'], stroke:'#0e1808',
        glow:'rgba(80,180,40,0.45)', crackCol:'rgba(100,220,60,0.75)',
        hlCol:'rgba(160,220,80,0.4)', specks:'#66cc22',
        dustCols:['#448822','#336611','#66aa33','#55bb22'], label:'RUIN STONE' };
      case 10: return { // SKY TEMPLE — golden relic
        fill:['#6a4800','#9a6c10','#4a3200'], stroke:'#2a1800',
        glow:'rgba(255,200,50,0.6)', crackCol:'rgba(255,230,100,0.95)',
        hlCol:'rgba(255,240,160,0.55)', specks:'#ffcc44',
        dustCols:['#ffcc44','#ff9900','#ffee88','#cc7700'], label:'RELIC ORB' };
      case 11: return { // NEO CITY — chrome tech sphere
        fill:['#a0b8c8','#c8dde8','#6a8898'], stroke:'#334455',
        glow:'rgba(0,220,255,0.55)', crackCol:'rgba(0,230,255,0.9)',
        hlCol:'rgba(200,240,255,0.6)', specks:'#00ddff',
        dustCols:['#00ddff','#0099cc','#44eeff','#006688'], label:'TECH SPHERE' };
      default: return {
        fill:['#9a8060','#6d543a','#3a2a1a'], stroke:'#2a1a0a',
        glow:'rgba(40,28,18,0.45)', crackCol:'rgba(20,12,5,0.7)',
        hlCol:'rgba(220,200,170,0.35)', specks:'#2a1a0a',
        dustCols:['#7a5a3a','#8a6a4a','#5a4a2a','#aa8855'], label:'BOULDER' };
    }
  }
  get rect(){return {x:this.x-this.r, y:this.y-this.r+Math.sin(this.bobT)*4, w:this.r*2, h:this.r*2};}
  intersectsRect(rx,ry,rw,rh){
    const cx=Math.max(rx,Math.min(this.x,rx+rw));
    const cy=Math.max(ry,Math.min(this.y+Math.sin(this.bobT)*4,ry+rh));
    const dx=cx-this.x, dy=cy-(this.y+Math.sin(this.bobT)*4);
    return dx*dx+dy*dy <= this.r*this.r;
  }
  update(){
    if(this.dead) return;
    this.bobT+=0.018;
    this.rotT+=0.003;
    this.pulseT+=0.04;
  }
  shatter(){
    if(this.dead) return;
    this.dead=true;
    const t=this.theme;
    for(let i=0;i<5;i++){
      const a=(i/5)*Math.PI*2 + Math.random()*0.4;
      const sp=2.5+Math.random()*2.0;
      smallRocks.push(new SmallRock(this.x+Math.cos(a)*30, this.y+Math.sin(a)*30, Math.cos(a)*sp, Math.sin(a)*sp));
    }
    addDeathExplosion(this.x,this.y);
    for(let i=0;i<22;i++){
      const a=Math.random()*Math.PI*2,sp=4+Math.random()*8;
      const col=t.dustCols[Math.floor(Math.random()*t.dustCols.length)];
      particles.push({x:this.x,y:this.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:40,max:40,col,sz:3+Math.random()*5});
    }
  }
  draw(){
    if(this.dead) return;
    const t=this.theme;
    const bob=Math.sin(this.bobT)*4;
    const cy=this.y+bob;
    const pulse=Math.sin(this.pulseT)*0.15+0.85; // 0.7–1.0 oscillation
    ctx.save();
    ctx.translate(this.x,cy);
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.3)';
    ctx.beginPath();ctx.ellipse(0,this.r+12,this.r*0.85,10,0,0,Math.PI*2);ctx.fill();
    // Themed outer glow — pulses with stage energy
    const aura=ctx.createRadialGradient(0,0,this.r*0.5,0,0,this.r*1.5);
    aura.addColorStop(0,'rgba(0,0,0,0)');
    aura.addColorStop(0.7,'rgba(0,0,0,0)');
    aura.addColorStop(1,t.glow);
    ctx.globalAlpha=pulse;
    ctx.fillStyle=aura;ctx.beginPath();ctx.arc(0,0,this.r*1.5,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
    ctx.rotate(this.rotT);
    // Body polygon
    ctx.beginPath();
    for(let i=0;i<this.outline.length;i++){
      const [px,py]=this.outline[i];
      if(i===0)ctx.moveTo(px,py); else ctx.lineTo(px,py);
    }
    ctx.closePath();
    const g=ctx.createRadialGradient(-this.r*0.3,-this.r*0.3,this.r*0.1,0,0,this.r*1.1);
    g.addColorStop(0,t.fill[0]);
    g.addColorStop(0.5,t.fill[1]);
    g.addColorStop(1,t.fill[2]);
    ctx.fillStyle=g;ctx.fill();
    ctx.strokeStyle=t.stroke;ctx.lineWidth=2.5;ctx.stroke();
    // Highlight
    ctx.fillStyle=t.hlCol;
    ctx.beginPath();ctx.ellipse(-this.r*0.25,-this.r*0.4,this.r*0.4,this.r*0.18,-0.4,0,Math.PI*2);ctx.fill();
    // Themed crack lines — glow on lava/neon/data stages
    ctx.strokeStyle=t.crackCol;ctx.lineWidth=2;ctx.lineCap='round';
    // Extra crack glow on high-energy stages
    const glowCracks=[0,3,6,7,10,11].includes(curStage?curStage.id:0);
    if(glowCracks){ctx.shadowColor=t.crackCol;ctx.shadowBlur=6;}
    for(const [x1,y1,x2,y2] of this.cracks){
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
    }
    ctx.shadowBlur=0;
    // Specks / surface detail
    ctx.fillStyle=t.specks;
    for(let i=0;i<6;i++){
      const a=i*1.7+this.rotT*2;
      const r=this.r*0.55+Math.sin(i*3.1)*this.r*0.25;
      ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r,2,0,Math.PI*2);ctx.fill();
    }
    // Stage-specific extras drawn in local (rotated) space
    const sid=curStage?curStage.id:0;
    if(sid===7){
      // DATA REALM: scan lines across sphere
      ctx.strokeStyle='rgba(0,255,80,0.25)';ctx.lineWidth=1;
      for(let i=-3;i<=3;i++){
        const yy=i*this.r*0.28;
        const hw=Math.sqrt(Math.max(0,this.r*this.r-yy*yy))*0.9;
        ctx.beginPath();ctx.moveTo(-hw,yy);ctx.lineTo(hw,yy);ctx.stroke();
      }
    } else if(sid===4){
      // ARCTIC: inner ice crystal lines
      ctx.strokeStyle='rgba(200,235,255,0.4)';ctx.lineWidth=1.5;
      for(let i=0;i<4;i++){
        const a=i*Math.PI/4;
        ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*this.r*0.7,Math.sin(a)*this.r*0.7);ctx.stroke();
      }
    } else if(sid===6){
      // MOLTEN CORE: pulsing inner lava glow
      ctx.globalAlpha=(Math.sin(this.pulseT*2)*0.2+0.35);
      const lavaG=ctx.createRadialGradient(0,0,0,0,0,this.r*0.65);
      lavaG.addColorStop(0,'rgba(255,160,0,0.9)');
      lavaG.addColorStop(1,'rgba(200,40,0,0)');
      ctx.fillStyle=lavaG;ctx.beginPath();ctx.arc(0,0,this.r*0.65,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;
    } else if(sid===8){
      // CARNIVAL: painted ring stripe
      ctx.strokeStyle='rgba(255,200,50,0.5)';ctx.lineWidth=4;
      ctx.beginPath();ctx.arc(0,0,this.r*0.6,0,Math.PI*2);ctx.stroke();
    } else if(sid===11){
      // NEO CITY: holographic equator ring
      ctx.strokeStyle='rgba(0,230,255,0.6)';ctx.lineWidth=3;
      ctx.beginPath();ctx.ellipse(0,0,this.r*0.95,this.r*0.22,0,0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
    // Label underneath (world frame, unrotated)
    ctx.save();
    ctx.translate(this.x,cy+this.r+24);
    ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=t.specks;ctx.globalAlpha=0.7;
    ctx.fillText(t.label,0,0);
    ctx.globalAlpha=1;ctx.restore();
  }
}

// ---- Small Rock (post-shatter throwable) ----
class SmallRock {
  constructor(x,y,vx,vy){
    this.x=x; this.y=y; this.vx=vx; this.vy=vy; this.r=SMALL_ROCK_RADIUS;
    this.dead=false; this.thrown=false; this.heldBy=null;
    this.spinT=Math.random()*Math.PI*2; this.spinV=(Math.random()-0.5)*0.12;
    this.lastOwner=null; this.lastOwnerImmuneT=0;
    // Trail history for thrown motion blur
    this.trail=[];
    // Generate jagged outline (5-7 vertices)
    this.outline=[];
    const n=5+Math.floor(Math.random()*3);
    for(let i=0;i<n;i++){
      const a=(i/n)*Math.PI*2;
      const rr=this.r*(0.75+Math.random()*0.4);
      this.outline.push([Math.cos(a)*rr,Math.sin(a)*rr]);
    }
  }
  get cx(){return this.x;} get cy(){return this.y;}
  intersectsPlayer(p){
    // Circle vs AABB
    const cx=Math.max(p.x,Math.min(this.x,p.right));
    const cy=Math.max(p.y,Math.min(this.y,p.bottom));
    const dx=cx-this.x, dy=cy-this.y;
    return dx*dx+dy*dy <= this.r*this.r;
  }
  update(players){
    if(this.dead) return;
    if(this.lastOwnerImmuneT>0) this.lastOwnerImmuneT--;
    if(this.heldBy){
      // Held: glue to holder's hand
      if(this.heldBy.dead||this.heldBy.heldRock!==this){this.heldBy=null; return;}
      const h=this.heldBy;
      this.x=h.cx + h.facing*30;
      this.y=h.cy-10+Math.sin(frame*0.12)*2;
      this.spinT+=0.04;
      return;
    }
    this.x+=this.vx; this.y+=this.vy;
    this.spinT+=this.spinV;
    if(!this.thrown){
      // Free-floating: friction + gentle bob
      this.vx*=0.97; this.vy*=0.97;
      this.vy+=Math.sin(frame*0.05+this.spinT)*0.02;
      if(Math.abs(this.vx)<0.05) this.vx=0;
      if(Math.abs(this.vy)<0.05) this.vy=0;
    } else {
      // Thrown: keep last few positions for motion-blur trail
      this.trail.push([this.x,this.y]);
      if(this.trail.length>4) this.trail.shift();
    }
    // Off-screen kill (with margin)
    if(this.x<VIS_LEFT-50||this.x>VIS_RIGHT+50||this.y<VIS_TOP-50||this.y>VIS_BOT+50){this.dead=true; return;}
    // Hit detection only when thrown
    if(this.thrown){
      for(const p of players){
        if(p.dead||p.isDummy) continue;
        if(p===this.lastOwner&&this.lastOwnerImmuneT>0) continue;
        if(p.shieldActive){
          if(this.intersectsPlayer(p)){addHitParticles(this.x,this.y,'#aaddff',false); this.dead=true; return;}
          continue;
        }
        if(this.intersectsPlayer(p)){
          if(p.damage>=DEATH_THRESHOLD&&!p.isDummy){instakill(p,this.x,this.y); this.dead=true; return;}
          p.damage += Math.round(SMALL_ROCK_DMG*(p.ch.def??1));
          p.hitFlash=15; p.charging=false; p.chargeTime=0;
          const sp=Math.hypot(this.vx,this.vy)||1;
          const kb=8 * kbScale(p.damage) / p.ch.weight;
          p.vx = (this.vx/sp)*kb; p.vy = (this.vy/sp)*kb*0.5 - 1;
          p.vx=Math.max(-MAX_KB,Math.min(MAX_KB,p.vx)); p.vy=Math.max(-MAX_KB,Math.min(MAX_KB,p.vy));
          p.hstun=Math.min(40, 12+Math.floor(sp*1.5));
          p.hitlag=4;
          addHitParticles(this.x,this.y,'#aa8855',true);
          // Extra rock-dust burst
          for(let i=0;i<8;i++){
            const a=Math.random()*Math.PI*2,sp2=3+Math.random()*5;
            particles.push({x:this.x,y:this.y,vx:Math.cos(a)*sp2,vy:Math.sin(a)*sp2,life:20,max:20,col:'#7a5a3a',sz:2+Math.random()*2});
          }
          shakeX+=(Math.random()-.5)*6;
          this.dead=true; return;
        }
      }
    }
  }
  draw(){
    if(this.dead) return;
    ctx.save();
    // Motion trail when thrown
    if(this.thrown&&this.trail.length>0){
      for(let i=0;i<this.trail.length;i++){
        const [tx,ty]=this.trail[i];
        const a=(i+1)/(this.trail.length+1)*0.4;
        ctx.fillStyle=`rgba(120,90,60,${a})`;
        ctx.beginPath();ctx.arc(tx,ty,this.r*0.85,0,Math.PI*2);ctx.fill();
      }
    }
    ctx.translate(this.x,this.y);
    ctx.rotate(this.spinT);
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.25)';
    ctx.beginPath();ctx.ellipse(0,this.r*0.85,this.r*0.7,4,0,0,Math.PI*2);ctx.fill();
    // Body
    ctx.beginPath();
    for(let i=0;i<this.outline.length;i++){
      const [px,py]=this.outline[i];
      if(i===0)ctx.moveTo(px,py); else ctx.lineTo(px,py);
    }
    ctx.closePath();
    const g=ctx.createRadialGradient(-this.r*0.3,-this.r*0.3,this.r*0.1,0,0,this.r*1.1);
    g.addColorStop(0,'#9a8060');
    g.addColorStop(0.5,'#6d543a');
    g.addColorStop(1,'#3a2a1a');
    ctx.fillStyle=g;ctx.fill();
    ctx.strokeStyle='#2a1a0a';ctx.lineWidth=1.5;ctx.stroke();
    // Highlight
    ctx.fillStyle='rgba(220,200,170,0.4)';
    ctx.beginPath();ctx.ellipse(-this.r*0.25,-this.r*0.35,this.r*0.35,this.r*0.16,-0.3,0,Math.PI*2);ctx.fill();
    // Glow when held (subtle yellow rim) or thrown (white-hot rim from speed)
    if(this.heldBy||this.thrown){
      ctx.strokeStyle=this.heldBy?'rgba(255,220,120,0.55)':'rgba(255,240,200,0.4)';
      ctx.lineWidth=2;ctx.shadowBlur=8;ctx.shadowColor=this.heldBy?'#ffcc66':'#ffffff';
      ctx.beginPath();
      for(let i=0;i<this.outline.length;i++){
        const [px,py]=this.outline[i];
        if(i===0)ctx.moveTo(px,py); else ctx.lineTo(px,py);
      }
      ctx.closePath();ctx.stroke();
      ctx.shadowBlur=0;
    }
    ctx.restore();
  }
}

// ---- PRISTINE Projectiles ----
const pristineRockets=[];
class PristineRocket {
  constructor(x,y,vx,vy,owner){
    this.x=x; this.y=y; this.vx=vx; this.vy=vy;
    this.owner=owner; this.dead=false;
    this.timer=60; this.speed=9;
    this.dmg=owner.ch.hDmg||12; this.kb=owner.ch.hKB||11;
  }
  update(players){
    if(this.dead)return;
    this.timer--;
    if(this.timer<=0){this.explode(players);return;}
    // Soft homing toward nearest enemy
    let nearest=null,nearDist=Infinity;
    for(const p of players){
      if(p===this.owner||sameTeam(p,this.owner)||p.dead)continue;
      const d=Math.hypot(p.cx-this.x,p.cy-this.y);
      if(d<nearDist){nearest=p;nearDist=d;}
    }
    if(nearest){
      const dx=nearest.cx-this.x,dy=nearest.cy-this.y;
      const d=Math.hypot(dx,dy)||1;
      this.vx=this.vx*0.88+(dx/d)*this.speed*0.12;
      this.vy=this.vy*0.88+(dy/d)*this.speed*0.12;
      const cur=Math.hypot(this.vx,this.vy)||1;
      this.vx=this.vx/cur*this.speed; this.vy=this.vy/cur*this.speed;
    }
    this.x+=this.vx; this.y+=this.vy;
    if(this.x<-100||this.x>W+100||this.y<-100||this.y>H+100){this.dead=true;return;}
    for(const p of players){
      if(p===this.owner||sameTeam(p,this.owner)||p.dead||p.hitImmune>0)continue;
      if(this.x>p.x-10&&this.x<p.right+10&&this.y>p.y-10&&this.y<p.bottom+10){
        this.hitPlayer(p); this.explode(players); return;
      }
    }
  }
  hitPlayer(target){
    if(target.laserShieldActive){
      this.owner.damage+=Math.round(this.dmg*(this.owner.ch.def??1));
      this.owner.hitFlash=14; addHitParticles(this.x,this.y,'#00ffff',true); return;
    }
    if(target.shieldActive){addHitParticles(target.cx,target.cy,'#aaddff',false);return;}
    if(target.damage>=DEATH_THRESHOLD&&!target.isDummy){instakill(target,this.x,this.y);this.dead=true;return;}
    target.damage+=Math.round(this.dmg*(target.ch.def??1));
    target.hitFlash=14; target.charging=false; target.chargeTime=0;
    const km=kbScale(target.damage),kb=this.kb*km/target.ch.weight;
    const ang=Math.atan2(this.vy,this.vx);
    target.vx=Math.cos(ang)*kb; target.vy=Math.sin(ang)*kb-kb*0.15;
    target.vx=Math.max(-MAX_KB,Math.min(MAX_KB,target.vx));
    target.vy=Math.max(-MAX_KB,Math.min(MAX_KB,target.vy));
    target.hstun=Math.min(55,Math.floor(8+kb*2.2));
    target.onGnd=false; target.onPlat=false; target.hitlag=5; this.owner.hitlag=0;
    addHitParticles(this.x,this.y,'#00ffff',true);
    shakeX+=(Math.random()-.5)*8; shakeY+=(Math.random()-.5)*4;
  }
  explode(players){
    this.dead=true;
    addHitParticles(this.x,this.y,'#ffffff',true);
    addHitParticles(this.x,this.y,'#00ffff',false);
    shakeX+=(Math.random()-.5)*6; shakeY+=(Math.random()-.5)*4;
  }
  draw(){
    if(this.dead)return;
    const ang=Math.atan2(this.vy,this.vx);
    ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(ang);
    ctx.shadowBlur=18; ctx.shadowColor='#00ffff';
    // Exhaust glow
    const pulse=Math.sin(frame*0.4)*0.3+0.7;
    ctx.globalAlpha=pulse*0.85; ctx.fillStyle='#00ffff';
    ctx.beginPath(); ctx.ellipse(-16,0,9,4,0,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
    // Body
    ctx.fillStyle='#ffffff';
    ctx.beginPath(); ctx.ellipse(0,0,14,5,0,0,Math.PI*2); ctx.fill();
    // Nose
    ctx.fillStyle='#00ffff';
    ctx.beginPath(); ctx.moveTo(16,0); ctx.lineTo(7,-4); ctx.lineTo(7,4); ctx.closePath(); ctx.fill();
    // Fins
    ctx.fillStyle='#000000';
    ctx.beginPath(); ctx.moveTo(-14,0); ctx.lineTo(-8,-8); ctx.lineTo(-7,-3); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-14,0); ctx.lineTo(-8,8); ctx.lineTo(-7,3); ctx.closePath(); ctx.fill();
    // Timer warning flash (last 20 frames)
    if(this.timer<20){
      ctx.globalAlpha=(Math.sin(frame*0.4)*0.5+0.5)*0.5;
      ctx.fillStyle='#ff4444'; ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur=0; ctx.globalAlpha=1; ctx.restore();
  }
}

// ---- UNSTABLE Projectiles ----
const smokeClouds=[], unstableHeads=[];

class SmokeCloud {
  constructor(x,y,owner){
    this.x=x; this.y=y; this.maxR=120; this.r=120; this.owner=owner;
    this.timer=180; this.tickTimer=60; this.dead=false;
  }
  update(players){
    if(this.dead)return;
    this.timer--; this.tickTimer--;
    this.r=this.maxR*(this.timer/180);
    if(this.tickTimer<=0){
      this.tickTimer=60;
      for(const p of players){
        if(p===this.owner||sameTeam(p,this.owner)||p.dead)continue;
        if(Math.abs(p.cx-this.x)<this.r+p.w*0.4&&Math.abs(p.cy-this.y)<this.r+p.h*0.4){
          if(p.damage>=DEATH_THRESHOLD&&!p.isDummy){instakill(p,p.cx,p.cy);continue;}
          p.damage+=Math.round(6*(p.ch.def??1)); p.hitFlash=8;
        }
      }
    }
    if(this.timer<=0)this.dead=true;
  }
  draw(){
    if(this.dead)return;
    const fade=Math.min(1,this.timer/40);
    ctx.save(); ctx.globalAlpha=fade*0.55;
    for(let i=0;i<6;i++){
      const ang=(i/6)*Math.PI*2+frame*0.015;
      const ox=Math.cos(ang)*this.r*0.35, oy=Math.sin(ang)*this.r*0.28;
      const gr=ctx.createRadialGradient(this.x+ox,this.y+oy,2,this.x+ox,this.y+oy,this.r*0.72);
      gr.addColorStop(0,'#aaaaaa'); gr.addColorStop(1,'rgba(80,80,80,0)');
      ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(this.x+ox,this.y+oy,this.r*0.72,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}

class UnstableHead {
  constructor(x,y,owner){
    this.x=x; this.y=y; this.vx=0; this.vy=-13;
    this.owner=owner; this.dead=false;
    this.goingOut=true; this.hitOut=false; this.hitBack=false;
    this.distTraveled=0; this.maxDist=160;
    this.dmg=8; this.kb=8;
  }
  update(players){
    if(this.dead)return;
    if(this.goingOut){
      this.y+=this.vy; this.distTraveled+=Math.abs(this.vy);
      this.vy+=0.4;
      if(this.distTraveled>=this.maxDist||this.vy>=0){this.goingOut=false; this.vy=Math.max(this.vy,3);}
    } else {
      const dx=this.owner.cx-this.x, dy=this.owner.cy-this.y;
      const d=Math.hypot(dx,dy);
      if(d<20){this.dead=true; return;}
      const spd=10;
      this.vx+=(dx/d)*1.2; this.vy+=(dy/d)*1.2;
      const curSpd=Math.hypot(this.vx,this.vy);
      if(curSpd>spd){this.vx=this.vx/curSpd*spd; this.vy=this.vy/curSpd*spd;}
      this.x+=this.vx; this.y+=this.vy;
    }
    if(this.goingOut)this.x+=this.vx;
    for(const p of players){
      if(p===this.owner||sameTeam(p,this.owner)||p.dead||p.hitlag>0||p.hitImmune>0)continue;
      if(Math.abs(p.cx-this.x)<22&&Math.abs(p.cy-this.y)<26){
        if(this.goingOut&&!this.hitOut){this.doHit(p,'up');this.hitOut=true;p.hitImmune=6;}
        else if(!this.goingOut&&!this.hitBack&&!this.hitOut){this.doHit(p,'down');this.hitBack=true;}
      }
    }
  }
  doHit(target,dir){
    if(target.shieldActive){addHitParticles(target.cx,target.cy,'#aaddff',false);return;}
    if(target.damage>=DEATH_THRESHOLD&&!target.isDummy){instakill(target,this.x,this.y);this.dead=true;return;}
    const km=kbScale(target.damage), kb=this.kb*km/target.ch.weight;
    target.damage+=Math.round(this.dmg*(target.ch.def??1)); target.hitFlash=14; target.charging=false; target.chargeTime=0;
    target.vy=dir==='up'?-kb*0.8:Math.min(MAX_KB,kb*0.6); target.vx=this.owner.facing*kb*0.3;
    target.vy=Math.max(-MAX_KB,Math.min(MAX_KB,target.vy));
    target.hstun=Math.min(40,Math.floor(5+kb*2));
    target.onGnd=false; target.onPlat=false; target.hitlag=4;
    addHitParticles(this.x,this.y,this.owner.ch.color,false);
  }
  draw(){
    if(this.dead)return;
    const ch=this.owner.ch;
    ctx.save(); ctx.translate(this.x,this.y);
    const wobble=Math.sin(frame*0.3)*0.15;
    ctx.rotate(wobble);
    ctx.shadowBlur=14; ctx.shadowColor=ch.eyeCol;
    ctx.fillStyle=ch.color; ctx.beginPath(); ctx.ellipse(0,0,16,13,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=ch.hi; ctx.beginPath(); ctx.ellipse(-3,-3,10,6,-0.3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#110000'; ctx.beginPath(); ctx.ellipse(-5,1,5,4,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5,1,5,4,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=ch.eyeCol; ctx.beginPath(); ctx.arc(-5,1,3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(5,1,3,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0; ctx.restore();
  }
}

// ---- Mini Sword (EDGE up heavy projectile) ----
const miniSwords=[];
class MiniSword {
  constructor(x,y,owner){
    this.x=x; this.y=y; this.vx=0; this.vy=-16;
    this.owner=owner; this.dead=false;
    this.rising=true; this.onGround=false; this.groundTimer=0;
    this.dmg=7; this.kb=9;
  }
  update(players,stage){
    if(this.dead)return;
    if(!this.onGround){
      this.vy=Math.min(this.vy+0.595,16); // projectile gravity (independent of flight mode)
      this.y+=this.vy; this.x+=this.vx;
      this.rising=this.vy<0;
      const g=stage.ground;
      if(this.y+24>=g.y&&this.x+8>g.x&&this.x<g.x+g.w){
        this.y=g.y-24; this.onGround=true; this.groundTimer=30; this.rising=false;
      }
      for(const pl of stage.plats){
        if(!this.onGround&&this.vy>0&&this.x+8>pl.x&&this.x<pl.x+pl.w){
          const prev=this.y+24-this.vy;
          if(prev<=pl.y+4&&this.y+24>=pl.y){this.y=pl.y-24;this.onGround=true;this.groundTimer=30;this.rising=false;}
        }
      }
      for(const sg of (stage.grounds||[])){
        if(!this.onGround&&this.x+8>sg.x&&this.x<sg.x+sg.w&&this.y+24>=sg.y&&this.y+24<=sg.y+sg.h+Math.abs(this.vy)+2){
          this.y=sg.y-24;this.onGround=true;this.groundTimer=30;this.rising=false;
        }
      }
    } else {
      this.groundTimer--;
      if(this.groundTimer<=0){this.dead=true;return;}
    }
    for(const p of players){
      if(p===this.owner||sameTeam(p,this.owner)||p.dead||p.hitlag>0)continue;
      if(this.x<p.right&&this.x+8>p.x&&this.y<p.bottom&&this.y+24>p.y){
        if(p.damage>=DEATH_THRESHOLD&&!p.isDummy){instakill(p,this.x+4,this.y+12);this.dead=true;return;}
        p.damage+=Math.round(this.dmg*(p.ch.def??1)); p.hitFlash=14; p.charging=false; p.chargeTime=0;
        const km=kbScale(p.damage), kb=this.kb*km/p.ch.weight;
        if(!this.rising){p.vx=this.owner.facing*kb*0.5;p.vy=kb*0.6;}
        else{p.vx=this.owner.facing*kb*0.4;p.vy=-kb*0.8;}
        p.vx=Math.max(-MAX_KB,Math.min(MAX_KB,p.vx));
        p.vy=Math.max(-MAX_KB,Math.min(MAX_KB,p.vy));
        p.hstun=Math.min(50,Math.floor(8+kb*2));
        p.onGnd=false;p.onPlat=false;p.hitlag=4;
        addHitParticles(this.x+4,this.y+12,this.owner.ch.color,true);
        this.dead=true;return;
      }
    }
  }
  draw(){
    if(this.dead)return;
    const ch=this.owner.ch;
    const alpha=this.onGround?Math.max(0.25,this.groundTimer/30):1;
    ctx.save();ctx.globalAlpha=alpha;
    ctx.translate(this.x+4,this.y+12);
    ctx.rotate(this.onGround?0:this.rising?-Math.PI*0.5:Math.PI*0.5);
    ctx.strokeStyle=ch.eyeCol;ctx.lineWidth=3;ctx.lineCap='round';
    ctx.shadowBlur=14;ctx.shadowColor=ch.eyeCol;
    ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(0,14);ctx.stroke();
    ctx.strokeStyle=ch.accent;ctx.lineWidth=5;
    ctx.beginPath();ctx.moveTo(-6,-10);ctx.lineTo(6,-10);ctx.stroke();
    ctx.fillStyle=ch.eyeCol;ctx.shadowBlur=0;
    ctx.beginPath();ctx.moveTo(-3,12);ctx.lineTo(3,12);ctx.lineTo(0,18);ctx.closePath();ctx.fill();
    ctx.restore();
  }
}

// ---- Robot Drawing ----
function drawCharacter(ctx,ch,w,h,atk,grounded,wf,extra){
  if(ch.id===0)drawBolt(ctx,ch,w,h,atk,grounded,wf);
  else if(ch.id===1)drawCrusher(ctx,ch,w,h,atk,grounded,wf);
  else if(ch.id===2)drawZippy(ctx,ch,w,h,atk,grounded,wf);
  else if(ch.id===3)drawBlaster(ctx,ch,w,h,atk,grounded,wf);
  else if(ch.id===4)drawEdge(ctx,ch,w,h,atk,grounded,wf);
  else if(ch.id===5)drawPierce(ctx,ch,w,h,atk,grounded,wf);
  else if(ch.id===6)drawRocket(ctx,ch,w,h,atk,grounded,wf,extra||{});
  else if(ch.id===7)drawUnstable(ctx,ch,w,h,atk,grounded,wf);
  else if(ch.id===8)drawBlade(ctx,ch,w,h,atk,grounded,wf);
  else if(ch.id===10)drawPristine(ctx,ch,w,h,atk,grounded,wf);
  else if(ch.id===11)drawMagma(ctx,ch,w,h,atk,grounded,wf);
  else if(ch.id===12)drawFactory(ctx,ch,w,h,atk,grounded,wf);
  else if(ch.id===13)drawGlitch(ctx,ch,w,h,atk,grounded,wf,extra||{});
  else if(ch.id===14)drawKing(ctx,ch,w,h,atk,grounded,wf,extra||{});
  else drawDummy(ctx,ch,w,h);
}

function drawMagma(ctx,ch,w,h,atk,grounded,wf){
  const bx=-w/2,by=-h/2;
  const inAct=atk&&atk.frame>=atk.su&&atk.frame<atk.su+atk.act;
  const inSU=atk&&atk.frame<atk.su;
  const dir=atk?atk.dir:null;
  const heavy=atk&&atk.type==='heavy';
  const tAct=atk&&inAct?(atk.frame-atk.su)/Math.max(atk.act,1):0;
  const bob=grounded?Math.sin(wf*Math.PI/2)*1.5:0, by2=by+bob;
  const ll=grounded?(wf<2?4:-4):0;

  // Shadow
  if(grounded){ctx.fillStyle='rgba(0,0,0,0.28)';ctx.beginPath();ctx.ellipse(0,h/2+4,w*0.5,6,0,0,Math.PI*2);ctx.fill();}

  // Legs (thick, stocky)
  rrFill(bx+5,by2+h*0.65,17,h*0.3+ll,5,ch.accent);
  rrFill(bx+w-22,by2+h*0.65,17,h*0.3-ll,5,ch.accent);
  ctx.fillStyle='#1a0000';
  ctx.beginPath();ctx.ellipse(bx+13,by2+h*0.95+ll/2,12,5,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(bx+w-13,by2+h*0.95-ll/2,12,5,0,0,Math.PI*2);ctx.fill();

  // Body (wide, armored)
  rrFill(bx+2,by2+h*0.34,w-4,h*0.42,10,ch.color);
  // Armor ridge lines
  ctx.strokeStyle=ch.accent;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(bx+9,by2+h*0.37);ctx.lineTo(bx+9,by2+h*0.72);ctx.stroke();
  ctx.beginPath();ctx.moveTo(bx+w-9,by2+h*0.37);ctx.lineTo(bx+w-9,by2+h*0.72);ctx.stroke();
  // Chest vent glow
  const ventActive=inAct&&!heavy&&(dir==='side'||dir==='neutral'||dir==='up');
  const ventCol=ventActive?ch.eyeCol:(inAct?'#550800':'#330500');
  rrFill(bx+w*0.28,by2+h*0.46,w*0.44,h*0.09,4,ventCol);
  if(ventActive){ctx.save();ctx.shadowBlur=14;ctx.shadowColor=ch.eyeCol;ctx.globalAlpha=0.45;rrPath(bx+w*0.28,by2+h*0.46,w*0.44,h*0.09,4);ctx.fillStyle=ch.eyeCol;ctx.fill();ctx.restore();}

  // Arms with flame nozzles
  const armY=by2+h*0.38;
  // Left arm
  ctx.save();ctx.translate(bx-4,armY);
  if(inAct&&!heavy&&dir==='up'){ctx.translate(-8,0);}
  rrFill(-18,0,18,h*0.3,6,ch.color);
  rrFill(-22,h*0.07,10,18,4,ch.accent);
  ctx.fillStyle='#1a0000';ctx.beginPath();ctx.arc(-17,h*0.19,5,0,Math.PI*2);ctx.fill();
  if(ventActive||inAct){ctx.save();ctx.shadowBlur=8;ctx.shadowColor=ch.eyeCol;ctx.fillStyle=ch.eyeCol;ctx.globalAlpha=0.7;ctx.beginPath();ctx.arc(-17,h*0.19,3,0,Math.PI*2);ctx.fill();ctx.restore();}
  ctx.restore();
  // Right arm
  ctx.save();ctx.translate(bx+w+4,armY);
  if(inAct&&!heavy&&dir==='up'){ctx.translate(8,0);}
  rrFill(0,0,18,h*0.3,6,ch.color);
  rrFill(12,h*0.07,10,18,4,ch.accent);
  ctx.fillStyle='#1a0000';ctx.beginPath();ctx.arc(17,h*0.19,5,0,Math.PI*2);ctx.fill();
  if(ventActive||inAct){ctx.save();ctx.shadowBlur=8;ctx.shadowColor=ch.eyeCol;ctx.fillStyle=ch.eyeCol;ctx.globalAlpha=0.7;ctx.beginPath();ctx.arc(17,h*0.19,3,0,Math.PI*2);ctx.fill();ctx.restore();}
  ctx.restore();

  // === Flame effects ===
  // Side light: flamethrower stream from right nozzle
  if(!heavy&&inAct&&(dir==='side'||dir==='neutral')){
    ctx.save();
    const flameX=bx+w+14, flameLen=(ch.flameRange||220)*0.92;
    for(let i=0;i<7;i++){
      const t=i/6, wobY=(Math.random()-.5)*22*t;
      ctx.globalAlpha=(1-t)*0.78;
      const gr=ctx.createLinearGradient(flameX,armY+h*0.19,flameX+flameLen*t,armY+h*0.19+wobY);
      gr.addColorStop(0,'#ffaa00');gr.addColorStop(0.4,'#ff3300');gr.addColorStop(1,'rgba(180,0,0,0)');
      ctx.strokeStyle=gr;ctx.lineWidth=18*(1-t)+4;ctx.lineCap='round';
      ctx.shadowBlur=12*( 1-t);ctx.shadowColor='#ff4400';
      ctx.beginPath();ctx.moveTo(flameX,armY+h*0.19+wobY*0.1);ctx.lineTo(flameX+flameLen*t,armY+h*0.19+wobY);ctx.stroke();
    }
    ctx.restore();
  }
  // Up light: upward flamethrower from both arms
  if(!heavy&&inAct&&dir==='up'){
    ctx.save();
    const flameLen=ch.flameRange||220;
    for(let side=-1;side<=1;side+=2){
      const nozzX=side*(w*0.5+18);
      for(let i=0;i<6;i++){
        const t=i/5, wobX=(Math.random()-.5)*26*t;
        ctx.globalAlpha=(1-t)*0.72;
        const gr=ctx.createLinearGradient(nozzX,armY+h*0.19,nozzX+wobX,armY+h*0.19-flameLen*t);
        gr.addColorStop(0,'#ffaa00');gr.addColorStop(0.4,'#ff3300');gr.addColorStop(1,'rgba(180,0,0,0)');
        ctx.strokeStyle=gr;ctx.lineWidth=16*(1-t)+3;ctx.lineCap='round';
        ctx.shadowBlur=10*(1-t);ctx.shadowColor='#ff4400';
        ctx.beginPath();ctx.moveTo(nozzX+wobX*0.1,armY+h*0.19);ctx.lineTo(nozzX+wobX,armY+h*0.19-flameLen*t);ctx.stroke();
      }
    }
    ctx.restore();
  }
  // Down light: burst flash
  if(!heavy&&inAct&&dir==='down'){
    ctx.save();ctx.globalAlpha=Math.max(0,(1-tAct*3)*0.8);
    ctx.shadowBlur=20;ctx.shadowColor=ch.eyeCol;
    const gr=ctx.createRadialGradient(0,by2+h*0.55,3,0,by2+h*0.55,28);
    gr.addColorStop(0,'#ffcc00');gr.addColorStop(1,'rgba(255,50,0,0)');
    ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,by2+h*0.55,28,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  // Down heavy: fire jet below
  if(heavy&&inAct&&dir==='down'){
    ctx.save();ctx.globalAlpha=tAct*0.85;
    const gr=ctx.createRadialGradient(0,by2+h*0.76,4,0,by2+h*0.76,60);
    gr.addColorStop(0,'#ffee00');gr.addColorStop(0.35,'#ff4400');gr.addColorStop(1,'rgba(200,0,0,0)');
    ctx.fillStyle=gr;ctx.shadowBlur=24;ctx.shadowColor='#ff4400';
    ctx.beginPath();ctx.arc(0,by2+h*0.76,60,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  // Up heavy: semicircle fire arcs above
  if(heavy&&(inAct||inSU)&&dir==='up'){
    ctx.save();
    const progress=inSU?(atk.frame/Math.max(atk.su,1)):1;
    const radius=75+progress*15;
    const numRays=10;
    for(let i=0;i<numRays;i++){
      const t=i/(numRays-1);
      const ang=-Math.PI+t*Math.PI; // semicircle: left to right above
      const wobble=(Math.sin(frame*0.3+i)*8)*progress;
      const endX=Math.cos(ang)*(radius+wobble);
      const endY=Math.sin(ang)*(radius+wobble)+by2+h*0.22;
      ctx.globalAlpha=progress*(0.5+Math.sin(t*Math.PI)*0.45);
      ctx.strokeStyle=t<0.5?'#ffaa00':'#ff3300';
      ctx.lineWidth=10*(Math.sin(t*Math.PI)*0.7+0.3)+2;
      ctx.lineCap='round';ctx.shadowBlur=14;ctx.shadowColor='#ff4400';
      ctx.beginPath();ctx.moveTo(0,by2+h*0.22);ctx.lineTo(endX,endY);ctx.stroke();
    }
    ctx.restore();
  }
  // Side heavy: pebble launch flash
  if(heavy&&inSU&&(dir==='side'||dir==='neutral')){
    const tSU=atk.frame/Math.max(atk.su,1);
    ctx.save();ctx.globalAlpha=tSU*0.55;
    const mx=bx+w+14;
    ctx.shadowBlur=18;ctx.shadowColor=ch.eyeCol;ctx.fillStyle=ch.eyeCol;
    ctx.beginPath();ctx.arc(mx,armY+h*0.19,4+tSU*7,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  // Head (blocky, armored)
  rrFill(bx+4,by2+h*0.06,w-8,h*0.31,8,ch.color);
  rrFill(bx+8,by2+h*0.08,w-16,h*0.065,3,ch.accent);
  // Eyes (glowing slits)
  const eyeC=inAct?ch.eyeCol:'#550800';
  ctx.fillStyle=eyeC;
  if(inAct){ctx.shadowBlur=16;ctx.shadowColor=ch.eyeCol;}
  ctx.beginPath();ctx.rect(bx+9,by2+h*0.145,11,7);ctx.fill();
  ctx.beginPath();ctx.rect(bx+w-20,by2+h*0.145,11,7);ctx.fill();
  ctx.shadowBlur=0;
  // Mouth grill
  ctx.strokeStyle=ch.accent;ctx.lineWidth=1.5;
  for(let i=0;i<5;i++){
    ctx.beginPath();ctx.moveTo(bx+10+i*7,by2+h*0.265);ctx.lineTo(bx+10+i*7,by2+h*0.325);ctx.stroke();
  }
}

function drawFactory(ctx,ch,w,h,atk,grounded,wf){
  const bx=-w/2,by=-h/2;
  const inAct=atk&&atk.frame>=atk.su&&atk.frame<atk.su+atk.act;
  const inSU=atk&&atk.frame<atk.su;
  const dir=atk?atk.dir:null;
  const heavy=atk&&atk.type==='heavy';
  const tAct=atk&&inAct?(atk.frame-atk.su)/Math.max(atk.act,1):0;
  const bob=grounded?Math.sin(wf*Math.PI/2)*2:0, by2=by+bob;

  // Shadow
  if(grounded){ctx.fillStyle='rgba(0,0,0,0.34)';ctx.beginPath();ctx.ellipse(0,h/2+5,w*0.54,7,0,0,Math.PI*2);ctx.fill();}

  // Legs (heavy pistons)
  const ll=grounded?(wf<2?5:-5):0;
  rrFill(bx+6,by2+h*0.67,20,h*0.28+ll,6,ch.accent);
  rrFill(bx+w-26,by2+h*0.67,20,h*0.28-ll,6,ch.accent);
  // Foot pads
  rrFill(bx+2,by2+h*0.92+ll/2,28,10,4,'#222');
  rrFill(bx+w-30,by2+h*0.92-ll/2,28,10,4,'#222');
  // Piston rods
  ctx.strokeStyle='#555';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(bx+16,by2+h*0.71);ctx.lineTo(bx+16,by2+h*0.87);ctx.stroke();
  ctx.beginPath();ctx.moveTo(bx+w-16,by2+h*0.71);ctx.lineTo(bx+w-16,by2+h*0.87);ctx.stroke();

  // Body (large industrial block)
  rrFill(bx+2,by2+h*0.31,w-4,h*0.43,8,ch.color);
  // Vertical armor ridges
  ctx.strokeStyle=ch.accent;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(bx+10,by2+h*0.34);ctx.lineTo(bx+10,by2+h*0.70);ctx.stroke();
  ctx.beginPath();ctx.moveTo(bx+w-10,by2+h*0.34);ctx.lineTo(bx+w-10,by2+h*0.70);ctx.stroke();
  // Chest gear emblem
  ctx.save();ctx.translate(0,by2+h*0.50);ctx.rotate(wf*0.04);
  drawGearShape(ctx,h*0.09,8,ch.accent,ch.hi);
  ctx.restore();
  // Vent slots
  ctx.fillStyle='#222';
  for(let i=0;i<4;i++){ctx.fillRect(bx+12+i*10,by2+h*0.59,7,9);}
  // Corner bolts
  ctx.fillStyle='#888';
  for(const [bx3,by3] of [[bx+8,by2+h*0.35],[bx+w-8,by2+h*0.35],[bx+8,by2+h*0.69],[bx+w-8,by2+h*0.69]]){
    ctx.beginPath();ctx.arc(bx3,by3,3,0,Math.PI*2);ctx.fill();
  }

  // Arms
  const armY=by2+h*0.33, armH=h*0.30;
  // Left arm
  rrFill(bx-16,armY,18,armH,6,ch.color);
  rrFill(bx-18,armY+armH*0.28,12,armH*0.42,4,ch.accent);
  // Right arm (extends further during drill)
  const rShift=(heavy&&inAct&&(dir==='side'||dir==='neutral'))?10:0;
  rrFill(bx+w-2+rShift,armY,18,armH,6,ch.color);
  rrFill(bx+w+6+rShift,armY+armH*0.28,12,armH*0.42,4,ch.accent);

  // Head (large rectangular industrial)
  rrFill(bx+4,by2,w-8,h*0.34,10,ch.color);
  ctx.strokeStyle=ch.accent;ctx.lineWidth=2;
  ctx.strokeRect(bx+8,by2+h*0.04,w-16,h*0.25);
  // Exhaust stacks on top
  rrFill(bx+8,by2-10,9,14,3,'#333');
  rrFill(bx+w-17,by2-10,9,14,3,'#333');
  // Stack smoke puffs
  if(grounded&&wf%2===0){ctx.fillStyle='rgba(120,120,120,0.3)';ctx.beginPath();ctx.arc(bx+12,by2-14,5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(bx+w-13,by2-14,5,0,Math.PI*2);ctx.fill();}
  // Eyes
  const eyeGlow=inAct;
  ctx.fillStyle=eyeGlow?ch.eyeCol:'#1a3344';
  if(eyeGlow){ctx.save();ctx.shadowBlur=18;ctx.shadowColor=ch.eyeCol;}
  rrFill(bx+10,by2+h*0.08,20,11,3,eyeGlow?ch.eyeCol:'#1a3344');
  rrFill(bx+w-30,by2+h*0.08,20,11,3,eyeGlow?ch.eyeCol:'#1a3344');
  if(eyeGlow){ctx.restore();}
  ctx.shadowBlur=0;

  // === ATTACK VISUALS ===

  // Side light: arm wind-up and gear swing
  if(!heavy&&(inSU||inAct)&&(dir==='side'||dir==='neutral')){
    ctx.save();
    const pivX=bx+w+6, pivY=by2+h*0.38+armH*0.1;
    const startA=-Math.PI*0.78, endA=Math.PI*0.18;
    const prog=inSU?atk.frame/Math.max(atk.su,1):1;
    const angle=inSU?startA:startA+(endA-startA)*tAct;
    const handleLen=60;
    const gx=pivX+Math.cos(angle)*handleLen, gy=pivY+Math.sin(angle)*handleLen;

    // Swing arc trail (active only)
    if(inAct&&tAct>0.05){
      ctx.strokeStyle=ch.eyeCol; ctx.lineWidth=6; ctx.lineCap='round';
      ctx.globalAlpha=0.22*(1-tAct);
      ctx.beginPath();
      ctx.arc(pivX,pivY,handleLen,startA,angle);
      ctx.stroke();
      ctx.globalAlpha=1;
    }

    // Handle (thick arm extension)
    ctx.strokeStyle=inAct?ch.hi:'#888'; ctx.lineWidth=7; ctx.lineCap='round';
    if(inAct){ctx.shadowBlur=8;ctx.shadowColor=ch.eyeCol;}
    ctx.globalAlpha=inSU?0.5+prog*0.5:1;
    ctx.beginPath();ctx.moveTo(pivX,pivY);ctx.lineTo(gx,gy);ctx.stroke();

    // Gear at tip
    ctx.translate(gx,gy);
    ctx.rotate(angle + (inAct?tAct*Math.PI*3:0));
    const gSize=inAct?22:16;
    if(inAct){ctx.shadowBlur=16;ctx.shadowColor=ch.eyeCol;}
    drawGearShape(ctx,gSize,8,inAct?ch.eyeCol:ch.hi,'#333');

    // Impact sparks on final quarter of swing
    if(inAct&&tAct>0.7){
      ctx.shadowBlur=0; ctx.rotate(-(angle+tAct*Math.PI*3));
      ctx.strokeStyle='#ffffff'; ctx.lineWidth=1.5;
      for(let i=0;i<6;i++){
        const sa=((i/6)*Math.PI*2)+tAct*4;
        const sr=gSize+4+Math.random()*10;
        ctx.globalAlpha=0.7*(1-tAct)*3;
        ctx.beginPath();ctx.moveTo(Math.cos(sa)*gSize,Math.sin(sa)*gSize);ctx.lineTo(Math.cos(sa)*sr,Math.sin(sa)*sr);ctx.stroke();
      }
    }
    ctx.shadowBlur=0; ctx.globalAlpha=1;
    ctx.restore();
  }

  // Up light: arm raises, gear visible at peak of throw (startup only)
  if(!heavy&&inSU&&dir==='up'){
    ctx.save();ctx.globalAlpha=0.6+atk.frame/atk.su*0.4;
    const raise=atk.frame/atk.su*32;
    ctx.strokeStyle=ch.color;ctx.lineWidth=5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(bx+w+8,armY+armH*0.4);ctx.lineTo(bx+w+14,armY-raise);ctx.stroke();
    ctx.translate(bx+w+14,armY-raise-14);ctx.rotate(-atk.frame*0.2);
    drawGearShape(ctx,12,5,ch.hi,ch.accent);
    ctx.restore();
  }

  // Side heavy: drill arm extended + spinning tip
  if(heavy&&(inSU||inAct)&&(dir==='side'||dir==='neutral')){
    ctx.save();
    const ext=(inAct?12:4)+rShift;
    const drillBaseX=bx+w+ext, drillY=armY+armH*0.42;
    // Drill body
    ctx.fillStyle='#555';ctx.fillRect(drillBaseX,drillY-9,42,18);
    ctx.strokeStyle='#777';ctx.lineWidth=1;ctx.strokeRect(drillBaseX,drillY-9,42,18);
    // Spinning flutes
    const spin=atk?atk.frame*0.45:0;
    ctx.save();ctx.translate(drillBaseX+48,drillY);ctx.rotate(spin);
    ctx.fillStyle='#888';
    for(let i=0;i<3;i++){
      ctx.save();ctx.rotate(i*Math.PI*2/3);
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(16,4);ctx.lineTo(16,-4);ctx.closePath();ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    if(inAct){ctx.shadowBlur=10;ctx.shadowColor=ch.eyeCol;ctx.strokeStyle=ch.eyeCol;ctx.lineWidth=1.5;ctx.strokeRect(drillBaseX,drillY-9,42,18);}
    ctx.restore();
  }

  // Down heavy startup: indicators for Zap spawn positions
  if(heavy&&inSU&&dir==='down'){
    const prog=atk.frame/atk.su;
    ctx.save();ctx.globalAlpha=prog*0.75;
    for(const ox of [-50,0,50]){
      ctx.strokeStyle=ch.eyeCol;ctx.lineWidth=2;ctx.setLineDash([3,3]);
      ctx.beginPath();ctx.arc(ox,h*0.2,10,0,Math.PI*2);ctx.stroke();
    }
    ctx.setLineDash([]);ctx.restore();
  }

  // Up heavy: giant gear on a chain, sweeping wide arc
  if(heavy&&(inSU||inAct)&&dir==='up'){
    ctx.save();
    const pivX=0, pivY=by2+h*0.06;
    const chainLen=80;
    const startA=-Math.PI*0.88, endA=Math.PI*0.88;
    let angle;
    const prog=inSU?atk.frame/Math.max(atk.su,1):1;
    if(inSU){
      // Wind up: gear rises to starting position
      angle=-Math.PI*0.5 + (startA+Math.PI*0.5)*prog;
      ctx.globalAlpha=0.35+prog*0.65;
    } else {
      angle=startA+tAct*(endA-startA);
    }
    const gx=pivX+Math.cos(angle)*chainLen, gy=pivY+Math.sin(angle)*chainLen;

    // Sweep arc trail
    if(inAct&&tAct>0.04){
      ctx.save();
      ctx.strokeStyle=ch.eyeCol; ctx.lineWidth=10; ctx.lineCap='round';
      ctx.globalAlpha=0.18*(1-tAct*0.7);
      ctx.shadowBlur=12; ctx.shadowColor=ch.eyeCol;
      ctx.beginPath(); ctx.arc(pivX,pivY,chainLen,startA,angle); ctx.stroke();
      ctx.globalAlpha=0.08*(1-tAct);
      ctx.lineWidth=22;
      ctx.beginPath(); ctx.arc(pivX,pivY,chainLen,startA,angle); ctx.stroke();
      ctx.restore();
    }

    // Chain links
    const linkCount=8;
    for(let i=0;i<=linkCount;i++){
      const t2=i/linkCount;
      const la=inSU?angle:(startA+(angle-startA)*t2);
      const lx=pivX+Math.cos(la)*chainLen*(i/linkCount);
      const ly=pivY+Math.sin(la)*chainLen*(i/linkCount);
      ctx.fillStyle=i%2===0?'#777':'#555';
      ctx.shadowBlur=0;
      ctx.beginPath();ctx.arc(lx,ly,3,0,Math.PI*2);ctx.fill();
    }
    // Chain rod
    ctx.strokeStyle='#666'; ctx.lineWidth=3; ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(pivX,pivY);ctx.lineTo(gx,gy);ctx.stroke();

    // Giant gear
    ctx.translate(gx,gy);
    const spin=inAct?tAct*Math.PI*4:(prog*Math.PI);
    ctx.rotate(spin);
    if(inAct){ctx.shadowBlur=20;ctx.shadowColor=ch.eyeCol;}
    drawGearShape(ctx,28,9,inAct?ch.eyeCol:ch.hi,inAct?ch.accent:'#444');

    // Sparks at apex (center of swing)
    if(inAct&&tAct>0.45&&tAct<0.65){
      ctx.rotate(-spin);
      ctx.strokeStyle='#ffffff'; ctx.lineWidth=1.5;
      const sparkAlpha=1-Math.abs(tAct-0.55)*20;
      for(let i=0;i<8;i++){
        const sa=(i/8)*Math.PI*2;
        ctx.globalAlpha=Math.max(0,sparkAlpha)*0.9;
        ctx.beginPath();ctx.moveTo(Math.cos(sa)*28,Math.sin(sa)*28);ctx.lineTo(Math.cos(sa)*46,Math.sin(sa)*46);ctx.stroke();
      }
    }
    ctx.shadowBlur=0; ctx.globalAlpha=1;
    ctx.restore();
  }
}

function drawGlitch(ctx,ch,w,h,atk,grounded,wf,extra){
  const bx=-w/2,by=-h/2;
  const inAct=atk&&atk.frame>=atk.su&&atk.frame<atk.su+atk.act;
  const inSU=atk&&atk.frame<atk.su;
  const dir=atk?atk.dir:null;
  const heavy=atk&&atk.type==='heavy';
  const tAct=atk&&inAct?(atk.frame-atk.su)/Math.max(atk.act,1):0;
  const bob=grounded?Math.sin(wf*Math.PI/2)*1.5:0, by2=by+bob;
  const ghost=extra.glitchGhost||false;
  const phased=extra.glitchPhaseTimer>0;
  const gw=extra.glitchWeapon;

  // Ghost state: render faintly
  if(ghost){
    ctx.globalAlpha=0.08+Math.random()*0.06;
    ctx.shadowBlur=18; ctx.shadowColor=ch.eyeCol;
  }
  // Phase state: pulsing pink glow
  if(phased){
    const pulse=Math.abs(Math.sin(wf*0.18));
    ctx.shadowBlur=14+pulse*12; ctx.shadowColor=ch.color;
    ctx.globalAlpha=0.55+pulse*0.35;
  }

  // Glitch body flicker: randomly offset small fragments in startup/active
  const glitchFlicker=(!ghost&&!phased&&atk&&(inSU||inAct)&&Math.random()<0.35);
  if(glitchFlicker){ctx.save();ctx.translate((Math.random()-0.5)*6,(Math.random()-0.5)*4);}

  // Shadow
  if(grounded&&!ghost){ctx.fillStyle='rgba(0,0,0,0.22)';ctx.beginPath();ctx.ellipse(0,h/2+4,w*0.44,5,0,0,Math.PI*2);ctx.fill();}

  // Legs (thin, fast)
  const ll=grounded?(wf<2?3:-3):0;
  rrFill(bx+5,by2+h*0.68,12,h*0.28+ll,4,ch.accent);
  rrFill(bx+w-17,by2+h*0.68,12,h*0.28-ll,4,ch.accent);
  // Foot glow
  ctx.fillStyle=ch.accent;
  ctx.beginPath();ctx.ellipse(bx+11,by2+h*0.96+ll/2,10,4,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(bx+w-11,by2+h*0.96-ll/2,10,4,0,0,Math.PI*2);ctx.fill();

  // Body (sleek, thin robot)
  rrFill(bx+4,by2+h*0.36,w-8,h*0.38,9,ch.color);
  // Chest accent stripe
  rrFill(bx+w*0.3,by2+h*0.40,w*0.4,h*0.14,4,ch.accent);
  // Glitching body segments: random rect flickers
  if(inAct||inSU){
    ctx.save();
    ctx.globalAlpha=(ctx.globalAlpha||1)*0.7;
    const gx=bx+4+Math.random()*(w-12), gy=by2+h*0.38+Math.random()*h*0.28;
    ctx.fillStyle=Math.random()<0.5?ch.eyeCol:ch.hi;
    ctx.fillRect(gx,gy,4+Math.random()*14,2+Math.random()*6);
    ctx.restore();
  }

  // Arms (attached, thin)
  if(!inAct||(dir!=='side'&&dir!=='neutral'&&dir!=='up'&&dir!=='down')||heavy){
    // Normal arms
    rrFill(bx-4,by2+h*0.38,8,h*0.26,4,ch.accent);       // left arm
    rrFill(bx+w-4,by2+h*0.38,8,h*0.26,4,ch.accent);      // right arm
  } else if(dir==='up'&&!heavy){
    // Up light: arm stubs only (arms are away)
    rrFill(bx-4,by2+h*0.38,8,10,4,ch.accent);
    rrFill(bx+w-4,by2+h*0.38,8,10,4,ch.accent);
    // Teleported arms drawn in world space (detached)
    const tar=ch.teleArmRange||150;
    ctx.save();
    ctx.shadowBlur=16; ctx.shadowColor=ch.eyeCol;
    ctx.fillStyle=ch.accent;
    // Left arm at -tar y
    rrFill(-20,-tar-16,16,28,4,ch.accent);
    ctx.fillStyle=ch.eyeCol; ctx.fillRect(-16,-tar-8,8,4);
    // Right arm at -tar y
    rrFill(4,-tar-16,16,28,4,ch.accent);
    ctx.fillStyle=ch.eyeCol; ctx.fillRect(8,-tar-8,8,4);
    // Portal effect at each arm
    ctx.strokeStyle=ch.eyeCol; ctx.lineWidth=2; ctx.globalAlpha=0.5+tAct*0.4;
    ctx.beginPath();ctx.arc(-12,-tar-2,14,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(12,-tar-2,14,0,Math.PI*2);ctx.stroke();
    ctx.shadowBlur=0; ctx.restore();
  } else if(dir==='down'&&!heavy){
    // Down light: arm stubs only (arms are below)
    rrFill(bx-4,by2+h*0.38,8,10,4,ch.accent);
    rrFill(bx+w-4,by2+h*0.38,8,10,4,ch.accent);
    // Teleported arms drawn in world space (detached, below)
    const tar=ch.teleArmRange||150;
    ctx.save();
    ctx.shadowBlur=16; ctx.shadowColor=ch.eyeCol;
    ctx.fillStyle=ch.accent;
    // Left arm at +tar y
    rrFill(-20,tar-12,16,28,4,ch.accent);
    ctx.fillStyle=ch.eyeCol; ctx.fillRect(-16,tar-4,8,4);
    // Right arm at +tar y
    rrFill(4,tar-12,16,28,4,ch.accent);
    ctx.fillStyle=ch.eyeCol; ctx.fillRect(8,tar-4,8,4);
    // Portal effect at each arm
    ctx.strokeStyle=ch.eyeCol; ctx.lineWidth=2; ctx.globalAlpha=0.5+tAct*0.4;
    ctx.beginPath();ctx.arc(-12,tar+2,14,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(12,tar+2,14,0,Math.PI*2);ctx.stroke();
    ctx.shadowBlur=0; ctx.restore();
  } else if((dir==='side'||dir==='neutral')&&!heavy){
    // Side light: one arm stump (the active arm is teleported)
    rrFill(bx-4,by2+h*0.38,8,10,4,ch.accent); // left stub
    rrFill(bx+w-4,by2+h*0.38,8,10,4,ch.accent); // right stub
    // Teleported arm in world space: always draw to the right in local (+facing handled by scale)
    const tar=ch.teleArmRange||150;
    ctx.save();
    ctx.shadowBlur=18; ctx.shadowColor=ch.eyeCol;
    rrFill(tar-8,-8,20,28,5,ch.accent);
    ctx.fillStyle=ch.eyeCol; ctx.fillRect(tar-4,-4,12,4);
    // Portal ring at departure and arrival
    ctx.strokeStyle=ch.eyeCol; ctx.lineWidth=2; ctx.globalAlpha=(0.4+tAct*0.5);
    ctx.beginPath();ctx.arc(tar+2,8,16,0,Math.PI*2);ctx.stroke();
    ctx.shadowBlur=0; ctx.restore();
  }

  // Head (small, round)
  rrFill(bx+6,by2+2,w-12,h*0.28,8,ch.color);
  // Antenna: glitching flicker
  if(!ghost){
    ctx.strokeStyle=ch.accent; ctx.lineWidth=2;
    const aOff=inAct?Math.sin(atk.frame*1.8)*4:0;
    ctx.beginPath();ctx.moveTo(0,by2+4);ctx.lineTo(aOff,by2-14);ctx.stroke();
    ctx.fillStyle=ch.eyeCol;ctx.shadowBlur=8;ctx.shadowColor=ch.eyeCol;
    ctx.beginPath();ctx.arc(aOff,by2-14,3,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
  }
  // Eyes (glowing white/pink)
  ctx.shadowBlur=12; ctx.shadowColor=ch.eyeCol;
  ctx.fillStyle=ch.eyeCol;
  ctx.beginPath();ctx.arc(bx+w*0.33,by2+h*0.14,4,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(bx+w*0.67,by2+h*0.14,4,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;

  // Down heavy: reappear flash on final active frame
  if(heavy&&dir==='down'&&atk&&atk.frame===atk.su+atk.act-1){
    ctx.save();
    ctx.globalAlpha=0.85;
    ctx.shadowBlur=30; ctx.shadowColor=ch.eyeCol;
    ctx.fillStyle=ch.eyeCol;
    ctx.beginPath();ctx.arc(0,0,w*0.8,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  // Side heavy startup: stolen weapon materialising
  if(heavy&&(dir==='side'||dir==='neutral')&&inSU&&gw==='edge'){
    const prog=atk.frame/Math.max(atk.su,1);
    const handX=w*0.5-4, handY=-h*0.12+bob;
    ctx.save();
    ctx.translate(handX,handY);
    ctx.rotate(-Math.PI*0.75);
    ctx.globalAlpha=prog*0.75;
    ctx.shadowBlur=6+prog*22; ctx.shadowColor='#ff88ff';
    ctx.strokeStyle='#ff88ff'; ctx.lineWidth=3+prog*3; ctx.lineCap='round';
    const sLenSU=88*prog;
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,sLenSU);ctx.stroke();
    // Glitch static fragments appearing along the blade
    if(prog>0.4){
      ctx.strokeStyle='#ffffff'; ctx.lineWidth=1.5; ctx.globalAlpha=prog*0.5;
      for(let i=0;i<4;i++){
        const fy2=sLenSU*(0.15+i*0.2);
        ctx.beginPath();ctx.moveTo(-5+Math.random()*3,fy2);ctx.lineTo(5-Math.random()*3,fy2+sLenSU*0.12);ctx.stroke();
      }
    }
    ctx.shadowBlur=0; ctx.restore();
  }

  // Side heavy: draw stolen weapon during active
  if(heavy&&(dir==='side'||dir==='neutral')&&inAct&&gw){
    ctx.save();
    ctx.globalAlpha=0.85+Math.random()*0.1;
    ctx.shadowBlur=16; ctx.shadowColor=ch.eyeCol;
    if(gw==='edge'){
      // Edge sword: animated overhead swing arc matching Edge's actual attack
      const handX=w*0.5-4, handY=-h*0.12+bob;
      ctx.save();
      ctx.translate(handX,handY);
      const sLen=88;
      const swordAng=-Math.PI*0.75+tAct*Math.PI*1.5;
      ctx.rotate(swordAng);
      ctx.shadowBlur=22; ctx.shadowColor='#ff88ff';
      // Blade
      ctx.strokeStyle='#ffffff'; ctx.lineWidth=5; ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,sLen);ctx.stroke();
      // Highlight shimmer
      ctx.strokeStyle='#dd99ff'; ctx.lineWidth=2; ctx.globalAlpha=0.65;
      ctx.beginPath();ctx.moveTo(0,4);ctx.lineTo(0,sLen*0.85);ctx.stroke();
      ctx.globalAlpha=0.85+Math.random()*0.1;
      // Guard
      ctx.shadowBlur=10; ctx.strokeStyle='#881acc'; ctx.lineWidth=7; ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(-9,2);ctx.lineTo(9,2);ctx.stroke();
      // Tip
      ctx.shadowBlur=18; ctx.shadowColor='#ffffff'; ctx.fillStyle='#ffffff';
      ctx.beginPath();ctx.moveTo(-4,sLen);ctx.lineTo(4,sLen);ctx.lineTo(0,sLen+13);ctx.closePath();ctx.fill();
      // Swing trail
      ctx.shadowBlur=0; ctx.strokeStyle='#ff88ff'; ctx.lineWidth=3;
      ctx.globalAlpha=0.4*(1-tAct);
      ctx.beginPath();ctx.arc(0,0,sLen*0.82,-Math.PI*0.75,swordAng);ctx.stroke();
      ctx.restore();
    } else if(gw==='pierce'){
      // Pierce spear: long horizontal shaft
      ctx.strokeStyle='#00dddd'; ctx.lineWidth=5; ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(-w*0.2,0);ctx.lineTo(w*1.6,0);ctx.stroke();
      ctx.fillStyle='#00eeee';
      ctx.beginPath();ctx.moveTo(w*1.6,-6);ctx.lineTo(w*1.6+16,0);ctx.lineTo(w*1.6,6);ctx.closePath();ctx.fill();
    } else if(gw==='blaster'){
      // Blaster gun: small barrel shape
      rrFill(w*0.3,-8,w*0.9,16,5,'#00cc77');
      rrFill(w*1.1,-5,18,10,3,'#007744');
      ctx.shadowBlur=10; ctx.shadowColor='#00ffaa';
      ctx.fillStyle='#00ffaa';ctx.beginPath();ctx.arc(w*1.25,0,4,0,Math.PI*2);ctx.fill();
    }
    ctx.shadowBlur=0; ctx.restore();
  }

  // Up heavy: warp portal effect during startup
  if(heavy&&dir==='up'&&inSU){
    const prog=atk.frame/Math.max(atk.su,1);
    ctx.save();
    ctx.globalAlpha=prog*0.7;
    ctx.shadowBlur=20; ctx.shadowColor=ch.eyeCol;
    ctx.strokeStyle=ch.eyeCol; ctx.lineWidth=3;
    ctx.beginPath();ctx.ellipse(0,0,w*0.6*prog,h*0.7*prog,0,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }

  if(glitchFlicker) ctx.restore();
  ctx.shadowBlur=0; ctx.globalAlpha=1;
}

function drawKing(ctx,ch,w,h,atk,grounded,wf,extra){
  const bx=-w/2,by=-h/2;
  const inAct=atk&&atk.frame>=atk.su&&atk.frame<atk.su+atk.act;
  const inSU=atk&&atk.frame<atk.su;
  const dir=atk?atk.dir:null;
  const heavy=atk&&atk.type==='heavy';
  const tAct=atk&&inAct?(atk.frame-atk.su)/Math.max(atk.act,1):0;
  const fire=(extra&&extra.kingFireTimer>0);
  const facing=(extra&&extra.kingFacing)||1; // world-frame facing: +1 right, -1 left
  const shieldAngleWorld=(extra&&typeof extra.kingShieldAngle==='number')?extra.kingShieldAngle:0;

  // Up heavy: whole-body spin around center (the sword is the hitbox)
  if(heavy&&dir==='up'&&inAct){
    const spinT=(atk.frame-atk.su)/atk.act; // 0..1
    const spinAng=spinT*Math.PI*4; // 2 full rotations
    ctx.save();
    ctx.rotate(spinAng);
    // Motion-blur ghost rings
    ctx.globalAlpha=0.35;
    for(let g=1;g<=3;g++){
      ctx.save();ctx.rotate(-spinAng*0.12*g);
      drawKingBody(ctx,ch,w,h,grounded,wf,fire);
      ctx.restore();
    }
    ctx.globalAlpha=1;
    drawKingBody(ctx,ch,w,h,grounded,wf,fire);
    // Sword extended outward (fixed in body frame, but body is spinning)
    const swordLen=ch.kingSpinReach||96;
    drawKingSword(ctx,ch,w,h, w/2-2, 0, 0, swordLen, fire, true);
    // Sword trail circle
    ctx.strokeStyle=fire?'rgba(255,160,40,0.55)':'rgba(255,220,120,0.45)';
    ctx.lineWidth=4;ctx.shadowBlur=12;ctx.shadowColor=fire?'#ff7700':'#ffe680';
    ctx.beginPath();ctx.arc(0,0,swordLen-8,0,Math.PI*2);ctx.stroke();
    ctx.shadowBlur=0;
    ctx.restore();
    // Wind-up sparkles around body (drawn in non-rotated frame)
    return;
  }

  // Body-wide fire aura while sword is on fire — clear visual signal that fire mode is active
  if(fire){
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    const auraPulse=Math.sin(frame*0.12)*0.18+0.82;
    const aura=ctx.createRadialGradient(0,0,w*0.2,0,0,w*1.1);
    aura.addColorStop(0,`rgba(255,180,60,${0.42*auraPulse})`);
    aura.addColorStop(0.5,`rgba(255,90,20,${0.22*auraPulse})`);
    aura.addColorStop(1,'rgba(255,40,0,0)');
    ctx.fillStyle=aura;
    ctx.beginPath();ctx.ellipse(0,0,w*1.1,h*0.9,0,0,Math.PI*2);ctx.fill();
    ctx.restore();
    // Floating ember particles around the King
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    for(let p=0;p<8;p++){
      const t=((frame*0.025+p*0.13)%1);
      const ang=p*0.785+frame*0.02;
      const r=w*0.5+Math.sin(frame*0.05+p)*6;
      const px=Math.cos(ang)*r;
      const py=Math.sin(ang)*r-t*30;
      const pa=(1-t)*0.85;
      ctx.fillStyle=`rgba(255,${160+p*8},${30+p*5},${pa})`;
      ctx.beginPath();ctx.arc(px,py,1.5+Math.random()*1,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }

  // Cape (drawn behind body) — flowing, in body frame; gently sways
  drawKingCape(ctx,w,h,grounded,wf,atk);

  // Body
  drawKingBody(ctx,ch,w,h,grounded,wf,fire);

  // Side-light poke: drawn in body-local frame (which Player.draw() has already mirrored
  // when facing left), so sword always points "forward" relative to the character.
  if(atk&&!heavy&&(dir==='side'||dir==='neutral')&&(inAct||inSU)){
    let ext=0;
    if(inSU){
      ext=0;
    } else {
      const t=tAct;
      if(t<0.3) ext=t/0.3;
      else if(t<0.7) ext=1;
      else ext=Math.max(0,1-(t-0.7)/0.3);
    }
    const gripX = w*0.3 + ext*40;       // grip in body-local +X (= visually "forward")
    const gripY = -h*0.06;
    const visibleLen = 96 + ext*60;     // matches kingPokeReach=160 hitbox
    // ang = -π/2: 90° CCW rotation, blade extends along body-local +X (= forward)
    drawKingSword(ctx,ch,w,h, gripX, gripY, -Math.PI/2, visibleLen, fire, false);
  }

  // Sword (right hand) — animation depends on attack (used for non-side-light attacks)
  let sx=w/2-4, sy=-h*0.05; // sword grip pivot in body-local coords
  let swordAng=0, swordExt=0; // rotation + forward push
  let skipSword=atk&&!heavy&&(dir==='side'||dir==='neutral')&&(inAct||inSU);
  if(inAct){
    if(!heavy&&(dir==='side'||dir==='neutral')){
      // Handled above in world frame
    } else if(!heavy&&dir==='up'){
      // Pendulum swing above head: sweeps from one side to the other overhead
      const a0=-Math.PI*0.8, a1=-Math.PI*0.2;
      swordAng=a0+(a1-a0)*tAct;
      sx=4; sy=-h*0.35;
    } else if(!heavy&&dir==='down'){
      // Shield rotation animation: sword stays at rest, mild flourish
      swordAng=Math.PI/2-0.1;
      swordExt=0;
    } else if(heavy&&(dir==='side'||dir==='neutral')){
      const half=0.5;
      if(tAct<half){
        // Swing phase: overhead arc to forward
        const t=tAct/half;
        swordAng=-Math.PI*0.55+t*Math.PI*0.95;
      } else {
        // Poke phase
        const t=(tAct-half)/half;
        const pokeT=t<0.5?t*2:(1-t)*2;
        swordAng=Math.PI/2;
        swordExt=pokeT*52;
      }
    } else if(heavy&&dir==='down'){
      // Light sword on fire: sword raised dramatically, fire bursts
      swordAng=-Math.PI/2-0.1;
      sx=2; sy=-h*0.4;
    }
  } else if(inSU){
    // Subtle wind-up pose
    if(heavy&&(dir==='side'||dir==='neutral')) swordAng=-Math.PI*0.7;
    else if(!heavy&&(dir==='side'||dir==='neutral')) swordAng=Math.PI*0.45;
    else if(!heavy&&dir==='up') swordAng=-Math.PI*0.85;
    else swordAng=Math.PI*0.35;
  } else {
    swordAng=Math.PI*0.35; // resting position (sword down at side)
  }
  if(!skipSword) drawKingSword(ctx,ch,w,h, sx, sy, swordAng, 64+swordExt, fire, false);

  // Shield — drawn AFTER body so it's in front. Position is in WORLD frame, not facing-flipped.
  // Counter the facing-flip from Player.draw() so shield orbits in absolute world coords.
  ctx.save();
  ctx.scale(facing,1); // undo facing flip
  // Shield orbits at radius ~w*0.65 around player center
  const shR=w*0.7;
  const shx=Math.cos(shieldAngleWorld)*shR;
  const shy=Math.sin(shieldAngleWorld)*shR;
  ctx.translate(shx,shy);
  ctx.rotate(shieldAngleWorld+Math.PI/2);
  drawKingShield(ctx,ch);
  ctx.restore();

  // Crown is drawn as part of head in drawKingBody
}

function drawKingBody(ctx,ch,w,h,grounded,wf,fire){
  const bx=-w/2,by=-h/2;
  const bob=grounded?Math.sin(wf*Math.PI/2)*1.6:0,by2=by+bob;
  const ll=grounded?(wf<2?4:-4):0;
  if(grounded){ctx.fillStyle='rgba(0,0,0,0.25)';ctx.beginPath();ctx.ellipse(0,h/2+3,w*0.46,5,0,0,Math.PI*2);ctx.fill();}
  // Legs (armored)
  rrFill(bx+7,by2+h*0.62,15,h*0.33+ll,4,ch.accent);
  rrFill(bx+w-22,by2+h*0.62,15,h*0.33-ll,4,ch.accent);
  // Knee plates
  ctx.fillStyle='#bb9900';
  ctx.fillRect(bx+8,by2+h*0.78,13,4); ctx.fillRect(bx+w-21,by2+h*0.78,13,4);
  // Feet
  ctx.fillStyle='#1a1a1a';
  ctx.beginPath();ctx.ellipse(bx+14,by2+h*0.95+ll/2,10,5,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(bx+w-14,by2+h*0.95-ll/2,10,5,0,0,Math.PI*2);ctx.fill();
  // Body (royal red armor with gold trim)
  rrFill(bx+4,by2+h*0.34,w-8,h*0.38,8,ch.color);
  // Gold trim down chest
  ctx.fillStyle='#ffd700';
  ctx.fillRect(-2,by2+h*0.36,4,h*0.34);
  // Gold belt
  ctx.fillStyle='#ffcc00';ctx.fillRect(bx+5,by2+h*0.66,w-10,5);
  ctx.fillStyle='#aa7700';ctx.fillRect(bx+5,by2+h*0.70,w-10,2);
  // Royal emblem on chest
  ctx.fillStyle='#ffd700';ctx.beginPath();
  ctx.arc(0,by2+h*0.50,5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#cc1133';ctx.fillRect(-1,by2+h*0.46,2,8);
  // Arm pauldrons (shoulder guards)
  ctx.fillStyle=ch.accent;
  ctx.beginPath();ctx.ellipse(bx+6,by2+h*0.36,8,7,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(bx+w-6,by2+h*0.36,8,7,0,0,Math.PI*2);ctx.fill();
  // Arms
  rrFill(bx+1,by2+h*0.40,9,h*0.24,3,ch.color); // left arm
  rrFill(bx+w-10,by2+h*0.40,9,h*0.24,3,ch.color); // right arm (will hold sword)
  // Hands
  ctx.fillStyle='#1a1a1a';
  ctx.beginPath();ctx.arc(bx+5,by2+h*0.65,5,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(bx+w-5,by2+h*0.65,5,0,Math.PI*2);ctx.fill();
  // Head (helm) — silver/gold robotic with face plate
  ctx.fillStyle='#d8d8d8';
  ctx.beginPath();ctx.ellipse(0,by2+h*0.16,w*0.36,h*0.20,0,0,Math.PI*2);ctx.fill();
  // Face plate dark
  ctx.fillStyle='#222';
  rrFill(-w*0.28,by2+h*0.13,w*0.56,h*0.10,3,'#222');
  // Eyes
  ctx.fillStyle=ch.eyeCol;ctx.shadowBlur=fire?12:6;ctx.shadowColor=fire?'#ff8800':ch.eyeCol;
  ctx.beginPath();ctx.arc(-7,by2+h*0.18,3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(7,by2+h*0.18,3,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
  // Nose ridge
  ctx.fillStyle='#aaaaaa';ctx.fillRect(-1,by2+h*0.18,2,5);
  // CROWN (gold, on top of head)
  const crownY=by2+h*0.04;
  // Crown band
  ctx.fillStyle='#ffd700';
  rrFill(-w*0.3,crownY-4,w*0.6,8,2,'#ffd700');
  // Crown points
  ctx.beginPath();
  for(let p=0;p<5;p++){
    const px=-w*0.3+p*(w*0.6/4);
    ctx.moveTo(px,crownY-4);
    ctx.lineTo(px+w*0.06,crownY-14);
    ctx.lineTo(px+w*0.12,crownY-4);
  }
  ctx.fill();
  // Crown jewels (red gems)
  ctx.fillStyle='#ff2244';ctx.shadowBlur=6;ctx.shadowColor='#ff2244';
  for(let p=0;p<4;p++){
    const px=-w*0.27+p*(w*0.18);
    ctx.beginPath();ctx.arc(px+w*0.03,crownY-1,2,0,Math.PI*2);ctx.fill();
  }
  // Center jewel (bigger)
  ctx.fillStyle='#ffd700';ctx.beginPath();ctx.arc(0,crownY-1,3,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
  // Crown highlight
  ctx.fillStyle='#fff7aa';ctx.fillRect(-w*0.28,crownY-3,w*0.56,1.5);
}

function drawKingCape(ctx,w,h,grounded,wf,atk){
  // Red cape flowing behind player; sways with frame
  const sway=Math.sin(frame*0.06)*4+(grounded?Math.sin(wf*Math.PI/2)*2:0);
  const ext=atk?6:0;
  ctx.save();
  // Cape attaches at shoulders, flows down behind body
  ctx.fillStyle='#8a0a1c';
  ctx.beginPath();
  ctx.moveTo(-w*0.32,-h*0.14);
  ctx.lineTo(w*0.32,-h*0.14);
  ctx.lineTo(w*0.42+sway,h*0.45+ext);
  ctx.lineTo(0,h*0.62+ext);
  ctx.lineTo(-w*0.42+sway,h*0.45+ext);
  ctx.closePath();
  ctx.fill();
  // Cape highlight (lighter red on the side that catches light)
  ctx.fillStyle='#cc1f33';
  ctx.beginPath();
  ctx.moveTo(-w*0.30,-h*0.10);
  ctx.lineTo(-w*0.05,-h*0.10);
  ctx.lineTo(-w*0.10+sway,h*0.50+ext);
  ctx.lineTo(-w*0.40+sway,h*0.42+ext);
  ctx.closePath();
  ctx.fill();
  // Gold trim along cape edge
  ctx.strokeStyle='#ffd700';ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.moveTo(-w*0.32,-h*0.14);
  ctx.lineTo(-w*0.42+sway,h*0.45+ext);
  ctx.lineTo(0,h*0.62+ext);
  ctx.lineTo(w*0.42+sway,h*0.45+ext);
  ctx.lineTo(w*0.32,-h*0.14);
  ctx.stroke();
  // Royal emblem (small gold diamond) at the cape collar
  ctx.fillStyle='#ffd700';
  ctx.beginPath();ctx.moveTo(0,-h*0.18);ctx.lineTo(4,-h*0.14);ctx.lineTo(0,-h*0.10);ctx.lineTo(-4,-h*0.14);ctx.closePath();ctx.fill();
  ctx.restore();
}

function drawKingSword(ctx,ch,w,h, gripX,gripY,ang,len,fire,fromCenter){
  // Draws a long sword from grip pivot at angle. Sword extends in +Y direction in local frame
  // (so ang=0 = sword pointing down; ang=Math.PI/2 = sword pointing right; ang=-Math.PI/2 = up).
  ctx.save();
  ctx.translate(gripX,gripY);
  ctx.rotate(ang);
  // Hilt grip
  ctx.fillStyle='#553311';
  rrFill(-3,-2,6,12,2,'#553311');
  // Crossguard (gold)
  ctx.fillStyle='#ffd700';
  ctx.fillRect(-12,-4,24,5);
  ctx.fillStyle='#aa7700';
  ctx.fillRect(-12,1,24,1);
  // Pommel (gold ball at base)
  ctx.fillStyle='#ffd700';ctx.beginPath();ctx.arc(0,-6,4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff5aa';ctx.beginPath();ctx.arc(-1,-7,1.5,0,Math.PI*2);ctx.fill();
  // Blade (long, tapering)
  const bladeStart=6, bladeEnd=bladeStart+len;
  // ======= FIRE LAYER 1: huge soft outer aura =======
  if(fire){
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    // Big soft halo around the entire blade
    const haloPulse=Math.sin(frame*0.18)*0.15+0.85;
    const halo=ctx.createRadialGradient(0,(bladeStart+bladeEnd)/2,4,0,(bladeStart+bladeEnd)/2,len*0.95);
    halo.addColorStop(0,`rgba(255,200,80,${0.45*haloPulse})`);
    halo.addColorStop(0.45,`rgba(255,90,20,${0.30*haloPulse})`);
    halo.addColorStop(1,'rgba(255,40,0,0)');
    ctx.fillStyle=halo;
    ctx.fillRect(-len*0.7, bladeStart-12, len*1.4, len+30);
    // Wide fire envelope hugging the blade shape
    const env=ctx.createLinearGradient(0,bladeStart,0,bladeEnd+18);
    env.addColorStop(0,`rgba(255,220,120,${0.85*haloPulse})`);
    env.addColorStop(0.4,`rgba(255,140,30,${0.7*haloPulse})`);
    env.addColorStop(0.85,`rgba(255,60,0,${0.4*haloPulse})`);
    env.addColorStop(1,'rgba(255,30,0,0)');
    ctx.fillStyle=env;
    ctx.beginPath();
    const env_w=14;
    ctx.moveTo(-env_w,bladeStart-4);
    ctx.bezierCurveTo(-env_w*1.4,bladeStart+len*0.3, -env_w*0.6,bladeStart+len*0.7, -env_w*0.3,bladeEnd+12);
    ctx.lineTo(0,bladeEnd+22);
    ctx.bezierCurveTo(env_w*0.3,bladeEnd+12, env_w*1.4,bladeStart+len*0.7, env_w,bladeStart-4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // Blade body (steel) — when on fire, the steel itself glows white-hot to red-hot along its length
  if(fire){
    // Heated blade gradient: white-hot near tip, orange in middle, dim red near hilt
    const hot=ctx.createLinearGradient(0,bladeStart,0,bladeEnd);
    hot.addColorStop(0,'#ffaa44');
    hot.addColorStop(0.4,'#ff7722');
    hot.addColorStop(0.75,'#ffcc66');
    hot.addColorStop(1,'#ffffff');
    ctx.fillStyle=hot;
    ctx.shadowBlur=14;ctx.shadowColor='#ff7700';
  } else {
    ctx.fillStyle='#dddddd';
  }
  ctx.beginPath();
  ctx.moveTo(-4,bladeStart);
  ctx.lineTo(4,bladeStart);
  ctx.lineTo(2,bladeEnd-6);
  ctx.lineTo(0,bladeEnd);
  ctx.lineTo(-2,bladeEnd-6);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur=0;
  // Blade highlight (white hot streak)
  ctx.fillStyle=fire?'#ffffff':'#ffffff';
  ctx.fillRect(-1,bladeStart+2,1.5,len-12);
  // Fuller (groove)
  ctx.fillStyle=fire?'#ffdd66':'#888';
  ctx.fillRect(-0.5,bladeStart+4,1,len-14);

  // ======= FIRE LAYER 2: animated flame tongues licking off the blade =======
  if(fire){
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    // Big flame tongues at multiple points along the blade
    const numTongues=10;
    for(let f=0;f<numTongues;f++){
      const baseT=f/numTongues;
      const drift=((frame*0.05+f*0.13)%1);
      const ft=(baseT+drift)%1;
      const along=bladeStart+ft*(len+8);
      const sway=Math.sin(frame*0.22+f*1.7)*7;
      // Flame tongue: teardrop pointing away from blade
      const flR=5+Math.sin(frame*0.18+f)*2;
      const fAlpha=(1-ft)*0.85+0.15;
      // Outer (red)
      ctx.fillStyle=`rgba(255,${60+ft*100},0,${fAlpha*0.7})`;
      ctx.beginPath();ctx.ellipse(sway,along,flR*1.6,flR*2.2,0,0,Math.PI*2);ctx.fill();
      // Mid (orange)
      ctx.fillStyle=`rgba(255,${160+ft*80},${30+ft*30},${fAlpha*0.85})`;
      ctx.beginPath();ctx.ellipse(sway,along-flR*0.3,flR,flR*1.4,0,0,Math.PI*2);ctx.fill();
      // Inner (yellow-white core)
      ctx.fillStyle=`rgba(255,${220+ft*30},${140+ft*60},${fAlpha})`;
      ctx.beginPath();ctx.ellipse(sway,along-flR*0.5,flR*0.5,flR*0.8,0,0,Math.PI*2);ctx.fill();
    }
    // Tip — huge fireball
    const tipPulse=Math.sin(frame*0.3)*2+8;
    const tipG=ctx.createRadialGradient(0,bladeEnd+3,1,0,bladeEnd+3,tipPulse*1.6);
    tipG.addColorStop(0,'rgba(255,255,240,1)');
    tipG.addColorStop(0.35,'rgba(255,200,100,0.95)');
    tipG.addColorStop(0.7,'rgba(255,90,20,0.55)');
    tipG.addColorStop(1,'rgba(255,40,0,0)');
    ctx.fillStyle=tipG;
    ctx.beginPath();ctx.arc(0,bladeEnd+3,tipPulse*1.6,0,Math.PI*2);ctx.fill();
    // Embers/sparks streaming off the blade
    for(let s=0;s<8;s++){
      const st=((frame*0.06+s*0.21)%1);
      const sAlong=bladeStart+st*len;
      const sxOff=Math.sin(frame*0.14+s*2.3)*12;
      const syOff=-st*18; // drift upward (away from blade)
      ctx.fillStyle=`rgba(255,${180+s*8},${60+s*10},${(1-st)*0.9})`;
      ctx.beginPath();ctx.arc(sxOff,sAlong+syOff,1.2+Math.random()*0.8,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
    // Heat shimmer streaks
    ctx.save();
    ctx.strokeStyle='rgba(255,180,80,0.35)';ctx.lineWidth=1.2;
    for(let s=0;s<3;s++){
      const sy=bladeStart+(s*len/3)+Math.sin(frame*0.12+s)*4;
      ctx.beginPath();
      ctx.moveTo(-10,sy);
      ctx.bezierCurveTo(-2,sy-3,2,sy+3,10,sy);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}

function drawKingShield(ctx,ch){
  // Kite-shaped royal shield with gold trim and red cross
  // Drawn so its "outer face" points along +Y (so caller positions origin and rotates)
  ctx.save();
  // Shadow behind shield
  ctx.fillStyle='rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.moveTo(-14,-12);ctx.lineTo(14,-12);
  ctx.lineTo(13,8);ctx.lineTo(0,18);ctx.lineTo(-13,8);
  ctx.closePath();ctx.fill();
  // Outer shield body (steel-blue with gold trim)
  ctx.fillStyle='#4a5d80';
  ctx.beginPath();
  ctx.moveTo(-13,-13);ctx.lineTo(13,-13);
  ctx.lineTo(12,7);ctx.lineTo(0,17);ctx.lineTo(-12,7);
  ctx.closePath();ctx.fill();
  // Inner highlight
  ctx.fillStyle='#7a90b8';
  ctx.beginPath();
  ctx.moveTo(-10,-10);ctx.lineTo(0,-9);ctx.lineTo(-3,5);ctx.lineTo(-10,3);
  ctx.closePath();ctx.fill();
  // Red cross (royal heraldry)
  ctx.fillStyle='#cc1133';
  ctx.fillRect(-2,-12,4,26);
  ctx.fillRect(-9,-3,18,4);
  // Gold trim outline
  ctx.strokeStyle='#ffd700';ctx.lineWidth=2;
  ctx.beginPath();
  ctx.moveTo(-13,-13);ctx.lineTo(13,-13);
  ctx.lineTo(12,7);ctx.lineTo(0,17);ctx.lineTo(-12,7);
  ctx.closePath();ctx.stroke();
  // Gold studs at corners
  ctx.fillStyle='#ffd700';
  [[-11,-11],[11,-11],[10,5],[-10,5]].forEach(([px,py])=>{ctx.beginPath();ctx.arc(px,py,1.5,0,Math.PI*2);ctx.fill();});
  ctx.restore();
}

function drawDummy(ctx,ch,w,h){
  const bx=-w/2,by=-h/2;
  ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.ellipse(0,h/2+3,w*0.45,5,0,0,Math.PI*2);ctx.fill();
  rrFill(bx+8,by+h*0.65,w-16,h*0.3,4,'#555');
  rrFill(bx+4,by+h*0.35,w-8,h*0.35,6,'#666');
  rrFill(bx+2,by+h*0.3,w-4,h*0.1,3,'#777');
  ctx.fillStyle='#555';ctx.beginPath();ctx.ellipse(0,by+h*0.2,w*0.38,h*0.2,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#444';ctx.beginPath();ctx.ellipse(0,by+h*0.2,w*0.25,h*0.1,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#333';ctx.lineWidth=1;
  for(let i=0;i<3;i++){rrPath(bx+8+i*10,by+h*0.48,7,5,1);ctx.stroke();}
}

function drawBolt(ctx,ch,w,h,atk,grounded,wf){
  const bx=-w/2,by=-h/2;
  const inAct=atk&&atk.frame>=atk.su&&atk.frame<atk.su+atk.act;
  const dir=atk?atk.dir:null;
  const bob=grounded?Math.sin(wf*Math.PI/2)*2:0,swing=grounded?Math.sin(wf*Math.PI/2)*7:0,by2=by+bob;
  const ll=grounded?(wf<2?5:-5):0;
  if(grounded){ctx.fillStyle='rgba(0,0,0,0.25)';ctx.beginPath();ctx.ellipse(0,h/2+3,w*0.45,5,0,0,Math.PI*2);ctx.fill();}
  rrFill(bx+6,by2+h*0.62,14,h*0.32+ll,4,ch.accent);rrFill(bx+w-20,by2+h*0.62,14,h*0.32-ll,4,ch.accent);
  ctx.fillStyle='#222';ctx.beginPath();ctx.ellipse(bx+13,by2+h*0.94+ll/2,10,5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#222';ctx.beginPath();ctx.ellipse(bx+w-13,by2+h*0.94-ll/2,10,5,0,0,Math.PI*2);ctx.fill();
  rrFill(bx+4,by2+h*0.36,w-8,h*0.36,9,ch.color);rrFill(bx+8,by2+h*0.38,w-16,h*0.09,4,ch.hi);
  ctx.fillStyle=inAct?'#fff':ch.eyeCol;ctx.beginPath();ctx.arc(0,by2+h*0.51,6,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.translate(bx+2,by2+h*0.39+swing*0.4);ctx.rotate(swing*0.04+(inAct&&dir==='up'?-0.4:0));
  rrFill(-12,0,12,h*0.28,5,ch.color);ctx.fillStyle=ch.accent;ctx.beginPath();ctx.arc(-6,h*0.28,8,0,Math.PI*2);ctx.fill();ctx.restore();
  ctx.save();ctx.translate(bx+w-2,by2+h*0.39-swing*0.4);
  if(inAct){if(dir==='side'){ctx.rotate(0.6);ctx.translate(20,-6);}else if(dir==='up'){ctx.rotate(-1.4);ctx.translate(4,-18);}else if(dir==='down'){ctx.rotate(1.7);ctx.translate(5,14);}else{ctx.rotate(0.3);ctx.translate(8,-4);}}else{ctx.rotate(-swing*0.04);}
  rrFill(0,0,12,h*0.28,5,ch.color);ctx.fillStyle=inAct?'#fff':ch.accent;ctx.beginPath();ctx.arc(6,h*0.28,8,0,Math.PI*2);ctx.fill();ctx.restore();
  ctx.fillStyle=ch.color;ctx.beginPath();ctx.ellipse(0,by2+h*0.2,w*0.42,h*0.22,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=ch.hi;ctx.beginPath();ctx.ellipse(-4,by2+h*0.13,w*0.28,h*0.1,-0.3,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=0.9;rrFill(-w*0.28,by2+h*0.16,w*0.56,h*0.1,4,inAct?'#fff':ch.eyeCol);ctx.globalAlpha=1;
  ctx.fillStyle='#002244';ctx.beginPath();ctx.arc(-8,by2+h*0.21,3.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#002244';ctx.beginPath();ctx.arc(8,by2+h*0.21,3.5,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=ch.accent;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,by2+h*0.03);ctx.lineTo(7,by2-h*0.04);ctx.stroke();
  ctx.fillStyle=ch.eyeCol;ctx.beginPath();ctx.arc(7,by2-h*0.04,4,0,Math.PI*2);ctx.fill();
}

function drawCrusher(ctx,ch,w,h,atk,grounded,wf){
  const bx=-w/2,by=-h/2;
  const inAct=atk&&atk.frame>=atk.su&&atk.frame<atk.su+atk.act;
  const inSU=atk&&atk.frame<atk.su&&atk.type==='heavy';
  const dir=atk?atk.dir:null,bob=grounded?Math.sin(wf*Math.PI/2)*1.5:0,by2=by+bob,ll=grounded?(wf<2?4:-4):0;
  if(grounded){ctx.fillStyle='rgba(0,0,0,0.3)';ctx.beginPath();ctx.ellipse(0,h/2+3,w*0.48,7,0,0,Math.PI*2);ctx.fill();}
  rrFill(bx+6,by2+h*0.63,19,h*0.33+ll,4,ch.accent);rrFill(bx+w-25,by2+h*0.63,19,h*0.33-ll,4,ch.accent);
  rrFill(bx+2,by2+h*0.93+ll*0.5,23,10,3,'#222');rrFill(bx+w-25,by2+h*0.93-ll*0.5,23,10,3,'#222');
  const sdx=inSU?(Math.random()-.5)*4:0;
  rrFill(bx+2+sdx,by2+h*0.31,w-4,h*0.42,6,ch.color);
  ctx.fillStyle=ch.accent;
  [{x:bx+8,y:by2+h*0.35},{x:bx+w-8,y:by2+h*0.35},{x:bx+8,y:by2+h*0.69},{x:bx+w-8,y:by2+h*0.69}].forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fill();});
  const vc=inAct?'#ff6600':inSU?'#ff4400':'#1a1a1a';for(let i=0;i<3;i++)rrFill(bx+w*0.26+i*14,by2+h*0.49,10,6,2,vc);
  ctx.save();ctx.translate(bx,by2+h*0.36);rrFill(-17,0,19,h*0.32,5,ch.color);
  const clC=inAct?'#ffaa00':ch.accent;ctx.fillStyle=clC;ctx.beginPath();ctx.arc(-8,h*0.32,10,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=clC;ctx.lineWidth=4;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-15,h*0.32+5);ctx.lineTo(-23,h*0.32+15);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-8,h*0.32+8);ctx.lineTo(-8,h*0.32+18);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-1,h*0.32+5);ctx.lineTo(5,h*0.32+14);ctx.stroke();ctx.restore();
  ctx.save();ctx.translate(bx+w,by2+h*0.36);
  if(inAct){if(dir==='side'){ctx.translate(26,0);}else if(dir==='up'){ctx.rotate(-1.1);ctx.translate(12,-15);}else if(dir==='down'){ctx.rotate(1.1);ctx.translate(6,18);}else{ctx.translate(18,-5);ctx.rotate(0.15);}}
  else if(inSU&&dir==='side'){ctx.translate(Math.sin(atk.frame)*6,0);}
  rrFill(0,0,19,h*0.32,5,ch.color);const clC2=inAct?'#ffaa00':ch.accent;ctx.fillStyle=clC2;ctx.beginPath();ctx.arc(8,h*0.32,10,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=clC2;ctx.lineWidth=4;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(16,h*0.32+5);ctx.lineTo(24,h*0.32+15);ctx.stroke();
  ctx.beginPath();ctx.moveTo(8,h*0.32+8);ctx.lineTo(8,h*0.32+18);ctx.stroke();
  ctx.beginPath();ctx.moveTo(1,h*0.32+5);ctx.lineTo(-4,h*0.32+14);ctx.stroke();ctx.restore();
  rrFill(-w*0.41,by2,w*0.82,h*0.35,5,ch.color);rrFill(-w*0.36,by2+3,w*0.72,h*0.08,3,ch.hi);
  const ec=inAct?'#fff':inSU?'#ffaa00':ch.eyeCol;
  ctx.save();ctx.translate(-w*0.19,by2+h*0.18);ctx.rotate(-0.3);rrFill(-10,-5,20,10,2,ec);ctx.restore();
  ctx.save();ctx.translate(w*0.19,by2+h*0.18);ctx.rotate(0.3);rrFill(-10,-5,20,10,2,ec);ctx.restore();
  rrFill(-w*0.28,by2+h*0.27,w*0.56,h*0.06,2,'#111');
  ctx.strokeStyle='#333';ctx.lineWidth=1;
  for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-w*0.22+i*w*0.11,by2+h*0.27);ctx.lineTo(-w*0.22+i*w*0.11,by2+h*0.33);ctx.stroke();}
  rrFill(-w*0.3,by2-h*0.09,8,h*0.1,2,ch.accent);rrFill(w*0.2,by2-h*0.06,8,h*0.07,2,ch.accent);
}

function drawZippy(ctx,ch,w,h,atk,grounded,wf){
  const bx=-w/2,by=-h/2;
  const inAct=atk&&atk.frame>=atk.su&&atk.frame<atk.su+atk.act;
  const dir=atk?atk.dir:null,bob=grounded?Math.sin(wf*Math.PI/2)*2.5:0,lean=grounded?Math.sin(wf*Math.PI/2)*0.1:0,by2=by+bob,ll=grounded?(wf<2?6:-6):0;
  if(grounded){ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.ellipse(0,h/2+3,w*0.43,5,0,0,Math.PI*2);ctx.fill();}
  ctx.save();ctx.rotate(lean);
  ctx.strokeStyle=ch.accent;ctx.lineWidth=5;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(bx+10,by2+h*0.61);ctx.quadraticCurveTo(bx+2,by2+h*0.79,bx+10,by2+h*0.89+ll);ctx.stroke();
  ctx.beginPath();ctx.moveTo(bx+w-10,by2+h*0.61);ctx.quadraticCurveTo(bx+w-2,by2+h*0.79,bx+w-10,by2+h*0.89-ll);ctx.stroke();
  ctx.fillStyle='#333';ctx.beginPath();ctx.arc(bx+10,by2+h*0.89+ll,7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#333';ctx.beginPath();ctx.arc(bx+w-10,by2+h*0.89-ll,7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=ch.accent;ctx.beginPath();ctx.arc(bx+10,by2+h*0.89+ll,3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=ch.accent;ctx.beginPath();ctx.arc(bx+w-10,by2+h*0.89-ll,3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=ch.color;ctx.beginPath();ctx.moveTo(0,by2+h*0.33);ctx.lineTo(bx+w*0.1,by2+h*0.63);ctx.lineTo(bx+w*0.9,by2+h*0.63);ctx.closePath();ctx.fill();
  ctx.fillStyle=ch.hi;ctx.globalAlpha=0.45;ctx.beginPath();ctx.moveTo(0,by2+h*0.37);ctx.lineTo(-w*0.19,by2+h*0.55);ctx.lineTo(w*0.19,by2+h*0.55);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
  ctx.fillStyle=inAct?'#fff':ch.eyeCol;ctx.beginPath();ctx.arc(0,by2+h*0.51,5,0,Math.PI*2);ctx.fill();
  if(inAct&&dir==='side'){ctx.strokeStyle=ch.color;ctx.lineWidth=2;ctx.globalAlpha=0.4;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-w*0.4,by2+h*(0.38+i*0.08));ctx.lineTo(-w*0.9-i*8,by2+h*(0.38+i*0.08));ctx.stroke();}ctx.globalAlpha=1;}
  ctx.strokeStyle=ch.color;ctx.lineWidth=7;ctx.lineCap='round';
  ctx.save();ctx.translate(bx+6,by2+h*0.43);ctx.rotate(inAct&&dir==='up'?-0.5:-0.2);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-10,h*0.22);ctx.stroke();ctx.fillStyle=ch.accent;ctx.beginPath();ctx.arc(-10,h*0.22,6,0,Math.PI*2);ctx.fill();ctx.restore();
  ctx.save();ctx.translate(bx+w-6,by2+h*0.43);
  if(inAct){if(dir==='side'){ctx.rotate(0.6);ctx.translate(16,0);}else if(dir==='up'){ctx.rotate(-1.6);ctx.translate(0,-18);}else if(dir==='down'){ctx.rotate(1.7);ctx.translate(0,12);}else{ctx.rotate(0.5);ctx.translate(10,0);}}else{ctx.rotate(0.2);}
  ctx.strokeStyle=ch.color;ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(10,h*0.22);ctx.stroke();ctx.fillStyle=inAct?'#fff':ch.accent;ctx.beginPath();ctx.arc(10,h*0.22,6,0,Math.PI*2);ctx.fill();ctx.restore();
  ctx.fillStyle=ch.accent;ctx.beginPath();ctx.ellipse(0,by2+h*0.18,w*0.43,h*0.21,0,0,Math.PI);ctx.fill();
  ctx.fillStyle=ch.color;ctx.beginPath();ctx.ellipse(0,by2+h*0.22,w*0.39,h*0.19,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=0.95;rrFill(-w*0.23,by2+h*0.17,w*0.46,h*0.1,5,inAct?'#fff':ch.eyeCol);ctx.globalAlpha=1;
  ctx.fillStyle=inAct?ch.eyeCol:'#220044';ctx.beginPath();ctx.arc(0,by2+h*0.22,5,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=ch.eyeCol;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,by2+h*0.04);ctx.lineTo(0,by2-h*0.03);ctx.lineTo(8,by2-h*0.1);ctx.stroke();
  ctx.fillStyle=ch.eyeCol;ctx.beginPath();ctx.arc(8,by2-h*0.1,3,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function drawBlaster(ctx,ch,w,h,atk,grounded,wf){
  const bx=-w/2,by=-h/2;
  const inAct=atk&&atk.frame>=atk.su&&atk.frame<atk.su+atk.act;
  const inSU=atk&&atk.frame<atk.su;
  const dir=atk?atk.dir:null;
  const hover=Math.sin(frame*0.06)*3;
  const by2=by+hover;
  if(grounded){ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.ellipse(0,h/2+5,w*0.5,5,0,0,Math.PI*2);ctx.fill();}
  // Hover jets
  const jetAlpha=0.4+Math.sin(frame*0.15)*0.2;
  for(let ji=-1;ji<=1;ji+=2){
    const jg=ctx.createRadialGradient(ji*w*0.22,by2+h*0.58,0,ji*w*0.22,by2+h*0.58,10);
    jg.addColorStop(0,ch.eyeCol+'aa');jg.addColorStop(1,ch.eyeCol+'00');
    ctx.fillStyle=jg;ctx.globalAlpha=jetAlpha;ctx.beginPath();ctx.arc(ji*w*0.22,by2+h*0.58,10,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  }
  // Body (capsule)
  rrFill(bx+4,by2+h*0.28,w-8,h*0.5,w/2-4,ch.color);
  rrFill(bx+8,by2+h*0.3,w-16,h*0.12,5,ch.hi);
  // Scanner band
  const scanX=bx+6,scanW=w-12,scanH=h*0.08;
  rrFill(scanX,by2+h*0.42,scanW,scanH,4,inAct?ch.eyeCol:'#001a0a');
  if(inAct){ctx.fillStyle='#fff';ctx.globalAlpha=0.6;rrPath(scanX,by2+h*0.42,scanW*0.4,scanH,4);ctx.fill();ctx.globalAlpha=1;}
  // Left arm
  ctx.fillStyle=ch.accent;rrFill(bx-8,by2+h*0.34,12,h*0.24,5,ch.accent);
  ctx.fillStyle=ch.color;ctx.beginPath();ctx.arc(bx-3,by2+h*0.57,7,0,Math.PI*2);ctx.fill();
  // Gun arm (right)
  const gunExt=inAct?(dir==='side'?14:8):0;
  const gunY=inAct&&dir==='up'?-20:inAct&&dir==='down'?12:0;
  ctx.fillStyle=ch.accent;rrFill(bx+w-4,by2+h*0.36+gunY*0.3,18+gunExt,12,4,ch.accent);
  rrFill(bx+w+10+gunExt,by2+h*0.36+gunY*0.3+2,12,8,3,ch.color);
  // Muzzle
  ctx.fillStyle=inAct?ch.eyeCol:'#003322';ctx.beginPath();ctx.arc(bx+w+22+gunExt,by2+h*0.4+gunY*0.3,inAct?6:4,0,Math.PI*2);ctx.fill();
  if(inAct){ctx.shadowBlur=20;ctx.shadowColor=ch.eyeCol;ctx.fillStyle=ch.eyeCol;ctx.beginPath();ctx.arc(bx+w+22+gunExt,by2+h*0.4+gunY*0.3,8,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
  // Head
  ctx.fillStyle=ch.color;ctx.beginPath();ctx.ellipse(0,by2+h*0.17,w*0.38,h*0.2,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=ch.hi;ctx.beginPath();ctx.ellipse(-4,by2+h*0.1,w*0.25,h*0.09,-0.3,0,Math.PI*2);ctx.fill();
  // Targeting visor
  const visCol=inAct?ch.eyeCol:'#002211';
  rrFill(-w*0.26,by2+h*0.15,w*0.52,h*0.08,4,visCol);
  if(inSU){ctx.fillStyle=ch.eyeCol;ctx.globalAlpha=0.6+Math.sin(atk.frame*0.5)*0.3;ctx.beginPath();ctx.arc(-8,by2+h*0.19,4,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(8,by2+h*0.19,4,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  ctx.strokeStyle=ch.accent;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-4,by2+h*0.02);ctx.lineTo(-8,by2-h*0.05);ctx.stroke();ctx.beginPath();ctx.moveTo(4,by2+h*0.02);ctx.lineTo(8,by2-h*0.05);ctx.stroke();
  ctx.fillStyle=ch.eyeCol;ctx.beginPath();ctx.arc(-8,by2-h*0.05,3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(8,by2-h*0.05,3,0,Math.PI*2);ctx.fill();
}

function drawEdge(ctx,ch,w,h,atk,grounded,wf){
  const bx=-w/2,by=-h/2;
  const inAct=atk&&atk.frame>=atk.su&&atk.frame<atk.su+atk.act;
  const inSU=atk&&atk.frame<atk.su;
  const dir=atk?atk.dir:null,cn=atk&&atk.comboN||0;
  const heavy=atk&&atk.type==='heavy';
  const tAct=atk&&inAct?(atk.frame-atk.su)/Math.max(atk.act,1):0;
  const bob=grounded?Math.sin(wf*Math.PI/2)*2:0,swing=grounded?Math.sin(wf*Math.PI/2)*6:0,by2=by+bob;
  const ll=grounded?(wf<2?5:-5):0;
  if(grounded){ctx.fillStyle='rgba(0,0,0,0.22)';ctx.beginPath();ctx.ellipse(0,h/2+3,w*0.44,5,0,0,Math.PI*2);ctx.fill();}
  // Legs
  rrFill(bx+6,by2+h*0.62,13,h*0.33+ll,4,ch.accent);rrFill(bx+w-19,by2+h*0.62,13,h*0.33-ll,4,ch.accent);
  ctx.fillStyle='#222';ctx.beginPath();ctx.ellipse(bx+12,by2+h*0.94+ll/2,9,4,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#222';ctx.beginPath();ctx.ellipse(bx+w-12,by2+h*0.94-ll/2,9,4,0,0,Math.PI*2);ctx.fill();
  // Body - slim, elegant
  rrFill(bx+6,by2+h*0.36,w-12,h*0.34,7,ch.color);
  // Energy trim lines
  ctx.strokeStyle=ch.eyeCol;ctx.lineWidth=2;ctx.globalAlpha=0.6;
  ctx.beginPath();ctx.moveTo(bx+10,by2+h*0.38);ctx.lineTo(bx+10,by2+h*0.68);ctx.stroke();
  ctx.beginPath();ctx.moveTo(bx+w-10,by2+h*0.38);ctx.lineTo(bx+w-10,by2+h*0.68);ctx.stroke();
  ctx.globalAlpha=1;
  // Left arm
  ctx.save();ctx.translate(bx+4,by2+h*0.38+swing*0.4);ctx.rotate(swing*0.04);
  rrFill(-10,0,11,h*0.26,4,ch.color);ctx.fillStyle=ch.accent;ctx.beginPath();ctx.arc(-5,h*0.26,7,0,Math.PI*2);ctx.fill();ctx.restore();
  // Right arm + SWORD
  const hideSword=heavy&&dir==='up'&&inAct; // sword is thrown, not in hand
  ctx.save();ctx.translate(bx+w-4,by2+h*0.38-swing*0.4);
  let swordAng=0,swordTx=0,swordTy=0;
  if(inAct){
    if(heavy&&dir==='side'){swordAng=-Math.PI*0.75+tAct*Math.PI*1.5;swordTx=14;swordTy=-10+tAct*20;}
    else if(heavy&&dir==='up'){swordAng=-1.6;swordTx=4;swordTy=-18;}
    else if(heavy&&dir==='down'){swordAng=0.18;swordTx=8;swordTy=14;}
    else if(dir==='side'&&cn===1){swordAng=-0.2;swordTx=10;swordTy=-4;}
    else if(dir==='side'&&cn===2){swordAng=0.3;swordTx=14;swordTy=2;}
    else if(dir==='side'&&cn===3){swordAng=-0.5;swordTx=18;swordTy=-8;}
    else if(dir==='up'){swordAng=-1.3-cn*0.1;swordTx=4;swordTy=-12-cn*4;}
    else if(dir==='down'){swordAng=1.5;swordTx=6;swordTy=10;}
    else{swordAng=-0.1+cn*0.15;swordTx=12+cn*2;}
    ctx.translate(swordTx,swordTy);ctx.rotate(swordAng);
  }else{ctx.rotate(-swing*0.04);}
  rrFill(0,0,11,h*0.26,4,ch.color);ctx.fillStyle=ch.accent;ctx.beginPath();ctx.arc(5,h*0.26,7,0,Math.PI*2);ctx.fill();
  // Draw sword from hand (hidden when thrown)
  if(!hideSword){
    const sCol=cn===3&&inAct?'#ffffff':inSU?ch.hi:ch.eyeCol;
    const sLen=inAct?(heavy?108:cn===3?95:cn===2?80:68):62;
    ctx.strokeStyle=sCol;ctx.lineWidth=4;ctx.lineCap='round';
    ctx.shadowBlur=inAct?18:8;ctx.shadowColor=ch.eyeCol;
    ctx.beginPath();ctx.moveTo(5,h*0.26+6);ctx.lineTo(5,h*0.26+6+sLen);ctx.stroke();
    ctx.strokeStyle=ch.hi;ctx.lineWidth=2;ctx.globalAlpha=0.6;
    ctx.beginPath();ctx.moveTo(5,h*0.26+6);ctx.lineTo(5,h*0.26+6+sLen*0.85);ctx.stroke();ctx.globalAlpha=1;ctx.shadowBlur=0;
    ctx.strokeStyle=ch.accent;ctx.lineWidth=5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-4,h*0.26+8);ctx.lineTo(14,h*0.26+8);ctx.stroke();
    ctx.fillStyle=sCol;ctx.beginPath();ctx.moveTo(2,h*0.26+6+sLen);ctx.lineTo(8,h*0.26+6+sLen);ctx.lineTo(5,h*0.26+6+sLen+10);ctx.closePath();ctx.fill();
  }
  ctx.restore();
  // Head (knight helmet)
  ctx.fillStyle=ch.color;ctx.beginPath();ctx.ellipse(0,by2+h*0.2,w*0.4,h*0.22,0,0,Math.PI*2);ctx.fill();
  rrFill(-w*0.38,by2+h*0.04,w*0.76,h*0.11,3,ch.accent);
  ctx.fillStyle=ch.hi;ctx.beginPath();ctx.ellipse(-5,by2+h*0.12,w*0.26,h*0.09,-0.2,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=0.9;rrFill(-w*0.26,by2+h*0.18,w*0.52,h*0.09,4,inAct?'#fff':ch.eyeCol);ctx.globalAlpha=1;
  ctx.fillStyle=inAct?(cn===3?'#fff':'#330033'):'#330033';ctx.beginPath();ctx.arc(-7,by2+h*0.22,3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(7,by2+h*0.22,3,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=ch.accent;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,by2+h*0.04);ctx.lineTo(0,by2-h*0.04);ctx.stroke();ctx.beginPath();ctx.moveTo(-5,by2-h*0.04);ctx.lineTo(5,by2-h*0.04);ctx.stroke();
}

function drawPierce(ctx,ch,w,h,atk,grounded,wf){
  const bx=-w/2,by=-h/2;
  const inAct=atk&&atk.frame>=atk.su&&atk.frame<atk.su+atk.act;
  const inSU=atk&&atk.frame<atk.su&&atk.type==='heavy';
  const dir=atk?atk.dir:null;
  const heavy=atk&&atk.type==='heavy';
  const tAct=atk&&inAct?(atk.frame-atk.su)/Math.max(atk.act,1):0;
  const isSwing=!heavy&&inAct&&atk&&atk.comboN===3;
  const bob=grounded?Math.sin(wf*Math.PI/2)*2:0,swing=grounded?Math.sin(wf*Math.PI/2)*8:0,by2=by+bob;
  const ll=grounded?(wf<2?5:-5):0;
  const lean=isSwing?(-0.1+tAct*0.25):(inAct&&(dir==='side'||dir==='neutral')?0.18:0);
  if(grounded){ctx.fillStyle='rgba(0,0,0,0.22)';ctx.beginPath();ctx.ellipse(0,h/2+3,w*0.44,5,0,0,Math.PI*2);ctx.fill();}
  ctx.save();ctx.rotate(lean);
  // Legs
  rrFill(bx+6,by2+h*0.63,13,h*0.32+ll,4,ch.accent);rrFill(bx+w-19,by2+h*0.63,13,h*0.32-ll,4,ch.accent);
  ctx.fillStyle='#222';ctx.beginPath();ctx.ellipse(bx+12,by2+h*0.94+ll/2,9,5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#222';ctx.beginPath();ctx.ellipse(bx+w-12,by2+h*0.94-ll/2,9,5,0,0,Math.PI*2);ctx.fill();
  // Torso (athletic)
  rrFill(bx+5,by2+h*0.35,w-10,h*0.35,7,ch.color);
  rrFill(bx+9,by2+h*0.37,w-18,h*0.08,3,ch.hi);
  ctx.fillStyle=inAct?ch.eyeCol:'#002222';ctx.beginPath();ctx.arc(0,by2+h*0.52,5,0,Math.PI*2);ctx.fill();
  // Left arm (grips back of spear)
  ctx.save();ctx.translate(bx+4,by2+h*0.39+swing*0.3);
  if(isSwing){ctx.rotate(-0.6+tAct*0.8);}
  rrFill(-10,0,11,h*0.25,4,ch.color);ctx.fillStyle=ch.accent;ctx.beginPath();ctx.arc(-5,h*0.25,7,0,Math.PI*2);ctx.fill();ctx.restore();
  // Right arm (grips front of spear)
  ctx.save();ctx.translate(bx+w-4,by2+h*0.38-swing*0.3);
  if(isSwing){ctx.translate(14,0);ctx.rotate(-0.4+tAct*0.6);}
  else if(inAct){if(dir==='side'||dir==='neutral'){ctx.translate(18,0);}else if(dir==='up'){ctx.rotate(-1.0);ctx.translate(5,-12);}else if(dir==='down'){ctx.rotate(0.8);ctx.translate(5,8);}}
  rrFill(0,0,11,h*0.25,4,ch.color);ctx.fillStyle=ch.accent;ctx.beginPath();ctx.arc(5,h*0.25,7,0,Math.PI*2);ctx.fill();ctx.restore();
  // SPEAR (always visible, extends through body)
  const spearExt=inAct?20:0;
  const spearAng=isSwing?(-Math.PI*0.75+tAct*Math.PI*1.5):dir==='up'?-Math.PI*0.5:(heavy&&dir==='down'&&inAct)?tAct*Math.PI*2:dir==='down'?Math.PI*0.4:0;
  ctx.save();ctx.translate(0,by2+h*0.5);ctx.rotate(spearAng);
  // Shaft
  ctx.strokeStyle=ch.accent;ctx.lineWidth=5;ctx.lineCap='round';
  ctx.shadowBlur=inAct?12:4;ctx.shadowColor=ch.eyeCol;
  ctx.beginPath();ctx.moveTo(-(w*0.6+10),0);ctx.lineTo(w*0.7+30+spearExt,0);ctx.stroke();ctx.shadowBlur=0;
  // Tip
  const tipX=w*0.7+30+spearExt;
  ctx.fillStyle=inAct?'#ffffff':ch.eyeCol;
  ctx.beginPath();ctx.moveTo(tipX,0);ctx.lineTo(tipX-16,-8);ctx.lineTo(tipX+18,0);ctx.lineTo(tipX-16,8);ctx.closePath();ctx.fill();
  ctx.strokeStyle=ch.hi;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(tipX-12,-4);ctx.lineTo(tipX+14,0);ctx.lineTo(tipX-12,4);ctx.stroke();
  // Butt end
  ctx.fillStyle=ch.accent;ctx.beginPath();ctx.arc(-(w*0.6+10),0,5,0,Math.PI*2);ctx.fill();
  ctx.restore();
  // Head (goggle style)
  ctx.fillStyle=ch.color;ctx.beginPath();ctx.ellipse(0,by2+h*0.2,w*0.4,h*0.21,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=ch.hi;ctx.beginPath();ctx.ellipse(-4,by2+h*0.13,w*0.27,h*0.09,-0.3,0,Math.PI*2);ctx.fill();
  // Goggles (two circular eyes)
  const gogC=inAct?'#ffffff':ch.eyeCol;
  ctx.fillStyle='#001a1a';ctx.beginPath();ctx.arc(-9,by2+h*0.21,8,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(9,by2+h*0.21,8,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=ch.accent;ctx.lineWidth=2;ctx.beginPath();ctx.arc(-9,by2+h*0.21,8,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(9,by2+h*0.21,8,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle=gogC;ctx.beginPath();ctx.arc(-9,by2+h*0.21,5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(9,by2+h*0.21,5,0,Math.PI*2);ctx.fill();
  if(inSU){ctx.fillStyle=ch.eyeCol;ctx.globalAlpha=0.5+Math.sin(atk.frame*0.5)*0.4;ctx.beginPath();ctx.arc(0,by2+h*0.21,20,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  ctx.strokeStyle=ch.accent;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,by2);ctx.lineTo(0,by2-h*0.06);ctx.stroke();
  ctx.fillStyle=ch.eyeCol;ctx.beginPath();ctx.arc(0,by2-h*0.06,3,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function drawRocket(ctx,ch,w,h,atk,grounded,wf,extra){
  const bx=-w/2,by=-h/2;
  const armsLeft=extra&&extra.armsLeft!=null?extra.armsLeft:4;
  const inAct=atk&&atk.frame>=atk.su&&atk.frame<atk.su+atk.act;
  const dir=atk?atk.dir:null;
  const bob=grounded?Math.sin(wf*Math.PI/2)*2:0,swing=grounded?Math.sin(wf*Math.PI/2)*7:0,by2=by+bob;
  const ll=grounded?(wf<2?5:-5):0;
  if(grounded){ctx.fillStyle='rgba(0,0,0,0.25)';ctx.beginPath();ctx.ellipse(0,h/2+3,w*0.45,5,0,0,Math.PI*2);ctx.fill();}
  // Legs
  rrFill(bx+6,by2+h*0.65,13,h*0.3+ll,4,ch.accent);rrFill(bx+w-19,by2+h*0.65,13,h*0.3-ll,4,ch.accent);
  ctx.fillStyle='#222';ctx.beginPath();ctx.ellipse(bx+12,by2+h*0.94+ll/2,9,5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#222';ctx.beginPath();ctx.ellipse(bx+w-12,by2+h*0.94-ll/2,9,5,0,0,Math.PI*2);ctx.fill();
  // Torso
  rrFill(bx+4,by2+h*0.34,w-8,h*0.36,8,ch.color);
  rrFill(bx+8,by2+h*0.36,w-16,h*0.08,3,ch.hi);
  // Center eye
  ctx.fillStyle=inAct?ch.eyeCol:'#332200';ctx.beginPath();ctx.arc(0,by2+h*0.52,6,0,Math.PI*2);ctx.fill();
  if(inAct){ctx.fillStyle=ch.eyeCol;ctx.globalAlpha=0.4;ctx.beginPath();ctx.arc(0,by2+h*0.52,14,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  // Arms — 4 sockets: upper-left, lower-left, upper-right, lower-right
  // armsLeft: 4=all present, 3=lower-right missing, 2=both right missing, 1=only upper-left, 0=all gone
  // Arms are ordered: 0=upper-left, 1=lower-left, 2=upper-right, 3=lower-right
  // We show them in order from most recently fired (highest index first gone)
  const armPresent=[armsLeft>0,armsLeft>1,armsLeft>2,armsLeft>3];
  const armPositions=[
    {sx:-w/2-2, sy:by2+h*0.38+swing*0.4, side:-1, yOff:0},
    {sx:-w/2-2, sy:by2+h*0.52-swing*0.2, side:-1, yOff:0},
    {sx:w/2+2,  sy:by2+h*0.38-swing*0.4, side:1,  yOff:0},
    {sx:w/2+2,  sy:by2+h*0.52+swing*0.2, side:1,  yOff:0}
  ];
  for(let i=0;i<4;i++){
    const ap=armPositions[i];
    if(armPresent[i]){
      // Full arm
      ctx.save();ctx.translate(ap.sx,ap.sy);
      rrFill(ap.side>0?0:-12,0,12,h*0.22,4,ch.color);
      ctx.fillStyle=ch.accent;ctx.beginPath();ctx.arc(ap.side>0?6:-6,h*0.22,7,0,Math.PI*2);ctx.fill();
      // Claw tip
      ctx.fillStyle=ch.eyeCol;ctx.beginPath();ctx.arc(ap.side>0?6:-6,h*0.22+7,4,0,Math.PI*2);ctx.fill();
      ctx.restore();
    } else {
      // Empty socket
      ctx.save();ctx.translate(ap.sx,ap.sy);
      ctx.strokeStyle='#553300';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(ap.side>0?4:-4,0,6,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#221100';ctx.beginPath();ctx.arc(ap.side>0?4:-4,0,4,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
  }
  // Head (industrial/wide)
  rrFill(bx+6,by2+h*0.06,w-12,h*0.3,8,ch.color);
  rrFill(bx+10,by2+h*0.08,w-20,h*0.09,3,ch.hi);
  // Visor
  ctx.fillStyle='#221100';ctx.beginPath();ctx.ellipse(0,by2+h*0.18,w*0.3,h*0.08,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=inAct?ch.eyeCol:'#cc4400';
  ctx.beginPath();ctx.arc(-10,by2+h*0.18,4,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(0,by2+h*0.18,4,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(10,by2+h*0.18,4,0,Math.PI*2);ctx.fill();
  // Exhaust port on back (left side since facing right)
  ctx.fillStyle=ch.accent;ctx.beginPath();ctx.arc(bx+4,by2+h*0.48,5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ff8800';ctx.globalAlpha=0.6;ctx.beginPath();ctx.arc(bx+4,by2+h*0.48,3,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;
}

function drawBlade(ctx,ch,w,h,atk,grounded,wf){
  const bx=-w/2,by=-h/2;
  const inAct=atk&&atk.frame>=atk.su&&atk.frame<atk.su+atk.act;
  const inSU=atk&&atk.frame<atk.su;
  const dir=atk?atk.dir:null;
  const heavy=atk&&atk.type==='heavy';
  const tAct=atk&&inAct?(atk.frame-atk.su)/Math.max(atk.act,1):0;
  const tSU=atk&&inSU?atk.frame/Math.max(atk.su,1):0;
  const half=atk?Math.floor(atk.act/2):0;
  const phase2=atk&&inAct&&atk.frame>=atk.su+half;
  const bob=grounded?Math.sin(wf*Math.PI/2)*2:0,swing=grounded?Math.sin(wf*Math.PI/2)*7:0,by2=by+bob;
  const ll=grounded?(wf<2?5:-5):0;
  if(grounded){ctx.fillStyle='rgba(0,0,0,0.22)';ctx.beginPath();ctx.ellipse(0,h/2+3,w*0.43,5,0,0,Math.PI*2);ctx.fill();}
  // Legs
  rrFill(bx+5,by2+h*0.65,12,h*0.3+ll,4,ch.accent);rrFill(bx+w-17,by2+h*0.65,12,h*0.3-ll,4,ch.accent);
  ctx.fillStyle='#112233';ctx.beginPath();ctx.ellipse(bx+11,by2+h*0.94+ll/2,8,4,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#112233';ctx.beginPath();ctx.ellipse(bx+w-11,by2+h*0.94-ll/2,8,4,0,0,Math.PI*2);ctx.fill();
  // Torso (slim)
  rrFill(bx+5,by2+h*0.35,w-10,h*0.36,7,ch.color);
  rrFill(bx+8,by2+h*0.37,w-16,h*0.08,3,ch.hi);
  // Eye
  ctx.fillStyle=inAct?ch.eyeCol:'#001122';ctx.beginPath();ctx.arc(0,by2+h*0.52,5,0,Math.PI*2);ctx.fill();
  // Helper: draw a knife shape
  const drawKnife=(kx,ky,ang,kl,big)=>{
    ctx.save();ctx.translate(kx,ky);ctx.rotate(ang);
    ctx.shadowBlur=big?14:8;ctx.shadowColor=ch.eyeCol;
    ctx.fillStyle=ch.hi;ctx.beginPath();ctx.moveTo(kl,0);ctx.lineTo(-5,-3);ctx.lineTo(-5,3);ctx.closePath();ctx.fill();
    ctx.fillStyle=ch.accent;ctx.fillRect(-8,-2,4,4);
    ctx.shadowBlur=0;ctx.restore();
  };
  // Left arm + knife
  const isSideLight=!heavy&&(dir==='side'||dir==='neutral');
  const lkAng=inAct&&!heavy&&dir==='down'?(-Math.PI*0.65+tAct*Math.PI*0.95):inAct&&!heavy&&dir==='up'?-Math.PI*0.65:inSU&&isSideLight?-Math.PI*0.45*tSU:inSU&&!heavy&&dir==='down'?-Math.PI*0.65*tSU:0;
  ctx.save();ctx.translate(bx+2,by2+h*0.4+swing*0.4);
  if(inSU&&isSideLight){ctx.translate(-4*tSU,0);}
  rrFill(-13,0,13,h*0.25,4,ch.color);ctx.fillStyle=ch.accent;ctx.beginPath();ctx.arc(-6,h*0.25,7,0,Math.PI*2);ctx.fill();ctx.restore();
  drawKnife(bx-4,by2+h*0.5+swing*0.4,lkAng,inAct&&isSideLight?16:12,inAct&&isSideLight);
  // Right arm + knife (or combined sword for side heavy swing phase)
  const isSwing=heavy&&inAct&&(dir==='side'||dir==='neutral')&&!phase2;
  const isCombined=isSwing;
  const rkAng=isSwing?(-Math.PI*0.15+tAct*Math.PI*1.1):inAct&&!heavy&&dir==='down'&&phase2?-Math.PI*0.3+tAct*0.3:inAct&&!heavy&&dir==='up'?-Math.PI*0.65:isSideLight&&inSU?Math.PI*0.62*(1-tSU):isSideLight&&inAct?-Math.PI*0.12+tAct*Math.PI*0.22:inSU&&!heavy&&dir==='down'?-Math.PI*0.65*tSU:0;
  const sideShift=isCombined?14:isSideLight&&inAct?8+tAct*22:isSideLight&&inSU?-10+tSU*10:0;
  ctx.save();ctx.translate(bx+w-2,by2+h*0.4-swing*0.4);
  if((inAct||inSU)&&(dir==='side'||dir==='neutral')){ctx.translate(sideShift,inAct&&isSideLight?tAct*-4:0);}
  rrFill(0,0,13,h*0.25,4,ch.color);ctx.fillStyle=ch.accent;ctx.beginPath();ctx.arc(6,h*0.25,7,0,Math.PI*2);ctx.fill();ctx.restore();
  // Side light slash arc trail
  if(isSideLight&&inAct&&!isCombined){
    ctx.save();ctx.lineCap='round';
    // Main arc
    ctx.shadowBlur=14;ctx.shadowColor=ch.eyeCol;ctx.strokeStyle=ch.eyeCol;
    ctx.lineWidth=tAct<0.25?5:3.5;ctx.globalAlpha=0.75-tAct*0.65;
    ctx.beginPath();ctx.arc(bx+w+12,by2+h*0.46,26,-0.72,0.58);ctx.stroke();
    // Outer echo
    ctx.lineWidth=1.5;ctx.globalAlpha=0.38-tAct*0.32;
    ctx.beginPath();ctx.arc(bx+w+12,by2+h*0.46,35,-0.52,0.42);ctx.stroke();
    // Speed lines radiating forward
    ctx.shadowBlur=0;ctx.strokeStyle=ch.hi;ctx.lineWidth=1.5;
    for(let i=0;i<4;i++){
      const la=-0.3+i*0.27;
      const rd=24+i*4;
      ctx.globalAlpha=(0.55-i*0.1)*(1-tAct*0.85);
      ctx.beginPath();
      ctx.moveTo(bx+w+12+Math.cos(la)*rd,by2+h*0.46+Math.sin(la)*rd);
      ctx.lineTo(bx+w+12+Math.cos(la)*(rd+13),by2+h*0.46+Math.sin(la)*(rd+13));
      ctx.stroke();
    }
    ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();
  }
  // Down light startup: faint rising trail as arms cock upward
  if(!heavy&&inSU&&dir==='down'&&tSU>0.15){
    ctx.save();ctx.shadowBlur=8;ctx.shadowColor=ch.eyeCol;ctx.strokeStyle=ch.eyeCol;
    ctx.lineWidth=2;ctx.lineCap='round';ctx.globalAlpha=0.28*tSU;
    const preR=18,preY=by2+h*0.48;
    ctx.beginPath();ctx.arc(bx+4,preY,preR,Math.PI*0.5,Math.PI*0.5-Math.PI*0.6*tSU,true);ctx.stroke();
    ctx.beginPath();ctx.arc(bx+w-4,preY,preR,Math.PI*0.5,Math.PI*0.5+Math.PI*0.6*tSU,false);ctx.stroke();
    ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();
  }
  // Down light sweep arcs (phase 1 and 2)
  if(!heavy&&inAct&&dir==='down'){
    const sweepR=28,sweepY=by2+h*0.5;
    const alpha=0.65-tAct*0.12;
    ctx.save();ctx.shadowBlur=16;ctx.shadowColor=ch.eyeCol;ctx.strokeStyle=ch.eyeCol;ctx.lineWidth=3.5;ctx.lineCap='round';
    ctx.globalAlpha=alpha;
    if(!phase2){
      // Phase 1: broad outward-down sweep
      ctx.beginPath();ctx.arc(bx+4,sweepY,sweepR,-Math.PI*0.05,-Math.PI*0.72,true);ctx.stroke();
      ctx.beginPath();ctx.arc(bx+w-4,sweepY,sweepR,-Math.PI*0.95,-Math.PI*0.28,false);ctx.stroke();
      // Outer echo
      ctx.lineWidth=1.5;ctx.globalAlpha=alpha*0.32;
      ctx.beginPath();ctx.arc(bx+4,sweepY,sweepR+9,-Math.PI*0.05,-Math.PI*0.65,true);ctx.stroke();
      ctx.beginPath();ctx.arc(bx+w-4,sweepY,sweepR+9,-Math.PI*0.95,-Math.PI*0.35,false);ctx.stroke();
    } else {
      // Phase 2: crossing inward
      ctx.lineWidth=3.5;ctx.globalAlpha=alpha;
      ctx.beginPath();ctx.arc(bx+4,sweepY,sweepR,-Math.PI*0.72,-Math.PI*1.15,true);ctx.stroke();
      ctx.beginPath();ctx.arc(bx+w-4,sweepY,sweepR,-Math.PI*0.28,Math.PI*0.15,false);ctx.stroke();
      // Cross-point spark
      ctx.lineWidth=2;ctx.shadowBlur=10;
      const spx=bx+w/2,spy=sweepY+sweepR*0.52;
      for(let i=0;i<6;i++){
        const sa=i*Math.PI/3+tAct*1.8;
        ctx.globalAlpha=alpha*(1-tAct)*0.85;
        ctx.beginPath();ctx.moveTo(spx+Math.cos(sa)*3,spy+Math.sin(sa)*3);
        ctx.lineTo(spx+Math.cos(sa)*11,spy+Math.sin(sa)*11);ctx.stroke();
      }
    }
    ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();
  }
  // Right knife or combined sword
  if(isCombined){
    // Combined sword visual
    ctx.save();ctx.translate(bx+w+10,by2+h*0.45);ctx.rotate(-Math.PI*0.1+tAct*Math.PI*1.1);
    ctx.shadowBlur=16;ctx.shadowColor=ch.eyeCol;
    ctx.fillStyle=ch.hi;ctx.beginPath();ctx.moveTo(22,0);ctx.lineTo(-8,-5);ctx.lineTo(-8,5);ctx.closePath();ctx.fill();
    ctx.globalAlpha=0.7;ctx.fillStyle=ch.hi;ctx.beginPath();ctx.moveTo(-8,-3);ctx.lineTo(-14,-6);ctx.lineTo(-14,6);ctx.lineTo(-8,3);ctx.closePath();ctx.fill();
    ctx.globalAlpha=1;ctx.fillStyle=ch.accent;ctx.fillRect(-10,-7,5,14);
    ctx.shadowBlur=0;ctx.restore();
  } else if(!phase2||dir!=='down'){
    drawKnife(bx+w+4,by2+h*0.5-swing*0.4,rkAng,isSideLight&&inAct?16:12,isSideLight&&inAct);
  } else {
    // Phase 2: right knife sweeps left-down across
    drawKnife(bx-4,by2+h*0.52,rkAng,16,true);
  }
  // Head (helmet style)
  rrFill(bx+8,by2+h*0.04,w-16,h*0.32,8,ch.color);
  rrFill(bx+12,by2+h*0.06,w-24,h*0.08,3,ch.hi);
  ctx.fillStyle='#001122';ctx.beginPath();ctx.ellipse(0,by2+h*0.18,w*0.28,h*0.08,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=inAct?ch.eyeCol:'#3388bb';
  ctx.beginPath();ctx.ellipse(0,by2+h*0.18,w*0.18,h*0.04,0,0,Math.PI*2);ctx.fill();
  if(inSU){ctx.fillStyle=ch.eyeCol;ctx.globalAlpha=0.35+Math.sin(atk.frame*0.5)*0.3;ctx.beginPath();ctx.arc(0,by2+h*0.18,18,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
}

function drawUnstable(ctx,ch,w,h,atk,grounded,wf){
  const bx=-w/2,by=-h/2;
  const inAct=atk&&atk.frame>=atk.su&&atk.frame<atk.su+atk.act;
  const inSU=atk&&atk.frame<atk.su;
  const dir=atk?atk.dir:null;
  const heavy=atk&&atk.type==='heavy';
  const tAct=atk&&inAct?(atk.frame-atk.su)/Math.max(atk.act,1):0;
  const bob=grounded?Math.sin(wf*Math.PI/2)*2:0, by2=by+bob;
  const ll=grounded?(wf<2?5:-5):0;
  const isDash=!heavy&&inAct&&(dir==='side'||dir==='neutral');
  const isExploding=heavy&&inAct&&dir==='down';
  const headGone=!heavy&&inAct&&dir==='up';

  // Constant jitter — gets worse during attacks
  const jAmt=isExploding?3:heavy&&inAct?1.8:0.55;
  const jx=Math.sin(frame*1.7)*jAmt, jy=Math.cos(frame*2.1)*jAmt*0.5;

  // Shadow (wobbly outline)
  if(grounded){
    ctx.fillStyle='rgba(0,0,0,0.28)';
    ctx.beginPath();ctx.ellipse(jx*0.3,h/2+4,w*0.44+Math.abs(jx),5,0,0,Math.PI*2);ctx.fill();
  }

  // Dash afterimage — chaotic with debris dots
  if(isDash){
    ctx.save();
    ctx.globalAlpha=0.3+tAct*0.22;ctx.fillStyle=ch.color;
    ctx.beginPath();ctx.ellipse(-12*tAct*7,by2+h*0.5,w*0.42,h*0.33,0,0,Math.PI*2);ctx.fill();
    for(let i=0;i<5;i++){
      ctx.globalAlpha=(0.55-i*0.09)*tAct;
      ctx.fillStyle=i%2===0?ch.eyeCol:ch.accent;
      ctx.beginPath();ctx.arc(-28-i*16*tAct,(i-2)*9*tAct+by2+h*0.5,3-i*0.4,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }

  // ── LEGS (asymmetric and cracked) ──
  // Left leg: angled outward, crack mark
  ctx.save();ctx.translate(bx+10,by2+h*0.64+jy*0.3);ctx.rotate(-0.09);
  rrFill(-6,0,13,h*0.28+ll,4,ch.accent);
  ctx.strokeStyle='#ff4466';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(2,h*0.07);ctx.lineTo(-3,h*0.16);ctx.lineTo(2,h*0.24);ctx.stroke();
  ctx.restore();
  // Right leg: shorter, bent inward
  ctx.save();ctx.translate(bx+w-13,by2+h*0.65-jy*0.3);ctx.rotate(0.13);
  rrFill(-6,0,12,h*0.25-ll,4,ch.accent);
  // Visible bolt
  ctx.fillStyle='#888';ctx.beginPath();ctx.arc(-1,h*0.1,2,0,Math.PI*2);ctx.fill();
  ctx.restore();
  // Feet (uneven)
  ctx.fillStyle='#220000';
  ctx.beginPath();ctx.ellipse(bx+10,by2+h*0.93+ll/2,11,5,0.08,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#2a0000';
  ctx.beginPath();ctx.ellipse(bx+w-11,by2+h*0.91-ll/2,9,4,-0.15,0,Math.PI*2);ctx.fill();
  // Exposed wires at leg joints
  ctx.strokeStyle='#ff8800';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(bx+8,by2+h*0.65);ctx.lineTo(bx+4,by2+h*0.70);ctx.stroke();
  ctx.strokeStyle='#ffcc00';
  ctx.beginPath();ctx.moveTo(bx+w-10,by2+h*0.64);ctx.lineTo(bx+w-5,by2+h*0.68);ctx.stroke();

  // ── TORSO ──
  ctx.save();ctx.translate(jx*0.6,jy*0.4);
  rrFill(bx+4,by2+h*0.32,w-8,h*0.39,8,ch.color);
  // Highlight strip (slightly skewed)
  ctx.save();ctx.translate(bx+8,by2+h*0.34);ctx.rotate(0.04);
  rrFill(0,0,w-16,h*0.09,3,ch.hi);ctx.restore();
  // Diagonal chest crack
  ctx.strokeStyle='#ff4466';ctx.lineWidth=1.5;ctx.globalAlpha=0.9;
  ctx.beginPath();ctx.moveTo(bx+14,by2+h*0.35);ctx.lineTo(bx+21,by2+h*0.47);ctx.lineTo(bx+13,by2+h*0.59);ctx.stroke();
  ctx.globalAlpha=1;
  // Loose panel hanging off top-right of torso
  ctx.save();ctx.translate(bx+w-15,by2+h*0.37);ctx.rotate(0.24+Math.sin(frame*0.06)*0.045);
  rrPath(-2,-1,11,17,2);ctx.fillStyle='#881122';ctx.fill();ctx.strokeStyle='#cc2244';ctx.lineWidth=1;ctx.stroke();
  ctx.restore();
  // Dark gap behind loose panel + exposed wires
  ctx.fillStyle='#0d0005';ctx.fillRect(bx+w-14,by2+h*0.37,8,16);
  ctx.strokeStyle='#ffcc00';ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(bx+w-13,by2+h*0.39);ctx.quadraticCurveTo(bx+w-8,by2+h*0.44,bx+w-13,by2+h*0.51);ctx.stroke();
  ctx.strokeStyle='#00ffcc';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(bx+w-11,by2+h*0.40);ctx.quadraticCurveTo(bx+w-7,by2+h*0.46,bx+w-10,by2+h*0.52);ctx.stroke();
  // Arm ports
  const portLeft=bx-2, portRight=bx+w+2, portY=by2+h*0.44;
  ctx.fillStyle=inAct?ch.eyeCol:'#550000';
  if(inAct){ctx.save();ctx.shadowBlur=12;ctx.shadowColor=ch.eyeCol;}
  ctx.beginPath();ctx.arc(portLeft,portY,7,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(portRight,portY,7,0,Math.PI*2);ctx.fill();
  if(inAct)ctx.restore();
  ctx.restore(); // end torso jitter

  // Persistent idle sparks at joints
  const sf=frame*0.13;
  ctx.save();
  ctx.globalAlpha=0.5+Math.sin(sf*3)*0.5;ctx.fillStyle='#ff8800';
  ctx.beginPath();ctx.arc(bx+w*0.5+Math.sin(sf)*3,by2+h*0.32,2,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=0.35+Math.cos(sf*2)*0.35;ctx.fillStyle='#ffcc00';
  ctx.beginPath();ctx.arc(portRight+Math.cos(sf*1.5)*2,portY+2,1.5,0,Math.PI*2);ctx.fill();
  ctx.restore();
  // Idle head smoke puff
  if(Math.sin(sf*2.2)>0.55&&!headGone){
    ctx.save();ctx.globalAlpha=0.22;ctx.fillStyle='#998877';
    ctx.beginPath();ctx.arc(bx+w*0.55+Math.sin(sf)*3,by2,6,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  // ── SIDE HEAVY: flame burst + metal debris ──
  if(heavy&&inAct&&(dir==='side'||dir==='neutral')){
    ctx.save();
    const flameX=bx+w+8, flameLen=52+tAct*34;
    for(let i=0;i<6;i++){
      const t=i/5, wobY=(Math.random()-.5)*20*t;
      ctx.globalAlpha=(1-t)*0.72;
      const gr=ctx.createLinearGradient(flameX,portY,flameX+flameLen*t,portY+wobY);
      gr.addColorStop(0,'#ffaa00');gr.addColorStop(0.5,'#ff3300');gr.addColorStop(1,'rgba(180,0,0,0)');
      ctx.strokeStyle=gr;ctx.lineWidth=16*(1-t)+3;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(flameX,portY+wobY*0.1);ctx.lineTo(flameX+flameLen*t,portY+wobY);ctx.stroke();
    }
    // Metal shards flying with the blast
    for(let i=0;i<4;i++){
      const dt=(tAct+i*0.25)%1;
      ctx.globalAlpha=(1-dt)*0.85;ctx.fillStyle=i%2===0?ch.color:ch.accent;
      ctx.save();ctx.translate(flameX+dt*55+(i-1.5)*8,portY+(i-1.5)*14*dt);
      ctx.rotate(dt*Math.PI*3*(i%2===0?1:-1));ctx.fillRect(-3.5,-2,7,4);ctx.restore();
    }
    ctx.restore();
  }

  // ── UP HEAVY: smoke plumes with shaking ──
  if(heavy&&(inAct||inSU)&&dir==='up'){
    ctx.save();
    const shk=inSU?(atk.frame/atk.su)*4:4;
    ctx.globalAlpha=0.55+Math.sin(atk.frame*0.5)*0.15;ctx.fillStyle='#998877';
    const puff=Math.sin(atk.frame*0.45)*6;
    ctx.beginPath();ctx.arc(portLeft+(Math.random()-.5)*shk,portY+puff+5,12,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(portRight+(Math.random()-.5)*shk,portY+puff+5,12,0,Math.PI*2);ctx.fill();
    if(inAct){
      ctx.globalAlpha=0.35*tAct;ctx.fillStyle='#776655';
      ctx.beginPath();ctx.arc(portLeft,portY-12*tAct,10*tAct,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(portRight,portY-12*tAct,10*tAct,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }

  // ── DOWN HEAVY: explosion + flying shards ──
  if(isExploding){
    ctx.save();
    const gr=ctx.createRadialGradient(0,by2+h*0.5,5,0,by2+h*0.5,90);
    gr.addColorStop(0,'#ffee00');gr.addColorStop(0.35,'#ff4400');gr.addColorStop(1,'rgba(170,0,0,0)');
    ctx.globalAlpha=tAct*0.82;ctx.fillStyle=gr;
    ctx.beginPath();ctx.arc(0,by2+h*0.5,90,0,Math.PI*2);ctx.fill();
    for(let i=0;i<8;i++){
      const ang=i/8*Math.PI*2, dist=20+tAct*70;
      ctx.globalAlpha=(1-tAct)*0.92;
      ctx.fillStyle=i%3===0?ch.color:i%3===1?ch.accent:ch.eyeCol;
      ctx.save();ctx.translate(Math.cos(ang)*dist,by2+h*0.5+Math.sin(ang)*dist);
      ctx.rotate(tAct*Math.PI*(i%2===0?4:-4));ctx.fillRect(-4,-3,8,6);ctx.restore();
    }
    ctx.globalAlpha=tAct*0.35;ctx.strokeStyle='#ffee00';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(0,by2+h*0.5,18+tAct*65,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }

  // ── ARMS ──
  const armLX=bx-3, armRX=bx+w+3, armY=by2+h*0.38;
  // Left arm: drooping, cracked, with occasional spark at hand
  ctx.save();ctx.translate(armLX+jx*0.5,armY+4+jy*0.5);
  ctx.rotate(-0.14+Math.sin(frame*0.09)*0.035);
  rrFill(-15,0,14,h*0.30,5,ch.color);
  ctx.strokeStyle='#ff4466';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(-8,h*0.08);ctx.lineTo(-5,h*0.19);ctx.stroke();
  ctx.fillStyle=ch.accent;ctx.beginPath();ctx.ellipse(-8,h*0.30,9,7,0.2,0,Math.PI*2);ctx.fill();
  if(Math.sin(frame*0.27)>0.55){
    ctx.fillStyle='#ff8800';ctx.globalAlpha=0.75;
    ctx.beginPath();ctx.arc(-8+(Math.random()*4-2),h*0.33,2,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
  // Right arm: stubby, extends on side heavy
  ctx.save();ctx.translate(armRX+jx*0.3,armY-2+jy*0.3);
  if(inAct&&heavy&&(dir==='side'||dir==='neutral'))ctx.translate(22,0);
  ctx.rotate(0.1+Math.sin(frame*0.1+1.2)*0.03);
  rrFill(0,0,14,h*0.26,5,ch.color);
  ctx.fillStyle=ch.accent;ctx.beginPath();ctx.ellipse(7,h*0.26,8,6,-0.12,0,Math.PI*2);ctx.fill();
  ctx.restore();

  // ── HEAD (tilted, cracked, loose panel, flickering eye) ──
  if(!headGone){
    ctx.save();ctx.translate(jx*0.45,jy*0.3);
    ctx.rotate(0.055+Math.sin(frame*0.07)*0.018); // permanent tilt
    rrFill(bx+8,by2+h*0.04,w-16,h*0.30,9,ch.color);
    // Highlight bar
    ctx.save();ctx.translate(bx+12,by2+h*0.06);ctx.rotate(-0.04);
    rrFill(0,0,w-24,h*0.08,3,ch.hi);ctx.restore();
    // Head crack
    ctx.strokeStyle='#ff4466';ctx.lineWidth=1.5;ctx.globalAlpha=0.85;
    ctx.beginPath();ctx.moveTo(bx+10,by2+h*0.07);ctx.lineTo(bx+15,by2+h*0.16);ctx.lineTo(bx+10,by2+h*0.23);ctx.stroke();
    ctx.globalAlpha=1;
    // Loose side panel swinging
    ctx.save();ctx.translate(bx+w-7,by2+h*0.12);ctx.rotate(0.28+Math.sin(frame*0.07)*0.05);
    rrFill(-3,-2,8,15,2,ch.accent);ctx.restore();
    // Cracked visor
    ctx.fillStyle='#110000';ctx.beginPath();ctx.ellipse(0,by2+h*0.18,w*0.28,h*0.082,0,0,Math.PI*2);ctx.fill();
    // Left eye bright, right eye flickering
    const flickOn=Math.sin(frame*0.35)>-0.2;
    const ec1=inAct?'#ffcc00':'#cc2200';
    const ec2=inAct?ch.eyeCol:(flickOn?'#992200':'#220000');
    if(inAct){ctx.save();ctx.shadowBlur=10;ctx.shadowColor=ch.eyeCol;}
    ctx.fillStyle=ec1;ctx.beginPath();ctx.arc(-9,by2+h*0.18,5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=ec2;ctx.beginPath();ctx.arc(9,by2+h*0.18,4,0,Math.PI*2);ctx.fill();
    if(inAct)ctx.restore();
    ctx.shadowBlur=0;
    // Visor cracks
    ctx.strokeStyle='#ff4400';ctx.lineWidth=1;ctx.globalAlpha=0.7;
    ctx.beginPath();ctx.moveTo(-14,by2+h*0.14);ctx.lineTo(-3,by2+h*0.22);ctx.stroke();
    ctx.beginPath();ctx.moveTo(5,by2+h*0.15);ctx.lineTo(11,by2+h*0.21);ctx.stroke();
    ctx.globalAlpha=1;
    // "!" danger marker (slightly off-center)
    ctx.fillStyle='#ff0000';ctx.font='bold 11px monospace';ctx.textAlign='center';
    ctx.shadowBlur=5;ctx.shadowColor='#ff0000';
    ctx.fillText('!',2,by2+h*0.10);ctx.shadowBlur=0;
    ctx.restore(); // end head
  } else {
    // Neck stump — heat glow + orbiting sparks + dangling wires
    ctx.save();
    ctx.globalAlpha=0.55;
    const ng=ctx.createRadialGradient(0,by2+h*0.08,2,0,by2+h*0.08,16);
    ng.addColorStop(0,'#ffee00');ng.addColorStop(1,'rgba(255,60,0,0)');
    ctx.fillStyle=ng;ctx.beginPath();ctx.arc(0,by2+h*0.08,16,0,Math.PI*2);ctx.fill();
    for(let i=0;i<7;i++){
      const ang=i/7*Math.PI*2+frame*0.28, d=4+Math.sin(frame*0.35+i)*3;
      ctx.fillStyle=i%2===0?'#ff8800':'#ffcc00';
      ctx.globalAlpha=0.7+Math.sin(frame*0.4+i)*0.3;
      ctx.beginPath();ctx.arc(Math.cos(ang)*d,by2+h*0.08+Math.sin(ang)*3.5,2.5,0,Math.PI*2);ctx.fill();
    }
    ctx.strokeStyle='#ff8800';ctx.lineWidth=1.5;ctx.globalAlpha=0.85;
    ctx.beginPath();ctx.moveTo(-5,by2+h*0.10);ctx.quadraticCurveTo(-8,by2+h*0.17,-4,by2+h*0.22);ctx.stroke();
    ctx.strokeStyle='#ffcc00';
    ctx.beginPath();ctx.moveTo(3,by2+h*0.10);ctx.quadraticCurveTo(6,by2+h*0.16,4,by2+h*0.22);ctx.stroke();
    ctx.restore();
  }
}

function drawPristine(ctx,ch,w,h,atk,grounded,wf){
  const bx=-w/2,by=-h/2;
  const inAct=atk&&atk.frame>=atk.su&&atk.frame<atk.su+atk.act;
  const dir=atk?atk.dir:null;
  const heavy=atk&&atk.type==='heavy';
  const bob=grounded?Math.sin(wf*Math.PI/2)*2:0,by2=by+bob;
  const ll=grounded?(wf<2?4:-4):0;
  const swing=grounded?Math.sin(wf*Math.PI/2)*6:0;
  if(grounded){ctx.fillStyle='rgba(0,220,220,0.12)';ctx.beginPath();ctx.ellipse(0,h/2+3,w*0.44,5,0,0,Math.PI*2);ctx.fill();}
  // Legs
  rrFill(bx+7,by2+h*0.63,12,h*0.31+ll,4,'#111');
  rrFill(bx+w-19,by2+h*0.63,12,h*0.31-ll,4,'#111');
  // Cyan leg accents
  ctx.fillStyle='#00ffff';ctx.fillRect(bx+8,by2+h*0.76,9,3);
  ctx.fillStyle='#00ffff';ctx.fillRect(bx+w-17,by2+h*0.76,9,3);
  // Feet
  ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(bx+13,by2+h*0.94+ll/2,10,5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(bx+w-13,by2+h*0.94-ll/2,10,5,0,0,Math.PI*2);ctx.fill();
  // Body
  rrFill(bx+4,by2+h*0.36,w-8,h*0.36,9,'#ffffff');
  // Body highlight bar
  rrFill(bx+8,by2+h*0.38,w-16,h*0.07,3,'#aaffff');
  // Black body stripes
  ctx.fillStyle='#000';ctx.fillRect(bx+10,by2+h*0.52,w-20,2);
  ctx.fillStyle='#000';ctx.fillRect(bx+10,by2+h*0.60,w-20,2);
  // Left arm
  ctx.save();ctx.translate(bx+2,by2+h*0.40);
  ctx.rotate(inAct&&dir==='up'?-0.5:inAct&&dir==='down'?0.4:swing*0.035);
  rrFill(-10,0,10,h*0.25,4,'#ffffff');
  ctx.fillStyle='#000';ctx.fillRect(-8,h*0.1,7,2);
  ctx.fillStyle='#00ffff';ctx.beginPath();ctx.arc(-5,h*0.25,6,0,Math.PI*2);ctx.fill();
  ctx.restore();
  // Right arm (firing arm)
  ctx.save();ctx.translate(bx+w-2,by2+h*0.40);
  if(inAct){
    if(dir==='side'||dir==='neutral'){ctx.translate(8,-2);}
    else if(dir==='up'){ctx.rotate(-0.7);ctx.translate(4,-12);}
    else if(dir==='down'){ctx.rotate(0.7);ctx.translate(4,10);}
    else{ctx.rotate(-0.3);ctx.translate(4,-6);}
  } else {ctx.rotate(-swing*0.035);}
  rrFill(0,0,10,h*0.25,4,'#ffffff');
  ctx.fillStyle='#000';ctx.fillRect(2,h*0.1,7,2);
  // Gun barrel
  ctx.fillStyle='#00ffff';ctx.shadowBlur=inAct?16:5;ctx.shadowColor='#00ffff';
  ctx.beginPath();ctx.arc(5,h*0.25,7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#000';ctx.fillRect(5,h*0.20,13,3);
  ctx.shadowBlur=0;
  ctx.restore();
  // Head
  ctx.fillStyle='#ffffff';ctx.beginPath();ctx.ellipse(0,by2+h*0.2,w*0.42,h*0.22,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#aaffff';ctx.beginPath();ctx.ellipse(-3,by2+h*0.13,w*0.28,h*0.1,-0.2,0,Math.PI*2);ctx.fill();
  // Visor
  ctx.shadowBlur=inAct?18:8;ctx.shadowColor='#00ffff';
  ctx.globalAlpha=0.9;
  rrFill(-w*0.28,by2+h*0.16,w*0.56,h*0.09,3,inAct?'#ffffff':'#00ffff');
  ctx.globalAlpha=1;ctx.shadowBlur=0;
  // Antenna
  ctx.strokeStyle='#000';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(0,by2+h*0.03);ctx.lineTo(6,by2-h*0.04);ctx.stroke();
  ctx.fillStyle='#00ffff';ctx.shadowBlur=9;ctx.shadowColor='#00ffff';
  ctx.beginPath();ctx.arc(6,by2-h*0.04,4,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
  // Wing fins on back (passive aesthetic)
  ctx.strokeStyle='rgba(0,255,255,0.25)';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(bx+3,by2+h*0.42);ctx.lineTo(bx-11,by2+h*0.34);ctx.lineTo(bx-7,by2+h*0.52);ctx.closePath();ctx.stroke();
}

// ---- Stage Drawing ----
let frame=0;
function drawStageBG(st){
  const gr=ctx.createLinearGradient(0,-60,0,H+60);gr.addColorStop(0,st.bgT);gr.addColorStop(1,st.bgB);ctx.fillStyle=gr;ctx.fillRect(-230,-40,W+460,H+80);
  if(st.id===0){
    // THE FOUNDRY — molten skybox with fire columns, distant smokestacks, drifting embers
    // Distant smokestacks (parallax)
    ctx.fillStyle='rgba(40,18,8,0.95)';
    const stacks=[[80,560],[180,490],[820,520],[920,560]];
    for(const [sx,sh] of stacks){ctx.fillRect(sx-22,H-sh,44,sh); ctx.fillRect(sx-26,H-sh-8,52,10);}
    // Smoke plumes from stacks
    for(let i=0;i<3;i++){
      const sxs=[80,180,820,920],sx=sxs[i%4];
      for(let k=0;k<5;k++){
        const py=(frame*0.6+k*60+i*30)%500;
        const a=(1-py/500)*0.25;
        const r=18+k*4;
        ctx.fillStyle=`rgba(60,30,15,${a})`;
        ctx.beginPath();ctx.arc(sx+Math.sin(frame*0.02+k)*8,H-580+py,r,0,Math.PI*2);ctx.fill();
      }
    }
    // Massive central forge glow (radial pulse)
    const pulse=Math.sin(frame*0.04)*0.1+0.55;
    const glow=ctx.createRadialGradient(W/2,H+80,40,W/2,H+80,540);
    glow.addColorStop(0,`rgba(255,160,40,${pulse})`);
    glow.addColorStop(0.45,'rgba(255,80,0,0.32)');
    glow.addColorStop(1,'rgba(180,20,0,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
    // Vertical heat shimmer columns
    for(let i=0;i<5;i++){
      const cx=120+i*180+Math.sin(frame*0.03+i)*8;
      const colG=ctx.createLinearGradient(cx,H,cx,0);
      colG.addColorStop(0,'rgba(255,150,40,0.18)');
      colG.addColorStop(1,'rgba(255,150,40,0)');
      ctx.fillStyle=colG;ctx.fillRect(cx-10,0,20,H);
    }
    // Drifting ember particles (full screen)
    for(let i=0;i<55;i++){
      const ex=(i*173+frame*1.3+Math.sin(frame*0.04+i)*30)%W;
      const ey=H-((frame*1.6+i*89)%(H+100));
      const ef=Math.max(0,1-ey/H);
      ctx.fillStyle=`rgba(255,${100+ef*150},${20+ef*40},${ef*0.85})`;
      ctx.shadowBlur=5;ctx.shadowColor='#ff7700';
      ctx.beginPath();ctx.arc(ex,ey,1+ef*2.5,0,Math.PI*2);ctx.fill();
    }
    ctx.shadowBlur=0;
    // Background giant rotating gears
    drawGear(80,140,52,'#3a1a08','#5a2a12');drawGear(920,180,46,'#3a1a08','#5a2a12');drawGear(160,440,38,'#2a1208','#4a2010');
  } else if(st.id===1){
    // ORBITAL STATION — rich starfield, planet, nebulae, drifting satellites
    // Deep nebula clouds
    for(let i=0;i<3;i++){
      const ng=ctx.createRadialGradient(200+i*350,200+i*60,30,200+i*350,200+i*60,260);
      const cols=[['rgba(80,40,160,0.18)','rgba(80,40,160,0)'],['rgba(40,80,180,0.15)','rgba(40,80,180,0)'],['rgba(160,40,120,0.16)','rgba(160,40,120,0)']];
      ng.addColorStop(0,cols[i][0]);ng.addColorStop(1,cols[i][1]);
      ctx.fillStyle=ng;ctx.fillRect(0,0,W,H);
    }
    // Dense starfield with parallax (multiple layers)
    for(let i=0;i<140;i++){
      const sx=(i*137+60+frame*0.05)%W;
      const sy=(i*89+40)%H;
      const blink=Math.sin(frame*0.04+i)*0.4+0.6;
      const sz=i%7===0?2.5:i%3===0?1.5:0.8;
      ctx.fillStyle=`rgba(255,255,255,${(blink*0.85).toFixed(2)})`;
      ctx.beginPath();ctx.arc(sx,sy,sz,0,Math.PI*2);ctx.fill();
    }
    // Bright pulsar stars
    for(let i=0;i<6;i++){
      const sx=(i*171+90)%W,sy=(i*53+50)%(H*0.85);
      const pulse=Math.sin(frame*0.08+i*1.3)*0.4+0.6;
      ctx.fillStyle=`rgba(180,220,255,${pulse})`;ctx.shadowBlur=14;ctx.shadowColor='#88bbff';
      ctx.beginPath();ctx.arc(sx,sy,2.5,0,Math.PI*2);ctx.fill();
    }
    ctx.shadowBlur=0;
    // Large planet (bottom-left, slowly rotating bands)
    const px=160,py=H-90;
    const pg=ctx.createRadialGradient(px-40,py-40,10,px,py,160);
    pg.addColorStop(0,'#88aaff');pg.addColorStop(0.5,'#3355bb');pg.addColorStop(0.9,'#112266');pg.addColorStop(1,'#001144');
    ctx.fillStyle=pg;ctx.beginPath();ctx.arc(px,py,160,0,Math.PI*2);ctx.fill();
    // Planet bands
    ctx.save();ctx.beginPath();ctx.arc(px,py,160,0,Math.PI*2);ctx.clip();
    ctx.strokeStyle='rgba(60,90,160,0.4)';ctx.lineWidth=8;
    for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(px,py-50+i*40,170,12,0.05+frame*0.0008,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
    // Planet ring
    ctx.strokeStyle='rgba(120,160,220,0.4)';ctx.lineWidth=10;
    ctx.beginPath();ctx.ellipse(px,py,210,40,0.35,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='rgba(180,200,240,0.2)';ctx.lineWidth=4;
    ctx.beginPath();ctx.ellipse(px,py,235,46,0.35,0,Math.PI*2);ctx.stroke();
    // Distant station silhouettes drifting
    ctx.fillStyle='rgba(50,70,110,0.55)';
    const sd=(frame*0.15)%1200-200;
    ctx.fillRect(sd,180,28,8); ctx.fillRect(sd+10,176,8,16); ctx.fillRect(sd-5,177,5,14);
    // Moving satellite with blinking light
    const satX=(frame*0.7)%1100-50;
    ctx.fillStyle='#aabbcc';ctx.fillRect(satX,90,16,4);
    ctx.fillStyle=Math.floor(frame/20)%2?'#ff4444':'#440000';ctx.beginPath();ctx.arc(satX+8,92,2,0,Math.PI*2);ctx.fill();
  } else if(st.id===2){
    // SCRAPYARD — toxic green sky, distant junk piles silhouettes, falling sparks
    // Toxic clouds (slow drift)
    for(let i=0;i<4;i++){
      const cx=(i*280+frame*0.18)%(W+200)-100;
      const cy=80+i*40;
      ctx.fillStyle=`rgba(${80+i*15},${110+i*10},${30+i*5},0.18)`;
      ctx.beginPath();ctx.ellipse(cx,cy,140,40,0,0,Math.PI*2);ctx.fill();
    }
    // Distant junk pile silhouettes (mountains of scrap)
    ctx.fillStyle='rgba(20,30,12,0.92)';
    ctx.beginPath();ctx.moveTo(0,H);
    ctx.lineTo(0,440);ctx.lineTo(60,400);ctx.lineTo(120,420);ctx.lineTo(180,360);ctx.lineTo(260,400);ctx.lineTo(320,380);ctx.lineTo(380,420);ctx.lineTo(450,390);ctx.lineTo(520,410);ctx.lineTo(600,370);ctx.lineTo(680,400);ctx.lineTo(760,380);ctx.lineTo(840,420);ctx.lineTo(920,400);ctx.lineTo(W,440);ctx.lineTo(W,H);ctx.closePath();ctx.fill();
    // Mid-distance jagged scrap silhouettes
    ctx.fillStyle='rgba(35,50,18,0.7)';
    ctx.beginPath();ctx.moveTo(0,H);
    for(let i=0;i<=10;i++){const x=i*100,y=300+Math.sin(i*1.7)*50;ctx.lineTo(x,y);}
    ctx.lineTo(W,H);ctx.closePath();ctx.fill();
    // Smoke fog rising
    const fog=ctx.createLinearGradient(0,200,0,H);fog.addColorStop(0,'rgba(40,65,25,0)');fog.addColorStop(1,'rgba(20,40,15,0.65)');ctx.fillStyle=fog;ctx.fillRect(0,0,W,H);
    // Falling sparks (welding particles)
    for(let i=0;i<22;i++){
      const sx=(i*191+30)%W;
      const sy=(frame*1.5+i*73)%H;
      ctx.fillStyle=`rgba(255,${180+(i%3)*30},80,0.85)`;
      ctx.shadowBlur=6;ctx.shadowColor='#ffaa44';
      ctx.beginPath();ctx.arc(sx,sy,1.2,0,Math.PI*2);ctx.fill();
    }
    ctx.shadowBlur=0;
    // Floating scrap debris specks
    for(let i=0;i<12;i++){const dx=(i*247+frame*0.4)%W,dy=(i*97+frame*0.5)%H;ctx.fillStyle='rgba(80,90,55,0.45)';ctx.fillRect(dx,dy,3,3);}
  } else if(st.id===3){
    // NEON CITY — heavy neon rain, parallax skyscrapers, holograms, lightning
    // Lightning flash (rare)
    if(Math.floor(frame/5)%140<2){ctx.fillStyle='rgba(180,140,255,0.18)';ctx.fillRect(0,0,W,H);}
    // Rain (multiple layers, faster front)
    ctx.strokeStyle='rgba(180,100,255,0.25)';ctx.lineWidth=1.5;
    for(let i=0;i<70;i++){const rx=(i*233+frame*4)%W,ry=(i*97+frame*5)%(H+30);ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-5,ry+22);ctx.stroke();}
    ctx.strokeStyle='rgba(140,80,220,0.12)';
    for(let i=0;i<40;i++){const rx=(i*333+frame*2.5)%W,ry=(i*123+frame*3)%H;ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-3,ry+15);ctx.stroke();}
    // Far parallax skyscrapers (distant haze)
    ctx.fillStyle='rgba(20,8,40,0.85)';
    const farB=[[40,400],[120,360],[210,420],[300,380],[400,440],[490,380],[580,420],[680,360],[780,400],[880,380]];
    for(const [bx,bh] of farB){ctx.fillRect(bx-10,H-bh,46,bh);}
    // Mid skyscrapers with neon trim
    ctx.fillStyle='rgba(10,4,30,0.95)';
    const midB=[[20,460,'#ff44ff'],[180,400,'#44ffff'],[420,500,'#ff66cc'],[680,440,'#44ddff'],[860,480,'#aa44ff']];
    for(const [bx,bh,col] of midB){
      ctx.fillRect(bx,H-bh,80,bh);
      // Neon trim
      ctx.shadowBlur=14;ctx.shadowColor=col;ctx.fillStyle=col;ctx.fillRect(bx,H-bh,80,3);
      ctx.fillRect(bx,H-bh+15,4,bh-15);ctx.fillRect(bx+76,H-bh+15,4,bh-15);
      ctx.shadowBlur=0;ctx.fillStyle='rgba(10,4,30,0.95)';
    }
    // Scrolling holograms (distant billboards floating mid-air)
    for(let i=0;i<3;i++){
      const hx=((frame*0.4+i*450)%(W+200))-100;
      const hy=120+i*100;
      const hcols=['#ff44ff','#44ffff','#ffff44'];
      ctx.fillStyle=`rgba(${i===0?255:i===1?68:255},${i===0?68:i===1?255:255},${i===0?255:i===1?255:68},0.2)`;
      ctx.fillRect(hx,hy,80,40);
      ctx.strokeStyle=hcols[i];ctx.lineWidth=1.5;ctx.shadowBlur=8;ctx.shadowColor=hcols[i];
      ctx.strokeRect(hx,hy,80,40);
      ctx.shadowBlur=0;
    }
    // Window grid lights on mid skyscrapers (blinking)
    for(let i=0;i<60;i++){
      const blink=Math.sin(frame*0.05+i*1.3)>0.3;if(!blink)continue;
      const wx=20+(i*23)%900,wy=200+(i*37)%280;
      const cols=['rgba(255,68,255,0.7)','rgba(68,255,255,0.7)','rgba(255,255,68,0.7)'];
      ctx.fillStyle=cols[i%3];ctx.fillRect(wx,wy,4,4);
    }
    // Bottom neon ground glow
    const gl=ctx.createLinearGradient(0,400,0,H);gl.addColorStop(0,'rgba(170,50,255,0)');gl.addColorStop(1,'rgba(170,50,255,0.32)');ctx.fillStyle=gl;ctx.fillRect(0,400,W,H-400);
  } else if(st.id===4){
    // ARCTIC BASE — heavy snow, aurora borealis, distant mountains
    // Aurora ribbons (slow shifting)
    for(let i=0;i<3;i++){
      const ag=ctx.createLinearGradient(0,0,0,H*0.6);
      const cols=[['rgba(80,255,180,0.22)','rgba(80,255,180,0)'],['rgba(160,120,255,0.18)','rgba(160,120,255,0)'],['rgba(80,200,255,0.16)','rgba(80,200,255,0)']];
      ag.addColorStop(0,cols[i][0]);ag.addColorStop(1,cols[i][1]);
      ctx.fillStyle=ag;
      ctx.beginPath();
      ctx.moveTo(-50,80+i*40);
      for(let x=0;x<=W+50;x+=20){
        const y=80+i*40+Math.sin(frame*0.012+x*0.008+i)*30;
        ctx.lineTo(x,y);
      }
      ctx.lineTo(W+50,260);ctx.lineTo(-50,260);ctx.closePath();ctx.fill();
    }
    // Stars peeking through
    for(let i=0;i<40;i++){const sx=(i*97+50)%W,sy=(i*73+10)%(H*0.45),blink=Math.sin(frame*0.05+i)*0.4+0.6;ctx.fillStyle=`rgba(220,240,255,${blink*0.7})`;ctx.beginPath();ctx.arc(sx,sy,i%4===0?1.5:0.8,0,Math.PI*2);ctx.fill();}
    // Distant snow mountains (parallax)
    ctx.fillStyle='rgba(40,70,100,0.7)';
    ctx.beginPath();ctx.moveTo(0,H);ctx.lineTo(0,420);ctx.lineTo(120,340);ctx.lineTo(220,400);ctx.lineTo(330,330);ctx.lineTo(450,390);ctx.lineTo(580,310);ctx.lineTo(700,380);ctx.lineTo(820,330);ctx.lineTo(920,390);ctx.lineTo(W,360);ctx.lineTo(W,H);ctx.closePath();ctx.fill();
    // Snow cap highlights
    ctx.fillStyle='rgba(220,240,255,0.5)';
    ctx.beginPath();ctx.moveTo(120,340);ctx.lineTo(140,360);ctx.lineTo(105,365);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(330,330);ctx.lineTo(355,355);ctx.lineTo(310,358);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(580,310);ctx.lineTo(605,335);ctx.lineTo(560,338);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(820,330);ctx.lineTo(840,355);ctx.lineTo(800,355);ctx.closePath();ctx.fill();
    // Heavy snowfall (multiple layers)
    for(let i=0;i<90;i++){
      const sx=(i*197+frame*1.2+Math.sin(frame*0.02+i)*15)%W;
      const sy=(i*113+frame*2.4)%H;
      const sz=i%5===0?3.5:i%2===0?2:1;
      ctx.fillStyle=`rgba(${220+(i%20)},${230+(i%15)},255,${0.6+(i%4)*0.1})`;
      ctx.beginPath();ctx.arc(sx,sy,sz,0,Math.PI*2);ctx.fill();
    }
    // Cold blue mist
    const mist=ctx.createLinearGradient(0,0,0,H);mist.addColorStop(0,'rgba(180,220,255,0.08)');mist.addColorStop(1,'rgba(80,140,200,0.18)');ctx.fillStyle=mist;ctx.fillRect(0,0,W,H);
  } else if(st.id===5){
    // CLOUD TEMPLE — bright sky, big sun rays, layered cumulus, distant temple silhouettes
    // Sun
    const sunG=ctx.createRadialGradient(820,100,15,820,100,260);
    sunG.addColorStop(0,'rgba(255,250,200,0.9)');sunG.addColorStop(0.5,'rgba(255,210,80,0.45)');sunG.addColorStop(1,'rgba(255,170,40,0)');
    ctx.fillStyle=sunG;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#ffeebb';ctx.beginPath();ctx.arc(820,100,30,0,Math.PI*2);ctx.fill();
    // Sun rays (rotating)
    ctx.save();ctx.translate(820,100);ctx.rotate(frame*0.005);
    ctx.strokeStyle='rgba(255,240,150,0.18)';ctx.lineWidth=4;ctx.lineCap='round';
    for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(Math.cos(a)*40,Math.sin(a)*40);ctx.lineTo(Math.cos(a)*180,Math.sin(a)*180);ctx.stroke();}
    ctx.restore();
    // Distant temple silhouettes (parallax very far)
    ctx.fillStyle='rgba(180,160,130,0.4)';
    const farTemples=[[80,180],[240,160],[460,200],[700,170],[920,190]];
    for(const [tx,th] of farTemples){
      ctx.fillRect(tx-15,H-th,30,th);
      ctx.beginPath();ctx.moveTo(tx-22,H-th);ctx.lineTo(tx,H-th-30);ctx.lineTo(tx+22,H-th);ctx.closePath();ctx.fill();
    }
    // Distant column rows
    ctx.fillStyle='rgba(200,180,140,0.35)';
    for(let i=0;i<6;i++)ctx.fillRect(80+i*160,360,16,200);
    // Layered drifting clouds (parallax 3 layers)
    const drawCloud=(x,y,s,alpha)=>{
      ctx.fillStyle=`rgba(255,255,255,${alpha})`;
      ctx.beginPath();ctx.arc(x,y,s*22,0,Math.PI*2);ctx.arc(x+s*28,y-s*8,s*18,0,Math.PI*2);ctx.arc(x+s*55,y,s*22,0,Math.PI*2);ctx.arc(x-s*22,y+s*4,s*16,0,Math.PI*2);ctx.fill();
    };
    // Far layer (slow)
    drawCloud((frame*0.12)%1300-150,80,1.6,0.5);
    drawCloud((frame*0.08+500)%1500-150,160,1.2,0.45);
    drawCloud((frame*0.1+900)%1500-150,60,1.4,0.5);
    // Mid layer (medium)
    drawCloud((frame*0.25)%1400-150,260,1.3,0.65);
    drawCloud((frame*0.18+700)%1600-150,340,1.5,0.6);
    // Close layer (fast, larger)
    drawCloud((frame*0.42)%1500-200,460,1.8,0.85);
    drawCloud((frame*0.38+800)%1700-200,520,2.0,0.8);
    // Floating petals/feathers
    for(let i=0;i<14;i++){
      const px=(i*239+frame*0.45)%W;
      const py=(i*131+frame*0.6)%H;
      const rot=Math.sin(frame*0.04+i)*0.8;
      ctx.save();ctx.translate(px,py);ctx.rotate(rot);
      ctx.fillStyle=`rgba(255,${220-i*4},${180-i*5},0.55)`;
      ctx.beginPath();ctx.ellipse(0,0,5,2.5,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
  } else if(st.id===6){
    // MOLTEN CORE — extreme lava, volcanic eruption, flying lava blobs, fire mist
    // Massive lava glow from below (pulsing)
    const lp=Math.sin(frame*0.06)*0.15+0.65;
    const lavaGlow=ctx.createRadialGradient(W/2,H+40,80,W/2,H+40,580);
    lavaGlow.addColorStop(0,`rgba(255,200,40,${lp})`);
    lavaGlow.addColorStop(0.4,'rgba(255,80,0,0.55)');
    lavaGlow.addColorStop(1,'rgba(180,20,0,0)');
    ctx.fillStyle=lavaGlow;ctx.fillRect(0,0,W,H);
    // Distant volcanic eruption silhouettes
    ctx.fillStyle='rgba(40,8,0,0.92)';
    ctx.beginPath();ctx.moveTo(0,H);ctx.lineTo(0,440);ctx.lineTo(150,360);ctx.lineTo(220,420);ctx.lineTo(380,300);ctx.lineTo(490,420);ctx.lineTo(620,330);ctx.lineTo(780,420);ctx.lineTo(900,370);ctx.lineTo(W,420);ctx.lineTo(W,H);ctx.closePath();ctx.fill();
    // Lava cracks glowing on mountains
    ctx.strokeStyle='rgba(255,140,30,0.7)';ctx.lineWidth=2;ctx.shadowBlur=10;ctx.shadowColor='#ff7700';
    ctx.beginPath();ctx.moveTo(140,400);ctx.lineTo(180,440);ctx.lineTo(150,520);ctx.stroke();
    ctx.beginPath();ctx.moveTo(380,340);ctx.lineTo(420,420);ctx.lineTo(390,520);ctx.stroke();
    ctx.beginPath();ctx.moveTo(620,360);ctx.lineTo(660,440);ctx.lineTo(640,520);ctx.stroke();
    ctx.beginPath();ctx.moveTo(890,400);ctx.lineTo(910,460);ctx.lineTo(880,520);ctx.stroke();
    ctx.shadowBlur=0;
    // Flying lava blobs (arcing trajectories)
    for(let i=0;i<6;i++){
      const t=(frame*1.2+i*120)%240;
      const tn=t/240;
      const startX=[160,420,680,180,460,720][i];
      const lx=startX+tn*60-30;
      const ly=H-100-Math.sin(tn*Math.PI)*200;
      ctx.fillStyle=`rgba(255,${120+tn*100},${20+tn*30},${0.85*(1-Math.abs(tn-0.5)*1.2)})`;
      ctx.shadowBlur=12;ctx.shadowColor='#ff5500';
      ctx.beginPath();ctx.arc(lx,ly,4+tn*3,0,Math.PI*2);ctx.fill();
      // Trail
      for(let k=1;k<5;k++){const tx=startX+(t-k*8)/240*60-30,ty=H-100-Math.sin((t-k*8)/240*Math.PI)*200;ctx.fillStyle=`rgba(255,${120+tn*100},20,${0.4*(1-k/5)})`;ctx.beginPath();ctx.arc(tx,ty,3,0,Math.PI*2);ctx.fill();}
    }
    ctx.shadowBlur=0;
    // Rising ember particles (lots, full screen)
    for(let i=0;i<60;i++){
      const ex=(i*173+frame*1.4)%W;
      const ey=H-((frame*2.2+i*89)%(H+80));
      const ef=Math.max(0,1-ey/H);
      ctx.fillStyle=`rgba(255,${100+ef*150},0,${ef*0.9})`;
      ctx.shadowBlur=4;ctx.shadowColor='#ff6600';
      ctx.beginPath();ctx.arc(ex,ey,1+ef*2.5,0,Math.PI*2);ctx.fill();
    }
    ctx.shadowBlur=0;
    // Heat haze
    const haze=ctx.createLinearGradient(0,H*0.3,0,H);haze.addColorStop(0,'rgba(255,80,0,0)');haze.addColorStop(1,'rgba(255,80,0,0.18)');ctx.fillStyle=haze;ctx.fillRect(0,H*0.3,W,H*0.7);
  } else if(st.id===7){
    // DATA REALM — heavy matrix rain, glowing grid, geometric pulses, glitch artifacts
    ctx.fillStyle='rgba(0,15,0,0.5)';ctx.fillRect(0,0,W,H);
    // Vertical matrix code rain (denser, layered)
    ctx.font='bold 12px monospace';
    for(let col=0;col<35;col++){
      const cx=col*30+5;
      const offset=(col*47)%200;
      for(let r=0;r<28;r++){
        const ry=((frame*1.5+r*22+offset)%(H+200))-50;
        if(ry<-20||ry>H+10) continue;
        const head=r===0;
        const fade=head?1:Math.max(0,1-r*0.06);
        const ch=Math.floor((frame*0.1+col*7+r*3))%10;
        ctx.fillStyle=head?`rgba(180,255,200,${fade})`:`rgba(0,${180+r*2},${50+r*3},${fade*0.85})`;
        if(head){ctx.shadowBlur=8;ctx.shadowColor='#88ff99';}
        ctx.fillText(ch,cx,ry);
        if(head)ctx.shadowBlur=0;
      }
    }
    // 3D-perspective glowing grid (floor/ceiling)
    ctx.strokeStyle='rgba(0,255,80,0.4)';ctx.lineWidth=1.5;
    // Horizontal lines (perspective)
    for(let i=0;i<10;i++){
      const t=i/10;
      const py=H-30-t*200;
      const sx=W/2*(1-t*0.7), ex=W-W/2*(1-t*0.7);
      ctx.globalAlpha=0.6-t*0.5;
      ctx.beginPath();ctx.moveTo(sx,py);ctx.lineTo(ex,py);ctx.stroke();
    }
    // Vertical perspective lines
    for(let i=-7;i<=7;i++){
      ctx.globalAlpha=0.4;
      ctx.beginPath();ctx.moveTo(W/2+i*60,H-30);ctx.lineTo(W/2+i*18,H-200);ctx.stroke();
    }
    ctx.globalAlpha=1;
    // Top mirror grid
    for(let i=0;i<8;i++){
      const t=i/8;
      const py=20+t*150;
      const sx=W/2*(1-t*0.7), ex=W-W/2*(1-t*0.7);
      ctx.strokeStyle=`rgba(0,255,80,${0.3-t*0.3})`;
      ctx.beginPath();ctx.moveTo(sx,py);ctx.lineTo(ex,py);ctx.stroke();
    }
    // Floating geometric wireframes (rotating)
    for(let i=0;i<5;i++){
      const cx=200+i*150,cy=180+Math.sin(frame*0.02+i)*40;
      const r=20+Math.sin(frame*0.04+i*1.3)*5;
      const rot=frame*0.03+i;
      ctx.strokeStyle=`rgba(0,255,150,${0.4+Math.sin(frame*0.05+i)*0.2})`;ctx.lineWidth=1.5;
      ctx.shadowBlur=8;ctx.shadowColor='#00ff88';
      ctx.beginPath();
      for(let k=0;k<6;k++){
        const a=rot+k*Math.PI/3;
        const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;
        if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.closePath();ctx.stroke();
      ctx.shadowBlur=0;
    }
    // Glitch bars (random horizontal slices)
    if(Math.floor(frame/3)%30===0){
      const gy=Math.floor(Math.random()*H);
      ctx.fillStyle='rgba(0,255,150,0.15)';
      ctx.fillRect(0,gy,W,4+Math.random()*8);
    }
    // Top horizon glow
    const dg=ctx.createLinearGradient(0,0,0,200);dg.addColorStop(0,'rgba(0,255,100,0.18)');dg.addColorStop(1,'rgba(0,255,100,0)');ctx.fillStyle=dg;ctx.fillRect(0,0,W,200);
  } else if(st.id===8){
    // THE CARNIVAL — dazzling night sky, fireworks, big ferris wheel silhouette, festive lights
    // Stars
    for(let i=0;i<110;i++){const sx=(i*197+30)%W,sy=(i*113+20)%H,blink=Math.sin(frame*0.05+i)*0.4+0.6;ctx.fillStyle=`rgba(255,255,255,${blink*0.85})`;ctx.beginPath();ctx.arc(sx,sy,i%5===0?2:1,0,Math.PI*2);ctx.fill();}
    // Big background ferris wheel silhouette (purely decorative now)
    const wcx=500,wcy=320,wr=200;
    const wAng=frame*0.004;
    ctx.strokeStyle='rgba(80,40,120,0.6)';ctx.lineWidth=4;
    ctx.beginPath();ctx.arc(wcx,wcy,wr,0,Math.PI*2);ctx.stroke();
    ctx.lineWidth=2;
    for(let i=0;i<12;i++){const a=wAng+i*Math.PI/6;ctx.beginPath();ctx.moveTo(wcx,wcy);ctx.lineTo(wcx+Math.cos(a)*wr,wcy+Math.sin(a)*wr);ctx.stroke();}
    // Lights on the wheel rim
    const bulbCols=['#ff3355','#ffdd00','#33ffaa','#3399ff','#ff88ff','#ffaa33'];
    for(let i=0;i<24;i++){
      const a=wAng+i*Math.PI/12;
      const bx=wcx+Math.cos(a)*wr,by=wcy+Math.sin(a)*wr;
      const blink=Math.sin(frame*0.1+i*0.5)>-0.3;
      if(blink){
        const c=bulbCols[i%6];
        ctx.fillStyle=c;ctx.shadowBlur=10;ctx.shadowColor=c;
        ctx.beginPath();ctx.arc(bx,by,3,0,Math.PI*2);ctx.fill();
      }
    }
    ctx.shadowBlur=0;
    // Ferris wheel hub
    ctx.fillStyle='#ffdd00';ctx.shadowBlur=14;ctx.shadowColor='#ffdd00';
    ctx.beginPath();ctx.arc(wcx,wcy,8,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
    // Distant tent silhouettes
    ctx.fillStyle='rgba(30,8,55,0.8)';
    ctx.beginPath();ctx.moveTo(0,H);ctx.lineTo(0,500);ctx.lineTo(60,440);ctx.lineTo(120,500);ctx.lineTo(120,H);ctx.fill();
    ctx.beginPath();ctx.moveTo(880,H);ctx.lineTo(880,500);ctx.lineTo(940,440);ctx.lineTo(1000,500);ctx.lineTo(1000,H);ctx.fill();
    // Fireworks (occasionally launch and explode)
    const fwCycle=(frame%180);
    if(fwCycle<60){
      const launchX=200+(Math.floor(frame/180)*173)%600;
      const launchY=H-fwCycle*7;
      ctx.fillStyle='#ffdd44';ctx.shadowBlur=8;ctx.shadowColor='#ffdd44';
      ctx.beginPath();ctx.arc(launchX,launchY,2,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
    } else if(fwCycle<150){
      const ex=200+(Math.floor(frame/180)*173)%600;
      const ey=H-60*7;
      const explodeT=(fwCycle-60)/90;
      const er=explodeT*120;
      const cols=['#ff3355','#ffdd00','#33ffaa','#3399ff','#ff88ff','#ffaa33'];
      const fwc=cols[Math.floor(frame/180)%6];
      ctx.strokeStyle=fwc;ctx.lineWidth=2;ctx.shadowBlur=12;ctx.shadowColor=fwc;
      for(let k=0;k<24;k++){
        const a=k*Math.PI/12;
        const px2=ex+Math.cos(a)*er;
        const py2=ey+Math.sin(a)*er;
        ctx.globalAlpha=Math.max(0,1-explodeT*1.4);
        ctx.beginPath();ctx.arc(px2,py2,2,0,Math.PI*2);ctx.stroke();
      }
      ctx.globalAlpha=1;ctx.shadowBlur=0;
    }
    // Festive light strings (top of screen, swaying)
    ctx.strokeStyle='rgba(120,80,40,0.5)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(0,40);
    for(let x=0;x<=W;x+=20){const dy=40+Math.sin(x*0.04+frame*0.02)*8;ctx.lineTo(x,dy);}
    ctx.stroke();
    const lcols=['#ff3355','#ffdd00','#33ffaa','#3399ff','#ff88ff'];
    for(let i=0;i<28;i++){const lx=15+i*36,ly=44+Math.sin(lx*0.04+frame*0.02)*8,blink=Math.sin(frame*0.12+i*1.1)>-0.3;if(blink){ctx.fillStyle=lcols[i%5];ctx.shadowBlur=10;ctx.shadowColor=lcols[i%5];ctx.beginPath();ctx.arc(lx,ly,3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}}
  } else if(st.id===9){
    // THE JUNGLE — dense canopy, parallax trees, vines, fireflies, sun rays piercing leaves
    // Top canopy darkness
    const canopy=ctx.createLinearGradient(0,0,0,300);canopy.addColorStop(0,'rgba(2,12,1,0.92)');canopy.addColorStop(1,'rgba(2,12,1,0)');ctx.fillStyle=canopy;ctx.fillRect(0,0,W,300);
    // Sun rays through canopy (god rays)
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(let i=0;i<6;i++){
      const sx=80+i*180+Math.sin(frame*0.012+i)*6;
      const rg=ctx.createLinearGradient(sx,0,sx-60,H);
      rg.addColorStop(0,'rgba(180,255,120,0.16)');
      rg.addColorStop(1,'rgba(180,255,120,0)');
      ctx.fillStyle=rg;
      ctx.beginPath();ctx.moveTo(sx-15,0);ctx.lineTo(sx+15,0);ctx.lineTo(sx-30,H);ctx.lineTo(sx-60,H);ctx.closePath();ctx.fill();
    }
    ctx.restore();
    // Far parallax tree silhouettes (very dark)
    ctx.fillStyle='rgba(3,15,2,0.95)';
    const farT=[[20,H],[120,H],[230,H],[340,H],[480,H],[600,H],[720,H],[840,H],[940,H]];
    const farHeights=[400,330,420,350,440,360,400,340,420];
    for(let i=0;i<farT.length;i++){
      const [tx,ty]=farT[i],th=farHeights[i],tw=50+i*3;
      ctx.fillRect(tx-tw/2,ty-th,tw,th);
      ctx.beginPath();ctx.ellipse(tx,ty-th,tw*0.95,60,0,0,Math.PI*2);ctx.fill();
    }
    // Mid parallax trees with subtle highlight
    ctx.fillStyle='rgba(8,30,5,0.85)';
    const midT=[[60,H,260,40],[280,H,300,46],[520,H,280,42],[760,H,320,44],[960,H,260,38]];
    for(const [tx,ty,th,tw] of midT){
      ctx.fillRect(tx-tw/2,ty-th,tw,th);
      ctx.beginPath();ctx.ellipse(tx,ty-th,tw*0.9,55,0,0,Math.PI*2);ctx.fill();
    }
    // Hanging vines from top (longer, more)
    ctx.strokeStyle='rgba(20,80,12,0.6)';ctx.lineWidth=2;ctx.lineCap='round';
    for(let i=0;i<14;i++){
      const vx=40+i*72,vlen=120+(i%5)*60;
      const sw=Math.sin(frame*0.018+i*0.9)*12;
      ctx.beginPath();ctx.moveTo(vx,0);ctx.bezierCurveTo(vx+sw*0.3,vlen*0.4,vx+sw,vlen*0.75,vx+sw*1.4,vlen);ctx.stroke();
    }
    // Floating leaves (drifting)
    for(let i=0;i<22;i++){
      const lx=(i*241+frame*0.55)%W;
      const ly=(i*131+frame*1.3)%H;
      const rot=Math.sin(frame*0.04+i)*0.7;
      ctx.save();ctx.translate(lx,ly);ctx.rotate(rot);
      ctx.fillStyle=`rgba(${30+i*7},${100+i*5},${10+i*2},0.55)`;
      ctx.beginPath();ctx.ellipse(0,0,6,3,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
    // Fireflies (bright, glowing, lots)
    for(let i=0;i<35;i++){
      const fx=(i*191+frame*0.5+Math.sin(frame*0.03+i)*20)%W;
      const fy=100+(i*97+frame*0.3)%(H-150);
      const pulse=Math.sin(frame*0.09+i*2.1)*0.5+0.5;
      ctx.fillStyle=`rgba(180,255,80,${pulse*0.85})`;
      ctx.shadowBlur=10;ctx.shadowColor='#aaff44';
      ctx.beginPath();ctx.arc(fx,fy,1.8,0,Math.PI*2);ctx.fill();
    }
    ctx.shadowBlur=0;
    // Bottom mist/fog
    const mist=ctx.createLinearGradient(0,H*0.6,0,H);mist.addColorStop(0,'rgba(15,50,8,0)');mist.addColorStop(1,'rgba(20,55,10,0.5)');ctx.fillStyle=mist;ctx.fillRect(0,H*0.6,W,H*0.4);
  } else if(st.id===10){
    // SKY TEMPLE — vast night sky, big moon, drifting clouds far below, distant temples
    // Dense starfield with depth
    for(let i=0;i<140;i++){const sx=(i*197+55)%W,sy=(i*89+15)%(H*0.95),blink=Math.sin(frame*0.045+i)*0.4+0.6;ctx.fillStyle=`rgba(255,255,255,${blink*0.9})`;ctx.beginPath();ctx.arc(sx,sy,i%5===0?2.5:i%2===0?1.5:0.8,0,Math.PI*2);ctx.fill();}
    // Shooting stars (occasional)
    for(let i=0;i<3;i++){
      const t=(frame*1.5+i*200)%600;
      if(t<60){
        const sx=W*0.2+i*200+t*8;
        const sy=80+i*40+t*4;
        ctx.strokeStyle=`rgba(255,255,255,${1-t/60})`;ctx.lineWidth=2;ctx.shadowBlur=8;ctx.shadowColor='#ffffff';
        ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx-30,sy-15);ctx.stroke();
        ctx.shadowBlur=0;
      }
    }
    // Big moon (much larger, more detail)
    const moonG=ctx.createRadialGradient(820,110,15,820,110,200);
    moonG.addColorStop(0,'rgba(255,248,210,0.55)');moonG.addColorStop(1,'rgba(255,248,210,0)');
    ctx.fillStyle=moonG;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#f5ecd0';ctx.beginPath();ctx.arc(820,110,48,0,Math.PI*2);ctx.fill();
    // Moon craters
    ctx.fillStyle='rgba(180,170,140,0.5)';
    [[805,95,7],[835,118,5],[815,128,4],[795,115,3],[838,98,4]].forEach(([cx,cy,cr])=>{ctx.beginPath();ctx.arc(cx,cy,cr,0,Math.PI*2);ctx.fill();});
    // Distant floating temple silhouettes (larger, more dramatic)
    ctx.fillStyle='rgba(8,6,22,0.88)';
    const temples=[[100,460,50,180],[200,420,40,140],[760,440,52,160],[880,470,48,180]];
    for(const [tx,ty,tw,th] of temples){
      ctx.fillRect(tx-tw/2,ty,tw,th);
      // Pyramid top
      ctx.beginPath();ctx.moveTo(tx-tw/2-4,ty);ctx.lineTo(tx,ty-44);ctx.lineTo(tx+tw/2+4,ty);ctx.closePath();ctx.fill();
      // Glowing windows
      ctx.fillStyle=`rgba(255,170,40,${0.4+Math.sin(frame*0.05+tx)*0.2})`;
      ctx.fillRect(tx-6,ty+30,12,8);ctx.fillRect(tx-6,ty+60,12,8);ctx.fillRect(tx-6,ty+90,12,8);
      ctx.fillStyle='rgba(8,6,22,0.88)';
    }
    // Floating cloud bands at multiple heights (parallax)
    const dC=(x,y,s,alpha)=>{ctx.fillStyle=`rgba(180,210,248,${alpha})`;ctx.beginPath();ctx.arc(x,y,s*22,0,Math.PI*2);ctx.arc(x+s*28,y-s*8,s*16,0,Math.PI*2);ctx.arc(x+s*52,y,s*20,0,Math.PI*2);ctx.fill();};
    dC((frame*0.18)%1300-150,300,1.4,0.18);
    dC((frame*0.13+500)%1500-150,360,1.2,0.16);
    dC((frame*0.22+900)%1500-150,420,1.5,0.2);
    dC((frame*0.3)%1400-200,520,1.7,0.25);
    dC((frame*0.25+700)%1500-150,580,1.4,0.22);
    // Bottom abyss
    const abyss=ctx.createLinearGradient(0,H*0.8,0,H);abyss.addColorStop(0,'rgba(4,4,16,0)');abyss.addColorStop(1,'rgba(4,4,16,0.78)');ctx.fillStyle=abyss;ctx.fillRect(0,H*0.8,W,H*0.2);
  } else if(st.id===11){
    // NEO CITY — heavy rain, parallax skyscrapers, holograms, flying vehicles, neon glow
    // Stars / distant lights
    for(let i=0;i<70;i++){const sx=(i*197+40)%W,sy=(i*89+10)%(H*0.45),blink=Math.sin(frame*0.04+i)*0.3+0.7;ctx.fillStyle=`rgba(200,240,255,${blink*0.7})`;ctx.beginPath();ctx.arc(sx,sy,i%5===0?1.5:0.8,0,Math.PI*2);ctx.fill();}
    // Rain (multiple speeds for depth)
    ctx.strokeStyle='rgba(0,200,255,0.18)';ctx.lineWidth=1;
    for(let i=0;i<70;i++){const rx=(i*233+frame*4)%W,ry=(i*97+frame*5)%H;ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-4,ry+22);ctx.stroke();}
    ctx.strokeStyle='rgba(0,180,230,0.1)';
    for(let i=0;i<40;i++){const rx=(i*333+frame*2.5)%W,ry=(i*123+frame*3)%H;ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-3,ry+15);ctx.stroke();}
    // Far parallax skyscrapers (distant haze)
    ctx.fillStyle='rgba(2,14,20,0.92)';
    const farB=[{x:0,w:60,h:340},{x:55,w:44,h:280},{x:150,w:70,h:360},{x:215,w:50,h:300},{x:310,w:80,h:400},{x:385,w:55,h:320},{x:480,w:65,h:440},{x:540,w:48,h:310},{x:620,w:72,h:370},{x:686,w:52,h:290},{x:770,w:76,h:410},{x:840,w:54,h:335},{x:888,w:68,h:360},{x:950,w:50,h:290}];
    for(const b of farB){ctx.fillRect(b.x,H-b.h,b.w,b.h);}
    // Neon trim on tallest far buildings
    const tallest=farB.filter(b=>b.h>380);
    for(let i=0;i<tallest.length;i++){
      const b=tallest[i],col=['#00e5ff','#ff00cc','#aa44ff'][i%3];
      ctx.fillStyle=col;ctx.shadowBlur=10;ctx.shadowColor=col;
      ctx.fillRect(b.x,H-b.h,b.w,2);
      ctx.shadowBlur=0;
    }
    // Mid-layer skyscrapers (closer, with neon trim)
    ctx.fillStyle='rgba(6,18,28,0.95)';
    const midB=[{x:60,w:80,h:480,col:'#00e5ff'},{x:280,w:90,h:520,col:'#ff00cc'},{x:480,w:100,h:550,col:'#00ff99'},{x:680,w:88,h:500,col:'#aa44ff'},{x:880,w:82,h:460,col:'#ff6600'}];
    for(const b of midB){
      ctx.fillRect(b.x,H-b.h,b.w,b.h);
      // Vertical seam
      ctx.fillStyle='rgba(0,0,0,0.4)';ctx.fillRect(b.x+b.w/2-1,H-b.h,2,b.h);
      // Neon rooftop trim
      ctx.fillStyle=b.col;ctx.shadowBlur=14;ctx.shadowColor=b.col;
      ctx.fillRect(b.x,H-b.h,b.w,3);
      // Antenna
      ctx.fillStyle='#1a3a4a';ctx.fillRect(b.x+b.w/2-2,H-b.h-30,4,30);
      ctx.fillStyle=b.col;
      ctx.beginPath();ctx.arc(b.x+b.w/2,H-b.h-32,3,0,Math.PI*2);ctx.fill();
      // Vertical neon strips on sides
      ctx.fillRect(b.x,H-b.h+30,3,b.h-60);
      ctx.fillRect(b.x+b.w-3,H-b.h+30,3,b.h-60);
      ctx.shadowBlur=0;ctx.fillStyle='rgba(6,18,28,0.95)';
    }
    // Window grid lights (mid buildings)
    for(let i=0;i<70;i++){
      const blink=Math.sin(frame*0.05+i*1.3)>0;if(!blink)continue;
      const wx=20+(i*23)%960,wy=80+(i*37)%500;
      ctx.fillStyle='rgba(0,200,255,0.4)';ctx.fillRect(wx,wy,4,3);
    }
    // Holographic billboards (floating mid-air, scrolling)
    for(let i=0;i<2;i++){
      const hx=((frame*0.6+i*600)%(W+200))-100;
      const hy=160+i*120;
      const cols=['#ff00cc','#00e5ff'];
      ctx.fillStyle=`rgba(${i===0?255:0},${i===0?0:229},${i===0?204:255},0.18)`;
      ctx.fillRect(hx,hy,90,50);
      ctx.strokeStyle=cols[i];ctx.lineWidth=1.5;ctx.shadowBlur=10;ctx.shadowColor=cols[i];
      ctx.strokeRect(hx,hy,90,50);
      ctx.shadowBlur=0;
    }
    // Flying vehicles with light trails
    for(let i=0;i<3;i++){
      const speeds=[1.8,1.2,2.4];
      const dirs=[1,-1,1];
      const ys=[110,85,180];
      const cols=['#ffe060','#ff64c8','#60ffe0'];
      const vx=dirs[i]>0?(frame*speeds[i])%1200-100:1100-(frame*speeds[i])%1200;
      // Light trail
      for(let k=1;k<5;k++){
        ctx.fillStyle=`rgba(${i===0?255:(i===1?255:96)},${i===0?224:(i===1?100:255)},${i===0?96:(i===1?200:224)},${0.5-k*0.1})`;
        ctx.beginPath();ctx.arc(vx-dirs[i]*k*5,ys[i],2-k*0.3,0,Math.PI*2);ctx.fill();
      }
      ctx.fillStyle=cols[i];ctx.shadowBlur=10;ctx.shadowColor=cols[i];
      ctx.beginPath();ctx.arc(vx,ys[i],2.5,0,Math.PI*2);ctx.fill();
    }
    ctx.shadowBlur=0;
    // Bottom neon ground glow
    const groundGlow=ctx.createLinearGradient(0,400,0,H);groundGlow.addColorStop(0,'rgba(0,229,255,0)');groundGlow.addColorStop(1,'rgba(0,229,255,0.22)');ctx.fillStyle=groundGlow;ctx.fillRect(0,400,W,H-400);
  }
}
function drawFerrisWheel(angle){
  const cx=500,cy=310,r=150;
  // Support legs from wheel base to ground
  ctx.strokeStyle='#334455';ctx.lineWidth=9;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(cx-8,cy+r);ctx.lineTo(cx-75,510);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx+8,cy+r);ctx.lineTo(cx+75,510);ctx.stroke();
  // Cross-brace
  ctx.lineWidth=5;
  ctx.beginPath();ctx.moveTo(cx-55,490);ctx.lineTo(cx+55,490);ctx.stroke();
  // Outer rim
  ctx.strokeStyle='#8899aa';ctx.lineWidth=7;
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
  // Inner rim ring
  ctx.strokeStyle='#667788';ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(cx,cy,r*0.55,0,Math.PI*2);ctx.stroke();
  // Spokes — one per platform, and cross-spokes for structure
  ctx.strokeStyle='#556677';ctx.lineWidth=2.5;
  for(let i=0;i<6;i++){
    const a=angle+(i/6)*Math.PI*2;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);ctx.stroke();
    // Inner spoke segment
    ctx.strokeStyle='#445566';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r*0.55,cy+Math.sin(a)*r*0.55);ctx.lineTo(cx+Math.cos(a+Math.PI/6)*r*0.55,cy+Math.sin(a+Math.PI/6)*r*0.55);ctx.stroke();
    ctx.strokeStyle='#556677';ctx.lineWidth=2.5;
  }
  // Glowing hub
  const hubG=ctx.createRadialGradient(cx,cy,2,cx,cy,14);hubG.addColorStop(0,'#ffffff');hubG.addColorStop(0.4,'#ffee44');hubG.addColorStop(1,'#cc9900');
  ctx.fillStyle=hubG;ctx.shadowBlur=18;ctx.shadowColor='#ffdd00';
  ctx.beginPath();ctx.arc(cx,cy,14,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
  ctx.strokeStyle='#886600';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,14,0,Math.PI*2);ctx.stroke();
  // Small light bulbs at each rim attachment point
  const bulbCols=['#ff3355','#ffdd00','#33ffaa','#3399ff','#ff88ff','#ffaa33'];
  for(let i=0;i<6;i++){
    const a=angle+(i/6)*Math.PI*2,bx=cx+Math.cos(a)*r,by=cy+Math.sin(a)*r;
    ctx.fillStyle=bulbCols[i];ctx.shadowBlur=12;ctx.shadowColor=bulbCols[i];
    ctx.beginPath();ctx.arc(bx,by,5,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
  }
}
function drawJungleTrees(){
  // Floating jungle: distant tree silhouettes at the edges to frame the action,
  // plus moss/vines hanging from the floating canopies (set in stage grounds[]).
  // Two distant background trees on each edge — partial silhouettes.
  const edgeTrees=[{cx:30,top:80,bot:600,tw:34,cw:55},{cx:970,top:60,bot:600,tw:36,cw:60}];
  for(const t of edgeTrees){
    ctx.fillStyle='rgba(8,28,5,0.85)';
    ctx.fillRect(t.cx-t.tw/2,t.top,t.tw,t.bot-t.top);
    ctx.fillStyle='rgba(6,40,4,0.9)';
    ctx.beginPath();ctx.ellipse(t.cx,t.top+10,t.cw,42,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(12,58,8,0.7)';
    ctx.beginPath();ctx.ellipse(t.cx,t.top-18,t.cw*0.75,32,0,0,Math.PI*2);ctx.fill();
  }
  // Hanging moss/vines off the bottom of the floating canopies (grounds in jungle stage)
  ctx.strokeStyle='rgba(28,90,18,0.6)';ctx.lineWidth=2;ctx.lineCap='round';
  const canopySpots=[{x:90,y:500},{x:170,y:500},{x:790,y:500},{x:870,y:500}];
  for(let i=0;i<canopySpots.length;i++){
    const s=canopySpots[i];
    const sw=Math.sin(frame*0.018+i*0.9)*6;
    const len=44+i%2*16;
    ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.bezierCurveTo(s.x+sw*0.3,s.y+len*0.4,s.x+sw,s.y+len*0.75,s.x+sw*1.4,s.y+len);ctx.stroke();
  }
}
function drawNeoBuildings(grounds){
  // Building accent colors cycling per tower
  const neonCols=['#00e5ff','#ff00cc','#00ff99','#ff6600','#aa44ff'];
  for(let i=0;i<grounds.length;i++){
    const b=grounds[i],nc=neonCols[i%neonCols.length];
    const bx=b.x, by=b.y+b.h, bw=b.w, bh=600-by; // body from rooftop base to bottom
    // Main building body — dark steel
    ctx.fillStyle='#0a1e28';ctx.fillRect(bx,by,bw,bh);
    // Subtle vertical panel seam down center
    ctx.fillStyle='rgba(0,0,0,0.35)';ctx.fillRect(bx+bw/2-2,by,4,bh);
    // Window grid — 3 columns, rows every 18px
    const cols=3,colW=bw/cols;
    for(let row=0;by+12+row*18<600;row++){
      for(let col=0;col<cols;col++){
        const wx=bx+col*colW+colW*0.2, wy=by+10+row*18;
        const lit=Math.sin(frame*0.03+i*1.3+row*0.7+col*2.1)>0.1;
        if(lit){ctx.fillStyle=`rgba(0,200,255,0.35)`;ctx.fillRect(wx,wy,colW*0.55,9);}
      }
    }
    // Neon rooftop trim — glowing bar along the roof edge
    ctx.fillStyle=nc;ctx.shadowBlur=14;ctx.shadowColor=nc;
    ctx.fillRect(bx,b.y+b.h-3,bw,3);
    ctx.shadowBlur=0;
    // Corner antenna / spire on tallest buildings
    if(b.y<220){
      ctx.fillStyle='#1a3a4a';ctx.fillRect(bx+bw/2-3,b.y-35,6,35);
      ctx.fillStyle=nc;ctx.shadowBlur=12;ctx.shadowColor=nc;
      ctx.beginPath();ctx.arc(bx+bw/2,b.y-36,4,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
    }
  }
}
function drawStageGeom(st){
  const g=st.ground;rrFill(g.x,g.y,g.w,g.h,6,st.gCol);rrFill(g.x,g.y,g.w,8,4,st.gTop);rrStroke(g.x,g.y,g.w,g.h,6,st.gEdge,1.5);
  if(st.ferrisWheel) drawFerrisWheel(carnivalAngle);
  if(st.jungle) drawJungleTrees();
  if(st.neocity) drawNeoBuildings(st.grounds);
  for(const pl of st.plats){rrFill(pl.x,pl.y,pl.w,pl.h,5,st.pCol);rrFill(pl.x,pl.y,pl.w,6,3,st.pTop);rrStroke(pl.x,pl.y,pl.w,pl.h,5,st.gEdge,1.5);}
  for(const sg of (st.grounds||[])){rrFill(sg.x,sg.y,sg.w,sg.h,6,st.gCol);rrFill(sg.x,sg.y,sg.w,8,4,st.gTop);rrStroke(sg.x,sg.y,sg.w,sg.h,6,st.gEdge,1.5);}
}
function drawGear(x,y,r,c1,c2){
  const teeth=8,ang=frame*0.012;ctx.save();ctx.translate(x,y);ctx.rotate(ang);
  ctx.fillStyle=c1;ctx.beginPath();for(let i=0;i<teeth*2;i++){const a=(i/(teeth*2))*Math.PI*2,rad=i%2===0?r:r*0.68;i===0?ctx.moveTo(Math.cos(a)*rad,Math.sin(a)*rad):ctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);}ctx.closePath();ctx.fill();
  ctx.fillStyle=c2;ctx.beginPath();ctx.arc(0,0,r*0.38,0,Math.PI*2);ctx.fill();ctx.restore();
}

// ---- Game State ----
let carnivalAngle=0; // tracks ferris wheel rotation for THE CARNIVAL stage
// ---- Audio ----
// Persistent lobby music element — created once, never destroyed so browser permission is retained
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

let gameState='modeSelect';
let selectStep=0,p1Sel=0,p2Sel=1,p3Sel=2,p4Sel=3,stageSel=0,p1Confirmed=false;
let team4Done=[false,false,false,false]; // per-player confirm flags in team4 char select
let charScrollY=0;
let stageScrollY=0;
let curStage=null,players=[],winner='',gameOverTimer=0;

// ---- Menu Input ----
function menuModeKey(code){
  const modeCount=3;
  if(code==='KeyW'||code==='ArrowUp')modeSelIdx=(modeSelIdx+modeCount-1)%modeCount;
  if(code==='KeyS'||code==='ArrowDown')modeSelIdx=(modeSelIdx+1)%modeCount;
  if(code==='Space'||code==='Enter'||code==='NumpadEnter'){code=['KeyL','Key4','KeyT'][modeSelIdx];}
  if(code==='KeyL'){networkMode='none';gameState='charSelect';selectStep=0;p1Confirmed=false;charScrollY=0;}
  if(code==='Key4'){networkMode='team4';gameState='charSelect';selectStep=0;p1Confirmed=false;charScrollY=0;}
  if(code==='KeyT'){networkMode='test';gameState='charSelect';selectStep=0;p1Confirmed=false;charScrollY=0;}
}
function menuCharKey(code){
  const rowH=230+12,maxSc=Math.max(0,(Math.ceil(CHARS.length/3)-2)*rowH);
  // Helper to scroll a given selection index into view
  const autoScroll=sel=>{const r=Math.floor(sel/3)*rowH;if(r<charScrollY)charScrollY=r;if(r+230>charScrollY+472)charScrollY=r+230-472;};
  // 4-player team mode: each phone navigates and confirms independently
  if(networkMode==='team4'&&code&&typeof code==='object'){
    const {pi,dir}=code;
    const getters=[()=>p1Sel,()=>p2Sel,()=>p3Sel,()=>p4Sel];
    const setters=[v=>p1Sel=v,v=>p2Sel=v,v=>p3Sel=v,v=>p4Sel=v];
    const totalSlots=CHARS.length+1;
    if(team4Done[pi])return; // already locked in
    if(dir==='left'){setters[pi]((getters[pi]()+totalSlots-1)%totalSlots);autoScroll(getters[pi]());}
    if(dir==='right'){setters[pi]((getters[pi]()+1)%totalSlots);autoScroll(getters[pi]());}
    if(dir==='confirm'){
      if(getters[pi]()===CHARS.length)setters[pi](Math.floor(Math.random()*CHARS.length));
      team4Done[pi]=true;
      if(team4Done.every(v=>v))gameState='stageSelect';
    }
    return;
  }
  // 1v1 local / test
  const totalSlots=CHARS.length+1; // +1 for the RANDOM card at the end
  if(selectStep===0){
    if(code==='KeyA')p1Sel=(p1Sel+totalSlots-1)%totalSlots;
    if(code==='KeyD')p1Sel=(p1Sel+1)%totalSlots;
    if(code==='KeyW')charScrollY=Math.max(0,charScrollY-rowH);
    if(code==='KeyS')charScrollY=Math.min(maxSc,charScrollY+rowH);
    autoScroll(p1Sel);
    if(code==='Space'||code==='Enter'||code==='NumpadEnter'){
      if(p1Sel===CHARS.length)p1Sel=Math.floor(Math.random()*CHARS.length);
      if(networkMode==='test'){gameState='stageSelect';return;}
      p1Confirmed=true;selectStep=1;
    }
  } else {
    if(code==='ArrowLeft')p2Sel=(p2Sel+totalSlots-1)%totalSlots;
    if(code==='ArrowRight')p2Sel=(p2Sel+1)%totalSlots;
    if(code==='ArrowUp')charScrollY=Math.max(0,charScrollY-rowH);
    if(code==='ArrowDown')charScrollY=Math.min(maxSc,charScrollY+rowH);
    autoScroll(p2Sel);
    if(code==='Enter'||code==='NumpadEnter'){
      if(p2Sel===CHARS.length)p2Sel=Math.floor(Math.random()*CHARS.length);
      gameState='stageSelect';
    }
  }
}
function menuStageKey(code){
  const stTotal=STAGES.length+1; // +1 for RANDOM card
  const cols=4,rowH=172+12;
  const clipTop=74,clipBot=H-28,visH=clipBot-clipTop;
  const maxSc=Math.max(0,(Math.ceil(stTotal/cols)-Math.floor(visH/rowH))*rowH);
  const autoScroll=sel=>{const r=Math.floor(sel/cols)*rowH;if(r<stageScrollY)stageScrollY=r;if(r+rowH>stageScrollY+visH)stageScrollY=Math.min(maxSc,r+rowH-visH);};
  if(code==='KeyA'||code==='ArrowLeft'){stageSel=(stageSel+stTotal-1)%stTotal;autoScroll(stageSel);}
  if(code==='KeyD'||code==='ArrowRight'){stageSel=(stageSel+1)%stTotal;autoScroll(stageSel);}
  if(code==='KeyW'||code==='ArrowUp'){stageScrollY=Math.max(0,stageScrollY-rowH);const newRow=Math.floor(stageScrollY/rowH);if(Math.floor(stageSel/cols)>newRow+Math.floor(visH/rowH)-1)stageSel=Math.min(stTotal-1,Math.floor(stageSel/cols-1)*cols+(stageSel%cols));}
  if(code==='KeyS'||code==='ArrowDown'){stageScrollY=Math.min(maxSc,stageScrollY+rowH);const newRow=Math.floor(stageScrollY/rowH);if(Math.floor(stageSel/cols)<newRow)stageSel=Math.min(stTotal-1,(Math.floor(stageSel/cols)+1)*cols+(stageSel%cols));}
  if(code==='Space'||code==='Enter'||code==='NumpadEnter'){
    if(stageSel===STAGES.length)stageSel=Math.floor(Math.random()*STAGES.length);
    startGame();
  }
}

// ---- Screens ----
function drawModeSelect(){
  const gr=ctx.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#080818');gr.addColorStop(1,'#000000');ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
  ctx.textAlign='center';ctx.font='bold 52px monospace';ctx.fillStyle='#ffffff';ctx.fillText('ROBOT RIVALS',W/2,80);
  ctx.font='15px monospace';ctx.fillStyle='#444';ctx.fillText('A Platform Fighter',W/2,102);
  const options=[
    {key:'L',label:'Local 1v1',sub:'Both players on this computer',col:'#44aaff'},
    {key:'4',label:'Local 4P Teams',sub:'4 phones — P1&P3 vs P2&P4',col:'#ffaa00'},
    {key:'T',label:'Test Mode',sub:'Practice against a stationary dummy',col:'#88cc33'},
  ];
  const bw=260,bh=66,sx=W/2-bw/2;
  options.forEach((o,i)=>{
    const bx=sx,by=130+i*74,sel=i===modeSelIdx;
    rrFill(bx,by,bw,bh,8,sel?'rgba(40,40,80,0.95)':'rgba(20,20,40,0.9)');rrStroke(bx,by,bw,bh,8,o.col,sel?3:2);
    if(sel){ctx.fillStyle=o.col;ctx.font='bold 20px monospace';ctx.textAlign='left';ctx.fillText('\u25B6',bx-22,by+30);}
    ctx.fillStyle=o.col;ctx.font='bold 17px monospace';ctx.textAlign='left';ctx.fillText(`[${o.key}] ${o.label}`,bx+12,by+25);
    ctx.fillStyle='#555';ctx.font='10px monospace';ctx.fillText(o.sub,bx+12,by+50);
  });
  ctx.textAlign='center';ctx.fillStyle='#2a2a2a';ctx.font='11px monospace';
  ctx.fillText('P1: WASD move | LClick light | RClick heavy | Q shield | LShift dash | E grab',W/2,H-14);
}

function drawCharSelect(){
  const gr=ctx.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#080818');gr.addColorStop(1,'#000000');ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
  // Header
  ctx.textAlign='center';ctx.font='bold 32px monospace';ctx.fillStyle='#fff';
  ctx.fillText('CHARACTER SELECT',W/2,40);
  ctx.font='13px monospace';ctx.fillStyle='#777';
  if(networkMode==='team4') ctx.fillText('Each player: left/right on phone to browse  |  jump/light to confirm',W/2,60);
  else if(networkMode==='test') ctx.fillText('A/D to browse  |  SPACE to confirm',W/2,60);
  else if(selectStep===0) ctx.fillText('P1: A/D to browse  |  SPACE to confirm',W/2,60);
  else ctx.fillText('P2: Arrow keys to browse  |  ENTER to confirm',W/2,60);

  // 4-player team mode: show all 4 player picks + team labels at top
  if(networkMode==='team4'){
    const t4slots=[
      {sel:p1Sel,lbl:'P1',col:'#3399ff',team:1},
      {sel:p2Sel,lbl:'P2',col:'#ff6644',team:2},
      {sel:p3Sel,lbl:'P3',col:'#44ddff',team:1},
      {sel:p4Sel,lbl:'P4',col:'#ff9944',team:2},
    ];
    const startX=W/2-(4*62)/2+31;
    for(let s=0;s<4;s++){
      const px=startX+s*62,py=82;
      const done=team4Done[s];
      const col=t4slots[s].col;
      ctx.strokeStyle=done?col:'#333';ctx.lineWidth=done?2.5:1;
      ctx.strokeRect(px-24,py-2,48,40);
      const charSel=t4slots[s].sel<CHARS.length?t4slots[s].sel:0;
      ctx.save();ctx.translate(px,py+20);ctx.scale(0.95,0.95);drawCharacter(ctx,CHARS[charSel],CHARS[charSel].w,CHARS[charSel].h,null,true,0);ctx.restore();
      ctx.fillStyle=done?col:'#555';ctx.font='9px monospace';ctx.textAlign='center';
      ctx.fillText(t4slots[s].lbl+(done?' ✓':''),px,py+48);
      // Team label
      const teamCol=t4slots[s].team===1?'#3399ff':'#ff6644';
      ctx.fillStyle=teamCol;ctx.font='8px monospace';ctx.fillText(`T${t4slots[s].team}`,px,py-6);
    }
    // Team divider
    ctx.strokeStyle='#333';ctx.lineWidth=1;ctx.setLineDash([4,4]);
    ctx.beginPath();ctx.moveTo(W/2,76);ctx.lineTo(W/2,134);ctx.stroke();ctx.setLineDash([]);
  }
  const cw=285,cardH=230,gapX=14,gapY=12,cols=3;
  const totalW=cols*cw+(cols-1)*gapX;
  const sx2=(W-totalW)/2;
  const clipTop=(networkMode==='team4')?140:70,clipBot=H-10,visibleH=clipBot-clipTop;
  const maxSc=Math.max(0,(Math.ceil((CHARS.length+1)/3)-2)*(cardH+gapY)); // +1 for RANDOM card
  // Clipped scroll region
  ctx.save();
  ctx.beginPath();ctx.rect(0,clipTop,W,visibleH);ctx.clip();
  ctx.translate(0,-charScrollY);
  for(let i=0;i<CHARS.length;i++){
    const c=CHARS[i],row=Math.floor(i/cols),col=i%cols;
    const cx2=sx2+col*(cw+gapX),cy2=clipTop+2+row*(cardH+gapY);

    // Determine highlights for this card
    const isP1Sel=p1Sel===i,isP2Sel=p2Sel===i;
    const isSame=networkMode==='none'&&p1Confirmed&&p1Sel===i&&selectStep===1;
    rrFill(cx2,cy2,cw,cardH,10,isSame?'rgba(10,10,10,0.8)':'rgba(16,16,36,0.92)');
    let bc='#252535',bw3=1.5;
    if(networkMode==='team4'){
      const t4cols=['#3399ff','#ff6644','#44ddff','#ff9944'];
      const t4sels=[p1Sel,p2Sel,p3Sel,p4Sel];
      for(let s=0;s<4;s++){if(t4sels[s]===i){bc=t4cols[s];bw3=team4Done[s]?3.5:2.5;}}
    } else {
      if(p1Confirmed&&p1Sel===i){bc='#3399ff';bw3=3;}
      else if(selectStep===0&&isP1Sel){bc='#3399ff';bw3=3;}
      if(selectStep===1&&isP2Sel){bc='#ff6644';bw3=3;}
    }
    rrStroke(cx2,cy2,cw,cardH,10,bc,bw3);
    ctx.save();ctx.translate(cx2+cw/2,cy2+100);ctx.scale(isSame?0.8:1.6,isSame?0.8:1.6);ctx.globalAlpha=isSame?0.28:1;
    drawCharacter(ctx,c,c.w,c.h,null,true,Math.floor(frame/10)%4);ctx.globalAlpha=1;ctx.restore();
    ctx.fillStyle=isSame?'#444':c.eyeCol;ctx.font='bold 16px monospace';ctx.textAlign='center';ctx.fillText(c.name,cx2+cw/2,cy2+cardH-64);
    ctx.fillStyle='#666';ctx.font='10px monospace';ctx.fillText(c.tag,cx2+cw/2,cy2+cardH-50);
    ctx.textAlign='left';ctx.fillStyle='#777';ctx.font='10px monospace';
    for(let j=0;j<Math.min(c.desc.length,2);j++) ctx.fillText('- '+c.desc[j],cx2+10,cy2+cardH-34+j*14);
    ctx.textAlign='center';ctx.font='bold 11px monospace';
    if(networkMode==='team4'){
      const t4cols=['#3399ff','#ff6644','#44ddff','#ff9944'];
      const t4sels=[p1Sel,p2Sel,p3Sel,p4Sel];
      const t4lbls=['P1','P2','P3','P4'];
      let yOff=16;
      for(let s=0;s<4;s++){if(t4sels[s]===i){ctx.fillStyle=t4cols[s];ctx.fillText(t4lbls[s]+(team4Done[s]?' ✓':''),cx2+cw/2,cy2+yOff);yOff+=14;}}
    } else {
      if(p1Confirmed&&p1Sel===i){ctx.fillStyle='#3399ff';ctx.fillText('P1',cx2+cw/2,cy2+16);}
      else if(selectStep===0&&isP1Sel){ctx.fillStyle='#3399ff';ctx.fillText('P1',cx2+cw/2,cy2+16);}
      if(selectStep===1&&isP2Sel){ctx.fillStyle='#ff6644';ctx.fillText('P2',cx2+cw/2,cy2+(p1Sel===i&&p1Confirmed?30:16));}
    }
  }
  // RANDOM card — rendered at the next grid position after all characters
  {
    const ri=CHARS.length, row=Math.floor(ri/cols), col=ri%cols;
    const rx=sx2+col*(cw+gapX), ry=clipTop+2+row*(cardH+gapY);
    const rSel=networkMode==='team4'?[p1Sel,p2Sel,p3Sel,p4Sel].includes(ri)
               :(selectStep===0?p1Sel===ri:p2Sel===ri);
    const pulse=Math.sin(frame*0.07)*0.18+0.82;
    rrFill(rx,ry,cw,cardH,10,'rgba(14,10,30,0.92)');
    rrStroke(rx,ry,cw,cardH,10,rSel?`rgba(255,200,0,${pulse})`:'#2a2a3a',rSel?3:1.5);
    // Animated question marks spinning
    ctx.save();ctx.translate(rx+cw/2,ry+cardH/2-20);
    const qAngle=Math.sin(frame*0.04)*0.2;ctx.rotate(qAngle);
    ctx.font='bold 72px monospace';ctx.textAlign='center';ctx.fillStyle=rSel?`rgba(255,200,0,${pulse})`:'#444';
    ctx.fillText('?',0,26);ctx.restore();
    ctx.fillStyle=rSel?'#ffcc00':'#aaa';ctx.font=`bold ${rSel?14:12}px monospace`;ctx.textAlign='center';
    ctx.fillText('RANDOM',rx+cw/2,ry+cardH-34);
    ctx.fillStyle='#555';ctx.font='10px monospace';
    ctx.fillText('Pick a surprise fighter!',rx+cw/2,ry+cardH-18);
    if(rSel){
      ctx.fillStyle='#ffcc00';ctx.font='bold 9px monospace';
      if(selectStep===0) ctx.fillText('P1',rx+cw/2,ry+16);
      else ctx.fillText('P2',rx+cw/2,ry+16);
    }
  }
  ctx.restore();
  // Scroll arrows
  if(maxSc>0){
    ctx.fillStyle='rgba(255,255,255,0.5)';ctx.font='20px monospace';ctx.textAlign='center';
    if(charScrollY>0)ctx.fillText('▲  scroll  ▲',W/2,clipTop+14);
    if(charScrollY<maxSc)ctx.fillText('▼  scroll  ▼',W/2,clipBot-4);
  }
}

function drawStageSelect(){
  const gr=ctx.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#080808');gr.addColorStop(1,'#050505');ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
  ctx.textAlign='center';ctx.font='bold 34px monospace';ctx.fillStyle='#fff';ctx.fillText('SELECT STAGE',W/2,40);
  ctx.font='12px monospace';ctx.fillStyle='#555';ctx.fillText('A/D or arrows to browse  |  W/S to scroll  |  SPACE or ENTER to start',W/2,60);
  const cols=4,cw=218,ch=172,gapX=14,gapY=12;
  const totalW=cols*cw+(cols-1)*gapX, sx=(W-totalW)/2;
  const clipTop=74,clipBot=H-32;
  const stTotal=STAGES.length+1;
  const maxSc=Math.max(0,(Math.ceil(stTotal/cols)-Math.floor((clipBot-clipTop)/(ch+gapY)))*(ch+gapY));
  ctx.save();
  ctx.beginPath();ctx.rect(0,clipTop,W,clipBot-clipTop);ctx.clip();
  ctx.translate(0,-stageScrollY);
  for(let i=0;i<STAGES.length;i++){
    const st=STAGES[i], col=i%cols, row=Math.floor(i/cols);
    const cx2=sx+col*(cw+gapX), cy2=clipTop+row*(ch+gapY), sel=stageSel===i;
    const sbg=ctx.createLinearGradient(cx2,cy2,cx2,cy2+ch*0.6);sbg.addColorStop(0,st.bgT);sbg.addColorStop(1,st.bgB);
    rrPath(cx2,cy2,cw,ch,10);ctx.fillStyle=sbg;ctx.fill();
    const sc=0.18,ox=cx2+8,oy=cy2+22;
    const g=st.ground;rrFill(ox+g.x*sc,oy+g.y*sc,g.w*sc,g.h*sc,3,st.gCol);rrFill(ox+g.x*sc,oy+g.y*sc,g.w*sc,4,2,st.gTop);
    if(st.ferrisWheel){
      // Mini ferris wheel preview
      const wcx=ox+500*sc,wcy=oy+310*sc,wr=160*sc,wa=(frame*0.006)%(Math.PI*2);
      ctx.strokeStyle='#8899aa';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(wcx,wcy,wr,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='#556677';ctx.lineWidth=1;
      for(let k=0;k<6;k++){const ka=wa+(k/6)*Math.PI*2;ctx.beginPath();ctx.moveTo(wcx,wcy);ctx.lineTo(wcx+Math.cos(ka)*wr,wcy+Math.sin(ka)*wr);ctx.stroke();}
      ctx.fillStyle='#ffdd00';ctx.beginPath();ctx.arc(wcx,wcy,3,0,Math.PI*2);ctx.fill();
      const bulbCols=['#ff3355','#ffdd00','#33ffaa','#3399ff','#ff88ff','#ffaa33'];
      for(let k=0;k<6;k++){const ka=wa+(k/6)*Math.PI*2;ctx.fillStyle=bulbCols[k];ctx.beginPath();ctx.arc(wcx+Math.cos(ka)*wr,wcy+Math.sin(ka)*wr,2,0,Math.PI*2);ctx.fill();}
      // Platforms on wheel
      for(let k=0;k<6;k++){const ka=wa+(k/6)*Math.PI*2,px=wcx+Math.cos(ka)*wr-80*sc/2,py=wcy+Math.sin(ka)*wr-60*sc/2;rrFill(px,py,80*sc,60*sc,1,st.pCol);}
    } else if(st.jungle){
      // Mini jungle preview: 2 edge trees + canopies + vine bridges
      const edgeT=[{cx:30,top:80},{cx:970,top:60}];
      for(const t of edgeT){
        ctx.fillStyle='rgba(8,28,5,0.85)';ctx.fillRect(ox+(t.cx-17)*sc,oy+t.top*sc,34*sc,(600-t.top)*sc);
        ctx.fillStyle='rgba(6,40,4,0.9)';ctx.beginPath();ctx.ellipse(ox+t.cx*sc,oy+(t.top+10)*sc,55*sc,42*sc,0,0,Math.PI*2);ctx.fill();
      }
      for(const sg of (st.grounds||[])){rrFill(ox+sg.x*sc,oy+sg.y*sc,sg.w*sc,sg.h*sc,2,st.gCol);}
      for(const pl of st.plats){rrFill(ox+pl.x*sc,oy+pl.y*sc,pl.w*sc,pl.h*sc,1,st.pCol);}
    } else if(st.neocity){
      // Mini preview: draw building bodies from rooftop down to card bottom, then glowing rooftop trim
      const neonCols=['#00e5ff','#ff00cc','#00ff99','#ff6600','#aa44ff'];
      for(let k=0;k<(st.grounds||[]).length;k++){
        const sg=st.grounds[k],nc=neonCols[k%neonCols.length];
        const bby=oy+sg.y*sc+sg.h*sc, bbh=ch-(sg.y*sc+sg.h*sc)-22;
        if(bbh>0){ctx.fillStyle='#0a1e28';ctx.fillRect(ox+sg.x*sc,bby,sg.w*sc,bbh);}
        ctx.fillStyle=nc;ctx.shadowBlur=6;ctx.shadowColor=nc;
        ctx.fillRect(ox+sg.x*sc,oy+sg.y*sc,sg.w*sc,sg.h*sc);
        ctx.shadowBlur=0;
      }
    } else {
      for(const pl of st.plats){rrFill(ox+pl.x*sc,oy+pl.y*sc,pl.w*sc,pl.h*sc,2,st.pCol);rrFill(ox+pl.x*sc,oy+pl.y*sc,pl.w*sc,3,2,st.pTop);}
      for(const sg of (st.grounds||[])){rrFill(ox+sg.x*sc,oy+sg.y*sc,sg.w*sc,sg.h*sc,2,st.gCol);rrFill(ox+sg.x*sc,oy+sg.y*sc,sg.w*sc,4,2,st.gTop);}
    }
    rrStroke(cx2,cy2,cw,ch,10,sel?st.aCol:'#2a2a2a',sel?3:1.5);
    ctx.fillStyle=sel?st.aCol:'#bbb';ctx.font=`bold ${sel?13:11}px monospace`;ctx.textAlign='center';
    ctx.fillText(st.name,cx2+cw/2,cy2+ch-36);
    ctx.fillStyle='#555';ctx.font='9px monospace';ctx.fillText(st.desc,cx2+cw/2,cy2+ch-22);
    if(sel){ctx.fillStyle=st.aCol;ctx.font='bold 9px monospace';ctx.fillText('[ SELECTED ]',cx2+cw/2,cy2+ch-9);}
  }
  // RANDOM stage card
  {
    const ri=STAGES.length, col=ri%cols, row=Math.floor(ri/cols);
    const rx=sx+col*(cw+gapX), ry=clipTop+row*(ch+gapY), rSel=stageSel===ri;
    const pulse=Math.sin(frame*0.07)*0.18+0.82;
    const rbg=ctx.createLinearGradient(rx,ry,rx,ry+ch*0.6);rbg.addColorStop(0,'#0d0020');rbg.addColorStop(1,'#1a003a');
    rrPath(rx,ry,cw,ch,10);ctx.fillStyle=rbg;ctx.fill();
    ctx.save();ctx.translate(rx+cw/2,ry+ch/2-22);
    ctx.rotate(Math.sin(frame*0.04)*0.15);
    ctx.font='bold 54px monospace';ctx.textAlign='center';ctx.fillStyle=rSel?`rgba(255,200,0,${pulse})`:'#333';
    ctx.fillText('?',0,20);ctx.restore();
    rrStroke(rx,ry,cw,ch,10,rSel?`rgba(255,200,0,${pulse})`:'#2a2a2a',rSel?3:1.5);
    ctx.fillStyle=rSel?'#ffcc00':'#bbb';ctx.font=`bold ${rSel?13:11}px monospace`;ctx.textAlign='center';
    ctx.fillText('RANDOM',rx+cw/2,ry+ch-36);
    ctx.fillStyle='#555';ctx.font='9px monospace';ctx.fillText('Let fate decide the arena!',rx+cw/2,ry+ch-22);
    if(rSel){ctx.fillStyle='#ffcc00';ctx.font='bold 9px monospace';ctx.fillText('[ SELECTED ]',rx+cw/2,ry+ch-9);}
  }
  ctx.restore();
  // Scroll arrows
  if(maxSc>0){
    ctx.fillStyle='rgba(255,255,255,0.45)';ctx.font='20px monospace';ctx.textAlign='center';
    if(stageScrollY>0) ctx.fillText('▲  scroll  ▲',W/2,clipTop+14);
    if(stageScrollY<maxSc) ctx.fillText('▼  scroll  ▼',W/2,clipBot-4);
  }
  {
    const p1c=CHARS[p1Sel],p2c=networkMode==='test'?DUMMY_CHAR:CHARS[p2Sel];
    ctx.font='bold 13px monospace';ctx.textAlign='left';ctx.fillStyle=p1c.color;ctx.fillText(`P1: ${p1c.name}`,18,H-14);
    ctx.textAlign='right';ctx.fillStyle=p2c.color;ctx.fillText(networkMode==='test'?'P2: DUMMY':`P2: ${p2c.name}`,W-18,H-14);
  }
}

function drawGameOver(){
  drawStageBG(curStage);drawStageGeom(curStage);for(const p of players)p.draw();drawParticles();
  ctx.fillStyle='rgba(0,0,0,0.72)';ctx.fillRect(0,0,W,H);
  ctx.textAlign='center';ctx.font='bold 62px monospace';ctx.fillStyle='#fff';ctx.fillText('GAME OVER',W/2,H/2-55);
  const wc=winner.includes('P1')?CHARS[p1Sel].color:winner.includes('P2')?(networkMode==='test'?'#888':CHARS[p2Sel].color):'#fff';
  ctx.font='bold 34px monospace';ctx.fillStyle=wc;ctx.fillText(winner,W/2,H/2+18);
  ctx.fillStyle='#666';ctx.font='17px monospace';ctx.fillText('Press ENTER or SPACE to play again',W/2,H/2+72);
}

// ---- Game Logic ----
function startGame(){
  curStage=STAGES[stageSel];
  const clr=()=>{winner='';gameState='game';frame=0;particles.length=0;bullets.length=0;miniSwords.length=0;rocketArms.length=0;rocketMines.length=0;smokeClouds.length=0;unstableHeads.length=0;knives.length=0;throwSwords.length=0;firePebbles.length=0;factoryBolts.length=0;factoryGears.length=0;factoryZaps.length=0;shakeX=0;shakeY=0;boulder=null;smallRocks.length=0;};
  if(networkMode==='team4'){
    // 4 spawn points: spread evenly across the stage
    const stageW=curStage.ground.w||1000;
    const baseX=curStage.ground.x||0;
    const spawnXs=[baseX+stageW*0.18,baseX+stageW*0.38,baseX+stageW*0.62,baseX+stageW*0.82];
    const sels=[p1Sel,p2Sel,p3Sel,p4Sel];
    // Teams: P1&P3 = team 1, P2&P4 = team 2
    const teams=[1,2,1,2];
    players=sels.map((sel,i)=>{
      const p=new Player(CHARS[sel],spawnXs[i],i+1,false);
      p.localInputSlot=i+1;
      p.team=teams[i];
      p.facing=teams[i]===1?1:-1;
      return p;
    });
  } else {
    const p1c=CHARS[p1Sel],p2c=networkMode==='test'?DUMMY_CHAR:CHARS[p2Sel];
    players=[new Player(p1c,curStage.spawnX[0],1,false),new Player(p2c,curStage.spawnX[1],2,networkMode==='test')];
    players[1].facing=-1;
    players[0].localInputSlot=1; players[1].localInputSlot=2;
  }
  clr();
  boulder = new Boulder(W/2, H/2);
}

function updateGame(){
  // Rotate ferris wheel platforms for THE CARNIVAL stage
  if(curStage&&curStage.ferrisWheel){
    carnivalAngle+=0.006;
    const cx=500,cy=310,r=160,pw=80,ph=60;
    for(let i=0;i<6;i++){
      const a=carnivalAngle+(i/6)*Math.PI*2;
      curStage.plats[i].x=cx+Math.cos(a)*r-pw/2;
      curStage.plats[i].y=cy+Math.sin(a)*r-ph/2;
    }
  }
  // Collect all inputs
  const inputs=players.map((_,i)=>getInputForPn(i+1));
  // Update players
  {
    if(networkMode==='team4'){
      // 4-player local: each player gets all others as opponents
      for(let i=0;i<players.length;i++){
        players[i].update(inputs[i],curStage,players.filter((_,j)=>j!==i));
      }
      for(const p of players)p.checkKill();
    } else {
      players[0].update(inputs[0],curStage,[players[1]]);
      players[1].update(inputs[1],curStage,[players[0]]);
      players[0].checkKill();players[1].checkKill();
    }
  }
  // Projectiles
  {
    for(let i=bullets.length-1;i>=0;i--){bullets[i].update(players);if(bullets[i].dead)bullets.splice(i,1);}
    for(let i=miniSwords.length-1;i>=0;i--){miniSwords[i].update(players,curStage);if(miniSwords[i].dead)miniSwords.splice(i,1);}
    for(let i=rocketArms.length-1;i>=0;i--){rocketArms[i].update(players);if(rocketArms[i].dead)rocketArms.splice(i,1);}
    for(let i=rocketMines.length-1;i>=0;i--){rocketMines[i].update(players);if(rocketMines[i].dead)rocketMines.splice(i,1);}
    for(let i=smokeClouds.length-1;i>=0;i--){smokeClouds[i].update(players);if(smokeClouds[i].dead)smokeClouds.splice(i,1);}
    for(let i=unstableHeads.length-1;i>=0;i--){unstableHeads[i].update(players);if(unstableHeads[i].dead)unstableHeads.splice(i,1);}
    for(let i=knives.length-1;i>=0;i--){knives[i].update(players);if(knives[i].dead)knives.splice(i,1);}
    for(let i=throwSwords.length-1;i>=0;i--){throwSwords[i].update(players);if(throwSwords[i].dead)throwSwords.splice(i,1);}
    for(let i=firePebbles.length-1;i>=0;i--){firePebbles[i].update(players);if(firePebbles[i].dead)firePebbles.splice(i,1);}
    for(let i=pristineRockets.length-1;i>=0;i--){pristineRockets[i].update(players);if(pristineRockets[i].dead)pristineRockets.splice(i,1);}
    for(let i=factoryBolts.length-1;i>=0;i--){factoryBolts[i].update(players);if(factoryBolts[i].dead)factoryBolts.splice(i,1);}
    for(let i=factoryGears.length-1;i>=0;i--){factoryGears[i].update(players);if(factoryGears[i].dead)factoryGears.splice(i,1);}
    for(let i=factoryZaps.length-1;i>=0;i--){factoryZaps[i].update(players);if(factoryZaps[i].dead)factoryZaps.splice(i,1);}
    // Boulder + small rocks
    if(boulder){
      boulder.update();
      if(boulder.dead) boulder=null;
    }
    for(let i=smallRocks.length-1;i>=0;i--){smallRocks[i].update(players);if(smallRocks[i].dead)smallRocks.splice(i,1);}
    // Boulder respawns at center once all small rocks are gone
    if(!boulder&&smallRocks.length===0) boulder=new Boulder(W/2,H/2);
  }
  updateParticles();
  if(networkMode==='test'&&keys['KeyR']){players[1].damage=0;players[1].dead=false;players[1].x=curStage.spawnX[1]-players[1].w/2;players[1].y=150;players[1].vx=0;players[1].vy=0;}
  // Win condition
  if(networkMode==='team4'){
    const team1Alive=players.some(p=>p.team===1&&p.stocks>0);
    const team2Alive=players.some(p=>p.team===2&&p.stocks>0);
    if(!team1Alive||!team2Alive){
      if(!team1Alive&&!team2Alive)winner='Draw!';
      else if(!team1Alive)winner='Team 2 Wins! (P2 & P4)';
      else winner='Team 1 Wins! (P1 & P3)';
      gameState='gameOver';gameOverTimer=180;
    }
  } else {
    if(players[0].stocks<=0||players[1].stocks<=0){
      if(players[0].stocks<=0&&players[1].stocks<=0)winner='Draw!';
      else if(players[0].stocks<=0)winner=networkMode==='test'?'Dummy Wins?!':`P2 (${players[1].ch.name}) Wins!`;
      else winner=`P1 (${players[0].ch.name}) Wins!`;
      gameState='gameOver';gameOverTimer=180;
    }
  }
}

function resetMenu(){
  stopBgMusic();
  gameState='modeSelect';selectStep=0;p1Sel=0;p2Sel=1;p3Sel=2;p4Sel=3;stageSel=0;p1Confirmed=false;charScrollY=0;stageScrollY=0;
  team4Done=[false,false,false,false];
  confirmedChars={};
  networkMode='none';
  bullets.length=0;particles.length=0;miniSwords.length=0;rocketArms.length=0;rocketMines.length=0;smokeClouds.length=0;unstableHeads.length=0;knives.length=0;throwSwords.length=0;firePebbles.length=0;pristineRockets.length=0;factoryBolts.length=0;factoryGears.length=0;factoryZaps.length=0;boulder=null;smallRocks.length=0;
}

// ---- Main Loop ----
function loop(){
  frame++;
  pollGamepads();
  ctx.clearRect(0,0,W,H);
  if(gameState==='modeSelect'||gameState==='charSelect'||gameState==='stageSelect') playLobbyMusic();
  if(gameState==='modeSelect') drawModeSelect();
  else if(gameState==='charSelect') drawCharSelect();
  else if(gameState==='stageSelect') drawStageSelect();
  else if(gameState==='game'){
    playStageMusic(curStage);
    updateGame();
    ctx.save();ctx.translate(shakeX,shakeY);
    ctx.translate(W/2,H/2);ctx.scale(0.692,0.9);ctx.translate(-W/2,-H/2);
    drawStageBG(curStage);drawStageGeom(curStage);
    for(const ms of miniSwords)ms.draw();
    for(const a of rocketArms)a.draw();
    for(const m of rocketMines)m.draw();
    for(const sc of smokeClouds)sc.draw();
    for(const uh of unstableHeads)uh.draw();
    for(const k of knives)k.draw();
    for(const ts of throwSwords)ts.draw();
    for(const fp of firePebbles)fp.draw();
    for(const pr of pristineRockets)pr.draw();
    for(const fz of factoryZaps)fz.draw();
    for(const fg of factoryGears)fg.draw();
    for(const fb of factoryBolts)fb.draw();
    for(const b of bullets)b.draw();
    if(boulder)boulder.draw();
    for(const sr of smallRocks)sr.draw();
    for(const p of players)p.draw();
    drawParticles();ctx.restore();
    for(const p of players)p.drawOffScreenIndicator();
    if(networkMode==='team4'){
      // Team 1 (P1,P3) on left; Team 2 (P2,P4) on right
      players[0].drawHUD('left',0);players[2].drawHUD('left',1);
      players[1].drawHUD('right',0);players[3].drawHUD('right',1);
      // Team label banners
      ctx.font='bold 11px monospace';ctx.textAlign='left';
      ctx.fillStyle='rgba(51,153,255,0.6)';ctx.fillText('TEAM 1',14,H-6);
      ctx.textAlign='right';ctx.fillStyle='rgba(255,102,68,0.6)';ctx.fillText('TEAM 2',W-14,H-6);
    } else {
      players[0].drawHUD('left');players[1].drawHUD('right');
    }
    ctx.fillStyle='rgba(255,255,255,0.25)';ctx.font='10px monospace';ctx.textAlign='center';
    if(networkMode==='test') ctx.fillText('WASD+Mouse  |  Q: shield  |  E: grab  |  R: reset dummy  |  ESC: exit',W/2,H-6);
    else if(networkMode==='team4') {/* team labels drawn above */}
    else ctx.fillText('P1: WASD+LClick+RClick(charge)+LShift(dash)+Q(shield)+E(grab)  |  P2: Arrows+[/](charge)+RShift(dash)+/(shield)+. (grab)',W/2,H-6);
  }
  else if(gameState==='gameOver'){if(gameOverTimer>0)gameOverTimer--;drawGameOver();}

  p1JumpPend=false;p2JumpPend=false;p3JumpPend=false;p4JumpPend=false;
  p1LightPend=false;p1HeavyPend=false;p2LightPend=false;p2HeavyPend=false;p3LightPend=false;p3HeavyPend=false;p4LightPend=false;p4HeavyPend=false;
  p1ShieldPend=false;p2ShieldPend=false;p3ShieldPend=false;p4ShieldPend=false;
  p1DashPend=false;p2DashPend=false;p3DashPend=false;p4DashPend=false;
  p1HeavyRelease=false;p2HeavyRelease=false;p3HeavyRelease=false;p4HeavyRelease=false;
  requestAnimationFrame(loop);
}
loop();
