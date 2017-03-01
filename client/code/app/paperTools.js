var canvas = document.getElementById("canvas");
// Create an empty project and a view for the canvas:
paper.setup(canvas);

var changePos = function(pos) {
  var size = project.view.getViewSize();
  var x = pos.x - size.width / 2;
  var y = pos.y - size.height / 2;
  window.changePosition({ x: x, y: y });
};

var project = paper.project;
var Raster = paper.Raster;
var Path = paper.Path;
var PointText = paper.PointText;
var Tool = paper.Tool;

document.addEventListener("clearCanvas", function() {
  project.activeLayer.removeChildren();
});

function getRandColor(brightness) {
  // 6 levels of brightness from 0 to 5, 0 being the darkest
  var rgb = [Math.random() * 256, Math.random() * 256, Math.random() * 256],
    mix = [brightness * 51, brightness * 51, brightness * 51],
    // 51 => 255/5
    mixedrgb = [rgb[0] + mix[0], rgb[1] + mix[1], rgb[2] + mix[2]].map(function(
      x
    ) {
      return Math.round(x / 2).toString(16);
    });
  return "#" + mixedrgb.join("");
}

window.initColor = getRandColor(5);

window.currentStrokeStyle = {
  strokeColor: new paper.Color(0, 0, 0),
  strokeWidth: 5
};
function activate(tool) {
  return function() {
    var toolActivator = document.getElementById(tool);
    if (!toolActivator) {
      return;
    }
    toolActivator.classList.add("active");
  };
}
function deactivate(tool) {
  return function() {
    var toolActivator = document.getElementById(tool);
    if (!toolActivator) {
      return;
    }
    toolActivator.classList.remove("active");
  };
}
window.nopTool = new Tool();
var tool;
(function() {
  window.drawTool = tool = new Tool();
  tool.onActivate = activate("drawTool");
  tool.onDeactivate = deactivate("drawTool");

  var path;
  var onMouseDowns = window.onMouseDowns = function(event, mfs) {
    if (!mfs && propagatingEventsToOtherViews) {
      localStorage.setItem(
        "storage-event-down",
        JSON.stringify({
          pos: getPosition(),
          viewPort: window.mfs && window.mfs.viewPort,
          id: getId(),
          time: new Date(),
          point: { x: event.point.x, y: event.point.y },
          modifiers: event.modifiers,
          style: window.currentStrokeStyle,
          strokeCap: window.pencilCap
        })
      );
    }
    changePos(event.point);
    if (path) {
      path.selected = false;
    }

    path = new Path();
    path.add(event.point);

    if (event.modifiers.shift) {
      path.add(event.point);
    }

    path.style = event.style ||
      window.currentStrokeStyle ||
      {
        strokeColor: { hue: Math.random() * 360, saturation: 1, brightness: 1 },
        strokeWidth: 4
      };

    path.strokeCap = event.strokeCap || window.pencilCap || "round";

    path.fullySelected = false;
    if (mfs) {
      paper.project.view.update();
    }
  };

  window.drawTool.onMouseDown = function onMouseDown(event, mfs) {
    onMouseDowns(event, mfs);
  };

  var onMouseDrags = window.onMouseDrags = function(event, mfs) {
    if (!mfs && propagatingEventsToOtherViews) {
      localStorage.setItem(
        "storage-event-drag",
        JSON.stringify({
          pos: getPosition(),
          viewPort: window.mfs && window.mfs.viewPort,
          id: getId(),
          time: new Date(),
          point: { x: event.point.x, y: event.point.y },
          modifiers: event.modifiers
        })
      );
    }

    if (event.modifiers.shift) {
      path.lastSegment.point = event.point;
    } else {
      path.add(event.point);

      if (window.smoothing) {
        path.smooth();
      }
    }
    if (mfs) {
      paper.project.view.update(true);
    }
    console.log("drag", mfs);
  };

  window.drawTool.onMouseDrag = function onMouseDrag(event, mfs) {
    onMouseDrags(event, mfs);
  };

  window.simplification = 1;
  window.smoothing = 0;

  var onMouseUps = window.onMouseUps = function(event, mfs) {
    if (!path) {
      return;
    }
    if (!mfs && propagatingEventsToOtherViews) {
      localStorage.setItem(
        "storage-event-up",
        JSON.stringify({
          pos: getPosition(),
          viewPort: window.mfs && window.mfs.viewPort,
          id: getId(),
          time: new Date(),
          point: { x: event.point.x, y: event.point.y },
          modifiers: event.modifiers
        })
      );
    }

    if (!event.modifiers.shift) {
      if (window.simplification) {
        path.simplify(window.simplification);
      }

      if (window.smoothing) {
        path.smooth();
      }
    }

    path.fullySelected = false;

    if (!mfs && window.send) {
      send(path);
    }

    changePos(event.point);

    if (mfs) {
      paper.project.view.update();
    }
  };

  window.drawTool.onMouseUp = function onMouseUp(event, mfs) {
    onMouseUps(event, mfs);
  };

  window.drawTool.activate();
})();

