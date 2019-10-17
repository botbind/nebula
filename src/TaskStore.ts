import Store from './Store';
import Addon from './Addon';

export default class TaskStore extends Store {
  constructor(addon: Addon) {
    super(addon, {
      folderName: 'tasks',
      type: 'tasks',
    });
  }
}
