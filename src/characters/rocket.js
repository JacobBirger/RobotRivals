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
    lSz:10,lRch:10,hSz:10,hRch:10,
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
  const ch = player.ch;
  const inAct = a.frame>=a.su && a.frame<a.su+a.act;
  const inSU = a.frame<a.su;
  const inEl = a.frame>=a.su+a.act;
  const tSU = inSU ? a.frame/Math.max(a.su,1) : 0;
  const tEl = inEl ? (a.frame-a.su-a.act)/Math.max(a.el,1) : 0;
  // Arm-launch smoke burst on first active frame
  if(inAct && a.frame===a.su){
    const px = player.cx + player.facing*(player.w*0.55);
    const py = player.cy - player.h*0.1;
    for(let i=0;i<8;i++){
      const ang = Math.random()*Math.PI*2;
      const spd = 3+Math.random()*5;
      particles.push({x:px,y:py, vx:Math.cos(ang)*spd+player.facing*3, vy:Math.sin(ang)*spd-2,
        life:14,max:14, col:i%2?ch.eyeCol:ch.color, sz:2+Math.random()*3});
    }
    particles.push({x:px,y:py, vx:0,vy:0, life:10,max:10, col:ch.eyeCol, sz:4, ring:true, ringR:0});
  }
  // Socket smoke during endlag (empty socket where arm was)
  if(inEl && a.frame%4===0 && tEl<0.55){
    const px = player.cx + player.facing*(player.w*0.5);
    const py = player.cy - player.h*0.05;
    particles.push({x:px,y:py, vx:(Math.random()-0.5)*2, vy:-1.5-Math.random(),
      life:20,max:20, col:'#664422', sz:4+Math.random()*3});
  }
  // Heavy SU: growing charge glow particles orbiting
  if(a.type==='heavy' && inSU && a.frame%3===0){
    const ang = Math.random()*Math.PI*2;
    const r = 16+tSU*18;
    particles.push({x:player.cx+Math.cos(ang)*r, y:player.cy+Math.sin(ang)*r,
      vx:Math.cos(ang)*2, vy:Math.sin(ang)*2-1,
      life:10,max:10, col:tSU>0.5?ch.eyeCol:ch.color, sz:2+tSU*2});
  }
}

export function onRespawn(player) {
  // no cleanup needed
}

