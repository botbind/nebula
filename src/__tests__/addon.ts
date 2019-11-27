import { Client, Addon, Store } from '..';

class TestStore extends Store {
  constructor(addon: Addon) {
    super(addon, {
      baseDir: __dirname,
    });
  }

  myOwnMethod() {
    console.log('hey');
  }
}

export default class TestAddon extends Addon {
  store!: TestStore;

  constructor(client: Client) {
    super(client, {
      name: 'test-addon',
      store: TestStore,
    });
  }
}
