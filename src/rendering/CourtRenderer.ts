import * as THREE from 'three';
import { COURT_LENGTH, COURT_WIDTH, COURT_Y, FREE_THROW_DIST } from '../core/Constants';

export class CourtRenderer {
  private objects: THREE.Object3D[] = [];

  constructor(scene: THREE.Scene) {
    this.createFloor(scene);
    this.createCourtLines(scene);
    this.createWalls(scene);
  }

  private createFloor(scene: THREE.Scene): void {
    const geo = new THREE.PlaneGeometry(COURT_WIDTH * 2, COURT_LENGTH * 2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xc68642,
      roughness: 0.8,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = COURT_Y;
    floor.receiveShadow = true;
    scene.add(floor);
    this.objects.push(floor);
  }

  private createCourtLines(scene: THREE.Scene): void {
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });

    // Free throw line (horizontal line at free throw distance)
    const ftLineWidth = 3.66; // 12 feet
    this.addLine(scene, lineMat,
      [-ftLineWidth / 2, COURT_Y + 0.01, FREE_THROW_DIST],
      [ftLineWidth / 2, COURT_Y + 0.01, FREE_THROW_DIST],
    );

    // Key / paint area - rectangle from baseline to free throw line
    const keyWidth = 3.66;
    const keyDepth = FREE_THROW_DIST;
    const y = COURT_Y + 0.01;

    // Left side of key
    this.addLine(scene, lineMat,
      [-keyWidth / 2, y, 0], [-keyWidth / 2, y, keyDepth],
    );
    // Right side of key
    this.addLine(scene, lineMat,
      [keyWidth / 2, y, 0], [keyWidth / 2, y, keyDepth],
    );
    // Baseline
    this.addLine(scene, lineMat,
      [-keyWidth / 2, y, 0], [keyWidth / 2, y, 0],
    );

    // Free throw circle (half circle facing the player)
    const circlePoints: THREE.Vector3[] = [];
    const ftCircleRadius = 1.83;
    for (let i = 0; i <= 32; i++) {
      const angle = (i / 32) * Math.PI; // half circle
      circlePoints.push(new THREE.Vector3(
        Math.cos(angle) * ftCircleRadius,
        y,
        FREE_THROW_DIST + Math.sin(angle) * ftCircleRadius,
      ));
    }
    const circleGeo = new THREE.BufferGeometry().setFromPoints(circlePoints);
    const circle = new THREE.Line(circleGeo, lineMat);
    scene.add(circle);
    this.objects.push(circle);

    // Center court line
    this.addLine(scene, lineMat,
      [-COURT_WIDTH, y, COURT_LENGTH / 2],
      [COURT_WIDTH, y, COURT_LENGTH / 2],
    );

    // Center circle
    const centerCirclePoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      centerCirclePoints.push(new THREE.Vector3(
        Math.cos(angle) * 1.83,
        y,
        COURT_LENGTH / 2 + Math.sin(angle) * 1.83,
      ));
    }
    const centerGeo = new THREE.BufferGeometry().setFromPoints(centerCirclePoints);
    const centerCircle = new THREE.Line(centerGeo, lineMat);
    scene.add(centerCircle);
    this.objects.push(centerCircle);
  }

  private createWalls(scene: THREE.Scene): void {
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a3e,
      roughness: 0.9,
      metalness: 0.0,
    });

    const wallHeight = 10;
    const halfLength = COURT_LENGTH;
    const halfWidth = COURT_WIDTH;

    // Back wall (behind the hoop)
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(halfWidth * 2, wallHeight),
      wallMat,
    );
    backWall.position.set(0, wallHeight / 2, -halfLength / 3);
    scene.add(backWall);
    this.objects.push(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(halfLength * 2, wallHeight),
      wallMat,
    );
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-halfWidth, wallHeight / 2, halfLength / 3);
    scene.add(leftWall);
    this.objects.push(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(halfLength * 2, wallHeight),
      wallMat,
    );
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(halfWidth, wallHeight / 2, halfLength / 3);
    scene.add(rightWall);
    this.objects.push(rightWall);

    // Ceiling
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(halfWidth * 2, halfLength * 2),
      new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 1.0 }),
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight;
    ceiling.position.z = halfLength / 3;
    scene.add(ceiling);
    this.objects.push(ceiling);
  }

  private addLine(
    scene: THREE.Scene,
    material: THREE.LineBasicMaterial,
    from: [number, number, number],
    to: [number, number, number],
  ): void {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...from),
      new THREE.Vector3(...to),
    ]);
    const line = new THREE.Line(geo, material);
    scene.add(line);
    this.objects.push(line);
  }

  dispose(): void {
    for (const obj of this.objects) {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
      obj.removeFromParent();
    }
    this.objects.length = 0;
  }
}
