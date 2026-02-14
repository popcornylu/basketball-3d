import * as THREE from 'three';
import { GRAVITY } from '../core/Constants';

const TRAJECTORY_POINTS = 40;

export class TrajectoryRenderer {
  private line: THREE.Line;

  constructor(scene: THREE.Scene, color?: number) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(TRAJECTORY_POINTS * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.LineDashedMaterial({
      color: color ?? 0xffffff,
      dashSize: 0.15,
      gapSize: 0.1,
      transparent: true,
      opacity: 0.5,
    });

    this.line = new THREE.Line(geo, mat);
    this.line.frustumCulled = false;
    this.line.visible = false;
    scene.add(this.line);
  }

  update(startPos: THREE.Vector3, direction: THREE.Vector3, power: number): void {
    const positions = this.line.geometry.attributes.position as THREE.BufferAttribute;
    const velocity = direction.clone().multiplyScalar(power);
    const dt = 0.05;

    let px = startPos.x;
    let py = startPos.y;
    let pz = startPos.z;
    let vx = velocity.x;
    let vy = velocity.y;
    let vz = velocity.z;

    let lastI = 0;
    for (let i = 0; i < TRAJECTORY_POINTS; i++) {
      positions.setXYZ(i, px, py, pz);
      lastI = i;

      // Euler integration step
      vx += GRAVITY.x * dt;
      vy += GRAVITY.y * dt;
      vz += GRAVITY.z * dt;
      px += vx * dt;
      py += vy * dt;
      pz += vz * dt;

      if (py < 0) break;
    }

    // Fill remaining points with the last valid position to avoid stray lines
    for (let i = lastI + 1; i < TRAJECTORY_POINTS; i++) {
      positions.setXYZ(i, px, Math.max(py, 0), pz);
    }

    this.line.geometry.setDrawRange(0, lastI + 1);
    positions.needsUpdate = true;
    this.line.geometry.computeBoundingSphere();
    this.line.computeLineDistances(); // required for dashed material
  }

  setVisible(visible: boolean): void {
    this.line.visible = visible;
  }

  dispose(): void {
    this.line.geometry.dispose();
    (this.line.material as THREE.Material).dispose();
    this.line.removeFromParent();
  }
}
