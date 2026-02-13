import { InputController, InputState, createDefaultInputState } from './InputController';
import { CHARGE_RATE } from '../core/Constants';

const DEADZONE = 0.15;

function applyDeadzone(value: number): number {
  if (Math.abs(value) < DEADZONE) return 0;
  const sign = Math.sign(value);
  return sign * (Math.abs(value) - DEADZONE) / (1 - DEADZONE);
}

export class JoyConController implements InputController {
  readonly name = 'joycon';
  private _isActive = false;
  private state: InputState = createDefaultInputState();
  private gamepadIndex: number | null = null;

  private readonly onGamepadConnected = (e: GamepadEvent): void => {
    if (this.gamepadIndex === null) {
      this.gamepadIndex = e.gamepad.index;
    }
  };

  private readonly onGamepadDisconnected = (e: GamepadEvent): void => {
    if (e.gamepad.index === this.gamepadIndex) {
      this.gamepadIndex = null;
    }
  };

  get isActive(): boolean {
    return this._isActive;
  }

  private getGamepad(): Gamepad | null {
    if (this.gamepadIndex === null) return null;
    const gamepads = navigator.getGamepads();
    return gamepads[this.gamepadIndex] ?? null;
  }

  update(dt: number): void {
    const gp = this.getGamepad();
    if (!gp) return;

    // Left stick: aim direction (axis 0 = horizontal, axis 1 = vertical)
    const lx = applyDeadzone(gp.axes[0] ?? 0);
    const ly = applyDeadzone(gp.axes[1] ?? 0);
    this.state.aimDirection.x = Math.max(-1, Math.min(1, lx));
    this.state.aimDirection.y = Math.max(-1, Math.min(1, -ly)); // invert Y

    // Right trigger (button 7) or right bumper (button 5): charge/shoot
    const triggerValue = gp.buttons[7]?.value ?? 0;
    const triggerPressed = triggerValue > 0.1 || (gp.buttons[5]?.pressed ?? false);

    if (triggerPressed && !this.state.isCharging && !this.state.shootTriggered) {
      this.state.isCharging = true;
      this.state.chargeLevel = 0;
    } else if (!triggerPressed && this.state.isCharging) {
      this.state.shootTriggered = true;
      this.state.isCharging = false;
    }

    if (this.state.isCharging) {
      this.state.chargeLevel = Math.min(1, this.state.chargeLevel + CHARGE_RATE * dt);
    }

    // A button (0) or B button (1): reset ball
    if (gp.buttons[0]?.pressed || gp.buttons[1]?.pressed) {
      this.state.resetTriggered = true;
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
    window.addEventListener('gamepadconnected', this.onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);
    // Check for already-connected gamepads
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        this.gamepadIndex = i;
        break;
      }
    }
  }

  disable(): void {
    if (!this._isActive) return;
    this._isActive = false;
    window.removeEventListener('gamepadconnected', this.onGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.onGamepadDisconnected);
    this.gamepadIndex = null;
  }

  dispose(): void {
    this.disable();
  }
}