export function draw(ctx,ch,w,h,atk,grounded,wf,extra){
  const bx=-w/2,by=-h/2;
  const armsLeft=extra&&extra.armsLeft!=null?extra.armsLeft:4;
  const inAct=atk&&atk.frame>=atk.su&&atk.frame<atk.su+atk.act;
  const inSU=atk&&atk.frame<atk.su;
  const inEl=atk&&atk.frame>=atk.su+atk.act;
  const tSU=inSU?atk.frame/Math.max(atk.su,1):0;
  const tAct=inAct?(atk.frame-atk.su)/Math.max(atk.act,1):0;
  const tEl=inEl?(atk.frame-atk.su-atk.act)/Math.max(atk.el,1):0;
  const heavy=atk&&atk.type==='heavy';
  const dir=atk?atk.dir:null;
  // Asymmetric arm bob
  const bob=grounded?Math.sin(wf*Math.PI/2)*2:0, by2=by+bob;
  const ll=grounded?(wf<2?5:-5):0;
  const swingL=grounded?Math.sin(wf*Math.PI/2)*6:0;
  const swingR=grounded?Math.sin(wf*Math.PI/2+Math.PI)*6:0;
  // Aerial: all four arms splay outward and upward
  const airSplay=grounded?0:Math.min(12,G.frame*0.4+Math.sin(G.frame*0.1)*4);
  const airLegDangle=grounded?0:6;

  // Body recoil on active (kicks back slightly when launching arm)
  const bodyRecoilX = inAct && tAct<0.4 ? -8*(1-tAct/0.4) : inEl ? 4*(1-tEl) : 0;
  // Body lean: leans into charge for heavy SU, staggers back in endlag
  const bodyLean = inSU&&heavy ? 0.1*tSU : inAct ? 0.12 : inEl ? -0.15*(1-tEl) : 0;

  // Heavy SU charge aura
  if(inSU&&heavy){
    ctx.save();
    const aura=ctx.createRadialGradient(0,by2+h*0.5,4,0,by2+h*0.5,30*tSU+6);
    aura.addColorStop(0,`rgba(255,150,0,${0.45*tSU})`);aura.addColorStop(1,'rgba(255,80,0,0)');
    ctx.fillStyle=aura;ctx.beginPath();ctx.arc(0,by2+h*0.5,30*tSU+6,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  if(grounded){ctx.fillStyle='rgba(0,0,0,0.25)';ctx.beginPath();ctx.ellipse(0,h/2+3,w*0.45,5,0,0,Math.PI*2);ctx.fill();}
  // Legs
  rrFill(bx+6,by2+h*0.65+airLegDangle,13,h*0.3+ll,4,ch.accent);rrFill(bx+w-19,by2+h*0.65+airLegDangle,13,h*0.3-ll,4,ch.accent);
  ctx.fillStyle='#222';ctx.beginPath();ctx.ellipse(bx+12,by2+h*0.94+ll/2+airLegDangle,9,5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#222';ctx.beginPath();ctx.ellipse(bx+w-12,by2+h*0.94-ll/2+airLegDangle,9,5,0,0,Math.PI*2);ctx.fill();

  ctx.save();ctx.translate(bodyRecoilX,0);ctx.rotate(bodyLean);
  // Torso
  rrFill(bx+4,by2+h*0.34,w-8,h*0.36,8,ch.color);
  rrFill(bx+8,by2+h*0.36,w-16,h*0.08,3,ch.hi);
  // Center eye — pulses during charge, flares on active
  const eyeFlash = inAct && tAct<0.3;
  ctx.fillStyle=eyeFlash?'#ffffff':inAct?ch.eyeCol:inSU&&heavy?`rgba(255,200,0,${0.3+tSU*0.7})`:'#332200';
  ctx.beginPath();ctx.arc(0,by2+h*0.52,eyeFlash?9:inAct?7:6,0,Math.PI*2);ctx.fill();
  if(inAct&&!eyeFlash){ctx.fillStyle=ch.eyeCol;ctx.globalAlpha=0.35;ctx.beginPath();ctx.arc(0,by2+h*0.52,16,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}

  // Arms
  const armPresent=[armsLeft>0,armsLeft>1,armsLeft>2,armsLeft>3];

  // On first active frame, the launching arm pulses outward then is gone next frame
  // SU: arms tense inward slightly (coil to launch)
  const launchPulseX = inAct&&tAct<0.25 ? 6*(1-tAct/0.25) : 0;
  const suCoilX = inSU ? -3*tSU : 0;

  const armPositions=[
    {sx:-w/2-2-airSplay*0.5+suCoilX, sy:by2+h*0.38+swingL*0.4-airSplay*0.8, side:-1},
    {sx:-w/2-2-airSplay*0.3+suCoilX, sy:by2+h*0.52-swingL*0.2+airSplay*0.4, side:-1},
    {sx:w/2+2+airSplay*0.5-suCoilX+launchPulseX,  sy:by2+h*0.38+swingR*0.4-airSplay*0.8, side:1},
    {sx:w/2+2+airSplay*0.3-suCoilX+launchPulseX,  sy:by2+h*0.52-swingR*0.2+airSplay*0.4, side:1}
  ];

  for(let i=0;i<4;i++){
    const ap=armPositions[i];
    if(armPresent[i]){
      ctx.save();ctx.translate(ap.sx,ap.sy);
      rrFill(ap.side>0?0:-12,0,12,h*0.22,4,ch.color);
      const tipCol = inSU&&heavy?`rgba(255,${200+Math.floor(tSU*55)},0,1)`:ch.accent;
      ctx.fillStyle=tipCol;ctx.beginPath();ctx.arc(ap.side>0?6:-6,h*0.22,7,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=ch.eyeCol;ctx.beginPath();ctx.arc(ap.side>0?6:-6,h*0.22+7,4,0,Math.PI*2);ctx.fill();
      ctx.restore();
    } else {
      // Empty socket — glows hot right after arm was fired
      ctx.save();ctx.translate(ap.sx,ap.sy);
      const socketGlow = inEl && tEl<0.4;
      ctx.strokeStyle=socketGlow?ch.eyeCol:'#553300';ctx.lineWidth=2;
      if(socketGlow){ctx.save();ctx.shadowBlur=10;ctx.shadowColor=ch.eyeCol;}
      ctx.beginPath();ctx.arc(ap.side>0?4:-4,0,6,0,Math.PI*2);ctx.stroke();
      if(socketGlow)ctx.restore();
      ctx.fillStyle=socketGlow?'#664400':'#221100';ctx.beginPath();ctx.arc(ap.side>0?4:-4,0,4,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
  }

  // Head
  rrFill(bx+6,by2+h*0.06,w-12,h*0.3,8,ch.color);
  rrFill(bx+10,by2+h*0.08,w-20,h*0.09,3,ch.hi);
  ctx.fillStyle='#221100';ctx.beginPath();ctx.ellipse(0,by2+h*0.18,w*0.3,h*0.08,0,0,Math.PI*2);ctx.fill();
  const visorCol = inAct?ch.eyeCol:inSU&&heavy?`rgba(255,${150+Math.floor(tSU*105)},0,1)`:'#cc4400';
  ctx.fillStyle=visorCol;
  if(inAct){ctx.save();ctx.shadowBlur=12;ctx.shadowColor=ch.eyeCol;}
  ctx.beginPath();ctx.arc(-10,by2+h*0.18,4,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(0,by2+h*0.18,4,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(10,by2+h*0.18,4,0,Math.PI*2);ctx.fill();
  if(inAct)ctx.restore();

  // Endlag: exhaust port steams (socket heat venting)
  const exhaustAlpha = inEl ? 0.6+Math.sin(G.frame*0.3)*0.2 : 0.6;
  ctx.fillStyle=ch.accent;ctx.beginPath();ctx.arc(bx+4,by2+h*0.48,5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=inEl?'#ffcc00':'#ff8800';ctx.globalAlpha=exhaustAlpha;ctx.beginPath();ctx.arc(bx+4,by2+h*0.48,3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;

  ctx.restore(); // end body lean/recoil
}



