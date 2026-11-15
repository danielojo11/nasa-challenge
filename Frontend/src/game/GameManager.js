import confetti from 'canvas-confetti';
import { sound } from './SoundEffects.js';
import { CAMPAIGN_INFO, DIALECT_PRESETS, MARS_SOLS } from './GameData.js';
import { NASA_TELEMETRY_DOSSIER, OFFICIAL_CHALLENGE_RESOURCES } from './NasaTelemetryData.js';
import { PLANET_ENCYCLOPEDIA } from '../config/planetEncyclopedia.js';
import { NasaApiService } from '../services/NasaApiService.js';

export class GameManager {
  constructor(scrollManager) {
    this.scrollManager = scrollManager;

    // State
    this.gameMode = 'explorer'; // 'explorer' | 'mission'
    this.planetMode = 'earth';  // 'earth' | 'mars'
    this.dialect = 'english';
    this.solIndex = 0;
    this.battery = 85;
    this.air = 80;
    this.shields = 80;
    this.food = 80;
    this.dossierMode = 'sol';   // 'sol' | 'encyclopedia' | 'resources' | 'live_api'
    this.selectedEncyclopediaPlanet = 'mars';
    this.gameResult = 'PLAYING'; // 'PLAYING' | 'WON' | 'LOST'
    this.quizSolved = false;
    this.hudMinimized = false;
    this.activeDossierSol = 1;

    // Live NASA API Cache & Status
    this.apiData = {
      apod: null,
      marsPhotos: null,
      flares: null,
      loading: false,
      tier: 'NASA Direct / Local Cache'
    };

    // DOM Elements
    this.gameContainer = document.getElementById('mission-game-container');
    this.explorerNav = document.getElementById('planet-nav');
    this.modeToggleBtn = document.getElementById('mode-toggle-btn');
    this.soundToggleBtn = document.getElementById('sound-toggle-btn');
    this.quizModal = document.getElementById('quiz-modal');
    this.dossierModal = document.getElementById('nasa-telemetry-modal');
    this.onLandOnMars = null;

    this._bindEvents();
    this._loadLiveNasaData(); // prefetch immediately
    this._render();
  }

  async _loadLiveNasaData() {
    if (this.apiData.loading) return;
    this.apiData.loading = true;
    try {
      const [apod, mars, donki] = await Promise.all([
        NasaApiService.getApod(),
        NasaApiService.getMarsPhotos(),
        NasaApiService.getDonkiFlares()
      ]);
      this.apiData.apod = apod;
      this.apiData.marsPhotos = mars.photos;
      this.apiData.flares = donki.flares;
      this.apiData.tier = mars.sourceTier || apod.sourceTier || 'NASA Image Library';
    } catch (e) {
      console.warn('Live NASA API load note:', e);
    } finally {
      this.apiData.loading = false;
      if (this.dossierMode === 'live_api' && this.dossierModal && this.dossierModal.style.display === 'flex') {
        this.openDossier('live_api');
      }
    }
  }

