import type { IComponent } from '../Component';

export interface WeaponComponent extends IComponent {
  type: 'weapon';
  cooldown: number;
  maxCooldown: number;
  damage: number;
  range: number;
  projectileSpeed: number;
}

export function createWeaponComponent(
  damage: number = 15,
  range: number = 200,
  maxCooldown: number = 1.0,
  projectileSpeed: number = 400
): WeaponComponent {
  return { type: 'weapon', cooldown: 0, maxCooldown, damage, range, projectileSpeed };
}
