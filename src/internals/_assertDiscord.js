const assert = require('@botbind/dust/src/assert');
const Discord = require('discord.js');

module.exports = {
  message: (methodName, message) =>
    assert(
      message instanceof Discord.Message,
      'The parameter message for',
      methodName,
      'must be a valid message',
    ),
};
