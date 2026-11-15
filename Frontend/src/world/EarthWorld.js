import * as THREE from 'three';
import { sound } from '../game/SoundEffects.js';

/**
 * ARES-1 Junior Astronaut Earth Base: Spaceport City & Heavy Rocket Launch Complex
 * 
 * Features:
 * - Solid collision physics: Player cannot pass through rocket, gantry tower, buildings, console, or floodlight poles.
 * - Interactive Pre-Launch Due Process (Telemetry -> Elevator -> Cockpit Ingress -> Engine Chill & Countdown -> Ascent)
 * - Start countdown triggers on pressing E, Space, or clicking the button!
 * - Physical Takeoff Animation with Earth Atmospheric Layers (Troposphere -> Stratosphere -> Mesosphere -> Thermosphere -> Exosphere)
 * - Orbital Insertion transition to Moon Landing or Mars Landing!
 */
export class EarthWorld {
  constructor(onExit, onReachOrbit, onLandOnMoon, onLandOnMars) {
    this.onExit = onExit || (() => {});
    this.onReachOrbit = onReachOrbit || (() => {});
    this.onLandOnMoon = onLandOnMoon || (() => {});
    this.onLandOnMars = onLandOnMars || (() => {});

    this.container = null;
    this.canvas = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animId = null;
    this.isActive = false;

    // Movement & physics
    this.clock = new THREE.Clock();
    this.keys = {};
    this.joy = { x: 0, y: 0 };
    this.pointerTargets = {};
    this.targetFacingYaw = 0;
    this.currentCameraYaw = Math.PI;
    this.pitch = 0.35;
    this.camDist = 7.0;
    this.smoothLookTarget = new THREE.Vector3(0, 1.6, 9);
    this.vy = 0;
    this.isGrounded = true;
    this.playerModel = null;
    this.walkCycle = 0;
    this.elapsedTime = 0;

    // Earth Planetary Physics
    this.physics = {
      gravity: 18.0, // Scaled for 9.81 m/s²
      jumpForce: 6.8,
      speedKmH: 0,
      altitudeM: 12.4,
    };

    // Solid Collision Obstacles
    this.colliders = [
      // Rocket core & boosters at (0, 0)
      { type: 'cylinder', x: 0, z: 0, r: 4.8 },
      // Launch Tower at x: -11, z: 0
      { type: 'box', minX: -14.6, maxX: -7.4, minZ: -3.8, maxZ: 3.8 },
      // Mission Prep Console at x: 0, z: 14
      { type: 'box', minX: -1.4, maxX: 1.4, minZ: 13.2, maxZ: 14.8 },
      // VAB Hangar at x: -80, z: -70
      { type: 'box', minX: -106, maxX: -54, minZ: -94, maxZ: -46 },
      // Tracking Radome at x: -70, z: 70
      { type: 'cylinder', x: -70, z: 70, r: 8.5 },
      // Floodlight poles
      { type: 'cylinder', x: -22, z: 22, r: 1.2 },
      { type: 'cylinder', x: 22, z: 22, r: 1.2 },
      { type: 'cylinder', x: -22, z: -22, r: 1.2 },
      { type: 'cylinder', x: 22, z: -22, r: 1.2 },
    ];

    // Junior Astronaut Due Process & Mission State
    this.procedureStep = 1; // 1: Telemetry, 2: Elevator, 3: Ingress, 4: Countdown, 5: Ascent
    this.procedureState = {
      telemetryDone: false,
      elevatorAscending: false,
      elevatorHeight: 0,
      boardedCockpit: false,
      countdownActive: false,
      countdownTime: 10,
      rocketLaunched: false,
      rocketPosY: 0,
      rocketVelocityY: 0,
      rocketPitchZ: 0,
      boostersSeparated: false,
      orbitReached: false,
    };

    // Scene references
    this.elevatorMesh = null;
    this.rocketGroup = null;
    this.srbLeft = null;
    this.srbRight = null;
    this.exhaustPlume = null;
    this.screenShake = 0;
    this.skyColor = new THREE.Color(0x0a1128);

    this._boundResize = this._onResize.bind(this);
  }

  init() {
    if (this.container) return;
    this._buildDOM();
    this._initScene();
    this._createEnvironment();
    this._createLaunchComplex();
    this._createRocket();
    this._createPlayer();
    this._bindEvents();
  }

