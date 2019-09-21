import 'dotenv/config';
import { Client, Addon } from '..';

class TestClient extends Client {
  ready() {
    this.user.setActivity("Hello, I'm ready");
  }
}

class TestAddon extends Addon {
  constructor(client: Client) {
    super(client, {
      name: 'test-addon',
      baseDir: __dirname,
      folderName: {
        commands: 'command',
        tasks: 'scheduledTasks',
      },
    });
  }
}

const client = new TestClient({ debug: true });

client.load(TestAddon).login(process.env.DISCORD_TOKEN);
