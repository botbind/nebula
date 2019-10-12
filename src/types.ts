export interface Constructor<T> {
  new (...args: any[]): T;
}

export type RevertRequisites<T, O extends keyof T> = Partial<Omit<T, O>> & Required<Pick<T, O>>;

export type MakeKeysOptionalIn<T, K extends keyof T> = Omit<T, K> & Record<K, Partial<T[K]>>;

export type RevertRequisitesIn<T, K extends keyof T, O extends keyof T[K]> = Omit<T, K> &
  Record<K, RevertRequisites<T[K], O>>;
