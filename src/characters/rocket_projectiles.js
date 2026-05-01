import { ctx, particles, rocketArms, rocketMines, rrFill, sameTeam } from '../globals.js';
import { G } from '../globals.js';
;
;
import { addHitParticles, addDeathExplosion, instakill } from '../particles.js';
import { MAX_KB, DEATH_THRESHOLD, VIS_LEFT, VIS_RIGHT, VIS_TOP, VIS_BOT } from '../player/constants.js';
import { kbScale, playSfx, playSfxNoise } from '../audio.js';

function explodeMines(owner,target){
  let count=0;
  for(let i=rocketMines.length-1;i>=0;i--){
    const m=rocketMines[i];
    if(!m.dead&&m.owner===owner){addHitParticles(m.x,m.y,owner.ch.color,true);m.dead=true;count++;}
  }
  owner.armsLeft=Math.min(4,owner.armsLeft+count);
  if(target&&!target.shieldActive){
    if(target.damage>=DEATH_THRESHOLD&&!target.isDummy){instakill(target,target.cx,target.cy);return;}
    target.damage+=Math.round(14*(target.ch.def??1)); target.hitFlash=14; target.charging=false; target.chargeTime=0;
    const km=kbScale(target.damage), kb=12*km/target.ch.weight;
    target.vx=owner.facing*kb; target.vy=-kb*0.45;
    target.vx=Math.max(-MAX_KB,Math.min(MAX_KB,target.vx));
    target.vy=Math.max(-MAX_KB,Math.min(MAX_KB,target.vy));
    target.hstun=Math.min(55,Math.floor(8+kb*2.2));
    target.onGnd=false; target.onPlat=false; target.hitlag=5;
  } else if(target&&target.shieldActive){
    addHitParticles(target.cx,target.cy,'#aaddff',false);
  }
}

class RocketArm {
  constructor(x,y,vx,vy,owner,heavy){
    this.x=x; this.y=y; this.vx=vx; this.vy=vy;
    this.owner=owner; this.heavy=heavy; this.dead=false;
    this.goingOut=true; this.hitOut=false; this.hitBack=false;
    this.speed=Math.hypot(vx,vy);
    this.maxDist=heavy?195:231;
    this.distTraveled=0;
  }
  hitArm(target){
    if(target.shieldActive){addHitParticles(target.cx,target.cy,'#aaddff',false);return;}
    if(target.damage>=DEATH_THRESHOLD&&!target.isDummy){instakill(target,this.x,this.y);this.dead=true;return;}
    const mult=this.dmgMult||1;
    const kbMult=this.kbMult||mult;
    const dmg=Math.round((this.heavy?Math.round(5*2.5):5)*mult), kb=(this.heavy?4*2.5:4)*kbMult;
    target.damage+=Math.round(dmg*(target.ch.def??1)); target.hitFlash=14; target.charging=false; target.chargeTime=0;
    const km=kbScale(target.damage), kbS=kb*km/target.ch.weight;
    const kDir=this.goingOut?(this.vx>0?1:-1):this.owner.facing;
    target.vx=kDir*kbS; target.vy=-kbS*0.15;
    target.vx=Math.max(-MAX_KB,Math.min(MAX_KB,target.vx));
    target.vy=Math.max(-MAX_KB,Math.min(MAX_KB,target.vy));
    if(this.heavy) target.hstun=Math.min(40,Math.floor(5+kbS*2));
    target.onGnd=false; target.onPlat=false; target.hitlag=3;
    addHitParticles(this.x,this.y,this.owner.ch.color,this.heavy);
  }
  update(players){
    if(this.dead)return;
    if(this.goingOut){
      this.x+=this.vx; this.y+=this.vy;
      this.distTraveled+=this.speed;
      if(this.distTraveled>=this.maxDist){
        this.goingOut=false;
        // Start returning toward owner
        const dx=this.owner.cx-this.x, dy=this.owner.cy-this.y;
        const d=Math.hypot(dx,dy)||1;
        this.vx=(dx/d)*this.speed; this.vy=(dy/d)*this.speed;
      }
    } else {
      const dx=this.owner.cx-this.x, dy=this.owner.cy-this.y;
      const d=Math.hypot(dx,dy);
      if(d<14){this.dead=true; this.owner.armsLeft=Math.min(4,this.owner.armsLeft+(this.dual?2:1)); return;}
      this.vx=(dx/d)*this.speed; this.vy=(dy/d)*this.speed;
      this.x+=this.vx; this.y+=this.vy;
    }
    for(const p of G.players){
      if(p===this.owner||sameTeam(p,this.owner)||p.dead||p.hitlag>0||p.hitImmune>0)continue;
      if(this.x-8<p.right&&this.x+8>p.x&&this.y-8<p.bottom&&this.y+8>p.y){
        if(this.goingOut&&!this.hitOut){this.hitArm(p);this.hitOut=true;p.hitImmune=6;}
        else if(!this.goingOut&&!this.hitBack&&!this.hitOut){this.hitArm(p);this.hitBack=true;}
      }
    }
  }
  draw(){
    if(this.dead)return;
    const ch=this.owner.ch, ang=Math.atan2(this.vy,this.vx);
    ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(ang);
    ctx.shadowBlur=10; ctx.shadowColor=ch.eyeCol;
    const offsets=this.dual?[-8,8]:[0];
    for(const oy of offsets){
      ctx.fillStyle=ch.color; ctx.fillRect(-16,oy-5,28,10);
      ctx.fillStyle=ch.accent; ctx.beginPath(); ctx.arc(-4,oy,6,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=this.heavy?'#ffffff':ch.eyeCol;
      ctx.beginPath(); ctx.arc(14,oy,7,0,Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur=0; ctx.restore();
  }
}

class RocketMine {
  constructor(x,y,side,owner){
    this.x=x; this.y=y; this.side=side; this.owner=owner;
    this.timer=180; this.dead=false;
  }
  update(players){
    if(this.dead)return;
    this.timer--;
    // Hover beside owner
    this.x=this.owner.cx+this.side*55;
    this.y=this.owner.cy;
    if(this.timer<=0){this.dead=true; this.owner.armsLeft=Math.min(4,this.owner.armsLeft+1); return;}
    for(const p of G.players){
      if(p===this.owner||sameTeam(p,this.owner)||p.dead||p.hitlag>0)continue;
      if(Math.hypot(p.cx-this.x,p.cy-this.y)<30){explodeMines(this.owner,p);return;}
    }
  }
  draw(){
    if(this.dead)return;
    const ch=this.owner.ch, pulse=0.55+Math.sin(G.frame*0.18)*0.45;
    const alpha=this.timer<60?Math.max(0.2,this.timer/60):1;
    ctx.save(); ctx.globalAlpha=alpha; ctx.translate(this.x,this.y);
    ctx.shadowBlur=14*pulse; ctx.shadowColor=ch.eyeCol;
    ctx.fillStyle=ch.color; ctx.beginPath(); ctx.arc(0,0,10,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=ch.eyeCol; ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=ch.eyeCol; ctx.lineWidth=2; ctx.globalAlpha=pulse*alpha;
    ctx.beginPath(); ctx.arc(0,0,17,0,Math.PI*2); ctx.stroke();
    ctx.shadowBlur=0; ctx.restore();
  }
}

export { explodeMines, RocketArm, RocketMine, rocketArms, rocketMines };
