import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';
import { SceneManager } from './core/SceneManager.js';
import { ScrollManager } from './core/ScrollManager.js';
import { OverlayManager } from './overlay/OverlayManager.js';
import { GameManager } from './game/GameManager.js';
import { StructureManager } from './core/StructureManager.js';
import { sound } from './game/SoundEffects.js';
import { StarField } from './shared/StarField.js';
import { OrbitLines } from './shared/OrbitLines.js';
import { Sun } from './planets/Sun.js';
import { Mercury } from './planets/Mercury.js';
import { Venus } from './planets/Venus.js';
import { Earth } from './planets/Earth.js';
import { Mars } from './planets/Mars.js';
import { Jupiter } from './planets/Jupiter.js';
import { Saturn } from './planets/Saturn.js';
import { Uranus } from './planets/Uranus.js';
import { Neptune } from './planets/Neptune.js';
import { BlackHole } from './planets/BlackHole.js';
import { DwarfPlanets } from './planets/DwarfPlanets.js';
import { Comet } from './shared/Comet.js';
import { SpaceDebris } from './shared/SpaceDebris.js';
import { CosmicExplorer } from './overlay/CosmicExplorer.js';
import { MarsWorld } from './world/MarsWorld.js';
import { EarthWorld } from './world/EarthWorld.js';
import { MoonWorld } from './world/MoonWorld.js';
import { ConstellationLines } from './shared/ConstellationLines.js';
import { PlanetLabels } from './shared/PlanetLabels.js';
import { PlanetFocusCard } from './overlay/PlanetFocusCard.js';
import { CelestialModals } from './overlay/CelestialModals.js';
import { ephemeris } from './services/EphemerisService.js';
import { SECTION_CAMERAS, camFromPosition } from './config/cameras.js';
import { PLANETS, ORBIT_RADII } from './config/planets.js';

const canvas = document.getElementById('scene');
const sceneManager = new SceneManager(canvas);
const { scene, camera, renderer } = sceneManager;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.minDistance = 1;
controls.maxDistance = 500;
controls.rotateSpeed = 0.5;
controls.zoomSpeed = 0.8;

const scrollManager = new ScrollManager(camera);
const overlay = new OverlayManager(scrollManager);
const gameManager = new GameManager(scrollManager);

const starField = new StarField();
scene.add(starField.group);

const orbitLines = new OrbitLines();
scene.add(orbitLines.group);

const orbitToggleBtn = document.getElementById('orbit-toggle-btn');
if (orbitToggleBtn) {
  orbitToggleBtn.addEventListener('click', () => {
    const isVisible = orbitLines.toggle();
    orbitToggleBtn.textContent = isVisible ? '🌐 Orbit Paths: ON' : '🌐 Orbit Paths: OFF';
    orbitToggleBtn.classList.toggle('active', !isVisible);
    sound.playClick();
  });
}

const comet = new Comet();
scene.add(comet.group);

const spaceDebris = new SpaceDebris();
scene.add(spaceDebris.group);

const sun = new Sun();
const mercury = new Mercury();
const venus = new Venus();
const earth = new Earth();
const mars = new Mars();
const jupiter = new Jupiter();
const saturn = new Saturn();
const uranus = new Uranus();
const neptune = new Neptune();
const blackHole = new BlackHole();

const planets = [sun, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune, blackHole];

for (const p of planets) {
  scene.add(p.group);
}

// Celestial Constellations (Real Astronomical Starlines)
const constellationLines = new ConstellationLines();
scene.add(constellationLines.group);

// 3D Dwarf Planets System (Ceres, Pluto, Haumea, Makemake, Eris)
const dwarfPlanets = new DwarfPlanets();
scene.add(dwarfPlanets.group);

// 3D Planet & Dwarf Planet Floating Labels
const planetLabels = new PlanetLabels(scene);
scene.add(planetLabels.group);

// Register Major Celestial Bodies
planetLabels.registerPlanet('MERCURY', mercury.group, 1.2);
planetLabels.registerPlanet('VENUS', venus.group, 1.4);
planetLabels.registerPlanet('EARTH', earth.group, 1.6);
planetLabels.registerPlanet('MARS', mars.group, 1.3);
planetLabels.registerPlanet('JUPITER', jupiter.group, 4.2);
planetLabels.registerPlanet('SATURN', saturn.group, 3.8);
planetLabels.registerPlanet('URANUS', uranus.group, 2.6);
planetLabels.registerPlanet('NEPTUNE', neptune.group, 2.6);

