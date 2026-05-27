import { ctx, W, H, bullets, miniSwords, rocketArms, rocketMines, smokeClouds, unstableHeads, knives, throwSwords, firePebbles, pristineRockets, factoryBolts, factoryGears, factoryZaps, particles, aabb, sameTeam } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, addDeathExplosion, instakill, rrFill, rrStroke, rrPath } from '../particles.js';
import { MAX_KB, DEATH_THRESHOLD, FLY_ACCEL, MAX_FLY_SPEED, FLY_FRIC, DASH_FRAMES, DASH_MULT } from '../player/constants.js';
import { kbScale, playSfx, playSfxNoise } from '../audio.js';

export const char = { id:13,name:'GLITCH',tag:'The Phantom',
    desc:['Side/Up light: teleport arm strike','Down light: phase (2.5s invincibility)','Side heavy: random stolen weapon'],
    color:'#ff88cc',accent:'#cc4488',eyeCol:'#ffffff',hi:'#ffccee',
    w:40,h:50,speed:8.5,jumpF:-14.5,djF:-13.0,weight:0.7,def:1.10,shieldCool:96,
    lDmg:5,hDmg:10,lKB:5,hKB:11,
    lSU:3,hSU:12,lAct:18,hAct:10,lEl:8,hEl:20,
    lSz:24,lRch:70,hSz:30,hRch:30,
    teleArmRange:75 };

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
  const inAct=atk&&atk.frame>=atk.su&&atk.frame<atk.su+atk.act;
  const inSU=atk&&atk.frame<atk.su;
  const dir=atk?atk.dir:null;
  const heavy=atk&&atk.type==='heavy';
  const tAct=atk&&inAct?(atk.frame-atk.su)/Math.max(atk.act,1):0;
  const bob=grounded?Math.sin(wf*Math.PI/2)*1.5:0, by2=by+bob;
  // Teleport-step: at step transition (wf 0 and 2), body briefly displaces with glitch artifact
  const stepGlitch=grounded&&!atk&&(wf===0||wf===2);
  const glitchStepX=stepGlitch?(wf===0?4:-4):0;
  const glitchStepAlpha=stepGlitch?0.4:0;
  // Aerial: body glitches more intensely — random micro-teleports and signal-loss flickers
  const airGlitch=!grounded&&!atk;
  const airGlitchX=0;
  const airGlitchY=0;
  const airFootGlow=!grounded; // feet pulse with teleport energy
  const ghost=extra.glitchGhost||false;
  const phased=extra.glitchPhaseTimer>0;
  const gw=extra.glitchWeapon;

  // Ghost state: render faintly
  if(ghost){
    ctx.globalAlpha=0.08+Math.random()*0.06;
    ctx.shadowBlur=18; ctx.shadowColor=ch.eyeCol;
  }
  // Phase state: pulsing pink glow
  if(phased){
    const pulse=Math.abs(Math.sin(wf*0.18));
    ctx.shadowBlur=14+pulse*12; ctx.shadowColor=ch.color;
    ctx.globalAlpha=0.55+pulse*0.35;
  }

  // Glitch body flicker: randomly offset small fragments in startup/active
  const glitchFlicker=(!ghost&&!phased&&atk&&(inSU||inAct)&&Math.random()<0.35);
  if(glitchFlicker){ctx.save();ctx.translate((Math.random()-0.5)*6,(Math.random()-0.5)*4);}

  // Shadow
  if(grounded&&!ghost){ctx.fillStyle='rgba(0,0,0,0.22)';ctx.beginPath();ctx.ellipse(0,h/2+4,w*0.44,5,0,0,Math.PI*2);ctx.fill();}

  // Teleport-step ghost: faint afterimage offset opposite direction of glitch snap
  if(stepGlitch){
    ctx.save();ctx.globalAlpha=glitchStepAlpha;ctx.translate(-glitchStepX*2,0);
    ctx.fillStyle=ch.color;rrPath(bx+4,by2+h*0.36,w-8,h*0.38,9);ctx.fill();
    ctx.restore();
  }
  // Apply glitch step OR aerial glitch displacement to whole character
  if(stepGlitch){ctx.save();ctx.translate(glitchStepX,0);}
  else if(airGlitch){ctx.save();ctx.translate(airGlitchX,airGlitchY);}

  // Legs (thin, fast)
  const ll=grounded?(wf<2?3:-3):0;
  rrFill(bx+5,by2+h*0.68,12,h*0.28+ll,4,ch.accent);
  rrFill(bx+w-17,by2+h*0.68,12,h*0.28-ll,4,ch.accent);
  // Foot glow — pulses with teleport energy when airborne
  if(airFootGlow){ctx.save();ctx.shadowBlur=14+Math.sin(G.frame*0.3)*6;ctx.shadowColor=ch.eyeCol;}
  ctx.fillStyle=airFootGlow?ch.eyeCol:ch.accent;
  ctx.beginPath();ctx.ellipse(bx+11,by2+h*0.96+ll/2,10,4,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(bx+w-11,by2+h*0.96-ll/2,10,4,0,0,Math.PI*2);ctx.fill();
  if(airFootGlow){ctx.restore();}

  // Body (sleek, thin robot)
  rrFill(bx+4,by2+h*0.36,w-8,h*0.38,9,ch.color);
  // Chest accent stripe
  rrFill(bx+w*0.3,by2+h*0.40,w*0.4,h*0.14,4,ch.accent);
  // Glitching body segments: random rect flickers
  if(inAct||inSU){
    ctx.save();
    ctx.globalAlpha=(ctx.globalAlpha||1)*0.7;
    const gx=bx+4+Math.random()*(w-12), gy=by2+h*0.38+Math.random()*h*0.28;
    ctx.fillStyle=Math.random()<0.5?ch.eyeCol:ch.hi;
    ctx.fillRect(gx,gy,4+Math.random()*14,2+Math.random()*6);
    ctx.restore();
  }

  // Arms (attached, thin)
  if(!inAct||(dir!=='side'&&dir!=='neutral'&&dir!=='up'&&dir!=='down')||heavy){
    // Normal arms
    rrFill(bx-4,by2+h*0.38,8,h*0.26,4,ch.accent);       // left arm
    rrFill(bx+w-4,by2+h*0.38,8,h*0.26,4,ch.accent);      // right arm
  } else if(dir==='up'&&!heavy){
    // Up light: arm stubs only (arms are away)
    rrFill(bx-4,by2+h*0.38,8,10,4,ch.accent);
    rrFill(bx+w-4,by2+h*0.38,8,10,4,ch.accent);
    // Teleported arms drawn in world space (detached)
    const tar=ch.teleArmRange||150;
    ctx.save();
    ctx.shadowBlur=16; ctx.shadowColor=ch.eyeCol;
    ctx.fillStyle=ch.accent;
    // Left arm at -tar y
    rrFill(-20,-tar-16,16,28,4,ch.accent);
    ctx.fillStyle=ch.eyeCol; ctx.fillRect(-16,-tar-8,8,4);
    // Right arm at -tar y
    rrFill(4,-tar-16,16,28,4,ch.accent);
    ctx.fillStyle=ch.eyeCol; ctx.fillRect(8,-tar-8,8,4);
    // Portal effect at each arm
    ctx.strokeStyle=ch.eyeCol; ctx.lineWidth=2; ctx.globalAlpha=0.5+tAct*0.4;
    ctx.beginPath();ctx.arc(-12,-tar-2,14,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(12,-tar-2,14,0,Math.PI*2);ctx.stroke();
    ctx.shadowBlur=0; ctx.restore();
  } else if(dir==='down'&&!heavy){
    // Down light: arm stubs only (arms are below)
    rrFill(bx-4,by2+h*0.38,8,10,4,ch.accent);
    rrFill(bx+w-4,by2+h*0.38,8,10,4,ch.accent);
    // Teleported arms drawn in world space (detached, below)
    const tar=ch.teleArmRange||150;
    ctx.save();
    ctx.shadowBlur=16; ctx.shadowColor=ch.eyeCol;
    ctx.fillStyle=ch.accent;
    // Left arm at +tar y
    rrFill(-20,tar-12,16,28,4,ch.accent);
    ctx.fillStyle=ch.eyeCol; ctx.fillRect(-16,tar-4,8,4);
    // Right arm at +tar y
    rrFill(4,tar-12,16,28,4,ch.accent);
    ctx.fillStyle=ch.eyeCol; ctx.fillRect(8,tar-4,8,4);
    // Portal effect at each arm
    ctx.strokeStyle=ch.eyeCol; ctx.lineWidth=2; ctx.globalAlpha=0.5+tAct*0.4;
    ctx.beginPath();ctx.arc(-12,tar+2,14,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(12,tar+2,14,0,Math.PI*2);ctx.stroke();
    ctx.shadowBlur=0; ctx.restore();
  } else if((dir==='side'||dir==='neutral')&&!heavy){
    // Side light: one arm stump (the active arm is teleported)
    rrFill(bx-4,by2+h*0.38,8,10,4,ch.accent); // left stub
    rrFill(bx+w-4,by2+h*0.38,8,10,4,ch.accent); // right stub
    // Teleported arm in world space: always draw to the right in local (+facing handled by scale)
    const tar=ch.teleArmRange||150;
    ctx.save();
    ctx.shadowBlur=18; ctx.shadowColor=ch.eyeCol;
    rrFill(tar-8,-8,20,28,5,ch.accent);
    ctx.fillStyle=ch.eyeCol; ctx.fillRect(tar-4,-4,12,4);
    // Portal ring at departure and arrival
    ctx.strokeStyle=ch.eyeCol; ctx.lineWidth=2; ctx.globalAlpha=(0.4+tAct*0.5);
    ctx.beginPath();ctx.arc(tar+2,8,16,0,Math.PI*2);ctx.stroke();
    ctx.shadowBlur=0; ctx.restore();
  }

  // Head (small, round)
  rrFill(bx+6,by2+2,w-12,h*0.28,8,ch.color);
  // Antenna: glitching flicker
  if(!ghost){
    ctx.strokeStyle=ch.accent; ctx.lineWidth=2;
    const aOff=inAct?Math.sin(atk.frame*1.8)*4:0;
    ctx.beginPath();ctx.moveTo(0,by2+4);ctx.lineTo(aOff,by2-14);ctx.stroke();
    ctx.fillStyle=ch.eyeCol;ctx.shadowBlur=8;ctx.shadowColor=ch.eyeCol;
    ctx.beginPath();ctx.arc(aOff,by2-14,3,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
  }
  // Eyes (glowing white/pink)
  ctx.shadowBlur=12; ctx.shadowColor=ch.eyeCol;
  ctx.fillStyle=ch.eyeCol;
  ctx.beginPath();ctx.arc(bx+w*0.33,by2+h*0.14,4,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(bx+w*0.67,by2+h*0.14,4,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;

  // Down heavy: reappear flash on final active G.frame
  if(heavy&&dir==='down'&&atk&&atk.frame===atk.su+atk.act-1){
    ctx.save();
    ctx.globalAlpha=0.85;
    ctx.shadowBlur=30; ctx.shadowColor=ch.eyeCol;
    ctx.fillStyle=ch.eyeCol;
    ctx.beginPath();ctx.arc(0,0,w*0.8,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  // Side heavy startup: stolen weapon materialising
  if(heavy&&(dir==='side'||dir==='neutral')&&inSU&&gw==='edge'){
    const prog=atk.frame/Math.max(atk.su,1);
    const handX=w*0.5-4, handY=-h*0.12+bob;
    ctx.save();
    ctx.translate(handX,handY);
    ctx.rotate(-Math.PI*0.75);
    ctx.globalAlpha=prog*0.75;
    ctx.shadowBlur=6+prog*22; ctx.shadowColor='#ff88ff';
    ctx.strokeStyle='#ff88ff'; ctx.lineWidth=3+prog*3; ctx.lineCap='round';
    const sLenSU=88*prog;
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,sLenSU);ctx.stroke();
    // Glitch static fragments appearing along the blade
    if(prog>0.4){
      ctx.strokeStyle='#ffffff'; ctx.lineWidth=1.5; ctx.globalAlpha=prog*0.5;
      for(let i=0;i<4;i++){
        const fy2=sLenSU*(0.15+i*0.2);
        ctx.beginPath();ctx.moveTo(-5+Math.random()*3,fy2);ctx.lineTo(5-Math.random()*3,fy2+sLenSU*0.12);ctx.stroke();
      }
    }
    ctx.shadowBlur=0; ctx.restore();
  }

  // Side heavy: draw stolen weapon during active
  if(heavy&&(dir==='side'||dir==='neutral')&&inAct&&gw){
    ctx.save();
    ctx.globalAlpha=0.85+Math.random()*0.1;
    ctx.shadowBlur=16; ctx.shadowColor=ch.eyeCol;
    if(gw==='edge'){
      // Edge sword: animated overhead swing arc matching Edge's actual attack
      const handX=w*0.5-4, handY=-h*0.12+bob;
      ctx.save();
      ctx.translate(handX,handY);
      const sLen=88;
      const swordAng=-Math.PI*0.75+tAct*Math.PI*1.5;
      ctx.rotate(swordAng);
      ctx.shadowBlur=22; ctx.shadowColor='#ff88ff';
      // Blade
      ctx.strokeStyle='#ffffff'; ctx.lineWidth=5; ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,sLen);ctx.stroke();
      // Highlight shimmer
      ctx.strokeStyle='#dd99ff'; ctx.lineWidth=2; ctx.globalAlpha=0.65;
      ctx.beginPath();ctx.moveTo(0,4);ctx.lineTo(0,sLen*0.85);ctx.stroke();
      ctx.globalAlpha=0.85+Math.random()*0.1;
      // Guard
      ctx.shadowBlur=10; ctx.strokeStyle='#881acc'; ctx.lineWidth=7; ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(-9,2);ctx.lineTo(9,2);ctx.stroke();
      // Tip
      ctx.shadowBlur=18; ctx.shadowColor='#ffffff'; ctx.fillStyle='#ffffff';
      ctx.beginPath();ctx.moveTo(-4,sLen);ctx.lineTo(4,sLen);ctx.lineTo(0,sLen+13);ctx.closePath();ctx.fill();
      // Swing trail
      ctx.shadowBlur=0; ctx.strokeStyle='#ff88ff'; ctx.lineWidth=3;
      ctx.globalAlpha=0.4*(1-tAct);
      ctx.beginPath();ctx.arc(0,0,sLen*0.82,-Math.PI*0.75,swordAng);ctx.stroke();
      ctx.restore();
    } else if(gw==='pierce'){
      // Pierce spear: long horizontal shaft
      ctx.strokeStyle='#00dddd'; ctx.lineWidth=5; ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(-w*0.2,0);ctx.lineTo(w*1.6,0);ctx.stroke();
      ctx.fillStyle='#00eeee';
      ctx.beginPath();ctx.moveTo(w*1.6,-6);ctx.lineTo(w*1.6+16,0);ctx.lineTo(w*1.6,6);ctx.closePath();ctx.fill();
    } else if(gw==='blaster'){
      // Blaster gun: small barrel shape
      rrFill(w*0.3,-8,w*0.9,16,5,'#00cc77');
      rrFill(w*1.1,-5,18,10,3,'#007744');
      ctx.shadowBlur=10; ctx.shadowColor='#00ffaa';
      ctx.fillStyle='#00ffaa';ctx.beginPath();ctx.arc(w*1.25,0,4,0,Math.PI*2);ctx.fill();
    }
    ctx.shadowBlur=0; ctx.restore();
  }

  // Up heavy: warp portal effect during startup
  if(heavy&&dir==='up'&&inSU){
    const prog=atk.frame/Math.max(atk.su,1);
    ctx.save();
    ctx.globalAlpha=prog*0.7;
    ctx.shadowBlur=20; ctx.shadowColor=ch.eyeCol;
    ctx.strokeStyle=ch.eyeCol; ctx.lineWidth=3;
    ctx.beginPath();ctx.ellipse(0,0,w*0.6*prog,h*0.7*prog,0,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }

  if(glitchFlicker) ctx.restore();
  if(stepGlitch||airGlitch) ctx.restore(); // end step/air glitch displacement
  ctx.shadowBlur=0; ctx.globalAlpha=1;
}



