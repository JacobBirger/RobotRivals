import { ctx, W, H } from './globals.js';
import { G } from './globals.js';
import { CHARS, DUMMY_CHAR } from './characters/index.js';
import { STAGES, drawStageBG, drawStageGeom } from './stages/index.js';
import { rrFill, rrStroke, rrPath, drawParticles } from './particles.js';
import { drawCharacter } from './player/draw.js';

function menuModeKey(code){
  const modeCount=3;
  if(code==='KeyW'||code==='ArrowUp')G.modeSelIdx=(G.modeSelIdx+modeCount-1)%modeCount;
  if(code==='KeyS'||code==='ArrowDown')G.modeSelIdx=(G.modeSelIdx+1)%modeCount;
  if(code==='Space'||code==='Enter'||code==='NumpadEnter'){code=['KeyL','Key4','KeyT'][G.modeSelIdx];}
  if(code==='KeyL'){G.networkMode='none';G.gameState='charSelect';G.selectStep=0;G.p1Confirmed=false;G.charScrollY=0;}
  if(code==='Key4'){G.networkMode='team4';G.gameState='charSelect';G.selectStep=0;G.p1Confirmed=false;G.charScrollY=0;}
  if(code==='KeyT'){G.networkMode='test';G.gameState='charSelect';G.selectStep=0;G.p1Confirmed=false;G.charScrollY=0;}
}
function menuCharKey(code){
  const rowH=230+12,maxSc=Math.max(0,(Math.ceil(CHARS.length/3)-2)*rowH);
  // Helper to scroll a given selection index into view
  const autoScroll=sel=>{const r=Math.floor(sel/3)*rowH;if(r<G.charScrollY)G.charScrollY=r;if(r+230>G.charScrollY+472)G.charScrollY=r+230-472;};
  // 4-player team mode: each phone navigates and confirms independently
  if(G.networkMode==='team4'&&code&&typeof code==='object'){
    const {pi,dir}=code;
    const getters=[()=>G.p1Sel,()=>G.p2Sel,()=>G.p3Sel,()=>G.p4Sel];
    const setters=[v=>G.p1Sel=v,v=>G.p2Sel=v,v=>G.p3Sel=v,v=>G.p4Sel=v];
    const totalSlots=CHARS.length+1;
    if(G.team4Done[pi])return; // already locked in
    if(dir==='left'){setters[pi]((getters[pi]()+totalSlots-1)%totalSlots);autoScroll(getters[pi]());}
    if(dir==='right'){setters[pi]((getters[pi]()+1)%totalSlots);autoScroll(getters[pi]());}
    if(dir==='confirm'){
      if(getters[pi]()===CHARS.length)setters[pi](Math.floor(Math.random()*CHARS.length));
      G.team4Done[pi]=true;
      if(G.team4Done.every(v=>v))G.gameState='stageSelect';
    }
    return;
  }
  // 1v1 local / test
  const totalSlots=CHARS.length+1; // +1 for the RANDOM card at the end
  if(G.selectStep===0){
    if(code==='KeyA')G.p1Sel=(G.p1Sel+totalSlots-1)%totalSlots;
    if(code==='KeyD')G.p1Sel=(G.p1Sel+1)%totalSlots;
    if(code==='KeyW')G.charScrollY=Math.max(0,G.charScrollY-rowH);
    if(code==='KeyS')G.charScrollY=Math.min(maxSc,G.charScrollY+rowH);
    autoScroll(G.p1Sel);
    if(code==='Space'||code==='Enter'||code==='NumpadEnter'){
      if(G.p1Sel===CHARS.length)G.p1Sel=Math.floor(Math.random()*CHARS.length);
      if(G.networkMode==='test'){G.gameState='stageSelect';G.stageSelectGuard=true;return;}
      G.p1Confirmed=true;G.selectStep=1;
    }
  } else {
    if(code==='ArrowLeft')G.p2Sel=(G.p2Sel+totalSlots-1)%totalSlots;
    if(code==='ArrowRight')G.p2Sel=(G.p2Sel+1)%totalSlots;
    if(code==='ArrowUp')G.charScrollY=Math.max(0,G.charScrollY-rowH);
    if(code==='ArrowDown')G.charScrollY=Math.min(maxSc,G.charScrollY+rowH);
    autoScroll(G.p2Sel);
    if(code==='Enter'||code==='NumpadEnter'){
      if(G.p2Sel===CHARS.length)G.p2Sel=Math.floor(Math.random()*CHARS.length);
      G.gameState='stageSelect';G.stageSelectGuard=true;
    }
  }
}
function menuStageKey(code){
  const stTotal=STAGES.length+1; // +1 for RANDOM card
  const cols=4,rowH=172+12;
  const clipTop=74,clipBot=H-28,visH=clipBot-clipTop;
  const maxSc=Math.max(0,(Math.ceil(stTotal/cols)-Math.floor(visH/rowH))*rowH);
  const autoScroll=sel=>{const r=Math.floor(sel/cols)*rowH;if(r<G.stageScrollY)G.stageScrollY=r;if(r+rowH>G.stageScrollY+visH)G.stageScrollY=Math.min(maxSc,r+rowH-visH);};
  if(code==='KeyA'||code==='ArrowLeft'){G.stageSel=(G.stageSel+stTotal-1)%stTotal;autoScroll(G.stageSel);}
  if(code==='KeyD'||code==='ArrowRight'){G.stageSel=(G.stageSel+1)%stTotal;autoScroll(G.stageSel);}
  if(code==='KeyW'||code==='ArrowUp'){G.stageScrollY=Math.max(0,G.stageScrollY-rowH);const newRow=Math.floor(G.stageScrollY/rowH);if(Math.floor(G.stageSel/cols)>newRow+Math.floor(visH/rowH)-1)G.stageSel=Math.min(stTotal-1,Math.floor(G.stageSel/cols-1)*cols+(G.stageSel%cols));}
  if(code==='KeyS'||code==='ArrowDown'){G.stageScrollY=Math.min(maxSc,G.stageScrollY+rowH);const newRow=Math.floor(G.stageScrollY/rowH);if(Math.floor(G.stageSel/cols)<newRow)G.stageSel=Math.min(stTotal-1,(Math.floor(G.stageSel/cols)+1)*cols+(G.stageSel%cols));}
  G.stageSelectGuard=false;
  if(code==='Space'||code==='Enter'||code==='NumpadEnter'){
    if(G.stageSel===STAGES.length)G.stageSel=Math.floor(Math.random()*STAGES.length);
    G.startGame();
  }
}

