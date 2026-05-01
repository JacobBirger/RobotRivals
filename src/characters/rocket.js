import { ctx, W, H, bullets, miniSwords, rocketArms, rocketMines, smokeClouds, unstableHeads, knives, throwSwords, firePebbles, pristineRockets, factoryBolts, factoryGears, factoryZaps, particles, aabb, sameTeam } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, addDeathExplosion, instakill, rrFill, rrStroke, rrPath } from '../particles.js';
import { MAX_KB, DEATH_THRESHOLD, FLY_ACCEL, MAX_FLY_SPEED, FLY_FRIC, DASH_FRAMES, DASH_MULT } from '../player/constants.js';
import { kbScale, playSfx, playSfxNoise } from '../audio.js';
import { RocketArm, RocketMine, explodeMines } from './rocket_projectiles.js';

export const char = { id:6,name:'ROCKET',tag:'The Arm Cannon',
    desc:['Launches arms as projectiles','4-arm ammo system','Mines on down heavy'],
    color:'#ff6600',accent:'#993300',eyeCol:'#ffcc00',hi:'#ffaa44',
    w:50,h:62,speed:5.0,jumpF:-12.3,djF:-10.8,weight:1.0,def:1.00,shieldCool:120,
    lDmg:5,hDmg:10,lKB:5,hKB:11,lSU:4,hSU:12,lAct:6,hAct:8,lEl:4,hEl:22,
    lSz:10,lRch:10,hSz:10,hRch:10 };

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

export function draw(ctx,ch,w,h,atk,grounded,wf,extra){
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



