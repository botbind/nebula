import 'dotenv/config';
import { Client, Addon, GuildSettings } from '..';

class TestClient extends Client {
  ready() {
    this.user.setActivity("Hello, I'm ready");
  }
}

class TestAddon extends Addon {
  constructor(client: Client, guildSettings: GuildSettings) {
    super(client, guildSettings, {
      name: 'test-addon',
      baseDir: __dirname,
      folderName: {
        commands: 'command',
        tasks: 'scheduledTasks',
      },
    });
  }
}

const client = new TestClient();

client.load(TestAddon).login(process.env.DISCORD_TOKEN);
