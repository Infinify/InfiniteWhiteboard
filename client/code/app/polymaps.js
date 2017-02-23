var po = org.polymaps;
var mapDiv = document.getElementById("map");
mapDiv.tabIndex = 1;
var svg = po.svg("svg");
svg.setAttribute("width", "100%");
svg.setAttribute("height", "100%");
var map = window.map = po
  .map()
  .container(mapDiv.appendChild(svg))
  .add(po.interact())
  .add(po.hash())
  .add(po.compass().position("bottom-left"));

document.getElementById("compassToggle").onclick = function() {
  $(".compass").fadeToggle();
};

function iwbData() {
  return {
    whiteboard: window.whiteboard,
    data: {
      mapZoom: map.zoom(),
      c0: map.pointCoordinate(map.locationCoordinate(map.center()), {
        x: 0,
        y: 0
      })
    },
    sid: getId()
  };
}

window.send = function(paperItem) {
  var iwb = iwbData(), tmpSelected = paperItem.selected, r = Math.random();

  paperItem.selected = false;
  iwb.r = paperItem.r = r;

  iwb.paper = paperItem.toJSON();

  paperItem.selected = tmpSelected;
  paperItem.removeOnNewObject = true;

  ss.rpc("iwb.send", iwb, function(err) {
    if (err) {
      console.log(err);
      // TODO add notification
      // gray/shade out objects and show retry
    }
  });
};

window.updateObject = function(paperItem) {
  var tmp = iwbData(), tmpSelected = paperItem.selected, r = Math.random();

  paperItem.selected = false;

  tmp.r = paperItem.r = r;
  tmp.paper = paperItem.toJSON();
  tmp._id = paperItem.iwb._id;
  tmp.deleted = paperItem.deleted;

  paperItem.selected = tmpSelected;
  paperItem.removeOnNewObject = true;

  ss.rpc("iwb.update", tmp, function(err) {
    if (err) {
      console.log(err);
      // TODO add notification
    }
  });
};

function parseUrl(url) {
  var query, pairs, path, tmp, il, i, t;

  if (url) {
    query = url.substring(url.indexOf("?") + 1);
    query = query.substring(0, query.indexOf("#"));
  } else {
    query = location.search.slice(1);
  }

  path = location.pathname.split("/");

  //noinspection JSUnusedAssignment
  if (
    path.length > 3 && (t = parseInt(path[3], 10)) ||
      path.length > 2 && (t = parseInt(path[2], 10))
  ) {
    window.timestamp = t;
  }
  window.whiteboard = "_global";
  if (
    path.length > 2 &&
      path[1].length > 1 &&
      path[2].length > 0 &&
      !parseInt(path[2], 10)
  ) {
    window.whiteboard = path[1] + "/" + path[2];
  } else if (path.length > 1 && path[1].length > 0) {
    window.whiteboard = path[1];
  }

  pairs = query.split("&");
  for (i = 0, il = pairs.length; i < il; i++) {
    tmp = pairs[i].split("=");
    switch (tmp[0]) {
      case "whiteboard":
        window.whiteboard = tmp[1];
        break;

      case "time":
        window.timestamp = +tmp[1];
        break;
    }
  }
}

window.onpopstate = function() {
  var returnLocation = history.location || document.location;

  var current = window.whiteboard;
  parseUrl(returnLocation.href);
  if (window.whiteboard === current) {
    return;
  }

  changeWhiteboard(window.whiteboard);
};

parseUrl();

ss.rpc("whiteboards.changeWhiteboard", !1, window.whiteboard, function(err) {
  if (err) {
    console.log(err);
    // TODO notification with retry button
  }
});
