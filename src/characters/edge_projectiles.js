import { H, W, ctx, miniSwords, particles, rrFill, sameTeam } from '../globals.js';
import { G } from '../globals.js';
;
;
import { addHitParticles, instakill } from '../particles.js';
import { MAX_KB, DEATH_THRESHOLD, VIS_LEFT, VIS_RIGHT, VIS_TOP, VIS_BOT } from '../player/constants.js';
import { kbScale, playSfx } from '../audio.js';

class MiniSword {
  constructor(x,y,owner){
    this.x=x; this.y=y; this.vx=0; this.vy=-16;
    this.owner=owner; this.dead=false;
    this.rising=true; this.onGround=false; this.groundTimer=0;
    this.dmg=7; this.kb=9;
  }
  update(players,stage){
    if(this.dead)return;
    if(!this.onGround){
      this.vy=Math.min(this.vy+0.595,16); // projectile gravity (independent of flight mode)
      this.y+=this.vy; this.x+=this.vx;
      this.rising=this.vy<0;
      const g=stage.ground;
      if(this.y+24>=g.y&&this.x+8>g.x&&this.x<g.x+g.w){
        this.y=g.y-24; this.onGround=true; this.groundTimer=30; this.rising=false;
      }
      for(const pl of stage.plats){
        if(!this.onGround&&this.vy>0&&this.x+8>pl.x&&this.x<pl.x+pl.w){
          const prev=this.y+24-this.vy;
          if(prev<=pl.y+4&&this.y+24>=pl.y){this.y=pl.y-24;this.onGround=true;this.groundTimer=30;this.rising=false;}
        }
      }
      for(const sg of (stage.grounds||[])){
        if(!this.onGround&&this.x+8>sg.x&&this.x<sg.x+sg.w&&this.y+24>=sg.y&&this.y+24<=sg.y+sg.h+Math.abs(this.vy)+2){
          this.y=sg.y-24;this.onGround=true;this.groundTimer=30;this.rising=false;
        }
      }
    } else {
      this.groundTimer--;
      if(this.groundTimer<=0){this.dead=true;return;}
    }
    for(const p of G.players){
      if(p===this.owner||sameTeam(p,this.owner)||p.dead||p.hitlag>0)continue;
      if(this.x<p.right&&this.x+8>p.x&&this.y<p.bottom&&this.y+24>p.y){
        if(p.damage>=DEATH_THRESHOLD&&!p.isDummy){instakill(p,this.x+4,this.y+12);this.dead=true;return;}
        p.damage+=Math.round(this.dmg*(p.ch.def??1)); p.hitFlash=14; p.charging=false; p.chargeTime=0;
        const km=kbScale(p.damage), kb=this.kb*km/p.ch.weight;
        if(!this.rising){p.vx=this.owner.facing*kb*0.5;p.vy=kb*0.6;}
        else{p.vx=this.owner.facing*kb*0.4;p.vy=-kb*0.8;}
        p.vx=Math.max(-MAX_KB,Math.min(MAX_KB,p.vx));
        p.vy=Math.max(-MAX_KB,Math.min(MAX_KB,p.vy));
        p.hstun=Math.min(50,Math.floor(8+kb*2));
        p.onGnd=false;p.onPlat=false;p.hitlag=4;
        addHitParticles(this.x+4,this.y+12,this.owner.ch.color,true);
        this.dead=true;return;
      }
    }
  }
  draw(){
    if(this.dead)return;
    const ch=this.owner.ch;
    const alpha=this.onGround?Math.max(0.25,this.groundTimer/30):1;
    ctx.save();ctx.globalAlpha=alpha;
    ctx.translate(this.x+4,this.y+12);
    ctx.rotate(this.onGround?0:this.rising?-Math.PI*0.5:Math.PI*0.5);
    ctx.strokeStyle=ch.eyeCol;ctx.lineWidth=3;ctx.lineCap='round';
    ctx.shadowBlur=14;ctx.shadowColor=ch.eyeCol;
    ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(0,14);ctx.stroke();
    ctx.strokeStyle=ch.accent;ctx.lineWidth=5;
    ctx.beginPath();ctx.moveTo(-6,-10);ctx.lineTo(6,-10);ctx.stroke();
    ctx.fillStyle=ch.eyeCol;ctx.shadowBlur=0;
    ctx.beginPath();ctx.moveTo(-3,12);ctx.lineTo(3,12);ctx.lineTo(0,18);ctx.closePath();ctx.fill();
    ctx.restore();
  }
}

export { MiniSword, miniSwords };
