// Master rewrite script: generate all src/ module files from _extracted.js
// All mutable global state is accessed via the G object (imported from globals.js).
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

// Variables that live on G and must be prefixed with G. in all generated code.
// These are things that need to be MUTATED (assigned to) from multiple modules.
const MUTABLE_VIA_G = [
  'gameState','networkMode','boulder','players','curStage','carnivalAngle',
  'shakeX','shakeY','winner','gameOverTimer','selectStep',
  'p1Sel','p2Sel','p3Sel','p4Sel','stageSel','p1Confirmed',
  'team4Done','charScrollY','stageScrollY','confirmedChars','frame',
  'p1JumpPend','p2JumpPend','p3JumpPend','p4JumpPend',
  'p1LightPend','p1HeavyPend','p2LightPend','p2HeavyPend',
  'p3LightPend','p3HeavyPend','p4LightPend','p4HeavyPend',
  'p1ShieldPend','p2ShieldPend','p3ShieldPend','p4ShieldPend',
  'p1DashPend','p2DashPend','p3DashPend','p4DashPend',
  'p1HeavyRelease','p2HeavyRelease','p3HeavyRelease','p4HeavyRelease',
  'modeSelIdx','mouseRight','mouseLeft',
];

// Apply G. prefix to all mutable variable references in a code string.
// Skips: anything already preceded by a dot, object property keys (var:), string contents.
function gPrefix(code) {
  for (const v of MUTABLE_VIA_G) {
    // Match the variable name only when:
    // - NOT preceded by a dot or word char (not a property access)
    // - NOT followed by a colon (not an object key like {frame:0})
    const re = new RegExp(`(?<![.\\w])\\b${v}\\b(?!\\s*:)`, 'g');
    code = code.replace(re, `G.${v}`);
  }
  // Fix any double-prefix that snuck in
  code = code.replace(/\bG\.G\./g, 'G.');
  return code;
}

// The shared G import line (added to every file that touches mutable state)
const gImport = `import { G } from '../globals.js';`;
const gImportRoot = `import { G } from './globals.js';`;

// ---- audio.js ----
// Audio has no mutable state deps - no G needed
write('audio.js',
`// Audio: lobby music, stage music, SFX
${L(6234, 6362)}

export { playLobbyMusic, playStageMusic, stopBgMusic, kbScale, playSfx, playSfxNoise, sfxSwing, sfxHit };
`);

// ---- particles.js ----
const pSrc = gPrefix(L(500, 565));
write('particles.js',
`// Particle system + screen shake
import { ctx, particles } from './globals.js';
import { G } from './globals.js';

${pSrc}

export { addDeathExplosion, instakill, addHitParticles, updateParticles, drawParticles, rrPath, rrFill, rrStroke };
`);

// ---- player/constants.js ----
write('player/constants.js',
`${L(790, 808)}

export {
  FLY_ACCEL, MAX_FLY_SPEED, FLY_FRIC,
  GRAB_RANGE, GRAB_LOCKOUT_FRAMES, GRAB_AUTO_RELEASE_FRAMES, GRAB_WHIFF_CD,
  SHIELD_FRAMES, SHIELD_COOLDOWN,
  DASH_FRAMES, DASH_COOLDOWN, DASH_MULT,
  MAX_KB, DEATH_THRESHOLD, OFF_SCREEN_KILL_FRAMES,
  CAM_SCALE_X, CAM_SCALE_Y,
  VIS_LEFT, VIS_RIGHT, VIS_TOP, VIS_BOT,
  BOULDER_RADIUS, SMALL_ROCK_RADIUS, SMALL_ROCK_DMG, THROW_BOOST, THROW_FORWARD_SPEED
};
`);

// ---- stages/drawStageBG.js ----
const bgSrc = gPrefix(L(5510, 6228)); // skip 'let frame=0;' line (5509) — frame lives on G
write('stages/drawStageBG.js',
`import { ctx, W, H } from '../globals.js';
import { G } from '../globals.js';
import { rrFill, rrStroke, rrPath } from '../particles.js';

${bgSrc}

export { drawStageBG, drawStageGeom, drawFerrisWheel, drawJungleTrees, drawNeoBuildings, drawGear };
`);

// ---- projectiles/bullet.js ----
const bulletSrc = gPrefix(L(258, 318));
write('projectiles/bullet.js',
`import { ctx, W, H, bullets } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, instakill } from '../particles.js';
import { kbScale, MAX_KB, DEATH_THRESHOLD } from '../player/constants.js';
import { playSfx } from '../audio.js';

${bulletSrc}

export { Bullet };
`);

