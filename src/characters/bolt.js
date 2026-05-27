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
  const a = player.atk;
  if(!a) return;
  const inAct = a.frame>=a.su && a.frame<a.su+a.act;
  // Spawn knuckle spark particles on first active frame of each punch
  if(inAct && a.frame===a.su) {
    const px = player.cx + player.facing*(player.w*0.6);
    const py = player.cy - player.h*0.1;
    for(let i=0;i<6;i++){
      const ang=Math.random()*Math.PI*2, spd=3+Math.random()*4;
      particles.push({x:px,y:py,vx:Math.cos(ang)*spd+player.facing*2,vy:Math.sin(ang)*spd-1,life:14,max:14,col:i%2?'#00ffff':'#ffffff',sz:2+Math.random()*2});
    }
    // Electric arc ring
    particles.push({x:px,y:py,vx:0,vy:0,life:8,max:8,col:'#00ffff',sz:4,ring:true,ringR:0});
  }
  // Heavy startup: charge crackle particles
  if(a.type==='heavy' && a.frame<a.su && a.frame%4===0){
    const px=player.cx+player.facing*player.w*0.3, py=player.cy;
    const ang=Math.random()*Math.PI*2;
    particles.push({x:px,y:py,vx:Math.cos(ang)*2,vy:Math.sin(ang)*2-1,life:10,max:10,col:'#00ffff',sz:1.5+Math.random()*2});
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
  const dir=atk?atk.dir:null;
  const heavy=atk&&atk.type==='heavy';
  const cn=atk&&atk.comboN||0;
  // Punchy energetic bob — uses raw sine so footfall sparks land on the correct frame
  const bob=grounded?Math.sin(wf*Math.PI/2)*2:0;
  const swing=grounded?Math.sin(wf*Math.PI/2)*7:0,by2=by+bob;
  const ll=grounded?(wf<2?5:-5):0;
  // Aerial: tuck legs up, arms spread wide for a dynamic jump pose
  const airTuck=grounded?0:Math.min(1,(G.frame%60)/15);
  const airArmSpread=grounded?0:Math.sin(G.frame*0.08)*3;
  if(grounded){ctx.fillStyle='rgba(0,0,0,0.25)';ctx.beginPath();ctx.ellipse(0,h/2+3,w*0.45,5,0,0,Math.PI*2);ctx.fill();}
  // Legs tuck up toward body when airborne
  const legY=grounded?by2+h*0.62:by2+h*(0.62-0.12*airTuck);
  const legH=grounded?h*0.32:h*(0.32-0.1*airTuck);
  rrFill(bx+6,legY+ll,14,legH,4,ch.accent);rrFill(bx+w-20,legY-ll,14,legH,4,ch.accent);
  ctx.fillStyle='#222';ctx.beginPath();ctx.ellipse(bx+13,legY+legH+ll/2,10,5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#222';ctx.beginPath();ctx.ellipse(bx+w-13,legY+legH-ll/2,10,5,0,0,Math.PI*2);ctx.fill();
  // Electric spark on footfall (wf transition at 0 and 2 = foot strikes ground)
  if(grounded&&(wf===0||wf===2)){
    const fxSide=wf===0?1:-1;
    const fxX=fxSide>0?(bx+w-13):(bx+13);
    const fxY=by2+h*0.94;
    ctx.save();ctx.globalAlpha=0.7;
    for(let i=0;i<4;i++){
      const a=(i/4)*Math.PI-Math.PI*0.5;
      ctx.strokeStyle=ch.eyeCol;ctx.lineWidth=1.5;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(fxX+Math.cos(a)*3,fxY+Math.sin(a)*3);ctx.lineTo(fxX+Math.cos(a)*9,fxY+Math.sin(a)*9);ctx.stroke();
    }
    ctx.fillStyle=ch.eyeCol;ctx.beginPath();ctx.arc(fxX,fxY,2.5,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  // Body — endlag: lean back (recoil from punch), heavy endlag: deeper backward stagger
  const elBodyLean = inEl ? (heavy ? -0.18*(1-tEl) : -0.1*(1-tEl)) : 0;
  // Startup: body leans forward into punch wind-up
  const suBodyLean = inSU && dir==='side' ? 0.12*tSU : 0;
  rrFill(bx+4,by2+h*0.36,w-8,h*0.36,9,ch.color);rrFill(bx+8,by2+h*0.38,w-16,h*0.09,4,ch.hi);
  // Eye flashes white on active
  ctx.fillStyle=inAct?'#fff':ch.eyeCol;ctx.beginPath();ctx.arc(0,by2+h*0.51,6,0,Math.PI*2);ctx.fill();

  // Startup wind-up: active arm cocks back (combo 1 = right arm, combo 2 = left arm)
  const punchRight = !heavy || dir!=='side' ? cn!==2 : true;
  const activeCol = inAct?'#fff':ch.accent;

  // Left arm
  ctx.save();ctx.translate(bx+2,by2+h*0.39+swing*0.4-airArmSpread);
  let lRot = swing*0.04+(!grounded?-0.2:0);
  if(inSU && dir==='side' && !punchRight) lRot -= 0.5*tSU; // wind-up: cock left arm back
  if(inSU && dir==='up') lRot -= 0.4*tSU;
  if(inAct && dir==='up') lRot = -0.4;
  if(inEl && dir==='side' && !punchRight) lRot = -0.15*(1-tEl); // endlag recoil
  ctx.rotate(lRot+elBodyLean+suBodyLean);
  rrFill(-12,0,12,h*0.28,5,ch.color);
  ctx.fillStyle=(!punchRight&&inAct)?'#fff':ch.accent;
  ctx.beginPath();ctx.arc(-6,h*0.28,8,0,Math.PI*2);ctx.fill();
  // Knuckle flash on punch frame (first 3 frames of active, left arm combo 2)
  if(!punchRight&&inAct&&tAct<0.35){
    ctx.save();ctx.shadowBlur=18;ctx.shadowColor=ch.eyeCol;ctx.globalAlpha=1-tAct*2.5;
    ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(-6,h*0.28+8,10,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Right arm
  ctx.save();ctx.translate(bx+w-2,by2+h*0.39-swing*0.4+airArmSpread);
  if(inSU){
    if(dir==='side' && punchRight){ctx.rotate(-0.4*tSU);ctx.translate(-8*tSU,0);} // wind-up cocks back
    else if(dir==='up'){ctx.rotate(-0.5*tSU);ctx.translate(0,-10*tSU);}
    else if(dir==='down'){ctx.rotate(0.4*tSU);ctx.translate(4*tSU,8*tSU);}
    else{ctx.rotate(0.2*tSU);}
  } else if(inAct){
    if(dir==='side'){ctx.rotate(0.6);ctx.translate(20,-6);}
    else if(dir==='up'){ctx.rotate(-1.4);ctx.translate(4,-18);}
    else if(dir==='down'){ctx.rotate(1.7);ctx.translate(5,14);}
    else{ctx.rotate(0.3);ctx.translate(8,-4);}
  } else if(inEl){
    // Endlag: arm drops/recoils
    if(dir==='side'&&punchRight){ctx.rotate(0.3*(1-tEl));ctx.translate(10*(1-tEl),-3*(1-tEl));}
    else if(dir==='up'){ctx.rotate(-0.5*(1-tEl));}
    else if(dir==='down'){ctx.rotate(0.6*(1-tEl));}
  } else {
    ctx.rotate(-swing*0.04);
  }
  ctx.rotate(elBodyLean+suBodyLean);
  rrFill(0,0,12,h*0.28,5,ch.color);
  ctx.fillStyle=punchRight&&inAct?'#fff':ch.accent;
  ctx.beginPath();ctx.arc(6,h*0.28,8,0,Math.PI*2);ctx.fill();
  // Knuckle flash on punch frame (first 3 frames of active, right arm combo 1)
  if(punchRight&&inAct&&tAct<0.35){
    ctx.save();ctx.shadowBlur=18;ctx.shadowColor=ch.eyeCol;ctx.globalAlpha=1-tAct*2.5;
    ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(6,h*0.28+8,10,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Speed lines on active side punch
  if(inAct&&dir==='side'&&tAct<0.5){
    ctx.save();ctx.globalAlpha=(0.6-tAct)*0.8;ctx.strokeStyle=ch.eyeCol;ctx.lineWidth=2;ctx.lineCap='round';
    for(let i=0;i<4;i++){
      const ly=by2+h*(0.38+i*0.07);
      ctx.beginPath();ctx.moveTo(bx+w+8+i*4,ly);ctx.lineTo(bx+w+28+i*8,ly);ctx.stroke();
    }
    ctx.restore();
  }

  // Head — leans with body during attack
  ctx.save();ctx.rotate(elBodyLean*0.5+suBodyLean*0.5);
  ctx.fillStyle=ch.color;ctx.beginPath();ctx.ellipse(0,by2+h*0.2,w*0.42,h*0.22,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=ch.hi;ctx.beginPath();ctx.ellipse(-4,by2+h*0.13,w*0.28,h*0.1,-0.3,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=0.9;rrFill(-w*0.28,by2+h*0.16,w*0.56,h*0.1,4,inAct?'#fff':ch.eyeCol);ctx.globalAlpha=1;
  ctx.fillStyle='#002244';ctx.beginPath();ctx.arc(-8,by2+h*0.21,3.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#002244';ctx.beginPath();ctx.arc(8,by2+h*0.21,3.5,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=ch.accent;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,by2+h*0.03);ctx.lineTo(7,by2-h*0.04);ctx.stroke();
  ctx.fillStyle=ch.eyeCol;ctx.beginPath();ctx.arc(7,by2-h*0.04,4,0,Math.PI*2);ctx.fill();
  ctx.restore();
}