(function() {
  window.textTool = tool = new Tool();
  tool.onActivate = activate("textTool");
  tool.onDeactivate = deactivate("textTool");

  var hitOptions = { segments: true, stroke: true, fill: true, tolerance: 5 };

  function showTextPreview(point) {
    var style = document.getElementById("textPreviewWrapper").style;
    style.top = point.y - 20 + "px";
    style.left = point.x - 300 + "px";
    style.display = "";
  }

  window.textTool.edit = function edit(path) {
    showTextPreview(path.point);
    document.getElementById("textPreview").value = path.content;
    window.newTextItem = path;
  };

  window.textTool.onMouseDown = function(event) {
    var textToolParams = window.textToolParams;

    var moveWrapper = false;

    if (window.newTextItem) {
      window.newTextItem.point = event.point;
      window.newTextItem.startedDragging = true;
      moveWrapper = true;
    } else {
      window.newTextItem = new PointText({
        content: "",
        point: event.point,
        fillColor: textToolParams.fillColor || "black",
        fontSize: textToolParams.fontSize,
        leading: textToolParams.fontSize * 1.3,
        fontFamily: textToolParams.fontFamily,
        fontWeight: textToolParams.emphasis
      });

      newTextItem.selected = true;
      moveWrapper = true;
    }

    if (moveWrapper) {
      showTextPreview(event.point);
    }
    document.body.style.cursor = "move";

    setTimeout(
      function() {
        // has to be wrapped in a timeout
        document.getElementById("textPreview").focus();
      },
      0
    );

    changePos(event.point);
  };

  window.textTool.onMouseDrag = function(event) {
    var hitResult = project.hitTest(event.point, hitOptions);
    var newItem = window.newTextItem;
    if (
      newItem &&
        (newItem.startedDragging ||
          !newItem.content ||
          hitResult && hitResult.item === newItem)
    ) {
      // there is no text or dragging existing text
      newItem.startedDragging = true;
      newItem.point = newItem.point.__add(event.delta);
      showTextPreview(newItem.point);
    }
    changePos(event.point);
  };

  window.textTool.onMouseUp = function() {
    if (window.newTextItem) {
      window.newTextItem.startedDragging = false;
    }
  };
})();
(function() {
  window.imageTool = tool = new Tool();
  tool.onActivate = activate("imageTool");
  tool.onDeactivate = deactivate("imageTool");

  var hitOptions = { segments: true, stroke: true, fill: true, tolerance: 5 };

  window.imageTool.onMouseDown = function(event) {
    var hitResult = project.hitTest(event.point, hitOptions);
    if (
      window.newRasterItem &&
        hitResult &&
        hitResult.item === window.newRasterItem
    ) {
      window.newRasterItem.point = event.point;
      window.newRasterItem.startedDragging = true;
    } else {
      var url = prompt("Enter url");
      if (!url) return;
      if (url.slice(-4) === ".svg") {
        window.newRasterItem = project.importSVG(url);
      } else {
        window.newRasterItem = new Raster(url, event.point);
      }
      newRasterItem.selected = true;
      newRasterItem.startedDragging = true;
    }

    document.body.style.cursor = "move";
    changePos(event.point);
  };

  window.imageTool.onMouseDrag = function(event) {
    var newItem = window.newRasterItem;
    if (newItem) {
      newItem.position = newItem.position.__add(event.delta);
    }
    changePos(event.point);
  };

  window.imageTool.onMouseUp = function() {
    if (window.newRasterItem) {
      if (confirm("Use this position?")) {
        window.send(newRasterItem);
        delete window.newRasterItem;
      }
    }
  };
})();
(function() {
  window.htmlTool = tool = new Tool();
  tool.onActivate = activate("htmlTool");
  tool.onDeactivate = deactivate("htmlTool");
  window.htmlTool.onMouseDown = function(event) {
    document.dispatchEvent(new CustomEvent("html", { detail: event.point }));
    nopTool.activate();
    changePos(event.point);
  };
})();

