const { createWhiteboard } = require("./boardCache.js");
const server = require("./server");

module.exports = (msg) => {
  if (msg.name) {
    createWhiteboard(msg);
  } else {
    server(msg.id);
  }
};
