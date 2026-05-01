import { ctx, W, H } from '../globals.js';
import { G } from '../globals.js';
import { rrFill, rrStroke, rrPath } from '../particles.js';
import { draw as drawBolt } from '../characters/bolt.js';
import { draw as drawCrusher } from '../characters/crusher.js';
import { draw as drawZippy } from '../characters/zippy.js';
import { draw as drawBlaster } from '../characters/blaster.js';
import { draw as drawEdge } from '../characters/edge.js';
import { draw as drawPierce } from '../characters/pierce.js';
import { draw as drawRocket } from '../characters/rocket.js';
import { draw as drawUnstable } from '../characters/unstable.js';
import { draw as drawBlade } from '../characters/blade.js';
import { draw as drawDummy } from '../characters/dummy.js';
import { draw as drawPristine } from '../characters/pristine.js';
import { draw as drawMagma } from '../characters/magma.js';
import { draw as drawFactory } from '../characters/factory.js';
import { draw as drawGlitch } from '../characters/glitch.js';
import { draw as drawKing, drawKingBody, drawKingCape, drawKingSword, drawKingShield } from '../characters/king.js';

function drawCharacter(ctx,ch,w,h,atk,grounded,wf,extra){
  if(ch.id===0)drawBolt(ctx,ch,w,h,atk,grounded,wf);
  else if(ch.id===1)drawCrusher(ctx,ch,w,h,atk,grounded,wf);
  else if(ch.id===2)drawZippy(ctx,ch,w,h,atk,grounded,wf);
  else if(ch.id===3)drawBlaster(ctx,ch,w,h,atk,grounded,wf);
  else if(ch.id===4)drawEdge(ctx,ch,w,h,atk,grounded,wf);
  else if(ch.id===5)drawPierce(ctx,ch,w,h,atk,grounded,wf);
  else if(ch.id===6)drawRocket(ctx,ch,w,h,atk,grounded,wf,extra||{});
  else if(ch.id===7)drawUnstable(ctx,ch,w,h,atk,grounded,wf);
  else if(ch.id===8)drawBlade(ctx,ch,w,h,atk,grounded,wf);
  else if(ch.id===10)drawPristine(ctx,ch,w,h,atk,grounded,wf);
  else if(ch.id===11)drawMagma(ctx,ch,w,h,atk,grounded,wf);
  else if(ch.id===12)drawFactory(ctx,ch,w,h,atk,grounded,wf);
  else if(ch.id===13)drawGlitch(ctx,ch,w,h,atk,grounded,wf,extra||{});
  else if(ch.id===14)drawKing(ctx,ch,w,h,atk,grounded,wf,extra||{});
  else drawDummy(ctx,ch,w,h);
}

