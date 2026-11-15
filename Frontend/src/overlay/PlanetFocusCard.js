import { PLANETS } from '../config/planets.js';
import { PLANET_STRUCTURES } from '../config/structures.js';
import { COSMIC_CATALOG } from '../config/cosmicCatalog.js';
import { PLANET_ENCYCLOPEDIA } from '../config/planetEncyclopedia.js';
import { sound } from '../game/SoundEffects.js';

export class PlanetFocusCard {
  constructor(options = {}) {
    this.onVisitCallback = options.onVisit || (() => {});
    this.onStructureCallback = options.onStructure || (() => {});
    this.onCloseStructureCallback = options.onCloseStructure || (() => {});
    this.onSolarSystemCallback = options.onSolarSystem || (() => {});
    this.onSwitchPlanetCallback = options.onSwitchPlanet || (() => {});
    this.onNightSkyCallback = options.onNightSky || (() => {});
    this.onOpenSwitchModal = options.onOpenSwitchModal || null;
    this.onOpenNightSkyModal = options.onOpenNightSkyModal || null;
    this.onMarsLandCallback = options.onMarsLand || (() => {});
    this.onEarthLandCallback = options.onEarthLand || (() => {});
    this.onMoonLandCallback = options.onMoonLand || (() => {});

    this.currentKey = null;
    this.currentSection = null;
    this.currentMode = 'menu'; // 'menu' | 'structure' | 'encyclopedia'
    this.isCollapsed = false;

    // Ordered list of major & dwarf bodies for the "<> SWITCH PLANET" diamond button
    this.planetCycle = [
      'mercury', 'venus', 'earth', 'mars', 'ceres', 'jupiter', 'saturn', 'uranus', 'neptune',
      'pluto', 'haumea', 'makemake', 'eris'
    ];
    this.planetSectionMap = {
      sun: 1,
      mercury: 2,
      venus: 3,
      earth: 4,
      moon: 5,
      mars: 6,
      jupiter: 7,
      saturn: 8,
      uranus: 9,
      neptune: 10,
      blackhole: 11,
      ceres: 13,
      pluto: 14,
      haumea: 15,
      makemake: 16,
      eris: 17,
    };

    this.cardEl = document.getElementById('planet-focus-card');
    this.collapseTab = document.getElementById('pcard-collapse-tab');
    this.backBtn = document.getElementById('pcard-back-btn');
    this.titleEl = document.getElementById('pcard-title');
    this.subtitleEl = document.getElementById('pcard-subtitle');

    this.menuView = document.getElementById('pcard-menu-view');
    this.structureView = document.getElementById('pcard-structure-view');
    this.encyclopediaView = document.getElementById('pcard-encyclopedia-view');

    this.structureContent = document.getElementById('pcard-structure-content');
    this.encyclopediaContent = document.getElementById('pcard-encyclopedia-content');

    this.btnVisit = document.getElementById('pcard-btn-visit');
    this.btnEncyclopedia = document.getElementById('pcard-btn-encyclopedia');
    this.btnStructure = document.getElementById('pcard-btn-structure');
    this.btnMarsLand = document.getElementById('pcard-btn-mars-land');

    this.btnSwitch = document.getElementById('pcard-btn-switch');
    this.btnNightSky = document.getElementById('pcard-btn-nightsky');
    this.btnSolarSystem = document.getElementById('pcard-btn-solarsystem');

    this._bindEvents();
  }

