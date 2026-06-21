import type { IComponent } from '../Component';

export interface HealthComponent extends IComponent {
  type: 'health';
  hp: number;
  maxHp: number;
  alive: boolean;
}

export function createHealthComponent(maxHp: number = 100): HealthComponent {
  return { type: 'health', hp: maxHp, maxHp, alive: true };
}
