import { InputController, InputState, createDefaultInputState } from './InputController';

/**
 * Placeholder for future camera-based input via MediaPipe / TensorFlow.js pose detection.
 *
 * Planned features:
 * - Track hand position for aim direction
 * - Detect throwing gesture for charge & release
 * - Detect open palm for reset
 */
export class CameraTrackingController implements InputController {
  readonly name = 'camera';
  private _isActive = false;

  get isActive(): boolean {
    return this._isActive;
  }

  update(_dt: number): void {
    // no-op
  }

  getState(): InputState {
    return createDefaultInputState();
  }

  enable(): void {
    this._isActive = true;
  }

  disable(): void {
    this._isActive = false;
  }

  dispose(): void {
    this.disable();
  }
}
