const { db } = require("../../config.js");
const {
  createWhiteboard,
  boards,
  needsToCheckAccessControl,
} = require("../../boardCache.js");
const { getAccessibleWhiteboardsForUser, isAllowed } = require("../auth.js");
const {
  storeUserPosition,
  getOnlineUsers,
  removeUserFromWhiteboard,
  addUserToWhiteboard,
} = require("../onlineUsers.js");
const { isWorker } = require("cluster");

const underscoreRegEx = /^_/;

const p = (f) =>
  new Promise((resolve, reject) => {
    f((err, result) => (err ? reject(err) : resolve(result)));
  });

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

      const username = req.session.userData && req.session.userData.username;
      Promise.all([
        getAccessibleWhiteboardsForUser("anyone"),
        getAccessibleWhiteboardsForUser(username),
      ])
        .then((result) => {
          const [anyone, user] = result;
          res(null, {
            publicBoards,
            privateBoards,
            anyone,
            user,
          });
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
        name = `@${encodeURIComponent(
          req.session.userData?.username || owner
        )}_${name}`;
      }

      const board = { name, owner };

      db((db) => {
        return Promise.all([
          name in boards,
          db.listCollections
            ? db.listCollections({ name }).toArray()
            : p((c) => db.collectionNames({ namesOnly: 1 }, c)),
          new Promise((resolve, reject) =>
            db
              .collection("_whiteboards")
              .find({ name })
              .count((err, count) => (err ? reject(err) : resolve(count)))
          ),
        ])
          .then((all) => {
            const found = all[1].find((board) => board === name) !== -1;
            if (all[0] || found || all[2]) {
              throw new Error("Whiteboard exists");
            }

            return Promise.all([
              p((c) => db.collection("_whiteboards").insert(board, c)),
              p((c) => db.createCollection(`chatlog_${name}`, c)),
              p((c) => db.createCollection(name, c)),
            ]);
          })
          .then(() => {
            if (isWorker) {
              process.send(board);
            } else {
              createWhiteboard(board);
            }
            res(null, name);
          });
      }).catch((e) => res(e));
    },
    changePosition(whiteboard, url, offset) {
      const user =
        (req.session.userData && req.session.userData.username) ||
        req.session.anonymousUser;
      storeUserPosition(whiteboard, user, url);
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
            getOnlineUsers(whiteboard, res);
          } else {
            res("Not allowed");
          }
        })
        .catch((err) => {
          res(err.message);
        });
    },
    changeWhiteboard(from, to) {
      let user =
        (req.session.userData && req.session.userData.username) ||
        req.session.anonymousUser;
      if (from) {
        req.session.channel.unsubscribe(from);
        if (user) {
          ss.publish.channel(from, "unsub", { user });
          from = encodeURIComponent(from);
          user = encodeURIComponent(user);
          removeUserFromWhiteboard(from, user);
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
                addUserToWhiteboard(to, user);
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
