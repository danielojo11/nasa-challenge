import * as THREE from 'three';

export class PlanetLabels {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'planetLabels';
    this.labels = [];
    this.dwarfMeshes = {};
    this.dwarfOrbits = new THREE.Group();
    this.group.add(this.dwarfOrbits);

    this.visible = true;

    this._initDwarfPlanets();
  }

  _createLabelSprite(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Font styling matching screenshots
    ctx.font = '700 46px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Outer glow
    ctx.shadowColor = 'rgba(56, 189, 248, 0.8)';
    ctx.shadowBlur = 12;

    // Text fill
    ctx.fillStyle = '#bae6fd';
    ctx.fillText(text.toUpperCase(), canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.85,
    });

    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(6.0, 1.5, 1.0);
    return sprite;
  }

  _initDwarfPlanets() {
    // Colors and sizes for dwarf planets shown in screenshots
    const dwarfs = [
      { key: 'ceres', name: 'CERES', r: 0.35, color: 0x999988, distAU: 2.77, scale: 0.5 },
      { key: 'pluto', name: 'PLUTO', r: 0.45, color: 0xc4b59f, distAU: 39.48, scale: 0.6 },
      { key: 'haumea', name: 'HAUMEA', r: 0.4, color: 0x94a3b8, distAU: 43.13, scale: 0.55 },
      { key: 'makemake', name: 'MAKEMAKE', r: 0.4, color: 0xc89d7c, distAU: 45.79, scale: 0.55 },
      { key: 'eris', name: 'ERIS', r: 0.48, color: 0xdbeafe, distAU: 67.78, scale: 0.6 },
    ];

    const sphereGeo = new THREE.SphereGeometry(1, 16, 16);

    for (const d of dwarfs) {
      const mat = new THREE.MeshStandardMaterial({
        color: d.color,
        roughness: 0.85,
        metalness: 0.15,
      });

      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.scale.setScalar(d.r);
      mesh.name = `dwarf_${d.key}`;
      this.group.add(mesh);
      this.dwarfMeshes[d.key] = mesh;

      // Orbit ellipse
      const orbitGeo = new THREE.BufferGeometry();
      const points = [];
      const segments = 128;
      // In solar system scale: 1 AU is ~30 units for inner planets, compressed logarithmic scale for outer dwarfs
      // Let's compute a consistent display radius mapping
      const displayRadius = this._auToDisplayRadius(d.distAU);

      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * displayRadius, 0, Math.sin(theta) * displayRadius));
      }
      orbitGeo.setFromPoints(points);

      const orbitMat = new THREE.LineBasicMaterial({
        color: 0xca8a04,
        transparent: true,
        opacity: 0.25,
      });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      this.dwarfOrbits.add(orbitLine);
    }
  }

  _auToDisplayRadius(au) {
    // Scaling matches the existing solar system model:
    // Inner planets: Mercury 0.387AU -> 14, Earth 1.0AU -> 30, Mars 1.52AU -> 42, Jupiter 5.2AU -> 62, Saturn 9.5AU -> 80, Uranus 19AU -> 100, Neptune 30AU -> 120
    if (au <= 1.6) {
      return au * 28;
    } else if (au <= 6.0) {
      return 42 + (au - 1.5) * 5.5; // Ceres around ~51 (asteroid belt), Jupiter 62
    } else if (au <= 32.0) {
      return 62 + (au - 5.2) * 2.34;
    } else {
      // Kuiper Belt and outer dwarfs (Pluto, Haumea, Makemake, Eris)
      return 120 + (au - 30) * 1.5;
    }
  }

  registerPlanet(name, object3D, yOffset = 1.8) {
    const sprite = this._createLabelSprite(name);
    this.group.add(sprite);
    this.labels.push({
      name,
      sprite,
      target: object3D,
      yOffset,
      baseScale: 6.0,
    });
  }

  registerDwarf(key, name, yOffset = 1.5) {
    const mesh = this.dwarfMeshes[key];
    if (mesh) {
      this.registerPlanet(name, mesh, yOffset);
    }
  }

  update(camera, ephemerisData = null) {
    if (!this.visible) return;

    // Update dwarf positions if ephemeris data provided
    if (ephemerisData) {
      for (const [key, mesh] of Object.entries(this.dwarfMeshes)) {
        if (ephemerisData[key]) {
          const r = this._auToDisplayRadius(ephemerisData[key].distanceAU);
          const rad = ephemerisData[key].heliocentricLongitudeRad;
          mesh.position.set(Math.cos(rad) * r, 0, Math.sin(rad) * r);
        }
      }
    }

    // Update label billboard positions and scaling based on camera distance
    for (const item of this.labels) {
      if (!item.target) continue;

      const targetPos = new THREE.Vector3();
      item.target.getWorldPosition(targetPos);

      // Float above target
      item.sprite.position.set(
        targetPos.x,
        targetPos.y + item.yOffset,
        targetPos.z
      );

      // Distance-dependent scaling so labels stay comfortably readable
      const dist = camera.position.distanceTo(item.sprite.position);
      const factor = Math.max(0.6, Math.min(dist * 0.04, 3.5));
      item.sprite.scale.set(item.baseScale * factor, 1.5 * factor, 1.0);
    }
  }

  toggle() {
    this.visible = !this.visible;
    this.group.visible = this.visible;
    return this.visible;
  }
}

