import { ctx, W, H, bullets, miniSwords, rocketArms, rocketMines, smokeClouds, unstableHeads, knives, throwSwords, firePebbles, pristineRockets, factoryBolts, factoryGears, factoryZaps, particles, aabb, sameTeam } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, addDeathExplosion, instakill, rrFill, rrStroke, rrPath } from '../particles.js';
import { MAX_KB, DEATH_THRESHOLD, FLY_ACCEL, MAX_FLY_SPEED, FLY_FRIC, DASH_FRAMES, DASH_MULT } from '../player/constants.js';
import { kbScale, playSfx, playSfxNoise } from '../audio.js';
import { FirePebble } from './blade_projectiles.js';

export const char = { id:11,name:'MAGMA',tag:'The Inferno',
    desc:['Hold light: flamethrower (3s fuel)','Side+Heavy: exploding fire pebble','Heavy & hard-hitting'],
    color:'#111111',accent:'#cc2200',eyeCol:'#ff4400',hi:'#442211',
    w:54,h:66,speed:4.5,jumpF:-12.3,djF:-10.8,weight:1.4,def:0.72,shieldCool:132,
    lDmg:3,hDmg:12,lKB:3,hKB:13,lSU:5,hSU:14,lAct:8,hAct:12,lEl:10,hEl:24,
    lSz:12,lRch:12,hSz:14,hRch:14,
    flameFuelMax:90,flameRange:220,flameRechargeRate:0.75 };

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
  const bob=grounded?Math.sin(wf*Math.PI/2)*1.5:0, by2=by+bob;
  const ll=grounded?(wf<2?4:-4):0;

  // Shadow
  if(grounded){ctx.fillStyle='rgba(0,0,0,0.28)';ctx.beginPath();ctx.ellipse(0,h/2+4,w*0.5,6,0,0,Math.PI*2);ctx.fill();}

  // Legs (thick, stocky)
  rrFill(bx+5,by2+h*0.65,17,h*0.3+ll,5,ch.accent);
  rrFill(bx+w-22,by2+h*0.65,17,h*0.3-ll,5,ch.accent);
  ctx.fillStyle='#1a0000';
  ctx.beginPath();ctx.ellipse(bx+13,by2+h*0.95+ll/2,12,5,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(bx+w-13,by2+h*0.95-ll/2,12,5,0,0,Math.PI*2);ctx.fill();

  // Body (wide, armored)
  rrFill(bx+2,by2+h*0.34,w-4,h*0.42,10,ch.color);
  // Armor ridge lines
  ctx.strokeStyle=ch.accent;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(bx+9,by2+h*0.37);ctx.lineTo(bx+9,by2+h*0.72);ctx.stroke();
  ctx.beginPath();ctx.moveTo(bx+w-9,by2+h*0.37);ctx.lineTo(bx+w-9,by2+h*0.72);ctx.stroke();
  // Chest vent glow
  const ventActive=inAct&&!heavy&&(dir==='side'||dir==='neutral'||dir==='up');
  const ventCol=ventActive?ch.eyeCol:(inAct?'#550800':'#330500');
  rrFill(bx+w*0.28,by2+h*0.46,w*0.44,h*0.09,4,ventCol);
  if(ventActive){ctx.save();ctx.shadowBlur=14;ctx.shadowColor=ch.eyeCol;ctx.globalAlpha=0.45;rrPath(bx+w*0.28,by2+h*0.46,w*0.44,h*0.09,4);ctx.fillStyle=ch.eyeCol;ctx.fill();ctx.restore();}

  // Arms with flame nozzles
  const armY=by2+h*0.38;
  // Left arm
  ctx.save();ctx.translate(bx-4,armY);
  if(inAct&&!heavy&&dir==='up'){ctx.translate(-8,0);}
  rrFill(-18,0,18,h*0.3,6,ch.color);
  rrFill(-22,h*0.07,10,18,4,ch.accent);
  ctx.fillStyle='#1a0000';ctx.beginPath();ctx.arc(-17,h*0.19,5,0,Math.PI*2);ctx.fill();
  if(ventActive||inAct){ctx.save();ctx.shadowBlur=8;ctx.shadowColor=ch.eyeCol;ctx.fillStyle=ch.eyeCol;ctx.globalAlpha=0.7;ctx.beginPath();ctx.arc(-17,h*0.19,3,0,Math.PI*2);ctx.fill();ctx.restore();}
  ctx.restore();
  // Right arm
  ctx.save();ctx.translate(bx+w+4,armY);
  if(inAct&&!heavy&&dir==='up'){ctx.translate(8,0);}
  rrFill(0,0,18,h*0.3,6,ch.color);
  rrFill(12,h*0.07,10,18,4,ch.accent);
  ctx.fillStyle='#1a0000';ctx.beginPath();ctx.arc(17,h*0.19,5,0,Math.PI*2);ctx.fill();
  if(ventActive||inAct){ctx.save();ctx.shadowBlur=8;ctx.shadowColor=ch.eyeCol;ctx.fillStyle=ch.eyeCol;ctx.globalAlpha=0.7;ctx.beginPath();ctx.arc(17,h*0.19,3,0,Math.PI*2);ctx.fill();ctx.restore();}
  ctx.restore();

  // === Flame effects ===
  // Side light: flamethrower stream from right nozzle
  if(!heavy&&inAct&&(dir==='side'||dir==='neutral')){
    ctx.save();
    const flameX=bx+w+14, flameLen=(ch.flameRange||220)*0.92;
    for(let i=0;i<7;i++){
      const t=i/6, wobY=(Math.random()-.5)*22*t;
      ctx.globalAlpha=(1-t)*0.78;
      const gr=ctx.createLinearGradient(flameX,armY+h*0.19,flameX+flameLen*t,armY+h*0.19+wobY);
      gr.addColorStop(0,'#ffaa00');gr.addColorStop(0.4,'#ff3300');gr.addColorStop(1,'rgba(180,0,0,0)');
      ctx.strokeStyle=gr;ctx.lineWidth=18*(1-t)+4;ctx.lineCap='round';
      ctx.shadowBlur=12*( 1-t);ctx.shadowColor='#ff4400';
      ctx.beginPath();ctx.moveTo(flameX,armY+h*0.19+wobY*0.1);ctx.lineTo(flameX+flameLen*t,armY+h*0.19+wobY);ctx.stroke();
    }
    ctx.restore();
  }
  // Up light: upward flamethrower from both arms
  if(!heavy&&inAct&&dir==='up'){
    ctx.save();
    const flameLen=ch.flameRange||220;
    for(let side=-1;side<=1;side+=2){
      const nozzX=side*(w*0.5+18);
      for(let i=0;i<6;i++){
        const t=i/5, wobX=(Math.random()-.5)*26*t;
        ctx.globalAlpha=(1-t)*0.72;
        const gr=ctx.createLinearGradient(nozzX,armY+h*0.19,nozzX+wobX,armY+h*0.19-flameLen*t);
        gr.addColorStop(0,'#ffaa00');gr.addColorStop(0.4,'#ff3300');gr.addColorStop(1,'rgba(180,0,0,0)');
        ctx.strokeStyle=gr;ctx.lineWidth=16*(1-t)+3;ctx.lineCap='round';
        ctx.shadowBlur=10*(1-t);ctx.shadowColor='#ff4400';
        ctx.beginPath();ctx.moveTo(nozzX+wobX*0.1,armY+h*0.19);ctx.lineTo(nozzX+wobX,armY+h*0.19-flameLen*t);ctx.stroke();
      }
    }
    ctx.restore();
  }
  // Down light: burst flash
  if(!heavy&&inAct&&dir==='down'){
    ctx.save();ctx.globalAlpha=Math.max(0,(1-tAct*3)*0.8);
    ctx.shadowBlur=20;ctx.shadowColor=ch.eyeCol;
    const gr=ctx.createRadialGradient(0,by2+h*0.55,3,0,by2+h*0.55,28);
    gr.addColorStop(0,'#ffcc00');gr.addColorStop(1,'rgba(255,50,0,0)');
    ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,by2+h*0.55,28,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  // Down heavy: fire jet below
  if(heavy&&inAct&&dir==='down'){
    ctx.save();ctx.globalAlpha=tAct*0.85;
    const gr=ctx.createRadialGradient(0,by2+h*0.76,4,0,by2+h*0.76,60);
    gr.addColorStop(0,'#ffee00');gr.addColorStop(0.35,'#ff4400');gr.addColorStop(1,'rgba(200,0,0,0)');
    ctx.fillStyle=gr;ctx.shadowBlur=24;ctx.shadowColor='#ff4400';
    ctx.beginPath();ctx.arc(0,by2+h*0.76,60,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  // Up heavy: semicircle fire arcs above
  if(heavy&&(inAct||inSU)&&dir==='up'){
    ctx.save();
    const progress=inSU?(atk.frame/Math.max(atk.su,1)):1;
    const radius=75+progress*15;
    const numRays=10;
    for(let i=0;i<numRays;i++){
      const t=i/(numRays-1);
      const ang=-Math.PI+t*Math.PI; // semicircle: left to right above
      const wobble=(Math.sin(G.frame*0.3+i)*8)*progress;
      const endX=Math.cos(ang)*(radius+wobble);
      const endY=Math.sin(ang)*(radius+wobble)+by2+h*0.22;
      ctx.globalAlpha=progress*(0.5+Math.sin(t*Math.PI)*0.45);
      ctx.strokeStyle=t<0.5?'#ffaa00':'#ff3300';
      ctx.lineWidth=10*(Math.sin(t*Math.PI)*0.7+0.3)+2;
      ctx.lineCap='round';ctx.shadowBlur=14;ctx.shadowColor='#ff4400';
      ctx.beginPath();ctx.moveTo(0,by2+h*0.22);ctx.lineTo(endX,endY);ctx.stroke();
    }
    ctx.restore();
  }
  // Side heavy: pebble launch flash
  if(heavy&&inSU&&(dir==='side'||dir==='neutral')){
    const tSU=atk.frame/Math.max(atk.su,1);
    ctx.save();ctx.globalAlpha=tSU*0.55;
    const mx=bx+w+14;
    ctx.shadowBlur=18;ctx.shadowColor=ch.eyeCol;ctx.fillStyle=ch.eyeCol;
    ctx.beginPath();ctx.arc(mx,armY+h*0.19,4+tSU*7,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  // Head (blocky, armored)
  rrFill(bx+4,by2+h*0.06,w-8,h*0.31,8,ch.color);
  rrFill(bx+8,by2+h*0.08,w-16,h*0.065,3,ch.accent);
  // Eyes (glowing slits)
  const eyeC=inAct?ch.eyeCol:'#550800';
  ctx.fillStyle=eyeC;
  if(inAct){ctx.shadowBlur=16;ctx.shadowColor=ch.eyeCol;}
  ctx.beginPath();ctx.rect(bx+9,by2+h*0.145,11,7);ctx.fill();
  ctx.beginPath();ctx.rect(bx+w-20,by2+h*0.145,11,7);ctx.fill();
  ctx.shadowBlur=0;
  // Mouth grill
  ctx.strokeStyle=ch.accent;ctx.lineWidth=1.5;
  for(let i=0;i<5;i++){
    ctx.beginPath();ctx.moveTo(bx+10+i*7,by2+h*0.265);ctx.lineTo(bx+10+i*7,by2+h*0.325);ctx.stroke();
  }
}



