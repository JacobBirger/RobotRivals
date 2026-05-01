import { ctx, W, H } from './globals.js';
import { G } from './globals.js';
import { CHARS, DUMMY_CHAR } from './characters/index.js';
import { STAGES } from './stages/index.js';
import { rrFill, rrStroke, rrPath } from './particles.js';
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
function drawModeSelect(){
  const gr=ctx.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#080818');gr.addColorStop(1,'#000000');ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
  ctx.textAlign='center';ctx.font='bold 52px monospace';ctx.fillStyle='#ffffff';ctx.fillText('ROBOT RIVALS',W/2,80);
  ctx.font='15px monospace';ctx.fillStyle='#444';ctx.fillText('A Platform Fighter',W/2,102);
  const options=[
    {key:'L',label:'Local 1v1',sub:'Both G.players on this computer',col:'#44aaff'},
    {key:'4',label:'Local 4P Teams',sub:'4 phones — P1&P3 vs P2&P4',col:'#ffaa00'},
    {key:'T',label:'Test Mode',sub:'Practice against a stationary dummy',col:'#88cc33'},
  ];
  const bw=260,bh=66,sx=W/2-bw/2;
  options.forEach((o,i)=>{
    const bx=sx,by=130+i*74,sel=i===G.modeSelIdx;
    rrFill(bx,by,bw,bh,8,sel?'rgba(40,40,80,0.95)':'rgba(20,20,40,0.9)');rrStroke(bx,by,bw,bh,8,o.col,sel?3:2);
    if(sel){ctx.fillStyle=o.col;ctx.font='bold 20px monospace';ctx.textAlign='left';ctx.fillText('\u25B6',bx-22,by+30);}
    ctx.fillStyle=o.col;ctx.font='bold 17px monospace';ctx.textAlign='left';ctx.fillText(`[${o.key}] ${o.label}`,bx+12,by+25);
    ctx.fillStyle='#555';ctx.font='10px monospace';ctx.fillText(o.sub,bx+12,by+50);
  });
  ctx.textAlign='center';ctx.fillStyle='#2a2a2a';ctx.font='11px monospace';
  ctx.fillText('P1: WASD move | LClick light | RClick heavy | Q shield | LShift dash | E grab',W/2,H-14);
}

