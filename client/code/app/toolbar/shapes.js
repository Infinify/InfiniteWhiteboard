var hexToRgbA = require('./hexToRgbA.js');

function colorPickedHandler(color, which) {
  if (color) {
    window.currentStrokeStyle[which + "Color"] = new paper.Color(color);
  } else {
    delete window.currentStrokeStyle[which + "Color"];
  }
}

colorPickedHandler(hexToRgbA(window.initColor), "stroke");

var shapeFillColor = document.getElementById("shapeFillColor");
var shapeFillAlpha = document.getElementById("shapeFillAlpha");
shapeFillAlpha.onchange = shapeFillColor.onchange = function colorPickedHandlerFill() {
  colorPickedHandler(hexToRgbA(shapeFillColor.value, shapeFillAlpha.value), "fill");
};
shapeFillAlpha.oninput = function updateOpacity() {
  shapeFillColor.style.opacity = shapeFillAlpha.value;
};

var shapeStrokeColor = document.getElementById("shapeStrokeColor");
var shapeStrokeAlpha = document.getElementById("shapeStrokeAlpha");
shapeStrokeAlpha.onchange = shapeStrokeColor.onchange = function colorPickedHandlerStroke() {
  colorPickedHandler(hexToRgbA(shapeStrokeColor.value, shapeStrokeAlpha.value), "stroke");
};
shapeStrokeAlpha.oninput = function updateOpacity() {
  shapeStrokeColor.style.opacity = shapeStrokeAlpha.value;
};
shapeStrokeColor.value = window.initColor;

var shapeStrokeWidth = document.getElementById("shapeStrokeWidth");
var shapeStrokeWidthValue = document.getElementById("shapeStrokeWidthValue");
shapeStrokeWidth.oninput = function() {
  var value = shapeStrokeWidth.value;
  window.currentStrokeStyle.strokeWidth = value;
  shapeStrokeWidthValue.textContent = value;
};

var shapes = document.getElementById("shapes");
shapes.querySelector(".toolHeader").onclick = function() {
  if (shapes.classList.contains("open")) {
    nopTool.activate();
    return;
  }

  var currentStrokeStyle = window.currentStrokeStyle;
  currentStrokeStyle.strokeWidth = shapeStrokeWidth.value;
  
  currentStrokeStyle.fillColor = color ? new paper.Color(hexToRgbA(shapeFillColor.value, shapeFillAlpha.value)) : undefined;

  currentStrokeStyle.strokeColor = shapeStrokeColor.value && new paper.Color(hexToRgbA(shapeStrokeColor.value, shapeStrokeAlpha.value));

  delete window.timestamp;
  window.timeAnimation();
};
