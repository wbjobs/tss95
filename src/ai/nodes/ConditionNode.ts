import { BehaviorNode, Blackboard, NodeStatus } from '../BehaviorTree';

export type ConditionFn = (bb: Blackboard) => boolean;

export class ConditionNode extends BehaviorNode {
  private fn: ConditionFn;

  constructor(fn: ConditionFn) {
    super();
    this.fn = fn;
  }

  tick(bb: Blackboard): NodeStatus {
    return this.fn(bb) ? 'success' : 'failure';
  }

  reset(): void {}
}
