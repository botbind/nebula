const Discord = require('discord.js');

// Response editing
Discord.Structures.extend('Message', DjsMessage => {
  return class Message extends DjsMessage {};
});

// Providers
Discord.Structures.extend('Guild', DjsGuild => {
  return class Guild extends DjsGuild {};
});
