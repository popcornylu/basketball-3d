import { EventBus } from './EventBus';

export enum ShootingState {
  AIMING = 'AIMING',
  CHARGING = 'CHARGING',
}

export class GameState {
  private _state: ShootingState = ShootingState.AIMING;
  private _score = 0;
  private _shots = 0;
  private _makes = 0;

  constructor(private eventBus: EventBus) {}

  get state(): ShootingState {
    return this._state;
  }

  get score(): number {
    return this._score;
  }

  get shots(): number {
    return this._shots;
  }

  get makes(): number {
    return this._makes;
  }

  get percentage(): number {
    return this._shots === 0 ? 0 : Math.round((this._makes / this._shots) * 100);
  }

  transition(to: ShootingState): void {
    const from = this._state;
    if (from === to) return;
    this._state = to;
    this.eventBus.emit('state:change', { from, to });
  }

  addScore(points: number): void {
    this._score += points;
    this._makes++;
  }

  addShot(): void {
    this._shots++;
  }

  reset(): void {
    this._state = ShootingState.AIMING;
    this._score = 0;
    this._shots = 0;
    this._makes = 0;
  }
}
