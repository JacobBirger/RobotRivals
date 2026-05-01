import { ctx, W, H, bullets, miniSwords, rocketArms, rocketMines, smokeClouds, unstableHeads, knives, throwSwords, firePebbles, pristineRockets, factoryBolts, factoryGears, factoryZaps, particles, aabb, sameTeam } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, addDeathExplosion, instakill, rrFill, rrStroke, rrPath } from '../particles.js';
import { MAX_KB, DEATH_THRESHOLD, FLY_ACCEL, MAX_FLY_SPEED, FLY_FRIC, DASH_FRAMES, DASH_MULT } from '../player/constants.js';
import { kbScale, playSfx, playSfxNoise } from '../audio.js';

export const char = { id:1,name:'CRUSHER',tag:'The Powerhouse',
    desc:['Massive charged heavy','High damage','Slow but mighty'],
    color:'#ff3333',accent:'#991111',eyeCol:'#ff8800',hi:'#ff8888',
    w:58,h:68,speed:4.0,jumpF:-12.3,djF:-10.8,weight:1.5,def:0.68,shieldCool:132,
    lDmg:8,hDmg:16,lKB:10,hKB:21,lSU:6,hSU:18,lAct:10,hAct:15,lEl:10,hEl:28,
    lSz:52,lRch:60,hSz:72,hRch:77 };

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



