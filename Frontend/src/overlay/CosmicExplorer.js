import { COSMIC_CATALOG } from '../config/cosmicCatalog.js';
import { sound } from '../game/SoundEffects.js';

export class CosmicExplorer {
  constructor(scrollManager, camera, controls, spaceDebris, comet) {
    this.scrollManager = scrollManager;
    this.camera = camera;
    this.controls = controls;
    this.spaceDebris = spaceDebris;
    this.comet = comet;

    this.activeTab = 'planets'; // 'planets' | 'stars' | 'dwarfs'
    this.activeMoonsDropdown = null;

    this.modalEl = document.getElementById('cosmic-explorer-modal');
    this.triggerBtn = document.getElementById('cosmic-explore-btn');
    this.dockSearchBtn = document.getElementById('scifi-btn-search');

    this._bindEvents();
  }

  _bindEvents() {
    if (this.triggerBtn) {
      this.triggerBtn.addEventListener('click', () => this.open());
    }

    if (this.dockSearchBtn) {
      this.dockSearchBtn.addEventListener('click', () => this.open());
    }

    document.addEventListener('click', (e) => {
      // Close / Back button
      const closeBtn = e.target.closest('#close-cosmic-modal-btn, .scifi-explorer-back');
      if (closeBtn) {
        if (this.activeTab === 'dwarfs') {
          this.activeTab = 'planets';
          this._render();
        } else {
          this.close();
        }
        return;
      }

      // Switch between Planets and Stars tabs
      const tabBtn = e.target.closest('[data-explorer-tab]');
      if (tabBtn) {
        this.activeTab = tabBtn.dataset.explorerTab;
        this.activeMoonsDropdown = null;
        sound.playClick();
        this._render();
        return;
      }

      // Planet Tile Click
      const planetTile = e.target.closest('[data-planet-target]');
      if (planetTile && !e.target.closest('.moons-pill')) {
        const target = planetTile.dataset.planetTarget;
        if (target === 'dwarfs') {
          this.activeTab = 'dwarfs';
          sound.playClick();
          this._render();
        } else {
          this.flyToPlanet(target);
        }
        return;
      }

      // Moon Direct Click
      const moonDirect = e.target.closest('[data-moon-target]');
      if (moonDirect) {
        e.stopPropagation();
        const section = parseInt(moonDirect.dataset.moonTarget);
        this.flyToSection(section, 'Earth\'s Moon');
        return;
      }

      // Moons Dropdown Toggle
      const moonsDropdownBtn = e.target.closest('[data-moons-toggle]');
      if (moonsDropdownBtn) {
        e.stopPropagation();
        const planetKey = moonsDropdownBtn.dataset.moonsToggle;
        this.activeMoonsDropdown = (this.activeMoonsDropdown === planetKey) ? null : planetKey;
        sound.playClick();
        this._render();
        return;
      }

      // Star Item Click
      const starItem = e.target.closest('[data-star-name]');
      if (starItem) {
        const starName = starItem.dataset.starName;
        const starType = starItem.dataset.starType;
        this.lookAtStar(starName, starType);
        return;
      }

      // Close moons dropdown when clicking outside
      if (!e.target.closest('.moons-dropdown-container') && this.activeMoonsDropdown) {
        this.activeMoonsDropdown = null;
        this._render();
      }
    });
  }

  open(tab = 'planets') {
    this.activeTab = tab;
    this.activeMoonsDropdown = null;
    sound.playClick();
    if (!this.modalEl) return;
    this._render();
    this.modalEl.style.display = 'flex';
  }

  close() {
    sound.playClick();
    if (this.modalEl) {
      this.modalEl.style.display = 'none';
    }
  }

