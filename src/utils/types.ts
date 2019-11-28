/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Constructor<T = any> {
  new (...args: any[]): T;
}
