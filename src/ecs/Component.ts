export interface IComponent {
  readonly type: string;
}

export type ComponentMap = Map<string, IComponent>;
