import * as THREE from 'three';

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

/** Create a ring of positions (e.g. for rim capsules) */
export function createRingPositions(
  radius: number,
  count: number,
  centerY: number,
): { x: number; y: number; z: number; angle: number }[] {
  const positions: { x: number; y: number; z: number; angle: number }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    positions.push({
      x: Math.cos(angle) * radius,
      y: centerY,
      z: Math.sin(angle) * radius,
      angle,
    });
  }
  return positions;
}

/** Convert spherical aim (pitch, yaw) to a direction vector */
export function aimToDirection(
  pitch: number,
  yaw: number,
): THREE.Vector3 {
  const dir = new THREE.Vector3();
  dir.x = Math.sin(yaw) * Math.cos(pitch);
  dir.y = Math.sin(pitch);
  dir.z = -Math.cos(yaw) * Math.cos(pitch);
  return dir.normalize();
}
