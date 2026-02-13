import type RAPIER from '@dimforge/rapier3d-compat';
import {
  BALL_OUT_OF_BOUNDS_Y,
  SWISH_POINTS,
  NORMAL_POINTS,
} from '../core/Constants';
import { EventBus } from '../core/EventBus';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import type { BallPhysics } from '../physics/BallPhysics';
import type { HoopPhysics } from '../physics/HoopPhysics';

export class ShotEvaluator {
  private tracking = false;
  private touchedRim = false;
  private scored = false;
  private settled = false;
  private settledFrames = 0;
  private flightFrames = 0;

  constructor(private eventBus: EventBus) {}

  startTracking(): void {
    this.tracking = true;
    this.touchedRim = false;
    this.scored = false;
    this.settled = false;
    this.settledFrames = 0;
    this.flightFrames = 0;
  }

  update(physicsWorld: PhysicsWorld, ball: BallPhysics, hoop: HoopPhysics): void {
    if (!this.tracking || this.scored || this.settled) return;

    const world = physicsWorld.getWorld();
    const ballHandle = ball.getColliderHandle();
    const sensorHandle = hoop.scoringSensorHandle;
    const rimHandles = hoop.getRimColliderHandles();
    const ballPos = ball.getPosition();
    const ballVel = ball.getVelocity();

    // Check rim contact via contact pairs
    const ballCollider = world.getCollider(ballHandle);
    if (ballCollider) {
      for (const rimHandle of rimHandles) {
        const rimCollider = world.getCollider(rimHandle);
        if (rimCollider) {
          let hasContact = false;
          world.contactPair(ballCollider, rimCollider, () => {
            hasContact = true;
          });
          if (hasContact && !this.touchedRim) {
            this.touchedRim = true;
            this.eventBus.emit('ball:rim-hit', { velocity: ball.getSpeed() });
            break;
          }
        }
      }
    }

    // Check scoring: ball intersects sensor while moving downward
    const sensorCollider = world.getCollider(sensorHandle);
    if (sensorCollider && ballCollider) {
      if (world.intersectionPair(sensorCollider, ballCollider)) {
        if (ballVel.y < 0) {
          this.scored = true;
          this.tracking = false;
          const type = this.touchedRim ? 'rim' as const : 'swish' as const;
          const points = this.touchedRim ? NORMAL_POINTS : SWISH_POINTS;
          this.eventBus.emit('shot:scored', { type, points });
          return;
        }
      }
    }

    // Check out of bounds
    if (ballPos.y < BALL_OUT_OF_BOUNDS_Y) {
      this.tracking = false;
      this.settled = true;
      this.eventBus.emit('shot:missed');
      return;
    }

    // Track flight time
    this.flightFrames++;

    // Check if ball has come to rest (low speed near ground)
    const speed = ball.getSpeed();
    if (speed < 0.5 && ballPos.y < 0.5) {
      this.settledFrames++;
      if (this.settledFrames > 20) {
        this.tracking = false;
        this.settled = true;
        this.eventBus.emit('shot:missed');
      }
    } else {
      this.settledFrames = 0;
    }

    // Timeout: if ball has been in flight for over 5 seconds, call it a miss
    if (this.flightFrames > 300) {
      this.tracking = false;
      this.settled = true;
      this.eventBus.emit('shot:missed');
    }
  }

  isTracking(): boolean {
    return this.tracking;
  }

  hasScored(): boolean {
    return this.scored;
  }

  reset(): void {
    this.tracking = false;
    this.touchedRim = false;
    this.scored = false;
    this.settled = false;
    this.settledFrames = 0;
    this.flightFrames = 0;
  }
}
