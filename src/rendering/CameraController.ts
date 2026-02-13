import * as THREE from 'three';
import { PLAYER_POSITION } from '../core/Constants';
import { clamp, degToRad, aimToDirection } from '../utils/MathUtils';

const MIN_PITCH = degToRad(-15);
const MAX_PITCH = degToRad(45);
const MIN_YAW = degToRad(-30);
const MAX_YAW = degToRad(30);

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private pitch = degToRad(10); // slight upward default to look toward hoop
  private yaw = 0;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 100);
    this.camera.position.set(
      PLAYER_POSITION.x,
      PLAYER_POSITION.y,
      PLAYER_POSITION.z,
    );
    this.applyRotation();
  }

  /** Update aim from input direction values (normalized -1 to 1) */
  update(aimX: number, aimY: number): void {
    // Base pitch ~5° upward to see hoop, then user adjusts from there
    const basePitch = degToRad(5);
    this.yaw = clamp(-aimX * degToRad(30), MIN_YAW, MAX_YAW);
    this.pitch = clamp(basePitch + aimY * degToRad(30), MIN_PITCH, MAX_PITCH);
    this.applyRotation();
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getAimDirection(): THREE.Vector3 {
    return aimToDirection(this.pitch, this.yaw);
  }

  /** Update aspect ratio on resize */
  setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  private applyRotation(): void {
    // Build euler: looking toward negative Z by default, apply pitch (x) and yaw (y)
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.x = this.pitch;
    this.camera.rotation.y = this.yaw;
  }
}
