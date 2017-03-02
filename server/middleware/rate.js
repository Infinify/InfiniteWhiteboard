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

// Limit to ten rps
var maxRequestsPerSecond = 10;
function check(id, res) {
  if (id) {
    if (!rps[id]) rps[id] = 0;
    if (++rps[id] > maxRequestsPerSecond) {
      if (!warned[id]) {
        warned[id] = true;
        res = res.end || res;
        res("Request dropped by rate limiter");
      }
      return false;
    }
  }
  return true;
}

exports.limit = function rateLimit() {
  return function checkRateLimit(req, res, next) {
    if (check(req.sessionID, res) && check(req.socketId, res) && check(req.sessionId, res)) {
      next();
    }
  };
};
