import path from 'path';
import Discord from 'discord.js';
import Client from './Client';

export default class JsonProvider extends Discord.Collection<string, unknown> {
  protected client: Client;

  protected outDir: string;

  constructor(client: Client, name: string) {
    super();

    this.client = client;
    this.outDir = path.join(process.cwd(), 'db', `${name}.json`);
  }
}
