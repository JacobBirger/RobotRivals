// Patch all generated module files to use G.foo for mutable state.
// Replaces bare variable assignments and reads of mutable globals with G.xxx.
const fs = require('fs');
const path = require('path');

const MUTABLE = [
  'gameState','networkMode','boulder','players','curStage','carnivalAngle',
  'shakeX','shakeY','winner','gameOverTimer','selectStep',
  'p1Sel','p2Sel','p3Sel','p4Sel','stageSel','p1Confirmed',
  'team4Done','charScrollY','stageScrollY','confirmedChars','frame',
  // pending flags (owned by input.js, but referenced in gameloop)
  'p1JumpPend','p2JumpPend','p3JumpPend','p4JumpPend',
  'p1LightPend','p1HeavyPend','p2LightPend','p2HeavyPend',
  'p3LightPend','p3HeavyPend','p4LightPend','p4HeavyPend',
  'p1ShieldPend','p2ShieldPend','p3ShieldPend','p4ShieldPend',
  'p1DashPend','p2DashPend','p3DashPend','p4DashPend',
  'p1HeavyRelease','p2HeavyRelease','p3HeavyRelease','p4HeavyRelease',
  'modeSelIdx',
];

function patchFile(filePath, extraRenames) {
  let code = fs.readFileSync(filePath, 'utf8');

  // Replace all mutable variable references with G.xxx
  // Use word-boundary replacement to avoid partial matches
  for (const v of MUTABLE) {
    const re = new RegExp(`\\b${v}\\b`, 'g');
    code = code.replace(re, `G.${v}`);
  }

  if (extraRenames) {
    for (const [from, to] of extraRenames) {
      code = code.replace(new RegExp(`\\b${from}\\b`, 'g'), to);
    }
  }

  // Fix G.G.xxx double-prefixing (shouldn't happen but guard)
  code = code.replace(/\bG\.G\./g, 'G.');

  // Fix import lines: remove these variables from import list (they come from G now)
  // Keep only: ctx, W, H, particles, arrays (bullets etc), sameTeam, aabb, addShake, decayShake, rrFill etc

  fs.writeFileSync(filePath, code, 'utf8');
}

// Patch gameloop.js
patchFile(path.join(__dirname, 'gameloop.js'));

// Patch menu.js
patchFile(path.join(__dirname, 'menu.js'));

// Patch input.js - careful with pending flags (they're defined there)
// Actually input.js defines these flags, so skip patching it

console.log('Patch complete.');
