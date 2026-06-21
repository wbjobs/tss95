import { System } from '../System';
import type { World } from '../World';
import type { PositionComponent } from '../components/PositionComponent';
import type { VelocityComponent } from '../components/VelocityComponent';
import type { RenderComponent } from '../components/RenderComponent';
import { clamp } from '../../utils/math';

export class MovementSystem extends System {
  readonly requiredComponents = ['position', 'velocity'];
  private worldWidth: number;
  private worldHeight: number;

  constructor(worldWidth: number, worldHeight: number) {
    super();
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
  }

  setWorldSize(w: number, h: number): void {
    this.worldWidth = w;
    this.worldHeight = h;
  }

  update(world: World, dt: number): void {
    const entities = world.getEntitiesWith('position', 'velocity');

    for (const id of entities) {
      const pos = world.getComponent<PositionComponent>(id, 'position');
      const vel = world.getComponent<VelocityComponent>(id, 'velocity');
      if (!pos || !vel) continue;

      const speed = Math.sqrt(vel.vx * vel.vx + vel.vy * vel.vy);
      if (speed > vel.maxSpeed) {
        vel.vx = (vel.vx / speed) * vel.maxSpeed;
        vel.vy = (vel.vy / speed) * vel.maxSpeed;
      }

      pos.x += vel.vx * dt;
      pos.y += vel.vy * dt;

      pos.x = clamp(pos.x, 20, this.worldWidth - 20);
      pos.y = clamp(pos.y, 20, this.worldHeight - 20);

      if (speed > 5) {
        pos.angle = Math.atan2(vel.vy, vel.vx);
      }

      const render = world.getComponent<RenderComponent>(id, 'render');
      if (render) {
        render.trail.unshift({ x: pos.x, y: pos.y, alpha: 1.0 });
        if (render.trail.length > render.maxTrailLength) {
          render.trail.pop();
        }
        for (let i = 0; i < render.trail.length; i++) {
          render.trail[i].alpha = 1.0 - i / render.maxTrailLength;
        }
        if (render.flashTimer > 0) {
          render.flashTimer -= dt;
        }
      }
    }
  }
}
