import 'dotenv/config';
import TestAddon from './addon';
import { Client } from '..';

class TestClient extends Client {
  protected async didReady() {
    this.load(TestAddon);
    this.user.setActivity('Tests ready!');
  }

  protected async didCatchError(err: Error) {
    console.error(err);
  }
}

const client = new TestClient({ debug: true, typing: true });

client.login(process.env.DISCORD_TOKEN);
