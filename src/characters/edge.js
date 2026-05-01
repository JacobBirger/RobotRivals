import { ctx, W, H, bullets, miniSwords, rocketArms, rocketMines, smokeClouds, unstableHeads, knives, throwSwords, firePebbles, pristineRockets, factoryBolts, factoryGears, factoryZaps, particles, aabb, sameTeam } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, addDeathExplosion, instakill, rrFill, rrStroke, rrPath } from '../particles.js';
import { MAX_KB, DEATH_THRESHOLD, FLY_ACCEL, MAX_FLY_SPEED, FLY_FRIC, DASH_FRAMES, DASH_MULT } from '../player/constants.js';
import { kbScale, playSfx, playSfxNoise } from '../audio.js';
import { MiniSword } from './edge_projectiles.js';

export const char = { id:4,name:'EDGE',tag:'The Duelist',
    desc:['3-hit sword combos','Direction changes combo style','Rewarding mastery'],
    color:'#cc44ff',accent:'#881acc',eyeCol:'#ff88ff',hi:'#dd99ff',
    w:44,h:56,speed:6.0,jumpF:-14.1,djF:-12.6,weight:0.9,def:1.00,shieldCool:96,
    lDmg:9,hDmg:12,lKB:6,hKB:13,lSU:4,hSU:12,lAct:7,hAct:11,lEl:8,hEl:20,
    lSz:32,lRch:90,hSz:50,hRch:102, maxCombo:3 };

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
  const dir=atk?atk.dir:null,cn=atk&&atk.comboN||0;
  const heavy=atk&&atk.type==='heavy';
  const tAct=atk&&inAct?(atk.frame-atk.su)/Math.max(atk.act,1):0;
  const bob=grounded?Math.sin(wf*Math.PI/2)*2:0,swing=grounded?Math.sin(wf*Math.PI/2)*6:0,by2=by+bob;
  const ll=grounded?(wf<2?5:-5):0;
  if(grounded){ctx.fillStyle='rgba(0,0,0,0.22)';ctx.beginPath();ctx.ellipse(0,h/2+3,w*0.44,5,0,0,Math.PI*2);ctx.fill();}
  // Legs
  rrFill(bx+6,by2+h*0.62,13,h*0.33+ll,4,ch.accent);rrFill(bx+w-19,by2+h*0.62,13,h*0.33-ll,4,ch.accent);
  ctx.fillStyle='#222';ctx.beginPath();ctx.ellipse(bx+12,by2+h*0.94+ll/2,9,4,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#222';ctx.beginPath();ctx.ellipse(bx+w-12,by2+h*0.94-ll/2,9,4,0,0,Math.PI*2);ctx.fill();
  // Body - slim, elegant
  rrFill(bx+6,by2+h*0.36,w-12,h*0.34,7,ch.color);
  // Energy trim lines
  ctx.strokeStyle=ch.eyeCol;ctx.lineWidth=2;ctx.globalAlpha=0.6;
  ctx.beginPath();ctx.moveTo(bx+10,by2+h*0.38);ctx.lineTo(bx+10,by2+h*0.68);ctx.stroke();
  ctx.beginPath();ctx.moveTo(bx+w-10,by2+h*0.38);ctx.lineTo(bx+w-10,by2+h*0.68);ctx.stroke();
  ctx.globalAlpha=1;
  // Left arm
  ctx.save();ctx.translate(bx+4,by2+h*0.38+swing*0.4);ctx.rotate(swing*0.04);
  rrFill(-10,0,11,h*0.26,4,ch.color);ctx.fillStyle=ch.accent;ctx.beginPath();ctx.arc(-5,h*0.26,7,0,Math.PI*2);ctx.fill();ctx.restore();
  // Right arm + SWORD
  const hideSword=heavy&&dir==='up'&&inAct; // sword is thrown, not in hand
  ctx.save();ctx.translate(bx+w-4,by2+h*0.38-swing*0.4);
  let swordAng=0,swordTx=0,swordTy=0;
  if(inAct){
    if(heavy&&dir==='side'){swordAng=-Math.PI*0.75+tAct*Math.PI*1.5;swordTx=14;swordTy=-10+tAct*20;}
    else if(heavy&&dir==='up'){swordAng=-1.6;swordTx=4;swordTy=-18;}
    else if(heavy&&dir==='down'){swordAng=0.18;swordTx=8;swordTy=14;}
    else if(dir==='side'&&cn===1){swordAng=-0.2;swordTx=10;swordTy=-4;}
    else if(dir==='side'&&cn===2){swordAng=0.3;swordTx=14;swordTy=2;}
    else if(dir==='side'&&cn===3){swordAng=-0.5;swordTx=18;swordTy=-8;}
    else if(dir==='up'){swordAng=-1.3-cn*0.1;swordTx=4;swordTy=-12-cn*4;}
    else if(dir==='down'){swordAng=1.5;swordTx=6;swordTy=10;}
    else{swordAng=-0.1+cn*0.15;swordTx=12+cn*2;}
    ctx.translate(swordTx,swordTy);ctx.rotate(swordAng);
  }else{ctx.rotate(-swing*0.04);}
  rrFill(0,0,11,h*0.26,4,ch.color);ctx.fillStyle=ch.accent;ctx.beginPath();ctx.arc(5,h*0.26,7,0,Math.PI*2);ctx.fill();
  // Draw sword from hand (hidden when thrown)
  if(!hideSword){
    const sCol=cn===3&&inAct?'#ffffff':inSU?ch.hi:ch.eyeCol;
    const sLen=inAct?(heavy?108:cn===3?95:cn===2?80:68):62;
    ctx.strokeStyle=sCol;ctx.lineWidth=4;ctx.lineCap='round';
    ctx.shadowBlur=inAct?18:8;ctx.shadowColor=ch.eyeCol;
    ctx.beginPath();ctx.moveTo(5,h*0.26+6);ctx.lineTo(5,h*0.26+6+sLen);ctx.stroke();
    ctx.strokeStyle=ch.hi;ctx.lineWidth=2;ctx.globalAlpha=0.6;
    ctx.beginPath();ctx.moveTo(5,h*0.26+6);ctx.lineTo(5,h*0.26+6+sLen*0.85);ctx.stroke();ctx.globalAlpha=1;ctx.shadowBlur=0;
    ctx.strokeStyle=ch.accent;ctx.lineWidth=5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-4,h*0.26+8);ctx.lineTo(14,h*0.26+8);ctx.stroke();
    ctx.fillStyle=sCol;ctx.beginPath();ctx.moveTo(2,h*0.26+6+sLen);ctx.lineTo(8,h*0.26+6+sLen);ctx.lineTo(5,h*0.26+6+sLen+10);ctx.closePath();ctx.fill();
  }
  ctx.restore();
  // Head (knight helmet)
  ctx.fillStyle=ch.color;ctx.beginPath();ctx.ellipse(0,by2+h*0.2,w*0.4,h*0.22,0,0,Math.PI*2);ctx.fill();
  rrFill(-w*0.38,by2+h*0.04,w*0.76,h*0.11,3,ch.accent);
  ctx.fillStyle=ch.hi;ctx.beginPath();ctx.ellipse(-5,by2+h*0.12,w*0.26,h*0.09,-0.2,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=0.9;rrFill(-w*0.26,by2+h*0.18,w*0.52,h*0.09,4,inAct?'#fff':ch.eyeCol);ctx.globalAlpha=1;
  ctx.fillStyle=inAct?(cn===3?'#fff':'#330033'):'#330033';ctx.beginPath();ctx.arc(-7,by2+h*0.22,3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(7,by2+h*0.22,3,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=ch.accent;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,by2+h*0.04);ctx.lineTo(0,by2-h*0.04);ctx.stroke();ctx.beginPath();ctx.moveTo(-5,by2-h*0.04);ctx.lineTo(5,by2-h*0.04);ctx.stroke();
}



