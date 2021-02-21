const { db } = require("../config.js");

const allowedRoles = {
  view: { view: true, chat: true, edit: true, admin: true },
  chat: { chat: true, edit: true, admin: true },
  edit: { edit: true, admin: true },
  admin: { admin: true },
};

function acl(query) {
  return new Promise((resolve, reject) => {
    db((db) =>
      db
        .collection("_acl")
        .find(query)
        .toArray((err, result) => (err ? reject(err) : resolve(result)))
    ).catch(reject);
  });
}

function isAllowed(username, resource, requestedRole) {
  return acl({ username, resource }).then(
    (res) =>
      res && res.length && allowedRoles[requestedRole][res[0].role] === true
  );
}

module.exports = {
  setUserRole(resource, username, role, res) {
    if (!Object.hasOwnProperty.call(allowedRoles, role)) {
      res(`Unrecognized role: ${role}`);
    }
    db((db) => {
      return new Promise((resolve, reject) => {
        db.collection("_users")
          .find({ username })
          .count((err, count) => {
            const isAnyone = username === "anyone";
            if (err || (!isAnyone && count === 0)) {
              reject(err || `User does not exist ${username}`);
              return;
            }

            db.collection("_acl").update(
              { username, resource },
              { username, resource, role },
              {
                safe: true,
                upsert: true,
              },
              (err, result) => (err ? reject(err) : resolve(result))
            );
          });
      });
    })
      .then((result) => res(null, result))
      .catch(res);
  },
  removeUserRoles(resource, username, res) {
    db((db) => db.collection("_acl").remove({ username, resource }, res));
  },
  isAllowed(resource, req, role) {
    if (!Object.hasOwnProperty.call(allowedRoles, role)) {
      throw new Error(`Unrecognized role: ${role}`);
    }
    return Promise.resolve(
      req.session.userData && req.session.userData.username
    )
      .then((username) => {
        return username && isAllowed(username, resource, role);
      })
      .then((allowed) => {
        return allowed || isAllowed("anyone", resource, role);
      });
  },
  getUsersAndPermissions(resource, callback) {
    acl({ resource })
      .then((res) => callback(null, res))
      .catch(callback);
  },
  getAccessibleWhiteboardsForUser(username) {
    return username ? acl({ username }) : [];
  },
};
