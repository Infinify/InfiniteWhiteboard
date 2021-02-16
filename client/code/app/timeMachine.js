var canvas = document.getElementById("timeMachineCanvas");
paper.setup(canvas);
var project = paper.project;
var Point = paper.Point;
var Raster = paper.Raster;
var Path = paper.Path;
var PointText = paper.PointText;
var Item = paper.Item;
var tileSize = 256;
var zInterval = 7;

var zToPaths = {};
for (var zi = -1021, zl = 54; zi < zl; zi++) {
  zToPaths[String(zi)] = [];
}

var htmlContainer = document.getElementById("htmlContainer");

document.addEventListener("clearCanvas", function() {
  project.activeLayer.removeChildren();
  htmlContainer.innerHTML = "";

  for (var zi = -1021, zl = 53; zi < zl; zi++) {
    zToPaths[String(zi)] = [];
  }

  prevTime = 0;
});

/*O(log n)*/
function sortedIndex(arr, value) {
  var count = arr.length;
  var first = 0;

  while (count > 0) {
    var step = count >>> 1;
    var it = first + step;
    if (arr[it] < value) {
      first = it + 1;
      count -= step + 1;
    } else {
      count = step;
    }
  }

  return first;
}

/*O(log n)*/
function sortedLastIndex(arr, value) {
  var count = arr.length;
  var first = 0;

  while (count > 0) {
    var step = count >>> 1;
    var it = first + step;
    if (!(value < arr[it])) {
      first = it + 1;
      count -= step + 1;
    } else {
      count = step;
    }
  }

  return first;
}

/*O(log n)*/
function sortedIndexOld(arr, value) {
  var hi = arr.length;
  var lo = 0;

  while (lo < hi) {
    var i = (lo + hi) >>> 1;
    if (arr[i] < value) {
      lo = i + 1;
    } else {
      hi = i;
    }
  }

  return hi;
}

/*O(log n)*/
function sortedLastIndexOld(arr, value) {
  var hi = arr.length;
  var lo = 0;

  while (lo < hi) {
    var i = (lo + hi) >>> 1;
    if (arr[i] <= value) {
      lo = i + 1;
    } else {
      hi = i;
    }
  }

  return hi;
}

/**
     * @name Html
     *
     * @class A Html is a html element
     *
     * @extends Item
     */
var id = 0;
var enableScripts = false;
var Html = Item.extend({
  _class: "Html",
  _selectBounds: false,
  _selectChildren: false,
  _serializeFields: { content: "" },
  _equals: function(source) {
    return this.getContent() === source.getContent();
  },
  getContent: function() {
    return this._content;
  },
  setContent: function(content) {
    this._content = content;
    if (enableScripts && this.elem.parentNode) {
      htmlContainer.removeChild(this.elem);
    }
    this.elem.innerHTML = content;
    if (enableScripts) {
      htmlContainer.appendChild(this.elem);
    }
  },
  getBounds: function() {
    if (!this.elem) {
      return this._getBounds.call(this, arguments);
    }
    var bounds = this.elem.getBoundingClientRect();
    return new paper.Rectangle({
      x: 0,
      y: 0,
      width: bounds.width,
      height: bounds.height
    });
  },
  hasFill: function() {
    return true;
  },
  isEmpty: function() {
    return false;
  },
  getVisible: function() {
    return this._visible;
  },
  setVisible: function(visible) {
    this._visible = visible;
    if (visible) {
      if (!this.elem.parentNode) {
        if (!enableScripts) {
          this.elem.innerHTML = "";
        }
        htmlContainer.appendChild(this.elem);
        if (!enableScripts) {
          this.elem.innerHTML = this._content;
        }
      }
      this._draw(null, null, this._matrix);
    } else if (this.elem.parentNode) {
      htmlContainer.removeChild(this.elem);
    }
  },
  initialize: function Html(content, point) {
    this._initialize(arguments);
    if (point) {
      this.position = point;
    }
    this.elemId = "htmlElem" + id++;
    var elem = this.elem = document.createElement("div");
    elem.className = "htmlItem is-container container";
    elem.id = this.elemId;
    if (!enableScripts) {
      htmlContainer.appendChild(this.elem);
    }
    this.content = content;
  },
  _draw: function(ctx, param, matrix) {
    var style = this.elem.style;
    var value = "matrix(" + matrix.values + ")";
    style[
      "-webkit-transform"
    ] = value; /* Ch <36, Saf 5.1+, iOS < 9.2, An =<4.4.4 */
    style["-ms-transform"] = value; /* IE 9 */
    style.transform = value; /* IE 10, Fx 16+, Op 12.1+ */
  }
});
var hitOptions = { segments: true, stroke: true, fill: true, tolerance: 5 };
document.addEventListener("html", function(event) {
  var point = event.detail;
  var hitResult = project.hitTest(point, hitOptions);
  if (!hitResult || !(hitResult.item instanceof Html)) {
    hitResult = window.timeMachineProject.hitTest(point, hitOptions);
  }
  hitResult = hitResult && hitResult.item instanceof Html && hitResult.item;
  var html = hitResult ||
    new Html("<div>This is html text inside a div element</div>", point);
  html.visible = true;
  document.dispatchEvent(new CustomEvent("htmlEditor", {
    detail: { html: html, edit: Boolean(hitResult) }
  }));
});

