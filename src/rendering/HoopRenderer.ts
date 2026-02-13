import * as THREE from 'three';
import {
  HOOP_POSITION,
  BACKBOARD_POSITION,
  RIM_RADIUS,
  RIM_THICKNESS,
  BACKBOARD_WIDTH,
  BACKBOARD_HEIGHT,
  BACKBOARD_THICKNESS,
  BACKBOARD_OFFSET,
  COURT_Y,
} from '../core/Constants';

export class HoopRenderer {
  private objects: THREE.Object3D[] = [];

  constructor(scene: THREE.Scene) {
    this.createRim(scene);
    this.createBackboard(scene);
    this.createNet(scene);
    this.createPole(scene);
  }

  private createRim(scene: THREE.Scene): void {
    const rimGeo = new THREE.TorusGeometry(RIM_RADIUS, RIM_THICKNESS, 8, 32);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xff4500,
      roughness: 0.3,
      metalness: 0.8,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.set(HOOP_POSITION.x, HOOP_POSITION.y, HOOP_POSITION.z);
    rim.rotation.x = -Math.PI / 2; // lay flat
    rim.castShadow = true;
    scene.add(rim);
    this.objects.push(rim);
  }

  private createBackboard(scene: THREE.Scene): void {
    const bbGeo = new THREE.BoxGeometry(
      BACKBOARD_WIDTH,
      BACKBOARD_HEIGHT,
      BACKBOARD_THICKNESS,
    );
    const bbMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.6,
    });
    const backboard = new THREE.Mesh(bbGeo, bbMat);
    backboard.position.set(
      BACKBOARD_POSITION.x,
      BACKBOARD_POSITION.y,
      BACKBOARD_POSITION.z,
    );
    backboard.castShadow = true;
    backboard.receiveShadow = true;
    scene.add(backboard);
    this.objects.push(backboard);

    // Backboard outline
    const outlineGeo = new THREE.EdgesGeometry(bbGeo);
    const outlineMat = new THREE.LineBasicMaterial({ color: 0x333333 });
    const outline = new THREE.LineSegments(outlineGeo, outlineMat);
    outline.position.copy(backboard.position);
    scene.add(outline);
    this.objects.push(outline);

    // Inner square (shooter's square)
    const sqW = 0.61; // 24 inches
    const sqH = 0.46; // 18 inches
    const sqGeo = new THREE.EdgesGeometry(
      new THREE.PlaneGeometry(sqW, sqH),
    );
    const sq = new THREE.LineSegments(sqGeo, new THREE.LineBasicMaterial({ color: 0xff4500 }));
    sq.position.set(
      BACKBOARD_POSITION.x,
      BACKBOARD_POSITION.y - 0.05,
      BACKBOARD_POSITION.z + BACKBOARD_THICKNESS / 2 + 0.001,
    );
    scene.add(sq);
    this.objects.push(sq);
  }

  private createNet(scene: THREE.Scene): void {
    const netHeight = 0.45;
    const segments = 12;
    const rings = 5;
    const points: THREE.Vector3[] = [];

    for (let ring = 0; ring <= rings; ring++) {
      const t = ring / rings;
      const y = HOOP_POSITION.y - t * netHeight;
      const radius = RIM_RADIUS * (1 - t * 0.3); // tapers slightly

      for (let seg = 0; seg <= segments; seg++) {
        const angle = (seg / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
          HOOP_POSITION.x + Math.cos(angle) * radius,
          y,
          HOOP_POSITION.z + Math.sin(angle) * radius,
        ));
      }
    }

    // Horizontal rings
    for (let ring = 0; ring <= rings; ring++) {
      const ringPoints: THREE.Vector3[] = [];
      const startIdx = ring * (segments + 1);
      for (let seg = 0; seg <= segments; seg++) {
        ringPoints.push(points[startIdx + seg]);
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPoints);
      const ringLine = new THREE.Line(
        ringGeo,
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }),
      );
      scene.add(ringLine);
      this.objects.push(ringLine);
    }

    // Vertical strings
    for (let seg = 0; seg < segments; seg++) {
      const vertPoints: THREE.Vector3[] = [];
      for (let ring = 0; ring <= rings; ring++) {
        vertPoints.push(points[ring * (segments + 1) + seg]);
      }
      const vertGeo = new THREE.BufferGeometry().setFromPoints(vertPoints);
      const vertLine = new THREE.Line(
        vertGeo,
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }),
      );
      scene.add(vertLine);
      this.objects.push(vertLine);
    }
  }

  private createPole(scene: THREE.Scene): void {
    const poleHeight = BACKBOARD_POSITION.y + BACKBOARD_HEIGHT / 2;
    const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, poleHeight, 8);
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.4,
      metalness: 0.6,
    });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(
      BACKBOARD_POSITION.x,
      COURT_Y + poleHeight / 2,
      BACKBOARD_POSITION.z - BACKBOARD_THICKNESS / 2 - 0.06,
    );
    pole.castShadow = true;
    scene.add(pole);
    this.objects.push(pole);

    // Horizontal bracket connecting pole to backboard
    const bracketLen = BACKBOARD_OFFSET + BACKBOARD_THICKNESS + 0.06;
    const bracketGeo = new THREE.CylinderGeometry(0.04, 0.04, bracketLen, 6);
    const bracket = new THREE.Mesh(bracketGeo, poleMat);
    bracket.rotation.x = Math.PI / 2;
    bracket.position.set(
      BACKBOARD_POSITION.x,
      HOOP_POSITION.y,
      BACKBOARD_POSITION.z + bracketLen / 2 - BACKBOARD_THICKNESS / 2,
    );
    bracket.castShadow = true;
    scene.add(bracket);
    this.objects.push(bracket);
  }

  dispose(): void {
    for (const obj of this.objects) {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.LineSegments) {
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
