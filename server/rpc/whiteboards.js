const { db } = require("../../config.js");
const { createWhiteboard, boards, needsToCheckAccessControl } = require(
  "../../boardCache.js"
);
const { getAccessibleWhiteboardsForUser, isAllowed } = require("../auth.js");
const { isWorker } = require("cluster");
const redis = require("redis");
const client = redis.createClient();
const pubsub = redis.createClient();

pubsub.psubscribe("*");
const noop = () => {};

pubsub.on("pmessage", function(pattern, channel, message) {
  if (message.slice(0, 4) === "iwb|") {
    const parts = message.split("|");
    const [iwb, whiteboard, user] = parts;
    client.srem(`iwb|${whiteboard}`, user, noop);
  }
});

const logErr = err => err && console.error(err);
client.config("set", "notify-keyspace-events", "Ex", logErr);

const underscoreRegEx = /^_/;
exports.actions = (req, res, ss) => {
  req.use("session");

  return {
    getWhiteboardNames() {
      const publicBoards = [], privateBoards = [], user = req.session.userId;

      for (const board of Object.values(boards)) {
        const { owner } = board;
        if (!owner) {
          publicBoards.push(board);
        } else if (owner === user) {
          privateBoards.push(board);
        }
      }

      Promise
        .all([
          getAccessibleWhiteboardsForUser("anyone"),
          getAccessibleWhiteboardsForUser(
            req.session.userData && req.session.userData.username
          )
        ])
        .then(([anyone, user]) => {
          res(null, { publicBoards, privateBoards, anyone, user });
        })
        .catch(res);
    },
    createWhiteboard(name) {
      if (
        name === undefined ||
          name === null ||
          name === "" ||
          underscoreRegEx.test(name)
      ) {
        return res("Invalid name");
      }

      name = encodeURIComponent(name);

      const owner = req.session.userId;
      if (owner) {
        name = `@${encodeURIComponent(req.session.userData.username)}/${name}`;
      }

      const board = { name, owner };

      db(
        db => {
          return Promise
            .all([
              name in boards,
              db.listCollections({ name }).toArray(),
              db.collection("_whiteboards").find({ name }).count()
            ])
            .then(p => {
              if (p[0] || p[1].length || p[2]) {
                throw new Error("Whiteboard exists");
              }

              return Promise.all([
                db.collection("_whiteboards").insertOne(board),
                db.createCollection(`chatlog_${name}`),
                db.createCollection(name)
              ]);
            })
            .then(() => {
              if (isWorker) {
                process.send(board);
              } else {
                createWhiteboard(board);
              }
            });
        },
        res
      );
    },
    changePosition(whiteboard, url, offset) {
      const user = req.session.userData && req.session.userData.username ||
        req.session.anonymousUser;
      client.setex(`iwb|${whiteboard}|${user}`, 10 * 60, url, noop);
      ss.publish.channel(whiteboard, "newPos", { user, url, offset });
      res();
    },
    getOnlineUsers(whiteboard) {
      Promise
        .resolve(
          !needsToCheckAccessControl(whiteboard, req) ||
            isAllowed(whiteboard, req, "view")
        )
        .then(allowed => {
          if (allowed) {
            whiteboard = encodeURIComponent(whiteboard);
            client.smembers(`iwb|${whiteboard}`, res);
          } else {
            res("Not allowed");
          }
        })
        .catch(err => {
          res(err.message);
        });
    },
    changeWhiteboard(from, to) {
      let user = req.session.userData && req.session.userData.username ||
        req.session.anonymousUser;
      if (from) {
        ss.publish.channel(from, "unsub", { user });
        req.session.channel.unsubscribe(from);
        from = encodeURIComponent(from);
        user = encodeURIComponent(user);
        client.setex(`iwb|${from}|${user}`, 1, "false", logErr);
        client.srem(`iwb|${from}`, user, logErr);
      }
      if (to) {
        Promise
          .resolve(
            !needsToCheckAccessControl(to, req) || isAllowed(to, req, "view")
          )
          .then(allowed => {
            if (allowed) {
              ss.publish.channel(to, "sub", { user });
              req.session.channel.subscribe(to);
              to = encodeURIComponent(to);
              user = encodeURIComponent(user);
              client.setex(`iwb|${to}|${user}`, 10 * 60, "true", logErr);
              client.sadd(`iwb|${to}`, user, logErr);
            }
            res(null, allowed);
          })
          .catch(err => {
            res(err.message);
          });
      }
    }
  };
};