Path.prototype.valueOf = PointText.prototype.valueOf = Raster.prototype.valueOf = Html.prototype.valueOf = function() {
  return this.timestamp;
};

window.drawObject = function(iwb, reRender) {
  if (
    iwb.timestamp === undefined ||
      iwb.data === undefined ||
      iwb.data.mapZoom === undefined
  ) {
    return;
  }

  var paperItem,
    map = window.map,
    currentZoom = map ? map.zoom() : 0,
    currRound = Math.round(currentZoom),
    zoomFraction,
    zoomFactor,
    tileCenter,
    zoomRound,
    center,
    offset,
    scale,
    zoom,
    tmp,
    mc,
    d,
    x,
    y;

  d = iwb.data;
  zoom = d.mapZoom;
  zoomRound = Math.round(zoom);

  if (zoom < -1021 || zoom > 53) {
    console.log("Strange z: " + zoom);
    return;
  }

  if (!reRender) {
    tmp = zToPaths[zoomRound];
    if (!tmp) {
      console.log("Strange zToPaths: " + zoom);
      return;
    }
    tmp.push(iwb);
    if (Math.abs(currRound - zoomRound) > zInterval) {
      setVisibility(iwb, window.timestamp || false);
      return;
    }
  }

  var type = iwb.paper[0];
  switch (type) {
    case "Path":
      paperItem = new Path();
      paperItem.importJSON(iwb.paper);
      break;
    case "PointText":
      paperItem = new PointText();
      paperItem.onClick = function() {
        window.textTool.edit(paperItem);
      };
      paperItem.importJSON(iwb.paper);
      break;
    case "Raster":
      paperItem = new Raster();
      paperItem.importJSON(iwb.paper);
      break;
    case "Svg":
      paperItem = project.importSVG(iwb.paper[1]);
      break;
    case "Html":
      paperItem = new Html();
      paperItem.importJSON(iwb.paper);
      break;
    default:
      console.log("Unrecognized format: " + type);
      return;
  }
  paperItem.deleted = !paperItem.visible;
  paperItem.iwb = iwb;
  paperItem.timestamp = iwb.timestamp;

  var c0 = d.c0;
  x = c0.column * tileSize;
  y = c0.row * tileSize;
  zoomFraction = zoom - zoomRound;
  zoomFactor = Math.pow(2, zoomFraction);
  offset = new Point(x * zoomFactor, y * zoomFactor);
  paperItem.mapZoom = zoom;

  paperItem.translate(offset);

  scale = Math.pow(2, currentZoom - zoom);
  paperItem.scale(scale, [0, 0]);

  if (type === "Path") {
    paperItem.style.strokeWidth *= scale || 1;
  }

  if (iwb.currentPaperItem) {
    iwb.currentPaperItem.remove();
  }

  iwb.currentPaperItem = paperItem;

  if (map) {
    mc = map.center();
    center = map.locationPoint(mc);
    tileCenter = map.locationCoordinate(mc);
    zoom = currentZoom;
    zoomFraction = zoom - currRound;
    zoomFactor = Math.pow(2, zoomFraction);
    x = center.x - tileCenter.column * tileSize * zoomFactor;
    y = center.y - tileCenter.row * tileSize * zoomFactor;
    offset = new Point(x, y);

    paperItem.translate(offset);
  }

  var layer = project.activeLayer;

  var index = sortedLastIndex(layer.children, paperItem);

  layer.insertChild(index, paperItem);

  setVisibility(iwb, window.timestamp || false);
};
function debounce(func, wait, immediate) {
  var timeout, args, context, timestamp, result;

  var later = function() {
    var last = new Date() - timestamp;

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      }
    }
  };

  return function() {
    context = this;
    args = arguments;
    timestamp = new Date();
    var callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };
}
window.changePosition = debounce(
  function(offset) {
    var whiteboard = window.whiteboard;
    var timestamp = window.timestamp;
    var url = (whiteboard === "_global" ? "/" : "/" + whiteboard + "/") +
      (timestamp ? "?time=" + Math.round(timestamp) : "") +
      window.location.hash;
    history.pushState(null, whiteboard, url);
    ss.rpc("whiteboards.changePosition", whiteboard, url, offset, function(
      err
    ) {
      err && console.log(err);
    });
  },
  250
);

