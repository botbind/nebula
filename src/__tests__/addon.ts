import { Client, Addon, Store } from '..';

class TestStore extends Store {
  constructor(addon: Addon) {
    super(addon, {
      baseDir: __dirname,
    });
  }
}

export default class TestAddon extends Addon {
  constructor(client: Client) {
    super(client, {
      name: 'test-addon',
      store: TestStore,
    });
  }
}
