import type { IComponent } from '../Component';

export type AIState = 'idle' | 'chase' | 'attack' | 'flee' | 'regroup';
export type TacticMode = 'focus_fire' | 'guerrilla' | 'default';

export interface AIComponent extends IComponent {
  type: 'ai';
  state: AIState;
  targetId: number | null;
  tacticMode: TacticMode;
  fleeThreshold: number;
  attackRange: number;
  preferredDistance: number;
}

export function createAIComponent(
  tacticMode: TacticMode = 'default',
  fleeThreshold: number = 0.3,
  attackRange: number = 180,
  preferredDistance: number = 150
): AIComponent {
  return {
    type: 'ai',
    state: 'idle',
    targetId: null,
    tacticMode,
    fleeThreshold,
    attackRange,
    preferredDistance,
  };
}
