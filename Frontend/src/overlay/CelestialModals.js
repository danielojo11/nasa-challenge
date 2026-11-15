import { sound } from '../game/SoundEffects.js';

export class CelestialModals {
  constructor(options = {}) {
    this.onSelectPlanet = options.onSelectPlanet || (() => {});
    this.onSelectStar = options.onSelectStar || (() => {});

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

    this.planetMoons = {
      mars: [
        { name: 'PHOBOS', key: 'mars', desc: 'Radius 11.2 km | Rapid Orbit' },
        { name: 'DEIMOS', key: 'mars', desc: 'Radius 6.2 km | Outer Moon' },
      ],
      jupiter: [
        { name: 'IO', key: 'jupiter', desc: '400+ Active Volcanoes' },
        { name: 'EUROPA', key: 'jupiter', desc: 'Subsurface Salty Ocean' },
        { name: 'GANYMEDE', key: 'jupiter', desc: 'Largest Moon in Solar System' },
        { name: 'CALLISTO', key: 'jupiter', desc: 'Heavily Cratered Ice World' },
      ],
      saturn: [
        { name: 'TITAN', key: 'saturn', desc: 'Dense N2 Atmosphere & Methane Lakes' },
        { name: 'ENCELADUS', key: 'saturn', desc: 'Cryovolcanic Geysers' },
        { name: 'MIMAS', key: 'saturn', desc: 'Giant Herschel Impact Crater' },
      ],
      uranus: [
        { name: 'MIRANDA', key: 'uranus', desc: 'Extreme 20km Verona Rupes Cliffs' },
        { name: 'TITANIA', key: 'uranus', desc: 'Largest Uranian Moon' },
        { name: 'OBERON', key: 'uranus', desc: 'Ancient Outer Ice/Rock Moon' },
      ],
      neptune: [
        { name: 'TRITON', key: 'neptune', desc: 'Retrograde Orbit & N2 Geysers' },
        { name: 'PROTEUS', key: 'neptune', desc: 'Irregular Dark Outer Moon' },
      ],
    };

    this.stars = [
      { name: 'SIRIUS', sub: 'binary star system', color: '#e0f2fe', size: 16, glow: '#38bdf8' },
      { name: 'CANOPUS', sub: 'bright giant', color: '#fef08a', size: 28, glow: '#facc15' },
      { name: 'ALPHA CENTAURI', sub: 'triple star system', color: '#fef3c7', size: 18, glow: '#f59e0b' },
      { name: 'ARCTURUS', sub: 'orange giant', color: '#fb923c', size: 22, glow: '#ea580c' },
      { name: 'VEGA', sub: 'main sequence star', color: '#e0e7ff', size: 17, glow: '#6366f1' },
      { name: 'CAPELLA A', sub: 'quadruple star system', color: '#fef08a', size: 20, glow: '#eab308' },
      { name: 'RIGEL', sub: 'quadruple star system', color: '#bae6fd', size: 30, glow: '#0284c7' },
      { name: 'PROCYON', sub: 'binary star system', color: '#f8fafc', size: 16, glow: '#94a3b8' },
      { name: 'ACHERNAR', sub: 'binary star system', color: '#bae6fd', size: 18, glow: '#38bdf8' },
      { name: 'BETELGEUSE', sub: 'red supergiant', color: '#f97316', size: 32, glow: '#c2410c' },
      { name: 'BETA CENTAURI A', sub: 'triple star system', color: '#c7d2fe', size: 19, glow: '#4f46e5' },
      { name: 'ALTAIR', sub: 'main sequence star', color: '#f1f5f9', size: 15, glow: '#cbd5e1' },
      { name: 'ALPHA CRUCIS A', sub: 'triple star system', color: '#bfdbfe', size: 18, glow: '#2563eb' },
      { name: 'ALDEBARAN', sub: 'orange giant', color: '#f97316', size: 24, glow: '#ea580c' },
      { name: 'ANTARES', sub: 'binary star system', color: '#ef4444', size: 32, glow: '#b91c1c' },
      { name: 'SPICA', sub: 'binary star system', color: '#bfdbfe', size: 17, glow: '#3b82f6' },
      { name: 'POLLUX', sub: 'giant star', color: '#fed7aa', size: 20, glow: '#f97316' },
      { name: 'FOMALHAUT', sub: 'main sequence star', color: '#e2e8f0', size: 16, glow: '#94a3b8' },
    ];

    this._createDOM();
    this._bindEvents();
  }

