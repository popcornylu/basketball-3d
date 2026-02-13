import { AIM_SENSITIVITY } from '../core/Constants';
import { clamp } from '../utils/MathUtils';

const MAX_YAW = Math.PI / 6; // ±30 degrees
const MAX_PITCH = Math.PI / 12; // ±15 degrees

export class AimSystem {
  private pitch = 0;
  private yaw = 0;

  update(aimX: number, aimY: number): void {
    this.yaw = clamp(aimX * AIM_SENSITIVITY, -MAX_YAW, MAX_YAW);
    this.pitch = clamp(aimY * AIM_SENSITIVITY, -MAX_PITCH, MAX_PITCH);
  }

  getAimOffset(): { pitch: number; yaw: number } {
    return { pitch: this.pitch, yaw: this.yaw };
  }

  reset(): void {
    this.pitch = 0;
    this.yaw = 0;
  }
}
