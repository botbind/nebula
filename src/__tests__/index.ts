import 'dotenv/config';
import TestAddon from './addon';
import { Client, Debugger } from '..';

class TestClient extends Client {
  didReady() {
    this.load(TestAddon);
    console.log(this.options.owners);
    Debugger.info('Hi!');
    this.user.setActivity('Tests ready!');
  }

  didCatchError(err: Error) {
    console.error(err);
  }
}

const client = new TestClient({ debug: true, typing: true });

client.login(process.env.DISCORD_TOKEN);
