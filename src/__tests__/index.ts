import 'dotenv/config';
import TestAddon from './addon';
import { Client } from '..';

class TestClient extends Client {
  protected async didReady() {
    this.inject(new TestAddon(this));
  }
}

const client = new TestClient({ typing: true, commandEditable: true });

client.login(process.env.DISCORD_TOKEN);
