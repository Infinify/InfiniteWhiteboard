const cluster = require("cluster");

if (cluster.isMaster) {
  const DEBUG_BRK = "--debug-brk=", fixedExecArgv = [];

  let modified = false;

  for (let execArg of Object.values(process.execArgv)) {
    if (execArg.indexOf(DEBUG_BRK) === 0) {
      const port = parseInt(execArg.substring(DEBUG_BRK.length), 10);
      if (port !== null) {
        execArg = DEBUG_BRK + (port + 1);
        modified = true;
      }
    }

    fixedExecArgv.push(execArg);
  }

  if (modified) {
    cluster.setupMaster({ execArgv: fixedExecArgv });
  }
}
