import { canvas, G } from './globals.js';
import { CHARS } from './characters/index.js';

// keys{} is exported so player/index.js can read held state directly
export const keys = {};

// ---- Keyboard ----
document.addEventListener('keydown', e => {
  const was = keys[e.code];
  keys[e.code] = true;
  if (!was) {
    if (e.code==='KeyE'         && G.gameState==='game') G.p1JumpPend=true;
    if (e.code==='Period'       && G.gameState==='game') G.p2JumpPend=true;
    if (e.code==='KeyZ')    G.p1LightPend=true;
    if (e.code==='KeyX')    G.p1HeavyPend=true;
    if (e.code==='KeyQ'         && G.gameState==='game') G.p1ShieldPend=true;
    if (e.code==='Slash'        && G.gameState==='game') G.p2ShieldPend=true;
    if (e.code==='ShiftLeft'    && G.gameState==='game') G.p1DashPend=true;
    if (e.code==='ShiftRight'   && G.gameState==='game') G.p2DashPend=true;
    if (e.code==='BracketLeft'  && G.gameState==='game') G.p2LightPend=true;
    if (e.code==='BracketRight' && G.gameState==='game') G.p2HeavyPend=true;
  }
  if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  if (G.gameState==='modeSelect')       G.menuModeKey(e.code);
  else if (G.gameState==='charSelect')  G.menuCharKey(e.code==='KeyE'?'Space':e.code==='Period'?'Enter':e.code);
  else if (G.gameState==='stageSelect') G.menuStageKey(e.code==='KeyE'||e.code==='Period'?'Space':e.code);
  if (G.gameState==='gameOver' && (e.code==='Space'||e.code==='Enter'||e.code==='NumpadEnter')) G.resetMenu();
  if (e.code==='Escape' && G.gameState==='game' && G.networkMode==='test') G.resetMenu();
  if (e.code==='KeyT' && G.gameState==='game') G.bordersOn=!G.bordersOn;
});

document.addEventListener('keyup', e => {
  keys[e.code]=false;
  if (e.code==='KeyX'          && G.gameState==='game') G.p1HeavyRelease=true;
  if (e.code==='BracketRight'  && G.gameState==='game') G.p2HeavyRelease=true;
});

document.addEventListener('mousedown', e => {
  if (e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='BUTTON') return;
  if (e.button===0) { G.p1LightPend=true; G.mouseLeft=true; }
  if (e.button===2) { G.p1HeavyPend=true; G.mouseRight=true; }
  e.preventDefault();
});
document.addEventListener('mouseup', e => {
  if (e.button===0) G.mouseLeft=false;
  if (e.button===2) { G.mouseRight=false; if(G.gameState==='game') G.p1HeavyRelease=true; }
});

canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('wheel', e => {
  if(G.gameState==='charSelect'){
    const maxSc=Math.max(0,(Math.ceil(CHARS.length/3)-2)*(230+12));
    G.charScrollY=Math.max(0,Math.min(maxSc,G.charScrollY+e.deltaY*0.4));
    e.preventDefault();
  }
},{passive:false});

// ---- Gamepad ----
const gpPrev=[{},{}];
const GP_DEAD=0.3;