// Register Dwarf Planets
planetLabels.registerPlanet('CERES', dwarfPlanets.dwarfs.ceres.group, 0.9);
planetLabels.registerPlanet('PLUTO', dwarfPlanets.dwarfs.pluto.group, 1.1);
planetLabels.registerPlanet('HAUMEA', dwarfPlanets.dwarfs.haumea.group, 1.0);
planetLabels.registerPlanet('MAKEMAKE', dwarfPlanets.dwarfs.makemake.group, 1.0);
planetLabels.registerPlanet('ERIS', dwarfPlanets.dwarfs.eris.group, 1.1);

const planetsMap = {
  sun: { group: sun.group, mesh: sun.core },
  mercury,
  venus,
  earth,
  moon: { group: earth.moon, mesh: earth.moon },
  mars,
  jupiter,
  saturn,
  uranus,
  neptune,
  ceres: dwarfPlanets.dwarfs.ceres,
  pluto: dwarfPlanets.dwarfs.pluto,
  haumea: dwarfPlanets.dwarfs.haumea,
  makemake: dwarfPlanets.dwarfs.makemake,
  eris: dwarfPlanets.dwarfs.eris,
};

let planetFocusCard;

const structureManager = new StructureManager(scene, scrollManager, planetsMap, (layerId) => {
  if (planetFocusCard) {
    planetFocusCard.scrollToLayer(layerId);
  }
});

const cosmicExplorer = new CosmicExplorer(scrollManager, camera, controls, spaceDebris, comet);

// Mars Open World (Surface 3D Simulation)
let marsWorld;
// Moon Open World (Artemis Lunar Base & Shackleton Crater)
let moonWorld;
// Earth Open World (Kennedy Spaceport Base & Heavy Rocket Launch Complex)
let earthWorld;

marsWorld = new MarsWorld(
  () => sound.playClick(),
  () => {
    // Return to Earth Spaceport
    marsWorld.stop();
    earthWorld.start();
  },
  () => {
    // Trans-Lunar Injection to Moon
    marsWorld.stop();
    moonWorld.start(true);
  }
);

moonWorld = new MoonWorld(
  () => sound.playClick(),
  () => {
    // Return to Earth Spaceport
    moonWorld.stop();
    earthWorld.start();
  },
  () => {
    // Trans-Mars Injection to Mars
    moonWorld.stop();
    marsWorld.start(true);
  }
);

earthWorld = new EarthWorld(
  () => sound.playClick(),
  () => {
    earthWorld.stop();
    scrollManager.goTo(4);
    sound.speak('Orbital transition complete. Welcome back to Earth orbit.');
  },
  () => {
    // Land on the Moon with powered descent!
    earthWorld.stop();
    moonWorld.start(true);
  },
  () => {
    // Land on Mars with powered descent!
    earthWorld.stop();
    marsWorld.start(true);
  }
);

const sectionToPlanetKey = {
  1: 'sun',
  2: 'mercury',
  3: 'venus',
  4: 'earth',
  5: 'moon',
  6: 'mars',
  7: 'jupiter',
  8: 'saturn',
  9: 'uranus',
  10: 'neptune',
  11: 'blackhole',
  13: 'ceres',
  14: 'pluto',
  15: 'haumea',
  16: 'makemake',
  17: 'eris',
};

