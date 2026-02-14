import * as THREE from 'three';
import {
  BALL_RESET_POSITION,
  HOOP_POSITION,
  BALL_MASS,
} from '../core/Constants';
import { lerp } from '../utils/MathUtils';
import type { InputState } from '../input/InputController';
import { PowerMeter } from './PowerMeter';
import { AimSystem } from './AimSystem';

// Physics-based shooting: compute launch velocity to hit a target
const GRAVITY = 9.81;

export class ShootingMechanic {
  private powerMeter = new PowerMeter();
  private aimSystem = new AimSystem();
  private startPosition: { x: number; y: number; z: number };

  constructor(startPosition?: { x: number; y: number; z: number }) {
    this.startPosition = startPosition ?? BALL_RESET_POSITION;
  }

  update(inputState: InputState, dt: number): void {
    // Update aim from input
    this.aimSystem.update(inputState.aimDirection.x, inputState.aimDirection.y);

    if (inputState.isCharging) {
      this.powerMeter.update(dt);
    }
  }

  shoot(chargeLevel: number, aimX: number = 0): { x: number; y: number; z: number } {
    const startPos = new THREE.Vector3(
      this.startPosition.x,
      this.startPosition.y,
      this.startPosition.z,
    );

    // Target: hoop center with small clearance above rim so ball clears it
    const targetPos = new THREE.Vector3(
      HOOP_POSITION.x,
      HOOP_POSITION.y + 0.15,
      HOOP_POSITION.z,
    );

    // Apply aim offset: aimX is -1..1, map to ±1.5m offset at hoop
    targetPos.x += aimX * 1.5;

    const dx = targetPos.x - startPos.x;
    const dy = targetPos.y - startPos.y;
    const dz = targetPos.z - startPos.z;
    const horizontalDist = Math.sqrt(dx * dx + dz * dz);

    // Flight time determines arc: chargeLevel controls how high the ball arcs
    // Lower charge = flatter/faster shot (undershoot), higher charge = higher arc (overshoot)
    // Sweet spot ~0.35-0.55 charge for a clean free throw
    const flightTime = lerp(0.4, 1.1, chargeLevel);

    // Compute launch velocities using kinematic equations:
    // horizontal: v_h = horizontalDist / t
    // vertical: y(t) = y0 + vy*t - 0.5*g*t² = target_y
    //   => vy = (dy + 0.5*g*t²) / t
    const vH = horizontalDist / flightTime;
    const vY = (dy + 0.5 * GRAVITY * flightTime * flightTime) / flightTime;

    // Build velocity vector
    const hDir = new THREE.Vector3(dx, 0, dz).normalize();
    const velocity = new THREE.Vector3(hDir.x * vH, vY, hDir.z * vH);

    // Return impulse (impulse = mass * velocity)
    const impulse = velocity.multiplyScalar(BALL_MASS);
    return { x: impulse.x, y: impulse.y, z: impulse.z };
  }

  getChargeLevel(): number {
    return this.powerMeter.getLevel();
  }

  getPowerMeter(): PowerMeter {
    return this.powerMeter;
  }

  getAimSystem(): AimSystem {
    return this.aimSystem;
  }

  reset(): void {
    this.powerMeter.reset();
    this.aimSystem.reset();
  }
}
