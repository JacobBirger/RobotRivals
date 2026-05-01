import { ctx, W, H } from '../globals.js';
import { G } from '../globals.js';
import { rrFill, rrStroke, rrPath } from '../particles.js';
import { VIS_LEFT, VIS_RIGHT, VIS_TOP, VIS_BOT } from '../player/constants.js';

function drawStageBG(st){
  const gr=ctx.createLinearGradient(0,-60,0,H+60);gr.addColorStop(0,st.bgT);gr.addColorStop(1,st.bgB);ctx.fillStyle=gr;ctx.fillRect(-230,-40,W+460,H+80);
  if(st.id===0){
    // THE FOUNDRY — molten skybox with fire columns, distant smokestacks, drifting embers
    // Distant smokestacks (parallax)
    ctx.fillStyle='rgba(40,18,8,0.95)';
    const stacks=[[80,560],[180,490],[820,520],[920,560]];
    for(const [sx,sh] of stacks){ctx.fillRect(sx-22,H-sh,44,sh); ctx.fillRect(sx-26,H-sh-8,52,10);}
    // Smoke plumes from stacks
    for(let i=0;i<3;i++){
      const sxs=[80,180,820,920],sx=sxs[i%4];
      for(let k=0;k<5;k++){
        const py=(G.frame*0.6+k*60+i*30)%500;
        const a=(1-py/500)*0.25;
        const r=18+k*4;
        ctx.fillStyle=`rgba(60,30,15,${a})`;
        ctx.beginPath();ctx.arc(sx+Math.sin(G.frame*0.02+k)*8,H-580+py,r,0,Math.PI*2);ctx.fill();
      }
    }
    // Massive central forge glow (radial pulse)
    const pulse=Math.sin(G.frame*0.04)*0.1+0.55;
    const glow=ctx.createRadialGradient(W/2,H+80,40,W/2,H+80,540);
    glow.addColorStop(0,`rgba(255,160,40,${pulse})`);
    glow.addColorStop(0.45,'rgba(255,80,0,0.32)');
    glow.addColorStop(1,'rgba(180,20,0,0)');
    ctx.fillStyle=glow;ctx.fillRect(VIS_LEFT,VIS_TOP,VIS_RIGHT-VIS_LEFT,VIS_BOT-VIS_TOP);
    // Vertical heat shimmer columns
    for(let i=0;i<5;i++){
      const cx=120+i*180+Math.sin(G.frame*0.03+i)*8;
      const colG=ctx.createLinearGradient(cx,H,cx,0);
      colG.addColorStop(0,'rgba(255,150,40,0.18)');
      colG.addColorStop(1,'rgba(255,150,40,0)');
      ctx.fillStyle=colG;ctx.fillRect(cx-10,0,20,H);
    }
    // Drifting ember particles (full screen)
    for(let i=0;i<55;i++){
      const ex=(i*173+G.frame*1.3+Math.sin(G.frame*0.04+i)*30)%W;
      const ey=H-((G.frame*1.6+i*89)%(H+100));
      const ef=Math.max(0,1-ey/H);
      ctx.fillStyle=`rgba(255,${100+ef*150},${20+ef*40},${ef*0.85})`;
      ctx.shadowBlur=5;ctx.shadowColor='#ff7700';
      ctx.beginPath();ctx.arc(ex,ey,1+ef*2.5,0,Math.PI*2);ctx.fill();
    }
    ctx.shadowBlur=0;
    // Background giant rotating gears
    drawGear(80,140,52,'#3a1a08','#5a2a12');drawGear(920,180,46,'#3a1a08','#5a2a12');drawGear(160,440,38,'#2a1208','#4a2010');
  } else if(st.id===1){
    // ORBITAL STATION — rich starfield, planet, nebulae, drifting satellites
    // Deep nebula clouds
    for(let i=0;i<3;i++){
      const ng=ctx.createRadialGradient(200+i*350,200+i*60,30,200+i*350,200+i*60,260);
      const cols=[['rgba(80,40,160,0.18)','rgba(80,40,160,0)'],['rgba(40,80,180,0.15)','rgba(40,80,180,0)'],['rgba(160,40,120,0.16)','rgba(160,40,120,0)']];
      ng.addColorStop(0,cols[i][0]);ng.addColorStop(1,cols[i][1]);
      ctx.fillStyle=ng;ctx.fillRect(VIS_LEFT,VIS_TOP,VIS_RIGHT-VIS_LEFT,VIS_BOT-VIS_TOP);
    }
    // Dense starfield with parallax (multiple layers)
    for(let i=0;i<140;i++){
      const sx=(i*137+60+G.frame*0.05)%W;
      const sy=(i*89+40)%H;
      const blink=Math.sin(G.frame*0.04+i)*0.4+0.6;
      const sz=i%7===0?2.5:i%3===0?1.5:0.8;
      ctx.fillStyle=`rgba(255,255,255,${(blink*0.85).toFixed(2)})`;
      ctx.beginPath();ctx.arc(sx,sy,sz,0,Math.PI*2);ctx.fill();
    }
    // Bright pulsar stars
    for(let i=0;i<6;i++){
      const sx=(i*171+90)%W,sy=(i*53+50)%(H*0.85);
      const pulse=Math.sin(G.frame*0.08+i*1.3)*0.4+0.6;
      ctx.fillStyle=`rgba(180,220,255,${pulse})`;ctx.shadowBlur=14;ctx.shadowColor='#88bbff';
      ctx.beginPath();ctx.arc(sx,sy,2.5,0,Math.PI*2);ctx.fill();
    }
    ctx.shadowBlur=0;
    // Large planet (bottom-left, slowly rotating bands)
    const px=160,py=H-90;
    const pg=ctx.createRadialGradient(px-40,py-40,10,px,py,160);
    pg.addColorStop(0,'#88aaff');pg.addColorStop(0.5,'#3355bb');pg.addColorStop(0.9,'#112266');pg.addColorStop(1,'#001144');
    ctx.fillStyle=pg;ctx.beginPath();ctx.arc(px,py,160,0,Math.PI*2);ctx.fill();
    // Planet bands
    ctx.save();ctx.beginPath();ctx.arc(px,py,160,0,Math.PI*2);ctx.clip();
    ctx.strokeStyle='rgba(60,90,160,0.4)';ctx.lineWidth=8;
    for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(px,py-50+i*40,170,12,0.05+G.frame*0.0008,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
    // Planet ring
    ctx.strokeStyle='rgba(120,160,220,0.4)';ctx.lineWidth=10;
    ctx.beginPath();ctx.ellipse(px,py,210,40,0.35,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='rgba(180,200,240,0.2)';ctx.lineWidth=4;
    ctx.beginPath();ctx.ellipse(px,py,235,46,0.35,0,Math.PI*2);ctx.stroke();
    // Distant station silhouettes drifting
    ctx.fillStyle='rgba(50,70,110,0.55)';
    const sd=(G.frame*0.15)%1200-200;
    ctx.fillRect(sd,180,28,8); ctx.fillRect(sd+10,176,8,16); ctx.fillRect(sd-5,177,5,14);
    // Moving satellite with blinking light
    const satX=(G.frame*0.7)%1100-50;
    ctx.fillStyle='#aabbcc';ctx.fillRect(satX,90,16,4);
    ctx.fillStyle=Math.floor(G.frame/20)%2?'#ff4444':'#440000';ctx.beginPath();ctx.arc(satX+8,92,2,0,Math.PI*2);ctx.fill();
  } else if(st.id===2){
    // SCRAPYARD — toxic green sky, distant junk piles silhouettes, falling sparks
    // Toxic clouds (slow drift)
    for(let i=0;i<4;i++){
      const cx=(i*280+G.frame*0.18)%(W+200)-100;
      const cy=80+i*40;
      ctx.fillStyle=`rgba(${80+i*15},${110+i*10},${30+i*5},0.18)`;
      ctx.beginPath();ctx.ellipse(cx,cy,140,40,0,0,Math.PI*2);ctx.fill();
    }
    // Distant junk pile silhouettes (mountains of scrap)
    ctx.fillStyle='rgba(20,30,12,0.92)';
    ctx.beginPath();ctx.moveTo(0,H);
    ctx.lineTo(0,440);ctx.lineTo(60,400);ctx.lineTo(120,420);ctx.lineTo(180,360);ctx.lineTo(260,400);ctx.lineTo(320,380);ctx.lineTo(380,420);ctx.lineTo(450,390);ctx.lineTo(520,410);ctx.lineTo(600,370);ctx.lineTo(680,400);ctx.lineTo(760,380);ctx.lineTo(840,420);ctx.lineTo(920,400);ctx.lineTo(W,440);ctx.lineTo(W,H);ctx.closePath();ctx.fill();
    // Mid-distance jagged scrap silhouettes
    ctx.fillStyle='rgba(35,50,18,0.7)';
    ctx.beginPath();ctx.moveTo(0,H);
    for(let i=0;i<=10;i++){const x=i*100,y=300+Math.sin(i*1.7)*50;ctx.lineTo(x,y);}
    ctx.lineTo(W,H);ctx.closePath();ctx.fill();
    // Smoke fog rising
    const fog=ctx.createLinearGradient(0,200,0,H);fog.addColorStop(0,'rgba(40,65,25,0)');fog.addColorStop(1,'rgba(20,40,15,0.65)');ctx.fillStyle=fog;ctx.fillRect(VIS_LEFT,VIS_TOP,VIS_RIGHT-VIS_LEFT,VIS_BOT-VIS_TOP);
    // Falling sparks (welding particles)
    for(let i=0;i<22;i++){
      const sx=(i*191+30)%W;
      const sy=(G.frame*1.5+i*73)%H;
      ctx.fillStyle=`rgba(255,${180+(i%3)*30},80,0.85)`;
      ctx.shadowBlur=6;ctx.shadowColor='#ffaa44';
      ctx.beginPath();ctx.arc(sx,sy,1.2,0,Math.PI*2);ctx.fill();
    }
    ctx.shadowBlur=0;
    // Floating scrap debris specks
    for(let i=0;i<12;i++){const dx=(i*247+G.frame*0.4)%W,dy=(i*97+G.frame*0.5)%H;ctx.fillStyle='rgba(80,90,55,0.45)';ctx.fillRect(dx,dy,3,3);}
  } else if(st.id===3){
    // NEON CITY — heavy neon rain, parallax skyscrapers, holograms, lightning
    // Lightning flash (rare)
    if(Math.floor(G.frame/5)%140<2){ctx.fillStyle='rgba(180,140,255,0.18)';ctx.fillRect(VIS_LEFT,VIS_TOP,VIS_RIGHT-VIS_LEFT,VIS_BOT-VIS_TOP);}
    // Rain (multiple layers, faster front)
    ctx.strokeStyle='rgba(180,100,255,0.25)';ctx.lineWidth=1.5;
    for(let i=0;i<70;i++){const rx=(i*233+G.frame*4)%W,ry=(i*97+G.frame*5)%(H+30);ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-5,ry+22);ctx.stroke();}
    ctx.strokeStyle='rgba(140,80,220,0.12)';
    for(let i=0;i<40;i++){const rx=(i*333+G.frame*2.5)%W,ry=(i*123+G.frame*3)%H;ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-3,ry+15);ctx.stroke();}
    // Far parallax skyscrapers (distant haze)
    ctx.fillStyle='rgba(20,8,40,0.85)';
    const farB=[[40,400],[120,360],[210,420],[300,380],[400,440],[490,380],[580,420],[680,360],[780,400],[880,380]];
    for(const [bx,bh] of farB){ctx.fillRect(bx-10,H-bh,46,bh);}
    // Mid skyscrapers with neon trim
    ctx.fillStyle='rgba(10,4,30,0.95)';
    const midB=[[20,460,'#ff44ff'],[180,400,'#44ffff'],[420,500,'#ff66cc'],[680,440,'#44ddff'],[860,480,'#aa44ff']];
    for(const [bx,bh,col] of midB){
      ctx.fillRect(bx,H-bh,80,bh);
      // Neon trim
      ctx.shadowBlur=14;ctx.shadowColor=col;ctx.fillStyle=col;ctx.fillRect(bx,H-bh,80,3);
      ctx.fillRect(bx,H-bh+15,4,bh-15);ctx.fillRect(bx+76,H-bh+15,4,bh-15);
      ctx.shadowBlur=0;ctx.fillStyle='rgba(10,4,30,0.95)';
    }
    // Scrolling holograms (distant billboards floating mid-air)
    for(let i=0;i<3;i++){
      const hx=((G.frame*0.4+i*450)%(W+200))-100;
      const hy=120+i*100;
      const hcols=['#ff44ff','#44ffff','#ffff44'];
      ctx.fillStyle=`rgba(${i===0?255:i===1?68:255},${i===0?68:i===1?255:255},${i===0?255:i===1?255:68},0.2)`;
      ctx.fillRect(hx,hy,80,40);
      ctx.strokeStyle=hcols[i];ctx.lineWidth=1.5;ctx.shadowBlur=8;ctx.shadowColor=hcols[i];
      ctx.strokeRect(hx,hy,80,40);
      ctx.shadowBlur=0;
    }
    // Window grid lights on mid skyscrapers (blinking)
    for(let i=0;i<60;i++){
      const blink=Math.sin(G.frame*0.05+i*1.3)>0.3;if(!blink)continue;
      const wx=20+(i*23)%900,wy=200+(i*37)%280;
      const cols=['rgba(255,68,255,0.7)','rgba(68,255,255,0.7)','rgba(255,255,68,0.7)'];
      ctx.fillStyle=cols[i%3];ctx.fillRect(wx,wy,4,4);
    }
    // Bottom neon ground glow
    const gl=ctx.createLinearGradient(0,400,0,H);gl.addColorStop(0,'rgba(170,50,255,0)');gl.addColorStop(1,'rgba(170,50,255,0.32)');ctx.fillStyle=gl;ctx.fillRect(0,400,W,H-400);
  } else if(st.id===4){
    // ARCTIC BASE — heavy snow, aurora borealis, distant mountains
    // Aurora ribbons (slow shifting)
    for(let i=0;i<3;i++){
      const ag=ctx.createLinearGradient(0,0,0,H*0.6);
      const cols=[['rgba(80,255,180,0.22)','rgba(80,255,180,0)'],['rgba(160,120,255,0.18)','rgba(160,120,255,0)'],['rgba(80,200,255,0.16)','rgba(80,200,255,0)']];
      ag.addColorStop(0,cols[i][0]);ag.addColorStop(1,cols[i][1]);
      ctx.fillStyle=ag;
      ctx.beginPath();
      ctx.moveTo(-50,80+i*40);
      for(let x=0;x<=W+50;x+=20){
        const y=80+i*40+Math.sin(G.frame*0.012+x*0.008+i)*30;
        ctx.lineTo(x,y);
      }
      ctx.lineTo(W+50,260);ctx.lineTo(-50,260);ctx.closePath();ctx.fill();
    }
    // Stars peeking through
    for(let i=0;i<40;i++){const sx=(i*97+50)%W,sy=(i*73+10)%(H*0.45),blink=Math.sin(G.frame*0.05+i)*0.4+0.6;ctx.fillStyle=`rgba(220,240,255,${blink*0.7})`;ctx.beginPath();ctx.arc(sx,sy,i%4===0?1.5:0.8,0,Math.PI*2);ctx.fill();}
    // Distant snow mountains (parallax)
    ctx.fillStyle='rgba(40,70,100,0.7)';
    ctx.beginPath();ctx.moveTo(0,H);ctx.lineTo(0,420);ctx.lineTo(120,340);ctx.lineTo(220,400);ctx.lineTo(330,330);ctx.lineTo(450,390);ctx.lineTo(580,310);ctx.lineTo(700,380);ctx.lineTo(820,330);ctx.lineTo(920,390);ctx.lineTo(W,360);ctx.lineTo(W,H);ctx.closePath();ctx.fill();
    // Snow cap highlights
    ctx.fillStyle='rgba(220,240,255,0.5)';
    ctx.beginPath();ctx.moveTo(120,340);ctx.lineTo(140,360);ctx.lineTo(105,365);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(330,330);ctx.lineTo(355,355);ctx.lineTo(310,358);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(580,310);ctx.lineTo(605,335);ctx.lineTo(560,338);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(820,330);ctx.lineTo(840,355);ctx.lineTo(800,355);ctx.closePath();ctx.fill();
    // Heavy snowfall (multiple layers)
    for(let i=0;i<90;i++){
      const sx=(i*197+G.frame*1.2+Math.sin(G.frame*0.02+i)*15)%W;
      const sy=(i*113+G.frame*2.4)%H;
      const sz=i%5===0?3.5:i%2===0?2:1;
      ctx.fillStyle=`rgba(${220+(i%20)},${230+(i%15)},255,${0.6+(i%4)*0.1})`;
      ctx.beginPath();ctx.arc(sx,sy,sz,0,Math.PI*2);ctx.fill();
    }
    // Cold blue mist
    const mist=ctx.createLinearGradient(0,0,0,H);mist.addColorStop(0,'rgba(180,220,255,0.08)');mist.addColorStop(1,'rgba(80,140,200,0.18)');ctx.fillStyle=mist;ctx.fillRect(VIS_LEFT,VIS_TOP,VIS_RIGHT-VIS_LEFT,VIS_BOT-VIS_TOP);
  } else if(st.id===5){
    // CLOUD TEMPLE — bright sky, big sun rays, layered cumulus, distant temple silhouettes
    // Sun
    const sunG=ctx.createRadialGradient(820,100,15,820,100,260);
    sunG.addColorStop(0,'rgba(255,250,200,0.9)');sunG.addColorStop(0.5,'rgba(255,210,80,0.45)');sunG.addColorStop(1,'rgba(255,170,40,0)');
    ctx.fillStyle=sunG;ctx.fillRect(VIS_LEFT,VIS_TOP,VIS_RIGHT-VIS_LEFT,VIS_BOT-VIS_TOP);
    ctx.fillStyle='#ffeebb';ctx.beginPath();ctx.arc(820,100,30,0,Math.PI*2);ctx.fill();
    // Sun rays (rotating)
    ctx.save();ctx.translate(820,100);ctx.rotate(G.frame*0.005);
    ctx.strokeStyle='rgba(255,240,150,0.18)';ctx.lineWidth=4;ctx.lineCap='round';
    for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(Math.cos(a)*40,Math.sin(a)*40);ctx.lineTo(Math.cos(a)*180,Math.sin(a)*180);ctx.stroke();}
    ctx.restore();
    // Distant temple silhouettes (parallax very far)
    ctx.fillStyle='rgba(180,160,130,0.4)';
    const farTemples=[[80,180],[240,160],[460,200],[700,170],[920,190]];
    for(const [tx,th] of farTemples){
      ctx.fillRect(tx-15,H-th,30,th);
      ctx.beginPath();ctx.moveTo(tx-22,H-th);ctx.lineTo(tx,H-th-30);ctx.lineTo(tx+22,H-th);ctx.closePath();ctx.fill();
    }
    // Distant column rows
    ctx.fillStyle='rgba(200,180,140,0.35)';
    for(let i=0;i<6;i++)ctx.fillRect(80+i*160,360,16,200);
    // Layered drifting clouds (parallax 3 layers)
    const drawCloud=(x,y,s,alpha)=>{
      ctx.fillStyle=`rgba(255,255,255,${alpha})`;
      ctx.beginPath();ctx.arc(x,y,s*22,0,Math.PI*2);ctx.arc(x+s*28,y-s*8,s*18,0,Math.PI*2);ctx.arc(x+s*55,y,s*22,0,Math.PI*2);ctx.arc(x-s*22,y+s*4,s*16,0,Math.PI*2);ctx.fill();
    };
    // Far layer (slow)
    drawCloud((G.frame*0.12)%1300-150,80,1.6,0.5);
    drawCloud((G.frame*0.08+500)%1500-150,160,1.2,0.45);
    drawCloud((G.frame*0.1+900)%1500-150,60,1.4,0.5);
    // Mid layer (medium)
    drawCloud((G.frame*0.25)%1400-150,260,1.3,0.65);
    drawCloud((G.frame*0.18+700)%1600-150,340,1.5,0.6);
    // Close layer (fast, larger)
    drawCloud((G.frame*0.42)%1500-200,460,1.8,0.85);
    drawCloud((G.frame*0.38+800)%1700-200,520,2.0,0.8);
    // Floating petals/feathers
    for(let i=0;i<14;i++){
      const px=(i*239+G.frame*0.45)%W;
      const py=(i*131+G.frame*0.6)%H;
      const rot=Math.sin(G.frame*0.04+i)*0.8;
      ctx.save();ctx.translate(px,py);ctx.rotate(rot);
      ctx.fillStyle=`rgba(255,${220-i*4},${180-i*5},0.55)`;
      ctx.beginPath();ctx.ellipse(0,0,5,2.5,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
  } else if(st.id===6){
    // MOLTEN CORE — extreme lava, volcanic eruption, flying lava blobs, fire mist
    // Massive lava glow from below (pulsing)
    const lp=Math.sin(G.frame*0.06)*0.15+0.65;
    const lavaGlow=ctx.createRadialGradient(W/2,H+40,80,W/2,H+40,580);
    lavaGlow.addColorStop(0,`rgba(255,200,40,${lp})`);
    lavaGlow.addColorStop(0.4,'rgba(255,80,0,0.55)');
    lavaGlow.addColorStop(1,'rgba(180,20,0,0)');
    ctx.fillStyle=lavaGlow;ctx.fillRect(VIS_LEFT,VIS_TOP,VIS_RIGHT-VIS_LEFT,VIS_BOT-VIS_TOP);
    // Distant volcanic eruption silhouettes
    ctx.fillStyle='rgba(40,8,0,0.92)';
    ctx.beginPath();ctx.moveTo(0,H);ctx.lineTo(0,440);ctx.lineTo(150,360);ctx.lineTo(220,420);ctx.lineTo(380,300);ctx.lineTo(490,420);ctx.lineTo(620,330);ctx.lineTo(780,420);ctx.lineTo(900,370);ctx.lineTo(W,420);ctx.lineTo(W,H);ctx.closePath();ctx.fill();
    // Lava cracks glowing on mountains
    ctx.strokeStyle='rgba(255,140,30,0.7)';ctx.lineWidth=2;ctx.shadowBlur=10;ctx.shadowColor='#ff7700';
    ctx.beginPath();ctx.moveTo(140,400);ctx.lineTo(180,440);ctx.lineTo(150,520);ctx.stroke();
    ctx.beginPath();ctx.moveTo(380,340);ctx.lineTo(420,420);ctx.lineTo(390,520);ctx.stroke();
    ctx.beginPath();ctx.moveTo(620,360);ctx.lineTo(660,440);ctx.lineTo(640,520);ctx.stroke();
    ctx.beginPath();ctx.moveTo(890,400);ctx.lineTo(910,460);ctx.lineTo(880,520);ctx.stroke();
    ctx.shadowBlur=0;
    // Flying lava blobs (arcing trajectories)
    for(let i=0;i<6;i++){
      const t=(G.frame*1.2+i*120)%240;
      const tn=t/240;
      const startX=[160,420,680,180,460,720][i];
      const lx=startX+tn*60-30;
      const ly=H-100-Math.sin(tn*Math.PI)*200;
      ctx.fillStyle=`rgba(255,${120+tn*100},${20+tn*30},${0.85*(1-Math.abs(tn-0.5)*1.2)})`;
      ctx.shadowBlur=12;ctx.shadowColor='#ff5500';
      ctx.beginPath();ctx.arc(lx,ly,4+tn*3,0,Math.PI*2);ctx.fill();
      // Trail
      for(let k=1;k<5;k++){const tx=startX+(t-k*8)/240*60-30,ty=H-100-Math.sin((t-k*8)/240*Math.PI)*200;ctx.fillStyle=`rgba(255,${120+tn*100},20,${0.4*(1-k/5)})`;ctx.beginPath();ctx.arc(tx,ty,3,0,Math.PI*2);ctx.fill();}
    }
    ctx.shadowBlur=0;
    // Rising ember particles (lots, full screen)
    for(let i=0;i<60;i++){
      const ex=(i*173+G.frame*1.4)%W;
      const ey=H-((G.frame*2.2+i*89)%(H+80));
      const ef=Math.max(0,1-ey/H);
      ctx.fillStyle=`rgba(255,${100+ef*150},0,${ef*0.9})`;
      ctx.shadowBlur=4;ctx.shadowColor='#ff6600';
      ctx.beginPath();ctx.arc(ex,ey,1+ef*2.5,0,Math.PI*2);ctx.fill();
    }
    ctx.shadowBlur=0;
    // Heat haze
    const haze=ctx.createLinearGradient(0,H*0.3,0,H);haze.addColorStop(0,'rgba(255,80,0,0)');haze.addColorStop(1,'rgba(255,80,0,0.18)');ctx.fillStyle=haze;ctx.fillRect(0,H*0.3,W,H*0.7);
  } else if(st.id===7){
    // DATA REALM — heavy matrix rain, glowing grid, geometric pulses, glitch artifacts
    ctx.fillStyle='rgba(0,15,0,0.5)';ctx.fillRect(VIS_LEFT,VIS_TOP,VIS_RIGHT-VIS_LEFT,VIS_BOT-VIS_TOP);
    // Vertical matrix code rain (denser, layered)
    ctx.font='bold 12px monospace';
    for(let col=0;col<35;col++){
      const cx=col*30+5;
      const offset=(col*47)%200;
      for(let r=0;r<28;r++){
        const ry=((G.frame*1.5+r*22+offset)%(H+200))-50;
        if(ry<-20||ry>H+10) continue;
        const head=r===0;
        const fade=head?1:Math.max(0,1-r*0.06);
        const ch=Math.floor((G.frame*0.1+col*7+r*3))%10;
        ctx.fillStyle=head?`rgba(180,255,200,${fade})`:`rgba(0,${180+r*2},${50+r*3},${fade*0.85})`;
        if(head){ctx.shadowBlur=8;ctx.shadowColor='#88ff99';}
        ctx.fillText(ch,cx,ry);
        if(head)ctx.shadowBlur=0;
      }
    }
    // 3D-perspective glowing grid (floor/ceiling)
    ctx.strokeStyle='rgba(0,255,80,0.4)';ctx.lineWidth=1.5;
    // Horizontal lines (perspective)
    for(let i=0;i<10;i++){
      const t=i/10;
      const py=H-30-t*200;
      const sx=W/2*(1-t*0.7), ex=W-W/2*(1-t*0.7);
      ctx.globalAlpha=0.6-t*0.5;
      ctx.beginPath();ctx.moveTo(sx,py);ctx.lineTo(ex,py);ctx.stroke();
    }
    // Vertical perspective lines
    for(let i=-7;i<=7;i++){
      ctx.globalAlpha=0.4;
      ctx.beginPath();ctx.moveTo(W/2+i*60,H-30);ctx.lineTo(W/2+i*18,H-200);ctx.stroke();
    }
    ctx.globalAlpha=1;
    // Top mirror grid
    for(let i=0;i<8;i++){
      const t=i/8;
      const py=20+t*150;
      const sx=W/2*(1-t*0.7), ex=W-W/2*(1-t*0.7);
      ctx.strokeStyle=`rgba(0,255,80,${0.3-t*0.3})`;
      ctx.beginPath();ctx.moveTo(sx,py);ctx.lineTo(ex,py);ctx.stroke();
    }
    // Floating geometric wireframes (rotating)
    for(let i=0;i<5;i++){
      const cx=200+i*150,cy=180+Math.sin(G.frame*0.02+i)*40;
      const r=20+Math.sin(G.frame*0.04+i*1.3)*5;
      const rot=G.frame*0.03+i;
      ctx.strokeStyle=`rgba(0,255,150,${0.4+Math.sin(G.frame*0.05+i)*0.2})`;ctx.lineWidth=1.5;
      ctx.shadowBlur=8;ctx.shadowColor='#00ff88';
      ctx.beginPath();
      for(let k=0;k<6;k++){
        const a=rot+k*Math.PI/3;
        const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;
        if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.closePath();ctx.stroke();
      ctx.shadowBlur=0;
    }
    // Glitch bars (random horizontal slices)
    if(Math.floor(G.frame/3)%30===0){
      const gy=Math.floor(Math.random()*H);
      ctx.fillStyle='rgba(0,255,150,0.15)';
      ctx.fillRect(0,gy,W,4+Math.random()*8);
    }
    // Top horizon glow
    const dg=ctx.createLinearGradient(0,0,0,200);dg.addColorStop(0,'rgba(0,255,100,0.18)');dg.addColorStop(1,'rgba(0,255,100,0)');ctx.fillStyle=dg;ctx.fillRect(0,0,W,200);
  } else if(st.id===8){
    // THE CARNIVAL — dazzling night sky, fireworks, big ferris wheel silhouette, festive lights
    // Stars
    for(let i=0;i<110;i++){const sx=(i*197+30)%W,sy=(i*113+20)%H,blink=Math.sin(G.frame*0.05+i)*0.4+0.6;ctx.fillStyle=`rgba(255,255,255,${blink*0.85})`;ctx.beginPath();ctx.arc(sx,sy,i%5===0?2:1,0,Math.PI*2);ctx.fill();}
    // Big background ferris wheel silhouette (purely decorative now)
    const wcx=500,wcy=320,wr=200;
    const wAng=G.frame*0.004;
    ctx.strokeStyle='rgba(80,40,120,0.6)';ctx.lineWidth=4;
    ctx.beginPath();ctx.arc(wcx,wcy,wr,0,Math.PI*2);ctx.stroke();
    ctx.lineWidth=2;
    for(let i=0;i<12;i++){const a=wAng+i*Math.PI/6;ctx.beginPath();ctx.moveTo(wcx,wcy);ctx.lineTo(wcx+Math.cos(a)*wr,wcy+Math.sin(a)*wr);ctx.stroke();}
    // Lights on the wheel rim
    const bulbCols=['#ff3355','#ffdd00','#33ffaa','#3399ff','#ff88ff','#ffaa33'];
    for(let i=0;i<24;i++){
      const a=wAng+i*Math.PI/12;
      const bx=wcx+Math.cos(a)*wr,by=wcy+Math.sin(a)*wr;
      const blink=Math.sin(G.frame*0.1+i*0.5)>-0.3;
      if(blink){
        const c=bulbCols[i%6];
        ctx.fillStyle=c;ctx.shadowBlur=10;ctx.shadowColor=c;
        ctx.beginPath();ctx.arc(bx,by,3,0,Math.PI*2);ctx.fill();
      }
    }
    ctx.shadowBlur=0;
    // Ferris wheel hub
    ctx.fillStyle='#ffdd00';ctx.shadowBlur=14;ctx.shadowColor='#ffdd00';
    ctx.beginPath();ctx.arc(wcx,wcy,8,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
    // Distant tent silhouettes
    ctx.fillStyle='rgba(30,8,55,0.8)';
    ctx.beginPath();ctx.moveTo(0,H);ctx.lineTo(0,500);ctx.lineTo(60,440);ctx.lineTo(120,500);ctx.lineTo(120,H);ctx.fill();
    ctx.beginPath();ctx.moveTo(880,H);ctx.lineTo(880,500);ctx.lineTo(940,440);ctx.lineTo(1000,500);ctx.lineTo(1000,H);ctx.fill();
    // Fireworks (occasionally launch and explode)
    const fwCycle=(G.frame%180);
    if(fwCycle<60){
      const launchX=200+(Math.floor(G.frame/180)*173)%600;
      const launchY=H-fwCycle*7;
      ctx.fillStyle='#ffdd44';ctx.shadowBlur=8;ctx.shadowColor='#ffdd44';
      ctx.beginPath();ctx.arc(launchX,launchY,2,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
    } else if(fwCycle<150){
      const ex=200+(Math.floor(G.frame/180)*173)%600;
      const ey=H-60*7;
      const explodeT=(fwCycle-60)/90;
      const er=explodeT*120;
      const cols=['#ff3355','#ffdd00','#33ffaa','#3399ff','#ff88ff','#ffaa33'];
      const fwc=cols[Math.floor(G.frame/180)%6];
      ctx.strokeStyle=fwc;ctx.lineWidth=2;ctx.shadowBlur=12;ctx.shadowColor=fwc;
      for(let k=0;k<24;k++){
        const a=k*Math.PI/12;
        const px2=ex+Math.cos(a)*er;
        const py2=ey+Math.sin(a)*er;
        ctx.globalAlpha=Math.max(0,1-explodeT*1.4);
        ctx.beginPath();ctx.arc(px2,py2,2,0,Math.PI*2);ctx.stroke();
      }
      ctx.globalAlpha=1;ctx.shadowBlur=0;
    }
    // Festive light strings (top of screen, swaying)
    ctx.strokeStyle='rgba(120,80,40,0.5)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(0,40);
    for(let x=0;x<=W;x+=20){const dy=40+Math.sin(x*0.04+G.frame*0.02)*8;ctx.lineTo(x,dy);}
    ctx.stroke();
    const lcols=['#ff3355','#ffdd00','#33ffaa','#3399ff','#ff88ff'];
    for(let i=0;i<28;i++){const lx=15+i*36,ly=44+Math.sin(lx*0.04+G.frame*0.02)*8,blink=Math.sin(G.frame*0.12+i*1.1)>-0.3;if(blink){ctx.fillStyle=lcols[i%5];ctx.shadowBlur=10;ctx.shadowColor=lcols[i%5];ctx.beginPath();ctx.arc(lx,ly,3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}}
  } else if(st.id===9){
    // THE JUNGLE — dense canopy, parallax trees, vines, fireflies, sun rays piercing leaves
    // Top canopy darkness
    const canopy=ctx.createLinearGradient(0,0,0,300);canopy.addColorStop(0,'rgba(2,12,1,0.92)');canopy.addColorStop(1,'rgba(2,12,1,0)');ctx.fillStyle=canopy;ctx.fillRect(0,0,W,300);
    // Sun rays through canopy (god rays)
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(let i=0;i<6;i++){
      const sx=80+i*180+Math.sin(G.frame*0.012+i)*6;
      const rg=ctx.createLinearGradient(sx,0,sx-60,H);
      rg.addColorStop(0,'rgba(180,255,120,0.16)');
      rg.addColorStop(1,'rgba(180,255,120,0)');
      ctx.fillStyle=rg;
      ctx.beginPath();ctx.moveTo(sx-15,0);ctx.lineTo(sx+15,0);ctx.lineTo(sx-30,H);ctx.lineTo(sx-60,H);ctx.closePath();ctx.fill();
    }
    ctx.restore();
    // Far parallax tree silhouettes (very dark)
    ctx.fillStyle='rgba(3,15,2,0.95)';
    const farT=[[20,H],[120,H],[230,H],[340,H],[480,H],[600,H],[720,H],[840,H],[940,H]];
    const farHeights=[400,330,420,350,440,360,400,340,420];
    for(let i=0;i<farT.length;i++){
      const [tx,ty]=farT[i],th=farHeights[i],tw=50+i*3;
      ctx.fillRect(tx-tw/2,ty-th,tw,th);
      ctx.beginPath();ctx.ellipse(tx,ty-th,tw*0.95,60,0,0,Math.PI*2);ctx.fill();
    }
    // Mid parallax trees with subtle highlight
    ctx.fillStyle='rgba(8,30,5,0.85)';
    const midT=[[60,H,260,40],[280,H,300,46],[520,H,280,42],[760,H,320,44],[960,H,260,38]];
    for(const [tx,ty,th,tw] of midT){
      ctx.fillRect(tx-tw/2,ty-th,tw,th);
      ctx.beginPath();ctx.ellipse(tx,ty-th,tw*0.9,55,0,0,Math.PI*2);ctx.fill();
    }
    // Hanging vines from top (longer, more)
    ctx.strokeStyle='rgba(20,80,12,0.6)';ctx.lineWidth=2;ctx.lineCap='round';
    for(let i=0;i<14;i++){
      const vx=40+i*72,vlen=120+(i%5)*60;
      const sw=Math.sin(G.frame*0.018+i*0.9)*12;
      ctx.beginPath();ctx.moveTo(vx,0);ctx.bezierCurveTo(vx+sw*0.3,vlen*0.4,vx+sw,vlen*0.75,vx+sw*1.4,vlen);ctx.stroke();
    }
    // Floating leaves (drifting)
    for(let i=0;i<22;i++){
      const lx=(i*241+G.frame*0.55)%W;
      const ly=(i*131+G.frame*1.3)%H;
      const rot=Math.sin(G.frame*0.04+i)*0.7;
      ctx.save();ctx.translate(lx,ly);ctx.rotate(rot);
      ctx.fillStyle=`rgba(${30+i*7},${100+i*5},${10+i*2},0.55)`;
      ctx.beginPath();ctx.ellipse(0,0,6,3,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
    // Fireflies (bright, glowing, lots)
    for(let i=0;i<35;i++){
      const fx=(i*191+G.frame*0.5+Math.sin(G.frame*0.03+i)*20)%W;
      const fy=100+(i*97+G.frame*0.3)%(H-150);
      const pulse=Math.sin(G.frame*0.09+i*2.1)*0.5+0.5;
      ctx.fillStyle=`rgba(180,255,80,${pulse*0.85})`;
      ctx.shadowBlur=10;ctx.shadowColor='#aaff44';
      ctx.beginPath();ctx.arc(fx,fy,1.8,0,Math.PI*2);ctx.fill();
    }
    ctx.shadowBlur=0;
    // Bottom mist/fog
    const mist=ctx.createLinearGradient(0,H*0.6,0,H);mist.addColorStop(0,'rgba(15,50,8,0)');mist.addColorStop(1,'rgba(20,55,10,0.5)');ctx.fillStyle=mist;ctx.fillRect(0,H*0.6,W,H*0.4);
  } else if(st.id===10){
    // SKY TEMPLE — vast night sky, big moon, drifting clouds far below, distant temples
    // Dense starfield with depth
    for(let i=0;i<140;i++){const sx=(i*197+55)%W,sy=(i*89+15)%(H*0.95),blink=Math.sin(G.frame*0.045+i)*0.4+0.6;ctx.fillStyle=`rgba(255,255,255,${blink*0.9})`;ctx.beginPath();ctx.arc(sx,sy,i%5===0?2.5:i%2===0?1.5:0.8,0,Math.PI*2);ctx.fill();}
    // Shooting stars (occasional)
    for(let i=0;i<3;i++){
      const t=(G.frame*1.5+i*200)%600;
      if(t<60){
        const sx=W*0.2+i*200+t*8;
        const sy=80+i*40+t*4;
        ctx.strokeStyle=`rgba(255,255,255,${1-t/60})`;ctx.lineWidth=2;ctx.shadowBlur=8;ctx.shadowColor='#ffffff';
        ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx-30,sy-15);ctx.stroke();
        ctx.shadowBlur=0;
      }
    }
    // Big moon (much larger, more detail)
    const moonG=ctx.createRadialGradient(820,110,15,820,110,200);
    moonG.addColorStop(0,'rgba(255,248,210,0.55)');moonG.addColorStop(1,'rgba(255,248,210,0)');
    ctx.fillStyle=moonG;ctx.fillRect(VIS_LEFT,VIS_TOP,VIS_RIGHT-VIS_LEFT,VIS_BOT-VIS_TOP);
    ctx.fillStyle='#f5ecd0';ctx.beginPath();ctx.arc(820,110,48,0,Math.PI*2);ctx.fill();
    // Moon craters
    ctx.fillStyle='rgba(180,170,140,0.5)';
    [[805,95,7],[835,118,5],[815,128,4],[795,115,3],[838,98,4]].forEach(([cx,cy,cr])=>{ctx.beginPath();ctx.arc(cx,cy,cr,0,Math.PI*2);ctx.fill();});
    // Distant floating temple silhouettes (larger, more dramatic)
    ctx.fillStyle='rgba(8,6,22,0.88)';
    const temples=[[100,460,50,180],[200,420,40,140],[760,440,52,160],[880,470,48,180]];
    for(const [tx,ty,tw,th] of temples){
      ctx.fillRect(tx-tw/2,ty,tw,th);
      // Pyramid top
      ctx.beginPath();ctx.moveTo(tx-tw/2-4,ty);ctx.lineTo(tx,ty-44);ctx.lineTo(tx+tw/2+4,ty);ctx.closePath();ctx.fill();
      // Glowing windows
      ctx.fillStyle=`rgba(255,170,40,${0.4+Math.sin(G.frame*0.05+tx)*0.2})`;
      ctx.fillRect(tx-6,ty+30,12,8);ctx.fillRect(tx-6,ty+60,12,8);ctx.fillRect(tx-6,ty+90,12,8);
      ctx.fillStyle='rgba(8,6,22,0.88)';
    }
    // Floating cloud bands at multiple heights (parallax)
    const dC=(x,y,s,alpha)=>{ctx.fillStyle=`rgba(180,210,248,${alpha})`;ctx.beginPath();ctx.arc(x,y,s*22,0,Math.PI*2);ctx.arc(x+s*28,y-s*8,s*16,0,Math.PI*2);ctx.arc(x+s*52,y,s*20,0,Math.PI*2);ctx.fill();};
    dC((G.frame*0.18)%1300-150,300,1.4,0.18);
    dC((G.frame*0.13+500)%1500-150,360,1.2,0.16);
    dC((G.frame*0.22+900)%1500-150,420,1.5,0.2);
    dC((G.frame*0.3)%1400-200,520,1.7,0.25);
    dC((G.frame*0.25+700)%1500-150,580,1.4,0.22);
    // Bottom abyss
    const abyss=ctx.createLinearGradient(0,H*0.8,0,H);abyss.addColorStop(0,'rgba(4,4,16,0)');abyss.addColorStop(1,'rgba(4,4,16,0.78)');ctx.fillStyle=abyss;ctx.fillRect(0,H*0.8,W,H*0.2);
  } else if(st.id===11){
    // NEO CITY — heavy rain, parallax skyscrapers, holograms, flying vehicles, neon glow
    // Stars / distant lights
    for(let i=0;i<70;i++){const sx=(i*197+40)%W,sy=(i*89+10)%(H*0.45),blink=Math.sin(G.frame*0.04+i)*0.3+0.7;ctx.fillStyle=`rgba(200,240,255,${blink*0.7})`;ctx.beginPath();ctx.arc(sx,sy,i%5===0?1.5:0.8,0,Math.PI*2);ctx.fill();}
    // Rain (multiple speeds for depth)
    ctx.strokeStyle='rgba(0,200,255,0.18)';ctx.lineWidth=1;
    for(let i=0;i<70;i++){const rx=(i*233+G.frame*4)%W,ry=(i*97+G.frame*5)%H;ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-4,ry+22);ctx.stroke();}
    ctx.strokeStyle='rgba(0,180,230,0.1)';
    for(let i=0;i<40;i++){const rx=(i*333+G.frame*2.5)%W,ry=(i*123+G.frame*3)%H;ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-3,ry+15);ctx.stroke();}
    // Far parallax skyscrapers (distant haze)
    ctx.fillStyle='rgba(2,14,20,0.92)';
    const farB=[{x:0,w:60,h:340},{x:55,w:44,h:280},{x:150,w:70,h:360},{x:215,w:50,h:300},{x:310,w:80,h:400},{x:385,w:55,h:320},{x:480,w:65,h:440},{x:540,w:48,h:310},{x:620,w:72,h:370},{x:686,w:52,h:290},{x:770,w:76,h:410},{x:840,w:54,h:335},{x:888,w:68,h:360},{x:950,w:50,h:290}];
    for(const b of farB){ctx.fillRect(b.x,H-b.h,b.w,b.h);}
    // Neon trim on tallest far buildings
    const tallest=farB.filter(b=>b.h>380);
    for(let i=0;i<tallest.length;i++){
      const b=tallest[i],col=['#00e5ff','#ff00cc','#aa44ff'][i%3];
      ctx.fillStyle=col;ctx.shadowBlur=10;ctx.shadowColor=col;
      ctx.fillRect(b.x,H-b.h,b.w,2);
      ctx.shadowBlur=0;
    }
    // Mid-layer skyscrapers (closer, with neon trim)
    ctx.fillStyle='rgba(6,18,28,0.95)';
    const midB=[{x:60,w:80,h:480,col:'#00e5ff'},{x:280,w:90,h:520,col:'#ff00cc'},{x:480,w:100,h:550,col:'#00ff99'},{x:680,w:88,h:500,col:'#aa44ff'},{x:880,w:82,h:460,col:'#ff6600'}];
    for(const b of midB){
      ctx.fillRect(b.x,H-b.h,b.w,b.h);
      // Vertical seam
      ctx.fillStyle='rgba(0,0,0,0.4)';ctx.fillRect(b.x+b.w/2-1,H-b.h,2,b.h);
      // Neon rooftop trim
      ctx.fillStyle=b.col;ctx.shadowBlur=14;ctx.shadowColor=b.col;
      ctx.fillRect(b.x,H-b.h,b.w,3);
      // Antenna
      ctx.fillStyle='#1a3a4a';ctx.fillRect(b.x+b.w/2-2,H-b.h-30,4,30);
      ctx.fillStyle=b.col;
      ctx.beginPath();ctx.arc(b.x+b.w/2,H-b.h-32,3,0,Math.PI*2);ctx.fill();
      // Vertical neon strips on sides
      ctx.fillRect(b.x,H-b.h+30,3,b.h-60);
      ctx.fillRect(b.x+b.w-3,H-b.h+30,3,b.h-60);
      ctx.shadowBlur=0;ctx.fillStyle='rgba(6,18,28,0.95)';
    }
    // Window grid lights (mid buildings)
    for(let i=0;i<70;i++){
      const blink=Math.sin(G.frame*0.05+i*1.3)>0;if(!blink)continue;
      const wx=20+(i*23)%960,wy=80+(i*37)%500;
      ctx.fillStyle='rgba(0,200,255,0.4)';ctx.fillRect(wx,wy,4,3);
    }
    // Holographic billboards (floating mid-air, scrolling)
    for(let i=0;i<2;i++){
      const hx=((G.frame*0.6+i*600)%(W+200))-100;
      const hy=160+i*120;
      const cols=['#ff00cc','#00e5ff'];
      ctx.fillStyle=`rgba(${i===0?255:0},${i===0?0:229},${i===0?204:255},0.18)`;
      ctx.fillRect(hx,hy,90,50);
      ctx.strokeStyle=cols[i];ctx.lineWidth=1.5;ctx.shadowBlur=10;ctx.shadowColor=cols[i];
      ctx.strokeRect(hx,hy,90,50);
      ctx.shadowBlur=0;
    }
    // Flying vehicles with light trails
    for(let i=0;i<3;i++){
      const speeds=[1.8,1.2,2.4];
      const dirs=[1,-1,1];
      const ys=[110,85,180];
      const cols=['#ffe060','#ff64c8','#60ffe0'];
      const vx=dirs[i]>0?(G.frame*speeds[i])%1200-100:1100-(G.frame*speeds[i])%1200;
      // Light trail
      for(let k=1;k<5;k++){
        ctx.fillStyle=`rgba(${i===0?255:(i===1?255:96)},${i===0?224:(i===1?100:255)},${i===0?96:(i===1?200:224)},${0.5-k*0.1})`;
        ctx.beginPath();ctx.arc(vx-dirs[i]*k*5,ys[i],2-k*0.3,0,Math.PI*2);ctx.fill();
      }
      ctx.fillStyle=cols[i];ctx.shadowBlur=10;ctx.shadowColor=cols[i];
      ctx.beginPath();ctx.arc(vx,ys[i],2.5,0,Math.PI*2);ctx.fill();
    }
    ctx.shadowBlur=0;
    // Bottom neon ground glow
    const groundGlow=ctx.createLinearGradient(0,400,0,H);groundGlow.addColorStop(0,'rgba(0,229,255,0)');groundGlow.addColorStop(1,'rgba(0,229,255,0.22)');ctx.fillStyle=groundGlow;ctx.fillRect(0,400,W,H-400);
  }
}
function drawFerrisWheel(angle){
  const cx=500,cy=310,r=150;
  // Support legs from wheel base to ground
  ctx.strokeStyle='#334455';ctx.lineWidth=9;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(cx-8,cy+r);ctx.lineTo(cx-75,510);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx+8,cy+r);ctx.lineTo(cx+75,510);ctx.stroke();
  // Cross-brace
  ctx.lineWidth=5;
  ctx.beginPath();ctx.moveTo(cx-55,490);ctx.lineTo(cx+55,490);ctx.stroke();
  // Outer rim
  ctx.strokeStyle='#8899aa';ctx.lineWidth=7;
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
  // Inner rim ring
  ctx.strokeStyle='#667788';ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(cx,cy,r*0.55,0,Math.PI*2);ctx.stroke();
  // Spokes — one per platform, and cross-spokes for structure
  ctx.strokeStyle='#556677';ctx.lineWidth=2.5;
  for(let i=0;i<6;i++){
    const a=angle+(i/6)*Math.PI*2;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);ctx.stroke();
    // Inner spoke segment
    ctx.strokeStyle='#445566';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r*0.55,cy+Math.sin(a)*r*0.55);ctx.lineTo(cx+Math.cos(a+Math.PI/6)*r*0.55,cy+Math.sin(a+Math.PI/6)*r*0.55);ctx.stroke();
    ctx.strokeStyle='#556677';ctx.lineWidth=2.5;
  }
  // Glowing hub
  const hubG=ctx.createRadialGradient(cx,cy,2,cx,cy,14);hubG.addColorStop(0,'#ffffff');hubG.addColorStop(0.4,'#ffee44');hubG.addColorStop(1,'#cc9900');
  ctx.fillStyle=hubG;ctx.shadowBlur=18;ctx.shadowColor='#ffdd00';
  ctx.beginPath();ctx.arc(cx,cy,14,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
  ctx.strokeStyle='#886600';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,14,0,Math.PI*2);ctx.stroke();
  // Small light bulbs at each rim attachment point
  const bulbCols=['#ff3355','#ffdd00','#33ffaa','#3399ff','#ff88ff','#ffaa33'];
  for(let i=0;i<6;i++){
    const a=angle+(i/6)*Math.PI*2,bx=cx+Math.cos(a)*r,by=cy+Math.sin(a)*r;
    ctx.fillStyle=bulbCols[i];ctx.shadowBlur=12;ctx.shadowColor=bulbCols[i];
    ctx.beginPath();ctx.arc(bx,by,5,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
  }
}
function drawJungleTrees(){
  // Floating jungle: distant tree silhouettes at the edges to G.frame the action,
  // plus moss/vines hanging from the floating canopies (set in stage grounds[]).
  // Two distant background trees on each edge — partial silhouettes.
  const edgeTrees=[{cx:30,top:80,bot:600,tw:34,cw:55},{cx:970,top:60,bot:600,tw:36,cw:60}];
  for(const t of edgeTrees){
    ctx.fillStyle='rgba(8,28,5,0.85)';
    ctx.fillRect(t.cx-t.tw/2,t.top,t.tw,t.bot-t.top);
    ctx.fillStyle='rgba(6,40,4,0.9)';
    ctx.beginPath();ctx.ellipse(t.cx,t.top+10,t.cw,42,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(12,58,8,0.7)';
    ctx.beginPath();ctx.ellipse(t.cx,t.top-18,t.cw*0.75,32,0,0,Math.PI*2);ctx.fill();
  }
  // Hanging moss/vines off the bottom of the floating canopies (grounds in jungle stage)
  ctx.strokeStyle='rgba(28,90,18,0.6)';ctx.lineWidth=2;ctx.lineCap='round';
  const canopySpots=[{x:90,y:500},{x:170,y:500},{x:790,y:500},{x:870,y:500}];
  for(let i=0;i<canopySpots.length;i++){
    const s=canopySpots[i];
    const sw=Math.sin(G.frame*0.018+i*0.9)*6;
    const len=44+i%2*16;
    ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.bezierCurveTo(s.x+sw*0.3,s.y+len*0.4,s.x+sw,s.y+len*0.75,s.x+sw*1.4,s.y+len);ctx.stroke();
  }
}
function drawNeoBuildings(grounds){
  // Building accent colors cycling per tower
  const neonCols=['#00e5ff','#ff00cc','#00ff99','#ff6600','#aa44ff'];
  for(let i=0;i<grounds.length;i++){
    const b=grounds[i],nc=neonCols[i%neonCols.length];
    const bx=b.x, by=b.y+b.h, bw=b.w, bh=600-by; // body from rooftop base to bottom
    // Main building body — dark steel
    ctx.fillStyle='#0a1e28';ctx.fillRect(bx,by,bw,bh);
    // Subtle vertical panel seam down center
    ctx.fillStyle='rgba(0,0,0,0.35)';ctx.fillRect(bx+bw/2-2,by,4,bh);
    // Window grid — 3 columns, rows every 18px
    const cols=3,colW=bw/cols;
    for(let row=0;by+12+row*18<600;row++){
      for(let col=0;col<cols;col++){
        const wx=bx+col*colW+colW*0.2, wy=by+10+row*18;
        const lit=Math.sin(G.frame*0.03+i*1.3+row*0.7+col*2.1)>0.1;
        if(lit){ctx.fillStyle=`rgba(0,200,255,0.35)`;ctx.fillRect(wx,wy,colW*0.55,9);}
      }
    }
    // Neon rooftop trim — glowing bar along the roof edge
    ctx.fillStyle=nc;ctx.shadowBlur=14;ctx.shadowColor=nc;
    ctx.fillRect(bx,b.y+b.h-3,bw,3);
    ctx.shadowBlur=0;
    // Corner antenna / spire on tallest buildings
    if(b.y<220){
      ctx.fillStyle='#1a3a4a';ctx.fillRect(bx+bw/2-3,b.y-35,6,35);
      ctx.fillStyle=nc;ctx.shadowBlur=12;ctx.shadowColor=nc;
      ctx.beginPath();ctx.arc(bx+bw/2,b.y-36,4,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
    }
  }
}
function drawStageGeom(st){
  const g=st.ground;rrFill(g.x,g.y,g.w,g.h,6,st.gCol);rrFill(g.x,g.y,g.w,8,4,st.gTop);rrStroke(g.x,g.y,g.w,g.h,6,st.gEdge,1.5);
  if(st.ferrisWheel) drawFerrisWheel(G.carnivalAngle);
  if(st.jungle) drawJungleTrees();
  if(st.neocity) drawNeoBuildings(st.grounds);
  for(const pl of st.plats){rrFill(pl.x,pl.y,pl.w,pl.h,5,st.pCol);rrFill(pl.x,pl.y,pl.w,6,3,st.pTop);rrStroke(pl.x,pl.y,pl.w,pl.h,5,st.gEdge,1.5);}
  for(const sg of (st.grounds||[])){rrFill(sg.x,sg.y,sg.w,sg.h,6,st.gCol);rrFill(sg.x,sg.y,sg.w,8,4,st.gTop);rrStroke(sg.x,sg.y,sg.w,sg.h,6,st.gEdge,1.5);}
}
function drawGear(x,y,r,c1,c2){
  const teeth=8,ang=G.frame*0.012;ctx.save();ctx.translate(x,y);ctx.rotate(ang);
  ctx.fillStyle=c1;ctx.beginPath();for(let i=0;i<teeth*2;i++){const a=(i/(teeth*2))*Math.PI*2,rad=i%2===0?r:r*0.68;i===0?ctx.moveTo(Math.cos(a)*rad,Math.sin(a)*rad):ctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);}ctx.closePath();ctx.fill();
  ctx.fillStyle=c2;ctx.beginPath();ctx.arc(0,0,r*0.38,0,Math.PI*2);ctx.fill();ctx.restore();
}

export { drawStageBG, drawStageGeom, drawFerrisWheel, drawJungleTrees, drawNeoBuildings, drawGear };
