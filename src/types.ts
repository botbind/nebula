import Discord from 'discord.js';
import Command from './structures/resource/Command';
import Task from './structures/resource/Task';
import BaseValidator from './structures/validator/BaseValidator';
import ValidationError from './structures/validator/ValidationError';

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

export interface ValidatorOptions {
  abortEarly: boolean;
  coerce: boolean;
}

export interface AddonOptions {
  name: string;
  baseDir: string;
  folderName?: FolderName;
  createFoldersIfNotExisted?: boolean;
  ignoreGroupFolderName?: string;
  validator?: Partial<ValidatorOptions>;
}

export type ValidationMethod = (value: string, ...args: any[]) => boolean;

export type ValidationResults = [
  ValidationError[] | null,
  string | number | boolean | undefined | null,
];

export interface ValidationFlags {
  required?: boolean;
}

export interface Schema {
  type: string;
  flags: ValidationFlags;
  rules: ValidationMethod[];
}

export interface CommandOptions {
  name: string;
  alias?: string[];
  schema?: BaseValidator[];
}

export interface TaskOptions {
  name: string;
}

export type CommandComponents = [string, string, string[]];

export type LogTypes = 'success' | 'warn' | 'error' | 'info' | 'log';
