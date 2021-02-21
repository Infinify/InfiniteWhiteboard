const { connect } = require("mongodb").MongoClient;
const isElectron = process.versions["electron"];

const { NODE_ENV, MONGODB } = process.env;
const uri = MONGODB === "true" ? "mongodb://localhost:27017/iwb" : MONGODB;

let tdb;
if (!uri) {
  const path = `${
    isElectron ? require("electron").app.getPath("userData") : "."
  }/data`;
  try {
    require("fs").mkdirSync(path);
  } catch (e) {
    console.log(e);
  }
  tdb = Promise.resolve(new (require("tingodb")().Db)(path, {}));
}

module.exports = {
  db(work) {
    let db;
    return (uri ? connect(uri) : tdb)
      .then((dbRef) => {
        db = dbRef;
        return work(db);
      })
      .then((result) => {
        db && db.close && db.close();
        return result;
      })
      .catch((err) => {
        console.log(err);
        db && db.close && db.close();
        throw err;
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
  //require("./scripts/enable_slave_debug");
  process.on("uncaughtException", (e) => {
    console.log(e);
  });
}
