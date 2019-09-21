import Client from './structures/Client';
import Addon from './structures/Addon';
import Debugger from './structures/Debugger';
import Command from './structures/Command';
import Validator from './structures/Validator';
import ValidationError from './structures/ValidationError';
import {
  ClientOptions,
  AddonOptions,
  ResourceInfo,
  ResourceList,
  Resource,
  LogTypes,
  FolderName,
  ValidatorFunc,
  ValidatorOptions,
  ValidationResults,
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
  ValidatorFunc,
  ValidatorOptions,
  Validator,
  ValidationError,
  ValidationResults,
};
