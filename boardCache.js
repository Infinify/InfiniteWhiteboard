const { db } = require("./config.js");

const boards = Object.create(null);
boards._global = { name: "_global" };
const { SS_PACK } = process.env;

module.exports = {
  boards,
  init() {
    if (SS_PACK) {
      return Promise.resolve();
    }
    return db(db =>
      db
        .collection("_whiteboards")
        .find()
        .toArray((err, res) => res && res.forEach(this.createWhiteboard))
    );
  },
  createWhiteboard(whiteboard) {
    boards[whiteboard.name] = whiteboard;
  },
  needsToCheckAccessControl(whiteboard, req) {
    return (
      whiteboard in boards &&
      boards[whiteboard].owner &&
      boards[whiteboard].owner !== req.session.userId
    );
  }
};