export function pollGamepads(){
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
      keys['_gp1Hvy']=btn(3);keys['_gp1Lt']=btn(2);keys['_gp1JH']=btn(0);keys['_gp1Boost']=btn(4)||btn(5)||btn(6)||btn(7);
      if(edge(0))G.p1JumpPend=true;
      if(edge(2))G.p1LightPend=true;
      if(edge(3))G.p1HeavyPend=true;
      if(edge(1)&&G.gameState==='game')G.p1ShieldPend=true;
      if(rel(3)&&G.gameState==='game')G.p1HeavyRelease=true;
    }else{
      keys['_gp2L']=gpLeft;keys['_gp2R']=gpRight;keys['_gp2U']=gpUp;keys['_gp2D']=gpDown;
      keys['_gp2Hvy']=btn(3);keys['_gp2Lt']=btn(2);keys['_gp2JH']=btn(0);keys['_gp2Boost']=btn(4)||btn(5)||btn(6)||btn(7);
      if(edge(0))G.p2JumpPend=true;
      if(edge(2))G.p2LightPend=true;
      if(edge(3))G.p2HeavyPend=true;
      if(edge(1)&&G.gameState==='game')G.p2ShieldPend=true;
      if(rel(3)&&G.gameState==='game')G.p2HeavyRelease=true;
    }
    if(G.gameState==='modeSelect'){
      if(eU)G.modeSelIdx=(G.modeSelIdx+2)%3;
      if(eD)G.modeSelIdx=(G.modeSelIdx+1)%3;
      if(edge(0)||edge(9)){const codes=['KeyL','Key4','KeyT'];G.menuModeKey(codes[G.modeSelIdx]);}
    }else if(G.gameState==='charSelect'){
      const kL=gi===0?'KeyA':'ArrowLeft',kR=gi===0?'KeyD':'ArrowRight';
      const kU=gi===0?'KeyW':'ArrowUp',kD=gi===0?'KeyS':'ArrowDown';
      if(eL)G.menuCharKey(kL);if(eR)G.menuCharKey(kR);if(eU)G.menuCharKey(kU);if(eD)G.menuCharKey(kD);
      if(edge(0)||edge(9))G.menuCharKey(gi===0?'Space':'Enter');
    }else if(G.gameState==='stageSelect'){
      if(eL)G.menuStageKey('KeyA');if(eR)G.menuStageKey('KeyD');if(eU)G.menuStageKey('KeyW');if(eD)G.menuStageKey('KeyS');
      if(edge(0)||edge(9))G.menuStageKey('Space');
    }else if(G.gameState==='gameOver'){
      if(edge(0)||edge(9))G.resetMenu();
    }
    if(G.gameState==='game'&&G.networkMode==='test'&&edge(9))G.resetMenu();
    for(let i=0;i<gp.buttons.length;i++)prev['b'+i]=btn(i);
    prev.sL=sL;prev.sR=sR;prev.sU=sU;prev.sD=sD;
  }
}

// ---- Phone Controller (PeerJS / WebRTC) ----
const phonePrev=[{},{},{},{}];
const phoneHold=[false,false,false,false];
const phoneConns=[null,null,null,null]; // slot -> DataConnection
let phonePeer=null;

function genRoomCode(){
  // 4-char alphanumeric, no ambiguous chars (0/O, 1/I/L)
  const a='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s='';for(let i=0;i<4;i++)s+=a[Math.floor(Math.random()*a.length)];
  return s;
}

// Where the phone fetches controller.html. Set to a public URL so phones can
// always reach it (PeerJS handles the peer-to-peer link separately). If the
// game is being viewed at this same origin, fall back to a relative path so
// localhost dev still works without changing anything.
const PUBLIC_CONTROLLER_URL='https://jacobbirger.github.io/RobotRivals/controller.html';

function buildControllerUrl(code){
  try{
    const pub=new URL(PUBLIC_CONTROLLER_URL);
    if(location.hostname===pub.hostname){
      return `${location.origin}${location.pathname.replace(/[^/]*$/,'')}controller.html?room=${code}`;
    }
    return `${PUBLIC_CONTROLLER_URL}?room=${code}`;
  }catch(e){
    return `${location.origin}${location.pathname.replace(/[^/]*$/,'')}controller.html?room=${code}`;
  }
}

function updateRoomOverlay(code){
  const el=document.getElementById('roomOverlay');
  if(!el)return;
  const codeEl=document.getElementById('roomCode');
  const urlEl=document.getElementById('roomUrl');
  const qrHolder=document.getElementById('qrHolder');
  const url=buildControllerUrl(code);
  codeEl.textContent=code;
  urlEl.textContent=url;
  el.classList.add('show');
  if(typeof qrcode!=='undefined'&&qrHolder){
    try{
      const qr=qrcode(0,'L');qr.addData(url);qr.make();
      qrHolder.innerHTML=qr.createImgTag(3,0);
    }catch(e){}
  }
}

