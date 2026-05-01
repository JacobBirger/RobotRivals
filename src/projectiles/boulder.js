import { H, W, ctx, particles, rrFill, smallRocks } from '../globals.js';
import { G } from '../globals.js';
;
;
import { addDeathExplosion, addHitParticles } from '../particles.js';
import { BOULDER_RADIUS, SMALL_ROCK_RADIUS } from '../player/constants.js';
import { SmallRock } from './smallrock.js';

class Boulder {
  constructor(x,y){
    this.x=x; this.y=y; this.r=BOULDER_RADIUS; this.dead=false;
    this.bobT=Math.random()*Math.PI*2;
    this.rotT=0;
    this.pulseT=0;
    this.outline=[];
    for(let i=0;i<14;i++){
      const a=(i/14)*Math.PI*2;
      const rr=this.r*(0.85+Math.random()*0.25);
      this.outline.push([Math.cos(a)*rr,Math.sin(a)*rr]);
    }
    this.cracks=[];
    for(let i=0;i<5;i++){
      const a=Math.random()*Math.PI*2;
      const r1=this.r*0.15+Math.random()*this.r*0.2;
      const r2=this.r*0.55+Math.random()*this.r*0.3;
      this.cracks.push([Math.cos(a)*r1,Math.sin(a)*r1,Math.cos(a)*r2,Math.sin(a)*r2]);
    }
  }
  // Per-stage visual config
  get theme(){
    const id=G.curStage?G.curStage.id:0;
    switch(id){
      case 0: return { // THE FOUNDRY — molten iron ore
        fill:['#5a3018','#8a4820','#c06020'], stroke:'#3a1808',
        glow:'rgba(255,100,20,0.5)', crackCol:'rgba(255,140,30,0.9)',
        hlCol:'rgba(255,180,80,0.45)', specks:'#ff6622',
        dustCols:['#ff6622','#cc3300','#ff9944','#aa2200'], label:'SLAG CORE' };
      case 1: return { // ORBITAL STATION — asteroid
        fill:['#2a2a35','#404055','#1a1a28'], stroke:'#080812',
        glow:'rgba(80,120,255,0.35)', crackCol:'rgba(150,180,255,0.6)',
        hlCol:'rgba(180,200,255,0.3)', specks:'#6688cc',
        dustCols:['#334466','#5566aa','#223355','#8899cc'], label:'ASTEROID' };
      case 2: return { // SCRAPYARD — rusted metal chunk
        fill:['#5a2a10','#7a3a18','#3a1808'], stroke:'#1a0800',
        glow:'rgba(180,80,20,0.4)', crackCol:'rgba(100,180,80,0.7)',
        hlCol:'rgba(200,120,60,0.4)', specks:'#44aa22',
        dustCols:['#7a3a10','#aa5522','#3a6618','#884422'], label:'SCRAP HEAP' };
      case 3: return { // NEON CITY — neon crystal
        fill:['#1a0a28','#2a1040','#0d0820'], stroke:'#0a0018',
        glow:'rgba(200,50,255,0.6)', crackCol:'rgba(255,80,255,0.95)',
        hlCol:'rgba(255,100,255,0.5)', specks:'#cc44ff',
        dustCols:['#cc00ff','#ff44cc','#8800cc','#ff88ff'], label:'NEON ORB' };
      case 4: return { // ARCTIC BASE — ice block
        fill:['#aaccee','#ddeeff','#7799bb'], stroke:'#446688',
        glow:'rgba(100,200,255,0.55)', crackCol:'rgba(180,230,255,0.85)',
        hlCol:'rgba(255,255,255,0.6)', specks:'#88ccff',
        dustCols:['#aaddff','#ddeeff','#88ccee','#ffffff'], label:'ICE BLOCK' };
      case 5: return { // CLOUD TEMPLE — storm cloud core
        fill:['#c8d8ee','#e8eeff','#a8b8cc'], stroke:'#8898aa',
        glow:'rgba(180,200,255,0.5)', crackCol:'rgba(100,140,255,0.7)',
        hlCol:'rgba(255,255,255,0.7)', specks:'#aabbdd',
        dustCols:['#ddeeff','#ffffff','#aaccee','#8899bb'], label:'STORM ORB' };
      case 6: return { // MOLTEN CORE — lava bomb
        fill:['#1a0800','#2d0a00','#0d0400'], stroke:'#080200',
        glow:'rgba(255,80,0,0.7)', crackCol:'rgba(255,160,0,1.0)',
        hlCol:'rgba(255,100,20,0.55)', specks:'#ff4400',
        dustCols:['#ff4400','#ff8800','#cc2200','#ffaa00'], label:'LAVA BOMB' };
      case 7: return { // DATA REALM — glitch cube
        fill:['#001800','#003300','#001200'], stroke:'#004400',
        glow:'rgba(0,255,80,0.55)', crackCol:'rgba(0,255,100,1.0)',
        hlCol:'rgba(80,255,100,0.5)', specks:'#00ff44',
        dustCols:['#00ff44','#00cc33','#44ff88','#008822'], label:'DATA CORE' };
      case 8: return { // THE CARNIVAL — iron cannonball
        fill:['#2a2a2a','#3a3a3a','#1a1a1a'], stroke:'#080808',
        glow:'rgba(255,200,50,0.4)', crackCol:'rgba(255,220,80,0.8)',
        hlCol:'rgba(255,240,100,0.4)', specks:'#ffaa00',
        dustCols:['#ff4488','#ffaa00','#44ccff','#ff6622'], label:'CANNONBALL' };
      case 9: return { // THE JUNGLE — mossy ancient stone
        fill:['#2a3a18','#1e2e10','#384a22'], stroke:'#0e1808',
        glow:'rgba(80,180,40,0.45)', crackCol:'rgba(100,220,60,0.75)',
        hlCol:'rgba(160,220,80,0.4)', specks:'#66cc22',
        dustCols:['#448822','#336611','#66aa33','#55bb22'], label:'RUIN STONE' };
      case 10: return { // SKY TEMPLE — golden relic
        fill:['#6a4800','#9a6c10','#4a3200'], stroke:'#2a1800',
        glow:'rgba(255,200,50,0.6)', crackCol:'rgba(255,230,100,0.95)',
        hlCol:'rgba(255,240,160,0.55)', specks:'#ffcc44',
        dustCols:['#ffcc44','#ff9900','#ffee88','#cc7700'], label:'RELIC ORB' };
      case 11: return { // NEO CITY — chrome tech sphere
        fill:['#a0b8c8','#c8dde8','#6a8898'], stroke:'#334455',
        glow:'rgba(0,220,255,0.55)', crackCol:'rgba(0,230,255,0.9)',
        hlCol:'rgba(200,240,255,0.6)', specks:'#00ddff',
        dustCols:['#00ddff','#0099cc','#44eeff','#006688'], label:'TECH SPHERE' };
      default: return {
        fill:['#9a8060','#6d543a','#3a2a1a'], stroke:'#2a1a0a',
        glow:'rgba(40,28,18,0.45)', crackCol:'rgba(20,12,5,0.7)',
        hlCol:'rgba(220,200,170,0.35)', specks:'#2a1a0a',
        dustCols:['#7a5a3a','#8a6a4a','#5a4a2a','#aa8855'], label:'BOULDER' };
    }
  }
  get rect(){return {x:this.x-this.r, y:this.y-this.r+Math.sin(this.bobT)*4, w:this.r*2, h:this.r*2};}
  intersectsRect(rx,ry,rw,rh){
    const cx=Math.max(rx,Math.min(this.x,rx+rw));
    const cy=Math.max(ry,Math.min(this.y+Math.sin(this.bobT)*4,ry+rh));
    const dx=cx-this.x, dy=cy-(this.y+Math.sin(this.bobT)*4);
    return dx*dx+dy*dy <= this.r*this.r;
  }
  update(){
    if(this.dead) return;
    this.bobT+=0.018;
    this.rotT+=0.003;
    this.pulseT+=0.04;
  }
  shatter(){
    if(this.dead) return;
    this.dead=true;
    const t=this.theme;
    for(let i=0;i<5;i++){
      const a=(i/5)*Math.PI*2 + Math.random()*0.4;
      const sp=2.5+Math.random()*2.0;
      smallRocks.push(new SmallRock(this.x+Math.cos(a)*30, this.y+Math.sin(a)*30, Math.cos(a)*sp, Math.sin(a)*sp));
    }
    addDeathExplosion(this.x,this.y);
    for(let i=0;i<22;i++){
      const a=Math.random()*Math.PI*2,sp=4+Math.random()*8;
      const col=t.dustCols[Math.floor(Math.random()*t.dustCols.length)];
      particles.push({x:this.x,y:this.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:40,max:40,col,sz:3+Math.random()*5});
    }
  }
  draw(){
    if(this.dead) return;
    const t=this.theme;
    const bob=Math.sin(this.bobT)*4;
    const cy=this.y+bob;
    const pulse=Math.sin(this.pulseT)*0.15+0.85; // 0.7–1.0 oscillation
    ctx.save();
    ctx.translate(this.x,cy);
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.3)';
    ctx.beginPath();ctx.ellipse(0,this.r+12,this.r*0.85,10,0,0,Math.PI*2);ctx.fill();
    // Themed outer glow — pulses with stage energy
    const aura=ctx.createRadialGradient(0,0,this.r*0.5,0,0,this.r*1.5);
    aura.addColorStop(0,'rgba(0,0,0,0)');
    aura.addColorStop(0.7,'rgba(0,0,0,0)');
    aura.addColorStop(1,t.glow);
    ctx.globalAlpha=pulse;
    ctx.fillStyle=aura;ctx.beginPath();ctx.arc(0,0,this.r*1.5,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
    ctx.rotate(this.rotT);
    // Body polygon
    ctx.beginPath();
    for(let i=0;i<this.outline.length;i++){
      const [px,py]=this.outline[i];
      if(i===0)ctx.moveTo(px,py); else ctx.lineTo(px,py);
    }
    ctx.closePath();
    const g=ctx.createRadialGradient(-this.r*0.3,-this.r*0.3,this.r*0.1,0,0,this.r*1.1);
    g.addColorStop(0,t.fill[0]);
    g.addColorStop(0.5,t.fill[1]);
    g.addColorStop(1,t.fill[2]);
    ctx.fillStyle=g;ctx.fill();
    ctx.strokeStyle=t.stroke;ctx.lineWidth=2.5;ctx.stroke();
    // Highlight
    ctx.fillStyle=t.hlCol;
    ctx.beginPath();ctx.ellipse(-this.r*0.25,-this.r*0.4,this.r*0.4,this.r*0.18,-0.4,0,Math.PI*2);ctx.fill();
    // Themed crack lines — glow on lava/neon/data stages
    ctx.strokeStyle=t.crackCol;ctx.lineWidth=2;ctx.lineCap='round';
    // Extra crack glow on high-energy stages
    const glowCracks=[0,3,6,7,10,11].includes(G.curStage?G.curStage.id:0);
    if(glowCracks){ctx.shadowColor=t.crackCol;ctx.shadowBlur=6;}
    for(const [x1,y1,x2,y2] of this.cracks){
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
    }
    ctx.shadowBlur=0;
    // Specks / surface detail
    ctx.fillStyle=t.specks;
    for(let i=0;i<6;i++){
      const a=i*1.7+this.rotT*2;
      const r=this.r*0.55+Math.sin(i*3.1)*this.r*0.25;
      ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r,2,0,Math.PI*2);ctx.fill();
    }
    // Stage-specific extras drawn in local (rotated) space
    const sid=G.curStage?G.curStage.id:0;
    if(sid===7){
      // DATA REALM: scan lines across sphere
      ctx.strokeStyle='rgba(0,255,80,0.25)';ctx.lineWidth=1;
      for(let i=-3;i<=3;i++){
        const yy=i*this.r*0.28;
        const hw=Math.sqrt(Math.max(0,this.r*this.r-yy*yy))*0.9;
        ctx.beginPath();ctx.moveTo(-hw,yy);ctx.lineTo(hw,yy);ctx.stroke();
      }
    } else if(sid===4){
      // ARCTIC: inner ice crystal lines
      ctx.strokeStyle='rgba(200,235,255,0.4)';ctx.lineWidth=1.5;
      for(let i=0;i<4;i++){
        const a=i*Math.PI/4;
        ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*this.r*0.7,Math.sin(a)*this.r*0.7);ctx.stroke();
      }
    } else if(sid===6){
      // MOLTEN CORE: pulsing inner lava glow
      ctx.globalAlpha=(Math.sin(this.pulseT*2)*0.2+0.35);
      const lavaG=ctx.createRadialGradient(0,0,0,0,0,this.r*0.65);
      lavaG.addColorStop(0,'rgba(255,160,0,0.9)');
      lavaG.addColorStop(1,'rgba(200,40,0,0)');
      ctx.fillStyle=lavaG;ctx.beginPath();ctx.arc(0,0,this.r*0.65,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;
    } else if(sid===8){
      // CARNIVAL: painted ring stripe
      ctx.strokeStyle='rgba(255,200,50,0.5)';ctx.lineWidth=4;
      ctx.beginPath();ctx.arc(0,0,this.r*0.6,0,Math.PI*2);ctx.stroke();
    } else if(sid===11){
      // NEO CITY: holographic equator ring
      ctx.strokeStyle='rgba(0,230,255,0.6)';ctx.lineWidth=3;
      ctx.beginPath();ctx.ellipse(0,0,this.r*0.95,this.r*0.22,0,0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
    // Label underneath (world G.frame, unrotated)
    ctx.save();
    ctx.translate(this.x,cy+this.r+24);
    ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=t.specks;ctx.globalAlpha=0.7;
    ctx.fillText(t.label,0,0);
    ctx.globalAlpha=1;ctx.restore();
  }
}

export { Boulder };
