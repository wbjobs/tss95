import type { EntityId } from './Entity';
import { IComponent } from './Component';
import { System } from './System';

export class World {
  private entities: Map<EntityId, Map<string, IComponent>> = new Map();
  private systems: System[] = [];
  private entityCounter = 0;

  createEntity(): EntityId {
    const id = ++this.entityCounter;
    this.entities.set(id, new Map());
    return id;
  }

  destroyEntity(id: EntityId): void {
    this.entities.delete(id);
  }

  addComponent<T extends IComponent>(id: EntityId, component: T): void {
    const components = this.entities.get(id);
    if (components) {
      components.set(component.type, component);
    }
  }

  removeComponent(id: EntityId, type: string): void {
    const components = this.entities.get(id);
    if (components) {
      components.delete(type);
    }
  }

  getComponent<T extends IComponent>(id: EntityId, type: string): T | undefined {
    const components = this.entities.get(id);
    return components?.get(type) as T | undefined;
  }

  hasComponent(id: EntityId, type: string): boolean {
    const components = this.entities.get(id);
    return components?.has(type) ?? false;
  }

  getEntitiesWith(...componentTypes: string[]): EntityId[] {
    const result: EntityId[] = [];
    for (const [id, components] of this.entities) {
      if (componentTypes.every((t) => components.has(t))) {
        result.push(id);
      }
    }
    return result;
  }

  getAllEntities(): Map<EntityId, Map<string, IComponent>> {
    return this.entities;
  }

  entityExists(id: EntityId): boolean {
    return this.entities.has(id);
  }

  addSystem(system: System): void {
    this.systems.push(system);
  }

  removeSystem(system: System): void {
    const idx = this.systems.indexOf(system);
    if (idx >= 0) this.systems.splice(idx, 1);
  }

  update(dt: number): void {
    for (const system of this.systems) {
      system.update(this, dt);
    }
  }

  clear(): void {
    this.entities.clear();
    this.entityCounter = 0;
  }

  getEntityCount(): number {
    return this.entities.size;
  }
}
