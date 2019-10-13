import colors from 'colors/safe';
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
        styledType = colors.bold(colors.green(styledType));
        break;
      case 'error':
        styledType = colors.bold(colors.red(styledType));
        break;
      case 'warn':
        styledType = colors.bold(colors.yellow(styledType));
        break;
      case 'info':
        styledType = colors.bold(colors.blue(styledType));
        break;
      default:
    }

    const styledCategory = category ? colors.italic(`[${category}]`) : '';
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
