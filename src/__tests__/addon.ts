import { Client, Addon } from '..';

export default class TestAddon extends Addon {
  constructor(client: Client) {
    super(client, {
      name: 'test-addon',
    });
  }
}
