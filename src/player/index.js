import { ctx, W, H, bullets, miniSwords, rocketArms, rocketMines, smokeClouds, unstableHeads, knives, throwSwords, firePebbles, pristineRockets, factoryBolts, factoryGears, factoryZaps, particles, smallRocks, aabb, sameTeam, rrFill, rrStroke } from '../globals.js';
import { G } from '../globals.js';
import { addHitParticles, addDeathExplosion, instakill } from '../particles.js';
import { Bullet } from '../projectiles/bullet.js';
import { MiniSword } from '../characters/edge_projectiles.js';
import { RocketArm, RocketMine, explodeMines } from '../characters/rocket_projectiles.js';
import { SmokeCloud, UnstableHead } from '../characters/unstable_projectiles.js';
import { Knife, ThrowSword, FirePebble } from '../characters/blade_projectiles.js';
import { PristineRocket } from '../characters/pristine_projectiles.js';
import { FactoryBolt, FactoryGear, FactoryZap, drawGearShape } from '../characters/factory_projectiles.js';
import { MAX_KB, DEATH_THRESHOLD, FLY_ACCEL, MAX_FLY_SPEED, FLY_FRIC, GRAB_RANGE, GRAB_LOCKOUT_FRAMES, GRAB_AUTO_RELEASE_FRAMES, GRAB_WHIFF_CD, SHIELD_FRAMES, SHIELD_COOLDOWN, DASH_FRAMES, DASH_COOLDOWN, DASH_MULT, OFF_SCREEN_KILL_FRAMES, CAM_SCALE_X, CAM_SCALE_Y, VIS_LEFT, VIS_RIGHT, VIS_TOP, VIS_BOT, BOULDER_RADIUS, SMALL_ROCK_RADIUS, SMALL_ROCK_DMG, THROW_BOOST, THROW_FORWARD_SPEED, BOOST_MAX, BOOST_SPEED_MULT } from './constants.js';
import { kbScale, playSfx, playSfxNoise, sfxSwing, sfxHit } from '../audio.js';
import { charModules } from '../characters/index.js';
import { drawCharacter, drawAttackArc } from './draw.js';
import { keys } from '../input.js';

class Player {
  constructor(ch,spawnX,pn,isDummy=false) {
    this.ch=ch; this.pn=pn; this.isDummy=isDummy; this.spawnX=spawnX;
    this.w=ch.w; this.h=ch.h; this.x=spawnX-ch.w/2; this.y=150;
    this.vx=0; this.vy=0; this.facing=pn===1?1:-1;
    this.onGnd=false; this.onPlat=false; this.jLeft=2;
    this.damage=0; this.stocks=isDummy?99:3;
    this.atk=null; this.atkCD=0; this.hstun=0; this.hitlag=0;
    this.dropPlat=null; this.dropTimer=0;
    this.hitFlash=0; this.dead=false; this.respawnT=0;
    this.wf=0; this.wt=0;
    // Shield
    this.shieldActive=false; this.shieldTimer=0; this.shieldCooldown=0;
    // Combo
    this.comboPend=false;
    // Dash
    this.dashActive=false; this.dashTimer=0; this.dashCD=0;
    // Boost
    this.boostActive=false; this.boostFuel=BOOST_MAX;
    // Charge heavy
    this.charging=false; this.chargeTime=0; this.chargeDir='side';
    // CRUSHER heavy cooldowns
    this.crusherSideHeavyCD=0; this.crusherUpHeavyCD=0; this.crusherDownHeavyCD=0;
    // ROCKET arm ammo + cooldowns
    this.armsLeft=4; this.rocketLightCD=0; this.rocketSideHeavyCD=0; this.rocketUpHeavyCD=0;
    // Status effects
    this.burnTimer=0; this.burnTick=0; this.hitImmune=0;
    // PRISTINE flight
    this.flyActive=false; this.flyTimer=180; this.flyCooldown=0; this.flyMaxCool=180;
    // PRISTINE laser shield
    this.laserShieldActive=false; this.laserShieldTimer=0;
    // PRISTINE rocket cooldown (blocks only side heavy re-fire)
    this.pristineRocketCd=0;
    // MAGMA flamethrower fuel
    this.magmaFuel=ch.flameFuelMax||180;
    // FACTORY attack cooldowns
    this.factoryBoltCD=0; this.factoryZapCD=0;
    // GLITCH phase/ghost state
    this.glitchPhaseTimer=0; this.glitchGhost=false; this.glitchWeapon=null;
    // KING shield angle (radians; 0=right, world G.frame, doesn't flip with facing) + sword fire
    this.kingShieldAngle=0; this.kingShieldRotateT=0; this.kingShieldRotateFrom=0; this.kingShieldRotateTo=0;
    this.kingFireTimer=0;
    // Grab state (flight-mode wrestling): grabbing=opponent ref while grabber holds them;
    // grabbedBy=opponent ref while this player is held; grabT=elapsed frames in grab;
    // grabWhiffT=frames left of whiff cooldown after pressing grab with no target.
    this.grabbing=null; this.grabbedBy=null; this.grabT=0; this.grabWhiffT=0;
    // Held small rock (after grabbing one off the stage)
    this.heldRock=null;
    // Off-screen kill timer (camera-based KO for flight mode)
    this.offScreenTimer=0;
    // Team and input (set after construction in startGame)
    this.team=0; this.localInputSlot=1;
  }
  get cx(){return this.x+this.w/2;} get cy(){return this.y+this.h/2;}
  get right(){return this.x+this.w;} get bottom(){return this.y+this.h;}

  atkDir(inp) {
    if(this.localInputSlot===1){
      const phSide1=keys['_ph1L']||keys['_ph1R'];
      if(keys['KeyW']||keys['_gp1U']||(keys['_ph1U']&&!phSide1))   return 'up';
      if(keys['KeyS']||keys['_gp1D']||(keys['_ph1D']&&!phSide1))   return 'down';
      if(keys['KeyA']||keys['KeyD']||keys['_gp1L']||keys['_gp1R']||phSide1) return 'side';
    } else if(this.localInputSlot===2){
      const phSide2=keys['_ph2L']||keys['_ph2R'];
      if(keys['ArrowUp']||keys['_gp2U']||(keys['_ph2U']&&!phSide2))    return 'up';
      if(keys['ArrowDown']||keys['_gp2D']||(keys['_ph2D']&&!phSide2))  return 'down';
      if(keys['ArrowLeft']||keys['ArrowRight']||keys['_gp2L']||keys['_gp2R']||phSide2) return 'side';
    } else if(this.localInputSlot===3){
      const phSide3=keys['_ph3L']||keys['_ph3R'];
      if(keys['_ph3U']&&!phSide3) return 'up';
      if(keys['_ph3D']&&!phSide3) return 'down';
      if(phSide3) return 'side';
    } else if(this.localInputSlot===4){
      const phSide4=keys['_ph4L']||keys['_ph4R'];
      if(keys['_ph4U']&&!phSide4) return 'up';
      if(keys['_ph4D']&&!phSide4) return 'down';
      if(phSide4) return 'side';
    } else if(inp){
      // Remote player — derive from network input
      if(inp.up&&!inp.left&&!inp.right)   return 'up';
      if(inp.down&&!inp.left&&!inp.right) return 'down';
      if(inp.left||inp.right) return 'side';
    }
    return 'neutral';
  }

