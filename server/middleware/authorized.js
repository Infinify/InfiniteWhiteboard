const { boards, needsToCheckAccessControl } = require("../../boardCache"),
  { isAllowed } = require("../auth");

const role = {
  "iwb.send": "edit",
  "iwb.update": "edit",
  "iwb.streamObjects": "view",
  "iwb.getNumObjects": "view",
  "iwb.sendMessage": "chat",
  "iwb.getChatlog": "chat",
  "acl.setUserRole": "admin",
  "acl.removeUserRoles": "admin",
  "acl.getUsersAndPermissions": "admin"
};

exports.check = () => (req, res, next) => {
  let whiteboard = req.params[0];
  if (whiteboard && whiteboard.whiteboard) {
    whiteboard = whiteboard.whiteboard;
  }
  if (!whiteboard in boards) {
    return res("404 Not Found");
  }

  Promise
    .resolve(
      !needsToCheckAccessControl(whiteboard, req) ||
        isAllowed(whiteboard, req, role[req.method])
    )
    .then(allowed => {
      if (allowed) {
        next();
      } else {
        console.log("Access not allowed", whiteboard, req);
        res("403 Forbidden");
      }
    })
    .catch(err => {
      res(err);
    });
};
