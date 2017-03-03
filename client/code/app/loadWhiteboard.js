var data = Object.create(null);
var dbs = Object.create(null);
minTime = +new Date();
maxTime = 0;

function prepareObject(o) {
  var d = +new Date(o.timestamp);
  var whiteboard = o.whiteboard;
  var wb = data[whiteboard];
  var _parent = o._parent;
  var _id = o._id;
  o.timestamp = d;

  if (_parent) {
    var parent = wb[_parent];
    if (parent) {
      while (parent.next && parent.next._id !== _id) {
        parent = parent.next;
      }
      parent.next = o;
      o.parent = parent;
    }
  }

  drawObject(o);

  minTime = Math.min(minTime, d) || minTime;
  maxTime = Math.max(maxTime, d) || maxTime;
}

function handleUpdate(iwb) {
  var whiteboard = iwb.whiteboard;
  var wb = data[whiteboard] = data[whiteboard] || [];
  var db = dbs[whiteboard];
  var object = Object.create(iwb);

  wb.count = wb.count + 1 || 1;
  wb[object._id] = object;
  wb.push(object);

  prepareObject(object);

  if (db) {
    db.iws.add(iwb).catch(function(err) {
      console.log(err);
    });
    var root = "/_wes/" + whiteboard + "/";
    localStorage.setItem(root, wb.length);
  }
}

ss.event.on("newObject", function(iwb, channelName) {
  var whiteboard = window.whiteboard;
  if (
    iwb.whiteboard === whiteboard || channelName === "_global" && !whiteboard
  ) {
    var tmp = window.paperToolsProject.activeLayer.children;
    for (var i = 0; i < tmp.length; i++) {
      var t = tmp[i];
      if (t.r === iwb.r && t.removeOnNewObject) {
        t.visible = false;
        t.remove();
        i--;
      }
    }
    handleUpdate(iwb);
  }
});

ss.event.on("updateObject", function(iwb, channelName) {
  var whiteboard = window.whiteboard;
  if (
    iwb.whiteboard === whiteboard || channelName === "_global" && !whiteboard
  ) {
    // Keep parent in time machine project but remove from user project
    window.timeMachineProject.activeLayer.children.forEach(function(t) {
      if (t.iwb._id === iwb._parent) {
        t.visible = false;
      }
    });
    var tmp = window.paperToolsProject.activeLayer.children;
    for (var i = 0; i < tmp.length; i++) {
      var t = tmp[i];
      if (t.r === iwb.r && t.removeOnNewObject) {
        t.visible = false;
        t.remove();
        i--;
      }
    }
    handleUpdate(iwb);
  }
});

NProgress.configure({ trickle: false, showSpinner: false });

function objectsReady() {
  document.dispatchEvent(new CustomEvent("timeAnimation"));
  NProgress.remove();
}

var throttle = new Throttle({
  active: true, // set false to pause queue
  rate: 1000, // how many requests can be sent every `ratePer`
  ratePer: 1000, // number of ms in which `rate` requests may be sent
  concurrent: 100 // how many requests can be sent concurrently
});

function loadWhiteboard(whiteboard, resolve, reject) {
  NProgress.start();
  minTime = +new Date();
  maxTime = 0;

  var wb = data[whiteboard] = data[whiteboard] || [];
  var length = wb.length;

  if (length) {
    for (var i = 0; i < length; i++) {
      var object = wb[i];
      wb[object._id] = object;
      prepareObject(object);
    }
  }

  var root = "/_wes/" + whiteboard + "/";

  var db;
  try {
    db = new Dexie(root);
    dbs[whiteboard] = db;

    // Define a schema
    db.version(1).stores({ iws: "&_id" });

    // Open the database
    db.open().catch(function(error) {
      alert("Uh oh : " + error);
      delete dbs[whiteboard];
      db = null;
    });
  } catch (err) {
    alert(err);
    db = null;
    delete dbs[whiteboard];
  }

  var hasCache;
  try {
    hasCache = localStorage.getItem(root);
    if (hasCache) {
      wb.count = +hasCache;
    }
  } catch (err) {
  }

  function onData(err, object, fromCache) {
    if (err) {
      console.log(arguments);
      return;
    }

    object = Object.create(object);
    wb[object._id] = object;
    wb.push(object);

    var length = wb.length;
    var count = wb.count;
    var finished = length >= count;

    if (window.whiteboard !== whiteboard) {
      return !finished;
    }

    prepareObject(object);

    if (finished && !fromCache) {
      resolve();
      try {
        localStorage.setItem(root, length);
      } catch (err) {
        console.log(err);
      }
    } else if (length % 256 === 0) {
      NProgress.set(length / count);
      document.dispatchEvent(new CustomEvent("timeAnimation"));
    }

    return !finished;
  }

  function cacheOnData(err, body) {
    if (!err && db) {
      db.iws.add(body).catch(function(err) {
        console.log(err);
      });
    }
    return onData(err, body);
  }

  var cached = Object.create(null);
  var cachedOrThrottledRequest = function(id) {
    if (!(id in cached)) {
      superagent.get(root + id).use(throttle.plugin()).end(function(err, res) {
        cacheOnData(err, res && res.body);
      });
    }
  };

  var items = [];
  var loadCache = hasCache && db && db.iws.each(function(item) {
      cached[item._id] = true;
      items.push(item);
    });

  Dexie.Promise
    .resolve(loadCache)
    .catch(function(err) {
      console.log(err);
      db = null;
      return false;
    })
    .then(function(result) {
      if (result === undefined) {
        items.forEach(function(item) {
          if (!wb.hasOwnProperty(item._id)) {
            onData(null, item, true);
          }
        });
      }
      ss.rpc("iwb.getNumObjects", whiteboard, function(err, count) {
        if (err) {
          console.log(arguments);
          reject();
          return;
        }

        wb.count = count;
        var length = wb.length;
        if (length === count) {
          resolve();
          return;
        }

        NProgress.set(count ? length / count : 1);

        if (result === false || result === null) {
          ss.rpc("iwb.streamObjects", whiteboard, length, count, cacheOnData);
        } else {
          chunkedRequest({
            url: "/_wes/" + whiteboard,
            method: "GET",
            onChunk: function(err, parsedChunk) {
              return err || parsedChunk.map(cachedOrThrottledRequest);
            }
          });
        }
      });
    });
}

module.exports = function(whiteboard) {
  return new Promise(function(resolve, reject) {
    loadWhiteboard(whiteboard, resolve, reject);
  }).then(objectsReady);
};
