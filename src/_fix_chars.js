// Fix the character files: write correct char data object into each one.
const fs = require('fs');
const path = require('path');

const parsed = JSON.parse(fs.readFileSync(path.join(__dirname, '_chars_parsed.json'), 'utf8'));
const lines = fs.readFileSync(path.join(__dirname, '_extracted.js'), 'utf8').split('\n');
function L(from, to) { return lines.slice(from - 1, to).join('\n'); }
function write(file, content) {
  const full = path.join(__dirname, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  console.log('wrote', file);
}

// Apply G. prefix to mutable global variable references
const MUTABLE_VIA_G = [
  'frame','shakeX','shakeY','boulder','players','curStage',
  'carnivalAngle','gameState','networkMode','winner','gameOverTimer',
];
function gPrefix(code) {
  for (const v of MUTABLE_VIA_G) {
    // Skip object property keys (followed by :) — e.g. {frame:0}
    const re = new RegExp(`(?<![.\\w])\\b${v}\\b(?!\\s*:)`, 'g');
    code = code.replace(re, `G.${v}`);
  }
  return code.replace(/\bG\.G\./g, 'G.');
}

// Map id -> data string
const charData = {};
for (const entry of parsed.entries) {
  const idm = entry.match(/id:(\d+)/);
  if (idm) charData[parseInt(idm[1])] = entry;
}
charData[9] = parsed.dummySrc;

const sharedImports = `import { ctx, W, H, bullets, miniSwords, rocketArms, rocketMines, smokeClouds, unstableHeads, knives, throwSwords, firePebbles, pristineRockets, factoryBolts, factoryGears, factoryZaps, particles, aabb, sameTeam } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, addDeathExplosion, instakill, rrFill, rrStroke, rrPath } from '../particles.js';
import { kbScale, MAX_KB, DEATH_THRESHOLD, FLY_ACCEL, MAX_FLY_SPEED, FLY_FRIC, DASH_FRAMES, DASH_MULT } from '../player/constants.js';
import { playSfx, playSfxNoise } from '../audio.js';
`;

const charConfigs = [
  { name: 'bolt',     id: 0,  updateLines: null,         atkFramesLines: null,       hitboxLines: null,        respawnLine: null,   drawFunc: 'drawBolt',     drawLines: [4744, 4769] },
  { name: 'crusher',  id: 1,  updateLines: [1460, 1464], atkFramesLines: null,       hitboxLines: null,        respawnLine: 2172,   drawFunc: 'drawCrusher',  drawLines: [4770, 4806] },
  { name: 'zippy',    id: 2,  updateLines: null,         atkFramesLines: null,       hitboxLines: null,        respawnLine: null,   drawFunc: 'drawZippy',    drawLines: [4807, 4837] },
  { name: 'blaster',  id: 3,  updateLines: [1109, 1125], atkFramesLines: [1743,1747],hitboxLines: [1895,1899], respawnLine: null,   drawFunc: 'drawBlaster',  drawLines: [4838, 4881] },
  { name: 'edge',     id: 4,  updateLines: [1523, 1532], atkFramesLines: [1767,1769],hitboxLines: [1946,1975], respawnLine: null,   drawFunc: 'drawEdge',     drawLines: [4882, 4945] },
  { name: 'pierce',   id: 5,  updateLines: null,         atkFramesLines: null,       hitboxLines: [1947,1951], respawnLine: null,   drawFunc: 'drawPierce',   drawLines: [4946, 5005] },
  { name: 'rocket',   id: 6,  updateLines: [1127, 1130], atkFramesLines: [1729,1734],hitboxLines: [1900,1900], respawnLine: 2173,   drawFunc: 'drawRocket',   drawLines: [5006, 5068] },
  { name: 'unstable', id: 7,  updateLines: [1183, 1220], atkFramesLines: [1720,1727],hitboxLines: [1931,1943], respawnLine: null,   drawFunc: 'drawUnstable', drawLines: [5201, 5440] },
  { name: 'blade',    id: 8,  updateLines: [1132, 1181], atkFramesLines: [1711,1718],hitboxLines: [1901,1930], respawnLine: null,   drawFunc: 'drawBlade',    drawLines: [5069, 5200] },
  { name: 'dummy',    id: 9,  updateLines: null,         atkFramesLines: null,       hitboxLines: null,        respawnLine: null,   drawFunc: 'drawDummy',    drawLines: [4732, 4743] },
  { name: 'pristine', id: 10, updateLines: [1222, 1271], atkFramesLines: [1736,1741],hitboxLines: [1800,1800], respawnLine: 2174,   drawFunc: 'drawPristine', drawLines: [5441, 5506] },
  { name: 'magma',    id: 11, updateLines: [1274, 1347], atkFramesLines: [1749,1756],hitboxLines: [1883,1894], respawnLine: 2175,   drawFunc: 'drawMagma',    drawLines: [3676, 3825] },
  { name: 'factory',  id: 12, updateLines: [1350, 1409], atkFramesLines: [1758,1765],hitboxLines: [1801,1818], respawnLine: 2176,   drawFunc: 'drawFactory',  drawLines: [3826, 4058] },
  { name: 'glitch',   id: 13, updateLines: [1472, 1521], atkFramesLines: [1780,1791],hitboxLines: [1819,1844], respawnLine: 2177,   drawFunc: 'drawGlitch',   drawLines: [4059, 4287] },
  { name: 'king',     id: 14, updateLines: [1412, 1457], atkFramesLines: [1771,1778],hitboxLines: [1845,1882], respawnLine: 2178,   drawFunc: 'drawKing',     drawLines: [4288, 4731] },
];

for (const cfg of charConfigs) {
  const data = charData[cfg.id] || '{}';

  const updateBody = cfg.updateLines
    ? gPrefix(L(cfg.updateLines[0], cfg.updateLines[1]))
    : '  // no special mechanics';
  const updateFn = `export function onUpdate(player, inp, opps) {\n${updateBody}\n}`;

  const atkBody = cfg.atkFramesLines
    ? `  const c = player.ch;\n${gPrefix(L(cfg.atkFramesLines[0], cfg.atkFramesLines[1]))}\n  return null;`
    : '  return null;';
  const atkFn = `export function getAtkFrames(type, dir, comboN, player) {\n${atkBody}\n}`;

  const hbBody = cfg.hitboxLines
    ? `  const self = player;\n${gPrefix(L(cfg.hitboxLines[0], cfg.hitboxLines[1]))}\n  return null;`
    : '  return null;';
  const hbFn = `export function getHitbox(a, x, y, w, h, facing, player) {\n${hbBody}\n}`;

  const respawnBody = cfg.respawnLine
    ? `  ${gPrefix(lines[cfg.respawnLine - 1].trim())}`
    : '  // no cleanup needed';
  const respawnFn = `export function onRespawn(player) {\n${respawnBody}\n}`;

  let drawSrc = gPrefix(L(cfg.drawLines[0], cfg.drawLines[1]));
  // Replace the function declaration to be an export
  drawSrc = drawSrc.replace(new RegExp(`^function ${cfg.drawFunc}`), `export function draw`);
  // King has multiple helper functions — export them all
  if (cfg.name === 'king') {
    drawSrc = drawSrc
      .replace(/^function drawKingBody/m, 'export function drawKingBody')
      .replace(/^function drawKingCape/m, 'export function drawKingCape')
      .replace(/^function drawKingSword/m, 'export function drawKingSword')
      .replace(/^function drawKingShield/m, 'export function drawKingShield');
  }

  // Extra imports for characters that own projectile classes
  let extraImports = '';
  if (cfg.name === 'rocket')   extraImports = `import { RocketArm, RocketMine, explodeMines, rocketArms, rocketMines } from './rocket_projectiles.js';\n`;
  if (cfg.name === 'unstable') extraImports = `import { SmokeCloud, UnstableHead } from './unstable_projectiles.js';\n`;
  if (cfg.name === 'blade')    extraImports = `import { Knife, ThrowSword, knives, throwSwords } from './blade_projectiles.js';\nimport { FirePebble, firePebbles } from './blade_projectiles.js';\n`;
  if (cfg.name === 'magma')    extraImports = `import { FirePebble, firePebbles } from './blade_projectiles.js';\n`;
  if (cfg.name === 'pristine') extraImports = `import { PristineRocket, pristineRockets } from './pristine_projectiles.js';\n`;
  if (cfg.name === 'factory')  extraImports = `import { FactoryBolt, FactoryGear, FactoryZap, drawGearShape, factoryBolts, factoryGears, factoryZaps } from './factory_projectiles.js';\n`;
  if (cfg.name === 'edge')     extraImports = `import { MiniSword, miniSwords } from './edge_projectiles.js';\n`;

  write(`characters/${cfg.name}.js`,
    `${sharedImports}${extraImports}\nexport const char = ${data};\n\n${atkFn}\n\n${hbFn}\n\n${updateFn}\n\n${respawnFn}\n\n${drawSrc}\n`
  );
}

// Regenerate characters/index.js with correct ordering (matches CHARS array order from source)
const orderedNames = ['bolt','crusher','zippy','blaster','edge','pierce','rocket','blade','unstable','pristine','magma','factory','glitch','king'];
const importLines = orderedNames.map(n => `import * as _${n} from './${n}.js';`).join('\n');
const charsArray  = orderedNames.map(n => `_${n}.char`).join(',\n  ');
write('characters/index.js',
  `${importLines}\nimport * as _dummy from './dummy.js';\n\nexport const CHARS = [\n  ${charsArray}\n];\nexport const DUMMY_CHAR = _dummy.char;\nexport const charModules = { ${[...orderedNames,'dummy'].map(n=>`${n}: _${n}`).join(', ')} };\n`
);

console.log('All character files fixed.');
