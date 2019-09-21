import Discord from 'discord.js';
import Command from './structures/Command';
import Task from './structures/Task';
import ValidationError from './structures/ValidationError';

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

export type ValidationResults<T extends number | boolean | string = number | boolean | string> = [
  ValidationError[] | null,
  T | null,
];

export type ValidatorFunc = (value: string) => ValidationResults;

export interface CommandOptions {
  name: string;
  alias?: string[];
  schema?: ValidatorFunc[];
}

export interface TaskOptions {
  name: string;
}

export interface ValidatorOptions {
  abortEarly?: boolean;
  coerce?: boolean;
}

export type CommandComponents = [string, string, string[]];

export type LogTypes = 'success' | 'warn' | 'error' | 'info' | 'log';
