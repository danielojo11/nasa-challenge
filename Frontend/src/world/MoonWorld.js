import * as THREE from 'three';
import { sound } from '../game/SoundEffects.js';

/**
 * ARES-1 Junior Astronaut Moon Base: Lunar Surface & Artemis Outpost
 * 
 * Features:
 * - Lunar crater landscape with Apollo/Artemis base, American/NASA flag, lunar rover, habitat dome
 * - Earth glowing in the pitch black star-filled sky
 * - Lunar gravity: g = 1.62 m/s² (0.166g) -> Super high, floaty astronaut moon-walk hops!
 * - Vacuum physics: Atm pressure 0.0 kPa
 * - Solid collision physics with obstacles
 */
export class MoonWorld {
  constructor(onExit, onLandOnEarth, onLandOnMars) {
    this.onExit = onExit || (() => { });
    this.onLandOnEarth = onLandOnEarth || (() => { });
    this.onLandOnMars = onLandOnMars || (() => { });
    this.container = null;
    this.canvas = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animId = null;
    this.isActive = false;

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

    // Flight & Landing State
    this.isLanding = false;
    this.isAscending = false;
    this.landerY = 0;
    this.landerVy = 0;
    this.returnLander = null;
    this.flameMesh = null;

    // Moon Physics: 1.62 m/s² (scaled to game units: 3.2 m/s²)
    this.physics = {
      gravity: 3.2,
      jumpForce: 6.8, // Extremely floaty moon jumps!
      moonGravityReal: 1.62,
      atmPressureKPa: 0.0,
      speedKmH: 0,
      altitudeM: 0,
    };

    // Obstacles for collision detection
    this.colliders = [];

    this._boundResize = this._onResize.bind(this);
  }

  init() {
    if (this.container) return;
    this._buildDOM();
    this._initScene();
    this._createEnvironment();
    this._createLunarBase();
    this._createPlayer();
    this._bindEvents();
  }

