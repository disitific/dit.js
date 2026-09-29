module.exports = {
  name: "roundUp",
  run: (client, context, args) => {
    const val = parseFloat(args[0]);
    if (isNaN(val)) return '0';
    return Math.ceil(val);
  }
};