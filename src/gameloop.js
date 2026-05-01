import { ctx, W, H, bullets, miniSwords, rocketArms, rocketMines, smokeClouds, unstableHeads, knives, throwSwords, firePebbles, pristineRockets, factoryBolts, factoryGears, factoryZaps, smallRocks, particles } from './globals.js';
import { G } from './globals.js';
import { CHARS, DUMMY_CHAR } from './characters/index.js';
import { STAGES } from './stages/index.js';
import { Player } from './player/index.js';
import { Boulder } from './projectiles/boulder.js';
import { SmallRock } from './projectiles/smallrock.js';
import { updateParticles, drawParticles } from './particles.js';
import { playLobbyMusic, playStageMusic, stopBgMusic } from './audio.js';
import { pollGamepads, getInputForPn, initPhoneController, clearPendingFlags, keys } from './input.js';
import { drawStageBG, drawStageGeom } from './stages/index.js';
import { drawModeSelect, drawCharSelect, drawStageSelect, drawGameOver } from './menu.js';

function startGame(){
  G.curStage=STAGES[G.stageSel];
  const clr=()=>{G.winner='';G.gameState='game';G.frame=0;particles.length=0;bullets.length=0;miniSwords.length=0;rocketArms.length=0;rocketMines.length=0;smokeClouds.length=0;unstableHeads.length=0;knives.length=0;throwSwords.length=0;firePebbles.length=0;factoryBolts.length=0;factoryGears.length=0;factoryZaps.length=0;G.shakeX=0;G.shakeY=0;G.boulder=null;smallRocks.length=0;};
  if(G.networkMode==='team4'){
    // 4 spawn points: spread evenly across the stage
    const stageW=G.curStage.ground.w||1000;
    const baseX=G.curStage.ground.x||0;
    const spawnXs=[baseX+stageW*0.18,baseX+stageW*0.38,baseX+stageW*0.62,baseX+stageW*0.82];
    const sels=[G.p1Sel,G.p2Sel,G.p3Sel,G.p4Sel];
    // Teams: P1&P3 = team 1, P2&P4 = team 2
    const teams=[1,2,1,2];
    G.players=sels.map((sel,i)=>{
      const p=new Player(CHARS[sel],spawnXs[i],i+1,false);
      p.localInputSlot=i+1;
      p.team=teams[i];
      p.facing=teams[i]===1?1:-1;
      return p;
    });
  } else {
    const p1c=CHARS[G.p1Sel],p2c=G.networkMode==='test'?DUMMY_CHAR:CHARS[G.p2Sel];
    G.players=[new Player(p1c,G.curStage.spawnX[0],1,false),new Player(p2c,G.curStage.spawnX[1],2,G.networkMode==='test')];
    G.players[1].facing=-1;
    G.players[0].localInputSlot=1; G.players[1].localInputSlot=2;
  }
  clr();
  G.boulder = new Boulder(W/2, H/2);
}

