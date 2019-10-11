export interface Constructor<T> {
  new (...args: any[]): T;
}

export type MakeOptional<T, TOptional extends keyof T> = Partial<Pick<T, TOptional>> &
  Omit<T, TOptional>;
