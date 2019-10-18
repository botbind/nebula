import Discord from 'discord.js';
import { Monitor, Addon } from '../..';

export default class LevelMonitor extends Monitor {
  private userLevels: Map<string, [number, number]>;

  constructor(addon: Addon) {
    super(addon);

    this.userLevels = new Map();
  }

  public async didDispatch(message: Discord.Message) {
    const { id } = message.author;
    const userLevel = this.userLevels.get(id);

    if (userLevel === undefined) {
      this.userLevels.set(id, [1, 0]);
    } else {
      const [count, level] = userLevel;

      if (count + 1 >= 2) {
        message.channel.send(
          `Congrats <@${id}>, you just earned a new level! Your current level: ${level + 1}`,
        );
        this.userLevels.set(id, [0, level + 1]);

        return;
      }

      this.userLevels.set(message.author.id, [count + 1, level]);
    }
  }
}