var zProd = 1;
var xSum = 0;
var ySum = 0;
window.translateChildren = function(x, y, mfs, offset) {
  if (!mfs && window.propagatingEventsToOtherViews) {
    localStorage.setItem(
      "storage-event-translate",
      JSON.stringify({ id: getId(), time: new Date(), x: x, y: y })
    );
  }

  var a = window.timeMachineProject.activeLayer;
  if (a.children.length) {
    a.translate(x, y);
  }

  var drawLayer = window.paperToolsProject.activeLayer;
  if (drawLayer.children.length) {
    drawLayer.translate(x, y);
  }

  xSum += x;
  ySum += y;

  if (offset) {
    changePosition(offset);
  }
};

window.zoomChildren = function(scale, x, y, mfs) {
  if (!mfs && window.propagatingEventsToOtherViews) {
    localStorage.setItem(
      "storage-event-zoom",
      JSON.stringify({
        pos: getPosition(),
        scale: scale,
        id: getId(),
        time: new Date(),
        x: x,
        y: y
      })
    );
  }

  var a,
    i,
    tmp,
    l,
    j,
    jl,
    center = new Point(x, y),
    z = Math.pow(2, scale),
    zoom = map.zoom(),
    zoomRound = Math.round(zoom),
    newZoom = zoom + scale,
    newZoomRound = Math.round(newZoom),
    zoomChanged = newZoomRound !== zoomRound;

  var oldMin = zoomRound - zInterval,
    newMin = newZoomRound - zInterval,
    oldMax = zoomRound + zInterval,
    newMax = newZoomRound + zInterval;

  if (zoomChanged) {
    for (
      j = Math.max(
        -1021,
        zoomRound < newZoomRound ? oldMin : newMax + 1
      ), jl = Math.min(53, zoomRound < newZoomRound ? newMin : oldMax + 1);
      j < jl;
      j++
    ) {
      a = zToPaths[String(j)];
      for (i = 0, l = a.length; i < l; i++) {
        tmp = a[i];
        if (tmp.currentPaperItem) {
          tmp.currentPaperItem.visible = false;
          tmp.currentPaperItem.remove();
        }
      }
    }
  }

  zProd *= z;

  xSum -= x;
  ySum -= y;
  xSum *= z;
  ySum *= z;
  xSum += x;
  ySum += y;

  var drawLayer = window.paperToolsProject.activeLayer;
  var drawChildren = drawLayer.children;
  if (drawChildren.length) {
    drawLayer.scale(z, center);
  }
  for (i = 0, l = drawChildren.length; i < l; i++) {
    tmp = drawChildren[i];
    if (
      tmp.style && tmp.style.strokeWidth !== undefined && tmp._class === "Path"
    ) {
      tmp.style.strokeWidth *= z;
    }
  }
  a = window.timeMachineProject.activeLayer;
  if (a.children.length) {
    a.scale(z, center);
  }
  a = a.children;
  for (i = 0, l = a.length; i < l; i++) {
    tmp = a[i];
    if (
      tmp.style && tmp.style.strokeWidth !== undefined && tmp._class === "Path"
    ) {
      tmp.style.strokeWidth *= z;
    }
  }

  if (zoomChanged) {
    setTimeout(
      function() {
        for (
          j = Math.max(
            -1021,
            zoomRound < newZoomRound ? Math.max(newMin, oldMax + 1) : newMin
          ), jl = Math.min(
            53,
            zoomRound < newZoomRound ? newMax + 1 : Math.min(oldMin, newMax + 1)
          );
          j < jl;
          j++
        ) {
          a = zToPaths[String(j)];
          for (i = 0, l = a.length; i < l; i++) {
            drawObject(a[i], true);
          }
        }
      },
      0
    );
  }
};