  _bindEvents() {
    // Collapse/Expand tab
    if (this.collapseTab) {
      this.collapseTab.addEventListener('click', () => {
        this.isCollapsed = !this.isCollapsed;
        this.cardEl.classList.toggle('collapsed', this.isCollapsed);
        this.collapseTab.textContent = this.isCollapsed ? '▶' : '◀';
        sound.playClick();
      });
    }

    // Back button
    if (this.backBtn) {
      this.backBtn.addEventListener('click', () => {
        sound.playClick();
        if (this.currentMode === 'structure') {
          this.onCloseStructureCallback();
        }
        this.setMode('menu');
      });
    }

    // Menu Actions
    if (this.btnVisit) {
      this.btnVisit.addEventListener('click', () => {
        sound.playClick();
        this.onVisitCallback(this.currentKey, this.currentSection);
      });
    }

    if (this.btnEncyclopedia) {
      this.btnEncyclopedia.addEventListener('click', () => {
        sound.playClick();
        this.setMode('encyclopedia');
      });
    }

    if (this.btnStructure) {
      this.btnStructure.addEventListener('click', () => {
        sound.playClick();
        this.setMode('structure');
        this.onStructureCallback(this.currentKey, this.currentSection);
      });
    }

    if (this.btnMarsLand) {
      this.btnMarsLand.addEventListener('click', () => {
        sound.playLaser();
        if (this.currentKey === 'earth') {
          this.onEarthLandCallback();
        } else if (this.currentKey === 'moon') {
          this.onMoonLandCallback();
        } else {
          this.onMarsLandCallback();
        }
      });
    }

    // Diamonds
    if (this.btnSwitch) {
      this.btnSwitch.addEventListener('click', () => {
        sound.playClick();
        if (this.onOpenSwitchModal) {
          this.onOpenSwitchModal();
        } else {
          this._switchNextPlanet();
        }
      });
    }

    if (this.btnNightSky) {
      this.btnNightSky.addEventListener('click', () => {
        sound.playClick();
        if (this.onOpenNightSkyModal) {
          this.onOpenNightSkyModal();
        } else {
          this.onNightSkyCallback();
        }
      });
    }

    if (this.btnSolarSystem) {
      this.btnSolarSystem.addEventListener('click', () => {
        sound.playClick();
        this.hide();
        this.onSolarSystemCallback();
      });
    }
  }

  _switchNextPlanet() {
    const idx = this.planetCycle.indexOf(this.currentKey);
    const nextIdx = (idx + 1) % this.planetCycle.length;
    const nextKey = this.planetCycle[nextIdx];
    const nextSection = this.planetSectionMap[nextKey];
    this.onSwitchPlanetCallback(nextKey, nextSection);
  }

  showPlanet(key, section) {
    this.currentKey = key;
    this.currentSection = section;
    this.isCollapsed = false;

    if (this.cardEl) {
      this.cardEl.classList.remove('hidden');
      this.cardEl.classList.remove('collapsed');
      if (this.collapseTab) this.collapseTab.textContent = '◀';
    }

    const name = key.toUpperCase();
    if (this.titleEl) this.titleEl.textContent = name;
    if (this.subtitleEl) {
      if (key === 'sun') this.subtitleEl.textContent = 'STAR';
      else if (key === 'moon') this.subtitleEl.textContent = 'NATURAL SATELLITE';
      else if (['ceres', 'pluto', 'haumea', 'makemake', 'eris'].includes(key.toLowerCase())) this.subtitleEl.textContent = 'DWARF PLANET';
      else this.subtitleEl.textContent = 'PLANET';
    }

    // Toggle button text between "PLANET SYSTEM" (Image 1) and "VISIT" (Image 4)
    if (this.btnVisit) {
      const visitSpan = this.btnVisit.querySelector('span');
      if (visitSpan) {
        visitSpan.textContent = (section === 0 || key === 'overview') ? 'VISIT' : 'PLANET SYSTEM';
      }
    }

    // Show/hide Visit Base button for Earth (Spaceport Base), Moon (Artemis Base), Mars (Colony Base)
    if (this.btnMarsLand) {
      if (key === 'earth') {
        this.btnMarsLand.style.display = 'flex';
        const span = this.btnMarsLand.querySelector('span');
        if (span) span.textContent = '🌍 VISIT EARTH BASE';
      } else if (key === 'moon') {
        this.btnMarsLand.style.display = 'flex';
        const span = this.btnMarsLand.querySelector('span');
        if (span) span.textContent = '🌕 LAND ON THE MOON';
      } else if (key === 'mars') {
        this.btnMarsLand.style.display = 'flex';
        const span = this.btnMarsLand.querySelector('span');
        if (span) span.textContent = '🔴 LAND ON MARS';
      } else {
        this.btnMarsLand.style.display = 'none';
      }
    }

    // Start in menu mode
    this.setMode('menu');
  }

  hide() {
    if (this.cardEl) {
      this.cardEl.classList.add('hidden');
    }
    if (this.currentMode === 'structure') {
      this.onCloseStructureCallback();
    }
    this.currentMode = 'menu';
  }