// ---- Screens ----
// Persistent star field for menu background
const _menuStars=(()=>{const s=[];for(let i=0;i<120;i++)s.push({x:Math.random()*1000,y:Math.random()*600,r:Math.random()*1.6+0.3,spd:Math.random()*0.18+0.04,bright:Math.random()});return s;})();

function drawModeSelect(){
  const t=G.frame;
  const gr=ctx.createLinearGradient(0,0,0,H);
  gr.addColorStop(0,'#04040f');gr.addColorStop(0.5,'#07071a');gr.addColorStop(1,'#020208');
  ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(40,60,120,0.13)';ctx.lineWidth=1;
  for(let x=0;x<W;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  for(const s of _menuStars){
    s.y-=s.spd; if(s.y<0)s.y=H;
    const twinkle=0.4+0.6*Math.abs(Math.sin(t*0.03+s.bright*10));
    ctx.globalAlpha=twinkle*(0.4+s.bright*0.6);
    ctx.fillStyle='#ffffff';
    ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
  const glow=ctx.createRadialGradient(W/2,110,10,W/2,110,280);
  glow.addColorStop(0,'rgba(40,80,200,0.18)');glow.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
  const lineY=152;
  const lg=ctx.createLinearGradient(0,lineY,W,lineY);
  lg.addColorStop(0,'rgba(0,0,0,0)');lg.addColorStop(0.3,'rgba(80,140,255,0.5)');
  lg.addColorStop(0.5,'rgba(160,200,255,0.9)');lg.addColorStop(0.7,'rgba(80,140,255,0.5)');lg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.strokeStyle=lg;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,lineY);ctx.lineTo(W,lineY);ctx.stroke();
  const pulse=0.85+0.15*Math.sin(t*0.04);
  ctx.save();
  ctx.textAlign='center';
  ctx.shadowBlur=40*pulse;ctx.shadowColor='#4488ff';
  ctx.fillStyle='#ffffff';ctx.font='bold 82px monospace';
  ctx.fillText('ROBOT RIVALS',W/2,120);
  ctx.shadowBlur=0;
  ctx.fillStyle='rgba(120,160,255,0.7)';ctx.font='13px monospace';
  ctx.fillText('A  P L A T F O R M  F I G H T E R',W/2,143);
  ctx.restore();
  const options=[
    {key:'L',label:'Local 1v1',sub:'Both players on this computer',col:'#44aaff'},
    {key:'4',label:'Local 4P Teams',sub:'4 phones — P1&P3 vs P2&P4',col:'#ffaa00'},
    {key:'T',label:'Test Mode',sub:'Practice against a stationary dummy',col:'#88cc33'},
  ];
  const bw=420,bh=82,bx=W/2-bw/2;
  options.forEach((o,i)=>{
    const by=170+i*98,sel=i===G.modeSelIdx;
    if(sel){ctx.shadowBlur=22;ctx.shadowColor=o.col;}
    const cardGr=ctx.createLinearGradient(bx,by,bx+bw,by+bh);
    if(sel){cardGr.addColorStop(0,'rgba(20,30,65,0.97)');cardGr.addColorStop(1,'rgba(10,18,40,0.97)');}
    else{cardGr.addColorStop(0,'rgba(12,14,30,0.92)');cardGr.addColorStop(1,'rgba(8,10,20,0.92)');}
    rrFill(bx,by,bw,bh,12,cardGr);
    ctx.shadowBlur=0;
    rrFill(bx,by,5,bh,2,o.col);
    rrStroke(bx,by,bw,bh,12,sel?o.col:'rgba(50,60,90,0.6)',sel?2.5:1.5);
    if(sel){
      ctx.save();ctx.fillStyle=o.col;ctx.font='bold 18px monospace';ctx.textAlign='left';
      ctx.shadowBlur=10;ctx.shadowColor=o.col;
      ctx.fillText('▶',bx-28,by+bh/2+7);
      ctx.shadowBlur=0;ctx.restore();
    }
    const bdX=bx+16,bdY=by+bh/2-13,bdW=30,bdH=24;
    rrFill(bdX,bdY,bdW,bdH,5,sel?o.col:'rgba(50,60,90,0.7)');
    ctx.fillStyle=sel?'#000':'#aaa';ctx.font='bold 13px monospace';ctx.textAlign='center';
    ctx.fillText(o.key,bdX+bdW/2,bdY+17);
    ctx.textAlign='left';
    ctx.fillStyle=sel?'#ffffff':o.col+'cc';ctx.font=`bold ${sel?23:21}px monospace`;
    ctx.fillText(o.label,bx+58,by+bh/2+5);
    ctx.fillStyle=sel?'rgba(160,190,255,0.65)':'rgba(90,100,130,0.7)';ctx.font='11px monospace';
    ctx.fillText(o.sub,bx+58,by+bh/2+23);
  });
  ctx.textAlign='center';ctx.fillStyle='rgba(55,65,95,0.85)';ctx.font='10px monospace';
  ctx.fillText('WASD / Arrow keys navigate  ·  press key or Enter to select',W/2,H-16);
}
function drawCharSelect(){
  const t=G.frame;
  const gr=ctx.createLinearGradient(0,0,0,H);
  gr.addColorStop(0,'#03030e');gr.addColorStop(1,'#060612');
  ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
  for(const s of _menuStars){
    ctx.globalAlpha=(0.15+s.bright*0.2)*Math.abs(Math.sin(t*0.02+s.bright*8));
    ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(s.x,s.y,s.r*0.7,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
  const hg=ctx.createLinearGradient(0,0,W,0);
  hg.addColorStop(0,'rgba(0,0,0,0)');hg.addColorStop(0.5,'rgba(20,30,70,0.9)');hg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=hg;ctx.fillRect(0,0,W,68);
  ctx.textAlign='center';
  ctx.shadowBlur=18;ctx.shadowColor='#4488ff';
  ctx.fillStyle='#ffffff';ctx.font='bold 36px monospace';
  ctx.fillText('CHARACTER SELECT',W/2,36);
  ctx.shadowBlur=0;
  const lineY=50;
  const lg2=ctx.createLinearGradient(0,lineY,W,lineY);
  lg2.addColorStop(0,'rgba(0,0,0,0)');lg2.addColorStop(0.3,'rgba(80,140,255,0.4)');
  lg2.addColorStop(0.5,'rgba(160,200,255,0.8)');lg2.addColorStop(0.7,'rgba(80,140,255,0.4)');lg2.addColorStop(1,'rgba(0,0,0,0)');
  ctx.strokeStyle=lg2;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,lineY);ctx.lineTo(W,lineY);ctx.stroke();
  ctx.font='12px monospace';ctx.fillStyle='rgba(100,120,180,0.8)';
  if(G.networkMode==='team4') ctx.fillText('Each player: left/right on phone to browse  |  jump/light to confirm',W/2,62);
  else if(G.networkMode==='test') ctx.fillText('A/D to browse  |  SPACE to confirm',W/2,62);
  else if(G.selectStep===0) ctx.fillText('P1: A/D to browse  |  SPACE to confirm',W/2,62);
  else ctx.fillText('P2: Arrow keys to browse  |  ENTER to confirm',W/2,62);

  if(G.networkMode==='team4'){
    const t4slots=[
      {sel:G.p1Sel,lbl:'P1',col:'#3399ff',team:1},
      {sel:G.p2Sel,lbl:'P2',col:'#ff6644',team:2},
      {sel:G.p3Sel,lbl:'P3',col:'#44ddff',team:1},
      {sel:G.p4Sel,lbl:'P4',col:'#ff9944',team:2},
    ];
    const startX=W/2-(4*62)/2+31;
    for(let s=0;s<4;s++){
      const px=startX+s*62,py=82;
      const done=G.team4Done[s];
      const col=t4slots[s].col;
      if(done){ctx.shadowBlur=10;ctx.shadowColor=col;}
      ctx.strokeStyle=done?col:'#333';ctx.lineWidth=done?2.5:1;
      rrPath(px-24,py-2,48,40,4);ctx.stroke();
      ctx.shadowBlur=0;
      const charSel=t4slots[s].sel<CHARS.length?t4slots[s].sel:0;
      ctx.save();ctx.translate(px,py+20);ctx.scale(0.95,0.95);drawCharacter(ctx,CHARS[charSel],CHARS[charSel].w,CHARS[charSel].h,null,true,0);ctx.restore();
      ctx.fillStyle=done?col:'#555';ctx.font='9px monospace';ctx.textAlign='center';
      ctx.fillText(t4slots[s].lbl+(done?' ✓':''),px,py+48);
      const teamCol=t4slots[s].team===1?'#3399ff':'#ff6644';
      ctx.fillStyle=teamCol;ctx.font='8px monospace';ctx.fillText('T'+t4slots[s].team,px,py-6);
    }
    ctx.strokeStyle='rgba(80,80,120,0.4)';ctx.lineWidth=1;ctx.setLineDash([4,4]);
    ctx.beginPath();ctx.moveTo(W/2,76);ctx.lineTo(W/2,134);ctx.stroke();ctx.setLineDash([]);
  }

  const cw=285,cardH=230,gapX=14,gapY=12,cols=3;
  const totalW=cols*cw+(cols-1)*gapX;
  const sx2=(W-totalW)/2;
  const clipTop=(G.networkMode==='team4')?140:70,clipBot=H-10,visibleH=clipBot-clipTop;
  const maxSc=Math.max(0,(Math.ceil((CHARS.length+1)/3)-2)*(cardH+gapY));
  ctx.save();
  ctx.beginPath();ctx.rect(0,clipTop,W,visibleH);ctx.clip();
  ctx.translate(0,-G.charScrollY);

  for(let i=0;i<CHARS.length;i++){
    const c=CHARS[i],row=Math.floor(i/cols),col=i%cols;
    const cx2=sx2+col*(cw+gapX),cy2=clipTop+2+row*(cardH+gapY);
    const isP1Sel=G.p1Sel===i,isP2Sel=G.p2Sel===i;
    const isSame=G.networkMode==='none'&&G.p1Confirmed&&G.p1Sel===i&&G.selectStep===1;
    let bc='rgba(40,44,70,0.4)',bw3=1.5,isSelected=false;
    if(G.networkMode==='team4'){
      const t4cols=['#3399ff','#ff6644','#44ddff','#ff9944'];
      const t4sels=[G.p1Sel,G.p2Sel,G.p3Sel,G.p4Sel];
      for(let s=0;s<4;s++){if(t4sels[s]===i){bc=t4cols[s];bw3=G.team4Done[s]?3.5:2.5;isSelected=true;}}
    } else {
      if(G.p1Confirmed&&G.p1Sel===i){bc='#3399ff';bw3=3;isSelected=true;}
      else if(G.selectStep===0&&isP1Sel){bc='#3399ff';bw3=3;isSelected=true;}
      if(G.selectStep===1&&isP2Sel){bc='#ff6644';bw3=3;isSelected=true;}
    }
    if(isSelected&&!isSame){ctx.shadowBlur=16;ctx.shadowColor=bc;}
    const cardBg=ctx.createLinearGradient(cx2,cy2,cx2,cy2+cardH);
    if(isSame){cardBg.addColorStop(0,'rgba(8,8,18,0.9)');cardBg.addColorStop(1,'rgba(5,5,12,0.9)');}
    else if(isSelected){cardBg.addColorStop(0,'rgba(18,22,50,0.97)');cardBg.addColorStop(1,'rgba(10,12,30,0.97)');}
    else{cardBg.addColorStop(0,'rgba(13,14,28,0.92)');cardBg.addColorStop(1,'rgba(8,9,20,0.92)');}
    rrFill(cx2,cy2,cw,cardH,10,cardBg);
    ctx.shadowBlur=0;
    if(isSelected&&!isSame) rrFill(cx2,cy2,cw,4,2,bc);
    rrStroke(cx2,cy2,cw,cardH,10,bc,bw3);
    ctx.save();ctx.translate(cx2+cw/2,cy2+100);ctx.scale(isSame?0.8:1.6,isSame?0.8:1.6);ctx.globalAlpha=isSame?0.22:1;
    drawCharacter(ctx,c,c.w,c.h,null,true,Math.floor(t/10)%4);ctx.globalAlpha=1;ctx.restore();
    ctx.strokeStyle='rgba(60,65,100,0.5)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(cx2+10,cy2+cardH-78);ctx.lineTo(cx2+cw-10,cy2+cardH-78);ctx.stroke();
    ctx.fillStyle=isSame?'#444':c.eyeCol;ctx.font='bold 15px monospace';ctx.textAlign='center';
    if(isSelected&&!isSame){ctx.shadowBlur=8;ctx.shadowColor=c.eyeCol;}
    ctx.fillText(c.name,cx2+cw/2,cy2+cardH-62);
    ctx.shadowBlur=0;
    ctx.fillStyle='rgba(120,130,160,0.7)';ctx.font='10px monospace';ctx.fillText(c.tag,cx2+cw/2,cy2+cardH-49);
    ctx.textAlign='left';ctx.fillStyle='rgba(100,110,145,0.7)';ctx.font='10px monospace';
    for(let j=0;j<Math.min(c.desc.length,2);j++) ctx.fillText('- '+c.desc[j],cx2+10,cy2+cardH-33+j*14);
    ctx.textAlign='center';ctx.font='bold 10px monospace';
    if(G.networkMode==='team4'){
      const t4cols=['#3399ff','#ff6644','#44ddff','#ff9944'];
      const t4sels=[G.p1Sel,G.p2Sel,G.p3Sel,G.p4Sel];
      const t4lbls=['P1','P2','P3','P4'];
      let yOff=16;
      for(let s=0;s<4;s++){if(t4sels[s]===i){ctx.fillStyle=t4cols[s];ctx.fillText(t4lbls[s]+(G.team4Done[s]?' ✓':''),cx2+cw/2,cy2+yOff);yOff+=14;}}
    } else {
      if(G.p1Confirmed&&G.p1Sel===i){ctx.fillStyle='#3399ff';ctx.fillText('P1',cx2+cw/2,cy2+16);}
      else if(G.selectStep===0&&isP1Sel){ctx.fillStyle='#3399ff';ctx.fillText('P1',cx2+cw/2,cy2+16);}
      if(G.selectStep===1&&isP2Sel){ctx.fillStyle='#ff6644';ctx.fillText('P2',cx2+cw/2,cy2+(G.p1Sel===i&&G.p1Confirmed?30:16));}
    }
  }

  {
    const ri=CHARS.length, row=Math.floor(ri/cols), col=ri%cols;
    const rx=sx2+col*(cw+gapX), ry=clipTop+2+row*(cardH+gapY);
    const rSel=G.networkMode==='team4'?[G.p1Sel,G.p2Sel,G.p3Sel,G.p4Sel].includes(ri)
               :(G.selectStep===0?G.p1Sel===ri:G.p2Sel===ri);
    const pulse=Math.sin(t*0.07)*0.18+0.82;
    const rbg=ctx.createLinearGradient(rx,ry,rx,ry+cardH);
    rbg.addColorStop(0,'rgba(16,10,36,0.97)');rbg.addColorStop(1,'rgba(8,5,20,0.97)');
    if(rSel){ctx.shadowBlur=16;ctx.shadowColor='rgba(255,200,0,0.8)';}
    rrFill(rx,ry,cw,cardH,10,rbg);
    ctx.shadowBlur=0;
    if(rSel) rrFill(rx,ry,cw,4,2,'#ffcc00');
    rrStroke(rx,ry,cw,cardH,10,rSel?'rgba(255,200,0,'+pulse+')':'rgba(40,44,70,0.4)',rSel?3:1.5);
    ctx.save();ctx.translate(rx+cw/2,ry+cardH/2-20);
    ctx.rotate(Math.sin(t*0.04)*0.2);
    ctx.font='bold 72px monospace';ctx.textAlign='center';
    if(rSel){ctx.shadowBlur=20;ctx.shadowColor='#ffcc00';}
    ctx.fillStyle=rSel?'rgba(255,200,0,'+pulse+')':'rgba(80,80,100,0.6)';
    ctx.fillText('?',0,26);ctx.shadowBlur=0;ctx.restore();
    ctx.strokeStyle='rgba(60,65,100,0.5)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(rx+10,ry+cardH-78);ctx.lineTo(rx+cw-10,ry+cardH-78);ctx.stroke();
    ctx.fillStyle=rSel?'#ffcc00':'rgba(120,130,160,0.7)';ctx.font='bold '+(rSel?14:12)+'px monospace';ctx.textAlign='center';
    ctx.fillText('RANDOM',rx+cw/2,ry+cardH-62);
    ctx.fillStyle='rgba(100,110,145,0.7)';ctx.font='10px monospace';
    ctx.fillText('Pick a surprise fighter!',rx+cw/2,ry+cardH-48);
    if(rSel){ctx.fillStyle='#ffcc00';ctx.font='bold 10px monospace';ctx.fillText(G.selectStep===0?'P1':'P2',rx+cw/2,ry+16);}
  }

  ctx.restore();
  if(maxSc>0){
    ctx.fillStyle='rgba(120,140,200,0.6)';ctx.font='14px monospace';ctx.textAlign='center';
    if(G.charScrollY>0) ctx.fillText('▲  scroll  ▲',W/2,clipTop+14);
    if(G.charScrollY<maxSc) ctx.fillText('▼  scroll  ▼',W/2,clipBot-4);
  }
}

function drawStageSelect(){
  const t=G.frame;
  const gr=ctx.createLinearGradient(0,0,0,H);
  gr.addColorStop(0,'#03030e');gr.addColorStop(1,'#060612');
  ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
  for(const s of _menuStars){
    ctx.globalAlpha=(0.12+s.bright*0.18)*Math.abs(Math.sin(t*0.02+s.bright*8));
    ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(s.x,s.y,s.r*0.7,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
  const hg=ctx.createLinearGradient(0,0,W,0);
  hg.addColorStop(0,'rgba(0,0,0,0)');hg.addColorStop(0.5,'rgba(20,30,70,0.9)');hg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=hg;ctx.fillRect(0,0,W,68);
  ctx.textAlign='center';
  ctx.shadowBlur=18;ctx.shadowColor='#4488ff';
  ctx.fillStyle='#ffffff';ctx.font='bold 36px monospace';
  ctx.fillText('SELECT STAGE',W/2,36);
  ctx.shadowBlur=0;
  const lineY2=50;
  const lg3=ctx.createLinearGradient(0,lineY2,W,lineY2);
  lg3.addColorStop(0,'rgba(0,0,0,0)');lg3.addColorStop(0.3,'rgba(80,140,255,0.4)');
  lg3.addColorStop(0.5,'rgba(160,200,255,0.8)');lg3.addColorStop(0.7,'rgba(80,140,255,0.4)');lg3.addColorStop(1,'rgba(0,0,0,0)');
  ctx.strokeStyle=lg3;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,lineY2);ctx.lineTo(W,lineY2);ctx.stroke();
  ctx.font='12px monospace';ctx.fillStyle='rgba(100,120,180,0.8)';
  ctx.fillText('A/D or arrows to browse  |  W/S to scroll  |  SPACE or ENTER to start',W/2,62);

  const cols=4,cw=218,ch=172,gapX=14,gapY=12;
  const totalW=cols*cw+(cols-1)*gapX, sx=(W-totalW)/2;
  const clipTop=74,clipBot=H-32;
  const stTotal=STAGES.length+1;
  const maxSc=Math.max(0,(Math.ceil(stTotal/cols)-Math.floor((clipBot-clipTop)/(ch+gapY)))*(ch+gapY));
  ctx.save();
  ctx.beginPath();ctx.rect(0,clipTop,W,clipBot-clipTop);ctx.clip();
  ctx.translate(0,-G.stageScrollY);

  for(let i=0;i<STAGES.length;i++){
    const st=STAGES[i], col=i%cols, row=Math.floor(i/cols);
    const cx2=sx+col*(cw+gapX), cy2=clipTop+row*(ch+gapY), sel=G.stageSel===i;
    if(sel){ctx.shadowBlur=18;ctx.shadowColor=st.aCol;}
    const sbg=ctx.createLinearGradient(cx2,cy2,cx2,cy2+ch*0.6);
    sbg.addColorStop(0,st.bgT);sbg.addColorStop(1,st.bgB);
    rrPath(cx2,cy2,cw,ch,10);ctx.fillStyle=sbg;ctx.fill();
    ctx.shadowBlur=0;
    const sc=0.18,ox=cx2+8,oy=cy2+22;
    const g=st.ground;
    rrFill(ox+g.x*sc,oy+g.y*sc,g.w*sc,g.h*sc,3,st.gCol);
    rrFill(ox+g.x*sc,oy+g.y*sc,g.w*sc,4,2,st.gTop);
    if(st.ferrisWheel){
      const wcx=ox+500*sc,wcy=oy+310*sc,wr=160*sc,wa=(t*0.006)%(Math.PI*2);
      ctx.strokeStyle='#8899aa';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(wcx,wcy,wr,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='#556677';ctx.lineWidth=1;
      for(let k=0;k<6;k++){const ka=wa+(k/6)*Math.PI*2;ctx.beginPath();ctx.moveTo(wcx,wcy);ctx.lineTo(wcx+Math.cos(ka)*wr,wcy+Math.sin(ka)*wr);ctx.stroke();}
      ctx.fillStyle='#ffdd00';ctx.beginPath();ctx.arc(wcx,wcy,3,0,Math.PI*2);ctx.fill();
      const bulbCols=['#ff3355','#ffdd00','#33ffaa','#3399ff','#ff88ff','#ffaa33'];
      for(let k=0;k<6;k++){const ka=wa+(k/6)*Math.PI*2;ctx.fillStyle=bulbCols[k];ctx.beginPath();ctx.arc(wcx+Math.cos(ka)*wr,wcy+Math.sin(ka)*wr,2,0,Math.PI*2);ctx.fill();}
      for(let k=0;k<6;k++){const ka=wa+(k/6)*Math.PI*2,px=wcx+Math.cos(ka)*wr-80*sc/2,py=wcy+Math.sin(ka)*wr-60*sc/2;rrFill(px,py,80*sc,60*sc,1,st.pCol);}
    } else if(st.jungle){
      const edgeT=[{cx:30,top:80},{cx:970,top:60}];
      for(const tr of edgeT){
        ctx.fillStyle='rgba(8,28,5,0.85)';ctx.fillRect(ox+(tr.cx-17)*sc,oy+tr.top*sc,34*sc,(600-tr.top)*sc);
        ctx.fillStyle='rgba(6,40,4,0.9)';ctx.beginPath();ctx.ellipse(ox+tr.cx*sc,oy+(tr.top+10)*sc,55*sc,42*sc,0,0,Math.PI*2);ctx.fill();
      }
      for(const sg of (st.grounds||[])){rrFill(ox+sg.x*sc,oy+sg.y*sc,sg.w*sc,sg.h*sc,2,st.gCol);}
      for(const pl of st.plats){rrFill(ox+pl.x*sc,oy+pl.y*sc,pl.w*sc,pl.h*sc,1,st.pCol);}
    } else if(st.neocity){
      const neonCols=['#00e5ff','#ff00cc','#00ff99','#ff6600','#aa44ff'];
      for(let k=0;k<(st.grounds||[]).length;k++){
        const sg=st.grounds[k],nc=neonCols[k%neonCols.length];
        const bby=oy+sg.y*sc+sg.h*sc, bbh=ch-(sg.y*sc+sg.h*sc)-22;
        if(bbh>0){ctx.fillStyle='#0a1e28';ctx.fillRect(ox+sg.x*sc,bby,sg.w*sc,bbh);}
        ctx.fillStyle=nc;ctx.shadowBlur=6;ctx.shadowColor=nc;
        ctx.fillRect(ox+sg.x*sc,oy+sg.y*sc,sg.w*sc,sg.h*sc);
        ctx.shadowBlur=0;
      }
    } else {
      for(const pl of st.plats){rrFill(ox+pl.x*sc,oy+pl.y*sc,pl.w*sc,pl.h*sc,2,st.pCol);rrFill(ox+pl.x*sc,oy+pl.y*sc,pl.w*sc,3,2,st.pTop);}
      for(const sg of (st.grounds||[])){rrFill(ox+sg.x*sc,oy+sg.y*sc,sg.w*sc,sg.h*sc,2,st.gCol);rrFill(ox+sg.x*sc,oy+sg.y*sc,sg.w*sc,4,2,st.gTop);}
    }
    const overlay=ctx.createLinearGradient(cx2,cy2+ch*0.5,cx2,cy2+ch);
    overlay.addColorStop(0,'rgba(0,0,0,0)');overlay.addColorStop(1,'rgba(0,0,0,0.75)');
    rrPath(cx2,cy2,cw,ch,10);ctx.fillStyle=overlay;ctx.fill();
    if(sel){ctx.shadowBlur=18;ctx.shadowColor=st.aCol;}
    rrStroke(cx2,cy2,cw,ch,10,sel?st.aCol:'rgba(50,55,80,0.6)',sel?2.5:1.5);
    ctx.shadowBlur=0;
    if(sel) rrFill(cx2,cy2,cw,4,2,st.aCol);
    ctx.fillStyle=sel?'#ffffff':st.aCol+'cc';
    ctx.font='bold '+(sel?13:11)+'px monospace';ctx.textAlign='center';
    if(sel){ctx.shadowBlur=8;ctx.shadowColor=st.aCol;}
    ctx.fillText(st.name,cx2+cw/2,cy2+ch-34);
    ctx.shadowBlur=0;
    ctx.fillStyle='rgba(130,140,170,0.7)';ctx.font='9px monospace';
    ctx.fillText(st.desc,cx2+cw/2,cy2+ch-20);
    if(sel){ctx.fillStyle=st.aCol;ctx.font='bold 8px monospace';ctx.fillText('[ SELECTED ]',cx2+cw/2,cy2+ch-8);}
  }

  {
    const ri=STAGES.length, col=ri%cols, row=Math.floor(ri/cols);
    const rx=sx+col*(cw+gapX), ry=clipTop+row*(ch+gapY), rSel=G.stageSel===ri;
    const pulse=Math.sin(t*0.07)*0.18+0.82;
    const rbg=ctx.createLinearGradient(rx,ry,rx,ry+ch);
    rbg.addColorStop(0,'#0d0020');rbg.addColorStop(1,'#1a003a');
    if(rSel){ctx.shadowBlur=18;ctx.shadowColor='rgba(255,200,0,0.8)';}
    rrPath(rx,ry,cw,ch,10);ctx.fillStyle=rbg;ctx.fill();
    ctx.shadowBlur=0;
    if(rSel) rrFill(rx,ry,cw,4,2,'#ffcc00');
    const rov=ctx.createLinearGradient(rx,ry+ch*0.5,rx,ry+ch);
    rov.addColorStop(0,'rgba(0,0,0,0)');rov.addColorStop(1,'rgba(0,0,0,0.7)');
    rrPath(rx,ry,cw,ch,10);ctx.fillStyle=rov;ctx.fill();
    ctx.save();ctx.translate(rx+cw/2,ry+ch/2-22);
    ctx.rotate(Math.sin(t*0.04)*0.15);
    ctx.font='bold 54px monospace';ctx.textAlign='center';
    if(rSel){ctx.shadowBlur=20;ctx.shadowColor='#ffcc00';}
    ctx.fillStyle=rSel?'rgba(255,200,0,'+pulse+')':'rgba(80,80,100,0.5)';
    ctx.fillText('?',0,20);ctx.shadowBlur=0;ctx.restore();
    rrStroke(rx,ry,cw,ch,10,rSel?'rgba(255,200,0,'+pulse+')':'rgba(50,55,80,0.6)',rSel?2.5:1.5);
    ctx.fillStyle=rSel?'#ffcc00':'rgba(160,170,200,0.8)';
    ctx.font='bold '+(rSel?13:11)+'px monospace';ctx.textAlign='center';
    if(rSel){ctx.shadowBlur=8;ctx.shadowColor='#ffcc00';}
    ctx.fillText('RANDOM',rx+cw/2,ry+ch-34);
    ctx.shadowBlur=0;
    ctx.fillStyle='rgba(130,140,170,0.7)';ctx.font='9px monospace';
    ctx.fillText('Let fate decide the arena!',rx+cw/2,ry+ch-20);
    if(rSel){ctx.fillStyle='#ffcc00';ctx.font='bold 8px monospace';ctx.fillText('[ SELECTED ]',rx+cw/2,ry+ch-8);}
  }

  ctx.restore();
  if(maxSc>0){
    ctx.fillStyle='rgba(120,140,200,0.6)';ctx.font='14px monospace';ctx.textAlign='center';
    if(G.stageScrollY>0) ctx.fillText('▲  scroll  ▲',W/2,clipTop+14);
    if(G.stageScrollY<maxSc) ctx.fillText('▼  scroll  ▼',W/2,clipBot-4);
  }
  ctx.fillStyle='rgba(8,10,24,0.9)';ctx.fillRect(0,clipBot,W,H-clipBot);
  const p1c=CHARS[G.p1Sel],p2c=G.networkMode==='test'?DUMMY_CHAR:CHARS[G.p2Sel];
  ctx.font='bold 13px monospace';
  ctx.textAlign='left';ctx.shadowBlur=8;ctx.shadowColor=p1c.color;
  ctx.fillStyle=p1c.color;ctx.fillText('P1: '+p1c.name,18,H-12);
  ctx.shadowBlur=0;
  ctx.textAlign='right';ctx.shadowBlur=8;ctx.shadowColor=p2c.color;
  ctx.fillStyle=p2c.color;ctx.fillText((G.networkMode==='test'?'P2: DUMMY':'P2: '+p2c.name),W-18,H-12);
  ctx.shadowBlur=0;
}

function drawGameOver(){
  drawStageBG(G.curStage);drawStageGeom(G.curStage);for(const p of G.players)p.draw();drawParticles();
  ctx.fillStyle='rgba(0,0,0,0.72)';ctx.fillRect(0,0,W,H);
  ctx.textAlign='center';ctx.font='bold 62px monospace';ctx.fillStyle='#fff';ctx.fillText('GAME OVER',W/2,H/2-55);
  const wc=G.winner.includes('P1')?CHARS[G.p1Sel].color:G.winner.includes('P2')?(G.networkMode==='test'?'#888':CHARS[G.p2Sel].color):'#fff';
  ctx.font='bold 34px monospace';ctx.fillStyle=wc;ctx.fillText(G.winner,W/2,H/2+18);
  ctx.fillStyle='#666';ctx.font='17px monospace';ctx.fillText('Press ENTER or SPACE to play again',W/2,H/2+72);
}


// Register callbacks on G so input.js can call them without circular imports
G.menuModeKey = menuModeKey;
G.menuCharKey = menuCharKey;
G.menuStageKey = menuStageKey;

export { menuModeKey, menuCharKey, menuStageKey, drawModeSelect, drawCharSelect, drawStageSelect, drawGameOver };