(function() {
  var path;
  window.circleTool = tool = new Tool();
  tool.onActivate = activate("circleTool");
  tool.onDeactivate = deactivate("circleTool");

  window.circleTool.onMouseDrag = function onMouseDrag(event) {
    // The radius is the distance between the position
    // where the user clicked and the current position
    // of the mouse.
    path = new Path.Circle({
      center: event.downPoint,
      radius: event.downPoint.__subtract(event.point).length,
      fillColor: window.currentStrokeStyle.fillColor,
      strokeColor: window.currentStrokeStyle.strokeColor,
      strokeWidth: window.currentStrokeStyle.strokeWidth
    });

    // Remove this path on the next drag event:
    path.removeOnDrag();
    changePos(event.point);
  };

  window.circleTool.onMouseUp = function() {
    if (window.send) {
      send(path);
    }
  };
})();
(function() {
  window.rectangleTool = tool = new Tool();
  tool.onActivate = activate("rectangleTool");
  tool.onDeactivate = deactivate("rectangleTool");
  var rect;

  window.rectangleTool.onMouseDrag = function onMouseDrag(event) {
    // The radius is the distance between the position
    // where the user clicked and the current position
    // of the mouse.
    var topLeft = {
      x: Math.min(event.downPoint.x, event.point.x),
      y: Math.min(event.downPoint.y, event.point.y)
    },
      size = {
        width: Math.abs(event.downPoint.x - event.point.x),
        height: Math.abs(event.downPoint.y - event.point.y)
      };

    if (event.modifiers.shift) {
      var max = Math.max(size.width, size.height);

      if (event.downPoint.x > event.point.x) {
        topLeft.x -= max - size.width;
      }
      if (event.downPoint.y > event.point.y) {
        topLeft.y -= max - size.height;
      }
      size.width = max;
      size.height = max;
    }

    if (event.modifiers.control) {
      if (event.downPoint.x < event.point.x) {
        topLeft.x -= size.width;
      }
      if (event.downPoint.y < event.point.y) {
        topLeft.y -= size.height;
      }
      size.width *= 2;
      size.height *= 2;
    }

    rect = new Path.Rectangle(topLeft, size);
    rect.strokeWidth = window.currentStrokeStyle.strokeWidth;
    rect.strokeColor = window.currentStrokeStyle.strokeColor;
    rect.fillColor = window.currentStrokeStyle.fillColor;

    // Remove this path on the next drag event:
    rect.removeOnDrag();
    changePos(event.point);
  };

  window.rectangleTool.onMouseUp = function() {
    if (window.send) {
      send(rect);
    }
  };
})();
(function() {
  window.ellipseTool = tool = new Tool();
  tool.onActivate = activate("ellipseTool");
  tool.onDeactivate = deactivate("ellipseTool");
  var ellipse;

  window.ellipseTool.onMouseDrag = function onMouseDrag(event) {
    var topLeft = {
      x: Math.min(event.downPoint.x, event.point.x),
      y: Math.min(event.downPoint.y, event.point.y)
    },
      size = {
        width: Math.abs(event.downPoint.x - event.point.x),
        height: Math.abs(event.downPoint.y - event.point.y)
      };

    if (event.modifiers.shift) {
      var max = Math.max(size.width, size.height);

      if (event.downPoint.x > event.point.x) {
        topLeft.x -= max - size.width;
      }
      if (event.downPoint.y > event.point.y) {
        topLeft.y -= max - size.height;
      }
      size.width = max;
      size.height = max;
    }

    if (event.modifiers.control) {
      if (event.downPoint.x < event.point.x) {
        topLeft.x -= size.width;
      }
      if (event.downPoint.y < event.point.y) {
        topLeft.y -= size.height;
      }
      size.width *= 2;
      size.height *= 2;
    }

    ellipse = new Path.Ellipse({
      point: [topLeft.x, topLeft.y],
      size: [size.width, size.height],
      fillColor: window.currentStrokeStyle.fillColor,
      strokeColor: window.currentStrokeStyle.strokeColor,
      strokeWidth: window.currentStrokeStyle.strokeWidth
    });

    // Remove this path on the next drag event:
    ellipse.removeOnDrag();
    changePos(event.point);
  };

  window.ellipseTool.onMouseUp = function() {
    if (window.send) {
      window.send(ellipse);
    }
  };
})();

