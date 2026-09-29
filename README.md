# dit.js 🦥
A library created to build simple discord bots.

## What is dit.js?
dit.js allows you to use similar syntaxes to create simple discord bots with speed. 

## Getting started ↙️
Set up your main file `(index.js)`

```js
const Dit = require('dit2.js');

const bot = new Dit({
  token: 'YOUR BOT TOKEN',
  prefix: '!', //<-- Specify a prefix for your bot
  commandsFolder: './commands' //<-- Folder where your .dit.js files are located
});

bot.start();
```

## The commands folder 📂
We need to create a folder where we can put our glorious .dit.js files so dit.js can read them and execute your commands.

This is how it's supposed to look like:
```
.
├── commands/
│   ├── maincommands.dit.js
│   └── othercommands.dit.js
└── index.js
```

### Adding commands to your folder
```
new command ping
    reply "Pong!"
```

You don't need to add anything else into your files. Just dit.js :)

#### Add multiple commands
```
new command ping, pong
  reply "Pong!"
  add reaction "👋"

new command embedtest, embed
  reply
    new Embed
      set title "Test title"
      set description "This is a test embed. $latency"
      set footer "Hey!"
      set timestamp //<-- comments are fully supported!

new command inlinefunctions,abc
  reply "This is an inline function command and my latency is $roundUp($latency) ms."


new command echo
    if "$length($message)" < "1"
        reply "Provide something to be echoed!"
    else
        reply "$message"

new command choice
  if "$message(1)" is "embed"
    reply
      new Embed
        set title "You chose the embed message!"
  else if "$message(1)" isnt "embed" and "$message(1)" is "message"
    reply "you chose a boring message."
  else
    reply "please choose either embed or message!"

new command isstring
    if "$length($message)" < "1"
        reply "Provide something to be tested!"
    else
        reply "$isString($message)"

new command id
    if "$length($mention(1))" < "1" and "$length($message(1))" < "1"
        reply "$id" //<-- if no id or username was provided, return the id of the user that ran the command
    else if "$length($message(1))" > "1" and "$length($mention(1))" < "1"
        reply "$id($message(1))" //<-- if an username is provided, try to find the id that belongs to that user
    else
        reply "$mention(1)" //<-- get the id of the mentioned user

new slashcommand test //<-- slash commands!
    reply ephemeral <-- ephemeral: message only visible to the user that used the command 👀
        new Embed
            set title "hi"
```

# NOTICE
If you used dit.js before, the syntax change is there to allow me to add more complicated things to this library.

This package is really new, expect issues!
### More features and documentation soon!