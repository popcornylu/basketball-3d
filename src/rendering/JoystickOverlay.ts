export interface PullUpdateData {
  active: boolean;
  dx: number; // normalized -1..1 (left/right)
  dy: number; // normalized -1..1 (negative = up/cancel, positive = down/charge)
  charge: number; // 0..1
  cancel: boolean;
}

export class JoystickOverlay {
  private container: HTMLElement;
  private base: HTMLElement;
  private knob: HTMLElement;
  private line: HTMLElement;
  private baseSize = 80;
  private knobSize = 44;

  constructor(parent: HTMLElement) {
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

    // Base ring
    this.base = document.createElement('div');
    Object.assign(this.base.style, {
      position: 'absolute',
      bottom: '25vh',
      left: '50%',
      transform: 'translate(-50%, 50%)',
      width: `${this.baseSize}px`,
      height: `${this.baseSize}px`,
      borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.4)',
      background: 'rgba(255,255,255,0.08)',
      pointerEvents: 'none',
    });

    // Pull line (from base center to knob)
    this.line = document.createElement('div');
    Object.assign(this.line.style, {
      position: 'absolute',
      left: '50%',
      width: '2px',
      height: '0px',
      background: 'rgba(255,255,255,0.5)',
      transformOrigin: 'top center',
      transform: 'translateX(-50%)',
      pointerEvents: 'none',
      display: 'none',
    });

    // Knob
    this.knob = document.createElement('div');
    Object.assign(this.knob.style, {
      position: 'absolute',
      bottom: '25vh',
      left: '50%',
      transform: 'translate(-50%, 50%)',
      width: `${this.knobSize}px`,
      height: `${this.knobSize}px`,
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.6)',
      border: '2px solid rgba(255,255,255,0.8)',
      pointerEvents: 'auto',
      touchAction: 'none',
      cursor: 'grab',
      transition: 'background 0.1s',
    });

    this.container.appendChild(this.line);
    this.container.appendChild(this.base);
    this.container.appendChild(this.knob);
    parent.appendChild(this.container);
  }

  getKnobElement(): HTMLElement {
    return this.knob;
  }

  private getBaseCenterY(): number {
    // Base is at bottom: 25vh, centered via translate(_, 50%)
    return window.innerHeight * 0.75;
  }

  update(data: PullUpdateData): void {
    const baseCenterY = this.getBaseCenterY();

    if (!data.active) {
      // Snap knob back to center
      Object.assign(this.knob.style, {
        top: '',
        bottom: '25vh',
        left: '50%',
        transform: 'translate(-50%, 50%)',
        background: 'rgba(255,255,255,0.6)',
      });
      this.line.style.display = 'none';
      return;
    }

    const maxPull = this.getMaxPull();
    const pixelDx = data.dx * maxPull;
    const pixelDy = data.dy * maxPull; // positive = down on screen

    // Position knob using top (easier for pixel math)
    const knobCenterX = window.innerWidth / 2 + pixelDx;
    const knobCenterY = baseCenterY + pixelDy;

    Object.assign(this.knob.style, {
      bottom: '',
      top: `${knobCenterY - this.knobSize / 2}px`,
      left: `${knobCenterX - this.knobSize / 2}px`,
      transform: 'none',
    });

    // Color based on state
    if (data.cancel) {
      this.knob.style.background = 'rgba(160,160,160,0.7)';
    } else {
      const charge = data.charge;
      const r = Math.round(charge * 255);
      const g = Math.round((1 - charge * 0.5) * 255);
      this.knob.style.background = `rgba(${r},${g},0,0.8)`;
    }

    // Pull line from base center to knob center
    const dist = Math.sqrt(pixelDx * pixelDx + pixelDy * pixelDy);
    if (dist < 2) {
      this.line.style.display = 'none';
      return;
    }
    const angle = Math.atan2(pixelDx, pixelDy); // angle from downward axis
    this.line.style.display = 'block';
    this.line.style.height = `${dist}px`;
    this.line.style.top = `${baseCenterY}px`;
    this.line.style.left = `${window.innerWidth / 2}px`;
    this.line.style.transformOrigin = 'top center';
    this.line.style.transform = `translateX(-50%) rotate(${angle}rad)`;
  }

  private getMaxPull(): number {
    return Math.min(window.innerWidth, window.innerHeight) * 0.3;
  }

  dispose(): void {
    this.container.remove();
  }
}
