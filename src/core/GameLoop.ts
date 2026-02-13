import { PHYSICS_TIMESTEP } from './Constants';

export type UpdateCallback = (dt: number) => void;
export type RenderCallback = (alpha: number) => void;

export class GameLoop {
  private accumulator = 0;
  private lastTime = 0;
  private running = false;
  private rafId = 0;
  private readonly fixedDt: number;

  private onFixedUpdate: UpdateCallback = () => {};
  private onRender: RenderCallback = () => {};

  constructor(fixedTimestep: number = PHYSICS_TIMESTEP) {
    this.fixedDt = fixedTimestep;
  }

  setFixedUpdate(cb: UpdateCallback): void {
    this.onFixedUpdate = cb;
  }

  setRender(cb: RenderCallback): void {
    this.onRender = cb;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.tick(this.lastTime);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private tick = (now: number): void => {
    if (!this.running) return;

    const frameTime = Math.min((now - this.lastTime) / 1000, 0.1); // Cap at 100ms
    this.lastTime = now;
    this.accumulator += frameTime;

    while (this.accumulator >= this.fixedDt) {
      this.onFixedUpdate(this.fixedDt);
      this.accumulator -= this.fixedDt;
    }

    const alpha = this.accumulator / this.fixedDt;
    this.onRender(alpha);

    this.rafId = requestAnimationFrame(this.tick);
  };
}
