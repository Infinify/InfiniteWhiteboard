var pencilStrokeWidth = document.getElementById("pencilStrokeWidth");
pencilStrokeWidth.onchange = function() {
  window.currentStrokeStyle.strokeWidth = pencilStrokeWidth.value;
};

document.getElementById("miterSelector").onchange = function(event) {
  window.pencilCap = event.currentTarget.value.toLowerCase();
};

function colorPickedHandler(color, which) {
  if (color) {
    window.currentStrokeStyle[which + "Color"] = new paper.Color(color);
  } else {
    delete window.currentStrokeStyle[which + "Color"];
  }
  document.dispatchEvent(new CustomEvent("setColor"));
}

var currentFillColor = document.getElementById("currentFillColor");
var fill = tinycolorpicker(currentFillColor);
currentFillColor.onchange = function colorPickedHandlerFill() {
  colorPickedHandler(fill.colorHex, "fill");
};

var currentStrokeColor = document.getElementById("currentStrokeColor");
var stroke = tinycolorpicker(currentStrokeColor);
currentStrokeColor.onchange = function colorPickedHandlerFill() {
  colorPickedHandler(stroke.colorHex, "stroke");
};

var palette = document.querySelector(".palette");
palette.onclick = function(event) {
  var parent = event.target.parentElement;
  var fillColor = parent.querySelector(".fill").style.backgroundColor;
  var strokeColor = parent.querySelector(".stroke").style.backgroundColor;
  currentStrokeStyle.fillColor = fillColor;
  currentStrokeStyle.strokeColor = strokeColor;
  fillColor = currentStrokeStyle.fillColor;
  fillColor = fillColor && fillColor.toCSS ? fillColor.toCSS() : fillColor;
  strokeColor = currentStrokeStyle.strokeColor;
  strokeColor = strokeColor && strokeColor.toCSS
    ? strokeColor.toCSS()
    : strokeColor;
  fill.setColor(fillColor);
  stroke.setColor(strokeColor);
};

document.addEventListener("setColor", function() {
  var fillColor = currentStrokeStyle.fillColor;
  fillColor = fillColor && fillColor.toCSS ? fillColor.toCSS() : "";
  var strokeColor = currentStrokeStyle.strokeColor;
  strokeColor = strokeColor && strokeColor.toCSS
    ? strokeColor.toCSS()
    : strokeColor;
  fill.setColor(fillColor);
  stroke.setColor(strokeColor);
  palette.insertBefore(
    htmlToElement(
      "<li>" +
        '<div class="stroke" style="background-color: ' +
        strokeColor +
        '"></div>' +
        '<div class="fill" style="background-color: ' +
        fillColor +
        '"></div>' +
        "</li>"
    ),
    palette.firstChild
  );
});

colorPickedHandler(window.initColor, "stroke");

var colorPickerClasses = document.getElementById("colorPickerTool").classList;
var drawToolClasses = document.getElementById("drawTool").classList;
var pencil = document.getElementById("pencil");
var pencilClasses = pencil.classList;
pencil.querySelector(".toolHeader").onclick = function() {
  if (pencilClasses.contains("open")) {
    nopTool.activate();
    return;
  }

  var currentStrokeStyle = window.currentStrokeStyle;
  currentStrokeStyle.strokeWidth = pencilStrokeWidth.value;

  var color = fill.colorHex;
  currentStrokeStyle.fillColor = color ? new paper.Color(color) : undefined;

  color = stroke.colorHex;
  currentStrokeStyle.strokeColor = color && new paper.Color(color);

  if (
    !colorPickerClasses.contains("active") &&
      !drawToolClasses.contains("active")
  ) {
    window.drawTool.activate();
  }
  delete window.timestamp;
  window.timeAnimation();
};
