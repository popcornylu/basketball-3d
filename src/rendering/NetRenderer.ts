import * as THREE from 'three';
import { EventBus } from '../core/EventBus';
import {
  HOOP_POSITION,
  RIM_RADIUS,
  NET_HEIGHT,
  NET_SEGMENTS,
  NET_RINGS,
  NET_TAPER,
  NET_WAVE_SPEED,
  NET_WAVE_AMPLITUDE,
  NET_RADIAL_AMPLITUDE,
  NET_TWIST_AMPLITUDE,
  NET_SPRING_DAMPING,
  NET_SPRING_FREQUENCY,
  NET_ANIMATION_DURATION,
} from '../core/Constants';

export class NetRenderer {
  private ringLines: THREE.Line[] = [];
  private vertLines: THREE.Line[] = [];
  // Per-ring, per-segment rest data: [angle, radius, y] for reconstructing positions
  private restRing: { angle: number; radius: number; y: number }[][] = [];
  private animationStartTime = -1;
  // Per-segment random phase offsets for organic variation
  private segPhaseOffsets: number[] = [];
  private onScored: () => void;

  constructor(private scene: THREE.Scene, private eventBus: EventBus) {
    // Pre-compute random phase offsets per segment
    for (let seg = 0; seg <= NET_SEGMENTS; seg++) {
      this.segPhaseOffsets.push(Math.random() * Math.PI * 2);
    }
    this.onScored = () => {
      this.animationStartTime = performance.now() / 1000;
    };
    this.eventBus.on('shot:scored', this.onScored);
    this.buildNet();
  }

