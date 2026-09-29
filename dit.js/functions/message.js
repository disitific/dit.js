module.exports = {
  name: "message",
  run: (client, context, parsedArgs, rawArgs) => {
    // If an index argument was passed (e.g., $message(1)), return that specific argument
    if (parsedArgs.length > 0) {
      const index = parseInt(parsedArgs[0], 10);
      if (!isNaN(index) && index > 0) {
        // Convert 1-indexed (user-friendly) to 0-indexed array lookup
        return rawArgs[index - 1] !== undefined ? rawArgs[index - 1] : '';
      }
    }

    // If no index is provided, return all arguments joined as a single sentence
    return rawArgs ? rawArgs.join(' ') : '';
  }
};