  flyToPlanet(key) {
    const sectionMap = {
      sun: 1,
      mercury: 2,
      venus: 3,
      earth: 4,
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

    const section = sectionMap[key];
    if (typeof section === 'number') {
      this.close();
      sound.playLaser();
      this.scrollManager.goTo(section);
      sound.speak(`Approaching ${key.toUpperCase()}!`);
    }
  }

  flyToSection(section, name) {
    this.close();
    sound.playLaser();
    this.scrollManager.goTo(section);
    sound.speak(`Navigating to ${name}!`);
  }

  lookAtStar(name, type) {
    this.close();
    sound.playTone(880, 0.15, 'sine', 0.12);
    sound.speak(`Targeting ${name}, ${type}.`);
    // Re-orient camera towards the outer starfield
    if (this.camera && this.controls) {
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.6;
      const r = 240;
      this.camera.position.set(r * Math.cos(phi) * Math.cos(theta), r * Math.sin(phi), r * Math.cos(phi) * Math.sin(theta));
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }
  }

  _render() {
    if (!this.modalEl) return;

    this.modalEl.innerHTML = `
      <div class="scifi-explorer-tablet">
        <!-- Tablet Beveled Corners / Top-Bottom Notches -->
        <div class="tablet-notch-top"></div>
        <div class="tablet-notch-bottom"></div>

        <!-- Left Back Arrow Tab (Images 1 & 2) -->
        <button class="scifi-explorer-back" title="Back / Exit">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>

        <!-- Top Header / View Switcher -->
        <div class="explorer-top-bar">
          <div class="explorer-tabs">
            <button class="explorer-tab-btn ${this.activeTab === 'planets' ? 'active' : ''}" data-explorer-tab="planets">
              🪐 SOLAR SYSTEM
            </button>
            <button class="explorer-tab-btn ${this.activeTab === 'stars' ? 'active' : ''}" data-explorer-tab="stars">
              ⭐ STARS & GIANTS
            </button>
            <button class="explorer-tab-btn ${this.activeTab === 'dwarfs' ? 'active' : ''}" data-explorer-tab="dwarfs">
              🌑 DWARF WORLDS
            </button>
          </div>
        </div>

        <!-- Content Body -->
        <div class="explorer-body">
          ${this.activeTab === 'planets' ? this._renderPlanetsGrid() : ''}
          ${this.activeTab === 'stars' ? this._renderStarsGrid() : ''}
          ${this.activeTab === 'dwarfs' ? this._renderDwarfsGrid() : ''}
        </div>
      </div>
    `;
  }

  _renderPlanetsGrid() {
    return `
      <div class="explorer-planets-grid">
        <!-- Row 1: Sun & Dwarf Planets -->
        <div class="planet-tile-wrapper" data-planet-target="sun">
          <div class="planet-tile">
            <div class="celestial-sphere sun-sphere"></div>
            <span class="planet-label">SUN</span>
          </div>
        </div>

        <div class="planet-tile-wrapper" data-planet-target="dwarfs">
          <div class="planet-tile">
            <div class="celestial-sphere dwarf-sphere"></div>
            <span class="planet-label">DWARF PLANETS</span>
          </div>
        </div>

        <div class="tile-spacer"></div>
        <div class="tile-spacer"></div>

        <!-- Row 2: Mercury, Venus, Earth, Mars -->
        <div class="planet-tile-wrapper" data-planet-target="mercury">
          <div class="planet-tile">
            <div class="celestial-sphere mercury-sphere"></div>
            <span class="planet-label">MERCURY</span>
          </div>
        </div>

        <div class="planet-tile-wrapper" data-planet-target="venus">
          <div class="planet-tile">
            <div class="celestial-sphere venus-sphere"></div>
            <span class="planet-label">VENUS</span>
          </div>
        </div>

        <div class="planet-tile-wrapper compound-tile" data-planet-target="earth">
          <div class="planet-tile">
            <div class="celestial-sphere earth-sphere"></div>
            <span class="planet-label">EARTH</span>
          </div>
          <button class="moons-pill direct" data-moon-target="5" title="Fly to Moon">
            <div class="mini-moon-sphere"></div>
            <span>MOON</span>
          </button>
        </div>

        <div class="planet-tile-wrapper compound-tile" data-planet-target="mars">
          <div class="planet-tile">
            <div class="celestial-sphere mars-sphere"></div>
            <span class="planet-label">MARS</span>
          </div>
          <button class="moons-pill dropdown-toggle" data-moons-toggle="mars" title="View Moons">
            <span>MOONS</span>
            <span class="pill-arrow">▼</span>
          </button>
          ${this.activeMoonsDropdown === 'mars' ? `
            <div class="moons-dropdown-menu">
              <div class="moon-item" data-planet-target="mars">Phobos</div>
              <div class="moon-item" data-planet-target="mars">Deimos</div>
            </div>
          ` : ''}
        </div>

        <!-- Row 3: Jupiter, Saturn, Uranus, Neptune -->
        <div class="planet-tile-wrapper compound-tile" data-planet-target="jupiter">
          <div class="planet-tile">
            <div class="celestial-sphere jupiter-sphere"></div>
            <span class="planet-label">JUPITER</span>
          </div>
          <button class="moons-pill dropdown-toggle" data-moons-toggle="jupiter" title="View Moons">
            <span>MOONS</span>
            <span class="pill-arrow">▼</span>
          </button>
          ${this.activeMoonsDropdown === 'jupiter' ? `
            <div class="moons-dropdown-menu">
              <div class="moon-item" data-planet-target="jupiter">Io</div>
              <div class="moon-item" data-planet-target="jupiter">Europa</div>
              <div class="moon-item" data-planet-target="jupiter">Ganymede</div>
              <div class="moon-item" data-planet-target="jupiter">Callisto</div>
            </div>
          ` : ''}
        </div>

        <div class="planet-tile-wrapper compound-tile" data-planet-target="saturn">
          <div class="planet-tile">
            <div class="celestial-sphere saturn-sphere">
              <div class="saturn-ring-css"></div>
            </div>
            <span class="planet-label">SATURN</span>
          </div>
          <button class="moons-pill dropdown-toggle" data-moons-toggle="saturn" title="View Moons">
            <span>MOONS</span>
            <span class="pill-arrow">▼</span>
          </button>
          ${this.activeMoonsDropdown === 'saturn' ? `
            <div class="moons-dropdown-menu">
              <div class="moon-item" data-planet-target="saturn">Titan</div>
              <div class="moon-item" data-planet-target="saturn">Enceladus</div>
              <div class="moon-item" data-planet-target="saturn">Mimas</div>
            </div>
          ` : ''}
        </div>

        <div class="planet-tile-wrapper compound-tile" data-planet-target="uranus">
          <div class="planet-tile">
            <div class="celestial-sphere uranus-sphere"></div>
            <span class="planet-label">URANUS</span>
          </div>
          <button class="moons-pill dropdown-toggle" data-moons-toggle="uranus" title="View Moons">
            <span>MOONS</span>
            <span class="pill-arrow">▼</span>
          </button>
          ${this.activeMoonsDropdown === 'uranus' ? `
            <div class="moons-dropdown-menu">
              <div class="moon-item" data-planet-target="uranus">Titania</div>
              <div class="moon-item" data-planet-target="uranus">Oberon</div>
              <div class="moon-item" data-planet-target="uranus">Miranda</div>
            </div>
          ` : ''}
        </div>

        <div class="planet-tile-wrapper compound-tile" data-planet-target="neptune">
          <div class="planet-tile">
            <div class="celestial-sphere neptune-sphere"></div>
            <span class="planet-label">NEPTUNE</span>
          </div>
          <button class="moons-pill dropdown-toggle" data-moons-toggle="neptune" title="View Moons">
            <span>MOONS</span>
            <span class="pill-arrow">▼</span>
          </button>
          ${this.activeMoonsDropdown === 'neptune' ? `
            <div class="moons-dropdown-menu">
              <div class="moon-item" data-planet-target="neptune">Triton</div>
              <div class="moon-item" data-planet-target="neptune">Proteus</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  _renderStarsGrid() {
    const stars = [
      { name: 'SIRIUS', type: 'binary star system', size: 'sm', color: '#e0f2fe' },
      { name: 'CANOPUS', type: 'bright giant', size: 'lg', color: '#ffffff' },
      { name: 'ALPHA CENTAURI', type: 'triple star system', size: 'sm', color: '#fef08a' },
      { name: 'ARCTURUS', type: 'orange giant', size: 'md', color: '#f59e0b' },
      { name: 'VEGA', type: 'main sequence star', size: 'sm', color: '#bae6fd' },
      { name: 'CAPELLA A', type: 'quadruple star system', size: 'sm', color: '#fde047' },
      { name: 'RIGEL', type: 'quadruple star system', size: 'lg', color: '#93c5fd' },
      { name: 'PROCYON', type: 'binary star system', size: 'sm', color: '#e2e8f0' },
      { name: 'ACHERNAR', type: 'binary star system', size: 'sm', color: '#bfdbfe' },
      { name: 'BETELGEUSE', type: 'red supergiant', size: 'xl', color: '#ea580c' },
      { name: 'BETA CENTAURI A', type: 'triple star system', size: 'sm', color: '#c7d2fe' },
      { name: 'ALTAIR', type: 'main sequence star', size: 'sm', color: '#e0f2fe' },
      { name: 'ALPHA CRUCIS A', type: 'triple star system', size: 'sm', color: '#93c5fd' },
      { name: 'ALDEBARAN', type: 'orange giant', size: 'md', color: '#f97316' },
      { name: 'ANTARES', type: 'binary star system', size: 'xl', color: '#ea580c' },
      { name: 'SPICA', type: 'binary star system', size: 'sm', color: '#93c5fd' },
      { name: 'POLLUX', type: 'orange giant', size: 'sm', color: '#fb923c' },
      { name: 'FOMALHAUT', type: 'main sequence star', size: 'sm', color: '#e0f2fe' },
    ];

    return `
      <div class="explorer-stars-container">
        <div class="explorer-stars-grid">
          ${stars.map(s => `
            <div class="star-card" data-star-name="${s.name}" data-star-type="${s.type}">
              <div class="star-icon-wrap">
                <span class="star-dot ${s.size}" style="background: ${s.color}; box-shadow: 0 0 10px ${s.color};"></span>
              </div>
              <div class="star-info">
                <span class="star-name">${s.name}</span>
                <span class="star-type">${s.type}</span>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="stars-scroll-track">
          <span class="scroll-arrow top">▲</span>
          <div class="scroll-thumb"></div>
          <span class="scroll-arrow btm">▼</span>
        </div>
      </div>
    `;
  }

  _renderDwarfsGrid() {
    const dwarfs = [
      { key: 'ceres', name: 'CERES', desc: 'Largest asteroid in the main asteroid belt (2.77 AU)', color: '#94a3b8' },
      { key: 'pluto', name: 'PLUTO', desc: 'Kuiper Belt dwarf planet with Sputnik Planitia & Charon (39.5 AU)', color: '#c4b59f' },
      { key: 'haumea', name: 'HAUMEA', desc: 'Fast-spinning ellipsoidal dwarf with ring system (43.1 AU)', color: '#cbd5e1' },
      { key: 'makemake', name: 'MAKEMAKE', desc: 'Frozen methane & tholin ice world (45.8 AU)', color: '#d97706' },
      { key: 'eris', name: 'ERIS', desc: 'Massive scattered disc dwarf with Dysnomia (67.8 AU)', color: '#93c5fd' },
    ];

    return `
      <div class="explorer-dwarfs-grid">
        ${dwarfs.map(d => `
          <div class="dwarf-card" data-planet-target="${d.key}">
            <div class="celestial-sphere" style="background: radial-gradient(circle at 35% 35%, #fff, ${d.color} 60%, #111); box-shadow: 0 0 12px ${d.color}88;"></div>
            <div class="dwarf-info">
              <span class="dwarf-name">${d.name}</span>
              <span class="dwarf-desc">${d.desc}</span>
            </div>
            <span class="dwarf-visit-tag" style="margin-left:auto; font-family:var(--font-heading); font-size:10px; font-weight:700; color:#38bdf8;">VISIT ▶</span>
          </div>
        `).join('')}
      </div>
    `;
  }
}
