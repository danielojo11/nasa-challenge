import * as THREE from 'three';

export class DwarfPlanets {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'dwarf_planets_system';

    this.dwarfs = {};
    this.orbits = new THREE.Group();
    this.group.add(this.orbits);

    this._buildCeres();
    this._buildPluto();
    this._buildHaumea();
    this._buildMakemake();
    this._buildEris();
  }

  // Realistic procedural texture generator for dwarf planet surfaces
  _generateSurfaceTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (type === 'pluto') {
      // Pluto: Brownish-red tholin background with iconic bright white/gold Sputnik Planitia heart
      ctx.fillStyle = '#8b5a3c';
      ctx.fillRect(0, 0, 1024, 512);

      // Tholin darker equatorial belts
      ctx.fillStyle = '#4a2511';
      ctx.fillRect(0, 230, 1024, 90);

      // Mottled craters and terrain
      for (let i = 0; i < 400; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 512;
        const r = Math.random() * 30 + 5;
        ctx.fillStyle = (Math.random() > 0.5) ? 'rgba(74, 37, 17, 0.4)' : 'rgba(196, 154, 108, 0.3)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tombaugh Regio (The Heart) at center-left
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      // Left lobe (Sputnik Planitia)
      ctx.ellipse(440, 260, 95, 120, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // Right lobe
      ctx.beginPath();
      ctx.ellipse(540, 270, 75, 95, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Soft nitrogen ice gradient inside the heart
      const grad = ctx.createRadialGradient(440, 260, 10, 440, 260, 110);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.7, '#fff7ed');
      grad.addColorStop(1, 'rgba(254, 215, 170, 0.6)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(440, 260, 95, 120, -0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'ceres') {
      // Ceres: Cratered grey asphalt surface with Occator crater bright salt spots
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(0, 0, 1024, 512);

      // Crater terrain
      for (let i = 0; i < 600; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 512;
        const r = Math.random() * 18 + 2;
        ctx.fillStyle = (Math.random() > 0.4) ? 'rgba(31, 41, 55, 0.45)' : 'rgba(107, 114, 128, 0.35)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Occator Crater Bright Spot (Cerealia Facula)
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(520, 240, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(532, 246, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (type === 'haumea') {
      // Haumea: Crystalline water-ice surface with subtle red organic spot (Dark Spot)
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, 0, 1024, 512);

      for (let i = 0; i < 300; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 512;
        ctx.fillStyle = (Math.random() > 0.5) ? 'rgba(241, 245, 249, 0.4)' : 'rgba(148, 163, 184, 0.3)';
        ctx.fillRect(x, y, Math.random() * 14 + 2, Math.random() * 8 + 2);
      }

      // Red organic impact spot
      ctx.fillStyle = 'rgba(180, 83, 9, 0.55)';
      ctx.beginPath();
      ctx.arc(420, 230, 28, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'makemake') {
      // Makemake: Saturated reddish-orange frozen methane and tholins
      ctx.fillStyle = '#c2410c';
      ctx.fillRect(0, 0, 1024, 512);

      for (let i = 0; i < 400; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 512;
        ctx.fillStyle = (Math.random() > 0.5) ? 'rgba(154, 52, 18, 0.45)' : 'rgba(251, 146, 60, 0.35)';
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 24 + 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'eris') {
      // Eris: Ultra-high albedo brilliant snowy white/pale azure methane-nitrogen frost
      ctx.fillStyle = '#f0f9ff';
      ctx.fillRect(0, 0, 1024, 512);

      for (let i = 0; i < 300; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 512;
        ctx.fillStyle = (Math.random() > 0.5) ? 'rgba(255, 255, 255, 0.6)' : 'rgba(186, 230, 253, 0.4)';
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 20 + 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  _buildCeres() {
    // Ceres: Radius 0.42, Asteroid Belt ~50 units from Sun
    const group = new THREE.Group();
    group.name = 'ceres';

    const geo = new THREE.SphereGeometry(0.45, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
      map: this._generateSurfaceTexture('ceres'),
      roughness: 0.9,
      metalness: 0.05,
    });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);

    this.dwarfs.ceres = { group, mesh, distAU: 2.77, displayR: 50 };
    this.group.add(group);
  }

  _buildPluto() {
    // Pluto: Radius 0.52, Kuiper Belt ~135 units from Sun
    const group = new THREE.Group();
    group.name = 'pluto';

    const geo = new THREE.SphereGeometry(0.55, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
      map: this._generateSurfaceTexture('pluto'),
      roughness: 0.85,
      metalness: 0.05,
    });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);

    // Charon (Pluto's massive binary moon)
    const charonGeo = new THREE.SphereGeometry(0.26, 24, 24);
    const charonMat = new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      roughness: 0.9,
    });
    const charon = new THREE.Mesh(charonGeo, charonMat);
    charon.position.set(1.4, 0.2, 0);
    group.add(charon);

    this.dwarfs.pluto = { group, mesh, charon, distAU: 39.48, displayR: 135 };
    this.group.add(group);
  }

  _buildHaumea() {
    // Haumea: Triaxial ellipsoid (1.4 x 0.85 x 0.65), fast rotation, faint icy ring
    const group = new THREE.Group();
    group.name = 'haumea';

    const geo = new THREE.SphereGeometry(0.48, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
      map: this._generateSurfaceTexture('haumea'),
      roughness: 0.6,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(1.42, 0.85, 0.62); // Triaxial elongated shape
    group.add(mesh);

    // Haumea's thin ring
    const ringGeo = new THREE.RingGeometry(1.0, 1.08, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI * 0.5;
    group.add(ring);

    this.dwarfs.haumea = { group, mesh, ring, distAU: 43.13, displayR: 142 };
    this.group.add(group);
  }

  _buildMakemake() {
    // Makemake: Radius 0.48, Kuiper Belt ~148 units from Sun
    const group = new THREE.Group();
    group.name = 'makemake';

    const geo = new THREE.SphereGeometry(0.48, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
      map: this._generateSurfaceTexture('makemake'),
      roughness: 0.85,
      metalness: 0.05,
    });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);

    this.dwarfs.makemake = { group, mesh, distAU: 45.79, displayR: 148 };
    this.group.add(group);
  }

  _buildEris() {
    // Eris: Radius 0.54, Scattered Disc ~165 units from Sun
    const group = new THREE.Group();
    group.name = 'eris';

    const geo = new THREE.SphereGeometry(0.54, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
      map: this._generateSurfaceTexture('eris'),
      roughness: 0.4,
      metalness: 0.15,
    });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);

    // Moon Dysnomia
    const dysnomiaGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const dysnomiaMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
    const dysnomia = new THREE.Mesh(dysnomiaGeo, dysnomiaMat);
    dysnomia.position.set(1.2, 0.4, 0);
    group.add(dysnomia);

    this.dwarfs.eris = { group, mesh, dysnomia, distAU: 67.78, displayR: 165 };
    this.group.add(group);
  }

  update(elapsed, delta, ephemData = null) {
    // Rotate dwarfs on their axes
    if (this.dwarfs.ceres) this.dwarfs.ceres.mesh.rotation.y += delta * 0.4;
    if (this.dwarfs.pluto) {
      this.dwarfs.pluto.mesh.rotation.y += delta * 0.15;
      if (this.dwarfs.pluto.charon) {
        const charonAngle = elapsed * 0.35;
        this.dwarfs.pluto.charon.position.set(Math.cos(charonAngle) * 1.5, 0.2, Math.sin(charonAngle) * 1.5);
      }
    }
    if (this.dwarfs.haumea) {
      // Rapid spin (3.9 hours)
      this.dwarfs.haumea.mesh.rotation.y += delta * 1.2;
    }
    if (this.dwarfs.makemake) this.dwarfs.makemake.mesh.rotation.y += delta * 0.25;
    if (this.dwarfs.eris) {
      this.dwarfs.eris.mesh.rotation.y += delta * 0.18;
      if (this.dwarfs.eris.dysnomia) {
        const dysAngle = elapsed * 0.28;
        this.dwarfs.eris.dysnomia.position.set(Math.cos(dysAngle) * 1.4, Math.sin(dysAngle) * 0.3, Math.sin(dysAngle) * 1.4);
      }
    }

    // Position according to real-time ephemeris if available
    if (ephemData) {
      for (const [key, d] of Object.entries(this.dwarfs)) {
        if (ephemData[key]) {
          const angle = ephemData[key].heliocentricLongitudeRad;
          d.group.position.x = Math.cos(angle) * d.displayR;
          d.group.position.z = Math.sin(angle) * d.displayR;
        }
      }
    }
  }
}

