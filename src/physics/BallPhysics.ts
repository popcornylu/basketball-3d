import type RAPIER from '@dimforge/rapier3d';
import {
  BALL_RADIUS,
  BALL_MASS,
  BALL_RESTITUTION,
  BALL_RESET_POSITION,
} from '../core/Constants';
import { PhysicsWorld } from './PhysicsWorld';

export class BallPhysics {
  private body: RAPIER.RigidBody;
  private colliderHandle: number;

  constructor(private physicsWorld: PhysicsWorld) {
    const rapier = physicsWorld.getRapier();
    const world = physicsWorld.getWorld();

    const bodyDesc = rapier.RigidBodyDesc.dynamic()
      .setTranslation(BALL_RESET_POSITION.x, BALL_RESET_POSITION.y, BALL_RESET_POSITION.z)
      .setCcdEnabled(true);
    this.body = world.createRigidBody(bodyDesc);

    // Set mass properties via density: density = mass / volume
    // Volume of sphere = (4/3) * π * r³
    const volume = (4 / 3) * Math.PI * Math.pow(BALL_RADIUS, 3);
    const density = BALL_MASS / volume;

    const colliderDesc = rapier.ColliderDesc.ball(BALL_RADIUS)
      .setRestitution(BALL_RESTITUTION)
      .setDensity(density);
    const collider = world.createCollider(colliderDesc, this.body);
    this.colliderHandle = collider.handle;
  }

  applyImpulse(impulse: { x: number; y: number; z: number }): void {
    this.body.applyImpulse(impulse, true);
  }

  reset(position: { x: number; y: number; z: number }): void {
    this.body.setTranslation(position, true);
    this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
    this.body.wakeUp();
  }

  getPosition(): { x: number; y: number; z: number } {
    const t = this.body.translation();
    return { x: t.x, y: t.y, z: t.z };
  }

  getRotation(): { x: number; y: number; z: number; w: number } {
    const r = this.body.rotation();
    return { x: r.x, y: r.y, z: r.z, w: r.w };
  }

  getVelocity(): { x: number; y: number; z: number } {
    const v = this.body.linvel();
    return { x: v.x, y: v.y, z: v.z };
  }

  getSpeed(): number {
    const v = this.body.linvel();
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  }

  getBody(): RAPIER.RigidBody {
    return this.body;
  }

  getColliderHandle(): number {
    return this.colliderHandle;
  }

  setGravityScale(scale: number): void {
    this.body.setGravityScale(scale, true);
  }

  dispose(): void {
    this.physicsWorld.getWorld().removeRigidBody(this.body);
  }
}
