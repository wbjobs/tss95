import type { IComponent } from '../Component';

export type Team = 'red' | 'blue';

export interface TeamComponent extends IComponent {
  type: 'team';
  team: Team;
}

export function createTeamComponent(team: Team): TeamComponent {
  return { type: 'team', team };
}
