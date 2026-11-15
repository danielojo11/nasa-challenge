import * as THREE from 'three';
import { sound } from '../game/SoundEffects.js';
import { NasaApiService } from '../services/NasaApiService.js';

export class MarsWorld {
  constructor(onExit, onLandOnEarth, onLandOnMoon) {
    this.onExit = onExit || (() => {});
    this.onLandOnEarth = onLandOnEarth || (() => {});
    this.onLandOnMoon = onLandOnMoon || (() => {});
    this.container = null;
    this.canvas = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animId = null;
    this.isActive = false;

    // Flight & landing state
    this.isLanding = false;
    this.isAscending = false;
    this.returnLander = null;
    this.landerShip = null;
    this.flameMesh = null;
    this.landerVy = 0;

    // Movement & state
    this.clock = new THREE.Clock();
    this.keys = {};
    this.joy = { x: 0, y: 0 };
    this.pointerTargets = {};
    this.targetFacingYaw = 0;
    this.currentCameraYaw = Math.PI;
    this.pitch = 0.45;
    this.camDist = 7.0;
    this.smoothLookTarget = new THREE.Vector3(0, 1.6, 9);
    this.vy = 0;
    this.isGrounded = true;
    this.isGameStarted = false;
    this.face = [0, 1];
    this.hasWon = false;
    this.toastTimer = null;
    this.hudTimer = 0;
    this.playerModel = null;
    this.walkCycle = 0;
    this.elapsedTime = 0;

    // Game stats
    this.stats = {
      air: 100,
      hp: 100,
      food: 100,
      pw: 35,
      bo: 60,
      bf: 40,
      m: 6,
      i: 2,
      sol: 1,
      dt: 0.25,
    };

    this.storm = {
      phase: 'none', // 'none' | 'warn' | 'act'
      timer: 25,
      event: null,
    };

    // Buildings & inventory
    this.buildings = [];
    this.buildingCounts = { solar: 0, moxie: 0, farm: 0, shelter: 0 };
    this.buildingDefs = {
      solar: {
        name: '☀️ Solar Panel',
        cost: { m: 2 },
        tip: 'Generates power during daytime. Essential for MOXIE and Greenhouse.',
      },
      moxie: {
        name: '🧪 MOXIE',
        cost: { m: 3, i: 1 },
        tip: 'Perseverance technology! Uses power to split CO₂ into breathable base oxygen.',
      },
      farm: {
        name: '🌱 Greenhouse',
        cost: { m: 2, i: 2 },
        tip: 'CSA & NASA hydroponics! Uses power and water ice to grow fresh microgreens.',
      },
      shelter: {
        name: '🏠 Habitat Shelter',
        cost: { m: 5 },
        tip: 'Thick hydrogen shielding protects you during solar flares and refills air/food.',
      },
    };

    // DONKI solar flare archive events
    this.flareEvents = [
      ['X9.3 Superflare', 'Sep 2017 Archive', 5],
      ['X8.2 Extreme Flare', 'Sep 2017 Archive', 5],
      ['X5.8 Solar Storm', 'May 2024 Archive', 4],
      ['X8.7 Record Flare', 'May 2024 Archive', 5],
      ['X9.0 Major Flare', 'Oct 2024 Archive', 6],
    ];

    // NASA Landmarks
    this.landmarkDefs = [
      [
        'Jezero River Delta',
        60,
        -80,
        'Jezero Crater held a deep lake billions of years ago. NASA Perseverance explores ancient river clay deposits here.',
      ],
      [
        'Curiosity RAD Station',
        -110,
        40,
        'Curiosity rover radiation sensors recorded 0.6–0.7 mSv per day on Mars, about 50 times higher than Earth.',
      ],
      [
        'Subsurface Water Ice Deposit',
        140,
        110,
        'NASA satellite radars discovered massive underground pure water-ice sheets under the Martian regolith.',
      ],
      [
        'Global Dust Storm Observation',
        -60,
        -150,
        'Massive Martian dust storms can shroud the entire planet, cutting solar sunlight by more than half.',
      ],
    ];

    this.nodes = [];
    this.landmarks = [];
    this.craters = [];
    this.playerGroup = null;
    this.sunLight = null;
    this.hemiLight = null;
    this.starPoints = null;
    this.dayColor = new THREE.Color(0xe3a27c);
    this.nightColor = new THREE.Color(0x0c0814);

    this._boundResize = this._onResize.bind(this);
  }

  _clamp(v, min = 0, max = 100) {
    return Math.max(min, Math.min(max, v));
  }

  _lerpAngle(current, target, alpha) {
    let diff = target - current;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    return current + diff * Math.min(1, alpha);
  }

  _terrainHeight(x, z) {
    let y =
      Math.sin(x * 0.02) * Math.cos(z * 0.017) * 6 +
      Math.sin(x * 0.05 + z * 0.03) * 2.2 +
      Math.sin(z * 0.11) * Math.cos(x * 0.09) * 0.7;

    for (const c of this.craters) {
      const d = Math.hypot(x - c.x, z - c.z) / c.r;
      y -= c.d * Math.exp(-d * d * 2.2);
      y += c.d * 0.35 * Math.exp(-(d - 1.05) * (d - 1.05) * 14);
    }
    return y * this._clamp((Math.hypot(x, z) - 18) / 25, 0, 1);
  }