  update(inp,st,opps) {
    const opp=opps&&opps.find(p=>!p.dead)||null;
    if (this.dead){this.respawnT--;if(this.respawnT<=0)this.doRespawn();return;}
    if (this.hitFlash>0) this.hitFlash--;
    if (this.hitImmune>0) this.hitImmune--;
    if (this.burnTimer>0){this.burnTimer--;this.burnTick++;if(this.burnTick>=30){this.burnTick=0;if(this.damage>=DEATH_THRESHOLD&&!this.isDummy){instakill(this,this.cx,this.cy);}else{this.damage+=2;this.hitFlash=8;}}}
    if (this.atkCD>0)    this.atkCD--;
    if (this.dropTimer>0){this.dropTimer--;if(!this.dropTimer)this.dropPlat=null;}
    if (this.grabWhiffT>0) this.grabWhiffT--;
    if (this.hitlag>0){this.hitlag--;return;}
    if (this.hstun>0){this.hstun--;if(this.charging){this.charging=false;this.chargeTime=0;}}

    // ===== GRAB SYSTEM =====
    // If the player got knocked into hitstun this G.frame (or a projectile pushed velocity), break grabs.
    // hstun > 0 is a strong signal of a hit landing.
    if ((this.grabbing||this.grabbedBy)&&this.hstun>0){
      if (this.grabbing){this.grabbing.grabbedBy=null;this.grabbing.grabT=0;this.grabbing=null;}
      if (this.grabbedBy){this.grabbedBy.grabbing=null;this.grabbedBy.grabT=0;this.grabbedBy=null;}
      this.grabT=0;
    }
    // Resolve broken grabs (partner died/respawned without clearing on us)
    if (this.grabbing&&(this.grabbing.dead||this.grabbing.grabbedBy!==this)) {this.grabbing=null;this.grabT=0;}
    if (this.grabbedBy&&(this.grabbedBy.dead||this.grabbedBy.grabbing!==this)) {this.grabbedBy=null;this.grabT=0;}
    // Drop held rock if it died (e.g. went off-screen while held — defensive)
    if(this.heldRock&&this.heldRock.dead) this.heldRock=null;
    // Grab initiation (only the grabber's side runs this)
    if (inp.grab&&!this.grabbing&&!this.grabbedBy&&!this.isDummy&&!this.shieldActive&&this.hstun===0&&this.grabWhiffT===0&&!this.atk) {
      // Branch 1: holding a rock → throw it (grab again toggles throw)
      if(this.heldRock){
        const r=this.heldRock;
        let bvx=this.vx, bvy=this.vy;
        const sp=Math.hypot(bvx,bvy);
        if(sp>0.5){
          bvx += (bvx/sp)*THROW_BOOST;
          bvy += (bvy/sp)*THROW_BOOST;
        } else {
          // Standing still: throw forward in facing direction
          bvx = this.facing*THROW_FORWARD_SPEED; bvy=0;
        }
        r.vx=bvx; r.vy=bvy; r.thrown=true; r.heldBy=null;
        r.lastOwner=this; r.lastOwnerImmuneT=8;
        r.trail=[];
        this.heldRock=null;
        playSfx({freq:480,freq2:200,type:'square',decay:0.1,vol:0.16});
      } else {
        // Branch 2: try to grab an opponent (existing logic, takes priority)
        let target=null;
        if(opps) for(const p of opps){
          if(p===this||p.dead) continue;
          if(this.team>0&&p.team===this.team) continue;
          if(p.grabbedBy||p.grabbing) continue;
          if(p.shieldActive||p.hitImmune>0) continue;
          const dx=p.cx-this.cx, dy=p.cy-this.cy;
          if(Math.hypot(dx,dy)<=GRAB_RANGE){target=p;break;}
        }
        if(target){
          this.grabbing=target; target.grabbedBy=this;
          this.grabT=0; target.grabT=0;
          this.vx=this.vy=0; target.vx=target.vy=0;
          target.atk=null; target.charging=false; target.chargeTime=0;
          // Face each other
          this.facing = target.cx>this.cx?1:-1;
          target.facing = this.cx>target.cx?1:-1;
          playSfx({freq:520,freq2:200,type:'square',decay:0.1,vol:0.18});
        } else {
          // Branch 3: try to pick up a small rock
          let pickedRock=null;
          for(const r of smallRocks){
            if(r.dead||r.heldBy||r.thrown) continue;
            const dx=r.x-this.cx, dy=r.y-this.cy;
            if(Math.hypot(dx,dy)<=GRAB_RANGE){pickedRock=r; break;}
          }
          if(pickedRock){
            this.heldRock=pickedRock; pickedRock.heldBy=this;
            pickedRock.vx=0; pickedRock.vy=0; pickedRock.thrown=false;
            playSfx({freq:600,freq2:300,type:'square',decay:0.08,vol:0.12});
          } else {
            // Whiff: brief reach animation + cooldown
            this.grabWhiffT=GRAB_WHIFF_CD;
            playSfx({freq:300,freq2:160,type:'sawtooth',decay:0.08,vol:0.10});
          }
        }
      }
    }
    // Grab tick: increment timer, freeze in place, handle escape/auto-release
    if (this.grabbing||this.grabbedBy){
      this.grabT++;
      this.vx=0; this.vy=0;
      // Auto-release after 2 seconds
      if (this.grabT>=GRAB_AUTO_RELEASE_FRAMES){
        if (this.grabbing){this.grabbing.grabbedBy=null;this.grabbing.grabT=0;this.grabbing=null;}
        if (this.grabbedBy){this.grabbedBy.grabbing=null;this.grabbedBy.grabT=0;this.grabbedBy=null;}
        this.grabT=0;
      }
      // The grabbed player can dash to escape AFTER 1s lockout
      else if (this.grabbedBy&&this.grabT>=GRAB_LOCKOUT_FRAMES&&inp.dash&&this.dashCD===0){
        const other=this.grabbedBy;
        other.grabbing=null;other.grabT=0;
        this.grabbedBy=null;this.grabT=0;
        // Trigger an escape dash (8-directional from input)
        this.dashActive=true; this.dashTimer=DASH_FRAMES;
        const ds=this.ch.speed*DASH_MULT;
        let dx=(inp.right?1:0)-(inp.left?1:0);
        let dy=(inp.down?1:0)-(inp.up?1:0);
        if(dx===0&&dy===0) dx=-this.facing; // default: dash backward away from grabber
        const len=Math.hypot(dx,dy)||1;
        this.vx=(dx/len)*ds; this.vy=(dy/len)*ds;
        playSfx({freq:700,freq2:300,type:'square',decay:0.1,vol:0.16});
      }
    }
    // Suppress inputs based on grab state
    if (this.grabbedBy){
      // Grabbed: full lockout for 1s, then only dash works (handled above)
      inp = {...inp, left:false,right:false,up:false,down:false,
             light:false,heavy:false,heavyHeld:false,heavyRelease:false,lightHeld:false,
             shield:false,grab:false,
             dash: this.grabT>=GRAB_LOCKOUT_FRAMES?inp.dash:false};
    } else if (this.grabbing){
      // Grabber: can attack but can't move/dash/shield/grab-again
      inp = {...inp, left:false,right:false,up:false,down:false,
             dash:false,shield:false,grab:false};
    }

    // Shield activation
    if (inp.shield&&!this.shieldActive&&this.shieldCooldown===0&&this.hstun===0&&!this.isDummy) {
      this.shieldActive=true; this.shieldTimer=SHIELD_FRAMES;
      this.atk=null; this.comboPend=false; this.charging=false; this.chargeTime=0;
    }
    if (this.shieldActive) {
      this.shieldTimer--;
      if (this.shieldTimer<=0){this.shieldActive=false;this.shieldCooldown=this.ch.shieldCool??SHIELD_COOLDOWN;}
    }
    if (this.shieldCooldown>0) this.shieldCooldown--;

    const free=this.hstun===0&&!this.isDummy&&!this.shieldActive;
    const inAtk=this.atk&&this.atk.frame<this.atk.su+this.atk.act;

    // Dash system (8-directional aerial burst)
    if(this.dashCD>0) this.dashCD--;
    if(inp.dash&&!inp.hold&&!this.dashActive&&this.dashCD===0&&free&&!this.atk&&!this.charging){
      this.dashActive=true; this.dashTimer=DASH_FRAMES;
      const ds=this.ch.speed*DASH_MULT;
      let dx=(inp.right?1:0)-(inp.left?1:0);
      let dy=(inp.down?1:0)-(inp.up?1:0);
      if(dx===0&&dy===0) dx=this.facing;
      const len=Math.hypot(dx,dy)||1;
      this.vx=(dx/len)*ds; this.vy=(dy/len)*ds;
      if(dx!==0&&!inAtk) this.facing=dx>0?1:-1;
    }
    if(this.dashActive){this.dashTimer--;this.vx*=0.88;this.vy*=0.88;if(this.dashTimer<=0){this.dashActive=false;this.dashCD=DASH_COOLDOWN;}}

    // Boost system: drain while held, recharge at same rate when not held. No lock-out.
    if(inp.boost&&!inp.hold&&free&&this.boostFuel>0){
      this.boostActive=true;
      this.boostFuel--;
    } else {
      this.boostActive=false;
      if(this.boostFuel<BOOST_MAX) this.boostFuel++;
    }

    // Flight movement: thrust on held direction, momentum drift otherwise
    const speedCap=this.ch.speed*(this.boostActive?BOOST_SPEED_MULT:1);
    if(free&&!this.dashActive&&!this.charging){
      if(!inp.hold){
        if(inp.left){this.vx=Math.max(this.vx-FLY_ACCEL,-speedCap);if(!inAtk)this.facing=-1;}
        else if(inp.right){this.vx=Math.min(this.vx+FLY_ACCEL,speedCap);if(!inAtk)this.facing=1;}
        else{this.vx*=0.88;if(Math.abs(this.vx)<0.05)this.vx=0;}
        const vCap=speedCap*0.9;
        if(inp.up){this.vy=Math.max(this.vy-FLY_ACCEL,-vCap);}
        else if(inp.down){this.vy=Math.min(this.vy+FLY_ACCEL,vCap);}
        else{this.vy*=0.88;if(Math.abs(this.vy)<0.05)this.vy=0;}
      } else {
        // hold active: instant stop, but allow facing change
        this.vx=0; this.vy=0;
        if(!inAtk){if(inp.left)this.facing=-1;else if(inp.right)this.facing=1;}
      }
    } else if(!this.dashActive&&!this.charging){
      this.vx*=FLY_FRIC; this.vy*=FLY_FRIC;
    }
    if(this.charging){this.vx*=0.75;this.vy*=0.75;if(Math.abs(this.vx)<0.1)this.vx=0;if(Math.abs(this.vy)<0.1)this.vy=0;}

    // Clamp speed
    if(this.vx>MAX_FLY_SPEED)this.vx=MAX_FLY_SPEED; else if(this.vx<-MAX_FLY_SPEED)this.vx=-MAX_FLY_SPEED;
    if(this.vy>MAX_FLY_SPEED)this.vy=MAX_FLY_SPEED; else if(this.vy<-MAX_FLY_SPEED)this.vy=-MAX_FLY_SPEED;

    // Boost particle trail
    if(this.boostActive&&G.frame%2===0){
      const spd=Math.hypot(this.vx,this.vy)||1;
      for(let i=0;i<2;i++){
        const spread=(Math.random()-0.5)*8;
        const px=-this.vx/spd, py=-this.vy/spd;
        const perp={x:-py,y:px};
        particles.push({x:this.cx+perp.x*spread,y:this.cy+this.h*0.1+perp.y*spread,
          vx:px*(2+Math.random()*2)+(Math.random()-0.5)*1.5,
          vy:py*(2+Math.random()*2)+(Math.random()-0.5)*1.5,
          life:18,max:18,col:Math.random()<0.5?'#aaddff':'#ffffff',sz:3+Math.random()*3});
      }
    }

    this.y+=this.vy; this.x+=this.vx;

    // Border walls: clamp position and zero velocity on the blocked axis
    if(G.bordersOn){
      if(this.x<VIS_LEFT){this.x=VIS_LEFT;if(this.vx<0)this.vx=0;}
      if(this.right>VIS_RIGHT){this.x=VIS_RIGHT-this.w;if(this.vx>0)this.vx=0;}
      if(this.y<VIS_TOP){this.y=VIS_TOP;if(this.vy<0)this.vy=0;}
      if(this.bottom>VIS_BOT){this.y=VIS_BOT-this.h;if(this.vy>0)this.vy=0;}
    }

    this.onGnd=false; this.onPlat=false;

    // Solid AABB collision for ground, grounds[], and plats[] (all directions block)
    const solids=[st.ground];
    if(st.grounds) for(const sg of st.grounds) solids.push(sg);
    if(st.plats) for(const pl of st.plats) solids.push(pl);
    // Boulder is a solid obstacle (AABB approximation of its circle)
    if(G.boulder&&!G.boulder.dead) solids.push(G.boulder.rect);
    for(const s of solids){
      if(this.right<=s.x||this.x>=s.x+s.w||this.bottom<=s.y||this.y>=s.y+s.h) continue;
      // Compute penetration on each axis; resolve along smaller axis
      const penLeft=this.right-s.x;       // pushing player left
      const penRight=s.x+s.w-this.x;      // pushing player right
      const penUp=this.bottom-s.y;        // pushing player up
      const penDown=s.y+s.h-this.y;       // pushing player down
      const penX=Math.min(penLeft,penRight);
      const penY=Math.min(penUp,penDown);
      if(penX<penY){
        if(penLeft<penRight){this.x=s.x-this.w;}
        else{this.x=s.x+s.w;}
        this.vx=0;
      } else {
        if(penUp<penDown){this.y=s.y-this.h;}
        else{this.y=s.y+s.h;}
        this.vy=0;
      }
    }

    if(!inp.left&&!inp.right&&free&&!inAtk&&!this.charging&&opp&&!opp.dead) this.facing=opp.cx>this.cx?1:-1;

    // PRISTINE: flyActive visual disabled now that the jump button is repurposed for grab.

    // BLASTER: fire bullets (3-shot side heavy, rocket-jump down heavy, triangle up heavy)
    if(this.atk&&this.ch.id===3){
      const _d=this.atk.dir,_h=this.atk.type==='heavy';
      if(_h&&_d!=='up'&&_d!=='down'){
        // 3-shot rapid fire: fire at su+0, su+3, su+6
        if(!this.atk.shotsF)this.atk.shotsF=0;
        const sf=this.atk.frame,ssu=this.atk.su;
        if(this.atk.shotsF===0&&sf>=ssu){this.fireBullet(this.atk.type,_d,0);this.atk.shotsF=1;}
        else if(this.atk.shotsF===1&&sf>=ssu+3){this.fireBullet(this.atk.type,_d,1);this.atk.shotsF=2;}
        else if(this.atk.shotsF===2&&sf>=ssu+6){this.fireBullet(this.atk.type,_d,2);this.atk.shotsF=3;}
      } else if(!this.atk.bulletFired&&this.atk.frame===this.atk.su){
        this.atk.bulletFired=true;
        if(_h&&_d==='down'){this.vy=this.ch.jumpF*1.25;this.onGnd=false;this.onPlat=false;}
        else if(_h&&_d==='up'){this.fireBullet(this.atk.type,_d,0);this.fireBullet(this.atk.type,_d,1);this.fireBullet(this.atk.type,_d,2);}
        else{this.fireBullet(this.atk.type,_d);}
      }
    }
    // ROCKET: fire arms on first active G.frame
    if(this.atk&&this.ch.id===6&&!this.atk.bulletFired&&this.atk.frame===this.atk.su){
      this.atk.bulletFired=true;
      this.fireRocketAttack(this.atk.type,this.atk.dir);
    }
    // BLADE special attack effects
    if(this.atk&&this.ch.id===8){
      const ba=this.atk, bd=ba.dir, bh=ba.type==='heavy', f=this.facing;
      const kspd=14;
      const bx=f>0?this.right:this.x, by=this.cy-this.h*0.15;
      // Up light: two-phase arc — reset hit at midpoint (was down light)
      if(!bh&&bd==='up'){
        const half=Math.floor(ba.act/2);
        if(ba.frame===ba.su+half)ba.hit=false;
      }
      // Down light: 3 knife spread downward on first active G.frame
      if(!bh&&bd==='down'&&!ba.bulletFired&&ba.frame===ba.su){
        ba.bulletFired=true;
        playSfx({freq:1100,freq2:350,type:'sine',decay:0.1,vol:0.15});
        const spd=kspd;
        knives.push(new Knife(this.cx,by,-spd*0.32,spd*0.95,this,true));
        knives.push(new Knife(this.cx,by,0,spd,this,true));
        knives.push(new Knife(this.cx,by, spd*0.32,spd*0.95,this,true));
      }
      // Side light comboN=2: throw knife on first active G.frame
      if(!bh&&(bd==='side'||bd==='neutral')&&ba.comboN===2&&!ba.bulletFired&&ba.frame===ba.su){
        ba.bulletFired=true;
        playSfx({freq:1200,freq2:400,type:'sine',decay:0.07,vol:0.14});
        knives.push(new Knife(bx,by,f*kspd,0,this,false));
      }
      // Side heavy: throw sword at end of active frames (second half)
      if(bh&&(bd==='side'||bd==='neutral')){
        const half=Math.floor(ba.act/2);
        if(!ba.bulletFired&&ba.frame===ba.su+half){
          ba.bulletFired=true;
          playSfx({freq:800,freq2:200,type:'triangle',decay:0.14,vol:0.16});
          throwSwords.push(new ThrowSword(bx,by,f*(kspd+2),this));
        }
      }
      // Down heavy: dual knife throw on first active G.frame
      if(bh&&bd==='down'&&!ba.bulletFired&&ba.frame===ba.su){
        ba.bulletFired=true;
        playSfx({freq:1000,freq2:300,type:'sine',decay:0.09,vol:0.15});
        knives.push(new Knife(this.cx,by,-kspd,0,this,false));
        knives.push(new Knife(this.cx,by, kspd,0,this,false));
      }
      // Up heavy: 3 knife spread on first active G.frame
      if(bh&&bd==='up'&&!ba.bulletFired&&ba.frame===ba.su){
        ba.bulletFired=true;
        playSfx({freq:1100,freq2:350,type:'sine',decay:0.1,vol:0.15});
        const spd=kspd;
        knives.push(new Knife(this.cx,by,-spd*0.32,-spd*0.95,this,true));
        knives.push(new Knife(this.cx,by,0,-spd,this,true));
        knives.push(new Knife(this.cx,by, spd*0.32,-spd*0.95,this,true));
      }
    }
    // UNSTABLE special attack effects
    if(this.atk&&this.ch.id===7){
      const ua=this.atk, ud=ua.dir, uh=ua.type==='heavy';
      // Side light: dash like shift-dash but 75% strength
      if(!uh&&(ud==='side'||ud==='neutral')&&ua.frame===ua.su){
        this.vx=this.facing*this.ch.speed*DASH_MULT*0.75;
        this.dashActive=true; this.dashTimer=DASH_FRAMES;
      }
      // Up light: fire head projectile on first active G.frame
      if(!uh&&ud==='up'&&!ua.bulletFired&&ua.frame===ua.su){
        ua.bulletFired=true;
        playSfx({freq:300,freq2:600,type:'sine',decay:0.08,vol:0.15});
        playSfx({freq:600,freq2:180,type:'square',decay:0.14,vol:0.1});
        unstableHeads.push(new UnstableHead(this.cx,this.y-4,this));
      }
      // Down light: spawn smoke cloud on first active G.frame
      if(!uh&&ud==='down'&&!ua.bulletFired&&ua.frame===ua.su){
        ua.bulletFired=true;
        playSfxNoise(0.2,0.2,100);
        smokeClouds.push(new SmokeCloud(this.cx,this.cy+this.h*0.3,this));
      }
      // Down heavy: self-damage + explosion on first active G.frame; atk.hit prevents repeat
      if(uh&&ud==='down'&&!ua.bulletFired&&ua.frame===ua.su){
        ua.bulletFired=true;
        playSfxNoise(0.22,0.4,80);
        playSfx({freq:120,freq2:40,type:'sawtooth',decay:0.25,vol:0.2});
        if(!this.isDummy){this.damage+=8;this.hitFlash=14;}
        addHitParticles(this.cx,this.cy,'#ff4400',true);
        G.shakeX+=(Math.random()-.5)*12; G.shakeY+=(Math.random()-.5)*12;
      }
      // Up heavy: launch self + spawn smoke cloud below on first active G.frame
      if(uh&&ud==='up'&&!ua.bulletFired&&ua.frame===ua.su){
        ua.bulletFired=true;
        playSfxNoise(0.16,0.25,150);
        playSfx({freq:180,freq2:80,type:'sawtooth',decay:0.2,vol:0.15});
        this.vy=this.ch.jumpF*1.5; this.onGnd=false; this.onPlat=false; this.jLeft=1;
        smokeClouds.push(new SmokeCloud(this.cx,this.bottom+30,this));
      }
    }
    // PRISTINE special attack effects
    if(this.atk&&this.ch.id===10){
      const pa=this.atk,pd=pa.dir,ph=pa.type==='heavy';
      const bspd=this.ch.beamSpd||14,range=this.ch.lightBeamRange||175;
      const f=this.facing,bx=f>0?this.right:this.x,by=this.cy-this.h*0.15;
      if(!pa.bulletFired&&pa.frame===pa.su){
        pa.bulletFired=true;
        playSfx({freq:ph?440:880,freq2:ph?220:440,type:'sine',decay:ph?0.3:0.14,vol:0.14});
        if(!ph){
          // Light attacks: laser beams
          const pDmg=Math.round(this.ch.lDmg*1.5);
          if(pd==='side'||pd==='neutral'){
            const b=new Bullet(bx,by,f*bspd,0,this,false);
            b.dmg=pDmg;b.kb=this.ch.lKB;b.maxDist=range;b.size=4;bullets.push(b);
          } else if(pd==='up'){
            const vx=bspd*0.342, vy=bspd*0.940;
            const bl=new Bullet(this.cx,by,-vx,-vy,this,false);bl.dmg=pDmg;bl.kb=this.ch.lKB;bl.maxDist=range;bl.size=4;
            const br=new Bullet(this.cx,by,vx,-vy,this,false);br.dmg=pDmg;br.kb=this.ch.lKB;br.maxDist=range;br.size=4;
            bullets.push(bl,br);
          } else if(pd==='down'){
            const vx=bspd*0.342, vy=bspd*0.940;
            const bl=new Bullet(this.cx,by,-vx,vy,this,false);bl.dmg=pDmg;bl.kb=this.ch.lKB;bl.maxDist=range;bl.size=4;
            const br=new Bullet(this.cx,by,vx,vy,this,false);br.dmg=pDmg;br.kb=this.ch.lKB;br.maxDist=range;br.size=4;
            bullets.push(bl,br);
          }
        } else {
          // Heavy attacks
          if(pd==='side'||pd==='neutral'){
            pristineRockets.push(new PristineRocket(this.cx,this.cy,f*8,0,this));
            this.pristineRocketCd=300;
          } else if(pd==='down'){
            this.laserShieldActive=true;this.laserShieldTimer=60;
          } else if(pd==='up'){
            // 4 diagonal beams
            const d=bspd*0.707;
            const dirs=[[-d,-d],[d,-d],[-d,d],[d,d]];
            for(const [vx,vy] of dirs){
              const b=new Bullet(this.cx,this.cy,vx,vy,this,false);
              b.dmg=Math.round(this.ch.lDmg*1.5);b.kb=this.ch.lKB;b.maxDist=range+20;b.wide=true;b.size=4;
              bullets.push(b);
            }
          }
        }
      }
    }
    // PRISTINE laser shield timer
    if(this.ch.id===10&&this.laserShieldActive){
      this.laserShieldTimer--;if(this.laserShieldTimer<=0)this.laserShieldActive=false;
    }
    // PRISTINE rocket cooldown tick
    if(this.ch.id===10&&this.pristineRocketCd>0) this.pristineRocketCd--;

    // MAGMA: flamethrower hold, fuel, and projectile attacks
    if(this.ch.id===11){
      const ma=this.atk, fuelMax=this.ch.flameFuelMax||180;
      const isFlaming=ma&&ma.type==='light'&&(ma.dir==='side'||ma.dir==='neutral'||ma.dir==='up')&&ma.frame>=ma.su;
      // Fuel recharge when not firing flamethrower
      if(!isFlaming&&this.magmaFuel<fuelMax) this.magmaFuel=Math.min(fuelMax,this.magmaFuel+(this.ch.flameRechargeRate??1));
      if(ma){
        const md=ma.dir, mh=ma.type==='heavy', f=this.facing;
        const bx2=f>0?this.right:this.x, by2=this.cy-this.h*0.1;
        // Side/neutral light: holdable flamethrower
        if(!mh&&(md==='side'||md==='neutral')){
          if(ma.frame>=ma.su){
            // Extend active while held and fueled
            if(inp.lightHeld&&this.magmaFuel>0) { ma.act++; this.magmaFuel--; }
            // Continuous damage tick every 8 frames
            if(ma.frame%8===0){
              const range=this.ch.flameRange||220;
              const fx=f>0?this.right:this.x-range;
              const fy=this.cy-28, fh=56;
              if(opps) for(const tgt of opps){
                if(tgt.dead||tgt.shieldActive||tgt.laserShieldActive)continue;
                if(aabb({x:fx,y:fy,w:range,h:fh},{x:tgt.x,y:tgt.y,w:tgt.w,h:tgt.h})){
                  if(tgt.damage>=DEATH_THRESHOLD&&!tgt.isDummy){instakill(tgt,tgt.cx,tgt.cy);continue;}
                  tgt.damage+=Math.round(2.8*(tgt.ch.def??1)); tgt.hitFlash=5;
                  tgt.vx+=f*0.8; // slight pushback
                }
              }
            }
          }
        }
        // Up light: holdable upward flamethrower (both arms, double width)
        if(!mh&&md==='up'){
          if(ma.frame>=ma.su){
            if(inp.lightHeld&&this.magmaFuel>0) { ma.act++; this.magmaFuel--; }
            if(ma.frame%8===0){
              const range=this.ch.flameRange||220;
              const fx=this.cx-range, fy=this.y-range, fw=range*2, fh=range;
              if(opps) for(const tgt of opps){
                if(tgt.dead||tgt.shieldActive||tgt.laserShieldActive)continue;
                if(aabb({x:fx,y:fy,w:fw,h:fh},{x:tgt.x,y:tgt.y,w:tgt.w,h:tgt.h})){
                  if(tgt.damage>=DEATH_THRESHOLD&&!tgt.isDummy){instakill(tgt,tgt.cx,tgt.cy);continue;}
                  tgt.damage+=Math.round(2.8*(tgt.ch.def??1)); tgt.hitFlash=5;
                  tgt.vy-=0.6; // slight upward push
                }
              }
            }
          }
        }
        // Down light: fire linger fireballs both sides on first active G.frame
        if(!mh&&md==='down'&&!ma.bulletFired&&ma.frame===ma.su){
          ma.bulletFired=true;
          playSfxNoise(0.12,0.22,150);
          playSfx({freq:200,freq2:80,type:'sawtooth',decay:0.12,vol:0.14});
          const bspd=14, by3=this.cy;
          const fl=new FirePebble(this.cx,by3,-bspd,this,true);
          fl.maxDist=220; fl.dmg=this.ch.lDmg; fl.kb=this.ch.lKB;
          const fr=new FirePebble(this.cx,by3,bspd,this,true);
          fr.maxDist=220; fr.dmg=this.ch.lDmg; fr.kb=this.ch.lKB;
          firePebbles.push(fl,fr);
        }
        // Side heavy: fire pebble on first active G.frame
        if(mh&&(md==='side'||md==='neutral')&&!ma.bulletFired&&ma.frame===ma.su){
          ma.bulletFired=true;
          playSfxNoise(0.14,0.28,100);
          playSfx({freq:160,freq2:60,type:'sawtooth',decay:0.18,vol:0.16});
          firePebbles.push(new FirePebble(bx2,by2,f*8,this));
        }
        // Down heavy: fire-jet launch (same as Blaster rocket jump)
        if(mh&&md==='down'&&!ma.bulletFired&&ma.frame===ma.su){
          ma.bulletFired=true;
          this.vy=this.ch.jumpF*1.25; this.onGnd=false; this.onPlat=false;
        }
        // Up heavy: semi-circle fire above — hitbox handled in hitbox()
      }
    }

    // FACTORY special mechanics
    if(this.ch.id===12){
      if(this.factoryBoltCD>0) this.factoryBoltCD--;
      if(this.factoryZapCD>0) this.factoryZapCD--;
      if(this.atk){
        const fa=this.atk, fd=fa.dir, fh=fa.type==='heavy', f=this.facing;
        // Down light: launch Bolt minion on first active G.frame
        if(!fh&&fd==='down'&&!fa.bulletFired&&fa.frame===fa.su){
          fa.bulletFired=true;
          playSfx({freq:110,freq2:55,type:'sawtooth',decay:0.18,vol:0.18});
          playSfxNoise(0.1,0.12,500);
          this.factoryBoltCD=this.ch.boltCDMax||300;
          const opp=opps&&opps.find(p=>!p.dead)||null;
          let bvx=f*4.5, bvy=-0.5;
          if(opp){const dx=opp.cx-this.cx,dy=opp.cy-this.cy,dist=Math.hypot(dx,dy)||1,spd=4.5;bvx=dx/dist*spd;bvy=dy/dist*spd;}
          factoryBolts.push(new FactoryBolt(this.cx,this.cy-20,bvx,bvy,this));
        }
        // Up light: launch gear upward on first active G.frame
        if(!fh&&fd==='up'&&!fa.bulletFired&&fa.frame===fa.su){
          fa.bulletFired=true;
          playSfx({freq:150,freq2:80,type:'sawtooth',decay:0.15,vol:0.17});
          factoryGears.push(new FactoryGear(this.cx,this.y-5,this));
        }
        // Side heavy: drill multi-hit every 10 frames during active
        if(fh&&(fd==='side'||fd==='neutral')&&fa.frame>=fa.su&&fa.frame<fa.su+fa.act){
          const reach=this.ch.hRch, sz=this.ch.hSz;
          const hx=f>0?this.right-8:this.x-reach+8;
          const hb={x:hx,y:this.cy-sz,w:reach,h:sz*2};
          if((fa.frame-fa.su)%10===0&&opps){
            for(const tgt of opps){
              if(tgt.dead||tgt.shieldActive||tgt.laserShieldActive)continue;
              if(!aabb(hb,{x:tgt.x,y:tgt.y,w:tgt.w,h:tgt.h}))continue;
              if(tgt.damage>=DEATH_THRESHOLD&&!tgt.isDummy){instakill(tgt,tgt.cx,tgt.cy);continue;}
              tgt.damage+=Math.round(this.ch.hDmg*0.4*(tgt.ch.def??1)); tgt.hitFlash=8;
              const km=kbScale(tgt.damage), kb=this.ch.hKB*0.3*km/tgt.ch.weight;
              tgt.vx=f*kb; tgt.vy=-kb*0.05;
              tgt.vx=Math.max(-MAX_KB,Math.min(MAX_KB,tgt.vx)); tgt.vy=Math.max(-MAX_KB,Math.min(MAX_KB,tgt.vy));
              tgt.hstun=Math.min(20,Math.floor(3+kb*0.8)); tgt.hitlag=3;
              addHitParticles(tgt.cx,tgt.cy,this.ch.eyeCol,false);
            }
          }
        }
        // Down heavy: spawn 3 Zaps + fire directional bullets on first active G.frame
        if(fh&&fd==='down'&&!fa.bulletFired&&fa.frame===fa.su){
          fa.bulletFired=true;
          playSfx({freq:400,freq2:900,type:'square',decay:0.15,vol:0.16});
          playSfxNoise(0.12,0.2,800);
          this.factoryZapCD=this.ch.zapCDMax||180;
          const opp=opps&&opps.find(p=>!p.dead)||null;
          for(const ox of [-50,0,50]){
            const zx=this.cx+ox, zy=this.cy+10;
            factoryZaps.push(new FactoryZap(zx,zy,this));
            let bvx=f*10, bvy=0;
            if(opp){const dx=opp.cx-zx,dy=opp.cy-zy,dist=Math.hypot(dx,dy)||1,bspd=10;bvx=dx/dist*bspd;bvy=dy/dist*bspd;}
            const b=new Bullet(zx,zy,bvx,bvy,this,false);
            b.dmg=Math.round(this.ch.hDmg*0.5); b.kb=this.ch.hKB*0.5; b.maxDist=450;
            bullets.push(b);
          }
        }
      }
    }

    // KING special mechanics: shield rotation + flaming sword timer
    if(this.ch.id===14){
      // Sword fire timer counts down each G.frame
      if(this.kingFireTimer>0) this.kingFireTimer--;
      // Shield rotation tween (smooth quarter-turn animation)
      if(this.kingShieldRotateT>0){
        this.kingShieldRotateT--;
        const rt=1-this.kingShieldRotateT/8; // 0 -> 1 over 8 frames
        // Ease out
        const eased=1-Math.pow(1-rt,2);
        this.kingShieldAngle=this.kingShieldRotateFrom+(this.kingShieldRotateTo-this.kingShieldRotateFrom)*eased;
        if(this.kingShieldRotateT===0) this.kingShieldAngle=this.kingShieldRotateTo;
      }
      if(this.atk){
        const ka=this.atk, kd=ka.dir, kh=ka.type==='heavy';
        // Down light: trigger shield 90° clockwise rotation on first active G.frame
        if(!kh&&kd==='down'&&!ka.bulletFired&&ka.frame===ka.su){
          ka.bulletFired=true;
          this.kingShieldRotateFrom=this.kingShieldAngle;
          this.kingShieldRotateTo=this.kingShieldAngle+Math.PI/2;
          this.kingShieldRotateT=8;
          playSfx({freq:480,freq2:240,type:'square',decay:0.12,vol:0.14});
        }
        // Side heavy: reset hit flag at the swing→poke phase transition so the poke can also connect
        if(kh&&(kd==='side'||kd==='neutral')){
          const half=Math.floor(ka.act/2);
          if(ka.frame===ka.su+half){ ka.hit=false; }
        }
        // Up heavy: spinning whirlwind — reset hit every 8 active frames so the spin can hit multiple opponents
        if(kh&&kd==='up'&&ka.frame>=ka.su&&ka.frame<ka.su+ka.act){
          const af=ka.frame-ka.su;
          if(af>0&&af%8===0) ka.hit=false;
        }
        // Down heavy: light sword on fire on first active G.frame
        if(kh&&kd==='down'&&!ka.bulletFired&&ka.frame===ka.su){
          ka.bulletFired=true;
          this.kingFireTimer=this.ch.kingFireDuration||120;
          playSfx({freq:220,freq2:80,type:'sawtooth',decay:0.25,vol:0.18});
          playSfxNoise(0.15,0.3,200);
          // Visual whoosh particles around sword
          for(let k=0;k<8;k++){
            const a=Math.random()*Math.PI*2,sp=2+Math.random()*3;
            particles.push({x:this.cx,y:this.cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1,life:24,max:24,col:k%2?'#ff6600':'#ffcc00',sz:3});
          }
        }
      }
    }

    // CRUSHER heavy cooldowns
    if(this.ch.id===1){
      if(this.crusherSideHeavyCD>0) this.crusherSideHeavyCD--;
      if(this.crusherUpHeavyCD>0) this.crusherUpHeavyCD--;
      if(this.crusherDownHeavyCD>0) this.crusherDownHeavyCD--;
    }
    // ROCKET cooldowns
    if(this.ch.id===6){
      if(this.rocketLightCD>0) this.rocketLightCD--;
      if(this.rocketSideHeavyCD>0) this.rocketSideHeavyCD--;
      if(this.rocketUpHeavyCD>0) this.rocketUpHeavyCD--;
    }
    // GLITCH special mechanics
    if(this.ch.id===13){
      if(this.glitchPhaseTimer>0) this.glitchPhaseTimer--;
      if(this.atk){
        const ga=this.atk, gd=ga.dir, gh=ga.type==='heavy', f=this.facing;
        // Down light: arm teleport below (hitbox handled in hitbox())
        // Side heavy: Blaster 3-shot burst at su+0, su+3, su+6 using Blaster's actual values
        if(gh&&(gd==='side'||gd==='neutral')&&this.glitchWeapon==='blaster'){
          if(!ga.shotsF) ga.shotsF=0;
          const sf=ga.frame, ssu=ga.su;
          const bx2=f>0?this.right:this.x, by2=this.cy-this.h*0.1;
          const dmgs=[2,3.5,5.6], kbs=[4.0,5.5,7.0];
          if(ga.shotsF===0&&sf>=ssu){const b=new Bullet(bx2,by2,f*12,0,this,false);b.dmg=dmgs[0];b.kb=kbs[0];b.maxDist=220;bullets.push(b);ga.shotsF=1;}
          else if(ga.shotsF===1&&sf>=ssu+3){const b=new Bullet(bx2,by2,f*12,0,this,false);b.dmg=dmgs[1];b.kb=kbs[1];b.maxDist=220;bullets.push(b);ga.shotsF=2;}
          else if(ga.shotsF===2&&sf>=ssu+6){const b=new Bullet(bx2,by2,f*12,0,this,false);b.dmg=dmgs[2];b.kb=kbs[2];b.maxDist=220;bullets.push(b);ga.shotsF=3;}
        }
        // Down heavy: disappear on first active G.frame, reappear+damage at end of active
        if(gh&&gd==='down'){
          if(ga.frame===ga.su){
            this.glitchGhost=true;
          }
          if(ga.frame===ga.su+ga.act){
            this.glitchGhost=false;
            // deal damage to any opponent overlapping Glitch's body on reappear
            if(opps){
              for(const tgt of opps){
                if(tgt.dead||tgt.hitImmune>0||tgt.shieldActive||tgt.laserShieldActive) continue;
                if(!aabb({x:this.x-8,y:this.y-8,w:this.w+16,h:this.h+16},{x:tgt.x,y:tgt.y,w:tgt.w,h:tgt.h})) continue;
                if(tgt.damage>=DEATH_THRESHOLD&&!tgt.isDummy){instakill(tgt,tgt.cx,tgt.cy);continue;}
                tgt.damage+=Math.round(this.ch.hDmg*1.2*(tgt.ch.def??1));
                tgt.hitFlash=15;
                const km=kbScale(tgt.damage), kb=this.ch.hKB*1.3*km/tgt.ch.weight;
                tgt.vx=f*kb; tgt.vy=-kb*0.25;
                tgt.vx=Math.max(-MAX_KB,Math.min(MAX_KB,tgt.vx)); tgt.vy=Math.max(-MAX_KB,Math.min(MAX_KB,tgt.vy));
                tgt.hstun=Math.min(30,Math.floor(5+kb*1.4)); tgt.hitlag=6; this.hitlag=4;
                addHitParticles(tgt.cx,tgt.cy,this.ch.eyeCol,true);
              }
            }
          }
        }
        // Up heavy: teleport self upward on first active G.frame
        if(gh&&gd==='up'&&!ga.bulletFired&&ga.frame===ga.su){
          ga.bulletFired=true;
          playSfx({freq:800,freq2:200,type:'square',decay:0.1,vol:0.16});
          playSfxNoise(0.08,0.15,600);
          this.y=Math.max(10,this.y-200);
          this.vy=0; this.onGnd=false; this.onPlat=false;
          addHitParticles(this.cx,this.cy+100,this.ch.color,false);
        }
      }
    }
    // EDGE up heavy: spawn mini sword; EDGE down heavy: dive force
    if(this.atk&&this.ch.id===4&&this.atk.type==='heavy'){
      if(this.atk.dir==='up'&&!this.atk.bulletFired&&this.atk.frame===this.atk.su){
        this.atk.bulletFired=true;
        playSfx({freq:500,freq2:180,type:'triangle',decay:0.16,vol:0.15});
        miniSwords.push(new MiniSword(this.cx-4,this.y-10,this));
      }
      if(this.atk.dir==='down'&&this.atk.frame>=this.atk.su&&this.atk.frame<this.atk.su+this.atk.act){
        this.vy=Math.min(MAX_FLY_SPEED+4,this.vy+6);
      }
    }

    // Charge heavy (CRUSHER=1, ZIPPY=2, PIERCE=5)
    const canCharge=[1,2,5].includes(this.ch.id);
    if(canCharge&&inp.heavy&&!this.atk&&!this.charging&&this.atkCD===0&&free){
      const cd=this.atkDir(inp);
      // CRUSHER: block charge if that direction is on cooldown
      let crusherBlocked=false;
      if(this.ch.id===1){
        if((cd==='side'||cd==='neutral')&&this.crusherSideHeavyCD>0) crusherBlocked=true;
        else if(cd==='up'&&this.crusherUpHeavyCD>0) crusherBlocked=true;
        else if(cd==='down'&&this.crusherDownHeavyCD>0) crusherBlocked=true;
      }
      if(!crusherBlocked){this.charging=true; this.chargeTime=0; this.chargeDir=cd;}
    }
    if(this.charging){
      this.chargeTime=Math.min(this.chargeTime+1,240);
      if(inp.heavyRelease){
        const cr=Math.min(1,this.chargeTime/240);
        this.charging=false; this.startAtk('heavy',this.chargeDir,null,cr);
      }
    }

    // Generalized combo detection (any character with maxCombo>1)
    if(this.atk&&this.ch.maxCombo>1&&this.atk.type==='light'){
      const inEl=this.atk.frame>=this.atk.su; // buffer from active frames onward
      if(inEl&&inp.light&&(this.atk.comboN||1)<this.ch.maxCombo) this.comboPend=true;
    }

    // Attack input
    if(free&&this.atkCD===0&&!this.atk&&!this.charging){
      // If a rock is held and the player presses light/heavy, drop the rock first.
      if(this.heldRock&&(inp.light||inp.heavy)){
        const r=this.heldRock;
        r.heldBy=null; r.thrown=false;
        // Tiny outward drift so it doesn't immediately re-collide with the player
        r.vx=this.facing*1.2; r.vy=-0.4;
        this.heldRock=null;
      }
      const ad=this.atkDir(inp);
      if(this.ch.id===6){
        // ROCKET: check arm availability per attack type
        if(inp.light&&this.rocketLightCD===0) this.startAtk('light',ad);
        else if(inp.heavy&&ad==='up'&&this.rocketUpHeavyCD===0) this.startAtk('heavy','up');
        else if(inp.heavy&&ad==='down') this.startAtk('heavy','down');
        else if(inp.heavy&&(ad==='side'||ad==='neutral')&&this.rocketSideHeavyCD===0) this.startAtk('heavy','side');
      } else if(this.ch.id===12){
        // FACTORY: block down attacks when on cooldown
        if(inp.light){if(!(ad==='down'&&this.factoryBoltCD>0))this.startAtk('light',ad);}
        else if(inp.heavy){if(!(ad==='down'&&this.factoryZapCD>0))this.startAtk('heavy',ad);}
      } else if(this.ch.id===10){
        // PRISTINE: side heavy blocked by rocket cooldown; other attacks free
        if(inp.light) this.startAtk('light',ad);
        else if(inp.heavy&&!canCharge){
          const sideBlocked=(ad==='side'||ad==='neutral')&&this.pristineRocketCd>0;
          if(!sideBlocked) this.startAtk('heavy',ad);
        }
      } else if(this.ch.id===13){
        // GLITCH: cannot attack while phase is active
        if(this.glitchPhaseTimer===0){
          if(inp.light) this.startAtk('light',ad);
          else if(inp.heavy) this.startAtk('heavy',ad);
        }
      } else {
        if(inp.light) this.startAtk('light',ad);
        else if(inp.heavy&&!canCharge) this.startAtk('heavy',ad);
      }
    }

    // Update attack
    if(this.atk){
      this.atk.frame++;
      if(!this.atk.hit){
        const hb=this.hitbox();
        if(hb&&opps){
          for(const tgt of opps){
            if(!tgt.dead&&tgt.hitlag===0&&tgt.hitImmune===0&&aabb(hb,{x:tgt.x,y:tgt.y,w:tgt.w,h:tgt.h})){
              this.land(tgt);this.atk.hit=true;break;
            }
          }
        }
      }
      const total=this.atk.su+this.atk.act+this.atk.el;
      if(this.atk.frame>=total){
        if(this.comboPend&&this.ch.maxCombo>1&&this.atk.type==='light'){
          const nxt=(this.atk.comboN||1)+1, dir=this.atk.dir;
          // EDGE/PIERCE: only advance to hit 3 if hit 2 connected
          if((this.ch.id===4||this.ch.id===5)&&nxt===3&&!this.atk.hit){this.atkCD=3;this.atk=null;this.comboPend=false;}
          else{this.atk=null;this.comboPend=false;this.startAtk('light',dir,nxt);}
        } else {
          if(this.ch.id===1&&this.atk.type==='heavy'){
            if(this.atk.dir==='side'||this.atk.dir==='neutral') this.crusherSideHeavyCD=180;
            else if(this.atk.dir==='up') this.crusherUpHeavyCD=180;
            else if(this.atk.dir==='down') this.crusherDownHeavyCD=180;
          }
          if(this.ch.id===6){
            if(this.atk.type==='light') this.rocketLightCD=4;
            if(this.atk.type==='heavy'&&(this.atk.dir==='side'||this.atk.dir==='neutral')) this.rocketSideHeavyCD=180;
            if(this.atk.type==='heavy'&&this.atk.dir==='up') this.rocketUpHeavyCD=210;
          }
          this.atkCD=3;this.atk=null;this.comboPend=false;
        }
      }
    }

    const moving=(this.onGnd||this.onPlat)&&(inp.left||inp.right)&&!this.charging;
    if(moving){this.wt++;if(this.wt>=6){this.wt=0;this.wf=(this.wf+1)%4;}}
  }

