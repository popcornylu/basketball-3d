export type GameEvents = {
  'shot:start': { chargeLevel: number };
  'shot:release': { chargeLevel: number; aimX: number; aimY: number };
  'shot:flight': undefined;
  'shot:scored': { type: 'swish' | 'rim' | 'backboard'; points: number };
  'shot:missed': undefined;
  'ball:reset': undefined;
  'ball:bounce': { velocity: number };
  'ball:rim-hit': { velocity: number };
  'state:change': { from: string; to: string };
  'input:controller-changed': { type: string };
};

type EventCallback<T> = T extends undefined ? () => void : (data: T) => void;

export class EventBus {
  private listeners = new Map<string, Set<Function>>();

  on<K extends keyof GameEvents>(event: K, callback: EventCallback<GameEvents[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off<K extends keyof GameEvents>(event: K, callback: EventCallback<GameEvents[K]>): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit<K extends keyof GameEvents>(
    event: K,
    ...args: GameEvents[K] extends undefined ? [] : [GameEvents[K]]
  ): void {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(...args);
      } catch (e) {
        console.error(`EventBus error in "${event}" handler:`, e);
      }
    });
  }
}
