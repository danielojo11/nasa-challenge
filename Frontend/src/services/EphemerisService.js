// NASA JPL Approximate Ephemeris for Real-Time Planetary Positions
// Based on Keplerian elements referred to J2000.0 (JD 2451545.0)

export class EphemerisService {
  constructor() {
    this.currentDate = new Date();
    this.isPlaying = true;
    this.timeScale = 1; // 1 = real-time
  }

  // Calculate Julian Date
  getJulianDate(date) {
    const time = date.getTime();
    return time / 86400000 + 2440587.5;
  }

  // Keplerian orbital elements at date d (days since J2000.0)
  // [a (AU), e, I (deg), L (deg, mean longitude), w (deg, perihelion), node (deg, ascending node), dL (deg/day)]
  getPlanetaryPositions(date = this.currentDate) {
    const jd = this.getJulianDate(date);
    const d = jd - 2451545.0; // days since Jan 1, 2000 12:00 UT

    const data = {
      mercury: {
        a: 0.387098,
        e: 0.20563,
        I: 7.005,
        L0: 252.25,
        w0: 77.46,
        node0: 48.33,
        dL: 4.09233445,
      },
      venus: {
        a: 0.723332,
        e: 0.00677,
        I: 3.3946,
        L0: 181.98,
        w0: 131.53,
        node0: 76.68,
        dL: 1.60213034,
      },
      earth: {
        a: 1.0,
        e: 0.01671,
        I: 0.0,
        L0: 100.464,
        w0: 102.94,
        node0: 0.0,
        dL: 0.98564736,
      },
      mars: {
        a: 1.52368,
        e: 0.09341,
        I: 1.8497,
        L0: 355.45,
        w0: 336.04,
        node0: 49.56,
        dL: 0.52402078,
      },
      ceres: {
        a: 2.767,
        e: 0.076,
        I: 10.59,
        L0: 153.2,
        w0: 73.1,
        node0: 80.3,
        dL: 0.214,
      },
      jupiter: {
        a: 5.2026,
        e: 0.04849,
        I: 1.303,
        L0: 34.4,
        w0: 14.75,
        node0: 100.56,
        dL: 0.0830853,
      },
      saturn: {
        a: 9.5549,
        e: 0.05555,
        I: 2.4886,
        L0: 49.94,
        w0: 92.43,
        node0: 113.72,
        dL: 0.0334442,
      },
      uranus: {
        a: 19.2184,
        e: 0.04638,
        I: 0.773,
        L0: 313.23,
        w0: 170.96,
        node0: 74.23,
        dL: 0.0117258,
      },
      neptune: {
        a: 30.1104,
        e: 0.00946,
        I: 1.77,
        L0: 304.88,
        w0: 44.97,
        node0: 131.72,
        dL: 0.0059951,
      },
      pluto: {
        a: 39.48,
        e: 0.2488,
        I: 17.16,
        L0: 238.9,
        w0: 224.07,
        node0: 110.3,
        dL: 0.00396,
      },
      haumea: {
        a: 43.13,
        e: 0.191,
        I: 28.19,
        L0: 210.0,
        w0: 240.2,
        node0: 121.9,
        dL: 0.00348,
      },
      makemake: {
        a: 45.79,
        e: 0.159,
        I: 29.0,
        L0: 170.0,
        w0: 295.0,
        node0: 79.4,
        dL: 0.00318,
      },
      eris: {
        a: 67.78,
        e: 0.441,
        I: 44.04,
        L0: 35.0,
        w0: 151.6,
        node0: 35.9,
        dL: 0.00177,
      },
    };

    const results = {};

    for (const [key, p] of Object.entries(data)) {
      // Mean longitude L (degrees)
      let L = (p.L0 + p.dL * d) % 360;
      if (L < 0) L += 360;

      // Mean anomaly M = L - w
      let M = (L - p.w0) % 360;
      if (M < 0) M += 360;
      const M_rad = (M * Math.PI) / 180;

      // Solve Kepler's equation M = E - e*sin(E) by iteration
      let E = M_rad;
      for (let iter = 0; iter < 5; iter++) {
        E = E - (E - p.e * Math.sin(E) - M_rad) / (1 - p.e * Math.cos(E));
      }

      // True anomaly nu
      const x_prime = p.a * (Math.cos(E) - p.e);
      const y_prime = p.a * Math.sqrt(1 - p.e * p.e) * Math.sin(E);
      const r = Math.sqrt(x_prime * x_prime + y_prime * y_prime);
      const nu = Math.atan2(y_prime, x_prime);

      // True heliocentric longitude lambda
      const lambda = nu + (p.w0 * Math.PI) / 180;

      results[key] = {
        distanceAU: r,
        heliocentricLongitudeRad: lambda,
        heliocentricLongitudeDeg: ((lambda * 180) / Math.PI) % 360,
        xAU: r * Math.cos(lambda),
        zAU: r * Math.sin(lambda),
      };
    }

    return results;
  }

  // Format date exactly like the reference UI: e.g. "2026 15 NOV  07:36 AM"
  formatDisplayDate(date = this.currentDate) {
    const year = date.getFullYear();
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[date.getMonth()];

    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12
    const strHours = String(hours).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year} ${day} ${month}  ${strHours}:${minutes} ${ampm}`;
  }

  update(deltaSeconds) {
    if (!this.isPlaying) return;
    // Advance date smoothly (real-time or scaled)
    const msToAdd = deltaSeconds * 1000 * this.timeScale;
    this.currentDate = new Date(this.currentDate.getTime() + msToAdd);
  }
}

export const ephemeris = new EphemerisService();

