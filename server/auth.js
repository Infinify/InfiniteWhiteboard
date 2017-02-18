const { db } = require("../config.js");

const allowedRoles = {
  view: { view: true, chat: true, edit: true, admin: true },
  chat: { chat: true, edit: true, admin: true },
  edit: { edit: true, admin: true },
  admin: { admin: true }
};

function acl(query, res) {
  return db(db => db.collection("_acl").find(query).toArray(), res);
}

function isAllowed(username, resource, requestedRole) {
  return acl({ username, resource }).then(
    res =>
      res && res.length && allowedRoles[requestedRole][res[0].role] === true
  );
}

module.exports = {
  setUserRole(resource, username, role, res) {
    if (!allowedRoles.hasOwnProperty(role)) {
      return res(`Unrecognized role: ${role}`);
    }
    db(
      db => {
        return Promise
          .resolve(
            username === "anyone" ||
              db.collection("_users").find({ username }).count()
          )
          .then(user => {
            if (!user) {
              throw new Error(`User does not exist ${username}`);
            }

            return db
              .collection("_acl")
              .updateOne({ username, resource }, { username, resource, role }, {
                safe: true,
                upsert: true
              });
          });
      },
      res
    );
  },
  removeUserRoles(resource, username, res) {
    db(db => db.collection("_acl").deleteOne({ username, resource }), res);
  },
  isAllowed(resource, req, role) {
    if (!allowedRoles.hasOwnProperty(role)) {
      throw new Error(`Unrecognized role: ${role}`);
    }
    return Promise
      .resolve(req.session.userData && req.session.userData.username)
      .then(username => {
        return username && isAllowed(username, resource, role);
      })
      .then(allowed => {
        return allowed || isAllowed("anyone", resource, role);
      });
  },
  getUsersAndPermissions(resource, callback) {
    acl({ resource }, callback);
  },
  getAccessibleWhiteboardsForUser(username) {
    return username ? acl({ username }) : [];
  }
};
