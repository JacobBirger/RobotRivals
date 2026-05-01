import { ctx, W, H, bullets, miniSwords, rocketArms, rocketMines, smokeClouds, unstableHeads, knives, throwSwords, firePebbles, pristineRockets, factoryBolts, factoryGears, factoryZaps, particles, aabb, sameTeam } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, addDeathExplosion, instakill, rrFill, rrStroke, rrPath } from '../particles.js';
import { MAX_KB, DEATH_THRESHOLD, FLY_ACCEL, MAX_FLY_SPEED, FLY_FRIC, DASH_FRAMES, DASH_MULT } from '../player/constants.js';
import { kbScale, playSfx, playSfxNoise } from '../audio.js';

export const char = { id:14,name:'KING',tag:'The Royal Guard',
    desc:['Sword + rotating shield (half dmg/KB on shield side)','Down heavy: sword on fire 2s (bonus dmg + burn)','Up heavy: spinning sword whirlwind'],
    color:'#cc1133',accent:'#ffd700',eyeCol:'#ffee44',hi:'#ff5566',
    w:50,h:62,speed:5.5,jumpF:-12.9,djF:-11.4,weight:1.05,def:0.92,shieldCool:120,
    lDmg:7,hDmg:13,lKB:6,hKB:14,
    lSU:5,hSU:14,lAct:8,hAct:12,lEl:9,hEl:22,
    lSz:34,lRch:104,hSz:46,hRch:108,
    kingPokeReach:160,           // side-light poke (long, narrow)
    kingSideHeavySwingReach:84,  // side-heavy swing arc (slightly less than poke)
    kingSideHeavyPokeReach:124,  // side-heavy poke (extends past swing)
    kingSpinReach:96,            // up-heavy spin radius
    kingFireDuration:120,        // 2s sword fire (60fps)
    kingBurnDuration:90 };

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
  const fire=(extra&&extra.kingFireTimer>0);
  const facing=(extra&&extra.kingFacing)||1; // world-G.frame facing: +1 right, -1 left
  const shieldAngleWorld=(extra&&typeof extra.kingShieldAngle==='number')?extra.kingShieldAngle:0;

  // Up heavy: whole-body spin around center (the sword is the hitbox)
  if(heavy&&dir==='up'&&inAct){
    const spinT=(atk.frame-atk.su)/atk.act; // 0..1
    const spinAng=spinT*Math.PI*4; // 2 full rotations
    ctx.save();
    ctx.rotate(spinAng);
    // Motion-blur ghost rings
    ctx.globalAlpha=0.35;
    for(let g=1;g<=3;g++){
      ctx.save();ctx.rotate(-spinAng*0.12*g);
      drawKingBody(ctx,ch,w,h,grounded,wf,fire);
      ctx.restore();
    }
    ctx.globalAlpha=1;
    drawKingBody(ctx,ch,w,h,grounded,wf,fire);
    // Sword extended outward (fixed in body G.frame, but body is spinning)
    const swordLen=ch.kingSpinReach||96;
    drawKingSword(ctx,ch,w,h, w/2-2, 0, 0, swordLen, fire, true);
    // Sword trail circle
    ctx.strokeStyle=fire?'rgba(255,160,40,0.55)':'rgba(255,220,120,0.45)';
    ctx.lineWidth=4;ctx.shadowBlur=12;ctx.shadowColor=fire?'#ff7700':'#ffe680';
    ctx.beginPath();ctx.arc(0,0,swordLen-8,0,Math.PI*2);ctx.stroke();
    ctx.shadowBlur=0;
    ctx.restore();
    // Wind-up sparkles around body (drawn in non-rotated G.frame)
    return;
  }

  // Body-wide fire aura while sword is on fire — clear visual signal that fire mode is active
  if(fire){
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    const auraPulse=Math.sin(G.frame*0.12)*0.18+0.82;
    const aura=ctx.createRadialGradient(0,0,w*0.2,0,0,w*1.1);
    aura.addColorStop(0,`rgba(255,180,60,${0.42*auraPulse})`);
    aura.addColorStop(0.5,`rgba(255,90,20,${0.22*auraPulse})`);
    aura.addColorStop(1,'rgba(255,40,0,0)');
    ctx.fillStyle=aura;
    ctx.beginPath();ctx.ellipse(0,0,w*1.1,h*0.9,0,0,Math.PI*2);ctx.fill();
    ctx.restore();
    // Floating ember particles around the King
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    for(let p=0;p<8;p++){
      const t=((G.frame*0.025+p*0.13)%1);
      const ang=p*0.785+G.frame*0.02;
      const r=w*0.5+Math.sin(G.frame*0.05+p)*6;
      const px=Math.cos(ang)*r;
      const py=Math.sin(ang)*r-t*30;
      const pa=(1-t)*0.85;
      ctx.fillStyle=`rgba(255,${160+p*8},${30+p*5},${pa})`;
      ctx.beginPath();ctx.arc(px,py,1.5+Math.random()*1,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }

  // Cape (drawn behind body) — flowing, in body G.frame; gently sways
  drawKingCape(ctx,w,h,grounded,wf,atk);

  // Body
  drawKingBody(ctx,ch,w,h,grounded,wf,fire);

  // Side-light poke: drawn in body-local G.frame (which Player.draw() has already mirrored
  // when facing left), so sword always points "forward" relative to the character.
  if(atk&&!heavy&&(dir==='side'||dir==='neutral')&&(inAct||inSU)){
    let ext=0;
    if(inSU){
      ext=0;
    } else {
      const t=tAct;
      if(t<0.3) ext=t/0.3;
      else if(t<0.7) ext=1;
      else ext=Math.max(0,1-(t-0.7)/0.3);
    }
    const gripX = w*0.3 + ext*40;       // grip in body-local +X (= visually "forward")
    const gripY = -h*0.06;
    const visibleLen = 96 + ext*60;     // matches kingPokeReach=160 hitbox
    // ang = -π/2: 90° CCW rotation, blade extends along body-local +X (= forward)
    drawKingSword(ctx,ch,w,h, gripX, gripY, -Math.PI/2, visibleLen, fire, false);
  }

  // Sword (right hand) — animation depends on attack (used for non-side-light attacks)
  let sx=w/2-4, sy=-h*0.05; // sword grip pivot in body-local coords
  let swordAng=0, swordExt=0; // rotation + forward push
  let skipSword=atk&&!heavy&&(dir==='side'||dir==='neutral')&&(inAct||inSU);
  if(inAct){
    if(!heavy&&(dir==='side'||dir==='neutral')){
      // Handled above in world G.frame
    } else if(!heavy&&dir==='up'){
      // Pendulum swing above head: sweeps from one side to the other overhead
      const a0=-Math.PI*0.8, a1=-Math.PI*0.2;
      swordAng=a0+(a1-a0)*tAct;
      sx=4; sy=-h*0.35;
    } else if(!heavy&&dir==='down'){
      // Shield rotation animation: sword stays at rest, mild flourish
      swordAng=Math.PI/2-0.1;
      swordExt=0;
    } else if(heavy&&(dir==='side'||dir==='neutral')){
      const half=0.5;
      if(tAct<half){
        // Swing phase: overhead arc to forward
        const t=tAct/half;
        swordAng=-Math.PI*0.55+t*Math.PI*0.95;
      } else {
        // Poke phase
        const t=(tAct-half)/half;
        const pokeT=t<0.5?t*2:(1-t)*2;
        swordAng=Math.PI/2;
        swordExt=pokeT*52;
      }
    } else if(heavy&&dir==='down'){
      // Light sword on fire: sword raised dramatically, fire bursts
      swordAng=-Math.PI/2-0.1;
      sx=2; sy=-h*0.4;
    }
  } else if(inSU){
    // Subtle wind-up pose
    if(heavy&&(dir==='side'||dir==='neutral')) swordAng=-Math.PI*0.7;
    else if(!heavy&&(dir==='side'||dir==='neutral')) swordAng=Math.PI*0.45;
    else if(!heavy&&dir==='up') swordAng=-Math.PI*0.85;
    else swordAng=Math.PI*0.35;
  } else {
    swordAng=Math.PI*0.35; // resting position (sword down at side)
  }
  if(!skipSword) drawKingSword(ctx,ch,w,h, sx, sy, swordAng, 64+swordExt, fire, false);

  // Shield — drawn AFTER body so it's in front. Position is in WORLD G.frame, not facing-flipped.
  // Counter the facing-flip from Player.draw() so shield orbits in absolute world coords.
  ctx.save();
  ctx.scale(facing,1); // undo facing flip
  // Shield orbits at radius ~w*0.65 around player center
  const shR=w*0.7;
  const shx=Math.cos(shieldAngleWorld)*shR;
  const shy=Math.sin(shieldAngleWorld)*shR;
  ctx.translate(shx,shy);
  ctx.rotate(shieldAngleWorld+Math.PI/2);
  drawKingShield(ctx,ch);
  ctx.restore();

  // Crown is drawn as part of head in drawKingBody
}

export function drawKingBody(ctx,ch,w,h,grounded,wf,fire){
  const bx=-w/2,by=-h/2;
  const bob=grounded?Math.sin(wf*Math.PI/2)*1.6:0,by2=by+bob;
  const ll=grounded?(wf<2?4:-4):0;
  if(grounded){ctx.fillStyle='rgba(0,0,0,0.25)';ctx.beginPath();ctx.ellipse(0,h/2+3,w*0.46,5,0,0,Math.PI*2);ctx.fill();}
  // Legs (armored)
  rrFill(bx+7,by2+h*0.62,15,h*0.33+ll,4,ch.accent);
  rrFill(bx+w-22,by2+h*0.62,15,h*0.33-ll,4,ch.accent);
  // Knee plates
  ctx.fillStyle='#bb9900';
  ctx.fillRect(bx+8,by2+h*0.78,13,4); ctx.fillRect(bx+w-21,by2+h*0.78,13,4);
  // Feet
  ctx.fillStyle='#1a1a1a';
  ctx.beginPath();ctx.ellipse(bx+14,by2+h*0.95+ll/2,10,5,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(bx+w-14,by2+h*0.95-ll/2,10,5,0,0,Math.PI*2);ctx.fill();
  // Body (royal red armor with gold trim)
  rrFill(bx+4,by2+h*0.34,w-8,h*0.38,8,ch.color);
  // Gold trim down chest
  ctx.fillStyle='#ffd700';
  ctx.fillRect(-2,by2+h*0.36,4,h*0.34);
  // Gold belt
  ctx.fillStyle='#ffcc00';ctx.fillRect(bx+5,by2+h*0.66,w-10,5);
  ctx.fillStyle='#aa7700';ctx.fillRect(bx+5,by2+h*0.70,w-10,2);
  // Royal emblem on chest
  ctx.fillStyle='#ffd700';ctx.beginPath();
  ctx.arc(0,by2+h*0.50,5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#cc1133';ctx.fillRect(-1,by2+h*0.46,2,8);
  // Arm pauldrons (shoulder guards)
  ctx.fillStyle=ch.accent;
  ctx.beginPath();ctx.ellipse(bx+6,by2+h*0.36,8,7,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(bx+w-6,by2+h*0.36,8,7,0,0,Math.PI*2);ctx.fill();
  // Arms
  rrFill(bx+1,by2+h*0.40,9,h*0.24,3,ch.color); // left arm
  rrFill(bx+w-10,by2+h*0.40,9,h*0.24,3,ch.color); // right arm (will hold sword)
  // Hands
  ctx.fillStyle='#1a1a1a';
  ctx.beginPath();ctx.arc(bx+5,by2+h*0.65,5,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(bx+w-5,by2+h*0.65,5,0,Math.PI*2);ctx.fill();
  // Head (helm) — silver/gold robotic with face plate
  ctx.fillStyle='#d8d8d8';
  ctx.beginPath();ctx.ellipse(0,by2+h*0.16,w*0.36,h*0.20,0,0,Math.PI*2);ctx.fill();
  // Face plate dark
  ctx.fillStyle='#222';
  rrFill(-w*0.28,by2+h*0.13,w*0.56,h*0.10,3,'#222');
  // Eyes
  ctx.fillStyle=ch.eyeCol;ctx.shadowBlur=fire?12:6;ctx.shadowColor=fire?'#ff8800':ch.eyeCol;
  ctx.beginPath();ctx.arc(-7,by2+h*0.18,3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(7,by2+h*0.18,3,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
  // Nose ridge
  ctx.fillStyle='#aaaaaa';ctx.fillRect(-1,by2+h*0.18,2,5);
  // CROWN (gold, on top of head)
  const crownY=by2+h*0.04;
  // Crown band
  ctx.fillStyle='#ffd700';
  rrFill(-w*0.3,crownY-4,w*0.6,8,2,'#ffd700');
  // Crown points
  ctx.beginPath();
  for(let p=0;p<5;p++){
    const px=-w*0.3+p*(w*0.6/4);
    ctx.moveTo(px,crownY-4);
    ctx.lineTo(px+w*0.06,crownY-14);
    ctx.lineTo(px+w*0.12,crownY-4);
  }
  ctx.fill();
  // Crown jewels (red gems)
  ctx.fillStyle='#ff2244';ctx.shadowBlur=6;ctx.shadowColor='#ff2244';
  for(let p=0;p<4;p++){
    const px=-w*0.27+p*(w*0.18);
    ctx.beginPath();ctx.arc(px+w*0.03,crownY-1,2,0,Math.PI*2);ctx.fill();
  }
  // Center jewel (bigger)
  ctx.fillStyle='#ffd700';ctx.beginPath();ctx.arc(0,crownY-1,3,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
  // Crown highlight
  ctx.fillStyle='#fff7aa';ctx.fillRect(-w*0.28,crownY-3,w*0.56,1.5);
}

export function drawKingCape(ctx,w,h,grounded,wf,atk){
  // Red cape flowing behind player; sways with G.frame
  const sway=Math.sin(G.frame*0.06)*4+(grounded?Math.sin(wf*Math.PI/2)*2:0);
  const ext=atk?6:0;
  ctx.save();
  // Cape attaches at shoulders, flows down behind body
  ctx.fillStyle='#8a0a1c';
  ctx.beginPath();
  ctx.moveTo(-w*0.32,-h*0.14);
  ctx.lineTo(w*0.32,-h*0.14);
  ctx.lineTo(w*0.42+sway,h*0.45+ext);
  ctx.lineTo(0,h*0.62+ext);
  ctx.lineTo(-w*0.42+sway,h*0.45+ext);
  ctx.closePath();
  ctx.fill();
  // Cape highlight (lighter red on the side that catches light)
  ctx.fillStyle='#cc1f33';
  ctx.beginPath();
  ctx.moveTo(-w*0.30,-h*0.10);
  ctx.lineTo(-w*0.05,-h*0.10);
  ctx.lineTo(-w*0.10+sway,h*0.50+ext);
  ctx.lineTo(-w*0.40+sway,h*0.42+ext);
  ctx.closePath();
  ctx.fill();
  // Gold trim along cape edge
  ctx.strokeStyle='#ffd700';ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.moveTo(-w*0.32,-h*0.14);
  ctx.lineTo(-w*0.42+sway,h*0.45+ext);
  ctx.lineTo(0,h*0.62+ext);
  ctx.lineTo(w*0.42+sway,h*0.45+ext);
  ctx.lineTo(w*0.32,-h*0.14);
  ctx.stroke();
  // Royal emblem (small gold diamond) at the cape collar
  ctx.fillStyle='#ffd700';
  ctx.beginPath();ctx.moveTo(0,-h*0.18);ctx.lineTo(4,-h*0.14);ctx.lineTo(0,-h*0.10);ctx.lineTo(-4,-h*0.14);ctx.closePath();ctx.fill();
  ctx.restore();
}

export function drawKingSword(ctx,ch,w,h, gripX,gripY,ang,len,fire,fromCenter){
  // Draws a long sword from grip pivot at angle. Sword extends in +Y direction in local G.frame
  // (so ang=0 = sword pointing down; ang=Math.PI/2 = sword pointing right; ang=-Math.PI/2 = up).
  ctx.save();
  ctx.translate(gripX,gripY);
  ctx.rotate(ang);
  // Hilt grip
  ctx.fillStyle='#553311';
  rrFill(-3,-2,6,12,2,'#553311');
  // Crossguard (gold)
  ctx.fillStyle='#ffd700';
  ctx.fillRect(-12,-4,24,5);
  ctx.fillStyle='#aa7700';
  ctx.fillRect(-12,1,24,1);
  // Pommel (gold ball at base)
  ctx.fillStyle='#ffd700';ctx.beginPath();ctx.arc(0,-6,4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff5aa';ctx.beginPath();ctx.arc(-1,-7,1.5,0,Math.PI*2);ctx.fill();
  // Blade (long, tapering)
  const bladeStart=6, bladeEnd=bladeStart+len;
  // ======= FIRE LAYER 1: huge soft outer aura =======
  if(fire){
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    // Big soft halo around the entire blade
    const haloPulse=Math.sin(G.frame*0.18)*0.15+0.85;
    const halo=ctx.createRadialGradient(0,(bladeStart+bladeEnd)/2,4,0,(bladeStart+bladeEnd)/2,len*0.95);
    halo.addColorStop(0,`rgba(255,200,80,${0.45*haloPulse})`);
    halo.addColorStop(0.45,`rgba(255,90,20,${0.30*haloPulse})`);
    halo.addColorStop(1,'rgba(255,40,0,0)');
    ctx.fillStyle=halo;
    ctx.fillRect(-len*0.7, bladeStart-12, len*1.4, len+30);
    // Wide fire envelope hugging the blade shape
    const env=ctx.createLinearGradient(0,bladeStart,0,bladeEnd+18);
    env.addColorStop(0,`rgba(255,220,120,${0.85*haloPulse})`);
    env.addColorStop(0.4,`rgba(255,140,30,${0.7*haloPulse})`);
    env.addColorStop(0.85,`rgba(255,60,0,${0.4*haloPulse})`);
    env.addColorStop(1,'rgba(255,30,0,0)');
    ctx.fillStyle=env;
    ctx.beginPath();
    const env_w=14;
    ctx.moveTo(-env_w,bladeStart-4);
    ctx.bezierCurveTo(-env_w*1.4,bladeStart+len*0.3, -env_w*0.6,bladeStart+len*0.7, -env_w*0.3,bladeEnd+12);
    ctx.lineTo(0,bladeEnd+22);
    ctx.bezierCurveTo(env_w*0.3,bladeEnd+12, env_w*1.4,bladeStart+len*0.7, env_w,bladeStart-4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // Blade body (steel) — when on fire, the steel itself glows white-hot to red-hot along its length
  if(fire){
    // Heated blade gradient: white-hot near tip, orange in middle, dim red near hilt
    const hot=ctx.createLinearGradient(0,bladeStart,0,bladeEnd);
    hot.addColorStop(0,'#ffaa44');
    hot.addColorStop(0.4,'#ff7722');
    hot.addColorStop(0.75,'#ffcc66');
    hot.addColorStop(1,'#ffffff');
    ctx.fillStyle=hot;
    ctx.shadowBlur=14;ctx.shadowColor='#ff7700';
  } else {
    ctx.fillStyle='#dddddd';
  }
  ctx.beginPath();
  ctx.moveTo(-4,bladeStart);
  ctx.lineTo(4,bladeStart);
  ctx.lineTo(2,bladeEnd-6);
  ctx.lineTo(0,bladeEnd);
  ctx.lineTo(-2,bladeEnd-6);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur=0;
  // Blade highlight (white hot streak)
  ctx.fillStyle=fire?'#ffffff':'#ffffff';
  ctx.fillRect(-1,bladeStart+2,1.5,len-12);
  // Fuller (groove)
  ctx.fillStyle=fire?'#ffdd66':'#888';
  ctx.fillRect(-0.5,bladeStart+4,1,len-14);

  // ======= FIRE LAYER 2: animated flame tongues licking off the blade =======
  if(fire){
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    // Big flame tongues at multiple points along the blade
    const numTongues=10;
    for(let f=0;f<numTongues;f++){
      const baseT=f/numTongues;
      const drift=((G.frame*0.05+f*0.13)%1);
      const ft=(baseT+drift)%1;
      const along=bladeStart+ft*(len+8);
      const sway=Math.sin(G.frame*0.22+f*1.7)*7;
      // Flame tongue: teardrop pointing away from blade
      const flR=5+Math.sin(G.frame*0.18+f)*2;
      const fAlpha=(1-ft)*0.85+0.15;
      // Outer (red)
      ctx.fillStyle=`rgba(255,${60+ft*100},0,${fAlpha*0.7})`;
      ctx.beginPath();ctx.ellipse(sway,along,flR*1.6,flR*2.2,0,0,Math.PI*2);ctx.fill();
      // Mid (orange)
      ctx.fillStyle=`rgba(255,${160+ft*80},${30+ft*30},${fAlpha*0.85})`;
      ctx.beginPath();ctx.ellipse(sway,along-flR*0.3,flR,flR*1.4,0,0,Math.PI*2);ctx.fill();
      // Inner (yellow-white core)
      ctx.fillStyle=`rgba(255,${220+ft*30},${140+ft*60},${fAlpha})`;
      ctx.beginPath();ctx.ellipse(sway,along-flR*0.5,flR*0.5,flR*0.8,0,0,Math.PI*2);ctx.fill();
    }
    // Tip — huge fireball
    const tipPulse=Math.sin(G.frame*0.3)*2+8;
    const tipG=ctx.createRadialGradient(0,bladeEnd+3,1,0,bladeEnd+3,tipPulse*1.6);
    tipG.addColorStop(0,'rgba(255,255,240,1)');
    tipG.addColorStop(0.35,'rgba(255,200,100,0.95)');
    tipG.addColorStop(0.7,'rgba(255,90,20,0.55)');
    tipG.addColorStop(1,'rgba(255,40,0,0)');
    ctx.fillStyle=tipG;
    ctx.beginPath();ctx.arc(0,bladeEnd+3,tipPulse*1.6,0,Math.PI*2);ctx.fill();
    // Embers/sparks streaming off the blade
    for(let s=0;s<8;s++){
      const st=((G.frame*0.06+s*0.21)%1);
      const sAlong=bladeStart+st*len;
      const sxOff=Math.sin(G.frame*0.14+s*2.3)*12;
      const syOff=-st*18; // drift upward (away from blade)
      ctx.fillStyle=`rgba(255,${180+s*8},${60+s*10},${(1-st)*0.9})`;
      ctx.beginPath();ctx.arc(sxOff,sAlong+syOff,1.2+Math.random()*0.8,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
    // Heat shimmer streaks
    ctx.save();
    ctx.strokeStyle='rgba(255,180,80,0.35)';ctx.lineWidth=1.2;
    for(let s=0;s<3;s++){
      const sy=bladeStart+(s*len/3)+Math.sin(G.frame*0.12+s)*4;
      ctx.beginPath();
      ctx.moveTo(-10,sy);
      ctx.bezierCurveTo(-2,sy-3,2,sy+3,10,sy);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}

export function drawKingShield(ctx,ch){
  // Kite-shaped royal shield with gold trim and red cross
  // Drawn so its "outer face" points along +Y (so caller positions origin and rotates)
  ctx.save();
  // Shadow behind shield
  ctx.fillStyle='rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.moveTo(-14,-12);ctx.lineTo(14,-12);
  ctx.lineTo(13,8);ctx.lineTo(0,18);ctx.lineTo(-13,8);
  ctx.closePath();ctx.fill();
  // Outer shield body (steel-blue with gold trim)
  ctx.fillStyle='#4a5d80';
  ctx.beginPath();
  ctx.moveTo(-13,-13);ctx.lineTo(13,-13);
  ctx.lineTo(12,7);ctx.lineTo(0,17);ctx.lineTo(-12,7);
  ctx.closePath();ctx.fill();
  // Inner highlight
  ctx.fillStyle='#7a90b8';
  ctx.beginPath();
  ctx.moveTo(-10,-10);ctx.lineTo(0,-9);ctx.lineTo(-3,5);ctx.lineTo(-10,3);
  ctx.closePath();ctx.fill();
  // Red cross (royal heraldry)
  ctx.fillStyle='#cc1133';
  ctx.fillRect(-2,-12,4,26);
  ctx.fillRect(-9,-3,18,4);
  // Gold trim outline
  ctx.strokeStyle='#ffd700';ctx.lineWidth=2;
  ctx.beginPath();
  ctx.moveTo(-13,-13);ctx.lineTo(13,-13);
  ctx.lineTo(12,7);ctx.lineTo(0,17);ctx.lineTo(-12,7);
  ctx.closePath();ctx.stroke();
  // Gold studs at corners
  ctx.fillStyle='#ffd700';
  [[-11,-11],[11,-11],[10,5],[-10,5]].forEach(([px,py])=>{ctx.beginPath();ctx.arc(px,py,1.5,0,Math.PI*2);ctx.fill();});
  ctx.restore();
}



