export interface PullUpdateData {
  active: boolean;
  dx: number; // normalized -1..1 (left/right)
  dy: number; // normalized -1..1 (negative = up/cancel, positive = down/charge)
  charge: number; // 0..1
  cancel: boolean;
}

export class JoystickOverlay {
  private container: HTMLElement;
  private bases: HTMLElement[] = [];
  private knobs: HTMLElement[] = [];
  private baseSize = 80;
  private knobSize = 44;
  // Per-player base center in screen pixels
  private baseScreenPos: { x: number; y: number }[] = [];

  constructor(parent: HTMLElement, playerCount: number, knobColors: string[]) {
    this.container = document.createElement('div');
    Object.assign(this.container.style, {
      position: 'absolute',
      bottom: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '100',
    });

    for (let i = 0; i < playerCount; i++) {
      const color = knobColors[i] ?? '#fff';

      // Base ring
      const base = document.createElement('div');
      Object.assign(base.style, {
        position: 'absolute',
        width: `${this.baseSize}px`,
        height: `${this.baseSize}px`,
        borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.4)',
        background: 'rgba(255,255,255,0.08)',
        pointerEvents: 'none',
        // Hidden until setBaseScreenPosition is called
        display: 'none',
      });

      // Knob
      const knob = document.createElement('div');
      Object.assign(knob.style, {
        position: 'absolute',
        width: `${this.knobSize}px`,
        height: `${this.knobSize}px`,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.6)',
        border: `2px solid ${color}`,
        pointerEvents: 'auto',
        touchAction: 'none',
        cursor: 'grab',
        transition: 'background 0.1s',
        // Hidden until setBaseScreenPosition is called
        display: 'none',
      });

      this.container.appendChild(base);
      this.container.appendChild(knob);
      this.bases.push(base);
      this.knobs.push(knob);
      this.baseScreenPos.push({ x: 0, y: 0 });
    }

    parent.appendChild(this.container);
  }

  getKnobElement(playerIndex: number): HTMLElement {
    return this.knobs[playerIndex];
  }

  /** Set the base+knob rest position from projected screen coordinates (pixels). */
  setBaseScreenPosition(playerIndex: number, screenX: number, screenY: number): void {
    this.baseScreenPos[playerIndex] = { x: screenX, y: screenY };

    const base = this.bases[playerIndex];
    const knob = this.knobs[playerIndex];
    if (!base || !knob) return;

    // Position base centered at screen coords
    Object.assign(base.style, {
      display: '',
      left: `${screenX - this.baseSize / 2}px`,
      top: `${screenY - this.baseSize / 2}px`,
    });

    // Snap knob to base center (rest position)
    Object.assign(knob.style, {
      display: '',
      left: `${screenX - this.knobSize / 2}px`,
      top: `${screenY - this.knobSize / 2}px`,
      transform: 'none',
      background: 'rgba(255,255,255,0.6)',
    });
  }

  private getMaxPull(): number {
    return Math.min(window.innerWidth, window.innerHeight) * 0.3;
  }

  update(playerIndex: number, data: PullUpdateData): void {
    const knob = this.knobs[playerIndex];
    if (!knob) return;

    const basePos = this.baseScreenPos[playerIndex];

    if (!data.active) {
      // Snap knob back to base center
      Object.assign(knob.style, {
        left: `${basePos.x - this.knobSize / 2}px`,
        top: `${basePos.y - this.knobSize / 2}px`,
        transform: 'none',
        background: 'rgba(255,255,255,0.6)',
      });
      return;
    }

    const maxPull = this.getMaxPull();
    const pixelDx = data.dx * maxPull;
    const pixelDy = data.dy * maxPull;

    const knobCenterX = basePos.x + pixelDx;
    const knobCenterY = basePos.y + pixelDy;

    Object.assign(knob.style, {
      left: `${knobCenterX - this.knobSize / 2}px`,
      top: `${knobCenterY - this.knobSize / 2}px`,
      transform: 'none',
    });

    if (data.cancel) {
      knob.style.background = 'rgba(160,160,160,0.7)';
    } else {
      const charge = data.charge;
      const r = Math.round(charge * 255);
      const g = Math.round((1 - charge * 0.5) * 255);
      knob.style.background = `rgba(${r},${g},0,0.8)`;
    }
  }

  dispose(): void {
    this.container.remove();
  }
}
