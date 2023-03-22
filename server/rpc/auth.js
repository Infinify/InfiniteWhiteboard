const { db } = require("../../config.js");
const bcrypt = require("bcrypt");
const SALT_FACTOR = 10;

function hash(credentials) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(credentials.hash, SALT_FACTOR, (err, hash) => {
      if (err) {
        console.log(err);
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
        console.log(err);
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
    return new Promise((resolve) => {
      session.setUserId(user._id, () => resolve(true));
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
        return db
          .collection("_users")
          .find({ username: credentials.username })
          .toArray()
          .then((users) => {
            if (users.length < 1) {
              throw new Error("No user found");
            }
            const user = users[0];
            return checkHash(credentials, user).then((isMatch) => {
              if (isMatch) {
                return setUserData(user);
              }
              return isMatch;
            });
          });
      }, res);
    },
    getUserByName(username) {
      db(
        (db) =>
          db
            .collection("_users")
            .find({ username }, { username: true })
            .toArray(),
        res
      );
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
        return db
          .collection("_users")
          .find({ username })
          .count()
          .then(async (count) => {
            if (count > 0) {
              throw new Error("userExists");
            }

            const iwb = {
              username,
              hash: await hash(credentials),
              bcrypt: true,
            };
            return db
              .collection("_users")
              .insertOne(iwb)
              .then((result) => {
                setUserData({ ...iwb, _id: result.insertedId.toString() });
              });
          });
      }, res);
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
