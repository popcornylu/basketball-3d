import { InputController, InputState, createDefaultInputState } from './InputController';
import { CHARGE_RATE } from '../core/Constants';

const AIM_SPEED = 1.5; // aim units per second when key held

export class KeyboardController implements InputController {
  readonly name = 'keyboard';
  private _isActive = false;
  private state: InputState = createDefaultInputState();
  private keys = new Set<string>();

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'r'].includes(key)) {
      e.preventDefault();
    }
    if (key === ' ' && !this.keys.has(' ')) {
      this.state.isCharging = true;
      this.state.chargeLevel = 0;
    }
    if (key === 'r' && !this.keys.has('r')) {
      this.state.resetTriggered = true;
    }
    this.keys.add(key);
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase();
    this.keys.delete(key);
    if (key === ' ') {
      if (this.state.isCharging) {
        this.state.shootTriggered = true;
        this.state.isCharging = false;
      }
    }
  };

  get isActive(): boolean {
    return this._isActive;
  }

  update(dt: number): void {
    // Aim direction from WASD / arrow keys
    let dx = 0;
    let dy = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) dx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) dx += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) dy += 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) dy -= 1;

    this.state.aimDirection.x = Math.max(-1, Math.min(1, this.state.aimDirection.x + dx * AIM_SPEED * dt));
    this.state.aimDirection.y = Math.max(-1, Math.min(1, this.state.aimDirection.y + dy * AIM_SPEED * dt));

    // Charge
    if (this.state.isCharging) {
      this.state.chargeLevel = Math.min(1, this.state.chargeLevel + CHARGE_RATE * dt);
    }
  }

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
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
  }

  disable(): void {
    if (!this._isActive) return;
    this._isActive = false;
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    this.keys.clear();
  }

  dispose(): void {
    this.disable();
  }
}
