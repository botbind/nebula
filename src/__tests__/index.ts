import 'dotenv/config';
import TestAddon from './addon';
import { Client } from '..';

class TestClient extends Client {
  didReady() {
    this.load(TestAddon);
    this.user.setActivity("I'm ready!");
  }

  didCatchError(err: Error) {
    console.error(err);
  }
}

const client = new TestClient({ debug: true, typing: true });

client.login(process.env.DISCORD_TOKEN);
