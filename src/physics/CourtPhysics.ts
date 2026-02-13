import type RAPIER from '@dimforge/rapier3d';
import { COURT_LENGTH, COURT_WIDTH, COURT_Y } from '../core/Constants';
import { PhysicsWorld } from './PhysicsWorld';

export class CourtPhysics {
  private groundBody: RAPIER.RigidBody;
  private wallBodies: RAPIER.RigidBody[] = [];

  constructor(private physicsWorld: PhysicsWorld) {
    const rapier = physicsWorld.getRapier();
    const world = physicsWorld.getWorld();

    // Ground plane: large flat cuboid at y=0
    const groundDesc = rapier.RigidBodyDesc.fixed().setTranslation(0, COURT_Y - 0.05, 0);
    this.groundBody = world.createRigidBody(groundDesc);
    const groundCollider = rapier.ColliderDesc.cuboid(
      COURT_LENGTH / 2,
      0.05,
      COURT_WIDTH / 2,
    ).setRestitution(0.7);
    world.createCollider(groundCollider, this.groundBody);

    // Walls to prevent ball going too far
    const wallThickness = 0.1;
    const wallHeight = 5;
    const walls = [
      // Back wall (behind hoop)
      { x: 0, y: wallHeight / 2, z: -COURT_WIDTH / 2, hx: COURT_LENGTH / 2, hy: wallHeight / 2, hz: wallThickness },
      // Left wall
      { x: -COURT_LENGTH / 2, y: wallHeight / 2, z: 0, hx: wallThickness, hy: wallHeight / 2, hz: COURT_WIDTH / 2 },
      // Right wall
      { x: COURT_LENGTH / 2, y: wallHeight / 2, z: 0, hx: wallThickness, hy: wallHeight / 2, hz: COURT_WIDTH / 2 },
    ];

    for (const wall of walls) {
      const bodyDesc = rapier.RigidBodyDesc.fixed().setTranslation(wall.x, wall.y, wall.z);
      const body = world.createRigidBody(bodyDesc);
      const collider = rapier.ColliderDesc.cuboid(wall.hx, wall.hy, wall.hz).setRestitution(0.3);
      world.createCollider(collider, body);
      this.wallBodies.push(body);
    }
  }

  dispose(): void {
    const world = this.physicsWorld.getWorld();
    for (const body of this.wallBodies) {
      world.removeRigidBody(body);
    }
    world.removeRigidBody(this.groundBody);
  }
}
