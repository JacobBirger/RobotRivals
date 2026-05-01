// One-time splitting script. Run with: node src/_split.js
// Reads src/_extracted.js (the raw script from index.html) and writes all module files.
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '_extracted.js'), 'utf8');
const lines = src.split('\n');

function L(from, to) { return lines.slice(from - 1, to).join('\n'); }
function write(file, content) {
  const full = path.join(__dirname, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  console.log('wrote', file);
}

// ─── globals.js is already hand-written ─────────────────────────────────────

// ─── audio.js ───────────────────────────────────────────────────────────────
write('audio.js', `// Audio: music, SFX, kbScale
${L(6246, 6375)}
export { playLobbyMusic, playStageMusic, stopBgMusic, kbScale, playSfx, playSfxNoise, sfxSwing, sfxHit };
`);

// ─── particles.js ────────────────────────────────────────────────────────────
write('particles.js', `// Particle system + screen shake
import { ctx, particles, addShake, decayShake } from './globals.js';
${L(513, 565).replace(/^function /gm, 'export function ')}
`);

// ─── projectiles/bullet.js ───────────────────────────────────────────────────
write('projectiles/bullet.js', `import { ctx, W, H, sameTeam, addShake } from '../globals.js';
import { addHitParticles, instakill } from '../particles.js';
import { kbScale, MAX_KB, DEATH_THRESHOLD } from '../player/constants.js';
export const bullets = [];
${L(271, 331)}
`);

// ─── player/constants.js ─────────────────────────────────────────────────────
write('player/constants.js', `// Physics and game-rule constants
${L(803, 821).replace(/^const /gm, 'export const ')}
`);

// ─── characters raw data lines (for reference in split below)  ───────────────
// CHARS array: lines 334-432; DUMMY_CHAR: 435-441

// Individual character data + logic
const charBlocks = {
  bolt:     { id: 0,  dataLine: [335, 340],  updateLines: null,               atkFramesLines: null,    hitboxLines: null,        respawnLines: null,    drawFunc: 'drawBolt',     drawLines: [4757, 4781] },
  crusher:  { id: 1,  dataLine: [341, 346],  updateLines: [1460, 1464],       atkFramesLines: null,    hitboxLines: null,        respawnLines: [2172,2172], drawFunc: 'drawCrusher',  drawLines: [4783, 4818] },
  zippy:    { id: 2,  dataLine: [347, 352],  updateLines: null,               atkFramesLines: null,    hitboxLines: null,        respawnLines: null,    drawFunc: 'drawZippy',    drawLines: [4820, 4849] },
  blaster:  { id: 3,  dataLine: [353, 360],  updateLines: [1109, 1125],       atkFramesLines: [1743,1747], hitboxLines: [1895,1899], respawnLines: null, drawFunc: 'drawBlaster',  drawLines: [4851, 4893] },
  edge:     { id: 4,  dataLine: [361, 366],  updateLines: [1523, 1532],       atkFramesLines: [1767,1769], hitboxLines: [1946,1970], respawnLines: null, drawFunc: 'drawEdge',     drawLines: [4895, 4957] },
  pierce:   { id: 5,  dataLine: [367, 372],  updateLines: null,               atkFramesLines: null,    hitboxLines: [1947,1951], respawnLines: null,    drawFunc: 'drawPierce',   drawLines: [4959, 5017] },
  rocket:   { id: 6,  dataLine: [373, 378],  updateLines: [1127, 1130],       atkFramesLines: [1729,1734], hitboxLines: [1900,1900], respawnLines: [2173,2173], drawFunc: null, drawLines: null },
  unstable: { id: 7,  dataLine: [385, 390],  updateLines: [1183, 1220],       atkFramesLines: [1720,1727], hitboxLines: [1931,1943], respawnLines: null, drawFunc: 'drawUnstable', drawLines: [5214, 5452] },
  blade:    { id: 8,  dataLine: [379, 384],  updateLines: [1132, 1181],       atkFramesLines: [1711,1718], hitboxLines: [1901,1930], respawnLines: null, drawFunc: 'drawBlade',    drawLines: [5082, 5212] },
  pristine: { id: 10, dataLine: [391, 397],  updateLines: [1222, 1271],       atkFramesLines: [1736,1741], hitboxLines: [1800,1800], respawnLines: [2174,2174], drawFunc: 'drawPristine', drawLines: [5454, 5519] },
  magma:    { id: 11, dataLine: [398, 404],  updateLines: [1274, 1347],       atkFramesLines: [1749,1756], hitboxLines: [1883,1894], respawnLines: [2175,2175], drawFunc: 'drawMagma',    drawLines: [3689, 3837] },
  factory:  { id: 12, dataLine: [405, 411],  updateLines: [1350, 1409],       atkFramesLines: [1758,1765], hitboxLines: [1801,1818], respawnLines: [2176,2176], drawFunc: 'drawFactory',  drawLines: [3839, 4070] },
  glitch:   { id: 13, dataLine: [412, 419],  updateLines: [1472, 1521],       atkFramesLines: [1780,1791], hitboxLines: [1819,1844], respawnLines: [2177,2177], drawFunc: 'drawGlitch',   drawLines: [4072, 4299] },
  king:     { id: 14, dataLine: [420, 432],  updateLines: [1412, 1457],       atkFramesLines: [1771,1778], hitboxLines: [1845,1882], respawnLines: [2178,2178], drawFunc: 'drawKing',     drawLines: [4301, 4743] },
  dummy:    { id: 9,  dataLine: [435, 441],  updateLines: null,               atkFramesLines: null,    hitboxLines: null,        respawnLines: null,    drawFunc: 'drawDummy',    drawLines: [4745, 4755] },
};

const sharedImports = `import { ctx, frame, W, H, bullets, miniSwords, rocketArms, rocketMines, smokeClouds, unstableHeads, knives, throwSwords, firePebbles, pristineRockets, factoryBolts, factoryGears, factoryZaps, particles, aabb, sameTeam, addShake, shakeX, shakeY } from '../globals.js';
import { addHitParticles, addDeathExplosion, instakill } from '../particles.js';
import { kbScale, MAX_KB, DEATH_THRESHOLD, FLY_ACCEL, MAX_FLY_SPEED, FLY_FRIC, DASH_FRAMES, DASH_MULT } from '../player/constants.js';
import { playSfx, playSfxNoise } from '../audio.js';
`;

for (const [name, info] of Object.entries(charBlocks)) {
  const dataSrc = L(info.dataLine[0], info.dataLine[1]);
  // Wrap the raw object literal as an export
  const charExport = `export const char = ${dataSrc.trim().replace(/^,?\s*\{/, '{').replace(/\},?\s*$/, '}')};`;

  const updateSrc  = info.updateLines  ? `export function onUpdate(player, inp, opps) {\n  const self = player;\n${L(info.updateLines[0], info.updateLines[1])}\n}` : 'export function onUpdate(player, inp, opps) {}';
  const atkSrc     = info.atkFramesLines ? `export function getAtkFrames(type, dir, comboN, player) {\n  const c = player.ch;\n${L(info.atkFramesLines[0], info.atkFramesLines[1])}\n  return null;\n}` : 'export function getAtkFrames(type, dir, comboN, player) { return null; }';
  const hbSrc      = info.hitboxLines ? `export function getHitbox(a, x, y, w, h, facing, player) {\n  const self = player;\n${L(info.hitboxLines[0], info.hitboxLines[1])}\n  return null;\n}` : 'export function getHitbox(a, x, y, w, h, facing, player) { return null; }';
  const respawnSrc = info.respawnLines ? `export function onRespawn(player) {\n  const self = player;\n${L(info.respawnLines[0], info.respawnLines[1])}\n}` : 'export function onRespawn(player) {}';
  const drawSrc    = info.drawLines ? L(info.drawLines[0], info.drawLines[1]).replace(`function ${info.drawFunc}`, `export function draw`) : `export function draw(ctx, ch, w, h, atk, grounded, wf, extra) {}`;

  write(`characters/${name}.js`, `${sharedImports}\n${charExport}\n\n${atkSrc}\n\n${hbSrc}\n\n${updateSrc}\n\n${respawnSrc}\n\n${drawSrc}\n`);
}

// ─── characters/index.js ─────────────────────────────────────────────────────
const charNames = ['bolt','crusher','zippy','blaster','edge','pierce','rocket','unstable','blade','dummy','pristine','magma','factory','glitch','king'];
const importLines = charNames.map(n => `import * as _${n} from './${n}.js';`).join('\n');
const charsArray = charNames.filter(n => n !== 'dummy').map(n => `_${n}.char`).join(',\n  ');
write('characters/index.js', `${importLines}
export const CHARS = [\n  ${charsArray}\n];
export const DUMMY_CHAR = _dummy.char;
export const charModules = { ${charNames.map(n => `${n}: _${n}`).join(', ')} };
`);

// ─── stages ──────────────────────────────────────────────────────────────────
// Stage data lines (each stage is a single-line object in STAGES array)
// We'll just export all stage data as one block and individual draw functions
const stageNames = ['foundry','orbital','scrapyard','neoncity','arctic','cloudtemple','moltencore','datarealm','carnival','jungle','skytemple','neocity2'];
const stageIds   = [0,1,2,3,4,5,6,7,8,9,10,11];

// Extract the full drawStageBG function and split by stage id cases
const bgFull = L(5523, 6132);
// Extract individual case blocks from the giant if/else chain
// We'll write stages/index.js with the full drawStageBG extracted and re-exported
write('stages/drawStageBG.js', `import { ctx, W, H, frame, curStage, carnivalAngle } from '../globals.js';
${bgFull.replace('function drawStageBG', 'export function drawStageBG')}
${L(6134, 6228).replace(/^function /gm, 'export function ')}
${L(6229, 6241).replace(/^function /gm, 'export function ')}
`);

// Stage data: one file per stage
const stageDataBlock = L(448, 507); // all stage entries
// We'll extract each stage's data by matching id
for (let i = 0; i < stageIds.length; i++) {
  const id = stageIds[i];
  const name = stageNames[i];
  // Find the object for this stage id in the data block
  const match = stageDataBlock.match(new RegExp(`\\{[^{}]*id:${id}[^{}]*\\}`, 's'));
  if (match) {
    write(`stages/${name}.js`, `export const stage = ${match[0]};\n`);
  }
}

write('stages/index.js', `${stageNames.map(n=>`import { stage as _${n} } from './${n}.js';`).join('\n')}
export const STAGES = [${stageNames.map(n=>`_${n}`).join(', ')}];
export { drawStageBG, drawStageGeom, drawFerrisWheel, drawJungleTrees, drawNeoBuildings, drawGear } from './drawStageBG.js';
`);

// ─── projectile files per character ──────────────────────────────────────────
const projImports = `import { ctx, frame, W, H, players, bullets, particles, aabb, sameTeam, addShake, shakeX, shakeY } from '../globals.js';
import { addHitParticles, addDeathExplosion, instakill } from '../particles.js';
import { kbScale, MAX_KB, DEATH_THRESHOLD } from '../player/constants.js';
import { playSfx, playSfxNoise } from '../audio.js';
`;

// Rocket projectiles: RocketArm, RocketMine, explodeMines  — lines 2569-2689
write('characters/rocket_projectiles.js', `${projImports}
export const rocketArms = [];
export const rocketMines = [];
${L(2571, 2689)}
`);

// Unstable projectiles: SmokeCloud, UnstableHead — lines 3504-3599
write('characters/unstable_projectiles.js', `${projImports}
export const smokeClouds = [];
export const unstableHeads = [];
${L(3504, 3599)}
`);

// Blade projectiles: Knife, ThrowSword + FirePebble (shared by Magma) — 2841-3057
write('characters/blade_projectiles.js', `${projImports}
export const knives = [];
export const throwSwords = [];
export const firePebbles = [];
${L(2841, 3057)}
`);

// Pristine projectiles: PristineRocket — 3411-3499
write('characters/pristine_projectiles.js', `${projImports}
export const pristineRockets = [];
${L(3412, 3499)}
`);

// Factory projectiles: drawGearShape, FactoryBolt, FactoryGear, FactoryZap — 2693-2833
write('characters/factory_projectiles.js', `${projImports}
export const factoryBolts = [];
export const factoryGears = [];
export const factoryZaps = [];
${L(2693, 2833)}
`);

// Edge projectiles: MiniSword — 3603-3668
write('characters/edge_projectiles.js', `${projImports}
export const miniSwords = [];
${L(3603, 3668)}
`);

// Boulder + SmallRock — 3059-3408
write('projectiles/boulder.js', `import { ctx, frame, W, H, curStage, players, smallRocks, particles, addShake, shakeX, shakeY } from '../globals.js';
import { addDeathExplosion, addHitParticles, instakill } from '../particles.js';
import { BOULDER_RADIUS, SMALL_ROCK_RADIUS, SMALL_ROCK_DMG, THROW_BOOST, THROW_FORWARD_SPEED, DEATH_THRESHOLD, MAX_KB, kbScale } from '../player/constants.js';
${L(3059, 3275).replace('class Boulder', 'export class Boulder')}
`);
write('projectiles/smallrock.js', `import { ctx, frame, W, H, players, particles, addShake } from '../globals.js';
import { addHitParticles, instakill } from '../particles.js';
import { SMALL_ROCK_RADIUS, SMALL_ROCK_DMG, THROW_BOOST, THROW_FORWARD_SPEED, DEATH_THRESHOLD, MAX_KB, kbScale } from '../player/constants.js';
import { VIS_LEFT, VIS_RIGHT, VIS_TOP, VIS_BOT } from '../player/constants.js';
${L(3277, 3408).replace('class SmallRock', 'export class SmallRock')}
`);

// ─── player/constants.js already written above ───────────────────────────────
// Overwrite with complete version including kbScale
write('player/constants.js', `// Physics and game-rule constants
export const FLY_ACCEL=0.55, MAX_FLY_SPEED=14, FLY_FRIC=0.985;
export const GRAB_RANGE=50, GRAB_LOCKOUT_FRAMES=60, GRAB_AUTO_RELEASE_FRAMES=120, GRAB_WHIFF_CD=24;
export const SHIELD_FRAMES=15, SHIELD_COOLDOWN=120;
export const DASH_FRAMES=9, DASH_COOLDOWN=38, DASH_MULT=5.2;
export const MAX_KB=20;
export const DEATH_THRESHOLD=150;
export const OFF_SCREEN_KILL_FRAMES=60;
export const CAM_SCALE_X=0.692, CAM_SCALE_Y=0.9;
export const VIS_LEFT  = (0 - 500)/0.692 + 500;
export const VIS_RIGHT = (1000 - 500)/0.692 + 500;
export const VIS_TOP   = (0 - 300)/0.9 + 300;
export const VIS_BOT   = (600 - 300)/0.9 + 300;
export const BOULDER_RADIUS=75;
export const SMALL_ROCK_RADIUS=25;
export const SMALL_ROCK_DMG=20;
export const THROW_BOOST=10;
export const THROW_FORWARD_SPEED=14;
export function kbScale(dmg) {
  const base = 1 + dmg / 95;
  if (dmg <= 100) return base;
  return base * Math.pow(1.03, dmg - 100);
}
`);

// ─── player/index.js — the Player class ──────────────────────────────────────
const playerClass = L(823, 2565);
write('player/index.js', `import { ctx, frame, W, H, keys, players, bullets, miniSwords, rocketArms, rocketMines, smokeClouds, unstableHeads, knives, throwSwords, firePebbles, pristineRockets, factoryBolts, factoryGears, factoryZaps, particles, smallRocks, boulder, aabb, sameTeam, rrFill, rrStroke, addShake, shakeX, shakeY } from '../globals.js';
import { addHitParticles, addDeathExplosion, instakill } from '../particles.js';
import { kbScale, MAX_KB, DEATH_THRESHOLD, FLY_ACCEL, MAX_FLY_SPEED, FLY_FRIC, GRAB_RANGE, GRAB_LOCKOUT_FRAMES, GRAB_AUTO_RELEASE_FRAMES, GRAB_WHIFF_CD, SHIELD_FRAMES, SHIELD_COOLDOWN, DASH_FRAMES, DASH_COOLDOWN, DASH_MULT, OFF_SCREEN_KILL_FRAMES, CAM_SCALE_X, CAM_SCALE_Y, VIS_LEFT, VIS_RIGHT, VIS_TOP, VIS_BOT, BOULDER_RADIUS, SMALL_ROCK_RADIUS, SMALL_ROCK_DMG, THROW_BOOST, THROW_FORWARD_SPEED } from './constants.js';
import { playSfx, playSfxNoise, sfxSwing, sfxHit } from '../audio.js';
import { charModules } from '../characters/index.js';
import { drawCharacter, drawAttackArc } from './draw.js';

${playerClass.replace('class Player', 'export class Player')}
`);

// ─── player/draw.js — drawCharacter + drawAttackArc ──────────────────────────
const drawCharFn   = L(3671, 3687);
const drawArcFn    = L(581, 799);
// Also need drawRocket and drawPierce which are between drawBlaster and drawEdge
const drawRocketFn = L(5019, 5080);
write('player/draw.js', `import { ctx, frame, W, H, rrFill, rrStroke } from '../globals.js';
import { char as _bolt }     from '../characters/bolt.js';
import { char as _crusher }  from '../characters/crusher.js';
import { char as _zippy }    from '../characters/zippy.js';
import { char as _blaster }  from '../characters/blaster.js';
import { char as _edge }     from '../characters/edge.js';
import { char as _pierce }   from '../characters/pierce.js';
import { char as _rocket }   from '../characters/rocket.js';
import { char as _unstable } from '../characters/unstable.js';
import { char as _blade }    from '../characters/blade.js';
import { char as _dummy }    from '../characters/dummy.js';
import { char as _pristine } from '../characters/pristine.js';
import { char as _magma }    from '../characters/magma.js';
import { char as _factory }  from '../characters/factory.js';
import { char as _glitch }   from '../characters/glitch.js';
import { char as _king }     from '../characters/king.js';
import { draw as drawBolt }     from '../characters/bolt.js';
import { draw as drawCrusher }  from '../characters/crusher.js';
import { draw as drawZippy }    from '../characters/zippy.js';
import { draw as drawBlaster }  from '../characters/blaster.js';
import { draw as drawEdge }     from '../characters/edge.js';
import { draw as drawPierce }   from '../characters/pierce.js';
import { draw as drawUnstable } from '../characters/unstable.js';
import { draw as drawBlade }    from '../characters/blade.js';
import { draw as drawDummy }    from '../characters/dummy.js';
import { draw as drawPristine } from '../characters/pristine.js';
import { draw as drawMagma }    from '../characters/magma.js';
import { draw as drawFactory }  from '../characters/factory.js';
import { draw as drawGlitch }   from '../characters/glitch.js';
import { draw as drawKing }     from '../characters/king.js';

${drawRocketFn.replace('function drawRocket', 'function drawRocket')}

${drawCharFn.replace('function drawCharacter', 'export function drawCharacter')}

${drawArcFn.replace('function drawAttackArc', 'export function drawAttackArc')}
`);

// ─── menu.js ─────────────────────────────────────────────────────────────────
const menuFns = L(6385, 6693);
write('menu.js', `import { ctx, W, H, frame, CHARS, STAGES, rrFill, rrStroke, gameState, setGameState, networkMode, setNetworkMode, p1Sel, p2Sel, p3Sel, p4Sel, stageSel, p1Confirmed, team4Done, charScrollY, stageScrollY, confirmedChars, selectStep, setP1Sel, setP2Sel, setP3Sel, setP4Sel, setStageSel, setP1Confirmed, setTeam4Done, setCharScrollY, setSelectStep, setConfirmedChars } from './globals.js';
import { CHARS as CHARS_ARR } from './characters/index.js';
import { STAGES as STAGES_ARR } from './stages/index.js';
import { startGame } from './gameloop.js';

const CHARS = CHARS_ARR;
const STAGES = STAGES_ARR;

${menuFns.replace(/^function /gm, 'export function ')}
`);

// ─── gameloop.js ─────────────────────────────────────────────────────────────
const gameLogic = L(6696, 6864);
write('gameloop.js', `import { ctx, W, H, frame, tickFrame, gameState, setGameState, networkMode, players, setPlayers, curStage, setCurStage, carnivalAngle, setCarnivalAngle, shakeX, shakeY, winner, setWinner, gameOverTimer, setGameOverTimer, tickGameOverTimer, bullets, miniSwords, rocketArms, rocketMines, smokeClouds, unstableHeads, knives, throwSwords, firePebbles, pristineRockets, factoryBolts, factoryGears, factoryZaps, smallRocks, boulder, setBoulder, particles, p1Sel, p2Sel, p3Sel, p4Sel, stageSel, p1Confirmed, team4Done, selectStep, keys } from './globals.js';
import { CHARS, DUMMY_CHAR } from './characters/index.js';
import { STAGES } from './stages/index.js';
import { Player } from './player/index.js';
import { Boulder } from './projectiles/boulder.js';
import { SmallRock } from './projectiles/smallrock.js';
import { updateParticles, drawParticles } from './particles.js';
import { playLobbyMusic, playStageMusic, stopBgMusic } from './audio.js';
import { pollGamepads, getInputForPn, initPhoneController, clearPendingFlags } from './input.js';
import { drawStageBG, drawStageGeom } from './stages/index.js';
import { drawModeSelect, drawCharSelect, drawStageSelect, drawGameOver } from './menu.js';

${gameLogic}
`);

console.log('Done!');
