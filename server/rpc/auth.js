const { db } = require("../../config.js");
const bcrypt = require("bcrypt");
const SALT_FACTOR = 10;

function hash(credentials) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(credentials.hash, SALT_FACTOR, (err, hash) => {
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });
}

function compare(credentials, user) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(credentials.hash, user.hash, (err, isMatch) => {
      if (err) {
        reject(err);
      } else {
        resolve(isMatch);
      }
    });
  });
}

function updateUserHash(credentials, user) {
  return hash(credentials).then((hash) => {
    user.hash = hash;
    user.bcrypt = true;

    return db((db) =>
      db.collection("_users").updateOne({ _id: user._id }, user)
    );
  });
}

function checkHash(credentials, user) {
  return compare(credentials, user).then((isMatch) => {
    if (!isMatch && !user.bcrypt && credentials.hash === user.hash) {
      isMatch = Boolean(updateUserHash(credentials, user));
    }

    return isMatch;
  });
}

exports.actions = (req, res) => {
  req.use("session");
  req.use("rate.limit");

  function setUserData(user) {
    const session = req.session;
    session.authenticated = true;
    session.userData = user;
    return new Promise((resolve, reject) => {
      session.setUserId(user._id, (err) => (err ? reject(err) : resolve(true)));
    });
  }

  return {
    logout() {
      const session = req.session;
      session.authenticated = false;
      session.userData = false;
      session.anonymousUser = `user_${Math.random()
        .toString(36)
        .substring(12)}`;
      session.setUserId(session.anonymousUser, function () {
        res();
      });
    },
    login(credentials) {
      db((db) => {
        return new Promise((resolve, reject) =>
          db
            .collection("_users")
            .find({ username: credentials.username })
            .toArray((err, users) => {
              if (err || users.length < 1) {
                reject(err || "No user found");
                return;
              }
              const user = users[0];
              checkHash(credentials, user).then((isMatch) => {
                isMatch ? setUserData(user).then(resolve) : resolve(false);
              });
            })
        );
      })
        .then((isMatch) => res(null, isMatch))
        .catch(res);
    },
    getUserByName(username) {
      db((db) =>
        db
          .collection("_users")
          .find({ username }, { username: true })
          .toArray(res)
      ).catch(res);
    },
    register(credentials) {
      if (!credentials) {
        return res("Invalid input");
      }
      const { username } = credentials;
      if (username === "anyone") {
        return res("userExists");
      }

      db((db) => {
        return new Promise((resolve, reject) =>
          db
            .collection("_users")
            .find({ username })
            .count((err, count) => {
              if (err || count > 0) {
                reject("userExists");
                return;
              }

              hash(credentials)
                .then((hash) => {
                  const user = { username, hash, bcrypt: true };
                  db.collection("_users").insert(user, (err, result) => {
                    err
                      ? reject(err)
                      : setUserData(((result && result.ops) || result)[0])
                          .then(resolve)
                          .catch(reject);
                  });
                })
                .catch(reject);
            })
        );
      })
        .then((result) => res(null, result))
        .catch(res);
    },
    getUserObject() {
      const session = req.session;
      if (session.userData) {
        res(null, {
          id: session.userId,
          username: session.userData.username,
          anonymous: session.anonymousUser,
          sessionId: session.id,
        });
      } else {
        if (!session.anonymousUser) {
          session.anonymousUser = `user_${Math.random()
            .toString(36)
            .substring(12)}`;
          session.setUserId(session.anonymousUser, () => {
            res(null, {
              anonymous: session.anonymousUser,
              sessionId: session.id,
            });
          });
        } else {
          res(null, {
            anonymous: session.anonymousUser,
            sessionId: session.id,
          });
        }
      }
    },
  };
};
