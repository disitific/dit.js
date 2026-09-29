module.exports = {
  name: "isString",
  run: (client, context, parsedArgs, rawArgs) => {
    const val = parsedArgs[0] !== undefined ? parsedArgs[0] : "";
    
    // Check if the value is empty or if it cannot be strictly parsed as a valid number
    return val === "" || isNaN(Number(val));
  }
};