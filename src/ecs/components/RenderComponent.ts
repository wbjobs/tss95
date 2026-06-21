import type { IComponent } from '../Component';

export interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
}

export interface RenderComponent extends IComponent {
  type: 'render';
  size: number;
  trail: TrailPoint[];
  maxTrailLength: number;
  flashTimer: number;
}

export function createRenderComponent(size: number = 12): RenderComponent {
  return { type: 'render', size, trail: [], maxTrailLength: 15, flashTimer: 0 };
}
