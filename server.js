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
    css: ["style.css", "ui.css", "toolbar/", "libs/", "chat.css", "font.css"],
    code: [
      "libs/jquery.js",
      "libs/polymaps.js",
      "libs/spin.js",
      "libs/jquery-ui.js",
      "libs/jquery.ui.touch-punch.js",
      "libs/jquery.linkify-1.0-min.js",
      "libs/jquery.transform2d.js",
      "libs/jquery.fastLiveFilter.js",
      "libs/load-image.all.min.js",
      "libs/saveimages.js",
      "libs/paper.js",
      "libs/mordernizr.js",
      "libs/modernizr-pointerevents.min.js",
      "libs/uuid.js",
      "libs/history.js",
      "libs/nprogress.js",
      "libs/date.js",
      "libs/fly.js",
      "libs/spectrum.js",
      "libs/jquery.elastic.source.js",
      "libs/sha512.js",
      "libs/encoding.js",
      "libs/chunked-request.js",
      "libs/events.js",
      "libs/superagent.js",
      "libs/throttle.js",
      "libs/indexeddbshim-UnicodeIdentifiers.js",
      "libs/dexie.js",
      "libs/classList.js",
      "app/toolbar/acl.js",
      "app/toolbar/chat.js",
      "app/toolbar/login.js",
      "app/toolbar/whiteboards.js",
      "app/toolbar/timeline.js",
      "app/toolbar/pencil.js",
      "app/toolbar/shapes.js",
      "app/toolbar/places.js",
      "app/toolbar/text.js",
      "app/toolBar.js",
      "app/contentEditable.js",
      "app/drawToolHandler.js",
      "app/loadWhiteboard.js",
      "app/timeMachine.js",
      "app/paperTools.js",
      "app/polymaps.js",
      "app/mfs.js",
      "app/entry.js"
    ],
    tmpl: "*"
  });

  ss.client.set({ liveReload: true });

  ss.http.route("/health", (req, res) => {
    res.writeHead(200);
    res.end();
  });

  ss.http.middleware.append("/_wes", require("./server/whiteboardEventStore"));

  ss.http.route("/", (req, res) => {
    res.serveClient("ui");
  });

  // Code Formatters
  ss.client.formatters.add(require("ss-stylus"));

  // Use server-side compiled Hogan (Mustache) templates. Others engines available
  ss.client.templateEngine.use(require("ss-hogan"));

  if (SS_PACK) {
    setImmediate(() => {
      process.exit(0);
    });
  }

  // Start web server
  const server = Server(ss.http.middleware);

  // TCP/IP socket IO
  server.listen(PORT || (NODE_PORT || 3000) + id * 10, NODE_IP || "localhost");

  // Start SocketStream
  ss.start(server);
};