function setSolarSystemFocus(focusedKey = null) {
  const isMission = typeof gameManager !== 'undefined' && gameManager && gameManager.gameMode === 'mission';
  const isOverview = !focusedKey || focusedKey === 'overview';

  // Toggle HUD docks (Left Dock, Right Ruler, and Bottom Date Bar)
  const leftDock = document.getElementById('scifi-left-dock');
  const rightRuler = document.getElementById('scifi-right-ruler');
  const bottomBar = document.getElementById('scifi-bottom-bar');

  if (isMission) {
    if (leftDock) leftDock.style.display = 'none';
    if (rightRuler) rightRuler.style.display = 'none';
    if (bottomBar) bottomBar.style.display = 'flex';
  } else {
    if (leftDock) leftDock.style.display = isOverview ? 'flex' : 'none';
    if (rightRuler) rightRuler.style.display = isOverview ? 'flex' : 'none';
    if (bottomBar) bottomBar.style.display = isOverview ? 'flex' : 'none';
  }

  // Toggle Space Debris (Asteroid belt, space junk, ISS, Voyager)
  if (spaceDebris && spaceDebris.group) {
    spaceDebris.group.visible = isOverview;
  }

  // Toggle Orbit Lines
  if (orbitLines && orbitLines.group) {
    orbitLines.group.visible = isOverview;
  }

  // Toggle Comet
  if (comet && comet.group) {
    comet.group.visible = isOverview;
  }

  // Toggle Planet Labels & Dwarf Orbits
  if (planetLabels && planetLabels.group) {
    planetLabels.group.visible = isOverview;
  }

  // Focus ONLY on the target planet alone; hide all other major planets
  for (const p of planets) {
    if (isOverview) {
      p.group.visible = true;
    } else {
      const isTarget =
        (focusedKey === 'sun' && p === sun) ||
        (focusedKey === 'mercury' && p === mercury) ||
        (focusedKey === 'venus' && p === venus) ||
        (focusedKey === 'earth' && p === earth) ||
        (focusedKey === 'moon' && p === earth) ||
        (focusedKey === 'mars' && p === mars) ||
        (focusedKey === 'jupiter' && p === jupiter) ||
        (focusedKey === 'saturn' && p === saturn) ||
        (focusedKey === 'uranus' && p === uranus) ||
        (focusedKey === 'neptune' && p === neptune) ||
        (focusedKey === 'blackhole' && p === blackHole);

      p.group.visible = isTarget;
    }
  }

  // Isolate target dwarf planet alone; hide all other dwarf planets
  if (dwarfPlanets && dwarfPlanets.dwarfs) {
    for (const [dKey, dObj] of Object.entries(dwarfPlanets.dwarfs)) {
      dObj.group.visible = isOverview || (focusedKey === dKey);
    }
  }
}

const celestialModals = new CelestialModals({
  onSelectPlanet: (key, section) => {
    scrollManager.goTo(section);
    setSolarSystemFocus(key);
    planetFocusCard.showPlanet(key, section);
  },
  onSelectStar: (star) => {
    // Point camera towards deep space constellations
    const angle = Math.random() * Math.PI * 2;
    const elevatedY = 45;
    camera.position.set(Math.cos(angle) * 160, elevatedY, Math.sin(angle) * 160);
    controls.target.set(Math.cos(angle) * 350, elevatedY * 1.5, Math.sin(angle) * 350);
    controls.update();
  },
});

planetFocusCard = new PlanetFocusCard({
  onVisit: (key, section) => {
    scrollManager.goTo(section);
  },
  onStructure: (key, section) => {
    structureManager.open(key);
  },
  onCloseStructure: () => {
    structureManager.close();
  },
  onSolarSystem: () => {
    scrollManager.goTo(0);
    planetFocusCard.hide();
    setSolarSystemFocus(null);
  },
  onSwitchPlanet: (nextKey, nextSection) => {
    scrollManager.goTo(nextSection);
    setSolarSystemFocus(nextKey);
    planetFocusCard.showPlanet(nextKey, nextSection);
  },
  onOpenSwitchModal: () => {
    celestialModals.openSwitchPlanet();
  },
  onOpenNightSkyModal: () => {
    celestialModals.openNightSky();
  },
  onNightSky: () => {
    camera.position.set(camera.position.x * 1.5, 30, camera.position.z * 1.5);
    controls.target.set(0, 0, 0);
  },
  onMarsLand: () => {
    if (planetFocusCard) planetFocusCard.hide();
    marsWorld.start();
  },
  onEarthLand: () => {
    if (planetFocusCard) planetFocusCard.hide();
    earthWorld.start();
  },
  onMoonLand: () => {
    if (planetFocusCard) planetFocusCard.hide();
    moonWorld.start();
  },
});

scrollManager.onChange((section) => {
  // If in ARES-1 Flight Console / Mission mode, or if any simulator is active, keep dialog card hidden!
  if (gameManager.gameMode === 'mission' || earthWorld?.isActive || moonWorld?.isActive || marsWorld?.isActive) {
    if (planetFocusCard) planetFocusCard.hide();
    return;
  }

  const key = sectionToPlanetKey[section];
  if (key) {
    setSolarSystemFocus(key);
    planetFocusCard.showPlanet(key, section);
  } else {
    setSolarSystemFocus(null);
    planetFocusCard.hide();
  }
});