  fireBullet(type,dir,shotNum=0){
    playSfx({freq:type==='heavy'?600:900,freq2:type==='heavy'?150:200,type:'sawtooth',decay:0.1,vol:0.13});
    const heavy=type==='heavy', f=this.facing;
    const bx=f>0?this.right:this.x, by=this.cy-this.h*0.1;
    if(heavy&&dir!=='up'&&dir!=='down'){
      // 3-shot rapid side heavy: last shot ~70% of full heavy
      const dmgs=[2,3.5,5.6],kbs=[8.0,11.0,14.0];
      const b=new Bullet(bx,by,f*this.ch.bulletSpd,0,this,false);
      b.dmg=dmgs[Math.min(shotNum,2)]; b.kb=kbs[Math.min(shotNum,2)];
      b.maxDist=this.ch.lightBulletRange||220;
      bullets.push(b); return;
    }
    if(heavy&&dir==='up'){
      // Triangle spread: 3 bullets fanning outward
      const spd=this.ch.heavyBulletSpd;
      const sx=[-spd*0.32,0,spd*0.32],sy=[-spd*0.95,-spd,-spd*0.95];
      bullets.push(new Bullet(bx,by,sx[Math.min(shotNum,2)],sy[Math.min(shotNum,2)],this,true)); return;
    }
    const spd=heavy?this.ch.heavyBulletSpd:this.ch.bulletSpd;
    let vx=f*spd,vy=0;
    if(dir==='up'){vx=f*spd*0.2;vy=-spd;}
    else if(dir==='down'){vx=f*spd*0.2;vy=spd*0.8;}
    bullets.push(new Bullet(bx,by,vx,vy,this,heavy));
  }