function drawCharSelect(){
  const gr=ctx.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#080818');gr.addColorStop(1,'#000000');ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
  // Header
  ctx.textAlign='center';ctx.font='bold 32px monospace';ctx.fillStyle='#fff';
  ctx.fillText('CHARACTER SELECT',W/2,40);
  ctx.font='13px monospace';ctx.fillStyle='#777';
  if(G.networkMode==='team4') ctx.fillText('Each player: left/right on phone to browse  |  jump/light to confirm',W/2,60);
  else if(G.networkMode==='test') ctx.fillText('A/D to browse  |  SPACE to confirm',W/2,60);
  else if(G.selectStep===0) ctx.fillText('P1: A/D to browse  |  SPACE to confirm',W/2,60);
  else ctx.fillText('P2: Arrow keys to browse  |  ENTER to confirm',W/2,60);

  // 4-player team mode: show all 4 player picks + team labels at top
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
      ctx.strokeStyle=done?col:'#333';ctx.lineWidth=done?2.5:1;
      ctx.strokeRect(px-24,py-2,48,40);
      const charSel=t4slots[s].sel<CHARS.length?t4slots[s].sel:0;
      ctx.save();ctx.translate(px,py+20);ctx.scale(0.95,0.95);drawCharacter(ctx,CHARS[charSel],CHARS[charSel].w,CHARS[charSel].h,null,true,0);ctx.restore();
      ctx.fillStyle=done?col:'#555';ctx.font='9px monospace';ctx.textAlign='center';
      ctx.fillText(t4slots[s].lbl+(done?' ✓':''),px,py+48);
      // Team label
      const teamCol=t4slots[s].team===1?'#3399ff':'#ff6644';
      ctx.fillStyle=teamCol;ctx.font='8px monospace';ctx.fillText(`T${t4slots[s].team}`,px,py-6);
    }
    // Team divider
    ctx.strokeStyle='#333';ctx.lineWidth=1;ctx.setLineDash([4,4]);
    ctx.beginPath();ctx.moveTo(W/2,76);ctx.lineTo(W/2,134);ctx.stroke();ctx.setLineDash([]);
  }
  const cw=285,cardH=230,gapX=14,gapY=12,cols=3;
  const totalW=cols*cw+(cols-1)*gapX;
  const sx2=(W-totalW)/2;
  const clipTop=(G.networkMode==='team4')?140:70,clipBot=H-10,visibleH=clipBot-clipTop;
  const maxSc=Math.max(0,(Math.ceil((CHARS.length+1)/3)-2)*(cardH+gapY)); // +1 for RANDOM card
  // Clipped scroll region
  ctx.save();
  ctx.beginPath();ctx.rect(0,clipTop,W,visibleH);ctx.clip();
  ctx.translate(0,-G.charScrollY);
  for(let i=0;i<CHARS.length;i++){
    const c=CHARS[i],row=Math.floor(i/cols),col=i%cols;
    const cx2=sx2+col*(cw+gapX),cy2=clipTop+2+row*(cardH+gapY);

    // Determine highlights for this card
    const isP1Sel=G.p1Sel===i,isP2Sel=G.p2Sel===i;
    const isSame=G.networkMode==='none'&&G.p1Confirmed&&G.p1Sel===i&&G.selectStep===1;
    rrFill(cx2,cy2,cw,cardH,10,isSame?'rgba(10,10,10,0.8)':'rgba(16,16,36,0.92)');
    let bc='#252535',bw3=1.5;
    if(G.networkMode==='team4'){
      const t4cols=['#3399ff','#ff6644','#44ddff','#ff9944'];
      const t4sels=[G.p1Sel,G.p2Sel,G.p3Sel,G.p4Sel];
      for(let s=0;s<4;s++){if(t4sels[s]===i){bc=t4cols[s];bw3=G.team4Done[s]?3.5:2.5;}}
    } else {
      if(G.p1Confirmed&&G.p1Sel===i){bc='#3399ff';bw3=3;}
      else if(G.selectStep===0&&isP1Sel){bc='#3399ff';bw3=3;}
      if(G.selectStep===1&&isP2Sel){bc='#ff6644';bw3=3;}
    }
    rrStroke(cx2,cy2,cw,cardH,10,bc,bw3);
    ctx.save();ctx.translate(cx2+cw/2,cy2+100);ctx.scale(isSame?0.8:1.6,isSame?0.8:1.6);ctx.globalAlpha=isSame?0.28:1;
    drawCharacter(ctx,c,c.w,c.h,null,true,Math.floor(G.frame/10)%4);ctx.globalAlpha=1;ctx.restore();
    ctx.fillStyle=isSame?'#444':c.eyeCol;ctx.font='bold 16px monospace';ctx.textAlign='center';ctx.fillText(c.name,cx2+cw/2,cy2+cardH-64);
    ctx.fillStyle='#666';ctx.font='10px monospace';ctx.fillText(c.tag,cx2+cw/2,cy2+cardH-50);
    ctx.textAlign='left';ctx.fillStyle='#777';ctx.font='10px monospace';
    for(let j=0;j<Math.min(c.desc.length,2);j++) ctx.fillText('- '+c.desc[j],cx2+10,cy2+cardH-34+j*14);
    ctx.textAlign='center';ctx.font='bold 11px monospace';
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
  // RANDOM card — rendered at the next grid position after all characters
  {
    const ri=CHARS.length, row=Math.floor(ri/cols), col=ri%cols;
    const rx=sx2+col*(cw+gapX), ry=clipTop+2+row*(cardH+gapY);
    const rSel=G.networkMode==='team4'?[G.p1Sel,G.p2Sel,G.p3Sel,G.p4Sel].includes(ri)
               :(G.selectStep===0?G.p1Sel===ri:G.p2Sel===ri);
    const pulse=Math.sin(G.frame*0.07)*0.18+0.82;
    rrFill(rx,ry,cw,cardH,10,'rgba(14,10,30,0.92)');
    rrStroke(rx,ry,cw,cardH,10,rSel?`rgba(255,200,0,${pulse})`:'#2a2a3a',rSel?3:1.5);
    // Animated question marks spinning
    ctx.save();ctx.translate(rx+cw/2,ry+cardH/2-20);
    const qAngle=Math.sin(G.frame*0.04)*0.2;ctx.rotate(qAngle);
    ctx.font='bold 72px monospace';ctx.textAlign='center';ctx.fillStyle=rSel?`rgba(255,200,0,${pulse})`:'#444';
    ctx.fillText('?',0,26);ctx.restore();
    ctx.fillStyle=rSel?'#ffcc00':'#aaa';ctx.font=`bold ${rSel?14:12}px monospace`;ctx.textAlign='center';
    ctx.fillText('RANDOM',rx+cw/2,ry+cardH-34);
    ctx.fillStyle='#555';ctx.font='10px monospace';
    ctx.fillText('Pick a surprise fighter!',rx+cw/2,ry+cardH-18);
    if(rSel){
      ctx.fillStyle='#ffcc00';ctx.font='bold 9px monospace';
      if(G.selectStep===0) ctx.fillText('P1',rx+cw/2,ry+16);
      else ctx.fillText('P2',rx+cw/2,ry+16);
    }
  }
  ctx.restore();
  // Scroll arrows
  if(maxSc>0){
    ctx.fillStyle='rgba(255,255,255,0.5)';ctx.font='20px monospace';ctx.textAlign='center';
    if(G.charScrollY>0)ctx.fillText('▲  scroll  ▲',W/2,clipTop+14);
    if(G.charScrollY<maxSc)ctx.fillText('▼  scroll  ▼',W/2,clipBot-4);
  }
}

