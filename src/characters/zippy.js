import { ctx, W, H, bullets, miniSwords, rocketArms, rocketMines, smokeClouds, unstableHeads, knives, throwSwords, firePebbles, pristineRockets, factoryBolts, factoryGears, factoryZaps, particles, aabb, sameTeam } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, addDeathExplosion, instakill, rrFill, rrStroke, rrPath } from '../particles.js';
import { MAX_KB, DEATH_THRESHOLD, FLY_ACCEL, MAX_FLY_SPEED, FLY_FRIC, DASH_FRAMES, DASH_MULT } from '../player/constants.js';
import { kbScale, playSfx, playSfxNoise } from '../audio.js';

export const char = { id:2,name:'ZIPPY',tag:'The Speed Demon',
    desc:['Lightning-fast attacks','Charged heavy hits hard','Lower base knockback'],
    color:'#ffdd00',accent:'#cc8800',eyeCol:'#ff00cc',hi:'#ffee88',
    w:40,h:50,speed:8.0,jumpF:-14.1,djF:-12.6,weight:0.8,def:1.16,shieldCool:108,
    lDmg:5,hDmg:9,lKB:5,hKB:10,lSU:2,hSU:8,lAct:6,hAct:10,lEl:5,hEl:16,
    lSz:38,lRch:50,hSz:55,hRch:64 };

export function getAtkFrames(type, dir, comboN, player) {
  return null;
}

export function getHitbox(a, x, y, w, h, facing, player) {
  return null;
}

export function onUpdate(player, inp, opps) {
  // no special mechanics
}

export function onRespawn(player) {
  // no cleanup needed
}

export function draw(ctx,ch,w,h,atk,grounded,wf){
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