gameManager.setOnLandOnMars(() => {
  if (planetFocusCard) planetFocusCard.hide();
  marsWorld.start();
});

document.addEventListener('ares:land-on-mars', () => {
  if (planetFocusCard) planetFocusCard.hide();
  marsWorld.start();
});

document.addEventListener('ares:visit-earth-base', () => {
  if (planetFocusCard) planetFocusCard.hide();
  earthWorld.start();
});

document.addEventListener('ares:land-on-moon', () => {
  if (planetFocusCard) planetFocusCard.hide();
  moonWorld.start();
});

// Click-to-Focus Raycasting Engine (Click anywhere on any planet to fly to it)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let pointerDownPos = { x: 0, y: 0 };
let pointerDownTime = 0;

// Add hit-proxies so smaller planets (Mercury, Mars, Moon) are easy to click from distance
function addHitProxy(obj, radius = 2.0) {
  const geo = new THREE.SphereGeometry(Math.max(radius * 1.8, 2.2), 16, 16);
  const mat = new THREE.MeshBasicMaterial({ visible: false, depthWrite: false });
  const proxy = new THREE.Mesh(geo, mat);
  proxy.name = 'hitProxy';
  obj.add(proxy);
}

addHitProxy(sun.group, 5.0);
addHitProxy(mercury.group, 0.8);
addHitProxy(venus.group, 1.2);
if (earth.mesh) addHitProxy(earth.mesh, 1.4);
if (earth.moon) addHitProxy(earth.moon, 0.8);
addHitProxy(mars.group, 1.0);
addHitProxy(jupiter.group, 3.5);
addHitProxy(saturn.group, 3.0);
addHitProxy(uranus.group, 2.0);
addHitProxy(neptune.group, 2.0);
addHitProxy(blackHole.group, 4.0);
addHitProxy(dwarfPlanets.dwarfs.ceres.group, 1.2);
addHitProxy(dwarfPlanets.dwarfs.pluto.group, 1.4);
addHitProxy(dwarfPlanets.dwarfs.haumea.group, 1.4);
addHitProxy(dwarfPlanets.dwarfs.makemake.group, 1.2);
addHitProxy(dwarfPlanets.dwarfs.eris.group, 1.4);

const planetTargets = [
  { obj: earth.moon, section: 5 },
  { obj: earth.group, section: 4 },
  { obj: sun.group, section: 1 },
  { obj: mercury.group, section: 2 },
  { obj: venus.group, section: 3 },
  { obj: mars.group, section: 6 },
  { obj: jupiter.group, section: 7 },
  { obj: saturn.group, section: 8 },
  { obj: uranus.group, section: 9 },
  { obj: neptune.group, section: 10 },
  { obj: blackHole.group, section: 11 },
  { obj: dwarfPlanets.dwarfs.ceres.group, section: 13 },
  { obj: dwarfPlanets.dwarfs.pluto.group, section: 14 },
  { obj: dwarfPlanets.dwarfs.haumea.group, section: 15 },
  { obj: dwarfPlanets.dwarfs.makemake.group, section: 16 },
  { obj: dwarfPlanets.dwarfs.eris.group, section: 17 },
];

function getIntersectedSection(hitObject) {
  let curr = hitObject;
  while (curr) {
    if (curr === earth.moon) return 5;
    curr = curr.parent;
  }
  curr = hitObject;
  while (curr) {
    for (const t of planetTargets) {
      if (t.obj === curr) return t.section;
    }
    curr = curr.parent;
  }
  return null;
}

// Track drag vs click
renderer.domElement.addEventListener('pointerdown', (e) => {
  pointerDownPos = { x: e.clientX, y: e.clientY };
  pointerDownTime = performance.now();
});

