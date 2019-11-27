import colors from 'colors/safe';
import dayjs from 'dayjs';

/**
 * The log types
 */
export type LogTypes = 'success' | 'warn' | 'error' | 'info' | 'log';

const isDev = process.env.NODE_ENV === 'development';

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
  private static _interpolateMessage(message: unknown, type: LogTypes, category?: string) {
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

    const styledCategory = category ? colors.italic(`[${category}] `) : '';
    const time = dayjs().format('DD-MM-YYYY HH:mm:ss');

    return `${styledType} ${styledCategory}[${time}] ${message}`;
  }

  /**
   * Log the message at info level
   * @param message The message to be printed
   * @param category The category of the message
   */
  public static info(message: unknown, category?: string) {
    if (isDev) console.log(Debugger._interpolateMessage(message, 'info', category));
  }

  /**
   * Log the message at warn level
   * @param message The message to be printed
   * @param category The category of the message
   */
  public static warn(message: unknown, category?: string) {
    if (isDev) console.log(Debugger._interpolateMessage(message, 'warn', category));
  }

  /**
   * Log the message at error level
   * @param message The message to be printed
   * @param category The category of the message
   */
  public static error(message: unknown, category?: string) {
    if (isDev) console.log(Debugger._interpolateMessage(message, 'error', category));
  }

  /**
   * Log the message at log level
   * @param message The message to be printed
   * @param category The category of the message
   */
  public static log(message: unknown, category?: string) {
    if (isDev) console.log(Debugger._interpolateMessage(message, 'log', category));
  }

  /**
   * Log the message at success level
   * @param message The message to be printed
   * @param category The category of the message
   */
  public static success(message: unknown, category?: string) {
    if (isDev) console.log(Debugger._interpolateMessage(message, 'success', category));
  }
}