(function() {
  var path;
  window.bezierTool = tool = new Tool();
  tool.onActivate = activate("bezierTool");
  tool.onDeactivate = deactivate("bezierTool");

  var types = ["point", "handleIn", "handleOut"];

  function findHandle(point) {
    for (var i = 0, l = path.segments.length; i < l; i++) {
      for (var j = 0; j < 3; j++) {
        var type = types[j];
        var segment = path.segments[i];
        var segmentPoint = type === point
          ? segment.point
          : segment.point.__add(segment[type]);
        var distance = point.__subtract(segmentPoint).length;
        if (distance < 3) {
          return { type: type, segment: segment };
        }
      }
    }
    return null;
  }

  var currentSegment, mode, type;

  window.bezierTool.onMouseDown = function onMouseDown(event) {
    if (currentSegment) currentSegment.selected = false;
    mode = type = currentSegment = null;

    if (!path) {
      path = new Path();
      path.fillColor = window.currentStrokeStyle.fillColor;
      path.strokeColor = window.currentStrokeStyle.strokeColor;
      path.strokeWidth = window.currentStrokeStyle.strokeWidth;
    }

    var result = findHandle(event.point);
    if (result) {
      currentSegment = result.segment;
      type = result.type;
      if (
        path.segments.length > 1 &&
          result.type == "point" &&
          result.segment.index == 0
      ) {
        mode = "close";
        path.closed = true;
        path.selected = false;
        if (window.send) {
          window.send(path);
        }
        path = null;
      }
    }

    if (mode != "close") {
      mode = currentSegment ? "move" : "add";
      if (!currentSegment) currentSegment = path.add(event.point);
      currentSegment.selected = true;
    }
    changePos(event.point);
  };

  window.bezierTool.onMouseDrag = function onMouseDrag(event) {
    if (mode == "move" && type == "point") {
      currentSegment.point = event.point;
    } else if (mode != "close") {
      var delta = event.delta.clone();
      if (type == "handleOut" || mode == "add") delta = delta.__negate();
      currentSegment.handleIn = currentSegment.handleIn.__add(delta);
      currentSegment.handleOut = currentSegment.handleOut.__subtract(delta);
    }
    changePos(event.point);
  };
})();
(function() {
  window.editTool = tool = new Tool();
  tool.onActivate = activate("editTool");
  tool.onDeactivate = deactivate("editTool");

  var hitOptions = { segments: true, stroke: true, fill: true, tolerance: 5 };

  var segment, path;
  var movePath = false;
  window.editTool.onMouseDown = function onMouseDown(event) {
    segment = path = null;
    var hitResult = project.hitTest(event.point, hitOptions);
    if (!hitResult) {
      hitResult = window.timeMachineProject.hitTest(event.point, hitOptions);
    }
    if (!hitResult) {
      canvas.classList.remove("cursor-move");
      return;
    }

    path = hitResult.item;
    if (event.modifiers.shift) {
      if (hitResult.type == "segment") {
        hitResult.segment.remove();
        path.modified = true;
      }
      return;
    }

    if (hitResult.type == "segment") {
      segment = hitResult.segment;
    } else if (hitResult.type == "stroke") {
      var location = hitResult.location;
      segment = path.insert(location.index + 1, event.point);
      path.smooth();
      path.modified = true;
    }

    movePath = hitResult.type == "fill";
    if (movePath) {
      canvas.classList.add("cursor-move");
      project.activeLayer.addChild(hitResult.item);
    }
    changePos(event.point);
  };

  window.editTool.onMouseMove = function onMouseMove(event) {
    var hitResult = project.hitTest(event.point, hitOptions);
    if (!hitResult) {
      hitResult = window.timeMachineProject.hitTest(event.point, hitOptions);
    }
    window.timeMachineProject.activeLayer.selected = false;
    project.activeLayer.selected = false;
    if (hitResult && hitResult.item) {
      hitResult.item.selected = true;
      canvas.classList.add("cursor-move");
    } else {
      canvas.classList.remove("cursor-move");
    }
    changePos(event.point);
  };

  window.editTool.onMouseDrag = function onMouseDrag(event) {
    if (segment) {
      segment.point = event.point;
      path.smooth();
      path.modified = true;
    }

    if (movePath) {
      path.position = path.position.__add(event.delta);
      path.modified = true;
    }
    changePos(event.point);
  };

  window.editTool.onMouseUp = function() {
    if (!path) {
      return;
    }
    if (window.updateObject) {
      updateObject(path);
    }
    path.selected = true;
  };

  window.editTool.onKeyUp = function(event) {
    if (event.key === "delete") {
      path.visible = false;
      path.deleted = true;
      if (window.updateObject) {
        updateObject(path);
      }
    }
  };
})();
(function() {
  window.colorPickerTool = tool = new Tool();
  tool.onActivate = activate("colorPickerTool");
  tool.onDeactivate = deactivate("colorPickerTool");

  var hitOptions = { segments: true, stroke: true, fill: true, tolerance: 5 };

  window.colorPickerTool.onMouseDown = function onMouseDown(event) {
    var hitResult = project.hitTest(event.point, hitOptions);
    if (!hitResult) {
      hitResult = window.timeMachineProject.hitTest(event.point, hitOptions);
    }
    var fill = hitResult && hitResult.item.fillColor;
    var stroke = hitResult && hitResult.item.strokeColor;
    window.currentStrokeStyle.fillColor = fill;
    window.currentStrokeStyle.strokeColor = stroke || "white";
    document.dispatchEvent(new CustomEvent("setColor"));
    changePos(event.point);
  };
})();
(function() {
  var path;
  window.starTool = tool = new Tool();
  tool.onActivate = activate("starTool");
  tool.onDeactivate = deactivate("starTool");

  window.starTool.onMouseDown = function onMouseDown(event) {
    changePos(event.point);
  };

  window.starTool.onMouseDrag = function onMouseDrag(event) {
    var delta = event.point.__subtract(event.downPoint);
    var radius = delta.length;
    var points = 5 + Math.round(radius / 50);
    path = new Path.Star({
      center: event.downPoint,
      points: points,
      radius1: radius / 2,
      radius2: radius,
      fillColor: window.currentStrokeStyle.fillColor,
      strokeColor: window.currentStrokeStyle.strokeColor,
      strokeWidth: window.currentStrokeStyle.strokeWidth
    });
    path.rotate(delta.angle);
    // Remove the path automatically before the next mouse drag
    // event:
    path.removeOnDrag();
    changePos(event.point);
  };
  window.starTool.onMouseUp = function() {
    if (window.send) {
      window.send(path);
    }
  };
})();

window.paperToolsProject = paper.project;
