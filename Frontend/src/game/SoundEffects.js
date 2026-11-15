// Procedural Web Audio API sound generator + Browser Speech Synthesis
class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.currentAudio = null;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio = null;
      } catch (e) {}
    }
    if (this.muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    return this.muted;
  }

  _initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq = 600, duration = 0.12, type = 'sine', volume = 0.1) {
    if (this.muted) return;
    try {
      this._initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  playClick() {
    this.playTone(700, 0.08, 'triangle', 0.08);
  }

  playLaser() {
    if (this.muted) return;
    try {
      this._initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {}
  }

  playKlaxon() {
    // Dual warning chime for Solar Flares
    this.playTone(440, 0.2, 'sawtooth', 0.12);
    setTimeout(() => this.playTone(880, 0.25, 'sawtooth', 0.12), 150);
  }

  playPowerUp() {
    // Ascending chime for battery recharge
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'triangle', 0.1), i * 80);
    });
  }

  playVictory() {
    // Joyful fanfare
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.15), i * 120);
    });
  }

  playDefeat() {
    [400, 320, 260, 180].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 'sawtooth', 0.15), i * 120);
    });
  }

  playCountdownBeep(isTZero = false) {
    if (this.muted) return;
    this.playTone(isTZero ? 2400 : 1200, isTZero ? 0.45 : 0.12, 'sine', isTZero ? 0.25 : 0.12);
  }

  playElevatorHum(duration = 3.0) {
    if (this.muted) return;
    try {
      this._initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + duration);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  playRocketRumble(duration = 8.0) {
    if (this.muted) return;
    try {
      this._initContext();
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brown noise filter
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + duration * 0.4);
      filter.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 1.2);
      gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + duration * 0.7);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
      noise.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  async speak(text, voiceId = null) {
    if (this.muted || !text) return;

    // Stop any ongoing speech or ElevenLabs audio playback
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio = null;
      } catch (e) {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Quindar tone before transmission
    this.playTone(2524, 0.05, 'sine', 0.04);

    // Attempt high-fidelity ElevenLabs TTS via Backend proxy
    try {
      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId })
      });

      const contentType = resp.headers.get('content-type') || '';
      if (resp.ok && contentType.includes('audio/mpeg')) {
        const blob = await resp.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;
        audio.volume = 1.0;
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          if (this.currentAudio === audio) this.currentAudio = null;
        };
        await audio.play();
        return;
      }
    } catch (e) {
      console.warn('ElevenLabs proxy fetch failed, falling back to local speech synthesis:', e);
    }

    // Local Web Speech API Fallback
    this._fallbackBrowserSpeak(text);
  }

  _fallbackBrowserSpeak(text) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
      }, 80);
    } catch (e) {
      console.warn('Speech error:', e);
    }
  }
}

export const sound = new SoundManager();