  _buildDOM() {
    this.container = document.createElement('div');
    this.container.id = 'earth-world-container';
    this.container.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 1200;
      background: #020617;
      display: none;
      font-family: 'Space Grotesk', system-ui, sans-serif;
      overflow: hidden;
      user-select: none;
    `;

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'earth-world-canvas';
    this.canvas.style.cssText = 'width: 100%; height: 100%; display: block;';
    this.container.appendChild(this.canvas);

    const ui = document.createElement('div');
    ui.id = 'earth-world-ui';
    ui.style.cssText = 'position: absolute; inset: 0; pointer-events: none;';
    ui.innerHTML = `
      <!-- Top Navigation -->
      <div style="position: absolute; top: 16px; left: 20px; right: 20px; display: flex; justify-content: space-between; align-items: flex-start; pointer-events: auto;">
        <div style="background: rgba(10, 20, 35, 0.88); backdrop-filter: blur(12px); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 12px; padding: 10px 18px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">🌍</span>
            <div>
              <div style="font-size: 11px; letter-spacing: 2px; color: #38bdf8; font-weight: 700;">NASA KENNEDY SPACEPORT</div>
              <div style="font-size: 16px; font-weight: 800; color: #f8fafc; letter-spacing: 1px;">EARTH BASE & LAUNCH COMPLEX 39-X</div>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 12px;">
          <button id="earth-exit-orbit-btn" style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(148, 163, 184, 0.3); color: #cbd5e1; padding: 8px 16px; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
            <span>🌌</span> Return to Orbit
          </button>
        </div>
      </div>

      <!-- Physics Telemetry HUD (Top Left) -->
      <div style="position: absolute; top: 85px; left: 20px; width: 280px; background: rgba(8, 15, 28, 0.9); backdrop-filter: blur(10px); border: 1px solid rgba(56, 189, 248, 0.3); border-left: 4px solid #38bdf8; border-radius: 10px; padding: 12px 14px; pointer-events: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid rgba(56, 189, 248, 0.2); padding-bottom: 4px;">
          <span style="font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: #38bdf8;">PHYSICS ENGINE TELEMETRY</span>
          <span style="font-size: 10px; color: #94a3b8;">EARTH 1.00G</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
          <div>
            <div style="color: #64748b; font-size: 9px;">SURFACE GRAVITY</div>
            <div style="color: #38bdf8; font-weight: 700; font-size: 13px;">1.00 G <span style="font-size: 10px; color: #94a3b8;">(9.81 m/s²)</span></div>
          </div>
          <div>
            <div style="color: #64748b; font-size: 9px;">ATM PRESSURE</div>
            <div style="color: #e2e8f0; font-weight: 700; font-size: 13px;">101.3 kPa <span style="font-size: 10px; color: #94a3b8;">(1.0 atm)</span></div>
          </div>
          <div>
            <div style="color: #64748b; font-size: 9px;">VELOCITY</div>
            <div id="earth-phys-speed" style="color: #4ade80; font-weight: 700; font-size: 13px;">0 km/h</div>
          </div>
          <div>
            <div style="color: #64748b; font-size: 9px;">ALTITUDE MSL</div>
            <div id="earth-phys-alt" style="color: #facc15; font-weight: 700; font-size: 13px;">12.4 m</div>
          </div>
        </div>
      </div>

      <!-- Procedures Checklist (Left) -->
      <div style="position: absolute; top: 220px; left: 20px; width: 310px; background: rgba(8, 15, 28, 0.92); backdrop-filter: blur(12px); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 12px; padding: 14px; pointer-events: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #38bdf8;">JUNIOR ASTRONAUT PROCEDURES</div>
          <span style="font-size: 10px; background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-weight: 700;">CHECKLIST</span>
        </div>

        <div id="proc-step-list" style="display: flex; flex-direction: column; gap: 8px; font-size: 12px;">
          <div id="step-1-card" style="background: rgba(56, 189, 248, 0.15); border: 1px solid #38bdf8; border-radius: 8px; padding: 8px 10px; cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span id="step-1-icon">1️⃣</span>
              <div style="flex: 1;">
                <div style="font-weight: 700; color: #f8fafc;">Suit & Telemetry Check</div>
                <div style="font-size: 11px; color: #94a3b8;">Walk to Mission Prep Terminal & press [E]</div>
              </div>
            </div>
          </div>

          <div id="step-2-card" style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 8px; padding: 8px 10px; opacity: 0.6; cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span id="step-2-icon">2️⃣</span>
              <div style="flex: 1;">
                <div style="font-weight: 700; color: #f8fafc;">Launch Tower Elevator</div>
                <div style="font-size: 11px; color: #94a3b8;">Ride gantry elevator up 50m to Crew Arm</div>
              </div>
            </div>
          </div>

          <div id="step-3-card" style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 8px; padding: 8px 10px; opacity: 0.6; cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span id="step-3-icon">3️⃣</span>
              <div style="flex: 1;">
                <div style="font-weight: 700; color: #f8fafc;">Cockpit Ingress (White Room)</div>
                <div style="font-size: 11px; color: #94a3b8;">Walk through cleanroom into Orion Capsule</div>
              </div>
            </div>
          </div>

          <div id="step-4-card" style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 8px; padding: 8px 10px; opacity: 0.6; cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span id="step-4-icon">4️⃣</span>
              <div style="flex: 1;">
                <div style="font-weight: 700; color: #f8fafc;">Engine Chill & Countdown</div>
                <div style="font-size: 11px; color: #94a3b8;">Press [E] or [Space] to ignite T-10s sequence</div>
              </div>
            </div>
          </div>

          <div id="step-5-card" style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 8px; padding: 8px 10px; opacity: 0.6;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span id="step-5-icon">5️⃣</span>
              <div style="flex: 1;">
                <div style="font-weight: 700; color: #f8fafc;">Liftoff & Atmospheric Ascent</div>
                <div style="font-size: 11px; color: #94a3b8;">Ascent physics through Earth atmospheric layers</div>
              </div>
            </div>
          </div>
        </div>

        <div id="proc-action-prompt" style="margin-top: 12px; background: rgba(56, 189, 248, 0.15); border: 1px dashed #38bdf8; border-radius: 6px; padding: 8px; text-align: center; font-size: 11px; color: #bae6fd; font-weight: 600;">
          💡 APPROACH TERMINAL AHEAD & PRESS [E]
        </div>
      </div>

      <!-- Atmospheric Layers Visual HUD (Top Right, active during ascent) -->
      <div id="earth-atmo-layers-hud" style="position: absolute; top: 85px; right: 20px; width: 260px; background: rgba(8, 15, 28, 0.94); backdrop-filter: blur(12px); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 12px; padding: 14px; color: #fff; display: none; pointer-events: auto;">
        <div style="font-size: 10px; font-weight: 800; letter-spacing: 2px; color: #38bdf8; margin-bottom: 10px; border-bottom: 1px solid rgba(56, 189, 248, 0.25); padding-bottom: 4px;">
          EARTH ATMOSPHERIC LAYERS
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px;">
          <div id="tier-exosphere" style="padding: 6px 8px; border-radius: 6px; background: rgba(15, 23, 42, 0.6); border: 1px solid transparent; transition: all 0.4s;">
            <div style="display: flex; justify-content: space-between; font-weight: 700; color: #cbd5e1;">
              <span>EXOSPHERE</span><span>600+ km</span>
            </div>
            <div style="font-size: 9px; color: #64748b;">Cosmic vacuum • Satellites orbit</div>
          </div>
          <div id="tier-thermosphere" style="padding: 6px 8px; border-radius: 6px; background: rgba(15, 23, 42, 0.6); border: 1px solid transparent; transition: all 0.4s;">
            <div style="display: flex; justify-content: space-between; font-weight: 700; color: #cbd5e1;">
              <span>THERMOSPHERE</span><span>85 – 600 km</span>
            </div>
            <div style="font-size: 9px; color: #64748b;">Kármán Line (100km) • ISS • Auroras</div>
          </div>
          <div id="tier-mesosphere" style="padding: 6px 8px; border-radius: 6px; background: rgba(15, 23, 42, 0.6); border: 1px solid transparent; transition: all 0.4s;">
            <div style="display: flex; justify-content: space-between; font-weight: 700; color: #cbd5e1;">
              <span>MESOSPHERE</span><span>50 – 85 km</span>
            </div>
            <div style="font-size: 9px; color: #64748b;">Meteor burnup • Coldest layer (-90°C)</div>
          </div>
          <div id="tier-stratosphere" style="padding: 6px 8px; border-radius: 6px; background: rgba(15, 23, 42, 0.6); border: 1px solid transparent; transition: all 0.4s;">
            <div style="display: flex; justify-content: space-between; font-weight: 700; color: #cbd5e1;">
              <span>STRATOSPHERE</span><span>12 – 50 km</span>
            </div>
            <div style="font-size: 9px; color: #64748b;">Ozone layer • Weather balloons</div>
          </div>
          <div id="tier-troposphere" style="padding: 6px 8px; border-radius: 6px; background: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; transition: all 0.4s;">
            <div style="display: flex; justify-content: space-between; font-weight: 700; color: #38bdf8;">
              <span>TROPOSPHERE</span><span>0 – 12 km</span>
            </div>
            <div style="font-size: 9px; color: #94a3b8;">All Earth weather • 80% atmospheric mass</div>
          </div>
        </div>
      </div>

      <!-- Action Prompt Banner (Clickable!) -->
      <div id="earth-interact-prompt" style="position: absolute; bottom: 85px; left: 50%; transform: translateX(-50%); background: rgba(8, 15, 28, 0.95); border: 1px solid #38bdf8; color: #f8fafc; padding: 12px 28px; border-radius: 30px; font-weight: 700; font-size: 14px; letter-spacing: 1px; display: none; box-shadow: 0 0 25px rgba(56, 189, 248, 0.5); pointer-events: auto; cursor: pointer;">
        PRESS <span style="background: #38bdf8; color: #020617; padding: 2px 8px; border-radius: 4px; margin: 0 4px;">E</span> TO INTERACT
      </div>

      <!-- T-Minus Countdown Overlay -->
      <div id="earth-countdown-overlay" style="position: absolute; top: 120px; left: 50%; transform: translateX(-50%); text-align: center; display: none; pointer-events: none;">
        <div style="font-size: 14px; letter-spacing: 3px; color: #ef4444; font-weight: 800;">T-MINUS COUNTDOWN</div>
        <div id="earth-countdown-digits" style="font-size: 64px; font-weight: 900; color: #ffffff; text-shadow: 0 0 25px rgba(56, 189, 248, 0.8);">T-10</div>
        <div id="earth-countdown-msg" style="font-size: 16px; color: #38bdf8; font-weight: 700;">CRYOGENIC ENGINE CHILL ACTIVE</div>
      </div>

      <!-- Destination Choice Modal (Orbit Reached) -->
      <div id="earth-orbit-destination-modal" style="position: absolute; inset: 0; background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(14px); display: none; align-items: center; justify-content: center; z-index: 200; pointer-events: auto;">
        <div style="max-width: 520px; width: 90%; background: #0b1329; border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 20px; padding: 28px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
          <div style="font-size: 40px; margin-bottom: 8px;">🚀</div>
          <h2 style="font-size: 22px; font-weight: 800; color: #f8fafc; margin: 0 0 8px;">ORBITAL INSERTION ACHIEVED!</h2>
          <p style="font-size: 14px; color: #94a3b8; line-height: 1.5; margin: 0 0 20px;">
            The ARES Heavy spaceship has successfully escaped Earth's atmosphere! Trans-orbital navigation systems are nominal. Select your target destination for physical descent & landing:
          </p>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <button id="btn-dest-moon" style="padding: 14px 20px; background: rgba(203, 213, 225, 0.15); border: 1px solid #cbd5e1; border-radius: 12px; color: #ffffff; font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s;" onmouseover="this.style.background='rgba(203, 213, 225, 0.3)';" onmouseout="this.style.background='rgba(203, 213, 225, 0.15)';">
              <span>🌕 LAND ON THE MOON (Artemis Outpost)</span>
              <span style="font-size: 12px; color: #94a3b8;">0.17G Low Gravity ➔</span>
            </button>
            <button id="btn-dest-mars" style="padding: 14px 20px; background: rgba(249, 115, 22, 0.15); border: 1px solid #f97316; border-radius: 12px; color: #ffffff; font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s;" onmouseover="this.style.background='rgba(249, 115, 22, 0.3)';" onmouseout="this.style.background='rgba(249, 115, 22, 0.15)';">
              <span>🔴 LAND ON MARS (Jezero Colony Base)</span>
              <span style="font-size: 12px; color: #fdba74;">0.38G Surface Base ➔</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Bottom Controls Bar -->
      <div style="position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; background: rgba(10, 20, 35, 0.85); backdrop-filter: blur(10px); border: 1px solid rgba(148, 163, 184, 0.25); border-radius: 24px; padding: 6px 18px; font-size: 12px; color: #94a3b8; pointer-events: auto;">
        <span><b>WASD / Arrows</b> Move</span>
        <span style="opacity: 0.4;">•</span>
        <span><b>Mouse Drag</b> Look</span>
        <span style="opacity: 0.4;">•</span>
        <span><b>Shift</b> Run</span>
        <span style="opacity: 0.4;">•</span>
        <span><b>Space</b> Jump</span>
        <span style="opacity: 0.4;">•</span>
        <span><b>E</b> Interact / Start Launch</span>
      </div>

      <!-- Toast Notification -->
      <div id="earth-toast" style="position: absolute; top: 24px; left: 50%; transform: translateX(-50%); background: rgba(15, 23, 42, 0.95); border: 1px solid #38bdf8; border-radius: 12px; padding: 12px 24px; color: #f8fafc; font-size: 14px; font-weight: 600; text-align: center; opacity: 0; transition: opacity 0.3s; pointer-events: none; max-width: 500px; box-shadow: 0 10px 30px rgba(0,0,0,0.7); z-index: 100;"></div>
    `;

    this.container.appendChild(ui);
    document.body.appendChild(this.container);
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.skyColor = new THREE.Color(0x0a1128);
    this.scene.background = this.skyColor;
    this.scene.fog = new THREE.FogExp2(0x0e1b38, 0.0035);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 1400);
    this.camera.position.set(0, 10, 35);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x1e293b, 0.9);
    this.scene.add(ambientLight);

    const hemisphere = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.6);
    this.scene.add(hemisphere);

    const moonSunLight = new THREE.DirectionalLight(0xffedd5, 1.2);
    moonSunLight.position.set(80, 120, -100);
    this.scene.add(moonSunLight);

    // Stars dome
    const starGeo = new THREE.BufferGeometry();
    const starPos = [];
    for (let i = 0; i < 2400; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.9 + 0.1);
      const r = 500;
      starPos.push(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    this.scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, transparent: true, opacity: 0.85 })));
  }

  _createEnvironment() {
    // Ground tarmac
    const groundGeo = new THREE.PlaneGeometry(600, 600, 32, 32);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1e2530, roughness: 0.85, metalness: 0.1 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Coastline Ocean on East
    const oceanGeo = new THREE.PlaneGeometry(300, 600);
    oceanGeo.rotateX(-Math.PI / 2);
    const ocean = new THREE.Mesh(oceanGeo, new THREE.MeshStandardMaterial({ color: 0x03284c, roughness: 0.2, metalness: 0.8 }));
    ocean.position.set(220, -0.4, 0);
    this.scene.add(ocean);

    // Skyscrapers & buildings
    this._createCitySkyscrapers();
    this._createVAB();
    this._createRadomes();
  }

  _createCitySkyscrapers() {
    const cityGroup = new THREE.Group();
    const bldgMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.7 });

    for (let i = 0; i < 26; i++) {
      const h = 45 + (i * 7) % 65;
      const w = 18 + (i * 3) % 12;
      const d = 18 + (i * 5) % 12;
      const x = -130 - (i % 5) * 26;
      const z = -170 + i * 15;

      const bldg = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bldgMat);
      bldg.position.set(x, h / 2, z);
      cityGroup.add(bldg);

      // Add to collision
      this.colliders.push({ type: 'box', minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });

      // Window glow
      const win = new THREE.Mesh(
        new THREE.BoxGeometry(w * 1.01, h * 0.7, d * 1.01),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4 })
      );
      win.position.set(x, h * 0.45, z);
      cityGroup.add(win);
    }
    this.scene.add(cityGroup);
  }

  _createVAB() {
    const vabGroup = new THREE.Group();
    vabGroup.position.set(-80, 0, -70);
    const vabMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.5 });
    const mainBay = new THREE.Mesh(new THREE.BoxGeometry(50, 55, 45), vabMat);
    mainBay.position.set(0, 27.5, 0);
    vabGroup.add(mainBay);
    this.scene.add(vabGroup);
  }

  _createRadomes() {
    const dishGroup = new THREE.Group();
    dishGroup.position.set(-70, 0, 70);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
    const pylon = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2.0, 10, 8), dishMat);
    pylon.position.set(0, 5, 0);
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(7, 16, 10, 0, Math.PI * 2, 0, Math.PI / 3), dishMat);
    bowl.position.set(0, 11, 0);
    bowl.rotation.x = 0.8;
    dishGroup.add(pylon, bowl);
    this.scene.add(dishGroup);
  }

  _createLaunchComplex() {
    const padGroup = new THREE.Group();
    const concMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.6 });

    // Pad Base
    const padBase = new THREE.Mesh(new THREE.CylinderGeometry(28, 34, 4.5, 8), concMat);
    padBase.position.set(0, 2.25, 0);
    padGroup.add(padBase);

    // Launch Tower
    const towerH = 68;
    const towerW = 6.5;
    const tower = new THREE.Mesh(new THREE.BoxGeometry(towerW, towerH, towerW), steelMat);
    tower.position.set(-11, towerH / 2 + 4.5, 0);
    padGroup.add(tower);

    // Glass Elevator Cab
    const elevGeo = new THREE.BoxGeometry(3.2, 3.8, 3.2);
    const elevMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2, transparent: true, opacity: 0.75 });
    this.elevatorMesh = new THREE.Mesh(elevGeo, elevMat);
    this.elevatorMesh.position.set(-11, 6.5, 4.2);
    padGroup.add(this.elevatorMesh);

    // Crew Access Arm
    const arm = new THREE.Mesh(new THREE.BoxGeometry(11, 2.8, 2.8), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
    arm.position.set(-4.5, 50, 0);
    const whiteRoom = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.6, 3.6), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    whiteRoom.position.set(0.5, 50, 0);
    padGroup.add(arm, whiteRoom);

    // Mission Console (Step 1)
    const consoleMesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 1.2), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    consoleMesh.position.set(0, 4.5 + 0.7, 14);
    const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    screenMesh.position.set(0, 4.5 + 1.2, 14.62);
    padGroup.add(consoleMesh, screenMesh);

    // Floodlights
    [[-22, 16, 22], [22, 16, 22], [-22, 16, -22], [22, 16, -22]].forEach(([x, y, z]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, y, 6), steelMat);
      pole.position.set(x, y / 2, z);
      const head = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.2), new THREE.MeshBasicMaterial({ color: 0xffedd5 }));
      head.position.set(x, y, z);
      padGroup.add(pole, head);
    });

    this.scene.add(padGroup);
  }

  _createRocket() {
    this.rocketGroup = new THREE.Group();
    this.rocketGroup.position.set(0, 4.5, 0);

    const rocketMatCore = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.2 });
    const tankOrangeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
    const darkBandMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const engineMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 });

    // Core Booster
    const coreCylinder = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 34, 24), tankOrangeMat);
    coreCylinder.position.set(0, 19, 0);
    this.rocketGroup.add(coreCylinder);

    // Collars
    const bottomCollar = new THREE.Mesh(new THREE.CylinderGeometry(2.64, 2.64, 3, 24), rocketMatCore);
    bottomCollar.position.set(0, 3.5, 0);
    const topCollar = new THREE.Mesh(new THREE.CylinderGeometry(2.64, 2.64, 4, 24), rocketMatCore);
    topCollar.position.set(0, 36, 0);
    this.rocketGroup.add(bottomCollar, topCollar);

    // 4x RS-25 Engines
    [[-1.1, 0, -1.1], [1.1, 0, -1.1], [-1.1, 0, 1.1], [1.1, 0, 1.1]].forEach(([ex, ey, ez]) => {
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.9, 2.2, 14), engineMat);
      nozzle.position.set(ex, 1.1, ez);
      this.rocketGroup.add(nozzle);
    });

    // Dual SRBs
    this.srbLeft = this._createSRB(-4.2, 0, rocketMatCore, engineMat, darkBandMat);
    this.srbRight = this._createSRB(4.2, 0, rocketMatCore, engineMat, darkBandMat);
    this.rocketGroup.add(this.srbLeft, this.srbRight);

    // Upper Stage & Orion Capsule
    const upperStage = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 7, 24), rocketMatCore);
    upperStage.position.set(0, 41.5, 0);
    const capsule = new THREE.Mesh(new THREE.ConeGeometry(2.4, 4.2, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }));
    capsule.position.set(0, 47.1, 0);
    const heatShield = new THREE.Mesh(new THREE.CylinderGeometry(2.42, 2.42, 0.4, 24), darkBandMat);
    heatShield.position.set(0, 45.1, 0);
    const lasSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 8.5, 8), rocketMatCore);
    lasSpire.position.set(0, 53.5, 0);
    this.rocketGroup.add(upperStage, capsule, heatShield, lasSpire);

    // Exhaust Plume
    const exhaustGeo = new THREE.ConeGeometry(4.5, 26, 16);
    exhaustGeo.rotateX(Math.PI);
    this.exhaustPlume = new THREE.Mesh(exhaustGeo, new THREE.MeshBasicMaterial({ color: 0xff7700, transparent: true, opacity: 0 }));
    this.exhaustPlume.position.set(0, -13, 0);
    this.rocketGroup.add(this.exhaustPlume);

    const innerFlame = new THREE.Mesh(new THREE.ConeGeometry(2.2, 20, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
    innerFlame.rotateX(Math.PI);
    innerFlame.position.set(0, -3, 0);
    this.exhaustPlume.add(innerFlame);

    this.scene.add(this.rocketGroup);
  }

  _createSRB(xOffset, zOffset, whiteMat, engineMat, darkMat) {
    const srbGroup = new THREE.Group();
    srbGroup.position.set(xOffset, 0, zOffset);
    const srbBody = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 32, 18), whiteMat);
    srbBody.position.set(0, 18, 0);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.2, 4.5, 18), darkMat);
    nose.position.set(0, 36.25, 0);
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.1, 2.4, 14), engineMat);
    nozzle.position.set(0, 1.0, 0);
    srbGroup.add(srbBody, nose, nozzle);
    return srbGroup;
  }

  _createPlayer() {
    const player = new THREE.Group();
    player.position.set(0, 4.5, 18);

    const suitMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
    const visorMat = new THREE.MeshLambertMaterial({ color: 0x0284c7, emissive: 0x0369a1 });
    const bootMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });

    const bodyGroup = new THREE.Group();
    player.add(bodyGroup);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.34, 0.75, 12), suitMat);
    torso.position.set(0, 0.9, 0);
    bodyGroup.add(torso);

    const helmetGroup = new THREE.Group();
    helmetGroup.position.set(0, 1.48, 0);
    const helmetMesh = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 14), suitMat);
    const visorMesh = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), visorMat);
    visorMesh.position.set(0, 0.02, 0.18);
    visorMesh.scale.set(1.0, 0.85, 0.65);
    helmetGroup.add(helmetMesh, visorMesh);
    bodyGroup.add(helmetGroup);

    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.72, 0.28), bootMat);
    pack.position.set(0, 0.98, -0.32);
    bodyGroup.add(pack);

    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.18, 0.52, 0);
    leftLeg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.28, 8), suitMat));
    const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.28), bootMat);
    bootL.position.set(0, -0.42, 0.04);
    leftLeg.add(bootL);
    player.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.18, 0.52, 0);
    rightLeg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.28, 8), suitMat));
    const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.28), bootMat);
    bootR.position.set(0, -0.42, 0.04);
    rightLeg.add(bootR);
    player.add(rightLeg);

    const leftArm = new THREE.Group();
    leftArm.position.set(-0.44, 1.18, 0);
    leftArm.add(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.38, 8), suitMat));
    bodyGroup.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.44, 1.18, 0);
    rightArm.add(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.38, 8), suitMat));
    bodyGroup.add(rightArm);

    this.playerGroup = player;
    this.playerModel = { bodyGroup, leftLeg, rightLeg, leftArm, rightArm };
    this.scene.add(this.playerGroup);
  }

  _bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (!this.isActive) return;
      const k = e.key.toLowerCase();
      this.keys[k] = true;

      // Handle 'E' or 'Space' for procedures
      if (k === 'e') {
        this._interact();
      }
      if (k === ' ' && this.isGrounded && !this.procedureState.boardedCockpit) {
        this.vy = this.physics.jumpForce;
        this.isGrounded = false;
        sound.playTone(380, 0.08, 'sine', 0.08);
      } else if ((k === ' ' || k === 'e') && this.procedureState.boardedCockpit && !this.procedureState.countdownActive) {
        this._startCountdownSequence();
      }

      if (k === 'escape') this.stop();
    });

    window.addEventListener('keyup', (e) => {
      if (!this.isActive) return;
      this.keys[e.key.toLowerCase()] = false;
    });

    this.canvas.addEventListener('pointerdown', (e) => {
      this.pointerTargets[e.pointerId] = { x: e.clientX, y: e.clientY };
      this.canvas.setPointerCapture(e.pointerId);
    });

    this.canvas.addEventListener('pointermove', (e) => {
      const p = this.pointerTargets[e.pointerId];
      if (!p) return;
      const deltaX = (e.clientX - p.x) * 0.005;
      const deltaY = (e.clientY - p.y) * 0.005;
      this.targetFacingYaw += deltaX;
      this.pitch = THREE.MathUtils.clamp(this.pitch + deltaY, 0.12, 1.1);
      p.x = e.clientX;
      p.y = e.clientY;
    });

    const pointerUp = (e) => {
      delete this.pointerTargets[e.pointerId];
    };
    this.canvas.addEventListener('pointerup', pointerUp);
    this.canvas.addEventListener('pointercancel', pointerUp);

    // Interactive prompt banner click
    const promptBanner = this.container.querySelector('#earth-interact-prompt');
    if (promptBanner) {
      promptBanner.addEventListener('click', () => {
        this._interact();
      });
    }

    // Procedure step cards click
    const step4 = this.container.querySelector('#step-4-card');
    if (step4) {
      step4.addEventListener('click', () => {
        if (this.procedureStep === 4 && !this.procedureState.countdownActive) {
          this._startCountdownSequence();
        }
      });
    }

    // Destination choices
    const btnMoon = this.container.querySelector('#btn-dest-moon');
    if (btnMoon) {
      btnMoon.addEventListener('click', () => {
        this.container.querySelector('#earth-orbit-destination-modal').style.display = 'none';
        this.stop();
        this.onLandOnMoon();
      });
    }

    const btnMars = this.container.querySelector('#btn-dest-mars');
    if (btnMars) {
      btnMars.addEventListener('click', () => {
        this.container.querySelector('#earth-orbit-destination-modal').style.display = 'none';
        this.stop();
        this.onLandOnMars();
      });
    }

    const exitBtn = this.container.querySelector('#earth-exit-orbit-btn');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        sound.playClick();
        this.stop();
      });
    }

    window.addEventListener('resize', this._boundResize);
  }

  _resolveCollision(newX, newZ, radius = 0.5) {
    let px = newX;
    let pz = newZ;

    // If player is on the elevated Crew Access Arm (Y > 42m),
    // ground-level colliders must NOT block the player!
    // Safely confine player to the gangway bridge leading into the White Room:
    if (this.playerGroup.position.y > 42) {
      px = THREE.MathUtils.clamp(newX, -12.5, 1.8);
      pz = THREE.MathUtils.clamp(newZ, -2.0, 2.0);
      return [px, pz];
    }

    // Ground-level collision resolution
    for (const c of this.colliders) {
      if (c.type === 'cylinder') {
        const dx = px - c.x;
        const dz = pz - c.z;
        const dist = Math.hypot(dx, dz);
        const minDist = c.r + radius;
        if (dist < minDist && dist > 0.001) {
          const push = (minDist - dist) / dist;
          px += dx * push;
          pz += dz * push;
        }
      } else if (c.type === 'box') {
        if (px + radius > c.minX && px - radius < c.maxX && pz + radius > c.minZ && pz - radius < c.maxZ) {
          const overlapL = (px + radius) - c.minX;
          const overlapR = c.maxX - (px - radius);
          const overlapT = (pz + radius) - c.minZ;
          const overlapB = c.maxZ - (pz - radius);
          const minOverlap = Math.min(overlapL, overlapR, overlapT, overlapB);

          if (minOverlap === overlapL) px = c.minX - radius;
          else if (minOverlap === overlapR) px = c.maxX + radius;
          else if (minOverlap === overlapT) pz = c.minZ - radius;
          else if (minOverlap === overlapB) pz = c.maxZ + radius;
        }
      }
    }
    return [px, pz];
  }

  _interact() {
    const pos = this.playerGroup.position;

    // Step 1: Telemetry Check at console (0, 4.5, 14)
    if (this.procedureStep === 1) {
      const distToConsole = Math.hypot(pos.x - 0, pos.z - 14);
      if (distToConsole < 5.5) {
        sound.playPowerUp();
        this.procedureState.telemetryDone = true;
        this.procedureStep = 2;
        this._updateProcedureUI();
        this.toast('✅ <b>SUIT TELEMETRY NOMINAL</b>: Oxygen 100%, flight systems synced!', 5000);
        sound.speak('Telemetry nominal. Proceed to launch tower elevator.');
        return;
      }
    }

    // Step 2: Gantry Elevator at tower (-11, 4.5, 4.2)
    if (this.procedureStep === 2) {
      const distToElev = Math.hypot(pos.x - (-11), pos.z - 4.2);
      if (distToElev < 5.5 && !this.procedureState.elevatorAscending) {
        this.procedureState.elevatorAscending = true;
        sound.playElevatorHum(3.5);
        this.toast('🛗 <b>ASCENDING GANTRY TOWER</b>: Riding elevator to Crew Access Arm (50m)...', 4000);
        sound.speak('Elevator ascending to crew arm.');
        return;
      }
    }

    // Step 3: Ingress Orion Cockpit at White Room (0.5, 50, 0) - Generous distance and clear entry!
    if (this.procedureStep === 3) {
      const distToWhiteRoom = Math.hypot(pos.x - 0.5, pos.z - 0);
      if (distToWhiteRoom < 6.5 && pos.y > 42) {
        sound.playPowerUp();
        this.procedureState.boardedCockpit = true;
        this.procedureStep = 4;
        this.playerGroup.visible = false;
        this._updateProcedureUI();
        this.toast('🚀 <b>BOARDED ORION CAPSULE</b>: Hatch sealed. Systems armed for launch!', 6000);
        sound.speak('Commander onboard. Press E or Click to initiate countdown.');
        return;
      }
    }

    // Step 4: Engine Chill & Start Countdown (triggers on pressing E or clicking!)
    if (this.procedureStep === 4 && !this.procedureState.countdownActive) {
      this._startCountdownSequence();
    }
  }

  _updateProcedureUI() {
    const stepCards = [
      this.container.querySelector('#step-1-card'),
      this.container.querySelector('#step-2-card'),
      this.container.querySelector('#step-3-card'),
      this.container.querySelector('#step-4-card'),
      this.container.querySelector('#step-5-card'),
    ];
    const icons = [
      this.container.querySelector('#step-1-icon'),
      this.container.querySelector('#step-2-icon'),
      this.container.querySelector('#step-3-icon'),
      this.container.querySelector('#step-4-icon'),
      this.container.querySelector('#step-5-icon'),
    ];

    stepCards.forEach((card, idx) => {
      const stepNum = idx + 1;
      if (stepNum < this.procedureStep) {
        card.style.opacity = '0.7';
        card.style.background = 'rgba(34, 197, 94, 0.15)';
        card.style.borderColor = '#22c55e';
        icons[idx].textContent = '✅';
        icons[idx].style.color = '#22c55e';
      } else if (stepNum === this.procedureStep) {
        card.style.opacity = '1.0';
        card.style.background = 'rgba(56, 189, 248, 0.25)';
        card.style.borderColor = '#38bdf8';
        icons[idx].textContent = '▶️';
        icons[idx].style.color = '#38bdf8';
      } else {
        card.style.opacity = '0.5';
        card.style.background = 'rgba(15, 23, 42, 0.6)';
        card.style.borderColor = 'rgba(148, 163, 184, 0.2)';
      }
    });

    const promptEl = this.container.querySelector('#proc-action-prompt');
    const interactBanner = this.container.querySelector('#earth-interact-prompt');

    if (this.procedureStep === 1) {
      promptEl.textContent = '💡 APPROACH TERMINAL AHEAD & PRESS [E]';
    } else if (this.procedureStep === 2) {
      promptEl.textContent = '💡 WALK TO LAUNCH TOWER BASE & PRESS [E] FOR ELEVATOR';
    } else if (this.procedureStep === 3) {
      promptEl.textContent = '💡 WALK ACROSS CREW ARM INTO WHITE ROOM & PRESS [E]';
    } else if (this.procedureStep === 4) {
      promptEl.innerHTML = '🚀 <b>PRESS [E] OR [SPACE] TO INITIATE T-10S COUNTDOWN!</b>';
      interactBanner.style.display = 'block';
      interactBanner.innerHTML = '🚀 <b>PRESS [E] OR CLICK HERE TO START T-10S COUNTDOWN!</b>';
      interactBanner.style.background = 'rgba(239, 68, 68, 0.9)';
      interactBanner.style.borderColor = '#f87171';
    } else if (this.procedureStep === 5) {
      promptEl.textContent = '🚀 ASCENDING TO ORBIT: PUNCHING THROUGH ATMOSPHERIC LAYERS';
      interactBanner.style.display = 'none';
    }
  }

  _startCountdownSequence() {
    this.procedureState.countdownActive = true;
    this.procedureState.countdownTime = 10;

    const overlay = this.container.querySelector('#earth-countdown-overlay');
    const digits = this.container.querySelector('#earth-countdown-digits');
    const msg = this.container.querySelector('#earth-countdown-msg');
    overlay.style.display = 'block';

    const atmoHud = this.container.querySelector('#earth-atmo-layers-hud');
    atmoHud.style.display = 'block'; // Show atmospheric layers ladder

    const interval = setInterval(() => {
      this.procedureState.countdownTime--;
      if (this.procedureState.countdownTime > 0) {
        digits.textContent = `T-${this.procedureState.countdownTime}`;
        sound.playCountdownBeep(false);

        if (this.procedureState.countdownTime === 5) {
          msg.textContent = 'IGNITION WATER DELUGE ACTIVE (SOUND SUPPRESSION)';
        } else if (this.procedureState.countdownTime === 3) {
          msg.textContent = 'MAIN ENGINE START: 3, 2, 1...';
          sound.playRocketRumble(14.0);
          this.exhaustPlume.material.opacity = 0.95;
          this.screenShake = 0.35;
        }
      } else if (this.procedureState.countdownTime === 0) {
        clearInterval(interval);
        digits.textContent = 'LIFTOFF!';
        digits.style.color = '#38bdf8';
        msg.textContent = 'ARES HEAVY HAS CLEARED THE LAUNCH TOWER!';
        sound.playCountdownBeep(true);
        sound.speak('Liftoff! We have liftoff of the Junior Astronaut ARES spaceship!');
        this.procedureState.rocketLaunched = true;
        this.procedureStep = 5;
        this._updateProcedureUI();

        setTimeout(() => {
          overlay.style.display = 'none';
        }, 3500);
      }
    }, 1000);
  }

  _updateAtmosphericLayers(altitudeM) {
    const altKm = altitudeM / 1000;
    const tiers = {
      troposphere: this.container.querySelector('#tier-troposphere'),
      stratosphere: this.container.querySelector('#tier-stratosphere'),
      mesosphere: this.container.querySelector('#tier-mesosphere'),
      thermosphere: this.container.querySelector('#tier-thermosphere'),
      exosphere: this.container.querySelector('#tier-exosphere'),
    };

    // Reset styles
    Object.values(tiers).forEach((el) => {
      if (!el) return;
      el.style.background = 'rgba(15, 23, 42, 0.6)';
      el.style.borderColor = 'transparent';
      const title = el.querySelector('span');
      if (title) title.style.color = '#cbd5e1';
    });

    let currentTier = 'troposphere';
    let skyTarget = 0x0a1128; // Troposphere

    if (altKm < 12) {
      currentTier = 'troposphere';
      skyTarget = 0x0a1128;
    } else if (altKm < 50) {
      currentTier = 'stratosphere';
      skyTarget = 0x03081e;
    } else if (altKm < 85) {
      currentTier = 'mesosphere';
      skyTarget = 0x020412;
    } else if (altKm < 600) {
      currentTier = 'thermosphere';
      skyTarget = 0x000108;
    } else {
      currentTier = 'exosphere';
      skyTarget = 0x000000;
    }

    const activeEl = tiers[currentTier];
    if (activeEl) {
      activeEl.style.background = 'rgba(56, 189, 248, 0.25)';
      activeEl.style.borderColor = '#38bdf8';
      const title = activeEl.querySelector('span');
      if (title) title.style.color = '#38bdf8';
    }

    // Smoothly darken sky to deep space
    this.skyColor.lerp(new THREE.Color(skyTarget), 0.05);
    this.scene.background = this.skyColor;
    if (this.scene.fog) {
      this.scene.fog.density = THREE.MathUtils.lerp(this.scene.fog.density, altKm > 80 ? 0 : 0.001, 0.05);
    }
  }

  _tick(dt) {
    this.elapsedTime += dt;

    // Elevator Animation
    if (this.procedureState.elevatorAscending && this.elevatorMesh) {
      this.procedureState.elevatorHeight += dt * 14.0;
      if (this.procedureState.elevatorHeight >= 45.5) {
        this.procedureState.elevatorHeight = 45.5;
        this.procedureState.elevatorAscending = false;
        this.procedureStep = 3;
        this._updateProcedureUI();
        this.playerGroup.position.set(-11, 50, 2);
        this.toast('🚶 <b>CREW ACCESS ARM</b>: Walk forward into the White Room capsule hatch!', 5000);
      }
      this.elevatorMesh.position.y = 4.5 + 2.0 + this.procedureState.elevatorHeight;
      this.playerGroup.position.y = this.elevatorMesh.position.y;
    }

    // Rocket Liftoff & Ascent Physics
    if (this.procedureState.rocketLaunched) {
      // Accelerate upward according to F = T - mg
      this.procedureState.rocketVelocityY += dt * 22.0;
      this.procedureState.rocketPosY += this.procedureState.rocketVelocityY * dt;
      this.rocketGroup.position.y = 4.5 + this.procedureState.rocketPosY;

      // Simulated altitude: maps game Y to kilometers
      const simulatedAltM = Math.round(this.procedureState.rocketPosY * 120);
      this._updateAtmosphericLayers(simulatedAltM);

      // Gravity turn
      if (this.procedureState.rocketPosY > 60) {
        this.procedureState.rocketPitchZ = Math.min(0.65, this.procedureState.rocketPitchZ + dt * 0.08);
        this.rocketGroup.rotation.z = -this.procedureState.rocketPitchZ;
        this.rocketGroup.position.x += dt * 14.0;
      }

      this.screenShake = Math.max(0, 0.45 - this.procedureState.rocketPosY * 0.0008);

      // Booster Separation at altitude
      if (this.procedureState.rocketPosY > 220 && !this.procedureState.boostersSeparated) {
        this.procedureState.boostersSeparated = true;
        sound.playVictory();
        this.toast('💥 <b>BOOSTER SEPARATION CONFIRMED!</b> Core stage continuing to orbit.', 5000);
      }
      if (this.procedureState.boostersSeparated) {
        this.srbLeft.position.x -= dt * 9.0;
        this.srbRight.position.x += dt * 9.0;
        this.srbLeft.position.y -= dt * 6.0;
        this.srbRight.position.y -= dt * 6.0;
        this.srbLeft.rotation.z += dt * 0.5;
        this.srbRight.rotation.z -= dt * 0.5;
      }

      // Orbital Insertion achieved: Offer Moon or Mars Landing destination!
      if (this.procedureState.rocketPosY > 450 && !this.procedureState.orbitReached) {
        this.procedureState.orbitReached = true;
        sound.playVictory();
        sound.speak('Orbital insertion nominal. Destination trajectory ready.');
        const modal = this.container.querySelector('#earth-orbit-destination-modal');
        if (modal) modal.style.display = 'flex';
      }
    }

    // Player Movement & Solid Collision
    if (!this.procedureState.boardedCockpit && !this.procedureState.elevatorAscending) {
      const moveForward = (this.keys['w'] || this.keys['arrowup'] ? 1 : 0) - (this.keys['s'] || this.keys['arrowdown'] ? 1 : 0) - this.joy.y;
      const moveRight = (this.keys['d'] || this.keys['arrowright'] ? 1 : 0) - (this.keys['a'] || this.keys['arrowleft'] ? 1 : 0) + this.joy.x;
      const isMoving = Math.abs(moveForward) > 0.05 || Math.abs(moveRight) > 0.05;
      const isRunning = this.keys['shift'] && isMoving;
      const speed = isRunning ? 9.8 : 5.4;

      if (Math.abs(moveRight) > 0.05) {
        const steerRate = Math.abs(moveForward) > 0.05 ? 2.4 : 3.0;
        this.targetFacingYaw += moveRight * steerRate * dt;
      }

      let targetTilt = 0;
      if (isMoving && Math.abs(moveRight) > 0.05) {
        targetTilt = -Math.sign(moveRight) * (isRunning ? 0.14 : 0.09);
      }

      if (isMoving) {
        const theta = this.playerGroup.rotation.y;
        const strafeFactor = Math.abs(moveForward) > 0.05 ? 0.25 : 1.0;
        const fwd = moveForward;
        const str = moveRight * strafeFactor;
        const mag = Math.hypot(fwd, str) || 1;
        const normF = fwd / Math.max(1, mag);
        const normS = str / Math.max(1, mag);

        const dx = Math.sin(theta) * normF + Math.cos(theta) * normS;
        const dz = Math.cos(theta) * normF - Math.sin(theta) * normS;

        const rawX = THREE.MathUtils.clamp(this.playerGroup.position.x + dx * speed * dt, -200, 160);
        const rawZ = THREE.MathUtils.clamp(this.playerGroup.position.z + dz * speed * dt, -200, 200);

        // SOLID COLLISION RESOLUTION: Player cannot pass through objects!
        const [colX, colZ] = this._resolveCollision(rawX, rawZ, 0.45);
        this.playerGroup.position.x = colX;
        this.playerGroup.position.z = colZ;

        this.walkCycle += dt * (isRunning ? 18 : 11);
        const legSwing = Math.sin(this.walkCycle) * (isRunning ? 0.75 : 0.55);
        const armSwing = Math.sin(this.walkCycle) * (isRunning ? 0.65 : 0.45);

        if (this.playerModel) {
          this.playerModel.leftLeg.rotation.x = legSwing;
          this.playerModel.rightLeg.rotation.x = -legSwing;
          this.playerModel.leftArm.rotation.x = -armSwing;
          this.playerModel.rightArm.rotation.x = armSwing;
          this.playerModel.bodyGroup.position.y = Math.abs(Math.sin(this.walkCycle)) * 0.06;
          this.playerModel.bodyGroup.rotation.z = THREE.MathUtils.lerp(
            this.playerModel.bodyGroup.rotation.z,
            targetTilt,
            dt * 9.0
          );
        }

        this.physics.speedKmH = Math.round(speed * 3.6);
      } else {
        if (this.playerModel) {
          this.playerModel.leftLeg.rotation.x *= 0.85;
          this.playerModel.rightLeg.rotation.x *= 0.85;
          this.playerModel.leftArm.rotation.x *= 0.85;
          this.playerModel.rightArm.rotation.x *= 0.85;
          this.playerModel.bodyGroup.position.y = Math.sin(this.elapsedTime * 2.5) * 0.02;
          this.playerModel.bodyGroup.rotation.z = THREE.MathUtils.lerp(
            this.playerModel.bodyGroup.rotation.z,
            0,
            dt * 9.0
          );
        }
        this.physics.speedKmH = 0;
      }

      // Earth Gravity: 18.0 m/s²
      const currentGroundY = (this.procedureStep >= 3 && Math.abs(this.playerGroup.position.y - 50) < 5) ? 50 : 4.5;
      this.vy -= this.physics.gravity * dt;
      this.playerGroup.position.y += this.vy * dt;
      if (this.playerGroup.position.y <= currentGroundY) {
        this.playerGroup.position.y = currentGroundY;
        this.vy = 0;
        this.isGrounded = true;
      }

      this.playerGroup.rotation.y = this._lerpAngle(this.playerGroup.rotation.y, this.targetFacingYaw, dt * 14);

      // Context-sensitive interact prompt display
      const promptEl = this.container.querySelector('#earth-interact-prompt');
      let showPrompt = false;
      if (this.procedureStep === 1 && Math.hypot(this.playerGroup.position.x - 0, this.playerGroup.position.z - 14) < 5.5) {
        showPrompt = true;
        promptEl.innerHTML = 'PRESS <span style="background:#38bdf8;color:#020617;padding:2px 8px;border-radius:4px;margin:0 4px;">E</span> RUN SUIT TELEMETRY CHECK';
      } else if (this.procedureStep === 2 && Math.hypot(this.playerGroup.position.x - (-11), this.playerGroup.position.z - 4.2) < 5.5) {
        showPrompt = true;
        promptEl.innerHTML = 'PRESS <span style="background:#38bdf8;color:#020617;padding:2px 8px;border-radius:4px;margin:0 4px;">E</span> BOARD LAUNCH TOWER ELEVATOR';
      } else if (this.procedureStep === 3 && Math.hypot(this.playerGroup.position.x - 0.5, this.playerGroup.position.z - 0) < 6.5) {
        showPrompt = true;
        promptEl.innerHTML = 'PRESS <span style="background:#38bdf8;color:#020617;padding:2px 8px;border-radius:4px;margin:0 4px;">E</span> BOARD ORION CAPSULE COCKPIT';
      }
      if (this.procedureStep !== 4) {
        promptEl.style.display = showPrompt ? 'block' : 'none';
      }
    }

    // Telemetry updates
    const speedEl = this.container.querySelector('#earth-phys-speed');
    const altEl = this.container.querySelector('#earth-phys-alt');
    if (speedEl) {
      const curSpeed = this.procedureState.rocketLaunched
        ? Math.round(this.procedureState.rocketVelocityY * 180)
        : this.physics.speedKmH;
      speedEl.textContent = `${curSpeed} km/h`;
    }
    if (altEl) {
      const curAlt = this.procedureState.rocketLaunched
        ? `${Math.round(this.procedureState.rocketPosY * 120 / 1000 * 10) / 10} km`
        : `${Math.round(this.playerGroup.position.y + 7.5)} m`;
      altEl.textContent = curAlt;
    }
  }

  _renderLoop() {
    if (!this.isActive) return;
    this.animId = requestAnimationFrame(() => this._renderLoop());

    const dt = Math.min(this.clock.getDelta(), 0.05);
    this._tick(dt);

    if (this.procedureState.boardedCockpit) {
      const rocketY = this.rocketGroup ? this.rocketGroup.position.y : 25;
      const targetLook = new THREE.Vector3(0, rocketY + 20, 0);
      this.smoothLookTarget.lerp(targetLook, Math.min(1, dt * 8.0));

      const camX = 45 + (Math.random() - 0.5) * this.screenShake;
      const camY = 32 + rocketY * 0.45 + (Math.random() - 0.5) * this.screenShake;
      const camZ = 55 + (Math.random() - 0.5) * this.screenShake;
      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(this.smoothLookTarget);
    } else {
      const p = this.playerGroup.position;
      const targetLook = new THREE.Vector3(p.x, p.y + 1.6, p.z);
      this.smoothLookTarget.lerp(targetLook, Math.min(1, dt * 14));

      const idealCamYaw = this.playerGroup.rotation.y + Math.PI;
      this.currentCameraYaw = this._lerpAngle(this.currentCameraYaw, idealCamYaw, dt * 8.0);

      const targetCamX = p.x + Math.sin(this.currentCameraYaw) * Math.cos(this.pitch) * this.camDist;
      const targetCamY = p.y + Math.sin(this.pitch) * this.camDist;
      const targetCamZ = p.z + Math.cos(this.currentCameraYaw) * Math.cos(this.pitch) * this.camDist;

      this.camera.position.x += (targetCamX - this.camera.position.x) * Math.min(1, dt * 14);
      this.camera.position.y += (targetCamY - this.camera.position.y) * Math.min(1, dt * 14);
      this.camera.position.z += (targetCamZ - this.camera.position.z) * Math.min(1, dt * 14);

      if (this.camera.position.y < p.y + 0.8) this.camera.position.y = p.y + 0.8;
      this.camera.lookAt(this.smoothLookTarget);
    }

    this.renderer.render(this.scene, this.camera);
  }

  _lerpAngle(current, target, alpha) {
    let diff = target - current;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    return current + diff * Math.min(1, alpha);
  }

  toast(html, duration = 4000) {
    const el = this.container.querySelector('#earth-toast');
    if (!el) return;
    el.innerHTML = html;
    el.style.opacity = '1';
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      el.style.opacity = '0';
    }, duration);
  }

  _onResize() {
    if (!this.renderer || !this.camera) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  start() {
    this.init();
    this.isActive = true;
    this.container.style.display = 'block';
    this.clock.start();

    this.playerGroup.position.set(0, 4.5, 18);
    this.playerGroup.visible = true;
    this.procedureStep = 1;
    this.procedureState = {
      telemetryDone: false,
      elevatorAscending: false,
      elevatorHeight: 0,
      boardedCockpit: false,
      countdownActive: false,
      countdownTime: 10,
      rocketLaunched: false,
      rocketPosY: 0,
      rocketVelocityY: 0,
      rocketPitchZ: 0,
      boostersSeparated: false,
      orbitReached: false,
    };
    if (this.rocketGroup) {
      this.rocketGroup.position.set(0, 4.5, 0);
      this.rocketGroup.rotation.set(0, 0, 0);
      if (this.exhaustPlume) this.exhaustPlume.material.opacity = 0;
      if (this.srbLeft) this.srbLeft.position.set(-4.2, 0, 0);
      if (this.srbRight) this.srbRight.position.set(4.2, 0, 0);
    }
    if (this.elevatorMesh) {
      this.elevatorMesh.position.set(-11, 6.5, 4.2);
    }
    const modal = this.container.querySelector('#earth-orbit-destination-modal');
    if (modal) modal.style.display = 'none';
    const atmoHud = this.container.querySelector('#earth-atmo-layers-hud');
    if (atmoHud) atmoHud.style.display = 'none';

    this._updateProcedureUI();
    this.toast('🚀 <b>Welcome to Kennedy Spaceport Base!</b> Check telemetry at the console.', 6000);
    sound.speak('Welcome to Earth Base. Begin pre-launch procedure at the terminal.');

    this._renderLoop();
  }

  stop() {
    this.isActive = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.container) this.container.style.display = 'none';
    this.onExit();
  }
}
