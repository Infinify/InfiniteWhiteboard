function colorPickedHandler(color, which) {
  if (color) {
    window.currentStrokeStyle[which + "Color"] = new paper.Color(color);
  } else {
    delete window.currentStrokeStyle[which + "Color"];
  }
}

colorPickedHandler(window.initColor, "stroke");

var currentShapeFillColorDiv = document.getElementById("currentShapeFillColor");
var currentShapeFillColor = tinycolorpicker(currentShapeFillColorDiv);
currentShapeFillColorDiv.onchange = function colorPickedHandlerFill() {
  var color = currentShapeFillColor.colorHex;
  colorPickedHandler(color, "fill");
};

var currentShapeStrokeColorDiv = document.getElementById(
  "currentShapeStrokeColor"
);
var currentShapeStrokeColor = tinycolorpicker(currentShapeStrokeColorDiv);
currentShapeStrokeColorDiv.onchange = function colorPickedHandlerStroke() {
  var color = currentShapeStrokeColor.colorHex;
  colorPickedHandler(color, "stroke");
};
currentShapeStrokeColor.setColor(window.initColor);

var shapeStrokeWidth = document.getElementById("shapeStrokeWidth");
shapeStrokeWidth.onchange = function() {
  window.currentStrokeStyle.strokeWidth = shapeStrokeWidth.value;
};

var shapes = document.getElementById("shapes");
shapes.querySelector(".toolHeader").onclick = function() {
  if (shapes.classList.contains("open")) {
    nopTool.activate();
    return;
  }

  var currentStrokeStyle = window.currentStrokeStyle;
  currentStrokeStyle.strokeWidth = shapeStrokeWidth.value;

  var color = currentShapeFillColor.colorHex;
  currentStrokeStyle.fillColor = color ? new paper.Color(color) : undefined;

  color = currentShapeStrokeColor.colorHex;
  currentStrokeStyle.strokeColor = color && new paper.Color(color);

  delete window.timestamp;
  window.timeAnimation();
};
