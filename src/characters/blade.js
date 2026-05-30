import { ctx, W, H, bullets, miniSwords, rocketArms, rocketMines, smokeClouds, unstableHeads, knives, throwSwords, firePebbles, pristineRockets, factoryBolts, factoryGears, factoryZaps, particles, aabb, sameTeam } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, addDeathExplosion, instakill, rrFill, rrStroke, rrPath } from '../particles.js';
import { MAX_KB, DEATH_THRESHOLD, FLY_ACCEL, MAX_FLY_SPEED, FLY_FRIC, DASH_FRAMES, DASH_MULT } from '../player/constants.js';
import { kbScale, playSfx, playSfxNoise } from '../audio.js';
import { Knife, ThrowSword, FirePebble } from './blade_projectiles.js';

export const char = { id:8,name:'BLADE',tag:'The Knife Fighter',
    desc:['2-hit jab+knife combo','Side heavy: sword swing+throw','Down heavy: double knife spread'],
    color:'#88bbdd',accent:'#334466',eyeCol:'#cceeff',hi:'#aaccee',
    w:42,h:52,speed:7.5,jumpF:-14.7,djF:-13.2,weight:0.9,def:1.08,shieldCool:96,
    lDmg:4,hDmg:8,lKB:4,hKB:9,lSU:3,hSU:11,lAct:7,hAct:12,lEl:6,hEl:18,
    lSz:38,lRch:72,hSz:56,hRch:105, maxCombo:2,
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
  const inSU=atk&&atk.frame<atk.su;
  const dir=atk?atk.dir:null;
  const heavy=atk&&atk.type==='heavy';
  const tAct=atk&&inAct?(atk.frame-atk.su)/Math.max(atk.act,1):0;
  const tSU=atk&&inSU?atk.frame/Math.max(atk.su,1):0;
  const half=atk?Math.floor(atk.act/2):0;
  const phase2=atk&&inAct&&atk.frame>=atk.su+half;
  // Crouched knife-ready walk: low center of gravity, subtle bob, body sunk 4px
  const crouchOffset=grounded&&!atk?4:0;
  const bob=grounded?Math.sin(wf*Math.PI/2)*1.2:0;
  const swing=grounded?Math.sin(wf*Math.PI/2)*5:0;
  const by2=by+bob+crouchOffset;
  const ll=grounded?(wf<2?4:-4):0;
  // Aerial: both arms extend forward with knives raised, legs tuck tight
  const airKnifeReady=grounded?0:1; // flag: raise knives into forward-ready position
  const airLegTuck=grounded?0:7; // legs pull up
  const airBodyHunch=grounded?0:-3; // body hunches forward
  if(grounded){ctx.fillStyle='rgba(0,0,0,0.22)';ctx.beginPath();ctx.ellipse(0,h/2+3,w*0.43,5,0,0,Math.PI*2);ctx.fill();}
  // Legs — tuck up when airborne (knife-ready crouch)
  rrFill(bx+5,by2+h*0.65-airLegTuck,12,h*0.3+ll,4,ch.accent);rrFill(bx+w-17,by2+h*0.65-airLegTuck,12,h*0.3-ll,4,ch.accent);
  ctx.fillStyle='#112233';ctx.beginPath();ctx.ellipse(bx+11,by2+h*0.94+ll/2-airLegTuck,8,4,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#112233';ctx.beginPath();ctx.ellipse(bx+w-11,by2+h*0.94-ll/2-airLegTuck,8,4,0,0,Math.PI*2);ctx.fill();
  // Torso (slim) — hunch forward when airborne
  rrFill(bx+5,by2+h*0.35+airBodyHunch,w-10,h*0.36,7,ch.color);
  rrFill(bx+8,by2+h*0.37+airBodyHunch,w-16,h*0.08,3,ch.hi);
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
  // Left arm + knife — arm extends forward, knife angled ahead when airborne
  const isSideLight=!heavy&&(dir==='side'||dir==='neutral');
  const lkAng=inAct&&!heavy&&dir==='down'?(-Math.PI*0.65+tAct*Math.PI*0.95):inAct&&!heavy&&dir==='up'?-Math.PI*0.65:inSU&&isSideLight?-Math.PI*0.45*tSU:inSU&&!heavy&&dir==='down'?-Math.PI*0.65*tSU:(airKnifeReady?-Math.PI*0.25:0);
  ctx.save();ctx.translate(bx+2,by2+h*0.4+swing*0.4+airBodyHunch);
  if(inSU&&isSideLight){ctx.translate(-4*tSU,0);}
  if(airKnifeReady&&!atk){ctx.translate(-5,-4);} // arm pushes forward in air
  rrFill(-13,0,13,h*0.25,4,ch.color);ctx.fillStyle=ch.accent;ctx.beginPath();ctx.arc(-6,h*0.25,7,0,Math.PI*2);ctx.fill();ctx.restore();
  drawKnife(bx-4+(airKnifeReady&&!atk?-5:0),by2+h*0.5+swing*0.4+airBodyHunch,lkAng,inAct&&isSideLight?16:12,inAct&&isSideLight);
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



