const { MongoClient } = require("mongodb");

const { NODE_ENV, MONGODB } = process.env;

const uri =
  MONGODB ||
  "mongodb://root:iwb@localhost:27017/?authMechanism=DEFAULT&authSource=admin";

module.exports = {
  db(work, res) {
    const client = new MongoClient(uri);
    const db = client.db("iwb");
    return Promise.resolve()
      .then(() => {
        return work(db);
      })
      .then((result) => {
        res?.(null, result);
        client.close();
        return result;
      })
      .catch((err) => {
        console.log(err);
        client.close();
        if (res) {
          res(err.message);
        } else {
          throw err;
        }
      });
  },
};

if (NODE_ENV === "production") {
  const buffer = require("log-buffer");
  buffer(4096, () => {
    return `${new Date().toISOString()}: `;
  });
  setInterval(() => {
    buffer.flush();
  }, 5000);
} else {
  require("./scripts/enable_slave_debug");
  process.on("uncaughtException", (e) => {
    console.log(e);
  });
}
