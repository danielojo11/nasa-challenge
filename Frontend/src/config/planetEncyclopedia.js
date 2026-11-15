// Comprehensive, NASA-Verified Planetary Encyclopedia
// Complete scientific dossier for all 8 major planets, Moon, Sun, 5 Dwarf Planets, and Black Hole

export const PLANET_ENCYCLOPEDIA = {
  sun: {
    name: "The Sun",
    designation: "Sol / Star",
    classification: "G-Type Main-Sequence Star (Yellow Dwarf)",
    symbol: "☉",
    tagline: "The thermonuclear heart of our solar system, containing 99.86% of all system mass.",
    stats: {
      distance: "Center of Solar System (1 AU from Earth)",
      orbitPeriod: "230 Million Years (Galactic Orbit)",
      orbitSpeed: "220 km/s (Galactic Orbit)",
      rotation: "25 days (Equator) to 35 days (Poles)",
      gravity: "274 m/s² (28.0 g)",
      temperature: "5,500°C (Surface) • 15,000,000°C (Core)",
      diameter: "1,392,700 km (109× Earth)",
      mass: "1.989 × 10³⁰ kg (333,000× Earth)",
      moons: "8 Planets, 5+ Dwarf Planets, Millions of Asteroids",
      axialTilt: "7.25°"
    },
    atmosphere: {
      pressure: "Crushing solar plasma (core pressure: 250 billion atm)",
      gases: [
        { name: "Hydrogen (H)", pct: "73.46%" },
        { name: "Helium (He)", pct: "24.85%" },
        { name: "Oxygen (O)", pct: "0.77%" },
        { name: "Carbon (C)", pct: "0.29%" },
        { name: "Iron & Neon", pct: "0.63%" }
      ],
      weather: "Solar flares, Coronal Mass Ejections (CMEs), high-speed solar winds, and magnetic sunspot cycles every 11 years."
    },
    geology: {
      terrain: "No solid surface. Plasma convective zone, radiative zone, and thermonuclear fusion core.",
      landmarks: "Photosphere, Chromosphere, Solar Corona, Coronal Holes, Solar Prominences."
    },
    exploration: [
      { mission: "Parker Solar Probe", agency: "NASA", year: "2018–Active", note: "Flew directly through the Sun's outer corona at 692,000 km/h." },
      { mission: "SOHO", agency: "NASA / ESA", year: "1995–Active", note: "Continuous real-time solar storm and CME observatory." },
      { mission: "Solar Dynamics Observatory", agency: "NASA", year: "2010–Active", note: "Captures 4K ultra-high-definition solar flare imagery." }
    ],
    juniorAstronaut: {
      fact: "Every single second, the Sun fuses 600 million tons of hydrogen into helium, converting 4 million tons of matter into pure radiant energy!",
      hazard: "Unshielded cadets face lethal solar energetic particles (SEPs) and extreme UV/X-ray radiation without thick hydrogen water bulkheads."
    }
  },

  mercury: {
    name: "Mercury",
    designation: "1st Planet from Sun",
    classification: "Terrestrial Planet (Innermost)",
    symbol: "☿",
    tagline: "A cratered metallic world with the most extreme temperature swings in the solar system.",
    stats: {
      distance: "57.9 Million km (0.387 AU)",
      orbitPeriod: "87.97 Earth Days (0.24 Earth Years)",
      orbitSpeed: "47.4 km/s (170,500 km/h)",
      rotation: "58.65 Earth Days (3:2 Spin-Orbit Resonance)",
      gravity: "3.70 m/s² (0.38 g)",
      temperature: "-180°C (Night) to +430°C (Day)",
      diameter: "4,879 km (0.38× Earth)",
      mass: "3.301 × 10²³ kg (0.055× Earth)",
      moons: "0 Natural Satellites",
      axialTilt: "0.034° (Zero seasonal variation)"
    },
    atmosphere: {
      pressure: "< 10⁻¹⁴ bar (Ultra-tenuous exosphere)",
      gases: [
        { name: "Oxygen (O₂)", pct: "42.0%" },
        { name: "Sodium (Na)", pct: "29.0%" },
        { name: "Hydrogen (H₂)", pct: "22.0%" },
        { name: "Helium (He)", pct: "6.0%" },
        { name: "Potassium (K)", pct: "0.5%" }
      ],
      weather: "Virtual vacuum with no weather or clouds; bombarded continuously by solar wind protons and micrometeoroids."
    },
    geology: {
      terrain: "Silicate rock mantle overlying an oversized liquid iron core that occupies 85% of planet radius. Wrinkle ridges (lobate scarps) formed as the planet cooled and shrank.",
      landmarks: "Caloris Basin (1,550 km impact basin), Discovery Scarp (2 km high ridge), Hollows (mysterious rim depressions)."
    },
    exploration: [
      { mission: "Mariner 10", agency: "NASA", year: "1974–1975", note: "First flyby mission; mapped 45% of Mercury's cratered surface." },
      { mission: "MESSENGER", agency: "NASA", year: "2011–2015", note: "First orbital probe; discovered water ice in permanently shadowed polar craters." },
      { mission: "BepiColombo", agency: "ESA / JAXA", year: "2018–Active", note: "Dual orbital probes conducting flybys before 2026 orbital insertion." }
    ],
    juniorAstronaut: {
      fact: "Despite daytime temperatures hot enough to melt lead (430°C), water ice sits permanently frozen in deep, shadowed craters at Mercury's poles!",
      hazard: "A solar day on Mercury lasts 176 Earth days—two full Mercury years! Spacesuits must withstand a 600°C thermal shock across the day-night terminator."
    }
  },

  venus: {
    name: "Venus",
    designation: "2nd Planet from Sun",
    classification: "Terrestrial Planet (Earth's Toxic Twin)",
    symbol: "♀",
    tagline: "A runaway greenhouse inferno shrouded in crushing carbon dioxide and sulfuric acid clouds.",
    stats: {
      distance: "108.2 Million km (0.723 AU)",
      orbitPeriod: "224.7 Earth Days (0.62 Earth Years)",
      orbitSpeed: "35.0 km/s (126,000 km/h)",
      rotation: "243.0 Earth Days (Retrograde — spins backwards!)",
      gravity: "8.87 m/s² (0.91 g)",
      temperature: "465°C / 869°F (Hottest planet in Solar System)",
      diameter: "12,104 km (0.95× Earth)",
      mass: "4.867 × 10²⁴ kg (0.815× Earth)",
      moons: "0 Natural Satellites",
      axialTilt: "177.36° (Completely upside down)"
    },
    atmosphere: {
      pressure: "92 bar (Equivalent to 900 meters underwater on Earth)",
      gases: [
        { name: "Carbon Dioxide (CO₂)", pct: "96.5%" },
        { name: "Nitrogen (N₂)", pct: "3.5%" },
        { name: "Sulfur Dioxide (SO₂)", pct: "0.015%" },
        { name: "Water Vapor (H₂O)", pct: "0.002%" },
        { name: "Sulfuric Acid", pct: "Trace Clouds" }
      ],
      weather: "Super-rotating cloud decks racing at 360 km/h; corrosive sulfuric acid rain that evaporates before reaching the scorching ground (virga)."
    },
    geology: {
      terrain: "Volcanic basalt plains covering 80% of surface; thousands of active and dormant shield volcanoes and extensive lava channels.",
      landmarks: "Maxwell Montes (11 km high mountain), Maat Mons (volcano), Aphrodite Terra, Ishtar Terra."
    },
    exploration: [
      { mission: "Venera 7", agency: "Soviet Union", year: "1970", note: "First human spacecraft to land on another planet and return surface telemetry." },
      { mission: "Magellan", agency: "NASA", year: "1990–1994", note: "Radar-mapped 98% of the surface through dense clouds with 100m resolution." },
      { mission: "DAVINCI & VERITAS", agency: "NASA", year: "Planned 2029+", note: "Next-gen atmospheric probe and high-resolution radar orbiter." }
    ],
    juniorAstronaut: {
      fact: "On Venus, the Sun rises in the West and sets in the East! Furthermore, a single day on Venus (243 Earth days) is longer than its entire year (225 Earth days)!",
      hazard: "Surface atmospheric pressure is so intense that spacecraft hull metal crumples like an aluminum soda can within minutes of landing."
    }
  },

  earth: {
    name: "Earth",
    designation: "3rd Planet from Sun",
    classification: "Terrestrial Planet (Our Cosmic Home)",
    symbol: "♁",
    tagline: "The only known oasis in the universe harboring liquid surface water, plate tectonics, and thriving life.",
    stats: {
      distance: "149.6 Million km (1.000 AU)",
      orbitPeriod: "365.25 Earth Days (1.00 Year)",
      orbitSpeed: "29.78 km/s (107,200 km/h)",
      rotation: "23 Hours 56 Minutes 4 Seconds",
      gravity: "9.807 m/s² (1.00 g)",
      temperature: "-89.2°C (Antarctica) to +56.7°C (Death Valley) • Mean: 15°C",
      diameter: "12,742 km (Mean)",
      mass: "5.972 × 10²⁴ kg (1.00 Earth Mass)",
      moons: "1 (The Moon / Luna)",
      axialTilt: "23.44° (Drives our 4 distinct seasons)"
    },
    atmosphere: {
      pressure: "1.013 bar (1.00 atm at sea level)",
      gases: [
        { name: "Nitrogen (N₂)", pct: "78.08%" },
        { name: "Oxygen (O₂)", pct: "20.95%" },
        { name: "Argon (Ar)", pct: "0.93%" },
        { name: "Carbon Dioxide (CO₂)", pct: "0.042%" },
        { name: "Water Vapor (H₂O)", pct: "0.4% Avg" }
      ],
      weather: "Dynamic hydrologic cycle with rain, snow, hurricanes, jet streams, lightning storms, and polar auroras."
    },
    geology: {
      terrain: "71% covered by liquid saline oceans; dynamic continental and oceanic tectonic plates constantly recycling crust into the mantle.",
      landmarks: "Mount Everest (8,848 m), Mariana Trench (11,034 m deep), Mid-Atlantic Ridge, Grand Canyon."
    },
    exploration: [
      { mission: "International Space Station", agency: "NASA / ESA / JAXA / CSA", year: "1998–Active", note: "Continuous human presence orbiting 400 km above Earth for over 25 years." },
      { mission: "Landsat & Sentinel", agency: "NASA / USGS / ESA", year: "1972–Active", note: "Decades of multispectral climate and environmental remote sensing." },
      { mission: "Artemis Program", agency: "NASA & Partners", year: "2022–Active", note: "Launching heavy Orion spacecraft from Kennedy Spaceport Pad 39B to deep space." }
    ],
    juniorAstronaut: {
      fact: "Earth's molten iron outer core acts like a gigantic electromagnet, creating a powerful magnetosphere that deflects lethal solar wind into dazzling auroras!",
      hazard: "Earth's deep gravity well requires rockets to accelerate to 11.2 km/s (40,320 km/h) escape velocity to break free into interplanetary space."
    }
  },

  moon: {
    name: "The Moon (Luna)",
    designation: "Earth's Natural Satellite",
    classification: "Natural Satellite (Planetary Mass Moon)",
    symbol: "☾",
    tagline: "Earth's celestial companion, holding the pristine geological archive of the early solar system.",
    stats: {
      distance: "384,400 km from Earth (0.00257 AU)",
      orbitPeriod: "27.32 Earth Days (Synchronous Rotation)",
      orbitSpeed: "1.022 km/s (3,680 km/h around Earth)",
      rotation: "27.32 Earth Days (Tidally Locked to Earth)",
      gravity: "1.62 m/s² (0.166 g — 1/6th Earth gravity)",
      temperature: "-130°C (Night) to +120°C (Direct Sunlight)",
      diameter: "3,474 km (0.27× Earth)",
      mass: "7.342 × 10²² kg (0.0123× Earth)",
      moons: "0 Satellites",
      axialTilt: "1.54° (Permanent shadow in polar crater floors)"
    },
    atmosphere: {
      pressure: "< 3 × 10⁻¹⁵ bar (Near-perfect vacuum)",
      gases: [
        { name: "Helium (He)", pct: "29.0%" },
        { name: "Neon (Ne)", pct: "29.0%" },
        { name: "Hydrogen (H₂)", pct: "22.0%" },
        { name: "Argon (Ar)", pct: "20.0%" }
      ],
      weather: "Complete vacuum with zero weather; exposed directly to cosmic rays, solar protons, and micrometeoroids."
    },
    geology: {
      terrain: "Dark basaltic lava plains (Maria) and ancient cratered anorthosite highlands covered in razor-sharp regolith glass dust.",
      landmarks: "Shackleton Crater (South Pole, water ice), Tycho Crater, Sea of Tranquility (Apollo 11 landing site), Oceanus Procellarum."
    },
    exploration: [
      { mission: "Apollo 11", agency: "NASA", year: "1969", note: "Neil Armstrong & Buzz Aldrin become the first humans to walk on the lunar surface." },
      { mission: "Lunar Reconnaissance Orbiter (LRO)", agency: "NASA", year: "2009–Active", note: "Sub-meter topographic mapping of craters and landing sites." },
      { mission: "Artemis III", agency: "NASA", year: "Planned 2026+", note: "Landing astronauts, including the first woman and person of color, at the lunar South Pole." }
    ],
    juniorAstronaut: {
      fact: "With gravity only 1/6th of Earth's, a 60 kg cadet feels like just 10 kg on the Moon, enabling leaps over 2 meters high!",
      hazard: "Lunar dust (regolith) consists of microscopic jagged glass shards with electrostatic charge, which scratch visor optics and damage suit seals."
    }
  },

  mars: {
    name: "Mars",
    designation: "4th Planet from Sun",
    classification: "Terrestrial Planet (The Red Planet)",
    symbol: "♂",
    tagline: "The premier frontier for human interplanetary settlement, bearing ancient riverbeds and monster volcanoes.",
    stats: {
      distance: "227.9 Million km (1.524 AU)",
      orbitPeriod: "686.98 Earth Days (1.88 Earth Years)",
      orbitSpeed: "24.07 km/s (86,677 km/h)",
      rotation: "24 Hours 37 Minutes (1 Martian Sol)",
      gravity: "3.72 m/s² (0.38 g — 38% of Earth)",
      temperature: "-140°C (Winter Poles) to +20°C (Equator Summer) • Mean: -63°C",
      diameter: "6,779 km (0.53× Earth)",
      mass: "6.417 × 10²³ kg (0.107× Earth)",
      moons: "2 (Phobos & Deimos — captured asteroids)",
      axialTilt: "25.19° (Similar seasons to Earth!)"
    },
    atmosphere: {
      pressure: "0.006 bar (0.6% of Earth sea-level pressure)",
      gases: [
        { name: "Carbon Dioxide (CO₂)", pct: "95.32%" },
        { name: "Nitrogen (N₂)", pct: "2.60%" },
        { name: "Argon (Ar)", pct: "1.90%" },
        { name: "Oxygen (O₂)", pct: "0.13%" },
        { name: "Carbon Monoxide (CO)", pct: "0.08%" }
      ],
      weather: "Global dust storms obscuring 90% of sunlight, water-ice cirrus clouds, dry-ice snowstorms at the poles, and dust devils."
    },
    geology: {
      terrain: "Rusted iron oxide dust surface, massive shield volcanoes, tectonic rift valleys, and dried river delta sediments.",
      landmarks: "Olympus Mons (22 km high, 3× Everest), Valles Marineris (4,000 km long canyon), Jezero Crater (ancient paleolake), Gale Crater."
    },
    exploration: [
      { mission: "Perseverance & MOXIE", agency: "NASA", year: "2021–Active", note: "Rover drilling biosignatures in Jezero Crater; extracted 122g of pure O₂ from Martian CO₂." },
      { mission: "Curiosity Rover", agency: "NASA", year: "2012–Active", note: "Nuclear-powered science lab analyzing ancient habitable mudstones in Gale Crater." },
      { mission: "Ingenuity Helicopter", agency: "NASA", year: "2021–2024", note: "Completed 72 powered flights in Mars's ultra-thin atmosphere, logging over 128 flight minutes." }
    ],
    juniorAstronaut: {
      fact: "Olympus Mons on Mars is the largest volcano in the entire solar system—so broad that its summit rises completely out of the dense lower atmosphere!",
      hazard: "Mars lacks a global dipolar magnetic field, exposing surface explorers to galactic cosmic rays and solar flares requiring water-shielded habitats."
    }
  },

  ceres: {
    name: "Ceres",
    designation: "Largest Asteroid Belt Body",
    classification: "Dwarf Planet (Asteroid Belt)",
    symbol: "⚳",
    tagline: "An icy, differentiated ocean world hiding between Mars and Jupiter with salt-volcanoes.",
    stats: {
      distance: "414.0 Million km (2.767 AU)",
      orbitPeriod: "4.60 Earth Years (1,682 Days)",
      orbitSpeed: "17.9 km/s (64,440 km/h)",
      rotation: "9.07 Hours",
      gravity: "0.28 m/s² (0.029 g — under 3% of Earth)",
      temperature: "-105°C (Mean)",
      diameter: "939 km (Contains 1/3 of total Asteroid Belt mass)",
      mass: "9.38 × 10²⁰ kg (0.00015× Earth)",
      moons: "0 Satellites",
      axialTilt: "4.0°"
    },
    atmosphere: {
      pressure: "Transient water-vapor exosphere sublimating under sunlight",
      gases: [
        { name: "Water Vapor (H₂O)", pct: "90%+" },
        { name: "Hydroxide (OH)", pct: "Trace" }
      ],
      weather: "Transient sublimation hazes in sunlit craters with zero active wind or cloud systems."
    },
    geology: {
      terrain: "Cratered rock-and-ice surface with an icy mantle; cryomagma chambers erupting salty brines onto the frigid surface.",
      landmarks: "Occator Crater & Cerealia Facula (blinding white sodium carbonate salt deposits), Ahuna Mons (4 km high ice-volcano)."
    },
    exploration: [
      { mission: "Dawn", agency: "NASA", year: "2015–2018", note: "Ion-propulsion probe that orbited Ceres, mapping hydrated minerals, organic molecules, and salt domes." }
    ],
    juniorAstronaut: {
      fact: "Ceres holds more subterranean water ice in its mantle than all the rivers, lakes, and freshwater reservoirs on Earth combined!",
      hazard: "With gravity under 0.03 g, an astronaut running too quickly could accidentally achieve escape velocity (510 m/s) and float away into the Asteroid Belt!"
    }
  },

  jupiter: {
    name: "Jupiter",
    designation: "5th Planet from Sun",
    classification: "Gas Giant (King of the Planets)",
    symbol: "♃",
    tagline: "A colossal swirling world of hydrogen and helium with a storm bigger than planet Earth.",
    stats: {
      distance: "778.5 Million km (5.204 AU)",
      orbitPeriod: "11.86 Earth Years (4,333 Days)",
      orbitSpeed: "13.07 km/s (47,052 km/h)",
      rotation: "9 Hours 55 Minutes (Fastest rotation in Solar System)",
      gravity: "24.79 m/s² (2.53 g at cloud deck)",
      temperature: "-110°C (Cloud tops) • 24,000°C (Dense Core)",
      diameter: "139,820 km (11.0× Earth • 1,300 Earths fit inside)",
      mass: "1.898 × 10²⁷ kg (318× Earth • 2.5× all other planets combined)",
      moons: "95 Confirmed Moons (Io, Europa, Ganymede, Callisto)",
      axialTilt: "3.13°"
    },
    atmosphere: {
      pressure: "> 1,000 bar in deep atmosphere (No solid surface)",
      gases: [
        { name: "Hydrogen (H₂)", pct: "89.8%" },
        { name: "Helium (He)", pct: "10.2%" },
        { name: "Methane (CH₄)", pct: "0.3%" },
        { name: "Ammonia (NH₃)", pct: "0.026%" },
        { name: "Water Vapor", pct: "0.0004%" }
      ],
      weather: "Zonal jet streams reaching 540 km/h; lightning bolts 1,000× more powerful than Earth's; the Great Red Spot anticyclone raging for 350+ years."
    },
    geology: {
      terrain: "No solid surface. Gas atmosphere transitions gradually into a vast ocean of liquid metallic hydrogen over a dense rocky/icy core.",
      landmarks: "Great Red Spot (16,000 km wide storm), North Polar Cyclones, Equatorial Jet Stream, Faint Ring System."
    },
    exploration: [
      { mission: "Galileo", agency: "NASA", year: "1995–2003", note: "First orbiter; dropped an atmospheric probe 150 km into the crushing cloud decks." },
      { mission: "Juno", agency: "NASA", year: "2016–Active", note: "Polar orbiter peering through cloud decks to measure core mass and magnetic field." },
      { mission: "JUICE & Europa Clipper", agency: "ESA / NASA", year: "2023–2030+", note: "Flagship missions exploring the habitable subterranean oceans of Europa & Ganymede." }
    ],
    juniorAstronaut: {
      fact: "Under Jupiter's crushing pressures, hydrogen behaves like liquid metal, conducting electricity and generating a magnetic field 20,000 times stronger than Earth's!",
      hazard: "Jupiter's trapped radiation belts deliver thousands of Sieverts per day—enough to fry unshielded electronics and humans within minutes."
    }
  },

  saturn: {
    name: "Saturn",
    designation: "6th Planet from Sun",
    classification: "Gas Giant (The Ringed Jewel)",
    symbol: "♄",
    tagline: "The crown jewel of our solar system, famous for its dazzling ice rings and density lighter than water.",
    stats: {
      distance: "1.433 Billion km (9.582 AU)",
      orbitPeriod: "29.46 Earth Years (10,759 Days)",
      orbitSpeed: "9.69 km/s (34,884 km/h)",
      rotation: "10 Hours 33 Minutes",
      gravity: "10.44 m/s² (1.07 g)",
      temperature: "-140°C (Cloud deck)",
      diameter: "116,460 km (9.14× Earth)",
      mass: "5.683 × 10²⁶ kg (95.2× Earth)",
      moons: "146 Confirmed Moons (Titan, Enceladus, Mimas, Iapetus)",
      axialTilt: "26.73° (Produces seasons similar to Earth)"
    },
    atmosphere: {
      pressure: "Deep supercritical fluid (No solid crust)",
      gases: [
        { name: "Hydrogen (H₂)", pct: "96.3%" },
        { name: "Helium (He)", pct: "3.25%" },
        { name: "Methane (CH₄)", pct: "0.45%" },
        { name: "Ammonia (NH₃)", pct: "0.0125%" },
        { name: "Hydrogen Deuteride", pct: "0.011%" }
      ],
      weather: "Equatorial jet streams hitting 1,800 km/h; a bizarre, perfectly geometric 30,000-km-wide Hexagon storm swirling at the North Pole."
    },
    geology: {
      terrain: "Gaseous hydrogen-helium mantle transitioning to liquid metallic hydrogen over a rocky core. Ring system composed of 99% pure water ice particles.",
      landmarks: "Ring System (Main Rings A, B, C spanning 282,000 km, ~10m thick), Cassini Division, North Polar Hexagon."
    },
    exploration: [
      { mission: "Voyager 1 & 2", agency: "NASA", year: "1980–1981", note: "Discovered intricate ring spokes, shepherd moons, and Titan's dense atmosphere." },
      { mission: "Cassini-Huygens", agency: "NASA / ESA", year: "2004–2017", note: "13-year orbital mission; landed Huygens probe on Titan and discovered Enceladus water geysers." }
    ],
    juniorAstronaut: {
      fact: "Saturn is the only planet in the entire solar system that is less dense than liquid water (0.687 g/cm³)—if you had a big enough bathtub, Saturn would float!",
      hazard: "Saturn's rings are raining thousands of kilograms of water ice into its upper atmosphere every second—a phenomenon called 'ring rain' that will drain them in 100M years."
    }
  },

  uranus: {
    name: "Uranus",
    designation: "7th Planet from Sun",
    classification: "Ice Giant (The Sideways Planet)",
    symbol: "♅",
    tagline: "A cyan ice giant rolling on its side through space with the coldest planetary atmosphere recorded.",
    stats: {
      distance: "2.871 Billion km (19.22 AU)",
      orbitPeriod: "84.02 Earth Years (30,687 Days)",
      orbitSpeed: "6.80 km/s (24,480 km/h)",
      rotation: "17 Hours 14 Minutes (Retrograde)",
      gravity: "8.69 m/s² (0.89 g — 89% of Earth)",
      temperature: "-224°C / -371°F (Coldest planetary atmosphere)",
      diameter: "50,724 km (3.98× Earth)",
      mass: "8.681 × 10²⁵ kg (14.5× Earth)",
      moons: "28 Known Moons (Miranda, Ariel, Umbriel, Titania, Oberon)",
      axialTilt: "97.77° (Orbits virtually on its side!)"
    },
    atmosphere: {
      pressure: "Deep supercritical ice fluid mantle (No solid crust)",
      gases: [
        { name: "Hydrogen (H₂)", pct: "82.5%" },
        { name: "Helium (He)", pct: "15.2%" },
        { name: "Methane (CH₄)", pct: "2.30%" },
        { name: "Hydrogen Deuteride", pct: "Trace" }
      ],
      weather: "Methane gas absorbs red light and reflects cool cyan/aquamarine wavelengths; high-altitude ammonia and hydrogen sulfide ice hazes."
    },
    geology: {
      terrain: "Fluid mantle of hot, dense supercritical 'slush' of water, ammonia, and methane ices surrounding a small rocky silicate-iron core.",
      landmarks: "13 Narrow Dark Rings, Miranda's Verona Rupes (20 km sheer cliff — tallest cliff in solar system)."
    },
    exploration: [
      { mission: "Voyager 2", agency: "NASA", year: "January 1986", note: "The only spacecraft in human history to fly past Uranus, discovering 10 new moons and 2 new rings." }
    ],
    juniorAstronaut: {
      fact: "Because Uranus rolls on its side with a 98° tilt, each pole gets 42 continuous years of uninterrupted summer sunlight, followed by 42 years of freezing polar night!",
      hazard: "Deep inside Uranus's icy mantle, extreme pressures of millions of atmospheres split methane molecules into pure carbon, creating literal 'diamond rain' falling toward the core."
    }
  },

  neptune: {
    name: "Neptune",
    designation: "8th Planet from Sun",
    classification: "Ice Giant (The Supersonic Outpost)",
    symbol: "♆",
    tagline: "A vivid cobalt-blue world swept by supersonic winds faster than the speed of sound.",
    stats: {
      distance: "4.498 Billion km (30.07 AU)",
      orbitPeriod: "164.79 Earth Years (60,190 Days)",
      orbitSpeed: "5.43 km/s (19,550 km/h)",
      rotation: "16 Hours 6 Minutes",
      gravity: "11.15 m/s² (1.14 g)",
      temperature: "-214°C (Cloud deck)",
      diameter: "49,244 km (3.86× Earth)",
      mass: "1.024 × 10²⁶ kg (17.1× Earth — denser than Uranus)",
      moons: "16 Known Moons (Triton, Proteus, Nereid)",
      axialTilt: "28.32° (Similar to Earth and Mars)"
    },
    atmosphere: {
      pressure: "Crushing supercritical ice-fluid ocean",
      gases: [
        { name: "Hydrogen (H₂)", pct: "80.0%" },
        { name: "Helium (He)", pct: "19.0%" },
        { name: "Methane (CH₄)", pct: "1.50%" },
        { name: "Ethane & Acetylene", pct: "Trace" }
      ],
      weather: "The most violent winds in the solar system, clocking up to 2,160 km/h (1,340 mph); transient anticyclonic Great Dark Spots; bright methane cirrus clouds."
    },
    geology: {
      terrain: "Hot, dense supercritical water-ammonia-methane mantle over a molten rocky core. Radiates 2.6× more internal heat than it receives from the distant Sun.",
      landmarks: "Great Dark Spot, Scooter (rapidly moving white cloud), 5 Faint Ring Arcs (Galle, Le Verrier, Lassell, Arago, Adams)."
    },
    exploration: [
      { mission: "Voyager 2", agency: "NASA", year: "August 1989", note: "Historic flyby exploring Triton's nitrogen geysers, active ring arcs, and the Great Dark Spot." }
    ],
    juniorAstronaut: {
      fact: "Neptune completed its very first full 165-year orbit since its discovery (in 1846) in 2011! It was the first planet discovered using mathematical prediction before being seen in a telescope.",
      hazard: "Winds on Neptune are supersonic—traveling faster than a fighter jet, capable of tearing any conventional parachute or probe to pieces upon atmospheric entry."
    }
  },

  pluto: {
    name: "Pluto",
    designation: "Kuiper Belt Dwarf Planet",
    classification: "Dwarf Planet / Plutoid",
    symbol: "♇",
    tagline: "The heart of the Kuiper Belt, sporting nitrogen glaciers, towering water-ice peaks, and ice volcanoes.",
    stats: {
      distance: "5.906 Billion km (39.48 AU Avg • 29.7 to 49.3 AU)",
      orbitPeriod: "247.9 Earth Years (90,560 Days)",
      orbitSpeed: "4.67 km/s (16,812 km/h)",
      rotation: "6.39 Earth Days (153.3 Hours • Retrograde)",
      gravity: "0.62 m/s² (0.063 g — 1/16th of Earth)",
      temperature: "-230°C / -382°F",
      diameter: "2,376 km (0.18× Earth • smaller than Moon)",
      mass: "1.303 × 10²² kg (0.0022× Earth)",
      moons: "5 (Charon, Styx, Nix, Kerberos, Hydra)",
      axialTilt: "122.53° (Tilted on its side)"
    },
    atmosphere: {
      pressure: "~1.0 Pa (10 microbars • seasonal atmosphere)",
      gases: [
        { name: "Nitrogen (N₂)", pct: "99.0%" },
        { name: "Methane (CH₄)", pct: "0.50%" },
        { name: "Carbon Monoxide (CO)", pct: "0.50%" }
      ],
      weather: "Seasonal blue hydrocarbon hazes; when Pluto moves further from the Sun in its elliptical orbit, its atmosphere freezes and snows down onto the surface!"
    },
    geology: {
      terrain: "30% water-ice crust and mountains with a 70% dense silicate core. Sputnik Planitia is a vast, 1,000-km-wide convection basin of slowly churning nitrogen ice.",
      landmarks: "Tombaugh Regio ('The Heart of Pluto'), Sputnik Planitia, Hillary Montes (3.5 km high water-ice mountains), Wright Mons (cryovolcano)."
    },
    exploration: [
      { mission: "New Horizons", agency: "NASA", year: "July 2015", note: "Historic 50,000 km/h flyby returning high-resolution imagery of glaciers, blue atmospheric hazes, and Charon." }
    ],
    juniorAstronaut: {
      fact: "Pluto and its moon Charon are mutually tidally locked: they permanently face each other like two dancers spinning in space, orbiting a mutual center of gravity outside Pluto!",
      hazard: "Cryogenic temperatures of -230°C make water ice behave like solid granite bedrock, while exotic nitrogen ice flows like glaciers."
    }
  },

  haumea: {
    name: "Haumea",
    designation: "Kuiper Belt Dwarf Planet",
    classification: "Dwarf Planet / Plutoid",
    symbol: "🝦",
    tagline: "A rapidly spinning rugby-ball-shaped dwarf planet surrounded by a crystalline ring and two moons.",
    stats: {
      distance: "6.452 Billion km (43.13 AU)",
      orbitPeriod: "284.1 Earth Years",
      orbitSpeed: "4.53 km/s (16,300 km/h)",
      rotation: "3.91 Hours (Fastest spin of any large body in Solar System!)",
      gravity: "0.44 m/s² (0.045 g)",
      temperature: "-241°C / -402°F",
      diameter: "2,100 × 1,680 × 1,074 km (Triaxial Ellipsoid)",
      mass: "4.006 × 10²¹ kg (0.00067× Earth)",
      moons: "2 (Hiʻiaka and Namaka)",
      axialTilt: "28.19°"
    },
    atmosphere: {
      pressure: "Negligible vacuum",
      gases: [
        { name: "Trace Water Sublimation", pct: "100%" }
      ],
      weather: "Permanent deep cryogenic vacuum exposed to cosmic radiation."
    },
    geology: {
      terrain: "Dense rocky core coated in a thin shell of crystalline pure water ice; dark red organic-rich mineral spot on one hemisphere.",
      landmarks: "Ring System (70 km wide ring orbiting 2,287 km from center), Dark Red Surface Spot."
    },
    exploration: [
      { mission: "Discovered", agency: "Palomar / Sierra Nevada", year: "2004–2005", note: "Ring system confirmed in 2017 during a stellar occultation—the first ring found around a Kuiper Belt dwarf planet." }
    ],
    juniorAstronaut: {
      fact: "Haumea spins so fast—completing a rotation in less than 4 hours—that centrifugal force has stretched the planet into an elongated rugby ball shape!",
      hazard: "With such high centrifugal force at its equator, surface gravity is significantly lower at the ends than at the poles, making landing trajectories erratic."
    }
  },

  makemake: {
    name: "Makemake",
    designation: "Kuiper Belt Dwarf Planet",
    classification: "Dwarf Planet / Plutoid",
    symbol: "🝴",
    tagline: "A brilliant, reddish frozen sphere of methane and ethane orbiting in the cold depths beyond Neptune.",
    stats: {
      distance: "6.850 Billion km (45.79 AU)",
      orbitPeriod: "309.9 Earth Years",
      orbitSpeed: "4.42 km/s (15,910 km/h)",
      rotation: "22.83 Hours (Similar to Earth's day!)",
      gravity: "0.50 m/s² (0.051 g)",
      temperature: "-243°C / -405°F",
      diameter: "1,430 km (0.11× Earth)",
      mass: "3.10 × 10²¹ kg (0.0005× Earth)",
      moons: "1 (MK2 — S/2015 (136472) 1)",
      axialTilt: "29.0°"
    },
    atmosphere: {
      pressure: "Tenuous seasonal methane atmosphere when closest to Sun",
      gases: [
        { name: "Methane (CH₄)", pct: "95%+" },
        { name: "Ethane (C₂H₆)", pct: "Trace" }
      ],
      weather: "Cryogenic sublimation haze with no active wind."
    },
    geology: {
      terrain: "Surface covered in coarse millimeter-sized methane ice grains mixed with complex organic tholins produced by UV cosmic rays.",
      landmarks: "Bright Methane Ice Plains, Dark Satellite Orbit Path."
    },
    exploration: [
      { mission: "Discovered", agency: "Palomar Observatory", year: "March 2005", note: "Originally nicknamed 'Easterbunny'; satellite MK2 discovered by Hubble Space Telescope in 2015." }
    ],
    juniorAstronaut: {
      fact: "Makemake reflects nearly 80% of sunlight striking it—making its surface almost as reflective as clean fresh snow on Earth!",
      hazard: "At over 45 times Earth's distance from the Sun, solar energy is over 2,000 times weaker; solar panels cannot generate sufficient electricity, requiring nuclear radioisotope power."
    }
  },

  eris: {
    name: "Eris",
    designation: "Scattered Disc Dwarf Planet",
    classification: "Dwarf Planet (The Titan of the Outskirts)",
    symbol: "⯰",
    tagline: "The heavyweight dwarf planet whose 2005 discovery fundamentally redefined what a planet is.",
    stats: {
      distance: "10.12 Billion km (67.66 AU Avg • up to 97.5 AU)",
      orbitPeriod: "559.3 Earth Years",
      orbitSpeed: "3.44 km/s (12,380 km/h)",
      rotation: "25.9 Hours",
      gravity: "0.82 m/s² (0.084 g)",
      temperature: "-243°C to -218°C",
      diameter: "2,326 km (Denser and 27% heavier than Pluto)",
      mass: "1.66 × 10²² kg (0.0028× Earth)",
      moons: "1 (Dysnomia)",
      axialTilt: "44.0°"
    },
    atmosphere: {
      pressure: "Fringed collapsed nitrogen frost (sublimates at perihelion)",
      gases: [
        { name: "Nitrogen (N₂)", pct: "95%+" },
        { name: "Methane (CH₄)", pct: "Trace" }
      ],
      weather: "Frozen nitrogen glaze coating the entire planet in ultra-bright frost."
    },
    geology: {
      terrain: "Rocky core accounting for 70% of total mass, enveloped in a bright reflective nitrogen-methane ice glaze.",
      landmarks: "Dysnomia Orbit Track, High-Albedo Nitrogen Ice Glaze."
    },
    exploration: [
      { mission: "Discovered", agency: "Palomar Observatory", year: "January 2005", note: "Mike Brown, Chad Trujillo, and David Rabinowitz discovered Eris, leading to the 2006 IAU definition of a dwarf planet." }
    ],
    juniorAstronaut: {
      fact: "The discovery of Eris sparked the famous debate that led the International Astronomical Union to create the Dwarf Planet category in 2006!",
      hazard: "A flight from Earth to Eris would take over 25 years with current chemical propulsion systems. Astronauts would require cryogenic stasis or nuclear thermal rockets."
    }
  },

  blackhole: {
    name: "Sagittarius A*",
    designation: "Supermassive Black Hole",
    classification: "Singularity / Galactic Core",
    symbol: "⚫",
    tagline: "The gravitational titan anchoring the Milky Way Galaxy, with mass exceeding 4 million suns.",
    stats: {
      distance: "26,673 Light-Years (2.5 × 10¹⁷ km from Earth)",
      orbitPeriod: "Galactic Center Anchor",
      orbitSpeed: "0 km/s (Center of Galactic Reference)",
      rotation: "Near light-speed frame-dragging spin",
      gravity: "Infinite spacetime curvature at Singularity",
      temperature: "T_Hawking: 1.4 × 10⁻¹⁴ K (Accretion disk: Millions °C)",
      diameter: "Event Horizon Radius: 12 Million km (17× Sun)",
      mass: "8.26 × 10³⁶ kg (4.15 Million Solar Masses)",
      moons: "Dozens of S-Stars orbiting up to 8% speed of light",
      axialTilt: "Aligned with Galactic Disk"
    },
    atmosphere: {
      pressure: "Relativistic plasma accretion disk (No atmosphere)",
      gases: [
        { name: "Ionized Hydrogen (H⁺)", pct: "75%" },
        { name: "Ionized Helium (He²⁺)", pct: "25%" },
        { name: "Relativistic Electrons", pct: "Synchrotron" }
      ],
      weather: "Relativistic magnetic reconnection bursts, X-ray flares, and frame-dragging spacetime eddies."
    },
    geology: {
      terrain: "No surface. Event horizon (point of no return), ergosphere, and central gravitational singularity.",
      landmarks: "Event Horizon, Photon Sphere, Relativistic Accretion Flow, S2 Star Orbit Track."
    },
    exploration: [
      { mission: "Event Horizon Telescope (EHT)", agency: "Global Array", year: "2022", note: "Captured the first direct shadow image of Sagittarius A* using global VLBI radio interferometry." },
      { mission: "Keck & VLT Star Trackers", agency: "UCLA / MPE", year: "1995–2020", note: "Tracked star S2 orbiting Sgr A* at 24 million km/h, proving Einstein's general relativity." }
    ],
    juniorAstronaut: {
      fact: "Near the event horizon of a black hole, gravitational time dilation is so extreme that one hour on a nearby spaceship would equal hundreds of years back on Earth!",
      hazard: "Passing the Roche limit causes 'Spaghettification'—tidal gravitational forces stretch objects into thin strands before they cross the event horizon."
    }
  }
};

