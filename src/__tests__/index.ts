import 'dotenv/config';
import TestAddon from './addon';
import { Client } from '..';

class TestClient extends Client {
  protected async ready() {
    this.inject(new TestAddon(this));
  }
}

const client = new TestClient({
  shouldType: true,
  shouldEditCommandResponses: true,
});

client.login(process.env.DISCORD_TOKEN);