function updateGame(){
  // Rotate ferris wheel platforms for THE CARNIVAL stage
  if(G.curStage&&G.curStage.ferrisWheel){
    G.carnivalAngle+=0.006;
    const cx=500,cy=310,r=160,pw=80,ph=60;
    for(let i=0;i<6;i++){
      const a=G.carnivalAngle+(i/6)*Math.PI*2;
      G.curStage.plats[i].x=cx+Math.cos(a)*r-pw/2;
      G.curStage.plats[i].y=cy+Math.sin(a)*r-ph/2;
    }
  }
  // Collect all inputs
  const inputs=G.players.map((_,i)=>getInputForPn(i+1));
  // Update G.players
  {
    if(G.networkMode==='team4'){
      // 4-player local: each player gets all others as opponents
      for(let i=0;i<G.players.length;i++){
        G.players[i].update(inputs[i],G.curStage,G.players.filter((_,j)=>j!==i));
      }
      for(const p of G.players)p.checkKill();
    } else {
      G.players[0].update(inputs[0],G.curStage,[G.players[1]]);
      G.players[1].update(inputs[1],G.curStage,[G.players[0]]);
      G.players[0].checkKill();G.players[1].checkKill();
    }
  }
  // Projectiles
  {
    for(let i=bullets.length-1;i>=0;i--){bullets[i].update(G.players);if(bullets[i].dead)bullets.splice(i,1);}
    for(let i=miniSwords.length-1;i>=0;i--){miniSwords[i].update(G.players,G.curStage);if(miniSwords[i].dead)miniSwords.splice(i,1);}
    for(let i=rocketArms.length-1;i>=0;i--){rocketArms[i].update(G.players);if(rocketArms[i].dead)rocketArms.splice(i,1);}
    for(let i=rocketMines.length-1;i>=0;i--){rocketMines[i].update(G.players);if(rocketMines[i].dead)rocketMines.splice(i,1);}
    for(let i=smokeClouds.length-1;i>=0;i--){smokeClouds[i].update(G.players);if(smokeClouds[i].dead)smokeClouds.splice(i,1);}
    for(let i=unstableHeads.length-1;i>=0;i--){unstableHeads[i].update(G.players);if(unstableHeads[i].dead)unstableHeads.splice(i,1);}
    for(let i=knives.length-1;i>=0;i--){knives[i].update(G.players);if(knives[i].dead)knives.splice(i,1);}
    for(let i=throwSwords.length-1;i>=0;i--){throwSwords[i].update(G.players);if(throwSwords[i].dead)throwSwords.splice(i,1);}
    for(let i=firePebbles.length-1;i>=0;i--){firePebbles[i].update(G.players);if(firePebbles[i].dead)firePebbles.splice(i,1);}
    for(let i=pristineRockets.length-1;i>=0;i--){pristineRockets[i].update(G.players);if(pristineRockets[i].dead)pristineRockets.splice(i,1);}
    for(let i=factoryBolts.length-1;i>=0;i--){factoryBolts[i].update(G.players);if(factoryBolts[i].dead)factoryBolts.splice(i,1);}
    for(let i=factoryGears.length-1;i>=0;i--){factoryGears[i].update(G.players);if(factoryGears[i].dead)factoryGears.splice(i,1);}
    for(let i=factoryZaps.length-1;i>=0;i--){factoryZaps[i].update(G.players);if(factoryZaps[i].dead)factoryZaps.splice(i,1);}
    // Boulder + small rocks
    if(G.boulder){
      G.boulder.update();
      if(G.boulder.dead) G.boulder=null;
    }
    for(let i=smallRocks.length-1;i>=0;i--){smallRocks[i].update(G.players);if(smallRocks[i].dead)smallRocks.splice(i,1);}
    // Boulder respawns at center once all small rocks are gone
    if(!G.boulder&&smallRocks.length===0) G.boulder=new Boulder(W/2,H/2);
  }
  updateParticles();
  if(G.networkMode==='test'&&keys['KeyR']){G.players[1].damage=0;G.players[1].dead=false;G.players[1].x=G.curStage.spawnX[1]-G.players[1].w/2;G.players[1].y=150;G.players[1].vx=0;G.players[1].vy=0;}
  // Win condition
  if(G.networkMode==='team4'){
    const team1Alive=G.players.some(p=>p.team===1&&p.stocks>0);
    const team2Alive=G.players.some(p=>p.team===2&&p.stocks>0);
    if(!team1Alive||!team2Alive){
      if(!team1Alive&&!team2Alive)G.winner='Draw!';
      else if(!team1Alive)G.winner='Team 2 Wins! (P2 & P4)';
      else G.winner='Team 1 Wins! (P1 & P3)';
      G.gameState='gameOver';G.gameOverTimer=180;
    }
  } else {
    if(G.players[0].stocks<=0||G.players[1].stocks<=0){
      if(G.players[0].stocks<=0&&G.players[1].stocks<=0)G.winner='Draw!';
      else if(G.players[0].stocks<=0)G.winner=G.networkMode==='test'?'Dummy Wins?!':`P2 (${G.players[1].ch.name}) Wins!`;
      else G.winner=`P1 (${G.players[0].ch.name}) Wins!`;
      G.gameState='gameOver';G.gameOverTimer=180;
    }
  }
}

function resetMenu(){
  stopBgMusic();
  G.gameState='modeSelect';G.selectStep=0;G.p1Sel=0;G.p2Sel=1;G.p3Sel=2;G.p4Sel=3;G.stageSel=0;G.p1Confirmed=false;G.charScrollY=0;G.stageScrollY=0;
  G.team4Done=[false,false,false,false];
  G.confirmedChars={};
  G.networkMode='none';
  bullets.length=0;particles.length=0;miniSwords.length=0;rocketArms.length=0;rocketMines.length=0;smokeClouds.length=0;unstableHeads.length=0;knives.length=0;throwSwords.length=0;firePebbles.length=0;pristineRockets.length=0;factoryBolts.length=0;factoryGears.length=0;factoryZaps.length=0;G.boulder=null;smallRocks.length=0;
}

