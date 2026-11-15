import * as THREE from 'three';

export class SpaceDebris {
  constructor() {
    this.group = new THREE.Group();

    this._buildAsteroidBelt();
    this._buildISS();
    this._buildSpaceJunkField();
    this._buildVoyagerProbe();
  }

  _buildAsteroidBelt() {
    // Asteroid belt between Mars (r=42) and Jupiter (r=62)
    const count = 1200;
    const innerRadius = 48;
    const outerRadius = 56;

    const geo = new THREE.DodecahedronGeometry(0.18, 0); // Low-poly rocky asteroids
    const mat = new THREE.MeshStandardMaterial({
      color: 0x887766,
      roughness: 0.9,
      metalness: 0.1,
    });

    this.asteroidBelt = new THREE.InstancedMesh(geo, mat, count);
    const dummy = new THREE.Object3D();

    this.asteroidData = [];

    for (let i = 0; i < count; i++) {
      const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 2.2;
      const speed = 0.04 + (Math.random() - 0.5) * 0.01;
      const rotSpeed = (Math.random() - 0.5) * 2.0;

      dummy.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      const scale = 0.4 + Math.random() * 0.9;
      dummy.scale.set(scale, scale * (0.8 + Math.random() * 0.4), scale);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.updateMatrix();

      this.asteroidBelt.setMatrixAt(i, dummy.matrix);
      this.asteroidData.push({ radius, angle, height, speed, rotSpeed, scale });
    }

    this.asteroidBelt.instanceMatrix.needsUpdate = true;
    this.group.add(this.asteroidBelt);
  }

  _buildISS() {
    // International Space Station model
    this.issGroup = new THREE.Group();
    this.issGroup.name = 'iss';

    // Central pressurized modules (metallic cylinders)
    const moduleMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.8,
      roughness: 0.2,
    });
    const moduleGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 16);
    moduleGeo.rotateZ(Math.PI / 2);
    const moduleMesh = new THREE.Mesh(moduleGeo, moduleMat);
    this.issGroup.add(moduleMesh);

    // Integrated Truss Structure
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.3 });
    const trussGeo = new THREE.BoxGeometry(1.2, 0.03, 0.03);
    const trussMesh = new THREE.Mesh(trussGeo, trussMat);
    this.issGroup.add(trussMesh);

    // Solar Array Wings (glowing copper/gold solar cells)
    const solarMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      emissive: 0x0f172a,
      roughness: 0.1,
      metalness: 0.9,
    });

    [-0.45, 0.45].forEach((x) => {
      [-0.15, 0.15].forEach((z) => {
        const wingGeo = new THREE.BoxGeometry(0.25, 0.005, 0.2);
        const wing = new THREE.Mesh(wingGeo, solarMat);
        wing.position.set(x, 0, z);
        this.issGroup.add(wing);
      });
    });

    // Scale & add to space debris group
    this.issGroup.position.set(22, 0.5, 20); // Near Earth
    this.group.add(this.issGroup);
  }

  _buildSpaceJunkField() {
    // Orbiting space debris (rocket fragments, defunct solar panels, bolts)
    const junkCount = 200;
    const positions = new Float32Array(junkCount * 3);
    const colors = new Float32Array(junkCount * 3);

    for (let i = 0; i < junkCount; i++) {
      const i3 = i * 3;
      const r = 2.2 + Math.random() * 1.5; // Orbiting just above Earth
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      colors[i3] = 0.8 + Math.random() * 0.2;
      colors[i3 + 1] = 0.8 + Math.random() * 0.2;
      colors[i3 + 2] = 0.9;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    this.spaceJunk = new THREE.Points(geo, mat);
    this.group.add(this.spaceJunk);
  }

  _buildVoyagerProbe() {
    // Voyager 1 deep space probe on interstellar trajectory
    this.voyagerGroup = new THREE.Group();
    this.voyagerGroup.name = 'voyager';

    // High Gain Antenna Dish
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.1 });
    const dishGeo = new THREE.ConeGeometry(0.35, 0.1, 32, 1, true);
    dishGeo.rotateX(Math.PI);
    const dish = new THREE.Mesh(dishGeo, dishMat);
    this.voyagerGroup.add(dish);

    // Golden Record mounted on the side
    const recordMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xb45309,
      emissiveIntensity: 0.4,
      metalness: 0.9,
      roughness: 0.2,
    });
    const recordGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.01, 24);
    recordGeo.rotateZ(Math.PI / 2);
    const record = new THREE.Mesh(recordGeo, recordMat);
    record.position.set(-0.15, -0.1, 0);
    this.voyagerGroup.add(record);

    // RTG Power Boom
    const boomMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const boomGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.8, 8);
    boomGeo.rotateZ(Math.PI / 3);
    const boom = new THREE.Mesh(boomGeo, boomMat);
    boom.position.set(0.3, -0.15, 0);
    this.voyagerGroup.add(boom);

    this.voyagerGroup.position.set(-110, 15, 80);
    this.group.add(this.voyagerGroup);
  }

  update(elapsed, delta, earthPos) {
    // 1. Slowly rotate Asteroid Belt
    if (this.asteroidBelt) {
      this.asteroidBelt.rotation.y += delta * 0.015;
    }

    // 2. Orbit ISS around Earth position
    if (this.issGroup && earthPos) {
      const issDist = 1.9;
      const issSpeed = 1.2;
      const angle = elapsed * issSpeed;
      this.issGroup.position.set(
        earthPos.x + Math.cos(angle) * issDist,
        earthPos.y + Math.sin(angle * 0.7) * 0.4,
        earthPos.z + Math.sin(angle) * issDist
      );
      this.issGroup.rotation.y = -angle;
      this.issGroup.rotation.z = Math.sin(angle) * 0.2;
    }

    // 3. Keep space junk orbiting with Earth
    if (this.spaceJunk && earthPos) {
      this.spaceJunk.position.copy(earthPos);
      this.spaceJunk.rotation.y += delta * 0.5;
    }

    // 4. Drift Voyager 1 gently
    if (this.voyagerGroup) {
      this.voyagerGroup.rotation.y += delta * 0.05;
      this.voyagerGroup.rotation.z += delta * 0.02;
    }
  }
}

