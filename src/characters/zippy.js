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
  const a = player.atk;
  if(!a) return;
  const ch = player.ch;
  const inAct = a.frame>=a.su && a.frame<a.su+a.act;
  // Active: speed sparks trail behind the strike
  if(inAct && a.frame%2===0){
    const px = player.cx - player.facing*player.w*0.3;
    const py = player.cy - player.h*0.1;
    particles.push({x:px,y:py, vx:-player.facing*(4+Math.random()*3), vy:(Math.random()-.5)*3,
      life:10,max:10, col:Math.random()<0.5?ch.color:ch.eyeCol, sz:2+Math.random()*2});
  }
  // Heavy startup charge crackle
  if(a.type==='heavy' && a.frame<a.su && a.frame%3===0){
    const ang=Math.random()*Math.PI*2;
    particles.push({x:player.cx+Math.cos(ang)*14, y:player.cy+Math.sin(ang)*14,
      vx:Math.cos(ang)*3,vy:Math.sin(ang)*3, life:8,max:8, col:ch.eyeCol, sz:2});
  }
}

export function onRespawn(player) {
  // no cleanup needed
}

export function draw(ctx,ch,w,h,atk,grounded,wf){
  const bx=-w/2,by=-h/2;
  const inAct=atk&&atk.frame>=atk.su&&atk.frame<atk.su+atk.act;
  const inSU=atk&&atk.frame<atk.su;
  const inEl=atk&&atk.frame>=atk.su+atk.act;
  const tSU=inSU?atk.frame/Math.max(atk.su,1):0;
  const tAct=inAct?(atk.frame-atk.su)/Math.max(atk.act,1):0;
  const tEl=inEl?(atk.frame-atk.su-atk.act)/Math.max(atk.el,1):0;
  const heavy=atk&&atk.type==='heavy';
  // Zippy: aggressive forward lean that increases with wf speed, motion blur ghost on high step
  const dir=atk?atk.dir:null,bob=grounded?Math.sin(wf*Math.PI/2)*2.5:0;
  // Lean forward more when mid-stride (wf 1 and 3 = peak swing)
  const leanBase=grounded?Math.sin(wf*Math.PI/2)*0.1:0;
  const lean=leanBase+(grounded&&(wf===1||wf===3)?0.05:0);
  const by2=by+bob,ll=grounded?(wf<2?6:-6):0;
  // Aerial: body spins rapidly (Zippy is so fast it keeps rotating in the air)
  const airSpin=grounded?0:G.frame*0.18; // fast continuous spin
  const airLegTuck=grounded?0:0.15; // legs tuck close to body mid-spin
  // Speed-blur ghost trail at peak stride
  if(grounded&&(wf===1||wf===3)){
    ctx.save();ctx.globalAlpha=0.12;ctx.fillStyle=ch.color;
    ctx.beginPath();ctx.ellipse(-8*(wf===1?-1:1),by2+h*0.4,w*0.38,h*0.28,lean,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  if(grounded){ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.ellipse(0,h/2+3,w*0.43,5,0,0,Math.PI*2);ctx.fill();}
  ctx.save();ctx.rotate(lean+airSpin);
  ctx.strokeStyle=ch.accent;ctx.lineWidth=5;ctx.lineCap='round';
  // Legs tuck up when airborne (wheels retract)
  const wY=grounded?by2+h*0.89:by2+h*(0.89-0.18*1); // tuck wheels up
  const legCurveY=grounded?by2+h*0.79:by2+h*0.72;
  ctx.beginPath();ctx.moveTo(bx+10,by2+h*0.61);ctx.quadraticCurveTo(bx+2,legCurveY,bx+10,wY+ll);ctx.stroke();
  ctx.beginPath();ctx.moveTo(bx+w-10,by2+h*0.61);ctx.quadraticCurveTo(bx+w-2,legCurveY,bx+w-10,wY-ll);ctx.stroke();
  ctx.fillStyle='#333';ctx.beginPath();ctx.arc(bx+10,wY+ll,7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#333';ctx.beginPath();ctx.arc(bx+w-10,wY-ll,7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=ch.accent;ctx.beginPath();ctx.arc(bx+10,wY+ll,3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=ch.accent;ctx.beginPath();ctx.arc(bx+w-10,wY-ll,3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=ch.color;ctx.beginPath();ctx.moveTo(0,by2+h*0.33);ctx.lineTo(bx+w*0.1,by2+h*0.63);ctx.lineTo(bx+w*0.9,by2+h*0.63);ctx.closePath();ctx.fill();
  ctx.fillStyle=ch.hi;ctx.globalAlpha=0.45;ctx.beginPath();ctx.moveTo(0,by2+h*0.37);ctx.lineTo(-w*0.19,by2+h*0.55);ctx.lineTo(w*0.19,by2+h*0.55);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
  ctx.fillStyle=inAct?'#fff':ch.eyeCol;ctx.beginPath();ctx.arc(0,by2+h*0.51,5,0,Math.PI*2);ctx.fill();

  // Startup: body vibrates/blurs with anticipation energy
  if(inSU){
    ctx.save();ctx.globalAlpha=0.25*tSU;ctx.fillStyle=ch.color;
    ctx.beginPath();ctx.ellipse(-6*tSU,by2+h*0.45,w*0.35,h*0.25,lean,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(6*tSU,by2+h*0.45,w*0.35,h*0.25,lean,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  // Active: speed afterimage trails behind the striking arm
  if(inAct&&dir==='side'&&tAct<0.6){
    ctx.save();ctx.globalAlpha=(0.6-tAct)*0.55;ctx.strokeStyle=ch.eyeCol;ctx.lineWidth=2;ctx.globalAlpha=0.4;
    for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-w*0.4,by2+h*(0.38+i*0.08));ctx.lineTo(-w*0.9-i*8,by2+h*(0.38+i*0.08));ctx.stroke();}
    ctx.restore();
  }

  // Endlag: skid pose — body tips back, arms flung out
  const elLean = inEl&&dir==='side' ? -0.18*(1-tEl) : inEl&&heavy ? -0.22*(1-tEl) : 0;

  ctx.strokeStyle=ch.color;ctx.lineWidth=7;ctx.lineCap='round';

  // Left arm
  ctx.save();ctx.translate(bx+6,by2+h*0.43);
  let lRot = inAct&&dir==='up'?-0.5:-0.2;
  if(inSU&&dir==='side'){lRot=-0.5*tSU;} // arm cocks back in SU
  if(inEl){lRot=-0.4*(1-tEl)+elLean;} // flings back in endlag
  ctx.rotate(lRot);
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-10,h*0.22);ctx.stroke();
  ctx.fillStyle=inEl?ch.hi:ch.accent;ctx.beginPath();ctx.arc(-10,h*0.22,6,0,Math.PI*2);ctx.fill();
  ctx.restore();

  // Right arm
  ctx.save();ctx.translate(bx+w-6,by2+h*0.43);
  if(inSU){
    if(dir==='side'){ctx.rotate(0.4*tSU);ctx.translate(8*tSU,-4*tSU);} // wind-up
    else if(dir==='up'){ctx.rotate(-0.8*tSU);ctx.translate(0,-12*tSU);}
    else if(dir==='down'){ctx.rotate(0.6*tSU);ctx.translate(0,8*tSU);}
    else{ctx.rotate(0.3*tSU);}
  } else if(inAct){
    if(dir==='side'){ctx.rotate(0.6);ctx.translate(16,0);}
    else if(dir==='up'){ctx.rotate(-1.6);ctx.translate(0,-18);}
    else if(dir==='down'){ctx.rotate(1.7);ctx.translate(0,12);}
    else{ctx.rotate(0.5);ctx.translate(10,0);}
  } else if(inEl){
    ctx.rotate(0.5*(1-tEl)+elLean);ctx.translate(6*(1-tEl),4*(1-tEl));
  } else {ctx.rotate(0.2);}
  ctx.strokeStyle=ch.color;ctx.lineWidth=7;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(10,h*0.22);ctx.stroke();

  // Active kick flash on first frames
  if(inAct&&tAct<0.3){
    ctx.save();ctx.shadowBlur=14;ctx.shadowColor=ch.eyeCol;ctx.globalAlpha=1-tAct*3;
    ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(10,h*0.22,10,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle=inAct?'#fff':ch.accent;ctx.beginPath();ctx.arc(10,h*0.22,6,0,Math.PI*2);ctx.fill();
  ctx.restore();
  ctx.fillStyle=ch.accent;ctx.beginPath();ctx.ellipse(0,by2+h*0.18,w*0.43,h*0.21,0,0,Math.PI);ctx.fill();
  ctx.fillStyle=ch.color;ctx.beginPath();ctx.ellipse(0,by2+h*0.22,w*0.39,h*0.19,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=0.95;rrFill(-w*0.23,by2+h*0.17,w*0.46,h*0.1,5,inAct?'#fff':ch.eyeCol);ctx.globalAlpha=1;
  ctx.fillStyle=inAct?ch.eyeCol:'#220044';ctx.beginPath();ctx.arc(0,by2+h*0.22,5,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=ch.eyeCol;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,by2+h*0.04);ctx.lineTo(0,by2-h*0.03);ctx.lineTo(8,by2-h*0.1);ctx.stroke();
  ctx.fillStyle=ch.eyeCol;ctx.beginPath();ctx.arc(8,by2-h*0.1,3,0,Math.PI*2);ctx.fill();
  ctx.restore();
}