  fireRocketAttack(type,dir){
    playSfx({freq:dir==='down'?120:200,freq2:40,type:'sawtooth',decay:0.28,vol:0.2});
    playSfxNoise(0.18,0.12,300);
    const f=this.facing, spd=8;
    const bx=this.cx, by=this.cy-this.h*0.1;
    if(type==='light'){
      let vx=f*spd,vy=0;
      if(dir==='up'){vx=f*spd*0.2;vy=-spd;}
      else if(dir==='down'){vx=f*spd*0.2;vy=spd;}
      rocketArms.push(new RocketArm(bx,by,vx,vy,this,false));
      this.armsLeft=Math.max(0,this.armsLeft-1);
    } else if(dir==='side'){
      // 2-arm side heavy: single projectile with dual visual (2.5× dmg/kb)
      const arm=new RocketArm(bx,by,f*spd,0,this,true);
      arm.dual=true; arm.dmgMult=2.5; arm.kbMult=4.0;
      rocketArms.push(arm);
      this.armsLeft=Math.max(0,this.armsLeft-2);
    } else if(dir==='up'){
      // 4-arm spread: left, right, diagonal-up-left, diagonal-up-right (halved range)
      const d=spd*0.707;
      const a1=new RocketArm(bx,by,-spd,0,this,true); a1.maxDist=98;
      const a2=new RocketArm(bx,by,spd,0,this,true);  a2.maxDist=98;
      const a3=new RocketArm(bx,by,-d,-d,this,true);   a3.maxDist=98;
      const a4=new RocketArm(bx,by,d,-d,this,true);    a4.maxDist=98;
      rocketArms.push(a1,a2,a3,a4);
      this.armsLeft=0;
    } else if(dir==='down'){
      // 2 hovering mines next to the robot
      rocketMines.push(new RocketMine(this.cx-55,this.cy,-1,this));
      rocketMines.push(new RocketMine(this.cx+55,this.cy,1,this));
      this.armsLeft=Math.max(0,this.armsLeft-2);
    }
  }

