const { isWorker, isMaster } = require("cluster");

if (isWorker) {
  process.on("message", require("./worker"));
}

require("./boardCache.js")
  .init()
  .then(
    () => {
      if (isMaster) {
        require("./master");
      }
    },
    err => {
      console.log(err);
      process.exit(1);
    }
  );