  _createDOM() {
    // 1. SWITCH PLANET MODAL (Image 5)
    this.switchModal = document.createElement('div');
    this.switchModal.id = 'modal-switch-planet';
    this.switchModal.className = 'celestial-modal hidden';
    this.switchModal.innerHTML = `
      <div class="celestial-modal-frame">
        <button class="celestial-tab-btn" id="switch-modal-back" title="Back to Solar System">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.8">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <div class="celestial-modal-inner">
          <div class="planet-picker-grid">
            <!-- Row 1: SUN & DWARF PLANETS -->
            <div class="planet-picker-row top-row">
              <div class="planet-picker-card" data-key="sun">
                <div class="picker-sphere sun-sphere"></div>
                <span class="picker-name">SUN</span>
              </div>
              <div class="planet-picker-card" id="picker-dwarf-btn">
                <div class="picker-sphere dwarf-sphere"></div>
                <span class="picker-name">DWARF PLANETS</span>
              </div>
            </div>

            <!-- Row 2: MERCURY, VENUS, EARTH (+ MOON), MARS (+ MOONS) -->
            <div class="planet-picker-row mid-row">
              <div class="planet-picker-card" data-key="mercury">
                <div class="picker-sphere mercury-sphere"></div>
                <span class="picker-name">MERCURY</span>
              </div>
              <div class="planet-picker-card" data-key="venus">
                <div class="picker-sphere venus-sphere"></div>
                <span class="picker-name">VENUS</span>
              </div>
              <div class="planet-picker-card earth-card" data-key="earth">
                <div class="earth-main-area" data-key="earth">
                  <div class="picker-sphere earth-sphere"></div>
                  <span class="picker-name">EARTH</span>
                </div>
                <div class="earth-moon-subbtn" data-key="moon" title="Focus the Moon">
                  <div class="picker-sphere moon-sphere"></div>
                  <span class="moon-subname">MOON</span>
                </div>
              </div>
              <div class="planet-picker-card has-moons" data-key="mars">
                <div class="planet-click-area" data-key="mars">
                  <div class="picker-sphere mars-sphere"></div>
                  <span class="picker-name">MARS</span>
                </div>
                <button class="picker-moons-tab" data-moon-parent="mars">
                  <span class="moon-arrow">▼</span>
                  <span class="moon-tab-txt">MOONS</span>
                </button>
              </div>
            </div>

            <!-- Row 3: JUPITER, SATURN, URANUS, NEPTUNE (+ MOONS) -->
            <div class="planet-picker-row btm-row">
              <div class="planet-picker-card has-moons" data-key="jupiter">
                <div class="planet-click-area" data-key="jupiter">
                  <div class="picker-sphere jupiter-sphere"></div>
                  <span class="picker-name">JUPITER</span>
                </div>
                <button class="picker-moons-tab" data-moon-parent="jupiter">
                  <span class="moon-arrow">▼</span>
                  <span class="moon-tab-txt">MOONS</span>
                </button>
              </div>
              <div class="planet-picker-card has-moons" data-key="saturn">
                <div class="planet-click-area" data-key="saturn">
                  <div class="picker-sphere saturn-sphere"></div>
                  <span class="picker-name">SATURN</span>
                </div>
                <button class="picker-moons-tab" data-moon-parent="saturn">
                  <span class="moon-arrow">▼</span>
                  <span class="moon-tab-txt">MOONS</span>
                </button>
              </div>
              <div class="planet-picker-card has-moons" data-key="uranus">
                <div class="planet-click-area" data-key="uranus">
                  <div class="picker-sphere uranus-sphere"></div>
                  <span class="picker-name">URANUS</span>
                </div>
                <button class="picker-moons-tab" data-moon-parent="uranus">
                  <span class="moon-arrow">▼</span>
                  <span class="moon-tab-txt">MOONS</span>
                </button>
              </div>
              <div class="planet-picker-card has-moons" data-key="neptune">
                <div class="planet-click-area" data-key="neptune">
                  <div class="picker-sphere neptune-sphere"></div>
                  <span class="picker-name">NEPTUNE</span>
                </div>
                <button class="picker-moons-tab" data-moon-parent="neptune">
                  <span class="moon-arrow">▼</span>
                  <span class="moon-tab-txt">MOONS</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Sub-Popovers for Moons and Dwarf Planets -->
          <div id="celestial-sub-popover" class="celestial-sub-popover hidden"></div>
        </div>
      </div>
    `;

    // 2. NIGHT SKY MODAL (Image 6)
    this.nightSkyModal = document.createElement('div');
    this.nightSkyModal.id = 'modal-night-sky';
    this.nightSkyModal.className = 'celestial-modal hidden';
    this.nightSkyModal.innerHTML = `
      <div class="celestial-modal-frame nightsky-frame">
        <button class="celestial-tab-btn" id="nightsky-modal-back" title="Back to Solar System">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.8">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <div class="celestial-modal-inner nightsky-inner">
          <div class="nightsky-header-bar">
            <span class="nightsky-badge">TELESCOPIC NIGHT SKY OBSERVATORY</span>
          </div>

          <div class="nightsky-grid-container" id="nightsky-grid">
            ${this.stars.map((star, idx) => `
              <div class="star-card-item" data-star-idx="${idx}">
                <div class="star-preview-circle" style="
                  width: ${star.size}px;
                  height: ${star.size}px;
                  background: ${star.color};
                  box-shadow: 0 0 16px ${star.glow}, 0 0 28px ${star.glow}88;
                "></div>
                <div class="star-info-col">
                  <span class="star-name">${star.name}</span>
                  <span class="star-type">${star.sub}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="nightsky-scroll-controls">
            <button class="nsky-scroll-btn" id="nsky-scroll-up">▲</button>
            <div class="nsky-scroll-track"><div class="nsky-scroll-thumb"></div></div>
            <button class="nsky-scroll-btn" id="nsky-scroll-down">▼</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.switchModal);
    document.body.appendChild(this.nightSkyModal);
  }

  _bindEvents() {
    // Switch Modal Back button
    const switchBack = document.getElementById('switch-modal-back');
    if (switchBack) {
      switchBack.addEventListener('click', () => {
        sound.playClick();
        this.closeSwitchPlanet();
      });
    }

    // Night Sky Modal Back button
    const nightSkyBack = document.getElementById('nightsky-modal-back');
    if (nightSkyBack) {
      nightSkyBack.addEventListener('click', () => {
        sound.playClick();
        this.closeNightSky();
      });
    }

    // Planet click delegation
    this.switchModal.addEventListener('click', (e) => {
      // Moon sub-button
      const moonBtn = e.target.closest('[data-key="moon"]');
      if (moonBtn) {
        sound.playClick();
        this._selectAndClose('moon');
        return;
      }

      // Moons dropdown toggle
      const moonsTab = e.target.closest('[data-moon-parent]');
      if (moonsTab) {
        e.stopPropagation();
        sound.playClick();
        const parentKey = moonsTab.dataset.moonParent;
        this._toggleMoonsPopover(parentKey, moonsTab);
        return;
      }

      // Dwarf Planets button
      const dwarfBtn = e.target.closest('#picker-dwarf-btn');
      if (dwarfBtn) {
        sound.playClick();
        this._showDwarfPlanetsPopover(dwarfBtn);
        return;
      }

      // Planet card / click area
      const planetArea = e.target.closest('[data-key]');
      if (planetArea) {
        const key = planetArea.dataset.key;
        if (key) {
          sound.playClick();
          this._selectAndClose(key);
        }
      }
    });

    // Night Sky Star Selection
    const nightSkyGrid = document.getElementById('nightsky-grid');
    if (nightSkyGrid) {
      nightSkyGrid.addEventListener('click', (e) => {
        const item = e.target.closest('[data-star-idx]');
        if (item) {
          sound.playLaser();
          const idx = parseInt(item.dataset.starIdx);
          const star = this.stars[idx];
          if (star) {
            this.onSelectStar(star);
            this.closeNightSky();
          }
        }
      });
    }

    // Night sky scroll buttons
    const scrollUp = document.getElementById('nsky-scroll-up');
    const scrollDown = document.getElementById('nsky-scroll-down');
    if (scrollUp && nightSkyGrid) {
      scrollUp.addEventListener('click', () => {
        nightSkyGrid.scrollBy({ top: -140, behavior: 'smooth' });
      });
    }
    if (scrollDown && nightSkyGrid) {
      scrollDown.addEventListener('click', () => {
        nightSkyGrid.scrollBy({ top: 140, behavior: 'smooth' });
      });
    }
  }

  _toggleMoonsPopover(parentKey, targetBtn) {
    const popover = document.getElementById('celestial-sub-popover');
    if (!popover) return;

    if (!popover.classList.contains('hidden') && popover.dataset.parent === parentKey) {
      popover.classList.add('hidden');
      return;
    }

    const moons = this.planetMoons[parentKey] || [];
    if (!moons.length) return;

    popover.dataset.parent = parentKey;
    popover.innerHTML = `
      <div class="popover-header">
        <span class="popover-title">${parentKey.toUpperCase()} SATELLITE SYSTEM</span>
        <button class="popover-close" id="popover-close-btn">&times;</button>
      </div>
      <div class="popover-list">
        ${moons.map(m => `
          <div class="popover-item" data-key="${m.key}" data-moon-name="${m.name}">
            <div class="popover-dot"></div>
            <div class="popover-item-text">
              <span class="item-name">${m.name}</span>
              <span class="item-desc">${m.desc}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    popover.classList.remove('hidden');

    const closeBtn = document.getElementById('popover-close-btn');
    if (closeBtn) {
      closeBtn.onclick = () => popover.classList.add('hidden');
    }

    const items = popover.querySelectorAll('.popover-item');
    items.forEach(el => {
      el.onclick = () => {
        sound.playClick();
        popover.classList.add('hidden');
        this._selectAndClose(parentKey);
      };
    });
  }

  _showDwarfPlanetsPopover(targetBtn) {
    const popover = document.getElementById('celestial-sub-popover');
    if (!popover) return;

    const dwarfs = [
      { key: 'ceres', name: 'CERES', desc: 'Largest Asteroid Belt Dwarf Planet | 940 km' },
      { key: 'pluto', name: 'PLUTO', desc: 'Kuiper Belt World with Sputnik Planitia Heart' },
      { key: 'haumea', name: 'HAUMEA', desc: 'Fast-Spinning Oblate Ellipsoid with Ring' },
      { key: 'makemake', name: 'MAKEMAKE', desc: 'Methane-Ice Surface | 1,430 km' },
      { key: 'eris', name: 'ERIS', desc: 'Massive Scattered Disc Dwarf Planet' },
    ];

    popover.dataset.parent = 'dwarfs';
    popover.innerHTML = `
      <div class="popover-header">
        <span class="popover-title">DWARF CELESTIAL BODIES</span>
        <button class="popover-close" id="popover-close-btn">&times;</button>
      </div>
      <div class="popover-list">
        ${dwarfs.map(d => `
          <div class="popover-item" data-dwarf-key="${d.key}">
            <div class="popover-dot dwarf-dot"></div>
            <div class="popover-item-text">
              <span class="item-name">${d.name}</span>
              <span class="item-desc">${d.desc}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    popover.classList.remove('hidden');

    const closeBtn = document.getElementById('popover-close-btn');
    if (closeBtn) {
      closeBtn.onclick = () => popover.classList.add('hidden');
    }

    const items = popover.querySelectorAll('[data-dwarf-key]');
    items.forEach(el => {
      el.onclick = () => {
        sound.playClick();
        const key = el.dataset.dwarfKey;
        popover.classList.add('hidden');
        this._selectAndClose(key);
      };
    });
  }

  _selectAndClose(key) {
    const section = this.planetSectionMap[key] || 1;
    this.closeSwitchPlanet();
    this.closeNightSky();
    this.onSelectPlanet(key, section);
  }

  openSwitchPlanet() {
    this.closeNightSky();
    if (this.switchModal) {
      this.switchModal.classList.remove('hidden');
    }
  }

  closeSwitchPlanet() {
    if (this.switchModal) {
      this.switchModal.classList.add('hidden');
    }
    const popover = document.getElementById('celestial-sub-popover');
    if (popover) popover.classList.add('hidden');
  }

  openNightSky() {
    this.closeSwitchPlanet();
    if (this.nightSkyModal) {
      this.nightSkyModal.classList.remove('hidden');
    }
  }

  closeNightSky() {
    if (this.nightSkyModal) {
      this.nightSkyModal.classList.add('hidden');
    }
  }
}

