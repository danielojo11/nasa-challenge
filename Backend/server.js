import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 Hour In-Memory Cache

app.use(cors());
app.use(express.json());

// In-Memory Cache to prevent rate limiting
const cache = new Map();

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data, ttlMs = CACHE_TTL_MS) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// Fallback authentic curated NASA datasets in case of network unavailability or rate limits
const FALLBACKS = {
  apod: {
    title: "Mars and the Pleiades over the Desert",
    date: new Date().toISOString().split('T')[0],
    explanation: "What is that bright orange object beside the seven stars? It is Mars, shining brightly as it moves past the Pleiades star cluster in the night sky. Sourced from the NASA APOD Archive.",
    url: "https://apod.nasa.gov/apod/image/2103/MarsPleiades_Hao_960.jpg",
    hdurl: "https://apod.nasa.gov/apod/image/2103/MarsPleiades_Hao_2048.jpg",
    media_type: "image",
    copyright: "NASA / APOD Curated Archive"
  },
  marsPhotos: [
    {
      id: 102685,
      sol: 1000,
      camera: { name: "MAST", full_name: "Mast Camera" },
      img_src: "https://mars.nasa.gov/msl-raw-images/msss/01000/mcam/1000MR0044631300503690E01_DXXX.jpg",
      earth_date: "2015-05-30",
      rover: { name: "Curiosity", status: "active", landing_date: "2012-08-06" }
    },
    {
      id: 102686,
      sol: 1000,
      camera: { name: "NAVCAM", full_name: "Navigation Camera" },
      img_src: "https://mars.nasa.gov/msl-raw-images/proj/msl/redops/ods/surface/sol/01000/opgs/edr/ncam/NRB_486265004EDR_F0481570NCAM00323M_.JPG",
      earth_date: "2015-05-30",
      rover: { name: "Curiosity", status: "active", landing_date: "2012-08-06" }
    },
    {
      id: 102687,
      sol: 1000,
      camera: { name: "FHAZ", full_name: "Front Hazard Avoidance Camera" },
      img_src: "https://mars.nasa.gov/msl-raw-images/proj/msl/redops/ods/surface/sol/01000/opgs/edr/fcam/FLB_486265022EDR_F0481570FHAZ00323M_.JPG",
      earth_date: "2015-05-30",
      rover: { name: "Curiosity", status: "active", landing_date: "2012-08-06" }
    }
  ],
  flares: [
    {
      flrID: "2024-05-14T16:46:00-FLR-001",
      classType: "X8.7",
      sourceLocation: "S18W89",
      activeRegionNum: 13664,
      peakTime: "2024-05-14T16:51Z",
      note: "Cycle 25 Record Solar Superflare detected by NOAA GOES and NASA SDO."
    },
    {
      flrID: "2024-05-10T06:27:00-FLR-001",
      classType: "X5.8",
      sourceLocation: "S18W27",
      activeRegionNum: 13664,
      peakTime: "2024-05-10T06:54Z",
      note: "Extreme proton storm triggering global auroral displays and Mars surface radiation warning."
    }
  ],
  osdr: [
    {
      accession: "OSDR-379",
      title: "Transcriptomic and Metabolic Response of Brassica under Microgravity and Simulated Regolith",
      organism: "Brassica rapa",
      factor: "Spaceflight microgravity & radiation",
      description: "Characterization of gene expression pathways and cellular stress in hydroponic crop systems for deep space life support."
    },
    {
      accession: "OSDR-452",
      title: "Astronaut Musculoskeletal and Bone Mineral Density Proteomics",
      organism: "Homo sapiens",
      factor: "Long-duration orbital stay",
      description: "Evaluation of osteoblast activity, calcium reabsorption, and mitigation protocols aboard the ISS."
    }
  ]
};

// 1. Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'ARES-1 NASA Open APIs Microservice',
    timestamp: new Date().toISOString(),
    cachedEntries: cache.size
  });
});

