
// A procedural audio synthesizer for Brutalist soundscapes
// No external files required.

class AudioSynth {
  private ctx: AudioContext | null = null;
  private droneOscillators: OscillatorNode[] = [];
  private droneGain: GainNode | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Initialize on first user interaction to comply with browser policies
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopDrone();
    } else {
      // If we were supposed to be playing something, logic would go here, 
      // but usually drone is state-dependent.
    }
    return this.isMuted;
  }

  // UI Interaction Sounds (High pitch blips)
  playClick() {
    if (this.isMuted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    // Changed to sine for a softer, more "glassy" interface sound
    osc.type = 'sine';
    // Higher pitch, shorter duration for a "tick"
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime); 
    
    // Short envelope
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playHover() {
    if (this.isMuted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    
    // Very subtle hover sound
    gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playScanNoise() {
    if (this.isMuted || !this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    
    // Bandpass filter to make it sound like data transmission
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    // Reduced gain for scanning noise
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

    noise.start();
  }

  // Atmospheric Drone (Low frequency hum for immersion)
  startDrone() {
    if (this.isMuted || !this.ctx || this.droneOscillators.length > 0) return;

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0, this.ctx.currentTime);
    
    // REDUCED VOLUME: Target 0.05 (approx 5-10% perceptual volume)
    this.droneGain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 2); // Fade in
    this.droneGain.connect(this.ctx.destination);

    // Create 3 oscillators for a dissonant chord
    const freqs = [55, 110, 112]; // Low A, A octave, and a dissonant note
    
    freqs.forEach(f => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      
      // Add LFO for movement
      const lfo = this.ctx!.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.1 + Math.random(); // Slow modulation
      const lfoGain = this.ctx!.createGain();
      lfoGain.gain.value = 2; // Modulate frequency by 2Hz
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      osc.connect(this.droneGain!);
      osc.start();
      this.droneOscillators.push(osc);
    });
  }

  stopDrone() {
    if (this.droneGain && this.ctx) {
      this.droneGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1); // Fade out
      setTimeout(() => {
        this.droneOscillators.forEach(o => o.stop());
        this.droneOscillators = [];
        this.droneGain = null;
      }, 1000);
    }
  }
}

export const audioManager = new AudioSynth();