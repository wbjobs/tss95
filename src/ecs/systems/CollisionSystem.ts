import { System } from '../System';
import type { World } from '../World';
import type { PositionComponent } from '../components/PositionComponent';
import type { HealthComponent } from '../components/HealthComponent';
import type { RenderComponent } from '../components/RenderComponent';
import { SpatialHash } from '../../utils/spatialHash';
import { distance } from '../../utils/math';

export interface CollisionEvent {
  entityId1: number;
  entityId2: number;
  distance: number;
}

export class CollisionSystem extends System {
  readonly requiredComponents = ['position', 'health'];
  private spatialHash: SpatialHash;
  private _collisions: CollisionEvent[] = [];

  constructor() {
    super();
    this.spatialHash = new SpatialHash(80);
  }

  get collisions(): CollisionEvent[] {
    return this._collisions;
  }

  update(world: World, _dt: number): void {
    this._collisions = [];
    this.spatialHash.clear();

    const entities = world.getEntitiesWith('position', 'health');

    for (const id of entities) {
      const pos = world.getComponent<PositionComponent>(id, 'position');
      const health = world.getComponent<HealthComponent>(id, 'health');
      if (!pos || !health || !health.alive) continue;
      this.spatialHash.insert(pos.x, pos.y, id);
    }

    const checked = new Set<string>();
    for (const id of entities) {
      const pos = world.getComponent<PositionComponent>(id, 'position');
      const render = world.getComponent<RenderComponent>(id, 'render');
      const health = world.getComponent<HealthComponent>(id, 'health');
      if (!pos || !health || !health.alive) continue;

      const radius = render ? render.size : 10;
      const nearby = this.spatialHash.query(pos.x, pos.y, radius * 3);

      for (const otherId of nearby) {
        if (otherId === id) continue;
        const key = id < otherId ? `${id}-${otherId}` : `${otherId}-${id}`;
        if (checked.has(key)) continue;
        checked.add(key);

        const otherPos = world.getComponent<PositionComponent>(otherId, 'position');
        const otherRender = world.getComponent<RenderComponent>(otherId, 'render');
        const otherHealth = world.getComponent<HealthComponent>(otherId, 'health');
        if (!otherPos || !otherHealth || !otherHealth.alive) continue;

        const dist = distance(pos.x, pos.y, otherPos.x, otherPos.y);
        const otherRadius = otherRender ? otherRender.size : 10;
        const minDist = radius + otherRadius;

        if (dist < minDist) {
          this._collisions.push({
            entityId1: id,
            entityId2: otherId,
            distance: dist,
          });

          const overlap = minDist - dist;
          const dx = otherPos.x - pos.x;
          const dy = otherPos.y - pos.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const pushX = (dx / len) * overlap * 0.5;
          const pushY = (dy / len) * overlap * 0.5;

          pos.x -= pushX;
          pos.y -= pushY;
          otherPos.x += pushX;
          otherPos.y += pushY;
        }
      }
    }
  }
}
