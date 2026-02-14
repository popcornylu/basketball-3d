export class HUDRenderer {
  private scoreEl: HTMLElement | null;
  private powerFillEl: HTMLElement | null;
  private messageEl: HTMLElement | null;
  private messageTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.scoreEl = document.getElementById('score-display');
    this.powerFillEl = document.getElementById('power-bar-fill');
    this.messageEl = document.getElementById('message');
  }

  updateScore(score: number, shots: number, makes: number): void {
    if (!this.scoreEl) return;
    this.scoreEl.textContent = `${score}`;
    this.scoreEl.title = `${makes}/${shots}`;
  }

  updatePowerBar(level: number): void {
    if (!this.powerFillEl) return;
    const pct = Math.max(0, Math.min(1, level)) * 100;
    this.powerFillEl.style.height = `${pct}%`;
  }

  showMessage(text: string, duration: number): void {
    if (!this.messageEl) return;

    if (this.messageTimer !== null) {
      clearTimeout(this.messageTimer);
    }

    this.messageEl.textContent = text;
    this.messageEl.style.opacity = '1';

    this.messageTimer = setTimeout(() => {
      if (this.messageEl) {
        this.messageEl.style.opacity = '0';
      }
      this.messageTimer = null;
    }, duration);
  }

  setMultiplayer(isMultiplayer: boolean): void {
    const powerBar = document.getElementById('power-bar-container');
    const instructions = document.getElementById('instructions');
    if (powerBar) powerBar.style.display = isMultiplayer ? 'none' : '';
    if (instructions) instructions.style.display = isMultiplayer ? 'none' : '';
  }

  dispose(): void {
    if (this.messageTimer !== null) {
      clearTimeout(this.messageTimer);
    }
  }
}