// ---- Attack Arc Effects ----
function drawAttackArc(atk,ch,w,h) {
  if (!atk) return;
  if (ch.id===6) return; // ROCKET uses arm projectile visuals
  if (ch.id===7) return; // UNSTABLE visuals drawn in drawUnstable
  if (ch.id===8) return; // BLADE visuals drawn in drawBlade
  if (ch.id===11) return; // MAGMA visuals drawn in drawMagma
  if (ch.id===12) return; // FACTORY visuals drawn in drawFactory
  if (ch.id===13) return; // GLITCH visuals drawn in drawGlitch
  if (ch.id===14) return; // KING visuals drawn in drawKing
  const heavy=atk.type==='heavy';
  const inSU=atk.frame<atk.su;
  const inAct=atk.frame>=atk.su&&atk.frame<atk.su+atk.act;
  if (!inSU&&!inAct) return;
  const tSU=atk.frame/Math.max(atk.su,1);
  if (ch.id===10) { // PRISTINE: muzzle flash during startup
    if(inSU){
      const mx=w*0.5+14, my=h*0.36-h*0.5;
      ctx.fillStyle=ch.eyeCol; ctx.globalAlpha=tSU*0.8;
      ctx.shadowBlur=18; ctx.shadowColor=ch.eyeCol;
      ctx.beginPath(); ctx.arc(mx,my,5+tSU*5,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0; ctx.globalAlpha=1;
    }
    return;
  }
  const tAct=(atk.frame-atk.su)/Math.max(atk.act,1);
  const color=heavy?'#ff8800':ch.color, color2='#ffffff';
  ctx.save();

  if (ch.id===3) { // BLASTER: muzzle flash + beam
    if (inAct) {
      const fade=1-tAct*0.6;
      const mx=w*0.5+22, my=h*0.36-h*0.5;
      ctx.globalAlpha=fade; ctx.strokeStyle=ch.eyeCol;
      ctx.shadowBlur=20; ctx.shadowColor=ch.eyeCol; ctx.lineCap='round';
      if(heavy&&atk.dir!=='up'&&atk.dir!=='down'){
        // 3-shot rapid fire: 3 staggered beams
        ctx.lineWidth=5;
        for(let s=0;s<3;s++){
          const yOff=(s-1)*6;
          ctx.globalAlpha=fade*Math.max(0,1-tAct*2+s*0.4)*0.9;
          ctx.beginPath(); ctx.moveTo(mx,my+yOff); ctx.lineTo(mx+220,my+yOff); ctx.stroke();
        }
        ctx.fillStyle=ch.eyeCol; ctx.globalAlpha=fade*(1-tAct)*0.9;
        ctx.shadowBlur=22; ctx.beginPath(); ctx.arc(mx,my,11,0,Math.PI*2); ctx.fill();
      } else if(heavy&&atk.dir==='up'){
        // Triangle spread: 3 diverging beams
        const bl=180;
        ctx.lineWidth=5; ctx.globalAlpha=fade*0.85;
        ctx.beginPath(); ctx.moveTo(mx,my); ctx.lineTo(mx-bl*0.3,my-bl); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(mx,my); ctx.lineTo(mx,my-bl); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(mx,my); ctx.lineTo(mx+bl*0.3,my-bl); ctx.stroke();
        ctx.fillStyle=ch.eyeCol; ctx.globalAlpha=fade*(1-tAct)*0.8;
        ctx.shadowBlur=22; ctx.beginPath(); ctx.arc(mx,my,10,0,Math.PI*2); ctx.fill();
      } else if(heavy&&atk.dir==='down'){
        // Rocket jump exhaust burst below
        ctx.lineWidth=7; ctx.globalAlpha=fade*0.8;
        ctx.beginPath(); ctx.moveTo(0,h*0.15); ctx.lineTo(0,h*0.15+90); ctx.stroke();
        ctx.fillStyle=ch.eyeCol; ctx.globalAlpha=fade*0.5;
        ctx.shadowBlur=28; ctx.beginPath(); ctx.arc(0,h*0.25,20,0,Math.PI*2); ctx.fill();
      } else {
        // Light beam
        const beamLen=140;
        ctx.lineWidth=4;
        let bx2=mx,by2=my,ex=mx,ey=my;
        if(atk.dir==='up'){by2=my-4;ey=my-beamLen*0.85;ctx.beginPath();ctx.moveTo(bx2,by2);ctx.lineTo(ex,ey);ctx.stroke();}
        else if(atk.dir==='down'){by2=my+4;ey=my+beamLen*0.75;ctx.beginPath();ctx.moveTo(bx2,by2);ctx.lineTo(ex,ey);ctx.stroke();}
        else{ex=mx+beamLen;ey=my;ctx.beginPath();ctx.moveTo(bx2,by2);ctx.lineTo(ex,ey);ctx.stroke();}
        ctx.fillStyle=ch.eyeCol; ctx.globalAlpha=fade*(1-tAct)*0.9;
        ctx.shadowBlur=18; ctx.beginPath(); ctx.arc(mx,my,8,0,Math.PI*2); ctx.fill();
      }
    }
    if (heavy&&inSU) {
      const maxR=w*0.9, r=maxR*tSU;
      // pulsing outer ring
      const pulse=Math.sin(tSU*Math.PI*8)*0.15+0.85;
      ctx.strokeStyle=ch.eyeCol; ctx.lineWidth=1+tSU*4; ctx.globalAlpha=tSU*0.55*pulse;
      ctx.beginPath(); ctx.arc(w*0.3,0,r*1.35,0,Math.PI*2); ctx.stroke();
      ctx.lineWidth=1; ctx.globalAlpha=tSU*0.3*pulse;
      ctx.beginPath(); ctx.arc(w*0.3,0,r*1.65,0,Math.PI*2); ctx.stroke();
      // inner glow ball
      const g=ctx.createRadialGradient(w*0.3,0,0,w*0.3,0,r+2);
      g.addColorStop(0,'#ffffff'); g.addColorStop(0.25,ch.eyeCol+'ff'); g.addColorStop(1,ch.eyeCol+'00');
      ctx.fillStyle=g; ctx.globalAlpha=tSU*0.95;
      ctx.beginPath(); ctx.arc(w*0.3,0,r,0,Math.PI*2); ctx.fill();
      // orbiting sparks
      if(tSU>0.15){
        ctx.fillStyle=ch.eyeCol; ctx.globalAlpha=tSU;
        for(let i=0;i<4;i++){
          const a=G.frame*0.18+i*Math.PI*0.5, orb=r*0.55+8;
          ctx.beginPath(); ctx.arc(Math.cos(a)*orb+w*0.3,Math.sin(a)*orb,1.5+tSU*2.5,0,Math.PI*2); ctx.fill();
        }
      }
    }
  } else if (ch.id===4) { // EDGE: sword slash arcs
    if(inSU&&heavy&&atk.dir==='side'){
      // Charge-up glow: sword energising before the swing
      const prog=atk.frame/Math.max(atk.su,1);
      ctx.save();
      ctx.shadowBlur=8+prog*24; ctx.shadowColor=ch.color;
      ctx.strokeStyle=ch.color; ctx.lineWidth=3+prog*6; ctx.lineCap='round';
      ctx.globalAlpha=0.3+prog*0.6;
      // Sword blade growing in reach direction
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(80*prog,0); ctx.stroke();
      // Expanding energy ring
      ctx.strokeStyle=ch.eyeCol; ctx.lineWidth=2; ctx.globalAlpha=prog*0.5;
      ctx.beginPath(); ctx.arc(0,0,40*prog,0,Math.PI*2); ctx.stroke();
      ctx.shadowBlur=0; ctx.restore();
    }
    if (inAct) {
      const fade=1-tAct*0.45;
      ctx.globalAlpha=fade; ctx.lineCap='round'; ctx.shadowColor=ch.color;
      if(heavy){
        ctx.shadowBlur=28; ctx.strokeStyle=ch.color;
        if(atk.dir==='side'){
          // Overhead swing: dynamic arc sweeping top to bottom
          const reach=80, ang=-Math.PI*0.75+tAct*Math.PI*1.5;
          ctx.lineWidth=10;
          ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(ang)*reach,Math.sin(ang)*reach); ctx.stroke();
          ctx.lineWidth=5; ctx.globalAlpha=fade*0.4;
          ctx.beginPath(); ctx.arc(reach*0.28,0,reach*0.88,-Math.PI*0.8,Math.PI*0.8); ctx.stroke();
        } else if(atk.dir==='down'){
          // Dive: energy trail below
          ctx.lineWidth=8;
          ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,h); ctx.stroke();
          ctx.strokeStyle=ch.eyeCol; ctx.lineWidth=5; ctx.globalAlpha=fade*0.55;
          ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,h*0.7); ctx.stroke();
        } else if(atk.dir==='up'){
          // Up throw: release glow
          ctx.strokeStyle=ch.eyeCol; ctx.lineWidth=3; ctx.globalAlpha=fade*0.45;
          ctx.beginPath(); ctx.arc(0,-h*0.45,28,0,Math.PI*2); ctx.stroke();
        }
      } else {
        // Light combos (unchanged)
        const cn=atk.comboN||1;
        const reach=cn===3?53:cn===2?88:72;
        ctx.shadowBlur=cn===3?28:18;
        ctx.strokeStyle=ch.color; ctx.lineWidth=cn===3?10:cn===2?7:5;
        if (atk.dir==='up') {
          ctx.beginPath(); ctx.arc(0,-h*0.1,reach*0.72,-Math.PI*0.85+cn*0.1,-Math.PI*0.15-cn*0.1); ctx.stroke();
          if (cn===3) { ctx.lineWidth=5; ctx.globalAlpha=fade*0.5; ctx.beginPath(); ctx.arc(0,-h*0.05,reach*1.0,-Math.PI*0.9,-0.1); ctx.stroke(); }
        } else if (atk.dir==='down') {
          ctx.beginPath(); ctx.arc(0,h*0.1,reach*0.72,Math.PI*0.15+cn*0.05,Math.PI*0.85-cn*0.05); ctx.stroke();
          if (cn===3) { ctx.lineWidth=5; ctx.globalAlpha=fade*0.5; ctx.beginPath(); ctx.arc(0,h*0.05,reach*1.0,0.1,Math.PI-0.1); ctx.stroke(); }
        } else {
          const startA=cn===2?0.5:-0.7, endA=cn===2?-0.5:0.7;
          ctx.beginPath(); ctx.arc(reach*0.35,0,reach*0.72,startA,endA); ctx.stroke();
          if (cn===3) {
            ctx.lineWidth=6; ctx.globalAlpha=fade*0.5;
            ctx.beginPath(); ctx.arc(reach*0.25,0,reach*1.0,-1.0,1.0); ctx.stroke();
            ctx.lineWidth=3; ctx.globalAlpha=fade*0.7;
            for (let i=0;i<6;i++) { const a=(i/6)*Math.PI*2; ctx.strokeStyle=ch.hi; ctx.beginPath(); ctx.moveTo(Math.cos(a)*20,Math.sin(a)*20); ctx.lineTo(Math.cos(a)*reach*0.9,Math.sin(a)*reach*0.9); ctx.stroke(); }
          }
        }
      }
    }
  } else if (ch.id===5) { // PIERCE: spear thrust trail
    if (inAct) {
      const fade=1-tAct*0.5, reach=ch.hRch;
      ctx.globalAlpha=fade; ctx.lineCap='round';
      ctx.shadowBlur=16; ctx.shadowColor=ch.eyeCol;
      ctx.strokeStyle=ch.eyeCol; ctx.lineWidth=heavy?8:5;
      if(heavy&&atk.dir==='down'){
        // Spinning sweep: ring + spinning spear line
        const r=reach*0.75, spinAng=tAct*Math.PI*2;
        ctx.lineWidth=10; ctx.globalAlpha=fade*0.65;
        ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.stroke();
        ctx.lineWidth=22; ctx.globalAlpha=fade*0.2;
        ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.stroke();
        ctx.globalAlpha=fade; ctx.lineWidth=7; ctx.shadowBlur=22;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(spinAng)*r,Math.sin(spinAng)*r); ctx.stroke();
        ctx.fillStyle=ch.eyeCol; ctx.globalAlpha=fade*0.9;
        ctx.shadowBlur=20; ctx.beginPath(); ctx.arc(Math.cos(spinAng)*r,Math.sin(spinAng)*r,8,0,Math.PI*2); ctx.fill();
      } else if (atk.dir==='up') {
        ctx.beginPath(); ctx.moveTo(0,-h*0.1); ctx.lineTo(0,-reach*0.85); ctx.stroke();
        ctx.strokeStyle=ch.color; ctx.lineWidth=heavy?4:3; ctx.globalAlpha=fade*0.5;
        for (let i=1;i<=3;i++) { ctx.beginPath(); ctx.moveTo(i*8-12,-h*0.15); ctx.lineTo(i*6-10,-reach*0.8); ctx.stroke(); }
      } else if (atk.dir==='down') {
        ctx.beginPath(); ctx.moveTo(0,h*0.2); ctx.lineTo(0,reach*0.8); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(w*0.2,0); ctx.lineTo(reach*0.88,0); ctx.stroke();
        ctx.strokeStyle=ch.color; ctx.lineWidth=heavy?4:2; ctx.globalAlpha=fade*0.5;
        for (let i=1;i<=3;i++) { ctx.beginPath(); ctx.moveTo(w*0.1,i*7-12); ctx.lineTo(reach*0.8,i*5-10); ctx.stroke(); }
      }
    }
  } else { // default (BOLT, CRUSHER, ZIPPY)
    if (heavy&&inSU) {
      const g=ctx.createRadialGradient(0,0,4,0,0,w*0.9*tSU);
      g.addColorStop(0,color+'cc'); g.addColorStop(1,color+'00');
      ctx.fillStyle=g; ctx.globalAlpha=tSU*0.7;
      ctx.beginPath(); ctx.arc(0,0,w*0.9*tSU,0,Math.PI*2); ctx.fill();
    }
    if (inAct) {
      const fade=1-tAct*0.55; ctx.globalAlpha=fade;
      ctx.shadowBlur=heavy?20:12; ctx.shadowColor=color;
      const reach=heavy?(ch.hRch||80):(ch.lRch||60), sz=heavy?(ch.hSz||62):(ch.lSz||44);
      ctx.strokeStyle=color; ctx.lineCap='round';
      if (atk.dir==='side') {
        ctx.lineWidth=heavy?9:6; ctx.beginPath(); ctx.arc(reach*0.38,0,reach*0.72,-0.75,0.75); ctx.stroke();
        ctx.strokeStyle=color2; ctx.lineWidth=heavy?5:3; ctx.globalAlpha=fade*0.5;
        ctx.beginPath(); ctx.arc(reach*0.25,0,reach*1.05,-0.95,0.95); ctx.stroke();
        ctx.globalAlpha=fade*0.8; ctx.lineWidth=heavy?3:2; ctx.strokeStyle=color2;
        for (let i=-1;i<=1;i++) { ctx.beginPath(); ctx.moveTo(4,i*sz*0.22); ctx.lineTo(reach*0.82,i*sz*0.12); ctx.stroke(); }
      } else if (atk.dir==='up') {
        ctx.lineWidth=heavy?9:6; ctx.beginPath(); ctx.arc(0,-h*0.15,reach*0.68,-Math.PI*0.9,-Math.PI*0.1); ctx.stroke();
        ctx.strokeStyle=color2; ctx.lineWidth=heavy?5:3; ctx.globalAlpha=fade*0.5;
        ctx.beginPath(); ctx.arc(0,-h*0.1,reach*0.9,-Math.PI+0.25,-0.25); ctx.stroke();
      } else if (atk.dir==='down') {
        ctx.lineWidth=heavy?9:6; ctx.beginPath(); ctx.arc(0,h*0.15,reach*0.68,Math.PI*0.1,Math.PI*0.9); ctx.stroke();
        ctx.strokeStyle=color2; ctx.lineWidth=heavy?5:3; ctx.globalAlpha=fade*0.5;
        ctx.beginPath(); ctx.arc(0,h*0.1,reach*0.9,0.25,Math.PI-0.25); ctx.stroke();
      } else {
        ctx.lineWidth=heavy?9:6; ctx.beginPath(); ctx.arc(reach*0.3,0,reach*0.5,-Math.PI*0.5,Math.PI*0.5); ctx.stroke();
        ctx.strokeStyle=color2; ctx.lineWidth=heavy?5:3; ctx.globalAlpha=fade*0.45;
        ctx.beginPath(); ctx.arc(reach*0.22,0,reach*0.68,-Math.PI*0.65,Math.PI*0.65); ctx.stroke();
      }
    }
  }
  ctx.restore();
}


export { drawCharacter, drawAttackArc };
