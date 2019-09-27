import Client from './structures/Client';
import Addon from './structures/Addon';
import Debugger from './structures/Debugger';
import Command from './structures/resource/Command';
import Validator from './structures/validator/Validator';
import ValidationError from './structures/validator/ValidationError';
import {
  ClientOptions,
  AddonOptions,
  ResourceInfo,
  ResourceList,
  Resource,
  LogTypes,
  FolderName,
  ValidatorOptions,
  Schema,
} from './types';

export default Client;
export {
  Client,
  ClientOptions,
  Command,
  Addon,
  AddonOptions,
  ResourceInfo,
  ResourceList,
  Resource,
  LogTypes,
  FolderName,
  Debugger,
  ValidatorOptions,
  Validator,
  ValidationError,
  Schema,
};
