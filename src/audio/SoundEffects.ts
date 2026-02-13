export function createBounceSound(ctx: AudioContext, dest: AudioNode): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.6, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.connect(gain).connect(dest);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

export function createSwishSound(ctx: AudioContext, dest: AudioNode): void {
  const bufferSize = ctx.sampleRate * 0.3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(3000, ctx.currentTime);
  bandpass.Q.setValueAtTime(1.5, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

  source.connect(bandpass).connect(gain).connect(dest);
  source.start(ctx.currentTime);
  source.stop(ctx.currentTime + 0.3);
}

export function createRimSound(ctx: AudioContext, dest: AudioNode): void {
  // Fundamental
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(800, ctx.currentTime);

  // Harmonic
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1200, ctx.currentTime);

  const gain1 = ctx.createGain();
  gain1.gain.setValueAtTime(0.4, ctx.currentTime);
  gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0.2, ctx.currentTime);
  gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  osc1.connect(gain1).connect(dest);
  osc2.connect(gain2).connect(dest);

  osc1.start(ctx.currentTime);
  osc1.stop(ctx.currentTime + 0.2);
  osc2.start(ctx.currentTime);
  osc2.stop(ctx.currentTime + 0.15);
}

export function createChargeSound(ctx: AudioContext, dest: AudioNode, chargeLevel: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  // Pitch rises with charge level: 200Hz to 600Hz
  const freq = 200 + chargeLevel * 400;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(freq + 50, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc.connect(gain).connect(dest);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
}

export function createBuzzerSound(ctx: AudioContext, dest: AudioNode): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  gain.gain.setValueAtTime(0.5, ctx.currentTime);
  gain.gain.setValueAtTime(0.5, ctx.currentTime + 0.4);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  osc.connect(gain).connect(dest);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.5);
}