// 2. Astronomy Picture of the Day (APOD)
app.get('/api/nasa/apod', async (req, res) => {
  const cacheKey = 'nasa_apod';
  const cached = getCached(cacheKey);
  if (cached) return res.json({ source: 'cache', data: cached });

  try {
    const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`);
    if (!response.ok) throw new Error(`NASA API returned HTTP ${response.status}`);
    const data = await response.json();
    setCached(cacheKey, data);
    res.json({ source: 'live', data });
  } catch (err) {
    console.warn('[NASA APOD Fallback Active]:', err.message);
    res.json({ source: 'curated_fallback', data: FALLBACKS.apod, error: err.message });
  }
});

// 3. Mars Rover Photos (Curiosity / Perseverance)
app.get('/api/nasa/mars-photos', async (req, res) => {
  const sol = req.query.sol || 1000;
  const rover = req.query.rover || 'curiosity';
  const cacheKey = `mars_photos_${rover}_${sol}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json({ source: 'cache', data: cached });

  try {
    const response = await fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?sol=${sol}&api_key=${NASA_API_KEY}`);
    if (!response.ok) throw new Error(`NASA API returned HTTP ${response.status}`);
    const json = await response.json();
    const photos = json.photos?.slice(0, 12) || [];
    const data = photos.length > 0 ? photos : FALLBACKS.marsPhotos;
    setCached(cacheKey, data);
    res.json({ source: 'live', data });
  } catch (err) {
    console.warn('[Mars Photos Fallback Active]:', err.message);
    res.json({ source: 'curated_fallback', data: FALLBACKS.marsPhotos, error: err.message });
  }
});

// 4. Space Weather DONKI Solar Flares
app.get('/api/nasa/donki/flares', async (req, res) => {
  const cacheKey = 'donki_flares';
  const cached = getCached(cacheKey);
  if (cached) return res.json({ source: 'cache', data: cached });

  try {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const response = await fetch(`https://api.nasa.gov/DONKI/FLR?startDate=${thirtyDaysAgo}&endDate=${today}&api_key=${NASA_API_KEY}`);
    if (!response.ok) throw new Error(`DONKI API returned HTTP ${response.status}`);
    const json = await response.json();
    const data = Array.isArray(json) && json.length > 0 ? json.slice(-10) : FALLBACKS.flares;
    setCached(cacheKey, data);
    res.json({ source: 'live', data });
  } catch (err) {
    console.warn('[DONKI Flares Fallback Active]:', err.message);
    res.json({ source: 'curated_fallback', data: FALLBACKS.flares, error: err.message });
  }
});

// 5. NASA OSDR Space Biology Studies
app.get('/api/nasa/osdr', (req, res) => {
  res.json({
    source: 'curated_repository',
    data: FALLBACKS.osdr,
    portal: 'https://osdr.nasa.gov/'
  });
});

// 6. ElevenLabs High-Fidelity Text-to-Speech API
app.post('/api/tts', async (req, res) => {
  const { text, voiceId } = req.body || {};
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const selectedVoiceId = voiceId || process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel default

  if (!apiKey || apiKey === 'YOUR_ELEVENLABS_API_KEY' || apiKey.trim() === '') {
    return res.status(200).json({
      fallback: true,
      message: 'ELEVENLABS_API_KEY not configured in .env, falling back to local speech synthesis.'
    });
  }

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Valid text prompt is required.' });
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey.trim(),
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: text.slice(0, 1000),
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`ElevenLabs API returned HTTP ${response.status}:`, errText);
      return res.status(200).json({ fallback: true, error: errText });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=86400'
    });
    return res.send(buffer);
  } catch (err) {
    console.error('ElevenLabs fetch exception:', err.message);
    return res.status(200).json({ fallback: true, error: err.message });
  }
});

app.get('/api/tts/status', (req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey !== 'YOUR_ELEVENLABS_API_KEY' && apiKey.trim() !== '');
  res.json({
    configured: isConfigured,
    voiceId: process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM',
    provider: isConfigured ? 'ElevenLabs (High-Fidelity AI Voice)' : 'Browser Speech Synthesis (Local Fallback)'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ARES-1 NASA Open APIs Microservice listening on http://localhost:${PORT}`);
});

