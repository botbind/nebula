export interface Constructor<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): T;
}

export type RequiredExcept<T, K extends keyof T> = Required<Omit<T, K>> & Pick<T, K>;