renderer.domElement.addEventListener('pointerup', (e) => {
  const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
  const duration = performance.now() - pointerDownTime;

  // Ignore if user was orbiting/dragging (distance > 8px or duration > 400ms)
  if (dist > 8 || duration > 400) return;

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Intersect against all planet and dwarf planet groups
  const allClickable = [
    ...planets.map(p => p.group),
    ...Object.values(dwarfPlanets.dwarfs).map(d => d.group),
  ];
  const intersects = raycaster.intersectObjects(allClickable, true);

  if (intersects.length > 0) {
    const targetSection = getIntersectedSection(intersects[0].object);
    if (targetSection !== null) {
      sound.playClick();
      scrollManager.goTo(targetSection);
    }
  }
});

// Interactive hover cursor
renderer.domElement.addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const allClickable = [
    ...planets.map(p => p.group),
    ...Object.values(dwarfPlanets.dwarfs).map(d => d.group),
  ];
  const intersects = raycaster.intersectObjects(allClickable, true);

  if (intersects.length > 0 && getIntersectedSection(intersects[0].object) !== null) {
    renderer.domElement.style.cursor = 'pointer';
  } else {
    renderer.domElement.style.cursor = 'grab';
  }
});

const orbits = [
  { obj: mercury, key: 'mercury', initAngle: 30 },
  { obj: venus, key: 'venus', initAngle: 85 },
  { obj: earth, key: 'earth', initAngle: 150 },
  { obj: mars, key: 'mars', initAngle: 210 },
  { obj: jupiter, key: 'jupiter', initAngle: 265 },
  { obj: saturn, key: 'saturn', initAngle: 320 },
  { obj: uranus, key: 'uranus', initAngle: 15 },
  { obj: neptune, key: 'neptune', initAngle: 60 },
];

const SECTION_PLANET = {
  2: mercury, 3: venus, 4: earth, 5: earth,
  6: mars, 7: jupiter, 8: saturn, 9: uranus, 10: neptune,
  13: dwarfPlanets.dwarfs.ceres,
  14: dwarfPlanets.dwarfs.pluto,
  15: dwarfPlanets.dwarfs.haumea,
  16: dwarfPlanets.dwarfs.makemake,
  17: dwarfPlanets.dwarfs.eris,
};

const CAM_PARAMS = {
  2: [-1, 0.8, 2.5],
  3: [2, 1.5, 4],
  4: [-2, 1.5, 4.5],
  5: [1, 1.5, 5],
  6: [1.5, 1, 3.5],
  7: [-3, 4, 10],
  8: [4, 6, 12],
  9: [-2, 3, 7],
  10: [2, 2.5, 6],
  13: [0.8, 0.6, 2.0], // Ceres
  14: [-1.2, 0.8, 2.5], // Pluto
  15: [1.2, 0.6, 2.2], // Haumea
  16: [-0.9, 0.6, 2.2], // Makemake
  17: [1.0, 0.8, 2.4], // Eris
};

scrollManager.setCameraResolver((index) => {
  const planet = SECTION_PLANET[index];
  const params = CAM_PARAMS[index];
  if (planet && params) {
    const p = planet.group.position;
    return camFromPosition(p.x, p.z, ...params);
  }
  return SECTION_CAMERAS[index];
});

controls.target.set(...SECTION_CAMERAS[0].look);

const clock = new THREE.Clock();
let elapsed = 0;
const _moonWorldPos = new THREE.Vector3();
const _trackDelta = new THREE.Vector3();

const dateDisplayEl = document.getElementById('scifi-date-text');
const distanceTextEl = document.getElementById('scifi-distance-text');
const rulerPointerEl = document.getElementById('scifi-ruler-pointer');

// Top Right HUD Controls (Sound, View; NO Upgrade Button)
const scifiSoundBtn = document.getElementById('scifi-sound-btn');
if (scifiSoundBtn) {
  scifiSoundBtn.addEventListener('click', () => {
    const isMuted = sound.toggleMute();
    scifiSoundBtn.classList.toggle('active', !isMuted);
    sound.playClick();
  });
}

const scifiViewBtn = document.getElementById('scifi-view-btn');
if (scifiViewBtn) {
  scifiViewBtn.addEventListener('click', () => {
    const cVis = constellationLines.toggle();
    planetLabels.toggle();
    scifiViewBtn.classList.toggle('active', cVis);
    sound.playClick();
  });
}

