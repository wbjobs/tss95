import type { IComponent } from '../Component';

export interface VelocityComponent extends IComponent {
  type: 'velocity';
  vx: number;
  vy: number;
  maxSpeed: number;
}

export function createVelocityComponent(vx: number = 0, vy: number = 0, maxSpeed: number = 120): VelocityComponent {
  return { type: 'velocity', vx, vy, maxSpeed };
}
