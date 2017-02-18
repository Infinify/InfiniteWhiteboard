var canvas = document.querySelectorAll(".canvas");
var canvas0 = canvas[0];
var canvas1 = canvas[1];
var pencil = document.getElementById("pencil");
var shapes = document.getElementById("shapes");
var textTool = document.getElementById("textTool");
var interact = document.getElementById("interact");
var svgMap = document.querySelector("svg.map");

function prepDrawMode() {
  var drawMode = pencil.classList.contains("open") ||
    shapes.classList.contains("open") ||
    textTool.classList.contains("open") ||
    interact.classList.contains("open");

  if (drawMode) {
    svgMap.classList.add("drawingMode");
  } else {
    svgMap.classList.remove("drawingMode");
  }

  return drawMode;
}

var drawToolHandler;
if (Modernizr.pointerevents) {
  canvas0.style.pointerEvents = "none";
  canvas1.style.pointerEvents = "none";
  drawToolHandler = function() {
    var drawMode = prepDrawMode();
    if (drawMode) {
      canvas0.style.pointerEvents = "auto";
      canvas1.style.pointerEvents = "auto";
    } else {
      canvas0.style.pointerEvents = "none";
      canvas1.style.pointerEvents = "none";
    }
  };
} else {
  document.body.classList.add("no-pointer-events");
  canvas0.style.display = "none";
  canvas1.style.display = "none";
  drawToolHandler = function() {
    var drawMode = prepDrawMode();
    if (drawMode) {
      canvas0.style.display = "block";
      canvas1.style.display = "block";
    } else {
      canvas0.style.display = "none";
      canvas1.style.display = "none";
    }
  };
}

module.exports = drawToolHandler;