  startAtk(type,dir,comboN=null,chargeRatio=0){
    const c=this.ch;
    let su=type==='heavy'?c.hSU:c.lSU, act=type==='heavy'?c.hAct:c.lAct, el=type==='heavy'?c.hEl:c.lEl;
    let cn=null;
    if(c.maxCombo>1&&type==='light'){
      cn=comboN||1;
      if(c.id===4&&cn===3){su+=4;act+=3;el+=6;} // EDGE finisher slower
      else if(c.id===5&&cn===3){su+=3;act+=5;el+=6;} // PIERCE spear swing finisher
      else if(cn===c.maxCombo){su+=2;act+=2;el+=4;} // other finishers slightly slower
    }
    // BLADE direction-specific timing
    if(c.id===8){
      if(type==='light'&&(dir==='side'||dir==='neutral')){su=4;act=7;el=10;} // combo: jab + knife
      else if(type==='light'&&dir==='up'){su=6;act=16;el=12;} // two-phase arc (was down light)
      else if(type==='light'&&dir==='down'){su=10;act=8;el=18;} // downward knife spread (like up heavy)
      else if(type==='heavy'&&(dir==='side'||dir==='neutral')){su=12;act=14;el=20;} // swing+throw
      else if(type==='heavy'&&dir==='down'){su=8;act=6;el=14;}
      else if(type==='heavy'&&dir==='up'){su=10;act=8;el=18;}
    }
    // UNSTABLE direction-specific timing
    if(c.id===7){
      if(type==='light'&&(dir==='side'||dir==='neutral')){su=3;act=10;el=12;}
      else if(type==='light'&&dir==='up'){su=5;act=4;el=14;}
      else if(type==='light'&&dir==='down'){su=4;act=4;el=16;}
      else if(type==='heavy'&&(dir==='side'||dir==='neutral')){su=12;act=10;el=18;}
      else if(type==='heavy'&&dir==='down'){su=14;act=6;el=20;}
      else if(type==='heavy'&&dir==='up'){su=8;act=8;el=16;}
    }
    // ROCKET direction-specific timing
    if(c.id===6){
      if(type==='light'){su=2;act=5;el=8;}
      else if(dir==='down'){su=10;act=6;el=18;}
      else if(dir==='up'){su=10;act=8;el=22;}
      else{su=8;act=8;el=20;} // side heavy
    }
    // PRISTINE direction-specific timing
    if(c.id===10){
      if(type==='light'){su=3;act=6;el=8;}
      else if(dir==='down'){su=14;act=4;el=20;} // laser shield
      else if(dir==='up'){su=8;act=5;el=14;}    // 4 diagonal beams
      else{su=10;act=5;el=14;}                    // homing rocket
    }
    // BLASTER direction-specific heavy timing
    if(c.id===3&&type==='heavy'){
      if(dir==='down'){su=12;act=8;el=14;}   // rocket jump: short startup
      else if(dir==='up'){su=18;act=8;el=16;} // triangle: moderate startup
      else{su=25;act=14;}                      // side: halved startup, extra active frames for 3-shot burst
    }
    // MAGMA direction-specific timing
    if(c.id===11){
      if(type==='light'&&(dir==='side'||dir==='neutral')){su=4;act=6;el=14;} // flamethrower
      else if(type==='light'&&dir==='up'){su=5;act=6;el=14;}                  // upward flamethrower
      else if(type==='light'&&dir==='down'){su=5;act=6;el=12;}                // burst both sides
      else if(type==='heavy'&&(dir==='side'||dir==='neutral')){su=14;act=8;el=20;} // fire pebble
      else if(type==='heavy'&&dir==='down'){su=10;act=8;el=16;}               // fire-jet launch
      else if(type==='heavy'&&dir==='up'){su=12;act=14;el=22;}                // semicircle fire
    }
    // FACTORY direction-specific timing
    if(c.id===12){
      if(type==='light'&&(dir==='side'||dir==='neutral')){su=20;act=32;el=48;}  // gear swing (slower)
      else if(type==='light'&&dir==='up'){su=4;act=6;el=10;}                   // gear throw up
      else if(type==='light'&&dir==='down'){su=8;act=4;el=16;}                 // bolt launch
      else if(type==='heavy'&&(dir==='side'||dir==='neutral')){su=12;act=60;el=24;} // drill spin 1s
      else if(type==='heavy'&&dir==='down'){su=10;act=4;el=20;}                // zap deploy
      else if(type==='heavy'&&dir==='up'){su=18;act=14;el=22;}                 // pendulum swing
    }
    // EDGE direction-specific timing
    if(c.id===4){
      if(type==='heavy'&&(dir==='side'||dir==='neutral')){su=24;} // 0.2s extra startup on side heavy
    }
    // KING direction-specific timing
    if(c.id===14){
      if(type==='light'&&(dir==='side'||dir==='neutral')){su=6;act=8;el=12;}    // sword poke
      else if(type==='light'&&dir==='up'){su=6;act=14;el=12;}                    // pendulum swing above
      else if(type==='light'&&dir==='down'){su=4;act=4;el=14;}                   // shield rotate
      else if(type==='heavy'&&(dir==='side'||dir==='neutral')){su=10;act=20;el=18;} // swing then poke
      else if(type==='heavy'&&dir==='down'){su=10;act=6;el=18;}                  // light sword on fire
      else if(type==='heavy'&&dir==='up'){su=14;act=36;el=22;}                   // spinning sword whirlwind
    }
    // GLITCH direction-specific timing
    if(c.id===13){
      if(type==='light'&&(dir==='side'||dir==='neutral')){su=3;act=18;el=8;}   // arm teleport linger
      else if(type==='light'&&dir==='up'){su=3;act=18;el=8;}                   // both arms up
      else if(type==='light'&&dir==='down'){su=3;act=18;el=8;}                  // arm teleport below
      else if(type==='heavy'&&(dir==='side'||dir==='neutral')){
        const weapons=['edge','pierce','blaster'];
        this.glitchWeapon=weapons[Math.floor(Math.random()*3)];
        su=12; act=this.glitchWeapon==='blaster'?14:10; el=20;
      }
      else if(type==='heavy'&&dir==='down'){su=8;act=6;el=18;}                 // disappear+reappear
      else if(type==='heavy'&&dir==='up'){su=3;act=1;el=20;}                   // warp jump
    }
    this.atk={type,dir,frame:0,su,act,el,hit:false,comboN:cn,bulletFired:false,chargeRatio};
    sfxSwing(this.ch.id,type,dir);
  }

  hitbox(){
    if(!this.atk)return null;
    const a=this.atk;
    if(a.frame<a.su||a.frame>=a.su+a.act)return null;
    if(this.ch.id===10) return null; // PRISTINE: all projectile-based attacks
    if(this.ch.id===12){
      const heavy=a.type==='heavy', f=this.facing;
      if(!heavy&&(a.dir==='side'||a.dir==='neutral')){
        // Side light: gear swing arc to the side
        const reach=this.ch.lRch, sz=this.ch.lSz;
        const hx=f>0?this.right-8:this.x-reach+8;
        return{x:hx,y:this.cy-sz*2,w:reach,h:sz*3};
      }
      if(!heavy&&a.dir==='up') return null;   // FactoryGear handles this
      if(!heavy&&a.dir==='down') return null;  // FactoryBolt handles this
      if(heavy&&(a.dir==='side'||a.dir==='neutral')) return null; // drill: handled in update()
      if(heavy&&a.dir==='down') return null;   // Zap bullets handle this
      if(heavy&&a.dir==='up'){
        // Pendulum sweep: wide arc above head
        return{x:this.cx-this.ch.hRch,y:this.y-this.ch.hRch*0.7,w:this.ch.hRch*2,h:this.ch.hRch*0.8};
      }
      return null;
    }
    if(this.ch.id===13){
      const heavy=a.type==='heavy', f=this.facing, tar=this.ch.teleArmRange||150;
      if(!heavy&&(a.dir==='side'||a.dir==='neutral')){
        // Arm appears 150px in facing direction
        const armCX=this.cx+f*tar;
        return{x:armCX-12,y:this.cy-16,w:24,h:32};
      }
      if(!heavy&&a.dir==='up'){
        // Both arms appear 150px above
        return{x:this.cx-30,y:this.cy-tar-12,w:60,h:24};
      }
      if(!heavy&&a.dir==='down'){
        // Both arms appear 150px below
        return{x:this.cx-30,y:this.cy+tar-12,w:60,h:24};
      }
      if(heavy&&(a.dir==='side'||a.dir==='neutral')){
        // Depends on randomly chosen weapon
        const wep=this.glitchWeapon;
        if(wep==='edge'){const hx=f>0?this.cx-10:this.cx-118+10;return{x:hx,y:this.y-50,w:118,h:this.h+80};}
        if(wep==='pierce'){const hx=f>0?this.right-10:this.x-118+10;return{x:hx,y:this.cy-18,w:118,h:36};}
        return null; // blaster: bullet handles it
      }
      if(heavy&&a.dir==='down') return null; // reappear damage handled in update()
      if(heavy&&a.dir==='up') return null;   // teleport: no hitbox
      return null;
    }
    if(this.ch.id===14){
      const heavy=a.type==='heavy', f=this.facing;
      // Side light: forward sword poke (long, narrow)
      if(!heavy&&(a.dir==='side'||a.dir==='neutral')){
        const reach=this.ch.kingPokeReach||118, sz=28;
        const hx=f>0?this.right-8:this.x-reach+8;
        return{x:hx,y:this.cy-sz/2,w:reach,h:sz};
      }
      // Up light: pendulum swing — wide arc above head
      if(!heavy&&a.dir==='up'){
        return{x:this.cx-this.ch.lRch*0.55,y:this.y-this.ch.lRch*0.6,w:this.ch.lRch*1.1,h:this.ch.lRch*0.7};
      }
      // Down light: shield rotation — no hitbox
      if(!heavy&&a.dir==='down') return null;
      // Side heavy: two-phase swing then poke
      if(heavy&&(a.dir==='side'||a.dir==='neutral')){
        const half=Math.floor(a.act/2);
        if(a.frame<a.su+half){
          // Swing phase: shorter horizontal arc with vertical extent (overhead-to-side sweep)
          const sr=this.ch.kingSideHeavySwingReach||84;
          const hx=f>0?this.right-12:this.x-sr+12;
          return{x:hx,y:this.cy-44,w:sr,h:this.h+30};
        } else {
          // Poke phase: longer reach forward, narrow
          const pr=this.ch.kingSideHeavyPokeReach||124;
          const hx=f>0?this.right-8:this.x-pr+8;
          return{x:hx,y:this.cy-14,w:pr,h:28};
        }
      }
      // Down heavy: light sword on fire — no hitbox
      if(heavy&&a.dir==='down') return null;
      // Up heavy: spinning whirlwind — circular hitbox centered on player
      if(heavy&&a.dir==='up'){
        const r=this.ch.kingSpinReach||96;
        return{x:this.cx-r,y:this.cy-r,w:r*2,h:r*2};
      }
      return null;
    }
    if(this.ch.id===11){
      const heavy=a.type==='heavy';
      // All lights handled in MAGMA update block (flamethrower + projectiles)
      if(!heavy) return null;
      // Side heavy: fire pebble (projectile)
      if(heavy&&(a.dir==='side'||a.dir==='neutral')) return null;
      // Down heavy: fire-jet exhaust hitbox below
      if(heavy&&a.dir==='down') return{x:this.cx-26,y:this.bottom-4,w:52,h:64};
      // Up heavy: wide semicircle fire above
      if(heavy&&a.dir==='up') return{x:this.cx-80,y:this.y-72,w:160,h:82};
      return null;
    }
    if(this.ch.id===3){
      // BLASTER down heavy: rocket exhaust hitbox below character
      if(a.type==='heavy'&&a.dir==='down') return{x:this.cx-22,y:this.bottom-4,w:44,h:58};
      return null; // other BLASTER attacks use bullet system
    }
    if(this.ch.id===6)return null; // ROCKET uses arm projectile system
    if(this.ch.id===8){
      const heavy=a.type==='heavy', f=this.facing;
      // Side light comboN=1: jab with extended reach
      if(!heavy&&(a.dir==='side'||a.dir==='neutral')&&a.comboN!==2){
        const reach=96, sz=this.ch.lSz;
        const hx=f>0?this.right-10:this.x-reach+10;
        return{x:hx,y:this.cy-sz/2,w:reach,h:sz};
      }
      // Side light comboN=2: knife throw (projectile, no melee hitbox)
      if(!heavy&&(a.dir==='side'||a.dir==='neutral')&&a.comboN===2)return null;
      // Up light: two-phase arc — right then left (was down light)
      if(!heavy&&a.dir==='up'){
        const half=Math.floor(a.act/2);
        if(a.frame<a.su+half) return{x:this.cx+4,y:this.cy-this.ch.lRch*0.6,w:this.ch.lSz,h:this.ch.lRch*0.7};
        return{x:this.cx-4-this.ch.lSz,y:this.cy-this.ch.lRch*0.6,w:this.ch.lSz,h:this.ch.lRch*0.7};
      }
      // Down light: downward knife spread — no melee hitbox
      if(!heavy&&a.dir==='down')return null;
      // Side heavy: swing phase only (first half of active), throw phase is projectile
      if(heavy&&(a.dir==='side'||a.dir==='neutral')){
        const half=Math.floor(a.act/2);
        if(a.frame<a.su+half){const fx=f>0?this.right-12:this.x-this.ch.hRch+12;return{x:fx,y:this.cy-40,w:this.ch.hRch,h:80};}
        return null; // throw phase
      }
      // Down heavy: dual knife throw — no melee hitbox
      if(heavy&&a.dir==='down')return null;
      // Up heavy: knife spread — no melee hitbox
      if(heavy&&a.dir==='up')return null;
      return null;
    }
    if(this.ch.id===7){
      const heavy=a.type==='heavy', f=this.facing;
      // Side light: dash body slam — full body AABB + forward extension
      if(!heavy&&(a.dir==='side'||a.dir==='neutral')) return{x:this.x-4,y:this.y,w:this.w+8,h:this.h};
      // Up/down light: handled by projectiles
      if(!heavy&&(a.dir==='up'||a.dir==='down')) return null;
      // Side heavy: fire cone forward
      if(heavy&&(a.dir==='side'||a.dir==='neutral')){const fx=f>0?this.right-8:this.x-88+8;return{x:fx,y:this.cy-30,w:88,h:60};}
      // Down heavy: explosion AoE around player
      if(heavy&&a.dir==='down') return{x:this.cx-70,y:this.cy-60,w:140,h:100};
      // Up heavy: no direct hitbox (uses smoke cloud + self-launch)
      return null;
    }
    const heavy=a.type==='heavy', f=this.facing;
    // EDGE up heavy: mini sword handles all damage
    if(this.ch.id===4&&heavy&&a.dir==='up')return null;
    // PIERCE down heavy: spinning sweep — large centered hitbox
    if(this.ch.id===5&&heavy&&a.dir==='down'){
      const r=Math.round(this.ch.hRch*0.75);
      return{x:this.cx-r,y:this.cy-r,w:r*2,h:r*2};
    }
    // EDGE side heavy: overhead swing — tall sweeping hitbox
    if(this.ch.id===4&&heavy&&a.dir==='side'){
      const hx=f>0?this.cx-10:this.cx-80+10;
      return{x:hx,y:this.y-50,w:80,h:this.h+80};
    }
    // EDGE down heavy: dive — narrow hitbox below center
    if(this.ch.id===4&&heavy&&a.dir==='down'){
      return{x:this.cx-Math.round(this.ch.hSz*0.45),y:this.cy,w:Math.round(this.ch.hSz*0.9),h:Math.round(this.ch.hRch*0.5)};
    }
    let sz=heavy?this.ch.hSz:this.ch.lSz, reach=heavy?this.ch.hRch:this.ch.lRch;
    // EDGE combo scaling
    if(this.ch.id===4&&!heavy&&a.comboN){
      const cn=a.comboN;
      sz=cn===3?33:cn===2?48:sz; reach=cn===3?48:cn===2?82:reach;
    }
    // PIERCE 3rd-hit spear swing hitbox (tall sweep)
    else if(this.ch.id===5&&!heavy&&a.comboN===3){
      const hx=f>0?this.right-10:this.x-110+10;
      return{x:hx,y:this.y-44,w:110,h:this.h+60};
    }
    // BOLT 2-hit finisher hitbox
    else if(this.ch.maxCombo===2&&!heavy&&a.comboN===2){
      sz+=10; reach+=20;
    }
    switch(a.dir){
      case 'up':   return{x:this.cx-sz/2,y:this.y-reach+10,w:sz,h:reach};
      case 'down': return{x:this.cx-sz/2,y:this.bottom-10, w:sz,h:reach};
      default:{const hx=f>0?this.right-10:this.x-reach+10;return{x:hx,y:this.cy-sz/2,w:reach,h:sz};}
    }
  }

