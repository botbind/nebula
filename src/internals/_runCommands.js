module.exports = async function _runCommands(message, name, args, commands) {
  commands = commands.filter(command => command.name === name || command.alias.includes(name));

  if (commands.length === 0) return true;

  for (const command of commands) command.run(message, args);
};