// Left Dock Controls (Orrery, Trainer, Telemetry, Search)
const btnOrrery = document.getElementById('scifi-btn-orrery');
if (btnOrrery) {
  btnOrrery.addEventListener('click', () => {
    sound.playClick();
    if (gameManager.gameMode === 'mission') {
      gameManager.toggleMode(); // Return to explorer
    }
    scrollManager.goTo(0);
    if (planetFocusCard) planetFocusCard.hide();
    setSolarSystemFocus(null);
  });
}

const btnTrainer = document.getElementById('scifi-btn-trainer');
if (btnTrainer) {
  btnTrainer.addEventListener('click', () => {
    sound.playClick();
    if (planetFocusCard) planetFocusCard.hide();
    gameManager.toggleMode();
  });
}

const btnSettings = document.getElementById('scifi-btn-settings');
if (btnSettings) {
  btnSettings.addEventListener('click', () => {
    sound.playClick();
    gameManager.openDossier(1);
  });
}

const btnSearch = document.getElementById('scifi-btn-search');
if (btnSearch) {
  btnSearch.addEventListener('click', () => {
    sound.playClick();
    cosmicExplorer.open();
  });
}

// Bottom Bar Play/Pause Toggle
const scifiPlayBtn = document.getElementById('scifi-play-btn');
const scifiPlayIcon = document.getElementById('scifi-play-icon');
if (scifiPlayBtn) {
  scifiPlayBtn.addEventListener('click', () => {
    ephemeris.isPlaying = !ephemeris.isPlaying;
    sound.playClick();
    if (scifiPlayIcon) {
      if (ephemeris.isPlaying) {
        scifiPlayIcon.innerHTML = '<polygon points="6 4 19 12 6 20 6 4"></polygon>';
      } else {
        scifiPlayIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
      }
    }
  });
}

function updateOrbits() {
  const ephemData = ephemeris.getPlanetaryPositions();
  for (const o of orbits) {
    const pData = ephemData[o.key];
    if (pData) {
      const r = ORBIT_RADII[o.key];
      const angle = pData.heliocentricLongitudeRad;
      o.obj.group.position.x = Math.cos(angle) * r;
      o.obj.group.position.z = Math.sin(angle) * r;
    }
  }
  return ephemData;
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  elapsed += delta;

  // Advance real-time ephemeris and position planets accordingly
  ephemeris.update(delta);
  const ephemData = updateOrbits();
  planetLabels.update(camera, ephemData);
  dwarfPlanets.update(elapsed, delta, ephemData);

  // Update Sci-Fi Bottom Date Display
  if (dateDisplayEl) {
    dateDisplayEl.textContent = ephemeris.formatDisplayDate();
  }

  // Update Sci-Fi Right Distance Gauge AU
  if (distanceTextEl) {
    const distTarget = camera.position.distanceTo(controls.target);
    const distAU = (distTarget / 30.0).toFixed(2);
    distanceTextEl.textContent = `DISTANCE ${distAU} AU`;

    if (rulerPointerEl) {
      const t = Math.min(Math.max((Math.log10(Math.max(distTarget, 1)) - 0.5) / 2.3, 0), 1);
      rulerPointerEl.style.top = `${t * 78 + 11}%`;
    }
  }

  scrollManager.update(delta, controls);
  structureManager.update(delta);
  starField.update(elapsed);
  comet.update(elapsed, delta);
  spaceDebris.update(elapsed, delta, earth.group.position);

  const section = scrollManager.activeSection;

  if (scrollManager.transitioning && SECTION_PLANET[section] && CAM_PARAMS[section]) {
    const planet = SECTION_PLANET[section];
    const params = CAM_PARAMS[section];
    const cam = camFromPosition(planet.group.position.x, planet.group.position.z, ...params);
    scrollManager.updateTransitionTarget(cam.pos, cam.look);
  }

  if (!scrollManager.transitioning) {
    let trackTarget = null;
    if (section === 5) {
      earth.moon.getWorldPosition(_moonWorldPos);
      trackTarget = _moonWorldPos;
    } else if (SECTION_PLANET[section]) {
      trackTarget = SECTION_PLANET[section].group.position;
    }

    if (trackTarget) {
      _trackDelta.subVectors(trackTarget, controls.target);
      controls.target.add(_trackDelta);
      camera.position.add(_trackDelta);
    }

    controls.update();
  }

  for (const p of planets) {
    if (p.group.visible) p.update(elapsed, delta);
  }

  sceneManager.render();
}

animate();
overlay.hideLoading();