// ---- characters/rocket_projectiles.js ----
const rocketSrc = gPrefix(L(2558, 2677));
write('characters/rocket_projectiles.js',
`import { ctx, rocketArms, rocketMines } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, addDeathExplosion, instakill, rrFill } from '../particles.js';
import { kbScale, MAX_KB, DEATH_THRESHOLD, VIS_LEFT, VIS_RIGHT, VIS_TOP, VIS_BOT } from '../player/constants.js';
import { playSfx, playSfxNoise } from '../audio.js';

${rocketSrc}

export { explodeMines, RocketArm, RocketMine, rocketArms, rocketMines };
`);

// ---- characters/factory_projectiles.js ----
const factSrc = gPrefix(L(2680, 2821));
write('characters/factory_projectiles.js',
`import { ctx, W, H, factoryBolts, factoryGears, factoryZaps } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, instakill, rrFill } from '../particles.js';
import { kbScale, MAX_KB, DEATH_THRESHOLD, VIS_LEFT, VIS_RIGHT, VIS_TOP, VIS_BOT } from '../player/constants.js';
import { playSfx } from '../audio.js';

${factSrc}

export { drawGearShape, FactoryBolt, FactoryGear, FactoryZap, factoryBolts, factoryGears, factoryZaps };
`);

// ---- characters/blade_projectiles.js ----
const bladeSrc = gPrefix(L(2828, 3044));
write('characters/blade_projectiles.js',
`import { ctx, W, H, knives, throwSwords, firePebbles } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, addDeathExplosion, instakill, rrFill } from '../particles.js';
import { kbScale, MAX_KB, DEATH_THRESHOLD, VIS_LEFT, VIS_RIGHT, VIS_TOP, VIS_BOT } from '../player/constants.js';
import { playSfx, playSfxNoise } from '../audio.js';

${bladeSrc}

export { FirePebble, Knife, ThrowSword, knives, throwSwords, firePebbles };
`);

// ---- projectiles/boulder.js ----
const boulderSrc = gPrefix(L(3047, 3263));
write('projectiles/boulder.js',
`import { ctx, W, H, smallRocks } from '../globals.js';
import { G } from '../globals.js';
import { addDeathExplosion, addHitParticles, rrFill } from '../particles.js';

${boulderSrc}

export { Boulder };
`);

// ---- projectiles/smallrock.js ----
const rockSrc = gPrefix(L(3265, 3396));
write('projectiles/smallrock.js',
`import { ctx, W, H } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, instakill, rrFill } from '../particles.js';
import { kbScale, MAX_KB, DEATH_THRESHOLD, SMALL_ROCK_RADIUS, SMALL_ROCK_DMG, VIS_LEFT, VIS_RIGHT, VIS_TOP, VIS_BOT } from '../player/constants.js';
import { playSfx } from '../audio.js';

${rockSrc}

export { SmallRock };
`);

// ---- characters/pristine_projectiles.js ----
const pristSrc = gPrefix(L(3399, 3487));
write('characters/pristine_projectiles.js',
`import { ctx, W, H, pristineRockets } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, instakill, rrFill } from '../particles.js';
import { kbScale, MAX_KB, DEATH_THRESHOLD, VIS_LEFT, VIS_RIGHT, VIS_TOP, VIS_BOT } from '../player/constants.js';
import { playSfx } from '../audio.js';

${pristSrc}

export { PristineRocket, pristineRockets };
`);

// ---- characters/unstable_projectiles.js ----
const unstSrc = gPrefix(L(3491, 3586));
write('characters/unstable_projectiles.js',
`import { ctx, W, H, smokeClouds, unstableHeads } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, instakill, rrFill } from '../particles.js';
import { kbScale, MAX_KB, DEATH_THRESHOLD, VIS_LEFT, VIS_RIGHT, VIS_TOP, VIS_BOT } from '../player/constants.js';
import { playSfx } from '../audio.js';

${unstSrc}

export { SmokeCloud, UnstableHead, smokeClouds, unstableHeads };
`);

// ---- characters/edge_projectiles.js ----
const edgeSrc = gPrefix(L(3590, 3656));
write('characters/edge_projectiles.js',
`import { ctx, W, H, miniSwords } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, instakill, rrFill } from '../particles.js';
import { kbScale, MAX_KB, DEATH_THRESHOLD, VIS_LEFT, VIS_RIGHT, VIS_TOP, VIS_BOT } from '../player/constants.js';
import { playSfx } from '../audio.js';

${edgeSrc}

export { MiniSword, miniSwords };
`);

