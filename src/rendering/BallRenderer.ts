import * as THREE from 'three';
import { BALL_RADIUS, BALL_RESET_POSITION } from '../core/Constants';

export class BallRenderer {
  private static sharedGeometry: THREE.SphereGeometry | null = null;
  private static sharedMaterial: THREE.MeshStandardMaterial | null = null;
  private static sharedTexture: THREE.CanvasTexture | null = null;
  private static instanceCount = 0;

  private instanceMaterial: THREE.MeshStandardMaterial | null = null;
  readonly mesh: THREE.Mesh;

  constructor(scene: THREE.Scene, color?: number) {
    if (!BallRenderer.sharedGeometry) {
      BallRenderer.sharedTexture = BallRenderer.createBallTexture();
      BallRenderer.sharedGeometry = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
      BallRenderer.sharedMaterial = new THREE.MeshStandardMaterial({
        color: 0xff6a00,
        roughness: 0.65,
        metalness: 0.05,
        map: BallRenderer.sharedTexture,
      });
    }
    BallRenderer.instanceCount++;

    let material: THREE.MeshStandardMaterial;
    if (color !== undefined && color !== 0xff6a00) {
      this.instanceMaterial = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.65,
        metalness: 0.05,
        map: BallRenderer.sharedTexture,
      });
      material = this.instanceMaterial;
    } else {
      material = BallRenderer.sharedMaterial!;
    }

    this.mesh = new THREE.Mesh(BallRenderer.sharedGeometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.set(
      BALL_RESET_POSITION.x,
      BALL_RESET_POSITION.y,
      BALL_RESET_POSITION.z,
    );
    scene.add(this.mesh);
  }

  private static createBallTexture(): THREE.CanvasTexture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base orange
    ctx.fillStyle = '#ff6a00';
    ctx.fillRect(0, 0, size, size);

    // Dark seam lines
    ctx.strokeStyle = '#3a2000';
    ctx.lineWidth = 3;

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.stroke();

    // Curved lines (basketball seam pattern)
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 3, 0, Math.PI * 2);
    ctx.stroke();

    // Left curve
    ctx.beginPath();
    ctx.arc(size * 0.15, size / 2, size / 3, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();

    // Right curve
    ctx.beginPath();
    ctx.arc(size * 0.85, size / 2, size / 3, Math.PI * 2 / 3, Math.PI * 4 / 3);
    ctx.stroke();

    // Add subtle pebble texture dots
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  setPosition(x: number, y: number, z: number): void {
    this.mesh.position.set(x, y, z);
  }

  setQuaternion(x: number, y: number, z: number, w: number): void {
    this.mesh.quaternion.set(x, y, z, w);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    if (this.instanceMaterial) {
      this.instanceMaterial.dispose();
      this.instanceMaterial = null;
    }
    BallRenderer.instanceCount--;
    if (BallRenderer.instanceCount <= 0) {
      BallRenderer.sharedGeometry?.dispose();
      BallRenderer.sharedTexture?.dispose();
      BallRenderer.sharedMaterial?.dispose();
      BallRenderer.sharedGeometry = null;
      BallRenderer.sharedTexture = null;
      BallRenderer.sharedMaterial = null;
      BallRenderer.instanceCount = 0;
    }
  }
}
