import Validator from './Validator';
import { ReferenceableValue } from './Schema';
import NebulaError from '../errors/NebulaError';

export default class Ref {
  private _path: string;

  constructor(path: unknown) {
    if (typeof path !== 'string') throw new NebulaError('The reference path must be a string');

    this._path = path;
  }

  public resolve() {
    const pathSegments = this._path.split('.');
    let retrieved: ReferenceableValue | unknown = Validator.getValue();

    while (pathSegments.length > 0) {
      const segment = pathSegments.shift()!;

      retrieved = (retrieved as ReferenceableValue)[segment];

      if (retrieved == null) return null;
    }

    return retrieved;
  }
}
