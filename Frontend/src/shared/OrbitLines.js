import * as THREE from 'three';
import { ORBIT_RADII } from '../config/planets.js';

export class OrbitLines {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'orbitLines';
    this.visible = true;

    this._buildPlanetaryOrbits();
    this._buildCometOrbit();
  }

  _buildPlanetaryOrbits() {
    const segments = 256;
    const names = Object.keys(ORBIT_RADII);

    // Thin, mature, uncolored monochromatic celestial orbit lines (NASA planetarium style)
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0x94a3b8, // Crisp neutral slate/silver
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });

    for (const name of names) {
      const radius = ORBIT_RADII[name];
      if (!radius) continue;

      const points = [];
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        ));
      }

      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.LineLoop(lineGeo, orbitMat);
      line.name = `orbit-line-${name}`;
      this.group.add(line);
    }
  }

  _buildCometOrbit() {
    // Halley's Comet subtle, thin, uncolored elliptical orbit line
    const a = 85;
    const b = 45;
    const ox = 68;
    const tilt = 0.32;
    const segments = 256;
    const points = [];

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(angle) * a + ox,
        Math.sin(angle) * Math.sin(tilt) * b * 0.4,
        Math.sin(angle) * b
      ));
    }

    const cometGeo = new THREE.BufferGeometry().setFromPoints(points);
    const cometMat = new THREE.LineDashedMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.18,
      dashSize: 2.0,
      gapSize: 2.0,
      depthWrite: false,
    });
    const cometLine = new THREE.Line(cometGeo, cometMat);
    cometLine.computeLineDistances();
    cometLine.name = 'orbit-line-comet';
    this.group.add(cometLine);
  }

  toggle() {
    this.visible = !this.visible;
    this.group.visible = this.visible;
    return this.visible;
  }

  setVisible(state) {
    this.visible = state;
    this.group.visible = state;
  }
}
