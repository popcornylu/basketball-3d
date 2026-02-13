import type RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import {
  HOOP_HEIGHT,
  RIM_RADIUS,
  RIM_THICKNESS,
  RIM_RESTITUTION,
  RIM_CAPSULE_COUNT,
  BACKBOARD_POSITION,
  BACKBOARD_WIDTH,
  BACKBOARD_HEIGHT,
  BACKBOARD_THICKNESS,
} from '../core/Constants';
import { createRingPositions } from '../utils/MathUtils';
import { PhysicsWorld } from './PhysicsWorld';

export class HoopPhysics {
  private rimBody: RAPIER.RigidBody;
  private backboardBody: RAPIER.RigidBody;
  private sensorBody: RAPIER.RigidBody;
  private _scoringSensorHandle: number;
  private rimColliderHandles: number[] = [];

  constructor(private physicsWorld: PhysicsWorld) {
    const rapier = physicsWorld.getRapier();
    const world = physicsWorld.getWorld();

    // --- Rim: 14 capsule colliders arranged in a ring ---
    const rimDesc = rapier.RigidBodyDesc.fixed().setTranslation(0, 0, 0);
    this.rimBody = world.createRigidBody(rimDesc);

    const positions = createRingPositions(RIM_RADIUS, RIM_CAPSULE_COUNT, HOOP_HEIGHT);
    const capsuleHalfHeight = 0.03; // Short capsule segments
    const capsuleRadius = RIM_THICKNESS;

    for (const pos of positions) {
      // Compute rotation: capsule default axis is Y, we need it horizontal and tangent
      // Step 1: Rotate 90° around Z to lay the capsule horizontal (Y → X)
      const qTilt = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 0, 1),
        -Math.PI / 2,
      );
      // Step 2: Rotate around Y by (angle + π/2) to align tangent to the ring
      const qYaw = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        pos.angle + Math.PI / 2,
      );
      const qFinal = qYaw.multiply(qTilt);

      const colliderDesc = rapier.ColliderDesc.capsule(capsuleHalfHeight, capsuleRadius)
        .setTranslation(pos.x, pos.y, pos.z)
        .setRotation({ x: qFinal.x, y: qFinal.y, z: qFinal.z, w: qFinal.w })
        .setRestitution(RIM_RESTITUTION);
      const collider = world.createCollider(colliderDesc, this.rimBody);
      this.rimColliderHandles.push(collider.handle);
    }

    // --- Backboard: cuboid collider ---
    const bbDesc = rapier.RigidBodyDesc.fixed().setTranslation(
      BACKBOARD_POSITION.x,
      BACKBOARD_POSITION.y,
      BACKBOARD_POSITION.z,
    );
    this.backboardBody = world.createRigidBody(bbDesc);
    const bbCollider = rapier.ColliderDesc.cuboid(
      BACKBOARD_WIDTH / 2,
      BACKBOARD_HEIGHT / 2,
      BACKBOARD_THICKNESS / 2,
    ).setRestitution(0.5);
    world.createCollider(bbCollider, this.backboardBody);

    // --- Scoring sensor: cylinder sensor just below the rim ---
    const sensorY = HOOP_HEIGHT - 0.1;
    const sensorDesc = rapier.RigidBodyDesc.fixed().setTranslation(0, sensorY, 0);
    this.sensorBody = world.createRigidBody(sensorDesc);
    const sensorCollider = rapier.ColliderDesc.cylinder(
      0.05, // thin cylinder half-height
      RIM_RADIUS - 0.04, // slightly smaller than rim so ball center must pass through
    ).setSensor(true);
    const sensor = world.createCollider(sensorCollider, this.sensorBody);
    this._scoringSensorHandle = sensor.handle;
  }

  get scoringSensorHandle(): number {
    return this._scoringSensorHandle;
  }

  getRimColliderHandles(): number[] {
    return this.rimColliderHandles;
  }

  dispose(): void {
    const world = this.physicsWorld.getWorld();
    world.removeRigidBody(this.sensorBody);
    world.removeRigidBody(this.backboardBody);
    world.removeRigidBody(this.rimBody);
  }
}