  private buildNet(): void {
    const ringMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
    const vertMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });

    // Build rest state: per-ring, per-segment polar data relative to hoop center
    for (let ring = 0; ring <= NET_RINGS; ring++) {
      const t = ring / NET_RINGS;
      const y = HOOP_POSITION.y - t * NET_HEIGHT;
      const radius = RIM_RADIUS * (1 - t * NET_TAPER);
      const ringData: { angle: number; radius: number; y: number }[] = [];
      for (let seg = 0; seg <= NET_SEGMENTS; seg++) {
        const angle = (seg / NET_SEGMENTS) * Math.PI * 2;
        ringData.push({ angle, radius, y });
      }
      this.restRing.push(ringData);
    }

    // Create horizontal ring line geometries
    for (let ring = 0; ring <= NET_RINGS; ring++) {
      const positions = new Float32Array((NET_SEGMENTS + 1) * 3);
      for (let seg = 0; seg <= NET_SEGMENTS; seg++) {
        const d = this.restRing[ring][seg];
        const idx = seg * 3;
        positions[idx] = HOOP_POSITION.x + Math.cos(d.angle) * d.radius;
        positions[idx + 1] = d.y;
        positions[idx + 2] = HOOP_POSITION.z + Math.sin(d.angle) * d.radius;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const line = new THREE.Line(geo, ringMat);
      this.scene.add(line);
      this.ringLines.push(line);
    }

    // Create vertical string line geometries
    for (let seg = 0; seg < NET_SEGMENTS; seg++) {
      const positions = new Float32Array((NET_RINGS + 1) * 3);
      for (let ring = 0; ring <= NET_RINGS; ring++) {
        const d = this.restRing[ring][seg];
        const idx = ring * 3;
        positions[idx] = HOOP_POSITION.x + Math.cos(d.angle) * d.radius;
        positions[idx + 1] = d.y;
        positions[idx + 2] = HOOP_POSITION.z + Math.sin(d.angle) * d.radius;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const line = new THREE.Line(geo, vertMat);
      this.scene.add(line);
      this.vertLines.push(line);
    }
  }

  private getVertexPosition(ring: number, seg: number, elapsed: number): { x: number; y: number; z: number } {
    const rest = this.restRing[ring][seg];

    if (ring === 0) {
      // Top ring is fixed at rim
      return {
        x: HOOP_POSITION.x + Math.cos(rest.angle) * rest.radius,
        y: rest.y,
        z: HOOP_POSITION.z + Math.sin(rest.angle) * rest.radius,
      };
    }

    const ringFactor = ring / NET_RINGS;
    const tLocal = elapsed - ring / NET_WAVE_SPEED;
    if (tLocal < 0) {
      return {
        x: HOOP_POSITION.x + Math.cos(rest.angle) * rest.radius,
        y: rest.y,
        z: HOOP_POSITION.z + Math.sin(rest.angle) * rest.radius,
      };
    }

    const decay = Math.exp(-NET_SPRING_DAMPING * tLocal);
    const segPhase = this.segPhaseOffsets[seg % this.segPhaseOffsets.length];
    // Per-vertex variation: slight phase and amplitude offset based on segment
    const vertexPhaseShift = segPhase * 0.3;
    const vertexAmpScale = 0.85 + 0.3 * Math.sin(segPhase);

    // Vertical displacement — pushes down then springs back
    const dy = NET_WAVE_AMPLITUDE * ringFactor * vertexAmpScale *
      decay * Math.sin(NET_SPRING_FREQUENCY * tLocal + vertexPhaseShift);

    // Radial displacement — net bulges outward as ball pushes through, then contracts
    // Phase-shifted from vertical so bulge leads the downward push
    const dr = NET_RADIAL_AMPLITUDE * ringFactor * vertexAmpScale *
      decay * Math.sin(NET_SPRING_FREQUENCY * tLocal + vertexPhaseShift + Math.PI * 0.4);

    // Angular twist — each ring rotates slightly around Y axis, alternating direction
    const twistSign = ring % 2 === 0 ? 1 : -1;
    const dAngle = NET_TWIST_AMPLITUDE * ringFactor * twistSign *
      decay * Math.sin(NET_SPRING_FREQUENCY * 0.7 * tLocal + vertexPhaseShift);

    const newAngle = rest.angle + dAngle;
    const newRadius = rest.radius + dr;

    return {
      x: HOOP_POSITION.x + Math.cos(newAngle) * newRadius,
      y: rest.y - dy,
      z: HOOP_POSITION.z + Math.sin(newAngle) * newRadius,
    };
  }

  update(): void {
    if (this.animationStartTime < 0) return;
    const now = performance.now() / 1000;
    const elapsed = now - this.animationStartTime;

    if (elapsed > NET_ANIMATION_DURATION) {
      // Reset to rest positions
      this.writeRestPositions();
      this.animationStartTime = -1;
      return;
    }

    // Update horizontal ring lines
    for (let ring = 0; ring <= NET_RINGS; ring++) {
      const attr = this.ringLines[ring].geometry.getAttribute('position') as THREE.BufferAttribute;
      for (let seg = 0; seg <= NET_SEGMENTS; seg++) {
        const pos = this.getVertexPosition(ring, seg, elapsed);
        const idx = seg * 3;
        attr.array[idx] = pos.x;
        attr.array[idx + 1] = pos.y;
        attr.array[idx + 2] = pos.z;
      }
      attr.needsUpdate = true;
    }

    // Update vertical string lines
    for (let seg = 0; seg < NET_SEGMENTS; seg++) {
      const attr = this.vertLines[seg].geometry.getAttribute('position') as THREE.BufferAttribute;
      for (let ring = 0; ring <= NET_RINGS; ring++) {
        const pos = this.getVertexPosition(ring, seg, elapsed);
        const idx = ring * 3;
        attr.array[idx] = pos.x;
        attr.array[idx + 1] = pos.y;
        attr.array[idx + 2] = pos.z;
      }
      attr.needsUpdate = true;
    }
  }

  private writeRestPositions(): void {
    for (let ring = 0; ring <= NET_RINGS; ring++) {
      const attr = this.ringLines[ring].geometry.getAttribute('position') as THREE.BufferAttribute;
      for (let seg = 0; seg <= NET_SEGMENTS; seg++) {
        const d = this.restRing[ring][seg];
        const idx = seg * 3;
        attr.array[idx] = HOOP_POSITION.x + Math.cos(d.angle) * d.radius;
        attr.array[idx + 1] = d.y;
        attr.array[idx + 2] = HOOP_POSITION.z + Math.sin(d.angle) * d.radius;
      }
      attr.needsUpdate = true;
    }
    for (let seg = 0; seg < NET_SEGMENTS; seg++) {
      const attr = this.vertLines[seg].geometry.getAttribute('position') as THREE.BufferAttribute;
      for (let ring = 0; ring <= NET_RINGS; ring++) {
        const d = this.restRing[ring][seg];
        const idx = ring * 3;
        attr.array[idx] = HOOP_POSITION.x + Math.cos(d.angle) * d.radius;
        attr.array[idx + 1] = d.y;
        attr.array[idx + 2] = HOOP_POSITION.z + Math.sin(d.angle) * d.radius;
      }
      attr.needsUpdate = true;
    }
  }

  dispose(): void {
    this.eventBus.off('shot:scored', this.onScored);
    for (const line of [...this.ringLines, ...this.vertLines]) {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
      line.removeFromParent();
    }
    this.ringLines.length = 0;
    this.vertLines.length = 0;
  }
}