function handlePhoneMsg(msg){
  try{
      if(msg.type!=='input')return;
      const pi=(msg.player||1)-1;
      const prev=phonePrev[pi];
      const edge=(k)=>msg[k]&&!prev[k];
      const rel=(k)=>!msg[k]&&prev[k];
      if(pi===0){
        keys['_ph1L']=msg.left;keys['_ph1R']=msg.right;keys['_ph1U']=msg.up;keys['_ph1D']=msg.down;
        keys['_ph1Hvy']=msg.heavy;keys['_ph1Lt']=msg.light;keys['_ph1JH']=msg.jump;keys['_ph1Boost']=msg.boost;
        if(edge('jump'))G.p1JumpPend=true;
        if(edge('light'))G.p1LightPend=true;
        if(edge('heavy'))G.p1HeavyPend=true;
        if(edge('shield')&&G.gameState==='game')G.p1ShieldPend=true;
        if(rel('heavy')&&G.gameState==='game')G.p1HeavyRelease=true;
      }else if(pi===1){
        keys['_ph2L']=msg.left;keys['_ph2R']=msg.right;keys['_ph2U']=msg.up;keys['_ph2D']=msg.down;
        keys['_ph2Hvy']=msg.heavy;keys['_ph2Lt']=msg.light;keys['_ph2JH']=msg.jump;keys['_ph2Boost']=msg.boost;
        if(edge('jump'))G.p2JumpPend=true;
        if(edge('light'))G.p2LightPend=true;
        if(edge('heavy'))G.p2HeavyPend=true;
        if(edge('shield')&&G.gameState==='game')G.p2ShieldPend=true;
        if(rel('heavy')&&G.gameState==='game')G.p2HeavyRelease=true;
      }else if(pi===2){
        keys['_ph3L']=msg.left;keys['_ph3R']=msg.right;keys['_ph3U']=msg.up;keys['_ph3D']=msg.down;
        keys['_ph3Hvy']=msg.heavy;keys['_ph3Lt']=msg.light;keys['_ph3JH']=msg.jump;keys['_ph3Boost']=msg.boost;
        if(edge('jump'))G.p3JumpPend=true;
        if(edge('light'))G.p3LightPend=true;
        if(edge('heavy'))G.p3HeavyPend=true;
        if(edge('shield')&&G.gameState==='game')G.p3ShieldPend=true;
        if(rel('heavy')&&G.gameState==='game')G.p3HeavyRelease=true;
      }else if(pi===3){
        keys['_ph4L']=msg.left;keys['_ph4R']=msg.right;keys['_ph4U']=msg.up;keys['_ph4D']=msg.down;
        keys['_ph4Hvy']=msg.heavy;keys['_ph4Lt']=msg.light;keys['_ph4JH']=msg.jump;keys['_ph4Boost']=msg.boost;
        if(edge('jump'))G.p4JumpPend=true;
        if(edge('light'))G.p4LightPend=true;
        if(edge('heavy'))G.p4HeavyPend=true;
        if(edge('shield')&&G.gameState==='game')G.p4ShieldPend=true;
        if(rel('heavy')&&G.gameState==='game')G.p4HeavyRelease=true;
      }
      if(G.gameState==='modeSelect'){
        if(edge('up'))G.modeSelIdx=(G.modeSelIdx+2)%3;
        if(edge('down'))G.modeSelIdx=(G.modeSelIdx+1)%3;
        if(edge('jump')||edge('light')){const codes=['KeyL','Key4','KeyT'];G.menuModeKey(codes[G.modeSelIdx]);}
      }else if(G.gameState==='charSelect'){
        if(G.networkMode==='team4'){
          if(edge('left'))G.menuCharKey({pi,dir:'left'});
          if(edge('right'))G.menuCharKey({pi,dir:'right'});
          if(edge('up'))G.menuCharKey({pi,dir:'up'});
          if(edge('down'))G.menuCharKey({pi,dir:'down'});
          if(edge('jump')||edge('light'))G.menuCharKey({pi,dir:'confirm'});
        } else {
          const kL=pi===0?'KeyA':'ArrowLeft',kR=pi===0?'KeyD':'ArrowRight';
          const kU=pi===0?'KeyW':'ArrowUp',kD=pi===0?'KeyS':'ArrowDown';
          if(edge('left'))G.menuCharKey(kL);if(edge('right'))G.menuCharKey(kR);
          if(edge('up'))G.menuCharKey(kU);if(edge('down'))G.menuCharKey(kD);
          if(edge('jump')||edge('light'))G.menuCharKey(pi===0?'Space':'Enter');
        }
      }else if(G.gameState==='stageSelect'){
        if(pi===0){
          if(edge('left'))G.menuStageKey('KeyA');if(edge('right'))G.menuStageKey('KeyD');
          if(edge('up'))G.menuStageKey('KeyW');if(edge('down'))G.menuStageKey('KeyS');
          if(edge('jump')||edge('light'))G.menuStageKey('Space');
        }
      }else if(G.gameState==='gameOver'){
        if(edge('jump')||edge('light'))G.resetMenu();
      }
      phoneHold[pi]=!!msg.hold;
      for(const k of ['left','right','up','down','jump','light','heavy','shield','boost'])prev[k]=msg[k];
    }catch(e){}
}

