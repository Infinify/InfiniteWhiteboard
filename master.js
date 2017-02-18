const cluster = require("cluster");

const { SS_PACK, NODE_ENV } = process.env;
const production = NODE_ENV === "production";
const workers = !SS_PACK && production && require("os").cpus().length;

if (production) {
  const stopSignals = [
    "SIGHUP",
    "SIGINT",
    "SIGQUIT",
    "SIGILL",
    "SIGTRAP",
    "SIGABRT",
    "SIGBUS",
    "SIGFPE",
    "SIGUSR1",
    "SIGSEGV",
    "SIGUSR2",
    "SIGTERM"
  ];
  stopSignals.forEach(signal => {
    process.on(signal, () => {
      console.log(`Got ${signal}, stopping workers...`);
      cluster.disconnect(() => {
        console.log("All workers stopped, exiting.");
        process.exit(0);
      });
    });
  });
} else {
  cluster.on("disconnect", () => {
    process.exit(1);
  });
}

if (!workers) {
  return require("./server")(0);
}

console.log(`Starting server with ${workers} workers`);

function messageHandler(msg) {
  for (const worker of Object.values(cluster.workers)) {
    worker.send(msg);
  }
}

const workerIdToPid = [];

function setupWorker(worker, id) {
  workerIdToPid[id] = worker.process.pid;
  worker.on("message", messageHandler);
  worker.send({ id });
}

for (let i = 0; i < workers; i++) {
  setupWorker(cluster.fork(), i);
}

cluster.on("exit", (worker, code, signal) => {
  console.log(`worker exit code: ${code} signal: ${signal}`);
  setupWorker(cluster.fork(), workerIdToPid.indexOf(worker.process.pid));
});
