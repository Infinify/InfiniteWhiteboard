/*global map*/

window.name = uuid.v1();

function getCookie(c_name) {
  var c_value = document.cookie,
    c_start = c_value.indexOf(" " + c_name + "="),
    c_end;

  if (c_start === -1) {
    c_start = c_value.indexOf(c_name + "=");
  }
  if (c_start === -1) {
    c_value = null;
  } else {
    c_start = c_value.indexOf("=", c_start) + 1;
    c_end = c_value.indexOf(";", c_start);
    if (c_end === -1) {
      c_end = c_value.length;
    }
    c_value = unescape(c_value.substring(c_start, c_end));
  }
  return c_value;
}

window.getId = function() {
  return getCookie("connect.sid") + window.name;
};

function findPos(obj) {
  var curleft = 0, curtop = 0;
  if (obj.offsetParent) {
    while (true) {
      curleft += obj.offsetLeft;
      curtop += obj.offsetTop;
      if (!obj.offsetParent) {
        break;
      }
      obj = obj.offsetParent;
    }
  } else {
    if (obj.x) {
      curleft += obj.x;
    }
    if (obj.y) {
      curtop += obj.y;
    }
  }
  return { x: curleft, y: curtop };
}

window.getPosition = function() {
  var screen_x = window.screenLeft || window.screenX,
    screen_y = window.screenTop || window.screenY,
    canvas = document.getElementById("canvas"),
    o = findPos(canvas);

  return { x: screen_x + o.x, y: screen_y + o.y };
};

function findScreenCoords(mouseEvent) {
  var left,
    top,
    right,
    bottom,
    xpos,
    ypos,
    xposPage,
    yposPage,
    wDiff,
    hDiff,
    obj = mouseEvent.currentTarget,
    obj_left = 0,
    obj_top = 0;

  while (obj.offsetParent) {
    obj_left += obj.offsetLeft;
    obj_top += obj.offsetTop;
    obj = obj.offsetParent;
  }

  if (mouseEvent) {
    // FireFox
    xpos = mouseEvent.screenX;
    ypos = mouseEvent.screenY;
    xposPage = mouseEvent.pageX;
    yposPage = mouseEvent.pageY;
  } else {
    // IE
    xpos = window.event.screenX;
    ypos = window.event.screenY;
    xposPage = window.event.x + document.body.scrollLeft - 2;
    yposPage = window.event.y + document.body.scrollTop - 2;
  }

  wDiff = window.outerWidth - window.innerWidth;
  hDiff = window.outerHeight - window.innerHeight;

  left = xpos - xposPage;
  top = ypos - yposPage;
  right = wDiff - left;
  bottom = hDiff - top;

  return { left: left, top: top, right: right, bottom: bottom };
}
var indexInX, indexInY;
var mfsb = document.getElementById("mfsb");
if (
  /mobi/.test(
    (navigator.userAgent || navigator.vendor || window.opera).toLowerCase()
  )
) {
  mfsb.style.display = "none";
}

window.toggleMFS = function(event) {
  var old = localStorage.mfs && JSON.parse(localStorage.mfs) ||
    { id: getId(), flag: false };
  old.flag = !old.flag;
  var mfsActive = propagatingEventsToOtherViews = old.flag;

  if (mfsActive) {
    old.mapCenter = map.center();
    old.center = map.locationPoint(old.mapCenter);
    old.tileCenter = map.locationCoordinate(old.mapCenter);
    old.zoom = map.zoom();

    old.viewPort = findScreenCoords(event);
    window.pos = old.pos = getPosition();
    window.oldW = window.outerWidth;
    window.oldH = window.outerHeight;
    window.posTimer = setInterval(positionTimerHandler, 40);

    mfsb.innerText = "MFS is on";
    window.location.href = "#" +
      old.zoom +
      "/" +
      old.mapCenter.lat +
      "/" +
      old.mapCenter.lon;
  } else {
    clearTimeout(window.posTimer);
    mfsb.innerText = "MFS is off";
  }
  window.mfs = old;
  localStorage.mfs = JSON.stringify(old);
};

if (mfsb) {
  mfsb.onmousedown = window.toggleMFS;

  window.positionTimerHandler = function() {
    var oldPos = window.pos, posDiff, pos;

    pos = window.pos = getPosition();

    if (pos.x !== oldPos.x || pos.y !== oldPos.y) {
      posDiff = { x: oldPos.x - pos.x, y: oldPos.y - pos.y };
      map.panBy(posDiff, true);
      window.mfs.viewPort.left += posDiff.x;
      window.mfs.viewPort.right += posDiff.x;
      window.mfs.viewPort.top += posDiff.y;
      window.mfs.viewPort.bottom += posDiff.y;
    }

    if (window.oldW !== window.outerWidth) {
      window.mfs.viewPort.right -= window.oldW - window.outerWidth;
      window.oldW = window.outerWidth;
    }

    if (window.oldH !== window.outerHeight) {
      window.mfs.viewPort.bottom -= window.oldH - window.outerHeight;
      window.oldH = window.outerHeight;
    }
  };

  var mfsInit = localStorage.mfs && JSON.parse(localStorage.mfs);

  var mfsActive = propagatingEventsToOtherViews = mfsInit && mfsInit.flag;

  if (mfsActive) {
    mfsb.innerText = "MFS is on";
  } else {
    mfsb.innerText = "MFS is off";
  }
}

