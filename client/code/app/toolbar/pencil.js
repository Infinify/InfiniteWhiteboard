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

colorPickedHandler(window.initColor, "stroke");

var currentFillColor = document.getElementById("currentFillColor");
var fill = tinycolorpicker(currentFillColor, { color: window.initColor });
currentFillColor.onchange = function colorPickedHandlerFill() {
  colorPickedHandler(fill.colorHex, "fill");
};

var currentStrokeColor = document.getElementById("currentStrokeColor");
var stroke = tinycolorpicker(currentStrokeColor, { color: window.initColor });
currentStrokeColor.onchange = function colorPickedHandlerFill() {
  colorPickedHandler(stroke.colorHex, "stroke");
};

var colorPickerToolButton = document.getElementById("colorPickerTool");
var drawToolButton = document.getElementById("drawTool");
var pencil = document.getElementById("pencil");
pencil.querySelector(".toolHeader").onclick = function() {
  if (pencil.classList.contains("open")) {
    nopTool.activate();
    return;
  }

  window.currentStrokeStyle.strokeWidth = pencilStrokeWidth.value;

  var color = fill.colorHex;
  window.currentStrokeStyle.fillColor = color && new paper.Color(color);

  color = stroke.colorHex;
  window.currentStrokeStyle.strokeColor = color && new paper.Color(color);

  if (
    !colorPickerToolButton.classList.contains("active") &&
      !drawToolButton.classList.contains("active")
  ) {
    window.drawTool.activate();
  }
  delete window.timestamp;
  window.timeAnimation();
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
  fillColor && fill.setColor(fillColor);
  strokeColor && stroke.setColor(strokeColor);
};

document.addEventListener("setColor", function() {
  var fillColor = currentStrokeStyle.fillColor;
  fillColor = fillColor && fillColor.toCSS ? fillColor.toCSS() : fillColor;
  var strokeColor = currentStrokeStyle.strokeColor;
  strokeColor = strokeColor && strokeColor.toCSS
    ? strokeColor.toCSS()
    : strokeColor;
  fillColor && fill.setColor(fillColor);
  strokeColor && stroke.setColor(strokeColor);
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