  land(target){
    if(target.hitImmune>0) return; // phased/immune target
    if(this.team>0&&target.team>0&&this.team===target.team) return; // no friendly fire
    // PRISTINE laser shield: reflect melee damage to attacker
    if(target.laserShieldActive){
      const heavy=this.atk.type==='heavy';
      const dmg=heavy?this.ch.hDmg:this.ch.lDmg;
      if(!this.isDummy) this.damage+=Math.round(dmg*(this.ch.def??1));
      this.hitFlash=14;
      const lag=heavy?6:4; target.hitlag=lag; this.hitlag=lag;
      addHitParticles(target.cx,target.cy,'#00ffff',true);
      G.shakeX+=(Math.random()-.5)*5;
      return;
    }
    if(target.shieldActive){
      addHitParticles(target.cx,target.cy,'#aaddff',false);
      playSfx({freq:700,freq2:300,type:'sine',decay:0.1,vol:0.15});
      const lag=this.atk.type==='heavy'?5:3; target.hitlag=lag; this.hitlag=lag; return;
    }
    // KING shield: if hit lands on the side the shield is facing, halve damage + knockback
    let kingShieldBlock=false;
    if(target.ch.id===14){
      const sa=target.kingShieldAngle||0;
      const sx=Math.cos(sa), sy=Math.sin(sa);
      const dx=this.cx-target.cx, dy=this.cy-target.cy;
      const dist=Math.hypot(dx,dy)||1;
      const dot=(dx/dist)*sx+(dy/dist)*sy;
      if(dot>0.35){ // attacker is on the shield-facing half (with small margin)
        kingShieldBlock=true;
      }
    }
    // Instant kill at DEATH_THRESHOLD (150%) — next hit after reaching threshold KOs
    if(target.damage>=DEATH_THRESHOLD&&!target.isDummy){instakill(target,target.cx,target.cy);return;}
    target.charging=false; target.chargeTime=0;
    const heavy=this.atk.type==='heavy', dir=this.atk.dir;
    let dmg=heavy?this.ch.hDmg:this.ch.lDmg, baseKB=heavy?this.ch.hKB:this.ch.lKB;
    // KING flaming sword: bonus damage and applies burn DoT
    let kingFireBonus=false;
    if(this.ch.id===14&&this.kingFireTimer>0){
      kingFireBonus=true;
      dmg=Math.round(dmg*1.5);
      baseKB*=1.15;
    }
    // GLITCH stolen weapon: use that character's actual stats
    if(this.ch.id===13&&heavy&&(this.atk.dir==='side'||this.atk.dir==='neutral')){
      if(this.glitchWeapon==='edge'){dmg=12;baseKB=13;}
      else if(this.glitchWeapon==='pierce'){dmg=14;baseKB=17;}
    }
    // chargeRatio scaling
    const cr=this.atk.chargeRatio||0;
    if(cr>0){dmg=Math.round(dmg*(1+cr*2));baseKB*=(1+cr*1.5);}
    // EDGE combo scaling
    if(this.ch.id===4&&!heavy&&this.atk.comboN){
      const cn=this.atk.comboN;
      dmg=Math.round(dmg*(cn===3?2.2:cn===2?1.3:1));
      baseKB=baseKB*(cn===3?1.4:cn===2?0.275:1);
    }
    // PIERCE 3rd-hit spear swing scaling
    else if(this.ch.id===5&&!heavy&&this.atk.comboN===3){
      dmg=Math.round(dmg*1.125); baseKB*=1.35;
    }
    // BOLT 2-hit finisher scaling
    else if(this.ch.maxCombo===2&&!heavy&&this.atk.comboN===2){
      dmg=Math.round(dmg*1.25); baseKB*=1.5;
    }
    // FACTORY side light: heavy gear swing = big knockback
    if(this.ch.id===12&&!heavy&&(dir==='side'||dir==='neutral')){
      baseKB*=3.0;
    }
    // KING shield block: halve damage and knockback before applying
    if(kingShieldBlock){
      dmg=Math.round(dmg*0.5);
      baseKB*=0.5;
      addHitParticles(target.cx,target.cy,'#ffd700',false);
      playSfx({freq:520,freq2:180,type:'square',decay:0.12,vol:0.16});
    }
    // BOULDER SLAM (heavy hits only): predict if knockback trajectory hits the G.boulder.
    // If yes, double damage and shatter the G.boulder so the victim flies through.
    let boulderSlam=false;
    if(heavy&&G.boulder&&!G.boulder.dead&&!target.isDummy){
      // Predicted post-KB velocity (mirrors the switch/cap below)
      const projDmg=Math.round(dmg*(target.ch.def??1));
      const km0=kbScale(target.damage+projDmg);
      const kb0=baseKB*km0/target.ch.weight, f0=this.facing;
      let pvx,pvy;
      switch(dir){
        case 'up':   pvx=f0*kb0*0.74; pvy=-kb0*0.67; break;
        case 'down': pvx=f0*kb0*0.69; pvy= kb0*0.72; break;
        default:     pvx=f0*kb0*1.2;  pvy=-kb0*0.05;
      }
      pvx=Math.max(-MAX_KB,Math.min(MAX_KB,pvx)); pvy=Math.max(-MAX_KB,Math.min(MAX_KB,pvy));
      // March the victim forward up to 30 frames (~0.5s) along the predicted trajectory
      let sx=target.x, sy=target.y, svx=pvx, svy=pvy;
      for(let step=0;step<30;step++){
        sx+=svx; sy+=svy;
        if(G.boulder.intersectsRect(sx,sy,target.w,target.h)){boulderSlam=true; break;}
        svx*=FLY_FRIC; svy*=FLY_FRIC;
        if(Math.abs(svx)<0.3&&Math.abs(svy)<0.3) break;
      }
    }
    if(boulderSlam){
      dmg=Math.round(dmg*2);
      G.boulder.shatter();
      addHitParticles(target.cx,target.cy,'#aa8855',true);
      G.shakeX+=(Math.random()-.5)*14; G.shakeY+=(Math.random()-.5)*14;
      playSfx({freq:160,freq2:60,type:'sawtooth',decay:0.3,vol:0.22});
    }
    if(!this.isDummy) target.damage+=Math.round(dmg*(target.ch.def??1));
    target.hitFlash=15;
    // KING flaming sword: apply burn DoT to victim
    if(kingFireBonus&&!target.isDummy){
      target.burnTimer=this.ch.kingBurnDuration||90; target.burnTick=0;
    }
    const km=kbScale(target.damage), kb=baseKB*km/target.ch.weight, f=this.facing;
    switch(dir){
      case 'up':   target.vx=f*kb*0.74;target.vy=-kb*0.67;break;
      case 'down': target.vx=f*kb*0.69; target.vy= kb*0.72;break;
      default:     target.vx=f*kb*1.2; target.vy=-kb*0.05;
    }
    // Velocity cap to prevent extreme launch speeds
    target.vx=Math.max(-MAX_KB,Math.min(MAX_KB,target.vx));
    target.vy=Math.max(-MAX_KB,Math.min(MAX_KB,target.vy));
    // PIERCE down+light: pogo - Pierce hops upward, target gets normal knockback
    if(this.ch.id===5&&!heavy&&dir==='down'&&this.atk.comboN===1){
      this.vy=this.ch.jumpF*0.85; this.onGnd=false; this.onPlat=false;
    }
    // UNSTABLE side light: dash — reduce damage slightly (body slam feel)
    if(this.ch.id===7&&!heavy&&(dir==='side'||dir==='neutral')){
      dmg=Math.round(dmg*0.7);
    }
    // UNSTABLE side heavy: apply burn DoT on hit
    if(this.ch.id===7&&heavy&&(dir==='side'||dir==='neutral')){
      target.burnTimer=120; target.burnTick=0;
    }
    // UNSTABLE down heavy: high damage, self-damage
    if(this.ch.id===7&&heavy&&dir==='down'){
      dmg=20; // override to ~20% damage
      if(!this.isDummy){this.damage+=8;this.hitFlash=10;} // self-damage
    }
    if(!target.isDummy&&heavy)target.hstun=Math.min(65,Math.floor(8+kb*2.5));
    target.onGnd=false;target.onPlat=false;
    const lag=heavy?6:4; target.hitlag=lag; this.hitlag=lag;
    const hb=this.hitbox(); if(hb)addHitParticles(hb.x+hb.w/2,hb.y+hb.h/2,this.ch.color,heavy);
    sfxHit(heavy);
    // ===== GRAB RELEASE =====
    // Case A: this attacker is grabbing target → the grab-release attack landed
    if(this.grabbing===target){
      this.grabbing=null; target.grabbedBy=null;
      this.grabT=0; target.grabT=0;
    }
    // Case B: target was grabbed by someone else and this hit landed → break that grab
    else if(target.grabbedBy&&target.grabbedBy!==this){
      const g=target.grabbedBy;
      g.grabbing=null; target.grabbedBy=null;
      g.grabT=0; target.grabT=0;
    }
    // Case C: target was the grabber and this hit broke them out of holding
    if(target.grabbing){
      const v=target.grabbing;
      v.grabbedBy=null; target.grabbing=null;
      v.grabT=0; target.grabT=0;
    }
  }

