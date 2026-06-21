import type { IComponent } from '../Component';

export interface PositionComponent extends IComponent {
  type: 'position';
  x: number;
  y: number;
  angle: number;
}

export function createPositionComponent(x: number, y: number, angle: number = 0): PositionComponent {
  return { type: 'position', x, y, angle };
}
