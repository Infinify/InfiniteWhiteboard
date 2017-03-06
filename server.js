const ss = require("socketstream");
const { generate } = require("shortid");
const { Server } = require("http");

const {
  SS_PACK,
  OPENSHIFT_REDIS_HOST,
  OPENSHIFT_REDIS_PORT,
  REDIS_PASSWORD,
  PORT,
  NODE_PORT,
  NODE_IP
} = process.env;

module.exports = id => {
  if (ss.env === "production") {
    const opts = SS_PACK
      ? { all: true, keepOldFiles: true, id: generate() }
      : {};
    ss.client.packAssets(opts);
  }

  if (OPENSHIFT_REDIS_HOST) {
    const redisConf = {
      host: OPENSHIFT_REDIS_HOST,
      port: OPENSHIFT_REDIS_PORT,
      pass: REDIS_PASSWORD
    };
    ss.session.store.use("redis", redisConf);
    ss.publish.transport.use("redis", redisConf);
  } else {
    ss.session.store.use("redis");
    ss.publish.transport.use("redis");
  }

  ss.client.define("ui", {
    view: "ui.html",
    css: ["*"],
    code: [
      "libs/polymaps.js",
      "libs/spin.js",
      "libs/jquery.linkify-1.0-min.js",
      "libs/jquery.fastLiveFilter.js",
      "libs/paper.js",
      "libs/mordernizr.js",
      "libs/modernizr-pointerevents.min.js",
      "libs/uuid.js",
      "libs/history.js",
      "libs/nprogress.js",
      "libs/date.js",
      "libs/fly.js",
      "libs/sha512.js",
      "libs/fetch.js",
      "libs/encoding.js",
      "libs/chunked-request.js",
      "libs/events.js",
      "libs/superagent.js",
      "libs/throttle.js",
      "libs/indexeddbshim-UnicodeIdentifiers.js",
      "libs/dexie.js",
      "libs/classList.js",
      "libs/custom-event-polyfill.js",
      "libs/tinycolorpicker.js",
      "libs/quickconnect.js",
      "app"
    ],
    tmpl: "*"
  });

  ss.client.set({ liveReload: true });

  ss.http.route("/health", (req, res) => {
    res.writeHead(200);
    res.end();
  });

  ss.http.middleware.prepend("/robots.txt", (req, res) => {
    res.end(
      `User-agent: Twitterbot
Disallow:`
    );
  });

  ss.http.middleware.append("/_wes", require("./server/whiteboardEventStore"));

  ss.http.middleware.append("/_screen", require("./screen"));

  ss.http.middleware.append("/", require("./social"));

  ss.http.middleware.append(require("./server/middleware/rate").limit());

  ss.http.route("/", (req, res) => {
    res.serveClient("ui");
  });

  if (SS_PACK) {
    setImmediate(() => {
      process.exit(0);
    });
  }

  // Start web server
  const server = Server(ss.http.middleware);

  var port = PORT || (NODE_PORT || 3000) + id * 10;

  // TCP/IP socket IO
  server.listen(port, NODE_IP || "localhost");

  // Start SocketStream
  ss.start(server);

  const rtcServer = Server();

  rtcServer.listen(port + 100, NODE_IP || "localhost");

  require("./rtc")({ server: rtcServer, path: "/_rtc/" });
};
