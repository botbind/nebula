import 'dotenv/config';
import TestAddon from './addon';
import { Client } from '..';

class TestClient extends Client {
  didReady() {
    this.load(TestAddon);
    this.user.setActivity('Tests ready!');
  }

  didCatchError(err: Error) {
    console.error(err);
  }
}

const client = new TestClient({ debug: true, typing: true, owners: ['578871214085242880'] });

client.login(process.env.DISCORD_TOKEN);
