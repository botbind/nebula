import chalk from 'chalk';
import dayjs from 'dayjs';

/**
 * The log types
 */
export type LogTypes = 'success' | 'warn' | 'error' | 'info' | 'log';

/**
 * The Nebula debugger, an extension of the node console
 */
export default class Debugger {
  /**
   * Enhance message before printing
   * @param message The message to be printed
   * @param type The log type
   * @param category The category of the message
   */
  static interpolateMessage(message: string, type: LogTypes, category?: string) {
    let styledType = `[${type}]`;

    switch (type) {
      case 'success':
        styledType = chalk.green.bold(styledType);
        break;
      case 'error':
        styledType = chalk.red.bold(styledType);
        break;
      case 'warn':
        styledType = chalk.yellow.bold(styledType);
        break;
      case 'info':
        styledType = chalk.blue.bold(styledType);
        break;
      default:
    }

    const styledCategory = category ? chalk.italic(`[${category}]`) : '';
    const time = dayjs().format('DD-MM-YYYY HH:mm:ss');

    return `${styledType} ${styledCategory} [${time}] ${message}`;
  }

  /**
   * Log the message at info level
   * @param message The message to be printed
   * @param category The category of the message
   */
  static info(message: any, category?: string) {
    console.log(Debugger.interpolateMessage(message, 'info', category));
  }

  /**
   * Log the message at warn level
   * @param message The message to be printed
   * @param category The category of the message
   */
  static warn(message: any, category?: string) {
    console.log(Debugger.interpolateMessage(message, 'warn', category));
  }

  /**
   * Log the message at error level
   * @param message The message to be printed
   * @param category The category of the message
   */
  static error(message: any, category?: string) {
    console.log(Debugger.interpolateMessage(message, 'error', category));
  }

  /**
   * Log the message at log level
   * @param message The message to be printed
   * @param category The category of the message
   */
  static log(message: any, category?: string) {
    console.log(Debugger.interpolateMessage(message, 'log', category));
  }

  /**
   * Log the message at success level
   * @param message The message to be printed
   * @param category The category of the message
   */
  static success(message: any, category?: string) {
    console.log(Debugger.interpolateMessage(message, 'success', category));
  }
}
