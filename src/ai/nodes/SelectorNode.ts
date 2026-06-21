import { BehaviorNode, Blackboard, NodeStatus } from '../BehaviorTree';

export class SelectorNode extends BehaviorNode {
  private children: BehaviorNode[];
  private currentIndex: number = 0;

  constructor(children: BehaviorNode[]) {
    super();
    this.children = children;
  }

  tick(bb: Blackboard): NodeStatus {
    while (this.currentIndex < this.children.length) {
      const status = this.children[this.currentIndex].tick(bb);
      if (status === 'running') return 'running';
      if (status === 'success') {
        this.currentIndex = 0;
        return 'success';
      }
      this.currentIndex++;
    }
    this.currentIndex = 0;
    return 'failure';
  }

  reset(): void {
    this.currentIndex = 0;
    for (const child of this.children) {
      child.reset();
    }
  }
}
