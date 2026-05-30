// Shared canvas, dimensions, and mutable game-state.
// All mutable state lives on the G object so any importing module can freely assign to it.

export const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d');
export const W = 1000, H = 600;
canvas.width = W; canvas.height = H;

// Mutable game state — import G and mutate G.foo = bar freely from any module
export const G = {
  frame: 0,
  gameState: 'modeSelect',
  networkMode: 'none',
  boulder: null,
  players: [],
  curStage: null,
  carnivalAngle: 0,
  shakeX: 0, shakeY: 0,
  comboFlash: 0,
  winner: '', gameOverTimer: 0,
  selectStep: 0, p1Sel: 0, p2Sel: 1, p3Sel: 2, p4Sel: 3, stageSel: 0,
  p1Confirmed: false,
  team4Done: [false, false, false, false],
  charScrollY: 0, stageScrollY: 0,
  confirmedChars: {},
  startGame: null,  // set by gameloop.js
  resetMenu: null,  // set by gameloop.js
  menuModeKey: null,  // set by menu.js
  menuCharKey: null,  // set by menu.js
  menuStageKey: null, // set by menu.js
  modeSelIdx: 0,
  mouseLeft: false,
  mouseRight: false,
  bordersOn: false,
};

// Projectile arrays — exported as const (mutated in place, never replaced)
export const bullets       = [];
export const miniSwords    = [];
export const rocketArms    = [];
export const rocketMines   = [];
export const smokeClouds   = [];
export const unstableHeads = [];
export const knives        = [];
export const throwSwords   = [];
export const firePebbles   = [];
export const pristineRockets = [];
export const factoryBolts  = [];
export const factoryGears  = [];
export const factoryZaps   = [];
export const smallRocks    = [];
export const particles     = [];

// Convenience aliases for the most-accessed G fields (read-only facade — always use G.x for writes)
// These are getters so they always reflect the current G value when read.
// Note: for writes, modules MUST do G.gameState = ... not gameState = ...
export function getGameState() { return G.gameState; }

// Screen-shake helpers (used by character code via addShake(dx,dy))
export function addShake(dx, dy) { G.shakeX += dx; G.shakeY += dy; }
export function decayShake() {
  G.shakeX *= 0.72; G.shakeY *= 0.72;
  if (Math.abs(G.shakeX) < 0.5) G.shakeX = 0;
  if (Math.abs(G.shakeY) < 0.5) G.shakeY = 0;
}

// Helpers shared by multiple modules
export function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
export function sameTeam(a, b) { return a && b && a.team > 0 && b.team > 0 && a.team === b.team; }
export function rrPath(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2); ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
export function rrFill(x, y, w, h, r, c) { rrPath(x, y, w, h, r); ctx.fillStyle = c; ctx.fill(); }
export function rrStroke(x, y, w, h, r, c, lw) { rrPath(x, y, w, h, r); ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.stroke(); }
