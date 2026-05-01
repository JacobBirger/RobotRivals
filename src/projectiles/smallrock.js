import { H, W, ctx, particles, rrFill } from '../globals.js';
import { G } from '../globals.js';
;
;
import { addHitParticles, instakill } from '../particles.js';
import { MAX_KB, DEATH_THRESHOLD, SMALL_ROCK_RADIUS, SMALL_ROCK_DMG, VIS_LEFT, VIS_RIGHT, VIS_TOP, VIS_BOT } from '../player/constants.js';
import { kbScale, playSfx } from '../audio.js';

class SmallRock {
  constructor(x,y,vx,vy){
    this.x=x; this.y=y; this.vx=vx; this.vy=vy; this.r=SMALL_ROCK_RADIUS;
    this.dead=false; this.thrown=false; this.heldBy=null;
    this.spinT=Math.random()*Math.PI*2; this.spinV=(Math.random()-0.5)*0.12;
    this.lastOwner=null; this.lastOwnerImmuneT=0;
    // Trail history for thrown motion blur
    this.trail=[];
    // Generate jagged outline (5-7 vertices)
    this.outline=[];
    const n=5+Math.floor(Math.random()*3);
    for(let i=0;i<n;i++){
      const a=(i/n)*Math.PI*2;
      const rr=this.r*(0.75+Math.random()*0.4);
      this.outline.push([Math.cos(a)*rr,Math.sin(a)*rr]);
    }
  }
  get cx(){return this.x;} get cy(){return this.y;}
  intersectsPlayer(p){
    // Circle vs AABB
    const cx=Math.max(p.x,Math.min(this.x,p.right));
    const cy=Math.max(p.y,Math.min(this.y,p.bottom));
    const dx=cx-this.x, dy=cy-this.y;
    return dx*dx+dy*dy <= this.r*this.r;
  }
  update(players){
    if(this.dead) return;
    if(this.lastOwnerImmuneT>0) this.lastOwnerImmuneT--;
    if(this.heldBy){
      // Held: glue to holder's hand
      if(this.heldBy.dead||this.heldBy.heldRock!==this){this.heldBy=null; return;}
      const h=this.heldBy;
      this.x=h.cx + h.facing*30;
      this.y=h.cy-10+Math.sin(G.frame*0.12)*2;
      this.spinT+=0.04;
      return;
    }
    this.x+=this.vx; this.y+=this.vy;
    this.spinT+=this.spinV;
    if(!this.thrown){
      // Free-floating: friction + gentle bob
      this.vx*=0.97; this.vy*=0.97;
      this.vy+=Math.sin(G.frame*0.05+this.spinT)*0.02;
      if(Math.abs(this.vx)<0.05) this.vx=0;
      if(Math.abs(this.vy)<0.05) this.vy=0;
    } else {
      // Thrown: keep last few positions for motion-blur trail
      this.trail.push([this.x,this.y]);
      if(this.trail.length>4) this.trail.shift();
    }
    // Off-screen kill (with margin)
    if(this.x<VIS_LEFT-50||this.x>VIS_RIGHT+50||this.y<VIS_TOP-50||this.y>VIS_BOT+50){this.dead=true; return;}
    // Hit detection only when thrown
    if(this.thrown){
      for(const p of G.players){
        if(p.dead||p.isDummy) continue;
        if(p===this.lastOwner&&this.lastOwnerImmuneT>0) continue;
        if(p.shieldActive){
          if(this.intersectsPlayer(p)){addHitParticles(this.x,this.y,'#aaddff',false); this.dead=true; return;}
          continue;
        }
        if(this.intersectsPlayer(p)){
          if(p.damage>=DEATH_THRESHOLD&&!p.isDummy){instakill(p,this.x,this.y); this.dead=true; return;}
          p.damage += Math.round(SMALL_ROCK_DMG*(p.ch.def??1));
          p.hitFlash=15; p.charging=false; p.chargeTime=0;
          const sp=Math.hypot(this.vx,this.vy)||1;
          const kb=8 * kbScale(p.damage) / p.ch.weight;
          p.vx = (this.vx/sp)*kb; p.vy = (this.vy/sp)*kb*0.5 - 1;
          p.vx=Math.max(-MAX_KB,Math.min(MAX_KB,p.vx)); p.vy=Math.max(-MAX_KB,Math.min(MAX_KB,p.vy));
          p.hstun=Math.min(40, 12+Math.floor(sp*1.5));
          p.hitlag=4;
          addHitParticles(this.x,this.y,'#aa8855',true);
          // Extra rock-dust burst
          for(let i=0;i<8;i++){
            const a=Math.random()*Math.PI*2,sp2=3+Math.random()*5;
            particles.push({x:this.x,y:this.y,vx:Math.cos(a)*sp2,vy:Math.sin(a)*sp2,life:20,max:20,col:'#7a5a3a',sz:2+Math.random()*2});
          }
          G.shakeX+=(Math.random()-.5)*6;
          this.dead=true; return;
        }
      }
    }
  }
  draw(){
    if(this.dead) return;
    ctx.save();
    // Motion trail when thrown
    if(this.thrown&&this.trail.length>0){
      for(let i=0;i<this.trail.length;i++){
        const [tx,ty]=this.trail[i];
        const a=(i+1)/(this.trail.length+1)*0.4;
        ctx.fillStyle=`rgba(120,90,60,${a})`;
        ctx.beginPath();ctx.arc(tx,ty,this.r*0.85,0,Math.PI*2);ctx.fill();
      }
    }
    ctx.translate(this.x,this.y);
    ctx.rotate(this.spinT);
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.25)';
    ctx.beginPath();ctx.ellipse(0,this.r*0.85,this.r*0.7,4,0,0,Math.PI*2);ctx.fill();
    // Body
    ctx.beginPath();
    for(let i=0;i<this.outline.length;i++){
      const [px,py]=this.outline[i];
      if(i===0)ctx.moveTo(px,py); else ctx.lineTo(px,py);
    }
    ctx.closePath();
    const g=ctx.createRadialGradient(-this.r*0.3,-this.r*0.3,this.r*0.1,0,0,this.r*1.1);
    g.addColorStop(0,'#9a8060');
    g.addColorStop(0.5,'#6d543a');
    g.addColorStop(1,'#3a2a1a');
    ctx.fillStyle=g;ctx.fill();
    ctx.strokeStyle='#2a1a0a';ctx.lineWidth=1.5;ctx.stroke();
    // Highlight
    ctx.fillStyle='rgba(220,200,170,0.4)';
    ctx.beginPath();ctx.ellipse(-this.r*0.25,-this.r*0.35,this.r*0.35,this.r*0.16,-0.3,0,Math.PI*2);ctx.fill();
    // Glow when held (subtle yellow rim) or thrown (white-hot rim from speed)
    if(this.heldBy||this.thrown){
      ctx.strokeStyle=this.heldBy?'rgba(255,220,120,0.55)':'rgba(255,240,200,0.4)';
      ctx.lineWidth=2;ctx.shadowBlur=8;ctx.shadowColor=this.heldBy?'#ffcc66':'#ffffff';
      ctx.beginPath();
      for(let i=0;i<this.outline.length;i++){
        const [px,py]=this.outline[i];
        if(i===0)ctx.moveTo(px,py); else ctx.lineTo(px,py);
      }
      ctx.closePath();ctx.stroke();
      ctx.shadowBlur=0;
    }
    ctx.restore();
  }
}

export { SmallRock };
