import * as THREE from 'three';
import { PLANETS } from '../config/planets.js';
import { loadTexture } from '../core/TextureLoader.js';
import { AtmosphereShader } from '../shaders/atmosphereShader.js';
import { orbitAround } from '../shared/animations.js';
import { createSphere } from '../shared/geometries.js';

export class Earth {
  constructor() {
    this.group = new THREE.Group();
    const cfg = PLANETS.earth;
    this.group.position.set(...cfg.position);

    this._buildPlanet(cfg);
    this._buildClouds(cfg);
    this._buildAtmosphere(cfg);
    this._buildMoon(cfg);
    this._buildMoonOrbit(cfg);
  }

  _buildPlanet(cfg) {
    const map = loadTexture('./textures/2k_earth_daymap.jpg');
    const normalMap = loadTexture('./textures/2k_earth_normal_map.jpg', false);

    const geo = new THREE.SphereGeometry(cfg.radius, 128, 128);
    const mat = new THREE.MeshStandardMaterial({
      map,
      normalMap,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.78,
      metalness: 0.02,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.group.add(this.mesh);
  }

  _buildClouds(cfg) {
    const map = loadTexture('./textures/2k_earth_clouds.jpg');
    const geo = new THREE.SphereGeometry(cfg.radius * 1.007, 96, 96);
    const mat = new THREE.MeshStandardMaterial({
      alphaMap: map,
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      roughness: 1,
      metalness: 0,
    });
    this.clouds = new THREE.Mesh(geo, mat);
    this.group.add(this.clouds);
  }

  _buildAtmosphere(cfg) {
    const geo = new THREE.SphereGeometry(cfg.radius * 1.06, 64, 64);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0.35, 0.6, 1.0) },
        uIntensity: { value: 0.5 },
        uFalloff: { value: 4.0 },
        uTime: { value: 0 },
      },
      vertexShader: AtmosphereShader.vertexShader,
      fragmentShader: AtmosphereShader.fragmentShader,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.atmosphere = new THREE.Mesh(geo, mat);
    this.group.add(this.atmosphere);
  }

  _buildMoon(cfg) {
    const map = loadTexture('./textures/2k_moon.jpg');
    const geo = createSphere(cfg.moonRadius, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
      map,
      roughness: 0.95,
      metalness: 0.0,
    });
    this.moon = new THREE.Mesh(geo, mat);
    this.group.add(this.moon);
  }

  _buildMoonOrbit(cfg) {
    const segments = 64;
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(angle) * cfg.moonDistance,
        Math.sin(angle) * Math.tan(0.1) * cfg.moonDistance * 0.3,
        Math.sin(angle) * cfg.moonDistance
      ));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    this.moonOrbitLine = new THREE.LineLoop(geo, mat);
    this.group.add(this.moonOrbitLine);
  }

  update(elapsed, delta) {
    const cfg = PLANETS.earth;
    this.mesh.rotation.y += delta * cfg.rotationSpeed;
    this.clouds.rotation.y += delta * cfg.rotationSpeed * 1.15;
    orbitAround(this.moon, elapsed, cfg.moonSpeed, cfg.moonDistance, 0.1);
  }
}
