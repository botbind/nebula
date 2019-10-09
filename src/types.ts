export interface Constructor<T> {
  new (...args: any[]): T;
}

export type LooseObject = Record<string, string>;
