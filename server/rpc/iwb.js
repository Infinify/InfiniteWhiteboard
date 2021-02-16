const { db } = require("../../config.js");
const { ObjectID } = require("mongodb");

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

      db((db) =>
        db.collection(whiteboard).insert(iwb, (err, result) => {
          res(err, result);
          ss.publish.channel(
            whiteboard,
            "newObject",
            (result.ops || result)[0]
          );
        })
      ).catch(res);
    },
    update(iwb) {
      if (!iwb) return res("No object");

      const whiteboard = stamp(iwb);

      iwb._parent = new ObjectID(iwb._id);
      delete iwb._id;

      db((db) =>
        db.collection(whiteboard).insert(iwb, (err, result) => {
          if (err) {
            res(err);
          } else {
            let updated = (result.ops || result)[0];
            res(null, updated);
            ss.publish.channel(whiteboard, "updateObject", updated);
          }
        })
      ).catch(res);
    },
    getNumObjects(whiteboard) {
      db((db) => db.collection(whiteboard).find().count(res)).catch(res);
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

      db((db) =>
        db.collection(`chatlog_${whiteboard}`).insert(message, res)
      ).catch(res);
    },
    getChatlog(whiteboard, limit) {
      db((db) =>
        db
          .collection(`chatlog_${whiteboard}`)
          .find({})
          .limit(limit)
          .sort({ timeStamp: -1 })
          .toArray((err, result = []) => res(err, result))
      ).catch(res);
    },
  };
};
