# Robot Rivals

A browser-based 2D platform fighter game. Pick a robot, pick a stage, and brawl.

## How to Play

**Option 1 — Open directly in browser**
Just open `index.html` in any modern browser. Local 2-player and training mode work without a server.

**Option 2 — Run the local server** (required for phone controller and online play)
```
node server.js
```
Then open `http://localhost:3000` in your browser.

## Game Modes

| Mode | Description |
|------|-------------|
| Local 2P | Two players on the same keyboard |
| Online 1v1 | P2P match via WebRTC (share a room code) |
| Training | Practice against a dummy |

## Controls

### Keyboard

| Action | Player 1 | Player 2 |
|--------|----------|----------|
| Move | A / D | ← / → |
| Jump | W | ↑ |
| Light attack | Z | [ |
| Heavy attack | X | ] |
| Shield | C | , |
| Dash | V | . |

### Gamepad
Xbox/PS controllers are supported. Left stick or D-pad to move, face buttons for attacks.

### Phone Controller
With the server running, open `http://<your-local-ip>:3000/controller` on your phone (same Wi-Fi). Uses a virtual d-pad and buttons.

## Characters

| Name | Playstyle |
|------|-----------|
| BOLT | All-rounder, 2-hit combo |
| CRUSHER | Slow, powerful charged heavy |
| ZIPPY | Fast, charged heavy |
| BLASTER | Ranged bullets |
| EDGE | 3-hit sword combos |
| PIERCE | Spear, pogo down light |
| ROCKET | Arm-cannon projectiles and mines |
| UNSTABLE | Smoke DoT, self-damage tradeoffs |
| BLADE | Knives and throwing sword |
| PRISTINE | Flight, homing rocket, laser shield |
| MAGMA | Flamethrower, fire pebbles |
| FACTORY | Gear attacks, Bolt minion, Zap bots |
| GLITCH | Teleport, phase invincibility, stolen weapon |

## Stages

THE FOUNDRY, ORBITAL STATION, SCRAPYARD, NEON CITY, ARCTIC BASE, CLOUD TEMPLE, MOLTEN CORE, DATA REALM, THE CARNIVAL, THE JUNGLE, SKY TEMPLE, NEO CITY

## Tech

Single-file game (`index.html`). No build step, no dependencies except PeerJS (CDN) for online play. The server (`server.js`) is a minimal Node.js WebSocket relay for the phone controller.
