import { BehaviorNode, Blackboard, NodeStatus } from '../BehaviorTree';

export type ActionFn = (bb: Blackboard) => NodeStatus;

export class ActionNode extends BehaviorNode {
  private fn: ActionFn;

  constructor(fn: ActionFn) {
    super();
    this.fn = fn;
  }

  tick(bb: Blackboard): NodeStatus {
    return this.fn(bb);
  }

  reset(): void {}
}
