import {
  createBounceSound,
  createSwishSound,
  createRimSound,
  createChargeSound,
  createBuzzerSound,
} from './SoundEffects';

export type SoundType = 'bounce' | 'swish' | 'rim' | 'charge' | 'buzzer';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume = 1;

  async ensureContext(): Promise<AudioContext> {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    return this.ctx;
  }

  async playSound(type: SoundType, chargeLevel?: number): Promise<void> {
    const ctx = await this.ensureContext();
    if (!this.masterGain) return;

    switch (type) {
      case 'bounce':
        createBounceSound(ctx, this.masterGain);
        break;
      case 'swish':
        createSwishSound(ctx, this.masterGain);
        break;
      case 'rim':
        createRimSound(ctx, this.masterGain);
        break;
      case 'charge':
        createChargeSound(ctx, this.masterGain, chargeLevel ?? 0.5);
        break;
      case 'buzzer':
        createBuzzerSound(ctx, this.masterGain);
        break;
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  dispose(): void {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
      this.masterGain = null;
    }
  }
}