  checkKill(){
    if(this.dead||this.isDummy)return;
    // Hard outer safety net (extreme out-of-bounds in world coords)
    if(this.x>VIS_RIGHT+1500||this.right<VIS_LEFT-1500||this.y>VIS_BOT+1500||this.bottom<VIS_TOP-1500){this.die();return;}
    // Camera-based off-screen kill: if any part of the bounding box is inside the visible world rect, reset
    const onScreen=this.right>VIS_LEFT&&this.x<VIS_RIGHT&&this.bottom>VIS_TOP&&this.y<VIS_BOT;
    if(onScreen){this.offScreenTimer=0;}
    else{
      this.offScreenTimer++;
      if(this.offScreenTimer>=OFF_SCREEN_KILL_FRAMES) this.die();
    }
  }
  die(){this.stocks--;if(this.stocks<0)this.stocks=0;this.dead=true;this.damage=0;this.vx=this.vy=this.hstun=this.hitlag=0;this.atk=null;this.shieldActive=false;this.respawnT=150;this.offScreenTimer=0;
    if(this.grabbedBy){this.grabbedBy.grabbing=null;this.grabbedBy.grabT=0;this.grabbedBy=null;}
    if(this.grabbing){this.grabbing.grabbedBy=null;this.grabbing.grabT=0;this.grabbing=null;}
    // Drop held rock (stays in world as free-floating pickup)
    if(this.heldRock){this.heldRock.heldBy=null;this.heldRock.thrown=false;this.heldRock=null;}
    this.grabT=0;}
  doRespawn(){
    this.dead=false;this.x=this.spawnX-this.w/2;this.y=180;this.vx=this.vy=0;this.jLeft=2;this.onGnd=false;this.onPlat=false;this.offScreenTimer=0;
    this.boostActive=false;this.boostFuel=BOOST_MAX;
    // Release any grab partner: if I died while holding/being held, free the other side
    if(this.grabbedBy){this.grabbedBy.grabbing=null;this.grabbedBy.grabT=0;}
    if(this.grabbing){this.grabbing.grabbedBy=null;this.grabbing.grabT=0;}
    if(this.heldRock){this.heldRock.heldBy=null;this.heldRock.thrown=false;this.heldRock=null;}
    this.grabbing=null;this.grabbedBy=null;this.grabT=0;this.grabWhiffT=0;
    if(this.ch.id===1){this.crusherSideHeavyCD=0;this.crusherUpHeavyCD=0;this.crusherDownHeavyCD=0;}
    if(this.ch.id===6){this.armsLeft=4;this.rocketLightCD=0;this.rocketSideHeavyCD=0;this.rocketUpHeavyCD=0;for(const a of rocketArms)if(a.owner===this)a.dead=true;for(const m of rocketMines)if(m.owner===this)m.dead=true;}
    if(this.ch.id===10){this.flyActive=false;this.flyTimer=180;this.flyCooldown=0;this.laserShieldActive=false;this.laserShieldTimer=0;this.pristineRocketCd=0;for(const r of pristineRockets)if(r.owner===this)r.dead=true;}
    if(this.ch.id===11){this.magmaFuel=this.ch.flameFuelMax||180;for(const fp of firePebbles)if(fp.owner===this)fp.dead=true;}
    if(this.ch.id===12){this.factoryBoltCD=0;this.factoryZapCD=0;for(const b of factoryBolts)if(b.owner===this)b.dead=true;for(const g of factoryGears)if(g.owner===this)g.dead=true;}
    if(this.ch.id===13){this.glitchPhaseTimer=0;this.glitchGhost=false;this.glitchWeapon=null;}
    if(this.ch.id===14){this.kingShieldAngle=0;this.kingShieldRotateT=0;this.kingFireTimer=0;}
  }