function refreshOverlayVisibility(){}

(function wireRoomClose(){
  if(typeof document==='undefined')return;
  const attach=()=>{
    const btn=document.getElementById('roomClose');
    const el=document.getElementById('roomOverlay');
    if(!btn||!el)return;
    btn.addEventListener('click',()=>{el.classList.remove('show');});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});
  else attach();
})();

function attachPhoneConn(conn){
  conn.on('open',()=>{
    const slot=phoneConns.findIndex(c=>!c);
    if(slot<0){conn.close();return;}
    phoneConns[slot]=conn;
    conn.send({type:'slot',player:slot+1});
    refreshOverlayVisibility();
  });
  conn.on('data',(d)=>{
    const pi=phoneConns.indexOf(conn);
    if(pi<0)return;
    // Allow phone to declare which slot it wants (e.g. via dropdown).
    if(d&&d.type==='claim'&&typeof d.player==='number'){
      const want=Math.max(1,Math.min(4,d.player|0))-1;
      if(want!==pi&&!phoneConns[want]){
        phoneConns[pi]=null;phoneConns[want]=conn;
        conn.send({type:'slot',player:want+1});
      }
      return;
    }
    if(!d||d.type!=='input')return;
    handlePhoneMsg({...d,player:pi+1});
  });
  conn.on('close',()=>{
    const i=phoneConns.indexOf(conn);
    if(i>=0)phoneConns[i]=null;
    refreshOverlayVisibility();
  });
  conn.on('error',()=>{});
}

export function initPhoneController(){
  if(typeof Peer==='undefined')return;
  if(phonePeer)return;
  const tryConnect=()=>{
    const code=genRoomCode();
    const id='robot-rivals-'+code.toLowerCase();
    const p=new Peer(id);
    p.on('open',()=>{
      phonePeer=p;
      window.G_ROOM_CODE=code;
      updateRoomOverlay(code);
    });
    p.on('connection',attachPhoneConn);
    p.on('error',(err)=>{
      if(err&&(err.type==='unavailable-id'||/taken/i.test(String(err.message||'')))){
        try{p.destroy();}catch(e){}
        setTimeout(tryConnect,50);
      }
      // Other errors are ignored; PeerJS keeps signaling alive.
    });
    p.on('disconnected',()=>{try{p.reconnect();}catch(e){}});
  };
  tryConnect();
}

