// Web Audio API engine for generating procedural "Holy" ambience

class EtherealAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private activeNodes: (() => void)[] = []; // Cleanup functions
  private isPlaying: boolean = false;

  // Open C Major 9 voicing (Spaced for clarity and warmth)
  // C2: Grounding base
  // G3: Harmonic support
  // C4: Center
  // E4: Major 3rd (sweetness)
  // B4: Major 7th (ethereal)
  // D5: Major 9th (heavenly air)
  private readonly frequencies = [
    65.41,  // C2
    196.00, // G3
    261.63, // C4
    329.63, // E4
    493.88, // B4
    587.33  // D5
  ];

  constructor() {
    // Singleton
  }

  // Generate a massive, smooth cathedral reverb
  private createReverbBuffer(duration: number = 6, decay: number = 4.0): AudioBuffer | null {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const impulseData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Pink-ish noise approximation for smoother tail
        const white = Math.random() * 2 - 1;
        // Simple smoothing
        const val = (i > 0 ? (white + impulseData[i-1])/2 : white);
        impulseData[i] = val * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  // Create a subtle "Air" / "Wind" noise floor
  private createAirLayer() {
    if (!this.ctx || !this.masterGain) return;
    
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Filter to keep only high "hiss" air frequencies
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 8000;
    filter.Q.value = 1;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.015; // Very quiet

    // Slow panning for the air
    const panner = this.ctx.createStereoPanner();
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.05;
    lfo.connect(panner.pan);

    noise.connect(filter).connect(gain).connect(panner).connect(this.masterGain);
    
    noise.start();
    lfo.start();

    this.activeNodes.push(() => {
        noise.stop();
        lfo.stop();
        noise.disconnect();
        gain.disconnect();
    });
  }

  public init() {
    if (this.ctx) return;

    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    this.ctx = new AudioContextClass();

    // Master Output
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;
    
    // Reverb
    this.reverbNode = this.ctx.createConvolver();
    const reverbBuffer = this.createReverbBuffer(6.0, 3.5);
    if (reverbBuffer) this.reverbNode.buffer = reverbBuffer;
    
    // Chain: Reverb -> Master
    this.reverbNode.connect(this.masterGain);
    
    // Direct signal mix (Dry) -> Master (Low amount to keep it distant)
    // Actually, for "Holy" sound, we want mostly wet signal.
    
    this.masterGain.connect(this.ctx.destination);

    this.setupVoices();
    this.createAirLayer();
  }

  private setupVoices() {
    if (!this.ctx || !this.reverbNode || !this.masterGain) return;

    this.frequencies.forEach((freq, index) => {
      // Create a "Choir Voice" consisting of 2 Oscillators
      
      const vGain = this.ctx!.createGain();
      vGain.gain.value = 0.06; // Base volume

      // --- Oscillator 1: Main Tone ---
      const osc1 = this.ctx!.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.value = freq;
      
      // --- Oscillator 2: Detuned "Chorus" Layer ---
      const osc2 = this.ctx!.createOscillator();
      osc2.type = index < 2 ? 'sine' : 'triangle'; // Lows are pure sine, highs have triangle texture
      osc2.frequency.value = freq;
      osc2.detune.value = 4 + Math.random() * 4; // Detune 4-8 cents

      // --- Filter: Breathing Lowpass ---
      // This makes the sound "open" and "close" gently like a mouth singing "Ooooo" -> "Aaaaa"
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = freq * 4; // Start cutoff
      
      const filterLFO = this.ctx!.createOscillator();
      filterLFO.type = 'sine';
      filterLFO.frequency.value = 0.05 + Math.random() * 0.05; // Very slow breath
      const filterLFOGain = this.ctx!.createGain();
      filterLFOGain.gain.value = freq; // Modulate cutoff by octave approx
      
      filterLFO.connect(filterLFOGain).connect(filter.frequency);

      // --- Stereo Panner: Drifting ---
      const panner = this.ctx!.createStereoPanner();
      const panLFO = this.ctx!.createOscillator();
      panLFO.frequency.value = 0.03 + Math.random() * 0.05; // Drift left/right
      const panDepth = this.ctx!.createGain();
      panDepth.gain.value = 0.6; // Don't hard pan, keep somewhat central
      panLFO.connect(panDepth).connect(panner.pan);

      // --- Amplitude Tremolo (Swell) ---
      // Makes the volume swell in and out
      const ampLFO = this.ctx!.createOscillator();
      ampLFO.frequency.value = 0.1 + Math.random() * 0.1;
      const ampLFOGain = this.ctx!.createGain();
      ampLFOGain.gain.value = 0.02; // Subtle volume change
      ampLFO.connect(ampLFOGain).connect(vGain.gain);

      // Routing
      // Oscs -> Filter -> Panner -> Gain -> Reverb & Master
      osc1.connect(filter);
      osc2.connect(filter);
      
      filter.connect(panner);
      panner.connect(vGain);
      
      // Send mostly to reverb for distance
      vGain.connect(this.reverbNode!);
      // Small amount dry for clarity
      const dryGain = this.ctx!.createGain();
      dryGain.gain.value = 0.2;
      vGain.connect(dryGain).connect(this.masterGain!);

      // Start all
      const now = this.ctx!.currentTime;
      osc1.start(now);
      osc2.start(now);
      filterLFO.start(now);
      panLFO.start(now);
      ampLFO.start(now);

      // Register cleanup
      this.activeNodes.push(() => {
        osc1.stop(); osc2.stop(); filterLFO.stop(); panLFO.stop(); ampLFO.stop();
        osc1.disconnect(); osc2.disconnect(); vGain.disconnect();
      });
    });
  }

  public async play() {
    if (!this.ctx) this.init();
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
    
    if (this.masterGain && this.ctx) {
      // Smooth fade in
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(Math.max(0, this.masterGain.gain.value), this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 4.0); // 4s Fade In
    }
    this.isPlaying = true;
  }

  public pause() {
    if (this.masterGain && this.ctx) {
      // Smooth fade out
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2.0);
    }
    this.isPlaying = false;
  }

  public toggle() {
    if (this.isPlaying) this.pause();
    else this.play();
    return !this.isPlaying;
  }
}

export const audioManager = new EtherealAudio();