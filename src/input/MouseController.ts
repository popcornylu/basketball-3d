import { InputController, InputState, createDefaultInputState } from './InputController';
import { AIM_SENSITIVITY, CHARGE_RATE } from '../core/Constants';

export class MouseController implements InputController {
  readonly name = 'mouse';
  private _isActive = false;
  private state: InputState = createDefaultInputState();
  private canvas: HTMLCanvasElement | null = null;

  private readonly onMouseMove = (e: MouseEvent): void => {
    if (!document.pointerLockElement) return;
    this.state.aimDirection.x += e.movementX * AIM_SENSITIVITY;
    this.state.aimDirection.y -= e.movementY * AIM_SENSITIVITY;
    // Clamp aim to reasonable ranges
    this.state.aimDirection.x = Math.max(-1, Math.min(1, this.state.aimDirection.x));
    this.state.aimDirection.y = Math.max(-1, Math.min(1, this.state.aimDirection.y));
  };

  private readonly onMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return;
    // Request pointer lock on first click
    if (!document.pointerLockElement && this.canvas) {
      this.canvas.requestPointerLock();
      return;
    }
    this.state.isCharging = true;
    this.state.chargeLevel = 0;
  };

  private readonly onMouseUp = (e: MouseEvent): void => {
    if (e.button !== 0) return;
    if (this.state.isCharging) {
      this.state.shootTriggered = true;
      this.state.isCharging = false;
    }
  };

  private readonly onCanvasClick = (): void => {
    if (!document.pointerLockElement && this.canvas) {
      this.canvas.requestPointerLock();
    }
  };

  get isActive(): boolean {
    return this._isActive;
  }

  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
  }

  update(dt: number): void {
    // Increase charge while holding
    if (this.state.isCharging) {
      this.state.chargeLevel = Math.min(1, this.state.chargeLevel + CHARGE_RATE * dt);
    }
    // shootTriggered / resetTriggered are consumed after one frame
    // We clear them at the START of next update so consumers can read them this frame
  }

  /** Call after the game loop has read the state to clear one-frame triggers */
  clearTriggers(): void {
    this.state.shootTriggered = false;
    this.state.resetTriggered = false;
  }

  getState(): InputState {
    return this.state;
  }

  enable(): void {
    if (this._isActive) return;
    this._isActive = true;
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('mouseup', this.onMouseUp);
    if (this.canvas) {
      this.canvas.addEventListener('click', this.onCanvasClick);
    }
  }

  disable(): void {
    if (!this._isActive) return;
    this._isActive = false;
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('mouseup', this.onMouseUp);
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.onCanvasClick);
    }
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  dispose(): void {
    this.disable();
    this.canvas = null;
  }
}
