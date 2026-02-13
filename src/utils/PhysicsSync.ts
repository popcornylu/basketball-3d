import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';

/**
 * Sync a Three.js Object3D with a Rapier rigid body position and rotation.
 */
export function syncBodyToMesh(
  body: RAPIER.RigidBody,
  mesh: THREE.Object3D,
): void {
  const pos = body.translation();
  const rot = body.rotation();
  mesh.position.set(pos.x, pos.y, pos.z);
  mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
}

/**
 * Copy a Three.js Vector3 to a Rapier-compatible {x, y, z} object.
 */
export function vec3ToRapier(v: THREE.Vector3): { x: number; y: number; z: number } {
  return { x: v.x, y: v.y, z: v.z };
}

/**
 * Create a Three.js Vector3 from Rapier translation.
 */
export function rapierToVec3(v: { x: number; y: number; z: number }): THREE.Vector3 {
  return new THREE.Vector3(v.x, v.y, v.z);
}
