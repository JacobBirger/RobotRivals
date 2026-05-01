import { ctx, W, H, bullets, miniSwords, rocketArms, rocketMines, smokeClouds, unstableHeads, knives, throwSwords, firePebbles, pristineRockets, factoryBolts, factoryGears, factoryZaps, particles, aabb, sameTeam } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, addDeathExplosion, instakill, rrFill, rrStroke, rrPath } from '../particles.js';
import { MAX_KB, DEATH_THRESHOLD, FLY_ACCEL, MAX_FLY_SPEED, FLY_FRIC, DASH_FRAMES, DASH_MULT } from '../player/constants.js';
import { kbScale, playSfx, playSfxNoise } from '../audio.js';

export const char = { id:5,name:'PIERCE',tag:'The Lancer',
    desc:['Extra-long spear reach','Down+Light: pogo bounce','3-hit spear swing combo'],
    color:'#00dddd',accent:'#008888',eyeCol:'#aaffff',hi:'#88eeee',
    w:44,h:56,speed:7.0,jumpF:-13.5,djF:-12.0,weight:0.8,def:1.16,shieldCool:84,
    lDmg:7,hDmg:14,lKB:8,hKB:17,lSU:4,hSU:14,lAct:8,hAct:12,lEl:9,hEl:26,
    lSz:26,lRch:100,hSz:36,hRch:118, maxCombo:3 };

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


