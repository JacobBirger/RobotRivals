import { H, W, ctx, firePebbles, knives, particles, rrFill, sameTeam, throwSwords } from '../globals.js';
import { G } from '../globals.js';
;
;
import { addHitParticles, addDeathExplosion, instakill } from '../particles.js';
import { MAX_KB, DEATH_THRESHOLD, VIS_LEFT, VIS_RIGHT, VIS_TOP, VIS_BOT } from '../player/constants.js';
import { kbScale, playSfx, playSfxNoise } from '../audio.js';

class FirePebble {
  constructor(x,y,vx,owner,linger=false){
    this.x=x; this.y=y; this.vx=vx; this.vy=0;
    this.owner=owner; this.dead=false;
    this.ox=x; this.oy=y;
    this.maxDist=75;
    this.dmg=4; this.kb=5;
    this.explodeDmg=16; this.explodeKB=14;
    this.explodeTimer=0;
    this.linger=linger;       // if true: after hitting, stick to target and deal 2 burn ticks
    this.lingerTicks=0;       // remaining linger ticks (counts down)
    this.lingerTickTimer=0;   // frames until next tick
    this.lingerTarget=null;
  }
  get dist(){return Math.hypot(this.x-this.ox,this.y-this.oy);}
  update(players){
    if(this.dead)return;
    // Linger burn ticks after initial hit
    if(this.lingerTicks>0){
      this.lingerTickTimer--;
      if(this.lingerTickTimer<=0){
        const p=this.lingerTarget;
        if(p&&!p.dead){
          if(p.damage>=DEATH_THRESHOLD&&!p.isDummy){instakill(p,p.cx,p.cy);this.dead=true;return;}
          p.damage+=Math.round(this.dmg*(p.ch.def??1)); p.hitFlash=8;
          addHitParticles(p.cx,p.cy,'#ff4400',false);
        }
        this.lingerTicks--;
        if(this.lingerTicks>0) this.lingerTickTimer=30;
        else this.dead=true;
      }
      return;
    }
    if(this.explodeTimer>0){this.explodeTimer--;if(this.explodeTimer<=0)this.dead=true;return;}
    this.x+=this.vx;
    if(this.dist>=this.maxDist){if(this.linger){this.dead=true;return;}this.explode(players);return;}
    if(this.x<-80||this.x>W+80||this.y<-80||this.y>H+80){this.dead=true;return;}
    for(const p of G.players){
      if(p===this.owner||sameTeam(p,this.owner)||p.dead)continue;
      if(p.laserShieldActive){
        if(this.x>p.x-10&&this.x<p.right+10&&this.y>p.y-10&&this.y<p.bottom+10){
          this.owner.damage+=Math.round(this.dmg*(this.owner.ch.def??1));
          this.owner.hitFlash=12; addHitParticles(this.x,this.y,'#00ffff',false);
          this.dead=true; return;
        }
        continue;
      }
      if(p.shieldActive){
        if(this.x>p.x-10&&this.x<p.right+10&&this.y>p.y-10&&this.y<p.bottom+10){
          addHitParticles(this.x,this.y,'#aaddff',false); this.dead=true; return;
        }
        continue;
      }
      if(this.x>p.x&&this.x<p.right&&this.y>p.y&&this.y<p.bottom){
        if(p.damage>=DEATH_THRESHOLD&&!p.isDummy){instakill(p,this.x,this.y);this.dead=true;return;}
        p.damage+=Math.round(this.dmg*(p.ch.def??1)); p.hitFlash=10;
        const km=kbScale(p.damage), kb=this.kb*km/p.ch.weight;
        p.vx=this.vx>0?kb:-kb; p.vy=-kb*0.08;
        p.vx=Math.max(-MAX_KB,Math.min(MAX_KB,p.vx)); p.vy=Math.max(-MAX_KB,Math.min(MAX_KB,p.vy));
        p.onGnd=false; p.onPlat=false;
        p.hitlag=3; this.owner.hitlag=0;
        addHitParticles(this.x,this.y,'#ff4400',false);
        if(this.linger){
          // Stay and burn for 2 more ticks
          this.vx=0; this.vy=0;
          this.lingerTicks=2; this.lingerTickTimer=30; this.lingerTarget=p;
        } else {
          this.dead=true;
        }
        return;
      }
    }
  }
  explode(players){
    const r=70;
    addHitParticles(this.x,this.y,'#ff4400',true);
    addHitParticles(this.x,this.y,'#ffaa00',true);
    G.shakeX+=(Math.random()-.5)*10; G.shakeY+=(Math.random()-.5)*10;
    for(const p of G.players){
      if(p===this.owner||sameTeam(p,this.owner)||p.dead)continue;
      if(p.laserShieldActive){
        this.owner.damage+=Math.round(this.explodeDmg*(this.owner.ch.def??1));
        this.owner.hitFlash=14; this.explodeTimer=12; return;
      }
      if(p.shieldActive){
        const dx=p.cx-this.x, dy=p.cy-this.y;
        if(Math.hypot(dx,dy)<r+Math.max(p.w,p.h)/2){
          addHitParticles(this.x,this.y,'#aaddff',false); this.explodeTimer=12; return;
        }
        continue;
      }
      const dx=p.cx-this.x, dy=p.cy-this.y;
      if(Math.hypot(dx,dy)<r+Math.max(p.w,p.h)/2){
        if(p.damage>=DEATH_THRESHOLD&&!p.isDummy){instakill(p,p.cx,p.cy);this.explodeTimer=12;return;}
        p.damage+=Math.round(this.explodeDmg*(p.ch.def??1)); p.hitFlash=15;
        const km=kbScale(p.damage), kb=this.explodeKB*km/p.ch.weight;
        const ang=Math.atan2(dy,dx);
        p.vx=Math.cos(ang)*kb; p.vy=Math.sin(ang)*kb-kb*0.15;
        p.vx=Math.max(-MAX_KB,Math.min(MAX_KB,p.vx)); p.vy=Math.max(-MAX_KB,Math.min(MAX_KB,p.vy));
        p.hstun=Math.min(58,Math.floor(8+kb*2.2)); p.onGnd=false; p.onPlat=false;
        p.hitlag=6; this.owner.hitlag=6;
      }
    }
    this.explodeTimer=12;
  }
  draw(){
    if(this.dead)return;
    ctx.save();
    if(this.explodeTimer>0){
      // Expanding explosion flash
      const t=1-this.explodeTimer/12;
      const exR=20+t*60;
      ctx.globalAlpha=(1-t)*0.85;
      const gr=ctx.createRadialGradient(this.x,this.y,2,this.x,this.y,exR);
      gr.addColorStop(0,'#ffee00'); gr.addColorStop(0.35,'#ff4400'); gr.addColorStop(1,'rgba(200,0,0,0)');
      ctx.fillStyle=gr; ctx.shadowBlur=30; ctx.shadowColor='#ff4400';
      ctx.beginPath(); ctx.arc(this.x,this.y,exR,0,Math.PI*2); ctx.fill();
      ctx.restore(); return;
    }
    const t=this.dist/this.maxDist;
    ctx.shadowBlur=16; ctx.shadowColor='#ff4400';
    const gr=ctx.createRadialGradient(this.x,this.y,1,this.x,this.y,9);
    gr.addColorStop(0,'#ffcc00'); gr.addColorStop(0.45,'#ff4400'); gr.addColorStop(1,'rgba(180,0,0,0)');
    ctx.fillStyle=gr;
    ctx.beginPath(); ctx.arc(this.x,this.y,9,0,Math.PI*2); ctx.fill();
    // Trail
    ctx.globalAlpha=0.35*(1-t); ctx.fillStyle='#ff2200';
    ctx.beginPath(); ctx.arc(this.x-this.vx*2.5,this.y,5,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
}

class Knife {
  constructor(x,y,vx,vy,owner,heavy=false){
    this.x=x;this.y=y;this.vx=vx;this.vy=vy;
    this.owner=owner;this.heavy=heavy;this.dead=false;
    this.ox=x;this.oy=y;
    this.dmg=heavy?9:6; this.kb=heavy?9:5;
    this.maxDist=heavy?420:300;
  }
  get dist(){return Math.hypot(this.x-this.ox,this.y-this.oy);}
  update(players){
    if(this.dead)return;
    this.x+=this.vx;this.y+=this.vy;
    if(this.dist>this.maxDist||this.x<-80||this.x>W+80||this.y<-80||this.y>H+80){this.dead=true;return;}
    for(const p of G.players){
      if(p===this.owner||sameTeam(p,this.owner)||p.dead)continue;
      if(p.shieldActive){
        if(this.x>p.x-10&&this.x<p.right+10&&this.y>p.y-10&&this.y<p.bottom+10){addHitParticles(this.x,this.y,'#aaddff',false);this.dead=true;return;}
        continue;
      }
      if(this.x>p.x&&this.x<p.right&&this.y>p.y&&this.y<p.bottom){
        if(p.damage>=DEATH_THRESHOLD&&!p.isDummy){instakill(p,this.x,this.y);this.dead=true;return;}
        p.damage+=Math.round(this.dmg*(p.ch.def??1));p.hitFlash=14;p.charging=false;p.chargeTime=0;
        const km=kbScale(p.damage),kb=this.kb*km/p.ch.weight;
        p.vx=this.vx>0?kb:-kb;p.vy=-kb*0.1;
        p.vx=Math.max(-MAX_KB,Math.min(MAX_KB,p.vx));p.vy=Math.max(-MAX_KB,Math.min(MAX_KB,p.vy));
        p.onGnd=false;p.onPlat=false;p.hitlag=3;this.owner.hitlag=0;
        addHitParticles(this.x,this.y,this.owner.ch.color,this.heavy);
        G.shakeX+=(Math.random()-.5)*(this.heavy?8:4);this.dead=true;return;
      }
    }
  }
  draw(){
    if(this.dead)return;
    const ang=Math.atan2(this.vy,this.vx),ch=this.owner.ch;
    ctx.save();ctx.translate(this.x,this.y);ctx.rotate(ang);
    ctx.shadowBlur=this.heavy?14:8;ctx.shadowColor=ch.eyeCol;
    const bl=this.heavy?20:14;
    ctx.fillStyle=ch.hi;ctx.beginPath();ctx.moveTo(bl,0);ctx.lineTo(-6,-4);ctx.lineTo(-6,4);ctx.closePath();ctx.fill();
    ctx.fillStyle=ch.accent;ctx.fillRect(-10,-2,5,4);
    ctx.shadowBlur=0;ctx.restore();
  }
}

class ThrowSword {
  constructor(x,y,vx,owner){
    this.x=x;this.y=y;this.vx=vx;this.vy=0;
    this.owner=owner;this.dead=false;
    this.ox=x;this.oy=y;this.rot=0;
    this.dmg=14;this.kb=14;this.maxDist=380;
  }
  get dist(){return Math.hypot(this.x-this.ox,this.y-this.oy);}
  update(players){
    if(this.dead)return;
    this.x+=this.vx;this.rot+=0.22;
    if(this.dist>this.maxDist||this.x<-80||this.x>W+80){this.dead=true;return;}
    for(const p of G.players){
      if(p===this.owner||sameTeam(p,this.owner)||p.dead)continue;
      if(p.shieldActive){
        if(this.x>p.x-12&&this.x<p.right+12&&this.y>p.y-12&&this.y<p.bottom+12){addHitParticles(this.x,this.y,'#aaddff',false);this.dead=true;return;}
        continue;
      }
      if(this.x>p.x-8&&this.x<p.right+8&&this.y>p.y-6&&this.y<p.bottom+6){
        if(p.damage>=DEATH_THRESHOLD&&!p.isDummy){instakill(p,this.x,this.y);this.dead=true;return;}
        p.damage+=Math.round(this.dmg*(p.ch.def??1));p.hitFlash=14;p.charging=false;p.chargeTime=0;
        const km=kbScale(p.damage),kb=this.kb*km/p.ch.weight;
        p.vx=this.vx>0?kb:-kb;p.vy=-kb*0.2;
        p.vx=Math.max(-MAX_KB,Math.min(MAX_KB,p.vx));p.vy=Math.max(-MAX_KB,Math.min(MAX_KB,p.vy));
        p.hstun=Math.min(55,Math.floor(8+kb*2.2));
        p.onGnd=false;p.onPlat=false;p.hitlag=5;this.owner.hitlag=0;
        addHitParticles(this.x,this.y,this.owner.ch.color,true);
        G.shakeX+=(Math.random()-.5)*10;this.dead=true;return;
      }
    }
  }
  draw(){
    if(this.dead)return;
    const ch=this.owner.ch;
    ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.rot);
    ctx.shadowBlur=18;ctx.shadowColor=ch.eyeCol;
    ctx.fillStyle=ch.hi;ctx.beginPath();ctx.moveTo(24,0);ctx.lineTo(-8,-4);ctx.lineTo(-8,4);ctx.closePath();ctx.fill();
    ctx.globalAlpha=0.7;ctx.fillStyle=ch.hi;ctx.beginPath();ctx.moveTo(-8,-2);ctx.lineTo(-15,-5);ctx.lineTo(-15,5);ctx.lineTo(-8,2);ctx.closePath();ctx.fill();
    ctx.globalAlpha=1;ctx.fillStyle=ch.accent;ctx.fillRect(-11,-6,5,12);
    ctx.shadowBlur=0;ctx.restore();
  }
}

export { FirePebble, Knife, ThrowSword, knives, throwSwords, firePebbles };