  init() {
    if (this.container) return;

    // Create container
    this.container = document.createElement('div');
    this.container.id = 'mars-world-overlay';
    this.container.innerHTML = `
      <div id="mars-canvas-host"></div>
      <div id="mars-storm-tint"></div>

      <!-- TOP BAR / HEADER -->
      <div class="mars-world-topbar">
        <div class="mars-world-brand">
          <span class="mars-brand-badge">JEZERO CRATER // SURFACE BASE</span>
          <span class="mars-brand-title">ARES-1 Mars Outpost</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="mars-trigger-flare-btn" class="mars-orbit-btn" style="background: rgba(220, 38, 38, 0.25); border-color: #ef4444; color: #fca5a5;" title="Trigger NASA DONKI Solar Flare Drill">
            ⚠️ TEST DONKI SOLAR FLARE DRILL
          </button>
          <button id="mars-exit-orbit-btn" class="mars-orbit-btn" title="Return to Orbit">
            🛰️ RETURN TO ORBIT
          </button>
        </div>
      </div>

      <!-- HUD STATS (LEFT) -->
      <div class="mars-hud-panel" id="mars-hud-panel">
        <div class="mars-hud-title">VITAL TELEMETRY</div>
        <div class="mars-bar-row">
          <span>Suit Air</span>
          <div class="mars-bar-track"><div id="m-bar-air" class="mars-bar-fill air"></div></div>
        </div>
        <div class="mars-bar-row">
          <span>Health</span>
          <div class="mars-bar-track"><div id="m-bar-hp" class="mars-bar-fill hp"></div></div>
        </div>
        <div class="mars-bar-row">
          <span>Food</span>
          <div class="mars-bar-track"><div id="m-bar-food" class="mars-bar-fill food"></div></div>
        </div>
        <div class="mars-hud-divider"></div>
        <div class="mars-bar-row">
          <span>Base Pwr</span>
          <div class="mars-bar-track"><div id="m-bar-pw" class="mars-bar-fill pwr"></div></div>
        </div>
        <div class="mars-bar-row">
          <span>Base Air</span>
          <div class="mars-bar-track"><div id="m-bar-bo" class="mars-bar-fill air"></div></div>
        </div>
        <div class="mars-bar-row">
          <span>Base Food</span>
          <div class="mars-bar-track"><div id="m-bar-bf" class="mars-bar-fill food"></div></div>
        </div>
        <div id="mars-inv-row" class="mars-inv-row">⛏️ 6 Metal • ❄️ 2 Ice</div>
      </div>

      <!-- PHYSICS TELEMETRY (LEFT) -->
      <div style="position: absolute; top: 350px; left: 20px; width: 220px; background: rgba(15, 23, 42, 0.88); backdrop-filter: blur(10px); border: 1px solid rgba(249, 115, 22, 0.35); border-left: 4px solid #f97316; border-radius: 10px; padding: 10px 12px; font-size: 11px; z-index: 10; pointer-events: auto;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(249, 115, 22, 0.2); padding-bottom: 4px; margin-bottom: 6px;">
          <span style="font-weight: 800; font-size: 9px; letter-spacing: 1.5px; color: #f97316;">PHYSICS ENGINE</span>
          <span style="font-size: 9px; color: #94a3b8;">MARS 0.38G</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
          <div>
            <div style="color: #64748b; font-size: 8px;">GRAVITY</div>
            <div style="color: #f97316; font-weight: 700; font-size: 12px;">0.38 G <span style="font-size: 9px; color: #94a3b8;">(3.72 m/s²)</span></div>
          </div>
          <div>
            <div style="color: #64748b; font-size: 8px;">ATM PRESSURE</div>
            <div style="color: #e2e8f0; font-weight: 700; font-size: 12px;">0.64 kPa</div>
          </div>
          <div>
            <div style="color: #64748b; font-size: 8px;">SPEED</div>
            <div id="mars-phys-speed" style="color: #4ade80; font-weight: 700; font-size: 12px;">0 km/h</div>
          </div>
          <div>
            <div style="color: #64748b; font-size: 8px;">DATUM ELEV</div>
            <div id="mars-phys-alt" style="color: #facc15; font-weight: 700; font-size: 12px;">-2.5 km</div>
          </div>
        </div>
      </div>

      <!-- OBJECTIVES (RIGHT) -->
      <div class="mars-obj-panel" id="mars-obj-panel">
        <div class="mars-obj-header">COLONY DIRECTIVES</div>
        <div id="mars-obj-list" class="mars-obj-list"></div>
        <div id="mars-landmarks-count" class="mars-landmarks-count">🔭 NASA Sites: 0/4</div>
      </div>

      <!-- TOAST POPUP (TOP CENTER) -->
      <div id="mars-toast" class="mars-toast"></div>

      <!-- ACTION & BUILD BAR (BOTTOM CENTER) -->
      <div class="mars-build-bar" id="mars-build-bar">
        <button class="mars-build-btn" data-build="solar">
          <span class="btn-key">1</span>
          <span class="btn-name">☀️ Solar</span>
          <span class="btn-cost">2 ⛏️</span>
        </button>
        <button class="mars-build-btn" data-build="moxie">
          <span class="btn-key">2</span>
          <span class="btn-name">🧪 MOXIE</span>
          <span class="btn-cost">3 ⛏️ 1 ❄️</span>
        </button>
        <button class="mars-build-btn" data-build="farm">
          <span class="btn-key">3</span>
          <span class="btn-name">🌱 Greenhse</span>
          <span class="btn-cost">2 ⛏️ 2 ❄️</span>
        </button>
        <button class="mars-build-btn" data-build="shelter">
          <span class="btn-key">4</span>
          <span class="btn-name">🏠 Shelter</span>
          <span class="btn-cost">5 ⛏️</span>
        </button>
      </div>

      <!-- MOBILE / TOUCH CONTROLS -->
      <div id="mars-touch-controls" class="mars-touch-controls">
        <button id="mars-touch-jump" class="mars-touch-btn" aria-label="Jump">⤒</button>
        <button id="mars-touch-action" class="mars-touch-btn" aria-label="Use or Mine">⛏️</button>
      </div>

      <!-- WELCOME / BRIEFING OVERLAY -->
      <div id="mars-briefing-modal" class="mars-briefing-modal">
        <div class="mars-briefing-content">
          <div class="briefing-badge">TOUCHDOWN CONFIRMED // JEZERO CRATER</div>
          <h2 class="briefing-title">Welcome to the Martian Surface!</h2>
          <p class="briefing-desc">
            You have safely landed at Mars Base Alpha. Explore the surrounding Jezero terrain, mine <b>Metal ⛏️</b> and <b>Ice ❄️</b>, and build real NASA life-support systems to survive solar storms.
          </p>
          <div class="briefing-controls-grid">
            <div class="ctrl-card"><span>Move</span><b>W A S D</b> or <b>Arrows</b></div>
            <div class="ctrl-card"><span>Look</span><b>Drag Mouse</b></div>
            <div class="ctrl-card"><span>Run</span><b>Shift</b></div>
            <div class="ctrl-card"><span>Jump</span><b>Space</b></div>
            <div class="ctrl-card"><span>Mine / Use</span><b>E</b></div>
            <div class="ctrl-card"><span>Build</span><b>Keys 1 – 4</b></div>
          </div>
          <button id="mars-start-mission-btn" class="mars-mission-start-btn">
            EXPLORE MARS SURFACE ➔
          </button>
        </div>
      </div>

      <!-- Interactive Boarding Prompt -->
      <div id="mars-board-prompt" style="position: absolute; bottom: 85px; left: 50%; transform: translateX(-50%); background: rgba(194, 65, 12, 0.95); border: 2px solid #f97316; border-radius: 30px; padding: 12px 28px; color: #ffffff; font-size: 15px; font-weight: 800; letter-spacing: 1.5px; box-shadow: 0 0 25px rgba(249, 115, 22, 0.7); display: none; cursor: pointer; pointer-events: auto; z-index: 120;">
        🚀 PRESS [E] TO BOARD RETURN SPACECRAFT
      </div>

      <!-- Mars Atmospheric Layers HUD (Visible during ascent) -->
      <div id="mars-atmo-layers-hud" style="position: absolute; right: 24px; top: 50%; transform: translateY(-50%); width: 260px; background: rgba(15, 23, 42, 0.94); border: 1.5px solid rgba(249, 115, 22, 0.5); border-radius: 14px; padding: 16px; display: none; pointer-events: none; z-index: 150;">
        <div style="font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: #f97316; border-bottom: 1px solid rgba(249, 115, 22, 0.3); padding-bottom: 6px; margin-bottom: 10px;">MARTIAN ATMOSPHERIC ASCENT</div>
        <div id="mars-atmo-gauge" style="display: flex; flex-direction: column; gap: 8px;">
          <div class="atmo-step" id="mars-layer-exo" style="padding: 6px 8px; border-radius: 6px; background: rgba(255,255,255,0.05); font-size: 11px; color: #94a3b8;">
            <span style="font-weight: 700; color: #ffffff;">EXOSPHERE</span><br><span style="font-size: 9px;">100+ km • Solar Wind Stripping</span>
          </div>
          <div class="atmo-step" id="mars-layer-upper" style="padding: 6px 8px; border-radius: 6px; background: rgba(255,255,255,0.05); font-size: 11px; color: #94a3b8;">
            <span style="font-weight: 700; color: #ffffff;">UPPER ATMOSPHERE</span><br><span style="font-size: 9px;">40 - 100 km • Photochemical CO2</span>
          </div>
          <div class="atmo-step" id="mars-layer-mid" style="padding: 6px 8px; border-radius: 6px; background: rgba(255,255,255,0.05); font-size: 11px; color: #94a3b8;">
            <span style="font-weight: 700; color: #ffffff;">MIDDLE ATMOSPHERE</span><br><span style="font-size: 9px;">10 - 40 km • Jet Streams & CO2 Ice</span>
          </div>
          <div class="atmo-step" id="mars-layer-lower" style="padding: 6px 8px; border-radius: 6px; background: rgba(249, 115, 22, 0.25); border: 1px solid #f97316; font-size: 11px; color: #f97316;">
            <span style="font-weight: 700; color: #ffffff;">LOWER ATMOSPHERE</span><br><span style="font-size: 9px;">0 - 10 km • Dust Devils & 0.64 kPa</span>
          </div>
        </div>
        <div style="margin-top: 12px; font-size: 12px; font-weight: 700; color: #facc15;" id="mars-ascent-alt">ALTITUDE: 0 m</div>
      </div>

      <!-- Mars Orbit Destination Choice Modal -->
      <div id="mars-destination-modal" style="position: absolute; inset: 0; background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(14px); display: none; align-items: center; justify-content: center; z-index: 200; pointer-events: auto;">
        <div style="max-width: 520px; width: 90%; background: #0b1329; border: 1.5px solid rgba(249, 115, 22, 0.5); border-radius: 20px; padding: 28px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
          <div style="font-size: 40px; margin-bottom: 8px;">🚀</div>
          <h2 style="font-size: 22px; font-weight: 800; color: #f8fafc; margin: 0 0 8px;">MARTIAN ESCAPE VELOCITY ACHIEVED!</h2>
          <p style="font-size: 14px; color: #94a3b8; line-height: 1.5; margin: 0 0 20px;">
            The ARES-1 Mars Return Spacecraft has escaped Martian gravity and reached stable orbit. Select your flight destination:
          </p>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <button id="mars-btn-to-earth" style="padding: 14px 20px; background: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; border-radius: 12px; color: #ffffff; font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
              <span>🌍 RETURN TO EARTH (Kennedy Spaceport)</span>
              <span style="font-size: 12px; color: #38bdf8;">1.0G Earth Base ➔</span>
            </button>
            <button id="mars-btn-to-moon" style="padding: 14px 20px; background: rgba(203, 213, 225, 0.2); border: 1px solid #cbd5e1; border-radius: 12px; color: #ffffff; font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
              <span>🌕 TRANS-LUNAR INJECTION (Artemis Base)</span>
              <span style="font-size: 12px; color: #cbd5e1;">0.17G Moon Base ➔</span>
            </button>
            <button id="mars-btn-to-orbit" style="padding: 10px 16px; background: rgba(148, 163, 184, 0.15); border: 1px solid rgba(148, 163, 184, 0.3); border-radius: 10px; color: #cbd5e1; font-size: 13px; font-weight: 600; cursor: pointer;">
              🌌 Return to Solar System Orrery View
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    // Query live NASA DONKI flare feed
    NasaApiService.getDonkiFlares().then((res) => {
      if (res && res.flares && res.flares.length > 0) {
        for (const f of res.flares) {
          this.flareEvents.push([
            `${f.classType || 'X-Class'} Solar Flare (${f.flrID || 'DONKI'})`,
            `${f.peakTime || 'Live Feed'} // ${res.sourceTier}`,
            f.classType && f.classType.startsWith('X') ? 5 : 4
          ]);
        }
      }
    });

    this._setupThree();
    this._bindEvents();
    this._updateHUD(1);
  }

  _setupThree() {
    const host = this.container.querySelector('#mars-canvas-host');

    // Craters
    this.craters = [];
    while (this.craters.length < 16) {
      const x = (Math.random() - 0.5) * 440;
      const z = (Math.random() - 0.5) * 440;
      if (Math.hypot(x, z) > 55) {
        this.craters.push({
          x,
          z,
          r: 12 + Math.random() * 26,
          d: 3 + Math.random() * 6,
        });
      }
    }

    // Scene, camera, renderer
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 600);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.canvas = this.renderer.domElement;
    host.appendChild(this.canvas);

    this.scene.background = this.dayColor.clone();
    this.scene.fog = new THREE.Fog(0xe3a27c, 40, 230);

    // Lights
    this.hemiLight = new THREE.HemisphereLight(0xffd2b0, 0x663322, 0.5);
    this.sunLight = new THREE.DirectionalLight(0xfff0dd, 1.1);
    this.sunLight.position.set(60, 80, 40);
    this.scene.add(this.hemiLight, this.sunLight);

    // Procedural ground texture
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const cx = cv.getContext('2d');
    for (let i = 0; i < 3000; i++) {
      const v = (170 + Math.random() * 85) | 0;
      cx.fillStyle = `rgb(${v},${v - 8},${v - 14})`;
      cx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(70, 70);

    // Terrain geometry
    const geo = new THREE.PlaneGeometry(500, 500, 110, 110);
    geo.rotateX(-Math.PI / 2);
    const pa = geo.attributes.position;
    const col = new Float32Array(pa.count * 3);

    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i);
      const z = pa.getZ(i);
      const y = this._terrainHeight(x, z);
      const n = 0.5 + 0.5 * Math.sin(x * 0.31) * Math.cos(z * 0.27);
      const l = 0.75 + 0.25 * n + this._clamp(y * 0.04, -0.3, 0.25);
      pa.setY(i, y);
      col.set([0.8 * l, 0.38 * l, 0.22 * l], i * 3);
    }

    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();

    const groundMat = new THREE.MeshLambertMaterial({ vertexColors: true, map: tex });
    const ground = new THREE.Mesh(geo, groundMat);
    this.scene.add(ground);

    // Starfield for night sky
    const sp = new Float32Array(1200);
    for (let i = 0; i < 400; i++) {
      const a = Math.random() * Math.PI * 2;
      const b = Math.random() * 1.4 + 0.1;
      const r = 400;
      sp.set([r * Math.cos(a) * Math.cos(b), r * Math.sin(b), r * Math.sin(a) * Math.cos(b)], i * 3);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.starPoints = new THREE.Points(
      sg,
      new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, fog: false, transparent: true, opacity: 0 })
    );
    this.scene.add(this.starPoints);

    // Astronaut player model (Detailed suit with legs, arms, helmet visor & PLSS pack)
    this.playerGroup = this._createAstronaut();
    this.playerGroup.position.set(0, 0, 9);
    this.scene.add(this.playerGroup);

    // Initial base shelter at (0, 0)
    this._spawnBuilding('shelter', 0, 0);

    // Mineral rocks (70 total)
    const rockGeo = new THREE.DodecahedronGeometry(0.8);
    for (let i = 0; i < 70; i++) {
      const x = (Math.random() - 0.5) * 420;
      const z = (Math.random() - 0.5) * 420;
      if (Math.hypot(x, z) < 14) continue;
      const isIce = i % 2 === 0;
      const mat = new THREE.MeshLambertMaterial({
        color: isIce ? 0xbfe9ff : 0x6b3a20,
        emissive: isIce ? 0x2a5a7a : 0x000000,
      });
      const rockMesh = new THREE.Mesh(rockGeo, mat);
      rockMesh.position.set(x, this._terrainHeight(x, z) + 0.5, z);
      rockMesh.scale.set(1, isIce ? 0.6 : 1, 1);
      this.scene.add(rockMesh);
      this.nodes.push({ mesh: rockMesh, isIce });
    }

    // NASA Landmarks
    this.landmarks = [];
    this.landmarkDefs.forEach((l) => {
      const g = new THREE.Group();
      const beacon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 14, 8),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 })
      );
      beacon.position.set(0, 7, 0);
      g.add(beacon);
      g.position.set(l[1], this._terrainHeight(l[1], l[2]), l[2]);
      this.scene.add(g);
      this.landmarks.push({ group: g, beacon, data: l, done: false });
    });

    // ARES-1 Mars Return Lander & Launch Pad
    this._createReturnLander();
  }

  _createReturnLander() {
    this.returnLander = new THREE.Group();
    this.returnLander.position.set(0, 0, 24);

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
      new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.DoubleSide })
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
      new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.4 })
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
      color: 0xff7700,
      emissive: 0xff4400,
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0.85
    });
    this.flameMesh = new THREE.Mesh(flameGeo, flameMat);
    this.flameMesh.position.set(0, -1.8, 0);
    this.flameMesh.visible = false;
    this.landerShip.add(this.flameMesh);

    this.scene.add(this.returnLander);
  }

  _createAstronaut() {
    const player = new THREE.Group();

    // Materials
    const suitMat = new THREE.MeshLambertMaterial({ color: 0xf1f5f9 }); // Crisp white spacesuit
    const suitJointMat = new THREE.MeshLambertMaterial({ color: 0x475569 }); // Slate joints
    const visorMat = new THREE.MeshLambertMaterial({
      color: 0xffb703,
      emissive: 0x664400,
    }); // Gold reflective visor
    const packMat = new THREE.MeshLambertMaterial({ color: 0x1e293b }); // Dark slate PLSS backpack
    const tankMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 }); // Oxygen cylinders
    const bootMat = new THREE.MeshLambertMaterial({ color: 0x0f172a }); // Heavy boots
    const badgeMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 }); // NASA blue badge
    const ledCyanMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const ledAmberMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    // Inner body group that can bob up/down during walking
    const bodyGroup = new THREE.Group();
    player.add(bodyGroup);

    // 1. Torso
    const torsoGeo = new THREE.CylinderGeometry(0.38, 0.34, 0.75, 12);
    const torso = new THREE.Mesh(torsoGeo, suitMat);
    torso.position.set(0, 0.9, 0);
    bodyGroup.add(torso);

    // Torso waist belt
    const beltGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.12, 12);
    const belt = new THREE.Mesh(beltGeo, suitJointMat);
    belt.position.set(0, 0.55, 0);
    bodyGroup.add(belt);

    // Chest control unit
    const chestBox = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.14), packMat);
    chestBox.position.set(0, 0.95, 0.22);
    bodyGroup.add(chestBox);

    // NASA Blue Badge on chest
    const chestBadge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.04), badgeMat);
    chestBadge.position.set(-0.08, 0.98, 0.3);
    bodyGroup.add(chestBadge);

    // Status LEDs on chest unit
    const led1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), ledCyanMat);
    led1.position.set(0.08, 1.02, 0.3);
    const led2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), ledAmberMat);
    led2.position.set(0.08, 0.94, 0.3);
    bodyGroup.add(led1, led2);

    // 2. Helmet
    const helmetGroup = new THREE.Group();
    helmetGroup.position.set(0, 1.48, 0);

    const helmetMesh = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 14), suitMat);
    helmetGroup.add(helmetMesh);

    // Helmet neck collar ring
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.08, 14), suitJointMat);
    collar.position.set(0, -0.28, 0);
    helmetGroup.add(collar);

    // Bubble Visor
    const visorMesh = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), visorMat);
    visorMesh.position.set(0, 0.02, 0.18);
    visorMesh.scale.set(1.0, 0.85, 0.65);
    helmetGroup.add(visorMesh);

    // Side helmet communications lights / torches
    const sideLightL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 8), packMat);
    sideLightL.rotation.z = Math.PI / 2;
    sideLightL.position.set(-0.36, 0.04, 0.06);
    const sideLightR = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 8), packMat);
    sideLightR.rotation.z = Math.PI / 2;
    sideLightR.position.set(0.36, 0.04, 0.06);
    helmetGroup.add(sideLightL, sideLightR);

    bodyGroup.add(helmetGroup);

    // 3. Backpack (PLSS)
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.72, 0.28), packMat);
    pack.position.set(0, 0.98, -0.32);
    bodyGroup.add(pack);

    // Dual oxygen cylinders on sides of backpack
    const tankGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.58, 8);
    const tankL = new THREE.Mesh(tankGeo, tankMat);
    tankL.position.set(-0.2, 0.98, -0.42);
    const tankR = new THREE.Mesh(tankGeo, tankMat);
    tankR.position.set(0.2, 0.98, -0.42);
    bodyGroup.add(tankL, tankR);

    // Dual mini thruster cones at bottom of backpack
    const thrusterGeo = new THREE.ConeGeometry(0.06, 0.1, 8);
    const thrusterL = new THREE.Mesh(thrusterGeo, suitJointMat);
    thrusterL.rotation.x = Math.PI;
    thrusterL.position.set(-0.16, 0.58, -0.32);
    const thrusterR = new THREE.Mesh(thrusterGeo, suitJointMat);
    thrusterR.rotation.x = Math.PI;
    thrusterR.position.set(0.16, 0.58, -0.32);
    bodyGroup.add(thrusterL, thrusterR);

    // 4. Legs (Left & Right) with hip pivot for natural stride animation
    // Left Leg
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.18, 0.52, 0); // Hip socket

    // Thigh
    const thighL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.28, 8), suitMat);
    thighL.position.set(0, -0.14, 0);
    leftLeg.add(thighL);

    // Knee joint
    const kneeL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), suitJointMat);
    kneeL.position.set(0, -0.28, 0);
    leftLeg.add(kneeL);

    // Shin & Boot
    const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.28), bootMat);
    bootL.position.set(0, -0.42, 0.04);
    leftLeg.add(bootL);

    player.add(leftLeg);

    // Right Leg
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.18, 0.52, 0); // Hip socket

    // Thigh
    const thighR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.28, 8), suitMat);
    thighR.position.set(0, -0.14, 0);
    rightLeg.add(thighR);

    // Knee joint
    const kneeR = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), suitJointMat);
    kneeR.position.set(0, -0.28, 0);
    rightLeg.add(kneeR);

    // Shin & Boot
    const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.28), bootMat);
    bootR.position.set(0, -0.42, 0.04);
    rightLeg.add(bootR);

    player.add(rightLeg);

    // 5. Arms (Left & Right) with shoulder pivot for natural swinging
    // Left Arm
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.44, 1.18, 0); // Shoulder socket

    const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), suitJointMat);
    leftArm.add(shoulderL);

    const bicepL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.38, 8), suitMat);
    bicepL.position.set(0, -0.2, 0);
    leftArm.add(bicepL);

    const gloveL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), bootMat);
    gloveL.position.set(0, -0.42, 0);
    leftArm.add(gloveL);

    bodyGroup.add(leftArm);

    // Right Arm
    const rightArm = new THREE.Group();
    rightArm.position.set(0.44, 1.18, 0); // Shoulder socket

    const shoulderR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), suitJointMat);
    rightArm.add(shoulderR);

    const bicepR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.38, 8), suitMat);
    bicepR.position.set(0, -0.2, 0);
    rightArm.add(bicepR);

    const gloveR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), bootMat);
    gloveR.position.set(0, -0.42, 0);
    rightArm.add(gloveR);

    bodyGroup.add(rightArm);

    this.playerModel = {
      bodyGroup,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      helmetGroup,
    };

    return player;
  }

  _bindEvents() {
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (!this.isActive) return;
      const k = e.key.toLowerCase();
      this.keys[k] = true;

      if (k === 'e') this._interact();
      if (k === ' ' && this.isGrounded && this.isGameStarted) {
        this.vy = 6.5;
        this.isGrounded = false;
        sound.playTone(400, 0.08, 'square', 0.06);
      }
      if (['1', '2', '3', '4'].includes(k)) {
        const types = ['solar', 'moxie', 'farm', 'shelter'];
        this._build(types[parseInt(k) - 1]);
      }
      if (k === 'escape') {
        this.stop();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (!this.isActive) return;
      this.keys[e.key.toLowerCase()] = false;
    });

    // Pointer controls for camera orbit & joystick
    this.canvas.addEventListener('pointerdown', (e) => {
      const mode = e.pointerType === 'touch' && e.clientX < window.innerWidth / 2 ? 'joy' : 'look';
      this.pointerTargets[e.pointerId] = {
        x: e.clientX,
        y: e.clientY,
        ox: e.clientX,
        oy: e.clientY,
        mode,
      };
      this.canvas.setPointerCapture(e.pointerId);
    });

    this.canvas.addEventListener('pointermove', (e) => {
      const p = this.pointerTargets[e.pointerId];
      if (!p) return;
      if (p.mode === 'look') {
        const deltaX = (e.clientX - p.x) * 0.005;
        const deltaY = (e.clientY - p.y) * 0.005;
        this.targetFacingYaw += deltaX;
        this.pitch = this._clamp(this.pitch + deltaY, 0.12, 0.95);
        p.x = e.clientX;
        p.y = e.clientY;
      } else {
        this.joy.x = this._clamp((e.clientX - p.ox) / 45, -1, 1);
        this.joy.y = this._clamp((e.clientY - p.oy) / 45, -1, 1);
      }
    });

    const pointerUp = (e) => {
      const p = this.pointerTargets[e.pointerId];
      if (p && p.mode === 'joy') {
        this.joy.x = 0;
        this.joy.y = 0;
      }
      delete this.pointerTargets[e.pointerId];
    };
    this.canvas.addEventListener('pointerup', pointerUp);
    this.canvas.addEventListener('pointercancel', pointerUp);

    // Build bar buttons
    this.container.querySelectorAll('[data-build]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const type = e.currentTarget.dataset.build;
        this._build(type);
      });
    });

    // Return to Orbit button
    const exitBtn = this.container.querySelector('#mars-exit-orbit-btn');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        sound.playClick();
        this.stop();
      });
    }

    // Touch buttons
    const jumpBtn = this.container.querySelector('#mars-touch-jump');
    if (jumpBtn) {
      jumpBtn.addEventListener('click', () => {
        if (this.isGrounded) {
          this.vy = 6.5;
          this.isGrounded = false;
        }
      });
    }

    const actionBtn = this.container.querySelector('#mars-touch-action');
    if (actionBtn) {
      actionBtn.addEventListener('click', () => this._interact());
    }

    // Briefing modal start button
    const startBtn = this.container.querySelector('#mars-start-mission-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        sound.playClick();
        this.container.querySelector('#mars-briefing-modal').style.display = 'none';
        this.isGameStarted = true;
        this.toast('🚀 Touchdown at Jezero Crater! Explore, mine, and build.', 6000);
        sound.speak('Welcome to Jezero Crater. Explore and build your base.');
      });
    }

    // Board prompt button click
    const promptBtn = this.container.querySelector('#mars-board-prompt');
    if (promptBtn) {
      promptBtn.addEventListener('click', () => {
        this._boardAndLaunch();
      });
    }

    // Destination modal buttons
    const btnToEarth = this.container.querySelector('#mars-btn-to-earth');
    if (btnToEarth) {
      btnToEarth.addEventListener('click', () => {
        this.container.querySelector('#mars-destination-modal').style.display = 'none';
        this.stop();
        this.onLandOnEarth();
      });
    }

    const btnToMoon = this.container.querySelector('#mars-btn-to-moon');
    if (btnToMoon) {
      btnToMoon.addEventListener('click', () => {
        this.container.querySelector('#mars-destination-modal').style.display = 'none';
        this.stop();
        this.onLandOnMoon();
      });
    }

    const btnToOrbit = this.container.querySelector('#mars-btn-to-orbit');
    if (btnToOrbit) {
      btnToOrbit.addEventListener('click', () => {
        this.container.querySelector('#mars-destination-modal').style.display = 'none';
        this.stop();
      });
    }

    // Trigger Solar Flare drill button
    const testFlareBtn = this.container.querySelector('#mars-trigger-flare-btn');
    if (testFlareBtn) {
      testFlareBtn.addEventListener('click', () => {
        this._triggerSolarStorm();
      });
    }

    window.addEventListener('resize', this._boundResize);
  }

  _triggerSolarStorm() {
    this.storm.phase = 'warn';
    this.storm.timer = 8;
    this.storm.event = this.flareEvents[Math.floor(Math.random() * this.flareEvents.length)];
    sound.playKlaxon();
    this.toast(`📡 <b>DONKI SPACE WEATHER ALERT:</b> ${this.storm.event[0]} detected! Seek shelter at (0, 0)!`, 8000);
    sound.speak('Solar storm warning. Return to shelter immediately.');
  }

  _onResize() {
    if (!this.renderer || !this.camera) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  _spawnBuilding(type, x, z) {
    const g = new THREE.Group();
    const mt = (c, e) => new THREE.MeshLambertMaterial({ color: c, emissive: e || 0 });

    if (type === 'solar') {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 6), mt(0x94a3b8));
      stand.position.set(0, 0.6, 0);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 2), mt(0x0284c7, 0x0369a1));
      panel.position.set(0, 1.4, 0);
      panel.rotation.x = -0.5;
      g.add(stand, panel);
    } else if (type === 'moxie') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(2, 1.4, 1.6), mt(0xcfd2d6));
      body.position.set(0, 0.7, 0);
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.2, 8), mt(0xf97316));
      pipe.position.set(0.6, 2, 0);
      g.add(body, pipe);
    } else if (type === 'farm') {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.3, 16), mt(0xffffff));
      base.position.set(0, 0.15, 0);
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(2.4, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshLambertMaterial({ color: 0x10b981, emissive: 0x064e3b, transparent: true, opacity: 0.75 })
      );
      dome.position.set(0, 0.3, 0);
      g.add(base, dome);
    } else if (type === 'shelter') {
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(4, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        mt(0xe2e8f0)
      );
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2, 0.6), mt(0x334155));
      door.position.set(0, 1, 3.8);
      g.add(dome, door);
    }

    g.position.set(x, this._terrainHeight(x, z), z);
    this.scene.add(g);
    this.buildings.push({ type, x, z, mesh: g });
    this.buildingCounts[type]++;
  }

  _build(type) {
    const def = this.buildingDefs[type];
    if (!def) return;

    if (this.stats.m < (def.cost.m || 0) || this.stats.i < (def.cost.i || 0)) {
      this.toast('⚠️ Not enough resources! Mine ⛏️ Metal and ❄️ Ice first.', 3000);
      sound.playTone(250, 0.15, 'sawtooth', 0.08);
      return;
    }

    const x = this.playerGroup.position.x + this.face[0] * 6;
    const z = this.playerGroup.position.z + this.face[1] * 6;

    if (this.buildings.some((b) => Math.hypot(b.x - x, b.z - z) < 7)) {
      this.toast('⚠️ Too close to another building. Step back a few meters.', 3000);
      return;
    }

    this.stats.m -= def.cost.m || 0;
    this.stats.i -= def.cost.i || 0;
    this._spawnBuilding(type, x, z);
    sound.playChime();
    this.toast(`✅ ${def.name} Constructed! ${def.tip}`, 6000);
    this._updateHUD(Math.sin(this.stats.dt * Math.PI * 2));
  }

  _interact() {
    // 0. Check return lander proximity
    const distToLander = Math.hypot(this.playerGroup.position.x - 0, this.playerGroup.position.z - 24);
    if (distToLander < 8.5 && !this.isLanding && !this.isAscending) {
      this._boardAndLaunch();
      return;
    }

    let nearestDist = 5.0;
    let targetNode = null;
    let targetType = 0; // 1: mineral, 2: landmark

    // Check mineral nodes
    for (const node of this.nodes) {
      const d = this.playerGroup.position.distanceTo(node.mesh.position);
      if (d < nearestDist) {
        nearestDist = d;
        targetNode = node;
        targetType = 1;
      }
    }

    // Check NASA landmarks
    for (const lm of this.landmarks) {
      if (!lm.done) {
        const d = Math.hypot(
          this.playerGroup.position.x - lm.group.position.x,
          this.playerGroup.position.z - lm.group.position.z
        );
        if (d < nearestDist + 2.5) {
          nearestDist = d;
          targetNode = lm;
          targetType = 2;
        }
      }
    }

    if (!targetNode) {
      this.toast('Nothing to interact with nearby. Approach a rock or glowing beacon.', 2500);
      return;
    }

    if (targetType === 1) {
      // Mine mineral
      this.scene.remove(targetNode.mesh);
      const idx = this.nodes.indexOf(targetNode);
      if (idx !== -1) this.nodes.splice(idx, 1);

      const qty = 1 + (Math.random() < 0.35 ? 1 : 0);
      sound.playLaser();
      if (targetNode.isIce) {
        this.stats.i += qty;
        this.toast(`❄️ Collected +${qty} Water Ice!`, 2000);
      } else {
        this.stats.m += qty;
        this.toast(`⛏️ Mined +${qty} Structural Metal!`, 2000);
      }
      this._updateHUD(Math.sin(this.stats.dt * Math.PI * 2));
    } else if (targetType === 2) {
      // Discover NASA landmark
      targetNode.done = true;
      targetNode.beacon.material.opacity = 0.15;
      this.stats.m += 3;
      sound.playChime();
      this.toast(`🔭 <b>${targetNode.data[0]}</b><br>${targetNode.data[3]}<br><i>+3 Metal Awarded!</i>`, 9000);
      sound.speak(targetNode.data[0]);
      this._updateHUD(Math.sin(this.stats.dt * Math.PI * 2));
    }
  }

  toast(text, ms = 4000) {
    const el = this.container.querySelector('#mars-toast');
    if (!el) return;
    el.innerHTML = text;
    el.style.opacity = '1';
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      el.style.opacity = '0';
    }, ms);
  }

  _updateHUD(sun) {
    const setWidth = (id, val, max = 100) => {
      const el = this.container.querySelector('#m-bar-' + id);
      if (el) el.style.width = this._clamp((val / max) * 100) + '%';
    };

    setWidth('air', this.stats.air);
    setWidth('hp', this.stats.hp);
    setWidth('food', this.stats.food);
    setWidth('pw', this.stats.pw);
    setWidth('bo', this.stats.bo, 200);
    setWidth('bf', this.stats.bf);

    const hr = Math.floor((this.stats.dt - 0.25) * 24 + 36) % 24;
    const invEl = this.container.querySelector('#mars-inv-row');
    if (invEl) {
      invEl.innerHTML = `⛏️ ${this.stats.m} Metal • ❄️ ${this.stats.i} Ice<br>Sol ${this.stats.sol} • ${String(hr).padStart(2, '0')}:00 ${sun > 0 ? '☀️ Daytime' : '🌙 Night'}`;
    }

    // Directive objectives
    const objectives = [
      [() => this.buildingCounts.solar >= 2, 'Build 2 Solar Panels (☀️)'],
      [() => this.buildingCounts.moxie >= 1, 'Build 1 MOXIE Oxygen Plant (🧪)'],
      [() => this.buildingCounts.farm >= 1, 'Build 1 Hydroponic Greenhouse (🌱)'],
      [() => this.buildingCounts.shelter >= 2, 'Build 2nd Habitat Shelter (🏠)'],
      [() => this.stats.sol >= 4, 'Survive 3 Martian Sols (🌅)'],
    ];

    const listEl = this.container.querySelector('#mars-obj-list');
    if (listEl) {
      listEl.innerHTML = objectives
        .map(([fn, title]) => `<div class="obj-item ${fn() ? 'done' : ''}">${fn() ? '✅' : '⬜'} ${title}</div>`)
        .join('');
    }

    const discoveredCount = this.landmarks.filter((l) => l.done).length;
    const countEl = this.container.querySelector('#mars-landmarks-count');
    if (countEl) countEl.innerHTML = `🔭 NASA Sites: ${discoveredCount}/4`;

    if (!this.hasWon && objectives.every(([fn]) => fn())) {
      this.hasWon = true;
      sound.playChime();
      this.toast('🎉 <b>OUTPOST ESTABLISHED!</b> Mars Base Alpha is fully self-sufficient!', 12000);
      sound.speak('Congratulations Commander! Outpost Alpha is now fully self-sufficient.');
    }
  }

  _resolveCollision(newX, newZ, radius = 0.5) {
    let px = newX;
    let pz = newZ;

    // Check colony buildings
    for (const b of this.buildings) {
      const bRadius = b.type === 'shelter' ? 3.6 : (b.type === 'farm' ? 3.0 : 2.0);
      const dx = px - b.x;
      const dz = pz - b.z;
      const dist = Math.hypot(dx, dz);
      const minDist = bRadius + radius;
      if (dist < minDist && dist > 0.001) {
        const push = (minDist - dist) / dist;
        px += dx * push;
        pz += dz * push;
      }
    }

    // Check resource mineral boulders
    for (const n of this.nodes) {
      if (!n || !n.mesh) continue;
      const dx = px - n.mesh.position.x;
      const dz = pz - n.mesh.position.z;
      const dist = Math.hypot(dx, dz);
      const minDist = 1.5 + radius;
      if (dist < minDist && dist > 0.001) {
        const push = (minDist - dist) / dist;
        px += dx * push;
        pz += dz * push;
      }
    }

    // Check lander base
    const landerDx = px - 0;
    const landerDz = pz - 9;
    const landerDist = Math.hypot(landerDx, landerDz);
    if (landerDist < 4.2 + radius && landerDist > 0.001) {
      const push = (4.2 + radius - landerDist) / landerDist;
      px += landerDx * push;
      pz += landerDz * push;
    }

    return [px, pz];
  }

  _tick(dt) {
    // Sol clock progression
    this.stats.dt += dt / 180;
    if (this.stats.dt >= 1) {
      this.stats.dt -= 1;
      this.stats.sol++;
      this.toast(`🌅 Sol ${this.stats.sol} begins on Mars.`, 3000);
    }

    const sun = Math.sin(this.stats.dt * Math.PI * 2);
    const nearShelter = this.buildings.some(
      (b) =>
        b.type === 'shelter' &&
        Math.hypot(b.x - this.playerGroup.position.x, b.z - this.playerGroup.position.z) < 7
    );

    // Solar power generation
    if (this.storm.phase !== 'act') {
      this.stats.pw = this._clamp(this.stats.pw + this.buildingCounts.solar * 2 * Math.max(0, sun) * dt);
    }

    // MOXIE air synthesis
    if (this.buildingCounts.moxie) {
      const u = this.buildingCounts.moxie * dt;
      if (this.stats.pw >= u && this.stats.bo < 200) {
        this.stats.pw -= u;
        this.stats.bo = this._clamp(this.stats.bo + this.buildingCounts.moxie * 1.4 * dt, 0, 200);
      }
    }

    // Greenhouse crop growth
    if (this.buildingCounts.farm) {
      const u = this.buildingCounts.farm * 0.6 * dt;
      if (this.stats.pw >= u && this.stats.bf < 100) {
        this.stats.pw -= u;
        this.stats.bf = this._clamp(this.stats.bf + this.buildingCounts.farm * 0.6 * dt, 0, 100);
      }
    }

    this.elapsedTime += dt;

    // Movement calculation relative to avatar facing
    const moveForward = (this.keys['w'] || this.keys['arrowup'] ? 1 : 0) - (this.keys['s'] || this.keys['arrowdown'] ? 1 : 0) - this.joy.y;
    const moveRight = (this.keys['d'] || this.keys['arrowright'] ? 1 : 0) - (this.keys['a'] || this.keys['arrowleft'] ? 1 : 0) + this.joy.x;
    const isMoving = Math.abs(moveForward) > 0.05 || Math.abs(moveRight) > 0.05;
    const isRunning = this.keys['shift'] && isMoving;
    const speed = isRunning ? 10.5 : 5.8;

    // Smooth steering with A/D or joystick
    if (Math.abs(moveRight) > 0.05) {
      // Steer facing yaw: A / left turns left (-), D / right turns right (+)
      const steerRate = Math.abs(moveForward) > 0.05 ? 2.4 : 3.0;
      this.targetFacingYaw += moveRight * steerRate * dt;
    }

    // Avatar banking / tilt when steering into turns
    // In Three.js: positive rotation.z tilts the astronaut body LEFT; negative tilts RIGHT
    let targetTilt = 0;
    if (isMoving && Math.abs(moveRight) > 0.05) {
      // Moving & steering left (moveRight < 0) -> tilt left (+0.12)
      // Moving & steering right (moveRight > 0) -> tilt right (-0.12)
      targetTilt = -Math.sign(moveRight) * (isRunning ? 0.15 : 0.10);
    }

    if (isMoving) {
      // Current avatar facing angle
      const theta = this.playerGroup.rotation.y;

      // Forward vector along avatar heading: (sin(theta), cos(theta))
      // Slight strafe component for responsiveness: (cos(theta), -sin(theta))
      const strafeFactor = Math.abs(moveForward) > 0.05 ? 0.25 : 1.0;
      const fwd = moveForward;
      const str = moveRight * strafeFactor;
      const mag = Math.hypot(fwd, str) || 1;
      const normF = fwd / Math.max(1, mag);
      const normS = str / Math.max(1, mag);

      const dx = Math.sin(theta) * normF + Math.cos(theta) * normS;
      const dz = Math.cos(theta) * normF - Math.sin(theta) * normS;

      const rawX = this._clamp(this.playerGroup.position.x + dx * speed * dt, -240, 240);
      const rawZ = this._clamp(this.playerGroup.position.z + dz * speed * dt, -240, 240);

      // Solid collision resolution: Cannot walk through buildings or rocks
      const [colX, colZ] = this._resolveCollision(rawX, rawZ, 0.45);
      this.playerGroup.position.x = colX;
      this.playerGroup.position.z = colZ;
      this.face = [dx, dz];

      // Animate walking legs & swinging arms!
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
    } else {
      // Standing idle - smoothly reset limbs, reset banking tilt, and gentle breathing
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
    }

    if (!this.isGrounded && this.playerModel) {
      // Jumping pose: legs tucked slightly
      this.playerModel.leftLeg.rotation.x = 0.35;
      this.playerModel.rightLeg.rotation.x = 0.45;
      this.playerModel.leftArm.rotation.x = -0.4;
      this.playerModel.rightArm.rotation.x = -0.4;
    }

    // Smoothly turn avatar face towards target facing yaw
    this.playerGroup.rotation.y = this._lerpAngle(this.playerGroup.rotation.y, this.targetFacingYaw, dt * 14);

    // Smoothly track camera yaw behind the avatar so camera is always looking in front of where avatar faces
    const idealCamYaw = this.playerGroup.rotation.y + Math.PI;
    this.currentCameraYaw = this._lerpAngle(this.currentCameraYaw, idealCamYaw, dt * 8.0);

    // Authentic Mars Planetary Gravity: 3.72 m/s² (0.38g => 6.8 scaled)
    const groundY = this._terrainHeight(this.playerGroup.position.x, this.playerGroup.position.z);
    this.vy -= 6.8 * dt;
    this.playerGroup.position.y += this.vy * dt;
    if (this.playerGroup.position.y <= groundY) {
      this.playerGroup.position.y = groundY;
      this.vy = 0;
      this.isGrounded = true;
    }

    // Update Physics Telemetry HUD
    const speedEl = this.container.querySelector('#mars-phys-speed');
    const altEl = this.container.querySelector('#mars-phys-alt');
    if (speedEl) speedEl.textContent = `${Math.round(speed * 3.6)} km/h`;
    if (altEl) altEl.textContent = `${(-2500 + Math.round(this.playerGroup.position.y * 10))} m`;

    // Resource consumption / Refill near shelter
    if (nearShelter) {
      const f = Math.min(this.stats.bo, 100 - this.stats.air, 14 * dt);
      this.stats.air += f;
      this.stats.bo -= f;
      const e = Math.min(this.stats.bf, 100 - this.stats.food, 6 * dt);
      this.stats.food += e;
      this.stats.bf -= e;
    } else {
      this.stats.air = this._clamp(this.stats.air - (isRunning ? 0.9 : 0.35) * dt);
    }
    this.stats.food = this._clamp(this.stats.food - 0.12 * dt);

    // Solar Storm Lifecycle
    this.storm.timer -= dt;
    const stormTint = this.container.querySelector('#mars-storm-tint');

    if (this.storm.phase === 'none' && this.storm.timer <= 0) {
      this.storm.phase = 'warn';
      this.storm.timer = 9;
      this.storm.event = this.flareEvents[Math.floor(Math.random() * this.flareEvents.length)];
      sound.playKlaxon();
      this.toast(`📡 <b>DONKI SPACE WEATHER ALERT:</b> ${this.storm.event[0]} detected! Seek shelter!`, 8000);
      sound.speak('Solar storm warning. Return to shelter immediately.');
    } else if (this.storm.phase === 'warn' && this.storm.timer <= 0) {
      this.storm.phase = 'act';
      this.storm.timer = 12;
      if (stormTint) stormTint.style.opacity = '0.35';
    } else if (this.storm.phase === 'act' && this.storm.timer <= 0) {
      this.storm.phase = 'none';
      this.storm.timer = 60 + Math.random() * 40;
      if (stormTint) stormTint.style.opacity = '0';
      this.toast('☀️ Solar flare has subsided. Radiation nominal.', 3000);
    }

    // Flare damage if unshielded
    if (this.storm.phase === 'act' && !nearShelter) {
      this.stats.hp -= 0.7 * (this.storm.event?.[2] || 4) * dt;
    }

    // Depleted air / food damage
    if (this.stats.air <= 0 || this.stats.food <= 0) {
      this.stats.hp -= 4 * dt;
    } else if (this.stats.hp < 100 && !(this.storm.phase === 'act' && !nearShelter)) {
      this.stats.hp = this._clamp(this.stats.hp + 1.5 * dt);
    }

    // Rescue if health zero
    if (this.stats.hp <= 0) {
      this.stats.hp = 50;
      this.stats.air = 60;
      this.stats.food = Math.max(this.stats.food, 40);
      this.stats.m >>= 1;
      this.playerGroup.position.set(0, 0, 9);
      sound.playKlaxon();
      this.toast('🚙 Emergency Rescue Rover retrieved you! Half metal was lost.', 6000);
    }

    // Day / Night visual lighting
    const dl = this._clamp(sun * 1.4 + 0.25, 0, 1);
    this.scene.background.lerpColors(this.nightColor, this.dayColor, dl);
    this.scene.fog.color.copy(this.scene.background);
    this.sunLight.intensity = 0.15 + 0.95 * dl;
    this.hemiLight.intensity = 0.2 + 0.4 * dl;
    this.sunLight.position.set(Math.cos(this.stats.dt * Math.PI * 2) * 80, Math.max(15, sun * 90), 40);
    if (this.starPoints) this.starPoints.material.opacity = 1 - dl;

    // Periodic HUD update
    this.hudTimer -= dt;
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.25;
      this._updateHUD(sun);
    }

    // Proximity check for boarding the return lander at (0, 0, 24)
    const distToLander = Math.hypot(this.playerGroup.position.x - 0, this.playerGroup.position.z - 24);
    const promptEl = this.container.querySelector('#mars-board-prompt');
    if (promptEl) {
      promptEl.style.display = (distToLander < 8.5 && this.isGrounded && !this.isLanding && !this.isAscending) ? 'block' : 'none';
    }
  }

  _boardAndLaunch() {
    if (this.isAscending || this.isLanding) return;
    this.isAscending = true;
    this.landerVy = 3.0;
    this.playerGroup.visible = false;

    const promptEl = this.container.querySelector('#mars-board-prompt');
    if (promptEl) promptEl.style.display = 'none';

    const atmoHud = this.container.querySelector('#mars-atmo-layers-hud');
    if (atmoHud) atmoHud.style.display = 'block';

    if (this.flameMesh) this.flameMesh.visible = true;

    sound.playLaser();
    sound.speak('Ascent rocket ignited. Ascending through Martian atmosphere.');
    this.toast('🚀 <b>ARES Mars Ascent!</b> Climbing through thin Martian atmosphere...', 4000);
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
      this.camera.position.set(24, shipWorldY + 14, 52);
      this.camera.lookAt(0, shipWorldY + 6, 24);

      if (this.landerShip.position.y <= 0) {
        this.landerShip.position.y = 0;
        this.isLanding = false;
        if (this.flameMesh) this.flameMesh.visible = false;
        this.playerGroup.position.set(0, 0, 16);
        this.playerGroup.visible = true;
        this.isGameStarted = true;
        sound.playVictory();
        this.toast('🔴 <b>Touchdown Confirmed!</b> Jezero Crater Colony Base.', 6000);
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

      const altM = Math.round(this.landerShip.position.y * 14);
      const altText = this.container.querySelector('#mars-ascent-alt');
      if (altText) altText.textContent = `ALTITUDE: ${altM} m`;

      // Highlight Atmospheric Layers
      const lower = this.container.querySelector('#mars-layer-lower');
      const mid = this.container.querySelector('#mars-layer-mid');
      const upper = this.container.querySelector('#mars-layer-upper');
      const exo = this.container.querySelector('#mars-layer-exo');

      if (altM > 1800) {
        if (exo) { exo.style.background = 'rgba(249, 115, 22, 0.3)'; exo.style.border = '1px solid #f97316'; }
        if (upper) { upper.style.background = 'rgba(255,255,255,0.05)'; upper.style.border = 'none'; }
      } else if (altM > 1000) {
        if (upper) { upper.style.background = 'rgba(249, 115, 22, 0.3)'; upper.style.border = '1px solid #f97316'; }
        if (mid) { mid.style.background = 'rgba(255,255,255,0.05)'; mid.style.border = 'none'; }
      } else if (altM > 400) {
        if (mid) { mid.style.background = 'rgba(249, 115, 22, 0.3)'; mid.style.border = '1px solid #f97316'; }
        if (lower) { lower.style.background = 'rgba(255,255,255,0.05)'; lower.style.border = 'none'; }
      }

      const shipWorldY = this.landerShip.position.y;
      this.camera.position.set(26, Math.max(14, shipWorldY * 0.6 + 12), 54);
      this.camera.lookAt(0, shipWorldY + 8, 24);

      if (this.landerShip.position.y > 180) {
        this.isAscending = false;
        if (this.flameMesh) this.flameMesh.visible = false;
        const modal = this.container.querySelector('#mars-destination-modal');
        if (modal) modal.style.display = 'flex';
        sound.playVictory();
        sound.speak('Martian escape velocity achieved. Destination trajectory ready.');
      }

      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (this.isGameStarted) {
      this._tick(dt);
    }

    // Camera follow player smoothly
    const playerPos = this.playerGroup.position;
    const t = new THREE.Vector3(playerPos.x, playerPos.y + 1.5, playerPos.z);

    // Look at a target point slightly ahead in front of where the avatar is looking
    const lookAheadDist = 2.5;
    const aheadX = Math.sin(this.playerGroup.rotation.y) * lookAheadDist;
    const aheadZ = Math.cos(this.playerGroup.rotation.y) * lookAheadDist;
    const targetLookAt = new THREE.Vector3(
      t.x + aheadX * 0.4,
      t.y + 0.1,
      t.z + aheadZ * 0.4
    );
    this.smoothLookTarget.lerp(targetLookAt, Math.min(1, dt * 14));

    // Target camera position behind avatar looking forward
    const targetCamX = t.x + Math.sin(this.currentCameraYaw) * Math.cos(this.pitch) * this.camDist;
    const targetCamY = t.y + Math.sin(this.pitch) * this.camDist;
    const targetCamZ = t.z + Math.cos(this.currentCameraYaw) * Math.cos(this.pitch) * this.camDist;

    // Smooth camera position interpolation
    this.camera.position.x += (targetCamX - this.camera.position.x) * Math.min(1, dt * 14);
    this.camera.position.y += (targetCamY - this.camera.position.y) * Math.min(1, dt * 14);
    this.camera.position.z += (targetCamZ - this.camera.position.z) * Math.min(1, dt * 14);

    const minCamY = this._terrainHeight(this.camera.position.x, this.camera.position.z) + 1.2;
    if (this.camera.position.y < minCamY) {
      this.camera.position.y = minCamY;
    }

    this.camera.lookAt(this.smoothLookTarget);

    this.renderer.render(this.scene, this.camera);
  }

  start(doDescent = true) {
    this.init();
    this.isActive = true;
    this.container.style.display = 'block';
    this._onResize();

    const destModal = this.container.querySelector('#mars-destination-modal');
    if (destModal) destModal.style.display = 'none';
    const atmoHud = this.container.querySelector('#mars-atmo-layers-hud');
    if (atmoHud) atmoHud.style.display = 'none';

    this.isAscending = false;
    this.landerVy = 0;

    if (doDescent && this.landerShip) {
      this.isLanding = true;
      this.landerShip.position.set(0, 55, 0);
      if (this.flameMesh) this.flameMesh.visible = true;
      this.playerGroup.visible = false;
      this.isGameStarted = false;
      sound.playLaser();
      sound.speak('De-orbit burn complete. Initiating Martian powered descent through atmosphere.');
      this.toast('🔴 <b>Powered Descent Initiated!</b> Retrorockets decelerating into Jezero Crater...', 5000);
    } else {
      this.isLanding = false;
      if (this.landerShip) this.landerShip.position.set(0, 0, 0);
      if (this.flameMesh) this.flameMesh.visible = false;
      this.playerGroup.position.set(0, 0, 16);
      this.playerGroup.visible = true;
      this.isGameStarted = true;
      sound.playLaser();
      this.toast('🔴 Welcome to Jezero Crater Mars Base Alpha!', 5000);
    }

    this.clock.start();
    this._renderLoop();
  }

  stop() {
    this.isActive = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.container) {
      this.container.style.display = 'none';
    }
    this.keys = {};
    this.onExit();
  }
}

