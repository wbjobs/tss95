export type NodeStatus = 'success' | 'failure' | 'running';

export interface Blackboard {
  [key: string]: unknown;
}

export abstract class BehaviorNode {
  abstract tick(bb: Blackboard): NodeStatus;
  abstract reset(): void;
}
