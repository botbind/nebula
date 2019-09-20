import Discord from 'discord.js';
import Command from './structures/Command';
import Task from './structures/Task';

export interface Constructor<T> {
  new (...args: any[]): T;
}

export type Resource = Command & Task;

export interface ResourceInfo {
  resource: Resource;
  group: string;
  category: string;
}

export type ResourceList = ResourceInfo[];

export interface GuildSettings {
  prefix: string;
}

export interface ClientOptions extends Discord.ClientOptions {
  debug?: boolean;
  typing?: boolean;
  prefix?: string;
}

export interface FolderName {
  commands: string;
  tasks: string;
}

export interface AddonOptions {
  name: string;
  baseDir: string;
  folderName?: FolderName;
  createFoldersIfNotExisted?: boolean;
  ignoreGroupFolderName?: string;
}

export interface CommandOptions {
  name: string;
  alias?: string[];
}

export interface TaskOptions {
  name: string;
}

export type CommandComponents = [string, string, string[]];

export type LogTypes = 'success' | 'warn' | 'error' | 'info' | 'log';
