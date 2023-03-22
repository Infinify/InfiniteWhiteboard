const { db } = require("../../config.js");
const { ObjectId } = require("mongodb");

exports.actions = (req, res, ss, stream) => {
  req.use("session");
  req.use("rate.limit");
  req.use("authorized.check");

  function stamp(iwb) {
    iwb.timestamp = new Date();
    iwb.session = req.session.id;
    return iwb.whiteboard;
  }

  return {
    send(iwb) {
      if (!iwb) return res("No object");

      const whiteboard = stamp(iwb);

      db((db) => db.collection(whiteboard).insertOne(iwb), res).then(
        (result) => {
          ss.publish.channel(whiteboard, "newObject", {
            ...iwb,
            _id: result.insertedId.toString(),
          });
        }
      );
    },
    update(iwb) {
      if (!iwb) return res("No object");

      const whiteboard = stamp(iwb);

      iwb._parent = new ObjectId(iwb._id);
      delete iwb._id;

      db((db) => db.collection(whiteboard).insertOne(iwb), res).then(
        (result) => {
          ss.publish.channel(whiteboard, "updateObject", {
            ...iwb,
            _id: result.insertedId.toString(),
          });
        }
      );
    },
    getNumObjects(whiteboard) {
      db((db) => db.collection(whiteboard).find().count(), res);
    },
    streamObjects(whiteboard, begin) {
      db(
        (db) =>
          new Promise((resolve, reject) => {
            const cursorStream = db
              .collection(whiteboard)
              .find()
              .skip(begin)
              .stream();
            cursorStream.pipe(stream);
            cursorStream.on("end", resolve);
            cursorStream.on("error", reject);
          })
      );
    },
    sendMessage(message) {
      if (!message) return res("No object");

      const whiteboard = stamp(message);

      ss.publish.channel(whiteboard, "newMessage", message);

      db(
        (db) => db.collection(`chatlog_${whiteboard}`).insertOne(message),
        res
      );
    },
    getChatlog(whiteboard, limit) {
      db(
        (db) =>
          db
            .collection(`chatlog_${whiteboard}`)
            .find({})
            .limit(limit)
            .sort({ timeStamp: -1 })
            .toArray(),
        res
      );
    },
  };
};
