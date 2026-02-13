import * as THREE from 'three';
import { lerp } from '../utils/MathUtils';

export class HandRenderer {
  private handGroup: THREE.Group;
  private restZ = -0.6;
  private currentZ: number;
  private shootAnimProgress = -1; // -1 = not shooting

  constructor(camera: THREE.PerspectiveCamera) {
    this.handGroup = new THREE.Group();
    this.currentZ = this.restZ;

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xe8b89d,
      roughness: 0.7,
      metalness: 0.0,
    });

    // Palm
    const palm = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.1, 0.06),
      skinMat,
    );
    palm.position.set(0, 0, 0);
    this.handGroup.add(palm);

    // Fingers (4 fingers)
    for (let i = 0; i < 4; i++) {
      const finger = new THREE.Mesh(
        new THREE.BoxGeometry(0.016, 0.07, 0.016),
        skinMat,
      );
      finger.position.set(-0.025 + i * 0.017, 0.08, 0);
      this.handGroup.add(finger);
    }

    // Thumb
    const thumb = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.05, 0.018),
      skinMat,
    );
    thumb.position.set(-0.055, 0.02, 0.02);
    thumb.rotation.z = Math.PI / 5;
    this.handGroup.add(thumb);

    // Position hand at bottom-right of camera view
    this.handGroup.position.set(0.25, -0.2, this.restZ);
    this.handGroup.rotation.x = -0.2;
    camera.add(this.handGroup);
  }

  update(chargeLevel: number, isCharging: boolean, isShooting: boolean): void {
    if (isShooting && this.shootAnimProgress < 0) {
      this.shootAnimProgress = 0;
    }

    if (this.shootAnimProgress >= 0) {
      // Shooting animation: push forward
      this.shootAnimProgress += 0.08;
      if (this.shootAnimProgress < 0.5) {
        // Forward thrust
        this.currentZ = lerp(this.restZ, this.restZ + 0.3, this.shootAnimProgress * 2);
      } else if (this.shootAnimProgress < 1.0) {
        // Return to rest
        this.currentZ = lerp(this.restZ + 0.3, this.restZ, (this.shootAnimProgress - 0.5) * 2);
      } else {
        this.currentZ = this.restZ;
        this.shootAnimProgress = -1;
      }
    } else if (isCharging) {
      // Pull back based on charge level
      const pullBack = chargeLevel * 0.2;
      this.currentZ = lerp(this.currentZ, this.restZ - pullBack, 0.15);
    } else {
      // Return to rest
      this.currentZ = lerp(this.currentZ, this.restZ, 0.1);
    }

    this.handGroup.position.z = this.currentZ;
  }

  dispose(): void {
    this.handGroup.removeFromParent();
    this.handGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}
