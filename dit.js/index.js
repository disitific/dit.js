const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const parseDitFile = require('./parser');
const { executeCommand } = require('./executor');

class Dit {
  constructor(options) {
    if (!options || !options.token) {
      throw new Error('[dit.js] A bot token must be provided in the options.');
    }

    this.token = options.token;
    this.prefix = options.prefix || '!';
    this.commandsPath = path.resolve(options.commandsFolder || './commands');

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ]
    });

    this.textCommands = new Map();
    this.slashCommands = new Map();
    this.slashCommandsData = [];
    this.inlineFunctions = new Map();

    this._loadInlineFunctions();
  }

  _loadInlineFunctions() {
    const funcsDir = path.join(__dirname, 'functions');
    if (!fs.existsSync(funcsDir)) return;

    const files = fs.readdirSync(funcsDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
      const fn = require(path.join(funcsDir, file));
      if (fn.name && typeof fn.run === 'function') {
        this.inlineFunctions.set(fn.name, fn.run);
      }
    }
  }

  async start() {
    if (fs.existsSync(this.commandsPath)) {
      const files = fs.readdirSync(this.commandsPath).filter(f => f.endsWith('.dit.js'));
      for (const file of files) {
        const filePath = path.join(this.commandsPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Parse .dit.js file into structured JSON command objects
        const parsedCommands = parseDitFile(content);

        for (const cmd of parsedCommands) {
          const primaryName = cmd.name.toLowerCase();

          if (cmd.isSlash) {
            this.slashCommands.set(primaryName, cmd);
            if (cmd.aliases && Array.isArray(cmd.aliases)) {
              for (const alias of cmd.aliases) {
                this.slashCommands.set(alias.toLowerCase(), cmd);
              }
            }

            this.slashCommandsData.push({
              name: primaryName,
              description: cmd.description || `Command ${cmd.name}`
            });
          } else {
            this.textCommands.set(primaryName, cmd);
            if (cmd.aliases && Array.isArray(cmd.aliases)) {
              for (const alias of cmd.aliases) {
                this.textCommands.set(alias.toLowerCase(), cmd);
              }
            }
          }
        }
      }
    }

    this.client.on('clientReady', async () => {
      console.log(`[dit.js] Logged in successfully as ${this.client.user.tag}!`);

      //if (this.slashCommandsData.length > 0) {
        const rest = new REST({ version: '10' }).setToken(this.token);
        try {
          console.log('[dit.js] Registering application slash commands...');
          await rest.put(
            Routes.applicationCommands(this.client.user.id),
            { body: this.slashCommandsData }
          );
          console.log('[dit.js] Slash commands successfully registered.');
        } catch (error) {
          console.error('[dit.js] Failed to register slash commands:', error);
        }
      //}
    });

    this.client.on('messageCreate', async (message) => {
      if (message.author.bot || !message.content.startsWith(this.prefix)) return;

      const args = message.content.slice(this.prefix.length).trim().split(/ +/);
      const commandName = args.shift().toLowerCase();

      const command = this.textCommands.get(commandName);
      if (!command) return;

      message.isCommand = false;
      await executeCommand(this.client, command, message, args, this.inlineFunctions);
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const commandName = interaction.commandName.toLowerCase();
      const command = this.slashCommands.get(commandName);
      if (!command) return;

      interaction.isCommand = true;
      await executeCommand(this.client, command, interaction, [], this.inlineFunctions);
    });

    await this.client.login(this.token);
  }
}

module.exports = Dit;