const { db } = require("../../config.js");
const {
  createWhiteboard,
  boards,
  needsToCheckAccessControl,
} = require("../../boardCache.js");
const { getAccessibleWhiteboardsForUser, isAllowed } = require("../auth.js");
const { isWorker } = require("cluster");
const redis = require("redis");

const noop = () => {};

const logErr = (err) => err && console.error(err);

const { REDIS, SS_PACK } = process.env;
const redisConf = {
  host: REDIS,
};
let client;
let pubsub;

if (!SS_PACK) {
  client = redis.createClient(redisConf);
  pubsub = redis.createClient(redisConf);
  pubsub.psubscribe("*");
  pubsub.on("pmessage", function (pattern, channel, message) {
    if (message.slice(0, 4) === "iwb|") {
      const parts = message.split("|");
      const [, whiteboard, user] = parts;
      client.srem(`iwb|${whiteboard}`, user, noop);
    }
  });
  client.config("set", "notify-keyspace-events", "Ex", logErr);
}

const underscoreRegEx = /^_/;
exports.actions = (req, res, ss) => {
  req.use("session");
  req.use("rate.limit");

  return {
    getWhiteboardNames() {
      const publicBoards = [];
      const privateBoards = [];
      const user = req.session.userId;

      for (const board of Object.values(boards)) {
        const { owner } = board;
        if (!owner) {
          publicBoards.push(board);
        } else if (owner === user) {
          privateBoards.push(board);
        }
      }

      Promise.all([
        getAccessibleWhiteboardsForUser("anyone"),
        getAccessibleWhiteboardsForUser(req.session.userData?.username),
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

      const { userData, userId } = req.session;
      const owner = userData && userId;
      if (owner) {
        name = `@${encodeURIComponent(userData.username)}/${name}`;
      }

      const board = { name, owner };

      db((db) => {
        return Promise.all([
          name in boards,
          db.listCollections({ name }).toArray(),
          db.collection("_whiteboards").find({ name }).count(),
        ])
          .then((p) => {
            if (p[0] || p[1].length || p[2]) {
              throw new Error("Whiteboard exists");
            }

            return Promise.all([
              db.collection("_whiteboards").insertOne(board),
              db.createCollection(`chatlog_${name}`),
              db.createCollection(name),
            ]);
          })
          .then(() => {
            if (isWorker) {
              process.send(board);
            } else {
              createWhiteboard(board);
            }
            return name;
          });
      }, res);
    },
    changePosition(whiteboard, url, offset) {
      const user = req.session.userData?.username || req.session.anonymousUser;
      client.setex(`iwb|${whiteboard}|${user}`, 10 * 60, url, noop);
      ss.publish.channel(whiteboard, "newPos", { user, url, offset });
      res();
    },
    getOnlineUsers(whiteboard) {
      Promise.resolve(
        !needsToCheckAccessControl(whiteboard, req) ||
          isAllowed(whiteboard, req, "view")
      )
        .then((allowed) => {
          if (allowed) {
            whiteboard = encodeURIComponent(whiteboard);
            client.smembers(`iwb|${whiteboard}`, res);
          } else {
            res("Not allowed");
          }
        })
        .catch((err) => {
          res(err.message);
        });
    },
    changeWhiteboard(from, to) {
      let user = req.session.userData?.username || req.session.anonymousUser;
      if (from) {
        req.session.channel.unsubscribe(from);
        if (user) {
          ss.publish.channel(from, "unsub", { user });
          from = encodeURIComponent(from);
          user = encodeURIComponent(user);
          client.setex(`iwb|${from}|${user}`, 1, "false", logErr);
          client.srem(`iwb|${from}`, user, logErr);
        }
      }
      if (to) {
        Promise.resolve(
          !needsToCheckAccessControl(to, req) || isAllowed(to, req, "view")
        )
          .then((allowed) => {
            if (allowed) {
              req.session.channel.subscribe(to);
              if (user) {
                ss.publish.channel(to, "sub", { user });
                to = encodeURIComponent(to);
                user = encodeURIComponent(user);
                client.setex(`iwb|${to}|${user}`, 10 * 60, "true", logErr);
                client.sadd(`iwb|${to}`, user, logErr);
              }
            }
            res(null, allowed);
          })
          .catch((err) => {
            res(err.message);
          });
      }
    },
  };
};
