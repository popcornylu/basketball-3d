import type * as THREE from 'three';
import { BALL_RESET_POSITION, MAX_FLYING_BALLS, BALL_CLEANUP_DELAY, BALL_SPAWN_DELAY } from '../core/Constants';
import { EventBus } from '../core/EventBus';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { BallPhysics } from '../physics/BallPhysics';
import { HoopPhysics } from '../physics/HoopPhysics';
import { BallRenderer } from '../rendering/BallRenderer';
import { ShotEvaluator } from './ShotEvaluator';

interface FlyingBall {
  physics: BallPhysics;
  renderer: BallRenderer;
  evaluator: ShotEvaluator;
  settledTime: number | null;
}

export class BallManager {
  private handBall: { physics: BallPhysics; renderer: BallRenderer } | null;
  private flyingBalls: FlyingBall[] = [];
  private handBallSpawnAt: number = 0; // timestamp when next hand ball should spawn

  constructor(
    private physicsWorld: PhysicsWorld,
    private scene: THREE.Scene,
    private eventBus: EventBus,
    private hoopPhysics: HoopPhysics,
  ) {
    this.handBall = this.createBall();
    this.handBall.physics.setGravityScale(0);
    this.handBall.physics.reset(BALL_RESET_POSITION);
  }

  shootHandBall(impulse: { x: number; y: number; z: number }): void {
    if (!this.handBall) return;

    if (this.flyingBalls.length >= MAX_FLYING_BALLS) {
      this.removeFlyingBall(0);
    }

    const ball = this.handBall;
    ball.physics.reset(BALL_RESET_POSITION);
    ball.physics.setGravityScale(1);
    ball.physics.applyImpulse(impulse);

    const evaluator = new ShotEvaluator(this.eventBus);
    evaluator.startTracking();

    this.flyingBalls.push({
      physics: ball.physics,
      renderer: ball.renderer,
      evaluator,
      settledTime: null,
    });

    // Delay spawning the next hand ball
    this.handBall = null;
    this.handBallSpawnAt = performance.now() + BALL_SPAWN_DELAY;
  }

  update(): void {
    // Spawn hand ball after delay
    if (!this.handBall && performance.now() >= this.handBallSpawnAt) {
      this.handBall = this.createBall();
      this.handBall.physics.setGravityScale(0);
      this.handBall.physics.reset(BALL_RESET_POSITION);
    }

    const toRemove: number[] = [];

    for (let i = 0; i < this.flyingBalls.length; i++) {
      const ball = this.flyingBalls[i];
      ball.evaluator.update(this.physicsWorld, ball.physics, this.hoopPhysics);

      if (!ball.evaluator.isTracking() && ball.settledTime === null) {
        ball.settledTime = performance.now();
      }

      if (ball.settledTime !== null && (performance.now() - ball.settledTime) > BALL_CLEANUP_DELAY) {
        toRemove.push(i);
      }
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.removeFlyingBall(toRemove[i]);
    }
  }

  detectBounces(lastBounceTimeRef: { value: number }): void {
    const now = performance.now();

    for (const ball of this.flyingBalls) {
      const pos = ball.physics.getPosition();
      const vel = ball.physics.getVelocity();

      if (pos.y < 0.3 && vel.y > 1 && now - lastBounceTimeRef.value > 200) {
        this.eventBus.emit('ball:bounce', { velocity: Math.abs(vel.y) });
        lastBounceTimeRef.value = now;
      }
    }
  }

  syncRendering(): void {
    const allBalls: { physics: BallPhysics; renderer: BallRenderer }[] = [...this.flyingBalls];
    if (this.handBall) allBalls.push(this.handBall);

    for (const ball of allBalls) {
      const pos = ball.physics.getPosition();
      const rot = ball.physics.getRotation();
      ball.renderer.setPosition(pos.x, pos.y, pos.z);
      ball.renderer.setQuaternion(rot.x, rot.y, rot.z, rot.w);
    }
  }

  getHandBall(): { physics: BallPhysics; renderer: BallRenderer } | null {
    return this.handBall;
  }

  dispose(): void {
    if (this.handBall) {
      this.handBall.physics.dispose();
      this.handBall.renderer.dispose();
    }

    for (const ball of this.flyingBalls) {
      ball.physics.dispose();
      ball.renderer.dispose();
    }
    this.flyingBalls = [];
  }

  private createBall(): { physics: BallPhysics; renderer: BallRenderer } {
    const physics = new BallPhysics(this.physicsWorld);
    const renderer = new BallRenderer(this.scene);
    return { physics, renderer };
  }

  private removeFlyingBall(index: number): void {
    const ball = this.flyingBalls[index];
    ball.physics.dispose();
    ball.renderer.dispose();
    this.flyingBalls.splice(index, 1);
  }
}
