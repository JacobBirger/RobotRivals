import { H, W, ctx, particles, rrFill, sameTeam, smokeClouds, unstableHeads } from '../globals.js';
import { G } from '../globals.js';
;
;
import { addHitParticles, instakill } from '../particles.js';
import { MAX_KB, DEATH_THRESHOLD, VIS_LEFT, VIS_RIGHT, VIS_TOP, VIS_BOT } from '../player/constants.js';
import { kbScale, playSfx } from '../audio.js';

class SmokeCloud {
  constructor(x,y,owner){
    this.x=x; this.y=y; this.maxR=120; this.r=120; this.owner=owner;
    this.timer=180; this.tickTimer=60; this.dead=false;
  }
  update(players){
    if(this.dead)return;
    this.timer--; this.tickTimer--;
    this.r=this.maxR*(this.timer/180);
    if(this.tickTimer<=0){
      this.tickTimer=60;
      for(const p of G.players){
        if(p===this.owner||sameTeam(p,this.owner)||p.dead)continue;
        if(Math.abs(p.cx-this.x)<this.r+p.w*0.4&&Math.abs(p.cy-this.y)<this.r+p.h*0.4){
          if(p.damage>=DEATH_THRESHOLD&&!p.isDummy){instakill(p,p.cx,p.cy);continue;}
          p.damage+=Math.round(6*(p.ch.def??1)); p.hitFlash=8;
        }
      }
    }
    if(this.timer<=0)this.dead=true;
  }
  draw(){
    if(this.dead)return;
    const fade=Math.min(1,this.timer/40);
    ctx.save(); ctx.globalAlpha=fade*0.55;
    for(let i=0;i<6;i++){
      const ang=(i/6)*Math.PI*2+G.frame*0.015;
      const ox=Math.cos(ang)*this.r*0.35, oy=Math.sin(ang)*this.r*0.28;
      const gr=ctx.createRadialGradient(this.x+ox,this.y+oy,2,this.x+ox,this.y+oy,this.r*0.72);
      gr.addColorStop(0,'#aaaaaa'); gr.addColorStop(1,'rgba(80,80,80,0)');
      ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(this.x+ox,this.y+oy,this.r*0.72,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}

class UnstableHead {
  constructor(x,y,owner){
    this.x=x; this.y=y; this.vx=0; this.vy=-13;
    this.owner=owner; this.dead=false;
    this.goingOut=true; this.hitOut=false; this.hitBack=false;
    this.distTraveled=0; this.maxDist=160;
    this.dmg=8; this.kb=8;
  }
  update(players){
    if(this.dead)return;
    if(this.goingOut){
      this.y+=this.vy; this.distTraveled+=Math.abs(this.vy);
      this.vy+=0.4;
      if(this.distTraveled>=this.maxDist||this.vy>=0){this.goingOut=false; this.vy=Math.max(this.vy,3);}
    } else {
      const dx=this.owner.cx-this.x, dy=this.owner.cy-this.y;
      const d=Math.hypot(dx,dy);
      if(d<20){this.dead=true; return;}
      const spd=10;
      this.vx+=(dx/d)*1.2; this.vy+=(dy/d)*1.2;
      const curSpd=Math.hypot(this.vx,this.vy);
      if(curSpd>spd){this.vx=this.vx/curSpd*spd; this.vy=this.vy/curSpd*spd;}
      this.x+=this.vx; this.y+=this.vy;
    }
    if(this.goingOut)this.x+=this.vx;
    for(const p of G.players){
      if(p===this.owner||sameTeam(p,this.owner)||p.dead||p.hitlag>0||p.hitImmune>0)continue;
      if(Math.abs(p.cx-this.x)<22&&Math.abs(p.cy-this.y)<26){
        if(this.goingOut&&!this.hitOut){this.doHit(p,'up');this.hitOut=true;p.hitImmune=6;}
        else if(!this.goingOut&&!this.hitBack&&!this.hitOut){this.doHit(p,'down');this.hitBack=true;}
      }
    }
  }
  doHit(target,dir){
    if(target.shieldActive){addHitParticles(target.cx,target.cy,'#aaddff',false);return;}
    if(target.damage>=DEATH_THRESHOLD&&!target.isDummy){instakill(target,this.x,this.y);this.dead=true;return;}
    const km=kbScale(target.damage), kb=this.kb*km/target.ch.weight;
    target.damage+=Math.round(this.dmg*(target.ch.def??1)); target.hitFlash=14; target.charging=false; target.chargeTime=0;
    target.vy=dir==='up'?-kb*0.8:Math.min(MAX_KB,kb*0.6); target.vx=this.owner.facing*kb*0.3;
    target.vy=Math.max(-MAX_KB,Math.min(MAX_KB,target.vy));
    target.hstun=Math.min(40,Math.floor(5+kb*2));
    target.onGnd=false; target.onPlat=false; target.hitlag=4;
    addHitParticles(this.x,this.y,this.owner.ch.color,false);
  }
  draw(){
    if(this.dead)return;
    const ch=this.owner.ch;
    ctx.save(); ctx.translate(this.x,this.y);
    const wobble=Math.sin(G.frame*0.3)*0.15;
    ctx.rotate(wobble);
    ctx.shadowBlur=14; ctx.shadowColor=ch.eyeCol;
    ctx.fillStyle=ch.color; ctx.beginPath(); ctx.ellipse(0,0,16,13,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=ch.hi; ctx.beginPath(); ctx.ellipse(-3,-3,10,6,-0.3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#110000'; ctx.beginPath(); ctx.ellipse(-5,1,5,4,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5,1,5,4,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=ch.eyeCol; ctx.beginPath(); ctx.arc(-5,1,3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(5,1,3,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0; ctx.restore();
  }
}

export { SmokeCloud, UnstableHead, smokeClouds, unstableHeads };
