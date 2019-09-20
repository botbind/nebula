import chalk from 'chalk';
import moment from 'moment';
import { LogTypes } from '../types';

export default class Debugger {
  private static interpolateMessage(message: string, type: LogTypes, category?: string) {
    let styledType = `[${type}]`;

    switch (type) {
      case 'success':
        styledType = chalk.green.bold(styledType);
      case 'error':
        styledType = chalk.red.bold(styledType);
      case 'warn':
        styledType = chalk.yellow.bold(styledType);
      case 'info':
        styledType = chalk.blue.bold(styledType);
      default:
    }

    const styledCategory = category ? chalk.italic(`[${category}]`) : '';
    const time = moment().format('DD-MM-YYYY HH:mm:ss');

    return `${styledType} ${styledCategory} [${time}] ${message}`;
  }

  public static info(message: any, category?: string) {
    console.log(Debugger.interpolateMessage(message, 'info', category));
  }

  public static warn(message: any, category?: string) {
    console.log(Debugger.interpolateMessage(message, 'warn', category));
  }

  public static error(message: any, category?: string) {
    console.log(Debugger.interpolateMessage(message, 'error', category));
  }

  public static log(message: any, category?: string) {
    console.log(Debugger.interpolateMessage(message, 'log', category));
  }

  public static success(message: any, category?: string) {
    console.log(Debugger.interpolateMessage(message, 'success', category));
  }
}