  setMode(mode) {
    this.currentMode = mode;
    if (this.cardEl) {
      this.cardEl.setAttribute('data-mode', mode);
    }

    if (mode === 'menu') {
      if (this.backBtn) this.backBtn.style.display = 'none';
      if (this.menuView) this.menuView.style.display = 'block';
      if (this.structureView) this.structureView.style.display = 'none';
      if (this.encyclopediaView) this.encyclopediaView.style.display = 'none';
    } else if (mode === 'structure') {
      if (this.backBtn) this.backBtn.style.display = 'flex';
      if (this.menuView) this.menuView.style.display = 'none';
      if (this.structureView) this.structureView.style.display = 'block';
      if (this.encyclopediaView) this.encyclopediaView.style.display = 'none';
      this._renderStructureContent();
    } else if (mode === 'encyclopedia') {
      if (this.backBtn) this.backBtn.style.display = 'flex';
      if (this.menuView) this.menuView.style.display = 'none';
      if (this.structureView) this.structureView.style.display = 'none';
      if (this.encyclopediaView) this.encyclopediaView.style.display = 'block';
      this._renderEncyclopediaContent();
    }
  }

  _renderStructureContent() {
    if (!this.structureContent) return;

    const data = PLANET_STRUCTURES[this.currentKey] || PLANET_STRUCTURES.earth;
    let html = '';

    // General Structure overview
    html += `
      <div class="structure-section-block">
        <h3 class="structure-sec-heading">STRUCTURE</h3>
        <p class="structure-sec-p">${data.description || "Geological composition and differentiated internal layers."}</p>
      </div>
    `;

    // Render layers in outward-to-inward or inward-to-outward order
    // Order in screenshots: Mantle, Outer Core, Inner Core
    const layers = [...data.layers].reverse(); // from Crust -> Mantle -> Outer Core -> Inner Core
    for (const layer of layers) {
      html += `
        <div class="structure-section-block" id="pcard-layer-${layer.id}">
          <h3 class="structure-sec-heading">${layer.name.toUpperCase()}</h3>
          <p class="structure-sec-p">${layer.fact || layer.composition || "Extreme high pressure and thermal layer."}</p>
        </div>
      `;
    }

    this.structureContent.innerHTML = html;
  }

