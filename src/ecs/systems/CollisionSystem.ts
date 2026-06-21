import { System } from '../System';
import type { World } from '../World';
import type { PositionComponent } from '../components/PositionComponent';
import type { HealthComponent } from '../components/HealthComponent';
import type { RenderComponent } from '../components/RenderComponent';
import { SpatialHash } from '../../utils/spatialHash';

export interface CollisionEvent {
  entityId1: number;
  entityId2: number;
  distance: number;
}

interface ShipInfo {
  id: number;
  x: number;
  y: number;
  pos: PositionComponent;
  health: HealthComponent;
  render: RenderComponent;
  radius: number;
}

export class CollisionSystem extends System {
  readonly requiredComponents = ['position', 'health'];
  private spatialHash: SpatialHash;
  private _collisions: CollisionEvent[] = [];
  private shipCache: ShipInfo[] = [];
  private shipMap: Map<number, ShipInfo> = new Map();
  private queryBuffer: number[] = [];
  private cacheCount: number = 0;

  constructor() {
    super();
    this.spatialHash = new SpatialHash(60, 500);
  }

  get collisions(): CollisionEvent[] {
    return this._collisions;
  }

  update(world: World, _dt: number): void {
    this._collisions = [];
    this.spatialHash.clear();
    this.shipMap.clear();
    this.cacheCount = 0;

    const entities = world.getEntitiesWith('position', 'health', 'render');

    for (const id of entities) {
      const pos = world.getComponent<PositionComponent>(id, 'position');
      const health = world.getComponent<HealthComponent>(id, 'health');
      const render = world.getComponent<RenderComponent>(id, 'render');
      if (!pos || !health || !render || !health.alive) continue;

      let info = this.shipCache[this.cacheCount];
      if (!info) {
        info = { id, x: 0, y: 0, pos, health, render, radius: 0 };
        this.shipCache[this.cacheCount] = info;
      } else {
        info.id = id;
        info.pos = pos;
        info.health = health;
        info.render = render;
      }
      info.x = pos.x;
      info.y = pos.y;
      info.radius = render.size;
      this.shipMap.set(id, info);
      this.cacheCount++;

      this.spatialHash.insert(pos.x, pos.y, id);
    }

    for (let i = 0; i < this.cacheCount; i++) {
      const shipA = this.shipCache[i];
      if (!shipA || !shipA.health.alive) continue;

      const queryCount = this.spatialHash.query(
        shipA.x, shipA.y, shipA.radius * 3, this.queryBuffer);

      for (let j = 0; j < queryCount; j++) {
        const otherId = this.queryBuffer[j];
        if (otherId <= shipA.id) continue;

        const shipB = this.shipMap.get(otherId);
        if (!shipB || !shipB.health.alive) continue;

        const dx = shipB.x - shipA.x;
        const dy = shipB.y - shipA.y;
        const distSq = dx * dx + dy * dy;
        const minDist = shipA.radius + shipB.radius;
        const minDistSq = minDist * minDist;

        if (distSq < minDistSq && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          this._collisions.push({
            entityId1: shipA.id,
            entityId2: shipB.id,
            distance: dist,
          });

          const overlap = minDist - dist;
          const pushX = (dx / dist) * overlap * 0.5;
          const pushY = (dy / dist) * overlap * 0.5;

          shipA.pos.x -= pushX;
          shipA.pos.y -= pushY;
          shipB.pos.x += pushX;
          shipB.pos.y += pushY;
        }
      }
    }
  }
}
