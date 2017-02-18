const { setUserRole, removeUserRoles, getUsersAndPermissions } = require(
  "../auth.js"
);

exports.actions = (req, res) => {
  req.use("session");
  req.use("authorized.check");

  return {
    setUserRole(whiteboard, userName, role) {
      setUserRole(whiteboard, userName, role, res);
    },
    removeUserRoles(whiteboard, userName) {
      removeUserRoles(whiteboard, userName, res);
    },
    getUsersAndPermissions(whiteboard) {
      getUsersAndPermissions(whiteboard, res);
    }
  };
};
