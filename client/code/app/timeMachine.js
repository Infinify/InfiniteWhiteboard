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
$(window).on("clearCanvas", function() {
  project.activeLayer.removeChildren();
  htmlContainer.innerHTML = "";

  for (var zi = -1021, zl = 53; zi < zl; zi++) {
    zToPaths[String(zi)] = [];
  }

  prevTime = 0;
  window.loadWhiteboard(window.whiteboard);
});

/**
     * Performs a binary search on the host array. This method can either be
     * injected into Array.prototype or called with a specified scope like this:
     * binaryIndexOf.call(someArray, searchElement);
     *
     * @param {*} searchElement The item to search for within the array.
     * @return {Number} The index of the element which defaults to -1 when not found.
     */
function binaryIndexOf(searchElement) {
  var minIndex = 0;
  var maxIndex = this.length - 1;
  var currentIndex;
  var currentElement;
  var resultIndex;

  while (minIndex <= maxIndex) {
    resultIndex = currentIndex = (minIndex + maxIndex) / 2 | 0;
    currentElement = this[currentIndex];

    if (currentElement < searchElement) {
      minIndex = currentIndex + 1;
    } else if (currentElement > searchElement) {
      maxIndex = currentIndex - 1;
    } else {
      return currentIndex;
    }
  }

  return ~maxIndex;
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

Array.prototype.binaryIndexOf = binaryIndexOf;
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

  paperItem.timestamp = +new Date(iwb.timestamp);

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
    var current = iwb.currentPaperItem;
    var parent = current.parentPaper;
    if (parent) {
      parent.nextPaper = paperItem;
      paperItem.parentPaper = parent;
    }
    var next = current.nextPaper;
    if (next) {
      next.parentPaper = paperItem;
      paperItem.nextPaper = next;
    }
    current.remove();
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

  project.activeLayer.insertChild(
    Math.abs(project.activeLayer.children.binaryIndexOf(paperItem)),
    paperItem
  );

  var noUpdateOverride = !(paperItem.nextPaper &&
    (!window.timestamp || paperItem.nextPaper.timestamp <= window.timestamp));
  paperItem.visible = !paperItem.deleted &&
    (!window.timestamp || paperItem.timestamp <= window.timestamp) &&
    noUpdateOverride;
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
  if (!mfs && propagatingEventsToOtherViews) {
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
  if (!mfs && propagatingEventsToOtherViews) {
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
            tmp = a[i];
            drawObject(tmp, true);
          }
        }
      },
      0
    );
  }
};

function setVisibility(item, t) {
  var visible = item.timestamp <= t;
  var parent = item.parentPaper;
  var next = item.nextPaper;
  if (visible) {
    if (parent) {
      parent.visible = false;
    }
    if (next) {
      while (next && next.nextPaper && next.nextPaper.timestamp <= t) {
        next.visible = false;
        next = next.nextPaper;
      }
      if (next.timestamp <= t) {
        visible = false;
      }
      next.visible = !next.deleted && next.timestamp <= t;
    }
  } else if (parent) {
    while (parent && parent.parentPaper && parent.timestamp > t) {
      parent.visible = false;
      parent = parent.parentPaper;
    }
    while (parent && parent.nextPaper && parent.nextPaper.timestamp <= t) {
      parent.visible = false;
      parent = parent.nextPaper;
    }
    parent.visible = !parent.deleted && parent.timestamp <= t;
  }
  item.visible = !item.deleted && visible;
}

var prevTime = 0;
window.timeAnimation = function(preserveUrl, skipTrigger) {
  var children = project.activeLayer.children;
  var length = children.length;
  var prev = prevTime ? Math.abs(children.binaryIndexOf(prevTime)) : length;
  var t = window.timestamp || +new Date();
  var next = Math.abs(children.binaryIndexOf(t));
  var min = Math.min(prev, next);
  var max = Math.max(prev, next);
  prevTime = t;

  if (length) {
    for (
      var i = Math.max(0, min - 1), l = Math.min(max + 1, length - 1);
      i <= l;
      i++
    ) {
      setVisibility(children[i], t);
    }
  }

  if (!skipTrigger) {
    $(window).trigger("timeAnimation");
  }
  if (!preserveUrl) {
    changePosition();
  }
};

window.timeMachineProject = paper.project;
