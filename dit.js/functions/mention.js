module.exports = {
  name: "mention",
  run: (client, context, parsedArgs, rawArgs) => {
    let users = [];

    // Extract mentioned users from message context if available
    if (context.mentions && context.mentions.users) {
      users = Array.from(context.mentions.users.values());
    }

    if (users.length === 0) return '';

    // If an index was passed (e.g., $mention(1)), return that specific mention
    if (parsedArgs.length > 0) {
      const index = parseInt(parsedArgs[0], 10);
      if (!isNaN(index) && index > 0) {
        const targetUser = users[index - 1];
        return targetUser ? `${targetUser.id}` : '';
      }
    }

    // If no index is provided, return all mentions joined by spaces
    return users.map(u => `${u.id}`).join(' ');
  }
};