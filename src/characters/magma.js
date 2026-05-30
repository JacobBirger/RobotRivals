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
    flameFuelMax:90,flameRange:220,flameRechargeRate:0.75,
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
  // Heat shimmer particles during heavy startup (building pressure)
  if(inSU && a.type==='heavy' && a.frame%3===0){
    const ang = Math.random()*Math.PI*2;
    const r = 14+tSU*20;
    particles.push({x:player.cx+Math.cos(ang)*r, y:player.cy+Math.sin(ang)*r,
      vx:(Math.random()-0.5)*2, vy:-1.5-Math.random()*2,
      life:14,max:14, col:tSU>0.5?'#ffaa00':'#ff3300', sz:2+tSU*3});
  }
  // Ember sparks during flamethrower active (side/neutral light)
  if(inAct && !a.type!=='heavy' && (a.dir==='side'||a.dir==='neutral') && a.frame%2===0){
    const px = player.cx + player.facing*(player.w*0.6 + Math.random()*60);
    const py = player.cy - player.h*0.1 + (Math.random()-0.5)*20;
    particles.push({x:px,y:py, vx:player.facing*(1+Math.random()*3), vy:-1-Math.random()*2,
      life:12,max:12, col:Math.random()<0.5?'#ffcc00':'#ff4400', sz:1.5+Math.random()*2});
  }
  // Endlag steam from nozzles
  if(inEl && a.frame%4===0 && tEl<0.5){
    for(let s=-1;s<=1;s+=2){
      const px = player.cx + s*(player.w*0.6);
      const py = player.cy - player.h*0.1;
      particles.push({x:px,y:py, vx:(Math.random()-0.5)*2, vy:-1-Math.random()*1.5,
        life:22,max:22, col:'#886644', sz:4+Math.random()*3});
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
  const dir=atk?atk.dir:null;
  const heavy=atk&&atk.type==='heavy';
  // Heavy trudge: slow deliberate steps, body rocks side to side
  const bob=grounded?Math.sin(wf*Math.PI/2)*1.5:0, by2=by+bob;
  const ll=grounded?(wf<2?4:-4):0;
  const trudgeLean=grounded?Math.sin(wf*Math.PI/2)*0.04:0;
  // Aerial: tips back from jump thrust
  const airRecoilTilt=grounded?0:Math.sin(G.frame*0.06)*0.06-0.08;
  const airJetGlow=!grounded;

  // Body lean during attacks
  // Heavy SU: hunch forward (building pressure), active: slam forward, endlag: stagger back hunched
  const heavySULean = inSU&&heavy ? 0.15*tSU : 0;
  const activeBodyLean = inAct&&heavy ? 0.2 : inAct&&dir==='side' ? 0.1 : 0;
  const elBodyLean = inEl&&heavy ? -0.25*(1-tEl) : inEl ? -0.1*(1-tEl) : 0;
  const atkLean = heavySULean + activeBodyLean + elBodyLean;

  // Shadow
  if(grounded){ctx.fillStyle='rgba(0,0,0,0.28)';ctx.beginPath();ctx.ellipse(0,h/2+4,w*0.5,6,0,0,Math.PI*2);ctx.fill();}
  // Footfall scorch
  if(grounded&&(wf===0||wf===2)){
    const fxX=wf===0?(bx+w-13):(bx+13), fxY=h/2+2;
    ctx.save();ctx.globalAlpha=0.35;
    const hg=ctx.createRadialGradient(fxX,fxY,0,fxX,fxY,18);
    hg.addColorStop(0,'#ff6600');hg.addColorStop(1,'rgba(255,60,0,0)');
    ctx.fillStyle=hg;ctx.beginPath();ctx.ellipse(fxX,fxY,18,8,0,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  // Heavy SU: pressure aura builds around body
  if(inSU&&heavy){
    ctx.save();
    const aura=ctx.createRadialGradient(0,by2+h*0.5,6,0,by2+h*0.5,35*tSU+10);
    aura.addColorStop(0,`rgba(255,60,0,${0.45*tSU})`);aura.addColorStop(1,'rgba(255,0,0,0)');
    ctx.fillStyle=aura;ctx.beginPath();ctx.arc(0,by2+h*0.5,35*tSU+10,0,Math.PI*2);ctx.fill();
    if(tSU>0.65){ctx.strokeStyle='#ffaa00';ctx.lineWidth=2;ctx.globalAlpha=(tSU-0.65)*2.8*0.7;ctx.beginPath();ctx.arc(0,by2+h*0.5,40*tSU,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }

  // Legs (thick, stocky)
  rrFill(bx+5,by2+h*0.65,17,h*0.3+ll,5,ch.accent);
  rrFill(bx+w-22,by2+h*0.65,17,h*0.3-ll,5,ch.accent);
  ctx.fillStyle='#1a0000';
  ctx.beginPath();ctx.ellipse(bx+13,by2+h*0.95+ll/2,12,5,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(bx+w-13,by2+h*0.95-ll/2,12,5,0,0,Math.PI*2);ctx.fill();

  // Aerial thrust jets
  if(airJetGlow){
    ctx.save();ctx.globalAlpha=0.5+Math.sin(G.frame*0.2)*0.2;
    for(let ji=-1;ji<=1;ji+=2){
      const jg=ctx.createRadialGradient(ji*w*0.22,by2+h*0.96,0,ji*w*0.22,by2+h*0.96,16);
      jg.addColorStop(0,'#ffaa00');jg.addColorStop(1,'rgba(255,60,0,0)');
      ctx.fillStyle=jg;ctx.beginPath();ctx.arc(ji*w*0.22,by2+h*0.96,16,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }

  // Body — combine walk tilt + attack lean
  const totalLean = (grounded?trudgeLean:airRecoilTilt) + atkLean;
  ctx.save();ctx.rotate(totalLean);
  rrFill(bx+2,by2+h*0.34,w-4,h*0.42,10,ch.color);
  // Armor ridge lines
  ctx.strokeStyle=ch.accent;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(bx+9,by2+h*0.37);ctx.lineTo(bx+9,by2+h*0.72);ctx.stroke();
  ctx.beginPath();ctx.moveTo(bx+w-9,by2+h*0.37);ctx.lineTo(bx+w-9,by2+h*0.72);ctx.stroke();
  // Chest vent glow
  const ventActive=inAct&&!heavy&&(dir==='side'||dir==='neutral'||dir==='up');
  const ventSU=inSU&&heavy;
  const ventCol=ventActive?ch.eyeCol:ventSU?`rgba(255,${100+Math.floor(tSU*100)},0,1)`:(inAct?'#550800':'#330500');
  rrFill(bx+w*0.28,by2+h*0.46,w*0.44,h*0.09,4,ventCol);
  if(ventActive||ventSU){
    ctx.save();ctx.shadowBlur=ventSU?10*tSU:14;ctx.shadowColor=ch.eyeCol;ctx.globalAlpha=ventSU?0.3*tSU:0.45;
    rrPath(bx+w*0.28,by2+h*0.46,w*0.44,h*0.09,4);ctx.fillStyle=ch.eyeCol;ctx.fill();ctx.restore();
  }

  // Arms with flame nozzles
  const armY=by2+h*0.38;

  // Left arm — rises/spreads during up attacks, pulls back in heavy SU, droops in endlag
  ctx.save();ctx.translate(bx-4,armY);
  if(inSU&&heavy&&dir==='side'){ctx.translate(-10*tSU,3*tSU);ctx.rotate(-0.2*tSU);}
  else if(inSU&&heavy&&dir==='up'){ctx.translate(-6*tSU,-8*tSU);}
  else if(inAct&&!heavy&&dir==='up'){ctx.translate(-10,0);}
  else if(inAct&&heavy&&dir==='side'){ctx.translate(4,0);}
  else if(inEl&&heavy){ctx.translate(0,10*(1-tEl));ctx.rotate(0.15*(1-tEl));}
  rrFill(-18,0,18,h*0.3,6,ch.color);
  rrFill(-22,h*0.07,10,18,4,ch.accent);
  ctx.fillStyle='#1a0000';ctx.beginPath();ctx.arc(-17,h*0.19,5,0,Math.PI*2);ctx.fill();
  if(ventActive||inAct||ventSU){ctx.save();ctx.shadowBlur=ventSU?6*tSU:8;ctx.shadowColor=ch.eyeCol;ctx.fillStyle=ch.eyeCol;ctx.globalAlpha=ventSU?0.4*tSU:0.7;ctx.beginPath();ctx.arc(-17,h*0.19,3,0,Math.PI*2);ctx.fill();ctx.restore();}
  ctx.restore();

  // Right arm — wind-up in heavy SU (pulls far back for side heavy), slams forward on active, droops in endlag
  ctx.save();ctx.translate(bx+w+4,armY);
  if(inSU&&heavy&&dir==='side'){ctx.translate(-12*tSU,-6*tSU);ctx.rotate(-0.4*tSU);}
  else if(inSU&&heavy&&dir==='up'){ctx.translate(8*tSU,-10*tSU);}
  else if(inSU&&heavy&&dir==='down'){ctx.rotate(0.5*tSU);ctx.translate(0,10*tSU);}
  else if(inAct&&!heavy&&dir==='up'){ctx.translate(10,0);}
  else if(inAct&&heavy&&dir==='side'){ctx.translate(20,0);}
  else if(inAct&&heavy&&dir==='down'){ctx.rotate(0.7);ctx.translate(0,14);}
  else if(inEl&&heavy&&dir==='side'){ctx.translate(8*(1-tEl),12*(1-tEl));ctx.rotate(0.3*(1-tEl));}
  else if(inEl&&heavy){ctx.translate(0,14*(1-tEl));ctx.rotate(0.2*(1-tEl));}
  else if(inEl&&!heavy){ctx.translate(0,6*(1-tEl));}
  rrFill(0,0,18,h*0.3,6,ch.color);
  rrFill(12,h*0.07,10,18,4,ch.accent);
  ctx.fillStyle='#1a0000';ctx.beginPath();ctx.arc(17,h*0.19,5,0,Math.PI*2);ctx.fill();
  if(ventActive||inAct||ventSU){ctx.save();ctx.shadowBlur=ventSU?6*tSU:8;ctx.shadowColor=ch.eyeCol;ctx.fillStyle=ch.eyeCol;ctx.globalAlpha=ventSU?0.4*tSU:0.7;ctx.beginPath();ctx.arc(17,h*0.19,3,0,Math.PI*2);ctx.fill();ctx.restore();}
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
      ctx.shadowBlur=12*(1-t);ctx.shadowColor='#ff4400';
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
  // Down light: burst flash — fades quickly then embers
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
    const progress=inSU?tSU:1;
    const radius=75+progress*15;
    const numRays=10;
    for(let i=0;i<numRays;i++){
      const t=i/(numRays-1);
      const ang=-Math.PI+t*Math.PI;
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
  // Side heavy: pebble launch flash (charge glow grows at nozzle during SU)
  if(heavy&&inSU&&(dir==='side'||dir==='neutral')){
    ctx.save();ctx.globalAlpha=tSU*0.55;
    const mx=bx+w+14;
    ctx.shadowBlur=18;ctx.shadowColor=ch.eyeCol;ctx.fillStyle=ch.eyeCol;
    ctx.beginPath();ctx.arc(mx,armY+h*0.19,4+tSU*7,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  // Heavy endlag: steam wisps from both nozzles
  if(inEl&&heavy&&tEl<0.6){
    ctx.save();ctx.globalAlpha=(1-tEl)*0.4;
    for(let s=-1;s<=1;s+=2){
      const nozzX=s*(w*0.5+14);
      ctx.fillStyle='#886644';
      ctx.beginPath();ctx.arc(nozzX+Math.sin(G.frame*0.25+s)*3,armY+h*0.19-(1-tEl)*14,4*(1-tEl),0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }

  // Head (blocky, armored)
  rrFill(bx+4,by2+h*0.06,w-8,h*0.31,8,ch.color);
  rrFill(bx+8,by2+h*0.08,w-16,h*0.065,3,ch.accent);
  // Eyes — glow brighter during SU charge, blaze on active
  const eyeC=inAct?ch.eyeCol:inSU&&heavy?`rgba(255,${80+Math.floor(tSU*120)},0,1)`:'#550800';
  ctx.fillStyle=eyeC;
  if(inAct){ctx.shadowBlur=16;ctx.shadowColor=ch.eyeCol;}
  else if(inSU&&heavy&&tSU>0.4){ctx.shadowBlur=8*tSU;ctx.shadowColor='#ff6600';}
  ctx.beginPath();ctx.rect(bx+9,by2+h*0.145,11,7);ctx.fill();
  ctx.beginPath();ctx.rect(bx+w-20,by2+h*0.145,11,7);ctx.fill();
  ctx.shadowBlur=0;
  // Mouth grill
  ctx.strokeStyle=ch.accent;ctx.lineWidth=1.5;
  for(let i=0;i<5;i++){
    ctx.beginPath();ctx.moveTo(bx+10+i*7,by2+h*0.265);ctx.lineTo(bx+10+i*7,by2+h*0.325);ctx.stroke();
  }
  ctx.restore(); // end body lean
}



