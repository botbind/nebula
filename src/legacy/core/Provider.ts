import L from '@botbind/lyra';
import Client from './Client';

export interface ProviderOptions {
  /**
   * The client of the provider.
   */
  client: Client;

  /**
   * The name of the provider.
   */
  name: string;
}

export default class Provider {
  /**
   * The client of the provider.
   */
  client: Client;

  /**
   * The name of the provider.
   */
  name: string;

  constructor(options: ProviderOptions) {
    const result = L.object({
      client: L.object()
        .instance(Client)
        .required(),
      name: L.string().required(),
    })
      .label('Provider options')
      .validate(options);

    if (result.errors !== null) throw result.errors[0];

    const { client, name } = result.value;

    this.client = client as Client;
    this.name = name;
  }
}

export interface ProviderConstructor {
  new (options: ProviderOptions): Provider;
}
