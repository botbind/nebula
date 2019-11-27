import Discord from 'discord.js';
import Validator from './Validator';

console.log(
  Validator.object({
    shouldType: Validator.boolean()
      .optional()
      .default(false),
    prefix: Validator.string()
      .optional()
      .default('!'),
    owners: Validator.array(Validator.string())
      .optional()
      .default([]),
    shouldEditCommandResponse: Validator.boolean()
      .optional()
      .default(false),
    commandMessageLifetime: Validator.number()
      .optional()
      .default(0),
    provider: Validator.misc<Discord.Collection<string, unknown>>()
      .inherit(Discord.Collection)
      .optional(),
  }).validate({}),
);
