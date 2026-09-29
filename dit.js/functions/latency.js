module.exports = {
  name: "latency",
  run: (client, context, args) => {
    // client.ws.ping returns the websocket heartbeat latency in milliseconds (-1 if not yet established)
    const ping = client && client.ws ? client.ws.ping : -1;
    return ping >= 0 ? ping : 0;
  }
};