const Dit = require('../dit.js'); // or local path require('./dit.js')

const bot = new Dit({
  token: '',
  prefix: '!',
  commandsFolder: './commands'
});

bot.start();