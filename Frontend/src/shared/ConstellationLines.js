import * as THREE from 'three';

export class ConstellationLines {
  constructor(radius = 850) {
    this.radius = radius;
    this.group = new THREE.Group();
    this.group.name = 'constellations';
    this.visible = true;

    this._buildConstellations();
  }

  _raDecToVector3(raHours, decDeg) {
    const theta = (raHours / 24) * Math.PI * 2;
    const phi = (decDeg / 180) * Math.PI;
    const cosPhi = Math.cos(phi);
    return new THREE.Vector3(
      this.radius * cosPhi * Math.cos(theta),
      this.radius * Math.sin(phi),
      this.radius * cosPhi * Math.sin(theta)
    );
  }

  _buildConstellations() {
    // Real astronomical RA (hours) and Dec (degrees) for major constellation star nodes
    const constellations = [
      // Ursa Major (Big Dipper)
      {
        name: 'Ursa Major',
        stars: [
          [11.06, 61.75], // Dubhe
          [11.03, 56.38], // Merak
          [11.9, 53.69],  // Phecda
          [12.25, 57.03], // Megrez
          [12.9, 55.96],  // Alioth
          [13.4, 54.92],  // Mizar
          [13.79, 49.31], // Alkaid
        ],
        segments: [
          [0, 1], [1, 2], [2, 3], [3, 0], // Bowl
          [3, 4], [4, 5], [5, 6],         // Handle
        ]
      },
      // Orion
      {
        name: 'Orion',
        stars: [
          [5.92, 7.41],   // Betelgeuse (0)
          [5.24, -8.2],   // Rigel (1)
          [5.42, 6.35],   // Bellatrix (2)
          [5.79, -9.67],  // Saiph (3)
          [5.53, -0.3],   // Mintaka (4)
          [5.6, -1.2],    // Alnilam (5)
          [5.68, -1.94],  // Alnitak (6)
          [5.58, 9.93],   // Meissa (7)
        ],
        segments: [
          [0, 2], [2, 4], [0, 6], [1, 3], [1, 4], [3, 6], // Shoulders, hips
          [4, 5], [5, 6], // Belt
          [0, 7], [2, 7], // Head
        ]
      },
      // Cassiopeia
      {
        name: 'Cassiopeia',
        stars: [
          [0.15, 59.15],  // Caph
          [0.67, 56.54],  // Schedar
          [0.94, 60.72],  // Cih (Gamma Cas)
          [1.43, 60.23],  // Ruchbah
          [1.9, 63.67],   // Segin
        ],
        segments: [
          [0, 1], [1, 2], [2, 3], [3, 4]
        ]
      },
      // Cygnus (The Northern Cross)
      {
        name: 'Cygnus',
        stars: [
          [20.69, 45.28], // Deneb (0)
          [20.37, 40.26], // Sadr (1)
          [19.51, 27.96], // Albireo (2)
          [19.77, 45.13], // Fawaris (3)
          [20.77, 33.97], // Gienah (4)
        ],
        segments: [
          [0, 1], [1, 2], // Spine
          [3, 1], [1, 4], // Wings
        ]
      },
      // Taurus
      {
        name: 'Taurus',
        stars: [
          [4.6, 16.51],   // Aldebaran (0)
          [5.44, 28.61],  // Elnath (1)
          [5.63, 21.14],  // Tianguan (2)
          [4.48, 15.63],  // Hyadum I (3)
          [4.33, 15.96],  // Ain (4)
          [3.79, 24.11],  // Alcyone (Pleiades) (5)
        ],
        segments: [
          [0, 3], [3, 4], [4, 0], // Hyades V
          [0, 2], [1, 4],
          [4, 5]
        ]
      },
      // Scorpius
      {
        name: 'Scorpius',
        stars: [
          [16.49, -26.43], // Antares (0)
          [16.09, -22.62], // Graffias (1)
          [16.01, -22.8],  // Dschubba (2)
          [15.98, -26.11], // Pi Sco (3)
          [16.84, -34.29], // Wei (4)
          [17.62, -37.1],  // Shaula (5)
          [17.71, -39.0],  // Lesath (6)
        ],
        segments: [
          [2, 1], [2, 3], [2, 0], [0, 4], [4, 5], [5, 6]
        ]
      },
      // Leo
      {
        name: 'Leo',
        stars: [
          [10.14, 11.97],  // Regulus (0)
          [10.33, 19.84],  // Algieba (1)
          [10.28, 23.42],  // Adhafera (2)
          [9.76, 23.77],   // Rasalas (3)
          [11.23, 15.43],  // Chertan (4)
          [11.82, 14.57],  // Denebola (5)
          [11.24, 20.52],  // Zosma (6)
        ],
        segments: [
          [0, 1], [1, 2], [2, 3], // Sickle
          [1, 6], [6, 5], [5, 4], [4, 0], [4, 6]
        ]
      },
      // Pegasus
      {
        name: 'Pegasus',
        stars: [
          [23.08, 15.21],  // Markab (0)
          [23.06, 28.08],  // Scheat (1)
          [0.14, 15.18],   // Algenib (2)
          [0.14, 29.09],   // Alpheratz (3)
        ],
        segments: [
          [0, 1], [1, 3], [3, 2], [2, 0] // Great Square
        ]
      },
      // Gemini
      {
        name: 'Gemini',
        stars: [
          [7.58, 31.89],   // Castor (0)
          [7.76, 28.03],   // Pollux (1)
          [6.63, 16.4],    // Alhena (2)
          [6.25, 22.51],   // Tejat (3)
          [6.75, 25.13],   // Mebsuta (4)
          [7.07, 20.57],   // Wasat (5)
        ],
        segments: [
          [0, 1], [0, 4], [4, 3], [1, 5], [5, 2]
        ]
      },
      // Canis Major
      {
        name: 'Canis Major',
        stars: [
          [6.75, -16.72],  // Sirius (0)
          [6.98, -28.97],  // Wezen (1)
          [6.38, -17.96],  // Murzim (2)
          [7.14, -26.39],  // Aludra (3)
          [6.98, -30.06],  // Adhara (4)
        ],
        segments: [
          [0, 2], [0, 1], [1, 3], [1, 4]
        ]
      },
      // Crux (Southern Cross)
      {
        name: 'Crux',
        stars: [
          [12.44, -63.1],  // Acrux (0)
          [12.52, -57.11], // Gacrux (1)
          [12.79, -59.69], // Mimosa (2)
          [12.25, -58.75], // Imai (3)
        ],
        segments: [
          [0, 1], [2, 3]
        ]
      }
    ];

    const linePoints = [];
    const starPoints = [];

    for (const c of constellations) {
      const starVecs = c.stars.map(([ra, dec]) => this._raDecToVector3(ra, dec));
      starPoints.push(...starVecs);

      for (const [i1, i2] of c.segments) {
        if (starVecs[i1] && starVecs[i2]) {
          linePoints.push(starVecs[i1], starVecs[i2]);
        }
      }
    }

    // Line segments
    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.lineMesh = new THREE.LineSegments(lineGeo, lineMat);
    this.group.add(this.lineMesh);

    // Glowing star nodes at the constellation vertices
    const starGeo = new THREE.BufferGeometry().setFromPoints(starPoints);
    const starMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 3.5,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.starPointsMesh = new THREE.Points(starGeo, starMat);
    this.group.add(this.starPointsMesh);
  }

  toggle() {
    this.visible = !this.visible;
    this.group.visible = this.visible;
    return this.visible;
  }
}

