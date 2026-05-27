import { ctx, W, H, bullets, miniSwords, rocketArms, rocketMines, smokeClouds, unstableHeads, knives, throwSwords, firePebbles, pristineRockets, factoryBolts, factoryGears, factoryZaps, particles, aabb, sameTeam } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, addDeathExplosion, instakill, rrFill, rrStroke, rrPath } from '../particles.js';
import { MAX_KB, DEATH_THRESHOLD, FLY_ACCEL, MAX_FLY_SPEED, FLY_FRIC, DASH_FRAMES, DASH_MULT } from '../player/constants.js';
import { kbScale, playSfx, playSfxNoise } from '../audio.js';
import { SmokeCloud, UnstableHead } from './unstable_projectiles.js';

export const char = { id:7,name:'UNSTABLE',tag:'The Walking Disaster',
    desc:['Smoke clouds & burn DoT','Self-destruct heavy','High risk, high chaos'],
    color:'#cc2244',accent:'#881122',eyeCol:'#ff8800',hi:'#ff4466',
    w:52,h:60,speed:6.5,jumpF:-12.9,djF:-11.4,weight:0.9,def:1.16,shieldCool:132,
    lDmg:8,hDmg:16,lKB:9,hKB:19,lSU:4,hSU:14,lAct:8,hAct:10,lEl:7,hEl:20,
    lSz:12,lRch:12,hSz:14,hRch:14 };

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
  // Stumble walk: irregular step heights, random arm droop, occasional lurch
  const bob=grounded?Math.sin(wf*Math.PI/2)*2:0, by2=by+bob;
  // Randomize leg step with a slow noise-like offset per wf phase
  const llBase=grounded?(wf<2?5:-5):0;
  const llNoise=grounded?Math.sin(G.frame*0.31+wf*1.7)*1.8:0; // slow wobble on top
  const ll=llBase+llNoise;
  // Random arm droop angles that shift slowly
  const armDroopL=Math.sin(G.frame*0.13)*0.18+0.08;
  const armDroopR=Math.sin(G.frame*0.17+1.2)*0.15-0.05;
  // Aerial: body tumbles erratically, parts flail, smoke trails behind
  const airTumble=grounded?0:Math.sin(G.frame*0.09)*0.15+Math.cos(G.frame*0.14)*0.08;
  const airFlail=grounded?0:Math.sin(G.frame*0.22)*12; // arms flail wildly
  const isDash=!heavy&&inAct&&(dir==='side'||dir==='neutral');
  const isExploding=heavy&&inAct&&dir==='down';
  const headGone=!heavy&&inAct&&dir==='up';

  // Constant jitter — gets worse during attacks
  const jAmt=isExploding?3:heavy&&inAct?1.8:0.55;
  const jx=Math.sin(G.frame*1.7)*jAmt, jy=Math.cos(G.frame*2.1)*jAmt*0.5;

  // Shadow (wobbly outline)
  if(grounded){
    ctx.fillStyle='rgba(0,0,0,0.28)';
    ctx.beginPath();ctx.ellipse(jx*0.3,h/2+4,w*0.44+Math.abs(jx),5,0,0,Math.PI*2);ctx.fill();
  }

  // Dash afterimage — chaotic with debris dots
  if(isDash){
    ctx.save();
    ctx.globalAlpha=0.3+tAct*0.22;ctx.fillStyle=ch.color;
    ctx.beginPath();ctx.ellipse(-12*tAct*7,by2+h*0.5,w*0.42,h*0.33,0,0,Math.PI*2);ctx.fill();
    for(let i=0;i<5;i++){
      ctx.globalAlpha=(0.55-i*0.09)*tAct;
      ctx.fillStyle=i%2===0?ch.eyeCol:ch.accent;
      ctx.beginPath();ctx.arc(-28-i*16*tAct,(i-2)*9*tAct+by2+h*0.5,3-i*0.4,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }

  // ── LEGS (asymmetric and cracked) ──
  // Left leg: angled outward, crack mark
  ctx.save();ctx.translate(bx+10,by2+h*0.64+jy*0.3);ctx.rotate(-0.09);
  rrFill(-6,0,13,h*0.28+ll,4,ch.accent);
  ctx.strokeStyle='#ff4466';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(2,h*0.07);ctx.lineTo(-3,h*0.16);ctx.lineTo(2,h*0.24);ctx.stroke();
  ctx.restore();
  // Right leg: shorter, bent inward
  ctx.save();ctx.translate(bx+w-13,by2+h*0.65-jy*0.3);ctx.rotate(0.13);
  rrFill(-6,0,12,h*0.25-ll,4,ch.accent);
  // Visible bolt
  ctx.fillStyle='#888';ctx.beginPath();ctx.arc(-1,h*0.1,2,0,Math.PI*2);ctx.fill();
  ctx.restore();
  // Feet (uneven)
  ctx.fillStyle='#220000';
  ctx.beginPath();ctx.ellipse(bx+10,by2+h*0.93+ll/2,11,5,0.08,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#2a0000';
  ctx.beginPath();ctx.ellipse(bx+w-11,by2+h*0.91-ll/2,9,4,-0.15,0,Math.PI*2);ctx.fill();
  // Exposed wires at leg joints
  ctx.strokeStyle='#ff8800';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(bx+8,by2+h*0.65);ctx.lineTo(bx+4,by2+h*0.70);ctx.stroke();
  ctx.strokeStyle='#ffcc00';
  ctx.beginPath();ctx.moveTo(bx+w-10,by2+h*0.64);ctx.lineTo(bx+w-5,by2+h*0.68);ctx.stroke();

  // ── TORSO ──
  ctx.save();ctx.translate(jx*0.6,jy*0.4);ctx.rotate(airTumble);
  rrFill(bx+4,by2+h*0.32,w-8,h*0.39,8,ch.color);
  // Highlight strip (slightly skewed)
  ctx.save();ctx.translate(bx+8,by2+h*0.34);ctx.rotate(0.04);
  rrFill(0,0,w-16,h*0.09,3,ch.hi);ctx.restore();
  // Diagonal chest crack
  ctx.strokeStyle='#ff4466';ctx.lineWidth=1.5;ctx.globalAlpha=0.9;
  ctx.beginPath();ctx.moveTo(bx+14,by2+h*0.35);ctx.lineTo(bx+21,by2+h*0.47);ctx.lineTo(bx+13,by2+h*0.59);ctx.stroke();
  ctx.globalAlpha=1;
  // Loose panel hanging off top-right of torso
  ctx.save();ctx.translate(bx+w-15,by2+h*0.37);ctx.rotate(0.24+Math.sin(G.frame*0.06)*0.045);
  rrPath(-2,-1,11,17,2);ctx.fillStyle='#881122';ctx.fill();ctx.strokeStyle='#cc2244';ctx.lineWidth=1;ctx.stroke();
  ctx.restore();
  // Dark gap behind loose panel + exposed wires
  ctx.fillStyle='#0d0005';ctx.fillRect(bx+w-14,by2+h*0.37,8,16);
  ctx.strokeStyle='#ffcc00';ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(bx+w-13,by2+h*0.39);ctx.quadraticCurveTo(bx+w-8,by2+h*0.44,bx+w-13,by2+h*0.51);ctx.stroke();
  ctx.strokeStyle='#00ffcc';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(bx+w-11,by2+h*0.40);ctx.quadraticCurveTo(bx+w-7,by2+h*0.46,bx+w-10,by2+h*0.52);ctx.stroke();
  // Arm ports
  const portLeft=bx-2, portRight=bx+w+2, portY=by2+h*0.44;
  ctx.fillStyle=inAct?ch.eyeCol:'#550000';
  if(inAct){ctx.save();ctx.shadowBlur=12;ctx.shadowColor=ch.eyeCol;}
  ctx.beginPath();ctx.arc(portLeft,portY,7,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(portRight,portY,7,0,Math.PI*2);ctx.fill();
  if(inAct)ctx.restore();
  ctx.restore(); // end torso jitter

  // Persistent idle sparks at joints
  const sf=G.frame*0.13;
  ctx.save();
  ctx.globalAlpha=0.5+Math.sin(sf*3)*0.5;ctx.fillStyle='#ff8800';
  ctx.beginPath();ctx.arc(bx+w*0.5+Math.sin(sf)*3,by2+h*0.32,2,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=0.35+Math.cos(sf*2)*0.35;ctx.fillStyle='#ffcc00';
  ctx.beginPath();ctx.arc(portRight+Math.cos(sf*1.5)*2,portY+2,1.5,0,Math.PI*2);ctx.fill();
  ctx.restore();
  // Idle head smoke puff
  if(Math.sin(sf*2.2)>0.55&&!headGone){
    ctx.save();ctx.globalAlpha=0.22;ctx.fillStyle='#998877';
    ctx.beginPath();ctx.arc(bx+w*0.55+Math.sin(sf)*3,by2,6,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  // ── SIDE HEAVY: flame burst + metal debris ──
  if(heavy&&inAct&&(dir==='side'||dir==='neutral')){
    ctx.save();
    const flameX=bx+w+8, flameLen=52+tAct*34;
    for(let i=0;i<6;i++){
      const t=i/5, wobY=(Math.random()-.5)*20*t;
      ctx.globalAlpha=(1-t)*0.72;
      const gr=ctx.createLinearGradient(flameX,portY,flameX+flameLen*t,portY+wobY);
      gr.addColorStop(0,'#ffaa00');gr.addColorStop(0.5,'#ff3300');gr.addColorStop(1,'rgba(180,0,0,0)');
      ctx.strokeStyle=gr;ctx.lineWidth=16*(1-t)+3;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(flameX,portY+wobY*0.1);ctx.lineTo(flameX+flameLen*t,portY+wobY);ctx.stroke();
    }
    // Metal shards flying with the blast
    for(let i=0;i<4;i++){
      const dt=(tAct+i*0.25)%1;
      ctx.globalAlpha=(1-dt)*0.85;ctx.fillStyle=i%2===0?ch.color:ch.accent;
      ctx.save();ctx.translate(flameX+dt*55+(i-1.5)*8,portY+(i-1.5)*14*dt);
      ctx.rotate(dt*Math.PI*3*(i%2===0?1:-1));ctx.fillRect(-3.5,-2,7,4);ctx.restore();
    }
    ctx.restore();
  }

  // ── UP HEAVY: smoke plumes with shaking ──
  if(heavy&&(inAct||inSU)&&dir==='up'){
    ctx.save();
    const shk=inSU?(atk.frame/atk.su)*4:4;
    ctx.globalAlpha=0.55+Math.sin(atk.frame*0.5)*0.15;ctx.fillStyle='#998877';
    const puff=Math.sin(atk.frame*0.45)*6;
    ctx.beginPath();ctx.arc(portLeft+(Math.random()-.5)*shk,portY+puff+5,12,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(portRight+(Math.random()-.5)*shk,portY+puff+5,12,0,Math.PI*2);ctx.fill();
    if(inAct){
      ctx.globalAlpha=0.35*tAct;ctx.fillStyle='#776655';
      ctx.beginPath();ctx.arc(portLeft,portY-12*tAct,10*tAct,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(portRight,portY-12*tAct,10*tAct,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }

  // ── DOWN HEAVY: explosion + flying shards ──
  if(isExploding){
    ctx.save();
    const gr=ctx.createRadialGradient(0,by2+h*0.5,5,0,by2+h*0.5,90);
    gr.addColorStop(0,'#ffee00');gr.addColorStop(0.35,'#ff4400');gr.addColorStop(1,'rgba(170,0,0,0)');
    ctx.globalAlpha=tAct*0.82;ctx.fillStyle=gr;
    ctx.beginPath();ctx.arc(0,by2+h*0.5,90,0,Math.PI*2);ctx.fill();
    for(let i=0;i<8;i++){
      const ang=i/8*Math.PI*2, dist=20+tAct*70;
      ctx.globalAlpha=(1-tAct)*0.92;
      ctx.fillStyle=i%3===0?ch.color:i%3===1?ch.accent:ch.eyeCol;
      ctx.save();ctx.translate(Math.cos(ang)*dist,by2+h*0.5+Math.sin(ang)*dist);
      ctx.rotate(tAct*Math.PI*(i%2===0?4:-4));ctx.fillRect(-4,-3,8,6);ctx.restore();
    }
    ctx.globalAlpha=tAct*0.35;ctx.strokeStyle='#ffee00';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(0,by2+h*0.5,18+tAct*65,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }

  // ── ARMS ──
  const armLX=bx-3, armRX=bx+w+3, armY=by2+h*0.38;
  // Left arm: drooping, cracked, with occasional spark at hand; flails when airborne
  ctx.save();ctx.translate(armLX+jx*0.5,armY+4+jy*0.5+airFlail*0.5);
  ctx.rotate(-0.14+armDroopL+Math.sin(G.frame*0.09)*0.035+(grounded?0:airFlail*0.03));
  rrFill(-15,0,14,h*0.30,5,ch.color);
  ctx.strokeStyle='#ff4466';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(-8,h*0.08);ctx.lineTo(-5,h*0.19);ctx.stroke();
  ctx.fillStyle=ch.accent;ctx.beginPath();ctx.ellipse(-8,h*0.30,9,7,0.2,0,Math.PI*2);ctx.fill();
  if(Math.sin(G.frame*0.27)>0.55){
    ctx.fillStyle='#ff8800';ctx.globalAlpha=0.75;
    ctx.beginPath();ctx.arc(-8+(Math.random()*4-2),h*0.33,2,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
  // Right arm: stubby, extends on side heavy; flails opposite to left when airborne
  ctx.save();ctx.translate(armRX+jx*0.3,armY-2+jy*0.3-airFlail*0.5);
  if(inAct&&heavy&&(dir==='side'||dir==='neutral'))ctx.translate(22,0);
  ctx.rotate(0.1+armDroopR+Math.sin(G.frame*0.1+1.2)*0.03+(grounded?0:-airFlail*0.03));
  rrFill(0,0,14,h*0.26,5,ch.color);
  ctx.fillStyle=ch.accent;ctx.beginPath();ctx.ellipse(7,h*0.26,8,6,-0.12,0,Math.PI*2);ctx.fill();
  ctx.restore();

  // ── HEAD (tilted, cracked, loose panel, flickering eye) ──
  if(!headGone){
    ctx.save();ctx.translate(jx*0.45,jy*0.3);
    ctx.rotate(0.055+Math.sin(G.frame*0.07)*0.018); // permanent tilt
    rrFill(bx+8,by2+h*0.04,w-16,h*0.30,9,ch.color);
    // Highlight bar
    ctx.save();ctx.translate(bx+12,by2+h*0.06);ctx.rotate(-0.04);
    rrFill(0,0,w-24,h*0.08,3,ch.hi);ctx.restore();
    // Head crack
    ctx.strokeStyle='#ff4466';ctx.lineWidth=1.5;ctx.globalAlpha=0.85;
    ctx.beginPath();ctx.moveTo(bx+10,by2+h*0.07);ctx.lineTo(bx+15,by2+h*0.16);ctx.lineTo(bx+10,by2+h*0.23);ctx.stroke();
    ctx.globalAlpha=1;
    // Loose side panel swinging
    ctx.save();ctx.translate(bx+w-7,by2+h*0.12);ctx.rotate(0.28+Math.sin(G.frame*0.07)*0.05);
    rrFill(-3,-2,8,15,2,ch.accent);ctx.restore();
    // Cracked visor
    ctx.fillStyle='#110000';ctx.beginPath();ctx.ellipse(0,by2+h*0.18,w*0.28,h*0.082,0,0,Math.PI*2);ctx.fill();
    // Left eye bright, right eye flickering
    const flickOn=Math.sin(G.frame*0.35)>-0.2;
    const ec1=inAct?'#ffcc00':'#cc2200';
    const ec2=inAct?ch.eyeCol:(flickOn?'#992200':'#220000');
    if(inAct){ctx.save();ctx.shadowBlur=10;ctx.shadowColor=ch.eyeCol;}
    ctx.fillStyle=ec1;ctx.beginPath();ctx.arc(-9,by2+h*0.18,5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=ec2;ctx.beginPath();ctx.arc(9,by2+h*0.18,4,0,Math.PI*2);ctx.fill();
    if(inAct)ctx.restore();
    ctx.shadowBlur=0;
    // Visor cracks
    ctx.strokeStyle='#ff4400';ctx.lineWidth=1;ctx.globalAlpha=0.7;
    ctx.beginPath();ctx.moveTo(-14,by2+h*0.14);ctx.lineTo(-3,by2+h*0.22);ctx.stroke();
    ctx.beginPath();ctx.moveTo(5,by2+h*0.15);ctx.lineTo(11,by2+h*0.21);ctx.stroke();
    ctx.globalAlpha=1;
    // "!" danger marker (slightly off-center)
    ctx.fillStyle='#ff0000';ctx.font='bold 11px monospace';ctx.textAlign='center';
    ctx.shadowBlur=5;ctx.shadowColor='#ff0000';
    ctx.fillText('!',2,by2+h*0.10);ctx.shadowBlur=0;
    ctx.restore(); // end head
  } else {
    // Neck stump — heat glow + orbiting sparks + dangling wires
    ctx.save();
    ctx.globalAlpha=0.55;
    const ng=ctx.createRadialGradient(0,by2+h*0.08,2,0,by2+h*0.08,16);
    ng.addColorStop(0,'#ffee00');ng.addColorStop(1,'rgba(255,60,0,0)');
    ctx.fillStyle=ng;ctx.beginPath();ctx.arc(0,by2+h*0.08,16,0,Math.PI*2);ctx.fill();
    for(let i=0;i<7;i++){
      const ang=i/7*Math.PI*2+G.frame*0.28, d=4+Math.sin(G.frame*0.35+i)*3;
      ctx.fillStyle=i%2===0?'#ff8800':'#ffcc00';
      ctx.globalAlpha=0.7+Math.sin(G.frame*0.4+i)*0.3;
      ctx.beginPath();ctx.arc(Math.cos(ang)*d,by2+h*0.08+Math.sin(ang)*3.5,2.5,0,Math.PI*2);ctx.fill();
    }
    ctx.strokeStyle='#ff8800';ctx.lineWidth=1.5;ctx.globalAlpha=0.85;
    ctx.beginPath();ctx.moveTo(-5,by2+h*0.10);ctx.quadraticCurveTo(-8,by2+h*0.17,-4,by2+h*0.22);ctx.stroke();
    ctx.strokeStyle='#ffcc00';
    ctx.beginPath();ctx.moveTo(3,by2+h*0.10);ctx.quadraticCurveTo(6,by2+h*0.16,4,by2+h*0.22);ctx.stroke();
    ctx.restore();
  }
}



