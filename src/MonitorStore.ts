import Store from './Store';
import Addon from './Addon';

export default class MonitorStore extends Store {
  constructor(addon: Addon) {
    super(addon, {
      folderName: 'monitors',
      type: 'monitors',
    });
  }
}
