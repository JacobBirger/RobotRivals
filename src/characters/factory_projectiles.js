import { H, W, aabb, ctx, factoryBolts, factoryGears, factoryZaps, particles, rrFill, sameTeam } from '../globals.js';
import { G } from '../globals.js';
;
;
import { addHitParticles, instakill } from '../particles.js';
import { MAX_KB, DEATH_THRESHOLD, VIS_LEFT, VIS_RIGHT, VIS_TOP, VIS_BOT } from '../player/constants.js';
import { kbScale, playSfx } from '../audio.js';

function drawGearShape(ctx,r,teeth,fillCol,strokeCol){
  ctx.fillStyle=fillCol; ctx.strokeStyle=strokeCol; ctx.lineWidth=2;
  ctx.beginPath();
  for(let i=0;i<teeth*2;i++){
    const a=i*Math.PI/teeth, rad=i%2===0?r:r*0.68;
    i===0?ctx.moveTo(Math.cos(a)*rad,Math.sin(a)*rad):ctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle=strokeCol;
  ctx.beginPath(); ctx.arc(0,0,r*0.32,0,Math.PI*2); ctx.fill();
}
class FactoryBolt {
  constructor(x,y,vx,vy,owner){
    this.x=x-9; this.y=y-8; this.vx=vx; this.vy=vy;
    this.owner=owner; this.dead=false;
    this.w=18; this.h=16; this.dmg=8; this.kb=7; this.life=360; this.frame=0;
  }
  get cx(){return this.x+9;} get cy(){return this.y+8;}
  update(players){
    if(this.dead)return;
    this.frame++; if(this.frame>this.life){this.dead=true;return;}
    // Home toward enemy
    const target=G.players.find(p=>p!==this.owner&&!sameTeam(p,this.owner)&&!p.dead)||null;
    if(target){
      const dx=target.cx-this.cx, dy=target.cy-this.cy;
      const targetAngle=Math.atan2(dy,dx);
      const currentAngle=Math.atan2(this.vy,this.vx);
      let diff=targetAngle-currentAngle;
      while(diff>Math.PI)diff-=Math.PI*2; while(diff<-Math.PI)diff+=Math.PI*2;
      const newAngle=currentAngle+Math.sign(diff)*Math.min(Math.abs(diff),0.07);
      const spd=Math.hypot(this.vx,this.vy)||4.5;
      this.vx=Math.cos(newAngle)*spd; this.vy=Math.sin(newAngle)*spd;
    }
    this.x+=this.vx; this.y+=this.vy;
    if(this.x<-120||this.x>W+120||this.y>H+120){this.dead=true;return;}
    // Enemy projectiles destroy the Bolt
    const pb0={x:this.x,y:this.y,w:this.w,h:this.h};
    for(const arr of [bullets,rocketArms,knives,throwSwords,firePebbles,pristineRockets,factoryBolts,factoryGears,factoryZaps]){
      for(const proj of arr){
        if(!proj||proj===this||proj.dead)continue;
        if(proj.owner===this.owner||sameTeam(proj.owner,this.owner))continue;
        const px=proj.x??proj.cx-proj.r, py=proj.y??proj.cy-proj.r;
        const pw=proj.w??(proj.r*2), ph=proj.h??(proj.r*2);
        if(aabb(pb0,{x:px,y:py,w:pw,h:ph})){this.dead=true;addHitParticles(this.cx,this.cy,'#aaaaaa',false);return;}
      }
    }
    for(const p of G.players){
      if(p===this.owner||sameTeam(p,this.owner)||p.dead)continue;
      const pb={x:this.x,y:this.y,w:this.w,h:this.h};
      // Enemy active melee hitbox destroys Bolt
      const hb=p.atk?p.hitbox():null;
      if(hb&&aabb(hb,pb)){this.dead=true;addHitParticles(this.cx,this.cy,'#aaaaaa',false);return;}
      if(!aabb(pb,{x:p.x,y:p.y,w:p.w,h:p.h}))continue;
      if(p.shieldActive){addHitParticles(this.cx,this.cy,'#aaddff',false);this.dead=true;return;}
      if(p.laserShieldActive){this.owner.damage+=Math.round(this.dmg*(this.owner.ch.def??1));this.owner.hitFlash=12;this.dead=true;return;}
      if(p.damage>=DEATH_THRESHOLD&&!p.isDummy){instakill(p,this.cx,this.cy);this.dead=true;return;}
      p.damage+=Math.round(this.dmg*(p.ch.def??1)); p.hitFlash=14; p.charging=false; p.chargeTime=0;
      const km=kbScale(p.damage), kb=this.kb*km/p.ch.weight;
      p.vx=this.vx>0?kb:-kb; p.vy=-kb*0.15;
      p.vx=Math.max(-MAX_KB,Math.min(MAX_KB,p.vx)); p.vy=Math.max(-MAX_KB,Math.min(MAX_KB,p.vy));
      p.onGnd=false; p.onPlat=false;
      p.hitlag=4; this.owner.hitlag=0;
      addHitParticles(this.cx,this.cy,'#00ccff',false); this.dead=true; return;
    }
  }
  draw(){
    if(this.dead)return;
    ctx.save(); ctx.translate(this.cx,this.cy);
    // Body
    rrFill(-9,-7,18,14,4,'#555');
    // Glowing eyes
    ctx.shadowBlur=6; ctx.shadowColor='#00ccff'; ctx.fillStyle='#00ccff';
    ctx.beginPath(); ctx.ellipse(-3,-1,3,2.5,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4,-1,3,2.5,0,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    // Wing nubs
    ctx.fillStyle='#888';
    ctx.beginPath(); ctx.ellipse(-10,1,5,3,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(10,1,5,3,0,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
}
class FactoryGear {
  constructor(x,y,owner){
    this.x=x; this.y=y; this.vx=0; this.vy=-10;
    this.owner=owner; this.dead=false; this.r=16;
    this.dmg=7; this.kb=7; this.hitUp=false; this.hitDown=false;
    this.goingUp=true; this.spawnY=y; this.frame=0;
  }
  update(players){
    if(this.dead)return;
    this.frame++;
    if(this.vy>=0) this.goingUp=false;
    this.vy+=0.55; this.y+=this.vy;
    if(!this.goingUp&&this.y>=this.spawnY){this.dead=true;return;}
    if(this.y<-300){this.dead=true;return;}
    for(const p of G.players){
      if(p===this.owner||sameTeam(p,this.owner)||p.dead||p.shieldActive)continue;
      const canHit=(this.goingUp&&!this.hitUp)||(!this.goingUp&&!this.hitDown);
      if(!canHit)continue;
      if(!aabb({x:this.x-this.r,y:this.y-this.r,w:this.r*2,h:this.r*2},{x:p.x,y:p.y,w:p.w,h:p.h}))continue;
      if(this.goingUp)this.hitUp=true; else this.hitDown=true;
      if(p.laserShieldActive){this.owner.damage+=Math.round(this.dmg*(this.owner.ch.def??1));this.owner.hitFlash=12;continue;}
      if(p.damage>=DEATH_THRESHOLD&&!p.isDummy){instakill(p,this.x,this.y);continue;}
      p.damage+=Math.round(this.dmg*(p.ch.def??1)); p.hitFlash=14; p.charging=false; p.chargeTime=0;
      const km=kbScale(p.damage), kb=this.kb*km/p.ch.weight;
      p.vx=(p.cx>this.x?1:-1)*kb*0.4;
      p.vy=this.goingUp?-kb*1.1:kb*0.7;
      p.vx=Math.max(-MAX_KB,Math.min(MAX_KB,p.vx)); p.vy=Math.max(-MAX_KB,Math.min(MAX_KB,p.vy));
      p.onGnd=false; p.onPlat=false;
      p.hitlag=3; addHitParticles(this.x,this.y,'#999999',false);
    }
  }
  draw(){
    if(this.dead)return;
    ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(this.frame*0.18);
    drawGearShape(ctx,this.r,6,'#888','#555');
    ctx.restore();
  }
}
class FactoryZap {
  constructor(x,y,owner){this.x=x; this.y=y; this.owner=owner; this.life=45; this.frame=0; this.dead=false;}
  update(){this.frame++; if(this.frame>=this.life)this.dead=true;}
  draw(){
    if(this.dead)return;
    const alpha=this.frame<this.life*0.7?1:(1-(this.frame-this.life*0.7)/(this.life*0.3));
    ctx.save(); ctx.globalAlpha=alpha; ctx.translate(this.x,this.y);
    rrFill(-8,-7,16,13,3,'#444');
    ctx.shadowBlur=5; ctx.shadowColor='#00ccff'; ctx.fillStyle='#00ccff';
    ctx.beginPath(); ctx.ellipse(0,-1,4,3,0,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    ctx.fillStyle='#333'; ctx.fillRect(-12,-3,4,7); ctx.fillRect(8,-3,4,7);
    if(this.frame<18){
      ctx.globalAlpha=alpha*(1-this.frame/18);
      ctx.shadowBlur=8; ctx.shadowColor='#00ccff'; ctx.fillStyle='#00ccff';
      ctx.beginPath(); ctx.arc(13,-1,4,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;
    }
    ctx.restore();
  }
}

export { drawGearShape, FactoryBolt, FactoryGear, FactoryZap, factoryBolts, factoryGears, factoryZaps };
