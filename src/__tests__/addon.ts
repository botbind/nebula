import { Client, Addon } from '..';

export default class TestAddon extends Addon {
  constructor(client: Client) {
    super(client, {
      name: 'test-addon',
      baseDir: __dirname,
      folderNames: {
        commands: 'command',
        tasks: 'scheduledTasks',
      },
      validator: {
        abortEarly: false,
      },
    });
  }
}
