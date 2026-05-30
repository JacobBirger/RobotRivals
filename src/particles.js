// Particle system + screen shake
import { ctx, particles } from './globals.js';
import { G } from './globals.js';

function addDeathExplosion(x,y){
  // Big visual-only burst — no damage
  for(let i=0;i<30;i++){
    const a=Math.random()*Math.PI*2,s=6+Math.random()*12;
    const cols=['#ffee00','#ff8800','#ff2200','#ffffff'];
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,life:40,max:40,col:cols[Math.floor(Math.random()*cols.length)],sz:3+Math.random()*5});
  }
  for(let i=0;i<12;i++){
    const a=(i/12)*Math.PI*2,s=18;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:14,max:14,col:'#ffffff',sz:3});
  }
  // Shockwave ring stored as a special particle
  particles.push({x,y,vx:0,vy:0,life:18,max:18,col:'#ffaa00',sz:8,ring:true,ringR:0});
  G.shakeX+=(Math.random()-.5)*22; G.shakeY+=(Math.random()-.5)*22;
}
function instakill(target,x,y){
  addDeathExplosion(x,y);
  target.die();
}
function addHitParticles(x,y,color,heavy) {
  const n=heavy?14:8;
  for (let i=0;i<n;i++) {
    const a=Math.random()*Math.PI*2,s=heavy?(4+Math.random()*6):(2+Math.random()*4);
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,life:heavy?28:18,max:heavy?28:18,col:color,sz:heavy?(3+Math.random()*4):(1.5+Math.random()*2.5)});
  }
  for (let i=0;i<(heavy?5:3);i++) {
    const a=(i/(heavy?5:3))*Math.PI*2,s=heavy?9:6;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:10,max:10,col:'#ffffff',sz:2});
  }
  G.shakeX+=(Math.random()-.5)*(heavy?14:6); G.shakeY+=(Math.random()-.5)*(heavy?14:6);
}
function updateParticles() {
  for (let i=particles.length-1;i>=0;i--) {
    const p=particles[i];
    if (p.text) { p.x+=p.vx; p.y+=p.vy; /* no friction, no gravity for floating text */ }
    else { p.x+=p.vx; p.y+=p.vy; p.vx*=0.88; p.vy=p.vy*0.88+0.15; }
    p.life--;
    if (p.life<=0) particles.splice(i,1);
  }
  G.shakeX*=0.72; G.shakeY*=0.72;
  if (Math.abs(G.shakeX)<0.5) G.shakeX=0; if (Math.abs(G.shakeY)<0.5) G.shakeY=0;
}
function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha=p.life/p.max;
    if(p.text){
      const t=p.life/p.max;
      const scale=1.4+(1-t)*0.6;
      ctx.save();
      ctx.translate(p.x,p.y); ctx.scale(scale,scale);
      ctx.font='bold 18px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.shadowBlur=14; ctx.shadowColor=p.col;
      ctx.fillStyle='#ffffff'; ctx.fillText(p.text,0,0);
      ctx.shadowBlur=0;
      ctx.restore();
    } else if(p.ring){
      const r=p.ringR+(1-p.life/p.max)*110;
      ctx.strokeStyle=p.col; ctx.lineWidth=3*(p.life/p.max);
      ctx.shadowBlur=18; ctx.shadowColor=p.col;
      ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.stroke();
      ctx.shadowBlur=0;
    } else {
      ctx.fillStyle=p.col; ctx.beginPath(); ctx.arc(p.x,p.y,p.sz*(p.life/p.max),0,Math.PI*2); ctx.fill();
    }
  }
  ctx.globalAlpha=1;
}

// ---- Helpers ----
function rrPath(x,y,w,h,r) {
  r=Math.min(r,w/2,h/2); ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}
function rrFill(x,y,w,h,r,c){rrPath(x,y,w,h,r);ctx.fillStyle=c;ctx.fill();}
function rrStroke(x,y,w,h,r,c,lw){rrPath(x,y,w,h,r);ctx.strokeStyle=c;ctx.lineWidth=lw;ctx.stroke();}
function aabb(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}

export { addDeathExplosion, instakill, addHitParticles, updateParticles, drawParticles, rrPath, rrFill, rrStroke };