function setVisibility(iwb, t) {
  var item = iwb.currentPaperItem;
  var visible = !t || iwb.timestamp <= t;
  var parent = iwb.parent;
  var next = iwb.next;
  if (visible) {
    if (parent && parent.currentPaperItem) {
      parent.currentPaperItem.visible = false;
    }
    if (next) {
      while (next && next.next && (!t || next.next.timestamp <= t)) {
        if (next.currentPaperItem) {
          next.currentPaperItem.visible = false;
        }
        next = next.next;
      }
      if (!t || next.timestamp <= t) {
        visible = false;
      }
      if (next.currentPaperItem) {
        next.currentPaperItem.visible = !next.deleted && (!t || next.timestamp <= t);
      }
    }
  } else if (parent) {
    while (parent && parent.parent && (!t || parent.timestamp > t)) {
      if (parent.currentPaperItem) {
        parent.currentPaperItem.visible = false;
      }
      parent = parent.parent;
    }
    while (parent && parent.next && (!t || parent.next.timestamp <= t)) {
      if (parent.currentPaperItem) {
        parent.currentPaperItem.visible = false;
      }
      parent = parent.next;
    }
    if (parent.currentPaperItem) {
      parent.currentPaperItem.visible = !parent.deleted &&
        (!t || parent.timestamp <= t);
    }
  }
  if (item) {
    item.visible = !item.deleted && visible;
  }
}

var prevTime = 0;
window.timeAnimation = function(preserveUrl, skipTrigger) {
  var children = project.activeLayer.children;
  var t = window.timestamp || +new Date();
  var length = children.length;

  if (length) {
    var next = sortedIndex(children, t);
    var prev = length;

    if (prevTime) {
      if (prevTime <= t) {
        prev = sortedIndex(children, prevTime);
        next = sortedLastIndex(children, t);
      } else {
        prev = sortedLastIndex(children, prevTime);
      }
    }

    var min = Math.min(prev, next);
    var max = Math.max(prev, next);

    for (
      var i = Math.max(0, min - 1), l = Math.min(max + 1, length - 1);
      i <= l;
      i++
    ) {
      setVisibility(children[i].iwb, t);
    }
  }

  prevTime = t;

  if (!skipTrigger) {
    document.dispatchEvent(new CustomEvent("timeAnimation"));
  }
  if (!preserveUrl) {
    changePosition();
  }
};

window.timeMachineProject = paper.project;
