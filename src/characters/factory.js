import { ctx, W, H, bullets, miniSwords, rocketArms, rocketMines, smokeClouds, unstableHeads, knives, throwSwords, firePebbles, pristineRockets, factoryBolts, factoryGears, factoryZaps, particles, aabb, sameTeam } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, addDeathExplosion, instakill, rrFill, rrStroke, rrPath } from '../particles.js';
import { MAX_KB, DEATH_THRESHOLD, FLY_ACCEL, MAX_FLY_SPEED, FLY_FRIC, DASH_FRAMES, DASH_MULT } from '../player/constants.js';
import { kbScale, playSfx, playSfxNoise } from '../audio.js';
import { FactoryBolt, FactoryGear, FactoryZap, drawGearShape } from './factory_projectiles.js';

export const char = { id:12,name:'FACTORY',tag:'The Manufacturer',
    desc:['Down+Light: launch Bolt minion (5s CD)','Down+Heavy: deploy 3 Zaps (3s CD)','Side+Heavy: spinning drill (1s)'],
    color:'#666666',accent:'#333333',eyeCol:'#00ccff',hi:'#999999',
    w:66,h:80,speed:3.5,jumpF:-11.5,djF:-9.5,weight:1.5,def:0.70,shieldCool:132,
    lDmg:6,hDmg:14,lKB:6,hKB:14,lSU:5,hSU:12,lAct:7,hAct:10,lEl:10,hEl:20,
    lSz:18,lRch:80,hSz:22,hRch:96,
    boltCDMax:300,zapCDMax:180 };

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
  const bob=grounded?Math.sin(wf*Math.PI/2)*2:0, by2=by+bob;

  // Shadow
  if(grounded){ctx.fillStyle='rgba(0,0,0,0.34)';ctx.beginPath();ctx.ellipse(0,h/2+5,w*0.54,7,0,0,Math.PI*2);ctx.fill();}

  // Legs (heavy pistons)
  const ll=grounded?(wf<2?5:-5):0;
  rrFill(bx+6,by2+h*0.67,20,h*0.28+ll,6,ch.accent);
  rrFill(bx+w-26,by2+h*0.67,20,h*0.28-ll,6,ch.accent);
  // Foot pads
  rrFill(bx+2,by2+h*0.92+ll/2,28,10,4,'#222');
  rrFill(bx+w-30,by2+h*0.92-ll/2,28,10,4,'#222');
  // Piston rods
  ctx.strokeStyle='#555';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(bx+16,by2+h*0.71);ctx.lineTo(bx+16,by2+h*0.87);ctx.stroke();
  ctx.beginPath();ctx.moveTo(bx+w-16,by2+h*0.71);ctx.lineTo(bx+w-16,by2+h*0.87);ctx.stroke();

  // Body (large industrial block)
  rrFill(bx+2,by2+h*0.31,w-4,h*0.43,8,ch.color);
  // Vertical armor ridges
  ctx.strokeStyle=ch.accent;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(bx+10,by2+h*0.34);ctx.lineTo(bx+10,by2+h*0.70);ctx.stroke();
  ctx.beginPath();ctx.moveTo(bx+w-10,by2+h*0.34);ctx.lineTo(bx+w-10,by2+h*0.70);ctx.stroke();
  // Chest gear emblem
  ctx.save();ctx.translate(0,by2+h*0.50);ctx.rotate(wf*0.04);
  drawGearShape(ctx,h*0.09,8,ch.accent,ch.hi);
  ctx.restore();
  // Vent slots
  ctx.fillStyle='#222';
  for(let i=0;i<4;i++){ctx.fillRect(bx+12+i*10,by2+h*0.59,7,9);}
  // Corner bolts
  ctx.fillStyle='#888';
  for(const [bx3,by3] of [[bx+8,by2+h*0.35],[bx+w-8,by2+h*0.35],[bx+8,by2+h*0.69],[bx+w-8,by2+h*0.69]]){
    ctx.beginPath();ctx.arc(bx3,by3,3,0,Math.PI*2);ctx.fill();
  }

  // Arms
  const armY=by2+h*0.33, armH=h*0.30;
  // Left arm
  rrFill(bx-16,armY,18,armH,6,ch.color);
  rrFill(bx-18,armY+armH*0.28,12,armH*0.42,4,ch.accent);
  // Right arm (extends further during drill)
  const rShift=(heavy&&inAct&&(dir==='side'||dir==='neutral'))?10:0;
  rrFill(bx+w-2+rShift,armY,18,armH,6,ch.color);
  rrFill(bx+w+6+rShift,armY+armH*0.28,12,armH*0.42,4,ch.accent);

  // Head (large rectangular industrial)
  rrFill(bx+4,by2,w-8,h*0.34,10,ch.color);
  ctx.strokeStyle=ch.accent;ctx.lineWidth=2;
  ctx.strokeRect(bx+8,by2+h*0.04,w-16,h*0.25);
  // Exhaust stacks on top
  rrFill(bx+8,by2-10,9,14,3,'#333');
  rrFill(bx+w-17,by2-10,9,14,3,'#333');
  // Stack smoke puffs
  if(grounded&&wf%2===0){ctx.fillStyle='rgba(120,120,120,0.3)';ctx.beginPath();ctx.arc(bx+12,by2-14,5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(bx+w-13,by2-14,5,0,Math.PI*2);ctx.fill();}
  // Eyes
  const eyeGlow=inAct;
  ctx.fillStyle=eyeGlow?ch.eyeCol:'#1a3344';
  if(eyeGlow){ctx.save();ctx.shadowBlur=18;ctx.shadowColor=ch.eyeCol;}
  rrFill(bx+10,by2+h*0.08,20,11,3,eyeGlow?ch.eyeCol:'#1a3344');
  rrFill(bx+w-30,by2+h*0.08,20,11,3,eyeGlow?ch.eyeCol:'#1a3344');
  if(eyeGlow){ctx.restore();}
  ctx.shadowBlur=0;

  // === ATTACK VISUALS ===

  // Side light: arm wind-up and gear swing
  if(!heavy&&(inSU||inAct)&&(dir==='side'||dir==='neutral')){
    ctx.save();
    const pivX=bx+w+6, pivY=by2+h*0.38+armH*0.1;
    const startA=-Math.PI*0.78, endA=Math.PI*0.18;
    const prog=inSU?atk.frame/Math.max(atk.su,1):1;
    const angle=inSU?startA:startA+(endA-startA)*tAct;
    const handleLen=60;
    const gx=pivX+Math.cos(angle)*handleLen, gy=pivY+Math.sin(angle)*handleLen;

    // Swing arc trail (active only)
    if(inAct&&tAct>0.05){
      ctx.strokeStyle=ch.eyeCol; ctx.lineWidth=6; ctx.lineCap='round';
      ctx.globalAlpha=0.22*(1-tAct);
      ctx.beginPath();
      ctx.arc(pivX,pivY,handleLen,startA,angle);
      ctx.stroke();
      ctx.globalAlpha=1;
    }

    // Handle (thick arm extension)
    ctx.strokeStyle=inAct?ch.hi:'#888'; ctx.lineWidth=7; ctx.lineCap='round';
    if(inAct){ctx.shadowBlur=8;ctx.shadowColor=ch.eyeCol;}
    ctx.globalAlpha=inSU?0.5+prog*0.5:1;
    ctx.beginPath();ctx.moveTo(pivX,pivY);ctx.lineTo(gx,gy);ctx.stroke();

    // Gear at tip
    ctx.translate(gx,gy);
    ctx.rotate(angle + (inAct?tAct*Math.PI*3:0));
    const gSize=inAct?22:16;
    if(inAct){ctx.shadowBlur=16;ctx.shadowColor=ch.eyeCol;}
    drawGearShape(ctx,gSize,8,inAct?ch.eyeCol:ch.hi,'#333');

    // Impact sparks on final quarter of swing
    if(inAct&&tAct>0.7){
      ctx.shadowBlur=0; ctx.rotate(-(angle+tAct*Math.PI*3));
      ctx.strokeStyle='#ffffff'; ctx.lineWidth=1.5;
      for(let i=0;i<6;i++){
        const sa=((i/6)*Math.PI*2)+tAct*4;
        const sr=gSize+4+Math.random()*10;
        ctx.globalAlpha=0.7*(1-tAct)*3;
        ctx.beginPath();ctx.moveTo(Math.cos(sa)*gSize,Math.sin(sa)*gSize);ctx.lineTo(Math.cos(sa)*sr,Math.sin(sa)*sr);ctx.stroke();
      }
    }
    ctx.shadowBlur=0; ctx.globalAlpha=1;
    ctx.restore();
  }

  // Up light: arm raises, gear visible at peak of throw (startup only)
  if(!heavy&&inSU&&dir==='up'){
    ctx.save();ctx.globalAlpha=0.6+atk.frame/atk.su*0.4;
    const raise=atk.frame/atk.su*32;
    ctx.strokeStyle=ch.color;ctx.lineWidth=5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(bx+w+8,armY+armH*0.4);ctx.lineTo(bx+w+14,armY-raise);ctx.stroke();
    ctx.translate(bx+w+14,armY-raise-14);ctx.rotate(-atk.frame*0.2);
    drawGearShape(ctx,12,5,ch.hi,ch.accent);
    ctx.restore();
  }

  // Side heavy: drill arm extended + spinning tip
  if(heavy&&(inSU||inAct)&&(dir==='side'||dir==='neutral')){
    ctx.save();
    const ext=(inAct?12:4)+rShift;
    const drillBaseX=bx+w+ext, drillY=armY+armH*0.42;
    // Drill body
    ctx.fillStyle='#555';ctx.fillRect(drillBaseX,drillY-9,42,18);
    ctx.strokeStyle='#777';ctx.lineWidth=1;ctx.strokeRect(drillBaseX,drillY-9,42,18);
    // Spinning flutes
    const spin=atk?atk.frame*0.45:0;
    ctx.save();ctx.translate(drillBaseX+48,drillY);ctx.rotate(spin);
    ctx.fillStyle='#888';
    for(let i=0;i<3;i++){
      ctx.save();ctx.rotate(i*Math.PI*2/3);
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(16,4);ctx.lineTo(16,-4);ctx.closePath();ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    if(inAct){ctx.shadowBlur=10;ctx.shadowColor=ch.eyeCol;ctx.strokeStyle=ch.eyeCol;ctx.lineWidth=1.5;ctx.strokeRect(drillBaseX,drillY-9,42,18);}
    ctx.restore();
  }

  // Down heavy startup: indicators for Zap spawn positions
  if(heavy&&inSU&&dir==='down'){
    const prog=atk.frame/atk.su;
    ctx.save();ctx.globalAlpha=prog*0.75;
    for(const ox of [-50,0,50]){
      ctx.strokeStyle=ch.eyeCol;ctx.lineWidth=2;ctx.setLineDash([3,3]);
      ctx.beginPath();ctx.arc(ox,h*0.2,10,0,Math.PI*2);ctx.stroke();
    }
    ctx.setLineDash([]);ctx.restore();
  }

  // Up heavy: giant gear on a chain, sweeping wide arc
  if(heavy&&(inSU||inAct)&&dir==='up'){
    ctx.save();
    const pivX=0, pivY=by2+h*0.06;
    const chainLen=80;
    const startA=-Math.PI*0.88, endA=Math.PI*0.88;
    let angle;
    const prog=inSU?atk.frame/Math.max(atk.su,1):1;
    if(inSU){
      // Wind up: gear rises to starting position
      angle=-Math.PI*0.5 + (startA+Math.PI*0.5)*prog;
      ctx.globalAlpha=0.35+prog*0.65;
    } else {
      angle=startA+tAct*(endA-startA);
    }
    const gx=pivX+Math.cos(angle)*chainLen, gy=pivY+Math.sin(angle)*chainLen;

    // Sweep arc trail
    if(inAct&&tAct>0.04){
      ctx.save();
      ctx.strokeStyle=ch.eyeCol; ctx.lineWidth=10; ctx.lineCap='round';
      ctx.globalAlpha=0.18*(1-tAct*0.7);
      ctx.shadowBlur=12; ctx.shadowColor=ch.eyeCol;
      ctx.beginPath(); ctx.arc(pivX,pivY,chainLen,startA,angle); ctx.stroke();
      ctx.globalAlpha=0.08*(1-tAct);
      ctx.lineWidth=22;
      ctx.beginPath(); ctx.arc(pivX,pivY,chainLen,startA,angle); ctx.stroke();
      ctx.restore();
    }

    // Chain links
    const linkCount=8;
    for(let i=0;i<=linkCount;i++){
      const t2=i/linkCount;
      const la=inSU?angle:(startA+(angle-startA)*t2);
      const lx=pivX+Math.cos(la)*chainLen*(i/linkCount);
      const ly=pivY+Math.sin(la)*chainLen*(i/linkCount);
      ctx.fillStyle=i%2===0?'#777':'#555';
      ctx.shadowBlur=0;
      ctx.beginPath();ctx.arc(lx,ly,3,0,Math.PI*2);ctx.fill();
    }
    // Chain rod
    ctx.strokeStyle='#666'; ctx.lineWidth=3; ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(pivX,pivY);ctx.lineTo(gx,gy);ctx.stroke();

    // Giant gear
    ctx.translate(gx,gy);
    const spin=inAct?tAct*Math.PI*4:(prog*Math.PI);
    ctx.rotate(spin);
    if(inAct){ctx.shadowBlur=20;ctx.shadowColor=ch.eyeCol;}
    drawGearShape(ctx,28,9,inAct?ch.eyeCol:ch.hi,inAct?ch.accent:'#444');

    // Sparks at apex (center of swing)
    if(inAct&&tAct>0.45&&tAct<0.65){
      ctx.rotate(-spin);
      ctx.strokeStyle='#ffffff'; ctx.lineWidth=1.5;
      const sparkAlpha=1-Math.abs(tAct-0.55)*20;
      for(let i=0;i<8;i++){
        const sa=(i/8)*Math.PI*2;
        ctx.globalAlpha=Math.max(0,sparkAlpha)*0.9;
        ctx.beginPath();ctx.moveTo(Math.cos(sa)*28,Math.sin(sa)*28);ctx.lineTo(Math.cos(sa)*46,Math.sin(sa)*46);ctx.stroke();
      }
    }
    ctx.shadowBlur=0; ctx.globalAlpha=1;
    ctx.restore();
  }
}