function drawStageSelect(){
  const gr=ctx.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#080808');gr.addColorStop(1,'#050505');ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
  ctx.textAlign='center';ctx.font='bold 34px monospace';ctx.fillStyle='#fff';ctx.fillText('SELECT STAGE',W/2,40);
  ctx.font='12px monospace';ctx.fillStyle='#555';ctx.fillText('A/D or arrows to browse  |  W/S to scroll  |  SPACE or ENTER to start',W/2,60);
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
    const sbg=ctx.createLinearGradient(cx2,cy2,cx2,cy2+ch*0.6);sbg.addColorStop(0,st.bgT);sbg.addColorStop(1,st.bgB);
    rrPath(cx2,cy2,cw,ch,10);ctx.fillStyle=sbg;ctx.fill();
    const sc=0.18,ox=cx2+8,oy=cy2+22;
    const g=st.ground;rrFill(ox+g.x*sc,oy+g.y*sc,g.w*sc,g.h*sc,3,st.gCol);rrFill(ox+g.x*sc,oy+g.y*sc,g.w*sc,4,2,st.gTop);
    if(st.ferrisWheel){
      // Mini ferris wheel preview
      const wcx=ox+500*sc,wcy=oy+310*sc,wr=160*sc,wa=(G.frame*0.006)%(Math.PI*2);
      ctx.strokeStyle='#8899aa';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(wcx,wcy,wr,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='#556677';ctx.lineWidth=1;
      for(let k=0;k<6;k++){const ka=wa+(k/6)*Math.PI*2;ctx.beginPath();ctx.moveTo(wcx,wcy);ctx.lineTo(wcx+Math.cos(ka)*wr,wcy+Math.sin(ka)*wr);ctx.stroke();}
      ctx.fillStyle='#ffdd00';ctx.beginPath();ctx.arc(wcx,wcy,3,0,Math.PI*2);ctx.fill();
      const bulbCols=['#ff3355','#ffdd00','#33ffaa','#3399ff','#ff88ff','#ffaa33'];
      for(let k=0;k<6;k++){const ka=wa+(k/6)*Math.PI*2;ctx.fillStyle=bulbCols[k];ctx.beginPath();ctx.arc(wcx+Math.cos(ka)*wr,wcy+Math.sin(ka)*wr,2,0,Math.PI*2);ctx.fill();}
      // Platforms on wheel
      for(let k=0;k<6;k++){const ka=wa+(k/6)*Math.PI*2,px=wcx+Math.cos(ka)*wr-80*sc/2,py=wcy+Math.sin(ka)*wr-60*sc/2;rrFill(px,py,80*sc,60*sc,1,st.pCol);}
    } else if(st.jungle){
      // Mini jungle preview: 2 edge trees + canopies + vine bridges
      const edgeT=[{cx:30,top:80},{cx:970,top:60}];
      for(const t of edgeT){
        ctx.fillStyle='rgba(8,28,5,0.85)';ctx.fillRect(ox+(t.cx-17)*sc,oy+t.top*sc,34*sc,(600-t.top)*sc);
        ctx.fillStyle='rgba(6,40,4,0.9)';ctx.beginPath();ctx.ellipse(ox+t.cx*sc,oy+(t.top+10)*sc,55*sc,42*sc,0,0,Math.PI*2);ctx.fill();
      }
      for(const sg of (st.grounds||[])){rrFill(ox+sg.x*sc,oy+sg.y*sc,sg.w*sc,sg.h*sc,2,st.gCol);}
      for(const pl of st.plats){rrFill(ox+pl.x*sc,oy+pl.y*sc,pl.w*sc,pl.h*sc,1,st.pCol);}
    } else if(st.neocity){
      // Mini preview: draw building bodies from rooftop down to card bottom, then glowing rooftop trim
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
    rrStroke(cx2,cy2,cw,ch,10,sel?st.aCol:'#2a2a2a',sel?3:1.5);
    ctx.fillStyle=sel?st.aCol:'#bbb';ctx.font=`bold ${sel?13:11}px monospace`;ctx.textAlign='center';
    ctx.fillText(st.name,cx2+cw/2,cy2+ch-36);
    ctx.fillStyle='#555';ctx.font='9px monospace';ctx.fillText(st.desc,cx2+cw/2,cy2+ch-22);
    if(sel){ctx.fillStyle=st.aCol;ctx.font='bold 9px monospace';ctx.fillText('[ SELECTED ]',cx2+cw/2,cy2+ch-9);}
  }
  // RANDOM stage card
  {
    const ri=STAGES.length, col=ri%cols, row=Math.floor(ri/cols);
    const rx=sx+col*(cw+gapX), ry=clipTop+row*(ch+gapY), rSel=G.stageSel===ri;
    const pulse=Math.sin(G.frame*0.07)*0.18+0.82;
    const rbg=ctx.createLinearGradient(rx,ry,rx,ry+ch*0.6);rbg.addColorStop(0,'#0d0020');rbg.addColorStop(1,'#1a003a');
    rrPath(rx,ry,cw,ch,10);ctx.fillStyle=rbg;ctx.fill();
    ctx.save();ctx.translate(rx+cw/2,ry+ch/2-22);
    ctx.rotate(Math.sin(G.frame*0.04)*0.15);
    ctx.font='bold 54px monospace';ctx.textAlign='center';ctx.fillStyle=rSel?`rgba(255,200,0,${pulse})`:'#333';
    ctx.fillText('?',0,20);ctx.restore();
    rrStroke(rx,ry,cw,ch,10,rSel?`rgba(255,200,0,${pulse})`:'#2a2a2a',rSel?3:1.5);
    ctx.fillStyle=rSel?'#ffcc00':'#bbb';ctx.font=`bold ${rSel?13:11}px monospace`;ctx.textAlign='center';
    ctx.fillText('RANDOM',rx+cw/2,ry+ch-36);
    ctx.fillStyle='#555';ctx.font='9px monospace';ctx.fillText('Let fate decide the arena!',rx+cw/2,ry+ch-22);
    if(rSel){ctx.fillStyle='#ffcc00';ctx.font='bold 9px monospace';ctx.fillText('[ SELECTED ]',rx+cw/2,ry+ch-9);}
  }
  ctx.restore();
  // Scroll arrows
  if(maxSc>0){
    ctx.fillStyle='rgba(255,255,255,0.45)';ctx.font='20px monospace';ctx.textAlign='center';
    if(G.stageScrollY>0) ctx.fillText('▲  scroll  ▲',W/2,clipTop+14);
    if(G.stageScrollY<maxSc) ctx.fillText('▼  scroll  ▼',W/2,clipBot-4);
  }
  {
    const p1c=CHARS[G.p1Sel],p2c=G.networkMode==='test'?DUMMY_CHAR:CHARS[G.p2Sel];
    ctx.font='bold 13px monospace';ctx.textAlign='left';ctx.fillStyle=p1c.color;ctx.fillText(`P1: ${p1c.name}`,18,H-14);
    ctx.textAlign='right';ctx.fillStyle=p2c.color;ctx.fillText(G.networkMode==='test'?'P2: DUMMY':`P2: ${p2c.name}`,W-18,H-14);
  }
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
