var rps = {};
// Reset request per second tracking every second
setInterval(
  function resetTrackers() {
    rps = {};
  },
  1000
);

var warned = {};
// Reset warned connections every minute
setInterval(
  function resetWarned() {
    warned = {};
  },
  60 * 1000
);

var msg = "Too Many Requests";

var maxRequestsPerSecond = 100;
function check(id, res) {
  if (id) {
    if (!rps[id]) rps[id] = 0;
    var count = ++rps[id];
    if (count > maxRequestsPerSecond) {
      if (!warned[id]) {
        warned[id] = true;
        if (res.end) {
          res.statusCode = 429;
          res.end(msg);
        } else {
          res(msg);
        }
      }
      console.log(msg, id, count);
      return false;
    }
  }
  return true;
}

exports.limit = function rateLimit() {
  return function checkRateLimit(req, res, next) {
    if (
      check(req.sessionID, res) &&
        check(req.socketId, res) &&
        check(req.sessionId, res)
    ) {
      next();
    }
  };
};