  draw(){
    if(this.dead)return;
    const flash=this.hitFlash>0&&Math.floor(this.hitFlash/2)%2===0;

    // ---- Grab energy line drawn behind everything (only from grabber side to avoid double-draw) ----
    if(this.grabbing&&!this.grabbing.dead){
      const t=this.grabbing;
      const lockoutLeft=Math.max(0,GRAB_LOCKOUT_FRAMES-this.grabT);
      const tFade=lockoutLeft>0?(1-lockoutLeft/GRAB_LOCKOUT_FRAMES):1;
      ctx.save();
      ctx.globalCompositeOperation='lighter';
      const pulse=Math.sin(G.frame*0.4)*0.3+0.7;
      // Thick energy beam between hands
      ctx.strokeStyle=`rgba(255,200,80,${(0.45+0.4*pulse)*tFade})`;
      ctx.lineWidth=8; ctx.lineCap='round';
      ctx.shadowBlur=18; ctx.shadowColor='#ffaa44';
      ctx.beginPath(); ctx.moveTo(this.cx,this.cy); ctx.lineTo(t.cx,t.cy); ctx.stroke();
      // Inner bright core
      ctx.strokeStyle=`rgba(255,255,200,${(0.7+0.25*pulse)*tFade})`;
      ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(this.cx,this.cy); ctx.lineTo(t.cx,t.cy); ctx.stroke();
      ctx.shadowBlur=0;
      // Crackling sparks along the line
      const dx=t.cx-this.cx, dy=t.cy-this.cy, dist=Math.hypot(dx,dy)||1;
      const ux=dx/dist, uy=dy/dist; // unit
      const px=-uy, py=ux;          // perpendicular
      ctx.fillStyle=`rgba(255,240,120,${0.85*tFade})`;
      for(let i=0;i<5;i++){
        const f=((i/5)+(G.frame*0.025))%1;
        const sx=this.cx+ux*dist*f+px*Math.sin(G.frame*0.3+i*1.7)*4;
        const sy=this.cy+uy*dist*f+py*Math.sin(G.frame*0.3+i*1.7)*4;
        ctx.beginPath();ctx.arc(sx,sy,1.8,0,Math.PI*2);ctx.fill();
      }
      // Auto-release timer ring above the pair midpoint
      const mx=(this.cx+t.cx)/2, my=(this.cy+t.cy)/2-30;
      const rT=this.grabT/GRAB_AUTO_RELEASE_FRAMES;
      ctx.strokeStyle=`rgba(255,140,40,${0.6*tFade})`;
      ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.arc(mx,my,9,-Math.PI/2,-Math.PI/2+rT*Math.PI*2); ctx.stroke();
      ctx.restore();
    }
    // ---- Whiff: brief outward swipe ring when an empty grab was thrown ----
    if(this.grabWhiffT>GRAB_WHIFF_CD-10){
      const wt=(GRAB_WHIFF_CD-this.grabWhiffT)/10; // 0->1 in first 10 frames
      ctx.save();
      ctx.strokeStyle=`rgba(255,220,140,${(1-wt)*0.65})`;
      ctx.lineWidth=3; ctx.lineCap='round';
      ctx.shadowBlur=10; ctx.shadowColor='#ffcc66';
      const r=GRAB_RANGE*wt;
      const f=this.facing;
      // Forward arc (in front of player)
      ctx.beginPath();
      ctx.arc(this.cx+f*8,this.cy,r,f>0?-Math.PI*0.4:Math.PI*0.6,f>0?Math.PI*0.4:Math.PI*1.4);
      ctx.stroke();
      ctx.restore();
    }

    // ---- Flight animation: thruster flames drawn FIRST (behind character) in world G.frame ----
    if(!this.isDummy) this.drawThrusters();

    ctx.save();
    ctx.translate(this.cx,this.cy);
    if(this.facing<0)ctx.scale(-1,1);

    // Flight pose: lean into movement direction + subtle idle bob + squash on big vertical thrust
    if(!this.isDummy&&!this.shieldActive){
      const fwdV = this.vx*this.facing;             // signed forward speed in local G.frame
      const tiltMax = 0.45;
      const tilt = Math.max(-tiltMax,Math.min(tiltMax, fwdV/MAX_FLY_SPEED * 0.55));
      // Vertical lean: nose up when rising, nose down when falling (subtle)
      const vTilt = Math.max(-0.18,Math.min(0.18, this.vy/MAX_FLY_SPEED * -0.18));
      ctx.rotate(tilt + vTilt);
      // Idle hover bob (only when moving slowly)
      const spd = Math.hypot(this.vx,this.vy);
      if(spd<1.5 && this.hstun===0 && !this.atk){
        const bob = Math.sin(G.frame*0.09)*1.6;
        ctx.translate(0,bob);
      }
      // Squash/stretch on strong vertical motion
      const vyN = Math.max(-1,Math.min(1, this.vy/MAX_FLY_SPEED));
      const sy = 1 + Math.abs(vyN)*0.07*(vyN<0?1:-1); // rising stretches, falling squashes
      const sx = 1 - Math.abs(vyN)*0.04*(vyN<0?1:-1);
      ctx.scale(sx,sy);
    }

    if(flash)ctx.globalAlpha=0.22;
    drawCharacter(ctx,this.ch,this.w,this.h,this.atk,this.onGnd||this.onPlat,this.wf,{armsLeft:this.armsLeft,glitchGhost:this.glitchGhost,glitchPhaseTimer:this.glitchPhaseTimer,glitchWeapon:this.glitchWeapon,kingShieldAngle:this.kingShieldAngle,kingFireTimer:this.kingFireTimer,kingFacing:this.facing});
    if(!this.isDummy)drawAttackArc(this.atk,this.ch,this.w,this.h);
    ctx.globalAlpha=1;
    ctx.restore();


    // Combo window indicator: pulsing dots above character
    if(this.atk&&this.ch.maxCombo>1&&this.atk.type==='light'&&this.atk.frame>=this.atk.su&&(this.atk.comboN||1)<this.ch.maxCombo){
      const pulse=Math.abs(Math.sin(G.frame*0.3));
      const mc=this.ch.maxCombo, done=(this.atk.comboN||1);
      ctx.save();
      ctx.shadowBlur=10+pulse*8; ctx.shadowColor=this.ch.color;
      for(let i=0;i<mc;i++){
        const isDone=i<done;
        ctx.globalAlpha=isDone?0.4:(0.65+pulse*0.35);
        ctx.fillStyle=isDone?'#555':this.ch.color;
        ctx.beginPath(); ctx.arc(this.cx+(i-mc/2+0.5)*14,this.y-22,4,0,Math.PI*2); ctx.fill();
        if(!isDone){
          ctx.strokeStyle=this.ch.color; ctx.lineWidth=1.5;
          ctx.globalAlpha=pulse*0.8;
          ctx.beginPath(); ctx.arc(this.cx+(i-mc/2+0.5)*14,this.y-22,8,0,Math.PI*2); ctx.stroke();
        }
      }
      ctx.restore();
    }

    // Danger aura at DEATH_THRESHOLD (150%) — visible kill-warning telegraph
    if(this.damage>=DEATH_THRESHOLD&&!this.isDummy){
      const pulse=Math.sin(G.frame*0.25)*0.4+0.6;
      const flash=Math.floor(G.frame/5)%2===0;
      ctx.save(); ctx.translate(this.cx,this.cy);
      const aura=ctx.createRadialGradient(0,0,8,0,0,this.w*1.1+pulse*10);
      aura.addColorStop(0,`rgba(255,0,60,${0.28+pulse*0.18})`);
      aura.addColorStop(1,'rgba(180,0,0,0)');
      ctx.fillStyle=aura; ctx.beginPath(); ctx.ellipse(0,0,this.w*1.1+pulse*10,this.h*0.7+pulse*6,0,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=20+pulse*14; ctx.shadowColor='#ff0040';
      ctx.strokeStyle=`rgba(255,${flash?180:60},${flash?180:60},${0.55+pulse*0.35})`; ctx.lineWidth=2+pulse*2;
      ctx.beginPath(); ctx.ellipse(0,0,this.w*0.85+pulse*6,this.h*0.55+pulse*4,0,0,Math.PI*2); ctx.stroke();
      ctx.restore();
      // "!!!" label above head
      ctx.save();
      ctx.font=`bold ${12+Math.floor(pulse*4)}px monospace`;
      ctx.textAlign='center';
      ctx.shadowBlur=10; ctx.shadowColor='#ff0040';
      ctx.fillStyle=flash?'#ffffff':'#ff0040';
      ctx.globalAlpha=0.9;
      ctx.fillText('!!!',this.cx,this.y-28-pulse*4);
      ctx.restore();
    }

    // Charge aura
    if(this.charging){
      const cr=Math.min(1,this.chargeTime/240);
      ctx.save(); ctx.translate(this.cx,this.cy);
      const aura=ctx.createRadialGradient(0,0,10,0,0,this.w*0.9+cr*20);
      aura.addColorStop(0,`rgba(255,200,50,${0.25+cr*0.35})`);
      aura.addColorStop(1,'rgba(255,120,0,0)');
      ctx.fillStyle=aura; ctx.beginPath(); ctx.ellipse(0,0,this.w*0.9+cr*20,this.h*0.6+cr*14,0,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=18+cr*20; ctx.shadowColor='#ffaa00';
      ctx.strokeStyle=`rgba(255,200,0,${0.4+cr*0.5})`; ctx.lineWidth=2+cr*3;
      ctx.beginPath(); ctx.ellipse(0,0,this.w*0.7+cr*10,this.h*0.5+cr*8,0,0,Math.PI*2); ctx.stroke();
      ctx.restore();
      // Charge bar above head
      const bw=this.w+10, bx2=this.cx-bw/2, by2=this.y-14;
      ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(bx2,by2,bw,5);
      ctx.fillStyle=`hsl(${40-cr*40},100%,55%)`; ctx.fillRect(bx2,by2,bw*cr,5);
    }

    // Shield visual
    if(this.shieldActive){
      const r=Math.max(this.w,this.h)*0.76;
      const tf=this.shieldTimer/SHIELD_FRAMES;
      ctx.save(); ctx.translate(this.cx,this.cy);
      const g=ctx.createRadialGradient(0,0,r*0.5,0,0,r*1.3);
      g.addColorStop(0,'rgba(140,200,255,0.18)');g.addColorStop(1,'rgba(100,160,255,0)');
      ctx.fillStyle=g;ctx.globalAlpha=tf;ctx.beginPath();ctx.arc(0,0,r*1.3,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=20;ctx.shadowColor='#88ccff';
      ctx.strokeStyle='#aaddff';ctx.lineWidth=3+tf*2;ctx.globalAlpha=0.65+tf*0.3;
      ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }
    // Shield recharge bar
    if(this.shieldCooldown>0){
      const pct=1-this.shieldCooldown/(this.ch.shieldCool??SHIELD_COOLDOWN);
      ctx.fillStyle='#334';ctx.fillRect(this.x,this.bottom+4,this.w,3);
      ctx.fillStyle='#66aaff';ctx.fillRect(this.x,this.bottom+4,this.w*pct,3);
    }
    // MAGMA: flamethrower fuel bar
    if(this.ch.id===11){
      const fuelMax=this.ch.flameFuelMax||180;
      const pct=this.magmaFuel/fuelMax;
      const barY=this.bottom+(this.shieldCooldown>0?10:4);
      ctx.fillStyle='#220500'; ctx.fillRect(this.x,barY,this.w,3);
      ctx.fillStyle=pct<0.25?'#ff2200':pct<0.6?'#ff6600':'#ff4400';
      ctx.fillRect(this.x,barY,this.w*pct,3);
    }
    // PRISTINE: jetpack fuel bar (shows whenever fuel is not full)
    if(this.ch.id===10&&this.flyTimer<180){
      const barY=this.bottom+(this.shieldCooldown>0?10:4);
      const pct=this.flyTimer/180;
      ctx.fillStyle='#001122';ctx.fillRect(this.x,barY,this.w,3);
      ctx.fillStyle=this.flyActive?'#00ffff':pct<0.25?'#004455':'#007799';
      ctx.fillRect(this.x,barY,this.w*pct,3);
    }
    // FACTORY: bolt and zap cooldown bars
    if(this.ch.id===12){
      let barOff=this.shieldCooldown>0?10:4;
      if(this.factoryBoltCD>0){
        const pct=1-this.factoryBoltCD/(this.ch.boltCDMax||300);
        ctx.fillStyle='#112233';ctx.fillRect(this.x,this.bottom+barOff,this.w,3);
        ctx.fillStyle='#00ccff';ctx.fillRect(this.x,this.bottom+barOff,this.w*pct,3);
        barOff+=6;
      }
      if(this.factoryZapCD>0){
        const pct=1-this.factoryZapCD/(this.ch.zapCDMax||180);
        ctx.fillStyle='#112233';ctx.fillRect(this.x,this.bottom+barOff,this.w,3);
        ctx.fillStyle='#0088ff';ctx.fillRect(this.x,this.bottom+barOff,this.w*pct,3);
      }
    }
    // PRISTINE laser shield visual
    if(this.ch.id===10&&this.laserShieldActive){
      const t=this.laserShieldTimer/60;
      const pulse=Math.sin(G.frame*0.25)*0.2+0.8;
      const r=Math.max(this.w,this.h)*0.78;
      ctx.save();ctx.translate(this.cx,this.cy);
      ctx.shadowBlur=28;ctx.shadowColor='#00ffff';
      ctx.strokeStyle=`rgba(0,255,255,${pulse*t})`;ctx.lineWidth=5;
      ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
      ctx.lineWidth=2;ctx.globalAlpha=pulse*0.4*t;
      ctx.beginPath();ctx.arc(0,0,r*1.25,0,Math.PI*2);ctx.stroke();
      // Hex segment lines
      ctx.lineWidth=1.5;
      for(let i=0;i<6;i++){
        const a=i/6*Math.PI*2+G.frame*0.03,a2=(i+1)/6*Math.PI*2+G.frame*0.03;
        ctx.globalAlpha=pulse*0.3*t;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a)*r*0.55,Math.sin(a)*r*0.55);
        ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);
        ctx.lineTo(Math.cos(a2)*r,Math.sin(a2)*r);
        ctx.stroke();
      }
      ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.restore();
    }
    // PRISTINE flight aura
    if(this.ch.id===10&&this.flyActive){
      const pulse=Math.sin(G.frame*0.18)*0.3+0.7;
      ctx.save();ctx.shadowBlur=18;ctx.shadowColor='#00ffff';
      ctx.strokeStyle=`rgba(0,255,255,${pulse*0.55})`;ctx.lineWidth=2;ctx.lineCap='round';
      // Wing energy streams on sides
      ctx.beginPath();ctx.moveTo(this.cx-12,this.cy+4);
      ctx.bezierCurveTo(this.cx-28,this.cy-6,this.cx-42,this.cy+10,this.cx-52,this.cy-2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(this.cx+12,this.cy+4);
      ctx.bezierCurveTo(this.cx+28,this.cy-6,this.cx+42,this.cy+10,this.cx+52,this.cy-2);ctx.stroke();
      // Thrust jets below
      ctx.lineWidth=3.5;
      const jlen=11+pulse*4;
      ctx.beginPath();ctx.moveTo(this.cx-8,this.bottom);ctx.lineTo(this.cx-8,this.bottom+jlen);ctx.stroke();
      ctx.beginPath();ctx.moveTo(this.cx+8,this.bottom);ctx.lineTo(this.cx+8,this.bottom+jlen);ctx.stroke();
      ctx.shadowBlur=0;ctx.restore();
    }
    if(this.isDummy){
      ctx.fillStyle='rgba(255,255,255,0.45)';ctx.font='bold 11px monospace';ctx.textAlign='center';
      ctx.fillText('DUMMY',this.cx,this.y-8);
    }
  }

  drawThrusters(){
    // Flight thruster flames drawn in world G.frame, behind the character.
    // Direction: opposite of velocity (or fixed below if hovering).
    const ch=this.ch;
    const spd=Math.hypot(this.vx,this.vy);
    const speeding=spd>0.5;
    const boosting=this.boostActive;
    const dashing=this.dashActive;
    // Thrust direction in world frame: opposite to velocity. Hover -> straight down.
    let tx,ty;
    if(speeding){tx=-this.vx/spd; ty=-this.vy/spd;}
    else{tx=0; ty=1;}
    // Flame intensity scales with speed; boost makes it extra intense
    const intens = boosting ? 2.0 : dashing ? 1.4 : Math.min(1, spd/MAX_FLY_SPEED + 0.18);
    if(intens<0.2) return;
    // Size scaling: average of width/height vs a 46x58 baseline (BOLT)
    const sizeScale = ((this.w/46) + (this.h/58)) * 0.5;
    const len = ((boosting?90:dashing?56:32) + spd*2.6) * sizeScale;
    const wid = ((boosting?28:dashing?18:13) + spd*0.7) * sizeScale;
    const flicker = 0.7 + Math.random()*0.4;
    // Two emitters near the bottom-rear of the character (left & right thruster nozzles)
    const offset = this.w*0.22;
    // Compute perpendicular to thrust dir to space the two nozzles
    const px = -ty, py = tx;
    // Origin: slightly inside the body, opposite the thrust direction
    const ox = this.cx - tx*this.w*0.05;
    const oy = this.cy - ty*this.h*0.05 + this.h*0.18; // bias slightly low (jet vents)
    const cores=[[ox+px*offset,oy+py*offset],[ox-px*offset,oy-py*offset]];
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    for(const [sx,sy] of cores){
      const ex=sx+tx*len*flicker, ey=sy+ty*len*flicker;
      // Outer glow
      const grad=ctx.createLinearGradient(sx,sy,ex,ey);
      if(boosting){
        grad.addColorStop(0,`rgba(140,200,255,${0.7*intens})`);
        grad.addColorStop(0.5,`rgba(80,140,255,${0.45*intens})`);
        grad.addColorStop(1,'rgba(40,80,255,0)');
      } else {
        grad.addColorStop(0,`rgba(255,210,120,${0.55*intens})`);
        grad.addColorStop(0.5,`rgba(255,140,40,${0.35*intens})`);
        grad.addColorStop(1,'rgba(255,60,0,0)');
      }
      ctx.strokeStyle=grad;
      ctx.lineWidth=wid*1.8;
      ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke();
      // Inner core
      const grad2=ctx.createLinearGradient(sx,sy,ex,ey);
      if(boosting){
        grad2.addColorStop(0,`rgba(240,250,255,${0.95*intens})`);
        grad2.addColorStop(0.6,`rgba(160,220,255,${0.6*intens})`);
        grad2.addColorStop(1,'rgba(80,160,255,0)');
      } else {
        grad2.addColorStop(0,`rgba(255,255,240,${0.85*intens})`);
        grad2.addColorStop(0.6,`rgba(255,200,120,${0.5*intens})`);
        grad2.addColorStop(1,'rgba(255,120,40,0)');
      }
      ctx.strokeStyle=grad2;
      ctx.lineWidth=wid*0.7;
      ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke();
    }
    // Speed lines (small streaks behind) when fast or dashing
    if(intens>0.6){
      ctx.strokeStyle=`rgba(255,255,255,${0.18*intens})`;
      ctx.lineWidth=1;
      for(let i=0;i<3;i++){
        const r=Math.random();
        const lx=ox + tx*(len*0.6+r*len*0.6) + (Math.random()-0.5)*8;
        const ly=oy + ty*(len*0.6+r*len*0.6) + (Math.random()-0.5)*8;
        const lex=lx+tx*(4+Math.random()*5), ley=ly+ty*(4+Math.random()*5);
        ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(lex,ley); ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawOffScreenIndicator(){
    // Drawn in screen-space (call AFTER camera ctx.restore())
    if(this.dead||this.isDummy) return;
    if(this.offScreenTimer<=0) return;
    // Convert world center to screen coords
    const sx=(this.cx-W/2)*CAM_SCALE_X + W/2;
    const sy=(this.cy-H/2)*CAM_SCALE_Y + H/2;
    const m=24;
    const ex=Math.max(m,Math.min(W-m,sx));
    const ey=Math.max(m,Math.min(H-m,sy));
    const remain=Math.max(0,OFF_SCREEN_KILL_FRAMES-this.offScreenTimer);
    const sec=(remain/60).toFixed(1);
    const flash=Math.floor(G.frame/4)%2===0;
    ctx.save();
    const dx=sx-ex, dy=sy-ey;
    const ang=Math.atan2(dy,dx);
    ctx.translate(ex,ey);
    ctx.rotate(ang);
    ctx.fillStyle=flash?'#ffffff':'#ff0055';
    ctx.shadowBlur=12; ctx.shadowColor='#ff0055';
    ctx.beginPath();
    ctx.moveTo(14,0); ctx.lineTo(-6,-9); ctx.lineTo(-2,0); ctx.lineTo(-6,9); ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.fillStyle=flash?'#ffffff':'#ff0055';
    ctx.shadowBlur=8; ctx.shadowColor='#ff0055';
    ctx.font='bold 11px monospace';
    ctx.textAlign='center';
    const tag=`P${this.pn} ${sec}s`;
    let tx=ex, ty=ey;
    if(ex<m+2) tx=ex+22;
    else if(ex>W-m-2) tx=ex-22;
    if(ey<m+2) ty=ey+22;
    else if(ey>H-m-2) ty=ey-12;
    ctx.fillText(tag,tx,ty);
    ctx.restore();
  }

  drawHUD(side,slot=0){
    const bh=78, bw=205;
    const x=side==='left'?10:W-215, y=10+slot*(bh+4);
    rrFill(x,y,bw,bh,9,'rgba(0,0,0,0.78)');
    rrStroke(x,y,bw,bh,9,this.dead?'#333':this.ch.color,2.5);
    ctx.fillStyle=this.ch.color;ctx.font='bold 13px monospace';ctx.textAlign='left';
    const label=this.isDummy?'DUMMY':`P${this.pn}: ${this.ch.name}`;
    ctx.fillText(label,x+10,y+22);
    if(this.isDummy){
      ctx.fillStyle='#888';ctx.font='bold 20px monospace';ctx.fillText(`${Math.round(this.damage)}%`,x+10,y+56);
      ctx.fillStyle='#444';ctx.font='10px monospace';ctx.fillText('[R] reset dummy',x+10,y+70);return;
    }
    const pct=Math.round(this.damage);
    const dangerFlash=pct>=DEATH_THRESHOLD&&Math.floor(G.frame/6)%2===0;
    ctx.fillStyle=pct>=DEATH_THRESHOLD?(dangerFlash?'#ffffff':'#ff0055'):pct<50?'#fff':pct<100?'#ffaa00':'#ff2200';
    if(pct>=DEATH_THRESHOLD){ctx.shadowBlur=14;ctx.shadowColor='#ff0055';}
    ctx.font='bold 32px monospace';ctx.fillText(`${pct}%`,x+10,y+62);
    ctx.shadowBlur=0;
    for(let i=0;i<this.stocks;i++){ctx.fillStyle=this.ch.color;ctx.beginPath();ctx.arc(x+bw-14-i*22,y+62,8,0,Math.PI*2);ctx.fill();}
    // Shield ready indicator in HUD
    const shieldY=y+22, shieldR=7;
    if(this.shieldCooldown>0){
      const pct2=1-this.shieldCooldown/(this.ch.shieldCool??SHIELD_COOLDOWN);
      ctx.strokeStyle='#226';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+bw-14,shieldY,shieldR,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='#66aaff';ctx.beginPath();ctx.arc(x+bw-14,shieldY,shieldR,-Math.PI/2,-Math.PI/2+pct2*Math.PI*2);ctx.stroke();
    } else {
      ctx.fillStyle='#66aaff';ctx.beginPath();ctx.arc(x+bw-14,shieldY,shieldR,0,Math.PI*2);ctx.fill();
    }
    // Boost fuel bar: blue = charged, drains while boosting, refills when not
    const barX=x+10, barY=y+bh-10, barW=bw-20, barH=5;
    const fuelPct=this.boostFuel/BOOST_MAX;
    ctx.fillStyle='#112233';ctx.beginPath();ctx.roundRect(barX,barY,barW,barH,2);ctx.fill();
    if(this.boostActive){ctx.shadowBlur=8;ctx.shadowColor='#66aaff';}
    ctx.fillStyle=this.boostActive?'#aaddff':fuelPct<0.25?'#ff8800':'#4488cc';
    ctx.beginPath();ctx.roundRect(barX,barY,barW*fuelPct,barH,2);ctx.fill();
    ctx.shadowBlur=0;
  }
}


export { Player };
