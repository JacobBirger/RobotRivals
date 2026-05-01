import { H, W, ctx, particles, pristineRockets, rrFill, sameTeam } from '../globals.js';
import { G } from '../globals.js';
;
;
import { addHitParticles, instakill } from '../particles.js';
import { MAX_KB, DEATH_THRESHOLD, VIS_LEFT, VIS_RIGHT, VIS_TOP, VIS_BOT } from '../player/constants.js';
import { kbScale, playSfx } from '../audio.js';

class PristineRocket {
  constructor(x,y,vx,vy,owner){
    this.x=x; this.y=y; this.vx=vx; this.vy=vy;
    this.owner=owner; this.dead=false;
    this.timer=60; this.speed=9;
    this.dmg=owner.ch.hDmg||12; this.kb=owner.ch.hKB||11;
  }
  update(players){
    if(this.dead)return;
    this.timer--;
    if(this.timer<=0){this.explode(players);return;}
    // Soft homing toward nearest enemy
    let nearest=null,nearDist=Infinity;
    for(const p of G.players){
      if(p===this.owner||sameTeam(p,this.owner)||p.dead)continue;
      const d=Math.hypot(p.cx-this.x,p.cy-this.y);
      if(d<nearDist){nearest=p;nearDist=d;}
    }
    if(nearest){
      const dx=nearest.cx-this.x,dy=nearest.cy-this.y;
      const d=Math.hypot(dx,dy)||1;
      this.vx=this.vx*0.88+(dx/d)*this.speed*0.12;
      this.vy=this.vy*0.88+(dy/d)*this.speed*0.12;
      const cur=Math.hypot(this.vx,this.vy)||1;
      this.vx=this.vx/cur*this.speed; this.vy=this.vy/cur*this.speed;
    }
    this.x+=this.vx; this.y+=this.vy;
    if(this.x<-100||this.x>W+100||this.y<-100||this.y>H+100){this.dead=true;return;}
    for(const p of G.players){
      if(p===this.owner||sameTeam(p,this.owner)||p.dead||p.hitImmune>0)continue;
      if(this.x>p.x-10&&this.x<p.right+10&&this.y>p.y-10&&this.y<p.bottom+10){
        this.hitPlayer(p); this.explode(players); return;
      }
    }
  }
  hitPlayer(target){
    if(target.laserShieldActive){
      this.owner.damage+=Math.round(this.dmg*(this.owner.ch.def??1));
      this.owner.hitFlash=14; addHitParticles(this.x,this.y,'#00ffff',true); return;
    }
    if(target.shieldActive){addHitParticles(target.cx,target.cy,'#aaddff',false);return;}
    if(target.damage>=DEATH_THRESHOLD&&!target.isDummy){instakill(target,this.x,this.y);this.dead=true;return;}
    target.damage+=Math.round(this.dmg*(target.ch.def??1));
    target.hitFlash=14; target.charging=false; target.chargeTime=0;
    const km=kbScale(target.damage),kb=this.kb*km/target.ch.weight;
    const ang=Math.atan2(this.vy,this.vx);
    target.vx=Math.cos(ang)*kb; target.vy=Math.sin(ang)*kb-kb*0.15;
    target.vx=Math.max(-MAX_KB,Math.min(MAX_KB,target.vx));
    target.vy=Math.max(-MAX_KB,Math.min(MAX_KB,target.vy));
    target.hstun=Math.min(55,Math.floor(8+kb*2.2));
    target.onGnd=false; target.onPlat=false; target.hitlag=5; this.owner.hitlag=0;
    addHitParticles(this.x,this.y,'#00ffff',true);
    G.shakeX+=(Math.random()-.5)*8; G.shakeY+=(Math.random()-.5)*4;
  }
  explode(players){
    this.dead=true;
    addHitParticles(this.x,this.y,'#ffffff',true);
    addHitParticles(this.x,this.y,'#00ffff',false);
    G.shakeX+=(Math.random()-.5)*6; G.shakeY+=(Math.random()-.5)*4;
  }
  draw(){
    if(this.dead)return;
    const ang=Math.atan2(this.vy,this.vx);
    ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(ang);
    ctx.shadowBlur=18; ctx.shadowColor='#00ffff';
    // Exhaust glow
    const pulse=Math.sin(G.frame*0.4)*0.3+0.7;
    ctx.globalAlpha=pulse*0.85; ctx.fillStyle='#00ffff';
    ctx.beginPath(); ctx.ellipse(-16,0,9,4,0,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
    // Body
    ctx.fillStyle='#ffffff';
    ctx.beginPath(); ctx.ellipse(0,0,14,5,0,0,Math.PI*2); ctx.fill();
    // Nose
    ctx.fillStyle='#00ffff';
    ctx.beginPath(); ctx.moveTo(16,0); ctx.lineTo(7,-4); ctx.lineTo(7,4); ctx.closePath(); ctx.fill();
    // Fins
    ctx.fillStyle='#000000';
    ctx.beginPath(); ctx.moveTo(-14,0); ctx.lineTo(-8,-8); ctx.lineTo(-7,-3); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-14,0); ctx.lineTo(-8,8); ctx.lineTo(-7,3); ctx.closePath(); ctx.fill();
    // Timer warning flash (last 20 frames)
    if(this.timer<20){
      ctx.globalAlpha=(Math.sin(G.frame*0.4)*0.5+0.5)*0.5;
      ctx.fillStyle='#ff4444'; ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur=0; ctx.globalAlpha=1; ctx.restore();
  }
}

export { PristineRocket, pristineRockets };
