# ARES-1 — NASA Space Apps Challenge submission draft

## Summary

ARES-1 is a browser-based space-science learning experience that pairs an interactive 3D Solar System with a junior-astronaut mission on Mars. Learners can explore planets and moons, read concise science facts, and take on a five-sol survival challenge that asks them to manage power, air, food, and radiation protection. Mission events introduce real scientific topics such as solar flares, Mars' carbon-dioxide-rich atmosphere, and producing oxygen with NASA's MOXIE experiment. A NASA data panel links to source material and can display astronomy and Mars imagery. The project is designed for students, families, and educators who want an approachable way to explore planetary science and the practical challenges of human spaceflight. By combining visual exploration, short explanations, and game decisions, ARES-1 helps turn space data into an experience learners can investigate and discuss.

## Project Demonstration

**Format:** Short slide presentation (up to 7 slides) or video (30 seconds or less).

**Public demo URL:** **[Add the public YouTube, Google Drive, OneDrive, Dropbox, or GitHub link after uploading.]**

Suggested seven-slide outline:

1. **ARES-1 — Junior Astronaut Mission Trainer:** project name and team.
2. **Explore the Solar System:** show the interactive 3D view and planet navigation.
3. **Choose a destination:** show a planet information panel and NASA resource links.
4. **Launch the Mars mission:** introduce the Earth-to-Mars mission flow.
5. **Keep the crew alive:** show the life-support meters and a sample mission decision.
6. **Science behind the simulation:** explain MOXIE, solar weather, and the NASA data sources.
7. **Learning through exploration:** summarize the intended student impact and show the project link.

Before submitting, upload the presentation or video and replace the placeholder above with a complete public URL. Check the link in a signed-out/private browser window.

## Project

**Project name:** ARES-1 — Junior Astronaut Mission Trainer  
**Project repository:** https://github.com/danielojo11/nasa-challenge  
**Deployed project URL, if available:** **[Add the public website URL, or use the public repository URL above.]**

Make sure the repository or deployed site is public and opens without a password, account, or access request.

## Project Details

ARES-1 has two connected experiences. In the Solar System explorer, visitors navigate a Three.js scene, select celestial destinations, and view planet facts and NASA resource references. In the Mars mission, the player responds to a sequence of five mission events while balancing battery, air, food, and radiation-shield levels. A short science quiz can reward a battery boost. The interface also provides localized, prewritten mission briefings and browser text-to-speech.

The project is intended to make planetary science and the constraints of living on Mars easier to explore for students, families, and educators. Its creative approach is to combine a free-roam 3D model with a simple, decision-based mission instead of presenting the subject only as text. The team considered accessibility and approachability through short explanations, clear resource meters, multiple language options, and support for smaller screens. NASA API data is used where available, with curated fallback content for network or API availability.

The frontend is written in JavaScript using Three.js, Vite, CSS, and GLSL shaders. It uses the browser Web Audio and speech-synthesis APIs for sound and spoken briefings. An optional Express backend proxies and caches selected NASA API requests. The Flight Director currently uses authored localized text and browser speech synthesis; it does not depend on a generative AI service.

## NASA Data and Resources

| Link Text | Link URL | How it is used |
|---|---|---|
| NASA Astronomy Picture of the Day (APOD) API | https://api.nasa.gov/ | Retrieves the Astronomy Picture of the Day when the API is available. |
| NASA Image and Video Library API | https://images.nasa.gov/ | Searches NASA's image archive for Curiosity/Mars rover imagery displayed in the photo gallery. |
| NASA Image and Video Library | https://images.nasa.gov/search?q=Curiosity%20Mars%20rover | Source for Mars rover images and their metadata. |
| NASA DONKI Space Weather Database | https://kauai.ccmc.gsfc.nasa.gov/DONKI/ | Source for solar-flare and space-weather event information used in mission references and data retrieval. |
| NASA Perseverance MOXIE instrument | https://mars.nasa.gov/mars2020/spacecraft/instruments/moxie/ | Scientific background for the Mars oxygen-production mission event. |
| NASA Mars Trek | https://trek.nasa.gov/mars/ | Mars mapping and exploration reference associated with the mission's Jezero Crater setting. |
| NASA Open Science Data Repository (OSDR) | https://osdr.nasa.gov/ | Research and space-biology resource referenced by the project. |
| NASA Curiosity Radiation Assessment Detector (RAD) | https://mars.nasa.gov/msl/spacecraft/instruments/rad/ | Background reference for radiation-related educational content. |
| NASA Deep Space Network | https://eyes.nasa.gov/dsn/dsn.html | Reference for deep-space communications and signal-delay concepts. |

**Asset note:** The local planetary texture files are credited in the frontend documentation to Solar System Scope under CC BY 4.0; they are not NASA datasets. Some mission values and event examples are curated educational content rather than live telemetry. Live endpoints can be unavailable or rate-limited, so the application includes fallback data.
