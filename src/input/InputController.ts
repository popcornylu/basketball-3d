export interface InputState {
  aimDirection: { x: number; y: number }; // Aim offset from center
  chargeLevel: number; // 0 ~ 1
  isCharging: boolean; // Currently charging
  shootTriggered: boolean; // Released / shoot moment (true for one frame)
  resetTriggered: boolean; // Reset ball
}

export interface InputController {
  readonly name: string;
  readonly isActive: boolean;

  /** Called once per frame to poll / update state */
  update(dt: number): void;

  /** Get current input state */
  getState(): InputState;

  /** Activate this controller */
  enable(): void;

  /** Deactivate this controller */
  disable(): void;

  /** Cleanup resources */
  dispose(): void;
}

export function createDefaultInputState(): InputState {
  return {
    aimDirection: { x: 0, y: 0 },
    chargeLevel: 0,
    isCharging: false,
    shootTriggered: false,
    resetTriggered: false,
  };
}
