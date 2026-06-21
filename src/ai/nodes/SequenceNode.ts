import { BehaviorNode, Blackboard, NodeStatus } from '../BehaviorTree';

export class SequenceNode extends BehaviorNode {
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
      if (status === 'failure') {
        this.currentIndex = 0;
        return 'failure';
      }
      this.currentIndex++;
    }
    this.currentIndex = 0;
    return 'success';
  }

  reset(): void {
    this.currentIndex = 0;
    for (const child of this.children) {
      child.reset();
    }
  }
}
