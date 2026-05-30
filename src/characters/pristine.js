import { ctx, W, H, bullets, miniSwords, rocketArms, rocketMines, smokeClouds, unstableHeads, knives, throwSwords, firePebbles, pristineRockets, factoryBolts, factoryGears, factoryZaps, particles, aabb, sameTeam } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, addDeathExplosion, instakill, rrFill, rrStroke, rrPath } from '../particles.js';
import { MAX_KB, DEATH_THRESHOLD, FLY_ACCEL, MAX_FLY_SPEED, FLY_FRIC, DASH_FRAMES, DASH_MULT } from '../player/constants.js';
import { kbScale, playSfx, playSfxNoise } from '../audio.js';
import { PristineRocket } from './pristine_projectiles.js';

export const char = { id:10,name:'PRISTINE',tag:'The Aerial Sentinel',
    desc:['Hold W/↑ in air to fly (3s)','Side+Heavy: homing rocket','Down+Heavy: laser shield'],
    color:'#ffffff',accent:'#000000',eyeCol:'#00ffff',hi:'#aaffff',
    w:44,h:56,speed:6.0,jumpF:-13.5,djF:-12.0,weight:1.0,def:0.92,shieldCool:96,
    lDmg:6,hDmg:12,lKB:5,hKB:11,lSU:3,hSU:20,lAct:6,hAct:12,lEl:6,hEl:16,
    lSz:10,lRch:10,hSz:10,hRch:10,
    lightBeamRange:175,beamSpd:14,
    signatureCombo:{firstType:'light',firstDir:'up',followType:'heavy',followDir:'side'} };

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
  const heavy=atk&&atk.type==='heavy';
  // Glide walk: very smooth sine bob, barely touches ground, feet hover slightly
  const bob=grounded?Math.sin(wf*Math.PI/2)*1.5:0, by2=by+bob;
  const ll=grounded?(wf<2?3:-3):0; // feet barely separate
  const swing=grounded?Math.sin(wf*Math.PI/2)*5:0;
  // Wing fin flap angle changes with wf — gentle up/down
  const finFlap=grounded?Math.sin(wf*Math.PI/2)*0.3:Math.sin(G.frame*0.08)*0.35;
  // Aerial: additional gentle body float, wings spread further
  const airFloat=grounded?0:Math.sin(G.frame*0.07)*2; // secondary body oscillation
  const airWingSpread=grounded?0:8; // fins extend further out
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
  // Wing fins on back — spread wider and pulse in air
  ctx.save();ctx.translate(bx+3,by2+h*0.42+airFloat);ctx.rotate(finFlap);
  const finLen=14+airWingSpread;
  ctx.strokeStyle=`rgba(0,255,255,${grounded?0.35:0.55})`;ctx.lineWidth=2;
  ctx.fillStyle=`rgba(0,255,255,${grounded?0.08:0.15})`;
  ctx.shadowBlur=grounded?0:12;ctx.shadowColor='#00ffff';
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-finLen,-8-finFlap*10);ctx.lineTo(-10,10);ctx.closePath();
  ctx.fill();ctx.stroke();
  ctx.shadowBlur=0;
  ctx.restore();
}


