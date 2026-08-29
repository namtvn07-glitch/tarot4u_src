// Ambient Audio Synthesizer Engine using Web Audio API
// Generates soothing wind chimes, nature breeze, singing bowls, and gentle rain

export type SoundscapeType = 'wind-chimes' | 'singing-bowl' | 'night-breeze' | 'gentle-rain';

export interface SoundscapeInfo {
  id: SoundscapeType;
  name: string;
  desc: string;
  icon: string;
}

export const SOUNDSCAPES: SoundscapeInfo[] = [
  {
    id: 'wind-chimes',
    name: 'Chuông Gió Phong Thủy',
    desc: 'Âm sắc chuông kim loại ngân nga du dương & tiếng gió nhẹ',
    icon: 'notifications_active',
  },
  {
    id: 'singing-bowl',
    name: 'Chuông Xoay Tây Tạng',
    desc: 'Tần số 432Hz xoa dịu tâm trí & khai mở trực giác',
    icon: 'self_improvement',
  },
  {
    id: 'night-breeze',
    name: 'Gió Đêm & Thiên Nhiên',
    desc: 'Tiếng thì thầm của gió đêm tĩnh mịch giữa rừng cây',
    icon: 'air',
  },
  {
    id: 'gentle-rain',
    name: 'Mưa Rào Tĩnh Lặng',
    desc: 'Tiếng mưa êm dịu gột rửa muộn phiền',
    icon: 'water_drop',
  },
];

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private currentSoundscape: SoundscapeType = 'wind-chimes';
  private timerIds: number[] = [];
  private activeNodes: (AudioNode | { stop: () => void })[] = [];
  private volume = 0.6;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentSoundscape(): SoundscapeType {
    return this.currentSoundscape;
  }

  public async play(soundscape?: SoundscapeType) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (soundscape) {
      this.currentSoundscape = soundscape;
    }

    this.stopNodesAndTimers();
    this.isPlaying = true;

    // Fade in
    this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.masterGain.gain.exponentialRampToValueAtTime(Math.max(0.01, this.volume), this.ctx.currentTime + 1.2);

    switch (this.currentSoundscape) {
      case 'wind-chimes':
        this.startWindChimes();
        break;
      case 'singing-bowl':
        this.startSingingBowl();
        break;
      case 'night-breeze':
        this.startNightBreeze();
        break;
      case 'gentle-rain':
        this.startGentleRain();
        break;
    }
  }

  public stop() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) {
      this.isPlaying = false;
      this.stopNodesAndTimers();
      return;
    }

    // Fade out smoothly
    try {
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.8);
      setTimeout(() => {
        this.stopNodesAndTimers();
        this.isPlaying = false;
      }, 850);
    } catch {
      this.stopNodesAndTimers();
      this.isPlaying = false;
    }
  }

  public setSoundscape(soundscape: SoundscapeType) {
    this.currentSoundscape = soundscape;
    if (this.isPlaying) {
      this.play(soundscape);
    }
  }

  private stopNodesAndTimers() {
    this.timerIds.forEach((id) => window.clearTimeout(id));
    this.timerIds = [];

    this.activeNodes.forEach((item) => {
      try {
        if ('stop' in item && typeof item.stop === 'function') {
          item.stop();
        }
        if ('disconnect' in item && typeof item.disconnect === 'function') {
          item.disconnect();
        }
      } catch {
        // ignore
      }
    });
    this.activeNodes = [];
  }

  // 1. Wind Chimes: Pentatonic chime hits + gentle warm drone
  private startWindChimes() {
    if (!this.ctx || !this.masterGain) return;

    // Warm atmospheric drone pad
    const padOsc1 = this.ctx.createOscillator();
    const padOsc2 = this.ctx.createOscillator();
    const padGain = this.ctx.createGain();
    const padFilter = this.ctx.createBiquadFilter();

    padOsc1.type = 'sine';
    padOsc1.frequency.setValueAtTime(108, this.ctx.currentTime); // A2 approx harmonic

    padOsc2.type = 'triangle';
    padOsc2.frequency.setValueAtTime(162, this.ctx.currentTime); // E3

    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(320, this.ctx.currentTime);

    padGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    padOsc1.connect(padFilter);
    padOsc2.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(this.masterGain);

    padOsc1.start();
    padOsc2.start();
    this.activeNodes.push(padOsc1, padOsc2, padGain, padFilter);

    // Pentatonic scale frequencies in Hz (Wind chimes in G pentatonic / high crystalline harmonics)
    const chimeFrequencies = [
      587.33, // D5
      659.25, // E5
      783.99, // G5
      880.0,  // A5
      1046.5, // C6
      1174.66,// D6
      1318.51,// E6
      1567.98,// G6
      1760.0, // A6
      2093.0, // C7
    ];

    const playRandomChime = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;

      const numStrikes = Math.random() > 0.4 ? (Math.random() > 0.6 ? 3 : 2) : 1;
      for (let s = 0; s < numStrikes; s++) {
        const freq = chimeFrequencies[Math.floor(Math.random() * chimeFrequencies.length)];
        const delay = s * (0.12 + Math.random() * 0.2);

        const osc = this.ctx.createOscillator();
        const oscHarmonic = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();

        const strikeTime = this.ctx.currentTime + delay;
        const duration = 2.8 + Math.random() * 2.2;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, strikeTime);

        // Metallic harmonic
        oscHarmonic.type = 'triangle';
        oscHarmonic.frequency.setValueAtTime(freq * 2.76, strikeTime);

        const strikeVolume = 0.07 + Math.random() * 0.08;
        chimeGain.gain.setValueAtTime(0.0001, strikeTime);
        chimeGain.gain.exponentialRampToValueAtTime(strikeVolume, strikeTime + 0.01);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, strikeTime + duration);

        osc.connect(chimeGain);
        oscHarmonic.connect(chimeGain);
        chimeGain.connect(this.masterGain);

        osc.start(strikeTime);
        oscHarmonic.start(strikeTime);
        osc.stop(strikeTime + duration + 0.1);
        oscHarmonic.stop(strikeTime + duration + 0.1);
      }

      // Schedule next random breeze hit
      const nextInterval = 1200 + Math.random() * 2800;
      const tid = window.setTimeout(playRandomChime, nextInterval);
      this.timerIds.push(tid);
    };

    playRandomChime();
  }

  // 2. Singing Bowl (Tibetan Bowl & OM Drone)
  private startSingingBowl() {
    if (!this.ctx || !this.masterGain) return;

    // 432Hz deep meditative fundamental drone
    const fundamental = 108; // 432 / 4 = 108Hz
    const bowlOsc = this.ctx.createOscillator();
    const bowlHarmonic1 = this.ctx.createOscillator();
    const bowlHarmonic2 = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();

    bowlOsc.type = 'sine';
    bowlOsc.frequency.setValueAtTime(fundamental, this.ctx.currentTime);

    bowlHarmonic1.type = 'sine';
    bowlHarmonic1.frequency.setValueAtTime(432, this.ctx.currentTime); // Heart frequency

    bowlHarmonic2.type = 'sine';
    bowlHarmonic2.frequency.setValueAtTime(648, this.ctx.currentTime);

    // Gentle LFO vibrato
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(1.5, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(bowlHarmonic1.frequency);
    lfo.start();

    droneGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    bowlOsc.connect(droneGain);
    bowlHarmonic1.connect(droneGain);
    bowlHarmonic2.connect(droneGain);
    droneGain.connect(this.masterGain);

    bowlOsc.start();
    bowlHarmonic1.start();
    bowlHarmonic2.start();

    this.activeNodes.push(bowlOsc, bowlHarmonic1, bowlHarmonic2, droneGain, lfo, lfoGain);

    // Periodic singing bowl mallet strikes
    const strikeBowl = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;

      const strikeOsc = this.ctx.createOscillator();
      const ringOsc = this.ctx.createOscillator();
      const strikeGain = this.ctx.createGain();
      const strikeTime = this.ctx.currentTime;
      const decay = 6.0;

      strikeOsc.type = 'sine';
      strikeOsc.frequency.setValueAtTime(432, strikeTime);
      strikeOsc.frequency.exponentialRampToValueAtTime(430, strikeTime + decay);

      ringOsc.type = 'triangle';
      ringOsc.frequency.setValueAtTime(864, strikeTime);

      strikeGain.gain.setValueAtTime(0.0001, strikeTime);
      strikeGain.gain.exponentialRampToValueAtTime(0.18, strikeTime + 0.03);
      strikeGain.gain.exponentialRampToValueAtTime(0.0001, strikeTime + decay);

      strikeOsc.connect(strikeGain);
      ringOsc.connect(strikeGain);
      strikeGain.connect(this.masterGain);

      strikeOsc.start(strikeTime);
      ringOsc.start(strikeTime);
      strikeOsc.stop(strikeTime + decay + 0.1);
      ringOsc.stop(strikeTime + decay + 0.1);

      const nextTime = 6500 + Math.random() * 4000;
      const tid = window.setTimeout(strikeBowl, nextTime);
      this.timerIds.push(tid);
    };

    strikeBowl();
  }

  // 3. Night Breeze & Deep Nature Wind
  private startNightBreeze() {
    if (!this.ctx || !this.masterGain) return;

    // Pink noise buffer generator for realistic wind
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Dynamic bandpass filter modulated by LFO to simulate wind gusting
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(280, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // Slow breath
    lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.14, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(windGain);
    windGain.connect(this.masterGain);

    whiteNoise.start();

    this.activeNodes.push(whiteNoise, filter, windGain, lfo, lfoGain);
  }

  // 4. Gentle Rain
  private startGentleRain() {
    if (!this.ctx || !this.masterGain) return;

    // White/Brown noise buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 2.5; // Gain compensation
    }

    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1200, this.ctx.currentTime);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.16, this.ctx.currentTime);

    rainSource.connect(lowpass);
    lowpass.connect(rainGain);
    rainGain.connect(this.masterGain);

    rainSource.start();

    // Occasional gentle water drops
    const drop = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;

      const osc = this.ctx.createOscillator();
      const dropGain = this.ctx.createGain();
      const startTime = this.ctx.currentTime;

      const freq = 1200 + Math.random() * 1400;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, startTime + 0.08);

      dropGain.gain.setValueAtTime(0.0001, startTime);
      dropGain.gain.exponentialRampToValueAtTime(0.05, startTime + 0.005);
      dropGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.08);

      osc.connect(dropGain);
      dropGain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.1);

      const nextDrop = 150 + Math.random() * 600;
      const tid = window.setTimeout(drop, nextDrop);
      this.timerIds.push(tid);
    };

    drop();
    this.activeNodes.push(rainSource, lowpass, rainGain);
  }
}

export const ambientAudio = new AmbientAudioEngine();