  _buildDOM() {
    this.container = document.createElement('div');
    this.container.id = 'moon-world-container';
    this.container.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 1200;
      background: #000000;
      display: none;
      font-family: 'Space Grotesk', system-ui, sans-serif;
      overflow: hidden;
      user-select: none;
    `;

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'moon-world-canvas';
    this.canvas.style.cssText = 'width: 100%; height: 100%; display: block;';
    this.container.appendChild(this.canvas);

    const ui = document.createElement('div');
    ui.id = 'moon-world-ui';
    ui.style.cssText = 'position: absolute; inset: 0; pointer-events: none;';
    ui.innerHTML = `
      <!-- Top Navigation -->
      <div style="position: absolute; top: 16px; left: 20px; right: 20px; display: flex; justify-content: space-between; align-items: flex-start; pointer-events: auto;">
        <div style="background: rgba(10, 15, 25, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(226, 232, 240, 0.35); border-radius: 12px; padding: 10px 18px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">🌕</span>
            <div>
              <div style="font-size: 11px; letter-spacing: 2px; color: #cbd5e1; font-weight: 700;">NASA ARTEMIS BASE CAMP</div>
              <div style="font-size: 16px; font-weight: 800; color: #f8fafc; letter-spacing: 1px;">LUNAR SOUTH POLE // SHACKLETON CRATER</div>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 12px;">
          <button id="moon-exit-orbit-btn" style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(148, 163, 184, 0.3); color: #cbd5e1; padding: 8px 16px; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
            <span>🌌</span> Return to Orbit
          </button>
        </div>
      </div>

      <!-- Physics Telemetry (Top Left) -->
      <div style="position: absolute; top: 85px; left: 20px; width: 280px; background: rgba(8, 12, 20, 0.9); backdrop-filter: blur(10px); border: 1px solid rgba(203, 213, 225, 0.3); border-left: 4px solid #cbd5e1; border-radius: 10px; padding: 12px 14px; pointer-events: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid rgba(203, 213, 225, 0.2); padding-bottom: 4px;">
          <span style="font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: #cbd5e1;">LUNAR PHYSICS TELEMETRY</span>
          <span style="font-size: 10px; color: #94a3b8;">MOON 0.166G</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
          <div>
            <div style="color: #64748b; font-size: 9px;">SURFACE GRAVITY</div>
            <div style="color: #cbd5e1; font-weight: 700; font-size: 13px;">0.17 G <span style="font-size: 10px; color: #94a3b8;">(1.62 m/s²)</span></div>
          </div>
          <div>
            <div style="color: #64748b; font-size: 9px;">ATMOSPHERE</div>
            <div style="color: #f87171; font-weight: 700; font-size: 13px;">VACUUM <span style="font-size: 10px; color: #94a3b8;">(0.0 kPa)</span></div>
          </div>
          <div>
            <div style="color: #64748b; font-size: 9px;">VELOCITY</div>
            <div id="moon-phys-speed" style="color: #4ade80; font-weight: 700; font-size: 13px;">0 km/h</div>
          </div>
          <div>
            <div style="color: #64748b; font-size: 9px;">ELEVATION</div>
            <div id="moon-phys-alt" style="color: #facc15; font-weight: 700; font-size: 13px;">+1.2 m</div>
          </div>
        </div>
      </div>

      <!-- Bottom Controls Bar -->
      <div style="position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; background: rgba(10, 20, 35, 0.85); backdrop-filter: blur(10px); border: 1px solid rgba(148, 163, 184, 0.25); border-radius: 24px; padding: 6px 18px; font-size: 12px; color: #94a3b8; pointer-events: auto;">
        <span><b>WASD / Arrows</b> Moon Walk</span>
        <span style="opacity: 0.4;">•</span>
        <span><b>Mouse Drag</b> Free Look</span>
        <span style="opacity: 0.4;">•</span>
        <span><b>Space</b> High Lunar Jump (Low Gravity!)</span>
        <span style="opacity: 0.4;">•</span>
        <span><b>Shift</b> Moon Hop Run</span>
      </div>

      <!-- Toast Notification -->
      <div id="moon-toast" style="position: absolute; top: 24px; left: 50%; transform: translateX(-50%); background: rgba(15, 23, 42, 0.95); border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px 24px; color: #f8fafc; font-size: 14px; font-weight: 600; text-align: center; opacity: 0; transition: opacity 0.3s; pointer-events: none; max-width: 500px; box-shadow: 0 10px 30px rgba(0,0,0,0.7); z-index: 100;"></div>

      <!-- Interactive Boarding Prompt -->
      <div id="moon-board-prompt" style="position: absolute; bottom: 70px; left: 50%; transform: translateX(-50%); background: rgba(14, 116, 144, 0.9); border: 2px solid #38bdf8; border-radius: 30px; padding: 12px 28px; color: #ffffff; font-size: 15px; font-weight: 800; letter-spacing: 1.5px; box-shadow: 0 0 25px rgba(56, 189, 248, 0.6); display: none; cursor: pointer; pointer-events: auto; z-index: 120;">
        🚀 PRESS [E] TO BOARD RETURN SPACECRAFT
      </div>

      <!-- Lunar Atmospheric / Exospheric Layers HUD (Visible during ascent) -->
      <div id="moon-atmo-layers-hud" style="position: absolute; right: 24px; top: 50%; transform: translateY(-50%); width: 250px; background: rgba(6, 11, 25, 0.92); border: 1.5px solid rgba(56, 189, 248, 0.4); border-radius: 14px; padding: 16px; display: none; pointer-events: none; z-index: 150;">
        <div style="font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: #38bdf8; border-bottom: 1px solid rgba(56, 189, 248, 0.3); padding-bottom: 6px; margin-bottom: 10px;">LUNAR ASCENT TELEMETRY</div>
        <div id="moon-atmo-gauge" style="display: flex; flex-direction: column; gap: 8px;">
          <div class="atmo-step" id="m-layer-cislunar" style="padding: 6px 8px; border-radius: 6px; background: rgba(255,255,255,0.05); font-size: 11px; color: #94a3b8;">
            <span style="font-weight: 700; color: #ffffff;">CISLUNAR SPACE</span><br><span style="font-size: 9px;">100+ km • Deep Space Vacuum</span>
          </div>
          <div class="atmo-step" id="m-layer-exosphere" style="padding: 6px 8px; border-radius: 6px; background: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; font-size: 11px; color: #38bdf8;">
            <span style="font-weight: 700; color: #ffffff;">LUNAR SURFACE EXOSPHERE</span><br><span style="font-size: 9px;">0 - 100 km • 10⁻¹⁰ Pa Pressure</span>
          </div>
        </div>
        <div style="margin-top: 12px; font-size: 12px; font-weight: 700; color: #facc15;" id="moon-ascent-alt">ALTITUDE: 0 m</div>
      </div>

      <!-- Lunar Orbit Destination Choice Modal -->
      <div id="moon-destination-modal" style="position: absolute; inset: 0; background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(14px); display: none; align-items: center; justify-content: center; z-index: 200; pointer-events: auto;">
        <div style="max-width: 520px; width: 90%; background: #0b1329; border: 1.5px solid rgba(56, 189, 248, 0.5); border-radius: 20px; padding: 28px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
          <div style="font-size: 40px; margin-bottom: 8px;">🚀</div>
          <h2 style="font-size: 22px; font-weight: 800; color: #f8fafc; margin: 0 0 8px;">LUNAR ESCAPE VELOCITY ACHIEVED!</h2>
          <p style="font-size: 14px; color: #94a3b8; line-height: 1.5; margin: 0 0 20px;">
            The ARES Lunar Lander has reached lunar orbit. Select your destination trajectory:
          </p>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <button id="moon-btn-to-earth" style="padding: 14px 20px; background: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; border-radius: 12px; color: #ffffff; font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
              <span>🌍 RETURN TO EARTH (Kennedy Spaceport)</span>
              <span style="font-size: 12px; color: #38bdf8;">1.0G Earth Base ➔</span>
            </button>
            <button id="moon-btn-to-mars" style="padding: 14px 20px; background: rgba(249, 115, 22, 0.2); border: 1px solid #f97316; border-radius: 12px; color: #ffffff; font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
              <span>🔴 TRANS-MARS INJECTION (Jezero Colony)</span>
              <span style="font-size: 12px; color: #f97316;">0.38G Mars Colony ➔</span>
            </button>
            <button id="moon-btn-to-orbit" style="padding: 10px 16px; background: rgba(148, 163, 184, 0.15); border: 1px solid rgba(148, 163, 184, 0.3); border-radius: 10px; color: #cbd5e1; font-size: 13px; font-weight: 600; cursor: pointer;">
              🌌 Return to Solar System Orrery View
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(ui);
    document.body.appendChild(this.container);
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000); // Black space

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 1000);
    this.camera.position.set(0, 8, 25);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // High-contrast direct solar lighting with deep shadows (authentic lunar lighting!)
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(100, 70, -80);
    sunLight.castShadow = true;
    this.scene.add(sunLight);

    // Subtle Earthshine ambient light
    const earthshine = new THREE.AmbientLight(0x1a2e4a, 0.45);
    this.scene.add(earthshine);

    // Dense starfield
    const starGeo = new THREE.BufferGeometry();
    const starPos = [];
    for (let i = 0; i < 3000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.95);
      const r = 450;
      starPos.push(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    this.scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.5 })));

    // Earth hanging in the black lunar sky!
    const earthGeo = new THREE.SphereGeometry(18, 32, 32);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      emissive: 0x0f2d59,
      roughness: 0.5,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.set(-140, 110, -220);
    this.scene.add(earthMesh);
  }

  _terrainHeight(x, z) {
    // Lunar rolling regolith terrain with craters
    let y = Math.sin(x * 0.03) * Math.cos(z * 0.03) * 3.5 + Math.sin(x * 0.07 + z * 0.05) * 1.2;
    // Main base crater
    const d = Math.hypot(x, z);
    if (d < 35) {
      y *= (d / 35); // smooth flat base area
    }
    return y;
  }

  _createEnvironment() {
    const geo = new THREE.PlaneGeometry(500, 500, 80, 80);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, this._terrainHeight(x, z));
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x8a929a, // Grey lunar regolith
      roughness: 0.95,
      metalness: 0.05,
    });
    const terrain = new THREE.Mesh(geo, mat);
    this.scene.add(terrain);
  }

  _createLunarBase() {
    const baseGroup = new THREE.Group();

    // 1. Lunar Habitat Dome
    const domeMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3, metalness: 0.4 });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(7, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
    dome.position.set(0, 0, -18);
    baseGroup.add(dome);
    this.colliders.push({ type: 'cylinder', x: 0, z: -18, r: 7.5 });

    // Air lock
    const airlock = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 4, 12), domeMat);
    airlock.rotation.x = Math.PI / 2;
    airlock.position.set(0, 1.4, -10.5);
    baseGroup.add(airlock);

    // 2. American / NASA Lunar Flag
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 3.2, 8),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 })
    );
    pole.position.set(6, 1.6, 6);
    const flagMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.6 })
    );
    flagMesh.position.set(6.8, 2.7, 6);
    baseGroup.add(pole, flagMesh);
    this.colliders.push({ type: 'cylinder', x: 6, z: 6, r: 0.8 });

    // 3. Lunar Roving Vehicle (LRV)
    const roverBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.8, 3.6),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5 })
    );
    roverBody.position.set(-12, 0.8, 4);
    baseGroup.add(roverBody);
    this.colliders.push({ type: 'box', minX: -14, maxX: -10, minZ: 2, maxZ: 6 });

    // 4. Apollo Lunar Lander Descent Stage (Gold foil)
    const landerStage = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 4.2, 3.2, 8),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.3 }) // Gold kapton foil
    );
    landerStage.position.set(18, 1.6, -8);
    baseGroup.add(landerStage);
    this.colliders.push({ type: 'cylinder', x: 18, z: -8, r: 4.8 });

    this.scene.add(baseGroup);

    // 5. Active Modern ARES Lunar Return Lander & Pad
    this._createReturnLander();
  }

  _createReturnLander() {
    this.returnLander = new THREE.Group();
    this.returnLander.position.set(0, 0, 22);

    // Concrete Pad
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(8.5, 9.0, 0.4, 24),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    pad.position.set(0, 0.2, 0);
    this.returnLander.add(pad);

    // Hazard ring
    const hazardRing = new THREE.Mesh(
      new THREE.RingGeometry(6.6, 7.6, 32),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
    );
    hazardRing.rotation.x = -Math.PI / 2;
    hazardRing.position.set(0, 0.42, 0);
    this.returnLander.add(hazardRing);

    // Spaceship assembly
    this.landerShip = new THREE.Group();
    this.landerShip.position.set(0, 0, 0);
    this.returnLander.add(this.landerShip);

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.6, roughness: 0.3 });
    const core = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 12, 16), bodyMat);
    core.position.set(0, 7.5, 0);
    this.landerShip.add(core);

    const stripe = new THREE.Mesh(
      new THREE.CylinderGeometry(2.42, 2.45, 1.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 })
    );
    stripe.position.set(0, 9.5, 0);
    this.landerShip.add(stripe);

    const nose = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 2.4, 3.6, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 })
    );
    nose.position.set(0, 15.3, 0);
    this.landerShip.add(nose);

    const hatchWindow = new THREE.Mesh(
      new THREE.CircleGeometry(0.45, 16),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.8 })
    );
    hatchWindow.position.set(0, 14.5, 1.55);
    this.landerShip.add(hatchWindow);

    // 4 Landing gear legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const leg = new THREE.Group();
      leg.rotation.y = angle;

      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 5.5, 8), legMat);
      strut.position.set(0, 2.8, 3.0);
      strut.rotation.x = -Math.PI / 4.5;
      leg.add(strut);

      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.2, 12), legMat);
      foot.position.set(0, 0.5, 4.8);
      leg.add(foot);

      this.landerShip.add(leg);
    }

    // Engine bell
    const engineBell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 1.6, 1.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.1 })
    );
    engineBell.position.set(0, 1.0, 0);
    this.landerShip.add(engineBell);

    // Retrorocket flame
    const flameGeo = new THREE.ConeGeometry(1.4, 5.0, 16);
    flameGeo.rotateX(Math.PI);
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xff6600,
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0.85
    });
    this.flameMesh = new THREE.Mesh(flameGeo, flameMat);
    this.flameMesh.position.set(0, -1.8, 0);
    this.flameMesh.visible = false;
    this.landerShip.add(this.flameMesh);

    this.colliders.push({ type: 'cylinder', x: 0, z: 22, r: 3.8 });
    this.scene.add(this.returnLander);
  }

  _createPlayer() {
    const player = new THREE.Group();
    player.position.set(0, 0, 0);

    const suitMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
    const visorMat = new THREE.MeshLambertMaterial({ color: 0xffb703, emissive: 0x664400 }); // Gold reflective visor
    const bootMat = new THREE.MeshLambertMaterial({ color: 0x334155 });

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

      if (k === ' ' && this.isGrounded) {
        this.vy = this.physics.jumpForce;
        this.isGrounded = false;
        sound.playTone(480, 0.12, 'sine', 0.08);
      }
      if (k === 'e') {
        const dist = Math.hypot(this.playerGroup.position.x - 0, this.playerGroup.position.z - 22);
        if (dist < 8.0 && !this.isLanding && !this.isAscending) {
          this._boardAndLaunch();
        }
      }
      if (k === 'escape') this.stop();
    });

    window.addEventListener('keyup', (e) => {
      if (!this.isActive) return;
      this.keys[e.key.toLowerCase()] = false;
    });

    // Board prompt click
    const promptBtn = this.container.querySelector('#moon-board-prompt');
    if (promptBtn) {
      promptBtn.addEventListener('click', () => {
        this._boardAndLaunch();
      });
    }

    // Destination modal buttons
    const btnToEarth = this.container.querySelector('#moon-btn-to-earth');
    if (btnToEarth) {
      btnToEarth.addEventListener('click', () => {
        this.container.querySelector('#moon-destination-modal').style.display = 'none';
        this.stop();
        this.onLandOnEarth();
      });
    }

    const btnToMars = this.container.querySelector('#moon-btn-to-mars');
    if (btnToMars) {
      btnToMars.addEventListener('click', () => {
        this.container.querySelector('#moon-destination-modal').style.display = 'none';
        this.stop();
        this.onLandOnMars();
      });
    }

    const btnToOrbit = this.container.querySelector('#moon-btn-to-orbit');
    if (btnToOrbit) {
      btnToOrbit.addEventListener('click', () => {
        this.container.querySelector('#moon-destination-modal').style.display = 'none';
        this.stop();
      });
    }

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

    const exitBtn = this.container.querySelector('#moon-exit-orbit-btn');
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

  _tick(dt) {
    this.elapsedTime += dt;

    const moveForward = (this.keys['w'] || this.keys['arrowup'] ? 1 : 0) - (this.keys['s'] || this.keys['arrowdown'] ? 1 : 0) - this.joy.y;
    const moveRight = (this.keys['d'] || this.keys['arrowright'] ? 1 : 0) - (this.keys['a'] || this.keys['arrowleft'] ? 1 : 0) + this.joy.x;
    const isMoving = Math.abs(moveForward) > 0.05 || Math.abs(moveRight) > 0.05;
    const isRunning = this.keys['shift'] && isMoving;
    const speed = isRunning ? 7.5 : 4.5;

    if (Math.abs(moveRight) > 0.05) {
      const steerRate = Math.abs(moveForward) > 0.05 ? 2.4 : 3.0;
      this.targetFacingYaw += moveRight * steerRate * dt;
    }

    let targetTilt = 0;
    if (isMoving && Math.abs(moveRight) > 0.05) {
      targetTilt = -Math.sign(moveRight) * (isRunning ? 0.12 : 0.08);
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

      const rawX = THREE.MathUtils.clamp(this.playerGroup.position.x + dx * speed * dt, -200, 200);
      const rawZ = THREE.MathUtils.clamp(this.playerGroup.position.z + dz * speed * dt, -200, 200);

      // Solid collision resolution
      const [colX, colZ] = this._resolveCollision(rawX, rawZ, 0.45);
      this.playerGroup.position.x = colX;
      this.playerGroup.position.z = colZ;

      // Floatier walking leg swings on the Moon
      this.walkCycle += dt * (isRunning ? 12 : 8);
      const legSwing = Math.sin(this.walkCycle) * 0.6;
      const armSwing = Math.sin(this.walkCycle) * 0.5;

      if (this.playerModel) {
        this.playerModel.leftLeg.rotation.x = legSwing;
        this.playerModel.rightLeg.rotation.x = -legSwing;
        this.playerModel.leftArm.rotation.x = -armSwing;
        this.playerModel.rightArm.rotation.x = armSwing;
        this.playerModel.bodyGroup.position.y = Math.abs(Math.sin(this.walkCycle)) * 0.12; // Extra moon-walk bounce!
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
        this.playerModel.bodyGroup.position.y = 0;
        this.playerModel.bodyGroup.rotation.z = THREE.MathUtils.lerp(
          this.playerModel.bodyGroup.rotation.z,
          0,
          dt * 9.0
        );
      }
      this.physics.speedKmH = 0;
    }

    // Lunar Low Gravity: 3.2 game units (0.166g)
    const groundY = this._terrainHeight(this.playerGroup.position.x, this.playerGroup.position.z);
    this.vy -= this.physics.gravity * dt;
    this.playerGroup.position.y += this.vy * dt;
    if (this.playerGroup.position.y <= groundY) {
      this.playerGroup.position.y = groundY;
      this.vy = 0;
      this.isGrounded = true;
    }

    this.playerGroup.rotation.y = this._lerpAngle(this.playerGroup.rotation.y, this.targetFacingYaw, dt * 14);

    const speedEl = this.container.querySelector('#moon-phys-speed');
    const altEl = this.container.querySelector('#moon-phys-alt');
    if (speedEl) speedEl.textContent = `${this.physics.speedKmH} km/h`;
    if (altEl) altEl.textContent = `${Math.round(this.playerGroup.position.y * 10) / 10} m`;

    // Proximity check for boarding the return lander at (0, 0, 22)
    const distToLander = Math.hypot(this.playerGroup.position.x - 0, this.playerGroup.position.z - 22);
    const promptEl = this.container.querySelector('#moon-board-prompt');
    if (promptEl) {
      promptEl.style.display = (distToLander < 8.0 && this.isGrounded && !this.isLanding && !this.isAscending) ? 'block' : 'none';
    }
  }

  _boardAndLaunch() {
    if (this.isAscending || this.isLanding) return;
    this.isAscending = true;
    this.landerVy = 3.0;
    this.playerGroup.visible = false;

    const promptEl = this.container.querySelector('#moon-board-prompt');
    if (promptEl) promptEl.style.display = 'none';

    const atmoHud = this.container.querySelector('#moon-atmo-layers-hud');
    if (atmoHud) atmoHud.style.display = 'block';

    if (this.flameMesh) this.flameMesh.visible = true;

    sound.playLaser();
    sound.speak('Ascent rocket ignited. Ascending through lunar exosphere.');
    this.toast('🚀 <b>ARES Ascent Initiated!</b> Escaping lunar vacuum exosphere...', 4000);
  }

  _renderLoop() {
    if (!this.isActive) return;
    this.animId = requestAnimationFrame(() => this._renderLoop());

    const dt = Math.min(this.clock.getDelta(), 0.05);

    // 1. Powered Landing Descent sequence
    if (this.isLanding && this.landerShip) {
      this.landerShip.position.y -= 13 * dt;
      if (this.flameMesh) {
        this.flameMesh.scale.set(
          1.0 + Math.sin(Date.now() * 0.02) * 0.25,
          1.0 + Math.cos(Date.now() * 0.02) * 0.3,
          1.0 + Math.sin(Date.now() * 0.02) * 0.25
        );
      }

      const shipWorldY = this.landerShip.position.y;
      this.camera.position.set(22, shipWorldY + 12, 48);
      this.camera.lookAt(0, shipWorldY + 6, 22);

      if (this.landerShip.position.y <= 0) {
        this.landerShip.position.y = 0;
        this.isLanding = false;
        if (this.flameMesh) this.flameMesh.visible = false;
        this.playerGroup.position.set(0, 0, 14);
        this.playerGroup.visible = true;
        sound.playVictory();
        this.toast('🌕 <b>Touchdown Confirmed!</b> Artemis Base Camp Shackleton Crater.', 6000);
      }
      this.renderer.render(this.scene, this.camera);
      return;
    }

    // 2. Ascent Launch sequence
    if (this.isAscending && this.landerShip) {
      this.landerVy += 15 * dt;
      this.landerShip.position.y += this.landerVy * dt;
      if (this.flameMesh) {
        this.flameMesh.scale.set(
          1.0 + Math.sin(Date.now() * 0.03) * 0.3,
          1.2 + Math.cos(Date.now() * 0.03) * 0.4,
          1.0 + Math.sin(Date.now() * 0.03) * 0.3
        );
      }

      const altM = Math.round(this.landerShip.position.y * 12);
      const altText = this.container.querySelector('#moon-ascent-alt');
      if (altText) altText.textContent = `ALTITUDE: ${altM} m`;

      const layerExo = this.container.querySelector('#m-layer-exosphere');
      const layerCis = this.container.querySelector('#m-layer-cislunar');
      if (altM > 900) {
        if (layerExo) {
          layerExo.style.background = 'rgba(255,255,255,0.05)';
          layerExo.style.border = 'none';
        }
        if (layerCis) {
          layerCis.style.background = 'rgba(56, 189, 248, 0.25)';
          layerCis.style.border = '1px solid #38bdf8';
        }
      }

      const shipWorldY = this.landerShip.position.y;
      this.camera.position.set(24, Math.max(12, shipWorldY * 0.6 + 10), 50);
      this.camera.lookAt(0, shipWorldY + 8, 22);

      if (this.landerShip.position.y > 180) {
        this.isAscending = false;
        if (this.flameMesh) this.flameMesh.visible = false;
        const modal = this.container.querySelector('#moon-destination-modal');
        if (modal) modal.style.display = 'flex';
        sound.playVictory();
        sound.speak('Lunar escape velocity achieved. Select destination.');
      }

      this.renderer.render(this.scene, this.camera);
      return;
    }

    // 3. Normal surface player exploration
    this._tick(dt);

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

    this.renderer.render(this.scene, this.camera);
  }

  _lerpAngle(current, target, alpha) {
    let diff = target - current;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    return current + diff * Math.min(1, alpha);
  }

  toast(html, duration = 4000) {
    const el = this.container.querySelector('#moon-toast');
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

  start(doDescent = true) {
    this.init();
    this.isActive = true;
    this.container.style.display = 'block';
    this.clock.start();

    // Reset modals and state
    const destModal = this.container.querySelector('#moon-destination-modal');
    if (destModal) destModal.style.display = 'none';
    const atmoHud = this.container.querySelector('#moon-atmo-layers-hud');
    if (atmoHud) atmoHud.style.display = 'none';

    this.isAscending = false;
    this.landerVy = 0;

    if (doDescent && this.landerShip) {
      this.isLanding = true;
      this.landerShip.position.set(0, 55, 0);
      if (this.flameMesh) this.flameMesh.visible = true;
      this.playerGroup.visible = false;
      sound.playLaser();
      sound.speak('De-orbit retro burn engaged. Initiating lunar powered descent.');
      this.toast('🌕 <b>Powered Descent Initiated!</b> Retrorockets firing onto Shackleton Crater pad...', 5000);
    } else {
      this.isLanding = false;
      if (this.landerShip) this.landerShip.position.set(0, 0, 0);
      if (this.flameMesh) this.flameMesh.visible = false;
      this.playerGroup.position.set(0, 0, 14);
      this.playerGroup.visible = true;
      this.vy = 0;
      this.toast('🌕 <b>Touchdown at Artemis Moon Base!</b> Low gravity: 0.166G (1.62 m/s²)', 6000);
      sound.speak('Welcome to Artemis Base Camp on the Moon.');
    }

    this._renderLoop();
  }

  stop() {
    this.isActive = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.container) this.container.style.display = 'none';
    this.onExit();
  }
}

