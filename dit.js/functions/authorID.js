module.exports = {
  name: "id",
  run: (client, context, parsedArgs, rawArgs) => {
    // If no argument is provided, return the command author's ID
    if (parsedArgs.length === 0 || !parsedArgs[0]) {
      const author = context.author || context.user;
      return author ? author.id : '';
    }

    const query = parsedArgs[0].toLowerCase().replace(/^@/, '');

    // Search in the guild's member cache if available
    if (context.guild && context.guild.members) {
      const member = context.guild.members.cache.find(m => 
        m.user.username.toLowerCase() === query || 
        m.user.tag.toLowerCase() === query || 
        m.nickname?.toLowerCase() === query ||
        m.id === query
      );
      if (member) return member.user.id;
    }

    // Fallback search in global client user cache
    const user = client.users.cache.find(u => 
      u.username.toLowerCase() === query || 
      u.tag.toLowerCase() === query ||
      u.id === query
    );
    
    return user ? user.id : '';
  }
};