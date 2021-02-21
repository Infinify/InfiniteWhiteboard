const { REDIS, SS_PACK } = process.env;

function redisFactory() {
  const redis = require("redis");

  const noop = () => {};

  const logErr = (err) => err && console.error(err);

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

  function storeUserPosition(whiteboard, user, url) {
    client.setex(`iwb|${whiteboard}|${user}`, 10 * 60, url, noop);
  }

  function getOnlineUsers(whiteboard, res) {
    client.smembers(`iwb|${whiteboard}`, res);
  }

  function removeUserFromWhiteboard(from, user) {
    client.setex(`iwb|${from}|${user}`, 1, "false", logErr);
    client.srem(`iwb|${from}`, user, logErr);
  }

  function addUserToWhiteboard(to, user) {
    client.setex(`iwb|${to}|${user}`, 10 * 60, "true", logErr);
    client.sadd(`iwb|${to}`, user, logErr);
  }

  return {
    storeUserPosition,
    getOnlineUsers,
    removeUserFromWhiteboard,
    addUserToWhiteboard,
  };
}

function plainFactory() {
  const wbs = new Map();
  const wb = (whiteboard) => {
    const wb = wbs.get(whiteboard);
    if (wb) {
      return wb;
    } else {
      const wb = new Map();
      wbs.set(whiteboard, wb);
      return wb;
    }
  };

  function storeUserPosition(whiteboard, user, url) {
    wb(whiteboard).set(user, { t: Date.now(), url });
  }

  function getOnlineUsers(whiteboard, res) {
    let board = wb(whiteboard);
    let limit = Date.now() - 10 * 60 * 1000;
    board.forEach((value, key) => {
      if (value.t < limit) {
        board.delete(key);
      }
    });
    res(null, Array.from(board.keys()));
  }

  function removeUserFromWhiteboard(from, user) {
    wb(from).delete(user);
  }

  function addUserToWhiteboard(to, user) {
    wb(to).set(user, { t: Date.now(), url: "" });
  }

  return {
    storeUserPosition,
    getOnlineUsers,
    removeUserFromWhiteboard,
    addUserToWhiteboard,
  };
}

module.exports = REDIS ? redisFactory() : plainFactory();
