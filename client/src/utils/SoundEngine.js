class SoundEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type, duration, vol) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    // Smooth envelope to prevent clicking
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playClick() {
    this.init();
    this.playTone(800, 'sine', 0.1, 0.05); // Short, soft high tick
  }

  playJoin() {
    this.init();
    // Ascending major third (C5 to E5) - Happy chime
    this.playTone(523.25, 'sine', 0.5, 0.1);
    setTimeout(() => this.playTone(659.25, 'sine', 0.8, 0.1), 150);
  }

  playStart() {
    this.init();
    // Resonant bell/gong
    this.playTone(440, 'triangle', 1.5, 0.15);
    this.playTone(554.37, 'sine', 1.5, 0.05);
  }

  playMove() {
    this.init();
    // Soft pop
    this.playTone(350, 'sine', 0.15, 0.1);
  }

  playTurn() {
    this.init();
    // Gentle ping
    this.playTone(880, 'sine', 0.4, 0.08);
  }
}

const engine = new SoundEngine();
export default engine;