// ---- Main Loop ----
function loop(){
  G.frame++;
  pollGamepads();
  ctx.clearRect(0,0,W,H);
  if(G.gameState==='modeSelect'||G.gameState==='charSelect'||G.gameState==='stageSelect') playLobbyMusic();
  if(G.gameState==='modeSelect') drawModeSelect();
  else if(G.gameState==='charSelect') drawCharSelect();
  else if(G.gameState==='stageSelect') drawStageSelect();
  else if(G.gameState==='game'){
    playStageMusic(G.curStage);
    updateGame();
    ctx.save();ctx.translate(G.shakeX,G.shakeY);
    ctx.translate(W/2,H/2);ctx.scale(0.692,0.9);ctx.translate(-W/2,-H/2);
    drawStageBG(G.curStage);drawStageGeom(G.curStage);
    for(const ms of miniSwords)ms.draw();
    for(const a of rocketArms)a.draw();
    for(const m of rocketMines)m.draw();
    for(const sc of smokeClouds)sc.draw();
    for(const uh of unstableHeads)uh.draw();
    for(const k of knives)k.draw();
    for(const ts of throwSwords)ts.draw();
    for(const fp of firePebbles)fp.draw();
    for(const pr of pristineRockets)pr.draw();
    for(const fz of factoryZaps)fz.draw();
    for(const fg of factoryGears)fg.draw();
    for(const fb of factoryBolts)fb.draw();
    for(const b of bullets)b.draw();
    if(G.boulder)G.boulder.draw();
    for(const sr of smallRocks)sr.draw();
    for(const p of G.players)p.draw();
    drawParticles();ctx.restore();
    for(const p of G.players)p.drawOffScreenIndicator();
    if(G.networkMode==='team4'){
      // Team 1 (P1,P3) on left; Team 2 (P2,P4) on right
      G.players[0].drawHUD('left',0);G.players[2].drawHUD('left',1);
      G.players[1].drawHUD('right',0);G.players[3].drawHUD('right',1);
      // Team label banners
      ctx.font='bold 11px monospace';ctx.textAlign='left';
      ctx.fillStyle='rgba(51,153,255,0.6)';ctx.fillText('TEAM 1',14,H-6);
      ctx.textAlign='right';ctx.fillStyle='rgba(255,102,68,0.6)';ctx.fillText('TEAM 2',W-14,H-6);
    } else {
      G.players[0].drawHUD('left');G.players[1].drawHUD('right');
    }
    ctx.fillStyle='rgba(255,255,255,0.25)';ctx.font='10px monospace';ctx.textAlign='center';
    if(G.networkMode==='test') ctx.fillText('WASD+Mouse  |  Q: shield  |  E: grab  |  R: reset dummy  |  ESC: exit',W/2,H-6);
    else if(G.networkMode==='team4') {/* team labels drawn above */}
    else ctx.fillText('P1: WASD+LClick+RClick(charge)+LShift(dash)+Q(shield)+E(grab)  |  P2: Arrows+[/](charge)+RShift(dash)+/(shield)+. (grab)',W/2,H-6);
  }
  else if(G.gameState==='gameOver'){if(G.gameOverTimer>0)G.gameOverTimer--;drawGameOver();}

  G.p1JumpPend=false;G.p2JumpPend=false;G.p3JumpPend=false;G.p4JumpPend=false;
  G.p1LightPend=false;G.p1HeavyPend=false;G.p2LightPend=false;G.p2HeavyPend=false;G.p3LightPend=false;G.p3HeavyPend=false;G.p4LightPend=false;G.p4HeavyPend=false;
  G.p1ShieldPend=false;G.p2ShieldPend=false;G.p3ShieldPend=false;G.p4ShieldPend=false;
  G.p1DashPend=false;G.p2DashPend=false;G.p3DashPend=false;G.p4DashPend=false;
  G.p1HeavyRelease=false;G.p2HeavyRelease=false;G.p3HeavyRelease=false;G.p4HeavyRelease=false;
  requestAnimationFrame(loop);
}
initPhoneController();
loop();
G.startGame = startGame;
G.resetMenu = resetMenu;

export { startGame };