function isMfs() {
  return localStorage.mfs && JSON.parse(localStorage.mfs).flag;
}

function activateMfs(v) {
  var posDiff, size;
  window.mfs = JSON.parse(localStorage.mfs);
  // window.location.hash = '#' + v.zoom + '/' + v.mapCenter.lat + '/' + v.mapCenter.lon;
  window.pos = getPosition();
  window.oldW = window.outerWidth;
  window.oldH = window.outerHeight;
  window.posTimer = setInterval(positionTimerHandler, 40);
  window.mfs.viewPort = findScreenCoords(event);

  indexInX = window.pos.x / window.outerWidth;
  indexInY = window.pos.y / window.outerHeight;

  if (!v) return;
  size = map.size();
  map.zoomBy(
    v.zoom - map.zoom(),
    { x: size.x / 2, y: size.y / 2 },
    { lat: v.mapCenter.lat, lon: v.mapCenter.lon },
    true
  );

  posDiff = {
    x: (
      v.pos.x -
        window.pos.x +
        (indexInX >= 1 ? v.viewPort.right - v.viewPort.left : 0)
    ),
    y: v.pos.y - window.pos.y - (indexInY >= 1 ? v.viewPort.top : 0)
  };
  map.panBy(posDiff, true);
}

if (isMfs()) {
  toggleMFS();
}

function handle_storage(e) {
  if (!e) {
    e = window.event;
  }
  var v = JSON.parse(e.newValue);
  if (e.key === "mfs") {
    if (v) {
      window.mfs = v;
      var mfsActive = propagatingEventsToOtherViews = v.flag;
      if (mfsActive) {
        activateMfs(v);
        mfsb.innerText = "MFS is on";
      } else {
        clearTimeout(window.posTimer);
        mfsb.innerText = "MFS is off";
      }
    }

    return;
  }

  if (isMfs() && v.id !== getId()) {
    var x, y, pos, scale, posDiff;
    switch (e.key) {
      case "storage-event-translate":
        x = v.x;
        y = v.y;
        map.panBy(v, true);
        break;

      case "storage-event-zoom":
        scale = v.scale;
        x = v.x;
        y = v.y;
        pos = getPosition();

        posDiff = { x: pos.x - v.pos.x, y: pos.y - v.pos.y };
        pos = { x: x - posDiff.x, y: y - posDiff.y };

        map.zoomBy(scale, pos, undefined, true);
        break;

      case "storage-event-down":
        pos = getPosition();
        posDiff = {
          x: (
            v.pos.x -
              pos.x +
              (indexInX >= 1 ? v.viewPort.right - v.viewPort.left : 0)
          ),
          y: v.pos.y - pos.y - (indexInY >= 1 ? v.viewPort.top : 0)
        };
        v.point = { x: v.point.x + posDiff.x, y: v.point.y + posDiff.y };
        v.style.strokeColor = new paper.Color().importJSON(v.style.strokeColor);
        onMouseDowns(v, true);
        break;

      case "storage-event-drag":
        pos = getPosition();
        posDiff = {
          x: (
            v.pos.x -
              pos.x +
              (indexInX >= 1 ? v.viewPort.right - v.viewPort.left : 0)
          ),
          y: v.pos.y - pos.y - (indexInY >= 1 ? v.viewPort.top - 14 : 0)
        };
        v.point = { x: v.point.x + posDiff.x, y: v.point.y + posDiff.y };
        onMouseDrags(v, true);
        break;

      case "storage-event-up":
        pos = getPosition();
        posDiff = {
          x: (
            v.pos.x -
              pos.x +
              (indexInX >= 1 ? v.viewPort.right - v.viewPort.left : 0)
          ),
          y: v.pos.y - pos.y - (indexInY >= 1 ? v.viewPort.top : 0)
        };
        v.point = { x: v.point.x + posDiff.x, y: v.point.y + posDiff.y };
        onMouseUps(v, true);
        break;

      default:
        console.log("Illegal event: " + e.key);
    }
  }
}

if (window.addEventListener) {
  window.addEventListener("storage", handle_storage, false);
} else {
  window.attachEvent("onstorage", handle_storage);
}
