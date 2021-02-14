const { connect } = require("mongodb").MongoClient;

const { NODE_ENV, MONGODB } = process.env;

const uri =
  MONGODB ||
  "mongodb://localhost:27017/iwb?authMechanism=DEFAULT&authSource=admin";

module.exports = {
  db(work, res) {
    let db;
    return connect(uri)
      .then((dbRef) => {
        db = dbRef;
        return work(db);
      })
      .then((result) => {
        res && res(null, result);
        db && db.close();
        return result;
      })
      .catch((err) => {
        console.log(err);
        db && db.close();
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