// ---- Input getters ----
export function getP1Input() {
  return { left:keys['KeyA']||keys['_gp1L']||keys['_ph1L'],right:keys['KeyD']||keys['_gp1R']||keys['_ph1R'],
           down:keys['KeyS']||keys['_gp1D']||keys['_ph1D'],up:keys['KeyW']||keys['_gp1U']||keys['_ph1U'],
           grab:G.p1JumpPend,light:G.p1LightPend,heavy:G.p1HeavyPend,shield:G.p1ShieldPend,
           dash:G.p1DashPend,boost:keys['ShiftLeft']||keys['_gp1Boost']||keys['_ph1Boost'],
           heavyHeld:keys['KeyX']||keys['_gp1Hvy']||keys['_ph1Hvy'],heavyRelease:G.p1HeavyRelease,
           lightHeld:keys['KeyZ']||G.mouseLeft||keys['_gp1Lt']||keys['_ph1Lt'],hold:phoneHold[0] };
}
export function getP2Input() {
  return { left:keys['ArrowLeft']||keys['_gp2L']||keys['_ph2L'],right:keys['ArrowRight']||keys['_gp2R']||keys['_ph2R'],
           down:keys['ArrowDown']||keys['_gp2D']||keys['_ph2D'],up:keys['ArrowUp']||keys['_gp2U']||keys['_ph2U'],
           grab:G.p2JumpPend,light:G.p2LightPend,heavy:G.p2HeavyPend,shield:G.p2ShieldPend,
           dash:G.p2DashPend,boost:keys['ShiftRight']||keys['_gp2Boost']||keys['_ph2Boost'],
           heavyHeld:keys['BracketRight']||keys['_gp2Hvy']||keys['_ph2Hvy'],heavyRelease:G.p2HeavyRelease,
           lightHeld:keys['BracketLeft']||keys['_gp2Lt']||keys['_ph2Lt'],hold:phoneHold[1] };
}
export function getP3Input() {
  return { left:keys['_ph3L'],right:keys['_ph3R'],down:keys['_ph3D'],up:keys['_ph3U'],
           grab:G.p3JumpPend,light:G.p3LightPend,heavy:G.p3HeavyPend,shield:G.p3ShieldPend,
           dash:G.p3DashPend,boost:keys['_ph3Boost'],
           heavyHeld:keys['_ph3Hvy'],heavyRelease:G.p3HeavyRelease,
           lightHeld:keys['_ph3Lt'],hold:phoneHold[2] };
}
export function getP4Input() {
  return { left:keys['_ph4L'],right:keys['_ph4R'],down:keys['_ph4D'],up:keys['_ph4U'],
           grab:G.p4JumpPend,light:G.p4LightPend,heavy:G.p4HeavyPend,shield:G.p4ShieldPend,
           dash:G.p4DashPend,boost:keys['_ph4Boost'],
           heavyHeld:keys['_ph4Hvy'],heavyRelease:G.p4HeavyRelease,
           lightHeld:keys['_ph4Lt'],hold:phoneHold[3] };
}
export function dummyInput() {
  return {left:false,right:false,down:false,up:false,grab:false,light:false,heavy:false,shield:false,dash:false,boost:false,heavyHeld:false,heavyRelease:false,lightHeld:false};
}
export function defaultInput() { return dummyInput(); }
export function clearPendingFlags() {} // no-op; flags are cleared in loop() via G.pNXxxPend=false

export function getInputForPn(pn) {
  if (G.networkMode==='team4') return pn===1?getP1Input():pn===2?getP2Input():pn===3?getP3Input():getP4Input();
  if (G.networkMode==='test')  return pn===1?getP1Input():dummyInput();
  return pn===1?getP1Input():getP2Input();
}
