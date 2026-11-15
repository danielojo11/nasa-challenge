import * as THREE from 'three';
import { PLANET_STRUCTURES } from '../config/structures.js';
import { sound } from '../game/SoundEffects.js';

export class StructureManager {
  constructor(scene, scrollManager, planetsMap, onLayerSelect = null) {
    this.scene = scene;
    this.scrollManager = scrollManager;
    this.planetsMap = planetsMap;
    this.onLayerSelect = onLayerSelect;

    this.isOpen = false;
    this.activeKey = null;
    this.activePlanetObj = null;
    this.progress = 0; // 0 = solid, 1 = open cutaway
    this.targetProgress = 0;
    this.selectedLayerIndex = -1;

    // Cache of 3D cutaway assemblies per planet
    this.assemblies = new Map();

    // DOM UI elements
    this.calloutsOverlay = document.getElementById('structure-callouts-overlay');

    // Auto-close if user navigates away
    this.scrollManager.onChange(() => {
      if (this.isOpen) {
        this.close();
      }
    });

    this._bindEvents();
  }

  _bindEvents() {
    if (this.calloutsOverlay) {
      this.calloutsOverlay.addEventListener('click', (e) => {
        const item = e.target.closest('[data-layer-idx]');
        if (item) {
          const idx = parseInt(item.dataset.layerIdx);
          this.selectLayer(idx);
        }
      });
    }
  }

  getPlanetKeyForSection(section) {
    const map = {
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
    };
    return map[section] || null;
  }

  open(planetKey = null) {
    const key = planetKey || this.getPlanetKeyForSection(this.scrollManager.activeSection);
    if (!key || !PLANET_STRUCTURES[key]) return;

    this.activeKey = key;
    this.activePlanetObj = this.planetsMap[key];
    if (!this.activePlanetObj) return;

    this.isOpen = true;
    this.targetProgress = 1;
    this.selectedLayerIndex = -1;

    this._attachAssembly(key, this.activePlanetObj);
    this._renderCallouts(key);
  }

  close() {
    if (!this.isOpen && this.targetProgress === 0) return;
    this.isOpen = false;
    this.targetProgress = 0;

    if (this.calloutsOverlay) {
      this.calloutsOverlay.style.display = 'none';
    }

    if (this.activeKey && this.activePlanetObj) {
      const assembly = this.assemblies.get(this.activeKey);
      if (assembly) {
        assembly.group.visible = false;
      }
      const originalMesh = this.activePlanetObj.mesh || this.activePlanetObj.core;
      if (originalMesh) originalMesh.visible = true;
      if (this.activePlanetObj.clouds) this.activePlanetObj.clouds.visible = true;
    }
  }

  _attachAssembly(key, planetObj) {
    let assembly = this.assemblies.get(key);

    if (!assembly) {
      assembly = this._buildAssembly(key, planetObj);
      this.assemblies.set(key, assembly);
    }

    const targetParent = planetObj.mesh ? planetObj.group : (planetObj.group || planetObj);
    if (assembly.group.parent !== targetParent) {
      targetParent.add(assembly.group);
    }

    // Hide original surface mesh
    const originalMesh = planetObj.mesh || planetObj.core;
    if (originalMesh) originalMesh.visible = false;
    if (planetObj.clouds) planetObj.clouds.visible = false;

    assembly.group.visible = true;
    // Align assembly cutaway towards camera
    assembly.group.rotation.set(0, -Math.PI * 0.35, 0);
  }