// ---- player/draw.js ----
// drawCharacter dispatcher line (3658-3675) + drawAttackArc (567-787)
// These only read from the char/atk objects passed in - no mutable global reads
const drawCharSrc = L(3658, 3675);
const drawAtkSrc = gPrefix(L(567, 787));
write('player/draw.js',
`import { ctx, W, H } from '../globals.js';
import { G } from '../globals.js';
import { rrFill, rrStroke, rrPath } from '../particles.js';
import { draw as drawBolt } from '../characters/bolt.js';
import { draw as drawCrusher } from '../characters/crusher.js';
import { draw as drawZippy } from '../characters/zippy.js';
import { draw as drawBlaster } from '../characters/blaster.js';
import { draw as drawEdge } from '../characters/edge.js';
import { draw as drawPierce } from '../characters/pierce.js';
import { draw as drawRocket } from '../characters/rocket.js';
import { draw as drawUnstable } from '../characters/unstable.js';
import { draw as drawBlade } from '../characters/blade.js';
import { draw as drawDummy } from '../characters/dummy.js';
import { draw as drawPristine } from '../characters/pristine.js';
import { draw as drawMagma } from '../characters/magma.js';
import { draw as drawFactory } from '../characters/factory.js';
import { draw as drawGlitch } from '../characters/glitch.js';
import { draw as drawKing, drawKingBody, drawKingCape, drawKingSword, drawKingShield } from '../characters/king.js';

${drawCharSrc}
${drawAtkSrc}

export { drawCharacter, drawAttackArc };
`);

// ---- player/index.js ----
const playerSrc = gPrefix(L(810, 2554));
write('player/index.js',
`import { ctx, W, H, bullets, miniSwords, rocketArms, rocketMines, smokeClouds, unstableHeads, knives, throwSwords, firePebbles, pristineRockets, factoryBolts, factoryGears, factoryZaps, particles, smallRocks, aabb, sameTeam, rrFill, rrStroke } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, addDeathExplosion, instakill } from '../particles.js';
import { kbScale, MAX_KB, DEATH_THRESHOLD, FLY_ACCEL, MAX_FLY_SPEED, FLY_FRIC, GRAB_RANGE, GRAB_LOCKOUT_FRAMES, GRAB_AUTO_RELEASE_FRAMES, GRAB_WHIFF_CD, SHIELD_FRAMES, SHIELD_COOLDOWN, DASH_FRAMES, DASH_COOLDOWN, DASH_MULT, OFF_SCREEN_KILL_FRAMES, CAM_SCALE_X, CAM_SCALE_Y, VIS_LEFT, VIS_RIGHT, VIS_TOP, VIS_BOT, BOULDER_RADIUS, SMALL_ROCK_RADIUS, SMALL_ROCK_DMG, THROW_BOOST, THROW_FORWARD_SPEED } from './constants.js';
import { playSfx, playSfxNoise, sfxSwing, sfxHit } from '../audio.js';
import { charModules } from '../characters/index.js';
import { drawCharacter, drawAttackArc } from './draw.js';
import { keys } from '../input.js';

${playerSrc}

export { Player };
`);

// ---- menu.js ----
const menuSrc = gPrefix(L(6372, 6681));
write('menu.js',
`import { ctx, W, H } from './globals.js';
import { G } from './globals.js';
import { CHARS } from './characters/index.js';
import { STAGES } from './stages/index.js';
import { rrFill, rrStroke, rrPath } from './particles.js';
import { drawCharacter } from './player/draw.js';

${menuSrc}

// Register callbacks on G so input.js can call them without circular imports
G.menuModeKey = menuModeKey;
G.menuCharKey = menuCharKey;
G.menuStageKey = menuStageKey;

export { menuModeKey, menuCharKey, menuStageKey, drawModeSelect, drawCharSelect, drawStageSelect, drawGameOver };
`);

// ---- gameloop.js ----
const gameloopSrc = gPrefix(L(6683, 6851));
write('gameloop.js',
`import { ctx, W, H, bullets, miniSwords, rocketArms, rocketMines, smokeClouds, unstableHeads, knives, throwSwords, firePebbles, pristineRockets, factoryBolts, factoryGears, factoryZaps, smallRocks, particles } from './globals.js';
import { G } from './globals.js';
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

${gameloopSrc}
G.startGame = startGame;
G.resetMenu = resetMenu;

export { startGame };
`);

console.log('All module files written.');
