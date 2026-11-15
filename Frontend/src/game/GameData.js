// Mission datasets, dialects, and space science trivia grounded in NASA Open Data

export const CAMPAIGN_INFO = {
  title: "OPERATION ARES-1: JEZERO EXPEDITION",
  subtitle: "NASA Junior Astronaut Mission Trainer",
  missionStatement: "Establish and sustain humanity's first permanent research outpost in Jezero Crater, Mars.",
  campaignGoal: "Survive all 5 Martian Sols by balancing Life Support (Air), Radiation Shielding, Battery Power, and Calorie Rations, while solving real NASA flight anomalies to earn your Junior Astronaut Flight Wings.",
  winCondition: "Reach the end of Sol 5 with all 4 telemetry meters above 0%.",
  lossCondition: "Mission aborts if any telemetry meter falls to 0%."
};

export const DIALECT_PRESETS = {
  english: {
    label: "Global English",
    flag: "🌍",
    city: "Houston (NASA Johnson Space Center)",
    greeting: "Welcome Cadet! Ground telemetry link established from NASA Johnson Space Center. Ready to command Mars Base Alpha?",
  },
  pidgin: {
    label: "Naija Pidgin",
    flag: "🇳🇬",
    city: "Lagos, Nigeria",
    greeting: "Oya Cadet! Signal don lock from Lagos straight to Mars! Make we no let battery or oxygen die o, we get base to run!",
  },
  yoruba: {
    label: "Yorùbá",
    flag: "🇳🇬",
    city: "Ibadan, Nigeria",
    greeting: "Ẹ káàbọ̀ Cadet! A ti so pọ̀ láti Ibadan sí Mars! Ẹ jẹ́ ká dáàbò bo ibùdó wa ní Jezero Crater kí a sì parí iṣẹ́ wa!",
  },
  swahili: {
    label: "Kiswahili",
    flag: "🇰🇪",
    city: "Nairobi, Kenya",
    greeting: "Karibu Cadet! Mawasiliano yamefungwa kutoka Nairobi hadi Mars! Linda kituo chetu cha anga na uokoe maisha ya wafanyakazi!",
  },
  hindi: {
    label: "Hinglish / हिंदी",
    flag: "🇮🇳",
    city: "Mumbai, India",
    greeting: "Namaste Cadet! Mumbai se Mars Base ka telemetry lock ho gaya! Chalo mission shuru karte hain aur base ko safe rakhte hain!",
  },
  dutch: {
    label: "Nederlands",
    flag: "🇳🇱",
    city: "Amsterdam, Netherlands",
    greeting: "Welkom Kadet! Verbinding gemaakt vanuit Amsterdam naar Mars! Bescherm de basis en voltooi alle 5 Marsdagen!",
  },
  spanish: {
    label: "Español",
    flag: "🇪🇸",
    city: "Madrid (Deep Space Network)",
    greeting: "¡Bienvenido Cadete! Enlace activo desde la estación DSN de Madrid a Marte. ¡A proteger la base y completar la misión!",
  },
};