  _renderEncyclopediaContent() {
    if (!this.encyclopediaContent) return;

    const key = (this.currentKey || 'earth').toLowerCase();
    const dossier = PLANET_ENCYCLOPEDIA[key] || PLANET_ENCYCLOPEDIA.earth;

    let html = `
      <div class="encyclopedia-dossier-root">
        <!-- HEADER -->
        <div class="encyclopedia-hero">
          <div class="encyclopedia-symbol-badge">${dossier.symbol || '🪐'}</div>
          <div class="encyclopedia-hero-meta">
            <div class="encyclopedia-hero-badge">${dossier.classification}</div>
            <h2 class="encyclopedia-hero-name">${dossier.name}</h2>
            <div class="encyclopedia-hero-designation">${dossier.designation}</div>
          </div>
        </div>

        <p class="encyclopedia-hero-tagline">${dossier.tagline}</p>

        <!-- ASTRONOMICAL TELEMETRY (10-POINT GRID) -->
        <div class="encyclopedia-section">
          <div class="encyclopedia-section-title">
            <span class="sec-dot cyan"></span> ORBITAL & PHYSICAL TELEMETRY
          </div>
          <div class="encyclopedia-telemetry-grid">
            <div class="encyclopedia-stat-card">
              <span class="stat-lbl">DISTANCE</span>
              <span class="stat-val highlight">${dossier.stats.distance}</span>
            </div>
            <div class="encyclopedia-stat-card">
              <span class="stat-lbl">ORBIT PERIOD</span>
              <span class="stat-val">${dossier.stats.orbitPeriod}</span>
            </div>
            <div class="encyclopedia-stat-card">
              <span class="stat-lbl">ORBIT SPEED</span>
              <span class="stat-val">${dossier.stats.orbitSpeed}</span>
            </div>
            <div class="encyclopedia-stat-card">
              <span class="stat-lbl">DAY LENGTH</span>
              <span class="stat-val">${dossier.stats.rotation}</span>
            </div>
            <div class="encyclopedia-stat-card">
              <span class="stat-lbl">SURFACE GRAVITY</span>
              <span class="stat-val highlight">${dossier.stats.gravity}</span>
            </div>
            <div class="encyclopedia-stat-card">
              <span class="stat-lbl">SURFACE TEMP</span>
              <span class="stat-val">${dossier.stats.temperature}</span>
            </div>
            <div class="encyclopedia-stat-card">
              <span class="stat-lbl">DIAMETER</span>
              <span class="stat-val">${dossier.stats.diameter}</span>
            </div>
            <div class="encyclopedia-stat-card">
              <span class="stat-lbl">MASS</span>
              <span class="stat-val">${dossier.stats.mass}</span>
            </div>
            <div class="encyclopedia-stat-card">
              <span class="stat-lbl">NATURAL MOONS</span>
              <span class="stat-val">${dossier.stats.moons}</span>
            </div>
            <div class="encyclopedia-stat-card">
              <span class="stat-lbl">AXIAL TILT</span>
              <span class="stat-val">${dossier.stats.axialTilt}</span>
            </div>
          </div>
        </div>

        <!-- ATMOSPHERE & CLIMATE -->
        <div class="encyclopedia-section">
          <div class="encyclopedia-section-title">
            <span class="sec-dot blue"></span> ATMOSPHERIC CONDITIONS
          </div>
          <div class="encyclopedia-atm-card">
            <div class="atm-pressure-row">
              <span class="atm-label">SURFACE PRESSURE:</span>
              <span class="atm-value">${dossier.atmosphere.pressure}</span>
            </div>
            <div class="atm-gases-label">GAS COMPOSITION BREAKDOWN:</div>
            <div class="atm-gases-pills">
              ${dossier.atmosphere.gases.map(g => `
                <div class="gas-pill">
                  <span class="gas-name">${g.name}</span>
                  <span class="gas-pct">${g.pct}</span>
                </div>
              `).join('')}
            </div>
            <div class="atm-weather-box">
              <span class="weather-label">WEATHER & DYNAMICS:</span>
              <p class="weather-desc">${dossier.atmosphere.weather}</p>
            </div>
          </div>
        </div>

        <!-- GEOLOGY & LANDMARKS -->
        <div class="encyclopedia-section">
          <div class="encyclopedia-section-title">
            <span class="sec-dot orange"></span> GEOLOGY & NOTABLE LANDMARKS
          </div>
          <div class="encyclopedia-geo-card">
            <div class="geo-item">
              <span class="geo-lbl">TERRAIN & COMPOSITION:</span>
              <p class="geo-val">${dossier.geology.terrain}</p>
            </div>
            <div class="geo-item">
              <span class="geo-lbl">PROMINENT LANDMARKS:</span>
              <p class="geo-val">${dossier.geology.landmarks}</p>
            </div>
          </div>
        </div>

        <!-- EXPLORATION HISTORY -->
        <div class="encyclopedia-section">
          <div class="encyclopedia-section-title">
            <span class="sec-dot green"></span> NASA & INTERNATIONAL EXPLORATION LOG
          </div>
          <div class="encyclopedia-missions-list">
            ${dossier.exploration.map(m => `
              <div class="ency-mission-row">
                <div class="mission-head">
                  <span class="mission-name">${m.mission}</span>
                  <span class="mission-agency">${m.agency} (${m.year})</span>
                </div>
                <div class="mission-note">${m.note}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- JUNIOR ASTRONAUT MISSION ADVISORY -->
        <div class="encyclopedia-section">
          <div class="encyclopedia-advisory-card">
            <div class="advisory-fact-row">
              <span class="advisory-icon">💡</span>
              <div class="advisory-text">
                <span class="advisory-title">DISCOVERY FACT</span>
                <p class="advisory-p">${dossier.juniorAstronaut.fact}</p>
              </div>
            </div>
            <div class="advisory-hazard-row">
              <span class="advisory-icon warn">⚠️</span>
              <div class="advisory-text">
                <span class="advisory-title warn">SURVIVAL HAZARD PROTOCOL</span>
                <p class="advisory-p">${dossier.juniorAstronaut.hazard}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.encyclopediaContent.innerHTML = html;
  }

  scrollToLayer(layerId) {
    if (this.currentMode !== 'structure') {
      this.setMode('structure');
    }
    const target = document.getElementById(`pcard-layer-${layerId}`);
    if (target && this.structureContent) {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

