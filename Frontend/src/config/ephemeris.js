import { ORBIT_RADII } from './planets.js';

const DEG_TO_RAD = Math.PI / 180;
const AU_SCALE = Object.fromEntries(
  Object.entries(ORBIT_RADII).map(([name, radius]) => [name, radius / {
    mercury: 0.3871,
    venus: 0.7233,
    earth: 1,
    mars: 1.5237,
    jupiter: 5.2029,
    saturn: 9.5367,
    uranus: 19.1892,
    neptune: 30.0699
  }[name]])
);

const ORBITAL_ELEMENTS = {
  mercury: {
    a: [0.38709927, 0.00000037],
    e: [0.20563593, 0.00001906],
    inclination: [7.00497902, -0.00594749],
    longitude: [252.2503235, 149472.67411175],
    perihelion: [77.45779628, 0.16047689],
    node: [48.33076593, -0.12534081]
  },
  venus: {
    a: [0.72333566, 0.0000039],
    e: [0.00677672, -0.00004107],
    inclination: [3.39467605, -0.0007889],
    longitude: [181.9790995, 58517.81538729],
    perihelion: [131.60246718, 0.00268329],
    node: [76.67984255, -0.27769418]
  },
  earth: {
    a: [1.00000261, 0.00000562],
    e: [0.01671123, -0.00004392],
    inclination: [-0.00001531, -0.01294668],
    longitude: [100.46457166, 35999.37244981],
    perihelion: [102.93768193, 0.32327364],
    node: [0, 0]
  },
  mars: {
    a: [1.52371034, 0.00001847],
    e: [0.0933941, 0.00007882],
    inclination: [1.84969142, -0.00813131],
    longitude: [-4.55343205, 19140.30268499],
    perihelion: [-23.94362959, 0.44441088],
    node: [49.55953891, -0.29257343]
  },
  jupiter: {
    a: [5.202887, -0.00011607],
    e: [0.04838624, -0.00013253],
    inclination: [1.30439695, -0.00183714],
    longitude: [34.39644051, 3034.74612775],
    perihelion: [14.72847983, 0.21252668],
    node: [100.47390909, 0.20469106]
  },
  saturn: {
    a: [9.53667594, -0.0012506],
    e: [0.05386179, -0.00050991],
    inclination: [2.48599187, 0.00193609],
    longitude: [49.95424423, 1222.49362201],
    perihelion: [92.59887831, -0.41897216],
    node: [113.66242448, -0.28867794]
  },
  uranus: {
    a: [19.18916464, -0.00196176],
    e: [0.04725744, -0.00004397],
    inclination: [0.77263783, -0.00242939],
    longitude: [313.23810451, 428.48202785],
    perihelion: [170.9542763, 0.40805281],
    node: [74.01692503, 0.04240589]
  },
  neptune: {
    a: [30.06992276, 0.00026291],
    e: [0.00859048, 0.00005105],
    inclination: [1.77004347, 0.00035372],
    longitude: [-55.12002969, 218.45945325],
    perihelion: [44.96476227, -0.32241464],
    node: [131.78422574, -0.00508664]
  }
};

function elementsAt(name, date) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const centuries = (jd - 2451545) / 36525;
  const elements = ORBITAL_ELEMENTS[name];
  const valueAtDate = ([value, rate]) => value + rate * centuries;

  return {
    a: valueAtDate(elements.a),
    e: valueAtDate(elements.e),
    inclination: valueAtDate(elements.inclination) * DEG_TO_RAD,
    meanAnomaly: (valueAtDate(elements.longitude) - valueAtDate(elements.perihelion)) * DEG_TO_RAD,
    perihelion: valueAtDate(elements.perihelion) * DEG_TO_RAD,
    node: valueAtDate(elements.node) * DEG_TO_RAD
  };
}

function eccentricAnomaly(meanAnomaly, eccentricity) {
  let estimate = meanAnomaly;
  for (let i = 0; i < 8; i += 1) {
    estimate -= (estimate - eccentricity * Math.sin(estimate) - meanAnomaly)
      / (1 - eccentricity * Math.cos(estimate));
  }
  return estimate;
}

function positionAtTrueAnomaly(name, trueAnomaly, eccentricity, inclination, perihelion, node) {
  const semimajorAxis = ORBIT_RADII[name] / AU_SCALE[name];
  const radius = semimajorAxis * (1 - eccentricity ** 2)
    / (1 + eccentricity * Math.cos(trueAnomaly));
  const argument = trueAnomaly + perihelion - node;
  const cosNode = Math.cos(node);
  const sinNode = Math.sin(node);
  const cosArgument = Math.cos(argument);
  const sinArgument = Math.sin(argument);
  const cosInclination = Math.cos(inclination);

  const x = radius * (cosNode * cosArgument - sinNode * sinArgument * cosInclination);
  const y = radius * (sinNode * cosArgument + cosNode * sinArgument * cosInclination);
  const z = radius * sinArgument * Math.sin(inclination);

  return [x, z, -y];
}

export function getPlanetPosition(name, date = new Date()) {
  const elements = elementsAt(name, date);
  const eccentric = eccentricAnomaly(elements.meanAnomaly, elements.e);
  const trueAnomaly = Math.atan2(
    Math.sqrt(1 - elements.e ** 2) * Math.sin(eccentric),
    Math.cos(eccentric) - elements.e
  );

  return positionAtTrueAnomaly(
    name,
    trueAnomaly,
    elements.e,
    elements.inclination,
    elements.perihelion,
    elements.node
  );
}

export function getPlanetOrbitPoint(name, trueAnomaly) {
  const elements = elementsAt(name, new Date());
  return positionAtTrueAnomaly(
    name,
    trueAnomaly,
    elements.e,
    elements.inclination,
    elements.perihelion,
    elements.node
  );
}
