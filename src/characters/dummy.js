import { ctx, W, H, bullets, miniSwords, rocketArms, rocketMines, smokeClouds, unstableHeads, knives, throwSwords, firePebbles, pristineRockets, factoryBolts, factoryGears, factoryZaps, particles, aabb, sameTeam } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, addDeathExplosion, instakill, rrFill, rrStroke, rrPath } from '../particles.js';
import { MAX_KB, DEATH_THRESHOLD, FLY_ACCEL, MAX_FLY_SPEED, FLY_FRIC, DASH_FRAMES, DASH_MULT } from '../player/constants.js';
import { kbScale, playSfx, playSfxNoise } from '../audio.js';

export const char = {
  id:9,name:'DUMMY',tag:'Training Bot',desc:['Stands still','Does not attack','Infinite respawns'],
  color:'#888',accent:'#555',eyeCol:'#aaa',hi:'#aaa',
  w:48,h:58,speed:0,jumpF:0,djF:0,weight:1.0,def:1.0,shieldCool:120,
  lDmg:0,hDmg:0,lKB:0,hKB:0,lSU:99,hSU:99,lAct:1,hAct:1,lEl:99,hEl:99,
  lSz:10,lRch:10,hSz:10,hRch:10
};

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

export function draw(ctx,ch,w,h){
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