export const MARS_SOLS = [
  {
    sol: 1,
    eventTitle: "SOL 1: Atmospheric Ingress & Oxygen Synthesis",
    missionObjective: "Commission the MOXIE In-Situ Oxygen Extractor to supply breathable air for the habitat crew.",
    goal: "Engage Oxygen Production (AIR) and solve the MOXIE flight anomaly to maintain life support.",
    nasaSource: "NASA Perseverance MOXIE Instrument",
    dangerType: "AIR",
    localizedText: {
      english: "Cadet, Martian air is 95% CO₂ at 0.006 atm! Initiate the MOXIE solid oxide electrolysis cell immediately to generate breathable O₂.",
      pidgin: "Cadet, Mars atmosphere no get air o, na only CO₂ full ground! Start the MOXIE machine sharp-sharp make our crew get oxygen!",
      yoruba: "Cadet, afẹ́fẹ́ Mars kò ní oxygen, CO₂ nìkan ló kún ibẹ̀! Tẹ 'AIR' láti bẹ̀rẹ̀ ẹ̀rọ MOXIE kí àwọn astronauts lè mí!",
      swahili: "Cadet, anga ya Mars haina hewa safi ya kupumua! Washa mashine ya MOXIE mara moja ili kuzalisha oksijeni!",
      hindi: "Cadet, Mars ke atmosphere mein saans lene ke liye oxygen nahi hai! Turant MOXIE machine start karo aur O₂ banao!",
      dutch: "Kadet, de atmosfeer van Mars bevat 95% CO₂! Start het MOXIE-systeem onmiddellijk om zuurstof voor de bemanning te produceren!",
      spanish: "¡Cadete, la atmósfera marciana no tiene oxígeno respirable! ¡Inicia el reactor MOXIE de inmediato para generar O₂!",
    },
    quiz: {
      q: "Mars's atmosphere is over 95% Carbon Dioxide (CO₂) with less than 1% of Earth's pressure. How does NASA's MOXIE instrument on Mars produce breathable oxygen?",
      options: [
        "Solid Oxide Electrolysis splits atmospheric CO₂ molecules at 800°C into breathable O₂ and Carbon Monoxide (CO).",
        "Cryogenic chillers freeze ambient Martian air to distill liquid oxygen from trace nitrogen vapors.",
        "Chemical scrubbers absorb toxic red dust to chemically synthesize oxygen gas without electrical power."
      ],
      correct: 0,
      fact: "NASA's MOXIE proved In-Situ Resource Utilization (ISRU) on Mars by generating up to 12 grams of pure oxygen per hour directly from the ambient CO₂ atmosphere!"
    },
  },
  {
    sol: 2,
    eventTitle: "SOL 2: Coronal Mass Ejection & Radiation Shielding",
    missionObjective: "Detect high-energy solar energetic protons and pump hydrogen-rich water shielding into habitat bulkheads.",
    goal: "Activate Active Radiation Deflection (SHIELD) and protect astronauts from cellular ion damage.",
    nasaSource: "NASA GOES / DONKI Space Weather Satellite",
    dangerType: "RADIATION",
    localizedText: {
      english: "Warning: SOHO satellites detect a Coronal Mass Ejection headed towards Mars! Pressurize hydrogen-dense water bulkheads to deflect high-energy protons.",
      pidgin: "Warning! Sun don fire heavy solar flare come our side! Pump water enter base walls quick-quick make radiation no touch anybody!",
      yoruba: "Ìkìlọ̀! Ìjì Oòrùn Coronal Mass Ejection ń bọ̀ wá sí Mars! Tẹ 'SHIELD' láti fi omi hydrogen dáàbò bo àwọn odi ibùdó wa!",
      swahili: "Onyo: Dhoruba kali ya jua inakuja kwa kasi! Washa ngao ya maji ya hidrojeni kulinda kituo dhidi ya mionzi hatari!",
      hindi: "Chetawani: Sooraj se achanak tez Coronal Mass Ejection aa raha hai! Astronauts ko bachane ke liye turant 'SHIELD' activate karo!",
      dutch: "Waarschuwing: Een coronale massa-ejectie raast op Mars af! Pomp waterwanden vol om schadelijke zonneprotonen tegen te houden!",
      spanish: "¡Alerta: Una eyección de masa coronal se dirige a Marte! ¡Activa los escudos de agua para frenar la radiación de protones!",
    },
    quiz: {
      q: "When high-energy solar protons strike a Mars habitat, why are hydrogen-dense materials (like water and polyethylene) superior to heavy lead shielding?",
      options: [
        "Hydrogen nuclei have roughly equal mass to incoming protons, absorbing energy without producing hazardous secondary Bremsstrahlung radiation.",
        "Lead disintegrates upon contact with cosmic rays, creating chemical gas leaks inside the pressurized habitat.",
        "Water absorbs infrared heat faster, creating an optical mirror that reflects gamma rays away."
      ],
      correct: 0,
      fact: "Heavy elements like lead produce dangerous secondary X-ray scatter when hit by relativistic protons. Light hydrogen atoms stop protons smoothly like billiard balls of equal mass!"
    },
  },
  {
    sol: 3,
    eventTitle: "SOL 3: Global Dust Storm & Thermal Power Management",
    missionObjective: "Balance battery power and thermal life support as fine iron oxide dust blocks solar insolation.",
    goal: "Ration power reserves and engage Stirling nuclear generators to prevent base freeze-out at -75°C.",
    nasaSource: "NASA Curiosity REMS Environmental Sensor",
    dangerType: "BATTERY",
    localizedText: {
      english: "A massive regional dust storm has obscured the sun! Insolation is down 85% and surface temp is -75°C. Conserve battery and manage heaters.",
      pidgin: "Heavy red dust don cover the whole sky, sunlight no dey! Weather cold reach -75°C! Save your battery make base no shut down!",
      yoruba: "Eruku pupa ti bo oòrùn pátápátá, òtútù sì ti dín kù sí -75°C! Ṣọ́ agbára battery rẹ dáadáa kí ẹ̀rọ má baà kú!",
      swahili: "Dhoruba kubwa ya vumbi imefunika anga na kupunguza mwanga wa jua! Dhibiti matumizi ya betri ili kuweka joto kambini!",
      hindi: "Bohot bada dust storm aa gaya hai! Sunlight 85% kam ho chuki hai aur taapman -75°C hai. Battery bacha kar heaters chalao!",
      dutch: "Een gigantische stofstorm verduistert de zon! De temperatuur daalt naar -75°C. Bezuinig op batterijstroom en houd de basis warm!",
      spanish: "¡Una tormenta de polvo bloqueó el 85% de la luz solar y la temperatura cayó a -75°C! ¡Conserva la batería para mantener la calefacción!",
    },
    quiz: {
      q: "During severe Martian dust storms when solar panels are coated in dust, how do long-duration NASA surface missions guarantee uninterrupted electrical power and thermal heat?",
      options: [
        "Radioisotope Thermoelectric Generators (MMRTGs) that harness the continuous natural radioactive decay heat of Plutonium-238.",
        "Super-sized atmospheric wind turbines designed to spin rapidly in supersonic Martian breeze.",
        "Geothermal tap lines drilled into active subterranean magma chambers under Olympus Mons."
      ],
      correct: 0,
      fact: "Because Mars's atmosphere is 100 times thinner than Earth's, wind turbines generate minimal torque. NASA's Curiosity and Perseverance rely on MMRTGs that produce continuous heat and electricity for over 14 years!"
    },
  },
  {
    sol: 4,
    eventTitle: "SOL 4: X-Class Solar Flare & Space Weather Drill",
    missionObjective: "Respond to live DONKI flare telemetry and coordinate the emergency shelter retreat protocol.",
    goal: "Withstand an intense space radiation event and maintain shielding integrity above 30%.",
    nasaSource: "NASA DONKI Solar Flare Observatory",
    dangerType: "RADIATION",
    localizedText: {
      english: "Urgent Space Weather Alert: An X5.8 solar flare has erupted! Mars has no global magnetic field to protect us. Full shielding protocol engaged!",
      pidgin: "Urgent Alert: Heavy X-Class solar storm don burst! Mars no get magnetic field like Earth o! Retreat inside shelter and pump full shield!",
      yoruba: "Ìkìlọ̀ Pàjáwìrì: Ìjì Oòrùn X-Class ńlá ti bẹ́ sílẹ̀! Mars kò ní magnetic field bíi ti Ilé Ayé! Ṣe àfikún shielding kíákíá!",
      swahili: "Tahadhari ya Anga: Mlipuko mkubwa wa jua wa daraja la X umetokea! Mars haina ngao ya sumaku kama Dunia. Washa ngao zote!",
      hindi: "Emergency Alert: X-Class solar flare phoot chuki hai! Mars ke paas Earth jaisa magnetic field nahi hai. Shielding ko turant boost karo!",
      dutch: "Noodweer in de ruimte: Een zonnevlam van klasse X is uitgebarsten! Mars heeft geen magnetisch veld. Breng alle schilden op maximale capaciteit!",
      spanish: "¡Alerta espacial urgente: Se detectó una fulguración solar de clase X! Marte carece de campo magnético global. ¡Escudos al 100%!",
    },
    quiz: {
      q: "Why are surface explorers on Mars exposed to significantly higher cosmic radiation doses than astronauts on the surface of Earth?",
      options: [
        "Mars lacks a global geomagnetic dipole field and possesses an atmosphere with less than 1% of Earth's column density.",
        "Mars orbits significantly closer to the Sun's coronal loops than the Earth-Moon system.",
        "Mars's red iron surface naturally generates radioactive alpha particles through radioactive decay."
      ],
      correct: 0,
      fact: "Earth's molten iron core creates a protective magnetosphere that channels harmful solar particles into polar auroras. Mars lost its internal dynamo billions of years ago, exposing the surface to solar and galactic cosmic rays!"
    },
  },
  {
    sol: 5,
    eventTitle: "SOL 5: Hydroponics Harvest & Colony Commissioning",
    missionObjective: "Balance calorie rationing and stabilize all 4 life-support vectors to complete the mission.",
    goal: "Maintain Power, Air, Shielding, and Food above 0% to earn Junior Astronaut Flight Wings certification.",
    nasaSource: "NASA OSDR Space Biology Repository",
    dangerType: "FOOD",
    localizedText: {
      english: "Final Sol! The Jezero greenhouse has yielded its first microgreen crop! Balance Air, Food, and Power to establish the permanent Mars outpost!",
      pidgin: "Final Day! First crops don grow for our Mars greenhouse! Keep Air, Food, and Power high make you collect your Astronaut Wings!",
      yoruba: "Ọjọ́ Ìkẹyìn! Àwọn ewébẹ̀ àkọ́kọ́ ti dàgbà nínú greenhouse wa! Ṣọ́ gbogbo meters rẹ láti gba àmì-ẹ̀yẹ Junior Astronaut Wings!",
      swahili: "Siku ya Mwisho! Mboga za kwanza zimekomaa kwenye greenhouse yetu! Sawazisha hewa, chakula, na nguvu ili ushinde taji la mwanaanga!",
      hindi: "Aakhri Sol! Mars greenhouse mein pehli fasal taiyaar hai! Sabhi meters ko balance karke apne Junior Astronaut Wings haasil karo!",
      dutch: "Laatste Marsdag! De eerste oogst in de kas is geslaagd! Houd alle meters in balans om je officiële Astronauten-vleugels te verdienen!",
      spanish: "¡Sol final! ¡El invernadero de Marte dio su primera cosecha! ¡Equilibra todos los sistemas para ganar tus Alas de Astronauta Juvenil!",
    },
    quiz: {
      q: "To cultivate nutritious crops in a Martian greenhouse for long-term astronaut survival, what crucial step must be performed on raw Martian soil (regolith) before planting?",
      options: [
        "Leaching out toxic perchlorate salts (ClO₄⁻) and inoculating the inert mineral dust with beneficial soil bacteria and organic compost.",
        "Superheating the regolith to 3,000°C in an induction furnace to convert quartz crystals into fertile biological soil.",
        "Flooding the soil with liquid carbon dioxide under 100 atmospheres of pressure to neutralize soil acidity."
      ],
      correct: 0,
      fact: "Martian soil is laced with 0.5% to 1% toxic perchlorates that damage human thyroids and inhibit plant growth. NASA space biologists study bioremediation microbes and water leaching to make Martian regolith fertile!"
    },
  },
];

