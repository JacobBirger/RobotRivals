import { W, H } from '../globals.js';
const FLY_ACCEL=0.55, MAX_FLY_SPEED=14, FLY_FRIC=0.985;
const GRAB_RANGE=50, GRAB_LOCKOUT_FRAMES=60, GRAB_AUTO_RELEASE_FRAMES=120, GRAB_WHIFF_CD=24;
const SHIELD_FRAMES=15,SHIELD_COOLDOWN=120;
const DASH_FRAMES=9,DASH_COOLDOWN=38,DASH_MULT=5.2;
const MAX_KB=20; // velocity cap to prevent extreme-speed bug
const DEATH_THRESHOLD=150; // damage % at which next hit instakills
const OFF_SCREEN_KILL_FRAMES=60; // ~1 second off-screen = death
// Visible world rect (camera applies scale 0.692,0.9 about screen center, so visible world > canvas)
const CAM_SCALE_X=0.692, CAM_SCALE_Y=0.9;
const VIS_LEFT  = (0 - W/2)/CAM_SCALE_X + W/2;       // ≈ -222
const VIS_RIGHT = (W - W/2)/CAM_SCALE_X + W/2;       // ≈ 1222
const VIS_TOP   = (0 - H/2)/CAM_SCALE_Y + H/2;       // ≈ -33
const VIS_BOT   = (H - H/2)/CAM_SCALE_Y + H/2;       // ≈ 633
// Boulder + small rocks
const BOULDER_RADIUS=75;          // boulder circle radius (visual diameter 150px)
const SMALL_ROCK_RADIUS=25;       // small rock radius (~robot-sized)
const SMALL_ROCK_DMG=20;          // fixed thrown-rock damage (% — applies def multiplier)
const THROW_BOOST=10;             // velocity boost added to holder's vel on throw
const THROW_FORWARD_SPEED=14;     // throw speed when holder is stationary

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
