import type { Team } from '../ecs/components/TeamComponent';
import type { AIState } from '../ecs/components/AIComponent';

export interface ShipFrameState {
  id: number;
  team: Team;
  x: number;
  y: number;
  angle: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  aiState: AIState;
  targetId: number | null;
  weaponCooldown: number;
  size: number;
}

export interface ProjectileFrameState {
  id: number;
  x: number;
  y: number;
  team: Team;
}

export interface FrameState {
  frameIndex: number;
  timestamp: number;
  ships: ShipFrameState[];
  projectiles: ProjectileFrameState[];
  redAlive: number;
  blueAlive: number;
}

export class ReplayStore {
  private frames: FrameState[] = [];
  private shipHistory: Map<number, { frameIndex: number; hp: number; targetId: number | null; aiState: AIState }[]> = new Map();
  private maxFrames: number = 108000;

  clear(): void {
    this.frames = [];
    this.shipHistory.clear();
  }

  addFrame(frame: FrameState): void {
    if (this.frames.length >= this.maxFrames) {
      this.frames.shift();
    }
    this.frames.push(frame);

    for (const ship of frame.ships) {
      let history = this.shipHistory.get(ship.id);
      if (!history) {
        history = [];
        this.shipHistory.set(ship.id, history);
      }
      history.push({
        frameIndex: frame.frameIndex,
        hp: ship.hp,
        targetId: ship.targetId,
        aiState: ship.aiState,
      });
    }
  }

  getFrame(index: number): FrameState | null {
    if (index < 0 || index >= this.frames.length) return null;
    return this.frames[index];
  }

  getFrameAtTime(time: number): FrameState | null {
    if (this.frames.length === 0) return null;
    let lo = 0, hi = this.frames.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.frames[mid].timestamp <= time) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    return this.frames[lo] || null;
  }

  getTotalFrames(): number {
    return this.frames.length;
  }

  getTotalTime(): number {
    if (this.frames.length === 0) return 0;
    return this.frames[this.frames.length - 1].timestamp;
  }

  getShipHistory(shipId: number): { frameIndex: number; timestamp: number; hp: number; targetId: number | null; aiState: AIState }[] {
    const history = this.shipHistory.get(shipId);
    if (!history) return [];
    return history.map((h) => ({
      ...h,
      timestamp: this.frames[h.frameIndex]?.timestamp ?? 0,
    }));
  }

  getShipIds(): number[] {
    return Array.from(this.shipHistory.keys());
  }

  hasData(): boolean {
    return this.frames.length > 0;
  }
}
