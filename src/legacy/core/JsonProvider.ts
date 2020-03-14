import path from 'path';
import Provider, { ProviderOptions } from './Provider';

export default class JsonProvider extends Provider {
  /**
   * The directory where the provider stores the data.
   */
  outDir: string;

  constructor(options: ProviderOptions) {
    super(options);

    this.outDir = path.join(process.cwd(), 'db', `${options.name}.json`);
  }
}
