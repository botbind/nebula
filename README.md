# Nebula 🌌👾

## A lifeycle based Discord bot framework, influenced by ReactJS, completely customisable and modular!

<p align="center"><img src="https://raw.githubusercontent.com/botbind/nebula/master/assets/logo.png" /></p>

### What? Another discord bot framework? 😕

Yes, we know. Another framework. New things to learn yet new experiences as well. Unlike other bot frameworks like `klasa` or `discord.js-commando`, we focus on how to keep the framework as minimal as possible, yet still give the developers **better** abilities to create their dream bots.

Right from the start, our team has planned on ways to minimalise other frameworks' features while still leverage those at the same time. Nebula is heavily influenced by [React's lifecycle](https://reactjs.org/docs/state-and-lifecycle.html) concepts, which in short terms mean methods that can be fired at different stages in a bot's life. A typical command might look like:

```javascript
const { Command } = require('@botbind/nebula');

module.exports = class MyCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'my-command',
      alias: ['my-alias'],
    });
  }

  didDispatch(message) {
    message.channel.send('Hi, it works!');
  }
};
```

#### Wait!!! Before we move on, what's up with the name?

Nebula is the earliest stage of a star, a collection of dust and gases. We believe that your imaginations are just like those little particles in the universe, when put together correctly, with the right aid and support, they're gonna shine and excel!

### But I'm not convinced. Give me more features please! 😔

#### Addons 🔨🔧

Our framework leverages the idea of addons. They are small pieces of 'app', ranging from one silly command to a full-blown music module. Completely compatible with our botbind hosting service.

#### Ease of argument validation and parsing ❌✔️❌❌

`klasa` leverages usage string to allow developers to define their own arguments. One caveat is that it's hard to read and maintain. We, on the other hand, implemented a more intuitive way that uses arrays to validate arguments, making code maintenance a piece of cake.

#### Completely customisable ✏️ 📏✂️

Less doesn't mean worse in this case. Your addon can still be yours. Want a more dynamic way to validating arguments? Just extend the `Validator` class and you will have the full power. Want the messages to be parsed in your way? Just implement `Addon.parseCommands()`. Honestly, there are so many things you can do, and we don't want to limit your imagination.

#### Strongly typed ☑️

Our code, unlike other frameworks, are written entirely in Typescript, allowing easier Typescript usage and safe code. Feel free to try it out!

### Sounds good, show me some code please! 💘

Here you go

```javascript
// index.js
const { Client, Addon } = require('@botbind/nebula');

class MyClient extends Client {
  ready() {
    this.user.setActivity("Hello, I'm ready");
  }
}

class MyAddon extends Addon {
  constructor(client) {
    super(client, {
      name: 'test-addon',
      baseDir: __dirname,
      folderName: {
        commands: 'command',
        tasks: 'scheduledTasks',
      },
    });
  }
}

const client = new MyClient({ debug: true });

client.load(MyAddon).login(/* your token */);

// commands/SayHi.js
const Discord = require('discord.js');
const { Command } = require('@botbind/nebula');

module.exports = class SayHi extends Command {
  constructor(client) {
    super(client, {
      name: 'test',
      alias: ['t'],
      schema: [Validator.any],
    });
  }

  async didDispatch(message, [name]) {
    message.channel.send(`Hi, ${name}`);
  }
};
```

Ah ha, looks pretty clean doesn't it? For Typescripters:

```typescript
// index.ts
const { Client, Addon } = require('@botbind/nebula');

class MyClient extends Client {
  ready() {
    this.user.setActivity("Hello, I'm ready");
  }
}

class MyAddon extends Addon {
  constructor(client: Client) {
    super(client, {
      name: 'test-addon',
      baseDir: __dirname,
      folderName: {
        commands: 'command',
        tasks: 'scheduledTasks',
      },
    });
  }
}

const client = new MyClient({ debug: true });

client.load(MyAddon).login(/* your token */);

// commands/SayHi.ts
const Discord = require('discord.js');
const { Command, Client } = require('@botbind/nebula');

module.exports = class SayHi extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'test',
      alias: ['t'],
      schema: [Validator.any],
    });
  }

  async didDispatch(message: Discord.Message, [name]: string[]) {
    message.channel.send(`Hi, ${name}`);
  }
};
```
