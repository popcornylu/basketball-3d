import { CHARGE_RATE } from '../core/Constants';
import { clamp } from '../utils/MathUtils';

export class PowerMeter {
  private level = 0;
  private charging = false;

  startCharging(): void {
    this.charging = true;
    this.level = 0;
  }

  update(dt: number): void {
    if (this.charging) {
      this.level = clamp(this.level + CHARGE_RATE * dt, 0, 1);
    }
  }

  stopCharging(): number {
    const final = this.level;
    this.charging = false;
    this.level = 0;
    return final;
  }

  getLevel(): number {
    return this.level;
  }

  isCharging(): boolean {
    return this.charging;
  }

  reset(): void {
    this.level = 0;
    this.charging = false;
  }
}
