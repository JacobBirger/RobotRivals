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
    lSz:52,lRch:60,hSz:72,hRch:77,
    signatureCombo:{firstType:'light',firstDir:'side',followType:'heavy',followDir:'side'} };

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
  const inSU = a.frame<a.su;
  // Heavy startup: growing charge particles orbiting the body
  if(inSU && a.type==='heavy' && a.frame%3===0){
    const prog = a.frame/Math.max(a.su,1);
    const ang = Math.random()*Math.PI*2;
    const r = 20+prog*25;
    particles.push({x:player.cx+Math.cos(ang)*r, y:player.cy+Math.sin(ang)*r,
      vx:(Math.random()-.5)*2, vy:-1-Math.random()*2,
      life:12,max:12, col:prog>0.6?'#ffcc00':'#ff6600', sz:2+prog*3});
  }
  // Heavy active: shockwave ring on first frame
  if(inAct && a.frame===a.su && a.type==='heavy'){
    particles.push({x:player.cx+player.facing*player.w*0.5, y:player.cy,
      vx:0,vy:0, life:16,max:16, col:'#ff4400', sz:6, ring:true, ringR:0});
    // Debris shards
    for(let i=0;i<10;i++){
      const ang=Math.random()*Math.PI*2, spd=5+Math.random()*7;
      particles.push({x:player.cx,y:player.cy, vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd-2,
        life:22,max:22, col:i%2?'#ff4400':'#ffaa00', sz:3+Math.random()*3});
    }
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
  const dir=atk?atk.dir:null;
  // Heavy stomp — very slow sine wave, large amplitude thud
  const stompPhase=wf*Math.PI/2;
  const bob=grounded?Math.sin(stompPhase)*1.5:0, by2=by+bob;
  const ll=grounded?(wf<2?4:-4):0;
  // Aerial: heavy body slowly rotates forward, legs dangle, arms rise slightly
  const airRot=grounded?0:Math.sin(G.frame*0.05)*0.08;
  const airDangle=grounded?0:Math.min(8,G.frame%120*0.15);
  // Ground impact ring when foot strikes (wf===0 or wf===2)
  if(grounded&&(wf===0||wf===2)){
    const ringX=wf===0?(bx+w-16):(bx+16), ringY=h/2+2;
    const ringR=14+Math.abs(ll)*0.5;
    ctx.save();ctx.globalAlpha=0.4;ctx.strokeStyle='#ff5555';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(ringX,ringY,ringR,ringR*0.35,0,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=0.15;ctx.fillStyle='#ff3333';ctx.beginPath();ctx.ellipse(ringX,ringY,ringR,ringR*0.35,0,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  if(grounded){ctx.fillStyle='rgba(0,0,0,0.3)';ctx.beginPath();ctx.ellipse(0,h/2+3,w*0.48,7,0,0,Math.PI*2);ctx.fill();}
  // Aerial: legs dangle lower, body rocks slowly
  if(!grounded)ctx.save(),ctx.rotate(airRot);
  rrFill(bx+6,by2+h*0.63+airDangle,19,h*0.33+ll,4,ch.accent);rrFill(bx+w-25,by2+h*0.63+airDangle,19,h*0.33-ll,4,ch.accent);
  rrFill(bx+2,by2+h*0.93+ll*0.5+airDangle,23,10,3,'#222');rrFill(bx+w-25,by2+h*0.93-ll*0.5+airDangle,23,10,3,'#222');
  if(!grounded)ctx.restore();
  // Body lean: forward during SU, slams forward on active, staggers back in endlag
  const bodyLean = inSU&&heavy ? 0.12*tSU : inAct&&heavy ? 0.18 : inEl&&heavy ? -0.22*(1-tEl) : inEl ? -0.1*(1-tEl) : 0;
  // Light SU: subtle lean forward
  const lightSULean = inSU&&!heavy&&dir==='side' ? 0.08*tSU : 0;

  // Charge aura during heavy startup
  if(inSU&&heavy){
    ctx.save();
    const aura=ctx.createRadialGradient(0,by2+h*0.5,4,0,by2+h*0.5,38*tSU+8);
    aura.addColorStop(0,`rgba(255,80,0,${0.5*tSU})`);aura.addColorStop(1,'rgba(255,0,0,0)');
    ctx.fillStyle=aura;ctx.beginPath();ctx.arc(0,by2+h*0.5,38*tSU+8,0,Math.PI*2);ctx.fill();
    // Crackling ring at peak charge
    if(tSU>0.7){ctx.strokeStyle='#ffcc00';ctx.lineWidth=2;ctx.globalAlpha=(tSU-0.7)*3*0.8;ctx.beginPath();ctx.arc(0,by2+h*0.5,44*tSU,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }

  // Active impact flash on first frames
  if(inAct&&tAct<0.25){
    ctx.save();ctx.globalAlpha=(0.25-tAct)*4*0.7;
    ctx.shadowBlur=24;ctx.shadowColor=ch.eyeCol;ctx.strokeStyle='#ffaa00';ctx.lineWidth=4;
    const dir2=dir==='side'?1:0, hitX=dir2?(bx+w+18):0, hitY=by2+h*(dir==='up'?0.1:dir==='down'?0.9:0.5);
    ctx.beginPath();ctx.arc(hitX,hitY,28,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }

  const sdx=inSU&&heavy?(Math.random()-.5)*5:0;
  ctx.save();ctx.rotate(bodyLean+lightSULean);
  rrFill(bx+2+sdx,by2+h*0.31,w-4,h*0.42,6,ch.color);
  ctx.fillStyle=ch.accent;
  [{x:bx+8,y:by2+h*0.35},{x:bx+w-8,y:by2+h*0.35},{x:bx+8,y:by2+h*0.69},{x:bx+w-8,y:by2+h*0.69}].forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fill();});
  const vc=inAct?'#ff6600':inSU?'#ff4400':'#1a1a1a';for(let i=0;i<3;i++)rrFill(bx+w*0.26+i*14,by2+h*0.49,10,6,2,vc);

  // Left arm — pulls back in heavy SU, endlag hangs low
  ctx.save();ctx.translate(bx,by2+h*0.36);
  if(inSU&&heavy&&dir==='side'){ctx.translate(-8*tSU,4*tSU);}
  else if(inEl&&heavy){ctx.translate(0,16*(1-tEl));ctx.rotate(0.3*(1-tEl));}
  rrFill(-17,0,19,h*0.32,5,ch.color);
  const clC=inAct?'#ffaa00':ch.accent;ctx.fillStyle=clC;ctx.beginPath();ctx.arc(-8,h*0.32,10,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=clC;ctx.lineWidth=4;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-15,h*0.32+5);ctx.lineTo(-23,h*0.32+15);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-8,h*0.32+8);ctx.lineTo(-8,h*0.32+18);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-1,h*0.32+5);ctx.lineTo(5,h*0.32+14);ctx.stroke();ctx.restore();

  // Right arm — winds back during heavy SU (big telegraph), slams forward on active
  ctx.save();ctx.translate(bx+w,by2+h*0.36);
  if(inSU&&heavy){
    if(dir==='side'){ctx.translate(-14*tSU,-8*tSU);ctx.rotate(-0.5*tSU);} // wind-up: arm pulls WAY back
    else if(dir==='up'){ctx.rotate(-0.8*tSU);ctx.translate(0,-20*tSU);}
    else if(dir==='down'){ctx.rotate(0.6*tSU);ctx.translate(0,14*tSU);}
    else{ctx.rotate(-0.4*tSU);}
  } else if(inSU&&!heavy&&dir==='side'){
    ctx.translate(Math.sin(atk.frame)*6,0);
  } else if(inAct){
    if(dir==='side'){ctx.translate(26,0);}
    else if(dir==='up'){ctx.rotate(-1.1);ctx.translate(12,-15);}
    else if(dir==='down'){ctx.rotate(1.1);ctx.translate(6,18);}
    else{ctx.translate(18,-5);ctx.rotate(0.15);}
  } else if(inEl){
    // Endlag: arm hangs exhausted
    if(dir==='side'){ctx.translate(8*(1-tEl),12*(1-tEl));ctx.rotate(0.4*(1-tEl));}
    else if(dir==='up'){ctx.translate(0,10*(1-tEl));}
    else if(dir==='down'){ctx.translate(0,-8*(1-tEl));}
    if(heavy){ctx.rotate(0.5*(1-tEl));} // heavier droop for heavy endlag
  }
  rrFill(0,0,19,h*0.32,5,ch.color);const clC2=inAct?'#ffaa00':ch.accent;ctx.fillStyle=clC2;ctx.beginPath();ctx.arc(8,h*0.32,10,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=clC2;ctx.lineWidth=4;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(16,h*0.32+5);ctx.lineTo(24,h*0.32+15);ctx.stroke();
  ctx.beginPath();ctx.moveTo(8,h*0.32+8);ctx.lineTo(8,h*0.32+18);ctx.stroke();
  ctx.beginPath();ctx.moveTo(1,h*0.32+5);ctx.lineTo(-4,h*0.32+14);ctx.stroke();ctx.restore();

  // Head
  rrFill(-w*0.41,by2,w*0.82,h*0.35,5,ch.color);rrFill(-w*0.36,by2+3,w*0.72,h*0.08,3,ch.hi);
  const ec=inAct?'#fff':inSU?'#ffaa00':ch.eyeCol;
  ctx.save();ctx.translate(-w*0.19,by2+h*0.18);ctx.rotate(-0.3);rrFill(-10,-5,20,10,2,ec);ctx.restore();
  ctx.save();ctx.translate(w*0.19,by2+h*0.18);ctx.rotate(0.3);rrFill(-10,-5,20,10,2,ec);ctx.restore();
  rrFill(-w*0.28,by2+h*0.27,w*0.56,h*0.06,2,'#111');
  ctx.strokeStyle='#333';ctx.lineWidth=1;
  for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-w*0.22+i*w*0.11,by2+h*0.27);ctx.lineTo(-w*0.22+i*w*0.11,by2+h*0.33);ctx.stroke();}
  rrFill(-w*0.3,by2-h*0.09,8,h*0.1,2,ch.accent);rrFill(w*0.2,by2-h*0.06,8,h*0.07,2,ch.accent);
  ctx.restore(); // end body lean
}



