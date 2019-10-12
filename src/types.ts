export interface Constructor<T> {
  new (...args: any[]): T;
}

type Omit<T, K extends string | number | symbol> = { [P in Exclude<keyof T, K>]: T[P] };

export type MakeRequired<T, O extends keyof T> = Partial<Omit<T, O>> & Required<Pick<T, O>>;

export type MakeOptsOptional<T, K extends keyof T> = Omit<T, K> & Record<K, Partial<T[K]>>;

export type MakeOptsRequired<T, K extends keyof T, O extends keyof T[K]> = Omit<T, K> &
  Record<K, MakeRequired<T[K], O>>;
