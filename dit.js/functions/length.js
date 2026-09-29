module.exports = {
  name: "length",
  run: (client, context, args) => {
    const input = args[0]
    if (!input) return 0;

    return input.length;
  }
};