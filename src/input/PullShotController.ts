import { InputController, InputState, createDefaultInputState } from './InputController';
import { clamp } from '../utils/MathUtils';
import type { PullUpdateData } from '../rendering/JoystickOverlay';

export class PullShotController implements InputController {
  readonly name = 'pullshot';
  isActive = false;

  private state: InputState = createDefaultInputState();
  private target: HTMLElement;
  private activePointerId: number | null = null;
  private startX = 0;
  private startY = 0;
  private pulling = false;
  private onPullUpdate: ((data: PullUpdateData) => void) | null = null;

  // Bound handlers for cleanup
  private handlePointerDown: (e: PointerEvent) => void;
  private handlePointerMove: (e: PointerEvent) => void;
  private handlePointerUp: (e: PointerEvent) => void;
  private handlePointerCancel: (e: PointerEvent) => void;

  constructor(knobElement: HTMLElement) {
    this.target = knobElement;

    this.handlePointerDown = this.onPointerDown.bind(this);
    this.handlePointerMove = this.onPointerMove.bind(this);
    this.handlePointerUp = this.onPointerUp.bind(this);
    this.handlePointerCancel = this.onPointerCancel.bind(this);
  }

  setOnPullUpdate(callback: (data: PullUpdateData) => void): void {
    this.onPullUpdate = callback;
  }

  enable(): void {
    this.isActive = true;
    this.target.addEventListener('pointerdown', this.handlePointerDown, { passive: false });
    window.addEventListener('pointermove', this.handlePointerMove, { passive: false });
    window.addEventListener('pointerup', this.handlePointerUp, { passive: false });
    window.addEventListener('pointercancel', this.handlePointerCancel, { passive: false });
  }

  disable(): void {
    this.isActive = false;
    this.target.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerCancel);
    this.reset();
  }

  update(_dt: number): void {
    // State is updated reactively via pointer events
  }

  getState(): InputState {
    return this.state;
  }

  clearTriggers(): void {
    if (this.state.shootTriggered) {
      // Shot was consumed — now reset aim and charge from the release frame
      this.state.aimDirection.x = 0;
      this.state.aimDirection.y = 0;
      this.state.chargeLevel = 0;
    }
    this.state.shootTriggered = false;
    this.state.resetTriggered = false;
  }

  dispose(): void {
    this.disable();
  }

  private getMaxPull(): number {
    return Math.min(window.innerWidth, window.innerHeight) * 0.3;
  }

  private onPointerDown(e: PointerEvent): void {
    if (this.activePointerId !== null) return; // ignore second finger
    e.preventDefault();
    this.activePointerId = e.pointerId;
    this.target.setPointerCapture(e.pointerId);
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.pulling = true;
    this.state.isCharging = true;
    this.state.chargeLevel = 0;
    this.emitPullUpdate();
  }

  private onPointerMove(e: PointerEvent): void {
    if (e.pointerId !== this.activePointerId || !this.pulling) return;
    e.preventDefault();

    const maxPull = this.getMaxPull();
    const rawDx = e.clientX - this.startX;
    const rawDy = e.clientY - this.startY;

    // dy: positive = finger moved down on screen = charge
    // dx: positive = finger moved right = aim right
    const dx = clamp(rawDx / maxPull, -1, 1);
    const dy = clamp(rawDy / maxPull, -1, 1);

    // Charge level from downward pull only
    const charge = dy > 0 ? clamp(dy, 0, 1) : 0;

    this.state.chargeLevel = charge;
    this.state.aimDirection.x = -dx;
    this.state.aimDirection.y = 0;

    this.emitPullUpdate();
  }

  private onPointerUp(e: PointerEvent): void {
    if (e.pointerId !== this.activePointerId) return;
    e.preventDefault();

    const maxPull = this.getMaxPull();
    const rawDy = e.clientY - this.startY;
    const dy = rawDy / maxPull;
    const minThreshold = 0.05;

    if (dy > minThreshold) {
      // Released while pulled down — shoot
      // Keep chargeLevel and aimDirection intact for this frame so
      // Game.ts can read them alongside shootTriggered.
      this.state.shootTriggered = true;
    } else {
      // Cancel — reset aim immediately
      this.state.aimDirection.x = 0;
      this.state.aimDirection.y = 0;
      this.state.chargeLevel = 0;
    }

    this.state.isCharging = false;
    this.pulling = false;
    this.activePointerId = null;

    this.emitPullUpdate();
  }

  private onPointerCancel(e: PointerEvent): void {
    if (e.pointerId !== this.activePointerId) return;
    this.reset();
    this.emitPullUpdate();
  }

  private reset(): void {
    this.state = createDefaultInputState();
    this.pulling = false;
    this.activePointerId = null;
  }

  private emitPullUpdate(): void {
    if (!this.onPullUpdate) return;

    if (!this.pulling) {
      this.onPullUpdate({ active: false, dx: 0, dy: 0, charge: 0, cancel: false });
      return;
    }

    const maxPull = this.getMaxPull();
    // Visual dx follows the finger (screen-space), aim is inverted
    const screenDx = -this.state.aimDirection.x;
    const charge = this.state.chargeLevel;
    // dy in screen space: positive = down
    const dy = charge; // when charging, dy = charge
    const cancel = charge === 0 && this.pulling;

    this.onPullUpdate({
      active: true,
      dx: screenDx,
      dy,
      charge,
      cancel,
    });
  }
}
