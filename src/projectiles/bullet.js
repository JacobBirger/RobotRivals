import { H, W, bullets, ctx, particles, sameTeam } from '../globals.js';
import { G } from '../globals.js';
;
;
import { addHitParticles, instakill } from '../particles.js';
import { MAX_KB, DEATH_THRESHOLD, VIS_LEFT, VIS_RIGHT, VIS_TOP, VIS_BOT } from '../player/constants.js';
import { kbScale, playSfx } from '../audio.js';

class Bullet {
  constructor(x,y,vx,vy,owner,heavy) {
    this.x=x; this.y=y; this.vx=vx; this.vy=vy;
    this.owner=owner; this.heavy=heavy;
    this.ox=x; this.oy=y; this.dead=false;
    this.dmg=heavy?8:4; this.kb=heavy?6:4;
    this.maxDist=heavy?(owner.ch.heavyBulletRange||300):(owner.ch.lightBulletRange||240);
    this.size=1;
  }
  get dist() { return Math.hypot(this.x-this.ox,this.y-this.oy); }
  update(players) {
    if (this.dead) return;
    this.x+=this.vx; this.y+=this.vy;
    if (this.dist>this.maxDist||this.x<VIS_LEFT-50||this.x>VIS_RIGHT+50||this.y<VIS_TOP-50||this.y>VIS_BOT+50) { this.dead=true; return; }
    const bLen=(this.heavy?15:this.wide?12:9)*this.size, bWid=(this.heavy?5:this.wide?5:3)*this.size;
    for (const p of G.players) {
      if (p===this.owner||sameTeam(p,this.owner)||p.dead) continue;
      if(p.laserShieldActive){
        if(this.x+bLen>p.x-10&&this.x-bLen<p.right+10&&this.y+bWid>p.y-10&&this.y-bWid<p.bottom+10){
          this.owner.damage+=Math.round(this.dmg*(this.owner.ch.def??1));
          this.owner.hitFlash=12; addHitParticles(this.x,this.y,'#00ffff',false);
          this.dead=true; return;
        }
        continue;
      }
      if (p.shieldActive) {
        if (this.x+bLen>p.x-10&&this.x-bLen<p.right+10&&this.y+bWid>p.y-10&&this.y-bWid<p.bottom+10) {
          addHitParticles(this.x,this.y,'#aaddff',false); G.shakeX+=(Math.random()-.5)*4; this.dead=true; return;
        }
        continue;
      }
      if(sameTeam(p,this.owner)) continue;
      if (this.x+bLen>p.x&&this.x-bLen<p.right&&this.y+bWid>p.y&&this.y-bWid<p.bottom) {
        if(p.damage>=DEATH_THRESHOLD&&!p.isDummy){instakill(p,this.x,this.y);this.dead=true;return;}
        p.damage+=Math.round(this.dmg*(p.ch.def??1)); p.hitFlash=14; p.charging=false; p.chargeTime=0;
        const km=kbScale(p.damage), kb=this.kb*km/p.ch.weight;
        p.vx=this.vx>0?kb:-kb; p.vy=-kb*0.08;
        p.vx=Math.max(-MAX_KB,Math.min(MAX_KB,p.vx)); p.vy=Math.max(-MAX_KB,Math.min(MAX_KB,p.vy));
        if(this.heavy) p.hstun=Math.min(35,Math.floor(5+kb*1.5));
        p.onGnd=false; p.onPlat=false; p.hitlag=3; this.owner.hitlag=0;
        addHitParticles(this.x,this.y,this.owner.ch.color,this.heavy);
        G.shakeX+=(Math.random()-.5)*(this.heavy?8:4); this.dead=true; return;
      }
    }
  }
  draw() {
    if (this.dead) return;
    const fade=Math.max(0.1,1-this.dist/this.maxDist);
    const ang=Math.atan2(this.vy,this.vx);
    ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(ang); ctx.globalAlpha=fade;
    const len=(this.heavy?15:this.wide?12:9)*this.size, wid=(this.heavy?5:this.wide?5:3)*this.size;
    ctx.shadowBlur=this.heavy?22:14; ctx.shadowColor=this.owner.ch.eyeCol;
    ctx.fillStyle=this.owner.ch.eyeCol;
    ctx.beginPath(); ctx.ellipse(0,0,len*0.7,wid*0.7,0,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0; ctx.fillStyle=this.owner.ch.color;
    ctx.beginPath(); ctx.ellipse(0,0,len,wid,0,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=fade*0.3; ctx.fillStyle=this.owner.ch.color;
    ctx.beginPath(); ctx.ellipse(-len*1.3,0,len*1.6,wid*0.5,0,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
}

export { Bullet };
