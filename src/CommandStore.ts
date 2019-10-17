import Store from './Store';
import Addon from './Addon';

export default class CommandStore extends Store {
  constructor(addon: Addon) {
    super(addon, {
      folderName: 'commands',
      type: 'commands',
    });
  }
}
