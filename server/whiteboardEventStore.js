const { db } = require("../config.js");
const { boards, needsToCheckAccessControl } = require("../boardCache.js");
const { isAllowed } = require("./auth.js");
const { ObjectID } = require("mongodb");

/* Get a JSON array of current ids for a whiteboard or fetch a object with specified id from event store
 * req.url = "((/@username)?/whiteboard)?(/id)?"
 * */
const wesRE = /(?:\/(@(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})+))?(?:\/((?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})+))?(?:\/([a-f0-9]+))?/;

module.exports = (req, res) => {
  const e = wesRE.exec(req.url);

  if (!e) {
    res.writeHead(404);
    res.end();
    return;
  }

  let [, username, whiteboard, id] = e;

  if (!whiteboard) {
    whiteboard = "_global";
  }

  if (username) {
    whiteboard = username + "/" + whiteboard;
  }

  if (!(whiteboard in boards)) {
    res.writeHead(404);
    res.end();
    return;
  }

  Promise.resolve(
    !needsToCheckAccessControl(whiteboard, req) ||
      isAllowed(whiteboard, req, "view")
  )
    .then(allowed => {
      if (allowed) {
        if (id) {
          return db(db =>
            db.collection(whiteboard).findOne({ _id: new ObjectID(id) })
          ).then(result => {
            const json = JSON.stringify(result).replace(
              /[\u007f-\uffff]/g,
              function(c) {
                return (
                  "\\u" + ("0000" + c.charCodeAt(0).toString(16)).slice(-4)
                );
              }
            );
            res.writeHead(200, {
              "Cache-Control": "public, max-age=31536000",
              "Content-type": "application/json",
              "Content-Length": json.length
            });
            res.end(json);
          });
        } else {
          return db(
            db =>
              new Promise((resolve, reject) => {
                const cursorStream = db
                  .collection(whiteboard)
                  .find({}, { _id: 1 })
                  .stream();

                res.writeHead(200);
                cursorStream.on("error", reject);
                cursorStream.on("data", function(data) {
                  res.write(`"${data._id}"\n`);
                });
                cursorStream.on("end", function() {
                  res.end();
                  resolve();
                });
              })
          );
        }
      } else {
        res.writeHead(403);
        res.end();
      }
    })
    .catch(err => {
      console.log(err);
      res.writeHead(500);
      res.end();
    });
};
