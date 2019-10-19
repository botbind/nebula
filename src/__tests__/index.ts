import 'dotenv/config';
import TestAddon from './addon';
import { Client } from '..';

class TestClient extends Client {
  public async didReady() {
    this.inject(TestAddon);
  }
}

const client = new TestClient({ debug: true, typing: true });

client.login(process.env.DISCORD_TOKEN);
