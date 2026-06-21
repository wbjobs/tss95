import type { World } from './World';

export abstract class System {
  abstract readonly requiredComponents: string[];
  abstract update(world: World, dt: number): void;
}
