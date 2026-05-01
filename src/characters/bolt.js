import { ctx, W, H, bullets, miniSwords, rocketArms, rocketMines, smokeClouds, unstableHeads, knives, throwSwords, firePebbles, pristineRockets, factoryBolts, factoryGears, factoryZaps, particles, aabb, sameTeam } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, addDeathExplosion, instakill, rrFill, rrStroke, rrPath } from '../particles.js';
import { MAX_KB, DEATH_THRESHOLD, FLY_ACCEL, MAX_FLY_SPEED, FLY_FRIC, DASH_FRAMES, DASH_MULT } from '../player/constants.js';
import { kbScale, playSfx, playSfxNoise } from '../audio.js';

export const char = { id:0,name:'BOLT',tag:'The All-Rounder',
    desc:['Balanced stats','2-hit punch combo','Easy to learn'],
    color:'#3399ff',accent:'#1155cc',eyeCol:'#00ffff',hi:'#88ccff',
    w:46,h:58,speed:5.5,jumpF:-13.5,djF:-12.0,weight:1.0,def:1.00,shieldCool:120,
    lDmg:5,hDmg:10,lKB:5,hKB:11,lSU:5,hSU:15,lAct:8,hAct:12,lEl:8,hEl:22,
    lSz:44,lRch:74,hSz:62,hRch:90, maxCombo:2 };

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


