import type RAPIER from '@dimforge/rapier3d';
import { GRAVITY, PHYSICS_TIMESTEP } from '../core/Constants';

export class PhysicsWorld {
  private world: RAPIER.World;

  constructor(private rapier: typeof RAPIER) {
    this.world = new rapier.World(GRAVITY);
  }

  step(): void {
    this.world.step();
  }

  getWorld(): RAPIER.World {
    return this.world;
  }

  getRapier(): typeof RAPIER {
    return this.rapier;
  }

  getTimestep(): number {
    return PHYSICS_TIMESTEP;
  }

  dispose(): void {
    this.world.free();
  }
}