  _bindEvents() {
    if (this.modeToggleBtn) {
      this.modeToggleBtn.addEventListener('click', () => {
        this.toggleMode();
      });
    }

    if (this.soundToggleBtn) {
      this.soundToggleBtn.addEventListener('click', () => {
        sound.muted = !sound.muted;
        this.soundToggleBtn.textContent = sound.muted ? '🔇 AUDIO OFF' : '🔊 AUDIO ON';
      });
    }

    // Delegated click listeners
    document.addEventListener('click', (e) => {
      const dialectBtn = e.target.closest('[data-dialect]');
      if (dialectBtn) {
        this.setDialect(dialectBtn.dataset.dialect);
      }

      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        this.handleAction(actionBtn.dataset.action);
      }

      const warpBtn = e.target.closest('#warp-to-mars-btn');
      if (warpBtn) {
        this.warpToMars();
      }

      const landMarsBtn = e.target.closest('#land-mars-surface-btn');
      if (landMarsBtn) {
        sound.playLaser();
        if (this.onLandOnMars) {
          this.onLandOnMars();
        } else {
          document.dispatchEvent(new CustomEvent('ares:land-on-mars'));
        }
      }

      const backEarthBtn = e.target.closest('#back-to-earth-btn');
      if (backEarthBtn) {
        this.backToEarth();
      }

      const listenBtn = e.target.closest('#listen-briefing-btn');
      if (listenBtn) {
        const text = this.getCurrentLocalizedText();
        sound.speak(text);
      }

      const toggleHudBtn = e.target.closest('#toggle-hud-btn');
      if (toggleHudBtn) {
        this.hudMinimized = !this.hudMinimized;
        sound.playClick();
        this._render();
      }

      const quizOptBtn = e.target.closest('[data-quiz-option]');
      if (quizOptBtn) {
        const idx = parseInt(quizOptBtn.dataset.quizOption);
        this.submitQuizAnswer(idx);
      }

      const dossierBtn = e.target.closest('[data-open-dossier]');
      if (dossierBtn) {
        const val = dossierBtn.dataset.openDossier;
        if (val === 'resources' || val === 'live_api') {
          this.dossierMode = val;
          this.openDossier();
        } else {
          this.dossierMode = 'sol';
          const sol = parseInt(val) || (this.solIndex + 1);
          this.openDossier(sol);
        }
      }

      const dossierModeBtn = e.target.closest('[data-dossier-mode]');
      if (dossierModeBtn) {
        this.dossierMode = dossierModeBtn.dataset.dossierMode;
        sound.playClick();
        this.openDossier(this.activeDossierSol);
      }

      const encyPlanetBtn = e.target.closest('[data-encyclopedia-planet]');
      if (encyPlanetBtn) {
        this.selectedEncyclopediaPlanet = encyPlanetBtn.dataset.encyclopediaPlanet;
        this.dossierMode = 'encyclopedia';
        sound.playClick();
        this.openDossier('encyclopedia');
      }

      const dossierSolTab = e.target.closest('[data-dossier-sol]');
      if (dossierSolTab) {
        this.dossierMode = 'sol';
        const sol = parseInt(dossierSolTab.dataset.dossierSol);
        this.openDossier(sol);
      }

      const closeDossierBtn = e.target.closest('#close-dossier-btn');
      if (closeDossierBtn) {
        this.closeDossier();
      }

      const closeQuizBtn = e.target.closest('#close-quiz-btn');
      if (closeQuizBtn) {
        if (this.quizModal) this.quizModal.style.display = 'none';
      }

      const visitPadBtn = e.target.closest('#visit-earth-pad-btn');
      if (visitPadBtn) {
        document.dispatchEvent(new CustomEvent('ares:visit-earth-base'));
      }

      const restartBtn = e.target.closest('#mission-restart-btn');
      if (restartBtn) {
        this.resetGame();
      }

      const exitOrreryBtn = e.target.closest('#exit-to-orrery-btn, #exit-to-orrery-btn-left');
      if (exitOrreryBtn) {
        this.toggleMode();
      }

      const hudSoundBtn = e.target.closest('#hud-sound-toggle-btn');
      if (hudSoundBtn) {
        sound.muted = !sound.muted;
        sound.playClick();
        this._render();
      }
    });
  }

  toggleMode() {
    sound.playClick();
    const focusCard = document.getElementById('planet-focus-card');
    if (this.gameMode === 'explorer') {
      this.gameMode = 'mission';
      this.planetMode = 'earth';
      this.hudMinimized = false;
      if (focusCard) focusCard.classList.add('hidden');
      if (this.scrollManager) {
        this.scrollManager.goTo(4); // Fly to Earth
      }
      sound.speak(DIALECT_PRESETS[this.dialect].greeting);
    } else {
      this.gameMode = 'explorer';
      if (this.scrollManager) {
        this.scrollManager.goTo(0); // Solar System Overview
      }
    }
    this._render();
  }

  setDialect(newDialect) {
    if (DIALECT_PRESETS[newDialect]) {
      this.dialect = newDialect;
      sound.playClick();
      const preset = DIALECT_PRESETS[newDialect];
      sound.speak(preset.greeting);
      this._render();
    }
  }

  warpToMars() {
    sound.playLaser();
    this.planetMode = 'mars';
    const focusCard = document.getElementById('planet-focus-card');
    if (focusCard) focusCard.classList.add('hidden');
    if (this.scrollManager) {
      this.scrollManager.goTo(6); // Fly to Mars
    }
    const currentMission = MARS_SOLS[this.solIndex];
    if (currentMission.dangerType === 'RADIATION') {
      setTimeout(() => sound.playKlaxon(), 800);
    }
    setTimeout(() => {
      sound.speak(this.getCurrentLocalizedText());
    }, 1200);
    this._render();
  }

  backToEarth() {
    sound.playClick();
    this.planetMode = 'earth';
    const focusCard = document.getElementById('planet-focus-card');
    if (focusCard) focusCard.classList.add('hidden');
    if (this.scrollManager) {
      this.scrollManager.goTo(4); // Back to Earth
    }
    this._render();
  }

  setOnLandOnMars(fn) {
    this.onLandOnMars = fn;
  }

  getCurrentMission() {
    return MARS_SOLS[this.solIndex] || MARS_SOLS[0];
  }

  getCurrentLocalizedText() {
    const mission = this.getCurrentMission();
    return mission.localizedText[this.dialect] || mission.localizedText.english;
  }

  handleAction(action) {
    const mission = this.getCurrentMission();

    if (action === 'SHIELD') {
      sound.playTone(520, 0.25, 'sawtooth', 0.12);
      this.shields = Math.min(100, this.shields + 30);
      this.battery = Math.max(0, this.battery - 20);
      this.air = mission.dangerType === 'AIR' ? Math.max(0, this.air - 20) : Math.max(0, this.air - 8);
      this.food = Math.max(0, this.food - 6);
      this._flashBanner('🛡️ Water Shield On! Dangerous sun rays blocked! (-20% Battery)');
    } else if (action === 'AIR') {
      sound.playTone(680, 0.25, 'sine', 0.12);
      this.air = Math.min(100, this.air + 30);
      this.battery = Math.max(0, this.battery - 20);
      this.shields = mission.dangerType === 'RADIATION' ? Math.max(0, this.shields - 25) : Math.max(0, this.shields - 8);
      this.food = Math.max(0, this.food - 6);
      this._flashBanner('💨 Fresh Air Made! Astronauts can breathe! (-20% Battery)');
    } else if (action === 'FOOD') {
      sound.playTone(600, 0.25, 'triangle', 0.12);
      this.food = Math.min(100, this.food + 30);
      this.battery = Math.max(0, this.battery - 18);
      this.air = Math.max(0, this.air - 6);
      this.shields = Math.max(0, this.shields - 6);
      this._flashBanner('🥗 Yummy Veggies Harvested! Astronauts are happy! (-18% Battery)');
    } else if (action === 'QUIZ') {
      sound.playClick();
      this._openQuizModal();
      return;
    }

    this._checkTurnProgression();
  }

  _openQuizModal() {
    if (!this.quizModal) return;
    const mission = this.getCurrentMission();
    const quiz = mission.quiz;
    const qEl = this.quizModal.querySelector('#quiz-question');
    const optsEl = this.quizModal.querySelector('#quiz-options');
    const errEl = this.quizModal.querySelector('#quiz-error-msg');
    if (errEl) errEl.style.display = 'none';
    if (qEl) qEl.textContent = quiz.q;
    if (optsEl) {
      optsEl.innerHTML = quiz.options.map((opt, i) => `
        <button class="quiz-opt-btn" data-quiz-option="${i}">
          <span class="opt-prefix">[${String.fromCharCode(65 + i)}]</span> ${opt}
        </button>
      `).join('');
    }
    this.quizModal.style.display = 'flex';
  }

  submitQuizAnswer(idx) {
    const mission = this.getCurrentMission();
    if (idx === mission.quiz.correct) {
      sound.playPowerUp();
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 } });
      this.battery = Math.min(100, this.battery + 35);
      this.air = Math.min(100, this.air + 10);
      this.shields = Math.min(100, this.shields + 10);
      this.food = Math.min(100, this.food + 10);
      this.quizSolved = true;
      this.quizModal.style.display = 'none';
      this._flashBanner(`⚡ Verified! +35% Power Recharged: ${mission.quiz.fact}`);
      this._render();
    } else {
      sound.playTone(250, 0.3, 'sawtooth', 0.15);
      const errEl = this.quizModal.querySelector('#quiz-error-msg');
      if (errEl) {
        errEl.textContent = '⚠️ Incorrect diagnosis. Re-evaluate the physics principles and select the correct telemetry option!';
        errEl.style.display = 'block';
      }
    }
  }

  _checkTurnProgression() {
    if (this.battery <= 0 || this.air <= 0 || this.shields <= 0 || this.food <= 0) {
      this.gameResult = 'LOST';
      sound.playDefeat();
      this._render();
      return;
    }

    this.quizSolved = false;
    if (this.solIndex + 1 >= MARS_SOLS.length) {
      this.gameResult = 'WON';
      sound.playVictory();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      this._render();
    } else {
      this.solIndex += 1;
      const nextMission = this.getCurrentMission();
      if (nextMission.dangerType === 'RADIATION') {
        setTimeout(() => sound.playKlaxon(), 500);
      }
      this._render();
      setTimeout(() => {
        sound.speak(this.getCurrentLocalizedText());
      }, 700);
    }
  }

  openDossier(sol = 1) {
    if (typeof sol === 'number') {
      this.activeDossierSol = sol;
    }
    sound.playClick();
    if (!this.dossierModal) return;

    const dossier = NASA_TELEMETRY_DOSSIER[this.activeDossierSol] || NASA_TELEMETRY_DOSSIER[1];

    this.dossierModal.innerHTML = `
      <div class="dossier-modal-content">
        <!-- TOP HEADER -->
        <div class="dossier-header">
          <div class="dossier-title-group">
            <span class="dossier-badge">🛰️ VERIFIED NASA & CSA AEROSPACE DATA</span>
            <span class="dossier-id">${this.dossierMode === 'resources' ? 'CHALLENGE-RESOURCES-ALL-MD' : `DATASET: ${dossier.datasetId}`}</span>
          </div>
          <button id="close-dossier-btn" class="dossier-close-btn" title="Close Dossier">✕</button>
        </div>

        <!-- TOP LEVEL MODE SWITCHER -->
        <div class="dossier-mode-switcher">
          <button class="dossier-mode-btn ${this.dossierMode === 'sol' ? 'active' : ''}" data-dossier-mode="sol">
            📡 SOL SCIENCE FACTS
          </button>
          <button class="dossier-mode-btn ${this.dossierMode === 'encyclopedia' ? 'active' : ''}" data-dossier-mode="encyclopedia">
            🪐 PLANET ENCYCLOPEDIA (ALL 16 BODIES)
          </button>
          <button class="dossier-mode-btn ${this.dossierMode === 'resources' ? 'active' : ''}" data-dossier-mode="resources">
            📚 NASA & CSA CHALLENGE RESOURCES
          </button>
          <button class="dossier-mode-btn ${this.dossierMode === 'live_api' ? 'active' : ''}" data-dossier-mode="live_api">
            📸 LIVE MARS PHOTOS & APOD
          </button>
        </div>

        ${this.dossierMode === 'encyclopedia' ? `
          <!-- CELESTIAL BODY SELECTION RIBBON (ALL 16 BODIES) -->
          <div class="dossier-sol-tabs" style="flex-wrap: wrap; gap: 4px; max-height: 85px; overflow-y: auto;">
            ${Object.entries(PLANET_ENCYCLOPEDIA).map(([k, p]) => `
              <button class="dossier-tab ${this.selectedEncyclopediaPlanet === k ? 'active' : ''}" data-encyclopedia-planet="${k}">
                ${p.symbol || '🪐'} ${p.name}
              </button>
            `).join('')}
          </div>

          <div class="dossier-body" style="padding-top: 10px;">
            ${(() => {
              const p = PLANET_ENCYCLOPEDIA[this.selectedEncyclopediaPlanet] || PLANET_ENCYCLOPEDIA.mars;
              return `
                <div class="dossier-headline-row" style="margin-bottom: 12px;">
                  <div>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span style="font-size:24px;">${p.symbol || '🪐'}</span>
                      <h2 class="dossier-headline" style="margin:0;">${p.name}</h2>
                      <span class="dossier-alert-tag" style="color:#38bdf8; border-color:rgba(56,189,248,0.4);">${p.classification}</span>
                    </div>
                    <div class="dossier-meta" style="margin-top:4px;">
                      <span><b>DESIGNATION:</b> ${p.designation}</span>
                      <span><b>AXIAL TILT:</b> ${p.stats.axialTilt}</span>
                      <span><b>NATURAL SATELLITES:</b> ${p.stats.moons}</span>
                    </div>
                  </div>
                </div>

                <p class="dossier-summary" style="margin-bottom: 16px;">${p.tagline}</p>

                <!-- 10-POINT TELEMETRY GRID -->
                <h4 class="dossier-subheading" style="color:#38bdf8; margin-bottom:8px;">📡 SCIENTIFIC & ORBITAL TELEMETRY</h4>
                <div class="encyclopedia-telemetry-grid" style="margin-bottom: 16px;">
                  <div class="encyclopedia-stat-card"><span class="stat-lbl">DISTANCE</span><span class="stat-val highlight">${p.stats.distance}</span></div>
                  <div class="encyclopedia-stat-card"><span class="stat-lbl">ORBIT PERIOD</span><span class="stat-val">${p.stats.orbitPeriod}</span></div>
                  <div class="encyclopedia-stat-card"><span class="stat-lbl">ORBIT VELOCITY</span><span class="stat-val">${p.stats.orbitSpeed}</span></div>
                  <div class="encyclopedia-stat-card"><span class="stat-lbl">DAY LENGTH</span><span class="stat-val">${p.stats.rotation}</span></div>
                  <div class="encyclopedia-stat-card"><span class="stat-lbl">SURFACE GRAVITY</span><span class="stat-val highlight">${p.stats.gravity}</span></div>
                  <div class="encyclopedia-stat-card"><span class="stat-lbl">SURFACE TEMP</span><span class="stat-val">${p.stats.temperature}</span></div>
                  <div class="encyclopedia-stat-card"><span class="stat-lbl">DIAMETER</span><span class="stat-val">${p.stats.diameter}</span></div>
                  <div class="encyclopedia-stat-card"><span class="stat-lbl">MASS</span><span class="stat-val">${p.stats.mass}</span></div>
                  <div class="encyclopedia-stat-card"><span class="stat-lbl">MOONS</span><span class="stat-val">${p.stats.moons}</span></div>
                  <div class="encyclopedia-stat-card"><span class="stat-lbl">AXIAL TILT</span><span class="stat-val">${p.stats.axialTilt}</span></div>
                </div>

                <!-- ATMOSPHERE & GEOLOGY -->
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; margin-bottom: 16px;">
                  <div class="encyclopedia-atm-card">
                    <span class="dossier-subheading" style="color:#60a5fa; margin:0;">💨 ATMOSPHERE & WEATHER</span>
                    <div class="atm-pressure-row">
                      <span class="atm-label">PRESSURE:</span>
                      <span class="atm-value">${p.atmosphere.pressure}</span>
                    </div>
                    <div class="atm-gases-pills">
                      ${p.atmosphere.gases.map(g => `<div class="gas-pill"><span class="gas-name">${g.name}</span><span class="gas-pct">${g.pct}</span></div>`).join('')}
                    </div>
                    <div class="atm-weather-box">
                      <span class="weather-label">WEATHER DYNAMICS:</span>
                      <p class="weather-desc">${p.atmosphere.weather}</p>
                    </div>
                  </div>

                  <div class="encyclopedia-geo-card">
                    <span class="dossier-subheading" style="color:#fb923c; margin:0;">🌋 GEOLOGY & LANDMARKS</span>
                    <div class="geo-item">
                      <span class="geo-lbl">TERRAIN COMPOSITION:</span>
                      <p class="geo-val">${p.geology.terrain}</p>
                    </div>
                    <div class="geo-item">
                      <span class="geo-lbl">PROMINENT LANDMARKS:</span>
                      <p class="geo-val">${p.geology.landmarks}</p>
                    </div>
                  </div>
                </div>

                <!-- MISSIONS & JUNIOR ASTRONAUT -->
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
                  <div class="api-section">
                    <span class="dossier-subheading" style="color:#34d399; margin:0 0 8px 0; display:block;">🚀 NASA & INTERNATIONAL MISSIONS</span>
                    <div class="encyclopedia-missions-list">
                      ${p.exploration.map(m => `
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

                  <div class="encyclopedia-advisory-card">
                    <span class="dossier-subheading" style="color:#38bdf8; margin:0;">🧑‍🚀 JUNIOR ASTRONAUT ADVISORY</span>
                    <div class="advisory-fact-row">
                      <span class="advisory-icon">💡</span>
                      <div class="advisory-text">
                        <span class="advisory-title">DISCOVERY FACT</span>
                        <p class="advisory-p">${p.juniorAstronaut.fact}</p>
                      </div>
                    </div>
                    <div class="advisory-hazard-row">
                      <span class="advisory-icon warn">⚠️</span>
                      <div class="advisory-text">
                        <span class="advisory-title warn">CADET SURVIVAL PROTOCOL</span>
                        <p class="advisory-p">${p.juniorAstronaut.hazard}</p>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            })()}
          </div>
        ` : this.dossierMode === 'live_api' ? `
          <!-- LIVE NASA APIS & MARS ROVER CAMERA VIEW -->
          <div class="dossier-body">
            <div class="dossier-headline-row">
              <div>
                <h2 class="dossier-headline">Live NASA Open APIs Gateway & Mars Surface Cameras</h2>
                <div class="dossier-meta">
                  <span><b>DATA RETRIEVAL TIER:</b> <span class="dossier-alert-tag" style="color:#34d399">${this.apiData.tier}</span></span>
                  <span><b>RATE-LIMIT CACHE:</b> 60-min in-memory buffer active</span>
                </div>
              </div>
            </div>

            <!-- 1. MARS ROVER REAL SURFACE PHOTOS -->
            <div class="api-section">
              <h4 class="dossier-subheading">📸 MARS ROVER IMAGES</h4>
              <p class="dossier-summary">Images from NASA's Mars rover archive, including Curiosity surface imagery. Select a photo to open its full-resolution original.</p>
              <div class="mars-photos-grid">
                ${(this.apiData.marsPhotos || []).map(p => `
                  <a class="mars-photo-card" href="${p.img_src}" target="_blank" rel="noopener noreferrer">
                    <img src="${p.img_src}" alt="${p.title || 'NASA Mars rover image'}" class="mars-photo-img" loading="lazy" />
                    <div class="mars-photo-info">
                      <span class="photo-cam">${p.title || p.camera?.full_name || p.camera?.name || 'Mars rover image'}</span>
                      <span class="photo-sol">${p.rover?.name || 'NASA'} · ${p.earth_date || 'NASA archive'}${p.nasa_id ? ` · ${p.nasa_id}` : ''}</span>
                    </div>
                  </a>
                `).join('')}
              </div>
              ${this.apiData.loading ? '<p class="mars-photos-status" role="status">Loading NASA rover imagery…</p>' : ''}
              ${!this.apiData.loading && !this.apiData.marsPhotos?.length ? '<p class="mars-photos-status" role="status">Mars images are unavailable right now. Please try again in a moment.</p>' : ''}
            </div>

            <!-- 2. ASTRONOMY PICTURE OF THE DAY (APOD) -->
            ${this.apiData.apod ? `
              <div class="api-section" style="margin-top:20px;">
                <h4 class="dossier-subheading">🌌 NASA ASTRONOMY PICTURE OF THE DAY (APOD)</h4>
                <div class="apod-card">
                  <div class="apod-img-box">
                    <img src="${this.apiData.apod.url}" alt="${this.apiData.apod.title}" class="apod-img" />
                  </div>
                  <div class="apod-info">
                    <h3 class="apod-title">${this.apiData.apod.title}</h3>
                    <span class="apod-date">${this.apiData.apod.date} • ${this.apiData.apod.copyright || 'NASA Public Domain'}</span>
                    <p class="apod-desc">${this.apiData.apod.explanation}</p>
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- 3. RECENT DONKI SOLAR FLARES -->
            <div class="api-section" style="margin-top:20px;">
              <h4 class="dossier-subheading">☀️ NASA DONKI RECENT SOLAR FLARE LOGS</h4>
              <div class="dossier-table-wrap">
                <table class="dossier-table">
                  <thead>
                    <tr>
                      <th>EVENT ID</th>
                      <th>FLARE CLASS</th>
                      <th>ACTIVE REGION</th>
                      <th>PEAK TIME (UTC)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(this.apiData.flares || []).map(f => `
                      <tr>
                        <td class="param-name"><code>${f.flrID}</code></td>
                        <td class="param-val"><code>${f.classType}</code></td>
                        <td class="param-desc">AR ${f.activeRegionNum || 'N/A'}</td>
                        <td class="param-desc">${f.peakTime}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ` : this.dossierMode === 'resources' ? `
          <!-- CHALLENGE RESOURCES DIRECTORY (ALL.MD) -->
          <div class="dossier-body">
            <div class="dossier-headline-row">
              <div>
                <h2 class="dossier-headline">Official NASA & Partner Scientific Datasets</h2>
                <div class="dossier-meta">
                  <span><b>EVENT:</b> 2026 NASA Space Apps Challenge</span>
                  <span><b>CHALLENGE:</b> Build a Junior Astronaut Mission Trainer</span>
                </div>
              </div>
            </div>
            <p class="dossier-summary">
              Every mechanic in ARES-1 (oxygen cracking, radiation deflection, solar power budgeting, and hydroponic calorie rationing) is strictly grounded in authentic open data provided in <code>all.md</code>. Below are the official data repositories, dosimeter registries, and research toolkits powering this simulation.
            </p>

            <div class="challenge-resources-grid">
              ${OFFICIAL_CHALLENGE_RESOURCES.map(res => `
                <div class="challenge-res-card">
                  <div class="res-card-header">
                    <span class="res-badge">${res.badge}</span>
                    <h3 class="res-title">${res.name}</h3>
                    <span class="res-agency">${res.agency}</span>
                  </div>
                  <div class="res-role-box">
                    <span class="res-lbl">ENGINEERING ROLE IN ARES-1:</span>
                    <p class="res-desc">${res.howUsed}</p>
                  </div>
                  <div class="res-datasets-box">
                    <span class="res-lbl">VERIFIABLE DATASETS IN-GAME:</span>
                    <ul class="res-dataset-list">
                      ${res.datasets.map(d => `<li>• <code>${d}</code></li>`).join('')}
                    </ul>
                  </div>
                  <div class="res-card-footer">
                    <a href="${res.url}" target="_blank" rel="noopener noreferrer" class="res-link-btn">
                      🔗 OPEN OFFICIAL DATA PORTAL ➔
                    </a>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <!-- 5 SOL NAVIGATION TABS -->
          <div class="dossier-sol-tabs">
            ${[1, 2, 3, 4, 5].map((s) => `
              <button class="dossier-tab ${this.activeDossierSol === s ? 'active' : ''}" data-dossier-sol="${s}">
                SOL ${s} // ${s === 1 ? 'MOXIE O₂' : s === 2 ? 'SOLAR FLARE' : s === 3 ? 'DUST STORM' : s === 4 ? 'RECORD FLARE' : 'DUST DEVIL'}
              </button>
            `).join('')}
          </div>

          <div class="dossier-body">
            <div class="dossier-headline-row">
              <div>
                <h2 class="dossier-headline">${dossier.title}</h2>
                <div class="dossier-meta">
                  <span><b>AGENCY / LAB:</b> ${dossier.agency}</span>
                  <span><b>STATUS:</b> <span class="dossier-alert-tag">${dossier.threatType}</span></span>
                </div>
              </div>
              <a href="${dossier.endpoint}" target="_blank" rel="noopener noreferrer" class="dossier-nasa-link">
                🔗 OFFICIAL NASA DATA ➔
              </a>
            </div>

            <p class="dossier-summary">${dossier.summary}</p>

            <!-- 3 BITE-SIZED SCIENCE CARDS -->
            <div class="dossier-cards-grid">
              ${(dossier.cards || []).map((card) => `
                <div class="dossier-fact-card">
                  <span class="dossier-fact-badge">${card.label}</span>
                  <p class="dossier-fact-text">${card.text}</p>
                </div>
              `).join('')}
            </div>
          </div>
        `}
      </div>
    `;

    this.dossierModal.querySelectorAll('.mars-photo-img').forEach((image) => {
      image.addEventListener('error', () => {
        image.closest('.mars-photo-card')?.classList.add('image-unavailable');
        image.remove();
      }, { once: true });
    });

    this.dossierModal.style.display = 'flex';
  }

  closeDossier() {
    sound.playClick();
    if (this.dossierModal) {
      this.dossierModal.style.display = 'none';
    }
  }

  _flashBanner(msg) {
    const banner = document.getElementById('mission-feedback-banner');
    if (banner) {
      banner.textContent = msg;
      banner.style.display = 'block';
      setTimeout(() => {
        banner.style.display = 'none';
      }, 3500);
    }
  }

  resetGame() {
    this.battery = 85;
    this.air = 80;
    this.shields = 80;
    this.food = 80;
    this.solIndex = 0;
    this.dossierMode = 'sol';
    this.gameResult = 'PLAYING';
    this.quizSolved = false;
    this.planetMode = 'earth';
    if (this.scrollManager) {
      this.scrollManager.goTo(4);
    }
    sound.playClick();
    this._render();
  }

  _render() {
    const isMission = this.gameMode === 'mission';
    const isMars = this.planetMode === 'mars';

    // Sci-Fi Left Dock, Right Ruler, and Bottom Date Bar Control
    const leftDock = document.getElementById('scifi-left-dock');
    const rightRuler = document.getElementById('scifi-right-ruler');
    const bottomBar = document.getElementById('scifi-bottom-bar');
    const scifiTopRight = document.getElementById('scifi-top-right');

    if (isMission) {
      // In flight simulator: hide left dock and right ruler to keep space clear, keep date below
      if (leftDock) {
        leftDock.style.display = 'none';
        leftDock.classList.add('hidden', 'mission-mode');
      }
      if (rightRuler) {
        rightRuler.style.display = 'none';
        rightRuler.classList.add('hidden');
      }
      if (bottomBar) bottomBar.style.display = 'flex';
      if (scifiTopRight) {
        scifiTopRight.style.display = 'none';
        scifiTopRight.classList.add('hidden');
      }
    } else {
      if (leftDock) {
        leftDock.classList.remove('mission-mode', 'hidden');
        leftDock.style.display = 'flex';
      }
      if (rightRuler) {
        rightRuler.classList.remove('hidden');
        rightRuler.style.display = 'flex';
      }
      if (bottomBar) bottomBar.style.display = 'flex';
      if (scifiTopRight) {
        scifiTopRight.classList.remove('hidden');
        scifiTopRight.style.display = 'flex';
      }
    }

    // Hide Orrery header controls when in Mission mode to eliminate all collisions
    const appHeaderControls = document.getElementById('app-header-controls');
    if (appHeaderControls) {
      appHeaderControls.style.display = isMission ? 'none' : 'flex';
    }

    // Toggle button UI
    if (this.modeToggleBtn) {
      this.modeToggleBtn.innerHTML = isMission
        ? '🪐 ORRERY EXPLORER'
        : '🚀 ARES-1 FLIGHT CONSOLE';
      this.modeToggleBtn.className = isMission ? 'mode-btn active' : 'mode-btn';
    }

    // Toggle overlay visibility
    const originalSections = document.querySelectorAll('.section-panel');
    originalSections.forEach((p) => {
      p.style.display = isMission ? 'none' : '';
    });
    if (this.explorerNav) {
      this.explorerNav.style.display = isMission ? 'none' : 'flex';
    }

    if (!this.gameContainer) return;
    this.gameContainer.style.display = isMission ? 'block' : 'none';

    if (!isMission) return;

    const mission = this.getCurrentMission();
    const preset = DIALECT_PRESETS[this.dialect];

    // Status helpers for telemetry gauges
    const getStatusText = (val, lowMsg, goodMsg) => (val < 30 ? lowMsg : goodMsg);

    // Render Clean, Kid-Friendly Layout
    this.gameContainer.innerHTML = `
      <!-- TOP COMMAND STRIP (Unobtrusive, Unified, Zero Collisions) -->
      <header class="hud-top-bar">
        <div class="hud-brand-group">
          <button id="exit-to-orrery-btn-left" class="hud-nav-btn exit-left" title="Exit Trainer to Solar System Map">
            ◀ SOLAR SYSTEM
          </button>
          <span class="hud-live-dot"></span>
          <span class="hud-tag">ARES-1 MISSION TRAINER</span>
          <span class="hud-subtag">// ${isMars ? `EXPEDITION SOL ${mission.sol} OF 5 (MARS BASE)` : 'EARTH SPACEPORT (COMMAND)'}</span>
        </div>

        <!-- COMPACT DIALECT PILLS -->
        <div class="hud-dialects">
          ${Object.entries(DIALECT_PRESETS).map(([key, val]) => `
            <button class="hud-pill ${this.dialect === key ? 'active' : ''}" data-dialect="${key}" title="${val.label} (${val.city})">
              ${val.flag} ${key === 'english' ? 'Global' : val.label.split(' ')[0]}
            </button>
          `).join('')}
        </div>

        <div class="hud-top-actions">
          <button class="hud-nav-btn live-cam" data-open-dossier="live_api" title="View Real Photos from Mars">
            📸 MARS PHOTOS
          </button>
          <button class="hud-nav-btn resources" data-open-dossier="resources" title="NASA & Space Science Facts">
            📚 SCIENCE FACTS
          </button>
          ${isMars ? '<button id="back-to-earth-btn" class="hud-nav-btn warp">🌍 EARTH BASE</button>' : ''}
          <button id="hud-sound-toggle-btn" class="hud-nav-btn sound" title="Sound Audio Toggle">
            ${sound.muted ? '🔇 SOUND OFF' : '🔊 SOUND ON'}
          </button>
          <button id="exit-to-orrery-btn" class="hud-nav-btn exit" title="Exit Trainer to Solar System Map">
            🪐 SOLAR SYSTEM
          </button>
        </div>
      </header>

      <div id="mission-feedback-banner" class="hud-feedback-banner" style="display:none"></div>

      <!-- ACTIVE VIEW -->
      ${!isMars ? `
        <!-- EARTH VIEW: COMPREHENSIVE MISSION BRIEFING & OBJECTIVE -->
        <div class="earth-hud-panel compact">
          <div class="panel-header">
            <span class="panel-step-badge">🚀 MISSION BRIEFING</span>
            <h3 class="panel-title">${CAMPAIGN_INFO.title}</h3>
          </div>

          <div class="panel-body">
            <div class="mission-campaign-card">
              <div class="campaign-badge-row">
                <span class="campaign-badge">TARGET: JEZERO CRATER, MARS</span>
                <span class="campaign-phase-badge">STATUS: PRE-FLIGHT CHECKOUT</span>
              </div>
              <div class="campaign-goal-text">
                <strong>CAMPAIGN GOAL:</strong> ${CAMPAIGN_INFO.campaignGoal}
              </div>
              <div class="campaign-current-objective">
                <span class="objective-icon">🎯</span>
                <div class="objective-info">
                  <span class="objective-label">PRIMARY DIRECTIVE:</span>
                  <span class="objective-desc">Navigate to Mars, balance Life Support (Air), Radiation (Shields), Power (Battery), and Calories (Food), and solve NASA STEM flight anomalies to earn official Junior Astronaut Flight Wings!</span>
                </div>
              </div>
            </div>

            <div class="mini-pillars-row">
              <span class="mini-pill">⚡ Battery (MMRTG & Solar)</span>
              <span class="mini-pill">💨 Air (MOXIE Electrolysis)</span>
              <span class="mini-pill">🛡️ Shield (H₂O Deflection)</span>
              <span class="mini-pill">🥗 Food (Hydroponics)</span>
            </div>
          </div>

          <div class="panel-footer" style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
            <button id="warp-to-mars-btn" class="hud-action-primary">
              🚀 LAUNCH EXPEDITION TO MARS ➔
            </button>
            <button id="visit-earth-pad-btn" class="hud-action-secondary" style="background: rgba(14,165,233,0.2); border: 1px solid #38bdf8; color: #e0f2fe; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: 700; transition: all 0.2s ease;">
              🌍 VISIT KENNEDY SPACEPORT (PAD 39-X)
            </button>
          </div>
        </div>
      ` : `
        <!-- MARS VIEW: UNIFIED FLIGHT DECK (ZERO OVERLAPS) -->
        <div class="mars-flight-dock compact">
          <!-- TOP: MISSION DIRECTIVE STRIP -->
          <div class="mission-campaign-card-strip">
            <div class="campaign-badge-row">
              <span class="campaign-badge">🚀 EXPEDITION SOL ${mission.sol} OF 5</span>
              <span class="campaign-phase-badge">HAZARD: ${mission.dangerType} CRITICAL</span>
              <span class="campaign-source-tag">INSTRUMENT: ${mission.nasaSource}</span>
            </div>
            <div class="campaign-current-objective">
              <span class="objective-icon">🎯</span>
              <div class="objective-info">
                <span class="objective-label">SOL ${mission.sol} DIRECTIVE:</span>
                <span class="objective-desc">${mission.missionObjective}</span>
              </div>
            </div>
          </div>

          <!-- LOWER DECK: 2 COLUMNS (METERS LEFT, CONSOLE RIGHT) -->
          <div class="mars-deck-body">
            <!-- LEFT: 4 TELEMETRY GAUGES -->
            <div class="mars-telemetry-rack compact">
              <div class="rack-header">
                <span>METERS</span>
                <span class="rack-sol-tag">DAY ${mission.sol}/5</span>
              </div>

              <div class="telem-item ${this.battery < 30 ? 'warn' : ''}">
                <div class="telem-meta">
                  <span class="telem-code">⚡ PWR</span>
                  <span class="telem-val">${this.battery}%</span>
                </div>
                <div class="telem-track">
                  <div class="telem-bar pwr-bar" style="width: ${this.battery}%"></div>
                </div>
              </div>

              <div class="telem-item ${this.air < 30 ? 'warn' : ''}">
                <div class="telem-meta">
                  <span class="telem-code">💨 AIR</span>
                  <span class="telem-val">${this.air}%</span>
                </div>
                <div class="telem-track">
                  <div class="telem-bar air-bar" style="width: ${this.air}%"></div>
                </div>
              </div>

              <div class="telem-item ${this.shields < 30 ? 'warn' : ''}">
                <div class="telem-meta">
                  <span class="telem-code">🛡️ SHIELD</span>
                  <span class="telem-val">${this.shields}%</span>
                </div>
                <div class="telem-track">
                  <div class="telem-bar rad-bar" style="width: ${this.shields}%"></div>
                </div>
              </div>

              <div class="telem-item ${this.food < 30 ? 'warn' : ''}">
                <div class="telem-meta">
                  <span class="telem-code">🥗 FOOD</span>
                  <span class="telem-val">${this.food}%</span>
                </div>
                <div class="telem-track">
                  <div class="telem-bar food-bar" style="width: ${this.food}%"></div>
                </div>
              </div>
            </div>

            <!-- RIGHT: COMPACT CONSOLE -->
            ${this.gameResult === 'PLAYING' ? `
              <div class="mars-flight-console compact">
                <div class="console-event-header">
                  <span class="event-badge">${mission.eventTitle}</span>
                  <div style="display:flex; gap:6px; align-items:center;">
                    <button id="land-mars-surface-btn" class="mars-land-action-btn" title="Land on Mars Open World">
                      🔴 LAND ON MARS
                    </button>
                    <button id="listen-briefing-btn" class="comms-audio-btn" title="Listen">
                      🔊 Audio
                    </button>
                  </div>
                </div>

                <div class="console-comms-box">
                  <p class="comms-text">${this.getCurrentLocalizedText()}</p>
                </div>

                <!-- 4 TACTICAL BUTTONS -->
                <div class="tactical-btn-grid compact">
                  <button class="tactical-btn shield" data-action="SHIELD">
                    <span class="tac-icon">🛡️</span>
                    <div class="tac-info">
                      <div class="tactical-title">Shield</div>
                      <div class="tactical-sub">+30% • -20% Pwr</div>
                    </div>
                  </button>

                  <button class="tactical-btn air" data-action="AIR">
                    <span class="tac-icon">💨</span>
                    <div class="tac-info">
                      <div class="tactical-title">Air</div>
                      <div class="tactical-sub">+30% • -20% Pwr</div>
                    </div>
                  </button>

                  <button class="tactical-btn food" data-action="FOOD">
                    <span class="tac-icon">🥗</span>
                    <div class="tac-info">
                      <div class="tactical-title">Food</div>
                      <div class="tactical-sub">+30% • -18% Pwr</div>
                    </div>
                  </button>

                  <button class="tactical-btn quiz ${this.quizSolved ? 'disabled' : ''}" data-action="QUIZ" ${this.quizSolved ? 'disabled' : ''}>
                    <span class="tac-icon">⚡</span>
                    <div class="tac-info">
                      <div class="tactical-title">${this.quizSolved ? 'Charged' : 'Quiz'}</div>
                      <div class="tactical-sub">+35% Pwr</div>
                    </div>
                  </button>
                </div>
              </div>
            ` : `
              <!-- WIN / LOSS PANEL -->
              <div class="debrief-panel ${this.gameResult === 'WON' ? 'success' : 'failure'} compact">
                <h3>${this.gameResult === 'WON' ? '🎉 YOU WON!' : '⚠️ MISSION OVER'}</h3>
                <p>
                  ${this.gameResult === 'WON'
                    ? 'Great job Commander! You survived all 5 days on Mars!'
                    : 'A meter hit 0%! Try again!'}
                </p>
                <button id="mission-restart-btn" class="hud-action-primary restart-btn">
                  ${this.gameResult === 'WON' ? '🔄 Play Again' : '🔄 Try Again'}
                </button>
              </div>
            `}
          </div>
        </div>
      `}
    `;
  }
}