  _buildAssembly(key, planetObj) {
    const data = PLANET_STRUCTURES[key];
    const group = new THREE.Group();
    group.name = `structure_${key}`;

    const originalMesh = planetObj.mesh || planetObj.core;
    let radius = 1.0;
    let originalMaterial = null;

    if (originalMesh) {
      if (originalMesh.geometry && originalMesh.geometry.parameters) {
        radius = originalMesh.geometry.parameters.radius || 1.0;
      }
      originalMaterial = originalMesh.material;
    }

    // Cutaway spherical shell: 270° main body
    const mainGeo = new THREE.SphereGeometry(
      radius,
      64,
      48,
      Math.PI * 0.5,
      Math.PI * 1.5,
      0,
      Math.PI
    );
    this._remapSphereUVs(mainGeo, Math.PI * 0.5, Math.PI * 1.5);

    const surfaceMat = originalMaterial
      ? originalMaterial.clone()
      : new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 });
    surfaceMat.side = THREE.FrontSide;

    const mainBody = new THREE.Mesh(mainGeo, surfaceMat);
    group.add(mainBody);

    // Cross-Section Internal Faces with realistic textures
    const cutCanvasA = this._createCrossSectionCanvas(data.layers);
    const cutTextureA = new THREE.CanvasTexture(cutCanvasA);
    cutTextureA.colorSpace = THREE.SRGBColorSpace;

    const cutMatA = new THREE.MeshStandardMaterial({
      map: cutTextureA,
      roughness: 0.6,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    const cutGeoA = new THREE.CircleGeometry(radius, 64, -Math.PI / 2, Math.PI);
    const wallMainA = new THREE.Mesh(cutGeoA, cutMatA);
    wallMainA.rotation.y = 0;
    group.add(wallMainA);

    const cutCanvasB = this._createCrossSectionCanvas(data.layers);
    const cutTextureB = new THREE.CanvasTexture(cutCanvasB);
    cutTextureB.colorSpace = THREE.SRGBColorSpace;

    const cutMatB = new THREE.MeshStandardMaterial({
      map: cutTextureB,
      roughness: 0.6,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    const cutGeoB = new THREE.CircleGeometry(radius, 64, -Math.PI / 2, Math.PI);
    const wallMainB = new THREE.Mesh(cutGeoB, cutMatB);
    wallMainB.rotation.y = Math.PI * 0.5;
    group.add(wallMainB);

    // Glowing Central 3D Core Sphere
    const coreLayer = data.layers[0];
    const coreRadius = radius * (coreLayer.ratio || 0.25);
    const coreGeo = new THREE.SphereGeometry(coreRadius, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffcc33,
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.1,
    });
    const coreSphere = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreSphere);

    return {
      group,
      data,
      radius,
      coreSphere,
      cutTextureA,
      cutTextureB,
    };
  }

  _remapSphereUVs(geometry, phiStart, phiLength) {
    const uvAttr = geometry.attributes.uv;
    const fullCircle = Math.PI * 2;
    for (let i = 0; i < uvAttr.count; i++) {
      const u = uvAttr.getX(i);
      const remappedU = (phiStart + u * phiLength) / fullCircle;
      uvAttr.setX(i, remappedU);
    }
    uvAttr.needsUpdate = true;
  }

  _createCrossSectionCanvas(layers, highlightIdx = -1) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    const cx = 512;
    const cy = 512;
    const maxR = 512;

    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, 1024, 1024);

    // Render layers from outermost to innermost with rich gradients and rock textures
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      const r = maxR * layer.ratio;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, false);
      ctx.lineTo(cx, cy);
      ctx.closePath();
      ctx.clip();

      const isCore = (i === 0);
      const isOuterCore = (i === 1 && layers.length > 2);
      const isMantle = (i >= 2 || (i === 1 && layers.length <= 2));

      if (isCore) {
        // Inner Core: Brilliant incandescent white-gold radial glow
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, '#fffbeb');
        grad.addColorStop(0.7, '#fef08a');
        grad.addColorStop(1, '#f59e0b');
        ctx.fillStyle = grad;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      } else if (isOuterCore) {
        // Outer Core: Fiery liquid magma swirl gradient
        const grad = ctx.createRadialGradient(cx, cy, maxR * layers[0].ratio, cx, cy, r);
        grad.addColorStop(0, '#f59e0b');
        grad.addColorStop(0.4, '#ea580c');
        grad.addColorStop(0.8, '#c2410c');
        grad.addColorStop(1, '#9a3412');
        ctx.fillStyle = grad;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

        // Convective fluid striations
        ctx.fillStyle = 'rgba(254, 240, 138, 0.18)';
        for (let j = 0; j < 30; j++) {
          const angle = (Math.random() - 0.5) * Math.PI;
          const dist = maxR * (layers[0].ratio + Math.random() * (layer.ratio - layers[0].ratio));
          ctx.beginPath();
          ctx.arc(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, Math.random() * 12 + 4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Mantle / Crust: Realistic earthy rock texture with mineral grain
        const baseColor = (i === layers.length - 1) ? '#573318' : '#8c4820';
        ctx.fillStyle = baseColor;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

        // Granular mineral texture
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        for (let k = 0; k < 400; k++) {
          const rx = cx + (Math.random() * 0.98) * r;
          const ry = cy + (Math.random() * 2 - 1) * r;
          ctx.fillRect(rx, ry, Math.random() * 3 + 1, Math.random() * 3 + 1);
        }
        ctx.fillStyle = 'rgba(255, 200, 150, 0.15)';
        for (let k = 0; k < 200; k++) {
          const rx = cx + (Math.random() * 0.98) * r;
          const ry = cy + (Math.random() * 2 - 1) * r;
          ctx.fillRect(rx, ry, Math.random() * 2 + 1, Math.random() * 2 + 1);
        }
      }

      ctx.restore();

      // Delicate neon boundary line
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, false);
      ctx.lineWidth = (i === highlightIdx) ? 6 : 2;
      ctx.strokeStyle = (i === highlightIdx) ? '#38bdf8' : 'rgba(255, 255, 255, 0.35)';
      ctx.stroke();
    }

    // Central dividing vertical line
    ctx.beginPath();
    ctx.moveTo(cx, cy - maxR);
    ctx.lineTo(cx, cy + maxR);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.stroke();

    return canvas;
  }

  _renderCallouts(key) {
    if (!this.calloutsOverlay) return;

    const data = PLANET_STRUCTURES[key] || PLANET_STRUCTURES.earth;
    // Default callouts matching the screenshots
    const defaultLabels = [
      { name: 'CRUST', sub: 'SOLID SILICATE ROCK<br>MOSTLY BASALT', idx: 3 },
      { name: 'MANTLE', sub: 'SOLID SILICATE ROCK', idx: 2 },
      { name: 'OUTER CORE', sub: 'LIQUID IRON AND NICKEL', idx: 1 },
      { name: 'INNER CORE', sub: 'DENSE SOLID IRON AND NICKEL', idx: 0 },
    ];

    let html = '';
    // Build custom callout list from data.layers
    const layers = [...data.layers].reverse(); // from outermost to innermost
    layers.forEach((l, reverseIdx) => {
      const originalIdx = data.layers.length - 1 - reverseIdx;
      const dl = defaultLabels[reverseIdx] || {
        name: l.name.toUpperCase(),
        sub: l.composition ? l.composition.toUpperCase() : 'INTERNAL LAYER',
        idx: originalIdx,
      };

      html += `
        <div class="structure-callout-item" data-layer-idx="${originalIdx}" data-layer-id="${l.id}">
          <div class="callout-card">
            <span class="callout-title">${l.name.toUpperCase()}</span>
            <span class="callout-desc">${dl.sub}</span>
          </div>
          <div class="callout-pointer-bracket"></div>
        </div>
      `;
    });

    this.calloutsOverlay.innerHTML = html;
    this.calloutsOverlay.style.display = 'flex';
  }

  selectLayer(index) {
    this.selectedLayerIndex = index;
    sound.playClick();
    this._highlightLayer(index);

    if (this.onLayerSelect && this.activeKey) {
      const data = PLANET_STRUCTURES[this.activeKey];
      if (data && data.layers[index]) {
        this.onLayerSelect(data.layers[index].id);
      }
    }
  }

  _highlightLayer(index) {
    if (!this.activeKey) return;
    const assembly = this.assemblies.get(this.activeKey);
    if (!assembly) return;

    // Update active highlight class on DOM callouts
    if (this.calloutsOverlay) {
      const items = this.calloutsOverlay.querySelectorAll('.structure-callout-item');
      items.forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.layerIdx) === index);
      });
    }

    // Redraw textures with highlight
    const newCanvasA = this._createCrossSectionCanvas(assembly.data.layers, index);
    assembly.cutTextureA.image = newCanvasA;
    assembly.cutTextureA.needsUpdate = true;

    const newCanvasB = this._createCrossSectionCanvas(assembly.data.layers, index);
    assembly.cutTextureB.image = newCanvasB;
    assembly.cutTextureB.needsUpdate = true;
  }

  update(delta) {
    if (!this.isOpen && this.targetProgress === 0) return;
    if (Math.abs(this.progress - this.targetProgress) > 0.001) {
      this.progress += (this.targetProgress - this.progress) * Math.min(1, delta * 6);
    } else {
      this.progress = this.targetProgress;
    }
  }
}
