# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Robot Rivals** is a single-file browser-based 2D platform fighter game. The entire game lives in `index.html` (~3400+ lines). There is no build step, no package manager, and no test suite — open `index.html` in a browser to run it. The only external dependency is PeerJS (loaded via CDN) for WebRTC networking.

## Architecture

Everything is in `index.html`. The file is structured roughly top-to-bottom:

1. **HTML/CSS** — Canvas element, network UI overlay, style block
2. **Input system** — `keys{}` object, pending-flag variables (`p1LightPend`, etc.), `getP1Input()`, `getP2Input()`, `getNetInput()`, `dummyInput()`
3. **Networking** — PeerJS WebRTC peer-to-peer for 1v1 online play. `handleNetData()`, `buildStateMsg1v1()`, `applyPlayerSt()`, `serializePlayer()`
4. **Bullet class** — Generic ranged projectile used by several characters
5. **CHARS array** — All character stat definitions (id, color, sizes, damage, knockback, frame data, special properties)
6. **STAGES array** — Stage geometry (ground rect + platform array)
7. **Particle system** — `addHitParticles()`, `updateParticles()`, `drawParticles()`
8. **Helper functions** — `rrPath/rrFill/rrStroke` (rounded rect), `aabb()`, `drawAttackArc()`
9. **Player class** — Core game logic: physics, input handling, attack state machine, collision, shield/dash/charge systems
10. **Projectile classes** — `RocketArm`, `RocketMine`, `Knife`, `ThrowSword`, `MiniSword`, `PristineRocket`, `SmokeCloud`, `UnstableHead`, `FirePebble`
11. **Character draw functions** — `drawBolt`, `drawCrusher`, `drawZippy`, `drawBlaster`, `drawEdge`, `drawPierce`, `drawRocket`, `drawUnstable`, `drawBlade`, `drawPristine`, `drawMagma`, `drawDummy`
12. **Screen draw functions** — `drawModeSelect`, `drawCharSelect`, `drawStageSelect`
13. **Game loop** — `updateGame()`, `loop()` (runs via `requestAnimationFrame`)

## Character IDs

| ID | Name | Notes |
|----|------|-------|
| 0 | BOLT | All-rounder, 2-hit combo |
| 1 | CRUSHER | Charged heavy, slow |
| 2 | ZIPPY | Fast, charged heavy |
| 3 | BLASTER | Bullet-based ranged |
| 4 | EDGE | 3-hit sword combos |
| 5 | PIERCE | Spear, pogo down light |
| 6 | ROCKET | Arm projectiles, mines |
| 7 | UNSTABLE | Smoke DoT, self-damage |
| 8 | BLADE | Knives, throw sword |
| 9 | DUMMY | Training dummy (not in CHARS) |
| 10 | PRISTINE | Flight, homing rocket, laser shield |
| 11 | MAGMA | Flamethrower, fire pebble w/ explosion |

Character stats reference sheet: `Robot Rivals Stats - Sheet1.csv`

## Adding a New Character

1. Add an entry to `CHARS` array (after id 11) with a unique `id`, stat block, and any special property fields.
2. Add direction-specific attack timing in `startAtk()` (find the block of `if(c.id===X)` checks).
3. Add a `hitbox()` case for melee hitboxes (or return null if projectile-only).
4. Add an update block in `Player.update()` for special mechanics (after the MAGMA block).
5. Add `doRespawn()` cleanup if the character uses custom state (fuel, ammo, flags).
6. Create a `drawX()` function and wire it into `drawCharacter()` and add a `return` at the top of `drawAttackArc()`.
7. If using a new projectile type, create a class, a global array, and hook it into `updateGame()` (update loop + render loop) and all three reset points (`clr()` lambda, `resetMenu()`, `doRespawn()`).

## Attack System

Each attack is stored in `player.atk` as `{type, dir, frame, su, act, el, hit, bulletFired, chargeRatio}`.

- **su** = startup frames (before active)
- **act** = active frames (hitbox live); can be extended dynamically (Magma flamethrower does `ma.act++`)
- **el** = endlag frames
- **dir** values: `'side'`, `'neutral'`, `'up'`, `'down'`
- `bulletFired` flag prevents repeat projectile spawning
- Melee hits go through `land(target)` → damage + knockback formula
- Projectile hits apply damage/knockback directly in their `update()` method

## Input System Notes

- `lightHeld` — held state of light button (mouse left / Z key / `[` for P2); used by Magma's flamethrower
- `heavyHeld` — held state of heavy button; used by charge characters
- `heavyRelease` — one-frame pulse on release; triggers charged heavy fire
- Pending flags (`p1LightPend` etc.) are one-frame pulses cleared at the end of each `updateGame()` call
- Network play: guest sends input state to host; host is authoritative for physics/damage

## Networking Model

- Host runs P1 locally, receives P2 state from guest
- Guest runs P2 locally, receives P1 state from host
- Bullets/rockets are authoritative from their owner's machine; opponent's projectiles are synced via state messages
- `magmaFuel` (and similar per-character state) must be included in `serializePlayer()` / `applyPlayerSt()` for network correctness
