import { InputController, InputState, createDefaultInputState } from './InputController';

export class InputManager {
  private controllers = new Map<string, InputController>();
  private activeController: InputController | null = null;

  registerController(controller: InputController): void {
    this.controllers.set(controller.name, controller);
  }

  setActiveController(name: string): void {
    const controller = this.controllers.get(name);
    if (!controller) {
      console.warn(`InputManager: controller "${name}" not found`);
      return;
    }
    if (this.activeController && this.activeController !== controller) {
      this.activeController.disable();
    }
    this.activeController = controller;
    controller.enable();
  }

  getActiveController(): InputController | null {
    return this.activeController;
  }

  getState(): InputState {
    if (!this.activeController) return createDefaultInputState();
    return this.activeController.getState();
  }

  update(dt: number): void {
    if (!this.activeController) return;
    // Clear one-frame triggers from previous frame before updating
    if ('clearTriggers' in this.activeController && typeof (this.activeController as any).clearTriggers === 'function') {
      (this.activeController as any).clearTriggers();
    }
    this.activeController.update(dt);
  }

  getControllerNames(): string[] {
    return Array.from(this.controllers.keys());
  }

  /** Auto-detect gamepad and switch to joycon controller if available */
  detectGamepad(): void {
    if (!this.controllers.has('joycon')) return;
    window.addEventListener('gamepadconnected', () => {
      if (this.activeController?.name !== 'joycon') {
        console.log('InputManager: Gamepad detected, switching to joycon controller');
        this.setActiveController('joycon');
      }
    });
  }

  dispose(): void {
    for (const controller of this.controllers.values()) {
      controller.dispose();
    }
    this.controllers.clear();
    this.activeController = null;
  }
}
