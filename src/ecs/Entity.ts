export type EntityId = number;

let nextEntityId = 1;

export function createEntityId(): EntityId {
  return nextEntityId++;
}

export function resetEntityIdCounter(): void {
  nextEntityId = 1;
}
