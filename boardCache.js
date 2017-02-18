const { db } = require("./config.js");

const boards = Object.create(null);
boards._global = { name: "_global" };

module.exports = {
  boards,
  init() {
    return db(db =>
      db
        .collection("_whiteboards")
        .find()
        .toArray()
        .then(res => res.forEach(this.createWhiteboard)));
  },
  createWhiteboard(whiteboard) {
    boards[whiteboard.name] = whiteboard;
  },
  needsToCheckAccessControl(whiteboard, req) {
    return whiteboard in boards &&
      boards[whiteboard].owner &&
      boards[whiteboard].owner !== req.session.userId;
  }
};
