import { ctx, W, H, bullets, miniSwords, rocketArms, rocketMines, smokeClouds, unstableHeads, knives, throwSwords, firePebbles, pristineRockets, factoryBolts, factoryGears, factoryZaps, particles, aabb, sameTeam } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, addDeathExplosion, instakill, rrFill, rrStroke, rrPath } from '../particles.js';
import { MAX_KB, DEATH_THRESHOLD, FLY_ACCEL, MAX_FLY_SPEED, FLY_FRIC, DASH_FRAMES, DASH_MULT } from '../player/constants.js';
import { kbScale, playSfx, playSfxNoise } from '../audio.js';

export const char = { id:3,name:'BLASTER',tag:'The Marksman',
    desc:['Fires ranged bullets','Heavy shot must charge up','Short-to-mid range only'],
    color:'#00cc77',accent:'#007744',eyeCol:'#00ffaa',hi:'#88ffcc',
    w:44,h:52,speed:7.0,jumpF:-14.7,djF:-13.2,weight:0.9,def:1.08,shieldCool:120,
    lDmg:6,hDmg:8,lKB:4,hKB:9,lSU:4,hSU:50,lAct:5,hAct:7,lEl:8,hEl:22,
    lSz:10,lRch:10,hSz:12,hRch:12,
    bulletSpd:12,heavyBulletSpd:18,
    lightBulletRange:220,heavyBulletRange:300 };

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
  const inEl = a.frame>=a.su+a.act;
  const tAct = inAct ? (a.frame-a.su)/Math.max(a.act,1) : 0;
  const tEl = inEl ? (a.frame-a.su-a.act)/Math.max(a.el,1) : 0;
  // Muzzle flash burst particles on first active frame
  if(inAct && a.frame===a.su){
    const px = player.cx + player.facing*(player.w*0.7);
    const py = player.cy - player.h*0.1;
    for(let i=0;i<5;i++){
      const ang = (Math.random()-0.5)*Math.PI*0.6 + (player.facing>0?0:Math.PI);
      const spd = 5+Math.random()*6;
      particles.push({x:px,y:py, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd-1,
        life:10,max:10, col:i%2?ch.eyeCol:'#ffffff', sz:2+Math.random()*2});
    }
    particles.push({x:px,y:py, vx:0,vy:0, life:7,max:7, col:ch.eyeCol, sz:3, ring:true, ringR:0});
  }
  // Barrel smoke wisps during endlag
  if(inEl && a.frame%3===0 && tEl<0.6){
    const px = player.cx + player.facing*(player.w*0.7);
    const py = player.cy - player.h*0.1;
    particles.push({x:px,y:py, vx:(Math.random()-0.5)*1.5, vy:-1-Math.random()*1.5,
      life:18,max:18, col:'#aaffcc', sz:3+Math.random()*2});
  }
  // Heavy charge crackle during startup
  if(a.type==='heavy' && a.frame<a.su && a.frame%4===0){
    const px = player.cx + player.facing*(player.w*0.5);
    const py = player.cy - player.h*0.1;
    const ang = Math.random()*Math.PI*2;
    particles.push({x:px,y:py, vx:Math.cos(ang)*2, vy:Math.sin(ang)*2-0.5,
      life:10,max:10, col:ch.eyeCol, sz:1.5+Math.random()*2});
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
  // Blaster: smooth hover with gentle lateral drift and pulsing jet intensity
  const hover=Math.sin(G.frame*0.06)*3;
  const sway=Math.sin(G.frame*0.04)*3;
  const by2=by+hover;
  // Aerial: body pitches forward slightly, jets flare brighter, scanning visor sweeps
  const airPitch=grounded?0:Math.sin(G.frame*0.05)*0.08+0.06; // nose-down attitude
  const airJetFlare=grounded?1:1.4+Math.sin(G.frame*0.22)*0.3; // jets work harder
  if(grounded){
    // Shadow drifts with sway
    ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.ellipse(sway*0.4,h/2+5,w*0.5,5,0,0,Math.PI*2);ctx.fill();
  }
  // Hover jets — intensity pulses faster when near ground
  const jetAlpha=0.4+Math.sin(G.frame*0.15)*0.2;
  // Lateral drift applied to whole body via translate below
  ctx.save();ctx.translate(sway,0);ctx.rotate(airPitch); // lateral float + aerial pitch
  for(let ji=-1;ji<=1;ji+=2){
    const jg=ctx.createRadialGradient(ji*w*0.22,by2+h*0.58,0,ji*w*0.22,by2+h*0.58,10*airJetFlare);
    jg.addColorStop(0,ch.eyeCol+'aa');jg.addColorStop(1,ch.eyeCol+'00');
    ctx.fillStyle=jg;ctx.globalAlpha=jetAlpha*airJetFlare;ctx.beginPath();ctx.arc(ji*w*0.22,by2+h*0.58,10*airJetFlare,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  }
  // Body (capsule)
  rrFill(bx+4,by2+h*0.28,w-8,h*0.5,w/2-4,ch.color);
  rrFill(bx+8,by2+h*0.3,w-16,h*0.12,5,ch.hi);
  // Scanner band
  const scanX=bx+6,scanW=w-12,scanH=h*0.08;
  rrFill(scanX,by2+h*0.42,scanW,scanH,4,inAct?ch.eyeCol:'#001a0a');
  if(inAct){ctx.fillStyle='#fff';ctx.globalAlpha=0.6;rrPath(scanX,by2+h*0.42,scanW*0.4,scanH,4);ctx.fill();ctx.globalAlpha=1;}
  // Left arm — recoils back slightly when firing
  const recoilX = inAct&&tAct<0.4 ? -5*(1-tAct/0.4) : inEl ? 3*(1-tEl) : 0;
  ctx.fillStyle=ch.accent;rrFill(bx-8+recoilX,by2+h*0.34,12,h*0.24,5,ch.accent);
  ctx.fillStyle=ch.color;ctx.beginPath();ctx.arc(bx-3+recoilX,by2+h*0.57,7,0,Math.PI*2);ctx.fill();

  // Gun arm (right) — charge glow builds on barrel in heavy SU
  const gunExt=inAct?(dir==='side'?14:8):inEl?-4*(1-tEl):0; // barrel retracts in endlag
  const gunY=inAct&&dir==='up'?-20:inAct&&dir==='down'?12:inSU&&heavy&&dir==='up'?-10*tSU:inSU&&heavy&&dir==='down'?8*tSU:0;
  // Startup: gun arm raises/aims before fire
  const gunPreAim = inSU ? (dir==='side'?4*tSU:0) : 0;
  ctx.fillStyle=ch.accent;rrFill(bx+w-4+gunPreAim,by2+h*0.36+gunY*0.3,18+gunExt,12,4,ch.accent);
  rrFill(bx+w+10+gunExt+gunPreAim,by2+h*0.36+gunY*0.3+2,12,8,3,ch.color);

  // Charge glow on muzzle during heavy SU
  if(inSU&&heavy){
    ctx.save();ctx.shadowBlur=12+tSU*20;ctx.shadowColor=ch.eyeCol;
    ctx.fillStyle=ch.eyeCol;ctx.globalAlpha=0.3+tSU*0.6;
    ctx.beginPath();ctx.arc(bx+w+22+gunPreAim,by2+h*0.4+gunY*0.3,4+tSU*8,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  // Muzzle flash — bright for first 3-4 frames of active only
  const muzzleFlash = inAct && tAct < 0.35;
  const muzzleX=bx+w+22+gunExt+gunPreAim, muzzleY=by2+h*0.4+gunY*0.3;
  ctx.fillStyle=muzzleFlash?'#ffffff':inAct?ch.eyeCol:'#003322';
  ctx.beginPath();ctx.arc(muzzleX,muzzleY,muzzleFlash?10:inAct?6:4,0,Math.PI*2);ctx.fill();
  if(muzzleFlash){
    // Cross-shaped muzzle flash
    ctx.save();ctx.shadowBlur=30;ctx.shadowColor='#ffffff';ctx.strokeStyle='#ffffff';
    ctx.lineWidth=3;ctx.lineCap='round';ctx.globalAlpha=1-tAct/0.35;
    for(let a=0;a<4;a++){
      const ang=a*Math.PI/2;
      ctx.beginPath();ctx.moveTo(muzzleX+Math.cos(ang)*6,muzzleY+Math.sin(ang)*6);
      ctx.lineTo(muzzleX+Math.cos(ang)*18,muzzleY+Math.sin(ang)*18);ctx.stroke();
    }
    ctx.restore();
  } else if(inAct){
    ctx.shadowBlur=20;ctx.shadowColor=ch.eyeCol;ctx.fillStyle=ch.eyeCol;
    ctx.beginPath();ctx.arc(muzzleX,muzzleY,8,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  }

  // Endlag: barrel smoke wisps
  if(inEl){
    ctx.save();ctx.globalAlpha=(1-tEl)*0.4;ctx.fillStyle='#aaffcc';
    ctx.beginPath();ctx.arc(muzzleX+Math.sin(G.frame*0.3)*3,muzzleY-(1-tEl)*12,4*(1-tEl),0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  // Head
  ctx.fillStyle=ch.color;ctx.beginPath();ctx.ellipse(0,by2+h*0.17,w*0.38,h*0.2,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=ch.hi;ctx.beginPath();ctx.ellipse(-4,by2+h*0.1,w*0.25,h*0.09,-0.3,0,Math.PI*2);ctx.fill();
  // Targeting visor — sweeps/locks during SU, fires during active
  const visCol=inAct?ch.eyeCol:inEl?ch.accent:'#002211';
  rrFill(-w*0.26,by2+h*0.15,w*0.52,h*0.08,4,visCol);
  if(inSU){ctx.fillStyle=ch.eyeCol;ctx.globalAlpha=0.6+Math.sin(atk.frame*0.5)*0.3;ctx.beginPath();ctx.arc(-8,by2+h*0.19,4,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(8,by2+h*0.19,4,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  ctx.strokeStyle=ch.accent;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-4,by2+h*0.02);ctx.lineTo(-8,by2-h*0.05);ctx.stroke();ctx.beginPath();ctx.moveTo(4,by2+h*0.02);ctx.lineTo(8,by2-h*0.05);ctx.stroke();
  ctx.fillStyle=ch.eyeCol;ctx.beginPath();ctx.arc(-8,by2-h*0.05,3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(8,by2-h*0.05,3,0,Math.PI*2);ctx.fill();
  ctx.restore(); // end lateral sway
}


